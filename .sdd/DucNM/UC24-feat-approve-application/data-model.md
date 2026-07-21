# Data Model: Approve Application (UC24)

**Branch**: `024-feat-approve-application` | **Date**: 2026-06-29 | **Phase**: 1 (Design)

**Purpose**: Define database schema changes, state transitions, and data integrity rules for approval workflow.

---

## Overview

UC24 requires 2 database schema updates:
1. **Application table**: Add `approved_at` timestamp and verify `processed_by_staff_id` exists
2. **EmailQueue table**: NEW table for transactional outbox pattern (from RQ1 decision)

No changes to Event, User, or Organization tables.

---

## Schema Changes

### 1. Application Table (UPDATE)

**Current Schema** (from UC22/UC23):
```prisma
model Application {
  id                    String   @id @default(uuid())
  event_id              String
  volunteer_id          String
  status                String   // 'SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED'
  motivation            String?  @db.Text
  availability          String?  @db.Text
  processed_by_staff_id String?  // Already exists (added in UC23)
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  
  // Relations
  event                 Event    @relation(fields: [event_id], references: [id])
  volunteer             User     @relation("VolunteerApplications", fields: [volunteer_id], references: [id])
  processedByStaff      User?    @relation("StaffProcessedApplications", fields: [processed_by_staff_id], references: [id])
  
  @@index([event_id])
  @@index([volunteer_id])
  @@index([status])
  @@unique([event_id, volunteer_id]) // One application per volunteer per event
}
```

**Required Change**: Add `approved_at` field
```prisma
model Application {
  id                    String    @id @default(uuid())
  event_id              String
  volunteer_id          String
  status                String    // 'SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED'
  motivation            String?   @db.Text
  availability          String?   @db.Text
  processed_by_staff_id String?
  approved_at           DateTime? // NEW: Timestamp when status → APPROVED
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt
  
  // Relations
  event                 Event     @relation(fields: [event_id], references: [id])
  volunteer             User      @relation("VolunteerApplications", fields: [volunteer_id], references: [id])
  processedByStaff      User?     @relation("StaffProcessedApplications", fields: [processed_by_staff_id], references: [id])
  
  @@index([event_id])
  @@index([volunteer_id])
  @@index([status])
  @@index([approved_at]) // NEW: For attendance queries (UC45 dependency)
  @@unique([event_id, volunteer_id])
}
```

**Migration SQL**:
```sql
-- Add approved_at column (nullable for backward compatibility)
ALTER TABLE applications 
ADD COLUMN approved_at DATETIME NULL 
AFTER processed_by_staff_id;

-- Create index for attendance queries
CREATE INDEX idx_applications_approved_at ON applications(approved_at);

-- Backfill approved_at for existing APPROVED applications (use updated_at as fallback)
UPDATE applications 
SET approved_at = updated_at 
WHERE status = 'APPROVED' AND approved_at IS NULL;
```

**Field Specifications**:
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `approved_at` | DateTime | YES | NULL | Timestamp when application was approved. Set when status transitions to APPROVED. NULL for non-approved applications. |

**Data Integrity Rules**:
1. `approved_at` MUST be NULL if `status != 'APPROVED'`
2. `approved_at` MUST NOT be NULL if `status = 'APPROVED'` (enforced in Service layer)
3. `approved_at` MUST be >= `created_at` (chronological order)
4. Once set, `approved_at` should NOT change even if status changes later (audit trail)

---

### 2. EmailQueue Table (NEW)

**Purpose**: Transactional outbox pattern for async email delivery (RQ1 decision).

**Schema**:
```prisma
model EmailQueue {
  id              String    @id @default(uuid())
  type            String    // Email type: 'APPROVAL_NOTIFICATION', 'REJECTION_NOTIFICATION', etc.
  recipient_id    String    // User ID (volunteer_id from Application)
  application_id  String    // Application ID that triggered email
  status          String    @default("PENDING") // 'PENDING', 'SENT', 'FAILED'
  retry_count     Int       @default(0)
  last_error      String?   @db.Text // Error message if status='FAILED'
  created_at      DateTime  @default(now())
  sent_at         DateTime? // Timestamp when email successfully sent
  
  // Relations
  recipient       User        @relation("EmailRecipient", fields: [recipient_id], references: [id])
  application     Application @relation(fields: [application_id], references: [id])
  
  @@index([status, retry_count]) // Worker query: WHERE status='PENDING' AND retry_count < 3
  @@index([created_at]) // Monitoring: Find stuck emails
  @@index([application_id]) // Lookup: Has email been sent for this application?
}
```

**Migration SQL**:
```sql
-- Create email_queue table
CREATE TABLE email_queue (
  id VARCHAR(36) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  recipient_id VARCHAR(36) NOT NULL,
  application_id VARCHAR(36) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING' NOT NULL,
  retry_count INT DEFAULT 0 NOT NULL,
  last_error TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  sent_at DATETIME NULL,
  
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_email_queue_status_retry ON email_queue(status, retry_count);
CREATE INDEX idx_email_queue_created_at ON email_queue(created_at);
CREATE INDEX idx_email_queue_application_id ON email_queue(application_id);
```

**Field Specifications**:
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `type` | String(50) | NO | - | Email template type. Enum: 'APPROVAL_NOTIFICATION', 'REJECTION_NOTIFICATION' |
| `recipient_id` | UUID | NO | - | Volunteer who will receive email |
| `application_id` | UUID | NO | - | Application that triggered email |
| `status` | String(20) | NO | 'PENDING' | Email delivery status. Enum: 'PENDING', 'SENT', 'FAILED' |
| `retry_count` | Int | NO | 0 | Number of send attempts. Max 3 retries. |
| `last_error` | Text | YES | NULL | Error message from last failed attempt |
| `sent_at` | DateTime | YES | NULL | Timestamp when status → SENT |

**Data Integrity Rules**:
1. `status='SENT'` ⇒ `sent_at` MUST NOT be NULL
2. `status='FAILED'` ⇒ `last_error` SHOULD NOT be NULL
3. `retry_count` MUST be <= 3 (worker stops retrying after 3 failures)
4. `sent_at` MUST be >= `created_at` (chronological order)
5. One email job per application approval (enforced in Service transaction)

---

## State Transition Rules

### Application Status Transitions

**Valid Transitions for UC24**:
```
SUBMITTED → APPROVED  ✅ (Staff approve from submitted state)
REVIEWED → APPROVED   ✅ (Staff approve after review)
APPROVED → APPROVED   ✅ (Idempotent - no-op, return success)
REJECTED → APPROVED   ❌ (Cannot approve rejected application)
```

**Enforcement**:
```javascript
// In application.service.js
const VALID_APPROVE_STATES = ['SUBMITTED', 'REVIEWED'];

// Prisma updateMany with WHERE clause (RQ4 decision)
await prisma.application.updateMany({
  where: {
    id: applicationId,
    status: { in: VALID_APPROVE_STATES } // Only update if in valid state
  },
  data: {
    status: 'APPROVED',
    approved_at: new Date(),
    processed_by_staff_id: staffId
  }
});
```

**State Machine Diagram**:
```
┌─────────────┐
│  SUBMITTED  │──────┐
└─────────────┘      │
                     │ Staff click "Approve"
┌─────────────┐      │ (UC24 single approve)
│  REVIEWED   │──────┤
└─────────────┘      │
                     ↓
                ┌─────────────┐
                │  APPROVED   │ (Terminal state for UC24)
                └─────────────┘
                     │
                     ↓
                [Attendance Check UC45]
```

**Rejected State Handling**:
- UC24 does NOT handle REJECTED state (separate UC26 feature)
- Attempting to approve REJECTED application → 400 Bad Request "Invalid state transition"

---

### EmailQueue Status Transitions

**Valid Transitions**:
```
PENDING → SENT     ✅ (Worker successfully sent email)
PENDING → FAILED   ✅ (Worker failed after 3 retries)
SENT → SENT        ✅ (Idempotent - no-op)
FAILED → SENT      ❌ (Once failed, stays failed - manual intervention needed)
```

**Worker Logic**:
```javascript
// In src/workers/email-worker.js
cron.schedule('*/10 * * * * *', async () => {
  const jobs = await prisma.emailQueue.findMany({
    where: {
      status: 'PENDING',
      retry_count: { lt: 3 } // Max 3 retries
    },
    take: 50
  });
  
  for (const job of jobs) {
    try {
      await sendEmailViaUC64(job);
      
      // Transition: PENDING → SENT
      await prisma.emailQueue.update({
        where: { id: job.id },
        data: {
          status: 'SENT',
          sent_at: new Date()
        }
      });
    } catch (error) {
      const newRetryCount = job.retry_count + 1;
      const newStatus = newRetryCount >= 3 ? 'FAILED' : 'PENDING';
      
      // Transition: PENDING → PENDING (increment retry) or PENDING → FAILED
      await prisma.emailQueue.update({
        where: { id: job.id },
        data: {
          status: newStatus,
          retry_count: newRetryCount,
          last_error: error.message
        }
      });
    }
  }
});
```

---

## Capacity Calculation

**Business Rule** (from RQ2 decision): `approved_count <= max_capacity * 1.2`

**Query Pattern**:
```javascript
// In application.service.js - approveApplication()
async function checkCapacity(eventId) {
  // Count current approved applications
  const approvedCount = await prisma.application.count({
    where: {
      event_id: eventId,
      status: 'APPROVED'
    }
  });
  
  // Get event max_capacity
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { max_capacity: true }
  });
  
  const hardLimit = Math.floor(event.max_capacity * 1.2);
  const isOverCapacity = approvedCount >= event.max_capacity;
  const isAtHardLimit = approvedCount >= hardLimit;
  
  return {
    current: approvedCount,
    max: event.max_capacity,
    hardLimit,
    isOverCapacity,
    isAtHardLimit
  };
}
```

**Performance Optimization**:
- `COUNT(*)` query with indexed `status` field → O(log N) with B-tree index
- Cache event.max_capacity in memory (rarely changes)
- For bulk approve: Single capacity check before loop (not per-application)

---

## Audit Logging

**Audit Event Structure**:
```javascript
// In application.service.js - after successful approve
await auditLogger.log({
  action: 'APPROVE_APPLICATION',
  actor_id: staffId,
  actor_role: 'STAFF',
  resource_type: 'APPLICATION',
  resource_id: applicationId,
  metadata: {
    event_id: application.event_id,
    volunteer_id: application.volunteer_id,
    old_status: oldStatus, // 'SUBMITTED' or 'REVIEWED'
    new_status: 'APPROVED',
    capacity_status: {
      approved_count: capacityCheck.current,
      max_capacity: capacityCheck.max,
      is_over_capacity: capacityCheck.isOverCapacity
    }
  },
  timestamp: new Date()
});
```

**Audit Table** (if using dedicated audit log):
```prisma
model AuditLog {
  id            String   @id @default(uuid())
  action        String   // 'APPROVE_APPLICATION', 'REJECT_APPLICATION', etc.
  actor_id      String   // Staff user ID
  actor_role    String   // 'STAFF', 'ADMIN', etc.
  resource_type String   // 'APPLICATION', 'EVENT', etc.
  resource_id   String   // Application ID
  metadata      Json     // Flexible JSON for additional context
  created_at    DateTime @default(now())
  
  @@index([action])
  @@index([actor_id])
  @@index([resource_type, resource_id])
  @@index([created_at])
}
```

**Privacy Compliance** (FR-016):
- ❌ DO NOT log volunteer personal data (name, email, phone)
- ✅ DO log IDs only (volunteer_id, application_id)
- ✅ DO log capacity metrics (anonymous aggregate data)

---

## Database Indexes

**Existing Indexes** (from UC22/UC23):
- `applications(event_id)` - Filter by event
- `applications(volunteer_id)` - Filter by volunteer
- `applications(status)` - Filter by status (CRITICAL for approve queries)

**New Indexes for UC24**:
- `applications(approved_at)` - For attendance queries (UC45)
- `email_queue(status, retry_count)` - Worker query optimization
- `email_queue(created_at)` - Monitoring stuck emails
- `email_queue(application_id)` - Lookup email status per application

**Index Performance**:
| Query Pattern | Index Used | Est. Performance |
|--------------|------------|------------------|
| `WHERE status IN ('SUBMITTED', 'REVIEWED')` | `idx_applications_status` | <10ms for 10K rows |
| `COUNT(*) WHERE event_id=? AND status='APPROVED'` | `idx_applications_event_id` + `idx_applications_status` | <5ms |
| `WHERE status='PENDING' AND retry_count<3` | `idx_email_queue_status_retry` | <5ms |

---

## Data Migration Checklist

- [ ] Add `approved_at` column to `applications` table
- [ ] Create index on `applications(approved_at)`
- [ ] Backfill `approved_at` for existing APPROVED applications
- [ ] Create `email_queue` table with all fields
- [ ] Create indexes on `email_queue(status, retry_count)`, `created_at`, `application_id`
- [ ] Update Prisma schema file
- [ ] Generate Prisma Client (`npx prisma generate`)
- [ ] Run migration (`npx prisma migrate dev --name add-approval-fields`)
- [ ] Verify foreign key constraints
- [ ] Test rollback scenario (optional but recommended)

---

## Rollback Plan

If UC24 deployment fails, rollback steps:

1. **Stop email worker**: Kill cron process to prevent sending emails
2. **Revert Application status**: 
   ```sql
   UPDATE applications 
   SET status='SUBMITTED', approved_at=NULL 
   WHERE status='APPROVED' AND approved_at > '2026-06-29 23:00:00'; -- UC24 deploy time
   ```
3. **Delete email jobs**:
   ```sql
   DELETE FROM email_queue WHERE created_at > '2026-06-29 23:00:00';
   ```
4. **Drop new table** (if needed):
   ```sql
   DROP TABLE email_queue;
   ```
5. **Remove approved_at column** (if needed):
   ```sql
   ALTER TABLE applications DROP COLUMN approved_at;
   ```

**Data Loss Risk**: Minimal - only approval actions during deployment window affected.

---

## Cross-Module Dependencies

### Downstream (who reads this data)
- **UC45 (Attendance Check)**: Reads `applications WHERE status='APPROVED' AND approved_at IS NOT NULL`
- **UC64 (Email Service)**: Reads `email_queue WHERE status='PENDING'`
- **UC46 (Certificate Generation)**: Reads approved applications for certificate eligibility

### Upstream (who writes this data)
- **UC24 (this feature)**: Writes `approved_at`, creates `email_queue` jobs
- **UC26 (Reject Application)**: DOES NOT touch `approved_at` (separate workflow)

---

**End of Data Model Document** — Ready to proceed with contracts/ generation.

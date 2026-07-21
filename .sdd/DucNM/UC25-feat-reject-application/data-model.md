# Data Model: Reject Application (UC25)

**Branch**: `025-feat-reject-application` | **Date**: 2026-06-29 | **Phase**: 1 (Design)

**Purpose**: Define database schema changes, state transitions, and data integrity rules for rejection workflow.

---

## Overview

UC25 requires 1 database schema update:
1. **Application table**: Add `rejected_at` timestamp and `rejection_reason` text field

**Key Difference from UC24**: UC25 REUSES existing `email_queue` table (no new table needed). Email worker already supports multiple email types from RQ2 decision.

---

## Schema Changes

### 1. Application Table (UPDATE)

**Current Schema** (after UC24):
```prisma
model Application {
  id                    String    @id @default(uuid())
  event_id              String
  volunteer_id          String
  status                String    // 'SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED'
  motivation            String?   @db.Text
  availability          String?   @db.Text
  processed_by_staff_id String?
  approved_at           DateTime? // Added in UC24
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt
  
  // Relations
  event                 Event     @relation(fields: [event_id], references: [id])
  volunteer             User      @relation("VolunteerApplications", fields: [volunteer_id], references: [id])
  processedByStaff      User?     @relation("StaffProcessedApplications", fields: [processed_by_staff_id], references: [id])
  
  @@index([event_id])
  @@index([volunteer_id])
  @@index([status])
  @@index([approved_at])
  @@unique([event_id, volunteer_id])
}
```

**Required Changes**: Add `rejected_at` and `rejection_reason` fields
```prisma
model Application {
  id                    String    @id @default(uuid())
  event_id              String
  volunteer_id          String
  status                String    // 'SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED'
  motivation            String?   @db.Text
  availability          String?   @db.Text
  processed_by_staff_id String?
  approved_at           DateTime? // UC24
  rejected_at           DateTime? // NEW (UC25): Timestamp when status → REJECTED
  rejection_reason      String?   @db.VarChar(500) // NEW (UC25): Optional rejection reason
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt
  
  // Relations
  event                 Event     @relation(fields: [event_id], references: [id])
  volunteer             User      @relation("VolunteerApplications", fields: [volunteer_id], references: [id])
  processedByStaff      User?     @relation("StaffProcessedApplications", fields: [processed_by_staff_id], references: [id])
  
  @@index([event_id])
  @@index([volunteer_id])
  @@index([status])
  @@index([approved_at])
  @@index([rejected_at]) // NEW: For analytics queries
  @@unique([event_id, volunteer_id])
}
```

**Migration SQL**:
```sql
-- Add rejected_at column (nullable for backward compatibility)
ALTER TABLE applications 
ADD COLUMN rejected_at DATETIME NULL 
AFTER approved_at;

-- Add rejection_reason column (nullable, max 500 chars per RQ1 decision)
ALTER TABLE applications 
ADD COLUMN rejection_reason VARCHAR(500) NULL 
AFTER rejected_at;

-- Create index for analytics queries (rejection rate over time)
CREATE INDEX idx_applications_rejected_at ON applications(rejected_at);

-- Backfill rejected_at for existing REJECTED applications (use updated_at as fallback)
UPDATE applications 
SET rejected_at = updated_at 
WHERE status = 'REJECTED' AND rejected_at IS NULL;
```

**Field Specifications**:
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `rejected_at` | DateTime | YES | NULL | Timestamp when application was rejected. Set when status transitions to REJECTED. NULL for non-rejected applications. |
| `rejection_reason` | VarChar(500) | YES | NULL | Optional explanation for rejection (RQ1 decision: Optional, max 500 chars). Provided by Staff via dropdown templates or custom text. |

**Data Integrity Rules**:
1. `rejected_at` MUST be NULL if `status != 'REJECTED'`
2. `rejected_at` MUST NOT be NULL if `status = 'REJECTED'` (enforced in Service layer)
3. `rejected_at` MUST be >= `created_at` (chronological order)
4. `rejection_reason` MAY be NULL even if `status = 'REJECTED'` (optional per RQ1)
5. `rejection_reason` length MUST be <= 500 chars (validated by Zod schema)
6. Once set, `rejected_at` should NOT change even if status changes later (audit trail)

---

### 2. EmailQueue Table (REUSE - No Changes)

**From UC24**: EmailQueue table already exists with `type` field that supports multiple email types.

**UC25 Usage**: Add new email type 'REJECTION_NOTIFICATION' to existing worker logic (RQ2 decision).

**No Schema Changes Required** - just extend worker switch statement:
```javascript
// src/workers/email.worker.js - ALREADY EXISTS, just add new case
switch (job.type) {
  case 'APPROVAL_NOTIFICATION':
    await sendApprovalEmail(job);
    break;
  
  case 'REJECTION_NOTIFICATION': // NEW case for UC25
    await sendRejectionEmail(job);
    break;
  
  default:
    throw new Error(`Unknown email type: ${job.type}`);
}
```

**Existing EmailQueue Schema** (for reference):
```prisma
model EmailQueue {
  id              String    @id @default(uuid())
  type            String    // 'APPROVAL_NOTIFICATION' | 'REJECTION_NOTIFICATION' (UC25 adds this)
  recipient_id    String
  application_id  String
  status          String    @default("PENDING") // 'PENDING', 'SENT', 'FAILED'
  retry_count     Int       @default(0)
  last_error      String?   @db.Text
  created_at      DateTime  @default(now())
  sent_at         DateTime?
  
  // Relations & Indexes - unchanged
  @@index([status, retry_count])
  @@index([created_at])
  @@index([application_id])
}
```

---

## State Transition Rules

### Application Status Transitions

**Valid Transitions for UC25**:
```
SUBMITTED → REJECTED  ✅ (Staff reject from submitted state)
REVIEWED → REJECTED   ✅ (Staff reject after review)
REJECTED → REJECTED   ✅ (Idempotent - no-op, return success)
APPROVED → REJECTED   ❌ (Cannot reject approved application - use UC26 Cancel instead)
```

**Enforcement**:
```javascript
// In application.service.js
const VALID_REJECT_STATES = ['SUBMITTED', 'REVIEWED'];

// Prisma updateMany with WHERE clause (mirrors UC24 pattern from RQ4 decision)
await prisma.application.updateMany({
  where: {
    id: applicationId,
    status: { in: VALID_REJECT_STATES } // Only update if in valid state
  },
  data: {
    status: 'REJECTED',
    rejected_at: new Date(),
    rejection_reason: rejectionReason, // nullable
    processed_by_staff_id: staffId
  }
});
```

**State Machine Diagram**:
```
┌─────────────┐
│  SUBMITTED  │──────┐
└─────────────┘      │
                     │ Staff click "Reject"
┌─────────────┐      │ (UC25 single reject)
│  REVIEWED   │──────┤
└─────────────┘      │
                     ↓
                ┌─────────────┐
                │  REJECTED   │ (Terminal state for UC25)
                └─────────────┘
                     │
                     ↓
                [No further actions - Volunteer can apply again to different events]
```

**State Transition Matrix** (Complete):

| From State | To State | UC | Valid? | Notes |
|-----------|----------|-----|--------|-------|
| SUBMITTED | APPROVED | UC24 | ✅ | Staff approve |
| SUBMITTED | REJECTED | UC25 | ✅ | Staff reject |
| REVIEWED | APPROVED | UC24 | ✅ | Staff approve after review |
| REVIEWED | REJECTED | UC25 | ✅ | Staff reject after review |
| APPROVED | REJECTED | UC26 | ❌ | Use Cancel workflow instead |
| REJECTED | APPROVED | Future | ❌ | Volunteer must reapply |
| REJECTED | REJECTED | UC25 | ✅ | Idempotent (no-op) |
| APPROVED | APPROVED | UC24 | ✅ | Idempotent (no-op) |

**Critical Business Rule**: 
- Once APPROVED, application cannot transition to REJECTED via UC25
- Use separate "Cancel Approved Application" workflow (future UC26) if needed
- Rationale: Approved applications may already have attendance records, certificates, etc.

---

### EmailQueue Status Transitions (Reuse UC24)

**No Changes** - UC25 reuses existing email worker state machine:

```
PENDING → SENT     ✅ (Worker successfully sent email)
PENDING → FAILED   ✅ (Worker failed after 3 retries)
SENT → SENT        ✅ (Idempotent - no-op)
FAILED → SENT      ❌ (Once failed, stays failed - manual intervention needed)
```

Worker treats 'REJECTION_NOTIFICATION' emails same as 'APPROVAL_NOTIFICATION' emails (same retry policy, same timeout).

---

## Rejection Reason Validation

**From RQ1 Decision**: rejection_reason is OPTIONAL, max 500 chars.

**Validation Rules**:
```javascript
// Zod schema - application.validator.js
const rejectSchema = z.object({
  rejection_reason: z.string().max(500).optional()
});

// OR using Zod's built-in nullish (handles null, undefined, empty string)
const rejectSchema = z.object({
  rejection_reason: z.string().max(500).nullish()
});
```

**Common Rejection Reason Templates** (from RQ4 decision):
```javascript
// src/constants/rejection-reasons.js
export const REJECTION_REASON_TEMPLATES = [
  { value: 'insufficient_experience', label: 'Hồ sơ chưa đủ kinh nghiệm' },
  { value: 'skill_mismatch', label: 'Không đáp ứng yêu cầu kỹ năng' },
  { value: 'capacity_reached', label: 'Số lượng tình nguyện viên đã đủ' },
  { value: 'schedule_conflict', label: 'Thời gian không phù hợp' },
  { value: 'incomplete_application', label: 'Hồ sơ không đầy đủ' },
  { value: 'general_mismatch', label: 'Không phù hợp với yêu cầu sự kiện' }
];
```

**Database Storage**:
- Templates stored as full text (not enum values): "Hồ sơ chưa đủ kinh nghiệm"
- Custom reasons also stored as-is: "Candidate has conflicting event on same day"
- Rationale: Flexibility for analytics, no need to maintain enum mapping

---

## Audit Logging

**Audit Event Structure**:
```javascript
// In application.service.js - after successful reject
await auditLogger.log({
  action: 'REJECT_APPLICATION',
  actor_id: staffId,
  actor_role: 'STAFF',
  resource_type: 'APPLICATION',
  resource_id: applicationId,
  metadata: {
    event_id: application.event_id,
    volunteer_id: application.volunteer_id,
    old_status: oldStatus, // 'SUBMITTED' or 'REVIEWED'
    new_status: 'REJECTED',
    rejection_reason: rejectionReason, // nullable
    has_rejection_reason: !!rejectionReason // Boolean flag for analytics
  },
  timestamp: new Date()
});
```

**Bulk Reject Audit Pattern** (RQ3 decision):
```javascript
// Log ONCE per bulk operation, then individual logs per application
await auditLogger.log({
  action: 'BULK_REJECT_INITIATED',
  actor_id: staffId,
  metadata: {
    application_ids: applicationIds,
    total_count: applicationIds.length,
    rejection_reason: rejectionReason // Applied to all
  }
});

// Then individual logs per successful reject
for (const result of successfulRejects) {
  await auditLogger.log({
    action: 'REJECT_APPLICATION',
    // ... individual application details
  });
}
```

**Privacy Compliance** (FR-016):
- ❌ DO NOT log volunteer personal data (name, email, phone)
- ✅ DO log IDs only (volunteer_id, application_id)
- ✅ DO log rejection_reason (it's not PII, it's Staff's decision rationale)

---

## Database Indexes

**Existing Indexes** (from UC22/UC23/UC24):
- `applications(event_id)` - Filter by event
- `applications(volunteer_id)` - Filter by volunteer
- `applications(status)` - Filter by status (CRITICAL for reject queries)
- `applications(approved_at)` - UC24 attendance queries

**New Index for UC25**:
- `applications(rejected_at)` - For analytics queries (rejection rate over time, rejection trends)

**Index Performance**:
| Query Pattern | Index Used | Est. Performance |
|--------------|------------|------------------|
| `WHERE status IN ('SUBMITTED', 'REVIEWED')` | `idx_applications_status` | <10ms for 10K rows |
| `WHERE status='REJECTED' AND rejected_at >= ?` | `idx_applications_status` + `idx_applications_rejected_at` | <5ms |
| `WHERE rejected_at BETWEEN ? AND ?` | `idx_applications_rejected_at` | <10ms (analytics query) |

**No New Indexes on EmailQueue** - UC25 reuses existing indexes from UC24.

---

## Data Migration Checklist

- [ ] Add `rejected_at` column to `applications` table
- [ ] Add `rejection_reason` column to `applications` table
- [ ] Create index on `applications(rejected_at)`
- [ ] Backfill `rejected_at` for existing REJECTED applications (if any)
- [ ] Update Prisma schema file
- [ ] Generate Prisma Client (`npx prisma generate`)
- [ ] Run migration (`npx prisma migrate dev --name add-rejection-fields`)
- [ ] Verify column constraints (nullable, max length)
- [ ] **No changes to email_queue table** (reuse UC24 infrastructure)
- [ ] Update email worker to support 'REJECTION_NOTIFICATION' type (code change only, no migration)

---

## Rollback Plan

If UC25 deployment fails, rollback steps:

1. **Revert Application status**: 
   ```sql
   UPDATE applications 
   SET status='SUBMITTED', rejected_at=NULL, rejection_reason=NULL 
   WHERE status='REJECTED' AND rejected_at > '2026-06-29 23:00:00'; -- UC25 deploy time
   ```

2. **Delete rejection email jobs**:
   ```sql
   DELETE FROM email_queue 
   WHERE type='REJECTION_NOTIFICATION' AND created_at > '2026-06-29 23:00:00';
   ```

3. **Remove new columns** (if needed - NOT RECOMMENDED, breaks backward compatibility):
   ```sql
   ALTER TABLE applications DROP COLUMN rejected_at;
   ALTER TABLE applications DROP COLUMN rejection_reason;
   DROP INDEX idx_applications_rejected_at ON applications;
   ```

**Data Loss Risk**: Minimal - only rejection actions during deployment window affected. Email worker rollback not needed (it just ignores 'REJECTION_NOTIFICATION' type if worker code reverted).

---

## Cross-Module Dependencies

### Downstream (who reads this data)
- **UC22 (Application List)**: Displays rejected applications with visual distinction (red badge, "Rejected" status)
- **UC23 (Application Detail)**: Shows `rejected_at` timestamp and `rejection_reason` (if provided)
- **UC64 (Email Service)**: Reads `email_queue WHERE type='REJECTION_NOTIFICATION'` (via UC24 worker)
- **Analytics Dashboard** (future): Queries `rejected_at` for rejection trends, conversion funnels

### Upstream (who writes this data)
- **UC25 (this feature)**: Writes `rejected_at`, `rejection_reason`, creates `email_queue` jobs with type='REJECTION_NOTIFICATION'
- **UC24 (Approve Application)**: DOES NOT touch `rejected_at` or `rejection_reason` (separate workflow)

### Conflicts (data consistency)
- **UC24 vs UC25**: Mutually exclusive state transitions (cannot approve AND reject same application)
- **Enforcement**: Status-based idempotency (RQ4 decision) prevents race conditions
  ```javascript
  // UC24 approveApplication: WHERE status IN ['SUBMITTED', 'REVIEWED']
  // UC25 rejectApplication:  WHERE status IN ['SUBMITTED', 'REVIEWED']
  // Both cannot succeed on same application (first wins, second fails WHERE clause)
  ```

---

## Performance Considerations

**Bulk Reject Performance** (RQ3 decision):
- 50 applications × ~250ms per reject = ~12.5s total
- Multiple independent transactions (no single long lock)
- Acceptable for Staff workflow (bulk reject is less common than bulk approve)

**Query Performance**:
- Reject queries use same indexes as approve queries (status index)
- No performance degradation from adding nullable columns
- VARCHAR(500) adds negligible storage overhead (~10KB for 10K rejected applications)

**Email Worker Performance**:
- No performance impact (worker already handles email queue polling)
- 'REJECTION_NOTIFICATION' processed at same rate as 'APPROVAL_NOTIFICATION'
- Worker can handle ~300 emails per minute (50 emails per 10s batch × 6 batches/minute)

---

## Analytics Queries (Optional - for future use)

**Rejection Rate by Event**:
```sql
SELECT 
  e.name,
  COUNT(*) as total_applications,
  SUM(CASE WHEN a.status='REJECTED' THEN 1 ELSE 0 END) as rejected_count,
  ROUND(100.0 * SUM(CASE WHEN a.status='REJECTED' THEN 1 ELSE 0 END) / COUNT(*), 2) as rejection_rate_pct
FROM applications a
JOIN events e ON a.event_id = e.id
GROUP BY e.id
HAVING rejection_rate_pct > 50 -- Events with high rejection rate
ORDER BY rejection_rate_pct DESC;
```

**Top Rejection Reasons**:
```sql
SELECT 
  rejection_reason,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM applications WHERE status='REJECTED' AND rejection_reason IS NOT NULL), 2) as percentage
FROM applications
WHERE status='REJECTED' AND rejection_reason IS NOT NULL
GROUP BY rejection_reason
ORDER BY count DESC
LIMIT 10;
```

**Rejection Trends Over Time**:
```sql
SELECT 
  DATE(rejected_at) as date,
  COUNT(*) as rejections_per_day
FROM applications
WHERE status='REJECTED' AND rejected_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(rejected_at)
ORDER BY date;
```

---

**End of Data Model Document** — Ready to proceed with contracts/ generation.

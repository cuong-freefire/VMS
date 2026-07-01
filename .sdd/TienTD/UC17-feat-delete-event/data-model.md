# Phase 1 Design: Data Model — Delete Event (UC17)

**Date**: 2026-06-29  
**Feature**: Delete Event  
**Branch**: `017-feat-delete-event`

**Objective**: Define data structures, validation rules, and soft delete implementation for event deletion workflow.

---

## 1. Core Entities

### 1.1 Event (EXISTING — Extended)

**Table**: `events`  
**Owner**: Member 3 - TienTD  
**Purpose**: Sự kiện tình nguyện với soft delete capability

**Updated Fields** (UC17 adds `deleted_at`):

```sql
-- Existing columns (from UC15/UC16)
id INT PRIMARY KEY AUTO_INCREMENT,
title VARCHAR(500) NOT NULL,
description TEXT NOT NULL,
location VARCHAR(500) NOT NULL,
start_date DATETIME NOT NULL,
end_date DATETIME NOT NULL,
application_deadline DATETIME NOT NULL,
max_capacity INT NOT NULL CHECK (max_capacity > 0),
approved_participants INT DEFAULT 0 NOT NULL,
image_url VARCHAR(500) NULL,
organization_id INT NOT NULL FOREIGN KEY → organizations.id,
category_id INT NOT NULL FOREIGN KEY → event_categories.id,
created_by INT NOT NULL FOREIGN KEY → users.id,
updated_by INT NULL FOREIGN KEY → users.id,
status ENUM('DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'DRAFT',
is_active BOOLEAN DEFAULT TRUE NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

-- NEW for UC17
deleted_at TIMESTAMP NULL DEFAULT NULL -- Soft delete timestamp
```

**Indexes** (existing + new):
- PRIMARY KEY (id)
- INDEX (organization_id, status, is_active)
- INDEX (created_by)
- **NEW**: INDEX idx_events_deleted_at (deleted_at)
- **NEW**: INDEX idx_events_active_lookup (organization_id, status, deleted_at)

**Business Rules** (UC17-specific):

1. **Soft Delete Only**: Set `deleted_at = NOW()`, NEVER hard delete (ADR-005)
2. **Immutable Fields During Delete**: `id`, `organization_id`, `created_by`, `created_at` remain unchanged
3. **Status-Based Delete Rules**:
   - DRAFT: Can delete (no confirmation needed)
   - PUBLISHED: Can delete if no applications (double confirmation required - FR-003)
   - IN_PROGRESS/COMPLETED: Cannot delete (block with 409 error)
   - CANCELLED: Can delete if no applications (edge case cleanup)
4. **Application Constraint**: Cannot delete if `application_count > 0` (FR-002)
5. **Query Filter Update**: ALL existing queries MUST add `deleted_at IS NULL` to exclude soft-deleted events

---

### 1.2 Event Audit Log (EXISTING from UC16)

**Table**: `event_audit_log`  
**Owner**: Member 3 - TienTD  
**Purpose**: Track deletion events for audit compliance

**UC17 Usage**:

Log deletion action with:
- `field_name` = 'deleted_at'
- `old_value` = NULL
- `new_value` = ISO timestamp of deletion
- `changed_by` = Staff user_id who performed deletion

**Example Entry**:

```sql
INSERT INTO event_audit_log (
  event_id, 
  changed_by, 
  field_name, 
  old_value, 
  new_value,
  changed_at
) VALUES (
  123,
  10,
  'deleted_at',
  NULL,
  '2026-06-29T15:30:00.000Z',
  CURRENT_TIMESTAMP
);
```

---

### 1.3 Volunteer Applications (EXISTING — Constraint)

**Table**: `volunteer_applications`  
**Owner**: Member 2 - TuanNA  
**Purpose**: Applications block event deletion

**Schema** (relevant fields):

```sql
CREATE TABLE volunteer_applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE RESTRICT,
  INDEX idx_applications_event (event_id)
);
```

**Business Rule**:

```javascript
// ANY application status blocks deletion
const appCount = await prisma.volunteer_applications.count({
  where: { event_id: eventId }
});

if (appCount > 0) {
  throw new ConflictError(
    `Cannot delete event with existing applications. ` +
    `Found ${appCount} application(s). Please cancel the event instead.`
  );
}
```

---

## 2. State Transition Rules

### 2.1 Status-Based Delete Permission Matrix

**State Machine** (from DATABASE.md):

```text
DRAFT → PUBLISHED → IN_PROGRESS → COMPLETED
  ↓         ↓            ↓
CANCELLED   CANCELLED    (no transition)
```

**Delete Permissions by Status**:

| Status | Can Delete? | Application Check Required? | Confirmation Required? | Error on Block |
|--------|-------------|----------------------------|----------------------|----------------|
| **DRAFT** | ✅ YES | ✅ YES (must be 0) | ❌ NO (single click) | 409 if apps exist |
| **PUBLISHED** | ✅ YES | ✅ YES (must be 0) | ✅ YES (double confirm - FR-003) | 409 if apps exist |
| **IN_PROGRESS** | ❌ NO | N/A | N/A | 409 always |
| **COMPLETED** | ❌ NO | N/A | N/A | 409 always |
| **CANCELLED** | ⚠️ YES | ✅ YES (must be 0) | ❌ NO | 409 if apps exist |

**Validation Logic** (EventService):

```javascript
const NON_DELETABLE_STATUSES = ['IN_PROGRESS', 'COMPLETED'];

function validateDeletableStatus(event) {
  if (NON_DELETABLE_STATUSES.includes(event.status)) {
    throw new ConflictError(
      `Cannot delete events with status: ${event.status}. ` +
      `Only DRAFT, PUBLISHED, and CANCELLED events can be deleted.`,
      {
        eventId: event.id,
        currentStatus: event.status,
        deletableStatuses: ['DRAFT', 'PUBLISHED', 'CANCELLED']
      }
    );
  }
}

function validateNoApplications(eventId, appCount) {
  if (appCount > 0) {
    throw new ConflictError(
      `Cannot delete event with existing applications. ` +
      `Found ${appCount} application(s). Please cancel the event instead.`,
      {
        eventId,
        applicationCount: appCount,
        suggestion: 'Use "Cancel Event" feature to handle events with applications'
      }
    );
  }
}
```

---

## 3. Soft Delete Implementation

### 3.1 Soft Delete vs Hard Delete

**Decision** (from research.md Q1): Use `deleted_at` timestamp column

**Rationale**:
- Explicit semantics (clear distinction from `is_active`)
- Audit trail preservation (WHEN deletion occurred)
- Reversibility potential (future Restore feature)
- Industry standard pattern (Laravel, Rails)

**Query Pattern Changes**:

```javascript
// BEFORE UC17 (UC15/UC16)
const activeEvents = await prisma.events.findMany({
  where: {
    is_active: true
  }
});

// AFTER UC17 (ALL queries must update)
const activeEvents = await prisma.events.findMany({
  where: {
    is_active: true,
    deleted_at: null  // NEW: Exclude soft-deleted
  }
});

// Fetch soft-deleted events (admin only)
const deletedEvents = await prisma.events.findMany({
  where: {
    deleted_at: { not: null }
  },
  orderBy: {
    deleted_at: 'desc'
  }
});
```

### 3.2 Migration Script

**File**: `backend/prisma/migrations/XXX_add_deleted_at_to_events/migration.sql`

```sql
-- Add soft delete column
ALTER TABLE events 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL
COMMENT 'Soft delete timestamp. NULL = active, TIMESTAMP = deleted';

-- Add index for filtering active events
CREATE INDEX idx_events_deleted_at 
ON events(deleted_at)
COMMENT 'Fast filtering of soft-deleted events';

-- Composite index for common queries
CREATE INDEX idx_events_active_lookup 
ON events(organization_id, status, deleted_at)
COMMENT 'Optimized for: WHERE org_id = X AND status = Y AND deleted_at IS NULL';
```

**Prisma Schema Update**:

```prisma
model Event {
  id                    Int       @id @default(autoincrement())
  title                 String    @db.VarChar(500)
  // ... other fields ...
  deleted_at            DateTime? @map("deleted_at") // NEW
  
  @@index([deleted_at], map: "idx_events_deleted_at")
  @@index([organization_id, status, deleted_at], map: "idx_events_active_lookup")
  @@map("events")
}
```

---

## 4. Service Layer Contracts

### 4.1 EventService.deleteEvent()

**Method Signature**:

```javascript
/**
 * Soft delete event with ownership and constraint validation
 * 
 * @param {number} eventId - Event ID to delete
 * @param {number} staffId - Staff user_id from JWT
 * @param {number} organizationId - Organization ID from JWT
 * @returns {Promise<{ success: boolean, event: Event }>} Soft-deleted event
 * @throws {NotFoundError} Event not found or already deleted
 * @throws {ForbiddenError} Staff doesn't own this event
 * @throws {ConflictError} Status not deletable or has applications
 */
async deleteEvent(eventId, staffId, organizationId)
```

**Implementation Flow**:

```javascript
async deleteEvent(eventId, staffId, organizationId) {
  // Use transaction for ACID guarantee (research.md Q3)
  return await prisma.$transaction(async (tx) => {
    // Step 1: Fetch existing event (NOT soft-deleted)
    const event = await tx.events.findUnique({
      where: { 
        id: eventId, 
        is_active: true,
        deleted_at: null  // NEW: Must not be already deleted
      }
    });
    
    if (!event) {
      throw new NotFoundError(
        'Event not found or already deleted',
        { eventId }
      );
    }
    
    // Step 2: Ownership validation (research.md Q2)
    if (event.organization_id !== organizationId) {
      throw new ForbiddenError(
        'You can only delete events from your organization',
        {
          eventId,
          eventOrganizationId: event.organization_id,
          yourOrganizationId: organizationId
        }
      );
    }
    
    // Step 3: Status validation (research.md Q4)
    validateDeletableStatus(event);
    
    // Step 4: Application count check (research.md Q3)
    const appCount = await tx.volunteer_applications.count({
      where: { event_id: eventId }
    });
    
    validateNoApplications(eventId, appCount);
    
    // Step 5: Soft delete (set deleted_at timestamp)
    const deletedEvent = await tx.events.update({
      where: { id: eventId },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
        updated_by: staffId
      }
    });
    
    // Step 6: Audit log (within same transaction)
    await tx.event_audit_log.create({
      data: {
        event_id: eventId,
        changed_by: staffId,
        field_name: 'deleted_at',
        old_value: null,
        new_value: new Date().toISOString()
      }
    });
    
    // Step 7: Return result
    return {
      success: true,
      event: deletedEvent
    };
  });
  
  // Step 8: Async cleanup (outside transaction)
  // Note: Do NOT delete image from Cloudinary immediately
  // Let batch job handle cleanup later (Assumption A-010)
}
```

### 4.2 Helper Functions

```javascript
/**
 * Validate event status allows deletion
 */
function validateDeletableStatus(event) {
  const NON_DELETABLE_STATUSES = ['IN_PROGRESS', 'COMPLETED'];
  
  if (NON_DELETABLE_STATUSES.includes(event.status)) {
    throw new ConflictError(
      `Cannot delete events with status: ${event.status}. ` +
      `Only DRAFT, PUBLISHED, and CANCELLED events can be deleted.`,
      {
        eventId: event.id,
        currentStatus: event.status,
        deletableStatuses: ['DRAFT', 'PUBLISHED', 'CANCELLED']
      }
    );
  }
}

/**
 * Validate no applications exist
 */
function validateNoApplications(eventId, appCount) {
  if (appCount > 0) {
    throw new ConflictError(
      `Cannot delete event with existing applications. ` +
      `Found ${appCount} application(s). Please cancel the event instead.`,
      {
        eventId,
        applicationCount: appCount,
        suggestion: 'Use "Cancel Event" feature to handle events with applications'
      }
    );
  }
}
```

---

## 5. Cross-Module Contracts

### 5.1 TaskService (Member 4 - TriNT)

**Method**: `cancelTasksByEventId()` (FR-004)

**Input**:

```javascript
{
  eventId: number,
  cancelledBy: number  // Staff user_id
}
```

**Output**:

```javascript
{
  success: boolean,
  cancelled_count: number,
  errors: Array<{ taskId: number, error: string }> // Optional
}
```

**Behavior**:
- Soft delete all tasks linked to event (set `tasks.status = 'CANCELLED'`)
- Update `tasks.cancelled_at` timestamp
- Return count of affected tasks

**Note**: If Task module not yet implemented, skip this step (FR-004 is "if exists")

### 5.2 Query Filter Updates (ALL Modules)

**ALL modules querying events MUST update queries**:

**Affected Modules**:
- Member 2 (TuanNA): ApplicationService (event lookups)
- Member 4 (TriNT): TaskService (event validation)
- Member 5 (DucNM): NotificationService (event references)

**Required Change**:

```javascript
// BEFORE
const event = await prisma.events.findUnique({
  where: { id: eventId }
});

// AFTER (UC17+)
const event = await prisma.events.findUnique({
  where: { 
    id: eventId,
    deleted_at: null  // NEW: Exclude soft-deleted
  }
});
```

---

## 6. Cascade Behavior

### 6.1 Related Entity Actions

**Decision** (from research.md Q5): Preserve all data, no physical cascade

| Entity | Action on Event Delete | Rationale |
|--------|------------------------|-----------|
| **volunteer_applications** | BLOCK delete if exist | Business rule FR-002 |
| **event_audit_log** | PRESERVE (no action) | Immutable audit trail |
| **notifications** | PRESERVE (no action) | Historical record |
| **tasks** | Soft delete (status = 'CANCELLED') | FR-004 requirement |
| **donations** | PRESERVE (no action) | FR-016 financial compliance |
| **event images** | PRESERVE (cleanup by batch job) | Assumption A-010 |

### 6.2 Foreign Key Constraints

```sql
-- Prevent accidental hard delete
ALTER TABLE volunteer_applications
  ADD CONSTRAINT fk_event_restrict
  FOREIGN KEY (event_id) REFERENCES events(id)
  ON DELETE RESTRICT;  -- Force business logic check in code

ALTER TABLE event_audit_log
  ADD CONSTRAINT fk_event_audit_restrict
  FOREIGN KEY (event_id) REFERENCES events(id)
  ON DELETE RESTRICT;  -- Preserve audit trail forever
```

---

## 7. Error Handling

### 7.1 Error Types

| Error Class | HTTP Status | Use Case |
|-------------|-------------|----------|
| `NotFoundError` | 404 | Event not found or already deleted |
| `ForbiddenError` | 403 | Staff doesn't own event |
| `ConflictError` | 409 | Status not deletable OR has applications |
| `UnauthorizedError` | 401 | JWT missing or invalid |

### 7.2 Error Response Format

**Example 1: Status Not Deletable**

```javascript
{
  success: false,
  error: {
    code: 'EVENT_NOT_DELETABLE',
    message: 'Cannot delete events with status: IN_PROGRESS. Only DRAFT, PUBLISHED, and CANCELLED events can be deleted.',
    details: {
      eventId: 123,
      currentStatus: 'IN_PROGRESS',
      deletableStatuses: ['DRAFT', 'PUBLISHED', 'CANCELLED']
    }
  }
}
```

**Example 2: Has Applications**

```javascript
{
  success: false,
  error: {
    code: 'EVENT_HAS_APPLICATIONS',
    message: 'Cannot delete event with existing applications. Found 15 application(s). Please cancel the event instead.',
    details: {
      eventId: 123,
      applicationCount: 15,
      suggestion: 'Use "Cancel Event" feature to handle events with applications'
    }
  }
}
```

---

## 8. Testing Checklist

### 8.1 Unit Tests (event.service.test.js)

- [ ] `deleteEvent()` soft deletes DRAFT event successfully
- [ ] `deleteEvent()` soft deletes PUBLISHED event with no applications
- [ ] `deleteEvent()` blocks delete on IN_PROGRESS event (409)
- [ ] `deleteEvent()` blocks delete on COMPLETED event (409)
- [ ] `deleteEvent()` blocks delete when applications exist (409)
- [ ] `deleteEvent()` throws ForbiddenError for different organization
- [ ] `deleteEvent()` creates audit log entry
- [ ] `deleteEvent()` sets `deleted_at` timestamp correctly
- [ ] `deleteEvent()` updates `updated_by` field
- [ ] Idempotency: Deleting already-deleted event returns 404

### 8.2 Integration Tests (event.delete.test.js)

- [ ] DELETE `/events/:id` returns 200 for DRAFT event
- [ ] DELETE with invalid JWT returns 401
- [ ] DELETE different org's event returns 403
- [ ] DELETE IN_PROGRESS event returns 409
- [ ] DELETE event with applications returns 409
- [ ] DELETE non-existent event returns 404
- [ ] DELETE already-deleted event returns 404
- [ ] Audit log entry created on successful delete
- [ ] Soft-deleted event excluded from GET `/events` list
- [ ] Soft-deleted event excluded from GET `/events/:id`

### 8.3 Cross-Module Tests

- [ ] ApplicationService queries exclude soft-deleted events
- [ ] TaskService cancels tasks when event deleted (if implemented)
- [ ] NotificationService handles deleted event references gracefully

---

## 9. Performance Considerations

### 9.1 Query Optimization

**Index Usage**:

```sql
-- Fast filtering of active events
EXPLAIN SELECT * FROM events 
WHERE organization_id = 5 
  AND status = 'PUBLISHED' 
  AND deleted_at IS NULL;

-- Should use: idx_events_active_lookup (organization_id, status, deleted_at)
```

**Expected Performance**:
- DELETE operation: < 500ms (includes transaction + audit log)
- Application count check: < 100ms (indexed query)
- Active events query (with deleted_at filter): No performance degradation

### 9.2 Transaction Isolation

**Isolation Level**: `READ COMMITTED` (Prisma default)

**Lock Behavior**:
- Row-level lock on event during transaction
- No table-level lock (allows concurrent operations on other events)
- Application count check within transaction prevents race conditions

---

## 10. Security Checklist

- [x] JWT authentication required
- [x] Ownership validation (organization_id match)
- [x] Role-based access (Staff only)
- [x] SQL injection prevention (Prisma parameterized queries)
- [x] Audit trail for all deletions
- [x] Soft delete only (no data loss risk)
- [x] ACID transaction (prevents partial deletes)
- [x] Rate limiting (60 req/min per user)

---

## 11. Migration Rollback Plan

**If UC17 needs to be rolled back**:

```sql
-- Restore all soft-deleted events from last 24 hours
UPDATE events 
SET deleted_at = NULL, 
    updated_at = NOW()
WHERE deleted_at > DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- Remove deleted_at column (if needed)
ALTER TABLE events DROP COLUMN deleted_at;
DROP INDEX idx_events_deleted_at ON events;
DROP INDEX idx_events_active_lookup ON events;
```

**Audit Log Cleanup**:

```sql
-- Remove deletion audit entries (if rollback)
DELETE FROM event_audit_log 
WHERE field_name = 'deleted_at' 
  AND changed_at > DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

---

**Version**: 1.0  
**Status**: Data Model Complete → Ready for API Contract  
**Last Updated**: 2026-06-29

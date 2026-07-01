# Phase 0 Research: Delete Event (UC17)

**Date**: 2026-06-29  
**Feature**: Delete Event  
**Branch**: `017-feat-delete-event`

**Objective**: Answer 5 critical technical questions để inform Phase 1 design decisions.

---

## Research Question 1: Soft Delete Implementation Strategy

**Question**: Does `deleted_at` column exist in `events` table? Migration needed?

### Finding

**Current Event Schema** (from DATABASE.md Section 3.4):

```sql
CREATE TABLE events (
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
  updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Current State**: ❌ NO `deleted_at` column exists

**Alternative 1**: Use existing `is_active` flag
- Set `is_active = FALSE` to mark as deleted
- **Problem**: Cannot distinguish "inactive" from "deleted" semantically
- **Problem**: No timestamp tracking for when deletion occurred

**Alternative 2**: Add new `deleted_at` column
- Explicit soft delete with timestamp
- NULL = not deleted, TIMESTAMP = deleted at this time
- Follows industry standard pattern (Rails, Laravel, etc.)

### Source

- AGENTS.md Section 3: "Soft delete (`is_active: false`)" — Current pattern
- CLAUDE.md ADR-005: "User, Event, Organization, Category, Skill PHẢI dùng soft delete"
- CONTEXT.md Section 7 Decision: "Sử dụng Soft Delete (thêm trường `deleted_at`)"

### Decision

**Add `deleted_at` column to `events` table**

**Migration SQL**:

```sql
-- Add deleted_at column
ALTER TABLE events 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

-- Add index for query performance
CREATE INDEX idx_events_deleted_at ON events(deleted_at);

-- Combined index for active events queries
CREATE INDEX idx_events_active_lookup ON events(organization_id, status, deleted_at);
```

**Query Pattern**:

```javascript
// Fetch active (non-deleted) events
const events = await prisma.events.findMany({
  where: {
    is_active: true,
    deleted_at: null  // NEW: Filter out soft-deleted
  }
});

// Soft delete operation
const deleted = await prisma.events.update({
  where: { id: eventId },
  data: {
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: staffId
  }
});
```

### Rationale

- **Explicit Semantics**: `deleted_at` clearly indicates soft delete, `is_active` for business state
- **Audit Trail**: Timestamp preserves WHEN deletion occurred (compliance requirement)
- **Reversibility**: Can implement "Restore" feature in future (out of scope for UC17)
- **Industry Standard**: Matches Laravel, Rails, and other framework patterns

### Alternatives Rejected

- **Alternative 1**: Reuse `is_active` flag → Rejected vì semantic ambiguity và không có timestamp
- **Alternative 3**: Hard delete → Rejected vì violates ADR-005 và loses audit trail

---

## Research Question 2: Ownership Validation Pattern

**Question**: Reuse UC16 hybrid pattern or simplify for DELETE?

### Finding

**UC16 Pattern** (from UC16 research.md):

```javascript
// Middleware: authenticate() extracts JWT → req.user
// Service: EventService.updateEvent() validates ownership

if (event.organization_id !== organizationId) {
  throw new ForbiddenError('You can only edit events from your organization');
}
```

**UC17 Requirements** (from SPEC.md FR-005):

> "WHERE Staff không thuộc organization quản lý sự kiện, THE system SHALL trả về lỗi 403 Forbidden."

### Source

- CLAUDE.md Section 4 Lesson 3: "UserId PHẢI lấy từ JWT, KHÔNG từ request body"
- AGENTS.md Section 6: "Business logic và validation BẮT BUỘC ở Service layer"
- UC16 research.md Q2: Hybrid approach proven in production

### Decision

**Reuse UC16 Hybrid Pattern** (Middleware + Service)

**Implementation**:

```javascript
// Step 1: Middleware (EXISTING - No change)
export const authenticate = (req, res, next) => {
  const token = req.cookies[COOKIE_ACCESS_NAME];
  const decoded = jwt.verify(token, AUTH_SECRET);
  req.user = decoded; // { user_id, email, role_id, organization_id }
  next();
};

// Step 2: Service Layer (NEW)
async deleteEvent(eventId, staffId, organizationId) {
  // 1. Fetch event
  const event = await prisma.events.findUnique({
    where: { id: eventId, is_active: true, deleted_at: null }
  });
  
  if (!event) {
    throw new NotFoundError('Event not found');
  }
  
  // 2. Ownership check (CRITICAL)
  if (event.organization_id !== organizationId) {
    throw new ForbiddenError('You can only delete events from your organization');
  }
  
  // 3. Proceed with delete...
}

// Step 3: Controller (NEW)
export const deleteEvent = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id);
    const staffId = req.user.user_id;
    const organizationId = req.user.organization_id; // From JWT
    
    await EventService.deleteEvent(eventId, staffId, organizationId);
    
    return res.json({ 
      success: true, 
      message: 'Event deleted successfully' 
    });
  } catch (error) {
    next(error);
  }
};
```

### Rationale

- **Consistency**: Same pattern as UC16 (Edit Event) — developer familiarity
- **Testability**: Service layer ownership check easy to unit test
- **Reusability**: Pattern proven in UC16, no need to reinvent

### Alternatives Rejected

- **Alternative 1**: Ownership check in Middleware → Rejected vì violates separation of concerns (AGENTS.md)
- **Alternative 2**: Skip ownership check → Rejected vì massive security risk

---

## Research Question 3: Application Count Check Strategy

**Question**: How to efficiently check if event has applications? Race condition risk?

### Finding

**Business Rule** (from SPEC.md FR-002 và CONTEXT.md Section 2):

> "Không được phép xóa sự kiện đã có ít nhất một đơn đăng ký (ngay cả khi đơn đó đang ở trạng thái Pending)."

**Database Schema** (from DATABASE.md Section 3.6):

```sql
CREATE TABLE volunteer_applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT NOT NULL FOREIGN KEY → events.id,
  user_id INT NOT NULL FOREIGN KEY → users.id,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  -- ...
);
```

**Query Options**:

**Option A**: Count applications in separate query
```javascript
const appCount = await prisma.volunteer_applications.count({
  where: { event_id: eventId }
});

if (appCount > 0) {
  throw new ConflictError('Cannot delete event with existing applications');
}
```
**Risk**: Race condition if application created between check and delete

**Option B**: Use transaction with SELECT FOR UPDATE
```javascript
await prisma.$transaction(async (tx) => {
  // Lock event row
  const event = await tx.events.findUnique({
    where: { id: eventId }
  });
  
  // Count applications (consistent read within transaction)
  const appCount = await tx.volunteer_applications.count({
    where: { event_id: eventId }
  });
  
  if (appCount > 0) {
    throw new ConflictError('Cannot delete event with existing applications');
  }
  
  // Safe to delete
  await tx.events.update({
    where: { id: eventId },
    data: { deleted_at: new Date() }
  });
});
```
**Benefit**: ACID guarantee, no race condition

**Option C**: Reuse cached `approved_participants` from events table
```javascript
if (event.approved_participants > 0) {
  throw new ConflictError('Cannot delete event with approved volunteers');
}
```
**Problem**: Misses PENDING and REJECTED applications (SPEC requires checking ALL applications)

### Source

- SPEC.md FR-002: "Không được phép xóa sự kiện đã có ít nhất một đơn đăng ký"
- CONTEXT.md Section 4: "Business Rule Constraint: Tuyệt đối KHÔNG được xóa sự kiện đã có Volunteer đăng ký tham gia"
- DATABASE.md Section 6.4: Transaction patterns with Prisma

### Decision

**Use Transaction with Application Count Check** (Option B)

**Implementation**:

```javascript
async deleteEvent(eventId, staffId, organizationId) {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch and lock event
    const event = await tx.events.findUnique({
      where: { id: eventId, is_active: true, deleted_at: null }
    });
    
    if (!event) {
      throw new NotFoundError('Event not found');
    }
    
    // 2. Ownership check
    if (event.organization_id !== organizationId) {
      throw new ForbiddenError('You can only delete events from your organization');
    }
    
    // 3. Check applications (ANY status)
    const appCount = await tx.volunteer_applications.count({
      where: { event_id: eventId }
    });
    
    if (appCount > 0) {
      throw new ConflictError(
        `Cannot delete event with existing applications. ` +
        `Found ${appCount} application(s). Please cancel the event instead.`
      );
    }
    
    // 4. Safe to soft delete
    const deleted = await tx.events.update({
      where: { id: eventId },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
        updated_by: staffId
      }
    });
    
    // 5. Audit log (optional, within same transaction)
    await tx.event_audit_log.create({
      data: {
        event_id: eventId,
        changed_by: staffId,
        field_name: 'deleted_at',
        old_value: null,
        new_value: new Date().toISOString()
      }
    });
    
    return deleted;
  });
}
```

### Rationale

- **ACID Compliance**: Transaction ensures atomicity (AGENTS.md requirement)
- **Race Condition Safe**: Count + delete in same transaction
- **Clear Error Message**: Tell staff how many applications exist
- **Audit Trail**: Log deletion in same transaction (cannot be lost)

### Alternatives Rejected

- **Alternative A**: Separate query → Rejected vì race condition risk
- **Alternative C**: Use `approved_participants` only → Rejected vì misses PENDING/REJECTED applications (violates FR-002)

---

## Research Question 4: Status-Based Delete Constraints

**Question**: Can delete DRAFT only? Or PUBLISHED without applications also allowed?

### Finding

**SPEC.md Requirements**:

- FR-002: "WHEN xóa thành công, THE system SHALL thực hiện Soft Delete bằng cách cập nhật trường `deleted_at`"
- FR-003: "WHERE sự kiện đang ở trạng thái Published nhưng chưa có đơn đăng ký, THE system SHALL yêu cầu xác nhận lần 2 trước khi xóa"
- User Story 1: "Xóa sự kiện nháp (Draft) thành công"
- User Story 2: "Ngăn chặn xóa sự kiện đã có đăng ký"

**CONTEXT.md Section 4**:

> "State Transition Constraint: Không thể xóa các sự kiện đã ở trạng thái Ongoing hoặc Completed."

**Event Status Lifecycle** (from DATABASE.md):

```text
DRAFT → PUBLISHED → IN_PROGRESS → COMPLETED
  ↓         ↓            ↓
CANCELLED   CANCELLED    (no transition)
```

### Source

- SPEC.md FR-003: "Published nhưng chưa có đơn đăng ký" → Implies PUBLISHED can be deleted
- CONTEXT.md Section 4: "Không thể xóa... Ongoing hoặc Completed" → Implies DRAFT/PUBLISHED/CANCELLED can be deleted
- AGENTS.md Section 3: Event lifecycle rules

### Decision

**Tiered Delete Rules** (Status + Application Check):

| Status | Can Delete? | Condition | Confirmation Required? |
|--------|-------------|-----------|------------------------|
| **DRAFT** | ✅ YES | No applications | ❌ NO (single click) |
| **PUBLISHED** | ✅ YES | No applications | ✅ YES (FR-003: double confirmation) |
| **IN_PROGRESS** | ❌ NO | Blocked | N/A |
| **COMPLETED** | ❌ NO | Blocked | N/A |
| **CANCELLED** | ⚠️ YES | No applications (edge case) | ❌ NO |

**Implementation Logic**:

```javascript
// Service layer validation
const NON_DELETABLE_STATUSES = ['IN_PROGRESS', 'COMPLETED'];

if (NON_DELETABLE_STATUSES.includes(event.status)) {
  throw new ConflictError(
    `Cannot delete events with status: ${event.status}. ` +
    `Only DRAFT, PUBLISHED, and CANCELLED events can be deleted.`
  );
}

// Application check (for all deletable statuses)
const appCount = await tx.volunteer_applications.count({
  where: { event_id: eventId }
});

if (appCount > 0) {
  throw new ConflictError(
    `Cannot delete event with existing applications. ` +
    `Found ${appCount} application(s).`
  );
}

// Frontend: Double confirmation for PUBLISHED
if (event.status === 'PUBLISHED') {
  // Frontend shows modal: "This published event has no applications yet. Are you sure you want to delete?"
  // Backend accepts delete after staff confirms
}
```

### Rationale

- **DRAFT**: No commitments made, safe to delete freely (US1)
- **PUBLISHED**: Visible to volunteers but no applications yet → Allow with extra confirmation (FR-003)
- **IN_PROGRESS/COMPLETED**: Historical records, must preserve (CONTEXT.md)
- **CANCELLED**: Already inactive, allow cleanup (edge case)

### Alternatives Rejected

- **Alternative 1**: DRAFT only → Rejected vì FR-003 explicitly allows PUBLISHED without applications
- **Alternative 2**: All statuses → Rejected vì violates CONTEXT.md constraint

---

## Research Question 5: Cascade Behavior for Related Entities

**Question**: What happens to applications, tasks, notifications when event deleted?

### Finding

**Related Entities** (from DATABASE.md):

1. **volunteer_applications** (event_id FK)
2. **event_audit_log** (event_id FK)
3. **notifications** (reference_type = 'EVENT', reference_id = event_id)
4. **tasks** (if task management implemented - Member 4)

**Foreign Key Constraints** (typical Prisma setup):

```sql
-- Applications reference events
FOREIGN KEY (event_id) REFERENCES events(id) 
  ON DELETE RESTRICT  -- Prevent delete if applications exist

-- Audit log references events
FOREIGN KEY (event_id) REFERENCES event_audit_log(id)
  ON DELETE RESTRICT  -- Preserve audit trail
```

**SPEC.md FR-004**:

> "WHEN một sự kiện bị xóa, THE system SHALL tự động hủy các Task liên quan (nếu có) gắn liền với sự kiện đó."

**FR-016**:

> "WHEN thực hiện xóa, THE system MUST NOT xóa vật lý các bản ghi liên quan đến tài chính hoặc đóng góp (nếu có) để phục vụ kế toán."

### Source

- SPEC.md FR-004: Auto-cancel tasks
- SPEC.md FR-016: Preserve financial records
- DATABASE.md Section 7: Immutability rules
- CLAUDE.md ADR-005: Soft delete for master data

### Decision

**Cascade Strategy**: NO physical cascade delete, preserve all related data

**Behavior per entity**:

| Entity | Action on Event Delete | Rationale |
|--------|------------------------|-----------|
| **volunteer_applications** | BLOCK delete if exist | Business rule (FR-002) |
| **event_audit_log** | PRESERVE (no action) | Immutable audit trail |
| **notifications** | PRESERVE (no action) | Historical record |
| **tasks** | Soft delete if exist | FR-004 requirement |
| **donations** | PRESERVE (no action) | FR-016 financial compliance |

**Implementation** (Tasks cascade):

```javascript
// After soft deleting event
if (event has tasks) {
  await TaskService.cancelTasksByEventId(eventId, staffId);
  // TaskService implements soft delete: tasks.status = 'CANCELLED'
}
```

**Database Constraints**:

```sql
-- Prevent accidental hard delete
ALTER TABLE volunteer_applications
  ADD CONSTRAINT fk_event_restrict
  FOREIGN KEY (event_id) REFERENCES events(id)
  ON DELETE RESTRICT;  -- Force business logic check in code

ALTER TABLE event_audit_log
  ADD CONSTRAINT fk_event_audit_restrict
  FOREIGN KEY (event_id) REFERENCES events(id)
  ON DELETE RESTRICT;  -- Preserve audit trail
```

### Rationale

- **Data Preservation**: Soft delete preserves all relationships (ADR-005)
- **Audit Compliance**: Cannot lose audit trail or financial records
- **Referential Integrity**: FK constraints prevent accidental hard deletes
- **Task Cleanup**: Separate service call maintains module boundaries

### Alternatives Rejected

- **Alternative 1**: CASCADE DELETE on applications → Rejected vì violates FR-002 (should block delete instead)
- **Alternative 2**: Hard delete all related data → Rejected vì loses audit trail (ADR-005)

---

## Summary & Next Steps

### Key Decisions Made

| Research Area | Decision | Impact |
|---------------|----------|--------|
| **Soft Delete Strategy** | Add `deleted_at` column to events table | Prisma migration + query filter updates |
| **Ownership Check** | Reuse UC16 hybrid pattern (Middleware + Service) | Consistency across Event module |
| **Application Count** | Transaction-based count check | Race condition safe, ACID compliant |
| **Status Constraints** | Allow DRAFT/PUBLISHED/CANCELLED only, block IN_PROGRESS/COMPLETED | Business logic in EventService |
| **Cascade Behavior** | Preserve all data, soft delete tasks only | Cross-module call to TaskService (Member 4) |

### Phase 1 Artifacts to Generate

1. **data-model.md**: Event soft delete schema, validation rules, EventService.deleteEvent() signature
2. **contracts/DELETE-events-id.md**: Full API documentation với request/response examples, error codes
3. **quickstart.md**: Setup instructions, migration commands, testing guide

### Cross-Module Contracts Required

**TaskService (Member 4 - TriNT)**:

```javascript
// Contract to be confirmed with Member 4
TaskService.cancelTasksByEventId(eventId: number, cancelledBy: number) 
  → Promise<{ success: boolean, cancelled_count: number }>
```

**Note**: If Task module not yet implemented, this can be deferred (FR-004 is "if exists").

### Migration Requirements

**New Column**: `deleted_at` in `events` table

**Migration File**: `backend/prisma/migrations/XXX_add_deleted_at_to_events.sql`

```sql
-- Add soft delete column
ALTER TABLE events 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

-- Add index for query performance
CREATE INDEX idx_events_deleted_at ON events(deleted_at);

-- Composite index for active events lookup
CREATE INDEX idx_events_active_lookup 
ON events(organization_id, status, deleted_at);
```

### Query Updates Required

**All existing Event queries MUST add `deleted_at IS NULL` filter**:

```javascript
// BEFORE (UC15/UC16)
const events = await prisma.events.findMany({
  where: { is_active: true }
});

// AFTER (UC17+)
const events = await prisma.events.findMany({
  where: { 
    is_active: true,
    deleted_at: null  // NEW: Exclude soft-deleted
  }
});
```

**Affected files**:
- `backend/src/services/event.service.js` (all query methods)
- `backend/src/repositories/event.repository.js`
- Any other modules querying events (Application, Attendance, Certificate)

### Testing Strategy

**Unit Tests** (event.service.delete.test.js):
- Delete DRAFT event successfully
- Delete PUBLISHED event without applications
- Block delete on IN_PROGRESS event
- Block delete on event with applications
- Ownership validation
- Audit log creation

**Integration Tests** (event.delete.test.js):
- Happy path: DELETE DRAFT event (200)
- Happy path: DELETE PUBLISHED event without applications (200)
- Error: DELETE event with applications (409)
- Error: DELETE IN_PROGRESS event (409)
- Error: DELETE event from different organization (403)
- Error: DELETE non-existent event (404)

**Target Coverage**: 80% for EventService.deleteEvent()

---

**Version**: 1.0  
**Status**: Research Complete → Ready for Phase 1 Design  
**Last Updated**: 2026-06-29

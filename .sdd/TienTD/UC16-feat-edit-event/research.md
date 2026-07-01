# Phase 0 Research: Edit Event (UC16)

**Date**: 2026-06-29  
**Feature**: Edit Event  
**Branch**: `016-feat-edit-event`

**Objective**: Answer 5 critical technical questions để inform Phase 1 design decisions.

---

## Research Question 1: State Validation Rules

**Question**: Which event statuses allow edit? What fields are editable per status?

### Finding

Dựa trên SPEC.md FR-001 đến FR-016 và CONTEXT.md Section 2, events có 5 statuses:

| Status | Editable? | Allowed Fields | Restricted Fields | Rationale |
|--------|-----------|----------------|-------------------|-----------|
| **DRAFT** | ✅ YES | All fields except `id`, `organization_id` | `id`, `organization_id` (immutable) | Chưa publish, Staff có thể tự do chỉnh sửa |
| **PUBLISHED** | ✅ YES (restricted) | `title`, `description`, `location`, `max_capacity`, `image_url` | `start_date`, `end_date` (không về quá khứ), `category_id`, `organization_id` | Đã có volunteers đăng ký, hạn chế thay đổi core info |
| **IN_PROGRESS** | ❌ NO | Read-only | All fields locked | Sự kiện đang diễn ra, không cho phép sửa |
| **COMPLETED** | ❌ NO | Read-only | All fields locked | Sự kiện đã kết thúc, preserve audit trail |
| **CANCELLED** | ❌ NO | Read-only | All fields locked | Sự kiện đã hủy, không có ý nghĩa chỉnh sửa |

### Source

- AGENTS.md Section 3: "Không được phép chỉnh sửa thông tin cốt lõi của Sự kiện khi sự kiện đang diễn ra (In Progress) hoặc đã kết thúc (Completed)"
- DATABASE.md Section 3.4: `events.status` ENUM definition
- SPEC.md FR-002: "WHERE sự kiện đã có Volunteer đăng ký, THE system SHALL hiển thị cảnh báo xác nhận nếu Staff thay đổi Thời gian hoặc Địa điểm"

### Decision

**Implement 3-tier validation logic tại EventService.updateEvent()**:

```javascript
// Tier 1: Block edit cho non-editable statuses
const NON_EDITABLE_STATUSES = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
if (NON_EDITABLE_STATUSES.includes(event.status)) {
  throw new Error('Cannot edit events with status: ' + event.status);
}

// Tier 2: DRAFT → allow all fields (except immutable)
if (event.status === 'DRAFT') {
  // No field restrictions
}

// Tier 3: PUBLISHED → restrict critical fields
if (event.status === 'PUBLISHED') {
  const RESTRICTED_FIELDS = ['start_date', 'end_date', 'category_id'];
  const attemptedChanges = Object.keys(updateData);
  
  const forbiddenChanges = attemptedChanges.filter(field => 
    RESTRICTED_FIELDS.includes(field)
  );
  
  if (forbiddenChanges.length > 0) {
    throw new Error('Cannot change fields for PUBLISHED events: ' + forbiddenChanges.join(', '));
  }
}
```

### Rationale

- **Safety**: Prevent data corruption khi event đang active
- **Business Logic**: Published events cần stability (volunteers đã plan schedule)
- **Audit Trail**: Completed/Cancelled events là historical records

### Alternatives Rejected

- **Alternative 1**: Cho phép edit tất cả statuses → Rejected vì risk cao (volunteers nhận thông tin sai)
- **Alternative 2**: Chỉ cho edit DRAFT → Rejected vì Staff cần flexibility sau khi publish

---

## Research Question 2: Ownership Check Pattern

**Question**: Middleware vs Service layer? How to extract organization_id from JWT?

### Finding

**JWT Payload Structure** (from CLAUDE.md ADR-002):

```javascript
{
  user_id: 123,
  email: "staff@org.com",
  role_id: 2, // STAFF
  organization_id: 456, // Key for ownership check
  iat: 1719676800,
  exp: 1719680400
}
```

**Current Auth Flow** (from backend/src/middleware/auth.middleware.js):

```javascript
// auth.middleware.js (EXISTING)
export const authenticate = (req, res, next) => {
  const token = req.cookies[COOKIE_ACCESS_NAME];
  const decoded = jwt.verify(token, AUTH_SECRET);
  req.user = decoded; // Inject { user_id, email, role_id, organization_id }
  next();
};
```

### Source

- CLAUDE.md Section 3 ADR-002: JWT HttpOnly Cookies với organization_id trong payload
- DATABASE.md Section 4: "Staff chỉ edit/delete event của tổ chức mình quản lý"
- AGENTS.md Section 6: "Business logic và validation BẮT BUỘC ở Service layer"

### Decision

**Hybrid Approach: Middleware extracts identity, Service enforces ownership**

**Step 1: Middleware** (auth.middleware.js - EXISTING, no change needed):

```javascript
// Middleware chỉ verify JWT validity và inject req.user
export const authenticate = (req, res, next) => {
  // Extracts organization_id from JWT → req.user.organization_id
};
```

**Step 2: Service Layer Ownership Check** (event.service.js - NEW logic):

```javascript
// EventService.updateEvent()
async updateEvent(eventId, staffId, organizationId, updateData) {
  // 1. Fetch existing event
  const event = await EventRepository.findById(eventId);
  
  if (!event || !event.is_active) {
    throw new NotFoundError('Event not found');
  }
  
  // 2. Ownership check (CRITICAL)
  if (event.organization_id !== organizationId) {
    throw new ForbiddenError('You can only edit events from your organization');
  }
  
  // 3. Proceed with update...
}
```

**Controller Layer** (event.controller.js):

```javascript
// PATCH /events/:id
export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staffId = req.user.user_id;
    const organizationId = req.user.organization_id; // From JWT
    
    const updated = await EventService.updateEvent(
      id, 
      staffId, 
      organizationId, 
      req.body
    );
    
    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
```

### Rationale

- **Separation of Concerns**: Middleware handles authentication, Service handles authorization
- **Testability**: Service layer logic dễ test hơn (mock req.user thay vì mock JWT)
- **Reusability**: Ownership check có thể dùng cho DELETE, soft delete, etc.

### Alternatives Rejected

- **Alternative 1**: Ownership check trong Middleware → Rejected vì business logic không nên ở middleware (AGENTS.md violation)
- **Alternative 2**: Direct database query trong Controller → Rejected vì skip Service layer (anti-pattern per CLAUDE.md Section 5)

---

## Research Question 3: Audit Logging Strategy

**Question**: New table `event_audit_log` vs reuse `application_status_history`?

### Finding

**Existing Audit Patterns** (from DATABASE.md Section 3.5):

| Table | Purpose | Owner | Immutable? |
|-------|---------|-------|------------|
| `application_status_history` | Track application status changes | Member 3 | ✅ YES |
| `certificates` | Track certificate issuance | Member 3 | ✅ YES |
| `payment_transactions` | Track payment gateway responses | Member 5 | ✅ YES |

**UC16 Audit Requirements** (from SPEC.md):

- FR-003: "WHEN lưu thành công, THE system SHALL cập nhật trường `updated_at` và `updated_by` trong database"
- SC-002: "100% các thay đổi đối với trường 'Địa điểm' và 'Thời gian' của sự kiện đã Publish phải kích hoạt log hệ thống"

### Source

- DATABASE.md Section 7: Immutability Rules (audit tables NEVER UPDATE/DELETE)
- CLAUDE.md Section 4 Lesson 4: "Audit log phải được log bất đồng bộ"
- CONTEXT.md Section 4: "Audit Trail Constraint: Mọi thay đổi thông tin quan trọng (thời gian, địa điểm) phải được ghi log"

### Decision

**Create NEW table: `event_audit_log`**

**Schema Design**:

```sql
CREATE TABLE event_audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT NOT NULL,
  changed_by INT NOT NULL, -- Staff user_id
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  field_name VARCHAR(100) NOT NULL, -- e.g., "start_date", "location"
  old_value TEXT NULL,
  new_value TEXT NULL,
  change_reason VARCHAR(500) NULL,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (changed_by) REFERENCES users(id),
  INDEX idx_event_changes (event_id, changed_at),
  INDEX idx_changed_by (changed_by)
);
```

**Logging Strategy** (Service Layer):

```javascript
// EventService.updateEvent()
async updateEvent(eventId, staffId, organizationId, updateData) {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch original event
    const originalEvent = await tx.events.findUnique({ where: { id: eventId } });
    
    // 2. Update event
    const updatedEvent = await tx.events.update({
      where: { id: eventId },
      data: { ...updateData, updated_at: new Date(), updated_by: staffId }
    });
    
    // 3. Log changes (CRITICAL FIELDS ONLY)
    const CRITICAL_FIELDS = ['start_date', 'end_date', 'location', 'max_capacity'];
    
    for (const field of CRITICAL_FIELDS) {
      if (updateData[field] && originalEvent[field] !== updateData[field]) {
        await tx.event_audit_log.create({
          data: {
            event_id: eventId,
            changed_by: staffId,
            field_name: field,
            old_value: String(originalEvent[field]),
            new_value: String(updateData[field])
          }
        });
      }
    }
    
    return updatedEvent;
  });
}
```

### Rationale

- **Dedicated Table**: Không reuse `application_status_history` vì semantic khác nhau (event changes vs application changes)
- **Immutability**: Tuân thủ DATABASE.md Section 7 (audit tables NEVER UPDATE/DELETE)
- **Granularity**: Per-field logging cho phép track từng thay đổi riêng lẻ
- **Transaction Safety**: Log trong cùng transaction với update để đảm bảo atomicity

### Alternatives Rejected

- **Alternative 1**: Reuse `application_status_history` → Rejected vì table schema không match (status vs field changes)
- **Alternative 2**: Single JSON column cho tất cả changes → Rejected vì khó query/filter specific fields
- **Alternative 3**: Async logging sau transaction → Rejected vì risk mất log nếu async job fail (SC-002 requires 100% logging)

---

## Research Question 4: Notification Trigger

**Question**: When to send notifications? Which fields trigger alerts?

### Finding

**Notification Requirements** (from CONTEXT.md Section 7):

> **Quyết định cho câu hỏi 1 - Notification Strategy:**
> - **Lựa chọn**: Option A - Gửi notification real-time cho Volunteer đã đăng ký nếu thay đổi các trường quan trọng (Thời gian, Địa điểm).
> - **Lý do**: Đảm bảo quyền lợi và lịch trình của Volunteer không bị ảnh hưởng tiêu cực.
> - **Impact**: Backend cần gọi sang Module Notification sau khi lưu thành công các thay đổi quan trọng.

**Notification Module** (from DATABASE.md Section 3.8):

- Owner: Member 5 - DucNM
- Table: `notifications` (user_id, type_id, title, message, reference_type, reference_id)
- Channels: IN_APP, EMAIL, PUSH (future)

### Source

- SPEC.md FR-002: "WHERE sự kiện đã có Volunteer đăng ký, THE system SHALL hiển thị cảnh báo xác nhận nếu Staff thay đổi Thời gian hoặc Địa điểm"
- DATABASE.md Section 6.4: Transaction example "Approve Application + Send Notification"
- CLAUDE.md ADR-001: "Audit log write vào queue/async handler sau khi transaction commit" (Lesson 4)

### Decision

**Trigger Conditions**:

```javascript
const NOTIFICATION_TRIGGER_FIELDS = ['start_date', 'end_date', 'location'];

// Trigger notification IF:
// 1. Event status = PUBLISHED (có volunteers đã đăng ký)
// 2. One of trigger fields changed
// 3. event.approved_participants > 0 (có volunteers approved)
```

**Implementation Pattern** (EventService):

```javascript
async updateEvent(eventId, staffId, organizationId, updateData) {
  // ... validation và ownership check ...
  
  const shouldNotify = 
    originalEvent.status === 'PUBLISHED' &&
    originalEvent.approved_participants > 0 &&
    NOTIFICATION_TRIGGER_FIELDS.some(field => 
      updateData[field] && updateData[field] !== originalEvent[field]
    );
  
  // Update trong transaction
  const updatedEvent = await prisma.$transaction(async (tx) => {
    // 1. Update event
    // 2. Log audit
    return updatedEvent;
  });
  
  // Send notification AFTER transaction commit (async)
  if (shouldNotify) {
    // Cross-module call to NotificationService (Member 5)
    await NotificationService.sendEventChangeNotification({
      eventId,
      eventTitle: updatedEvent.title,
      changes: extractChanges(originalEvent, updateData),
      volunteerIds: await getApprovedVolunteerIds(eventId)
    });
  }
  
  return updatedEvent;
}
```

**NotificationService Contract** (Member 5 responsibility):

```javascript
// NotificationService.sendEventChangeNotification()
// Input: { eventId, eventTitle, changes: [{ field, oldValue, newValue }], volunteerIds: [] }
// Action: 
//   - Create notification records for each volunteer
//   - Send email via EmailService (Member 1)
//   - (Future) Send push notification
// Returns: { success: boolean, notified_count: number }
```

### Rationale

- **Async Notification**: Gửi notification NGOÀI transaction để không block API response (Lesson 4)
- **Critical Fields Only**: Chỉ notify khi time/location thay đổi (không notify khi sửa description)
- **Guard Condition**: Chỉ notify khi có volunteers approved (tránh spam notifications)
- **Cross-Module**: Delegate notification logic sang Member 5 (separation of concerns)

### Alternatives Rejected

- **Alternative 1**: Notify cho tất cả field changes → Rejected vì spam volunteers
- **Alternative 2**: Notification trong transaction → Rejected vì slow API response + risk rollback nếu email service fail
- **Alternative 3**: Manual notification từ Staff UI → Rejected vì dễ quên, không tự động (CONTEXT.md decision)

---

## Research Question 5: Image Replacement Flow

**Question**: Upload new → delete old → update URL? Rollback strategy?

### Finding

**Cloudinary Integration** (from CLAUDE.md ADR-004):

- UC15 (Create Event) đã implement Cloudinary upload
- Upload trả về `{ secure_url, public_id }`
- Delete API: `cloudinary.uploader.destroy(public_id)`

**Current Event Schema** (from DATABASE.md Section 3.4):

```sql
image_url VARCHAR(500) NULL -- Cloudinary URL
```

**Business Requirement** (from SPEC.md FR-004):

> "WHERE Staff upload ảnh mới, THE system SHALL thay thế ảnh cũ và xóa ảnh cũ khỏi storage để tiết kiệm dung lượng."

### Source

- CLAUDE.md ADR-004: "Backend trả về Cloudinary URL, không lưu binary data"
- SPEC.md FR-005: "WHEN API trả về lỗi (VD: mất kết nối), THE system SHALL hiển thị thông báo 'Update failed, please try again' và giữ nguyên dữ liệu trong form"

### Decision

**Upload-First, Delete-After Pattern**:

```javascript
// EventService.updateEvent()
async updateEvent(eventId, staffId, organizationId, updateData) {
  let newImageUrl = null;
  let oldImagePublicId = null;
  
  // Step 1: Upload new image BEFORE transaction (if provided)
  if (updateData.image) {
    const uploadResult = await CloudinaryService.upload(updateData.image);
    newImageUrl = uploadResult.secure_url;
    
    // Extract public_id from old URL for later deletion
    const originalEvent = await EventRepository.findById(eventId);
    if (originalEvent.image_url) {
      oldImagePublicId = extractPublicIdFromUrl(originalEvent.image_url);
    }
  }
  
  // Step 2: Update event in transaction
  const updatedEvent = await prisma.$transaction(async (tx) => {
    return await tx.events.update({
      where: { id: eventId },
      data: {
        ...updateData,
        image_url: newImageUrl || updateData.image_url, // Use new URL if uploaded
        updated_at: new Date(),
        updated_by: staffId
      }
    });
  });
  
  // Step 3: Delete old image AFTER transaction success (async, non-blocking)
  if (oldImagePublicId) {
    CloudinaryService.delete(oldImagePublicId).catch(error => {
      // Log error but don't fail the update
      logger.warn('Failed to delete old image:', { publicId: oldImagePublicId, error });
    });
  }
  
  return updatedEvent;
}
```

**Rollback Strategy**:

```javascript
// If transaction fails AFTER upload
try {
  const updatedEvent = await prisma.$transaction(...);
} catch (error) {
  // Rollback: Delete newly uploaded image
  if (newImageUrl) {
    await CloudinaryService.delete(extractPublicIdFromUrl(newImageUrl));
  }
  throw error;
}
```

### Rationale

- **Upload First**: Đảm bảo new image available trước khi commit database
- **Delete After**: Không block API response, cho phép retry nếu delete fail
- **Rollback Safety**: Nếu transaction fail, delete newly uploaded image để tránh orphaned files
- **Error Handling**: Log delete errors nhưng không fail entire update (old image tồn tại không critical)

### Alternatives Rejected

- **Alternative 1**: Delete old first, then upload → Rejected vì nếu upload fail, user mất ảnh cũ
- **Alternative 2**: Upload + delete in transaction → Rejected vì Cloudinary calls không thể rollback
- **Alternative 3**: Keep both images → Rejected vì waste storage (FR-004 requirement)

---

## Summary & Next Steps

### Key Decisions Made

| Research Area | Decision | Impact |
|---------------|----------|--------|
| **State Validation** | 3-tier logic: Block IN_PROGRESS/COMPLETED/CANCELLED, restrict PUBLISHED, allow DRAFT | EventService.updateEvent() implementation |
| **Ownership Check** | Hybrid: Middleware extracts identity, Service enforces authorization | event.service.js, event.controller.js |
| **Audit Logging** | New table `event_audit_log` với per-field logging | Prisma migration + transaction logic |
| **Notification** | Async notification AFTER transaction, trigger on time/location changes only | Cross-module với NotificationService (Member 5) |
| **Image Replacement** | Upload-first, delete-after với rollback strategy | CloudinaryService.upload() + delete() |

### Phase 1 Artifacts to Generate

1. **data-model.md**: Event update schema, `event_audit_log` table schema, Zod validation rules
2. **contracts/PATCH-events-id.md**: Full API documentation với request/response examples, error codes
3. **quickstart.md**: Setup instructions, migration commands, testing guide

### Cross-Module Contracts Required

**NotificationService (Member 5)**:

```javascript
// Contract to be defined in share_context.md
NotificationService.sendEventChangeNotification({
  eventId: number,
  eventTitle: string,
  changes: Array<{ field: string, oldValue: string, newValue: string }>,
  volunteerIds: Array<number>
}) → Promise<{ success: boolean, notified_count: number }>
```

**CloudinaryService (Existing from UC15)**:

```javascript
CloudinaryService.upload(file) → Promise<{ secure_url: string, public_id: string }>
CloudinaryService.delete(publicId) → Promise<{ result: 'ok' | 'not found' }>
```

### Migration Requirements

**New Table**: `event_audit_log`

**Migration File**: `backend/prisma/migrations/XXX_create_event_audit_log.sql`

```sql
CREATE TABLE event_audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT NOT NULL,
  changed_by INT NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT NULL,
  new_value TEXT NULL,
  change_reason VARCHAR(500) NULL,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (changed_by) REFERENCES users(id),
  INDEX idx_event_changes (event_id, changed_at),
  INDEX idx_changed_by (changed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Testing Strategy

**Unit Tests** (event.service.test.js):
- State validation logic (3 tiers)
- Ownership check logic
- Audit log creation
- Notification trigger conditions

**Integration Tests** (event.update.test.js):
- Happy path: Update DRAFT event
- Happy path: Update PUBLISHED event (restricted fields)
- Error: Update IN_PROGRESS event (blocked)
- Error: Update event from different organization (403)
- Error: Set past date (validation fail)
- Edge case: Update with new image (Cloudinary integration)
- Edge case: Update triggers notification (mock NotificationService)

**Target Coverage**: 80% for EventService.updateEvent()

---

**Version**: 1.0  
**Status**: Research Complete → Ready for Phase 1 Design  
**Last Updated**: 2026-06-29

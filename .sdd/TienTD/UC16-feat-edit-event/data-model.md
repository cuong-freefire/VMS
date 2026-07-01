# Phase 1 Design: Data Model — Edit Event (UC16)

**Date**: 2026-06-29  
**Feature**: Edit Event  
**Branch**: `016-feat-edit-event`

**Objective**: Define data structures, validation rules, and state transitions for event editing workflow.

---

## 1. Core Entities

### 1.1 Event (EXISTING — Extended)

**Table**: `events`  
**Owner**: Member 3 - TienTD  
**Purpose**: Sự kiện tình nguyện với update capability

**Updated Fields** (UC16 adds `updated_by`):

```sql
-- Existing columns (from UC15)
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
status ENUM('DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'DRAFT',
is_active BOOLEAN DEFAULT TRUE NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

-- NEW for UC16
updated_by INT NULL FOREIGN KEY → users.id -- Staff who last updated
```

**Indexes** (existing):
- PRIMARY KEY (id)
- INDEX (organization_id, status, is_active)
- INDEX (created_by)

**Business Rules** (UC16-specific):

1. **Immutable Fields**: `id`, `organization_id`, `created_by` CANNOT be changed
2. **Status-Based Edit Rules**:
   - DRAFT: All fields editable (except immutable)
   - PUBLISHED: Restricted fields (see Section 2)
   - IN_PROGRESS/COMPLETED/CANCELLED: No edits allowed
3. **Date Validation**:
   - `start_date` >= TODAY
   - `end_date` >= `start_date`
   - `application_deadline` < `start_date`
4. **Capacity Constraint**: `max_capacity` >= `approved_participants` (cannot reduce below current)
5. **Soft Delete**: Set `is_active = FALSE`, không hard delete

---

### 1.2 Event Audit Log (NEW)

**Table**: `event_audit_log`  
**Owner**: Member 3 - TienTD  
**Purpose**: Track all changes to event fields for audit compliance

**Schema**:

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
  INDEX idx_changed_by (changed_by),
  INDEX idx_field_name (field_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Log entry ID |
| event_id | INT | NOT NULL, FK → events.id | Event được chỉnh sửa |
| changed_by | INT | NOT NULL, FK → users.id | Staff thực hiện thay đổi |
| changed_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Thời gian thay đổi |
| field_name | VARCHAR(100) | NOT NULL | Tên field (start_date, location, max_capacity, etc.) |
| old_value | TEXT | NULL | Giá trị cũ (stringified) |
| new_value | TEXT | NULL | Giá trị mới (stringified) |
| change_reason | VARCHAR(500) | NULL | Lý do thay đổi (optional) |

**Tracked Fields** (CRITICAL_FIELDS):

- `start_date` — Thời gian bắt đầu
- `end_date` — Thời gian kết thúc
- `location` — Địa điểm
- `max_capacity` — Số lượng tối đa
- `title` — Tiêu đề
- `category_id` — Danh mục

**Immutability**: NEVER UPDATE/DELETE records (audit trail preservation)

**Query Patterns**:

```sql
-- Get all changes for an event
SELECT * FROM event_audit_log 
WHERE event_id = ? 
ORDER BY changed_at DESC;

-- Get changes by specific staff
SELECT * FROM event_audit_log 
WHERE changed_by = ? 
ORDER BY changed_at DESC;

-- Get changes for specific field
SELECT * FROM event_audit_log 
WHERE event_id = ? AND field_name = 'location' 
ORDER BY changed_at DESC;
```

---

## 2. State Transition Rules

### 2.1 Status-Based Field Restrictions

**State Machine**:

```text
DRAFT → PUBLISHED → IN_PROGRESS → COMPLETED
  ↓         ↓            ↓
CANCELLED   CANCELLED    (no transition)
```

**Edit Permissions by Status**:

| Status | Can Edit? | Editable Fields | Forbidden Fields | Notes |
|--------|-----------|-----------------|------------------|-------|
| **DRAFT** | ✅ YES | All (except immutable) | `id`, `organization_id`, `created_by` | Full flexibility |
| **PUBLISHED** | ✅ YES (limited) | `title`, `description`, `location`, `max_capacity`, `image_url` | `start_date`, `end_date`, `category_id`, `application_deadline` | Protect volunteer commitments |
| **IN_PROGRESS** | ❌ NO | None | All fields | Event is live |
| **COMPLETED** | ❌ NO | None | All fields | Historical record |
| **CANCELLED** | ❌ NO | None | All fields | Archived |

**Validation Logic** (EventService):

```javascript
const NON_EDITABLE_STATUSES = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

function validateEditableStatus(event) {
  if (NON_EDITABLE_STATUSES.includes(event.status)) {
    throw new ConflictError(
      `Cannot edit events with status: ${event.status}. ` +
      `Only DRAFT and PUBLISHED events can be edited.`
    );
  }
}

function validateEditableFields(event, updateData) {
  if (event.status === 'PUBLISHED') {
    const RESTRICTED_FIELDS = ['start_date', 'end_date', 'category_id', 'application_deadline'];
    const attemptedChanges = Object.keys(updateData);
    
    const forbiddenChanges = attemptedChanges.filter(field => 
      RESTRICTED_FIELDS.includes(field)
    );
    
    if (forbiddenChanges.length > 0) {
      throw new ConflictError(
        `Cannot change these fields for PUBLISHED events: ${forbiddenChanges.join(', ')}. ` +
        `Please change status to DRAFT first if you need to modify these fields.`
      );
    }
  }
}
```

---

## 3. Validation Rules (Zod Schema)

### 3.1 Update Event Validator

**File**: `backend/src/validators/event.validator.js`

```javascript
import { z } from 'zod';

// Reuse from UC15 (with modifications)
export const updateEventSchema = z.object({
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(500, 'Title must not exceed 500 characters')
    .optional(),
  
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .optional(),
  
  location: z.string()
    .min(5, 'Location must be at least 5 characters')
    .max(500, 'Location must not exceed 500 characters')
    .optional(),
  
  start_date: z.string()
    .datetime({ message: 'Invalid datetime format' })
    .refine(
      (val) => new Date(val) >= new Date(),
      { message: 'Start date cannot be in the past' }
    )
    .optional(),
  
  end_date: z.string()
    .datetime({ message: 'Invalid datetime format' })
    .optional(),
  
  application_deadline: z.string()
    .datetime({ message: 'Invalid datetime format' })
    .optional(),
  
  max_capacity: z.number()
    .int('Max capacity must be an integer')
    .positive('Max capacity must be positive')
    .optional(),
  
  category_id: z.number()
    .int('Category ID must be an integer')
    .positive('Category ID must be positive')
    .optional(),
  
  image: z.any().optional() // Multer file upload
}).strict() // Reject unknown fields
.refine(
  (data) => {
    // Cross-field validation: end_date >= start_date
    if (data.start_date && data.end_date) {
      return new Date(data.end_date) >= new Date(data.start_date);
    }
    return true;
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['end_date']
  }
)
.refine(
  (data) => {
    // Cross-field validation: application_deadline < start_date
    if (data.application_deadline && data.start_date) {
      return new Date(data.application_deadline) < new Date(data.start_date);
    }
    return true;
  },
  {
    message: 'Application deadline must be before start date',
    path: ['application_deadline']
  }
);
```

### 3.2 Additional Runtime Validations (Service Layer)

```javascript
// EventService.updateEvent()

// 1. Validate max_capacity >= approved_participants
if (updateData.max_capacity !== undefined) {
  if (updateData.max_capacity < event.approved_participants) {
    throw new ConflictError(
      `Cannot reduce max_capacity (${updateData.max_capacity}) ` +
      `below current approved_participants (${event.approved_participants})`
    );
  }
}

// 2. Validate category is active
if (updateData.category_id) {
  const category = await CategoryRepository.findById(updateData.category_id);
  if (!category || !category.is_active) {
    throw new NotFoundError('Category not found or inactive');
  }
}

// 3. Validate dates không conflict với existing data
if (updateData.start_date || updateData.end_date) {
  const start = updateData.start_date ? new Date(updateData.start_date) : new Date(event.start_date);
  const end = updateData.end_date ? new Date(updateData.end_date) : new Date(event.end_date);
  const deadline = new Date(event.application_deadline);
  
  if (end < start) {
    throw new ValidationError('End date must be after start date');
  }
  
  if (deadline >= start) {
    throw new ValidationError('Application deadline must be before start date');
  }
}
```

---

## 4. Service Layer Contracts

### 4.1 EventService.updateEvent()

**Method Signature**:

```javascript
/**
 * Update event information with ownership and state validation
 * 
 * @param {number} eventId - Event ID to update
 * @param {number} staffId - Staff user_id from JWT
 * @param {number} organizationId - Organization ID from JWT
 * @param {object} updateData - Fields to update (Zod validated)
 * @returns {Promise<Event>} Updated event object
 * @throws {NotFoundError} Event not found or soft deleted
 * @throws {ForbiddenError} Staff doesn't own this event
 * @throws {ConflictError} Status not editable or field restricted
 * @throws {ValidationError} Date validation failed or capacity conflict
 */
async updateEvent(eventId, staffId, organizationId, updateData)
```

**Implementation Flow**:

```javascript
async updateEvent(eventId, staffId, organizationId, updateData) {
  // Step 1: Fetch existing event (with lock for capacity check)
  const event = await prisma.events.findUnique({
    where: { id: eventId, is_active: true }
  });
  
  if (!event) {
    throw new NotFoundError('Event not found');
  }
  
  // Step 2: Ownership validation
  if (event.organization_id !== organizationId) {
    throw new ForbiddenError('You can only edit events from your organization');
  }
  
  // Step 3: Status validation
  validateEditableStatus(event);
  validateEditableFields(event, updateData);
  
  // Step 4: Runtime validations
  // - max_capacity >= approved_participants
  // - category is active
  // - date constraints
  
  // Step 5: Image upload (if provided)
  let newImageUrl = null;
  let oldImagePublicId = null;
  
  if (updateData.image) {
    newImageUrl = await CloudinaryService.upload(updateData.image);
    oldImagePublicId = extractPublicIdFromUrl(event.image_url);
  }
  
  // Step 6: Transaction (update + audit log)
  const updatedEvent = await prisma.$transaction(async (tx) => {
    // 6a. Update event
    const updated = await tx.events.update({
      where: { id: eventId },
      data: {
        ...updateData,
        image_url: newImageUrl || event.image_url,
        updated_at: new Date(),
        updated_by: staffId
      }
    });
    
    // 6b. Log critical field changes
    const CRITICAL_FIELDS = ['start_date', 'end_date', 'location', 'max_capacity', 'title', 'category_id'];
    
    for (const field of CRITICAL_FIELDS) {
      if (updateData[field] && event[field] !== updateData[field]) {
        await tx.event_audit_log.create({
          data: {
            event_id: eventId,
            changed_by: staffId,
            field_name: field,
            old_value: String(event[field]),
            new_value: String(updateData[field])
          }
        });
      }
    }
    
    return updated;
  });
  
  // Step 7: Async cleanup (delete old image)
  if (oldImagePublicId) {
    CloudinaryService.delete(oldImagePublicId).catch(logger.warn);
  }
  
  // Step 8: Trigger notification (if time/location changed)
  const shouldNotify = 
    event.status === 'PUBLISHED' &&
    event.approved_participants > 0 &&
    ['start_date', 'end_date', 'location'].some(field => 
      updateData[field] && updateData[field] !== event[field]
    );
  
  if (shouldNotify) {
    // Cross-module call (Member 5)
    await NotificationService.sendEventChangeNotification({
      eventId,
      eventTitle: updatedEvent.title,
      changes: extractChanges(event, updateData),
      volunteerIds: await getApprovedVolunteerIds(eventId)
    });
  }
  
  return updatedEvent;
}
```

### 4.2 Helper Functions

```javascript
/**
 * Extract changed fields for notification
 */
function extractChanges(oldEvent, newData) {
  const changes = [];
  const TRACKED_FIELDS = ['start_date', 'end_date', 'location'];
  
  for (const field of TRACKED_FIELDS) {
    if (newData[field] && oldEvent[field] !== newData[field]) {
      changes.push({
        field,
        oldValue: oldEvent[field],
        newValue: newData[field]
      });
    }
  }
  
  return changes;
}

/**
 * Get volunteer IDs with approved applications
 */
async function getApprovedVolunteerIds(eventId) {
  const applications = await prisma.applications.findMany({
    where: {
      event_id: eventId,
      status: 'APPROVED'
    },
    select: { user_id: true }
  });
  
  return applications.map(app => app.user_id);
}

/**
 * Extract Cloudinary public_id from URL
 */
function extractPublicIdFromUrl(url) {
  if (!url) return null;
  // URL format: https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<public_id>.<ext>
  const match = url.match(/\/upload\/v\d+\/(.+)\.\w+$/);
  return match ? match[1] : null;
}
```

---

## 5. Cross-Module Contracts

### 5.1 NotificationService (Member 5 - DucNM)

**Method**: `sendEventChangeNotification()`

**Input**:

```javascript
{
  eventId: number,
  eventTitle: string,
  changes: Array<{
    field: string,      // 'start_date' | 'end_date' | 'location'
    oldValue: string,   // Formatted old value
    newValue: string    // Formatted new value
  }>,
  volunteerIds: Array<number>
}
```

**Output**:

```javascript
{
  success: boolean,
  notified_count: number,
  errors: Array<{ userId: number, error: string }> // Optional
}
```

**Behavior**:
- Create notification records for each volunteer in `notifications` table
- Send emails via EmailService (Member 1)
- Use notification type: `EVENT_CHANGE` (to be added to `notification_types` seed data)

### 5.2 CloudinaryService (Existing from UC15)

**Methods**:

```javascript
// Upload image
CloudinaryService.upload(file: File) → Promise<{
  secure_url: string,
  public_id: string
}>

// Delete image
CloudinaryService.delete(publicId: string) → Promise<{
  result: 'ok' | 'not found'
}>
```

---

## 6. Error Handling

### 6.1 Error Types

| Error Class | HTTP Status | Use Case |
|-------------|-------------|----------|
| `NotFoundError` | 404 | Event not found or soft deleted |
| `ForbiddenError` | 403 | Staff doesn't own event |
| `ConflictError` | 409 | Status not editable, field restricted, capacity conflict |
| `ValidationError` | 400 | Zod validation failed, date constraints violated |
| `UnauthorizedError` | 401 | JWT missing or invalid |

### 6.2 Error Response Format

```javascript
{
  success: false,
  error: {
    code: 'EVENT_NOT_EDITABLE',
    message: 'Cannot edit events with status: IN_PROGRESS',
    details: {
      eventId: 123,
      currentStatus: 'IN_PROGRESS',
      editableStatuses: ['DRAFT', 'PUBLISHED']
    }
  }
}
```

---

## 7. Testing Checklist

### 7.1 Unit Tests (event.service.test.js)

- [ ] `updateEvent()` updates DRAFT event successfully
- [ ] `updateEvent()` updates PUBLISHED event with allowed fields
- [ ] `updateEvent()` blocks edit on IN_PROGRESS event
- [ ] `updateEvent()` throws ForbiddenError for different organization
- [ ] `updateEvent()` validates max_capacity >= approved_participants
- [ ] `updateEvent()` logs audit trail for critical fields
- [ ] `updateEvent()` triggers notification on time/location change
- [ ] Image upload replaces old image and updates URL
- [ ] Date validation prevents past dates

### 7.2 Integration Tests (event.update.test.js)

- [ ] PATCH `/events/:id` returns 200 with updated event
- [ ] PATCH with invalid JWT returns 401
- [ ] PATCH different org's event returns 403
- [ ] PATCH IN_PROGRESS event returns 409
- [ ] PATCH with past start_date returns 400
- [ ] PATCH reduces max_capacity below approved_participants returns 409
- [ ] PATCH with image uploads to Cloudinary and updates URL
- [ ] Audit log records created for time/location changes

---

**Version**: 1.0  
**Status**: Data Model Complete → Ready for API Contract  
**Last Updated**: 2026-06-29

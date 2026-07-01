# API Contract: PATCH /api/v1/events/:id

**Version**: 1.0  
**Feature**: Edit Event (UC16)  
**Owner**: Member 3 - TienTD  
**Last Updated**: 2026-06-29

---

## Overview

**Purpose**: Update existing event information with ownership and state validation.

**Authentication**: Required (JWT HttpOnly Cookie)  
**Authorization**: Staff role, same organization as event  
**Rate Limit**: 60 requests/minute per user

---

## Endpoint Specification

```http
PATCH /api/v1/events/:id
Content-Type: multipart/form-data
Cookie: access_token=<JWT>
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Event ID to update |

### Request Headers

```http
Content-Type: multipart/form-data
Cookie: access_token=<JWT_TOKEN>
```

### Request Body (multipart/form-data)

**Note**: All fields are OPTIONAL. Send only fields you want to update.

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `title` | string | No | Min: 10, Max: 500 | Event title |
| `description` | string | No | Min: 50 | Event description |
| `location` | string | No | Min: 5, Max: 500 | Event location |
| `start_date` | string (ISO 8601) | No | >= TODAY | Start date-time |
| `end_date` | string (ISO 8601) | No | >= start_date | End date-time |
| `application_deadline` | string (ISO 8601) | No | < start_date | Application deadline |
| `max_capacity` | integer | No | > 0, >= approved_participants | Maximum volunteers |
| `category_id` | integer | No | Valid active category | Event category ID |
| `image` | file | No | JPEG/PNG, Max: 5MB | Event image |

**Example Request Body**:

```json
{
  "title": "Beach Cleanup - Nha Trang 2026 (Updated)",
  "description": "Updated description with new volunteer requirements and safety guidelines...",
  "location": "Nha Trang Beach - Section B (Changed)",
  "max_capacity": 150
}
```

**Example with Image Upload** (multipart/form-data):

```bash
curl -X PATCH http://localhost:3000/api/v1/events/123 \
  -H "Cookie: access_token=<JWT>" \
  -F "title=Beach Cleanup - Updated" \
  -F "location=Nha Trang Beach - Section B" \
  -F "image=@/path/to/new-image.jpg"
```

---

## Response Specifications

### Success Response (200 OK)

**Scenario**: Event updated successfully

```json
{
  "success": true,
  "data": {
    "id": 123,
    "title": "Beach Cleanup - Nha Trang 2026 (Updated)",
    "description": "Updated description with new volunteer requirements...",
    "location": "Nha Trang Beach - Section B (Changed)",
    "start_date": "2026-07-15T08:00:00.000Z",
    "end_date": "2026-07-15T12:00:00.000Z",
    "application_deadline": "2026-07-10T23:59:59.000Z",
    "max_capacity": 150,
    "approved_participants": 45,
    "image_url": "https://res.cloudinary.com/vms/image/upload/v1234567890/events/abc123.jpg",
    "organization_id": 5,
    "category_id": 3,
    "created_by": 10,
    "updated_by": 10,
    "status": "PUBLISHED",
    "is_active": true,
    "created_at": "2026-06-01T10:00:00.000Z",
    "updated_at": "2026-06-29T15:30:00.000Z"
  },
  "message": "Event updated successfully"
}
```

---

### Error Responses

#### 400 Bad Request - Validation Error

**Scenario 1**: Start date in the past

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "start_date",
        "message": "Start date cannot be in the past"
      }
    ]
  }
}
```

**Scenario 2**: End date before start date

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "end_date",
        "message": "End date must be after or equal to start date"
      }
    ]
  }
}
```

**Scenario 3**: Application deadline after start date

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "application_deadline",
        "message": "Application deadline must be before start date"
      }
    ]
  }
}
```

**Scenario 4**: Invalid image format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid file format. Only JPEG and PNG images are allowed.",
    "details": {
      "field": "image",
      "allowedFormats": ["image/jpeg", "image/png"],
      "maxSize": "5MB"
    }
  }
}
```

---

#### 401 Unauthorized

**Scenario**: Missing or invalid JWT token

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please log in."
  }
}
```

---

#### 403 Forbidden - Ownership Violation

**Scenario**: Staff trying to edit event from different organization

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You can only edit events from your organization",
    "details": {
      "eventId": 123,
      "eventOrganizationId": 5,
      "yourOrganizationId": 8
    }
  }
}
```

---

#### 404 Not Found

**Scenario 1**: Event not found or soft deleted

```json
{
  "success": false,
  "error": {
    "code": "EVENT_NOT_FOUND",
    "message": "Event not found",
    "details": {
      "eventId": 123
    }
  }
}
```

**Scenario 2**: Category not found or inactive

```json
{
  "success": false,
  "error": {
    "code": "CATEGORY_NOT_FOUND",
    "message": "Category not found or inactive",
    "details": {
      "categoryId": 999
    }
  }
}
```

---

#### 409 Conflict - Business Rule Violation

**Scenario 1**: Attempting to edit non-editable status

```json
{
  "success": false,
  "error": {
    "code": "EVENT_NOT_EDITABLE",
    "message": "Cannot edit events with status: IN_PROGRESS. Only DRAFT and PUBLISHED events can be edited.",
    "details": {
      "eventId": 123,
      "currentStatus": "IN_PROGRESS",
      "editableStatuses": ["DRAFT", "PUBLISHED"]
    }
  }
}
```

**Scenario 2**: Attempting to change restricted field on PUBLISHED event

```json
{
  "success": false,
  "error": {
    "code": "FIELD_RESTRICTED",
    "message": "Cannot change these fields for PUBLISHED events: start_date, end_date. Please change status to DRAFT first if you need to modify these fields.",
    "details": {
      "eventId": 123,
      "currentStatus": "PUBLISHED",
      "restrictedFields": ["start_date", "end_date", "category_id", "application_deadline"],
      "attemptedChanges": ["start_date", "end_date"]
    }
  }
}
```

**Scenario 3**: Reducing max_capacity below approved_participants

```json
{
  "success": false,
  "error": {
    "code": "CAPACITY_CONFLICT",
    "message": "Cannot reduce max_capacity (120) below current approved_participants (145)",
    "details": {
      "eventId": 123,
      "currentMaxCapacity": 200,
      "newMaxCapacity": 120,
      "approvedParticipants": 145,
      "minimumAllowed": 145
    }
  }
}
```

---

#### 500 Internal Server Error

**Scenario 1**: Database connection error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again later.",
    "requestId": "req_abc123xyz"
  }
}
```

**Scenario 2**: Cloudinary upload failure

```json
{
  "success": false,
  "error": {
    "code": "IMAGE_UPLOAD_FAILED",
    "message": "Failed to upload image. Please try again.",
    "details": {
      "service": "Cloudinary",
      "reason": "Connection timeout"
    }
  }
}
```

---

## State-Based Field Restrictions

### DRAFT Events

**Editable Fields**: All fields (except immutable: `id`, `organization_id`, `created_by`, `created_at`)

**Example Request**:

```json
{
  "title": "New Title",
  "description": "New Description",
  "start_date": "2026-08-01T08:00:00.000Z",
  "end_date": "2026-08-01T17:00:00.000Z",
  "category_id": 5
}
```

**Result**: ✅ All fields updated

---

### PUBLISHED Events

**Editable Fields**: `title`, `description`, `location`, `max_capacity`, `image`

**Restricted Fields**: `start_date`, `end_date`, `category_id`, `application_deadline`

**Example Request** (will FAIL):

```json
{
  "location": "New Location",
  "start_date": "2026-08-01T08:00:00.000Z"
}
```

**Result**: ❌ 409 Conflict - Cannot change `start_date` for PUBLISHED event

**Correct Request**:

```json
{
  "location": "New Location",
  "max_capacity": 150
}
```

**Result**: ✅ Only allowed fields updated

---

### IN_PROGRESS / COMPLETED / CANCELLED Events

**Editable Fields**: NONE

**Example Request**:

```json
{
  "title": "New Title"
}
```

**Result**: ❌ 409 Conflict - Event status does not allow editing

---

## Notification Triggers

### Volunteer Notification Conditions

Volunteers with **APPROVED** applications receive IN_APP + EMAIL notification if:

1. Event status = `PUBLISHED` AND
2. `approved_participants` > 0 AND
3. Any of these fields changed:
   - `start_date`
   - `end_date`
   - `location`

**Notification Content Example**:

```text
Subject: Thay đổi thông tin sự kiện "Beach Cleanup - Nha Trang 2026"

Xin chào [Volunteer Name],

Sự kiện "Beach Cleanup - Nha Trang 2026" mà bạn đã đăng ký đã có thay đổi:

- Địa điểm: Nha Trang Beach - Section A → Nha Trang Beach - Section B
- Thời gian bắt đầu: 15/07/2026 08:00 → 15/07/2026 09:00

Vui lòng xem lại thông tin chi tiết và điều chỉnh lịch trình nếu cần.

Trân trọng,
VMS Team
```

---

## Audit Logging

### Tracked Fields

Changes to these fields are logged in `event_audit_log` table:

- `start_date`
- `end_date`
- `location`
- `max_capacity`
- `title`
- `category_id`

### Audit Log Entry Example

```json
{
  "id": 456,
  "event_id": 123,
  "changed_by": 10,
  "changed_at": "2026-06-29T15:30:00.000Z",
  "field_name": "location",
  "old_value": "Nha Trang Beach - Section A",
  "new_value": "Nha Trang Beach - Section B",
  "change_reason": null
}
```

---

## Swagger JSDoc Annotation

```javascript
/**
 * @swagger
 * /api/v1/events/{id}:
 *   patch:
 *     summary: Update event information
 *     description: |
 *       Update existing event with ownership and state validation.
 *       - DRAFT events: All fields editable
 *       - PUBLISHED events: Restricted fields (cannot change dates/category)
 *       - IN_PROGRESS/COMPLETED/CANCELLED events: No edits allowed
 *       
 *       Triggers notification to approved volunteers if time/location changes.
 *     tags:
 *       - Events
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 example: "Beach Cleanup - Nha Trang 2026 (Updated)"
 *               description:
 *                 type: string
 *                 minLength: 50
 *                 example: "Updated description..."
 *               location:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 500
 *                 example: "Nha Trang Beach - Section B"
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-07-15T08:00:00.000Z"
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-07-15T12:00:00.000Z"
 *               application_deadline:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-07-10T23:59:59.000Z"
 *               max_capacity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 150
 *               category_id:
 *                 type: integer
 *                 example: 3
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Event image (JPEG/PNG, max 5MB)
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *                 message:
 *                   type: string
 *                   example: "Event updated successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Missing or invalid JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       403:
 *         description: Forbidden - Not event owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenError'
 *       404:
 *         description: Event or category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *       409:
 *         description: Business rule violation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConflictError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalError'
 */
```

---

## Integration Test Scenarios

### Test Suite: event.update.test.js

```javascript
describe('PATCH /api/v1/events/:id', () => {
  describe('Success Cases', () => {
    it('should update DRAFT event with all fields', async () => {
      // Given: DRAFT event owned by logged-in staff
      // When: PATCH with valid data
      // Then: 200 OK, all fields updated
    });
    
    it('should update PUBLISHED event with allowed fields only', async () => {
      // Given: PUBLISHED event with approved participants
      // When: PATCH title + location (allowed fields)
      // Then: 200 OK, fields updated, notification sent
    });
    
    it('should upload new image and replace old one', async () => {
      // Given: Event with existing image
      // When: PATCH with new image file
      // Then: 200 OK, new image URL, old image deleted from Cloudinary
    });
  });
  
  describe('Validation Errors (400)', () => {
    it('should reject past start_date', async () => {
      // Given: Valid event
      // When: PATCH with start_date < TODAY
      // Then: 400 Bad Request
    });
    
    it('should reject end_date before start_date', async () => {
      // When: PATCH with end_date < start_date
      // Then: 400 Bad Request
    });
    
    it('should reject invalid image format', async () => {
      // When: PATCH with .pdf file as image
      // Then: 400 Bad Request
    });
  });
  
  describe('Authorization Errors (401/403)', () => {
    it('should reject request without JWT', async () => {
      // When: PATCH without Cookie header
      // Then: 401 Unauthorized
    });
    
    it('should reject staff from different organization', async () => {
      // Given: Event from Org A, Staff from Org B
      // When: PATCH request
      // Then: 403 Forbidden
    });
  });
  
  describe('Not Found Errors (404)', () => {
    it('should return 404 for non-existent event', async () => {
      // When: PATCH /events/99999
      // Then: 404 Not Found
    });
    
    it('should return 404 for soft-deleted event', async () => {
      // Given: Event with is_active = FALSE
      // When: PATCH request
      // Then: 404 Not Found
    });
    
    it('should return 404 for inactive category', async () => {
      // When: PATCH with category_id where is_active = FALSE
      // Then: 404 Not Found
    });
  });
  
  describe('Conflict Errors (409)', () => {
    it('should reject edit on IN_PROGRESS event', async () => {
      // Given: Event with status = IN_PROGRESS
      // When: PATCH any field
      // Then: 409 Conflict
    });
    
    it('should reject restricted field change on PUBLISHED event', async () => {
      // Given: PUBLISHED event
      // When: PATCH start_date
      // Then: 409 Conflict
    });
    
    it('should reject max_capacity < approved_participants', async () => {
      // Given: Event with 100 approved participants
      // When: PATCH max_capacity = 80
      // Then: 409 Conflict
    });
  });
  
  describe('Notification Triggers', () => {
    it('should send notification when location changes on PUBLISHED event', async () => {
      // Given: PUBLISHED event with approved participants
      // When: PATCH location
      // Then: 200 OK, notification created for all approved volunteers
    });
    
    it('should NOT send notification when only title changes', async () => {
      // Given: PUBLISHED event with approved participants
      // When: PATCH title only
      // Then: 200 OK, no notification sent
    });
    
    it('should NOT send notification on DRAFT event', async () => {
      // Given: DRAFT event (no approved participants yet)
      // When: PATCH start_date
      // Then: 200 OK, no notification sent
    });
  });
  
  describe('Audit Logging', () => {
    it('should log critical field changes', async () => {
      // Given: PUBLISHED event
      // When: PATCH location + max_capacity
      // Then: 2 audit log entries created
    });
    
    it('should NOT log non-critical field changes', async () => {
      // When: PATCH description only
      // Then: No audit log entry
    });
  });
});
```

---

## Performance Requirements

- **Response Time**: < 1.5s (per SC-001)
- **Concurrent Updates**: Handle 10 simultaneous updates via row-level locking
- **Image Upload**: Cloudinary upload < 3s for 5MB file
- **Notification Delivery**: Async, non-blocking (no impact on API response time)

---

## Security Checklist

- [x] JWT authentication required
- [x] Ownership validation (organization_id match)
- [x] Role-based access (Staff only)
- [x] Input validation with Zod
- [x] SQL injection prevention (Prisma parameterized queries)
- [x] File upload validation (type, size)
- [x] XSS prevention (sanitize text inputs)
- [x] Audit trail for critical changes
- [x] Rate limiting (60 req/min per user)

---

**Version**: 1.0  
**Status**: Ready for Implementation  
**Last Updated**: 2026-06-29


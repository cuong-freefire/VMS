# API Contract: DELETE /api/v1/events/:id

**Version**: 1.0  
**Feature**: Delete Event (UC17)  
**Owner**: Member 3 - TienTD  
**Last Updated**: 2026-06-29

---

## Overview

**Purpose**: Soft delete event with ownership and constraint validation.

**Authentication**: Required (JWT HttpOnly Cookie)  
**Authorization**: Staff role, same organization as event  
**Rate Limit**: 60 requests/minute per user

---

## Endpoint Specification

```http
DELETE /api/v1/events/:id
Cookie: access_token=<JWT>
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Event ID to delete |

### Request Headers

```http
Cookie: access_token=<JWT_TOKEN>
```

### Request Body

**None** — DELETE endpoints do not accept request body.

**Example Request**:

```bash
curl -X DELETE http://localhost:3000/api/v1/events/123 \
  -H "Cookie: access_token=<JWT>"
```

---

## Response Specifications

### Success Response (200 OK)

**Scenario**: Event soft deleted successfully

```json
{
  "success": true,
  "message": "Event deleted successfully",
  "data": {
    "id": 123,
    "title": "Beach Cleanup - Nha Trang 2026",
    "status": "DRAFT",
    "deleted_at": "2026-06-29T15:30:00.000Z"
  }
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for 200 response |
| `message` | string | Success message |
| `data.id` | integer | Deleted event ID |
| `data.title` | string | Event title (for confirmation) |
| `data.status` | string | Event status at deletion time |
| `data.deleted_at` | string (ISO 8601) | Soft delete timestamp |

---

### Error Responses

#### 400 Bad Request - Invalid Event ID

**Scenario**: Event ID is not a valid integer

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAM",
    "message": "Event ID must be a valid integer",
    "details": {
      "param": "id",
      "value": "abc"
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

**Scenario**: Staff trying to delete event from different organization

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You can only delete events from your organization",
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

**Scenario 1**: Event not found

```json
{
  "success": false,
  "error": {
    "code": "EVENT_NOT_FOUND",
    "message": "Event not found or already deleted",
    "details": {
      "eventId": 123
    }
  }
}
```

**Scenario 2**: Event already soft deleted (idempotency)

```json
{
  "success": false,
  "error": {
    "code": "EVENT_NOT_FOUND",
    "message": "Event not found or already deleted",
    "details": {
      "eventId": 123,
      "deleted_at": "2026-06-28T10:00:00.000Z"
    }
  }
}
```

---

#### 409 Conflict - Business Rule Violation

**Scenario 1**: Attempting to delete non-deletable status

```json
{
  "success": false,
  "error": {
    "code": "EVENT_NOT_DELETABLE",
    "message": "Cannot delete events with status: IN_PROGRESS. Only DRAFT, PUBLISHED, and CANCELLED events can be deleted.",
    "details": {
      "eventId": 123,
      "currentStatus": "IN_PROGRESS",
      "deletableStatuses": ["DRAFT", "PUBLISHED", "CANCELLED"]
    }
  }
}
```

**Scenario 2**: Event has existing applications (CRITICAL BUSINESS RULE)

```json
{
  "success": false,
  "error": {
    "code": "EVENT_HAS_APPLICATIONS",
    "message": "Cannot delete event with existing applications. Found 15 application(s). Please cancel the event instead.",
    "details": {
      "eventId": 123,
      "applicationCount": 15,
      "suggestion": "Use 'Cancel Event' feature to handle events with applications"
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

**Scenario 2**: Transaction rollback

```json
{
  "success": false,
  "error": {
    "code": "TRANSACTION_FAILED",
    "message": "Failed to delete event. Transaction rolled back.",
    "details": {
      "reason": "Deadlock detected during concurrent operation"
    }
  }
}
```

---

## Status-Based Delete Rules

### DRAFT Events

**Can Delete**: ✅ YES (if no applications)  
**Confirmation Required**: ❌ NO (single click)

**Example Request**:

```bash
DELETE /api/v1/events/123
```

**Success Response**:

```json
{
  "success": true,
  "message": "Event deleted successfully",
  "data": {
    "id": 123,
    "title": "Beach Cleanup - Draft",
    "status": "DRAFT",
    "deleted_at": "2026-06-29T15:30:00.000Z"
  }
}
```

---

### PUBLISHED Events

**Can Delete**: ✅ YES (if no applications)  
**Confirmation Required**: ✅ YES (double confirmation - FR-003)

**Frontend Flow**:

1. User clicks "Delete" button
2. Frontend shows modal: "This published event has no applications yet. Are you sure you want to delete?"
3. User confirms → Frontend sends DELETE request
4. Backend validates and deletes

**Backend Response** (same as DRAFT):

```json
{
  "success": true,
  "message": "Event deleted successfully",
  "data": {
    "id": 123,
    "title": "Beach Cleanup - Published",
    "status": "PUBLISHED",
    "deleted_at": "2026-06-29T15:30:00.000Z"
  }
}
```

---

### IN_PROGRESS / COMPLETED Events

**Can Delete**: ❌ NO  
**Reason**: Historical record must be preserved

**Example Request**:

```bash
DELETE /api/v1/events/123
```

**Error Response**:

```json
{
  "success": false,
  "error": {
    "code": "EVENT_NOT_DELETABLE",
    "message": "Cannot delete events with status: IN_PROGRESS. Only DRAFT, PUBLISHED, and CANCELLED events can be deleted.",
    "details": {
      "eventId": 123,
      "currentStatus": "IN_PROGRESS",
      "deletableStatuses": ["DRAFT", "PUBLISHED", "CANCELLED"]
    }
  }
}
```

---

### CANCELLED Events

**Can Delete**: ⚠️ YES (if no applications - edge case)  
**Confirmation Required**: ❌ NO

**Use Case**: Cleanup of cancelled events that never had participants

**Example Response**:

```json
{
  "success": true,
  "message": "Event deleted successfully",
  "data": {
    "id": 123,
    "title": "Beach Cleanup - Cancelled",
    "status": "CANCELLED",
    "deleted_at": "2026-06-29T15:30:00.000Z"
  }
}
```

---

## Application Constraint (CRITICAL)

### Business Rule (FR-002)

> "Không được phép xóa sự kiện đã có ít nhất một đơn đăng ký (ngay cả khi đơn đó đang ở trạng thái Pending)."

**Implementation**:

```javascript
// Check ALL applications (PENDING, APPROVED, REJECTED)
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

### Test Cases

**Test 1: Event with PENDING applications**

```bash
# Setup: Event 123 has 5 PENDING applications
DELETE /api/v1/events/123
```

**Expected**: 409 Conflict

```json
{
  "success": false,
  "error": {
    "code": "EVENT_HAS_APPLICATIONS",
    "message": "Cannot delete event with existing applications. Found 5 application(s). Please cancel the event instead.",
    "details": {
      "eventId": 123,
      "applicationCount": 5,
      "suggestion": "Use 'Cancel Event' feature to handle events with applications"
    }
  }
}
```

**Test 2: Event with APPROVED applications**

```bash
# Setup: Event 123 has 10 APPROVED applications
DELETE /api/v1/events/123
```

**Expected**: 409 Conflict (same as above, count = 10)

**Test 3: Event with REJECTED applications**

```bash
# Setup: Event 123 has 3 REJECTED applications
DELETE /api/v1/events/123
```

**Expected**: 409 Conflict (even REJECTED applications block deletion)

**Test 4: Event with NO applications**

```bash
# Setup: Event 123 has 0 applications
DELETE /api/v1/events/123
```

**Expected**: 200 OK (deletion allowed)

---

## Audit Logging

### Audit Log Entry

Every successful deletion creates an entry in `event_audit_log`:

```json
{
  "id": 456,
  "event_id": 123,
  "changed_by": 10,
  "changed_at": "2026-06-29T15:30:00.000Z",
  "field_name": "deleted_at",
  "old_value": null,
  "new_value": "2026-06-29T15:30:00.000Z"
}
```

### Query Audit History

```sql
-- Get deletion history for an event
SELECT * FROM event_audit_log 
WHERE event_id = 123 
  AND field_name = 'deleted_at';

-- Get all deletions by a staff member
SELECT e.title, eal.* 
FROM event_audit_log eal
JOIN events e ON e.id = eal.event_id
WHERE eal.changed_by = 10 
  AND eal.field_name = 'deleted_at'
ORDER BY eal.changed_at DESC;
```

---

## Soft Delete Behavior

### What Happens on Delete

**Event Record**:
- `deleted_at` = NOW()
- `updated_at` = NOW()
- `updated_by` = Staff user_id
- All other fields remain unchanged

**Related Data** (preserved):
- ✅ `volunteer_applications` — Preserved (block delete if exist)
- ✅ `event_audit_log` — Preserved (immutable)
- ✅ `notifications` — Preserved (historical record)
- ✅ `donations` — Preserved (financial compliance - FR-016)
- ⚠️ `tasks` — Soft deleted via TaskService.cancelTasksByEventId() (FR-004)

### Query Behavior After Delete

**GET /events (list)**:

```javascript
// Soft-deleted events excluded from list
const events = await prisma.events.findMany({
  where: {
    is_active: true,
    deleted_at: null  // NEW filter
  }
});
```

**GET /events/:id (single)**:

```javascript
// Soft-deleted event returns 404
const event = await prisma.events.findUnique({
  where: { 
    id: eventId,
    deleted_at: null  // Must be active
  }
});

if (!event) {
  throw new NotFoundError('Event not found');
}
```

**Admin View (future feature - out of scope)**:

```javascript
// Admin can view soft-deleted events
const deletedEvents = await prisma.events.findMany({
  where: {
    deleted_at: { not: null }
  },
  orderBy: {
    deleted_at: 'desc'
  }
});
```

---

## Swagger JSDoc Annotation

```javascript
/**
 * @swagger
 * /api/v1/events/{id}:
 *   delete:
 *     summary: Delete event (soft delete)
 *     description: |
 *       Soft delete event with ownership and constraint validation.
 *       
 *       **Status-Based Rules**:
 *       - DRAFT/PUBLISHED/CANCELLED: Can delete if no applications
 *       - IN_PROGRESS/COMPLETED: Cannot delete (historical record)
 *       
 *       **Application Constraint**:
 *       - Cannot delete if ANY applications exist (PENDING/APPROVED/REJECTED)
 *       
 *       **Confirmation Required**:
 *       - DRAFT/CANCELLED: Single click
 *       - PUBLISHED: Double confirmation (frontend)
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
 *         description: Event ID to delete
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Event deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 123
 *                     title:
 *                       type: string
 *                       example: "Beach Cleanup - Nha Trang 2026"
 *                     status:
 *                       type: string
 *                       example: "DRAFT"
 *                     deleted_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-06-29T15:30:00.000Z"
 *       400:
 *         description: Invalid event ID
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
 *         description: Event not found or already deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *       409:
 *         description: Business rule violation (status not deletable or has applications)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConflictError'
 *             examples:
 *               statusNotDeletable:
 *                 summary: Event status not deletable
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "EVENT_NOT_DELETABLE"
 *                     message: "Cannot delete events with status: IN_PROGRESS"
 *                     details:
 *                       eventId: 123
 *                       currentStatus: "IN_PROGRESS"
 *                       deletableStatuses: ["DRAFT", "PUBLISHED", "CANCELLED"]
 *               hasApplications:
 *                 summary: Event has applications
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "EVENT_HAS_APPLICATIONS"
 *                     message: "Cannot delete event with existing applications. Found 15 application(s)."
 *                     details:
 *                       eventId: 123
 *                       applicationCount: 15
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

### Test Suite: event.delete.test.js

```javascript
describe('DELETE /api/v1/events/:id', () => {
  describe('Success Cases (200)', () => {
    it('should delete DRAFT event with no applications', async () => {
      // Given: DRAFT event, no applications, owned by logged-in staff
      // When: DELETE request
      // Then: 200 OK, deleted_at set, audit log created
    });
    
    it('should delete PUBLISHED event with no applications', async () => {
      // Given: PUBLISHED event, no applications
      // When: DELETE request
      // Then: 200 OK, deleted_at set
    });
    
    it('should delete CANCELLED event with no applications', async () => {
      // Given: CANCELLED event, no applications
      // When: DELETE request
      // Then: 200 OK, deleted_at set
    });
  });
  
  describe('Validation Errors (400)', () => {
    it('should reject invalid event ID', async () => {
      // When: DELETE /events/abc
      // Then: 400 Bad Request
    });
  });
  
  describe('Authorization Errors (401/403)', () => {
    it('should reject request without JWT', async () => {
      // When: DELETE without Cookie header
      // Then: 401 Unauthorized
    });
    
    it('should reject staff from different organization', async () => {
      // Given: Event from Org A, Staff from Org B
      // When: DELETE request
      // Then: 403 Forbidden
    });
  });
  
  describe('Not Found Errors (404)', () => {
    it('should return 404 for non-existent event', async () => {
      // When: DELETE /events/99999
      // Then: 404 Not Found
    });
    
    it('should return 404 for already-deleted event (idempotency)', async () => {
      // Given: Event with deleted_at = '2026-06-28T10:00:00Z'
      // When: DELETE request
      // Then: 404 Not Found
    });
    
    it('should return 404 for inactive event', async () => {
      // Given: Event with is_active = FALSE
      // When: DELETE request
      // Then: 404 Not Found
    });
  });
  
  describe('Conflict Errors (409)', () => {
    it('should block delete on IN_PROGRESS event', async () => {
      // Given: Event with status = IN_PROGRESS
      // When: DELETE request
      // Then: 409 Conflict, error code = EVENT_NOT_DELETABLE
    });
    
    it('should block delete on COMPLETED event', async () => {
      // Given: Event with status = COMPLETED
      // When: DELETE request
      // Then: 409 Conflict
    });
    
    it('should block delete on event with PENDING applications', async () => {
      // Given: Event with 5 PENDING applications
      // When: DELETE request
      // Then: 409 Conflict, error code = EVENT_HAS_APPLICATIONS, applicationCount = 5
    });
    
    it('should block delete on event with APPROVED applications', async () => {
      // Given: Event with 10 APPROVED applications
      // When: DELETE request
      // Then: 409 Conflict, applicationCount = 10
    });
    
    it('should block delete on event with REJECTED applications', async () => {
      // Given: Event with 3 REJECTED applications
      // When: DELETE request
      // Then: 409 Conflict, applicationCount = 3
    });
    
    it('should block delete on event with mixed application statuses', async () => {
      // Given: Event with 5 PENDING + 3 APPROVED + 2 REJECTED = 10 total
      // When: DELETE request
      // Then: 409 Conflict, applicationCount = 10
    });
  });
  
  describe('Audit Logging', () => {
    it('should create audit log entry on successful delete', async () => {
      // Given: DRAFT event
      // When: DELETE request
      // Then: 200 OK, event_audit_log entry created with field_name = 'deleted_at'
    });
    
    it('should record staff user_id in audit log', async () => {
      // Given: Staff with user_id = 10
      // When: DELETE request
      // Then: Audit log has changed_by = 10
    });
  });
  
  describe('Soft Delete Behavior', () => {
    it('should set deleted_at timestamp', async () => {
      // Given: DRAFT event
      // When: DELETE request at '2026-06-29T15:30:00Z'
      // Then: Event.deleted_at = '2026-06-29T15:30:00Z'
    });
    
    it('should exclude soft-deleted event from GET /events list', async () => {
      // Given: Event deleted successfully
      // When: GET /events
      // Then: Deleted event not in response
    });
    
    it('should return 404 for soft-deleted event on GET /events/:id', async () => {
      // Given: Event deleted successfully
      // When: GET /events/123
      // Then: 404 Not Found
    });
    
    it('should preserve all event fields except deleted_at', async () => {
      // Given: Event with title, location, etc.
      // When: DELETE request
      // Then: All fields unchanged except deleted_at, updated_at, updated_by
    });
  });
  
  describe('Transaction Atomicity', () => {
    it('should rollback if audit log creation fails', async () => {
      // Given: Event deletion succeeds, audit log fails
      // When: DELETE request
      // Then: 500 error, event NOT deleted (transaction rolled back)
    });
  });
});
```

---

## Performance Requirements

- **Response Time**: < 500ms (per data-model.md)
- **Concurrent Deletes**: Handle 10 simultaneous deletes via row-level locking
- **Application Count Check**: < 100ms (indexed query)
- **Transaction Completion**: < 500ms (includes audit log)

---

## Security Checklist

- [x] JWT authentication required
- [x] Ownership validation (organization_id match)
- [x] Role-based access (Staff only)
- [x] SQL injection prevention (Prisma parameterized queries)
- [x] Audit trail for all deletions
- [x] Soft delete only (no data loss risk)
- [x] ACID transaction (prevents partial deletes)
- [x] Rate limiting (60 req/min per user)
- [x] Idempotency (deleting already-deleted event returns 404, not 200)

---

## Frontend Integration Guide

### Vue/React Component Example

```javascript
// EventDeleteButton.jsx
import { useState } from 'react';
import axios from 'axios';

export function EventDeleteButton({ event, onDeleted }) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    // FR-003: Double confirmation for PUBLISHED events
    if (event.status === 'PUBLISHED') {
      const confirmed = window.confirm(
        'This published event has no applications yet. Are you sure you want to delete?'
      );
      if (!confirmed) return;
    }
    
    setIsDeleting(true);
    
    try {
      const response = await axios.delete(`/api/v1/events/${event.id}`, {
        withCredentials: true  // Send JWT cookie
      });
      
      alert(response.data.message); // "Event deleted successfully"
      onDeleted(event.id);
    } catch (error) {
      if (error.response?.status === 409) {
        // Business rule violation
        const { code, message } = error.response.data.error;
        
        if (code === 'EVENT_HAS_APPLICATIONS') {
          alert(
            'Cannot delete event with existing applications. ' +
            'Please cancel the event instead.'
          );
        } else if (code === 'EVENT_NOT_DELETABLE') {
          alert(
            'Cannot delete events in progress or completed. ' +
            'Only draft, published, or cancelled events can be deleted.'
          );
        }
      } else if (error.response?.status === 403) {
        alert('You can only delete events from your organization.');
      } else {
        alert('Failed to delete event. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Only show delete button for deletable statuses
  const isDeletable = ['DRAFT', 'PUBLISHED', 'CANCELLED'].includes(event.status);
  
  return isDeletable ? (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="btn btn-danger"
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  ) : null;
}
```

---

**Version**: 1.0  
**Status**: Ready for Implementation  
**Last Updated**: 2026-06-29

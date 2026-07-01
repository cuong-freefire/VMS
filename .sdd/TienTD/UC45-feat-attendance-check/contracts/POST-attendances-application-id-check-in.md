# API Contract: Single Attendance Check-in

**Endpoint**: `POST /api/v1/attendances/:applicationId/check-in`  
**Feature**: UC45 - Attendance Check  
**User Story**: US1 - Single check-in from attendance list  
**Authentication**: Required (JWT token)  
**Authorization**: Staff role + Organization ownership  

---

## Overview

Staff thực hiện điểm danh (check-in) cho một tình nguyện viên có mặt tại sự kiện. Hệ thống sẽ:
1. Validate application thuộc organization của Staff
2. Check application status = APPROVED
3. Validate event status (PUBLISHED hoặc IN_PROGRESS)
4. Create attendance record với status = PRESENT
5. Log audit trail với Staff ID và timestamp

**Key Characteristics**:
- Immutable: Attendance record KHÔNG được UPDATE sau khi tạo
- Idempotent: Duplicate check-in attempts return 409 Conflict (database UNIQUE constraint)
- volunteer_hours: Set NULL (UC45 không nhập, update sau event)

---

## Request

### HTTP Method
`POST`

### Path Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `applicationId` | Integer | ✅ YES | Application ID to check-in | `123` |

### Request Headers

| Header | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `Authorization` | String | ✅ YES | JWT Bearer token | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `Content-Type` | String | ✅ YES | Must be `application/json` | `application/json` |

### Request Body

**Optional** - notes field is optional.

**Schema**:
```json
{
  "notes": "string (max 500 chars, optional)"
}
```

**Example 1** (with notes):
```json
{
  "notes": "Volunteer arrived on time, assigned to Zone A"
}
```

**Example 2** (without notes):
```json
{}
```

**Validation Rules**:
- `notes`: Optional string, max length 500 characters
- Empty string (`""`) treated as null (no notes)
- Whitespace-only strings trimmed to null

### Authentication & Authorization

**JWT Token Payload** (extracted from token):
```json
{
  "userId": "staff-uuid-123",
  "role": "STAFF",
  "organizationId": "org-uuid-456"
}
```

**Authorization Rules**:
1. ✅ Token must be valid (not expired, signature verified)
2. ✅ User role must be `STAFF` or higher (`MANAGER`, `ADMIN`)
3. ✅ Application's event MUST belong to same organization as Staff's `organizationId`
4. ❌ If organization mismatch → 403 Forbidden

---

## Response

### Success Response (201 Created)

**Scenario**: Volunteer successfully checked in

**Response Body**:
```json
{
  "success": true,
  "message": "Volunteer checked in successfully",
  "data": {
    "attendance": {
      "id": 789,
      "application_id": 123,
      "volunteer_id": 45,
      "volunteer_name": "Nguyễn Văn A",
      "status": "PRESENT",
      "volunteer_hours": null,
      "checked_in_by": "staff-uuid-123",
      "checked_in_at": "2026-06-29T14:30:15.123Z",
      "notes": "Volunteer arrived on time, assigned to Zone A"
    }
  }
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `attendance.id` | Integer | Attendance record ID (auto-generated) |
| `attendance.application_id` | Integer | Application ID (matches request param) |
| `attendance.volunteer_id` | Integer | Volunteer user ID (from application.user_id) |
| `attendance.volunteer_name` | String | Volunteer full name (for frontend display) |
| `attendance.status` | String | Always `"PRESENT"` for check-in |
| `attendance.volunteer_hours` | Null | Always null (UC45 doesn't set, update later) |
| `attendance.checked_in_by` | UUID | Staff who performed check-in (from JWT) |
| `attendance.checked_in_at` | ISO8601 | Timestamp when checked in (server time) |
| `attendance.notes` | String? | Optional notes (null if not provided) |

---

### Error Responses

#### 400 Bad Request - Invalid Application Status

**Scenario**: Application is not in APPROVED state

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_APPLICATION_STATUS",
    "message": "Cannot check-in application with status PENDING. Only APPROVED applications can be checked in.",
    "details": {
      "application_id": 123,
      "current_status": "PENDING",
      "required_status": "APPROVED",
      "suggestion": "Wait for application approval (UC24) before check-in"
    }
  }
}
```

---

#### 400 Bad Request - Invalid Event Status

**Scenario**: Event is COMPLETED or CANCELLED

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_EVENT_STATUS",
    "message": "Cannot check-in for event with status COMPLETED. Event must be PUBLISHED or IN_PROGRESS.",
    "details": {
      "event_id": 101,
      "event_title": "Beach Cleanup 2026",
      "current_status": "COMPLETED",
      "valid_statuses": ["PUBLISHED", "IN_PROGRESS"]
    }
  }
}
```

---

#### 400 Bad Request - Invalid Notes Length

**Scenario**: notes field exceeds 500 characters

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Notes must not exceed 500 characters",
    "details": {
      "field": "notes",
      "provided_length": 612,
      "max_length": 500
    }
  }
}
```

---

#### 400 Bad Request - Invalid Application ID Format

**Scenario**: `applicationId` parameter is not a valid positive integer

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_ID",
    "message": "Application ID must be a positive integer",
    "details": {
      "provided_id": "not-a-number",
      "expected_format": "positive integer"
    }
  }
}
```

---

#### 401 Unauthorized - Missing or Invalid Token

**Scenario**: No Authorization header or invalid JWT token

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please provide a valid JWT token.",
    "details": {
      "header_missing": true
    }
  }
}
```

---

#### 403 Forbidden - Organization Mismatch

**Scenario**: Staff trying to check-in for event NOT in their organization

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "ORGANIZATION_MISMATCH",
    "message": "You can only check-in volunteers for events in your organization",
    "details": {
      "staff_organization_id": "org-uuid-456",
      "event_organization_id": "different-org-uuid-789",
      "event_id": 101,
      "event_title": "Beach Cleanup 2026"
    }
  }
}
```

---

#### 403 Forbidden - Insufficient Role

**Scenario**: User is not Staff/Manager/Admin (e.g., Volunteer trying to check-in)

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_ROLE",
    "message": "Only Staff, Manager, or Admin can check-in volunteers",
    "details": {
      "current_role": "VOLUNTEER",
      "required_roles": ["STAFF", "MANAGER", "ADMIN"]
    }
  }
}
```

---

#### 404 Not Found - Application Does Not Exist

**Scenario**: No application found with given ID

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Application not found",
    "details": {
      "application_id": 123,
      "resource_type": "APPLICATION"
    }
  }
}
```

---

#### 409 Conflict - Already Checked In

**Scenario**: Volunteer already checked in for this event (UNIQUE constraint violation)

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_CHECK_IN",
    "message": "Volunteer already checked in for this event",
    "details": {
      "application_id": 123,
      "attendance_id": 789,
      "volunteer_name": "Nguyễn Văn A",
      "previous_check_in_at": "2026-06-29T10:15:30.000Z",
      "checked_in_by_staff_id": "previous-staff-uuid-999"
    }
  }
}
```

**Note**: This is enforced by database UNIQUE constraint on `attendances.application_id`.

---

#### 500 Internal Server Error

**Scenario**: Unexpected server error (database down, connection timeout, etc.)

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred while checking in volunteer",
    "details": {
      "error_id": "err-20260629-143015-abc123",
      "timestamp": "2026-06-29T14:30:15.123Z"
    }
  }
}
```

**Note**: Error details MUST NOT leak sensitive information (no stack traces in production).

---

## Business Rules

### Application State Rules
- ✅ **APPROVED → Check-in**: Allowed (primary flow)
- ❌ **PENDING → Check-in**: Forbidden (application not yet approved)
- ❌ **REJECTED → Check-in**: Forbidden (application rejected)
- ❌ **WITHDRAWN → Check-in**: Forbidden (volunteer withdrew)
- ❌ **CANCELLED → Check-in**: Forbidden (application cancelled)

**Rationale**: Only approved volunteers should be allowed on-site.

### Event State Rules
- ✅ **PUBLISHED → Check-in**: Allowed (early arrivals before event starts)
- ✅ **IN_PROGRESS → Check-in**: Allowed (primary use case)
- ❌ **DRAFT → Check-in**: Forbidden (event not ready)
- ❌ **COMPLETED → Check-in**: Forbidden (event ended)
- ❌ **CANCELLED → Check-in**: Forbidden (event cancelled)

**Rationale**: Check-in only makes sense for active or upcoming events.

### Immutability Rule (from RQ1 decision)
- Attendance record is **immutable** after creation
- ✅ CANNOT UPDATE: `status`, `checked_in_at`, `checked_in_by`
- ✅ CAN UPDATE (future UC): `volunteer_hours` (NULL → actual hours)
- ✅ CAN UPDATE (low priority): `notes` (append/edit notes)

**Rationale**: Maintain audit trail integrity for certificate generation (UC53).

### volunteer_hours Handling (from RQ1 decision)
- UC45 sets `volunteer_hours = NULL` (not calculated at check-in)
- Staff will update hours after event via future UC or manual update
- Certificate generation (UC53) must validate `volunteer_hours IS NOT NULL`

---

## Implementation Notes

### Service Layer Logic
```javascript
// attendance.service.js - checkIn()
async checkIn(applicationId, staffId, data = {}) {
  // 1. Get application with event data
  const application = await applicationRepository.getById(applicationId, {
    include: { event: true, user: true }
  });
  
  if (!application) {
    throw new NotFoundError('Application not found');
  }
  
  // 2. Validate application status
  if (application.status !== 'APPROVED') {
    throw new BadRequestError(
      `Cannot check-in application with status ${application.status}. Only APPROVED applications can be checked in.`
    );
  }
  
  // 3. Validate event status
  const validEventStatuses = ['PUBLISHED', 'IN_PROGRESS'];
  if (!validEventStatuses.includes(application.event.status)) {
    throw new BadRequestError(
      `Cannot check-in for event with status ${application.event.status}. Event must be PUBLISHED or IN_PROGRESS.`
    );
  }
  
  // 4. Authorization check (organization ownership)
  await authorizationService.checkStaffOrganizationAccess(
    staffId, 
    application.event.id
  );
  
  // 5. Validation: notes max 500 chars
  if (data.notes && data.notes.length > 500) {
    throw new ValidationError('Notes must not exceed 500 characters');
  }
  
  // 6. Create attendance record
  try {
    const attendance = await attendanceRepository.create({
      application_id: applicationId,
      status: 'PRESENT',
      volunteer_hours: null, // RQ1 decision: Not set by UC45
      checked_in_by: staffId,
      checked_in_at: new Date(),
      notes: data.notes?.trim() || null
    });
    
    // 7. Log audit trail
    logger.info('Attendance check-in completed', {
      attendance_id: attendance.id,
      application_id: applicationId,
      volunteer_id: application.user_id,
      event_id: application.event_id,
      staff_id: staffId
    });
    
    return {
      ...attendance,
      volunteer_id: application.user_id,
      volunteer_name: application.user.full_name
    };
  } catch (error) {
    // 8. Handle UNIQUE constraint violation (duplicate check-in)
    if (error.code === 'P2002' && error.meta?.target?.includes('application_id')) {
      // Get existing attendance for details
      const existing = await attendanceRepository.getByApplicationId(applicationId);
      throw new ConflictError('Volunteer already checked in for this event', {
        application_id: applicationId,
        attendance_id: existing.id,
        previous_check_in_at: existing.checked_in_at,
        checked_in_by_staff_id: existing.checked_in_by
      });
    }
    throw error;
  }
}
```

### Controller Layer
```javascript
// attendance.controller.js - checkIn()
async checkIn(req, res, next) {
  try {
    const { applicationId } = req.params;
    const { notes } = req.body;
    const { userId: staffId } = req.user; // From JWT token
    
    // Validate applicationId is positive integer
    const appIdNum = parseInt(applicationId, 10);
    if (isNaN(appIdNum) || appIdNum <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Application ID must be a positive integer'
        }
      });
    }
    
    const result = await attendanceService.checkIn(
      appIdNum,
      staffId,
      { notes }
    );
    
    return res.status(201).json({
      success: true,
      message: 'Volunteer checked in successfully',
      data: {
        attendance: result
      }
    });
  } catch (error) {
    next(error); // Error middleware handles error codes
  }
}
```

### Zod Validation Schema
```javascript
// attendance.validator.js
import { z } from 'zod';

export const checkInSchema = z.object({
  notes: z.string().max(500).optional()
    .transform(val => val?.trim() || null) // Trim whitespace, convert empty to null
});

export const applicationIdParamSchema = z.object({
  applicationId: z.string().regex(/^\d+$/, 'Application ID must be a positive integer')
    .transform(val => parseInt(val, 10))
});
```

### Route Registration
```javascript
// attendance.routes.js
import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { attendanceController } from '../controllers/attendance.controller.js';
import { checkInSchema, applicationIdParamSchema } from '../validators/attendance.validator.js';

const router = express.Router();

router.post(
  '/:applicationId/check-in',
  authMiddleware, // Extract JWT token → req.user
  validateRequest({ params: applicationIdParamSchema, body: checkInSchema }), // Zod validation
  attendanceController.checkIn
);

export default router;
```

---

## Testing Scenarios

### Happy Path Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T001 | Check-in APPROVED application with notes | 201 Created, attendance record created |
| T002 | Check-in APPROVED application without notes | 201 Created, notes = null |
| T003 | Check-in during PUBLISHED event (early arrival) | 201 Created |
| T004 | Check-in during IN_PROGRESS event (normal flow) | 201 Created |

### Validation Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T005 | Check-in with 500-char notes (max length) | 201 Created |
| T006 | Check-in with 501-char notes (over limit) | 400 Bad Request, VALIDATION_ERROR |
| T007 | Check-in with whitespace-only notes | 201 Created, notes = null (trimmed) |
| T008 | Check-in with special characters in notes | 201 Created, characters preserved |

### Error Tests - Application State

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T009 | Check-in PENDING application | 400 Bad Request, INVALID_APPLICATION_STATUS |
| T010 | Check-in REJECTED application | 400 Bad Request, INVALID_APPLICATION_STATUS |
| T011 | Check-in WITHDRAWN application | 400 Bad Request, INVALID_APPLICATION_STATUS |
| T012 | Check-in CANCELLED application | 400 Bad Request, INVALID_APPLICATION_STATUS |

### Error Tests - Event State

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T013 | Check-in for DRAFT event | 400 Bad Request, INVALID_EVENT_STATUS |
| T014 | Check-in for COMPLETED event | 400 Bad Request, INVALID_EVENT_STATUS |
| T015 | Check-in for CANCELLED event | 400 Bad Request, INVALID_EVENT_STATUS |

### Error Tests - Authorization

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T016 | Check-in without token | 401 Unauthorized |
| T017 | Check-in with expired token | 401 Unauthorized |
| T018 | Check-in cross-organization application | 403 Forbidden, ORGANIZATION_MISMATCH |
| T019 | Check-in as Volunteer role | 403 Forbidden, INSUFFICIENT_ROLE |

### Error Tests - Resource Not Found

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T020 | Check-in non-existent application | 404 Not Found |
| T021 | Check-in with invalid applicationId format | 400 Bad Request, INVALID_ID |

### Error Tests - Duplicate

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T022 | Check-in already checked-in volunteer | 409 Conflict, DUPLICATE_CHECK_IN |
| T023 | Concurrent check-in same volunteer (2 Staff) | 1 succeeds (201), 1 fails (409) |

---

## Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Response Time (p50) | <200ms | Load test with 50 concurrent users |
| Response Time (p95) | <800ms | Load test with 50 concurrent users |
| Response Time (p99) | <1000ms | Load test with 50 concurrent users |
| Throughput | >100 req/s | Single server instance |
| Database Queries | ≤4 queries | Query log analysis |
| Transaction Duration | <100ms | Database transaction log |

**Performance Breakdown** (from research.md):
- 1 SELECT (get application + event + user) → 50ms
- 1 SELECT (authorization check) → 100ms
- 1 INSERT (attendance) → 50ms
- **Total**: ~200ms (well below 800ms target)

---

## Security Considerations

### Input Validation
- ✅ `applicationId` MUST be positive integer (regex: `/^\d+$/`)
- ✅ `notes` MUST be <= 500 chars (Zod validation)
- ✅ JWT token MUST be validated (signature, expiry, issuer)
- ✅ SQL injection prevented (Prisma ORM parameterized queries)

### Authorization
- ✅ Organization-based access control enforced at Service layer
- ✅ Role-based access control checked in auth middleware
- ✅ Direct object reference vulnerability mitigated (check organization ownership)

### Audit Trail
- ✅ Log every check-in with: `{ staff_id, application_id, volunteer_id, event_id, timestamp }`
- ❌ DO NOT log volunteer personal data beyond ID (privacy requirement)
- ✅ Log notes (it's Staff's observation, not PII)

### Rate Limiting (Optional Enhancement)
- Consider rate limiting: 100 check-ins per minute per Staff
- Prevents accidental spam or abuse

---

## Frontend Integration

### API Call Example (Axios)
```javascript
// attendanceApi.js
async checkInSingle(applicationId, notes = null) {
  const response = await axios.post(
    `/api/v1/attendances/${applicationId}/check-in`,
    { notes }, // Can be null or empty object
    {
      headers: {
        'Authorization': `Bearer ${getJwtToken()}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}
```

### UI Behavior

1. **Before click**: 
   - "Check-in" button enabled only for volunteers with `is_checked_in: false`
   - Button disabled for already checked-in volunteers (show "Checked In" badge)

2. **On click**:
   - Optional: Show dialog for notes input (can skip for fast flow)
   - Disable button, show loading spinner

3. **On success (201)**:
   - Show success toast: "Nguyễn Văn A checked in successfully"
   - Update volunteer row in list: `is_checked_in: true`
   - Display checked-in timestamp badge
   - Remove checkbox (cannot select checked-in volunteers for bulk)

4. **On error (409 - Already Checked In)**:
   - Show info toast: "Nguyễn Văn A is already checked in"
   - Update UI to reflect checked-in state (in case of race condition)
   - DO NOT show error modal (this is recoverable state)

5. **On error (4xx/5xx)**:
   - Show error toast with message
   - Re-enable button
   - Log error to monitoring service

---

## Related Endpoints

- **POST /api/v1/attendances/bulk-check-in** - Bulk check-in multiple volunteers (UC45 US2)
- **GET /api/v1/attendances/events/:eventId/checklist** - Get attendance checklist for event (UC45 support)
- **PATCH /api/v1/attendances/:id/hours** - Update volunteer hours (future UC)
- **GET /api/v1/attendances/:id** - View attendance details (UC46)

---

**Contract Version**: 1.0  
**Last Updated**: 2026-06-30  
**Status**: DRAFT - Ready for implementation

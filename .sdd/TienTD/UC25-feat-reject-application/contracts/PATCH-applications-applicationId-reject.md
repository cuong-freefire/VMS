# API Contract: Reject Single Application

**Endpoint**: `PATCH /api/v1/applications/:applicationId/reject`  
**Feature**: UC25 - Reject Application  
**User Story**: US1 - Single reject from detail page  
**Authentication**: Required (JWT token)  
**Authorization**: Staff role + Organization ownership  

---

## Overview

Staff từ chối một đơn đăng ký volunteer bằng cách chuyển trạng thái từ `SUBMITTED`/`REVIEWED` → `REJECTED`. Hệ thống sẽ:
1. Validate organization ownership (Staff chỉ reject đơn của events thuộc organization mình)
2. Check state transition rules (không reject đơn đã APPROVED hoặc đã REJECTED)
3. Update application status + timestamp + rejection_reason + processed_by_staff_id
4. Create email job trong `email_queue` table (reuse UC24 transactional outbox pattern)
5. Log audit trail

**Key Difference from UC24 Approve**: rejection_reason is OPTIONAL (max 500 chars) per RQ1 decision.

---

## Request

### HTTP Method
`PATCH`

### Path Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `applicationId` | UUID | ✅ YES | Application ID to reject | `550e8400-e29b-41d4-a716-446655440000` |

### Request Headers

| Header | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `Authorization` | String | ✅ YES | JWT Bearer token | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `Content-Type` | String | ✅ YES | Must be `application/json` | `application/json` |

### Request Body

**Optional** - rejection_reason field is optional per RQ1 decision.

**Schema**:
```json
{
  "rejection_reason": "string (max 500 chars, optional)"
}
```

**Example 1** (with rejection reason):
```json
{
  "rejection_reason": "Hồ sơ chưa đủ kinh nghiệm tổ chức sự kiện quy mô lớn"
}
```

**Example 2** (without rejection reason):
```json
{}
```

**Validation Rules**:
- `rejection_reason`: Optional string, max length 500 characters
- Empty string (`""`) treated as null (no reason provided)
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

### Success Response (200 OK)

**Scenario**: Application successfully rejected

**Response Body**:
```json
{
  "success": true,
  "message": "Application rejected successfully",
  "data": {
    "application": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "event_id": "event-uuid-789",
      "volunteer_id": "volunteer-uuid-012",
      "status": "REJECTED",
      "rejected_at": "2026-06-29T16:45:30.123Z",
      "rejection_reason": "Hồ sơ chưa đủ kinh nghiệm tổ chức sự kiện quy mô lớn",
      "processed_by_staff_id": "staff-uuid-123",
      "created_at": "2026-06-20T10:30:00.000Z",
      "updated_at": "2026-06-29T16:45:30.123Z"
    },
    "email_status": "QUEUED"
  }
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `application.status` | String | Always `"REJECTED"` after success |
| `application.rejected_at` | ISO8601 | Timestamp when rejected (server time) |
| `application.rejection_reason` | String? | Optional rejection reason (null if not provided) |
| `application.processed_by_staff_id` | UUID | Staff who rejected this application |
| `email_status` | String | Always `"QUEUED"` - email will be sent async by worker |

**Example Response (no rejection reason)**:
```json
{
  "success": true,
  "message": "Application rejected successfully",
  "data": {
    "application": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "REJECTED",
      "rejected_at": "2026-06-29T16:45:30.123Z",
      "rejection_reason": null,
      "processed_by_staff_id": "staff-uuid-123"
    },
    "email_status": "QUEUED"
  }
}
```

---

### Success Response - Idempotent (200 OK)

**Scenario**: Application already rejected (idempotent behavior)

**Response Body**:
```json
{
  "success": true,
  "message": "Application is already rejected",
  "data": {
    "application": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "REJECTED",
      "rejected_at": "2026-06-28T14:20:15.000Z",
      "rejection_reason": "Không phù hợp với yêu cầu sự kiện",
      "processed_by_staff_id": "previous-staff-uuid-999"
    },
    "already_rejected": true
  }
}
```

**Note**: This is NOT an error. Frontend should treat this as success and NOT show error toast.

---

### Error Responses

#### 400 Bad Request - Invalid State Transition

**Scenario**: Application is in `APPROVED` state (cannot reject approved application)

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot reject application in APPROVED state. Use cancellation workflow instead.",
    "details": {
      "application_id": "550e8400-e29b-41d4-a716-446655440000",
      "current_status": "APPROVED",
      "attempted_transition": "APPROVED → REJECTED",
      "suggestion": "Use UC26 Cancel workflow for approved applications"
    }
  }
}
```

---

#### 400 Bad Request - Invalid Rejection Reason Length

**Scenario**: rejection_reason exceeds 500 characters

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Rejection reason must not exceed 500 characters",
    "details": {
      "field": "rejection_reason",
      "provided_length": 612,
      "max_length": 500
    }
  }
}
```

---

#### 400 Bad Request - Invalid UUID Format

**Scenario**: `applicationId` parameter is not a valid UUID

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_UUID",
    "message": "Application ID must be a valid UUID",
    "details": {
      "provided_id": "not-a-uuid",
      "expected_format": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
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

**Scenario**: Staff trying to reject application for event NOT in their organization

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "ORGANIZATION_MISMATCH",
    "message": "You can only reject applications for events in your organization",
    "details": {
      "staff_organization_id": "org-uuid-456",
      "event_organization_id": "different-org-uuid-789",
      "application_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

---

#### 403 Forbidden - Insufficient Role

**Scenario**: User is not Staff/Manager/Admin (e.g., Volunteer trying to reject)

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_ROLE",
    "message": "Only Staff, Manager, or Admin can reject applications",
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
      "application_id": "550e8400-e29b-41d4-a716-446655440000",
      "resource_type": "APPLICATION"
    }
  }
}
```

---

#### 500 Internal Server Error

**Scenario**: Unexpected server error (database down, email queue insert failed, etc.)

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred while rejecting application",
    "details": {
      "error_id": "err-20260629-164530-abc123",
      "timestamp": "2026-06-29T16:45:30.123Z"
    }
  }
}
```

**Note**: Error details MUST NOT leak sensitive information (no stack traces in production).

---

## Business Rules

### State Transition Rules
- ✅ **SUBMITTED → REJECTED**: Allowed
- ✅ **REVIEWED → REJECTED**: Allowed
- ✅ **REJECTED → REJECTED**: Idempotent (no-op, return 200)
- ❌ **APPROVED → REJECTED**: Forbidden (return 400 - use cancellation workflow instead)

**Rationale**: APPROVED applications may already have attendance records, certificates, etc. Use separate cancellation workflow (future UC26) to handle this case properly.

### Rejection Reason Rules (from RQ1 decision)
- ✅ **Optional**: Staff can reject without providing reason (fast workflow)
- ✅ **Max 500 chars**: Sufficient for most rejection explanations
- ✅ **Templates available**: Frontend provides dropdown templates (see RQ4 decision)
- ✅ **Free text allowed**: Staff can type custom reason

**Common Rejection Reason Templates** (from RQ4):
1. "Hồ sơ chưa đủ kinh nghiệm"
2. "Không đáp ứng yêu cầu kỹ năng"
3. "Số lượng tình nguyện viên đã đủ"
4. "Thời gian không phù hợp"
5. "Hồ sơ không đầy đủ"
6. "Không phù hợp với yêu cầu sự kiện"

### Transactional Guarantees (reuse UC24 RQ1 decision)
- Application status update + EmailQueue job creation MUST be atomic (single DB transaction)
- If email queue insert fails → rollback status update
- If transaction commits successfully → email WILL be sent eventually (retry up to 3 times)

### Concurrency Control (reuse UC24 RQ4 decision)
- Uses status-based idempotency: `WHERE status IN ('SUBMITTED', 'REVIEWED')`
- If 2 Staff reject simultaneously → only 1 succeeds, other gets idempotent response
- No pessimistic locks (high concurrency, low conflict rate)

---

## Implementation Notes

### Service Layer Logic
```javascript
// application.service.js - rejectApplication()
async rejectApplication(applicationId, staffId, organizationId, rejectionReason = null) {
  // 1. Authorization check (organization ownership)
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { event: true }
  });
  
  if (!application) throw new NotFoundError();
  if (application.event.organization_id !== organizationId) {
    throw new ForbiddenError('ORGANIZATION_MISMATCH');
  }
  
  // 2. Validation: rejection_reason max 500 chars
  if (rejectionReason && rejectionReason.length > 500) {
    throw new ValidationError('Rejection reason must not exceed 500 characters');
  }
  
  // 3. Atomic update with status-based idempotency (mirrors UC24 pattern)
  const result = await prisma.$transaction([
    prisma.application.updateMany({
      where: {
        id: applicationId,
        status: { in: ['SUBMITTED', 'REVIEWED'] }
      },
      data: {
        status: 'REJECTED',
        rejected_at: new Date(),
        rejection_reason: rejectionReason || null, // Store null if empty
        processed_by_staff_id: staffId
      }
    }),
    prisma.emailQueue.create({
      data: {
        type: 'REJECTION_NOTIFICATION', // NEW type for UC25
        recipient_id: application.volunteer_id,
        application_id: applicationId,
        status: 'PENDING',
        metadata: {
          event_name: application.event.name,
          rejection_reason: rejectionReason
        }
      }
    })
  ]);
  
  // 4. Handle idempotent case
  if (result[0].count === 0) {
    const current = await prisma.application.findUnique({ where: { id: applicationId } });
    if (current.status === 'REJECTED') {
      return { alreadyRejected: true, application: current };
    }
    throw new BadRequestError('INVALID_STATE_TRANSITION');
  }
  
  return { application: await prisma.application.findUnique({ where: { id: applicationId } }) };
}
```

### Controller Layer
```javascript
// application.controller.js - rejectApplication()
async rejectApplication(req, res, next) {
  try {
    const { applicationId } = req.params;
    const { rejection_reason } = req.body;
    const { userId: staffId, organizationId } = req.user; // From JWT token
    
    const result = await applicationService.rejectApplication(
      applicationId, 
      staffId, 
      organizationId,
      rejection_reason
    );
    
    if (result.alreadyRejected) {
      return res.status(200).json({
        success: true,
        message: 'Application is already rejected',
        data: result
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Application rejected successfully',
      data: {
        application: result.application,
        email_status: 'QUEUED'
      }
    });
  } catch (error) {
    next(error); // Error middleware handles error codes
  }
}
```

### Zod Validation Schema
```javascript
// application.validator.js
import { z } from 'zod';

export const rejectApplicationSchema = z.object({
  rejection_reason: z.string().max(500).optional()
    .transform(val => val?.trim() || null) // Trim whitespace, convert empty to null
});
```

### Route Registration
```javascript
// application.routes.js
router.patch(
  '/:applicationId/reject',
  authMiddleware, // Extract JWT token → req.user
  validateRequest(rejectApplicationSchema), // Zod validation
  applicationController.rejectApplication
);
```

---

## Testing Scenarios

### Happy Path Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T001 | Reject SUBMITTED application with reason | 200 OK, status → REJECTED, rejection_reason set |
| T002 | Reject REVIEWED application with reason | 200 OK, status → REJECTED, rejection_reason set |
| T003 | Reject application without reason (empty body) | 200 OK, status → REJECTED, rejection_reason = null |
| T004 | Reject already REJECTED application (idempotent) | 200 OK, already_rejected: true |

### Validation Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T005 | Reject with 500-char reason (max length) | 200 OK |
| T006 | Reject with 501-char reason (over limit) | 400 Bad Request, VALIDATION_ERROR |
| T007 | Reject with whitespace-only reason | 200 OK, rejection_reason = null (trimmed) |
| T008 | Reject with special characters in reason | 200 OK, characters preserved |

### Error Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T009 | Reject APPROVED application | 400 Bad Request, INVALID_STATE_TRANSITION |
| T010 | Reject with invalid UUID | 400 Bad Request, INVALID_UUID |
| T011 | Reject without token | 401 Unauthorized |
| T012 | Reject with expired token | 401 Unauthorized |
| T013 | Reject cross-organization application | 403 Forbidden, ORGANIZATION_MISMATCH |
| T014 | Reject as Volunteer role | 403 Forbidden, INSUFFICIENT_ROLE |
| T015 | Reject non-existent application | 404 Not Found |

### Concurrency Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T016 | 2 Staff reject same application simultaneously | 1 gets 200 OK, 1 gets idempotent 200 OK |
| T017 | Staff A rejects, Staff B approves simultaneously | Only 1 succeeds (race condition handled) |

---

## Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Response Time (p50) | <200ms | Load test with 50 concurrent users |
| Response Time (p95) | <500ms | Load test with 50 concurrent users |
| Response Time (p99) | <1000ms | Load test with 50 concurrent users |
| Throughput | >100 req/s | Single server instance |
| Database Queries | ≤3 queries | Query log analysis |
| Transaction Duration | <100ms | Database transaction log |

**Performance Assumptions**:
- MySQL on dedicated server (not shared)
- Proper indexes on `applications(status)`, `applications(event_id)`
- Email queue insert is fast (<10ms)
- No network latency to database (same datacenter)

---

## Security Considerations

### Input Validation
- ✅ `applicationId` MUST be valid UUID format (regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`)
- ✅ `rejection_reason` MUST be <= 500 chars (Zod validation)
- ✅ JWT token MUST be validated (signature, expiry, issuer)
- ✅ SQL injection prevented (Prisma ORM parameterized queries)

### Authorization
- ✅ Organization-based access control enforced at Service layer (not just Controller)
- ✅ Role-based access control checked in auth middleware
- ✅ Direct object reference vulnerability mitigated (check organization ownership)

### Audit Trail
- ✅ Log every rejection action with: `{ staff_id, application_id, event_id, rejection_reason, timestamp, old_status, new_status }`
- ❌ DO NOT log volunteer personal data (FR-016 privacy requirement)
- ✅ Log rejection_reason (it's Staff's decision rationale, not PII)

### Rate Limiting (Optional Enhancement)
- Consider rate limiting: 100 rejections per minute per Staff
- Prevents accidental bulk reject spam

---

## Frontend Integration

### API Call Example (Axios)
```javascript
// applicationApi.js
async rejectApplication(applicationId, rejectionReason = null) {
  const response = await axios.patch(
    `/api/v1/applications/${applicationId}/reject`,
    { rejection_reason: rejectionReason }, // Can be null or empty object
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

### UI Behavior (from RQ4 decision)
1. **Before click**: Button enabled if status is SUBMITTED or REVIEWED
2. **On click**: Open dialog with Autocomplete component (templates + custom text)
3. **Dialog interaction**:
   - Show common rejection reason templates in dropdown
   - Allow custom text input (freeSolo mode)
   - Character counter: "345/500 characters"
   - Optional field - can submit empty
4. **On submit**: 
   - Disable button, show loading spinner
   - Call API with rejection_reason (or null if empty)
5. **On success (200)**: 
   - Close dialog
   - Show toast: "Application rejected successfully"
   - Refresh application detail page
6. **On idempotent success (200 + already_rejected)**: 
   - Show info toast: "Application is already rejected"
   - DO NOT show error (this is expected behavior)
7. **On error (4xx/5xx)**: 
   - Keep dialog open
   - Show error message in dialog
   - Re-enable submit button

---

## Related Endpoints

- **GET /api/v1/applications/:applicationId** - View application detail (UC23)
- **PATCH /api/v1/applications/:applicationId/approve** - Approve application (UC24)
- **POST /api/v1/applications/bulk-reject** - Bulk reject multiple applications (UC25 US2)
- **PATCH /api/v1/applications/:applicationId/cancel** - Cancel approved application (UC26 - future)

---

**Contract Version**: 1.0  
**Last Updated**: 2026-06-29  
**Status**: DRAFT - Ready for implementation

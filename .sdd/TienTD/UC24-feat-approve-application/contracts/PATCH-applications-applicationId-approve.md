# API Contract: Approve Single Application

**Endpoint**: `PATCH /api/v1/applications/:applicationId/approve`  
**Feature**: UC24 - Approve Application  
**User Story**: US1 - Single approve from detail page  
**Authentication**: Required (JWT token)  
**Authorization**: Staff role + Organization ownership  

---

## Overview

Staff phê duyệt một đơn đăng ký volunteer bằng cách chuyển trạng thái từ `SUBMITTED`/`REVIEWED` → `APPROVED`. Hệ thống sẽ:
1. Validate organization ownership (Staff chỉ approve đơn của events thuộc organization mình)
2. Check capacity constraints (không vượt quá max_capacity * 1.2)
3. Update application status + timestamp + processed_by_staff_id
4. Create email job trong `email_queue` table (transactional outbox pattern)
5. Log audit trail

---

## Request

### HTTP Method
`PATCH`

### Path Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `applicationId` | UUID | ✅ YES | Application ID to approve | `550e8400-e29b-41d4-a716-446655440000` |

### Request Headers

| Header | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `Authorization` | String | ✅ YES | JWT Bearer token | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `Content-Type` | String | ✅ YES | Must be `application/json` | `application/json` |

### Request Body

**EMPTY** - This endpoint does NOT accept request body. The action is idempotent based on path parameter only.

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

**Scenario**: Application successfully approved

**Response Body**:
```json
{
  "success": true,
  "message": "Application approved successfully",
  "data": {
    "application": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "event_id": "event-uuid-789",
      "volunteer_id": "volunteer-uuid-012",
      "status": "APPROVED",
      "approved_at": "2026-06-29T16:45:30.123Z",
      "processed_by_staff_id": "staff-uuid-123",
      "created_at": "2026-06-20T10:30:00.000Z",
      "updated_at": "2026-06-29T16:45:30.123Z"
    },
    "capacity_info": {
      "current_approved": 48,
      "max_capacity": 50,
      "is_over_capacity": false,
      "warning": null
    },
    "email_status": "QUEUED"
  }
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `application.status` | String | Always `"APPROVED"` after success |
| `application.approved_at` | ISO8601 | Timestamp when approved (server time) |
| `application.processed_by_staff_id` | UUID | Staff who approved this application |
| `capacity_info.current_approved` | Integer | Total approved applications for this event (after this approval) |
| `capacity_info.is_over_capacity` | Boolean | `true` if current > max_capacity, `false` otherwise |
| `capacity_info.warning` | String? | Warning message if over capacity (e.g., "Event is over capacity: 52/50 (104%)") |
| `email_status` | String | Always `"QUEUED"` - email will be sent async by worker |

---

### Success Response - Idempotent (200 OK)

**Scenario**: Application already approved (idempotent behavior)

**Response Body**:
```json
{
  "success": true,
  "message": "Application is already approved",
  "data": {
    "application": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "APPROVED",
      "approved_at": "2026-06-28T14:20:15.000Z",
      "processed_by_staff_id": "previous-staff-uuid-999"
    },
    "already_approved": true
  }
}
```

**Note**: This is NOT an error. Frontend should treat this as success and NOT show error toast.

---

### Error Responses

#### 400 Bad Request - Invalid State Transition

**Scenario**: Application is in `REJECTED` state (cannot approve rejected application)

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot approve application in REJECTED state",
    "details": {
      "application_id": "550e8400-e29b-41d4-a716-446655440000",
      "current_status": "REJECTED",
      "attempted_transition": "REJECTED → APPROVED"
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

**Scenario**: Staff trying to approve application for event NOT in their organization

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "ORGANIZATION_MISMATCH",
    "message": "You can only approve applications for events in your organization",
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

**Scenario**: User is not Staff/Manager/Admin (e.g., Volunteer trying to approve)

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_ROLE",
    "message": "Only Staff, Manager, or Admin can approve applications",
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

#### 409 Conflict - Capacity Hard Limit Reached

**Scenario**: Event already at 120% capacity (hard limit)

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "CAPACITY_HARD_LIMIT_REACHED",
    "message": "Event capacity hard limit reached. Cannot approve more applications.",
    "details": {
      "current_approved": 60,
      "max_capacity": 50,
      "hard_limit": 60,
      "percentage": "120%",
      "event_id": "event-uuid-789",
      "suggestion": "Contact Admin to increase event max_capacity if needed"
    }
  }
}
```

**Note**: This only happens when `current_approved >= max_capacity * 1.2`. Between 100%-120%, approval is allowed with warning.

---

#### 500 Internal Server Error

**Scenario**: Unexpected server error (database down, email queue insert failed, etc.)

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred while approving application",
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
- ✅ **SUBMITTED → APPROVED**: Allowed
- ✅ **REVIEWED → APPROVED**: Allowed
- ✅ **APPROVED → APPROVED**: Idempotent (no-op, return 200)
- ❌ **REJECTED → APPROVED**: Forbidden (return 400)

### Capacity Enforcement Rules (from RQ2 decision)
| Current Approved | Max Capacity | Action | Response |
|------------------|--------------|--------|----------|
| 45 | 50 | Allow | 200 OK, `is_over_capacity: false` |
| 50 | 50 | Allow with warning | 200 OK, `is_over_capacity: false`, warning message |
| 55 | 50 | Allow with warning | 200 OK, `is_over_capacity: true`, warning: "52/50 (104%)" |
| 60 | 50 | Block | 409 Conflict (hard limit 120% reached) |

**Hard Limit Formula**: `Math.floor(max_capacity * 1.2)`

### Transactional Guarantees (from RQ1 decision)
- Application status update + EmailQueue job creation MUST be atomic (single DB transaction)
- If email queue insert fails → rollback status update
- If transaction commits successfully → email WILL be sent eventually (retry up to 3 times)

### Concurrency Control (from RQ4 decision)
- Uses status-based idempotency: `WHERE status IN ('SUBMITTED', 'REVIEWED')`
- If 2 Staff approve simultaneously → only 1 succeeds, other gets idempotent response
- No pessimistic locks (high concurrency, low conflict rate)

---

## Implementation Notes

### Service Layer Logic
```javascript
// application.service.js - approveApplication()
async approveApplication(applicationId, staffId, organizationId) {
  // 1. Authorization check (organization ownership)
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { event: true }
  });
  
  if (!application) throw new NotFoundError();
  if (application.event.organization_id !== organizationId) {
    throw new ForbiddenError('ORGANIZATION_MISMATCH');
  }
  
  // 2. Capacity check
  const capacityInfo = await this.checkCapacity(application.event_id);
  if (capacityInfo.isAtHardLimit) {
    throw new ConflictError('CAPACITY_HARD_LIMIT_REACHED', capacityInfo);
  }
  
  // 3. Atomic update with status-based idempotency
  const result = await prisma.$transaction([
    prisma.application.updateMany({
      where: {
        id: applicationId,
        status: { in: ['SUBMITTED', 'REVIEWED'] }
      },
      data: {
        status: 'APPROVED',
        approved_at: new Date(),
        processed_by_staff_id: staffId
      }
    }),
    prisma.emailQueue.create({
      data: {
        type: 'APPROVAL_NOTIFICATION',
        recipient_id: application.volunteer_id,
        application_id: applicationId,
        status: 'PENDING'
      }
    })
  ]);
  
  // 4. Handle idempotent case
  if (result[0].count === 0) {
    const current = await prisma.application.findUnique({ where: { id: applicationId } });
    if (current.status === 'APPROVED') {
      return { alreadyApproved: true, application: current };
    }
    throw new BadRequestError('INVALID_STATE_TRANSITION');
  }
  
  return { application: await prisma.application.findUnique({ where: { id: applicationId } }), capacityInfo };
}
```

### Controller Layer
```javascript
// application.controller.js - approveApplication()
async approveApplication(req, res, next) {
  try {
    const { applicationId } = req.params;
    const { userId: staffId, organizationId } = req.user; // From JWT token
    
    const result = await applicationService.approveApplication(
      applicationId, 
      staffId, 
      organizationId
    );
    
    if (result.alreadyApproved) {
      return res.status(200).json({
        success: true,
        message: 'Application is already approved',
        data: result
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Application approved successfully',
      data: {
        application: result.application,
        capacity_info: result.capacityInfo,
        email_status: 'QUEUED'
      }
    });
  } catch (error) {
    next(error); // Error middleware handles error codes
  }
}
```

### Route Registration
```javascript
// application.routes.js
router.patch(
  '/:applicationId/approve',
  authMiddleware, // Extract JWT token → req.user
  applicationController.approveApplication
);
```

---

## Testing Scenarios

### Happy Path Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T001 | Approve SUBMITTED application | 200 OK, status → APPROVED |
| T002 | Approve REVIEWED application | 200 OK, status → APPROVED |
| T003 | Approve already APPROVED application (idempotent) | 200 OK, already_approved: true |

### Capacity Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T004 | Approve when 45/50 capacity | 200 OK, is_over_capacity: false |
| T005 | Approve when 50/50 capacity | 200 OK, warning message |
| T006 | Approve when 55/50 capacity (110%) | 200 OK, is_over_capacity: true |
| T007 | Approve when 60/50 capacity (120%) | 409 Conflict |

### Error Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T008 | Approve REJECTED application | 400 Bad Request |
| T009 | Approve with invalid UUID | 400 Bad Request |
| T010 | Approve without token | 401 Unauthorized |
| T011 | Approve with expired token | 401 Unauthorized |
| T012 | Approve cross-organization application | 403 Forbidden |
| T013 | Approve as Volunteer role | 403 Forbidden |
| T014 | Approve non-existent application | 404 Not Found |

### Concurrency Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T015 | 2 Staff approve same application simultaneously | 1 gets 200 OK, 1 gets idempotent 200 OK |
| T016 | Bulk approve includes same application twice | Both succeed (idempotent) |

---

## Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Response Time (p50) | <200ms | Load test with 50 concurrent users |
| Response Time (p95) | <500ms | Load test with 50 concurrent users |
| Response Time (p99) | <1000ms | Load test with 50 concurrent users |
| Throughput | >100 req/s | Single server instance |
| Database Queries | ≤4 queries | Query log analysis |
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
- ✅ JWT token MUST be validated (signature, expiry, issuer)
- ✅ No user input in request body (eliminates injection risks)

### Authorization
- ✅ Organization-based access control enforced at Service layer (not just Controller)
- ✅ Role-based access control checked in auth middleware
- ✅ Direct object reference vulnerability mitigated (check organization ownership)

### Audit Trail
- ✅ Log every approval action with: `{ staff_id, application_id, event_id, timestamp, old_status, new_status }`
- ❌ DO NOT log volunteer personal data (FR-016 privacy requirement)

### Rate Limiting (Optional Enhancement)
- Consider rate limiting: 100 approvals per minute per Staff
- Prevents accidental bulk approve spam

---

## Frontend Integration

### API Call Example (Axios)
```javascript
// applicationApi.js
async approveApplication(applicationId) {
  const response = await axios.patch(
    `/api/v1/applications/${applicationId}/approve`,
    {}, // Empty body
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
1. **Before click**: Button enabled if status is SUBMITTED or REVIEWED
2. **On click**: Disable button immediately, show loading spinner
3. **On success (200)**: 
   - Show toast: "Application approved successfully"
   - Refresh application detail
   - If `is_over_capacity: true`, show warning badge: "⚠️ Event over capacity"
4. **On idempotent success (200 + already_approved)**: 
   - Show info toast: "Application is already approved"
   - DO NOT show error (this is expected behavior)
5. **On error (4xx/5xx)**: 
   - Re-enable button
   - Show error toast with message from response
   - If 409 Conflict (capacity), show detailed capacity info

---

## Related Endpoints

- **GET /api/v1/applications/:applicationId** - View application detail (UC23)
- **POST /api/v1/applications/bulk-approve** - Bulk approve multiple applications (UC24 US2)
- **PATCH /api/v1/applications/:applicationId/reject** - Reject application (UC26 - future)

---

**Contract Version**: 1.0  
**Last Updated**: 2026-06-29  
**Status**: DRAFT - Ready for implementation

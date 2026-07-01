# API Contract: Bulk Approve Applications

**Endpoint**: `POST /api/v1/applications/bulk-approve`  
**Feature**: UC24 - Approve Application  
**User Story**: US2 - Bulk approve from list page  
**Authentication**: Required (JWT token)  
**Authorization**: Staff role + Organization ownership  

---

## Overview

Staff phê duyệt nhiều đơn đăng ký volunteer cùng lúc từ trang danh sách (UC22). Hệ thống sẽ:
1. Validate tất cả applications thuộc cùng organization của Staff
2. Process từng application độc lập (separate transactions - từ RQ3 decision)
3. Return partial success results (succeeded vs failed với lý do)
4. Create email jobs cho tất cả successful approvals
5. Log audit trail cho mỗi approval

**Key Difference from Single Approve**:
- Multiple transactions (NOT atomic) → partial success possible
- Returns summary: `{ total, succeeded, failed }`
- Max 50 applications per request (rate limiting)

---

## Request

### HTTP Method
`POST`

### Path
`/api/v1/applications/bulk-approve`

### Request Headers

| Header | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `Authorization` | String | ✅ YES | JWT Bearer token | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `Content-Type` | String | ✅ YES | Must be `application/json` | `application/json` |

### Request Body

**Schema**:
```json
{
  "application_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Validation Rules**:
- `application_ids` (Array of UUID, required):
  - MUST be non-empty array (min length: 1)
  - MUST NOT exceed 50 items (max length: 50)
  - Each item MUST be valid UUID format
  - Duplicates are allowed (idempotent handling)

**Example**:
```json
{
  "application_ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660f9511-f3ac-52e5-b827-557766551111",
    "770g0622-g4bd-63f6-c938-668877662222"
  ]
}
```

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
3. ✅ ALL applications' events MUST belong to same organization as Staff's `organizationId`
4. ❌ If ANY application fails organization check → mark as failed (do NOT return 403 for entire request)

---

## Response

### Success Response (200 OK)

**Scenario 1**: All applications approved successfully

**Response Body**:
```json
{
  "success": true,
  "message": "Bulk approve completed successfully",
  "data": {
    "summary": {
      "total": 3,
      "succeeded": 3,
      "failed": 0,
      "duration_ms": 450
    },
    "successful": [
      "550e8400-e29b-41d4-a716-446655440000",
      "660f9511-f3ac-52e5-b827-557766551111",
      "770g0622-g4bd-63f6-c938-668877662222"
    ],
    "failed": []
  }
}
```

---

**Scenario 2**: Partial success (some approved, some failed)

**Response Body**:
```json
{
  "success": true,
  "message": "Bulk approve completed with 2 succeeded, 1 failed",
  "data": {
    "summary": {
      "total": 3,
      "succeeded": 2,
      "failed": 1,
      "duration_ms": 520
    },
    "successful": [
      "550e8400-e29b-41d4-a716-446655440000",
      "660f9511-f3ac-52e5-b827-557766551111"
    ],
    "failed": [
      {
        "application_id": "770g0622-g4bd-63f6-c938-668877662222",
        "reason": "Application is in REJECTED state",
        "error_code": "INVALID_STATE_TRANSITION"
      }
    ]
  }
}
```

**Note**: HTTP status is still 200 OK even with partial failures. Frontend must check `data.failed` array.

---

**Scenario 3**: All failed (0 succeeded)

**Response Body**:
```json
{
  "success": true,
  "message": "Bulk approve completed with 0 succeeded, 3 failed",
  "data": {
    "summary": {
      "total": 3,
      "succeeded": 0,
      "failed": 3,
      "duration_ms": 180
    },
    "successful": [],
    "failed": [
      {
        "application_id": "550e8400-e29b-41d4-a716-446655440000",
        "reason": "Organization mismatch",
        "error_code": "ORGANIZATION_MISMATCH"
      },
      {
        "application_id": "660f9511-f3ac-52e5-b827-557766551111",
        "reason": "Application not found",
        "error_code": "RESOURCE_NOT_FOUND"
      },
      {
        "application_id": "770g0622-g4bd-63f6-c938-668877662222",
        "reason": "Event capacity hard limit reached (60/50)",
        "error_code": "CAPACITY_HARD_LIMIT_REACHED"
      }
    ]
  }
}
```

---

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `summary.total` | Integer | Total applications in request |
| `summary.succeeded` | Integer | Number of successfully approved applications |
| `summary.failed` | Integer | Number of failed applications |
| `summary.duration_ms` | Integer | Total processing time in milliseconds |
| `successful` | Array<UUID> | List of successfully approved application IDs |
| `failed` | Array<Object> | List of failed applications with reasons |
| `failed[].application_id` | UUID | Application ID that failed |
| `failed[].reason` | String | Human-readable error message |
| `failed[].error_code` | String | Machine-readable error code |

---

### Error Responses

#### 400 Bad Request - Invalid Request Body

**Scenario 1**: Empty array

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "application_ids",
      "constraint": "array must contain at least 1 element",
      "provided_length": 0
    }
  }
}
```

---

**Scenario 2**: Exceeds 50 items limit

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "application_ids",
      "constraint": "array must contain at most 50 elements",
      "provided_length": 75,
      "max_allowed": 50
    }
  }
}
```

---

**Scenario 3**: Invalid UUID format

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "application_ids[2]",
      "constraint": "must be valid UUID",
      "provided_value": "not-a-uuid"
    }
  }
}
```

---

**Scenario 4**: Missing required field

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "application_ids",
      "constraint": "required field missing"
    }
  }
}
```

---

#### 401 Unauthorized - Missing or Invalid Token

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

#### 403 Forbidden - Insufficient Role

**Scenario**: User is not Staff/Manager/Admin

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_ROLE",
    "message": "Only Staff, Manager, or Admin can bulk approve applications",
    "details": {
      "current_role": "VOLUNTEER",
      "required_roles": ["STAFF", "MANAGER", "ADMIN"]
    }
  }
}
```

---

#### 500 Internal Server Error

**Scenario**: Unexpected server error during bulk processing

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred during bulk approve",
    "details": {
      "error_id": "err-20260629-165530-def456",
      "timestamp": "2026-06-29T16:55:30.123Z",
      "partial_results_lost": true
    }
  }
}
```

**Note**: If server crashes mid-processing, some applications may be approved while others are not (non-atomic by design from RQ3).

---

## Business Rules

### Transaction Isolation (from RQ3 decision)
- **Multiple independent transactions** (NOT atomic)
- Each application processed separately in its own transaction
- Partial success is acceptable and expected
- If processing crashes mid-way, successfully approved applications remain approved (can retry failed ones)

### Failure Handling
| Failure Type | Behavior | Example |
|-------------|----------|---------|
| **Invalid state transition** | Mark as failed, continue processing others | App already APPROVED → failed (idempotent) |
| **Organization mismatch** | Mark as failed, continue processing others | App belongs to different org → failed |
| **Capacity hard limit** | Mark as failed, continue processing others | Event at 120% capacity → failed |
| **Application not found** | Mark as failed, continue processing others | Invalid UUID → failed |
| **Database error** | Mark as failed, continue processing others | Connection timeout → failed |

### Idempotency
- If same application ID appears multiple times in request → all instances succeed (idempotent)
- If application already APPROVED → not treated as error, counted as success with note in logs

### Capacity Check Strategy
**Option 1**: Check capacity once before loop (fast but risky)
```javascript
// BAD: Capacity can be exceeded if multiple Staff approve simultaneously
const capacityInfo = await checkCapacity(eventId);
for (const appId of applicationIds) {
  await approveApplication(appId); // No per-application capacity check
}
```

**Option 2**: Check capacity per application (slow but safe) — **CHOSEN**
```javascript
// GOOD: Each approval checks capacity independently
for (const appId of applicationIds) {
  await approveApplication(appId); // Includes capacity check inside
}
```

**Rationale**: Individual capacity checks prevent race conditions where 2 Staff bulk-approve simultaneously and exceed hard limit.

---

## Implementation Notes

### Service Layer Logic
```javascript
// application.service.js - bulkApproveApplications()
async bulkApproveApplications(applicationIds, staffId, organizationId) {
  const startTime = Date.now();
  const results = {
    successful: [],
    failed: []
  };
  
  // Process each application independently (separate transactions)
  for (const appId of applicationIds) {
    try {
      // Reuse single approve logic (includes all validations + capacity check)
      const result = await this.approveApplication(appId, staffId, organizationId);
      
      // Handle idempotent case
      if (result.alreadyApproved) {
        results.successful.push(appId); // Count as success
        logger.info(`Application ${appId} already approved (idempotent)`);
      } else {
        results.successful.push(appId);
        logger.info(`Application ${appId} approved successfully`);
      }
    } catch (error) {
      results.failed.push({
        application_id: appId,
        reason: error.message,
        error_code: error.code || 'UNKNOWN_ERROR'
      });
      logger.warn(`Application ${appId} approval failed: ${error.message}`);
    }
  }
  
  const duration = Date.now() - startTime;
  
  return {
    summary: {
      total: applicationIds.length,
      succeeded: results.successful.length,
      failed: results.failed.length,
      duration_ms: duration
    },
    ...results
  };
}
```

### Controller Layer
```javascript
// application.controller.js - bulkApproveApplications()
async bulkApproveApplications(req, res, next) {
  try {
    const { application_ids } = req.body;
    const { userId: staffId, organizationId } = req.user;
    
    // Validation (Zod schema)
    const validatedData = bulkApproveSchema.parse({ application_ids });
    
    const results = await applicationService.bulkApproveApplications(
      validatedData.application_ids,
      staffId,
      organizationId
    );
    
    const message = results.summary.failed === 0
      ? 'Bulk approve completed successfully'
      : `Bulk approve completed with ${results.summary.succeeded} succeeded, ${results.summary.failed} failed`;
    
    return res.status(200).json({
      success: true,
      message,
      data: results
    });
  } catch (error) {
    next(error);
  }
}
```

### Validation Schema (Zod)
```javascript
// application.validator.js
import { z } from 'zod';

export const bulkApproveSchema = z.object({
  application_ids: z
    .array(z.string().uuid('Each application ID must be a valid UUID'))
    .min(1, 'Must provide at least 1 application ID')
    .max(50, 'Cannot approve more than 50 applications at once')
});
```

### Route Registration
```javascript
// application.routes.js
router.post(
  '/bulk-approve',
  authMiddleware, // Extract JWT token → req.user
  applicationController.bulkApproveApplications
);
```

---

## Testing Scenarios

### Happy Path Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T001 | Bulk approve 5 SUBMITTED applications | 200 OK, succeeded: 5, failed: 0 |
| T002 | Bulk approve 10 REVIEWED applications | 200 OK, succeeded: 10, failed: 0 |
| T003 | Bulk approve includes 2 already APPROVED (idempotent) | 200 OK, all counted as succeeded |

### Partial Success Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T004 | 5 applications: 3 SUBMITTED, 2 REJECTED | 200 OK, succeeded: 3, failed: 2 with reasons |
| T005 | 10 applications: 8 valid, 2 not found | 200 OK, succeeded: 8, failed: 2 |
| T006 | 5 applications: 4 valid, 1 cross-org | 200 OK, succeeded: 4, failed: 1 |

### Capacity Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T007 | Event at 55/50 capacity, approve 3 more (reach 58/60 hard limit) | 200 OK, succeeded: 3 |
| T008 | Event at 58/50 capacity, approve 5 more (hit 60/60 hard limit) | 200 OK, succeeded: 2, failed: 3 (capacity) |

### Validation Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T009 | Empty array | 400 Bad Request (validation error) |
| T010 | 75 application IDs (exceeds limit) | 400 Bad Request (max 50) |
| T011 | Array contains invalid UUID | 400 Bad Request (validation error) |
| T012 | Missing application_ids field | 400 Bad Request (required field) |

### Error Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T013 | No JWT token | 401 Unauthorized |
| T014 | Volunteer role attempts bulk approve | 403 Forbidden |
| T015 | All 5 applications not found | 200 OK, succeeded: 0, failed: 5 |

### Concurrency Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T016 | 2 Staff bulk approve same 10 applications simultaneously | Both get 200 OK with idempotent handling |
| T017 | Staff A approves 5, Staff B approves overlapping 3 | Both succeed with idempotent overlap |

---

## Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Response Time (10 apps) | <1s | Load test with 20 concurrent users |
| Response Time (50 apps) | <5s | Load test with 20 concurrent users |
| Throughput | >20 bulk requests/s | Single server instance |
| Database Queries | 4 × N queries (N = app count) | Query log analysis |
| Transaction Overhead | <50ms per application | Performance profiling |

**Performance Considerations**:
- Sequential processing (not parallel) to avoid race conditions on capacity
- Each application: 1 auth query + 1 capacity query + 1 update transaction + 1 email insert
- For 50 applications: ~50 × 4 = 200 queries total (~5s)
- **Future optimization**: Parallel processing with distributed locks on event_id

---

## Security Considerations

### Input Validation
- ✅ Array length validated (1-50 items)
- ✅ Each UUID validated format
- ✅ Duplicate UUIDs handled gracefully (idempotent)
- ✅ SQL injection impossible (Prisma ORM parameterized queries)

### Rate Limiting
- **Recommended**: 50 bulk approvals per minute per Staff
- **Reason**: Prevent abuse, protect database from overload
- **Implementation**: Redis-based rate limiter with sliding window

### Authorization
- ✅ Organization ownership checked per application (not just once)
- ✅ No batch authorization bypass vulnerability
- ✅ Failed authorization returns in `failed` array (not HTTP 403)

### Audit Trail
- ✅ Log bulk approve attempt with: `{ staff_id, application_count, timestamp }`
- ✅ Log each individual approval: `{ staff_id, application_id, result: 'success'|'failed', reason }`
- ❌ DO NOT log volunteer personal data

---

## Frontend Integration

### API Call Example (Axios)
```javascript
// applicationApi.js
async bulkApproveApplications(applicationIds) {
  const response = await axios.post(
    '/api/v1/applications/bulk-approve',
    { application_ids: applicationIds },
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

### UI Behavior (from RQ6 decision)

**Material UI DataGrid Selection**:
```jsx
// ApplicationListPage.jsx
import { DataGrid } from '@mui/x-data-grid';
import { useState } from 'react';

function ApplicationListPage() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [applications, setApplications] = useState([]);
  
  const handleBulkApprove = async () => {
    // Show confirmation dialog
    const confirmed = await confirmDialog({
      title: 'Bulk Approve',
      message: `Are you sure you want to approve ${selectedIds.length} applications?`
    });
    
    if (!confirmed) return;
    
    // Disable button, show loading
    setIsLoading(true);
    
    try {
      const result = await applicationApi.bulkApprove(selectedIds);
      
      // Handle partial success
      if (result.data.failed.length > 0) {
        toast.warning(
          `${result.data.summary.succeeded} approved, ${result.data.summary.failed} failed`
        );
        // Show detailed failure modal
        setFailedDetails(result.data.failed);
        setShowFailureModal(true);
      } else {
        toast.success(`${result.data.summary.succeeded} applications approved successfully`);
      }
      
      // Refresh list
      await fetchApplications();
      setSelectedIds([]); // Clear selection
    } catch (error) {
      toast.error('Bulk approve failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <DataGrid
        rows={applications}
        columns={columns}
        checkboxSelection
        onRowSelectionModelChange={(ids) => setSelectedIds(ids)}
        rowSelectionModel={selectedIds}
      />
      
      {selectedIds.length > 0 && (
        <BulkApproveButton 
          count={selectedIds.length}
          onClick={handleBulkApprove}
          disabled={isLoading}
        />
      )}
      
      {showFailureModal && (
        <FailedApprovalModal 
          failures={failedDetails}
          onClose={() => setShowFailureModal(false)}
        />
      )}
    </>
  );
}
```

**Failure Modal Component**:
```jsx
// FailedApprovalModal.jsx
function FailedApprovalModal({ failures, onClose }) {
  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Approval Failures ({failures.length})</DialogTitle>
      <DialogContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Application ID</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Error Code</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {failures.map((failure) => (
              <TableRow key={failure.application_id}>
                <TableCell>{failure.application_id.slice(0, 8)}...</TableCell>
                <TableCell>{failure.reason}</TableCell>
                <TableCell>
                  <Chip label={failure.error_code} size="small" color="error" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
```

---

## Related Endpoints

- **PATCH /api/v1/applications/:applicationId/approve** - Single approve (UC24 US1)
- **GET /api/v1/applications** - List applications (UC22)
- **GET /api/v1/applications/:applicationId** - View application detail (UC23)

---

## Comparison: Single vs Bulk Approve

| Aspect | Single Approve | Bulk Approve |
|--------|---------------|--------------|
| **HTTP Method** | PATCH | POST |
| **Request Body** | Empty | `{ application_ids: [] }` |
| **Transaction** | Single atomic transaction | Multiple independent transactions |
| **Failure Behavior** | Returns HTTP error code | Returns 200 OK with failed list |
| **Idempotency** | 200 OK if already approved | Counts idempotent as success |
| **Capacity Check** | Per request | Per application |
| **Max Throughput** | 100+ req/s | ~20 req/s (limited by sequential processing) |
| **Use Case** | Staff approve from detail page | Staff approve from list page |

---

**Contract Version**: 1.0  
**Last Updated**: 2026-06-29  
**Status**: DRAFT - Ready for implementation

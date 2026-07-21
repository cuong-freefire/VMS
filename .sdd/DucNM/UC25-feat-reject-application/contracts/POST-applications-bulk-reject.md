# API Contract: Bulk Reject Applications

**Endpoint**: `POST /api/v1/applications/bulk-reject`  
**Feature**: UC25 - Reject Application  
**User Story**: US2 - Bulk reject from list page  
**Authentication**: Required (JWT token)  
**Authorization**: Staff role + Organization ownership  

---

## Overview

Staff từ chối nhiều đơn đăng ký volunteer cùng lúc từ trang danh sách (UC22). Hệ thống sẽ:
1. Validate tất cả applications thuộc cùng organization của Staff
2. Process từng application độc lập (separate transactions - từ RQ3 decision)
3. Return partial success results (succeeded vs failed với lý do)
4. Create email jobs cho tất cả successful rejections
5. Log audit trail cho mỗi rejection
6. Apply same optional rejection_reason to all selected applications

**Key Difference from Single Reject**:
- Multiple transactions (NOT atomic) → partial success possible
- Returns summary: `{ total, succeeded, failed }`
- Max 50 applications per request (rate limiting)
- Single rejection_reason applies to ALL selected applications

---

## Request

### HTTP Method
`POST`

### Path
`/api/v1/applications/bulk-reject`

### Request Headers

| Header | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `Authorization` | String | ✅ YES | JWT Bearer token | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `Content-Type` | String | ✅ YES | Must be `application/json` | `application/json` |

### Request Body

**Schema**:
```json
{
  "application_ids": ["uuid1", "uuid2", "uuid3"],
  "rejection_reason": "Not meet skill requirements" // OPTIONAL
}
```

**Validation Rules**:
- `application_ids` (Array of UUID, required):
  - MUST be non-empty array (min length: 1)
  - MUST NOT exceed 50 items (max length: 50)
  - Each item MUST be valid UUID format
  - Duplicates are allowed (idempotent handling)
  
- `rejection_reason` (String, optional):
  - Max length: 500 characters
  - If omitted, applications rejected without reason
  - Same reason applied to ALL selected applications

**Example 1** (with rejection_reason):
```json
{
  "application_ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660f9511-f3ac-52e5-b827-557766551111",
    "770g0622-g4bd-63f6-c938-668877662222"
  ],
  "rejection_reason": "Event postponed due to weather conditions"
}
```

**Example 2** (without rejection_reason):
```json
{
  "application_ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660f9511-f3ac-52e5-b827-557766551111"
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

**Scenario 1**: All applications rejected successfully (with rejection_reason)

**Response Body**:
```json
{
  "success": true,
  "message": "Bulk reject completed successfully",
  "data": {
    "summary": {
      "total": 3,
      "succeeded": 3,
      "failed": 0,
      "duration_ms": 480
    },
    "successful": [
      "550e8400-e29b-41d4-a716-446655440000",
      "660f9511-f3ac-52e5-b827-557766551111",
      "770g0622-g4bd-63f6-c938-668877662222"
    ],
    "failed": [],
    "rejection_reason": "Event postponed due to weather conditions"
  }
}
```

---

**Scenario 2**: Partial success (some rejected, some failed)

**Response Body**:
```json
{
  "success": true,
  "message": "Bulk reject completed with 2 succeeded, 1 failed",
  "data": {
    "summary": {
      "total": 3,
      "succeeded": 2,
      "failed": 1,
      "duration_ms": 550
    },
    "successful": [
      "550e8400-e29b-41d4-a716-446655440000",
      "660f9511-f3ac-52e5-b827-557766551111"
    ],
    "failed": [
      {
        "application_id": "770g0622-g4bd-63f6-c938-668877662222",
        "reason": "Application is in APPROVED state (use Cancel UC26 instead)",
        "error_code": "INVALID_STATE_TRANSITION"
      }
    ],
    "rejection_reason": "Not meet skill requirements"
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
  "message": "Bulk reject completed with 0 succeeded, 3 failed",
  "data": {
    "summary": {
      "total": 3,
      "succeeded": 0,
      "failed": 3,
      "duration_ms": 190
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
        "reason": "Application is in APPROVED state",
        "error_code": "INVALID_STATE_TRANSITION"
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
| `summary.succeeded` | Integer | Number of successfully rejected applications |
| `summary.failed` | Integer | Number of failed applications |
| `summary.duration_ms` | Integer | Total processing time in milliseconds |
| `successful` | Array<UUID> | List of successfully rejected application IDs |
| `failed` | Array<Object> | List of failed applications with reasons |
| `failed[].application_id` | UUID | Application ID that failed |
| `failed[].reason` | String | Human-readable error message |
| `failed[].error_code` | String | Machine-readable error code |
| `rejection_reason` | String? | The rejection reason applied (if provided in request) |

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

**Scenario 4**: rejection_reason exceeds 500 characters

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "rejection_reason",
      "constraint": "must be at most 500 characters",
      "provided_length": 650,
      "max_allowed": 500
    }
  }
}
```

---

**Scenario 5**: Missing required field

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
    "message": "Only Staff, Manager, or Admin can bulk reject applications",
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
    "message": "An unexpected error occurred during bulk reject",
    "details": {
      "error_id": "err-20260630-002530-abc789",
      "timestamp": "2026-06-30T00:25:30.456Z",
      "partial_results_lost": true
    }
  }
}
```

**Note**: If server crashes mid-processing, some applications may be rejected while others are not (non-atomic by design from RQ3).

---

## Business Rules

### Valid State Transitions (from data-model.md)
| Current Status | Can Reject? | Notes |
|---------------|-------------|-------|
| `SUBMITTED` | ✅ YES | Primary rejection path |
| `REVIEWED` | ✅ YES | After review, before approval |
| `APPROVED` | ❌ NO | Use UC26 Cancel instead |
| `REJECTED` | ✅ YES (idempotent) | Already rejected, no-op |
| `WITHDRAWN` | ❌ NO | Volunteer withdrawn, cannot reject |
| `CANCELLED` | ❌ NO | Already cancelled via UC26 |

### Transaction Isolation (from RQ3 decision)
- **Multiple independent transactions** (NOT atomic)
- Each application processed separately in its own transaction
- Partial success is acceptable and expected
- If processing crashes mid-way, successfully rejected applications remain rejected (can retry failed ones)

### Failure Handling
| Failure Type | Behavior | Example |
|-------------|----------|---------|
| **Invalid state transition** | Mark as failed, continue processing others | App already APPROVED → failed |
| **Organization mismatch** | Mark as failed, continue processing others | App belongs to different org → failed |
| **Application not found** | Mark as failed, continue processing others | Invalid UUID → failed |
| **Database error** | Mark as failed, continue processing others | Connection timeout → failed |

### Idempotency
- If same application ID appears multiple times in request → all instances succeed (idempotent)
- If application already REJECTED → not treated as error, counted as success with note in logs
- rejection_reason is NOT updated for already-rejected applications (preserve original reason)

### Rejection Reason Handling
- **Optional field**: Staff can reject without reason (fast workflow)
- **Single reason applies to all**: Same rejection_reason for all selected applications
- **Max 500 chars**: Prevents abuse and maintains database performance
- **Immutable after rejection**: Cannot update rejection_reason later (use audit_logs for history)

---

## Implementation Notes

### Service Layer Logic
```javascript
// application.service.js - bulkRejectApplications()
async bulkRejectApplications(applicationIds, rejectionReason, staffId, organizationId) {
  const startTime = Date.now();
  const results = {
    successful: [],
    failed: []
  };
  
  // Process each application independently (separate transactions)
  for (const appId of applicationIds) {
    try {
      // Reuse single reject logic (includes all validations)
      const result = await this.rejectApplication(
        appId, 
        rejectionReason, // Can be undefined
        staffId, 
        organizationId
      );
      
      // Handle idempotent case
      if (result.alreadyRejected) {
        results.successful.push(appId); // Count as success
        logger.info(`Application ${appId} already rejected (idempotent)`);
      } else {
        results.successful.push(appId);
        logger.info(`Application ${appId} rejected successfully`);
      }
    } catch (error) {
      results.failed.push({
        application_id: appId,
        reason: error.message,
        error_code: error.code || 'UNKNOWN_ERROR'
      });
      logger.warn(`Application ${appId} rejection failed: ${error.message}`);
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
    ...results,
    rejection_reason: rejectionReason || undefined // Include in response if provided
  };
}
```

### Controller Layer
```javascript
// application.controller.js - bulkRejectApplications()
async bulkRejectApplications(req, res, next) {
  try {
    const { application_ids, rejection_reason } = req.body;
    const { userId: staffId, organizationId } = req.user;
    
    // Validation (Zod schema)
    const validatedData = bulkRejectSchema.parse({ 
      application_ids,
      rejection_reason 
    });
    
    const results = await applicationService.bulkRejectApplications(
      validatedData.application_ids,
      validatedData.rejection_reason, // Optional, can be undefined
      staffId,
      organizationId
    );
    
    const message = results.summary.failed === 0
      ? 'Bulk reject completed successfully'
      : `Bulk reject completed with ${results.summary.succeeded} succeeded, ${results.summary.failed} failed`;
    
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

export const bulkRejectSchema = z.object({
  application_ids: z
    .array(z.string().uuid('Each application ID must be a valid UUID'))
    .min(1, 'Must provide at least 1 application ID')
    .max(50, 'Cannot reject more than 50 applications at once'),
  rejection_reason: z
    .string()
    .max(500, 'Rejection reason must not exceed 500 characters')
    .optional() // Can be omitted
});
```

### Route Registration
```javascript
// application.routes.js
router.post(
  '/bulk-reject',
  authMiddleware, // Extract JWT token → req.user
  applicationController.bulkRejectApplications
);
```

### Email Notification (Reuse UC24 Worker)
```javascript
// Inside single rejectApplication() service method
async rejectApplication(appId, rejectionReason, staffId, organizationId) {
  // ... validation and status update logic ...
  
  // Create email job (same pattern as UC24)
  await prisma.email_queue.create({
    data: {
      recipient_email: volunteer.email,
      recipient_name: volunteer.full_name,
      email_type: 'REJECTION_NOTIFICATION', // New type for UC25
      status: 'PENDING',
      priority: 'NORMAL',
      template_data: JSON.stringify({
        volunteer_name: volunteer.full_name,
        event_name: application.event.name,
        event_date: application.event.start_date,
        rejection_reason: rejectionReason || 'No specific reason provided',
        organization_name: application.event.organization.name
      }),
      scheduled_at: new Date(),
      max_retries: 3,
      retry_count: 0
    }
  });
  
  logger.info(`Email job created for rejected application ${appId}`);
  
  return { success: true, alreadyRejected: false };
}
```

---

## Testing Scenarios

### Happy Path Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T001 | Bulk reject 5 SUBMITTED applications with reason | 200 OK, succeeded: 5, failed: 0 |
| T002 | Bulk reject 10 REVIEWED applications without reason | 200 OK, succeeded: 10, failed: 0 |
| T003 | Bulk reject includes 2 already REJECTED (idempotent) | 200 OK, all counted as succeeded |

### Partial Success Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T004 | 5 applications: 3 SUBMITTED, 2 APPROVED | 200 OK, succeeded: 3, failed: 2 with reasons |
| T005 | 10 applications: 8 valid, 2 not found | 200 OK, succeeded: 8, failed: 2 |
| T006 | 5 applications: 4 valid, 1 cross-org | 200 OK, succeeded: 4, failed: 1 |

### State Transition Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T007 | Reject APPROVED applications | 200 OK, all failed (invalid state) |
| T008 | Reject WITHDRAWN applications | 200 OK, all failed (invalid state) |
| T009 | Reject CANCELLED applications | 200 OK, all failed (invalid state) |

### Validation Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T010 | Empty array | 400 Bad Request (validation error) |
| T011 | 75 application IDs (exceeds limit) | 400 Bad Request (max 50) |
| T012 | Array contains invalid UUID | 400 Bad Request (validation error) |
| T013 | rejection_reason 650 chars (exceeds limit) | 400 Bad Request (max 500) |
| T014 | Missing application_ids field | 400 Bad Request (required field) |

### Error Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T015 | No JWT token | 401 Unauthorized |
| T016 | Volunteer role attempts bulk reject | 403 Forbidden |
| T017 | All 5 applications not found | 200 OK, succeeded: 0, failed: 5 |

### Concurrency Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T018 | 2 Staff bulk reject same 10 applications simultaneously | Both get 200 OK with idempotent handling |
| T019 | Staff A rejects 5, Staff B rejects overlapping 3 | Both succeed with idempotent overlap |

---

## Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Response Time (10 apps) | <1s | Load test with 20 concurrent users |
| Response Time (50 apps) | <5s | Load test with 20 concurrent users |
| Throughput | >20 bulk requests/s | Single server instance |
| Database Queries | 3 × N queries (N = app count) | Query log analysis |
| Transaction Overhead | <50ms per application | Performance profiling |

**Performance Considerations**:
- Sequential processing (not parallel) to maintain data consistency
- Each application: 1 auth query + 1 update transaction + 1 email insert
- For 50 applications: ~50 × 3 = 150 queries total (~5s)
- **Future optimization**: Parallel processing with proper error handling

---

## Security Considerations

### Input Validation
- ✅ Array length validated (1-50 items)
- ✅ Each UUID validated format
- ✅ rejection_reason max length enforced (500 chars)
- ✅ Duplicate UUIDs handled gracefully (idempotent)
- ✅ SQL injection impossible (Prisma ORM parameterized queries)

### Rate Limiting
- **Recommended**: 50 bulk rejections per minute per Staff
- **Reason**: Prevent abuse, protect database from overload
- **Implementation**: Redis-based rate limiter with sliding window

### Authorization
- ✅ Organization ownership checked per application (not just once)
- ✅ No batch authorization bypass vulnerability
- ✅ Failed authorization returns in `failed` array (not HTTP 403)

### Audit Trail
- ✅ Log bulk reject attempt with: `{ staff_id, application_count, timestamp }`
- ✅ Log each individual rejection: `{ staff_id, application_id, result: 'success'|'failed', reason }`
- ❌ DO NOT log volunteer personal data

---

## Frontend Integration

### API Call Example (Axios)
```javascript
// applicationApi.js
async bulkRejectApplications(applicationIds, rejectionReason) {
  const response = await axios.post(
    '/api/v1/applications/bulk-reject',
    { 
      application_ids: applicationIds,
      rejection_reason: rejectionReason // Optional
    },
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

### UI Behavior (from RQ4 decision - Autocomplete Pattern)

**Material UI DataGrid + Autocomplete Dialog**:
```jsx
// ApplicationListPage.jsx
import { DataGrid } from '@mui/x-data-grid';
import { Autocomplete, Dialog, TextField } from '@mui/material';
import { useState } from 'react';

// Predefined rejection reason templates
const REJECTION_TEMPLATES = [
  'Not meet skill requirements',
  'Event postponed',
  'Event cancelled',
  'Insufficient experience',
  'Application submitted after deadline',
  'Duplicate application'
];

function ApplicationListPage() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [applications, setApplications] = useState([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const handleBulkReject = async () => {
    setRejectDialogOpen(true);
  };
  
  const handleConfirmReject = async () => {
    setIsLoading(true);
    
    try {
      const result = await applicationApi.bulkReject(
        selectedIds,
        rejectionReason || undefined // Don't send empty string
      );
      
      // Handle partial success
      if (result.data.failed.length > 0) {
        toast.warning(
          `${result.data.summary.succeeded} rejected, ${result.data.summary.failed} failed`
        );
        // Show detailed failure modal
        setFailedDetails(result.data.failed);
        setShowFailureModal(true);
      } else {
        toast.success(`${result.data.summary.succeeded} applications rejected successfully`);
      }
      
      // Refresh list
      await fetchApplications();
      setSelectedIds([]); // Clear selection
      setRejectDialogOpen(false);
      setRejectionReason('');
    } catch (error) {
      toast.error('Bulk reject failed: ' + error.message);
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
        <BulkRejectButton 
          count={selectedIds.length}
          onClick={handleBulkReject}
          disabled={isLoading}
        />
      )}
      
      {/* Autocomplete Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject {selectedIds.length} Applications</DialogTitle>
        <DialogContent>
          <Autocomplete
            freeSolo // Allow custom text
            options={REJECTION_TEMPLATES}
            value={rejectionReason}
            onChange={(event, newValue) => {
              setRejectionReason(newValue || '');
            }}
            onInputChange={(event, newInputValue) => {
              setRejectionReason(newInputValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Rejection Reason (Optional)"
                placeholder="Select template or type custom reason"
                multiline
                rows={3}
                helperText={`${rejectionReason.length}/500 characters`}
                error={rejectionReason.length > 500}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmReject} 
            color="error"
            disabled={rejectionReason.length > 500}
          >
            Reject {selectedIds.length} Applications
          </Button>
        </DialogActions>
      </Dialog>
      
      {showFailureModal && (
        <FailedRejectionModal 
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
// FailedRejectionModal.jsx
function FailedRejectionModal({ failures, onClose }) {
  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Rejection Failures ({failures.length})</DialogTitle>
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

- **PATCH /api/v1/applications/:applicationId/reject** - Single reject (UC25 US1)
- **PATCH /api/v1/applications/:applicationId/approve** - Single approve (UC24 US1)
- **POST /api/v1/applications/bulk-approve** - Bulk approve (UC24 US2)
- **GET /api/v1/applications** - List applications (UC22)

---

## Comparison: Single vs Bulk Reject

| Aspect | Single Reject | Bulk Reject |
|--------|--------------|-------------|
| **HTTP Method** | PATCH | POST |
| **Request Body** | `{ rejection_reason }` (optional) | `{ application_ids, rejection_reason }` |
| **Transaction** | Single atomic transaction | Multiple independent transactions |
| **Failure Behavior** | Returns HTTP error code | Returns 200 OK with failed list |
| **Idempotency** | 200 OK if already rejected | Counts idempotent as success |
| **Rejection Reason** | Per application | Same for all applications |
| **Max Throughput** | 100+ req/s | ~20 req/s (limited by sequential processing) |
| **Use Case** | Staff reject from detail page | Staff reject from list page |

---

**Contract Version**: 1.0  
**Last Updated**: 2026-06-30  
**Status**: DRAFT - Ready for implementation

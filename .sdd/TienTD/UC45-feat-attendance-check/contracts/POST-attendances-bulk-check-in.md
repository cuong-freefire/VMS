# API Contract: Bulk Attendance Check-in

**Endpoint**: `POST /api/v1/attendances/bulk-check-in`  
**Feature**: UC45 - Attendance Check  
**User Story**: US2 - Bulk check-in from attendance list  
**Authentication**: Required (JWT token)  
**Authorization**: Staff role + Organization ownership  

---

## Overview

Staff thực hiện điểm danh (check-in) hàng loạt cho nhiều tình nguyện viên cùng lúc từ attendance list page. Hệ thống sẽ:
1. Validate tất cả applications thuộc cùng organization của Staff
2. Process từng application độc lập (separate transactions - từ RQ4 decision)
3. Return partial success results (succeeded vs failed với lý do)
4. Log audit trail cho mỗi check-in
5. Apply same optional notes to all selected volunteers

**Key Difference from Single Check-in**:
- Multiple independent transactions (NOT atomic) → partial success possible
- Returns summary: `{ total, succeeded, failed, results }`
- Max 50 applications per request (rate limiting)
- Single notes value applies to ALL selected applications

---

## Request

### HTTP Method
`POST`

### Path
`/api/v1/attendances/bulk-check-in`

### Request Headers

| Header | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `Authorization` | String | ✅ YES | JWT Bearer token | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `Content-Type` | String | ✅ YES | Must be `application/json` | `application/json` |

### Request Body

**Schema**:
```json
{
  "application_ids": [123, 456, 789],
  "notes": "Volunteers checked in at Zone A entrance" // OPTIONAL
}
```

**Validation Rules**:
- `application_ids` (Array of Integer, required):
  - MUST be non-empty array (min length: 1)
  - MUST NOT exceed 50 items (max length: 50)
  - Each item MUST be positive integer
  - Duplicates are allowed (idempotent handling)
  
- `notes` (String, optional):
  - Max length: 500 characters
  - If omitted, all applications checked in without notes
  - Same notes applied to ALL selected applications

**Example 1** (with notes):
```json
{
  "application_ids": [123, 456, 789],
  "notes": "Bulk check-in at main gate, volunteers assigned to cleanup team"
}
```

**Example 2** (without notes):
```json
{
  "application_ids": [123, 456, 789]
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

**Scenario 1**: All applications checked in successfully (with notes)

**Response Body**:
```json
{
  "success": true,
  "message": "Bulk check-in completed successfully",
  "data": {
    "summary": {
      "total": 3,
      "succeeded": 3,
      "failed": 0,
      "duration_ms": 680
    },
    "successful": [
      {
        "application_id": 123,
        "volunteer_name": "Nguyễn Văn A",
        "attendance_id": 789,
        "checked_in_at": "2026-06-29T14:30:15.123Z"
      },
      {
        "application_id": 456,
        "volunteer_name": "Trần Thị B",
        "attendance_id": 790,
        "checked_in_at": "2026-06-29T14:30:15.234Z"
      },
      {
        "application_id": 789,
        "volunteer_name": "Lê Văn C",
        "attendance_id": 791,
        "checked_in_at": "2026-06-29T14:30:15.345Z"
      }
    ],
    "failed": [],
    "notes": "Bulk check-in at main gate, volunteers assigned to cleanup team"
  }
}
```

---

**Scenario 2**: Partial success (some checked in, some failed)

**Response Body**:
```json
{
  "success": true,
  "message": "Bulk check-in completed with 2 succeeded, 1 failed",
  "data": {
    "summary": {
      "total": 3,
      "succeeded": 2,
      "failed": 1,
      "duration_ms": 550
    },
    "successful": [
      {
        "application_id": 123,
        "volunteer_name": "Nguyễn Văn A",
        "attendance_id": 789,
        "checked_in_at": "2026-06-29T14:30:15.123Z"
      },
      {
        "application_id": 456,
        "volunteer_name": "Trần Thị B",
        "attendance_id": 790,
        "checked_in_at": "2026-06-29T14:30:15.234Z"
      }
    ],
    "failed": [
      {
        "application_id": 789,
        "volunteer_name": "Lê Văn C",
        "error_code": "DUPLICATE_CHECK_IN",
        "error_message": "Volunteer already checked in for this event",
        "details": {
          "previous_check_in_at": "2026-06-29T10:00:00.000Z"
        }
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
  "message": "Bulk check-in completed with 0 succeeded, 3 failed",
  "data": {
    "summary": {
      "total": 3,
      "succeeded": 0,
      "failed": 3,
      "duration_ms": 290
    },
    "successful": [],
    "failed": [
      {
        "application_id": 123,
        "volunteer_name": "Nguyễn Văn A",
        "error_code": "ORGANIZATION_MISMATCH",
        "error_message": "You can only check-in volunteers for events in your organization"
      },
      {
        "application_id": 456,
        "volunteer_name": null,
        "error_code": "RESOURCE_NOT_FOUND",
        "error_message": "Application not found"
      },
      {
        "application_id": 789,
        "volunteer_name": "Lê Văn C",
        "error_code": "INVALID_APPLICATION_STATUS",
        "error_message": "Cannot check-in application with status PENDING. Only APPROVED applications can be checked in."
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
| `summary.succeeded` | Integer | Number of successfully checked-in applications |
| `summary.failed` | Integer | Number of failed applications |
| `summary.duration_ms` | Integer | Total processing time in milliseconds |
| `successful` | Array<Object> | List of successfully checked-in volunteers with details |
| `successful[].application_id` | Integer | Application ID that succeeded |
| `successful[].volunteer_name` | String | Volunteer full name |
| `successful[].attendance_id` | Integer | Created attendance record ID |
| `successful[].checked_in_at` | ISO8601 | Check-in timestamp |
| `failed` | Array<Object> | List of failed applications with error details |
| `failed[].application_id` | Integer | Application ID that failed |
| `failed[].volunteer_name` | String? | Volunteer full name (null if application not found) |
| `failed[].error_code` | String | Machine-readable error code |
| `failed[].error_message` | String | Human-readable error message |
| `failed[].details` | Object? | Additional error context (optional) |
| `notes` | String? | The notes applied (if provided in request) |

---

### Error Responses

#### 400 Bad Request - Empty Array

**Scenario**: application_ids is empty array

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

#### 400 Bad Request - Exceeds 50 Items Limit

**Scenario**: application_ids array has more than 50 items

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

#### 400 Bad Request - Invalid Integer Format

**Scenario**: application_ids contains non-integer values

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "application_ids[2]",
      "constraint": "must be positive integer",
      "provided_value": "not-a-number"
    }
  }
}
```

---

#### 400 Bad Request - Invalid Notes Length

**Scenario**: notes exceeds 500 characters

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "notes",
      "constraint": "must be at most 500 characters",
      "provided_length": 650,
      "max_allowed": 500
    }
  }
}
```

---

#### 400 Bad Request - Missing Required Field

**Scenario**: application_ids field is missing

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
    "message": "Only Staff, Manager, or Admin can bulk check-in volunteers",
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
    "message": "An unexpected error occurred during bulk check-in",
    "details": {
      "error_id": "err-20260630-002530-abc789",
      "timestamp": "2026-06-30T00:25:30.456Z",
      "partial_results_lost": true
    }
  }
}
```

**Note**: If server crashes mid-processing, some applications may be checked in while others are not (non-atomic by design from RQ4).

---

## Business Rules

### Valid State Transitions (from data-model.md)
| Application Status | Can Check-in? | Notes |
|-------------------|---------------|-------|
| `APPROVED` | ✅ YES | Primary check-in path |
| `PENDING` | ❌ NO | Not yet approved |
| `REJECTED` | ❌ NO | Application rejected |
| `WITHDRAWN` | ❌ NO | Volunteer withdrew |
| `CANCELLED` | ❌ NO | Application cancelled |

**Already Checked-in**: Returns error in failed array (DUPLICATE_CHECK_IN), not counted as success.

### Transaction Isolation (from RQ4 decision)
- **Multiple independent transactions** (NOT atomic)
- Each application processed separately in its own try-catch block
- Partial success is acceptable and expected
- If processing crashes mid-way, successfully checked-in applications remain checked-in (can retry failed ones)

### Failure Handling
| Failure Type | Behavior | Example |
|-------------|----------|---------|
| **Invalid application status** | Mark as failed, continue processing others | App status PENDING → failed |
| **Organization mismatch** | Mark as failed, continue processing others | App belongs to different org → failed |
| **Application not found** | Mark as failed, continue processing others | Invalid ID → failed |
| **Already checked in** | Mark as failed, continue processing others | Duplicate → failed |
| **Invalid event status** | Mark as failed, continue processing others | Event COMPLETED → failed |
| **Database error** | Mark as failed, continue processing others | Connection timeout → failed |

### Idempotency
- If same application ID appears multiple times in request → all instances return same result (either all succeed or all fail)
- If application already checked in → returned in failed array with DUPLICATE_CHECK_IN error
- notes is NOT updated for already-checked-in applications (preserve original notes)

### Notes Handling
- **Optional field**: Staff can bulk check-in without notes (fast workflow)
- **Single notes applies to all**: Same notes for all selected applications
- **Max 500 chars**: Prevents abuse and maintains database performance
- **Immutable after check-in**: Cannot update notes later for attendance records (use audit_logs for history)

---

## Implementation Notes

### Service Layer Logic
```javascript
// attendance.service.js - bulkCheckIn()
async bulkCheckIn(applicationIds, staffId, data = {}) {
  const startTime = Date.now();
  const results = {
    successful: [],
    failed: []
  };
  
  // Process each application independently (separate transactions)
  for (const appId of applicationIds) {
    try {
      // Reuse single check-in logic (includes all validations)
      const attendance = await this.checkIn(
        appId, 
        staffId, 
        { notes: data.notes } // Can be undefined
      );
      
      results.successful.push({
        application_id: appId,
        volunteer_name: attendance.volunteer_name,
        attendance_id: attendance.id,
        checked_in_at: attendance.checked_in_at
      });
      
      logger.info(`Application ${appId} checked in successfully in bulk operation`);
    } catch (error) {
      // Collect error details without stopping the loop
      results.failed.push({
        application_id: appId,
        volunteer_name: error.details?.volunteer_name || null,
        error_code: error.code || 'UNKNOWN_ERROR',
        error_message: error.message,
        details: error.details || {}
      });
      
      logger.warn(`Application ${appId} check-in failed in bulk operation: ${error.message}`);
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
    notes: data.notes || undefined // Include in response if provided
  };
}
```

### Controller Layer
```javascript
// attendance.controller.js - bulkCheckIn()
async bulkCheckIn(req, res, next) {
  try {
    const { application_ids, notes } = req.body;
    const { userId: staffId } = req.user;
    
    // Validation (Zod schema)
    const validatedData = bulkCheckInSchema.parse({ 
      application_ids,
      notes 
    });
    
    const results = await attendanceService.bulkCheckIn(
      validatedData.application_ids,
      staffId,
      { notes: validatedData.notes } // Optional, can be undefined
    );
    
    const message = results.summary.failed === 0
      ? 'Bulk check-in completed successfully'
      : `Bulk check-in completed with ${results.summary.succeeded} succeeded, ${results.summary.failed} failed`;
    
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
// attendance.validator.js
import { z } from 'zod';

export const bulkCheckInSchema = z.object({
  application_ids: z
    .array(z.number().int().positive('Each application ID must be a positive integer'))
    .min(1, 'Must provide at least 1 application ID')
    .max(50, 'Cannot check-in more than 50 volunteers at once'),
  notes: z
    .string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional() // Can be omitted
    .transform(val => val?.trim() || undefined) // Trim whitespace, convert empty to undefined
});
```

### Route Registration
```javascript
// attendance.routes.js
router.post(
  '/bulk-check-in',
  authMiddleware, // Extract JWT token → req.user
  attendanceController.bulkCheckIn
);
```

---

## Testing Scenarios

### Happy Path Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T001 | Bulk check-in 5 APPROVED applications with notes | 200 OK, succeeded: 5, failed: 0 |
| T002 | Bulk check-in 10 APPROVED applications without notes | 200 OK, succeeded: 10, failed: 0 |
| T003 | Bulk check-in includes 2 duplicates in array | 200 OK, both processed (idempotent) |

### Partial Success Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T004 | 5 applications: 3 APPROVED, 2 PENDING | 200 OK, succeeded: 3, failed: 2 with reasons |
| T005 | 10 applications: 8 valid, 2 not found | 200 OK, succeeded: 8, failed: 2 |
| T006 | 5 applications: 4 valid, 1 cross-org | 200 OK, succeeded: 4, failed: 1 |
| T007 | 5 applications: 3 valid, 2 already checked in | 200 OK, succeeded: 3, failed: 2 (DUPLICATE_CHECK_IN) |

### State Transition Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T008 | Bulk check-in PENDING applications | 200 OK, all failed (INVALID_APPLICATION_STATUS) |
| T009 | Bulk check-in for COMPLETED event | 200 OK, all failed (INVALID_EVENT_STATUS) |
| T010 | Bulk check-in REJECTED applications | 200 OK, all failed (INVALID_APPLICATION_STATUS) |

### Validation Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T011 | Empty array | 400 Bad Request (validation error) |
| T012 | 75 application IDs (exceeds limit) | 400 Bad Request (max 50) |
| T013 | Array contains invalid integers | 400 Bad Request (validation error) |
| T014 | notes 650 chars (exceeds limit) | 400 Bad Request (max 500) |
| T015 | Missing application_ids field | 400 Bad Request (required field) |

### Error Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T016 | No JWT token | 401 Unauthorized |
| T017 | Volunteer role attempts bulk check-in | 403 Forbidden |
| T018 | All 5 applications not found | 200 OK, succeeded: 0, failed: 5 |

### Concurrency Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| T019 | 2 Staff bulk check-in same 10 applications simultaneously | Both get 200 OK with idempotent handling |
| T020 | Staff A checks 5, Staff B checks overlapping 3 | Both succeed with idempotent overlap |

---

## Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Response Time (10 apps) | <1s | Load test with 20 concurrent users |
| Response Time (50 apps) | <5s | Load test with 20 concurrent users |
| Throughput | >20 bulk requests/s | Single server instance |
| Database Queries | ~4 × N queries (N = app count) | Query log analysis |
| Per-Application Overhead | <100ms | Performance profiling |

**Performance Breakdown** (from research.md):
- **Single check-in**: ~250ms
- **Bulk check-in (50 records)**: 50 × 250ms = ~12.5s (sequential, worst case)
- **Optimized (parallel batching)**: ~2.75s for 50 records

**Optimization opportunities if needed**:
- Batch database queries (fetch all applications in one query)
- Parallel processing with Promise.all() instead of sequential loop
- Use Prisma `createMany()` for batch insert (reduces network overhead)

---

## Security Considerations

### Input Validation
- ✅ Array length validated (1-50 items)
- ✅ Each integer validated (positive integers only)
- ✅ notes max length enforced (500 chars)
- ✅ Duplicate IDs handled gracefully (idempotent)
- ✅ SQL injection impossible (Prisma ORM parameterized queries)

### Rate Limiting
- **Recommended**: 50 bulk check-ins per minute per Staff
- **Reason**: Prevent abuse, protect database from overload
- **Implementation**: Redis-based rate limiter with sliding window

### Authorization
- ✅ Organization ownership checked per application (not just once)
- ✅ No batch authorization bypass vulnerability
- ✅ Failed authorization returns in `failed` array (not HTTP 403)

### Audit Trail
- ✅ Log bulk check-in attempt with: `{ staff_id, application_count, timestamp }`
- ✅ Log each individual check-in: `{ staff_id, application_id, result: 'success'|'failed', error_code }`
- ❌ DO NOT log volunteer personal data beyond IDs

---

## Frontend Integration

### API Call Example (Axios)
```javascript
// attendanceApi.js
async bulkCheckIn(applicationIds, notes = null) {
  const response = await axios.post(
    '/api/v1/attendances/bulk-check-in',
    { 
      application_ids: applicationIds,
      notes: notes // Optional
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

### UI Behavior (from RQ2 decision - Confirmation Dialog)

**Material UI DataGrid + Confirmation Dialog**:
```jsx
// AttendanceCheckPage.jsx
import { DataGrid } from '@mui/x-data-grid';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, List, ListItem } from '@mui/material';
import { useState } from 'react';

function AttendanceCheckPage() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleBulkCheckIn = async () => {
    setConfirmDialogOpen(true);
  };
  
  const handleConfirmCheckIn = async () => {
    setIsLoading(true);
    
    try {
      const result = await attendanceApi.bulkCheckIn(selectedIds);
      
      // Handle partial success
      if (result.data.failed.length > 0) {
        toast.warning(
          `${result.data.summary.succeeded} checked in, ${result.data.summary.failed} failed`
        );
        // Show detailed failure modal
        setFailedDetails(result.data.failed);
        setShowFailureModal(true);
      } else {
        toast.success(`${result.data.summary.succeeded} volunteers checked in successfully`);
      }
      
      // Refresh list
      await fetchVolunteers();
      setSelectedIds([]); // Clear selection
      setConfirmDialogOpen(false);
    } catch (error) {
      toast.error('Bulk check-in failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const selectedVolunteers = volunteers.filter(v => selectedIds.includes(v.application_id));
  
  return (
    <>
      <DataGrid
        rows={volunteers}
        columns={columns}
        checkboxSelection
        isRowSelectable={(params) => !params.row.is_checked_in} // Only unchecked volunteers
        onRowSelectionModelChange={(ids) => setSelectedIds(ids)}
        rowSelectionModel={selectedIds}
        getRowId={(row) => row.application_id}
      />
      
      {selectedIds.length > 0 && (
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleBulkCheckIn}
          disabled={isLoading}
        >
          Check-in {selectedIds.length} Volunteers
        </Button>
      )}
      
      {/* Confirmation Dialog (from RQ2 decision) */}
      <Dialog 
        open={confirmDialogOpen} 
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Bulk Check-in</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            You are about to check-in {selectedIds.length} volunteers:
          </Typography>
          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
            {selectedVolunteers.map((v) => (
              <ListItem key={v.application_id}>
                • {v.volunteer_name}
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmCheckIn} 
            variant="contained"
            color="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Confirm Check-in'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {showFailureModal && (
        <FailedCheckInModal 
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
// FailedCheckInModal.jsx
function FailedCheckInModal({ failures, onClose }) {
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Check-in Failures ({failures.length})</DialogTitle>
      <DialogContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Volunteer</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Error Code</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {failures.map((failure, idx) => (
              <TableRow key={idx}>
                <TableCell>{failure.volunteer_name || 'Unknown'}</TableCell>
                <TableCell>{failure.error_message}</TableCell>
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

- **POST /api/v1/attendances/:applicationId/check-in** - Single check-in (UC45 US1)
- **GET /api/v1/attendances/events/:eventId/checklist** - Get attendance checklist (UC45 support)
- **PATCH /api/v1/attendances/:id/hours** - Update volunteer hours (future UC)
- **GET /api/v1/attendances/:id** - View attendance details (UC46)

---

## Comparison: Single vs Bulk Check-in

| Aspect | Single Check-in | Bulk Check-in |
|--------|----------------|---------------|
| **HTTP Method** | POST | POST |
| **Endpoint** | `/:applicationId/check-in` | `/bulk-check-in` |
| **Request Body** | `{ notes }` (optional) | `{ application_ids, notes }` |
| **Transaction** | Single atomic | Multiple independent transactions |
| **Failure Behavior** | Returns HTTP error code | Returns 200 OK with failed list |
| **Idempotency** | 409 if already checked in | Returns in failed array |
| **Notes Handling** | Per application | Same for all applications |
| **Max Throughput** | ~100 req/s | ~20 req/s (limited by sequential processing) |
| **Use Case** | Staff check-in from detail view | Staff check-in from list page |
| **Confirmation UI** | Optional dialog | Required confirmation dialog (RQ2) |

---

**Contract Version**: 1.0  
**Last Updated**: 2026-06-30  
**Status**: DRAFT - Ready for implementation

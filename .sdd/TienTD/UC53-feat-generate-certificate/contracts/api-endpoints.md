# API Contracts: Generate Certificate (UC53)

**Feature**: Generate Certificate  
**Date**: 2026-07-01  
**Version**: 1.0.0  
**Base URL**: `/api/v1`

---

## Overview

UC53 exposes 3 REST endpoints cho certificate generation:
1. **POST /certificates/batch** - Generate certificates hàng loạt (US1)
2. **GET /certificates/batch/:jobId/status** - Poll batch status (US1)
3. **GET /certificates/preview** - Preview HTML template (US2)

**Authentication**: All endpoints require JWT authentication via HttpOnly cookie.  
**Authorization**: STAFF, MANAGER, ADMIN roles only.

---

## Endpoints

### 1. Generate Certificates Batch

**Endpoint**: `POST /api/v1/certificates/batch`  
**User Story**: US1 - Cấp chứng nhận hàng loạt  
**Purpose**: Trigger async batch generation cho event đã completed

**Authentication**: Required (JWT HttpOnly Cookie)  
**Authorization**: STAFF, MANAGER, ADMIN (same organization as event)

#### Request

**Headers**:
```http
POST /api/v1/certificates/batch HTTP/1.1
Host: vms-api.com
Content-Type: application/json
Cookie: token=<jwt_token>
```

**Body**:
```json
{
  "event_id": 456
}
```

**Body Schema**:
```typescript
{
  event_id: number;  // INT, positive, required
}
```

**Validation Rules**:
- `event_id` MUST be positive integer
- `event_id` MUST exist in database
- Event MUST have `status = 'COMPLETED'` (FR-001)
- Event MUST have at least 1 eligible volunteer (attendance.status = 'PRESENT')
- Staff MUST belong to same organization as event

#### Response

**Success (202 Accepted)**:
```json
{
  "success": true,
  "data": {
    "job_id": "a1b2c3d4-5678-90ab-cdef-123456789012",
    "status": "PROCESSING",
    "total": 100,
    "message": "Certificate generation started"
  },
  "metadata": {
    "timestamp": "2026-07-01T01:00:00Z"
  }
}
```

**Response Schema**:
```typescript
{
  success: true,
  data: {
    job_id: string;      // UUID v4
    status: "PROCESSING",
    total: number;       // Number of certificates to generate
    message: string;
  },
  metadata: {
    timestamp: string;   // ISO 8601
  }
}
```

**Error Responses**:

**400 Bad Request** - Validation errors:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Event must be COMPLETED to generate certificates",
    "details": {
      "event_id": 456,
      "current_status": "IN_PROGRESS"
    }
  }
}
```

**400 Bad Request** - No eligible volunteers:
```json
{
  "success": false,
  "error": {
    "code": "NO_ELIGIBLE_VOLUNTEERS",
    "message": "No volunteers with attendance.status = PRESENT found",
    "details": {
      "event_id": 456,
      "total_applications": 50,
      "present_count": 0
    }
  }
}
```

**401 Unauthorized** - Missing/invalid JWT:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**403 Forbidden** - Wrong organization:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Cannot generate certificates for other organizations",
    "details": {
      "staff_org_id": 1,
      "event_org_id": 2
    }
  }
}
```

**403 Forbidden** - Wrong role:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Only STAFF/MANAGER/ADMIN can generate certificates",
    "details": {
      "current_role": "VOLUNTEER"
    }
  }
}
```

**404 Not Found** - Event not exists:
```json
{
  "success": false,
  "error": {
    "code": "EVENT_NOT_FOUND",
    "message": "Event with ID 456 not found"
  }
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to start certificate generation",
    "request_id": "req_xyz789"
  }
}
```

#### Business Rules

- FR-001: Event MUST have `status = 'COMPLETED'`
- FR-002: Only volunteers với `attendance.status = 'PRESENT'` eligible
- FR-003: Duplicate certificates handled idempotently (return existing URL)
- FR-018: Response immediate (202), processing async

#### Performance

- Response time: < 200ms (initiation only)
- Async processing: 100 certificates ~4-5 seconds (SC-001: target < 60s)

---

### 2. Get Batch Generation Status

**Endpoint**: `GET /api/v1/certificates/batch/:jobId/status`  
**User Story**: US1 - Theo dõi tiến trình  
**Purpose**: Poll status của batch generation job

**Authentication**: Required (JWT HttpOnly Cookie)  
**Authorization**: STAFF, MANAGER, ADMIN (job creator only)

#### Request

**Headers**:
```http
GET /api/v1/certificates/batch/a1b2c3d4-5678-90ab-cdef-123456789012/status HTTP/1.1
Host: vms-api.com
Cookie: token=<jwt_token>
```

**Path Parameters**:
```typescript
{
  jobId: string;  // UUID v4, required
}
```

**Query Parameters**: None

#### Response

**Success (200 OK) - Processing**:
```json
{
  "success": true,
  "data": {
    "job_id": "a1b2c3d4-5678-90ab-cdef-123456789012",
    "status": "PROCESSING",
    "progress": {
      "completed": 50,
      "failed": 0,
      "total": 100
    },
    "started_at": "2026-07-01T01:00:00Z",
    "estimated_completion": "2026-07-01T01:00:05Z"
  },
  "metadata": {
    "timestamp": "2026-07-01T01:00:02Z"
  }
}
```

**Success (200 OK) - Completed**:
```json
{
  "success": true,
  "data": {
    "job_id": "a1b2c3d4-5678-90ab-cdef-123456789012",
    "status": "COMPLETED",
    "progress": {
      "completed": 100,
      "failed": 0,
      "total": 100
    },
    "started_at": "2026-07-01T01:00:00Z",
    "completed_at": "2026-07-01T01:00:05Z",
    "duration_ms": 5000
  },
  "metadata": {
    "timestamp": "2026-07-01T01:00:06Z"
  }
}
```

**Success (200 OK) - Partial Failed**:
```json
{
  "success": true,
  "data": {
    "job_id": "a1b2c3d4-5678-90ab-cdef-123456789012",
    "status": "PARTIAL_FAILED",
    "progress": {
      "completed": 98,
      "failed": 2,
      "total": 100
    },
    "failures": [
      {
        "user_id": 123,
        "full_name": "Nguyễn Văn A",
        "reason": "Cloudinary upload failed: Network timeout"
      },
      {
        "user_id": 456,
        "full_name": "Trần Thị B",
        "reason": "Missing organization logo"
      }
    ],
    "started_at": "2026-07-01T01:00:00Z",
    "completed_at": "2026-07-01T01:00:05Z",
    "duration_ms": 5000
  },
  "metadata": {
    "timestamp": "2026-07-01T01:00:06Z"
  }
}
```

**Response Schema**:
```typescript
{
  success: true,
  data: {
    job_id: string;
    status: "PROCESSING" | "COMPLETED" | "PARTIAL_FAILED";
    progress: {
      completed: number;
      failed: number;
      total: number;
    };
    failures?: Array<{
      user_id: number;
      full_name: string;
      reason: string;
    }>;
    started_at: string;      // ISO 8601
    completed_at?: string;   // ISO 8601, only when done
    duration_ms?: number;    // Milliseconds, only when done
    estimated_completion?: string;  // ISO 8601, only when processing
  };
  metadata: {
    timestamp: string;
  };
}
```

**Error Responses**:

**404 Not Found** - Job not exists or expired:
```json
{
  "success": false,
  "error": {
    "code": "JOB_NOT_FOUND",
    "message": "Job ID not found or expired",
    "details": {
      "job_id": "invalid-uuid"
    }
  }
}
```

**403 Forbidden** - Not job owner:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You can only view your own jobs"
  }
}
```

#### Business Rules

- Job state stored in-memory (server restart clears jobs)
- Job expires after 1 hour of completion
- Polling interval: Every 2 seconds (frontend)
- SC-007: Non-blocking, UI can continue during processing

#### Performance

- Response time: < 50ms (in-memory lookup)

---

### 3. Preview Certificate HTML

**Endpoint**: `GET /api/v1/certificates/preview`  
**User Story**: US2 - Xem trước chứng nhận  
**Purpose**: Render HTML preview của certificate template

**Authentication**: Required (JWT HttpOnly Cookie)  
**Authorization**: STAFF, MANAGER, ADMIN (same organization as event)

#### Request

**Headers**:
```http
GET /api/v1/certificates/preview?user_id=123&event_id=456 HTTP/1.1
Host: vms-api.com
Cookie: token=<jwt_token>
```

**Query Parameters**:
```typescript
{
  user_id: number;   // INT, positive, required
  event_id: number;  // INT, positive, required
}
```

**Validation Rules**:
- `user_id` MUST be positive integer
- `event_id` MUST be positive integer
- Both MUST exist in database
- Volunteer MUST have attendance.status = 'PRESENT' for event
- Staff MUST belong to same organization as event

#### Response

**Success (200 OK)**:
```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 5432

<!DOCTYPE html>
<html>
<head>
  <style>
    @page { size: A4; margin: 0; }
    body { 
      font-family: 'Times New Roman', serif;
      padding: 60px;
    }
    .title { font-size: 36px; text-align: center; }
    .volunteer-name { font-size: 28px; color: #2C5F2D; }
  </style>
</head>
<body>
  <img class="org-logo" src="https://res.cloudinary.com/.../logo.png" />
  <h1 class="title">CHỨNG NHẬN TÌNH NGUYỆN</h1>
  <p>Trao cho: <span class="volunteer-name">Nguyễn Văn A</span></p>
  <p>Đã tham gia sự kiện: <span class="event-name">Beach Cleanup 2026</span></p>
  <p>Thời gian: 15/06/2026 - 15/06/2026</p>
  <p>Số giờ tình nguyện: 8.5 giờ</p>
  <p>Ngày cấp: 01/07/2026</p>
  <div class="signature">
    <img src="https://res.cloudinary.com/.../signature.png" />
    <p>Đại diện tổ chức</p>
  </div>
  <img class="qr-code" src="data:image/png;base64,iVBORw0KG..." />
  <p class="cert-id">Mã chứng nhận: preview-mode</p>
</body>
</html>
```

**Content-Type**: `text/html; charset=utf-8`

**Error Responses**:

**400 Bad Request** - Missing required fields:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required query parameters",
    "details": {
      "missing_fields": ["user_id", "event_id"]
    }
  }
}
```

**403 Forbidden** - No attendance record:
```json
{
  "success": false,
  "error": {
    "code": "NOT_ELIGIBLE",
    "message": "Volunteer does not have attendance.status = PRESENT",
    "details": {
      "user_id": 123,
      "event_id": 456,
      "attendance_status": "ABSENT"
    }
  }
}
```

**404 Not Found** - User or Event not exists:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User or Event not found",
    "details": {
      "user_id": 123,
      "event_id": 999
    }
  }
}
```

**500 Internal Server Error** - Template render failed:
```json
{
  "success": false,
  "error": {
    "code": "TEMPLATE_ERROR",
    "message": "Failed to render certificate template",
    "request_id": "req_abc123"
  }
}
```

#### Business Rules

- Preview does NOT save certificate to database
- Preview does NOT upload to Cloudinary
- Preview does NOT trigger email notification
- QR code shows "preview-mode" instead of real certificate ID
- Same template as real PDF generation (consistent preview)

#### Performance

- Response time: < 500ms (HTML render only, no PDF/upload)
- No Puppeteer involved (direct HTML response)

---

## Cross-Module Dependencies

### Upstream Services (UC53 Consumes)

**AttendanceService (Member 3)**:
```typescript
// Method used by UC53
async getEligibleVolunteers(eventId: number): Promise<EligibleVolunteer[]>
```

**Contract**: See `data-model.md` Section "Query Patterns"

**EventService (Member 3)**:
```typescript
// Method used by UC53
async getById(eventId: number): Promise<Event>
```

**UserService (Member 1)**:
```typescript
// Method used by UC53
async getById(userId: number): Promise<User>
```

---

### Downstream Consumers (Who Calls UC53)

**UC47 - View Attendance History (Member 3)**:
- Displays "Generate Certificates" button
- Calls: `POST /api/v1/certificates/batch`

**UC66 - Email Service (Member 1)**:
- Listens to: `certificate.issued` event
- Sends email với certificate download link

---

## Event Contracts

### Events Published by UC53

**Event**: `certificate.issued`  
**Trigger**: After certificate successfully generated + saved to DB + uploaded to Cloudinary  
**Consumer**: EmailService (Member 1 - UC66)

**Payload**:
```typescript
{
  userId: number;
  eventId: number;
  certificateId: number;
  certificateUrl: string;  // Cloudinary URL
  issuedBy: number;        // Staff ID
  issuedAt: string;        // ISO 8601
}
```

**Example**:
```typescript
eventEmitter.emit('certificate.issued', {
  userId: 123,
  eventId: 456,
  certificateId: 789,
  certificateUrl: 'https://res.cloudinary.com/.../cert_123_456.pdf',
  issuedBy: 10,
  issuedAt: '2026-07-01T01:00:05Z'
});
```

**Consumer Implementation** (Member 1):
```typescript
// email.service.js (Member 1)
eventEmitter.on('certificate.issued', async (data) => {
  const user = await userService.getById(data.userId);
  await emailService.send({
    to: user.email,
    subject: 'Chứng nhận tình nguyện của bạn đã sẵn sàng!',
    template: 'certificate-ready',
    data: {
      userName: user.full_name,
      downloadUrl: data.certificateUrl
    }
  });
});
```

---

## Error Codes

### Standard Error Response Format

```typescript
{
  success: false,
  error: {
    code: string;      // Machine-readable error code
    message: string;   // Human-readable error message (Vietnamese)
    details?: object;  // Additional context
    request_id?: string;  // For error tracking
  }
}
```

### Error Code Reference

| HTTP | Code | Message | Cause |
|------|------|---------|-------|
| 400 | `VALIDATION_ERROR` | Invalid request body | Missing/invalid event_id |
| 400 | `NO_ELIGIBLE_VOLUNTEERS` | No volunteers found | No attendance.status = PRESENT |
| 400 | `EVENT_NOT_COMPLETED` | Event not completed | Event.status != COMPLETED |
| 401 | `UNAUTHORIZED` | Authentication required | Missing/invalid JWT token |
| 403 | `FORBIDDEN` | Access denied | Wrong organization |
| 403 | `INSUFFICIENT_PERMISSIONS` | Role not allowed | User role = VOLUNTEER |
| 403 | `NOT_ELIGIBLE` | Volunteer not eligible | attendance.status != PRESENT |
| 404 | `EVENT_NOT_FOUND` | Event not found | event_id doesn't exist |
| 404 | `JOB_NOT_FOUND` | Job not found | job_id invalid or expired |
| 404 | `RESOURCE_NOT_FOUND` | Resource not found | user_id or event_id invalid |
| 500 | `INTERNAL_ERROR` | Server error | Unexpected server failure |
| 500 | `TEMPLATE_ERROR` | Template render failed | Certificate template error |
| 500 | `PDF_GENERATION_FAILED` | PDF generation failed | Puppeteer error |
| 500 | `UPLOAD_FAILED` | Upload failed | Cloudinary error |

---

## Rate Limiting

**Limits** (per Staff user):
- POST /certificates/batch: 10 requests/hour
- GET /certificates/batch/:jobId/status: 1000 requests/hour (polling)
- GET /certificates/preview: 100 requests/hour

**Rate Limit Response** (429 Too Many Requests):
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": {
      "limit": 10,
      "window": "1 hour",
      "retry_after": 3600
    }
  }
}
```

**Headers**:
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1719795600
Retry-After: 3600
```

---

## Versioning

**Current Version**: v1.0.0  
**API Prefix**: `/api/v1`

**Breaking Changes** (require version bump):
- Changing request/response schema
- Removing fields
- Changing field types
- Changing status codes

**Non-Breaking Changes** (no version bump):
- Adding new optional fields
- Adding new endpoints
- Adding new error codes

**Deprecation Policy**:
- Deprecated endpoints supported for 6 months
- `Deprecated` header in response
- Migration guide in documentation

---

## Testing Contracts

### Integration Test Scenarios

**Scenario 1: Happy Path - Batch Generation**
```javascript
// GIVEN: Event completed với 10 present volunteers
const event = await createCompletedEvent({ presentCount: 10 });

// WHEN: Staff generates certificates
const response = await POST('/api/v1/certificates/batch', {
  event_id: event.id
});

// THEN: Job created
expect(response.status).toBe(202);
expect(response.body.data.status).toBe('PROCESSING');
expect(response.body.data.total).toBe(10);

// AND: Poll until completed
const jobId = response.body.data.job_id;
await waitForJobCompletion(jobId);

const statusResp = await GET(`/api/v1/certificates/batch/${jobId}/status`);
expect(statusResp.body.data.status).toBe('COMPLETED');
expect(statusResp.body.data.progress.completed).toBe(10);

// AND: Certificates exist in database
const certs = await Certificate.findAll({ where: { event_id: event.id } });
expect(certs).toHaveLength(10);
```

**Scenario 2: Authorization - Wrong Organization**
```javascript
// GIVEN: Staff from Org A, Event from Org B
const staffA = await createStaff({ organization_id: 1 });
const eventB = await createEvent({ organization_id: 2 });

// WHEN: Staff A tries to generate
const response = await POST('/api/v1/certificates/batch', {
  event_id: eventB.id
}, { auth: staffA.token });

// THEN: Forbidden
expect(response.status).toBe(403);
expect(response.body.error.code).toBe('FORBIDDEN');
```

**Scenario 3: Idempotency - Duplicate Generation**
```javascript
// GIVEN: Certificates already generated
const event = await createCompletedEvent();
await generateCertificates(event.id);

// WHEN: Generate again
const response = await POST('/api/v1/certificates/batch', {
  event_id: event.id
});

// THEN: Success với existing URLs (idempotent)
await waitForJobCompletion(response.body.data.job_id);
const statusResp = await GET(`/api/v1/certificates/batch/${response.body.data.job_id}/status`);
expect(statusResp.body.data.status).toBe('COMPLETED');

// AND: No duplicate certificates in DB
const certs = await Certificate.findAll({ where: { event_id: event.id } });
expect(certs).toHaveLength(event.presentCount);  // Same count, not doubled
```

---

## Swagger Documentation

**Auto-generated from JSDoc comments**:

```javascript
/**
 * @swagger
 * /api/v1/certificates/batch:
 *   post:
 *     summary: Generate certificates hàng loạt
 *     tags: [Certificates]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event_id
 *             properties:
 *               event_id:
 *                 type: integer
 *                 example: 456
 *     responses:
 *       202:
 *         description: Certificate generation started
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BatchGenerationResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
```

---

## Summary

**API Contract Characteristics**:
- ✅ RESTful design
- ✅ Async processing (202 Accepted + polling)
- ✅ Idempotent batch generation
- ✅ Comprehensive error handling
- ✅ Event-driven integration (certificate.issued)
- ✅ Rate limiting protection
- ✅ Versioned API (/api/v1)

**Endpoints**:
1. POST /certificates/batch — Generate (US1)
2. GET /certificates/batch/:jobId/status — Poll status (US1)
3. GET /certificates/preview — Preview HTML (US2)

**Performance**:
- Batch initiation: < 200ms
- Status poll: < 50ms
- Preview render: < 500ms
- Async processing: 100 certs ~4-5s

---

**Last Updated**: 2026-07-01  
**Owner**: Member 3 - TienTD  
**Consumers**: UC47 (Staff UI), UC66 (Email Service)

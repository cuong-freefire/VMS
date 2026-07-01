# API Contract: GET /api/v1/events/:eventId/applications

**Feature**: View Application List (UC22)  
**Date**: 2026-06-29  
**Version**: 1.0  
**Status**: DRAFT

---

## Overview

API endpoint cho Staff để xem danh sách tình nguyện viên đã đăng ký tham gia một sự kiện cụ thể. Hỗ trợ filter theo status và phân trang cho datasets lớn.

**Use Case**: Staff cần review danh sách applications để bắt đầu quy trình sàng lọc và phê duyệt (UC24, UC25).

---

## Endpoint Details

### HTTP Method & URL

```
GET /api/v1/events/:eventId/applications
```

### Authentication

**Required**: ✅ Yes

**Method**: JWT token trong HttpOnly cookie

**Roles**: `STAFF`, `MANAGER`, `ADMIN`

**Cookie Name**: `vms_access_token` (từ `process.env.COOKIE_ACCESS_NAME`)

---

## Request

### Path Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `eventId` | string (UUID) | ✅ Yes | ID của event cần xem applications | Must be valid UUID format |

**Example**:
```
GET /api/v1/events/550e8400-e29b-41d4-a716-446655440000/applications
```

---

### Query Parameters

| Parameter | Type | Required | Default | Description | Validation |
|-----------|------|----------|---------|-------------|------------|
| `status` | string (enum) | ❌ No | (all) | Filter theo status: `SUBMITTED`, `APPROVED`, `REJECTED` | Must be one of enum values |
| `page` | number | ❌ No | `1` | Page number cho pagination | Integer 1-1000 |
| `limit` | number | ❌ No | `20` | Số records per page | Integer 1-100 |

**Query Param Examples**:

```bash
# Show all applications (no filter)
GET /api/v1/events/550e8400-e29b-41d4-a716-446655440000/applications

# Show only SUBMITTED applications (pending review)
GET /api/v1/events/550e8400-e29b-41d4-a716-446655440000/applications?status=SUBMITTED

# Pagination: Page 2 with 50 records per page
GET /api/v1/events/550e8400-e29b-41d4-a716-446655440000/applications?page=2&limit=50

# Combined: Filter + Pagination
GET /api/v1/events/550e8400-e29b-41d4-a716-446655440000/applications?status=APPROVED&page=1&limit=20
```

---

### Request Headers

```http
Cookie: vms_access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Accept: application/json
```

---

### Request Body

**N/A** - GET request không có body

---

## Response

### Success Response (200 OK)

**Response Format** (tuân thủ ADR-006):

```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "status": "SUBMITTED",
        "notes": "I have 2 years of experience in community service",
        "submitted_at": "2026-06-15T10:30:00.000Z",
        "volunteer": {
          "id": "987e6543-e21b-12d3-a456-426614174111",
          "name": "Nguyễn Văn A",
          "avatar_url": "https://res.cloudinary.com/vms/image/upload/v1234567890/avatars/user-123.jpg"
        }
      },
      {
        "id": "223e4567-e89b-12d3-a456-426614174001",
        "status": "APPROVED",
        "notes": null,
        "submitted_at": "2026-06-14T15:45:00.000Z",
        "volunteer": {
          "id": "887e6543-e21b-12d3-a456-426614174222",
          "name": "Trần Thị B",
          "avatar_url": null
        }
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_records": 87,
      "limit": 20
    }
  }
}
```

**Response Fields**:

| Field Path | Type | Description |
|------------|------|-------------|
| `success` | boolean | Always `true` for successful response |
| `data.applications` | array | Danh sách applications (sorted by `submitted_at` DESC) |
| `data.applications[].id` | string (UUID) | Application ID |
| `data.applications[].status` | string (enum) | Application status: `SUBMITTED`, `APPROVED`, `REJECTED` |
| `data.applications[].notes` | string \| null | Optional notes từ volunteer hoặc staff |
| `data.applications[].submitted_at` | string (ISO8601) | Submission timestamp |
| `data.applications[].volunteer.id` | string (UUID) | Volunteer user ID (link to UC23 detail page) |
| `data.applications[].volunteer.name` | string | Volunteer full name |
| `data.applications[].volunteer.avatar_url` | string \| null | Cloudinary URL cho profile picture |
| `data.pagination.current_page` | number | Current page number |
| `data.pagination.total_pages` | number | Total number of pages |
| `data.pagination.total_records` | number | Total number of applications (all pages) |
| `data.pagination.limit` | number | Records per page |

**Business Rules**:
- Applications are sorted by `submitted_at` DESC (newest first)
- Empty array `[]` nếu không có applications
- Volunteer sensitive data (address, ID card, phone, email) NEVER exposed
- Only applications thuộc events của Staff's organization are returned

---

### Error Responses

#### 400 Bad Request - Invalid Query Parameters

**Scenario 1: Invalid status value**

```json
{
  "success": false,
  "error": "Invalid status value. Must be one of: SUBMITTED, APPROVED, REJECTED"
}
```

**Scenario 2: Invalid page number**

```json
{
  "success": false,
  "error": "Page must be between 1 and 1000"
}
```

**Scenario 3: Invalid limit**

```json
{
  "success": false,
  "error": "Limit must be between 1 and 100"
}
```

**Scenario 4: Invalid eventId format**

```json
{
  "success": false,
  "error": "Invalid event ID format"
}
```

**Scenario 5: Page out of range**

```json
{
  "success": false,
  "error": "Page 10 exceeds maximum 5"
}
```

---

#### 401 Unauthorized - Missing JWT Token

**Scenario**: Request không có JWT cookie hoặc token invalid

```json
{
  "success": false,
  "error": "Authentication required"
}
```

**Trigger**:
- No `vms_access_token` cookie
- Token expired
- Token signature invalid

---

#### 403 Forbidden - Organization Ownership Violation

**Scenario**: Staff cố gắng xem applications của event thuộc organization khác

```json
{
  "success": false,
  "error": "You do not have permission to view applications for this event"
}
```

**Trigger**:
- `event.organization_id !== staff.organization_id`
- Staff role không có quyền xem applications của org khác

---

#### 404 Not Found - Event Not Found

**Scenario**: Event ID không tồn tại hoặc event đã bị soft-delete

```json
{
  "success": false,
  "error": "Event not found"
}
```

**Trigger**:
- Event ID không tồn tại trong database
- Event có `is_active = false` (soft-deleted)

---

#### 500 Internal Server Error

**Scenario**: Database error, unexpected exception

```json
{
  "success": false,
  "error": "An internal error occurred. Please try again later."
}
```

**Trigger**:
- Database connection timeout
- Prisma query error
- Unhandled exception trong service layer

**Note**: NEVER expose stack traces hoặc sensitive error details trong production response.

---

## Examples

### Example 1: View All Applications (No Filter)

**Request**:
```bash
curl -X GET \
  'http://localhost:5000/api/v1/events/550e8400-e29b-41d4-a716-446655440000/applications' \
  -H 'Cookie: vms_access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "app-001",
        "status": "SUBMITTED",
        "notes": "Excited to join this event!",
        "submitted_at": "2026-06-20T14:30:00.000Z",
        "volunteer": {
          "id": "user-101",
          "name": "Nguyễn Văn A",
          "avatar_url": "https://cdn.cloudinary.com/avatars/user-101.jpg"
        }
      },
      {
        "id": "app-002",
        "status": "APPROVED",
        "notes": null,
        "submitted_at": "2026-06-19T09:15:00.000Z",
        "volunteer": {
          "id": "user-102",
          "name": "Trần Thị B",
          "avatar_url": null
        }
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_records": 2,
      "limit": 20
    }
  }
}
```

---

### Example 2: Filter by SUBMITTED Status

**Request**:
```bash
curl -X GET \
  'http://localhost:5000/api/v1/events/550e8400-e29b-41d4-a716-446655440000/applications?status=SUBMITTED' \
  -H 'Cookie: vms_access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "app-001",
        "status": "SUBMITTED",
        "notes": "Excited to join this event!",
        "submitted_at": "2026-06-20T14:30:00.000Z",
        "volunteer": {
          "id": "user-101",
          "name": "Nguyễn Văn A",
          "avatar_url": "https://cdn.cloudinary.com/avatars/user-101.jpg"
        }
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_records": 1,
      "limit": 20
    }
  }
}
```

---

### Example 3: Pagination (Page 2, 10 per page)

**Request**:
```bash
curl -X GET \
  'http://localhost:5000/api/v1/events/550e8400-e29b-41d4-a716-446655440000/applications?page=2&limit=10' \
  -H 'Cookie: vms_access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "app-011",
        "status": "APPROVED",
        "notes": "Looking forward to helping!",
        "submitted_at": "2026-06-18T10:00:00.000Z",
        "volunteer": {
          "id": "user-111",
          "name": "Lê Văn C",
          "avatar_url": null
        }
      }
    ],
    "pagination": {
      "current_page": 2,
      "total_pages": 3,
      "total_records": 25,
      "limit": 10
    }
  }
}
```

---

### Example 4: Empty Result (No Applications)

**Request**:
```bash
curl -X GET \
  'http://localhost:5000/api/v1/events/550e8400-e29b-41d4-a716-446655440000/applications?status=REJECTED' \
  -H 'Cookie: vms_access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "applications": [],
    "pagination": {
      "current_page": 1,
      "total_pages": 0,
      "total_records": 0,
      "limit": 20
    }
  }
}
```

**Frontend UI**: Hiển thị message "No applications found for this event" (FR-005)

---

### Example 5: 403 Forbidden (Wrong Organization)

**Request**:
```bash
# Staff từ Organization A cố gắng xem event của Organization B
curl -X GET \
  'http://localhost:5000/api/v1/events/event-of-org-b/applications' \
  -H 'Cookie: vms_access_token=staff-token-from-org-a'
```

**Response** (403 Forbidden):
```json
{
  "success": false,
  "error": "You do not have permission to view applications for this event"
}
```

---

### Example 6: 400 Bad Request (Invalid Status)

**Request**:
```bash
curl -X GET \
  'http://localhost:5000/api/v1/events/550e8400-e29b-41d4-a716-446655440000/applications?status=PENDING' \
  -H 'Cookie: vms_access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Invalid status value. Must be one of: SUBMITTED, APPROVED, REJECTED"
}
```

---

## Implementation Notes

### Controller Layer

```javascript
// backend/src/controllers/application.controller.js

import ApplicationService from '../services/application.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';
import logger from '../config/logger.config.js';

export const getApplicationsByEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    const staffOrgId = req.user.organization_id; // From JWT token
    
    logger.info(`Staff ${req.user.id} viewing applications for event ${eventId}`);
    
    const result = await ApplicationService.getApplicationsByEvent(
      eventId,
      staffOrgId,
      { status, page: parseInt(page), limit: parseInt(limit) }
    );
    
    return successResponse(res, result);
  } catch (error) {
    next(error); // Let error middleware handle
  }
};
```

---

### Service Layer

```javascript
// backend/src/services/application.service.js

import ApplicationRepository from '../repositories/application.repository.js';
import EventRepository from '../repositories/event.repository.js';
import { ForbiddenError, NotFoundError, BadRequestError } from '../utils/errors.util.js';
import logger from '../config/logger.config.js';

class ApplicationService {
  async getApplicationsByEvent(eventId, staffOrgId, filters) {
    // Step 1: Validate event ownership
    const event = await EventRepository.findByIdAndOrganization(eventId, staffOrgId);
    if (!event) {
      throw new ForbiddenError('You do not have permission to view applications for this event');
    }
    
    // Step 2: Get total count (for pagination)
    const totalRecords = await ApplicationRepository.countByEventId(eventId, filters.status);
    
    // Step 3: Validate pagination bounds
    const totalPages = Math.ceil(totalRecords / filters.limit);
    if (filters.page > totalPages && totalRecords > 0) {
      throw new BadRequestError(`Page ${filters.page} exceeds maximum ${totalPages}`);
    }
    
    // Step 4: Query applications with JOIN
    const applications = await ApplicationRepository.findByEventId(eventId, filters);
    
    // Step 5: Audit log
    logger.info(`Staff ${staffOrgId} viewed applications for event ${eventId}`, {
      filters,
      result_count: applications.length
    });
    
    return {
      applications,
      pagination: {
        current_page: filters.page,
        total_pages: totalPages,
        total_records: totalRecords,
        limit: filters.limit
      }
    };
  }
}

export default new ApplicationService();
```

---

### Repository Layer

```javascript
// backend/src/repositories/application.repository.js

import { prisma } from '../config/database.config.js';
import { USER_PUBLIC_PROFILE_SELECT } from '../constants/application.constants.js';

class ApplicationRepository {
  async findByEventId(eventId, filters) {
    const { status, page, limit } = filters;
    const offset = (page - 1) * limit;
    
    return await prisma.application.findMany({
      where: {
        event_id: eventId,
        ...(status && { status }), // Conditional filter
        event: {
          is_active: true // Only active events
        }
      },
      select: {
        id: true,
        status: true,
        notes: true,
        created_at: true,
        user: {
          select: USER_PUBLIC_PROFILE_SELECT // Safe fields only
        }
      },
      orderBy: {
        created_at: 'desc' // Newest first
      },
      skip: offset,
      take: limit
    });
  }
  
  async countByEventId(eventId, status) {
    return await prisma.application.count({
      where: {
        event_id: eventId,
        ...(status && { status }),
        event: {
          is_active: true
        }
      }
    });
  }
}

export default new ApplicationRepository();
```

---

## Validation

### Zod Schema

```javascript
// backend/src/validators/application.validator.js

import { z } from 'zod';

export const getApplicationsQuerySchema = z.object({
  status: z.enum(['SUBMITTED', 'APPROVED', 'REJECTED']).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const eventIdParamSchema = z.object({
  eventId: z.string().uuid({ message: 'Invalid event ID format' })
});
```

---

## Testing

### Integration Test Cases

```javascript
// backend/tests/integration/application.test.js

describe('GET /api/v1/events/:eventId/applications', () => {
  let staffToken;
  let eventId;
  
  beforeAll(async () => {
    // Setup test data
    staffToken = await generateStaffToken('org-123');
    eventId = await createTestEvent('org-123');
    await createTestApplications(eventId, 25); // 25 applications
  });
  
  it('should return 401 without JWT token', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${eventId}/applications`);
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
  
  it('should return paginated applications', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${eventId}/applications`)
      .set('Cookie', `vms_access_token=${staffToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.applications).toBeInstanceOf(Array);
    expect(res.body.data.applications.length).toBeLessThanOrEqual(20);
    expect(res.body.data.pagination.total_records).toBe(25);
  });
  
  it('should filter by status=SUBMITTED', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${eventId}/applications?status=SUBMITTED`)
      .set('Cookie', `vms_access_token=${staffToken}`);
    
    expect(res.status).toBe(200);
    res.body.data.applications.forEach(app => {
      expect(app.status).toBe('SUBMITTED');
    });
  });
  
  it('should return 403 for wrong organization', async () => {
    const wrongOrgToken = await generateStaffToken('org-456');
    const res = await request(app)
      .get(`/api/v1/events/${eventId}/applications`)
      .set('Cookie', `vms_access_token=${wrongOrgToken}`);
    
    expect(res.status).toBe(403);
  });
  
  it('should not expose sensitive user data', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${eventId}/applications`)
      .set('Cookie', `vms_access_token=${staffToken}`);
    
    res.body.data.applications.forEach(app => {
      expect(app.volunteer).not.toHaveProperty('address');
      expect(app.volunteer).not.toHaveProperty('identity_card_number');
      expect(app.volunteer).not.toHaveProperty('phone_number');
      expect(app.volunteer).not.toHaveProperty('email');
    });
  });
  
  it('should handle pagination correctly', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${eventId}/applications?page=2&limit=10`)
      .set('Cookie', `vms_access_token=${staffToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.pagination.current_page).toBe(2);
    expect(res.body.data.pagination.limit).toBe(10);
  });
});
```

---

## Performance Benchmarks

### Target Metrics

| Metric | Target | Method |
|--------|--------|--------|
| p50 response time | <150ms | Apache Bench |
| p95 response time | <200ms | Apache Bench |
| p99 response time | <300ms | Apache Bench |
| First 50 records | <1.2s | SC-001 from SPEC.md |
| Concurrent requests | 100 req/s | Load testing |

### Load Test Script

```bash
# Apache Bench test
ab -n 1000 -c 100 \
  -H "Cookie: vms_access_token=test-token" \
  http://localhost:5000/api/v1/events/event-123/applications

# Expected results:
# Time per request: <200ms (mean, across all concurrent requests)
# Transfer rate: >1000 KB/sec
# Failed requests: 0
```

---

## Swagger Documentation

```javascript
/**
 * @swagger
 * /api/v1/events/{eventId}/applications:
 *   get:
 *     summary: Get applications for an event
 *     description: Staff xem danh sách tình nguyện viên đã đăng ký tham gia sự kiện. Hỗ trợ filter theo status và phân trang.
 *     tags: [Applications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SUBMITTED, APPROVED, REJECTED]
 *         description: Filter by application status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Records per page
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     applications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ApplicationListItem'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event Not Found
 *       500:
 *         description: Internal Server Error
 */
```

---

## Security Considerations

### OWASP Top 10 Compliance

- ✅ **A01:2021 – Broken Access Control**: Organization ownership validation prevents horizontal privilege escalation
- ✅ **A02:2021 – Cryptographic Failures**: Sensitive data (address, ID card) filtered at database level
- ✅ **A03:2021 – Injection**: Prisma parameterized queries prevent SQL injection
- ✅ **A04:2021 – Insecure Design**: Pagination limits prevent DOS attacks (max 100 records/request)
- ✅ **A05:2021 – Security Misconfiguration**: JWT HttpOnly cookies prevent XSS token theft
- ✅ **A07:2021 – Identification and Authentication Failures**: JWT authentication required

---

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-06-29 | TienTD | Initial API contract for UC22 |

---

**Contract Status**: READY FOR REVIEW  
**Next Step**: Update `share_context.md` với contract mới sau khi approved

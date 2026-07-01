# API Endpoint Contract: GET /api/v1/feedbacks/:id

**Feature**: View Feedback Detail (UC50)  
**Date**: 2026-07-01  
**Status**: Phase 1 Design  
**Owner**: Member 3 - TienTD

---

## Endpoint Overview

**Method**: `GET`  
**Path**: `/api/v1/feedbacks/:id`  
**Purpose**: Retrieve full feedback detail with volunteer and event context  
**Category**: Feedback Management

**Authentication**: ✅ Required (JWT HttpOnly Cookie)  
**Authorization**: ✅ STAFF, MANAGER, ADMIN roles only

---

## Request Specification

### HTTP Method
```
GET
```

### URL Pattern
```
/api/v1/feedbacks/{feedbackId}
```

### Path Parameters

| Parameter | Type | Required | Format | Description |
|-----------|------|----------|--------|-------------|
| `id` | string | Yes | UUID v4 | Feedback unique identifier |

**Example**:
```
/api/v1/feedbacks/f7b3c1a0-1234-4567-89ab-cdef01234567
```

### Query Parameters

None required.

### Request Headers

| Header | Required | Value | Description |
|--------|----------|-------|-------------|
| `Cookie` | Yes | `jwt=<token>` | JWT authentication token (HttpOnly) |
| `Accept` | No | `application/json` | Response format (default: JSON) |

### Request Body

None (GET request).

### Example Request

```http
GET /api/v1/feedbacks/f7b3c1a0-1234-4567-89ab-cdef01234567 HTTP/1.1
Host: api.vms.local
Cookie: jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

**cURL Example**:
```bash
curl -X GET \
  'http://localhost:5000/api/v1/feedbacks/f7b3c1a0-1234-4567-89ab-cdef01234567' \
  -H 'Cookie: jwt=<YOUR_JWT_TOKEN>'
```

---

## Response Specification

### Success Response (200 OK)

**Status Code**: `200 OK`

**Response Body** (Non-Anonymous Feedback):
```json
{
  "success": true,
  "data": {
    "feedback": {
      "id": "f7b3c1a0-1234-4567-89ab-cdef01234567",
      "rating": 5,
      "comment": "Sự kiện rất hay và ý nghĩa!\nMình đã học được nhiều điều từ các hoạt động.\nCảm ơn BTC đã tổ chức.",
      "is_anonymous": false,
      "created_at": "2026-06-20T15:30:00.000Z",
      "volunteer": {
        "id": "u8a4d2b1-5678-90ab-cdef-123456789012",
        "full_name": "Nguyễn Văn A",
        "avatar_url": "https://res.cloudinary.com/vms-cloud/image/upload/v1719123456/avatars/user123.jpg"
      },
      "event": {
        "id": "e9c5e3d2-7890-abcd-ef12-345678901234",
        "title": "Community Beach Cleanup 2026",
        "start_date": "2026-06-15T08:00:00.000Z",
        "end_date": "2026-06-15T17:00:00.000Z"
      },
      "images": []
    }
  }
}
```

**Response Body** (Anonymous Feedback):
```json
{
  "success": true,
  "data": {
    "feedback": {
      "id": "a1b2c3d4-5678-90ab-cdef-123456789abc",
      "rating": 4,
      "comment": "Great event! Thank you.",
      "is_anonymous": true,
      "created_at": "2026-06-21T10:15:00.000Z",
      "volunteer": null,
      "event": {
        "id": "e9c5e3d2-7890-abcd-ef12-345678901234",
        "title": "Community Beach Cleanup 2026",
        "start_date": "2026-06-15T08:00:00.000Z",
        "end_date": "2026-06-15T17:00:00.000Z"
      },
      "images": []
    }
  }
}
```

**Response Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | Yes | Always `true` for 200 responses |
| `data` | object | Yes | Response payload wrapper |
| `data.feedback` | object | Yes | Feedback entity |
| `data.feedback.id` | string | Yes | Feedback UUID |
| `data.feedback.rating` | number \| null | Yes | Rating 1-5, or null |
| `data.feedback.comment` | string | Yes | Full comment text with line breaks |
| `data.feedback.is_anonymous` | boolean | Yes | Anonymous status flag |
| `data.feedback.created_at` | string | Yes | ISO 8601 timestamp |
| `data.feedback.volunteer` | object \| null | Yes | Volunteer info (null if anonymous) |
| `data.feedback.volunteer.id` | string | Conditional | User UUID (if not anonymous) |
| `data.feedback.volunteer.full_name` | string | Conditional | Full name (if not anonymous) |
| `data.feedback.volunteer.avatar_url` | string \| null | Conditional | Avatar URL (if not anonymous) |
| `data.feedback.event` | object | Yes | Event context |
| `data.feedback.event.id` | string | Yes | Event UUID |
| `data.feedback.event.title` | string | Yes | Event title |
| `data.feedback.event.start_date` | string | Yes | ISO 8601 timestamp |
| `data.feedback.event.end_date` | string | Yes | ISO 8601 timestamp |
| `data.feedback.images` | array | Yes | Image URLs (empty array for MVP) |

---

### Error Responses

#### 400 Bad Request (Invalid UUID)

**Status Code**: `400 Bad Request`

**Trigger**: feedbackId không đúng format UUID

**Response Body**:
```json
{
  "success": false,
  "error": "Invalid feedback ID format"
}
```

**Example Request**:
```bash
curl -X GET 'http://localhost:5000/api/v1/feedbacks/invalid-uuid-123' \
  -H 'Cookie: jwt=<TOKEN>'
```

---

#### 401 Unauthorized

**Status Code**: `401 Unauthorized`

**Trigger**: 
- Missing JWT token
- Invalid/expired JWT token
- JWT signature verification failed

**Response Body**:
```json
{
  "success": false,
  "error": "Authentication required"
}
```

**Example Request** (Missing cookie):
```bash
curl -X GET 'http://localhost:5000/api/v1/feedbacks/f7b3c1a0-1234-4567-89ab-cdef01234567'
# No Cookie header
```

---

#### 403 Forbidden (Insufficient Role)

**Status Code**: `403 Forbidden`

**Trigger**: User role is VOLUNTEER (not STAFF/MANAGER/ADMIN)

**Response Body**:
```json
{
  "success": false,
  "error": "Insufficient permissions - STAFF role required"
}
```

**Business Rule**: Only STAFF, MANAGER, and ADMIN can view feedback details.

---

#### 403 Forbidden (Wrong Organization)

**Status Code**: `403 Forbidden`

**Trigger**: Staff's organization_id ≠ event.organization_id

**Response Body**:
```json
{
  "success": false,
  "error": "Access denied - feedback belongs to another organization"
}
```

**Business Rule**: Staff can only view feedbacks from events owned by their organization.

**Example Scenario**:
```
Staff A (Org 1) → GET /feedbacks/{feedback-from-org-2-event} → 403
```

---

#### 404 Not Found

**Status Code**: `404 Not Found`

**Trigger**:
- Feedback ID không tồn tại trong database
- Feedback đã bị soft delete (`is_active = false`)
- Event đã bị soft delete

**Response Body**:
```json
{
  "success": false,
  "error": "Feedback not found"
}
```

**Security Note**: Trả về 404 (không phải 403) để tránh information disclosure về tồn tại của feedback.

---

#### 500 Internal Server Error

**Status Code**: `500 Internal Server Error`

**Trigger**: 
- Database connection failed
- Prisma query error
- Unexpected exception

**Response Body**:
```json
{
  "success": false,
  "error": "Internal server error"
}
```

**Note**: Detailed error message KHÔNG được expose ra client (security best practice).

---

## Authorization Logic

### Flow Diagram

```
Request → JWT Middleware → Role Check → Organization Check → Repository Query → Response
            ↓                 ↓              ↓                  ↓
          401 Unauthorized  403 Role      403 Org Mismatch   200 OK / 404
```

### Authorization Steps

1. **JWT Validation** (Middleware):
   ```typescript
   const token = req.cookies.jwt;
   if (!token) throw UnauthorizedError('Authentication required');
   
   const decoded = jwt.verify(token, JWT_SECRET);
   req.user = { id: decoded.userId, role: decoded.role, organization_id: decoded.organizationId };
   ```

2. **Role Check** (Middleware):
   ```typescript
   if (!['STAFF', 'MANAGER', 'ADMIN'].includes(req.user.role)) {
     throw ForbiddenError('STAFF role required');
   }
   ```

3. **Organization Check** (Repository):
   ```typescript
   const feedback = await prisma.feedback.findFirst({
     where: {
       id: feedbackId,
       is_active: true,
       event: {
         organization_id: req.user.organization_id,
         is_active: true
       }
     },
     include: { user, event }
   });
   
   if (!feedback) throw NotFoundError('Feedback not found');
   ```

---

## Performance Contract

### Response Time Targets

| Metric | Target | Expected | Measurement Point |
|--------|--------|----------|-------------------|
| API Response Time (p50) | < 200ms | ~80ms | Server processing |
| API Response Time (p95) | < 500ms | ~150ms | Server processing |
| API Response Time (p99) | < 1000ms | ~300ms | Server processing |
| Database Query | < 100ms | ~30ms | Prisma query execution |

### Payload Size

| Scenario | Typical Size | Maximum Size |
|----------|--------------|--------------|
| Without images | ~500 bytes | ~2 KB |
| With images (MVP: 0) | N/A | N/A |
| Future: With 3 images | ~3 KB | ~10 KB |

### Database Queries

**Query Count**: Exactly **1 SELECT** with JOINs

**Query Pattern**:
```sql
SELECT f.*, u.full_name, u.avatar_url, e.title, e.start_date, e.end_date
FROM feedbacks f
INNER JOIN users u ON f.user_id = u.id
INNER JOIN events e ON f.event_id = e.id
WHERE f.id = ? AND e.organization_id = ? AND f.is_active = true;
```

**Indexes Used**:
- `feedbacks.id` (PRIMARY KEY)
- `events.organization_id` (INDEX)
- `feedbacks.user_id` (INDEX)
- `feedbacks.event_id` (INDEX)

---

## Security Contract

### Authentication

**Method**: JWT HttpOnly Cookie

**Token Location**: `Cookie: jwt=<token>`

**Token Validation**:
- ✅ Signature verification (HMAC SHA-256)
- ✅ Expiration check (`exp` claim)
- ✅ Issuer validation (`iss` claim)
- ✅ Not-before check (`nbf` claim)

### Authorization

**Role-Based Access Control (RBAC)**:
- ✅ Allowed roles: STAFF, MANAGER, ADMIN
- ❌ Denied roles: VOLUNTEER, GUEST

**Organization-Based Access Control (OBAC)**:
- ✅ Staff can only view feedbacks from their own organization's events
- ❌ Cross-organization access denied (returns 404, not 403)

### Data Protection

**PII Protection**:
- ❌ MUST NOT expose: `user.email`, `user.phone`, `user.password_hash`
- ✅ Anonymous feedback: `volunteer` field set to `null`

**SQL Injection Prevention**:
- ✅ Prisma ORM with parameterized queries
- ✅ Zod validation for UUID format
- ✅ No raw SQL execution

**XSS Prevention**:
- ✅ React auto-escapes HTML in comments
- ✅ Content-Type: application/json (not text/html)

---

## Testing Contract

### Test Scenarios (Required)

**Happy Path Tests** (4 scenarios):
1. ✅ Staff views non-anonymous feedback → 200 OK with full data
2. ✅ Staff views anonymous feedback → 200 OK with `volunteer: null`
3. ✅ Manager views feedback from their org → 200 OK
4. ✅ Admin views any feedback → 200 OK

**Error Path Tests** (5 scenarios):
5. ✅ Invalid UUID format → 400 Bad Request
6. ✅ Missing JWT token → 401 Unauthorized
7. ✅ VOLUNTEER role attempts access → 403 Forbidden
8. ✅ Staff from Org A views feedback from Org B event → 404 Not Found
9. ✅ Feedback ID doesn't exist → 404 Not Found

**Edge Case Tests** (3 scenarios):
10. ✅ Comment với line breaks → Preserved in response
11. ✅ Comment với 10,000 characters → No truncation, returns full text
12. ✅ Expired JWT token → 401 Unauthorized

### Performance Tests

**Load Test**:
- Concurrent requests: 50 users
- Target: p95 < 500ms
- Success rate: > 99%

**Stress Test**:
- Concurrent requests: 100 users
- Target: p99 < 1000ms
- No 5xx errors

---

## Integration Points

### Upstream Dependencies

**Services UC50 Depends On**:

| Service | Method | Purpose | Failure Mode |
|---------|--------|---------|--------------|
| Auth Service | `authenticate()` | JWT validation | 401 Unauthorized |
| Auth Service | `authorize(['STAFF'])` | Role check | 403 Forbidden |
| Feedback Repository | `getById(id, orgId)` | Fetch feedback | 404 Not Found |

**No External API Calls**: All data from internal database.

### Downstream Consumers

**Who Calls This Endpoint**:

| Consumer | Context | Frequency |
|----------|---------|-----------|
| UC49 (Feedback List) | User clicks row | High (primary use case) |
| Future: Email Notifications | Link in email | Low |
| Future: Mobile App | Detail screen | Medium |

---

## Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-07-01 | Initial contract creation | TienTD |

---

## Appendix: Example Scenarios

### Scenario 1: Staff views detailed feedback

**Request**:
```bash
curl -X GET \
  'http://localhost:5000/api/v1/feedbacks/f7b3c1a0-1234-4567-89ab-cdef01234567' \
  -H 'Cookie: jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJzdGFmZi1hIiwicm9sZSI6IlNUQUZGIiwib3JnYW5pemF0aW9uSWQiOjEsImlhdCI6MTcxOTEyMzQ1NiwiZXhwIjoxNzE5MTI3MDU2fQ.abc123...'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "feedback": {
      "id": "f7b3c1a0-1234-4567-89ab-cdef01234567",
      "rating": 5,
      "comment": "Sự kiện rất tốt!\nCảm ơn BTC.",
      "is_anonymous": false,
      "created_at": "2026-06-20T15:30:00.000Z",
      "volunteer": {
        "id": "u8a4d2b1-5678-90ab-cdef-123456789012",
        "full_name": "Nguyễn Văn A",
        "avatar_url": "https://res.cloudinary.com/.../avatar.jpg"
      },
      "event": {
        "id": "e9c5e3d2-7890-abcd-ef12-345678901234",
        "title": "Community Beach Cleanup 2026",
        "start_date": "2026-06-15T08:00:00.000Z",
        "end_date": "2026-06-15T17:00:00.000Z"
      },
      "images": []
    }
  }
}
```

---

### Scenario 2: Cross-organization access denied

**Setup**:
- Staff A belongs to Organization 1
- Feedback belongs to Event owned by Organization 2

**Request**:
```bash
curl -X GET \
  'http://localhost:5000/api/v1/feedbacks/org2-feedback-id' \
  -H 'Cookie: jwt=<ORG1_STAFF_TOKEN>'
```

**Response**:
```json
{
  "success": false,
  "error": "Feedback not found"
}
```

**Status Code**: `404 Not Found` (not 403, to avoid info leak)

---

### Scenario 3: Anonymous feedback

**Request**:
```bash
curl -X GET \
  'http://localhost:5000/api/v1/feedbacks/anonymous-feedback-id' \
  -H 'Cookie: jwt=<STAFF_TOKEN>'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "feedback": {
      "id": "anonymous-feedback-id",
      "rating": 4,
      "comment": "Good event.",
      "is_anonymous": true,
      "created_at": "2026-06-21T10:15:00.000Z",
      "volunteer": null,
      "event": {
        "id": "event-id",
        "title": "Community Beach Cleanup 2026",
        "start_date": "2026-06-15T08:00:00.000Z",
        "end_date": "2026-06-15T17:00:00.000Z"
      },
      "images": []
    }
  }
}
```

---

**Contract Status**: ✅ READY FOR IMPLEMENTATION

**Last Updated**: 2026-07-01  
**Owner**: Member 3 - TienTD

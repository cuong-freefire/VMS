# API Contract: GET /applications/:applicationId

**Endpoint**: `GET /api/v1/applications/:applicationId`  
**Feature**: View Application Detail (UC23)  
**Owner**: DucNM - Application Module  
**Date**: 2026-06-29 | **Updated**: 2026-07-28  
**Status**: IMPLEMENTED

---

## Authentication
- **Required**: Yes (JWT token in HttpOnly cookie)
- **Role**: STAFF, MANAGER, ADMIN

---

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `applicationId` | Integer | Yes | Application ID to fetch (positive integer) |

---

## Request Example

```http
GET /api/v1/applications/1 HTTP/1.1
Host: api.vms.com
Cookie: token=<jwt_token>
```

---

## Response 200 OK

```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 5,
    "eventId": 10,
    "status": "PENDING",
    "message": "I am passionate about volunteering...",
    "processedBy": null,
    "processedAt": null,
    "createdAt": "2026-06-15T10:30:00.000Z",
    "updatedAt": "2026-06-15T10:30:00.000Z",
    "volunteer": {
      "id": 5,
      "fullName": "Nguyen Van A",
      "email": "nguyenvana@example.com",
      "phone": "+84901234567",
      "avatarUrl": "https://cloudinary.com/avatar.jpg",
      "skills": [
        {
          "id": 1,
          "name": "First Aid"
        },
        {
          "id": 2,
          "name": "Communication"
        }
      ]
    },
    "event": {
      "id": 10,
      "title": "Community Cleanup 2026",
      "startDate": "2026-07-01T08:00:00.000Z",
      "endDate": "2026-07-01T17:00:00.000Z"
    }
  }
}
```

---

## Error Responses

### 400 Bad Request - Invalid Application ID Format

```json
{
  "success": false,
  "message": "Mã đơn đăng ký phải là số nguyên dương",
  "code": "VALIDATION_ERROR",
  "details": null
}
```

### 401 Unauthorized - Missing/Invalid Token

```json
{
  "success": false,
  "message": "Vui lòng đăng nhập.",
  "code": "UNAUTHORIZED",
  "details": null
}
```

### 403 Forbidden - Event Ownership Violation

```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập tài nguyên này",
  "code": "FORBIDDEN",
  "details": null
}
```

### 404 Not Found - Application Not Found

```json
{
  "success": false,
  "message": "Application not found",
  "code": "RESOURCE_NOT_FOUND",
  "details": null
}
```

---

## Business Rules

1. **Event Creator Access Control**: Staff can ONLY view applications for events they created (`created_by`)
2. **Sensitive Data Protection**: NEVER expose `passwordHash` in response
3. **No status auto-change**: Viewing detail does NOT change application status

---

## Security Notes

- Event ownership validation via `event.createdBy` check in service layer
- Sensitive fields filtered using Prisma select in repository layer
- Response format follows `response.util.js` standard

---

**Contract Status**: IMPLEMENTED  
**Last Updated**: 2026-07-28
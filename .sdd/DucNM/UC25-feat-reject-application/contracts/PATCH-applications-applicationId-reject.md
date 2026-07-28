# API Contract: Reject Single Application

**Endpoint**: `PATCH /api/v1/applications/:applicationId/reject`  
**Feature**: UC25 - Reject Application  
**Authentication**: Required (JWT HttpOnly cookie `token`)  
**Authorization**: Staff role + created_by ownership of Event

**Consistency Check**: Aligned with Prisma schema v3.0, response.util.js.

---

## Overview

Staff từ chối một đơn đăng ký volunteer. Hệ thống:
1. Validate ownership (Staff chỉ reject application của event do mình tạo — `created_by`)
2. Update application status + timestamp + message (rejection reason) + processedBy
3. `message` field stores the rejection reason (no separate `rejection_reason` field on Application model)

---

## Request

### HTTP Method
`PATCH`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `applicationId` | Integer | ✅ YES | Application ID to reject (positive integer) |

### Request Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Cookie` | String | ✅ YES | `token=<jwt>` |
| `Content-Type` | String | ✅ YES | `application/json` |

### Request Body

```json
{
  "message": "Hồ sơ chưa đủ kinh nghiệm tổ chức sự kiện"
}
```

**Validation Rules**:
- `message`: Required string, min 10 characters, max 2000 characters (stored in Application.message field)

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Từ chối đơn đăng ký thành công",
  "data": {
    "id": 1,
    "userId": 5,
    "eventId": 10,
    "status": "REJECTED",
    "message": "Hồ sơ chưa đủ kinh nghiệm tổ chức sự kiện",
    "processedBy": 3,
    "processedAt": "2026-07-18T10:00:00.000Z",
    "createdAt": "2026-07-20T08:30:00.000Z",
    "updatedAt": "2026-07-18T10:00:00.000Z"
  }
}
```

### Error Responses (theo response.util.js)

#### 400 Bad Request - Invalid State or Validation
```json
{
  "success": false,
  "message": "Lý do từ chối phải có ít nhất 10 ký tự",
  "code": "VALIDATION_ERROR",
  "details": null
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Vui lòng đăng nhập.",
  "code": "UNAUTHORIZED",
  "details": null
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập tài nguyên này",
  "code": "FORBIDDEN",
  "details": null
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Application not found",
  "code": "RESOURCE_NOT_FOUND",
  "details": null
}
```

#### 409 Conflict
```json
{
  "success": false,
  "message": "Application in APPROVED state cannot be processed",
  "code": "INVALID_STATUS",
  "details": null
}
```

---

## Business Rules

### State Transition
- ✅ `PENDING` → `REJECTED`: Allowed
- ❌ `APPROVED` → `REJECTED`: 409 Conflict
- ❌ `REJECTED` → `REJECTED`: 409 Conflict
- ❌ `CANCELLED` → `REJECTED`: 409 Conflict

### Rejection Reason
- Stored in Application.`message` field (Prisma schema has no `rejection_reason` on Application)
- Required, minimum 10 characters, maximum 2000 characters

---

**Contract Version**: 3.0  
**Last Updated**: 2026-07-28  
**Status**: IMPLEMENTED
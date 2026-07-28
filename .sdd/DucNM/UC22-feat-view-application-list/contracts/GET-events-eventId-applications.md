# API Contract: GET /api/v1/events/:eventId/applications

**Feature**: View Application List (UC22)  
**Date**: 2026-06-29 | **Updated**: 2026-07-18  
**Version**: 2.0  
**Status**: REVIEWED

**Consistency Check**: Aligned with Prisma schema v3.0, response.util.js.

---

## Overview

API endpoint cho Staff để xem danh sách tình nguyện viên đã đăng ký tham gia một sự kiện cụ thể.

---

## Endpoint Details

### HTTP Method & URL
```
GET /api/v1/events/:eventId/applications
```

### Authentication
**Required**: ✅ Yes  
**Method**: JWT HttpOnly cookie (`token`)  
**Roles**: `STAFF`, `MANAGER`, `ADMIN`

---

## Request

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventId` | Integer | ✅ Yes | ID của event cần xem applications |

### Query Parameters

| Parameter | Type | Required | Default | Description | Validation |
|-----------|------|----------|---------|-------------|------------|
| `status` | string (enum) | ❌ No | (all) | Filter: `pending`, `approved`, `rejected`, `cancelled` | Must be valid enum |
| `page` | number | ❌ No | `1` | Page number | Integer 1-1000 |
| `limit` | number | ❌ No | `20` | Records per page | Integer 1-100 |

---

## Response

### Success Response (200 OK) — theo response.util.js

```json
{
  "success": true,
  "message": "Lấy danh sách thành công",
  "data": {
    "applications": [
      {
        "id": 1,
        "userId": 5,
        "eventId": 10,
        "status": "PENDING",
        "message": null,
        "processedBy": null,
        "processedAt": null,
        "createdAt": "2026-06-15T10:30:00.000Z",
        "updatedAt": "2026-06-15T10:30:00.000Z",
        "volunteer": {
          "id": 5,
          "fullName": "Nguyễn Văn A",
          "avatarUrl": "https://res.cloudinary.com/..."
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 87,
      "totalPages": 5
    }
  }
}
```

### Error Responses (theo response.util.js)

#### 400 Bad Request
```json
{
  "success": false,
  "message": "status: Trạng thái không hợp lệ. Phải là: pending, approved, rejected, cancelled",
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
  "message": "Event not found",
  "code": "RESOURCE_NOT_FOUND",
  "details": null
}
```

---

## Business Rules

- Applications are sorted by `createdAt` DESC (newest first)
- Empty array `[]` nếu không có applications
- Staff chỉ xem được applications của event do mình tạo (`created_by`)
- Status filter values use ApplicationStatus enum: `pending`, `approved`, `rejected`, `cancelled`

---

**Contract Version**: 2.0  
**Last Updated**: 2026-07-18  
**Status**: REVIEWED
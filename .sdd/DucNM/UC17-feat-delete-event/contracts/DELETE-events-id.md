# API Contract: DELETE /api/v1/events/:id

**Version**: 2.0  
**Feature**: Delete Event (UC17)  
**Owner**: DucNM  
**Last Updated**: 2026-07-18

**Consistency Check**: Aligned with Prisma schema v3.0 — soft delete via `isActive = false`.

---

## Overview

**Purpose**: Soft delete an event by setting `isActive = false`.

**Authentication**: Required (JWT HttpOnly Cookie `token`)
**Authorization**: Staff role, event ownership via `createdBy`

---

## Endpoint Specification

```http
DELETE /api/v1/events/:id
Cookie: token=<JWT>
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Event ID to delete |

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Xóa sự kiện thành công",
  "data": null
}
```

### Error Responses (theo response.util.js)

**401 Unauthorized**:
```json
{
  "success": false,
  "message": "Vui lòng đăng nhập.",
  "code": "UNAUTHORIZED",
  "details": null
}
```

**403 Forbidden** — Not event owner:
```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập tài nguyên này",
  "code": "FORBIDDEN",
  "details": null
}
```

**404 Not Found**:
```json
{
  "success": false,
  "message": "Event not found",
  "code": "EVENT_NOT_FOUND",
  "details": null
}
```

**409 Conflict** — Has applications or invalid status:
```json
{
  "success": false,
  "message": "Cannot delete event with existing applications",
  "code": "EVENT_HAS_APPLICATIONS",
  "details": null
}
```

---

## Business Rules

- Soft delete only: set `isActive = false`
- Cannot delete if event has applications (count > 0)
- Cannot delete if event status is `IN_PROGRESS` or `COMPLETED`
- Staff can only delete events they created (`createdBy`)

---

**Contract Version**: 2.0  
**Last Updated**: 2026-07-18  
**Status**: REVIEWED
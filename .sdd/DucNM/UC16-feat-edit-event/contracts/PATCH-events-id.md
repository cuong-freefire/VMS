# API Contract: PATCH /api/v1/events/:id

**Version**: 2.0  
**Feature**: Edit Event (UC16)  
**Owner**: DucNM  
**Last Updated**: 2026-07-18

**Consistency Check**: Aligned with Prisma schema v3.0, architecture decisions for event editing.

---

## Overview

**Purpose**: Update existing event information with ownership and state validation.

**Authentication**: Required (JWT HttpOnly Cookie `token`)
**Authorization**: Staff role, event ownership via `createdBy`

---

## Endpoint Specification

```http
PATCH /api/v1/events/:id
Content-Type: application/json
Cookie: token=<JWT>
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Event ID to update |

---

## Request Body Schema

All fields are optional. Only include fields that need updating.

```json
{
  "title": "string (10-500 chars, CRITICAL → resets to PENDING_APPROVAL)",
  "description": "string (50-5000 chars, SAFE)",
  "location": "string (5-500 chars, CRITICAL → resets to PENDING_APPROVAL)",
  "startDate": "ISO8601 datetime, CRITICAL → resets to PENDING_APPROVAL",
  "endDate": "ISO8601 datetime, CRITICAL → resets to PENDING_APPROVAL",
  "applicationDeadline": "ISO8601 datetime, CONDITIONAL (> now, < startDate)",
  "maxCapacity": "integer (1-10000, CONDITIONAL ≥ approvedParticipants)",
  "categoryId": "integer (CRITICAL → resets to PENDING_APPROVAL)",
  "imageUrl": "string (HTTPS URL, SAFE)"
}
```

### Field Classification

| Category | Fields | Behavior |
|----------|--------|----------|
| **SAFE** | `description`, `imageUrl` | Updated directly |
| **CONDITIONAL** | `maxCapacity`, `applicationDeadline` | Validated then updated |
| **CRITICAL** | `title`, `location`, `startDate`, `endDate`, `categoryId` | Updated + status reset to `PENDING_APPROVAL` |
| **READ ONLY** | `id`, `createdBy`, `approvedBy`, `approvedAt`, `rejectedBy`, `rejectedAt`, `rejectedReason`, `approvedParticipants`, `status`, `isActive`, `createdAt`, `updatedAt` | Never from client |

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Cập nhật sự kiện thành công",
  "data": {
    "id": 1,
    "title": "Updated Event Title",
    "status": "pending_approval",
    "updatedAt": "2026-07-18T10:00:00.000Z"
  }
}
```

### Error Responses (theo response.util.js)

**400 Bad Request** — Validation error:
```json
{
  "success": false,
  "message": "Title must be at least 10 characters",
  "code": "VALIDATION_ERROR",
  "details": null
}
```

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

**409 Conflict**:
```json
{
  "success": false,
  "message": "Cannot reduce max_capacity below approved_participants",
  "code": "INVALID_CAPACITY",
  "details": null
}
```

---

**Contract Version**: 2.0  
**Last Updated**: 2026-07-18  
**Status**: REVIEWED
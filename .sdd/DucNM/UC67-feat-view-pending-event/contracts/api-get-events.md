# API Contract: GET /api/v1/events

**Feature**: UC67 - View Pending Event List (extending UC08)
**Date**: 2026-07-04 | **Updated**: 2026-07-21
**Version**: 2.0

**Consistency Check**: Aligned with Prisma schema v3.0, no Organization model.

---

## Overview

Mở rộng endpoint `GET /api/v1/events` với query param `status` để hỗ trợ Manager/Admin xem sự kiện PENDING_APPROVAL.

---

## Endpoint

```
GET /api/v1/events
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Integer | No | 1 | Page number |
| `limit` | Integer | No | 20 | Items per page (max 100) |
| `status` | Enum | No | - | Filter: `pending_approval`, `published`, `draft`, `rejected`, `in_progress`, `completed`, `cancelled` |

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Lấy danh sách sự kiện thành công",
  "data": {
    "events": [
      {
        "event_id": 1,
        "title": "Dọn dẹp bãi biển",
        "status": "pending_approval",
        "created_by": { "id": 2, "full_name": "Staff Nguyễn", "email": "staff@example.com" },
        "created_at": "2026-07-01T08:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

### Error Responses (theo response.util.js)

**400 Bad Request**:
```json
{
  "success": false,
  "message": "Tham số page không hợp lệ",
  "code": "VALIDATION_ERROR",
  "details": null
}
```

**403 Forbidden**:
```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập tài nguyên này",
  "code": "FORBIDDEN",
  "details": null
}
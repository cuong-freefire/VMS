# Data Model: View Pending Event (UC67)

**Phase**: 1 — Design & Contracts
**Date**: 2026-07-04 | **Updated**: 2026-07-18
**Status**: REVIEWED

**Consistency Check**: Aligned with Prisma schema v3.0.

---

## 1. Entity: Event

### Fields (per Prisma schema)

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer (PK) | ID duy nhất của sự kiện |
| `title` | String (varchar 500) | Tên sự kiện |
| `status` | Enum | PENDING_APPROVAL, PUBLISHED, REJECTED, DRAFT, IN_PROGRESS, COMPLETED, CANCELLED |
| `createdBy` | Integer (FK) | ID người tạo |
| `createdAt` | DateTime | Ngày tạo |

### Status Workflow

```
DRAFT → PENDING_APPROVAL → PUBLISHED → IN_PROGRESS → COMPLETED
                            ↓
                         CANCELLED
              PENDING_APPROVAL → REJECTED → PENDING_APPROVAL (resubmit)
```

### Role-Based Access Control

| Role | Can view PENDING_APPROVAL? | Default view (no status) |
|------|---------------------------|--------------------------|
| Guest | No (401) | PUBLISHED only |
| Volunteer | No (403) | PUBLISHED only |
| Staff | No (403) | PUBLISHED only |
| Manager | Yes | All |
| Admin | Yes | All |

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Integer | No | 1 | Số trang |
| `limit` | Integer | No | 20 | Số items mỗi trang (max 100) |
| `status` | Enum | No | - | Lọc theo status: pending_approval, published, rejected, draft, in_progress, completed, cancelled |

### API Response Structure

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Lấy danh sách sự kiện thành công",
  "data": {
    "events": [
      {
        "event_id": 1,
        "title": "Dọn dẹp bãi biển",
        "created_by": { "id": 2, "full_name": "Staff A" },
        "status": "pending_approval",
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

**Error Responses** (theo response.util.js):
```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập tài nguyên này",
  "code": "FORBIDDEN",
  "details": null
}
# Data Model: Approve Event (UC69)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-06

---

## 1. Entity: Event (Approve)

### Fields (cập nhật)

| Field | Type | Description | Constraints |
|-------|------|-------------|------------|
| `event_id` | Integer (PK) | ID duy nhất của sự kiện | Primary key |
| `title` | String | Tên sự kiện | NOT NULL |
| `status` | String (varchar 50) | Trạng thái: PENDING, APPROVED, REJECTED, ONGOING, COMPLETED | NOT NULL |
| `approved_by` | Integer (FK, nullable) | **MỚI**: ID người phê duyệt | Foreign key → User |
| `approved_at` | DateTime (nullable) | **MỚI**: Thời điểm phê duyệt | Auto-set |
| `created_at` | DateTime | Ngày tạo | Auto |
| `updated_at` | DateTime | Ngày cập nhật | Auto |

### Entity: User (approver reference)

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | Integer (PK) | ID người dùng |
| `full_name` | String | Họ tên người phê duyệt |

### Relationships

```
Event N:1 → User (event.approved_by = user.user_id)
```

### Status Transition

```
PENDING → APPROVED (via UC69)
```

### Validation Rules

| Rule | Error Code | HTTP Status |
|------|------------|-------------|
| Event ID không tồn tại | `EVENT_NOT_FOUND` | 404 |
| Event status không phải PENDING | `INVALID_STATUS` | 409 |

---

## 2. API Request/Response

### Request

```
PATCH /api/v1/events/:id/approve
```

Không có request body.

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Phê duyệt sự kiện thành công",
  "data": {
    "event_id": 1,
    "title": "Dọn dẹp bãi biển",
    "status": "APPROVED",
    "approved_by": {
      "user_id": 3,
      "full_name": "Manager Nguyễn"
    },
    "approved_at": "2026-07-06T12:00:00.000Z",
    "created_at": "2026-07-01T08:30:00.000Z",
    "updated_at": "2026-07-06T12:00:00.000Z"
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Chưa đăng nhập |
| 403 | `FORBIDDEN` | Không phải Manager/Admin |
| 404 | `EVENT_NOT_FOUND` | Event ID không tồn tại |
| 409 | `INVALID_STATUS` | Event không ở trạng thái PENDING |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |

### 409 Conflict Response

```json
{
  "success": false,
  "message": "Event is not in PENDING status.",
  "code": "INVALID_STATUS",
  "details": null
}
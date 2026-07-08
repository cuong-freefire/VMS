# Data Model: Reject Event (UC70)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-06

---

## 1. Entity: Event (Reject)

### Fields (cập nhật)

| Field | Type | Description | Constraints |
|-------|------|-------------|------------|
| `event_id` | Integer (PK) | ID duy nhất của sự kiện | Primary key |
| `title` | String | Tên sự kiện | NOT NULL |
| `status` | String (varchar 50) | Trạng thái: PENDING, APPROVED, REJECTED... | NOT NULL |
| `rejection_reason` | String (text, nullable) | **MỚI**: Lý do từ chối | Min 10 ký tự |
| `rejected_by` | Integer (FK, nullable) | **MỚI**: ID người từ chối | Foreign key → User |
| `rejected_at` | DateTime (nullable) | **MỚI**: Thời điểm từ chối | Auto-set |
| `created_at` | DateTime | Ngày tạo | Auto |
| `updated_at` | DateTime | Ngày cập nhật | Auto |

### Entity: User (rejecter reference)

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | Integer (PK) | ID người dùng |
| `full_name` | String | Họ tên người từ chối |

### Relationships

```
Event N:1 → User (event.rejected_by = user.user_id)
```

### Status Transition

```
PENDING → REJECTED (via UC70) — kết thúc, không thể quay lại
```

### Validation Rules

| Field | Rule | Error Code | HTTP Status |
|-------|------|------------|-------------|
| `rejection_reason` | Bắt buộc, min 10 ký tự | `VALIDATION_ERROR` | 400 |
| Event ID không tồn tại | - | `EVENT_NOT_FOUND` | 404 |
| Event status không phải PENDING | - | `INVALID_STATUS` | 409 |

---

## 2. API Request/Response

### Request Body

```json
{
  "rejection_reason": "Thông tin sự kiện chưa đầy đủ, thiếu địa điểm tổ chức."
}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Từ chối sự kiện thành công",
  "data": {
    "event_id": 1,
    "title": "Dọn dẹp bãi biển",
    "status": "REJECTED",
    "rejection_reason": "Thông tin sự kiện chưa đầy đủ, thiếu địa điểm tổ chức.",
    "rejected_by": {
      "user_id": 3,
      "full_name": "Manager Nguyễn"
    },
    "rejected_at": "2026-07-06T12:00:00.000Z",
    "created_at": "2026-07-01T08:30:00.000Z",
    "updated_at": "2026-07-06T12:00:00.000Z"
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Thiếu rejection_reason hoặc < 10 ký tự |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập |
| 403 | `FORBIDDEN` | Không phải Manager/Admin |
| 404 | `EVENT_NOT_FOUND` | Event ID không tồn tại |
| 409 | `INVALID_STATUS` | Event không ở trạng thái PENDING |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |

### 400 Validation Error Response

```json
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "rejection_reason", "message": "Rejection reason must be at least 10 characters" }
  ]
}
```

### 409 Conflict Response

```json
{
  "success": false,
  "message": "Event is not in PENDING status.",
  "code": "INVALID_STATUS",
  "details": null
}
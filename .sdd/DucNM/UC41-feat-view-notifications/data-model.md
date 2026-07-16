# Data Model: View Notifications (UC41)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-08

---

## 1. Entity: Notification

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|------------|
| `notification_id` | Integer (PK, auto-increment) | ID duy nhất của notification | Primary key |
| `user_id` | Integer (FK) | ID người dùng nhận thông báo | Foreign key → User |
| `title` | String (varchar 255) | Tiêu đề thông báo | NOT NULL |
| `message` | String (text, nullable) | Nội dung thông báo | Optional |
| `type` | String (varchar 50) | Loại: system, event_reminder, application_approved, application_rejected, certificate_issued | NOT NULL |
| `reference_id` | Integer (nullable) | ID của entity liên quan (event_id, application_id, etc.) | Optional |
| `reference_type` | String (varchar 50, nullable) | Loại entity: event, application, certificate | Optional |
| `is_read` | Boolean | Trạng thái đọc | Default false |
| `created_at` | DateTime | Ngày tạo | Auto |
| `updated_at` | DateTime | Ngày cập nhật | Auto |

### Relationships

```
Notification N:1 → User (notification.user_id = user.user_id)
```

### Validation Rules

| Field | Rule | Error Code | HTTP Status |
|-------|------|------------|-------------|
| `page` | Phải là số nguyên dương | `INVALID_PAGE` | 400 |
| `limit` | Phải là số nguyên dương (1-100) | `INVALID_LIMIT` | 400 |

---

## 2. Query Parameters

### GET /api/v1/notifications

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Integer | No | 1 | Số trang |
| `limit` | Integer | No | 20 | Số items mỗi trang (max 100) |

### GET /api/v1/notifications/unread-count

Không có query params.

---

## 3. API Response Structure

### Success Response (200) — Danh sách

```json
{
  "success": true,
  "message": "Lấy danh sách thông báo thành công",
  "data": {
    "notifications": [
      {
        "notification_id": 1,
        "title": "Đơn đăng ký được duyệt",
        "message": "Đơn đăng ký sự kiện Dọn dẹp bãi biển của bạn đã được duyệt.",
        "type": "application_approved",
        "reference_id": 1,
        "reference_type": "application",
        "is_read": false,
        "created_at": "2026-07-08T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### Success Response (200) — Unread count

```json
{
  "success": true,
  "message": "Lấy số lượng thông báo chưa đọc thành công",
  "data": {
    "unread_count": 3
  }
}
```

### Empty List Response

```json
{
  "success": true,
  "message": "Chưa có thông báo nào",
  "data": {
    "notifications": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_PAGE` | Page không hợp lệ |
| 400 | `INVALID_LIMIT` | Limit không hợp lệ (> 100) |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |
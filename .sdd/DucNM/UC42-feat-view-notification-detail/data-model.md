# Data Model: View Notification Detail (UC42)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-08

---

## 1. Entity: Notification (Detail)

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|------------|
| `notification_id` | Integer (PK) | ID duy nhất | Primary key |
| `user_id` | Integer (FK) | ID người dùng nhận | Foreign key → User |
| `title` | String | Tiêu đề thông báo | NOT NULL |
| `message` | String (nullable) | Nội dung thông báo | Optional |
| `type` | String | Loại: system, event_reminder, application_approved, application_rejected, certificate_issued | NOT NULL |
| `reference_id` | Integer (nullable) | ID entity tham chiếu | Optional |
| `reference_type` | String (nullable) | Loại entity: event, application, certificate | Optional |
| `is_read` | Boolean | Trạng thái đọc (sẽ được set = true khi xem) | Default false |
| `created_at` | DateTime | Ngày tạo | Auto |
| `updated_at` | DateTime | Ngày cập nhật | Auto |

### Reference Entity (tóm tắt)

| Reference Type | Entity | Fields returned |
|---------------|--------|-----------------|
| `event` | Event | event_id, title, status |
| `application` | Application | application_id, status |
| `certificate` | Certificate | certificate_id, certificate_url |
| `null` | - | Không có reference |

### Validation Rules

| Rule | Error Code | HTTP Status |
|------|------------|-------------|
| `:id` không phải số nguyên dương | `INVALID_NOTIFICATION_ID` | 400 |
| Notification không tồn tại | `NOTIFICATION_NOT_FOUND` | 404 |
| Notification không thuộc về user | `NOTIFICATION_NOT_FOUND` | 404 (ẩn tồn tại) |

---

## 2. API Response Structure

### Success Response (200) — Có reference entity

```json
{
  "success": true,
  "message": "Lấy thông tin thông báo thành công",
  "data": {
    "notification_id": 1,
    "title": "Sự kiện sắp diễn ra",
    "message": "Sự kiện Dọn dẹp bãi biển sẽ diễn ra vào ngày mai.",
    "type": "event_reminder",
    "is_read": true,
    "created_at": "2026-07-08T10:00:00.000Z",
    "reference": {
      "type": "event",
      "id": 5,
      "summary": {
        "title": "Dọn dẹp bãi biển",
        "status": "APPROVED"
      },
      "deleted": false
    }
  }
}
```

### Success Response (200) — Không có reference

```json
{
  "success": true,
  "message": "Lấy thông tin thông báo thành công",
  "data": {
    "notification_id": 2,
    "title": "Chào mừng bạn đến với VMS",
    "message": "Chào mừng bạn đã tham gia hệ thống tình nguyện.",
    "type": "system",
    "is_read": true,
    "created_at": "2026-07-01T08:00:00.000Z",
    "reference": null
  }
}
```

### Success Response (200) — Reference entity đã bị xóa mềm

```json
{
  "success": true,
  "message": "Lấy thông tin thông báo thành công",
  "data": {
    "notification_id": 3,
    "title": "Đơn đăng ký được duyệt",
    "message": "Đơn đăng ký của bạn đã được duyệt.",
    "type": "application_approved",
    "is_read": true,
    "created_at": "2026-07-05T09:00:00.000Z",
    "reference": {
      "type": "application",
      "id": 10,
      "summary": null,
      "deleted": true
    }
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_NOTIFICATION_ID` | ID không hợp lệ |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập |
| 404 | `NOTIFICATION_NOT_FOUND` | Không tồn tại hoặc không thuộc về user |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |
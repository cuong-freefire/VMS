# API Contract: GET /api/v1/notifications/:id

## Summary

Lấy thông tin chi tiết của một thông báo. Tự động đánh dấu thông báo là đã đọc. Chỉ user sở hữu mới xem được.

## Endpoint

```
GET /api/v1/notifications/:id
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: All authenticated users (only owner can view — others get 404)

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Integer | Yes | ID của thông báo |

## Example Request

```http
GET /api/v1/notifications/1
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

## Success Responses

### 200 — Có reference entity

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
      "summary": { "title": "Dọn dẹp bãi biển", "status": "APPROVED" },
      "deleted": false
    }
  }
}
```

### 200 — Không có reference

```json
{
  "success": true,
  "message": "Lấy thông tin thông báo thành công",
  "data": {
    "notification_id": 2,
    "title": "Chào mừng bạn đến với VMS",
    "message": "Chào mừng bạn đã tham gia hệ thống.",
    "type": "system",
    "is_read": true,
    "created_at": "2026-07-01T08:00:00.000Z",
    "reference": null
  }
}
```

### 200 — Reference entity đã bị xóa mềm

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

## Error Responses

### 400 Bad Request — Invalid ID

```json
{
  "success": false,
  "message": "Notification ID không hợp lệ",
  "code": "INVALID_NOTIFICATION_ID",
  "details": null
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Vui lòng đăng nhập.",
  "code": "UNAUTHORIZED",
  "details": null
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Notification not found.",
  "code": "NOTIFICATION_NOT_FOUND",
  "details": null
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Có lỗi xảy ra trong quá trình xử lý",
  "code": "INTERNAL_SERVER_ERROR",
  "details": null
}
```

## Swagger JSDoc Template

```javascript
/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết thông báo
 *     description: |
 *       Trả về chi tiết thông báo kèm thông tin entity tham chiếu.
 *       Tự động đánh dấu thông báo là đã đọc.
 *       Chỉ user sở hữu mới xem được — người khác nhận 404.
 *     tags: [Notification]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của thông báo
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Lỗi server
 */
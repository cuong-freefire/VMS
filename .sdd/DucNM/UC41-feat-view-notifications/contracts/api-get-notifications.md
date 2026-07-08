# API Contract: GET /api/v1/notifications

## Summary

Lấy danh sách thông báo của người dùng hiện tại với phân trang. Sắp xếp mới nhất lên đầu.

## Endpoint

```
GET /api/v1/notifications
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: All authenticated users

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Integer | No | 1 | Số trang |
| `limit` | Integer | No | 20 | Số items mỗi trang (max 100) |

## Example Request

```http
GET /api/v1/notifications?page=1&limit=20
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

## Success Response (200)

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

## Error Responses

### 400 Bad Request — Invalid page

```json
{
  "success": false,
  "message": "Tham số page không hợp lệ",
  "code": "INVALID_PAGE",
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
 * /api/v1/notifications:
 *   get:
 *     summary: Lấy danh sách thông báo
 *     description: |
 *       Trả về danh sách thông báo của người dùng hiện tại.
 *       Sắp xếp mới nhất lên đầu. Hỗ trợ phân trang.
 *       Yêu cầu xác thực — tất cả authenticated users đều có quyền.
 *     tags: [Notification]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation
 *       401:
 *         description: Chưa xác thực
 *       500:
 *         description: Lỗi server
 */
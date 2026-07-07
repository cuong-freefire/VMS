# API Contract: GET /api/v1/notifications/unread-count

## Summary

Lấy số lượng thông báo chưa đọc của người dùng hiện tại. Dùng cho Frontend polling mỗi 30 giây để cập nhật badge trên navbar.

## Endpoint

```
GET /api/v1/notifications/unread-count
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: All authenticated users

## Request

Không có query params, không có request body.

## Example Request

```http
GET /api/v1/notifications/unread-count
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

## Success Response (200)

```json
{
  "success": true,
  "message": "Lấy số lượng thông báo chưa đọc thành công",
  "data": {
    "unread_count": 3
  }
}
```

## Error Responses

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
 * /api/v1/notifications/unread-count:
 *   get:
 *     summary: Lấy số lượng thông báo chưa đọc
 *     description: |
 *       Trả về số lượng thông báo chưa đọc của người dùng hiện tại.
 *       Endpoint này được Frontend polling mỗi 30 giây để cập nhật badge trên navbar.
 *     tags: [Notification]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Lấy số lượng thông báo chưa đọc thành công"
 *               data:
 *                 unread_count: 3
 *       401:
 *         description: Chưa xác thực
 *       500:
 *         description: Lỗi server
 */
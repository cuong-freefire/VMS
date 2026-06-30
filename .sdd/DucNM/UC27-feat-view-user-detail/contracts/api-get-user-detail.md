# API Contract: GET /api/v1/users/:id

## Summary

Lấy thông tin chi tiết của một người dùng theo ID. Chỉ Admin mới có quyền truy cập.

## Endpoint

```
GET /api/v1/users/:id
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: Only `ADMIN` role

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Integer | Yes | ID của user cần xem chi tiết |

## Example Request

```http
GET /api/v1/users/1
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

## Success Response (200)

```json
{
  "success": true,
  "message": "Lấy thông tin người dùng thành công",
  "data": {
    "user_id": 1,
    "full_name": "Nguyễn Văn A",
    "email": "nguyenvana@example.com",
    "phone": "0123456789",
    "avatar_url": "https://res.cloudinary.com/.../avatar.jpg",
    "role": "VOLUNTEER",
    "is_active": true,
    "created_at": "2026-01-15T08:30:00.000Z",
    "updated_at": "2026-06-28T10:00:00.000Z"
  }
}
```

## Error Responses

### 400 Bad Request — Invalid user ID

```json
{
  "success": false,
  "message": "User ID không hợp lệ",
  "code": "INVALID_USER_ID",
  "details": null
}
```

### 401 Unauthorized — Missing or invalid token

```json
{
  "success": false,
  "message": "Vui lòng đăng nhập.",
  "code": "UNAUTHORIZED",
  "details": null
}
```

### 403 Forbidden — Not Admin

```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập tài nguyên này",
  "code": "FORBIDDEN",
  "details": null
}
```

### 404 Not Found — User does not exist

```json
{
  "success": false,
  "message": "User not found.",
  "code": "USER_NOT_FOUND",
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
 * /api/v1/users/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết người dùng (Admin only)
 *     description: |
 *       Trả về thông tin chi tiết của một người dùng theo ID.
 *       Chỉ Admin mới có quyền truy cập. Staff/Manager/Volunteer nhận 403.
 *       Guest chưa đăng nhập nhận 401.
 *       Nếu ID không tồn tại, trả về 404.
 *     tags: [User Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của user
 *     responses:
 *       200:
 *         description: Thành công, trả về thông tin chi tiết user
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Lấy thông tin người dùng thành công"
 *               data:
 *                 user_id: 1
 *                 full_name: "Nguyễn Văn A"
 *                 email: "nguyenvana@example.com"
 *                 role: "VOLUNTEER"
 *                 is_active: true
 *                 created_at: "2026-01-15T08:30:00.000Z"
 *       400:
 *         description: User ID không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (không phải Admin)
 *       404:
 *         description: User not found
 *       500:
 *         description: Lỗi server
 */
# API Contract: PATCH /api/v1/users/:id

## Summary

Cập nhật thông tin của một người dùng. Chỉ Admin mới có quyền truy cập. Email không thể thay đổi. Admin không thể tự hạ role của chính mình.

## Endpoint

```
PATCH /api/v1/users/:id
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: Only `ADMIN` role

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Integer | Yes | ID của user cần chỉnh sửa |

## Request Body (tất cả fields đều optional)

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `full_name` | String | No | Min 1 ký tự | Họ và tên mới |
| `phone` | String | No | - | Số điện thoại mới |
| `avatar_url` | String | No | URL format | URL ảnh đại diện mới |
| `role_id` | Integer | No | Phải tồn tại trong bảng Role | Role mới |
| `is_active` | Boolean | No | - | Trạng thái tài khoản |

## Example Request

```http
PATCH /api/v1/users/1
Content-Type: application/json
Cookie: token=eyJhbGciOiJIUzI1NiIs...

{
  "full_name": "Nguyễn Văn B (Updated)",
  "phone": "0909123456",
  "role_id": 2,
  "is_active": true
}
```

## Success Response (200 OK)

```json
{
  "success": true,
  "message": "Cập nhật thông tin người dùng thành công",
  "data": {
    "user_id": 1,
    "full_name": "Nguyễn Văn B (Updated)",
    "email": "nguyenvanb@example.com",
    "phone": "0909123456",
    "avatar_url": null,
    "role": "STAFF",
    "is_active": true,
    "created_at": "2026-01-15T08:30:00.000Z",
    "updated_at": "2026-06-30T14:00:00.000Z"
  }
}
```

## Error Responses

### 400 Bad Request — Empty body

```json
{
  "success": false,
  "message": "No fields to update.",
  "code": "NO_FIELDS_TO_UPDATE",
  "details": null
}
```

### 400 Bad Request — Validation Error

```json
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "full_name", "message": "Full name cannot be empty" }
  ]
}
```

### 403 Forbidden — Self-role-downgrade

```json
{
  "success": false,
  "message": "Cannot downgrade your own role.",
  "code": "SELF_ROLE_DOWNGRADE",
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
 *   patch:
 *     summary: Cập nhật thông tin người dùng (Admin only)
 *     description: |
 *       Cập nhật thông tin của một người dùng. Chỉ Admin mới có quyền.
 *       Email không thể thay đổi. Admin không thể tự hạ role của chính mình.
 *       Tất cả fields trong body đều optional (partial update).
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 description: Họ và tên mới
 *               phone:
 *                 type: string
 *                 description: Số điện thoại mới
 *               avatar_url:
 *                 type: string
 *                 description: URL ảnh đại diện mới
 *               role_id:
 *                 type: integer
 *                 description: Role mới
 *               is_active:
 *                 type: boolean
 *                 description: Trạng thái tài khoản
 *           example:
 *             full_name: "Nguyễn Văn B (Updated)"
 *             phone: "0909123456"
 *             role_id: 2
 *             is_active: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Cập nhật thông tin người dùng thành công"
 *               data:
 *                 user_id: 1
 *                 full_name: "Nguyễn Văn B (Updated)"
 *                 email: "nguyenvanb@example.com"
 *                 role: "STAFF"
 *                 is_active: true
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc body rỗng
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền hoặc tự hạ role
 *       404:
 *         description: User not found
 *       500:
 *         description: Lỗi server
 */
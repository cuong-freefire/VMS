# API Contract: POST /api/v1/users

## Summary

Tạo một tài khoản người dùng mới trong hệ thống. Chỉ Admin mới có quyền truy cập.

## Endpoint

```
POST /api/v1/users
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: Only `ADMIN` role

## Request Body

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `full_name` | String | Yes | Min 1 ký tự | Họ và tên đầy đủ |
| `email` | String | Yes | Email format hợp lệ | Email đăng nhập (unique) |
| `phone` | String | No | - | Số điện thoại |
| `password` | String | Yes | Min 8 ký tự | Mật khẩu (sẽ được hash bằng bcryptjs) |
| `role_id` | Integer | Yes | Phải tồn tại trong bảng Role | ID của role |

## Example Request

```http
POST /api/v1/users
Content-Type: application/json
Cookie: token=eyJhbGciOiJIUzI1NiIs...

{
  "full_name": "Nguyễn Văn B",
  "email": "nguyenvanb@example.com",
  "phone": "0987654321",
  "password": "password123",
  "role_id": 1
}
```

## Success Response (201 Created)

```json
{
  "success": true,
  "message": "Tạo người dùng thành công",
  "data": {
    "user_id": 2,
    "full_name": "Nguyễn Văn B",
    "email": "nguyenvanb@example.com",
    "phone": "0987654321",
    "avatar_url": null,
    "role": "VOLUNTEER",
    "is_active": true,
    "created_at": "2026-06-30T12:00:00.000Z",
    "updated_at": "2026-06-30T12:00:00.000Z"
  }
}
```

## Error Responses

### 400 Bad Request — Validation Error

```json
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Password must be at least 8 characters" }
  ]
}
```

### 400 Bad Request — Invalid role

```json
{
  "success": false,
  "message": "Invalid role.",
  "code": "INVALID_ROLE",
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

### 409 Conflict — Email already exists

```json
{
  "success": false,
  "message": "Email already exists.",
  "code": "EMAIL_EXISTS",
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
 * /api/v1/users:
 *   post:
 *     summary: Tạo người dùng mới (Admin only)
 *     description: |
 *       Tạo một tài khoản người dùng mới trong hệ thống.
 *       Chỉ Admin mới có quyền truy cập. Staff/Manager/Volunteer nhận 403.
 *       Guest chưa đăng nhập nhận 401.
 *       Email phải duy nhất — nếu đã tồn tại trả về 409.
 *       Mật khẩu được hash bằng bcryptjs trước khi lưu.
 *     tags: [User Management]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - email
 *               - password
 *               - role_id
 *             properties:
 *               full_name:
 *                 type: string
 *                 description: Họ và tên
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email đăng nhập
 *               phone:
 *                 type: string
 *                 description: Số điện thoại (optional)
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Mật khẩu (tối thiểu 8 ký tự)
 *               role_id:
 *                 type: integer
 *                 description: ID của role
 *           example:
 *             full_name: "Nguyễn Văn B"
 *             email: "nguyenvanb@example.com"
 *             phone: "0987654321"
 *             password: "password123"
 *             role_id: 1
 *     responses:
 *       201:
 *         description: Tạo user thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Tạo người dùng thành công"
 *               data:
 *                 user_id: 2
 *                 full_name: "Nguyễn Văn B"
 *                 email: "nguyenvanb@example.com"
 *                 role: "VOLUNTEER"
 *                 is_active: true
 *                 created_at: "2026-06-30T12:00:00.000Z"
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (không phải Admin)
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Lỗi server
 */
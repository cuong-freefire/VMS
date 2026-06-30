# API Contract: GET /api/v1/users

## Summary

Lấy danh sách người dùng với phân trang, tìm kiếm, lọc và sắp xếp. Chỉ Admin mới có quyền truy cập.

## Endpoint

```
GET /api/v1/users
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: Only `ADMIN` role

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Integer | No | 1 | Số trang hiện tại (bắt đầu từ 1) |
| `limit` | Integer | No | 20 | Số items mỗi trang (min: 1, max: 100) |
| `search` | String | No | - | Tìm kiếm theo `full_name` hoặc `email` (case-insensitive) |
| `role` | String | No | - | Lọc theo role: `volunteer`, `staff`, `manager`, `admin` |
| `sort` | String | No | `created_at:desc` | Format: `field:direction`. Supported fields: `created_at`, `full_name`, `email` |

## Example Request

```http
GET /api/v1/users?page=1&limit=20&search=nguyen&role=volunteer&sort=created_at:desc
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

## Success Response (200)

```json
{
  "success": true,
  "message": "Lấy danh sách người dùng thành công",
  "data": {
    "users": [
      {
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
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
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

### 400 Bad Request — Invalid limit (> 100)

```json
{
  "success": false,
  "message": "Tham số limit phải từ 1 đến 100",
  "code": "INVALID_LIMIT",
  "details": null
}
```

### 400 Bad Request — Invalid role

```json
{
  "success": false,
  "message": "Role không hợp lệ. Chấp nhận: volunteer, staff, manager, admin",
  "code": "INVALID_ROLE",
  "details": null
}
```

### 400 Bad Request — Invalid sort

```json
{
  "success": false,
  "message": "Tham số sort không đúng định dạng (field:direction)",
  "code": "INVALID_SORT",
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

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Có lỗi xảy ra trong quá trình xử lý",
  "code": "INTERNAL_SERVER_ERROR",
  "details": null
}
```

## Empty List Response

```json
{
  "success": true,
  "message": "Không tìm thấy người dùng nào",
  "data": {
    "users": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

## Swagger JSDoc Template

```javascript
/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Lấy danh sách người dùng (Admin only)
 *     description: |
 *       Trả về danh sách người dùng với phân trang, tìm kiếm, lọc theo role.
 *       Chỉ Admin mới có quyền truy cập. Staff/Manager/Volunteer nhận 403.
 *       Guest chưa đăng nhập nhận 401.
 *     tags: [User Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số items mỗi trang (max 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc email (case-insensitive)
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [volunteer, staff, manager, admin]
 *         description: Lọc theo role
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: created_at:desc
 *         description: Sắp xếp (field:direction)
 *     responses:
 *       200:
 *         description: Thành công, trả về danh sách người dùng
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Lấy danh sách người dùng thành công"
 *               data:
 *                 users:
 *                   - user_id: 1
 *                     full_name: "Nguyễn Văn A"
 *                     email: "nguyenvana@example.com"
 *                     role: "VOLUNTEER"
 *                     is_active: true
 *                     created_at: "2026-01-15T08:30:00.000Z"
 *                 pagination:
 *                   page: 1
 *                   limit: 20
 *                   total: 50
 *                   totalPages: 3
 *       400:
 *         description: Lỗi validation (page, limit, role, sort)
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Tham số page không hợp lệ"
 *               code: "INVALID_PAGE"
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (không phải Admin)
 *       500:
 *         description: Lỗi server
 */
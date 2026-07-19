# API Contract: GET /api/v1/users (Search Users)

## Summary

Mở rộng endpoint `GET /api/v1/users` (đã có từ UC26) với query param `search` cho phép tìm kiếm người dùng theo `full_name` và `email`. Search không phân biệt hoa/thường, hỗ trợ partial match.

## Endpoint

```
GET /api/v1/users
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: Only `ADMIN` role

## Query Parameters (Extension)

| Parameter | Type | Required | Default | Description | Source |
|-----------|------|----------|---------|-------------|--------|
| `page` | Integer | No | 1 | Số trang | UC26 |
| `limit` | Integer | No | 20 | Số items mỗi trang (max 100) | UC26 |
| `search` | String | No | - | Tìm kiếm theo full_name hoặc email (case-insensitive, partial match) | **Search User (NEW)** |
| `role` | String | No | - | Lọc theo role: `volunteer`, `staff`, `manager`, `admin` | UC26 |
| `sort` | String | No | `created_at:desc` | Format: `field:direction` | UC26 |

## Validation Rules

| Field | Rule | Error Code | HTTP Status |
|-------|------|------------|-------------|
| `search` | String, optional, trim whitespace | - | - |

## Example Request

```http
GET /api/v1/users?page=1&limit=20&search=nguyen
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
      },
      {
        "user_id": 2,
        "full_name": "Thi Nguyen",
        "email": "thinguyen@example.com",
        "role": "STAFF",
        "is_active": true,
        "created_at": "2026-02-10T09:00:00.000Z",
        "updated_at": "2026-06-25T11:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "totalPages": 1
    }
  }
}
```

## Search Logic

```sql
WHERE (full_name LIKE '%nguyen%' OR email LIKE '%nguyen%')
```

## Search Behavior

- **Case-insensitive**: Tìm kiếm không phân biệt chữ hoa/chữ thường
- **Partial match**: Tìm kiếm một phần của từ khóa
- **Empty keyword**: Bỏ qua search, trả về toàn bộ danh sách
- **Kết hợp filter**: Có thể kết hợp với role, sort params

## Error Responses

Không có error response mới cho Search User. Search param là optional.

## Swagger JSDoc Template

```javascript
/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Lấy danh sách người dùng (Admin only) — extended with search
 *     description: |
 *       Mở rộng từ UC26 với search param cho phép tìm kiếm theo tên hoặc email.
 *       Chỉ Admin mới có quyền truy cập.
 *     tags: [User Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Tìm kiếm theo tên hoặc email (case-insensitive, partial match)
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [volunteer, staff, manager, admin] }
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: created_at:desc }
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (không phải Admin)
 *       500:
 *         description: Lỗi server
 */
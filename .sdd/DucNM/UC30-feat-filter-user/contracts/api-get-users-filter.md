# API Contract: GET /api/v1/users (Extended with Filters)

## Summary

Lấy danh sách người dùng với phân trang, tìm kiếm, và các bộ lọc (role, trạng thái, khoảng thời gian). Extension của UC26. Chỉ Admin mới có quyền truy cập.

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
| `page` | Integer | No | 1 | Số trang |
| `limit` | Integer | No | 20 | Items mỗi trang (max 100) |
| `search` | String | No | - | Tìm kiếm theo tên/email (case-insensitive) |
| `role` | Enum | No | - | Lọc role: volunteer, staff, manager, admin |
| `sort` | String | No | `created_at:desc` | Sắp xếp |
| **`is_active`** | Boolean | No | - | **UC30**: Lọc active (`true`) / inactive (`false`) |
| **`from_date`** | Date | No | - | **UC30**: Ngày tạo từ (YYYY-MM-DD) |
| **`to_date`** | Date | No | - | **UC30**: Ngày tạo đến (YYYY-MM-DD) |

## Example Requests

### Lọc Staff đang active

```http
GET /api/v1/users?role=staff&is_active=true
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

### Lọc inactive users

```http
GET /api/v1/users?is_active=false
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

### Lọc theo khoảng thời gian

```http
GET /api/v1/users?from_date=2026-01-01&to_date=2026-06-30
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

### Kết hợp tất cả filter

```http
GET /api/v1/users?search=nguyen&role=staff&is_active=true&from_date=2026-01-01&to_date=2026-06-30&page=1&limit=20
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

## Success Response (200)

```json
{
  "success": true,
  "message": "Lấy danh sách người dùng thành công",
  "data": {
    "users": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

## Error Responses (UC30 additions)

### 400 — Invalid date range

```json
{
  "success": false,
  "message": "from_date must be before or equal to to_date",
  "code": "INVALID_DATE_RANGE",
  "details": null
}
```

### 400 — Invalid date format

```json
{
  "success": false,
  "message": "Invalid date format (YYYY-MM-DD)",
  "code": "INVALID_DATE_FORMAT",
  "details": null
}
```

## Swagger JSDoc (Updated)

```javascript
/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Lấy danh sách người dùng (Admin only)
 *     description: |
 *       Trả về danh sách người dùng với phân trang, tìm kiếm, và bộ lọc.
 *       Hỗ trợ lọc theo role, trạng thái active/inactive, và khoảng thời gian tạo.
 *       Tất cả filter kết hợp bằng AND logic.
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
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [volunteer, staff, manager, admin] }
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: created_at:desc }
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
 *         description: Lọc active (true) / inactive (false)
 *       - in: query
 *         name: from_date
 *         schema: { type: string, format: date }
 *         description: Ngày tạo từ (YYYY-MM-DD)
 *       - in: query
 *         name: to_date
 *         schema: { type: string, format: date }
 *         description: Ngày tạo đến (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation (date format, date range)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       500:
 *         description: Lỗi server
 */
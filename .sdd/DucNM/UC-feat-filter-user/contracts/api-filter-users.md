# API Contract: GET /api/v1/users (Filter Users)

## Summary

Mở rộng endpoint `GET /api/v1/users` (đã có từ UC26) với các query params filter bổ sung: `is_active`, `from_date`, `to_date`. Các filter kết hợp với nhau bằng AND logic.

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
| `search` | String | No | - | Tìm kiếm theo full_name hoặc email (case-insensitive) | UC26 |
| `role` | String | No | - | Lọc theo role: `volunteer`, `staff`, `manager`, `admin` | UC26 |
| `sort` | String | No | `created_at:desc` | Format: `field:direction`. Supported fields: `created_at`, `full_name`, `email` | UC26 |
| `is_active` | Boolean | No | - | Lọc active (`true`) / inactive (`false`) | **Filter User (NEW)** |
| `from_date` | Date | No | - | Ngày tạo từ (format: YYYY-MM-DD, inclusive) | **Filter User (NEW)** |
| `to_date` | Date | No | - | Ngày tạo đến (format: YYYY-MM-DD, inclusive) | **Filter User (NEW)** |

## Validation Rules

| Field | Rule | Error Code | HTTP Status |
|-------|------|------------|-------------|
| `is_active` | Phải là boolean (`true`/`false`) | `INVALID_IS_ACTIVE` | 400 |
| `from_date` | Format YYYY-MM-DD | `INVALID_DATE_FORMAT` | 400 |
| `to_date` | Format YYYY-MM-DD | `INVALID_DATE_FORMAT` | 400 |
| `from_date` + `to_date` | from_date <= to_date | `INVALID_DATE_RANGE` | 400 |

## Example Request

```http
GET /api/v1/users?page=1&limit=20&search=nguyen&role=staff&is_active=true&from_date=2026-01-01&to_date=2026-06-30
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
        "role": "STAFF",
        "is_active": true,
        "created_at": "2026-03-15T08:30:00.000Z",
        "updated_at": "2026-06-28T10:00:00.000Z"
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

### 400 — Date format invalid

```json
{
  "success": false,
  "message": "Invalid date format, expected YYYY-MM-DD",
  "code": "INVALID_DATE_FORMAT",
  "details": null
}
```

### 400 — Date range invalid (from_date > to_date)

```json
{
  "success": false,
  "message": "from_date must be before or equal to to_date",
  "code": "INVALID_DATE_RANGE",
  "details": null
}
```

### 400 — is_active invalid

```json
{
  "success": false,
  "message": "is_active must be a boolean (true/false)",
  "code": "INVALID_IS_ACTIVE",
  "details": null
}
```

## Filter Logic

```
WHERE (search LIKE '%keyword%') 
  AND (role = 'staff') 
  AND (is_active = true) 
  AND (created_at >= '2026-01-01 00:00:00.000') 
  AND (created_at <= '2026-06-30 23:59:59.999')
```

## Date Range Note

- `from_date`: Inclusive từ đầu ngày (00:00:00.000)
- `to_date`: Inclusive đến cuối ngày (23:59:59.999)

## Swagger JSDoc Template

```javascript
/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Lấy danh sách người dùng (Admin only) — extended with filters
 *     description: |
 *       Mở rộng từ UC26 với các filter params: is_active, from_date, to_date.
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
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [volunteer, staff, manager, admin] }
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: created_at:desc }
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
 *         description: Lọc active/inactive
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
 *         description: Lỗi validation (date format, date range, is_active)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (không phải Admin)
 *       500:
 *         description: Lỗi server
 */
# API Contract: GET /api/v1/organizations (Search Organizations)

## Summary

Mở rộng endpoint `GET /api/v1/organizations` (đã có từ UC37) với query param `search` cho phép tìm kiếm tổ chức theo `name`. Search không phân biệt hoa/thường, hỗ trợ partial match, và có thể kết hợp với filter `is_active`.

## Endpoint

```
GET /api/v1/organizations
```

## Authentication

- **Optional**: JWT HttpOnly Cookie
- **Guest/Volunteer**: HTTP 401/403 Forbidden
- **Staff/Manager**: Returns active organizations only
- **Admin**: Returns all organizations (active + inactive)

## Query Parameters (Extension)

| Parameter | Type | Required | Default | Description | Source |
|-----------|------|----------|---------|-------------|--------|
| `page` | Integer | No | 1 | Số trang | UC37 |
| `limit` | Integer | No | 20 | Số items mỗi trang (max 100) | UC37 |
| `search` | String | No | - | Tìm kiếm theo tên (case-insensitive, partial match) | **Search Organization (NEW)** |
| `is_active` | Boolean | No | - | Lọc active (`true`) / inactive (`false`) | UC37 |

## Validation Rules

| Field | Rule | Error Code | HTTP Status |
|-------|------|------------|-------------|
| `search` | String, optional, trim whitespace | - | - |

## Example Request

```http
GET /api/v1/organizations?page=1&limit=20&search=Nhan&is_active=true
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

## Success Response (200)

```json
{
  "success": true,
  "message": "Lấy danh sách tổ chức thành công",
  "data": {
    "organizations": [
      {
        "organization_id": 1,
        "name": "Nhân Ái",
        "description": "Tổ chức từ thiện vì trẻ em",
        "address": "Hà Nội",
        "contact_phone": "0123456789",
        "contact_email": "info@nhanai.org",
        "website": "https://nhanai.org",
        "logo_url": null,
        "is_active": true,
        "created_at": "2026-01-15T08:30:00.000Z",
        "updated_at": "2026-06-28T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

## Search Logic

```sql
WHERE (name LIKE '%Nhan%') AND (is_active = true) AND (is_active filter based on role)
```

## Search Behavior

- **Case-insensitive**: Không phân biệt chữ hoa/chữ thường
- **Partial match**: Tìm kiếm một phần của từ khóa
- **Empty keyword**: Bỏ qua search, trả về toàn bộ danh sách
- **Search scope**: Chỉ search theo `name` — KHÔNG search theo email, địa chỉ
- **Kết hợp filter**: AND logic với `is_active` param

## Error Responses

### 401 Unauthorized — Guest không có token

```json
{
  "success": false,
  "message": "Vui lòng đăng nhập.",
  "code": "UNAUTHORIZED",
  "details": null
}
```

### 403 Forbidden — Volunteer không có quyền

```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập tài nguyên này",
  "code": "FORBIDDEN",
  "details": null
}
```

## Swagger JSDoc Template

```javascript
/**
 * @swagger
 * /api/v1/organizations:
 *   get:
 *     summary: Lấy danh sách tổ chức — extended with search
 *     description: |
 *       Mở rộng từ UC37 với search param cho phép tìm kiếm theo tên.
 *       - Guest/Volunteer: 401/403 Forbidden
 *       - Staff/Manager: active organizations
 *       - Admin: tất cả (active + inactive)
 *     tags: [Organization Management]
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
 *         description: Tìm kiếm theo tên (case-insensitive, partial match)
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
 *         description: Lọc active/inactive
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (Volunteer)
 *       500:
 *         description: Lỗi server
 */
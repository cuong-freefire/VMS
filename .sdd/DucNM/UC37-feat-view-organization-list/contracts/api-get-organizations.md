# API Contract: GET /api/v1/organizations

## Summary

Lấy danh sách tổ chức với phân trang, tìm kiếm, và role-based visibility. Hỗ trợ optional auth — nếu có token, áp dụng role-based visibility; nếu không, trả về organizations active cho Guest (phục vụ UC11 Filter Event).

## Endpoint

```
GET /api/v1/organizations
```

## Authentication

- **Optional**: JWT HttpOnly Cookie
- **Guest (no token)**: Returns active organizations only (public)
- **Volunteer**: Returns active organizations only
- **Staff**: Returns active organizations only
- **Manager**: Returns active organizations only
- **Admin**: Returns all organizations (active + inactive)

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Integer | No | 1 | Số trang |
| `limit` | Integer | No | 20 | Số items mỗi trang (max 100) |
| `search` | String | No | - | Tìm kiếm theo tên (case-insensitive) |

## Example Request

```http
GET /api/v1/organizations?page=1&limit=20&search=hoa
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

### Guest Request (không token)

```http
GET /api/v1/organizations
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
        "name": "Hoa Phượng Đỏ",
        "description": "Tổ chức tình nguyện vì môi trường",
        "address": "Hà Nội",
        "contact_phone": "0123456789",
        "contact_email": "contact@hoaphuongdo.org",
        "website": "https://hoaphuongdo.org",
        "logo_url": null,
        "is_active": true,
        "created_at": "2026-01-15T08:30:00.000Z",
        "updated_at": "2026-06-28T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
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
 * /api/v1/organizations:
 *   get:
 *     summary: Lấy danh sách tổ chức
 *     description: |
 *       Trả về danh sách tổ chức với phân trang, tìm kiếm, và role-based visibility.
 *       Hỗ trợ optional auth:
 *       - Guest (không token): active organizations (public) — phục vụ UC11
 *       - Volunteer/Staff/Manager: active organizations
 *       - Admin: tất cả (active + inactive)
 *       Endpoint này phục vụ UC11 (Filter Event) cho Guest và Volunteer.
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
 *         description: Tìm kiếm theo tên (case-insensitive)
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation
 *       500:
 *         description: Lỗi server
 */
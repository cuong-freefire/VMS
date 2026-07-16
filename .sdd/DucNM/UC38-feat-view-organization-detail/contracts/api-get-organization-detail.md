# API Contract: GET /api/v1/organizations/:id

## Summary

Lấy thông tin chi tiết của một tổ chức. Hỗ trợ optional auth — nếu có token, áp dụng role-based detail level; nếu không, trả về basic info cho Guest (phục vụ UC09 View Event Detail).

## Endpoint

```
GET /api/v1/organizations/:id
```

## Authentication

- **Optional**: JWT HttpOnly Cookie
- **Guest (no token)**: Returns basic info (name, description, logo_url, is_active) for active organizations
- **Volunteer**: Returns basic info (name, description, logo_url, is_active) for active organizations
- **Staff**: Returns full info + events summary for active organizations
- **Manager**: Returns full info + events summary for active organizations
- **Admin**: Returns full info + events summary for all organizations (active + inactive)

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Integer | Yes | ID của tổ chức |

## Example Requests

### Guest (không token) — Basic info

```http
GET /api/v1/organizations/1
```

### Authenticated Staff — Full info

```http
GET /api/v1/organizations/1
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

## Success Responses

### 200 — Full Response (Staff/Manager/Admin)

```json
{
  "success": true,
  "message": "Lấy thông tin tổ chức thành công",
  "data": {
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
    "updated_at": "2026-06-28T10:00:00.000Z",
    "events": [
      {
        "event_id": 1,
        "title": "Dọn dẹp bãi biển",
        "status": "ONGOING",
        "start_date": "2026-07-10T08:00:00.000Z"
      }
    ]
  }
}
```

### 200 — Basic Response (Volunteer/Guest)

```json
{
  "success": true,
  "message": "Lấy thông tin tổ chức thành công",
  "data": {
    "organization_id": 1,
    "name": "Hoa Phượng Đỏ",
    "description": "Tổ chức tình nguyện vì môi trường",
    "logo_url": null,
    "is_active": true
  }
}
```

## Error Responses

### 400 — Invalid ID

```json
{
  "success": false,
  "message": "Organization ID không hợp lệ",
  "code": "INVALID_ORGANIZATION_ID",
  "details": null
}
```

### 404 — Not Found

```json
{
  "success": false,
  "message": "Organization not found.",
  "code": "ORGANIZATION_NOT_FOUND",
  "details": null
}
```

### 500 — Internal Server Error

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
 * /api/v1/organizations/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết tổ chức
 *     description: |
 *       Trả về thông tin chi tiết của một tổ chức. Hỗ trợ optional auth:
 *       - Guest/Volunteer: basic info (name, description, logo_url, is_active) — phục vụ UC09
 *       - Staff/Manager: full info + events summary (active orgs only)
 *       - Admin: full info + events summary (all orgs)
 *     tags: [Organization Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của tổ chức
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: ID không hợp lệ
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Lỗi server
 */
# API Contract: GET /api/v1/categories

## Summary

Lấy danh sách danh mục (categories). Hỗ trợ optional auth — nếu có token, áp dụng role-based visibility; nếu không, trả về categories active cho Guest (phục vụ UC11 Filter Event).

## Endpoint

```
GET /api/v1/categories
```

## Authentication

- **Optional**: JWT HttpOnly Cookie
- **Guest (no token)**: Returns active categories only (public)
- **Volunteer**: Returns active categories only
- **Staff**: Returns active categories only
- **Manager/Admin**: Returns all categories (active + inactive)

## Request

Không có query params, không có request body.

## Example Request

```http
GET /api/v1/categories
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

### Guest Request (không token)

```http
GET /api/v1/categories
```

## Success Response (200)

```json
{
  "success": true,
  "message": "Lấy danh sách danh mục thành công",
  "data": {
    "categories": [
      {
        "category_id": 1,
        "name": "Giáo dục",
        "description": "Các sự kiện liên quan đến giáo dục",
        "type": "event_type",
        "is_active": true
      },
      {
        "category_id": 2,
        "name": "Miền Bắc",
        "description": "Sự kiện tổ chức tại khu vực miền Bắc",
        "type": "location",
        "is_active": true
      }
    ]
  }
}
```

## Error Responses

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
 * /api/v1/categories:
 *   get:
 *     summary: Lấy danh sách danh mục
 *     description: |
 *       Trả về danh sách danh mục (categories). Hỗ trợ optional auth:
 *       - Nếu không có token (Guest): trả về categories active (public)
 *       - Nếu có token Volunteer/Staff: trả về categories active
 *       - Nếu có token Manager/Admin: trả về tất cả categories (active + inactive)
 *       Endpoint này phục vụ UC11 (Filter Event) cho Guest và Volunteer.
 *     tags: [Category Management]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thành công, trả về danh sách categories
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Lấy danh sách danh mục thành công"
 *               data:
 *                 categories:
 *                   - category_id: 1
 *                     name: "Giáo dục"
 *                     type: "event_type"
 *                     is_active: true
 *       500:
 *         description: Lỗi server
 */
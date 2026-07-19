# API Contract: GET /api/v1/categories (Search Categories)

## Summary

Mở rộng endpoint `GET /api/v1/categories` (đã có từ UC31) với query param `search` cho phép tìm kiếm danh mục theo `name` và `description`. Search không phân biệt hoa/thường, hỗ trợ partial match, và có thể kết hợp với filter `type`.

## Endpoint

```
GET /api/v1/categories
```

## Authentication

- **Optional**: JWT HttpOnly Cookie
- **Guest (no token)**: Returns active categories only (public — phục vụ UC11 Filter Event)
- **Volunteer/Staff**: Returns active categories only
- **Manager/Admin**: Returns all categories (active + inactive)

## Query Parameters (Extension)

| Parameter | Type | Required | Default | Description | Source |
|-----------|------|----------|---------|-------------|--------|
| `search` | String | No | - | Tìm kiếm theo name hoặc description (case-insensitive, partial match) | **Search Category (NEW)** |
| `type` | String | No | - | Lọc theo type: `location`, `event_type`, `time_frame` | UC31 |

## Validation Rules

| Field | Rule | Error Code | HTTP Status |
|-------|------|------------|-------------|
| `search` | String, optional, trim whitespace | - | - |
| `type` | Enum: location, event_type, time_frame | `INVALID_TYPE` | 400 |

## Example Request

```http
GET /api/v1/categories?search=Hoc&type=event_type
Cookie: token=eyJhbGciOiJIUzI1NiIs...
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
        "name": "Học Tập",
        "description": "Các hoạt động giáo dục",
        "type": "event_type",
        "is_active": true
      },
      {
        "category_id": 2,
        "name": "Học thuật",
        "description": "Các hoạt động học thuật",
        "type": "event_type",
        "is_active": true
      }
    ]
  }
}
```

## Search Logic

```sql
WHERE (name LIKE '%Hoc%' OR description LIKE '%Hoc%') AND (type = 'event_type') AND (is_active filter based on role)
```

## Search Behavior

- **Case-insensitive**: Không phân biệt chữ hoa/chữ thường
- **Partial match**: Tìm kiếm một phần của từ khóa
- **Empty keyword**: Bỏ qua search, trả về toàn bộ danh sách
- **Kết hợp filter type**: AND logic với type param

## Error Responses

Không có error response mới cho Search Category. Search param là optional.

## Swagger JSDoc Template

```javascript
/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Lấy danh sách danh mục — extended with search
 *     description: |
 *       Mở rộng từ UC31 với search param cho phép tìm kiếm theo tên hoặc mô tả.
 *       Hỗ trợ optional auth:
 *       - Guest (không token): active categories (public)
 *       - Volunteer/Staff: active categories
 *       - Manager/Admin: tất cả (active + inactive)
 *     tags: [Category Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Tìm kiếm theo tên hoặc mô tả (case-insensitive, partial match)
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [location, event_type, time_frame] }
 *         description: Lọc theo type
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation
 *       500:
 *         description: Lỗi server
 */
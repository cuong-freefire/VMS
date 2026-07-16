# API Contract: GET /api/v1/skills (Search Skills)

## Summary

Mở rộng endpoint `GET /api/v1/skills` (đã có từ UC34) với query param `search` cho phép tìm kiếm kỹ năng theo `name` và `description`. Search không phân biệt hoa/thường, hỗ trợ partial match.

## Endpoint

```
GET /api/v1/skills
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Guest (no token)**: HTTP 401 Unauthorized
- **Volunteer/Staff**: Returns active skills only
- **Manager/Admin**: Returns all skills (active + inactive)

## Query Parameters (Extension)

| Parameter | Type | Required | Default | Description | Source |
|-----------|------|----------|---------|-------------|--------|
| `search` | String | No | - | Tìm kiếm theo name hoặc description (case-insensitive, partial match) | **Search Skill (NEW)** |

## Validation Rules

| Field | Rule | Error Code | HTTP Status |
|-------|------|------------|-------------|
| `search` | String, optional, trim whitespace | - | - |

## Example Request

```http
GET /api/v1/skills?search=English
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

## Success Response (200)

```json
{
  "success": true,
  "message": "Lấy danh sách kỹ năng thành công",
  "data": {
    "skills": [
      {
        "skill_id": 1,
        "name": "English",
        "description": "Kỹ năng tiếng Anh giao tiếp",
        "is_active": true
      },
      {
        "skill_id": 2,
        "name": "English Writing",
        "description": "Kỹ năng viết tiếng Anh",
        "is_active": true
      }
    ]
  }
}
```

## Search Logic

```sql
WHERE (name LIKE '%English%' OR description LIKE '%English%') AND (is_active filter based on role)
```

## Search Behavior

- **Case-insensitive**: Không phân biệt chữ hoa/chữ thường
- **Partial match**: Tìm kiếm một phần của từ khóa
- **Empty keyword**: Bỏ qua search, trả về toàn bộ danh sách

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

## Swagger JSDoc Template

```javascript
/**
 * @swagger
 * /api/v1/skills:
 *   get:
 *     summary: Lấy danh sách kỹ năng — extended with search
 *     description: |
 *       Mở rộng từ UC34 với search param cho phép tìm kiếm theo tên hoặc mô tả.
 *       Yêu cầu xác thực. Guest nhận 401.
 *       - Volunteer/Staff: active skills
 *       - Manager/Admin: tất cả (active + inactive)
 *     tags: [Skill Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Tìm kiếm theo tên hoặc mô tả (case-insensitive, partial match)
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa xác thực
 *       500:
 *         description: Lỗi server
 */
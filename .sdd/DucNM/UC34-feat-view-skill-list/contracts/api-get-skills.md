# API Contract: GET /api/v1/skills

## Summary

Lấy danh sách kỹ năng (skills). Hỗ trợ optional auth — nếu có token, áp dụng role-based visibility; nếu không, trả về skills active cho Guest (phục vụ UC11 Filter Event và UC20 Edit Volunteer Skills).

## Endpoint

```
GET /api/v1/skills
```

## Authentication

- **Optional**: JWT HttpOnly Cookie
- **Guest (no token)**: Returns active skills only (public)
- **Volunteer**: Returns active skills only (phục vụ UC11 + UC20)
- **Staff**: Returns active skills only
- **Manager/Admin**: Returns all skills (active + inactive)

## Request

Không có query params, không có request body.

## Example Request

```http
GET /api/v1/skills
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

### Guest Request (không token)

```http
GET /api/v1/skills
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
        "name": "Giao tiếp",
        "description": "Kỹ năng giao tiếp hiệu quả",
        "is_active": true
      },
      {
        "skill_id": 2,
        "name": "Tiếng Anh",
        "description": "Kỹ năng sử dụng tiếng Anh",
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
 * /api/v1/skills:
 *   get:
 *     summary: Lấy danh sách kỹ năng
 *     description: |
 *       Trả về danh sách kỹ năng (skills). Hỗ trợ optional auth:
 *       - Nếu không có token (Guest): trả về skills active (public) — phục vụ UC11
 *       - Nếu có token Volunteer/Staff: trả về skills active
 *       - Nếu có token Manager/Admin: trả về tất cả skills (active + inactive)
 *       Endpoint này phục vụ UC11 (Filter Event) và UC20 (Edit Volunteer Skills).
 *     tags: [Skill Management]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thành công, trả về danh sách skills
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Lấy danh sách kỹ năng thành công"
 *               data:
 *                 skills:
 *                   - skill_id: 1
 *                     name: "Giao tiếp"
 *                     is_active: true
 *       500:
 *         description: Lỗi server
 */
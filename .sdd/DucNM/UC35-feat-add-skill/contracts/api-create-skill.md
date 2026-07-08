# API Contract: POST /api/v1/skills

## Summary

Tạo một kỹ năng mới. Chỉ Manager và Admin mới có quyền truy cập.

## Endpoint

```
POST /api/v1/skills
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: Only `MANAGER` and `ADMIN` roles

## Request Body

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `name` | String | Yes | Min 1 ký tự, unique trên toàn bảng | Tên kỹ năng |
| `description` | String | No | - | Mô tả kỹ năng |

## Example Request

```http
POST /api/v1/skills
Content-Type: application/json
Cookie: token=eyJhbGciOiJIUzI1NiIs...

{
  "name": "Photography",
  "description": "Kỹ năng chụp ảnh và chỉnh sửa ảnh"
}
```

## Success Response (201 Created)

```json
{
  "success": true,
  "message": "Tạo kỹ năng thành công",
  "data": {
    "skill_id": 3,
    "name": "Photography",
    "description": "Kỹ năng chụp ảnh và chỉnh sửa ảnh",
    "is_active": true,
    "created_at": "2026-07-02T12:00:00.000Z",
    "updated_at": "2026-07-02T12:00:00.000Z"
  }
}
```

## Error Responses

### 400 Bad Request — Validation Error

```json
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "name", "message": "Skill name is required" }
  ]
}
```

### 409 Conflict — Skill name already exists

```json
{
  "success": false,
  "message": "Skill name already exists.",
  "code": "SKILL_EXISTS",
  "details": null
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Vui lòng đăng nhập.",
  "code": "UNAUTHORIZED",
  "details": null
}
```

### 403 Forbidden — Not Manager/Admin

```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập tài nguyên này",
  "code": "FORBIDDEN",
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
 * /api/v1/skills:
 *   post:
 *     summary: Tạo kỹ năng mới (Manager/Admin only)
 *     description: |
 *       Tạo một kỹ năng mới trong hệ thống.
 *       Chỉ Manager và Admin mới có quyền truy cập.
 *       Tên skill phải unique trên toàn bảng.
 *     tags: [Skill Management]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên kỹ năng
 *               description:
 *                 type: string
 *                 description: Mô tả kỹ năng (optional)
 *           example:
 *             name: "Photography"
 *             description: "Kỹ năng chụp ảnh và chỉnh sửa ảnh"
 *     responses:
 *       201:
 *         description: Tạo kỹ năng thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       409:
 *         description: Skill name already exists
 *       500:
 *         description: Lỗi server
 */
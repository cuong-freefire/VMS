# API Contract: PATCH /api/v1/skills/:id

## Summary

Cập nhật thông tin kỹ năng. Chỉ Manager và Admin mới có quyền truy cập.

## Endpoint

```
PATCH /api/v1/skills/:id
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: Only `MANAGER` and `ADMIN` roles

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Integer | Yes | ID của skill cần chỉnh sửa |

## Request Body (tất cả fields đều optional)

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `name` | String | No | Min 1 ký tự, unique | Tên mới |
| `description` | String | No | - | Mô tả mới |
| `is_active` | Boolean | No | - | Trạng thái |

## Example Request

```http
PATCH /api/v1/skills/1
Content-Type: application/json
Cookie: token=eyJhbGciOiJIUzI1NiIs...

{
  "name": "Photography (Updated)",
  "description": "Kỹ năng chụp ảnh nâng cao",
  "is_active": false
}
```

## Success Response (200 OK)

```json
{
  "success": true,
  "message": "Cập nhật kỹ năng thành công",
  "data": {
    "skill_id": 1,
    "name": "Photography (Updated)",
    "description": "Kỹ năng chụp ảnh nâng cao",
    "is_active": false,
    "created_at": "2026-01-15T08:30:00.000Z",
    "updated_at": "2026-07-02T14:00:00.000Z"
  }
}
```

## Error Responses

### 400 Bad Request — Empty body

```json
{
  "success": false,
  "message": "No fields to update.",
  "code": "NO_FIELDS_TO_UPDATE",
  "details": null
}
```

### 400 Bad Request — Validation Error

```json
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "name", "message": "Skill name cannot be empty" }
  ]
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

### 404 Not Found — Skill does not exist

```json
{
  "success": false,
  "message": "Skill not found.",
  "code": "SKILL_NOT_FOUND",
  "details": null
}
```

### 409 Conflict — Name already exists

```json
{
  "success": false,
  "message": "Skill name already exists.",
  "code": "SKILL_EXISTS",
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
 * /api/v1/skills/{id}:
 *   patch:
 *     summary: Cập nhật kỹ năng (Manager/Admin only)
 *     description: |
 *       Cập nhật thông tin kỹ năng. Chỉ Manager và Admin mới có quyền.
 *       Tất cả fields trong body đều optional (partial update).
 *       Nếu đổi tên, tên mới phải unique.
 *     tags: [Skill Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của skill
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên mới
 *               description:
 *                 type: string
 *                 description: Mô tả mới
 *               is_active:
 *                 type: boolean
 *                 description: Trạng thái
 *           example:
 *             name: "Photography (Updated)"
 *             description: "Kỹ năng chụp ảnh nâng cao"
 *             is_active: false
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc body rỗng
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Skill not found
 *       409:
 *         description: Name already exists
 *       500:
 *         description: Lỗi server
 */
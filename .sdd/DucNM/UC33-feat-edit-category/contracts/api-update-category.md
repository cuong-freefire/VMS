# API Contract: PATCH /api/v1/categories/:id

## Summary

Cập nhật thông tin danh mục. Chỉ Manager và Admin mới có quyền truy cập. Type không thể thay đổi.

## Endpoint

```
PATCH /api/v1/categories/:id
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: Only `MANAGER` and `ADMIN` roles

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Integer | Yes | ID của category cần chỉnh sửa |

## Request Body (tất cả fields đều optional)

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `name` | String | No | Min 1 ký tự, unique trong cùng type | Tên mới |
| `description` | String | No | - | Mô tả mới |
| `is_active` | Boolean | No | - | Trạng thái tài khoản |

## Example Request

```http
PATCH /api/v1/categories/1
Content-Type: application/json
Cookie: token=eyJhbGciOiJIUzI1NiIs...

{
  "name": "Thể thao (Updated)",
  "description": "Các sự kiện thể thao cập nhật",
  "is_active": false
}
```

## Success Response (200 OK)

```json
{
  "success": true,
  "message": "Cập nhật danh mục thành công",
  "data": {
    "category_id": 1,
    "name": "Thể thao (Updated)",
    "description": "Các sự kiện thể thao cập nhật",
    "type": "event_type",
    "is_active": false,
    "created_at": "2026-01-15T08:30:00.000Z",
    "updated_at": "2026-07-01T10:00:00.000Z"
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
    { "field": "name", "message": "Category name cannot be empty" }
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

### 404 Not Found — Category does not exist

```json
{
  "success": false,
  "message": "Category not found.",
  "code": "CATEGORY_NOT_FOUND",
  "details": null
}
```

### 409 Conflict — Name already exists

```json
{
  "success": false,
  "message": "Category name already exists in this type.",
  "code": "CATEGORY_EXISTS",
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
 * /api/v1/categories/{id}:
 *   patch:
 *     summary: Cập nhật danh mục (Manager/Admin only)
 *     description: |
 *       Cập nhật thông tin danh mục. Chỉ Manager và Admin mới có quyền.
 *       Type không thể thay đổi. Tất cả fields trong body đều optional (partial update).
 *       Nếu đổi tên, tên mới phải unique trong cùng type.
 *     tags: [Category Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của category
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
 *             name: "Thể thao (Updated)"
 *             description: "Các sự kiện thể thao cập nhật"
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
 *         description: Category not found
 *       409:
 *         description: Name already exists
 *       500:
 *         description: Lỗi server
 */
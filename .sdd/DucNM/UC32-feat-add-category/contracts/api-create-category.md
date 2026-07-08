# API Contract: POST /api/v1/categories

## Summary

Tạo một danh mục mới. Chỉ Manager và Admin mới có quyền truy cập.

## Endpoint

```
POST /api/v1/categories
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: Only `MANAGER` and `ADMIN` roles

## Request Body

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `name` | String | Yes | Min 1 ký tự, unique trong cùng type | Tên danh mục |
| `description` | String | No | - | Mô tả danh mục |
| `type` | String | Yes | Phải thuộc: `location`, `event_type`, `time_frame` | Loại danh mục |

## Example Request

```http
POST /api/v1/categories
Content-Type: application/json
Cookie: token=eyJhbGciOiJIUzI1NiIs...

{
  "name": "Thể thao",
  "description": "Các sự kiện tình nguyện liên quan đến thể thao",
  "type": "event_type"
}
```

## Success Response (201 Created)

```json
{
  "success": true,
  "message": "Tạo danh mục thành công",
  "data": {
    "category_id": 3,
    "name": "Thể thao",
    "description": "Các sự kiện tình nguyện liên quan đến thể thao",
    "type": "event_type",
    "is_active": true,
    "created_at": "2026-06-30T12:00:00.000Z",
    "updated_at": "2026-06-30T12:00:00.000Z"
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
    { "field": "name", "message": "Category name is required" },
    { "field": "type", "message": "Type must be: location, event_type, or time_frame" }
  ]
}
```

### 409 Conflict — Category already exists

```json
{
  "success": false,
  "message": "Category name already exists in this type.",
  "code": "CATEGORY_EXISTS",
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
 * /api/v1/categories:
 *   post:
 *     summary: Tạo danh mục mới (Manager/Admin only)
 *     description: |
 *       Tạo một danh mục mới để phân loại sự kiện.
 *       Chỉ Manager và Admin mới có quyền truy cập.
 *       Tên category phải unique trong cùng type.
 *     tags: [Category Management]
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
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên danh mục
 *               description:
 *                 type: string
 *                 description: Mô tả danh mục (optional)
 *               type:
 *                 type: string
 *                 enum: [location, event_type, time_frame]
 *                 description: Loại danh mục
 *           example:
 *             name: "Thể thao"
 *             description: "Các sự kiện tình nguyện liên quan đến thể thao"
 *             type: "event_type"
 *     responses:
 *       201:
 *         description: Tạo danh mục thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       409:
 *         description: Category name already exists
 *       500:
 *         description: Lỗi server
 */
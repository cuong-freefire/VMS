# API Contract: PUT /api/v1/organizations/:id

## Summary

Cập nhật thông tin tổ chức. Chỉ Manager và Admin mới có quyền truy cập. Hỗ trợ upload logo mới (tự động xóa logo cũ trên Cloudinary). Hỗ trợ soft-delete (vô hiệu hóa) với ràng buộc kiểm tra sự kiện đang hoạt động.

## Endpoint

```
PUT /api/v1/organizations/:id
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: Only `MANAGER` and `ADMIN` roles

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Integer | Yes | ID của tổ chức cần chỉnh sửa |

## Request Body (multipart/form-data)

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `name` | String | Yes | Min 1 ký tự, unique (trừ chính nó) | Tên tổ chức |
| `description` | String | No | - | Mô tả |
| `address` | String | No | - | Địa chỉ |
| `contact_phone` | String | No | - | Số điện thoại |
| `contact_email` | String | No | Email format | Email liên hệ |
| `website` | String | No | URL format | Website |
| `is_active` | Boolean | No | - | Trạng thái (false = soft-delete) |
| `logo` | File | No | Max 2MB, .jpg/.png/.webp | Logo mới |

## Example Request

```http
PUT /api/v1/organizations/1
Content-Type: multipart/form-data
Cookie: token=eyJhbGciOiJIUzI1NiIs...

name: "Hội Chữ Thập Đỏ Việt Nam"
description: "Tổ chức nhân đạo quốc gia"
address: "Hà Nội"
contact_phone: "0123456789"
contact_email: "info@chuthapdo.org.vn"
website: "https://chuthapdo.org.vn"
is_active: true
logo: [file upload - optional]
```

## Success Response (200 OK)

```json
{
  "success": true,
  "message": "Cập nhật tổ chức thành công",
  "data": {
    "organization_id": 1,
    "name": "Hội Chữ Thập Đỏ Việt Nam",
    "description": "Tổ chức nhân đạo quốc gia",
    "address": "Hà Nội",
    "contact_phone": "0123456789",
    "contact_email": "info@chuthapdo.org.vn",
    "website": "https://chuthapdo.org.vn",
    "logo_url": "https://res.cloudinary.com/.../logo.jpg",
    "is_active": true,
    "created_at": "2026-01-15T08:30:00.000Z",
    "updated_at": "2026-07-04T14:00:00.000Z"
  }
}
```

## Error Responses

### 400 Bad Request — Already inactive

```json
{
  "success": false,
  "message": "Tổ chức đã bị vô hiệu hóa trước đó.",
  "code": "ALREADY_INACTIVE",
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
    { "field": "name", "message": "Tên tổ chức là bắt buộc" }
  ]
}
```

### 400 Bad Request — File too large

```json
{
  "success": false,
  "message": "Kích thước file tối đa 2MB",
  "code": "FILE_TOO_LARGE",
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

### 404 Not Found — Organization does not exist

```json
{
  "success": false,
  "message": "Organization not found.",
  "code": "ORGANIZATION_NOT_FOUND",
  "details": null
}
```

### 409 Conflict — Name already exists

```json
{
  "success": false,
  "message": "Tên tổ chức đã tồn tại.",
  "code": "ORGANIZATION_EXISTS",
  "details": null
}
```

### 409 Conflict — Active events exist

```json
{
  "success": false,
  "message": "Không thể vô hiệu hóa tổ chức vì còn sự kiện đang hoạt động.",
  "code": "ACTIVE_EVENTS_EXIST",
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
 * /api/v1/organizations/{id}:
 *   put:
 *     summary: Cập nhật tổ chức (Manager/Admin only)
 *     description: |
 *       Cập nhật thông tin tổ chức. Chỉ Manager và Admin mới có quyền.
 *       Hỗ trợ upload logo mới (tự động xóa logo cũ trên Cloudinary).
 *       Hỗ trợ soft-delete với ràng buộc kiểm tra sự kiện đang hoạt động.
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
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               contact_phone:
 *                 type: string
 *               contact_email:
 *                 type: string
 *                 format: email
 *               website:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ, file lỗi, hoặc đã inactive
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Organization not found
 *       409:
 *         description: Tên trùng hoặc còn sự kiện đang hoạt động
 *       500:
 *         description: Lỗi server
 */
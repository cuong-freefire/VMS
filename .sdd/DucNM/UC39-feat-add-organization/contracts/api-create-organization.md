# API Contract: POST /api/v1/organizations

## Summary

Tạo một tổ chức mới. Chỉ Admin mới có quyền truy cập. Hỗ trợ upload logo lên Cloudinary.

## Endpoint

```
POST /api/v1/organizations
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: Only `ADMIN` role

## Request Body (multipart/form-data)

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `name` | String | Yes | Min 1 ký tự, unique | Tên tổ chức |
| `description` | String | No | - | Mô tả |
| `address` | String | No | - | Địa chỉ |
| `contact_phone` | String | No | - | Số điện thoại |
| `contact_email` | String | No | Email format | Email liên hệ |
| `website` | String | No | URL format | Website |
| `logo` | File | No | Max 2MB, .jpg/.png/.webp | Logo tổ chức |

## Example Request

```http
POST /api/v1/organizations
Content-Type: multipart/form-data
Cookie: token=eyJhbGciOiJIUzI1NiIs...

name: "Hội Chữ Thập Đỏ"
description: "Tổ chức nhân đạo"
address: "Hà Nội"
contact_phone: "0123456789"
contact_email: "info@chuthapdo.org"
website: "https://chuthapdo.org"
logo: [file upload]
```

## Success Response (201 Created)

```json
{
  "success": true,
  "message": "Tạo tổ chức thành công",
  "data": {
    "organization_id": 1,
    "name": "Hội Chữ Thập Đỏ",
    "description": "Tổ chức nhân đạo",
    "address": "Hà Nội",
    "contact_phone": "0123456789",
    "contact_email": "info@chuthapdo.org",
    "website": "https://chuthapdo.org",
    "logo_url": "https://res.cloudinary.com/.../logo.jpg",
    "is_active": true,
    "created_at": "2026-07-04T12:00:00.000Z",
    "updated_at": "2026-07-04T12:00:00.000Z"
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

### 400 Bad Request — Invalid file format

```json
{
  "success": false,
  "message": "Chỉ chấp nhận định dạng .jpg, .png, .webp",
  "code": "INVALID_FILE_FORMAT",
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

### 403 Forbidden — Not Admin

```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập tài nguyên này",
  "code": "FORBIDDEN",
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
 * /api/v1/organizations:
 *   post:
 *     summary: Tạo tổ chức mới (Admin only)
 *     description: |
 *       Tạo một tổ chức mới. Chỉ Admin mới có quyền.
 *       Hỗ trợ upload logo lên Cloudinary (max 2MB, .jpg/.png/.webp).
 *       Tên tổ chức phải unique.
 *     tags: [Organization Management]
 *     security:
 *       - cookieAuth: []
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
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Tạo tổ chức thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc file lỗi
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       409:
 *         description: Tên tổ chức đã tồn tại
 *       500:
 *         description: Lỗi server
 */
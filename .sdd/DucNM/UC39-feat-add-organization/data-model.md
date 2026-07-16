# Data Model: Add Organization (UC39)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-04

---

## 1. Entity: Organization (Create)

### Request Fields (Input)

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `name` | String (varchar 255) | Yes | Min 1 ký tự, unique | Tên tổ chức |
| `description` | String (text) | No | - | Mô tả |
| `address` | String (varchar 500) | No | - | Địa chỉ |
| `contact_phone` | String (varchar 20) | No | - | Số điện thoại |
| `contact_email` | String (varchar 255) | No | Email format nếu có | Email liên hệ |
| `website` | String (varchar 500) | No | URL format nếu có | Website |
| `logo` | File (upload) | No | Max 2MB, .jpg/.png/.webp | Logo tổ chức |

### Response Fields (Output)

| Field | Type | Description |
|-------|------|-------------|
| `organization_id` | Integer (PK) | ID của tổ chức mới |
| `name` | String | Tên tổ chức |
| `description` | String (nullable) | Mô tả |
| `address` | String (nullable) | Địa chỉ |
| `contact_phone` | String (nullable) | Số điện thoại |
| `contact_email` | String (nullable) | Email |
| `website` | String (nullable) | Website |
| `logo_url` | String (nullable) | URL logo (Cloudinary) |
| `is_active` | Boolean | Mặc định = true |
| `created_at` | DateTime | Thời điểm tạo |
| `updated_at` | DateTime | Thời điểm cập nhật |

### Validation Rules

| Field | Rule | Error Code | HTTP Status |
|-------|------|------------|-------------|
| `name` | Không được empty | `VALIDATION_ERROR` | 400 |
| `name` | Unique | `ORGANIZATION_EXISTS` | 409 |
| `contact_email` | Email format nếu có | `VALIDATION_ERROR` | 400 |
| `website` | URL format nếu có | `VALIDATION_ERROR` | 400 |
| `logo` file size | Max 2MB | `FILE_TOO_LARGE` | 400 |
| `logo` format | .jpg/.png/.webp | `INVALID_FILE_FORMAT` | 400 |

### Default Values

| Field | Default |
|-------|---------|
| `is_active` | `true` |

---

## 2. API Request/Response

### Request Body (multipart/form-data)

```
POST /api/v1/organizations
Content-Type: multipart/form-data

name: "Hội Chữ Thập Đỏ"
description: "Tổ chức nhân đạo"
address: "Hà Nội"
contact_phone: "0123456789"
contact_email: "info@chuthapdo.org"
website: "https://chuthapdo.org"
logo: [file upload]
```

### Success Response (201 Created) — JSON

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

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Dữ liệu đầu vào không hợp lệ |
| 400 | `FILE_TOO_LARGE` | File > 2MB |
| 400 | `INVALID_FILE_FORMAT` | Không đúng định dạng ảnh |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập |
| 403 | `FORBIDDEN` | Không phải Admin |
| 409 | `ORGANIZATION_EXISTS` | Tên tổ chức đã tồn tại |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |

### 409 Conflict Response

```json
{
  "success": false,
  "message": "Tên tổ chức đã tồn tại.",
  "code": "ORGANIZATION_EXISTS",
  "details": null
}
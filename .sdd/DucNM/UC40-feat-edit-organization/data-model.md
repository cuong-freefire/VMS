# Data Model: Edit Organization (UC40)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-04

---

## 1. Entity: Organization (Update)

### Request Fields (Input — PUT, gửi toàn bộ trường)

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `name` | String (varchar 255) | Yes | Min 1 ký tự, unique (trừ chính nó) | Tên tổ chức |
| `description` | String (text) | No | - | Mô tả |
| `address` | String (varchar 500) | No | - | Địa chỉ |
| `contact_phone` | String (varchar 20) | No | - | Số điện thoại |
| `contact_email` | String (varchar 255) | No | Email format nếu có | Email liên hệ |
| `website` | String (varchar 500) | No | URL format nếu có | Website |
| `is_active` | Boolean | No | - | Trạng thái (soft-delete) |
| `logo` | File (upload) | No | Max 2MB, .jpg/.png/.webp | Logo mới |

### Response Fields (Output)

| Field | Type | Description |
|-------|------|-------------|
| `organization_id` | Integer (PK) | ID của tổ chức |
| `name` | String | Tên (đã cập nhật) |
| `description` | String (nullable) | Mô tả (đã cập nhật) |
| `address` | String (nullable) | Địa chỉ (đã cập nhật) |
| `contact_phone` | String (nullable) | Số điện thoại (đã cập nhật) |
| `contact_email` | String (nullable) | Email (đã cập nhật) |
| `website` | String (nullable) | Website (đã cập nhật) |
| `logo_url` | String (nullable) | URL logo (đã cập nhật) |
| `is_active` | Boolean | Trạng thái (đã cập nhật) |
| `created_at` | DateTime | Ngày tạo (không đổi) |
| `updated_at` | DateTime | Ngày cập nhật (auto) |

### Immutable Fields

| Field | Immutable? | Reason |
|-------|-----------|--------|
| `organization_id` | ✅ Immutable | Primary key |
| `created_at` | ✅ Immutable | Auto-set on creation |

### Validation Rules

| Rule | Error Code | HTTP Status |
|------|------------|-------------|
| `name` không được empty | `VALIDATION_ERROR` | 400 |
| `name` trùng (trừ chính nó) | `ORGANIZATION_EXISTS` | 409 |
| `contact_email` sai format | `VALIDATION_ERROR` | 400 |
| `website` sai format | `VALIDATION_ERROR` | 400 |
| Logo file > 2MB | `FILE_TOO_LARGE` | 400 |
| Logo sai định dạng | `INVALID_FILE_FORMAT` | 400 |
| Organization ID không tồn tại | `ORGANIZATION_NOT_FOUND` | 404 |
| Set inactive khi còn active events | `ACTIVE_EVENTS_EXIST` | 409 |
| Đã inactive, set inactive lại | `ALREADY_INACTIVE` | 400 |

---

## 2. Business Logic Constraints

### Soft-delete Flow
```
[Active] --set is_active=false--> [Check active events] --no active events--> [Inactive]
                                     |
                                     |--has active events--> [409 Conflict]
```

### Already Inactive Flow
```
[Already Inactive] --set is_active=false--> [400 Bad Request]
```

---

## 3. API Request/Response

### Request Body (PUT /api/v1/organizations/:id) — multipart/form-data

```
PUT /api/v1/organizations/1
Content-Type: multipart/form-data

name: "Hội Chữ Thập Đỏ Việt Nam"
description: "Tổ chức nhân đạo quốc gia"
address: "Hà Nội"
contact_phone: "0123456789"
contact_email: "info@chuthapdo.org.vn"
website: "https://chuthapdo.org.vn"
is_active: true
logo: [file upload - optional]
```

### Success Response (200 OK)

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

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Dữ liệu không hợp lệ |
| 400 | `FILE_TOO_LARGE` | File > 2MB |
| 400 | `INVALID_FILE_FORMAT` | Sai định dạng ảnh |
| 400 | `ALREADY_INACTIVE` | Đã inactive trước đó |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập |
| 403 | `FORBIDDEN` | Không phải Manager/Admin |
| 404 | `ORGANIZATION_NOT_FOUND` | ID không tồn tại |
| 409 | `ORGANIZATION_EXISTS` | Tên đã tồn tại |
| 409 | `ACTIVE_EVENTS_EXIST` | Còn sự kiện đang hoạt động |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |

### 409 Active Events Response

```json
{
  "success": false,
  "message": "Không thể vô hiệu hóa tổ chức vì còn sự kiện đang hoạt động.",
  "code": "ACTIVE_EVENTS_EXIST",
  "details": null
}
```

### 400 Already Inactive Response

```json
{
  "success": false,
  "message": "Tổ chức đã bị vô hiệu hóa trước đó.",
  "code": "ALREADY_INACTIVE",
  "details": null
}
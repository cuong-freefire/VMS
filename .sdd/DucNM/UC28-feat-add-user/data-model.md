# Data Model: Add User (UC28)

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## 1. Entity: User (Create)

### Request Fields (Input)

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `full_name` | String (varchar 255) | Yes | Min 1 ký tự | Họ và tên đầy đủ |
| `email` | String (varchar 255) | Yes | Email format + unique (kể cả inactive) | Email đăng nhập |
| `phone` | String (varchar 20) | No | - | Số điện thoại |
| `password` | String | Yes | Min 8 ký tự | Mật khẩu (hash bằng bcryptjs trước khi lưu) |
| `role_id` | Integer | Yes | Phải tồn tại trong bảng Role | Role của user |

### Response Fields (Output — không bao gồm password)

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | Integer (PK) | ID duy nhất của user mới |
| `full_name` | String | Họ và tên |
| `email` | String | Email |
| `phone` | String (nullable) | Số điện thoại |
| `avatar_url` | String (nullable) | URL ảnh đại diện (mặc định null) |
| `role` | String | Tên role (VD: "VOLUNTEER") |
| `is_active` | Boolean | Mặc định = true |
| `created_at` | DateTime | Thời điểm tạo |
| `updated_at` | DateTime | Thời điểm cập nhật |

### Entity: Role

| Field | Type | Description |
|-------|------|-------------|
| `role_id` | Integer (PK) | ID duy nhất |
| `name` | String (varchar 50, unique) | VOLUNTEER, STAFF, MANAGER, ADMIN |

### Relationships

```
User N:1 → Role (user.role_id = role.role_id)
```

### Validation Rules

| Field | Rule | Error Code | HTTP Status |
|-------|------|------------|-------------|
| `full_name` | Không được empty | `FULL_NAME_REQUIRED` | 400 |
| `email` | Phải đúng email format | `INVALID_EMAIL` | 400 |
| `email` | Phải duy nhất (kể cả inactive) | `EMAIL_EXISTS` | 409 |
| `password` | >= 8 ký tự | `PASSWORD_TOO_SHORT` | 400 |
| `role_id` | Phải là số nguyên dương hợp lệ | `INVALID_ROLE` | 400 |
| `role_id` | Phải tồn tại trong bảng Role | `INVALID_ROLE` | 400 |

### Default Values

| Field | Default |
|-------|---------|
| `is_active` | `true` |
| `avatar_url` | `null` |

---

## 2. API Request/Response

### Request Body (POST /api/v1/users)

```json
{
  "full_name": "Nguyễn Văn B",
  "email": "nguyenvanb@example.com",
  "phone": "0987654321",
  "password": "password123",
  "role_id": 1
}
```

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Tạo người dùng thành công",
  "data": {
    "user_id": 2,
    "full_name": "Nguyễn Văn B",
    "email": "nguyenvanb@example.com",
    "phone": "0987654321",
    "avatar_url": null,
    "role": "VOLUNTEER",
    "is_active": true,
    "created_at": "2026-06-30T12:00:00.000Z",
    "updated_at": "2026-06-30T12:00:00.000Z"
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Dữ liệu đầu vào không hợp lệ (kèm details field lỗi) |
| 409 | `EMAIL_EXISTS` | Email đã tồn tại trong hệ thống |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập hoặc token hết hạn |
| 403 | `FORBIDDEN` | Không có quyền (không phải Admin) |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |

### Validation Error Response (400)

```json
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Password must be at least 8 characters" }
  ]
}
```

### 409 Conflict Response

```json
{
  "success": false,
  "message": "Email already exists.",
  "code": "EMAIL_EXISTS",
  "details": null
}
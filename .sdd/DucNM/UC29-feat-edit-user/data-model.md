# Data Model: Edit User (UC29)

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## 1. Entity: User (Update)

### Request Fields (Input — tất cả đều optional)

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `full_name` | String (varchar 255) | No | Min 1 ký tự nếu có | Cập nhật họ tên |
| `phone` | String (varchar 20) | No | - | Cập nhật số điện thoại |
| `avatar_url` | String (varchar 500) | No | URL format nếu có | Cập nhật avatar |
| `role_id` | Integer | No | Phải tồn tại trong bảng Role | Thay đổi role |
| `is_active` | Boolean | No | - | Kích hoạt/vô hiệu hóa tài khoản |

### Response Fields (Output — không bao gồm password)

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | Integer (PK) | ID của user |
| `full_name` | String | Họ và tên (đã cập nhật) |
| `email` | String | Email (bất biến, không đổi) |
| `phone` | String (nullable) | Số điện thoại (đã cập nhật) |
| `avatar_url` | String (nullable) | URL ảnh đại diện (đã cập nhật) |
| `role` | String | Tên role (đã cập nhật) |
| `is_active` | Boolean | Trạng thái (đã cập nhật) |
| `created_at` | DateTime | Ngày tạo (không đổi) |
| `updated_at` | DateTime | Ngày cập nhật (tự động update) |

### ✋ KHÔNG được phép update

| Field | Lý do |
|-------|-------|
| `email` | Bất biến — FR-003 |
| `password` | Thuộc UC06 (Change Password) |

### Immutable Fields

| Field | Immutable? | Reason |
|-------|-----------|--------|
| `user_id` | ✅ Immutable | Primary key |
| `email` | ✅ Immutable | Business rule FR-003 |
| `created_at` | ✅ Immutable | Auto-set on creation |
| `password` | ✅ Not in scope | UC06 Change Password |

### Validation Rules

| Rule | Error Code | HTTP Status |
|------|------------|-------------|
| Request body rỗng (không field nào) | `NO_FIELDS_TO_UPDATE` | 400 |
| `full_name` empty nếu có | `INVALID_FULL_NAME` | 400 |
| `avatar_url` không đúng URL format | `INVALID_AVATAR_URL` | 400 |
| `role_id` không tồn tại | `INVALID_ROLE` | 400 |
| User ID không tồn tại | `USER_NOT_FOUND` | 404 |
| Admin tự hạ role của chính mình | `SELF_ROLE_DOWNGRADE` | 403 |

---

## 2. API Request/Response

### Request Body (PATCH /api/v1/users/:id) — chỉ gửi fields cần update

```json
{
  "full_name": "Nguyễn Văn B (Updated)",
  "phone": "0909123456",
  "role_id": 2,
  "is_active": true
}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Cập nhật thông tin người dùng thành công",
  "data": {
    "user_id": 1,
    "full_name": "Nguyễn Văn B (Updated)",
    "email": "nguyenvanb@example.com",
    "phone": "0909123456",
    "avatar_url": null,
    "role": "STAFF",
    "is_active": true,
    "created_at": "2026-01-15T08:30:00.000Z",
    "updated_at": "2026-06-30T14:00:00.000Z"
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `NO_FIELDS_TO_UPDATE` | Request body rỗng, không có field nào để update |
| 400 | `VALIDATION_ERROR` | Dữ liệu không hợp lệ (kèm details) |
| 403 | `SELF_ROLE_DOWNGRADE` | Admin tự hạ role của chính mình |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập hoặc token hết hạn |
| 403 | `FORBIDDEN` | Không có quyền (không phải Admin) |
| 404 | `USER_NOT_FOUND` | User ID không tồn tại |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |

### 400 Empty Body Response

```json
{
  "success": false,
  "message": "No fields to update.",
  "code": "NO_FIELDS_TO_UPDATE",
  "details": null
}
```

### 403 Self-Role-Downgrade Response

```json
{
  "success": false,
  "message": "Cannot downgrade your own role.",
  "code": "SELF_ROLE_DOWNGRADE",
  "details": null
}
# Data Model: View User Detail (UC27)

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## 1. Entity: User (Detail View)

### Fields (hiển thị trong trang chi tiết)

| Field | Type | Description | Source |
|-------|------|-------------|--------|
| `user_id` | Integer (PK, auto-increment) | ID duy nhất của user | Database |
| `full_name` | String (varchar 255) | Họ và tên đầy đủ | Database |
| `email` | String (varchar 255, unique) | Email đăng nhập | Database |
| `phone` | String (varchar 20, nullable) | Số điện thoại | Database |
| `avatar_url` | String (varchar 500, nullable) | URL ảnh đại diện (Cloudinary) | Database |
| `role` | Relation → Role | Tên role (Volunteer, Staff, Manager, Admin) | Database (join) |
| `is_active` | Boolean | Trạng thái hoạt động (true = active, false = inactive) | Database |
| `created_at` | DateTime | Ngày tạo tài khoản | Database |
| `updated_at` | DateTime | Ngày cập nhật gần nhất | Database |

### Entity: Role

| Field | Type | Description |
|-------|------|-------------|
| `role_id` | Integer (PK) | ID duy nhất |
| `name` | String (varchar 50, unique) | Tên role: VOLUNTEER, STAFF, MANAGER, ADMIN |

### Relationships

```
User N:1 → Role (user.role_id = role.role_id)
```

### Validation Rules

| Field | Rule | Error Code |
|-------|------|------------|
| `user_id` (route param) | Phải là số nguyên dương | `INVALID_USER_ID` |

### State Transitions (User)

```
Active (is_active: true) ←→ Inactive (is_active: false)
```
- Soft delete: Chuyển `is_active` từ `true` → `false`
- Admin vẫn thấy user inactive trong trang chi tiết

---

## 2. API Route Parameters

| Parameter | Type | Required | Location | Description |
|-----------|------|----------|----------|-------------|
| `id` | Integer | Yes | Path (`:id`) | ID của user cần xem chi tiết |

---

## 3. API Response Structure

### Success Response (200)

```json
{
  "success": true,
  "message": "Lấy thông tin người dùng thành công",
  "data": {
    "user_id": 1,
    "full_name": "Nguyễn Văn A",
    "email": "nguyenvana@example.com",
    "phone": "0123456789",
    "avatar_url": "https://res.cloudinary.com/.../avatar.jpg",
    "role": "VOLUNTEER",
    "is_active": true,
    "created_at": "2026-01-15T08:30:00.000Z",
    "updated_at": "2026-06-28T10:00:00.000Z"
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_USER_ID` | `:id` không phải số nguyên dương hợp lệ |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập hoặc token hết hạn |
| 403 | `FORBIDDEN` | Không có quyền (không phải Admin) |
| 404 | `USER_NOT_FOUND` | User ID không tồn tại trong database |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |

### 404 Response

```json
{
  "success": false,
  "message": "User not found.",
  "code": "USER_NOT_FOUND",
  "details": null
}
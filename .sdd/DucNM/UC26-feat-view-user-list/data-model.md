# Data Model: View User List (UC26)

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## 1. Entity: User

### Fields (hiển thị trong danh sách)

| Field | Type | Description | Source |
|-------|------|-------------|--------|
| `user_id` | Integer (PK, auto-increment) | ID duy nhất của user | Database |
| `full_name` | String (varchar 255) | Họ và tên đầy đủ | Database |
| `email` | String (varchar 255, unique) | Email đăng nhập | Database |
| `phone` | String (varchar 20, nullable) | Số điện thoại | Database |
| `avatar_url` | String (varchar 500, nullable) | URL ảnh đại diện | Database |
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
| `page` | Phải là số nguyên dương, mặc định = 1 | `INVALID_PAGE` |
| `limit` | Phải là số nguyên dương (1-100), mặc định = 20 | `INVALID_LIMIT` |
| `search` | String, sanitize special characters | `INVALID_SEARCH` |
| `role` | Phải là role hợp lệ: volunteer, staff, manager, admin | `INVALID_ROLE` |
| `sort` | Format: `field:direction` (vd: `created_at:desc`) | `INVALID_SORT` |

### State Transitions (User)

```
Active (is_active: true) ←→ Inactive (is_active: false)
```
- Soft delete: Chuyển `is_active` từ `true` → `false`
- Admin có thể reactivate: Chuyển `is_active` từ `false` → `true`

---

## 2. API Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Integer | No | 1 | Số trang hiện tại |
| `limit` | Integer | No | 20 | Số items mỗi trang (max 100) |
| `search` | String | No | - | Tìm kiếm theo tên hoặc email (case-insensitive) |
| `role` | String | No | - | Lọc theo role (volunteer, staff, manager, admin) |
| `sort` | String | No | `created_at:desc` | Sắp xếp (field:direction) |

---

## 3. API Response Structure

### Success Response (200)

```json
{
  "success": true,
  "message": "Lấy danh sách người dùng thành công",
  "data": {
    "users": [
      {
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
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_PAGE` | `page` không hợp lệ (số âm, không phải số) |
| 400 | `INVALID_LIMIT` | `limit` không hợp lệ (số âm, > 100) |
| 400 | `INVALID_ROLE` | `role` không hợp lệ |
| 400 | `INVALID_SORT` | `sort` format không đúng |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập hoặc token hết hạn |
| 403 | `FORBIDDEN` | Không có quyền (không phải Admin) |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |

### Empty List Response

```json
{
  "success": true,
  "message": "Không tìm thấy người dùng nào",
  "data": {
    "users": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
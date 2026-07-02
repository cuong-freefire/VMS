# Data Model: Add Skill (UC35)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-02

---

## 1. Entity: Skill (Create)

### Request Fields (Input)

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `name` | String (varchar 255) | Yes | Min 1 ký tự, unique trên toàn bảng | Tên kỹ năng |
| `description` | String (text) | No | - | Mô tả kỹ năng |

### Response Fields (Output)

| Field | Type | Description |
|-------|------|-------------|
| `skill_id` | Integer (PK) | ID của skill mới |
| `name` | String | Tên kỹ năng |
| `description` | String (nullable) | Mô tả |
| `is_active` | Boolean | Mặc định = true |
| `created_at` | DateTime | Thời điểm tạo |
| `updated_at` | DateTime | Thời điểm cập nhật |

### Validation Rules

| Field | Rule | Error Code | HTTP Status |
|-------|------|------------|-------------|
| `name` | Không được empty | `VALIDATION_ERROR` | 400 |
| `name` | Unique trên toàn bảng | `SKILL_EXISTS` | 409 |

### Default Values

| Field | Default |
|-------|---------|
| `is_active` | `true` |

---

## 2. API Request/Response

### Request Body (POST /api/v1/skills)

```json
{
  "name": "Photography",
  "description": "Kỹ năng chụp ảnh và chỉnh sửa ảnh"
}
```

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Tạo kỹ năng thành công",
  "data": {
    "skill_id": 3,
    "name": "Photography",
    "description": "Kỹ năng chụp ảnh và chỉnh sửa ảnh",
    "is_active": true,
    "created_at": "2026-07-02T12:00:00.000Z",
    "updated_at": "2026-07-02T12:00:00.000Z"
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Dữ liệu đầu vào không hợp lệ (kèm details) |
| 409 | `SKILL_EXISTS` | Tên skill đã tồn tại |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập hoặc token hết hạn |
| 403 | `FORBIDDEN` | Không có quyền (không phải Manager/Admin) |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |

### 409 Conflict Response

```json
{
  "success": false,
  "message": "Skill name already exists.",
  "code": "SKILL_EXISTS",
  "details": null
}
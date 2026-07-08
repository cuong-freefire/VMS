# Data Model: Edit Skill (UC36)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-02

---

## 1. Entity: Skill (Update)

### Request Fields (Input — tất cả đều optional, PATCH)

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `name` | String (varchar 255) | No | Min 1 ký tự, unique (nếu khác tên cũ) | Tên mới |
| `description` | String (text) | No | - | Mô tả mới |
| `is_active` | Boolean | No | - | Kích hoạt/vô hiệu hóa |

### Response Fields (Output)

| Field | Type | Description |
|-------|------|-------------|
| `skill_id` | Integer (PK) | ID của skill |
| `name` | String | Tên (đã cập nhật) |
| `description` | String (nullable) | Mô tả (đã cập nhật) |
| `is_active` | Boolean | Trạng thái (đã cập nhật) |
| `created_at` | DateTime | Ngày tạo (không đổi) |
| `updated_at` | DateTime | Ngày cập nhật (auto) |

### Immutable Fields

| Field | Immutable? | Reason |
|-------|-----------|--------|
| `skill_id` | ✅ Immutable | Primary key |
| `created_at` | ✅ Immutable | Auto-set on creation |

### Validation Rules

| Rule | Error Code | HTTP Status |
|------|------------|-------------|
| Request body rỗng | `NO_FIELDS_TO_UPDATE` | 400 |
| `name` empty nếu có | `VALIDATION_ERROR` | 400 |
| `name` trùng | `SKILL_EXISTS` | 409 |
| Skill ID không tồn tại | `SKILL_NOT_FOUND` | 404 |

---

## 2. API Request/Response

### Request Body (PATCH /api/v1/skills/:id) — chỉ gửi fields cần update

```json
{
  "name": "Photography (Updated)",
  "description": "Kỹ năng chụp ảnh nâng cao",
  "is_active": false
}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Cập nhật kỹ năng thành công",
  "data": {
    "skill_id": 1,
    "name": "Photography (Updated)",
    "description": "Kỹ năng chụp ảnh nâng cao",
    "is_active": false,
    "created_at": "2026-01-15T08:30:00.000Z",
    "updated_at": "2026-07-02T14:00:00.000Z"
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `NO_FIELDS_TO_UPDATE` | Request body rỗng |
| 400 | `VALIDATION_ERROR` | Dữ liệu không hợp lệ |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập hoặc token hết hạn |
| 403 | `FORBIDDEN` | Không có quyền (không phải Manager/Admin) |
| 404 | `SKILL_NOT_FOUND` | Skill ID không tồn tại |
| 409 | `SKILL_EXISTS` | Tên đã tồn tại |
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

### 404 Response

```json
{
  "success": false,
  "message": "Skill not found.",
  "code": "SKILL_NOT_FOUND",
  "details": null
}
```

### 409 Conflict Response

```json
{
  "success": false,
  "message": "Skill name already exists.",
  "code": "SKILL_EXISTS",
  "details": null
}
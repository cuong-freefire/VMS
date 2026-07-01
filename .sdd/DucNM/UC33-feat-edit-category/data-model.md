# Data Model: Edit Category (UC33)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-01

---

## 1. Entity: Category (Update)

### Request Fields (Input — tất cả đều optional, PATCH)

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `name` | String (varchar 255) | No | Min 1 ký tự, unique trong cùng type (nếu khác tên cũ) | Tên mới |
| `description` | String (text) | No | - | Mô tả mới |
| `is_active` | Boolean | No | - | Kích hoạt/vô hiệu hóa |

### Response Fields (Output)

| Field | Type | Description |
|-------|------|-------------|
| `category_id` | Integer (PK) | ID của category |
| `name` | String | Tên (đã cập nhật) |
| `description` | String (nullable) | Mô tả (đã cập nhật) |
| `type` | String | Type (bất biến, không đổi) |
| `is_active` | Boolean | Trạng thái (đã cập nhật) |
| `created_at` | DateTime | Ngày tạo (không đổi) |
| `updated_at` | DateTime | Ngày cập nhật (auto) |

### ✋ KHÔNG được phép update

| Field | Lý do |
|-------|-------|
| `type` | Bất biến — FR-003 |

### Immutable Fields

| Field | Immutable? | Reason |
|-------|-----------|--------|
| `category_id` | ✅ Immutable | Primary key |
| `type` | ✅ Immutable | Business rule FR-003 |
| `created_at` | ✅ Immutable | Auto-set on creation |

### Validation Rules

| Rule | Error Code | HTTP Status |
|------|------------|-------------|
| Request body rỗng | `NO_FIELDS_TO_UPDATE` | 400 |
| `name` empty nếu có | `VALIDATION_ERROR` | 400 |
| `name` trùng trong cùng type | `CATEGORY_EXISTS` | 409 |
| Category ID không tồn tại | `CATEGORY_NOT_FOUND` | 404 |

---

## 2. API Request/Response

### Request Body (PATCH /api/v1/categories/:id) — chỉ gửi fields cần update

```json
{
  "name": "Thể thao (Updated)",
  "description": "Các sự kiện thể thao cập nhật",
  "is_active": false
}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Cập nhật danh mục thành công",
  "data": {
    "category_id": 1,
    "name": "Thể thao (Updated)",
    "description": "Các sự kiện thể thao cập nhật",
    "type": "event_type",
    "is_active": false,
    "created_at": "2026-01-15T08:30:00.000Z",
    "updated_at": "2026-07-01T10:00:00.000Z"
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
| 404 | `CATEGORY_NOT_FOUND` | Category ID không tồn tại |
| 409 | `CATEGORY_EXISTS` | Tên đã tồn tại trong cùng type |
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
  "message": "Category not found.",
  "code": "CATEGORY_NOT_FOUND",
  "details": null
}
```

### 409 Conflict Response

```json
{
  "success": false,
  "message": "Category name already exists in this type.",
  "code": "CATEGORY_EXISTS",
  "details": null
}
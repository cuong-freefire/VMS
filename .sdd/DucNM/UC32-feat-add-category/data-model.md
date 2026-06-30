# Data Model: Add Category (UC32)

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## 1. Entity: Category (Create)

### Request Fields (Input)

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `name` | String (varchar 255) | Yes | Min 1 ký tự, unique trong cùng type | Tên danh mục |
| `description` | String (text) | No | - | Mô tả danh mục |
| `type` | String (varchar 50) | Yes | Phải thuộc: `location`, `event_type`, `time_frame` | Loại danh mục |

### Response Fields (Output)

| Field | Type | Description |
|-------|------|-------------|
| `category_id` | Integer (PK) | ID của category mới |
| `name` | String | Tên danh mục |
| `description` | String (nullable) | Mô tả |
| `type` | String | Loại: location, event_type, time_frame |
| `is_active` | Boolean | Mặc định = true |
| `created_at` | DateTime | Thời điểm tạo |
| `updated_at` | DateTime | Thời điểm cập nhật |

### Validation Rules

| Field | Rule | Error Code | HTTP Status |
|-------|------|------------|-------------|
| `name` | Không được empty | `NAME_REQUIRED` | 400 |
| `name` + `type` | Unique trong cùng type | `CATEGORY_EXISTS` | 409 |
| `type` | Phải thuộc enum | `INVALID_TYPE` | 400 |

### Default Values

| Field | Default |
|-------|---------|
| `is_active` | `true` |

---

## 2. API Request/Response

### Request Body (POST /api/v1/categories)

```json
{
  "name": "Thể thao",
  "description": "Các sự kiện tình nguyện liên quan đến thể thao",
  "type": "event_type"
}
```

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Tạo danh mục thành công",
  "data": {
    "category_id": 3,
    "name": "Thể thao",
    "description": "Các sự kiện tình nguyện liên quan đến thể thao",
    "type": "event_type",
    "is_active": true,
    "created_at": "2026-06-30T12:00:00.000Z",
    "updated_at": "2026-06-30T12:00:00.000Z"
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Dữ liệu đầu vào không hợp lệ (kèm details) |
| 409 | `CATEGORY_EXISTS` | Tên category đã tồn tại trong cùng type |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập hoặc token hết hạn |
| 403 | `FORBIDDEN` | Không có quyền (không phải Manager/Admin) |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |

### 409 Conflict Response

```json
{
  "success": false,
  "message": "Category name already exists in this type.",
  "code": "CATEGORY_EXISTS",
  "details": null
}
# Data Model: View Category List (UC31)

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## 1. Entity: Category

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|------------|
| `category_id` | Integer (PK, auto-increment) | ID duy nhất của category | Primary key |
| `name` | String (varchar 255) | Tên danh mục (VD: "Giáo dục", "Môi trường") | NOT NULL |
| `description` | String (text, nullable) | Mô tả chi tiết về danh mục | Optional |
| `type` | String (varchar 50) | Loại danh mục: `location`, `event_type`, `time_frame` | NOT NULL |
| `is_active` | Boolean | Trạng thái hoạt động (true = active, false = inactive) | Default true |
| `created_at` | DateTime | Ngày tạo | Auto |
| `updated_at` | DateTime | Ngày cập nhật | Auto |

### Validation Rules

| Field | Rule | Description |
|-------|------|-------------|
| `name` | NOT NULL, tối thiểu 1 ký tự | Tên danh mục không được để trống |
| `type` | Phải là một trong: `location`, `event_type`, `time_frame` | Phân loại danh mục |

### State Transitions

```
Active (is_active: true) ←→ Inactive (is_active: false)
```
- Soft delete: Chuyển `is_active` từ `true` → `false`
- Restore: Chuyển `is_active` từ `false` → `true`

---

## 2. Role-Based Access Control

| Role | Categories visible | Auth required | Purpose |
|------|-------------------|---------------|---------|
| Guest | Active only (is_active = true) | No (public) | UC11 Filter Event |
| Volunteer | Active only (is_active = true) | Yes | UC11 Filter Event |
| Staff | Active only (is_active = true) | Yes | Event creation reference |
| Manager | All (active + inactive) | Yes | Full management |
| Admin | All (active + inactive) | Yes | Full management |

---

## 3. API Response Structure

### Success Response (200)

```json
{
  "success": true,
  "message": "Lấy danh sách danh mục thành công",
  "data": {
    "categories": [
      {
        "category_id": 1,
        "name": "Giáo dục",
        "description": "Các sự kiện liên quan đến giáo dục",
        "type": "event_type",
        "is_active": true
      },
      {
        "category_id": 2,
        "name": "Miền Bắc",
        "description": "Sự kiện tổ chức tại khu vực miền Bắc",
        "type": "location",
        "is_active": true
      }
    ]
  }
}
```

### Empty List Response

```json
{
  "success": true,
  "message": "Không có danh mục nào",
  "data": {
    "categories": []
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |

*Không có 401/403 cho Guest/Volunteer/Staff vì endpoint hỗ trợ optional auth.*
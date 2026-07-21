# Data Model: Search Category

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## 1. Query Parameters (Mở rộng từ UC31)

### All Query Params cho GET /api/v1/categories

| Parameter | Type | Required | Default | Description | Source |
|-----------|------|----------|---------|-------------|--------|
| `search` | String | No | - | Tìm kiếm theo tên/mô tả | **Search Category (NEW)** |
| `type` | Enum | No | - | Lọc type: location, event_type, time_frame | UC31 |

### Validation Rules

| Field | Rule | Error Code | HTTP Status |
|-------|------|------------|-------------|
| `search` | String, optional, trim whitespace | - | - |
| `type` | Enum: location, event_type, time_frame | `INVALID_TYPE` | 400 |

### Search Logic

```text
WHERE (name LIKE '%keyword%' OR description LIKE '%keyword%') AND (type = X) AND (is_active filter based on role)
```

### Search Behavior

- **Case-insensitive**: Không phân biệt chữ hoa/chữ thường
- **Partial match**: Tìm kiếm một phần của từ khóa
- **Empty keyword**: Bỏ qua search, trả về toàn bộ danh sách
- **Kết hợp filter type**: AND logic với type param

---

## 2. Entities Ảnh Hưởng

### Category (Danh mục) — Entity hiện tại

| Field | Type | Role trong Search |
|-------|------|-------------------|
| `name` | String | Tìm kiếm theo tên (partial match, case-insensitive) |
| `description` | String | Tìm kiếm theo mô tả (partial match, case-insensitive) |
| `type` | Enum | Kết hợp với filter type (location, event_type, time_frame) |
| `is_active` | Boolean | Role-based filtering: Manager thấy tất cả, Staff/Volunteer/Guest chỉ thấy active |

**Lưu ý**: Không thay đổi database schema. Các field `name`, `description`, `type`, `is_active` đã tồn tại trong categories table.

---

## 3. API Response

### Success Response (200) — Giống UC31, không thay đổi format

```json
{
  "success": true,
  "message": "Lấy danh sách danh mục thành công",
  "data": {
    "categories": [
      {
        "category_id": 1,
        "name": "Học Tập",
        "description": "Các hoạt động giáo dục",
        "type": "event_type",
        "is_active": true
      }
    ]
  }
}
```

### Error Responses

Không có error response mới cho Search Category. Search param là optional — nếu không có hoặc rỗng, request vẫn trả về danh sách bình thường.
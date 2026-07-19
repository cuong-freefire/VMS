# Data Model: Search Skill

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## 1. Query Parameters (Mở rộng từ UC34)

### All Query Params cho GET /api/v1/skills

| Parameter | Type | Required | Default | Description | Source |
|-----------|------|----------|---------|-------------|--------|
| `search` | String | No | - | Tìm kiếm theo tên/mô tả | **Search Skill (NEW)** |

### Validation Rules

| Field | Rule | Error Code | HTTP Status |
|-------|------|------------|-------------|
| `search` | String, optional, trim whitespace | - | - |

### Search Logic

```text
WHERE (name LIKE '%keyword%' OR description LIKE '%keyword%') AND (is_active filter based on role)
```

### Search Behavior

- **Case-insensitive**: Không phân biệt chữ hoa/chữ thường
- **Partial match**: Tìm kiếm một phần của từ khóa
- **Empty keyword**: Bỏ qua search, trả về toàn bộ danh sách

---

## 2. Entities Ảnh Hưởng

### Skill (Kỹ năng) — Entity hiện tại

| Field | Type | Role trong Search |
|-------|------|-------------------|
| `name` | String | Tìm kiếm theo tên (partial match, case-insensitive) |
| `description` | String | Tìm kiếm theo mô tả (partial match, case-insensitive) |
| `is_active` | Boolean | Role-based filtering: Manager thấy tất cả, Volunteer/Staff chỉ thấy active |

**Lưu ý**: Không thay đổi database schema. Các field `name`, `description`, `is_active` đã tồn tại trong skills table.

---

## 3. API Response

### Success Response (200) — Giống UC34, không thay đổi format

```json
{
  "success": true,
  "message": "Lấy danh sách kỹ năng thành công",
  "data": {
    "skills": [
      {
        "skill_id": 1,
        "name": "English",
        "description": "Kỹ năng tiếng Anh giao tiếp",
        "is_active": true
      }
    ]
  }
}
```

### Error Responses

Không có error response mới cho Search Skill. Search param là optional — nếu không có hoặc rỗng, request vẫn trả về danh sách bình thường.
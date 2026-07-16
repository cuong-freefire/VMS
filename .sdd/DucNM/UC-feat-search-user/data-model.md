# Data Model: Search User

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## 1. Query Parameters (Mở rộng từ UC26)

### All Query Params cho GET /api/v1/users

| Parameter | Type | Required | Default | Description | Source |
|-----------|------|----------|---------|-------------|--------|
| `page` | Integer | No | 1 | Số trang | UC26 |
| `limit` | Integer | No | 20 | Items mỗi trang (max 100) | UC26 |
| `search` | String | No | - | Tìm kiếm theo tên/email | **Search User (NEW)** |
| `role` | Enum | No | - | Lọc role: volunteer, staff, manager, admin | UC26 |
| `sort` | String | No | `created_at:desc` | Sắp xếp | UC26 |
| `is_active` | Boolean | No | - | Lọc active/inactive | UC30 |
| `from_date` | Date (YYYY-MM-DD) | No | - | Ngày tạo từ | UC30 |
| `to_date` | Date (YYYY-MM-DD) | No | - | Ngày tạo đến | UC30 |

### Validation Rules

| Field | Rule | Error Code | HTTP Status |
|-------|------|------------|-------------|
| `search` | String, optional, trim whitespace | - | - |

### Search Logic

```text
WHERE (full_name LIKE '%keyword%' OR email LIKE '%keyword%') AND (other filters...)
```

### Search Behavior

- **Case-insensitive**: Không phân biệt chữ hoa/chữ thường
- **Partial match**: Tìm kiếm một phần của từ khóa
- **Empty keyword**: Bỏ qua search, trả về toàn bộ danh sách
- **Kết hợp filter**: AND logic với role, is_active, date range

---

## 2. Entities Ảnh Hưởng

### User (Người dùng) — Entity hiện tại

| Field | Type | Role trong Search |
|-------|------|-------------------|
| `full_name` | String | Tìm kiếm theo tên (partial match, case-insensitive) |
| `email` | String | Tìm kiếm theo email (partial match, case-insensitive) |

**Lưu ý**: Không thay đổi database schema. Các field `full_name` và `email` đã tồn tại trong users table.

---

## 3. API Response

### Success Response (200) — Giống UC26, không thay đổi format

```json
{
  "success": true,
  "message": "Lấy danh sách người dùng thành công",
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### Error Responses

Không có error response mới cho Search User. Search param là optional — nếu không có hoặc rỗng, request vẫn hoạt động bình thường (trả về toàn bộ danh sách).
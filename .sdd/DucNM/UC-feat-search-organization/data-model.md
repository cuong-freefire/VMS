# Data Model: Search Organization

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## 1. Query Parameters (Mở rộng từ UC37)

### All Query Params cho GET /api/v1/organizations

| Parameter | Type | Required | Default | Description | Source |
|-----------|------|----------|---------|-------------|--------|
| `page` | Integer | No | 1 | Số trang | UC37 |
| `limit` | Integer | No | 20 | Items mỗi trang (max 100) | UC37 |
| `search` | String | No | - | Tìm kiếm theo tên tổ chức | **Search Organization (NEW)** |
| `is_active` | Boolean | No | - | Lọc active/inactive | UC37 |

### Validation Rules

| Field | Rule | Error Code | HTTP Status |
|-------|------|------------|-------------|
| `search` | String, optional, trim whitespace | - | - |

### Search Logic

```text
WHERE (name LIKE '%keyword%') AND (is_active filter based on role)
```

### Search Behavior

- **Case-insensitive**: Không phân biệt chữ hoa/chữ thường
- **Partial match**: Tìm kiếm một phần của từ khóa
- **Empty keyword**: Bỏ qua search, trả về toàn bộ danh sách
- **Search scope**: Chỉ search theo `name` — KHÔNG search theo email, địa chỉ

---

## 2. Entities Ảnh Hưởng

### Organization (Tổ chức) — Entity hiện tại

| Field | Type | Role trong Search |
|-------|------|-------------------|
| `name` | String | Tìm kiếm theo tên (partial match, case-insensitive) |
| `is_active` | Boolean | Role-based filtering: Admin thấy tất cả, Manager/Staff chỉ thấy active |

**Lưu ý**: Không thay đổi database schema. Các field `name` và `is_active` đã tồn tại trong organizations table.

---

## 3. API Response

### Success Response (200) — Giống UC37, không thay đổi format

```json
{
  "success": true,
  "message": "Lấy danh sách tổ chức thành công",
  "data": {
    "organizations": [
      {
        "organization_id": 1,
        "name": "Nhân Ái",
        "email": "info@nhanai.org",
        "is_active": true,
        "created_at": "2026-01-15T08:00:00.000Z"
      }
    ],
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

Không có error response mới cho Search Organization. Search param là optional — nếu không có hoặc rỗng, request vẫn trả về danh sách bình thường.
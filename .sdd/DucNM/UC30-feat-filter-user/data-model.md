# Data Model: Filter User (UC30)

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## 1. Query Parameters (Mở rộng từ UC26)

### All Query Params cho GET /api/v1/users

| Parameter | Type | Required | Default | Description | Source |
|-----------|------|----------|---------|-------------|--------|
| `page` | Integer | No | 1 | Số trang | UC26 |
| `limit` | Integer | No | 20 | Items mỗi trang (max 100) | UC26 |
| `search` | String | No | - | Tìm kiếm theo tên/email | UC26 |
| `role` | Enum | No | - | Lọc role: volunteer, staff, manager, admin | UC26 |
| `sort` | String | No | `created_at:desc` | Sắp xếp | UC26 |
| `is_active` | Boolean | No | - | Lọc active/inactive | **UC30 (NEW)** |
| `from_date` | Date (YYYY-MM-DD) | No | - | Ngày tạo từ (inclusive) | **UC30 (NEW)** |
| `to_date` | Date (YYYY-MM-DD) | No | - | Ngày tạo đến (inclusive) | **UC30 (NEW)** |

### Validation Rules (UC30 only)

| Field | Rule | Error Code | HTTP Status |
|-------|------|------------|-------------|
| `is_active` | Phải là boolean (`true`/`false`) | `INVALID_IS_ACTIVE` | 400 |
| `from_date` | Format YYYY-MM-DD | `INVALID_DATE_FORMAT` | 400 |
| `to_date` | Format YYYY-MM-DD | `INVALID_DATE_FORMAT` | 400 |
| `from_date` + `to_date` | from_date <= to_date | `INVALID_DATE_RANGE` | 400 |

### Filter Logic

Tất cả filter params kết hợp bằng AND logic:

```text
WHERE (search match) AND (role = X) AND (is_active = Y) AND (created_at >= from_date) AND (created_at <= to_date)
```

### Date Range Inclusive

- `from_date`: Bắt đầu từ 00:00:00.000 của ngày đó
- `to_date`: Kết thúc lúc 23:59:59.999 của ngày đó

---

## 2. API Response

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

### Error Responses (New for UC30)

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_DATE_FORMAT` | Date không đúng format YYYY-MM-DD |
| 400 | `INVALID_DATE_RANGE` | from_date > to_date |
| 400 | `INVALID_IS_ACTIVE` | is_active không phải boolean |

### 400 — Date range invalid

```json
{
  "success": false,
  "message": "from_date must be before or equal to to_date",
  "code": "INVALID_DATE_RANGE",
  "details": null
}
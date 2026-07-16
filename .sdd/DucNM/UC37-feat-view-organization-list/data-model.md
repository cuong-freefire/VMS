# Data Model: View Organization List (UC37)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-02

---

## 1. Entity: Organization

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|------------|
| `organization_id` | Integer (PK, auto-increment) | ID duy nhất của tổ chức | Primary key |
| `name` | String (varchar 255) | Tên tổ chức | NOT NULL, unique |
| `description` | String (text, nullable) | Mô tả về tổ chức | Optional |
| `address` | String (varchar 500, nullable) | Địa chỉ | Optional |
| `contact_phone` | String (varchar 20, nullable) | Số điện thoại liên hệ | Optional |
| `contact_email` | String (varchar 255, nullable) | Email liên hệ | Optional |
| `website` | String (varchar 500, nullable) | Website | Optional |
| `logo_url` | String (varchar 500, nullable) | URL logo | Optional |
| `is_active` | Boolean | Trạng thái hoạt động | Default true |
| `created_at` | DateTime | Ngày tạo | Auto |
| `updated_at` | DateTime | Ngày cập nhật | Auto |

### Validation Rules

| Field | Rule |
|-------|------|
| `name` | NOT NULL, tối thiểu 1 ký tự |

### State Transitions

```
Active (is_active: true) ←→ Inactive (is_active: false)
```

---

## 2. Role-Based Access Control

| Role | Organizations visible | Auth required | Purpose |
|------|---------------------|---------------|---------|
| Guest | Active only | No (optional auth) | UC11 Filter Event |
| Volunteer | Active only | Yes | UC11 Filter Event |
| Staff | Active only | Yes | Event creation reference |
| Manager | Active only | Yes | Report reference |
| Admin | All (active + inactive) | Yes | Full management |

---

## 3. Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Integer | No | 1 | Số trang |
| `limit` | Integer | No | 20 | Số items mỗi trang (max 100) |
| `search` | String | No | - | Tìm kiếm theo tên (case-insensitive) |

---

## 4. API Response Structure

### Success Response (200)

```json
{
  "success": true,
  "message": "Lấy danh sách tổ chức thành công",
  "data": {
    "organizations": [
      {
        "organization_id": 1,
        "name": "Hoa Phượng Đỏ",
        "description": "Tổ chức tình nguyện vì môi trường",
        "address": "Hà Nội",
        "contact_phone": "0123456789",
        "contact_email": "contact@hoaphuongdo.org",
        "website": "https://hoaphuongdo.org",
        "logo_url": null,
        "is_active": true,
        "created_at": "2026-01-15T08:30:00.000Z",
        "updated_at": "2026-06-28T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_PAGE` | Page không hợp lệ |
| 400 | `INVALID_LIMIT` | Limit không hợp lệ (> 100) |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |
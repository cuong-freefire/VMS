# Data Model: View Organization Detail (UC38)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-02

---

## 1. Entity: Organization (Detail)

### Full Fields (Staff/Manager/Admin)

| Field | Type | Description |
|-------|------|-------------|
| `organization_id` | Integer (PK) | ID duy nhất |
| `name` | String | Tên tổ chức |
| `description` | String (nullable) | Mô tả |
| `address` | String (nullable) | Địa chỉ |
| `contact_phone` | String (nullable) | Số điện thoại |
| `contact_email` | String (nullable) | Email liên hệ |
| `website` | String (nullable) | Website |
| `logo_url` | String (nullable) | URL logo |
| `is_active` | Boolean | Trạng thái |
| `created_at` | DateTime | Ngày tạo |
| `updated_at` | DateTime | Ngày cập nhật |

### Basic Fields (Volunteer/Guest — phục vụ UC09)

| Field | Type | Description |
|-------|------|-------------|
| `organization_id` | Integer (PK) | ID duy nhất |
| `name` | String | Tên tổ chức |
| `description` | String (nullable) | Mô tả |
| `logo_url` | String (nullable) | URL logo |
| `is_active` | Boolean | Trạng thái |

**✋ KHÔNG bao gồm**: address, contact_phone, contact_email, website (dữ liệu quản trị)

### Entity: Event (tóm tắt trong chi tiết tổ chức)

| Field | Type | Description |
|-------|------|-------------|
| `event_id` | Integer (PK) | ID sự kiện |
| `title` | String | Tên sự kiện |
| `status` | String | Trạng thái sự kiện |
| `start_date` | DateTime | Ngày bắt đầu |
| `created_at` | DateTime | Ngày tạo |

---

## 2. Role-Based Access Control

| Role | Detail level | Inactive visible? | Events included? |
|------|-------------|-------------------|------------------|
| Guest | Basic | No (404 for inactive) | No |
| Volunteer | Basic | No (404 for inactive) | No |
| Staff | Full | No (404 for inactive) | Yes (max 10) |
| Manager | Full | No (404 for inactive) | Yes (max 10) |
| Admin | Full | Yes | Yes (max 10) |

### Validation Rules

| Rule | Error Code | HTTP Status |
|------|------------|-------------|
| `:id` không phải số nguyên dương | `INVALID_ORGANIZATION_ID` | 400 |
| Organization ID không tồn tại | `ORGANIZATION_NOT_FOUND` | 404 |
| Manager/Staff truy cập org inactive | `ORGANIZATION_NOT_FOUND` | 404 (ẩn tồn tại) |

---

## 3. API Response Structure

### Full Response (Staff/Manager/Admin) — 200

```json
{
  "success": true,
  "message": "Lấy thông tin tổ chức thành công",
  "data": {
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
    "updated_at": "2026-06-28T10:00:00.000Z",
    "events": [
      {
        "event_id": 1,
        "title": "Dọn dẹp bãi biển",
        "status": "ONGOING",
        "start_date": "2026-07-10T08:00:00.000Z"
      }
    ]
  }
}
```

### Basic Response (Volunteer/Guest) — 200

```json
{
  "success": true,
  "message": "Lấy thông tin tổ chức thành công",
  "data": {
    "organization_id": 1,
    "name": "Hoa Phượng Đỏ",
    "description": "Tổ chức tình nguyện vì môi trường",
    "logo_url": null,
    "is_active": true
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_ORGANIZATION_ID` | ID không hợp lệ |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập (không ảnh hưởng Guest — optional auth) |
| 404 | `ORGANIZATION_NOT_FOUND` | ID không tồn tại hoặc không có quyền xem |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |
# Data Model: View Pending Event (UC67)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-04

---

## 1. Entity: Event

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|------------|
| `event_id` | Integer (PK, auto-increment) | ID duy nhất của sự kiện | Primary key |
| `title` | String (varchar 255) | Tên sự kiện | NOT NULL |
| `description` | String (text, nullable) | Mô tả sự kiện | Optional |
| `organization_id` | Integer (FK) | ID tổ chức chủ quản | Foreign key → Organization |
| `status` | Enum/String (varchar 50) | Trạng thái: PENDING, APPROVED, REJECTED, ONGOING, COMPLETED | NOT NULL, default PENDING |
| `created_at` | DateTime | Ngày tạo | Auto |
| `updated_at` | DateTime | Ngày cập nhật | Auto |

### Entity: Organization (reference)

| Field | Type | Description |
|-------|------|-------------|
| `organization_id` | Integer (PK) | ID tổ chức |
| `name` | String | Tên tổ chức |

### Relationships

```
Event N:1 → Organization (event.organization_id = organization.organization_id)
```

### Status Workflow

```
PENDING → [APPROVED | REJECTED] → ONGOING → COMPLETED
```

### Validation Rules

| Field | Rule | Error Code | HTTP Status |
|-------|------|------------|-------------|
| `page` | Phải là số nguyên dương | `INVALID_PAGE` | 400 |
| `limit` | Phải là số nguyên dương (1-100) | `INVALID_LIMIT` | 400 |
| `status` | Phải thuộc enum | `INVALID_STATUS` | 400 |

---

## 2. Role-Based Access Control

| Role | Can view PENDING? | Default view (no status) |
|------|-------------------|--------------------------|
| Guest | No (403) | APPROVED only |
| Volunteer | No (403) | APPROVED only |
| Staff | No (403) | APPROVED only |
| Manager | Yes | All (depend on filter) |
| Admin | Yes | All (depend on filter) |

---

## 3. Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Integer | No | 1 | Số trang |
| `limit` | Integer | No | 20 | Số items mỗi trang (max 100) |
| `status` | Enum | No | - | Lọc theo status: pending, approved, rejected, ongoing, completed |

---

## 4. API Response Structure

### Success Response (200) — Manager/Admin xem PENDING

```json
{
  "success": true,
  "message": "Lấy danh sách sự kiện thành công",
  "data": {
    "events": [
      {
        "event_id": 1,
        "title": "Dọn dẹp bãi biển",
        "organization": {
          "organization_id": 1,
          "name": "Hoa Phượng Đỏ"
        },
        "status": "PENDING",
        "created_at": "2026-07-01T08:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
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
| 400 | `INVALID_STATUS` | Status không hợp lệ |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập |
| 403 | `FORBIDDEN` | Không có quyền xem PENDING |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |
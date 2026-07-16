# Data Model: View Pending Event Detail (UC68)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-04

---

## 1. Entity: Event (Detail)

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|------------|
| `event_id` | Integer (PK, auto-increment) | ID duy nhất của sự kiện | Primary key |
| `title` | String (varchar 255) | Tên sự kiện | NOT NULL |
| `description` | String (text, nullable) | Mô tả sự kiện | Optional |
| `organization_id` | Integer (FK) | ID tổ chức chủ quản | Foreign key → Organization |
| `status` | String (varchar 50) | Trạng thái: PENDING, APPROVED, REJECTED, ONGOING, COMPLETED | NOT NULL |
| `created_by` | Integer (FK, nullable) | ID người tạo sự kiện | Foreign key → User |
| `created_at` | DateTime | Ngày tạo | Auto |
| `updated_at` | DateTime | Ngày cập nhật | Auto |

### Related Entities

| Entity | Fields returned | Description |
|--------|----------------|-------------|
| Organization | organization_id, name | Tổ chức chủ quản |
| User (creator) | user_id, full_name | Người tạo sự kiện |

### Relationships

```
Event N:1 → Organization (event.organization_id = organization.organization_id)
Event N:1 → User (event.created_by = user.user_id)
```

### Status Workflow

```
PENDING → [APPROVED | REJECTED] → ONGOING → COMPLETED
```

---

## 2. Role-Based Access Control

| Role | Can view PENDING event? | Can view APPROVED event? |
|------|------------------------|--------------------------|
| Guest | No (401) | Yes (UC09) |
| Volunteer | No (403) | Yes (UC09) |
| Staff | No (403) | Yes (UC09) |
| Manager | Yes | Yes |
| Admin | Yes | Yes |

---

## 3. API Response Structure

### Success Response (200) — Manager/Admin xem event PENDING

```json
{
  "success": true,
  "message": "Lấy thông tin sự kiện thành công",
  "data": {
    "event_id": 1,
    "title": "Dọn dẹp bãi biển",
    "description": "Chung tay dọn dẹp bãi biển",
    "organization": {
      "organization_id": 1,
      "name": "Hoa Phượng Đỏ"
    },
    "status": "PENDING",
    "created_by": {
      "user_id": 2,
      "full_name": "Nguyễn Văn B"
    },
    "created_at": "2026-07-01T08:30:00.000Z",
    "updated_at": "2026-07-01T08:30:00.000Z"
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_EVENT_ID` | ID không hợp lệ |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập |
| 403 | `FORBIDDEN` | Không có quyền xem event PENDING |
| 404 | `EVENT_NOT_FOUND` | Event ID không tồn tại |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |
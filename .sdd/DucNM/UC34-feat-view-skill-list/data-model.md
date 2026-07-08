# Data Model: View Skill List (UC34)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-02

---

## 1. Entity: Skill

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|------------|
| `skill_id` | Integer (PK, auto-increment) | ID duy nhất của skill | Primary key |
| `name` | String (varchar 255) | Tên kỹ năng (VD: "Giao tiếp", "Tiếng Anh") | NOT NULL, unique |
| `description` | String (text, nullable) | Mô tả chi tiết về kỹ năng | Optional |
| `is_active` | Boolean | Trạng thái hoạt động (true = active, false = inactive) | Default true |
| `created_at` | DateTime | Ngày tạo | Auto |
| `updated_at` | DateTime | Ngày cập nhật | Auto |

### Validation Rules

| Field | Rule | Description |
|-------|------|-------------|
| `name` | NOT NULL, tối thiểu 1 ký tự | Tên kỹ năng không được để trống |

### State Transitions

```
Active (is_active: true) ←→ Inactive (is_active: false)
```
- Soft delete: Chuyển `is_active` từ `true` → `false`
- Restore: Chuyển `is_active` từ `false` → `true`

---

## 2. Role-Based Access Control

| Role | Skills visible | Auth required | Purpose |
|------|---------------|---------------|---------|
| Guest | Active only (is_active = true) | No (public, optional auth) | UC11 Filter Event |
| Volunteer | Active only (is_active = true) | Yes | UC11 + UC20 Edit Volunteer Skills |
| Staff | Active only (is_active = true) | Yes | Event reference |
| Manager | All (active + inactive) | Yes | Full management |
| Admin | All (active + inactive) | Yes | Full management |

---

## 3. API Response Structure

### Success Response (200)

```json
{
  "success": true,
  "message": "Lấy danh sách kỹ năng thành công",
  "data": {
    "skills": [
      {
        "skill_id": 1,
        "name": "Giao tiếp",
        "description": "Kỹ năng giao tiếp hiệu quả",
        "is_active": true
      },
      {
        "skill_id": 2,
        "name": "Tiếng Anh",
        "description": "Kỹ năng sử dụng tiếng Anh",
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
  "message": "Không có kỹ năng nào",
  "data": {
    "skills": []
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |

*Không có 401/403 cho Guest/Volunteer/Staff vì endpoint hỗ trợ optional auth.*
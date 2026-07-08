# Data Model: Volunteer Statistics (UC56)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-08

---

## 1. Statistics Data (Aggregate)

### Response Structure

```json
{
  "new_volunteers_by_month": [
    { "month": "2026-01", "count": 15 },
    { "month": "2026-02", "count": 22 }
  ],
  "total_active_volunteers": 350,
  "participation_rate": 68.5,
  "top_5_volunteers_by_events": [
    {
      "user_id": 1,
      "full_name": "Nguyễn Văn A",
      "events_attended": 12
    },
    {
      "user_id": 2,
      "full_name": "Trần Thị B",
      "events_attended": 10
    }
  ]
}
```

### Source Entities

| Entity | Table | Fields used |
|--------|-------|-------------|
| User | users | user_id, full_name, role, is_active, created_at |
| Attendance | attendances | attendance_id, user_id, event_id |
| Event | events | event_id, organization_id |

### Metrics Calculation

| Metric | Calculation |
|--------|-------------|
| `new_volunteers_by_month` | User.created_at in year, role=VOLUNTEER, group by month |
| `total_active_volunteers` | User.count where role=VOLUNTEER, is_active=true |
| `participation_rate` | (distinct volunteers with attendance / total active) × 100 |
| `top_5_volunteers_by_events` | Attendance.groupBy user_id, count, order desc, take 5 |

---

## 2. Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `year` | Integer | No | Năm hiện tại | Năm cần thống kê (VD: 2026) |

---

## 3. Role-Based Access

| Role | Scope |
|------|-------|
| Admin | All volunteers system-wide |
| Manager | Volunteers who attended events belonging to own organization only |
| Staff | 403 Forbidden |
| Volunteer | 403 Forbidden |
| Guest | 401 Unauthorized |

---

## 4. API Response Structure

### Success Response (200)

```json
{
  "success": true,
  "message": "Lấy thống kê tình nguyện viên thành công",
  "data": {
    "new_volunteers_by_month": [
      { "month": "2026-01", "count": 15 },
      { "month": "2026-02", "count": 22 },
      { "month": "2026-03", "count": 18 }
    ],
    "total_active_volunteers": 350,
    "participation_rate": 68.5,
    "top_5_volunteers_by_events": [
      { "user_id": 1, "full_name": "Nguyễn Văn A", "events_attended": 12 },
      { "user_id": 2, "full_name": "Trần Thị B", "events_attended": 10 },
      { "user_id": 3, "full_name": "Lê Văn C", "events_attended": 8 },
      { "user_id": 4, "full_name": "Phạm Thị D", "events_attended": 6 },
      { "user_id": 5, "full_name": "Hoàng Văn E", "events_attended": 5 }
    ]
  }
}
```

### Empty Data Response

```json
{
  "success": true,
  "message": "Chưa có dữ liệu thống kê",
  "data": {
    "new_volunteers_by_month": [],
    "total_active_volunteers": 0,
    "participation_rate": 0,
    "top_5_volunteers_by_events": []
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Chưa đăng nhập |
| 403 | `FORBIDDEN` | Không phải Admin/Manager |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |
# Data Model: View Dashboard (UC54)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-06

---

## 1. Dashboard Data (Aggregate — không phải entity vật lý)

Dashboard metrics là aggregate data từ 5 entities: Event, User, Application, Donation, Attendance.

### KPI Metrics Structure

```json
{
  "total_events": {
    "total": 150,
    "by_status": {
      "PENDING": 10,
      "APPROVED": 80,
      "REJECTED": 5,
      "ONGOING": 30,
      "COMPLETED": 25
    }
  },
  "total_users": {
    "total": 500,
    "by_role": {
      "VOLUNTEER": 400,
      "STAFF": 50,
      "MANAGER": 30,
      "ADMIN": 20
    }
  },
  "total_applications": {
    "total": 1200,
    "by_status": {
      "PENDING": 200,
      "APPROVED": 800,
      "REJECTED": 200
    }
  },
  "total_donations_current_month": {
    "total_amount": 50000000,
    "currency": "VND",
    "month": "2026-07"
  },
  "avg_attendance_rate": 85.5
}
```

### Chart Data Structure

```json
{
  "events_by_month": [
    { "month": "2025-08", "count": 10 },
    { "month": "2025-09", "count": 15 },
    ... // 12 months
  ],
  "new_users_by_month": [
    { "month": "2025-08", "count": 30 },
    { "month": "2025-09", "count": 45 },
    ... // 12 months
  ],
  "application_distribution": [
    { "status": "PENDING", "count": 200 },
    { "status": "APPROVED", "count": 800 },
    { "status": "REJECTED", "count": 200 }
  ]
}
```

### Source Entities

| Entity | Table | Fields used |
|--------|-------|-------------|
| Event | events | event_id, status, created_at |
| User | users | user_id, role_id, created_at |
| Application | volunteer_applications | application_id, status, created_at |
| Donation | donations | donation_id, amount, created_at |
| Attendance | attendances | attendance_id, application_id |

---

## 2. Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `force` | Boolean | No | false | Bỏ qua cache, query từ database |

---

## 3. API Response Structure

### Success Response (200)

```json
{
  "success": true,
  "message": "Lấy dữ liệu dashboard thành công",
  "data": {
    "kpi": {
      "total_events": { "total": 150, "by_status": { "PENDING": 10, "APPROVED": 80, "REJECTED": 5, "ONGOING": 30, "COMPLETED": 25 } },
      "total_users": { "total": 500, "by_role": { "VOLUNTEER": 400, "STAFF": 50, "MANAGER": 30, "ADMIN": 20 } },
      "total_applications": { "total": 1200, "by_status": { "PENDING": 200, "APPROVED": 800, "REJECTED": 200 } },
      "total_donations_current_month": { "total_amount": 50000000, "currency": "VND", "month": "2026-07" },
      "avg_attendance_rate": 85.5
    },
    "charts": {
      "events_by_month": [
        { "month": "2025-08", "count": 10 },
        { "month": "2025-09", "count": 15 }
      ],
      "new_users_by_month": [
        { "month": "2025-08", "count": 30 },
        { "month": "2025-09", "count": 45 }
      ],
      "application_distribution": [
        { "status": "PENDING", "count": 200 },
        { "status": "APPROVED", "count": 800 },
        { "status": "REJECTED", "count": 200 }
      ]
    }
  }
}
```

### Empty Data Response

```json
{
  "success": true,
  "message": "Chưa có dữ liệu",
  "data": {
    "kpi": {
      "total_events": { "total": 0, "by_status": {} },
      "total_users": { "total": 0, "by_role": {} },
      "total_applications": { "total": 0, "by_status": {} },
      "total_donations_current_month": { "total_amount": 0, "currency": "VND", "month": "2026-07" },
      "avg_attendance_rate": 0
    },
    "charts": {
      "events_by_month": [],
      "new_users_by_month": [],
      "application_distribution": []
    }
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Chưa đăng nhập |
| 403 | `FORBIDDEN` | Không phải Admin/Manager |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |
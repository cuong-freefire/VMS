# Data Model: Event Statistics (UC55)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-08

---

## 1. Statistics Data (Aggregate)

### Response Structure

```json
{
  "events_by_month": [
    { "month": "2026-01", "count": 5 },
    { "month": "2026-02", "count": 8 },
    ...
  ],
  "completion_rate": 65.5,
  "top_5_events": [
    {
      "event_id": 1,
      "title": "Dọn dẹp bãi biển",
      "approved_applications": 45
    },
    {
      "event_id": 2,
      "title": "Trồng cây xanh",
      "approved_applications": 38
    }
  ]
}
```

### Source Entities

| Entity | Table | Fields used |
|--------|-------|-------------|
| Event | events | event_id, title, status, created_at, organization_id |
| Application | volunteer_applications | application_id, event_id, status |

### Metrics Calculation

| Metric | Calculation |
|--------|-------------|
| `events_by_month` | Event.created_at trong khoảng thời gian, group theo tháng |
| `completion_rate` | (Event.status = 'COMPLETED' / Total events) × 100 |
| `top_5_events` | Application.status = 'APPROVED', groupBy event_id, count, top 5 |

---

## 2. Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `year` | Integer | No | Năm hiện tại | Năm cần thống kê (12 tháng) |
| `start_date` | Date | No | - | Ngày bắt đầu (YYYY-MM-DD) |
| `end_date` | Date | No | - | Ngày kết thúc (YYYY-MM-DD) |

**Note**: Nếu dùng `start_date`/`end_date` thì không dùng `year`. Nếu không có param nào, mặc định là năm hiện tại.

### Validation Rules

| Rule | Error Code | HTTP Status |
|------|------------|-------------|
| `start_date > end_date` | `INVALID_DATE_RANGE` | 400 |
| Date format không đúng YYYY-MM-DD | `INVALID_DATE_FORMAT` | 400 |

---

## 3. Role-Based Access

| Role | Scope |
|------|-------|
| Admin | All events (no organization filter) |
| Manager | Events where organization_id = currentUser.organization_id |
| Staff | 403 Forbidden |
| Volunteer | 403 Forbidden |
| Guest | 401 Unauthorized |

---

## 4. API Response Structure

### Success Response (200)

```json
{
  "success": true,
  "message": "Lấy thống kê sự kiện thành công",
  "data": {
    "events_by_month": [
      { "month": "2026-01", "count": 5 },
      { "month": "2026-02", "count": 8 },
      { "month": "2026-03", "count": 3 },
      { "month": "2026-04", "count": 10 },
      { "month": "2026-05", "count": 7 },
      { "month": "2026-06", "count": 12 }
    ],
    "completion_rate": 65.5,
    "top_5_events": [
      { "event_id": 1, "title": "Dọn dẹp bãi biển", "approved_applications": 45 },
      { "event_id": 2, "title": "Trồng cây xanh", "approved_applications": 38 },
      { "event_id": 3, "title": "Dạy học tình nguyện", "approved_applications": 30 },
      { "event_id": 4, "title": "Hiến máu nhân đạo", "approved_applications": 25 },
      { "event_id": 5, "title": "Xây nhà tình thương", "approved_applications": 20 }
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
    "events_by_month": [],
    "completion_rate": 0,
    "top_5_events": []
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_DATE_RANGE` | start_date > end_date |
| 400 | `INVALID_DATE_FORMAT` | Date không đúng format YYYY-MM-DD |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập |
| 403 | `FORBIDDEN` | Không phải Admin/Manager |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi server |
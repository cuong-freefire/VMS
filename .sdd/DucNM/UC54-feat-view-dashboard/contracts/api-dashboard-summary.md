# API Contract: GET /api/v1/dashboard/summary

## Summary

Lấy dữ liệu dashboard tổng quan với KPI metrics và biểu đồ. Chỉ Admin và Manager mới có quyền truy cập.

## Endpoint

```
GET /api/v1/dashboard/summary
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: Only `ADMIN` and `MANAGER` roles

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `force` | Boolean | No | false | Bỏ qua cache, query từ database |

## Example Request

```http
GET /api/v1/dashboard/summary
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

### Force Refresh

```http
GET /api/v1/dashboard/summary?force=true
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

## Success Response (200)

```json
{
  "success": true,
  "message": "Lấy dữ liệu dashboard thành công",
  "data": {
    "kpi": {
      "total_events": {
        "total": 150,
        "by_status": { "PENDING": 10, "APPROVED": 80, "REJECTED": 5, "ONGOING": 30, "COMPLETED": 25 }
      },
      "total_users": {
        "total": 500,
        "by_role": { "VOLUNTEER": 400, "STAFF": 50, "MANAGER": 30, "ADMIN": 20 }
      },
      "total_applications": {
        "total": 1200,
        "by_status": { "PENDING": 200, "APPROVED": 800, "REJECTED": 200 }
      },
      "total_donations_current_month": {
        "total_amount": 50000000,
        "currency": "VND",
        "month": "2026-07"
      },
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

## Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Vui lòng đăng nhập.",
  "code": "UNAUTHORIZED",
  "details": null
}
```

### 403 Forbidden — Not Admin/Manager

```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập tài nguyên này",
  "code": "FORBIDDEN",
  "details": null
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Có lỗi xảy ra trong quá trình xử lý",
  "code": "INTERNAL_SERVER_ERROR",
  "details": null
}
```

## Swagger JSDoc Template

```javascript
/**
 * @swagger
 * /api/v1/dashboard/summary:
 *   get:
 *     summary: Lấy dữ liệu dashboard tổng quan (Admin/Manager only)
 *     description: |
 *       Trả về KPI metrics và dữ liệu biểu đồ cho Dashboard.
 *       Chỉ Admin và Manager mới có quyền truy cập.
 *       Dữ liệu được cache 5 phút (Redis). Dùng ?force=true để bỏ qua cache.
 *       Cả Admin và Manager đều thấy dữ liệu toàn hệ thống.
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *         description: Bỏ qua cache, query từ database
 *     responses:
 *       200:
 *         description: Thành công, trả về KPI + chart data
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       500:
 *         description: Lỗi server
 */
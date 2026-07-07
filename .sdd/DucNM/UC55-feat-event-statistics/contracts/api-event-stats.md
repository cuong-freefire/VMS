# API Contract: GET /api/v1/dashboard/event-stats

## Summary

Lấy thống kê chi tiết về sự kiện — số lượng theo tháng, tỷ lệ hoàn thành, top sự kiện phổ biến. Chỉ Admin và Manager mới có quyền truy cập.

## Endpoint

```
GET /api/v1/dashboard/event-stats
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: Only `ADMIN` and `MANAGER` roles

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `year` | Integer | No | Năm hiện tại | Năm cần thống kê (VD: 2026) |
| `start_date` | Date | No | - | Ngày bắt đầu (YYYY-MM-DD) |
| `end_date` | Date | No | - | Ngày kết thúc (YYYY-MM-DD) |

## Role-Based Behavior

| Role | Scope |
|------|-------|
| Admin | All events system-wide |
| Manager | Events belonging to own organization only |

## Example Requests

### By year

```http
GET /api/v1/dashboard/event-stats?year=2026
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

### Custom date range

```http
GET /api/v1/dashboard/event-stats?start_date=2026-01-01&end_date=2026-06-30
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

## Success Response (200)

```json
{
  "success": true,
  "message": "Lấy thống kê sự kiện thành công",
  "data": {
    "events_by_month": [
      { "month": "2026-01", "count": 5 },
      { "month": "2026-02", "count": 8 },
      { "month": "2026-03", "count": 3 }
    ],
    "completion_rate": 65.5,
    "top_5_events": [
      { "event_id": 1, "title": "Dọn dẹp bãi biển", "approved_applications": 45 },
      { "event_id": 2, "title": "Trồng cây xanh", "approved_applications": 38 }
    ]
  }
}
```

## Error Responses

### 400 Bad Request — Invalid date range

```json
{
  "success": false,
  "message": "start_date must be before or equal to end_date",
  "code": "INVALID_DATE_RANGE",
  "details": null
}
```

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
 * /api/v1/dashboard/event-stats:
 *   get:
 *     summary: Lấy thống kê sự kiện (Admin/Manager only)
 *     description: |
 *       Trả về thống kê sự kiện: số lượng theo tháng, tỷ lệ hoàn thành, top 5 sự kiện.
 *       Chỉ Admin và Manager mới có quyền truy cập.
 *       Admin thấy toàn hệ thống, Manager chỉ thấy tổ chức của mình.
 *       Hỗ trợ filter theo year hoặc start_date/end_date.
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *         description: Năm cần thống kê (mặc định năm hiện tại)
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *         description: Ngày bắt đầu (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *         description: Ngày kết thúc (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation date
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       500:
 *         description: Lỗi server
 */
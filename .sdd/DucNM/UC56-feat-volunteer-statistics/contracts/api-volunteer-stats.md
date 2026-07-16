# API Contract: GET /api/v1/dashboard/volunteer-stats

## Summary

Lấy thống kê về tình nguyện viên — số lượng mới theo tháng, tổng active, tỷ lệ tham gia, top volunteer tích cực. Chỉ Admin và Manager mới có quyền truy cập.

## Endpoint

```
GET /api/v1/dashboard/volunteer-stats
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: Only `ADMIN` and `MANAGER` roles

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `year` | Integer | No | Năm hiện tại | Năm cần thống kê (VD: 2026) |

## Role-Based Behavior

| Role | Scope |
|------|-------|
| Admin | All volunteers system-wide |
| Manager | Volunteers who attended events in own organization only |

## Example Request

```http
GET /api/v1/dashboard/volunteer-stats?year=2026
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

## Success Response (200)

```json
{
  "success": true,
  "message": "Lấy thống kê tình nguyện viên thành công",
  "data": {
    "new_volunteers_by_month": [
      { "month": "2026-01", "count": 15 },
      { "month": "2026-02", "count": 22 }
    ],
    "total_active_volunteers": 350,
    "participation_rate": 68.5,
    "top_5_volunteers_by_events": [
      { "user_id": 1, "full_name": "Nguyễn Văn A", "events_attended": 12 },
      { "user_id": 2, "full_name": "Trần Thị B", "events_attended": 10 }
    ]
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
 * /api/v1/dashboard/volunteer-stats:
 *   get:
 *     summary: Lấy thống kê tình nguyện viên (Admin/Manager only)
 *     description: |
 *       Trả về thống kê volunteer: số mới theo tháng, tổng active, tỷ lệ tham gia, top 5.
 *       Chỉ Admin và Manager mới có quyền truy cập.
 *       Admin thấy toàn hệ thống, Manager chỉ thấy volunteer thuộc tổ chức mình.
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *         description: Năm cần thống kê (mặc định năm hiện tại)
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       500:
 *         description: Lỗi server
 */
# API Contract: GET /api/v1/events

## Summary

Lấy danh sách sự kiện với phân trang và lọc theo status. Hỗ trợ role-based visibility — chỉ Manager và Admin mới có quyền xem sự kiện PENDING.

## Endpoint

```
GET /api/v1/events
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: Only `MANAGER` and `ADMIN` roles can use `status=pending` filter

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Integer | No | 1 | Số trang |
| `limit` | Integer | No | 20 | Số items mỗi trang (max 100) |
| `status` | Enum | No | - | Lọc theo status: pending, approved, rejected, ongoing, completed |

## Role-Based Behavior

| Role | Can use `status=pending`? | Default (no status) |
|------|--------------------------|---------------------|
| Guest | No (403) | APPROVED only |
| Volunteer | No (403) | APPROVED only |
| Staff | No (403) | APPROVED only |
| Manager | Yes | All (depend on filter) |
| Admin | Yes | All (depend on filter) |

## Example Request

```http
GET /api/v1/events?status=pending&page=1&limit=20
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

## Success Response (200)

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

## Error Responses

### 400 Bad Request — Invalid status

```json
{
  "success": false,
  "message": "Status không hợp lệ",
  "code": "INVALID_STATUS",
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

### 403 Forbidden — Not Manager/Admin for PENDING

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
 * /api/v1/events:
 *   get:
 *     summary: Lấy danh sách sự kiện
 *     description: |
 *       Trả về danh sách sự kiện với phân trang và lọc theo status.
 *       Chỉ Manager và Admin mới có quyền xem sự kiện PENDING.
 *       Guest/Volunteer/Staff mặc định chỉ thấy sự kiện APPROVED.
 *     tags: [Event Approval]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, ongoing, completed]
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       500:
 *         description: Lỗi server
 */
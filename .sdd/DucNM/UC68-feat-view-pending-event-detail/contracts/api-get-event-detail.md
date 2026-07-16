# API Contract: GET /api/v1/events/:id

## Summary

Lấy thông tin chi tiết của một sự kiện. Tái sử dụng endpoint từ UC09 (View Event Detail). Hỗ trợ role-based visibility — chỉ Manager và Admin mới có quyền xem sự kiện PENDING.

## Endpoint

```
GET /api/v1/events/:id
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: Only `MANAGER` and `ADMIN` roles can view PENDING events

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Integer | Yes | ID của sự kiện |

## Role-Based Behavior

| Role | PENDING event | APPROVED/other event |
|------|---------------|---------------------|
| Guest | 401 Unauthorized | 200 OK (UC09) |
| Volunteer | 403 Forbidden | 200 OK (UC09) |
| Staff | 403 Forbidden | 200 OK (UC09) |
| Manager | 200 OK | 200 OK |
| Admin | 200 OK | 200 OK |

## Example Request

```http
GET /api/v1/events/1
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

## Success Response (200)

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

## Error Responses

### 400 Bad Request — Invalid ID

```json
{
  "success": false,
  "message": "Event ID không hợp lệ",
  "code": "INVALID_EVENT_ID",
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

### 404 Not Found

```json
{
  "success": false,
  "message": "Event not found.",
  "code": "EVENT_NOT_FOUND",
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
 * /api/v1/events/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết sự kiện
 *     description: |
 *       Trả về thông tin chi tiết của một sự kiện.
 *       Chỉ Manager và Admin mới có quyền xem sự kiện PENDING.
 *       Staff/Volunteer xem PENDING sẽ nhận 403.
 *     tags: [Event Approval]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sự kiện
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Event not found
 *       500:
 *         description: Lỗi server
 */
# API Contract: PATCH /api/v1/events/:id/approve

## Summary

Phê duyệt một sự kiện đang chờ duyệt (PENDING). Chỉ Manager và Admin mới có quyền truy cập.

## Endpoint

```
PATCH /api/v1/events/:id/approve
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: Only `MANAGER` and `ADMIN` roles

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Integer | Yes | ID của sự kiện cần phê duyệt |

## Request

Không có request body.

## Example Request

```http
PATCH /api/v1/events/1/approve
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

## Success Response (200 OK)

```json
{
  "success": true,
  "message": "Phê duyệt sự kiện thành công",
  "data": {
    "event_id": 1,
    "title": "Dọn dẹp bãi biển",
    "status": "published",
    "approved_by": 3,
    "approved_at": "2026-07-06T12:00:00.000Z",
    "created_at": "2026-07-01T08:30:00.000Z",
    "updated_at": "2026-07-06T12:00:00.000Z"
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

### 403 Forbidden — Not Manager/Admin

```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập tài nguyên này",
  "code": "FORBIDDEN",
  "details": null
}
```

### 404 Not Found — Event does not exist

```json
{
  "success": false,
  "message": "Event not found.",
  "code": "EVENT_NOT_FOUND",
  "details": null
}
```

### 409 Conflict — Event not in PENDING status

```json
{
  "success": false,
  "message": "Event is not in PENDING status.",
  "code": "INVALID_STATUS",
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
 * /api/v1/events/{id}/approve:
 *   patch:
 *     summary: Phê duyệt sự kiện (Manager/Admin only)
 *     description: |
 *       Phê duyệt một sự kiện đang chờ duyệt (PENDING).
 *       Chỉ Manager và Admin mới có quyền.
 *       Event phải ở trạng thái PENDING — nếu không trả về 409.
 *       Ghi nhận thông tin người phê duyệt (approved_by, approved_at).
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
 *         description: Phê duyệt thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Event not found
 *       409:
 *         description: Event không ở trạng thái PENDING
 *       500:
 *         description: Lỗi server
 */
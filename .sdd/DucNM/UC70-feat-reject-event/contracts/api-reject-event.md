# API Contract: PATCH /api/v1/events/:id/reject

## Summary

Từ chối một sự kiện đang chờ duyệt (PENDING) kèm lý do. Chỉ Manager và Admin mới có quyền truy cập.

## Endpoint

```
PATCH /api/v1/events/:id/reject
```

## Authentication

- **Required**: Yes (JWT HttpOnly Cookie)
- **Authorization**: Only `MANAGER` and `ADMIN` roles

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Integer | Yes | ID của sự kiện cần từ chối |

## Request Body

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `rejection_reason` | String | Yes | Min 10 ký tự | Lý do từ chối |

## Example Request

```http
PATCH /api/v1/events/1/reject
Content-Type: application/json
Cookie: token=eyJhbGciOiJIUzI1NiIs...

{
  "rejection_reason": "Thông tin sự kiện chưa đầy đủ, thiếu địa điểm tổ chức."
}
```

## Success Response (200 OK)

```json
{
  "success": true,
  "message": "Từ chối sự kiện thành công",
  "data": {
    "event_id": 1,
    "title": "Dọn dẹp bãi biển",
    "status": "REJECTED",
    "rejection_reason": "Thông tin sự kiện chưa đầy đủ, thiếu địa điểm tổ chức.",
    "rejected_by": {
      "user_id": 3,
      "full_name": "Manager Nguyễn"
    },
    "rejected_at": "2026-07-06T12:00:00.000Z",
    "created_at": "2026-07-01T08:30:00.000Z",
    "updated_at": "2026-07-06T12:00:00.000Z"
  }
}
```

## Error Responses

### 400 Bad Request — Validation Error

```json
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "rejection_reason", "message": "Rejection reason must be at least 10 characters" }
  ]
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
 * /api/v1/events/{id}/reject:
 *   patch:
 *     summary: Từ chối sự kiện (Manager/Admin only)
 *     description: |
 *       Từ chối một sự kiện đang chờ duyệt (PENDING) kèm lý do.
 *       Chỉ Manager và Admin mới có quyền.
 *       Event phải ở trạng thái PENDING — nếu không trả về 409.
 *       Lý do từ chối bắt buộc, tối thiểu 10 ký tự.
 *       Ghi nhận rejection_reason, rejected_by, rejected_at.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rejection_reason
 *             properties:
 *               rejection_reason:
 *                 type: string
 *                 minLength: 10
 *                 description: Lý do từ chối
 *           example:
 *             rejection_reason: "Thông tin sự kiện chưa đầy đủ, thiếu địa điểm tổ chức."
 *     responses:
 *       200:
 *         description: Từ chối thành công
 *       400:
 *         description: Thiếu lý do từ chối hoặc quá ngắn
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
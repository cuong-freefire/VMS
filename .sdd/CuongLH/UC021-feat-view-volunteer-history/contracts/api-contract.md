# Hợp Đồng API: Xem Lịch Sử Tình Nguyện (UC21)

**Endpoint**: `GET /api/v1/user/me/history`

---

## 1. Thông Tin Chung

| Thuộc Tính | Giá Trị |
|-----------|--------|
| Method | GET |
| Path | `/api/v1/user/me/history` |
| Auth | JWT HttpOnly Cookie (authMiddleware) |
| Role | VOLUNTEER (tất cả authenticated role có thể gọi, nhưng chỉ Volunteer có dữ liệu) |
| Content-Type | `application/json` |

---

## 2. Query Parameters

| Param | Kiểu | Required | Mặc Định | Mô Tả | Validation |
|-------|------|----------|---------|-------|-----------|
| `page` | integer | No | 1 | Số trang | ≥ 1 |
| `limit` | integer | No | 10 | Bản ghi / trang | 1–50 |
| `status` | string | No | — | Lọc trạng thái | PENDING / APPROVED / REJECTED / CANCELLED |
| `year` | string | No | — | Lọc năm tham gia | Regex `^\d{4}$`, lọc theo `event.start_date` |
| `search` | string | No | — | Tìm kiếm client-side | Tên sự kiện hoặc địa điểm |

---

## 3. Responses

### 3.1 200 OK — Thành Công

```json
{
  "success": true,
  "message": "Lấy lịch sử tình nguyện thành công",
  "data": {
    "summary": {
      "total": 5
    },
    "history": [
      {
        "id": 1,
        "status": "APPROVED",
        "applied_at": "2025-06-15T08:00:00.000Z",
        "event": {
          "id": 10,
          "title": "Dọn rác bãi biển",
          "start_date": "2025-07-01T08:00:00.000Z",
          "location": "Bãi biển Đà Nẵng"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "total_pages": 1
    }
  }
}
```

### 3.2 200 OK — Không Có Dữ Liệu

```json
{
  "success": true,
  "message": "Lấy lịch sử tình nguyện thành công",
  "data": {
    "summary": { "total": 0 },
    "history": [],
    "pagination": { "page": 1, "limit": 10, "total": 0, "total_pages": 0 }
  }
}
```

### 3.3 400 Bad Request — Validation Error

```json
{
  "success": false,
  "message": "page: page phải >= 1",
  "code": "VALIDATION_ERROR"
}
```

### 3.4 401 Unauthorized — Chưa Đăng Nhập

```json
{
  "success": false,
  "message": "Vui lòng đăng nhập.",
  "code": "UNAUTHORIZED"
}
```

### 3.5 403 Forbidden — Tài Khoản Bị Vô Hiệu Hóa

```json
{
  "success": false,
  "message": "Tài khoản đã bị vô hiệu hóa",
  "code": "ACCOUNT_DISABLED"
}
```

### 3.6 404 Not Found — User Không Tồn Tại

```json
{
  "success": false,
  "message": "Tài khoản không tồn tại",
  "code": "USER_NOT_FOUND"
}
```

### 3.7 500 Internal Server Error

```json
{
  "success": false,
  "message": "Có lỗi xảy ra trong quá trình xử lý",
  "code": "INTERNAL_SERVER_ERROR"
}
```

---

## 4. Ví Dụ Gọi API

### curl

```bash
curl -b "token=***********************" \
     "http://localhost:5000/api/v1/user/me/history?page=1&limit=10&status=APPROVED&year=2025&search=Dọn"
```

### Axios (Frontend)

```javascript
const { data } = await axiosApi.get('/api/v1/user/me/history', {
  params: { page: 1, limit: 10, status: 'APPROVED' }
});
```

---

## 5. Security Notes

- **userId** LUÔN lấy từ JWT token (`req.user.user_id`), KHÔNG từ query params hay body
- **Read-only** — endpoint không thay đổi dữ liệu
- **Self-view only** — mỗi user chỉ xem được lịch sử của chính mình

# API Contract: PATCH /api/v1/user/me

**Method**: PATCH
**URL**: /api/v1/user/me
**Content-Type**: application/json HOẶC multipart/form-data
**Authentication**: Required (JWT in httpOnly cookie)

## Request Body (Cho phép gửi thiếu field)

| Field | Type | Required | Note |
|-------|------|----------|------|
| full_name | String | No | Họ tên |
| phone_number | String | No | Số điện thoại |
| avatar | File | No | Chỉ chấp nhận jpeg, jpg, png. Max 5MB |

## Responses

### 200 OK - Cập nhật thành công

```json
{
  "success": true,
  "message": "Cập nhật hồ sơ thành công",
  "data": {
    "full_name": "Nguyễn Văn B",
    "email": "user@example.com",
    "phone_number": "0987654321",
    "avatar_url": "https://res.cloudinary.com/..."
  }
}
```

### 400 Bad Request - Lỗi Validation

```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "code": "VALIDATION_ERROR",
  "details": "Dung lượng file vượt quá giới hạn 5MB"
}
```

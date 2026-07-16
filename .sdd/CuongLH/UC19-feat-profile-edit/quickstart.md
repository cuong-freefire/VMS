# Quick Start: Cập nhật hồ sơ (UC19)

## Môi trường yêu cầu

- Cấu hình biến môi trường Cloudinary trong `.env`:
  - `CLOUDINARY_NAME`
  - `CLOUDINARY_KEY`
  - `CLOUDINARY_SECRET`

## API Endpoint

`PATCH /api/v1/user/me`

## Ví dụ sử dụng bằng CURL (Cập nhật họ tên và số điện thoại)

```bash
curl -X PATCH http://localhost:5000/api/v1/user/me \
  -H "Cookie: token=eyJhb..." \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Nguyễn Văn B", "phone_number": "0987654321"}'
```

## Ví dụ sử dụng với Form-Data (Cập nhật ảnh)

Gửi request qua Postman:

- Method: PATCH
- URL: <http://localhost:5000/api/v1/user/me>
- Body: form-data
  - `full_name`: Nguyễn Văn B
  - `phone_number`: 0987654321
  - `avatar`: (File ảnh đính kèm)

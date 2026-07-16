# Data Model: Cập nhật hồ sơ cơ bản (UC19)

## Database Schema: `users`

API này chỉ thao tác trên bảng `users`.

| Column | Type | API Mapping | Business Rules |
|--------|------|-------------|----------------|
| id | INT | - | FK Lookup (chỉ lấy từ JWT token) |
| full_name | VARCHAR(255) | `full_name` | Cập nhật nếu có trong payload |
| phone | VARCHAR(20) | `phone_number` | Cập nhật nếu có trong payload |
| avatar_url | VARCHAR(500) | `avatar_url` | Lưu URL Cloudinary nếu có file upload |

**Lưu ý quan trọng**:
- `phone_number` từ request sẽ được map sang `phone` trong database.
- Bất kỳ field nào khác (như `email`, `password_hash`, `role_id`) gửi lên đều bị filter và bỏ qua.

## Data Flow

1. Nhận Multipart/form-data từ Client.
2. `upload.middleware.js` (Multer) parse request, kiểm tra định dạng (jpg, png) và dung lượng (<5MB).
3. Extract `user_id` từ JWT.
4. Validate các field text (full_name, phone_number) bằng Zod.
5. Nếu có file upload:
   - Truy xuất `avatar_url` cũ từ DB.
   - Xóa file cũ trên Cloudinary (nếu có) thông qua public_id.
   - Upload file mới lên Cloudinary.
6. Update DB: `prisma.user.update()` với các field thay đổi (PATCH behavior).
7. Trả về thông tin profile đã cập nhật.
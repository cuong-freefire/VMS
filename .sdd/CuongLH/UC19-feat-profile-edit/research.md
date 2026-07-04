# Research: Cập nhật hồ sơ cơ bản (UC19)

## 1. Xử lý File Upload (Multipart Form Data)

Sử dụng **Multer** để parse multipart/form-data.

- Hỗ trợ lưu trữ tạm thời trên bộ nhớ (MemoryStorage) để đẩy trực tiếp lên Cloudinary mà không cần lưu xuống đĩa cứng (DiskStorage), giúp tiết kiệm tài nguyên I/O cho server.
- Cấu hình file filter: `mimetype === 'image/jpeg' || mimetype === 'image/png' || mimetype === 'image/jpg'`.
- Cấu hình dung lượng: `limits: { fileSize: 5 * 1024 * 1024 }`.

## 2. Tích hợp Cloudinary

Sử dụng `cloudinary.uploader.upload_stream` để upload từ buffer của Multer.

- Extract `public_id` từ URL cũ để gọi `cloudinary.uploader.destroy(public_id)` khi cập nhật ảnh mới.
- Quản lý thất bại: Nếu Cloudinary trả về lỗi trong quá trình upload, controller sẽ không update DB và trả về lỗi 500 (Rollback).

## 3. Discrepancies (Mâu thuẫn giữa Spec và Context)

- **Resolved**: Không có mâu thuẫn lớn. `context.md` và `spec.md` thống nhất về Partial Update (PATCH), Server-side upload, Max file size 5MB.
- **Mapping**: API request gọi số điện thoại là `phone_number`, nhưng theo `DATABASE.md` bảng `users` lưu là `phone`. Service layer cần chịu trách nhiệm map tên biến này.

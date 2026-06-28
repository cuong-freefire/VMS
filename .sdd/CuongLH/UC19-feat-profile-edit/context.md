# CONTEXT.md — Feature: Profile Management - Edit Profile (UC19)

# Người viết: CuongLH | Ngày: 25/06/2026

## 1. PROBLEM STATEMENT

Sau một thời gian sử dụng hệ thống VMS, tình nguyện viên có nhu cầu cập nhật lại thông tin cá nhân cơ bản (họ tên, số điện thoại, ảnh đại diện) để đảm bảo ban tổ chức có thể liên lạc khi tham gia sự kiện. Hệ thống cần một API an toàn để xử lý việc cập nhật thông tin văn bản kết hợp với xử lý file ảnh (avatar).

## 2. DOMAIN KNOWLEDGE

- **Media Storage (Lưu trữ ảnh đám mây):** Hệ thống không lưu trữ file ảnh trực tiếp trên server backend hoặc database. Thay vào đó, ảnh đại diện sẽ được tải lên dịch vụ Cloudinary, và Database chỉ lưu trữ chuỗi URL của ảnh.
- **Identity Separation (Tách biệt định danh):** Luồng cập nhật hồ sơ này độc lập hoàn toàn với thông tin đăng nhập. Các thông tin định danh cốt lõi như `email` hoặc `password` không được phép thay đổi qua API này (để tránh rủi ro bảo mật và bypass luồng đổi mật khẩu/email riêng).

## 3. STAKEHOLDERS

- **User (Tất cả Role):** Người dùng có nhu cầu cập nhật thông tin hiển thị cá nhân.
- **System / Security:** Cần đảm bảo hệ thống không bị tấn công IDOR (sửa hồ sơ người khác) và bảo vệ máy chủ khỏi các file mã độc hoặc file ảnh có dung lượng quá lớn.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)

- **Bảo mật truy cập (Auth Middleware & Anti-IDOR):** Bắt buộc phải có JWT token hợp lệ. THE system SHALL lấy định danh `user_id` từ payload của token. **TUYỆT ĐỐI KHÔNG** nhận `user_id` từ body hay params để thực hiện update.
- **Giới hạn trường cập nhật:** Backend CHỈ chấp nhận cập nhật 3 trường: `full_name`, `phone_number`, và `avatar_url`. Bỏ qua mọi trường khác nếu client cố tình gửi lên.
- **Validation File:** Nếu có upload ảnh, file bắt buộc phải được kiểm tra định dạng (chỉ hỗ trợ jpg, jpeg, png) và dung lượng (ví dụ: tối đa 5MB) trước khi xử lý.

## 5. ASSUMPTIONS (Giả định)

- Giả định phần cập nhật Kỹ năng (Skills) đã được tách thành một Use Case riêng biệt (UC20).
- Giả định giao diện Frontend có form cho phép người dùng sửa tên, số điện thoại và chọn file ảnh từ máy tính.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Kiến trúc Upload Cloudinary:** Bạn muốn thiết kế luồng upload file theo cách nào?
   - *Cách 1 (Client-side upload):* Frontend tự gọi API lên Cloudinary, lấy được chuỗi URL, sau đó chỉ gửi JSON payload `{ full_name, phone_number, avatar_url }` xuống Backend. (Backend nhàn, API chạy cực nhanh).
   - *Cách 2 (Server-side upload):* Frontend gửi request dạng `multipart/form-data` chứa file ảnh xuống Backend. Backend nhận file, gọi API upload lên Cloudinary, lấy URL rồi mới lưu DB. (Backend gánh tải upload nhưng kiểm soát bảo mật file tốt hơn).
2. **Hành vi Cập nhật (PUT vs PATCH):** Khi người dùng gọi API, họ bắt buộc phải gửi ĐẦY ĐỦ các trường (kể cả trường không đổi), hay chỉ cần gửi những trường CÓ THAY ĐỔI (ví dụ chỉ đổi số điện thoại thì payload chỉ có mỗi `phone_number`)? *(Khuyến nghị: Dùng hành vi PATCH - chỉ gửi và cập nhật những trường có thay đổi để tối ưu payload).*

## 7. ANSWERS TO OPEN QUESTIONS

### Answer 1: Kiến trúc Upload và Xử lý ảnh (Resolved)

**Question:** Luồng upload file Cloudinary và xử lý ảnh cũ hoạt động ra sao?
**Answer:**

- **Confirmed:** Sử dụng **Cách 2 (Server-side upload)** kết hợp **Garbage Collection (Dọn rác)**. Frontend sẽ gửi dữ liệu dạng `multipart/form-data` chứa thông tin text và file ảnh xuống Backend. Backend chịu trách nhiệm gọi API Cloudinary để upload ảnh mới.
- **Business Impact & Rationale:** QUAN TRỌNG: Để tối ưu dung lượng lưu trữ, nếu người dùng cập nhật ảnh mới, Backend BẮT BUỘC phải trích xuất ID của ảnh đại diện cũ đang lưu trong Database và gọi API của Cloudinary để xóa (destroy) ảnh cũ đó TRƯỚC KHI lưu URL của ảnh mới vào Database.

### Answer 2: Hành vi Cập nhật (Resolved)

**Question:** Sử dụng PUT (cập nhật toàn bộ) hay PATCH (cập nhật từng phần)?
**Answer:**

- **Confirmed:** API sử dụng cơ chế **PATCH**.
- **Business Impact & Rationale:** Người dùng chỉ cần gửi lên những trường có thay đổi (ví dụ: chỉ gửi SĐT, hoặc chỉ gửi file ảnh). Backend sẽ chỉ cập nhật những trường được gửi lên, giữ nguyên các thông tin còn lại để tối ưu băng thông.

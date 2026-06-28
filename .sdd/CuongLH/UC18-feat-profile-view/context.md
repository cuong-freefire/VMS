# CONTEXT.md — Feature: Profile Management - View Profile (UC18)

# Người viết: CuongLH | Ngày: 25/06/2026

## 1. PROBLEM STATEMENT

Người dùng sau khi đăng nhập thành công vào hệ thống VMS cần một không gian cá nhân hóa để xem lại các thông tin định danh, thông tin liên lạc và các dữ liệu liên quan đến hoạt động tình nguyện của mình. Hệ thống cần cung cấp một API truy xuất dữ liệu hồ sơ cá nhân nhanh chóng, chính xác và tuân thủ nghiêm ngặt các nguyên tắc bảo vệ quyền riêng tư.

## 2. DOMAIN KNOWLEDGE

- **Data Privacy (Quyền riêng tư dữ liệu):** Nguyên tắc bảo mật yêu cầu hệ thống không bao giờ được phép trả về các trường dữ liệu nhạy cảm (như mật khẩu đã mã hóa, token) ra ngoài frontend.
- **Data Aggregation (Tổng hợp dữ liệu):** Hồ sơ của một tình nguyện viên không chỉ nằm ở bảng `users`, mà còn liên kết với bảng `skills` (kỹ năng) và các thống kê từ `applications` (đơn đăng ký sự kiện).
- **Self-Identity (Định danh tự thân):** Chức năng này dành cho người dùng tự xem hồ sơ của chính mình, khác với việc Admin đi xem hồ sơ của người khác (UC27 - View User Detail).

## 3. STAKEHOLDERS

- **User (Mọi Role, đặc biệt là Volunteer):** Những người có nhu cầu kiểm tra lại thông tin cá nhân của mình trên hệ thống.
- **System / Security:** Đảm bảo API không bị rò rỉ dữ liệu (Data Leakage) và chống lại lỗ hổng IDOR (truy cập trái phép hồ sơ người khác).

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)

- **Bảo mật truy cập (Auth Middleware):** Bắt buộc phải có JWT token hợp lệ để định danh người dùng. THE system SHALL lấy `user_id` trực tiếp từ token để truy vấn dữ liệu, **TUYỆT ĐỐI KHÔNG** nhận `user_id` từ URL params hay payload body đối với luồng tự xem hồ sơ này.
- **Data Sanitization (Làm sạch dữ liệu):** Bắt buộc phải loại bỏ các field `password`, `access_token`, và các thông tin bảo mật nội bộ khác khỏi object trả về.
- **Response Format:** Bắt buộc tuân thủ chuẩn trả về chung của dự án thông qua hàm tiện ích `response.util.js`.

## 5. ASSUMPTIONS (Giả định)

- Giả định hệ thống Database đã thiết lập các quan hệ (Foreign Keys) giữa bảng `users`, `user_skills`(bảng trung gian) và `skills` để có thể truy vấn kèm theo.
- Giả định tính năng này chỉ phục vụ mục đích ĐỌC (Read-only). Bất kỳ thao tác chỉnh sửa nào sẽ được tách riêng sang luồng UC19 (Edit Profile) và UC20 (Edit Volunteer Skills).

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Phạm vi dữ liệu trả về (Data Scope):** API View Profile này sẽ chỉ trả về thông tin cơ bản của User (tên, email, số điện thoại, avatar), hay cần phải `join` (kết nối) thêm để trả về cả **Danh sách kỹ năng (Skills)** trong cùng một lần gọi?
2. **Thống kê cơ bản (Statistics):** Trên màn hình Profile, bạn có muốn hiển thị kèm các con số thống kê nhanh (Ví dụ: Tổng số sự kiện đã tham gia, Tổng số giờ tình nguyện) không? *(Khuyến nghị: Nếu có, backend sẽ cần thực hiện thêm các query đếm (COUNT) từ bảng applications/attendance).*
3. **Tính Public của Profile:** API này thiết kế chỉ để "User tự xem mình" (Private Profile), hay bạn dự định dùng chung API này cho việc "User khác bấm vào xem Profile của mình" (Public Profile - cần che số điện thoại/email)?

## 7. ANSWERS TO OPEN QUESTIONS

### Answer 1 & 2: Phạm vi dữ liệu và Thống kê (Resolved)

**Question:** API trả về những dữ liệu gì? Có kèm Skills và Thống kê sự kiện không?
**Answer:**

- **Confirmed:** API BẮT BUỘC phải nối (join) và trả về thông tin cơ bản của User kèm theo **Danh sách Kỹ năng (Skills)** trong cùng một lần gọi.
- **Business Impact & Rationale:** Để tối ưu hiệu năng và tuân thủ đúng ranh giới Use Case trong tài liệu gốc, API này **KHÔNG** thực hiện tính toán thống kê lịch sử (số sự kiện, số giờ). Các số liệu thống kê phức tạp sẽ được xử lý tách biệt ở tính năng View Volunteer History (UC21).

### Answer 3: Tính Public của Profile (Resolved)

**Question:** Profile này là Private (tự xem) hay Public (người khác xem)?
**Answer:**

- **Confirmed:** Thiết kế API này CHỈ phục vụ **Private Profile** (User tự xem hồ sơ của chính mình).
- **Business Impact & Rationale:** Vì là Private Profile, dữ liệu trả về sẽ bao gồm các thông tin cá nhân (như số điện thoại, email gốc). Do đó, API bắt buộc phải dựa vào Auth Middleware (JWT Token) để xác định danh tính, chặn đứng rủi ro người khác truyền ID lạ vào để xem trộm thông tin.

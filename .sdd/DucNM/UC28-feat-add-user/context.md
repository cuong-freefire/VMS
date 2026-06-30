# CONTEXT.md — Add User (UC28)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-30

## 1. PROBLEM STATEMENT

Admin cần có khả năng tạo tài khoản mới cho người dùng trong hệ thống VMS. Việc này có thể xảy ra khi có nhân viên mới (Staff, Manager) gia nhập tổ chức, hoặc khi cần tạo tài khoản Admin bổ sung. Nếu không có chức năng này, Admin phải dùng database trực tiếp để thêm user — gây rủi ro bảo mật và không có audit log.

## 2. DOMAIN KNOWLEDGE

- **Account creation:** Admin tạo tài khoản với đầy đủ thông tin: họ tên, email, số điện thoại, role, mật khẩu (hoặc tạo mật khẩu tạm thời).
- **Email uniqueness:** Email là duy nhất trong hệ thống — không thể tạo hai user có cùng email.
- **Password policy:** Mật khẩu phải được hash bằng bcryptjs trước khi lưu.
- **Role assignment:** Admin có thể gán role (Volunteer, Staff, Manager, Admin) khi tạo tài khoản.
- **Soft-delete handling:** Nếu email đã tồn tại với user bị inactive, không thể tạo user mới với email đó — phải phản hồi lỗi rõ ràng.

## 3. STAKEHOLDERS

- **Admin:** Cần tạo tài khoản mới cho người dùng (Staff, Manager, hoặc Admin khác).
- **Người dùng mới:** Nhận tài khoản và có thể đăng nhập, đổi mật khẩu sau lần đầu.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền:** Chỉ Admin mới có quyền tạo user. Các role khác bị từ chối HTTP 403.
- **Email validation:** Email bắt buộc phải đúng format và duy nhất.
- **Password:** Mật khẩu phải có độ dài tối thiểu 8 ký tự, được hash bằng bcryptjs.
- **API format:** Endpoint bắt buộc là `POST /api/v1/users`.
- **Validation:** Validate dữ liệu đầu vào bằng Zod trước khi xử lý.
- **Swagger:** Bắt buộc có Swagger JSDoc đầy đủ cho endpoint này.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định bảng User và Role đã có trong schema.
- Giả định middleware xác thực JWT và phân quyền đã hoạt động từ module Auth (UC03).
- Giả định khi Admin tạo user, user đó sẽ nhận được email thông báo tài khoản (thuộc module Email Services — UC62).

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Mật khẩu:** Admin tự nhập mật khẩu cho user mới, hay hệ thống tự sinh mật khẩu tạm thời?
2. **Email thông báo:** Sau khi tạo user thành công, có gửi email thông báo cho user mới không?
3. **Trạng thái mặc định:** User mới tạo có is_active = true luôn hay cần xác thực email trước?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Admin nhập mật khẩu khi tạo user. Mật khẩu tối thiểu 8 ký tự.
- **A2:** Ở v1, chưa gửi email thông báo. Tính năng này sẽ được bổ sung khi tích hợp module Email Services (UC62).
- **A3:** User mới tạo có is_active = true. Sau này có thể tích hợp xác thực email để kích hoạt tài khoản.
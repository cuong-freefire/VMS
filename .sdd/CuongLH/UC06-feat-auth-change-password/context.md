# CONTEXT.md — Feature: Authentication Change Password (UC06)

# Người viết: CuongLH | Ngày: 25/05/2026

## 1. PROBLEM STATEMENT

Người dùng đã đăng nhập vào hệ thống VMS đôi khi cần chủ động thay đổi mật khẩu định kỳ hoặc khi nghi ngờ mật khẩu hiện tại bị lộ. Hệ thống cần cung cấp một luồng cho phép người dùng tự đổi mật khẩu an toàn, đảm bảo rằng chỉ người thực sự sở hữu tài khoản (nhớ mật khẩu cũ) mới có quyền thực hiện hành động này.

## 2. DOMAIN KNOWLEDGE

- **Authentication State:** Trạng thái xác thực. Người dùng phải đang trong phiên làm việc hợp lệ (có chứa JWT Token) mới được phép gọi API đổi mật khẩu.
- **Strong Password (Mật khẩu mạnh):** Chính sách bảo mật yêu cầu mật khẩu phải phức tạp (bao gồm độ dài tối thiểu, chữ hoa, chữ thường, số, ký tự đặc biệt) để chống lại tấn công dò mật khẩu (brute-force).
- **Session Revocation:** Cơ chế vô hiệu hóa các phiên đăng nhập (refresh tokens) trên các thiết bị khác sau khi mật khẩu bị thay đổi để đảm bảo an toàn tuyệt đối.

## 3. STAKEHOLDERS

- **User (Tất cả Role):** Người dùng hệ thống có nhu cầu thay đổi mật khẩu.
- **System / Admin:** Cần đảm bảo hệ thống tuân thủ các quy tắc bảo mật, không bị lỗi bypass xác thực và bảo vệ an toàn cho cơ sở dữ liệu.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)

- **Xác thực định danh (Auth Middleware):** Bắt buộc phải có JWT token hợp lệ để xác định `user_id` đang thực hiện đổi mật khẩu. TUYỆT ĐỐI KHÔNG nhận `user_id` từ body của request.
- **Xác minh quyền sở hữu:** Bắt buộc người dùng phải cung cấp đúng **mật khẩu cũ** (`oldPassword`). Hệ thống phải lấy mã hash mật khẩu hiện tại trong DB ra để so sánh trước khi cho phép cập nhật.
- **Kiểm tra đầu vào (Input Validation):** Bắt buộc phải sử dụng Zod schema để kiểm tra độ mạnh của mật khẩu mới (Regex) trước khi truyền xuống tầng Service.
- **Bảo mật Mật khẩu mới:** Mật khẩu mới bắt buộc được mã hóa một chiều bằng thư viện `bcryptjs` trước khi lưu vào cơ sở dữ liệu.

## 5. ASSUMPTIONS (Giả định)

- Giả định hệ thống chỉ có phương thức đăng nhập bằng mật khẩu truyền thống (Local Auth). Những tài khoản đăng nhập bằng Social (nếu có sau này) sẽ không có mật khẩu cũ để đổi theo luồng này.
- Giả định Frontend có form nhập liệu gồm 3 trường: Mật khẩu cũ, Mật khẩu mới, Xác nhận mật khẩu mới.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Thiết kế API Payload:** Backend có cần nhận và kiểm tra cả trường `confirmPassword` không, hay chỉ cần nhận `{ oldPassword, newPassword }` và để Frontend tự chịu trách nhiệm kiểm tra hai mật khẩu mới có khớp nhau trước khi gọi API? *(Khuyến nghị: Chỉ cần gửi `newPassword` xuống Backend để API payload được tối ưu).*
2. **Xử lý phiên đăng nhập (Session/Token):** Sau khi đổi mật khẩu thành công, hệ thống có bắt buộc người dùng phải đăng nhập lại không, hay vẫn giữ nguyên phiên làm việc hiện tại của thiết bị đang dùng?
3. **Đăng xuất thiết bị khác (Revoke Tokens):** Hệ thống có nên tự động xóa tất cả `refresh_tokens` của tài khoản này trong Database để ép các thiết bị khác phải đăng xuất ngay lập tức không?

## 7. ANSWERS TO OPEN QUESTIONS

### Answer 1: Thiết kế API Payload (Resolved)

**Question:** Backend có cần nhận và kiểm tra cả trường `confirmPassword` không?
**Answer:**

- **Confirmed:** BẮT BUỘC nhận và kiểm tra. API Payload sẽ bao gồm đầy đủ `{ oldPassword, newPassword, confirmPassword }`.
- **Business Impact & Rationale:** Backend sẽ đóng vai trò là chốt chặn cuối cùng, tự thực hiện kiểm tra `newPassword` và `confirmPassword` có khớp nhau hay không. Điều này đảm bảo tính toàn vẹn dữ liệu ngay cả khi validation ở Frontend bị vượt rào (bypass).

### Answer 2 & 3: Xử lý phiên đăng nhập và Đăng xuất thiết bị (Resolved)

**Question:** Xử lý phiên làm việc sau khi đổi pass và có vô hiệu hóa (revoke) refresh tokens không?
**Answer:**

- **Confirmed:** Vẫn GIỮ NGUYÊN phiên làm việc hiện tại và KHÔNG có cơ chế revoke token.
- **Business Impact & Rationale:** Hệ thống hiện tại được thiết kế không sử dụng/không quản lý `refresh_tokens`. Do đó, sau khi đổi mật khẩu thành công, người dùng tiếp tục sử dụng JWT `access_token` hiện tại để hoạt động mà không bị ép đăng xuất. Việc đăng xuất các thiết bị khác nằm ngoài phạm vi (Out of Scope) của luồng này.

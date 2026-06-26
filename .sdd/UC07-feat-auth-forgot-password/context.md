# CONTEXT.md — Feature: Authentication Forgot Password (UC07)

# Người viết: CuongLH | Ngày: 26/05/2026

## 1. PROBLEM STATEMENT

Người dùng thỉnh thoảng sẽ quên mật khẩu đăng nhập vào hệ thống VMS. Để giảm thiểu thời gian chờ đợi hỗ trợ từ ban quản trị và đảm bảo trải nghiệm người dùng liền mạch, hệ thống cần cung cấp một luồng (flow) cho phép người dùng tự khôi phục mật khẩu một cách tự động, nhanh chóng và bảo mật cao thông qua việc gửi mã xác minh đến email đã đăng ký.

## 2. DOMAIN KNOWLEDGE

- **OTP (One Time Password):** Mã 6 chữ số ngẫu nhiên dùng một lần, gửi qua email để xác minh quyền sở hữu tài khoản trước khi cho phép người dùng đặt lại mật khẩu mới.
- **User Enumeration (Dò quét tài khoản):** Rủi ro bảo mật khi hệ thống báo lỗi rõ ràng "Email không tồn tại", giúp hacker biết được email nào đã đăng ký tài khoản.
- **Rate Limiting & Lockout:** Các cơ chế bảo vệ hệ thống khỏi việc bị lạm dụng API gửi email (spam mail) và tấn công dò mã OTP (brute-force).

## 3. STAKEHOLDERS

- **User (Tất cả Role):** Người dùng đã có tài khoản trong hệ thống bị quên mật khẩu và cần đặt lại.
- **System / Admin:** Cần đảm bảo hệ thống không bị lợi dụng để spam email, không lộ lọt thông tin người dùng, và cơ sở dữ liệu được an toàn.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)

- **Database (Hợp nhất bảng):** Bắt buộc sử dụng **1 bảng duy nhất** `email_verifications` để quản lý chung vòng đời OTP cho cả luồng Đăng ký (UC04) và Quên mật khẩu (UC07). Các luồng phải được phân biệt rạch ròi qua cột `type` (ví dụ: 'REGISTER' | 'RESET_PASSWORD').
- **Bảo mật Email (Chống User Enumeration):** Khi người dùng gửi yêu cầu quên mật khẩu, hệ thống **bắt buộc** trả về một thông báo thành công chung chung (Ví dụ: "Mã OTP đã được gửi nếu email tồn tại trong hệ thống"), tuyệt đối không báo lỗi email không tồn tại.
- **Bảo mật & Chống Spam OTP:**
  - Mã OTP gồm 6 chữ số, chỉ lưu mã đã được hash vào database, tuyệt đối không lưu plaintext. Thời gian sống (TTL) của mã là 10 phút.
  - **Cooldown:** Mỗi lần yêu cầu gửi lại OTP phải cách nhau tối thiểu **60 giây**.
  - **Lockout:** Cho phép nhập sai mã OTP tối đa **5 lần**. Nếu sai quá giới hạn, khóa chức năng khôi phục của email đó trong **15 phút**.
- **Bảo mật Mật khẩu:** Mật khẩu mới bắt buộc được mã hóa một chiều bằng `bcryptjs` trước khi cập nhật.

## 5. ASSUMPTIONS (Giả định)

- Giả định cơ sở dữ liệu chính (Database) sẽ được sử dụng để lưu trữ trạng thái của mã OTP, đếm thời gian chờ (60s) và quản lý số lần nhập sai nhằm đảm bảo khả năng truy vết và tự động khóa bảo vệ hệ thống.
- Giả định dịch vụ gửi mail (NodeMailer/SMTP) sẽ được xử lý độc lập, tự fail an toàn và không làm sập hệ thống nếu dịch vụ mail gặp sự cố.
- Giả định Frontend có cơ chế giữ trạng thái dữ liệu (State) giữa các bước nhập email, nhập mã OTP và đổi mật khẩu mới.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Frontend Flow:** Luồng giao diện sẽ diễn ra như thế nào? Sẽ là 2 trang (Trang 1: Nhập Email -> Trang 2: Nhập OTP & Mật khẩu mới) hay 3 trang (Email -> OTP -> Mật khẩu mới)?
2. **Quy tắc Mật khẩu mới:** Hệ thống có bắt buộc "Mật khẩu mới không được trùng với mật khẩu cũ" không?

## 7. ANSWERS TO OPEN QUESTIONS

### Answer 1: Frontend Flow (Resolved)

**Question:** Luồng giao diện sẽ diễn ra như thế nào? Sẽ là 2 trang hay 3 trang?
**Answer:**

- **Confirmed:** Sử dụng thiết kế luồng **Multi-step 3 trang** độc lập .
- **Implementation Flow:** Luồng người dùng sẽ đi tuần tự qua: Trang 1 (Nhập Email) -> Trang 2 (Nhập mã OTP) -> Trang 3 (Nhập Mật khẩu mới).
- **Business Impact & Rationale:** Việc bóc tách thành 3 trang giúp Frontend quản lý trạng thái (state) dễ dàng và an toàn hơn. Người dùng bắt buộc phải xác thực thành công mã OTP tại Bước 2 mới được phép tiếp cận form đổi mật khẩu ở Bước 3, điều này giúp hệ thống chống lại các lỗi vượt rào (bypass) giao diện từ phía client.

### Answer 2: Quy tắc Mật khẩu mới (Resolved)

**Question:** Hệ thống có bắt buộc "Mật khẩu mới không được trùng với mật khẩu cũ" không?
**Answer:**

- **Confirmed:** **KHÔNG BẮT BUỘC**. Mật khẩu mới có thể trùng với mật khẩu cũ .
- **Implementation Flow:** Khi nhận payload đổi mật khẩu, hệ thống chỉ cần kiểm tra độ mạnh của mật khẩu mới, băm (hash) bằng thư viện `bcrypt` và cập nhật thẳng vào Database.
- **Business Impact & Rationale:** Quyết định này giúp tối ưu hóa hiệu năng và đơn giản hóa logic Backend một cách tối đa. Hệ thống không cần thực hiện thêm bước query mật khẩu cũ từ Database ra để so sánh, qua đó giảm độ trễ (latency) của API và tránh phát sinh các ngoại lệ (Exception handling) rườm rà không đáng có.

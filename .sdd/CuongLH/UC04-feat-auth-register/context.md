# CONTEXT.md — Feature: Authentication Register (UC04)

# Người viết: CuongLH | Ngày: 2026-06-25

## 1. PROBLEM STATEMENT

Hệ thống VMS cần một luồng đăng ký tài khoản mới an toàn và tinh gọn. Để chống spam tài khoản ảo và đảm bảo tính xác thực, hệ thống cần xác minh email của người dùng ngay lúc đăng ký thông qua mã OTP. Đồng thời, để tối ưu trải nghiệm (Lean Onboarding), hệ thống chỉ thu thập các thông tin cơ bản nhất lúc đăng ký; các thông tin chi tiết khác (kỹ năng, lịch sử...) sẽ được thu thập sau ở phần quản lý Profile (UC18, UC19).

## 2. DOMAIN KNOWLEDGE

- **OTP (One Time Password):** Mã xác thực dùng một lần gửi qua email để xác minh quyền sở hữu email của người đăng ký.
- **Lean Onboarding (Đăng ký tinh gọn):** Nguyên tắc chỉ yêu cầu các trường dữ liệu bắt buộc nhất để tạo tài khoản, giảm tỷ lệ bỏ cuộc của người dùng mới.
- **Rate Limiting & Lockout:** Các cơ chế bảo vệ hệ thống khỏi việc bị lạm dụng API gửi email (spam mail) và tấn công dò mã OTP (brute-force).

## 3. STAKEHOLDERS

- **Guest:** Người dùng chưa có tài khoản, muốn đăng ký để tham gia các sự kiện tình nguyện.
- **Volunteer:** Vai trò (Role) mặc định sẽ được gán cho Guest sau khi đăng ký và xác thực OTP thành công.
- **System / Admin:** Cần đảm bảo cơ sở dữ liệu không bị rác (fake/invalid emails) và bảo vệ dịch vụ gửi mail khỏi bị lạm dụng.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)

- **Thông tin thu thập (Fields):** Bắt buộc và chỉ giới hạn ở: `Full Name`, `Email`, `Phone Number`, `Password`, `Confirm Password`. (Mọi thông tin khác xử lý ở UC cập nhật Profile).
- **Quy tắc mật khẩu:** Mật khẩu và Xác nhận mật khẩu phải khớp nhau. Mật khẩu phải được hash bằng `bcryptjs` trước khi lưu.
- **Xác thực Email:** Bắt buộc gửi mã OTP qua `NodeMailer`.
- **Bảo mật & Chống Spam OTP (Bắt buộc):**
  - **Cooldown:** Mỗi lần gửi mã OTP phải cách nhau tối thiểu **60 giây**.
  - **Lockout:** Cho phép nhập sai mã OTP tối đa **5 lần**. Nếu sai lần thứ 5, khóa tính năng đăng ký/xác thực của email đó trong **15 phút**.
- **Data Validation:** 100% dữ liệu đầu vào phải được validate bằng Zod schema theo chuẩn dự án.
- **Phân quyền:** Không gán cứng text role. Tài khoản mới tạo bắt buộc map với `role_id` của "Volunteer" trong cơ sở dữ liệu.

## 5. ASSUMPTIONS (Giả định)

- Giả định cơ sở dữ liệu chính (Database) sẽ được sử dụng để lưu trữ trạng thái của mã OTP, đếm thời gian chờ (60s) và quản lý số lần nhập sai nhằm đảm bảo khả năng truy vết và tự động khóa bảo vệ hệ thống khỏi lạm dụng.
- Giả định dịch vụ gửi mail (NodeMailer/SMTP) đã được cấu hình các biến môi trường cần thiết trong `.env` và hoạt động ổn định.
- Giả định Email là trường định danh duy nhất (Unique), không cho phép đăng ký nếu email đã tồn tại trong hệ thống.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Độ dài và thời gian sống (TTL) của mã OTP?** (Ví dụ: Mã OTP gồm 6 chữ số ngẫu nhiên và có hiệu lực trong 5 phút hay 10 phút trước khi hết hạn?).
2. **Lưu trữ dữ liệu tạm thời ở đâu trong lúc chờ OTP?** (Khi user điền form đăng ký và chờ nhận OTP, thông tin Name, Phone, Password hash sẽ được lưu tạm vào **Redis**, hay insert thẳng vào **Database** với trạng thái `is_active: false` chờ kích hoạt?)

## 7. ANSWERS (Đã chốt nghiệp vụ)

1. Độ dài và thời gian sống (TTL) của mã OTP Theo quy chuẩn từ file CONTEXT.md mẫu của dự án, mã OTP bắt buộc phải là 6 chữ số ngẫu nhiên và có thời gian sống (TTL) là 10 phút trước khi hết hạn. Mức giới hạn này kết hợp với việc khóa 15 phút sau 5 lần nhập sai sẽ bảo vệ hệ thống tối đa.

2. Khi người dùng gửi form đăng ký, hệ thống sẽ lưu tạm toàn bộ thông tin cá nhân cùng mã OTP, thời gian chờ và bộ đếm lỗi vào bảng email_verifications trong Database, và chỉ chính thức chèn dữ liệu để tạo tài khoản trong bảng users sau khi xác thực thành công nhằm đảm bảo bảng người dùng luôn sạch sẽ và không chứa các tài khoản rác.

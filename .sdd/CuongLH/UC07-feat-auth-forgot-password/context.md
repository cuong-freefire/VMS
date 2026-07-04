# CONTEXT.md — Feature: Authentication Forgot Password (UC07)

# Người viết: CuongLH | Ngày: 30/06/2026

## 1. PROBLEM STATEMENT

Người dùng có thể quên mật khẩu đăng nhập vào hệ thống VMS. Để giảm phụ thuộc vào hỗ trợ thủ công và giữ trải nghiệm liền mạch, hệ thống cần một flow cho phép người dùng tự khôi phục mật khẩu bằng mã OTP gửi tới email đã đăng ký.

## 2. DOMAIN KNOWLEDGE

- **OTP (One Time Password):** Mã 6 chữ số dùng một lần để xác minh quyền sở hữu email trước khi cho phép đổi mật khẩu.
- **User Enumeration:** Rủi ro bảo mật khi hệ thống vô tình để lộ email nào tồn tại qua thông báo hoặc hành vi phản hồi.
- **Cooldown & Lockout:** Cơ chế chống spam gửi OTP và chống brute-force OTP.

## 3. STAKEHOLDERS

- **User (tất cả role):** Người dùng đã có tài khoản và cần đặt lại mật khẩu.
- **System / Admin:** Cần bảo vệ tài khoản người dùng, tránh spam email, và giữ flow ổn định khi dịch vụ mail gặp sự cố.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)

- **Database (Bảng dùng chung):** Bắt buộc dùng bảng `email_verifications` cho cả Register (UC04) và Forgot Password (UC07). Hai flow được phân biệt qua cột `type` với giá trị `REGISTER` hoặc `RESET_PASSWORD`. Tham chiếu schema tại `DATABASE.md` §3.1.
- **Schema dùng chung:** Các cột chính: `id`, `email`, `otp_hash`, `type`, `created_at`, `last_sent_at`, `attempts`, `is_locked`, `locked_until`. Ràng buộc `UNIQUE(email, type)`.
- **Bảo mật Email (Chống User Enumeration):** Khi người dùng gửi yêu cầu quên mật khẩu, hệ thống bắt buộc trả về thông báo thành công chung chung cho cả email tồn tại và không tồn tại.
- **Bảo mật & Chống Spam OTP:**
  - OTP là mã 6 chữ số; **PHẢI hash bcrypt** vào `otp_hash` trước khi lưu DB. Plaintext OTP chỉ tồn tại trong email gửi đi — không log, không trả về API.
  - TTL của OTP là 10 phút kể từ `created_at`.
  - Cooldown gửi lại OTP là 60 giây, tính theo `last_sent_at`.
  - Lockout xảy ra sau 5 lần nhập sai OTP, khóa trong 15 phút bằng `is_locked` và `locked_until`.
  - Sau reset mật khẩu thành công: **hard DELETE** bản ghi `email_verifications` có `type = 'RESET_PASSWORD'`.
- **Bảo mật Mật khẩu:** Mật khẩu mới bắt buộc được hash một chiều bằng `bcryptjs` (BCRYPT_SALT_ROUNDS từ `.env`, mặc định 12) trước khi cập nhật.
- **API Response:** Tuân thủ ADR-006 — `{ success, data?, error? }`; message nằm trong `data.message`.
- **Audit Log (MVP):** Ghi log Pino cho các sự kiện forgot-password (OTP sent, verified, success, lockout). Không log OTP plaintext, password, hoặc hash.

## 5. ASSUMPTIONS (Giả định)

- Bảng `email_verifications` đã tồn tại từ UC04 (sau migration thêm `type`) và được tái sử dụng cho UC07.
- Dịch vụ gửi mail được xử lý fail-safe: lỗi gửi mail không làm crash API.
- Frontend có cơ chế giữ state giữa 3 bước: nhập email, nhập OTP, nhập mật khẩu mới (`ForgotPasswordStep1/2/3`, `ForgotPasswordContext`).
- Chỉ tài khoản đang hoạt động (`is_active = true`) mới có thể hoàn tất đổi mật khẩu.
- User có thể forgot password ngay cả khi `email_verified = false`; sau reset vẫn phải verify email trước khi login (theo rule hệ thống).

## 6. OPEN QUESTIONS

Không còn câu hỏi mở. Các quyết định thiết kế đã được chốt và đồng bộ với `DATABASE.md`, UC04, và bộ artifact UC07.

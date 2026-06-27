# CONTEXT.md — Donation & Payment (UC58–UC61)

# Người viết: [Member Name] | Ngày: 2026-06-26

## 1. PROBLEM STATEMENT

Hệ thống VMS cho phép tình nguyện viên và người dùng quyên góp tiền cho các sự kiện tình nguyện. Để thực hiện quyên góp, hệ thống cần tích hợp với các cổng thanh toán (VNPay, MoMo) để xử lý giao dịch an toàn. Nếu không có module này, hệ thống không thể nhận quyên góp trực tuyến, và tổ chức phải thu tiền thủ công ngoài hệ thống.

## 2. DOMAIN KNOWLEDGE

- **Donation (Quyên góp):** Là hành động người dùng đóng góp tiền cho một sự kiện tình nguyện cụ thể.
- **Payment Gateway (Cổng thanh toán):** Hệ thống tích hợp với VNPay và MoMo để xử lý giao dịch. Người dùng chọn cổng thanh toán, được redirect đến cổng đó, và quay lại hệ thống sau khi hoàn tất.
- **Transaction (Giao dịch):** Mỗi lần quyên góp là một giao dịch (transaction) với các trạng thái: Pending → Success/Failed/Cancelled.
- **Webhook/Callback:** Trạng thái giao dịch được cập nhật qua webhook callback từ cổng thanh toán — tuyệt đối không tin vào redirect URL từ phía client
- **Số tiền tối thiểu:** 10,000 VND (theo business rules).
- **Giao dịch bất biến:** Giao dịch đã thành công (Success) là dữ liệu bất biến — không tự ý sửa đổi số tiền hoặc trạng thái.
- **Soft-delete không áp dụng:** Donation là transaction data — không xóa vật lý nhưng cũng không soft-delete. Thay vào đó, giao dịch lỗi hoặc timeout chuyển sang Failed/Cancelled.

## 3. STAKEHOLDERS

- **Volunteer/Người dùng:** Muốn quyên góp tiền cho sự kiện một cách nhanh chóng, an toàn, và có thể theo dõi lịch sử quyên góp.
- **Admin:** Cần quản lý các giao dịch quyên góp — xem danh sách, theo dõi trạng thái, đối soát với cổng thanh toán.
- **Tổ chức (Organization):** Nhận tiền quyên góp từ các giao dịch thành công.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Cổng thanh toán:** Bắt buộc tích hợp 2 cổng: VNPay và MoMo.
- **Số tiền tối thiểu:** Mọi giao dịch phải >= 10,000 VND.
- **Webhook, không phải redirect:** Trạng thái giao dịch CHỈ được cập nhật qua webhook callback từ cổng thanh toán. Redirect URL từ client KHÔNG được tin tưởng để cập nhật trạng thái.
- **Tính bất biến:** Giao dịch Success là immutable — không được sửa số tiền hoặc trạng thái.
- **Rollback:** Giao dịch Pending quá 30 phút tự động chuyển sang Failed/Cancelled.
- **API format:** Bắt buộc dùng prefix `/api/v1/donations` và Zod validation.
- **Swagger:** Bắt buộc document đầy đủ endpoint donation.
- **Logging:** Mọi giao dịch bắt buộc ghi log chi tiết.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định đã có tài khoản merchant với VNPay và MoMo (sandbox cho development, production cho deployment).
- Giả định các biến môi trường (VNP_TmnCode, VNP_HashSecret, MOMO_PartnerCode, MOMO_AccessKey, MOMO_SecretKey) đã được cấu hình trong .env.
- Giả định bảng Donation đã có trong Prisma schema với các trường: `donation_id`, `user_id`, `event_id`, `amount`, `currency`, `payment_gateway` (vnpay/momo), `transaction_id` (từ gateway), `status` (Pending/Success/Failed/Cancelled), `gateway_response` (JSON), `created_at`, `updated_at`.
- Giả định chưa có cơ chế tự động hoàn tiền (refund) — giao dịch thành công là final.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Người dùng chưa đăng nhập có được quyên góp không?** Guest có thể quyên góp không?
2. **Quyên góp cho event hay cho organization?** Người dùng quyên góp cho sự kiện cụ thể hay cho tổ chức?
3. **Refund:** Có cần chức năng hoàn tiền không? Nếu có, khi nào?
4. **Có gửi email xác nhận khi quyên góp thành công không?** (Liên quan Module 15 - Email Services)
5. **Thời gian timeout cho giao dịch Pending là bao lâu?**

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Chỉ người dùng đã đăng nhập (Volunteer, Staff, Manager, Admin) mới được quyên góp. Guest không được quyên góp.
- **A2:** Quyên góp cho sự kiện cụ thể (event_id). Số tiền sẽ được chuyển đến tổ chức chủ quản của sự kiện (xử lý ngoài hệ thống — VMS không làm chức năng chuyển tiền thực tế).
- **A3:** Không có refund trong v1. Mọi giao dịch Success là final.
- **A4:** Có gửi email xác nhận khi quyên góp thành công. Tích hợp với Email Service (Module 15) — nếu chưa có Email Service, ghi log và bỏ qua email.
- **A5:** Timeout: 30 phút. Giao dịch Pending quá 30 phút tự động chuyển sang Failed.
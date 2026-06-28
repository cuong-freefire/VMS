# CONTEXT.md — Donate To Event (UC58)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-28

## 1. PROBLEM STATEMENT

Người dùng đã đăng nhập muốn quyên góp tiền cho một sự kiện tình nguyện cụ thể để hỗ trợ tài chính cho hoạt động. Hệ thống cần tạo giao dịch quyên góp và tích hợp với cổng thanh toán (VNPay, MoMo) để xử lý thanh toán an toàn. Nếu không có chức năng này, việc quyên góp phải thực hiện thủ công ngoài hệ thống.

## 2. DOMAIN KNOWLEDGE

- **Donation (Quyên góp):** Hành động người dùng đóng góp tiền cho một sự kiện.
- **Số tiền tối thiểu:** 10,000 VND (theo business rules).
- **Chỉ user đã đăng nhập:** Guest không được quyên góp.
- **Quyên góp theo sự kiện:** Mỗi donation gắn với một event_id cụ thể.
- **Trạng thái giao dịch:** Pending → Success/Failed/Cancelled.
- **Webhook callback:** Trạng thái giao dịch được cập nhật qua webhook từ cổng thanh toán — không dựa vào redirect URL từ client.
- **Immutable:** Giao dịch Success không thể sửa đổi.

## 3. STAKEHOLDERS

- **Volunteer/Người dùng:** Muốn quyên góp nhanh chóng, an toàn.
- **Admin:** Cần theo dõi giao dịch để đối soát.
- **Tổ chức (gián tiếp):** Nhận tiền quyên góp.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Số tiền tối thiểu:** >= 10,000 VND. Nếu nhỏ hơn → HTTP 400.
- **Chỉ user đã đăng nhập:** Guest → 401.
- **API format:** `POST /api/v1/donations/create-payment`.
- **Validation:** Zod validate amount, event_id, payment_gateway (vnpay|momo).
- **Webhook:** Chỉ webhook mới được cập nhật trạng thái giao dịch thành Success/Failed.
- **Swagger:** Bắt buộc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định đã có tài khoản merchant VNPay và MoMo (sandbox).
- Giả định biến môi trường cho VNPay và MoMo đã được cấu hình.
- Giả định bảng Donation có: donation_id, user_id, event_id, amount, payment_gateway, transaction_id, status, gateway_response, created_at, updated_at.
- Giả định không có refund trong v1.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Currency:** Có hỗ trợ đơn vị tiền tệ nào? Chỉ VND?
2. **Người dùng có thể chọn số tiền tùy ý không?** Hay chỉ chọn từ các mức cố định?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Chỉ VND. Không hỗ trợ ngoại tệ.
- **A2:** Người dùng nhập số tiền tùy ý, miễn >= 10,000 VND.

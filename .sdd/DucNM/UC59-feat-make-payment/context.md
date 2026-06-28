# CONTEXT.md — Make Payment (UC59)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-28

## 1. PROBLEM STATEMENT

Sau khi người dùng tạo yêu cầu quyên góp (UC58), họ cần được chuyển hướng đến cổng thanh toán (VNPay/MoMo) để thực hiện thanh toán thực tế. Hệ thống cần xử lý việc redirect đến cổng thanh toán, nhận kết quả (callback/webhook), và cập nhật trạng thái giao dịch tương ứng. Nếu không có luồng thanh toán, quyên góp chỉ dừng ở bước tạo đơn mà không có tiền thực tế được chuyển.

## 2. DOMAIN KNOWLEDGE

- **Payment flow:**
  1. Client gọi `create-payment` → nhận payment_url.
  2. Client redirect user đến payment_url (VNPay/MoMo).
  3. User thực hiện thanh toán trên cổng.
  4. Cổng thanh toán redirect user về return_url (client-side, không đáng tin cậy).
  5. Cổng thanh toán gửi webhook/IPN đến server (đáng tin cậy).
  6. Server cập nhật trạng thái giao dịch dựa trên webhook.
- **Webhook là nguồn sự thật duy nhất:** Không tin vào redirect URL từ client.
- **VNPay:** Sử dụng IPN URL để nhận callback.
- **MoMo:** Sử dụng IPN URL để nhận callback.

## 3. STAKEHOLDERS

- **Người dùng:** Cần thanh toán nhanh, an toàn, biết kết quả ngay.
- **Admin:** Cần đối soát giao dịch qua webhook.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Webhook-first:** Chỉ webhook cập nhật trạng thái giao dịch. Redirect URL không được tin tưởng.
- **Idempotent:** Webhook trùng không được tạo giao dịch trùng.
- **Signature validation:** Bắt buộc validate chữ ký từ cổng thanh toán.
- **API format:**
  - VNPay return URL: `GET /api/v1/payments/vnpay-return` (chỉ để hiển thị kết quả, không cập nhật DB).
  - VNPay IPN: `POST /api/v1/payments/vnpay-ipn`.
  - MoMo IPN: `POST /api/v1/payments/momo-ipn`.
- **Swagger:** Bắt buộc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định return URL (client redirect) chỉ dùng để thông báo cho user biết kết quả tạm thời — trạng thái thực tế được cập nhật qua webhook sau.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Return URL:** Có nên cập nhật trạng thái tạm thời từ return URL không (chờ webhook confirm)? Hay hoàn toàn không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Return URL chỉ dùng để Frontend hiển thị thông báo "Đang xử lý giao dịch..." cho user. Không cập nhật DB từ return URL. Trạng thái thực tế đến từ webhook.

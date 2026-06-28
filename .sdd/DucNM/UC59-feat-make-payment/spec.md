# Feature Specification: Make Payment (UC59)

**Feature Branch**: `feat/uc59-make-payment`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Hệ thống cần xử lý luồng thanh toán qua VNPay và MoMo — từ redirect đến xử lý webhook callback."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xử lý thanh toán VNPay thành công qua webhook (Priority: P1)

Người dùng thanh toán thành công trên VNPay. VNPay gửi IPN callback đến server để cập nhật trạng thái giao dịch.

**Why this priority**: Xử lý webhook là cách duy nhất để cập nhật trạng thái giao dịch một cách đáng tin cậy.

**Independent Test**: Giả lập VNPay gửi IPN request đến `POST /api/v1/payments/vnpay-ipn` với signature hợp lệ, kiểm tra giao dịch chuyển từ Pending → Success.

**Acceptance Scenarios**:

1. **Given** giao dịch ID = 1 đang ở trạng thái Pending, **When** VNPay gửi IPN callback với mã giao dịch tham chiếu đúng và signature hợp lệ, **Then** hệ thống validate signature, cập nhật giao dịch thành Success, ghi lại toàn bộ gateway_response.
2. **Given** VNPay gửi IPN callback với signature không hợp lệ, **When** hệ thống nhận được request, **Then** hệ thống trả về HTTP 400, ghi log cảnh báo bảo mật, và không cập nhật giao dịch.
3. **Given** VNPay gửi IPN callback trùng lần thứ 2 cho cùng giao dịch đã Success, **When** hệ thống nhận request, **Then** hệ thống bỏ qua (idempotent) và trả về thành công.

---

### User Story 2 - Xử lý thanh toán MoMo thất bại qua webhook (Priority: P1)

Người dùng thanh toán thất bại trên MoMo. MoMo gửi IPN callback để thông báo giao dịch thất bại.

**Why this priority**: Xử lý giao dịch thất bại kịp thời giúp giải phóng trạng thái Pending và cho user biết kết quả.

**Independent Test**: Giả lập MoMo gửi IPN request báo thất bại, kiểm tra giao dịch chuyển sang Failed.

**Acceptance Scenarios**:

1. **Given** giao dịch ID = 2 đang Pending, **When** MoMo gửi IPN báo giao dịch thất bại, **Then** hệ thống validate signature và cập nhật giao dịch thành Failed.
2. **Given** user hủy giao dịch trên MoMo, **When** MoMo gửi IPN báo cancelled, **Then** hệ thống cập nhật giao dịch thành Cancelled.

---

### User Story 3 - Xử lý redirect return URL (Priority: P2)

Sau khi thanh toán, user được redirect từ VNPay/MoMo về hệ thống. Frontend hiển thị thông báo cho user mà không cập nhật DB.

**Why this priority**: Return URL cải thiện UX — user thấy kết quả ngay lập tức mà không cần đợi webhook.

**Independent Test**: Gọi `GET /api/v1/payments/vnpay-return` với params từ VNPay, kiểm tra response chỉ chứa thông tin hiển thị.

**Acceptance Scenarios**:

1. **Given** user được redirect từ VNPay về return URL, **When** Frontend nhận response, **Then** hiển thị "Đang xử lý giao dịch..." cho user và polling API donation detail để lấy trạng thái thực tế từ webhook.
2. **Given** return URL nhận được params từ VNPay, **When** hệ thống xử lý, **Then** hệ thống KHÔNG cập nhật DB dựa trên params này (chỉ để hiển thị).

---

### Edge Cases

- Điều gì xảy ra khi webhook gửi đến nhưng giao dịch không tồn tại? → HTTP 404, ghi log.
- Điều gì xảy ra khi VNPay/MoMo gửi webhook nhiều lần (retry)? → Idempotent — ignore các request trùng.
- Điều gì xảy ra khi webhook timeout (không gửi được)? → Cron job timeout 30 phút chuyển sang Failed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cung cấp endpoint `POST /api/v1/payments/vnpay-ipn` để nhận IPN từ VNPay.
- **FR-002**: System MUST cung cấp endpoint `POST /api/v1/payments/momo-ipn` để nhận IPN từ MoMo.
- **FR-003**: System MUST validate signature từ VNPay/MoMo trước khi cập nhật giao dịch.
- **FR-004**: System MUST đảm bảo idempotent — bỏ qua webhook trùng.
- **FR-005**: System MUST cung cấp endpoint `GET /api/v1/payments/vnpay-return` cho redirect — KHÔNG cập nhật DB từ endpoint này.
- **FR-006**: System MUST ghi log tất cả webhook request (bao gồm cả request bị từ chối vì signature sai).
- **FR-007**: System MUST từ chối webhook không hợp lệ với HTTP 400.

### Key Entities *(Business Level Only)*

- **Donation (Quyên góp)**: Giao dịch được cập nhật trạng thái dựa trên webhook.
- **Payment Gateway (VNPay/MoMo)**: Hệ thống bên ngoài gửi webhook/IPN.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% webhook được xử lý trong vòng 10 giây.
- **SC-002**: 100% webhook signature được validate — không có giao dịch giả mạo.
- **SC-003**: Không có giao dịch nào bị cập nhật trạng thái từ return URL (client redirect).
- **SC-004**: Webhook trùng không gây ra lỗi hoặc giao dịch trùng.

## Assumptions

- VNPay và MoMo gửi IPN trong vòng vài giây sau khi giao dịch hoàn tất.
- Hệ thống có cron job timeout 30 phút cho giao dịch Pending (xử lý trường hợp không nhận được webhook).

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC59 và KHÔNG được implement:

- **Refund/Hoàn tiền qua cổng thanh toán**: Không có refund.
- **Tích hợp cổng thanh toán khác**: Chỉ VNPay và MoMo.
- **Manual reconciliation (đối soát thủ công)**: Deferred.
- **Payment dashboard**: Thuộc UC61.

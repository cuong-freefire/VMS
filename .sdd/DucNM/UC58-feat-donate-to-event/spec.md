# Feature Specification: Donate To Event (UC58)

**Feature Branch**: `feat/uc58-donate-to-event`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Người dùng đã đăng nhập muốn quyên góp tiền cho một sự kiện tình nguyện cụ thể qua VNPay hoặc MoMo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quyên góp thành công qua VNPay (Priority: P1)

Người dùng muốn quyên góp 50,000 VND cho sự kiện qua VNPay và hoàn tất thanh toán.

**Why this priority**: Luồng quyên góp cốt lõi — không có luồng này, module Donation vô dụng.

**Independent Test**: Gọi `POST /api/v1/donations/create-payment` với body hợp lệ (amount = 50000, event_id = 1, payment_gateway = "vnpay"), kiểm tra response chứa payment_url. Giả lập webhook VNPay gửi callback thành công, kiểm tra giao dịch chuyển sang Success.

**Acceptance Scenarios**:

1. **Given** user đã đăng nhập và đang xem chi tiết event ID = 5, **When** user nhập số tiền 50,000 VND, chọn VNPay, và click "Quyên góp", **Then** hệ thống tạo giao dịch với status `Pending`, trả về payment URL của VNPay, và chuyển hướng user đến VNPay.
2. **Given** user thanh toán thành công trên VNPay, **When** VNPay gửi webhook callback đến hệ thống, **Then** hệ thống validate signature, cập nhật status thành `Success`, ghi gateway_response, và trả về thông báo thành công.
3. **Given** user thanh toán thất bại, **When** VNPay gửi webhook thất bại, **Then** hệ thống cập nhật status thành `Failed`.

---

### User Story 2 - Quyên góp với số tiền không hợp lệ (Priority: P1)

Hệ thống phải từ chối quyên góp nếu số tiền dưới 10,000 VND.

**Why this priority**: Tuân thủ business rules của dự án.

**Independent Test**: Gọi API với amount = 5000, kiểm tra HTTP 400.

**Acceptance Scenarios**:

1. **Given** user nhập số tiền 5,000 VND, **When** user submit, **Then** hệ thống trả về HTTP 400 với message "Số tiền quyên góp tối thiểu là 10,000 VND."
2. **Given** Guest chưa đăng nhập, **When** Guest cố gắng gọi API, **Then** hệ thống trả về HTTP 401.

---

### Edge Cases

- Điều gì xảy ra khi event_id không tồn tại? → HTTP 404.
- Điều gì xảy ra khi payment_gateway không phải "vnpay" hoặc "momo"? → HTTP 400.
- Điều gì xảy ra khi VNPay gửi webhook với signature sai? → HTTP 400, ghi log cảnh báo bảo mật.
- Điều gì xảy ra khi webhook gửi cho giao dịch đã Success? → Bỏ qua (idempotent).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cung cấp endpoint `POST /api/v1/donations/create-payment` nhận: amount (>= 10000), event_id (required), payment_gateway ("vnpay" | "momo").
- **FR-002**: System MUST tạo giao dịch với status `Pending`, trả về payment_url.
- **FR-003**: System MUST validate amount >= 10,000 — nếu không, HTTP 400.
- **FR-004**: System MUST xử lý webhook callback từ VNPay/MoMo để cập nhật trạng thái giao dịch.
- **FR-005**: System MUST validate signature từ webhook — nếu sai, HTTP 400 và ghi log bảo mật.
- **FR-006**: WHERE giao dịch đã Success, System MUST bỏ qua webhook trùng (idempotent).
- **FR-007**: System MUST từ chối Guest với HTTP 401.

### Key Entities *(Business Level Only)*

- **Donation (Quyên góp)**: Giao dịch quyên góp cho sự kiện. Trạng thái: Pending → Success/Failed/Cancelled.
- **Event (Sự kiện)**: Entity nhận quyên góp.
- **Payment Transaction (Giao dịch thanh toán)**: Xử lý qua VNPay/MoMo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User hoàn thành quyên góp (từ lúc submit đến khi nhận kết quả) trong vòng 3 phút.
- **SC-002**: 100% webhook callback được xử lý trong vòng 10 giây.
- **SC-003**: Không có giao dịch nào kẹt Pending quá 35 phút (cron xử lý timeout).
- **SC-004**: 100% webhook signature được validate — không có giao dịch giả mạo.

## Assumptions

- Đã có tài khoản merchant VNPay, MoMo sandbox.
- Backend có thể truy cập internet để gọi API VNPay/MoMo.
- Cron job xử lý timeout giao dịch Pending (30 phút).

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC58 và KHÔNG được implement:

- **Guest donation**: Chỉ user đã đăng nhập.
- **Refund**: Không có refund trong v1.
- **Tích hợp cổng thanh toán khác**: Chỉ VNPay và MoMo.
- **Recurring donation**: Mỗi lần quyên góp thủ công.
- **Email xác nhận khi quyên góp thành công**: Thuộc Module 15.

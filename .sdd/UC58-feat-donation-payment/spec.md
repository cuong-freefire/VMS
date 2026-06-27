# Feature Specification: Donation & Payment (UC58–UC61)

**Feature Branch**: `feat/donation-payment`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Hệ thống cần module quyên góp cho phép người dùng quyên góp tiền cho sự kiện qua VNPay/MoMo, xem lịch sử quyên góp, và Admin quản lý các giao dịch."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quyên góp cho sự kiện (Priority: P1)

Là một người dùng đã đăng nhập (Volunteer), tôi muốn quyên góp tiền cho một sự kiện cụ thể qua VNPay hoặc MoMo, để hỗ trợ tài chính cho hoạt động tình nguyện.

**Why this priority**: Đây là chức năng cốt lõi của module Donation — người dùng không thể quyên góp nếu không có luồng thanh toán. Không có chức năng này, toàn bộ module vô dụng.

**Independent Test**: Có thể test độc lập bằng cách tạo donation request, gọi API POST /api/v1/donations/create-payment, kiểm tra response chứa payment URL của VNPay/MoMo, và test callback webhook để cập nhật trạng thái.

**Acceptance Scenarios**:

1. **Given** user đã đăng nhập và đang xem chi tiết event có ID = 5, **When** user chọn số tiền 50,000 VND, chọn cổng thanh toán VNPay, và nhấn "Quyên góp", **Then** hệ thống tạo giao dịch với status `Pending`, trả về payment URL của VNPay, và chuyển hướng user đến VNPay.

2. **Given** user đã được chuyển hướng đến VNPay và thanh toán thành công, **When** VNPay gửi webhook callback đến hệ thống, **Then** hệ thống cập nhật status giao dịch thành `Success` và hiển thị thông báo "Quyên góp thành công! Cảm ơn bạn đã ủng hộ."

3. **Given** user thanh toán thất bại trên VNPay, **When** VNPay gửi webhook callback thất bại, **Then** hệ thống cập nhật status giao dịch thành `Failed` và hiển thị thông báo "Giao dịch thất bại. Vui lòng thử lại."

4. **Given** user hủy giao dịch trên cổng thanh toán, **When** VNPay/MoMo gửi webhook, **Then** hệ thống cập nhật status thành `Cancelled`.

5. **Given** user nhập số tiền 5,000 VND (dưới 10,000), **When** user submit, **Then** hệ thống hiển thị lỗi "Số tiền quyên góp tối thiểu là 10,000 VND."

6. **Given** Guest (chưa đăng nhập) cố gắng quyên góp, **When** Guest gửi POST request, **Then** hệ thống trả về HTTP 401 Unauthorized.

---

### User Story 2 - Thanh toán qua MoMo (Priority: P1)

Là một người dùng, tôi muốn có thể quyên góp qua MoMo nếu tôi không có tài khoản VNPay, để linh hoạt lựa chọn phương thức thanh toán phù hợp.

**Why this priority**: Hỗ trợ nhiều cổng thanh toán giúp tăng tỷ lệ hoàn thành giao dịch. Nếu chỉ có VNPay hoặc MoMo, một số user không thể thanh toán.

**Independent Test**: Test độc lập bằng cách gọi API POST /api/v1/donations/create-payment với payment_gateway = "momo" và kiểm tra response chứa payment URL của MoMo.

**Acceptance Scenarios**:

1. **Given** user chọn cổng thanh toán MoMo, **When** user nhập số tiền 100,000 VND và submit, **Then** hệ thống tạo giao dịch Pending và trả về MoMo payment URL.

2. **Given** user thanh toán thành công qua MoMo, **When** MoMo gửi webhook callback IPN (Instant Payment Notification) đến hệ thống, **Then** hệ thống cập nhật giao dịch thành `Success`, ghi lại `gateway_response` đầy đủ.

3. **Given** MoMo gửi webhook thất bại, **When** hệ thống nhận callback, **Then** giao dịch chuyển sang `Failed`.

---

### User Story 3 - Xem lịch sử quyên góp (Priority: P2)

Là một người dùng đã đăng nhập, tôi muốn xem lịch sử quyên góp của mình (các giao dịch đã thực hiện, số tiền, trạng thái) để theo dõi các khoản đóng góp.

**Why this priority**: Quan trọng cho trải nghiệm người dùng — người dùng muốn biết họ đã quyên góp những gì và bao nhiêu. Nhưng không blocking cho core donation flow.

**Independent Test**: Test độc lập bằng cách tạo dữ liệu donation cho user, gọi API GET /api/v1/donations/my-donations, kiểm tra danh sách trả về đúng.

**Acceptance Scenarios**:

1. **Given** user đã thực hiện 3 giao dịch quyên góp (2 thành công, 1 thất bại), **When** user truy cập trang "Lịch sử quyên góp", **Then** hệ thống hiển thị danh sách 3 giao dịch với thông tin: sự kiện, số tiền, cổng thanh toán, trạng thái, thời gian.

2. **Given** user không có giao dịch nào, **When** user truy cập trang lịch sử, **Then** hệ thống hiển thị "Bạn chưa thực hiện quyên góp nào."

3. **Given** user click vào một giao dịch thành công, **When** user xem chi tiết, **Then** hệ thống hiển thị đầy đủ thông tin giao dịch và trạng thái "Thành công" với badge xanh.

---

### User Story 4 - Admin quản lý giao dịch quyên góp (Priority: P2)

Là Admin, tôi muốn xem danh sách tất cả giao dịch quyên góp trên hệ thống, lọc theo trạng thái và thời gian, để đối soát và theo dõi dòng tiền.

**Why this priority**: Quản lý giao dịch là chức năng backoffice quan trọng cho Admin, nhưng không ảnh hưởng đến người dùng quyên góp thông thường.

**Independent Test**: Test độc lập bằng cách gọi API GET /api/v1/donations (Admin token) và kiểm tra danh sách tất cả giao dịch + phân trang.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập và hệ thống có 100 giao dịch, **When** Admin truy cập trang quản lý Donation, **Then** hệ thống hiển thị danh sách giao dịch phân trang (20 items/trang), có thể filter theo status (Success/Failed/Pending/Cancelled) và khoảng thời gian.

2. **Given** Admin muốn xem tổng số tiền quyên góp thành công, **When** Admin nhìn vào thống kê trên đầu trang, **Then** hệ thống hiển thị tổng số tiền quyên góp thành công, tổng số giao dịch, tỷ lệ thành công.

3. **Given** Admin click vào một giao dịch, **When** Admin xem chi tiết, **Then** hệ thống hiển thị đầy đủ thông tin giao dịch và `gateway_response` (JSON).

4. **Given** Manager hoặc Staff cố gắng truy cập API quản lý donation, **When** họ gửi request, **Then** hệ thống trả về HTTP 403 Forbidden.

---

### User Story 5 - Xử lý giao dịch timeout (Priority: P1)

Là hệ thống, tôi cần tự động chuyển các giao dịch Pending quá 30 phút sang Failed, để không có giao dịch nào kẹt vĩnh viễn ở trạng thái Pending.

**Why this priority**: Đây là business rule bắt buộc — "Các giao dịch lỗi hoặc timeout phải chuyển sang Failed hoặc Cancelled, không được kẹt vĩnh viễn ở trạng thái Pending."

**Independent Test**: Test độc lập bằng cách tạo một giao dịch Pending cách đây 35 phút, chạy cron job hoặc script cleanup, kiểm tra giao dịch đã chuyển sang Failed.

**Acceptance Scenarios**:

1. **Given** có giao dịch Pending với `created_at` = 12:00 và thời gian hiện tại là 12:35, **When** cron job timeout chạy, **Then** giao dịch chuyển từ `Pending` sang `Failed` với lý do "Giao dịch hết thời gian chờ."

2. **Given** giao dịch Pending với `created_at` = 12:00 và thời gian hiện tại là 12:20, **When** cron job chạy, **Then** giao dịch vẫn giữ nguyên `Pending`.

3. **Given** giao dịch Pending đã quá 30 phút nhưng webhook callback thành công đến trước khi cron job chạy, **When** webhook cập nhật thành `Success`, **Then** cron job không chạm vào giao dịch này (status không còn Pending).

---

### Edge Cases

- **Webhook đến trước khi user redirect:** Hệ thống xử lý webhook bất đồng bộ — giao dịch cập nhật thành công trước khi user quay lại trang kết quả.
- **Webhook trùng (duplicate callback):** Hệ thống kiểm tra `transaction_id` + `status` để idempotent — nếu giao dịch đã Success, webhook success lần 2 không thay đổi gì.
- **Gateway response lưu đầy đủ:** Luôn lưu raw JSON response từ gateway để phục vụ đối soát sau này.
- **Concurrent quyên góp cùng lúc:** Mỗi giao dịch độc lập — không có conflict.
- **Donation cho event đã kết thúc:** Không cho phép quyên góp cho event có status Completed, Cancelled hoặc đã quá end_date.

---

## Requirements *(mandatory)*

### Functional Requirements

#### UC58 — Quyên góp cho sự kiện (Donate To Event)

- **FR-001**: WHERE user đã đăng nhập và event đang active (status chưa phải Completed/Cancelled, và chưa quá end_date), THE system SHALL cho phép tạo donation request.
- **FR-002**: THE system SHALL validate số tiền >= 10,000 VND bằng Zod.
- **FR-003**: WHEN user chọn cổng thanh toán VNPay, THE system SHALL tạo giao dịch status = "Pending", lưu thông tin, và gọi VNPay API để lấy payment URL. Trả về URL cho Frontend để redirect.
- **FR-004**: WHEN user chọn cổng thanh toán MoMo, THE system SHALL tạo giao dịch status = "Pending" và gọi MoMo API để lấy payment URL.
- **FR-005**: THE system SHALL tạo unique `transaction_id` (mã tham chiếu nội bộ) cho mỗi giao dịch.
- **FR-006**: WHERE user chưa đăng nhập (Guest), THE system SHALL trả về HTTP 401.
- **FR-007**: WHERE event đã kết thúc hoặc không còn active, THE system SHALL trả về HTTP 400 "Sự kiện không còn nhận quyên góp."

#### UC59 — Xử lý thanh toán (Make Payment — Webhook)

- **FR-008**: THE system SHALL cung cấp endpoint POST /api/v1/donations/vnpay-callback và POST /api/v1/donations/momo-callback để nhận webhook từ VNPay và MoMo.
- **FR-009**: THE system SHALL validate chữ ký (signature/hash) từ webhook trước khi cập nhật trạng thái giao dịch.
- **FR-010**: WHERE webhook hợp lệ với status = Success, THE system SHALL cập nhật giao dịch thành `Success`, lưu `gateway_response`, và ghi log.
- **FR-011**: WHERE webhook hợp lệ với status = Failed, THE system SHALL cập nhật giao dịch thành `Failed`.
- **FR-012**: WHERE webhook hợp lệ với status = Cancelled, THE system SHALL cập nhật giao dịch thành `Cancelled`.
- **FR-013**: THE system SHALL đảm bảo idempotent: nếu giao dịch đã có status Success, webhook Success thứ 2 không thay đổi gì.
- **FR-014**: THE system SHALL cập nhật tổng số tiền quyên góp (total_donations) của event tương ứng khi giao dịch thành công.
- **FR-015**: WHERE webhook signature không hợp lệ, THE system SHALL trả về HTTP 400 và ghi log cảnh báo bảo mật.

#### UC60 — Xem lịch sử quyên góp (View Donation History)

- **FR-016**: THE system SHALL cung cấp endpoint GET /api/v1/donations/my-donations trả về danh sách giao dịch của user hiện tại, sắp xếp mới nhất lên đầu.
- **FR-017**: THE system SHALL hỗ trợ phân trang (pagination) và filter theo trạng thái (status).
- **FR-018**: WHERE không có giao dịch nào, THE system SHALL trả về mảng rỗng.

#### UC61 — Quản lý giao dịch (Manage Donations — Admin)

- **FR-019**: WHERE user có role Admin, THE system SHALL cung cấp endpoint GET /api/v1/donations trả về tất cả giao dịch, hỗ trợ phân trang, filter theo status, khoảng thời gian, payment_gateway.
- **FR-020**: THE system SHALL cung cấp endpoint GET /api/v1/donations/summary trả về tổng quan: total_donations, total_amount_success, total_transactions, success_rate (%).
- **FR-021**: THE system SHALL cung cấp endpoint GET /api/v1/donations/:id trả về chi tiết một giao dịch (bao gồm gateway_response).
- **FR-022**: WHERE user không có role Admin, THE system SHALL trả về HTTP 403.

#### Xử lý tự động (Cron Job)

- **FR-023**: THE system SHALL chạy cron job mỗi 5 phút để kiểm tra các giao dịch Pending quá 30 phút và tự động chuyển sang Failed với lý do "Giao dịch hết thời gian chờ."

### Key Entities *(Business Level Only)*

- **Donation (Quyên góp)**: Đại diện cho một giao dịch quyên góp tiền cho sự kiện. Thuộc tính: người quyên góp (user), sự kiện (event), số tiền, loại tiền tệ, cổng thanh toán (VNPay/MoMo), mã giao dịch từ cổng thanh toán, trạng thái (Pending/Success/Failed/Cancelled), phản hồi từ cổng thanh toán.

- **Event (Sự kiện)**: Nhận quyên góp từ người dùng. Mỗi event có thể nhận nhiều donation.

- **User (Người dùng)**: Người thực hiện quyên góp. Một user có thể có nhiều donation.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User có thể hoàn thành quyên góp (từ lúc nhấn "Quyên góp" đến khi nhận kết quả) trong vòng 3 phút (bao gồm thời gian xử lý trên cổng thanh toán).
- **SC-002**: 100% webhook callback được xử lý và cập nhật trạng thái giao dịch trong vòng 10 giây.
- **SC-003**: Không có giao dịch nào kẹt ở trạng thái Pending quá 35 phút (cron job chạy mỗi 5 phút, timeout 30 phút).
- **SC-004**: 100% giao dịch Success có signature được validate — không có giao dịch giả mạo.
- **SC-005**: Admin có thể xem tổng quyên góp và danh sách giao dịch trong vòng 2 giây.

---

## Assumptions

- **A-001**: Đã có tài khoản merchant VNPay và MoMo (sandbox) với đầy đủ thông tin cấu hình.
- **A-002**: Backend có thể truy cập internet để gọi API đến VNPay và MoMo.
- **A-003**: Cron job scheduler (node-cron hoặc tương đương) đã có sẵn trong project.
- **A-004**: Bảng Donation đã có trong Prisma schema với đầy đủ trường.
- **A-005**: Email Service (Module 15) có thể chưa sẵn sàng — nếu không gửi được email, chỉ ghi log và không block giao dịch.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của feature này và KHÔNG được implement:

- **Refund/Hoàn tiền:** Mọi giao dịch Success là final. Không có chức năng hoàn tiền trong v1.
- **Guest donation:** Chỉ user đã đăng nhập mới được quyên góp.
- **Tích hợp cổng thanh toán khác (PayPal, Stripe):** V1 chỉ hỗ trợ VNPay và MoMo.
- **Chuyển tiền thực tế đến tổ chức:** VMS không thực hiện chuyển tiền — chỉ ghi nhận giao dịch quyên góp.
- **Hóa đơn điện tử (e-invoice):** Không có chức năng xuất hóa đơn cho giao dịch.
- **Recurring donation (quyên góp định kỳ):** Mỗi lần quyên góp là thủ công, không có subscription.
- **Dashboard donation cho Manager:** Donation management chỉ dành cho Admin.
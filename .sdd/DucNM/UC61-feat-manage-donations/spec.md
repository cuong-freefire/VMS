# Feature Specification: Manage Donations (UC61)

**Feature Branch**: `feat/uc61-manage-donations`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Admin cần quản lý tất cả giao dịch quyên góp — xem danh sách, xem chi tiết, xem tổng quan số liệu."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin xem danh sách tất cả giao dịch (Priority: P1)

Admin muốn xem danh sách tất cả giao dịch quyên góp trong hệ thống, có filter và phân trang.

**Why this priority**: Đây là entry point để Admin quản lý donation — không có danh sách, Admin không thể làm gì.

**Independent Test**: Tạo 5 donation từ các user khác nhau, gọi `GET /api/v1/donations` với token Admin, kiểm tra danh sách trả về đủ.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập và hệ thống có 5 giao dịch, **When** Admin truy cập trang Donation Management, **Then** hệ thống hiển thị tất cả giao dịch với thông tin: tên người quyên góp, sự kiện, số tiền, cổng thanh toán, trạng thái, ngày tạo.
2. **Given** Admin muốn lọc giao dịch, **When** Admin chọn filter status = "Success", khoảng thời gian từ 01/06/2026 đến 30/06/2026, **Then** hệ thống chỉ hiển thị giao dịch Success trong khoảng đó.
3. **Given** Admin muốn xem thêm, **When** Admin nhấn "Xem thêm", **Then** hệ thống tải thêm 20 giao dịch tiếp theo.

---

### User Story 2 - Admin xem chi tiết giao dịch (Priority: P1)

Admin muốn xem chi tiết một giao dịch cụ thể, bao gồm cả phản hồi từ cổng thanh toán, để đối soát.

**Why this priority**: Xem chi tiết giao dịch (đặc biệt là gateway_response) là cần thiết để Admin đối soát với cổng thanh toán.

**Independent Test**: Gọi `GET /api/v1/donations/1` với token Admin, kiểm tra response chứa đầy đủ gateway_response.

**Acceptance Scenarios**:

1. **Given** Admin đang xem danh sách giao dịch, **When** Admin click vào một giao dịch để xem chi tiết, **Then** hệ thống hiển thị tất cả thông tin giao dịch bao gồm: tên người quyên góp, email, sự kiện, số tiền, cổng thanh toán, mã giao dịch từ cổng, trạng thái, thời gian tạo, thời gian cập nhật, và gateway_response (dạng JSON hoặc formatted).
2. **Given** Admin xem giao dịch không tồn tại, **When** Admin gửi request, **Then** hệ thống trả về HTTP 404.

---

### User Story 3 - Admin xem tổng quan donation (Priority: P2)

Admin muốn xem summary tổng quan về donation: tổng số tiền, tổng giao dịch, tỷ lệ thành công.

**Why this priority**: Summary giúp Admin có cái nhìn nhanh về tình hình quyên góp mà không cần vào dashboard.

**Independent Test**: Gọi `GET /api/v1/donations/summary`, kiểm tra response chứa các chỉ số tổng quan.

**Acceptance Scenarios**:

1. **Given** hệ thống có dữ liệu donation, **When** Admin truy cập summary, **Then** hệ thống hiển thị: total_donations (tổng số), total_amount_success (tổng tiền giao dịch thành công), total_transactions, success_rate (%).
2. **Given** không có dữ liệu donation, **When** Admin xem summary, **Then** hệ thống trả về tất cả giá trị = 0.

---

### Edge Cases

- Điều gì xảy ra khi Manager/Staff cố gắng truy cập? → HTTP 403.
- Điều gì xảy ra khi Admin cố gắng sửa/xóa giao dịch? → Không có endpoint write — không thể thực hiện.
- Điều gì xảy ra khi filter theo payment_gateway không hợp lệ? → HTTP 400.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cung cấp endpoint `GET /api/v1/donations` cho Admin — danh sách tất cả giao dịch, hỗ trợ phân trang, filter (status, start_date, end_date, payment_gateway).
- **FR-002**: System MUST cung cấp endpoint `GET /api/v1/donations/summary` — tổng quan: total_donations, total_amount_success, total_transactions, success_rate (%).
- **FR-003**: System MUST cung cấp endpoint `GET /api/v1/donations/:id` — chi tiết giao dịch bao gồm gateway_response.
- **FR-004**: System MUST từ chối non-Admin với HTTP 403.
- **FR-005**: System MUST KHÔNG cung cấp endpoint write cho donation (tuân thủ immutable rule).

### Key Entities *(Business Level Only)*

- **Donation (Quyên góp)**: Giao dịch được Admin quản lý. Chỉ xem, không sửa/xóa.
- **User (Người dùng)**: Người quyên góp — hiển thị tên, email trong chi tiết.
- **Event (Sự kiện)**: Sự kiện nhận quyên góp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Danh sách 1000 donation tải trong vòng 2 giây.
- **SC-002**: Summary trả về trong vòng 1 giây.
- **SC-003**: 100% request non-Admin bị từ chối.
- **SC-004**: Admin không thể thực hiện thao tác write trên giao dịch (không có endpoint).

## Assumptions

- Summary data có thể cache 5 phút.
- Giao dịch Success là immutable — không có endpoint PUT/PATCH/DELETE.
- Manager không có quyền quản lý donation (khác với dashboard).

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC61 và KHÔNG được implement:

- **Sửa/Xóa giao dịch**: Vi phạm immutable rule.
- **Refund**: Không có refund.
- **Quản lý donation cho Manager**: Chỉ Admin.
- **Export donation list**: Thuộc UC57.
- **Gửi email xác nhận donation**: Thuộc Module 15.
- **Manual reconciliation tool**: Deferred.

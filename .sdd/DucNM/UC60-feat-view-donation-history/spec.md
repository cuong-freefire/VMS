# Feature Specification: View Donation History (UC60)

**Feature Branch**: `feat/uc60-view-donation-history`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Người dùng đã đăng nhập cần xem lịch sử các giao dịch quyên góp của mình."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem lịch sử quyên góp cá nhân (Priority: P2)

Người dùng muốn xem tất cả giao dịch quyên góp mình đã thực hiện, sắp xếp mới nhất lên đầu, để theo dõi các khoản đóng góp.

**Why this priority**: Quan trọng cho trải nghiệm người dùng nhưng không blocking cho core donation flow (UC58). Có thể làm sau P1.

**Independent Test**: Tạo 3 donation cho user A trong database, gọi `GET /api/v1/donations/my-donations` với token user A, kiểm tra response chứa 3 giao dịch.

**Acceptance Scenarios**:

1. **Given** user đã đăng nhập và có 3 giao dịch quyên góp (2 Success, 1 Failed), **When** user truy cập trang Donation History, **Then** hệ thống hiển thị 3 giao dịch sắp xếp mới nhất lên đầu, mỗi giao dịch hiển thị: tên sự kiện, số tiền, cổng thanh toán, trạng thái, ngày tạo.
2. **Given** user muốn lọc giao dịch theo trạng thái, **When** user chọn filter "Success", **Then** hệ thống chỉ hiển thị 2 giao dịch Success.
3. **Given** user chưa có giao dịch nào, **When** user truy cập Donation History, **Then** hệ thống hiển thị "Bạn chưa thực hiện quyên góp nào."
4. **Given** Guest cố gắng truy cập API, **When** Guest gửi request, **Then** hệ thống trả về HTTP 401.

---

### Edge Cases

- Điều gì xảy ra khi page vượt quá tổng số trang? → Trả về mảng rỗng.
- Điều gì xảy ra khi status filter không hợp lệ? → HTTP 400.
- Điều gì xảy ra khi sự kiện của giao dịch đã bị xóa mềm? → Hiển thị tên sự kiện là "[Đã xóa]".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cung cấp endpoint `GET /api/v1/donations/my-donations` trả về danh sách giao dịch của user hiện tại.
- **FR-002**: System MUST sắp xếp theo `created_at DESC` (mới nhất trên cùng).
- **FR-003**: System MUST hỗ trợ phân trang (page, limit, mặc định limit = 20).
- **FR-004**: System MUST hỗ trợ filter theo `status` (success, failed, pending, cancelled).
- **FR-005**: WHERE không có giao dịch, System MUST trả về mảng rỗng.
- **FR-006**: System MUST từ chối Guest với HTTP 401.

### Key Entities *(Business Level Only)*

- **Donation (Quyên góp)**: Giao dịch của user. Hiển thị: amount, event name, payment_gateway, status, created_at.
- **Event (Sự kiện)**: Entity liên kết để hiển thị tên sự kiện.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Danh sách 100 donation tải trong vòng 1 giây.
- **SC-002**: 100% user chỉ thấy donation của chính mình.
- **SC-003**: Filter theo status trả về đúng dữ liệu.

## Assumptions

- User chỉ xem được donation của mình qua endpoint my-donations.
- Admin có endpoint riêng (UC61) để xem tất cả.
- Tên sự kiện được lấy từ bảng Event (có thể đã bị soft-delete).

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC60 và KHÔNG được implement:

- **Xem donation của user khác**: Admin dùng UC61.
- **Export donation history**: Thuộc UC57.
- **View donation detail**: Gộp trong danh sách (không cần trang riêng).

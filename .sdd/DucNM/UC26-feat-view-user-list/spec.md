# Feature Specification: View User List (UC26)

**Feature Branch**: `feat/uc26-view-user-list`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Admin cần xem danh sách tất cả người dùng trong hệ thống VMS để giám sát tài khoản, kiểm tra trạng thái hoạt động và thực hiện quản lý."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin xem toàn bộ danh sách người dùng (Priority: P1)

Admin muốn xem danh sách tất cả người dùng trong hệ thống, bao gồm cả active và inactive, để nắm tổng quan về số lượng, role và trạng thái từng tài khoản.

**Why this priority**: Đây là entry point của toàn bộ module User Management — không có danh sách, Admin không thể thực hiện bất kỳ thao tác quản lý tài khoản nào.

**Independent Test**: Có thể test độc lập bằng cách tạo ít nhất 3 user (gồm cả active và inactive) thuộc các role khác nhau trong database, gọi `GET /api/v1/users` với token Admin, và kiểm tra response trả về đầy đủ thông tin.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập và hệ thống có 5 user (3 active + 2 inactive) thuộc các role Volunteer, Staff, Manager, Admin, **When** Admin truy cập trang danh sách người dùng, **Then** hệ thống hiển thị đủ 5 user với thông tin: họ tên, email, role, trạng thái (active/inactive), ngày tạo.
2. **Given** hệ thống chưa có người dùng nào, **When** Admin truy cập danh sách, **Then** hệ thống trả về danh sách rỗng và hiển thị thông báo "Chưa có người dùng nào trong hệ thống."
3. **Given** Admin nhập từ khóa "Nguyen" vào ô tìm kiếm, **When** Admin submit tìm kiếm, **Then** hệ thống trả về các user có tên hoặc email chứa "nguyen" (không phân biệt hoa/thường).

---

### User Story 2 - Admin xem danh sách theo role (Priority: P2)

Admin muốn lọc danh sách người dùng theo role cụ thể (ví dụ: chỉ xem Volunteer) để dễ dàng kiểm tra và quản lý theo nhóm.

**Why this priority**: Tính năng lọc giúp Admin tiết kiệm thời gian khi cần thao tác trên một nhóm người dùng cụ thể, nhưng không phải là chức năng bắt buộc ngay từ đầu.

**Independent Test**: Gọi `GET /api/v1/users?role=volunteer` với token Admin, kiểm tra response chỉ chứa user có role Volunteer.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập và hệ thống có user thuộc nhiều role, **When** Admin lọc theo role "Staff", **Then** hệ thống chỉ hiển thị user có role Staff.
2. **Given** Admin lọc theo role không tồn tại, **When** Admin submit lọc, **Then** hệ thống trả về danh sách rỗng.

---

### User Story 3 - Chặn truy cập với người dùng không có quyền (Priority: P1)

Staff, Manager, Volunteer và Guest không có quyền xem danh sách người dùng nội bộ của hệ thống.

**Why this priority**: Bảo mật dữ liệu người dùng là yêu cầu bắt buộc — danh sách tài khoản là dữ liệu nhạy cảm.

**Independent Test**: Gọi `GET /api/v1/users` với token Staff/Manager/Volunteer hoặc không có token, kiểm tra response trả về HTTP 403 hoặc 401.

**Acceptance Scenarios**:

1. **Given** Staff đã đăng nhập, **When** Staff gửi request lấy danh sách người dùng, **Then** hệ thống trả về HTTP 403 Forbidden.
2. **Given** Guest chưa đăng nhập, **When** Guest gửi request lấy danh sách người dùng, **Then** hệ thống trả về HTTP 401 Unauthorized.

---

### Edge Cases

- Điều gì xảy ra khi tham số `page` hoặc `limit` là số âm hoặc không phải số nguyên? → Hệ thống trả về HTTP 400 Bad Request.
- Điều gì xảy ra khi từ khóa tìm kiếm chứa ký tự đặc biệt? → Hệ thống sanitize input, trả về kết quả rỗng hoặc báo lỗi 400.
- Điều gì xảy ra khi database không phản hồi? → Hệ thống trả về HTTP 500 và ghi log lỗi.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trả về danh sách người dùng khi Admin gọi `GET /api/v1/users`, bao gồm cả user active và inactive.
- **FR-002**: System MUST từ chối request từ Staff, Manager, Volunteer (HTTP 403) và Guest (HTTP 401).
- **FR-003**: System MUST hỗ trợ tìm kiếm theo tên và email qua query param `search` (không phân biệt hoa/thường).
- **FR-004**: System MUST hỗ trợ lọc theo role qua query param `role`.
- **FR-005**: System MUST hỗ trợ phân trang qua query params `page` và `limit` (mặc định limit = 20).
- **FR-006**: System MUST hỗ trợ sắp xếp qua query param `sort` (mặc định `created_at:desc`).
- **FR-007**: System MUST trả về thông báo rõ ràng khi danh sách rỗng (mảng rỗng, không phải null).

### Key Entities *(Business Level Only)*

- **User (Người dùng)**: Tài khoản người dùng hệ thống. Thuộc tính hiển thị trong danh sách: user_id, họ tên, email, role, trạng thái active/inactive, ngày tạo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% request GET danh sách người dùng từ Admin trả về đúng và đủ (active + inactive) trong vòng 500ms.
- **SC-002**: 100% request từ Staff/Manager/Volunteer/Guest bị từ chối với HTTP status code đúng (403/401).
- **SC-003**: Tìm kiếm và lọc trả về kết quả chính xác trong vòng 1 giây.

## Assumptions

- Middleware xác thực JWT và phân quyền đã hoạt động từ module Auth (UC03).
- Bảng User đã có trong schema với đầy đủ trường và quan hệ với bảng Role.
- Số lượng người dùng có thể lên đến hàng nghìn, phân trang là cần thiết.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC26 và KHÔNG được implement:

- **Xem chi tiết người dùng**: Thuộc UC27.
- **Thêm mới người dùng**: Thuộc UC28.
- **Chỉnh sửa người dùng**: Thuộc UC29.
- **Vô hiệu hóa/xóa người dùng từ trang danh sách**: Thuộc UC29 (Edit User).
- **Export danh sách người dùng**: Thuộc UC57 (Export Reports).
- **Staff, Manager, Volunteer xem danh sách người dùng**: Không có trong scope — chỉ Admin mới có quyền.
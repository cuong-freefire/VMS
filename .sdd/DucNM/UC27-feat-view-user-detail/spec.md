# Feature Specification: View User Detail (UC27)

**Feature Branch**: `feat/uc27-view-user-detail`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Admin cần xem thông tin chi tiết của một người dùng cụ thể trong hệ thống VMS để kiểm tra và xác minh thông tin."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin xem chi tiết người dùng (Priority: P1)

Admin muốn xem thông tin đầy đủ của một người dùng cụ thể, bao gồm họ tên, email, số điện thoại, avatar, role, trạng thái hoạt động, ngày tạo và ngày cập nhật.

**Why this priority**: Đây là chức năng cốt lõi — Admin cần xem chi tiết để xác minh thông tin trước khi chỉnh sửa hoặc thực hiện các thao tác quản lý khác.

**Independent Test**: Có thể test độc lập bằng cách tạo một user trong database, gọi `GET /api/v1/users/:id` với token Admin, và kiểm tra response trả về đầy đủ thông tin.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập và user có ID hợp lệ tồn tại trong hệ thống, **When** Admin truy cập trang chi tiết user đó, **Then** hệ thống hiển thị đầy đủ thông tin: họ tên, email, số điện thoại, avatar, role, trạng thái active/inactive, ngày tạo, ngày cập nhật.
2. **Given** Admin đã đăng nhập và user có ID không tồn tại, **When** Admin truy cập trang chi tiết, **Then** hệ thống trả về HTTP 404 Not Found với message "User not found."

---

### User Story 2 - Chặn truy cập với người dùng không có quyền (Priority: P1)

Staff, Manager, Volunteer và Guest không có quyền xem chi tiết người dùng nội bộ.

**Why this priority**: Bảo mật thông tin cá nhân của người dùng là yêu cầu bắt buộc.

**Independent Test**: Gọi `GET /api/v1/users/:id` với token Staff/Manager/Volunteer hoặc không có token, kiểm tra response trả về HTTP 403 hoặc 401.

**Acceptance Scenarios**:

1. **Given** Staff đã đăng nhập, **When** Staff gửi request xem chi tiết user, **Then** hệ thống trả về HTTP 403 Forbidden.
2. **Given** Guest chưa đăng nhập, **When** Guest gửi request xem chi tiết user, **Then** hệ thống trả về HTTP 401 Unauthorized.

---

### Edge Cases

- Điều gì xảy ra khi `:id` là UUID không hợp lệ? → Hệ thống trả về HTTP 400 Bad Request.
- Điều gì xảy ra khi user đã bị xóa mềm (is_active = false)? → Hệ thống vẫn trả về thông tin user (bao gồm trạng thái inactive) vì Admin cần thấy cả user bị vô hiệu hóa.
- Điều gì xảy ra khi database không phản hồi? → Hệ thống trả về HTTP 500 và ghi log lỗi.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trả về thông tin chi tiết user khi Admin gọi `GET /api/v1/users/:id` với ID hợp lệ.
- **FR-002**: System MUST trả về HTTP 404 khi user ID không tồn tại.
- **FR-003**: System MUST từ chối request từ Staff, Manager, Volunteer (HTTP 403) và Guest (HTTP 401).
- **FR-004**: System MUST trả về đầy đủ các trường: user_id, full_name, email, phone, avatar_url, role, is_active, created_at, updated_at.

### Key Entities *(Business Level Only)*

- **User (Người dùng)**: Tài khoản người dùng hệ thống. Chi tiết bao gồm tất cả thông tin cá nhân và trạng thái tài khoản.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% request GET chi tiết user từ Admin với ID hợp lệ trả về đúng thông tin trong vòng 500ms.
- **SC-002**: 100% request với ID không tồn tại trả về HTTP 404.
- **SC-003**: 100% request từ role không có quyền bị từ chối với HTTP status code đúng.

## Assumptions

- Middleware xác thực JWT và phân quyền đã hoạt động từ module Auth (UC03).
- Bảng User đã có trong schema với đầy đủ trường.
- Route param `:id` là UUID hoặc số nguyên tùy theo thiết kế database.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC27 và KHÔNG được implement:

- **Chỉnh sửa thông tin user từ trang chi tiết**: Thuộc UC29.
- **Xem lịch sử hoạt động của user**: Thuộc UC21 (View Volunteer History).
- **Thống kê nhanh (số sự kiện, số feedback)**: Sẽ được bổ sung sau nếu cần.
- **Staff, Manager, Volunteer xem chi tiết user khác**: Không có trong scope.
# Feature Specification: Filter User

**Feature Branch**: `feat/uc30-filter-user`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Admin cần lọc danh sách người dùng trong hệ thống VMS theo nhiều tiêu chí."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin lọc người dùng theo role (Priority: P1)

Admin muốn lọc danh sách người dùng theo role cụ thể để xem nhanh các tài khoản thuộc một nhóm.

**Why this priority**: Lọc theo role là nhu cầu phổ biến nhất — Admin thường cần kiểm tra riêng từng nhóm.

**Independent Test**: Gọi `GET /api/v1/users?role=staff` với token Admin, kiểm tra response chỉ chứa user có role Staff.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập, **When** Admin lọc theo role "Volunteer", **Then** hệ thống chỉ hiển thị user có role Volunteer.
2. **Given** Admin lọc theo role không tồn tại, **When** Admin submit, **Then** hệ thống trả về danh sách rỗng.

---

### User Story 2 - Admin lọc người dùng theo trạng thái (Priority: P1)

Admin muốn lọc người dùng theo trạng thái active hoặc inactive để quản lý tài khoản bị vô hiệu hóa.

**Why this priority**: Giúp Admin nhanh chóng tìm ra các tài khoản bị khóa để xem xét kích hoạt lại.

**Independent Test**: Gọi `GET /api/v1/users?is_active=false` với token Admin, kiểm tra response chỉ chứa user inactive.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập, **When** Admin lọc user inactive (is_active=false), **Then** hệ thống chỉ hiển thị user bị vô hiệu hóa.
2. **Given** Admin lọc user active (is_active=true), **When** Admin submit, **Then** hệ thống chỉ hiển thị user đang hoạt động.

---

### User Story 3 - Admin kết hợp nhiều tiêu chí lọc (Priority: P2)

Admin muốn kết hợp nhiều tiêu chí lọc cùng lúc — ví dụ: tìm Staff đang active được tạo trong tháng này.

**Why this priority**: Kết hợp filter giúp Admin tìm kiếm chính xác hơn, nhưng ít phổ biến hơn filter đơn.

**Independent Test**: Gọi `GET /api/v1/users?role=staff&is_active=true&from_date=2026-06-01&to_date=2026-06-30` với token Admin, kiểm tra response chính xác.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập, **When** Admin kết hợp filter role=staff, is_active=true, from_date và to_date, **Then** hệ thống trả về danh sách Staff active được tạo trong khoảng thời gian đó.

---

### Edge Cases

- Điều gì xảy ra khi `from_date` lớn hơn `to_date`? → Hệ thống trả về HTTP 400 Bad Request.
- Điều gì xảy ra khi filter không có kết quả? → Hệ thống trả về mảng rỗng.
- Điều gì xảy ra khi param filter không hợp lệ (ví dụ: role=invalid)? → Hệ thống bỏ qua hoặc trả về HTTP 400.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST hỗ trợ lọc theo role qua query param `role`.
- **FR-002**: System MUST hỗ trợ lọc theo trạng thái qua query param `is_active`.
- **FR-003**: System MUST hỗ trợ lọc theo khoảng thời gian tạo qua query params `from_date` và `to_date`.
- **FR-004**: System MUST cho phép kết hợp nhiều filter cùng lúc (AND logic).
- **FR-005**: System MUST validate date params — trả về HTTP 400 nếu from_date > to_date.

### Key Entities *(Business Level Only)*

- **User (Người dùng)**: Các tiêu chí lọc: role, trạng thái active/inactive, khoảng thời gian tạo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% request filter hợp lệ trả về kết quả chính xác trong vòng 1 giây.
- **SC-002**: 100% request với date range không hợp lệ bị từ chối HTTP 400.

## Assumptions

- Filter được implement trên cùng endpoint với UC26 (GET /api/v1/users).
- Middleware xác thực JWT và phân quyền đã hoạt động.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của Filter User và KHÔNG được implement:

- **Filter theo ngày cập nhật**: Chỉ hỗ trợ filter theo ngày tạo ở v1.
- **Filter theo số sự kiện đã tham gia**: Thuộc module Report/Dashboard.
- **Filter nâng cao (multi-select role)**: Sẽ được bổ sung sau nếu cần.
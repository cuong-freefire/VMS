# Feature Specification: Add User (UC28)

**Feature Branch**: `feat/uc28-add-user`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Admin cần tạo tài khoản mới cho người dùng trong hệ thống VMS."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin tạo tài khoản mới thành công (Priority: P1)

Admin muốn tạo một tài khoản người dùng mới với đầy đủ thông tin: họ tên, email, số điện thoại, role và mật khẩu.

**Why this priority**: Đây là chức năng cốt lõi — Admin cần tạo tài khoản cho nhân viên mới (Staff, Manager) hoặc tài khoản Admin bổ sung.

**Independent Test**: Có thể test độc lập bằng cách gọi `POST /api/v1/users` với body hợp lệ và token Admin, kiểm tra response trả về 201 Created cùng thông tin user mới.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập và nhập đầy đủ thông tin hợp lệ (họ tên, email chưa tồn tại, số điện thoại, role, mật khẩu >= 8 ký tự), **When** Admin submit form tạo user, **Then** hệ thống tạo user mới thành công, trả về HTTP 201 với thông tin user (không bao gồm mật khẩu).
2. **Given** Admin nhập email đã tồn tại trong hệ thống, **When** Admin submit, **Then** hệ thống trả về HTTP 409 Conflict với message "Email already exists."

---

### User Story 2 - Validate dữ liệu đầu vào (Priority: P1)

Hệ thống phải kiểm tra tính hợp lệ của dữ liệu đầu vào trước khi tạo user.

**Why this priority**: Dữ liệu không hợp lệ có thể gây lỗi database hoặc tạo tài khoản không đúng.

**Independent Test**: Gọi `POST /api/v1/users` với dữ liệu không hợp lệ (email sai format, mật khẩu ngắn), kiểm tra response trả về HTTP 400.

**Acceptance Scenarios**:

1. **Given** Admin nhập email không đúng định dạng, **When** Admin submit, **Then** hệ thống trả về HTTP 400 Bad Request với lỗi validation chi tiết.
2. **Given** Admin nhập mật khẩu ít hơn 8 ký tự, **When** Admin submit, **Then** hệ thống trả về HTTP 400 Bad Request với message "Password must be at least 8 characters."
3. **Given** Admin không nhập họ tên, **When** Admin submit, **Then** hệ thống trả về HTTP 400 Bad Request với message "Full name is required."

---

### User Story 3 - Chặn truy cập với người dùng không có quyền (Priority: P1)

Staff, Manager, Volunteer và Guest không có quyền tạo user mới.

**Why this priority**: Chỉ Admin mới có thẩm quyền tạo tài khoản hệ thống.

**Independent Test**: Gọi `POST /api/v1/users` với token Staff/Manager/Volunteer hoặc không có token, kiểm tra response trả về HTTP 403 hoặc 401.

**Acceptance Scenarios**:

1. **Given** Staff đã đăng nhập, **When** Staff gửi request tạo user, **Then** hệ thống trả về HTTP 403 Forbidden.
2. **Given** Guest chưa đăng nhập, **When** Guest gửi request tạo user, **Then** hệ thống trả về HTTP 401 Unauthorized.

---

### Edge Cases

- Điều gì xảy ra khi email đã tồn tại dưới dạng inactive (soft-delete)? → Hệ thống trả về HTTP 409, không cho tạo user mới với email đó.
- Điều gì xảy ra khi role không hợp lệ (không phải Volunteer/Staff/Manager/Admin)? → Hệ thống trả về HTTP 400.
- Điều gì xảy ra khi request body thiếu trường bắt buộc? → Hệ thống trả về HTTP 400 với danh sách các trường bị thiếu.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cho phép Admin tạo user mới qua `POST /api/v1/users`.
- **FR-002**: System MUST validate email format và kiểm tra email duy nhất.
- **FR-003**: System MUST validate mật khẩu tối thiểu 8 ký tự và hash bằng bcryptjs trước khi lưu.
- **FR-004**: System MUST validate role hợp lệ (Volunteer, Staff, Manager, Admin).
- **FR-005**: System MUST trả về HTTP 201 cùng thông tin user (không bao gồm password) khi tạo thành công.
- **FR-006**: System MUST trả về HTTP 409 khi email đã tồn tại.
- **FR-007**: System MUST trả về HTTP 400 khi dữ liệu không hợp lệ.
- **FR-008**: System MUST từ chối request từ Staff, Manager, Volunteer (HTTP 403) và Guest (HTTP 401).

### Key Entities *(Business Level Only)*

- **User (Người dùng)**: Tài khoản mới cần có: họ tên, email, số điện thoại, mật khẩu (đã hash), role, is_active = true.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% request tạo user hợp lệ từ Admin trả về HTTP 201 thành công trong vòng 1 giây.
- **SC-002**: 100% request với email trùng lặp bị từ chối với HTTP 409.
- **SC-003**: 100% request với dữ liệu không hợp lệ bị từ chối với HTTP 400 và thông báo lỗi chi tiết.

## Assumptions

- Middleware xác thực JWT và phân quyền đã hoạt động từ module Auth (UC03).
- Bảng User và Role đã có trong schema.
- Password strength (độ mạnh mật khẩu) không được kiểm tra ở v1 (chỉ kiểm tra độ dài tối thiểu).

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC28 và KHÔNG được implement:

- **Gửi email thông báo cho user mới**: Thuộc module Email Services (UC62), sẽ tích hợp sau.
- **Xác thực email (email verification)**: Sẽ được bổ sung sau.
- **Tạo user hàng loạt (bulk import)**: Không có trong scope v1.
- **Self-registration (người dùng tự đăng ký)**: Thuộc UC04 (Auth Register) — không thuộc module User Management.
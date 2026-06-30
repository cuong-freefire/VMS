# Feature Specification: Edit User (UC29)

**Feature Branch**: `feat/uc29-edit-user`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Admin cần chỉnh sửa thông tin người dùng trong hệ thống VMS."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin chỉnh sửa thông tin user thành công (Priority: P1)

Admin muốn cập nhật thông tin của một người dùng — ví dụ: đổi họ tên, số điện thoại, avatar, role, hoặc vô hiệu hóa tài khoản.

**Why this priority**: Đây là chức năng cốt lõi — Admin cần cập nhật thông tin user khi có thay đổi và khóa tài khoản vi phạm.

**Independent Test**: Có thể test độc lập bằng cách tạo một user trong database, gọi `PATCH /api/v1/users/:id` với body hợp lệ và token Admin, kiểm tra response trả về 200 OK cùng thông tin đã cập nhật.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập và user hợp lệ tồn tại, **When** Admin cập nhật họ tên và số điện thoại của user, **Then** hệ thống cập nhật thành công, trả về HTTP 200 với thông tin mới.
2. **Given** Admin muốn vô hiệu hóa một tài khoản vi phạm, **When** Admin set is_active = false, **Then** hệ thống vô hiệu hóa tài khoản, user đó không thể đăng nhập.
3. **Given** Admin muốn thay đổi role của user, **When** Admin cập nhật role từ Staff lên Manager, **Then** hệ thống cập nhật role thành công.

---

### User Story 2 - Admin không thể tự hạ role của chính mình (Priority: P1)

Admin không thể tự hạ role của chính mình xuống thấp hơn để tránh mất quyền Admin cuối cùng.

**Why this priority**: Bảo vệ tính toàn vẹn của hệ thống — nếu Admin duy nhất tự hạ role, hệ thống sẽ không còn Admin nào quản lý.

**Independent Test**: Gọi `PATCH /api/v1/users/:myId` với body chứa role thấp hơn và token Admin của chính user đó, kiểm tra response trả về HTTP 403.

**Acceptance Scenarios**:

1. **Given** Admin đang chỉnh sửa chính tài khoản của mình, **When** Admin cố gắng hạ role từ Admin xuống Staff, **Then** hệ thống trả về HTTP 403 Forbidden với message "Cannot downgrade your own role."

---

### User Story 3 - Validate dữ liệu đầu vào (Priority: P2)

Hệ thống phải kiểm tra tính hợp lệ của dữ liệu khi chỉnh sửa.

**Why this priority**: Tránh cập nhật dữ liệu không hợp lệ vào database.

**Independent Test**: Gọi `PATCH /api/v1/users/:id` với dữ liệu không hợp lệ, kiểm tra response trả về HTTP 400.

**Acceptance Scenarios**:

1. **Given** Admin nhập số điện thoại không hợp lệ, **When** Admin submit, **Then** hệ thống trả về HTTP 400 Bad Request.
2. **Given** Admin nhập role không tồn tại, **When** Admin submit, **Then** hệ thống trả về HTTP 400 Bad Request.

---

### User Story 4 - Chặn truy cập với người dùng không có quyền (Priority: P1)

Staff, Manager, Volunteer và Guest không có quyền chỉnh sửa user.

**Independent Test**: Gọi `PATCH /api/v1/users/:id` với token Staff/Manager/Volunteer hoặc không có token, kiểm tra response trả về HTTP 403 hoặc 401.

**Acceptance Scenarios**:

1. **Given** Staff đã đăng nhập, **When** Staff gửi request chỉnh sửa user, **Then** hệ thống trả về HTTP 403 Forbidden.
2. **Given** Guest chưa đăng nhập, **When** Guest gửi request chỉnh sửa user, **Then** hệ thống trả về HTTP 401 Unauthorized.

---

### Edge Cases

- Điều gì xảy ra khi user ID không tồn tại? → Hệ thống trả về HTTP 404.
- Điều gì xảy ra khi Admin cố gắng set is_active = false cho chính mình? → Được phép (Admin có thể vô hiệu hóa chính mình), nhưng cần cảnh báo.
- Điều gì xảy ra khi request body rỗng? → Hệ thống trả về HTTP 400 với message "No fields to update."

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cho phép Admin cập nhật user qua `PATCH /api/v1/users/:id`.
- **FR-002**: System MUST cho phép cập nhật: full_name, phone, avatar_url, role_id, is_active.
- **FR-003**: System MUST KHÔNG cho phép cập nhật email (bất biến).
- **FR-004**: System MUST KHÔNG cho phép Admin tự hạ role của chính mình.
- **FR-005**: System MUST validate dữ liệu đầu vào bằng Zod trước khi cập nhật.
- **FR-006**: System MUST trả về HTTP 404 khi user ID không tồn tại.
- **FR-007**: System MUST trả về HTTP 400 khi dữ liệu không hợp lệ hoặc request body rỗng.
- **FR-008**: System MUST từ chối request từ Staff, Manager, Volunteer (HTTP 403) và Guest (HTTP 401).

### Key Entities *(Business Level Only)*

- **User (Người dùng)**: Thông tin có thể chỉnh sửa: họ tên, số điện thoại, avatar, role, trạng thái active/inactive.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% request chỉnh sửa user hợp lệ từ Admin cập nhật thành công trong vòng 1 giây.
- **SC-002**: 100% request Admin tự hạ role bị từ chối.
- **SC-003**: 100% request với dữ liệu không hợp lệ bị từ chối với HTTP 400.

## Assumptions

- Middleware xác thực JWT và phân quyền đã hoạt động từ module Auth (UC03).
- Bảng User đã có trong schema với đầy đủ trường.
- Audit log cho thay đổi quan trọng (role, is_active) sẽ được ghi nhận ở Service layer.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC29 và KHÔNG được implement:

- **Đổi mật khẩu**: Thuộc UC06 (Change Password).
- **Đổi email**: Không được phép — email là bất biến.
- **Xóa cứng user**: Chỉ sử dụng soft-delete qua is_active.
- **Staff, Manager, Volunteer tự chỉnh sửa profile**: Thuộc UC19 (Edit Profile) — không thuộc module User Management.
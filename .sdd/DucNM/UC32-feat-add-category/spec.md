# Feature Specification: Add Category (UC32)

**Feature Branch**: `feat/uc32-add-category`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Manager cần thêm mới danh mục để phân loại sự kiện trong hệ thống VMS."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manager thêm category thành công (Priority: P1)

Manager muốn thêm một danh mục mới với tên, mô tả và type.

**Why this priority**: Đây là chức năng cốt lõi — Manager cần mở rộng danh mục khi có nhu cầu phân loại mới.

**Independent Test**: Gọi `POST /api/v1/categories` với body hợp lệ và token Manager, kiểm tra response trả về 201 Created.

**Acceptance Scenarios**:

1. **Given** Manager đã đăng nhập và nhập thông tin hợp lệ (tên chưa tồn tại trong type, mô tả, type hợp lệ), **When** Manager submit, **Then** hệ thống tạo category thành công, trả về HTTP 201.
2. **Given** Manager nhập tên đã tồn tại trong cùng type, **When** Manager submit, **Then** hệ thống trả về HTTP 409 Conflict.

---

### User Story 2 - Validate dữ liệu đầu vào (Priority: P1)

Hệ thống phải kiểm tra tính hợp lệ của dữ liệu.

**Independent Test**: Gọi `POST /api/v1/categories` với dữ liệu không hợp lệ, kiểm tra response trả về HTTP 400.

**Acceptance Scenarios**:

1. **Given** Manager nhập type không hợp lệ (không phải location/event_type/time_frame), **When** Manager submit, **Then** hệ thống trả về HTTP 400.
2. **Given** Manager không nhập tên, **When** Manager submit, **Then** hệ thống trả về HTTP 400.

---

### User Story 3 - Chặn truy cập với người dùng không có quyền (Priority: P1)

Staff, Volunteer và Guest không có quyền thêm category.

**Independent Test**: Gọi `POST /api/v1/categories` với token Staff/Volunteer hoặc không có token, kiểm tra response trả về HTTP 403 hoặc 401.

**Acceptance Scenarios**:

1. **Given** Staff đã đăng nhập, **When** Staff gửi request, **Then** hệ thống trả về HTTP 403.
2. **Given** Guest chưa đăng nhập, **When** Guest gửi request, **Then** hệ thống trả về HTTP 401.

---

### Edge Cases

- Tên category quá dài? → HTTP 400.
- Tên category chứa ký tự đặc biệt? → Cho phép nhưng sanitize.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cho phép Manager/Admin tạo category qua `POST /api/v1/categories`.
- **FR-002**: System MUST validate type thuộc ["location", "event_type", "time_frame"].
- **FR-003**: System MUST kiểm tra tên unique trong cùng type — trả về HTTP 409 nếu trùng.
- **FR-004**: System MUST trả về HTTP 201 khi tạo thành công.
- **FR-005**: System MUST từ chối Staff (403), Volunteer (403), Guest (401).

### Key Entities *(Business Level Only)*

- **Category (Danh mục)**: Tên, mô tả, type.

## Success Criteria *(mandatory)*

- **SC-001**: 100% request tạo category hợp lệ thành công trong vòng 1 giây.
- **SC-002**: 100% request với tên trùng bị từ chối HTTP 409.

## Assumptions

- Middleware xác thực JWT và phân quyền đã hoạt động.

---

## Out of Scope

- **Chỉnh sửa category**: Thuộc UC33.
- **Xóa category**: Sử dụng soft-delete qua Edit Category.
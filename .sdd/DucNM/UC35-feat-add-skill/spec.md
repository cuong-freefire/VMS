# Feature Specification: Add Skill (UC35)

**Feature Branch**: `feat/uc35-add-skill`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Manager cần thêm mới kỹ năng vào hệ thống VMS."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manager thêm skill thành công (Priority: P1)

Manager muốn thêm một kỹ năng mới với tên và mô tả.

**Why this priority**: Chức năng cốt lõi — Manager cần mở rộng danh sách kỹ năng.

**Independent Test**: Gọi `POST /api/v1/skills` với body hợp lệ và token Manager, kiểm tra response trả về 201 Created.

**Acceptance Scenarios**:

1. **Given** Manager đã đăng nhập và nhập thông tin hợp lệ (tên chưa tồn tại, mô tả), **When** Manager submit, **Then** hệ thống tạo skill thành công, trả về HTTP 201.
2. **Given** Manager nhập tên đã tồn tại, **When** Manager submit, **Then** hệ thống trả về HTTP 409 Conflict.

---

### User Story 2 - Validate dữ liệu (Priority: P1)

**Acceptance Scenarios**:

1. **Given** Manager không nhập tên, **When** Manager submit, **Then** HTTP 400.

---

### User Story 3 - Chặn truy cập (Priority: P1)

**Acceptance Scenarios**:

1. **Given** Staff đã đăng nhập, **When** Staff gửi request, **Then** HTTP 403.
2. **Given** Guest chưa đăng nhập, **When** Guest gửi request, **Then** HTTP 401.

---

### Edge Cases

- Tên skill quá dài? → HTTP 400.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cho phép Manager/Admin tạo skill qua `POST /api/v1/skills`.
- **FR-002**: System MUST kiểm tra tên unique — trả về HTTP 409 nếu trùng.
- **FR-003**: System MUST trả về HTTP 201 khi tạo thành công.
- **FR-004**: System MUST từ chối Staff (403), Volunteer (403), Guest (401).

### Key Entities *(Business Level Only)*

- **Skill (Kỹ năng)**: Tên, mô tả.

## Success Criteria *(mandatory)*

- **SC-001**: 100% request tạo skill hợp lệ thành công trong vòng 1 giây.
- **SC-002**: 100% request với tên trùng bị từ chối HTTP 409.

## Assumptions

- Middleware xác thực JWT và phân quyền đã hoạt động.

---

## Out of Scope

- **Chỉnh sửa skill**: Thuộc UC36.
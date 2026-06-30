# Feature Specification: Edit Skill (UC36)

**Feature Branch**: `feat/uc36-edit-skill`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Manager cần chỉnh sửa thông tin kỹ năng trong hệ thống VMS."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manager chỉnh sửa skill thành công (Priority: P1)

Manager muốn cập nhật tên, mô tả hoặc vô hiệu hóa một kỹ năng.

**Why this priority**: Chức năng cốt lõi — Manager cần cập nhật kỹ năng.

**Independent Test**: Gọi `PATCH /api/v1/skills/:id` với body hợp lệ và token Manager, kiểm tra 200 OK.

**Acceptance Scenarios**:

1. **Given** Manager đã đăng nhập và skill hợp lệ tồn tại, **When** Manager cập nhật tên, **Then** hệ thống cập nhật thành công, trả về HTTP 200.
2. **Given** Manager muốn vô hiệu hóa skill, **When** Manager set is_active = false, **Then** hệ thống vô hiệu hóa skill.

---

### User Story 2 - Validate dữ liệu (Priority: P2)

**Acceptance Scenarios**:

1. **Given** Manager đổi tên skill thành tên đã tồn tại, **When** Manager submit, **Then** HTTP 409.

---

### User Story 3 - Chặn truy cập (Priority: P1)

**Acceptance Scenarios**:

1. **Given** Staff đã đăng nhập, **When** Staff gửi request, **Then** HTTP 403.
2. **Given** Guest chưa đăng nhập, **When** Guest gửi request, **Then** HTTP 401.

---

### Edge Cases

- Skill ID không tồn tại? → HTTP 404.
- Request body rỗng? → HTTP 400.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cho phép Manager/Admin cập nhật skill qua `PATCH /api/v1/skills/:id`.
- **FR-002**: System MUST cho phép cập nhật: name, description, is_active.
- **FR-003**: System MUST kiểm tra tên unique — trả về HTTP 409 nếu trùng.
- **FR-004**: System MUST trả về HTTP 404 khi ID không tồn tại.
- **FR-005**: System MUST từ chối Staff (403), Volunteer (403), Guest (401).

### Key Entities *(Business Level Only)*

- **Skill (Kỹ năng)**: Tên, mô tả, trạng thái active/inactive.

## Success Criteria *(mandatory)*

- **SC-001**: 100% request chỉnh sửa hợp lệ thành công trong vòng 1 giây.
- **SC-002**: 100% request với tên trùng bị từ chối HTTP 409.

## Assumptions

- Middleware xác thực JWT và phân quyền đã hoạt động.

---

## Out of Scope

- **Xóa cứng skill**: Chỉ sử dụng soft-delete.
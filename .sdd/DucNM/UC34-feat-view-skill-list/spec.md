# Feature Specification: View Skill List (UC34)

**Feature Branch**: `feat/uc34-view-skill-list`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Manager cần xem danh sách kỹ năng trong hệ thống VMS để quản lý."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manager xem toàn bộ danh sách skill (Priority: P1)

Manager muốn xem tất cả kỹ năng, bao gồm active và inactive.

**Why this priority**: Entry point của module Skill Management.

**Independent Test**: Gọi `GET /api/v1/skills` với token Manager, kiểm tra response trả về tất cả skills.

**Acceptance Scenarios**:

1. **Given** Manager đã đăng nhập và hệ thống có 5 skill (4 active + 1 inactive), **When** Manager truy cập danh sách, **Then** hệ thống hiển thị đủ 5 skill.
2. **Given** hệ thống chưa có skill nào, **When** Manager truy cập, **Then** hệ thống trả về danh sách rỗng.

---

### User Story 2 - Volunteer xem danh sách skill active (Priority: P1)

Volunteer cần xem danh sách skill active để gán cho profile của mình.

**Why this priority**: Volunteer cần chọn skill khi chỉnh sửa profile (UC20).

**Independent Test**: Gọi `GET /api/v1/skills` với token Volunteer, kiểm tra response chỉ chứa skill active.

**Acceptance Scenarios**:

1. **Given** Volunteer đã đăng nhập, **When** Volunteer truy cập danh sách skill, **Then** hệ thống chỉ hiển thị skill active.

---

### User Story 3 - Chặn Guest (Priority: P1)

**Acceptance Scenarios**:

1. **Given** Guest chưa đăng nhập, **When** Guest gửi request, **Then** HTTP 401.

---

### Edge Cases

- Database không phản hồi? → HTTP 500.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trả về danh sách skill khi Manager/Admin gọi, bao gồm active và inactive.
- **FR-002**: System MUST chỉ trả về skill active khi Staff/Volunteer gọi.
- **FR-003**: System MUST từ chối Guest (HTTP 401).
- **FR-004**: System MUST trả về: skill_id, name, description, is_active.

### Key Entities *(Business Level Only)*

- **Skill (Kỹ năng)**: Tên, mô tả, trạng thái active/inactive.

## Success Criteria *(mandatory)*

- **SC-001**: 100% request GET danh sách skill trả về đúng và đủ trong vòng 500ms.
- **SC-002**: 100% request từ Guest bị từ chối HTTP 401.

## Assumptions

- Middleware xác thực JWT và phân quyền đã hoạt động.

---

## Out of Scope

- **Thêm mới skill**: Thuộc UC35.
- **Chỉnh sửa skill**: Thuộc UC36.
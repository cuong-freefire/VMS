# Feature Specification: View Category List (UC31)

**Feature Branch**: `feat/uc31-view-category-list`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Manager cần xem danh sách danh mục trong hệ thống VMS để quản lý và tham chiếu khi phân loại sự kiện."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manager xem toàn bộ danh sách danh mục (Priority: P1)

Manager muốn xem danh sách tất cả danh mục, bao gồm cả active và inactive, để quản lý.

**Why this priority**: Đây là entry point của module Category Management.

**Independent Test**: Gọi `GET /api/v1/categories` với token Manager, kiểm tra response trả về tất cả categories.

**Acceptance Scenarios**:

1. **Given** Manager đã đăng nhập và hệ thống có 5 category (4 active + 1 inactive), **When** Manager truy cập danh sách, **Then** hệ thống hiển thị đủ 5 category với thông tin: tên, mô tả, type, trạng thái.
2. **Given** hệ thống chưa có category nào, **When** Manager truy cập danh sách, **Then** hệ thống trả về danh sách rỗng.

---

### User Story 2 - Staff xem danh sách category active (Priority: P1)

Staff cần xem danh sách category đang hoạt động để tham chiếu khi tạo sự kiện.

**Why this priority**: Staff thường xuyên cần chọn category cho sự kiện.

**Independent Test**: Gọi `GET /api/v1/categories` với token Staff, kiểm tra response chỉ chứa category active.

**Acceptance Scenarios**:

1. **Given** Staff đã đăng nhập, **When** Staff truy cập danh sách category, **Then** hệ thống chỉ hiển thị category có is_active = true.

---

### User Story 3 - Guest và Volunteer xem danh sách category active (Priority: P1)

Guest và Volunteer cần xem danh sách category active để tham chiếu khi lọc sự kiện (phục vụ UC11 — Filter Event của NamLD).

**Independent Test**: Gọi `GET /api/v1/categories` với token Volunteer hoặc không có token (Guest), kiểm tra response chỉ chứa categories có is_active = true.

**Acceptance Scenarios**:

1. **Given** Guest chưa đăng nhập, **When** Guest gọi endpoint public, **Then** hệ thống trả về danh sách category active.
2. **Given** Volunteer đã đăng nhập, **When** Volunteer gửi request, **Then** hệ thống trả về danh sách category active.

---

### Edge Cases

- Điều gì xảy ra khi database không phản hồi? → HTTP 500 và ghi log.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trả về danh sách category khi Manager/Admin gọi `GET /api/v1/categories`, bao gồm cả active và inactive.
- **FR-002**: System MUST chỉ trả về category active khi Staff gọi.
- **FR-003**: System MUST chỉ trả về category active khi Volunteer gọi (phục vụ UC11 Filter Event).
- **FR-004**: System MUST trả về category active cho Guest qua public endpoint (không cần auth) (phục vụ UC11 Filter Event).
- **FR-005**: System MUST trả về thông tin: category_id, name, description, type, is_active.

### Key Entities *(Business Level Only)*

- **Category (Danh mục)**: Phân loại sự kiện. Thuộc tính: tên, mô tả, type (location, event_type, time_frame).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% request GET danh sách category trả về đúng và đủ trong vòng 500ms.
- **SC-002**: 100% request từ Guest/Volunteer/Staff chỉ trả về category active.
- **SC-003**: 100% request từ Manager/Admin trả về tất cả category (active + inactive).

## Assumptions

- Middleware xác thực JWT và phân quyền đã hoạt động.
- Bảng Category đã có trong schema.

---

## Out of Scope

- **Thêm mới category**: Thuộc UC32.
- **Chỉnh sửa category**: Thuộc UC33.
- **Phân trang**: Không cần thiết ở v1 do số lượng category ít.
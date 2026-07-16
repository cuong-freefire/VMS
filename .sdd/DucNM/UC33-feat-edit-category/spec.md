# Feature Specification: Edit Category (UC33)

**Feature Branch**: `feat/uc33-edit-category`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Manager cần chỉnh sửa thông tin danh mục trong hệ thống VMS."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manager chỉnh sửa category thành công (Priority: P1)

Manager muốn cập nhật tên, mô tả hoặc vô hiệu hóa một danh mục.

**Why this priority**: Chức năng cốt lõi — Manager cần cập nhật danh mục khi có thay đổi.

**Independent Test**: Gọi `PATCH /api/v1/categories/:id` với body hợp lệ và token Manager, kiểm tra response trả về 200 OK.

**Acceptance Scenarios**:

1. **Given** Manager đã đăng nhập và category hợp lệ tồn tại, **When** Manager cập nhật tên và mô tả, **Then** hệ thống cập nhật thành công, trả về HTTP 200.
2. **Given** Manager muốn vô hiệu hóa category, **When** Manager set is_active = false, **Then** hệ thống vô hiệu hóa category.

---

### User Story 2 - Validate dữ liệu (Priority: P2)

**Independent Test**: Gọi `PATCH /api/v1/categories/:id` với tên trùng, kiểm tra HTTP 409.

**Acceptance Scenarios**:

1. **Given** Manager đổi tên category thành tên đã tồn tại trong cùng type, **When** Manager submit, **Then** hệ thống trả về HTTP 409.

---

### User Story 3 - Chặn truy cập (Priority: P1)

**Independent Test**: Gọi `PATCH /api/v1/categories/:id` với token Staff, kiểm tra HTTP 403.

**Acceptance Scenarios**:

1. **Given** Staff đã đăng nhập, **When** Staff gửi request, **Then** HTTP 403.
2. **Given** Guest chưa đăng nhập, **When** Guest gửi request, **Then** HTTP 401.

---

### Edge Cases

- Category ID không tồn tại? → HTTP 404.
- Request body rỗng? → HTTP 400.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cho phép Manager/Admin cập nhật category qua `PATCH /api/v1/categories/:id`.
- **FR-002**: System MUST cho phép cập nhật: name, description, is_active.
- **FR-003**: System MUST KHÔNG cho phép đổi type.
- **FR-004**: System MUST kiểm tra tên unique trong cùng type khi đổi tên.
- **FR-005**: System MUST trả về HTTP 404 khi ID không tồn tại.
- **FR-006**: System MUST từ chối Staff (403), Volunteer (403), Guest (401).

### Key Entities *(Business Level Only)*

- **Category (Danh mục)**: Tên, mô tả, trạng thái active/inactive.

## Success Criteria *(mandatory)*

- **SC-001**: 100% request chỉnh sửa hợp lệ thành công trong vòng 1 giây.
- **SC-002**: 100% request với tên trùng bị từ chối HTTP 409.

## Assumptions

- Middleware xác thực JWT và phân quyền đã hoạt động.

---

## Out of Scope

- **Xóa cứng category**: Chỉ sử dụng soft-delete.
- **Đổi type category**: Không được phép.
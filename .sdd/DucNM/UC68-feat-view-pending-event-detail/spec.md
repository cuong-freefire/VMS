# Feature Specification: View Pending Event Detail (UC68)

**Feature Branch**: `feat/uc68-view-pending-event-detail`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Manager cần xem chi tiết sự kiện đang chờ duyệt để đánh giá trước khi phê duyệt hoặc từ chối."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manager xem chi tiết sự kiện PENDING (Priority: P1)

Manager muốn xem đầy đủ thông tin của một sự kiện đang chờ duyệt để đánh giá.

**Why this priority**: Đây là bước bắt buộc trước khi phê duyệt — Manager cần thông tin để ra quyết định.

**Independent Test**: Tạo một event với status PENDING, gọi `GET /api/v1/events/:id` với token Manager, kiểm tra response trả về đầy đủ thông tin.

**Acceptance Scenarios**:

1. **Given** Manager đã đăng nhập và sự kiện PENDING có ID hợp lệ, **When** Manager truy cập chi tiết, **Then** hệ thống hiển thị đầy đủ: tên, mô tả, tổ chức, danh mục, ngày giờ, địa điểm, sức chứa, kỹ năng yêu cầu, người tạo, trạng thái.
2. **Given** Manager truy cập sự kiện không tồn tại, **When** Manager gửi request, **Then** HTTP 404.

---

### User Story 2 - Chặn truy cập (Priority: P1)

Staff, Volunteer, Guest không có quyền xem chi tiết sự kiện PENDING.

**Acceptance Scenarios**:

1. **Given** Staff đã đăng nhập, **When** Staff gửi request, **Then** HTTP 403.
2. **Given** Guest chưa đăng nhập, **When** Guest gửi request, **Then** HTTP 401.

---

### Edge Cases

- Event ID không hợp lệ? → HTTP 400.
- Event không phải PENDING? → Manager vẫn có thể xem (Manager có quyền xem mọi status).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cho phép Manager/Admin xem chi tiết sự kiện qua `GET /api/v1/events/:id` (tái sử dụng UC09).
- **FR-002**: System MUST trả về HTTP 404 khi event ID không tồn tại.
- **FR-003**: System MUST hiển thị thông tin người tạo (created_by).
- **FR-004**: System MUST từ chối Staff (403), Volunteer (403), Guest (401).

### Key Entities *(Business Level Only)*

- **Event (Sự kiện)**: Chi tiết sự kiện bao gồm tất cả thông tin nghiệp vụ.

## Success Criteria *(mandatory)*

- **SC-001**: 100% request xem chi tiết event hợp lệ trả về đúng thông tin trong vòng 500ms.
- **SC-002**: 100% request từ role không có quyền bị từ chối.

## Assumptions

- Endpoint GET /api/v1/events/:id đã có từ UC09.
- Middleware xác thực JWT và phân quyền đã hoạt động.

---

## Out of Scope

- **Phê duyệt/từ chối sự kiện từ trang chi tiết**: Thuộc UC69/UC70.
- **Chỉnh sửa sự kiện PENDING**: Thuộc UC16 (Edit Event) — Staff chủ động sửa trước khi duyệt.
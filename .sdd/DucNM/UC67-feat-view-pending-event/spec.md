# Feature Specification: View Pending Event (UC67)

**Feature Branch**: `feat/uc67-view-pending-event`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Manager cần xem danh sách sự kiện đang chờ duyệt trong hệ thống VMS."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manager xem danh sách sự kiện PENDING (Priority: P1)

Manager muốn xem danh sách tất cả sự kiện đang chờ duyệt để tiến hành phê duyệt hoặc từ chối.

**Why this priority**: Đây là entry point của toàn bộ module Event Approval — không có danh sách, Manager không thể xử lý sự kiện.

**Independent Test**: Tạo ít nhất 2 event với status PENDING, gọi `GET /api/v1/events?status=pending` với token Manager, kiểm tra response trả về chính xác.

**Acceptance Scenarios**:

1. **Given** Manager đã đăng nhập và hệ thống có 3 sự kiện PENDING + 2 sự kiện APPROVED, **When** Manager truy cập danh sách PENDING, **Then** hệ thống chỉ hiển thị 3 sự kiện PENDING với thông tin: tên, tổ chức, ngày tạo, trạng thái.
2. **Given** không có sự kiện PENDING nào, **When** Manager truy cập, **Then** hệ thống trả về danh sách rỗng.

---

### User Story 2 - Chặn truy cập với người dùng không có quyền (Priority: P1)

Staff, Volunteer và Guest không có quyền xem danh sách sự kiện PENDING.

**Independent Test**: Gọi `GET /api/v1/events?status=pending` với token Staff/Volunteer hoặc không có token, kiểm tra HTTP 403 hoặc 401.

**Acceptance Scenarios**:

1. **Given** Staff đã đăng nhập, **When** Staff gửi request, **Then** HTTP 403.
2. **Given** Guest chưa đăng nhập, **When** Guest gửi request, **Then** HTTP 401.

---

### Edge Cases

- Tham số page/limit không hợp lệ? → HTTP 400.
- Database không phản hồi? → HTTP 500.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trả về danh sách sự kiện PENDING khi Manager/Admin gọi `GET /api/v1/events?status=pending`.
- **FR-002**: System MUST hỗ trợ phân trang (page, limit) — mặc định limit = 20.
- **FR-003**: System MUST trả về thông tin: event_id, title, organization, created_at, status.
- **FR-004**: System MUST từ chối Staff (403), Volunteer (403), Guest (401).

### Key Entities *(Business Level Only)*

- **Event (Sự kiện)**: Sự kiện tình nguyện đang chờ duyệt. Status = PENDING.

## Success Criteria *(mandatory)*

- **SC-001**: 100% request GET danh sách PENDING từ Manager trả về đúng và đủ trong vòng 500ms.
- **SC-002**: 100% request từ role không có quyền bị từ chối đúng HTTP status code.

## Assumptions

- Middleware xác thực JWT và phân quyền đã hoạt động.
- Bảng Event đã có trường status.

---

## Out of Scope

- **Xem chi tiết sự kiện PENDING**: Thuộc UC68.
- **Phê duyệt sự kiện**: Thuộc UC69.
- **Từ chối sự kiện**: Thuộc UC70.
# Feature Specification: View Notification Detail (UC42)

**Feature Branch**: `feat/uc42-view-notification-detail`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Người dùng cần xem nội dung đầy đủ của một thông báo cụ thể."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem chi tiết thông báo (Priority: P1)

Người dùng click vào một thông báo trong danh sách để xem nội dung đầy đủ và được chuyển hướng đến entity liên quan nếu có.

**Why this priority**: Đây là luồng tương tác cốt lõi — người dùng click vào notification để xem chi tiết và hành động.

**Independent Test**: Gọi `GET /api/v1/notifications/1` với token user sở hữu, kiểm tra response chứa đầy đủ thông tin.

**Acceptance Scenarios**:

1. **Given** user có notification ID = 1 thuộc về mình (có reference_type = "event", reference_id = 5), **When** user click vào notification, **Then** hệ thống hiển thị tiêu đề, nội dung, loại, thời gian, và link dẫn đến event ID = 5.
2. **Given** user có notification không có tham chiếu entity, **When** user xem chi tiết, **Then** hệ thống chỉ hiển thị thông tin notification, không có link điều hướng.
3. **Given** user có notification tham chiếu đến entity đã bị xóa mềm, **When** user xem chi tiết, **Then** hệ thống hiển thị notification kèm text "[Đã xóa]" thay vì link.
4. **Given** user cố gắng xem notification của user khác, **When** user gửi request, **Then** hệ thống trả về HTTP 404.

---

### Edge Cases

- Điều gì xảy ra khi `id` không phải số nguyên? → HTTP 400.
- Điều gì xảy ra khi ID notification không tồn tại? → HTTP 404.
- Điều gì xảy ra khi Guest cố gắng xem chi tiết? → HTTP 401.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cung cấp endpoint `GET /api/v1/notifications/:id` trả về chi tiết notification.
- **FR-002**: System MUST kiểm tra notification thuộc về user hiện tại — nếu không, HTTP 404.
- **FR-003**: System MUST trả về đầy đủ: title, message, type, reference_type, reference_id, is_read, created_at.
- **FR-004**: WHERE reference entity tồn tại, System MUST trả kèm thông tin tóm tắt của entity (tên sự kiện, tên user, v.v.) để Frontend hiển thị.
- **FR-005**: WHERE reference entity đã bị xóa mềm, System MUST trả về `reference_deleted: true`.
- **FR-006**: System MUST từ chối Guest với HTTP 401.

### Key Entities *(Business Level Only)*

- **Notification (Thông báo)**: Chi tiết nội dung đầy đủ. Có thể tham chiếu đến Event, Application, hoặc Certificate.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Chi tiết notification trả về trong vòng 300ms.
- **SC-002**: 100% request từ user không sở hữu bị từ chối HTTP 404.

## Assumptions

- Thông tin tóm tắt của entity tham chiếu (tên sự kiện) được lấy từ service layer tương ứng.
- Khi reference entity bị xóa mềm, chỉ cần báo deleted = true, không cần hiển thị thông tin.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC42 và KHÔNG được implement:

- **Đánh dấu đã đọc**: Gộp vào UC42 nhưng nếu muốn tách riêng, xem UC43.
- **Xóa notification**: Không có chức năng xóa.
- **Reply vào notification**: Notification là một chiều.

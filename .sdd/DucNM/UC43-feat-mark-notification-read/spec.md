# Feature Specification: Mark Notification As Read (UC43)

**Feature Branch**: `feat/uc43-mark-notification-read`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Người dùng cần đánh dấu thông báo là đã đọc sau khi xem, và có thể đánh dấu tất cả thông báo là đã đọc một lần."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Đánh dấu một thông báo là đã đọc (Priority: P1)

Người dùng sau khi xem chi tiết một thông báo, muốn đánh dấu nó là đã đọc để badge unread count giảm xuống.

**Why this priority**: Đây là luồng cơ bản nhất của trạng thái notification — nếu không đánh dấu được, badge sẽ luôn hiển thị số sai.

**Independent Test**: Tạo một notification với `is_read: false`, gọi `PATCH /api/v1/notifications/1/read`, kiểm tra response và sau đó gọi GET detail kiểm tra `is_read: true`.

**Acceptance Scenarios**:

1. **Given** user có một thông báo chưa đọc (is_read = false) thuộc về mình, **When** user click vào notification để xem, **Then** hệ thống tự động đánh dấu is_read = true và unread count trên badge giảm 1.
2. **Given** user cố gắng đánh dấu notification đã đọc trước đó (is_read = true), **When** user gửi request, **Then** hệ thống vẫn trả về thành công (idempotent — không báo lỗi).
3. **Given** user cố gắng đánh dấu notification của người khác, **When** user gửi request, **Then** hệ thống trả về HTTP 404.

---

### User Story 2 - Đánh dấu tất cả thông báo là đã đọc (Priority: P2)

Người dùng có nhiều thông báo chưa đọc muốn đánh dấu tất cả là đã đọc một lần thay vì từng cái.

**Why this priority**: Tiện lợi cho người dùng nhưng không blocking. Có thể làm sau các chức năng P1.

**Independent Test**: Tạo 5 notification chưa đọc cho user, gọi `PATCH /api/v1/notifications/read-all`, kiểm tra tất cả đều thành `is_read: true`.

**Acceptance Scenarios**:

1. **Given** user có 5 thông báo chưa đọc, **When** user nhấn "Đánh dấu tất cả là đã đọc", **Then** hệ thống đánh dấu cả 5 là đã đọc, trả về số lượng đã cập nhật, và badge về 0.
2. **Given** user không có thông báo chưa đọc nào, **When** user nhấn "Đánh dấu tất cả", **Then** hệ thống trả về thành công (không có gì để cập nhật) — không báo lỗi.

---

### Edge Cases

- Điều gì xảy ra khi ID notification không tồn tại? → HTTP 404.
- Điều gì xảy ra khi Guest gọi API? → HTTP 401.
- Điều gì xảy ra khi notification đã được đánh dấu đọc trước đó? → Idempotent — trả về thành công.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cung cấp endpoint `PATCH /api/v1/notifications/:id/read` để đánh dấu một notification là đã đọc.
- **FR-002**: System MUST cung cấp endpoint `PATCH /api/v1/notifications/read-all` để đánh dấu tất cả notification của user là đã đọc.
- **FR-003**: System MUST đảm bảo idempotent — đánh dấu notification đã đọc không gây lỗi.
- **FR-004**: System MUST kiểm tra quyền sở hữu — chỉ chủ sở hữu mới đánh dấu được, người khác HTTP 404.
- **FR-005**: System MUST trả về HTTP 200 khi thành công, kèm số lượng notification đã cập nhật (cho bulk).
- **FR-006**: System MUST từ chối Guest với HTTP 401.

### Key Entities *(Business Level Only)*

- **Notification (Thông báo)**: Trạng thái is_read được cập nhật từ false → true.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Đánh dấu 1 notification hoàn tất trong vòng 200ms.
- **SC-002**: Đánh dấu tất cả 100 notification hoàn tất trong vòng 500ms.
- **SC-003**: 100% request từ người không sở hữu bị từ chối HTTP 404.

## Assumptions

- Thao tác đánh dấu đã đọc không cần audit log.
- Khi xem chi tiết notification (UC42), tự động đánh dấu đã đọc luôn (có thể gộp).

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC43 và KHÔNG được implement:

- **Đánh dấu chưa đọc (un-read)**: Luồng một chiều — không cho phép quay lại.
- **Xóa notification**: Không có.
- **Chọn nhiều notification để đánh dấu**: Chỉ hỗ trợ từng cái hoặc tất cả.

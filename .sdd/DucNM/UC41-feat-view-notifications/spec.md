# Feature Specification: View Notifications (UC41)

**Feature Branch**: `feat/uc41-view-notifications`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Người dùng đã đăng nhập cần xem danh sách thông báo của mình, sắp xếp mới nhất ở trên cùng, kèm badge đếm số thông báo chưa đọc."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem danh sách thông báo có phân trang (Priority: P1)

Người dùng muốn xem tất cả thông báo của mình, sắp xếp mới nhất lên đầu, và thấy rõ thông báo nào đã đọc/chưa đọc.

**Why this priority**: Entry point của module Notification — người dùng không thể tương tác với thông báo nếu không thấy danh sách.

**Independent Test**: Tạo notification trong database cho user A, gọi `GET /api/v1/notifications` với token user A, kiểm tra danh sách trả về đúng.

**Acceptance Scenarios**:

1. **Given** user đã đăng nhập và có 5 thông báo (3 chưa đọc, 2 đã đọc), **When** user truy cập trang danh sách thông báo, **Then** hệ thống hiển thị tất cả 5 thông báo, sắp xếp mới nhất lên đầu, thông báo chưa đọc được in đậm.
2. **Given** user không có thông báo nào, **When** user truy cập danh sách, **Then** hệ thống hiển thị "Chưa có thông báo nào."
3. **Given** user muốn xem thêm thông báo cũ hơn, **When** user nhấn "Xem thêm" hoặc chuyển trang, **Then** hệ thống tải thêm 20 thông báo tiếp theo.
4. **Given** Guest chưa đăng nhập, **When** Guest cố gắng truy cập API, **Then** hệ thống trả về HTTP 401.

---

### User Story 2 - Xem số lượng thông báo chưa đọc (Priority: P1)

Người dùng muốn thấy badge trên navbar cho biết có bao nhiêu thông báo chưa đọc, để biết có tin mới mà không cần vào trang danh sách.

**Why this priority**: Badge unread count là tính năng quan trọng giúp người dùng phát hiện thông báo mới nhanh chóng.

**Independent Test**: Đánh dấu 3 notification của user là chưa đọc, gọi `GET /api/v1/notifications/unread-count`, kiểm tra response `{ unread_count: 3 }`.

**Acceptance Scenarios**:

1. **Given** user có 3 thông báo chưa đọc, **When** user nhìn vào icon notification trên navbar, **Then** icon hiển thị badge số "3".
2. **Given** user không có thông báo chưa đọc, **When** user nhìn vào icon notification, **Then** badge không hiển thị (hoặc hiển thị 0).
3. **Given** user vừa nhận thông báo mới từ polling, **When** Frontend gọi unread-count, **Then** unread_count được cập nhật và badge tăng lên.

---

### Edge Cases

- Điều gì xảy ra khi page vượt quá tổng số trang? → Trả về danh sách rỗng với page hiện tại và total_pages.
- Điều gì xảy ra khi limit truyền vào là số âm? → HTTP 400.
- Điều gì xảy ra khi user không có quyền xem notification của user khác? → HTTP 404 (không tiết lộ sự tồn tại).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cung cấp endpoint `GET /api/v1/notifications` trả về danh sách notification của user hiện tại.
- **FR-002**: System MUST hỗ trợ phân trang qua params `page` và `limit` (mặc định limit = 20).
- **FR-003**: System MUST sắp xếp notification theo `created_at DESC` (mới nhất trên cùng).
- **FR-004**: System MUST trả về trạng thái `is_read` của mỗi notification.
- **FR-005**: System MUST cung cấp endpoint `GET /api/v1/notifications/unread-count` trả về `{ unread_count: number }`.
- **FR-006**: System MUST từ chối Guest với HTTP 401.
- **FR-007**: System MUST trả về mảng rỗng và `total_pages = 0` khi không có notification.

### Key Entities *(Business Level Only)*

- **Notification (Thông báo)**: Tin nhắn hệ thống gửi đến người dùng. Thuộc tính hiển thị: title, message, type, created_at, is_read, reference_type, reference_id.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Danh sách 100 notification tải trong vòng 1 giây.
- **SC-002**: Badge unread count cập nhật trong vòng 30 giây (polling interval).
- **SC-003**: 100% request không phải của user sở hữu bị từ chối.

## Assumptions

- Frontend polling mỗi 30 giây đến endpoint unread-count.
- Không có real-time (WebSocket/SSE) trong v1.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC41 và KHÔNG được implement:

- **Xóa notification**: Chỉ đánh dấu đã đọc (UC43).
- **Push notification (FCM/APNs)**: Không có trong v1.
- **Email notification**: Thuộc Module 15 (Email Services).
- **Real-time notification**: Dùng polling.

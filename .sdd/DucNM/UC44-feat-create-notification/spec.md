# Feature Specification: Create Notification (UC44)

**Feature Branch**: `feat/uc44-create-notification`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Staff/Admin cần tạo thông báo gửi đến một hoặc nhiều người dùng, và hệ thống tự động sinh thông báo khi có sự kiện quan trọng."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Staff gửi thông báo đến volunteer trong sự kiện (Priority: P1)

Staff muốn gửi thông báo nhắc nhở đến tất cả volunteer đã đăng ký sự kiện sắp diễn ra.

**Why this priority**: Đây là nhu cầu chính của Staff — giao tiếp với volunteer tham gia sự kiện.

**Independent Test**: Tạo event và 3 application approved cho event đó. Staff quản lý event gọi `POST /api/v1/notifications` với user_ids của 3 volunteer, kiểm tra HTTP 201 và cả 3 user đều nhận được notification.

**Acceptance Scenarios**:

1. **Given** Staff quản lý event ID = 5, event có 3 volunteer đã approved, **When** Staff tạo notification với title "Sự kiện sắp diễn ra", message "Ngày mai là sự kiện...", user_ids = [1,2,3], **Then** hệ thống tạo 3 notification, trả về HTTP 201 kèm `{ created: 3, skipped: [] }`.
2. **Given** Staff cố gắng gửi notification cho user không thuộc event mình quản lý, **When** Staff gửi user_ids = [1, 999], **Then** hệ thống chỉ tạo cho user hợp lệ (1), bỏ qua user 999, trả về `{ created: 1, skipped: [999] }`.
3. **Given** Staff gửi notification với user_ids rỗng, **When** Staff submit, **Then** hệ thống trả về HTTP 400 với message "Danh sách người nhận không được để trống."

---

### User Story 2 - Admin gửi thông báo toàn hệ thống (Priority: P1)

Admin muốn gửi thông báo đến bất kỳ user nào trong hệ thống, không giới hạn phạm vi.

**Why this priority**: Admin cần quyền cao nhất để gửi thông báo toàn hệ thống khi cần.

**Independent Test**: Gọi `POST /api/v1/notifications` với token Admin, user_ids bất kỳ, kiểm tra tất cả đều được tạo.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập, **When** Admin gửi notification đến 10 user bất kỳ (cả Staff, Volunteer), **Then** hệ thống tạo notification cho tất cả 10 user, không kiểm tra phạm vi quản lý.
2. **Given** Admin gửi notification đến user_id không tồn tại, **When** Admin submit, **Then** hệ thống bỏ qua user không tồn tại, vẫn tạo cho các user hợp lệ.

---

### User Story 3 - Hệ thống tự động sinh notification (Priority: P1)

Khi một application được approved/rejected hoặc certificate được issued, hệ thống tự động tạo notification cho user liên quan.

**Why this priority**: Notification tự động giảm tải cho Staff, đảm bảo user luôn được thông báo kịp thời.

**Independent Test**: Giả lập việc approve application, kiểm tra notification được tạo tự động cho volunteer.

**Acceptance Scenarios**:

1. **Given** Staff vừa approve application của volunteer, **When** hệ thống cập nhật trạng thái application, **Then** hệ thống tự động tạo notification type "application_approved" gửi đến volunteer đó.
2. **Given** Certificate vừa được generate cho volunteer, **When** hệ thống issue certificate, **Then** hệ thống tự động tạo notification type "certificate_issued" gửi đến volunteer.

---

### Edge Cases

- Điều gì xảy ra khi user_ids chứa quá 500 user? → HTTP 400 "Tối đa 500 người nhận."
- Điều gì xảy ra khi Guest hoặc Volunteer cố gắng tạo notification? → HTTP 401/403.
- Điều gì xảy ra khi title hoặc message quá dài? → HTTP 400 với message giới hạn ký tự.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cung cấp endpoint `POST /api/v1/notifications` cho Staff/Admin tạo thủ công.
- **FR-002**: System MUST validate: title (required, max 200), message (required, max 2000), user_ids (required, array, max 500, min 1), type (required, enum), reference_type (optional), reference_id (optional).
- **FR-003**: WHERE Staff tạo, System MUST kiểm tra từng user_id có thuộc event Staff quản lý không. Bỏ qua user không hợp lệ.
- **FR-004**: WHERE Admin tạo, System MUST bỏ qua user_id không tồn tại hoặc inactive.
- **FR-005**: System MUST trả về HTTP 201 kèm `{ created: number, skipped: number[] }`.
- **FR-006**: WHERE tự động sinh notification (từ module khác), System MUST gọi NotificationService để tạo record.
- **FR-007**: System MUST ghi audit log cho notification do Staff/Admin tạo thủ công.
- **FR-008**: System MUST từ chối Guest (401) và Volunteer (403).

### Key Entities *(Business Level Only)*

- **Notification (Thông báo)**: Được tạo thủ công bởi Staff/Admin hoặc tự động bởi hệ thống.
- **User (Người dùng)**: Người nhận notification. Một notification được tạo riêng cho mỗi user trong danh sách.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Tạo notification cho 500 user hoàn thành trong vòng 3 giây.
- **SC-002**: 100% request Staff tạo notification kiểm tra phạm vi quản lý.
- **SC-003**: 100% notification tự động được tạo trong vòng 1 giây sau sự kiện kích hoạt.

## Assumptions

- Module Application, Event, Certificate đã gọi NotificationService khi cần tạo notification tự động.
- NotificationService là service riêng, có thể được gọi từ các service khác.
- Không có scheduled/delayed notification — tạo và gửi ngay lập tức.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC44 và KHÔNG được implement:

- **Push notification (FCM/APNs)**: Chỉ in-app notification.
- **Email notification**: Thuộc Module 15.
- **Scheduled notification (gửi theo lịch)**: Notification được gửi ngay lập tức.
- **Notification template**: Không có template — Staff/Admin nhập nội dung thủ công.
- **Gửi notification cho toàn bộ user trong event mặc định**: Staff phải chọn user cụ thể.

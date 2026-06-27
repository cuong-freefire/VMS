# Feature Specification: Notification Management (UC41–UC44)

**Feature Branch**: `feat/notification-management`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Hệ thống cần module thông báo trong ứng dụng (in-app notification) cho phép người dùng xem thông báo, đánh dấu đã đọc, và Staff/Admin tạo thông báo mới."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem danh sách thông báo (Priority: P1)

Là một người dùng (Volunteer, Staff, Manager, Admin), tôi muốn xem danh sách tất cả thông báo của mình, sắp xếp mới nhất ở trên cùng, để không bỏ lỡ thông tin quan trọng về sự kiện và trạng thái đơn đăng ký.

**Why this priority**: Đây là chức năng entry point — người dùng không thể tương tác với thông báo nếu không thấy danh sách. Không có chức năng này, toàn bộ module Notification vô dụng.

**Independent Test**: Có thể test độc lập bằng cách tạo dữ liệu notification cho một user trong database, gọi API GET /api/v1/notifications với token user đó, và kiểm tra danh sách trả về đúng.

**Acceptance Scenarios**:

1. **Given** user đã đăng nhập và có ít nhất 5 thông báo (3 chưa đọc, 2 đã đọc), **When** user truy cập trang danh sách thông báo, **Then** hệ thống hiển thị tất cả thông báo, sắp xếp mới nhất lên đầu, và thông báo chưa đọc được đánh dấu nổi bật (bold/badge).

2. **Given** user có 1 thông báo chưa đọc, **When** user nhìn vào icon notification trên navbar/header, **Then** icon hiển thị badge số "1" báo hiệu có thông báo mới.

3. **Given** user không có thông báo nào, **When** user truy cập trang danh sách thông báo, **Then** hệ thống hiển thị thông báo "Chưa có thông báo nào."

4. **Given** user chưa đăng nhập (Guest), **When** Guest cố gắng truy cập API notifications, **Then** hệ thống trả về HTTP 401 Unauthorized.

5. **Given** user có notification tham chiếu đến một event (reference_type = "event"), **When** user thấy notification này trong danh sách, **Then** notification hiển thị tên event (hoặc "Sự kiện không tồn tại" nếu event đã bị xóa).

---

### User Story 2 - Xem chi tiết thông báo và đánh dấu đã đọc (Priority: P1)

Là một người dùng, khi tôi click vào một thông báo chưa đọc, tôi muốn xem nội dung đầy đủ và thông báo tự động được đánh dấu là đã đọc, để tôi không phải kiểm tra lại lần sau.

**Why this priority**: Luồng tương tác cốt lõi của notification — người dùng click → xem → đánh dấu đã đọc. Đây là vòng đời cơ bản của mọi hệ thống notification.

**Independent Test**: Test độc lập bằng cách gọi API GET /api/v1/notifications/:id và kiểm tra response trả về thông tin chi tiết + PATCH /api/v1/notifications/:id/read để đánh dấu đã đọc.

**Acceptance Scenarios**:

1. **Given** user có một thông báo chưa đọc với `is_read: false`, **When** user click vào thông báo đó để xem chi tiết, **Then** hệ thống hiển thị nội dung đầy đủ (tiêu đề, nội dung, thời gian, loại thông báo, entity tham chiếu) và tự động chuyển `is_read` thành `true`.

2. **Given** user đã click xem chi tiết một thông báo, **When** user quay lại danh sách thông báo, **Then** thông báo đó không còn được đánh dấu nổi bật (không bold) và badge unread count giảm đi 1.

3. **Given** user có thông báo tham chiếu đến một entity (ví dụ: application_id), **When** user click vào notification, **Then** hệ thống chuyển hướng user đến trang chi tiết của entity đó (ví dụ: Application Detail).

4. **Given** user cố gắng xem chi tiết notification của user khác, **When** user gửi request với notification_id không thuộc về mình, **Then** hệ thống trả về HTTP 404 hoặc 403.

---

### User Story 3 - Đánh dấu tất cả thông báo là đã đọc (Priority: P2)

Là một người dùng, sau khi đã xem qua tất cả thông báo, tôi muốn đánh dấu tất cả là đã đọc chỉ với một thao tác, để làm sạch danh sách thông báo chưa đọc.

**Why this priority**: Đây là UX convenience giúp người dùng tiết kiệm thời gian. Không phải chức năng blocking nhưng cải thiện đáng kể trải nghiệm.

**Independent Test**: Test độc lập bằng cách gọi API PATCH /api/v1/notifications/read-all và kiểm tra tất cả notification của user đều có `is_read: true`.

**Acceptance Scenarios**:

1. **Given** user có 5 thông báo chưa đọc, **When** user nhấn nút "Đánh dấu tất cả đã đọc", **Then** hệ thống cập nhật tất cả notification của user thành `is_read: true`, badge về 0, và hiển thị toast "Đã đánh dấu tất cả thông báo là đã đọc."

2. **Given** user không có thông báo chưa đọc nào, **When** user nhấn nút "Đánh dấu tất cả đã đọc", **Then** hệ thống hiển thị thông báo "Không có thông báo chưa đọc."

3. **Given** API xử lý 1000 notification chưa đọc cho một user, **When** user nhấn "Đánh dấu tất cả đã đọc", **Then** hệ thống xử lý thành công trong vòng 5 giây và badge unread count về 0.

---

### User Story 4 - Tạo thông báo mới (Staff/Admin) (Priority: P1)

Là Staff/Admin, tôi muốn tạo thông báo mới gửi đến một hoặc nhiều người dùng để thông báo về thông tin sự kiện quan trọng.

**Why this priority**: Đây là chức năng gửi thông báo chủ động — cho phép Staff giao tiếp với volunteer qua hệ thống. Nếu không có chức năng này, module Notification chỉ có thông báo tự động và không cho phép liên lạc chủ động.

**Independent Test**: Test độc lập bằng cách gọi API POST /api/v1/notifications với token Staff/Admin, body chứa user_ids và nội dung, kiểm tra response 201 và notification được tạo trong database.

**Acceptance Scenarios**:

1. **Given** Staff đã đăng nhập và quản lý event có ID = 5 với 10 volunteer đã đăng ký, **When** Staff tạo notification với tiêu đề "Nhắc nhở sự kiện ngày mai" và chọn gửi đến tất cả volunteer của event, **Then** hệ thống tạo 10 notification records (mỗi user 1 record), trả về HTTP 201 với số lượng notification đã tạo.

2. **Given** Admin muốn gửi thông báo hệ thống, **When** Admin tạo notification và chọn nhiều user bằng cách nhập danh sách user_ids, **Then** hệ thống tạo notification cho từng user và trả về HTTP 201.

3. **Given** Staff nhập tiêu đề để trống, **When** Staff submit form, **Then** hệ thống hiển thị lỗi validation "Tiêu đề thông báo là bắt buộc."

4. **Given** Staff chọn danh sách user_ids rỗng, **When** Staff submit, **Then** hệ thống hiển thị lỗi "Phải chọn ít nhất một người nhận."

5. **Given** Staff cố gắng tạo notification với user_id không tồn tại trong danh sách, **When** Staff submit, **Then** hệ thống bỏ qua user_id không hợp lệ và chỉ tạo cho các user_id hợp lệ, trả về response kèm danh sách user_id bị bỏ qua.

6. **Given** Volunteer cố gắng tạo notification, **When** Volunteer gửi POST request, **Then** hệ thống trả về HTTP 403 Forbidden.

---

### User Story 5 - Xem số lượng thông báo chưa đọc (badge) (Priority: P2)

Là một người dùng đã đăng nhập, tôi muốn thấy số lượng thông báo chưa đọc (badge) trên icon notification ngay trên navbar để biết có tin mới mà không cần vào trang notification.

**Why this priority**: Tính năng này cho phép người dùng phát hiện thông báo mới nhanh chóng. Là chức năng UX quan trọng nhưng không blocking.

**Independent Test**: Test độc lập bằng cách gọi API GET /api/v1/notifications/unread-count và kiểm tra response trả về số lượng notification chưa đọc.

**Acceptance Scenarios**:

1. **Given** user có 3 thông báo chưa đọc và đã đăng nhập, **When** user ở bất kỳ trang nào trên hệ thống, **Then** navbar hiển thị badge "3" trên icon notification.

2. **Given** user vừa đọc một thông báo (unread count giảm từ 3 xuống 2), **When** user nhìn lại navbar, **Then** badge cập nhật xuống "2" (không cần refresh trang).

3. **Given** user không có thông báo chưa đọc, **When** hệ thống hiển thị navbar, **Then** không hiển thị badge (hoặc hiển thị badge số 0 ẩn).

4. **Given** Frontend đang polling API unread-count mỗi 30 giây, **When** một notification mới được tạo cho user này giữa polling cycle, **Then** trong tối đa 30 giây sau, badge sẽ cập nhật số mới.

---

### Edge Cases

- **Xóa notification:** Không có chức năng xóa notification trong VMS v1. User chỉ có thể đánh dấu đã đọc.
- **Notification reference entity bị xóa:** Khi entity tham chiếu (event/application/certificate) bị soft-delete, notification vẫn tồn tại. Khi user click vào notification, hệ thống hiển thị thông báo "Sự kiện không còn tồn tại" thay vì chuyển hướng lỗi.
- **Concurrent mark-as-read:** Nếu user click vào notification từ 2 tab cùng lúc, hệ thống vẫn xử lý đúng — không tạo duplicate action.
- **Massive notification creation:** Không giới hạn số lượng user có thể nhận notification trong một lần tạo. Nhưng số lượng user tối đa cho Bulk Notification là 500/lần để tránh timeout. Staff phải chia nhỏ nếu hơn 500.
- **Notification cho user inactive:** User đã inactive vẫn giữ notification cũ nhưng không nhận notification mới.

---

## Requirements *(mandatory)*

### Functional Requirements

#### UC41 — Xem danh sách thông báo (View Notifications)

- **FR-001**: THE system SHALL trả về danh sách notification của user hiện tại, sắp xếp theo `created_at` DESC (mới nhất lên đầu).
- **FR-002**: THE system SHALL hỗ trợ phân trang (pagination) với page và limit, mặc định 20 items/trang.
- **FR-003**: THE system SHALL đánh dấu thông báo chưa đọc (`is_read: false`) với style nổi bật (bold) trong danh sách.
- **FR-004**: WHERE notification có `reference_type` và `reference_id`, THE system SHALL hiển thị tên của entity tham chiếu (ví dụ: tên event, tên application).
- **FR-005**: WHERE user chưa xác thực (Guest), THE system SHALL trả về HTTP 401.
- **FR-006**: WHERE không có notification nào, THE system SHALL trả về mảng rỗng kèm total = 0.

#### UC42 — Xem chi tiết thông báo (View Notification Detail)

- **FR-007**: THE system SHALL trả về thông tin chi tiết notification khi gọi GET /api/v1/notifications/:id, bao gồm: title, message, type, reference_type, reference_id, is_read, created_at.
- **FR-008**: WHERE notification_id không tồn tại hoặc không thuộc về user hiện tại, THE system SHALL trả về HTTP 404.
- **FR-009**: WHEN user xem chi tiết notification chưa đọc, THE system SHALL tự động chuyển `is_read` thành `true`.

#### UC43 — Đánh dấu thông báo đã đọc (Mark Notification As Read)

- **FR-010**: THE system SHALL cung cấp endpoint PATCH /api/v1/notifications/:id/read để đánh dấu một notification cụ thể là đã đọc.
- **FR-011**: THE system SHALL cung cấp endpoint PATCH /api/v1/notifications/read-all để đánh dấu tất cả notification của user là đã đọc.
- **FR-012**: THE system SHALL cập nhật unread count real-time trên badge sau mỗi lần đánh dấu đã đọc.
- **FR-013**: THE system SHALL cung cấp endpoint GET /api/v1/notifications/unread-count trả về số lượng notification có `is_read: false` của user.

#### UC44 — Tạo thông báo (Create Notification)

- **FR-014**: WHERE người dùng có role Staff hoặc Admin, THE system SHALL cho phép tạo notification với các trường: title (required), message (required), type (required), user_ids (required, array of user IDs, max 500), reference_type (optional), reference_id (optional).
- **FR-015**: THE system SHALL validate đầu vào bằng Zod trước khi tạo.
- **FR-016**: WHERE Staff tạo notification, THE system SHALL verify rằng user_ids chỉ bao gồm các user đã đăng ký sự kiện mà Staff đó quản lý.
- **FR-017**: WHERE user_id trong danh sách không tồn tại hoặc inactive, THE system SHALL bỏ qua user_id đó và vẫn tạo cho các user_id hợp lệ.
- **FR-018**: WHERE người dùng không có role Staff hoặc Admin, THE system SHALL trả về HTTP 403 Forbidden.
- **FR-019**: WHEN tạo notification thành công, THE system SHALL ghi audit log và trả về HTTP 201 kèm số lượng notification đã tạo và danh sách user_id bị bỏ qua (nếu có).

### Key Entities *(Business Level Only)*

- **Notification (Thông báo)**: Đại diện cho một tin nhắn hệ thống gửi đến một người dùng cụ thể. Thuộc tính: tiêu đề, nội dung, loại thông báo (system, event_reminder, application_approved, application_rejected, certificate_issued), trạng thái đọc/chưa đọc, tham chiếu đến entity khác (event, application, certificate).

- **User (Người dùng)**: Đại diện cho người nhận notification. Quan hệ: một User có nhiều Notification.

- **Event/Application/Certificate**: Các entity nghiệp vụ có thể được tham chiếu bởi Notification để tạo link dẫn đến trang chi tiết.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người dùng có thể xem danh sách thông báo với 100 notification trong vòng 1 giây.
- **SC-002**: Staff tạo bulk notification cho 500 user hoàn thành trong vòng 3 giây.
- **SC-003**: Badge unread count cập nhật trong vòng 30 giây (polling interval).
- **SC-004**: Tỷ lệ người dùng đọc notification trong vòng 24h sau khi nhận đạt 70% (theo dõi qua analytics).
- **SC-005**: 100% endpoint notification được document đầy đủ trong Swagger.

---

## Assumptions

- **A-001**: Bảng Notification đã có trong Prisma schema với đầy đủ trường cần thiết.
- **A-002**: Không có WebSocket/SSE — sử dụng polling 30 giây cho unread count.
- **A-003**: Module Application và Certificate đã implement xong và gọi NotificationService khi cần tạo thông báo tự động.
- **A-004**: Người dùng không thể xóa notification — chỉ đánh dấu đã đọc.
- **A-005**: Frontend đã có axiosApi với `withCredentials: true` để xử lý JWT cookie.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của feature này và KHÔNG được implement:

- **Push notification (FCM/APNs):** VMS v1 chỉ hỗ trợ in-app notification.
- **Email notification:** Sẽ được xử lý trong Module 15 (Email Services) riêng.
- **Xóa notification:** User không thể xóa — chỉ đánh dấu đã đọc.
- **Notification preferences (cài đặt loại thông báo muốn nhận):** Deferred đến phiên bản sau.
- **Scheduled notification (gửi thông báo vào thời gian chỉ định):** Notification được tạo và gửi ngay lập tức.
- **Real-time notification (WebSocket/SSE):** Quá phức tạp cho v1, dùng polling 30 giây.
- **Notification grouping/gộp thông báo cùng loại:** Mỗi notification là một record riêng.
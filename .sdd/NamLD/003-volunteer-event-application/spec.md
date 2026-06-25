# Feature Specification: Volunteer Event Application

**Feature Branch**: `feat/volunteer-event-application`

**Created**: 2026-06-25

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là một Volunteer của VMS, tôi muốn đăng ký tham gia một sự kiện tình nguyện sau khi xem chi tiết event để gửi đơn tham gia cho Staff review."

---

## User Scenarios & Testing

### User Story 1 - Volunteer mở form đăng ký event (Priority: P1)

Là Volunteer đã đăng nhập, tôi muốn mở form đăng ký từ Event Detail để bắt đầu gửi đơn tham gia event.

**Why this priority**: Đây là entry point chính của Apply Event flow. Nếu Volunteer không mở được form apply, họ không thể đăng ký tham gia event.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập bằng tài khoản Volunteer, mở Event Detail của event `OPEN`, rồi click Apply.

**Acceptance Scenarios**:

1. **Given** người dùng là Volunteer đã đăng nhập, **And** event có trạng thái `OPEN`, **When** người dùng click Apply từ Event Detail, **Then** hệ thống hiển thị Apply Event form.

2. **Given** người dùng là Volunteer đã đăng nhập, **And** event có trạng thái `OPEN`, **When** Apply Event form được hiển thị, **Then** form hiển thị thông tin tóm tắt của event để Volunteer xác nhận đúng event.

3. **Given** người dùng là Volunteer đã đăng nhập, **And** event còn slot, **When** Apply Event form được hiển thị, **Then** hệ thống cho phép Volunteer nhập thông tin đăng ký.

---

### User Story 2 - Chặn Guest hoặc user không hợp lệ submit application (Priority: P1)

Là hệ thống, tôi cần đảm bảo chỉ Volunteer đã đăng nhập mới được gửi application để tránh user không hợp lệ đăng ký event.

**Why this priority**: Apply Event là hành động thay đổi dữ liệu. Guest hoặc user không đúng role không được tạo application.

**Independent Test**: Có thể test độc lập bằng cách thử mở hoặc submit Apply Event khi chưa đăng nhập hoặc không phải Volunteer.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest chưa đăng nhập, **When** người dùng muốn apply event, **Then** hệ thống yêu cầu đăng nhập hoặc điều hướng sang Authentication flow.

2. **Given** người dùng đã đăng nhập nhưng không có role Volunteer, **When** người dùng cố submit application, **Then** hệ thống không cho submit và hiển thị thông báo phù hợp.

3. **Given** người dùng là Volunteer đã đăng nhập, **When** người dùng mở Apply Event form của event hợp lệ, **Then** hệ thống cho phép tiếp tục luồng đăng ký.

---

### User Story 3 - Chỉ cho apply event đủ điều kiện (Priority: P1)

Là Volunteer, tôi chỉ nên apply được các event còn mở đăng ký để tránh gửi đơn vào event đã đầy, đã diễn ra, đã đóng hoặc không public.

**Why this priority**: Đây là rule nghiệp vụ cốt lõi của Apply Event. Nếu hệ thống cho apply sai event, dữ liệu application sẽ bị lỗi và Staff phải xử lý thủ công.

**Independent Test**: Có thể test độc lập bằng cách thử apply event với nhiều status khác nhau.

**Acceptance Scenarios**:

1. **Given** event có trạng thái `OPEN` và còn slot, **When** Volunteer submit application hợp lệ, **Then** hệ thống cho phép tạo application.

2. **Given** event có trạng thái `FULL`, **When** Volunteer muốn apply, **Then** hệ thống không cho submit application và hiển thị rằng event đã đủ số lượng.

3. **Given** event có trạng thái `ONGOING`, **When** Volunteer muốn apply, **Then** hệ thống không cho submit application và hiển thị rằng event đang diễn ra.

4. **Given** event có trạng thái `CLOSED`, **When** Volunteer muốn apply, **Then** hệ thống không cho submit application.

5. **Given** event có trạng thái `DRAFT`, `COMPLETED`, `CANCELLED`, `ARCHIVED`, hoặc `DELETED`, **When** Volunteer muốn apply, **Then** hệ thống không cho submit application.

6. **Given** event không còn slot, **When** Volunteer submit application, **Then** hệ thống chặn submit và hiển thị thông báo event không còn slot.

---

### User Story 4 - Volunteer nhập và xác nhận thông tin đăng ký (Priority: P1)

Là Volunteer, tôi muốn nhập lời nhắn hoặc lý do muốn tham gia event để Staff có thêm thông tin khi review application.

**Why this priority**: Motivation/message giúp application có ý nghĩa hơn và hỗ trợ Staff đánh giá request của Volunteer.

**Independent Test**: Có thể test độc lập bằng cách nhập nội dung vào Apply Event form và kiểm tra validation.

**Acceptance Scenarios**:

1. **Given** Apply Event form đang hiển thị, **When** Volunteer nhập motivation/message hợp lệ, **Then** hệ thống cho phép submit application.

2. **Given** motivation/message vượt quá giới hạn độ dài, **When** Volunteer submit form, **Then** hệ thống hiển thị lỗi validation phù hợp.

3. **Given** Apply Event form đang hiển thị, **When** Volunteer xem form, **Then** hệ thống hiển thị event summary để Volunteer xác nhận đúng event trước khi gửi.

4. **Given** Volunteer chưa xác nhận submit, **When** form đang hiển thị, **Then** hệ thống chưa tạo application.

---

### User Story 5 - Gửi application thành công (Priority: P1)

Là Volunteer, tôi muốn gửi application thành công để hệ thống ghi nhận đơn đăng ký của tôi và chờ Staff review.

**Why this priority**: Đây là kết quả chính của Apply Event feature. Sau khi submit thành công, application phải được tạo với trạng thái phù hợp.

**Independent Test**: Có thể test độc lập bằng cách submit form hợp lệ và kiểm tra application được tạo ở trạng thái ban đầu.

**Acceptance Scenarios**:

1. **Given** Volunteer đã đăng nhập, **And** event có trạng thái `OPEN`, **And** event còn slot, **And** form hợp lệ, **When** Volunteer submit application, **Then** hệ thống tạo application thành công.

2. **Given** application được tạo thành công, **When** hệ thống lưu application, **Then** application có trạng thái ban đầu là `PENDING`.

3. **Given** application được tạo thành công, **When** hệ thống phản hồi cho user, **Then** hệ thống hiển thị success state hoặc success message rõ ràng.

4. **Given** application được tạo thành công, **When** success state hiển thị, **Then** hệ thống có thể cho user quay lại Event Detail hoặc đi tới Applied Events feature.

---

### User Story 6 - Chặn duplicate application (Priority: P1)

Là hệ thống, tôi cần chặn Volunteer gửi nhiều application cho cùng một event để dữ liệu không bị trùng.

**Why this priority**: Duplicate application gây rối cho Staff review và làm sai dữ liệu đăng ký event.

**Independent Test**: Có thể test độc lập bằng cách dùng cùng một Volunteer apply cùng một event nhiều lần.

**Acceptance Scenarios**:

1. **Given** Volunteer đã có application `PENDING` cho một event, **When** Volunteer cố apply lại event đó, **Then** hệ thống không tạo application mới và hiển thị thông báo đã đăng ký.

2. **Given** Volunteer đã có application `APPROVED` cho một event, **When** Volunteer cố apply lại event đó, **Then** hệ thống không tạo application mới và hiển thị thông báo phù hợp.

3. **Given** Volunteer chưa từng apply event đó, **When** event đủ điều kiện và form hợp lệ, **Then** hệ thống cho phép submit application.

---

### User Story 7 - Trạng thái loading, success và error (Priority: P2)

Là Volunteer, tôi muốn hệ thống hiển thị rõ trạng thái đang gửi, gửi thành công hoặc lỗi để không bị submit nhiều lần hoặc hiểu nhầm trạng thái application.

**Why this priority**: Đây là yêu cầu UX quan trọng để tránh duplicate action và giúp user hiểu hệ thống đang xử lý gì.

**Independent Test**: Có thể test độc lập bằng cách mô phỏng loading, success và error khi submit application.

**Acceptance Scenarios**:

1. **Given** Volunteer submit application, **When** hệ thống đang xử lý, **Then** hệ thống hiển thị submitting/loading state.

2. **Given** hệ thống đang submit application, **When** user bấm submit nhiều lần, **Then** hệ thống không tạo nhiều application trùng lặp.

3. **Given** application được tạo thành công, **When** submit hoàn tất, **Then** hệ thống hiển thị success state.

4. **Given** submit thất bại, **When** hệ thống nhận lỗi, **Then** hệ thống hiển thị error message dễ hiểu và không làm crash trang.

---

## Edge Cases

* **Guest submit application**: WHEN Guest cố submit application, THE system SHALL chặn submit và yêu cầu đăng nhập.

* **User không phải Volunteer**: WHEN user không có role Volunteer cố submit application, THE system SHALL chặn submit.

* **Event không tồn tại**: WHEN Volunteer mở Apply Event của event không tồn tại, THE system SHALL hiển thị not found hoặc unavailable state.

* **Event không còn public/applyable**: WHERE event có status không phải `OPEN`, THE system SHALL không cho submit application.

* **Event FULL**: WHERE event có status `FULL`, THE system SHALL không cho apply.

* **Event ONGOING**: WHERE event có status `ONGOING`, THE system SHALL không cho apply.

* **Event CLOSED**: WHERE event có status `CLOSED`, THE system SHALL không cho apply.

* **Event DRAFT/COMPLETED/CANCELLED/ARCHIVED/DELETED**: WHERE event có một trong các status này, THE system SHALL không cho apply.

* **Event hết slot**: WHERE remaining slots bằng 0, THE system SHALL không cho submit application.

* **Slot hết trong lúc user đang apply**: WHEN event còn slot lúc mở form nhưng hết slot trước khi submit, THE system SHALL chặn submit và hiển thị lỗi phù hợp.

* **Duplicate application**: WHEN Volunteer đã có application `PENDING` hoặc `APPROVED` cho event, THE system SHALL không tạo application mới.

* **Motivation/message quá dài**: WHEN user nhập nội dung vượt quá giới hạn, THE system SHALL hiển thị validation error.

* **Submit nhiều lần liên tục**: WHEN user bấm submit nhiều lần trong lúc request đang xử lý, THE system SHALL tránh tạo nhiều application trùng.

* **Lỗi hệ thống khi submit**: WHEN submit application thất bại do lỗi server/network, THE system SHALL hiển thị error state/message rõ ràng.

---

## Requirements

### Functional Requirements

* **FR-001**: THE system SHALL allow only authenticated Volunteer users to submit event application.

* **FR-002**: WHEN Guest attempts to apply, THE system SHALL require login or redirect to Authentication flow.

* **FR-003**: WHEN authenticated user is not Volunteer, THE system SHALL block application submission.

* **FR-004**: THE system SHALL allow application only for event with status `OPEN`.

* **FR-005**: THE system SHALL NOT allow application for event with status `FULL`.

* **FR-006**: THE system SHALL NOT allow application for event with status `ONGOING`.

* **FR-007**: THE system SHALL NOT allow application for event with status `CLOSED`.

* **FR-008**: THE system SHALL NOT allow application for event with status `DRAFT`, `COMPLETED`, `CANCELLED`, `ARCHIVED`, or `DELETED`.

* **FR-009**: THE system SHALL check event slot availability before creating application.

* **FR-010**: THE system SHALL NOT create application if event has no remaining slots.

* **FR-011**: Apply Event form SHALL display event summary before submission.

* **FR-012**: Apply Event form SHOULD allow Volunteer to enter motivation or message to organizer.

* **FR-013**: THE system SHALL validate motivation/message length if provided.

* **FR-014**: THE system SHALL create an application when Volunteer submits valid application for eligible event.

* **FR-015**: Newly created application SHALL have initial status `PENDING`.

* **FR-016**: THE system SHALL prevent duplicate application for the same Volunteer and same event if an active application already exists.

* **FR-017**: Active duplicate check SHALL include at least application status `PENDING` and `APPROVED`.

* **FR-018**: WHEN application is created successfully, THE system SHALL show success state or success message.

* **FR-019**: AFTER successful application, THE system MAY allow user to navigate to Applied Events or back to Event Detail.

* **FR-020**: WHEN application submission is processing, THE system SHALL display submitting/loading state.

* **FR-021**: WHILE application submission is processing, THE system SHALL prevent repeated submit actions.

* **FR-022**: WHEN application submission fails, THE system SHALL display understandable error message.

* **FR-023**: THE system SHALL NOT approve or reject application in this feature.

* **FR-024**: THE system SHALL NOT cancel application in this feature.

* **FR-025**: THE system SHALL NOT manage attendance, feedback, certificate, notification, donation/payment or reporting in this feature.

* **FR-026**: THE system SHALL NOT rely only on frontend validation for protected actions. Backend/API must also enforce authentication, role, status, duplicate and capacity rules.

* **FR-027**: THE system SHALL treat event status, capacity, remaining slots and application review status as shared data owned by related modules until approved contracts or plans define otherwise.

---

### Key Entities

* **Volunteer**: Authenticated user with Volunteer role who can submit event application.

* **Guest**: Unauthenticated user who can view public event information but cannot submit application.

* **Event**: Volunteer event that may or may not be eligible for application depending on status and remaining slots.

* **Event Status**: Business status of event. In this feature, only `OPEN` event can be applied to.

* **Event Application**: A record representing Volunteer’s request to join an event.

* **Application Status**: Status of an application. Newly submitted application starts as `PENDING`.

* **Motivation / Message**: Optional or required text entered by Volunteer to explain why they want to join the event.

* **Remaining Slots**: Number of available slots for the event. If remaining slots is 0, application is blocked.

* **Duplicate Application**: Case where the same Volunteer tries to apply to the same event more than once while an active application exists.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: 100% Guest users are blocked from submitting application and are asked to login or go through Authentication flow.

* **SC-002**: 100% authenticated non-Volunteer users are blocked from submitting application.

* **SC-003**: Volunteer can open Apply Event form from an eligible `OPEN` event.

* **SC-004**: 100% applications can only be created for event with status `OPEN`.

* **SC-005**: 100% events with status `FULL`, `ONGOING`, `CLOSED`, `DRAFT`, `COMPLETED`, `CANCELLED`, `ARCHIVED`, or `DELETED` cannot receive new application.

* **SC-006**: 100% application created successfully starts with status `PENDING`.

* **SC-007**: Duplicate application is blocked when Volunteer already has `PENDING` or `APPROVED` application for the same event.

* **SC-008**: Event with no remaining slots cannot receive new application.

* **SC-009**: Submit button does not create multiple applications when clicked repeatedly during processing.

* **SC-010**: User sees clear success state after successful application submission.

* **SC-011**: User sees clear error state when application submission fails.

* **SC-012**: Apply Event feature does not approve, reject, cancel, or manage applications beyond initial submission.

---

## Assumptions

* **A-001**: Project-level specification đã xác nhận hệ thống có 5 roles: Guest, Volunteer, Staff, Manager, Admin.

* **A-002**: Apply Event bắt đầu từ Event Detail.

* **A-003**: Guest không được submit application.

* **A-004**: Chỉ Volunteer đã đăng nhập mới được submit application.

* **A-005**: Chỉ event `OPEN` mới cho phép apply.

* **A-006**: Event `FULL`, `ONGOING`, `CLOSED`, `DRAFT`, `COMPLETED`, `CANCELLED`, `ARCHIVED`, `DELETED` không cho apply.

* **A-007**: Application mới gửi thành công sẽ có trạng thái ban đầu là `PENDING`.

* **A-008**: Staff review application ở module khác.

* **A-009**: Volunteer không được apply cùng một event nhiều lần nếu đã có application `PENDING` hoặc `APPROVED`.

* **A-010**: Motivation/message là trường nên có trong form bản đầu.

* **A-011**: Nếu event hết slot trước khi submit, hệ thống phải chặn application.

* **A-012**: Applied Events feature sẽ hiển thị application đã tạo ở feature này.

* **A-013**: Cancel Application không thuộc feature này.

* **A-014**: Member 1 chịu trách nhiệm Authentication/Profile.

* **A-015**: Member 3 chịu trách nhiệm event status, capacity, remaining slots và application review.

* **A-016**: Mock data có thể được dùng tạm trong giai đoạn đầu nếu API/data thật chưa sẵn sàng.

* **A-017**: Mobile app support là out of scope. Feature này chỉ nhắm đến web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của Volunteer Event Application và KHÔNG được implement trong feature này:

* Event List
* Search Event
* Filter Event
* Event Detail full display
* Applied Events list
* Cancel Application
* Volunteer Event History
* Staff Application List
* Staff Application Detail
* Approve Application
* Reject Application
* Staff Add Event
* Staff Edit Event
* Staff Delete Event
* Attendance Management
* Feedback Management
* Certificate generation
* Notification sending
* Donation/payment processing
* Reporting/dashboard
* Category Management
* Skill Management
* Organization Management
* Database schema design
* Database migration
* API endpoint contract
* Backend route definition
* Final UI component architecture
* Implementation task breakdown

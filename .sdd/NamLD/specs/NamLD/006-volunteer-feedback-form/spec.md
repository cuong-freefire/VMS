# Feature Specification: Volunteer Feedback Form

**Feature Branch**: `feat/volunteer-feedback-form`

**Created**: 2026-06-27

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là Volunteer của VMS, tôi muốn gửi feedback sau khi đã tham gia và điểm danh thành công ở một sự kiện để đánh giá trải nghiệm và góp ý cho event."

---

## User Scenarios & Testing

### User Story 1 - Volunteer mở Feedback Form từ Volunteer History (Priority: P1)

Là Volunteer đã đăng nhập, tôi muốn mở Feedback Form từ một event trong Volunteer History để gửi đánh giá cho event tôi đã tham gia.

**Why this priority**: Feedback Form nên bắt đầu từ Volunteer History vì Volunteer History biết event nào Volunteer đã tham gia, đã điểm danh và có đủ điều kiện feedback hay chưa.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập bằng tài khoản Volunteer có event đã điểm danh thành công, mở Volunteer History và click feedback action.

**Acceptance Scenarios**:

1. **Given** người dùng là Volunteer đã đăng nhập, **And** Volunteer đã điểm danh thành công ở event, **When** Volunteer click Feedback action từ Volunteer History, **Then** hệ thống mở Feedback Form cho event đó.

2. **Given** Feedback Form được mở, **When** form hiển thị, **Then** hệ thống hiển thị thông tin tóm tắt của event.

3. **Given** Feedback Form được mở, **When** Volunteer xem form, **Then** Volunteer biết rõ mình đang gửi feedback cho event nào.

---

### User Story 2 - Chỉ Volunteer được gửi feedback (Priority: P1)

Là hệ thống, tôi cần đảm bảo chỉ user đã đăng nhập với role `VOLUNTEER` mới được gửi feedback trong Volunteer Feedback Form.

**Why this priority**: Feedback là dữ liệu cá nhân sau khi tham gia event. Guest hoặc user không đúng role không được gửi feedback.

**Independent Test**: Có thể test độc lập bằng cách thử mở/gửi feedback bằng Guest, Volunteer, Staff, Manager và Admin.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest chưa đăng nhập, **When** người dùng mở Feedback Form, **Then** hệ thống yêu cầu đăng nhập hoặc điều hướng sang Authentication flow.

2. **Given** người dùng đã đăng nhập nhưng không có role `VOLUNTEER`, **When** người dùng mở Feedback Form, **Then** hệ thống chặn truy cập và hiển thị forbidden state hoặc message phù hợp.

3. **Given** người dùng là Volunteer đã đăng nhập, **When** Volunteer đủ điều kiện feedback, **Then** hệ thống cho phép mở Feedback Form.

4. **Given** người dùng không phải Volunteer, **When** người dùng cố submit feedback, **Then** hệ thống không tạo feedback record.

---

### User Story 3 - Chỉ được feedback sau khi điểm danh thành công (Priority: P1)

Là hệ thống, tôi cần đảm bảo Volunteer chỉ gửi feedback sau khi đã điểm danh thành công ở event.

**Why this priority**: Đây là business rule chính của docs mới. Feedback phải phản ánh trải nghiệm thực tế sau khi tham gia, không phải chỉ sau khi apply hoặc được approve.

**Independent Test**: Có thể test độc lập bằng cách thử gửi feedback với các trạng thái khác nhau: chưa apply, pending, approved nhưng chưa điểm danh, vắng mặt, đã điểm danh thành công.

**Acceptance Scenarios**:

1. **Given** Volunteer chưa apply event, **When** Volunteer cố mở Feedback Form, **Then** hệ thống chặn feedback.

2. **Given** Volunteer có application `PENDING`, **When** Volunteer cố mở Feedback Form, **Then** hệ thống chặn feedback.

3. **Given** Volunteer có application `REJECTED`, **When** Volunteer cố mở Feedback Form, **Then** hệ thống chặn feedback.

4. **Given** Volunteer có application `CANCELLED`, **When** Volunteer cố mở Feedback Form, **Then** hệ thống chặn feedback.

5. **Given** Volunteer có application `APPROVED` nhưng chưa điểm danh thành công, **When** Volunteer cố mở Feedback Form, **Then** hệ thống chặn feedback.

6. **Given** Volunteer đã điểm danh thành công, **When** Volunteer mở Feedback Form, **Then** hệ thống cho phép gửi feedback nếu chưa từng gửi feedback cho event đó.

---

### User Story 4 - Mỗi Volunteer chỉ gửi 1 feedback cho mỗi event (Priority: P1)

Là hệ thống, tôi cần chặn Volunteer gửi nhiều feedback cho cùng một event để tránh dữ liệu bị trùng và sai thống kê.

**Why this priority**: Docs mới chốt mỗi Volunteer chỉ gửi 1 feedback cho mỗi event. Rule này phải được enforce cả frontend và backend/API.

**Independent Test**: Có thể test độc lập bằng cách cho cùng một Volunteer gửi feedback cho cùng một event hai lần.

**Acceptance Scenarios**:

1. **Given** Volunteer chưa từng gửi feedback cho event, **And** Volunteer đã điểm danh thành công, **When** Volunteer submit feedback hợp lệ, **Then** hệ thống tạo feedback record.

2. **Given** Volunteer đã gửi feedback cho event, **When** Volunteer mở Feedback Form cho event đó, **Then** hệ thống không cho gửi feedback mới.

3. **Given** Volunteer đã gửi feedback cho event, **When** Volunteer cố submit feedback lần nữa, **Then** hệ thống không tạo feedback record mới.

4. **Given** duplicate feedback bị chặn, **When** hệ thống phản hồi, **Then** Volunteer thấy thông báo đã gửi feedback cho event này.

---

### User Story 5 - Volunteer nhập nội dung feedback (Priority: P1)

Là Volunteer, tôi muốn nhập nội dung feedback để chia sẻ trải nghiệm, góp ý hoặc đánh giá event.

**Why this priority**: Nội dung feedback là dữ liệu cốt lõi của Feedback Form. Nếu không có comment/content, feedback sẽ ít giá trị cho Staff và tổ chức.

**Independent Test**: Có thể test độc lập bằng cách nhập nội dung hợp lệ, nội dung rỗng và nội dung vượt quá giới hạn.

**Acceptance Scenarios**:

1. **Given** Feedback Form đang hiển thị, **When** Volunteer nhập feedback content hợp lệ, **Then** hệ thống cho phép submit nếu các điều kiện khác đều hợp lệ.

2. **Given** feedback content rỗng hoặc chỉ chứa khoảng trắng, **When** Volunteer submit form, **Then** hệ thống hiển thị validation error.

3. **Given** feedback content vượt quá giới hạn độ dài, **When** Volunteer submit form, **Then** hệ thống hiển thị validation error.

4. **Given** feedback content có khoảng trắng đầu/cuối, **When** Volunteer submit form, **Then** hệ thống trim content trước khi xử lý.

---

### User Story 6 - Volunteer đánh giá bằng rating nếu được hỗ trợ (Priority: P2)

Là Volunteer, tôi muốn có thể đánh giá event bằng rating để phản hồi nhanh chất lượng event.

**Why this priority**: Rating giúp Staff dễ tổng hợp chất lượng event. Tuy nhiên docs mới chưa bắt buộc rating, nên rating có thể là optional trong bản đầu.

**Independent Test**: Có thể test độc lập bằng cách nhập rating hợp lệ, bỏ trống rating, hoặc nhập rating ngoài khoảng hợp lệ.

**Acceptance Scenarios**:

1. **Given** Feedback Form hỗ trợ rating, **When** Volunteer chọn rating hợp lệ, **Then** hệ thống lưu rating cùng feedback.

2. **Given** Feedback Form hỗ trợ rating nhưng rating optional, **When** Volunteer không chọn rating, **Then** hệ thống vẫn cho submit nếu content hợp lệ.

3. **Given** Volunteer chọn rating ngoài khoảng hợp lệ, **When** Volunteer submit form, **Then** hệ thống hiển thị validation error.

4. **Given** rating được hỗ trợ, **When** rating được validate, **Then** rating nên nằm trong khoảng hợp lệ, ví dụ 1 đến 5.

---

### User Story 7 - Submit feedback thành công (Priority: P1)

Là Volunteer, tôi muốn gửi feedback thành công để hệ thống ghi nhận đánh giá của tôi cho event đã tham gia.

**Why this priority**: Đây là mục tiêu chính của feature. Sau khi submit thành công, Staff có thể xem feedback ở Staff Module.

**Independent Test**: Có thể test độc lập bằng cách dùng Volunteer đủ điều kiện, nhập feedback hợp lệ và submit.

**Acceptance Scenarios**:

1. **Given** Volunteer đã đăng nhập, **And** có role `VOLUNTEER`, **And** đã điểm danh thành công, **And** chưa gửi feedback cho event, **When** Volunteer submit feedback hợp lệ, **Then** hệ thống tạo feedback record.

2. **Given** feedback được tạo thành công, **When** hệ thống phản hồi, **Then** hệ thống hiển thị success state hoặc success message rõ ràng.

3. **Given** feedback được tạo thành công, **When** success state hiển thị, **Then** hệ thống có thể cho Volunteer quay lại Volunteer History.

4. **Given** feedback được tạo thành công, **When** Volunteer quay lại Volunteer History, **Then** event có thể hiển thị trạng thái đã feedback nếu dữ liệu có sẵn.

---

### User Story 8 - Loading, submitting, success và error states (Priority: P2)

Là Volunteer, tôi muốn hệ thống hiển thị rõ trạng thái đang tải, đang gửi, gửi thành công hoặc lỗi để tránh nhầm lẫn.

**Why this priority**: Feedback Form là form tạo dữ liệu. UI cần chặn submit nhiều lần và phản hồi lỗi rõ ràng.

**Independent Test**: Có thể test độc lập bằng cách mô phỏng loading, submitting, success và error states.

**Acceptance Scenarios**:

1. **Given** Feedback Form đang tải feedback context, **When** Volunteer mở form, **Then** hệ thống hiển thị loading state.

2. **Given** Volunteer submit feedback, **When** request đang xử lý, **Then** hệ thống hiển thị submitting state.

3. **Given** request đang xử lý, **When** Volunteer bấm submit nhiều lần, **Then** hệ thống không gửi nhiều request trùng lặp từ frontend.

4. **Given** submit feedback thành công, **When** request hoàn tất, **Then** hệ thống hiển thị success state.

5. **Given** submit feedback thất bại, **When** hệ thống nhận lỗi, **Then** hệ thống hiển thị error message dễ hiểu và không làm crash trang.

---

## Edge Cases

* **Guest mở Feedback Form**: WHEN Guest mở Feedback Form, THE system SHALL yêu cầu đăng nhập hoặc điều hướng sang Authentication flow.

* **User không phải Volunteer mở Feedback Form**: WHEN authenticated user không có role `VOLUNTEER` mở Feedback Form, THE system SHALL chặn truy cập.

* **Volunteer chưa apply event**: WHERE Volunteer chưa có application cho event, THE system SHALL không cho gửi feedback.

* **Application PENDING**: WHERE application status là `PENDING`, THE system SHALL không cho gửi feedback.

* **Application REJECTED**: WHERE application status là `REJECTED`, THE system SHALL không cho gửi feedback.

* **Application CANCELLED**: WHERE application status là `CANCELLED`, THE system SHALL không cho gửi feedback.

* **Application APPROVED nhưng chưa điểm danh**: WHERE Volunteer có application `APPROVED` nhưng chưa điểm danh thành công, THE system SHALL không cho gửi feedback.

* **Volunteer vắng mặt**: WHERE attendance status là absent hoặc không tham gia, THE system SHALL không cho gửi feedback.

* **Volunteer đã điểm danh thành công**: WHERE Volunteer có successful attendance, THE system SHALL cho phép mở Feedback Form nếu chưa gửi feedback.

* **Volunteer đã gửi feedback**: WHERE Volunteer already submitted feedback for the event, THE system SHALL không cho gửi feedback lần nữa.

* **Feedback content rỗng**: WHEN feedback content rỗng hoặc chỉ gồm khoảng trắng, THE system SHALL hiển thị validation error.

* **Feedback content quá dài**: WHEN feedback content vượt quá giới hạn, THE system SHALL hiển thị validation error.

* **Rating ngoài khoảng hợp lệ**: WHEN rating được nhập nhưng nằm ngoài khoảng hợp lệ, THE system SHALL hiển thị validation error.

* **Submit nhiều lần liên tục**: WHEN Volunteer bấm submit nhiều lần trong lúc request đang xử lý, THE system SHALL tránh tạo nhiều request/feedback trùng lặp.

* **Attendance data chưa sẵn sàng**: WHEN eligibility data không tải được, THE system SHALL hiển thị error hoặc unavailable state thay vì cho submit bừa.

* **Server/network error**: WHEN submit feedback thất bại do lỗi server hoặc network, THE system SHALL hiển thị error state/message rõ ràng.

---

## Requirements

### Functional Requirements

* **FR-001**: THE system SHALL allow only authenticated users with role `VOLUNTEER` to submit feedback.

* **FR-002**: WHEN Guest attempts to open Feedback Form, THE system SHALL require login/register or redirect to Authentication flow.

* **FR-003**: WHEN authenticated user is not `VOLUNTEER`, THE system SHALL block access to Feedback Form.

* **FR-004**: THE system SHALL NOT create feedback for Guest.

* **FR-005**: THE system SHALL NOT create feedback for Staff, Manager or Admin in this Volunteer Feedback Form flow.

* **FR-006**: Feedback Form SHOULD be opened from Volunteer History or a valid feedback entry point.

* **FR-007**: Feedback Form SHALL display event summary before submission.

* **FR-008**: Event summary SHOULD include event title, organization, event date/time, location and attendance status if available.

* **FR-009**: THE system SHALL allow Volunteer to submit feedback only for event that the Volunteer attended successfully.

* **FR-010**: THE system SHALL NOT allow feedback when Volunteer has not attended successfully.

* **FR-011**: THE system SHALL NOT allow feedback for `PENDING`, `REJECTED`, or `CANCELLED` applications.

* **FR-012**: THE system SHALL NOT allow feedback for `APPROVED` application if successful attendance is missing.

* **FR-013**: THE system SHALL allow only one feedback per Volunteer per event.

* **FR-014**: THE system SHALL prevent duplicate feedback submission for the same Volunteer and same event.

* **FR-015**: Feedback Form SHALL include feedback content/comment field.

* **FR-016**: Feedback content/comment SHALL be required in the first version.

* **FR-017**: Feedback content/comment SHALL be trimmed before submission.

* **FR-018**: THE system SHALL validate feedback content/comment length.

* **FR-019**: Feedback Form MAY include rating field.

* **FR-020**: Rating MAY be optional in the first version.

* **FR-021**: IF rating is provided, THE system SHALL validate rating range.

* **FR-022**: Rating SHOULD use a valid range such as 1 to 5 if implemented.

* **FR-023**: THE system SHALL create a feedback record when Volunteer submits valid feedback and all eligibility checks pass.

* **FR-024**: WHEN feedback is created successfully, THE system SHALL show success state or success message.

* **FR-025**: AFTER successful feedback submission, THE system MAY allow Volunteer to return to Volunteer History.

* **FR-026**: AFTER successful feedback submission, Volunteer History MAY show feedback submitted status if data is available.

* **FR-027**: WHEN Feedback Form context is loading, THE system SHALL display loading state.

* **FR-028**: WHEN feedback submission is processing, THE system SHALL display submitting state.

* **FR-029**: WHILE feedback submission is processing, THE system SHALL prevent repeated submit actions from the UI.

* **FR-030**: WHEN feedback submission fails, THE system SHALL display understandable error message.

* **FR-031**: WHEN eligibility data cannot be loaded, THE system SHALL display unavailable/error state and SHALL NOT allow unsafe submission.

* **FR-032**: THE system SHALL NOT display Feedback List in this feature.

* **FR-033**: THE system SHALL NOT display Feedback Detail for Staff in this feature.

* **FR-034**: THE system SHALL NOT perform Attendance Check-in in this feature.

* **FR-035**: THE system SHALL NOT manage Attendance List in this feature.

* **FR-036**: THE system SHALL NOT create, view or download Certificate in this feature.

* **FR-037**: THE system SHALL NOT rely only on frontend validation. Backend/API must enforce authentication, role, ownership, successful attendance and one-feedback-per-event rules.

* **FR-038**: THE system SHALL treat attendance status, feedback eligibility and duplicate feedback as shared data owned by related modules until final API/data contracts are approved.

---

### Key Entities

* **Guest**: Unauthenticated user. Guest is not stored as a database role and cannot submit feedback.

* **Volunteer**: Authenticated user with role `VOLUNTEER` who can submit feedback after successful attendance.

* **Event**: Volunteer event that may receive feedback from eligible Volunteers.

* **Feedback**: Record containing Volunteer’s comment and optional rating for an event.

* **Feedback Form**: Form used by Volunteer to submit feedback.

* **Feedback Content / Comment**: Required text input containing Volunteer’s feedback.

* **Rating**: Optional score field if implemented, normally using a valid range such as 1 to 5.

* **Event Application**: Volunteer’s application to join an event. Application approval alone is not enough for feedback.

* **Attendance Record**: Record showing Volunteer attendance result for the event.

* **Successful Attendance**: Required condition before Volunteer can submit feedback.

* **Feedback Eligibility**: Rule set that decides whether Volunteer can submit feedback for an event.

* **Duplicate Feedback**: Case where the same Volunteer tries to submit more than one feedback for the same event.

* **Volunteer History**: Feature that may provide entry point to Feedback Form after Volunteer attended an event.

* **Feedback List**: Staff-side list of submitted feedback. It is out of scope for this feature.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: 100% Guest users are blocked from submitting feedback and are asked to login/register.

* **SC-002**: 100% authenticated non-Volunteer users are blocked from submitting feedback in this Volunteer Feedback Form flow.

* **SC-003**: Volunteer can open Feedback Form only for event that belongs to their eligible participation record.

* **SC-004**: Volunteer cannot submit feedback for event without successful attendance.

* **SC-005**: Volunteer cannot submit feedback for `PENDING`, `REJECTED`, or `CANCELLED` application.

* **SC-006**: Volunteer cannot submit feedback for `APPROVED` application if attendance successful is missing.

* **SC-007**: Volunteer can submit feedback for attended event if they have not submitted feedback before.

* **SC-008**: 100% duplicate feedback attempts for the same Volunteer and same event are blocked.

* **SC-009**: Feedback content is required and validated.

* **SC-010**: Rating is validated if rating is implemented.

* **SC-011**: Submit button does not create multiple feedback records when clicked repeatedly during processing.

* **SC-012**: User sees clear success state after successful feedback submission.

* **SC-013**: User sees clear error state when feedback submission fails.

* **SC-014**: Feedback Form feature does not perform attendance check-in, show Staff Feedback List/Detail, or manage certificates.

---

## Assumptions

* **A-001**: Guest is not stored as a database role.

* **A-002**: Database roles are `VOLUNTEER`, `STAFF`, `MANAGER`, and `ADMIN`.

* **A-003**: Feedback Form belongs to Member 2 — Volunteer Event Module.

* **A-004**: Feedback Form corresponds to UC48 — Submit Feedback.

* **A-005**: Feedback Form requires authenticated Volunteer.

* **A-006**: Guest cannot submit feedback.

* **A-007**: Staff, Manager and Admin do not submit feedback through this Volunteer Feedback Form flow.

* **A-008**: Feedback Form is normally opened from Volunteer History.

* **A-009**: Volunteer can submit feedback only after successful attendance.

* **A-010**: Application `APPROVED` is not enough for feedback if successful attendance is missing.

* **A-011**: Volunteer absent from event cannot submit feedback in the first version.

* **A-012**: Each Volunteer can submit only one feedback for each event.

* **A-013**: Editing feedback after submission is out of scope for the first version.

* **A-014**: Feedback content/comment is required in the first version.

* **A-015**: Rating can be optional if implemented.

* **A-016**: Staff views Feedback List and Feedback Detail in Staff Module, not in this feature.

* **A-017**: Attendance data is provided by Attendance Management / Staff Module.

* **A-018**: Backend/API must be the final authority for eligibility and duplicate feedback rules.

* **A-019**: Mock data can be used temporarily if API/data are not ready.

* **A-020**: Mobile app support is out of scope. Feature targets web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của Volunteer Feedback Form và KHÔNG được implement trong feature này:

* Event List
* Search Event
* Filter Event
* Event Detail full display
* Apply Event submission
* Application form
* Applied Event List
* Cancel Application
* Volunteer History full display
* Attendance Check-in
* Attendance Management
* Attendance List
* Staff Application List
* Staff Application Detail
* Approve Application
* Reject Application
* Feedback List
* Feedback Detail
* Edit Feedback
* Delete Feedback
* Certificate List
* Certificate Detail
* Download Certificate
* Generate Certificate
* Staff Add Event
* Staff Edit Event
* Staff Delete Event
* Category Management
* Skill Management
* Organization Management
* Notification Management
* Donation and Payment
* Reporting and Dashboard
* Database schema design
* Database migration
* API endpoint contract
* Backend route definition
* Final UI component architecture
* Implementation task breakdown

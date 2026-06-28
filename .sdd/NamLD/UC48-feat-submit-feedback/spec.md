# Feature Specification: Submit Feedback

**Feature Branch**: `feat/submit-feedback`

**Created**: 2026-06-27

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là Volunteer đã đăng nhập, tôi muốn gửi feedback sau khi tham gia event để đánh giá và góp ý cho sự kiện."

---

## User Scenarios & Testing

### User Story 1 - Volunteer submit feedback sau khi tham gia hợp lệ (Priority: P1)

Là Volunteer đã đăng nhập, tôi muốn gửi feedback cho event mà tôi đã tham gia hợp lệ để chia sẻ đánh giá và góp ý của mình.

**Why this priority**: Submit Feedback là nghiệp vụ chính của UC48. Feedback chỉ có ý nghĩa khi Volunteer đã thật sự tham gia event và được ghi nhận attendance hợp lệ.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập bằng tài khoản Volunteer đã có successful attendance cho một event và chưa từng feedback event đó, sau đó submit feedback.

**Acceptance Scenarios**:

1. **Given** người dùng là Volunteer đã đăng nhập, **And** Volunteer có successful attendance cho event, **And** Volunteer chưa gửi feedback cho event đó, **When** Volunteer submit feedback hợp lệ, **Then** hệ thống tạo feedback mới.

2. **Given** feedback được tạo thành công, **When** hệ thống trả kết quả, **Then** Volunteer thấy success state hoặc success message.

3. **Given** feedback được tạo thành công, **When** Volunteer quay lại màn trước hoặc Volunteer History, **Then** event đó không nên tiếp tục hiển thị như một feedback reminder chưa hoàn thành.

4. **Given** feedback được tạo thành công, **When** Volunteer cố submit lại feedback cho cùng event, **Then** hệ thống không tạo feedback trùng.

---

### User Story 2 - Chỉ Volunteer đã đăng nhập được submit feedback (Priority: P1)

Là hệ thống, tôi cần đảm bảo chỉ Volunteer đã đăng nhập mới được submit feedback qua Volunteer flow.

**Why this priority**: Feedback phải gắn với một Volunteer cụ thể và một event cụ thể. Guest hoặc user không đúng role không được submit feedback.

**Independent Test**: Có thể test độc lập bằng cách thử submit feedback bằng Guest, Volunteer, Staff, Manager và Admin.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest, **When** người dùng cố mở hoặc submit Feedback Form, **Then** hệ thống yêu cầu login/register hoặc điều hướng sang Authentication flow.

2. **Given** người dùng đăng nhập với role `VOLUNTEER`, **When** Volunteer đủ điều kiện submit feedback, **Then** hệ thống cho phép submit.

3. **Given** người dùng đăng nhập với role `STAFF`, **When** người dùng cố submit feedback qua Volunteer flow, **Then** hệ thống chặn request.

4. **Given** người dùng đăng nhập với role `MANAGER` hoặc `ADMIN`, **When** người dùng cố submit feedback qua Volunteer flow, **Then** hệ thống chặn request.

---

### User Story 3 - Volunteer chỉ feedback event của chính mình (Priority: P1)

Là Volunteer, tôi chỉ được gửi feedback cho event mà chính tôi đã tham gia hợp lệ, không được gửi feedback thay người khác.

**Why this priority**: Feedback là dữ liệu cá nhân của Volunteer sau khi tham gia event. Nếu Volunteer có thể feedback cho event của người khác, dữ liệu sẽ sai và mất an toàn.

**Independent Test**: Có thể test bằng cách tạo hai Volunteer khác nhau, mỗi người có attendance riêng, rồi thử để Volunteer A submit feedback cho event/attendance của Volunteer B.

**Acceptance Scenarios**:

1. **Given** event/attendance thuộc về Volunteer hiện tại, **When** Volunteer submit feedback hợp lệ, **Then** hệ thống cho phép tạo feedback.

2. **Given** event/attendance thuộc về Volunteer khác, **When** Volunteer hiện tại cố submit feedback, **Then** hệ thống chặn request.

3. **Given** frontend không hiển thị feedback form cho event không thuộc Volunteer hiện tại, **When** user cố gọi request không hợp lệ, **Then** backend/API vẫn phải enforce ownership.

4. **Given** request submit feedback không đúng owner, **When** backend/API xử lý, **Then** hệ thống không tạo feedback.

---

### User Story 4 - Chỉ được feedback sau khi attendance hợp lệ (Priority: P1)

Là hệ thống, tôi cần đảm bảo Volunteer chỉ được submit feedback sau khi đã được ghi nhận tham gia event hợp lệ.

**Why this priority**: Feedback chỉ nên đến từ Volunteer đã thật sự tham gia event. Application `APPROVED` chưa đủ nếu chưa có successful attendance.

**Independent Test**: Có thể test bằng cách tạo các case: chưa apply, pending, approved nhưng chưa attendance, successful attendance, absent hoặc attendance invalid.

**Acceptance Scenarios**:

1. **Given** Volunteer có successful attendance cho event, **When** Volunteer submit feedback, **Then** hệ thống cho phép nếu các rule khác hợp lệ.

2. **Given** Volunteer chưa apply event, **When** Volunteer cố submit feedback, **Then** hệ thống chặn request.

3. **Given** Volunteer có application `PENDING`, **When** Volunteer cố submit feedback, **Then** hệ thống chặn request.

4. **Given** Volunteer có application `APPROVED` nhưng chưa có successful attendance, **When** Volunteer cố submit feedback, **Then** hệ thống chặn request.

5. **Given** Volunteer bị absent hoặc attendance không hợp lệ, **When** Volunteer cố submit feedback, **Then** hệ thống chặn request.

---

### User Story 5 - Chặn duplicate feedback (Priority: P1)

Là hệ thống, tôi cần đảm bảo mỗi Volunteer chỉ được gửi một feedback cho mỗi event.

**Why this priority**: Nếu một Volunteer gửi nhiều feedback cho cùng event, kết quả đánh giá sẽ bị sai và Staff/Admin khó phân tích dữ liệu.

**Independent Test**: Có thể test bằng cách dùng cùng một Volunteer submit feedback cho cùng event hai lần.

**Acceptance Scenarios**:

1. **Given** Volunteer chưa từng feedback event, **When** Volunteer submit feedback hợp lệ, **Then** hệ thống tạo feedback mới.

2. **Given** Volunteer đã feedback event đó, **When** Volunteer submit feedback lần nữa, **Then** hệ thống không tạo feedback trùng.

3. **Given** duplicate feedback bị chặn, **When** hệ thống trả kết quả, **Then** Volunteer thấy message rõ ràng rằng họ đã gửi feedback cho event này rồi.

4. **Given** duplicate check xảy ra, **When** request được xử lý, **Then** backend/API phải enforce duplicate, không chỉ dựa vào frontend.

---

### User Story 6 - Nhập nội dung feedback hợp lệ (Priority: P1)

Là Volunteer, tôi muốn nhập nội dung feedback để chia sẻ cảm nhận, đánh giá hoặc góp ý về event.

**Why this priority**: Feedback content/comment là dữ liệu chính của UC48. Nếu content rỗng hoặc không hợp lệ, feedback sẽ không có ý nghĩa.

**Independent Test**: Có thể test bằng cách nhập feedback hợp lệ, feedback rỗng, feedback chỉ có khoảng trắng và feedback quá dài.

**Acceptance Scenarios**:

1. **Given** Volunteer nhập feedback content hợp lệ, **When** submit feedback, **Then** hệ thống cho phép submit nếu các rule khác hợp lệ.

2. **Given** Volunteer để trống feedback content, **When** submit feedback, **Then** hệ thống hiển thị validation error.

3. **Given** Volunteer nhập feedback chỉ gồm khoảng trắng, **When** submit feedback, **Then** hệ thống trim và xử lý như content rỗng.

4. **Given** Volunteer nhập feedback quá dài, **When** submit feedback, **Then** hệ thống hiển thị validation error hoặc từ chối request.

5. **Given** Volunteer nhập content có khoảng trắng đầu/cuối, **When** submit feedback, **Then** hệ thống trim content trước khi lưu.

---

### User Story 7 - Rating optional nếu team sử dụng (Priority: P2)

Là Volunteer, tôi có thể đánh giá event bằng rating nếu hệ thống hỗ trợ rating.

**Why this priority**: Rating giúp feedback dễ tổng hợp hơn, nhưng nếu team chưa chốt rõ thì không nên bắt buộc trong bản đầu.

**Independent Test**: Có thể test bằng cách bật rating field, nhập rating hợp lệ, thiếu rating và rating ngoài range.

**Acceptance Scenarios**:

1. **Given** rating field được hỗ trợ, **When** Volunteer chọn rating hợp lệ, **Then** hệ thống gửi rating cùng feedback.

2. **Given** rating là optional, **When** Volunteer không chọn rating, **Then** hệ thống vẫn cho submit nếu feedback content hợp lệ.

3. **Given** Volunteer chọn rating dưới range hợp lệ, **When** submit feedback, **Then** hệ thống hiển thị validation error.

4. **Given** Volunteer chọn rating trên range hợp lệ, **When** submit feedback, **Then** hệ thống hiển thị validation error.

---

### User Story 8 - Hiển thị event summary trước khi submit feedback (Priority: P2)

Là Volunteer, tôi muốn xem lại thông tin event trước khi gửi feedback để chắc chắn mình đang feedback đúng event.

**Why this priority**: Volunteer có thể tham gia nhiều event. Event summary giúp tránh gửi feedback nhầm event.

**Independent Test**: Có thể test bằng cách mở Feedback Form từ entry point hợp lệ và kiểm tra event summary hiển thị đúng.

**Acceptance Scenarios**:

1. **Given** Volunteer mở Feedback Form cho một event đủ điều kiện, **When** form hiển thị, **Then** hệ thống hiển thị event summary.

2. **Given** event summary có dữ liệu, **When** form hiển thị, **Then** summary có thể gồm event title, organization, date/time, location và attendance status.

3. **Given** event summary thiếu optional data như organization hoặc thumbnail, **When** form hiển thị, **Then** UI không crash và hiển thị fallback phù hợp.

4. **Given** Volunteer nhận ra chọn nhầm event, **When** Volunteer quay lại màn trước, **Then** hệ thống không submit feedback.

---

### User Story 9 - Entry point từ Volunteer History hoặc màn hợp lệ khác (Priority: P2)

Là hệ thống, tôi cần đảm bảo Feedback Form có thể được mở từ entry point hợp lệ sau khi Volunteer đã tham gia event.

**Why this priority**: Theo assignment mới, UC21 Volunteer History thuộc Member 1, nhưng UC48 vẫn cần có cách được mở từ lịch sử hoặc một entry point phù hợp.

**Independent Test**: Có thể test bằng cách mở Feedback Form từ Volunteer History hoặc một link hợp lệ cho event đã attendance.

**Acceptance Scenarios**:

1. **Given** Volunteer có event đã successful attendance và chưa feedback, **When** Volunteer click Submit Feedback từ entry point hợp lệ, **Then** hệ thống mở Feedback Form của event đó.

2. **Given** Volunteer mở Feedback Form từ Volunteer History của Member 1, **When** form hiển thị, **Then** UC48 chỉ xử lý submit feedback, không implement toàn bộ Volunteer History.

3. **Given** entry point truyền event/application/attendance không hợp lệ, **When** Feedback Form tải dữ liệu, **Then** hệ thống hiển thị unavailable hoặc error state.

---

### User Story 10 - Loading, submitting, success và error states (Priority: P2)

Là Volunteer, tôi muốn thấy trạng thái rõ ràng khi Feedback Form đang tải, feedback đang gửi, gửi thành công hoặc thất bại.

**Why this priority**: Submit Feedback là thao tác tạo dữ liệu. Nếu không có trạng thái rõ ràng, Volunteer có thể bấm nhiều lần hoặc không biết feedback đã gửi chưa.

**Independent Test**: Có thể test bằng cách mock loading, submitting, success và các lỗi như chưa attendance, duplicate, sai role, sai owner hoặc lỗi hệ thống.

**Acceptance Scenarios**:

1. **Given** Feedback Form đang tải dữ liệu event/eligibility, **When** Volunteer mở form, **Then** hệ thống hiển thị loading state.

2. **Given** Volunteer bấm Submit Feedback, **When** request đang xử lý, **Then** hệ thống hiển thị submitting state.

3. **Given** request đang xử lý, **When** Volunteer bấm submit nhiều lần, **Then** hệ thống không gửi nhiều request trùng từ UI.

4. **Given** submit feedback thành công, **When** hệ thống trả kết quả, **Then** Volunteer thấy success state.

5. **Given** submit feedback thất bại do chưa attendance, duplicate feedback, permission, ownership, validation hoặc lỗi hệ thống, **When** hệ thống trả kết quả, **Then** Volunteer thấy error message phù hợp.

---

## Edge Cases

* **Guest submit feedback**: Hệ thống yêu cầu login/register hoặc điều hướng sang Authentication flow, không tạo feedback.

* **Staff submit feedback qua Volunteer flow**: Hệ thống chặn vì Staff không dùng UC48.

* **Manager/Admin submit feedback qua Volunteer flow**: Hệ thống chặn vì không phải Volunteer flow.

* **Volunteer submit feedback cho event của người khác**: Backend/API chặn request.

* **Volunteer chưa apply event**: Hệ thống không cho submit feedback.

* **Application đang PENDING**: Hệ thống không cho submit feedback.

* **Application REJECTED**: Hệ thống không cho submit feedback.

* **Application CANCELLED**: Hệ thống không cho submit feedback.

* **Application APPROVED nhưng chưa attendance**: Hệ thống không cho submit feedback.

* **Attendance không hợp lệ hoặc absent**: Hệ thống không cho submit feedback.

* **Successful attendance nhưng đã feedback rồi**: Hệ thống không cho submit feedback lần hai.

* **Feedback content rỗng**: Hệ thống hiển thị validation error.

* **Feedback content chỉ có khoảng trắng**: Hệ thống trim và xử lý như rỗng.

* **Feedback content quá dài**: Hệ thống hiển thị validation error hoặc từ chối request.

* **Rating thiếu**: Nếu rating optional, hệ thống vẫn cho submit.

* **Rating ngoài range**: Nếu rating được hỗ trợ, hệ thống hiển thị validation error.

* **Event không tồn tại hoặc không còn available**: Hệ thống hiển thị unavailable hoặc error state.

* **Feedback Form đang submit**: UI disable submit button hoặc chống submit nhiều lần.

* **Frontend cho submit nhưng backend phát hiện không đủ điều kiện**: Backend/API phải từ chối request.

---

## Requirements

### Functional Requirements

* **FR-001**: THE system SHALL allow only authenticated users with role `VOLUNTEER` to submit feedback through UC48.

* **FR-002**: THE system SHALL NOT allow Guest to submit feedback.

* **FR-003**: WHEN Guest attempts to submit feedback, THE system SHALL require login/register or navigate to Authentication flow.

* **FR-004**: THE system SHALL NOT allow Staff, Manager or Admin to submit feedback through Volunteer Submit Feedback flow.

* **FR-005**: THE system SHALL allow Volunteer to submit feedback only for event/attendance that belongs to the current Volunteer.

* **FR-006**: THE system SHALL NOT allow Volunteer to submit feedback for event/attendance belonging to another Volunteer.

* **FR-007**: THE system SHALL require successful attendance before feedback can be submitted.

* **FR-008**: THE system SHALL NOT allow feedback if Volunteer has not applied to the event.

* **FR-009**: THE system SHALL NOT allow feedback if application is `PENDING`, `REJECTED` or `CANCELLED`.

* **FR-010**: THE system SHALL NOT treat `APPROVED` application alone as enough for feedback without successful attendance.

* **FR-011**: THE system SHALL prevent a Volunteer from submitting more than one feedback for the same event.

* **FR-012**: THE system SHALL require feedback content/comment.

* **FR-013**: THE system SHALL trim leading and trailing spaces from feedback content/comment.

* **FR-014**: THE system SHALL reject feedback content/comment that is empty after trimming.

* **FR-015**: THE system SHALL validate feedback content/comment maximum length.

* **FR-016**: THE system MAY validate feedback content/comment minimum length if team confirms.

* **FR-017**: THE system MAY provide rating field.

* **FR-018**: IF rating field exists, THE system SHALL validate rating range, for example 1 to 5.

* **FR-019**: IF rating is optional, THE system SHALL allow submit without rating when feedback content is valid.

* **FR-020**: THE system SHOULD display event summary before Volunteer submits feedback.

* **FR-021**: Event summary SHOULD include event title.

* **FR-022**: Event summary SHOULD include organization if available.

* **FR-023**: Event summary SHOULD include event date/time.

* **FR-024**: Event summary SHOULD include location if available.

* **FR-025**: Event summary MAY include attendance status if available.

* **FR-026**: THE system SHALL display loading state while Feedback Form loads event/eligibility data.

* **FR-027**: THE system SHALL display submitting state while feedback request is processing.

* **FR-028**: THE system SHALL prevent repeated submit from UI while request is processing.

* **FR-029**: THE system SHALL display success state when feedback is submitted successfully.

* **FR-030**: THE system MAY navigate Volunteer back to Volunteer History or previous screen after successful submit.

* **FR-031**: THE system SHALL display validation error when feedback content is invalid.

* **FR-032**: THE system SHALL display clear error message when submit fails due to unauthenticated user.

* **FR-033**: THE system SHALL display clear error message when submit fails due to invalid role.

* **FR-034**: THE system SHALL display clear error message when submit fails due to ownership violation.

* **FR-035**: THE system SHALL display clear error message when submit fails due to missing successful attendance.

* **FR-036**: THE system SHALL display clear error message when submit fails due to duplicate feedback.

* **FR-037**: THE system SHALL display clear error message when submit fails due to event/application/attendance not found or unavailable.

* **FR-038**: THE system SHALL display general error state when submit fails due to system error.

* **FR-039**: THE system SHALL NOT implement full Volunteer History in UC48.

* **FR-040**: THE system SHALL NOT perform Attendance Check in UC48.

* **FR-041**: THE system SHALL NOT create, update or cancel application in UC48.

* **FR-042**: THE system SHALL NOT view, download or generate certificate in UC48.

* **FR-043**: THE system SHALL NOT expose Staff-only feedback management actions in UC48.

* **FR-044**: THE system SHALL NOT rely only on frontend validation. Backend/API must enforce authentication, role, ownership, attendance eligibility and duplicate feedback.

---

### Key Entities

* **Guest**: Unauthenticated user. Guest cannot submit feedback.

* **Volunteer**: Authenticated user with role `VOLUNTEER`. Volunteer can submit feedback for their own attended event.

* **Staff**: User with role `STAFF`. Staff handles event/application/attendance workflows in other modules, not feedback submission through UC48.

* **Event**: Volunteer event that may receive feedback from attended Volunteers.

* **Application**: Record showing Volunteer applied to an event. Application alone is not enough for feedback unless attendance is successful.

* **Attendance**: Record showing whether Volunteer participated in the event.

* **Successful Attendance**: Attendance state that allows Volunteer to submit feedback.

* **Feedback**: Record containing Volunteer’s comment and optional rating for an event.

* **Feedback Content / Comment**: Required text submitted by Volunteer.

* **Rating**: Optional numeric evaluation value if the team supports rating.

* **Feedback Eligibility**: Conditions that allow Volunteer to submit feedback.

* **Duplicate Feedback**: Case where the same Volunteer already submitted feedback for the same event.

* **Event Summary**: Short event information shown on Feedback Form before submit.

* **Volunteer History**: Entry point owned by Member 1; not implemented inside UC48.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: Guest cannot submit feedback.

* **SC-002**: Staff, Manager and Admin cannot submit feedback through Volunteer Submit Feedback flow.

* **SC-003**: Authenticated Volunteer can submit feedback only for their own event with successful attendance.

* **SC-004**: Volunteer cannot submit feedback for event/attendance belonging to another Volunteer.

* **SC-005**: Volunteer cannot submit feedback without successful attendance.

* **SC-006**: `APPROVED` application alone is not enough to submit feedback.

* **SC-007**: Volunteer can submit only one feedback per event.

* **SC-008**: Feedback content is required and cannot be empty after trimming.

* **SC-009**: Invalid feedback content or invalid rating shows validation error.

* **SC-010**: Successful submit creates a feedback record.

* **SC-011**: Feedback Form shows loading, submitting, success and error states correctly.

* **SC-012**: UI prevents repeated submit while request is processing.

* **SC-013**: Backend/API enforces authentication, role, ownership, attendance eligibility and duplicate feedback, not frontend only.

* **SC-014**: UC48 does not implement Volunteer History or Attendance Check.

---

## Assumptions

* **A-001**: Guest is not stored as a database role.

* **A-002**: Database roles are `VOLUNTEER`, `STAFF`, `MANAGER`, and `ADMIN`.

* **A-003**: UC48 is only for authenticated Volunteer.

* **A-004**: Guest must login/register before interacting with feedback submission.

* **A-005**: Staff, Manager and Admin do not use UC48 as their feedback submission flow.

* **A-006**: Volunteer can only submit feedback for their own event/attendance.

* **A-007**: Successful attendance is required before feedback submission.

* **A-008**: `APPROVED` application alone is not enough without attendance.

* **A-009**: Each Volunteer can submit only one feedback per event.

* **A-010**: Feedback content/comment is required in the first version.

* **A-011**: Rating is optional unless team confirms it as required later.

* **A-012**: UC48 may be opened from Volunteer History owned by Member 1 or another valid entry point.

* **A-013**: Attendance data is owned by Member 3.

* **A-014**: Feedback list/detail for Staff/Admin is outside UC48.

* **A-015**: Mock data can be used temporarily before final API/data contract is ready.

* **A-016**: Mobile app support is out of scope. Feature targets web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC48 — Submit Feedback và KHÔNG được implement trong use case này:

* View Event List
* Search Event
* Filter Event
* Full Event Detail display
* Apply Event submission
* View Applied Events full list
* Cancel Application
* View Volunteer History full flow
* Attendance Check
* View Attendance List
* View Attendance History
* Staff View Feedback List
* Staff View Feedback Detail
* Edit Feedback
* Delete Feedback
* View Certificates
* Download Certificate
* Generate Certificate
* Add Event
* Edit Event
* Delete Event
* Staff Application Management
* Category Management
* Skill Management
* Organization Management
* Notification Management
* Dashboard and Reporting
* Donation and Payment
* Database schema design
* Database migration
* API endpoint contract
* Backend route definition
* Final UI component architecture
* Implementation task breakdown

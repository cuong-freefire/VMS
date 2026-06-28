# Feature Specification: Apply Event

**Feature Branch**: `feat/apply-event`

**Created**: 2026-06-27

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là Volunteer đã đăng nhập, tôi muốn đăng ký tham gia một sự kiện tình nguyện để Staff có thể xem xét và duyệt application của tôi."

---

## User Scenarios & Testing

### User Story 1 - Volunteer apply event hợp lệ (Priority: P1)

Là Volunteer đã đăng nhập, tôi muốn apply một event hợp lệ để gửi đơn đăng ký tham gia sự kiện.

**Why this priority**: Apply Event là hành động chính của Volunteer sau khi xem danh sách và chi tiết event. Nếu Volunteer không thể apply, module Volunteer Event sẽ không hoàn chỉnh.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập bằng tài khoản Volunteer, mở Event Detail của một event hợp lệ, bấm Apply và xác nhận application được tạo với status `PENDING`.

**Acceptance Scenarios**:

1. **Given** người dùng là Volunteer đã đăng nhập, **And** event là public/discoverable, còn slot và chưa qua application deadline, **When** Volunteer submit Apply Event, **Then** hệ thống tạo application mới.

2. **Given** application được tạo thành công, **When** hệ thống lưu application, **Then** application mới có status ban đầu là `PENDING`.

3. **Given** apply thành công, **When** hệ thống hiển thị kết quả, **Then** Volunteer thấy success state hoặc success message.

4. **Given** apply thành công, **When** Volunteer muốn xem đơn đã gửi, **Then** hệ thống cung cấp link hoặc điều hướng sang UC13 — View Applied Events.

---

### User Story 2 - Guest không được apply event trực tiếp (Priority: P1)

Là Guest, tôi không được submit application trực tiếp vì hệ thống cần biết danh tính Volunteer trước khi tạo application.

**Why this priority**: Application phải gắn với một Volunteer cụ thể. Guest chưa đăng nhập nên không thể tạo application hợp lệ.

**Independent Test**: Có thể test độc lập bằng cách mở Event Detail khi chưa đăng nhập và bấm Apply.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest, **When** Guest bấm Apply trên Event Detail, **Then** hệ thống yêu cầu login/register hoặc điều hướng sang Authentication flow.

2. **Given** người dùng là Guest, **When** Guest cố submit application, **Then** hệ thống không tạo application.

3. **Given** Guest đăng nhập thành công bằng tài khoản Volunteer, **When** quay lại Apply Event flow, **Then** Volunteer có thể tiếp tục apply nếu event còn hợp lệ.

---

### User Story 3 - Chỉ Volunteer được apply event (Priority: P1)

Là hệ thống, tôi cần đảm bảo chỉ user có role `VOLUNTEER` mới được gửi application trong UC12.

**Why this priority**: Staff, Manager và Admin có nhiệm vụ quản lý hệ thống hoặc xử lý nghiệp vụ khác, không tham gia Volunteer Apply flow.

**Independent Test**: Có thể test độc lập bằng cách thử apply bằng tài khoản Volunteer, Staff, Manager và Admin.

**Acceptance Scenarios**:

1. **Given** người dùng đăng nhập với role `VOLUNTEER`, **When** người dùng submit Apply Event hợp lệ, **Then** hệ thống cho phép tạo application.

2. **Given** người dùng đăng nhập với role `STAFF`, **When** người dùng cố submit Apply Event, **Then** hệ thống chặn request.

3. **Given** người dùng đăng nhập với role `MANAGER`, **When** người dùng cố submit Apply Event, **Then** hệ thống chặn request.

4. **Given** người dùng đăng nhập với role `ADMIN`, **When** người dùng cố submit Apply Event, **Then** hệ thống chặn request.

---

### User Story 4 - Chặn duplicate application (Priority: P1)

Là Volunteer, tôi không được apply nhiều lần vào cùng một event để tránh trùng đơn và sai dữ liệu application.

**Why this priority**: Mỗi Volunteer chỉ nên có một application cho một event. Nếu hệ thống cho apply nhiều lần, Staff sẽ thấy nhiều đơn trùng và dữ liệu sẽ không chính xác.

**Independent Test**: Có thể test độc lập bằng cách dùng cùng một Volunteer apply cùng một event hai lần.

**Acceptance Scenarios**:

1. **Given** Volunteer chưa từng apply event, **When** Volunteer submit Apply Event hợp lệ, **Then** hệ thống tạo application mới.

2. **Given** Volunteer đã apply event đó trước đó, **When** Volunteer submit Apply Event lần nữa, **Then** hệ thống không tạo application trùng.

3. **Given** duplicate application bị chặn, **When** hệ thống trả kết quả, **Then** Volunteer thấy message rõ ràng rằng họ đã apply event này rồi.

4. **Given** duplicate check xảy ra, **When** request được xử lý, **Then** backend/API phải là nơi enforce cuối cùng, không chỉ dựa vào frontend.

---

### User Story 5 - Chặn apply khi event full hoặc hết slot (Priority: P1)

Là Volunteer, tôi không được apply vào event đã full hoặc không còn slot để tránh vượt quá capacity của event.

**Why this priority**: Capacity là business rule quan trọng. Nếu apply vượt slot, Staff sẽ khó quản lý số lượng người tham gia.

**Independent Test**: Có thể test độc lập bằng cách tạo event đã full hoặc remaining slots bằng 0 rồi thử apply.

**Acceptance Scenarios**:

1. **Given** event còn remaining slots, **When** Volunteer submit Apply Event, **Then** hệ thống có thể tạo application nếu các rule khác hợp lệ.

2. **Given** event đã full, **When** Volunteer submit Apply Event, **Then** hệ thống không tạo application.

3. **Given** event không còn remaining slots, **When** Volunteer submit Apply Event, **Then** hệ thống hiển thị error message phù hợp.

4. **Given** nhiều Volunteer apply gần như cùng lúc, **When** capacity gần hết, **Then** backend/API phải chốt cuối cùng để không vượt capacity.

---

### User Story 6 - Chặn apply khi quá application deadline (Priority: P1)

Là Volunteer, tôi không được apply event khi đã quá hạn đăng ký để đảm bảo deadline của event được tuân thủ.

**Why this priority**: Application deadline là rule quan trọng trong event management. Sau deadline, Staff cần chốt danh sách application để review hoặc tổ chức event.

**Independent Test**: Có thể test độc lập bằng cách tạo event có application deadline trong quá khứ và thử apply.

**Acceptance Scenarios**:

1. **Given** event chưa qua application deadline, **When** Volunteer submit Apply Event, **Then** hệ thống có thể tạo application nếu các rule khác hợp lệ.

2. **Given** event đã qua application deadline, **When** Volunteer submit Apply Event, **Then** hệ thống không tạo application.

3. **Given** apply bị chặn do hết deadline, **When** hệ thống trả kết quả, **Then** Volunteer thấy message rõ ràng rằng event đã hết hạn đăng ký.

4. **Given** frontend hiển thị event còn apply được nhưng backend phát hiện đã hết deadline, **When** request được xử lý, **Then** backend/API phải từ chối application.

---

### User Story 7 - Chặn apply event không hợp lệ hoặc không public (Priority: P1)

Là hệ thống, tôi cần đảm bảo Volunteer chỉ được apply event công khai và hợp lệ.

**Why this priority**: Event draft, archived, cancelled, deleted hoặc completed không nên nhận application từ Volunteer.

**Independent Test**: Có thể test độc lập bằng cách thử apply các event có trạng thái khác nhau.

**Acceptance Scenarios**:

1. **Given** event là public/discoverable và hợp lệ, **When** Volunteer submit Apply Event, **Then** hệ thống có thể tạo application.

2. **Given** event là draft, **When** Volunteer submit Apply Event, **Then** hệ thống không tạo application.

3. **Given** event đã soft-deleted, **When** Volunteer submit Apply Event, **Then** hệ thống không tạo application.

4. **Given** event đã archived, cancelled hoặc completed, **When** Volunteer submit Apply Event, **Then** hệ thống không tạo application trong bản đầu.

5. **Given** event không tồn tại, **When** Volunteer submit Apply Event, **Then** hệ thống hiển thị not found/unavailable error.

---

### User Story 8 - Hiển thị form/confirmation trước khi apply (Priority: P2)

Là Volunteer, tôi muốn xem lại thông tin event trước khi xác nhận apply để tránh đăng ký nhầm event.

**Why this priority**: Apply Event là hành động tạo dữ liệu application. Volunteer nên có cơ hội kiểm tra lại event trước khi submit.

**Independent Test**: Có thể test độc lập bằng cách mở Apply Event flow và kiểm tra event summary trước khi submit.

**Acceptance Scenarios**:

1. **Given** Volunteer mở Apply Event flow từ Event Detail, **When** apply screen/confirmation hiển thị, **Then** hệ thống hiển thị event summary.

2. **Given** event summary có dữ liệu, **When** hệ thống hiển thị, **Then** summary có thể gồm title, organization, date/time, location, application deadline và remaining slots.

3. **Given** team sử dụng motivation/message field, **When** Volunteer nhập message, **Then** hệ thống trim và validate độ dài trước khi submit.

4. **Given** motivation/message là optional, **When** Volunteer để trống message, **Then** hệ thống vẫn có thể cho submit nếu các rule khác hợp lệ.

---

### User Story 9 - Loading, submitting, success và error states (Priority: P2)

Là Volunteer, tôi muốn thấy trạng thái rõ ràng khi apply đang xử lý, thành công hoặc thất bại.

**Why this priority**: Apply Event là thao tác quan trọng. Nếu không có trạng thái rõ ràng, Volunteer có thể bấm nhiều lần hoặc không biết application đã được gửi chưa.

**Independent Test**: Có thể test độc lập bằng cách mock submitting, success và các loại error khi apply.

**Acceptance Scenarios**:

1. **Given** Volunteer bấm submit Apply Event, **When** request đang xử lý, **Then** hệ thống hiển thị submitting/loading state.

2. **Given** request đang xử lý, **When** Volunteer bấm submit nhiều lần, **Then** hệ thống không gửi nhiều request trùng từ UI.

3. **Given** apply thành công, **When** hệ thống trả kết quả, **Then** Volunteer thấy success state.

4. **Given** apply thất bại do duplicate, deadline, full event, permission hoặc event không hợp lệ, **When** hệ thống trả kết quả, **Then** Volunteer thấy error message phù hợp.

5. **Given** apply thất bại do lỗi hệ thống, **When** hệ thống trả kết quả, **Then** Volunteer thấy error state dễ hiểu và có thể thử lại nếu phù hợp.

---

## Edge Cases

* **Guest bấm Apply**: Hệ thống yêu cầu login/register hoặc điều hướng sang Authentication flow, không tạo application.

* **Staff bấm Apply**: Hệ thống chặn vì UC12 chỉ dành cho Volunteer.

* **Manager bấm Apply**: Hệ thống chặn vì UC12 chỉ dành cho Volunteer.

* **Admin bấm Apply**: Hệ thống chặn vì UC12 chỉ dành cho Volunteer.

* **Volunteer apply hợp lệ**: Hệ thống tạo application mới với status `PENDING`.

* **Volunteer apply trùng event đã apply**: Hệ thống chặn duplicate application.

* **Volunteer apply event đã full**: Hệ thống không tạo application.

* **Volunteer apply event remaining slots bằng 0**: Hệ thống không tạo application.

* **Volunteer apply event quá deadline**: Hệ thống không tạo application.

* **Volunteer apply event không public**: Hệ thống không tạo application.

* **Volunteer apply event draft**: Hệ thống không tạo application.

* **Volunteer apply event soft-deleted**: Hệ thống không tạo application.

* **Volunteer apply event archived/cancelled/completed**: Bản đầu không cho apply.

* **Event không tồn tại**: Hệ thống hiển thị not found/unavailable error.

* **Apply request đang xử lý**: UI disable submit button hoặc chống submit nhiều lần.

* **Nhiều Volunteer apply cùng lúc khi gần hết slot**: Backend/API phải enforce capacity để tránh vượt slot.

* **Motivation/message rỗng**: Nếu field optional, hệ thống vẫn cho submit.

* **Motivation/message quá dài**: Nếu có field này, hệ thống chặn hoặc hiển thị validation error.

* **Frontend hiển thị event còn apply được nhưng backend phát hiện rule không hợp lệ**: Backend/API phải từ chối application.

---

## Requirements

### Functional Requirements

* **FR-001**: THE system SHALL allow only authenticated users with role `VOLUNTEER` to submit Apply Event.

* **FR-002**: THE system SHALL NOT allow Guest to submit Apply Event.

* **FR-003**: WHEN Guest attempts to apply, THE system SHALL require login/register or navigate to Authentication flow.

* **FR-004**: THE system SHALL NOT allow Staff, Manager or Admin to submit Apply Event through UC12.

* **FR-005**: THE system SHALL create an application when authenticated Volunteer submits a valid Apply Event request.

* **FR-006**: THE system SHALL create new application with initial status `PENDING`.

* **FR-007**: THE system SHALL associate created application with the current Volunteer and selected Event.

* **FR-008**: THE system SHALL prevent a Volunteer from applying more than once to the same event.

* **FR-009**: THE system SHALL reject Apply Event if the event is full.

* **FR-010**: THE system SHALL reject Apply Event if event remaining slots are zero.

* **FR-011**: THE system SHALL reject Apply Event if application deadline has passed.

* **FR-012**: THE system SHALL reject Apply Event if the event does not exist.

* **FR-013**: THE system SHALL reject Apply Event if the event is not public/discoverable.

* **FR-014**: THE system SHALL reject Apply Event if the event is soft-deleted.

* **FR-015**: THE system SHALL reject Apply Event if the event is draft.

* **FR-016**: THE system SHOULD reject Apply Event if the event is archived, cancelled or completed in the first version.

* **FR-017**: THE system SHOULD display event summary before Volunteer confirms Apply Event.

* **FR-018**: Event summary SHOULD include event title.

* **FR-019**: Event summary SHOULD include organization if available.

* **FR-020**: Event summary SHOULD include event date/time.

* **FR-021**: Event summary SHOULD include event location.

* **FR-022**: Event summary SHOULD include application deadline if available.

* **FR-023**: Event summary SHOULD include remaining slots if available.

* **FR-024**: THE system MAY provide optional motivation/message field.

* **FR-025**: IF motivation/message field exists, THE system SHALL trim leading and trailing spaces.

* **FR-026**: IF motivation/message field exists, THE system SHALL validate maximum length.

* **FR-027**: THE system SHALL show submitting/loading state while Apply Event request is being processed.

* **FR-028**: THE system SHALL prevent repeated submit from UI while request is being processed.

* **FR-029**: THE system SHALL display success state when application is created successfully.

* **FR-030**: THE system SHALL provide navigation or link to UC13 — View Applied Events after successful apply.

* **FR-031**: THE system MAY provide navigation back to UC09 — View Event Detail after successful apply.

* **FR-032**: THE system SHALL display clear error message when apply fails due to unauthenticated user.

* **FR-033**: THE system SHALL display clear error message when apply fails due to invalid role.

* **FR-034**: THE system SHALL display clear error message when apply fails due to duplicate application.

* **FR-035**: THE system SHALL display clear error message when apply fails due to full event or no remaining slots.

* **FR-036**: THE system SHALL display clear error message when apply fails due to passed application deadline.

* **FR-037**: THE system SHALL display clear error message when apply fails due to event not found or unavailable.

* **FR-038**: THE system SHALL display general error state when apply fails due to system error.

* **FR-039**: THE system SHALL NOT approve application in UC12.

* **FR-040**: THE system SHALL NOT reject application in UC12.

* **FR-041**: THE system SHALL NOT cancel application in UC12.

* **FR-042**: THE system SHALL NOT perform attendance check in UC12.

* **FR-043**: THE system SHALL NOT submit feedback in UC12.

* **FR-044**: THE system SHALL NOT view, download or generate certificate in UC12.

* **FR-045**: THE system SHALL NOT rely only on frontend validation. Backend/API must enforce authentication, role, duplicate application, deadline, capacity, event visibility and concurrency.

* **FR-046**: THE system SHALL treat UC12 as the only use case in Member 2 that creates Volunteer application.

---

### Key Entities

* **Guest**: Unauthenticated user. Guest can view public events but cannot submit Apply Event.

* **Volunteer**: Authenticated user with role `VOLUNTEER`. Volunteer is allowed to apply event if eligible.

* **Staff**: User with role `STAFF`. Staff manages event and reviews applications in Member 3 module, but does not apply through UC12.

* **Manager**: User with role `MANAGER`. Manager does not apply through UC12.

* **Admin**: User with role `ADMIN`. Admin does not apply through UC12.

* **Event**: Volunteer event that can receive applications if public, not full, not expired and not invalid.

* **Application**: Record connecting Volunteer and Event after Volunteer applies.

* **Application Status**: Status of application such as `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

* **PENDING Application**: Initial application state after Volunteer applies and before Staff review.

* **Application Deadline**: Last allowed time for Volunteer to submit application.

* **Capacity**: Maximum number of Volunteers that the event can accept.

* **Remaining Slots**: Number of available application/participation slots left for event.

* **Apply Eligibility**: Conditions that determine whether Volunteer can apply event.

* **Duplicate Application**: Case where the same Volunteer has already applied to the same event.

* **Motivation / Message**: Optional text Volunteer may provide when applying.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: Guest cannot submit Apply Event.

* **SC-002**: Staff, Manager and Admin cannot submit Apply Event through UC12.

* **SC-003**: Authenticated Volunteer can submit Apply Event for an eligible event.

* **SC-004**: Successful apply creates exactly one application record for the current Volunteer and selected Event.

* **SC-005**: New application has initial status `PENDING`.

* **SC-006**: Volunteer cannot apply the same event more than once.

* **SC-007**: Volunteer cannot apply event after application deadline.

* **SC-008**: Volunteer cannot apply event when event is full or has no remaining slots.

* **SC-009**: Volunteer cannot apply event that is draft, soft-deleted, non-public, archived, cancelled or completed in the first version.

* **SC-010**: Apply flow shows submitting/loading state while request is processing.

* **SC-011**: UI prevents repeated submit while request is processing.

* **SC-012**: Success state is shown after application is created.

* **SC-013**: Volunteer can navigate to UC13 — View Applied Events after successful apply.

* **SC-014**: Clear error messages are shown for duplicate, deadline, capacity, permission and unavailable event cases.

* **SC-015**: Backend/API enforces final apply rules, not frontend only.

---

## Assumptions

* **A-001**: Guest is not stored as a database role.

* **A-002**: Database roles are `VOLUNTEER`, `STAFF`, `MANAGER`, and `ADMIN`.

* **A-003**: UC12 is only for authenticated Volunteer.

* **A-004**: Guest must login/register before applying.

* **A-005**: Staff, Manager and Admin do not use UC12 to apply event.

* **A-006**: UC12 usually starts from UC09 — View Event Detail.

* **A-007**: UC09 only provides Apply entry point and does not create application.

* **A-008**: Application created by UC12 starts with status `PENDING`.

* **A-009**: Staff review, approve and reject applications in Member 3 module.

* **A-010**: Cancel Application is handled by UC14.

* **A-011**: View Applied Events is handled by UC13.

* **A-012**: Duplicate application, deadline, capacity and event visibility must be enforced by backend/API.

* **A-013**: Motivation/message is optional unless team confirms it as required later.

* **A-014**: Mock data can be used temporarily before final API/data contract is ready.

* **A-015**: Mobile app support is out of scope. Feature targets web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC12 — Apply Event và KHÔNG được implement trong use case này:

* View Event List
* Search Event
* Filter Event
* Full Event Detail display
* Staff Add Event
* Staff Edit Event
* Staff Delete Event
* View Applied Events full list
* Cancel Application
* View Volunteer History
* Staff View Application List
* Staff View Application Detail
* Approve Application
* Reject Application
* Attendance Check
* View Attendance List
* View Attendance History
* Submit Feedback
* View Certificates
* Download Certificate
* Generate Certificate
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

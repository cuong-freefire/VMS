# Feature Specification: Volunteer Event Application

**Feature Branch**: `feat/volunteer-event-application`

**Created**: 2026-06-27

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là Volunteer của VMS, tôi muốn đăng ký tham gia một sự kiện tình nguyện sau khi xem chi tiết event để gửi application cho Staff xét duyệt."

---

## User Scenarios & Testing

### User Story 1 - Guest muốn apply event nhưng chưa đăng nhập (Priority: P1)

Là Guest chưa đăng nhập, tôi muốn được hướng dẫn đăng nhập hoặc đăng ký khi muốn apply event để có thể tiếp tục luồng đăng ký hợp lệ.

**Why this priority**: Guest không phải role trong database và không được submit application. Apply Event là protected action, nên hệ thống phải yêu cầu authentication trước.

**Independent Test**: Có thể test độc lập bằng cách mở Event Detail khi chưa đăng nhập, bấm Apply và kiểm tra hệ thống yêu cầu login/register.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest chưa đăng nhập, **When** người dùng bấm Apply từ Event Detail, **Then** hệ thống yêu cầu đăng nhập hoặc điều hướng sang Authentication flow.

2. **Given** người dùng là Guest, **When** người dùng cố submit application, **Then** hệ thống không tạo application mới.

3. **Given** người dùng là Guest, **When** hệ thống yêu cầu đăng nhập, **Then** hệ thống có thể giữ lại thông tin event để user quay lại apply sau khi login.

---

### User Story 2 - Volunteer mở Apply Event flow (Priority: P1)

Là Volunteer đã đăng nhập, tôi muốn mở Apply Event flow từ Event Detail để bắt đầu đăng ký tham gia event.

**Why this priority**: Apply Event phải bắt đầu từ Event Detail để Volunteer xác nhận đúng event trước khi gửi đơn.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập bằng tài khoản Volunteer, mở Event Detail và click Apply.

**Acceptance Scenarios**:

1. **Given** người dùng là Volunteer đã đăng nhập, **And** event còn cho phép đăng ký, **When** người dùng click Apply từ Event Detail, **Then** hệ thống mở Apply Event flow.

2. **Given** Apply Event flow được mở, **When** form hiển thị, **Then** hệ thống hiển thị thông tin tóm tắt của event.

3. **Given** Apply Event flow được mở, **When** Volunteer xem form, **Then** Volunteer có thể xác nhận đúng event trước khi submit.

---

### User Story 3 - Chỉ Volunteer được submit application (Priority: P1)

Là hệ thống, tôi cần đảm bảo chỉ user đã đăng nhập với role `VOLUNTEER` mới được gửi application.

**Why this priority**: Apply Event là hành động tạo dữ liệu. User không đúng role không được tạo application.

**Independent Test**: Có thể test độc lập bằng cách thử submit application bằng Guest, Volunteer, Staff, Manager và Admin.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest, **When** người dùng cố submit application, **Then** hệ thống chặn submit.

2. **Given** người dùng đã đăng nhập nhưng không có role `VOLUNTEER`, **When** người dùng cố submit application, **Then** hệ thống không tạo application và hiển thị forbidden message.

3. **Given** người dùng là Volunteer đã đăng nhập, **When** event đủ điều kiện và form hợp lệ, **Then** hệ thống cho phép submit application.

---

### User Story 4 - Volunteer submit application hợp lệ (Priority: P1)

Là Volunteer, tôi muốn gửi application cho event đủ điều kiện để Staff có thể xét duyệt đơn đăng ký của tôi.

**Why this priority**: Đây là mục tiêu chính của feature Apply Event. Nếu submit hợp lệ không tạo được application, luồng Volunteer Event Module bị gián đoạn.

**Independent Test**: Có thể test độc lập bằng cách dùng tài khoản Volunteer apply một event chưa full, chưa qua deadline và chưa từng apply.

**Acceptance Scenarios**:

1. **Given** Volunteer đã đăng nhập, **And** event tồn tại, **And** event chưa qua application deadline, **And** event chưa full, **And** Volunteer chưa từng apply event đó, **When** Volunteer submit application hợp lệ, **Then** hệ thống tạo application mới.

2. **Given** application được tạo thành công, **When** hệ thống lưu application, **Then** application có status ban đầu là `PENDING`.

3. **Given** application được tạo thành công, **When** hệ thống phản hồi cho Volunteer, **Then** hệ thống hiển thị success state hoặc success message rõ ràng.

4. **Given** application được tạo thành công, **When** success state hiển thị, **Then** hệ thống có thể cho Volunteer đi tới Applied Events hoặc quay lại Event Detail.

---

### User Story 5 - Chặn apply trùng event (Priority: P1)

Là hệ thống, tôi cần chặn Volunteer apply cùng một event nhiều lần để tránh duplicate application.

**Why this priority**: Docs mới chốt mỗi Volunteer chỉ được đăng ký 1 lần cho mỗi sự kiện. Nếu không chặn duplicate, dữ liệu application sẽ sai và Staff phải xử lý thủ công.

**Independent Test**: Có thể test độc lập bằng cách dùng cùng một Volunteer apply cùng một event nhiều lần.

**Acceptance Scenarios**:

1. **Given** Volunteer đã apply một event, **When** Volunteer cố apply lại event đó, **Then** hệ thống không tạo application mới.

2. **Given** Volunteer đã có application `PENDING` cho event, **When** Volunteer cố apply lại, **Then** hệ thống hiển thị thông báo đã đăng ký hoặc đang chờ duyệt.

3. **Given** Volunteer đã có application `APPROVED` cho event, **When** Volunteer cố apply lại, **Then** hệ thống chặn apply lại.

4. **Given** Volunteer chưa từng apply event đó, **When** event đủ điều kiện và form hợp lệ, **Then** hệ thống cho phép submit application.

---

### User Story 6 - Chặn apply khi event đã qua deadline (Priority: P1)

Là hệ thống, tôi cần chặn Volunteer apply event sau application deadline để đảm bảo đúng rule đăng ký.

**Why this priority**: Docs mới chốt Volunteer không thể đăng ký khi đã qua deadline. Đây là rule nghiệp vụ bắt buộc.

**Independent Test**: Có thể test độc lập bằng cách thử apply event đã qua application deadline.

**Acceptance Scenarios**:

1. **Given** event đã qua application deadline, **When** Volunteer mở Apply Event flow, **Then** hệ thống hiển thị trạng thái hết hạn đăng ký hoặc không cho submit.

2. **Given** event đã qua application deadline, **When** Volunteer cố submit application, **Then** hệ thống không tạo application mới.

3. **Given** event chưa qua application deadline, **When** Volunteer submit application hợp lệ, **Then** hệ thống tiếp tục kiểm tra các điều kiện khác.

4. **Given** event chưa qua deadline lúc mở form nhưng qua deadline trước lúc submit, **When** Volunteer submit application, **Then** hệ thống chặn submit và hiển thị lỗi hết hạn đăng ký.

---

### User Story 7 - Chặn apply khi event đã đủ chỗ (Priority: P1)

Là hệ thống, tôi cần chặn Volunteer apply event đã full để tránh vượt quá số lượng Volunteer tối đa.

**Why this priority**: Docs mới chốt Volunteer không thể đăng ký khi sự kiện đã đủ chỗ. Đây là rule quan trọng liên quan capacity.

**Independent Test**: Có thể test độc lập bằng cách thử apply event đã full hoặc còn 0 slot.

**Acceptance Scenarios**:

1. **Given** event đã full, **When** Volunteer mở Apply Event flow, **Then** hệ thống hiển thị trạng thái event đã đủ chỗ hoặc không cho submit.

2. **Given** event còn 0 remaining slots, **When** Volunteer cố submit application, **Then** hệ thống không tạo application mới.

3. **Given** event còn slot, **When** Volunteer submit application hợp lệ, **Then** hệ thống tiếp tục kiểm tra các điều kiện khác.

4. **Given** event còn slot lúc mở form nhưng hết slot trước lúc submit, **When** Volunteer submit application, **Then** hệ thống chặn submit và hiển thị lỗi event đã đủ chỗ.

---

### User Story 8 - Volunteer nhập thông tin đăng ký (Priority: P2)

Là Volunteer, tôi muốn nhập lời nhắn hoặc lý do muốn tham gia event để Staff có thêm thông tin khi xét duyệt.

**Why this priority**: Motivation/message không phải rule bắt buộc trong docs mới, nhưng giúp Staff hiểu lý do Volunteer muốn tham gia.

**Independent Test**: Có thể test độc lập bằng cách nhập motivation/message và kiểm tra validation.

**Acceptance Scenarios**:

1. **Given** Apply Event form đang hiển thị, **When** Volunteer nhập motivation/message hợp lệ, **Then** hệ thống cho phép submit application nếu các business rule khác đều hợp lệ.

2. **Given** motivation/message vượt quá giới hạn độ dài, **When** Volunteer submit form, **Then** hệ thống hiển thị validation error.

3. **Given** motivation/message rỗng, **When** field này là optional trong bản đầu, **Then** hệ thống vẫn cho submit nếu các rule khác hợp lệ.

4. **Given** Volunteer chưa submit form, **When** Apply Event form đang hiển thị, **Then** hệ thống chưa tạo application.

---

### User Story 9 - Loading, submitting, success và error states (Priority: P2)

Là Volunteer, tôi muốn hệ thống hiển thị rõ trạng thái đang gửi, gửi thành công hoặc lỗi để tránh hiểu nhầm và tránh submit nhiều lần.

**Why this priority**: Apply Event là action tạo dữ liệu, cần UX rõ để tránh duplicate request và giảm lỗi thao tác.

**Independent Test**: Có thể test độc lập bằng cách mô phỏng loading, submitting, success và error states.

**Acceptance Scenarios**:

1. **Given** Apply Event đang tải dữ liệu, **When** Volunteer mở Apply Event flow, **Then** hệ thống hiển thị loading state.

2. **Given** Volunteer submit application, **When** hệ thống đang xử lý request, **Then** hệ thống hiển thị submitting state.

3. **Given** hệ thống đang submitting, **When** Volunteer bấm submit nhiều lần, **Then** hệ thống không gửi nhiều request trùng lặp từ frontend.

4. **Given** application được tạo thành công, **When** request hoàn tất, **Then** hệ thống hiển thị success state.

5. **Given** application submit thất bại, **When** hệ thống nhận lỗi, **Then** hệ thống hiển thị error message dễ hiểu và không làm crash trang.

---

## Edge Cases

* **Guest submit application**: WHEN Guest cố submit application, THE system SHALL chặn submit và yêu cầu login/register.

* **User không phải Volunteer submit application**: WHEN authenticated user không có role `VOLUNTEER` cố submit application, THE system SHALL chặn submit.

* **Event không tồn tại**: WHEN Volunteer mở Apply Event của event không tồn tại, THE system SHALL hiển thị not found hoặc unavailable state.

* **Event không khả dụng**: WHERE event không còn khả dụng để apply, THE system SHALL không cho submit application.

* **Volunteer đã apply event**: WHERE Volunteer đã apply event đó trước đây, THE system SHALL không tạo application mới.

* **Volunteer có application PENDING**: WHERE Volunteer đã có application `PENDING`, THE system SHALL không cho apply lại.

* **Volunteer có application APPROVED**: WHERE Volunteer đã có application `APPROVED`, THE system SHALL không cho apply lại.

* **Event quá deadline**: WHERE event đã qua application deadline, THE system SHALL không cho submit application.

* **Deadline hết trong lúc đang mở form**: WHEN event hết deadline trước lúc Volunteer submit, THE system SHALL chặn submit.

* **Event full**: WHERE event đã đủ chỗ, THE system SHALL không cho submit application.

* **Slot hết trong lúc đang mở form**: WHEN event hết slot trước lúc Volunteer submit, THE system SHALL chặn submit.

* **Motivation/message quá dài**: WHEN motivation/message vượt quá giới hạn, THE system SHALL hiển thị validation error.

* **Submit nhiều lần liên tục**: WHEN Volunteer bấm submit nhiều lần trong lúc request đang xử lý, THE system SHALL tránh tạo nhiều request/application trùng lặp.

* **Server/network error**: WHEN submit application thất bại do lỗi server hoặc network, THE system SHALL hiển thị error state/message rõ ràng.

---

## Requirements

### Functional Requirements

* **FR-001**: THE system SHALL allow only authenticated users with role `VOLUNTEER` to submit event application.

* **FR-002**: WHEN Guest attempts to apply, THE system SHALL require login/register or redirect to Authentication flow.

* **FR-003**: WHEN authenticated user is not `VOLUNTEER`, THE system SHALL block application submission.

* **FR-004**: THE system SHALL NOT create application for Guest.

* **FR-005**: THE system SHALL NOT create application for Staff, Manager or Admin in this Volunteer Apply Event flow.

* **FR-006**: Apply Event flow SHALL start from Event Detail or valid event apply entry point.

* **FR-007**: Apply Event flow SHALL display event summary before submission.

* **FR-008**: Event summary SHOULD include event title, date/time, location, category, organization, deadline and remaining slots if available.

* **FR-009**: THE system SHALL allow Volunteer to submit application only when event exists and is available for application.

* **FR-010**: THE system SHALL prevent Volunteer from applying to the same event more than once.

* **FR-011**: THE system SHALL prevent application if Volunteer already has an active or existing application for the same event.

* **FR-012**: THE system SHALL prevent application after the application deadline.

* **FR-013**: THE system SHALL prevent application when event is full.

* **FR-014**: THE system SHALL prevent application when remaining slots are 0 or less.

* **FR-015**: THE system SHALL re-check deadline at submit time.

* **FR-016**: THE system SHALL re-check capacity/remaining slots at submit time.

* **FR-017**: THE system SHALL re-check duplicate application at submit time.

* **FR-018**: THE system SHALL create an application when Volunteer submits valid application for eligible event.

* **FR-019**: Newly created application SHALL have initial status `PENDING`.

* **FR-020**: THE system SHOULD allow Volunteer to enter motivation/message.

* **FR-021**: Motivation/message SHOULD be trimmed before submission.

* **FR-022**: THE system SHALL validate motivation/message length if provided.

* **FR-023**: WHEN application is created successfully, THE system SHALL show success state or success message.

* **FR-024**: AFTER successful application, THE system MAY allow Volunteer to navigate to Applied Events.

* **FR-025**: AFTER successful application, THE system MAY allow Volunteer to return to Event Detail.

* **FR-026**: WHEN application submission is processing, THE system SHALL display submitting/loading state.

* **FR-027**: WHILE application submission is processing, THE system SHALL prevent repeated submit actions from the UI.

* **FR-028**: WHEN application submission fails, THE system SHALL display understandable error message.

* **FR-029**: THE system SHALL NOT approve application in this feature.

* **FR-030**: THE system SHALL NOT reject application in this feature.

* **FR-031**: THE system SHALL NOT cancel application in this feature.

* **FR-032**: THE system SHALL NOT display Applied Events list in this feature.

* **FR-033**: THE system SHALL NOT manage attendance in this feature.

* **FR-034**: THE system SHALL NOT submit feedback in this feature.

* **FR-035**: THE system SHALL NOT generate, view or download certificates in this feature.

* **FR-036**: THE system SHALL NOT rely only on frontend validation for protected actions. Backend/API must enforce authentication, role, duplicate, deadline and capacity rules.

* **FR-037**: THE system SHALL treat event capacity, remaining slots, application deadline and application status as shared data owned by related modules until final API/data contracts are approved.

---

### Key Entities

* **Guest**: Unauthenticated user. Guest is not stored as a database role and cannot submit application.

* **Volunteer**: Authenticated user with role `VOLUNTEER` who can submit application if eligible.

* **Event**: Volunteer event that may be applied to if it exists, is available, not full and not past deadline.

* **Event Application**: Record representing Volunteer’s request to join an event.

* **Application Status**: Status of an application. New application starts as `PENDING`.

* **Application Deadline**: Deadline for submitting application to an event.

* **Capacity**: Maximum number of Volunteers that the event can accept.

* **Remaining Slots**: Number of available slots left for application.

* **Duplicate Application**: Case where the same Volunteer tries to apply to the same event more than once.

* **Motivation / Message**: Optional text entered by Volunteer to explain why they want to join the event.

* **Staff Review**: Staff-side process of approving or rejecting application after submission. It is not handled in this feature.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: 100% Guest users are blocked from submitting application and are asked to login/register.

* **SC-002**: 100% authenticated non-Volunteer users are blocked from submitting application in this Volunteer Apply Event flow.

* **SC-003**: Volunteer can open Apply Event flow from Event Detail.

* **SC-004**: Volunteer can submit application for an eligible event.

* **SC-005**: 100% successful new applications start with status `PENDING`.

* **SC-006**: 100% duplicate application attempts for the same Volunteer and same event are blocked.

* **SC-007**: 100% application attempts after deadline are blocked.

* **SC-008**: 100% application attempts for full events are blocked.

* **SC-009**: Submit action re-checks duplicate, deadline and capacity before creating application.

* **SC-010**: Submit button does not create multiple applications when clicked repeatedly during processing.

* **SC-011**: User sees clear success state after successful application submission.

* **SC-012**: User sees clear error state when application submission fails.

* **SC-013**: Apply Event feature does not approve, reject, cancel, manage attendance, submit feedback or manage certificates.

---

## Assumptions

* **A-001**: Guest is not stored as a database role.

* **A-002**: Database roles are `VOLUNTEER`, `STAFF`, `MANAGER`, and `ADMIN`.

* **A-003**: Apply Event belongs to Member 2 — Volunteer Event Module.

* **A-004**: Apply Event corresponds to UC12 — Apply Event.

* **A-005**: Apply Event starts from Event Detail.

* **A-006**: Guest must login/register before applying.

* **A-007**: Only authenticated Volunteer can submit application.

* **A-008**: Staff, Manager and Admin do not submit application through this Volunteer Apply Event flow.

* **A-009**: Volunteer can apply only once for each event.

* **A-010**: Volunteer cannot apply after application deadline.

* **A-011**: Volunteer cannot apply when event is full.

* **A-012**: Application created successfully starts as `PENDING`.

* **A-013**: Staff approve/reject application in Staff Module.

* **A-014**: Volunteer can view submitted application in Applied Events feature.

* **A-015**: Volunteer can cancel only `PENDING` application, but cancel is handled in Applied Events feature.

* **A-016**: Only Volunteer with `APPROVED` application can check in, but attendance is handled in Attendance Management.

* **A-017**: Volunteer can submit feedback only after successful attendance, but feedback is handled in another feature.

* **A-018**: Staff can generate certificates only for attended Volunteers, but certificate generation is not in this feature.

* **A-019**: Motivation/message can be optional in the first version.

* **A-020**: Backend/API must be the final authority for duplicate, deadline and capacity rules.

* **A-021**: Mock data can be used temporarily if API/data are not ready.

* **A-022**: Mobile app support is out of scope. Feature targets web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của Volunteer Event Application và KHÔNG được implement trong feature này:

* Event List
* Search Event
* Filter Event
* Event Detail full display
* Applied Event List
* Cancel Application
* Volunteer History
* Attendance Check-in
* Attendance History
* Feedback Form
* Feedback List
* Certificate List
* Certificate Detail
* Download Certificate
* Generate Certificate
* Staff Application List
* Staff Application Detail
* Approve Application
* Reject Application
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

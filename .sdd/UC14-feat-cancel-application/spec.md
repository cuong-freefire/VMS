# Feature Specification: Cancel Application

**Feature Branch**: `feat/cancel-application`

**Created**: 2026-06-27

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là Volunteer đã đăng nhập, tôi muốn hủy application đang chờ duyệt để không tiếp tục đăng ký tham gia event đó nữa."

---

## User Scenarios & Testing

### User Story 1 - Volunteer cancel application đang PENDING (Priority: P1)

Là Volunteer đã đăng nhập, tôi muốn hủy application của chính mình khi application vẫn đang chờ duyệt.

**Why this priority**: Volunteer có thể đổi ý, bận lịch hoặc apply nhầm event. Hệ thống cần cho phép hủy application trước khi Staff duyệt.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập bằng tài khoản Volunteer, mở Applied Events page, chọn application `PENDING` và thực hiện cancel.

**Acceptance Scenarios**:

1. **Given** người dùng là Volunteer đã đăng nhập, **And** application thuộc về Volunteer hiện tại, **And** application có status `PENDING`, **When** Volunteer xác nhận cancel application, **Then** hệ thống chuyển application sang status `CANCELLED`.

2. **Given** cancel application thành công, **When** Applied Events page cập nhật, **Then** application đó hiển thị status `CANCELLED`.

3. **Given** cancel application thành công, **When** hệ thống hiển thị kết quả, **Then** Volunteer thấy success message hoặc success state phù hợp.

4. **Given** application đã chuyển sang `CANCELLED`, **When** Applied Events page hiển thị lại, **Then** hệ thống không hiển thị Cancel action cho application đó nữa.

---

### User Story 2 - Chỉ Volunteer đã đăng nhập được cancel application (Priority: P1)

Là hệ thống, tôi cần đảm bảo chỉ Volunteer đã đăng nhập mới được cancel application theo flow Volunteer.

**Why this priority**: Cancel Application là thao tác thay đổi dữ liệu cá nhân. Guest hoặc user không đúng role không được phép thực hiện.

**Independent Test**: Có thể test độc lập bằng cách thử cancel application bằng Guest, Volunteer, Staff, Manager và Admin.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest, **When** người dùng cố cancel application, **Then** hệ thống yêu cầu login/register hoặc điều hướng sang Authentication flow.

2. **Given** người dùng đăng nhập với role `VOLUNTEER`, **And** application thuộc về Volunteer hiện tại, **When** Volunteer cancel application hợp lệ, **Then** hệ thống cho phép cancel.

3. **Given** người dùng đăng nhập với role `STAFF`, **When** người dùng cố cancel application theo Volunteer flow, **Then** hệ thống chặn request.

4. **Given** người dùng đăng nhập với role `MANAGER` hoặc `ADMIN`, **When** người dùng cố cancel application theo Volunteer flow, **Then** hệ thống chặn request.

---

### User Story 3 - Volunteer chỉ được cancel application của chính mình (Priority: P1)

Là Volunteer, tôi chỉ được hủy application thuộc về tài khoản của tôi, không được hủy application của Volunteer khác.

**Why this priority**: Đây là yêu cầu bảo mật và ownership dữ liệu. Nếu Volunteer có thể cancel application của người khác, hệ thống sẽ sai nghiệp vụ nghiêm trọng.

**Independent Test**: Có thể test bằng cách tạo hai tài khoản Volunteer khác nhau, sau đó thử để Volunteer A cancel application của Volunteer B.

**Acceptance Scenarios**:

1. **Given** application thuộc về Volunteer A, **When** Volunteer A cancel application đó, **Then** hệ thống cho phép nếu application đủ điều kiện.

2. **Given** application thuộc về Volunteer B, **When** Volunteer A cố cancel application đó, **Then** hệ thống chặn request.

3. **Given** request cố truy cập application không thuộc current Volunteer, **When** backend/API xử lý, **Then** backend/API không cho phép thay đổi trạng thái application.

4. **Given** frontend không hiển thị application của Volunteer khác, **When** user cố gọi request không hợp lệ, **Then** backend/API vẫn phải enforce ownership.

---

### User Story 4 - Chỉ application PENDING được cancel (Priority: P1)

Là hệ thống, tôi cần đảm bảo chỉ application đang chờ duyệt mới được Volunteer cancel.

**Why this priority**: Nếu application đã được Staff duyệt, từ chối hoặc đã hủy, Volunteer không nên tự thay đổi trạng thái bằng flow cancel này.

**Independent Test**: Có thể test bằng cách tạo application với status `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` và thử cancel từng trạng thái.

**Acceptance Scenarios**:

1. **Given** application có status `PENDING`, **When** Volunteer cancel application, **Then** hệ thống cho phép cancel nếu các rule khác hợp lệ.

2. **Given** application có status `APPROVED`, **When** Volunteer cố cancel, **Then** hệ thống không cho cancel và hiển thị message phù hợp.

3. **Given** application có status `REJECTED`, **When** Volunteer cố cancel, **Then** hệ thống không cho cancel.

4. **Given** application có status `CANCELLED`, **When** Volunteer cố cancel lại, **Then** hệ thống không cho cancel.

5. **Given** application không còn ở status `PENDING` tại thời điểm backend xử lý, **When** request cancel được gửi, **Then** backend/API phải từ chối request.

---

### User Story 5 - Xác nhận trước khi cancel (Priority: P1)

Là Volunteer, tôi muốn hệ thống hỏi xác nhận trước khi hủy application để tránh thao tác nhầm.

**Why this priority**: Cancel Application là hành động thay đổi dữ liệu. Nếu không có confirmation, Volunteer có thể hủy nhầm application.

**Independent Test**: Có thể test bằng cách bấm Cancel trên application `PENDING` và kiểm tra confirmation xuất hiện trước khi request được gửi.

**Acceptance Scenarios**:

1. **Given** application có status `PENDING`, **When** Volunteer bấm Cancel, **Then** hệ thống hiển thị confirmation dialog hoặc confirmation step.

2. **Given** confirmation đang hiển thị, **When** Volunteer chọn không xác nhận, **Then** hệ thống không gửi cancel request.

3. **Given** confirmation đang hiển thị, **When** Volunteer xác nhận cancel, **Then** hệ thống gửi cancel request.

4. **Given** cancel request chưa được xác nhận, **When** Volunteer đóng confirmation, **Then** application status không thay đổi.

---

### User Story 6 - UC14 nằm chung màn Applied Events với UC13 (Priority: P1)

Là hệ thống, tôi cần đảm bảo Cancel Application được implement như một action trong Applied Events page thay vì tạo một page riêng không cần thiết.

**Why this priority**: Team tách docs theo từng UC, nhưng UC13 và UC14 là cùng một trải nghiệm người dùng. Cancel action nên nằm trong item của Applied Events page để tránh flow rời rạc và trùng code.

**Independent Test**: Có thể test bằng cách mở Applied Events page và kiểm tra Cancel action nằm trong application item đủ điều kiện.

**Acceptance Scenarios**:

1. **Given** Applied Events page được hiển thị, **When** application có status `PENDING`, **Then** Cancel action xuất hiện trong application item.

2. **Given** application không có status `PENDING`, **When** Applied Events page hiển thị, **Then** Cancel action không xuất hiện hoặc bị disabled với message phù hợp.

3. **Given** Codex sinh code cho UC14, **When** implementation được tạo, **Then** Codex không nên tạo standalone page chỉ để cancel application nếu không cần.

4. **Given** cancel thành công, **When** Applied Events page cập nhật, **Then** item tương ứng đổi status sang `CANCELLED` hoặc danh sách được refresh.

---

### User Story 7 - Optional cancel reason (Priority: P2)

Là Volunteer, tôi có thể nhập lý do hủy application để Staff hiểu vì sao tôi không tiếp tục tham gia.

**Why this priority**: Cancel reason có thể hữu ích cho Staff và dữ liệu nghiệp vụ, nhưng không nhất thiết phải bắt buộc trong bản đầu nếu team chưa chốt.

**Independent Test**: Có thể test bằng cách bật cancel reason field, nhập lý do hợp lệ, lý do rỗng và lý do quá dài.

**Acceptance Scenarios**:

1. **Given** cancel reason field được hỗ trợ, **When** Volunteer nhập reason hợp lệ, **Then** hệ thống gửi reason cùng cancel request.

2. **Given** cancel reason field là optional, **When** Volunteer để trống reason, **Then** hệ thống vẫn cho cancel nếu các rule khác hợp lệ.

3. **Given** Volunteer nhập reason có khoảng trắng đầu/cuối, **When** request được gửi, **Then** hệ thống trim reason.

4. **Given** Volunteer nhập reason quá dài, **When** xác nhận cancel, **Then** hệ thống hiển thị validation error hoặc từ chối request.

---

### User Story 8 - Loading, success và error states khi cancel (Priority: P2)

Là Volunteer, tôi muốn thấy trạng thái rõ ràng khi cancel đang xử lý, thành công hoặc thất bại.

**Why this priority**: Cancel Application là thao tác thay đổi trạng thái. Nếu không có trạng thái rõ ràng, Volunteer có thể bấm nhiều lần hoặc không biết application đã được hủy chưa.

**Independent Test**: Có thể test bằng cách mock cancelling, success và các lỗi như sai role, sai owner, status không hợp lệ, application không tồn tại hoặc lỗi hệ thống.

**Acceptance Scenarios**:

1. **Given** Volunteer xác nhận cancel, **When** request đang xử lý, **Then** hệ thống hiển thị cancelling/submitting state.

2. **Given** request đang xử lý, **When** Volunteer bấm cancel nhiều lần, **Then** hệ thống không gửi nhiều request trùng từ UI.

3. **Given** cancel thành công, **When** hệ thống trả kết quả, **Then** Volunteer thấy success state.

4. **Given** cancel thất bại do application không phải `PENDING`, **When** hệ thống trả kết quả, **Then** Volunteer thấy error message phù hợp.

5. **Given** cancel thất bại do permission, ownership, application không tồn tại hoặc lỗi hệ thống, **When** hệ thống trả kết quả, **Then** Volunteer thấy error state dễ hiểu.

---

### User Story 9 - Xử lý concurrency khi Staff review cùng lúc (Priority: P2)

Là hệ thống, tôi cần xử lý trường hợp Staff approve/reject application cùng lúc Volunteer đang cancel để tránh trạng thái application bị sai.

**Why this priority**: Application có thể được Staff review trong lúc Volunteer đang thao tác cancel. Backend/API phải kiểm tra trạng thái mới nhất trước khi cập nhật.

**Independent Test**: Có thể test bằng cách mô phỏng application chuyển từ `PENDING` sang `APPROVED` hoặc `REJECTED` trước khi request cancel hoàn tất.

**Acceptance Scenarios**:

1. **Given** application đang hiển thị là `PENDING` ở frontend, **And** Staff đã approve application trước khi cancel request đến backend, **When** backend xử lý cancel, **Then** backend từ chối cancel vì status không còn `PENDING`.

2. **Given** application đang hiển thị là `PENDING` ở frontend, **And** Staff đã reject application trước khi cancel request đến backend, **When** backend xử lý cancel, **Then** backend từ chối cancel vì status không còn `PENDING`.

3. **Given** cancel bị từ chối do status đã thay đổi, **When** frontend nhận response, **Then** Applied Events page cần refresh hoặc cập nhật status mới.

---

## Edge Cases

* **Guest cancel application**: Hệ thống yêu cầu login/register hoặc điều hướng sang Authentication flow, không thay đổi application.

* **Staff cancel theo Volunteer flow**: Hệ thống chặn vì Staff không dùng UC14.

* **Manager/Admin cancel theo Volunteer flow**: Hệ thống chặn vì không phải Volunteer flow.

* **Volunteer cancel application của người khác**: Backend/API chặn request.

* **Application không tồn tại**: Hệ thống hiển thị not found hoặc unavailable error.

* **Application thuộc Volunteer khác**: Hệ thống chặn quyền truy cập.

* **Application `PENDING`**: Hệ thống cho phép cancel nếu các rule khác hợp lệ.

* **Application `APPROVED`**: Hệ thống không cho Volunteer tự cancel trong bản đầu; hiển thị message liên hệ Staff nếu cần.

* **Application `REJECTED`**: Hệ thống không cho cancel.

* **Application `CANCELLED`**: Hệ thống không cho cancel lại.

* **Volunteer đóng confirmation**: Hệ thống không gửi cancel request.

* **Volunteer xác nhận cancel**: Hệ thống gửi cancel request nếu application đủ điều kiện.

* **Cancel reason rỗng**: Nếu reason optional, hệ thống vẫn cho cancel.

* **Cancel reason quá dài**: Hệ thống hiển thị validation error nếu reason field được hỗ trợ.

* **Cancel request đang xử lý**: UI disable cancel button hoặc chống submit nhiều lần.

* **Staff approve/reject cùng lúc Volunteer cancel**: Backend/API kiểm tra status mới nhất và chỉ cho cancel nếu vẫn `PENDING`.

* **Cancel thành công nhưng refresh list thất bại**: UI cần hiển thị success và có cách reload hoặc cập nhật item cục bộ nếu có thể.

---

## Requirements

### Functional Requirements

* **FR-001**: THE system SHALL allow only authenticated users with role `VOLUNTEER` to cancel application through UC14.

* **FR-002**: THE system SHALL NOT allow Guest to cancel application.

* **FR-003**: WHEN Guest attempts to cancel application, THE system SHALL require login/register or navigate to Authentication flow.

* **FR-004**: THE system SHALL NOT allow Staff, Manager or Admin to cancel application through Volunteer Cancel Application flow.

* **FR-005**: THE system SHALL allow Volunteer to cancel only applications that belong to the current Volunteer.

* **FR-006**: THE system SHALL NOT allow Volunteer to cancel applications belonging to another Volunteer.

* **FR-007**: THE system SHALL allow cancel only when application status is `PENDING`.

* **FR-008**: THE system SHALL NOT allow Volunteer to cancel application with status `APPROVED` in the first version.

* **FR-009**: THE system SHALL NOT allow Volunteer to cancel application with status `REJECTED`.

* **FR-010**: THE system SHALL NOT allow Volunteer to cancel application with status `CANCELLED`.

* **FR-011**: WHEN cancel succeeds, THE system SHALL update application status to `CANCELLED`.

* **FR-012**: THE system SHALL show Cancel action only for application that is eligible for cancel, normally `PENDING`.

* **FR-013**: THE system SHALL show confirmation before sending cancel request.

* **FR-014**: WHEN Volunteer rejects/closes confirmation, THE system SHALL NOT send cancel request.

* **FR-015**: WHEN Volunteer confirms cancellation, THE system SHALL send cancel request.

* **FR-016**: THE system SHOULD implement UC14 as an action inside UC13 Applied Events page.

* **FR-017**: THE system SHOULD NOT create a standalone page only for Cancel Application if the action can be handled inside Applied Events page.

* **FR-018**: WHEN cancel succeeds, THE system SHALL update the Applied Events item status to `CANCELLED` or refresh the Applied Events list.

* **FR-019**: THE system MAY provide optional cancel reason field.

* **FR-020**: IF cancel reason field exists, THE system SHALL trim leading and trailing spaces.

* **FR-021**: IF cancel reason field exists, THE system SHALL validate maximum length.

* **FR-022**: IF cancel reason field is optional, THE system SHALL allow empty reason.

* **FR-023**: THE system SHALL show cancelling/submitting state while cancel request is processing.

* **FR-024**: THE system SHALL prevent repeated cancel submit from UI while request is processing.

* **FR-025**: THE system SHALL display success state when application is cancelled successfully.

* **FR-026**: THE system SHALL display clear error message when cancel fails due to unauthenticated user.

* **FR-027**: THE system SHALL display clear error message when cancel fails due to invalid role.

* **FR-028**: THE system SHALL display clear error message when cancel fails due to ownership violation.

* **FR-029**: THE system SHALL display clear error message when cancel fails because application is not `PENDING`.

* **FR-030**: THE system SHALL display clear error message when cancel fails because application does not exist.

* **FR-031**: THE system SHALL display general error state when cancel fails due to system error.

* **FR-032**: THE system SHALL NOT create application in UC14.

* **FR-033**: THE system SHALL NOT approve application in UC14.

* **FR-034**: THE system SHALL NOT reject application in UC14.

* **FR-035**: THE system SHALL NOT perform attendance check in UC14.

* **FR-036**: THE system SHALL NOT submit feedback in UC14.

* **FR-037**: THE system SHALL NOT view, download or generate certificate in UC14.

* **FR-038**: THE system SHALL NOT rely only on frontend validation. Backend/API must enforce authentication, role, ownership, application status and concurrency.

* **FR-039**: THE system SHALL check latest application status at request time before updating to `CANCELLED`.

* **FR-040**: IF application status changes before cancel request is processed, THE system SHALL reject cancel unless the latest status is still `PENDING`.

---

### Key Entities

* **Guest**: Unauthenticated user. Guest cannot cancel application.

* **Volunteer**: Authenticated user with role `VOLUNTEER`. Volunteer can cancel their own eligible application.

* **Staff**: User with role `STAFF`. Staff reviews applications in Member 3 module, not through UC14.

* **Application**: Record connecting a Volunteer and an Event after UC12 Apply Event.

* **Application Status**: Status of an application such as `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

* **PENDING Application**: Application waiting for Staff review. It is the only status cancelable by Volunteer in the first version.

* **APPROVED Application**: Application approved by Staff. Volunteer cannot self-cancel it in the first version.

* **REJECTED Application**: Application rejected by Staff. It cannot be cancelled by Volunteer.

* **CANCELLED Application**: Application cancelled by Volunteer. It cannot be cancelled again.

* **Cancel Action**: Button/action shown on Applied Events item when application is eligible for cancellation.

* **Cancel Confirmation**: Confirmation dialog or step before sending cancel request.

* **Cancel Reason**: Optional reason entered by Volunteer when cancelling application.

* **Applied Events Page**: Shared page from UC13 where the cancel action is displayed and triggered.

* **Ownership Boundary**: Rule that Volunteer can cancel only their own application.

* **Concurrency Check**: Backend/API check that application is still `PENDING` at the time cancel request is processed.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: Guest cannot cancel application.

* **SC-002**: Staff, Manager and Admin cannot cancel application through Volunteer Cancel Application flow.

* **SC-003**: Authenticated Volunteer can cancel only their own application.

* **SC-004**: Volunteer cannot cancel application of another Volunteer.

* **SC-005**: Only application with status `PENDING` can be cancelled in the first version.

* **SC-006**: Application with status `APPROVED`, `REJECTED` or `CANCELLED` cannot be cancelled by Volunteer.

* **SC-007**: Successful cancel updates application status to `CANCELLED`.

* **SC-008**: Cancel action appears only for eligible application in Applied Events page.

* **SC-009**: Confirmation appears before cancel request is sent.

* **SC-010**: Closing or rejecting confirmation does not change application status.

* **SC-011**: UI prevents repeated cancel request while cancelling is processing.

* **SC-012**: Applied Events page updates item status or refreshes list after successful cancel.

* **SC-013**: Clear error messages are shown for unauthenticated, invalid role, ownership violation, invalid status and not found cases.

* **SC-014**: Backend/API enforces authentication, role, ownership, status and concurrency, not frontend only.

* **SC-015**: Codex/implementation does not create a standalone Cancel Application page when the action can be implemented inside Applied Events page.

---

## Assumptions

* **A-001**: Guest is not stored as a database role.

* **A-002**: Database roles are `VOLUNTEER`, `STAFF`, `MANAGER`, and `ADMIN`.

* **A-003**: UC14 is only for authenticated Volunteer.

* **A-004**: Guest must login/register before interacting with personal application data.

* **A-005**: Staff, Manager and Admin do not use UC14 as their application management flow.

* **A-006**: Volunteer can only cancel application records that belong to themselves.

* **A-007**: UC14 usually starts from UC13 Applied Events page.

* **A-008**: UC14 should be implemented as a cancel action in Applied Events page when possible.

* **A-009**: Application statuses in the first version include `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

* **A-010**: Only `PENDING` application is cancelable by Volunteer in the first version.

* **A-011**: `APPROVED` application cannot be self-cancelled by Volunteer in the first version.

* **A-012**: `REJECTED` and `CANCELLED` applications cannot be cancelled.

* **A-013**: Cancel reason is optional unless team confirms it as required later.

* **A-014**: Backend/API must check the latest application status before updating it.

* **A-015**: Mock data can be used temporarily before final API/data contract is ready.

* **A-016**: Mobile app support is out of scope. Feature targets web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC14 — Cancel Application và KHÔNG được implement trong use case này:

* View Event List
* Search Event
* Filter Event
* Full Event Detail display
* Apply Event submission
* Application form
* View Applied Events full list
* Staff View Application List
* Staff View Application Detail
* Approve Application
* Reject Application
* Attendance Check
* View Attendance List
* View Attendance History
* View Volunteer History
* Submit Feedback
* View Certificates
* Download Certificate
* Generate Certificate
* Add Event
* Edit Event
* Delete Event
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

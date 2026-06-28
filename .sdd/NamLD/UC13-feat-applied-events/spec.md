# Feature Specification: View Applied Events

**Feature Branch**: `feat/applied-events`

**Created**: 2026-06-27

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là Volunteer đã đăng nhập, tôi muốn xem danh sách các event mà tôi đã apply để theo dõi trạng thái application của mình."

---

## User Scenarios & Testing

### User Story 1 - Volunteer xem danh sách event đã apply (Priority: P1)

Là Volunteer đã đăng nhập, tôi muốn xem danh sách các event mà tôi đã apply để biết application của mình đang ở trạng thái nào.

**Why this priority**: Sau khi Volunteer apply event ở UC12, họ cần một nơi để theo dõi application đã gửi. Nếu không có Applied Events, Volunteer sẽ không biết đơn của mình đang pending, approved, rejected hay cancelled.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập bằng tài khoản Volunteer đã apply một hoặc nhiều event, sau đó mở Applied Events page.

**Acceptance Scenarios**:

1. **Given** người dùng là Volunteer đã đăng nhập, **When** Volunteer mở Applied Events page, **Then** hệ thống hiển thị danh sách application của Volunteer hiện tại.

2. **Given** Volunteer có nhiều application, **When** Applied Events page hiển thị, **Then** mỗi item hiển thị thông tin tóm tắt của event và trạng thái application.

3. **Given** Volunteer chưa apply event nào, **When** Volunteer mở Applied Events page, **Then** hệ thống hiển thị empty state phù hợp.

4. **Given** hệ thống tải danh sách applied events thất bại, **When** lỗi xảy ra, **Then** hệ thống hiển thị error state dễ hiểu.

---

### User Story 2 - Chỉ Volunteer đã đăng nhập được xem Applied Events (Priority: P1)

Là hệ thống, tôi cần đảm bảo Applied Events chỉ được xem bởi Volunteer đã đăng nhập vì đây là dữ liệu cá nhân.

**Why this priority**: Applied Events chứa thông tin application cá nhân của Volunteer. Guest hoặc user không đúng role không được xem dữ liệu này.

**Independent Test**: Có thể test độc lập bằng cách thử mở Applied Events page bằng Guest, Volunteer, Staff, Manager và Admin.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest, **When** người dùng mở Applied Events page, **Then** hệ thống yêu cầu login/register hoặc điều hướng sang Authentication flow.

2. **Given** người dùng đăng nhập với role `VOLUNTEER`, **When** người dùng mở Applied Events page, **Then** hệ thống cho phép xem danh sách application của chính mình.

3. **Given** người dùng đăng nhập với role `STAFF`, **When** người dùng mở Applied Events page, **Then** hệ thống chặn truy cập vào Volunteer Applied Events.

4. **Given** người dùng đăng nhập với role `MANAGER` hoặc `ADMIN`, **When** người dùng mở Applied Events page, **Then** hệ thống chặn truy cập vào Volunteer Applied Events.

---

### User Story 3 - Volunteer chỉ xem được application của chính mình (Priority: P1)

Là Volunteer, tôi chỉ được xem danh sách application thuộc về tài khoản của tôi, không được xem application của Volunteer khác.

**Why this priority**: Đây là yêu cầu bảo mật và ownership dữ liệu. Nếu Volunteer xem được application của người khác, hệ thống bị lộ dữ liệu cá nhân.

**Independent Test**: Có thể test bằng cách có hai tài khoản Volunteer khác nhau, mỗi tài khoản có application riêng, sau đó kiểm tra dữ liệu hiển thị.

**Acceptance Scenarios**:

1. **Given** Volunteer A đã apply event, **When** Volunteer A mở Applied Events page, **Then** hệ thống hiển thị application của Volunteer A.

2. **Given** Volunteer B đã apply event khác, **When** Volunteer A mở Applied Events page, **Then** hệ thống không hiển thị application của Volunteer B.

3. **Given** request cố truy cập application không thuộc current Volunteer, **When** hệ thống xử lý, **Then** backend/API phải chặn quyền truy cập.

4. **Given** frontend nhận dữ liệu từ API, **When** Applied Events hiển thị, **Then** frontend chỉ render dữ liệu được phép của current Volunteer.

---

### User Story 4 - Xem trạng thái application (Priority: P1)

Là Volunteer, tôi muốn xem trạng thái của từng application để biết đơn của mình đang chờ duyệt, đã được duyệt, bị từ chối hoặc đã hủy.

**Why this priority**: Trạng thái application là thông tin quan trọng nhất trong Applied Events. Volunteer cần biết kết quả xử lý từ Staff.

**Independent Test**: Có thể test bằng cách tạo application với các status `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` và kiểm tra hiển thị.

**Acceptance Scenarios**:

1. **Given** application có status `PENDING`, **When** Applied Events page hiển thị, **Then** hệ thống hiển thị trạng thái đang chờ duyệt.

2. **Given** application có status `APPROVED`, **When** Applied Events page hiển thị, **Then** hệ thống hiển thị trạng thái đã được duyệt.

3. **Given** application có status `REJECTED`, **When** Applied Events page hiển thị, **Then** hệ thống hiển thị trạng thái bị từ chối.

4. **Given** application có status `CANCELLED`, **When** Applied Events page hiển thị, **Then** hệ thống hiển thị trạng thái đã hủy.

5. **Given** application có review note hoặc rejection reason, **When** dữ liệu có sẵn, **Then** hệ thống có thể hiển thị ghi chú phù hợp cho Volunteer.

---

### User Story 5 - Xem thông tin tóm tắt của event đã apply (Priority: P1)

Là Volunteer, tôi muốn xem thông tin tóm tắt của event trong mỗi application để nhận biết event nào tương ứng với application đó.

**Why this priority**: Nếu chỉ hiển thị status mà không có thông tin event, Volunteer sẽ khó biết application đó thuộc event nào.

**Independent Test**: Có thể test bằng cách mở Applied Events page và kiểm tra thông tin event trong từng item.

**Acceptance Scenarios**:

1. **Given** applied event có đầy đủ dữ liệu, **When** Applied Events page hiển thị, **Then** hệ thống hiển thị event title.

2. **Given** applied event có dữ liệu organization, **When** item hiển thị, **Then** hệ thống hiển thị organization.

3. **Given** applied event có dữ liệu date/time và location, **When** item hiển thị, **Then** hệ thống hiển thị date/time và location.

4. **Given** applied event có thumbnail, **When** item hiển thị, **Then** hệ thống hiển thị thumbnail.

5. **Given** applied event thiếu thumbnail, **When** item hiển thị, **Then** hệ thống hiển thị fallback image hoặc fallback UI.

---

### User Story 6 - Điều hướng sang Event Detail từ Applied Events (Priority: P2)

Là Volunteer, tôi muốn mở lại chi tiết event từ danh sách Applied Events để xem thông tin đầy đủ của event đã apply.

**Why this priority**: Volunteer có thể cần xem lại thời gian, địa điểm, mô tả hoặc thông tin tổ chức của event sau khi đã apply.

**Independent Test**: Có thể test bằng cách click View Detail trên một applied event item và kiểm tra điều hướng sang UC09.

**Acceptance Scenarios**:

1. **Given** applied event vẫn public/available, **When** Volunteer click View Detail, **Then** hệ thống điều hướng sang UC09 — View Event Detail.

2. **Given** event đã bị soft-deleted hoặc không còn available, **When** Volunteer click View Detail, **Then** hệ thống không hiển thị detail không hợp lệ.

3. **Given** event không còn available, **When** Applied Events page hiển thị, **Then** View Detail có thể bị disabled hoặc điều hướng sang unavailable state.

---

### User Story 7 - Hiển thị cancel action cho application đủ điều kiện (Priority: P2)

Là Volunteer, tôi muốn thấy nút cancel ở application đủ điều kiện để có thể hủy application khi còn được phép.

**Why this priority**: Cancel Application là UC14, nhưng action này nên xuất hiện ngay trong Applied Events page để người dùng thao tác thuận tiện.

**Independent Test**: Có thể test bằng cách tạo application `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` và kiểm tra cancel action hiển thị đúng.

**Acceptance Scenarios**:

1. **Given** application có status `PENDING`, **When** Applied Events page hiển thị, **Then** hệ thống có thể hiển thị Cancel action.

2. **Given** application có status `APPROVED`, **When** Applied Events page hiển thị, **Then** hệ thống không cho Volunteer tự cancel trong bản đầu.

3. **Given** application có status `REJECTED`, **When** Applied Events page hiển thị, **Then** hệ thống không hiển thị Cancel action.

4. **Given** application có status `CANCELLED`, **When** Applied Events page hiển thị, **Then** hệ thống không hiển thị Cancel action.

5. **Given** Volunteer bấm Cancel action, **When** hệ thống xử lý, **Then** flow xử lý cancel thuộc UC14 — Cancel Application.

---

### User Story 8 - UC13 và UC14 dùng chung màn Applied Events (Priority: P1)

Là hệ thống, tôi cần đảm bảo UC13 View Applied Events và UC14 Cancel Application được implement chung trên cùng một màn Applied Events.

**Why this priority**: Team tách docs theo từng UC, nhưng View Applied Events và Cancel Application là cùng một trải nghiệm người dùng. Nếu Codex tạo page riêng chỉ để cancel application thì sai flow và gây trùng code.

**Independent Test**: Có thể test bằng cách kiểm tra cancel action nằm trong Applied Events page, không phải một page tách biệt không cần thiết.

**Acceptance Scenarios**:

1. **Given** Applied Events page được hiển thị, **When** application đủ điều kiện cancel, **Then** Cancel action nằm trong item của Applied Events page.

2. **Given** Codex sinh code cho UC13 và UC14, **When** implementation được tạo, **Then** Codex không nên tạo page riêng chỉ để cancel application nếu không cần.

3. **Given** UC14 được implement, **When** cancel thành công, **Then** Applied Events page cập nhật lại application status thành `CANCELLED` hoặc refresh danh sách.

---

### User Story 9 - Filter theo application status trong Applied Events (Priority: P2)

Là Volunteer, tôi muốn lọc danh sách applied events theo status để dễ theo dõi các application đang pending, approved, rejected hoặc cancelled.

**Why this priority**: Khi Volunteer có nhiều application, filter theo status giúp tìm nhanh application cần quan tâm.

**Independent Test**: Có thể test bằng cách chọn các status filter khác nhau và kiểm tra kết quả hiển thị.

**Acceptance Scenarios**:

1. **Given** Volunteer chọn status filter `PENDING`, **When** Applied Events page cập nhật, **Then** hệ thống hiển thị các application pending của Volunteer.

2. **Given** Volunteer chọn status filter `APPROVED`, **When** Applied Events page cập nhật, **Then** hệ thống hiển thị các application approved của Volunteer.

3. **Given** Volunteer chọn status filter `REJECTED` hoặc `CANCELLED`, **When** Applied Events page cập nhật, **Then** hệ thống hiển thị application tương ứng.

4. **Given** status filter không có kết quả, **When** hệ thống hiển thị danh sách, **Then** hệ thống hiển thị filter-empty state.

5. **Given** status filter thay đổi, **When** hệ thống cập nhật danh sách, **Then** pagination nên reset về page 1.

---

### User Story 10 - Loading, empty, filter-empty và error states (Priority: P2)

Là Volunteer, tôi muốn Applied Events page hiển thị rõ trạng thái đang tải, chưa có dữ liệu, không có kết quả theo filter hoặc lỗi hệ thống.

**Why this priority**: Applied Events phụ thuộc dữ liệu application và event. UI cần phản hồi rõ ràng để Volunteer không hiểu nhầm.

**Independent Test**: Có thể test bằng cách mock loading, empty, filter-empty và error states.

**Acceptance Scenarios**:

1. **Given** Applied Events đang tải dữ liệu, **When** Volunteer mở page, **Then** hệ thống hiển thị loading state.

2. **Given** Volunteer chưa apply event nào, **When** page tải xong, **Then** hệ thống hiển thị empty state.

3. **Given** Volunteer chọn status filter nhưng không có application phù hợp, **When** page cập nhật, **Then** hệ thống hiển thị filter-empty state.

4. **Given** hệ thống không tải được Applied Events, **When** lỗi xảy ra, **Then** hệ thống hiển thị error state.

5. **Given** event item thiếu thumbnail hoặc optional field, **When** page hiển thị, **Then** hệ thống không crash và hiển thị fallback phù hợp.

---

## Edge Cases

* **Guest mở Applied Events**: Hệ thống yêu cầu login/register hoặc điều hướng sang Authentication flow.

* **Staff mở Volunteer Applied Events**: Hệ thống chặn vì Staff có Application Management riêng.

* **Manager/Admin mở Volunteer Applied Events**: Hệ thống chặn vì không phải Volunteer flow.

* **Volunteer chưa apply event nào**: Hệ thống hiển thị empty state.

* **Volunteer có nhiều application**: Hệ thống hiển thị danh sách có pagination hoặc loading strategy.

* **Application `PENDING`**: Hệ thống hiển thị trạng thái pending và có thể hiển thị Cancel action.

* **Application `APPROVED`**: Hệ thống hiển thị trạng thái approved, không cho Volunteer tự cancel trong bản đầu.

* **Application `REJECTED`**: Hệ thống hiển thị rejected status và rejection reason nếu có.

* **Application `CANCELLED`**: Hệ thống hiển thị cancelled status, không hiển thị cancel tiếp.

* **Application thuộc Volunteer khác**: Backend/API không được trả về cho current Volunteer.

* **Event của application đã soft-deleted hoặc không còn public**: Hệ thống có thể hiển thị application record tối thiểu, nhưng View Detail có thể disabled hoặc unavailable.

* **Applied event thiếu thumbnail**: Hệ thống hiển thị fallback image hoặc fallback UI.

* **Review note/rejection reason không có**: UI không được crash, chỉ không hiển thị hoặc hiển thị fallback.

* **Status filter không có kết quả**: Hệ thống hiển thị filter-empty state.

* **Status filter thay đổi khi đang ở page cao**: Pagination nên reset về page 1.

* **Tải dữ liệu thất bại**: Hệ thống hiển thị error state.

* **Cancel action được bấm**: Xử lý cancel thuộc UC14, không phải UC13.

---

## Requirements

### Functional Requirements

* **FR-001**: THE system SHALL allow only authenticated users with role `VOLUNTEER` to view Applied Events.

* **FR-002**: THE system SHALL NOT allow Guest to view Applied Events.

* **FR-003**: WHEN Guest attempts to view Applied Events, THE system SHALL require login/register or navigate to Authentication flow.

* **FR-004**: THE system SHALL NOT allow Staff, Manager or Admin to access Volunteer Applied Events through UC13.

* **FR-005**: THE system SHALL display only applications that belong to the current authenticated Volunteer.

* **FR-006**: THE system SHALL NOT display applications belonging to other Volunteers.

* **FR-007**: THE system SHALL display a list of applications submitted by the current Volunteer.

* **FR-008**: Each applied event item SHALL display application status.

* **FR-009**: THE system SHALL support display of status `PENDING`.

* **FR-010**: THE system SHALL support display of status `APPROVED`.

* **FR-011**: THE system SHALL support display of status `REJECTED`.

* **FR-012**: THE system SHALL support display of status `CANCELLED`.

* **FR-013**: Each applied event item SHOULD display event title.

* **FR-014**: Each applied event item SHOULD display event organization if available.

* **FR-015**: Each applied event item SHOULD display event category if available.

* **FR-016**: Each applied event item SHOULD display event date/time.

* **FR-017**: Each applied event item SHOULD display event location.

* **FR-018**: Each applied event item SHOULD display submitted time if available.

* **FR-019**: Each applied event item SHOULD display thumbnail/image if available.

* **FR-020**: THE system SHALL display fallback image or fallback UI when event thumbnail is missing.

* **FR-021**: THE system MAY display review note or rejection reason if data is available.

* **FR-022**: THE system SHALL provide View Detail action when related event is available.

* **FR-023**: WHEN Volunteer clicks View Detail on available event, THE system SHALL navigate to UC09 — View Event Detail.

* **FR-024**: WHEN related event is not available, THE system SHOULD disable View Detail or show unavailable state.

* **FR-025**: THE system MAY display Cancel action for application with status `PENDING`.

* **FR-026**: THE system SHALL NOT display Cancel action for application with status `REJECTED` or `CANCELLED`.

* **FR-027**: THE system SHOULD NOT allow Volunteer to self-cancel `APPROVED` application in the first version.

* **FR-028**: THE system SHALL treat actual cancel processing as UC14 — Cancel Application.

* **FR-029**: THE system SHALL implement UC13 and UC14 on the same Applied Events page when possible.

* **FR-030**: THE system SHOULD NOT create a standalone page only for Cancel Application if the action can be handled inside Applied Events page.

* **FR-031**: THE system MAY provide status filter for Applied Events.

* **FR-032**: Status filter MAY include All, Pending, Approved, Rejected and Cancelled.

* **FR-033**: WHEN status filter changes, THE system SHOULD reset pagination to page 1.

* **FR-034**: THE system SHALL display loading state while Applied Events data is loading.

* **FR-035**: THE system SHALL display empty state when Volunteer has no applied events.

* **FR-036**: THE system SHALL display filter-empty state when selected status filter has no result.

* **FR-037**: THE system SHALL display error state when Applied Events data cannot be loaded.

* **FR-038**: THE system SHOULD use pagination or loading strategy when the number of applications is large.

* **FR-039**: THE system SHALL NOT create application in UC13.

* **FR-040**: THE system SHALL NOT approve application in UC13.

* **FR-041**: THE system SHALL NOT reject application in UC13.

* **FR-042**: THE system SHALL NOT perform attendance check in UC13.

* **FR-043**: THE system SHALL NOT submit feedback in UC13.

* **FR-044**: THE system SHALL NOT view, download or generate certificate in UC13.

* **FR-045**: THE system SHALL NOT rely only on frontend filtering for ownership. Backend/API must enforce authentication, role and ownership.

---

### Key Entities

* **Guest**: Unauthenticated user. Guest cannot view Applied Events.

* **Volunteer**: Authenticated user with role `VOLUNTEER`. Volunteer can view only their own Applied Events.

* **Staff**: User with role `STAFF`. Staff reviews applications in Member 3 module, not through UC13.

* **Applied Events**: List of events that the current Volunteer has applied to.

* **Application**: Record connecting a Volunteer and an Event after UC12 Apply Event.

* **Application Status**: Status of an application such as `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

* **PENDING Application**: Application waiting for Staff review. It may show Cancel action for UC14.

* **APPROVED Application**: Application approved by Staff. Volunteer cannot self-cancel in the first version.

* **REJECTED Application**: Application rejected by Staff. It may have rejection reason.

* **CANCELLED Application**: Application cancelled by Volunteer through UC14.

* **Event Summary**: Short information of the event shown inside each applied event item.

* **Review Note / Rejection Reason**: Optional note from Staff review.

* **Cancel Action**: Action displayed in Applied Events item when application is eligible for UC14.

* **Status Filter**: Filter used inside Applied Events page to view applications by status.

* **Ownership Boundary**: Rule that Volunteer can only view their own applications.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: Guest cannot view Applied Events.

* **SC-002**: Staff, Manager and Admin cannot access Volunteer Applied Events through UC13.

* **SC-003**: Authenticated Volunteer can view their own Applied Events.

* **SC-004**: Volunteer cannot see applications of other Volunteers.

* **SC-005**: Applied Events page displays application status for each item.

* **SC-006**: Applied Events page supports `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` statuses.

* **SC-007**: Applied Events item displays event summary such as title, time and location when data is available.

* **SC-008**: Applied Events item displays fallback UI when thumbnail or optional data is missing.

* **SC-009**: Volunteer can navigate to UC09 — View Event Detail from an available applied event.

* **SC-010**: Cancel action appears only for application that is eligible for UC14.

* **SC-011**: UC13 and UC14 can be implemented together on the same Applied Events page.

* **SC-012**: Applied Events page shows empty state when Volunteer has no application.

* **SC-013**: Applied Events page shows loading and error states correctly.

* **SC-014**: Backend/API enforces authentication, role and ownership, not frontend only.

---

## Assumptions

* **A-001**: Guest is not stored as a database role.

* **A-002**: Database roles are `VOLUNTEER`, `STAFF`, `MANAGER`, and `ADMIN`.

* **A-003**: UC13 is only for authenticated Volunteer.

* **A-004**: Guest must login/register before viewing Applied Events.

* **A-005**: Staff, Manager and Admin do not use UC13 as their application management screen.

* **A-006**: Staff Application Management is handled by Member 3.

* **A-007**: Volunteer can only view application records that belong to themselves.

* **A-008**: UC13 usually follows UC12 Apply Event or is opened from Volunteer navigation.

* **A-009**: Application created by UC12 starts with status `PENDING`.

* **A-010**: Application statuses in the first version include `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

* **A-011**: UC14 Cancel Application is implemented as an action inside Applied Events page when possible.

* **A-012**: Only `PENDING` application is cancelable in the first version.

* **A-013**: `APPROVED` application cannot be self-cancelled by Volunteer in the first version.

* **A-014**: Rejection reason/review note is displayed only when data exists.

* **A-015**: Status filter inside Applied Events is not the same as UC11 Event Filter.

* **A-016**: Mock data can be used temporarily before final API/data contract is ready.

* **A-017**: Mobile app support is out of scope. Feature targets web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC13 — View Applied Events và KHÔNG được implement trong use case này:

* View Event List
* Search Event
* Filter Event
* Full Event Detail display
* Apply Event submission
* Application form
* Cancel Application processing logic
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

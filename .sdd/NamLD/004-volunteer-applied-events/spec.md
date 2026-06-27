# Feature Specification: Volunteer Applied Events

**Feature Branch**: `feat/volunteer-applied-events`

**Created**: 2026-06-27

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là Volunteer của VMS, tôi muốn xem danh sách các sự kiện mà tôi đã đăng ký, theo dõi trạng thái application và hủy đơn nếu đơn vẫn đang PENDING."

---

## User Scenarios & Testing

### User Story 1 - Volunteer xem danh sách event đã apply (Priority: P1)

Là Volunteer đã đăng nhập, tôi muốn xem danh sách các event mà tôi đã đăng ký để theo dõi các application của mình.

**Why this priority**: Đây là luồng chính của feature Applied Events. Sau khi Volunteer apply event thành công ở feature `003-volunteer-event-application`, họ cần một nơi để xem lại application và trạng thái xét duyệt.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập bằng tài khoản Volunteer đã có application, mở Applied Events page và kiểm tra danh sách application được hiển thị.

**Acceptance Scenarios**:

1. **Given** người dùng là Volunteer đã đăng nhập, **When** người dùng mở Applied Events page, **Then** hệ thống hiển thị danh sách event mà Volunteer đó đã apply.

2. **Given** Volunteer có nhiều application, **When** Applied Events page được hiển thị, **Then** hệ thống hiển thị từng application kèm event summary.

3. **Given** Volunteer vừa apply event thành công ở feature Apply Event, **When** Volunteer mở Applied Events page, **Then** application mới xuất hiện trong danh sách với status `PENDING`.

4. **Given** Volunteer chưa apply event nào, **When** Volunteer mở Applied Events page, **Then** hệ thống hiển thị empty state rõ ràng.

---

### User Story 2 - Bảo vệ quyền truy cập Applied Events (Priority: P1)

Là hệ thống, tôi cần đảm bảo chỉ Volunteer đã đăng nhập mới được xem Applied Events của chính mình.

**Why this priority**: Applied Events là dữ liệu cá nhân. Guest, Staff, Manager, Admin hoặc Volunteer khác không được xem application của Volunteer hiện tại trong flow này.

**Independent Test**: Có thể test độc lập bằng cách thử mở Applied Events khi chưa login, khi login bằng role không phải Volunteer, và khi login bằng Volunteer khác.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest chưa đăng nhập, **When** người dùng mở Applied Events page, **Then** hệ thống yêu cầu đăng nhập hoặc điều hướng sang Authentication flow.

2. **Given** người dùng đã đăng nhập nhưng không có role `VOLUNTEER`, **When** người dùng mở Applied Events page, **Then** hệ thống chặn truy cập và hiển thị forbidden state hoặc message phù hợp.

3. **Given** người dùng là Volunteer đã đăng nhập, **When** người dùng mở Applied Events page, **Then** hệ thống chỉ hiển thị application của chính Volunteer đó.

4. **Given** có application của Volunteer khác, **When** Volunteer hiện tại mở Applied Events page, **Then** hệ thống không hiển thị application của Volunteer khác.

---

### User Story 3 - Xem trạng thái application của từng event (Priority: P1)

Là Volunteer, tôi muốn xem trạng thái application của từng event để biết đơn đang chờ duyệt, đã được duyệt, bị từ chối hoặc đã hủy.

**Why this priority**: Application status là thông tin quan trọng nhất trong Applied Events. Volunteer cần biết Staff đã xử lý đơn của mình như thế nào.

**Independent Test**: Có thể test độc lập bằng cách tạo application với nhiều status khác nhau và kiểm tra UI hiển thị đúng.

**Acceptance Scenarios**:

1. **Given** application có status `PENDING`, **When** Applied Events được hiển thị, **Then** hệ thống hiển thị trạng thái đang chờ duyệt.

2. **Given** application có status `APPROVED`, **When** Applied Events được hiển thị, **Then** hệ thống hiển thị trạng thái đã được duyệt.

3. **Given** application có status `REJECTED`, **When** Applied Events được hiển thị, **Then** hệ thống hiển thị trạng thái bị từ chối.

4. **Given** application có status `CANCELLED`, **When** Applied Events được hiển thị, **Then** hệ thống hiển thị trạng thái đã hủy.

5. **Given** application có review note hoặc reject reason, **When** dữ liệu này có sẵn, **Then** hệ thống có thể hiển thị ghi chú phù hợp cho Volunteer.

---

### User Story 4 - Xem event summary trong Applied Events (Priority: P1)

Là Volunteer, tôi muốn mỗi application hiển thị thông tin tóm tắt của event để biết application đó thuộc sự kiện nào.

**Why this priority**: Nếu chỉ hiển thị application status mà không có event summary, Volunteer sẽ khó theo dõi các event đã đăng ký.

**Independent Test**: Có thể test độc lập bằng cách kiểm tra từng applied event item/card có đủ thông tin tóm tắt cần thiết.

**Acceptance Scenarios**:

1. **Given** một application xuất hiện trong Applied Events, **When** applied event item được hiển thị, **Then** hệ thống hiển thị event title.

2. **Given** một application xuất hiện trong Applied Events, **When** applied event item được hiển thị, **Then** hệ thống hiển thị application status.

3. **Given** một application xuất hiện trong Applied Events, **When** applied event item được hiển thị, **Then** hệ thống hiển thị submitted time.

4. **Given** event có category, **When** applied event item được hiển thị, **Then** hệ thống hiển thị category.

5. **Given** event có organization, **When** applied event item được hiển thị, **Then** hệ thống hiển thị organization.

6. **Given** event có date/time, **When** applied event item được hiển thị, **Then** hệ thống hiển thị thời gian event.

7. **Given** event có location, **When** applied event item được hiển thị, **Then** hệ thống hiển thị địa điểm event.

8. **Given** event có image/thumbnail, **When** applied event item được hiển thị, **Then** hệ thống hiển thị image/thumbnail.

9. **Given** event không có image/thumbnail, **When** applied event item được hiển thị, **Then** hệ thống hiển thị placeholder hoặc fallback layout ổn định.

---

### User Story 5 - Volunteer xem lại Event Detail từ Applied Events (Priority: P2)

Là Volunteer, tôi muốn bấm vào một applied event để xem lại Event Detail.

**Why this priority**: Volunteer có thể cần xem lại thời gian, địa điểm, mô tả hoặc yêu cầu của event sau khi đã apply.

**Independent Test**: Có thể test độc lập bằng cách click View Detail trên một applied event item và kiểm tra điều hướng sang Event Detail.

**Acceptance Scenarios**:

1. **Given** một applied event đang hiển thị, **When** Volunteer click View Detail, **Then** hệ thống điều hướng sang Event Detail của event tương ứng.

2. **Given** Event Detail vẫn khả dụng, **When** Volunteer click View Detail, **Then** hệ thống hiển thị Event Detail bình thường.

3. **Given** Event Detail không còn khả dụng, **When** Volunteer click View Detail, **Then** hệ thống xử lý theo rule của Event Detail và hiển thị unavailable/not found nếu cần.

---

### User Story 6 - Cancel application khi status là PENDING (Priority: P1)

Là Volunteer, tôi muốn hủy application đang chờ duyệt nếu tôi không còn muốn tham gia event nữa.

**Why this priority**: Docs mới chốt Volunteer chỉ được hủy đơn khi đơn đang `PENDING`. Đây là business rule chính của UC14.

**Independent Test**: Có thể test độc lập bằng cách cancel application `PENDING` và kiểm tra status chuyển thành `CANCELLED`.

**Acceptance Scenarios**:

1. **Given** application có status `PENDING`, **When** Volunteer xem Applied Events, **Then** hệ thống hiển thị Cancel action cho application đó.

2. **Given** Volunteer click Cancel trên application `PENDING`, **When** hệ thống xử lý, **Then** hệ thống yêu cầu xác nhận trước khi hủy.

3. **Given** Volunteer xác nhận cancel application `PENDING`, **When** cancel thành công, **Then** application status chuyển thành `CANCELLED`.

4. **Given** cancel application thành công, **When** Applied Events được cập nhật, **Then** application không còn hiển thị Cancel action.

5. **Given** cancel application thất bại, **When** hệ thống nhận lỗi, **Then** hệ thống hiển thị error message rõ ràng và giữ trạng thái hiện tại.

---

### User Story 7 - Chặn cancel application không phải PENDING (Priority: P1)

Là hệ thống, tôi cần chặn Volunteer tự hủy application đã được duyệt, bị từ chối hoặc đã hủy.

**Why this priority**: Business rule mới chốt đơn `APPROVED` không thể tự hủy, Volunteer phải liên hệ Staff. `REJECTED` và `CANCELLED` cũng không cần cancel nữa.

**Independent Test**: Có thể test độc lập bằng cách thử cancel application `APPROVED`, `REJECTED`, `CANCELLED`.

**Acceptance Scenarios**:

1. **Given** application có status `APPROVED`, **When** Volunteer xem Applied Events, **Then** hệ thống không hiển thị Cancel action hoặc disable action.

2. **Given** application có status `APPROVED`, **When** Volunteer muốn hủy, **Then** hệ thống hiển thị thông báo cần liên hệ Staff nếu cần.

3. **Given** application có status `REJECTED`, **When** Volunteer xem Applied Events, **Then** hệ thống không cho cancel.

4. **Given** application có status `CANCELLED`, **When** Volunteer xem Applied Events, **Then** hệ thống không cho cancel lại.

5. **Given** Volunteer cố gọi cancel trái phép cho application không phải `PENDING`, **When** request được xử lý, **Then** hệ thống không thay đổi status application.

---

### User Story 8 - Filter và pagination cho Applied Events (Priority: P2)

Là Volunteer, tôi muốn lọc Applied Events theo trạng thái application và xem theo từng trang để dễ quản lý.

**Why this priority**: Khi Volunteer apply nhiều event, filter và pagination giúp việc theo dõi application dễ hơn.

**Independent Test**: Có thể test độc lập bằng cách tạo nhiều application với nhiều status khác nhau, sau đó filter và chuyển trang.

**Acceptance Scenarios**:

1. **Given** Applied Events có nhiều application, **When** Volunteer chọn filter `ALL`, **Then** hệ thống hiển thị tất cả application của Volunteer đó.

2. **Given** Applied Events có application `PENDING`, **When** Volunteer chọn filter `PENDING`, **Then** hệ thống chỉ hiển thị application đang chờ duyệt.

3. **Given** Applied Events có application `APPROVED`, **When** Volunteer chọn filter `APPROVED`, **Then** hệ thống chỉ hiển thị application đã được duyệt.

4. **Given** Applied Events có application `REJECTED`, **When** Volunteer chọn filter `REJECTED`, **Then** hệ thống chỉ hiển thị application bị từ chối.

5. **Given** Applied Events có application `CANCELLED`, **When** Volunteer chọn filter `CANCELLED`, **Then** hệ thống chỉ hiển thị application đã hủy.

6. **Given** số lượng applied events lớn hơn page size, **When** Applied Events page được hiển thị, **Then** hệ thống phân trang danh sách hoặc dùng loading strategy phù hợp.

7. **Given** Volunteer đổi filter, **When** danh sách được cập nhật, **Then** pagination reset về page đầu tiên.

---

### User Story 9 - Loading, empty, error và cancel states (Priority: P2)

Là Volunteer, tôi muốn hệ thống hiển thị rõ trạng thái đang tải, không có dữ liệu, lỗi hoặc đang hủy đơn để không bị nhầm rằng trang bị hỏng.

**Why this priority**: Đây là UX quan trọng cho trang dữ liệu cá nhân và action cancel.

**Independent Test**: Có thể test độc lập bằng cách mô phỏng loading, empty, error và cancel states.

**Acceptance Scenarios**:

1. **Given** Applied Events đang tải dữ liệu, **When** Volunteer mở page, **Then** hệ thống hiển thị loading state.

2. **Given** Volunteer chưa có application nào, **When** Applied Events page được hiển thị, **Then** hệ thống hiển thị empty state.

3. **Given** không có application nào phù hợp với filter hiện tại, **When** danh sách được cập nhật, **Then** hệ thống hiển thị filter empty state.

4. **Given** dữ liệu Applied Events không tải được, **When** hệ thống gặp lỗi, **Then** hệ thống hiển thị error state dễ hiểu và không làm crash trang.

5. **Given** cancel request đang xử lý, **When** Volunteer xác nhận cancel, **Then** hệ thống hiển thị cancelling/submitting state và tránh gửi nhiều request cancel trùng lặp.

---

## Edge Cases

* **Guest mở Applied Events**: WHEN Guest mở Applied Events page, THE system SHALL yêu cầu đăng nhập hoặc điều hướng sang Authentication flow.

* **User không phải Volunteer mở Applied Events**: WHEN authenticated user không có role `VOLUNTEER` mở Applied Events, THE system SHALL chặn truy cập.

* **Volunteer không có application nào**: WHEN Volunteer chưa apply event nào, THE system SHALL hiển thị empty state.

* **Volunteer chỉ thấy application của mình**: WHERE có application của Volunteer khác, THE system SHALL không hiển thị cho Volunteer hiện tại.

* **Application PENDING**: WHERE application status là `PENDING`, THE system SHALL hiển thị trạng thái đang chờ duyệt và cho phép cancel.

* **Application APPROVED**: WHERE application status là `APPROVED`, THE system SHALL hiển thị trạng thái đã duyệt và không cho Volunteer tự cancel.

* **Application REJECTED**: WHERE application status là `REJECTED`, THE system SHALL hiển thị trạng thái bị từ chối và không cho cancel.

* **Application CANCELLED**: WHERE application status là `CANCELLED`, THE system SHALL hiển thị trạng thái đã hủy và không cho cancel lại.

* **Cancel PENDING application**: WHEN Volunteer xác nhận cancel application `PENDING`, THE system SHALL chuyển status sang `CANCELLED` nếu xử lý thành công.

* **Cancel APPROVED application**: WHEN Volunteer muốn cancel application `APPROVED`, THE system SHALL không cho cancel và có thể hiển thị message liên hệ Staff.

* **Cancel REJECTED/CANCELLED application**: WHEN Volunteer muốn cancel application `REJECTED` hoặc `CANCELLED`, THE system SHALL không cho cancel.

* **Repeated cancel click**: WHEN cancel request đang xử lý, THE system SHALL tránh gửi nhiều request cancel trùng lặp.

* **Event bị unavailable sau khi apply**: WHERE event không còn public hoặc không còn khả dụng sau khi Volunteer apply, THE system SHALL vẫn giữ application record nếu dữ liệu còn tồn tại và hiển thị trạng thái phù hợp.

* **Event image missing**: WHERE event image/thumbnail missing, THE system SHALL hiển thị placeholder hoặc fallback layout.

* **Filter không có kết quả**: WHEN Volunteer chọn filter status nhưng không có application phù hợp, THE system SHALL hiển thị filter empty state.

* **Pagination sau khi đổi filter**: WHEN Volunteer đổi application status filter, THE system SHALL reset pagination về page đầu tiên.

* **Data loading failed**: WHEN Applied Events data không tải được, THE system SHALL hiển thị error state.

---

## Requirements

### Functional Requirements

* **FR-001**: THE system SHALL allow only authenticated users with role `VOLUNTEER` to view Applied Events.

* **FR-002**: WHEN Guest attempts to open Applied Events, THE system SHALL require login/register or redirect to Authentication flow.

* **FR-003**: WHEN authenticated user is not `VOLUNTEER`, THE system SHALL block access to Applied Events.

* **FR-004**: THE system SHALL show only applications that belong to the current authenticated Volunteer.

* **FR-005**: THE system SHALL NOT show applications of other Volunteers.

* **FR-006**: Applied Events SHALL display applications created from Apply Event feature.

* **FR-007**: EACH applied event item SHALL display event summary and application status.

* **FR-008**: Event summary SHALL include event title.

* **FR-009**: Event summary SHALL include application status.

* **FR-010**: Event summary SHALL include submitted time.

* **FR-011**: Event summary SHOULD include category if available.

* **FR-012**: Event summary SHOULD include organization if available.

* **FR-013**: Event summary SHALL include event date/time.

* **FR-014**: Event summary SHALL include location.

* **FR-015**: Event summary SHOULD include event image/thumbnail if available.

* **FR-016**: IF event image/thumbnail is missing, THE system SHALL display placeholder or fallback layout.

* **FR-017**: THE system SHALL support application status `PENDING`.

* **FR-018**: THE system SHALL support application status `APPROVED`.

* **FR-019**: THE system SHALL support application status `REJECTED`.

* **FR-020**: THE system SHALL support application status `CANCELLED`.

* **FR-021**: THE system SHALL display status label/message for each supported application status.

* **FR-022**: THE system SHALL allow Volunteer to navigate from an applied event item to Event Detail.

* **FR-023**: THE system SHALL allow Volunteer to cancel application only when application status is `PENDING`.

* **FR-024**: WHEN Volunteer cancels a `PENDING` application, THE system SHALL ask for confirmation before cancelling.

* **FR-025**: WHEN cancel action succeeds, THE system SHALL update application status to `CANCELLED`.

* **FR-026**: THE system SHALL NOT allow Volunteer to cancel application with status `APPROVED`.

* **FR-027**: WHEN application status is `APPROVED`, THE system MAY show a message telling Volunteer to contact Staff if they need to cancel.

* **FR-028**: THE system SHALL NOT allow Volunteer to cancel application with status `REJECTED`.

* **FR-029**: THE system SHALL NOT allow Volunteer to cancel application with status `CANCELLED`.

* **FR-030**: THE system SHALL prevent repeated cancel requests while cancel action is processing.

* **FR-031**: THE system SHOULD support filter by application status: `ALL`, `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

* **FR-032**: THE system SHOULD support pagination or scalable loading strategy when applied events count is large.

* **FR-033**: WHEN application status filter changes, THE system SHALL reset pagination to first page.

* **FR-034**: WHEN Applied Events data is loading, THE system SHALL display loading state.

* **FR-035**: WHEN Volunteer has no applied events, THE system SHALL display empty state.

* **FR-036**: WHEN no applied events match current filter, THE system SHALL display filter empty state.

* **FR-037**: WHEN Applied Events data cannot be loaded, THE system SHALL display understandable error state.

* **FR-038**: WHEN cancel action fails, THE system SHALL display understandable error message and keep current application state.

* **FR-039**: THE system SHALL NOT create new application in this feature.

* **FR-040**: THE system SHALL NOT approve application in this feature.

* **FR-041**: THE system SHALL NOT reject application in this feature.

* **FR-042**: THE system SHALL NOT manage attendance in this feature.

* **FR-043**: THE system SHALL NOT submit feedback in this feature.

* **FR-044**: THE system SHALL NOT generate, view or download certificates in this feature.

* **FR-045**: THE system SHALL NOT rely only on frontend visibility for protected actions. Backend/API must enforce authentication, role, ownership and cancel rules.

* **FR-046**: THE system SHALL treat application status, review result and cancel rule as shared data owned by related modules until final API/data contracts are approved.

---

### Key Entities

* **Guest**: Unauthenticated user. Guest is not stored as a database role and cannot view Applied Events.

* **Volunteer**: Authenticated user with role `VOLUNTEER` who can view their own applied events.

* **Event**: Volunteer event associated with an application.

* **Event Application**: Record representing Volunteer’s application to an event.

* **Applied Event**: UI representation of an event that Volunteer has applied to.

* **Application Status**: Status of the application, including `PENDING`, `APPROVED`, `REJECTED`, and `CANCELLED`.

* **PENDING Application**: Application waiting for Staff review. This is the only status Volunteer can cancel.

* **APPROVED Application**: Application approved by Staff. Volunteer cannot cancel it directly.

* **REJECTED Application**: Application rejected by Staff. Volunteer cannot cancel it.

* **CANCELLED Application**: Application already cancelled. Volunteer cannot cancel it again.

* **Cancel Application**: Action that changes a `PENDING` application to `CANCELLED`.

* **Application Ownership**: Rule that a Volunteer can only view and act on their own applications.

* **Submitted Time**: Time when Volunteer submitted the application.

* **Application Status Filter**: Filter used to view applications by status.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: 100% Guest users are blocked from viewing Applied Events and are asked to login/register.

* **SC-002**: 100% authenticated non-Volunteer users are blocked from viewing Applied Events.

* **SC-003**: 100% Volunteer users can view only their own applications.

* **SC-004**: 0 applications from other Volunteers are displayed in the current Volunteer’s Applied Events page.

* **SC-005**: Applications with status `PENDING`, `APPROVED`, `REJECTED`, and `CANCELLED` display correct status labels/messages.

* **SC-006**: Each applied event item displays event title, application status, submitted time, event date/time, and location.

* **SC-007**: `PENDING` application can be cancelled only after confirmation.

* **SC-008**: Successful cancel changes application status to `CANCELLED`.

* **SC-009**: `APPROVED` application cannot be cancelled directly by Volunteer.

* **SC-010**: `REJECTED` and `CANCELLED` applications cannot be cancelled.

* **SC-011**: Cancel action does not send repeated requests while processing.

* **SC-012**: Volunteer with no applied events sees empty state instead of blank page.

* **SC-013**: Volunteer can filter applications by status if filter is available.

* **SC-014**: Volunteer can navigate from Applied Events to Event Detail.

* **SC-015**: Applied Events feature does not create, approve, reject, manage attendance, submit feedback or manage certificates.

* **SC-016**: Loading, empty, filter empty, error and cancel states are displayed clearly.

---

## Assumptions

* **A-001**: Guest is not stored as a database role.

* **A-002**: Database roles are `VOLUNTEER`, `STAFF`, `MANAGER`, and `ADMIN`.

* **A-003**: Applied Events belongs to Member 2 — Volunteer Event Module.

* **A-004**: Applied Events corresponds to UC13 — View Applied Events.

* **A-005**: Cancel Application corresponds to UC14 — Cancel Application.

* **A-006**: Applied Events requires authenticated Volunteer.

* **A-007**: Guest cannot view Applied Events.

* **A-008**: Authenticated non-Volunteer user cannot view Applied Events in this Volunteer flow.

* **A-009**: Volunteer can view only their own applications.

* **A-010**: Application is created from `003-volunteer-event-application`.

* **A-011**: New application starts as `PENDING`.

* **A-012**: Staff can approve or reject applications in Staff Module.

* **A-013**: Application statuses in the first version include `PENDING`, `APPROVED`, `REJECTED`, and `CANCELLED`.

* **A-014**: Volunteer can cancel only `PENDING` application.

* **A-015**: Volunteer cannot directly cancel `APPROVED` application and should contact Staff if needed.

* **A-016**: Volunteer cannot cancel `REJECTED` application.

* **A-017**: Volunteer cannot cancel `CANCELLED` application again.

* **A-018**: Cancel action changes application status to `CANCELLED`.

* **A-019**: Only Volunteer with `APPROVED` application can check in, but check-in is handled in Attendance Management.

* **A-020**: Feedback can be submitted only after successful attendance, but feedback is handled in another feature.

* **A-021**: Certificates are generated for attended Volunteers, but certificate viewing/downloading is handled in another feature.

* **A-022**: Applied Events can support filter by application status.

* **A-023**: Applied Events can support pagination or scalable loading if the list is long.

* **A-024**: Backend/API must be the final authority for ownership and cancel rule.

* **A-025**: Mock data can be used temporarily if API/data are not ready.

* **A-026**: Mobile app support is out of scope. Feature targets web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của Volunteer Applied Events và KHÔNG được implement trong feature này:

* Event List
* Search Event
* Filter Event
* Event Detail full display
* Apply Event submission
* Application form
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

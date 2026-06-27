# Feature Specification: Volunteer History

**Feature Branch**: `feat/volunteer-history`

**Created**: 2026-06-27

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là Volunteer của VMS, tôi muốn xem lại lịch sử các sự kiện tình nguyện mà tôi đã tham gia hoặc hoàn thành để theo dõi đóng góp, trạng thái điểm danh, số giờ tình nguyện, feedback và certificate nếu có."

---

## User Scenarios & Testing

### User Story 1 - Volunteer xem lịch sử sự kiện đã tham gia (Priority: P1)

Là Volunteer đã đăng nhập, tôi muốn xem danh sách các event mà tôi đã thực sự tham gia hoặc đã hoàn thành để theo dõi lịch sử hoạt động tình nguyện của mình.

**Why this priority**: Volunteer History là dữ liệu cá nhân quan trọng, giúp Volunteer biết mình đã tham gia những event nào, trạng thái tham gia ra sao và đóng góp được bao nhiêu giờ.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập bằng tài khoản Volunteer có history record và mở Volunteer History page.

**Acceptance Scenarios**:

1. **Given** người dùng là Volunteer đã đăng nhập, **When** người dùng mở Volunteer History page, **Then** hệ thống hiển thị danh sách event mà Volunteer đã tham gia hoặc đã hoàn thành.

2. **Given** Volunteer có history record, **When** Volunteer History page được hiển thị, **Then** hệ thống hiển thị từng history item kèm thông tin tóm tắt của event.

3. **Given** Volunteer chưa có history record nào, **When** Volunteer mở Volunteer History page, **Then** hệ thống hiển thị empty state rõ ràng.

4. **Given** Volunteer đã điểm danh thành công ở một event, **When** dữ liệu history được tải, **Then** event đó xuất hiện trong Volunteer History.

---

### User Story 2 - Bảo vệ quyền truy cập Volunteer History (Priority: P1)

Là hệ thống, tôi cần đảm bảo chỉ Volunteer đã đăng nhập mới được xem Volunteer History của chính mình.

**Why this priority**: Volunteer History là dữ liệu cá nhân. Guest, user không phải Volunteer, hoặc Volunteer khác không được xem lịch sử của người khác.

**Independent Test**: Có thể test độc lập bằng cách mở Volunteer History khi chưa login, khi login bằng role không phải Volunteer, và khi login bằng Volunteer khác.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest chưa đăng nhập, **When** người dùng mở Volunteer History page, **Then** hệ thống yêu cầu đăng nhập hoặc điều hướng sang Authentication flow.

2. **Given** người dùng đã đăng nhập nhưng không có role `VOLUNTEER`, **When** người dùng mở Volunteer History page, **Then** hệ thống chặn truy cập và hiển thị forbidden state hoặc message phù hợp.

3. **Given** người dùng là Volunteer đã đăng nhập, **When** người dùng mở Volunteer History page, **Then** hệ thống chỉ hiển thị history của chính Volunteer đó.

4. **Given** có history record của Volunteer khác, **When** Volunteer hiện tại mở Volunteer History page, **Then** hệ thống không hiển thị history record của Volunteer khác.

---

### User Story 3 - Phân biệt Volunteer History với Applied Events (Priority: P1)

Là Volunteer, tôi muốn hệ thống phân biệt rõ event tôi đã đăng ký với event tôi đã thực sự tham gia để không bị nhầm giữa Applied Events và Volunteer History.

**Why this priority**: Applied Events chỉ là danh sách đơn đăng ký. Volunteer History phải phản ánh lịch sử tham gia thực tế, thường liên quan đến approved application, attendance hoặc completion record.

**Independent Test**: Có thể test độc lập bằng cách tạo các application có status khác nhau và kiểm tra item nào xuất hiện trong Volunteer History.

**Acceptance Scenarios**:

1. **Given** application có status `PENDING`, **When** Volunteer mở Volunteer History, **Then** application đó không xuất hiện trong history.

2. **Given** application có status `REJECTED`, **When** Volunteer mở Volunteer History, **Then** application đó không xuất hiện trong history.

3. **Given** application có status `CANCELLED`, **When** Volunteer mở Volunteer History, **Then** application đó không xuất hiện trong history.

4. **Given** application có status `APPROVED` nhưng event chưa diễn ra và chưa có attendance/participation record, **When** Volunteer mở Volunteer History, **Then** event đó không xuất hiện trong history.

5. **Given** Volunteer đã có attendance hoặc participation record cho event, **When** Volunteer mở Volunteer History, **Then** event đó xuất hiện trong history.

---

### User Story 4 - Xem thông tin tóm tắt của event trong history (Priority: P1)

Là Volunteer, tôi muốn mỗi history item hiển thị thông tin tóm tắt của event để biết mình đã tham gia event nào.

**Why this priority**: Nếu history chỉ hiển thị trạng thái mà không có thông tin event, Volunteer sẽ khó theo dõi đóng góp của mình.

**Independent Test**: Có thể test độc lập bằng cách mở Volunteer History và kiểm tra từng history item có đủ thông tin chính.

**Acceptance Scenarios**:

1. **Given** một history item được hiển thị, **When** Volunteer xem item đó, **Then** hệ thống hiển thị event title.

2. **Given** event có category, **When** history item được hiển thị, **Then** hệ thống hiển thị category.

3. **Given** event có organization, **When** history item được hiển thị, **Then** hệ thống hiển thị organization.

4. **Given** event có date/time, **When** history item được hiển thị, **Then** hệ thống hiển thị thời gian event.

5. **Given** event có location, **When** history item được hiển thị, **Then** hệ thống hiển thị địa điểm event.

6. **Given** event có image/thumbnail, **When** history item được hiển thị, **Then** hệ thống hiển thị image/thumbnail.

7. **Given** event không có image/thumbnail, **When** history item được hiển thị, **Then** hệ thống hiển thị placeholder hoặc fallback layout ổn định.

---

### User Story 5 - Xem trạng thái tham gia/điểm danh (Priority: P1)

Là Volunteer, tôi muốn xem trạng thái tham gia hoặc điểm danh của từng event trong lịch sử để biết mình đã được ghi nhận như thế nào.

**Why this priority**: Attendance là cơ sở quan trọng cho feedback, certificate và volunteer hours. Volunteer History cần hiển thị trạng thái này nếu dữ liệu có sẵn.

**Independent Test**: Có thể test độc lập bằng cách tạo history record với nhiều trạng thái attendance/participation khác nhau và kiểm tra UI hiển thị đúng.

**Acceptance Scenarios**:

1. **Given** Volunteer đã điểm danh thành công, **When** history item được hiển thị, **Then** hệ thống hiển thị trạng thái đã tham gia hoặc đã điểm danh.

2. **Given** Volunteer đã hoàn thành event, **When** history item được hiển thị, **Then** hệ thống hiển thị trạng thái completed nếu dữ liệu có sẵn.

3. **Given** Volunteer bị ghi nhận vắng mặt, **When** team chọn hiển thị absent record, **Then** hệ thống hiển thị trạng thái absent phù hợp.

4. **Given** attendance status chưa được ghi nhận rõ, **When** history item được hiển thị, **Then** hệ thống hiển thị trạng thái phù hợp như not recorded hoặc không hiển thị item tùy theo rule cuối cùng.

---

### User Story 6 - Xem số giờ tình nguyện (Priority: P2)

Là Volunteer, tôi muốn xem số giờ tình nguyện nhận được từ các event đã tham gia để theo dõi đóng góp của mình.

**Why this priority**: Volunteer hours là dữ liệu hữu ích để Volunteer tự theo dõi thành tích và có thể được dùng trong report/certificate.

**Independent Test**: Có thể test độc lập bằng cách tạo history record có volunteer hours và kiểm tra UI hiển thị đúng.

**Acceptance Scenarios**:

1. **Given** history item có volunteer hours, **When** Volunteer xem item đó, **Then** hệ thống hiển thị số giờ tình nguyện.

2. **Given** history item không có volunteer hours, **When** Volunteer xem item đó, **Then** hệ thống giữ layout ổn định và hiển thị message phù hợp hoặc bỏ qua field.

3. **Given** Volunteer có nhiều history records có volunteer hours, **When** summary được hỗ trợ, **Then** hệ thống có thể hiển thị tổng số giờ tình nguyện.

---

### User Story 7 - Xem feedback status từ Volunteer History (Priority: P2)

Là Volunteer, tôi muốn biết event nào đã gửi feedback hoặc chưa gửi feedback để tiếp tục gửi feedback nếu đủ điều kiện.

**Why this priority**: Theo business rule mới, Volunteer chỉ được gửi feedback sau khi điểm danh thành công và mỗi Volunteer chỉ gửi một feedback cho mỗi event. Volunteer History là nơi phù hợp để nhắc user về feedback sau khi tham gia.

**Independent Test**: Có thể test độc lập bằng cách tạo history record đã feedback/chưa feedback và kiểm tra trạng thái hiển thị.

**Acceptance Scenarios**:

1. **Given** Volunteer đã điểm danh thành công và chưa gửi feedback, **When** history item được hiển thị, **Then** hệ thống có thể hiển thị trạng thái chưa gửi feedback hoặc entry point sang Feedback Form.

2. **Given** Volunteer đã gửi feedback cho event, **When** history item được hiển thị, **Then** hệ thống hiển thị trạng thái đã feedback nếu dữ liệu có sẵn.

3. **Given** Volunteer chưa đủ điều kiện feedback, **When** history item được hiển thị, **Then** hệ thống không hiển thị action gửi feedback.

4. **Given** Volunteer click feedback entry point, **When** Feedback Form feature đã sẵn sàng, **Then** hệ thống điều hướng sang feature `006-volunteer-feedback-form`.

---

### User Story 8 - Xem certificate status từ Volunteer History (Priority: P2)

Là Volunteer, tôi muốn biết event nào đã có certificate để có thể xem hoặc tải certificate ở feature Certificate.

**Why this priority**: Theo business rule mới, Staff chỉ tạo certificate cho Volunteer đã điểm danh và mỗi Volunteer chỉ có một certificate cho mỗi event. Volunteer History có thể hiển thị trạng thái certificate để dẫn sang Certificate feature.

**Independent Test**: Có thể test độc lập bằng cách tạo history record có certificate/chưa có certificate và kiểm tra UI hiển thị đúng.

**Acceptance Scenarios**:

1. **Given** event đã có certificate cho Volunteer, **When** history item được hiển thị, **Then** hệ thống có thể hiển thị trạng thái certificate available.

2. **Given** event chưa có certificate, **When** history item được hiển thị, **Then** hệ thống có thể hiển thị trạng thái chưa có certificate hoặc không hiển thị certificate action.

3. **Given** Volunteer click certificate entry point, **When** Certificate feature đã sẵn sàng, **Then** hệ thống điều hướng sang feature `007-volunteer-certificates`.

4. **Given** Volunteer chưa điểm danh thành công, **When** history item được hiển thị, **Then** hệ thống không hiển thị trạng thái certificate available.

---

### User Story 9 - Xem lại Event Detail từ Volunteer History (Priority: P2)

Là Volunteer, tôi muốn xem lại thông tin chi tiết của một event trong history để nhớ lại mô tả, thời gian, địa điểm hoặc tổ chức.

**Why this priority**: Sau khi tham gia, Volunteer vẫn có thể cần xem lại thông tin event.

**Independent Test**: Có thể test độc lập bằng cách click View Detail trên history item.

**Acceptance Scenarios**:

1. **Given** history item đang hiển thị, **When** Volunteer click View Detail, **Then** hệ thống điều hướng sang Event Detail của event tương ứng nếu route khả dụng.

2. **Given** Event Detail vẫn public/khả dụng, **When** Volunteer click View Detail, **Then** hệ thống hiển thị Event Detail bình thường.

3. **Given** Event Detail không còn public hoặc event đã archived/soft-deleted, **When** Volunteer click View Detail, **Then** hệ thống xử lý theo rule của Event Detail hoặc hiển thị unavailable state.

4. **Given** event đã archived/soft-deleted sau khi Volunteer tham gia, **When** Volunteer mở Volunteer History, **Then** history record vẫn có thể hiển thị nếu dữ liệu lịch sử còn tồn tại.

---

### User Story 10 - Filter và pagination Volunteer History (Priority: P2)

Là Volunteer, tôi muốn lọc Volunteer History theo thời gian hoặc trạng thái tham gia và xem theo từng trang nếu danh sách dài.

**Why this priority**: Khi Volunteer tham gia nhiều event, filter và pagination giúp dễ theo dõi hơn.

**Independent Test**: Có thể test độc lập bằng cách tạo nhiều history records và kiểm tra filter/pagination.

**Acceptance Scenarios**:

1. **Given** Volunteer có nhiều history records, **When** Volunteer chọn time filter, **Then** hệ thống hiển thị history records phù hợp với khoảng thời gian.

2. **Given** Volunteer có nhiều participation statuses khác nhau, **When** Volunteer chọn status filter, **Then** hệ thống hiển thị records phù hợp với status đó.

3. **Given** số lượng history records lớn hơn page size, **When** Volunteer History được hiển thị, **Then** hệ thống phân trang hoặc dùng loading strategy phù hợp.

4. **Given** Volunteer đổi filter, **When** danh sách được cập nhật, **Then** pagination reset về page đầu tiên.

---

### User Story 11 - Loading, empty và error states (Priority: P2)

Là Volunteer, tôi muốn hệ thống hiển thị rõ trạng thái đang tải, không có dữ liệu hoặc lỗi để không bị nhầm rằng trang bị hỏng.

**Why this priority**: Volunteer History là trang dữ liệu cá nhân, cần UX rõ ràng khi chưa có lịch sử hoặc khi lỗi tải dữ liệu.

**Independent Test**: Có thể test độc lập bằng cách mô phỏng loading, empty, filter empty và error states.

**Acceptance Scenarios**:

1. **Given** Volunteer History đang tải dữ liệu, **When** Volunteer mở page, **Then** hệ thống hiển thị loading state.

2. **Given** Volunteer chưa có history record nào, **When** Volunteer History được hiển thị, **Then** hệ thống hiển thị empty state.

3. **Given** không có history record nào phù hợp với filter hiện tại, **When** danh sách được cập nhật, **Then** hệ thống hiển thị filter empty state.

4. **Given** dữ liệu Volunteer History không tải được, **When** hệ thống gặp lỗi, **Then** hệ thống hiển thị error state dễ hiểu và không làm crash trang.

---

## Edge Cases

* **Guest mở Volunteer History**: WHEN Guest mở Volunteer History page, THE system SHALL yêu cầu đăng nhập hoặc điều hướng sang Authentication flow.

* **User không phải Volunteer mở Volunteer History**: WHEN authenticated user không có role `VOLUNTEER` mở Volunteer History, THE system SHALL chặn truy cập.

* **Volunteer xem history của người khác**: WHERE có history record của Volunteer khác, THE system SHALL không hiển thị cho Volunteer hiện tại.

* **Volunteer chưa có history**: WHEN Volunteer chưa từng tham gia event nào, THE system SHALL hiển thị empty state.

* **Application PENDING**: WHERE application chỉ đang `PENDING`, THE system SHALL not show it as Volunteer History.

* **Application REJECTED**: WHERE application bị `REJECTED`, THE system SHALL not show it as Volunteer History.

* **Application CANCELLED**: WHERE application bị `CANCELLED`, THE system SHALL not show it as Volunteer History.

* **Application APPROVED nhưng event chưa diễn ra**: WHERE application đã `APPROVED` nhưng event chưa diễn ra/chưa có attendance, THE system SHALL not show it as completed Volunteer History.

* **Volunteer đã điểm danh thành công**: WHERE Volunteer có successful attendance, THE system SHALL show the event in Volunteer History.

* **Volunteer hoàn thành event**: WHERE Volunteer có completion/participation record, THE system SHALL show the event in Volunteer History.

* **Volunteer vắng mặt**: WHERE Volunteer có absent record, THE system MAY show absent status if team chooses to include absence records.

* **Attendance chưa ghi nhận**: WHERE attendance data is unclear, THE system SHALL show stable state and avoid treating it as successful participation.

* **Event bị archived/soft-deleted sau khi tham gia**: WHERE event is archived or soft-deleted after participation, THE system MAY still show history record if historical data exists.

* **Event image missing**: WHERE event image/thumbnail missing, THE system SHALL show placeholder or fallback layout.

* **Volunteer hours missing**: WHERE volunteer hours data missing, THE system SHALL keep layout stable and show fallback or omit the field.

* **Feedback already submitted**: WHERE feedback exists, THE system MAY show feedback submitted status.

* **Feedback not yet submitted but eligible**: WHERE Volunteer attended successfully and no feedback exists, THE system MAY show feedback entry point.

* **Certificate available**: WHERE certificate exists, THE system MAY show certificate available status or entry point.

* **Certificate not available**: WHERE no certificate exists, THE system SHALL avoid showing download action.

* **Filter không có kết quả**: WHEN selected filter returns no history records, THE system SHALL show filter empty state.

* **Pagination sau khi đổi filter**: WHEN Volunteer changes filter, THE system SHALL reset pagination to first page.

* **Data loading failed**: WHEN Volunteer History data cannot be loaded, THE system SHALL show error state.

---

## Requirements

### Functional Requirements

* **FR-001**: THE system SHALL allow only authenticated users with role `VOLUNTEER` to view Volunteer History.

* **FR-002**: WHEN Guest attempts to open Volunteer History, THE system SHALL require login/register or redirect to Authentication flow.

* **FR-003**: WHEN authenticated user is not `VOLUNTEER`, THE system SHALL block access to Volunteer History.

* **FR-004**: THE system SHALL show only history records that belong to the current authenticated Volunteer.

* **FR-005**: THE system SHALL NOT show history records of other Volunteers.

* **FR-006**: Volunteer History SHALL be separated from Applied Events.

* **FR-007**: THE system SHALL NOT treat `PENDING` application as Volunteer History.

* **FR-008**: THE system SHALL NOT treat `REJECTED` application as Volunteer History.

* **FR-009**: THE system SHALL NOT treat `CANCELLED` application as Volunteer History.

* **FR-010**: THE system SHALL NOT automatically treat future `APPROVED` application as Volunteer History.

* **FR-011**: THE system SHOULD show event in Volunteer History when Volunteer has successful attendance record.

* **FR-012**: THE system SHOULD show event in Volunteer History when Volunteer has completion/participation record.

* **FR-013**: THE system MAY show absent record if attendance data includes absence and team chooses to display it.

* **FR-014**: EACH history item SHALL display event summary.

* **FR-015**: Event summary SHALL include event title.

* **FR-016**: Event summary SHOULD include category if available.

* **FR-017**: Event summary SHOULD include organization if available.

* **FR-018**: Event summary SHALL include event date/time.

* **FR-019**: Event summary SHALL include location.

* **FR-020**: Event summary SHOULD include event image/thumbnail if available.

* **FR-021**: IF event image/thumbnail is missing, THE system SHALL display placeholder or fallback layout.

* **FR-022**: History item SHOULD display participation/attendance status if available.

* **FR-023**: History item SHOULD display volunteer hours if available.

* **FR-024**: History item MAY display feedback status if data is available.

* **FR-025**: History item MAY display certificate status if data is available.

* **FR-026**: THE system MAY provide View Detail action from history item to Event Detail.

* **FR-027**: IF Event Detail is unavailable, THE system SHALL handle unavailable/not found state without crashing.

* **FR-028**: THE system MAY provide entry point to Feedback Form when Volunteer is eligible.

* **FR-029**: THE system MAY provide entry point to Certificate feature when certificate is available.

* **FR-030**: THE system SHOULD support filter by time range.

* **FR-031**: THE system SHOULD support filter by participation/attendance status if statuses are available.

* **FR-032**: THE system SHOULD support pagination or scalable loading strategy when history count is large.

* **FR-033**: WHEN filter changes, THE system SHALL reset pagination to first page.

* **FR-034**: WHEN Volunteer History data is loading, THE system SHALL display loading state.

* **FR-035**: WHEN Volunteer has no history records, THE system SHALL display empty state.

* **FR-036**: WHEN no history records match current filter, THE system SHALL display filter empty state.

* **FR-037**: WHEN Volunteer History data cannot be loaded, THE system SHALL display understandable error state.

* **FR-038**: THE system SHALL NOT create application in this feature.

* **FR-039**: THE system SHALL NOT cancel application in this feature.

* **FR-040**: THE system SHALL NOT approve or reject application in this feature.

* **FR-041**: THE system SHALL NOT perform attendance check-in in this feature.

* **FR-042**: THE system SHALL NOT manage attendance list in this feature.

* **FR-043**: THE system SHALL NOT submit feedback in this feature.

* **FR-044**: THE system SHALL NOT generate, view or download certificate directly in this feature.

* **FR-045**: THE system SHALL NOT rely only on frontend visibility for protected data. Backend/API must enforce authentication, role and ownership.

* **FR-046**: THE system SHALL treat attendance, participation status, volunteer hours, feedback status and certificate status as shared data owned by related modules until final API/data contracts are approved.

---

### Key Entities

* **Guest**: Unauthenticated user. Guest is not stored as a database role and cannot view Volunteer History.

* **Volunteer**: Authenticated user with role `VOLUNTEER` who can view their own history.

* **Event**: Volunteer event that may appear in history if Volunteer participated, attended, or completed it.

* **Volunteer History Record**: Record representing Volunteer’s participation/completion history for an event.

* **Applied Event**: Event that Volunteer applied to. It is not automatically Volunteer History.

* **Event Application**: Volunteer’s application to an event. Only approved application may lead to attendance/history, but approval alone is not always history.

* **Application Status**: Status such as `PENDING`, `APPROVED`, `REJECTED`, and `CANCELLED`.

* **Attendance Record**: Record showing whether Volunteer attended or checked in for the event.

* **Successful Attendance**: Attendance state showing Volunteer successfully checked in or participated.

* **Participation Status**: Status such as attended, completed, absent, or not recorded depending on final data design.

* **Volunteer Hours**: Number of hours credited to Volunteer for participating in event.

* **Feedback Status**: Information showing whether Volunteer has submitted feedback for the event.

* **Certificate Status**: Information showing whether certificate is available for the event.

* **History Filter**: Filter used to narrow Volunteer History by time or status.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: 100% Guest users are blocked from viewing Volunteer History and are asked to login/register.

* **SC-002**: 100% authenticated non-Volunteer users are blocked from viewing Volunteer History.

* **SC-003**: 100% Volunteer users can view only their own history records.

* **SC-004**: 0 history records from other Volunteers are displayed to the current Volunteer.

* **SC-005**: Applications with status `PENDING`, `REJECTED`, and `CANCELLED` are not displayed as Volunteer History.

* **SC-006**: Future `APPROVED` applications without attendance/participation record are not displayed as completed Volunteer History.

* **SC-007**: Events with successful attendance or participation record appear in Volunteer History.

* **SC-008**: Each history item displays event title, event date/time and location.

* **SC-009**: History item displays category, organization, image, attendance status, volunteer hours, feedback status and certificate status when data is available.

* **SC-010**: Volunteer without history records sees empty state instead of blank page.

* **SC-011**: Filter empty state appears when no history records match current filter.

* **SC-012**: Loading and error states are displayed clearly.

* **SC-013**: Volunteer History feature does not apply event, cancel application, approve/reject application, check in attendance, submit feedback or generate/download certificates directly.

---

## Assumptions

* **A-001**: Guest is not stored as a database role.

* **A-002**: Database roles are `VOLUNTEER`, `STAFF`, `MANAGER`, and `ADMIN`.

* **A-003**: Volunteer History belongs to Member 2 — Volunteer Event Module.

* **A-004**: Volunteer History corresponds to UC21 — View Volunteer History.

* **A-005**: Volunteer History requires authenticated Volunteer.

* **A-006**: Guest cannot view Volunteer History.

* **A-007**: Authenticated non-Volunteer user cannot view Volunteer History in this Volunteer flow.

* **A-008**: Volunteer can view only their own history.

* **A-009**: Volunteer History is different from Applied Events.

* **A-010**: `PENDING`, `REJECTED`, and `CANCELLED` applications are not Volunteer History.

* **A-011**: `APPROVED` application is necessary for attendance but does not automatically mean the event is history.

* **A-012**: Event should appear in Volunteer History when Volunteer has successful attendance or participation/completion record.

* **A-013**: Attendance check-in is handled by Attendance Management, not by Volunteer History.

* **A-014**: Feedback submission is handled by `006-volunteer-feedback-form`.

* **A-015**: Certificate viewing/downloading is handled by `007-volunteer-certificates`.

* **A-016**: Certificate generation is handled by Staff Module.

* **A-017**: Volunteer hours may be available from attendance/event completion data.

* **A-018**: Feedback status may be available after Feedback feature is implemented.

* **A-019**: Certificate status may be available after Certificate feature is implemented.

* **A-020**: Event archived or soft-deleted after participation may still appear in Volunteer History if history record exists.

* **A-021**: Backend/API must be the final authority for ownership and history visibility.

* **A-022**: Mock data can be used temporarily if API/data are not ready.

* **A-023**: Mobile app support is out of scope. Feature targets web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của Volunteer History và KHÔNG được implement trong feature này:

* Event List
* Search Event
* Filter Event
* Event Detail full display
* Apply Event submission
* Application form
* Applied Event List
* Cancel Application
* Attendance Check-in
* Attendance Management
* Attendance List
* Staff Application List
* Staff Application Detail
* Approve Application
* Reject Application
* Feedback Form submission
* Feedback List
* Feedback Detail
* Certificate List full management
* Certificate Detail full display
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

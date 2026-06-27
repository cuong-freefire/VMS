# Feature Specification: Volunteer Home Dashboard

**Feature Branch**: `feat/volunteer-home-dashboard`

**Created**: 2026-06-27

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là Volunteer của VMS, tôi muốn xem một Home Dashboard sau khi đăng nhập để nhanh chóng biết các event nên quan tâm, trạng thái application, event sắp diễn ra, feedback cần gửi và certificate đã có."

---

## User Scenarios & Testing

### User Story 1 - Volunteer mở Home Dashboard sau khi đăng nhập (Priority: P1)

Là Volunteer đã đăng nhập, tôi muốn xem Home Dashboard để nắm nhanh các thông tin quan trọng của mình trong hệ thống.

**Why this priority**: Home Dashboard là màn hình tổng quan đầu tiên sau khi Volunteer đăng nhập. Nếu dashboard không hiển thị đúng thông tin cá nhân, Volunteer sẽ phải tự đi nhiều màn khác nhau để kiểm tra application, event, feedback và certificate.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập bằng tài khoản Volunteer và mở Home Dashboard.

**Acceptance Scenarios**:

1. **Given** người dùng là Volunteer đã đăng nhập, **When** người dùng mở Home Dashboard, **Then** hệ thống hiển thị dashboard dành cho Volunteer.

2. **Given** Home Dashboard được hiển thị, **When** dữ liệu người dùng có sẵn, **Then** hệ thống hiển thị lời chào hoặc thông tin ngắn của Volunteer.

3. **Given** Volunteer chưa có dữ liệu application/history/certificate, **When** Home Dashboard được hiển thị, **Then** hệ thống hiển thị trạng thái phù hợp cho Volunteer mới.

4. **Given** Volunteer có dữ liệu liên quan, **When** Home Dashboard được hiển thị, **Then** hệ thống hiển thị các block summary tương ứng.

---

### User Story 2 - Bảo vệ quyền truy cập Volunteer Home Dashboard (Priority: P1)

Là hệ thống, tôi cần đảm bảo chỉ Volunteer đã đăng nhập mới được xem Volunteer Home Dashboard của chính mình.

**Why this priority**: Volunteer Home Dashboard chứa dữ liệu cá nhân như application, history, feedback reminder và certificate. Guest hoặc user không đúng role không được xem.

**Independent Test**: Có thể test độc lập bằng cách thử mở dashboard bằng Guest, Volunteer, Staff, Manager và Admin.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest chưa đăng nhập, **When** người dùng mở Volunteer Home Dashboard, **Then** hệ thống yêu cầu đăng nhập hoặc điều hướng sang Authentication flow.

2. **Given** người dùng đã đăng nhập nhưng không có role `VOLUNTEER`, **When** người dùng mở Volunteer Home Dashboard, **Then** hệ thống chặn truy cập và hiển thị forbidden state hoặc message phù hợp.

3. **Given** người dùng là Volunteer đã đăng nhập, **When** người dùng mở Home Dashboard, **Then** hệ thống chỉ hiển thị dữ liệu của Volunteer hiện tại.

4. **Given** có dữ liệu của Volunteer khác, **When** Volunteer hiện tại mở Home Dashboard, **Then** hệ thống không hiển thị dữ liệu của Volunteer khác.

---

### User Story 3 - Xem quick actions đến các feature chính (Priority: P1)

Là Volunteer, tôi muốn có các shortcut nhanh để đi đến các màn chính như Event Discovery, Applied Events, Volunteer History, Feedback và Certificates.

**Why this priority**: Dashboard cần giúp Volunteer đi nhanh đến các workflow quan trọng mà không cần tìm trong menu nhiều lần.

**Independent Test**: Có thể test độc lập bằng cách click từng quick action trên dashboard và kiểm tra điều hướng đúng.

**Acceptance Scenarios**:

1. **Given** Home Dashboard đang hiển thị, **When** Volunteer click shortcut Event Discovery, **Then** hệ thống điều hướng đến Event Discovery.

2. **Given** Home Dashboard đang hiển thị, **When** Volunteer click shortcut Applied Events, **Then** hệ thống điều hướng đến Applied Events.

3. **Given** Home Dashboard đang hiển thị, **When** Volunteer click shortcut Volunteer History, **Then** hệ thống điều hướng đến Volunteer History.

4. **Given** Home Dashboard đang hiển thị, **When** Volunteer click shortcut Certificates, **Then** hệ thống điều hướng đến Certificate List.

5. **Given** Volunteer có feedback reminder đủ điều kiện, **When** Volunteer click feedback action, **Then** hệ thống điều hướng đến Feedback Form của event tương ứng.

---

### User Story 4 - Xem Applied Events summary (Priority: P1)

Là Volunteer, tôi muốn xem nhanh số lượng application theo trạng thái để biết đơn nào đang chờ duyệt, đã duyệt, bị từ chối hoặc đã hủy.

**Why this priority**: Applied Events là một trong những dữ liệu quan trọng nhất với Volunteer sau khi apply event. Dashboard nên tóm tắt để Volunteer không phải mở danh sách đầy đủ mỗi lần.

**Independent Test**: Có thể test độc lập bằng cách tạo application với nhiều status khác nhau và kiểm tra dashboard summary.

**Acceptance Scenarios**:

1. **Given** Volunteer có application `PENDING`, **When** Home Dashboard hiển thị, **Then** hệ thống có thể hiển thị số lượng application đang chờ duyệt.

2. **Given** Volunteer có application `APPROVED`, **When** Home Dashboard hiển thị, **Then** hệ thống có thể hiển thị số lượng application đã được duyệt.

3. **Given** Volunteer có application `REJECTED`, **When** Home Dashboard hiển thị, **Then** hệ thống có thể hiển thị số lượng application bị từ chối.

4. **Given** Volunteer có application `CANCELLED`, **When** Home Dashboard hiển thị, **Then** hệ thống có thể hiển thị số lượng application đã hủy.

5. **Given** Volunteer click applied events summary, **When** hệ thống xử lý, **Then** Volunteer được điều hướng đến Applied Events page.

---

### User Story 5 - Xem upcoming approved events (Priority: P1)

Là Volunteer, tôi muốn xem nhanh các event sắp diễn ra mà tôi đã được approve để chuẩn bị tham gia đúng thời gian.

**Why this priority**: Event đã được approve và sắp diễn ra là thông tin cần chú ý nhất với Volunteer. Dashboard nên nhắc để Volunteer không bỏ lỡ event.

**Independent Test**: Có thể test độc lập bằng cách tạo approved application cho event sắp diễn ra và kiểm tra dashboard.

**Acceptance Scenarios**:

1. **Given** Volunteer có application `APPROVED` cho event sắp diễn ra, **When** Home Dashboard hiển thị, **Then** hệ thống hiển thị upcoming approved event.

2. **Given** upcoming approved event được hiển thị, **When** dữ liệu có sẵn, **Then** hệ thống hiển thị event title, date/time và location.

3. **Given** upcoming approved event được hiển thị, **When** Volunteer click View Detail, **Then** hệ thống điều hướng đến Event Detail.

4. **Given** Volunteer không có event approved sắp diễn ra, **When** Home Dashboard hiển thị, **Then** hệ thống hiển thị empty state nhỏ hoặc bỏ qua block phù hợp.

---

### User Story 6 - Xem Volunteer History summary (Priority: P2)

Là Volunteer, tôi muốn xem tóm tắt lịch sử tham gia như số event đã tham gia hoặc tổng giờ tình nguyện để theo dõi đóng góp của mình.

**Why this priority**: History summary giúp dashboard có giá trị cá nhân hóa hơn và cho Volunteer thấy tiến độ đóng góp của họ.

**Independent Test**: Có thể test độc lập bằng cách tạo history records và kiểm tra summary trên dashboard.

**Acceptance Scenarios**:

1. **Given** Volunteer có history records, **When** Home Dashboard hiển thị, **Then** hệ thống có thể hiển thị số event đã tham gia.

2. **Given** Volunteer có volunteer hours, **When** Home Dashboard hiển thị, **Then** hệ thống có thể hiển thị tổng giờ tình nguyện.

3. **Given** Volunteer click history summary, **When** hệ thống xử lý, **Then** Volunteer được điều hướng đến Volunteer History.

4. **Given** Volunteer chưa có history, **When** Home Dashboard hiển thị, **Then** hệ thống hiển thị trạng thái phù hợp cho Volunteer mới.

---

### User Story 7 - Xem feedback reminders (Priority: P2)

Là Volunteer, tôi muốn được nhắc gửi feedback cho event đã điểm danh thành công nhưng chưa feedback để hoàn thành quy trình sau event.

**Why this priority**: Theo business rule, Volunteer chỉ được gửi feedback sau khi điểm danh thành công và mỗi Volunteer chỉ gửi 1 feedback/event. Dashboard có thể nhắc những feedback còn thiếu.

**Independent Test**: Có thể test độc lập bằng cách tạo event đã attendance successful nhưng chưa feedback và kiểm tra dashboard reminder.

**Acceptance Scenarios**:

1. **Given** Volunteer đã điểm danh thành công ở event, **And** chưa gửi feedback, **When** Home Dashboard hiển thị, **Then** hệ thống có thể hiển thị feedback reminder.

2. **Given** feedback reminder được hiển thị, **When** Volunteer click Send Feedback, **Then** hệ thống điều hướng đến Feedback Form.

3. **Given** Volunteer đã gửi feedback cho event, **When** Home Dashboard hiển thị, **Then** hệ thống không hiển thị reminder gửi feedback cho event đó.

4. **Given** Volunteer chưa điểm danh thành công, **When** Home Dashboard hiển thị, **Then** hệ thống không hiển thị feedback reminder cho event đó.

---

### User Story 8 - Xem certificate reminders (Priority: P2)

Là Volunteer, tôi muốn biết certificate nào đã available để có thể xem hoặc tải nhanh.

**Why this priority**: Certificate là kết quả sau khi Volunteer tham gia event và được Staff tạo certificate. Dashboard có thể giúp Volunteer biết certificate đã sẵn sàng.

**Independent Test**: Có thể test độc lập bằng cách tạo certificate available cho Volunteer và kiểm tra dashboard.

**Acceptance Scenarios**:

1. **Given** Volunteer có certificate available, **When** Home Dashboard hiển thị, **Then** hệ thống có thể hiển thị certificate reminder hoặc certificate shortcut.

2. **Given** certificate reminder được hiển thị, **When** Volunteer click View Certificate, **Then** hệ thống điều hướng đến Certificate Detail hoặc Certificate List.

3. **Given** Volunteer chưa có certificate, **When** Home Dashboard hiển thị, **Then** hệ thống không hiển thị certificate available reminder hoặc hiển thị empty state phù hợp.

4. **Given** certificate chưa có file/download URL hợp lệ, **When** Dashboard hiển thị certificate status, **Then** hệ thống không download trực tiếp từ dashboard.

---

### User Story 9 - Xem event discovery shortcut hoặc event suggestions (Priority: P2)

Là Volunteer, tôi muốn dashboard gợi ý hoặc dẫn nhanh đến danh sách event để tìm cơ hội tham gia mới.

**Why this priority**: Một mục tiêu quan trọng của hệ thống là giúp Volunteer tìm event. Dashboard nên có entry point rõ ràng tới Event Discovery.

**Independent Test**: Có thể test độc lập bằng cách mở dashboard và kiểm tra shortcut/event suggestion.

**Acceptance Scenarios**:

1. **Given** Home Dashboard đang hiển thị, **When** Volunteer nhìn vào dashboard, **Then** hệ thống hiển thị shortcut tìm event mới.

2. **Given** dashboard có event suggestions, **When** dữ liệu event public có sẵn, **Then** hệ thống có thể hiển thị một số event public/discoverable.

3. **Given** Volunteer click một suggested event, **When** hệ thống xử lý, **Then** Volunteer được điều hướng đến Event Detail.

4. **Given** Volunteer muốn xem nhiều event hơn, **When** Volunteer click Browse Events, **Then** hệ thống điều hướng đến Event Discovery.

---

### User Story 10 - Loading, empty, error và partial error states (Priority: P2)

Là Volunteer, tôi muốn dashboard hiển thị rõ trạng thái đang tải, chưa có dữ liệu hoặc lỗi từng phần để không bị nhầm rằng hệ thống bị hỏng.

**Why this priority**: Dashboard tổng hợp nhiều nguồn dữ liệu. Một block lỗi không nên làm toàn bộ dashboard bị crash nếu các block khác vẫn tải được.

**Independent Test**: Có thể test độc lập bằng cách mô phỏng loading, empty, full error và partial error states.

**Acceptance Scenarios**:

1. **Given** dashboard đang tải dữ liệu, **When** Volunteer mở Home Dashboard, **Then** hệ thống hiển thị loading state.

2. **Given** Volunteer là user mới chưa có application/history/certificate, **When** Home Dashboard hiển thị, **Then** hệ thống hiển thị new volunteer/empty state thân thiện.

3. **Given** toàn bộ dashboard data tải thất bại, **When** hệ thống gặp lỗi, **Then** hệ thống hiển thị error state dễ hiểu.

4. **Given** một block dashboard tải lỗi nhưng các block khác tải được, **When** dashboard hiển thị, **Then** hệ thống hiển thị các block tải được và error state nhỏ cho block bị lỗi.

5. **Given** một block không có dữ liệu, **When** dashboard hiển thị, **Then** hệ thống hiển thị empty state nhỏ hoặc ẩn block theo rule UI.

---

## Edge Cases

* **Guest mở Volunteer Home Dashboard**: WHEN Guest mở Volunteer Home Dashboard, THE system SHALL yêu cầu đăng nhập hoặc điều hướng sang Authentication flow.

* **User không phải Volunteer mở Volunteer Home Dashboard**: WHEN authenticated user không có role `VOLUNTEER` mở dashboard, THE system SHALL chặn truy cập.

* **Volunteer xem dữ liệu của người khác**: WHERE có dữ liệu của Volunteer khác, THE system SHALL không hiển thị cho Volunteer hiện tại.

* **Volunteer mới chưa có dữ liệu**: WHEN Volunteer chưa có application, history, feedback reminder hoặc certificate, THE system SHALL hiển thị empty/new user state phù hợp.

* **Application summary không có dữ liệu**: WHERE application data missing hoặc empty, THE system SHALL không crash và hiển thị fallback phù hợp.

* **Upcoming event không có dữ liệu**: WHERE Volunteer không có approved upcoming event, THE system SHALL hiển thị empty state nhỏ hoặc ẩn block.

* **Feedback reminder không có dữ liệu**: WHERE Volunteer không có event đủ điều kiện feedback, THE system SHALL không hiển thị reminder sai.

* **Certificate reminder không có dữ liệu**: WHERE Volunteer không có certificate available, THE system SHALL không hiển thị download shortcut sai.

* **Event suggestion không có dữ liệu**: WHERE không có event public/discoverable, THE system SHALL hiển thị Browse Events shortcut hoặc empty state phù hợp.

* **Partial data failed**: WHEN một block tải thất bại, THE system SHALL vẫn hiển thị các block khác nếu có dữ liệu.

* **All data failed**: WHEN toàn bộ dashboard data tải thất bại, THE system SHALL hiển thị error state.

* **Profile data missing**: WHERE Volunteer name/profile missing, THE system SHALL hiển thị greeting fallback.

* **Certificate file missing**: WHERE certificate available nhưng file URL missing, THE system SHALL không download trực tiếp từ dashboard.

* **Feedback already submitted**: WHERE Volunteer đã gửi feedback cho event, THE system SHALL không hiển thị reminder feedback cho event đó.

* **Approved event đã qua thời gian**: WHERE event đã qua thời gian hoặc đã hoàn thành, THE system SHALL không hiển thị trong upcoming approved events.

---

## Requirements

### Functional Requirements

* **FR-001**: THE system SHALL allow only authenticated users with role `VOLUNTEER` to view Volunteer Home Dashboard.

* **FR-002**: WHEN Guest attempts to open Volunteer Home Dashboard, THE system SHALL require login/register or redirect to Authentication flow.

* **FR-003**: WHEN authenticated user is not `VOLUNTEER`, THE system SHALL block access to Volunteer Home Dashboard.

* **FR-004**: THE system SHALL show only dashboard data that belongs to the current authenticated Volunteer.

* **FR-005**: THE system SHALL NOT show personal data of other Volunteers.

* **FR-006**: Volunteer Home Dashboard SHALL be separate from Admin Dashboard, Manager Dashboard and Reporting Dashboard.

* **FR-007**: THE system SHOULD display welcome/profile summary if current Volunteer data is available.

* **FR-008**: IF Volunteer name/profile data is missing, THE system SHALL display fallback greeting.

* **FR-009**: THE system SHALL provide quick action to Event Discovery.

* **FR-010**: THE system SHALL provide quick action to Applied Events.

* **FR-011**: THE system SHALL provide quick action to Volunteer History.

* **FR-012**: THE system SHALL provide quick action to Certificates.

* **FR-013**: THE system MAY provide feedback quick action when Volunteer is eligible for feedback.

* **FR-014**: THE system SHOULD display Applied Events summary if application data is available.

* **FR-015**: Applied Events summary MAY include count of `PENDING` applications.

* **FR-016**: Applied Events summary MAY include count of `APPROVED` applications.

* **FR-017**: Applied Events summary MAY include count of `REJECTED` applications.

* **FR-018**: Applied Events summary MAY include count of `CANCELLED` applications.

* **FR-019**: THE system SHOULD display upcoming approved events if data is available.

* **FR-020**: Upcoming approved event summary SHOULD include event title.

* **FR-021**: Upcoming approved event summary SHOULD include event date/time.

* **FR-022**: Upcoming approved event summary SHOULD include location.

* **FR-023**: Upcoming approved event summary MAY include View Detail action.

* **FR-024**: THE system SHOULD display Volunteer History summary if data is available.

* **FR-025**: Volunteer History summary MAY include total participated/completed events.

* **FR-026**: Volunteer History summary MAY include total volunteer hours if available.

* **FR-027**: THE system MAY display feedback reminders for events that Volunteer attended successfully but has not submitted feedback.

* **FR-028**: THE system SHALL NOT display feedback reminder for event without successful attendance.

* **FR-029**: THE system SHALL NOT display feedback reminder for event that already has feedback from current Volunteer.

* **FR-030**: THE system MAY display certificate reminders when certificate is available.

* **FR-031**: THE system SHALL NOT show download action directly from dashboard unless certificate has valid file/download data and team explicitly allows it.

* **FR-032**: THE system MAY display event suggestions or new public events if event data is available.

* **FR-033**: Event suggestion MAY navigate to Event Detail.

* **FR-034**: Browse Events action SHALL navigate to Event Discovery.

* **FR-035**: THE system SHALL NOT perform Event Search/Filter directly in this dashboard feature.

* **FR-036**: THE system SHALL NOT submit Apply Event in this dashboard feature.

* **FR-037**: THE system SHALL NOT cancel application in this dashboard feature.

* **FR-038**: THE system SHALL NOT perform Attendance Check-in in this dashboard feature.

* **FR-039**: THE system SHALL NOT submit feedback directly in this dashboard feature.

* **FR-040**: THE system SHALL NOT download certificate directly unless explicitly approved in later plan.

* **FR-041**: THE system SHALL NOT generate certificate in this dashboard feature.

* **FR-042**: THE system SHALL NOT display system-wide statistics in this Volunteer Home Dashboard.

* **FR-043**: THE system SHALL NOT export reports in this feature.

* **FR-044**: WHEN dashboard data is loading, THE system SHALL display loading state.

* **FR-045**: WHEN Volunteer has no personal dashboard data, THE system SHALL display new Volunteer/empty state.

* **FR-046**: WHEN all dashboard data cannot be loaded, THE system SHALL display understandable error state.

* **FR-047**: WHEN only one dashboard block fails to load, THE system SHOULD display partial error state for that block while keeping other blocks visible.

* **FR-048**: THE system SHALL NOT rely only on frontend validation. Backend/API must enforce authentication, role and ownership for dashboard data.

* **FR-049**: THE system SHALL treat application summary, upcoming events, history summary, feedback reminders and certificate reminders as data from related modules until final API/data contracts are approved.

---

### Key Entities

* **Guest**: Unauthenticated user. Guest is not stored as a database role and cannot view Volunteer Home Dashboard.

* **Volunteer**: Authenticated user with role `VOLUNTEER` who can view their own Home Dashboard.

* **Volunteer Home Dashboard**: Personal summary page for the current Volunteer.

* **Profile Summary**: Short information about the current Volunteer, such as name or profile completion if data is available.

* **Quick Action**: Button/link that navigates to another Volunteer feature.

* **Applied Events Summary**: Summary of current Volunteer’s applications by status.

* **Application Status**: Status such as `PENDING`, `APPROVED`, `REJECTED`, and `CANCELLED`.

* **Upcoming Approved Event**: Event that the current Volunteer has been approved for and has not happened yet.

* **Volunteer History Summary**: Summary of events Volunteer has participated in or completed.

* **Volunteer Hours**: Total hours credited to Volunteer if data is available.

* **Feedback Reminder**: Reminder for event that Volunteer attended successfully but has not submitted feedback.

* **Certificate Reminder**: Reminder for certificate that is available for current Volunteer.

* **Event Suggestion**: Public/discoverable event shown as a suggestion or shortcut to Event Discovery.

* **Partial Error State**: State where one dashboard block fails while other blocks still display.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: 100% Guest users are blocked from viewing Volunteer Home Dashboard and are asked to login/register.

* **SC-002**: 100% authenticated non-Volunteer users are blocked from Volunteer Home Dashboard.

* **SC-003**: 100% Volunteer users can view only their own dashboard data.

* **SC-004**: 0 personal data from other Volunteers is displayed to the current Volunteer.

* **SC-005**: Dashboard provides quick actions to Event Discovery, Applied Events, Volunteer History and Certificates.

* **SC-006**: Dashboard displays welcome/profile summary or fallback greeting.

* **SC-007**: Dashboard displays application summary when data is available.

* **SC-008**: Dashboard displays upcoming approved events when data is available.

* **SC-009**: Dashboard displays history summary when data is available.

* **SC-010**: Dashboard displays feedback reminder only for attended events without feedback.

* **SC-011**: Dashboard displays certificate reminder only when certificate is available.

* **SC-012**: New Volunteer without data sees friendly empty/new user state.

* **SC-013**: Partial data failure does not crash the whole dashboard if other blocks can still render.

* **SC-014**: Dashboard does not perform apply, cancel, attendance check-in, feedback submission, certificate generation, certificate download, system-wide statistics or report export.

---

## Assumptions

* **A-001**: Guest is not stored as a database role.

* **A-002**: Database roles are `VOLUNTEER`, `STAFF`, `MANAGER`, and `ADMIN`.

* **A-003**: Volunteer Home Dashboard belongs to Member 2 — Volunteer Event Module.

* **A-004**: Volunteer Home Dashboard is different from Admin Dashboard, Manager Dashboard and Reporting Dashboard.

* **A-005**: Volunteer Home Dashboard requires authenticated Volunteer.

* **A-006**: Guest cannot view Volunteer Home Dashboard.

* **A-007**: Staff, Manager and Admin do not use this Volunteer Dashboard flow.

* **A-008**: Dashboard shows only current Volunteer’s data.

* **A-009**: Dashboard is mainly an overview and navigation feature.

* **A-010**: Full Event Discovery is handled by `001-volunteer-event-discovery`.

* **A-011**: Full Event Detail is handled by `002-volunteer-event-detail`.

* **A-012**: Apply Event is handled by `003-volunteer-event-application`.

* **A-013**: Applied Events and Cancel Application are handled by `004-volunteer-applied-events`.

* **A-014**: Volunteer History is handled by `005-volunteer-history`.

* **A-015**: Feedback submission is handled by `006-volunteer-feedback-form`.

* **A-016**: Certificate List, Detail and Download are handled by `007-volunteer-certificates`.

* **A-017**: Application approval and attendance data depend on Staff Module.

* **A-018**: Certificate availability depends on Staff Generate Certificate.

* **A-019**: Dashboard can use mock data temporarily if API/data are not ready.

* **A-020**: Backend/API must be the final authority for dashboard ownership and visibility.

* **A-021**: Mobile app support is out of scope. Feature targets web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của Volunteer Home Dashboard và KHÔNG được implement trong feature này:

* Event Search/Filter full flow
* Event Detail full display
* Apply Event submission
* Application form
* Applied Event List full display
* Cancel Application
* Volunteer History full display
* Feedback Form submission
* Certificate List full display
* Certificate Detail full display
* Download Certificate
* Attendance Check-in
* Attendance Management
* Staff Application List
* Staff Application Detail
* Approve Application
* Reject Application
* Feedback List
* Feedback Detail
* Generate Certificate
* Staff Add Event
* Staff Edit Event
* Staff Delete Event
* Category Management
* Skill Management
* Organization Management
* Notification Management
* Donation and Payment
* Admin Dashboard
* Manager Dashboard
* Event Statistics
* Volunteer Statistics
* Export Reports
* Database schema design
* Database migration
* API endpoint contract
* Backend route definition
* Final UI component architecture
* Implementation task breakdown

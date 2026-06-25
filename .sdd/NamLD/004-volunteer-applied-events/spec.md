# Feature Specification: Volunteer Applied Events

**Feature Branch**: `feat/volunteer-applied-events`

**Created**: 2026-06-25

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là một Volunteer của VMS, tôi muốn xem danh sách các sự kiện mà tôi đã đăng ký tham gia để theo dõi trạng thái application, xem lại thông tin event và hủy application nếu còn được phép."

---

## User Scenarios & Testing

### User Story 1 - Volunteer xem danh sách event đã apply (Priority: P1)

Là Volunteer đã đăng nhập, tôi muốn xem danh sách các event mà tôi đã apply để biết mình đã đăng ký những sự kiện nào.

**Why this priority**: Đây là luồng chính của feature Applied Events. Sau khi Volunteer submit application ở feature Apply Event, họ cần một nơi để xem lại các application đã gửi.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập bằng tài khoản Volunteer có application, mở Applied Events page và kiểm tra danh sách event đã apply được hiển thị đúng.

**Acceptance Scenarios**:

1. **Given** người dùng là Volunteer đã đăng nhập, **When** người dùng mở Applied Events page, **Then** hệ thống hiển thị danh sách các event mà Volunteer đó đã apply.

2. **Given** Volunteer có nhiều application, **When** Applied Events page được hiển thị, **Then** hệ thống hiển thị từng application kèm thông tin tóm tắt của event tương ứng.

3. **Given** Volunteer chưa apply event nào, **When** người dùng mở Applied Events page, **Then** hệ thống hiển thị empty state với thông báo rõ ràng.

4. **Given** Volunteer đã apply một event từ feature Apply Event, **When** người dùng mở Applied Events page, **Then** application vừa tạo xuất hiện trong danh sách Applied Events.

---

### User Story 2 - Bảo vệ quyền truy cập Applied Events (Priority: P1)

Là hệ thống, tôi cần đảm bảo chỉ Volunteer đã đăng nhập mới được xem danh sách event đã apply của chính mình.

**Why this priority**: Applied Events là dữ liệu cá nhân của Volunteer. Guest hoặc user khác không được xem application của Volunteer.

**Independent Test**: Có thể test độc lập bằng cách thử mở Applied Events khi chưa login, khi login bằng role không phải Volunteer, và khi login bằng Volunteer khác.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest chưa đăng nhập, **When** người dùng mở Applied Events page, **Then** hệ thống yêu cầu đăng nhập hoặc điều hướng sang Authentication flow.

2. **Given** người dùng đã đăng nhập nhưng không có role Volunteer, **When** người dùng mở Applied Events page, **Then** hệ thống không cho xem danh sách và hiển thị forbidden state hoặc thông báo phù hợp.

3. **Given** người dùng là Volunteer đã đăng nhập, **When** người dùng mở Applied Events page, **Then** hệ thống chỉ hiển thị application của chính Volunteer đó.

4. **Given** có application của Volunteer khác, **When** Volunteer hiện tại mở Applied Events page, **Then** hệ thống không hiển thị application của Volunteer khác.

---

### User Story 3 - Xem trạng thái application của từng event (Priority: P1)

Là Volunteer, tôi muốn xem trạng thái application của từng event để biết đơn đăng ký của mình đang chờ duyệt, đã được duyệt, bị từ chối hoặc đã hủy.

**Why this priority**: Trạng thái application là thông tin quan trọng nhất trong Applied Events. Volunteer cần biết kết quả xử lý từ Staff.

**Independent Test**: Có thể test độc lập bằng cách tạo application với các status khác nhau và kiểm tra UI hiển thị đúng.

**Acceptance Scenarios**:

1. **Given** application có status `PENDING`, **When** Applied Events được hiển thị, **Then** hệ thống hiển thị trạng thái đang chờ duyệt.

2. **Given** application có status `APPROVED`, **When** Applied Events được hiển thị, **Then** hệ thống hiển thị trạng thái đã được duyệt.

3. **Given** application có status `REJECTED`, **When** Applied Events được hiển thị, **Then** hệ thống hiển thị trạng thái bị từ chối.

4. **Given** application có status `CANCELLED`, **When** Applied Events được hiển thị, **Then** hệ thống hiển thị trạng thái đã hủy.

5. **Given** application có reject reason hoặc review note, **When** dữ liệu có sẵn, **Then** hệ thống có thể hiển thị lý do hoặc ghi chú cho Volunteer.

---

### User Story 4 - Xem thông tin tóm tắt của event đã apply (Priority: P1)

Là Volunteer, tôi muốn mỗi applied event hiển thị thông tin tóm tắt của event để dễ nhận biết đó là sự kiện nào.

**Why this priority**: Nếu chỉ hiển thị application status mà không có event summary, Volunteer sẽ khó biết application thuộc event nào.

**Independent Test**: Có thể test độc lập bằng cách kiểm tra mỗi applied event item/card có đủ thông tin tóm tắt bắt buộc.

**Acceptance Scenarios**:

1. **Given** một application xuất hiện trong Applied Events, **When** application item được hiển thị, **Then** hệ thống hiển thị event title, category, organization, start date/time, location, event status, application status và submitted time.

2. **Given** event có thumbnail hoặc image, **When** application item được hiển thị, **Then** hệ thống hiển thị image nếu có dữ liệu phù hợp.

3. **Given** event không có thumbnail hoặc image, **When** application item được hiển thị, **Then** hệ thống hiển thị placeholder hoặc layout thay thế ổn định.

4. **Given** event đã bị cancelled hoặc unavailable sau khi Volunteer apply, **When** application item được hiển thị, **Then** hệ thống vẫn hiển thị application record và thể hiện event không còn khả dụng nếu dữ liệu có sẵn.

---

### User Story 5 - Lọc và phân trang Applied Events (Priority: P2)

Là Volunteer, tôi muốn lọc danh sách Applied Events theo trạng thái application và xem theo từng trang để dễ quản lý khi có nhiều application.

**Why this priority**: Khi số lượng application tăng lên, filter và pagination giúp Volunteer theo dõi dễ hơn. Đây là UX hỗ trợ, không phải nghiệp vụ lõi như xem danh sách và trạng thái.

**Independent Test**: Có thể test độc lập bằng cách tạo nhiều application với nhiều status khác nhau, sau đó filter và chuyển trang.

**Acceptance Scenarios**:

1. **Given** Applied Events có nhiều application với nhiều status, **When** Volunteer chọn filter `PENDING`, **Then** hệ thống chỉ hiển thị application đang chờ duyệt.

2. **Given** Applied Events có application `APPROVED`, **When** Volunteer chọn filter `APPROVED`, **Then** hệ thống chỉ hiển thị application đã được duyệt.

3. **Given** Applied Events có application `REJECTED`, **When** Volunteer chọn filter `REJECTED`, **Then** hệ thống chỉ hiển thị application bị từ chối.

4. **Given** Applied Events có application `CANCELLED`, **When** Volunteer chọn filter `CANCELLED`, **Then** hệ thống chỉ hiển thị application đã hủy.

5. **Given** Volunteer chọn filter `ALL`, **When** danh sách được cập nhật, **Then** hệ thống hiển thị tất cả application của Volunteer đó.

6. **Given** số lượng applied events lớn hơn số lượng tối đa trên một trang, **When** Applied Events page được hiển thị, **Then** hệ thống phân trang danh sách.

---

### User Story 6 - Xem lại Event Detail từ Applied Events (Priority: P2)

Là Volunteer, tôi muốn bấm vào một applied event để xem lại Event Detail.

**Why this priority**: Volunteer có thể cần xem lại thông tin đầy đủ của event như thời gian, địa điểm, mô tả, kỹ năng yêu cầu hoặc tổ chức phụ trách.

**Independent Test**: Có thể test độc lập bằng cách click View Detail trên một applied event item và kiểm tra hệ thống điều hướng đúng Event Detail.

**Acceptance Scenarios**:

1. **Given** một applied event đang hiển thị, **When** Volunteer click View Detail, **Then** hệ thống điều hướng sang Event Detail của event tương ứng.

2. **Given** event detail vẫn public/discoverable, **When** Volunteer click View Detail, **Then** Event Detail được hiển thị bình thường.

3. **Given** event không còn public hoặc unavailable, **When** Volunteer click View Detail, **Then** hệ thống xử lý theo rule của Event Detail feature và hiển thị not found/unavailable nếu cần.

---

### User Story 7 - Cancel application nếu còn được phép (Priority: P2)

Là Volunteer, tôi muốn hủy application đang chờ duyệt nếu tôi không còn muốn tham gia event nữa.

**Why this priority**: Cancel application giúp Volunteer tự quản lý application của mình, nhưng cần giới hạn để không ảnh hưởng luồng Staff review và capacity.

**Independent Test**: Có thể test độc lập bằng cách cancel application `PENDING` và kiểm tra status chuyển thành `CANCELLED`.

**Acceptance Scenarios**:

1. **Given** application có status `PENDING`, **When** Volunteer chọn Cancel Application, **Then** hệ thống yêu cầu xác nhận trước khi hủy.

2. **Given** Volunteer xác nhận hủy application `PENDING`, **When** hệ thống xử lý thành công, **Then** application chuyển sang status `CANCELLED`.

3. **Given** application có status `APPROVED`, **When** Volunteer xem Applied Events, **Then** hệ thống không cho cancel trong bản đầu nếu chưa có rule team review.

4. **Given** application có status `REJECTED`, **When** Volunteer xem Applied Events, **Then** hệ thống không cho cancel.

5. **Given** application có status `CANCELLED`, **When** Volunteer xem Applied Events, **Then** hệ thống không cho cancel lại.

6. **Given** cancel application thất bại, **When** hệ thống nhận lỗi, **Then** hệ thống hiển thị error message rõ ràng và không làm crash trang.

---

### User Story 8 - Loading, empty và error states (Priority: P2)

Là Volunteer, tôi muốn hệ thống hiển thị rõ trạng thái đang tải, không có dữ liệu hoặc lỗi để không bị nhầm rằng trang bị hỏng.

**Why this priority**: Đây là yêu cầu UX quan trọng để người dùng hiểu hệ thống đang làm gì.

**Independent Test**: Có thể test độc lập bằng cách mô phỏng loading, empty và error states.

**Acceptance Scenarios**:

1. **Given** Applied Events đang tải dữ liệu, **When** Volunteer mở page, **Then** hệ thống hiển thị loading state.

2. **Given** Volunteer chưa có application nào, **When** Applied Events page được hiển thị, **Then** hệ thống hiển thị empty state.

3. **Given** không có application nào phù hợp với filter hiện tại, **When** danh sách được cập nhật, **Then** hệ thống hiển thị empty state phù hợp với filter.

4. **Given** dữ liệu Applied Events không tải được, **When** hệ thống gặp lỗi, **Then** hệ thống hiển thị error state dễ hiểu và không làm crash trang.

---

## Edge Cases

* **Guest mở Applied Events**: WHEN Guest mở Applied Events page, THE system SHALL yêu cầu đăng nhập hoặc điều hướng sang Authentication flow.

* **User không phải Volunteer mở Applied Events**: WHEN authenticated non-Volunteer user mở Applied Events, THE system SHALL chặn truy cập.

* **Volunteer không có application nào**: WHEN Volunteer chưa apply event nào, THE system SHALL hiển thị empty state.

* **Volunteer chỉ thấy application của mình**: WHERE có application của Volunteer khác, THE system SHALL không hiển thị cho Volunteer hiện tại.

* **Application PENDING**: WHERE application status là `PENDING`, THE system SHALL hiển thị trạng thái đang chờ duyệt.

* **Application APPROVED**: WHERE application status là `APPROVED`, THE system SHALL hiển thị trạng thái đã được duyệt.

* **Application REJECTED**: WHERE application status là `REJECTED`, THE system SHALL hiển thị trạng thái bị từ chối.

* **Application CANCELLED**: WHERE application status là `CANCELLED`, THE system SHALL hiển thị trạng thái đã hủy.

* **Cancel PENDING application**: WHEN Volunteer hủy application `PENDING`, THE system SHALL yêu cầu xác nhận và chuyển status thành `CANCELLED` nếu thành công.

* **Cancel APPROVED application**: WHERE application status là `APPROVED`, THE system SHALL không cho cancel trong bản đầu nếu chưa được team review.

* **Cancel REJECTED/CANCELLED application**: WHERE application status là `REJECTED` hoặc `CANCELLED`, THE system SHALL không cho cancel.

* **Event bị unavailable sau khi apply**: WHERE event không còn public hoặc bị cancelled/deleted sau khi Volunteer apply, THE system SHALL vẫn hiển thị application record nếu dữ liệu còn tồn tại, kèm trạng thái phù hợp nếu có.

* **Filter không có kết quả**: WHEN Volunteer chọn filter status nhưng không có application phù hợp, THE system SHALL hiển thị empty state theo filter.

* **Pagination sau khi đổi filter**: WHEN Volunteer đổi application status filter, THE system SHALL reset pagination về trang đầu tiên.

* **Lỗi tải dữ liệu**: WHEN Applied Events data không tải được, THE system SHALL hiển thị error state rõ ràng.

---

## Requirements

### Functional Requirements

* **FR-001**: THE system SHALL allow only authenticated Volunteer users to view Applied Events.

* **FR-002**: WHEN Guest attempts to open Applied Events, THE system SHALL require login or redirect to Authentication flow.

* **FR-003**: WHEN authenticated user is not Volunteer, THE system SHALL block access to Applied Events.

* **FR-004**: THE system SHALL show only applications that belong to the current authenticated Volunteer.

* **FR-005**: THE system SHALL NOT show applications of other Volunteers.

* **FR-006**: Applied Events SHALL display applications created from Apply Event feature.

* **FR-007**: EACH applied event item SHALL display event summary and application status.

* **FR-008**: Event summary SHALL include event title, category, organization, start date/time, location, event status, application status and submitted time.

* **FR-009**: IF event thumbnail/image exists, THE system SHALL display it.

* **FR-010**: IF event thumbnail/image is missing, THE system SHALL display placeholder or fallback layout.

* **FR-011**: THE system SHALL support application status `PENDING`.

* **FR-012**: THE system SHALL support application status `APPROVED`.

* **FR-013**: THE system SHALL support application status `REJECTED`.

* **FR-014**: THE system SHALL support application status `CANCELLED`.

* **FR-015**: THE system SHALL display status label/message for each application status.

* **FR-016**: THE system SHOULD support filter by application status: `ALL`, `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

* **FR-017**: THE system SHOULD support pagination when applied events count exceeds page size.

* **FR-018**: WHEN application status filter changes, THE system SHALL reset pagination to first page.

* **FR-019**: THE system SHALL allow Volunteer to navigate from an applied event item to Event Detail.

* **FR-020**: THE system MAY allow Volunteer to cancel application with status `PENDING`.

* **FR-021**: WHEN Volunteer cancels a `PENDING` application, THE system SHALL ask for confirmation before canceling.

* **FR-022**: WHEN cancel action succeeds, THE system SHALL update application status to `CANCELLED`.

* **FR-023**: THE system SHALL NOT allow cancel action for `REJECTED` or `CANCELLED` applications.

* **FR-024**: THE system SHALL NOT allow cancel action for `APPROVED` application in the first version unless team review approves it.

* **FR-025**: THE system SHALL NOT approve or reject application in this feature.

* **FR-026**: THE system SHALL NOT create new application in this feature.

* **FR-027**: THE system SHALL NOT manage attendance, feedback, certificate, notification, donation/payment or reporting in this feature.

* **FR-028**: WHEN Applied Events data is loading, THE system SHALL display loading state.

* **FR-029**: WHEN Volunteer has no applied events, THE system SHALL display empty state.

* **FR-030**: WHEN no applied events match current filter, THE system SHALL display filter empty state.

* **FR-031**: WHEN Applied Events data cannot be loaded, THE system SHALL display understandable error state.

* **FR-032**: THE system SHALL NOT rely only on frontend visibility for protected actions. Backend/API must enforce authentication, role and ownership rules.

* **FR-033**: THE system SHALL treat application status, review result, cancel rule and event summary as shared data owned by related modules until approved contracts or plans define otherwise.

---

### Key Entities

* **Volunteer**: Authenticated user with Volunteer role who can view their own applied events.

* **Guest**: Unauthenticated user who cannot view Applied Events.

* **Event**: Volunteer event associated with an application.

* **Event Application**: Record representing Volunteer’s application to an event.

* **Application Status**: Status of the application, including `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

* **Applied Event Item**: UI representation of one application together with event summary.

* **Submitted Time**: Time when Volunteer submitted the application.

* **Review Result**: Result of Staff review, represented through application status and optional note/reason.

* **Cancel Application**: Optional action allowing Volunteer to cancel a pending application.

* **Application Status Filter**: Filter used to view applications by status.

* **Pagination State**: State for dividing Applied Events into pages when list is long.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: 100% Guest users are blocked from viewing Applied Events and are asked to login or go through Authentication flow.

* **SC-002**: 100% authenticated non-Volunteer users are blocked from viewing Applied Events.

* **SC-003**: 100% Volunteer users can view only their own applications.

* **SC-004**: 0 applications from other Volunteers are displayed in the current Volunteer’s Applied Events page.

* **SC-005**: Applications with status `PENDING`, `APPROVED`, `REJECTED`, and `CANCELLED` display correct status labels/messages.

* **SC-006**: Each applied event item displays required summary fields: title, category, organization, start date/time, location, event status, application status, and submitted time.

* **SC-007**: Volunteer with no applications sees empty state instead of blank page.

* **SC-008**: Volunteer can filter applications by status if filter is available.

* **SC-009**: Pagination works when applied events exceed page size if pagination is available.

* **SC-010**: Volunteer can navigate from Applied Events to Event Detail.

* **SC-011**: `PENDING` application can be cancelled only after confirmation if cancel is implemented in this feature.

* **SC-012**: `APPROVED`, `REJECTED`, and `CANCELLED` applications cannot be cancelled in the first version unless team review changes the rule.

* **SC-013**: Applied Events feature does not create, approve, reject, or review applications.

* **SC-014**: Loading, empty and error states are displayed clearly.

---

## Assumptions

* **A-001**: Project-level specification đã xác nhận hệ thống có 5 roles: Guest, Volunteer, Staff, Manager, Admin.

* **A-002**: Applied Events yêu cầu authenticated Volunteer.

* **A-003**: Guest không được xem Applied Events.

* **A-004**: Authenticated non-Volunteer user không được xem Applied Events.

* **A-005**: Volunteer chỉ xem được application của chính mình.

* **A-006**: Application được tạo từ feature `003-volunteer-event-application`.

* **A-007**: Application status bản đầu gồm `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

* **A-008**: Application mới sau khi apply thành công bắt đầu là `PENDING`.

* **A-009**: Staff review application và chuyển status sang `APPROVED` hoặc `REJECTED`.

* **A-010**: Applied Events cần hiển thị event summary, không cần full Event Detail.

* **A-011**: Volunteer có thể click applied event để xem Event Detail.

* **A-012**: Applied Events có thể hỗ trợ filter theo application status.

* **A-013**: Applied Events có thể hỗ trợ pagination nếu danh sách dài.

* **A-014**: Cancel application nếu làm trong feature này thì bản đầu chỉ cho `PENDING`.

* **A-015**: `APPROVED`, `REJECTED`, `CANCELLED` không được cancel trong bản đầu.

* **A-016**: Event History là feature riêng `005-volunteer-event-history`.

* **A-017**: Attendance, certificate, feedback, notification, donation/payment và reporting không thuộc feature này.

* **A-018**: Member 1 chịu trách nhiệm Authentication/Profile.

* **A-019**: Member 3 chịu trách nhiệm application review status, cancel rule, event lifecycle và capacity behavior.

* **A-020**: Mock data có thể được dùng tạm trong giai đoạn đầu nếu API/data thật chưa sẵn sàng.

* **A-021**: Mobile app support là out of scope. Feature này chỉ nhắm đến web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của Volunteer Applied Events và KHÔNG được implement trong feature này:

* Event List
* Search Event
* Filter Event
* Event Detail full display
* Submit Apply Event
* Application form
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

# Feature Specification: View Event Detail

**Feature Branch**: `feat/event-detail`

**Created**: 2026-06-27

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là Guest hoặc Volunteer, tôi muốn xem chi tiết một sự kiện tình nguyện công khai để hiểu rõ thông tin trước khi quyết định đăng ký tham gia."

---

## User Scenarios & Testing

### User Story 1 - Guest xem chi tiết event công khai (Priority: P1)

Là Guest, tôi muốn xem chi tiết một event công khai để biết event đó là gì, diễn ra khi nào, ở đâu và do tổ chức nào phụ trách.

**Why this priority**: Guest cần xem thông tin event trước khi quyết định đăng ký tài khoản hoặc đăng nhập để apply event.

**Independent Test**: Có thể test độc lập bằng cách mở Event Detail khi chưa đăng nhập.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest, **When** người dùng mở một public Event Detail, **Then** hệ thống hiển thị thông tin chi tiết của event.

2. **Given** người dùng là Guest, **When** Event Detail được hiển thị, **Then** hệ thống không yêu cầu đăng nhập chỉ để xem thông tin event.

3. **Given** người dùng là Guest, **When** người dùng bấm Apply hoặc Join Event, **Then** hệ thống yêu cầu đăng nhập/đăng ký hoặc điều hướng sang Authentication flow.

4. **Given** event không public hoặc không tồn tại, **When** Guest mở Event Detail, **Then** hệ thống hiển thị not found/unavailable state.

---

### User Story 2 - Volunteer xem chi tiết event công khai (Priority: P1)

Là Volunteer, tôi muốn xem chi tiết event để biết event có phù hợp với thời gian, địa điểm, kỹ năng và khả năng tham gia của tôi hay không.

**Why this priority**: Volunteer cần thông tin đầy đủ trước khi apply. Nếu chỉ nhìn Event List thì chưa đủ để quyết định tham gia.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập bằng tài khoản Volunteer và mở Event Detail.

**Acceptance Scenarios**:

1. **Given** người dùng là Volunteer đã đăng nhập, **When** người dùng mở public Event Detail, **Then** hệ thống hiển thị thông tin chi tiết của event.

2. **Given** Event Detail được hiển thị, **When** dữ liệu event có đầy đủ, **Then** hệ thống hiển thị title, description, organization, category, time, location, capacity, remaining slots, deadline và required skills nếu có.

3. **Given** Volunteer đang ở Event Detail, **When** Volunteer bấm Back to Event List, **Then** hệ thống điều hướng về Event List.

4. **Given** event không còn public hoặc đã bị xóa mềm, **When** Volunteer mở Event Detail, **Then** hệ thống hiển thị not found/unavailable state.

---

### User Story 3 - Xem trạng thái applyable của event (Priority: P1)

Là Guest hoặc Volunteer, tôi muốn biết event còn có thể đăng ký hay không để không nhầm lẫn khi xem chi tiết.

**Why this priority**: Event có thể đã full, đã qua deadline hoặc không còn nhận đăng ký. Người dùng cần thấy trạng thái rõ ràng trước khi bấm Apply.

**Independent Test**: Có thể test độc lập bằng cách mở Event Detail với các event có trạng thái khác nhau như còn slot, full, quá deadline.

**Acceptance Scenarios**:

1. **Given** event còn slot và chưa qua deadline, **When** Event Detail hiển thị, **Then** hệ thống có thể hiển thị trạng thái event còn có thể apply.

2. **Given** event đã full, **When** Event Detail hiển thị, **Then** hệ thống hiển thị rõ event đã full hoặc không còn slot.

3. **Given** event đã qua application deadline, **When** Event Detail hiển thị, **Then** hệ thống hiển thị rõ event đã hết hạn đăng ký.

4. **Given** event không còn đủ điều kiện apply, **When** Event Detail hiển thị, **Then** hệ thống không được làm người dùng hiểu nhầm rằng event vẫn có thể apply.

---

### User Story 4 - Điều hướng sang Apply Event flow (Priority: P1)

Là Volunteer, tôi muốn từ Event Detail có thể đi sang Apply Event flow để đăng ký tham gia event nếu đủ điều kiện.

**Why this priority**: Event Detail là điểm quyết định chính trước khi apply. Tuy nhiên UC09 không được submit application trực tiếp, mà chỉ điều hướng sang UC12.

**Independent Test**: Có thể test độc lập bằng cách bấm Apply trên Event Detail và kiểm tra điều hướng sang UC12.

**Acceptance Scenarios**:

1. **Given** Volunteer đã đăng nhập và event có thể apply, **When** Volunteer bấm Apply, **Then** hệ thống điều hướng sang UC12 — Apply Event.

2. **Given** Volunteer đã đăng nhập, **When** Volunteer bấm Apply trên Event Detail, **Then** UC09 không tạo application trực tiếp.

3. **Given** Guest bấm Apply trên Event Detail, **When** hệ thống xử lý, **Then** hệ thống yêu cầu login/register trước khi tiếp tục.

4. **Given** event đã full hoặc quá deadline, **When** Event Detail hiển thị, **Then** hệ thống không nên cho phép điều hướng apply như một event bình thường.

---

### User Story 5 - Xử lý trạng thái loading, not found và error (Priority: P2)

Là người dùng, tôi muốn Event Detail hiển thị rõ trạng thái đang tải, không tìm thấy hoặc lỗi để hiểu tình trạng của hệ thống.

**Why this priority**: Event Detail phụ thuộc vào dữ liệu event. Nếu dữ liệu tải chậm, không tồn tại hoặc lỗi, UI cần phản hồi rõ ràng.

**Independent Test**: Có thể test độc lập bằng cách mock loading, not found, unavailable và error states.

**Acceptance Scenarios**:

1. **Given** Event Detail đang tải dữ liệu, **When** người dùng mở trang, **Then** hệ thống hiển thị loading state.

2. **Given** event không tồn tại, **When** người dùng mở Event Detail, **Then** hệ thống hiển thị not found state.

3. **Given** event tồn tại nhưng không public, **When** người dùng mở Event Detail, **Then** hệ thống hiển thị unavailable state.

4. **Given** hệ thống không tải được dữ liệu event, **When** lỗi xảy ra, **Then** hệ thống hiển thị error state.

5. **Given** event không có image/thumbnail, **When** Event Detail hiển thị, **Then** hệ thống hiển thị fallback image hoặc fallback UI phù hợp.

---

## Edge Cases

* **Guest mở Event Detail**: Guest được xem public Event Detail nhưng không được submit application.

* **Guest bấm Apply**: Hệ thống yêu cầu login/register hoặc điều hướng sang Authentication flow.

* **Volunteer mở Event Detail**: Volunteer được xem public Event Detail và có thể đi sang UC12 nếu event đủ điều kiện.

* **Event không tồn tại**: Hệ thống hiển thị not found state.

* **Event không public**: Hệ thống hiển thị unavailable state hoặc not found state tùy rule UI.

* **Event soft-deleted**: Hệ thống không hiển thị Event Detail.

* **Event draft**: Hệ thống không hiển thị public Event Detail.

* **Event archived/cancelled/completed**: Bản đầu không hiển thị public Event Detail cho các trạng thái này.

* **Event full**: Event có thể hiển thị detail nếu còn public, nhưng phải hiển thị rõ là full hoặc không còn slot.

* **Event quá deadline apply**: Event có thể hiển thị detail nếu còn public, nhưng phải hiển thị rõ là hết hạn đăng ký.

* **Event thiếu image/thumbnail**: Hệ thống hiển thị fallback image hoặc fallback UI.

* **Event thiếu optional fields**: Nếu thiếu optional data như required skills hoặc organization logo, UI không được crash.

* **Apply button bị bấm nhiều lần**: UC09 chỉ điều hướng, không tạo application trực tiếp.

* **User không phải Volunteer bấm Apply**: Hệ thống không được submit application trong UC09; quyền apply sẽ được xử lý ở Authentication/UC12.

---

## Requirements

### Functional Requirements

* **FR-001**: THE system SHALL allow Guest to view public Event Detail.

* **FR-002**: THE system SHALL allow authenticated Volunteer to view public Event Detail.

* **FR-003**: THE system SHALL NOT require login only for viewing public Event Detail.

* **FR-004**: THE system SHALL display Event Detail only when the event is public/discoverable.

* **FR-005**: THE system SHALL NOT display Event Detail for soft-deleted events.

* **FR-006**: THE system SHALL NOT display Event Detail for draft events.

* **FR-007**: THE system SHOULD NOT display Event Detail for archived, cancelled or completed events in the first version.

* **FR-008**: THE system SHALL display event title.

* **FR-009**: THE system SHALL display event description.

* **FR-010**: THE system SHOULD display event image or thumbnail if available.

* **FR-011**: THE system SHALL display fallback image or fallback UI when event image is missing.

* **FR-012**: THE system SHOULD display event category if available.

* **FR-013**: THE system SHOULD display event organization if available.

* **FR-014**: THE system SHALL display event date/time.

* **FR-015**: THE system SHALL display event location.

* **FR-016**: THE system SHOULD display event capacity if available.

* **FR-017**: THE system SHOULD display remaining slots if available.

* **FR-018**: THE system SHOULD display application deadline if available.

* **FR-019**: THE system SHOULD display required skills if available.

* **FR-020**: THE system SHOULD display event availability/applyable status if available.

* **FR-021**: THE system SHALL provide action to go back to Event List.

* **FR-022**: THE system MAY provide Apply entry point on Event Detail.

* **FR-023**: THE system SHALL NOT create application directly in UC09.

* **FR-024**: WHEN Volunteer clicks Apply entry point, THE system SHALL navigate to UC12 — Apply Event if the event is eligible.

* **FR-025**: WHEN Guest clicks Apply entry point, THE system SHALL require login/register or navigate to Authentication flow.

* **FR-026**: THE system SHALL show that event is full when remaining slots are zero or capacity is reached.

* **FR-027**: THE system SHALL show that event is no longer open for application when application deadline has passed.

* **FR-028**: THE system SHALL display loading state while Event Detail data is being loaded.

* **FR-029**: THE system SHALL display not found state when event does not exist.

* **FR-030**: THE system SHALL display unavailable state when event is not public/discoverable.

* **FR-031**: THE system SHALL display error state when Event Detail cannot be loaded.

* **FR-032**: THE system SHALL NOT expose Staff-only event management actions in UC09.

* **FR-033**: THE system SHALL NOT expose Edit Event/Delete Event actions in UC09.

* **FR-034**: THE system SHALL NOT handle Search Event in UC09.

* **FR-035**: THE system SHALL NOT handle Filter Event in UC09.

* **FR-036**: THE system SHALL NOT handle Applied Events in UC09.

* **FR-037**: THE system SHALL NOT handle Cancel Application in UC09.

* **FR-038**: THE system SHALL NOT handle Submit Feedback in UC09.

* **FR-039**: THE system SHALL NOT handle View Certificates or Download Certificate in UC09.

* **FR-040**: THE system SHALL NOT rely only on frontend visibility rules. Backend/API must also protect non-public event detail data.

* **FR-041**: THE system SHALL treat UC09 as a separate Event Detail page, but connected to UC08/UC10/UC11 as entry points and UC12 as next flow.

---

### Key Entities

* **Guest**: Unauthenticated user. Guest can view public Event Detail but cannot submit application.

* **Volunteer**: Authenticated user with role `VOLUNTEER`. Volunteer can view public Event Detail and proceed to Apply Event if eligible.

* **Event**: Volunteer event created/managed by Staff module and displayed publicly when eligible.

* **Event Detail**: Full public detail view of one event.

* **Public Event**: Event that is allowed to be viewed by Guest and Volunteer.

* **Event Status**: State of event such as public/active, draft, archived, cancelled, completed or deleted.

* **Application Deadline**: Last time Volunteer can apply for the event.

* **Capacity**: Maximum number of Volunteers that the event can accept.

* **Remaining Slots**: Number of available slots left for Volunteers.

* **Organization**: Organization responsible for the event.

* **Category**: Category/type of event.

* **Skill**: Skill required or recommended for the event.

* **Apply Entry Point**: Button/action that navigates to UC12 — Apply Event.

* **Not Found State**: UI state shown when event cannot be found.

* **Unavailable State**: UI state shown when event exists but is not public or cannot be viewed.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: Guest can open public Event Detail without logging in.

* **SC-002**: Volunteer can open public Event Detail after logging in.

* **SC-003**: Non-public, soft-deleted or draft events are not displayed to Guest/Volunteer.

* **SC-004**: Event Detail displays core event information including title, description, time and location.

* **SC-005**: Event Detail displays category, organization, capacity, remaining slots, deadline and required skills when data is available.

* **SC-006**: Event Detail provides clear fallback when image is missing.

* **SC-007**: Event Detail shows loading state while data is being loaded.

* **SC-008**: Event Detail shows not found or unavailable state for invalid/non-public events.

* **SC-009**: Event Detail shows error state when data cannot be loaded.

* **SC-010**: Apply entry point does not create an application directly in UC09.

* **SC-011**: Volunteer clicking Apply is routed to UC12 — Apply Event.

* **SC-012**: Guest clicking Apply is routed to login/register or Authentication flow.

* **SC-013**: Event full or past deadline is clearly shown as not normally applyable.

* **SC-014**: UC09 does not expose Staff-only management actions such as Add/Edit/Delete Event.

---

## Assumptions

* **A-001**: Guest is not stored as a database role.

* **A-002**: Database roles are `VOLUNTEER`, `STAFF`, `MANAGER`, and `ADMIN`.

* **A-003**: Guest can view public Event Detail.

* **A-004**: Volunteer can view public Event Detail.

* **A-005**: UC09 is usually opened from UC08 Event List, UC10 Search Event or UC11 Filter Event.

* **A-006**: UC09 is a separate Event Detail page.

* **A-007**: UC09 does not submit application directly.

* **A-008**: Apply Event is handled by UC12.

* **A-009**: Guest who wants to apply must login/register first.

* **A-010**: Volunteer can proceed to UC12 from Event Detail if event is eligible.

* **A-011**: Duplicate application, application deadline and capacity must be finally enforced by UC12/backend.

* **A-012**: UC09 may show applyable/not applyable status for user clarity.

* **A-013**: Event data is created/managed by Member 3 Staff module.

* **A-014**: Category and Skill data are managed by Member 4.

* **A-015**: Organization data is managed by Member 5.

* **A-016**: Mock data can be used temporarily before final API/data contract is ready.

* **A-017**: Mobile app support is out of scope. Feature targets web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC09 — View Event Detail và KHÔNG được implement trong use case này:

* View Event List full flow
* Search Event
* Filter Event
* Apply Event submission
* Application form
* Duplicate application validation as final authority
* Apply deadline validation as final authority
* Capacity validation as final authority
* View Applied Events
* Cancel Application
* View Volunteer History
* Submit Feedback
* View Certificates
* Download Certificate
* Attendance Check
* Attendance Management
* Add Event
* Edit Event
* Delete Event
* Application approval/rejection
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

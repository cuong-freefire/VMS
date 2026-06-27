# Feature Specification: Volunteer Event Detail

**Feature Branch**: `feat/volunteer-event-detail`

**Created**: 2026-06-27

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là Guest hoặc Volunteer của VMS, tôi muốn xem chi tiết một sự kiện tình nguyện để hiểu đầy đủ thông tin event trước khi quyết định đăng nhập hoặc đăng ký tham gia."

---

## User Scenarios & Testing

### User Story 1 - Guest xem chi tiết event công khai (Priority: P1)

Là Guest chưa đăng nhập, tôi muốn xem chi tiết một event công khai để hiểu event trước khi quyết định đăng ký tài khoản hoặc đăng nhập.

**Why this priority**: Guest là nguồn người dùng đầu vào của hệ thống. Nếu Guest không xem được Event Detail, họ khó hiểu event và khó chuyển đổi thành Volunteer.

**Independent Test**: Có thể test độc lập bằng cách mở Event Detail page khi chưa đăng nhập và kiểm tra event public được hiển thị.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest chưa đăng nhập, **And** event là public/discoverable, **When** người dùng mở Event Detail page, **Then** hệ thống hiển thị chi tiết event.

2. **Given** người dùng là Guest, **When** Event Detail được hiển thị, **Then** hệ thống không yêu cầu login chỉ để xem chi tiết event public.

3. **Given** người dùng là Guest, **When** người dùng muốn apply event từ Event Detail, **Then** hệ thống yêu cầu đăng nhập hoặc điều hướng sang Authentication flow.

4. **Given** người dùng là Guest, **When** người dùng xem Event Detail, **Then** hệ thống không tạo application mới.

---

### User Story 2 - Volunteer xem chi tiết event (Priority: P1)

Là Volunteer đã đăng nhập, tôi muốn xem đầy đủ thông tin event để quyết định có đăng ký tham gia hay không.

**Why this priority**: Volunteer là actor chính của Volunteer Event Module. Volunteer cần xem đủ thông tin trước khi apply.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập bằng tài khoản Volunteer, mở Event Detail của một event public và kiểm tra dữ liệu hiển thị.

**Acceptance Scenarios**:

1. **Given** người dùng là Volunteer đã đăng nhập, **And** event là public/discoverable, **When** người dùng mở Event Detail page, **Then** hệ thống hiển thị chi tiết event.

2. **Given** người dùng là Volunteer, **When** Event Detail được hiển thị, **Then** hệ thống hiển thị thông tin đầy đủ hơn Event Card ở Event Discovery.

3. **Given** người dùng là Volunteer, **When** người dùng muốn đăng ký tham gia, **Then** hệ thống cung cấp Apply entry point để đi sang Apply Event flow.

4. **Given** người dùng là Volunteer, **When** người dùng bấm Apply entry point, **Then** hệ thống điều hướng sang feature `003-volunteer-event-application` hoặc apply route tương ứng.

---

### User Story 3 - Hiển thị thông tin chi tiết của event (Priority: P1)

Là Guest hoặc Volunteer, tôi muốn xem thông tin chi tiết của event như mô tả, thời gian, địa điểm, tổ chức, category, skill yêu cầu, capacity và deadline.

**Why this priority**: Event Detail phải giúp người dùng hiểu rõ event trước khi quyết định apply.

**Independent Test**: Có thể test độc lập bằng cách mở Event Detail và kiểm tra các field chính được hiển thị.

**Acceptance Scenarios**:

1. **Given** event có title, **When** Event Detail được hiển thị, **Then** hệ thống hiển thị event title.

2. **Given** event có description, **When** Event Detail được hiển thị, **Then** hệ thống hiển thị mô tả event.

3. **Given** event có image/thumbnail, **When** Event Detail được hiển thị, **Then** hệ thống hiển thị image/thumbnail.

4. **Given** event không có image/thumbnail, **When** Event Detail được hiển thị, **Then** hệ thống hiển thị placeholder hoặc fallback layout ổn định.

5. **Given** event có category, **When** Event Detail được hiển thị, **Then** hệ thống hiển thị category.

6. **Given** event có organization, **When** Event Detail được hiển thị, **Then** hệ thống hiển thị organization.

7. **Given** event có start time và end time, **When** Event Detail được hiển thị, **Then** hệ thống hiển thị thời gian event.

8. **Given** event có location, **When** Event Detail được hiển thị, **Then** hệ thống hiển thị địa điểm event.

9. **Given** event có capacity hoặc remaining slots, **When** Event Detail được hiển thị, **Then** hệ thống hiển thị số lượng tối đa và số chỗ còn lại nếu dữ liệu có sẵn.

10. **Given** event có application deadline, **When** Event Detail được hiển thị, **Then** hệ thống hiển thị hạn đăng ký.

11. **Given** event có required skills, **When** Event Detail được hiển thị, **Then** hệ thống hiển thị danh sách kỹ năng yêu cầu hoặc khuyến nghị.

---

### User Story 4 - Hiển thị trạng thái applyable của event (Priority: P1)

Là Volunteer, tôi muốn biết event còn đăng ký được hay không trước khi bấm Apply.

**Why this priority**: Docs mới chốt các rule quan trọng: Volunteer chỉ được apply một lần cho mỗi event, không thể apply khi quá deadline hoặc event đã đủ chỗ. Event Detail cần hiển thị thông tin hỗ trợ quyết định, dù rule chặn cuối cùng nằm ở Apply Event/backend.

**Independent Test**: Có thể test độc lập bằng cách mở Event Detail với nhiều trạng thái event khác nhau và kiểm tra message/nút Apply.

**Acceptance Scenarios**:

1. **Given** event còn public, chưa full và chưa qua deadline, **When** Volunteer mở Event Detail, **Then** hệ thống có thể hiển thị Apply entry point.

2. **Given** event đã full, **When** Volunteer mở Event Detail, **Then** hệ thống hiển thị rõ event đã đủ chỗ và không thể apply.

3. **Given** event đã qua application deadline, **When** Volunteer mở Event Detail, **Then** hệ thống hiển thị rõ event đã hết hạn đăng ký và không thể apply.

4. **Given** Volunteer đã apply event đó nếu dữ liệu có sẵn, **When** Volunteer mở Event Detail, **Then** hệ thống có thể hiển thị trạng thái đã apply hoặc hướng sang Applied Events.

5. **Given** event không đủ điều kiện apply, **When** người dùng xem Event Detail, **Then** hệ thống không được tạo application mới trong feature này.

---

### User Story 5 - Chỉ hiển thị Event Detail hợp lệ/public (Priority: P1)

Là hệ thống, tôi cần đảm bảo Event Detail không hiển thị các event nội bộ hoặc không còn khả dụng cho Guest/Volunteer.

**Why this priority**: Event Detail có thể được truy cập trực tiếp bằng URL. Hệ thống phải chặn event không public hoặc đã bị xóa.

**Independent Test**: Có thể test độc lập bằng cách mở detail route của event draft, soft-deleted, archived, cancelled hoặc không tồn tại.

**Acceptance Scenarios**:

1. **Given** event không tồn tại, **When** người dùng mở Event Detail URL, **Then** hệ thống hiển thị not found hoặc unavailable state.

2. **Given** event đã soft delete, **When** người dùng mở Event Detail URL, **Then** hệ thống không hiển thị detail public.

3. **Given** event là draft, **When** người dùng mở Event Detail URL, **Then** hệ thống không hiển thị detail public.

4. **Given** event đã archived, **When** người dùng mở Event Detail URL, **Then** hệ thống không hiển thị detail public trong bản đầu.

5. **Given** event đã cancelled, **When** người dùng mở Event Detail URL, **Then** hệ thống không hiển thị detail public trong bản đầu.

6. **Given** event đã completed, **When** người dùng mở Event Detail URL từ public discovery, **Then** hệ thống không ưu tiên hiển thị trong public Event Detail bản đầu.

---

### User Story 6 - Điều hướng từ Event Detail (Priority: P2)

Là Guest hoặc Volunteer, tôi muốn có các hành động điều hướng rõ ràng từ Event Detail để quay lại danh sách hoặc tiếp tục apply nếu phù hợp.

**Why this priority**: Event Detail là điểm trung gian giữa Event Discovery và Apply Event. Điều hướng rõ ràng giúp người dùng không bị kẹt ở trang detail.

**Independent Test**: Có thể test độc lập bằng cách mở Event Detail và kiểm tra các action điều hướng.

**Acceptance Scenarios**:

1. **Given** người dùng đang ở Event Detail, **When** người dùng chọn Back to Event List, **Then** hệ thống điều hướng về Event Discovery.

2. **Given** người dùng là Volunteer và event còn apply được, **When** người dùng chọn Apply, **Then** hệ thống điều hướng sang Apply Event flow.

3. **Given** người dùng là Guest và chọn Apply, **When** hệ thống xử lý action, **Then** hệ thống yêu cầu login/register trước khi apply.

4. **Given** event không còn apply được, **When** Event Detail được hiển thị, **Then** Apply action bị ẩn, disable hoặc được thay bằng message phù hợp.

---

### User Story 7 - Loading, unavailable và error states (Priority: P2)

Là người dùng, tôi muốn hệ thống hiển thị rõ trạng thái đang tải, event không khả dụng hoặc lỗi để không bị nhầm rằng trang bị hỏng.

**Why this priority**: Event Detail được load theo event id/slug. Khi dữ liệu chậm, sai URL hoặc lỗi server, UI cần phản hồi rõ ràng.

**Independent Test**: Có thể test độc lập bằng cách mô phỏng loading, not found/unavailable và error states.

**Acceptance Scenarios**:

1. **Given** Event Detail đang tải dữ liệu, **When** người dùng mở trang, **Then** hệ thống hiển thị loading state.

2. **Given** event không tồn tại hoặc không public, **When** người dùng mở detail URL, **Then** hệ thống hiển thị not found hoặc unavailable state.

3. **Given** Event Detail data không tải được, **When** hệ thống gặp lỗi, **Then** hệ thống hiển thị error state dễ hiểu và không làm crash trang.

---

## Edge Cases

* **Guest mở Event Detail public**: WHEN Guest mở Event Detail của event public, THE system SHALL hiển thị chi tiết event.

* **Volunteer mở Event Detail public**: WHEN Volunteer mở Event Detail của event public, THE system SHALL hiển thị chi tiết event.

* **Guest bấm Apply**: WHEN Guest bấm Apply entry point, THE system SHALL yêu cầu login/register hoặc điều hướng sang Authentication flow.

* **Volunteer bấm Apply**: WHEN Volunteer bấm Apply entry point, THE system SHALL điều hướng sang Apply Event feature.

* **Event không tồn tại**: WHEN event id/slug không tồn tại, THE system SHALL hiển thị not found/unavailable state.

* **Event draft**: WHERE event is draft, THE system SHALL not show public Event Detail.

* **Event soft-deleted**: WHERE event is soft-deleted, THE system SHALL not show public Event Detail.

* **Event archived**: WHERE event is archived, THE system SHALL not show public Event Detail in the first version.

* **Event cancelled**: WHERE event is cancelled, THE system SHALL not show public Event Detail in the first version.

* **Event completed**: WHERE event is completed, THE system SHALL not prioritize showing it in public Event Detail first version.

* **Event full**: WHERE event is full but still public, THE system MAY show Event Detail but SHALL clearly show it cannot be applied to.

* **Application deadline passed**: WHERE application deadline has passed, THE system MAY show Event Detail if public, but SHALL clearly show application is closed.

* **Volunteer already applied**: WHERE Volunteer already applied if data is available, THE system MAY show already applied status or link to Applied Events.

* **Event image missing**: WHERE event image/thumbnail is missing, THE system SHALL show placeholder or fallback layout.

* **Required skills missing**: WHERE event has no required skills, THE system SHALL keep layout stable and may show no skills required.

* **Organization data missing**: WHERE organization data is missing, THE system SHALL keep Event Detail usable and avoid crashing.

* **Data loading failed**: WHEN Event Detail cannot be loaded, THE system SHALL show error state.

---

## Requirements

### Functional Requirements

* **FR-001**: THE system SHALL allow Guest users to view public Event Detail.

* **FR-002**: THE system SHALL allow authenticated Volunteer users to view public Event Detail.

* **FR-003**: THE system SHALL NOT require login only for viewing public Event Detail.

* **FR-004**: THE system SHALL display only public/discoverable event detail to Guest and Volunteer.

* **FR-005**: THE system SHALL NOT display draft event detail publicly.

* **FR-006**: THE system SHALL NOT display soft-deleted event detail publicly.

* **FR-007**: THE system SHALL NOT display archived event detail publicly in the first version.

* **FR-008**: THE system SHALL NOT display cancelled event detail publicly in the first version.

* **FR-009**: THE system SHALL NOT prioritize displaying completed event detail publicly in the first version.

* **FR-010**: THE system SHALL show not found/unavailable state when event does not exist or is not public.

* **FR-011**: Event Detail SHALL display event title.

* **FR-012**: Event Detail SHALL display event description.

* **FR-013**: Event Detail SHOULD display event image/thumbnail if available.

* **FR-014**: IF event image/thumbnail is missing, THE system SHALL display placeholder or fallback layout.

* **FR-015**: Event Detail SHALL display category.

* **FR-016**: Event Detail SHOULD display organization if available.

* **FR-017**: Event Detail SHALL display event date/time.

* **FR-018**: Event Detail SHALL display location.

* **FR-019**: Event Detail SHOULD display capacity and remaining slots if available.

* **FR-020**: Event Detail SHOULD display application deadline if available.

* **FR-021**: Event Detail SHOULD display required skills if available.

* **FR-022**: Event Detail SHALL provide View/Back navigation to Event Discovery.

* **FR-023**: Event Detail SHOULD provide Apply entry point when event can be applied to.

* **FR-024**: WHEN Guest clicks Apply entry point, THE system SHALL require login/register or redirect to Authentication flow.

* **FR-025**: WHEN Volunteer clicks Apply entry point, THE system SHALL navigate to Apply Event flow.

* **FR-026**: THE system SHALL NOT create application in this feature.

* **FR-027**: THE system SHALL NOT submit application in this feature.

* **FR-028**: THE system SHALL NOT cancel application in this feature.

* **FR-029**: THE system SHALL NOT display Applied Events list in this feature.

* **FR-030**: THE system SHALL NOT display Volunteer History in this feature.

* **FR-031**: THE system SHALL NOT create, edit, or delete events in this feature.

* **FR-032**: THE system SHALL show clearly when event is full if this event is displayed.

* **FR-033**: THE system SHALL show clearly when application deadline has passed if this event is displayed.

* **FR-034**: THE system MAY show already applied status if current Volunteer application data is available.

* **FR-035**: THE system SHALL show loading state while event detail is being loaded.

* **FR-036**: THE system SHALL show unavailable/not found state when event cannot be shown.

* **FR-037**: THE system SHALL show understandable error state when event detail cannot be loaded.

* **FR-038**: THE system SHALL treat event status, visibility, capacity, remaining slots and application deadline as shared data owned by Staff/Event Management until final API/data contracts are approved.

* **FR-039**: THE system SHALL treat category, skill and organization data as shared data owned by related management modules until final API/data contracts are approved.

---

### Key Entities

* **Guest**: Unauthenticated user. Guest is not stored as a database role and can view public Event Detail.

* **Volunteer**: Authenticated user with role `VOLUNTEER`.

* **Event**: Volunteer event shown in Event Detail if it is public/discoverable.

* **Event Detail**: Full public detail page of an event.

* **Event Summary**: Short event information from Event Discovery. Event Detail contains more information than Event Summary.

* **Apply Entry Point**: Button or action that sends user to Apply Event flow. It does not create application in this feature.

* **Application Deadline**: Deadline for Volunteer to apply to the event.

* **Capacity**: Maximum number of Volunteers that an event can accept.

* **Remaining Slots**: Number of available slots left for application.

* **Required Skills**: Skills required or recommended for joining the event.

* **Category**: Event classification data managed by Manager Module.

* **Organization**: Organization related to the event.

* **Public/Discoverable Event**: Event that Guest and Volunteer can view.

* **Soft-deleted Event**: Event that exists in database but should not be shown publicly.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: Guest users can open public Event Detail without logging in.

* **SC-002**: Volunteer users can open public Event Detail after logging in.

* **SC-003**: Draft, soft-deleted, archived and cancelled events are not displayed in public Event Detail first version.

* **SC-004**: Event Detail displays required fields: title, description, category, date/time and location.

* **SC-005**: Event Detail displays organization, image, capacity, remaining slots, deadline and required skills when data is available.

* **SC-006**: Event without image still renders stable layout with placeholder or fallback.

* **SC-007**: Full event is shown as not applyable if displayed.

* **SC-008**: Event after application deadline is shown as not applyable if displayed.

* **SC-009**: Guest clicking Apply is required to login/register.

* **SC-010**: Volunteer clicking Apply is navigated to Apply Event flow.

* **SC-011**: Event Detail does not create or submit application.

* **SC-012**: Event Detail does not cancel application, show Applied Events, show Volunteer History, submit feedback or show certificates.

* **SC-013**: Loading state appears while Event Detail is loading.

* **SC-014**: Not found/unavailable state appears when event cannot be shown.

* **SC-015**: Error state appears when Event Detail cannot be loaded.

---

## Assumptions

* **A-001**: Guest is not stored as a database role.

* **A-002**: Database roles are `VOLUNTEER`, `STAFF`, `MANAGER`, and `ADMIN`.

* **A-003**: Event Detail belongs to Member 2 — Volunteer Event Module.

* **A-004**: Event Detail corresponds to UC09 — View Event Detail.

* **A-005**: Guest can view public Event Detail.

* **A-006**: Volunteer can view public Event Detail.

* **A-007**: Event Detail is opened from Event Discovery using View Detail.

* **A-008**: Event Detail only displays public/discoverable event data.

* **A-009**: Draft, soft-deleted, archived and cancelled events are hidden from public Event Detail in the first version.

* **A-010**: Completed events are not prioritized in public Event Detail first version.

* **A-011**: Full events may still have public detail, but cannot be applied to.

* **A-012**: Events after application deadline may still have public detail, but cannot be applied to.

* **A-013**: Apply action from Event Detail is only an entry point.

* **A-014**: Apply Event submission is handled by `003-volunteer-event-application`.

* **A-015**: Guest clicking Apply should be redirected to login/register or shown login required state.

* **A-016**: Volunteer clicking Apply should go to Apply Event flow.

* **A-017**: Duplicate application, deadline check and capacity check must be finally enforced in Apply Event/backend.

* **A-018**: Category, skill and organization data are owned by related management modules.

* **A-019**: Event data is created and managed by Staff Module.

* **A-020**: Mock data can be used temporarily if API/data are not ready.

* **A-021**: Mobile app support is out of scope. Feature targets web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của Volunteer Event Detail và KHÔNG được implement trong feature này:

* Event List
* Search Event
* Filter Event
* Apply Event submission
* Application form
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
* Staff Add Event
* Staff Edit Event
* Staff Delete Event
* Staff Application List
* Staff Application Detail
* Approve Application
* Reject Application
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

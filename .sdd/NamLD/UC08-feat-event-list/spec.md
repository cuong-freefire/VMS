# Feature Specification: View Event List

**Feature Branch**: `feat/event-list`

**Created**: 2026-06-27

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là Guest hoặc Volunteer, tôi muốn xem danh sách các sự kiện tình nguyện công khai để tìm sự kiện phù hợp trước khi xem chi tiết hoặc đăng ký tham gia."

---

## User Scenarios & Testing

### User Story 1 - Guest xem danh sách event công khai (Priority: P1)

Là Guest chưa đăng nhập, tôi muốn xem danh sách các event công khai để tìm hiểu các cơ hội tình nguyện trước khi quyết định đăng nhập hoặc đăng ký tài khoản.

**Why this priority**: Event List là entry point công khai quan trọng của hệ thống. Guest cần xem được danh sách event mà không bị yêu cầu login chỉ để khám phá nội dung.

**Independent Test**: Có thể test độc lập bằng cách mở Event List khi chưa đăng nhập và kiểm tra rằng chỉ event public/discoverable được hiển thị.

**Acceptance Scenarios**:

1. **Given** người dùng chưa đăng nhập, **When** người dùng mở Event List, **Then** hệ thống hiển thị danh sách event công khai.

2. **Given** event có trạng thái public/discoverable, **When** Guest mở Event List, **Then** event đó có thể xuất hiện trong danh sách.

3. **Given** event ở trạng thái draft, archived, cancelled, completed hoặc soft-deleted, **When** Guest mở Event List, **Then** event đó không xuất hiện trong danh sách public ban đầu.

4. **Given** Guest đang xem Event List, **When** Guest muốn apply event, **Then** UC08 không submit application và flow apply thuộc UC12.

---

### User Story 2 - Volunteer xem danh sách event công khai (Priority: P1)

Là Volunteer đã đăng nhập, tôi muốn xem danh sách các event công khai để chọn event phù hợp và đi tiếp sang trang chi tiết nếu quan tâm.

**Why this priority**: Volunteer là actor chính của nhóm use case NamLD. Volunteer cần có cùng khả năng xem public Event List như Guest, nhưng có thể tiếp tục sang các flow khác sau khi xem detail.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập với role `VOLUNTEER`, mở Event List và kiểm tra danh sách event public.

**Acceptance Scenarios**:

1. **Given** người dùng đã đăng nhập với role `VOLUNTEER`, **When** người dùng mở Event List, **Then** hệ thống hiển thị danh sách event công khai.

2. **Given** Volunteer đang xem Event List, **When** event không còn public hoặc đã bị soft delete, **Then** event đó không được hiển thị.

3. **Given** Volunteer thấy một event phù hợp, **When** Volunteer click event item hoặc View Detail, **Then** hệ thống điều hướng sang UC09 - View Event Detail.

4. **Given** Volunteer đang ở UC08, **When** Volunteer muốn apply event, **Then** hệ thống không submit application trong UC08.

---

### User Story 3 - Hiển thị event card/list item (Priority: P1)

Là Guest hoặc Volunteer, tôi muốn mỗi event trong danh sách hiển thị thông tin tóm tắt đủ rõ để quyết định có xem chi tiết hay không.

**Why this priority**: Event List không phải trang chi tiết. Mỗi item cần hiển thị thông tin ngắn gọn nhưng đủ để người dùng scan, so sánh và chọn event.

**Independent Test**: Có thể test độc lập bằng cách load Event List với nhiều event có dữ liệu đầy đủ, thiếu ảnh, thiếu optional field và kiểm tra UI vẫn ổn định.

**Acceptance Scenarios**:

1. **Given** event có title, **When** event item được hiển thị, **Then** hệ thống hiển thị title rõ ràng.

2. **Given** event có thumbnail hoặc image, **When** event item được hiển thị, **Then** hệ thống hiển thị hình ảnh đó.

3. **Given** event không có thumbnail hoặc image, **When** event item được hiển thị, **Then** hệ thống hiển thị fallback hoặc placeholder phù hợp.

4. **Given** event có organization, category, date/time và location, **When** event item được hiển thị, **Then** hệ thống hiển thị các thông tin tóm tắt này nếu dữ liệu có sẵn.

5. **Given** event có dữ liệu capacity hoặc remaining slots, **When** event item được hiển thị, **Then** hệ thống có thể hiển thị trạng thái sức chứa hoặc số slot còn lại.

6. **Given** event có short description hoặc mô tả tóm tắt, **When** event item được hiển thị, **Then** hệ thống có thể hiển thị đoạn mô tả ngắn nếu phù hợp với layout.

---

### User Story 4 - Điều hướng sang Event Detail (Priority: P1)

Là Guest hoặc Volunteer, tôi muốn click vào một event item hoặc View Detail để xem thông tin đầy đủ của event đó.

**Why this priority**: UC08 là danh sách tóm tắt. Full detail thuộc UC09, nên Event List cần có entry point rõ ràng sang View Event Detail.

**Independent Test**: Có thể test độc lập bằng cách click một event item trong Event List và kiểm tra hệ thống điều hướng sang màn UC09.

**Acceptance Scenarios**:

1. **Given** event item đang hiển thị trong Event List, **When** người dùng click event item, **Then** hệ thống điều hướng sang UC09 - View Event Detail.

2. **Given** event item có action View Detail, **When** người dùng click View Detail, **Then** hệ thống mở detail của đúng event.

3. **Given** người dùng đang ở UC08, **When** event detail cần hiển thị mô tả đầy đủ, thông tin apply hoặc dữ liệu chi tiết, **Then** nội dung đó thuộc UC09, không thuộc UC08.

4. **Given** user click event nhưng event không còn available, **When** hệ thống xử lý điều hướng, **Then** hệ thống hiển thị unavailable/not found state theo rule của UC09 hoặc Event Detail flow.

---

### User Story 5 - UC08 dùng chung màn với UC10 và UC11 (Priority: P2)

Là team phát triển, tôi muốn UC08, UC10 và UC11 dùng chung một Event List screen để tránh tạo nhiều màn rời rạc cho cùng một trải nghiệm khám phá event.

**Why this priority**: Search và filter là hành vi nằm trong Event List screen. Tách UC để rõ tài liệu, nhưng implementation nên dùng chung page, shared list service, search bar và filter panel.

**Independent Test**: Có thể review implementation để đảm bảo không tạo ba page riêng biệt không cần thiết cho UC08, UC10 và UC11.

**Acceptance Scenarios**:

1. **Given** UC08 mô tả base Event List, **When** implementation được tạo, **Then** màn Event List có thể chứa search bar của UC10 và filter panel của UC11.

2. **Given** Search Event thuộc UC10, **When** viết spec UC08, **Then** UC08 không mô tả chi tiết search algorithm hoặc search behavior.

3. **Given** Filter Event thuộc UC11, **When** viết spec UC08, **Then** UC08 không mô tả chi tiết filter rules ngoài việc xác nhận filter nằm chung màn.

4. **Given** Codex hoặc developer implement UC08, UC10 và UC11, **When** cấu trúc UI được tạo, **Then** không nên tạo page riêng cho UC10/UC11 nếu search/filter có thể nằm trong Event List screen.

---

### User Story 6 - Loading, empty, error và pagination (Priority: P2)

Là Guest hoặc Volunteer, tôi muốn Event List có trạng thái rõ ràng khi đang tải, không có dữ liệu, lỗi tải dữ liệu hoặc danh sách quá dài.

**Why this priority**: Event List là màn có thể tải dữ liệu từ API và có số lượng event lớn. UI cần xử lý trạng thái dữ liệu ổn định để tránh trải nghiệm rỗng hoặc khó hiểu.

**Independent Test**: Có thể test độc lập bằng cách mock loading, empty response, API error và nhiều event cần pagination hoặc scalable loading.

**Acceptance Scenarios**:

1. **Given** Event List đang tải dữ liệu, **When** request chưa hoàn tất, **Then** hệ thống hiển thị loading state.

2. **Given** không có event public nào, **When** Event List tải xong, **Then** hệ thống hiển thị empty state.

3. **Given** load event thất bại, **When** API hoặc data source trả lỗi, **Then** hệ thống hiển thị error state phù hợp.

4. **Given** có nhiều event, **When** người dùng xem Event List, **Then** hệ thống hỗ trợ pagination hoặc scalable loading strategy.

5. **Given** người dùng thay đổi search/filter trong màn chung, **When** danh sách được tải lại bởi UC10/UC11, **Then** UC08 vẫn chỉ chịu trách nhiệm hiển thị base list state.

---

## Edge Cases

* **Guest mở Event List**: Hệ thống cho phép xem public Event List mà không yêu cầu login.

* **Volunteer mở Event List**: Hệ thống cho phép Volunteer đã đăng nhập xem public Event List.

* **Không có event public**: Hệ thống hiển thị empty state rõ ràng.

* **Event bị draft**: Event không xuất hiện trong public Event List.

* **Event bị soft-deleted**: Event không xuất hiện trong public Event List.

* **Event bị archived/cancelled/completed**: Event không xuất hiện trong public Event List bản đầu.

* **Event thiếu thumbnail**: Hệ thống hiển thị fallback hoặc placeholder.

* **Event thiếu optional field**: Hệ thống vẫn hiển thị item ổn định, không crash layout.

* **Load event thất bại**: Hệ thống hiển thị error state và không hiển thị dữ liệu sai.

* **User click event không còn available**: Hệ thống xử lý unavailable/not found state ở Event Detail flow.

* **Search/filter được hiển thị trên cùng màn**: Search thuộc UC10 và filter thuộc UC11, không phải core behavior của UC08.

* **Guest hoặc Volunteer muốn apply từ Event List**: UC08 không submit application; Apply Event thuộc UC12.

* **Event full**: Event có thể vẫn hiển thị nếu còn public, nhưng cần thể hiện rõ trạng thái full hoặc không còn apply được nếu dữ liệu có sẵn.

* **Event đã qua application deadline**: UC08 có thể hiển thị trạng thái không còn apply được nếu dữ liệu có sẵn; rule chặn apply thuộc UC12.

---

## Requirements

### Functional Requirements

- **FR-001**: THE system SHALL allow Guest users to view the public Event List.

- **FR-002**: THE system SHALL allow authenticated users with role `VOLUNTEER` to view the public Event List.

- **FR-003**: THE system SHALL NOT require login only to view the Event List.

- **FR-004**: THE system SHALL display only public/discoverable events in the Event List.

- **FR-005**: THE system SHALL NOT display draft events in the public Event List.

- **FR-006**: THE system SHALL NOT display archived events in the public Event List in the first version.

- **FR-007**: THE system SHALL NOT display cancelled events in the public Event List in the first version.

- **FR-008**: THE system SHALL NOT display completed events in the public Event List in the first version.

- **FR-009**: THE system SHALL NOT display soft-deleted events in the public Event List.

- **FR-010**: EACH event item SHALL display the event title.

- **FR-011**: EACH event item SHOULD display event thumbnail/image when available.

- **FR-012**: WHEN event thumbnail/image is missing, THE system SHALL display fallback or placeholder content.

- **FR-013**: EACH event item SHOULD display organization information when available.

- **FR-014**: EACH event item SHOULD display category information when available.

- **FR-015**: EACH event item SHALL display event date/time.

- **FR-016**: EACH event item SHALL display event location.

- **FR-017**: EACH event item SHOULD display capacity or remaining slots when available.

- **FR-018**: EACH event item MAY display short description when available and suitable for the list layout.

- **FR-019**: THE system SHALL provide a View Detail action or clickable event item.

- **FR-020**: WHEN user selects View Detail or clicks an event item, THE system SHALL navigate to UC09 - View Event Detail.

- **FR-021**: THE system SHALL NOT display full event detail inside UC08.

- **FR-022**: THE system SHALL NOT submit an event application in UC08.

- **FR-023**: THE system SHALL treat Apply Event as UC12.

- **FR-024**: THE system SHALL treat Search Event as UC10.

- **FR-025**: THE system SHALL treat Filter Event as UC11.

- **FR-026**: THE system SHOULD implement UC08, UC10 and UC11 on the same Event List screen when practical.

- **FR-027**: THE system SHOULD NOT create separate pages for UC10 and UC11 if search/filter can be handled inside Event List.

- **FR-028**: THE system SHALL display loading state while Event List data is being loaded.

- **FR-029**: THE system SHALL display empty state when no public events are available.

- **FR-030**: THE system SHALL display error state when Event List data cannot be loaded.

- **FR-031**: THE system SHOULD support pagination or another scalable loading strategy when the number of events is large.

- **FR-032**: THE backend/API SHALL NOT return non-public events for the public Event List.

- **FR-033**: THE backend/API SHALL NOT return soft-deleted events for the public Event List.

- **FR-034**: THE system SHALL keep UC08 focused on base list display, not search algorithm, filter rule definition, apply submission or full detail display.

### Key Entities

* **Guest**: Unauthenticated user. Guest is not stored as a database role and can view public Event List.

* **Volunteer**: Authenticated user with role `VOLUNTEER`. Volunteer can view public Event List and navigate to Event Detail.

* **Event**: Volunteer event record displayed as a public/discoverable item in the list.

* **Event List**: Screen or section that displays multiple public event items.

* **Event Card / Event Item**: UI representation of one event in the list, containing summary information and entry point to detail.

* **Organization**: Organization associated with an event, displayed when available.

* **Category**: Event category displayed when available and used by UC11 for filtering.

* **Skill**: Skill data that may be shown or used by related search/filter features if event-skill data exists.

* **Event Status**: State used to decide whether an event is public/discoverable, draft, cancelled, completed or otherwise not shown.

* **Public Event**: Event allowed to appear in public Event List for Guest and Volunteer.

* **Soft-deleted Event**: Event removed from public visibility through soft delete and not shown in Event List.

* **View Detail Action**: Button or clickable behavior that routes user from UC08 to UC09.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: Guest can open Event List without login.

* **SC-002**: Volunteer can open Event List after login.

* **SC-003**: Public/discoverable events appear in Event List.

* **SC-004**: Non-public, draft, archived, cancelled, completed and soft-deleted events do not appear in the public Event List.

* **SC-005**: Each event item displays necessary summary information, including title, date/time and location.

* **SC-006**: Event item displays thumbnail/image or fallback content.

* **SC-007**: Event item displays organization, category, capacity/remaining slots or short description when those data are available.

* **SC-008**: Clicking an event item or View Detail navigates to UC09 - View Event Detail.

* **SC-009**: UC08 does not create application records.

* **SC-010**: UC08 does not show full event detail.

* **SC-011**: Search and filter are not implemented as unrelated standalone pages when they can share the Event List screen.

* **SC-012**: Loading state appears while events are being loaded.

* **SC-013**: Empty state appears when no public events are available.

* **SC-014**: Error state appears when event loading fails.

* **SC-015**: Pagination or scalable loading strategy works when the event list is large.

* **SC-016**: Backend/API does not expose non-public or soft-deleted event data through public Event List.

---

## Assumptions

* **A-001**: Guest is not stored as a database role.

* **A-002**: Database roles are `VOLUNTEER`, `STAFF`, `MANAGER`, and `ADMIN`.

* **A-003**: Guest can view public Event List.

* **A-004**: Volunteer can view public Event List.

* **A-005**: Public event is determined by event status/visibility and active flag according to the database and backend contract.

* **A-006**: Draft, archived, cancelled, completed and soft-deleted events are not displayed in the public Event List in the first version.

* **A-007**: Search Event is UC10 and is documented separately.

* **A-008**: Filter Event is UC11 and is documented separately.

* **A-009**: UC08, UC10 and UC11 share the same Event List screen during implementation when practical.

* **A-010**: Apply Event starts from UC12, usually after the user views event detail in UC09.

* **A-011**: UC08 does not submit application and does not create application records.

* **A-012**: UC08 displays summary information only; full event detail belongs to UC09.

* **A-013**: Organization, category and skill data are owned by related modules and consumed by UC08 when available.

* **A-014**: Mock data may be used temporarily before final API/data contract is ready.

* **A-015**: Feature target is the web application.

---

## Out of Scope

The following are NOT in scope for UC08 - View Event List:

* Search Event implementation detail
* Filter Event implementation detail
* Full Event Detail
* Apply Event
* View Applied Events
* Cancel Application
* Submit Feedback
* View Certificates
* Download Certificate
* Staff Add/Edit/Delete Event
* Staff Application Management
* Attendance
* Feedback Management
* Certificate Generation
* Database schema design
* Database migration
* API endpoint contract
* Backend route definition
* Final UI component architecture
* Implementation task breakdown

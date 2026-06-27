# Feature Specification: Volunteer Event Discovery

**Feature Branch**: `feat/volunteer-event-discovery`

**Created**: 2026-06-27

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là Guest hoặc Volunteer của VMS, tôi muốn xem danh sách sự kiện tình nguyện, tìm kiếm và lọc sự kiện để chọn event phù hợp và xem chi tiết."

---

## User Scenarios & Testing

### User Story 1 - Guest xem danh sách sự kiện công khai (Priority: P1)

Là Guest chưa đăng nhập, tôi muốn xem danh sách các sự kiện tình nguyện công khai để biết hệ thống đang có những event nào.

**Why this priority**: Event Discovery là luồng đầu tiên giúp người dùng tiếp cận hệ thống. Guest cần xem được event public trước khi quyết định đăng ký tài khoản hoặc đăng nhập.

**Independent Test**: Có thể test độc lập bằng cách mở Event List page khi chưa đăng nhập và kiểm tra danh sách event công khai được hiển thị.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest chưa đăng nhập, **When** người dùng mở Event List page, **Then** hệ thống hiển thị danh sách event công khai.

2. **Given** người dùng là Guest, **When** danh sách event được hiển thị, **Then** hệ thống không yêu cầu login chỉ để xem danh sách.

3. **Given** người dùng là Guest, **When** người dùng click View Detail trên một event public, **Then** hệ thống điều hướng sang Event Detail của event đó.

4. **Given** người dùng là Guest, **When** người dùng đang ở Event Discovery, **Then** hệ thống không cho submit apply event trong feature này.

---

### User Story 2 - Volunteer xem danh sách sự kiện (Priority: P1)

Là Volunteer đã đăng nhập, tôi muốn xem danh sách sự kiện tình nguyện để chọn event phù hợp với mình.

**Why this priority**: Volunteer là actor chính của Volunteer Event Module. Volunteer cần xem danh sách event trước khi xem detail hoặc apply.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập bằng tài khoản Volunteer, mở Event List page và kiểm tra danh sách event public/discoverable được hiển thị.

**Acceptance Scenarios**:

1. **Given** người dùng là Volunteer đã đăng nhập, **When** người dùng mở Event List page, **Then** hệ thống hiển thị danh sách event public/discoverable.

2. **Given** người dùng là Volunteer, **When** danh sách event được hiển thị, **Then** hệ thống hiển thị thông tin tóm tắt của từng event.

3. **Given** người dùng là Volunteer, **When** người dùng click View Detail trên một event, **Then** hệ thống điều hướng sang Event Detail của event đó.

---

### User Story 3 - Search Event bằng keyword (Priority: P1)

Là Guest hoặc Volunteer, tôi muốn tìm kiếm event bằng keyword để nhanh chóng tìm event phù hợp.

**Why this priority**: Search là một phần của Event List theo docs mới. Nếu không có search, người dùng khó tìm event khi số lượng event nhiều.

**Independent Test**: Có thể test độc lập bằng cách nhập keyword và kiểm tra danh sách event được lọc theo keyword.

**Acceptance Scenarios**:

1. **Given** Event List đang hiển thị, **When** người dùng nhập keyword trùng với event title, **Then** hệ thống hiển thị các event phù hợp.

2. **Given** Event List đang hiển thị, **When** người dùng nhập keyword trùng với location, **Then** hệ thống hiển thị các event phù hợp.

3. **Given** Event List đang hiển thị, **When** người dùng nhập keyword trùng với category, **Then** hệ thống hiển thị các event phù hợp.

4. **Given** Event List đang hiển thị, **When** người dùng nhập keyword trùng với organization, **Then** hệ thống hiển thị các event phù hợp.

5. **Given** Event List đang hiển thị, **When** người dùng nhập keyword trùng với skill, **Then** hệ thống hiển thị các event phù hợp nếu dữ liệu skill có sẵn.

6. **Given** người dùng nhập keyword không có kết quả, **When** hệ thống xử lý search, **Then** hệ thống hiển thị empty state phù hợp.

---

### User Story 4 - Filter Event theo tiêu chí (Priority: P1)

Là Guest hoặc Volunteer, tôi muốn lọc event theo category, skill, organization, location hoặc thời gian để tìm event phù hợp hơn.

**Why this priority**: Filter giúp người dùng giảm số lượng event cần xem và chọn event đúng nhu cầu.

**Independent Test**: Có thể test độc lập bằng cách chọn từng filter và kiểm tra danh sách event được cập nhật đúng.

**Acceptance Scenarios**:

1. **Given** Event List đang hiển thị, **When** người dùng chọn category filter, **Then** hệ thống chỉ hiển thị event thuộc category phù hợp.

2. **Given** Event List đang hiển thị, **When** người dùng chọn skill filter, **Then** hệ thống chỉ hiển thị event phù hợp với skill đã chọn nếu dữ liệu skill có sẵn.

3. **Given** Event List đang hiển thị, **When** người dùng chọn organization filter, **Then** hệ thống chỉ hiển thị event thuộc organization phù hợp.

4. **Given** Event List đang hiển thị, **When** người dùng nhập hoặc chọn location filter, **Then** hệ thống chỉ hiển thị event phù hợp với location.

5. **Given** Event List đang hiển thị, **When** người dùng chọn time filter, **Then** hệ thống chỉ hiển thị event phù hợp với khoảng thời gian đã chọn.

6. **Given** người dùng chọn filter không có kết quả, **When** danh sách được cập nhật, **Then** hệ thống hiển thị filter empty state.

---

### User Story 5 - Reset và kết hợp Search/Filter (Priority: P2)

Là người dùng, tôi muốn có thể kết hợp search với filter và reset điều kiện lọc để dễ thay đổi cách tìm kiếm.

**Why this priority**: Đây là UX quan trọng khi người dùng thử nhiều điều kiện tìm kiếm khác nhau.

**Independent Test**: Có thể test độc lập bằng cách nhập keyword, chọn nhiều filter, sau đó reset filter và kiểm tra danh sách.

**Acceptance Scenarios**:

1. **Given** người dùng đã nhập keyword và chọn filter, **When** danh sách được cập nhật, **Then** hệ thống áp dụng cả keyword và filter.

2. **Given** người dùng đang ở page lớn hơn 1, **When** keyword hoặc filter thay đổi, **Then** hệ thống reset pagination về page 1.

3. **Given** người dùng đã chọn filter, **When** người dùng bấm reset/clear filter, **Then** hệ thống xóa các filter đã chọn và cập nhật lại danh sách.

4. **Given** người dùng xóa keyword search, **When** search input rỗng, **Then** hệ thống hiển thị danh sách theo filter hiện tại hoặc danh sách mặc định.

---

### User Story 6 - Xem event summary trong Event List (Priority: P1)

Là Guest hoặc Volunteer, tôi muốn mỗi event trong danh sách hiển thị thông tin tóm tắt để quyết định có xem chi tiết hay không.

**Why this priority**: Event card/list item cần đủ thông tin cơ bản để người dùng nhanh chóng đánh giá event.

**Independent Test**: Có thể test độc lập bằng cách kiểm tra mỗi event card hiển thị các field summary bắt buộc.

**Acceptance Scenarios**:

1. **Given** một event xuất hiện trong danh sách, **When** event card được hiển thị, **Then** hệ thống hiển thị event title.

2. **Given** một event xuất hiện trong danh sách, **When** event card được hiển thị, **Then** hệ thống hiển thị category.

3. **Given** một event xuất hiện trong danh sách, **When** event card được hiển thị, **Then** hệ thống hiển thị organization nếu dữ liệu có sẵn.

4. **Given** một event xuất hiện trong danh sách, **When** event card được hiển thị, **Then** hệ thống hiển thị event date/time.

5. **Given** một event xuất hiện trong danh sách, **When** event card được hiển thị, **Then** hệ thống hiển thị location.

6. **Given** một event xuất hiện trong danh sách, **When** event card được hiển thị, **Then** hệ thống hiển thị capacity/remaining slot hoặc availability nếu dữ liệu có sẵn.

7. **Given** event có image/thumbnail, **When** event card được hiển thị, **Then** hệ thống hiển thị image/thumbnail.

8. **Given** event không có image/thumbnail, **When** event card được hiển thị, **Then** hệ thống hiển thị placeholder hoặc fallback layout ổn định.

---

### User Story 7 - Chỉ hiển thị event phù hợp trong discovery (Priority: P1)

Là hệ thống, tôi cần đảm bảo Event Discovery không hiển thị các event không nên public như draft, archived, deleted hoặc cancelled.

**Why this priority**: Event Discovery là trang công khai. Nếu hiển thị event nội bộ hoặc không khả dụng, người dùng sẽ hiểu nhầm và luồng nghiệp vụ bị sai.

**Independent Test**: Có thể test độc lập bằng cách tạo event với nhiều trạng thái khác nhau và kiểm tra event nào xuất hiện trong Event Discovery.

**Acceptance Scenarios**:

1. **Given** event là draft, **When** Event Discovery được hiển thị, **Then** event đó không xuất hiện.

2. **Given** event đã soft delete, **When** Event Discovery được hiển thị, **Then** event đó không xuất hiện.

3. **Given** event đã archived, **When** Event Discovery được hiển thị, **Then** event đó không xuất hiện trong bản đầu.

4. **Given** event đã cancelled, **When** Event Discovery được hiển thị, **Then** event đó không xuất hiện trong bản đầu.

5. **Given** event đã completed, **When** Event Discovery được hiển thị, **Then** event đó không xuất hiện trong bản đầu.

6. **Given** event đã full nhưng vẫn public, **When** Event Discovery được hiển thị, **Then** event có thể xuất hiện nhưng phải thể hiện rõ là đã đủ chỗ hoặc không còn apply được.

7. **Given** event đã qua deadline apply nhưng vẫn public, **When** Event Discovery được hiển thị, **Then** event có thể bị ẩn hoặc được đánh dấu không thể apply, nhưng apply action phải bị chặn ở Apply Event feature.

---

### User Story 8 - Pagination hoặc scalable loading (Priority: P2)

Là người dùng, tôi muốn danh sách event được chia trang hoặc tải hợp lý để trang không quá dài và không bị chậm.

**Why this priority**: Khi số lượng event lớn, Event List cần có pagination hoặc loading strategy để đảm bảo hiệu năng và trải nghiệm.

**Independent Test**: Có thể test độc lập bằng cách tạo nhiều event hơn page size và kiểm tra phân trang hoạt động đúng.

**Acceptance Scenarios**:

1. **Given** số lượng event lớn hơn page size, **When** Event List hiển thị, **Then** hệ thống hiển thị pagination hoặc loading strategy phù hợp.

2. **Given** người dùng chuyển sang page khác, **When** danh sách được cập nhật, **Then** hệ thống hiển thị đúng event của page đó.

3. **Given** keyword hoặc filter thay đổi, **When** danh sách được cập nhật, **Then** pagination reset về page 1.

---

### User Story 9 - Loading, Empty và Error States (Priority: P2)

Là người dùng, tôi muốn hệ thống hiển thị rõ trạng thái đang tải, không có dữ liệu hoặc lỗi để không bị nhầm rằng trang bị hỏng.

**Why this priority**: Đây là UX bắt buộc cho trang danh sách dữ liệu.

**Independent Test**: Có thể test độc lập bằng cách mô phỏng loading, empty và error states.

**Acceptance Scenarios**:

1. **Given** Event List đang tải dữ liệu, **When** người dùng mở trang, **Then** hệ thống hiển thị loading state.

2. **Given** không có event nào trong hệ thống hoặc không có event public, **When** Event List được hiển thị, **Then** hệ thống hiển thị empty state.

3. **Given** không có event nào phù hợp với keyword/filter, **When** danh sách được cập nhật, **Then** hệ thống hiển thị search/filter empty state.

4. **Given** dữ liệu Event List không tải được, **When** hệ thống gặp lỗi, **Then** hệ thống hiển thị error state dễ hiểu và không làm crash trang.

---

## Edge Cases

* **Guest chưa đăng nhập mở Event List**: WHEN Guest mở Event List, THE system SHALL hiển thị event public/discoverable.

* **Guest muốn apply từ discovery**: WHEN Guest đang ở Event Discovery, THE system SHALL không submit application trong feature này.

* **Volunteer mở Event List**: WHEN Volunteer mở Event List, THE system SHALL hiển thị event public/discoverable.

* **Keyword không có kết quả**: WHEN keyword không match event nào, THE system SHALL hiển thị empty state phù hợp.

* **Filter không có kết quả**: WHEN filter không match event nào, THE system SHALL hiển thị filter empty state.

* **Keyword và filter cùng được dùng**: WHEN user dùng cả keyword và filter, THE system SHALL áp dụng cả hai điều kiện.

* **Đổi keyword/filter khi đang ở page lớn hơn 1**: WHEN keyword/filter thay đổi, THE system SHALL reset page về page 1.

* **Event không có thumbnail**: WHERE event image/thumbnail missing, THE system SHALL hiển thị placeholder hoặc fallback layout.

* **Event draft**: WHERE event is draft, THE system SHALL not show it in Event Discovery.

* **Event soft-deleted**: WHERE event is soft-deleted, THE system SHALL not show it in Event Discovery.

* **Event archived**: WHERE event is archived, THE system SHALL not show it in Event Discovery in the first version.

* **Event cancelled**: WHERE event is cancelled, THE system SHALL not show it in Event Discovery in the first version.

* **Event completed**: WHERE event is completed, THE system SHALL not show it in Event Discovery in the first version.

* **Event full**: WHERE event is full but still public, THE system MAY show it with clear full/unavailable status.

* **Event apply deadline passed**: WHERE event application deadline has passed, THE system SHALL ensure user cannot apply in the Apply Event feature. Discovery may hide it or show it as not applyable based on final UI decision.

* **Category/skill/organization data missing**: WHERE filter metadata is missing, THE system SHALL keep Event List usable and avoid crashing.

* **Data loading failed**: WHEN Event List cannot be loaded, THE system SHALL show error state.

---

## Requirements

### Functional Requirements

* **FR-001**: THE system SHALL allow Guest users to view public Event List.

* **FR-002**: THE system SHALL allow authenticated Volunteer users to view public Event List.

* **FR-003**: THE system SHALL NOT require login only for viewing public Event List.

* **FR-004**: THE system SHALL display only public/discoverable events in Event Discovery.

* **FR-005**: THE system SHALL NOT display draft events in Event Discovery.

* **FR-006**: THE system SHALL NOT display soft-deleted events in Event Discovery.

* **FR-007**: THE system SHALL NOT display archived events in Event Discovery in the first version.

* **FR-008**: THE system SHALL NOT display cancelled events in Event Discovery in the first version.

* **FR-009**: THE system SHALL NOT display completed events in Event Discovery in the first version.

* **FR-010**: THE system MAY display full events if they are still public, but must clearly show they are full or not applyable.

* **FR-011**: THE system SHALL support keyword search in Event List.

* **FR-012**: Keyword search SHOULD match event title.

* **FR-013**: Keyword search SHOULD match location.

* **FR-014**: Keyword search SHOULD match category.

* **FR-015**: Keyword search SHOULD match organization.

* **FR-016**: Keyword search SHOULD match skill if skill data is available.

* **FR-017**: THE system SHALL support event filtering in Event List.

* **FR-018**: THE system SHOULD support filter by category/event type.

* **FR-019**: THE system SHOULD support filter by skill if skill data is available.

* **FR-020**: THE system SHOULD support filter by organization.

* **FR-021**: THE system SHOULD support filter by location.

* **FR-022**: THE system SHOULD support filter by time.

* **FR-023**: THE system MAY support filter by availability/status.

* **FR-024**: THE system SHALL allow user to clear/reset search and filter conditions.

* **FR-025**: THE system SHALL apply keyword and filter together when both are provided.

* **FR-026**: THE system SHALL reset pagination to page 1 when keyword or filter changes.

* **FR-027**: THE system SHALL display event summary for each event item/card.

* **FR-028**: Event summary SHALL include event title.

* **FR-029**: Event summary SHALL include category.

* **FR-030**: Event summary SHOULD include organization if available.

* **FR-031**: Event summary SHALL include event date/time.

* **FR-032**: Event summary SHALL include location.

* **FR-033**: Event summary SHOULD include capacity/remaining slot or availability if available.

* **FR-034**: Event summary SHOULD include image/thumbnail if available.

* **FR-035**: IF image/thumbnail is missing, THE system SHALL display placeholder or fallback layout.

* **FR-036**: THE system SHALL provide View Detail action for each event item/card.

* **FR-037**: THE system SHALL navigate to Event Detail when user selects View Detail.

* **FR-038**: THE system SHALL NOT submit event application in this feature.

* **FR-039**: THE system SHALL NOT display Applied Events list in this feature.

* **FR-040**: THE system SHALL NOT display Volunteer History in this feature.

* **FR-041**: THE system SHALL NOT create, edit, or delete events in this feature.

* **FR-042**: THE system SHALL show loading state while event data is being loaded.

* **FR-043**: THE system SHALL show empty state when no public event exists.

* **FR-044**: THE system SHALL show search/filter empty state when no event matches current conditions.

* **FR-045**: THE system SHALL show understandable error state when event data cannot be loaded.

* **FR-046**: THE system SHOULD support pagination or scalable loading strategy for Event List.

* **FR-047**: THE system SHALL treat category, skill and organization data as shared data owned by related modules until final API/data contracts are approved.

* **FR-048**: THE system SHALL treat event status, event visibility, capacity and application deadline as shared data owned by Staff/Event Management until final API/data contracts are approved.

---

### Key Entities

* **Guest**: Unauthenticated user. Guest is not stored as a database role and can only access public pages.

* **Volunteer**: Authenticated user with role `VOLUNTEER`.

* **Event**: Volunteer event shown in Event Discovery if it is public/discoverable.

* **Event List**: List of public/discoverable events displayed to Guest and Volunteer.

* **Event Summary**: Short information shown on each event item/card.

* **Search Keyword**: Text entered by user to search events.

* **Filter Criteria**: Conditions used to narrow Event List, such as category, skill, organization, location, time and availability.

* **Category**: Event classification data managed by Manager Module.

* **Skill**: Volunteer skill data managed by Manager Module and used by event requirements or filters.

* **Organization**: Organization data managed by Admin/Manager-related modules and used to show event owner/organizer.

* **Public/Discoverable Event**: Event that Guest and Volunteer can view in Event Discovery.

* **Soft-deleted Event**: Event that exists in database but should not be shown publicly.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: Guest users can open Event Discovery without logging in.

* **SC-002**: Volunteer users can open Event Discovery after logging in.

* **SC-003**: Draft, soft-deleted, archived, cancelled and completed events are not displayed in Event Discovery first version.

* **SC-004**: Event cards display required summary fields: title, category, date/time and location.

* **SC-005**: Event cards display organization, thumbnail and availability when data is available.

* **SC-006**: Search by keyword updates the Event List correctly.

* **SC-007**: Filter by category updates the Event List correctly.

* **SC-008**: Filter by skill updates the Event List correctly if skill data is available.

* **SC-009**: Filter by organization updates the Event List correctly.

* **SC-010**: Filter by location updates the Event List correctly.

* **SC-011**: Filter by time updates the Event List correctly.

* **SC-012**: User can clear/reset search and filters.

* **SC-013**: Search/filter empty state appears when no event matches.

* **SC-014**: Loading state appears while event data is loading.

* **SC-015**: Error state appears when event data cannot be loaded.

* **SC-016**: User can navigate from Event Discovery to Event Detail.

* **SC-017**: Event Discovery does not submit application, cancel application, show applied events, show volunteer history, submit feedback or show certificates.

---

## Assumptions

* **A-001**: Guest is not stored as a database role.

* **A-002**: Database roles are `VOLUNTEER`, `STAFF`, `MANAGER`, and `ADMIN`.

* **A-003**: Event List, Search Event and Filter Event are grouped into one feature: `001-volunteer-event-discovery`.

* **A-004**: Guest can view public Event List and Event Detail.

* **A-005**: Volunteer can view public Event List and Event Detail.

* **A-006**: Guest cannot apply event without login.

* **A-007**: Event Discovery does not submit application.

* **A-008**: Apply Event is handled by `003-volunteer-event-application`.

* **A-009**: Event Detail is handled by `002-volunteer-event-detail`.

* **A-010**: Event Discovery only displays public/discoverable events.

* **A-011**: Draft, soft-deleted, archived, cancelled and completed events are hidden in the first version.

* **A-012**: Full events may still be displayed if public, but cannot be applied to.

* **A-013**: Events after application deadline cannot be applied to. Discovery may hide them or mark them as not applyable depending on final UI rule.

* **A-014**: Search can match title, location, category, organization and skill.

* **A-015**: Filter can include category, skill, organization, location, time and availability/status.

* **A-016**: Category, skill and organization filter data are owned by related management modules.

* **A-017**: Event data is created and managed by Staff Module.

* **A-018**: Event Discovery should support pagination or scalable loading.

* **A-019**: When search/filter changes, pagination should reset to page 1.

* **A-020**: Mock data can be used temporarily if API/data are not ready.

* **A-021**: Mobile app support is out of scope. Feature targets web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của Volunteer Event Discovery và KHÔNG được implement trong feature này:

* Event Detail full display
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

# Feature Specification: Filter Event

**Feature Branch**: `feat/event-filter`

**Created**: 2026-06-27

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là Guest hoặc Volunteer, tôi muốn lọc danh sách sự kiện tình nguyện theo category, skill, organization, location, time hoặc availability để nhanh chóng tìm event phù hợp."

---

## User Scenarios & Testing

### User Story 1 - Guest lọc event công khai (Priority: P1)

Là Guest, tôi muốn lọc event công khai theo các tiêu chí phù hợp để tìm hiểu cơ hội tình nguyện trước khi đăng ký tài khoản hoặc đăng nhập.

**Why this priority**: Guest có thể xem danh sách event công khai. Khi có nhiều event, filter giúp Guest tìm event phù hợp nhanh hơn mà không cần đăng nhập.

**Independent Test**: Có thể test độc lập bằng cách mở Event List khi chưa đăng nhập, chọn filter và kiểm tra kết quả hiển thị.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest, **When** người dùng mở Event List và chọn một filter hợp lệ, **Then** hệ thống hiển thị danh sách event công khai thỏa filter.

2. **Given** người dùng là Guest, **When** filter match một hoặc nhiều event public, **Then** hệ thống chỉ hiển thị các event public/discoverable phù hợp.

3. **Given** người dùng là Guest, **When** filter không match event nào, **Then** hệ thống hiển thị empty state phù hợp.

4. **Given** người dùng là Guest, **When** người dùng click một event trong filter result, **Then** hệ thống điều hướng sang UC09 — View Event Detail.

5. **Given** người dùng là Guest, **When** người dùng filter event, **Then** hệ thống không yêu cầu login chỉ để filter event công khai.

---

### User Story 2 - Volunteer lọc event công khai (Priority: P1)

Là Volunteer, tôi muốn lọc event theo category, skill, organization, location, time hoặc availability để tìm event phù hợp với kỹ năng, lịch cá nhân và khu vực của tôi.

**Why this priority**: Volunteer là actor chính của module Volunteer Event. Filter giúp Volunteer tìm event phù hợp hơn thay vì phải xem toàn bộ danh sách event.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập bằng tài khoản Volunteer, chọn filter trên Event List và kiểm tra kết quả.

**Acceptance Scenarios**:

1. **Given** người dùng là Volunteer đã đăng nhập, **When** Volunteer chọn filter trên Event List, **Then** hệ thống hiển thị các event công khai phù hợp với filter.

2. **Given** Volunteer chọn category, **When** filter được áp dụng, **Then** hệ thống hiển thị các event thuộc category đó nếu dữ liệu có sẵn.

3. **Given** Volunteer chọn skill, **When** filter được áp dụng, **Then** hệ thống hiển thị các event liên quan đến skill đó nếu dữ liệu có sẵn.

4. **Given** Volunteer chọn organization hoặc location, **When** filter được áp dụng, **Then** hệ thống hiển thị các event phù hợp nếu dữ liệu có sẵn.

5. **Given** Volunteer chọn time hoặc availability/status, **When** filter được áp dụng, **Then** hệ thống hiển thị các event phù hợp nếu dữ liệu có sẵn.

---

### User Story 3 - Filter nằm chung màn Event List (Priority: P1)

Là hệ thống, tôi cần đảm bảo UC11 Filter Event được implement chung với UC08 Event List và UC10 Search Event trên cùng một màn Event List để UI và code không bị tách rời.

**Why this priority**: Team tách docs theo từng UC, nhưng UC08, UC10 và UC11 thuộc cùng một trải nghiệm người dùng. Nếu Codex tạo 3 page riêng cho list/search/filter thì sai flow và gây trùng code.

**Independent Test**: Có thể test độc lập bằng cách kiểm tra filter panel xuất hiện trong Event List page và kết quả filter dùng chung event card/list item của UC08.

**Acceptance Scenarios**:

1. **Given** người dùng mở Event List page, **When** page được hiển thị, **Then** filter panel xuất hiện trong cùng màn Event List.

2. **Given** người dùng chọn filter, **When** filter result được hiển thị, **Then** kết quả vẫn hiển thị bằng event card/list item chung của UC08.

3. **Given** UC10 Search Event cũng được implement, **When** người dùng vừa nhập keyword vừa chọn filter, **Then** search và filter hoạt động trên cùng danh sách event.

4. **Given** Codex sinh code cho UC11, **When** implementation được tạo, **Then** Codex không được tạo page riêng chỉ dành cho Filter Event.

---

### User Story 4 - Filter theo category, skill và organization (Priority: P1)

Là Guest hoặc Volunteer, tôi muốn lọc event theo category, skill và organization để tìm event đúng chủ đề, kỹ năng hoặc đơn vị tổ chức tôi quan tâm.

**Why this priority**: Category, skill và organization là các tiêu chí quan trọng giúp người dùng chọn event phù hợp. Chúng cũng liên quan trực tiếp đến dữ liệu do các module khác quản lý.

**Independent Test**: Có thể test bằng cách chọn từng filter category, skill, organization và kiểm tra kết quả event.

**Acceptance Scenarios**:

1. **Given** category data có sẵn, **When** người dùng chọn một category, **Then** hệ thống hiển thị event thuộc category đó.

2. **Given** skill data có sẵn, **When** người dùng chọn một skill, **Then** hệ thống hiển thị event liên quan đến skill đó.

3. **Given** organization data có sẵn, **When** người dùng chọn một organization, **Then** hệ thống hiển thị event thuộc organization đó.

4. **Given** category/skill/organization data chưa tải được, **When** Event List hiển thị, **Then** hệ thống không được crash và cần có fallback hoặc error state phù hợp cho filter data.

---

### User Story 5 - Filter theo location, time và availability/status (Priority: P2)

Là Guest hoặc Volunteer, tôi muốn lọc event theo địa điểm, thời gian hoặc trạng thái còn slot để chọn event phù hợp với lịch trình và khả năng tham gia.

**Why this priority**: Location, time và availability giúp người dùng tìm event thực tế hơn, nhất là khi có nhiều sự kiện ở nhiều khu vực và thời gian khác nhau.

**Independent Test**: Có thể test bằng cách chọn location/time/availability filter và kiểm tra kết quả event.

**Acceptance Scenarios**:

1. **Given** event có location data, **When** người dùng lọc theo location, **Then** hệ thống hiển thị event phù hợp với location đó.

2. **Given** event có date/time data, **When** người dùng lọc theo time, **Then** hệ thống hiển thị event phù hợp với khoảng thời gian đã chọn.

3. **Given** event có capacity hoặc remaining slots, **When** người dùng lọc theo availability, **Then** hệ thống có thể hiển thị event còn slot hoặc event phù hợp với trạng thái đã chọn.

4. **Given** người dùng lọc theo nhiều tiêu chí cùng lúc, **When** filter được áp dụng, **Then** kết quả phải thỏa tất cả tiêu chí đang active.

---

### User Story 6 - Filter kết hợp với search và pagination (Priority: P2)

Là Guest hoặc Volunteer, tôi muốn filter có thể kết hợp với keyword search để tìm event chính xác hơn.

**Why this priority**: Search và filter thường được dùng cùng nhau trên Event List. Nếu hai chức năng không phối hợp, kết quả có thể gây khó hiểu cho người dùng.

**Independent Test**: Có thể test bằng cách nhập keyword, chọn filter category/location/time và kiểm tra kết quả thỏa cả keyword lẫn filter.

**Acceptance Scenarios**:

1. **Given** người dùng nhập keyword và chọn filter, **When** kết quả được hiển thị, **Then** danh sách event phải thỏa cả keyword search và filter đang chọn.

2. **Given** người dùng đang ở page lớn hơn 1, **When** filter thay đổi, **Then** pagination nên reset về page 1.

3. **Given** người dùng xóa filter nhưng vẫn giữ keyword, **When** hệ thống cập nhật kết quả, **Then** danh sách hiển thị theo keyword hiện tại.

4. **Given** người dùng reset toàn bộ search/filter, **When** hệ thống cập nhật kết quả, **Then** Event List trở về danh sách mặc định.

---

### User Story 7 - Clear/reset filter (Priority: P2)

Là Guest hoặc Volunteer, tôi muốn có cách xóa filter đang chọn để quay lại danh sách event mặc định hoặc danh sách theo search hiện tại.

**Why this priority**: Người dùng có thể chọn nhầm filter hoặc muốn quay lại danh sách ban đầu. Nếu không có reset filter, trải nghiệm sẽ khó dùng.

**Independent Test**: Có thể test bằng cách chọn filter, sau đó clear/reset filter và kiểm tra danh sách được cập nhật đúng.

**Acceptance Scenarios**:

1. **Given** người dùng đã chọn một hoặc nhiều filter, **When** người dùng bấm Clear/Reset Filter, **Then** hệ thống xóa các filter đang chọn.

2. **Given** keyword search không active, **When** người dùng reset filter, **Then** hệ thống hiển thị danh sách event mặc định.

3. **Given** keyword search đang active, **When** người dùng reset filter, **Then** hệ thống hiển thị danh sách event theo keyword hiện tại.

4. **Given** filter được reset, **When** hệ thống cập nhật kết quả, **Then** pagination nên quay về page 1.

---

### User Story 8 - Loading, empty và error states khi filter (Priority: P2)

Là người dùng, tôi muốn thấy trạng thái rõ ràng khi filter đang tải, không có kết quả hoặc xảy ra lỗi.

**Why this priority**: Filter phụ thuộc vào dữ liệu event và dữ liệu filter như category, skill, organization. Nếu không có trạng thái rõ ràng, người dùng có thể tưởng hệ thống bị lỗi hoặc không phản hồi.

**Independent Test**: Có thể test bằng cách mock loading, no result và error states.

**Acceptance Scenarios**:

1. **Given** người dùng chọn filter, **When** hệ thống đang tải kết quả, **Then** hệ thống hiển thị loading state.

2. **Given** filter không match event nào, **When** filter hoàn tất, **Then** hệ thống hiển thị empty state phù hợp.

3. **Given** filter request thất bại, **When** lỗi xảy ra, **Then** hệ thống hiển thị error state dễ hiểu.

4. **Given** filter result có event thiếu image/thumbnail, **When** kết quả hiển thị, **Then** hệ thống vẫn hiển thị fallback image hoặc fallback UI từ Event List.

5. **Given** filter options như category/skill/organization chưa tải được, **When** Event List hiển thị, **Then** hệ thống hiển thị fallback hoặc disable filter option phù hợp.

---

## Edge Cases

* **Guest filter event**: Guest được filter event công khai mà không cần đăng nhập.

* **Volunteer filter event**: Volunteer được filter event công khai sau khi đăng nhập.

* **Không chọn filter nào**: Hệ thống hiển thị danh sách event mặc định hoặc kết quả theo keyword search hiện tại.

* **Chọn nhiều filter cùng lúc**: Kết quả phải thỏa tất cả filter đang active.

* **Filter kết hợp search**: Kết quả phải thỏa cả keyword search và filter đang chọn.

* **Filter không match event nào**: Hệ thống hiển thị empty state.

* **Filter request thất bại**: Hệ thống hiển thị error state.

* **Filter đang tải dữ liệu**: Hệ thống hiển thị loading state.

* **Filter options không tải được**: Hệ thống không được crash; filter options bị lỗi cần có fallback hoặc message phù hợp.

* **Filter result có event thiếu thumbnail**: Hệ thống dùng fallback image hoặc fallback UI.

* **Filter thay đổi khi đang ở page cao**: Pagination nên reset về page 1.

* **Reset filter khi keyword rỗng**: Hệ thống hiển thị danh sách event mặc định.

* **Reset filter khi keyword đang active**: Hệ thống giữ keyword và chỉ xóa filter.

* **Event draft match filter**: Event draft không được hiển thị trong filter result.

* **Event soft-deleted match filter**: Event soft-deleted không được hiển thị trong filter result.

* **Event archived/cancelled/completed match filter**: Bản đầu không hiển thị các event này trong filter result.

* **User click event trong filter result**: Hệ thống điều hướng sang UC09 — View Event Detail.

* **User muốn apply từ filter result**: UC11 không submit application. Apply Event thuộc UC12.

---

## Requirements

### Functional Requirements

* **FR-001**: THE system SHALL allow Guest to filter public events.

* **FR-002**: THE system SHALL allow authenticated Volunteer to filter public events.

* **FR-003**: THE system SHALL NOT require login only for filtering public events.

* **FR-004**: THE system SHALL implement Filter Event as part of the Event List page.

* **FR-005**: THE system SHALL NOT create a separate standalone page only for UC11 Filter Event.

* **FR-006**: THE system SHALL keep UC11 Filter Event integrated with UC08 View Event List.

* **FR-007**: THE system SHALL keep UC11 Filter Event compatible with UC10 Search Event on the same Event List page.

* **FR-008**: THE system SHALL provide filter UI/filter panel on Event List page.

* **FR-009**: THE system SHALL allow user to filter events by selected criteria.

* **FR-010**: THE system SHOULD support filter by category if category data is available.

* **FR-011**: THE system SHOULD support filter by skill if skill data is available.

* **FR-012**: THE system SHOULD support filter by organization if organization data is available.

* **FR-013**: THE system MAY support filter by location if location data is available.

* **FR-014**: THE system MAY support filter by time such as upcoming, this week, this month or date range if team confirms.

* **FR-015**: THE system MAY support filter by availability/status such as still open, full or has remaining slots if data is available.

* **FR-016**: THE system SHALL display filter results using the same event card/list item pattern from UC08.

* **FR-017**: THE system SHALL display only public/discoverable events in filter result.

* **FR-018**: THE system SHALL NOT display soft-deleted events in filter result.

* **FR-019**: THE system SHALL NOT display draft events in filter result.

* **FR-020**: THE system SHOULD NOT display archived, cancelled or completed events in filter result in the first version.

* **FR-021**: THE system SHALL allow user to open UC09 — View Event Detail from a filter result item.

* **FR-022**: THE system SHALL NOT display full Event Detail inside UC11.

* **FR-023**: THE system SHALL NOT submit Apply Event in UC11.

* **FR-024**: THE system SHALL NOT create application from filter result directly.

* **FR-025**: THE system SHALL keep Apply Event submission inside UC12.

* **FR-026**: THE system SHOULD combine active filters with keyword search from UC10 when both are used.

* **FR-027**: WHEN keyword and filters are both active, THE system SHALL show results that satisfy both keyword and filter conditions.

* **FR-028**: WHEN filter changes, THE system SHOULD reset pagination to page 1.

* **FR-029**: THE system SHALL provide clear/reset filter action.

* **FR-030**: WHEN filters are cleared and keyword is empty, THE system SHALL show default Event List.

* **FR-031**: WHEN filters are cleared and keyword is active, THE system SHALL keep keyword search result.

* **FR-032**: WHEN filter is loading, THE system SHALL display loading state.

* **FR-033**: WHEN filter returns no matching event, THE system SHALL display empty state.

* **FR-034**: WHEN filter fails, THE system SHALL display error state.

* **FR-035**: WHEN filter result event image is missing, THE system SHALL display fallback image or fallback UI.

* **FR-036**: WHEN filter options cannot be loaded, THE system SHALL NOT crash and SHOULD display fallback, disabled filter options or an understandable message.

* **FR-037**: THE system SHALL NOT expose Staff-only event management actions in UC11.

* **FR-038**: THE system SHALL NOT handle Add/Edit/Delete Event in UC11.

* **FR-039**: THE system SHALL NOT handle Applied Events in UC11.

* **FR-040**: THE system SHALL NOT handle Cancel Application in UC11.

* **FR-041**: THE system SHALL NOT handle Submit Feedback in UC11.

* **FR-042**: THE system SHALL NOT handle View Certificates or Download Certificate in UC11.

* **FR-043**: THE system SHALL NOT rely only on frontend filtering for non-public events. Backend/API must also protect non-public event data.

---

### Key Entities

* **Guest**: Unauthenticated user. Guest can filter public events but cannot submit application.

* **Volunteer**: Authenticated user with role `VOLUNTEER`. Volunteer can filter public events and open Event Detail.

* **Event**: Volunteer event created/managed by Staff module and displayed publicly when eligible.

* **Public Event**: Event that Guest and Volunteer are allowed to view and filter.

* **Filter Criteria**: Selected condition used to narrow down events.

* **Filter Result**: List of public events matching active filters and current keyword search if any.

* **Event List Page**: Shared page for UC08, UC10 and UC11.

* **Filter Panel**: UI component on Event List page used to select filter criteria.

* **Event Card / Event Item**: UI block used to display each event in the list or filter result.

* **Search Keyword**: Keyword from UC10 that may combine with active filters.

* **Filter State**: Current selected filter values such as category, skill, organization, location, time or availability/status.

* **Pagination State**: Current page and page size used by Event List/filter result.

* **Category**: Event category data managed by Member 4.

* **Skill**: Skill data managed by Member 4.

* **Organization**: Organization data managed by Member 5.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: Guest can filter public events without logging in.

* **SC-002**: Volunteer can filter public events after logging in.

* **SC-003**: Filter UI appears on the same Event List page used by UC08.

* **SC-004**: Codex/implementation does not create a standalone Filter Event page.

* **SC-005**: Filter results use the same event card/list item UI pattern as Event List.

* **SC-006**: Filter supports category, skill and organization when data is available.

* **SC-007**: Filter can support location, time and availability/status when data is available.

* **SC-008**: Filter result only includes public/discoverable events.

* **SC-009**: Draft and soft-deleted events never appear in filter result.

* **SC-010**: Filter can combine with active keyword search from UC10.

* **SC-011**: Pagination resets to page 1 when filter changes.

* **SC-012**: User can clear/reset active filters.

* **SC-013**: User can open Event Detail from a filter result.

* **SC-014**: Filter does not create application or submit Apply Event.

* **SC-015**: Loading, empty and error states are clearly displayed during filter flow.

---

## Assumptions

* **A-001**: Guest is not stored as a database role.

* **A-002**: Database roles are `VOLUNTEER`, `STAFF`, `MANAGER`, and `ADMIN`.

* **A-003**: Guest can filter public events.

* **A-004**: Volunteer can filter public events.

* **A-005**: UC11 Filter Event is not a standalone page.

* **A-006**: UC11 is implemented on the same Event List page as UC08 and UC10.

* **A-007**: Filter panel is part of Event List UI.

* **A-008**: Filter results reuse Event List cards/items from UC08.

* **A-009**: Filter can support category, skill and organization if data is available.

* **A-010**: Filter can support location, time and availability/status if team confirms in plan.

* **A-011**: Filter can combine with search from UC10.

* **A-012**: Filter changes should reset pagination to page 1.

* **A-013**: UC11 does not submit Apply Event.

* **A-014**: Apply Event is handled by UC12.

* **A-015**: Event Detail is handled by UC09.

* **A-016**: Event data is created/managed by Member 3 Staff module.

* **A-017**: Category and Skill data are managed by Member 4.

* **A-018**: Organization data is managed by Member 5.

* **A-019**: Mock data can be used temporarily before final API/data contract is ready.

* **A-020**: Mobile app support is out of scope. Feature targets web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC11 — Filter Event và KHÔNG được implement trong use case này:

* Standalone Filter Event page
* View Event List full flow without filter
* Search Event detailed logic
* View Event Detail full display
* Apply Event submission
* Application form
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
* Staff Application Management
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

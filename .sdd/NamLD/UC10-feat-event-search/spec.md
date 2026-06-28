# Feature Specification: Search Event

**Feature Branch**: `feat/event-search`

**Created**: 2026-06-27

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là Guest hoặc Volunteer, tôi muốn tìm kiếm sự kiện tình nguyện bằng từ khóa để nhanh chóng tìm được event phù hợp."

---

## User Scenarios & Testing

### User Story 1 - Guest tìm kiếm event công khai (Priority: P1)

Là Guest, tôi muốn tìm kiếm event công khai bằng keyword để tìm hiểu các cơ hội tình nguyện trước khi đăng ký tài khoản hoặc đăng nhập.

**Why this priority**: Guest là người dùng chưa đăng nhập nhưng vẫn cần xem và tìm event công khai. Nếu không có search, Guest phải tự xem toàn bộ danh sách event, gây khó tìm kiếm khi dữ liệu nhiều.

**Independent Test**: Có thể test độc lập bằng cách mở Event List khi chưa đăng nhập, nhập keyword và kiểm tra kết quả search.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest, **When** người dùng mở Event List và nhập keyword hợp lệ, **Then** hệ thống hiển thị danh sách event công khai phù hợp với keyword.

2. **Given** người dùng là Guest, **When** keyword match với một hoặc nhiều event public, **Then** hệ thống chỉ hiển thị các event public/discoverable phù hợp.

3. **Given** người dùng là Guest, **When** keyword không match event nào, **Then** hệ thống hiển thị empty state phù hợp.

4. **Given** người dùng là Guest, **When** người dùng click một event trong search result, **Then** hệ thống điều hướng sang UC09 — View Event Detail.

5. **Given** người dùng là Guest, **When** người dùng search event, **Then** hệ thống không yêu cầu login chỉ để search event công khai.

---

### User Story 2 - Volunteer tìm kiếm event công khai (Priority: P1)

Là Volunteer, tôi muốn tìm kiếm event theo từ khóa để nhanh chóng tìm event phù hợp với nhu cầu, kỹ năng, địa điểm hoặc tổ chức tôi quan tâm.

**Why this priority**: Volunteer là actor chính của module Volunteer Event. Search giúp Volunteer tiết kiệm thời gian và tìm được event phù hợp hơn.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập bằng tài khoản Volunteer, nhập keyword trên Event List và kiểm tra kết quả.

**Acceptance Scenarios**:

1. **Given** người dùng là Volunteer đã đăng nhập, **When** Volunteer nhập keyword trên Event List, **Then** hệ thống hiển thị các event công khai phù hợp với keyword.

2. **Given** Volunteer nhập keyword match event title, **When** search được thực hiện, **Then** event có title phù hợp được hiển thị.

3. **Given** Volunteer nhập keyword match location, **When** search được thực hiện, **Then** event có location phù hợp được hiển thị.

4. **Given** Volunteer nhập keyword match organization, category hoặc skill, **When** search được thực hiện và dữ liệu có sẵn, **Then** event phù hợp được hiển thị.

5. **Given** Volunteer click một event trong search result, **When** hệ thống xử lý, **Then** Volunteer được điều hướng sang UC09 — View Event Detail.

---

### User Story 3 - Search nằm chung màn Event List (Priority: P1)

Là hệ thống, tôi cần đảm bảo UC10 Search Event được implement chung với UC08 Event List và UC11 Filter Event trên cùng một màn Event List để UI và code không bị tách rời.

**Why this priority**: Team tách docs theo từng UC, nhưng UC08, UC10 và UC11 thuộc cùng một trải nghiệm người dùng. Nếu Codex tạo 3 page riêng cho list/search/filter thì sai flow và gây trùng code.

**Independent Test**: Có thể test độc lập bằng cách kiểm tra search bar xuất hiện trong Event List page và kết quả search dùng chung event card/list item của UC08.

**Acceptance Scenarios**:

1. **Given** người dùng mở Event List page, **When** page được hiển thị, **Then** search bar xuất hiện trong cùng màn Event List.

2. **Given** người dùng nhập keyword, **When** search result được hiển thị, **Then** kết quả vẫn hiển thị bằng event card/list item chung của UC08.

3. **Given** UC11 Filter Event cũng được implement, **When** người dùng vừa nhập keyword vừa chọn filter, **Then** search và filter hoạt động trên cùng danh sách event.

4. **Given** Codex sinh code cho UC10, **When** implementation được tạo, **Then** Codex không được tạo page riêng chỉ dành cho Search Event.

---

### User Story 4 - Xử lý keyword rỗng, khoảng trắng và không phân biệt hoa thường (Priority: P1)

Là người dùng, tôi muốn search hoạt động ổn định khi nhập keyword rỗng, có khoảng trắng hoặc khác chữ hoa/thường.

**Why this priority**: Người dùng thường nhập keyword không chuẩn tuyệt đối. Search cần dễ dùng và không gây kết quả sai vì khoảng trắng hoặc chữ hoa/thường.

**Independent Test**: Có thể test bằng các keyword như rỗng, chỉ có khoảng trắng, chữ hoa, chữ thường và keyword có khoảng trắng đầu/cuối.

**Acceptance Scenarios**:

1. **Given** người dùng nhập keyword có khoảng trắng đầu/cuối, **When** search được thực hiện, **Then** hệ thống trim keyword trước khi tìm kiếm.

2. **Given** người dùng nhập keyword rỗng, **When** search được thực hiện, **Then** hệ thống hiển thị danh sách event mặc định.

3. **Given** người dùng nhập keyword chỉ gồm khoảng trắng, **When** search được thực hiện, **Then** hệ thống xử lý như keyword rỗng.

4. **Given** event title là chữ hoa/thường khác keyword, **When** người dùng search, **Then** search không nên phân biệt hoa thường trong bản đầu.

---

### User Story 5 - Search kết hợp với filter và pagination (Priority: P2)

Là Volunteer hoặc Guest, tôi muốn search có thể kết hợp với filter để tìm event chính xác hơn.

**Why this priority**: Search và filter thường được dùng cùng nhau trên Event List. Nếu hai chức năng không phối hợp, kết quả có thể gây khó hiểu cho người dùng.

**Independent Test**: Có thể test bằng cách nhập keyword, chọn filter category/location/time và kiểm tra kết quả thỏa cả keyword lẫn filter.

**Acceptance Scenarios**:

1. **Given** người dùng nhập keyword và chọn filter, **When** kết quả được hiển thị, **Then** danh sách event phải thỏa cả keyword search và filter đang chọn.

2. **Given** người dùng đang ở page lớn hơn 1, **When** keyword thay đổi, **Then** pagination nên reset về page 1.

3. **Given** người dùng xóa keyword nhưng vẫn giữ filter, **When** hệ thống cập nhật kết quả, **Then** danh sách hiển thị theo filter hiện tại.

4. **Given** người dùng reset toàn bộ search/filter, **When** hệ thống cập nhật kết quả, **Then** Event List trở về danh sách mặc định.

---

### User Story 6 - Loading, empty và error states khi search (Priority: P2)

Là người dùng, tôi muốn thấy trạng thái rõ ràng khi search đang tải, không có kết quả hoặc xảy ra lỗi.

**Why this priority**: Search phụ thuộc vào dữ liệu event. Nếu không có trạng thái rõ ràng, người dùng có thể tưởng hệ thống bị lỗi hoặc không phản hồi.

**Independent Test**: Có thể test bằng cách mock loading, no result và error states.

**Acceptance Scenarios**:

1. **Given** người dùng nhập keyword, **When** hệ thống đang tải kết quả, **Then** hệ thống hiển thị loading state.

2. **Given** keyword không match event nào, **When** search hoàn tất, **Then** hệ thống hiển thị empty state phù hợp.

3. **Given** search request thất bại, **When** lỗi xảy ra, **Then** hệ thống hiển thị error state dễ hiểu.

4. **Given** search result có event thiếu image/thumbnail, **When** kết quả hiển thị, **Then** hệ thống vẫn hiển thị fallback image hoặc fallback UI từ Event List.

---

## Edge Cases

* **Guest search event**: Guest được search event công khai mà không cần đăng nhập.

* **Volunteer search event**: Volunteer được search event công khai sau khi đăng nhập.

* **Keyword rỗng**: Hệ thống hiển thị danh sách event mặc định.

* **Keyword chỉ có khoảng trắng**: Hệ thống trim keyword và xử lý như keyword rỗng.

* **Keyword có khoảng trắng đầu/cuối**: Hệ thống trim keyword trước khi search.

* **Keyword khác chữ hoa/thường**: Search không nên phân biệt hoa thường trong bản đầu.

* **Keyword không match event nào**: Hệ thống hiển thị empty state.

* **Search request thất bại**: Hệ thống hiển thị error state.

* **Search đang tải dữ liệu**: Hệ thống hiển thị loading state.

* **Search result có event thiếu thumbnail**: Hệ thống dùng fallback image hoặc fallback UI.

* **Search kết hợp filter**: Kết quả phải thỏa cả keyword và filter đang chọn.

* **Keyword thay đổi khi đang ở page cao**: Pagination nên reset về page 1.

* **Event draft match keyword**: Event draft không được hiển thị trong search result.

* **Event soft-deleted match keyword**: Event soft-deleted không được hiển thị trong search result.

* **Event archived/cancelled/completed match keyword**: Bản đầu không hiển thị các event này trong search result.

* **User click event trong search result**: Hệ thống điều hướng sang UC09 — View Event Detail.

* **User muốn apply từ search result**: UC10 không submit application. Apply Event thuộc UC12.

---

## Requirements

### Functional Requirements

* **FR-001**: THE system SHALL allow Guest to search public events.

* **FR-002**: THE system SHALL allow authenticated Volunteer to search public events.

* **FR-003**: THE system SHALL NOT require login only for searching public events.

* **FR-004**: THE system SHALL implement Search Event as part of the Event List page.

* **FR-005**: THE system SHALL NOT create a separate standalone page only for UC10 Search Event.

* **FR-006**: THE system SHALL keep UC10 Search Event integrated with UC08 View Event List.

* **FR-007**: THE system SHALL keep UC10 Search Event compatible with UC11 Filter Event on the same Event List page.

* **FR-008**: THE system SHALL provide a search input/search bar on Event List page.

* **FR-009**: THE system SHALL allow user to search events by keyword.

* **FR-010**: THE system SHOULD search by event title.

* **FR-011**: THE system SHOULD search by event location.

* **FR-012**: THE system MAY search by organization name if organization data is available.

* **FR-013**: THE system MAY search by category name if category data is available.

* **FR-014**: THE system MAY search by skill name if skill data is available.

* **FR-015**: THE system SHALL trim leading and trailing spaces from keyword before searching.

* **FR-016**: THE system SHALL treat empty keyword as default Event List view.

* **FR-017**: THE system SHALL treat keyword containing only spaces as empty keyword.

* **FR-018**: THE system SHOULD perform case-insensitive search in the first version.

* **FR-019**: THE system SHALL display search results using the same event card/list item pattern from UC08.

* **FR-020**: THE system SHALL display only public/discoverable events in search result.

* **FR-021**: THE system SHALL NOT display soft-deleted events in search result.

* **FR-022**: THE system SHALL NOT display draft events in search result.

* **FR-023**: THE system SHOULD NOT display archived, cancelled or completed events in search result in the first version.

* **FR-024**: THE system SHALL allow user to open UC09 — View Event Detail from a search result item.

* **FR-025**: THE system SHALL NOT display full Event Detail inside UC10.

* **FR-026**: THE system SHALL NOT submit Apply Event in UC10.

* **FR-027**: THE system SHALL NOT create application from search result directly.

* **FR-028**: THE system SHALL keep Apply Event submission inside UC12.

* **FR-029**: THE system SHOULD combine keyword search with active filters from UC11 when both are used.

* **FR-030**: WHEN keyword and filters are both active, THE system SHALL show results that satisfy both keyword and filter conditions.

* **FR-031**: WHEN keyword changes, THE system SHOULD reset pagination to page 1.

* **FR-032**: WHEN search is loading, THE system SHALL display loading state.

* **FR-033**: WHEN search returns no matching event, THE system SHALL display empty state.

* **FR-034**: WHEN search fails, THE system SHALL display error state.

* **FR-035**: WHEN search result event image is missing, THE system SHALL display fallback image or fallback UI.

* **FR-036**: THE system SHALL NOT expose Staff-only event management actions in UC10.

* **FR-037**: THE system SHALL NOT handle Add/Edit/Delete Event in UC10.

* **FR-038**: THE system SHALL NOT handle Applied Events in UC10.

* **FR-039**: THE system SHALL NOT handle Cancel Application in UC10.

* **FR-040**: THE system SHALL NOT handle Submit Feedback in UC10.

* **FR-041**: THE system SHALL NOT handle View Certificates or Download Certificate in UC10.

* **FR-042**: THE system SHALL NOT rely only on frontend filtering for non-public events. Backend/API must also protect non-public event data.

---

### Key Entities

* **Guest**: Unauthenticated user. Guest can search public events but cannot submit application.

* **Volunteer**: Authenticated user with role `VOLUNTEER`. Volunteer can search public events and open Event Detail.

* **Event**: Volunteer event created/managed by Staff module and displayed publicly when eligible.

* **Public Event**: Event that Guest and Volunteer are allowed to view and search.

* **Search Keyword**: Text input entered by user to search events.

* **Search Result**: List of public events matching the keyword and current filters.

* **Event List Page**: Shared page for UC08, UC10 and UC11.

* **Search Bar**: Input component on Event List page used for keyword search.

* **Event Card / Event Item**: UI block used to display each event in the list or search result.

* **Filter State**: Active filter values from UC11 that may combine with keyword search.

* **Pagination State**: Current page and page size used by Event List/search result.

* **Category**: Event category data managed by Member 4.

* **Skill**: Skill data managed by Member 4.

* **Organization**: Organization data managed by Member 5.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: Guest can search public events without logging in.

* **SC-002**: Volunteer can search public events after logging in.

* **SC-003**: Search input appears on the same Event List page used by UC08.

* **SC-004**: Codex/implementation does not create a standalone Search Event page.

* **SC-005**: Search results use the same event card/list item UI pattern as Event List.

* **SC-006**: Keyword search supports event title and location in the first version.

* **SC-007**: Keyword search can support organization, category and skill when data is available.

* **SC-008**: Keyword is trimmed before search.

* **SC-009**: Empty keyword returns the default Event List view.

* **SC-010**: Search is case-insensitive in the first version.

* **SC-011**: Search result only includes public/discoverable events.

* **SC-012**: Draft and soft-deleted events never appear in search result.

* **SC-013**: Search can combine with active filters from UC11.

* **SC-014**: Pagination resets to page 1 when keyword changes.

* **SC-015**: User can open Event Detail from a search result.

* **SC-016**: Search does not create application or submit Apply Event.

* **SC-017**: Loading, empty and error states are clearly displayed during search flow.

---

## Assumptions

* **A-001**: Guest is not stored as a database role.

* **A-002**: Database roles are `VOLUNTEER`, `STAFF`, `MANAGER`, and `ADMIN`.

* **A-003**: Guest can search public events.

* **A-004**: Volunteer can search public events.

* **A-005**: UC10 Search Event is not a standalone page.

* **A-006**: UC10 is implemented on the same Event List page as UC08 and UC11.

* **A-007**: Search bar is part of Event List UI.

* **A-008**: Search results reuse Event List cards/items from UC08.

* **A-009**: Search keyword can match event title and location.

* **A-010**: Search keyword may match organization, category and skill if data is available.

* **A-011**: Search can combine with filters from UC11.

* **A-012**: Keyword changes should reset pagination to page 1.

* **A-013**: UC10 does not submit Apply Event.

* **A-014**: Apply Event is handled by UC12.

* **A-015**: Event Detail is handled by UC09.

* **A-016**: Event data is created/managed by Member 3 Staff module.

* **A-017**: Category and Skill data are managed by Member 4.

* **A-018**: Organization data is managed by Member 5.

* **A-019**: Mock data can be used temporarily before final API/data contract is ready.

* **A-020**: Mobile app support is out of scope. Feature targets web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC10 — Search Event và KHÔNG được implement trong use case này:

* Standalone Search Event page
* View Event List full flow without search
* Filter Event detailed logic
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

# Feature Specification: Volunteer Event Discovery

**Feature Branch**: `feat/volunteer-event-discovery`

**Created**: 2026-06-25

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là một Guest hoặc Volunteer của VMS, tôi muốn xem danh sách sự kiện tình nguyện, tìm kiếm, lọc, sắp xếp và phân trang sự kiện để nhanh chóng tìm được sự kiện phù hợp trước khi xem chi tiết hoặc đăng ký tham gia."

---

## User Scenarios & Testing

### User Story 1 - Xem danh sách sự kiện public (Priority: P1)

Là Guest hoặc Volunteer, tôi muốn xem danh sách các sự kiện tình nguyện public để biết hiện tại hệ thống đang có những sự kiện nào có thể quan tâm.

**Why this priority**: Đây là luồng nền tảng của Volunteer Event Module. Nếu không có danh sách sự kiện, người dùng không thể tìm kiếm, lọc, xem chi tiết hoặc chuyển sang luồng apply event.

**Independent Test**: Có thể test độc lập bằng cách mở trang Event List với vai trò Guest và Volunteer, sau đó kiểm tra hệ thống hiển thị đúng danh sách event public.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest chưa đăng nhập, **When** người dùng mở trang Event List, **Then** hệ thống hiển thị danh sách sự kiện public mà không yêu cầu đăng nhập.

2. **Given** người dùng là Volunteer đã đăng nhập, **When** người dùng mở trang Event List, **Then** hệ thống hiển thị cùng một danh sách sự kiện public như Guest.

3. **Given** có event ở trạng thái `OPEN`, **When** Event List được hiển thị, **Then** event đó xuất hiện trong danh sách public.

4. **Given** có event ở trạng thái `FULL` nhưng event chưa diễn ra, **When** Event List được hiển thị, **Then** event đó vẫn xuất hiện trong danh sách nhưng được thể hiện là đã đủ số lượng và không thể apply.

5. **Given** có event ở trạng thái `ONGOING`, **When** Event List được hiển thị, **Then** event đó vẫn xuất hiện trong danh sách public.

6. **Given** có event ở trạng thái `DRAFT`, `CLOSED`, `COMPLETED`, `CANCELLED`, `ARCHIVED`, hoặc `DELETED`, **When** Event List được hiển thị, **Then** các event đó không xuất hiện trong danh sách public.

---

### User Story 2 - Tìm kiếm sự kiện bằng keyword (Priority: P1)

Là Guest hoặc Volunteer, tôi muốn nhập từ khóa để tìm sự kiện nhanh hơn thay vì phải xem toàn bộ danh sách.

**Why this priority**: Search là hành vi chính của Event Discovery. Người dùng thường muốn tìm sự kiện theo tên, địa điểm, danh mục, tổ chức hoặc kỹ năng liên quan.

**Independent Test**: Có thể test độc lập bằng cách nhập keyword vào ô search và kiểm tra danh sách event thay đổi đúng theo keyword.

**Acceptance Scenarios**:

1. **Given** Event List đang hiển thị, **When** người dùng nhập keyword trùng với tên event, **Then** danh sách chỉ hiển thị các event phù hợp với keyword đó.

2. **Given** Event List đang hiển thị, **When** người dùng nhập keyword trùng với location, category, organization hoặc skill của event, **Then** hệ thống vẫn có thể hiển thị các event phù hợp.

3. **Given** người dùng đang gõ keyword, **When** nội dung keyword thay đổi, **Then** hệ thống tự động cập nhật kết quả search sau một khoảng chờ ngắn để tránh xử lý quá nhiều lần liên tục.

4. **Given** keyword chỉ chứa khoảng trắng, **When** hệ thống xử lý keyword, **Then** keyword được xem như rỗng sau khi trim.

5. **Given** keyword không khớp với event nào, **When** kết quả search được cập nhật, **Then** hệ thống hiển thị trạng thái rỗng với thông báo dễ hiểu.

---

### User Story 3 - Lọc sự kiện theo nhiều điều kiện (Priority: P1)

Là Guest hoặc Volunteer, tôi muốn lọc sự kiện theo category, skill, organization, location, time và status để tìm đúng loại sự kiện mình muốn tham gia.

**Why this priority**: Filter giúp người dùng thu hẹp danh sách event và tìm sự kiện phù hợp hơn với nhu cầu, kỹ năng, địa điểm và thời gian của họ.

**Independent Test**: Có thể test độc lập bằng cách chọn từng filter hoặc kết hợp nhiều filter và kiểm tra danh sách event trả về đúng điều kiện lọc.

**Acceptance Scenarios**:

1. **Given** Event List có nhiều sự kiện thuộc nhiều category khác nhau, **When** người dùng chọn một category, **Then** danh sách chỉ hiển thị các event phù hợp với category đã chọn.

2. **Given** Event List có nhiều sự kiện liên quan đến nhiều skill khác nhau, **When** người dùng chọn một skill, **Then** danh sách chỉ hiển thị các event phù hợp với skill đã chọn.

3. **Given** Event List có nhiều event từ nhiều organization khác nhau, **When** người dùng chọn một organization, **Then** danh sách chỉ hiển thị các event thuộc organization đó.

4. **Given** người dùng nhập location vào location filter, **When** hệ thống cập nhật kết quả, **Then** danh sách chỉ hiển thị các event phù hợp với location đã nhập.

5. **Given** người dùng chọn time filter là Today, This week, This month, Upcoming hoặc Custom range, **When** hệ thống cập nhật kết quả, **Then** danh sách chỉ hiển thị các event phù hợp với điều kiện thời gian đã chọn.

6. **Given** người dùng chọn status filter, **When** status filter được hiển thị, **Then** user chỉ có thể chọn các status public/discoverable gồm `OPEN`, `FULL`, `ONGOING`.

7. **Given** người dùng chọn nhiều filter cùng lúc, **When** hệ thống cập nhật kết quả, **Then** danh sách chỉ hiển thị các event thỏa mãn đồng thời các filter đã chọn.

8. **Given** một filter option không có event phù hợp, **When** filter options được hiển thị, **Then** option đó vẫn xuất hiện và có thể hiển thị số lượng `0` bên cạnh.

9. **Given** người dùng rời khỏi trang Event Discovery rồi quay lại, **When** trang được mở lại, **Then** các filter reset về trạng thái mặc định.

---

### User Story 4 - Sắp xếp và phân trang danh sách sự kiện (Priority: P1)

Là Guest hoặc Volunteer, tôi muốn danh sách sự kiện được phân trang và có thể sắp xếp để dễ xem hơn khi số lượng event nhiều.

**Why this priority**: Nếu danh sách event lớn, việc hiển thị tất cả cùng lúc sẽ khó dùng và khó mở rộng. Pagination và sorting giúp trải nghiệm rõ ràng hơn.

**Independent Test**: Có thể test độc lập bằng cách tạo nhiều event mẫu, kiểm tra số lượng event mỗi trang, chuyển trang và đổi sort option.

**Acceptance Scenarios**:

1. **Given** số lượng event public nhiều hơn 8 event, **When** Event List được hiển thị, **Then** hệ thống phân trang danh sách event với page size mặc định là 8 events/page.

2. **Given** người dùng đang ở Event List, **When** người dùng chuyển sang trang tiếp theo, **Then** hệ thống hiển thị nhóm event tương ứng với trang đó.

3. **Given** Event List được mở lần đầu, **When** chưa có sort option nào được chọn, **Then** danh sách được sắp xếp mặc định theo `Upcoming nearest`, tức là sự kiện sắp diễn ra gần nhất.

4. **Given** người dùng chọn sort `Newest`, **When** danh sách được cập nhật, **Then** các event mới được tạo gần nhất được ưu tiên hiển thị trước.

5. **Given** người dùng chọn sort `Most available slots`, **When** danh sách được cập nhật, **Then** các event còn nhiều slot nhất được ưu tiên hiển thị trước.

6. **Given** người dùng thay đổi keyword, filter hoặc sort option, **When** danh sách được cập nhật, **Then** pagination reset về trang đầu tiên.

---

### User Story 5 - Xem thông tin tóm tắt của từng event (Priority: P1)

Là Guest hoặc Volunteer, tôi muốn mỗi event trong danh sách hiển thị thông tin tóm tắt quan trọng để quyết định có xem chi tiết hay không.

**Why this priority**: Event card là điểm tiếp xúc chính của người dùng với sự kiện. Nếu thông tin thiếu hoặc không rõ, người dùng khó quyết định event nào phù hợp.

**Independent Test**: Có thể test độc lập bằng cách kiểm tra mỗi event card trong danh sách có đầy đủ thông tin tóm tắt bắt buộc.

**Acceptance Scenarios**:

1. **Given** một event public xuất hiện trong Event List, **When** event card được hiển thị, **Then** card hiển thị event title, short description, category, organization name, date/time, location, event status, capacity hoặc remaining slots, và nút View Detail.

2. **Given** event có image hoặc thumbnail, **When** event card được hiển thị, **Then** image hoặc thumbnail được hiển thị nếu có dữ liệu phù hợp.

3. **Given** event không có image hoặc thumbnail, **When** event card được hiển thị, **Then** hệ thống vẫn hiển thị card ổn định bằng placeholder hoặc bố cục thay thế.

4. **Given** event có required skills, **When** event card được hiển thị trong Event List, **Then** required skills không hiển thị ở danh sách mà sẽ được xử lý ở Event Detail feature.

5. **Given** người dùng bấm nút View Detail trên event card, **When** hành động được thực hiện, **Then** người dùng được chuyển sang luồng Event Detail của feature riêng.

---

### User Story 6 - Trạng thái loading, empty và error (Priority: P2)

Là Guest hoặc Volunteer, tôi muốn hệ thống hiển thị rõ trạng thái loading, không có kết quả hoặc lỗi để không bị nhầm rằng trang bị hỏng.

**Why this priority**: Đây là yêu cầu UX quan trọng để người dùng hiểu hệ thống đang làm gì, nhưng không phải nghiệp vụ lõi như list/search/filter.

**Independent Test**: Có thể test độc lập bằng cách mô phỏng trạng thái đang tải, không có event phù hợp và lỗi khi tải dữ liệu.

**Acceptance Scenarios**:

1. **Given** Event List đang tải dữ liệu, **When** người dùng mở trang, **Then** hệ thống hiển thị loading state.

2. **Given** không có event nào phù hợp với search/filter, **When** danh sách được cập nhật, **Then** hệ thống hiển thị empty state với thông báo rõ ràng.

3. **Given** dữ liệu event không tải được, **When** hệ thống gặp lỗi, **Then** hệ thống hiển thị error state dễ hiểu và không làm crash trang.

4. **Given** filter options chưa tải được, **When** trang Event Discovery được hiển thị, **Then** hệ thống không crash và hiển thị trạng thái phù hợp cho phần filter.

---

## Edge Cases

* **Không có event public nào**: WHEN hệ thống không có event nào đủ điều kiện hiển thị, THE system SHALL hiển thị empty state thay vì trang trắng.

* **Keyword chỉ chứa khoảng trắng**: WHEN người dùng nhập keyword chỉ gồm khoảng trắng, THE system SHALL xử lý như keyword rỗng sau khi trim.

* **Keyword quá dài**: WHEN người dùng nhập keyword quá dài, THE system SHALL giới hạn hoặc xử lý an toàn để không làm hỏng giao diện hoặc gây lỗi xử lý.

* **Search không tìm thấy kết quả**: WHEN keyword không khớp với event nào, THE system SHALL hiển thị thông báo không có kết quả phù hợp.

* **Filter option có count bằng 0**: WHERE một category, skill hoặc organization không có event phù hợp, THE system SHALL vẫn hiển thị option đó và MAY hiển thị số lượng `0`.

* **Kết hợp nhiều filter tạo ra danh sách rỗng**: WHEN nhiều filter được chọn cùng lúc và không có event phù hợp, THE system SHALL hiển thị empty state rõ ràng.

* **Location filter rỗng hoặc chỉ chứa khoảng trắng**: WHEN người dùng nhập location rỗng hoặc chỉ chứa khoảng trắng, THE system SHALL xử lý như không có location filter.

* **Custom range không hợp lệ**: WHEN người dùng chọn Custom range nhưng start date sau end date, THE system SHALL hiển thị lỗi rõ ràng hoặc không áp dụng custom range.

* **Custom range thiếu start date hoặc end date**: WHEN người dùng chọn Custom range nhưng thiếu start date hoặc end date, THE system SHALL không áp dụng custom range cho đến khi đủ dữ liệu hợp lệ.

* **Event FULL nhưng chưa diễn ra**: WHERE event đã đủ số lượng volunteer nhưng chưa diễn ra, THE system SHALL vẫn hiển thị event trong danh sách và SHALL thể hiện rằng event không thể apply.

* **Event ONGOING**: WHERE event đang diễn ra, THE system SHALL vẫn hiển thị event trong Event List public.

* **Event CLOSED**: WHERE event đã đóng đăng ký, THE system SHALL không hiển thị event đó trong Event List public.

* **Event bị ẩn khỏi public list**: WHERE event có trạng thái `DRAFT`, `CLOSED`, `COMPLETED`, `CANCELLED`, `ARCHIVED`, hoặc `DELETED`, THE system SHALL không hiển thị event đó trong Event List public.

* **Event thiếu image**: WHERE event không có image hoặc thumbnail, THE system SHALL hiển thị placeholder hoặc bố cục không ảnh thay vì lỗi giao diện.

* **Filter reset khi rời trang**: WHEN người dùng rời khỏi Event Discovery rồi quay lại, THE system SHALL reset filter về mặc định.

* **Pagination sau khi đổi search/filter/sort**: WHEN người dùng thay đổi keyword, filter hoặc sort option, THE system SHALL reset pagination về trang đầu tiên.

---

## Requirements

### Functional Requirements

* **FR-001**: WHEN Guest mở Event List, THE system SHALL hiển thị danh sách event public mà không yêu cầu đăng nhập.

* **FR-002**: WHEN Volunteer mở Event List, THE system SHALL hiển thị cùng danh sách event public như Guest.

* **FR-003**: THE system SHALL chỉ hiển thị các event đủ điều kiện public/discoverable trong Event List.

* **FR-004**: THE system SHALL hiển thị event `OPEN` trong Event List public.

* **FR-005**: THE system SHALL hiển thị event `FULL` trong Event List nếu event chưa diễn ra, nhưng SHALL thể hiện event đó không thể apply.

* **FR-006**: THE system SHALL hiển thị event `ONGOING` trong Event List public.

* **FR-007**: THE system SHALL không hiển thị event có trạng thái `DRAFT`, `CLOSED`, `COMPLETED`, `CANCELLED`, `ARCHIVED`, hoặc `DELETED` trong Event List public.

* **FR-008**: EACH event card in Event List SHALL display event title, short description, category, organization name, date/time, location, event status, capacity hoặc remaining slots, và View Detail action.

* **FR-009**: IF event image hoặc thumbnail tồn tại, THE system SHALL hiển thị image hoặc thumbnail trong event card.

* **FR-010**: IF event image hoặc thumbnail không tồn tại, THE system SHALL hiển thị placeholder hoặc bố cục thay thế phù hợp.

* **FR-011**: THE system SHALL NOT display required skills inside the Event List card. Required skills belong to Event Detail feature.

* **FR-012**: WHEN người dùng nhập keyword, THE system SHALL search theo event name.

* **FR-013**: Keyword search MAY also match location, category, organization, and skill.

* **FR-014**: Search SHALL update automatically while the user is typing, with a short debounce to avoid excessive processing.

* **FR-015**: THE system SHALL provide filter options for category, skill, organization, location, time, and status.

* **FR-016**: THE location filter SHALL be a text input where users can type location manually.

* **FR-017**: THE time filter SHALL support Today, This week, This month, Upcoming, and Custom range.

* **FR-018**: THE status filter SHALL only expose public/discoverable statuses: `OPEN`, `FULL`, `ONGOING`.

* **FR-019**: THE system SHALL allow users to combine multiple filters at the same time.

* **FR-020**: WHEN multiple filters are selected, THE system SHALL show only events that satisfy the selected filter conditions.

* **FR-021**: THE system SHALL keep filter options visible even when an option has zero matching events.

* **FR-022**: THE system MAY display count values next to filter options, including `0`.

* **FR-023**: WHEN user leaves Event Discovery and later returns, THE system SHALL reset filters to default state.

* **FR-024**: THE system SHALL use pagination for Event List.

* **FR-025**: THE system SHALL use default page size 8 events/page.

* **FR-026**: THE system SHALL sort Event List by `Upcoming nearest` by default.

* **FR-027**: THE system SHALL allow users to sort by `Upcoming nearest`, `Newest`, and `Most available slots`.

* **FR-028**: WHEN keyword, filter, or sort changes, THE system SHALL reset pagination to the first page.

* **FR-029**: WHEN the user clicks View Detail on an event card, THE system SHALL navigate to or request the Event Detail flow handled by a separate feature.

* **FR-030**: WHEN data is loading, THE system SHALL display loading state.

* **FR-031**: WHEN no events match current search/filter conditions, THE system SHALL display empty state.

* **FR-032**: WHEN event list data cannot be loaded, THE system SHALL display an understandable error state.

* **FR-033**: THE system SHALL NOT allow frontend visibility alone to determine protected actions. Apply Event is outside this feature and requires authentication in a separate feature.

* **FR-034**: THE system SHALL treat category, skill, organization, and event status values as shared data owned by other modules until approved contracts or plans define otherwise.

---

### Key Entities

* **Event**: Đại diện cho một cơ hội tình nguyện được hiển thị cho người dùng trong danh sách public nếu đủ điều kiện discoverable.

* **Event Status**: Trạng thái nghiệp vụ của event, dùng để xác định event có được hiển thị trong public list hay không và có thể apply hay không.

* **Event Category**: Nhóm phân loại event, dùng để hỗ trợ filter và giúp người dùng hiểu event thuộc loại nào.

* **Skill**: Kỹ năng liên quan đến event. Trong feature này, skill có thể được dùng cho search/filter, nhưng required skills không hiển thị trong Event List card.

* **Organization**: Tổ chức tạo, tài trợ hoặc quản lý event. Organization được hiển thị trong Event List và có thể dùng làm filter.

* **Location**: Thông tin địa điểm của event, dùng để hiển thị trên event card và hỗ trợ search/filter. Trong feature này, location filter là text input.

* **Time Filter**: Điều kiện lọc theo thời gian diễn ra event. Feature này hỗ trợ Today, This week, This month, Upcoming và Custom range.

* **Status Filter**: Điều kiện lọc theo trạng thái event. Feature này chỉ cho user chọn các status public/discoverable gồm `OPEN`, `FULL`, `ONGOING`.

* **Pagination State**: Trạng thái phân trang của danh sách event, gồm trang hiện tại, page size 8, và khả năng chuyển trang.

* **Sort Option**: Cách sắp xếp danh sách event. Feature này hỗ trợ `Upcoming nearest`, `Newest`, và `Most available slots`.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: Guest và Volunteer đều có thể mở Event List và xem danh sách event public mà không gặp lỗi truy cập.

* **SC-002**: 100% event có trạng thái `OPEN`, `FULL`, `ONGOING` xuất hiện trong Event List public khi thỏa mãn điều kiện search/filter hiện tại.

* **SC-003**: 100% event có trạng thái `DRAFT`, `CLOSED`, `COMPLETED`, `CANCELLED`, `ARCHIVED`, hoặc `DELETED` không xuất hiện trong Event List public trong acceptance testing.

* **SC-004**: 100% event `FULL` nhưng chưa diễn ra vẫn xuất hiện trong Event List và được thể hiện là không thể apply.

* **SC-005**: Khi người dùng search theo event name, location, category, organization hoặc skill, danh sách event được cập nhật đúng theo keyword trong acceptance testing.

* **SC-006**: User có thể kết hợp nhiều filter cùng lúc và danh sách event phản ánh đúng các điều kiện đã chọn.

* **SC-007**: Status filter chỉ hiển thị `OPEN`, `FULL`, `ONGOING`.

* **SC-008**: Time filter hỗ trợ Today, This week, This month, Upcoming và Custom range.

* **SC-009**: Location filter cho phép user nhập địa điểm bằng text input.

* **SC-010**: Filter options vẫn hiển thị option có `0` event phù hợp nếu dữ liệu option tồn tại.

* **SC-011**: Event List sử dụng pagination với page size 8 khi số lượng event vượt quá 8.

* **SC-012**: Sort mặc định là `Upcoming nearest` khi người dùng mở Event List lần đầu.

* **SC-013**: User có thể đổi sort sang `Newest` hoặc `Most available slots`, và danh sách event được cập nhật đúng.

* **SC-014**: 100% event card hiển thị các thông tin bắt buộc: title, short description, category, organization, date/time, location, status, capacity hoặc remaining slots, và View Detail action.

* **SC-015**: Khi không có event phù hợp, hệ thống hiển thị empty state thay vì trang trắng.

* **SC-016**: Khi dữ liệu đang tải hoặc tải lỗi, hệ thống hiển thị loading/error state rõ ràng.

---

## Assumptions

* **A-001**: Project-level specification đã xác nhận hệ thống có 5 roles: Guest, Volunteer, Staff, Manager, Admin.

* **A-002**: Guest và Volunteer được phép xem cùng một danh sách event public.

* **A-003**: Member 3 — Staff Module là owner chính của staff-side event management và event status model.

* **A-004**: Member 4 — Manager Module là owner chính của category, skill, and organization management.

* **A-005**: Member 2 chỉ consume category, skill, organization, và event status để phục vụ Event Discovery.

* **A-006**: Event Detail là feature riêng và không được implement trong feature này.

* **A-007**: Apply Event là feature riêng và không được implement trong feature này.

* **A-008**: Event Discovery có thể dùng mock events, mock categories, mock skills, mock organizations, và mock event statuses trong giai đoạn đầu nếu module khác chưa sẵn sàng.

* **A-009**: Mock data chỉ dùng để dựng UI/luồng và không phải database hoặc API contract chính thức.

* **A-010**: Search tự động khi đang gõ sẽ dùng debounce khi implement để tránh xử lý quá nhiều lần.

* **A-011**: Mobile app support là out of scope. Feature này chỉ nhắm đến web application.

* **A-012**: Required skills không cần hiển thị trong Event List vì sẽ được xử lý ở Event Detail.

* **A-013**: Event `CLOSED` không hiển thị trong Event List public.

* **A-014**: Event `ONGOING` có hiển thị trong Event List public.

* **A-015**: Page size mặc định là 8 events/page.

* **A-016**: Location filter là text input.

* **A-017**: Time filter gồm Today, This week, This month, Upcoming và Custom range.

* **A-018**: Status filter chỉ gồm `OPEN`, `FULL`, `ONGOING`.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của Volunteer Event Discovery và KHÔNG được implement trong feature này:

* Event Detail screen logic đầy đủ
* Apply Event
* Applied Events
* Cancel Application
* Volunteer Event History
* Staff Add Event
* Staff Edit Event
* Staff Delete Event
* Staff Application List
* Staff Application Detail
* Approve Application
* Reject Application
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

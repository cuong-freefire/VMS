# Feature Specification: Volunteer Event History

**Feature Branch**: `feat/volunteer-event-history`

**Created**: 2026-06-25

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là một Volunteer của VMS, tôi muốn xem lại lịch sử các sự kiện tình nguyện mà tôi đã tham gia hoặc đã hoàn thành để theo dõi quá trình đóng góp, trạng thái tham gia, số giờ tình nguyện và chứng nhận nếu có."

---

## User Scenarios & Testing

### User Story 1 - Volunteer xem lịch sử event đã tham gia (Priority: P1)

Là Volunteer đã đăng nhập, tôi muốn xem danh sách các event mà tôi đã tham gia hoặc đã được ghi nhận trong lịch sử để theo dõi quá trình tình nguyện của mình.

**Why this priority**: Đây là luồng chính của feature Event History. Volunteer cần phân biệt giữa event đã apply và event đã thực sự tham gia/hoàn thành.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập bằng tài khoản Volunteer có participation/attendance records, mở Event History page và kiểm tra danh sách lịch sử được hiển thị đúng.

**Acceptance Scenarios**:

1. **Given** người dùng là Volunteer đã đăng nhập, **When** người dùng mở Event History page, **Then** hệ thống hiển thị danh sách event history của Volunteer đó.

2. **Given** Volunteer có nhiều history records, **When** Event History page được hiển thị, **Then** hệ thống hiển thị từng history item kèm thông tin tóm tắt của event tương ứng.

3. **Given** Volunteer chưa có event history nào, **When** người dùng mở Event History page, **Then** hệ thống hiển thị empty state với thông báo rõ ràng.

4. **Given** Volunteer đã được Staff ghi nhận tham gia hoặc hoàn thành event, **When** người dùng mở Event History page, **Then** event đó xuất hiện trong lịch sử.

---

### User Story 2 - Bảo vệ quyền truy cập Event History (Priority: P1)

Là hệ thống, tôi cần đảm bảo chỉ Volunteer đã đăng nhập mới được xem lịch sử tham gia của chính mình.

**Why this priority**: Event History là dữ liệu cá nhân của Volunteer. Guest hoặc user khác không được xem lịch sử tham gia của Volunteer.

**Independent Test**: Có thể test độc lập bằng cách thử mở Event History khi chưa login, khi login bằng role không phải Volunteer, và khi login bằng Volunteer khác.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest chưa đăng nhập, **When** người dùng mở Event History page, **Then** hệ thống yêu cầu đăng nhập hoặc điều hướng sang Authentication flow.

2. **Given** người dùng đã đăng nhập nhưng không có role Volunteer, **When** người dùng mở Event History page, **Then** hệ thống không cho xem lịch sử và hiển thị forbidden state hoặc thông báo phù hợp.

3. **Given** người dùng là Volunteer đã đăng nhập, **When** người dùng mở Event History page, **Then** hệ thống chỉ hiển thị history records của chính Volunteer đó.

4. **Given** có history record của Volunteer khác, **When** Volunteer hiện tại mở Event History page, **Then** hệ thống không hiển thị history record của Volunteer khác.

---

### User Story 3 - Phân biệt Event History với Applied Events (Priority: P1)

Là Volunteer, tôi muốn Event History chỉ hiển thị các event đã tham gia hoặc đã hoàn thành, không trộn với các application đang chờ duyệt, bị từ chối hoặc đã hủy.

**Why this priority**: Nếu Event History trộn với Applied Events, người dùng sẽ hiểu nhầm rằng event đã apply chính là event đã tham gia.

**Independent Test**: Có thể test độc lập bằng cách tạo application với nhiều status khác nhau và kiểm tra Event History chỉ hiển thị đúng record lịch sử.

**Acceptance Scenarios**:

1. **Given** Volunteer có application `PENDING`, **When** Event History page được hiển thị, **Then** application đó không xuất hiện trong Event History.

2. **Given** Volunteer có application `REJECTED`, **When** Event History page được hiển thị, **Then** application đó không xuất hiện trong Event History.

3. **Given** Volunteer có application `CANCELLED`, **When** Event History page được hiển thị, **Then** application đó không xuất hiện trong Event History.

4. **Given** Volunteer có application `APPROVED` nhưng event chưa diễn ra, **When** Event History page được hiển thị, **Then** event đó chưa xuất hiện trong Event History và vẫn thuộc Applied Events.

5. **Given** Volunteer có event đã hoàn thành và có participation/attendance record, **When** Event History page được hiển thị, **Then** event đó xuất hiện trong Event History.

---

### User Story 4 - Xem thông tin tóm tắt của event trong lịch sử (Priority: P1)

Là Volunteer, tôi muốn mỗi history item hiển thị thông tin tóm tắt của event để dễ nhận biết mình đã tham gia sự kiện nào.

**Why this priority**: Event History cần đủ thông tin cơ bản để Volunteer xem lại lịch sử mà không cần mở detail từng event.

**Independent Test**: Có thể test độc lập bằng cách kiểm tra mỗi history item/card có đủ thông tin tóm tắt bắt buộc.

**Acceptance Scenarios**:

1. **Given** một event history item xuất hiện, **When** item được hiển thị, **Then** hệ thống hiển thị event title, category, organization, event date/time, location, event status, participation status và volunteer hours nếu có.

2. **Given** event có thumbnail hoặc image, **When** history item được hiển thị, **Then** hệ thống hiển thị image nếu có dữ liệu phù hợp.

3. **Given** event không có thumbnail hoặc image, **When** history item được hiển thị, **Then** hệ thống hiển thị placeholder hoặc layout thay thế ổn định.

4. **Given** event đã bị archived hoặc deleted sau khi Volunteer tham gia, **When** history item được hiển thị, **Then** hệ thống vẫn có thể hiển thị history record nếu dữ liệu lịch sử còn tồn tại.

---

### User Story 5 - Xem participation status và volunteer hours (Priority: P1)

Là Volunteer, tôi muốn biết trạng thái tham gia và số giờ tình nguyện được ghi nhận cho từng event để theo dõi đóng góp của mình.

**Why this priority**: Participation status và volunteer hours là giá trị chính của Event History, giúp Volunteer theo dõi kết quả tham gia sau event.

**Independent Test**: Có thể test độc lập bằng cách tạo history records với các participation status khác nhau và kiểm tra UI hiển thị đúng.

**Acceptance Scenarios**:

1. **Given** history record có participation status `ATTENDED`, **When** Event History được hiển thị, **Then** hệ thống hiển thị trạng thái đã tham gia.

2. **Given** history record có participation status `COMPLETED`, **When** Event History được hiển thị, **Then** hệ thống hiển thị trạng thái đã hoàn thành.

3. **Given** history record có participation status `ABSENT`, **When** Event History được hiển thị, **Then** hệ thống hiển thị trạng thái vắng mặt nếu dữ liệu này được Staff ghi nhận.

4. **Given** history record có participation status `NOT_RECORDED`, **When** Event History được hiển thị, **Then** hệ thống hiển thị trạng thái chưa ghi nhận nếu dữ liệu này được dùng trong hệ thống.

5. **Given** history record có volunteer hours, **When** Event History được hiển thị, **Then** hệ thống hiển thị số giờ tình nguyện đã được ghi nhận.

6. **Given** history record không có volunteer hours, **When** Event History được hiển thị, **Then** hệ thống vẫn hiển thị layout ổn định và không làm crash trang.

---

### User Story 6 - Xem certificate status hoặc entry point nếu có (Priority: P2)

Là Volunteer, tôi muốn biết event nào có certificate để có thể xem hoặc tải chứng nhận nếu hệ thống đã hỗ trợ.

**Why this priority**: Certificate là giá trị bổ sung sau khi Volunteer hoàn thành event, nhưng generation/download certificate không thuộc phạm vi chính của feature này.

**Independent Test**: Có thể test độc lập bằng cách tạo history records có và không có certificate data, sau đó kiểm tra UI hiển thị trạng thái phù hợp.

**Acceptance Scenarios**:

1. **Given** history record có certificate available, **When** Event History được hiển thị, **Then** hệ thống có thể hiển thị certificate status hoặc entry point.

2. **Given** history record chưa có certificate, **When** Event History được hiển thị, **Then** hệ thống hiển thị trạng thái chưa có certificate hoặc không hiển thị entry point.

3. **Given** Volunteer click certificate entry point, **When** certificate feature chưa được implement, **Then** hệ thống không generate certificate trong feature này.

---

### User Story 7 - Lọc, sắp xếp và phân trang Event History (Priority: P2)

Là Volunteer, tôi muốn lọc, sắp xếp và phân trang Event History để dễ xem khi lịch sử tham gia nhiều.

**Why this priority**: Khi Volunteer tham gia nhiều event, filter/sort/pagination giúp trải nghiệm dễ quản lý hơn. Đây là UX hỗ trợ, không phải nghiệp vụ lõi như xem history.

**Independent Test**: Có thể test độc lập bằng cách tạo nhiều history records với status và thời gian khác nhau, sau đó kiểm tra filter/sort/pagination.

**Acceptance Scenarios**:

1. **Given** Event History có nhiều participation status, **When** Volunteer chọn filter `ATTENDED`, **Then** hệ thống chỉ hiển thị history records có status `ATTENDED`.

2. **Given** Event History có nhiều participation status, **When** Volunteer chọn filter `COMPLETED`, **Then** hệ thống chỉ hiển thị history records có status `COMPLETED`.

3. **Given** Volunteer chọn filter `ALL`, **When** danh sách được cập nhật, **Then** hệ thống hiển thị tất cả history records của Volunteer đó.

4. **Given** Event History có nhiều records, **When** danh sách được hiển thị, **Then** hệ thống sắp xếp mặc định theo event date hoặc completed date mới nhất trước.

5. **Given** số lượng history records lớn hơn số lượng tối đa trên một trang, **When** Event History page được hiển thị, **Then** hệ thống phân trang danh sách.

6. **Given** Volunteer đổi filter, **When** danh sách được cập nhật, **Then** pagination reset về trang đầu tiên.

---

### User Story 8 - Xem lại Event Detail từ Event History (Priority: P2)

Là Volunteer, tôi muốn bấm vào một history item để xem lại thông tin event.

**Why this priority**: Volunteer có thể cần xem lại mô tả, thời gian, địa điểm, organization hoặc thông tin chi tiết của event đã tham gia.

**Independent Test**: Có thể test độc lập bằng cách click View Detail trên một history item và kiểm tra điều hướng sang Event Detail.

**Acceptance Scenarios**:

1. **Given** một history item đang hiển thị, **When** Volunteer click View Detail, **Then** hệ thống điều hướng sang Event Detail của event tương ứng nếu route/detail còn khả dụng.

2. **Given** event detail không còn public hoặc unavailable, **When** Volunteer click View Detail, **Then** hệ thống xử lý theo rule của Event Detail feature và hiển thị not found/unavailable nếu cần.

3. **Given** Event Detail không còn khả dụng, **When** history record vẫn tồn tại, **Then** Event History vẫn giữ record lịch sử thay vì xóa khỏi danh sách.

---

### User Story 9 - Loading, empty và error states (Priority: P2)

Là Volunteer, tôi muốn hệ thống hiển thị rõ trạng thái đang tải, không có dữ liệu hoặc lỗi để không bị nhầm rằng trang bị hỏng.

**Why this priority**: Đây là yêu cầu UX quan trọng để người dùng hiểu hệ thống đang làm gì.

**Independent Test**: Có thể test độc lập bằng cách mô phỏng loading, empty và error states.

**Acceptance Scenarios**:

1. **Given** Event History đang tải dữ liệu, **When** Volunteer mở page, **Then** hệ thống hiển thị loading state.

2. **Given** Volunteer chưa có event history nào, **When** Event History page được hiển thị, **Then** hệ thống hiển thị empty state.

3. **Given** không có history record nào phù hợp với filter hiện tại, **When** danh sách được cập nhật, **Then** hệ thống hiển thị empty state phù hợp với filter.

4. **Given** dữ liệu Event History không tải được, **When** hệ thống gặp lỗi, **Then** hệ thống hiển thị error state dễ hiểu và không làm crash trang.

---

## Edge Cases

* **Guest mở Event History**: WHEN Guest mở Event History page, THE system SHALL yêu cầu đăng nhập hoặc điều hướng sang Authentication flow.

* **User không phải Volunteer mở Event History**: WHEN authenticated non-Volunteer user mở Event History, THE system SHALL chặn truy cập.

* **Volunteer không có history record nào**: WHEN Volunteer chưa có event history, THE system SHALL hiển thị empty state.

* **Volunteer chỉ thấy history của mình**: WHERE có history record của Volunteer khác, THE system SHALL không hiển thị cho Volunteer hiện tại.

* **PENDING application**: WHERE Volunteer chỉ có application `PENDING`, THE system SHALL không coi đó là Event History.

* **REJECTED application**: WHERE Volunteer chỉ có application `REJECTED`, THE system SHALL không coi đó là Event History.

* **CANCELLED application**: WHERE Volunteer chỉ có application `CANCELLED`, THE system SHALL không coi đó là Event History.

* **APPROVED nhưng event chưa diễn ra**: WHERE application đã `APPROVED` nhưng event chưa diễn ra, THE system SHALL không hiển thị event trong Event History bản đầu.

* **Attendance chưa ghi nhận**: WHERE event đã diễn ra nhưng attendance chưa được Staff ghi nhận, THE system MAY hiển thị `NOT_RECORDED` hoặc không hiển thị tùy rule team chốt sau.

* **Volunteer absent**: WHERE Staff ghi nhận Volunteer vắng mặt, THE system MAY hiển thị history record với participation status `ABSENT` nếu dữ liệu này được cung cấp.

* **Event bị archived/deleted sau khi tham gia**: WHERE event bị archived/deleted sau khi Volunteer đã tham gia, THE system SHALL giữ history record nếu record lịch sử còn tồn tại.

* **History item thiếu image**: WHERE event không có image/thumbnail, THE system SHALL hiển thị placeholder hoặc fallback layout.

* **Volunteer hours thiếu hoặc bằng 0**: WHERE volunteer hours không có hoặc bằng 0, THE system SHALL hiển thị layout ổn định.

* **Filter không có kết quả**: WHEN Volunteer chọn filter nhưng không có history record phù hợp, THE system SHALL hiển thị filter empty state.

* **Pagination sau khi đổi filter**: WHEN Volunteer đổi filter, THE system SHALL reset pagination về trang đầu tiên.

* **Lỗi tải dữ liệu**: WHEN Event History data không tải được, THE system SHALL hiển thị error state rõ ràng.

---

## Requirements

### Functional Requirements

* **FR-001**: THE system SHALL allow only authenticated Volunteer users to view Event History.

* **FR-002**: WHEN Guest attempts to open Event History, THE system SHALL require login or redirect to Authentication flow.

* **FR-003**: WHEN authenticated user is not Volunteer, THE system SHALL block access to Event History.

* **FR-004**: THE system SHALL show only event history records that belong to the current authenticated Volunteer.

* **FR-005**: THE system SHALL NOT show history records of other Volunteers.

* **FR-006**: Event History SHALL be separate from Applied Events.

* **FR-007**: THE system SHALL NOT show `PENDING`, `REJECTED`, or `CANCELLED` applications as Event History if they do not represent actual participation.

* **FR-008**: THE system SHALL NOT show future approved events as Event History before the event happens or before participation/completion is recorded.

* **FR-009**: Event History SHALL display events where Volunteer has participation/completion record, if such data is available.

* **FR-010**: EACH history item SHALL display event summary and participation information.

* **FR-011**: Event summary SHALL include event title, category, organization, event date/time, location, event status and participation status.

* **FR-012**: Event history item SHOULD display volunteer hours if data is available.

* **FR-013**: Event history item MAY display certificate status or certificate entry point if data is available.

* **FR-014**: IF event thumbnail/image exists, THE system SHALL display it.

* **FR-015**: IF event thumbnail/image is missing, THE system SHALL display placeholder or fallback layout.

* **FR-016**: THE system SHALL support participation status `ATTENDED` if attendance data uses this status.

* **FR-017**: THE system SHALL support participation status `COMPLETED` if completion data uses this status.

* **FR-018**: THE system MAY support participation status `ABSENT` if Staff records absent participation.

* **FR-019**: THE system MAY support participation status `NOT_RECORDED` if attendance/completion has not been recorded.

* **FR-020**: THE system SHOULD support filter by participation status.

* **FR-021**: THE system SHOULD support pagination when history records exceed page size.

* **FR-022**: WHEN participation status filter changes, THE system SHALL reset pagination to first page.

* **FR-023**: THE system SHALL sort Event History by event date or completed date newest first by default.

* **FR-024**: THE system SHALL allow Volunteer to navigate from a history item to Event Detail if available.

* **FR-025**: THE system SHALL keep history record visible even if the original event is archived/deleted, as long as history data exists.

* **FR-026**: WHEN Event History data is loading, THE system SHALL display loading state.

* **FR-027**: WHEN Volunteer has no history records, THE system SHALL display empty state.

* **FR-028**: WHEN no history records match current filter, THE system SHALL display filter empty state.

* **FR-029**: WHEN Event History data cannot be loaded, THE system SHALL display understandable error state.

* **FR-030**: THE system SHALL NOT create application in this feature.

* **FR-031**: THE system SHALL NOT cancel application in this feature.

* **FR-032**: THE system SHALL NOT approve or reject application in this feature.

* **FR-033**: THE system SHALL NOT manage attendance in this feature.

* **FR-034**: THE system SHALL NOT generate certificate in this feature.

* **FR-035**: THE system SHALL NOT submit feedback in this feature.

* **FR-036**: THE system SHALL NOT rely only on frontend visibility for protected data. Backend/API must enforce authentication, role and ownership rules.

* **FR-037**: THE system SHALL treat participation status, attendance result, volunteer hours and certificate data as shared data owned by related modules until approved contracts or plans define otherwise.

---

### Key Entities

* **Volunteer**: Authenticated user with Volunteer role who can view their own event history.

* **Guest**: Unauthenticated user who cannot view Event History.

* **Event**: Volunteer event associated with a participation/history record.

* **Event History Record**: Record representing Volunteer’s participation or completion history for an event.

* **Participation Status**: Status showing the Volunteer’s result in an event, such as `ATTENDED`, `COMPLETED`, `ABSENT`, or `NOT_RECORDED`.

* **Attendance Record**: Staff-managed data confirming whether Volunteer attended an event.

* **Volunteer Hours**: Number of volunteer hours credited to the Volunteer for an event.

* **Certificate Status**: Information showing whether a certificate exists or is available for a completed event.

* **History Item**: UI representation of one event history record and its event summary.

* **Participation Status Filter**: Filter used to view history records by participation status.

* **Pagination State**: State for dividing Event History into pages when the list is long.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: 100% Guest users are blocked from viewing Event History and are asked to login or go through Authentication flow.

* **SC-002**: 100% authenticated non-Volunteer users are blocked from viewing Event History.

* **SC-003**: 100% Volunteer users can view only their own event history records.

* **SC-004**: 0 history records from other Volunteers are displayed in the current Volunteer’s Event History page.

* **SC-005**: Event History does not show `PENDING`, `REJECTED`, or `CANCELLED` applications as actual participation history.

* **SC-006**: Future approved events do not appear in Event History before the event happens or before participation/completion is recorded.

* **SC-007**: Each history item displays required summary fields: event title, category, organization, event date/time, location, event status and participation status.

* **SC-008**: Volunteer hours are displayed when data is available.

* **SC-009**: Certificate status or entry point is displayed when data is available.

* **SC-010**: Event without image still renders stable layout with placeholder or fallback.

* **SC-011**: Volunteer with no history records sees empty state instead of blank page.

* **SC-012**: Volunteer can filter history records by participation status if filter is available.

* **SC-013**: Pagination works when history records exceed page size if pagination is available.

* **SC-014**: Volunteer can navigate from Event History to Event Detail if detail is available.

* **SC-015**: Event History feature does not create, cancel, approve, reject, or manage applications.

* **SC-016**: Event History feature does not manage attendance, generate certificate, or submit feedback.

* **SC-017**: Loading, empty and error states are displayed clearly.

---

## Assumptions

* **A-001**: Project-level specification đã xác nhận hệ thống có 5 roles: Guest, Volunteer, Staff, Manager, Admin.

* **A-002**: Event History yêu cầu authenticated Volunteer.

* **A-003**: Guest không được xem Event History.

* **A-004**: Authenticated non-Volunteer user không được xem Event History.

* **A-005**: Volunteer chỉ xem được history records của chính mình.

* **A-006**: Event History khác với Applied Events.

* **A-007**: Applied Events hiển thị application status, còn Event History hiển thị participation/completion records.

* **A-008**: `PENDING`, `REJECTED`, `CANCELLED` applications không được coi là Event History nếu không có participation record.

* **A-009**: Approved future events vẫn thuộc Applied Events, chưa thuộc Event History.

* **A-010**: Event History dựa trên attendance/completion result do Staff Module hoặc backend cung cấp.

* **A-011**: Participation status bản đầu có thể gồm `ATTENDED`, `COMPLETED`, `ABSENT`, `NOT_RECORDED`.

* **A-012**: Volunteer hours có thể hiển thị nếu dữ liệu có sẵn.

* **A-013**: Certificate status hoặc entry point có thể hiển thị nếu dữ liệu có sẵn.

* **A-014**: Certificate generation không thuộc feature này.

* **A-015**: Feedback submission không thuộc feature này.

* **A-016**: Event History có thể hỗ trợ filter theo participation status.

* **A-017**: Event History có thể hỗ trợ pagination nếu danh sách dài.

* **A-018**: Event bị archived/deleted sau khi Volunteer tham gia vẫn có thể xuất hiện trong History nếu history record còn tồn tại.

* **A-019**: Member 1 chịu trách nhiệm Authentication/Profile.

* **A-020**: Member 3 chịu trách nhiệm attendance/completion, volunteer hours, event lifecycle và certificate status nếu có.

* **A-021**: Mock data có thể được dùng tạm trong giai đoạn đầu nếu API/data thật chưa sẵn sàng.

* **A-022**: Mobile app support là out of scope. Feature này chỉ nhắm đến web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của Volunteer Event History và KHÔNG được implement trong feature này:

* Event List
* Search Event
* Filter Event Discovery
* Event Detail full display
* Submit Apply Event
* Application form
* Applied Events list
* Cancel Application
* Staff Application List
* Staff Application Detail
* Approve Application
* Reject Application
* Staff Add Event
* Staff Edit Event
* Staff Delete Event
* Attendance Management
* Feedback Submission
* Certificate Generation
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

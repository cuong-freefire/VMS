# Feature Specification: Volunteer Event Detail

**Feature Branch**: `feat/volunteer-event-detail`

**Created**: 2026-06-25

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là một Guest hoặc Volunteer của VMS, tôi muốn xem thông tin chi tiết của một sự kiện tình nguyện để hiểu rõ nội dung, thời gian, địa điểm, kỹ năng yêu cầu, tổ chức phụ trách, số slot còn lại và quyết định có tiếp tục sang luồng đăng ký tham gia hay không."

---

## User Scenarios & Testing

### User Story 1 - Xem chi tiết sự kiện public (Priority: P1)

Là Guest hoặc Volunteer, tôi muốn xem chi tiết một sự kiện public để hiểu rõ thông tin sự kiện trước khi quyết định có quan tâm hoặc đăng ký tham gia hay không.

**Why this priority**: Đây là luồng chính của feature Event Detail. Nếu người dùng không xem được chi tiết sự kiện, họ không có đủ thông tin để quyết định có apply hay không.

**Independent Test**: Có thể test độc lập bằng cách mở Event Detail của một event public/discoverable và kiểm tra hệ thống hiển thị đầy đủ thông tin chi tiết.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest chưa đăng nhập, **When** người dùng mở Event Detail của event có trạng thái `OPEN`, **Then** hệ thống hiển thị thông tin chi tiết của event mà không yêu cầu đăng nhập.

2. **Given** người dùng là Volunteer đã đăng nhập, **When** người dùng mở Event Detail của event có trạng thái `OPEN`, **Then** hệ thống hiển thị thông tin chi tiết của event.

3. **Given** event có trạng thái `FULL` nhưng vẫn public, **When** người dùng mở Event Detail, **Then** hệ thống vẫn hiển thị thông tin chi tiết của event nhưng thể hiện rằng event không thể apply.

4. **Given** event có trạng thái `ONGOING`, **When** người dùng mở Event Detail, **Then** hệ thống vẫn hiển thị thông tin chi tiết của event nhưng thể hiện rằng event đang diễn ra và không thể apply.

5. **Given** Event Detail được mở từ Event List, **When** người dùng click View Detail từ event card, **Then** hệ thống hiển thị đúng detail của event được chọn.

---

### User Story 2 - Chặn xem chi tiết event không public (Priority: P1)

Là Guest hoặc Volunteer, tôi chỉ nên xem được chi tiết các event public/discoverable, không được xem các event nháp, đã đóng, đã hủy, đã hoàn thành, đã lưu trữ hoặc đã xóa.

**Why this priority**: Đây là rule quan trọng để đảm bảo public user không xem các event không còn phù hợp hoặc không được phép hiển thị.

**Independent Test**: Có thể test độc lập bằng cách thử mở detail của event có status bị ẩn và kiểm tra hệ thống hiển thị not found/unavailable state.

**Acceptance Scenarios**:

1. **Given** event có trạng thái `DRAFT`, **When** Guest hoặc Volunteer mở Event Detail, **Then** hệ thống không hiển thị chi tiết event và hiển thị not found/unavailable state.

2. **Given** event có trạng thái `CLOSED`, **When** Guest hoặc Volunteer mở Event Detail, **Then** hệ thống không hiển thị chi tiết event và hiển thị not found/unavailable state.

3. **Given** event có trạng thái `COMPLETED`, **When** Guest hoặc Volunteer mở Event Detail, **Then** hệ thống không hiển thị chi tiết event và hiển thị not found/unavailable state.

4. **Given** event có trạng thái `CANCELLED`, **When** Guest hoặc Volunteer mở Event Detail, **Then** hệ thống không hiển thị chi tiết event và hiển thị not found/unavailable state.

5. **Given** event có trạng thái `ARCHIVED` hoặc `DELETED`, **When** Guest hoặc Volunteer mở Event Detail, **Then** hệ thống không hiển thị chi tiết event và hiển thị not found/unavailable state.

---

### User Story 3 - Xem đầy đủ thông tin nội dung sự kiện (Priority: P1)

Là Guest hoặc Volunteer, tôi muốn Event Detail hiển thị đầy đủ thông tin sự kiện để hiểu rõ mình sẽ tham gia hoạt động gì, ở đâu, vào thời gian nào và do tổ chức nào phụ trách.

**Why this priority**: Event Card ở Event List chỉ hiển thị thông tin tóm tắt. Event Detail phải cung cấp thông tin đủ sâu để người dùng quyết định có tiếp tục sang luồng apply hay không.

**Independent Test**: Có thể test độc lập bằng cách mở Event Detail và kiểm tra các trường thông tin bắt buộc có xuất hiện.

**Acceptance Scenarios**:

1. **Given** một event public có đầy đủ dữ liệu, **When** Event Detail được hiển thị, **Then** hệ thống hiển thị event title, full description, category, organization summary, date/time, location/address, status, capacity, registered count, remaining slots và required skills.

2. **Given** event có short description, **When** Event Detail được hiển thị, **Then** hệ thống có thể hiển thị short description như phần tóm tắt ngắn của event.

3. **Given** event có image hoặc thumbnail, **When** Event Detail được hiển thị, **Then** image hoặc thumbnail được hiển thị phù hợp.

4. **Given** event không có image hoặc thumbnail, **When** Event Detail được hiển thị, **Then** hệ thống vẫn hiển thị layout ổn định bằng placeholder hoặc bố cục thay thế.

5. **Given** event có location và address detail, **When** Event Detail được hiển thị, **Then** hệ thống hiển thị rõ địa điểm cho người dùng.

---

### User Story 4 - Xem required skills và organization information (Priority: P1)

Là Guest hoặc Volunteer, tôi muốn xem kỹ năng yêu cầu và thông tin tổ chức phụ trách để biết mình có phù hợp với event hay không.

**Why this priority**: Required skills và organization là hai phần quan trọng giúp user đánh giá độ phù hợp và độ tin cậy của event.

**Independent Test**: Có thể test độc lập bằng cách mở Event Detail của event có required skills và organization, sau đó kiểm tra các thông tin này được hiển thị đúng.

**Acceptance Scenarios**:

1. **Given** event có danh sách required skills, **When** Event Detail được hiển thị, **Then** hệ thống hiển thị các required skills của event.

2. **Given** event không có required skills, **When** Event Detail được hiển thị, **Then** hệ thống vẫn hiển thị detail ổn định và có thể thể hiện rằng event không yêu cầu kỹ năng cụ thể.

3. **Given** event thuộc một organization, **When** Event Detail được hiển thị, **Then** hệ thống hiển thị organization name hoặc organization summary.

4. **Given** organization có logo hoặc thông tin mô tả ngắn, **When** Event Detail được hiển thị, **Then** hệ thống có thể hiển thị các thông tin này nếu dữ liệu có sẵn.

---

### User Story 5 - Hiển thị trạng thái event và khả năng apply (Priority: P1)

Là Guest hoặc Volunteer, tôi muốn biết event còn có thể đăng ký hay không để không bị nhầm khi event đã đầy hoặc đang diễn ra.

**Why this priority**: Người dùng cần hiểu rõ event nào còn có thể apply, event nào chỉ còn xem thông tin. Feature này không submit application, nhưng phải hiển thị đúng entry point sang Apply Event.

**Independent Test**: Có thể test độc lập bằng cách mở detail của event `OPEN`, `FULL`, `ONGOING` và kiểm tra trạng thái apply entry point.

**Acceptance Scenarios**:

1. **Given** event có trạng thái `OPEN` và còn slot, **When** Volunteer đã đăng nhập mở Event Detail, **Then** hệ thống hiển thị entry point để đi tiếp sang Apply Event feature.

2. **Given** event có trạng thái `OPEN` và Guest chưa đăng nhập mở Event Detail, **When** Guest muốn apply, **Then** hệ thống yêu cầu đăng nhập hoặc điều hướng sang authentication flow trước khi apply.

3. **Given** event có trạng thái `FULL`, **When** người dùng mở Event Detail, **Then** hệ thống hiển thị event detail nhưng không cho đi tiếp sang apply.

4. **Given** event có trạng thái `ONGOING`, **When** người dùng mở Event Detail, **Then** hệ thống hiển thị event detail nhưng không cho đi tiếp sang apply.

5. **Given** event có capacity, registered count và remaining slots, **When** Event Detail được hiển thị, **Then** hệ thống hiển thị các thông tin này rõ ràng để user biết tình trạng slot.

---

### User Story 6 - Trạng thái loading, unavailable và error (Priority: P2)

Là Guest hoặc Volunteer, tôi muốn hệ thống hiển thị rõ trạng thái đang tải, không tìm thấy hoặc lỗi khi mở Event Detail để không bị nhầm rằng trang bị hỏng.

**Why this priority**: Đây là yêu cầu UX quan trọng để user hiểu trạng thái của hệ thống, nhưng không phải nghiệp vụ lõi như hiển thị event detail public.

**Independent Test**: Có thể test độc lập bằng cách mô phỏng loading, not found/unavailable và error state khi tải event detail.

**Acceptance Scenarios**:

1. **Given** Event Detail đang tải dữ liệu, **When** người dùng mở trang, **Then** hệ thống hiển thị loading state.

2. **Given** event không tồn tại, **When** người dùng mở Event Detail, **Then** hệ thống hiển thị not found state rõ ràng.

3. **Given** event tồn tại nhưng không public/discoverable, **When** người dùng mở Event Detail, **Then** hệ thống hiển thị unavailable hoặc not found state.

4. **Given** dữ liệu event detail không tải được, **When** hệ thống gặp lỗi, **Then** hệ thống hiển thị error state dễ hiểu và không làm crash trang.

---

## Edge Cases

* **Event không tồn tại**: WHEN user mở Event Detail của event không tồn tại, THE system SHALL hiển thị not found state.

* **Event không public/discoverable**: WHERE event có trạng thái `DRAFT`, `CLOSED`, `COMPLETED`, `CANCELLED`, `ARCHIVED`, hoặc `DELETED`, THE system SHALL không hiển thị Event Detail public.

* **Event OPEN**: WHERE event có trạng thái `OPEN`, THE system SHALL hiển thị Event Detail public và có thể hiển thị entry point sang Apply Event.

* **Event FULL**: WHERE event có trạng thái `FULL`, THE system SHALL hiển thị Event Detail public nhưng SHALL thể hiện rằng event không thể apply.

* **Event ONGOING**: WHERE event có trạng thái `ONGOING`, THE system SHALL hiển thị Event Detail public nhưng SHALL thể hiện rằng event đang diễn ra và không thể apply.

* **Event CLOSED**: WHERE event có trạng thái `CLOSED`, THE system SHALL không hiển thị Event Detail public.

* **Event thiếu image**: WHERE event không có image hoặc thumbnail, THE system SHALL hiển thị placeholder hoặc layout thay thế.

* **Event không có required skills**: WHERE event không có required skills, THE system SHALL không làm crash UI và MAY hiển thị thông báo rằng event không yêu cầu kỹ năng cụ thể.

* **Guest bấm Apply**: WHEN Guest muốn apply từ Event Detail, THE system SHALL yêu cầu đăng nhập hoặc điều hướng sang authentication flow trước khi apply.

* **Volunteer bấm Apply trên FULL/ONGOING event**: WHEN Volunteer xem event `FULL` hoặc `ONGOING`, THE system SHALL không cho đi tiếp sang Apply Event.

* **Registered count lớn hơn capacity**: WHERE dữ liệu count bị lệch, THE system SHALL không hiển thị remaining slots âm cho user; UI nên hiển thị remaining slots tối thiểu là 0 hoặc trạng thái full.

* **Event Detail mở bằng link trực tiếp**: WHEN user mở Event Detail bằng link trực tiếp, THE system SHALL vẫn kiểm tra event có public/discoverable hay không trước khi hiển thị.

---

## Requirements

### Functional Requirements

* **FR-001**: WHEN Guest mở Event Detail của event public/discoverable, THE system SHALL hiển thị thông tin chi tiết event mà không yêu cầu đăng nhập.

* **FR-002**: WHEN Volunteer mở Event Detail của event public/discoverable, THE system SHALL hiển thị thông tin chi tiết event.

* **FR-003**: THE system SHALL only display Event Detail publicly for events with status `OPEN`, `FULL`, or `ONGOING`.

* **FR-004**: THE system SHALL NOT display public Event Detail for events with status `DRAFT`, `CLOSED`, `COMPLETED`, `CANCELLED`, `ARCHIVED`, or `DELETED`.

* **FR-005**: WHEN event does not exist, THE system SHALL display not found state.

* **FR-006**: WHEN event exists but is not public/discoverable, THE system SHALL display not found or unavailable state.

* **FR-007**: Event Detail SHALL display event title.

* **FR-008**: Event Detail SHALL display full description.

* **FR-009**: Event Detail MAY display short description as summary text if available.

* **FR-010**: Event Detail SHALL display image or thumbnail if available.

* **FR-011**: IF image or thumbnail is missing, THE system SHALL display placeholder or fallback layout.

* **FR-012**: Event Detail SHALL display category.

* **FR-013**: Event Detail SHALL display organization name or organization summary.

* **FR-014**: Event Detail SHALL display event date/time.

* **FR-015**: Event Detail SHALL display location/address information.

* **FR-016**: Event Detail SHALL display event status.

* **FR-017**: Event Detail SHALL display capacity.

* **FR-018**: Event Detail SHALL display registered count.

* **FR-019**: Event Detail SHALL display remaining slots.

* **FR-020**: Event Detail SHALL display required skills.

* **FR-021**: IF event has no required skills, THE system SHALL keep the layout stable and MAY display a no-specific-skills message.

* **FR-022**: Event Detail SHALL show apply entry point only when the event status and user context allow moving to Apply Event flow.

* **FR-023**: WHERE event status is `OPEN`, THE system MAY show Apply entry point.

* **FR-024**: WHERE event status is `FULL`, THE system SHALL show that the event is full and SHALL NOT allow moving to Apply Event.

* **FR-025**: WHERE event status is `ONGOING`, THE system SHALL show that the event is ongoing and SHALL NOT allow moving to Apply Event.

* **FR-026**: WHEN Guest attempts to apply from Event Detail, THE system SHALL require login or direct the user to authentication flow.

* **FR-027**: WHEN Volunteer clicks Apply on an eligible `OPEN` event, THE system SHALL navigate to or request the Apply Event flow handled by a separate feature.

* **FR-028**: THE system SHALL NOT submit an event application in this feature.

* **FR-029**: THE system SHALL NOT approve, reject, cancel, or manage applications in this feature.

* **FR-030**: WHEN Event Detail is loading, THE system SHALL display loading state.

* **FR-031**: WHEN Event Detail cannot be loaded, THE system SHALL display understandable error state.

* **FR-032**: THE system SHALL NOT rely only on frontend visibility for protected actions. Apply Event authorization must be handled in the Apply Event feature/backend.

* **FR-033**: THE system SHALL treat event status, category, skill, organization, capacity and registered count as shared data owned by other modules until approved contracts or plans define otherwise.

---

### Key Entities

* **Event**: Đại diện cho một sự kiện tình nguyện. Trong feature này, event được hiển thị chi tiết nếu đủ điều kiện public/discoverable.

* **Event Status**: Trạng thái nghiệp vụ của event, dùng để quyết định event có được hiển thị public detail hay không và có thể đi tiếp sang apply hay không.

* **Event Category**: Nhóm phân loại event. Hiển thị trong Event Detail để user hiểu loại sự kiện.

* **Required Skill**: Kỹ năng liên quan hoặc yêu cầu của event. Khác với Event List, required skills cần được hiển thị trong Event Detail.

* **Organization**: Tổ chức phụ trách hoặc quản lý event. Event Detail cần hiển thị thông tin tổ chức để user hiểu nguồn gốc event.

* **Location**: Địa điểm hoặc địa chỉ của event.

* **Capacity**: Số lượng volunteer tối đa event có thể nhận.

* **Registered Count**: Số lượng volunteer đã được ghi nhận vào event theo rule của Application Module.

* **Remaining Slots**: Số slot còn lại, thường được hiểu là capacity trừ registered count.

* **Apply Entry Point**: Hành động hoặc nút giúp user đi tiếp sang Apply Event feature. Đây không phải logic submit application.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: Guest và Volunteer đều có thể xem Event Detail của event `OPEN`, `FULL`, `ONGOING`.

* **SC-002**: 100% event có trạng thái `DRAFT`, `CLOSED`, `COMPLETED`, `CANCELLED`, `ARCHIVED`, hoặc `DELETED` không hiển thị public Event Detail trong acceptance testing.

* **SC-003**: 100% Event Detail hiển thị các thông tin bắt buộc: title, full description, category, organization, date/time, location, status, capacity, registered count, remaining slots và required skills nếu có.

* **SC-004**: Event `FULL` vẫn xem được detail nhưng luôn được thể hiện là không thể apply.

* **SC-005**: Event `ONGOING` vẫn xem được detail nhưng luôn được thể hiện là không thể apply.

* **SC-006**: Event `CLOSED` không xem được public Event Detail.

* **SC-007**: Event không có image vẫn hiển thị layout ổn định bằng placeholder hoặc fallback.

* **SC-008**: Event không có required skills không làm crash giao diện.

* **SC-009**: Guest muốn apply từ event `OPEN` sẽ được yêu cầu đăng nhập hoặc chuyển sang authentication flow.

* **SC-010**: Volunteer xem event `OPEN` có thể thấy entry point sang Apply Event feature.

* **SC-011**: Event không tồn tại hoặc không public/discoverable hiển thị not found/unavailable state thay vì trang trắng.

* **SC-012**: Loading và error states hiển thị rõ ràng khi tải Event Detail.

---

## Assumptions

* **A-001**: Project-level specification đã xác nhận hệ thống có 5 roles: Guest, Volunteer, Staff, Manager, Admin.

* **A-002**: Guest và Volunteer được phép xem Event Detail của event public/discoverable.

* **A-003**: Public/discoverable statuses cho Volunteer-facing flow gồm `OPEN`, `FULL`, `ONGOING`.

* **A-004**: Hidden statuses cho public Event Detail gồm `DRAFT`, `CLOSED`, `COMPLETED`, `CANCELLED`, `ARCHIVED`, `DELETED`.

* **A-005**: Event `FULL` vẫn có thể xem detail nhưng không thể apply.

* **A-006**: Event `ONGOING` vẫn có thể xem detail nhưng không thể apply.

* **A-007**: Event `CLOSED` không hiển thị public Event Detail.

* **A-008**: Apply Event là feature riêng và không được implement trong feature này.

* **A-009**: Event Detail chỉ cung cấp entry point sang Apply Event nếu phù hợp.

* **A-010**: Guest bấm Apply sẽ được yêu cầu đăng nhập hoặc đi qua Authentication flow.

* **A-011**: Volunteer bấm Apply trên event `OPEN` sẽ được chuyển sang Apply Event feature.

* **A-012**: Member 3 — Staff Module là owner chính của event data, event lifecycle/status, capacity và registered count.

* **A-013**: Member 4 — Manager Module là owner chính của category, skill và organization data.

* **A-014**: Registered count và remaining slots có thể được backend/service tính toán dựa trên dữ liệu application sau này.

* **A-015**: Mock data có thể được dùng tạm trong giai đoạn đầu nếu API/data thật chưa sẵn sàng.

* **A-016**: Mobile app support là out of scope. Feature này chỉ nhắm đến web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của Volunteer Event Detail và KHÔNG được implement trong feature này:

* Submit Apply Event
* Application form
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
* Organization Detail page
* Map integration
* Related events / recommended events
* Database schema design
* Database migration
* API endpoint contract
* Backend route definition
* Final UI component architecture
* Implementation task breakdown

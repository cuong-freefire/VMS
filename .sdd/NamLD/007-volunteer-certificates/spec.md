# Feature Specification: Volunteer Certificates

**Feature Branch**: `feat/volunteer-certificates`

**Created**: 2026-06-27

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là Volunteer của VMS, tôi muốn xem danh sách chứng nhận, xem chi tiết chứng nhận và tải chứng nhận sau khi đã tham gia event hợp lệ."

---

## User Scenarios & Testing

### User Story 1 - Volunteer xem danh sách certificate của mình (Priority: P1)

Là Volunteer đã đăng nhập, tôi muốn xem danh sách certificate của mình để biết tôi đã nhận được chứng nhận từ những event nào.

**Why this priority**: Certificate là bằng chứng ghi nhận sự tham gia của Volunteer. Volunteer cần một nơi để xem toàn bộ certificate thuộc về mình.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập bằng tài khoản Volunteer có certificate và mở Certificate List page.

**Acceptance Scenarios**:

1. **Given** người dùng là Volunteer đã đăng nhập, **When** người dùng mở Certificate List page, **Then** hệ thống hiển thị danh sách certificate thuộc về Volunteer đó.

2. **Given** Volunteer có nhiều certificate, **When** Certificate List page được hiển thị, **Then** hệ thống hiển thị từng certificate item kèm thông tin tóm tắt.

3. **Given** Volunteer chưa có certificate nào, **When** Volunteer mở Certificate List page, **Then** hệ thống hiển thị empty state rõ ràng.

4. **Given** certificate thuộc về Volunteer khác, **When** Volunteer hiện tại mở Certificate List page, **Then** hệ thống không hiển thị certificate đó.

---

### User Story 2 - Bảo vệ quyền truy cập certificate (Priority: P1)

Là hệ thống, tôi cần đảm bảo chỉ Volunteer đã đăng nhập mới được xem và tải certificate của chính mình.

**Why this priority**: Certificate là dữ liệu cá nhân. Guest hoặc user khác không được xem/tải certificate không thuộc về mình.

**Independent Test**: Có thể test độc lập bằng cách thử mở Certificate List/Detail bằng Guest, Staff, Manager, Admin và Volunteer khác.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest chưa đăng nhập, **When** người dùng mở Certificate List page, **Then** hệ thống yêu cầu đăng nhập hoặc điều hướng sang Authentication flow.

2. **Given** người dùng đã đăng nhập nhưng không có role `VOLUNTEER`, **When** người dùng mở Volunteer Certificate page, **Then** hệ thống chặn truy cập và hiển thị forbidden state hoặc message phù hợp.

3. **Given** người dùng là Volunteer đã đăng nhập, **When** người dùng mở Certificate List page, **Then** hệ thống chỉ hiển thị certificate của chính Volunteer đó.

4. **Given** Volunteer cố mở Certificate Detail của certificate không thuộc về mình, **When** request được xử lý, **Then** hệ thống không hiển thị certificate đó.

5. **Given** Volunteer cố download certificate không thuộc về mình, **When** request được xử lý, **Then** hệ thống chặn download.

---

### User Story 3 - Xem thông tin tóm tắt certificate trong Certificate List (Priority: P1)

Là Volunteer, tôi muốn mỗi certificate item hiển thị thông tin tóm tắt để biết certificate đó thuộc event nào và có thể tải được hay chưa.

**Why this priority**: Certificate List cần đủ thông tin để Volunteer nhận biết certificate trước khi mở detail hoặc download.

**Independent Test**: Có thể test độc lập bằng cách mở Certificate List và kiểm tra các field summary trên từng certificate item.

**Acceptance Scenarios**:

1. **Given** một certificate item được hiển thị, **When** Volunteer xem item đó, **Then** hệ thống hiển thị certificate title hoặc event title.

2. **Given** certificate có event liên quan, **When** certificate item được hiển thị, **Then** hệ thống hiển thị event title.

3. **Given** event có organization, **When** certificate item được hiển thị, **Then** hệ thống hiển thị organization.

4. **Given** event có date/time, **When** certificate item được hiển thị, **Then** hệ thống hiển thị event date hoặc completion date nếu có.

5. **Given** certificate có issue date, **When** certificate item được hiển thị, **Then** hệ thống hiển thị issue date.

6. **Given** certificate có status, **When** certificate item được hiển thị, **Then** hệ thống hiển thị certificate status.

7. **Given** certificate có file/download URL hợp lệ, **When** certificate item được hiển thị, **Then** hệ thống có thể hiển thị View hoặc Download action.

---

### User Story 4 - Volunteer xem Certificate Detail (Priority: P1)

Là Volunteer, tôi muốn xem chi tiết certificate để kiểm tra thông tin chứng nhận trước khi tải về.

**Why this priority**: Certificate Detail giúp Volunteer xác nhận đúng event, đúng tên và đúng thông tin certificate.

**Independent Test**: Có thể test độc lập bằng cách mở Certificate Detail của một certificate thuộc Volunteer hiện tại.

**Acceptance Scenarios**:

1. **Given** certificate thuộc về Volunteer hiện tại, **When** Volunteer mở Certificate Detail, **Then** hệ thống hiển thị chi tiết certificate.

2. **Given** Certificate Detail được hiển thị, **When** dữ liệu có sẵn, **Then** hệ thống hiển thị certificate title.

3. **Given** Certificate Detail được hiển thị, **When** dữ liệu có sẵn, **Then** hệ thống hiển thị event title.

4. **Given** Certificate Detail được hiển thị, **When** dữ liệu có sẵn, **Then** hệ thống hiển thị Volunteer name.

5. **Given** Certificate Detail được hiển thị, **When** dữ liệu có sẵn, **Then** hệ thống hiển thị organization.

6. **Given** Certificate Detail được hiển thị, **When** dữ liệu có sẵn, **Then** hệ thống hiển thị event date hoặc completion date.

7. **Given** Certificate Detail được hiển thị, **When** dữ liệu có sẵn, **Then** hệ thống hiển thị issue date.

8. **Given** Certificate Detail được hiển thị, **When** certificate code có sẵn, **Then** hệ thống hiển thị certificate code.

9. **Given** Certificate Detail được hiển thị, **When** certificate file có sẵn, **Then** hệ thống hiển thị download action.

---

### User Story 5 - Volunteer download certificate (Priority: P1)

Là Volunteer, tôi muốn tải certificate của mình để lưu lại hoặc sử dụng khi cần.

**Why this priority**: Download Certificate là use case chính của Certificate Management phía Volunteer.

**Independent Test**: Có thể test độc lập bằng cách click Download trên một certificate có file URL hợp lệ.

**Acceptance Scenarios**:

1. **Given** certificate thuộc về Volunteer hiện tại, **And** certificate có file/download URL hợp lệ, **When** Volunteer click Download, **Then** hệ thống cho phép tải certificate.

2. **Given** certificate chưa có file/download URL, **When** Volunteer xem certificate, **Then** hệ thống không hiển thị download action hoặc hiển thị trạng thái chưa sẵn sàng.

3. **Given** download certificate thất bại, **When** hệ thống nhận lỗi, **Then** hệ thống hiển thị download error message rõ ràng.

4. **Given** Volunteer cố download certificate không thuộc về mình, **When** request được xử lý, **Then** hệ thống chặn download.

---

### User Story 6 - Chỉ hiển thị certificate đã được tạo bởi Staff (Priority: P1)

Là hệ thống, tôi cần đảm bảo Volunteer Certificates chỉ hiển thị certificate đã được tạo hợp lệ, còn Generate Certificate thuộc Staff Module.

**Why this priority**: Theo docs mới, Staff là người tạo certificate cho Volunteer đã điểm danh. Member 2 chỉ làm phần Volunteer xem/tải certificate.

**Independent Test**: Có thể test độc lập bằng cách kiểm tra certificate list không có chức năng generate certificate.

**Acceptance Scenarios**:

1. **Given** Staff đã tạo certificate cho Volunteer đã điểm danh, **When** Volunteer mở Certificate List, **Then** certificate đó được hiển thị.

2. **Given** Volunteer chưa được tạo certificate cho event, **When** Volunteer mở Certificate List, **Then** event đó không xuất hiện như một certificate downloadable.

3. **Given** Volunteer đang ở Certificate List hoặc Detail, **When** UI hiển thị actions, **Then** hệ thống không hiển thị Generate Certificate action.

4. **Given** Volunteer muốn có certificate nhưng Staff chưa tạo, **When** certificate chưa available, **Then** hệ thống chỉ hiển thị trạng thái phù hợp nếu dữ liệu có sẵn, không tự tạo certificate.

---

### User Story 7 - Enforce one certificate per Volunteer per event (Priority: P1)

Là hệ thống, tôi cần đảm bảo mỗi Volunteer chỉ có một certificate cho mỗi event để tránh duplicate certificate.

**Why this priority**: Docs mới chốt mỗi Volunteer chỉ có 1 certificate/sự kiện. Rule này giúp dữ liệu certificate rõ ràng và tránh trùng lặp.

**Independent Test**: Có thể test độc lập bằng cách kiểm tra dữ liệu certificate không hiển thị duplicate cho cùng Volunteer và event.

**Acceptance Scenarios**:

1. **Given** Volunteer có một certificate cho event, **When** Certificate List được hiển thị, **Then** hệ thống hiển thị một certificate item cho event đó.

2. **Given** dữ liệu có duplicate certificate cho cùng Volunteer và cùng event do lỗi, **When** Certificate List được hiển thị, **Then** hệ thống nên tránh hiển thị trùng lặp hoặc hiển thị theo rule được backend cung cấp.

3. **Given** Volunteer mở Certificate Detail, **When** certificate được hiển thị, **Then** certificate đại diện cho một event cụ thể của Volunteer đó.

---

### User Story 8 - Loading, empty, error và download states (Priority: P2)

Là Volunteer, tôi muốn hệ thống hiển thị rõ trạng thái đang tải, chưa có certificate, lỗi tải dữ liệu hoặc lỗi download để không bị nhầm rằng trang bị hỏng.

**Why this priority**: Certificate List/Detail phụ thuộc vào dữ liệu và file. UI cần phản hồi rõ khi dữ liệu chưa có hoặc download thất bại.

**Independent Test**: Có thể test độc lập bằng cách mô phỏng loading, empty, error và download error states.

**Acceptance Scenarios**:

1. **Given** Certificate List đang tải dữ liệu, **When** Volunteer mở page, **Then** hệ thống hiển thị loading state.

2. **Given** Volunteer chưa có certificate nào, **When** Certificate List được hiển thị, **Then** hệ thống hiển thị empty state.

3. **Given** Certificate List tải thất bại, **When** hệ thống gặp lỗi, **Then** hệ thống hiển thị error state dễ hiểu.

4. **Given** Certificate Detail đang tải dữ liệu, **When** Volunteer mở detail, **Then** hệ thống hiển thị loading state.

5. **Given** certificate không tồn tại hoặc không thuộc Volunteer hiện tại, **When** Volunteer mở Certificate Detail, **Then** hệ thống hiển thị not found/unavailable state.

6. **Given** download certificate thất bại, **When** hệ thống gặp lỗi download, **Then** hệ thống hiển thị download error message.

---

### User Story 9 - Liên kết từ Volunteer History sang Certificate (Priority: P2)

Là Volunteer, tôi muốn từ Volunteer History có thể đi tới certificate nếu certificate của event đó đã sẵn sàng.

**Why this priority**: Volunteer History là nơi Volunteer xem lại event đã tham gia. Nếu certificate đã có, việc dẫn sang Certificate giúp UX tốt hơn.

**Independent Test**: Có thể test độc lập bằng cách mở Volunteer History item có certificate available và click Certificate action.

**Acceptance Scenarios**:

1. **Given** Volunteer History item có certificate available, **When** Volunteer click Certificate action, **Then** hệ thống điều hướng sang Certificate Detail hoặc Certificate List phù hợp.

2. **Given** Volunteer History item chưa có certificate, **When** history item được hiển thị, **Then** hệ thống không hiển thị download action trực tiếp hoặc hiển thị trạng thái chưa có certificate.

3. **Given** Certificate feature chưa có dữ liệu, **When** Volunteer đi từ History sang Certificate, **Then** hệ thống hiển thị empty/unavailable state phù hợp.

---

## Edge Cases

* **Guest mở Certificate List**: WHEN Guest mở Certificate List, THE system SHALL yêu cầu đăng nhập hoặc điều hướng sang Authentication flow.

* **User không phải Volunteer mở Certificate List**: WHEN authenticated user không có role `VOLUNTEER` mở Certificate List, THE system SHALL chặn truy cập.

* **Volunteer xem certificate của người khác**: WHERE certificate không thuộc Volunteer hiện tại, THE system SHALL không hiển thị certificate đó.

* **Volunteer download certificate của người khác**: WHEN Volunteer cố download certificate không thuộc về mình, THE system SHALL chặn download.

* **Volunteer chưa có certificate**: WHEN Volunteer chưa có certificate nào, THE system SHALL hiển thị empty state.

* **Certificate không tồn tại**: WHEN certificate id không tồn tại, THE system SHALL hiển thị not found/unavailable state.

* **Certificate chưa có file URL**: WHERE certificate chưa có file/download URL, THE system SHALL không hiển thị download action hoặc hiển thị trạng thái chưa sẵn sàng.

* **Certificate file URL hỏng**: WHEN download certificate thất bại, THE system SHALL hiển thị download error message.

* **Certificate status chưa available**: WHERE certificate status không phải available, THE system SHALL không cho download nếu file chưa hợp lệ.

* **Certificate bị revoked nếu có status này**: WHERE certificate status là `REVOKED`, THE system SHALL không cho download hoặc hiển thị trạng thái đã thu hồi nếu team dùng status này.

* **Duplicate certificate data**: WHERE có nhiều certificate cho cùng Volunteer và cùng event do lỗi dữ liệu, THE system SHALL tránh hiển thị trùng lặp nếu backend/API đã xử lý; otherwise UI should not crash.

* **Event bị archived/soft-deleted sau khi certificate tạo**: WHERE event không còn public, THE system MAY still show certificate if certificate record exists and belongs to Volunteer.

* **Cloudinary/file storage error**: WHEN file storage không phản hồi hoặc URL lỗi, THE system SHALL show download/file error state.

---

## Requirements

### Functional Requirements

* **FR-001**: THE system SHALL allow only authenticated users with role `VOLUNTEER` to view Volunteer Certificates.

* **FR-002**: WHEN Guest attempts to open Certificate List or Detail, THE system SHALL require login/register or redirect to Authentication flow.

* **FR-003**: WHEN authenticated user is not `VOLUNTEER`, THE system SHALL block access to Volunteer Certificates flow.

* **FR-004**: THE system SHALL show only certificates that belong to the current authenticated Volunteer.

* **FR-005**: THE system SHALL NOT show certificates of other Volunteers.

* **FR-006**: THE system SHALL NOT allow Volunteer to download certificate of another Volunteer.

* **FR-007**: Certificate List SHALL display certificates created for the current Volunteer.

* **FR-008**: EACH certificate item SHALL display certificate summary.

* **FR-009**: Certificate summary SHALL include certificate title or event title.

* **FR-010**: Certificate summary SHOULD include organization if available.

* **FR-011**: Certificate summary SHOULD include event date or completion date if available.

* **FR-012**: Certificate summary SHOULD include issue date if available.

* **FR-013**: Certificate summary SHOULD include certificate status if available.

* **FR-014**: Certificate summary MAY include View Detail action.

* **FR-015**: Certificate summary MAY include Download action when certificate file/download URL is available.

* **FR-016**: THE system SHALL allow Volunteer to open Certificate Detail for certificate that belongs to them.

* **FR-017**: Certificate Detail SHALL display certificate information.

* **FR-018**: Certificate Detail SHOULD display certificate title.

* **FR-019**: Certificate Detail SHOULD display event title.

* **FR-020**: Certificate Detail SHOULD display Volunteer name.

* **FR-021**: Certificate Detail SHOULD display organization.

* **FR-022**: Certificate Detail SHOULD display event date or completion date.

* **FR-023**: Certificate Detail SHOULD display issue date.

* **FR-024**: Certificate Detail MAY display certificate code if available.

* **FR-025**: Certificate Detail SHOULD display certificate status if available.

* **FR-026**: THE system SHALL allow Volunteer to download certificate only when certificate belongs to current Volunteer and has valid file/download URL.

* **FR-027**: IF certificate has no valid file/download URL, THE system SHALL not show Download action or SHALL show not available state.

* **FR-028**: WHEN certificate download fails, THE system SHALL show understandable download error message.

* **FR-029**: THE system SHALL NOT generate certificate in this feature.

* **FR-030**: THE system SHALL NOT show Generate Certificate action in Volunteer Certificates.

* **FR-031**: THE system SHALL treat certificate as generated by Staff Module.

* **FR-032**: THE system SHALL treat certificate eligibility as based on successful attendance according to Staff/Attendance Module.

* **FR-033**: THE system SHALL support the rule that each Volunteer has only one certificate per event.

* **FR-034**: THE system SHALL show loading state while Certificate List or Detail is loading.

* **FR-035**: WHEN Volunteer has no certificates, THE system SHALL display empty state.

* **FR-036**: WHEN Certificate List cannot be loaded, THE system SHALL display understandable error state.

* **FR-037**: WHEN Certificate Detail cannot be loaded or certificate is not available to current Volunteer, THE system SHALL display not found/unavailable state.

* **FR-038**: THE system MAY allow navigation from Volunteer History to Certificate Detail or Certificate List when certificate is available.

* **FR-039**: THE system SHALL NOT perform Attendance Check-in in this feature.

* **FR-040**: THE system SHALL NOT submit feedback in this feature.

* **FR-041**: THE system SHALL NOT create application or cancel application in this feature.

* **FR-042**: THE system SHALL NOT rely only on frontend validation. Backend/API must enforce authentication, role, ownership and download permission.

* **FR-043**: THE system SHALL treat certificate file URL, certificate status and certificate ownership as shared data owned by related modules until final API/data contracts are approved.

---

### Key Entities

* **Guest**: Unauthenticated user. Guest is not stored as a database role and cannot view or download certificates.

* **Volunteer**: Authenticated user with role `VOLUNTEER` who can view and download their own certificates.

* **Staff**: Authenticated user with role `STAFF` who generates certificates in Staff Module.

* **Certificate**: Record or file representing recognition for Volunteer participation in an event.

* **Certificate List**: List of certificates belonging to the current Volunteer.

* **Certificate Detail**: Detailed view of one certificate.

* **Download Certificate**: Action that allows Volunteer to download their own certificate file.

* **Certificate File / Download URL**: File or URL used to download certificate, potentially stored using Cloudinary or another storage service.

* **Certificate Status**: Status of certificate, such as `AVAILABLE`, `NOT_AVAILABLE`, `GENERATING`, or `REVOKED` if team uses these values.

* **Event**: Volunteer event linked to the certificate.

* **Successful Attendance**: Attendance condition that allows Staff to generate certificate.

* **Certificate Ownership**: Rule that a Volunteer can only view/download certificates that belong to them.

* **One Certificate Per Event Rule**: Rule that each Volunteer has only one certificate for each event.

* **Volunteer History**: Feature that may link to certificate when certificate is available.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: 100% Guest users are blocked from viewing/downloading certificates and are asked to login/register.

* **SC-002**: 100% authenticated non-Volunteer users are blocked from Volunteer Certificates flow.

* **SC-003**: 100% Volunteer users can view only their own certificates.

* **SC-004**: 0 certificates from other Volunteers are displayed to the current Volunteer.

* **SC-005**: Volunteer cannot download certificates that do not belong to them.

* **SC-006**: Certificate List displays certificate summary for available certificates.

* **SC-007**: Certificate Detail displays certificate and related event information.

* **SC-008**: Download action is available only when certificate has valid file/download URL.

* **SC-009**: Certificate with missing file/download URL does not crash UI and shows unavailable state.

* **SC-010**: Volunteer with no certificates sees empty state instead of blank page.

* **SC-011**: Loading, error, not found/unavailable and download error states are displayed clearly.

* **SC-012**: Volunteer Certificates feature does not generate certificates, perform attendance check-in, submit feedback, apply event or cancel application.

* **SC-013**: Each Volunteer has at most one certificate per event according to the final data/API rule.

---

## Assumptions

* **A-001**: Guest is not stored as a database role.

* **A-002**: Database roles are `VOLUNTEER`, `STAFF`, `MANAGER`, and `ADMIN`.

* **A-003**: Volunteer Certificates belongs to Member 2 — Volunteer Event Module.

* **A-004**: Volunteer Certificates corresponds to UC51 — View Certificates and UC52 — Download Certificate.

* **A-005**: Certificate Detail is included in Member 2 screen scope.

* **A-006**: Volunteer Certificates requires authenticated Volunteer.

* **A-007**: Guest cannot view or download certificates.

* **A-008**: Authenticated non-Volunteer user cannot use Volunteer Certificates flow.

* **A-009**: Volunteer can view and download only their own certificates.

* **A-010**: Certificate is generated by Staff Module, not by this feature.

* **A-011**: Staff can generate certificate only for Volunteer who attended successfully.

* **A-012**: Each Volunteer has only one certificate for each event.

* **A-013**: Certificate may be stored as a PDF file, image file, or record with downloadable URL.

* **A-014**: Cloudinary may be used to store certificate files if the team implements file storage.

* **A-015**: Certificate List shows certificates that already exist.

* **A-016**: Certificate status values may be simplified in the first version.

* **A-017**: Download action requires valid file/download URL.

* **A-018**: Volunteer History may link to Certificate Detail when certificate is available.

* **A-019**: Backend/API must be the final authority for ownership, visibility and download permission.

* **A-020**: Mock data can be used temporarily if API/data are not ready.

* **A-021**: Mobile app support is out of scope. Feature targets web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của Volunteer Certificates và KHÔNG được implement trong feature này:

* Event List
* Search Event
* Filter Event
* Event Detail full display
* Apply Event submission
* Application form
* Applied Event List
* Cancel Application
* Volunteer History full display
* Feedback Form submission
* Feedback List
* Feedback Detail
* Attendance Check-in
* Attendance Management
* Attendance List
* Staff Application List
* Staff Application Detail
* Approve Application
* Reject Application
* Generate Certificate
* Staff Certificate Management
* Staff Add Event
* Staff Edit Event
* Staff Delete Event
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

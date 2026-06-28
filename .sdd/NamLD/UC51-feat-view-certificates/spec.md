# Feature Specification: View Certificates

**Feature Branch**: `feat/view-certificates`

**Created**: 2026-06-27

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là Volunteer đã đăng nhập, tôi muốn xem danh sách certificate của mình để biết những chứng nhận tôi đã nhận được sau khi tham gia event."

---

## User Scenarios & Testing

### User Story 1 - Volunteer xem danh sách certificate của mình (Priority: P1)

Là Volunteer đã đăng nhập, tôi muốn xem danh sách certificate của mình để biết các event mà tôi đã được cấp chứng nhận.

**Why this priority**: Certificate là kết quả ghi nhận sau khi Volunteer tham gia event hợp lệ. Volunteer cần một nơi để xem các certificate đã nhận.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập bằng tài khoản Volunteer có certificate và mở Certificates page.

**Acceptance Scenarios**:

1. **Given** người dùng là Volunteer đã đăng nhập, **When** Volunteer mở Certificates page, **Then** hệ thống hiển thị danh sách certificate thuộc về Volunteer hiện tại.

2. **Given** Volunteer có nhiều certificate, **When** Certificates page hiển thị, **Then** mỗi certificate item hiển thị thông tin tóm tắt phù hợp.

3. **Given** Volunteer chưa có certificate nào, **When** Certificates page hiển thị, **Then** hệ thống hiển thị empty state phù hợp.

4. **Given** hệ thống tải danh sách certificate thất bại, **When** lỗi xảy ra, **Then** hệ thống hiển thị error state dễ hiểu.

---

### User Story 2 - Chỉ Volunteer đã đăng nhập được xem certificate (Priority: P1)

Là hệ thống, tôi cần đảm bảo certificate chỉ được xem bởi Volunteer đã đăng nhập vì đây là dữ liệu cá nhân.

**Why this priority**: Certificate gắn với thông tin cá nhân và quá trình tham gia event của Volunteer. Guest hoặc user không đúng role không được xem dữ liệu này.

**Independent Test**: Có thể test độc lập bằng cách thử mở Certificates page bằng Guest, Volunteer, Staff, Manager và Admin.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest, **When** người dùng mở Certificates page, **Then** hệ thống yêu cầu login/register hoặc điều hướng sang Authentication flow.

2. **Given** người dùng đăng nhập với role `VOLUNTEER`, **When** người dùng mở Certificates page, **Then** hệ thống cho phép xem certificate của chính mình.

3. **Given** người dùng đăng nhập với role `STAFF`, **When** người dùng mở Certificates page theo Volunteer flow, **Then** hệ thống chặn truy cập.

4. **Given** người dùng đăng nhập với role `MANAGER` hoặc `ADMIN`, **When** người dùng mở Certificates page theo Volunteer flow, **Then** hệ thống chặn truy cập.

---

### User Story 3 - Volunteer chỉ xem được certificate của chính mình (Priority: P1)

Là Volunteer, tôi chỉ được xem certificate thuộc về tài khoản của tôi, không được xem certificate của Volunteer khác.

**Why this priority**: Đây là yêu cầu bảo mật và ownership dữ liệu. Nếu Volunteer xem được certificate của người khác, hệ thống bị lộ dữ liệu cá nhân.

**Independent Test**: Có thể test bằng cách có hai tài khoản Volunteer khác nhau, mỗi tài khoản có certificate riêng, sau đó kiểm tra dữ liệu hiển thị.

**Acceptance Scenarios**:

1. **Given** Volunteer A có certificate, **When** Volunteer A mở Certificates page, **Then** hệ thống hiển thị certificate của Volunteer A.

2. **Given** Volunteer B có certificate khác, **When** Volunteer A mở Certificates page, **Then** hệ thống không hiển thị certificate của Volunteer B.

3. **Given** request cố truy cập certificate không thuộc current Volunteer, **When** backend/API xử lý, **Then** hệ thống chặn quyền truy cập.

4. **Given** frontend nhận dữ liệu từ API, **When** Certificates page hiển thị, **Then** frontend chỉ render dữ liệu được phép của current Volunteer.

---

### User Story 4 - Xem thông tin tóm tắt của certificate (Priority: P1)

Là Volunteer, tôi muốn xem thông tin tóm tắt của từng certificate để biết certificate đó thuộc event nào và trạng thái hiện tại ra sao.

**Why this priority**: Nếu chỉ hiển thị file certificate mà không có thông tin event, Volunteer sẽ khó nhận biết certificate tương ứng với event nào.

**Independent Test**: Có thể test bằng cách mở Certificates page và kiểm tra thông tin trong từng certificate item.

**Acceptance Scenarios**:

1. **Given** certificate có đầy đủ dữ liệu, **When** Certificates page hiển thị, **Then** hệ thống hiển thị certificate title hoặc event title.

2. **Given** certificate có dữ liệu event, **When** certificate item hiển thị, **Then** hệ thống hiển thị event title.

3. **Given** certificate có dữ liệu organization, **When** certificate item hiển thị, **Then** hệ thống hiển thị organization.

4. **Given** certificate có issue date, **When** certificate item hiển thị, **Then** hệ thống hiển thị issue date.

5. **Given** certificate có status, **When** certificate item hiển thị, **Then** hệ thống hiển thị certificate status phù hợp.

---

### User Story 5 - Xem Certificate Detail hoặc Preview nếu có (Priority: P2)

Là Volunteer, tôi muốn xem chi tiết hoặc preview certificate để kiểm tra thông tin chứng nhận trước khi tải xuống.

**Why this priority**: Certificate Detail/Preview giúp Volunteer kiểm tra thông tin như tên event, ngày cấp, mã certificate và trạng thái trước khi download.

**Independent Test**: Có thể test bằng cách click View Detail/Preview trên certificate item.

**Acceptance Scenarios**:

1. **Given** certificate có detail data, **When** Volunteer click View Detail hoặc Preview, **Then** hệ thống hiển thị thông tin chi tiết certificate.

2. **Given** Certificate Detail hiển thị, **When** dữ liệu có sẵn, **Then** hệ thống hiển thị event title, Volunteer name, organization, issue date, certificate code và status nếu có.

3. **Given** certificate thiếu optional data như certificate code hoặc organization, **When** detail hiển thị, **Then** UI không crash và hiển thị fallback phù hợp.

4. **Given** certificate không thuộc current Volunteer, **When** user cố mở detail, **Then** backend/API chặn quyền truy cập.

---

### User Story 6 - Hiển thị download action nhưng logic download thuộc UC52 (Priority: P1)

Là Volunteer, tôi muốn thấy action download nếu certificate đã có file hợp lệ, nhưng việc xử lý download chi tiết thuộc UC52.

**Why this priority**: UC51 và UC52 liên quan chặt chẽ. Volunteer thường xem certificate rồi download ngay, nhưng docs vẫn tách use case để rõ trách nhiệm.

**Independent Test**: Có thể test bằng cách mở Certificates page với certificate có file và không có file.

**Acceptance Scenarios**:

1. **Given** certificate có file/download URL hợp lệ, **When** Certificates page hiển thị, **Then** hệ thống có thể hiển thị Download action.

2. **Given** certificate chưa có file hợp lệ, **When** Certificates page hiển thị, **Then** hệ thống không cho download như certificate available bình thường.

3. **Given** Volunteer click Download action, **When** hệ thống xử lý, **Then** logic download thuộc UC52 — Download Certificate.

4. **Given** Codex sinh code cho UC51 và UC52, **When** implementation được tạo, **Then** Codex nên đặt download action trong Certificates page hoặc Certificate Detail, không tạo page riêng chỉ để download nếu không cần.

---

### User Story 7 - Hiển thị certificate status rõ ràng (Priority: P2)

Là Volunteer, tôi muốn biết certificate đang available, chưa available, đang generating hoặc bị revoked để không hiểu nhầm trạng thái certificate.

**Why this priority**: Không phải certificate nào cũng có thể xem/download ngay. Nếu trạng thái không rõ, Volunteer có thể nghĩ hệ thống bị lỗi.

**Independent Test**: Có thể test bằng cách tạo certificate với các status khác nhau và kiểm tra UI.

**Acceptance Scenarios**:

1. **Given** certificate có status `AVAILABLE`, **When** Certificates page hiển thị, **Then** hệ thống hiển thị certificate là available.

2. **Given** certificate có status `GENERATING` hoặc chưa có file, **When** Certificates page hiển thị, **Then** hệ thống hiển thị trạng thái chưa sẵn sàng hoặc đang tạo.

3. **Given** certificate có status `REVOKED`, **When** Certificates page hiển thị, **Then** hệ thống hiển thị trạng thái revoked/unavailable rõ ràng.

4. **Given** certificate không có status data, **When** Certificates page hiển thị, **Then** hệ thống dùng fallback status phù hợp hoặc không hiển thị status.

---

### User Story 8 - UC51 và UC52 dùng chung màn Certificates (Priority: P1)

Là hệ thống, tôi cần đảm bảo View Certificates và Download Certificate được implement chung trong cùng Certificates page hoặc Certificate Detail thay vì tạo flow rời rạc không cần thiết.

**Why this priority**: Team tách docs theo từng UC, nhưng UC51 và UC52 là cùng một trải nghiệm người dùng. Nếu Codex tạo page riêng chỉ để download certificate thì sai flow và dễ trùng code.

**Independent Test**: Có thể test bằng cách kiểm tra Download action nằm trong Certificates page hoặc Certificate Detail.

**Acceptance Scenarios**:

1. **Given** Certificates page được hiển thị, **When** certificate có file hợp lệ, **Then** Download action xuất hiện trong certificate item hoặc Certificate Detail.

2. **Given** Codex sinh code cho UC51 và UC52, **When** implementation được tạo, **Then** Codex không nên tạo standalone page chỉ để download certificate.

3. **Given** UC52 được implement, **When** download thành công hoặc thất bại, **Then** Certificates page hoặc Certificate Detail hiển thị trạng thái phù hợp.

---

### User Story 9 - Loading, empty, unavailable và error states (Priority: P2)

Là Volunteer, tôi muốn Certificates page hiển thị rõ trạng thái đang tải, chưa có certificate, certificate không khả dụng hoặc lỗi hệ thống.

**Why this priority**: Certificates phụ thuộc dữ liệu được generate từ Staff module. UI cần phản hồi rõ ràng khi chưa có dữ liệu hoặc có lỗi.

**Independent Test**: Có thể test bằng cách mock loading, empty, unavailable và error states.

**Acceptance Scenarios**:

1. **Given** certificate list đang tải dữ liệu, **When** Volunteer mở Certificates page, **Then** hệ thống hiển thị loading state.

2. **Given** Volunteer chưa có certificate nào, **When** page tải xong, **Then** hệ thống hiển thị empty state.

3. **Given** certificate không tồn tại hoặc không thuộc current Volunteer, **When** Volunteer mở detail, **Then** hệ thống hiển thị not found/unavailable state.

4. **Given** hệ thống không tải được certificate list/detail, **When** lỗi xảy ra, **Then** hệ thống hiển thị error state.

5. **Given** certificate thiếu optional data, **When** page hiển thị, **Then** UI không crash và hiển thị fallback phù hợp.

---

## Edge Cases

* **Guest mở Certificates page**: Hệ thống yêu cầu login/register hoặc điều hướng sang Authentication flow.

* **Staff mở Volunteer Certificates page**: Hệ thống chặn vì UC51 là Volunteer flow.

* **Manager/Admin mở Volunteer Certificates page**: Hệ thống chặn vì không phải Volunteer flow.

* **Volunteer chưa có certificate**: Hệ thống hiển thị empty state.

* **Volunteer có nhiều certificate**: Hệ thống hiển thị danh sách có pagination hoặc loading strategy nếu cần.

* **Certificate thuộc Volunteer khác**: Backend/API không được trả về cho current Volunteer.

* **Certificate không tồn tại**: Hệ thống hiển thị not found hoặc unavailable state.

* **Certificate chưa có file hợp lệ**: Hệ thống hiển thị trạng thái chưa available, không cho download như file hợp lệ.

* **Certificate bị revoked**: Hệ thống hiển thị trạng thái revoked/unavailable rõ ràng.

* **Certificate thiếu optional data**: UI không crash và dùng fallback phù hợp.

* **Certificate thiếu organization hoặc certificate code**: UI không được crash, chỉ không hiển thị hoặc hiển thị fallback.

* **Certificate list tải thất bại**: Hệ thống hiển thị error state.

* **Volunteer click Download action**: Logic download thuộc UC52, không phải UC51.

* **Staff chưa generate certificate**: Volunteer chưa thấy certificate hoặc thấy empty/unavailable state tùy dữ liệu.

---

## Requirements

### Functional Requirements

* **FR-001**: THE system SHALL allow only authenticated users with role `VOLUNTEER` to view certificates through UC51.

* **FR-002**: THE system SHALL NOT allow Guest to view certificates.

* **FR-003**: WHEN Guest attempts to view certificates, THE system SHALL require login/register or navigate to Authentication flow.

* **FR-004**: THE system SHALL NOT allow Staff, Manager or Admin to access Volunteer View Certificates through UC51.

* **FR-005**: THE system SHALL display only certificates that belong to the current authenticated Volunteer.

* **FR-006**: THE system SHALL NOT display certificates belonging to other Volunteers.

* **FR-007**: THE system SHALL display a list of certificates for the current Volunteer.

* **FR-008**: Each certificate item SHOULD display certificate title or event title.

* **FR-009**: Each certificate item SHOULD display related event title.

* **FR-010**: Each certificate item SHOULD display organization if available.

* **FR-011**: Each certificate item SHOULD display issue date if available.

* **FR-012**: Each certificate item SHOULD display certificate status if available.

* **FR-013**: Each certificate item MAY display certificate code if available.

* **FR-014**: THE system MAY provide Certificate Detail or Preview inside UC51.

* **FR-015**: Certificate Detail SHOULD display event title if available.

* **FR-016**: Certificate Detail MAY display Volunteer name.

* **FR-017**: Certificate Detail MAY display organization.

* **FR-018**: Certificate Detail MAY display issue date.

* **FR-019**: Certificate Detail MAY display certificate code.

* **FR-020**: Certificate Detail SHOULD display certificate status if available.

* **FR-021**: THE system MAY display Download action when certificate has valid file/download data.

* **FR-022**: THE system SHALL treat actual download processing as UC52 — Download Certificate.

* **FR-023**: THE system SHALL NOT download certificate as part of UC51 core view logic.

* **FR-024**: THE system SHOULD implement UC51 and UC52 on the same Certificates page or Certificate Detail when possible.

* **FR-025**: THE system SHOULD NOT create a standalone page only for Download Certificate if the action can be handled inside Certificates page/detail.

* **FR-026**: THE system SHALL NOT generate certificate in UC51.

* **FR-027**: THE system SHALL treat Generate Certificate as UC53 owned by Staff module.

* **FR-028**: THE system SHALL display loading state while certificates are loading.

* **FR-029**: THE system SHALL display empty state when Volunteer has no certificates.

* **FR-030**: THE system SHALL display not found/unavailable state when certificate does not exist or does not belong to current Volunteer.

* **FR-031**: THE system SHALL display error state when certificate list/detail cannot be loaded.

* **FR-032**: THE system SHALL NOT crash when optional certificate data is missing.

* **FR-033**: THE system SHOULD display fallback UI when certificate optional data is missing.

* **FR-034**: THE system SHOULD display clear status when certificate file is not available.

* **FR-035**: THE system SHOULD display clear status when certificate is revoked or unavailable.

* **FR-036**: THE system SHOULD use pagination or loading strategy when certificate count is large.

* **FR-037**: THE system SHALL NOT perform Attendance Check in UC51.

* **FR-038**: THE system SHALL NOT submit feedback in UC51.

* **FR-039**: THE system SHALL NOT apply event or cancel application in UC51.

* **FR-040**: THE system SHALL NOT rely only on frontend filtering for ownership. Backend/API must enforce authentication, role and ownership.

---

### Key Entities

* **Guest**: Unauthenticated user. Guest cannot view certificates.

* **Volunteer**: Authenticated user with role `VOLUNTEER`. Volunteer can view only their own certificates.

* **Staff**: User with role `STAFF`. Staff can generate certificates in UC53, but does not use UC51 as Volunteer flow.

* **Certificate**: Record or file that proves Volunteer participated in an event.

* **Certificate List**: List of certificates owned by the current Volunteer.

* **Certificate Detail / Preview**: Optional detailed view or preview of one certificate inside UC51.

* **Certificate Owner**: Volunteer who owns the certificate.

* **Certificate Status**: State such as `AVAILABLE`, `GENERATING`, `REVOKED` or `UNAVAILABLE` if system supports it.

* **Certificate File**: PDF/image/file URL associated with certificate. Download action belongs to UC52.

* **Certificate Code**: Optional unique code used to identify or verify certificate.

* **Issue Date**: Date when certificate was issued or generated.

* **Event**: Event related to the certificate.

* **Organization**: Organization related to the event/certificate.

* **Download Action**: Action shown in UC51 UI but handled by UC52.

* **Generate Certificate**: Staff action in UC53, outside UC51.

* **Ownership Boundary**: Rule that Volunteer can only view their own certificates.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: Guest cannot view certificates.

* **SC-002**: Staff, Manager and Admin cannot access Volunteer View Certificates through UC51.

* **SC-003**: Authenticated Volunteer can view their own certificates.

* **SC-004**: Volunteer cannot see certificates of other Volunteers.

* **SC-005**: Certificates page displays certificate list for current Volunteer.

* **SC-006**: Certificate item displays event/certificate title and issue date when data is available.

* **SC-007**: Certificate item displays status when status data is available.

* **SC-008**: Certificate Detail/Preview can display more certificate information if supported.

* **SC-009**: Download action appears only as a related action; actual download logic belongs to UC52.

* **SC-010**: UC51 and UC52 can be implemented together on the same Certificates page or Certificate Detail.

* **SC-011**: UC51 does not generate certificate.

* **SC-012**: Certificates page shows empty state when Volunteer has no certificate.

* **SC-013**: Certificates page shows loading, unavailable and error states correctly.

* **SC-014**: UI does not crash when optional certificate data is missing.

* **SC-015**: Backend/API enforces authentication, role and ownership, not frontend only.

---

## Assumptions

* **A-001**: Guest is not stored as a database role.

* **A-002**: Database roles are `VOLUNTEER`, `STAFF`, `MANAGER`, and `ADMIN`.

* **A-003**: UC51 is only for authenticated Volunteer.

* **A-004**: Guest must login/register before viewing certificates.

* **A-005**: Staff, Manager and Admin do not use UC51 as their certificate view flow.

* **A-006**: Volunteer can only view certificate records that belong to themselves.

* **A-007**: Certificate is generated by Staff through UC53.

* **A-008**: Certificate is usually generated after successful attendance.

* **A-009**: UC51 consumes certificate data but does not generate certificate.

* **A-010**: UC52 Download Certificate should be implemented as action inside Certificates page or Certificate Detail when possible.

* **A-011**: Certificate Detail/Preview can be part of UC51 if team wants.

* **A-012**: Certificate status values may include `AVAILABLE`, `GENERATING`, `REVOKED` or `UNAVAILABLE` if system supports them.

* **A-013**: Mock data can be used temporarily before final API/data contract is ready.

* **A-014**: Mobile app support is out of scope. Feature targets web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC51 — View Certificates và KHÔNG được implement trong use case này:

* Download Certificate processing logic
* Generate Certificate
* Attendance Check
* View Attendance List
* View Attendance History
* View Volunteer History full flow
* Submit Feedback
* View Event List
* Search Event
* Filter Event
* Full Event Detail display
* Apply Event submission
* View Applied Events full list
* Cancel Application
* Staff View Application List
* Staff View Application Detail
* Approve Application
* Reject Application
* Add Event
* Edit Event
* Delete Event
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

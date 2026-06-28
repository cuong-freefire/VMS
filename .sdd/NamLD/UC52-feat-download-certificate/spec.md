# Feature Specification: Download Certificate

**Feature Branch**: `feat/download-certificate`

**Created**: 2026-06-27

**Status**: Draft

**Feature Owner**: NamLD (Member 2)

**Input**: User description: "Là Volunteer đã đăng nhập, tôi muốn tải certificate của mình về máy để lưu trữ, in ra hoặc sử dụng làm minh chứng tham gia event."

---

## User Scenarios & Testing

### User Story 1 - Volunteer download certificate hợp lệ (Priority: P1)

Là Volunteer đã đăng nhập, tôi muốn download certificate của chính mình khi certificate đã available và có file hợp lệ.

**Why this priority**: Download Certificate là hành động chính của UC52. Nếu Volunteer chỉ xem được certificate nhưng không tải được, certificate sẽ kém hữu ích trong thực tế.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập bằng tài khoản Volunteer có certificate `AVAILABLE`, mở Certificates page, bấm Download và kiểm tra file được tải xuống.

**Acceptance Scenarios**:

1. **Given** người dùng là Volunteer đã đăng nhập, **And** certificate thuộc về Volunteer hiện tại, **And** certificate có status `AVAILABLE`, **And** certificate có file/download data hợp lệ, **When** Volunteer click Download, **Then** hệ thống cho phép tải certificate.

2. **Given** download thành công, **When** browser xử lý file, **Then** Volunteer nhận được certificate file.

3. **Given** certificate có file name hợp lệ, **When** download xảy ra, **Then** file name nên dễ hiểu, ví dụ có event title hoặc certificate code nếu hệ thống hỗ trợ.

4. **Given** certificate được download thành công, **When** UI cập nhật trạng thái, **Then** hệ thống có thể hiển thị success state hoặc để browser download behavior thể hiện kết quả.

---

### User Story 2 - Chỉ Volunteer đã đăng nhập được download certificate (Priority: P1)

Là hệ thống, tôi cần đảm bảo chỉ Volunteer đã đăng nhập mới được download certificate theo Volunteer flow.

**Why this priority**: Certificate là dữ liệu cá nhân. Guest hoặc user không đúng role không được phép tải certificate của Volunteer.

**Independent Test**: Có thể test độc lập bằng cách thử download certificate bằng Guest, Volunteer, Staff, Manager và Admin.

**Acceptance Scenarios**:

1. **Given** người dùng là Guest, **When** người dùng cố download certificate, **Then** hệ thống yêu cầu login/register hoặc điều hướng sang Authentication flow.

2. **Given** người dùng đăng nhập với role `VOLUNTEER`, **And** certificate thuộc về Volunteer hiện tại, **When** Volunteer download certificate hợp lệ, **Then** hệ thống cho phép download.

3. **Given** người dùng đăng nhập với role `STAFF`, **When** người dùng cố download certificate qua Volunteer flow, **Then** hệ thống chặn request.

4. **Given** người dùng đăng nhập với role `MANAGER` hoặc `ADMIN`, **When** người dùng cố download certificate qua Volunteer flow, **Then** hệ thống chặn request.

---

### User Story 3 - Volunteer chỉ download certificate của chính mình (Priority: P1)

Là Volunteer, tôi chỉ được download certificate thuộc về tài khoản của tôi, không được download certificate của Volunteer khác.

**Why this priority**: Đây là yêu cầu bảo mật và ownership dữ liệu. Nếu Volunteer có thể download certificate của người khác, hệ thống bị lộ dữ liệu cá nhân.

**Independent Test**: Có thể test bằng cách tạo hai tài khoản Volunteer khác nhau, mỗi người có certificate riêng, rồi thử để Volunteer A download certificate của Volunteer B.

**Acceptance Scenarios**:

1. **Given** certificate thuộc về Volunteer A, **When** Volunteer A download certificate đó, **Then** hệ thống cho phép nếu certificate đủ điều kiện.

2. **Given** certificate thuộc về Volunteer B, **When** Volunteer A cố download certificate đó, **Then** hệ thống chặn request.

3. **Given** frontend không hiển thị certificate của Volunteer khác, **When** user cố gọi request download không hợp lệ, **Then** backend/API vẫn phải enforce ownership.

4. **Given** request download không đúng owner, **When** backend/API xử lý, **Then** hệ thống không trả certificate file.

---

### User Story 4 - Download action nằm trong Certificates page hoặc Certificate Detail (Priority: P1)

Là Volunteer, tôi muốn bấm Download ngay trong màn Certificates hoặc Certificate Detail để tải certificate thuận tiện.

**Why this priority**: UC51 và UC52 là cùng một trải nghiệm người dùng. Volunteer thường xem certificate rồi download ngay, nên không cần một page riêng chỉ để download.

**Independent Test**: Có thể test bằng cách mở Certificates page và kiểm tra Download action xuất hiện trên certificate item hoặc trong Certificate Detail.

**Acceptance Scenarios**:

1. **Given** Certificates page của UC51 được hiển thị, **And** certificate có file hợp lệ, **When** certificate item render, **Then** Download action xuất hiện trong item hoặc detail.

2. **Given** Volunteer mở Certificate Detail, **And** certificate có file hợp lệ, **When** detail hiển thị, **Then** Download action có thể xuất hiện trong detail.

3. **Given** Codex sinh code cho UC51 và UC52, **When** implementation được tạo, **Then** Codex không nên tạo standalone page chỉ để download certificate.

4. **Given** Volunteer click Download action, **When** hệ thống xử lý, **Then** logic download thuộc UC52.

---

### User Story 5 - Không download certificate chưa available hoặc thiếu file (Priority: P1)

Là hệ thống, tôi cần chặn download nếu certificate chưa có file hợp lệ hoặc chưa sẵn sàng.

**Why this priority**: Nếu certificate chưa generate xong hoặc thiếu file, download sẽ lỗi hoặc trả dữ liệu sai.

**Independent Test**: Có thể test bằng cách tạo certificate có status `GENERATING`, `UNAVAILABLE`, thiếu file URL hoặc thiếu file data rồi thử download.

**Acceptance Scenarios**:

1. **Given** certificate có status `AVAILABLE` và có file hợp lệ, **When** Volunteer click Download, **Then** hệ thống cho phép download.

2. **Given** certificate có status `GENERATING`, **When** Volunteer click Download, **Then** hệ thống không cho download và hiển thị trạng thái chưa sẵn sàng.

3. **Given** certificate không có file/download data hợp lệ, **When** Volunteer click Download, **Then** hệ thống không cho download.

4. **Given** file certificate không tồn tại hoặc đã expired, **When** Volunteer click Download, **Then** hệ thống hiển thị error message phù hợp.

---

### User Story 6 - Không download certificate revoked hoặc unavailable (Priority: P1)

Là hệ thống, tôi cần đảm bảo certificate bị revoked hoặc unavailable không được download như certificate hợp lệ.

**Why this priority**: Certificate bị revoked hoặc unavailable không nên được sử dụng bình thường. Nếu vẫn cho download, Volunteer có thể dùng certificate không còn hợp lệ.

**Independent Test**: Có thể test bằng cách tạo certificate status `REVOKED` hoặc `UNAVAILABLE` rồi thử download.

**Acceptance Scenarios**:

1. **Given** certificate có status `REVOKED`, **When** Volunteer click Download, **Then** hệ thống không cho download như certificate hợp lệ.

2. **Given** certificate có status `UNAVAILABLE`, **When** Volunteer click Download, **Then** hệ thống không cho download.

3. **Given** certificate bị revoked/unavailable, **When** Certificates page hiển thị, **Then** UI cần hiển thị trạng thái rõ ràng.

4. **Given** user cố gọi download request trực tiếp cho certificate revoked/unavailable, **When** backend/API xử lý, **Then** backend/API phải từ chối request.

---

### User Story 7 - Loading, downloading, success và error states (Priority: P2)

Là Volunteer, tôi muốn thấy trạng thái rõ ràng khi certificate đang được tải, tải thành công hoặc tải thất bại.

**Why this priority**: Download file có thể mất thời gian hoặc lỗi. Nếu UI không có trạng thái rõ ràng, Volunteer có thể bấm nhiều lần hoặc tưởng hệ thống không hoạt động.

**Independent Test**: Có thể test bằng cách mock downloading, success và các lỗi như không có quyền, file missing, file expired hoặc lỗi hệ thống.

**Acceptance Scenarios**:

1. **Given** Volunteer click Download, **When** request đang xử lý, **Then** hệ thống hiển thị downloading/loading state.

2. **Given** download đang xử lý, **When** Volunteer bấm Download nhiều lần, **Then** UI nên chặn hoặc hạn chế request trùng nếu phù hợp.

3. **Given** download thành công, **When** browser nhận file, **Then** Volunteer có thể lưu hoặc mở file theo browser behavior.

4. **Given** download thất bại do không có quyền, file không tồn tại, file expired, certificate chưa available hoặc lỗi hệ thống, **When** hệ thống trả kết quả, **Then** UI hiển thị error message phù hợp.

---

### User Story 8 - Không generate certificate trong UC52 (Priority: P1)

Là hệ thống, tôi cần đảm bảo UC52 không tạo certificate mới, mà chỉ download certificate đã tồn tại và hợp lệ.

**Why this priority**: Generate Certificate là nghiệp vụ của Staff ở UC53. Nếu UC52 tự generate certificate, scope của Member 2 sẽ bị lẫn với Member 3.

**Independent Test**: Có thể test bằng cách thử download certificate chưa được generate và kiểm tra hệ thống không tạo certificate mới từ UC52.

**Acceptance Scenarios**:

1. **Given** certificate chưa được generate, **When** Volunteer cố download, **Then** hệ thống không tự generate certificate.

2. **Given** certificate chưa có file, **When** Volunteer cố download, **Then** hệ thống hiển thị unavailable/generating state nếu dữ liệu có sẵn.

3. **Given** Staff cần tạo certificate, **When** generate certificate được thực hiện, **Then** nghiệp vụ đó thuộc UC53.

4. **Given** UC52 được implement, **When** review scope, **Then** UC52 chỉ xử lý download certificate đã available.

---

### User Story 9 - Security cho download URL/file (Priority: P1)

Là hệ thống, tôi cần đảm bảo certificate file không bị truy cập trái phép chỉ bằng cách đoán hoặc chia sẻ URL.

**Why this priority**: Certificate là dữ liệu cá nhân. Nếu download chỉ dựa vào URL public không kiểm tra quyền, người khác có thể tải certificate không thuộc về họ.

**Independent Test**: Có thể test bằng cách copy download URL hoặc gọi download request bằng user không đúng owner.

**Acceptance Scenarios**:

1. **Given** download request được gửi, **When** backend/API xử lý, **Then** hệ thống kiểm tra authentication.

2. **Given** download request được gửi bởi user không phải owner, **When** backend/API xử lý, **Then** hệ thống từ chối request.

3. **Given** certificate file URL bị copy, **When** user không có quyền cố truy cập, **Then** hệ thống không cho tải file nếu download cần authorization.

4. **Given** frontend ẩn Download action, **When** user vẫn gọi request thủ công, **Then** backend/API vẫn enforce quyền truy cập.

---

## Edge Cases

* **Guest download certificate**: Hệ thống yêu cầu login/register hoặc điều hướng sang Authentication flow, không trả file.

* **Staff download qua Volunteer flow**: Hệ thống chặn vì Staff không dùng UC52 theo Volunteer flow.

* **Manager/Admin download qua Volunteer flow**: Hệ thống chặn vì không phải Volunteer flow.

* **Volunteer download certificate của người khác**: Backend/API chặn request.

* **Certificate không tồn tại**: Hệ thống hiển thị not found hoặc unavailable error.

* **Certificate không thuộc current Volunteer**: Backend/API không trả file.

* **Certificate chưa được generate**: Hệ thống không tự generate trong UC52.

* **Certificate đang `GENERATING`**: Hệ thống không cho download như certificate available.

* **Certificate `AVAILABLE` nhưng thiếu file data**: Hệ thống không cho download và hiển thị error/unavailable state.

* **Certificate file bị mất**: Hệ thống hiển thị file not found hoặc system error.

* **Certificate file expired**: Hệ thống hiển thị error phù hợp hoặc yêu cầu tải lại.

* **Certificate `REVOKED`**: Hệ thống không cho download như certificate hợp lệ.

* **Certificate `UNAVAILABLE`**: Hệ thống không cho download.

* **Volunteer bấm Download nhiều lần**: UI nên có downloading state hoặc cơ chế hạn chế request trùng.

* **Download thành công nhưng browser chặn popup/download**: UI có thể hiển thị hướng dẫn hoặc trạng thái phù hợp nếu detect được.

* **Filename chứa ký tự đặc biệt**: Hệ thống nên sanitize filename nếu team implement.

* **Network error khi download**: UI hiển thị error và cho phép thử lại nếu phù hợp.

---

## Requirements

### Functional Requirements

* **FR-001**: THE system SHALL allow only authenticated users with role `VOLUNTEER` to download certificate through UC52.

* **FR-002**: THE system SHALL NOT allow Guest to download certificate.

* **FR-003**: WHEN Guest attempts to download certificate, THE system SHALL require login/register or navigate to Authentication flow.

* **FR-004**: THE system SHALL NOT allow Staff, Manager or Admin to download certificate through Volunteer Download Certificate flow.

* **FR-005**: THE system SHALL allow Volunteer to download only certificates that belong to the current Volunteer.

* **FR-006**: THE system SHALL NOT allow Volunteer to download certificates belonging to another Volunteer.

* **FR-007**: THE system SHALL require certificate to exist before download.

* **FR-008**: THE system SHALL require certificate to belong to current authenticated Volunteer before download.

* **FR-009**: THE system SHALL require certificate to have valid file/download data before download.

* **FR-010**: THE system SHALL require certificate to be available for download before returning file.

* **FR-011**: THE system SHOULD allow download only when certificate status is `AVAILABLE` if certificate status is supported.

* **FR-012**: THE system SHALL NOT allow download when certificate status is `GENERATING`.

* **FR-013**: THE system SHALL NOT allow download when certificate status is `REVOKED`.

* **FR-014**: THE system SHALL NOT allow download when certificate status is `UNAVAILABLE`.

* **FR-015**: THE system SHALL NOT generate certificate in UC52.

* **FR-016**: THE system SHALL treat Generate Certificate as UC53 owned by Staff module.

* **FR-017**: THE system SHALL NOT perform Attendance Check in UC52.

* **FR-018**: THE system SHALL NOT send Certificate Email in UC52.

* **FR-019**: THE system SHOULD implement UC52 as Download action inside UC51 Certificates page or Certificate Detail.

* **FR-020**: THE system SHOULD NOT create a standalone page only for Download Certificate if the action can be handled inside Certificates page/detail.

* **FR-021**: THE system SHALL display Download action only when certificate is eligible for download.

* **FR-022**: THE system SHOULD hide or disable Download action when certificate is not eligible for download.

* **FR-023**: THE system SHALL display clear status when certificate is not ready for download.

* **FR-024**: THE system SHALL display downloading/loading state while download request is processing.

* **FR-025**: THE system SHOULD prevent repeated download requests from UI while the current download is processing.

* **FR-026**: THE system SHALL return certificate file when download request is valid.

* **FR-027**: Certificate file SHOULD be PDF in the first version if team has not confirmed another format.

* **FR-028**: Downloaded file name SHOULD be understandable if file naming is controlled by system.

* **FR-029**: Downloaded file name MAY include event title, certificate code, or issue date if available.

* **FR-030**: THE system SHALL display clear error message when download fails due to unauthenticated user.

* **FR-031**: THE system SHALL display clear error message when download fails due to invalid role.

* **FR-032**: THE system SHALL display clear error message when download fails due to ownership violation.

* **FR-033**: THE system SHALL display clear error message when certificate does not exist.

* **FR-034**: THE system SHALL display clear error message when certificate has no valid file.

* **FR-035**: THE system SHALL display clear error message when certificate is generating, revoked or unavailable.

* **FR-036**: THE system SHALL display general error state when download fails due to network or system error.

* **FR-037**: THE system SHALL NOT rely only on frontend hiding of Download action. Backend/API must enforce authentication, role, ownership, certificate status and file availability.

* **FR-038**: THE system SHALL protect certificate download data from unauthorized access.

* **FR-039**: THE system SHOULD avoid exposing permanent public file URLs that allow unauthorized certificate access.

* **FR-040**: THE system SHALL treat UC52 as download-only scope, not certificate management scope.

---

### Key Entities

* **Guest**: Unauthenticated user. Guest cannot download certificate.

* **Volunteer**: Authenticated user with role `VOLUNTEER`. Volunteer can download only their own eligible certificates.

* **Staff**: User with role `STAFF`. Staff can generate certificate in UC53, but does not use UC52 as Volunteer download flow.

* **Certificate**: Record or file proving Volunteer participated in an event.

* **Certificate Owner**: Volunteer who owns the certificate.

* **Certificate File**: PDF/image/file associated with certificate and used for download.

* **Download Certificate**: Action that allows Volunteer to download certificate file.

* **Download Action**: Button/action shown inside Certificates page or Certificate Detail.

* **Certificate Status**: State such as `AVAILABLE`, `GENERATING`, `REVOKED` or `UNAVAILABLE` if the system supports it.

* **AVAILABLE Certificate**: Certificate ready to be downloaded.

* **GENERATING Certificate**: Certificate still being generated or not ready.

* **REVOKED Certificate**: Certificate that has been revoked and should not be treated as valid.

* **UNAVAILABLE Certificate**: Certificate that cannot be downloaded.

* **Download URL / File URL**: Data used to retrieve certificate file. It must be protected by authorization.

* **Generate Certificate**: Staff action in UC53, outside UC52.

* **Certificate Email**: Email service action in UC66, outside UC52.

* **Ownership Boundary**: Rule that Volunteer can only download their own certificate.

* **File Availability Boundary**: Rule that certificate must have valid file/download data before download.

---

## Success Criteria

### Measurable Outcomes

* **SC-001**: Guest cannot download certificate.

* **SC-002**: Staff, Manager and Admin cannot download certificate through Volunteer Download Certificate flow.

* **SC-003**: Authenticated Volunteer can download their own available certificate.

* **SC-004**: Volunteer cannot download certificate of another Volunteer.

* **SC-005**: Certificate must exist before download.

* **SC-006**: Certificate must have valid file/download data before download.

* **SC-007**: Certificate with status `AVAILABLE` can be downloaded if all permission checks pass.

* **SC-008**: Certificate with status `GENERATING`, `REVOKED` or `UNAVAILABLE` cannot be downloaded as a normal certificate.

* **SC-009**: Download action appears inside Certificates page or Certificate Detail, not as a standalone page.

* **SC-010**: UC52 does not generate certificate.

* **SC-011**: UI shows downloading/loading state while request is processing.

* **SC-012**: UI shows clear error message when download fails.

* **SC-013**: Backend/API enforces authentication, role, ownership, certificate status and file availability, not frontend only.

* **SC-014**: Certificate download data is protected from unauthorized access.

---

## Assumptions

* **A-001**: Guest is not stored as a database role.

* **A-002**: Database roles are `VOLUNTEER`, `STAFF`, `MANAGER`, and `ADMIN`.

* **A-003**: UC52 is only for authenticated Volunteer.

* **A-004**: Guest must login/register before downloading certificate.

* **A-005**: Staff, Manager and Admin do not use UC52 as their certificate download flow.

* **A-006**: Volunteer can only download certificate records that belong to themselves.

* **A-007**: UC52 usually starts from UC51 — View Certificates.

* **A-008**: UC52 should be implemented as a Download action inside Certificates page or Certificate Detail when possible.

* **A-009**: Certificate is generated by Staff through UC53.

* **A-010**: UC52 consumes certificate file/data but does not generate certificate.

* **A-011**: Certificate must have valid file/download data before being downloaded.

* **A-012**: Certificate status values may include `AVAILABLE`, `GENERATING`, `REVOKED` or `UNAVAILABLE` if system supports status.

* **A-013**: Certificate file should be PDF in the first version unless team confirms another format.

* **A-014**: Certificate Email belongs to UC66 and is outside UC52.

* **A-015**: Mock data can be used temporarily before final API/data contract is ready.

* **A-016**: Mobile app support is out of scope. Feature targets web application.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC52 — Download Certificate và KHÔNG được implement trong use case này:

* View Certificates full list
* Certificate Detail full display
* Generate Certificate
* Regenerate Certificate
* Revoke Certificate
* Edit Certificate
* Delete Certificate
* Certificate Email
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

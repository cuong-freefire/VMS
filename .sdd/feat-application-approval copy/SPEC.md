# Feature Specification: Application Approval (Xét duyệt đơn đăng ký)

**Feature Branch**: `feat-application-approval`

**Created**: 2026-06-25

**Status**: Draft

**Input**: User description: "Staff thực hiện xem danh sách, phê duyệt hoặc từ chối các đơn đăng ký (Applications) tham gia sự kiện của Tình nguyện viên (Volunteer)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Phê duyệt đơn đăng ký đơn lẻ (Priority: P1)

Là một Staff, tôi muốn phê duyệt đơn đăng ký của tình nguyện viên để họ chính thức tham gia vào sự kiện.

**Why this priority**: Đây là luồng nghiệp vụ chính để lấp đầy sức chứa của sự kiện và đảm bảo dữ liệu cho khâu điểm danh sau này.

**Independent Test**: Có thể kiểm tra độc lập bằng cách gọi API `PATCH /api/v1/staff/applications/:id/approve`, kiểm tra trạng thái đơn chuyển thành `Approved` và số lượng `approved_participants` của sự kiện tăng lên.

**Acceptance Scenarios**:

1. **Given** Nhân viên đã đăng nhập với quyền Staff và đơn đăng ký với `application_id: 123` đang ở trạng thái `Pending`, sự kiện có `approved_participants: 9` và `max_capacity: 10`, **When** Nhân viên gọi API `PATCH /api/v1/staff/applications/123/approve`, **Then** Hệ thống trả về HTTP 200, chuyển trạng thái đơn sang `Approved`, ghi nhận `approved_by: staff_id`, tăng `approved_participants` của sự kiện lên 10, và ghi Audit Log entry.

2. **Given** Sự kiện có `application_id: 456` đã đạt tối đa sức chứa (`approved_participants: 50`, `max_capacity: 50`), **When** Nhân viên cố gắng duyệt thêm đơn này bằng cách gọi API approve, **Then** Hệ thống trả về HTTP 400 Bad Request với message "Event is full", không thay đổi trạng thái đơn, và không tăng `approved_participants`.

3. **Given** Đơn đăng ký với `application_id: 789` đã ở trạng thái `Approved`, **When** Nhân viên cố duyệt lại đơn này, **Then** Hệ thống trả về HTTP 409 Conflict với message "Application already processed" và không thay đổi dữ liệu.

4. **Given** Đơn đăng ký thuộc về Event mà Staff không được phân công quản lý, **When** Staff cố gắng duyệt đơn này, **Then** Hệ thống trả về HTTP 403 Forbidden với message "You are not authorized to approve applications for this event".

---

### User Story 2 - Từ chối đơn đăng ký với lý do (Priority: P1)

Là một Staff, tôi muốn từ chối các đơn không phù hợp và cung cấp lý do cụ thể để tình nguyện viên nắm rõ thông tin.

**Why this priority**: Đảm bảo tính minh bạch và trải nghiệm người dùng cho tình nguyện viên.

**Independent Test**: Gọi API `PATCH /api/v1/staff/applications/:id/reject` với kèm `reason` trong request body.

**Acceptance Scenarios**:

1. **Given** Đơn đăng ký với `application_id: 234` đang ở trạng thái `Pending`, **When** Staff gọi API reject với `rejection_reason: "Không đủ kinh nghiệm yêu cầu"`, **Then** Hệ thống trả về HTTP 200, chuyển trạng thái đơn sang `Rejected`, lưu `rejection_reason` vào database (NOT NULL), ghi nhận `approved_by: staff_id`, và ghi Audit Log entry.

2. **Given** Staff cố gắng từ chối đơn nhưng không cung cấp `rejection_reason` trong request body (null hoặc empty string), **When** Staff gọi API reject, **Then** Hệ thống trả về HTTP 400 Bad Request với message "Rejection reason is required" và không thay đổi trạng thái đơn.

3. **Given** Đơn đăng ký với `application_id: 345` đã ở trạng thái `Rejected`, **When** Staff cố từ chối lại đơn này với lý do mới, **Then** Hệ thống trả về HTTP 409 Conflict với message "Application already processed" và không cập nhật `rejection_reason`.

4. **Given** Volunteer của đơn đăng ký có `is_active: false` (tài khoản bị khóa), **When** Staff cố từ chối đơn này, **Then** Hệ thống trả về HTTP 403 Forbidden với message "Volunteer account is inactive" (vẫn cần kiểm tra trạng thái Volunteer ngay cả khi reject).

---

### User Story 3 - Duyệt đơn hàng loạt theo FCFS (Priority: P2)

Là một Staff, tôi muốn chọn nhiều đơn và duyệt cùng lúc để tiết kiệm thời gian vận hành.

**Why this priority**: Tăng hiệu suất xử lý khi có số lượng lớn đơn đăng ký.

**Independent Test**: Chọn danh sách đơn, hệ thống xử lý ưu tiên theo thời gian đăng ký sớm nhất (`created_at`).

**Acceptance Scenarios**:

1. **Given** Sự kiện có `max_capacity: 100`, `approved_participants: 95` (còn 5 chỗ), và có 10 đơn `Pending` với `created_at` từ T1 đến T10 (T1 sớm nhất), **When** Staff gọi API bulk approve với danh sách 10 application IDs này, **Then** Hệ thống sắp xếp theo `created_at` ASC, duyệt 5 đơn đầu (T1-T5), tự động reject 5 đơn còn lại (T6-T10) với `rejection_reason: "Sự kiện đã đủ số lượng"`, trả về HTTP 200 với response `{approved: 5, rejected: 5, skipped: 0}`.

2. **Given** Danh sách bulk approval gồm 20 application IDs, trong đó 5 đơn đã `Approved`, 3 đơn đã `Rejected`, và 12 đơn `Pending`, **When** Staff gọi API bulk approve, **Then** Hệ thống bỏ qua 8 đơn đã xử lý, chỉ xử lý 12 đơn `Pending` theo FCFS, trả về response `{approved: X, rejected: Y, skipped: 8}` (X+Y = 12, tùy thuộc capacity còn lại).

3. **Given** Tất cả 15 đơn trong danh sách bulk đều đã được xử lý (`Approved` hoặc `Rejected`), **When** Staff gọi API bulk approve, **Then** Hệ thống trả về HTTP 200 với response `{approved: 0, rejected: 0, skipped: 15}` và message "All applications have already been processed".

4. **Given** Sự kiện đã đầy (`approved_participants == max_capacity`), **When** Staff cố bulk approve 10 đơn `Pending`, **Then** Hệ thống reject tất cả 10 đơn với `rejection_reason: "Sự kiện đã đủ số lượng"`, trả về response `{approved: 0, rejected: 10, skipped: 0}`.

---

### Edge Cases

- **Race Condition - Concurrent approvals**: WHERE 2 Staff cùng duyệt đơn cuối cùng của 1 sự kiện cùng lúc, THE system SHALL sử dụng Database Transaction ở mức Serializable Isolation để đảm bảo chỉ 1 đơn được duyệt và không vượt quá `max_capacity`. THE system SHALL trả về lỗi `400 Bad Request` với message "Event is full" cho đơn còn lại.

- **Volunteer account deactivated after application submission**: WHERE tài khoản tình nguyện viên bị khóa (`is_active: false`) sau khi đã nộp đơn nhưng trước khi được duyệt, THE system SHALL kiểm tra `is_active` của Volunteer trong Service Layer và SHALL trả về lỗi `403 Forbidden` với message "Volunteer account is inactive".

- **Event in invalid status**: WHEN Staff cố duyệt đơn cho sự kiện đã kết thúc (`status: Completed`) hoặc đang diễn ra (`status: In Progress`), THE system SHALL trả về lỗi `400 Bad Request` với message "Cannot approve applications for this event status".

- **Application already cancelled by volunteer**: WHERE Volunteer đã tự hủy đơn (chuyển sang `status: Cancelled`) trước khi Staff duyệt, THE system SHALL trả về lỗi `409 Conflict` với message "Application has been cancelled by volunteer".

- **Staff deactivated mid-transaction**: WHERE tài khoản Staff bị khóa trong khi đang thực hiện transaction duyệt đơn, THE system SHALL rollback transaction và SHALL trả về lỗi `401 Unauthorized` với message "Staff account is inactive".

- **Event soft deleted during transaction**: WHERE Event bị soft delete (`is_active: false`) giữa chừng transaction, THE system SHALL rollback transaction và SHALL trả về lỗi `404 Not Found` với message "Event not found".

- **Bulk approval with mixed application statuses**: WHERE danh sách bulk approval chứa đơn với nhiều trạng thái khác nhau (Pending, Approved, Rejected, Cancelled), THE system SHALL chỉ xử lý đơn `Pending`, SHALL skip các đơn đã xử lý, và SHALL trả về response chi tiết với số lượng từng loại.

- **Capacity changed during bulk approval**: WHERE `max_capacity` của Event bị thay đổi trong khi bulk approval đang xử lý, THE system SHALL sử dụng giá trị `max_capacity` tại thời điểm bắt đầu transaction để đảm bảo tính nhất quán.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST verify Staff authorization bằng cách kiểm tra `staff_event_assignments` hoặc `organization_id` để đảm bảo Staff được phân công quản lý Event đó trước khi cho phép approve hoặc reject Application.

- **FR-002**: System MUST enforce Finite State Machine cho Application status: chỉ cho phép chuyển từ `Pending` sang `Approved` hoặc `Rejected`, không được phép quay lại `Pending`.

- **FR-003**: System MUST thực hiện approve operation trong Database Transaction với Serializable Isolation Level để đảm bảo `approved_participants <= max_capacity` luôn đúng trong mọi trường hợp concurrent access.

- **FR-004**: System MUST ghi Audit Log entry mỗi khi Application status thay đổi từ `Pending` sang `Approved` hoặc `Rejected`, bao gồm: `staff_id`, `application_id`, `old_status`, `new_status`, `rejection_reason` (nếu có), và `timestamp`.

- **FR-005**: System MUST validate `rejection_reason` là NOT NULL khi Staff reject Application. Nếu thiếu, system MUST trả về `400 Bad Request` error. Database schema MUST enforce constraint này.

- **FR-006**: System MUST kiểm tra Volunteer account có `is_active = true` trước khi approve Application. Nếu `is_active = false`, system MUST trả về `403 Forbidden` error với message "Volunteer account is inactive".

- **FR-007**: System MUST kiểm tra Event status là `Published` hoặc `Open` trước khi cho phép approve/reject. Nếu Event status là `In Progress` hoặc `Completed`, system MUST trả về `400 Bad Request` error.

- **FR-008**: System MUST sắp xếp Applications theo `created_at` timestamp ASC (FCFS) khi xử lý Bulk Approval để đảm bảo công bằng.

- **FR-009**: System MUST skip các Applications đã được xử lý (`Approved` hoặc `Rejected`) trong Bulk Approval và MUST trả về response chi tiết bao gồm `approved_count`, `rejected_count`, và `skipped_count`.

- **FR-010**: Tình nguyện viên đã bị Rejected MUST NOT được phép đăng ký lại cùng Event đó. Logic validation này được implement ở Module Event (Member 2) khi tạo Application, không nằm trong module approval này.

### Key Entities

- **Application**: Đại diện cho đơn đăng ký tham gia sự kiện của Volunteer, quản lý bởi Member 2 (Event module) và được cập nhật trạng thái bởi Member 3 (Staff module).

- **Event**: Đại diện cho sự kiện tình nguyện, có sức chứa giới hạn (`max_capacity`) và theo dõi số người đã được duyệt (`approved_participants`).

- **Staff**: Nhân viên được phân công quản lý sự kiện, có quyền xét duyệt đơn đăng ký cho các sự kiện thuộc phạm vi quản lý của mình.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Số lượng người tham gia thực tế không bao giờ vượt quá `max_capacity` trong mọi điều kiện truy cập đồng thời (100% compliance rate trong load testing).

- **SC-002**: 100% các đơn bị từ chối đều có `rejection_reason` NOT NULL trong database (verified qua database constraint).

- **SC-003**: Thời gian phản hồi API duyệt đơn đơn lẻ trung bình dưới 500ms tại p95 (khi không có tranh chấp khóa).

- **SC-004**: Bulk approval xử lý thành công 100 đơn trong vòng 3 giây (p95), với đúng thứ tự FCFS (verified qua `created_at` timestamp).

---

## Assumptions

- **A-001**: Tình nguyện viên đã có tài khoản hoạt động (`is_active: true`) và đã nộp đơn thành công (`status: Pending`) trước đó thông qua Module Event (Member 2).

- **A-002**: Nhân viên thực hiện duyệt được xác thực qua JWT Token lưu trong HttpOnly Cookie, với `userId` được extract từ `req.user.id` bởi middleware authentication đã được implement.

- **A-003**: Dữ liệu về `max_capacity` của sự kiện đã được thiết lập chính xác từ khâu tạo sự kiện và không bị thay đổi trong quá trình xét duyệt (hoặc nếu thay đổi, không ảnh hưởng đến transaction đang xử lý).

- **A-004**: Database hỗ trợ Serializable Isolation Level (MySQL InnoDB) và có thể handle concurrent transactions với performance chấp nhận được, đặc biệt trong môi trường production với load cao.

- **A-005**: Audit Log được ghi đồng bộ (synchronous) trong cùng transaction với việc cập nhật trạng thái Application để đảm bảo tính nhất quán dữ liệu. Nếu transaction fail, Audit Log cũng không được ghi.

- **A-006**: Bảng `staff_event_assignments` hoặc cơ chế phân quyền tương tự đã tồn tại trong database để xác định Staff nào quản lý Event nào.

- **A-007**: Module Event (Member 2) đã implement logic kiểm tra re-apply (tình nguyện viên bị Rejected không được apply lại cùng sự kiện), do đó module này không cần xử lý logic đó.

- **A-008**: Frontend đã cấu hình HTTP client để gửi credentials (cookies) tự động trong mọi request đến Backend với `withCredentials: true`.

---

## Out of Scope

Các tính năng sau **KHÔNG** nằm trong phạm vi của tính năng này và sẽ không được implement trong sprint hiện tại:

- **Chỉnh sửa đơn sau khi đã duyệt**: Một khi Application đã chuyển sang `Approved` hoặc `Rejected`, Staff không thể thay đổi lại trạng thái. Việc rollback (nếu cần) phải thực hiện thông qua quy trình manual riêng biệt với quyền Admin.

- **Gửi email/thông báo tự động cho Volunteer**: Việc thông báo kết quả xét duyệt (Approved/Rejected) cho Volunteer sẽ được xử lý bởi Module Notification (Member 5) thông qua cơ chế event-driven hoặc message queue, không nằm trong scope của API xét duyệt này.

- **Xem lịch sử xét duyệt (Audit Trail UI)**: Tính năng cho phép Staff xem lại lịch sử ai đã duyệt/từ chối đơn nào sẽ được implement trong một feature riêng biệt. Pha này chỉ tập trung vào việc **ghi log**, không bao gồm UI để hiển thị log.

- **Tính năng lọc và tìm kiếm đơn đăng ký**: Việc xây dựng giao diện lọc đơn theo status, event, volunteer name, hoặc ngày nộp đơn thuộc về tính năng "Application List/Search" riêng biệt (sẽ do Member 2 hoặc Member 3 thực hiện sau).

- **Bulk Reject (Từ chối hàng loạt)**: Hiện tại chỉ hỗ trợ Bulk Approve. Bulk Reject yêu cầu logic phức tạp hơn (nhập lý do chung cho tất cả hoặc từng lý do riêng) và sẽ được xem xét trong iteration sau nếu có nhu cầu thực tế.

- **Phân quyền chi tiết theo Role (Staff vs Manager)**: Hiện tại, cả Staff và Manager đều có quyền duyệt đơn như nhau. Logic phân quyền chi tiết hơn (ví dụ: chỉ Manager mới có thể duyệt đơn vượt quá 50 người) sẽ được implement khi có yêu cầu cụ thể từ stakeholders.

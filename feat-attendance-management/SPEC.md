# Feature Specification: Attendance Management (Quản lý điểm danh)

**Feature Branch**: `feat-attendance-management`

**Created**: 2026-06-25

**Status**: Draft

**Input**: User description: "Staff thực hiện điểm danh cho tình nguyện viên tại sự kiện để ghi nhận sự tham gia thực tế, đảm bảo dữ liệu chính xác cho khâu cấp chứng nhận sau này"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Điểm danh tình nguyện viên có mặt (Priority: P1)

Là một Staff, tôi muốn điểm danh Present (Có mặt) cho tình nguyện viên khi họ đến sự kiện để ghi nhận sự tham gia thực tế của họ.

**Why this priority**: Đây là luồng nghiệp vụ chính để tạo dữ liệu điểm danh, là điều kiện tiên quyết bắt buộc để hệ thống có thể cấp phát chứng nhận hoàn thành sự kiện cho tình nguyện viên sau này.

**Independent Test**: Có thể kiểm tra độc lập bằng cách gọi API `POST /api/v1/staff/attendance/check` với `status: Present`, kiểm tra bản ghi attendance được tạo trong database và trạng thái đơn đăng ký được cập nhật.

**Acceptance Scenarios**:

1. **Given** Staff đã đăng nhập và có quyền quản lý Event có `event_id: 100`, Volunteer có `volunteer_id: 50` có Application với `status: Approved` cho Event này, sự kiện đang ở trạng thái `In Progress`, **When** Staff gọi API điểm danh với `volunteer_id: 50`, `event_id: 100`, `status: Present`, **Then** Hệ thống trả về HTTP 200, tạo bản ghi Attendance với `status: Present`, ghi nhận `checked_by: staff_id`, và ghi Audit Log entry.

2. **Given** Volunteer có `volunteer_id: 51` có Application với `status: Pending` (chưa được duyệt), **When** Staff cố điểm danh cho Volunteer này, **Then** Hệ thống trả về HTTP 400 Bad Request với message "Application must be approved before attendance check".

3. **Given** Event có `event_id: 101` đang ở trạng thái `Completed` (đã kết thúc), **When** Staff cố điểm danh cho Volunteer của Event này, **Then** Hệ thống trả về HTTP 400 Bad Request với message "Cannot check attendance for completed events".

4. **Given** Staff không được phân công quản lý Event có `event_id: 102`, **When** Staff cố điểm danh cho Volunteer thuộc Event này, **Then** Hệ thống trả về HTTP 403 Forbidden với message "You are not authorized to check attendance for this event".

---

### User Story 2 - Đánh dấu tình nguyện viên vắng mặt (Priority: P1)

Là một Staff, tôi muốn điểm danh Absent (Vắng mặt) cho tình nguyện viên không đến sự kiện để xử lý no-show đúng quy trình thay vì sử dụng chức năng hủy đơn.

**Why this priority**: Đảm bảo tính toàn vẹn của luồng giao dịch và lưu lại lịch sử tham gia đầy đủ. Tránh việc nhân viên nhầm lẫn giữa "Hủy đơn" và "Điểm danh vắng mặt".

**Independent Test**: Gọi API `POST /api/v1/staff/attendance/check` với `status: Absent`, kiểm tra bản ghi attendance được tạo và không cấp phát chứng nhận cho Volunteer này.

**Acceptance Scenarios**:

1. **Given** Volunteer có `volunteer_id: 60` có Application với `status: Approved` cho Event `event_id: 110`, **When** Staff điểm danh với `status: Absent`, **Then** Hệ thống trả về HTTP 200, tạo bản ghi Attendance với `status: Absent`, ghi nhận `checked_by: staff_id`, và ghi Audit Log entry.

2. **Given** Volunteer có `volunteer_id: 61` đã được điểm danh `status: Present` trước đó, **When** Staff cố điểm danh lại với `status: Absent`, **Then** Hệ thống trả về HTTP 409 Conflict với message "Attendance record already exists for this volunteer and event".

3. **Given** Volunteer có `volunteer_id: 62` có `is_active: false` (tài khoản bị khóa) nhưng Application vẫn ở `status: Approved`, **When** Staff cố điểm danh cho Volunteer này, **Then** Hệ thống trả về HTTP 403 Forbidden với message "Volunteer account is inactive".

---

### User Story 3 - Xem danh sách đã điểm danh của sự kiện (Priority: P2)

Là một Staff hoặc Manager, tôi muốn xem danh sách tất cả tình nguyện viên đã được điểm danh (cả Present và Absent) cho một sự kiện cụ thể để theo dõi tiến độ và tỷ lệ tham gia thực tế.

**Why this priority**: Giúp quản lý sự kiện hiệu quả và cung cấp báo cáo tỷ lệ tham gia thực tế so với số lượng đã duyệt.

**Independent Test**: Gọi API `GET /api/v1/staff/attendance/events/:eventId` và kiểm tra response trả về danh sách attendance records với đầy đủ thông tin volunteer, status, và timestamp.

**Acceptance Scenarios**:

1. **Given** Event có `event_id: 120` có 10 volunteers đã được điểm danh (7 Present, 3 Absent), **When** Staff gọi API xem danh sách attendance, **Then** Hệ thống trả về HTTP 200 với danh sách 10 bản ghi bao gồm `volunteer_name`, `status`, `checked_at`, `checked_by`.

2. **Given** Event có `event_id: 121` chưa có ai được điểm danh, **When** Staff gọi API xem danh sách attendance, **Then** Hệ thống trả về HTTP 200 với mảng rỗng `[]`.

3. **Given** Staff không được phân công quản lý Event có `event_id: 122`, **When** Staff cố xem danh sách attendance của Event này, **Then** Hệ thống trả về HTTP 403 Forbidden với message "You are not authorized to view attendance for this event".

---

### Edge Cases

- **Concurrent attendance check**: WHERE 2 Staff cùng cố điểm danh cho cùng một Volunteer tại cùng thời điểm, hệ thống MUST sử dụng database constraint (unique index trên `volunteer_id + event_id`) để đảm bảo chỉ một bản ghi được tạo. Thao tác thứ hai MUST trả về HTTP 409 Conflict.

- **Application status changed after attendance**: WHERE Application của Volunteer bị chuyển từ `Approved` sang `Rejected` sau khi đã được điểm danh Present, hệ thống MUST giữ nguyên bản ghi Attendance (không xóa) nhưng MUST NOT cấp phát chứng nhận cho Volunteer này.

- **Volunteer deactivated after approval but before attendance**: WHERE Volunteer bị deactivate (`is_active: false`) sau khi Application đã Approved nhưng trước khi điểm danh, hệ thống MUST kiểm tra `is_active` và MUST trả về HTTP 403 Forbidden khi Staff cố điểm danh.

- **Event status changed during attendance check**: WHERE Event chuyển từ `In Progress` sang `Completed` trong khi Staff đang thực hiện điểm danh, hệ thống MUST rollback transaction và MUST trả về HTTP 400 Bad Request.

- **Staff deactivated mid-transaction**: WHERE Staff bị khóa tài khoản trong khi đang thực hiện transaction điểm danh, hệ thống MUST rollback transaction và MUST trả về HTTP 401 Unauthorized.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST kiểm tra quyền hạn của Staff bằng cách verify `staff_event_assignments` hoặc `organization_id` để đảm bảo Staff được phân công quản lý Event đó trước khi cho phép thực hiện điểm danh.

- **FR-002**: System MUST validate Application của Volunteer có `status: Approved` trước khi cho phép điểm danh. Nếu Application không phải `Approved`, system MUST trả về HTTP 400 Bad Request.

- **FR-003**: System MUST kiểm tra Event status là `In Progress` trước khi cho phép điểm danh. Nếu Event status là `Draft`, `Published`, `Open`, hoặc `Completed`, system MUST trả về HTTP 400 Bad Request.

- **FR-004**: System MUST kiểm tra Volunteer account có `is_active: true` trước khi điểm danh. Nếu `is_active: false`, system MUST trả về HTTP 403 Forbidden.

- **FR-005**: System MUST tạo bản ghi Attendance với `volunteer_id`, `event_id`, `status` (Present/Absent), `checked_by` (staff_id), và `checked_at` (timestamp) khi điểm danh thành công.

- **FR-006**: System MUST enforce unique constraint trên cặp (`volunteer_id`, `event_id`) để ngăn chặn việc điểm danh trùng lặp. Nếu bản ghi đã tồn tại, system MUST trả về HTTP 409 Conflict.

- **FR-007**: System MUST ghi Audit Log entry mỗi khi tạo bản ghi Attendance, bao gồm: `staff_id`, `volunteer_id`, `event_id`, `attendance_status`, và `timestamp`.

- **FR-008**: System MUST extract `userId` từ JWT HttpOnly Cookie (`req.user.id`) để xác định Staff thực hiện điểm danh, không tin tưởng dữ liệu từ request body.

- **FR-009**: System MUST sử dụng Prisma ORM cho tất cả thao tác database để đảm bảo tính ACID khi tạo và cập nhật bản ghi Attendance.

- **FR-010**: Chỉ có tình nguyện viên với Attendance record có `status: Present` mới đủ điều kiện để được cấp phát chứng nhận. Logic này được implement ở Module Certificate (Member 4), không nằm trong module điểm danh này.

### Key Entities

- **Attendance**: Đại diện cho bản ghi điểm danh của một Volunteer tại một Event cụ thể. Mỗi Volunteer chỉ có tối đa một bản ghi Attendance cho mỗi Event. Thuộc tính chính: trạng thái (Present/Absent), thời gian điểm danh, người thực hiện điểm danh.

- **Application**: Đơn đăng ký tham gia sự kiện của Volunteer. Chỉ những Application có `status: Approved` mới được phép điểm danh.

- **Event**: Sự kiện tình nguyện. Chỉ cho phép điểm danh khi Event đang ở trạng thái `In Progress`.

- **Staff**: Nhân viên được phân công quản lý Event, có quyền thực hiện điểm danh cho các Volunteer thuộc Event đó.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% các bản ghi Attendance phải tuân thủ constraint: chỉ điểm danh cho Application có `status: Approved` (verified qua integration test).

- **SC-002**: Không có trường hợp nào Volunteer được điểm danh trùng lặp (verified qua database unique constraint trên `volunteer_id + event_id`).

- **SC-003**: Thời gian phản hồi API điểm danh trung bình dưới 300ms tại p95 (khi không có tranh chấp khóa).

- **SC-004**: 100% các thao tác điểm danh được ghi lại trong Audit Log với đầy đủ thông tin (staff_id, volunteer_id, event_id, status, timestamp).

---

## Assumptions

- **A-001**: Dữ liệu về Event và danh sách Application đã chuyển sang `status: Approved` đã được hoàn tất ở các bước trước đó bởi Module Event (Member 2).

- **A-002**: Staff thực hiện điểm danh được xác thực qua JWT Token lưu trong HttpOnly Cookie, với `userId` được extract từ `req.user.id` bởi middleware authentication đã được implement.

- **A-003**: Bảng `staff_event_assignments` hoặc cơ chế phân quyền tương tự đã tồn tại trong database để xác định Staff nào quản lý Event nào.

- **A-004**: Event được chuyển sang trạng thái `In Progress` bởi Staff/Manager khi sự kiện bắt đầu diễn ra. Logic này đã được implement ở Module Event (Member 2).

- **A-005**: Attendance record là immutable sau khi tạo. Không có chức năng update/edit attendance status trong sprint này. Nếu điểm danh sai, phải liên hệ Admin để xử lý manual.

- **A-006**: Frontend đã cấu hình HTTP client để gửi credentials (cookies) tự động trong mọi request đến Backend với `withCredentials: true`.

---

## Out of Scope

Các tính năng sau **KHÔNG** nằm trong phạm vi của tính năng này và sẽ không được implement trong sprint hiện tại:

- **Gửi email/thông báo tự động cho Volunteer**: Việc thông báo kết quả điểm danh (Present/Absent) cho Volunteer sẽ được xử lý bởi Module Notification (Member 5) thông qua cơ chế event-driven, không nằm trong scope của API điểm danh này.

- **Chức năng "Hủy đơn" để xử lý no-show**: Đối với tình nguyện viên không đến, Staff BẮT BUỘC phải sử dụng chức năng điểm danh với `status: Absent`, KHÔNG được sử dụng chức năng hủy đơn (cancel application) để tránh mất dấu vết lịch sử.

- **Update/Edit Attendance record**: Sau khi tạo bản ghi Attendance, không thể chỉnh sửa trạng thái (từ Present → Absent hoặc ngược lại). Attendance record là immutable. Nếu điểm danh sai, cần liên hệ Admin để xử lý manual.

- **QR Code scanning hoặc Biometric check-in**: Sprint này chỉ triển khai manual attendance check (tích chọn checkbox). Các phương thức điểm danh tự động sẽ được xem xét trong iteration sau nếu có nhu cầu.

- **Attendance cho sự kiện nhiều ngày**: Sprint này chỉ hỗ trợ một bản ghi Attendance cho toàn bộ sự kiện. Logic điểm danh theo từng ngày (daily attendance) cho sự kiện kéo dài nhiều ngày sẽ được implement trong version sau.

- **Bulk Attendance Check**: Hiện tại chỉ hỗ trợ điểm danh từng người (single attendance check). Tính năng điểm danh hàng loạt (bulk check) sẽ được xem xét trong iteration sau nếu có nhu cầu thực tế.

- **Attendance Report/Dashboard**: Tính năng báo cáo chi tiết về tỷ lệ tham gia, biểu đồ thống kê attendance sẽ được implement trong một feature riêng biệt (thuộc về Member 4 - Reporting module).

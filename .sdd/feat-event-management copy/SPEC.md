# Feature Specification: Event Management (Quản lý sự kiện)

**Feature Branch**: `feat-event-management`

**Created**: 2026-06-25

**Status**: Draft

**Input**: User description: "Staff tạo, chỉnh sửa, quản lý và xóa mềm các sự kiện tình nguyện, đảm bảo tính toàn vẹn của dữ liệu và tuân thủ các ràng buộc về sức chứa và trạng thái sự kiện"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tạo sự kiện mới với thông tin cốt lõi (Priority: P1)

Là một Staff, tôi muốn tạo sự kiện mới với thông tin đầy đủ (tên, mô tả, ngày/giờ, địa điểm, sức chứa) để bắt đầu tuyển dụng tình nguyện viên.

**Why this priority**: Đây là luồng nghiệp vụ cốt lõi để khởi tạo dữ liệu sự kiện, là điều kiện tiên quyết cho tất cả các module phụ thuộc (Application, Attendance, Certificate).

**Independent Test**: Có thể kiểm tra độc lập bằng cách gọi API `POST /api/v1/staff/events`, kiểm tra sự kiện được tạo trong database với trạng thái `Draft` và tất cả thông tin cốt lõi chính xác.

**Acceptance Scenarios**:

1. **Given** Staff đã đăng nhập với quyền hợp lệ, **When** Staff gọi API tạo sự kiện với payload đầy đủ (`name: "Làm sạch biển"`, `description: "..."`, `event_date: "2026-07-15"`, `start_time: "08:00"`, `end_time: "12:00"`, `location: "Vũng Tàu"`, `max_capacity: 50`), **Then** Hệ thống trả về HTTP 201, tạo sự kiện với `status: Draft`, `approved_participants: 0`, `is_active: true`, và ghi Audit Log.

2. **Given** Staff cố tạo sự kiện với `max_capacity: 0` hoặc số âm, **When** Staff gọi API tạo sự kiện, **Then** Hệ thống trả về HTTP 400 Bad Request với message "Max capacity must be greater than 0".

3. **Given** Staff cố tạo sự kiện với `event_date` trong quá khứ (trước ngày hiện tại), **When** Staff gọi API, **Then** Hệ thống trả về HTTP 400 Bad Request với message "Event date cannot be in the past".

4. **Given** Staff không được phân công quản lý Organization cụ thể, **When** Staff cố tạo sự kiện cho Organization đó, **Then** Hệ thống trả về HTTP 403 Forbidden với message "You are not authorized to create events for this organization".

---

### User Story 2 - Chỉnh sửa thông tin sự kiện tuân thủ Status Invariant (Priority: P1)

Là một Staff, tôi muốn chỉnh sửa thông tin sự kiện khi cần thiết, nhưng hệ thống phải ngăn chặn việc sửa thông tin cốt lõi khi sự kiện đang diễn ra hoặc đã kết thúc.

**Why this priority**: Đảm bảo tính nhất quán của dữ liệu và tránh gây hỗn loạn cho tình nguyện viên đã đăng ký.

**Independent Test**: Gọi API `PATCH /api/v1/staff/events/:id` với các payload khác nhau tùy theo trạng thái Event, kiểm tra hệ thống chặn chỉnh sửa core fields khi cần thiết.

**Acceptance Scenarios**:

1. **Given** Event có `event_id: 100` đang ở trạng thái `Draft`, **When** Staff gọi API chỉnh sửa với payload `{location: "Hà Nội", max_capacity: 100}`, **Then** Hệ thống trả về HTTP 200, cập nhật thông tin, và ghi Audit Log.

2. **Given** Event có `event_id: 101` đang ở trạng thái `In Progress`, **When** Staff cố chỉnh sửa core field `location: "TP.HCM"`, **Then** Hệ thống trả về HTTP 400 Bad Request với message "Cannot modify core fields when event is In Progress or Completed".

3. **Given** Event có `event_id: 102` đang có `approved_participants: 30`, **When** Staff cố giảm `max_capacity: 20` (thấp hơn 30), **Then** Hệ thống trả về HTTP 400 Bad Request với message "Max capacity cannot be lower than current approved participants".

4. **Given** Event có `event_id: 103` đang ở trạng thái `Completed`, **When** Staff cố chỉnh sửa `is_active: false` (soft delete), **Then** Hệ thống trả về HTTP 200, cập nhật `is_active`, không chạm vào core fields, và ghi Audit Log.

---

### User Story 3 - Quản lý vòng đời sự kiện qua các trạng thái (Priority: P2)

Là một Staff hoặc Manager, tôi muốn chuyển trạng thái sự kiện từ `Draft` → `Published` → `Open` → `In Progress` → `Completed` để quản lý vòng đời sự kiện theo đúng quy trình.

**Why this priority**: Hỗ trợ quản lý tiến độ sự kiện và kiểm soát các thao tác được phép ở mỗi giai đoạn.

**Independent Test**: Gọi API `PATCH /api/v1/staff/events/:id/status` với các status transitions hợp lệ và không hợp lệ, kiểm tra hệ thống validate đúng thứ tự.

**Acceptance Scenarios**:

1. **Given** Event có `event_id: 110` đang ở trạng thái `Draft`, **When** Staff gọi API chuyển status sang `Published`, **Then** Hệ thống trả về HTTP 200, cập nhật status, và ghi Audit Log.

2. **Given** Event có `event_id: 111` đang ở trạng thái `Published`, **When** Staff gọi API chuyển status sang `In Progress` (bỏ qua `Open`), **Then** Hệ thống trả về HTTP 400 Bad Request với message "Invalid status transition. Expected: Open".

3. **Given** Event có `event_id: 112` đang ở trạng thái `Completed`, **When** Staff cố chuyển status về `In Progress`, **Then** Hệ thống trả về HTTP 400 Bad Request với message "Cannot revert status from Completed".

4. **Given** Event có `event_id: 113` đang ở trạng thái `Open`, **When** Staff gọi API chuyển status sang `In Progress`, **Then** Hệ thống trả về HTTP 200, cập nhật status, lock core fields, và ghi Audit Log.

---

### Edge Cases

- **Concurrent edit on same event**: WHERE 2 Staff cùng cố chỉnh sửa cùng một Event cùng lúc, hệ thống MUST sử dụng Optimistic Locking (version field hoặc updated_at) để phát hiện conflict. Staff thứ hai MUST nhận HTTP 409 Conflict với message "Event has been modified by another user".

- **Status transition during concurrent operations**: WHERE Event chuyển từ `Published` sang `In Progress` trong khi Staff đang chỉnh sửa core field, hệ thống MUST rollback transaction và MUST trả về HTTP 400 Bad Request.

- **Soft delete event with active applications**: WHERE Event bị soft delete (`is_active: false`) và có Applications với status `Approved` hoặc `Pending`, hệ thống MUST giữ nguyên trạng thái Applications (không auto-cancel) để bảo toàn dữ liệu lịch sử. Notification cho Volunteers thuộc về Module Notification (Member 5).

- **Increase capacity with pending applications**: WHERE Staff tăng `max_capacity` từ 50 lên 100 cho Event đã đầy và có 30 Applications `Pending`, hệ thống MUST NOT tự động duyệt các Applications này. Staff MUST duyệt thủ công thông qua chức năng Application Approval.

- **Event date validation**: WHERE Staff tạo hoặc chỉnh sửa Event với `event_date` trong quá khứ hoặc `start_time >= end_time`, hệ thống MUST trả về HTTP 400 Bad Request với message cụ thể.

- **Staff deactivated mid-transaction**: WHERE Staff bị khóa tài khoản (`is_active: false`) trong khi đang thực hiện transaction tạo/chỉnh sửa Event, hệ thống MUST rollback transaction và MUST trả về HTTP 401 Unauthorized.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST validate `max_capacity` phải là số nguyên dương (> 0) khi tạo hoặc chỉnh sửa Event. Nếu vi phạm, system MUST trả về HTTP 400 Bad Request.

- **FR-002**: System MUST validate `event_date` không được ở trong quá khứ (trước ngày hiện tại) khi tạo Event. Khi chỉnh sửa Event ở trạng thái `Draft` hoặc `Published`, system MUST cho phép thay đổi `event_date` nhưng vẫn phải validate không quá khứ.

- **FR-003**: System MUST validate `start_time < end_time` cho Event. Nếu vi phạm, system MUST trả về HTTP 400 Bad Request với message "Start time must be before end time".

- **FR-004**: System MUST enforce Status Invariant: TUYỆT ĐỐI KHÔNG cho phép chỉnh sửa Core Fields (`event_date`, `start_time`, `end_time`, `location`, `description`, `required_skills`, `max_capacity`) khi Event có status `In Progress` hoặc `Completed`. Nếu vi phạm, system MUST trả về HTTP 400 Bad Request.

- **FR-005**: System MUST enforce Capacity Constraint: khi chỉnh sửa `max_capacity`, giá trị mới KHÔNG được thấp hơn `approved_participants` hiện tại. Nếu vi phạm, system MUST trả về HTTP 400 Bad Request với message "Max capacity cannot be lower than current approved participants".

- **FR-006**: System MUST implement Soft Delete: khi xóa Event, chỉ cập nhật `is_active = false`, TUYỆT ĐỐI KHÔNG xóa vật lý bản ghi khỏi database. Event đã soft delete vẫn phải xuất hiện trong queries với filter `is_active = false`.

- **FR-007**: System MUST kiểm tra quyền hạn Staff bằng cách verify `staff_event_assignments` hoặc `organization_id` để đảm bảo Staff được phân công quản lý Event hoặc Organization đó. Nếu không có quyền, system MUST trả về HTTP 403 Forbidden.

- **FR-008**: System MUST extract `userId` từ JWT HttpOnly Cookie (`req.user.id`) để xác định Staff thực hiện thao tác, KHÔNG tin tưởng dữ liệu `staff_id` từ request body.

- **FR-009**: System MUST validate Status Transition tuân thủ thứ tự: `Draft` → `Published` → `Open` → `In Progress` → `Completed`. Không cho phép skip states hoặc revert từ `Completed`. Nếu vi phạm, system MUST trả về HTTP 400 Bad Request.

- **FR-010**: System MUST ghi Audit Log entry mỗi khi tạo, chỉnh sửa, hoặc thay đổi status Event, bao gồm: `staff_id`, `event_id`, `action` (create/update/delete/status_change), `old_value`, `new_value`, và `timestamp`.

- **FR-011**: System MUST sử dụng Prisma ORM cho tất cả thao tác database để đảm bảo tính ACID. Các thao tác chỉnh sửa có risk cao (concurrent edit) SHOULD sử dụng Optimistic Locking với field `version` hoặc `updated_at`.

- **FR-012**: System MUST validate Categories và Skills tồn tại trong database trước khi tạo Event. Nếu không tồn tại, system MUST trả về HTTP 400 Bad Request với message "Invalid category or skill ID".

### Key Entities

- **Event**: Đại diện cho sự kiện tình nguyện. Thuộc tính nghiệp vụ chính: tên sự kiện, mô tả, thời gian (ngày, giờ bắt đầu, giờ kết thúc), địa điểm, sức chứa tối đa, số người đã duyệt, trạng thái vòng đời, danh mục và kỹ năng yêu cầu, trạng thái active. Được quản lý bởi Member 3 (Staff Operations).

- **Category**: Đại diện cho danh mục sự kiện (ví dụ: Môi trường, Giáo dục, Y tế). Được tạo và quản lý bởi Member 4 (Category Management).

- **Skill**: Đại diện cho kỹ năng yêu cầu cho tình nguyện viên tham gia sự kiện (ví dụ: Tiếng Anh, Lái xe, Sơ cứu). Được tạo và quản lý bởi Member 4.

- **Staff**: Nhân viên được phân công quản lý sự kiện hoặc tổ chức. Có quyền tạo, chỉnh sửa, và xóa mềm Event trong phạm vi quản lý.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% Events phải tuân thủ Status Invariant: không có Event nào bị chỉnh sửa Core Fields khi status là `In Progress` hoặc `Completed` (verified qua integration test và audit log review).

- **SC-002**: 100% Events phải tuân thủ Capacity Constraint: `max_capacity >= approved_participants` trong mọi thời điểm (verified qua database constraint và integration test).

- **SC-003**: Thời gian phản hồi API tạo Event trung bình dưới 500ms tại p95 (không bao gồm upload hình ảnh Cloudinary).

- **SC-004**: 100% các thao tác tạo, chỉnh sửa, xóa Event được ghi lại trong Audit Log với đầy đủ thông tin (staff_id, action, old_value, new_value, timestamp).

---

## Assumptions

- **A-001**: Các danh mục sự kiện (Categories) và bộ kỹ năng (Skills) đã được Member 4 khởi tạo đầy đủ trong hệ thống trước khi Staff tạo Event.

- **A-002**: Staff thực hiện thao tác được xác thực qua JWT Token lưu trong HttpOnly Cookie, với `userId` được extract từ `req.user.id` bởi middleware authentication đã được implement.

- **A-003**: Hình ảnh sự kiện (event banner/thumbnail) sẽ được upload và lưu trữ qua Cloudinary. Integration với Cloudinary SDK đã được cấu hình sẵn trong Backend. Upload failure KHÔNG được block việc tạo Event (optional field).

- **A-004**: Bảng `staff_event_assignments` hoặc cơ chế phân quyền tương tự đã tồn tại trong database để xác định Staff nào được phân công quản lý Event hoặc Organization nào.

- **A-005**: Frontend đã cấu hình HTTP client để gửi credentials (cookies) tự động trong mọi request đến Backend với `withCredentials: true`.

- **A-006**: Logic auto-approve Applications khi tăng `max_capacity` KHÔNG nằm trong scope Event Management. Staff phải duyệt thủ công qua chức năng Application Approval (Member 3).

---

## Out of Scope

Các tính năng sau **KHÔNG** nằm trong phạm vi của tính năng này và sẽ không được implement trong sprint hiện tại:

- **Duplicate Event (Clone Event)**: Tính năng sao chép một sự kiện hiện có để tạo sự kiện mới tương tự (với thông tin giống nhau nhưng thời gian khác) sẽ được xem xét trong version sau.

- **Bulk Operations (Tạo/Xóa nhiều Event cùng lúc)**: Sprint này chỉ hỗ trợ thao tác đơn lẻ (single event create/update/delete). Bulk operations sẽ được xem xét nếu có nhu cầu thực tế.

- **Recurring Events (Sự kiện định kỳ)**: Tính năng tạo sự kiện lặp lại theo chu kỳ (hàng tuần, hàng tháng) là out of scope cho version hiện tại. Mỗi sự kiện phải được tạo thủ công.

- **Event Template (Mẫu sự kiện)**: Tính năng lưu template để tái sử dụng cho các sự kiện tương tự sẽ được implement trong iteration sau nếu có nhu cầu.

- **Auto-approve Applications khi tăng Capacity**: Khi Staff tăng `max_capacity`, hệ thống KHÔNG tự động duyệt các Applications `Pending`. Staff phải duyệt thủ công qua chức năng Application Approval.

- **Email/Notification cho Volunteers**: Việc thông báo cho Volunteers khi Event bị soft delete hoặc thay đổi thông tin quan trọng sẽ được xử lý bởi Module Notification (Member 5), không nằm trong scope Event Management.

- **Event Analytics/Dashboard**: Tính năng báo cáo chi tiết về tỷ lệ lấp đầy, biểu đồ thống kê sẽ được implement trong module riêng biệt (thuộc về Member 4 - Reporting).

- **Event Review/Rating System**: Tính năng cho phép Volunteers đánh giá và review sự kiện sau khi hoàn thành là out of scope và sẽ được xem xét trong version sau.

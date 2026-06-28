# Feature Specification: View Attendance List (UC46)
**Feature Branch**: `046-feat-view-attendance-list`
**Created**: 2026-06-28
**Status**: DRAFT
**Input**: User description: "Là một Staff, tôi muốn xem danh sách điểm danh của sự kiện để biết được những tình nguyện viên nào đã có mặt và những ai còn vắng mặt."

---

## User Scenarios & Testing
### User Story 1 - Xem danh sách hiện diện thời gian thực (Priority: P1)
Là một **Staff**, tôi muốn xem danh sách tất cả các tình nguyện viên đã được duyệt và trạng thái điểm danh tương ứng của họ.
**Why this priority**: Đây là chức năng cốt lõi để Staff nắm bắt tình hình nhân sự tại sự kiện.
**Independent Test**:
- Bước 1: Truy cập vào module Attendance và chọn một sự kiện đang diễn ra.
- Bước 2: Kiểm tra bảng danh sách hiển thị tên Volunteer và trạng thái (Check-in/Not Yet).
- Bước 3: Thực hiện check-in cho 1 người ở tab khác (UC45) và quay lại trang này để xác nhận trạng thái đã cập nhật.
**Acceptance Scenarios**:
1. **Given** Sự kiện có 10 Volunteer đã được duyệt, **When** Staff vào trang UC46, **Then** hệ thống trả về danh sách 10 người kèm trạng thái điểm danh chính xác từ database.

---

### User Story 2 - Lọc những người chưa vắng mặt (Priority: P1)
Là một **Staff**, tôi muốn lọc danh sách để chỉ hiển thị những tình nguyện viên chưa thực hiện điểm danh.
**Why this priority**: Giúp Staff nhanh chóng liên lạc hoặc tìm kiếm những người còn thiếu.
**Independent Test**:
- Bước 1: Tại trang danh sách điểm danh, chọn bộ lọc "Status" là "Absent/Not Checked-in".
- Bước 2: Nhấn "Apply".
- Bước 3: Xác nhận danh sách chỉ còn hiển thị những người chưa có thời gian check-in.
**Acceptance Scenarios**:
1. **Given** danh sách có cả người đã đến và chưa đến, **When** Staff chọn lọc theo trạng thái vắng mặt, **Then** API gửi request với param `status=absent` và trả về đúng dữ liệu.

---

## Requirements
### Functional Requirements
- **FR-001**: **WHEN** Staff yêu cầu xem danh sách, **THE** system **SHALL** verify quyền sở hữu sự kiện dựa trên `organization_id` của Staff.
- **FR-002**: **WHEN** hiển thị danh sách, **THE** system **SHALL** bao gồm các thông tin: Họ tên Volunteer, Trạng thái (Present/Absent), và Thời gian điểm danh (nếu có).
- **FR-003**: **WHERE** danh sách vượt quá 50 người, **THE** system **SHALL** tự động phân trang (Pagination).
- **FR-004**: **WHEN** Staff nhập vào ô tìm kiếm, **THE** system **SHALL** lọc danh sách theo tên Volunteer ngay lập tức (Debounce 300ms).
- **FR-005**: **WHERE** một bản ghi điểm danh được cập nhật từ UC45, **THE** system **SHALL** cho phép Staff làm mới (Refresh) danh sách để nhận dữ liệu mới nhất.
- **FR-016**: **WHEN** hiển thị danh sách, **THE** system **MUST NOT** tiết lộ thông tin cá nhân nhạy cảm của Volunteer như CMND/CCCD hoặc địa chỉ nhà.
- **FR-018**: **WHEN** đang tải dữ liệu từ API, **THE** system **SHALL** hiển thị biểu tượng Loading để Staff không thực hiện các thao tác khác.

---

### Key Entities
- **Attendance**: Thực thể chứa thông tin về việc có mặt của Volunteer (Status, CheckedInAt).
- **Volunteer (User)**: Thông tin định danh của người tham gia (FullName, Avatar).
- **Event**: Thực thể chứa ngữ cảnh về sự kiện đang được theo dõi.

---

## Success Criteria
- **SC-001**: Danh sách 100 Volunteer đầu tiên phải được hiển thị trong vòng dưới 1 giây.
- **SC-002**: 100% dữ liệu về thời gian điểm danh phải khớp tuyệt đối với dữ liệu được ghi nhận tại UC45.
- **SC-007**: Frontend không gửi yêu cầu lấy dữ liệu trùng lặp nếu người dùng nhấn nút Refresh liên tục.

---

## Assumptions
- **A-001**: Database đã được cấu hình index cho các cột `event_id` và `volunteer_id` trong bảng Attendance.
- **A-006**: Chức năng điểm danh (UC45) đã hoàn thiện và cung cấp dữ liệu đầu vào ổn định.
- **A-008**: Staff đã được định danh chính xác qua hệ thống Authentication của Member 1.

---

## Out of Scope
Các tính năng sau KHÔNG nằm trong phạm vi của UC46:
- [Feature 1: Chỉnh sửa hoặc xóa bản ghi điểm danh trực tiếp tại đây].
- [Feature 2: Gửi tin nhắn nhắc nhở cho những người vắng mặt].
- [Feature 3: Phân tích biểu đồ tỷ lệ tham gia (đây là nhiệm vụ của UC55 - Event Statistics)].
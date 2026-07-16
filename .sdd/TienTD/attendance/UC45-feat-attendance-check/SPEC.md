# Feature Specification: Attendance Check (UC45)
**Feature Branch**: `045-feat-attendance-check`
**Created**: 2026-06-28
**Status**: DRAFT
**Input**: User description: "Là một Staff, tôi muốn thực hiện điểm danh cho các tình nguyện viên có mặt tại sự kiện để ghi nhận sự tham gia của họ vào hệ thống."

---

## User Scenarios & Testing
### User Story 1 - Điểm danh từng tình nguyện viên (Priority: P1)
Là một **Staff**, tôi muốn tìm tên một Volunteer trong danh sách và nhấn "Check-in" để xác nhận họ có mặt.
**Why this priority**: Đây là chức năng quan trọng nhất để ghi nhận đóng góp của Volunteer.
**Independent Test**:
- Bước 1: Truy cập vào danh sách điểm danh của một sự kiện đang diễn ra.
- Bước 2: Tìm kiếm Volunteer bằng tên.
- Bước 3: Nhấn nút "Check-in" bên cạnh tên Volunteer.
- Bước 4: Kiểm tra trạng thái của Volunteer chuyển thành "Attended" và thời gian điểm danh được lưu lại.
**Acceptance Scenarios**:
1. **Given** Volunteer có đơn đăng ký `Approved`, **When** Staff nhấn "Check-in", **Then** hệ thống trả về HTTP 200 OK và cập nhật bảng `Attendance` với trạng thái `Present`.

---

### User Story 2 - Điểm danh hàng loạt (Priority: P2)
Là một **Staff**, tôi muốn chọn nhiều Volunteer cùng lúc và xác nhận sự có mặt để tiết kiệm thời gian khi có đoàn khách đến.
**Why this priority**: Tăng hiệu suất điểm danh khi sự kiện có số lượng người tham gia lớn.
**Independent Test**:
- Bước 1: Tích chọn các checkbox bên cạnh tên 5 Volunteer.
- Bước 2: Nhấn nút "Bulk Check-in".
- Bước 3: Xác nhận tại pop-up.
- Bước 4: Kiểm tra cả 5 Volunteer đều được cập nhật trạng thái "Attended".
**Acceptance Scenarios**:
1. **Given** một danh sách nhiều Volunteer chưa điểm danh, **When** Staff thực hiện bulk check-in, **Then** hệ thống xử lý trong một transaction và gửi thông báo thành công cho toàn bộ danh sách.

---

## Requirements
### Functional Requirements
- **FR-001**: **WHEN** Staff thực hiện điểm danh, **THE** system **SHALL** kiểm tra quyền của Staff đối với Organization sở hữu sự kiện.
- **FR-002**: **WHEN** ghi nhận điểm danh, **THE** system **SHALL** lưu trữ: ApplicationID, StaffID (người thực hiện), và AttendanceTimestamp.
- **FR-003**: **WHERE** một Volunteer đã được điểm danh trước đó, **THE** system **SHALL** disable nút Check-in để tránh trùng lặp dữ liệu.
- **FR-004**: **WHEN** trang danh sách điểm danh tải, **THE** system **SHALL** chỉ hiển thị những Volunteer có trạng thái `Approved`.
- **FR-005**: **WHERE** sự kiện đã ở trạng thái `Completed`, **THE** system **SHALL** khóa chức năng điểm danh và hiển thị thông báo "Event has ended."
- **FR-016**: **WHEN** thực hiện điểm danh, **THE** system **MUST NOT** yêu cầu Staff nhập bất kỳ mật khẩu hay mã bảo mật nào của Volunteer.
- **FR-018**: **WHEN** Staff nhấn nút Check-in, **THE** system **SHALL** hiển thị trạng thái loading và disable nút để tránh double-submit.

---

### Key Entities
- **Attendance**: Thực thể lưu trữ thông tin điểm danh. Thuộc tính: EventID, VolunteerID, Status (Present/Absent), CheckedInAt.
- **Application**: Dùng để lọc danh sách Volunteer đã được duyệt (Approved).

---

## Success Criteria
- **SC-001**: Thời gian xử lý một yêu cầu điểm danh đơn lẻ phải dưới 0.8 giây để đảm bảo không gây ùn tắc tại quầy check-in.
- **SC-002**: 100% bản ghi điểm danh phải được gắn đúng với Staff ID người thực hiện để phục vụ audit.
- **SC-007**: UI phải hỗ trợ thanh tìm kiếm (Search bar) hoạt động mượt mà với danh sách lên tới 200 người.

---

## Assumptions
- **A-001**: Thiết bị của Staff có kết nối internet ổn định tại thời điểm điểm danh.
- **A-005**: Database đã thiết lập quan hệ chặt chẽ giữa `Attendance` và `Applications` để đảm bảo dữ liệu không mâu thuẫn.
- **A-008**: Chỉ có Staff và Admin mới thấy được menu Attendance.

---

## Out of Scope
Các tính năng sau KHÔNG nằm trong phạm vi của UC45:
- [Feature 1: Tự động cấp chứng nhận sau khi check-in (đây là UC53)].
- [Feature 2: Điểm danh bằng nhận diện khuôn mặt (FaceID)].
- [Feature 3: Theo dõi vị trí GPS của Volunteer khi điểm danh].
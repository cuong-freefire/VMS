# Feature Specification: View Attendance History (UC47)
**Feature Branch**: `047-feat-attendance-history`
**Created**: 2026-06-28
**Status**: DRAFT
**Input**: User description: "Là một Staff, tôi muốn xem lại lịch sử điểm danh của các sự kiện cũ để phục vụ việc kiểm tra và báo cáo đóng góp của tình nguyện viên."

---

## User Scenarios & Testing
### User Story 1 - Tra cứu lịch sử theo sự kiện (Priority: P1)
Là một **Staff**, tôi muốn chọn một sự kiện đã kết thúc để xem danh sách những người đã tham gia.
**Why this priority**: Đây là nhu cầu cơ bản nhất để đối soát dữ liệu sau sự kiện.
**Independent Test**:
- Bước 1: Truy cập trang "Attendance History".
- Bước 2: Chọn một sự kiện từ danh sách sự kiện đã hoàn thành.
- Bước 3: Kiểm tra bảng hiển thị danh sách Volunteer kèm thời gian check-in.
**Acceptance Scenarios**:
1. **Given** Staff chọn một sự kiện hợp lệ của tổ chức, **When** nhấn "View", **Then** hệ thống trả về danh sách lịch sử điểm danh đầy đủ từ database.

---

### User Story 2 - Tìm kiếm lịch sử của một Volunteer cụ thể (Priority: P1)
Là một **Staff**, tôi muốn nhập tên một tình nguyện viên để xem tất cả các sự kiện mà người đó đã tham gia trong tổ chức của tôi.
**Why this priority**: Giúp Staff đánh giá nhanh quá trình đóng góp của một cá nhân cụ thể.
**Independent Test**:
- Bước 1: Tại thanh tìm kiếm của trang lịch sử, nhập tên Volunteer.
- Bước 2: Nhấn nút tìm kiếm.
- Bước 3: Xác nhận kết quả hiển thị danh sách các sự kiện mà người này đã tham gia (với trạng thái Present).
**Acceptance Scenarios**:
1. **Given** tên Volunteer tồn tại trong hệ thống, **When** Staff thực hiện tìm kiếm, **Then** API trả về danh sách các bản ghi điểm danh liên quan đến Volunteer đó trong phạm vi tổ chức.

---

## Requirements
### Functional Requirements
- **FR-001**: **WHEN** Staff truy cập trang lịch sử, **THE** system **SHALL** kiểm tra quyền truy cập dựa trên `organization_id` của Staff.
- **FR-002**: **WHEN** trả về dữ liệu lịch sử, **THE** system **SHALL** bao gồm: Tên sự kiện, Thời gian sự kiện, Tên Volunteer, Trạng thái (Present/Absent), và Thời gian điểm danh thực tế.
- **FR-003**: **WHERE** Staff chọn lọc theo thời gian, **THE** system **SHALL** trả về các bản ghi có `event_date` nằm trong khoảng StartDate và EndDate đã chọn.
- **FR-004**: **WHEN** dữ liệu lịch sử quá lớn (trên 50 bản ghi), **THE** system **SHALL** thực hiện phân trang (Pagination).
- **FR-005**: **WHERE** không tìm thấy kết quả phù hợp, **THE** system **SHALL** hiển thị thông báo "No attendance history found for the selected criteria."
- **FR-016**: **WHEN** hiển thị lịch sử, **THE** system **MUST NOT** cho phép Staff chỉnh sửa hay xóa các bản ghi điểm danh cũ (Read-only mode).
- **FR-018**: **WHEN** thực hiện yêu cầu xuất file hoặc lọc dữ liệu nặng, **THE** system **SHALL** hiển thị thanh trạng thái loading để tránh double-submit.

---

### Key Entities
- **Attendance**: Thực thể chính chứa lịch sử điểm danh (Status, CheckedInAt).
- **Event**: Thực thể chứa thông tin về sự kiện đã diễn ra (Title, EndDate).
- **Volunteer**: Thông tin định danh của người tham gia.

---

## Success Criteria
- **SC-001**: Trang lịch sử tổng hợp phải tải xong trong vòng dưới 1.5 giây đối với dữ liệu tiêu chuẩn (1000 bản ghi).
- **SC-002**: 100% dữ liệu lịch sử phải khớp với dữ liệu đã được ghi nhận tại UC45 (Attendance Check).
- **SC-007**: Hệ thống phải hỗ trợ tìm kiếm theo tên Volunteer ngay cả khi chỉ nhập một phần tên (Partial search).

---

## Assumptions
- **A-001**: Dữ liệu từ các sự kiện cũ đã được lưu trữ và đánh index (event_id, volunteer_id) để tối ưu hóa việc tìm kiếm.
- **A-005**: Chức năng Authentication của Member 1 đã cung cấp đầy đủ thông tin Organization ID của Staff đang đăng nhập.
- **A-008**: Các bản ghi điểm danh của sự kiện bị xóa (Soft delete) sẽ không xuất hiện trong báo cáo lịch sử trừ khi có yêu cầu đặc biệt.

---

## Out of Scope
Các tính năng sau KHÔNG nằm trong phạm vi của UC47:
- [Feature 1: Chỉnh sửa trạng thái điểm danh trong quá khứ].
- [Feature 2: Khôi phục các bản ghi điểm danh đã bị xóa].
- [Feature 3: Phân tích biểu đồ xu hướng tham gia (đây là nhiệm vụ của UC55 - Event Statistics)].
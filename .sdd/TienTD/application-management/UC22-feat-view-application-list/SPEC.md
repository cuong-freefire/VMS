# Feature Specification: View Application List (UC22)
**Feature Branch**: `022-feat-view-application-list`
**Created**: 2026-06-28
**Status**: DRAFT
**Input**: User description: "Là một Staff, tôi muốn xem danh sách các tình nguyện viên đã đăng ký tham gia sự kiện để tôi có thể bắt đầu quy trình sàng lọc và phê duyệt."

---

## User Scenarios & Testing
### User Story 1 - Xem danh sách đăng ký theo sự kiện (Priority: P1)
Là một **Staff**, tôi muốn chọn một sự kiện cụ thể và xem tất cả các đơn đăng ký của sự kiện đó.
**Why this priority**: Đây là luồng làm việc chính để Staff quản lý nhân sự cho từng hoạt động.
**Independent Test**:
- Bước 1: Truy cập vào trang quản lý sự kiện.
- Bước 2: Nhấn vào nút "View Applications" của một sự kiện.
- Bước 3: Kiểm tra bảng hiển thị danh sách các Volunteer (Tên, Ngày đăng ký, Trạng thái).
**Acceptance Scenarios**:
1. **Given** Staff đã chọn một Event ID hợp lệ, **When** trang tải, **Then** hệ thống trả về danh sách ứng viên được sắp xếp theo thời gian đăng ký mới nhất.

---

### User Story 2 - Lọc đơn đăng ký theo trạng thái (Priority: P1)
Là một **Staff**, tôi muốn lọc danh sách để chỉ thấy các đơn ở trạng thái "Submitted" (Đang chờ duyệt).
**Why this priority**: Giúp Staff tập trung vào các đơn cần xử lý gấp.
**Independent Test**:
- Bước 1: Tại trang danh sách ứng viên, chọn Filter "Status" là "Submitted".
- Bước 2: Nhấn "Apply".
- Bước 3: Xác nhận tất cả các bản ghi hiển thị đều có trạng thái "Submitted".
**Acceptance Scenarios**:
1. **Given** danh sách đang hiển thị nhiều trạng thái, **When** Staff chọn lọc theo status, **Then** API gửi request kèm params `status=submitted` và trả về đúng dữ liệu lọc.

---

## Requirements
### Functional Requirements
- **FR-001**: **WHEN** Staff truy cập danh sách, **THE** system **SHALL** kiểm tra quyền truy cập dựa trên `organization_id` của Staff và sự kiện.
- **FR-002**: **WHEN** dữ liệu trả về, **THE** system **SHALL** bao gồm các trường: ApplicationID, VolunteerName, SubmittedAt, Status.
- **FR-003**: **WHERE** danh sách có nhiều hơn 20 bản ghi, **THE** system **SHALL** thực hiện phân trang (Pagination).
- **FR-004**: **WHEN** Staff nhấn vào tên một Volunteer, **THE** system **SHALL** điều hướng sang UC23 (View Application Detail).
- **FR-005**: **WHERE** không có đơn đăng ký nào, **THE** system **SHALL** hiển thị thông báo "No applications found for this event."
- **FR-016**: **WHEN** hiển thị danh sách, **THE** system **MUST NOT** hiển thị thông tin nhạy cảm như địa chỉ nhà hoặc số căn cước của Volunteer.

---

### Key Entities
- **Application**: Thực thể đơn đăng ký. Trạng thái: Submitted, Approved, Rejected.
- **Volunteer**: Thông tin cơ bản của người đăng ký tham gia.
- **Event**: Sự kiện chủ quản mà các đơn đăng ký này hướng tới.

---

## Success Criteria
- **SC-001**: Danh sách 50 ứng viên đầu tiên phải được hiển thị trong vòng dưới 1.2 giây.
- **SC-002**: 100% dữ liệu hiển thị phải khớp với thông tin mà Volunteer đã gửi qua UC12.
- **SC-007**: Nút "Filter" không gửi request nếu Staff chưa thay đổi điều kiện lọc.

---

## Assumptions
- **A-001**: Bảng `Applications` trong database đã được index theo `event_id` và `status` để tối ưu hóa truy vấn.
- **A-005**: Thông tin tên Volunteer được lấy thông qua liên kết (join) giữa bảng `Applications` và bảng `Users/Profiles`.
- **A-010**: Việc hiển thị ảnh đại diện (avatar) của Volunteer trong danh sách là tùy chọn (optional) dựa trên thiết kế UI.

---

## Out of Scope
Các tính năng sau KHÔNG nằm trong phạm vi của UC22:
- [Feature 1: Phê duyệt hoặc Từ chối ngay tại trang danh sách (đây là UC24/25)].
- [Feature 2: Sửa đổi thông tin trong đơn đăng ký của Volunteer].
- [Feature 3: Nhắn tin trực tiếp cho Volunteer từ danh sách (sẽ là module Chat)].
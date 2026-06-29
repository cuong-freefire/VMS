# Feature Specification: Add Event (UC15)
**Feature Branch**: `015-feat-add-event`
**Created**: 2026-06-28
**Status**: DRAFT
**Input**: User description: "Là một Staff, tôi muốn tạo một sự kiện tình nguyện mới để kêu gọi các Volunteer tham gia đóng góp cho tổ chức."

---

## User Scenarios & Testing
### User Story 1 - Tạo sự kiện cơ bản thành công (Priority: P1)
Là một **Staff**, tôi muốn nhập các thông tin cơ bản (Tên, ngày, địa điểm, mô tả) để tạo một sự kiện mới.
**Why this priority**: Đây là chức năng cốt lõi để hệ thống có dữ liệu hoạt động.
**Independent Test**:
- Bước 1: Truy cập trang "Add Event".
- Bước 2: Nhập đầy đủ thông tin hợp lệ.
- Bước 3: Click "Submit".
- Bước 4: Kiểm tra sự kiện mới xuất hiện trong danh sách sự kiện với trạng thái "Draft".
**Acceptance Scenarios**:
1. **Given** Staff đã đăng nhập, **When** nhập đầy đủ các trường bắt buộc và nhấn "Submit", **Then** hệ thống trả về HTTP 201 Created và hiển thị thông báo thành công.

---

## Requirements
### Functional Requirements
- **FR-001**: **WHEN** Staff nhấn "Submit", **THE** system **SHALL** validate các trường bắt buộc: Title, Start Date, End Date, Location, Description.
- **FR-002**: **WHEN** validate dữ liệu, **THE** system **SHALL** đảm bảo Start Date > Current Date.
- **FR-003**: **WHERE** Staff upload ảnh bìa sự kiện, **THE** system **SHALL** giới hạn định dạng (JPG, PNG) và dung lượng tối đa 5MB.
- **FR-004**: **WHEN** tạo thành công, **THE** system **SHALL** tự động gán `organization_id` của Staff vào bản ghi sự kiện.
- **FR-005**: **WHERE** thông tin nhập vào bị thiếu, **THE** system **SHALL** trả về lỗi 400 Bad Request kèm thông báo chi tiết field bị thiếu.
- **FR-016**: **WHEN** thực hiện lưu dữ liệu, **THE** system **MUST NOT** log các thông tin nhạy cảm của Staff ra console.

---

### Key Entities
- **Event**: Đại diện cho sự kiện tình nguyện. Thuộc tính: Title, Description, StartDate, EndDate, Location, Status (Draft/Published).
- **Organization**: Tổ chức chủ quản của sự kiện. Mỗi sự kiện phải thuộc về một Organization duy nhất.

---

## Success Criteria
- **SC-001**: Staff có thể hoàn thành việc tạo sự kiện trong vòng dưới 30 giây nếu đã có sẵn nội dung.
- **SC-002**: 100% sự kiện được tạo phải gắn đúng với Organization ID của người tạo.
- **SC-007**: Frontend không gửi duplicate request nếu Staff nhấn nút "Submit" nhiều lần liên tiếp.

---

## Assumptions
- **A-001**: Database đã có bảng `Events` và `Organizations` với các quan hệ được thiết lập sẵn.
- **A-006**: Chức năng upload ảnh đã được implement ở module dùng chung, UC15 chỉ gọi API để lấy link ảnh.

---

## Out of Scope
Các tính năng sau KHÔNG nằm trong phạm vi của UC15:
- [Feature 1: Gửi email thông báo cho tất cả Volunteer khi có sự kiện mới (sẽ thuộc UC64/65)].
- [Feature 2: Tự động đăng bài lên Facebook/LinkedIn].
- [Feature 3: Nhập danh sách sự kiện hàng loạt từ file Excel] [6].
# Feature Specification: Add Event (UC15)
**Feature Branch**: `015-feat-add-event`
**Created**: 2026-06-28
**Updated**: 2026-07-18
**Status**: REVIEWED

**Consistency Check**: Aligned with Prisma schema v3.0, AGENTS.md, response.util.js

---

## User Scenarios & Testing
### User Story 1 - Tạo sự kiện cơ bản thành công (Priority: P1)
Là một **Staff**, tôi muốn nhập các thông tin cơ bản (Tên, ngày, địa điểm, mô tả, danh mục) để tạo một sự kiện mới.
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
- **FR-001**: **WHEN** Staff nhấn "Submit", **THE** system **SHALL** validate các trường bắt buộc: title, description, start_date, end_date, location, max_capacity, category_id, application_deadline.
- **FR-002**: **WHEN** validate dữ liệu, **THE** system **SHALL** đảm bảo start_date > current date.
- **FR-003**: **WHERE** Staff upload ảnh bìa sự kiện, **THE** system **SHALL** giới hạn định dạng (JPG, PNG) và dung lượng tối đa 5MB.
- **FR-004**: **WHEN** tạo thành công, **THE** system **SHALL** tự động gán `created_by` từ JWT token vào bản ghi sự kiện.
- **FR-005**: **WHERE** thông tin nhập vào bị thiếu, **THE** system **SHALL** trả về lỗi 400 Bad Request kèm thông báo chi tiết field bị thiếu.
- **FR-006**: **WHEN** thực hiện lưu dữ liệu, **THE** system **MUST NOT** log các thông tin nhạy cảm của Staff ra console.

---

### Key Entities
- **Event**: Đại diện cho sự kiện tình nguyện. Thuộc tính theo Prisma schema: title, description, startDate, endDate, applicationDeadline, location, maxCapacity, categoryId, imageUrl, status (DRAFT/PENDING_APPROVAL/PUBLISHED/REJECTED/IN_PROGRESS/COMPLETED/CANCELLED), isActive.

---

## Success Criteria
- **SC-001**: Staff có thể hoàn thành việc tạo sự kiện trong vòng dưới 30 giây nếu đã có sẵn nội dung.
- **SC-002**: 100% sự kiện được tạo phải gắn đúng với `created_by` từ JWT token.
- **SC-003**: Frontend không gửi duplicate request nếu Staff nhấn nút "Submit" nhiều lần liên tiếp.

---

## Assumptions
- **A-001**: Database đã có bảng `events` và `event_categories` với các quan hệ được thiết lập sẵn (xem schema.prisma).
- **A-002**: Chức năng upload ảnh đã được implement ở module dùng chung, UC15 chỉ gọi API để lấy link ảnh.

---

## Out of Scope
Các tính năng sau KHÔNG nằm trong phạm vi của UC15:
- Gửi email thông báo cho tất cả Volunteer khi có sự kiện mới.
- Tự động đăng bài lên Facebook/LinkedIn.
- Nhập danh sách sự kiện hàng loạt từ file Excel.
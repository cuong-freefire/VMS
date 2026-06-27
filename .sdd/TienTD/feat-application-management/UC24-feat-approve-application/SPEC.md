# Feature Specification: Approve Application (UC24)
**Feature Branch**: `024-feat-approve-application`
**Created**: 2026-06-28
**Status**: DRAFT
**Input**: User description: "Là một Staff, tôi muốn phê duyệt đơn đăng ký của một tình nguyện viên để họ có thể chính thức tham gia vào sự kiện."

---

## User Scenarios & Testing
### User Story 1 - Phê duyệt đơn đăng ký từ trang chi tiết (Priority: P1)
Là một **Staff**, sau khi xem hồ sơ chi tiết của ứng viên, tôi muốn nhấn "Approve" để chấp nhận họ vào sự kiện.
**Why this priority**: Đây là chức năng cốt lõi để hoàn thành quy trình tuyển chọn.
**Independent Test**:
- Bước 1: Mở trang chi tiết đơn đăng ký (UC23).
- Bước 2: Nhấn nút "Approve".
- Bước 3: Xác nhận trạng thái đơn chuyển sang "Approved" trên UI.
- Bước 4: Kiểm tra log hệ thống ghi nhận sự thay đổi.
**Acceptance Scenarios**:
1. **Given** Đơn đăng ký đang ở trạng thái `Submitted`, **When** Staff nhấn "Approve", **Then** hệ thống trả về HTTP 200 OK, cập nhật status và trigger dịch vụ gửi email xác nhận.

---

### User Story 2 - Phê duyệt hàng loạt từ danh sách (Priority: P2)
Là một **Staff**, tôi muốn chọn nhiều ứng viên từ danh sách và phê duyệt tất cả cùng lúc.
**Why this priority**: Tiết kiệm thời gian cho Staff khi quản lý sự kiện quy mô lớn.
**Independent Test**:
- Bước 1: Tại trang danh sách ứng viên (UC22), tích chọn 5 ứng viên.
- Bước 2: Nhấn nút "Bulk Approve".
- Bước 3: Xác nhận tất cả 5 ứng viên đều chuyển sang trạng thái "Approved".
**Acceptance Scenarios**:
1. **Given** 5 đơn đăng ký hợp lệ, **When** Staff thực hiện bulk approve, **Then** hệ thống xử lý qua một transaction duy nhất và trả về thông báo thành công cho cả 5 bản ghi.

---

## Requirements
### Functional Requirements
- **FR-001**: **WHEN** Staff nhấn "Approve", **THE** system **SHALL** kiểm tra `organization_id` của sự kiện để đảm bảo tính hợp lệ về quyền.
- **FR-002**: **WHEN** trạng thái cập nhật thành công, **THE** system **SHALL** tự động gọi dịch vụ UC64 (Event Approval Email) để gửi thông báo cho Volunteer.
- **FR-003**: **WHERE** số lượng ứng viên đã được duyệt đạt giới hạn tối đa của sự kiện, **THE** system **SHALL** hiển thị cảnh báo nhưng vẫn cho phép Staff phê duyệt nếu họ muốn thêm danh sách dự phòng.
- **FR-004**: **WHEN** thực hiện Approve, **THE** system **SHALL** cập nhật các trường `status`, `updated_at`, và `processed_by_staff_id`.
- **FR-005**: **WHERE** đơn đăng ký đang bị khóa hoặc đã bị xóa (Soft delete), **THE** system **SHALL** trả về lỗi 400 Bad Request.
- **FR-016**: **WHEN** ghi log hành động phê duyệt, **THE** system **MUST NOT** lưu trữ các thông tin nhạy cảm của Volunteer trong nội dung log.
- **FR-018**: **WHEN** Staff nhấn nút Approve, **THE** system **SHALL** disable nút ngay lập tức để tránh tình trạng double-submit và gửi nhiều email trùng lặp.

---

### Key Entities
- **Application**: Thực thể chính được cập nhật trạng thái từ `Submitted/Reviewed` sang `Approved`.
- **Event**: Dùng để kiểm tra giới hạn số lượng và quyền quản lý của Staff.
- **Staff**: Người thực hiện hành động và được lưu vết trong lịch sử xử lý đơn.

---

## Success Criteria
- **SC-001**: Thời gian cập nhật trạng thái đơn đăng ký và trigger email phải hoàn tất dưới 2 giây.
- **SC-002**: 100% các đơn được phê duyệt thành công phải xuất hiện ngay lập tức trong danh sách điểm danh (UC45).
- **SC-007**: Frontend không cho phép nhấn nút Approve nếu trạng thái hiện tại của đơn đã là Approved.

---

## Assumptions
- **A-001**: Dịch vụ email (UC64) đã được cấu hình chính xác và có thể nhận tham số `application_id`.
- **A-005**: Database sử dụng ACID transaction để đảm bảo dữ liệu không bị sai lệch khi phê duyệt hàng loạt.
- **A-008**: Các trạng thái đơn đăng ký (`Approved`, `Rejected`, `Submitted`) là cố định trong hệ thống.

---

## Out of Scope
Các tính năng sau KHÔNG nằm trong phạm vi của UC24:
- [Feature 1: Đảo ngược trạng thái từ Approved về Submitted (Undo)].
- [Feature 2: Thay đổi nội dung email thông báo trúng tuyển (đây là UC riêng về Template Email)].
- [Feature 3: Phê duyệt tự động dựa trên AI (Auto-approval)].
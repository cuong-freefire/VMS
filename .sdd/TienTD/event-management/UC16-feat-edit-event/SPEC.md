2. File SPEC.md
# Feature Specification: Edit Event (UC16)
**Feature Branch**: `016-feat-edit-event`
**Created**: 2026-06-28
**Status**: DRAFT
**Input**: User description: "Là một Staff, tôi muốn chỉnh sửa thông tin sự kiện để cập nhật những thay đổi mới nhất cho tình nguyện viên."

---

## User Scenarios & Testing
### User Story 1 - Chỉnh sửa thông tin cơ bản thành công (Priority: P1)
Là một **Staff**, tôi muốn cập nhật mô tả và số lượng Volunteer cần thiết của một sự kiện đang ở trạng thái `Draft`.
**Why this priority**: Đây là nhu cầu phổ biến nhất để hoàn thiện nội dung sự kiện trước khi công bố.
**Independent Test**:
- Bước 1: Chọn một sự kiện ở trạng thái `Draft` từ danh sách quản lý.
- Bước 2: Thay đổi Description và Max Volunteers.
- Bước 3: Nhấn "Save Changes".
- Bước 4: Quay lại trang chi tiết sự kiện để xác nhận dữ liệu đã được cập nhật.
**Acceptance Scenarios**:
1. **Given** Staff đã đăng nhập và chọn đúng sự kiện của tổ chức mình, **When** gửi request cập nhật với dữ liệu hợp lệ, **Then** hệ thống trả về HTTP 200 OK và cập nhật database thành công.

---

### User Story 2 - Ngăn chặn chỉnh sửa ngày về quá khứ (Priority: P1)
Là một **Staff**, tôi không được phép đổi ngày diễn ra sự kiện về một ngày trước ngày hiện tại.
**Why this priority**: Đảm bảo tính logic của dữ liệu sự kiện.
**Independent Test**:
- Bước 1: Mở form chỉnh sửa một sự kiện.
- Bước 2: Chọn Start Date là ngày hôm qua.
- Bước 3: Nhấn "Save".
- Bước 4: Kiểm tra thông báo lỗi hiển thị trên màn hình.
**Acceptance Scenarios**:
1. **Given** form edit đang mở, **When** input Start Date < Today, **Then** hệ thống hiển thị lỗi "Start date cannot be in the past" và không cho phép submit.

---

## Requirements
### Functional Requirements
- **FR-001**: **WHEN** Staff nhấn "Save", **THE** system **SHALL** kiểm tra quyền sở hữu (ownership) để đảm bảo Staff thuộc cùng Org với Event đó.
- **FR-002**: **WHERE** sự kiện đã có Volunteer đăng ký, **THE** system **SHALL** hiển thị cảnh báo xác nhận nếu Staff thay đổi Thời gian hoặc Địa điểm.
- **FR-003**: **WHEN** lưu thành công, **THE** system **SHALL** cập nhật trường `updated_at` và `updated_by` trong database.
- **FR-004**: **WHERE** Staff upload ảnh mới, **THE** system **SHALL** thay thế ảnh cũ và xóa ảnh cũ khỏi storage để tiết kiệm dung lượng.
- **FR-005**: **WHEN** API trả về lỗi (VD: mất kết nối), **THE** system **SHALL** hiển thị thông báo "Update failed, please try again" và giữ nguyên dữ liệu trong form.
- **FR-016**: **WHEN** thực hiện update, **THE** system **MUST NOT** làm thay đổi ID của sự kiện hoặc Organization ID gắn kèm.

---

### Key Entities
- **Event**: Thực thể chính cần chỉnh sửa. Các trạng thái cần lưu ý: Draft, Published.
- **Audit Log**: Đại diện cho bản ghi lịch sử thay đổi. Thuộc tính: EventID, StaffID, ChangedFields, OldValue, NewValue, Timestamp.

---

## Success Criteria
- **SC-001**: Thời gian phản hồi của API cập nhật phải dưới 1.5 giây trong điều kiện mạng bình thường.
- **SC-002**: 100% các thay đổi đối với trường "Địa điểm" và "Thời gian" của sự kiện đã Publish phải kích hoạt log hệ thống.
- **SC-007**: UI phải disable nút "Save" ngay sau khi click lần đầu để tránh gửi trùng request (double-submit).

---

## Assumptions
- **A-001**: Giả định Staff đang truy cập hệ thống qua kết nối internet ổn định.
- **A-006**: Chức năng kiểm tra quyền (Authorization Middleware) đã được xây dựng và hoạt động chính xác.
- **A-009**: Việc gửi email thông báo thay đổi (Notification) là một service riêng, UC16 chỉ thực hiện trigger sự kiện này.

---

## Out of Scope
Các tính năng sau KHÔNG nằm trong phạm vi của UC16:
- [Feature 1: Hoàn tác (Undo) các thay đổi về phiên bản trước đó].
- [Feature 2: Staff chỉnh sửa đơn đăng ký của Volunteer (thuộc module Application Management)].
- [Feature 3: Tự động dịch mô tả sự kiện sang ngôn ngữ khác khi chỉnh sửa].
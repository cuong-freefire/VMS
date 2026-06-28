# Feature Specification: Delete Event (UC17)
**Feature Branch**: `017-feat-delete-event`
**Created**: 2026-06-28
**Status**: DRAFT
**Input**: User description: "Là một Staff, tôi muốn xóa một sự kiện để dọn dẹp danh sách quản lý khi sự kiện đó không còn cần thiết hoặc bị tạo sai."

---

## User Scenarios & Testing
### User Story 1 - Xóa sự kiện nháp (Draft) thành công (Priority: P1)
Là một **Staff**, tôi muốn xóa một sự kiện đang ở trạng thái `Draft` để loại bỏ các dữ liệu rác.
**Why this priority**: Đây là chức năng cơ bản để quản lý dữ liệu sạch.
**Independent Test**:
- Bước 1: Đăng nhập với quyền Staff.
- Bước 2: Tìm một sự kiện ở trạng thái `Draft` và chưa có đăng ký.
- Bước 3: Nhấn nút "Delete" và xác nhận ở Pop-up.
- Bước 4: Kiểm tra sự kiện không còn xuất hiện trong danh sách.
**Acceptance Scenarios**:
1. **Given** sự kiện đang ở trạng thái `Draft`, **When** Staff xác nhận xóa, **Then** hệ thống trả về HTTP 200 OK và ẩn sự kiện khỏi giao diện.

---

### User Story 2 - Ngăn chặn xóa sự kiện đã có đăng ký (Priority: P1)
Là một **Staff**, tôi không được phép xóa sự kiện nếu đã có tình nguyện viên đăng ký tham gia.
**Why this priority**: Bảo vệ tính toàn vẹn của dữ liệu và quy trình nghiệp vụ.
**Independent Test**:
- Bước 1: Chọn một sự kiện đã có ít nhất 1 Application.
- Bước 2: Nhấn nút "Delete".
- Bước 3: Kiểm tra hệ thống hiển thị thông báo lỗi.
**Acceptance Scenarios**:
1. **Given** sự kiện có `application_count > 0`, **When** Staff thực hiện xóa, **Then** hệ thống trả về HTTP 400 Bad Request kèm thông báo "Cannot delete event with existing applications."

---

## Requirements
### Functional Requirements
- **FR-001**: **WHEN** Staff thực hiện xóa, **THE** system **SHALL** kiểm tra quyền sở hữu (ownership) dựa trên `organization_id`.
- **FR-002**: **WHEN** xóa thành công, **THE** system **SHALL** thực hiện **Soft Delete** bằng cách cập nhật trường `deleted_at`.
- **FR-003**: **WHERE** sự kiện đang ở trạng thái `Published` nhưng chưa có đơn đăng ký, **THE** system **SHALL** yêu cầu xác nhận lần 2 trước khi xóa.
- **FR-004**: **WHEN** một sự kiện bị xóa, **THE** system **SHALL** tự động hủy các Task liên quan (nếu có) gắn liền với sự kiện đó.
- **FR-005**: **WHERE** Staff không thuộc organization quản lý sự kiện, **THE** system **SHALL** trả về lỗi 403 Forbidden.
- **FR-016**: **WHEN** thực hiện xóa, **THE** system **MUST NOT** xóa vật lý các bản ghi liên quan đến tài chính hoặc đóng góp (nếu có) để phục vụ kế toán.

---

### Key Entities
- **Event**: Thực thể cần xóa. Các trạng thái quan trọng: Draft, Published, Deleted.
- **Application**: Thực thể liên quan. Sự tồn tại của nó ngăn chặn việc xóa Event.

---

## Success Criteria
- **SC-001**: Staff có thể xóa sự kiện chỉ với tối đa 2 lần click chuột.
- **SC-002**: Hệ thống ngăn chặn thành công 100% các yêu cầu xóa sự kiện đã có dữ liệu Volunteer tham gia.
- **SC-006**: Không có thông tin nhạy cảm nào của sự kiện bị lộ ra log khi thực hiện lệnh xóa.

---

## Assumptions
- **A-001**: Database hỗ trợ cơ chế Soft Delete.
- **A-006**: Chức năng kiểm tra số lượng đơn đăng ký (Application count) đã được tối ưu hóa để trả về kết quả ngay lập tức.
- **A-010**: Việc dọn dẹp các ảnh (media) của sự kiện bị xóa trong storage sẽ do một batch job xử lý sau (Out of scope).

---

## Out of Scope
Các tính năng sau KHÔNG nằm trong phạm vi của UC17:
- [Feature 1: Khôi phục sự kiện đã xóa (Restore Event)].
- [Feature 2: Xóa vĩnh viễn dữ liệu khỏi Database (Hard Delete)].
- [Feature 3: Tự động gửi email thông báo hủy cho tất cả Volunteer (đây là nghiệp vụ của chức năng Cancel Event)].
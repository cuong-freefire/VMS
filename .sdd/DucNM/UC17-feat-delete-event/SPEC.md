# Feature Specification: Delete Event (UC17)
**Feature Branch**: `017-feat-delete-event`
**Created**: 2026-06-28
**Updated**: 2026-07-18
**Status**: REVIEWED

**Consistency Check**: Aligned with Prisma schema v3.0, AGENTS.md §3.5 (soft delete via isActive).

---

## User Scenarios & Testing
### User Story 1 - Xóa sự kiện nháp (DRAFT) thành công (Priority: P1)
Là một **Staff**, tôi muốn xóa một sự kiện đang ở trạng thái `DRAFT` để loại bỏ các dữ liệu rác.
**Acceptance Scenarios**:
1. **Given** sự kiện đang ở trạng thái `DRAFT` và không có application nào, **When** Staff xác nhận xóa, **Then** hệ thống set `isActive = false`, trả về HTTP 200 và ẩn sự kiện khỏi giao diện.

### User Story 2 - Ngăn chặn xóa sự kiện đã có đăng ký (Priority: P1)
1. **Given** sự kiện có `application_count > 0`, **When** Staff thực hiện xóa, **Then** hệ thống trả về HTTP 409 Conflict kèm thông báo "Cannot delete event with existing applications."

### User Story 3 - Ngăn chặn xóa sự kiện IN_PROGRESS/COMPLETED (Priority: P1)
1. **Given** sự kiện ở trạng thái `IN_PROGRESS` hoặc `COMPLETED`, **When** Staff thực hiện xóa, **Then** hệ thống trả về HTTP 409 Conflict.

---

## Requirements
### Functional Requirements
- **FR-001**: **WHEN** Staff thực hiện xóa, **THE** system **SHALL** kiểm tra quyền sở hữu dựa trên `created_by`.
- **FR-002**: **WHEN** xóa thành công, **THE** system **SHALL** thực hiện Soft Delete bằng cách set `isActive = false`.
- **FR-003**: **WHERE** sự kiện có application count > 0, **THE** system **SHALL** trả về HTTP 409.
- **FR-004**: **WHERE** sự kiện ở trạng thái `IN_PROGRESS` hoặc `COMPLETED`, **THE** system **SHALL** trả về HTTP 409.
- **FR-005**: **WHERE** Staff không phải người tạo sự kiện, **THE** system **SHALL** trả về HTTP 403.
- **FR-006**: **WHEN** thực hiện xóa, **THE** system **MUST NOT** hard delete dữ liệu.

---

### Key Entities
- **Event**: Thực thể cần xóa. Soft delete qua `isActive = false`.
- **Application**: Thực thể liên quan. Sự tồn tại của nó ngăn chặn việc xóa Event.

---

## Success Criteria
- **SC-001**: Hệ thống ngăn chặn thành công 100% các yêu cầu xóa sự kiện đã có dữ liệu Volunteer tham gia.

---

## Out of Scope
- Khôi phục sự kiện đã xóa (Restore Event).
- Xóa vĩnh viễn dữ liệu khỏi Database (Hard Delete).
- Tự động gửi email thông báo hủy cho tất cả Volunteer.
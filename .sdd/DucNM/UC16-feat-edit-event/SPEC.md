# Feature Specification: Edit Event (UC16)
**Feature Branch**: `016-feat-edit-event`
**Created**: 2026-06-28
**Updated**: 2026-07-18
**Status**: REVIEWED

**Consistency Check**: Aligned with Prisma schema v3.0, architecture decisions for event editing.

---

## User Scenarios & Testing
### User Story 1 - Chỉnh sửa thông tin cơ bản thành công (Priority: P1)
Là một **Staff**, tôi muốn cập nhật mô tả và số lượng Volunteer cần thiết của một sự kiện đang ở trạng thái `DRAFT`.
**Acceptance Scenarios**:
1. **Given** Staff đã đăng nhập và chọn đúng sự kiện của mình (`created_by`), **When** gửi request cập nhật với dữ liệu hợp lệ, **Then** hệ thống trả về HTTP 200 OK và cập nhật database thành công.

### User Story 2 - Ngăn chặn chỉnh sửa ngày về quá khứ (Priority: P1)
1. **Given** form edit đang mở, **When** input startDate < Today, **Then** hệ thống hiển thị lỗi "Start date cannot be in the past" và không cho phép submit.

### User Story 3 - Critical fields reset status (Priority: P1)
1. **Given** sự kiện đang `PUBLISHED`, **When** Staff thay đổi title/location/startDate/endDate/categoryId, **Then** hệ thống đưa status về `PENDING_APPROVAL` và cần Manager phê duyệt lại.

---

## Requirements
### Functional Requirements
- **FR-001**: **WHEN** Staff nhấn "Save", **THE** system **SHALL** kiểm tra quyền sở hữu dựa trên `created_by`.
- **FR-002**: **WHEN** lưu thành công, **THE** system **SHALL** cập nhật trường `updatedAt`.
- **FR-003**: **WHERE** Staff thay đổi critical fields (title, location, startDate, endDate, categoryId), **THE** system **SHALL** đưa status về `PENDING_APPROVAL`.
- **FR-004**: **WHERE** Staff thay đổi maxCapacity, **THE** system **SHALL** đảm bảo `maxCapacity >= approvedParticipants`.
- **FR-005**: **WHERE** Staff thay đổi applicationDeadline, **THE** system **SHALL** đảm bảo `applicationDeadline > now` và `applicationDeadline < startDate`.
- **FR-006**: **WHEN** API trả về lỗi, **THE** system **SHALL** hiển thị thông báo lỗi và giữ nguyên dữ liệu trong form.
- **FR-007**: **WHEN** thực hiện update, **THE** system **MUST NOT** làm thay đổi ID của sự kiện hoặc các system-managed fields.
- **FR-008**: **WHERE** sự kiện ở trạng thái `IN_PROGRESS`, `COMPLETED`, hoặc `CANCELLED`, **THE** system **SHALL** trả về HTTP 409.

---

### Key Entities
- **Event**: Thực thể chính cần chỉnh sửa.

---

## Success Criteria
- **SC-001**: Thời gian phản hồi của API cập nhật phải dưới 1.5 giây.
- **SC-002**: UI phải disable nút "Save" ngay sau khi click lần đầu để tránh double-submit.

---

## Assumptions
- **A-001**: Middleware xác thực JWT và phân quyền đã hoạt động.

---

## Out of Scope
- Hoàn tác (Undo) các thay đổi về phiên bản trước đó.
- Staff chỉnh sửa đơn đăng ký của Volunteer (thuộc module Application Management).
- Tự động dịch mô tả sự kiện sang ngôn ngữ khác.
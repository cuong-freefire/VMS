# Feature Specification: Approve Application (UC24)
**Feature Branch**: `024-feat-approve-application`
**Created**: 2026-06-28
**Updated**: 2026-07-28
**Status**: IMPLEMENTED

**Consistency Check**: Aligned with Prisma schema, AGENTS.md §3.1 (capacity MUST NOT be exceeded).

---

## User Scenarios & Testing
### User Story 1 - Phê duyệt đơn đăng ký thành công (Priority: P1)
**Acceptance Scenarios**:
1. **Given** Application đang `PENDING` và event còn chỗ (`approvedParticipants < maxCapacity`), **When** Staff nhấn "Approve", **Then** hệ thống trả về HTTP 200, cập nhật status thành `APPROVED`, increment `approvedParticipants`.

### User Story 2 - Từ chối nếu đầy chỗ (Priority: P1)
1. **Given** event đã đầy (`approvedParticipants >= maxCapacity`), **When** Staff cố gắng approve, **Then** hệ thống trả về HTTP 409 với message "Event is at full capacity. Cannot approve more applications."

### User Story 3 - Chặn truy cập với người dùng không có quyền (Priority: P1)
1. **Given** Staff không sở hữu event, **When** Staff gửi request approve, **Then** HTTP 403.

---

## Requirements
### Functional Requirements
- **FR-001**: **WHEN** Staff nhấn "Approve", **THE** system **SHALL** kiểm tra quyền dựa trên `created_by` của event.
- **FR-002**: **WHEN** approve thành công, **THE** system **SHALL** cập nhật `status = APPROVED`, `processedBy = currentUser.user_id`, `processedAt = now()`, và increment `event.approvedParticipants`.
- **FR-003** (CRITICAL): **WHERE** `event.approvedParticipants >= event.maxCapacity`, **THE** system **SHALL** trả về HTTP 409 và TUYỆT ĐỐI KHÔNG approve.
- **FR-004**: **WHERE** application đã ở trạng thái `APPROVED` hoặc `REJECTED`, **THE** system **SHALL** trả về HTTP 409.
- **FR-005**: **WHERE** application không tồn tại, **THE** system **SHALL** trả về HTTP 404.
- **FR-006**: **WHEN** ghi log, **THE** system **MUST NOT** lưu thông tin nhạy cảm.

---

### Key Entities
- **Application**: Status chuyển từ `PENDING` → `APPROVED`.
- **Event**: Dùng để kiểm tra capacity (`approvedParticipants < maxCapacity`).

---

## Out of Scope
- Bulk approve (nhiều application cùng lúc).
- Gửi email thông báo phê duyệt.
- Undo approve (không thể quay lại PENDING sau khi APPROVED).
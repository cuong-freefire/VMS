# Feature Specification: Reject Application (UC25)
**Feature Branch**: `025-feat-reject-application`
**Created**: 2026-06-28
**Updated**: 2026-07-28
**Status**: IMPLEMENTED

**Consistency Check**: Aligned with Prisma schema — use `message` field for rejection reason.

---

## User Scenarios & Testing
### User Story 1 - Từ chối đơn đăng ký đơn lẻ (Priority: P1)
**Acceptance Scenarios**:
1. **Given** Application đang `PENDING`, **When** Staff nhập lý do từ chối và xác nhận, **Then** hệ thống cập nhật `status = REJECTED`, lưu lý do vào `message`, ghi nhận `processedBy` và `processedAt`, trả về HTTP 200.

### User Story 2 - Validate lý do từ chối (Priority: P1)
1. **Given** Staff không nhập lý do từ chối, **When** Staff submit, **Then** HTTP 400.

### User Story 3 - Chặn truy cập (Priority: P1)
1. **Given** Staff không sở hữu event, **When** Staff gửi request, **Then** HTTP 403.

---

## Requirements
### Functional Requirements
- **FR-001**: **WHEN** Staff thực hiện Reject, **THE** system **SHALL** kiểm tra quyền dựa trên `created_by` của event.
- **FR-002**: **WHEN** từ chối thành công, **THE** system **SHALL** cập nhật `status = REJECTED`, `message = rejection reason`, `processedBy = currentUser.user_id`, `processedAt = now()`.
- **FR-003**: **WHERE** application đã `APPROVED` hoặc `REJECTED`, **THE** system **SHALL** trả về HTTP 409.
- **FR-004**: **WHEN** reject, **THE** system **SHALL** yêu cầu `message` (lý do từ chối) là bắt buộc, min 10 ký tự.
- **FR-005**: **WHERE** application không tồn tại, **THE** system **SHALL** trả về HTTP 404.

---

### Key Entities
- **Application**: Status chuyển từ `PENDING` → `REJECTED`. Lý do lưu trong `message`.

---

## Out of Scope
- Bulk reject.
- Gửi email thông báo từ chối.
- Undo reject.
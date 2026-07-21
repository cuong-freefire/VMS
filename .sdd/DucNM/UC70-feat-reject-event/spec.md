# Feature Specification: Reject Event (UC70)

**Feature Branch**: `feat/uc70-reject-event`
**Created**: 2026-06-30
**Updated**: 2026-07-18
**Status**: REVIEWED

**Consistency Check**: Aligned with Prisma schema — EventStatus: PENDING_APPROVAL → REJECTED.

---

## User Scenarios & Testing

### User Story 1 - Manager từ chối sự kiện thành công (Priority: P1)

**Acceptance Scenarios**:
1. **Given** Manager đã đăng nhập và sự kiện `PENDING_APPROVAL` hợp lệ, **When** Manager từ chối sự kiện kèm lý do, **Then** hệ thống chuyển status thành `REJECTED`, trả về HTTP 200, ghi nhận `rejectedReason`, `rejectedBy`, `rejectedAt`.

### User Story 2 - Validate lý do từ chối (Priority: P1)

1. **Given** Manager không nhập lý do từ chối, **When** Manager submit, **Then** HTTP 400.

### User Story 3 - Chặn truy cập (Priority: P1)

1. **Given** Staff đã đăng nhập, **When** Staff gửi request từ chối, **Then** HTTP 403.

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST cho phép Manager từ chối sự kiện qua `PATCH /api/v1/events/:id/reject`.
- **FR-002**: System MUST chỉ cho phép từ chối event có status = `PENDING_APPROVAL`.
- **FR-003**: System MUST yêu cầu `rejection_reason` (bắt buộc, tối thiểu 10 ký tự).
- **FR-004**: System MUST chuyển status thành `REJECTED` và ghi nhận `rejectedReason`, `rejectedBy`, `rejectedAt`.
- **FR-005**: System MUST trả về HTTP 409 nếu event không ở trạng thái `PENDING_APPROVAL`.
- **FR-006**: System MUST trả về HTTP 404 nếu event ID không tồn tại.
- **FR-007**: System MUST từ chối Staff (403), Volunteer (403), Guest (401).

### Key Entities

- **Event (Sự kiện)**: Trạng thái chuyển từ `PENDING_APPROVAL` → `REJECTED`.

---

## Out of Scope

- **Gửi email thông báo từ chối**: Sẽ tích hợp sau với module Email Services.
- **Phê duyệt lại event đã REJECTED**: Staff có thể edit và resubmit (quay lại PENDING_APPROVAL).
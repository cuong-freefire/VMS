# Feature Specification: Approve Event (UC69)

**Feature Branch**: `feat/uc69-approve-event`
**Created**: 2026-06-30
**Updated**: 2026-07-18
**Status**: REVIEWED

**Consistency Check**: Aligned with Prisma schema, existing backend implementation (event.service.js).

---

## User Scenarios & Testing

### User Story 1 - Manager phê duyệt sự kiện thành công (Priority: P1)

**Acceptance Scenarios**:
1. **Given** Manager đã đăng nhập và sự kiện `PENDING_APPROVAL` hợp lệ, **When** Manager phê duyệt sự kiện, **Then** hệ thống chuyển status thành `PUBLISHED`, trả về HTTP 200, ghi nhận `approvedBy`, `approvedAt`.

### User Story 2 - Chặn truy cập với người dùng không có quyền (Priority: P1)

1. **Given** Staff đã đăng nhập, **When** Staff gửi request phê duyệt, **Then** HTTP 403.
2. **Given** Guest chưa đăng nhập, **When** Guest gửi request, **Then** HTTP 401.

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST cho phép Manager phê duyệt sự kiện qua `PATCH /api/v1/events/:id/approve`.
- **FR-002**: System MUST chỉ cho phép phê duyệt event có status = `PENDING_APPROVAL`.
- **FR-003**: System MUST chuyển status thành `PUBLISHED` và ghi nhận `approvedBy`, `approvedAt`.
- **FR-004**: System MUST trả về HTTP 409 nếu event không ở trạng thái `PENDING_APPROVAL`.
- **FR-005**: System MUST trả về HTTP 404 nếu event ID không tồn tại.
- **FR-006**: System MUST từ chối Staff (403), Volunteer (403), Guest (401).

### Key Entities

- **Event (Sự kiện)**: Trạng thái chuyển từ `PENDING_APPROVAL` → `PUBLISHED`.

---

## Out of Scope

- **Gửi email thông báo phê duyệt**: Sẽ tích hợp sau với module Email Services.
- **Từ chối sự kiện**: Thuộc UC70.
- **Xóa rejection data khi approve**: Backend hiện tại không clear `rejectedBy`/`rejectedAt`/`rejectedReason` khi approve. Đây là Future Enhancement.
# Feature Specification: View Pending Event (UC67)

**Feature Branch**: `feat/uc67-view-pending-event`
**Created**: 2026-06-30
**Updated**: 2026-07-18
**Status**: REVIEWED

**Consistency Check**: Aligned with Prisma schema — EventStatus: PENDING_APPROVAL.

---

## User Scenarios & Testing

### User Story 1 - Manager xem danh sách sự kiện PENDING_APPROVAL (Priority: P1)

Manager muốn xem danh sách tất cả sự kiện đang chờ duyệt để tiến hành phê duyệt hoặc từ chối.

**Acceptance Scenarios**:
1. **Given** Manager đã đăng nhập và hệ thống có 3 sự kiện PENDING_APPROVAL + 2 sự kiện PUBLISHED, **When** Manager truy cập danh sách với `status=pending_approval`, **Then** hệ thống chỉ hiển thị 3 sự kiện PENDING_APPROVAL.
2. **Given** không có sự kiện PENDING_APPROVAL nào, **When** Manager truy cập, **Then** hệ thống trả về danh sách rỗng.

### User Story 2 - Chặn truy cập với người dùng không có quyền (Priority: P1)

1. **Given** Staff đã đăng nhập, **When** Staff gửi request với `status=pending_approval`, **Then** HTTP 403.
2. **Given** Guest chưa đăng nhập, **When** Guest gửi request, **Then** HTTP 401.

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST trả về danh sách sự kiện PENDING_APPROVAL khi Manager/Admin gọi `GET /api/v1/events?status=pending_approval`.
- **FR-002**: System MUST hỗ trợ phân trang (page, limit) — mặc định limit = 20.
- **FR-003**: System MUST trả về thông tin: event_id, title, created_by, created_at, status.
- **FR-004**: System MUST từ chối Staff (403), Volunteer (403), Guest (401).

### Key Entities

- **Event (Sự kiện)**: Sự kiện tình nguyện đang chờ duyệt. Status = PENDING_APPROVAL.

---

## Out of Scope

- **Xem chi tiết sự kiện PENDING**: Thuộc UC68.
- **Phê duyệt sự kiện**: Thuộc UC69.
- **Từ chối sự kiện**: Thuộc UC70.
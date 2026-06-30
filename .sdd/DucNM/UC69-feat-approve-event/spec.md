# Feature Specification: Approve Event (UC69)

**Feature Branch**: `feat/uc69-approve-event`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Manager cần phê duyệt sự kiện đang chờ duyệt trong hệ thống VMS."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manager phê duyệt sự kiện thành công (Priority: P1)

Manager muốn phê duyệt một sự kiện PENDING để chuyển sang APPROVED, cho phép Volunteer đăng ký.

**Why this priority**: Chức năng cốt lõi của module Event Approval — nếu không phê duyệt, sự kiện không thể triển khai.

**Independent Test**: Tạo một event với status PENDING, gọi `PATCH /api/v1/events/:id/approve` với token Manager, kiểm tra response trả về 200 OK và status event chuyển thành APPROVED.

**Acceptance Scenarios**:

1. **Given** Manager đã đăng nhập và sự kiện PENDING hợp lệ, **When** Manager phê duyệt sự kiện, **Then** hệ thống chuyển status sự kiện thành APPROVED, trả về HTTP 200, ghi nhận approved_by và approved_at.
2. **Given** Manager cố gắng phê duyệt sự kiện đã APPROVED, **When** Manager gửi request, **Then** hệ thống trả về HTTP 409 Conflict với message "Event is not in PENDING status."

---

### User Story 2 - Chặn truy cập với người dùng không có quyền (Priority: P1)

Staff, Volunteer và Guest không có quyền phê duyệt sự kiện.

**Acceptance Scenarios**:

1. **Given** Staff đã đăng nhập, **When** Staff gửi request phê duyệt, **Then** HTTP 403.
2. **Given** Guest chưa đăng nhập, **When** Guest gửi request, **Then** HTTP 401.

---

### Edge Cases

- Event ID không tồn tại? → HTTP 404.
- Event đã ở trạng thái REJECTED? → HTTP 409 — không thể phê duyệt event đã từ chối.
- Event đang ONGOING hoặc COMPLETED? → HTTP 409.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cho phép Manager phê duyệt sự kiện qua `PATCH /api/v1/events/:id/approve`.
- **FR-002**: System MUST chỉ cho phép phê duyệt event có status = PENDING.
- **FR-003**: System MUST chuyển status thành APPROVED và ghi nhận approved_by, approved_at.
- **FR-004**: System MUST trả về HTTP 409 nếu event không ở trạng thái PENDING.
- **FR-005**: System MUST trả về HTTP 404 nếu event ID không tồn tại.
- **FR-006**: System MUST từ chối Staff (403), Volunteer (403), Guest (401).

### Key Entities *(Business Level Only)*

- **Event (Sự kiện)**: Trạng thái chuyển từ PENDING → APPROVED. Ghi nhận người phê duyệt.

## Success Criteria *(mandatory)*

- **SC-001**: 100% request phê duyệt event PENDING hợp lệ thành công trong vòng 1 giây.
- **SC-002**: 100% request phê duyệt event không ở trạng thái PENDING bị từ chối HTTP 409.
- **SC-003**: 100% request từ role không có quyền bị từ chối.

## Assumptions

- Middleware xác thực JWT và phân quyền đã hoạt động.
- Bảng Event đã có trường approved_by và approved_at.

---

## Out of Scope

- **Gửi email thông báo phê duyệt**: Sẽ tích hợp sau với module Email Services (UC64).
- **Từ chối sự kiện**: Thuộc UC70.
- **Rollback phê duyệt**: Không có trong v1 — nếu cần thay đổi, tạo event mới.
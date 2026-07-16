# Feature Specification: Reject Event (UC70)

**Feature Branch**: `feat/uc70-reject-event`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Manager cần từ chối sự kiện không đủ điều kiện trong hệ thống VMS."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manager từ chối sự kiện thành công (Priority: P1)

Manager muốn từ chối một sự kiện PENDING không đủ điều kiện, kèm lý do từ chối.

**Why this priority**: Chức năng cốt lõi — Manager cần ngăn chặn sự kiện không phù hợp.

**Independent Test**: Tạo một event với status PENDING, gọi `PATCH /api/v1/events/:id/reject` với body chứa rejection_reason và token Manager, kiểm tra response trả về 200 OK và status event chuyển thành REJECTED.

**Acceptance Scenarios**:

1. **Given** Manager đã đăng nhập và sự kiện PENDING hợp lệ, **When** Manager từ chối sự kiện kèm lý do "Thông tin sự kiện chưa đầy đủ", **Then** hệ thống chuyển status thành REJECTED, trả về HTTP 200, ghi nhận rejection_reason, rejected_by, rejected_at.
2. **Given** Manager cố gắng từ chối sự kiện đã APPROVED, **When** Manager gửi request, **Then** hệ thống trả về HTTP 409 Conflict với message "Event is not in PENDING status."

---

### User Story 2 - Validate lý do từ chối (Priority: P1)

Lý do từ chối là bắt buộc.

**Independent Test**: Gọi `PATCH /api/v1/events/:id/reject` với body rỗng, kiểm tra HTTP 400.

**Acceptance Scenarios**:

1. **Given** Manager không nhập lý do từ chối, **When** Manager submit, **Then** HTTP 400 Bad Request với message "Rejection reason is required."

---

### User Story 3 - Chặn truy cập (Priority: P1)

**Acceptance Scenarios**:

1. **Given** Staff đã đăng nhập, **When** Staff gửi request từ chối, **Then** HTTP 403.
2. **Given** Guest chưa đăng nhập, **When** Guest gửi request, **Then** HTTP 401.

---

### Edge Cases

- Event ID không tồn tại? → HTTP 404.
- Event đã REJECTED? → HTTP 409 — không thể từ chối lại.
- Lý do từ chối quá ngắn? → Cho phép, nhưng tối thiểu 10 ký tự.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cho phép Manager từ chối sự kiện qua `PATCH /api/v1/events/:id/reject`.
- **FR-002**: System MUST chỉ cho phép từ chối event có status = PENDING.
- **FR-003**: System MUST yêu cầu rejection_reason (bắt buộc, tối thiểu 10 ký tự).
- **FR-004**: System MUST chuyển status thành REJECTED và ghi nhận rejection_reason, rejected_by, rejected_at.
- **FR-005**: System MUST trả về HTTP 409 nếu event không ở trạng thái PENDING.
- **FR-006**: System MUST trả về HTTP 404 nếu event ID không tồn tại.
- **FR-007**: System MUST từ chối Staff (403), Volunteer (403), Guest (401).

### Key Entities *(Business Level Only)*

- **Event (Sự kiện)**: Trạng thái chuyển từ PENDING → REJECTED. Ghi nhận lý do và người từ chối.

## Success Criteria *(mandatory)*

- **SC-001**: 100% request từ chối event PENDING hợp lệ thành công trong vòng 1 giây.
- **SC-002**: 100% request từ chối event không ở trạng thái PENDING bị từ chối HTTP 409.
- **SC-003**: 100% request thiếu rejection_reason bị từ chối HTTP 400.

## Assumptions

- Middleware xác thực JWT và phân quyền đã hoạt động.
- Bảng Event đã có trường rejection_reason, rejected_by, rejected_at.

---

## Out of Scope

- **Gửi email thông báo từ chối**: Sẽ tích hợp sau với module Email Services.
- **Phê duyệt lại event đã REJECTED**: Không được phép — Staff phải tạo sự kiện mới.
- **Chỉnh sửa event đã REJECTED**: Staff có thể tạo lại dựa trên thông tin cũ.
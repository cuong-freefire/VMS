# Feature Specification: Edit Organization (UC40)

**Feature Branch**: `feat/uc40-edit-organization`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Admin cần chỉnh sửa thông tin tổ chức và vô hiệu hóa (soft-delete) tổ chức khi cần."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin chỉnh sửa thông tin tổ chức (Priority: P1)

Admin muốn cập nhật thông tin tổ chức khi có thay đổi (tên, địa chỉ, số điện thoại, email, logo) để dữ liệu luôn chính xác và cập nhật.

**Why this priority**: Dữ liệu tổ chức cần được cập nhật thường xuyên theo thông tin thực tế. Nếu không có chức năng sửa, dữ liệu nhanh chóng lỗi thời.

**Independent Test**: Gọi `PUT /api/v1/organizations/1` với body hợp lệ và token Admin, kiểm tra HTTP 200 và thông tin đã được cập nhật.

**Acceptance Scenarios**:

1. **Given** Admin đang xem chi tiết tổ chức ID = 1, **When** Admin sửa tên từ "Hội CTĐ" thành "Hội Chữ Thập Đỏ Việt Nam" và submit, **Then** hệ thống cập nhật tên, trả về HTTP 200 kèm thông tin mới.
2. **Given** Admin đổi tên tổ chức thành tên đã tồn tại, **When** Admin submit, **Then** hệ thống trả về HTTP 409 Conflict với message "Tên tổ chức đã tồn tại."
3. **Given** Admin thay logo mới, **When** Admin upload file ảnh mới, **Then** hệ thống upload lên Cloudinary, xóa ảnh cũ, và cập nhật URL logo mới trong database.

---

### User Story 2 - Admin vô hiệu hóa tổ chức (soft-delete) (Priority: P1)

Admin muốn vô hiệu hóa tổ chức khi tổ chức đó ngừng hợp tác với VMS, nhưng vẫn giữ dữ liệu lịch sử.

**Why this priority**: Soft-delete là chính sách bắt buộc của dự án (ADR-005). Không thể xóa cứng dữ liệu tổ chức.

**Independent Test**: Gọi `PUT /api/v1/organizations/1` với `is_active: false`, kiểm tra tổ chức được set inactive và không xuất hiện trong danh sách Manager.

**Acceptance Scenarios**:

1. **Given** tổ chức ID = 1 có tất cả sự kiện đã Completed hoặc Cancelled, **When** Admin set `is_active: false`, **Then** hệ thống vô hiệu hóa tổ chức, trả về HTTP 200, ghi audit log.
2. **Given** tổ chức ID = 2 còn sự kiện đang In Progress, **When** Admin cố gắng vô hiệu hóa, **Then** hệ thống trả về HTTP 409 Conflict với message "Không thể vô hiệu hóa tổ chức vì còn sự kiện đang hoạt động."
3. **Given** tổ chức ID = 3 đã inactive, **When** Admin gửi request vô hiệu hóa lại, **Then** hệ thống trả về HTTP 400 với message "Tổ chức đã bị vô hiệu hóa trước đó."

---

### Edge Cases

- Điều gì xảy ra khi Admin gửi request với ID không tồn tại? → HTTP 404.
- Điều gì xảy ra khi Admin cập nhật email sai format? → HTTP 400.
- Điều gì xảy ra khi Admin không thay đổi trường nào (gửi lại dữ liệu cũ)? → Vẫn thành công HTTP 200, không coi là lỗi.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cho phép Admin cập nhật tổ chức qua `PUT /api/v1/organizations/:id`.
- **FR-002**: System MUST validate tính duy nhất của `name` (trừ chính nó) — nếu trùng, HTTP 409.
- **FR-003**: System MUST validate `contact_email` (nếu có) đúng format email.
- **FR-004**: System MUST xóa logo cũ trên Cloudinary khi upload logo mới thành công.
- **FR-005**: WHERE Admin set `is_active = false`, System MUST kiểm tra tổ chức không còn sự kiện đang hoạt động. Nếu còn, HTTP 409 Conflict.
- **FR-006**: WHERE tổ chức đã inactive, System MUST từ chối request set inactive lần nữa (HTTP 400).
- **FR-007**: System MUST trả về HTTP 200 khi cập nhật thành công.
- **FR-008**: System MUST ghi audit log cho mọi thay đổi.
- **FR-009**: System MUST từ chối non-Admin với HTTP 403.
- **FR-010**: WHERE ID không tồn tại, System MUST trả về HTTP 404.

### Key Entities *(Business Level Only)*

- **Organization (Tổ chức)**: Entity được cập nhật. Có thể set `is_active = false` để soft-delete.
- **Event (Sự kiện)**: Entity tham chiếu đến Organization — ràng buộc khi soft-delete.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin cập nhật tổ chức hoàn tất trong vòng 20 giây.
- **SC-002**: 100% request update được validate bằng Zod trước khi ghi database.
- **SC-003**: 100% thao tác vô hiệu hóa tổ chức kiểm tra ràng buộc sự kiện đang hoạt động.
- **SC-004**: 100% update/vô hiệu hóa có audit log.

## Assumptions

- Middleware xác thực và phân quyền đã hoạt động.
- Cloudinary xóa ảnh cũ API đã có sẵn.
- Không có UI khôi phục tổ chức trong v1 (Admin có thể update `is_active = true` qua API trực tiếp).

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC40 và KHÔNG được implement:

- **Hard-delete tổ chức**: Vi phạm soft-delete policy.
- **Khôi phục tổ chức từ UI**: Deferred đến phiên bản sau.
- **Xóa hàng loạt tổ chức**: Admin chỉ thao tác từng tổ chức một.
- **Tự động inactive tổ chức theo thời gian**: Admin thực hiện thủ công.

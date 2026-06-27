# Feature Specification: Edit User (UC29)

**Feature Branch:** `feat/UC29-edit-user`

**Created:** 2026-06-27

**Status:** APPROVED

**Actor:** Admin

---

## User Scenarios & Testing

### User Story 1 — Cập nhật thông tin cơ bản thành công (Priority: P1)

Admin cần cập nhật tên, số điện thoại hoặc avatar của một người dùng.

**Acceptance Scenarios:**

1. **Given** Admin gửi `PATCH /api/v1/users/42` với `{ full_name: "Nguyễn Văn B" }`, **Then** HTTP 200, `full_name` được cập nhật, các trường khác giữ nguyên.

2. **Given** Admin cập nhật `phone_number`, **Then** chỉ `phone_number` thay đổi — `email`, `role_id`, `is_active` không thay đổi.

---

### User Story 2 — Vô hiệu hóa tài khoản (Soft-delete) (Priority: P1)

Admin vô hiệu hóa tài khoản vi phạm hoặc không còn hoạt động.

**Acceptance Scenarios:**

1. **Given** Admin gửi `PATCH /api/v1/users/42` với `{ is_active: false }`, **Then** HTTP 200, `is_active: false` trong database.

2. **Given** user `42` bị vô hiệu hóa, **When** user đó thử đăng nhập, **Then** hệ thống từ chối với HTTP 403 (kiểm tra xác nhận cross-module).

3. **Given** Admin cố vô hiệu hóa chính tài khoản của mình, **Then** HTTP 403 "Không thể vô hiệu hóa tài khoản của chính bạn".

4. **Given** Admin cố vô hiệu hóa Admin duy nhất còn lại, **Then** HTTP 409 "Phải có ít nhất một Admin active trong hệ thống".

---

### User Story 3 — Thay đổi Role người dùng (Priority: P1)

**Acceptance Scenarios:**

1. **Given** Admin gửi `{ role_id: 2 }` (Staff) cho user đang là Volunteer, **Then** HTTP 200, role được cập nhật, audit log ghi nhận.

2. **Given** `role_id: 99` không tồn tại trong bảng roles, **Then** HTTP 400 "role_id không hợp lệ".

---

### User Story 4 — Cập nhật Email (Priority: P2)

**Acceptance Scenarios:**

1. **Given** Admin muốn sửa email bị nhập sai, **When** email mới chưa tồn tại trong DB, **Then** HTTP 200, email được cập nhật.

2. **Given** email mới đã được dùng bởi user khác, **Then** HTTP 409 "Email này đã được sử dụng".

---

### User Story 5 — Phân quyền (Priority: P1)

**Acceptance Scenarios:**

1. **Given** request từ non-Admin, **Then** HTTP 403.
2. **Given** không có JWT, **Then** HTTP 401.
3. **Given** `userId` không tồn tại, **Then** HTTP 404.

---

### Edge Cases

- **Gửi body rỗng `{}`:** THE system SHALL trả về HTTP 400 "Không có trường nào được cập nhật".
- **Cố gắng cập nhật mật khẩu qua endpoint này:** Kiểm tra định dạng đầu vào chặn tham số mật khẩu — HTTP 400.
- **Cố gắng cập nhật ngày tạo:** Hệ thống loại bỏ hoặc chặn cập nhật các trường thời gian tự động.
- **Thay đổi đồng thời:** Thao tác thực hiện theo cơ chế cập nhật ghi đè phiên bản cuối.

---

## Requirements

### Functional Requirements

- **FR-001:** WHERE phiên đăng nhập không hợp lệ, HTTP 401. WHERE vai trò không phải Admin, HTTP 403.
- **FR-002:** THE system SHALL kiểm tra mã định danh người dùng là số nguyên dương ở mức tham số đường dẫn.
- **FR-003:** WHERE người dùng không tồn tại, HTTP 404 "Người dùng không tồn tại".
- **FR-004:** THE system SHALL kiểm tra dữ liệu yêu cầu gửi lên — chỉ cho phép các trường: họ tên, email, số điện thoại, ảnh đại diện, vai trò, trạng thái hoạt động. TUYỆT ĐỐI chặn cập nhật mật khẩu, ngày tạo, hoặc mã người dùng tại đây.
- **FR-005:** WHERE không có trường hợp lệ nào được gửi, HTTP 400.
- **FR-006:** WHERE email mới trùng với email của người dùng khác, HTTP 409.
- **FR-007:** WHERE vai trò được cập nhật, THE system SHALL kiểm tra tính hợp lệ của mã vai trò trong hệ thống.
- **FR-008:** WHERE thay đổi trạng thái hoạt động sang vô hiệu hóa cho chính Admin đang thực hiện yêu cầu, HTTP 403 "Không thể vô hiệu hóa tài khoản của chính bạn".
- **FR-009:** WHERE vô hiệu hóa tài khoản Admin và đây là tài khoản Admin đang hoạt động duy nhất còn lại, HTTP 409 "Phải có ít nhất một tài khoản Admin hoạt động".
- **FR-010:** WHEN cập nhật thành công, HTTP 200 kèm theo thông tin người dùng mới cập nhật (không chứa mật khẩu).
- **FR-011:** THE system SHALL ghi nhật ký kiểm toán cho hành động cập nhật thông tin người dùng.
- **FR-012:** WHERE vai trò của người dùng thay đổi, THE system SHALL ghi nhật ký cảnh báo riêng kèm thông tin vai trò cũ và mới.

### Non-functional Requirements

- **NFR-001:** Thời gian xử lý cập nhật dữ liệu ≤ 300ms.
- **NFR-002:** Cập nhật trực tiếp trên bản ghi người dùng chỉ định, không thay đổi các thông tin không liên quan.

### Key Entities

- **User:** Người dùng được cập nhật.
- **Role:** Vai trò của người dùng.

---

## Success Criteria

- **SC-001:** Các trường thông tin được cập nhật chính xác theo yêu cầu.
- **SC-002:** Vô hiệu hóa tài khoản hoạt động đúng, ngăn chặn đăng nhập sau đó.
- **SC-003:** Chặn thành công việc tự khóa tài khoản hoặc khóa tài khoản Admin cuối cùng.
- **SC-004:** Nhật ký hệ thống ghi nhận đầy đủ lịch sử thay đổi thông tin.

---

## Assumptions

- **A-001:** Mã định danh của Admin thực hiện được trích xuất trực tiếp từ phiên đăng nhập.
- **A-002:** Kiểm tra số lượng tài khoản Admin hoạt động được thực hiện ở mức xử lý nghiệp vụ trước khi ghi nhận thay đổi trạng thái.

---

## Out of Scope

- **Thay đổi mật khẩu:** Do chính người dùng tự thực hiện ở tính năng riêng biệt.
- **Xóa vật lý tài khoản:** Bị cấm tuyệt đối, chỉ hỗ trợ vô hiệu hóa trạng thái hoạt động.
- **Cập nhật đồng thời hàng loạt người dùng:** Không hỗ trợ trong tính năng này.


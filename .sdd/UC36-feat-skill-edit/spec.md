# Feature Specification: Edit Skill (UC36)

**Feature Branch:** `feat/UC36-edit-skill`

**Created:** 2026-06-27

**Status:** APPROVED

**Actor:** Admin

---

## User Scenarios & Testing

### User Story 1 — Sửa tên/mô tả kỹ năng (Priority: P1)

**Acceptance Scenarios:**

1. **Given** `PATCH /api/v1/skills/5` với `{ name: "Python Programming" }`, **Then** HTTP 200, tên được cập nhật.

2. **Given** tên mới trùng skill khác, **Then** HTTP 409.

---

### User Story 2 — Vô hiệu hóa kỹ năng (Priority: P1)

**Acceptance Scenarios:**

1. **Given** thực hiện dừng hoạt động của một kỹ năng, **Then** HTTP 200 kèm cảnh báo "Kỹ năng này đang được sử dụng bởi 20 tình nguyện viên".

2. **Given** kỹ năng bị vô hiệu hóa, **When** tình nguyện viên cố gắng đăng ký kỹ năng này vào hồ sơ cá nhân, **Then** hệ thống từ chối.

---

### User Story 3 — Phân quyền và kiểm tra tính hợp lệ (Priority: P1)

**Acceptance Scenarios:**

1. **Given** yêu cầu được thực hiện bởi người dùng không phải Admin, **Then** HTTP 403.
2. **Given** mã định danh kỹ năng không tồn tại trong hệ thống, **Then** HTTP 404.
3. **Given** yêu cầu cập nhật trống, **Then** HTTP 400.

---

## Requirements

### Functional Requirements

- **FR-001:** WHERE phiên đăng nhập không hợp lệ, HTTP 401. WHERE vai trò không phải Admin, HTTP 403.
- **FR-002:** Kiểm tra mã định danh kỹ năng trên đường dẫn là số nguyên dương.
- **FR-003:** WHERE mã định danh kỹ năng không tồn tại trong hệ thống, HTTP 404.
- **FR-004:** Kiểm tra dữ liệu cập nhật đầu vào: chỉ cho phép tên kỹ năng (tối đa 100 ký tự), mô tả (tối đa 500 ký tự), trạng thái hoạt động (kiểu logic). Chặn tất cả các trường khác.
- **FR-005:** WHERE dữ liệu gửi lên trống, HTTP 400.
- **FR-006:** WHERE tên kỹ năng mới trùng với tên kỹ năng khác hiện có, HTTP 409.
- **FR-007:** WHERE dừng hoạt động kỹ năng đang được tình nguyện viên sở hữu, HTTP 200 thành công nhưng kèm theo thông tin số lượng tình nguyện viên đang bị ảnh hưởng.
- **FR-008:** Ghi nhật ký hệ thống về hành động cập nhật thông tin kỹ năng.

### Non-functional Requirements

- **NFR-001:** Thời gian xử lý cập nhật dữ liệu ≤ 200ms.

---

## Success Criteria

- **SC-001:** Các thay đổi thông tin kỹ năng có hiệu lực ngay lập tức khi truy vấn danh sách.
- **SC-002:** Vô hiệu hóa hoạt động đúng, ngăn chặn đăng ký mới kỹ năng này.
- **SC-003:** Đảm bảo hiển thị cảnh báo cho Admin khi vô hiệu hóa kỹ năng đang sử dụng.

---

## Out of Scope

- **Xóa vật lý kỹ năng khỏi cơ sở dữ liệu:** Không được thực hiện, chỉ dừng hoạt động.
- **Tự động gỡ bỏ kỹ năng bị vô hiệu hóa khỏi hồ sơ hiện tại của tình nguyện viên:** Không hỗ trợ trong tính năng này.


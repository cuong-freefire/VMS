# Feature Specification: Add Skill (UC35)

**Feature Branch:** `feat/UC35-add-skill`

**Created:** 2026-06-27

**Status:** APPROVED

**Actor:** Admin

---

## User Scenarios & Testing

### User Story 1 — Admin thêm kỹ năng mới thành công (Priority: P1)

**Acceptance Scenarios:**

1. **Given** Admin gửi `POST /api/v1/skills` với `{ name: "Lập trình Python", description: "..." }`, **Then** HTTP 201 với `skill_id` mới, `is_active: true`.

2. **Given** tạo thành công, **When** Volunteer xem danh sách skills, **Then** skill mới xuất hiện.

---

### User Story 2 — Tên kỹ năng đã tồn tại (Priority: P1)

**Acceptance Scenarios:**

1. **Given** "Lập trình Python" đã có, **When** Admin tạo "lập trình python" (lowercase), **Then** HTTP 409 "Tên kỹ năng này đã tồn tại".

---

### User Story 3 — Kiểm tra tính hợp lệ và phân quyền (Priority: P1)

**Acceptance Scenarios:**

1. **Given** tên kỹ năng bị bỏ trống, **Then** HTTP 400.
2. **Given** yêu cầu được thực hiện bởi người dùng không phải Admin, **Then** HTTP 403.

---

## Requirements

### Functional Requirements

- **FR-001:** WHERE phiên đăng nhập không hợp lệ, HTTP 401. WHERE vai trò không phải Admin, HTTP 403.
- **FR-002:** Kiểm tra dữ liệu đầu vào: tên kỹ năng (bắt buộc, tối đa 100 ký tự), mô tả (tùy chọn, tối đa 500 ký tự).
- **FR-003:** Tự động loại bỏ khoảng trắng thừa và chuẩn hóa tên kỹ năng trước khi kiểm tra tính duy nhất (không phân biệt chữ hoa thường).
- **FR-004:** WHERE tên kỹ năng đã tồn tại trong hệ thống, HTTP 409.
- **FR-005:** Làm sạch dữ liệu đầu vào để ngăn chặn các cuộc tấn công tiêm mã.
- **FR-006:** Khi tạo thành công, thiết lập trạng thái hoạt động mặc định là có hiệu lực và trả về HTTP 201 cùng thông tin kỹ năng vừa tạo.
- **FR-007:** Ghi nhật ký hệ thống về hành động tạo kỹ năng mới.

### Non-functional Requirements

- **NFR-001:** Thời gian xử lý tạo kỹ năng ≤ 200ms.

### Key Entities

- **Skill:** Kỹ năng mới được tạo.

---

## Success Criteria

- **SC-001:** Kỹ năng mới tạo hiển thị ngay lập tức trong danh sách truy vấn kỹ năng hoạt động.
- **SC-002:** Ngăn chặn hoàn toàn việc trùng lặp tên kỹ năng.

---

## Out of Scope

- **Sửa hoặc vô hiệu hóa kỹ năng:** Thuộc tính năng riêng biệt.
- **Gán kỹ năng cho tình nguyện viên khi tạo:** Thuộc tính năng chỉnh sửa kỹ năng của tình nguyện viên.


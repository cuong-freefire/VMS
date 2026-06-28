# Feature Specification: Add Category (UC32)

**Feature Branch:** `feat/UC32-add-category`

**Created:** 2026-06-27

**Status:** APPROVED

**Actor:** Admin

---

## User Scenarios & Testing

### User Story 1 — Admin thêm danh mục mới thành công (Priority: P1)

**Acceptance Scenarios:**

1. **Given** Admin gửi `POST /api/v1/categories` với `{ name: "Môi trường", description: "Các hoạt động bảo vệ môi trường" }`, **Then** HTTP 201 với `category_id` mới và `is_active: true`.

2. **Given** tạo thành công, **When** gọi `GET /api/v1/categories`, **Then** category mới xuất hiện trong danh sách.

---

### User Story 2 — Tên danh mục đã tồn tại (Priority: P1)

**Acceptance Scenarios:**

1. **Given** "Môi trường" đã có trong database, **When** Admin tạo category với `name: "môi trường"` (viết thường), **Then** HTTP 409 "Tên danh mục này đã tồn tại".

---

### User Story 3 — Kiểm tra tính hợp lệ của đầu vào (Priority: P1)

**Acceptance Scenarios:**

1. **Given** tên danh mục bị bỏ trống, **Then** HTTP 400 "Tên danh mục không được để trống".
2. **Given** tên danh mục vượt quá 100 ký tự, **Then** HTTP 400 "Tên danh mục không được vượt quá 100 ký tự".
3. **Given** yêu cầu được thực hiện bởi người dùng không phải Admin, **Then** HTTP 403.

---

### Edge Cases

- **Tên chứa thẻ HTML hoặc mã kịch bản độc hại:** Hệ thống lọc bỏ hoặc chuyển đổi các ký tự HTML trước khi ghi nhận vào hệ thống.
- **Có khoảng trắng ở đầu hoặc cuối:** Hệ thống tự động loại bỏ khoảng trắng thừa trước khi kiểm tra tính duy nhất và lưu trữ.

---

## Requirements

### Functional Requirements

- **FR-001:** WHERE phiên đăng nhập không hợp lệ, HTTP 401. WHERE vai trò không phải Admin, HTTP 403.
- **FR-002:** Kiểm tra tính hợp lệ của dữ liệu đầu vào: tên danh mục (bắt buộc, tối đa 100 ký tự), mô tả (tùy chọn, tối đa 500 ký tự).
- **FR-003:** Tự động chuẩn hóa tên danh mục trước khi kiểm tra tính duy nhất (không phân biệt hoa thường).
- **FR-004:** WHERE tên danh mục đã tồn tại trong hệ thống, HTTP 409 "Tên danh mục này đã tồn tại".
- **FR-005:** Làm sạch dữ liệu đầu vào để ngăn chặn các cuộc tấn công tiêm mã (XSS).
- **FR-006:** Khi tạo thành công, thiết lập trạng thái hoạt động là có hiệu lực và trả về HTTP 201 cùng thông tin danh mục vừa tạo.
- **FR-007:** Ghi nhật ký hệ thống về hành động tạo danh mục mới.

### Non-functional Requirements

- **NFR-001:** Thời gian xử lý ghi nhận danh mục ≤ 200ms.

### Key Entities

- **Category:** Danh mục mới được tạo.

---

## Success Criteria

- **SC-001:** Danh mục mới tạo ngay lập tức có thể truy vấn trong danh sách danh mục hoạt động.
- **SC-002:** Ngăn chặn hoàn toàn việc trùng lặp tên danh mục.
- **SC-003:** Dữ liệu được bảo vệ an toàn trước các cuộc tấn công tiêm mã.

---

## Assumptions

- **A-001:** Ràng buộc duy nhất của tên danh mục được áp dụng nhất quán ở mức lưu trữ dữ liệu.

---

## Out of Scope

- **Sửa hoặc vô hiệu hóa danh mục:** Thuộc tính năng riêng biệt.
- **Gán danh mục cho sự kiện cụ thể:** Được thực hiện khi tạo hoặc cập nhật sự kiện.


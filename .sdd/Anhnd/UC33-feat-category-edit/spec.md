# Feature Specification: Edit Category (UC33)

**Feature Branch:** `feat/UC33-edit-category`

**Created:** 2026-06-27

**Status:** APPROVED

**Actor:** Admin

---

## User Scenarios & Testing

### User Story 1 — Sửa tên hoặc mô tả danh mục (Priority: P1)

**Acceptance Scenarios:**

1. **Given** `PATCH /api/v1/categories/3` với `{ name: "Bảo vệ Môi trường" }`, **Then** HTTP 200, `name` được cập nhật, `description` và `is_active` giữ nguyên.

2. **Given** `name` mới đã tồn tại ở category khác, **Then** HTTP 409 "Tên danh mục này đã tồn tại".

---

### User Story 2 — Vô hiệu hóa danh mục (Soft-delete) (Priority: P1)

**Acceptance Scenarios:**

1. **Given** thực hiện vô hiệu hóa danh mục, **Then** HTTP 200 thành công, danh mục chuyển sang trạng thái dừng hoạt động.

2. **Given** danh mục vừa bị vô hiệu hóa đang được liên kết với 5 sự kiện hoạt động, **Then** phản hồi thành công kèm theo cảnh báo "Danh mục này đang được sử dụng bởi 5 sự kiện active" trong kết quả trả về.

3. **Given** danh mục bị vô hiệu hóa, **When** điều phối viên cố gắng tạo sự kiện mới liên kết với danh mục này, **Then** hệ thống từ chối.

---

### User Story 3 — Danh mục không tồn tại (Priority: P1)

**Acceptance Scenarios:**

1. **Given** mã danh mục không tồn tại trong hệ thống, **Then** HTTP 404 "Danh mục không tồn tại".

---

### Edge Cases

- **Yêu cầu không chứa trường dữ liệu nào cần cập nhật:** HTTP 400 "Không có trường nào được cập nhật".
- **Mã danh mục không phải định dạng hợp lệ:** HTTP 400 "Mã danh mục không hợp lệ".

---

## Requirements

### Functional Requirements

- **FR-001:** WHERE phiên đăng nhập không hợp lệ, HTTP 401. WHERE vai trò không phải Admin, HTTP 403.
- **FR-002:** Kiểm tra mã danh mục trên đường dẫn là số nguyên dương.
- **FR-003:** WHERE mã danh mục không tồn tại trong hệ thống, HTTP 404.
- **FR-004:** Kiểm tra dữ liệu cập nhật đầu vào: chỉ cho phép tên danh mục (tối đa 100 ký tự), mô tả (tối đa 500 ký tự), trạng thái hoạt động (kiểu logic). Chặn tất cả các trường khác.
- **FR-005:** WHERE dữ liệu gửi lên trống, HTTP 400.
- **FR-006:** WHERE tên danh mục mới trùng với tên danh mục khác hiện có, HTTP 409.
- **FR-007:** WHERE dừng hoạt động danh mục đang được liên kết với sự kiện hoạt động, HTTP 200 thành công nhưng kèm theo cảnh báo và số lượng sự kiện liên quan.
- **FR-008:** Ghi nhật ký hệ thống về hành động cập nhật thông tin danh mục.

### Non-functional Requirements

- **NFR-001:** Thời gian xử lý cập nhật dữ liệu ≤ 200ms.

### Key Entities

- **Category:** Danh mục được cập nhật.
- **Event:** Sự kiện liên kết để kiểm tra cảnh báo.

---

## Success Criteria

- **SC-001:** Các thay đổi thông tin danh mục có hiệu lực ngay lập tức khi truy vấn danh sách.
- **SC-002:** Vô hiệu hóa hoạt động đúng, ngăn chặn tạo mới sự kiện với danh mục này.
- **SC-003:** Đảm bảo hiển thị cảnh báo cho Admin khi vô hiệu hóa danh mục đang sử dụng.

---

## Assumptions

- **A-001:** Các sự kiện đã tạo từ trước không bị ảnh hưởng hay thay đổi thông tin khi danh mục liên kết bị vô hiệu hóa.

---

## Out of Scope

- **Xóa vật lý danh mục khỏi cơ sở dữ liệu:** Không được phép thực hiện, chỉ thay đổi trạng thái hoạt động.
- **Tự động hủy các sự kiện đang sử dụng danh mục bị vô hiệu hóa:** Không hỗ trợ trong tính năng này.

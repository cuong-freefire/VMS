# Feature Specification: View Category List (UC31)

**Feature Branch:** `feat/UC31-view-category-list`

**Created:** 2026-06-27

**Status:** APPROVED

**Actor:** Admin (quản lý), Volunteer/Guest (xem để filter sự kiện)

---

## User Scenarios & Testing

### User Story 1 — Admin xem toàn bộ danh sách danh mục (Priority: P1)

Admin truy cập trang quản lý danh mục để xem tất cả category (bao gồm cả đã vô hiệu hóa).

**Acceptance Scenarios:**

1. **Given** Admin gọi `GET /api/v1/categories`, **Then** HTTP 200 với toàn bộ danh sách categories (kể cả `is_active: false`).

2. **Given** Admin gọi `GET /api/v1/categories?is_active=false`, **Then** chỉ trả về categories đã bị vô hiệu hóa.

3. **Given** response thành công, **Then** mỗi category object chứa: `category_id`, `name`, `description`, `is_active`, `event_count`.

---

### User Story 2 — Khách vãng lai và tình nguyện viên xem danh sách danh mục để lọc sự kiện (Priority: P1)

**Acceptance Scenarios:**

1. **Given** Người dùng chưa đăng nhập gọi danh sách danh mục, **Then** HTTP 200 chỉ trả về các danh mục đang hoạt động.

2. **Given** Tình nguyện viên đã đăng nhập gọi danh sách danh mục, **Then** cũng chỉ thấy các danh mục đang hoạt động.

---

### User Story 3 — Danh sách rỗng (Priority: P2)

**Acceptance Scenarios:**

1. **Given** chưa có danh mục nào được tạo, **Then** HTTP 200 với danh sách rỗng.

---

### Edge Cases

- **Tham số trạng thái hoạt động không phải kiểu logic (đúng/sai):** HTTP 400 "Giá trị trạng thái hoạt động không hợp lệ".

---

## Requirements

### Functional Requirements

- **FR-001:** Yêu cầu truy vấn danh sách danh mục không bắt buộc phải có phiên đăng nhập (là endpoint công khai).
- **FR-002:** WHERE người yêu cầu là người dùng bình thường hoặc chưa đăng nhập, THE system SHALL tự động lọc chỉ trả về danh mục đang hoạt động.
- **FR-003:** WHERE người yêu cầu là Admin, THE system SHALL trả về toàn bộ danh mục (hoặc lọc cụ thể theo trạng thái).
- **FR-004:** Mỗi phần tử trả về gồm: mã danh mục, tên danh mục, mô tả, trạng thái hoạt động, số lượng sự kiện liên kết.
- **FR-005:** Sắp xếp mặc định danh sách theo thứ tự bảng chữ cái của tên danh mục.
- **FR-006:** Không áp dụng phân trang, trả về toàn bộ danh sách hiện có.

### Non-functional Requirements

- **NFR-001:** Thời gian phản hồi hệ thống ≤ 200ms đối với tập dữ liệu nhỏ.
- **NFR-002:** Số lượng sự kiện liên kết được tính toán tối ưu ở mức truy vấn kết nối bảng.
- **NFR-003:** Hỗ trợ cơ chế lưu đệm phản hồi (caching) ở mức mạng để giảm tải cho máy chủ đối với các yêu cầu công khai.

### Key Entities

- **Category:** Danh mục phân loại sự kiện.
- **Event:** Sự kiện liên kết với danh mục.

---

## Success Criteria

- **SC-001:** Người dùng bình thường chỉ thấy các danh mục đang hoạt động.
- **SC-002:** Admin thấy toàn bộ danh mục bao gồm cả danh mục đã dừng hoạt động.
- **SC-003:** Thống kê số lượng sự kiện hoạt động của từng danh mục chính xác.

---

## Assumptions

- **A-001:** Tổng số danh mục trong hệ thống tương đối nhỏ, việc không phân trang không ảnh hưởng hiệu năng.

---

## Out of Scope

- **Thêm danh mục mới:** Thuộc tính năng riêng biệt.
- **Sửa thông tin danh mục:** Thuộc tính năng riêng biệt.
- **Xóa danh mục:** Thực hiện thông qua cơ chế vô hiệu hóa trạng thái hoạt động.
- **Xem chi tiết các sự kiện trong danh mục:** Thuộc tính năng xem danh sách sự kiện có bộ lọc.


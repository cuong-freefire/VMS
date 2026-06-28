# Feature Specification: View Skill List (UC34)

**Feature Branch:** `feat/UC34-view-skill-list`

**Created:** 2026-06-27

**Status:** APPROVED

**Actor:** Admin (quản lý), Volunteer (xem để đăng ký UC20)

---

## User Scenarios & Testing

### User Story 1 — Admin xem toàn bộ kỹ năng (Priority: P1)

**Acceptance Scenarios:**

1. **Given** Admin gọi `GET /api/v1/skills`, **Then** HTTP 200 với toàn bộ skills (kể cả inactive), mỗi phần tử có `skill_id`, `name`, `description`, `is_active`, `volunteer_count`.

2. **Given** Admin gọi `GET /api/v1/skills?is_active=false`, **Then** chỉ trả về inactive skills.

---

### User Story 2 — Tình nguyện viên xem danh sách kỹ năng để đăng ký (Priority: P1)

**Acceptance Scenarios:**

1. **Given** Người dùng bình thường hoặc khách truy cập danh sách kỹ năng, **Then** HTTP 200 chỉ trả về các kỹ năng đang ở trạng thái hoạt động. Thống kê số lượng người dùng sở hữu kỹ năng không được hiển thị để bảo mật thông tin.

---

### User Story 3 — Danh sách rỗng (Priority: P2)

**Acceptance Scenarios:**

1. **Given** chưa có kỹ năng nào được tạo trong hệ thống, **Then** HTTP 200 với danh sách rỗng.

---

## Requirements

### Functional Requirements

- **FR-001:** Yêu cầu truy vấn danh sách kỹ năng là công khai, không bắt buộc phải xác thực phiên đăng nhập.
- **FR-002:** WHERE người yêu cầu là người dùng bình thường, THE system SHALL tự động lọc chỉ trả về kỹ năng đang hoạt động và ẩn thông tin số lượng người dùng sở hữu.
- **FR-003:** WHERE người yêu cầu là Admin, THE system SHALL trả về toàn bộ danh sách kỹ năng kèm thống kê số lượng người dùng sở hữu của từng kỹ năng.
- **FR-004:** Định dạng kết quả trả về cho Admin: mã kỹ năng, tên kỹ năng, mô tả, trạng thái hoạt động, số lượng tình nguyện viên sở hữu.
- **FR-005:** Định dạng kết quả trả về cho người dùng bình thường: mã kỹ năng, tên kỹ năng, mô tả.
- **FR-006:** Sắp xếp mặc định danh sách theo thứ tự bảng chữ cái của tên kỹ năng.
- **FR-007:** Không áp dụng phân trang, trả về toàn bộ dữ liệu hiện có.

### Non-functional Requirements

- **NFR-001:** Thời gian phản hồi hệ thống ≤ 200ms.
- **NFR-002:** Số lượng tình nguyện viên sở hữu kỹ năng được thống kê tối ưu ở mức truy vấn.

### Key Entities

- **Skill:** Kỹ năng của người dùng.

---

## Success Criteria

- **SC-001:** Admin nhìn thấy toàn bộ danh sách kỹ năng bao gồm cả các kỹ năng dừng hoạt động.
- **SC-002:** Tình nguyện viên chỉ chọn được các kỹ năng đang hoạt động.
- **SC-003:** Thống kê số lượng người dùng sở hữu kỹ năng hiển thị chính xác cho Admin.

---

## Out of Scope

- **Thêm kỹ năng mới:** Thuộc tính năng riêng biệt.
- **Sửa thông tin kỹ năng:** Thuộc tính năng riêng biệt.
- **Gán kỹ năng cho tình nguyện viên:** Thuộc tính năng chỉnh sửa kỹ năng của tình nguyện viên.


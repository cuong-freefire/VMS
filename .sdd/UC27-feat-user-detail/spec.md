# Feature Specification: View User Detail (UC27)

**Feature Branch:** `feat/UC27-view-user-detail`

**Created:** 2026-06-27

**Status:** APPROVED

**Actor:** Admin

---

## User Scenarios & Testing

### User Story 1 — Xem chi tiết người dùng thành công (Priority: P1)

Admin click vào một người dùng trong danh sách (UC26) để xem toàn bộ thông tin chi tiết bao gồm thông tin cá nhân, role, kỹ năng, và thống kê tham gia sự kiện.

**Acceptance Scenarios:**

1. **Given** Admin có JWT hợp lệ, **When** gọi `GET /api/v1/users/42`, **Then** hệ thống trả về HTTP 200 với đầy đủ thông tin của user `user_id=42`.

2. **Given** user có 3 kỹ năng đăng ký, **When** API trả về, **Then** response chứa mảng `skills` với đúng 3 phần tử (`skill_id`, `skill_name`).

3. **Given** user đã tham gia 5 sự kiện, **When** API trả về, **Then** response chứa `total_events_joined: 5`, `total_certificates: N`.

4. **Given** API trả về thành công, **When** kiểm tra response, **Then** KHÔNG có trường `password`, `jti`, `refresh_token` trong response.

---

### User Story 2 — User không tồn tại (Priority: P1)

**Acceptance Scenarios:**

1. **Given** `userId=9999` không tồn tại trong database, **When** Admin gọi `GET /api/v1/users/9999`, **Then** hệ thống trả về HTTP 404 với message "Người dùng không tồn tại".

---

### User Story 3 — Phân quyền (Priority: P1)

**Acceptance Scenarios:**

1. **Given** người dùng có role Volunteer gọi `GET /api/v1/users/42`, **Then** HTTP 403 "Bạn không có quyền thực hiện thao tác này".

2. **Given** request không có JWT, **Then** HTTP 401 Unauthorized.

---

### User Story 4 — Xem chi tiết tài khoản đã bị vô hiệu hóa (Priority: P2)

Admin cần xem lý do và thông tin của tài khoản đã bị vô hiệu hóa.

**Acceptance Scenarios:**

1. **Given** user có `is_active: false`, **When** Admin gọi API, **Then** HTTP 200 với đầy đủ dữ liệu, trường `is_active: false` rõ ràng trong response.

---

### Edge Cases

- **`userId` không phải số nguyên (VD: `/users/abc`):** Hệ thống kiểm tra tham số đường dẫn → HTTP 400 "userId không hợp lệ".
- **`userId` âm hoặc bằng 0:** HTTP 400 "userId phải là số nguyên dương".

---

## Requirements

### Functional Requirements

- **FR-001:** WHERE phiên đăng nhập không hợp lệ hoặc thiếu, THE system SHALL trả về HTTP 401.
- **FR-002:** WHERE vai trò không phải Admin, THE system SHALL trả về HTTP 403.
- **FR-003:** THE system SHALL kiểm tra định dạng `userId` là số nguyên dương ở mức tham số đường dẫn.
- **FR-004:** WHERE `userId` không tồn tại trong cơ sở dữ liệu, THE system SHALL trả về HTTP 404.
- **FR-005:** WHEN người dùng tồn tại, THE system SHALL trả về các trường: mã người dùng, họ tên, email, số điện thoại, đường dẫn ảnh đại diện, tên vai trò, trạng thái hoạt động, ngày tạo, danh sách kỹ năng, tổng số sự kiện đã tham gia, và tổng số chứng nhận đã được cấp.
- **FR-006:** THE system SHALL KHÔNG trả về mật khẩu, khóa bảo mật, hoặc mã thông báo phiên trong dữ liệu phản hồi.
- **FR-007:** Danh sách kỹ năng trả về gồm mã kỹ năng và tên kỹ năng — nếu chưa đăng ký kỹ năng nào thì trả về mảng rỗng.
- **FR-008:** Tổng số sự kiện đã tham gia được tính dựa trên số đơn đăng ký đã được phê duyệt hoặc đã được xác nhận điểm danh.
- **FR-009:** Tổng số chứng nhận là số lượng chứng nhận thực tế đã được cấp phát cho người dùng này.

### Non-functional Requirements

- **NFR-001:** Thời gian phản hồi hệ thống ≤ 300ms đối với truy cập chi tiết một người dùng có kết nối bảng.
- **NFR-002:** Tối ưu hóa truy vấn cơ sở dữ liệu để lấy toàn bộ thông tin chi tiết và dữ liệu liên quan trong một lần truy cập, tránh truy vấn lặp lại nhiều lần (N+1).
- **NFR-003:** Ghi nhật ký kiểm toán hệ thống khi Admin truy cập xem chi tiết thông tin người dùng.

### Key Entities

- **User:** Thực thể người dùng trong hệ thống.
- **Role:** Vai trò của người dùng.
- **Skill:** Kỹ năng của người dùng.
- **Application:** Đơn đăng ký tham gia sự kiện.
- **Certificate:** Chứng nhận đã cấp.

---

## Success Criteria

- **SC-001:** Admin xem được đầy đủ thông tin chi tiết người dùng trong thời gian quy định.
- **SC-002:** 100% yêu cầu từ tài khoản không phải Admin bị từ chối truy cập.
- **SC-003:** Không có thông tin bảo mật nào bị rò rỉ trong kết quả trả về.
- **SC-004:** Xử lý lỗi tham số đầu vào không hợp lệ rõ ràng và thân thiện.

---

## Assumptions

- **A-001:** Cơ sở dữ liệu đã thiết lập đầy đủ quan hệ giữa bảng thông tin người dùng, kỹ năng, đơn đăng ký và chứng nhận.
- **A-002:** Các số liệu thống kê được tính toán động tại thời điểm truy vấn để đảm bảo tính chính xác và nhất quán.

---

## Out of Scope

- **Chỉnh sửa thông tin người dùng:** Thuộc tính năng riêng biệt.
- **Xem chi tiết lịch sử đơn đăng ký:** Thuộc tính năng riêng biệt.
- **Vô hiệu hóa hoặc kích hoạt tài khoản:** Thuộc tính năng riêng biệt.


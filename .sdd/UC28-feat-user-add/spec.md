# Feature Specification: Add User (UC28)

**Feature Branch:** `feat/UC28-add-user`

**Created:** 2026-06-27

**Status:** APPROVED

**Actor:** Admin

---

## User Scenarios & Testing

#### User Story 1 — Admin tạo tài khoản Staff mới thành công (Priority: P1)

Admin cần tạo tài khoản cho nhân viên mới gia nhập hệ thống với role Staff.

**Acceptance Scenarios:**

1. **Given** Admin gửi `POST /api/v1/users` với body hợp lệ `{ full_name, email, password, role_id, phone_number }`, **Then** HTTP 201 với mã người dùng của tài khoản vừa tạo.

2. **Given** tạo thành công, **When** kiểm tra dữ liệu lưu trữ, **Then** mật khẩu đã được mã hóa bảo mật (KHÔNG lưu dạng văn bản thuần), tài khoản ở trạng thái hoạt động.

3. **Given** Admin tạo người dùng với vai trò hợp lệ, **Then** người dùng được gán duy nhất vai trò đó.

4. **Given** tạo thành công, **When** kiểm tra kết quả trả về, **Then** kết quả không chứa mật khẩu (kể cả bản mã hóa).

---

### User Story 2 — Email đã tồn tại trong hệ thống (Priority: P1)

**Acceptance Scenarios:**

1. **Given** email `staff@vms.com` đã được đăng ký, **When** Admin tạo người dùng mới với cùng email, **Then** HTTP 409 Conflict với thông điệp "Email này đã được sử dụng".

---

### User Story 3 — Dữ liệu đầu vào không hợp lệ (Priority: P1)

**Acceptance Scenarios:**

1. **Given** email sai định dạng (VD: "not-an-email"), **Then** HTTP 400 với thông báo lỗi chi tiết.

2. **Given** mật khẩu ít hơn 8 ký tự, **Then** HTTP 400 "Mật khẩu phải có ít nhất 8 ký tự".

3. **Given** vai trò không tồn tại trong hệ thống, **Then** HTTP 400 "Vai trò không hợp lệ".

4. **Given** họ tên bị bỏ trống, **Then** HTTP 400 "Họ tên không được để trống".

---

### User Story 4 — Phân quyền (Priority: P1)

**Acceptance Scenarios:**

1. **Given** yêu cầu được gửi từ tài khoản không phải Admin, **Then** HTTP 403.
2. **Given** yêu cầu không có thông tin phiên đăng nhập hợp lệ, **Then** HTTP 401.

---

### Edge Cases

- **Email chứa khoảng trắng hoặc ký tự hoa:** Hệ thống tự động loại bỏ khoảng trắng và chuyển về chữ thường trước khi kiểm tra và lưu trữ.
- **Admin tạo tài khoản Admin khác:** Cho phép, nhưng hệ thống ghi nhận nhật ký cảnh báo đặc biệt.
- **Tạo nhiều tài khoản trùng email đồng thời:** Ràng buộc duy nhất ở mức lưu trữ ngăn chặn việc trùng lặp và trả về lỗi xung đột HTTP 409.

---

## Requirements

### Functional Requirements

- **FR-001:** WHERE phiên đăng nhập không hợp lệ, THE system SHALL trả về HTTP 401.
- **FR-002:** WHERE vai trò không phải Admin, THE system SHALL trả về HTTP 403.
- **FR-003:** THE system SHALL kiểm tra tính hợp lệ của dữ liệu đầu vào:
  - Họ tên: chuỗi ký tự, không rỗng, tối đa 100 ký tự.
  - Email: đúng định dạng thư điện tử.
  - Mật khẩu: tối thiểu 8 ký tự, gồm cả chữ và số.
  - Vai trò: mã định danh vai trò hợp lệ.
  - Số điện thoại: định dạng số điện thoại hợp lệ (tùy chọn).
- **FR-004:** THE system SHALL đảm bảo tính duy nhất của email trên toàn hệ thống trước khi tạo mới.
- **FR-005:** THE system SHALL mã hóa một chiều mật khẩu bằng thuật toán băm an toàn trước khi ghi vào cơ sở dữ liệu.
- **FR-006:** THE system SHALL thiết lập trạng thái hoạt động mặc định cho tài khoản mới.
- **FR-007:** TUYỆT ĐỐI KHÔNG gán nhiều vai trò cho cùng một tài khoản.
- **FR-008:** WHEN tạo thành công, THE system SHALL trả về HTTP 201 kèm thông tin người dùng cơ bản (không chứa mật khẩu).
- **FR-009:** THE system SHALL ghi nhật ký kiểm toán cho hành động tạo tài khoản mới.
- **FR-010:** WHERE tài khoản được tạo có vai trò Admin, THE system SHALL ghi nhật ký cảnh báo hệ thống.

### Non-functional Requirements

- **NFR-001:** Thời gian thực hiện băm mật khẩu và ghi nhận dữ liệu ≤ 2 giây.
- **NFR-002:** Đảm bảo tính toàn vẹn dữ liệu trong quá trình lưu trữ (sử dụng giao dịch - transaction). Nếu một bước lỗi, toàn bộ thao tác phải được thu hồi (rollback).

### Key Entities

- **User:** Người dùng mới được tạo.
- **Role:** Vai trò gán cho người dùng.

---

## Success Criteria

- **SC-001:** Admin tạo tài khoản thành công trong thời gian quy định.
- **SC-002:** Mật khẩu lưu trữ luôn được mã hóa an toàn.
- **SC-003:** Ngăn chặn tuyệt đối việc trùng lặp email.
- **SC-004:** 100% yêu cầu từ non-Admin bị chặn với HTTP 403.

---

## Assumptions

- **A-001:** Các vai trò chuẩn đã được cấu hình sẵn trong cơ sở dữ liệu.
- **A-002:** Ràng buộc duy nhất của email được cấu hình trực tiếp ở mức lưu trữ cơ sở dữ liệu.

---

## Out of Scope

- **Gửi email thông báo đến user mới:** Thuộc Email Service riêng.
- **Upload avatar khi tạo:** Frontend dùng Cloudinary Direct Upload riêng — UC28 chỉ nhận `avatar_url` (string URL).
- **Tạo hàng loạt (bulk create):** Không thuộc scope UC28.
- **Self-registration với role tùy chọn:** Chỉ Admin mới được gán role không phải Volunteer. Self-register thuộc UC04.

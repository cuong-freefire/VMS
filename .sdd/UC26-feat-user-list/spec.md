# Feature Specification: View User List (UC26)

**Feature Branch:** `feat/UC26-view-user-list`

**Created:** 2026-06-27

**Status:** APPROVED

**Actor:** Admin

**Input:** Admin cần xem toàn bộ danh sách người dùng trong hệ thống VMS để giám sát, quản lý tài khoản và thực hiện các thao tác quản trị.

---

## User Scenarios & Testing

### User Story 1 — Xem danh sách người dùng thành công (Priority: P1)

Admin đăng nhập vào hệ thống và truy cập trang Quản lý người dùng. Hệ thống hiển thị danh sách tất cả người dùng dưới dạng bảng phân trang, bao gồm thông tin cơ bản và trạng thái từng tài khoản.

**Why this priority:** Đây là luồng chính (happy path) — không có tính năng này, Admin không thể quản lý tài khoản hệ thống.

**Independent Test:** Gọi `GET /api/v1/users` với JWT token của Admin, xác minh response trả về mảng users với đầy đủ trường cơ bản và metadata phân trang.

**Acceptance Scenarios:**

1. **Given** Admin đã đăng nhập và có JWT hợp lệ, **When** Admin gọi `GET /api/v1/users`, **Then** hệ thống trả về HTTP 200 với danh sách users phân trang (mảng `data`, `total`, `page`, `limit`).

2. **Given** hệ thống có 150 người dùng, **When** Admin gọi `GET /api/v1/users?page=1&limit=10`, **Then** hệ thống trả về đúng 10 bản ghi đầu tiên và `total: 150`.

3. **Given** danh sách trả về thành công, **When** kiểm tra từng phần tử, **Then** mỗi user object chứa: `user_id`, `full_name`, `email`, `role_name`, `is_active`, `created_at` — KHÔNG chứa `password`.

4. **Given** Admin chưa apply filter nào, **When** API được gọi, **Then** danh sách mặc định được sắp xếp theo `created_at DESC` (người dùng mới nhất lên đầu).

---

### User Story 2 — Lọc danh sách theo Role (Priority: P1)

Admin muốn xem riêng danh sách Volunteer hoặc Staff để phân tích hoặc xử lý theo nhóm.

**Why this priority:** Chức năng filter cơ bản, thiết yếu trong quản lý danh sách lớn.

**Independent Test:** Gọi `GET /api/v1/users?role=Volunteer`, xác minh tất cả phần tử trả về đều có `role_name: "Volunteer"`.

**Acceptance Scenarios:**

1. **Given** Admin muốn xem chỉ Volunteer, **When** gọi `GET /api/v1/users?role=Volunteer`, **Then** response chỉ chứa users có role Volunteer, không lẫn role khác.

2. **Given** Admin muốn xem tài khoản đang bị vô hiệu hóa, **When** gọi `GET /api/v1/users?is_active=false`, **Then** response chỉ chứa users có `is_active: false`.

3. **Given** Admin kết hợp filter `?role=Staff&is_active=true`, **When** API được gọi, **Then** response chỉ chứa Staff đang hoạt động.

---

### User Story 3 — Phân quyền: Ngăn chặn truy cập từ role khác (Priority: P1)

Người dùng không phải Admin (Volunteer, Staff, Manager) không được phép truy cập danh sách toàn bộ users.

**Why this priority:** Đây là yêu cầu bảo mật cốt lõi — dữ liệu người dùng phải được bảo vệ.

**Independent Test:** Gọi `GET /api/v1/users` với JWT của Volunteer, xác minh hệ thống trả về HTTP 403.

**Acceptance Scenarios:**

1. **Given** người dùng có role Volunteer gọi `GET /api/v1/users`, **Then** hệ thống trả về HTTP 403 với message "Bạn không có quyền thực hiện thao tác này".

2. **Given** request không có JWT token, **Then** hệ thống trả về HTTP 401 Unauthorized.

---

### User Story 4 — Xử lý danh sách rỗng (Priority: P2)

Hệ thống mới khởi tạo chưa có người dùng nào (ngoài Admin mặc định) hoặc filter không khớp bất kỳ user nào.

**Independent Test:** Gọi `GET /api/v1/users?role=Manager` khi không có Manager nào, xác minh trả về HTTP 200 với mảng rỗng.

**Acceptance Scenarios:**

1. **Given** filter `?role=Manager` không khớp user nào, **When** API được gọi, **Then** hệ thống trả về HTTP 200 với `data: []` và `total: 0` — KHÔNG trả về 404.

---

### Edge Cases

- **`limit` quá lớn (VD: limit=10000):** THE system SHALL giới hạn tối đa `limit=100` per page để tránh overload database.
- **`page` vượt tổng số trang:** THE system SHALL trả về `data: []` và `total` đúng số thực tế, KHÔNG trả về lỗi.
- **Tham số `role` không hợp lệ (VD: `?role=SuperAdmin`):** THE system SHALL trả về HTTP 400 với message "Giá trị role không hợp lệ".
- **Tìm kiếm với ký tự đặc biệt:** Dữ liệu tìm kiếm đầu vào phải được lọc và chuẩn hóa trước khi đưa vào truy vấn cơ sở dữ liệu để ngăn chặn các cuộc tấn công SQL injection.

---

## Requirements

### Functional Requirements

**Authentication & Authorization**

- **FR-001:** WHERE request không chứa phiên đăng nhập (JWT) hợp lệ, THE system SHALL trả về HTTP 401 Unauthorized.
- **FR-002:** WHERE phiên đăng nhập hợp lệ nhưng vai trò không phải Admin, THE system SHALL trả về HTTP 403 Forbidden.
- **FR-003:** THE system SHALL xác định vai trò người dùng trực tiếp từ thông tin phiên đăng nhập được mã hóa để phân quyền.

**Data Retrieval**

- **FR-004:** WHEN Admin gọi API, THE system SHALL trả về danh sách người dùng với phân trang bắt buộc (mặc định trang 1, giới hạn 10 bản ghi).
- **FR-005:** THE system SHALL hỗ trợ lọc danh sách theo vai trò (Volunteer/Staff/Manager/Admin) qua tham số truy vấn.
- **FR-006:** THE system SHALL hỗ trợ lọc danh sách theo trạng thái hoạt động (hoạt động/vô hiệu hóa) qua tham số truy vấn.
- **FR-007:** THE system SHALL hỗ trợ tìm kiếm không phân biệt hoa thường theo từ khóa khớp với họ tên hoặc email.
- **FR-008:** Sắp xếp mặc định danh sách theo thời gian tạo giảm dần (mới nhất trước), hỗ trợ thêm các tùy chọn sắp xếp theo họ tên hoặc email.
- **FR-009:** Mỗi phần tử trong danh sách trả về các trường: mã người dùng, họ tên, email, số điện thoại, đường dẫn ảnh đại diện, tên vai trò, trạng thái hoạt động, ngày tạo.
- **FR-010:** THE system SHALL KHÔNG trả về các trường nhạy cảm như mật khẩu, khóa bí mật hoặc mã thông báo phiên.
- **FR-011:** Giới hạn số lượng bản ghi tối đa trả về trên mỗi trang là 100 bản ghi để tối ưu hiệu năng.

**Response Format**

- **FR-012:** Kết quả trả về theo định dạng chuẩn của dự án: thành công/thất bại, thông điệp phản hồi, và dữ liệu kết quả kèm theo thông tin phân trang (tổng số bản ghi, trang hiện tại, giới hạn mỗi trang).

**Error Handling**

- **FR-013:** Tham số lọc vai trò không nằm trong danh sách hợp lệ → HTTP 400 với thông điệp lỗi tương ứng.
- **FR-014:** Tham số phân trang không phải số nguyên dương → HTTP 400 với thông điệp lỗi tương ứng.

### Non-functional Requirements

- **NFR-001:** Thời gian phản hồi hệ thống ≤ 500ms với tập dữ liệu 10,000 người dùng trong điều kiện tải bình thường.
- **NFR-002:** Truy vấn dữ liệu chỉ lấy các trường cần thiết phục vụ hiển thị danh sách, không tải toàn bộ thông tin chi tiết.
- **NFR-003:** Thực hiện truy vấn cơ sở dữ liệu tối ưu có hỗ trợ phân trang ở mức cơ sở dữ liệu.
- **NFR-004:** Ghi nhật ký kiểm toán hệ thống khi Admin truy cập xem danh sách người dùng.

### Key Entities

- **User:** Tài khoản người dùng trong hệ thống.
- **Role:** Vai trò của người dùng (Volunteer, Staff, Manager, Admin).

---

## Success Criteria

- **SC-001:** Admin xem được danh sách người dùng phân trang trong thời gian quy định.
- **SC-002:** Ngăn chặn thành công các yêu cầu truy cập từ người dùng không có quyền Admin.
- **SC-003:** Không có thông tin nhạy cảm nào bị rò rỉ trong kết quả trả về.
- **SC-004:** Các chức năng lọc và tìm kiếm hoạt động chính xác.

---

## Assumptions

- **A-001:** Cơ sở dữ liệu đã thiết lập đầy đủ liên kết và quan hệ giữa bảng thông tin người dùng và vai trò.
- **A-002:** Tài khoản Admin mặc định đã tồn tại để thực hiện các thao tác quản trị ban đầu.

---

## Out of Scope

- **Xóa người dùng:** Việc xóa vật lý bị cấm, chỉ thực hiện vô hiệu hóa tài khoản (thuộc chức năng chỉnh sửa thông tin).
- **Xem chi tiết từng người dùng:** Được thực hiện ở tính năng riêng biệt.
- **Thêm người dùng mới:** Được thực hiện ở tính năng riêng biệt.
- **Xuất danh sách báo cáo:** Được thực hiện ở tính năng riêng biệt.


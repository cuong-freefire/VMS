# Feature Specification: Filter User (UC30)

**Feature Branch:** `feat/UC30-filter-user`

**Created:** 2026-06-27

**Status:** APPROVED

**Actor:** Admin

---

## User Scenarios & Testing

### User Story 1 — Tìm kiếm user theo tên hoặc email (Priority: P1)

Admin gõ một từ khóa vào ô tìm kiếm để tìm nhanh người dùng cụ thể.

**Acceptance Scenarios:**

1. **Given** Admin gọi `GET /api/v1/users?search=nguyen`, **Then** HTTP 200 trả về tất cả users có `full_name` hoặc `email` chứa "nguyen" (case-insensitive).

2. **Given** từ khóa `search=@gmail.com`, **Then** trả về tất cả users có email chứa `@gmail.com`.

3. **Given** từ khóa không khớp bất kỳ user nào, **Then** HTTP 200 với `data: []`, `total: 0`.

---

### User Story 2 — Lọc kết hợp nhiều điều kiện (Priority: P1)

Admin cần tìm tất cả Staff đang hoạt động và được tạo trong tháng 6/2026.

**Acceptance Scenarios:**

1. **Given** `GET /api/v1/users?role=Staff&is_active=true&created_from=2026-06-01&created_to=2026-06-30`, **Then** kết quả chỉ chứa Staff active được tạo trong khoảng thời gian đó.

2. **Given** kết hợp `search=nguyen&role=Volunteer`, **Then** chỉ trả về Volunteer có tên/email chứa "nguyen".

---

### User Story 3 — Sắp xếp kết quả (Priority: P2)

**Acceptance Scenarios:**

1. **Given** `GET /api/v1/users?sort_by=full_name&order=asc`, **Then** danh sách sắp xếp theo tên A→Z.

2. **Given** `sort_by=created_at&order=desc` (mặc định), **Then** người dùng mới nhất trước.

---

### Edge Cases

- **`search` chứa mã lệnh độc hại (SQL injection):** Hệ thống sử dụng truy vấn tham số hóa an toàn để tự động ngăn chặn, trả về kết quả rỗng thay vì gây lỗi hoặc thực thi mã độc.
- **`created_from` sau `created_to`:** THE system SHALL trả về HTTP 400 "Ngày bắt đầu phải trước ngày kết thúc".
- **`sort_by` không hợp lệ (VD: `sort_by=password`):** HTTP 400 "Trường sắp xếp không hợp lệ".

---

## Requirements

### Functional Requirements

- **FR-001:** WHERE phiên đăng nhập không hợp lệ, HTTP 401. WHERE vai trò không phải Admin, HTTP 403.
- **FR-002:** THE system SHALL hỗ trợ các tham số lọc: tìm kiếm (chuỗi), vai trò (danh sách chuẩn), trạng thái hoạt động (có/không), ngày tạo từ (ngày), ngày tạo đến (ngày), trường sắp xếp (họ tên/email/ngày tạo), thứ tự sắp xếp (tăng/giảm), trang hiện tại, giới hạn mỗi trang (tối đa 100).
- **FR-003:** Tham số tìm kiếm áp dụng đối chiếu không phân biệt chữ hoa thường trên cả họ tên và email theo điều kiện "hoặc".
- **FR-004:** Nhiều điều kiện lọc kết hợp với nhau bằng logic "đồng thời" (AND).
- **FR-005:** WHERE ngày bắt đầu lớn hơn ngày kết thúc, HTTP 400.
- **FR-006:** Chỉ cho phép sắp xếp theo các trường được định nghĩa rõ ràng. Mọi nỗ lực sắp xếp theo trường khác → HTTP 400.
- **FR-007:** Định dạng kết quả trả về tương tự như chức năng xem danh sách cơ bản.
- **FR-008:** Khi không truyền bất kỳ điều kiện lọc nào, hệ thống trả về toàn bộ danh sách người dùng với phân trang mặc định.

### Non-functional Requirements

- **NFR-001:** Cơ sở dữ liệu cần được tối ưu hóa chỉ mục (index) trên các cột tìm kiếm và lọc phổ biến để tăng tốc độ truy vấn.
- **NFR-002:** Thời gian phản hồi hệ thống ≤ 500ms đối với các yêu cầu lọc phức tạp trên tập dữ liệu 10,000 bản ghi.
- **NFR-003:** Thực hiện các câu lệnh truy vấn tham số hóa an toàn, tuyệt đối không nối chuỗi truy vấn trực tiếp từ dữ liệu người dùng gửi lên.

### Key Entities

- **User:** Đối tượng tìm kiếm và lọc.
- **Role:** Vai trò của người dùng.

---

## Success Criteria

- **SC-001:** Tìm kiếm theo tên hoặc email chính xác và không phân biệt chữ hoa chữ thường.
- **SC-002:** Kết hợp nhiều điều kiện lọc cho ra kết quả chính xác.
- **SC-003:** Ngăn chặn tuyệt đối các lỗ hổng bảo mật thông qua tham số đầu vào.
- **SC-004:** Đảm bảo hiệu năng truy vấn nhanh trong phạm vi thời gian quy định.

---

## Assumptions

- **A-001:** Chức năng lọc này được tích hợp cùng API xem danh sách người dùng cơ bản bằng cách xử lý động các tham số truyền lên.

---

## Out of Scope

- **Công cụ tìm kiếm văn bản đầy đủ chuyên dụng (như Elasticsearch):** Chỉ sử dụng các toán tử so sánh cơ bản của cơ sở dữ liệu.
- **Tìm kiếm theo số điện thoại:** Không hỗ trợ trong tính năng này.
- **Lưu bộ lọc cá nhân:** Không hỗ trợ trong tính năng này.
- **Xuất dữ liệu báo cáo sau khi lọc:** Được thực hiện ở tính năng riêng biệt.


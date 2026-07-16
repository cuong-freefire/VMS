# Feature Specification: Search User

**Feature Branch**: `feat/search-user`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Admin cần tìm kiếm người dùng trong hệ thống VMS theo tên hoặc email."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin tìm kiếm người dùng theo tên (Priority: P1)

Admin muốn tìm kiếm người dùng bằng cách nhập từ khóa là tên (full_name) để nhanh chóng tìm đúng người dùng.

**Why this priority**: Tìm kiếm là chức năng cốt lõi giúp Admin tiết kiệm thời gian khi làm việc với danh sách lớn.

**Independent Test**: Gọi `GET /api/v1/users?search=Nguyen` với token Admin, kiểm tra response chứa user có tên chứa "Nguyen" (không phân biệt hoa/thường).

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập và hệ thống có user tên "Nguyen Van A" và "Thi Nguyen", **When** Admin tìm kiếm với từ khóa "nguyen", **Then** hệ thống trả về cả hai user.
2. **Given** Admin tìm kiếm với từ khóa không khớp user nào, **When** Admin submit, **Then** hệ thống trả về danh sách rỗng.
3. **Given** Admin nhập từ khóa rỗng, **When** Admin submit, **Then** hệ thống trả về toàn bộ danh sách (bỏ qua search).

---

### User Story 2 - Admin tìm kiếm người dùng theo email (Priority: P1)

Admin muốn tìm kiếm người dùng theo email để nhanh chóng xác định tài khoản cụ thể.

**Why this priority**: Email là định danh duy nhất — tìm theo email cho kết quả chính xác nhất.

**Independent Test**: Gọi `GET /api/v1/users?search=john%40example.com` với token Admin, kiểm tra response chứa user có email đó.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập, **When** Admin tìm kiếm với email chính xác, **Then** hệ thống trả về đúng user đó.
2. **Given** Admin tìm kiếm với một phần email (ví dụ: "@example"), **When** Admin submit, **Then** hệ thống trả về tất cả user có email chứa "@example".

---

### User Story 3 - Kết hợp search với filter (Priority: P2)

Admin muốn kết hợp tìm kiếm với filter để thu hẹp kết quả — ví dụ: tìm Staff có tên chứa "Nguyen".

**Why this priority**: Kết hợp search và filter giúp Admin tìm kiếm chính xác hơn.

**Independent Test**: Gọi `GET /api/v1/users?search=Nguyen&role=staff` với token Admin, kiểm tra response chính xác.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập, **When** Admin tìm kiếm "Nguyen" và lọc role=staff, **Then** hệ thống trả về Staff có tên chứa "Nguyen".

---

### Edge Cases

- Điều gì xảy ra khi từ khóa tìm kiếm chứa ký tự đặc biệt (SQL injection)? → Hệ thống sanitize input, trả về kết quả rỗng hoặc báo lỗi 400.
- Điều gì xảy ra khi từ khóa quá ngắn (1 ký tự)? → Hệ thống vẫn thực hiện tìm kiếm, nhưng có thể trả về nhiều kết quả.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST hỗ trợ tìm kiếm theo full_name và email qua query param `search`.
- **FR-002**: System MUST thực hiện tìm kiếm không phân biệt hoa/thường (case-insensitive).
- **FR-003**: System MUST hỗ trợ partial match (tìm kiếm một phần).
- **FR-004**: System MUST cho phép kết hợp search với các filter khác (role, is_active, date range).
- **FR-005**: System MUST sanitize input để chống SQL injection.

### Key Entities *(Business Level Only)*

- **User (Người dùng)**: Tìm kiếm theo tên và email.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% request tìm kiếm hợp lệ trả về kết quả chính xác trong vòng 1 giây.
- **SC-002**: Kết quả tìm kiếm bao gồm cả active và inactive user (Admin cần thấy tất cả).

## Assumptions

- Search được implement trên cùng endpoint với UC26 (GET /api/v1/users).
- Middleware xác thực JWT và phân quyền đã hoạt động.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của Search User và KHÔNG được implement:

- **Tìm kiếm theo số điện thoại**: Không có trong scope v1.
- **Tìm kiếm nâng cao (fuzzy search, autocomplete)**: Sẽ được bổ sung sau nếu cần.
- **Tìm kiếm full-text với Elasticsearch**: Quá phức tạp cho v1, sử dụng SQL LIKE.
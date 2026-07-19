# Feature Specification: Search Category

**Feature Branch**: `feat/search-category`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Manager cần tìm kiếm danh mục trong hệ thống VMS theo tên."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manager tìm kiếm danh mục theo tên (Priority: P1)

Manager muốn tìm kiếm danh mục bằng cách nhập từ khóa là tên (name) để nhanh chóng tìm đúng danh mục cần quản lý.

**Why this priority**: Tìm kiếm là chức năng cốt lõi giúp Manager tiết kiệm thời gian khi danh sách danh mục lớn.

**Independent Test**: Gọi `GET /api/v1/categories?search=Hoc%20Tap` với token Manager, kiểm tra response chứa category có tên chứa "Hoc Tap" (không phân biệt hoa/thường).

**Acceptance Scenarios**:

1. **Given** Manager đã đăng nhập và hệ thống có category "Học Tập", "Tình Nguyện", **When** Manager tìm kiếm với từ khóa "học", **Then** hệ thống trả về category "Học Tập".
2. **Given** Manager tìm kiếm với từ khóa không khớp category nào, **When** Manager submit, **Then** hệ thống trả về danh sách rỗng.
3. **Given** Manager nhập từ khóa rỗng, **When** Manager submit, **Then** hệ thống trả về toàn bộ danh sách (bỏ qua search).

---

### User Story 2 - Manager tìm kiếm theo mô tả (Priority: P2)

Manager muốn tìm kiếm danh mục theo nội dung mô tả để tìm các danh mục có liên quan.

**Why this priority**: Hữu ích khi Manager không nhớ chính xác tên danh mục nhưng nhớ nội dung mô tả.

**Independent Test**: Gọi `GET /api/v1/categories?search=the%20thao` với token Manager, kiểm tra response chứa category có tên hoặc mô tả chứa "thể thao".

**Acceptance Scenarios**:

1. **Given** Manager đã đăng nhập, **When** Manager tìm kiếm với từ khóa khớp với mô tả category, **Then** hệ thống trả về category đó.

---

### User Story 3 - Kết hợp search với filter type (Priority: P2)

Manager muốn kết hợp tìm kiếm với filter theo type để thu hẹp kết quả — ví dụ: tìm danh mục location có tên chứa "Hà Nội".

**Why this priority**: Kết hợp search và filter giúp Manager tìm kiếm chính xác hơn khi có nhiều danh mục.

**Independent Test**: Gọi `GET /api/v1/categories?search=Ha%20Noi&type=location` với token Manager, kiểm tra response chính xác.

**Acceptance Scenarios**:

1. **Given** Manager đã đăng nhập, **When** Manager tìm kiếm "Hà Nội" và lọc type=location, **Then** hệ thống trả về category location có tên chứa "Hà Nội".

---

### Edge Cases

- Điều gì xảy ra khi từ khóa tìm kiếm chứa ký tự đặc biệt? → Hệ thống sanitize input, trả về kết quả rỗng hoặc báo lỗi 400.
- Điều gì xảy ra khi từ khóa quá ngắn (1 ký tự)? → Hệ thống vẫn thực hiện tìm kiếm, nhưng có thể trả về nhiều kết quả.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST hỗ trợ tìm kiếm theo name và description qua query param `search`.
- **FR-002**: System MUST thực hiện tìm kiếm không phân biệt hoa/thường (case-insensitive).
- **FR-003**: System MUST hỗ trợ partial match (tìm kiếm một phần).
- **FR-004**: System MUST cho phép kết hợp search với filter type (`type` param).
- **FR-005**: System MUST sanitize input để chống SQL injection.

### Key Entities *(Business Level Only)*

- **Category (Danh mục)**: Tìm kiếm theo tên và mô tả.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% request tìm kiếm hợp lệ trả về kết quả chính xác trong vòng 1 giây.
- **SC-002**: Kết quả tìm kiếm bao gồm cả active và inactive category (Manager cần thấy tất cả).

## Assumptions

- Search được implement trên cùng endpoint với UC31 (GET /api/v1/categories).
- Middleware xác thực JWT và phân quyền đã hoạt động.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của Search Category và KHÔNG được implement:

- **Tìm kiếm theo type riêng biệt**: Type là filter, không phải search field.
- **Tìm kiếm nâng cao (fuzzy search, autocomplete)**: Sẽ được bổ sung sau nếu cần.
- **Tìm kiếm full-text với Elasticsearch**: Quá phức tạp cho v1, sử dụng SQL LIKE.
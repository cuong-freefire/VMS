# Feature Specification: Search Skill

**Feature Branch**: `feat/search-skill`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Manager cần tìm kiếm kỹ năng trong hệ thống VMS theo tên."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manager tìm kiếm skill theo tên (Priority: P1)

Manager muốn tìm kiếm kỹ năng bằng cách nhập từ khóa là tên (name) để nhanh chóng tìm đúng kỹ năng cần quản lý.

**Why this priority**: Tìm kiếm là chức năng cốt lõi giúp Manager tiết kiệm thời gian khi danh sách skill lớn.

**Independent Test**: Gọi `GET /api/v1/skills?search=English` với token Manager, kiểm tra response chứa skill có tên chứa "English" (không phân biệt hoa/thường).

**Acceptance Scenarios**:

1. **Given** Manager đã đăng nhập và hệ thống có skill "English", "Teamwork", **When** Manager tìm kiếm với từ khóa "english", **Then** hệ thống trả về skill "English".
2. **Given** Manager tìm kiếm với từ khóa không khớp skill nào, **When** Manager submit, **Then** hệ thống trả về danh sách rỗng.
3. **Given** Manager nhập từ khóa rỗng, **When** Manager submit, **Then** hệ thống trả về toàn bộ danh sách (bỏ qua search).

---

### User Story 2 - Manager tìm kiếm theo mô tả (Priority: P2)

Manager muốn tìm kiếm kỹ năng theo nội dung mô tả để tìm các kỹ năng có liên quan.

**Why this priority**: Hữu ích khi Manager không nhớ chính xác tên kỹ năng nhưng nhớ nội dung mô tả.

**Independent Test**: Gọi `GET /api/v1/skills?search=giao%20tiep` với token Manager, kiểm tra response chứa skill có tên hoặc mô tả chứa "giao tiếp".

**Acceptance Scenarios**:

1. **Given** Manager đã đăng nhập, **When** Manager tìm kiếm với từ khóa khớp với mô tả skill, **Then** hệ thống trả về skill đó.

---

### Edge Cases

- Điều gì xảy ra khi từ khóa tìm kiếm chứa ký tự đặc biệt? → Hệ thống sanitize input, trả về kết quả rỗng hoặc báo lỗi 400.
- Điều gì xảy ra khi từ khóa quá ngắn (1 ký tự)? → Hệ thống vẫn thực hiện tìm kiếm, nhưng có thể trả về nhiều kết quả.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST hỗ trợ tìm kiếm theo name và description qua query param `search`.
- **FR-002**: System MUST thực hiện tìm kiếm không phân biệt hoa/thường (case-insensitive).
- **FR-003**: System MUST hỗ trợ partial match (tìm kiếm một phần).
- **FR-004**: System MUST sanitize input để chống SQL injection.

### Key Entities *(Business Level Only)*

- **Skill (Kỹ năng)**: Tìm kiếm theo tên và mô tả.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% request tìm kiếm hợp lệ trả về kết quả chính xác trong vòng 1 giây.
- **SC-002**: Kết quả tìm kiếm bao gồm cả active và inactive skill (Manager cần thấy tất cả).

## Assumptions

- Search được implement trên cùng endpoint với UC34 (GET /api/v1/skills).
- Middleware xác thực JWT và phân quyền đã hoạt động.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của Search Skill và KHÔNG được implement:

- **Tìm kiếm theo cấp độ kỹ năng**: Không có trong scope v1.
- **Tìm kiếm nâng cao (fuzzy search, autocomplete)**: Sẽ được bổ sung sau nếu cần.
- **Tìm kiếm full-text với Elasticsearch**: Quá phức tạp cho v1, sử dụng SQL LIKE.
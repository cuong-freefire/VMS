# Feature Specification: Search Organization

**Feature Branch**: `feat/search-organization`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Admin và Manager cần tìm kiếm tổ chức trong hệ thống VMS theo tên."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin tìm kiếm tổ chức theo tên (Priority: P1)

Admin muốn tìm kiếm tổ chức bằng cách nhập từ khóa là tên (name) để nhanh chóng tìm đúng tổ chức cần quản lý.

**Why this priority**: Tìm kiếm là chức năng cốt lõi giúp Admin tiết kiệm thời gian khi danh sách tổ chức lớn.

**Independent Test**: Gọi `GET /api/v1/organizations?search=Nhan%20Ai` với token Admin, kiểm tra response chứa organization có tên chứa "Nhân Ái" (không phân biệt hoa/thường).

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập và hệ thống có tổ chức "Nhân Ái", "Vì Trẻ Em", **When** Admin tìm kiếm với từ khóa "nhân", **Then** hệ thống trả về tổ chức "Nhân Ái".
2. **Given** Admin tìm kiếm với từ khóa không khớp tổ chức nào, **When** Admin submit, **Then** hệ thống trả về danh sách rỗng.
3. **Given** Admin nhập từ khóa rỗng, **When** Admin submit, **Then** hệ thống trả về toàn bộ danh sách (bỏ qua search).

---

### User Story 2 - Manager tìm kiếm tổ chức theo tên (Priority: P1)

Manager cần tìm kiếm tổ chức đang hoạt động để tham chiếu khi tạo sự kiện.

**Why this priority**: Manager thường xuyên cần tham chiếu tổ chức active khi tạo sự kiện.

**Independent Test**: Gọi `GET /api/v1/organizations?search=Hoa` với token Manager, kiểm tra response chỉ chứa tổ chức active có tên chứa "Hoa".

**Acceptance Scenarios**:

1. **Given** Manager đã đăng nhập và hệ thống có tổ chức "Hoa Phượng" (active) và "Hoa Hồng" (inactive), **When** Manager tìm kiếm với từ khóa "hoa", **Then** hệ thống chỉ trả về "Hoa Phượng".
2. **Given** Manager tìm kiếm với từ khóa khớp với tổ chức inactive, **When** Manager submit, **Then** hệ thống trả về danh sách rỗng (không hiển thị tổ chức inactive).

---

### User Story 3 - Kết hợp search với filter (Priority: P2)

Admin muốn kết hợp tìm kiếm với filter để thu hẹp kết quả — ví dụ: tìm tổ chức active có tên chứa "Nhân Ái".

**Why this priority**: Kết hợp search và filter giúp Admin tìm kiếm chính xác hơn.

**Independent Test**: Gọi `GET /api/v1/organizations?search=Nhan&is_active=true` với token Admin, kiểm tra response chính xác.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập, **When** Admin tìm kiếm "Nhân" và lọc is_active=true, **Then** hệ thống trả về tổ chức active có tên chứa "Nhân".

---

### Edge Cases

- Điều gì xảy ra khi từ khóa tìm kiếm chứa ký tự đặc biệt? → Hệ thống sanitize input, trả về kết quả rỗng hoặc báo lỗi 400.
- Điều gì xảy ra khi từ khóa quá ngắn (1 ký tự)? → Hệ thống vẫn thực hiện tìm kiếm, nhưng có thể trả về nhiều kết quả.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST hỗ trợ tìm kiếm theo name qua query param `search`.
- **FR-002**: System MUST thực hiện tìm kiếm không phân biệt hoa/thường (case-insensitive).
- **FR-003**: System MUST hỗ trợ partial match (tìm kiếm một phần).
- **FR-004**: System MUST cho phép kết hợp search với các filter khác (is_active).
- **FR-005**: System MUST sanitize input để chống SQL injection.
- **FR-006**: System MUST áp dụng phân quyền khi search: Admin thấy cả active và inactive; Manager/Staff chỉ thấy active.

### Key Entities *(Business Level Only)*

- **Organization (Tổ chức)**: Tìm kiếm theo tên.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% request tìm kiếm hợp lệ trả về kết quả chính xác trong vòng 1 giây.
- **SC-002**: 100% request search từ Manager/Staff chỉ trả về tổ chức active.
- **SC-003**: 100% request search từ Admin trả về tất cả tổ chức (active + inactive) khớp từ khóa.

## Assumptions

- Search được implement trên cùng endpoint với UC37 (GET /api/v1/organizations).
- Middleware xác thực JWT và phân quyền đã hoạt động.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của Search Organization và KHÔNG được implement:

- **Tìm kiếm theo email tổ chức**: Không có trong scope v1.
- **Tìm kiếm theo địa chỉ tổ chức**: Không có trong scope v1.
- **Tìm kiếm nâng cao (fuzzy search, autocomplete)**: Sẽ được bổ sung sau nếu cần.
- **Tìm kiếm full-text với Elasticsearch**: Quá phức tạp cho v1, sử dụng SQL LIKE.
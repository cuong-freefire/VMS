# Feature Specification: View Organization List (UC37)

**Feature Branch**: `feat/uc37-view-organization-list`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Admin, Manager, Staff cần xem danh sách tổ chức trong hệ thống VMS để giám sát, báo cáo và tham chiếu khi tạo sự kiện."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin xem toàn bộ danh sách tổ chức (Priority: P1)

Admin muốn xem danh sách tất cả tổ chức trong hệ thống, bao gồm cả tổ chức đang hoạt động và đã bị vô hiệu hóa, để nắm tổng quan và quyết định quản lý tiếp theo.

**Why this priority**: Đây là entry point của toàn bộ module Organization — không có danh sách, Admin không thể thực hiện bất kỳ thao tác quản lý nào.

**Independent Test**: Có thể test độc lập bằng cách tạo ít nhất 3 tổ chức (gồm cả active và inactive) trong database, gọi `GET /api/v1/organizations` với token Admin, và kiểm tra response trả về đầy đủ cả hai loại.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập và hệ thống có 3 tổ chức active + 1 tổ chức inactive, **When** Admin truy cập trang danh sách tổ chức, **Then** hệ thống hiển thị đủ 4 tổ chức với thông tin: tên, email liên hệ, trạng thái (active/inactive).
2. **Given** hệ thống chưa có tổ chức nào, **When** Admin truy cập danh sách, **Then** hệ thống trả về danh sách rỗng và hiển thị thông báo "Chưa có tổ chức nào. Hãy thêm tổ chức đầu tiên!".
3. **Given** Admin nhập từ khóa tìm kiếm "Hoa Phượng" vào ô tìm kiếm, **When** Admin submit tìm kiếm, **Then** hệ thống trả về các tổ chức có tên chứa "hoa phượng" (không phân biệt hoa/thường).

---

### User Story 2 - Manager/Staff xem danh sách tổ chức active (Priority: P1)

Manager và Staff cần xem danh sách tổ chức đang hoạt động để phục vụ báo cáo hoặc tham chiếu khi tạo sự kiện.

**Why this priority**: Manager và Staff là hai nhóm người dùng thường xuyên cần tham chiếu đến danh sách tổ chức active trong công việc hằng ngày.

**Independent Test**: Gọi `GET /api/v1/organizations` với token Manager, kiểm tra response chỉ chứa tổ chức có `is_active: true`.

**Acceptance Scenarios**:

1. **Given** Manager đã đăng nhập và hệ thống có 3 tổ chức active + 1 inactive, **When** Manager truy cập danh sách tổ chức, **Then** hệ thống chỉ hiển thị 3 tổ chức active, không hiển thị tổ chức inactive.
2. **Given** Staff đã đăng nhập, **When** Staff truy cập danh sách tổ chức, **Then** hệ thống chỉ hiển thị tổ chức active tương tự như Manager.

---

### User Story 3 - Chặn truy cập với người dùng không có quyền (Priority: P1)

Volunteer và Guest không có nhu cầu nghiệp vụ để xem danh sách tổ chức nội bộ.

**Why this priority**: Bảo mật phân quyền là yêu cầu bắt buộc — dữ liệu tổ chức là dữ liệu quản trị, không dành cho Volunteer hay Guest.

**Independent Test**: Gọi `GET /api/v1/organizations` với token Volunteer hoặc không có token, kiểm tra response trả về HTTP 403 hoặc 401.

**Acceptance Scenarios**:

1. **Given** Volunteer đã đăng nhập, **When** Volunteer gửi request lấy danh sách tổ chức, **Then** hệ thống trả về HTTP 403 Forbidden.
2. **Given** Guest chưa đăng nhập, **When** Guest gửi request lấy danh sách tổ chức, **Then** hệ thống trả về HTTP 401 Unauthorized.

---

### Edge Cases

- Điều gì xảy ra khi tham số `page` hoặc `limit` truyền vào là số âm hoặc không phải số nguyên? → Hệ thống trả về HTTP 400 Bad Request.
- Điều gì xảy ra khi từ khóa tìm kiếm chứa ký tự đặc biệt (SQL injection)? → Hệ thống phải sanitize input, trả về kết quả rỗng hoặc báo lỗi 400.
- Điều gì xảy ra khi database không phản hồi? → Hệ thống trả về HTTP 500 và ghi log lỗi.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trả về danh sách tổ chức khi Admin gọi `GET /api/v1/organizations`, bao gồm cả tổ chức active và inactive.
- **FR-002**: System MUST chỉ trả về tổ chức có `is_active: true` khi Manager hoặc Staff gọi endpoint.
- **FR-003**: System MUST từ chối request từ Volunteer (HTTP 403) và Guest (HTTP 401).
- **FR-004**: System MUST hỗ trợ tìm kiếm theo tên tổ chức qua query param `search` (không phân biệt hoa/thường).
- **FR-005**: System MUST hỗ trợ phân trang qua query params `page` và `limit` (mặc định limit = 20).
- **FR-006**: System MUST trả về thông báo rõ ràng khi danh sách rỗng (mảng rỗng, không phải null).

### Key Entities *(Business Level Only)*

- **Organization (Tổ chức)**: Đơn vị chủ quản sự kiện. Thuộc tính hiển thị trong danh sách: tên, email liên hệ, trạng thái active/inactive, ngày tạo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% request GET danh sách tổ chức từ Admin trả về đúng và đủ (active + inactive) trong vòng 500ms.
- **SC-002**: 100% request từ Manager/Staff chỉ trả về tổ chức active — không bao giờ rò rỉ tổ chức inactive.
- **SC-003**: 100% request từ Volunteer/Guest bị từ chối với HTTP status code đúng (403/401).

## Assumptions

- Middleware xác thực JWT và phân quyền role đã hoạt động từ module Auth (UC03).
- Bảng Organization đã có trong schema với đầy đủ trường.
- Số lượng tổ chức trong hệ thống không vượt quá vài trăm, nên phân trang không phải yêu cầu bắt buộc cho v1 nhưng phải thiết kế sẵn để mở rộng.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC37 và KHÔNG được implement:

- **Thêm mới tổ chức**: Thuộc UC39.
- **Chỉnh sửa hoặc vô hiệu hóa tổ chức từ trang danh sách**: Thuộc UC40.
- **Xem chi tiết tổ chức**: Thuộc UC38.
- **Export danh sách tổ chức ra file**: Thuộc UC57 (Export Reports).
- **Volunteer/Guest xem danh sách tổ chức công khai**: Không có trong scope v1.

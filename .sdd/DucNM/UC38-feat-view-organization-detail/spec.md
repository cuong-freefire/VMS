# Feature Specification: View Organization Detail (UC38)

**Feature Branch**: `feat/uc38-view-organization-detail`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Admin, Manager, Staff cần xem đầy đủ thông tin chi tiết của một tổ chức cụ thể, bao gồm danh sách sự kiện thuộc tổ chức đó."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin xem chi tiết tổ chức (kể cả inactive) (Priority: P1)

Admin muốn xem toàn bộ thông tin của một tổ chức cụ thể — kể cả tổ chức đã bị vô hiệu hóa — để kiểm tra lịch sử hoạt động và thông tin liên hệ.

**Why this priority**: Đây là chức năng đi kèm trực tiếp với danh sách (UC37). Không có trang chi tiết, Admin không thể hiểu rõ từng tổ chức.

**Independent Test**: Gọi `GET /api/v1/organizations/1` với token Admin, kiểm tra response chứa đầy đủ thông tin tổ chức và danh sách tóm tắt sự kiện.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập và tổ chức với ID = 1 tồn tại (đang active), **When** Admin click vào tên tổ chức để xem chi tiết, **Then** hệ thống hiển thị: tên, mô tả, địa chỉ, số điện thoại, email, website, logo, ngày tạo, trạng thái, và danh sách tối đa 10 sự kiện gần nhất thuộc tổ chức đó.
2. **Given** tổ chức với ID = 5 đã bị vô hiệu hóa (`is_active: false`), **When** Admin xem chi tiết tổ chức đó, **Then** hệ thống vẫn trả về đầy đủ thông tin kèm trạng thái "Đã vô hiệu hóa".
3. **Given** Admin tìm kiếm tổ chức với ID = 9999 không tồn tại, **When** Admin gửi request, **Then** hệ thống trả về HTTP 404 với message "Không tìm thấy tổ chức."

---

### User Story 2 - Manager/Staff xem chi tiết tổ chức active (Priority: P1)

Manager và Staff cần xem thông tin chi tiết của tổ chức active để phục vụ công việc báo cáo và tổ chức sự kiện.

**Why this priority**: Manager và Staff là người dùng thường xuyên cần tham chiếu thông tin tổ chức trong workflow hằng ngày.

**Independent Test**: Gọi `GET /api/v1/organizations/1` với token Manager, kiểm tra response trả về đầy đủ thông tin tổ chức active.

**Acceptance Scenarios**:

1. **Given** Manager đã đăng nhập và tổ chức ID = 2 đang active, **When** Manager xem chi tiết tổ chức đó, **Then** hệ thống hiển thị đầy đủ thông tin tổ chức và danh sách sự kiện tóm tắt.
2. **Given** Manager cố gắng xem chi tiết tổ chức đã inactive (ID = 5), **When** Manager gửi request, **Then** hệ thống trả về HTTP 404 (không tiết lộ sự tồn tại của tổ chức inactive với Manager).
3. **Given** Staff đã đăng nhập, **When** Staff xem chi tiết tổ chức active, **Then** hệ thống phản hồi giống như Manager.

---

### Edge Cases

- Điều gì xảy ra khi `id` trong URL không phải số nguyên (ví dụ: `/organizations/abc`)? → HTTP 400 Bad Request.
- Điều gì xảy ra khi tổ chức có sự kiện nhưng toàn bộ sự kiện đã bị xóa mềm? → Hiển thị danh sách sự kiện rỗng, không báo lỗi.
- Điều gì xảy ra khi tổ chức không có logo? → Trả về `logo_url: null`, Frontend hiển thị ảnh placeholder mặc định.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trả về đầy đủ thông tin tổ chức (tên, mô tả, địa chỉ, contact_phone, contact_email, website, logo_url, is_active, created_at) khi gọi `GET /api/v1/organizations/:id`.
- **FR-002**: System MUST bao gồm danh sách tối đa 10 sự kiện gần nhất thuộc tổ chức trong response.
- **FR-003**: System MUST trả về HTTP 404 khi ID tổ chức không tồn tại.
- **FR-004**: WHERE người dùng là Manager hoặc Staff và tổ chức đang inactive, System MUST trả về HTTP 404.
- **FR-005**: WHERE người dùng là Admin và tổ chức đang inactive, System MUST vẫn trả về thông tin đầy đủ.
- **FR-006**: System MUST từ chối Volunteer (HTTP 403) và Guest (HTTP 401).

### Key Entities *(Business Level Only)*

- **Organization (Tổ chức)**: Đơn vị chủ quản sự kiện. Thuộc tính đầy đủ trong trang chi tiết: tên, mô tả, địa chỉ, thông tin liên hệ, logo, trạng thái, ngày tạo.
- **Event (Sự kiện)**: Thuộc về một tổ chức. Hiển thị tóm tắt (tên, trạng thái, ngày tổ chức) trong trang chi tiết tổ chức.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Response chi tiết tổ chức trả về trong vòng 500ms (bao gồm query sự kiện liên kết).
- **SC-002**: 100% trường hợp Manager/Staff không bao giờ thấy thông tin tổ chức inactive.
- **SC-003**: 100% request với ID không tồn tại trả về HTTP 404 đúng format.

## Assumptions

- Quan hệ Organization–Event đã được định nghĩa trong Prisma schema.
- Logo tổ chức được lưu dưới dạng URL trỏ đến Cloudinary (có thể null).
- Danh sách sự kiện trong chi tiết tổ chức chỉ là tóm tắt — người dùng click vào sự kiện sẽ đến UC09 (Event Detail).

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC38 và KHÔNG được implement:

- **Chỉnh sửa thông tin tổ chức từ trang chi tiết**: Thuộc UC40.
- **Xem chi tiết từng sự kiện trong danh sách tóm tắt**: Thuộc UC09 (Event Detail).
- **Thống kê tổ chức (số tình nguyện viên, tổng quyên góp)**: Thuộc UC54–UC57 (Dashboard/Reports).
- **Volunteer/Guest xem chi tiết tổ chức**: Không có trong scope v1.

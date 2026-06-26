# Feature Specification: Organization Management (UC37–UC40)

**Feature Branch**: `feat/organization-management`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Admin cần quản lý các tổ chức (organization) trong hệ thống VMS — xem danh sách, xem chi tiết, thêm mới và chỉnh sửa tổ chức."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem danh sách tổ chức (Priority: P1)

Admin/Manager muốn xem danh sách tất cả tổ chức trên hệ thống (bao gồm tổ chức active và inactive) để có cái nhìn tổng quan và tìm kiếm tổ chức cần quản lý.

**Why this priority**: Đây là chức năng entry point của module Organization — Admin không thể quản lý nếu không thấy danh sách. Không có chức năng này, mọi thao tác CRUD khác đều không thể thực hiện.

**Independent Test**: Có thể test độc lập bằng cách gọi API GET /api/v1/organizations với token Admin hợp lệ và kiểm tra danh sách trả về đúng.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập với quyền Admin và hệ thống có ít nhất 5 tổ chức, **When** Admin truy cập trang danh sách tổ chức, **Then** hệ thống hiển thị tất cả tổ chức (bao gồm cả active và inactive) với thông tin cơ bản (tên, email liên hệ, trạng thái active/inactive).

2. **Given** Manager đã đăng nhập với quyền Manager, **When** Manager truy cập trang danh sách tổ chức, **Then** hệ thống chỉ hiển thị các tổ chức active (`is_active: true`) và không hiển thị tổ chức đã bị vô hiệu hóa.

3. **Given** hệ thống chỉ có 1 tổ chức, **When** Admin truy cập danh sách tổ chức, **Then** hệ thống hiển thị tổ chức đó mà không gây lỗi hiển thị.

4. **Given** hệ thống chưa có tổ chức nào, **When** Admin truy cập danh sách tổ chức, **Then** hệ thống hiển thị thông báo "Chưa có tổ chức nào. Hãy thêm tổ chức đầu tiên!"

5. **Given** Staff hoặc Volunteer cố gắng truy cập API danh sách tổ chức, **When** họ gửi request không có quyền, **Then** hệ thống trả về HTTP 403 Forbidden.

---

### User Story 2 - Xem chi tiết tổ chức (Priority: P1)

Admin/Manager muốn xem đầy đủ thông tin của một tổ chức cụ thể, bao gồm danh sách sự kiện thuộc tổ chức đó, để đánh giá hoạt động của tổ chức.

**Why this priority**: Chức năng chi tiết đi kèm với danh sách, cung cấp thông tin chuyên sâu cần thiết để Admin đưa ra quyết định quản lý.

**Independent Test**: Test độc lập bằng cách gọi API GET /api/v1/organizations/:id với ID tổ chức hợp lệ và kiểm tra response chứa đầy đủ thông tin.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập và có tổ chức với ID = 1, **When** Admin nhấn vào tên tổ chức để xem chi tiết, **Then** hệ thống hiển thị đầy đủ thông tin tổ chức (tên, mô tả, địa chỉ, số điện thoại, email, website, logo, ngày tạo) kèm danh sách sự kiện thuộc tổ chức đó.

2. **Given** Admin tìm kiếm tổ chức với ID không tồn tại (ví dụ: ID = 9999), **When** Admin gửi request xem chi tiết, **Then** hệ thống trả về HTTP 404 với message "Không tìm thấy tổ chức."

3. **Given** Manager đã đăng nhập, **When** Manager xem chi tiết một tổ chức active, **Then** hệ thống hiển thị thông tin đầy đủ giống như Admin.

4. **Given** Manager cố gắng xem chi tiết một tổ chức đã inactive, **When** Manager gửi request, **Then** hệ thống trả về HTTP 404 (Manager không được thấy tổ chức inactive).

---

### User Story 3 - Thêm tổ chức mới (Priority: P1)

Admin muốn thêm một tổ chức mới vào hệ thống để chuẩn bị cho việc tạo sự kiện thuộc tổ chức đó.

**Why this priority**: Đây là chức năng tạo dữ liệu đầu vào — không thể quản lý nếu không thể thêm mới.

**Independent Test**: Test độc lập bằng cách gọi API POST /api/v1/organizations với body hợp lệ và token Admin, kiểm tra response 201 và dữ liệu được tạo trong database.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập, **When** Admin nhập đầy đủ thông tin tổ chức hợp lệ (tên, mô tả, địa chỉ, email, số điện thoại) và submit, **Then** hệ thống tạo tổ chức mới, trả về HTTP 201 với thông tin tổ chức vừa tạo và chuyển hướng đến trang chi tiết tổ chức.

2. **Given** Admin để trống trường "Tên tổ chức" (required), **When** Admin submit form, **Then** hệ thống hiển thị lỗi validation "Tên tổ chức là bắt buộc" và không tạo tổ chức.

3. **Given** Admin nhập email không đúng định dạng, **When** Admin submit form, **Then** hệ thống hiển thị lỗi validation "Email không hợp lệ."

4. **Given** Admin upload logo vượt quá 2MB, **When** Admin submit form, **Then** hệ thống hiển thị lỗi "Kích thước file tối đa 2MB" và không tạo tổ chức.

5. **Given** Manager hoặc Staff cố gắng tạo tổ chức mới, **When** họ gửi request POST, **Then** hệ thống trả về HTTP 403 Forbidden.

---

### User Story 4 - Chỉnh sửa tổ chức (Priority: P2)

Admin muốn cập nhật thông tin tổ chức hiện có (tên, mô tả, địa chỉ, thông tin liên hệ) để đảm bảo dữ liệu luôn chính xác và cập nhật.

**Why this priority**: Chức năng quan trọng giúp duy trì chất lượng dữ liệu, nhưng không blocking — Admin vẫn có thể xóa (inactive) + tạo mới nếu cần.

**Independent Test**: Test độc lập bằng cách gọi API PUT /api/v1/organizations/:id với body cập nhật và kiểm tra response 200 + dữ liệu đã thay đổi trong database.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập và tổ chức có ID = 1 đang active, **When** Admin cập nhật tên tổ chức thành tên mới, **Then** hệ thống cập nhật thành công, trả về HTTP 200 với thông tin tổ chức đã được cập nhật.

2. **Given** Admin cập nhật tổ chức và nhập tên trùng với tên tổ chức khác (unique constraint), **When** Admin submit, **Then** hệ thống trả về HTTP 409 Conflict với message "Tên tổ chức đã tồn tại."

3. **Given** Admin cố gắng chỉnh sửa tổ chức có ID không tồn tại, **When** Admin submit, **Then** hệ thống trả về HTTP 404 "Không tìm thấy tổ chức."

4. **Given** Admin cập nhật logo của tổ chức, **When** Admin upload file mới, **Then** hệ thống xóa logo cũ trên Cloudinary và cập nhật logo mới.

---

### User Story 5 - Vô hiệu hóa (soft-delete) tổ chức (Priority: P2)

Admin muốn vô hiệu hóa một tổ chức không còn hoạt động để ngăn tổ chức đó tạo sự kiện mới, nhưng vẫn giữ dữ liệu lịch sử.

**Why this priority**: Soft-delete là yêu cầu bắt buộc của dự án (theo CONSTITUTION), nhưng không phải là chức năng CRUD cốt lõi. Admin có thể chỉ cần chỉnh sửa thay vì vô hiệu hóa.

**Independent Test**: Test độc lập bằng cách gọi API DELETE /api/v1/organizations/:id và kiểm tra `is_active` chuyển thành false trong database.

**Acceptance Scenarios**:

1. **Given** tổ chức có ID = 1 không có sự kiện nào đang hoạt động, **When** Admin thực hiện vô hiệu hóa tổ chức, **Then** hệ thống set `is_active = false` (soft-delete), trả về HTTP 200 và tổ chức biến mất khỏi danh sách public.

2. **Given** tổ chức có ID = 2 vẫn còn sự kiện đang hoạt động (status chưa phải Completed/Cancelled), **When** Admin thực hiện vô hiệu hóa, **Then** hệ thống trả về HTTP 409 với message "Không thể vô hiệu hóa tổ chức vì vẫn còn sự kiện đang hoạt động."

3. **Given** Admin vô hiệu hóa tổ chức có ID = 1, **When** Admin vào danh sách và bộ lọc "Hiển thị cả tổ chức inactive", **Then** tổ chức hiển thị với trạng thái "Đã vô hiệu hóa."

4. **Given** Admin cố gắng vô hiệu hóa một tổ chức đã inactive, **When** Admin gửi request, **Then** hệ thống trả về HTTP 400 với message "Tổ chức đã bị vô hiệu hóa trước đó."

---

### Edge Cases

- **Tên tổ chức bị trùng:** Khi Admin thêm/sửa tên tổ chức trùng với tên đã tồn tại, hệ thống trả về HTTP 409 Conflict.
- **Xử lý logo khi không có logo mới:** Khi Admin chỉnh sửa tổ chức nhưng không upload logo mới, hệ thống giữ nguyên logo cũ.
- **Concurrent edit:** Nếu hai Admin cùng chỉnh sửa một tổ chức, hệ thống áp dụng last-write-wins (không có optimistic locking cho v1).
- **Organization với nhiều sự kiện:** Khi xóa soft-delete tổ chức, các sự kiện cũ vẫn hiển thị với tên tổ chức nhưng không thể tạo sự kiện mới cho tổ chức đó.

---

## Requirements *(mandatory)*

### Functional Requirements

#### UC37 — Xem danh sách tổ chức (View Organization List)

- **FR-001**: WHERE người dùng có role Admin hoặc Manager, THE system SHALL trả về danh sách tổ chức với các trường: `organization_id`, `name`, `description`, `contact_email`, `is_active`, `created_at`.
- **FR-002**: WHERE người dùng có vai trò Admin, THE system SHALL trả về tất cả tổ chức (bao gồm cả active và inactive).
- **FR-003**: WHERE người dùng có vai trò Manager, THE system SHALL chỉ trả về các tổ chức có `is_active: true`.
- **FR-004**: WHERE người dùng có vai trò Staff hoặc Volunteer, THE system SHALL trả về HTTP 403 Forbidden.
- **FR-005**: THE system SHALL hỗ trợ phân trang (pagination) với tham số page, limit và mặc định là 10 items/trang.
- **FR-006**: THE system SHALL hỗ trợ tìm kiếm theo tên tổ chức (search query param: `?q=keyword`).
- **FR-007**: WHERE không có tổ chức nào, THE system SHALL trả về mảng rỗng kèm total = 0.

#### UC38 — Xem chi tiết tổ chức (View Organization Detail)

- **FR-008**: THE system SHALL trả về thông tin chi tiết tổ chức khi gọi GET /api/v1/organizations/:id, bao gồm: tên, mô tả, địa chỉ, số điện thoại, email, website, logo_url, ngày tạo, danh sách sự kiện thuộc tổ chức.
- **FR-009**: WHERE ID không tồn tại, THE system SHALL trả về HTTP 404 "Không tìm thấy tổ chức."
- **FR-010**: WHERE Manager gọi API với ID của tổ chức inactive, THE system SHALL trả về HTTP 404 (Manager không được thấy tổ chức inactive).

#### UC39 — Thêm tổ chức mới (Add Organization)

- **FR-011**: WHERE người dùng có role Admin, THE system SHALL cho phép thêm tổ chức mới với các trường bắt buộc: name (required, unique), description (optional), address (optional), contact_phone (optional), contact_email (optional, đúng format), website (optional), logo (optional, upload qua Cloudinary).
- **FR-012**: THE system SHALL validate dữ liệu đầu vào bằng Zod trước khi tạo organization.
- **FR-013**: WHERE name đã tồn tại trong database, THE system SHALL trả về HTTP 409 Conflict với message "Tên tổ chức đã tồn tại."
- **FR-014**: WHERE người dùng không có role Admin, THE system SHALL trả về HTTP 403 Forbidden.
- **FR-015**: WHEN tạo tổ chức thành công, THE system SHALL ghi audit log và trả về HTTP 201.

#### UC40 — Chỉnh sửa tổ chức (Edit Organization)

- **FR-016**: WHERE người dùng có role Admin, THE system SHALL cho phép cập nhật các trường của tổ chức: name, description, address, contact_phone, contact_email, website, logo.
- **FR-017**: THE system SHALL validate dữ liệu bằng Zod trước khi cập nhật.
- **FR-018**: WHERE name mới bị trùng với tổ chức khác (ngoại trừ chính nó), THE system SHALL trả về HTTP 409 Conflict.
- **FR-019**: WHERE ID tổ chức không tồn tại, THE system SHALL trả về HTTP 404.
- **FR-020**: WHEN cập nhật thành công, THE system SHALL ghi audit log và trả về HTTP 200.
- **FR-021**: WHERE Admin muốn vô hiệu hóa tổ chức (soft-delete), THE system SHALL kiểm tra tổ chức có sự kiện đang hoạt động không. Nếu có, trả về HTTP 409 Conflict. Nếu không, set `is_active = false`.
- **FR-022**: WHERE tổ chức đã inactive, THE system SHALL từ chối yêu cầu vô hiệu hóa lần nữa với HTTP 400.

### Key Entities *(Business Level Only)*

- **Organization (Tổ chức)**: Đại diện cho một đơn vị/doanh nghiệp/tổ chức chủ quản của các sự kiện tình nguyện. Thuộc tính chính: tên duy nhất, mô tả, địa chỉ, thông tin liên hệ, logo, trạng thái active/inactive. Quan hệ: Một Organization có nhiều Event.

- **Event (Sự kiện)**: Đại diện cho hoạt động tình nguyện thuộc về một tổ chức. Mỗi Event bắt buộc thuộc về duy nhất một Organization.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin có thể hoàn thành thao tác thêm tổ chức mới (từ lúc mở form đến khi nhận kết quả) trong vòng 30 giây.
- **SC-002**: 100% request GET danh sách tổ chức trả về trong vòng 500ms ở môi trường có 100 tổ chức.
- **SC-003**: 100% request write (thêm/sửa/vô hiệu hóa) đều có Zod validation và audit log.
- **SC-004**: Không có hard-delete Organization nào xảy ra — tất cả đều qua soft-delete `is_active`.

---

## Assumptions

- **A-001**: Bảng Organization đã có sẵn trong Prisma schema với đầy đủ các trường cần thiết.
- **A-002**: Cloudinary service đã được cấu hình trong project để upload logo.
- **A-003**: Middleware xác thực (JWT) và phân quyền (role-based) đã hoạt động từ module Auth (UC03).
- **A-004**: Audit log service đã có sẵn trong project để ghi log thao tác.
- **A-005**: Không có quy trình xét duyệt cho việc tạo/chỉnh sửa tổ chức — Admin thao tác trực tiếp.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của feature này và KHÔNG được implement:

- **Tự động inactive tổ chức khi hết hạn:** Không có cơ chế tự động inactive tổ chức dựa trên thời gian — Admin phải thực hiện thủ công.
- **Import/Export danh sách tổ chức qua file:** Sẽ được xử lý trong UC57 (Export Reports).
- **Organization registration từ Staff/Manager:** Chỉ Admin mới có quyền tạo tổ chức.
- **Khôi phục (restore) tổ chức đã inactive:** Không có UI để khôi phục — phiên bản đầu chỉ hỗ trợ set `is_active = true` qua database.
- **Xóa hoàn toàn (hard-delete) tổ chức:** Vi phạm soft-delete policy của dự án.
- **Multi-language:** Chỉ hỗ trợ tiếng Việt cho UI.
# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.)

# Feature Specification: Event Detail - Xem Chi Tiết Sự Kiện (UC09)

**Feature Branch**: `feat/view-event-detail`

**Created**: 2026-07-19

**Status**: Draft

**Input**: User description: "Là Guest hoặc Volunteer của hệ thống VMS, tôi muốn xem thông tin chi tiết đầy đủ của một sự kiện tình nguyện (tiêu đề, mô tả, địa điểm, thời gian, hạn đăng ký, sức chứa, danh mục, thông tin người tạo, trạng thái) để có đủ thông tin phục vụ cho nhu cầu của từng vai trò (Guest: quyết định đăng ký tài khoản và tham gia; Volunteer: quyết định đăng ký tham gia)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest xem thông tin chi tiết sự kiện công khai (Priority: P1)

Là một Guest (chưa đăng nhập), tôi muốn truy cập vào trang chi tiết của một sự kiện cụ thể để xem đầy đủ mọi thông tin quan trọng: tiêu đề, mô tả chi tiết, ảnh sự kiện, địa điểm, thời gian bắt đầu/kết thúc, hạn đăng ký, sức chứa (số đã duyệt / tổng số chỗ), danh mục, thông tin người tạo và trạng thái hiện tại của sự kiện.

**Why this priority**: Đây là luồng chính (happy path) của tính năng - cung cấp thông tin sự kiện cho mọi đối tượng người dùng. Guest là nhóm người dùng đông đảo nhất và là nguồn tuyển Volunteer tiềm năng. Nếu không có màn hình này, Guest không thể đưa ra quyết định đăng ký tham gia. Không có P1 này, toàn bộ tính năng không có giá trị.

**Independent Test**: Có thể test độc lập bằng cách tạo một sự kiện có trạng thái `PUBLISHED` trong database, sau đó truy cập API GET `/api/v1/events/:id` mà không cần authentication, và kiểm tra response trả về đầy đủ thông tin sự kiện kèm category và thông tin người tạo.

**Acceptance Scenarios**:

1. **Given** sự kiện "Dọn rác bãi biển" có trạng thái `PUBLISHED`, `is_active = true`, tồn tại trong database, **When** Guest truy cập vào URL `/events/123`, **Then** hệ thống hiển thị đầy đủ: tiêu đề "Dọn rác bãi biển", mô tả chi tiết, ảnh sự kiện, địa điểm, ngày bắt đầu, ngày kết thúc, hạn đăng ký, sức chứa hiển thị định dạng "5/20", tên danh mục (ví dụ: "Môi trường"), tên người tạo, và badge trạng thái "Đang mở đăng ký". KHÔNG hiển thị thông tin `approved_by` và `approved_at`.

2. **Given** sự kiện "Dạy học tình nguyện" có `image_url = NULL`, **When** Guest truy cập trang chi tiết, **Then** hệ thống hiển thị ảnh placeholder mặc định thay cho ảnh sự kiện.

3. **Given** sự kiện "Hiến máu nhân đạo" có hạn đăng ký là ngày mai, **When** Guest xem trang chi tiết, **Then** hệ thống hiển thị "Còn 1 ngày để đăng ký" hoặc "Hạn đăng ký: 20/07/2026".

4. **Given** Guest đang xem trang chi tiết sự kiện, **When** Guest nhìn vào khu vực thao tác, **Then** hệ thống hiển thị nút "Đăng nhập để đăng ký" (Login to Apply) thay vì nút Apply, vì Guest chưa xác thực.

---

### User Story 2 - Volunteer đã đăng nhập xem chi tiết sự kiện kèm ngữ cảnh cá nhân (Priority: P1)

Là một Volunteer đã đăng nhập, tôi muốn xem trang chi tiết sự kiện và đồng thời biết được trạng thái đơn đăng ký của tôi cho sự kiện này (chưa apply, đang chờ duyệt, đã duyệt, đã từ chối, đã hủy) mà không cần rời khỏi trang để vào mục Applied Events (UC13).

**Why this priority**: Đây là điểm khác biệt cốt lõi giữa Guest và Volunteer - cung cấp ngữ cảnh cá nhân hóa. Volunteer cần biết ngay mình đã apply hay chưa để có hành động tiếp theo phù hợp. Nếu không có tính năng này, Volunteer phải vào UC13 để kiểm tra, gây gián đoạn trải nghiệm. P1 vì đây là giá trị chính mà UC09 mang lại cho nhóm người dùng chính.

**Independent Test**: Có thể test độc lập bằng cách tạo một Volunteer đã apply cho sự kiện với trạng thái `PENDING`, sau đó login và gọi API GET `/api/v1/events/:id`, kiểm tra response có trường `user_application` với `status: "PENDING"`.

**Acceptance Scenarios**:

1. **Given** Volunteer "<anh.nguyen@vms.com>" đã apply cho sự kiện "Dọn rác bãi biển" với trạng thái đơn `PENDING`, **When** Volunteer truy cập `/events/123`, **Then** ngoài thông tin sự kiện, hệ thống hiển thị badge "Đơn đang chờ duyệt" và trường `user_application` trong API response có `{ id, status: "PENDING", created_at }`.

2. **Given** Volunteer "<anh.nguyen@vms.com>" CHƯA từng apply cho sự kiện "Dọn rác bãi biển", **When** Volunteer truy cập `/events/123`, **Then** API trả về `user_application: null` và hệ thống hiển thị nút "Đăng ký ngay" (Apply Now).

3. **Given** Volunteer "<anh.nguyen@vms.com>" có đơn `APPROVED` cho sự kiện, **When** Volunteer truy cập trang chi tiết, **Then** hệ thống hiển thị badge "Đã được duyệt" (màu xanh lá) và KHÔNG hiển thị nút Apply (vì đã được duyệt, không cần apply lại).

4. **Given** Volunteer "<anh.nguyen@vms.com>" có đơn `REJECTED` cho sự kiện, **When** Volunteer truy cập trang chi tiết, **Then** hệ thống hiển thị badge "Đã bị từ chối" (màu đỏ). Nút Apply có thể ẩn hoặc disabled tùy theo quyết định ở UC12.

---

### User Story 3 - Hiển thị sự kiện theo trạng thái (IN_PROGRESS, COMPLETED) (Priority: P2)

Là Guest hoặc Volunteer, tôi muốn xem chi tiết sự kiện ngay cả khi sự kiện đang diễn ra (`IN_PROGRESS`) hoặc đã kết thúc (`COMPLETED`), với giao diện phù hợp với từng trạng thái để tôi nhận biết ngay tình trạng hiện tại của sự kiện.

**Why this priority**: Volunteer có nhu cầu xem lại thông tin sự kiện đã tham gia (từ lịch sử UC21) hoặc đang diễn ra. Nếu chỉ hiển thị `PUBLISHED`, Volunteer không thể truy cập lại sự kiện cũ. P2 vì giá trị cốt lõi của UC09 là thúc đẩy đăng ký sự kiện mới, nhưng đây vẫn là yêu cầu nghiệp vụ quan trọng.

**Independent Test**: Có thể test độc lập bằng cách tạo một sự kiện có trạng thái `COMPLETED`, truy cập API GET `/api/v1/events/:id`, và kiểm tra response trả về thành công với badge trạng thái "Đã kết thúc".

**Acceptance Scenarios**:

1. **Given** sự kiện "Dọn rác bãi biển" đang ở trạng thái `IN_PROGRESS`, **When** Guest truy cập `/events/123`, **Then** hệ thống hiển thị badge "Đang diễn ra" (màu xanh lá) và ẨN nút Apply (không thể đăng ký khi sự kiện đã bắt đầu).

2. **Given** sự kiện "Dọn rác bãi biển" đã chuyển sang `COMPLETED`, **When** Guest truy cập `/events/123`, **Then** hệ thống hiển thị badge "Đã kết thúc" (màu xám), ẨN nút Apply, và ẨN thông tin đếm ngược "Còn X ngày để đăng ký".

---

### User Story 4 - Kiểm soát hiển thị sự kiện không công khai (Priority: P2)

Hệ thống phải đảm bảo các sự kiện ở trạng thái chưa sẵn sàng công khai (`DRAFT`, `PENDING_APPROVAL`, `REJECTED`, `CANCELLED`) hoặc đã bị soft delete (`is_active = false`) KHÔNG được hiển thị cho Guest và Volunteer, ngay cả khi họ biết trực tiếp ID của sự kiện.

**Why this priority**: Đây là yêu cầu bảo mật và nghiệp vụ quan trọng. Rò rỉ thông tin sự kiện chưa duyệt có thể gây hiểu nhầm và ảnh hưởng đến uy tín của tổ chức. P2 vì đây là yêu cầu ngăn chặn hơn là tính năng tạo giá trị trực tiếp, nhưng vẫn bắt buộc phải có trước khi release.

**Independent Test**: Có thể test độc lập bằng cách tạo một sự kiện có trạng thái `DRAFT`, sau đó gọi API GET `/api/v1/events/:id` và kiểm tra hệ thống trả về HTTP 404 (không tiết lộ sự tồn tại của sự kiện).

**Acceptance Scenarios**:

1. **Given** sự kiện "Tết trung thu" có trạng thái `DRAFT`, **When** Guest hoặc Volunteer truy cập `/events/456`, **Then** hệ thống trả về HTTP 404 với message "Không tìm thấy sự kiện" (không phân biệt giữa "không tồn tại" và "không có quyền xem").

2. **Given** sự kiện "Tết trung thu" có trạng thái `PENDING_APPROVAL`, **When** Guest truy cập `/events/456`, **Then** hệ thống trả về HTTP 404.

3. **Given** sự kiện "Tết trung thu" có trạng thái `CANCELLED`, **When** Guest truy cập `/events/456`, **Then** hệ thống trả về HTTP 404.

4. **Given** sự kiện "Tết trung thu" có `is_active = false` (đã bị soft delete), **When** Guest truy cập `/events/456`, **Then** hệ thống trả về HTTP 404.

5. **Given** sự kiện không tồn tại (ID không có trong database), **When** Guest truy cập `/events/99999`, **Then** hệ thống trả về HTTP 404 với message giống hệt các trường hợp trên để không tiết lộ thông tin.

---

### User Story 5 - Frontend UX: Loading, Error và Empty State (Priority: P3)

Là người dùng, khi tôi truy cập trang Event Detail, tôi muốn thấy trạng thái loading trong lúc dữ liệu đang được tải, thông báo lỗi rõ ràng nếu có sự cố, và giao diện phù hợp khi sự kiện không tồn tại.

**Why this priority**: Đây là yêu cầu UX quan trọng nhưng không blocking cho core functionality. Hệ thống vẫn hoạt động nếu không có loading state đẹp, nhưng trải nghiệm người dùng sẽ kém. P3 vì có thể bổ sung sau khi core flow hoạt động.

**Independent Test**: Có thể test độc lập bằng cách mở Frontend, truy cập trang Event Detail với network throttling để quan sát loading state, hoặc truy cập ID không tồn tại để kiểm tra error state.

**Acceptance Scenarios**:

1. **Given** người dùng truy cập `/events/123`, **When** API đang được gọi và chưa trả về response, **Then** hệ thống hiển thị Skeleton loading (khung xương placeholder) cho các phần: ảnh sự kiện, tiêu đề, mô tả, thông tin chi tiết.

2. **Given** API GET `/api/v1/events/:id` trả về lỗi 404, **When** Frontend nhận được response, **Then** hiển thị ErrorState với message "Không tìm thấy sự kiện" và nút "Quay lại danh sách sự kiện" điều hướng về Event List.

3. **Given** API GET `/api/v1/events/:id` trả về lỗi 500, **When** Frontend nhận được response, **Then** hiển thị ErrorState với message "Đã xảy ra lỗi, vui lòng thử lại sau" và nút "Thử lại" (Retry).

4. **Given** người dùng đang ở trang Event Detail và click nút "Quay lại danh sách sự kiện", **When** người dùng được điều hướng, **Then** hệ thống đưa người dùng về trang Event List (UC08) đúng với ngữ cảnh trước đó.

---

---

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- **Sự kiện có `approved_participants >= max_capacity` (đã đầy)**: WHEN sự kiện đã đạt sức chứa tối đa, THE system SHALL hiển thị "Đã đầy" (Full) thay vì số "20/20", và Volunteer chưa apply vẫn thấy nút Apply (UC12 sẽ từ chối nếu đầy). Volunteer đã có đơn `APPROVED` vẫn xem được thông tin bình thường.


- **Người tạo sự kiện đã bị soft delete (`is_active = false`)**: WHEN Staff tạo sự kiện đã bị vô hiệu hóa tài khoản, THE system SHALL vẫn hiển thị tên của người tạo trong phần thông tin sự kiện vì mục đích lịch sử và minh bạch. Không ẩn thông tin này chỉ vì tài khoản người tạo không còn active.

- **Danh mục sự kiện bị xóa**: WHEN `event_category` đã bị soft delete (`is_active = false`) nhưng sự kiện vẫn tham chiếu đến nó, THE system SHALL vẫn hiển thị tên danh mục (vì mục đích lịch sử) hoặc hiển thị "Danh mục không khả dụng".

- **Sự kiện không có mô tả (`description = NULL`)**: WHEN sự kiện được tạo không có mô tả chi tiết, THE system SHALL hiển thị EmptyState với text "Sự kiện này chưa có mô tả chi tiết" thay vì để trống khu vực mô tả.

- **URL truy cập trực tiếp với ID không hợp lệ**: WHEN người dùng truy cập `/events/abc` (ID không phải số) hoặc `/events/-1`, THE system SHALL trả về HTTP 400 (Bad Request) hoặc 404, và Frontend hiển thị ErrorState phù hợp.

- **Concurrent requests**: WHEN người dùng click vào nhiều sự kiện liên tiếp nhanh, THE system SHALL hủy request trước đó (cancel token / AbortController) để tránh hiển thị dữ liệu của sự kiện cũ trên giao diện của sự kiện mới (race condition).

- **Thời gian hiển thị theo múi giờ địa phương**: WHEN hiển thị `start_date`, `end_date`, `application_deadline`, THE system SHALL hiển thị theo múi giờ địa phương của trình duyệt người dùng, backend trả về ISO 8601 UTC, frontend chịu trách nhiệm format. Không yêu cầu backend xử lý timezone conversion.

---

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: THE system SHALL kiểm soát truy cập Event Detail API GET `/api/v1/events/:id` cho Guest và Volunteer: CHỈ được xem sự kiện có trạng thái `PUBLISHED`, `IN_PROGRESS`, hoặc `COMPLETED` VÀ `is_active = true`.

- **FR-002**: THE system SHALL trả về HTTP 404 với message "Không tìm thấy sự kiện" KHI Guest hoặc Volunteer truy cập sự kiện không thỏa mãn điều kiện hiển thị (trạng thái `DRAFT`, `PENDING_APPROVAL`, `REJECTED`, `CANCELLED`, hoặc `is_active = false`).

- **FR-003**: WHEN trả về thông tin sự kiện, THE system SHALL bao gồm các trường: `id`, `title`, `description`, `image_url`, `location`, `start_date`, `end_date`, `application_deadline`, `max_capacity`, `approved_participants`, `status`, `created_at`, `category` (id và name từ bảng `event_categories`), và `created_by` (id và full_name từ bảng `users`).

- **FR-004**: THE system SHALL TUYỆT ĐỐI KHÔNG trả về `approved_by` và `approved_at` trong API response. Đây là dữ liệu nội bộ thuộc quy trình kiểm duyệt, không thuộc phạm vi của UC09.

- **FR-005**: WHEN người dùng đã xác thực (có JWT hợp lệ, role VOLUNTEER), THE system SHALL truy vấn bảng `volunteer_applications` để kiểm tra xem người dùng này đã từng apply cho sự kiện này chưa, và trả về kèm trường `user_application`.

- **FR-006**: Trường `user_application` SHALL có format `null | { id, status, created_at }`. Nếu Volunteer chưa từng apply, giá trị là `null`. Nếu đã apply, trả về `id` của đơn, `status` (PENDING/APPROVED/REJECTED/CANCELLED), và `created_at` (ngày nộp đơn).

- **FR-007**: WHEN người dùng CHƯA xác thực (Guest, không có JWT), THE system SHALL KHÔNG trả về trường `user_application` trong response. Response chỉ chứa thông tin sự kiện công khai.

- **FR-008**: THE system SHALL hiển thị sức chứa sự kiện theo định dạng `approved_participants / max_capacity` (ví dụ: "5/20"). KHI `approved_participants >= max_capacity`, hiển thị text "Đã đầy" (Full) và định dạng "20/20".

- **FR-009**: Frontend SHALL hiển thị nút hành động trong khu vực Apply Entry Point dựa trên role và trạng thái đơn:
  - Guest: Hiển thị nút "Đăng nhập để đăng ký" (Login to Apply), click sẽ redirect đến Login Page (UC03).
  - Volunteer, `user_application = null`: Hiển thị nút "Đăng ký ngay" (Apply Now).
  - Volunteer, `user_application.status = PENDING`: Hiển thị badge "Đơn đang chờ duyệt".
  - Volunteer, `user_application.status = APPROVED`: Hiển thị badge "Đã được duyệt".
  - Volunteer, `user_application.status = REJECTED`: Hiển thị badge "Đã bị từ chối".
  - Volunteer, `user_application.status = CANCELLED`: Hiển thị badge "Đã hủy đơn".

- **FR-010**: Frontend SHALL hiển thị badge trạng thái sự kiện dựa trên `status`:
  - `PUBLISHED`: Hiển thị text "Còn X ngày để đăng ký" hoặc "Hạn đăng ký: DD/MM/YYYY" (tùy theo khoảng cách đến `application_deadline`).
  - `IN_PROGRESS`: Hiển thị badge "Đang diễn ra" (màu xanh lá). ẨN nút Apply và ẩn thông tin đếm ngược.
  - `COMPLETED`: Hiển thị badge "Đã kết thúc" (màu xám). ẨN nút Apply và ẩn thông tin đếm ngược.

- **FR-011**: THE system SHALL hiển thị ảnh sự kiện từ `image_url`. Nếu `image_url` là `NULL`, hiển thị ảnh placeholder mặc định.

- **FR-012**: WHEN người dùng truy cập API với ID không hợp lệ (không phải số nguyên dương), THE system SHALL trả về HTTP 400 với message "ID sự kiện không hợp lệ".

- **FR-013**: Frontend SHALL hiển thị Skeleton loading state trong khi chờ API response cho các khu vực: ảnh sự kiện, tiêu đề, mô tả, thông tin chi tiết.

- **FR-014**: Frontend SHALL sử dụng ErrorBoundary để bắt lỗi rendering không mong muốn và hiển thị ErrorState với nút "Thử lại".

- **FR-015**: Frontend SHALL hủy request API trước đó (dùng AbortController) khi người dùng chuyển sang sự kiện khác để tránh race condition hiển thị sai dữ liệu.

- **FR-016**: THE system SHALL ghi log (dùng Pino logger) cho mỗi lần truy cập Event Detail API, bao gồm: event_id, user_id (nếu đã xác thực, nếu không thì ghi "guest"), timestamp, và HTTP status code. KHÔNG log dữ liệu cá nhân của Volunteer (như trạng thái đơn).

### Key Entities *(Business Level Only)*

- **Event**: Đại diện cho một sự kiện tình nguyện. Thuộc tính nghiệp vụ chính: id, title, description, image_url, location, start_date, end_date, application_deadline, max_capacity, approved_participants, status (DRAFT | PENDING_APPROVAL | PUBLISHED | IN_PROGRESS | COMPLETED | REJECTED | CANCELLED), is_active (soft delete), created_by (FK → User), category_id (FK → EventCategory), approved_by (FK → User, nội bộ), approved_at (nội bộ), created_at, updated_at.

- **EventCategory**: Đại diện cho danh mục phân loại sự kiện (ví dụ: Môi trường, Giáo dục, Y tế). Thuộc tính: id, name, description, is_active. Mỗi sự kiện thuộc về một danh mục.

- **VolunteerApplication**: Đại diện cho đơn đăng ký tham gia sự kiện của một Volunteer. Thuộc tính: id, volunteer_id (FK → User), event_id (FK → Event), status (PENDING | APPROVED | REJECTED | CANCELLED), created_at, updated_at. UC09 chỉ truy vấn application để hiển thị trạng thái, không tạo/sửa/xóa.

- **User** (với vai trò người tạo sự kiện): Đại diện cho Staff/Manager đã tạo ra sự kiện. Thuộc tính hiển thị: id, full_name. UC09 chỉ hiển thị tên người tạo, không hiển thị các thông tin khác như email, phone, role.

---

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Guest và Volunteer có thể xem trang chi tiết sự kiện với thời gian tải trang dưới 2 giây trong điều kiện mạng ổn định (bao gồm thời gian gọi API và render).

- **SC-002**: Hệ thống xử lý được 200 concurrent requests đến API GET `/api/v1/events/:id` mà không có lỗi 500 hoặc timeout.

- **SC-003**: 100% các request đến sự kiện không công khai (`DRAFT`, `PENDING_APPROVAL`, `REJECTED`, `CANCELLED`, `is_active = false`) đều trả về HTTP 404, không có trường hợp nào rò rỉ thông tin.

- **SC-004**: 100% các response cho Guest KHÔNG chứa trường `user_application` và KHÔNG chứa `approved_by`/`approved_at`.

- **SC-005**: Volunteer có thể nhận biết ngay trạng thái đơn của mình (qua badge) trong vòng chưa đầy 1 giây sau khi trang tải xong, không cần chuyển sang màn hình khác.

- **SC-006**: 95% người dùng có thể phân biệt được trạng thái sự kiện (Đang mở đăng ký / Đang diễn ra / Đã kết thúc) chỉ qua badge trạng thái mà không cần đọc chi tiết thời gian.

- **SC-007**: Không có race condition xảy ra khi người dùng chuyển nhanh giữa các sự kiện (dữ liệu sự kiện cũ không xuất hiện trên giao diện sự kiện mới).

---

## Assumptions

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right assumptions based on reasonable defaults
  chosen when the feature description did not specify certain details.
-->

- **A-001**: Database đã thiết lập quan hệ giữa bảng `events`, `event_categories`, và `users` (created_by) để có thể truy vấn JOIN trong một lần gọi API. Prisma schema đã định nghĩa đầy đủ các relation.

- **A-002**: Dữ liệu danh mục (`event_categories`) đã được Manager thiết lập đầy đủ trước khi sự kiện được tạo. Không có trường hợp sự kiện tham chiếu đến category không tồn tại.

- **A-003**: Mỗi sự kiện đều có `created_by` trỏ đến một Staff/Manager hợp lệ. Trường hợp người tạo đã bị soft delete, thông tin (full_name) vẫn được hiển thị vì mục đích lịch sử.

- **A-004**: Ảnh sự kiện (`image_url`) có thể là NULL. Frontend đã có sẵn ảnh placeholder mặc định để hiển thị thay thế.

- **A-005**: Thời gian (`start_date`, `end_date`, `application_deadline`) được backend trả về ở định dạng ISO 8601 UTC. Frontend chịu trách nhiệm format và hiển thị theo múi giờ địa phương của trình duyệt. Không yêu cầu backend xử lý timezone conversion.

- **A-006**: Trang Event List (UC08) đã được implement và có khả năng điều hướng đến Event Detail qua event ID. URL có dạng `/events/:id`.

- **A-007**: Hệ thống xác thực (UC03) đã hoạt động, cung cấp JWT token trong HttpOnly Cookie. API có thể đọc được thông tin user từ token để cá nhân hóa response.

- **A-008**: Các UI components dùng chung (Skeleton, ErrorState, EmptyState, Button, Badge) đã được xây dựng và có sẵn trong thư viện components của Frontend.

- **A-009**: Volunteer Application (UC12) sẽ chịu trách nhiệm kiểm tra điều kiện apply (deadline, capacity, trạng thái sự kiện). UC09 chỉ hiển thị giao diện và không validate điều kiện apply.

- **A-010**: Tính năng chia sẻ sự kiện (Share/Copy link) là out of scope cho v1. Không cần thiết kế URL thân thiện SEO hoặc hỗ trợ social sharing trong phiên bản này.

---

## Out of Scope

<!--
  ACTION REQUIRED: List features explicitly EXCLUDED from this specification.
  This prevents scope creep and aligns stakeholder expectations.
  
  Be specific about WHAT is excluded and briefly state WHY (deferred to v2, 
  handled by another UC, too complex for current iteration, etc.)
-->

Các tính năng sau KHÔNG nằm trong phạm vi của UC09 và KHÔNG được implement:

- **Tạo / Sửa / Xóa sự kiện (CRUD)**: Thuộc về UC16 (Staff tạo sự kiện), UC17 (Manager duyệt sự kiện). UC09 chỉ là Read-only.
- **Đăng ký tham gia sự kiện (Apply)**: Thuộc về UC12. UC09 chỉ hiển thị nút Apply, không xử lý logic apply.
- **Kiểm tra điều kiện apply (deadline, capacity)**: Thuộc về UC12. UC09 không validate xem Volunteer có đủ điều kiện apply hay không.
- **Quản lý đơn đăng ký (Duyệt/Từ chối đơn)**: Thuộc về UC23 (Staff xem Application Detail), UC24 (Duyệt đơn). UC09 chỉ hiển thị trạng thái đơn cho Volunteer.
- **Hiển thị danh sách Volunteer đã apply**: Đây là thông tin nội bộ thuộc về UC23. UC09 không hiển thị danh sách người tham gia cho Guest/Volunteer.
- **Chức năng chia sẻ sự kiện (Share/Copy Link)**: Không thuộc phạm vi MVP v1:1. Có thể bổ sung trong các phiên bản sau.
- **SEO optimization cho trang Event Detail**: Các thẻ meta, Open Graph, canonical URL sẽ được xử lý trong một initiative riêng về SEO, không nằm trong UC09.
- **Bình luận / Đánh giá sự kiện (Feedback)**: Thuộc về UC31 (Gửi Feedback). UC09 không hiển thị phần bình luận hoặc đánh giá.
- **Thống kê sự kiện (lượt xem, tỉ lệ apply, etc.)**: Thuộc về module Analytics, không nằm trong UC09.
- **Chứng nhận tham gia (Certificate)**: Thuộc về UC51, không nằm trong phạm vi UC09.
- **Tìm kiếm / Lọc sự kiện**: Thuộc về UC08 (Event List). UC09 là màn hình chi tiết của một sự kiện cụ thể, không có chức năng tìm kiếm hay lọc.

# Feature Specification: Xem hồ sơ cá nhân (View Profile)

**Feature Branch**: `feat/UC18-view-profile`

**Created**: 2026-06-25

**Status**: APPROVED

**Input**: User description: "Xem hồ sơ cá nhân (UC18 - View Profile)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem thông tin cá nhân thành công (Priority: P1)

Người dùng đã đăng nhập vào hệ thống VMS muốn kiểm tra lại các thông tin cá nhân của mình bao gồm tên, email, số điện thoại, ảnh đại diện và danh sách kỹ năng đã đăng ký. Người dùng truy cập trang Profile, hệ thống tự động nhận diện danh tính thông qua JWT token và trả về đầy đủ thông tin cá nhân đã được làm sạch (loại bỏ các trường nhạy cảm).

**Why this priority**: Đây là luồng chính (happy path) của tính năng, cung cấp giá trị cốt lõi cho người dùng tự quản lý và kiểm tra thông tin cá nhân. Không có user story này thì tính năng không có ý nghĩa.

**Independent Test**: Có thể được kiểm thử độc lập bằng cách gọi API với JWT token hợp lệ, sau đó xác minh response chứa đúng các trường: `full_name`, `email`, `phone_number`, `avatar_url`, và mảng `skills` với `skill_id` và `skill_name`.

**Acceptance Scenarios**:

1. **Given** người dùng đã đăng nhập và có JWT token hợp lệ, **When** người dùng truy cập API xem hồ sơ cá nhân, **Then** hệ thống trả về HTTP 200 với đầy đủ thông tin cá nhân (tên, email, số điện thoại, avatar) và danh sách kỹ năng mà người dùng đã đăng ký.

2. **Given** người dùng có 3 kỹ năng đã đăng ký trong hệ thống, **When** API được gọi, **Then** response chứa mảng skills với đúng 3 phần tử, mỗi phần tử chứa `skill_id` và `skill_name`.

3. **Given** API trả về thành công, **When** kiểm tra response body, **Then** các trường nhạy cảm như `password`, `refresh_token`, `user_id`, `role_id`, `is_active`, `created_at` hoặc bất kỳ trường quản trị nội bộ nào KHÔNG xuất hiện trong response.

---

### User Story 2 - Xử lý request không có JWT token hợp lệ (Priority: P1)

Người dùng chưa đăng nhập hoặc JWT token đã hết hạn cố gắng truy cập API xem hồ sơ. Hệ thống từ chối truy cập để bảo vệ quyền riêng tư và ngăn chặn truy cập trái phép.

**Why this priority**: Đây là rào cản bảo mật quan trọng nhất. Nếu thiếu validation này, hệ thống có thể bị tấn công IDOR, cho phép kẻ tấn công xem thông tin cá nhân của người dùng khác.

**Independent Test**: Có thể được kiểm thử độc lập bằng cách gọi API không kèm JWT token hoặc với token đã hết hạn, sau đó xác minh hệ thống trả về HTTP 401 Unauthorized và không trả về bất kỳ dữ liệu nào.

**Acceptance Scenarios**:

1. **Given** người dùng chưa đăng nhập (không có JWT token), **When** người dùng cố gắng gọi API xem hồ sơ, **Then** hệ thống từ chối truy cập và trả về HTTP 401 với thông báo "Unauthorized - Token không hợp lệ hoặc đã hết hạn".

2. **Given** JWT token đã hết hạn, **When** request được gửi đến server, **Then** Auth Middleware từ chối request trước khi đến Controller và trả về HTTP 401.

---

### User Story 3 - Xử lý tài khoản không tồn tại hoặc đã bị vô hiệu hóa (Priority: P2)

JWT token hợp lệ về mặt cấu trúc nhưng tài khoản tương ứng đã bị xóa mềm hoặc vô hiệu hóa trong hệ thống. Hệ thống phát hiện và trả về lỗi phù hợp.

**Why this priority**: Đây là trường hợp edge case quan trọng để đảm bảo tính toàn vẹn dữ liệu và xử lý các trường hợp bất thường trong vòng đời tài khoản.

**Independent Test**: Có thể được kiểm thử độc lập bằng cách tạo JWT token hợp lệ cho một user_id không tồn tại hoặc đã bị vô hiệu hóa, sau đó xác minh hệ thống trả về HTTP 404 Not Found.

**Acceptance Scenarios**:

1. **Given** JWT token hợp lệ nhưng user_id trong token trỏ đến tài khoản không tồn tại trong database, **When** hệ thống truy vấn dữ liệu, **Then** hệ thống trả về HTTP 404 với thông báo "Tài khoản không tồn tại".

2. **Given** tài khoản đã bị vô hiệu hóa (`is_active = false`), **When** API được gọi, **Then** hệ thống trả về HTTP 403 Forbidden với thông báo "Tài khoản đã bị vô hiệu hóa".

---

### User Story 4 - Xem profile khi chưa có kỹ năng nào (Priority: P3)

Người dùng mới đăng ký chưa kịp thêm kỹ năng vào hồ sơ. Hệ thống vẫn trả về thông tin cá nhân với mảng skills rỗng.

**Why this priority**: Đây là trường hợp hợp lệ và phổ biến với người dùng mới. Hệ thống cần xử lý gracefully mà không gây lỗi.

**Independent Test**: Có thể được kiểm thử độc lập bằng cách gọi API với tài khoản không có bản ghi nào trong bảng user_skills, sau đó xác minh response vẫn trả về HTTP 200 với mảng skills rỗng `[]`.

**Acceptance Scenarios**:

1. **Given** người dùng chưa đăng ký kỹ năng nào, **When** API xem hồ sơ được gọi, **Then** hệ thống trả về HTTP 200 với thông tin cá nhân đầy đủ và mảng `skills: []` (mảng rỗng).

---

### Edge Cases

- **JWT token hợp lệ nhưng user_id trong token không tồn tại trong database**: Hệ thống trả về HTTP 404 Not Found (xử lý trong User Story 3).

- **Người dùng có avatar_url là null**: Hệ thống vẫn trả về thông tin đầy đủ với `avatar_url: null` hoặc một URL mặc định theo cấu hình hệ thống.

- **Dữ liệu kỹ năng bị lỗi foreign key (skill_id không tồn tại trong bảng skills)**: WHERE dữ liệu quan hệ không toàn vẹn, THE system SHALL bỏ qua các bản ghi lỗi và chỉ trả về những kỹ năng hợp lệ, đồng thời ghi log cảnh báo để admin xử lý.

- **Request đồng thời từ cùng một người dùng**: Hệ thống xử lý các request độc lập, mỗi request đều trả về snapshot hiện tại của dữ liệu. Không có race condition vì đây là thao tác đọc (read-only).

- **Tài khoản đăng nhập qua Social Login không có số điện thoại**: WHERE trường `phone_number` là null, THE system SHALL trả về `phone_number: null` trong response mà không gây lỗi.

---

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & Authorization (Xác thực & Phân quyền)**

- **FR-001**: WHERE request không chứa JWT token hợp lệ trong httpOnly cookie, THE system SHALL từ chối truy cập và trả về HTTP 401 Unauthorized.

- **FR-002**: WHEN nhận được request xem hồ sơ, THE system SHALL lấy định danh người dùng (`user_id`) trực tiếp từ JWT token đã được xác thực bởi Auth Middleware.

- **FR-003**: THE system SHALL NOT nhận `user_id` từ URL parameters, query string, hoặc request body để ngăn chặn tấn công IDOR (Insecure Direct Object Reference).

**Data Retrieval (Truy xuất dữ liệu)**

- **FR-004**: WHEN JWT token hợp lệ, THE system SHALL truy xuất thông tin cá nhân của người dùng từ cơ sở dữ liệu dựa trên `user_id` đã xác thực.

- **FR-005**: THE system SHALL trả về CHÍNH XÁC các trường thông tin cá nhân sau: `full_name`, `email`, `phone_number`, `avatar_url`.

- **FR-006**: THE system SHALL kết nối dữ liệu từ bảng quan hệ và trả về mảng danh sách kỹ năng của người dùng, mỗi phần tử trong mảng chỉ bao gồm `skill_id` và `skill_name`.

- **FR-007**: WHERE người dùng chưa đăng ký kỹ năng nào, THE system SHALL trả về mảng `skills` rỗng `[]` thay vì null hoặc undefined.

**Data Privacy & Sanitization (Bảo mật & Làm sạch dữ liệu)**

- **FR-008**: THE system SHALL loại bỏ TẤT CẢ các trường bảo mật nội bộ và quản trị khỏi response, bao gồm nhưng không giới hạn: `password`, `refresh_token`, `user_id`, `role_id`, `is_active`, `created_at`, `updated_at`, `deleted_at`.

- **FR-009**: THE system SHALL ONLY trả về các trường dữ liệu đã được liệt kê rõ ràng trong FR-005 và FR-006, không trả về bất kỳ trường dữ liệu nào khác.

**Error Handling (Xử lý lỗi)**

- **FR-010**: WHERE `user_id` từ token không tồn tại trong cơ sở dữ liệu, THE system SHALL trả về HTTP 404 với thông báo "Tài khoản không tồn tại".

- **FR-011**: WHERE tài khoản đã bị vô hiệu hóa (`is_active = false`), THE system SHALL trả về HTTP 403 với thông báo "Tài khoản đã bị vô hiệu hóa".

- **FR-012**: WHERE xảy ra lỗi database hoặc lỗi hệ thống trong quá trình truy xuất dữ liệu, THE system SHALL trả về HTTP 500 với thông báo lỗi chung mà không tiết lộ chi tiết kỹ thuật.

**Response Format (Định dạng trả về)**

- **FR-013**: THE system SHALL định dạng response theo chuẩn chung của dự án với cấu trúc: `{ success: boolean, message: string, data: object }`.

- **FR-014**: WHEN truy xuất dữ liệu thành công, THE system SHALL trả về HTTP 200 với `success: true` và object `data` chứa thông tin đã được làm sạch.

---

### Non-functional Requirements

**Performance (Hiệu năng)**

- **NFR-001**: THE system SHALL xử lý và phản hồi request xem hồ sơ cá nhân trong vòng 300ms (tính từ khi nhận request đến khi trả về response) ở điều kiện tải bình thường.

- **NFR-002**: THE system SHALL duy trì response time dưới 1 giây ngay cả khi xử lý 200 concurrent requests xem hồ sơ đồng thời.

**Security (Bảo mật)**

- **NFR-003**: THE system SHALL đảm bảo JWT token được truyền tải qua httpOnly cookie với các flag bảo mật phù hợp (Secure, SameSite) theo cấu hình môi trường.

- **NFR-004**: THE system SHALL đảm bảo không có trường dữ liệu nhạy cảm (password hash, token, internal IDs) bị rò rỉ trong response dưới bất kỳ điều kiện nào.

- **NFR-005**: THE system SHALL ghi log cảnh báo khi phát hiện request với JWT token hợp lệ nhưng user_id không tồn tại (có thể là dấu hiệu tấn công hoặc dữ liệu không đồng bộ).

**Reliability & Data Integrity (Độ tin cậy & Toàn vẹn dữ liệu)**

- **NFR-006**: WHEN xảy ra lỗi trong quá trình truy xuất dữ liệu, THE system SHALL xử lý gracefully và trả về thông báo lỗi thân thiện mà không làm crash ứng dụng.

- **NFR-007**: THE system SHALL đảm bảo dữ liệu trả về luôn nhất quán với trạng thái hiện tại của database tại thời điểm truy vấn.

- **NFR-008**: WHERE dữ liệu quan hệ (skills) bị lỗi toàn vẹn (orphaned records), THE system SHALL xử lý gracefully bằng cách bỏ qua các bản ghi lỗi và ghi log cảnh báo.

**Usability (Khả năng sử dụng)**

- **NFR-009**: THE system SHALL trả về thông báo lỗi rõ ràng, cụ thể, và hướng dẫn người dùng cách khắc phục (ví dụ: "Token hết hạn, vui lòng đăng nhập lại").

- **NFR-010**: THE system SHALL trả về thông báo bằng ngôn ngữ phù hợp với ngữ cảnh người dùng (tiếng Việt cho hệ thống VMS).

- **NFR-011**: WHERE trường dữ liệu optional (như `avatar_url`, `phone_number`) là null, THE system SHALL trả về giá trị null một cách rõ ràng thay vì undefined hoặc bỏ qua trường đó.

**Auditability (Khả năng kiểm toán)**

- **NFR-012**: THE system SHALL ghi log audit cho mọi lần truy cập thành công vào API xem hồ sơ, bao gồm: user_id, thời gian truy cập, địa chỉ IP, và kết quả (success/failure).

- **NFR-013**: THE system SHALL NOT ghi log bất kỳ thông tin nhạy cảm nào bao gồm: mật khẩu, token, session ID, hoặc cookie values.

**Scalability (Khả năng mở rộng)**

- **NFR-014**: THE system SHALL thiết kế API endpoint theo cách stateless để có thể scale horizontally khi cần tăng capacity xử lý.

- **NFR-015**: THE system SHALL tối ưu hóa truy vấn database để hạn chế số lượng queries (sử dụng join/include thay vì N+1 queries).

**Maintainability (Khả năng bảo trì)**

- **NFR-016**: THE system SHALL tuân thủ kiến trúc phân tầng rõ ràng (Controller → Service → Repository) để dễ dàng bảo trì và mở rộng trong tương lai.

---

### Key Entities *(Business Level Only)*

- **User (Người dùng)**: Thực thể đại diện cho tài khoản người dùng trong hệ thống. Có các thuộc tính định danh (tên, email, số điện thoại), ảnh đại diện, và trạng thái tài khoản.

- **Skill (Kỹ năng)**: Thực thể đại diện cho một kỹ năng cụ thể mà người dùng có thể đăng ký. Mỗi kỹ năng có định danh duy nhất và tên kỹ năng.

- **User-Skill Relationship (Quan hệ Người dùng - Kỹ năng)**: Quan hệ nhiều-nhiều giữa người dùng và kỹ năng, cho phép một người dùng có nhiều kỹ năng và một kỹ năng được nhiều người dùng sở hữu.

- **Profile (Hồ sơ cá nhân)**: Tập hợp thông tin cá nhân của người dùng bao gồm thông tin định danh, liên lạc, và danh sách kỹ năng, được làm sạch và định dạng để trả về cho client.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người dùng có thể xem đầy đủ thông tin hồ sơ cá nhân của mình trong vòng 1 giây kể từ khi truy cập trang Profile.

- **SC-002**: Hệ thống từ chối 100% các request xem hồ sơ không có JWT token hợp lệ.

- **SC-003**: Không có trường hợp nào thông tin nhạy cảm (password, token, internal IDs) bị rò rỉ trong response API.

- **SC-004**: Hệ thống xử lý chính xác 100% các trường hợp người dùng chưa có kỹ năng (trả về mảng rỗng thay vì lỗi).

- **SC-005**: API xử lý thành công ít nhất 200 request đồng thời (concurrent requests) mà không làm tăng response time vượt quá ngưỡng cho phép (< 1 giây).

- **SC-006**: Không có trường hợp nào người dùng A có thể xem được thông tin hồ sơ của người dùng B thông qua việc thay đổi tham số request.

---

## Assumptions

- **Giả định về người dùng**: Người dùng đã có tài khoản hợp lệ trong hệ thống và đã đăng nhập thành công trước khi truy cập chức năng xem hồ sơ.

- **Giả định về database schema**: Database đã thiết lập các quan hệ foreign key giữa bảng `users`, bảng trung gian `user_skills`, và bảng `skills` để có thể truy vấn kết hợp hiệu quả.

- **Giả định về tính read-only**: Tính năng này hoàn toàn là read-only (chỉ đọc). Bất kỳ thao tác cập nhật, chỉnh sửa, hoặc xóa dữ liệu nào đều nằm ngoài phạm vi và được xử lý bởi các UC khác (UC19, UC20).

- **Giả định về private profile**: API này chỉ phục vụ cho việc người dùng tự xem hồ sơ của chính mình (private profile). Việc xem hồ sơ của người khác là chức năng riêng biệt (UC27 - Admin View User Detail).

- **Giả định về avatar storage**: Avatar được lưu trữ dưới dạng URL (có thể là đường dẫn tương đối hoặc URL đầy đủ tới CDN/cloud storage), không phải binary data.

- **Giả định về error handling**: Hệ thống có cơ chế xử lý lỗi tập trung (error handler middleware) để bắt và format các lỗi không mong đợi theo chuẩn chung.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của feature này và KHÔNG được implement:

- **Thống kê lịch sử tình nguyện**: KHÔNG tính toán, đếm hoặc trả về các thông số thống kê như Tổng số sự kiện đã tham gia, Tổng số giờ tình nguyện, hoặc Số chứng nhận đã nhận. *(Lý do: Nghiệp vụ này thuộc về UC21 - View Volunteer History)*

- **Thông tin quản trị nội bộ**: KHÔNG trả về các trường thông tin quản trị như trạng thái khóa tài khoản, ngày tạo, ngày cập nhật, role/permission, hoặc bất kỳ metadata nội bộ nào. *(Lý do: Đây là thông tin nhạy cảm không dành cho người dùng cuối)*

- **Chỉnh sửa thông tin**: KHÔNG có tính năng cập nhật, chỉnh sửa, hoặc xóa thông tin cá nhân tại API này. *(Lý do: Chức năng chỉnh sửa thuộc về UC19 - Edit Profile và UC20 - Edit Volunteer Skills)*

- **Xem profile của người khác**: KHÔNG hỗ trợ việc User A xem profile của User B. *(Lý do: Đây là Private Profile - chỉ xem hồ sơ của chính mình. Chức năng xem hồ sơ người khác thuộc về UC27 - Admin View User Detail)*

- **Upload/thay đổi avatar**: KHÔNG có chức năng upload hoặc thay đổi ảnh đại diện tại API này. *(Lý do: Chức năng này thuộc về UC19 - Edit Profile)*

- **Quản lý kỹ năng**: KHÔNG có chức năng thêm, sửa, xóa kỹ năng tại API này. *(Lý do: Chức năng này thuộc về UC20 - Edit Volunteer Skills)*

- **Lịch sử hoạt động**: KHÔNG trả về danh sách sự kiện đã đăng ký, trạng thái đơn đăng ký, hoặc lịch sử điểm danh. *(Lý do: Chức năng này thuộc về UC21 - View Volunteer History)*

- **Thông báo và nhắc nhở**: KHÔNG trả về thông báo chưa đọc, nhắc nhở sự kiện sắp tới, hoặc bất kỳ notification nào. *(Lý do: Nằm ngoài phạm vi quản lý hồ sơ cá nhân)*

- **Xác thực email/số điện thoại**: KHÔNG kiểm tra hoặc hiển thị trạng thái xác thực của email hay số điện thoại. *(Lý do: Chức năng xác thực thuộc về module Authentication)*

- **Export/Download profile**: KHÔNG có chức năng export hoặc download thông tin hồ sơ dưới dạng PDF, JSON, hoặc bất kỳ định dạng file nào. *(Lý do: Không có yêu cầu nghiệp vụ trong CONTEXT.md)*

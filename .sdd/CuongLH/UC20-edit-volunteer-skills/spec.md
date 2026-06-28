# Feature Specification: Cập nhật Kỹ năng Tình nguyện viên (Edit Volunteer Skills)

**Feature Branch**: `020-edit-volunteer-skills`

**Created**: 2026-06-25

**Status**: APPROVED

**Input**: User description: "Tính năng cho phép tình nguyện viên cập nhật danh sách kỹ năng của bản thân bằng cách chọn từ danh mục kỹ năng chuẩn hóa do hệ thống quản lý, nhằm tăng cơ hội được phê duyệt tham gia các sự kiện phù hợp với năng lực."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Đồng bộ danh sách kỹ năng từ danh mục chuẩn (Priority: P1)

Tình nguyện viên cần cập nhật hồ sơ cá nhân bằng cách chọn các kỹ năng từ danh mục kỹ năng chuẩn hóa do Manager quản lý, để tăng cơ hội được phê duyệt tham gia các sự kiện phù hợp. Hệ thống phải đảm bảo người dùng chỉ có thể chọn hoặc bỏ chọn các kỹ năng đã được tạo sẵn, và không được phép tự nhập tay (free-text) kỹ năng mới.

**Why this priority**: Đây là core functionality của UC20, cho phép tình nguyện viên quản lý hồ sơ kỹ năng một cách an toàn và nhất quán với dữ liệu master của hệ thống.

**Independent Test**: Có thể test độc lập bằng cách: (1) Đăng nhập với tài khoản Volunteer hợp lệ, (2) Chọn/bỏ chọn các kỹ năng từ danh sách có sẵn, (3) Gửi request cập nhật và kiểm tra hồ sơ đã được đồng bộ đúng.

**Acceptance Scenarios**:

1. **Given** tình nguyện viên đã đăng nhập với JWT token hợp lệ và danh mục kỹ năng có các kỹ năng đang hoạt động (is_active = true), **When** tình nguyện viên chọn danh sách kỹ năng từ giao diện và gửi request cập nhật với mảng skill_ids hợp lệ, **Then** hệ thống trích xuất user_id từ JWT token, xác thực toàn bộ skill_ids tồn tại và đang hoạt động, đồng bộ lại hồ sơ (lưu các kỹ năng được chọn và tự động gỡ bỏ các kỹ năng cũ không còn trong danh sách), và trả về thông báo thành công với danh sách kỹ năng đã cập nhật.

2. **Given** tình nguyện viên có hồ sơ với 3 kỹ năng hiện tại (skill_ids: [1, 2, 3]), **When** tình nguyện viên gửi request cập nhật với danh sách mới chỉ chứa 2 kỹ năng (skill_ids: [2, 4]), **Then** hệ thống xóa kỹ năng 1 và 3 khỏi hồ sơ, giữ lại kỹ năng 2, thêm mới kỹ năng 4, và trả về danh sách kỹ năng cuối cùng là [2, 4].

3. **Given** tình nguyện viên đã đăng nhập, **When** tình nguyện viên gửi request cập nhật với danh sách rỗng (skill_ids: []), **Then** hệ thống gỡ bỏ toàn bộ kỹ năng hiện có khỏi hồ sơ và trả về thông báo thành công với danh sách kỹ năng rỗng.

---

### User Story 2 - Bảo vệ chống truy cập trái phép (IDOR Protection) (Priority: P1)

Hệ thống phải ngăn chặn tình nguyện viên sửa đổi kỹ năng của người khác bằng cách sử dụng user_id từ JWT token thay vì nhận từ request payload hoặc URL parameters.

**Why this priority**: Bảo mật là yêu cầu bắt buộc để đảm bảo tính toàn vẹn dữ liệu và ngăn chặn lỗ hổng IDOR (Insecure Direct Object Reference).

**Independent Test**: Có thể test độc lập bằng cách: (1) Đăng nhập với tài khoản Volunteer A, (2) Thử gửi request cập nhật với user_id của Volunteer B trong payload hoặc URL, (3) Xác nhận hệ thống bỏ qua user_id từ request và chỉ sử dụng user_id từ JWT token.

**Acceptance Scenarios**:

1. **Given** tình nguyện viên A đã đăng nhập với JWT token hợp lệ (user_id = 10), **When** tình nguyện viên A cố gắng gửi request cập nhật kèm theo user_id = 20 trong body hoặc params, **Then** hệ thống bỏ qua user_id từ request, trích xuất user_id = 10 từ JWT token, và chỉ cập nhật hồ sơ của tình nguyện viên A (user_id = 10).

2. **Given** request không có JWT token hợp lệ hoặc token đã hết hạn, **When** request được gửi đến endpoint cập nhật kỹ năng, **Then** hệ thống từ chối request với HTTP 401 Unauthorized và thông báo lỗi "Authentication required" hoặc "Token expired".

---

### User Story 3 - Xử lý lỗi khi skill_id không hợp lệ (Priority: P1)

Hệ thống phải từ chối toàn bộ request và báo lỗi rõ ràng khi có bất kỳ skill_id nào trong danh sách không tồn tại hoặc đã bị vô hiệu hóa (is_active = false).

**Why this priority**: Đảm bảo tính toàn vẹn tham chiếu (Referential Integrity) và ngăn chặn việc lưu dữ liệu không nhất quán.

**Independent Test**: Có thể test độc lập bằng cách: (1) Tạo một danh sách skill_ids có chứa ít nhất một ID không tồn tại hoặc bị vô hiệu hóa, (2) Gửi request cập nhật, (3) Xác nhận hệ thống trả về lỗi 400 Bad Request và không lưu bất kỳ thay đổi nào.

**Acceptance Scenarios**:

1. **Given** danh mục kỹ năng có các kỹ năng với skill_id = [1, 2, 3] đang hoạt động (is_active = true) và skill_id = [999] không tồn tại, **When** tình nguyện viên gửi request cập nhật với danh sách skill_ids = [1, 2, 999], **Then** hệ thống phát hiện skill_id = 999 không hợp lệ, từ chối toàn bộ request với HTTP 400 Bad Request, trả về thông báo lỗi chi tiết "Invalid skill_id: 999 does not exist or is inactive", và không lưu bất kỳ thay đổi nào vào hồ sơ.

2. **Given** danh mục kỹ năng có skill_id = [5] đã bị vô hiệu hóa (is_active = false), **When** tình nguyện viên gửi request cập nhật với danh sách skill_ids = [1, 5], **Then** hệ thống phát hiện skill_id = 5 không hợp lệ, từ chối toàn bộ request với HTTP 400 Bad Request, trả về thông báo lỗi "Invalid skill_id: 5 is inactive", và không lưu bất kỳ thay đổi nào.

3. **Given** tình nguyện viên gửi request với danh sách skill_ids chứa nhiều ID không hợp lệ, **When** hệ thống validate request, **Then** hệ thống trả về danh sách đầy đủ tất cả các skill_id không hợp lệ trong thông báo lỗi (ví dụ: "Invalid skill_ids: [999, 888, 5] - do not exist or are inactive").

---

### Edge Cases

- **Danh sách skill_ids trống**: Khi tình nguyện viên gửi mảng rỗng ([]), hệ thống phải gỡ bỏ toàn bộ kỹ năng hiện có khỏi hồ sơ (tương đương với "không chọn kỹ năng nào").
- **Danh sách skill_ids trùng lặp**: Khi tình nguyện viên gửi mảng có các phần tử trùng lặp (ví dụ: [1, 2, 2, 3]), hệ thống phải tự động loại bỏ các giá trị trùng lặp trước khi validation và chỉ lưu các skill_id duy nhất.
- **Request không có JWT token**: Hệ thống phải trả về HTTP 401 Unauthorized và không xử lý logic cập nhật.
- **JWT token hợp lệ nhưng user_id không tồn tại trong database**: Hệ thống phải trả về HTTP 404 Not Found với thông báo "User not found".
- **Tài khoản người dùng bị vô hiệu hóa (is_active = false)**: Hệ thống phải trả về HTTP 403 Forbidden với thông báo "Account is inactive".
- **Danh mục kỹ năng rỗng (không có kỹ năng nào đang hoạt động)**: Frontend hiển thị thông báo "No skills available" và không cho phép gửi request cập nhật.
- **Race condition**: Khi hai request cập nhật kỹ năng cho cùng một user_id được gửi đồng thời, hệ thống phải xử lý tuần tự (last write wins) hoặc sử dụng cơ chế locking để đảm bảo tính nhất quán.
- **Giới hạn số lượng kỹ năng**: Nếu hệ thống có giới hạn số lượng kỹ năng tối đa (cần chốt với stakeholder), hệ thống phải validate và trả về HTTP 400 Bad Request với thông báo "Maximum [N] skills allowed".

---

## Requirements *(mandatory)*

### Functional Requirements

Tất cả functional requirements dưới đây tuân thủ cú pháp EARS (Easy Approach to Requirements Syntax) để đảm bảo tính rõ ràng và khả năng kiểm thử.

#### FR-001: Xác thực danh tính người dùng (Authentication & IDOR Prevention)

**WHERE** request cập nhật kỹ năng được gửi đến hệ thống, **THE system SHALL** trích xuất user_id từ JWT token hợp lệ trong httpOnly cookie.

**WHERE** request không chứa JWT token hợp lệ hoặc token đã hết hạn, **THE system SHALL** từ chối request với HTTP status 401 Unauthorized và thông báo lỗi "Authentication required" hoặc "Token expired".

**THE system SHALL NOT** sử dụng user_id từ request body, query parameters, hoặc URL path parameters để xác định người dùng cần cập nhật.

**Rationale**: Ngăn chặn lỗ hổng IDOR (Insecure Direct Object Reference) và đảm bảo người dùng chỉ có thể cập nhật kỹ năng của chính mình.

---

#### FR-002: Tiếp nhận danh sách kỹ năng từ request

**WHEN** request cập nhật kỹ năng hợp lệ được gửi đến endpoint, **THE system SHALL** tiếp nhận một mảng (array) chứa các định danh kỹ năng (skill_ids) mà người dùng đã chọn từ giao diện.

**THE system SHALL** chấp nhận mảng rỗng ([]) như một giá trị hợp lệ, biểu thị người dùng muốn gỡ bỏ toàn bộ kỹ năng khỏi hồ sơ.

**WHEN** mảng skill_ids chứa các phần tử trùng lặp, **THE system SHALL** tự động loại bỏ các giá trị trùng lặp trước khi tiến hành validation và cập nhật.

**Rationale**: Đảm bảo hệ thống nhận đúng định dạng dữ liệu và xử lý các trường hợp biên (rỗng, trùng lặp) một cách nhất quán.

---

#### FR-003: Validation toàn vẹn tham chiếu (Referential Integrity)

**WHERE** danh sách skill_ids được gửi lên từ request, **THE system SHALL** kiểm tra xác thực để đảm bảo toàn bộ các kỹ năng trong danh sách BẮT BUỘC phải tồn tại trong danh mục kỹ năng gốc (bảng Skills) và đang ở trạng thái hoạt động (is_active = true).

**WHERE** có bất kỳ skill_id nào trong danh sách không tồn tại hoặc đã bị vô hiệu hóa (is_active = false), **THE system SHALL** từ chối toàn bộ request với HTTP status 400 Bad Request, trả về thông báo lỗi chi tiết liệt kê các skill_id không hợp lệ (ví dụ: "Invalid skill_ids: [999, 5] - do not exist or are inactive"), và hủy bỏ toàn bộ thao tác lưu (rollback).

**THE system SHALL** thực hiện validation toàn vẹn tham chiếu TRƯỚC KHI thực hiện bất kỳ thao tác cập nhật nào vào database.

**Rationale**: Đảm bảo tính toàn vẹn dữ liệu và ngăn chặn việc lưu các tham chiếu không hợp lệ vào hồ sơ người dùng.

---

#### FR-004: Đồng bộ danh sách kỹ năng (Synchronization Strategy)

**WHEN** danh sách skill_ids đã được validate thành công, **THE system SHALL** cập nhật đồng bộ hồ sơ kỹ năng của người dùng theo cơ chế Replace All (Xóa & Thêm mới):

1. **THE system SHALL** xóa toàn bộ các kỹ năng hiện có của người dùng trong bảng trung gian (user_skills).
2. **THE system SHALL** thêm mới toàn bộ các kỹ năng từ danh sách skill_ids đã validate vào bảng trung gian.

**THE system SHALL** thực hiện toàn bộ thao tác đồng bộ trong một transaction duy nhất để đảm bảo tính nguyên tử (atomicity): hoặc toàn bộ thay đổi được áp dụng, hoặc không có thay đổi nào được lưu.

**WHEN** mảng skill_ids rỗng ([]), **THE system SHALL** xóa toàn bộ kỹ năng hiện có của người dùng và không thêm mới kỹ năng nào.

**Rationale**: Cơ chế Replace All đơn giản hóa logic đồng bộ, dễ dàng kiểm thử, và đảm bảo trạng thái cuối cùng của hồ sơ khớp chính xác với danh sách kỹ năng người dùng đã chọn.

---

#### FR-005: Trả về kết quả cập nhật thành công

**WHEN** thao tác đồng bộ kỹ năng hoàn tất thành công, **THE system SHALL** trả về HTTP status 200 OK kèm theo response body chứa:

- Thông báo thành công (message: "Skills updated successfully").
- Danh sách kỹ năng đã được cập nhật (bao gồm skill_id và skill_name của từng kỹ năng).

**THE system SHALL** format response body theo cấu trúc chuẩn được định nghĩa trong `backend/src/utils/response.util.js`.

**Rationale**: Cung cấp feedback rõ ràng cho frontend để hiển thị thông báo thành công và cập nhật giao diện người dùng.

---

#### FR-006: Xử lý lỗi người dùng không tồn tại

**WHERE** JWT token hợp lệ nhưng user_id trích xuất từ token không tồn tại trong database, **THE system SHALL** trả về HTTP status 404 Not Found với thông báo lỗi "User not found".

**Rationale**: Xử lý trường hợp token hợp lệ nhưng user đã bị xóa khỏi hệ thống (edge case).

---

#### FR-007: Xử lý lỗi tài khoản bị vô hiệu hóa

**WHERE** JWT token hợp lệ nhưng tài khoản người dùng đã bị vô hiệu hóa (is_active = false), **THE system SHALL** trả về HTTP status 403 Forbidden với thông báo lỗi "Account is inactive".

**Rationale**: Ngăn chặn người dùng bị vô hiệu hóa thực hiện các thao tác cập nhật hồ sơ.

---

#### FR-008: Giới hạn số lượng kỹ năng tối đa

**WHERE** mảng `skill_ids` gửi lên chứa nhiều hơn 10 phần tử, **THE system SHALL** từ chối toàn bộ request với HTTP status 400 Bad Request, trả về thông báo lỗi "Maximum 10 skills allowed" và hủy bỏ thao tác lưu.

**Rationale**: Giới hạn tối đa 10 kỹ năng nhằm đảm bảo chất lượng hồ sơ (ngăn chặn việc tình nguyện viên tick chọn bừa bãi tất cả các kỹ năng), giúp dữ liệu đầu vào chuẩn xác hơn cho bộ lọc tìm kiếm (Filter User), đồng thời tối ưu hóa giao diện hiển thị (UI) để hồ sơ không bị rườm rà.

### Key Entities *(Business Level Only)*

- **Volunteer (Tình nguyện viên)**: Người dùng có vai trò Volunteer, sở hữu hồ sơ cá nhân bao gồm danh sách các kỹ năng. Mỗi Volunteer có một user_id duy nhất được xác định từ JWT token.

- **Skill (Kỹ năng)**: Dữ liệu master được quản lý tập trung bởi Manager. Mỗi kỹ năng có một skill_id duy nhất, skill_name, và trạng thái hoạt động (is_active). Chỉ các kỹ năng đang hoạt động (is_active = true) mới được phép chọn bởi tình nguyện viên.

- **User_Skills (Liên kết Người dùng - Kỹ năng)**: Bảng trung gian (many-to-many relationship) kết nối giữa Volunteer và Skill. Mỗi bản ghi đại diện cho một kỹ năng mà một tình nguyện viên sở hữu. Cơ chế đồng bộ danh sách kỹ năng thực chất là việc cập nhật các bản ghi trong bảng này.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Tình nguyện viên có thể cập nhật danh sách kỹ năng của mình trong vòng dưới 5 giây, bao gồm cả thời gian load danh mục kỹ năng và gửi request cập nhật.

- **SC-002**: Hệ thống phải ngăn chặn 100% các request cập nhật kỹ năng có chứa skill_id không hợp lệ (không tồn tại hoặc is_active = false), đảm bảo tính toàn vẹn dữ liệu.

- **SC-003**: Hệ thống phải ngăn chặn 100% các nỗ lực IDOR (Insecure Direct Object Reference), đảm bảo người dùng chỉ có thể cập nhật kỹ năng của chính mình thông qua JWT token.

- **SC-004**: 95% tình nguyện viên hoàn thành thành công thao tác cập nhật kỹ năng ngay lần đầu tiên mà không gặp lỗi hoặc thông báo khó hiểu.

- **SC-005**: Thời gian phản hồi (response time) của API cập nhật kỹ năng phải dưới 300ms ở tải bình thường (100 concurrent requests).

- **SC-006**: Hệ thống phải xử lý đúng 100% các trường hợp edge case: danh sách rỗng, danh sách trùng lặp, token hết hạn, user không tồn tại, account bị vô hiệu hóa.

---

## Assumptions

- **Giả định về danh mục kỹ năng**: Danh mục kỹ năng master đã được tạo sẵn bởi Manager thông qua Module 7 - Skill Management. Tình nguyện viên TUYỆT ĐỐI KHÔNG được phép tự nhập tay (free-text) hoặc tạo mới kỹ năng.

- **Giả định về cơ chế đồng bộ**: Backend và Frontend đã thống nhất cơ chế gửi nhận: Frontend sẽ gửi một **mảng (array) chứa toàn bộ danh sách skill_id cuối cùng** mà người dùng đã chọn (thay vì gửi từng request "add" hoặc "remove" lẻ tẻ).

- **Giả định về authentication**: Hệ thống authentication (JWT in httpOnly cookies) đã được triển khai hoàn chỉnh thông qua UC03 (Login) và UC04 (Register). Middleware authentication đã sẵn sàng để trích xuất user_id từ JWT token.

- **Giả định về transaction support**: Database (MySQL) và ORM (Prisma) hỗ trợ transaction để đảm bảo tính nguyên tử (atomicity) khi đồng bộ danh sách kỹ năng.

- **Giả định về role**: Chỉ người dùng có role = Volunteer mới được phép truy cập endpoint cập nhật kỹ năng. Các role khác (Guest, Staff, Manager, Admin) sẽ bị từ chối với HTTP 403 Forbidden.

- **Giả định về giới hạn số lượng**: [NEEDS CLARIFICATION] Chưa có quy định rõ ràng về giới hạn số lượng kỹ năng tối đa. Spec này tạm thời giả định KHÔNG có giới hạn, nhưng cần xác nhận với stakeholder trước khi triển khai.

- **Giả định về duplicate handling**: Frontend sẽ tự động loại bỏ các skill_id trùng lặp trước khi gửi request. Tuy nhiên, Backend vẫn phải có logic xử lý duplicate để đảm bảo tính chặt chẽ.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của feature này và KHÔNG được implement:

- **Tạo mới kỹ năng (Create new skill)**: Tính năng cho phép tình nguyện viên tự nhập tay hoặc tạo mới một kỹ năng chưa có trong hệ thống. Nghiệp vụ tạo kỹ năng thuộc về Module 7 - Skill Management của Manager (UC51 - UC54).

- **Cập nhật thông tin cá nhân cơ bản (Update basic profile)**: Các thông tin như tên, số điện thoại, email, avatar, ngày sinh, giới tính không được cập nhật tại API này. Đã được xử lý ở UC19 - Edit Profile.

- **Quản lý danh mục kỹ năng (Skill Management)**: Các tính năng như tạo, sửa, xóa, vô hiệu hóa kỹ năng trong danh mục master thuộc về quyền hạn của Manager (UC51 - UC54).

- **Lịch sử thay đổi kỹ năng (Skill change history)**: Tính năng lưu trữ và hiển thị lịch sử các lần cập nhật kỹ năng của tình nguyện viên. Có thể cân nhắc triển khai trong phiên bản tương lai (v2).

- **Đề xuất kỹ năng thông minh (Smart skill recommendation)**: Tính năng tự động đề xuất các kỹ năng phù hợp dựa trên hồ sơ hoặc lịch sử tham gia sự kiện của tình nguyện viên. Quá phức tạp cho v1, có thể cân nhắc trong v2.

- **Xác thực kỹ năng (Skill verification/endorsement)**: Tính năng cho phép Staff hoặc Manager xác nhận/chứng thực kỹ năng của tình nguyện viên. Không phải ưu tiên cho MVP, có thể triển khai trong v2 dựa trên phản hồi người dùng.

- **Thống kê và báo cáo (Statistics and reports)**: Tính năng hiển thị số liệu thống kê về kỹ năng phổ biến, phân bố kỹ năng theo sự kiện, hoặc báo cáo lịch sử tham gia của tình nguyện viên. Không nằm trong phạm vi của UC20.

- **Multi-language skill names**: Hỗ trợ đa ngôn ngữ cho tên kỹ năng (ví dụ: tiếng Việt và tiếng Anh). Hiện tại giả định tất cả skill_name đều bằng tiếng Việt. Multi-language có thể cân nhắc trong v2 nếu có yêu cầu quốc tế hóa (i18n).

- **Skill categories/hierarchy**: Tổ chức kỹ năng theo danh mục phân cấp (ví dụ: Kỹ năng Kỹ thuật > Lập trình > JavaScript). Hiện tại danh mục kỹ năng là danh sách phẳng (flat list). Phân cấp kỹ năng có thể cân nhắc nếu số lượng kỹ năng tăng lên đáng kể.

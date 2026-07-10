# Feature Specification: Authentication Login (UC03)

**Feature Branch**: `feat/auth-login`

**Created**: 2026-06-25

**Status**: APPROVED

**Input**: User description: "Là một người dùng hợp lệ của VMS (Volunteer, Staff, Manager, Admin), tôi muốn đăng nhập vào hệ thống an toàn bằng Email và Mật khẩu để truy cập các tính năng nghiệp vụ theo đúng phân quyền của mình."

## User Scenarios & Testing

### User Story 1 - Đăng nhập thành công với tài khoản hợp lệ (Priority: P1)

Là một người dùng hợp lệ (Volunteer, Staff, Manager, hoặc Admin), tôi muốn đăng nhập vào hệ thống bằng Email và Password của mình để truy cập các tính năng nghiệp vụ phù hợp với vai trò của tôi.

**Why this priority**: Đây là luồng chính (happy path) của tính năng đăng nhập, là yêu cầu bắt buộc để người dùng có thể truy cập hệ thống. Không có chức năng này, hệ thống không thể hoạt động.

**Independent Test**: Có thể test độc lập bằng cách tạo một tài khoản hợp lệ trong database, gọi API login với thông tin đúng, và kiểm tra response trả về token hợp lệ cùng thông tin người dùng.

**Acceptance Scenarios**:

1. **Given** người dùng có tài khoản hợp lệ (`isActive: true`) với email "<volunteer@vms.com>" và password đã được hash trong database, **When** người dùng nhập đúng email và password vào form đăng nhập và submit, **Then** hệ thống trả về HTTP 200 với response format `{success, message, data: {user}}`, JWT token được lưu vào HttpOnly Cookie, và thông tin người dùng bao gồm `id`, `email`, `full_name`, `role_id`, `role_name`, `avatar_url`, `phone`, `created_at` được trả về trong response body.

2. **Given** người dùng vừa đăng nhập thành công và có token hợp lệ trong cookie, **When** người dùng gọi các API được bảo vệ (protected endpoints) với cookie này, **Then** hệ thống xác thực thành công và cho phép truy cập tài nguyên.

3. **Given** người dùng với role Volunteer đăng nhập thành công, **When** Frontend nhận được response chứa `role_name`, **Then** Frontend điều hướng người dùng đến trang Home dành cho Volunteer dùng `roleRouteMap`.

4. **Given** người dùng với role Admin đăng nhập thành công, **When** Frontend nhận được response chứa `role_name`, **Then** Frontend điều hướng người dùng đến trang Dashboard dành cho Admin dùng `roleRouteMap`.

---

### User Story 2 - Chặn đăng nhập với thông tin sai (Priority: P1)

Là một người dùng, khi tôi nhập sai email hoặc password, hệ thống phải từ chối đăng nhập và hiển thị thông báo lỗi rõ ràng mà không tiết lộ thông tin nhạy cảm.

**Why this priority**: Đây là phần quan trọng của bảo mật hệ thống, ngăn chặn truy cập trái phép và bảo vệ thông tin người dùng khỏi bị dò quét.

**Independent Test**: Có thể test độc lập bằng cách gọi API login với email không tồn tại hoặc password sai, và kiểm tra hệ thống trả về HTTP 401 với thông báo chung không tiết lộ chi tiết.

**Acceptance Scenarios**:

1. **Given** người dùng có tài khoản với email "<user@vms.com>" trong database, **When** người dùng nhập email "<user@vms.com>" nhưng password sai, **Then** hệ thống trả về HTTP 401 với message "Email hoặc mật khẩu chưa chính xác" (không tiết lộ email có tồn tại) và error code "UNAUTHORIZED".

2. **Given** email "<notexist@vms.com>" không tồn tại trong database, **When** người dùng nhập email này với bất kỳ password nào, **Then** hệ thống trả về HTTP 401 với message "Email hoặc mật khẩu chưa chính xác" (giống hệt trường hợp password sai) và error code "UNAUTHORIZED".

3. **Given** người dùng nhập sai thông tin đăng nhập, **When** hệ thống trả về lỗi, **Then** không có thông tin nhạy cảm (password hash, token, user details) nào bị log ra console hoặc file log. Dùng Pino logger, chỉ log userId và email.

---

### User Story 3 - Account Lockout sau nhiều lần đăng nhập sai (Priority: P1)

Là Admin của hệ thống, tôi muốn hệ thống tự động khóa tính năng đăng nhập của một tài khoản trong 15 phút nếu tài khoản đó nhập sai password 5 lần liên tiếp, để chống lại tấn công brute-force.

**Why this priority**: Đây là yêu cầu bảo mật quan trọng để bảo vệ tài khoản người dùng khỏi bị tấn công dò mật khẩu tự động.

**Independent Test**: Có thể test độc lập bằng cách gọi API login với password sai 5 lần liên tiếp cho cùng một email, sau đó thử đăng nhập với password đúng và kiểm tra hệ thống vẫn trả về lỗi locked.

**Acceptance Scenarios**:

1. **Given** người dùng có tài khoản hợp lệ "<user@vms.com>", **When** người dùng nhập sai password 5 lần liên tiếp trong vòng ngắn, **Then** hệ thống khóa tính năng đăng nhập của tài khoản này trong 15 phút và trả về HTTP 429 với message "Tài khoản tạm thời bị khóa do nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau 15 phút.", error code "ACCOUNT_LOCKED", và `locked_until` timestamp trong `details`.

2. **Given** tài khoản "<user@vms.com>" đang bị khóa do nhập sai 5 lần, **When** người dùng thử đăng nhập với password đúng trong thời gian khóa, **Then** hệ thống vẫn trả về HTTP 429 và không cho phép đăng nhập.

3. **Given** tài khoản "<user@vms.com>" bị khóa lúc 10:00, **When** người dùng thử đăng nhập lại sau 10:15 (đã qua 15 phút) với password đúng, **Then** hệ thống reset số lần nhập sai, cho phép đăng nhập thành công, và trả về HTTP 200 với token hợp lệ.

4. **Given** người dùng nhập sai password 3 lần, **When** người dùng đăng nhập thành công với password đúng ở lần thứ 4, **Then** hệ thống reset counter về 0 và không áp dụng lockout.

---

### User Story 4 - Single Active Session (Priority: P1)

Là Admin của hệ thống, tôi muốn mỗi tài khoản chỉ có một phiên đăng nhập active tại một thời điểm, để ngăn chặn chia sẻ tài khoản và tăng cường bảo mật.

**Why this priority**: Đây là yêu cầu bảo mật quan trọng để đảm bảo một tài khoản chỉ được sử dụng bởi một người tại một thời điểm.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập cùng một tài khoản từ 2 thiết bị khác nhau, sau đó verify rằng token cũ không còn hợp lệ.

**Acceptance Scenarios**:

1. **Given** người dùng đã đăng nhập thành công trên thiết bị A và nhận được JWT với `jti_1`, **When** người dùng đăng nhập lại cùng tài khoản trên thiết bị B và nhận được JWT với `jti_2`, **Then** hệ thống lưu `jti_2` và ghi đè `jti_1` trong `user_sessions` qua Prisma `upsert`.

2. **Given** token cũ với `jti_1` đã bị ghi đè bởi `jti_2`, **When** người dùng sử dụng token cũ (`jti_1`) để gọi protected API, **Then** hệ thống trả về HTTP 401 với message "Tài khoản của bạn đã được đăng nhập trên một thiết bị khác." và error code "LOGGED_IN_ELSEWHERE", đồng thời clear cookie.

3. **Given** người dùng có token mới với `jti_2` đang active, **When** người dùng sử dụng token này để gọi protected API, **Then** hệ thống xác thực thành công và cho phép truy cập.

---

### User Story 5 - Chặn tài khoản bị vô hiệu hóa (Priority: P1)

Là Admin, khi tôi vô hiệu hóa một tài khoản (`isActive: false`), tài khoản đó không được phép đăng nhập vào hệ thống.

**Why this priority**: Đây là yêu cầu bắt buộc để quản trị viên có thể kiểm soát quyền truy cập hệ thống.

**Independent Test**: Có thể test độc lập bằng cách set `isActive: false` cho một tài khoản trong database, sau đó thử đăng nhập và verify hệ thống từ chối.

**Acceptance Scenarios**:

1. **Given** tài khoản "<user@vms.com>" có `isActive: false` trong database, **When** người dùng nhập đúng email và password của tài khoản này, **Then** hệ thống trả về HTTP 403 với message "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên." và error code "ACCOUNT_DISABLED".

2. **Given** người dùng đã đăng nhập thành công và có token hợp lệ, **When** Admin set `isActive: false` cho tài khoản này, **Then** các request tiếp theo với token cũ phải bị từ chối với HTTP 403.

---

### User Story 5b - Chặn tài khoản chưa xác thực Email (Priority: P1)

Là hệ thống, tôi không cho phép các tài khoản chưa xác thực email (`emailVerified: false`) đăng nhập để đảm bảo tính xác thực của thông tin liên lạc.

**Why this priority**: Yêu cầu nghiệp vụ bắt buộc (Business Rule 8.1.6).

**Independent Test**: Có thể test độc lập bằng cách set `emailVerified: false` cho một tài khoản trong database, sau đó thử đăng nhập và verify hệ thống từ chối.

**Acceptance Scenarios**:

1. **Given** tài khoản "<user@vms.com>" có `emailVerified: false` trong database, **When** người dùng nhập đúng email và password của tài khoản này, **Then** hệ thống trả về HTTP 403 với message "Email chưa được xác thực. Vui lòng kiểm tra hộp thư để xác thực tài khoản." và error code "EMAIL_NOT_VERIFIED".

---

### User Story 6 - Frontend UX: Loading state và chống double-submit (Priority: P2)

Là người dùng, khi tôi click nút Đăng nhập, tôi muốn thấy trạng thái loading và nút bị disable để tránh gửi request nhiều lần, đồng thời được thông báo rõ ràng kết quả thành công hay thất bại.

**Why this priority**: Đây là yêu cầu UX quan trọng nhưng không blocking cho core functionality, do đó được xếp P2.

**Independent Test**: Có thể test độc lập bằng cách mở Frontend, click nút Đăng nhập và verify nút bị disable + hiện loading spinner trong lúc chờ response.

**Acceptance Scenarios**:

1. **Given** người dùng đang ở trang login, **When** người dùng click nút "Đăng nhập", **Then** nút bị disable và hiển thị trạng thái loading (spinner hoặc text "Đang đăng nhập...").

2. **Given** nút Đăng nhập đang ở trạng thái loading, **When** người dùng cố gắng click nhiều lần, **Then** hệ thống không gửi thêm request nào (debounce/prevent double-submit).

3. **Given** API login trả về lỗi 401, **When** Frontend nhận được response, **Then** hiển thị toast error với nội dung "Email hoặc mật khẩu chưa chính xác", enable lại nút Đăng nhập.

4. **Given** API login trả về lỗi 429 (ACCOUNT_LOCKED), **When** Frontend nhận được response, **Then** hiển thị toast warning, enable lại nút Đăng nhập.

5. **Given** API login trả về thành công, **When** Frontend nhận được response, **Then** hiển thị toast success với nội dung "Đăng nhập thành công", sau đó điều hướng người dùng theo `role_name` dùng `roleRouteMap`.

---

### Edge Cases

- **Token hết hạn khi user đang sử dụng hệ thống**: WHEN token hết hạn trong lúc người dùng đang thao tác, THE system SHALL trả về HTTP 401 và Frontend SHALL redirect về trang login với thông báo "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."

- **Session hết hạn**: WHERE session trong `user_sessions` có `expiresAt < NOW()`, THE system SHALL tự động xóa session khỏi database, clear cookie `token`, và trả về HTTP 401 với message "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại." và error code "SESSION_INVALID".

- **Email chứa ký tự đặc biệt hoặc khoảng trắng**: THE system SHALL trim và normalize email trước khi xử lý để tránh mismatch. Zod schema dùng `.toLowerCase().trim()`.

- **Concurrent login attempts**: WHERE người dùng login đồng thời từ nhiều tab, THE system SHALL chỉ giữ session cuối cùng hợp lệ và SHALL invalidate các session trước đó.

- **Password policy enforcement**: THE system SHALL chỉ kiểm tra password match khi đăng nhập, password strength validation là trách nhiệm của chức năng Register (out of scope).

- **Brute-force từ nhiều IP khác nhau**: Account lockout chỉ dựa vào email, không dựa vào IP. Infrastructure-level rate limiting (per IP) là out of scope cho UC03.

---

## Requirements

### Functional Requirements

- **FR-001**: WHEN người dùng gửi yêu cầu đăng nhập, THE system SHALL validate email phải đúng định dạng, max 255 ký tự, lowercase, trim, và cả email và password không được rỗng.

- **FR-002**: WHEN người dùng gửi thông tin đăng nhập, THE system SHALL kiểm tra email có tồn tại trong database hay không.

- **FR-003**: WHERE email tồn tại, THE system SHALL so sánh password đầu vào với password hash trong database bằng thuật toán bcrypt (12 salt rounds, hardcoded).

- **FR-004**: WHERE password match, THE system SHALL kiểm tra trạng thái `isActive` của tài khoản.

- **FR-005**: WHERE tài khoản có `isActive: false`, THE system SHALL trả về HTTP 403 với message "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên." và error code "ACCOUNT_DISABLED".

- **FR-005b**: WHERE tài khoản có `isActive: true` nhưng `emailVerified: false`, THE system SHALL trả về HTTP 403 với message "Email chưa được xác thực. Vui lòng kiểm tra hộp thư để xác thực tài khoản." và error code "EMAIL_NOT_VERIFIED".

- **FR-006**: WHERE tài khoản hợp lệ (isActive: true và emailVerified: true) và password đúng, THE system SHALL tạo JWT token chứa payload `{user_id, email, role_id, role_name, jti}` với thời gian sống 7 ngày (hardcoded '7d').

- **FR-007**: WHEN tạo JWT token mới, THE system SHALL sinh unique `jti` (composite: `${userId}-${timestamp}-${random}`) và lưu vào `user_sessions` với TTL 7 ngày.

- **FR-008**: WHEN người dùng đăng nhập lại, THE system SHALL ghi đè `jti` cũ bằng `jti` mới qua Prisma `upsert` để thực thi Single Active Session policy.

- **FR-009**: WHEN đăng nhập thành công, THE system SHALL lưu JWT token vào HttpOnly Cookie với `httpOnly: true`, `secure: true` khi `NODE_ENV === 'production'`, `sameSite: 'lax'`, và `maxAge: 7 days` (604800000 ms). Cookie name hardcoded là 'token'.

- **FR-010**: WHEN đăng nhập thành công, THE system SHALL trả về HTTP 200 với response format `{success: true, message: "Đăng nhập thành công", data: {user}}` trong đó user bao gồm `id`, `email`, `full_name`, `role_id`, `role_name`, `avatar_url`, `phone`, `created_at`.

- **FR-011**: WHERE email không tồn tại hoặc password sai, THE system SHALL trả về HTTP 401 với response `{success: false, message: "Email hoặc mật khẩu chưa chính xác", code: "UNAUTHORIZED"}` mà không tiết lộ thông tin về sự tồn tại của email.

- **FR-012**: WHEN người dùng nhập sai password, THE system SHALL tăng counter số lần nhập sai cho email đó trong `login_attempts` table.

- **FR-013**: WHERE counter số lần nhập sai đạt 5 lần, THE system SHALL khóa tài khoản trong 15 phút và trả về HTTP 429 với response `{success: false, message: "Tài khoản tạm thời bị khóa...", code: "ACCOUNT_LOCKED", details: {locked_until}}`.

- **FR-014**: WHERE tài khoản đang bị khóa, THE system SHALL từ chối đăng nhập ngay cả khi password đúng cho đến khi hết thời gian khóa.

- **FR-015**: WHEN người dùng đăng nhập thành công, THE system SHALL reset counter số lần nhập sai về 0 bằng cách DELETE record trong `login_attempts`.

- **FR-016**: WHEN xử lý đăng nhập, THE system MUST NOT log plaintext password, password hash, JWT token, hoặc cookie value ra console hoặc file log. THE system SHALL sử dụng Pino logger (không dùng console.log) và chỉ log userId, email cho mục đích audit.

- **FR-017**: WHEN Frontend gọi API login, THE system SHALL gửi request với `withCredentials: true` để tự động gửi cookie trong mọi request. Axios client có response interceptor xử lý 401→redirect /login, 403→redirect /403-unauthorized, 500→log.

- **FR-018**: WHEN người dùng click nút Đăng nhập, THE system SHALL disable nút và hiển thị loading state qua `isSubmitting` useState để chống double-submit.

- **FR-019**: WHEN API trả về kết quả, THE system SHALL hiển thị thông báo success/error/warning cho người dùng qua react-toastify. WHEN thành công, Frontend SHALL điều hướng theo `role_name` dùng `roleRouteMap` constants. WHEN lỗi 429 (ACCOUNT_LOCKED), hiển thị toast.warning. WHEN các lỗi khác, hiển thị toast.error.

### Key Entities

- **User**: Đại diện cho người dùng trong hệ thống. Thuộc tính nghiệp vụ: id, email, passwordHash (bcrypt 12 rounds), fullName, phone, avatarUrl, roleId, isActive (soft delete), emailVerified, createdAt, updatedAt.

- **Role**: Đại diện cho vai trò/phân quyền trong hệ thống (VOLUNTEER, STAFF, MANAGER, ADMIN).

- **UserSession**: Đại diện cho phiên đăng nhập active của một người dùng. Mỗi user chỉ có một session active tại một thời điểm (UNIQUE constraint trên userId). Session có thời gian sống 7 ngày. Store jti và expiresAt.

- **LoginAttempt**: Đếm số lần nhập sai password cho một email cụ thể. Tự động reset khi đăng nhập thành công (DELETE record). Track bằng email, không có FK constraint.

- **Account Lock**: Đánh dấu trạng thái tạm khóa của một tài khoản (`lockedUntil` timestamp). Tự động mở khóa sau 15 phút.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Người dùng với thông tin đăng nhập đúng có thể đăng nhập thành công trong vòng 2 giây ở môi trường có kết nối internet ổn định.

- **SC-002**: Hệ thống có thể xử lý 100 concurrent login requests mà không bị crash hoặc trả về lỗi 500.

- **SC-003**: 100% các trường hợp nhập sai email hoặc password đều trả về cùng một message lỗi chung "Email hoặc mật khẩu chưa chính xác", không tiết lộ thông tin về sự tồn tại của email.

- **SC-004**: Sau khi nhập sai password 5 lần liên tiếp, tài khoản bị khóa trong đúng 15 phút và tự động unlock sau thời gian này.

- **SC-005**: Khi user đăng nhập lại trên thiết bị mới, token cũ trên thiết bị cũ ngay lập tức bị invalidate và không thể sử dụng được nữa.

- **SC-006**: Không có password, password hash, JWT token, hoặc cookie value nào bị ghi vào log file trong cả trường hợp thành công và thất bại.

- **SC-007**: Frontend không gửi duplicate request khi user click nút Đăng nhập nhiều lần trong thời gian chờ response.

- **SC-008**: 90% user đăng nhập thành công được điều hướng đúng trang tương ứng với role của họ (Volunteer → Home, Admin → Dashboard, etc.).

---

## Assumptions

- **A-001**: Database đã có bảng User với các thuộc tính email, passwordHash, role, và trạng thái isActive, và password đã được mã hóa bằng bcrypt từ chức năng Register trước đó.

- **A-002**: Hệ thống sử dụng MySQL `user_sessions` table để lưu session data (không dùng Redis). Session được quản lý qua Prisma ORM với `upsert` pattern để ghi đè jti cũ.

- **A-003**: Frontend đã cấu hình HTTP client để gửi credentials (cookies) tự động trong mọi request đến Backend. Axios client có `withCredentials: true`.

- **A-004**: Môi trường production có HTTPS enabled để secure cookie hoạt động đúng. `secure` flag dựa trên `NODE_ENV === 'production'`.

- **A-005**: Bảng Role đã có dữ liệu với các role chuẩn: VOLUNTEER, STAFF, MANAGER, ADMIN.

- **A-006**: Chức năng Register (đăng ký tài khoản) đã được implement và có validate password strength, do đó Login chỉ cần verify password match mà không cần validate strength.

- **A-007**: Environment variables: `SECRET_KEY` cho JWT signing. Các giá trị khác (expiresIn '7d', cookie name 'token', bcrypt 12 rounds) được hardcode trong code.

- **A-008**: Mobile app support là out of scope cho version 1. Chỉ support web browser.

- **A-009**: Multi-factor authentication (MFA/2FA) là out of scope cho UC03. Có thể là feature tương lai.

- **A-010**: Rate limiting ở infrastructure level (WAF, Nginx, CloudFlare) là out of scope. UC03 chỉ implement account-level lockout.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC03 và KHÔNG được implement:

- Multi-factor authentication (2FA/OTP)
- Social login (Google, Facebook OAuth)
- Password reset / Forgot password (sẽ là UC riêng)
- Remember me checkbox (token đã có TTL 7 ngày)
- CAPTCHA verification
- IP-based rate limiting
- Device fingerprinting
- Session management dashboard cho user
- Audit log cho login history
- Email notification khi login từ thiết bị mới
- Mobile app support
- Refresh token mechanism
- Auto-logout sau idle time
- Password strength validation khi đăng nhập (chỉ check match)
- Infrastructure-level rate limiting (per IP)

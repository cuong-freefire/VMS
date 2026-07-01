# Feature Specification: Authentication Register (UC04)

**Feature Branch**: `feat/auth-register`

**Created**: 2026-06-25

**Status**: APPROVED

**Input**: User description: "Hệ thống VMS cần một luồng đăng ký tài khoản mới an toàn và tinh gọn với xác thực email qua OTP. Frontend sử dụng Multi-step form (2 trang): Trang 1 nhập thông tin cá nhân → Trang 2 nhập OTP để xác thực và hoàn tất đăng ký."

## User Scenarios & Testing

### User Story 1 - Gửi OTP để xác thực email (Priority: P1)

Là một Guest chưa có tài khoản, tôi muốn nhập thông tin cá nhân (Họ tên, Email, Số điện thoại, Mật khẩu) và nhận mã OTP qua email để xác thực quyền sở hữu email của mình trước khi tạo tài khoản.

**Why this priority**: Đây là bước đầu tiên bắt buộc trong luồng đăng ký. Không có OTP, người dùng không thể hoàn tất đăng ký. Xác thực email ngăn chặn tài khoản spam và đảm bảo liên lạc được với người dùng.

**Independent Test**: Có thể test độc lập bằng cách gọi API gửi OTP với email hợp lệ, kiểm tra hệ thống trả về success và email chứa mã OTP 6 số được gửi đến hộp thư.

**Acceptance Scenarios**:

1. **Given** Guest chưa có tài khoản và điền email hợp lệ chưa tồn tại vào form Bước 1, **When** Guest click nút "Tiếp theo", **Then** hệ thống sinh mã OTP 6 chữ số, lưu `email` và `otp_hash` vào bảng `email_verifications`, gửi email chứa mã OTP, và trả về HTTP 200 với message "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư." Frontend giữ thông tin cá nhân (Full Name, Phone, Password) ở client state.

2. **Given** Guest vừa nhận được OTP, **When** Guest mở email, **Then** email chứa mã OTP 6 chữ số, thời gian hiệu lực (10 phút), và hướng dẫn nhập mã vào Bước 2.

3. **Given** Guest đã submit form Bước 1 thành công, **When** Frontend chuyển sang Bước 2, **Then** hiển thị form nhập OTP với countdown timer 10 phút và nút "Gửi lại OTP".

---

### User Story 2 - Xác thực OTP và tạo tài khoản thành công (Priority: P1)

Là một Guest đã nhận được mã OTP, tôi muốn nhập mã OTP vào form Bước 2 để xác thực email và hoàn tất việc tạo tài khoản với vai trò Volunteer.

**Why this priority**: Đây là bước cuối cùng để hoàn tất đăng ký. Không có bước này, người dùng không thể tạo tài khoản và sử dụng hệ thống.

**Independent Test**: Có thể test độc lập bằng cách gọi API verify OTP với mã đúng và thông tin đầy đủ, kiểm tra hệ thống tạo user mới trong bảng `users` với `role_id` = Volunteer và trả về success.

**Acceptance Scenarios**:

1. **Given** Guest có mã OTP hợp lệ (chưa hết hạn 10 phút) trong bảng `email_verifications`, **When** Guest nhập đúng mã OTP cùng toàn bộ thông tin (email, otp, full_name, phone, password) vào form Bước 2 và submit, **Then** hệ thống xác thực OTP thành công, tạo tài khoản mới trong bảng `users` với vai trò Volunteer, set `is_active: true`, xóa record trong `email_verifications`, và trả về HTTP 201 với message "Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ."

2. **Given** tài khoản vừa được tạo thành công, **When** Frontend nhận response, **Then** hiển thị toast success, redirect về trang Login với message "Đăng ký thành công. Vui lòng đăng nhập."

3. **Given** Guest vừa đăng ký thành công, **When** Guest đăng nhập với email và password đã đăng ký, **Then** hệ thống cho phép đăng nhập và điều hướng đến trang Home dành cho Volunteer.

---

### User Story 3 - Chặn email đã tồn tại (Priority: P1)

Là hệ thống, tôi cần chặn việc đăng ký trùng email để đảm bảo mỗi email chỉ có một tài khoản duy nhất.

**Why this priority**: Đây là yêu cầu bảo mật và toàn vẹn dữ liệu bắt buộc. Email là định danh duy nhất của người dùng trong hệ thống.

**Independent Test**: Có thể test độc lập bằng cách tạo một user với email "<existing@vms.com>", sau đó thử gọi API gửi OTP với cùng email này và verify hệ thống trả về lỗi 409.

**Acceptance Scenarios**:

1. **Given** tài khoản với email "<existing@vms.com>" đã tồn tại trong bảng `users`, **When** Guest thử đăng ký với email "<existing@vms.com>" ở Bước 1, **Then** hệ thống trả về HTTP 409 với message "Email đã được sử dụng. Vui lòng sử dụng email khác hoặc đăng nhập."

2. **Given** email đã tồn tại, **When** Frontend nhận lỗi 409, **Then** hiển thị error message dưới field Email và không chuyển sang Bước 2.

---

### User Story 4 - OTP Cooldown để chống spam email (Priority: P1)

Là Admin của hệ thống, tôi muốn áp dụng cooldown 60 giây giữa các lần gửi OTP cho cùng một email để bảo vệ dịch vụ gửi mail khỏi bị lạm dụng.

**Why this priority**: Đây là yêu cầu bảo mật quan trọng để ngăn chặn spam mail và bảo vệ infrastructure.

**Independent Test**: Có thể test độc lập bằng cách gọi API gửi OTP 2 lần liên tiếp trong vòng 60 giây và verify lần thứ 2 bị reject với HTTP 429.

**Acceptance Scenarios**:

1. **Given** Guest vừa gửi yêu cầu OTP thành công lúc 10:00:00, **When** Guest click "Gửi lại OTP" lúc 10:00:30 (chưa đủ 60s), **Then** hệ thống trả về HTTP 429 với message "Vui lòng đợi X giây trước khi gửi lại OTP" (X = số giây còn lại).

2. **Given** Guest đã gửi OTP lúc 10:00:00, **When** Guest click "Gửi lại OTP" lúc 10:01:05 (đã qua 60s), **Then** hệ thống sinh mã OTP mới, cập nhật `otp_hash` và `last_sent_at` trong `email_verifications`, gửi email mới, và trả về HTTP 200.

3. **Given** Guest đang ở Bước 2, **When** countdown timer còn > 0 giây, **Then** nút "Gửi lại OTP" bị disable và hiển thị text "Gửi lại sau X giây".

---

### User Story 5 - OTP Lockout sau 5 lần nhập sai (Priority: P1)

Là Admin của hệ thống, tôi muốn khóa email trong 15 phút nếu nhập sai OTP quá 5 lần để chống tấn công brute-force dò mã.

**Why this priority**: Đây là yêu cầu bảo mật quan trọng để bảo vệ hệ thống khỏi tấn công dò mã OTP tự động.

**Independent Test**: Có thể test độc lập bằng cách gọi API verify OTP với mã sai 5 lần liên tiếp, sau đó verify hệ thống trả về HTTP 429 ngay cả khi gửi mã đúng.

**Acceptance Scenarios**:

1. **Given** Guest có OTP hợp lệ trong `email_verifications`, **When** Guest nhập sai OTP 5 lần liên tiếp, **Then** hệ thống khóa email trong 15 phút và trả về HTTP 429 với message "Bạn đã nhập sai mã OTP quá nhiều lần. Email này đã bị khóa trong 15 phút."

2. **Given** email đang bị khóa (locked_until chưa hết), **When** Guest thử nhập OTP (dù đúng hay sai), **Then** hệ thống trả về HTTP 429 với message "Email đã bị khóa. Vui lòng thử lại sau X phút."

3. **Given** email đang bị khóa (locked_until chưa hết), **When** Guest thử gửi lại OTP mới, **Then** hệ thống trả về HTTP 429 và không gửi email.

4. **Given** email bị khóa lúc 10:00, **When** Guest thử verify OTP lúc 10:16 (đã qua 15 phút), **Then** hệ thống reset trạng thái khóa và cho phép verify OTP bình thường.

---

### User Story 6 - Chặn OTP hết hạn (Priority: P1)

Là hệ thống, tôi cần từ chối mã OTP đã hết hạn (quá 10 phút kể từ lúc gửi) để đảm bảo tính bảo mật.

**Why this priority**: Đây là yêu cầu bảo mật bắt buộc. OTP có thời gian sống giới hạn để giảm thiểu rủi ro bị đánh cắp.

**Independent Test**: Có thể test độc lập bằng cách tạo record OTP với `created_at` cách đây > 10 phút, sau đó gọi API verify và kiểm tra hệ thống trả về lỗi 400.

**Acceptance Scenarios**:

1. **Given** OTP được tạo lúc 10:00 (TTL 10 phút), **When** Guest nhập OTP đúng lúc 10:11 (đã qua 10 phút), **Then** hệ thống trả về HTTP 400 với message "Mã OTP đã hết hạn. Vui lòng gửi lại OTP mới."

2. **Given** OTP hết hạn, **When** Frontend nhận lỗi 400, **Then** hiển thị error message và enable nút "Gửi lại OTP".

---

### User Story 7 - Validate mật khẩu mạnh (Priority: P1)

Là hệ thống, tôi cần đảm bảo mật khẩu đủ mạnh (tối thiểu 8 ký tự, có chữ hoa, chữ thường, số) để bảo vệ tài khoản người dùng.

**Why this priority**: Đây là yêu cầu bảo mật bắt buộc để ngăn chặn tài khoản bị tấn công dễ dàng.

**Independent Test**: Có thể test độc lập bằng cách gọi API với mật khẩu yếu ("123456") và verify hệ thống trả về lỗi validation.

**Acceptance Scenarios**:

1. **Given** Guest điền password "abc123" (thiếu chữ hoa) ở Bước 2, **When** Guest submit form, **Then** hệ thống trả về HTTP 400 với message "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số."

2. **Given** Guest điền password "Abc12345" và confirm password "Abc12346" (không khớp) ở Frontend, **When** Guest submit form, **Then** Frontend hiển thị validation error "Mật khẩu xác nhận không khớp" và không gửi request.

3. **Given** Guest điền password hợp lệ "Abc12345", **When** Guest submit form ở Bước 2, **Then** hệ thống chấp nhận và tạo tài khoản thành công.

---

### User Story 8 - Frontend: Quay lại Bước 1 sửa thông tin (Priority: P2)

Là Guest đang ở Bước 2 (đã nhận OTP), tôi muốn quay lại Bước 1 để sửa thông tin (Name, Phone, Password) nhưng giữ nguyên Email và vẫn dùng được OTP đang còn hạn.

**Why this priority**: Đây là yêu cầu UX quan trọng để tránh bắt người dùng đợi cooldown 60s khi chỉ muốn sửa thông tin không phải Email.

**Independent Test**: Có thể test độc lập bằng cách gửi OTP cho email "<user@vms.com>", quay lại Bước 1 sửa Name/Phone/Password ở client state, sau đó verify OTP cũ vẫn hoạt động với thông tin mới.

**Acceptance Scenarios**:

1. **Given** Guest đã nhận OTP cho email "<user@vms.com>" và đang ở Bước 2, **When** Guest click "Quay lại" để sửa Full Name từ "Nguyễn Văn A" thành "Nguyễn Văn B" nhưng GIỮ NGUYÊN email "<user@vms.com>", **Then** Frontend cập nhật state của Name ở client-side, KHÔNG gọi API, KHÔNG cập nhật database.

2. **Given** Guest vừa sửa Name/Phone/Password ở Bước 1, **When** Guest click "Tiếp theo" và chuyển sang Bước 2, **Then** Frontend chuyển trang với state đã cập nhật, Guest dùng OTP cũ để submit cùng thông tin mới.

3. **Given** Guest ở Bước 2 với OTP cũ vẫn còn hạn, **When** Guest nhập OTP cũ cùng thông tin MỚI (Name, Phone, Password đã sửa) và submit, **Then** hệ thống tạo tài khoản với thông tin MỚI và email cũ.

---

### User Story 9 - Frontend: Quay lại Bước 1 đổi Email (Priority: P2)

Là Guest đang ở Bước 2, tôi muốn quay lại Bước 1 để thay đổi Email thành email khác hoàn toàn mới.

**Why this priority**: Đây là yêu cầu UX quan trọng khi người dùng nhận ra đã nhập sai email.

**Independent Test**: Có thể test độc lập bằng cách gửi OTP cho "<old@vms.com>", quay lại đổi thành "<new@vms.com>", và verify hệ thống xử lý như một request OTP hoàn toàn mới.

**Acceptance Scenarios**:

1. **Given** Guest đã nhận OTP cho email "<old@vms.com>" và đang ở Bước 2, **When** Guest click "Quay lại" và đổi email thành "<new@vms.com>", **Then** Frontend clear OTP state, coi như một luồng đăng ký mới.

2. **Given** Guest vừa đổi email từ "<old@vms.com>" sang "<new@vms.com>", **When** Guest click "Tiếp theo", **Then** hệ thống xử lý như một request OTP hoàn toàn mới: sinh OTP mới, tạo record mới trong `email_verifications` cho "<new@vms.com>", gửi email mới, áp dụng cooldown độc lập.

---

### User Story 10 - Frontend UX: Loading state và validation (Priority: P2)

Là Guest, tôi muốn thấy trạng thái loading khi submit form, validation errors rõ ràng, và toast notifications cho mọi thao tác.

**Why this priority**: Đây là yêu cầu UX quan trọng nhưng không blocking cho core functionality.

**Independent Test**: Có thể test độc lập bằng cách mở Frontend, click submit với field rỗng và verify hiển thị validation errors.

**Acceptance Scenarios**:

1. **Given** Guest để trống Email ở Bước 1, **When** Guest click "Tiếp theo", **Then** hiển thị validation error "Email là bắt buộc" dưới field Email, không gửi request.

2. **Given** Guest click "Tiếp theo" ở Bước 1, **When** request đang xử lý, **Then** nút "Tiếp theo" bị disable, hiển thị loading spinner, text đổi thành "Đang gửi...".

3. **Given** API trả về lỗi 409 (email đã tồn tại), **When** Frontend nhận response, **Then** hiển thị toast error với message từ API, enable lại nút.

4. **Given** Guest nhập đúng OTP ở Bước 2, **When** API trả về success, **Then** hiển thị toast success "Đăng ký thành công", redirect về trang Login sau 2 giây.

---

### Edge Cases

- **WHERE Guest đóng browser ở Bước 2 và quay lại sau 5 phút**: WHERE Guest mở lại browser và quay lại form đăng ký, THE system SHALL cho phép Guest tiếp tục từ Bước 2 nếu OTP còn hạn (Frontend có cơ chế giữ state giữa các phiên), hoặc yêu cầu bắt đầu lại từ Bước 1 nếu OTP đã hết hạn.

- **WHERE dịch vụ gửi email (SMTP) không khả dụng**: WHERE SMTP service down, THE system SHALL trả về HTTP 503 với message "Dịch vụ gửi email tạm thời không khả dụng. Vui lòng thử lại sau" và SHALL log critical error, không crash server.

- **WHERE Guest nhập email có chữ hoa hoặc khoảng trắng**: THE system SHALL chuẩn hóa email về lowercase và loại bỏ khoảng trắng trước khi xử lý để tránh trùng lặp.

- **WHERE Guest submit form với Phone Number không hợp lệ**: THE system SHALL kiểm tra phone number theo format Việt Nam (10-11 chữ số, bắt đầu bằng 0) và trả về HTTP 400 nếu không hợp lệ.

- **WHERE OTP đang pending nhưng Guest đăng ký lại với cùng email**: THE system SHALL ghi đè record cũ trong `email_verifications` bằng OTP mới (nếu đã qua cooldown 60s).

---

## Requirements

### Functional Requirements

- **FR-001**: WHEN Guest gửi form đăng ký Bước 1, THE system SHALL validate tất cả các field: Email (required, valid format, unique trong bảng users).

- **FR-002**: WHERE Email đã tồn tại trong bảng `users`, THE system SHALL trả về HTTP 409 với message "Email đã được sử dụng. Vui lòng sử dụng email khác hoặc đăng nhập."

- **FR-003**: WHERE email đang trong trạng thái bị khóa (locked_until chưa hết hạn), THE system SHALL từ chối gửi OTP mới và trả về HTTP 429 với message "Email đang bị khóa. Vui lòng thử lại sau X phút."

- **FR-004**: WHERE tất cả validation pass và email không bị khóa, THE system SHALL kiểm tra cooldown: nếu email này đã gửi OTP trong vòng 60 giây trước, trả về HTTP 429.

- **FR-005**: WHERE cooldown pass và email không bị khóa, THE system SHALL sinh mã OTP ngẫu nhiên 6 chữ số, lưu hoặc cập nhật record trong bảng `email_verifications` với các field: email, type = 'REGISTER', otp_hash, created_at, last_sent_at, attempts = 0, is_locked = false, locked_until = null.

- **FR-006**: WHEN lưu OTP thành công, THE system SHALL gửi email chứa mã OTP 6 số, subject "Mã xác thực đăng ký VMS", body chứa OTP và thông báo "Mã có hiệu lực trong 10 phút".

- **FR-007**: WHERE email gửi thành công, THE system SHALL trả về HTTP 200 với message "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư."

- **FR-008**: WHEN Guest submit OTP ở Bước 2, THE system SHALL nhận toàn bộ payload bao gồm: email, otp, full_name, phone, password.

- **FR-009**: WHERE email không tồn tại trong `email_verifications`, THE system SHALL trả về HTTP 400 với message "Không tìm thấy yêu cầu xác thực. Vui lòng bắt đầu lại từ Bước 1."

- **FR-010**: WHERE record có trạng thái khóa chưa hết hạn, THE system SHALL từ chối xác thực và trả về HTTP 429 với message "Email đã bị khóa. Vui lòng thử lại sau X phút."

- **FR-011**: WHERE record có thời gian tạo cách đây > 10 phút, THE system SHALL trả về HTTP 400 với message "Mã OTP đã hết hạn. Vui lòng gửi lại OTP mới."

- **FR-012**: WHERE OTP không hợp lệ, THE system SHALL tăng số lần thử sai, và trả về HTTP 400 với message "Mã OTP không đúng. Bạn còn X lần thử."

- **FR-013**: WHERE số lần thử sai đạt 5, THE system SHALL khóa email trong 15 phút và trả về HTTP 429 với message "Bạn đã nhập sai mã OTP quá nhiều lần. Email này đã bị khóa trong 15 phút."

- **FR-014**: WHERE OTP hợp lệ và record hợp lệ, THE system SHALL tạo user mới trong bảng `users` với thông tin từ payload (full_name, email, phone), mã hóa password, gán role_id tương ứng với vai trò Volunteer, set is_active = true, set email_verified = true.

- **FR-015**: WHEN user được tạo thành công, THE system SHALL xóa record tương ứng trong bảng `email_verifications` và trả về HTTP 201 với message "Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ."

- **FR-016**: THE system SHALL validate Full Name (required, max 255 chars), Phone Number (required, 10-11 digits, bắt đầu bằng 0), Password (required, min 8 chars, có chữ hoa, chữ thường, số) khi nhận payload ở Bước 2.

- **FR-017**: THE system MUST NOT lưu plaintext OTP vào database. Chỉ lưu hash của OTP.

- **FR-018**: THE system MUST NOT log plaintext OTP, plaintext password, password hash, hoặc email content.

- **FR-019**: WHERE SMTP service không khả dụng, THE system SHALL catch error, log critical error, và trả về HTTP 503 với message "Dịch vụ gửi email tạm thời không khả dụng. Vui lòng thử lại sau."

- **FR-020**: WHEN xử lý email, THE system SHALL chuẩn hóa email (trim whitespace và convert sang lowercase) trước khi lưu hoặc query database.

### Key Entities

- **User (users table)**: Đại diện cho tài khoản người dùng trong hệ thống. Thuộc tính nghiệp vụ: định danh duy nhất, họ tên đầy đủ, email (unique), số điện thoại, mật khẩu đã mã hóa, vai trò (role_id), trạng thái kích hoạt, trạng thái xác thực email, thời gian tạo.

- **Role**: Đại diện cho vai trò/phân quyền. Tài khoản mới đăng ký được gán vai trò "Volunteer" mặc định.

- **Email Verification (email_verifications table)**: Đại diện cho yêu cầu xác thực email đang pending. Lưu trữ tạm thời email, OTP hash, thời gian tạo, thời gian gửi cuối, số lần nhập sai, trạng thái khóa. Record bị xóa sau khi xác thực thành công hoặc hết hạn.

- **OTP (One Time Password)**: Mã xác thực 6 chữ số ngẫu nhiên, có thời gian sống 10 phút, được hash trước khi lưu. Chỉ được gửi lại sau cooldown 60 giây. Tối đa 5 lần nhập sai trước khi bị khóa.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Guest có thể hoàn tất đăng ký trong vòng 5 phút (bao gồm thời gian nhận email) ở môi trường có kết nối internet ổn định.

- **SC-002**: Hệ thống có thể xử lý 50 concurrent registration requests mà không bị crash hoặc trả về lỗi 500.

- **SC-003**: 100% email trùng lặp đều bị chặn và trả về HTTP 409, không cho phép tạo tài khoản trùng.

- **SC-004**: Sau khi gửi OTP, người dùng phải đợi đúng 60 giây trước khi có thể gửi lại. Cooldown timer hiển thị chính xác trên Frontend.

- **SC-005**: Sau khi nhập sai OTP 5 lần, email bị khóa đúng 15 phút và tự động unlock sau thời gian này.

- **SC-006**: Không có plaintext OTP, plaintext password, password hash, hoặc email content nào bị ghi vào log file.

- **SC-007**: 90% Guest nhận được email chứa OTP trong vòng 30 giây sau khi click "Tiếp theo" ở Bước 1 (phụ thuộc SMTP service).

- **SC-008**: Guest có thể quay lại Bước 1 sửa Name/Phone/Password ở client-side mà không cần gọi API hay đợi cooldown.

- **SC-009**: Guest đổi email ở Bước 1 được xử lý như một luồng đăng ký mới hoàn toàn độc lập, không bị ảnh hưởng bởi OTP cũ.

---

## Assumptions

- **A-001**: Database đã có bảng `users` với các cột full_name, email (unique), phone, password_hash, role_id, is_active, email_verified, created_at.

- **A-002**: Database đã có bảng `roles` với dữ liệu seed chứa role "Volunteer".

- **A-003**: Database đã có bảng `email_verifications` với các cột: id (PK), email, type, otp_hash, created_at, last_sent_at, attempts, is_locked, locked_until.

- **A-004**: SMTP service đã được cấu hình với các biến môi trường cần thiết trong file `.env`.

- **A-005**: Frontend có cơ chế giữ trạng thái dữ liệu form giữa các bước (Bước 1 và Bước 2).

- **A-006**: Password được mã hóa trước khi lưu vào database.

- **A-007**: OTP được hash trước khi lưu vào `email_verifications`. Plaintext OTP chỉ tồn tại trong email gửi đi.

- **A-008**: Frontend có cơ chế gửi request an toàn đến Backend API.

- **A-009**: Chức năng Login (UC03) đã được implement. Sau khi đăng ký thành công, người dùng redirect về trang Login để đăng nhập.

- **A-010**: Email verification chỉ dùng cho luồng đăng ký. Chức năng "Forgot Password" sẽ là UC riêng.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC04 và KHÔNG được implement:

- **Lưu tạm vào Redis**: Tất cả dữ liệu OTP đều lưu vào Database (`email_verifications` table), không sử dụng Redis cho UC04.

- **Social Login (Google OAuth)**: Đăng ký bằng tài khoản Google/Facebook không nằm trong UC04.

- **Email verification link**: UC04 chỉ sử dụng OTP code, không sử dụng magic link.

- **SMS OTP**: Chỉ gửi OTP qua email, không gửi qua SMS.

- **Thu thập thông tin profile chi tiết**: Không thu thập thông tin về kỹ năng, kinh nghiệm, sở thích, avatar lúc đăng ký.

- **Email welcome**: Không gửi email chào mừng sau khi đăng ký thành công.

- **Terms & Conditions checkbox**: Không yêu cầu đồng ý điều khoản lúc đăng ký trong phiên bản này.

- **CAPTCHA verification**: Không sử dụng CAPTCHA. Chỉ dùng cooldown và lockout.

- **IP-based rate limiting**: Rate limiting chỉ theo email, không theo IP address.

- **Email template với HTML/CSS phức tạp**: Email OTP có thể là plain text hoặc HTML đơn giản.

- **Forgot Password / Password Reset**: Là UC riêng, không nằm trong UC04.

- **Admin approval cho tài khoản mới**: Tài khoản được tạo với `is_active: true` ngay lập tức.

- **Multi-language**: Email và message chỉ hỗ trợ tiếng Việt trong UC04.

- **Resend OTP unlimited**: Resend OTP bị giới hạn bởi cooldown 60s và lockout sau 5 lần sai.

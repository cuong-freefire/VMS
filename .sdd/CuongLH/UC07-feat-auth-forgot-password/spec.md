# Feature Specification: Quên Mật Khẩu (Forgot Password)

**Feature Branch**: `feat/UC07-forgot-password`

**Created**: 2026-06-25

**Status**: APPROVED

**Input**: User description: "UC07 - Forgot Password"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Khôi phục mật khẩu thành công (Priority: P1)

Người dùng quên mật khẩu và muốn đặt lại mật khẩu để có thể đăng nhập lại vào hệ thống. Người dùng truy cập trang Quên mật khẩu, nhập email đã đăng ký, nhận mã OTP qua email, nhập mã OTP để xác thực, và cuối cùng nhập mật khẩu mới để hoàn tất quá trình khôi phục.

**Why this priority**: Đây là luồng chính và quan trọng nhất của tính năng, cho phép người dùng lấy lại quyền truy cập vào tài khoản của mình một cách an toàn. Nếu không có tính năng này, người dùng quên mật khẩu sẽ bị khóa vĩnh viễn khỏi tài khoản.

**Independent Test**: Có thể được test độc lập bằng cách tạo một tài khoản test, yêu cầu khôi phục mật khẩu, nhập OTP đúng, và đặt mật khẩu mới. Sau đó đăng nhập bằng mật khẩu mới để xác nhận tính năng hoạt động đúng.

**Acceptance Scenarios**:

1. **Given** người dùng có tài khoản với email đã xác thực trong hệ thống, **When** người dùng nhập email hợp lệ tại Trang 1 và submit, **Then** hệ thống tạo mã OTP và gửi email chứa mã OTP, đồng thời hiển thị thông báo thành công chung chung và chuyển sang Trang 2
2. **Given** người dùng đã nhận được mã OTP hợp lệ (chưa hết hạn, chưa bị khóa), **When** người dùng nhập đúng mã OTP tại Trang 2 và submit, **Then** hệ thống xác thực thành công và chuyển sang Trang 3
3. **Given** người dùng đã xác thực OTP thành công, **When** người dùng nhập mật khẩu mới hợp lệ (đáp ứng yêu cầu độ mạnh) tại Trang 3 và submit, **Then** hệ thống mã hóa và cập nhật mật khẩu mới, xóa bản ghi OTP, hiển thị thông báo thành công và chuyển hướng đến trang đăng nhập

---

### User Story 2 - Xử lý trường hợp nhập sai OTP (Priority: P2)

Người dùng nhập sai mã OTP do lỗi gõ phím hoặc nhầm lẫn. Hệ thống cần đếm số lần nhập sai và khóa tạm thời nếu vượt quá ngưỡng cho phép để bảo vệ tài khoản khỏi tấn công brute-force.

**Why this priority**: Tính năng bảo mật quan trọng để ngăn chặn kẻ tấn công dò mã OTP. Tuy nhiên, ít xảy ra hơn so với luồng thành công nên được ưu tiên P2.

**Independent Test**: Có thể test độc lập bằng cách yêu cầu OTP, cố tình nhập sai mã OTP 5 lần liên tiếp, và xác nhận hệ thống khóa email trong 15 phút. Kiểm tra rằng mọi request tiếp theo trong thời gian khóa đều bị từ chối.

**Acceptance Scenarios**:

1. **Given** người dùng đang ở Trang 2 với mã OTP hợp lệ, **When** người dùng nhập sai mã OTP lần thứ nhất, **Then** hệ thống tăng bộ đếm attempts lên 1, hiển thị thông báo lỗi "Mã OTP không đúng" và cho phép thử lại
2. **Given** người dùng đã nhập sai mã OTP 4 lần, **When** người dùng nhập sai lần thứ 5, **Then** hệ thống đánh dấu bản ghi OTP là locked với thời gian khóa 15 phút và hiển thị thông báo "Bạn đã nhập sai quá 5 lần. Vui lòng thử lại sau 15 phút"
3. **Given** email đang bị khóa do nhập sai OTP quá 5 lần, **When** người dùng cố gắng yêu cầu OTP mới hoặc xác thực OTP trong thời gian khóa, **Then** hệ thống kiểm tra trạng thái locked_until TRƯỚC và từ chối request với thông báo còn bao nhiêu thời gian khóa

---

### User Story 3 - Yêu cầu gửi lại mã OTP mới (Priority: P2)

Người dùng không nhận được email chứa mã OTP (do lỗi spam filter, delay, hoặc nhập nhầm email) hoặc mã OTP đã hết hạn (quá 10 phút). Người dùng muốn yêu cầu hệ thống gửi lại mã OTP mới.

**Why this priority**: Tính năng cải thiện trải nghiệm người dùng khi gặp vấn đề với email hoặc OTP hết hạn. Quan trọng nhưng không phải luồng chính nên được ưu tiên P2.

**Independent Test**: Có thể test độc lập bằng cách yêu cầu OTP lần đầu, đợi ít nhất 60 giây (cooldown), sau đó yêu cầu gửi lại OTP mới. Xác nhận rằng mã OTP cũ không còn hiệu lực và chỉ mã mới mới được chấp nhận.

**Acceptance Scenarios**:

1. **Given** người dùng đã yêu cầu OTP lần đầu và đã chờ đủ 60 giây, **When** người dùng click "Gửi lại mã OTP" tại Trang 2, **Then** hệ thống tạo mã OTP mới (làm vô hiệu mã cũ), reset bộ đếm attempts về 0, cập nhật thời gian gửi mới nhất, và gửi email chứa mã mới
2. **Given** người dùng vừa yêu cầu OTP (chưa đủ 60 giây), **When** người dùng click "Gửi lại mã OTP", **Then** hệ thống từ chối với thông báo "Vui lòng đợi X giây nữa trước khi gửi lại"
3. **Given** mã OTP đã hết hạn (quá 10 phút từ lúc tạo), **When** người dùng cố nhập mã OTP hết hạn, **Then** hệ thống từ chối với thông báo "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới"

---

### User Story 4 - Chống dò quét tài khoản (Priority: P1)

Kẻ tấn công cố gắng dò quét email nào tồn tại trong hệ thống bằng cách thử nhiều địa chỉ email khác nhau tại trang Quên mật khẩu. Hệ thống cần che giấu thông tin về sự tồn tại của tài khoản.

**Why this priority**: Tính năng bảo mật quan trọng nhằm bảo vệ quyền riêng tư người dùng và ngăn chặn thu thập thông tin tài khoản. Được ưu tiên P1 vì liên quan đến bảo mật và phải được triển khai cùng với luồng chính.

**Independent Test**: Có thể test độc lập bằng cách thử yêu cầu khôi phục mật khẩu với email tồn tại và email không tồn tại. Xác nhận rằng cả hai trường hợp đều nhận được thông báo giống hệt nhau và không có cách nào phân biệt được.

**Acceptance Scenarios**:

1. **Given** người dùng nhập email KHÔNG tồn tại trong hệ thống tại Trang 1, **When** người dùng submit, **Then** hệ thống KHÔNG tạo mã OTP, KHÔNG gửi email, nhưng VẪN trả về thông báo thành công chung chung giống hệt trường hợp email tồn tại: "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi. Vui lòng kiểm tra hộp thư"
2. **Given** người dùng nhập email tồn tại trong hệ thống tại Trang 1, **When** người dùng submit, **Then** hệ thống tạo OTP và gửi email, đồng thời trả về cùng thông báo thành công chung chung như trường hợp email không tồn tại
3. **Given** kẻ tấn công thử nhiều email khác nhau, **When** kẻ tấn công so sánh response time hoặc thông báo, **Then** kẻ tấn công KHÔNG thể phân biệt được email nào tồn tại hay không tồn tại dựa trên response

---

### Edge Cases

- **OTP hết hạn trong khi người dùng đang nhập**: Người dùng nhận OTP và bắt đầu nhập tại Trang 2, nhưng mất quá nhiều thời gian (hơn 10 phút từ lúc tạo OTP) rồi mới submit. Hệ thống phải từ chối và yêu cầu người dùng gửi lại OTP mới.
- **Người dùng yêu cầu nhiều OTP liên tiếp**: Người dùng spam nút "Gửi lại OTP" nhiều lần. Cơ chế cooldown 60 giây phải ngăn chặn điều này, chỉ cho phép tạo OTP mới sau mỗi 60 giây.
- **Locked state bypass attempt**: Sau khi bị khóa 15 phút do nhập sai 5 lần, kẻ tấn công cố gắng yêu cầu OTP mới ngay lập tức để reset trạng thái locked. Hệ thống PHẢI kiểm tra locked_until TRƯỚC KHI kiểm tra cooldown để chặn đứng request này.
- **Email không tồn tại nhưng spam OTP request**: Kẻ tấn công spam request với email không tồn tại. Hệ thống không tạo OTP thật nhưng vẫn phải áp dụng rate limiting để tránh lãng phí tài nguyên.
- **Mật khẩu mới giống mật khẩu cũ**: Người dùng đặt lại mật khẩu mới trùng với mật khẩu cũ. Hệ thống CHẤP NHẬN điều này (không validate) vì yêu cầu đã được ghi rõ trong Out of Scope.
- **Nhiều request khôi phục đồng thời từ cùng một email**: Người dùng hoặc kẻ tấn công gửi nhiều request khôi phục mật khẩu đồng thời. Hệ thống phải xử lý race condition, chỉ giữ OTP mới nhất và làm vô hiệu các OTP cũ.

## Requirements *(mandatory)*

### Functional Requirements

#### FR-001: Yêu cầu khôi phục mật khẩu

**WHEN** người dùng submit email hợp lệ tại Trang 1, **THE system SHALL** tạo mã OTP gồm 6 chữ số ngẫu nhiên với thời gian sống (TTL) là 10 phút, hash và lưu vào bảng `email_verifications` với `type = 'RESET_PASSWORD'`, và gửi mã OTP (plaintext) đến địa chỉ email đó qua dịch vụ email.

#### FR-002: Chống dò quét tài khoản

**WHEN** người dùng submit email tại Trang 1, **THE system SHALL** luôn trả về thông báo thành công chung chung ("Nếu email tồn tại trong hệ thống, mã OTP đã được gửi. Vui lòng kiểm tra hộp thư") bất kể email có tồn tại trong hệ thống hay không.

#### FR-003: Không tạo OTP cho email không tồn tại

**WHEN** email được submit KHÔNG tồn tại trong hệ thống, **THE system SHALL NOT** tạo bản ghi OTP và SHALL NOT gửi email, nhưng vẫn trả về thông báo thành công chung chung như FR-002.

#### FR-004: Xác thực OTP

**WHEN** người dùng submit mã OTP tại Trang 2, **THE system SHALL** kiểm tra mã OTP có khớp với `otp_hash` trong bảng `email_verifications`, chưa hết hạn (trong vòng 10 phút từ `created_at`), không bị khóa (`is_locked = false`), và thuộc `type = 'RESET_PASSWORD'`.

#### FR-005: Đếm số lần nhập sai OTP

**WHEN** người dùng nhập sai mã OTP, **THE system SHALL** tăng bộ đếm attempts lên 1 và hiển thị thông báo lỗi cụ thể.

#### FR-006: Khóa sau khi nhập sai quá nhiều lần

**WHEN** người dùng nhập sai mã OTP lần thứ 5 liên tiếp, **THE system SHALL** đánh dấu bản ghi OTP với is_locked = true và locked_until = hiện tại + 15 phút, đồng thời hiển thị thông báo thời gian khóa còn lại.

#### FR-007: Kiểm tra trạng thái khóa trước cooldown

**WHEN** hệ thống nhận request tạo OTP mới hoặc xác thực OTP, **THE system SHALL** kiểm tra trường locked_until TRƯỚC KHI kiểm tra cooldown, và từ chối request nếu thời gian hiện tại nhỏ hơn locked_until.

#### FR-008: Cooldown giữa các lần gửi OTP

**WHEN** người dùng yêu cầu gửi lại OTP mới, **THE system SHALL** kiểm tra thời gian gửi OTP gần nhất và chỉ cho phép tạo OTP mới nếu đã trải qua ít nhất 60 giây từ lần gửi trước đó.

#### FR-009: Làm vô hiệu OTP cũ khi tạo OTP mới

**WHEN** hệ thống tạo mã OTP mới cho cùng một email và type = 'RESET_PASSWORD', **THE system SHALL** xóa hoặc vô hiệu hóa tất cả các bản ghi OTP cũ của email đó với cùng type, chỉ giữ lại OTP mới nhất.

#### FR-010: Reset bộ đếm attempts khi gửi OTP mới

**WHEN** hệ thống tạo mã OTP mới thành công, **THE system SHALL** reset bộ đếm attempts về 0 và reset trạng thái is_locked = false.

#### FR-011: Cập nhật mật khẩu mới

**WHEN** người dùng submit mật khẩu mới hợp lệ tại Trang 3 cùng với mã OTP đã xác thực, **THE system SHALL** mã hóa mật khẩu mới bằng thuật toán mã hóa một chiều, cập nhật vào tài khoản người dùng tương ứng với email trong bản ghi OTP.

#### FR-012: Xóa OTP sau khi đổi mật khẩu thành công

**WHEN** mật khẩu mới được cập nhật thành công, **THE system SHALL** hard DELETE bản ghi `email_verifications` tương ứng (`email`, `type = 'RESET_PASSWORD'`).

#### FR-013: Validate mật khẩu mới

**WHEN** người dùng submit mật khẩu mới tại Trang 3, **THE system SHALL** validate mật khẩu mới đáp ứng các yêu cầu độ mạnh (tối thiểu 8 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt).

#### FR-014: Không validate mật khẩu mới trùng mật khẩu cũ

**WHEN** người dùng submit mật khẩu mới, **THE system SHALL NOT** kiểm tra xem mật khẩu mới có trùng với mật khẩu cũ hay không (cho phép người dùng đặt lại mật khẩu cũ).

#### FR-015: Quản lý state giữa các trang ở frontend

**WHEN** người dùng điều hướng giữa 3 trang (Trang 1, 2, 3), **THE frontend SHALL** tự quản lý state (email, OTP status) để duy trì luồng multi-step mà không cần backend lưu trữ session state phức tạp.

#### FR-016: Không tự động đăng nhập sau khi đổi mật khẩu

**WHEN** người dùng đổi mật khẩu thành công, **THE system SHALL** hiển thị thông báo thành công và chuyển hướng đến trang đăng nhập, nhưng SHALL NOT tự động đăng nhập người dùng vào hệ thống.

#### FR-017: Ghi audit log cho luồng khôi phục mật khẩu

**WHEN** hệ thống xử lý các bước forgot password, **THE system SHALL** ghi audit log (Pino) cho các sự kiện: OTP sent, OTP verified, password reset success, và lockout triggered. **THE system SHALL NOT** ghi OTP plaintext, mật khẩu plaintext, `password_hash`, hoặc `otp_hash` vào log.

### Key Entities *(Business Level Only)*

- **Email Verification Record (`email_verifications`)**: Đại diện cho mã xác thực OTP được tạo cho khôi phục mật khẩu. Bao gồm: email, `otp_hash` (bcrypt), `type = 'RESET_PASSWORD'`, `created_at` (TTL 10 phút), `last_sent_at` (cooldown 60s), `attempts`, `is_locked`, `locked_until`. Dùng chung bảng với luồng Register (1-Table Design, phân biệt bằng `type`).

- **User Account**: Tài khoản người dùng trong hệ thống, bao gồm email (định danh duy nhất) và mật khẩu đã được mã hóa một chiều. Mật khẩu sẽ được cập nhật sau khi người dùng hoàn tất luồng khôi phục mật khẩu thành công.

## Non-functional Requirements

### Performance

- **NFR-001**: API tạo và gửi OTP qua email phải phản hồi trong vòng 2 giây kể từ khi nhận request hợp lệ
- **NFR-002**: API xác thực OTP phải phản hồi trong vòng 500ms
- **NFR-003**: API cập nhật mật khẩu mới phải hoàn thành trong vòng 1 giây

### Security

- **NFR-004**: Mã OTP phải được tạo ngẫu nhiên với entropy đủ cao để chống brute-force (6 chữ số = 1.000.000 tổ hợp)
- **NFR-005**: Mật khẩu mới phải được mã hóa một chiều với thuật toán mạnh và không thể giải mã ngược
- **NFR-006**: Hệ thống phải che giấu hoàn toàn thông tin về sự tồn tại của tài khoản để chống dò quét (zero user enumeration)
- **NFR-007**: Response time giữa email tồn tại và không tồn tại phải tương đương nhau để tránh timing attack

### Usability

- **NFR-008**: Thông báo lỗi phải rõ ràng, cụ thể và hướng dẫn người dùng cách khắc phục (ví dụ: "Vui lòng đợi 45 giây nữa trước khi gửi lại" thay vì "Cooldown active")
- **NFR-009**: Giao diện 3 trang phải có chỉ dẫn rõ ràng về bước hiện tại và bước tiếp theo
- **NFR-010**: Email chứa OTP phải có định dạng dễ đọc, rõ ràng về mục đích và thời gian hết hạn

### Reliability

- **NFR-011**: Hệ thống phải xử lý gracefully khi dịch vụ gửi email bên thứ ba không khả dụng, không crash toàn bộ API
- **NFR-012**: Race condition khi nhiều request đồng thời phải được xử lý đúng, chỉ giữ OTP mới nhất

## Error Handling

### Email Service Failures

**WHERE** dịch vụ gửi email bên thứ ba không khả dụng hoặc trả về lỗi, **THE system SHALL** ghi log lỗi chi tiết, nhưng vẫn trả về thông báo thành công chung chung cho người dùng để tránh lộ thông tin hệ thống.

### Database Failures

**WHERE** database không khả dụng hoặc trả về lỗi khi lưu/đọc bản ghi OTP, **THE system SHALL** trả về thông báo lỗi chung chung "Hệ thống đang bảo trì. Vui lòng thử lại sau" và ghi log chi tiết để admin kiểm tra.

### Invalid Input

**WHERE** người dùng nhập dữ liệu không hợp lệ (email sai định dạng, mật khẩu không đủ mạnh), **THE system SHALL** validate ngay ở frontend và hiển thị thông báo lỗi cụ thể về yêu cầu cần đáp ứng.

### OTP Expired

**WHERE** người dùng nhập OTP đã hết hạn (quá 10 phút), **THE system SHALL** từ chối với thông báo "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới" và cung cấp nút "Gửi lại mã OTP".

### Locked State

**WHERE** email đang bị khóa do nhập sai OTP quá 5 lần, **THE system SHALL** từ chối mọi request (tạo OTP mới, xác thực OTP) và hiển thị thông báo thời gian khóa còn lại cụ thể (ví dụ: "Tài khoản bị khóa. Vui lòng thử lại sau 12 phút 30 giây").

### Concurrent Requests

**WHERE** hệ thống nhận nhiều request tạo OTP đồng thời từ cùng một email, **THE system SHALL** sử dụng transaction hoặc locking mechanism để đảm bảo chỉ có một OTP mới nhất được lưu và các OTP cũ bị vô hiệu hóa.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người dùng có thể hoàn tất toàn bộ luồng khôi phục mật khẩu (từ nhập email đến đổi mật khẩu thành công) trong vòng 3 phút với điều kiện nhận được email ngay lập tức
- **SC-002**: Hệ thống xử lý được ít nhất 100 request khôi phục mật khẩu đồng thời mà không có lỗi hoặc timeout
- **SC-003**: Tỷ lệ gửi email OTP thành công đạt ít nhất 99% khi dịch vụ email bên thứ ba hoạt động bình thường
- **SC-004**: Không có cách nào phân biệt được email tồn tại hay không tồn tại thông qua response message hoặc timing (timing difference < 100ms)
- **SC-005**: Kẻ tấn công không thể dò được mã OTP trong thời gian hiệu lực (10 phút) do cơ chế lockout sau 5 lần thử sai
- **SC-006**: 95% người dùng hoàn tất luồng khôi phục mật khẩu thành công ở lần thử đầu tiên (không bị lỗi hệ thống)

## Assumptions

- Người dùng có quyền truy cập vào email đã đăng ký và có thể đọc email trong vòng 10 phút
- Dịch vụ gửi email bên thứ ba (SMTP/Nodemailer) đã được cấu hình đúng và hoạt động ổn định với uptime ít nhất 99%
- Người dùng đã có tài khoản trong hệ thống (`users.email` tồn tại); không yêu cầu `email_verified = true` để reset mật khẩu
- Frontend được xây dựng bằng React và có khả năng quản lý state giữa các trang mà không cần reload
- Bảng `email_verifications` đã tồn tại (UC04) với cột `type` và đang được dùng chung cho Register và Reset Password
- Múi giờ server và client không ảnh hưởng đến tính toán thời gian hết hạn OTP và lockout (server time là chuẩn)

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của feature này và KHÔNG được implement:

- **Kiểm tra mật khẩu mới phải khác mật khẩu cũ**: Để tối ưu performance, backend không so sánh mật khẩu mới với mật khẩu cũ. Người dùng được phép đặt lại mật khẩu trùng với mật khẩu hiện tại.
- **Sử dụng Redis cho OTP storage**: Hệ thống sử dụng MySQL database cho việc lưu trữ OTP thay vì Redis. Quyết định này nhằm đơn giản hóa kiến trúc và giảm dependency.
- **Khôi phục mật khẩu qua SMS/Số điện thoại**: Tính năng này chỉ hỗ trợ khôi phục qua email. Khôi phục qua SMS sẽ được xem xét trong các phiên bản sau.
- **Tự động đăng nhập sau khi đổi mật khẩu thành công**: Sau khi đổi mật khẩu, người dùng phải tự đăng nhập lại bằng mật khẩu mới. Hệ thống không tự động tạo session cho người dùng vì lý do bảo mật.
- **Gửi thông báo email khi mật khẩu được thay đổi**: Tính năng gửi email thông báo "Mật khẩu của bạn vừa được thay đổi" sẽ được cân nhắc trong v2.
- **Lịch sử thay đổi mật khẩu**: Hệ thống không lưu lịch sử các lần thay đổi mật khẩu của người dùng.
- **Multi-factor Authentication (MFA) trong quá trình khôi phục**: Luồng khôi phục này không yêu cầu thêm bước MFA ngoài OTP qua email.
- **Khôi phục tài khoản bị vô hiệu hóa hoặc xóa**: Tính năng này chỉ áp dụng cho tài khoản đang hoạt động (active). Tài khoản đã bị vô hiệu hóa hoặc xóa không thể khôi phục mật khẩu.

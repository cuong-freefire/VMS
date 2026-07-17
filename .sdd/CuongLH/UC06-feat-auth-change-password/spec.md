# Feature Specification: Thay đổi mật khẩu (Change Password)

**Feature Branch**: `feat/UC06-change-password`

**Created**: 2026-06-25

**Status**: APPROVED

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Thay đổi mật khẩu thành công (Priority: P1)

Người dùng đã đăng nhập vào hệ thống muốn chủ động thay đổi mật khẩu của mình để tăng cường bảo mật tài khoản. Người dùng cung cấp mật khẩu cũ hiện tại, nhập mật khẩu mới đáp ứng chính sách bảo mật, và xác nhận lại mật khẩu mới. Hệ thống xác minh thông tin và cập nhật mật khẩu mới thành công.

**Why this priority**: Đây là luồng chính (happy path) của tính năng, cung cấp giá trị nghiệp vụ cốt lõi cho người dùng muốn tự quản lý bảo mật tài khoản của mình. Không có user story này thì tính năng không thể hoạt động.

**Independent Test**: Có thể được kiểm thử độc lập bằng cách gọi API thay đổi mật khẩu với JWT token hợp lệ, mật khẩu cũ đúng, và mật khẩu mới đáp ứng policy. Sau đó xác minh rằng người dùng có thể đăng nhập lại bằng mật khẩu mới.

**Acceptance Scenarios**:

1. **Given** người dùng đã đăng nhập và có JWT token hợp lệ, **When** người dùng gửi request với mật khẩu cũ chính xác, mật khẩu mới đáp ứng policy bảo mật, và trường xác nhận khớp với mật khẩu mới, **Then** hệ thống mã hóa và lưu mật khẩu mới vào cơ sở dữ liệu, trả về HTTP 200 với thông báo thành công, và giữ nguyên phiên đăng nhập hiện tại.

2. **Given** người dùng vừa thay đổi mật khẩu thành công, **When** người dùng tiếp tục sử dụng hệ thống với phiên hiện tại, **Then** hệ thống vẫn chấp nhận JWT token hiện tại mà không ép người dùng đăng nhập lại.

---

### User Story 2 - Xử lý mật khẩu cũ không chính xác (Priority: P2)

Người dùng cố gắng thay đổi mật khẩu nhưng nhập sai mật khẩu cũ. Hệ thống từ chối yêu cầu và thông báo lỗi rõ ràng để người dùng biết nguyên nhân và thử lại.

**Why this priority**: Đây là kịch bản lỗi phổ biến nhất trong thực tế. Xử lý đúng kịch bản này ngăn chặn việc thay đổi mật khẩu trái phép và bảo vệ tài khoản khỏi tấn công.

**Independent Test**: Có thể được kiểm thử độc lập bằng cách gọi API với mật khẩu cũ sai và xác minh hệ thống trả về HTTP 400/401 với thông báo lỗi phù hợp mà không thay đổi mật khẩu trong database.

**Acceptance Scenarios**:

1. **Given** người dùng đã đăng nhập, **When** người dùng gửi request với mật khẩu cũ không chính xác, **Then** hệ thống từ chối yêu cầu, trả về HTTP 400 hoặc 401 với thông báo "Mật khẩu cũ không chính xác", và không thay đổi mật khẩu trong cơ sở dữ liệu.

2. **Given** người dùng nhập sai mật khẩu cũ nhiều lần, **When** request được gửi đến server, **Then** hệ thống vẫn xử lý từng request độc lập mà không khóa tài khoản (rate limiting nằm ngoài scope tính năng này).

---

### User Story 3 - Xử lý mật khẩu mới không đáp ứng policy bảo mật (Priority: P2)

Người dùng nhập mật khẩu mới quá yếu (không đủ độ dài, thiếu ký tự đặc biệt, không có chữ hoa/thường, v.v.). Hệ thống từ chối và hướng dẫn người dùng tạo mật khẩu đủ mạnh.

**Why this priority**: Chính sách mật khẩu mạnh là yêu cầu bảo mật cốt lõi. Kịch bản này đảm bảo hệ thống không chấp nhận mật khẩu yếu, bảo vệ người dùng khỏi các cuộc tấn công brute-force.

**Independent Test**: Có thể được kiểm thử độc lập bằng cách gọi API với các mật khẩu yếu khác nhau (quá ngắn, không có chữ hoa, không có số, v.v.) và xác minh hệ thống trả về HTTP 400 với thông báo lỗi validation cụ thể.

**Acceptance Scenarios**:

1. **Given** người dùng đã đăng nhập và mật khẩu cũ chính xác, **When** người dùng gửi request với mật khẩu mới không đáp ứng policy (ví dụ: quá ngắn hoặc thiếu ký tự đặc biệt), **Then** hệ thống từ chối yêu cầu, trả về HTTP 400 với thông báo validation chi tiết về các yêu cầu policy chưa đáp ứng.

2. **Given** người dùng nhập mật khẩu mới không chứa chữ hoa, **When** validation được thực hiện, **Then** hệ thống trả về thông báo rõ ràng "Mật khẩu mới phải chứa ít nhất một chữ cái viết hoa".

---

### User Story 4 - Xử lý mật khẩu mới và xác nhận không khớp (Priority: P3)

Người dùng nhập mật khẩu mới nhưng gõ sai khi xác nhận lại, khiến hai trường không khớp nhau. Hệ thống phát hiện và yêu cầu người dùng nhập lại.

**Why this priority**: Đây là lỗi nhập liệu phổ biến do người dùng gõ nhầm. Mặc dù có thể được kiểm tra ở frontend, backend vẫn cần validate để đảm bảo tính toàn vẹn dữ liệu.

**Independent Test**: Có thể được kiểm thử độc lập bằng cách gọi API với `newPassword` và `confirmPassword` khác nhau, sau đó xác minh hệ thống trả về HTTP 400 với thông báo lỗi phù hợp.

**Acceptance Scenarios**:

1. **Given** người dùng đã đăng nhập, **When** người dùng gửi request với `newPassword` và `confirmPassword` không khớp nhau, **Then** hệ thống từ chối yêu cầu và trả về HTTP 400 với thông báo "Mật khẩu mới và xác nhận mật khẩu không khớp".

---

### User Story 5 - Xử lý request không có JWT token hợp lệ (Priority: P1)

Người dùng chưa đăng nhập hoặc JWT token đã hết hạn cố gắng gọi API thay đổi mật khẩu. Hệ thống từ chối truy cập để bảo vệ tài khoản khỏi tấn công IDOR.

**Why this priority**: Đây là rào cản bảo mật quan trọng nhất. Nếu thiếu validation này, hệ thống có thể bị tấn công IDOR (Insecure Direct Object Reference), cho phép kẻ tấn công thay đổi mật khẩu của người dùng khác.

**Independent Test**: Có thể được kiểm thử độc lập bằng cách gọi API không kèm JWT token hoặc với token đã hết hạn, sau đó xác minh hệ thống trả về HTTP 401 Unauthorized và không xử lý request.

**Acceptance Scenarios**:

1. **Given** người dùng chưa đăng nhập (không có JWT token), **When** người dùng cố gắng gọi API thay đổi mật khẩu, **Then** hệ thống từ chối truy cập và trả về HTTP 401 với thông báo "Unauthorized - Token không hợp lệ hoặc đã hết hạn".

2. **Given** JWT token đã hết hạn, **When** request được gửi đến server, **Then** Auth Middleware từ chối request trước khi đến Controller và trả về HTTP 401.

---

### Edge Cases

- **Người dùng nhập mật khẩu mới giống hệt mật khẩu cũ**: Hệ thống có từ chối hay chấp nhận? *(Chấp nhận - đây là lựa chọn hợp lệ của người dùng, không phải lỗi bảo mật)*

- **Người dùng thay đổi mật khẩu đồng thời từ hai thiết bị khác nhau**: Race condition có thể xảy ra không? *(Cơ chế database transaction đảm bảo chỉ một request được xử lý thành công)*

- **Mật khẩu chứa ký tự Unicode hoặc Emoji**: Hệ thống xử lý như thế nào? *(Cho phép - validation chỉ kiểm tra độ dài và các ký tự trong bộ quy tắc policy)*

- **Request payload thiếu một trong ba trường bắt buộc**: Hệ thống trả về lỗi validation rõ ràng chỉ ra trường nào bị thiếu.

---

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & Authorization (Xác thực & Phân quyền)**

- **FR-001**: WHERE request không chứa JWT token hợp lệ trong httpOnly cookie, THE system SHALL từ chối truy cập và trả về HTTP 401 Unauthorized.

- **FR-002**: WHEN nhận được request thay đổi mật khẩu, THE system SHALL lấy định danh người dùng (`user_id`) trực tiếp từ JWT token đã được xác thực bởi Auth Middleware.

- **FR-003**: THE system SHALL NOT nhận `user_id` từ request body, query parameters, hoặc bất kỳ nguồn đầu vào nào khác do client cung cấp để ngăn chặn tấn công IDOR.

**Input Validation (Kiểm tra đầu vào)**

- **FR-004**: THE system SHALL yêu cầu request body chứa đầy đủ ba trường bắt buộc: `oldPassword`, `newPassword`, và `confirmPassword`.

- **FR-005**: WHEN nhận được request, THE system SHALL kiểm tra `newPassword` và `confirmPassword` phải khớp nhau hoàn toàn (case-sensitive).

- **FR-006**: THE system SHALL kiểm tra độ mạnh của `newPassword` theo chính sách bảo mật (password policy), bao gồm:
  - Độ dài tối thiểu (theo cấu hình hệ thống)
  - Ít nhất một chữ cái viết hoa
  - Ít nhất một chữ cái viết thường
  - Ít nhất một chữ số
  - Ít nhất một ký tự đặc biệt

- **FR-007**: WHERE `newPassword` không đáp ứng password policy, THE system SHALL từ chối request và trả về HTTP 400 với thông báo validation chi tiết về các yêu cầu chưa đáp ứng.

- **FR-008**: WHERE `newPassword` và `confirmPassword` không khớp, THE system SHALL từ chối request và trả về HTTP 400 với thông báo "Mật khẩu mới và xác nhận mật khẩu không khớp".

**Password Verification (Xác minh mật khẩu)**

- **FR-009**: WHEN validation đầu vào thành công, THE system SHALL truy xuất mật khẩu hiện tại đang lưu trong cơ sở dữ liệu cho tài khoản của người dùng.

- **FR-010**: THE system SHALL so sánh `oldPassword` do người dùng cung cấp với mật khẩu đã được mã hóa trong database bằng thuật toán so sánh an toàn.

- **FR-011**: WHERE `oldPassword` không khớp với mật khẩu hiện tại trong database, THE system SHALL từ chối request và trả về HTTP 400 hoặc 401 với thông báo "Mật khẩu cũ không chính xác".

**Password Update (Cập nhật mật khẩu)**

- **FR-012**: WHEN tất cả validation thành công và `oldPassword` chính xác, THE system SHALL mã hóa một chiều `newPassword` trước khi lưu vào cơ sở dữ liệu.

- **FR-013**: THE system SHALL cập nhật mật khẩu mới đã được mã hóa vào bản ghi tài khoản của người dùng trong database.

- **FR-014**: WHEN cập nhật mật khẩu thành công, THE system SHALL trả về HTTP 200 với thông báo "Mật khẩu đã được thay đổi thành công".

- **FR-015**: THE system SHALL giữ nguyên phiên đăng nhập hiện tại (JWT token hiện tại vẫn hợp lệ) và KHÔNG bắt buộc người dùng đăng nhập lại sau khi thay đổi mật khẩu.

**Error Handling (Xử lý lỗi)**

- **FR-016**: WHERE xảy ra lỗi database hoặc lỗi hệ thống trong quá trình xử lý, THE system SHALL rollback mọi thay đổi và trả về HTTP 500 với thông báo lỗi chung mà không tiết lộ chi tiết kỹ thuật.

- **FR-017**: THE system SHALL NOT ghi log (log) mật khẩu dạng plaintext (`oldPassword`, `newPassword`, `confirmPassword`) hoặc mật khẩu đã được mã hóa vào file log hoặc console.

- **FR-018**: WHERE tài khoản là tài khoản đăng nhập qua Social Login và không có mật khẩu local, THE system SHALL từ chối request và trả về HTTP 400 với thông báo "Tài khoản đăng nhập qua mạng xã hội không thể thay đổi mật khẩu bằng chức năng này".

---

### Non-functional Requirements

**Performance (Hiệu năng)**

- **NFR-001**: THE system SHALL xử lý và phản hồi request thay đổi mật khẩu trong vòng 500ms (tính từ khi nhận request đến khi trả về response) ở điều kiện tải bình thường.

- **NFR-002**: THE system SHALL duy trì response time dưới 2 giây ngay cả khi xử lý 100 concurrent requests thay đổi mật khẩu đồng thời.

**Security (Bảo mật)**

- **NFR-003**: THE system SHALL sử dụng thuật toán mã hóa mật khẩu an toàn với cost factor đủ cao để chống lại tấn công brute-force, đồng thời đảm bảo không làm tăng response time vượt quá ngưỡng cho phép.

- **NFR-004**: THE system SHALL thực hiện so sánh mật khẩu bằng thuật toán constant-time để tránh timing attack.

- **NFR-005**: WHERE hệ thống phát hiện nhiều request thay đổi mật khẩu thất bại liên tiếp từ cùng một tài khoản, THE system SHOULD ghi log cảnh báo để phát hiện dấu hiệu tấn công. *(Lưu ý: Rate limiting thực tế nằm ngoài scope UC06, nhưng logging là cần thiết cho monitoring)*

- **NFR-006**: THE system SHALL đảm bảo JWT token được truyền tải qua httpOnly cookie với các flag bảo mật phù hợp (Secure, SameSite) theo cấu hình môi trường.

**Reliability & Data Integrity (Độ tin cậy & Toàn vẹn dữ liệu)**

- **NFR-007**: WHEN xảy ra lỗi trong quá trình cập nhật mật khẩu, THE system SHALL sử dụng **database transaction** để đảm bảo rollback hoàn toàn, không để lại trạng thái dữ liệu không nhất quán.

- **NFR-008**: THE system SHALL đảm bảo tính atomic của thao tác cập nhật mật khẩu - hoặc thành công hoàn toàn hoặc thất bại hoàn toàn, không có trạng thái trung gian.

- **NFR-009**: WHERE nhiều request thay đổi mật khẩu cho cùng một tài khoản đến đồng thời, THE system SHALL xử lý tuần tự hoặc sử dụng database locking để ngăn race condition.

**Usability (Khả năng sử dụng)**

- **NFR-010**: THE system SHALL trả về thông báo lỗi validation rõ ràng, cụ thể, và hướng dẫn người dùng cách khắc phục (ví dụ: liệt kê các yêu cầu password policy chưa đáp ứng).

- **NFR-011**: THE system SHALL trả về thông báo lỗi bằng ngôn ngữ phù hợp với ngữ cảnh người dùng (tiếng Việt cho hệ thống VMS).

**Auditability (Khả năng kiểm toán)**

- **NFR-012**: THE system SHALL ghi log audit cho mọi lần thay đổi mật khẩu thành công, bao gồm thông tin: user_id, thời gian thay đổi, địa chỉ IP, và kết quả thao tác (success/failure).

- **NFR-013**: THE system SHALL NOT ghi log bất kỳ thông tin nhạy cảm nào bao gồm: mật khẩu plaintext, mật khẩu đã mã hóa, JWT token, session ID, hoặc cookie values.

**Scalability (Khả năng mở rộng)**

- **NFR-014**: THE system SHALL thiết kế API endpoint theo cách stateless để có thể scale horizontally khi cần tăng capacity xử lý.

**Maintainability (Khả năng bảo trì)**

- **NFR-015**: THE system SHALL tuân thủ kiến trúc phân tầng rõ ràng (Controller → Service → Repository) để dễ dàng bảo trì và mở rộng trong tương lai.

---

### Key Entities *(Business Level Only)*

- **User (Người dùng)**: Thực thể đại diện cho tài khoản người dùng trong hệ thống. Có thuộc tính mật khẩu đã mã hóa, phương thức xác thực (local/social), và trạng thái tài khoản.

- **Password (Mật khẩu)**: Chuỗi ký tự bí mật được mã hóa một chiều, dùng để xác thực quyền sở hữu tài khoản. Phải tuân thủ chính sách bảo mật về độ phức tạp.

- **Authentication Session (Phiên xác thực)**: Phiên làm việc hợp lệ được đại diện bởi JWT token, cho phép người dùng thực hiện các thao tác yêu cầu xác thực như thay đổi mật khẩu.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người dùng có thể thay đổi mật khẩu thành công trong vòng 30 giây kể từ khi nhập đầy đủ thông tin hợp lệ.

- **SC-002**: Hệ thống từ chối 100% các request thay đổi mật khẩu không có JWT token hợp lệ hoặc có `oldPassword` không chính xác.

- **SC-003**: Hệ thống từ chối 100% các mật khẩu mới không đáp ứng password policy và trả về thông báo validation rõ ràng.

- **SC-004**: Sau khi thay đổi mật khẩu thành công, người dùng có thể đăng nhập lại bằng mật khẩu mới ngay lập tức với tỷ lệ thành công 100%.

- **SC-005**: Không có trường hợp nào mật khẩu dạng plaintext hoặc đã mã hóa bị ghi vào log file hoặc console trong suốt quá trình xử lý.

- **SC-006**: API xử lý thành công ít nhất 100 request đồng thời (concurrent requests) mà không xảy ra race condition hoặc data corruption.

---

## Assumptions

- **Giả định về người dùng**: Người dùng đã có tài khoản hợp lệ trong hệ thống và đã đăng nhập thành công trước khi truy cập chức năng thay đổi mật khẩu.

- **Giả định về phương thức xác thực**: Tính năng này chỉ áp dụng cho tài khoản đăng nhập bằng phương thức Local Authentication (email/password). Tài khoản đăng nhập qua Social Login (Google OAuth) không có mật khẩu local nên không thể sử dụng luồng này.

- **Giả định về password policy**: Hệ thống đã có sẵn cấu hình password policy rõ ràng (độ dài tối thiểu, yêu cầu ký tự) và được sử dụng nhất quán cho cả chức năng đăng ký và thay đổi mật khẩu.

- **Giả định về frontend validation**: Frontend có thể thực hiện validation phía client để cải thiện trải nghiệm người dùng, nhưng backend vẫn phải thực hiện đầy đủ validation độc lập để đảm bảo bảo mật.

- **Giả định về session management**: Sau khi thay đổi mật khẩu, phiên làm việc hiện tại (JWT token) vẫn hợp lệ và người dùng không cần đăng nhập lại. Hệ thống KHÔNG có cơ chế quản lý refresh token hoặc vô hiệu hóa token của các thiết bị khác.

- **Giả định về database transaction**: Database hỗ trợ transaction và có cơ chế rollback để đảm bảo tính toàn vẹn dữ liệu khi xảy ra lỗi trong quá trình cập nhật mật khẩu.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của feature này và KHÔNG được implement:

- **Quản lý và vô hiệu hóa Refresh Token**: Hệ thống hiện tại không sử dụng hoặc quản lý refresh token, do đó việc revoke (vô hiệu hóa) refresh token sau khi đổi mật khẩu nằm ngoài phạm vi. *(Lý do: Hệ thống chỉ sử dụng JWT access token trong httpOnly cookie)*

- **Đăng xuất tự động thiết bị hiện tại**: Sau khi đổi mật khẩu thành công, hệ thống KHÔNG tự động đăng xuất (force logout) thiết bị hiện tại. Phiên đăng nhập hiện tại được giữ nguyên để đảm bảo trải nghiệm người dùng mượt mà. *(Lý do: User Story đã được chốt - giữ nguyên phiên hiện tại)*

- **Đăng xuất các thiết bị khác**: Hệ thống KHÔNG tự động đăng xuất tất cả các thiết bị khác hoặc vô hiệu hóa các phiên đăng nhập trên thiết bị khác sau khi thay đổi mật khẩu. *(Lý do: Hệ thống không quản lý danh sách phiên đăng nhập theo thiết bị)*

- **Rate Limiting cho request thay đổi mật khẩu**: Không có cơ chế giới hạn số lần thử sai mật khẩu cũ hoặc rate limiting cho API endpoint này. *(Lý do: Sẽ được xử lý bởi infrastructure layer hoặc API Gateway, không thuộc phạm vi nghiệp vụ của feature này)*

- **Lịch sử thay đổi mật khẩu (Password History)**: Hệ thống KHÔNG lưu trữ lịch sử các mật khẩu cũ đã từng sử dụng và KHÔNG kiểm tra để ngăn người dùng tái sử dụng mật khẩu cũ. *(Lý do: Không có yêu cầu nghiệp vụ trong CONTEXT.md)*

- **Email thông báo thay đổi mật khẩu**: Hệ thống KHÔNG gửi email thông báo cho người dùng sau khi thay đổi mật khẩu thành công. *(Lý do: Chức năng gửi email thông báo có thể được bổ sung trong version sau nếu có yêu cầu)*

- **Khôi phục mật khẩu (Password Reset/Forgot Password)**: Luồng này chỉ áp dụng cho trường hợp người dùng đã đăng nhập và nhớ mật khẩu cũ. Trường hợp quên mật khẩu sẽ được xử lý bởi UC07 - Forgot Password. *(Lý do: Đây là use case riêng biệt với flow hoàn toàn khác)*

- **Thay đổi mật khẩu cho tài khoản Social Login**: Luồng này KHÔNG áp dụng cho các tài khoản đăng nhập qua Google OAuth hoặc các phương thức social login khác vì các tài khoản này không có mật khẩu local. *(Lý do: Social login accounts được quản lý bởi provider bên ngoài)*

- **Two-Factor Authentication (2FA)**: Không yêu cầu xác thực hai yếu tố (OTP, SMS) khi thay đổi mật khẩu. *(Lý do: 2FA không nằm trong scope hiện tại của hệ thống VMS)*

- **Tùy chỉnh Password Policy động**: Password policy (độ dài tối thiểu, yêu cầu ký tự) là cố định trong cấu hình hệ thống và không thể tùy chỉnh bởi Admin hoặc người dùng. *(Lý do: Không có yêu cầu nghiệp vụ cho tính năng này)*

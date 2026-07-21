# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.)

# Feature Specification: Email Services (Module 15)

**Feature Branch**: `MD15-email-service`

**Created**: 2026-06-26

**Status**: APPROVED

**Input**: User description: "Module 15 - Email Services (MD15-Email-service)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xác thực tài khoản qua email (UC62) (Priority: P1)

Là một người dùng mới đăng ký tài khoản, tôi muốn nhận được OTP xác thực tài khoản qua email để xác nhận địa chỉ email của tôi là hợp lệ và kích hoạt tài khoản.

**Why this priority**: Đây là yêu cầu bảo mật cơ bản và bắt buộc trong quy trình đăng ký tài khoản. Nếu không có xác thực email, hệ thống có nguy cơ bị lợi dụng bởi các tài khoản giả mạo hoặc spam. Đây là chức năng nền tảng cho toàn bộ hệ thống authentication.

**Independent Test**: Có thể kiểm thử hoàn toàn độc lập bằng cách đăng ký một tài khoản mới, kiểm tra hộp thư đến và xác nhận rằng thông điệp xác thực được gửi thành công với OTP xác thực hợp lệ. Tính năng này mang lại giá trị ngay lập tức cho quy trình đăng ký.

**Acceptance Scenarios**:

1. **Given** người dùng vừa hoàn tất đăng ký tài khoản mới, **When** hệ thống xử lý yêu cầu đăng ký, **Then** hệ thống tạo mã OTP và gửi thông điệp xác thực đến địa chỉ email đã đăng ký trong vòng 30 giây.
2. **Given** thông điệp xác thực đã được gửi, **When** người dùng mở email và nhập OTP vào form đăng ký, **Then** hệ thống kích hoạt tài khoản và cho phép người dùng đăng nhập.
3. **Given** mã OTP xác thực đã được tạo, **When** người dùng không nhập OTP xác thực trong vòng 10 phút, **Then** mã định danh hết hiệu lực và người dùng phải yêu cầu gửi lại OTP.

---

### User Story 2 - Khôi phục mật khẩu qua email (UC63) (Priority: P1)

Là một người dùng quên mật khẩu, tôi muốn nhận được thông điệp chứa mã OTP đặt lại mật khẩu qua email để tôi có thể khôi phục quyền truy cập vào tài khoản của mình một cách an toàn.

**Why this priority**: Đây là tính năng bảo mật quan trọng giúp người dùng khôi phục quyền truy cập tài khoản khi quên mật khẩu. Nếu không có chức năng này, người dùng sẽ mất quyền truy cập vĩnh viễn vào tài khoản, dẫn đến trải nghiệm người dùng tồi tệ và tăng khối lượng công việc hỗ trợ khách hàng.

**Independent Test**: Có thể kiểm thử độc lập bằng cách yêu cầu khôi phục mật khẩu cho một tài khoản, kiểm tra hộp thư đến và xác nhận rằng thông điệp chứa mã OTP đặt lại mật khẩu được gửi thành công với giới hạn thời gian sử dụng hợp lý. Tính năng này mang lại giá trị ngay lập tức cho quy trình authentication.

**Acceptance Scenarios**:

1. **Given** người dùng yêu cầu khôi phục mật khẩu, **When** hệ thống nhận được yêu cầu hợp lệ, **Then** hệ thống tạo mã OTP 6 chữ số có giới hạn thời gian 10 phút và gửi thông điệp chứa mã OTP đặt lại mật khẩu đến địa chỉ email đã đăng ký.
2. **Given** thông điệp khôi phục mật khẩu đã được gửi, **When** người dùng nhập mã OTP trong vòng 10 phút, **Then** hệ thống cho phép người dùng đặt mật khẩu mới và vô hiệu hóa mã OTP đã sử dụng.
3. **Given** mã OTP đặt lại mật khẩu đã được tạo, **When** người dùng không nhập mã OTP trong vòng 10 phút, **Then** mã OTP hết hiệu lực và người dùng phải yêu cầu khôi phục mật khẩu lại từ đầu.

---

### User Story 3 - Thông báo kết quả xét duyệt đăng ký sự kiện (UC64) (Priority: P2)

Là một tình nguyện viên đã đăng ký tham gia sự kiện, tôi muốn nhận được thông báo qua email khi đơn đăng ký của tôi được duyệt hoặc từ chối để tôi biết trạng thái tham gia và chuẩn bị cho sự kiện.

**Why this priority**: Đây là tính năng quan trọng giúp tình nguyện viên được thông báo kịp thời về trạng thái đăng ký sự kiện. Tuy nhiên, nó không quan trọng bằng authentication (P1) vì hệ thống vẫn có thể hoạt động mà không có thông báo tự động (Manager có thể thông báo thủ công). Tính năng này cải thiện trải nghiệm người dùng và giảm khối lượng công việc thủ công.

**Independent Test**: Có thể kiểm thử độc lập bằng cách thay đổi trạng thái đơn đăng ký sự kiện (Approved/Rejected) và xác nhận rằng thông điệp thông báo được gửi đến tình nguyện viên với nội dung phù hợp. Tính năng này mang lại giá trị ngay lập tức cho quy trình quản lý sự kiện.

**Acceptance Scenarios**:

1. **Given** Manager duyệt đơn đăng ký sự kiện của tình nguyện viên, **When** hệ thống cập nhật trạng thái đơn đăng ký thành "Approved", **Then** hệ thống gửi thông điệp thông báo duyệt đơn đến địa chỉ email của tình nguyện viên trong vòng 1 phút.
2. **Given** Manager từ chối đơn đăng ký sự kiện của tình nguyện viên, **When** hệ thống cập nhật trạng thái đơn đăng ký thành "Rejected", **Then** hệ thống gửi thông điệp thông báo từ chối đơn kèm lý do (nếu có) đến địa chỉ email của tình nguyện viên trong vòng 1 phút.
3. **Given** trạng thái đơn đăng ký thay đổi nhiều lần trong thời gian ngắn, **When** hệ thống xử lý các thay đổi liên tiếp, **Then** hệ thống chỉ gửi thông điệp thông báo cho trạng thái cuối cùng và không gửi trùng lặp.

---

### User Story 4 - Nhắc nhở sự kiện trước 24 giờ (UC65) (Priority: P2) **[NOT YET IMPLEMENTED]**

**[NOT YET IMPLEMENTED]** Là một tình nguyện viên đã được duyệt tham gia sự kiện, tôi muốn nhận được thông điệp nhắc nhở qua email trước 24 giờ khi sự kiện bắt đầu để tôi không quên lịch trình và chuẩn bị đầy đủ.

**Why this priority**: Đây là tính năng cải thiện trải nghiệm người dùng và giảm tỷ lệ vắng mặt (no-show) của tình nguyện viên. Tuy nhiên, nó không quan trọng bằng các chức năng xác thực và thông báo xét duyệt vì hệ thống vẫn có thể hoạt động mà không có thông báo nhắc nhở tự động.

**Independent Test**: Có thể kiểm thử độc lập bằng cách thiết lập một sự kiện có thời gian bắt đầu trong 24 giờ tới, chạy quy trình quét dữ liệu định kỳ và xác nhận rằng thông điệp nhắc nhở được gửi đến tất cả tình nguyện viên đã được duyệt. Tính năng này mang lại giá trị ngay lập tức cho việc quản lý sự kiện.

**Acceptance Scenarios**:

1. **[NOT YET IMPLEMENTED]** **Given** có sự kiện sẽ diễn ra trong vòng 24 giờ tới và có tình nguyện viên đã được duyệt tham gia, **When** hệ thống thực thi quy trình quét dữ liệu định kỳ (Cron Job chạy hàng giờ), **Then** hệ thống gửi thông điệp nhắc nhở sự kiện đến tất cả tình nguyện viên có trạng thái "Approved".
2. **[NOT YET IMPLEMENTED]** **Given** thông điệp nhắc nhở đã được gửi cho một sự kiện, **When** quy trình quét dữ liệu chạy lại trong giờ tiếp theo, **Then** hệ thống không gửi lại thông điệp nhắc nhở trùng lặp cho cùng một sự kiện và tình nguyện viên.
3. **[NOT YET IMPLEMENTED]** **Given** sự kiện đã bị hủy hoặc hoãn, **When** quy trình quét dữ liệu chạy, **Then** hệ thống không gửi thông điệp nhắc nhở cho sự kiện đã hủy/hoãn.

---

### User Story 5 - Gửi chứng nhận tham gia qua email (UC66) (Priority: P3) **[NOT YET IMPLEMENTED]**

**[NOT YET IMPLEMENTED]** Là một tình nguyện viên đã hoàn thành sự kiện, tôi muốn nhận được chứng nhận điện tử qua email để tôi có thể lưu trữ và sử dụng làm bằng chứng cho hoạt động tình nguyện của mình.

**Why this priority**: Đây là tính năng bổ sung giá trị cho tình nguyện viên sau khi hoàn thành sự kiện. Tuy nhiên, nó có độ ưu tiên thấp nhất vì không ảnh hưởng đến quy trình đăng ký, xác thực hoặc tham gia sự kiện. Chứng nhận có thể được phát hành thủ công nếu tính năng này chưa sẵn sàng.

**Independent Test**: Có thể kiểm thử độc lập bằng cách phát hành chứng nhận điện tử cho một tình nguyện viên và xác nhận rằng thông điệp chứa tệp tin chứng nhận được gửi thành công đến địa chỉ email của tình nguyện viên. Tính năng này mang lại giá trị ngay lập tức cho việc công nhận đóng góp của tình nguyện viên.

**Acceptance Scenarios**:

1. **[NOT YET IMPLEMENTED]** **Given** chứng nhận điện tử đã được phát hành cho tình nguyện viên, **When** hệ thống nhận được sự kiện phát hành chứng nhận, **Then** hệ thống gửi thông điệp kèm theo tệp tin chứng nhận (PDF) dưới dạng tài liệu đính kèm đến địa chỉ email của tình nguyện viên.
2. **[NOT YET IMPLEMENTED]** **Given** tệp tin chứng nhận có kích thước lớn (>5MB), **When** hệ thống chuẩn bị gửi thông điệp, **Then** hệ thống từ chối gửi tệp đính kèm và ghi lại lỗi để xử lý thủ công.
3. **[NOT YET IMPLEMENTED]** **Given** thông điệp chứng nhận đã được gửi, **When** tình nguyện viên yêu cầu gửi lại chứng nhận, **Then** hệ thống cho phép gửi lại thông điệp mà không tạo chứng nhận mới.

---

### Edge Cases

- **Khi dịch vụ truyền tải thư bị gián đoạn hoặc không khả dụng**: Hệ thống ghi lại lỗi kèm thông tin chi tiết (mã lỗi từ SMTP server, thời gian, địa chỉ email đích) và không làm gián đoạn luồng nghiệp vụ chính. Thông điệp không được gửi sẽ được báo cáo để xử lý thủ công.
- **Khi địa chỉ email người nhận không hợp lệ (sai định dạng hoặc không tồn tại)**: Hệ thống ghi lại lỗi xác thực email và trả về thông báo lỗi rõ ràng cho module gọi dịch vụ. Thông điệp không được gửi đi.
- **Khi cấu hình môi trường SMTP thiếu hoặc sai**: Hệ thống phát hiện lỗi cấu hình khi khởi tạo kết nối và ghi lại cảnh báo. Tất cả yêu cầu gửi mail sẽ thất bại với thông báo lỗi cấu hình.
- **Khi nội dung thông điệp chứa ký tự đặc biệt hoặc Unicode**: Hệ thống đảm bảo mã hóa UTF-8 cho nội dung thông điệp và tiêu đề để hiển thị chính xác các ký tự đặc biệt, biểu tượng cảm xúc và ngôn ngữ tiếng Việt.
- **Khi có nhiều yêu cầu gửi mail đồng thời**: Hệ thống xử lý các yêu cầu song song bằng cơ chế bất đồng bộ mà không chặn các luồng nghiệp vụ khác.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Hạ tầng truyền tải thư điện tử (Email Transport Infrastructure)

- **FR-001**: THE system SHALL thiết lập kết nối an toàn với dịch vụ thư điện tử thông qua các tham số cấu hình môi trường (SMTP host, port, authentication credentials, settings).
- **FR-002**: WHERE cấu hình môi trường SMTP thiếu hoặc không hợp lệ, THE system SHALL phát hiện lỗi cấu hình khi khởi tạo kết nối và ghi lại cảnh báo chi tiết.
- **FR-003**: THE system SHALL sử dụng giao thức truyền tải an toàn khi kết nối với dịch vụ thư điện tử để bảo vệ thông tin xác thực và nội dung thư.

#### UC62 - Xác thực Email (Email Verification)

- **FR-004**: WHEN người dùng đăng ký tài khoản mới, THE system SHALL tạo mã OTP 6 chữ số ngẫu nhiên an toàn bằng crypto, có giới hạn thời gian 10 phút.
- **FR-005**: WHEN mã OTP xác thực được tạo, THE system SHALL gửi thông điệp chứa mã OTP đến địa chỉ email đăng ký trong vòng 30 giây.
- **FR-006**: THE system SHALL tạo mã OTP bằng crypto an toàn để ngăn chặn việc đoán hoặc giả mạo mã OTP.
- **FR-007**: THE system SHALL đảm bảo nội dung thông điệp xác thực bao gồm: tên người dùng, mã OTP có hiệu lực, thời hạn sử dụng (10 phút) và hướng dẫn nhập mã.

#### UC63 - Quên mật khẩu (Forgot Password Email)

- **FR-008**: WHEN nhận được yêu cầu khôi phục mật khẩu hợp lệ, THE system SHALL tạo mã OTP 6 chữ số ngẫu nhiên an toàn bằng crypto, có giới hạn thời gian 10 phút.
- **FR-009**: WHEN mã OTP đặt lại mật khẩu được tạo, THE system SHALL gửi thông điệp chứa mã OTP đến địa chỉ email đã đăng ký.
- **FR-010**: THE system SHALL vô hiệu hóa mã OTP đặt lại mật khẩu ngay sau khi được sử dụng hoặc khi hết thời hạn 10 phút.
- **FR-011**: THE system SHALL đảm bảo nội dung thông điệp khôi phục mật khẩu bao gồm: tên người dùng, mã OTP có hiệu lực, thời hạn sử dụng (10 phút) và cảnh báo bảo mật.

#### UC64 - Thông báo xét duyệt (Event Approval Notification)

- **FR-012**: WHEN trạng thái đơn đăng ký sự kiện của tình nguyện viên thay đổi thành "Approved", THE system SHALL gửi thông điệp thông báo duyệt đơn đến địa chỉ email của tình nguyện viên trong vòng 1 phút.
- **FR-013**: WHEN trạng thái đơn đăng ký sự kiện của tình nguyện viên thay đổi thành "Rejected", THE system SHALL gửi thông điệp thông báo từ chối đơn kèm lý do (nếu có) đến địa chỉ email của tình nguyện viên trong vòng 1 phút.
- **FR-014**: THE system SHALL đảm bảo nội dung thông điệp thông báo bao gồm: tên sự kiện, tên tình nguyện viên, trạng thái đơn đăng ký, lý do (nếu từ chối), và hướng dẫn tiếp theo.
- **FR-015**: THE system SHALL ngăn chặn việc gửi thông điệp thông báo trùng lặp khi trạng thái đơn đăng ký thay đổi nhiều lần trong thời gian ngắn.

#### UC65 - Nhắc nhở sự kiện (Event Reminder) **[NOT YET IMPLEMENTED]**

- **FR-016**: **[NOT YET IMPLEMENTED]** THE system SHALL thực thi quy trình quét dữ liệu định kỳ (Cron Job chạy hàng giờ) để xác định các sự kiện sắp diễn ra trong vòng 24 giờ tới.
- **FR-017**: **[NOT YET IMPLEMENTED]** WHEN phát hiện sự kiện sắp diễn ra trong vòng 24 giờ tới, THE system SHALL gửi thông điệp nhắc nhở đến tất cả tình nguyện viên có trạng thái "Approved" cho sự kiện đó.
- **FR-018**: **[NOT YET IMPLEMENTED]** THE system SHALL đánh dấu các thông điệp nhắc nhở đã gửi để ngăn chặn việc gửi trùng lặp trong các lần quét dữ liệu tiếp theo.
- **FR-019**: **[NOT YET IMPLEMENTED]** THE system SHALL đảm bảo nội dung thông điệp nhắc nhở bao gồm: tên sự kiện, thời gian bắt đầu, địa điểm, tên tình nguyện viên, và hướng dẫn chuẩn bị.
- **FR-020**: **[NOT YET IMPLEMENTED]** WHERE sự kiện đã bị hủy hoặc hoãn, THE system SHALL không gửi thông điệp nhắc nhở cho sự kiện đó.

#### UC66 - Gửi chứng nhận (Certificate Email) **[NOT YET IMPLEMENTED]**

- **FR-021**: **[NOT YET IMPLEMENTED]** WHEN chứng nhận điện tử được phát hành cho tình nguyện viên, THE system SHALL gửi thông điệp kèm theo tệp tin chứng nhận (PDF) dưới dạng tài liệu đính kèm đến địa chỉ email của tình nguyện viên.
- **FR-022**: **[NOT YET IMPLEMENTED]** THE system SHALL đảm bảo nội dung thông điệp chứng nhận bao gồm: tên tình nguyện viên, tên sự kiện, thông điệp chúc mừng và hướng dẫn sử dụng chứng nhận.
- **FR-023**: **[NOT YET IMPLEMENTED]** WHERE tệp tin chứng nhận có kích thước vượt quá giới hạn cho phép (>5MB), THE system SHALL từ chối gửi tệp đính kèm và ghi lại lỗi để xử lý thủ công.
- **FR-024**: **[NOT YET IMPLEMENTED]** THE system SHALL cho phép gửi lại thông điệp chứng nhận khi tình nguyện viên yêu cầu mà không cần tạo chứng nhận mới.

#### Tối ưu nội dung thông điệp (Content Personalization)

- **FR-025**: THE system SHALL hỗ trợ việc nhúng các thông tin động (tên người dùng, tên sự kiện, thời gian, địa điểm) vào mẫu thông điệp HTML để cá nhân hóa nội dung gửi đến từng người dùng.
- **FR-026**: THE system SHALL đảm bảo nội dung thông điệp được định dạng HTML chuẩn với giao diện thân thiện, responsive và hiển thị tốt trên mọi thiết bị (desktop, mobile, tablet).
- **FR-027**: THE system SHALL đảm bảo mã hóa UTF-8 cho nội dung thông điệp và tiêu đề để hiển thị chính xác các ký tự đặc biệt, biểu tượng cảm xúc và ngôn ngữ tiếng Việt.

#### Xử lý lỗi và ghi nhật ký (Error Handling & Logging)

- **FR-028**: WHERE dịch vụ truyền tải thư bị gián đoạn hoặc không khả dụng, THE system SHALL ghi lại lỗi kèm thông tin chi tiết (mã lỗi từ SMTP server, thời gian, địa chỉ email đích) và không làm gián đoạn luồng nghiệp vụ chính.
- **FR-029**: WHERE địa chỉ email người nhận không hợp lệ (sai định dạng hoặc không tồn tại), THE system SHALL ghi lại lỗi xác thực email và trả về thông báo lỗi rõ ràng cho module gọi dịch vụ.
- **FR-030**: THE system SHALL ghi lại trạng thái gửi mail (Success/Fail) kèm theo các thông tin cần thiết (timestamp, recipient, subject, error details) để phục vụ debug và audit.
- **FR-031**: THE system SHALL KHÔNG ghi lại nội dung nhạy cảm (verification token, reset token, password, personal information) trong log files.

#### Bảo mật và tuân thủ (Security & Compliance)

- **FR-032**: THE system SHALL TUYỆT ĐỐI KHÔNG lưu trữ thông tin đăng nhập SMTP (username, password) trong mã nguồn hoặc file cấu hình tĩnh.
- **FR-033**: THE system SHALL đọc thông tin đăng nhập SMTP từ biến môi trường (Environment Variables) khi khởi tạo kết nối.
- **FR-034**: THE system SHALL xử lý tất cả yêu cầu gửi mail bằng cơ chế bất đồng bộ (async/await) để không chặn luồng nghiệp vụ chính.

### Key Entities *(Business Level Only)*

- **Email Message (Thông điệp thư điện tử)**: Đại diện cho một thông điệp thư được gửi từ hệ thống đến người dùng. Các thuộc tính chính bao gồm: địa chỉ người nhận, địa chỉ người gửi, tiêu đề thư, nội dung thư (HTML), tệp đính kèm (tùy chọn), trạng thái gửi (pending/success/failed), thời gian gửi.
- **Verification Token (Mã định danh xác thực)**: Đại diện cho mã định danh duy nhất được tạo để xác thực tài khoản hoặc đặt lại mật khẩu. Các thuộc tính chính bao gồm: mã định danh, loại token (verification/reset), người dùng liên kết, thời gian tạo, thời gian hết hạn, trạng thái (active/used/expired).
- **SMTP Configuration (Cấu hình SMTP)**: Đại diện cho thông tin kết nối với dịch vụ thư điện tử. Các thuộc tính chính bao gồm: SMTP host, SMTP port, encryption method (TLS/SSL), authentication credentials, sender name, sender email address.
- **Email Template (Mẫu thông điệp)**: Đại diện cho khung nội dung HTML chuẩn cho từng loại thông điệp (verification, reset password, approval, reminder, certificate). Các thuộc tính chính bao gồm: loại template, nội dung HTML chuẩn, các biến động cần nhúng (placeholders).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Thông điệp xác thực tài khoản (UC62) được gửi thành công đến người dùng trong vòng 30 giây sau khi đăng ký tài khoản, với tỷ lệ thành công ≥99% (đo bằng số lượng thông điệp gửi thành công / tổng số yêu cầu gửi).
- **SC-002**: Thông điệp khôi phục mật khẩu (UC63) được gửi thành công đến người dùng trong vòng 30 giây sau khi yêu cầu khôi phục, với tỷ lệ thành công ≥99%.
- **SC-003**: Thông điệp thông báo xét duyệt (UC64) được gửi thành công đến tình nguyện viên trong vòng 1 phút sau khi trạng thái đơn đăng ký thay đổi, với tỷ lệ thành công ≥95%.
- **SC-004**: Thông điệp nhắc nhở sự kiện (UC65) được gửi thành công đến tất cả tình nguyện viên đã duyệt trước 24 giờ khi sự kiện bắt đầu, với tỷ lệ thành công ≥95% và 0% trùng lặp.
- **SC-005**: Thông điệp chứng nhận (UC66) được gửi thành công đến tình nguyện viên kèm tệp đính kèm hợp lệ, với tỷ lệ thành công ≥95%.
- **SC-006**: Hệ thống xử lý được ít nhất 100 yêu cầu gửi mail đồng thời mà không gây chặn (blocking) luồng nghiệp vụ chính, với thời gian phản hồi trung bình <200ms cho việc tiếp nhận yêu cầu.
- **SC-007**: 100% lỗi gửi mail được ghi lại đầy đủ thông tin (mã lỗi, thời gian, địa chỉ email đích, lý do thất bại) để phục vụ debug và audit.
- **SC-008**: 0% thông tin đăng nhập SMTP hoặc nội dung nhạy cảm (token, password) bị lộ trong log files hoặc error messages (verified qua security audit).
- **SC-009**: Tỷ lệ người dùng hoàn tất xác thực email sau khi nhận thông điệp tăng ≥80% so với trước khi triển khai tính năng (đo bằng số lượng tài khoản được kích hoạt / tổng số thông điệp xác thực gửi thành công).
- **SC-010**: Tỷ lệ tình nguyện viên vắng mặt (no-show) giảm ≥30% sau khi triển khai tính năng nhắc nhở sự kiện (UC65) so với trước đó (đo bằng số lượng tình nguyện viên check-in / tổng số tình nguyện viên đã duyệt).

---

## Assumptions

- **Giả định về dịch vụ SMTP**: Giả định rằng tổ chức sẽ cung cấp tài khoản SMTP hợp lệ từ các nhà cung cấp uy tín (Gmail, SendGrid, Mailtrap, AWS SES) với băng thông đủ lớn để xử lý khối lượng thư dự kiến. Nếu không có tài khoản SMTP, hệ thống sẽ không thể gửi thư và phải cấu hình lại.
- **Giả định về địa chỉ email người dùng**: Giả định rằng người dùng cung cấp địa chỉ email hợp lệ và có quyền truy cập vào hộp thư đó. Hệ thống không chịu trách nhiệm xác minh tính hợp lệ của địa chỉ email trước khi gửi (việc này do SMTP server thực hiện).
- **Giả định về template engine**: Giả định rằng hệ thống sẽ sử dụng JavaScript Template Strings (native) để xây dựng nội dung HTML cho email, thay vì sử dụng các thư viện templating engine bên ngoài như Handlebars hoặc EJS. Logic sinh nội dung sẽ được đóng gói trong các hàm tiện ích (utility functions) tại tầng Service.
- **Giả định về cơ chế hàng chờ**: Giả định rằng hệ thống sẽ KHÔNG sử dụng hệ thống hàng chờ bên ngoài (Redis/BullMQ) cho việc gửi mail. Tất cả yêu cầu gửi mail sẽ được xử lý bằng cơ chế bất đồng bộ (async/await) trực tiếp từ tầng Service. Quyết định này phù hợp với quy mô tải hiện tại và giảm thiểu độ phức tạp về hạ tầng.
- **Giả định về tần suất gửi mail nhắc nhở**: Giả định rằng thông điệp nhắc nhở sự kiện (UC65) sẽ được gửi trước 24 giờ khi sự kiện bắt đầu. Cron Job sẽ chạy hàng giờ để quét các sự kiện sắp diễn ra và gửi thông báo cho tình nguyện viên có trạng thái "Approved".
- **Giả định về kích thước tệp đính kèm**: Giả định rằng tệp tin chứng nhận (certificate PDF) có kích thước trung bình <2MB và không vượt quá giới hạn 5MB. Nếu vượt quá 5MB, hệ thống sẽ từ chối gửi và ghi lại lỗi để xử lý thủ công.
- **Giả định về logging library**: Giả định rằng hệ thống sẽ sử dụng thư viện Pino (như đã quy định trong CONTEXT.md) để ghi lại trạng thái gửi mail và các lỗi từ SMTP server.
- **Giả định về module phụ thuộc**: Giả định rằng các module khác (Auth, Event, Certificate) sẽ gọi Email Service thông qua interface rõ ràng và truyền đầy đủ thông tin cần thiết (email người nhận, dynamic data, template type). Email Service không chịu trách nhiệm truy xuất dữ liệu từ database hoặc tạo nội dung nghiệp vụ.
- **Giả định về môi trường production**: Giả định rằng môi trường production sẽ có biến môi trường (Environment Variables) được cấu hình đầy đủ và chính xác cho SMTP connection. Nếu thiếu hoặc sai cấu hình, hệ thống sẽ phát hiện lỗi khi khởi động và ghi lại cảnh báo.

---

## Out of Scope

Các chức năng sau **KHÔNG nằm trong phạm vi của Module 15** và **KHÔNG được triển khai**:

- **Tạo hoặc định dạng chứng nhận (Certificate Generation):** Module 15 chỉ có nhiệm vụ gửi tệp chứng nhận đã được tạo sẵn qua email. Việc tạo hoặc định dạng tệp PDF chứng nhận thuộc về Module 12 (Certificate Management) và không nằm trong phạm vi của Email Service.
- **Lưu lịch sử hoặc thống kê email đã gửi:** Module 15 không lưu thông tin các email đã gửi vào cơ sở dữ liệu và không cung cấp chức năng thống kê. Hệ thống chỉ ghi log để phục vụ việc kiểm tra lỗi và audit khi cần.
- **Hệ thống hàng chờ (Queue) nâng cao:** Module 15 KHÔNG sử dụng Redis, BullMQ hoặc bất kỳ hệ thống hàng chờ bên ngoài nào. Mọi email sẽ được gửi trực tiếp ngay khi nhận được yêu cầu. Nếu trong tương lai hệ thống cần xử lý tải lớn, tính năng này sẽ được xem xét ở các phiên bản sau.
- **Sử dụng thư viện Template bên ngoài:** Module 15 KHÔNG sử dụng Handlebars, EJS, Pug hoặc bất kỳ thư viện template nào khác. Nội dung HTML của email sẽ được tạo bằng JavaScript Template Strings để giảm phụ thuộc vào thư viện và tối ưu hiệu năng.
- **Tự động gửi lại email khi thất bại:** Module 15 KHÔNG tự động gửi lại email nếu quá trình gửi gặp lỗi. Khi có lỗi xảy ra, hệ thống chỉ ghi log chi tiết và trả kết quả lỗi về cho module gọi để xử lý.
- **Kiểm tra tính hợp lệ của địa chỉ email trước khi gửi:** Module 15 KHÔNG kiểm tra định dạng hoặc xác minh địa chỉ email trước khi gửi. Máy chủ SMTP sẽ chịu trách nhiệm phát hiện email không hợp lệ và trả về lỗi tương ứng.
- **Hỗ trợ nhiều ngôn ngữ:** Module 15 chỉ hỗ trợ nội dung email bằng **tiếng Việt** trong phiên bản đầu tiên. Việc hỗ trợ thêm các ngôn ngữ khác sẽ được xem xét trong các phiên bản sau.
- **Lên lịch gửi email:** Module 15 KHÔNG hỗ trợ gửi email theo thời gian được lên lịch trước. Tất cả email sẽ được gửi ngay sau khi nhận yêu cầu. Nếu cần gửi theo lịch, module gọi hoặc Cron Job bên ngoài sẽ đảm nhiệm.
- **Theo dõi trạng thái email sau khi gửi:** Module 15 KHÔNG theo dõi các trạng thái như email đã mở, đã nhấp liên kết, bị trả lại (bounce) hoặc bị đánh dấu spam. Nếu cần các chức năng này, nên sử dụng các dịch vụ email chuyên dụng như SendGrid hoặc Mailchimp.
- **Mẫu email đa phương tiện phức tạp:** Module 15 chỉ hỗ trợ email HTML cơ bản với văn bản, liên kết và định dạng đơn giản. Không hỗ trợ video nhúng, hiệu ứng động hoặc các thành phần tương tác. Tệp đính kèm chỉ hỗ trợ chứng nhận PDF (UC66).
- **Gửi email hàng loạt cho mục đích marketing:** Module 15 được thiết kế để gửi các email nghiệp vụ (transactional emails) như xác thực tài khoản, thông báo hoặc nhắc nhở. Chức năng gửi email quảng cáo hoặc chiến dịch marketing hàng loạt không nằm trong phạm vi của module này.

# Feature Specification: Cập nhật hồ sơ cơ bản (UC19 - Edit Profile)

**Feature Branch**: `002-profile-edit`

**Created**: 2026-06-25

**Status**: APPROVED

**Input**: User description: "Cập nhật hồ sơ cơ bản (UC19 - Edit Profile) - Sau một thời gian sử dụng hệ thống VMS, tình nguyện viên cần cập nhật lại thông tin cá nhân cơ bản (họ tên, số điện thoại, ảnh đại diện) để đảm bảo ban tổ chức có thể liên lạc khi tham gia sự kiện."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cập nhật thông tin văn bản cơ bản (Priority: P1)

Với vai trò là một Tình nguyện viên đã đăng nhập hệ thống, tôi muốn cập nhật họ tên hoặc số điện thoại của mình để ban tổ chức có thể liên lạc chính xác khi tôi tham gia các sự kiện tình nguyện.

**Why this priority**: Đây là chức năng cốt lõi nhất của UC19. Thông tin liên lạc chính xác là điều kiện tiên quyết để ban tổ chức có thể phối hợp với tình nguyện viên trong quá trình tổ chức sự kiện. Nếu thiếu chức năng này, tình nguyện viên sẽ không thể sửa thông tin khi có thay đổi (đổi số điện thoại, thay đổi tên hiển thị).

**Independent Test**: Có thể kiểm tra độc lập bằng cách: đăng nhập với tài khoản tình nguyện viên, truy cập form chỉnh sửa hồ sơ, thay đổi họ tên hoặc số điện thoại, lưu thay đổi, và xác nhận rằng thông tin mới được hiển thị chính xác trong hồ sơ cá nhân.

**Acceptance Scenarios**:

1. **Given** tình nguyện viên đã đăng nhập và truy cập trang chỉnh sửa hồ sơ, **When** thay đổi họ tên từ "Nguyễn Văn A" thành "Nguyễn Văn B" và gửi yêu cầu cập nhật, **Then** hệ thống lưu thay đổi và hiển thị họ tên mới "Nguyễn Văn B" trong hồ sơ cá nhân
2. **Given** tình nguyện viên đã đăng nhập, **When** chỉ thay đổi số điện thoại từ "0901234567" thành "0987654321" mà không thay đổi họ tên, **Then** hệ thống chỉ cập nhật số điện thoại mới và giữ nguyên các trường còn lại
3. **Given** tình nguyện viên gửi yêu cầu cập nhật với số điện thoại không hợp lệ (ví dụ: "123"), **Then** hệ thống từ chối yêu cầu và trả về thông báo lỗi rõ ràng về định dạng số điện thoại

---

### User Story 2 - Cập nhật ảnh đại diện (Priority: P2)

Với vai trò là một Tình nguyện viên đã đăng nhập, tôi muốn thay đổi ảnh đại diện của mình để ban tổ chức và các tình nguyện viên khác có thể dễ dàng nhận diện tôi trong hệ thống và trong các sự kiện.

**Why this priority**: Ảnh đại diện giúp tạo sự nhận diện trực quan và chuyên nghiệp, nhưng không phải là thông tin bắt buộc để vận hành hệ thống. Tính năng này nâng cao trải nghiệm người dùng nhưng có thể hoạt động độc lập với P1.

**Independent Test**: Có thể kiểm tra độc lập bằng cách: đăng nhập, chọn file ảnh từ máy tính (định dạng jpg/png, dung lượng nhỏ hơn 5MB), gửi yêu cầu cập nhật, và xác nhận rằng ảnh đại diện mới được hiển thị trong hồ sơ.

**Acceptance Scenarios**:

1. **Given** tình nguyện viên chưa có ảnh đại diện, **When** chọn một file ảnh hợp lệ (jpg, dung lượng 2MB) và gửi yêu cầu cập nhật, **Then** hệ thống tải ảnh lên dịch vụ lưu trữ đám mây, lưu URL vào cơ sở dữ liệu, và hiển thị ảnh đại diện mới
2. **Given** tình nguyện viên đã có ảnh đại diện cũ, **When** chọn file ảnh mới và gửi yêu cầu cập nhật, **Then** hệ thống tải ảnh mới lên, xóa ảnh cũ khỏi dịch vụ lưu trữ, và cập nhật URL ảnh mới trong cơ sở dữ liệu
3. **Given** tình nguyện viên chọn file ảnh có định dạng không được hỗ trợ (ví dụ: .gif hoặc .bmp), **When** gửi yêu cầu cập nhật, **Then** hệ thống từ chối yêu cầu với thông báo "Chỉ hỗ trợ định dạng jpg, jpeg, png"
4. **Given** tình nguyện viên chọn file ảnh có dung lượng vượt quá 5MB, **When** gửi yêu cầu cập nhật, **Then** hệ thống từ chối yêu cầu với thông báo "Dung lượng file vượt quá giới hạn 5MB"

---

### User Story 3 - Cập nhật kết hợp thông tin văn bản và ảnh (Priority: P3)

Với vai trò là một Tình nguyện viên, tôi muốn cập nhật đồng thời cả họ tên, số điện thoại và ảnh đại diện trong một lần thao tác để tiết kiệm thời gian.

**Why this priority**: Đây là trường hợp tối ưu trải nghiệm người dùng khi họ muốn làm mới toàn bộ hồ sơ. Tuy nhiên, chức năng này phụ thuộc vào P1 và P2 đã hoạt động ổn định.

**Independent Test**: Có thể kiểm tra độc lập bằng cách: đăng nhập, thay đổi cả họ tên, số điện thoại và chọn file ảnh mới trong cùng một form, gửi yêu cầu cập nhật, và xác nhận rằng tất cả các thay đổi đều được áp dụng thành công.

**Acceptance Scenarios**:

1. **Given** tình nguyện viên có hồ sơ hiện tại với họ tên "Trần Thị C", số điện thoại "0912345678", và ảnh đại diện cũ, **When** thay đổi họ tên thành "Trần Thị D", số điện thoại thành "0923456789", và chọn file ảnh mới, **Then** hệ thống cập nhật thành công cả ba trường, xóa ảnh cũ, và hiển thị toàn bộ thông tin mới
2. **Given** tình nguyện viên gửi yêu cầu cập nhật kết hợp nhưng file ảnh không hợp lệ, **When** hệ thống validate dữ liệu, **Then** toàn bộ yêu cầu bị từ chối và hồ sơ giữ nguyên trạng thái ban đầu (transaction integrity)

---

### Edge Cases

- **Concurrent Updates**: Điều gì xảy ra khi cùng một người dùng gửi hai yêu cầu cập nhật hồ sơ đồng thời từ hai thiết bị khác nhau? Hệ thống phải đảm bảo tính nhất quán của dữ liệu và chỉ áp dụng yêu cầu được xử lý sau cùng.
- **Lỗi tải ảnh lên dịch vụ lưu trữ**: Nếu quá trình tải ảnh lên dịch vụ lưu trữ đám mây thất bại (do lỗi mạng hoặc dịch vụ không khả dụng), hệ thống phải rollback toàn bộ transaction và giữ nguyên thông tin hồ sơ cũ, không để trạng thái dữ liệu không nhất quán.
- **Xóa ảnh cũ thất bại**: Nếu việc xóa ảnh cũ khỏi dịch vụ lưu trữ thất bại nhưng ảnh mới đã được tải lên thành công, hệ thống phải ghi log cảnh báo để admin có thể dọn dẹp thủ công (garbage collection bị treo), nhưng vẫn cho phép cập nhật URL ảnh mới trong cơ sở dữ liệu.
- **Session hết hạn**: Điều gì xảy ra khi JWT token hết hạn trong khi người dùng đang điền form? Hệ thống phải trả về lỗi authentication và yêu cầu người dùng đăng nhập lại trước khi tiếp tục.
- **File ảnh rỗng hoặc bị hỏng**: Hệ thống phải kiểm tra tính hợp lệ của file (không chỉ extension mà còn magic bytes) để đảm bảo file thực sự là ảnh, không phải file độc hại được đổi tên.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: WHERE yêu cầu cập nhật hồ sơ được gửi lên, THE system SHALL xác định danh tính người dùng thông qua user_id trích xuất từ JWT Token hợp lệ trong cookie
- **FR-002**: THE system SHALL KHÔNG chấp nhận user_id từ request body hoặc URL parameters để ngăn chặn tấn công IDOR (Insecure Direct Object Reference)
- **FR-003**: WHEN nhận yêu cầu cập nhật, THE system SHALL chấp nhận cập nhật một hoặc nhiều trường trong danh sách: họ tên (full_name), số điện thoại (phone_number), và file ảnh đại diện (avatar)
- **FR-004**: THE system SHALL bỏ qua bất kỳ trường nào không nằm trong danh sách cho phép (ví dụ: email, password, role) nếu client cố tình gửi lên
- **FR-005**: WHERE yêu cầu cập nhật không chứa trường nào cụ thể, THE system SHALL giữ nguyên giá trị hiện tại của trường đó trong cơ sở dữ liệu (hành vi PATCH)
- **FR-006**: WHERE yêu cầu cập nhật có chứa file ảnh đại diện, THE system SHALL kiểm tra định dạng file (CHỈ chấp nhận jpg, jpeg, png) trước khi xử lý
- **FR-007**: WHERE yêu cầu cập nhật có chứa file ảnh đại diện, THE system SHALL kiểm tra dung lượng file (tối đa 5MB) trước khi xử lý
- **FR-008**: WHEN file ảnh đại diện hợp lệ được tải lên dịch vụ lưu trữ đám mây thành công, THE system SHALL lưu URL của ảnh mới vào cơ sở dữ liệu
- **FR-009**: WHERE người dùng đã có ảnh đại diện cũ trong cơ sở dữ liệu, WHEN file ảnh mới được tải lên thành công, THE system SHALL trích xuất định danh của ảnh cũ từ URL và gọi dịch vụ lưu trữ để xóa vĩnh viễn ảnh cũ TRƯỚC KHI cập nhật URL ảnh mới
- **FR-010**: WHERE file ảnh có định dạng không được hỗ trợ, THE system SHALL từ chối yêu cầu và trả về thông báo lỗi với HTTP status code 413 (Payload Too Large)
- **FR-011**: WHERE file ảnh vượt quá dung lượng cho phép, THE system SHALL từ chối yêu cầu và trả về thông báo lỗi với HTTP status code 413 (Payload Too Large)
- **FR-012**: WHERE JWT token không hợp lệ hoặc đã hết hạn, THE system SHALL trả về lỗi authentication với HTTP status code 401 (Unauthorized)
- **FR-013**: WHERE quá trình tải ảnh lên dịch vụ lưu trữ đám mây thất bại, THE system SHALL xử lý lỗi một cách graceful, rollback toàn bộ transaction, và trả về thông báo lỗi với HTTP status code 500 (Internal Server Error)
- **FR-014**: WHEN cập nhật hồ sơ thành công, THE system SHALL trả về thông tin hồ sơ đã được cập nhật cho client, KHÔNG bao gồm các thông tin nhạy cảm như password hash, JWT token, hoặc thông tin xác thực nội bộ
- **FR-015**: THE system SHALL ghi log (audit trail) mỗi lần cập nhật hồ sơ thành công với các thông tin: user_id, timestamp, các trường đã thay đổi (không bao gồm giá trị cụ thể của dữ liệu nhạy cảm)

### Key Entities *(Business Level Only)*

- **User Profile (Hồ sơ người dùng)**: Đại diện cho thông tin cá nhân hiển thị của tài khoản người dùng trong hệ thống. Các thuộc tính có thể cập nhật trong UC19 bao gồm: họ tên đầy đủ, số điện thoại liên lạc, và URL ảnh đại diện. Hồ sơ này được liên kết với tài khoản người dùng (User Account) thông qua user_id duy nhất.
- **Avatar Image (Ảnh đại diện)**: Đại diện cho file ảnh được lưu trữ trên dịch vụ đám mây, liên kết với hồ sơ người dùng thông qua URL. Mỗi người dùng chỉ có tối đa một ảnh đại diện active tại một thời điểm. Khi ảnh mới được tải lên, ảnh cũ phải được xóa để tối ưu dung lượng lưu trữ.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người dùng có thể hoàn thành việc cập nhật thông tin văn bản (họ tên, số điện thoại) trong vòng 30 giây kể từ khi truy cập form chỉnh sửa
- **SC-002**: Người dùng có thể hoàn thành việc cập nhật ảnh đại diện trong vòng 1 phút, bao gồm cả thời gian chọn file và chờ tải lên
- **SC-003**: Hệ thống xử lý yêu cầu cập nhật hồ sơ và trả về kết quả trong vòng 3 giây cho yêu cầu chỉ có thông tin văn bản, và trong vòng 10 giây cho yêu cầu có kèm file ảnh (giả định file ảnh dưới 5MB)
- **SC-004**: 95% các yêu cầu cập nhật hợp lệ được xử lý thành công mà không có lỗi hệ thống
- **SC-005**: Không có trường hợp nào người dùng có thể cập nhật hồ sơ của người dùng khác (bảo mật IDOR đạt 100%)
- **SC-006**: Không có trường hợp nào file ảnh cũ bị bỏ sót trên dịch vụ lưu trữ sau khi ảnh mới được cập nhật thành công (garbage collection đạt 100%)
- **SC-007**: 90% người dùng hoàn thành việc cập nhật hồ sơ thành công ngay lần thử đầu tiên mà không gặp lỗi validation

## Assumptions

- **Authentication system**: Giả định hệ thống xác thực JWT đã được triển khai và hoạt động ổn định. UC19 sẽ tái sử dụng middleware xác thực hiện có để trích xuất user_id từ token.
- **Cloud storage service**: Giả định dịch vụ lưu trữ đám mây (Cloudinary) đã được cấu hình và có API credentials hợp lệ. UC19 sẽ sử dụng SDK hoặc API của dịch vụ để tải lên và xóa ảnh.
- **User data structure**: Giả định bảng User trong cơ sở dữ liệu đã có các trường: full_name, phone_number, avatar_url, và các trường này có thể nullable (cho phép giá trị null khi người dùng chưa điền).
- **Network stability**: Giả định người dùng có kết nối internet ổn định khi thực hiện cập nhật hồ sơ. Đối với trường hợp mất kết nối, hệ thống sẽ trả về lỗi timeout và người dùng cần thử lại.
- **Skills management separation**: Giả định chức năng cập nhật Kỹ năng (Skills) đã được tách thành UC20 riêng biệt và không nằm trong scope của UC19.
- **Browser support**: Giả định người dùng sử dụng trình duyệt hiện đại có hỗ trợ HTML5 file input và FormData API để gửi multipart/form-data requests.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của feature này và KHÔNG được implement:

- **Thay đổi email hoặc password**: Sẽ được xử lý bởi UC06 (Change Password). UC19 chỉ cho phép cập nhật thông tin hiển thị, không phải thông tin xác thực.
- **Cập nhật kỹ năng (Skills)**: Sẽ được xử lý bởi UC20 (Manage Skills). UC19 chỉ tập trung vào thông tin cá nhân cơ bản.
- **Cập nhật hồ sơ của người dùng khác**: Chức năng quản lý người dùng dành cho Admin sẽ nằm trong module riêng. UC19 chỉ cho phép người dùng cập nhật hồ sơ của chính mình.
- **Xác thực email hoặc số điện thoại mới**: Không có quy trình gửi OTP hoặc email verification trong UC19. Nếu cần thiết, sẽ được bổ sung trong phiên bản sau.
- **Upload nhiều ảnh hoặc ảnh bìa**: UC19 chỉ hỗ trợ cập nhật một ảnh đại diện duy nhất. Các loại ảnh khác (ảnh bìa, gallery) không nằm trong scope.
- **Crop hoặc chỉnh sửa ảnh**: Frontend không cung cấp công cụ chỉnh sửa ảnh. Người dùng phải chuẩn bị ảnh sẵn trước khi tải lên.
- **Lịch sử thay đổi hồ sơ (Profile Change History)**: Hệ thống chỉ ghi audit log cơ bản, không cung cấp giao diện để người dùng xem lịch sử các lần thay đổi hồ sơ của mình.
- **Notification khi hồ sơ được cập nhật**: Không có thông báo email hoặc in-app notification khi hồ sơ được thay đổi thành công. Quá phức tạp cho v1.

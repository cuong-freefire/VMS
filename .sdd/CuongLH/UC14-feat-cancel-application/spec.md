# Feature Specification: Hủy Đơn Đăng Ký Sự Kiện (UC14)

**Feature Branch**: `feat/cancel-application`  
**Created**: 2026-07-21  
**Status**: Draft  
**Input**: Là tình nguyện viên của hệ thống VMS, tôi muốn hủy đơn đăng ký tham gia sự kiện đã nộp trước đó khi sự kiện chưa bắt đầu. Việc hủy giúp tôi thay đổi kế hoạch cá nhân và giải phóng chỗ cho người khác.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hủy đơn PENDING (Priority: P1)

Là tình nguyện viên đã đăng nhập, tôi muốn hủy đơn đang ở trạng thái `PENDING` khi sự kiện chưa bắt đầu.

**Why this priority**: Đây là luồng chính của tính năng hủy đơn.

**Independent Test**: Tạo một đơn `PENDING` cho sự kiện `PUBLISHED` chưa bắt đầu, gửi yêu cầu hủy và kiểm tra đơn chuyển thành `CANCELLED`.

**Acceptance Scenarios**:

1. **Given** tình nguyện viên có đơn `PENDING` thuộc một sự kiện `PUBLISHED` chưa bắt đầu, **When** tình nguyện viên hủy đơn, **Then** hệ thống chuyển trạng thái đơn thành `CANCELLED`.

2. **Given** đơn được hủy khi đang ở trạng thái `PENDING`, **When** việc hủy hoàn tất, **Then** số người đã được duyệt của sự kiện không thay đổi.

3. **Given** việc hủy thành công, **When** API trả kết quả, **Then** hệ thống trả HTTP 200 cùng thông tin đơn sau khi hủy.

---

### User Story 2 - Hủy đơn APPROVED và giải phóng chỗ (Priority: P1)

Là tình nguyện viên đã được duyệt tham gia, tôi muốn hủy đơn `APPROVED` khi sự kiện chưa bắt đầu để rút khỏi sự kiện và giải phóng một chỗ.

**Why this priority**: Hủy đơn `APPROVED` ảnh hưởng trực tiếp đến số người tham gia đã được duyệt của sự kiện.

**Independent Test**: Tạo một đơn `APPROVED` cho sự kiện `PUBLISHED` chưa bắt đầu, gửi yêu cầu hủy và kiểm tra đơn chuyển thành `CANCELLED`, đồng thời số người đã được duyệt giảm đúng 1.

**Acceptance Scenarios**:

1. **Given** tình nguyện viên có đơn `APPROVED` và sự kiện chưa bắt đầu, **When** tình nguyện viên hủy đơn, **Then** hệ thống chuyển đơn thành `CANCELLED`.

2. **Given** số người đã được duyệt của sự kiện lớn hơn 0, **When** một đơn `APPROVED` được hủy thành công, **Then** số người đã được duyệt giảm đúng 1.

3. **Given** số người đã được duyệt đang bằng 0 do dữ liệu không nhất quán, **When** một đơn `APPROVED` được hủy, **Then** hệ thống giữ nguyên giá trị 0 và không để giá trị trở thành số âm.

4. **Given** việc hủy thành công, **When** API trả kết quả, **Then** hệ thống trả HTTP 200 cùng thông tin đơn sau khi hủy.

---

### User Story 3 - Từ chối yêu cầu hủy không hợp lệ (Priority: P1)

Hệ thống phải từ chối yêu cầu hủy khi đơn hoặc sự kiện không đáp ứng điều kiện.

**Why this priority**: Các quy tắc này bảo vệ dữ liệu và ngăn người dùng hủy đơn không thuộc về mình.

**Independent Test**: Gửi yêu cầu hủy với từng trường hợp không hợp lệ và kiểm tra mã HTTP cùng thông báo trả về.

**Acceptance Scenarios**:

1. **Given** mã đơn không tồn tại, **When** tình nguyện viên gửi yêu cầu hủy, **Then** hệ thống trả HTTP 404 với thông báo “Không tìm thấy đơn đăng ký”.

2. **Given** đơn thuộc về một tình nguyện viên khác, **When** người dùng gửi yêu cầu hủy, **Then** hệ thống trả HTTP 403 với thông báo “Bạn không có quyền hủy đơn này”.

3. **Given** đơn đã có trạng thái `CANCELLED`, **When** chủ sở hữu tiếp tục yêu cầu hủy, **Then** hệ thống trả HTTP 409 với thông báo “Đơn này đã được hủy trước đó”.

4. **Given** đơn có trạng thái `REJECTED`, **When** chủ sở hữu yêu cầu hủy, **Then** hệ thống trả HTTP 409 với thông báo “Không thể hủy đơn đã bị từ chối”.

5. **Given** sự kiện không có trạng thái `PUBLISHED`, **When** tình nguyện viên yêu cầu hủy đơn, **Then** hệ thống từ chối với HTTP 409 và thông báo phù hợp.

6. **Given** sự kiện có trạng thái `PUBLISHED` nhưng đã đến hoặc vượt qua thời gian bắt đầu, **When** tình nguyện viên yêu cầu hủy đơn, **Then** hệ thống trả HTTP 409 với thông báo “Không thể hủy đơn khi sự kiện đã bắt đầu”.

7. **Given** sự kiện có trạng thái `IN_PROGRESS`, `COMPLETED` hoặc `CANCELLED`, **When** tình nguyện viên yêu cầu hủy đơn, **Then** hệ thống trả HTTP 409 với thông báo phù hợp.

---

### User Story 4 - Xác nhận hủy trên giao diện (Priority: P2)

Là tình nguyện viên, tôi muốn giao diện hiển thị nút hủy đúng lúc, yêu cầu xác nhận trước khi hủy và thông báo kết quả sau khi hoàn tất.

**Why this priority**: Việc xác nhận giúp hạn chế trường hợp người dùng hủy nhầm.

**Independent Test**: Mở trang có đơn đủ điều kiện hủy, nhấn nút “Hủy đơn”, kiểm tra hộp thoại xác nhận, trạng thái đang xử lý và thông báo kết quả.

**Acceptance Scenarios**:

1. **Given** đơn có trạng thái `PENDING` hoặc `APPROVED` và sự kiện đủ điều kiện hủy, **When** giao diện được hiển thị, **Then** người dùng nhìn thấy nút “Hủy đơn”.

2. **Given** đơn không còn đủ điều kiện hủy, **When** giao diện được hiển thị, **Then** nút “Hủy đơn” không xuất hiện.

3. **Given** người dùng nhấn “Hủy đơn”, **When** thao tác được thực hiện, **Then** giao diện hiển thị hộp thoại xác nhận trước khi gửi yêu cầu hủy.

4. **Given** người dùng xác nhận hủy, **When** API đang xử lý, **Then** nút xác nhận chuyển sang trạng thái đang xử lý và không thể nhấn nhiều lần.

5. **Given** API trả kết quả thành công, **When** giao diện nhận phản hồi, **Then** trạng thái đơn được cập nhật thành “Đã hủy” và hiển thị thông báo thành công.

6. **Given** API trả về lỗi, **When** giao diện nhận phản hồi, **Then** trạng thái đơn không thay đổi và người dùng nhận được thông báo lỗi phù hợp.

---

### Edge Cases

- **Hủy đồng thời với duyệt đơn**: Nếu yêu cầu hủy được xử lý trước, đơn chuyển thành `CANCELLED` và không thể tiếp tục được duyệt hoặc từ chối. Nếu thao tác duyệt được xử lý trước, đơn chuyển thành `APPROVED` và yêu cầu hủy tiếp tục được xử lý theo quy tắc của đơn `APPROVED`, miễn là sự kiện chưa bắt đầu.

- **Nhiều đơn APPROVED được hủy cùng lúc**: Số người đã được duyệt phải giảm đúng bằng số đơn `APPROVED` được hủy thành công và không được nhỏ hơn 0.

- **Hủy khi sự kiện đã đầy**: Khi một đơn `APPROVED` được hủy, một chỗ trống được giải phóng. Việc có cho phép nộp đơn mới hay không do quy tắc đăng ký của UC12 quyết định.

- **Hủy sau khi hết hạn đăng ký**: Nếu sự kiện chưa bắt đầu, tình nguyện viên vẫn được phép hủy dù thời hạn nộp đơn mới đã kết thúc.

- **Hủy đúng thời điểm sự kiện bắt đầu**: Nếu thời gian hiện tại bằng thời gian bắt đầu của sự kiện, sự kiện được xem là đã bắt đầu và yêu cầu hủy phải bị từ chối.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống phải cung cấp endpoint `PATCH /api/v1/applications/:id/cancel` cho phép tình nguyện viên đã xác thực hủy đơn của chính mình.

- **FR-002**: Hệ thống phải kiểm tra đơn tồn tại và thuộc về tình nguyện viên đang thực hiện yêu cầu. Nếu đơn không tồn tại, trả HTTP 404. Nếu đơn không thuộc về người dùng, trả HTTP 403.

- **FR-003**: Hệ thống chỉ cho phép hủy đơn có trạng thái `PENDING` hoặc `APPROVED`.

- **FR-004**: Hệ thống phải từ chối hủy đơn có trạng thái `CANCELLED` hoặc `REJECTED` và trả HTTP 409 với thông báo phù hợp.

- **FR-005**: Hệ thống chỉ cho phép hủy khi sự kiện có trạng thái `PUBLISHED` và thời gian hiện tại chưa đến thời gian bắt đầu của sự kiện.

- **FR-006**: Khi hủy đơn `PENDING`, hệ thống phải chuyển trạng thái đơn thành `CANCELLED` và không làm thay đổi số người đã được duyệt của sự kiện.

- **FR-007**: Khi hủy đơn `APPROVED`, hệ thống phải chuyển trạng thái đơn thành `CANCELLED` và làm giảm số người đã được duyệt của sự kiện đi 1 nếu giá trị hiện tại lớn hơn 0.

- **FR-008**: Số người đã được duyệt của sự kiện không được nhỏ hơn 0 trong bất kỳ trường hợp nào.

- **FR-009**: Việc thay đổi trạng thái đơn và số người đã được duyệt phải tạo ra một kết quả nhất quán. Nếu một thay đổi không thể hoàn tất, hệ thống không được giữ lại kết quả chưa đầy đủ.

- **FR-010**: Khi hủy thành công, API phải trả HTTP 200 cùng mã đơn, trạng thái `CANCELLED` và thời gian cập nhật.

- **FR-011**: Giao diện phải hiển thị nút “Hủy đơn” khi đơn và sự kiện đủ điều kiện hủy, đồng thời ẩn nút khi không còn đủ điều kiện.

- **FR-012**: Giao diện phải yêu cầu người dùng xác nhận trước khi gửi yêu cầu hủy, hiển thị trạng thái đang xử lý và thông báo kết quả sau khi hoàn tất.

- **FR-013**: Hệ thống không được xóa đơn đăng ký. Đơn sau khi hủy phải được giữ lại với trạng thái `CANCELLED`.

---

### Key Entities

- **Application**: Đại diện cho đơn đăng ký tham gia sự kiện. Thông tin liên quan gồm mã đơn, người sở hữu, sự kiện, trạng thái và thời gian cập nhật.

- **Event**: Đại diện cho sự kiện tình nguyện. Thông tin liên quan gồm trạng thái, thời gian bắt đầu, sức chứa và số người đã được duyệt.

- **User**: Đại diện cho tình nguyện viên sở hữu đơn. Hệ thống dùng thông tin người dùng để kiểm tra quyền hủy đơn.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% yêu cầu hủy hợp lệ đối với đơn `PENDING` hoặc `APPROVED` phải chuyển đơn thành `CANCELLED`.

- **SC-002**: Hủy đơn `PENDING` không làm thay đổi số người đã được duyệt của sự kiện.

- **SC-003**: Khi số người đã được duyệt lớn hơn 0, mỗi đơn `APPROVED` được hủy thành công phải làm giảm giá trị này đúng 1. Giá trị cuối cùng không được nhỏ hơn 0.

- **SC-004**: 100% yêu cầu hủy không hợp lệ phải bị từ chối với mã HTTP và thông báo phù hợp.

- **SC-005**: 100% thao tác hủy từ giao diện phải hiển thị hộp thoại xác nhận trước khi gửi yêu cầu đến API.

---

## Assumptions

- **A-001**: Mỗi đơn đăng ký được liên kết với một tình nguyện viên và một sự kiện cụ thể.

- **A-002**: Hệ thống đã xác định được danh tính, vai trò và trạng thái hoạt động của người dùng đang gửi yêu cầu.

- **A-003**: Trạng thái và thời gian bắt đầu của sự kiện được cung cấp đầy đủ để xác định sự kiện đã bắt đầu hay chưa.

- **A-004**: Số người đã được duyệt của sự kiện có thể được cập nhật hoặc tính lại một cách chính xác sau khi đơn thay đổi trạng thái.

- **A-005**: Các chức năng xem đơn đăng ký, xem chi tiết sự kiện và nộp đơn mới đã có quy định đầu vào và kết quả rõ ràng.

- **A-006**: Sau khi hủy, đơn cũ giữ trạng thái `CANCELLED` và không được khôi phục.

- **A-007**: Việc hủy đơn cũ không ngăn tình nguyện viên đăng ký lại. Việc tạo đơn mới được xử lý theo quy tắc của UC12.

---

## Out of Scope

Các chức năng sau không nằm trong phạm vi của UC14:

- Xóa đơn đăng ký khỏi hệ thống.
- Khôi phục một đơn đã chuyển sang `CANCELLED`.
- Hủy đơn thay cho tình nguyện viên bởi Staff, Manager hoặc Admin.
- Hủy nhiều đơn trong một lần.
- Yêu cầu tình nguyện viên nhập lý do hủy.
- Tự động duyệt một đơn `PENDING` khác sau khi có chỗ trống.
- Gửi email hoặc thông báo thời gian thực khi đơn bị hủy.
- Xử lý việc tạo đơn đăng ký mới sau khi hủy.

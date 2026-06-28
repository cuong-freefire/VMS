# Feature Specification: Đăng xuất (Logout) - UC05

**Feature Branch**: `003-auth-logout`

**Created**: 2026-06-28

**Status**: ACCEPTED

**Input**: User description: "UC05 - Logout: Người dùng đăng xuất khỏi hệ thống để bảo vệ tài khoản khi rời khỏi thiết bị"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Đăng xuất cơ bản (Priority: P1)

Là Người dùng đã đăng nhập (Volunteer/Staff/Manager/Admin), tôi muốn đăng xuất khỏi hệ thống bằng một cú nhấp chuột duy nhất để bảo vệ tài khoản của tôi khi rời khỏi thiết bị hoặc kết thúc phiên làm việc.

**Why this priority**: Đây là chức năng cốt lõi của UC05, đảm bảo người dùng có thể thoát khỏi hệ thống một cách an toàn. Không có tính năng này, tài khoản người dùng sẽ luôn ở trạng thái đăng nhập, gây rủi ro bảo mật cao trên thiết bị dùng chung.

**Independent Test**: Có thể được test độc lập bằng cách đăng nhập vào hệ thống, nhấn nút "Đăng xuất", và xác minh rằng người dùng được chuyển về trang Landing Page và không còn truy cập được vào các trang yêu cầu xác thực.

**Acceptance Scenarios**:

1. **Given** người dùng đã đăng nhập với vai trò Volunteer và đang ở trang Dashboard, **When** người dùng nhấn nút "Đăng xuất" trên thanh điều hướng, **Then** hệ thống xóa thông tin định danh khỏi trình duyệt, cập nhật giao diện (ẩn tên người dùng, hiển thị nút "Đăng nhập"), và chuyển hướng về trang Landing Page.

2. **Given** người dùng đã đăng xuất thành công, **When** người dùng cố gắng truy cập trực tiếp vào URL của trang Dashboard (yêu cầu xác thực), **Then** hệ thống từ chối truy cập, chuyển hướng về trang đăng nhập, và hiển thị thông báo "Vui lòng đăng nhập để tiếp tục".

---

### User Story 2 - Đăng xuất trong điều kiện mạng không ổn định (Priority: P2)

Là Người dùng, tôi muốn hệ thống vẫn xóa thông tin định danh cục bộ ngay cả khi kết nối mạng bị gián đoạn, để đảm bảo tài khoản của tôi được bảo vệ ngay lập tức.

**Why this priority**: Tăng cường bảo mật trong các tình huống mạng không ổn định (Wi-Fi công cộng, mạng di động yếu). Đây là tính năng quan trọng nhưng không phải cốt lõi như P1.

**Independent Test**: Có thể test bằng cách ngắt kết nối mạng trước khi nhấn nút "Đăng xuất", sau đó xác minh rằng thông tin định danh vẫn bị xóa khỏi trình duyệt và giao diện cập nhật về trạng thái chưa xác thực.

**Acceptance Scenarios**:

1. **Given** người dùng đã đăng nhập và đang có kết nối mạng, **When** kết nối mạng bị gián đoạn ngay trước khi người dùng nhấn nút "Đăng xuất", **Then** hệ thống vẫn xóa thông tin định danh khỏi trình duyệt cục bộ, cập nhật giao diện để phản ánh trạng thái chưa xác thực, và hiển thị thông báo "Đã đăng xuất cục bộ. Vui lòng kiểm tra kết nối mạng."

---

### User Story 3 - Đăng xuất không ảnh hưởng phiên làm việc khác (Priority: P3)

Là Người dùng sử dụng nhiều thiết bị/trình duyệt, tôi muốn việc đăng xuất trên một thiết bị không ảnh hưởng đến các phiên làm việc khác của tôi, để tôi có thể quản lý phiên làm việc độc lập trên từng thiết bị.

**Why this priority**: Tính năng này hỗ trợ trải nghiệm người dùng tốt hơn trong các tình huống sử dụng đa thiết bị, nhưng không ảnh hưởng đến chức năng cốt lõi của đăng xuất.

**Independent Test**: Test bằng cách đăng nhập trên hai trình duyệt khác nhau (Chrome và Firefox), đăng xuất trên Chrome, sau đó xác minh rằng phiên làm việc trên Firefox vẫn hoạt động bình thường.

**Acceptance Scenarios**:

1. **Given** người dùng đã đăng nhập trên hai trình duyệt khác nhau (Chrome và Firefox) trên cùng một thiết bị, **When** người dùng đăng xuất trên trình duyệt Chrome, **Then** phiên làm việc trên trình duyệt Firefox vẫn hoạt động bình thường và người dùng vẫn có thể truy cập các trang yêu cầu xác thực trên Firefox.

---

### Edge Cases

- **Người dùng chưa đăng nhập cố gắng đăng xuất**: Hệ thống từ chối yêu cầu với thông báo "Không tìm thấy phiên làm việc hợp lệ".
- **Người dùng nhấn nút "Đăng xuất" nhiều lần liên tiếp**: Hệ thống xử lý yêu cầu đầu tiên và bỏ qua các yêu cầu tiếp theo (idempotent).
- **Người dùng đóng trình duyệt ngay sau khi nhấn "Đăng xuất"**: Thông tin định danh vẫn được xóa hoàn toàn trước khi trình duyệt đóng.
- **Người dùng đăng xuất trong khi đang thực hiện một tác vụ quan trọng**: Tác vụ bị hủy bỏ và dữ liệu chưa lưu sẽ bị mất (người dùng cần được cảnh báo nếu có dữ liệu chưa lưu).

## Requirements *(mandatory)*

### Functional Requirements

**FR-001 (Core)**: WHEN người dùng đã xác thực nhấn nút "Đăng xuất", THE system SHALL gửi chỉ thị hủy hiệu lực phiên làm việc hiện tại.

**FR-002 (Core)**: WHEN yêu cầu đăng xuất được xử lý thành công, THE system SHALL xóa thông tin định danh cục bộ khỏi bộ nhớ trình duyệt.

**FR-003 (Core)**: WHEN thông tin định danh được xóa khỏi trình duyệt, THE system SHALL cập nhật trạng thái hiển thị giao diện người dùng để phản ánh trạng thái chưa xác thực (ẩn tên người dùng, menu tài khoản; hiển thị nút "Đăng nhập", "Đăng ký").

**FR-004 (Core)**: WHEN quy trình đăng xuất hoàn tất thành công, THE system SHALL chuyển hướng người dùng về trang Landing Page.

**FR-005 (Security)**: THE system SHALL đảm bảo rằng sau khi đăng xuất, mọi yêu cầu truy cập vào vùng dữ liệu nhạy cảm của người dùng đó đều bị từ chối cho đến khi có phiên đăng nhập mới hợp lệ.

**FR-006 (Error Handling)**: WHERE người dùng chưa đăng nhập cố gắng thực hiện thao tác đăng xuất, THE system SHALL từ chối yêu cầu với thông báo rõ ràng "Không tìm thấy phiên làm việc hợp lệ".

**FR-007 (Offline Resilience)**: WHERE kết nối mạng bị gián đoạn trong quá trình đăng xuất, THE system SHALL vẫn xóa thông tin định danh cục bộ để đảm bảo bảo mật.

**FR-008 (State Management)**: THE system SHALL xóa tất cả trạng thái phiên làm việc được lưu trữ tại Context của phía giao diện, bao gồm thông tin người dùng, vai trò và quyền truy cập.

**FR-009 (UI Update)**: WHEN người dùng đăng xuất, THE system SHALL ẩn các thành phần giao diện dành riêng cho người dùng đã xác thực (tên người dùng, menu tài khoản).

**FR-010 (UI Update)**: WHEN người dùng đăng xuất, THE system SHALL hiển thị lại các thành phần giao diện dành cho khách (nút "Đăng nhập", "Đăng ký").

**FR-011 (Access Control)**: WHERE người dùng đã đăng xuất cố gắng truy cập vào trang yêu cầu xác thực, THE system SHALL chuyển hướng về trang đăng nhập với thông báo "Vui lòng đăng nhập để tiếp tục".

**FR-012 (Multi-Device)**: THE system SHALL đảm bảo rằng việc đăng xuất không ảnh hưởng đến các phiên làm việc khác của người dùng trên các thiết bị/trình duyệt khác.

### Non-Functional Requirements

**NFR-001 (Hiệu năng)**: Quy trình đăng xuất phải hoàn tất trong vòng 1 giây kể từ khi người dùng nhấn nút.

**NFR-002 (Bảo mật)**: Thông tin định danh phải được xóa hoàn toàn khỏi bộ nhớ trình duyệt, không để lại dấu vết có thể khai thác.

**NFR-003 (Trải nghiệm người dùng)**: Giao diện phải cập nhật mượt mà, không có giật lag hoặc flash nội dung không mong muốn.

**NFR-004 (Độ tin cậy)**: Chức năng đăng xuất phải hoạt động ngay cả khi kết nối mạng không ổn định.

**NFR-005 (Idempotency)**: Hệ thống phải xử lý các yêu cầu đăng xuất trùng lặp một cách an toàn (idempotent) mà không gây lỗi.

### Key Entities *(Business Level Only)*

- **Phiên làm việc (Session)**: Đại diện cho trạng thái xác thực của người dùng. Bao gồm thông tin định danh (identity token), thời gian bắt đầu phiên, và vai trò người dùng. Phiên làm việc được tạo khi đăng nhập thành công và bị hủy khi đăng xuất.

- **Thông tin định danh (Identity Credential)**: Token hoặc cookie lưu trữ trong trình duyệt để xác thực các yêu cầu API. Được xóa hoàn toàn khi người dùng đăng xuất.

- **Trạng thái giao diện (UI State)**: Trạng thái hiển thị các thành phần giao diện (menu, nút, thông tin người dùng) dựa trên trạng thái xác thực. Được cập nhật ngay lập tức sau khi đăng xuất.

## Success Criteria *(mandatory)*

### Measurable Outcomes

**SC-001**: Người dùng có thể đăng xuất thành công bằng một cú nhấp chuột duy nhất vào nút "Đăng xuất" và hoàn tất trong vòng 1 giây.

**SC-002**: Sau khi đăng xuất, người dùng không thể truy cập vào các trang yêu cầu xác thực mà không đăng nhập lại (100% các yêu cầu truy cập bị từ chối).

**SC-003**: Giao diện người dùng phản ánh chính xác trạng thái chưa xác thực ngay lập tức sau khi đăng xuất (ẩn tên người dùng, hiện nút đăng nhập) trong vòng 200ms.

**SC-004**: Người dùng được chuyển hướng về trang Landing Page sau khi đăng xuất thành công trong 100% các trường hợp.

**SC-005**: Thông tin định danh được xóa hoàn toàn khỏi trình duyệt, ngay cả khi kết nối mạng bị gián đoạn (100% thành công trong chế độ offline).

**SC-006**: Các phiên làm việc khác của người dùng trên thiết bị/trình duyệt khác không bị ảnh hưởng bởi thao tác đăng xuất này (độc lập 100%).

**SC-007**: Không có lỗi hoặc exception nào được ghi nhận khi người dùng nhấn nút "Đăng xuất" nhiều lần liên tiếp (idempotent operation).

## Assumptions

- Giả định rằng thông tin định danh được lưu trữ trong bộ nhớ trình duyệt dưới dạng cookie bảo mật với thuộc tính `httpOnly` và `secure`.

- Giả định rằng việc xóa thông tin định danh cục bộ là đủ để vô hiệu hóa phiên làm việc ở phía client (stateless authentication model sử dụng JWT).

- Giả định rằng người dùng không cần xác nhận bổ sung trước khi đăng xuất (không có modal xác nhận "Bạn có chắc muốn đăng xuất?"). Nếu có dữ liệu chưa lưu, hệ thống sẽ hiển thị cảnh báo thông qua cơ chế riêng (nằm ngoài phạm vi UC05).

- Giả định rằng hệ thống sử dụng kiến trúc Stateless JWT, không lưu trữ trạng thái phiên làm việc trên server, do đó không cần xóa session từ database.

- Giả định rằng nút "Đăng xuất" được hiển thị rõ ràng trên thanh điều hướng (navigation bar) và dễ dàng truy cập từ mọi trang yêu cầu xác thực.

- Giả định rằng người dùng có quyền kiểm soát hoàn toàn phiên làm việc trên từng thiết bị/trình duyệt (không có chức năng "Đăng xuất khỏi tất cả thiết bị" trong phiên bản này).

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của feature này và KHÔNG được implement:

- **Cơ chế Blacklist Token trên Server**: Việc lưu trữ danh sách các token đã bị vô hiệu hóa trên server để ngăn chặn tái sử dụng token sau khi đăng xuất. (Lý do: Hệ thống sử dụng kiến trúc Stateless JWT với thời gian hết hạn ngắn, không yêu cầu blacklist phức tạp trong v1).

- **Xóa Refresh Token từ Database**: Việc xóa refresh token được lưu trữ trong database khi người dùng đăng xuất. (Lý do: Refresh token sẽ tự động hết hạn sau khoảng thời gian định trước, không cần xóa thủ công trong v1).

- **Ghi nhật ký hành động đăng xuất (Audit Log)**: Ghi lại thông tin người dùng đăng xuất (user ID, thời gian, IP address) vào hệ thống audit log. (Lý do: Audit log sẽ được implement trong module riêng, không thuộc phạm vi UC05).

- **Đăng xuất đồng thời khỏi tất cả các thiết bị (Global Sign-Out)**: Tính năng cho phép người dùng đăng xuất khỏi tất cả các phiên làm việc đang hoạt động trên mọi thiết bị/trình duyệt. (Lý do: Yêu cầu cơ sở hạ tầng phức tạp hơn, sẽ được cân nhắc trong v2 dựa trên phản hồi người dùng).

- **Xác nhận hai bước trước khi đăng xuất**: Modal hoặc popup yêu cầu người dùng xác nhận "Bạn có chắc muốn đăng xuất?" trước khi thực hiện thao tác. (Lý do: Đăng xuất là thao tác có thể hoàn tác dễ dàng bằng cách đăng nhập lại, không cần confirmation trong v1).

- **Lưu trạng thái "Ghi nhớ tôi" (Remember Me)**: Tính năng tự động đăng nhập lại người dùng sau khi đăng xuất nếu họ đã chọn "Ghi nhớ tôi" khi đăng nhập. (Lý do: Mâu thuẫn với mục đích bảo mật của đăng xuất, sẽ được thiết kế lại nếu có yêu cầu trong tương lai).

- **Thông báo email về hành động đăng xuất**: Gửi email thông báo đến người dùng khi có phiên làm việc bị đăng xuất. (Lý do: Email service chỉ được sử dụng cho các hành động bảo mật quan trọng hơn như đổi mật khẩu, không áp dụng cho đăng xuất thông thường).

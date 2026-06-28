# Feature Specification: Landing Page (UC01 - View Landing Page)

**Feature Branch**: `001-feat-landing-page`

**Created**: 2026-06-26

**Status**: APPROVED

**Input**: User description: "Hãy viết Đặc tả yêu cầu (Feature Specification) cho tính năng Landing Page (UC01 - View Landing Page) dựa trên CONTEXT.md."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem danh sách sự kiện tình nguyện nổi bật (Priority: P1)

Là một khách vãng lai (Guest), tôi muốn xem danh sách các sự kiện tình nguyện đang mở đăng ký ngay trên trang chủ, để tôi có thể nhanh chóng đánh giá xem hệ thống có hoạt động tình nguyện phù hợp với mình hay không.

**Why this priority**: Đây là giá trị cốt lõi của Landing Page - cho Guest thấy được các cơ hội tình nguyện thực tế. Nếu không có danh sách sự kiện, trang chỉ là văn bản giới thiệu tĩnh và không thuyết phục được Guest đăng ký.

**Independent Test**: Có thể kiểm thử hoàn toàn độc lập bằng cách truy cập URL Landing Page mà không cần đăng nhập, và quan sát danh sách sự kiện hiển thị đầy đủ (tên, mô tả ngắn, thời gian, địa điểm). Tính năng này mang lại giá trị ngay lập tức cho Guest.

**Acceptance Scenarios**:

1. **Given** hệ thống có ít nhất 6 sự kiện tình nguyện đang mở đăng ký, **When** Guest truy cập Landing Page, **Then** hệ thống hiển thị danh sách 6 sự kiện mới nhất với đầy đủ thông tin cơ bản (tên sự kiện, mô tả ngắn, thời gian diễn ra, địa điểm).
2. **Given** hệ thống có ít hơn 6 sự kiện đang mở đăng ký, **When** Guest truy cập Landing Page, **Then** hệ thống hiển thị tất cả các sự kiện hiện có mà không để trống hoặc hiển thị placeholder giả.
3. **Given** hệ thống không có sự kiện nào đang mở đăng ký, **When** Guest truy cập Landing Page, **Then** hệ thống hiển thị thông báo thân thiện "Hiện chưa có sự kiện nào đang mở đăng ký. Vui lòng quay lại sau!" thay vì để trống hoặc lỗi.

---

### User Story 2 - Chuyển hướng đến đăng ký/đăng nhập khi muốn tham gia sự kiện (Priority: P1)

Là một khách vãng lai (Guest), khi tôi thấy một sự kiện hấp dẫn và nhấn vào nút "Tham gia ngay", tôi muốn hệ thống dẫn tôi đến trang đăng ký hoặc đăng nhập, để tôi có thể tạo tài khoản và bắt đầu hành trình tình nguyện.

**Why this priority**: Đây là conversion funnel quan trọng nhất của Landing Page - chuyển đổi Guest thành Volunteer. Nếu không có luồng điều hướng này, Guest không biết phải làm gì tiếp theo sau khi bị thu hút bởi sự kiện.

**Independent Test**: Có thể kiểm thử độc lập bằng cách nhấn vào nút "Tham gia ngay" trên bất kỳ sự kiện nào và xác nhận rằng hệ thống chuyển hướng đúng đến màn hình đăng ký (UC04) hoặc đăng nhập (UC03). Tính năng này mang lại giá trị rõ ràng cho conversion funnel.

**Acceptance Scenarios**:

1. **Given** Guest đang xem Landing Page, **When** Guest nhấn vào nút "Tham gia ngay" tại bất kỳ sự kiện nào, **Then** hệ thống chuyển hướng Guest đến màn hình đăng ký (UC04).
2. **Given** Guest đang xem Landing Page và chưa có tài khoản, **When** Guest nhấn vào liên kết "Đăng nhập" trên thanh điều hướng, **Then** hệ thống chuyển hướng Guest đến màn hình đăng nhập (UC03).
3. **Given** Guest đã nhấn "Tham gia ngay" và được chuyển hướng đến màn hình đăng ký, **When** Guest hoàn tất đăng ký và đăng nhập thành công, **Then** hệ thống tự động chuyển hướng Guest (giờ đã là Volunteer) đến trang chi tiết sự kiện mà họ vừa quan tâm.

---

### User Story 3 - Xem thống kê tổng quan về hệ thống (Priority: P2)

Là một khách vãng lai (Guest), tôi muốn thấy các con số thống kê tổng quan (tổng số sự kiện, tổng số tình nguyện viên) để tôi cảm thấy tin tưởng rằng đây là một nền tảng hoạt động sôi nổi và đáng tham gia.

**Why this priority**: Đây là social proof quan trọng giúp tăng uy tín cho nền tảng, nhưng không phải là chức năng cốt lõi. Ngay cả khi không có thống kê, Guest vẫn có thể xem danh sách sự kiện và đăng ký.

**Independent Test**: Có thể kiểm thử độc lập bằng cách quan sát phần thống kê trên Landing Page hiển thị các con số chính xác (tổng số sự kiện, tổng số tình nguyện viên). Tính năng này tăng thêm giá trị nhưng không ảnh hưởng đến các user story khác.

**Acceptance Scenarios**:

1. **Given** hệ thống có dữ liệu sự kiện và tình nguyện viên, **When** Guest truy cập Landing Page, **Then** hệ thống hiển thị các con số thống kê tổng quát (ví dụ: "500+ Sự kiện tình nguyện | 2,000+ Tình nguyện viên đã tham gia").
2. **Given** hệ thống chưa có dữ liệu thống kê đủ lớn, **When** Guest truy cập Landing Page, **Then** hệ thống hiển thị thông báo động viên thay vì con số 0 (ví dụ: "Hãy là người tiên phong tham gia!").

---

### User Story 4 - Truy cập Landing Page với hiệu năng cao (Priority: P1)

Là một khách vãng lai (Guest), tôi muốn Landing Page tải nhanh (dưới 1 giây), để tôi không bị mất kiên nhẫn và rời đi trước khi xem được nội dung.

**Why this priority**: Đây là yếu tố quyết định tỷ lệ bounce rate. Nếu trang tải chậm, Guest sẽ rời đi trước khi thấy bất kỳ sự kiện nào. Hiệu năng là điều kiện tiên quyết cho mọi user story khác.

**Independent Test**: Có thể kiểm thử độc lập bằng cách sử dụng công cụ đo hiệu năng (ví dụ: Lighthouse, WebPageTest) để xác nhận thời gian tải trang dưới 1 giây. Tính năng này mang lại giá trị ngay lập tức cho trải nghiệm người dùng.

**Acceptance Scenarios**:

1. **Given** Guest có kết nối internet ổn định, **When** Guest truy cập Landing Page lần đầu tiên, **Then** toàn bộ nội dung trang (bao gồm danh sách sự kiện) hiển thị hoàn chỉnh trong vòng 1 giây.
2. **Given** hệ thống đang chịu tải cao (nhiều Guest truy cập đồng thời), **When** Guest truy cập Landing Page, **Then** hệ thống vẫn đảm bảo thời gian phản hồi dưới 1 giây nhờ cơ chế tối ưu (ví dụ: cache, CDN).
3. **Given** Guest truy cập Landing Page nhiều lần trong một phiên làm việc, **When** Guest quay lại trang, **Then** hệ thống tải nội dung tức thì nhờ cơ chế cache trình duyệt.

---

### Edge Cases

- **Khi không có sự kiện nào đang mở đăng ký:** Hệ thống hiển thị thông báo thân thiện thay vì để trống hoặc lỗi.
- **Khi hệ thống bị tấn công DDoS hoặc traffic bất thường:** API Landing Page bị bảo vệ bởi rate limiting để ngăn chặn truy cập quá tải, trả về mã lỗi 429 (Too Many Requests) với thông báo thân thiện.
- **Khi dữ liệu sự kiện chứa thông tin nhạy cảm (ví dụ: danh sách tình nguyện viên đã đăng ký):** Hệ thống chỉ trả về các trường thông tin công khai (tên, mô tả, thời gian, địa điểm) và KHÔNG để lộ thông tin nhạy cảm.
- **Khi Guest truy cập Landing Page từ thiết bị di động:** Giao diện tự động responsive và hiển thị tối ưu trên mọi kích thước màn hình.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Truy cập công khai (Public Access)

- **FR-001**: WHERE người dùng là khách vãng lai (Guest) chưa đăng nhập, THE system SHALL cho phép truy cập toàn bộ nội dung trang Landing Page mà không yêu cầu mã định danh (JWT Token).
- **FR-002**: THE system SHALL không yêu cầu bất kỳ thông tin xác thực nào (username, password, session) để truy cập Landing Page.

#### Hiển thị danh sách sự kiện

- **FR-003**: THE system SHALL tự động truy xuất và hiển thị danh sách 6 sự kiện tình nguyện mới nhất đang trong trạng thái nhận đơn đăng ký (status = "OPEN" hoặc tương đương).
- **FR-004**: WHEN có ít hơn 6 sự kiện đang mở đăng ký, THE system SHALL hiển thị tất cả các sự kiện hiện có mà không để trống hoặc hiển thị placeholder giả.
- **FR-005**: WHEN không có sự kiện nào đang mở đăng ký, THE system SHALL hiển thị thông báo thân thiện "Hiện chưa có sự kiện nào đang mở đăng ký. Vui lòng quay lại sau!" thay vì để trống hoặc lỗi.

#### Bảo mật dữ liệu công khai

- **FR-006**: THE system SHALL chỉ hiển thị các thông tin sự kiện cơ bản (tên, mô tả ngắn, thời gian, địa điểm) và TUYỆT ĐỐI KHÔNG để lộ danh sách tình nguyện viên đã tham gia hoặc thông tin liên hệ cá nhân của người phụ trách.
- **FR-007**: THE system SHALL không trả về các trường dữ liệu nhạy cảm (user ID, email, số điện thoại, địa chỉ chi tiết) trong API phục vụ Landing Page.

#### Phễu điều hướng (Conversion Funnel)

- **FR-008**: WHEN người dùng nhấn vào nút "Tham gia ngay" tại bất kỳ sự kiện nào, THE system SHALL chuyển hướng người dùng đến màn hình Đăng ký (UC04) hoặc Đăng nhập (UC03).
- **FR-009**: THE system SHALL lưu trữ thông tin sự kiện mà Guest vừa quan tâm (event ID) để tự động chuyển hướng người dùng đến trang chi tiết sự kiện sau khi đăng ký/đăng nhập thành công.

#### Hiệu năng (Performance)

- **FR-010**: THE system SHALL đảm bảo thời gian hiển thị nội dung trang dưới 1 giây kể từ khi Guest gửi request đến khi nhận được response đầy đủ.
- **FR-011**: THE system SHALL áp dụng cơ chế tối ưu (cache, CDN, database indexing) để đảm bảo hiệu năng ổn định ngay cả khi chịu tải cao.

#### Thống kê hệ thống (System Statistics)

- **FR-012**: THE system SHALL hiển thị các con số thống kê tổng quát về tổng số sự kiện và tổng số tình nguyện viên để gia tăng uy tín cho nền tảng.
- **FR-013**: WHEN dữ liệu thống kê chưa đủ lớn (ví dụ: dưới 10 sự kiện hoặc 50 tình nguyện viên), THE system SHALL hiển thị thông báo động viên thay vì con số cụ thể.

#### Bảo vệ API (API Protection)

- **FR-014**: THE system SHALL áp dụng rate limiting nghiêm ngặt cho API phục vụ Landing Page để ngăn chặn tấn công DDoS hoặc cào dữ liệu (scraping).
- **FR-015**: WHEN một địa chỉ IP vượt quá giới hạn request cho phép, THE system SHALL trả về mã lỗi 429 (Too Many Requests) với thông báo thân thiện "Bạn đang truy cập quá nhanh. Vui lòng thử lại sau vài giây."

### Key Entities *(Business Level Only)*

- **Event (Sự kiện tình nguyện)**: Đại diện cho một hoạt động tình nguyện cụ thể. Các thuộc tính chính bao gồm: tên sự kiện, mô tả ngắn, thời gian diễn ra, địa điểm, trạng thái (đang mở đăng ký / đã đóng / đã hoàn thành).
- **Guest (Khách vãng lai)**: Đại diện cho người dùng chưa đăng nhập. Guest không có mã định danh duy nhất và chỉ có quyền đọc nội dung công khai.
- **Volunteer (Tình nguyện viên)**: Đại diện cho người dùng đã đăng ký tài khoản và có thể tham gia các sự kiện tình nguyện. Quan hệ: Guest chuyển thành Volunteer sau khi hoàn tất đăng ký (UC04).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Guest có thể xem danh sách sự kiện tình nguyện trên Landing Page trong vòng 1 giây kể từ khi truy cập URL.
- **SC-002**: Tỷ lệ chuyển đổi từ Guest sang Volunteer (conversion rate) tăng ít nhất 20% sau khi triển khai Landing Page so với trước đó (đo bằng số lượng Guest nhấn nút "Tham gia ngay" và hoàn tất đăng ký).
- **SC-003**: API phục vụ Landing Page xử lý được ít nhất 1,000 request đồng thời mà không gây giảm hiệu năng (response time vẫn dưới 1 giây).
- **SC-004**: 100% thông tin nhạy cảm (danh sách tình nguyện viên, email, số điện thoại) KHÔNG bao giờ bị lộ qua API Landing Page (verified qua security audit).
- **SC-005**: Tỷ lệ bounce rate của Landing Page giảm xuống dưới 40% (đo bằng Google Analytics hoặc công cụ tương đương).

---

## Assumptions

- **Giả định về dữ liệu sự kiện**: Giả định rằng hệ thống luôn có ít nhất một số sự kiện đang mở đăng ký để hiển thị trên Landing Page. Nếu không có sự kiện nào, hệ thống sẽ hiển thị thông báo thân thiện thay vì để trống.
- **Giả định về kết nối internet**: Giả định rằng Guest có kết nối internet ổn định với băng thông tối thiểu 1 Mbps để tải trang trong vòng 1 giây.
- **Giả định về trình duyệt**: Giả định rằng Guest sử dụng các trình duyệt hiện đại (Chrome, Firefox, Safari, Edge phiên bản mới nhất) có hỗ trợ JavaScript và cookie.
- **Giả định về module phụ thuộc**: Giả định rằng Module 2 (Event Management) đã cung cấp API hoặc service contract để Module 1 (Authentication) có thể truy xuất danh sách sự kiện công khai.
- **Giả định về cơ chế cache**: Giả định rằng hệ thống sẽ áp dụng cơ chế cache (ví dụ: Redis, CDN, browser cache) để tối ưu hiệu năng cho API Landing Page thay vì query database mỗi lần Guest truy cập.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của feature này và KHÔNG được implement:

- **Chức năng tìm kiếm hoặc lọc sự kiện nâng cao**: Chức năng này sẽ được xử lý trong UC10 (Search Events) và UC11 (Filter Events). Landing Page chỉ hiển thị danh sách sự kiện mặc định (6 sự kiện mới nhất).
- **Hiển thị nội dung cá nhân hóa (Personalization)**: Chức năng hiển thị gợi ý sự kiện dựa trên sở thích cá nhân, thông báo, hoặc lịch sử tham gia sẽ được xử lý trong UC02 (Home Page) dành cho Volunteer đã đăng nhập. Landing Page chỉ phục vụ Guest chưa đăng nhập và không có dữ liệu cá nhân.
- **Logic đăng ký tài khoản hoặc đăng nhập trực tiếp trên Landing Page**: Landing Page chỉ chứa nút "Tham gia ngay" hoặc "Đăng nhập" để chuyển hướng Guest đến UC03 (Login) hoặc UC04 (Register). Toàn bộ logic xác thực và tạo tài khoản sẽ nằm trong UC03 và UC04.
- **Chi tiết sự kiện đầy đủ**: Landing Page chỉ hiển thị thông tin cơ bản của sự kiện (tên, mô tả ngắn, thời gian, địa điểm). Guest muốn xem chi tiết đầy đủ sẽ cần chuyển đến trang Event Detail (UC09).
- **Chức năng đăng ký tham gia sự kiện trực tiếp**: Guest không thể đăng ký tham gia sự kiện trực tiếp từ Landing Page. Họ phải hoàn tất đăng ký tài khoản (UC04) và đăng nhập (UC03) trước khi có thể tham gia sự kiện.
- **Multilingual support (Đa ngôn ngữ)**: Landing Page sẽ chỉ hỗ trợ tiếng Việt trong phiên bản đầu tiên. Hỗ trợ đa ngôn ngữ sẽ được xem xét trong các phiên bản sau.
- **Real-time updates (Cập nhật thời gian thực)**: Danh sách sự kiện trên Landing Page sẽ không tự động cập nhật theo thời gian thực (WebSocket, SSE). Guest cần refresh trang để xem dữ liệu mới nhất.

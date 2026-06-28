# Feature Specification: UC02 - View Home Page (Dashboard)

**Feature Branch**: `005-view-home-page`

**Created**: 2026-06-28

**Status**: ACCEPTED

**Input**: User description: "UC02: View Home Page (Dashboard) - Trang chủ sau đăng nhập với Dashboard phân quyền theo vai trò người dùng"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Volunteer xem Dashboard cá nhân (Priority: P1)

Khi Volunteer đăng nhập thành công, hệ thống hiển thị Dashboard cá nhân với các thông tin quan trọng nhất: sự kiện đã đăng ký sắp diễn ra, các cơ hội tình nguyện phù hợp, và tóm tắt giờ đóng góp của họ. Đây là trạm điều khiển trung tâm giúp Volunteer nhanh chóng nắm bắt lịch trình và tiến độ cá nhân mà không cần truy cập sâu vào từng module.

**Why this priority**: Đây là use case phổ biến nhất (majority của users là Volunteer), mang lại giá trị trực tiếp cho người dùng cuối, và là nền tảng để kiểm tra cơ chế phân quyền Dashboard.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập với tài khoản Volunteer, xác nhận 3 khối widget hiển thị đúng (Sự kiện sắp tới, Gợi ý việc làm, Tóm tắt giờ), và verify dữ liệu được load từ các Service tương ứng.

**Acceptance Scenarios**:

1. **Given** người dùng có JWT hợp lệ với role là "Volunteer" và đã đăng ký ít nhất 1 sự kiện, **When** truy cập trang Home Page, **Then** hệ thống hiển thị Dashboard với 3 khối: "Sự kiện sắp tới" (danh sách các sự kiện đã đăng ký), "Gợi ý việc làm mới" (các sự kiện phù hợp chưa đăng ký), và "Tóm tắt giờ đóng góp" (tổng giờ tình nguyện đã hoàn thành).

2. **Given** người dùng có JWT hợp lệ với role là "Volunteer" nhưng chưa có dữ liệu hoạt động (tài khoản mới), **When** truy cập trang Home Page, **Then** hệ thống hiển thị Empty State với thông báo thân thiện "Bạn chưa tham gia sự kiện nào" và các CTA (Call to Action) như "Khám phá sự kiện ngay" để hướng dẫn người dùng bắt đầu.

3. **Given** người dùng có JWT hợp lệ với role là "Volunteer", **When** nhấn nút Refresh hoặc reload trang, **Then** hệ thống load lại dữ liệu mới nhất từ các Service mà không yêu cầu đăng nhập lại.

---

### User Story 2 - Staff/Manager xem Dashboard quản lý (Priority: P1)

Khi Staff hoặc Manager đăng nhập thành công, hệ thống hiển thị Dashboard quản lý với các công việc cần xử lý ngay: danh sách đơn đăng ký chờ duyệt (Top 5 mới nhất) và các sự kiện đang quản lý. Điều này giúp Staff nhanh chóng nhận diện workload và ưu tiên công việc quan trọng.

**Why this priority**: Staff/Manager cần công cụ để theo dõi workflow approval và quản lý event, đây là chức năng core cho operational efficiency. Priority P1 vì có giá trị tương đương với Volunteer Dashboard.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập với tài khoản Staff, xác nhận 2 khối widget hiển thị đúng (Đơn đăng ký chờ duyệt, Sự kiện đang quản lý), và verify danh sách được load từ Service tương ứng theo quyền của Staff.

**Acceptance Scenarios**:

1. **Given** người dùng có JWT hợp lệ với role là "Staff" hoặc "Manager" và có ít nhất 1 đơn đăng ký chờ duyệt, **When** truy cập trang Home Page, **Then** hệ thống hiển thị Dashboard với 2 khối: "Đơn đăng ký chờ duyệt" (Top 5 đơn mới nhất với thông tin cơ bản: tên Volunteer, sự kiện, thời gian đăng ký) và "Sự kiện đang quản lý" (danh sách các sự kiện mà Staff có quyền quản lý).

2. **Given** người dùng có JWT hợp lệ với role là "Staff" nhưng không có đơn đăng ký nào chờ duyệt, **When** truy cập trang Home Page, **Then** hệ thống hiển thị Empty State cho khối "Đơn đăng ký chờ duyệt" với thông báo "Không có đơn đăng ký mới" và vẫn hiển thị khối "Sự kiện đang quản lý".

3. **Given** người dùng có JWT hợp lệ với role là "Staff", **When** click vào một đơn đăng ký trong danh sách, **Then** hệ thống điều hướng đến trang chi tiết đơn đăng ký để xử lý (approve/reject).

---

### User Story 3 - Admin xem Dashboard hệ thống (Priority: P2)

Khi Admin đăng nhập thành công, hệ thống hiển thị Dashboard với dữ liệu tổng hợp toàn hệ thống: số lượng user mới trong tháng, tổng số sự kiện đang hoạt động, và các chỉ số quan trọng khác. Điều này giúp Admin theo dõi sức khỏe hệ thống và phát hiện sớm các vấn đề.

**Why this priority**: Admin Dashboard cung cấp overview quan trọng cho operational monitoring, nhưng có tần suất sử dụng thấp hơn Volunteer/Staff Dashboard. Priority P2 vì có thể defer sau khi 2 dashboard chính đã ổn định.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập với tài khoản Admin, xác nhận các khối thống kê hệ thống hiển thị đúng (Số user mới, Tổng sự kiện, v.v.), và verify dữ liệu được load từ StatsService của Member 5.

**Acceptance Scenarios**:

1. **Given** người dùng có JWT hợp lệ với role là "Admin", **When** truy cập trang Home Page, **Then** hệ thống hiển thị Dashboard với các khối thống kê: "Số user mới trong tháng", "Tổng số sự kiện đang hoạt động", "Tổng giờ tình nguyện trong tháng", và các biểu đồ tóm tắt hoạt động hệ thống.

2. **Given** người dùng có JWT hợp lệ với role là "Admin", **When** Service thống kê của Member 5 gặp lỗi (timeout hoặc unavailable), **Then** hệ thống hiển thị thông báo lỗi thân thiện "Không thể tải dữ liệu thống kê. Vui lòng thử lại sau" và vẫn giữ layout Dashboard (không crash toàn bộ trang).

3. **Given** người dùng có JWT hợp lệ với role là "Admin", **When** nhấn vào một khối thống kê (ví dụ: "Số user mới"), **Then** hệ thống điều hướng đến trang báo cáo chi tiết tương ứng (nếu có).

---

### Edge Cases

- **JWT hết hạn**: WHEN người dùng truy cập Home Page với JWT đã hết hạn, THE system SHALL tự động điều hướng về trang Landing Page (UC01) và hiển thị thông báo "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại".

- **Người dùng mới không có dữ liệu (Empty State)**: WHEN người dùng mới đăng nhập lần đầu và chưa có dữ liệu hoạt động, THE system SHALL hiển thị Empty State với các CTA phù hợp (ví dụ: "Khám phá sự kiện", "Tìm hiểu thêm") thay vì để màn hình trắng hoặc widget trống.

- **Service của module khác bị lỗi**: WHEN một Service bên ngoài (EventService, NotificationService, StatsService) trả về lỗi hoặc timeout, THE system SHALL hiển thị thông báo lỗi thân thiện cho khối widget tương ứng và KHÔNG làm crash toàn bộ Dashboard. Các khối widget khác vẫn hoạt động bình thường.

- **Người dùng không có JWT (chưa đăng nhập)**: WHEN người dùng truy cập Home Page mà không có JWT trong HttpOnly Cookie, THE system SHALL tự động điều hướng về trang Landing Page (UC01) mà không hiển thị Dashboard.

- **Role không hợp lệ hoặc không xác định**: WHEN JWT chứa role không nằm trong danh sách hợp lệ (Volunteer, Staff, Manager, Admin), THE system SHALL hiển thị thông báo lỗi "Quyền truy cập không hợp lệ" và điều hướng về trang Landing Page.

- **Network timeout khi load Dashboard**: WHEN request đến Backend để load dữ liệu Dashboard bị timeout (vượt quá 10 giây), THE system SHALL hiển thị thông báo "Kết nối chậm. Vui lòng thử lại" và cung cấp nút Retry.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: WHEN người dùng có JWT hợp lệ với role là "Volunteer" truy cập Home Page, THE system SHALL hiển thị Dashboard với 3 khối widget: "Sự kiện sắp tới", "Gợi ý việc làm mới", và "Tóm tắt giờ đóng góp".

- **FR-002**: WHEN người dùng có JWT hợp lệ với role là "Staff" hoặc "Manager" truy cập Home Page, THE system SHALL hiển thị Dashboard với 2 khối widget: "Đơn đăng ký chờ duyệt" (Top 5 mới nhất) và "Sự kiện đang quản lý".

- **FR-003**: WHEN người dùng có JWT hợp lệ với role là "Admin" truy cập Home Page, THE system SHALL hiển thị Dashboard với các khối thống kê hệ thống: "Số user mới trong tháng", "Tổng số sự kiện đang hoạt động", "Tổng giờ tình nguyện trong tháng".

- **FR-004**: THE system SHALL lấy định danh người dùng (userId) và vai trò (role) DUY NHẤT từ JWT được giải mã bởi middleware authentication, và SHALL NOT tin tưởng thông tin từ request body hoặc query parameter.

- **FR-005**: WHEN người dùng truy cập Home Page mà không có JWT trong HttpOnly Cookie, THE system SHALL tự động điều hướng về trang Landing Page (UC01) mà không hiển thị Dashboard.

- **FR-006**: WHERE JWT đã hết hạn hoặc không hợp lệ, THE system SHALL tự động điều hướng về trang Landing Page và hiển thị thông báo "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại".

- **FR-007**: WHEN người dùng mới chưa có dữ liệu hoạt động (tài khoản mới), THE system SHALL hiển thị Empty State với thông báo thân thiện và các CTA như "Khám phá sự kiện ngay" thay vì để màn hình trắng.

- **FR-008**: WHERE một Service bên ngoài (EventService, NotificationService, StatsService) trả về lỗi hoặc timeout, THE system SHALL hiển thị thông báo lỗi thân thiện cho khối widget tương ứng và SHALL NOT làm crash toàn bộ Dashboard.

- **FR-009**: THE system SHALL gọi các Service tương ứng qua Service layer contracts để lấy dữ liệu cho Dashboard, và SHALL NOT truy vấn trực tiếp Repository của module khác.

- **FR-010**: WHEN người dùng nhấn nút Refresh hoặc reload trang Home Page, THE system SHALL load lại dữ liệu mới nhất từ các Service mà không yêu cầu người dùng đăng nhập lại.

- **FR-011**: THE system SHALL sử dụng hàm tiện ích response.util.js để trả về response theo chuẩn format `{ success, data, error }`.

- **FR-012**: THE system SHALL hiển thị Dashboard với thời gian load trang dưới 500ms cho trường hợp có dữ liệu bình thường (không tính thời gian network latency).

- **FR-013**: WHERE role trong JWT không nằm trong danh sách hợp lệ (Volunteer, Staff, Manager, Admin), THE system SHALL hiển thị thông báo lỗi "Quyền truy cập không hợp lệ" và điều hướng về Landing Page.

- **FR-014**: THE system SHALL cố định vị trí các khối widget theo thiết kế chuẩn cho từng role và SHALL NOT cho phép người dùng tùy chỉnh vị trí widget trong phiên bản này.

- **FR-015**: THE system SHALL load dữ liệu Dashboard bằng cách fetch mỗi khi người dùng tải trang hoặc nhấn Refresh, và SHALL NOT sử dụng Socket.io hoặc realtime update trong phiên bản này.

### Key Entities *(Business Level Only)*

- **Dashboard**: Trạm điều khiển trung tâm hiển thị thông tin tổng hợp quan trọng nhất cho người dùng sau khi đăng nhập. Bao gồm các khối widget khác nhau tùy thuộc vào vai trò người dùng.

- **Widget**: Khối thông tin độc lập trên Dashboard, mỗi widget hiển thị một loại dữ liệu cụ thể (ví dụ: Sự kiện sắp tới, Đơn đăng ký chờ duyệt, Thống kê hệ thống). Dữ liệu của widget được lấy từ các Service tương ứng.

- **Role-Based View**: Cơ chế phân quyền hiển thị nội dung Dashboard dựa trên vai trò người dùng (Volunteer, Staff, Manager, Admin). Mỗi role có bộ widget riêng phù hợp với nhu cầu công việc.

- **Empty State**: Trạng thái hiển thị khi người dùng chưa có dữ liệu hoạt động. Bao gồm thông báo thân thiện và các CTA để hướng dẫn người dùng bắt đầu sử dụng hệ thống.

- **Summary Data**: Dữ liệu tóm tắt được cung cấp bởi các Service bên ngoài (EventService, NotificationService, StatsService) để hiển thị trên Dashboard. Bao gồm thông tin như: danh sách sự kiện, số liệu thống kê, đơn đăng ký chờ duyệt.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người dùng có thể xem Dashboard phù hợp với vai trò của họ ngay sau khi đăng nhập thành công trong vòng 1 giây (không tính network latency).

- **SC-002**: 100% các trường hợp đăng nhập với JWT hợp lệ sẽ hiển thị đúng Dashboard tương ứng với role (Volunteer, Staff, Manager, Admin) mà không có lỗi hiển thị sai nội dung.

- **SC-003**: Hệ thống xử lý được ít nhất 500 người dùng đồng thời truy cập Home Page mà không bị degradation về performance (response time vẫn dưới 500ms).

- **SC-004**: Khi một Service bên ngoài gặp lỗi, Dashboard vẫn hiển thị các widget khác bình thường và không crash toàn bộ trang (graceful degradation rate 100%).

- **SC-005**: 90% người dùng mới (chưa có dữ liệu hoạt động) sẽ click vào CTA trên Empty State để bắt đầu khám phá hệ thống (đo lường qua click-through rate).

- **SC-006**: Thời gian load Dashboard trung bình dưới 500ms cho các trường hợp có dữ liệu bình thường (đo lường từ khi request được gửi đến khi tất cả widget hiển thị xong).

- **SC-007**: 0% trường hợp hệ thống tin tưởng userId hoặc role từ request body/query parameter (100% tuân thủ security contract - lấy từ JWT).

## Assumptions

- Giả định rằng API của các module khác (EventService, NotificationService, StatsService) đã có sẵn các phương thức cung cấp dữ liệu tóm tắt (summary data) cho Dashboard.

- Giả định rằng JWT HttpOnly Cookie đã được thiết lập đúng cách bởi Auth module (Member 1) và middleware authentication đã sẵn sàng để giải mã JWT.

- Giả định rằng người dùng truy cập Home Page từ trình duyệt hỗ trợ HttpOnly Cookie và có JavaScript được bật.

- Giả định rằng trang Landing Page (UC01) đã được implement và có thể điều hướng về khi cần (khi JWT hết hạn hoặc người dùng chưa đăng nhập).

- Giả định rằng StatsService của Member 5 đã có sẵn các API cung cấp dữ liệu thống kê hệ thống cho Admin Dashboard.

- Giả định rằng Frontend sử dụng React + Bootstrap 5 và có thể render các khối widget một cách responsive trên các thiết bị khác nhau.

- Giả định rằng Backend sẽ trả về response theo chuẩn format `{ success, data, error }` như đã định nghĩa trong response.util.js.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của feature này và KHÔNG được implement:

- **Tùy chỉnh vị trí widget**: Người dùng không thể kéo thả hoặc sắp xếp lại vị trí các khối widget. Vị trí được cố định theo thiết kế chuẩn. (Lý do: Quá phức tạp cho v1, có thể xem xét trong v2 nếu có nhu cầu từ user feedback).

- **Realtime update qua Socket.io**: Dữ liệu Dashboard không tự động cập nhật theo thời gian thực. Người dùng phải reload trang hoặc nhấn Refresh để load dữ liệu mới. (Lý do: Tối ưu tài nguyên, realtime không cần thiết cho Dashboard summary data trong giai đoạn này).

- **Biểu đồ phức tạp (Advanced Charts)**: Admin Dashboard chỉ hiển thị các số liệu thống kê cơ bản, không có biểu đồ tương tác phức tạp (line chart, pie chart với drill-down). (Lý do: Sẽ được implement trong UC54 của Member 5 về Reports & Analytics).

- **Notification Center**: Dashboard không tích hợp Notification Center để hiển thị thông báo realtime. (Lý do: Notification feature sẽ được implement riêng trong UC khác).

- **Personalization (AI-based recommendations)**: Gợi ý việc làm cho Volunteer không sử dụng AI hoặc machine learning, chỉ dựa trên matching đơn giản (skills, location, availability). (Lý do: AI recommendation quá phức tạp cho MVP, có thể xem xét trong tương lai).

- **Export Dashboard data**: Người dùng không thể export dữ liệu Dashboard ra file (CSV, PDF). (Lý do: Export functionality sẽ được xem xét trong phase sau khi có yêu cầu cụ thể từ stakeholders).

- **Dark mode toggle**: Dashboard không có chức năng chuyển đổi theme (light/dark mode). (Lý do: UI customization không phải priority cho v1, có thể defer đến v2).

- **Multi-language support**: Dashboard chỉ hỗ trợ tiếng Việt trong phiên bản này. (Lý do: Internationalization sẽ được xử lý trong project-wide initiative sau này, không riêng cho UC02).

# Feature Specification: Reports & Dashboard (UC54–UC57)

**Feature Branch**: `feat/reports-dashboard`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Admin và Manager cần dashboard tổng quan, thống kê sự kiện, thống kê tình nguyện viên, và xuất báo cáo dạng file."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem Dashboard tổng quan (Priority: P1)

Là Admin/Manager, tôi muốn xem dashboard tổng quan với các chỉ số KPI chính (tổng sự kiện, tổng user, tổng quyên góp, tỷ lệ điểm danh) và biểu đồ trực quan, để nắm bắt nhanh tình trạng hoạt động của hệ thống.

**Why this priority**: Dashboard là entry point của module Reports — nếu không có dashboard, Admin/Manager không có cái nhìn tổng quan về hệ thống. Đây là chức năng quan trọng nhất trong module này.

**Independent Test**: Có thể test độc lập bằng cách gọi API GET /api/v1/dashboard/summary với token Admin, kiểm tra response trả về đầy đủ các KPI metrics.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập và hệ thống có dữ liệu đầy đủ, **When** Admin truy cập trang Dashboard, **Then** hệ thống hiển thị 5 KPI cards: (1) Tổng sự kiện (kèm phân bố theo trạng thái), (2) Tổng người dùng (kèm phân bố theo role), (3) Tổng đơn đăng ký (kèm tỷ lệ duyệt/từ chối), (4) Tổng quyên góp trong tháng, (5) Tỷ lệ điểm danh trung bình (%).

2. **Given** Admin truy cập Dashboard, **When** trang dashboard load, **Then** hệ thống hiển thị 3 biểu đồ: (a) Bar chart — Số sự kiện theo tháng (12 tháng gần nhất), (b) Line chart — User mới theo tháng (12 tháng gần nhất), (c) Pie chart — Phân bố đơn đăng ký (Approved/Rejected/Pending).

3. **Given** Manager đã đăng nhập, **When** Manager truy cập Dashboard, **Then** hệ thống chỉ hiển thị dữ liệu trong phạm vi quản lý của Manager đó (không thấy dữ liệu toàn hệ thống).

4. **Given** hệ thống chưa có dữ liệu, **When** Admin truy cập Dashboard, **Then** KPI cards hiển thị giá trị 0 và biểu đồ trống, kèm thông báo "Chưa có dữ liệu để hiển thị."

5. **Given** Dashboard đã được cache 5 phút trước, **When** Admin nhấn nút "Làm mới" (Refresh), **Then** hệ thống force refresh data, bỏ qua cache, và hiển thị dữ liệu mới nhất.

6. **Given** Staff hoặc Volunteer cố gắng truy cập Dashboard API, **When** họ gửi request, **Then** hệ thống trả về HTTP 403 Forbidden.

---

### User Story 2 - Xem thống kê sự kiện (Priority: P1)

Là Admin/Manager, tôi muốn xem thống kê chi tiết về sự kiện (số lượng sự kiện theo thời gian, tỷ lệ hoàn thành, sự kiện phổ biến) để đánh giá hiệu quả tổ chức sự kiện.

**Why this priority**: Thống kê sự kiện cung cấp insight quan trọng cho việc ra quyết định — biết được mùa nào có nhiều sự kiện, loại sự kiện nào thu hút nhiều volunteer nhất.

**Independent Test**: Test độc lập bằng cách gọi API GET /api/v1/dashboard/event-stats với tham số thời gian và kiểm tra response chứa dữ liệu aggregate.

**Acceptance Scenarios**:

1. **Given** hệ thống có dữ liệu sự kiện từ năm trước, **When** Admin truy cập trang Event Statistics, **Then** hệ thống hiển thị: (a) Số lượng sự kiện theo tháng trong năm hiện tại, (b) Tỷ lệ sự kiện hoàn thành (%), (c) Top 5 sự kiện có nhiều người đăng ký nhất.

2. **Given** Admin muốn xem thống kê theo khoảng thời gian tùy chỉnh, **When** Admin chọn từ ngày 01/01/2026 đến 30/06/2026, **Then** hệ thống hiển thị thống kê trong khoảng thời gian đã chọn.

3. **Given** không có sự kiện nào trong khoảng thời gian đã chọn, **When** Admin xem thống kê, **Then** hệ thống hiển thị thông báo "Không có dữ liệu sự kiện trong khoảng thời gian này."

4. **Given** Manager xem Event Statistics, **When** Manager chọn thời gian, **Then** hệ thống chỉ thống kê các sự kiện thuộc phạm vi quản lý của Manager.

---

### User Story 3 - Xem thống kê tình nguyện viên (Priority: P2)

Là Admin/Manager, tôi muốn xem thống kê về tình nguyện viên (số lượng đăng ký mới, tỷ lệ tham gia, top volunteer tích cực) để đánh giá sự phát triển của cộng đồng tình nguyện viên.

**Why this priority**: Thống kê volunteer quan trọng để hiểu xu hướng phát triển, nhưng ít khẩn cấp hơn Event Statistics và Dashboard tổng quan.

**Independent Test**: Test độc lập bằng cách gọi API GET /api/v1/dashboard/volunteer-stats và kiểm tra response chứa dữ liệu aggregate về volunteer.

**Acceptance Scenarios**:

1. **Given** hệ thống có dữ liệu user, **When** Admin truy cập trang Volunteer Statistics, **Then** hệ thống hiển thị: (a) Số lượng user mới đăng ký theo tháng (12 tháng gần nhất), (b) Tổng số volunteer active, (c) Tỷ lệ volunteer đã tham gia ít nhất 1 sự kiện / tổng số volunteer, (d) Top 5 volunteer có số sự kiện tham gia nhiều nhất.

2. **Given** Admin muốn lọc thống kê theo năm, **When** Admin chọn năm 2025, **Then** hệ thống hiển thị dữ liệu của năm 2025.

3. **Given** không có dữ liệu volunteer mới, **When** Admin xem thống kê, **Then** các chỉ số hiển thị 0 và biểu đồ trống kèm thông báo phù hợp.

---

### User Story 4 - Xuất báo cáo (Export Reports) (Priority: P2)

Là Admin/Manager, tôi muốn xuất báo cáo dạng file (CSV/Excel) về danh sách sự kiện, danh sách volunteer, báo cáo quyên góp, và báo cáo điểm danh để chia sẻ với các bên liên quan hoặc lưu trữ.

**Why this priority**: Export là chức năng quan trọng nhưng không phải ai cũng dùng hàng ngày. Dashboard và thống kê có giá trị cao hơn cho việc ra quyết định nhanh.

**Independent Test**: Test độc lập bằng cách gọi API GET /api/v1/reports/export?type=events&format=csv và kiểm tra file CSV được download.

**Acceptance Scenarios**:

1. **Given** Admin muốn xuất danh sách sự kiện, **When** Admin chọn "Xuất báo cáo sự kiện" và định dạng Excel (.xlsx), **Then** hệ thống tạo file Excel chứa danh sách sự kiện (tên, tổ chức, thời gian, địa điểm, trạng thái, số lượng đăng ký) và tự động download file.

2. **Given** Admin muốn xuất báo cáo quyên góp, **When** Admin chọn khoảng thời gian (01/01/2026 → 30/06/2026) và định dạng CSV, **Then** hệ thống tạo file CSV chứa danh sách giao dịch quyên góp trong khoảng thời gian và download.

3. **Given** Manager muốn xuất danh sách volunteer, **When** Manager chọn xuất, **Then** hệ thống chỉ xuất dữ liệu volunteer thuộc phạm vi quản lý.

4. **Given** Admin chọn xuất báo cáo với khoảng thời gian không có dữ liệu, **Then** hệ thống tạo file với header + dòng "Không có dữ liệu" hoặc thông báo "Không có dữ liệu để xuất."

5. **Given** User là Staff hoặc Volunteer, **When** họ cố gắng export, **Then** hệ thống trả về HTTP 403 Forbidden.

6. **Given** Admin chọn export với bộ lọc phức tạp (ví dụ: danh sách volunteer đã tham gia ít nhất 2 sự kiện trong tháng 6/2026), **When** Admin submit, **Then** hệ thống áp dụng bộ lọc và export đúng dữ liệu.

---

### Edge Cases

- **Cache inconsistency:** Khi có sự kiện mới tạo, dashboard có thể chưa cập nhật ngay (TTL 5 phút). User có thể nhấn "Refresh" để lấy dữ liệu mới nhất.
- **Export file size lớn:** Nếu dữ liệu export quá lớn (>1000 dòng), hệ thống vẫn export đầy đủ. Nếu >10,000 dòng, hệ thống có thể split thành nhiều file hoặc export async (gửi email khi hoàn thành — deferred).
- **Manager không có dữ liệu:** Manager mới không quản lý staff/event nào — dashboard và export trả về 0 hoặc rỗng, không lỗi.
- **Kết nối database timeout:** Nếu query aggregate mất quá nhiều thời gian (>10 giây), hệ thống trả về HTTP 504 Gateway Timeout và log lỗi.

---

## Requirements *(mandatory)*

### Functional Requirements

#### UC54 — Xem Dashboard (View Dashboard)

- **FR-001**: THE system SHALL cung cấp endpoint GET /api/v1/dashboard/summary trả về các KPI metrics: total_events (kèm phân bố theo status), total_users (kèm phân bố theo role_id), total_applications (kèm phân bố theo status), total_donations_current_month, average_attendance_rate.
- **FR-002**: THE system SHALL cung cấp endpoint GET /api/v1/dashboard/events-by-month trả về số lượng sự kiện theo từng tháng trong 12 tháng gần nhất.
- **FR-003**: THE system SHALL cung cấp endpoint GET /api/v1/dashboard/users-by-month trả về số lượng user mới theo từng tháng trong 12 tháng gần nhất.
- **FR-004**: THE system SHALL cung cấp endpoint GET /api/v1/dashboard/application-distribution trả về phân bố đơn đăng ký theo status (Approved, Rejected, Pending).
- **FR-005**: WHERE user là Admin, THE system SHALL trả về dữ liệu toàn hệ thống.
- **FR-006**: WHERE user là Manager, THE system SHALL chỉ trả về dữ liệu trong phạm vi quản lý (events thuộc staff của Manager đó).
- **FR-007**: WHERE user không có role Admin hoặc Manager, THE system SHALL trả về HTTP 403.
- **FR-008**: THE system SHALL cache dữ liệu dashboard với TTL 5 phút. User có thể force refresh bằng query param `?refresh=true`.

#### UC55 — Thống kê sự kiện (Event Statistics)

- **FR-009**: THE system SHALL cung cấp endpoint GET /api/v1/dashboard/event-stats với tham số `start_date`, `end_date`, `organization_id` (optional).
- **FR-010**: THE system SHALL trả về: total_events, completion_rate (%), top_5_events_by_registrations, events_by_status, events_by_month.
- **FR-011**: WHERE không có dữ liệu trong khoảng thời gian, THE system SHALL trả về object với các giá trị mặc định (0 hoặc mảng rỗng).

#### UC56 — Thống kê tình nguyện viên (Volunteer Statistics)

- **FR-012**: THE system SHALL cung cấp endpoint GET /api/v1/dashboard/volunteer-stats với tham số `year` (optional, mặc định năm hiện tại).
- **FR-013**: THE system SHALL trả về: new_volunteers_by_month, total_active_volunteers, participation_rate (%), top_5_volunteers_by_events (kèm số sự kiện đã tham gia).
- **FR-014**: WHERE không có dữ liệu, THE system SHALL trả về object với giá trị mặc định.

#### UC57 — Xuất báo cáo (Export Reports)

- **FR-015**: THE system SHALL cung cấp endpoint GET /api/v1/reports/export với các tham số: type (required: events | volunteers | donations | attendance), format (required: csv | xlsx), start_date (optional), end_date (optional), organization_id (optional).
- **FR-016**: WHERE format = csv, THE system SHALL trả về Content-Type: text/csv và filename đúng (ví dụ: event-report-2026-06-26.csv).
- **FR-017**: WHERE format = xlsx, THE system SHALL trả về Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet với filename đúng.
- **FR-018**: WHERE không có dữ liệu để export, THE system SHALL tạo file với header và một dòng thông báo "Không có dữ liệu."
- **FR-019**: WHERE user là Manager, THE system SHALL chỉ export dữ liệu trong phạm vi quản lý.
- **FR-020**: WHERE user không có role Admin hoặc Manager, THE system SHALL trả về HTTP 403.

### Key Entities *(Business Level Only)*

- **Dashboard Metrics**: Tập hợp các chỉ số KPI tổng quan từ nhiều nguồn dữ liệu (Event, User, Application, Donation, Attendance). Không phải entity vật lý — là dữ liệu aggregate.

- **Report (Báo cáo)**: Là dữ liệu xuất ra dạng file từ các thống kê. Không phải entity lưu trong database — được generate on-demand và trả về dạng file download.

- **Event/User/Application/Donation/Attendance**: Các entity nghiệp vụ cung cấp dữ liệu nguồn cho Dashboard và Reports.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dashboard tải hoàn chỉnh (KPI + biểu đồ) trong vòng 2 giây với cache hit, 5 giây với cache miss (cold start).
- **SC-002**: Export báo cáo 1000 dòng hoàn thành trong vòng 3 giây.
- **SC-003**: 100% endpoint dashboard/export được document đầy đủ trong Swagger JSDoc.
- **SC-004**: Cache hit rate cho dashboard ≥ 80% (cache TTL 5 phút).
- **SC-005**: Phân quyền Admin/Manager được kiểm tra và pass cho mọi endpoint (không có leak dữ liệu).

---

## Assumptions

- **A-001**: Các module Event, User, Application, Attendance, Donation đã có dữ liệu trong database.
- **A-002**: Cache service (Redis) đã sẵn sàng trong project.
- **A-003**: Thư viện ExcelJS và json2csv (hoặc tương đương) đã được cài đặt trong backend.
- **A-004**: Frontend có thư viện chart (Chart.js/Recharts) để vẽ biểu đồ.
- **A-005**: User không cần real-time — cache 5 phút chấp nhận được.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của feature này và KHÔNG được implement:

- **PDF export:** Xuất PDF sẽ được xem xét trong phiên bản sau. V1 chỉ hỗ trợ CSV và Excel.
- **Scheduled report (báo cáo định kỳ tự động gửi email):** Manager phải tự vào hệ thống để export thủ công.
- **Dashboard customization (kéo thả widget, chọn KPI hiển thị):** Dashboard cố định các KPI và biểu đồ đã định nghĩa.
- **Real-time dashboard (WebSocket):** Không có real-time — cache 5 phút + nút Refresh.
- **So sánh dữ liệu (YoY, MoM):** Chỉ hiển thị dữ liệu gốc, không có tính năng so sánh tự động.
- **Export PDF = Preview trước khi export:** Không có preview — export trực tiếp.
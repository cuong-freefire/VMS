# Feature Specification: Export Reports (UC57)

**Feature Branch**: `feat/uc57-export-reports`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Admin và Manager cần xuất báo cáo dạng file CSV hoặc Excel từ dữ liệu thống kê để phục vụ báo cáo định kỳ."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export danh sách sự kiện ra CSV (Priority: P1)

Admin muốn xuất danh sách sự kiện ra file CSV để gửi cho ban lãnh đạo.

**Why this priority**: Export là tính năng quan trọng giúp người dùng khai thác dữ liệu ngoài hệ thống. CSV là format phổ biến nhất, dễ mở bằng Excel.

**Independent Test**: Gọi `GET /api/v1/reports/export?type=events&format=csv` với token Admin, kiểm tra response có Content-Type `text/csv` và filename đúng format.

**Acceptance Scenarios**:

1. **Given** Admin muốn export danh sách sự kiện, **When** Admin chọn type = "events", format = "csv", và submit, **Then** hệ thống tạo file CSV với header (Tên sự kiện, Ngày bắt đầu, Ngày kết thúc, Trạng thái, Tổ chức, Số lượng đăng ký) và dữ liệu tương ứng, trả về Content-Type: text/csv và filename: `events-report-2026-06-28.csv`.
2. **Given** Admin muốn export theo khoảng thời gian, **When** Admin thêm start_date và end_date, **Then** hệ thống chỉ export các sự kiện trong khoảng đó.
3. **Given** không có dữ liệu trong khoảng thời gian, **When** Admin export, **Then** hệ thống tạo file chỉ có header và một dòng "Không có dữ liệu."

---

### User Story 2 - Export báo cáo quyên góp ra Excel (Priority: P1)

Admin muốn xuất báo cáo quyên góp ra file Excel (.xlsx) để dễ dàng định dạng và tính toán.

**Why this priority**: Excel hỗ trợ định dạng và công thức tốt hơn CSV, phù hợp cho báo cáo tài chính.

**Independent Test**: Gọi `GET /api/v1/reports/export?type=donations&format=xlsx` với token Admin, kiểm tra Content-Type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

**Acceptance Scenarios**:

1. **Given** Admin chọn type = "donations", format = "xlsx", **When** Admin submit, **Then** hệ thống tạo file Excel với các cột (Mã giao dịch, Người quyên góp, Sự kiện, Số tiền, Cổng thanh toán, Trạng thái, Ngày tạo) và trả về file download.
2. **Given** Admin là Manager, **When** export donations, **Then** hệ thống chỉ export giao dịch của sự kiện thuộc tổ chức của Manager.

---

### User Story 3 - Export báo cáo volunteer và attendance (Priority: P2)

Manager muốn export danh sách volunteer và báo cáo điểm danh trong tổ chức mình.

**Why this priority**: Các báo cáo này hữu ích nhưng ít khẩn cấp hơn events và donations.

**Independent Test**: Gọi `GET /api/v1/reports/export?type=volunteers&format=csv` với token Manager, kiểm tra dữ liệu chỉ thuộc tổ chức Manager.

**Acceptance Scenarios**:

1. **Given** Manager chọn type = "volunteers", **When** export, **Then** hệ thống xuất danh sách volunteer (Tên, Email, Số điện thoại, Số sự kiện đã tham gia, Ngày đăng ký) của tổ chức Manager.
2. **Given** Manager chọn type = "attendance", **When** export, **Then** hệ thống xuất báo cáo điểm danh (Sự kiện, Tên volunteer, Thời gian check-in, Trạng thái) của tổ chức Manager.

---

### Edge Cases

- Điều gì xảy ra khi type không hợp lệ? → HTTP 400 "Loại báo cáo không hợp lệ."
- Điều gì xảy ra khi format không hợp lệ? → HTTP 400 "Định dạng không hợp lệ. Chỉ hỗ trợ csv và xlsx."
- Điều gì xảy ra khi data > 10,000 dòng? → HTTP 400 "Dữ liệu vượt quá 10,000 dòng. Vui lòng thu hẹp khoảng thời gian."
- Điều gì xảy ra khi Guest/Staff cố gắng export? → HTTP 401/403.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cung cấp endpoint `GET /api/v1/reports/export` với params: type (required), format (required), start_date (optional), end_date (optional), organization_id (optional).
- **FR-002**: System MUST hỗ trợ 4 type: events, volunteers, donations, attendance.
- **FR-003**: System MUST hỗ trợ 2 format: csv, xlsx.
- **FR-004**: WHERE format = csv, System MUST trả về Content-Type: text/csv và filename: `{type}-report-{YYYY-MM-DD}.csv`.
- **FR-005**: WHERE format = xlsx, System MUST trả về Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.
- **FR-006**: System MUST giới hạn 10,000 dòng mỗi lần export — nếu vượt quá, HTTP 400.
- **FR-007**: WHERE không có dữ liệu, System MUST tạo file với header và một dòng thông báo.
- **FR-008**: WHERE Manager, System MUST chỉ export dữ liệu trong organization của Manager.
- **FR-009**: System MUST từ chối Staff (403) và Guest (401).

### Key Entities *(Business Level Only)*

- **Event/Volunteer/Donation/Attendance**: Entities nguồn cho các loại báo cáo export.
- **Report File**: Đầu ra dạng file — không phải entity lưu trong database.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Export 1000 dòng hoàn thành trong vòng 3 giây.
- **SC-002**: File export mở được trên Excel và Google Sheets không báo lỗi encoding.
- **SC-003**: 100% request export có phân quyền đúng — Manager không thấy dữ liệu ngoài tổ chức.

## Assumptions

- ExcelJS và json2csv đã được cài đặt trong backend.
- Export là on-demand — không lưu file trên server (trả về stream/download ngay).
- Header tiếng Việt, font Unicode để hiển thị đúng trên Excel.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC57 và KHÔNG được implement:

- **PDF export**: Deferred.
- **Scheduled report (gửi email tự động)**: Export thủ công.
- **Preview trước khi export**: Export trực tiếp.
- **Export notification**: Không có notification sau khi export.
- **Custom columns**: Export tất cả cột mặc định.

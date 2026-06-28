# Feature Specification: View Dashboard (UC54)

**Feature Branch**: `feat/uc54-view-dashboard`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Admin và Manager cần dashboard tổng quan với các chỉ số KPI và biểu đồ trực quan để theo dõi tình trạng hệ thống."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin xem dashboard tổng quan toàn hệ thống (Priority: P1)

Admin muốn xem dashboard với 5 KPI cards và 3 biểu đồ để nắm bắt nhanh tình hình hoạt động của toàn bộ hệ thống VMS.

**Why this priority**: Dashboard là entry point của module Reports — Admin không có cái nhìn tổng quan nếu thiếu dashboard.

**Independent Test**: Gọi `GET /api/v1/dashboard/summary` với token Admin, kiểm tra response chứa đủ KPI metrics và dữ liệu biểu đồ.

**Acceptance Scenarios**:

1. **Given** hệ thống có dữ liệu đầy đủ, **When** Admin truy cập Dashboard, **Then** hệ thống hiển thị 5 KPI cards: (1) Tổng sự kiện (có phân bố theo trạng thái), (2) Tổng user (theo role), (3) Tổng đơn đăng ký (tỷ lệ duyệt/từ chối), (4) Tổng quyên góp trong tháng, (5) Tỷ lệ điểm danh trung bình (%).
2. **Given** Admin truy cập Dashboard, **When** trang load, **Then** hệ thống hiển thị 3 biểu đồ: (a) Bar chart — Số sự kiện theo tháng (12 tháng), (b) Line chart — User mới theo tháng (12 tháng), (c) Pie chart — Phân bố đơn (Approved/Rejected/Pending).
3. **Given** hệ thống chưa có dữ liệu, **When** Admin truy cập Dashboard, **Then** KPI cards hiển thị 0 và biểu đồ trống kèm thông báo "Chưa có dữ liệu."
4. **Given** Admin muốn làm mới dữ liệu, **When** Admin nhấn nút "Refresh", **Then** hệ thống bỏ qua cache và query dữ liệu mới nhất.

---

### User Story 2 - Manager xem dashboard trong phạm vi quản lý (Priority: P2)

Manager muốn xem dashboard chỉ hiển thị dữ liệu thuộc tổ chức của mình, không thấy dữ liệu của tổ chức khác.

**Why this priority**: Manager cần giới hạn phạm vi dữ liệu để tập trung vào tổ chức mình quản lý.

**Independent Test**: Gọi `GET /api/v1/dashboard/summary` với token Manager, kiểm tra dữ liệu chỉ thuộc organization của Manager.

**Acceptance Scenarios**:

1. **Given** Manager thuộc tổ chức A, **When** Manager truy cập Dashboard, **Then** chỉ hiển thị dữ liệu của tổ chức A (sự kiện, user, quyên góp, điểm danh của tổ chức A).
2. **Given** Manager không có dữ liệu, **When** Manager truy cập, **Then** hiển thị 0 và biểu đồ trống (không báo lỗi).
3. **Given** Staff hoặc Volunteer cố gắng truy cập Dashboard, **When** họ gửi request, **Then** hệ thống trả về HTTP 403.

---

### Edge Cases

- Điều gì xảy ra khi cache chưa được khởi tạo (lần đầu tiên)? → Query từ database, lưu cache, trả về.
- Điều gì xảy ra khi Redis không khả dụng? → Query từ database, bỏ qua cache, ghi log cảnh báo.
- Điều gì xảy ra khi database có hàng triệu bản ghi? → Query aggregate theo tháng, không query chi tiết.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cung cấp endpoint `GET /api/v1/dashboard/summary`.
- **FR-002**: System MUST trả về KPI metrics: total_events (kèm phân bố status), total_users (kèm phân bố role), total_applications (kèm phân bố status), total_donations_current_month, avg_attendance_rate (%).
- **FR-003**: System MUST trả về chart data: events_by_month (12 tháng), new_users_by_month (12 tháng), application_distribution (pie data).
- **FR-004**: System MUST cache response với TTL 5 phút.
- **FR-005**: WHERE query param `force=true`, System MUST bỏ qua cache và query từ database.
- **FR-006**: WHERE user là Manager, System MUST chỉ trả về dữ liệu trong organization của Manager.
- **FR-007**: System MUST từ chối Staff (403) và Guest (401).

### Key Entities *(Business Level Only)*

- **Dashboard Metrics**: Tập hợp KPI aggregate từ Event, User, Application, Donation, Attendance — không phải entity vật lý.
- **Event/User/Application/Donation/Attendance**: Entities nguồn cấp dữ liệu cho Dashboard.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dashboard tải với cache hit trong vòng 2 giây, cache miss trong vòng 5 giây.
- **SC-002**: Cache hit rate ≥ 80% (cache TTL 5 phút).
- **SC-003**: 100% request không phải Admin/Manager bị từ chối.
- **SC-004**: Manager không bao giờ thấy dữ liệu ngoài phạm vi tổ chức.

## Assumptions

- Các module Event, User, Application, Donation, Attendance đã có dữ liệu.
- Redis cache đã sẵn sàng.
- Frontend dùng Chart.js/Recharts để vẽ biểu đồ.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC54 và KHÔNG được implement:

- **Real-time dashboard (WebSocket)**: Dùng cache + nút Refresh.
- **Dashboard customization (kéo thả widget)**: Dashboard cố định.
- **So sánh dữ liệu (YoY/MoM)**: Chỉ hiển thị dữ liệu gốc.
- **PDF export từ Dashboard**: Thuộc UC57.
- **Dashboard cho Staff/Volunteer**: Chỉ Admin và Manager.

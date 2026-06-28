# Feature Specification: Volunteer Statistics (UC56)

**Feature Branch**: `feat/uc56-volunteer-statistics`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Admin và Manager cần thống kê về tình nguyện viên — số lượng mới, tỷ lệ tham gia, top volunteer tích cực."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem thống kê tình nguyện viên (Priority: P1)

Admin muốn xem số lượng volunteer mới theo tháng, tổng volunteer đang hoạt động, tỷ lệ tham gia, và top 5 volunteer tích cực.

**Why this priority**: Thống kê volunteer cho biết sức khỏe của hệ thống — liệu VMS có đang thu hút và giữ chân được tình nguyện viên không.

**Independent Test**: Gọi `GET /api/v1/dashboard/volunteer-stats?year=2026` với token Admin, kiểm tra response chứa đầy đủ các chỉ số.

**Acceptance Scenarios**:

1. **Given** hệ thống có 100 volunteer active, 20 volunteer mới trong tháng này, và 60 volunteer đã từng điểm danh, **When** Admin truy cập Volunteer Statistics, **Then** hệ thống hiển thị: 20 new_volunteers_in_month, 100 total_active, 60% participation_rate, và top 5 volunteer có nhiều attendance nhất.
2. **Given** Admin chọn năm 2025 (không có dữ liệu), **When** Admin xem thống kê, **Then** hệ thống trả về object với giá trị mặc định (0 cho số, mảng rỗng cho top 5).
3. **Given** Manager xem Volunteer Statistics, **When** Manager truy cập, **Then** hệ thống chỉ thống kê volunteer đã tham gia sự kiện thuộc organization của Manager.

---

### Edge Cases

- Điều gì xảy ra khi không có volunteer nào có attendance? → participation_rate = 0%, top_5 = [].
- Điều gì xảy ra khi có ít hơn 5 volunteer? → Trả về tất cả, không cần đủ 5.
- Điều gì xảy ra khi Staff/Volunteer cố gắng truy cập? → HTTP 403.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cung cấp endpoint `GET /api/v1/dashboard/volunteer-stats` với tham số `year` (optional, mặc định năm hiện tại).
- **FR-002**: System MUST trả về: `new_volunteers_by_month` (mảng 12 tháng), `total_active_volunteers`, `participation_rate` (%), `top_5_volunteers_by_events` (kèm tên, số sự kiện đã tham gia).
- **FR-003**: WHERE không có dữ liệu, System MUST trả về object với giá trị mặc định.
- **FR-004**: WHERE Manager, System MUST chỉ thống kê volunteer trong organization của Manager.
- **FR-005**: System MUST cache response với TTL 5 phút.
- **FR-006**: System MUST từ chối Staff (403) và Guest (401).

### Key Entities *(Business Level Only)*

- **User (Volunteer)**: Entity chính — lọc role = VOLUNTEER, is_active = true.
- **Attendance (Điểm danh)**: Entity phụ — xác định participation.
- **Application (Đơn đăng ký)**: Entity phụ — xác định sự kiện volunteer tham gia.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Volunteer Statistics tải trong vòng 3 giây.
- **SC-002**: 100% response có cấu trúc đúng dù có hoặc không có dữ liệu.
- **SC-003**: participation_rate luôn trong khoảng 0–100%.

## Assumptions

- Attendance records đã được tạo khi volunteer check-in.
- Một volunteer có thể tham gia nhiều sự kiện.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC56 và KHÔNG được implement:

- **Thống kê volunteer theo kỹ năng**: Không có dữ liệu kỹ năng trong scope này.
- **Thống kê volunteer theo địa lý**: Không có dữ liệu địa lý.
- **Export Volunteer Statistics**: Thuộc UC57.
- **Volunteer retention rate**: Deferred.

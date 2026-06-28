# Feature Specification: Event Statistics (UC55)

**Feature Branch**: `feat/uc55-event-statistics`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Admin và Manager cần xem thống kê chi tiết về sự kiện — số lượng theo thời gian, tỷ lệ hoàn thành, top sự kiện phổ biến."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem thống kê sự kiện theo thời gian (Priority: P1)

Admin muốn xem số lượng sự kiện theo tháng và tỷ lệ hoàn thành để đánh giá hiệu quả tổ chức sự kiện trong năm.

**Why this priority**: Thống kê sự kiện cung cấp insight quan trọng giúp Admin ra quyết định về chiến lược sự kiện.

**Independent Test**: Gọi `GET /api/v1/dashboard/event-stats?year=2026` với token Admin, kiểm tra response chứa events_by_month (12 tháng), completion_rate, top_5_events.

**Acceptance Scenarios**:

1. **Given** hệ thống có sự kiện từ năm 2026, **When** Admin truy cập trang Event Statistics, **Then** hệ thống hiển thị: (a) Bar chart — số sự kiện theo từng tháng trong năm 2026, (b) Completion rate — tỷ lệ sự kiện đã hoàn thành (%), (c) Top 5 sự kiện có nhiều application approved nhất.
2. **Given** Admin muốn xem thống kê theo khoảng thời gian tùy chỉnh, **When** Admin chọn từ 01/01/2026 đến 30/06/2026, **Then** hệ thống chỉ thống kê sự kiện trong khoảng đó.
3. **Given** không có sự kiện nào trong khoảng thời gian, **When** Admin xem thống kê, **Then** hệ thống trả về object với giá trị mặc định (0 hoặc mảng rỗng) — không báo lỗi.
4. **Given** Manager xem Event Statistics, **When** Manager chọn thời gian, **Then** hệ thống chỉ thống kê sự kiện thuộc organization của Manager.

---

### Edge Cases

- Điều gì xảy ra khi year truyền vào là năm tương lai (ví dụ: 2030)? → Trả về object với giá trị mặc định.
- Điều gì xảy ra khi start_date > end_date? → HTTP 400.
- Điều gì xảy ra khi không có sự kiện Approved nào? → Top 5 events trả về mảng rỗng.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cung cấp endpoint `GET /api/v1/dashboard/event-stats`.
- **FR-002**: System MUST hỗ trợ tham số `year` (mặc định năm hiện tại) và `start_date`/`end_date` (tùy chỉnh).
- **FR-003**: System MUST trả về: `events_by_month` (mảng 12 tháng hoặc theo khoảng), `completion_rate` (%), `top_5_events` (kèm tên và số lượng approved).
- **FR-004**: WHERE không có dữ liệu, System MUST trả về object với giá trị mặc định.
- **FR-005**: WHERE Manager, System MUST chỉ thống kê event thuộc organization của Manager.
- **FR-006**: System MUST cache response với TTL 5 phút.
- **FR-007**: System MUST từ chối Staff (403) và Guest (401).

### Key Entities *(Business Level Only)*

- **Event (Sự kiện)**: Entity chính được thống kê. Các chỉ số dựa trên `status` và `created_at`.
- **Application (Đơn đăng ký)**: Entity phụ — đếm số lượng approved để xác định top event.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Event Statistics tải hoàn chỉnh trong vòng 3 giây.
- **SC-002**: 100% response trả về đúng cấu trúc dù có hay không có dữ liệu.
- **SC-003**: Manager chỉ thấy dữ liệu của tổ chức mình (test với 2 Manager từ 2 tổ chức khác nhau).

## Assumptions

- Bảng Event có index trên `created_at` và `status`.
- Dữ liệu sự kiện của Manager được xác định qua organization_id của Manager.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC55 và KHÔNG được implement:

- **So sánh YoY (năm nay vs năm ngoái)**: Chỉ hiển thị một khoảng thời gian.
- **Thống kê theo category/loại sự kiện**: Chỉ thống kê tổng quát.
- **Export Event Statistics**: Thuộc UC57.
- **Real-time:** Dùng cache + refresh.

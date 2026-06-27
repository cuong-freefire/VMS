# CONTEXT.md — Reports & Dashboard (UC54–UC57)

# Người viết: [Member Name] | Ngày: 2026-06-26

## 1. PROBLEM STATEMENT

Hệ thống VMS sinh ra nhiều dữ liệu nghiệp vụ: sự kiện, tình nguyện viên, đơn đăng ký, điểm danh, quyên góp. Admin và Manager cần dashboard tổng quan và báo cáo thống kê để theo dõi hiệu quả hoạt động, số lượng tình nguyện viên, tình trạng sự kiện. Nếu không có module này, dữ liệu giá trị bị chôn vùi trong database và không thể khai thác để ra quyết định.

## 2. DOMAIN KNOWLEDGE

- **Dashboard:** Trang tổng quan hiển thị các chỉ số KPI (Key Performance Indicators) quan trọng như: tổng số sự kiện (theo trạng thái), tổng số user (theo role), số lượng đơn đăng ký (theo trạng thái), số tiền quyên góp, tình nguyện viên mới trong tháng, v.v.
- **Event Statistics:** Thống kê chi tiết về sự kiện — số lượng sự kiện theo tháng, tỷ lệ sự kiện hoàn thành, sự kiện phổ biến nhất (có nhiều người đăng ký nhất).
- **Volunteer Statistics:** Thống kê về tình nguyện viên — số lượng đăng ký mới, tỷ lệ tham gia/điểm danh, top volunteer tích cực.
- **Export Reports:** Xuất báo cáo dạng file (PDF, Excel, CSV) từ dữ liệu thống kê.
- **Admin/Manager only:** Dashboard và Reports chỉ dành cho Admin và Manager
- **Read-only:** Dashboard và thống kê là dữ liệu read-only — không có thao tác write nào ở đây.

## 3. STAKEHOLDERS

- **Admin:** Cần dashboard tổng quan và thống kê toàn hệ thống để ra quyết định chiến lược.
- **Manager:** Cần dashboard cho phạm vi quản lý của mình và xuất báo cáo định kỳ.
- **Ban lãnh đạo (indirect):** Nhận báo cáo từ Manager — cần dữ liệu chính xác và dễ hiểu.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Read-only API:** Tất cả endpoint dashboard/stats CHỈ đọc dữ liệu — không POST/PUT/PATCH.
- **Performance:** Dashboard aggregate queries phải tối ưu (dùng database aggregation, không loop trong code). Nếu data lớn, cân nhắc caching (Redis) với TTL 5 phút.
- **Phân quyền:** Admin thấy toàn bộ dữ liệu hệ thống. Manager thấy dữ liệu trong phạm vi quản lý (ví dụ: event do staff của Manager đó quản lý).
- **Swagger:** Bắt buộc document đầy đủ endpoint API cho dashboard & export.
- **Export format:** Hỗ trợ ít nhất 2 định dạng: CSV và Excel (.xlsx). PDF là optional cho v1.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định các module khác (Event, User, Application, Attendance, Donation) đã có dữ liệu để dashboard query.
- Giả định Admin và Manager đều có thể xem dashboard với phạm vi dữ liệu khác nhau.
- Giả định chỉ Manager và Admin mới có quyền export report.
- Giả định export service có sẵn thư viện (ví dụ: exceljs cho Excel, json2csv cho CSV) để xử lý xuất file.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Dashboard KPI:** Cần những chỉ số nào trên Dashboard? (Tổng sự kiện, tổng user, tổng đơn đăng ký, tổng quyên góp, tỷ lệ điểm danh trung bình?)
2. **Export scope:** Manager export được những báo cáo gì? Tất cả sự kiện? Chỉ sự kiện của mình quản lý? Có export được danh sách volunteer không?
3. **Dashboard refresh:** Dashboard có cần real-time không? Hay cache và refresh mỗi 5 phút là đủ?
4. **Chart dạng nào?** Dashboard có cần biểu đồ (bar chart, pie chart, line chart) không? Hay chỉ hiển thị số?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Dashboard gồm các chỉ số: Tổng sự kiện (theo trạng thái), Tổng user (theo role), Tổng đơn đăng ký (theo trạng thái), Tổng quyên góp (theo tháng), Tỷ lệ điểm danh (%). Biểu đồ: Sự kiện theo tháng (bar chart), User mới theo tháng (line chart), Phân bố đơn đăng ký (pie chart).
- **A2:** Manager export được dữ liệu trong phạm vi quản lý (event của staff cấp dưới). Admin export toàn hệ thống. Các loại export: (a) Danh sách sự kiện, (b) Danh sách volunteer, (c) Báo cáo quyên góp, (d) Báo cáo điểm danh.
- **A3:** Dashboard KHÔNG real-time. Dùng caching với TTL 5 phút. User có thể nhấn nút "Refresh" để force refresh.
- **A4:** Có biểu đồ. Frontend dùng thư viện chart (ví dụ: Chart.js, Recharts). Backend trả về data đã aggregate sẵn để Frontend vẽ.
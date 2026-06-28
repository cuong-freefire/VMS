# CONTEXT.md — Export Reports (UC57)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-28

## 1. PROBLEM STATEMENT

Admin và Manager cần xuất dữ liệu thống kê ra file (CSV, Excel) để phục vụ báo cáo định kỳ, gửi cho ban lãnh đạo hoặc lưu trữ hồ sơ. Nếu không có chức năng export, người dùng phải copy thủ công từ dashboard, dễ sai sót và mất thời gian.

## 2. DOMAIN KNOWLEDGE

- **Export types:** Hỗ trợ 4 loại báo cáo:
  - `events`: Danh sách sự kiện.
  - `volunteers`: Danh sách tình nguyện viên.
  - `donations`: Báo cáo quyên góp.
  - `attendance`: Báo cáo điểm danh.
- **Formats:** CSV và Excel (.xlsx).
- **Filter:** Hỗ trợ lọc theo khoảng thời gian (start_date, end_date), organization_id.
- **On-demand:** File được generate và trả về ngay lập tức (không lưu file trên server).
- **Phân quyền:** Admin export toàn hệ thống. Manager export trong phạm vi tổ chức.

## 3. STAKEHOLDERS

- **Admin:** Cần export toàn bộ dữ liệu để báo cáo lên cấp trên.
- **Manager:** Cần export dữ liệu trong phạm vi quản lý.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **API format:** Endpoint `GET /api/v1/reports/export`.
- **Tham số bắt buộc:** type (events|volunteers|donations|attendance), format (csv|xlsx).
- **Phân quyền:** Chỉ Admin và Manager.
- **Performance:** Export 1000 dòng không quá 3 giây.
- **Swagger:** Bắt buộc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định thư viện ExcelJS (cho xlsx) và json2csv (cho csv) đã được cài đặt.
- Giả định không có scheduled export — Manager/Admin export thủ công khi cần.
- Giả định file export có locale là tiếng Việt (header tiếng Việt, số dùng dấu phẩy phân cách).

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Filename convention:** Tên file export đặt như thế nào?
2. **Có giới hạn số dòng export không?** Nếu có hàng nghìn dòng?
3. **PDF export:** Có cần hỗ trợ PDF không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Filename format: `{type}-report-{YYYY-MM-DD}.{format}` (ví dụ: `events-report-2026-06-28.csv`).
- **A2:** Giới hạn 10,000 dòng mỗi lần export. Nếu vượt quá, yêu cầu user lọc lại với khoảng thời gian nhỏ hơn.
- **A3:** PDF không hỗ trợ trong v1 — deferred.

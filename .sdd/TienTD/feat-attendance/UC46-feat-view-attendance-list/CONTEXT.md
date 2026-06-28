# CONTEXT.md — Feature: Staff Module - View Attendance List (UC46)
# Người viết: TienTD | Ngày: 28/06/2026

## 1. PROBLEM STATEMENT
- **Current Pain Point**: Sau khi thực hiện điểm danh (UC45), Staff thiếu một giao diện tổng hợp để theo dõi tỷ lệ hiện diện của tình nguyện viên. Hiện tại, dữ liệu thường nằm rải rác hoặc phải kiểm tra từng người một, gây khó khăn cho việc báo cáo.
- **Impact on Staff Workflow**: Staff mất nhiều thời gian để thống kê số lượng người tham gia thực tế so với danh sách đã duyệt. Việc thiếu cái nhìn tổng thể khiến việc điều phối nhân sự tại chỗ trở nên thụ động.
- **Impact on Volunteers/Events**: Sự kiện có thể bị thiếu hụt nhân sự ở các vị trí quan trọng mà Staff không kịp thời nhận ra. Volunteer không biết chắc chắn mình đã được hệ thống ghi nhận có mặt hay chưa.
- **Business Value**: Cung cấp công cụ theo dõi nhân sự thời gian thực, giúp Staff đánh giá hiệu quả huy động tình nguyện viên và tạo tiền đề chính xác cho việc cấp chứng nhận sau sự kiện.

## 2. DOMAIN KNOWLEDGE
- **Staff Role & Permissions**: Staff có quyền xem danh sách điểm danh của tất cả các sự kiện thuộc Organization mà họ quản lý.
- **Attendance States**: Một bản ghi điểm danh thường có các trạng thái: `Present` (Có mặt), `Absent` (Vắng mặt - mặc định cho những người đã duyệt nhưng chưa check-in).
- **Business Rules**: 
    - Danh sách chỉ hiển thị những Volunteer đã có đơn đăng ký ở trạng thái `Approved`.
    - Dữ liệu điểm danh phải được hiển thị theo thời gian thực (real-time) ngay khi UC45 được thực hiện thành công.
- **Cross-Module Dependencies**: UC46 phụ thuộc vào dữ liệu từ UC24 (Approve Application) và UC45 (Attendance Check). Dữ liệu này sẽ được sử dụng cho UC47 (View Attendance History) và UC53 (Generate Certificate).

## 3. STAKEHOLDERS
- **Staff (Actor chính)**: Muốn theo dõi nhanh danh sách những người đã và chưa có mặt để quản lý sự kiện hiệu quả.
- **Volunteer**: Quan tâm đến việc thông tin hiện diện của mình được hiển thị chính xác để đảm bảo quyền lợi về sau.
- **Organization Admin**: Sử dụng danh sách này để giám sát tính trung thực của quá trình điểm danh do Staff thực hiện.
- **System/Infrastructure**: Quan tâm đến hiệu năng truy vấn khi danh sách điểm danh có thể lên đến hàng trăm người cùng lúc.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)
- **Authorization Constraint**: Staff CHỈ được phép xem danh sách điểm danh của các sự kiện gắn với Organization ID của họ.
- **Data Privacy Constraint**: Không hiển thị các thông tin liên lạc cá nhân (SĐT, Email) trong danh sách tổng quát này để đảm bảo an toàn dữ liệu.
- **Performance Constraint**: API lấy danh sách phải phản hồi trong vòng dưới 1.2 giây để Staff có thể cập nhật tình hình liên tục.
- **Audit Trail Constraint**: Hệ thống ghi log mỗi khi Staff truy cập hoặc xuất (export) danh sách điểm danh này.

## 5. ASSUMPTIONS (Giả định)
- **Giả định về Staff behavior**: Staff sử dụng tính năng này để kiểm tra chéo với số lượng người thực tế tại hiện trường.
- **Giả định về dữ liệu**: Giả định quá trình điểm danh (UC45) đang hoặc đã diễn ra.
- **Giả định về permission**: Staff đã được cấp quyền quản lý trong module Attendance.

## 6. OPEN QUESTIONS
1. Staff có cần lọc danh sách theo vị trí công việc (Role) của Volunteer trong sự kiện không?
2. Có cần chức năng xuất (Export) danh sách điểm danh ra file PDF ngay tại trang này không?

## 7. DECISIONS
**Quyết định cho câu hỏi 1 - Filtering Strategy:**
- **Lựa chọn**: Cách 2 - Cho phép lọc theo trạng thái (Có mặt/Vắng mặt) và Tìm kiếm theo tên.
- **Lý do**: Đây là những nhu cầu cấp thiết nhất để Staff tìm ra những người chưa check-in.
- **Impact**: Backend cần bổ sung filter params vào API.

**Quyết định cho câu hỏi 2 - Export Strategy:**
- **Lựa chọn**: Option A - Cho phép xuất danh sách ra file CSV/Excel.
- **Lý do**: Giúp Staff lưu trữ dữ liệu ngoại tuyến hoặc gửi báo cáo nhanh cho quản lý.
- **Impact**: Cần tích hợp thư viện xuất file ở phía server.
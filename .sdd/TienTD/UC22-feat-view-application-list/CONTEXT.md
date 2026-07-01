# CONTEXT.md — Feature: Staff Module - View Application List (UC22)
# Người viết: TienTD | Ngày: 28/06/2026

## 1. PROBLEM STATEMENT
- **Current Pain Point**: Staff gặp khó khăn trong việc theo dõi số lượng và danh sách các tình nguyện viên đã đăng ký cho từng sự kiện. Hiện tại thông tin bị rải rác qua email hoặc các bảng tính thủ công.
- **Impact on Staff Workflow**: Mất nhiều thời gian để tổng hợp danh sách ứng viên, dễ bỏ sót các đơn đăng ký mới, làm chậm quy trình phê duyệt và chuẩn bị cho sự kiện.
- **Impact on Volunteers/Events**: Volunteer phải chờ đợi lâu để biết kết quả ứng tuyển, gây ảnh hưởng đến kế hoạch cá nhân và làm giảm sự chuyên nghiệp của tổ chức.
- **Business Value**: Tập trung hóa dữ liệu đăng ký, giúp Staff quản lý ứng viên hiệu quả hơn, tăng tốc độ phản hồi và đảm bảo sự kiện có đủ nhân sự kịp thời.

## 2. DOMAIN KNOWLEDGE
- **Staff Role & Permissions**: Staff có quyền xem toàn bộ danh sách đơn đăng ký thuộc các sự kiện do tổ chức mình quản lý.
- **Application Workflow**: Một đơn đăng ký (Application) sẽ trải qua các trạng thái: `Submitted` (Chờ duyệt) → `Reviewed` (Đang xem xét) → `Approved` (Đã duyệt) hoặc `Rejected` (Bị từ chối).
- **Business Rules**: 
    - Staff chỉ được xem danh sách đơn đăng ký của các sự kiện thuộc cùng Organization ID với mình.
    - Danh sách cần hỗ trợ lọc nhanh theo trạng thái để ưu tiên xử lý các đơn `Submitted`.
- **Cross-Module Dependencies**: UC22 nhận dữ liệu từ UC12 (Apply Event) của Volunteer và là tiền đề cho UC23 (View Application Detail) và UC24/25 (Approve/Reject).

## 3. STAKEHOLDERS
- **Staff (Actor chính)**: Muốn có cái nhìn tổng quan về tình hình nhân sự của sự kiện để đưa ra quyết định phê duyệt chính xác.
- **Volunteer**: Mong muốn đơn đăng ký được xem xét nhanh chóng thông qua việc Staff có công cụ quản lý tập trung.
- **Organization Admin**: Giám sát hiệu suất xử lý đơn đăng ký của Staff.
- **System/Infrastructure**: Đảm bảo hiệu năng khi hiển thị danh sách lớn (hàng trăm ứng viên cho một sự kiện lớn).

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)
- **Authorization Constraint**: Staff CHỈ được phép xem danh sách đơn đăng ký gắn với các sự kiện của Organization mà họ trực thuộc.
- **Data Privacy Constraint**: Chỉ hiển thị các thông tin tóm tắt (Tên, ngày đăng ký, trạng thái). Các thông tin nhạy cảm như số điện thoại/email chỉ được xem chi tiết ở UC23.
- **Performance Constraint**: API lấy danh sách phải hỗ trợ phân trang (Pagination) để đảm bảo tốc độ tải trang dưới 1 giây.
- **Audit Trail Constraint**: Hệ thống ghi log mỗi khi Staff truy cập vào danh sách ứng viên của một sự kiện cụ thể.

## 5. ASSUMPTIONS (Giả định)
- **Giả định về dữ liệu**: Giả định sự kiện đã có ít nhất một đơn đăng ký trước khi Staff truy cập.
- **Giả định về môi trường**: Staff sử dụng giao diện web (Desktop) để có thể quan sát được bảng danh sách với nhiều cột thông tin.
- **Giả định về kết nối**: Backend đã sẵn sàng các API lọc theo `event_id` và `status`.

## 6. OPEN QUESTIONS
1. Staff có cần xuất danh sách ứng viên ra file Excel ngay tại trang danh sách này không?
2. Có cần hiển thị số lượng đơn `Pending` ngay trên tiêu đề tab để nhắc nhở Staff không?

## 7. DECISIONS
**Quyết định cho câu hỏi 1 - Export Strategy:**
- **Lựa chọn**: Cách 2 - Staff được xuất danh sách ra CSV/Excel để phục vụ điểm danh ngoại tuyến (offline).
- **Lý do**: Hỗ trợ Staff làm việc tại hiện trường sự kiện nơi không có kết nối internet ổn định.
- **Impact**: Cần bổ sung thư viện xuất file ở phía Backend.

**Quyết định cho câu hỏi 2 - UI/UX Strategy:**
- **Lựa chọn**: Option A - Hiển thị badge số lượng đơn `Submitted` (chưa xử lý).
- **Lý do**: Giúp Staff ưu tiên các công việc cần xử lý ngay.
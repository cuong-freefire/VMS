# CONTEXT.md — Feature: Staff Module - View Attendance History (UC47)
# Người viết: TienTD | Ngày: 28/06/2026

## 1. PROBLEM STATEMENT
- **Current Pain Point**: Hiện tại, sau khi các sự kiện kết thúc, Staff gặp khó khăn trong việc tra cứu lại lịch sử tham gia của tình nguyện viên để làm báo cáo tổng kết hoặc giải quyết các khiếu nại về việc cấp chứng nhận.
- **Impact on Staff Workflow**: Staff mất nhiều thời gian để lục lại danh sách điểm danh cũ. Việc thiếu một bộ lọc lịch sử tập trung khiến việc đánh giá mức độ tích cực của các thành viên trong tổ chức trở nên cảm tính.
- **Impact on Volunteers/Events**: Volunteer có thể bị ghi nhận sai lệch quá trình đóng góp nếu Staff không thể kiểm tra lại lịch sử điểm danh một cách chính xác. Tổ chức thiếu dữ liệu tin cậy để vinh danh những cá nhân xuất sắc.
- **Business Value**: Cung cấp kho lưu trữ dữ liệu tham gia tập trung, giúp minh bạch hóa quá trình đóng góp, hỗ trợ Staff ra quyết định cấp chứng nhận chính xác và tạo cơ sở cho các báo cáo thống kê chuyên sâu.

## 2. DOMAIN KNOWLEDGE
- **Staff Role & Permissions**: Staff có quyền xem lịch sử điểm danh của tất cả các sự kiện (đã kết thúc hoặc đang diễn ra) thuộc tổ chức mình quản lý.
- **Event Lifecycle**: UC này chủ yếu tập trung vào các sự kiện ở trạng thái `Completed` hoặc `Cancelled` nhưng vẫn hỗ trợ xem lịch sử của sự kiện `Ongoing`.
- **Attendance Rules**: Hồ sơ lịch sử bao gồm trạng thái điểm danh (Present/Absent), thời gian check-in thực tế và người thực hiện điểm danh.
- **Business Rules**: 
    - Staff chỉ được xem lịch sử điểm danh của các sự kiện thuộc cùng Organization ID.
    - Dữ liệu lịch sử là dữ liệu chỉ đọc (Read-only), không được phép chỉnh sửa trực tiếp tại giao diện này.
- **Cross-Module Dependencies**: UC47 kế thừa dữ liệu từ UC45 (Attendance Check) và UC46 (View Attendance List). Nó cung cấp dữ liệu tham chiếu cho UC53 (Generate Certificate).

## 3. STAKEHOLDERS
- **Staff (Actor chính)**: Muốn tra cứu lịch sử tham gia của Volunteer theo sự kiện hoặc theo cá nhân để phục vụ công tác quản lý.
- **Volunteer**: Mong muốn lịch sử tham gia của mình được lưu trữ vĩnh viễn và chính xác để tích lũy thành tích.
- **Organization Admin**: Sử dụng dữ liệu lịch sử để đánh giá hiệu quả của các chiến dịch tình nguyện và sự chuyên cần của Staff trong việc điểm danh.
- **System Admin**: Quan tâm đến việc lưu trữ dữ liệu (Data Archiving) và hiệu năng truy vấn các bản ghi cũ trong database.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)
- **Authorization Constraint**: Staff CHỈ được phép xem lịch sử điểm danh gắn với các sự kiện thuộc Organization mà họ quản lý.
- **Data Privacy Constraint**: Staff không được phép trích xuất thông tin cá nhân của Volunteer cho các mục đích nằm ngoài nghiệp vụ của tổ chức.
- **Performance Constraint**: Hệ thống phải phản hồi kết quả tìm kiếm lịch sử trong vòng dưới 2 giây ngay cả khi dữ liệu lên đến hàng nghìn bản ghi.
- **Audit Trail Constraint**: Hệ thống ghi log lại các thao tác tra cứu dữ liệu lịch sử nhạy cảm hoặc thao tác xuất báo cáo.

## 5. ASSUMPTIONS (Giả định)
- **Giả định về dữ liệu**: Giả định mọi bản ghi điểm danh từ quá khứ đều đã được lưu trữ đúng cấu trúc trong database.
- **Giả định về môi trường**: Staff sử dụng Desktop để xem các bảng báo cáo lịch sử phức tạp với nhiều cột thông tin.
- **Giả định về dependencies**: Module quản lý sự kiện đã cung cấp đủ thông tin về trạng thái và thời gian diễn ra của các sự kiện cũ.

## 6. OPEN QUESTIONS
1. Staff có cần lọc lịch sử theo khoảng thời gian (Date Range) hay chỉ theo tên sự kiện?
2. Có cần hiển thị cả những Volunteer đã được duyệt nhưng vắng mặt (Absent) trong danh sách lịch sử không?

## 7. DECISIONS
**Quyết định cho câu hỏi 1 - Filtering Strategy:**
- **Lựa chọn**: Cách 2 - Hỗ trợ lọc theo Date Range, Tên sự kiện và Tên Volunteer.
- **Lý do**: Tăng tính linh hoạt giúp Staff nhanh chóng tìm đúng thông tin cần thiết giữa hàng trăm sự kiện đã qua.
- **Impact**: Backend cần bổ sung các câu query phức tạp với nhiều điều kiện lọc.

**Quyết định cho câu hỏi 2 - Data Scope:**
- **Lựa chọn**: Option A - Hiển thị tất cả những người có trạng thái `Approved` kèm kết quả `Present` hoặc `Absent`.
- **Lý do**: Giúp Staff có cái nhìn toàn diện về tỷ lệ tham gia thực tế so với đăng ký.
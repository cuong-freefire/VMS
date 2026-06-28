# CONTEXT.md — Feature: Authentication/Dashboard - View Home Page (UC02)

# Người viết: CuongLH | Ngày: 28/06/2026

## 1. PROBLEM STATEMENT

Sau khi đăng nhập thành công, người dùng cần một "trạm điều khiển" trung tâm thay vì chỉ nhìn thấy trang chủ dành cho khách (Guest). Hiện tại, hệ thống thiếu một màn hình Dashboard tích hợp để hiển thị các thông tin quan trọng nhất dựa trên vai trò của từng người dùng (Volunteer, Staff, Manager, Admin). Mục tiêu của UC02 là cung cấp một cái nhìn tổng quan, giúp người dùng nắm bắt nhanh các sự kiện sắp tới, thông báo mới và các số liệu thống kê liên quan mà không cần phải truy cập sâu vào từng module.

## 2. DOMAIN KNOWLEDGE

- **Role-Based Landing (Trang đích theo vai trò):** Mặc dù cùng mã UC02, giao diện Home Page sẽ thay đổi nội dung linh hoạt theo `role` trong JWT:
  - **Volunteer:** Hiển thị các sự kiện đã đăng ký, sự kiện gợi ý và tiến độ giờ tình nguyện.
  - **Staff/Manager:** Hiển thị danh sách các đơn đăng ký cần duyệt, các sự kiện đang quản lý.
  - **Admin:** Hiển thị biểu đồ tóm tắt hoạt động hệ thống.
- **Widgets System:** Home Page được thiết kế theo dạng các khối thông tin (widgets). Dữ liệu của các khối này được lấy từ nhiều Service khác nhau (EventService, NotificationService, StatsService).
- **Authentication State:** Home Page chỉ hiển thị khi người dùng có **JWT HttpOnly Cookie** hợp lệ. Nếu không, hệ thống tự động điều hướng về Landing Page (UC01).

## 3. STAKEHOLDERS

- **Tình nguyện viên (Volunteer):** Người dùng muốn xem lịch trình cá nhân.
- **Nhân viên (Staff/Manager):** Người dùng muốn xem danh sách công việc cần xử lý ngay.
- **Quản trị viên (Admin):** Người dùng muốn theo dõi sức khỏe hệ thống.
- **Member 1 (CuongLH):** Chủ sở hữu module, chịu trách nhiệm tích hợp giao diện Home Page.
- **Member 5 (DucNM):** Cung cấp dữ liệu thống kê cho Dashboard.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)

- **Tech Stack:** Frontend dùng React + Bootstrap 5. Backend dùng NodeJS + Express.
- **Security:** BẮT BUỘC lấy `userId` và `role` từ JWT được giải mã bởi middleware, KHÔNG tin tưởng dữ liệu từ request body.
- **Data Boundary:** Modules giao tiếp qua Service layer contracts. Home Page Service SHALL gọi các Service tương ứng thay vì truy vấn trực tiếp Repository của module khác.
- **Response Standard:** Phải sử dụng hàm tiện ích `backend\src\utils\response.util.js`.

## 5. ASSUMPTIONS (Giả định)

- Giả định rằng API của các module khác (Event, Application, Stats) đã có sẵn các phương thức cung cấp dữ liệu tóm tắt (summary data) cho Dashboard.
- Giả định rằng trang Home Page sẽ có cơ chế "Empty State" chuyên nghiệp khi người dùng mới chưa có dữ liệu hoạt động.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Mức độ cá nhân hóa:** Home Page có cho phép người dùng tùy chỉnh vị trí các khối widget không?
2. **Tần suất cập nhật:** Dữ liệu trên Dashboard cần được cập nhật realtime (qua Socket.io) hay chỉ cần fetch lại mỗi lần tải trang (Refresh)?
3. **Thành phần dữ liệu:** Danh sách cụ thể các widgets tối thiểu cần có cho từng Role là gì? (Ví dụ: Dashboard của Admin cần lấy dữ liệu từ UC54 của Member 5 hay Member 1 tự tính toán?).

## 7. ANSWERS

1. **Mức độ cá nhân hóa:**
   - **QUYẾT ĐỊNH:** KHÔNG cho phép người dùng tùy chỉnh vị trí widget trong v1. Vị trí các khối thông tin sẽ được cố định theo thiết kế chuẩn cho từng Role.
2. **Tần suất cập nhật:**
   - **QUYẾT ĐỊNH:** Dữ liệu sẽ được nạp lại (Fetch) mỗi khi người dùng tải trang hoặc nhấn nút Refresh. KHÔNG sử dụng Socket.io cho realtime trong giai đoạn này để tối ưu tài nguyên.
3. **Thành phần dữ liệu (Widgets):**
   - **Volunteer:** Hiển thị 3 khối: Sự kiện sắp tới, Gợi ý việc làm mới, và Tóm tắt giờ đóng góp.
   - **Staff/Manager:** Hiển thị 2 khối: Danh sách đơn đăng ký cần duyệt (Top 5 mới nhất) và Các sự kiện đang quản lý.
   - **Admin:** Hiển thị dữ liệu tóm tắt từ StatsService của Member 5 (Số user mới, Tổng sự kiện trong tháng).
4. **Trường hợp Empty State:**
   - **QUYẾT ĐỊNH:** Khi không có dữ liệu (ví dụ Volunteer mới), hệ thống SHALL hiển thị các CTA (Call to Action) như "Khám phá sự kiện ngay" thay vì để màn hình trắng.

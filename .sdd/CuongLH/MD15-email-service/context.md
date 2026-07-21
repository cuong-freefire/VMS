# CONTEXT.md — Feature: Email Services (Module 15)

# Người viết: CuongLH | Ngày: 26/06/2026

## 1. PROBLEM STATEMENT

Trong hệ thống VMS, việc giao tiếp với người dùng qua email là thành phần cốt lõi để đảm bảo tính xác thực, thông báo kịp thời và cung cấp chứng nhận tham gia. Hiện tại, các yêu cầu gửi mail đang nằm rải rác ở nhiều module (Auth, Event, Certificate). Hệ thống cần một **Email Service** tập trung để quản lý cấu hình **SMTP**, chuẩn hóa các **HTML Templates**, và đảm bảo việc gửi mail diễn ra bất đồng bộ, không gây ảnh hưởng đến hiệu năng của các API nghiệp vụ chính.

## 2. DOMAIN KNOWLEDGE

* **Infrastructure (Hạ tầng):** Sử dụng thư viện **NodeMailer** kết hợp với giao thức **SMTP** để truyền tải thư.
* **Email Scenarios (Các kịch bản nghiệp vụ):** Module này phục vụ 5 kịch bản được định nghĩa trong tài liệu thiết kế:
  * **UC62 - Verify Email:** Xác thực tài khoản ngay sau khi đăng ký.
  * **UC63 - Forgot Password Email:** Cung cấp OTP khôi phục mật khẩu an toàn.
  * **UC64 - Event Approval Email:** Thông báo cho tình nguyện viên khi đơn đăng ký sự kiện được duyệt hoặc từ chối.
  * **UC65 - Event Reminder Email:** Tự động nhắc nhở lịch trình trước khi sự kiện diễn ra.
  * **UC66 - Certificate Email:** Gửi tệp đính kèm chứng nhận tình nguyện sau khi hoàn thành công việc.

## 3. STAKEHOLDERS

* **Users (Volunteer, Staff, Manager, Admin):** Đối tượng nhận thông báo email từ hệ thống.
* **System Backend:** Gọi dịch vụ email mỗi khi có sự kiện trigger nghiệp vụ.
* **SMTP Provider:** Dịch vụ bên thứ ba (Gmail, SendGrid, Mailtrap...) chịu trách nhiệm vận chuyển thư thực tế.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)

* **Bảo mật thông tin (Secrets Management):** TUYỆT ĐỐI KHÔNG hardcode thông tin đăng nhập SMTP (User, Pass, Host). Bắt buộc sử dụng biến môi trường (Environment Variables).
* **Hiệu năng bất đồng bộ:** Bắt buộc sử dụng cú pháp `async/await` để thực hiện gửi mail.
* **Ghi nhật ký (Logging):** Phải sử dụng thư viện **Pino** để log lại trạng thái gửi mail (Success/Fail) kèm theo các mã lỗi từ SMTP server để phục vụ debug.
* **Tech Stack:** Tuân thủ Backend NodeJS đã quy định.

## 5. ASSUMPTIONS (Giả định)

* Giả định hệ thống sẽ sử dụng **Native JavaScript Template Strings** để xây dựng nội dung HTML cho email một cách linh hoạt, thay vì sử dụng các thư viện Templating Engine bên ngoài như Handlebars hay EJS.
* Giả định logic sinh nội dung (mapping các biến động vào template) sẽ được đóng gói trong các hàm tiện ích (utility) hoặc logic nội bộ tại tầng Service trước khi truyền chuỗi HTML cuối cùng vào hàm gửi mail dùng chung.
* Giả định dịch vụ Email sẽ được thiết kế như một **Shared Utility** để các Service khác (EventService, AuthService) có thể gọi đến dễ dàng mà không cần quan tâm đến cấu hình SMTP.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Cơ chế Hàng chờ (Queue):** Có cần triển khai Redis/BullMQ để quản lý hàng chờ gửi mail không, hay chỉ cần gọi hàm async đơn giản? (Khuyến nghị dùng Queue để tránh mất mail khi server restart hoặc SMTP bị rate limit).
2. **Lựa chọn Template Engine:** Bạn muốn dùng thư viện nào để quản lý mẫu email (Handlebars là lựa chọn phổ biến nhất cho NodeMailer)?
3. **Tần suất gửi mail nhắc nhở (UC65):** Email nhắc nhở sự kiện sẽ gửi trước bao lâu (24h hay 1 tiếng)? Điều này sẽ quyết định việc thiết lập Cron Job.

## 7. ANSWERS

1. **Cơ chế Hàng chờ (Queue):**
   * **QUYẾT ĐỊNH:** **KHÔNG SỬ DỤNG** Redis/BullMQ.
   * **Thực hiện:** Hệ thống sử dụng async/await để thực hiện việc gửi email một cách bất đồng bộ. Sau khi xử lý nghiệp vụ hoàn tất, hệ thống sẽ gửi email trực tiếp từ tầng Service mà không sử dụng hàng chờ (queue).
   * **Lý do:** Giảm thiểu độ phức tạp về hạ tầng (Infrastructure complexity) và phù hợp với quy mô hiện tại của hệ thống VMS.

2. **Lựa chọn Template Engine:**
   * **QUYẾT ĐỊNH:** **KHÔNG DÙNG THƯ VIỆN NGOÀI** (như Handlebars, EJS).
   * **Thực hiện:** Thiết kế 1 hàm tiện ích (Utility Function) duy nhất nhận các tham số cần thiết (to, subject, content). Phần nội dung HTML (template) sẽ được xử lý bằng **JavaScript Template Strings** hoặc logic nội bộ để tự động sinh ra các biến phù hợp trước khi truyền vào hàm gửi.
   * **Lý do:** Tối ưu hóa hiệu năng, giảm dependency và giúp mã nguồn "vô trùng", dễ kiểm soát hoàn toàn logic sinh nội dung thư.

3. **Tần suất gửi mail nhắc nhở (UC65):**
   * **QUYẾT ĐỊNH:** **24 GIỜ** trước khi sự kiện bắt đầu.
   * **Thực hiện:** Hệ thống sẽ thiết lập một Cron Job (chạy hàng giờ hoặc hàng ngày) để quét các sự kiện sắp diễn ra trong 24 giờ tới và thực hiện gửi thông báo nhắc nhở cho các tình nguyện viên có trạng thái `Approved`.

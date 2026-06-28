# CONTEXT.md — Feature: Authentication - View Landing Page (UC01)

# Người viết: CuongLH | Ngày: 25/06/2026

## 1. PROBLEM STATEMENT

Landing Page là điểm chạm đầu tiên của khách vãng lai (Guest) khi truy cập vào hệ thống VMS. Để thuyết phục Guest trở thành tình nguyện viên chính thức, trang này không thể chỉ là văn bản giới thiệu tĩnh. Nó cần hiển thị trực quan các sự kiện tình nguyện đang hoạt động để thu hút sự chú ý, đồng thời cung cấp các luồng điều hướng (funnel) mượt mà dẫn dắt người dùng đến hành động Đăng nhập (UC03) hoặc Đăng ký (UC04).

## 2. DOMAIN KNOWLEDGE

- **Public Access (Truy cập công khai):** Đây là giao diện và API hoàn toàn không yêu cầu xác thực (No JWT Token). Bất kỳ ai có link đều có thể truy cập.
- **Cross-Module Data (Dữ liệu chéo):** Mặc dù UC01 thuộc Module 1 (Authentication), nó bắt buộc phải hiển thị dữ liệu của Module 2 (Event Management).
- **Conversion Funnel (Phễu chuyển đổi):** Mục tiêu nghiệp vụ cao nhất của Landing Page là chuyển đổi Guest thành Volunteer. Mọi nút "Đăng ký tham gia" tại các sự kiện trên trang này đối với Guest sẽ hoạt động như một trigger chuyển hướng về trang Đăng ký/Đăng nhập.

## 3. STAKEHOLDERS

- **Guest (Khách vãng lai):** Muốn xem hệ thống có các hoạt động tình nguyện nào hấp dẫn trước khi quyết định tạo tài khoản.
- **System / Infrastructure:** Cần đảm bảo API lấy dữ liệu sự kiện cho Landing Page phải cực kỳ tối ưu, vì đây là trang chịu tải cao nhất (ai cũng có thể F5 liên tục).

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)

- **Read-Only Access:** Các API phục vụ Landing Page TUYỆT ĐỐI CHỈ cấp quyền đọc (GET) dữ liệu sự kiện. Không cho phép bất kỳ thao tác thay đổi trạng thái nào từ Guest.
- **Data Privacy:** API trả về danh sách sự kiện cho Landing Page KHÔNG ĐƯỢC để lộ các thông tin nhạy cảm của tổ chức hoặc danh sách tình nguyện viên đã đăng ký.
- **Performance:** Vì là trang public không xác thực, API phải được bảo vệ bởi cơ chế Rate Limiting nghiêm ngặt để chống rủi ro bị tấn công DDoS hoặc cào dữ liệu (scraping).

## 5. ASSUMPTIONS (Giả định)

- Giả định Landing Page sẽ hiển thị một danh sách giới hạn các sự kiện (ví dụ: "Sự kiện nổi bật" hoặc "Sự kiện sắp diễn ra") thay vì load toàn bộ hàng ngàn sự kiện có trong cơ sở dữ liệu.
- Giả định nếu Guest muốn tìm kiếm hoặc lọc sự kiện chi tiết, họ sẽ bấm nút "Xem tất cả" để chuyển sang màn hình Event List (UC08).

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Tiêu chí hiển thị Sự kiện:** Trên Landing Page, bạn muốn hệ thống tự động chọn ra bao nhiêu sự kiện để hiển thị, và theo tiêu chí nào?
   - *Cách 1:* Hiển thị 6 sự kiện mới nhất vừa được tạo.
   - *Cách 2:* Hiển thị 6 sự kiện sắp diễn ra nhất (sắp đến hạn đăng ký).
   - *Cách 3:* Trả về ngẫu nhiên.
2. **Chiến lược Cache (Tối ưu tải):** Vì API này sẽ bị gọi liên tục bởi người dùng vãng lai, Backend có bắt buộc phải dùng Redis để lưu cache kết quả trả về không (ví dụ: cache 5 phút/lần thay vì query Database liên tục)?
3. **Thống kê công khai (Social Proof):** Ngoài sự kiện, Landing Page có cần API trả về các con số thống kê tổng quan để khoe thành tích hệ thống không (Ví dụ: Tổng số tình nguyện viên hiện có, Tổng số sự kiện đã tổ chức thành công)?

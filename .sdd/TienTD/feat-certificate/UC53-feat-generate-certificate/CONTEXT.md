# CONTEXT.md — Feature: Staff Module - Generate Certificate (UC53)
# Người viết: TienTD | Ngày: 28/06/2026

## 1. PROBLEM STATEMENT
- **Current Pain Point**: Sau khi sự kiện kết thúc, Staff phải tạo chứng nhận thủ công cho từng tình nguyện viên bằng các công cụ đồ họa bên ngoài. Việc này tốn rất nhiều thời gian và dễ dẫn đến sai sót thông tin (sai tên, sai số giờ đóng góp).
- **Impact on Staff Workflow**: Staff mất hàng giờ, thậm chí hàng ngày để hoàn thành việc cấp chứng nhận cho một sự kiện lớn. Quy trình rời rạc khiến việc lưu trữ và tra cứu lại chứng nhận đã cấp trở nên khó khăn.
- **Impact on Volunteers/Events**: Volunteer phải chờ đợi rất lâu để nhận được chứng nhận. Nếu thông tin trên chứng nhận bị sai, uy tín của tổ chức sẽ bị giảm sút và gây phiền hà cho người tham gia.
- **Business Value**: Tự động hóa việc tạo chứng nhận giúp Staff hoàn thành tác vụ chỉ trong vài giây, đảm bảo tính chính xác tuyệt đối của dữ liệu và nâng cao giá trị thương hiệu của tổ chức thông qua sự chuyên nghiệp.

## 2. DOMAIN KNOWLEDGE
- **Staff Role & Permissions**: Staff có quyền khởi tạo lệnh cấp chứng nhận cho các sự kiện thuộc tổ chức của mình.
- **Event Lifecycle**: Chứng nhận chỉ được phép cấp khi sự kiện đã chuyển sang trạng thái Completed.
- **Attendance Rules**: Chỉ những Volunteer có trạng thái điểm danh là Present (đã tham gia) mới đủ điều kiện nhận chứng nhận.
- **Certificate Criteria**: Hệ thống sẽ tự động lấy thông tin từ Profile của Volunteer và thông tin của Sự kiện để điền vào phôi chứng nhận có sẵn.
- **Business Rules**: 
    - Staff chỉ được cấp chứng nhận cho sự kiện thuộc Organization mình quản lý.
    - Mỗi Volunteer chỉ nhận được tối đa 01 chứng nhận cho mỗi sự kiện tham gia.
- **Cross-Module Dependencies**: UC53 phụ thuộc trực tiếp vào dữ liệu từ UC45 (Attendance Check) và là tiền đề để UC66 (Certificate Email) hoạt động.

## 3. STAKEHOLDERS
- **Staff (Actor chính)**: Muốn tạo chứng nhận nhanh chóng và hàng loạt để ghi nhận công lao của tình nguyện viên.
- **Volunteer**: Mong muốn nhận được chứng nhận chính xác, chuyên nghiệp ngay sau khi sự kiện kết thúc để bổ sung vào hồ sơ cá nhân.
- **Organization Admin**: Giám sát việc cấp chứng nhận để đảm bảo đúng quy trình và tiêu chuẩn của tổ chức.
- **System Admin**: Quan tâm đến việc lưu trữ các file chứng nhận (thường là PDF) và bảo mật mã QR xác thực trên chứng nhận.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)
- **Authorization Constraint**: Staff CHỈ được phép cấp chứng nhận cho Volunteer tham gia sự kiện do Organization của họ tổ chức.
- **State Transition Constraint**: Chức năng Generate chỉ khả dụng khi Event ở trạng thái Completed và Volunteer có status là Present.
- **Data Integrity Constraint**: Thông tin trên chứng nhận (Tên, ngày, tên sự kiện) phải khớp 100% với dữ liệu tại thời điểm sự kiện kết thúc.
- **Audit Trail Constraint**: Hệ thống phải ghi log: Staff nào đã nhấn lệnh cấp chứng nhận, vào lúc nào và cấp cho bao nhiêu người.

## 5. ASSUMPTIONS (Giả định)
- **Giả định về dữ liệu**: Giả định phôi chứng nhận (Template) của tổ chức đã được Admin upload và cấu hình sẵn các vùng dữ liệu động.
- **Giả định về permission**: Staff đã hoàn tất việc kiểm tra điểm danh (UC45) trước khi thực hiện bước này.
- **Giả định về hạ tầng**: Hệ thống có sẵn dịch vụ tạo file PDF và dịch vụ lưu trữ đám mây để chứa các file chứng nhận được tạo ra.

## 6. OPEN QUESTIONS
1. Staff có được phép chọn các mẫu chứng nhận (Template) khác nhau cho từng nhóm Volunteer không?
2. Khi Staff nhấn Generate, hệ thống có tự động gửi email (UC66) ngay lập tức hay Staff phải nhấn gửi thủ công?

## 7. DECISIONS
**Quyết định cho câu hỏi 1 - Template Strategy:**
- **Lựa chọn**: Cách 2 - Staff sử dụng template mặc định của Organization được Admin thiết lập sẵn.
- **Lý do**: Đảm bảo tính thống nhất về nhận diện thương hiệu của tổ chức và đơn giản hóa thao tác cho Staff.
- **Impact**: Backend sẽ lấy template ID từ bảng Organization gắn liền với Staff.

**Quyết định cho câu hỏi 2 - Notification Strategy:**
- **Lựa chọn**: Option A - Tự động trigger UC66 (Gửi email chứng nhận) ngay sau khi file PDF được tạo thành công.
- **Lý do**: Tối ưu hóa quy trình, giúp Volunteer nhận được phản hồi tức thì.
- **Impact**: Cần thiết kế cơ chế Async Job để xử lý việc tạo file và gửi email mà không làm treo giao diện của Staff.
# CONTEXT.md — Event Management (Quản lý sự kiện) - UC15, UC16, UC17

**Người viết:** Member 3 (Staff Operations) | **Ngày:** 2026-06-25

## 1. PROBLEM STATEMENT

Sự kiện là thực thể trung tâm của hệ thống VMS, nơi kết nối tổ chức và tình nguyện viên. Việc quản lý thông tin sự kiện hiện đang gặp các thách thức quan trọng ảnh hưởng đến toàn bộ luồng nghiệp vụ:

- **Thiếu tính nhất quán:** Dữ liệu sự kiện cần được số hóa toàn trình để làm căn cứ cho các khâu xét duyệt đơn đăng ký và điểm danh phía sau. Nếu thông tin sự kiện không chính xác hoặc bị thay đổi tùy tiện, các module phụ thuộc sẽ bị ảnh hưởng nghiêm trọng.
- **Rủi ro về dữ liệu cốt lõi:** Việc thay đổi thông tin quan trọng (thời gian, địa điểm, yêu cầu tham gia) khi sự kiện đang diễn ra hoặc đã kết thúc có thể gây hỗn loạn cho tình nguyện viên đã đăng ký và làm sai lệch dữ liệu lịch sử, ảnh hưởng đến tính minh bạch của tổ chức.
- **Vi phạm quy tắc sức chứa:** Nếu không có cơ chế quản lý `max_capacity` chặt chẽ ngay từ khâu tạo và chỉnh sửa sự kiện, hệ thống sẽ không thể kiểm soát được số lượng người tham gia tối đa, dẫn đến quá tải hoặc xung đột với khâu xét duyệt đơn.

## 2. DOMAIN KNOWLEDGE

- **Event Lifecycle (Vòng đời sự kiện):** Một sự kiện thường đi qua các trạng thái theo thứ tự: `Draft` (Nháp) → `Published` (Đã đăng) → `Open` (Mở đăng ký) → `In Progress` (Đang diễn ra) → `Completed` (Đã kết thúc). Mỗi trạng thái có ràng buộc riêng về việc chỉnh sửa thông tin.
- **Capacity Constraint (Ràng buộc sức chứa):** Mỗi sự kiện có một giới hạn `max_capacity` (số lượng tối đa). Số lượng tình nguyện viên được duyệt (`approved_participants`) TUYỆT ĐỐI không bao giờ được vượt quá con số này. Khi chỉnh sửa `max_capacity`, giá trị mới không được thấp hơn `approved_participants` hiện tại.
- **Soft Delete Rule (Quy tắc xóa mềm):** Sự kiện là Master Data (dữ liệu chủ), do đó không bao giờ được xóa vật lý khỏi database. Thay vào đó, sử dụng cờ `is_active = false` để đánh dấu sự kiện không còn hoạt động, đảm bảo tính toàn vẹn của audit trail và dữ liệu lịch sử.
- **Status Invariant (Bất biến trạng thái):** Khi sự kiện chuyển sang trạng thái `In Progress` hoặc `Completed`, TUYỆT ĐỐI KHÔNG được phép chỉnh sửa các thông tin cốt lõi (Core Fields) để đảm bảo tính nhất quán của dữ liệu đã commit.

## 3. STAKEHOLDERS

- **Staff (Người dùng chính):** Người trực tiếp tạo, chỉnh sửa, quản lý và xuất bản các sự kiện được phân công. Cần giao diện trực quan để quản lý danh sách sự kiện và theo dõi tiến độ lấp đầy sức chứa.
- **Volunteer:** Người tiếp nhận thông tin từ các sự kiện được Staff công bố. Cần thông tin sự kiện chính xác, đầy đủ (thời gian, địa điểm, yêu cầu) để đưa ra quyết định đăng ký tham gia.
- **Manager/Admin:** Người giám sát tiến độ tổ chức sự kiện, xem báo cáo tỷ lệ lấp đầy, và đánh giá hiệu quả dựa trên dữ liệu sự kiện. Cần dashboard để theo dõi các chỉ số quan trọng.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Status Invariant:** TUYỆT ĐỐI KHÔNG được phép chỉnh sửa các thông tin cốt lõi (Core Fields: `event_date`, `location`, `description`, `required_skills`, `max_capacity`) khi sự kiện có trạng thái là `In Progress` hoặc `Completed`. Chỉ các trường metadata như `is_active` mới được phép thay đổi.
- **Capacity Constraint:** Giá trị `max_capacity` khi chỉnh sửa KHÔNG được thấp hơn số lượng tình nguyện viên hiện tại đã được duyệt (`approved_participants`). Nếu vi phạm, hệ thống MUST trả về HTTP 400 Bad Request.
- **Soft Delete Rule:** Bắt buộc sử dụng xóa mềm bằng cách cập nhật cờ `is_active = false`. TUYỆT ĐỐI KHÔNG được xóa vật lý (DELETE) bản ghi Event khỏi database.
- **Security (Layer 1):** Chỉ Staff được phân công quản lý sự kiện cụ thể (qua bảng `staff_event_assignments` hoặc `organization_id`) mới có quyền chỉnh sửa/xóa sự kiện đó. `staff_id` BẮT BUỘC phải được trích xuất từ JWT HttpOnly Cookie (`req.user.id`), KHÔNG tin tưởng dữ liệu từ request body.
- **Tech Stack Backend:** Bắt buộc sử dụng Node.js (Express 5.x), MySQL, Prisma ORM, và validate input đầu vào bằng `Zod` trước khi xử lý logic nghiệp vụ.
- **API Standard:** Bắt buộc tuân thủ giao kèo API đã định nghĩa trong `share_context.md` và phải có comment Swagger JSDoc đầy đủ cho các endpoints Event Management.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- **A1:** Các danh mục sự kiện (Categories) và bộ kỹ năng (Skills) đã được Member 4 (Category Management) khởi tạo đầy đủ trong hệ thống trước khi Staff tạo sự kiện.
- **A2:** Nhân viên thực hiện thao tác tạo/chỉnh sửa sự kiện đã được xác thực qua JWT Token lưu trong HttpOnly Cookie, với `userId` được extract từ `req.user.id` bởi middleware authentication đã được implement.
- **A3:** Hình ảnh sự kiện (event banner/thumbnail) sẽ được lưu trữ qua dịch vụ Cloudinary. Integration với Cloudinary SDK đã được cấu hình sẵn trong Backend.
- **A4:** Bảng `staff_event_assignments` hoặc cơ chế phân quyền tương tự đã tồn tại trong database để xác định Staff nào được phân công quản lý Event nào.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Định nghĩa thông tin cốt lõi (Core Fields):** Ngoài "Thời gian" (`event_date`) và "Địa điểm" (`location`), các trường như "Mô tả" (`description`), "Kỹ năng yêu cầu" (`required_skills`), hay "Số lượng tối đa" (`max_capacity`) có được phép sửa khi sự kiện đang ở trạng thái `In Progress` hoặc `Completed` không?
2. **Logic Xóa mềm:** Nếu một sự kiện bị xóa mềm (`is_active = false`), các đơn đăng ký (Applications) liên quan của tình nguyện viên sẽ được xử lý như thế nào? (Hủy tự động với status `Cancelled` hay giữ nguyên trạng thái hiện tại?)
3. **Thay đổi sức chứa (Capacity Increase):** Khi tăng `max_capacity` cho một sự kiện đã đầy và có danh sách đơn đăng ký đang chờ (`Pending`), hệ thống có tự động duyệt đơn theo thứ tự FCFS (First-Come-First-Served) không, hay Staff phải duyệt thủ công từng đơn?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Sprint này định nghĩa **Core Fields (Thông tin cốt lõi không được sửa)** bao gồm: `event_date`, `start_time`, `end_time`, `location`, `description`, `required_skills`, và `max_capacity`. Khi Event ở trạng thái `In Progress` hoặc `Completed`, TUYỆT ĐỐI KHÔNG được phép chỉnh sửa các trường này. Chỉ các trường metadata như `is_active`, `status`, hoặc `updated_at` mới được phép thay đổi. Nếu cần sửa thông tin cốt lõi, phải liên hệ Admin để xử lý manual với audit trail đầy đủ.
- **A2:** Khi một Event bị xóa mềm (`is_active = false`), hệ thống sẽ **GIỮ NGUYÊN trạng thái** của tất cả Applications liên quan (không tự động hủy). Lý do: Đây là dữ liệu lịch sử quan trọng cần được bảo toàn cho mục đích audit và báo cáo. Nếu cần thông báo cho Volunteer, logic đó thuộc về Module Notification (Member 5) và nằm ngoài scope của Event Management.
- **A3:** Khi tăng `max_capacity` cho một Event đã đầy, hệ thống **KHÔNG tự động duyệt** các đơn `Pending` trong danh sách chờ. Staff BẮT BUỘC phải duyệt thủ công từng đơn thông qua chức năng "Application Approval" để đảm bảo kiểm soát chất lượng và quyền quyết định của nhân viên. Tính năng auto-approve theo FCFS sẽ được xem xét trong version sau nếu có nhu cầu thực tế.

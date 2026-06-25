# CONTEXT.md — Application Approval (Xét duyệt đơn đăng ký) - UC30, UC31, UC32

**Người viết:** Member 3 (Staff Operations) | **Ngày:** 2026-06-25

## 1. PROBLEM STATEMENT

Quy trình xét duyệt đơn đăng ký tham gia sự kiện là khâu quan trọng để đảm bảo chất lượng và kiểm soát sức chứa của sự kiện. Tuy nhiên, việc xét duyệt đang gặp các thách thức cơ bản ảnh hưởng đến tính toàn vẹn dữ liệu và trải nghiệm người dùng:

- **Rủi ro vượt sức chứa:** Trong môi trường đa nhân viên làm việc đồng thời, nếu không có cơ chế khóa dữ liệu chặt chẽ, hệ thống có thể duyệt vượt quá `max_capacity` của sự kiện do race condition, dẫn đến quá tải và mất kiểm soát.
- **Thiếu minh bạch trong từ chối:** Khi Staff từ chối đơn mà không cung cấp lý do cụ thể, tình nguyện viên không hiểu được nguyên nhân và có thể mất niềm tin vào tổ chức, ảnh hưởng đến tỷ lệ tham gia trong các sự kiện tiếp theo.
- **Xử lý không công bằng:** Nếu không có quy trình ưu tiên rõ ràng (FCFS - First Come First Served), việc xét duyệt có thể bị cảm tính hoặc thiên vị, gây mất công bằng cho người đăng ký sớm.
- **Dữ liệu không nhất quán:** Trạng thái đơn đăng ký có thể bị thay đổi tùy tiện (từ Approved về Pending, hoặc từ Rejected về Approved) mà không có kiểm soát, gây hỗn loạn cho luồng nghiệp vụ điểm danh và cấp chứng nhận sau này.

## 2. DOMAIN KNOWLEDGE

- **Finite State Machine (Máy trạng thái hữu hạn):** Đơn đăng ký (Application) tuân theo FSM nghiêm ngặt với các trạng thái: `Pending` (Chờ xét duyệt) → `Approved` (Đã duyệt) hoặc `Rejected` (Từ chối). Một khi đã chuyển sang `Approved` hoặc `Rejected`, trạng thái này là **immutable** (không thể thay đổi) để đảm bảo tính toàn vẹn dữ liệu cho các module phụ thuộc (Attendance, Certificate).
- **Capacity Constraint (Ràng buộc sức chứa):** Đây là business invariant cứng: `approved_participants <= max_capacity` PHẢI luôn đúng trong mọi trường hợp. Khi duyệt đơn, hệ thống phải đảm bảo không vượt quá giới hạn này ngay cả khi có nhiều Staff duyệt đồng thời.
- **FCFS Rule (Quy tắc ưu tiên):** Khi có nhiều đơn `Pending` và sức chứa có giới hạn, hệ thống PHẢI ưu tiên duyệt đơn được nộp sớm nhất (dựa trên `created_at` timestamp) để đảm bảo tính công bằng và minh bạch.
- **Rejection Reason Mandatory (Bắt buộc lý do từ chối):** Mỗi đơn bị từ chối PHẢI có `rejection_reason` NOT NULL để đảm bảo tính minh bạch và giúp tình nguyện viên hiểu rõ nguyên nhân, từ đó cải thiện hồ sơ cho các lần đăng ký sau.
- **Authorization Rule (Quy tắc phân quyền):** Chỉ Staff được phân công quản lý sự kiện cụ thể (thông qua `staff_event_assignments` hoặc `organization_id`) mới có quyền xét duyệt đơn đăng ký cho sự kiện đó. Điều này ngăn chặn việc Staff xét duyệt đơn cho sự kiện không thuộc phạm vi quản lý của mình.

## 3. STAKEHOLDERS

- **Staff (Người dùng chính):** Người trực tiếp thực hiện xét duyệt đơn đăng ký tham gia sự kiện được phân công. Cần giao diện đơn giản để xem danh sách đơn, lọc theo trạng thái, và duyệt/từ chối nhanh chóng. Đặc biệt cần tính năng bulk approval để xử lý hiệu quả khi có số lượng lớn đơn đăng ký.
- **Volunteer (Người nộp đơn):** Người chờ kết quả xét duyệt để biết được mình có được tham gia sự kiện hay không. Cần được thông báo kết quả kịp thời và nếu bị từ chối, cần biết rõ lý do để cải thiện cho lần sau.
- **Manager/Admin:** Người giám sát quy trình xét duyệt, theo dõi tỷ lệ duyệt/từ chối để đánh giá chất lượng tuyển chọn và hiệu quả vận hành của Staff. Cần dashboard để xem các chỉ số quan trọng như tỷ lệ lấp đầy, thời gian xử lý đơn trung bình.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Data Integrity (Tính toàn vẹn dữ liệu):** Mọi thao tác duyệt/từ chối đơn PHẢI được thực hiện trong Database Transaction với **Serializable Isolation Level** để đảm bảo business invariant `approved_participants <= max_capacity` luôn đúng ngay cả khi có nhiều Staff duyệt đồng thời. Nếu transaction fail, hệ thống PHẢI rollback toàn bộ thay đổi.
- **Security (Layer 1):** `staff_id` của nhân viên thực hiện xét duyệt BẮT BUỘC phải được trích xuất trực tiếp từ JWT Token lưu trong HttpOnly Cookie (`req.user.id`), TUYỆT ĐỐI KHÔNG tin tưởng dữ liệu `staff_id` truyền từ request body để tránh giả mạo.
- **Authorization (Layer 2):** Hệ thống PHẢI kiểm tra Staff có được phân công quản lý Event đó hay không thông qua bảng `staff_event_assignments` hoặc `organization_id`. Nếu không, PHẢI trả về HTTP 403 Forbidden.
- **Audit Trail:** Hệ thống PHẢI ghi Audit Log đầy đủ cho mọi thay đổi trạng thái Application, bao gồm: `staff_id`, `application_id`, `old_status`, `new_status`, `rejection_reason` (nếu có), và `timestamp`. Audit Log PHẢI được ghi trong cùng transaction với việc cập nhật dữ liệu để đảm bảo tính nhất quán.
- **Tech Stack Backend:** Bắt buộc sử dụng Node.js (Express 5.x), MySQL (InnoDB) làm database, Prisma ORM cho data access, và validate input đầu vào bằng `Zod` trước khi xử lý logic nghiệp vụ.
- **API Standard:** Bắt buộc tuân thủ giao kèo API đã định nghĩa trong `share_context.md` và phải có comment Swagger JSDoc đầy đủ cho các endpoints Application Approval.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- **A1:** Module Event Management (Member 2) đã implement chức năng tạo đơn đăng ký (Application) với trạng thái mặc định là `Pending`, và các đơn này đã được lưu vào database với `created_at` timestamp chính xác.
- **A2:** Nhân viên thực hiện xét duyệt đã được xác thực qua JWT Token lưu trong HttpOnly Cookie, với `userId` được extract từ `req.user.id` bởi middleware authentication đã được implement.
- **A3:** Bảng `staff_event_assignments` hoặc cơ chế phân quyền tương tự đã tồn tại trong database để xác định Staff nào được phân công quản lý Event nào.
- **A4:** Tài khoản Volunteer và Staff đều có trường `is_active` để đánh dấu trạng thái hoạt động. Hệ thống cần kiểm tra trường này trước khi cho phép xét duyệt.
- **A5:** Database MySQL (InnoDB engine) hỗ trợ Serializable Isolation Level và có thể handle concurrent transactions với performance chấp nhận được trong môi trường production.
- **A6:** Frontend đã cấu hình HTTP client để gửi credentials (cookies) tự động trong mọi request đến Backend với `withCredentials: true`.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Rollback sau khi đã duyệt:** Nếu Staff duyệt nhầm đơn, liệu hệ thống có cho phép Staff hoặc Manager rollback trạng thái từ `Approved` về `Pending` không? Hay phải liên hệ Admin để xử lý manual?
2. **Thông báo tự động:** Khi đơn được duyệt hoặc từ chối, hệ thống có tự động gửi email/notification cho Volunteer không, hay việc này do Module Notification (Member 5) xử lý riêng thông qua event-driven architecture?
3. **Bulk Reject:** Ngoài Bulk Approve, hệ thống có cần tính năng Bulk Reject (từ chối hàng loạt) không? Nếu có, Staff phải nhập lý do chung cho tất cả đơn hay nhập từng lý do riêng?
4. **Xét duyệt sau khi sự kiện đã bắt đầu:** Liệu Staff có được phép duyệt đơn khi sự kiện đang ở trạng thái `In Progress` hoặc `Completed` không, hay chỉ cho phép duyệt khi sự kiện còn ở trạng thái `Published` hoặc `Open`?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Sprint này KHÔNG cho phép rollback trạng thái từ `Approved` hoặc `Rejected` về `Pending`. Trạng thái Application là **immutable** sau khi xử lý để đảm bảo tính toàn vẹn dữ liệu cho các module phụ thuộc (Attendance, Certificate). Nếu có sai sót, phải liên hệ Admin để xử lý manual với audit trail đầy đủ. Tính năng rollback có kiểm soát sẽ được xem xét trong version sau.
- **A2:** Module Application Approval CHỈ chịu trách nhiệm cập nhật trạng thái đơn trong database. Việc gửi thông báo cho Volunteer (email, push notification) là trách nhiệm của Module Notification (Member 5) và sẽ được kích hoạt thông qua event-driven architecture (ví dụ: Event Emitter hoặc Message Queue). Logic notification KHÔNG nằm trong scope của module này.
- **A3:** Sprint này CHỈ triển khai **Bulk Approve**. Bulk Reject yêu cầu UX phức tạp hơn (nhập lý do chung hay từng lý do riêng) và chưa có nhu cầu nghiệp vụ rõ ràng từ stakeholders. Tính năng này sẽ được xem xét trong iteration sau nếu có feedback thực tế từ Staff.
- **A4:** Hệ thống CHỈ cho phép xét duyệt đơn khi Event đang ở trạng thái **`Published`** hoặc **`Open`**. Nếu Event đã chuyển sang `In Progress` hoặc `Completed`, hệ thống sẽ trả về lỗi `400 Bad Request` với message "Cannot approve applications for this event status" để đảm bảo tính nhất quán của dữ liệu đã commit.

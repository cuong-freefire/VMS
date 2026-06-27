# CONTEXT.md — Attendance Management (Quản lý điểm danh) - UC45, UC46, UC47

**Người viết:** Member 3 (Staff Operations) | **Ngày:** 2026-06-25

## 1. PROBLEM STATEMENT

Khâu ghi nhận sự tham gia thực tế của tình nguyện viên tại sự kiện là mắt xích quan trọng nhưng đang gặp rủi ro về tính chính xác và minh bạch dữ liệu. Cụ thể:

- **Sai lệch dữ liệu cấp chứng nhận:** Nếu không có cơ chế điểm danh chặt chẽ, hệ thống có thể cấp chứng nhận cho những người đã đăng ký nhưng thực tế không tham gia (no-show), gây mất uy tín cho tổ chức.
- **Quy trình xử lý no-show không thống nhất:** Nhân viên thường nhầm lẫn giữa việc "Hủy đơn" và "Điểm danh vắng mặt", dẫn đến mất dấu vết lịch sử đơn đăng ký và làm sai lệch báo cáo tham gia thực tế.
- **Thiếu minh bạch:** Tình nguyện viên không thể theo dõi lịch sử tham gia thực tế của mình để làm minh chứng cho các hoạt động tình nguyện, ảnh hưởng đến trải nghiệm người dùng.

## 2. DOMAIN KNOWLEDGE

- **Attendance Invariant (Ràng buộc điểm danh):** Hệ thống CHỈ được phép thực hiện điểm danh cho những tình nguyện viên có đơn đăng ký (Application) ở trạng thái `Approved`. Đơn ở trạng thái `Pending`, `Rejected`, hoặc `Cancelled` KHÔNG được điểm danh.
- **Attendance Status (Trạng thái điểm danh):** Bao gồm hai trạng thái chính: `Present` (Có mặt) và `Absent` (Vắng mặt). Trạng thái này là immutable (không thể thay đổi sau khi tạo).
- **No-show Handling Rule:** Đối với các trường hợp tình nguyện viên không đến sự kiện, nhân viên BẮT BUỘC phải sử dụng chức năng điểm danh với status `Absent`, TUYỆT ĐỐI KHÔNG được sử dụng chức năng "Hủy đơn" để đảm bảo tính toàn vẹn của luồng giao dịch và lưu lại lịch sử đầy đủ.
- **Certificate Prerequisite:** Dữ liệu điểm danh hợp lệ (Attendance record với `status: Present`) là điều kiện tiên quyết và bắt buộc để hệ thống có thể tạo và cấp phát chứng nhận hoàn thành sự kiện cho tình nguyện viên sau này. Logic cấp chứng nhận được xử lý bởi Module Certificate (Member 4).

## 3. STAKEHOLDERS

- **Staff (Người dùng chính):** Thực hiện thao tác điểm danh cho tình nguyện viên tại địa điểm tổ chức sự kiện. Cần giao diện đơn giản, nhanh chóng để điểm danh nhiều người trong thời gian ngắn.
- **Volunteer:** Người được điểm danh, cần xem lại lịch sử tham gia của mình để theo dõi và làm minh chứng cho các hoạt động tình nguyện trong hồ sơ cá nhân.
- **Manager/Admin:** Theo dõi báo cáo tỷ lệ tham gia thực tế (Present rate) so với số lượng đã duyệt để đánh giá hiệu quả sự kiện và chất lượng tuyển chọn tình nguyện viên.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Security (Layer 1):** `userId` của nhân viên thực hiện điểm danh BẮT BUỘC phải được trích xuất trực tiếp từ JWT Token lưu trong HttpOnly Cookie (`req.user.id`), TUYỆT ĐỐI KHÔNG tin tưởng dữ liệu `staff_id` truyền từ request body để tránh giả mạo.
- **Data Integrity:** Mọi thao tác điểm danh phải được thực hiện thông qua Prisma ORM để đảm bảo tính ACID (Atomicity, Consistency, Isolation, Durability) khi tạo bản ghi Attendance và cập nhật lịch sử.
- **Audit Log (Layer 2):** Hệ thống phải tự động ghi lại Audit Log đầy đủ: Ai là người thực hiện điểm danh (`staff_id`), điểm danh cho ai (`volunteer_id`), cho sự kiện nào (`event_id`), vào thời điểm nào (`timestamp`), và trạng thái điểm danh là gì (`status: Present/Absent`).
- **Tech Stack Backend:** Bắt buộc sử dụng Node.js (Express 5.x), MySQL làm database, và validate input đầu vào bằng `Zod` trước khi xử lý logic nghiệp vụ.
- **API Standard:** Bắt buộc tuân thủ giao kèo API đã định nghĩa trong `share_context.md` và phải có comment Swagger JSDoc đầy đủ cho endpoint `POST /api/v1/staff/attendance/check`.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- **A1:** Dữ liệu về Event và danh sách Application đã chuyển sang trạng thái `Approved` đã được hoàn tất ở các bước trước đó bởi Module Event (Member 2).
- **A2:** Nhân viên thực hiện điểm danh được xác thực qua JWT Token lưu trong HttpOnly Cookie, với `userId` được extract từ `req.user.id` bởi middleware authentication đã được implement.
- **A3:** Bảng `staff_event_assignments` hoặc cơ chế phân quyền tương tự đã tồn tại trong database để xác định Staff nào được phân công quản lý Event nào.
- **A4:** Event được chuyển sang trạng thái `In Progress` bởi Staff/Manager khi sự kiện bắt đầu diễn ra. Logic này đã được implement ở Module Event (Member 2).

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Hạn chót điểm danh:** Hệ thống có cho phép nhân viên điểm danh bù sau khi sự kiện đã kết thúc (`status: Completed`) không? (Ví dụ: bổ sung trong vòng 24h sau sự kiện?)
2. **Phương thức điểm danh:** Ngoài việc tích chọn thủ công trên danh sách (Manual Check), hệ thống có yêu cầu tích hợp quét mã QR của tình nguyện viên không?
3. **Điểm danh nhiều lần:** Đối với sự kiện diễn ra trong nhiều ngày, việc điểm danh sẽ được tính theo từng ngày (multiple attendance records per event) hay chỉ tính một lần cho cả sự kiện (single attendance record)?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Sprint này KHÔNG cho phép điểm danh bù sau khi sự kiện kết thúc. Hệ thống chỉ cho phép điểm danh khi Event đang ở trạng thái `In Progress`. Nếu Event đã chuyển sang `Completed`, hệ thống sẽ trả về lỗi `400 Bad Request`. Tính năng điểm danh bù (make-up attendance) sẽ được xem xét trong version sau nếu có nhu cầu thực tế.
- **A2:** Sprint này CHỈ triển khai phương thức điểm danh thủ công (Manual Check) thông qua giao diện web với checkbox/button. QR Code scanning hoặc Biometric check-in là out of scope cho version hiện tại và sẽ được xem xét trong iteration sau.
- **A3:** Sprint này CHỈ hỗ trợ một bản ghi Attendance cho toàn bộ sự kiện (single attendance record per volunteer per event). Logic điểm danh theo từng ngày (daily attendance) cho sự kiện kéo dài nhiều ngày sẽ được implement trong version sau khi có requirement cụ thể hơn.

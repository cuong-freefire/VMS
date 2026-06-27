# CONTEXT.md — Volunteer Home Dashboard

# Người viết: NamLD (Member 2) | Ngày: 2026-06-27

## 1. PROBLEM STATEMENT

Hệ thống Volunteer Event Management System cần một màn hình Home Dashboard dành cho Volunteer sau khi đăng nhập để giúp Volunteer nhanh chóng nắm được các thông tin quan trọng liên quan đến hoạt động tình nguyện của mình.

Trong các feature trước, Volunteer có thể:

* Tìm kiếm và lọc event ở `001-volunteer-event-discovery`.
* Xem chi tiết event ở `002-volunteer-event-detail`.
* Apply event ở `003-volunteer-event-application`.
* Xem applied events và cancel application `PENDING` ở `004-volunteer-applied-events`.
* Xem lịch sử tham gia ở `005-volunteer-history`.
* Gửi feedback sau khi điểm danh thành công ở `006-volunteer-feedback-form`.
* Xem và tải certificate ở `007-volunteer-certificates`.

Tuy nhiên, nếu mỗi lần đăng nhập Volunteer phải tự đi từng màn để kiểm tra event mới, application đang chờ duyệt, event sắp diễn ra, feedback chưa gửi hoặc certificate đã có, trải nghiệm sẽ bị rời rạc.

Feature `008-volunteer-home-dashboard` tập trung vào **Volunteer Home Dashboard**, bao gồm:

* Hiển thị lời chào và thông tin ngắn của Volunteer.
* Hiển thị shortcut đến Event Discovery.
* Hiển thị số lượng application đang `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` nếu dữ liệu có sẵn.
* Hiển thị event sắp diễn ra mà Volunteer đã được approve nếu dữ liệu có sẵn.
* Hiển thị nhắc nhở feedback cho event đã điểm danh thành công nhưng chưa feedback.
* Hiển thị certificate mới hoặc certificate available nếu có.
* Hiển thị volunteer history summary nếu có.
* Hiển thị các quick actions để đi đến Applied Events, Volunteer History, Feedback Form và Certificates.
* Hiển thị loading, empty, partial data và error states.

Feature này không xử lý search/filter event trực tiếp, không hiển thị full Event Detail, không submit Apply Event, không cancel application, không điểm danh, không submit feedback trực tiếp, không download certificate trực tiếp, không generate certificate, không tạo notification, không thống kê toàn hệ thống và không export report.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Volunteer Event Module.

* **Feature:** Volunteer Home Dashboard.

* **Related Screens:**

  * Home Dashboard
  * Event List
  * Applied Event List
  * Volunteer History
  * Feedback Form
  * Certificate List
  * Certificate Detail

* **Related Use Cases:**

  * UC02 — View Home Page
  * UC08 — View Event List
  * UC09 — View Event Detail
  * UC10 — Search Event
  * UC11 — Filter Event
  * UC12 — Apply Event
  * UC13 — View Applied Events
  * UC14 — Cancel Application
  * UC21 — View Volunteer History
  * UC48 — Submit Feedback
  * UC51 — View Certificates
  * UC52 — Download Certificate

* **Connected Use Cases:**

  * UC03 — Login
  * UC18 — View Profile
  * UC19 — Edit Profile
  * UC20 — Edit Volunteer Skills
  * UC24 — Approve Application
  * UC25 — Reject Application
  * UC45 — Attendance Check-in
  * UC53 — Generate Certificate
  * UC54 — View Dashboard
  * UC55 — Event Statistics
  * UC56 — Volunteer Statistics
  * UC57 — Export Reports

* **Related Actors:**

  * Guest
  * Volunteer
  * Staff
  * Manager
  * Admin

* **Guest:** Guest không phải role được lưu trong database. Guest là trạng thái người dùng chưa đăng nhập. Guest có thể xem các trang public như Landing Page, Event List và Event Detail, nhưng không được xem Volunteer Home Dashboard vì dashboard này chứa dữ liệu cá nhân.

* **Volunteer:** Volunteer là user đã đăng nhập với role `VOLUNTEER`. Volunteer là actor chính của feature này.

* **Staff:** Staff là user có role `STAFF`, phụ trách event, application review, attendance, feedback list và certificate generation ở module khác. Volunteer Home Dashboard chỉ đọc các trạng thái phát sinh từ Staff workflow nếu dữ liệu có sẵn.

* **Manager:** Manager là user có role `MANAGER`, phụ trách category, skill, staff account và organization management. Manager Dashboard không thuộc feature này.

* **Admin:** Admin là user có role `ADMIN`, phụ trách dashboard tổng quan, thống kê toàn hệ thống, notification và donation history. Admin Dashboard không thuộc feature này.

* **Volunteer Home Dashboard:** Trang tổng hợp nhanh dành cho Volunteer sau khi đăng nhập, giúp Volunteer nhìn thấy các thông tin và hành động quan trọng nhất.

* **Quick Action:** Nút hoặc link điều hướng sang feature khác, ví dụ Event Discovery, Applied Events, Volunteer History, Feedback Form hoặc Certificates.

* **Dashboard Summary:** Các số liệu hoặc thẻ tóm tắt liên quan đến chính Volunteer hiện tại, ví dụ số application pending, số event approved sắp diễn ra, số certificate available.

* **Upcoming Approved Event:** Event sắp diễn ra mà Volunteer đã có application `APPROVED`.

* **Feedback Reminder:** Nhắc nhở dành cho event mà Volunteer đã điểm danh thành công nhưng chưa gửi feedback.

* **Certificate Reminder:** Nhắc nhở hoặc shortcut khi Volunteer có certificate available.

* **Volunteer Activity Summary:** Tóm tắt lịch sử hoạt động của Volunteer, ví dụ số event đã tham gia hoặc tổng giờ tình nguyện nếu dữ liệu có sẵn.

---

## 3. STAKEHOLDERS

* **Volunteer:** Cần một màn hình tổng quan sau khi đăng nhập để biết mình nên làm gì tiếp theo.

* **NamLD / Member 2:** Chịu trách nhiệm chính với Volunteer Home Dashboard trong Volunteer Event Module.

* **Member 1 — Authentication & Profile:** Phụ trách login/session/current user/profile. Dashboard cần biết user đã đăng nhập chưa, role là gì, tên Volunteer và có thể cần profile/skill completion nếu hiển thị.

* **Member 2 — Volunteer Event Module:** Dashboard tổng hợp dữ liệu từ các feature của chính Member 2 như Event Discovery, Applied Events, Volunteer History, Feedback Form và Certificates.

* **Member 3 — Staff Module:** Dashboard phụ thuộc dữ liệu từ Staff workflow như application approval, attendance result và certificate generation.

* **Member 4 — Manager Module:** Dashboard có thể dùng category/skill/organization data gián tiếp thông qua event summary, nhưng không quản lý các dữ liệu này.

* **Member 5 — Admin Module:** Admin Dashboard, Event Statistics, Volunteer Statistics và Export Report là module riêng, không thuộc Volunteer Home Dashboard.

---

## 4. CONSTRAINTS (Ràng buộc cứng)

* **SDD Workflow:** Feature này phải đi theo thứ tự `context.md` → `spec.md` → `plan.md` → `tasks.md` → implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, route, component, migration hoặc code task.

* **Authentication Required:** Volunteer Home Dashboard là màn hình cá nhân, chỉ user đã đăng nhập mới được xem.

* **Guest Boundary:** Guest không được xem Volunteer Home Dashboard. Guest chỉ xem public Landing/Event pages.

* **Role Boundary:** Chỉ user có role `VOLUNTEER` mới dùng Volunteer Home Dashboard trong feature này.

* **Database Role Boundary:** Guest không phải role được lưu trong database. Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **Ownership Boundary:** Dashboard chỉ hiển thị dữ liệu của Volunteer hiện tại.

* **Admin Dashboard Boundary:** Feature này không phải Admin Dashboard, không hiển thị thống kê toàn hệ thống.

* **Manager Dashboard Boundary:** Feature này không phải Manager Dashboard, không xuất report, không quản lý category/skill/organization.

* **Staff Dashboard Boundary:** Feature này không phải Staff dashboard, không hiển thị application list cho Staff, không approve/reject application, không manage attendance.

* **Event Discovery Boundary:** Dashboard chỉ có shortcut hoặc preview event gợi ý nếu cần. Search/filter đầy đủ thuộc `001-volunteer-event-discovery`.

* **Event Detail Boundary:** Dashboard không hiển thị full Event Detail. Full detail thuộc `002-volunteer-event-detail`.

* **Apply Boundary:** Dashboard không submit Apply Event. Apply Event thuộc `003-volunteer-event-application`.

* **Applied Events Boundary:** Dashboard có thể hiển thị summary hoặc shortcut, nhưng danh sách đầy đủ và cancel application thuộc `004-volunteer-applied-events`.

* **Volunteer History Boundary:** Dashboard có thể hiển thị summary hoặc shortcut, nhưng lịch sử đầy đủ thuộc `005-volunteer-history`.

* **Feedback Boundary:** Dashboard có thể hiển thị reminder hoặc shortcut, nhưng submit feedback thuộc `006-volunteer-feedback-form`.

* **Certificate Boundary:** Dashboard có thể hiển thị reminder hoặc shortcut, nhưng list/detail/download certificate thuộc `007-volunteer-certificates`.

* **Notification Boundary:** Dashboard không tạo notification. Notification List/Detail/Create thuộc module Notification Management.

* **Donation Boundary:** Dashboard không xử lý donation/payment. Donation History thuộc Admin Module trong team assignment.

* **Reporting Boundary:** Dashboard này không export report, không hiển thị Event Statistics hoặc Volunteer Statistics toàn hệ thống.

* **Partial Data Boundary:** Vì dashboard tổng hợp nhiều nguồn dữ liệu, nếu một phần dữ liệu lỗi, UI nên vẫn hiển thị các phần còn lại nếu có thể.

* **Mock Data:** Có thể dùng mock dashboard data trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS (Các giả định hiện tại)

* Guest là trạng thái chưa đăng nhập, không phải role lưu trong database.
* Role trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.
* Volunteer Home Dashboard dành cho Volunteer đã đăng nhập.
* Guest không xem Volunteer Home Dashboard.
* Staff, Manager, Admin không dùng dashboard này.
* Dashboard này khác với Admin Dashboard và Reporting Dashboard.
* Dashboard nên được viết sau các feature core vì nó tổng hợp dữ liệu từ nhiều feature khác.
* Dashboard có thể hiển thị lời chào theo tên Volunteer nếu profile data có sẵn.
* Dashboard có thể hiển thị profile/skill completion nếu Member 1 cung cấp dữ liệu.
* Dashboard nên có shortcut đến Event Discovery để Volunteer tìm event mới.
* Dashboard có thể hiển thị event gợi ý hoặc event mới nếu dữ liệu có sẵn.
* Dashboard có thể hiển thị application summary theo status nếu dữ liệu có sẵn.
* Dashboard có thể hiển thị số application `PENDING` để Volunteer biết đơn nào đang chờ duyệt.
* Dashboard có thể hiển thị số application `APPROVED` hoặc event sắp diễn ra để Volunteer chuẩn bị tham gia.
* Dashboard có thể hiển thị reminder cho attendance nếu event sắp diễn ra và Volunteer đã được approve.
* Dashboard không thực hiện Attendance Check-in.
* Dashboard có thể hiển thị feedback reminder nếu Volunteer đã điểm danh thành công nhưng chưa gửi feedback.
* Dashboard không submit feedback trực tiếp.
* Dashboard có thể hiển thị certificate available reminder nếu Volunteer có certificate mới.
* Dashboard không download certificate trực tiếp.
* Dashboard có thể hiển thị volunteer history summary, ví dụ số event đã tham gia hoặc tổng giờ tình nguyện nếu dữ liệu có sẵn.
* Dashboard có thể hiển thị empty state thân thiện nếu Volunteer mới chưa có application/history/certificate.
* Dashboard có thể có loading state khi tải dữ liệu tổng hợp.
* Dashboard có thể có partial error state nếu một số phần tải lỗi.
* Database/API thật cần được thống nhất sau khi `plan.md` và `api-contract.md` được viết.

---

## 6. RESOLVED QUESTIONS (Tự trả lời dựa trên docs mới và quyết định trước đó)

### Q1. Guest có phải role trong database không?

**Answer:** Không. Guest chỉ là trạng thái chưa đăng nhập. Role trong database chỉ gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

---

### Q2. Guest có được xem Volunteer Home Dashboard không?

**Answer:** Không. Volunteer Home Dashboard chứa dữ liệu cá nhân của Volunteer, nên Guest không được xem.

---

### Q3. Home Dashboard này là dashboard nào?

**Answer:** Đây là Volunteer Home Dashboard thuộc Member 2. Nó không phải Admin Dashboard, không phải Reporting Dashboard và không phải Manager Dashboard.

---

### Q4. Ai là actor chính của feature này?

**Answer:** Authenticated Volunteer.

---

### Q5. Staff, Manager, Admin có dùng dashboard này không?

**Answer:** Không trong feature này. Staff, Manager và Admin có các màn/module riêng.

---

### Q6. Dashboard này có phải nơi search/filter event không?

**Answer:** Không. Dashboard chỉ có shortcut hoặc preview. Search/filter đầy đủ thuộc `001-volunteer-event-discovery`.

---

### Q7. Dashboard này có submit Apply Event không?

**Answer:** Không. Apply Event thuộc `003-volunteer-event-application`.

---

### Q8. Dashboard này có cancel application không?

**Answer:** Không. Cancel Application thuộc `004-volunteer-applied-events`.

---

### Q9. Dashboard này có điểm danh không?

**Answer:** Không. Attendance Check-in thuộc Attendance Management.

---

### Q10. Dashboard này có submit feedback không?

**Answer:** Không. Dashboard chỉ có thể nhắc nhở hoặc điều hướng sang Feedback Form. Submit feedback thuộc `006-volunteer-feedback-form`.

---

### Q11. Dashboard này có download certificate không?

**Answer:** Không trực tiếp. Dashboard chỉ có thể nhắc nhở hoặc điều hướng sang Certificate List/Detail. Download thuộc `007-volunteer-certificates`.

---

### Q12. Dashboard này có hiển thị thống kê toàn hệ thống không?

**Answer:** Không. Thống kê toàn hệ thống, Event Statistics, Volunteer Statistics và Export Report thuộc Admin/Reporting module.

---

### Q13. Dashboard nên hiển thị những block nào trong bản đầu?

**Answer:** Bản đầu nên có:

* welcome/profile summary;
* shortcut đến Event Discovery;
* applied events summary;
* upcoming approved events;
* volunteer history summary;
* feedback reminders;
* certificate reminders;
* quick actions.

---

### Q14. Dashboard có cần hiển thị donation/payment không?

**Answer:** Không trong feature này. Donation History thuộc Admin Module theo team assignment, còn donation/payment không phải phạm vi của Volunteer Home Dashboard bản đầu.

---

### Q15. Dashboard có cần hiển thị notification không?

**Answer:** Có thể hiển thị shortcut hoặc count nếu notification data có sẵn, nhưng quản lý notification không thuộc feature này. Bản đầu nên để notification là optional để tránh lệch scope.

---

### Q16. Dashboard có cần hỗ trợ partial error không?

**Answer:** Có. Vì dashboard tổng hợp nhiều dữ liệu, nếu một block lỗi, các block khác vẫn nên hiển thị nếu tải được.

---

### Q17. Dashboard nên làm trước hay sau các feature khác?

**Answer:** Nên làm sau các feature core vì dashboard phụ thuộc vào Event Discovery, Applied Events, Volunteer History, Feedback và Certificates.

---

## 7. ANSWERS (Đã chốt nghiệp vụ cho bản đầu)

* **A1:** Feature này là `008-volunteer-home-dashboard`.

* **A2:** Feature này thuộc Member 2 — Volunteer Event Module.

* **A3:** Feature này là Volunteer Home Dashboard, không phải Admin/Manager/Reporting Dashboard.

* **A4:** Guest không phải role lưu trong database.

* **A5:** Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **A6:** Guest không được xem Volunteer Home Dashboard.

* **A7:** Chỉ authenticated Volunteer được xem Volunteer Home Dashboard trong feature này.

* **A8:** Dashboard chỉ hiển thị dữ liệu thuộc Volunteer hiện tại.

* **A9:** Dashboard không hiển thị dữ liệu cá nhân của Volunteer khác.

* **A10:** Dashboard nên hiển thị welcome/profile summary nếu dữ liệu có sẵn.

* **A11:** Dashboard nên có shortcut đến Event Discovery.

* **A12:** Dashboard có thể hiển thị event mới hoặc event gợi ý nếu dữ liệu có sẵn.

* **A13:** Dashboard nên hiển thị applied events summary nếu dữ liệu có sẵn.

* **A14:** Applied events summary có thể gồm số application `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

* **A15:** Dashboard nên hiển thị upcoming approved events nếu dữ liệu có sẵn.

* **A16:** Dashboard có thể hiển thị attendance reminder nếu event sắp diễn ra và Volunteer đã được approve.

* **A17:** Dashboard không thực hiện Attendance Check-in.

* **A18:** Dashboard nên hiển thị volunteer history summary nếu dữ liệu có sẵn.

* **A19:** Volunteer history summary có thể gồm số event đã tham gia và tổng giờ tình nguyện nếu có.

* **A20:** Dashboard có thể hiển thị feedback reminder nếu Volunteer đã điểm danh thành công nhưng chưa gửi feedback.

* **A21:** Dashboard không submit feedback trực tiếp.

* **A22:** Dashboard có thể hiển thị certificate reminder nếu certificate đã available.

* **A23:** Dashboard không download certificate trực tiếp.

* **A24:** Dashboard nên có quick actions sang:

  * Event Discovery;
  * Applied Events;
  * Volunteer History;
  * Feedback Form nếu đủ điều kiện;
  * Certificates.

* **A25:** Dashboard không tạo, sửa, xóa event.

* **A26:** Dashboard không submit application.

* **A27:** Dashboard không cancel application.

* **A28:** Dashboard không approve/reject application.

* **A29:** Dashboard không generate certificate.

* **A30:** Dashboard không export report.

* **A31:** Dashboard không hiển thị thống kê toàn hệ thống.

* **A32:** Feature cần có loading state khi tải dashboard data.

* **A33:** Feature cần có empty/new volunteer state nếu Volunteer chưa có dữ liệu.

* **A34:** Feature cần có error state khi tải dashboard thất bại.

* **A35:** Feature nên có partial error state nếu chỉ một số block bị lỗi.

* **A36:** Feature này phụ thuộc Member 1 về auth/login/current user/profile.

* **A37:** Feature này phụ thuộc Member 2 các feature trước về event, application, history, feedback và certificate data.

* **A38:** Feature này phụ thuộc Member 3 về application approval, attendance và certificate generation data.

* **A39:** Feature này có thể dùng mock data qua service layer trong giai đoạn đầu, nhưng mock data không phải source of truth.

* **A40:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau (`plan.md`, `api-contract.md`, `database.md`, `tasks.md`), không định nghĩa trong context.

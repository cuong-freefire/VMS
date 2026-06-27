# CONTEXT.md — Volunteer History

# Người viết: NamLD (Member 2) | Ngày: 2026-06-27

## 1. PROBLEM STATEMENT

Hệ thống Volunteer Event Management System cần một màn hình giúp Volunteer xem lại lịch sử các sự kiện tình nguyện mà mình đã tham gia hoặc đã hoàn thành.

Ở feature `003-volunteer-event-application`, Volunteer gửi application để đăng ký tham gia event. Ở feature `004-volunteer-applied-events`, Volunteer theo dõi trạng thái application như `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`. Tuy nhiên, Applied Events không đồng nghĩa với Volunteer History.

Feature `005-volunteer-history` tập trung vào **Volunteer History**, tức là lịch sử tham gia thực tế của Volunteer, bao gồm:

* Hiển thị các event Volunteer đã tham gia hoặc đã hoàn thành.
* Phân biệt rõ Volunteer History với Applied Events.
* Không hiển thị các application chỉ mới `PENDING`, `REJECTED`, hoặc `CANCELLED`.
* Không coi event đã apply nhưng chưa diễn ra là history.
* Hiển thị thông tin tóm tắt của event đã tham gia.
* Hiển thị trạng thái tham gia/điểm danh nếu có dữ liệu.
* Hiển thị số giờ tình nguyện nếu có.
* Hiển thị trạng thái feedback/certificate nếu có dữ liệu liên quan.
* Cho Volunteer xem lại Event Detail nếu event còn khả dụng.
* Hiển thị loading, empty và error states.

Theo business rule mới của team, chỉ Volunteer có đơn `APPROVED` mới được điểm danh. Feedback chỉ được gửi sau khi Volunteer đã điểm danh thành công. Certificate chỉ được tạo cho Volunteer đã điểm danh. Vì vậy, Volunteer History phải dựa trên dữ liệu tham gia/điểm danh/thành tích sau event, không chỉ dựa trên việc đã apply.

Feature này không xử lý apply event, không xử lý cancel application, không xử lý Staff approve/reject, không xử lý attendance check-in, không submit feedback, không generate certificate và không download certificate.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Profile Management / Volunteer Event Module.

* **Feature:** Volunteer History.

* **Related Use Case:**

  * UC21 — View Volunteer History

* **Connected Use Cases:**

  * UC12 — Apply Event
  * UC13 — View Applied Events
  * UC14 — Cancel Application
  * UC24 — Approve Application
  * UC25 — Reject Application
  * UC45 — Attendance Check-in
  * UC46 — View Attendance List
  * UC47 — View Attendance History
  * UC48 — Submit Feedback
  * UC51 — View Certificates
  * UC52 — Download Certificate
  * UC53 — Generate Certificate

* **Related Screens:**

  * Volunteer History
  * Event Detail, when user wants to view an event again
  * Feedback Form, if user is eligible and feature is linked later
  * Certificate List/Detail, if certificate data exists and feature is linked later

* **Related Actors:**

  * Guest
  * Volunteer
  * Staff

* **Guest:** Guest không phải role được lưu trong database. Guest là trạng thái người dùng chưa đăng nhập. Guest không được xem Volunteer History vì đây là dữ liệu cá nhân.

* **Volunteer:** Volunteer là user đã đăng nhập với role `VOLUNTEER`. Volunteer có thể xem lịch sử tham gia của chính mình.

* **Staff:** Staff là user có role `STAFF`, phụ trách Application Management, Attendance Management, Feedback List và Generate Certificate. Volunteer History phụ thuộc vào dữ liệu attendance/completion do Staff hoặc hệ thống ghi nhận.

* **Volunteer History:** Danh sách các event mà Volunteer đã thực sự tham gia, đã được điểm danh hoặc đã hoàn thành theo dữ liệu hệ thống.

* **Applied Events:** Danh sách các event mà Volunteer đã gửi application. Applied Events không đồng nghĩa với Volunteer History.

* **Event Application:** Đơn đăng ký tham gia event. Application status có thể là `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

* **APPROVED Application:** Application đã được Staff duyệt. Đây là điều kiện cần để Volunteer có thể điểm danh, nhưng chưa đủ để event trở thành history nếu Volunteer chưa tham gia hoặc event chưa diễn ra.

* **Attendance:** Dữ liệu điểm danh cho biết Volunteer có tham gia event hay không. Theo docs mới, chỉ Volunteer có đơn `APPROVED` mới được điểm danh và điểm danh chỉ mở trong thời gian event diễn ra.

* **Successful Attendance:** Trạng thái cho biết Volunteer đã điểm danh thành công. Đây là điều kiện liên quan đến feedback và certificate.

* **Volunteer Hours:** Số giờ tình nguyện Volunteer nhận được từ event nếu hệ thống có dữ liệu.

* **Feedback Eligibility:** Volunteer chỉ được gửi feedback sau khi điểm danh thành công.

* **Certificate Eligibility:** Staff chỉ được tạo certificate cho Volunteer đã điểm danh. Mỗi Volunteer chỉ có một certificate cho mỗi event.

---

## 3. STAKEHOLDERS

* **Volunteer:** Cần xem lại các sự kiện đã tham gia, số giờ tình nguyện, trạng thái điểm danh, feedback/certificate nếu có.

* **NamLD / Member 2:** Chịu trách nhiệm chính với Volunteer History trong Volunteer Event Module.

* **Member 1 — Authentication & Profile:** Phụ trách login/session/current user/profile. Volunteer History cần xác định user đã đăng nhập chưa và có role `VOLUNTEER` không.

* **Member 3 — Staff Module:** Phụ trách Application Management, Attendance Management, Feedback List và Generate Certificate. Volunteer History phụ thuộc nhiều vào dữ liệu do Staff Module tạo ra.

* **Member 4 — Manager Module:** Không trực tiếp xử lý Volunteer History, nhưng category, skill hoặc organization của event có thể được hiển thị trong history item.

* **Member 5 — Admin Module:** Không trực tiếp xử lý Volunteer History, nhưng có thể liên quan dashboard, statistics hoặc reporting ở module khác.

---

## 4. CONSTRAINTS (Ràng buộc cứng)

* **SDD Workflow:** Feature này phải đi theo thứ tự `context.md` → `spec.md` → `plan.md` → `tasks.md` → implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, route, component, migration hoặc code task.

* **Authentication Required:** Chỉ user đã đăng nhập mới được xem Volunteer History.

* **Guest Boundary:** Guest không được xem Volunteer History.

* **Role Boundary:** Chỉ user có role `VOLUNTEER` mới được xem Volunteer History trong Volunteer flow này.

* **Database Role Boundary:** Guest không phải role được lưu trong database. Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **Ownership Boundary:** Volunteer chỉ được xem history của chính mình.

* **Applied Events Boundary:** Volunteer History không phải Applied Events. Các application `PENDING`, `REJECTED`, `CANCELLED` không được coi là lịch sử tham gia.

* **Future Approved Boundary:** Application `APPROVED` cho event chưa diễn ra không nên được coi là Volunteer History.

* **Attendance Boundary:** Feature này không thực hiện điểm danh. Attendance Check-in thuộc Attendance Management.

* **Staff Attendance Boundary:** Staff quản lý danh sách điểm danh ở module khác. Volunteer History chỉ đọc/kế thừa dữ liệu attendance.

* **Feedback Boundary:** Feature này không submit feedback. Feedback Form thuộc feature `006-volunteer-feedback-form`.

* **Certificate Boundary:** Feature này không xem/tải/generate certificate trực tiếp. Certificate thuộc feature `007-volunteer-certificates` và Staff Generate Certificate.

* **Application Boundary:** Feature này không tạo application mới. Apply Event thuộc feature `003-volunteer-event-application`.

* **Cancel Boundary:** Feature này không cancel application. Cancel Application thuộc feature `004-volunteer-applied-events`.

* **Staff Review Boundary:** Feature này không approve hoặc reject application. Approve/Reject thuộc Staff Module.

* **Soft Delete Boundary:** Nếu event đã soft delete hoặc archived sau khi Volunteer đã tham gia, hệ thống vẫn có thể hiển thị history record nếu dữ liệu lịch sử còn tồn tại. Tuy nhiên, việc điều hướng sang Event Detail có thể bị giới hạn theo rule của Event Detail.

* **Mock Data:** Có thể dùng mock volunteer history data trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS (Các giả định hiện tại)

* Guest là trạng thái chưa đăng nhập, không phải role lưu trong database.
* Role trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.
* Volunteer History yêu cầu user đã đăng nhập.
* Chỉ Volunteer được xem Volunteer History trong feature này.
* Volunteer chỉ xem được history của chính mình.
* Volunteer History khác với Applied Events.
* Application `PENDING` chưa phải là history.
* Application `REJECTED` chưa phải là history.
* Application `CANCELLED` chưa phải là history.
* Application `APPROVED` là điều kiện cần để Volunteer có thể tham gia/check-in, nhưng event chỉ nên được đưa vào history sau khi có dữ liệu tham gia, điểm danh hoặc event đã hoàn thành.
* Event đã được điểm danh thành công nên xuất hiện trong Volunteer History.
* Event đã hoàn thành và có record tham gia của Volunteer nên xuất hiện trong Volunteer History.
* Nếu Volunteer vắng mặt nhưng hệ thống có dữ liệu attendance/absence, team có thể quyết định hiển thị trạng thái vắng mặt trong history hoặc không hiển thị. Bản đầu nên ưu tiên hiển thị các record có dữ liệu tham gia/attendance rõ ràng.
* Volunteer History nên hiển thị event title, category, organization, date/time, location và participation/attendance status nếu có.
* Volunteer History nên hiển thị volunteer hours nếu có dữ liệu.
* Volunteer History có thể hiển thị feedback status nếu dữ liệu có sẵn, ví dụ chưa feedback/đã feedback.
* Volunteer History có thể hiển thị certificate status nếu dữ liệu có sẵn, ví dụ chưa có certificate/đã có certificate.
* Feedback chỉ được submit sau khi Volunteer điểm danh thành công.
* Certificate chỉ được Staff tạo cho Volunteer đã điểm danh.
* Mỗi Volunteer chỉ có một certificate cho mỗi event.
* Volunteer History có thể cung cấp entry point sang Feedback Form nếu Volunteer đủ điều kiện và feature feedback đã có.
* Volunteer History có thể cung cấp entry point sang Certificate nếu certificate đã có và feature certificate đã có.
* Volunteer History có thể có filter theo thời gian hoặc trạng thái tham gia.
* Volunteer History có thể có pagination nếu số lượng record nhiều.
* Database/API thật cần được thống nhất sau khi `plan.md` và `api-contract.md` được viết.

---

## 6. RESOLVED QUESTIONS (Tự trả lời dựa trên docs mới và quyết định trước đó)

### Q1. Guest có phải role trong database không?

**Answer:** Không. Guest chỉ là trạng thái chưa đăng nhập. Role trong database chỉ gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

---

### Q2. Guest có được xem Volunteer History không?

**Answer:** Không. Volunteer History là dữ liệu cá nhân, chỉ Volunteer đã đăng nhập mới được xem.

---

### Q3. Ai được xem Volunteer History?

**Answer:** Chỉ authenticated user có role `VOLUNTEER`.

---

### Q4. Volunteer có được xem history của Volunteer khác không?

**Answer:** Không. Volunteer chỉ được xem history của chính mình.

---

### Q5. Volunteer History có giống Applied Events không?

**Answer:** Không. Applied Events là danh sách đơn đã đăng ký. Volunteer History là lịch sử event đã tham gia hoặc đã hoàn thành.

---

### Q6. Application `PENDING` có nằm trong Volunteer History không?

**Answer:** Không. Application `PENDING` chỉ là đơn đang chờ duyệt, chưa phải lịch sử tham gia.

---

### Q7. Application `REJECTED` có nằm trong Volunteer History không?

**Answer:** Không. Application bị từ chối không phải lịch sử tham gia.

---

### Q8. Application `CANCELLED` có nằm trong Volunteer History không?

**Answer:** Không. Application đã hủy không phải lịch sử tham gia.

---

### Q9. Application `APPROVED` có tự động nằm trong Volunteer History không?

**Answer:** Không nên tự động. `APPROVED` chỉ là điều kiện để Volunteer được tham gia và check-in. Event chỉ nên xuất hiện trong history khi có dữ liệu tham gia, điểm danh hoặc hoàn thành.

---

### Q10. Event chưa diễn ra nhưng application đã `APPROVED` có nằm trong history không?

**Answer:** Không. Event chưa diễn ra phù hợp với Applied Events hoặc Home Dashboard hơn, không phải Volunteer History.

---

### Q11. Event đã điểm danh thành công có nằm trong history không?

**Answer:** Có. Đây là dữ liệu chính của Volunteer History.

---

### Q12. Event đã hoàn thành và Volunteer có participation record có nằm trong history không?

**Answer:** Có.

---

### Q13. Feature này có thực hiện điểm danh không?

**Answer:** Không. Attendance Check-in thuộc Attendance Management.

---

### Q14. Feature này có submit feedback không?

**Answer:** Không. Feedback Form thuộc feature `006-volunteer-feedback-form`. Volunteer History chỉ có thể hiển thị entry point nếu đủ điều kiện.

---

### Q15. Feature này có generate certificate không?

**Answer:** Không. Staff Generate Certificate thuộc Staff Module. Volunteer Certificates thuộc feature `007-volunteer-certificates`.

---

### Q16. Volunteer History có nên hiển thị volunteer hours không?

**Answer:** Có, nếu dữ liệu có sẵn. Đây là thông tin hữu ích để Volunteer theo dõi đóng góp.

---

### Q17. Volunteer History có nên hiển thị feedback status không?

**Answer:** Có thể, nếu dữ liệu có sẵn. Ví dụ: chưa gửi feedback hoặc đã gửi feedback.

---

### Q18. Volunteer History có nên hiển thị certificate status không?

**Answer:** Có thể, nếu dữ liệu có sẵn. Ví dụ: chưa có certificate hoặc certificate đã sẵn sàng.

---

### Q19. Event đã soft delete/archive sau khi Volunteer tham gia có còn trong history không?

**Answer:** Có thể vẫn hiển thị history record nếu dữ liệu lịch sử còn tồn tại. Nhưng View Detail có thể bị giới hạn theo rule của Event Detail.

---

### Q20. Volunteer History có cần filter/pagination không?

**Answer:** Nên có nếu số lượng history record nhiều. Bản đầu có thể hỗ trợ filter theo thời gian hoặc trạng thái tham gia và pagination/loading strategy.

---

## 7. ANSWERS (Đã chốt nghiệp vụ cho bản đầu)

* **A1:** Feature này là `005-volunteer-history`.

* **A2:** Feature này thuộc Member 2 — Volunteer Event Module.

* **A3:** Feature này tương ứng với UC21 — View Volunteer History.

* **A4:** Guest không phải role lưu trong database.

* **A5:** Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **A6:** Guest không được xem Volunteer History.

* **A7:** Chỉ authenticated Volunteer được xem Volunteer History.

* **A8:** Volunteer chỉ được xem history của chính mình.

* **A9:** Volunteer History khác với Applied Events.

* **A10:** Application `PENDING` không nằm trong Volunteer History.

* **A11:** Application `REJECTED` không nằm trong Volunteer History.

* **A12:** Application `CANCELLED` không nằm trong Volunteer History.

* **A13:** Application `APPROVED` cho event chưa diễn ra không được coi là Volunteer History.

* **A14:** Event đã điểm danh thành công nên xuất hiện trong Volunteer History.

* **A15:** Event đã hoàn thành và có participation/attendance record của Volunteer nên xuất hiện trong Volunteer History.

* **A16:** Volunteer History nên hiển thị event summary cho từng history record.

* **A17:** Event summary nên gồm:

  * event title
  * event thumbnail nếu có
  * category
  * organization
  * event date/time
  * location
  * event status
  * participation/attendance status nếu có
  * volunteer hours nếu có
  * feedback status nếu có
  * certificate status nếu có

* **A18:** Volunteer History có thể cho View Detail nếu Event Detail còn khả dụng.

* **A19:** Volunteer History có thể hiển thị entry point sang Feedback Form nếu Volunteer đã điểm danh thành công và chưa gửi feedback.

* **A20:** Volunteer History có thể hiển thị entry point sang Certificate nếu certificate đã được tạo.

* **A21:** Feature này không thực hiện Attendance Check-in.

* **A22:** Feature này không quản lý Attendance List.

* **A23:** Feature này không submit Feedback.

* **A24:** Feature này không xem/tải/generate Certificate trực tiếp.

* **A25:** Feature này không tạo application mới.

* **A26:** Feature này không cancel application.

* **A27:** Feature này không approve/reject application.

* **A28:** Feature cần có loading state.

* **A29:** Feature cần có empty state khi Volunteer chưa có history.

* **A30:** Feature cần có error state khi tải dữ liệu thất bại.

* **A31:** Feature có thể có filter theo thời gian hoặc trạng thái tham gia.

* **A32:** Feature có thể có pagination hoặc loading strategy nếu history nhiều.

* **A33:** Feature này phụ thuộc Member 1 về auth/login/current user.

* **A34:** Feature này phụ thuộc Member 3 về approved application, attendance, feedback-related data và certificate generation data.

* **A35:** Feature này có thể dùng mock data qua service layer trong giai đoạn đầu, nhưng mock data không phải source of truth.

* **A36:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau (`plan.md`, `api-contract.md`, `database.md`, `tasks.md`), không định nghĩa trong context.

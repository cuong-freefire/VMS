# CONTEXT.md — Volunteer Applied Events

# Người viết: NamLD (Member 2) | Ngày: 2026-06-27

## 1. PROBLEM STATEMENT

Hệ thống Volunteer Event Management System cần một màn hình giúp Volunteer xem lại các sự kiện mà mình đã đăng ký tham gia và theo dõi trạng thái đơn đăng ký.

Ở feature `003-volunteer-event-application`, Volunteer có thể submit application cho một event hợp lệ. Sau khi application được tạo, Volunteer cần một nơi để xem lại các application đã gửi, biết đơn đang chờ duyệt, đã được duyệt, bị từ chối hoặc đã bị hủy.

Feature `004-volunteer-applied-events` tập trung vào **Applied Event List** và **Cancel Application**, bao gồm:

* Hiển thị danh sách các event mà Volunteer đã apply.
* Hiển thị trạng thái application của từng event.
* Hiển thị thông tin tóm tắt của event đã apply.
* Cho Volunteer xem lại Event Detail từ applied event item.
* Cho Volunteer cancel application nếu application đang ở trạng thái `PENDING`.
* Không cho Volunteer tự cancel application đã `APPROVED`.
* Hiển thị loading, empty, error và cancel confirmation states.

Theo business rule mới của team, Volunteer chỉ được hủy đơn khi đơn đang ở trạng thái `PENDING`. Đơn đã `APPROVED` không thể tự hủy và Volunteer phải liên hệ Staff.

Feature này không xử lý submit application mới, không xử lý Staff approve/reject, không xử lý attendance check-in, không xử lý feedback, không xử lý certificate, không xử lý notification, donation hoặc reporting.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Volunteer Event Module.

* **Feature:** Volunteer Applied Events.

* **Related Use Cases:**

  * UC13 — View Applied Events
  * UC14 — Cancel Application

* **Connected Use Cases:**

  * UC09 — View Event Detail
  * UC12 — Apply Event
  * UC22 — View Application List
  * UC23 — View Application Detail
  * UC24 — Approve Application
  * UC25 — Reject Application
  * UC45 — Attendance Check-in
  * UC47 — View Attendance History
  * UC48 — Submit Feedback
  * UC51 — View Certificates

* **Related Screens:**

  * Applied Event List
  * Applied Event item/card
  * Application status display
  * Cancel Application confirmation

* **Related Actors:**

  * Guest
  * Volunteer
  * Staff

* **Guest:** Guest không phải role được lưu trong database. Guest là trạng thái người dùng chưa đăng nhập. Guest không được xem Applied Events vì đây là dữ liệu cá nhân của Volunteer.

* **Volunteer:** Volunteer là user đã đăng nhập với role `VOLUNTEER`. Volunteer có thể xem danh sách application của chính mình và cancel application nếu application đang `PENDING`.

* **Staff:** Staff là user có role `STAFF`, phụ trách xét duyệt application. Staff có thể approve/reject application ở Staff Module. Staff cũng là người Volunteer cần liên hệ nếu muốn xử lý application đã `APPROVED`.

* **Applied Event:** Một event mà Volunteer hiện tại đã submit application.

* **Event Application:** Đơn đăng ký tham gia event của Volunteer.

* **Application Status:** Trạng thái của application. Bản đầu sử dụng các trạng thái chính:

  * `PENDING`
  * `APPROVED`
  * `REJECTED`
  * `CANCELLED`

* **PENDING Application:** Application đã được Volunteer gửi và đang chờ Staff xét duyệt. Đây là trạng thái duy nhất Volunteer được tự cancel trong feature này.

* **APPROVED Application:** Application đã được Staff duyệt. Volunteer không được tự cancel trực tiếp trong feature này. Nếu muốn hủy, Volunteer phải liên hệ Staff.

* **REJECTED Application:** Application bị Staff từ chối. Volunteer chỉ xem trạng thái, không được cancel.

* **CANCELLED Application:** Application đã bị hủy. Volunteer chỉ xem trạng thái, không được cancel lại.

* **Cancel Application:** Hành động Volunteer hủy đơn đăng ký. Theo rule mới, chỉ application `PENDING` mới được cancel bởi Volunteer.

* **Application Ownership:** Volunteer chỉ được xem và thao tác với application của chính mình, không được xem hoặc cancel application của Volunteer khác.

---

## 3. STAKEHOLDERS

* **Volunteer:** Cần xem các event đã apply, biết application đang ở trạng thái nào và có thể hủy đơn nếu còn `PENDING`.

* **NamLD / Member 2:** Chịu trách nhiệm chính với Applied Event List và Cancel Application trong Volunteer Event Module.

* **Member 1 — Authentication & Profile:** Phụ trách login/session/current user. Feature này cần xác định user đã đăng nhập chưa và có role `VOLUNTEER` không.

* **Member 3 — Staff Module:** Phụ trách Application List, Application Detail, Approve/Reject Application và Attendance Management. Feature này consume application status do Staff workflow tạo ra.

* **Member 4 — Manager Module:** Không trực tiếp xử lý Applied Events, nhưng category, skill hoặc organization của event có thể được hiển thị trong event summary.

* **Member 5 — Admin Module:** Không trực tiếp xử lý Applied Events, nhưng có thể liên quan notification, statistics hoặc dashboard ở các module khác.

---

## 4. CONSTRAINTS (Ràng buộc cứng)

* **SDD Workflow:** Feature này phải đi theo thứ tự `context.md` → `spec.md` → `plan.md` → `tasks.md` → implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, route, component, migration hoặc code task.

* **Authentication Required:** Chỉ user đã đăng nhập mới được xem Applied Events.

* **Guest Boundary:** Guest không được xem Applied Events.

* **Role Boundary:** Chỉ user có role `VOLUNTEER` mới được xem Applied Events trong Volunteer flow này.

* **Database Role Boundary:** Guest không phải role được lưu trong database. Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **Ownership Boundary:** Volunteer chỉ được xem application của chính mình.

* **Application Creation Boundary:** Feature này không tạo application mới. Submit application thuộc feature `003-volunteer-event-application`.

* **Staff Review Boundary:** Feature này không approve hoặc reject application. Approve/Reject thuộc Staff Module.

* **Cancel Boundary:** Volunteer chỉ được cancel application khi application đang `PENDING`.

* **Approved Boundary:** Application đã `APPROVED` không thể tự hủy bởi Volunteer. Volunteer phải liên hệ Staff nếu muốn xử lý case này.

* **Rejected Boundary:** Application `REJECTED` không được cancel.

* **Cancelled Boundary:** Application `CANCELLED` không được cancel lại.

* **Attendance Boundary:** Feature này không check-in attendance. Attendance Check-in thuộc Attendance Management.

* **Volunteer History Boundary:** Feature này không phải Volunteer History. Volunteer History thuộc feature `005-volunteer-history`.

* **Feedback Boundary:** Feature này không submit feedback. Feedback Form thuộc feature `006-volunteer-feedback-form`.

* **Certificate Boundary:** Feature này không xem/tải certificate. Certificate thuộc feature `007-volunteer-certificates`.

* **Notification Boundary:** Feature này không bắt buộc gửi notification/email khi cancel. Notification hoặc email có thể thuộc module riêng.

* **Mock Data:** Có thể dùng mock applied events/application data trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS (Các giả định hiện tại)

* Guest là trạng thái chưa đăng nhập, không phải role lưu trong database.
* Role trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.
* Applied Events yêu cầu user đã đăng nhập.
* Chỉ Volunteer được xem Applied Events trong feature này.
* Volunteer chỉ xem được application của chính mình.
* Applied Events hiển thị các application đã tạo từ feature `003-volunteer-event-application`.
* Application mới sau khi apply thành công có status `PENDING`.
* Staff có thể chuyển application sang `APPROVED` hoặc `REJECTED`.
* Volunteer có thể thấy trạng thái mới nhất của application.
* Bản đầu hỗ trợ các status:

  * `PENDING`
  * `APPROVED`
  * `REJECTED`
  * `CANCELLED`
* Applied Events cần hiển thị event summary, không cần full Event Detail.
* Volunteer có thể click vào applied event để xem Event Detail.
* Volunteer chỉ được cancel application nếu application đang `PENDING`.
* Volunteer không được tự cancel application `APPROVED`.
* Nếu application đã `APPROVED` và Volunteer muốn hủy, hệ thống nên hiển thị thông báo liên hệ Staff.
* Application `REJECTED` không được cancel.
* Application `CANCELLED` không được cancel lại.
* Cancel application thành công sẽ chuyển application status sang `CANCELLED`.
* Nếu cancel thất bại, hệ thống cần hiển thị error message rõ ràng.
* Nếu Volunteer chưa apply event nào, hệ thống hiển thị empty state.
* Applied Events có thể filter theo application status.
* Applied Events có thể có pagination nếu số lượng application nhiều.
* Database/API thật cần được thống nhất sau khi `plan.md` và `api-contract.md` được viết.

---

## 6. RESOLVED QUESTIONS (Tự trả lời dựa trên docs mới và quyết định trước đó)

### Q1. Guest có phải role trong database không?

**Answer:** Không. Guest chỉ là trạng thái chưa đăng nhập. Role trong database chỉ gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

---

### Q2. Guest có được xem Applied Events không?

**Answer:** Không. Applied Events là dữ liệu cá nhân, chỉ Volunteer đã đăng nhập mới được xem.

---

### Q3. Ai được xem Applied Events?

**Answer:** Chỉ authenticated user có role `VOLUNTEER`.

---

### Q4. Volunteer có được xem application của Volunteer khác không?

**Answer:** Không. Volunteer chỉ được xem application của chính mình.

---

### Q5. Feature này có tạo application mới không?

**Answer:** Không. Tạo application thuộc feature `003-volunteer-event-application`.

---

### Q6. Application status chính trong bản đầu gồm những gì?

**Answer:** Bản đầu dùng các status:

* `PENDING`
* `APPROVED`
* `REJECTED`
* `CANCELLED`

---

### Q7. Volunteer có được cancel application không?

**Answer:** Có, nhưng chỉ khi application đang ở trạng thái `PENDING`.

---

### Q8. Volunteer có được cancel application `APPROVED` không?

**Answer:** Không. Đơn đã `APPROVED` không thể tự hủy. Volunteer phải liên hệ Staff.

---

### Q9. Volunteer có được cancel application `REJECTED` không?

**Answer:** Không. Application bị reject chỉ hiển thị trạng thái, không cần cancel.

---

### Q10. Volunteer có được cancel application `CANCELLED` không?

**Answer:** Không. Application đã cancel không thể cancel lại.

---

### Q11. Cancel application thành công thì status thành gì?

**Answer:** Status chuyển thành `CANCELLED`.

---

### Q12. Feature này có approve/reject application không?

**Answer:** Không. Approve/Reject thuộc Staff Module.

---

### Q13. Feature này có xử lý attendance không?

**Answer:** Không. Attendance thuộc Attendance Management. Theo rule mới, chỉ Volunteer có đơn `APPROVED` mới được điểm danh.

---

### Q14. Feature này có submit feedback không?

**Answer:** Không. Feedback là feature riêng và chỉ được gửi sau khi điểm danh thành công.

---

### Q15. Feature này có xem/tải certificate không?

**Answer:** Không. Certificate thuộc feature riêng. Staff tạo certificate cho Volunteer đã điểm danh.

---

### Q16. Applied Events có cần filter không?

**Answer:** Nên có filter theo application status để Volunteer dễ theo dõi.

---

### Q17. Applied Events có cần pagination không?

**Answer:** Nên có nếu số lượng application nhiều. Bản đầu có thể dùng pagination hoặc loading strategy.

---

### Q18. Khi cancel application, có cần confirmation không?

**Answer:** Có. Vì cancel là hành động thay đổi trạng thái đơn, hệ thống nên yêu cầu xác nhận trước khi hủy.

---

## 7. ANSWERS (Đã chốt nghiệp vụ cho bản đầu)

* **A1:** Feature này là `004-volunteer-applied-events`.

* **A2:** Feature này thuộc Member 2 — Volunteer Event Module.

* **A3:** Feature này tương ứng với UC13 — View Applied Events và UC14 — Cancel Application.

* **A4:** Guest không phải role lưu trong database.

* **A5:** Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **A6:** Guest không được xem Applied Events.

* **A7:** Chỉ authenticated Volunteer được xem Applied Events.

* **A8:** Volunteer chỉ được xem application của chính mình.

* **A9:** Applied Events hiển thị các application đã tạo từ Apply Event.

* **A10:** Application status bản đầu gồm `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

* **A11:** Applied Events cần hiển thị event summary cho từng application.

* **A12:** Event summary nên gồm:

  * event title
  * event thumbnail nếu có
  * category
  * organization
  * event date/time
  * location
  * event status
  * application status
  * submitted time

* **A13:** Volunteer có thể click View Detail để xem lại Event Detail.

* **A14:** Volunteer chỉ được cancel application khi status là `PENDING`.

* **A15:** Volunteer không được tự cancel application `APPROVED`.

* **A16:** Nếu application đã `APPROVED`, hệ thống nên hiển thị thông báo liên hệ Staff nếu Volunteer muốn hủy.

* **A17:** Application `REJECTED` không được cancel.

* **A18:** Application `CANCELLED` không được cancel lại.

* **A19:** Cancel application thành công chuyển status sang `CANCELLED`.

* **A20:** Cancel action cần có confirmation trước khi xử lý.

* **A21:** Feature này không tạo application mới.

* **A22:** Feature này không approve application.

* **A23:** Feature này không reject application.

* **A24:** Feature này không check-in attendance.

* **A25:** Feature này không submit feedback.

* **A26:** Feature này không xem/tải/generate certificate.

* **A27:** Feature cần có loading state.

* **A28:** Feature cần có empty state khi Volunteer chưa có applied events.

* **A29:** Feature cần có error state khi tải dữ liệu thất bại.

* **A30:** Feature cần có cancel success/error state.

* **A31:** Feature này phụ thuộc Member 1 về auth/login/current user.

* **A32:** Feature này phụ thuộc Member 3 về application status, approve/reject flow và cancel handling rule.

* **A33:** Feature này có thể dùng mock data qua service layer trong giai đoạn đầu, nhưng mock data không phải source of truth.

* **A34:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau (`plan.md`, `api-contract.md`, `database.md`, `tasks.md`), không định nghĩa trong context.

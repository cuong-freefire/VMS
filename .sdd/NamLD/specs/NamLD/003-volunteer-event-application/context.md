# CONTEXT.md — Volunteer Event Application

# Người viết: NamLD (Member 2) | Ngày: 2026-06-27

## 1. PROBLEM STATEMENT

Hệ thống Volunteer Event Management System cần một luồng cho phép Volunteer đăng ký tham gia một sự kiện tình nguyện sau khi đã xem thông tin chi tiết của event.

Ở feature `001-volunteer-event-discovery`, Guest và Volunteer có thể xem danh sách event công khai. Ở feature `002-volunteer-event-detail`, Guest và Volunteer có thể xem chi tiết event công khai. Tuy nhiên, để Volunteer thật sự đăng ký tham gia event, hệ thống cần một bước apply chính thức.

Feature `003-volunteer-event-application` tập trung vào **Apply Event**, bao gồm:

* Kiểm tra người dùng đã đăng nhập hay chưa.
* Kiểm tra người dùng có role `VOLUNTEER` hay không.
* Kiểm tra event có tồn tại và còn cho phép apply hay không.
* Kiểm tra Volunteer chưa apply event này trước đó.
* Kiểm tra event chưa qua application deadline.
* Kiểm tra event chưa full / còn slot.
* Hiển thị thông tin tóm tắt của event trước khi submit.
* Cho Volunteer nhập thông tin đăng ký nếu cần.
* Cho Volunteer xác nhận gửi application.
* Tạo application ở trạng thái ban đầu `PENDING`.
* Hiển thị success, validation error hoặc business error phù hợp.

Feature này không xử lý approve/reject application, không xử lý danh sách applied events, không xử lý cancel application, không xử lý attendance, feedback, certificate, notification, donation hoặc reporting.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Volunteer Event Module.

* **Feature:** Volunteer Event Application.

* **Related Use Case:**

  * UC12 — Apply Event

* **Connected Use Cases:**

  * UC08 — View Event List
  * UC09 — View Event Detail
  * UC10 — Search Event
  * UC11 — Filter Event
  * UC13 — View Applied Events
  * UC14 — Cancel Application
  * UC22 — View Application List
  * UC23 — View Application Detail
  * UC24 — Approve Application
  * UC25 — Reject Application
  * UC45 — Attendance Check-in

* **Related Screens:**

  * Event Detail
  * Apply Event flow
  * Applied Event List, after application is submitted

* **Related Actors:**

  * Guest
  * Volunteer
  * Staff

* **Guest:** Guest không phải role được lưu trong database. Guest là trạng thái người dùng chưa đăng nhập. Guest có thể xem Event List và Event Detail công khai, nhưng không được submit application.

* **Volunteer:** Volunteer là user đã đăng nhập với role `VOLUNTEER`. Volunteer có thể submit application nếu event đủ điều kiện.

* **Staff:** Staff là user có role `STAFF`, phụ trách xét duyệt application ở Application Management. Staff approve/reject application ở module khác, không thuộc feature này.

* **Event Application:** Đơn đăng ký tham gia event của Volunteer. Application được tạo khi Volunteer submit Apply Event thành công.

* **Application Status:** Trạng thái của application. Application mới được tạo từ feature này bắt đầu ở trạng thái `PENDING`.

* **PENDING Application:** Application đang chờ Staff xét duyệt.

* **APPROVED Application:** Application đã được Staff duyệt. Volunteer có application `APPROVED` mới đủ điều kiện check-in attendance khi event diễn ra.

* **REJECTED Application:** Application bị Staff từ chối.

* **CANCELLED Application:** Application đã bị hủy. Theo docs mới, Volunteer chỉ được cancel application khi đơn đang `PENDING`.

* **Application Deadline:** Thời hạn cuối để Volunteer submit application cho event. Volunteer không được apply sau deadline.

* **Event Capacity:** Số lượng Volunteer tối đa mà event có thể nhận.

* **Full Event:** Event đã đủ chỗ. Volunteer không được apply khi event đã full.

* **Duplicate Application:** Trường hợp một Volunteer cố apply cùng một event nhiều lần. Theo docs mới, mỗi Volunteer chỉ được đăng ký 1 lần cho mỗi event.

---

## 3. STAKEHOLDERS

* **Volunteer:** Cần đăng ký tham gia event một cách rõ ràng và biết application đã gửi thành công hay chưa.

* **Guest:** Có thể quan tâm event nhưng cần đăng nhập hoặc đăng ký tài khoản trước khi apply.

* **NamLD / Member 2:** Chịu trách nhiệm chính với Apply Event trong Volunteer Event Module.

* **Member 1 — Authentication & Profile:** Phụ trách login/register/profile. Feature này cần xác định user đã đăng nhập chưa và có role `VOLUNTEER` không.

* **Member 3 — Staff Module:** Phụ trách Application List, Application Detail, Approve/Reject Application, Attendance Management và Generate Certificate. Feature này tạo application để Member 3 xử lý sau.

* **Member 4 — Manager Module:** Không trực tiếp xử lý Apply Event, nhưng dữ liệu category/skill/organization có thể được hiển thị trong event summary.

* **Member 5 — Admin Module:** Không trực tiếp xử lý Apply Event, nhưng có thể liên quan notification, statistics hoặc donation ở các module khác.

---

## 4. CONSTRAINTS (Ràng buộc cứng)

* **SDD Workflow:** Feature này phải đi theo thứ tự `context.md` → `spec.md` → `plan.md` → `tasks.md` → implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, route, component, migration hoặc code task.

* **Authentication Required:** Chỉ user đã đăng nhập mới được submit application.

* **Guest Boundary:** Guest không được submit application. Guest phải đăng nhập hoặc đăng ký tài khoản trước khi apply.

* **Role Boundary:** Chỉ user có role `VOLUNTEER` mới được submit application trong feature này.

* **Database Role Boundary:** Guest không phải role được lưu trong database. Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **Event Existence Boundary:** Chỉ event tồn tại và khả dụng mới được apply.

* **Application Deadline Boundary:** Volunteer không được apply event sau application deadline.

* **Capacity Boundary:** Volunteer không được apply khi event đã full hoặc không còn slot.

* **Duplicate Boundary:** Mỗi Volunteer chỉ được apply 1 lần cho mỗi event.

* **Application Status Boundary:** Application mới được tạo thành công phải bắt đầu ở trạng thái `PENDING`.

* **Staff Review Boundary:** Feature này không approve hoặc reject application. Approve/Reject thuộc Staff Module.

* **Applied Events Boundary:** Feature này không hiển thị danh sách event đã apply. Applied Events thuộc feature `004-volunteer-applied-events`.

* **Cancel Boundary:** Feature này không cancel application. Cancel Application thuộc feature `004-volunteer-applied-events`.

* **Attendance Boundary:** Feature này không check-in attendance. Attendance Check-in thuộc Attendance Management.

* **Feedback Boundary:** Feature này không submit feedback. Feedback Form thuộc feature `006-volunteer-feedback-form`.

* **Certificate Boundary:** Feature này không xem hoặc tạo certificate. Certificate thuộc feature `007-volunteer-certificates` và Staff Generate Certificate.

* **Notification Boundary:** Feature này không bắt buộc gửi notification/email. Notification hoặc email có thể là module riêng.

* **Mock Data:** Có thể dùng mock event/application data trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS (Các giả định hiện tại)

* Guest là trạng thái chưa đăng nhập, không phải role lưu trong database.
* Role trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.
* Apply Event bắt đầu từ Event Detail.
* Guest có thể xem Event Detail, nhưng không được submit application.
* Guest bấm Apply sẽ được yêu cầu login/register.
* Chỉ Volunteer đã đăng nhập mới được submit application.
* User có role `STAFF`, `MANAGER`, hoặc `ADMIN` không dùng luồng Volunteer Apply Event trong feature này.
* Event phải tồn tại và còn khả dụng thì mới được apply.
* Volunteer chỉ được apply 1 lần cho mỗi event.
* Volunteer không được apply nếu đã qua application deadline.
* Volunteer không được apply nếu event đã full hoặc không còn slot.
* Application mới sau khi submit thành công có status `PENDING`.
* Staff sẽ review application sau và chuyển status sang `APPROVED` hoặc `REJECTED`.
* Application `APPROVED` sẽ liên quan tới Attendance Check-in sau này.
* Volunteer chỉ được check-in khi có application `APPROVED`, nhưng check-in không thuộc feature này.
* Volunteer có thể xem application đã gửi ở feature `004-volunteer-applied-events`.
* Volunteer chỉ được cancel application khi application đang `PENDING`, nhưng cancel không thuộc feature này.
* Apply form có thể có motivation/message để Volunteer ghi lý do muốn tham gia.
* Apply form nên hiển thị event summary để Volunteer xác nhận đúng event trước khi submit.
* Nếu event hết slot trong lúc user đang apply, hệ thống vẫn phải chặn submit.
* Nếu application deadline vừa hết trong lúc user đang apply, hệ thống vẫn phải chặn submit.
* Nếu request bị lỗi, hệ thống cần hiển thị error message rõ ràng.
* Database/API thật cần được thống nhất sau khi `plan.md` và `api-contract.md` được viết.

---

## 6. RESOLVED QUESTIONS (Tự trả lời dựa trên docs mới và quyết định trước đó)

### Q1. Guest có phải role trong database không?

**Answer:** Không. Guest chỉ là trạng thái chưa đăng nhập. Role trong database chỉ gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

---

### Q2. Guest có được apply event không?

**Answer:** Không. Guest phải đăng nhập hoặc đăng ký tài khoản trước khi apply event.

---

### Q3. Ai được submit Apply Event?

**Answer:** Chỉ authenticated user có role `VOLUNTEER`.

---

### Q4. Application mới tạo có status gì?

**Answer:** Application mới tạo thành công có status `PENDING`.

---

### Q5. Volunteer có được apply cùng một event nhiều lần không?

**Answer:** Không. Mỗi Volunteer chỉ được apply 1 lần cho mỗi event.

---

### Q6. Volunteer có được apply sau deadline không?

**Answer:** Không. Volunteer không thể đăng ký khi đã qua application deadline.

---

### Q7. Volunteer có được apply khi event đã full không?

**Answer:** Không. Volunteer không thể apply khi event đã đủ chỗ hoặc không còn slot.

---

### Q8. Feature này có approve/reject application không?

**Answer:** Không. Approve/Reject Application thuộc Staff Module.

---

### Q9. Feature này có cancel application không?

**Answer:** Không. Cancel Application thuộc feature `004-volunteer-applied-events`. Theo docs mới, Volunteer chỉ được cancel khi application đang `PENDING`.

---

### Q10. Feature này có check-in attendance không?

**Answer:** Không. Attendance thuộc Attendance Management. Theo docs mới, chỉ Volunteer có application `APPROVED` mới được check-in.

---

### Q11. Feature này có gửi feedback không?

**Answer:** Không. Feedback Form là feature riêng. Theo docs mới, Volunteer chỉ được feedback sau khi điểm danh thành công.

---

### Q12. Feature này có tạo certificate không?

**Answer:** Không. Staff tạo certificate cho Volunteer đã điểm danh. Volunteer chỉ xem/tải certificate ở feature khác.

---

### Q13. Apply form có cần motivation/message không?

**Answer:** Nên có trong bản đầu để Volunteer có thể ghi lý do muốn tham gia. Tuy nhiên field này có thể là optional nếu team không yêu cầu bắt buộc.

---

### Q14. Apply Event có bắt đầu từ Event Detail không?

**Answer:** Có. User xem Event Detail trước, sau đó bấm Apply để đi sang Apply Event flow.

---

### Q15. Nếu event còn slot lúc mở form nhưng hết slot lúc submit thì sao?

**Answer:** Hệ thống phải chặn submit và hiển thị lỗi event đã đủ chỗ hoặc không còn slot.

---

### Q16. Nếu event chưa qua deadline lúc mở form nhưng qua deadline lúc submit thì sao?

**Answer:** Hệ thống phải chặn submit và hiển thị lỗi đã hết hạn đăng ký.

---

## 7. ANSWERS (Đã chốt nghiệp vụ cho bản đầu)

* **A1:** Feature này là `003-volunteer-event-application`.

* **A2:** Feature này thuộc Member 2 — Volunteer Event Module.

* **A3:** Feature này tương ứng với UC12 — Apply Event.

* **A4:** Guest không phải role lưu trong database.

* **A5:** Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **A6:** Guest không được submit application.

* **A7:** Guest bấm Apply cần được yêu cầu login/register.

* **A8:** Chỉ authenticated Volunteer được submit application.

* **A9:** User không có role `VOLUNTEER` không được submit application trong feature này.

* **A10:** Apply Event bắt đầu từ Event Detail.

* **A11:** Apply Event cần hiển thị event summary trước khi submit.

* **A12:** Apply form có thể có motivation/message.

* **A13:** Application mới tạo thành công có status `PENDING`.

* **A14:** Volunteer chỉ được apply 1 lần cho mỗi event.

* **A15:** Volunteer không được apply nếu đã qua application deadline.

* **A16:** Volunteer không được apply nếu event đã full hoặc không còn slot.

* **A17:** Staff approve/reject application ở Staff Module.

* **A18:** Feature này không approve application.

* **A19:** Feature này không reject application.

* **A20:** Feature này không cancel application.

* **A21:** Feature này không hiển thị Applied Events list.

* **A22:** Feature này không check-in attendance.

* **A23:** Feature này không submit feedback.

* **A24:** Feature này không xem/tải/generate certificate.

* **A25:** Submit phải có loading/submitting state.

* **A26:** Submit button cần tránh gửi nhiều request liên tiếp.

* **A27:** Nếu submit thành công, hệ thống hiển thị success state.

* **A28:** Nếu submit thất bại, hệ thống hiển thị error message dễ hiểu.

* **A29:** Nếu event hết slot trong lúc submit, hệ thống chặn application.

* **A30:** Nếu event qua deadline trong lúc submit, hệ thống chặn application.

* **A31:** Feature này phụ thuộc Member 1 về auth/login/register.

* **A32:** Feature này phụ thuộc Member 3 về event status, application status, capacity, deadline và review flow.

* **A33:** Feature này có thể dùng mock data qua service layer trong giai đoạn đầu, nhưng mock data không phải source of truth.

* **A34:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau (`plan.md`, `api-contract.md`, `database.md`, `tasks.md`), không định nghĩa trong context.

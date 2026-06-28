# CONTEXT.md — Apply Event (UC12)

# Người viết: NamLD (Member 2) | Ngày: 2026-06-27

## 1. PROBLEM STATEMENT

Volunteer Event Management System cần chức năng cho phép Volunteer đăng ký tham gia một sự kiện tình nguyện công khai.

Ở UC08 — View Event List, người dùng có thể xem danh sách event. Ở UC09 — View Event Detail, người dùng có thể xem thông tin chi tiết của event trước khi quyết định tham gia. Sau khi đã xem thông tin chi tiết và muốn tham gia, Volunteer cần có một luồng Apply Event rõ ràng để gửi đơn đăng ký.

Theo phân chia use case mới của team, Member 2 phụ trách các use case dành cho Volunteer, bao gồm:

* UC08 — View Event List
* UC09 — View Event Detail
* UC10 — Search Event
* UC11 — Filter Event
* UC12 — Apply Event
* UC13 — View Applied Events
* UC14 — Cancel Application
* UC48 — Submit Feedback
* UC51 — View Certificates
* UC52 — Download Certificate

Trong file này, phạm vi chỉ tập trung vào **UC12 — Apply Event**.

UC12 cần đảm bảo:

* Chỉ Volunteer đã đăng nhập mới được gửi application.
* Guest không được apply trực tiếp, mà phải login/register trước.
* Staff, Manager và Admin không được apply event thông qua Volunteer Apply flow.
* Volunteer chỉ được apply một lần cho mỗi event.
* Volunteer không được apply nếu event đã full.
* Volunteer không được apply nếu đã qua application deadline.
* Volunteer không được apply nếu event không public, bị xóa mềm, cancelled, archived hoặc không còn hợp lệ.
* Application mới sau khi apply thành công nên có trạng thái ban đầu là `PENDING`.
* Sau khi apply thành công, Volunteer có thể được điều hướng sang UC13 — View Applied Events hoặc được hiển thị link đi sang Applied Events.
* Hệ thống phải có loading state, success state, error state và trạng thái chống submit nhiều lần.

Lưu ý quan trọng:

UC12 — Apply Event là flow riêng sau UC09 — View Event Detail. Event Detail có thể có Apply button hoặc Apply entry point, nhưng việc tạo application thật sự phải thuộc UC12. Codex không được tạo logic submit application trực tiếp trong UC09.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Volunteer Event.

* **Use Case:** UC12 — Apply Event.

* **Feature Folder:** `UC12-feat-apply-event`.

* **Previous / Entry Use Cases:**

  * UC08 — View Event List
  * UC09 — View Event Detail
  * UC10 — Search Event
  * UC11 — Filter Event

* **Next / Connected Use Cases trong phần Member 2:**

  * UC13 — View Applied Events
  * UC14 — Cancel Application
  * UC48 — Submit Feedback
  * UC51 — View Certificates
  * UC52 — Download Certificate

* **Connected UC ngoài phần Member 2:**

  * UC03 — Login
  * UC04 — Register
  * UC15 — Add Event
  * UC16 — Edit Event
  * UC17 — Delete Event
  * UC21 — View Volunteer History
  * UC22 — View Application List
  * UC23 — View Application Detail
  * UC24 — Approve Application
  * UC25 — Reject Application
  * UC45 — Attendance Check
  * UC53 — Generate Certificate

* **Guest:** Guest không phải role được lưu trong database. Guest là trạng thái người dùng chưa đăng nhập. Guest có thể xem Event List và Event Detail công khai, nhưng không được submit application.

* **Volunteer:** Volunteer là user đã đăng nhập với role `VOLUNTEER`. Volunteer là actor chính của UC12 và có thể apply event nếu thỏa điều kiện.

* **Staff:** Staff là user có role `STAFF`, phụ trách tạo event và approve/reject application ở module của Member 3. Staff không apply event qua UC12.

* **Manager:** Manager là user có role `MANAGER`, phụ trách category, skill hoặc các nghiệp vụ quản lý khác. Manager không apply event qua UC12.

* **Admin:** Admin là user có role `ADMIN`, phụ trách quản trị hệ thống. Admin không apply event qua UC12.

* **Apply Event:** Hành động Volunteer gửi đơn đăng ký tham gia một event.

* **Application:** Bản ghi đăng ký tham gia event của Volunteer. Application liên kết Volunteer với Event.

* **Application Status:** Trạng thái của application. Với UC12, application mới tạo nên bắt đầu ở trạng thái `PENDING`.

* **PENDING:** Trạng thái application mới được gửi, đang chờ Staff duyệt.

* **APPROVED:** Trạng thái application đã được Staff duyệt. UC12 không tự approve.

* **REJECTED:** Trạng thái application bị Staff từ chối. UC12 không tự reject.

* **CANCELLED:** Trạng thái application đã bị Volunteer hủy. Cancel thuộc UC14.

* **Duplicate Application:** Trường hợp Volunteer đã apply event đó trước đó. Mỗi Volunteer chỉ được apply một lần cho mỗi event.

* **Application Deadline:** Hạn cuối để Volunteer apply event.

* **Capacity:** Số lượng Volunteer tối đa mà event có thể nhận.

* **Remaining Slots:** Số chỗ còn lại của event.

* **Apply Eligibility:** Điều kiện để Volunteer có thể apply event, bao gồm event còn public, chưa full, chưa qua deadline và Volunteer chưa apply trước đó.

* **Motivation / Message:** Nội dung ngắn Volunteer có thể nhập khi apply để giải thích lý do muốn tham gia. Trường này có thể optional trong bản đầu nếu team chưa chốt.

---

## 3. STAKEHOLDERS

* **Volunteer:** Cần gửi application để đăng ký tham gia event phù hợp.

* **Guest:** Có thể quan tâm đến event nhưng cần login/register trước khi apply.

* **NamLD / Member 2:** Chịu trách nhiệm chính với UC12 — Apply Event.

* **Member 1 — Authentication + Profile + Email Services:** Phụ trách Login/Register, Verify Email và Profile. UC12 phụ thuộc authentication để biết user hiện tại có phải Volunteer hay không.

* **Member 3 — Event & Application Management:** Phụ trách Add/Edit/Delete Event và Application Management. Sau khi Volunteer apply, application sẽ được Staff xem, approve hoặc reject ở module của Member 3.

* **Member 4 — Admin & Manager Management:** Phụ trách User Management, Category Management và Skill Management. UC12 có thể phụ thuộc gián tiếp vào skill/category data của event nhưng không quản lý dữ liệu này.

* **Member 5 — Organization + Notification + Dashboard + Payment:** Phụ trách Organization, Notification, Dashboard, Reports và Payment. UC12 có thể hiển thị organization của event nhưng không quản lý organization hoặc payment.

---

## 4. CONSTRAINTS

* **SDD Workflow:** Use case này phải được viết theo thứ tự `context.md` → `spec.md` trước khi sang plan/tasks/implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, frontend component chi tiết, backend route, migration hoặc code.

* **Authentication Required:** UC12 yêu cầu user đã đăng nhập.

* **Role Boundary:** Chỉ user có role `VOLUNTEER` mới được submit application trong UC12.

* **Guest Boundary:** Guest không được submit application. Nếu Guest muốn apply, hệ thống phải yêu cầu login/register trước.

* **Staff/Manager/Admin Boundary:** Staff, Manager và Admin không được apply event thông qua Volunteer Apply flow.

* **Event Detail Boundary:** UC09 chỉ cung cấp Apply entry point. UC12 mới là nơi xử lý apply thật sự.

* **Event List/Search/Filter Boundary:** UC08, UC10 và UC11 chỉ giúp người dùng tìm event. Các UC này không submit application.

* **Applied Events Boundary:** UC13 hiển thị danh sách application sau khi Volunteer đã apply. UC12 chỉ tạo application.

* **Cancel Boundary:** UC14 xử lý cancel application. UC12 không cancel application.

* **Staff Review Boundary:** UC12 không approve hoặc reject application. Approve/Reject thuộc UC24 và UC25 của Member 3.

* **Attendance Boundary:** UC12 không xử lý attendance. Attendance Check thuộc UC45.

* **Feedback Boundary:** UC12 không submit feedback. Submit Feedback thuộc UC48 và chỉ xảy ra sau khi tham gia/attendance hợp lệ.

* **Certificate Boundary:** UC12 không xem, tải hoặc generate certificate. Certificate thuộc UC51, UC52 và UC53.

* **Duplicate Boundary:** Mỗi Volunteer chỉ được apply một lần cho mỗi event. UC12 phải xử lý hoặc yêu cầu backend/API xử lý duplicate application.

* **Deadline Boundary:** Volunteer không được apply nếu event đã qua application deadline.

* **Capacity Boundary:** Volunteer không được apply nếu event đã full hoặc không còn remaining slots.

* **Visibility Boundary:** Volunteer chỉ được apply event public/discoverable và hợp lệ.

* **Soft Delete Boundary:** Event đã soft delete không được apply.

* **Status Boundary:** Event draft, archived, deleted, cancelled hoặc completed không được apply trong bản đầu.

* **Concurrency Boundary:** Nếu nhiều Volunteer apply cùng lúc và event gần hết slot, backend/API phải là nơi chốt cuối cùng để tránh vượt capacity.

* **Submit Boundary:** UI phải tránh submit nhiều lần liên tiếp, nhưng backend/API vẫn phải kiểm tra lại tất cả rule.

* **Mock Data:** Có thể dùng mock apply result trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS

* Guest là trạng thái chưa đăng nhập, không phải role lưu trong database.
* Role trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.
* UC12 chỉ dành cho authenticated Volunteer.
* Guest phải login/register trước khi apply.
* Staff, Manager và Admin không dùng UC12 để apply event.
* UC12 thường được mở từ UC09 — View Event Detail.
* UC09 có thể hiển thị Apply button, nhưng không tạo application.
* UC12 là nơi tạo application mới.
* Application mới sau khi tạo thành công có trạng thái `PENDING`.
* Volunteer chỉ được apply một lần cho mỗi event.
* Nếu Volunteer đã apply event trước đó, hệ thống phải chặn duplicate application.
* Nếu event đã qua application deadline, hệ thống phải chặn apply.
* Nếu event đã full hoặc không còn remaining slots, hệ thống phải chặn apply.
* Nếu event không public/discoverable, hệ thống phải chặn apply.
* Nếu event bị soft-deleted, hệ thống phải chặn apply.
* Nếu event draft, archived, cancelled hoặc completed, hệ thống phải chặn apply trong bản đầu.
* UC12 có thể hiển thị event summary trước khi Volunteer xác nhận apply.
* Event summary trong UC12 có thể gồm title, organization, date/time, location, deadline, remaining slots và required skills nếu có dữ liệu.
* UC12 có thể có motivation/message field nếu team muốn, nhưng trường này nên là optional trong bản đầu.
* Nếu có motivation/message field, nội dung cần được trim và validate độ dài.
* Sau khi apply thành công, Volunteer có thể thấy success state.
* Sau khi apply thành công, Volunteer có thể đi sang UC13 — View Applied Events.
* Nếu apply thất bại do duplicate, deadline, capacity hoặc permission, hệ thống phải hiển thị error message phù hợp.
* UI phải disable submit button hoặc có cơ chế chống submit nhiều lần khi request đang xử lý.
* Backend/API phải là nơi enforce cuối cùng cho role, duplicate, deadline, capacity và visibility.
* Database/API thật cần được thống nhất sau khi spec/plan/api-contract được viết.

---

## 6. OPEN QUESTIONS

### Q1. Guest có được apply event không?

**Answer:** Không. Guest chỉ được xem event công khai. Nếu Guest muốn apply, hệ thống phải yêu cầu login/register trước.

---

### Q2. User nào được submit application trong UC12?

**Answer:** Chỉ authenticated user có role `VOLUNTEER`.

---

### Q3. Staff, Manager hoặc Admin có được apply event trong UC12 không?

**Answer:** Không. UC12 là Volunteer Apply flow, không dành cho Staff, Manager hoặc Admin.

---

### Q4. UC12 bắt đầu từ đâu?

**Answer:** UC12 thường bắt đầu từ UC09 — View Event Detail, khi user bấm Apply entry point.

---

### Q5. UC09 có được tạo application không?

**Answer:** Không. UC09 chỉ hiển thị Event Detail và Apply entry point. UC12 mới tạo application.

---

### Q6. Application mới có status gì?

**Answer:** Application mới nên bắt đầu với status `PENDING`.

---

### Q7. Volunteer có được apply nhiều lần vào cùng một event không?

**Answer:** Không. Mỗi Volunteer chỉ được apply một lần cho mỗi event.

---

### Q8. Event full có apply được không?

**Answer:** Không. Nếu event đã full hoặc không còn remaining slots, Volunteer không được apply.

---

### Q9. Event quá deadline có apply được không?

**Answer:** Không. Nếu đã qua application deadline, Volunteer không được apply.

---

### Q10. Event draft/archived/cancelled/deleted/completed có apply được không?

**Answer:** Không trong bản đầu. UC12 chỉ cho apply event public/discoverable và hợp lệ.

---

### Q11. Có cần motivation/message khi apply không?

**Answer:** Có thể có, nhưng nên để optional trong bản đầu nếu team chưa chốt rõ. Nếu có, cần trim và validate độ dài.

---

### Q12. Apply thành công thì đi đâu?

**Answer:** Hệ thống nên hiển thị success state và cung cấp điều hướng sang UC13 — View Applied Events hoặc quay lại Event Detail.

---

### Q13. Apply lỗi thì xử lý thế nào?

**Answer:** Hệ thống cần hiển thị message rõ ràng theo nguyên nhân như chưa đăng nhập, sai role, đã apply, event full, hết deadline, event không hợp lệ hoặc lỗi hệ thống.

---

### Q14. Có cần chống bấm submit nhiều lần không?

**Answer:** Có. UI cần disable submit button khi đang xử lý, nhưng backend/API vẫn phải enforce duplicate và concurrency.

---

### Q15. Backend hay frontend là nơi chốt rule apply?

**Answer:** Backend/API phải là nơi chốt cuối cùng. Frontend chỉ hỗ trợ hiển thị và validate cơ bản.

---

## 7. ANSWERS / ANSWERS TO OPEN QUESTIONS

* **A1:** UC12 — Apply Event thuộc Member 2 / Volunteer Event.

* **A2:** UC12 là flow tạo application cho Volunteer tham gia event.

* **A3:** UC12 chỉ dành cho authenticated Volunteer.

* **A4:** Guest không được submit application.

* **A5:** Guest muốn apply phải login/register trước.

* **A6:** Staff, Manager và Admin không được apply event qua UC12.

* **A7:** Guest không phải role lưu trong database.

* **A8:** Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **A9:** UC12 thường được mở từ UC09 — View Event Detail.

* **A10:** UC09 chỉ có Apply entry point, không tạo application.

* **A11:** UC12 mới xử lý tạo application.

* **A12:** Application mới sau khi tạo thành công nên có status `PENDING`.

* **A13:** Mỗi Volunteer chỉ được apply một lần cho mỗi event.

* **A14:** Event full hoặc không còn remaining slots thì không được apply.

* **A15:** Event quá application deadline thì không được apply.

* **A16:** Event không public/discoverable thì không được apply.

* **A17:** Event soft-deleted thì không được apply.

* **A18:** Event draft, archived, cancelled hoặc completed không được apply trong bản đầu.

* **A19:** UC12 có thể hiển thị event summary trước khi xác nhận apply.

* **A20:** UC12 có thể có motivation/message field optional.

* **A21:** Nếu có motivation/message field thì cần trim và validate độ dài.

* **A22:** Sau khi apply thành công, hệ thống hiển thị success state.

* **A23:** Sau khi apply thành công, Volunteer có thể đi sang UC13 — View Applied Events.

* **A24:** Nếu apply thất bại, hệ thống cần hiển thị error message rõ ràng.

* **A25:** UI cần có loading/submitting state.

* **A26:** UI cần disable submit button hoặc chống submit nhiều lần khi request đang xử lý.

* **A27:** Backend/API phải enforce cuối cùng cho authentication, role, duplicate, deadline, capacity, visibility và concurrency.

* **A28:** UC12 không approve/reject application.

* **A29:** Approve/Reject Application thuộc Member 3.

* **A30:** UC12 không cancel application.

* **A31:** Cancel Application thuộc UC14.

* **A32:** UC12 không xử lý attendance, feedback hoặc certificate.

* **A33:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau, không định nghĩa trong context.

# CONTEXT.md — View Applied Events (UC13)

# Người viết: NamLD (Member 2) | Ngày: 2026-06-27

## 1. PROBLEM STATEMENT

Volunteer Event Management System cần một màn hình cho phép Volunteer xem danh sách các event mà mình đã apply.

Ở UC12 — Apply Event, Volunteer có thể gửi application để đăng ký tham gia event. Sau khi apply thành công, Volunteer cần một nơi để theo dõi các application đã gửi, trạng thái xử lý của từng application và thông tin tóm tắt của event tương ứng.

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

Trong file này, phạm vi chỉ tập trung vào **UC13 — View Applied Events**.

UC13 cần đảm bảo:

* Chỉ Volunteer đã đăng nhập mới xem được danh sách event đã apply.
* Volunteer chỉ xem được application của chính mình.
* Guest không được xem Applied Events.
* Staff, Manager và Admin không dùng màn Applied Events của Volunteer.
* Danh sách Applied Events hiển thị thông tin tóm tắt của event và trạng thái application.
* Volunteer có thể xem trạng thái application như `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.
* Volunteer có thể bấm vào event để đi sang UC09 — View Event Detail nếu event vẫn public/available.
* Volunteer có thể thấy action cancel đối với application đủ điều kiện.
* Hệ thống có loading state, empty state, filter-empty state và error state.

Lưu ý quan trọng:

UC13 — View Applied Events và UC14 — Cancel Application được viết thành hai folder context/spec riêng theo format team. Tuy nhiên, khi implementation, hai use case này nên được code chung trong cùng một màn hình Applied Events. UC13 là phần hiển thị danh sách, còn UC14 là action hủy application trong danh sách đó. Codex không nên tạo một màn riêng chỉ để cancel application nếu không cần.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Volunteer Event.

* **Use Case:** UC13 — View Applied Events.

* **Feature Folder:** `UC13-feat-applied-events`.

* **Previous / Entry Use Cases:**

  * UC09 — View Event Detail
  * UC12 — Apply Event

* **Related UC trong cùng màn Applied Events:**

  * UC14 — Cancel Application

* **Connected UC trong phần Member 2:**

  * UC08 — View Event List
  * UC10 — Search Event
  * UC11 — Filter Event
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

* **Guest:** Guest không phải role được lưu trong database. Guest là trạng thái người dùng chưa đăng nhập. Guest không được xem Applied Events vì đây là dữ liệu cá nhân của Volunteer.

* **Volunteer:** Volunteer là user đã đăng nhập với role `VOLUNTEER`. Volunteer là actor chính của UC13 và chỉ được xem application của chính mình.

* **Staff:** Staff là user có role `STAFF`, phụ trách xem application list/detail và approve/reject application ở module của Member 3. Staff không dùng UC13 để xem applied events như Volunteer.

* **Manager:** Manager là user có role `MANAGER`, phụ trách category, skill hoặc các nghiệp vụ quản lý khác. Manager không dùng UC13.

* **Admin:** Admin là user có role `ADMIN`, phụ trách quản trị hệ thống. Admin không dùng UC13.

* **Applied Events:** Danh sách các event mà Volunteer hiện tại đã gửi application.

* **Application:** Bản ghi đăng ký tham gia event của Volunteer. Mỗi application liên kết một Volunteer với một Event.

* **Application Status:** Trạng thái xử lý application, ví dụ `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

* **PENDING:** Application đã được gửi và đang chờ Staff duyệt. Trạng thái này có thể được cancel bởi Volunteer ở UC14.

* **APPROVED:** Application đã được Staff duyệt. Volunteer không được tự cancel trong bản đầu; nếu muốn hủy cần liên hệ Staff.

* **REJECTED:** Application đã bị Staff từ chối. Volunteer chỉ xem trạng thái và lý do nếu có.

* **CANCELLED:** Application đã bị Volunteer hủy. Volunteer chỉ xem lại trạng thái, không cancel tiếp.

* **Review Note / Rejection Reason:** Ghi chú từ Staff khi approve/reject nếu dữ liệu có sẵn.

* **Event Summary:** Thông tin tóm tắt của event trong Applied Events, ví dụ title, date/time, location, organization, category và thumbnail.

* **Cancel Entry Point:** Nút/action cancel application nằm trong Applied Events screen. Logic cancel chi tiết thuộc UC14.

* **Own Data Boundary:** Ranh giới dữ liệu cá nhân. Volunteer chỉ được xem application thuộc tài khoản của mình.

---

## 3. STAKEHOLDERS

* **Volunteer:** Cần theo dõi các event đã apply và trạng thái application của mình.

* **NamLD / Member 2:** Chịu trách nhiệm chính với UC13 — View Applied Events.

* **Member 1 — Authentication + Profile + Email Services:** Phụ trách Login/Register và xác thực người dùng. UC13 phụ thuộc authentication để biết current user có phải Volunteer hay không.

* **Member 3 — Event & Application Management:** Phụ trách Application Management, Approve Application và Reject Application. UC13 hiển thị kết quả từ workflow Staff review của Member 3.

* **Member 4 — Admin & Manager Management:** Phụ trách User Management, Category Management và Skill Management. UC13 có thể hiển thị category/skill liên quan đến event nhưng không quản lý dữ liệu này.

* **Member 5 — Organization + Notification + Dashboard + Payment:** Phụ trách Organization, Notification, Dashboard, Reports và Payment. UC13 có thể hiển thị organization của event nhưng không quản lý organization.

---

## 4. CONSTRAINTS

* **SDD Workflow:** Use case này phải được viết theo thứ tự `context.md` → `spec.md` trước khi sang plan/tasks/implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, frontend component chi tiết, backend route, migration hoặc code.

* **Authentication Required:** UC13 yêu cầu user đã đăng nhập.

* **Role Boundary:** Chỉ user có role `VOLUNTEER` mới được xem Applied Events của Volunteer trong UC13.

* **Guest Boundary:** Guest không được xem Applied Events.

* **Staff/Manager/Admin Boundary:** Staff, Manager và Admin không dùng UC13 để xem danh sách application theo giao diện Volunteer.

* **Ownership Boundary:** Volunteer chỉ được xem application của chính mình. Không được xem application của Volunteer khác.

* **Apply Boundary:** UC13 không tạo application. Apply Event thuộc UC12.

* **Cancel Boundary:** UC13 có thể hiển thị cancel action, nhưng business rule cancel chi tiết thuộc UC14.

* **Shared Screen Boundary:** UC13 và UC14 là các use case riêng nhưng nên implement chung trên cùng một màn Applied Events.

* **Codex Implementation Boundary:** Khi sinh code, Codex không nên tạo một page riêng chỉ để cancel application. Cancel action nên nằm trong Applied Events page và chỉ xuất hiện khi application đủ điều kiện.

* **Staff Review Boundary:** UC13 không approve hoặc reject application. Approve/Reject thuộc UC24 và UC25 của Member 3.

* **Event Detail Boundary:** UC13 không hiển thị full event detail. Nếu Volunteer muốn xem chi tiết event, hệ thống điều hướng sang UC09.

* **Feedback Boundary:** UC13 không submit feedback. Submit Feedback thuộc UC48 và chỉ liên quan sau khi attendance hợp lệ.

* **Certificate Boundary:** UC13 không xem hoặc download certificate. Certificate thuộc UC51 và UC52.

* **Volunteer History Boundary:** UC13 không thay thế Volunteer History. UC21 thuộc Member 1.

* **Attendance Boundary:** UC13 không xử lý attendance. Attendance Check thuộc UC45.

* **Visibility Boundary:** Nếu event liên quan đã bị xóa mềm hoặc không còn public, UC13 vẫn có thể hiển thị application record tối thiểu nếu cần theo lịch sử application, nhưng link View Detail có thể bị disabled hoặc hiển thị unavailable state.

* **Status Boundary:** UC13 chỉ hiển thị trạng thái application, không tự thay đổi trạng thái trừ action cancel thuộc UC14.

* **Pagination Boundary:** Applied Events nên có pagination hoặc loading strategy nếu số lượng application nhiều.

* **Filter Boundary:** UC13 có thể hỗ trợ lọc theo application status nếu cần trong bản đầu, nhưng filter này chỉ nằm trong Applied Events, không phải UC11 Filter Event.

* **Mock Data:** Có thể dùng mock applied events data trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS

* Guest là trạng thái chưa đăng nhập, không phải role lưu trong database.
* Role trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.
* UC13 chỉ dành cho authenticated Volunteer.
* Guest không được xem Applied Events.
* Staff, Manager và Admin không dùng UC13.
* Volunteer chỉ xem được application của chính mình.
* UC13 thường được mở sau khi apply thành công ở UC12 hoặc từ menu Volunteer.
* UC13 hiển thị danh sách application mà Volunteer đã gửi.
* Mỗi item trong Applied Events đại diện cho một application gắn với một event.
* Application status trong bản đầu gồm `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.
* Application mới từ UC12 có status `PENDING`.
* Application `PENDING` có thể có cancel action, nhưng logic cancel thuộc UC14.
* Application `APPROVED` không được Volunteer tự cancel trong bản đầu; Volunteer cần liên hệ Staff nếu muốn thay đổi.
* Application `REJECTED` không có cancel action.
* Application `CANCELLED` không có cancel action.
* Applied event item nên hiển thị event title, thumbnail, organization, date/time, location, category, application status và submitted time nếu có dữ liệu.
* Nếu Staff có review note hoặc reject reason, UC13 có thể hiển thị cho Volunteer nếu dữ liệu có sẵn.
* Volunteer có thể click event item hoặc View Detail để đi sang UC09 nếu event vẫn available.
* Nếu event không còn available, View Detail có thể bị disabled hoặc điều hướng sang unavailable state.
* UC13 có thể hỗ trợ filter theo status như All, Pending, Approved, Rejected, Cancelled.
* Khi status filter thay đổi, pagination nên reset về page 1.
* Nếu Volunteer chưa apply event nào, UI cần hiển thị empty state.
* Nếu filter theo status không có kết quả, UI cần hiển thị filter-empty state.
* Nếu tải danh sách applied events thất bại, UI cần hiển thị error state.
* Database/API thật cần được thống nhất sau khi spec/plan/api-contract được viết.

---

## 6. OPEN QUESTIONS

### Q1. Ai được xem Applied Events?

**Answer:** Chỉ authenticated Volunteer được xem Applied Events của chính mình.

---

### Q2. Guest có được xem Applied Events không?

**Answer:** Không. Applied Events là dữ liệu cá nhân, Guest phải login trước.

---

### Q3. Staff, Manager, Admin có dùng UC13 không?

**Answer:** Không. Staff có Application Management riêng ở Member 3. Manager/Admin có module riêng, không dùng Volunteer Applied Events.

---

### Q4. Volunteer có được xem application của người khác không?

**Answer:** Không. Volunteer chỉ được xem application của chính mình.

---

### Q5. UC13 có tạo application không?

**Answer:** Không. Tạo application thuộc UC12 — Apply Event.

---

### Q6. UC13 có cancel application không?

**Answer:** UC13 có thể hiển thị cancel action trong danh sách, nhưng business rule và xử lý cancel thuộc UC14 — Cancel Application.

---

### Q7. UC13 và UC14 có cần làm hai màn hình riêng không?

**Answer:** Không cần. Hai UC này tách docs để rõ use case, nhưng khi code nên nằm chung trong cùng Applied Events page. UC14 là action trên item của UC13.

---

### Q8. Application status nào cần hiển thị?

**Answer:** Bản đầu nên hiển thị `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

---

### Q9. Application status nào được phép cancel?

**Answer:** Chỉ application `PENDING` được phép cancel trong bản đầu. Rule chi tiết thuộc UC14.

---

### Q10. Application `APPROVED` có được Volunteer tự cancel không?

**Answer:** Không trong bản đầu. Volunteer cần liên hệ Staff nếu muốn hủy sau khi đã approved.

---

### Q11. Applied Events cần hiển thị thông tin gì?

**Answer:** Bản đầu nên hiển thị:

* event title;
* thumbnail nếu có;
* organization;
* category nếu có;
* event date/time;
* location;
* application status;
* submitted time nếu có;
* review note/rejection reason nếu có;
* View Detail action;
* Cancel action nếu application đủ điều kiện.

---

### Q12. Có cần filter theo status không?

**Answer:** Có thể có trong bản đầu để Volunteer dễ theo dõi application. Đây là filter nội bộ của Applied Events, không phải UC11 Filter Event.

---

### Q13. Nếu event đã bị xóa hoặc không còn public thì Applied Events xử lý thế nào?

**Answer:** UC13 có thể vẫn hiển thị application record tối thiểu để Volunteer biết mình từng apply, nhưng View Detail có thể bị disabled hoặc điều hướng sang unavailable state.

---

### Q14. Apply thành công từ UC12 thì đi đâu?

**Answer:** Hệ thống nên cung cấp link hoặc điều hướng sang UC13 để Volunteer xem application vừa gửi.

---

### Q15. Backend hay frontend là nơi chốt ownership?

**Answer:** Backend/API phải enforce ownership cuối cùng. Frontend chỉ hỗ trợ hiển thị dữ liệu được phép.

---

## 7. ANSWERS / ANSWERS TO OPEN QUESTIONS

* **A1:** UC13 — View Applied Events thuộc Member 2 / Volunteer Event.

* **A2:** UC13 chỉ dành cho authenticated Volunteer.

* **A3:** Guest không được xem Applied Events.

* **A4:** Staff, Manager và Admin không dùng UC13.

* **A5:** Guest không phải role lưu trong database.

* **A6:** Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **A7:** Volunteer chỉ được xem application của chính mình.

* **A8:** UC13 thường được mở sau khi apply thành công ở UC12 hoặc từ menu Volunteer.

* **A9:** UC13 không tạo application.

* **A10:** Tạo application thuộc UC12.

* **A11:** UC13 có thể hiển thị cancel action, nhưng xử lý cancel thuộc UC14.

* **A12:** UC13 và UC14 nên implement chung trong một Applied Events page.

* **A13:** Codex không nên tạo page riêng chỉ để cancel application.

* **A14:** Application status bản đầu gồm `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

* **A15:** Application `PENDING` có thể cancel ở UC14.

* **A16:** Application `APPROVED` không được Volunteer tự cancel trong bản đầu.

* **A17:** Application `REJECTED` không có cancel action.

* **A18:** Application `CANCELLED` không có cancel action.

* **A19:** Applied event item nên hiển thị event title, thumbnail, organization, category, date/time, location, application status và submitted time nếu có.

* **A20:** Review note hoặc rejection reason có thể hiển thị nếu dữ liệu có sẵn.

* **A21:** Volunteer có thể đi từ Applied Events sang UC09 — View Event Detail nếu event vẫn available.

* **A22:** Nếu event không còn available, View Detail có thể disabled hoặc hiển thị unavailable state.

* **A23:** UC13 có thể hỗ trợ filter theo application status.

* **A24:** Status filter trong UC13 không phải UC11 Filter Event.

* **A25:** Khi status filter thay đổi, pagination nên reset về page 1.

* **A26:** UC13 cần loading state.

* **A27:** UC13 cần empty state nếu Volunteer chưa apply event nào.

* **A28:** UC13 cần filter-empty state nếu status filter không có kết quả.

* **A29:** UC13 cần error state nếu tải dữ liệu thất bại.

* **A30:** Backend/API phải enforce authentication, role và ownership cuối cùng.

* **A31:** UC13 không xử lý approve/reject application.

* **A32:** Approve/Reject thuộc Member 3.

* **A33:** UC13 không xử lý attendance, feedback hoặc certificate.

* **A34:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau, không định nghĩa trong context.

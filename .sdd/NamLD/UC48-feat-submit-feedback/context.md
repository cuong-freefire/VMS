# CONTEXT.md — Submit Feedback (UC48)

# Người viết: NamLD (Member 2) | Ngày: 2026-06-27

## 1. PROBLEM STATEMENT

Volunteer Event Management System cần chức năng cho phép Volunteer gửi feedback sau khi đã tham gia event hợp lệ.

Ở các use case trước, Volunteer có thể xem event, apply event, theo dõi application và tham gia event sau khi được Staff approve. Sau khi event kết thúc và Volunteer đã được ghi nhận attendance hợp lệ, hệ thống cần cho phép Volunteer gửi feedback để chia sẻ cảm nhận, đánh giá hoặc góp ý về event.

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

Trong file này, phạm vi chỉ tập trung vào **UC48 — Submit Feedback**.

UC48 cần đảm bảo:

* Chỉ Volunteer đã đăng nhập mới được submit feedback.
* Guest không được submit feedback.
* Staff, Manager và Admin không submit feedback qua Volunteer flow.
* Volunteer chỉ được feedback cho event mà chính mình đã tham gia hợp lệ.
* Volunteer chỉ được feedback sau khi attendance của mình được ghi nhận hợp lệ.
* Volunteer không được feedback cho event chưa tham gia, chưa attendance hoặc attendance không hợp lệ.
* Mỗi Volunteer chỉ được submit một feedback cho mỗi event.
* Feedback cần có nội dung đánh giá/góp ý.
* Rating có thể được hỗ trợ nếu team cần, nhưng nên xem là optional trong bản đầu nếu chưa chốt rõ.
* Hệ thống cần có loading/submitting state, success state, validation state và error state.

Lưu ý quan trọng:

UC48 — Submit Feedback là use case riêng của Member 2. Tuy nhiên, entry point để mở Feedback Form có thể đến từ màn Volunteer History hoặc một màn liên quan đến event đã tham gia. Theo assignment mới, UC21 — View Volunteer History thuộc Member 1, nên UC48 chỉ phụ trách form và logic submit feedback, không phụ trách toàn bộ Volunteer History.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Volunteer Event.

* **Use Case:** UC48 — Submit Feedback.

* **Feature Folder:** `UC48-feat-submit-feedback`.

* **Possible Entry Use Cases:**

  * UC13 — View Applied Events
  * UC21 — View Volunteer History
  * UC45 — Attendance Check
  * UC46 — View Attendance List
  * UC47 — View Attendance History

* **Connected UC trong phần Member 2:**

  * UC08 — View Event List
  * UC09 — View Event Detail
  * UC10 — Search Event
  * UC11 — Filter Event
  * UC12 — Apply Event
  * UC13 — View Applied Events
  * UC14 — Cancel Application
  * UC51 — View Certificates
  * UC52 — Download Certificate

* **Connected UC ngoài phần Member 2:**

  * UC03 — Login
  * UC04 — Register
  * UC21 — View Volunteer History
  * UC22 — View Application List
  * UC23 — View Application Detail
  * UC24 — Approve Application
  * UC25 — Reject Application
  * UC45 — Attendance Check
  * UC46 — View Attendance List
  * UC47 — View Attendance History
  * UC53 — Generate Certificate

* **Guest:** Guest không phải role được lưu trong database. Guest là trạng thái người dùng chưa đăng nhập. Guest không được submit feedback.

* **Volunteer:** Volunteer là user đã đăng nhập với role `VOLUNTEER`. Volunteer là actor chính của UC48 và chỉ được submit feedback cho event mà mình đã tham gia hợp lệ.

* **Staff:** Staff là user có role `STAFF`, phụ trách application review, attendance và certificate generation ở module của Member 3. Staff không submit feedback qua UC48.

* **Manager:** Manager là user có role `MANAGER`, phụ trách category, skill hoặc các nghiệp vụ quản lý khác. Manager không submit feedback qua UC48.

* **Admin:** Admin là user có role `ADMIN`, phụ trách quản trị hệ thống. Admin không submit feedback qua UC48.

* **Feedback:** Nội dung đánh giá/góp ý của Volunteer sau khi tham gia event.

* **Submit Feedback:** Hành động Volunteer gửi feedback cho một event đã tham gia hợp lệ.

* **Feedback Form:** Form cho phép Volunteer nhập nội dung feedback và có thể nhập rating nếu team quyết định hỗ trợ.

* **Feedback Content / Comment:** Nội dung góp ý hoặc cảm nhận mà Volunteer nhập khi submit feedback.

* **Rating:** Điểm đánh giá event, ví dụ 1–5. Trường này có thể optional trong bản đầu nếu team chưa chốt.

* **Attendance:** Dữ liệu ghi nhận việc Volunteer đã tham gia event. UC48 phụ thuộc attendance để xác định Volunteer có đủ điều kiện feedback hay không.

* **Successful Attendance:** Trạng thái cho thấy Volunteer đã được ghi nhận tham gia event hợp lệ. Chỉ khi có successful attendance thì Volunteer mới được submit feedback.

* **Duplicate Feedback:** Trường hợp Volunteer đã gửi feedback cho event đó trước đó. Mỗi Volunteer chỉ được gửi một feedback cho mỗi event.

* **Feedback Eligibility:** Điều kiện để Volunteer được submit feedback, bao gồm user là Volunteer, event/application thuộc về Volunteer, attendance hợp lệ và chưa submit feedback trước đó.

* **Volunteer History:** Màn hoặc dữ liệu lịch sử tham gia event của Volunteer. Theo assignment mới, UC21 thuộc Member 1, không thuộc phạm vi implement của UC48.

---

## 3. STAKEHOLDERS

* **Volunteer:** Cần gửi feedback sau khi tham gia event để đánh giá trải nghiệm và góp ý cho tổ chức/event.

* **NamLD / Member 2:** Chịu trách nhiệm chính với UC48 — Submit Feedback.

* **Member 1 — Authentication + Profile + Email Services:** Phụ trách Login/Register, Profile và Volunteer History. UC48 phụ thuộc authentication để biết current user là ai và có thể được mở từ Volunteer History.

* **Member 3 — Event & Application Management:** Phụ trách Application Management, Attendance Check và Certificate Generation. UC48 phụ thuộc attendance/application data để xác định Volunteer có đủ điều kiện feedback hay không.

* **Member 4 — Admin & Manager Management:** Không trực tiếp xử lý feedback submit, nhưng có thể liên quan gián tiếp qua user/category/skill data.

* **Member 5 — Organization + Notification + Dashboard + Payment:** Không trực tiếp xử lý feedback submit, nhưng có thể liên quan gián tiếp nếu dashboard/report sau này thống kê feedback.

---

## 4. CONSTRAINTS

* **SDD Workflow:** Use case này phải được viết theo thứ tự `context.md` → `spec.md` trước khi sang plan/tasks/implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, frontend component chi tiết, backend route, migration hoặc code.

* **Authentication Required:** UC48 yêu cầu user đã đăng nhập.

* **Role Boundary:** Chỉ user có role `VOLUNTEER` mới được submit feedback qua Volunteer flow.

* **Guest Boundary:** Guest không được submit feedback.

* **Staff/Manager/Admin Boundary:** Staff, Manager và Admin không submit feedback qua UC48.

* **Ownership Boundary:** Volunteer chỉ được submit feedback cho event/application/attendance thuộc về chính mình.

* **Attendance Boundary:** Volunteer chỉ được submit feedback sau khi attendance được ghi nhận hợp lệ.

* **Application Boundary:** Volunteer không được feedback nếu chưa từng apply hoặc application không hợp lệ.

* **Approved Boundary:** Feedback thường chỉ hợp lệ khi Volunteer đã được approve và đã tham gia event. Approved application một mình chưa đủ nếu chưa có successful attendance.

* **Duplicate Boundary:** Mỗi Volunteer chỉ được submit một feedback cho mỗi event.

* **Event Timing Boundary:** Feedback chỉ nên được submit sau khi event đã diễn ra hoặc sau khi attendance hợp lệ.

* **Volunteer History Boundary:** UC48 không implement toàn bộ Volunteer History. UC21 thuộc Member 1.

* **Attendance Management Boundary:** UC48 không thực hiện Attendance Check. Attendance Check thuộc UC45 của Member 3.

* **Certificate Boundary:** UC48 không xem, tải hoặc generate certificate. Certificate thuộc UC51, UC52 và UC53.

* **Applied Events Boundary:** UC48 không hiển thị toàn bộ Applied Events. Applied Events thuộc UC13.

* **Cancel Boundary:** UC48 không cancel application. Cancel Application thuộc UC14.

* **Feedback View Boundary:** UC48 chỉ submit feedback. Nếu có màn xem danh sách feedback cho Staff/Admin thì không thuộc use case này.

* **Validation Boundary:** Feedback content cần được validate. Nội dung rỗng hoặc chỉ có khoảng trắng không hợp lệ.

* **Rating Boundary:** Nếu rating được hỗ trợ, rating phải nằm trong range hợp lệ, ví dụ 1–5.

* **Submit Boundary:** UI phải tránh gửi nhiều feedback request liên tiếp, nhưng backend/API vẫn phải kiểm tra duplicate.

* **Mock Data:** Có thể dùng mock feedback submit result trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS (Giả định)

* Guest là trạng thái chưa đăng nhập, không phải role lưu trong database.
* Role trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.
* UC48 chỉ dành cho authenticated Volunteer.
* Guest không được submit feedback.
* Staff, Manager và Admin không dùng UC48 để submit feedback.
* Volunteer chỉ được submit feedback cho event của chính mình.
* Volunteer phải có application liên quan đến event.
* Volunteer phải có attendance hợp lệ trước khi submit feedback.
* Application `APPROVED` chưa đủ để feedback nếu chưa có attendance hợp lệ.
* Volunteer không được submit feedback cho event chưa tham gia.
* Volunteer không được submit feedback cho event đang chờ duyệt, bị từ chối hoặc đã hủy.
* Volunteer không được submit feedback cho event của Volunteer khác.
* Mỗi Volunteer chỉ được submit một feedback cho mỗi event.
* Feedback content/comment là required trong bản đầu.
* Feedback content/comment cần được trim khoảng trắng đầu/cuối.
* Feedback content/comment cần validate độ dài tối thiểu/tối đa.
* Rating có thể optional trong bản đầu nếu team chưa chốt.
* Nếu rating được hỗ trợ, rating cần validate trong range hợp lệ, ví dụ 1–5.
* UC48 có thể hiển thị event summary trước khi submit feedback.
* Event summary có thể gồm event title, organization, date/time, location và attendance status nếu dữ liệu có sẵn.
* UC48 có thể được mở từ Volunteer History của Member 1 hoặc từ entry point phù hợp sau attendance.
* Sau khi submit feedback thành công, hệ thống hiển thị success state.
* Sau khi submit feedback thành công, hệ thống có thể điều hướng về Volunteer History hoặc hiển thị link quay lại màn trước.
* Nếu submit feedback thất bại do chưa attendance, duplicate feedback, sai role, không đúng owner hoặc event không hợp lệ, UI cần hiển thị message rõ ràng.
* UI cần có submitting/loading state.
* UI cần disable submit button hoặc chống submit nhiều lần khi request đang xử lý.
* Backend/API phải enforce cuối cùng cho authentication, role, ownership, attendance eligibility và duplicate feedback.
* Database/API thật cần được thống nhất sau khi spec/plan/api-contract được viết.

---

## 6. OPEN QUESTIONS

### Q1. Ai được submit feedback?

**Answer:** Chỉ authenticated Volunteer được submit feedback cho event mà mình đã tham gia hợp lệ.

---

### Q2. Guest có được submit feedback không?

**Answer:** Không. Guest chưa đăng nhập và không có attendance/application cá nhân để feedback.

---

### Q3. Staff, Manager, Admin có được submit feedback qua UC48 không?

**Answer:** Không. UC48 là Volunteer Submit Feedback flow.

---

### Q4. Volunteer có được submit feedback cho event của người khác không?

**Answer:** Không. Volunteer chỉ được feedback cho event/application/attendance thuộc về chính mình.

---

### Q5. Có cần attendance trước khi feedback không?

**Answer:** Có. Volunteer chỉ được submit feedback sau khi attendance được ghi nhận hợp lệ.

---

### Q6. Application APPROVED đã đủ để feedback chưa?

**Answer:** Chưa đủ trong bản đầu. Volunteer cần có successful attendance hoặc record tham gia hợp lệ.

---

### Q7. Volunteer có được submit feedback nhiều lần cho cùng một event không?

**Answer:** Không. Mỗi Volunteer chỉ được submit một feedback cho mỗi event.

---

### Q8. Feedback content có bắt buộc không?

**Answer:** Có. Feedback content/comment nên là required trong bản đầu.

---

### Q9. Rating có bắt buộc không?

**Answer:** Chưa chốt. Rating có thể optional trong bản đầu. Nếu dùng rating, cần validate range hợp lệ, ví dụ 1–5.

---

### Q10. UC48 có implement Volunteer History không?

**Answer:** Không. UC21 — View Volunteer History thuộc Member 1. UC48 chỉ phụ trách submit feedback.

---

### Q11. UC48 có thực hiện Attendance Check không?

**Answer:** Không. Attendance Check thuộc UC45 của Member 3. UC48 chỉ kiểm tra dữ liệu attendance để xác định eligibility.

---

### Q12. Submit feedback thành công thì đi đâu?

**Answer:** Hệ thống nên hiển thị success state và có thể điều hướng về Volunteer History hoặc màn trước đó.

---

### Q13. Backend hay frontend là nơi chốt rule feedback?

**Answer:** Backend/API phải là nơi enforce cuối cùng. Frontend chỉ hỗ trợ hiển thị và validate cơ bản.

---

## 7. ANSWERS / ANSWERS TO OPEN QUESTIONS

* **A1:** UC48 — Submit Feedback thuộc Member 2 / Volunteer Event.

* **A2:** UC48 là flow Volunteer gửi feedback sau khi tham gia event hợp lệ.

* **A3:** UC48 chỉ dành cho authenticated Volunteer.

* **A4:** Guest không được submit feedback.

* **A5:** Staff, Manager và Admin không dùng UC48 theo Volunteer flow.

* **A6:** Guest không phải role lưu trong database.

* **A7:** Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **A8:** Volunteer chỉ được submit feedback cho event của chính mình.

* **A9:** Volunteer cần có attendance hợp lệ trước khi submit feedback.

* **A10:** Application `APPROVED` chưa đủ để submit feedback nếu chưa có attendance hợp lệ.

* **A11:** Volunteer không được feedback cho event chưa tham gia.

* **A12:** Mỗi Volunteer chỉ được submit một feedback cho mỗi event.

* **A13:** Feedback content/comment là required trong bản đầu.

* **A14:** Feedback content/comment cần trim khoảng trắng đầu/cuối.

* **A15:** Feedback content/comment cần validate độ dài.

* **A16:** Rating có thể optional trong bản đầu.

* **A17:** Nếu có rating, rating cần validate trong range hợp lệ, ví dụ 1–5.

* **A18:** UC48 có thể hiển thị event summary trước khi submit.

* **A19:** UC48 có thể được mở từ Volunteer History của Member 1 hoặc một entry point phù hợp sau attendance.

* **A20:** UC48 không implement Volunteer History vì UC21 thuộc Member 1.

* **A21:** UC48 không thực hiện Attendance Check vì UC45 thuộc Member 3.

* **A22:** Sau khi submit feedback thành công, hệ thống hiển thị success state.

* **A23:** Sau khi submit feedback thành công, hệ thống có thể điều hướng về Volunteer History hoặc màn trước.

* **A24:** Nếu submit thất bại, UI cần hiển thị error message rõ ràng.

* **A25:** UI cần có submitting/loading state.

* **A26:** UI cần disable submit button hoặc chống submit nhiều lần khi request đang xử lý.

* **A27:** Backend/API phải enforce cuối cùng cho authentication, role, ownership, attendance eligibility và duplicate feedback.

* **A28:** UC48 không xử lý certificate.

* **A29:** Certificate thuộc UC51, UC52 và UC53.

* **A30:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau, không định nghĩa trong context.

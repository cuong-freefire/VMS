# CONTEXT.md — Volunteer Feedback Form

# Người viết: NamLD (Member 2) | Ngày: 2026-06-27

## 1. PROBLEM STATEMENT

Hệ thống Volunteer Event Management System cần một form cho phép Volunteer gửi feedback sau khi đã tham gia sự kiện tình nguyện.

Ở feature `005-volunteer-history`, Volunteer có thể xem lại các event đã tham gia hoặc hoàn thành. Sau khi Volunteer đã điểm danh thành công, hệ thống cần cho phép Volunteer gửi đánh giá về event đó để Staff và tổ chức có thể cải thiện chất lượng hoạt động tình nguyện.

Feature `006-volunteer-feedback-form` tập trung vào **Submit Feedback**, bao gồm:

* Cho Volunteer gửi feedback cho event đã tham gia.
* Chỉ cho phép gửi feedback sau khi Volunteer đã điểm danh thành công.
* Mỗi Volunteer chỉ được gửi 1 feedback cho mỗi event.
* Hiển thị thông tin tóm tắt của event trước khi gửi feedback.
* Cho Volunteer nhập nội dung feedback.
* Có thể cho Volunteer đánh giá bằng rating nếu team sử dụng.
* Kiểm tra quyền truy cập và điều kiện gửi feedback.
* Hiển thị validation error, success state, loading state và error state.

Theo business rule mới của team, Volunteer chỉ được gửi feedback sau khi đã điểm danh thành công. Mỗi Volunteer chỉ gửi 1 feedback cho mỗi sự kiện.

Feature này không xử lý Event Discovery, không xử lý Event Detail, không xử lý Apply Event, không xử lý Applied Events, không xử lý Attendance Check-in, không xử lý Feedback List, không xử lý Feedback Detail, không xử lý Certificate, Notification, Donation hoặc Reporting.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Feedback Management / Volunteer Event Module.

* **Feature:** Volunteer Feedback Form.

* **Related Use Case:**

  * UC48 — Submit Feedback

* **Connected Use Cases:**

  * UC21 — View Volunteer History
  * UC45 — Attendance Check-in
  * UC46 — View Attendance List
  * UC47 — View Attendance History
  * UC49 — View Feedback List
  * UC50 — View Feedback Detail

* **Related Screens:**

  * Feedback Form
  * Volunteer History, if user starts feedback from history item
  * Event Detail, if feedback entry point is later connected from detail/history

* **Related Actors:**

  * Guest
  * Volunteer
  * Staff

* **Guest:** Guest không phải role được lưu trong database. Guest là trạng thái người dùng chưa đăng nhập. Guest không được gửi feedback vì feedback là hành động cá nhân sau khi tham gia event.

* **Volunteer:** Volunteer là user đã đăng nhập với role `VOLUNTEER`. Volunteer có thể gửi feedback cho event nếu đã điểm danh thành công và chưa từng gửi feedback cho event đó.

* **Staff:** Staff là user có role `STAFF`, phụ trách xem Feedback List và Feedback Detail ở Staff Module. Staff không gửi feedback trong feature này.

* **Feedback:** Nội dung đánh giá/nhận xét của Volunteer về event sau khi tham gia.

* **Feedback Form:** Form cho phép Volunteer nhập nội dung feedback, rating nếu có, và submit feedback.

* **Successful Attendance:** Điều kiện cho biết Volunteer đã điểm danh thành công tại event. Đây là điều kiện bắt buộc để gửi feedback.

* **Feedback Eligibility:** Điều kiện để Volunteer được gửi feedback. Bản đầu gồm:

  * User phải đăng nhập.
  * User phải có role `VOLUNTEER`.
  * Volunteer phải là người đã tham gia event.
  * Volunteer phải có attendance successful.
  * Volunteer chưa từng gửi feedback cho event đó.

* **One Feedback Per Event Rule:** Mỗi Volunteer chỉ được gửi một feedback cho mỗi event.

* **Feedback List:** Danh sách feedback do Staff xem ở module khác. Không thuộc feature này.

* **Feedback Detail:** Chi tiết feedback do Staff xem ở module khác. Không thuộc feature này.

---

## 3. STAKEHOLDERS

* **Volunteer:** Cần gửi đánh giá sau khi tham gia event để phản hồi trải nghiệm, góp ý và đánh giá chất lượng event.

* **NamLD / Member 2:** Chịu trách nhiệm chính với Feedback Form trong Volunteer Event Module.

* **Member 1 — Authentication & Profile:** Phụ trách login/session/current user. Feature này cần xác định user đã đăng nhập chưa và có role `VOLUNTEER` không.

* **Member 3 — Staff Module:** Phụ trách Attendance Management, Feedback List và Feedback Detail. Feature này phụ thuộc vào dữ liệu attendance do Staff Module ghi nhận và tạo feedback data để Staff xem.

* **Member 4 — Manager Module:** Không trực tiếp xử lý Feedback Form, nhưng category/skill/organization của event có thể được hiển thị trong event summary nếu cần.

* **Member 5 — Admin Module:** Không trực tiếp xử lý Feedback Form, nhưng có thể liên quan Dashboard, Statistics hoặc Reports ở module khác.

---

## 4. CONSTRAINTS (Ràng buộc cứng)

* **SDD Workflow:** Feature này phải đi theo thứ tự `context.md` → `spec.md` → `plan.md` → `tasks.md` → implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, route, component, migration hoặc code task.

* **Authentication Required:** Chỉ user đã đăng nhập mới được gửi feedback.

* **Guest Boundary:** Guest không được gửi feedback.

* **Role Boundary:** Chỉ user có role `VOLUNTEER` mới được gửi feedback trong Volunteer Feedback Form.

* **Database Role Boundary:** Guest không phải role được lưu trong database. Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **Ownership Boundary:** Volunteer chỉ được gửi feedback cho event mà chính Volunteer đã tham gia hợp lệ.

* **Attendance Boundary:** Volunteer chỉ được gửi feedback sau khi đã điểm danh thành công.

* **Approved Application Boundary:** Chỉ Volunteer có application `APPROVED` mới có thể được điểm danh. Tuy nhiên, feedback không chỉ dựa vào `APPROVED`; feedback cần dựa vào attendance successful.

* **One Feedback Boundary:** Mỗi Volunteer chỉ được gửi 1 feedback cho mỗi event.

* **Duplicate Feedback Boundary:** Nếu Volunteer đã gửi feedback cho event đó, hệ thống không được cho gửi lại feedback mới trong bản đầu.

* **Feedback Editing Boundary:** Feature này không xử lý chỉnh sửa feedback sau khi đã gửi, trừ khi team chốt thêm ở feature khác.

* **Feedback List Boundary:** Feature này không hiển thị danh sách feedback cho Staff. Feedback List thuộc Staff Module.

* **Feedback Detail Boundary:** Feature này không hiển thị chi tiết feedback cho Staff. Feedback Detail thuộc Staff Module.

* **Attendance Management Boundary:** Feature này không thực hiện điểm danh. Attendance Check-in và Attendance Management thuộc module khác.

* **Volunteer History Boundary:** Feature này không hiển thị toàn bộ Volunteer History. Volunteer History thuộc feature `005-volunteer-history`.

* **Certificate Boundary:** Feature này không xem/tải/generate certificate. Certificate thuộc feature `007-volunteer-certificates` và Staff Generate Certificate.

* **Notification Boundary:** Feature này không bắt buộc gửi notification/email sau khi submit feedback. Notification hoặc email có thể thuộc module riêng.

* **Mock Data:** Có thể dùng mock feedback/attendance/event data trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS (Các giả định hiện tại)

* Guest là trạng thái chưa đăng nhập, không phải role lưu trong database.
* Role trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.
* Feedback Form yêu cầu user đã đăng nhập.
* Chỉ Volunteer được gửi feedback trong feature này.
* Staff, Manager, Admin không gửi feedback trong Volunteer Feedback Form.
* Feedback Form thường được mở từ Volunteer History sau khi event đã tham gia.
* Volunteer chỉ được gửi feedback cho event mà mình đã điểm danh thành công.
* Application `APPROVED` là điều kiện liên quan đến attendance, nhưng không đủ để feedback nếu chưa điểm danh thành công.
* Volunteer chưa điểm danh thành công không được gửi feedback.
* Volunteer vắng mặt không được gửi feedback.
* Volunteer chỉ được gửi 1 feedback cho mỗi event.
* Nếu Volunteer đã gửi feedback cho event, hệ thống không cho gửi lại trong bản đầu.
* Feedback Form nên hiển thị event summary để Volunteer biết mình đang feedback cho event nào.
* Event summary có thể gồm event title, organization, date/time, location và attendance status.
* Feedback có thể gồm nội dung text bắt buộc.
* Feedback có thể có rating nếu team muốn UI đầy đủ hơn.
* Feedback content cần được validate trước khi submit.
* Rating nếu có cần nằm trong khoảng hợp lệ, ví dụ 1 đến 5.
* Nếu submit thành công, hệ thống hiển thị success state.
* Sau khi submit thành công, hệ thống có thể điều hướng về Volunteer History.
* Nếu submit thất bại, hệ thống hiển thị error message rõ ràng.
* Nếu attendance data chưa sẵn sàng, feature có thể dùng mock data tạm thời qua service layer.
* Database/API thật cần được thống nhất sau khi `plan.md` và `api-contract.md` được viết.

---

## 6. RESOLVED QUESTIONS (Tự trả lời dựa trên docs mới và quyết định trước đó)

### Q1. Guest có phải role trong database không?

**Answer:** Không. Guest chỉ là trạng thái chưa đăng nhập. Role trong database chỉ gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

---

### Q2. Guest có được gửi feedback không?

**Answer:** Không. Guest chưa đăng nhập và chưa có dữ liệu tham gia event, nên không được gửi feedback.

---

### Q3. Ai được gửi feedback?

**Answer:** Chỉ authenticated user có role `VOLUNTEER` và đã điểm danh thành công cho event tương ứng.

---

### Q4. Volunteer chỉ có application `APPROVED` đã được gửi feedback chưa?

**Answer:** Chưa chắc. `APPROVED` chỉ giúp Volunteer đủ điều kiện điểm danh. Feedback chỉ được gửi sau khi Volunteer điểm danh thành công.

---

### Q5. Volunteer chưa điểm danh có được gửi feedback không?

**Answer:** Không. Theo docs mới, Volunteer chỉ được gửi feedback sau khi đã điểm danh thành công.

---

### Q6. Volunteer vắng mặt có được gửi feedback không?

**Answer:** Không trong bản đầu, vì không có successful attendance.

---

### Q7. Mỗi Volunteer được gửi bao nhiêu feedback cho một event?

**Answer:** Mỗi Volunteer chỉ được gửi 1 feedback cho mỗi event.

---

### Q8. Volunteer đã gửi feedback rồi có được gửi lại không?

**Answer:** Không trong bản đầu. Hệ thống cần chặn duplicate feedback.

---

### Q9. Feature này có sửa feedback không?

**Answer:** Không. Feature này chỉ submit feedback mới. Edit feedback không thuộc phạm vi bản đầu.

---

### Q10. Feature này có xem Feedback List không?

**Answer:** Không. Feedback List thuộc Staff Module.

---

### Q11. Feature này có xem Feedback Detail không?

**Answer:** Không. Feedback Detail thuộc Staff Module.

---

### Q12. Feature này có thực hiện điểm danh không?

**Answer:** Không. Attendance Check-in và Attendance Management thuộc module khác.

---

### Q13. Feedback Form nên được mở từ đâu?

**Answer:** Bản đầu nên mở từ Volunteer History, vì Volunteer History biết event nào đã tham gia và đủ điều kiện feedback.

---

### Q14. Feedback Form có cần hiển thị event summary không?

**Answer:** Có. Volunteer cần biết mình đang gửi feedback cho event nào.

---

### Q15. Feedback gồm những field gì?

**Answer:** Bản đầu nên có:

* feedback content/comment;
* rating nếu team muốn hỗ trợ đánh giá sao.

---

### Q16. Rating có bắt buộc không?

**Answer:** Có thể để optional hoặc required tùy UI. Bản đầu nên để rating optional nếu team chưa chốt, nhưng nếu có nhập thì phải validate khoảng hợp lệ.

---

### Q17. Feedback content có bắt buộc không?

**Answer:** Nên bắt buộc để feedback có ý nghĩa. Content phải được trim và validate độ dài.

---

### Q18. Submit feedback thành công thì đi đâu?

**Answer:** Có thể hiển thị success state và cho Volunteer quay lại Volunteer History.

---

## 7. ANSWERS (Đã chốt nghiệp vụ cho bản đầu)

* **A1:** Feature này là `006-volunteer-feedback-form`.

* **A2:** Feature này thuộc Member 2 — Volunteer Event Module.

* **A3:** Feature này tương ứng với UC48 — Submit Feedback.

* **A4:** Guest không phải role lưu trong database.

* **A5:** Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **A6:** Guest không được gửi feedback.

* **A7:** Chỉ authenticated Volunteer được gửi feedback.

* **A8:** Volunteer chỉ được gửi feedback cho event mà chính Volunteer đã tham gia hợp lệ.

* **A9:** Volunteer chỉ được gửi feedback sau khi điểm danh thành công.

* **A10:** Application `APPROVED` chưa đủ để gửi feedback nếu chưa có attendance successful.

* **A11:** Volunteer vắng mặt không được gửi feedback trong bản đầu.

* **A12:** Mỗi Volunteer chỉ được gửi 1 feedback cho mỗi event.

* **A13:** Volunteer đã gửi feedback cho event thì không được gửi lại trong bản đầu.

* **A14:** Feedback Form nên được mở từ Volunteer History.

* **A15:** Feedback Form cần hiển thị event summary.

* **A16:** Event summary nên gồm:

  * event title
  * organization
  * event date/time
  * location
  * attendance status

* **A17:** Feedback content/comment nên là field bắt buộc.

* **A18:** Feedback content cần trim và validate độ dài.

* **A19:** Rating có thể có trong bản đầu nếu team muốn.

* **A20:** Nếu có rating, rating cần được validate trong khoảng hợp lệ, ví dụ 1 đến 5.

* **A21:** Submit feedback thành công tạo feedback record.

* **A22:** Submit feedback thành công hiển thị success state.

* **A23:** Sau khi submit thành công, Volunteer có thể quay lại Volunteer History.

* **A24:** Submit feedback thất bại hiển thị error message rõ ràng.

* **A25:** Feature cần có loading state khi tải feedback context.

* **A26:** Feature cần có submitting state khi gửi feedback.

* **A27:** Feature cần tránh gửi nhiều request submit liên tiếp.

* **A28:** Feature này không xem Feedback List.

* **A29:** Feature này không xem Feedback Detail.

* **A30:** Feature này không thực hiện Attendance Check-in.

* **A31:** Feature này không tạo, xem hoặc tải Certificate.

* **A32:** Feature này phụ thuộc Member 1 về auth/login/current user.

* **A33:** Feature này phụ thuộc Member 3 về attendance data, feedback list/detail và Staff review data nếu có.

* **A34:** Feature này có thể dùng mock data qua service layer trong giai đoạn đầu, nhưng mock data không phải source of truth.

* **A35:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau (`plan.md`, `api-contract.md`, `database.md`, `tasks.md`), không định nghĩa trong context.

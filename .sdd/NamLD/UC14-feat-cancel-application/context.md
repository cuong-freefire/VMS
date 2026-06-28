# CONTEXT.md — Cancel Application (UC14)

# Người viết: NamLD (Member 2) | Ngày: 2026-06-27

## 1. PROBLEM STATEMENT

Volunteer Event Management System cần chức năng cho phép Volunteer hủy application đã gửi trong trường hợp application đó vẫn còn được phép hủy.

Ở UC12 — Apply Event, Volunteer có thể gửi application để đăng ký tham gia event. Ở UC13 — View Applied Events, Volunteer có thể xem danh sách application đã gửi và trạng thái xử lý của từng application. Trong một số trường hợp, Volunteer có thể muốn hủy application, ví dụ bận lịch, không còn muốn tham gia, hoặc apply nhầm event.

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

Trong file này, phạm vi chỉ tập trung vào **UC14 — Cancel Application**.

UC14 cần đảm bảo:

* Chỉ Volunteer đã đăng nhập mới được cancel application của chính mình.
* Guest không được cancel application.
* Staff, Manager và Admin không dùng Volunteer Cancel Application flow.
* Volunteer không được cancel application của Volunteer khác.
* Chỉ application có status `PENDING` mới được cancel trong bản đầu.
* Application `APPROVED` không được Volunteer tự cancel trong bản đầu; Volunteer cần liên hệ Staff.
* Application `REJECTED` không cần cancel.
* Application `CANCELLED` không được cancel lại.
* Khi cancel thành công, application chuyển sang status `CANCELLED`.
* Sau khi cancel thành công, màn Applied Events cần cập nhật trạng thái application.
* Hệ thống cần có confirmation trước khi cancel để tránh thao tác nhầm.
* Hệ thống cần có loading/submitting state, success state và error state.

Lưu ý quan trọng:

UC13 — View Applied Events và UC14 — Cancel Application được viết thành hai folder context/spec riêng theo format team. Tuy nhiên, khi implementation, hai use case này nên được code chung trong cùng một màn hình Applied Events. UC13 là phần hiển thị danh sách application, còn UC14 là action hủy application trên từng item đủ điều kiện. Codex không nên tạo một màn hình riêng chỉ để cancel application nếu không cần.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Volunteer Event.

* **Use Case:** UC14 — Cancel Application.

* **Feature Folder:** `UC14-feat-cancel-application`.

* **Main Related UC trong cùng màn Applied Events:**

  * UC13 — View Applied Events

* **Previous / Entry Use Cases:**

  * UC12 — Apply Event
  * UC13 — View Applied Events

* **Connected UC trong phần Member 2:**

  * UC08 — View Event List
  * UC09 — View Event Detail
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

* **Guest:** Guest không phải role được lưu trong database. Guest là trạng thái người dùng chưa đăng nhập. Guest không được cancel application vì chưa có danh tính Volunteer.

* **Volunteer:** Volunteer là user đã đăng nhập với role `VOLUNTEER`. Volunteer là actor chính của UC14 và chỉ được cancel application của chính mình nếu application đủ điều kiện.

* **Staff:** Staff là user có role `STAFF`, phụ trách xem application list/detail, approve/reject application và các nghiệp vụ Staff ở module Member 3. Staff không dùng UC14 để cancel application theo flow Volunteer.

* **Manager:** Manager là user có role `MANAGER`, phụ trách category, skill hoặc các nghiệp vụ quản lý khác. Manager không dùng UC14.

* **Admin:** Admin là user có role `ADMIN`, phụ trách quản trị hệ thống. Admin không dùng UC14.

* **Application:** Bản ghi đăng ký tham gia event của Volunteer.

* **Cancel Application:** Hành động Volunteer hủy application đã gửi nếu application còn ở trạng thái được phép hủy.

* **Application Status:** Trạng thái xử lý application, ví dụ `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

* **PENDING:** Application đang chờ Staff duyệt. Đây là trạng thái duy nhất Volunteer được cancel trong bản đầu.

* **APPROVED:** Application đã được Staff duyệt. Volunteer không được tự cancel trong bản đầu; nếu muốn hủy cần liên hệ Staff.

* **REJECTED:** Application đã bị Staff từ chối. Volunteer không cần cancel application này.

* **CANCELLED:** Application đã bị Volunteer hủy. Không thể cancel lại.

* **Cancel Confirmation:** Hộp thoại hoặc bước xác nhận trước khi hủy application để tránh thao tác nhầm.

* **Cancel Reason:** Lý do hủy application. Trường này có thể optional trong bản đầu nếu team chưa chốt.

* **Own Data Boundary:** Volunteer chỉ được cancel application thuộc tài khoản của chính mình.

* **Applied Events Page:** Màn hình của UC13, nơi hiển thị danh sách application và chứa action cancel của UC14.

---

## 3. STAKEHOLDERS

* **Volunteer:** Cần hủy application khi không còn muốn hoặc không thể tham gia event, miễn là application vẫn còn được phép hủy.

* **NamLD / Member 2:** Chịu trách nhiệm chính với UC14 — Cancel Application.

* **Member 1 — Authentication + Profile + Email Services:** Phụ trách Login/Register và xác thực người dùng. UC14 phụ thuộc authentication để biết current user có phải Volunteer hay không.

* **Member 3 — Event & Application Management:** Phụ trách Staff Application Management, Approve Application và Reject Application. UC14 cần không xung đột với workflow Staff review.

* **Member 4 — Admin & Manager Management:** Không trực tiếp xử lý cancel application, nhưng có thể liên quan gián tiếp qua user/category/skill data.

* **Member 5 — Organization + Notification + Dashboard + Payment:** Không trực tiếp xử lý cancel application, nhưng có thể liên quan gián tiếp qua organization/notification nếu sau này có thông báo.

---

## 4. CONSTRAINTS

* **SDD Workflow:** Use case này phải được viết theo thứ tự `context.md` → `spec.md` trước khi sang plan/tasks/implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, frontend component chi tiết, backend route, migration hoặc code.

* **Authentication Required:** UC14 yêu cầu user đã đăng nhập.

* **Role Boundary:** Chỉ user có role `VOLUNTEER` mới được cancel application theo Volunteer flow.

* **Guest Boundary:** Guest không được cancel application.

* **Staff/Manager/Admin Boundary:** Staff, Manager và Admin không dùng UC14 để cancel application theo giao diện Volunteer.

* **Ownership Boundary:** Volunteer chỉ được cancel application của chính mình. Không được cancel application của Volunteer khác.

* **Applied Events Boundary:** UC14 nên được thực hiện từ màn Applied Events của UC13.

* **Shared Screen Boundary:** UC13 và UC14 là các use case riêng nhưng nên implement chung trên cùng một màn Applied Events.

* **Codex Implementation Boundary:** Khi sinh code, Codex không nên tạo một page riêng chỉ để cancel application nếu action này có thể xử lý trong Applied Events page.

* **Status Boundary:** Chỉ application status `PENDING` được cancel trong bản đầu.

* **Approved Boundary:** Application `APPROVED` không được Volunteer tự cancel trong bản đầu; Volunteer cần liên hệ Staff.

* **Rejected Boundary:** Application `REJECTED` không được cancel vì đã bị từ chối.

* **Cancelled Boundary:** Application `CANCELLED` không được cancel lại.

* **Confirmation Boundary:** Cancel application là hành động thay đổi dữ liệu, nên cần confirmation trước khi thực hiện.

* **Apply Boundary:** UC14 không tạo application. Apply Event thuộc UC12.

* **View Applied Events Boundary:** UC14 không thay thế UC13. UC13 là nơi hiển thị danh sách application.

* **Staff Review Boundary:** UC14 không approve hoặc reject application. Approve/Reject thuộc UC24 và UC25 của Member 3.

* **Attendance Boundary:** UC14 không xử lý attendance. Attendance Check thuộc UC45.

* **Feedback Boundary:** UC14 không submit feedback. Submit Feedback thuộc UC48.

* **Certificate Boundary:** UC14 không xem, tải hoặc generate certificate. Certificate thuộc UC51, UC52 và UC53.

* **Concurrency Boundary:** Nếu Staff approve/reject application cùng lúc Volunteer cancel, backend/API phải chốt trạng thái hợp lệ cuối cùng.

* **Submit Boundary:** UI phải tránh gửi nhiều cancel request liên tiếp, nhưng backend/API vẫn phải kiểm tra lại status và ownership.

* **Mock Data:** Có thể dùng mock cancel result trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS

* Guest là trạng thái chưa đăng nhập, không phải role lưu trong database.
* Role trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.
* UC14 chỉ dành cho authenticated Volunteer.
* Guest không được cancel application.
* Staff, Manager và Admin không dùng UC14 theo Volunteer flow.
* Volunteer chỉ được cancel application của chính mình.
* UC14 thường được kích hoạt từ UC13 — View Applied Events.
* UC13 hiển thị danh sách applied events và cancel action cho application đủ điều kiện.
* UC14 không cần một page riêng nếu cancel action có thể xử lý bằng button + confirmation trong Applied Events page.
* Application status trong bản đầu gồm `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.
* Chỉ application `PENDING` được cancel trong bản đầu.
* Application `APPROVED` không được Volunteer tự cancel trong bản đầu.
* Nếu application đã `APPROVED`, UI nên hiển thị message kiểu “Contact Staff” nếu Volunteer muốn thay đổi.
* Application `REJECTED` không có cancel action.
* Application `CANCELLED` không có cancel action.
* Khi cancel thành công, application status chuyển thành `CANCELLED`.
* Sau khi cancel thành công, Applied Events page cần cập nhật lại trạng thái item hoặc refresh list.
* Cancel action nên có confirmation trước khi gửi request.
* Cancel reason có thể optional trong bản đầu nếu team chưa chốt.
* Nếu có cancel reason, nội dung cần được trim và validate độ dài.
* UI cần có cancelling/submitting state.
* UI cần disable cancel button khi request đang xử lý.
* Nếu cancel thất bại do sai role, không đúng owner, status không hợp lệ, application không tồn tại hoặc lỗi hệ thống, UI cần hiển thị message phù hợp.
* Backend/API phải enforce cuối cùng cho authentication, role, ownership, status và concurrency.
* Database/API thật cần được thống nhất sau khi spec/plan/api-contract được viết.

---

## 6. OPEN QUESTIONS

### Q1. Ai được cancel application?

**Answer:** Chỉ authenticated Volunteer được cancel application của chính mình nếu application đủ điều kiện.

---

### Q2. Guest có được cancel application không?

**Answer:** Không. Guest chưa đăng nhập và không có application cá nhân để cancel.

---

### Q3. Staff, Manager, Admin có dùng UC14 không?

**Answer:** Không. UC14 là Volunteer Cancel Application flow. Staff, Manager, Admin có module riêng.

---

### Q4. Volunteer có được cancel application của người khác không?

**Answer:** Không. Volunteer chỉ được cancel application thuộc tài khoản của mình.

---

### Q5. UC14 bắt đầu từ đâu?

**Answer:** UC14 thường bắt đầu từ UC13 — View Applied Events, khi Volunteer bấm Cancel trên một application đủ điều kiện.

---

### Q6. UC13 và UC14 có cần hai màn hình riêng không?

**Answer:** Không cần. Hai UC này tách docs để rõ use case, nhưng khi code nên nằm chung trong Applied Events page. UC14 là action trên item của UC13.

---

### Q7. Application status nào được cancel?

**Answer:** Chỉ application `PENDING` được cancel trong bản đầu.

---

### Q8. Application `APPROVED` có được Volunteer tự cancel không?

**Answer:** Không trong bản đầu. Volunteer cần liên hệ Staff nếu muốn hủy application đã approved.

---

### Q9. Application `REJECTED` có được cancel không?

**Answer:** Không. Application đã bị reject thì không cần cancel.

---

### Q10. Application `CANCELLED` có được cancel tiếp không?

**Answer:** Không. Application đã cancelled thì không được cancel lại.

---

### Q11. Cancel thành công thì application chuyển sang status gì?

**Answer:** Application chuyển sang status `CANCELLED`.

---

### Q12. Có cần confirmation trước khi cancel không?

**Answer:** Có. Cancel application là hành động thay đổi dữ liệu nên cần confirmation để tránh hủy nhầm.

---

### Q13. Có cần cancel reason không?

**Answer:** Có thể có, nhưng nên để optional trong bản đầu nếu team chưa chốt. Nếu có, cần trim và validate độ dài.

---

### Q14. Nếu Staff approve application cùng lúc Volunteer cancel thì xử lý thế nào?

**Answer:** Backend/API phải kiểm tra status hiện tại tại thời điểm request và chỉ cho cancel nếu application vẫn là `PENDING`.

---

### Q15. Backend hay frontend là nơi chốt rule cancel?

**Answer:** Backend/API phải là nơi enforce cuối cùng. Frontend chỉ hỗ trợ hiển thị và chặn thao tác cơ bản.

---

## 7. ANSWERS / ANSWERS TO OPEN QUESTIONS

* **A1:** UC14 — Cancel Application thuộc Member 2 / Volunteer Event.

* **A2:** UC14 là action hủy application của Volunteer.

* **A3:** UC14 chỉ dành cho authenticated Volunteer.

* **A4:** Guest không được cancel application.

* **A5:** Staff, Manager và Admin không dùng UC14 theo Volunteer flow.

* **A6:** Guest không phải role lưu trong database.

* **A7:** Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **A8:** Volunteer chỉ được cancel application của chính mình.

* **A9:** UC14 thường được kích hoạt từ UC13 — View Applied Events.

* **A10:** UC13 và UC14 nên implement chung trên cùng một Applied Events page.

* **A11:** Codex không nên tạo page riêng chỉ để cancel application.

* **A12:** Cancel action chỉ nên hiển thị với application `PENDING`.

* **A13:** Chỉ application `PENDING` được cancel trong bản đầu.

* **A14:** Application `APPROVED` không được Volunteer tự cancel trong bản đầu.

* **A15:** Application `REJECTED` không được cancel.

* **A16:** Application `CANCELLED` không được cancel lại.

* **A17:** Khi cancel thành công, application status chuyển sang `CANCELLED`.

* **A18:** Sau khi cancel thành công, Applied Events page cần cập nhật trạng thái item hoặc refresh list.

* **A19:** Cancel action cần confirmation trước khi thực hiện.

* **A20:** Cancel reason có thể optional trong bản đầu.

* **A21:** Nếu có cancel reason thì cần trim và validate độ dài.

* **A22:** UI cần có cancelling/submitting state.

* **A23:** UI cần disable cancel button khi request đang xử lý.

* **A24:** Nếu cancel thất bại, UI cần hiển thị error message rõ ràng.

* **A25:** Backend/API phải enforce cuối cùng cho authentication, role, ownership, application status và concurrency.

* **A26:** UC14 không tạo application.

* **A27:** Apply Event thuộc UC12.

* **A28:** UC14 không approve/reject application.

* **A29:** Approve/Reject thuộc Member 3.

* **A30:** UC14 không xử lý attendance, feedback hoặc certificate.

* **A31:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau, không định nghĩa trong context.

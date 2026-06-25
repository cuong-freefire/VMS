# CONTEXT.md — Volunteer Applied Events

# Người viết: NamLD (Member 2) | Ngày: 2026-06-25

## 1. PROBLEM STATEMENT

Hệ thống VMS cần một màn hình giúp Volunteer xem lại các sự kiện mà mình đã đăng ký tham gia.

Ở feature `003-volunteer-event-application`, Volunteer có thể submit application cho một event hợp lệ. Sau khi application được tạo, Volunteer cần một nơi để theo dõi lại các event đã apply, xem trạng thái đơn đăng ký, biết đơn đang chờ duyệt, đã được duyệt, bị từ chối hoặc đã hủy.

Feature này tập trung vào **Volunteer Applied Events**, bao gồm:

* Hiển thị danh sách các event mà Volunteer đã apply.
* Hiển thị trạng thái application của từng event.
* Hiển thị thông tin tóm tắt của event đã apply.
* Cho Volunteer lọc hoặc xem theo trạng thái application nếu cần.
* Cho Volunteer xem chi tiết event hoặc quay lại Event Detail.
* Cho Volunteer hủy application nếu business rule cho phép.
* Hiển thị loading, empty và error states.

Feature này không xử lý Staff approve/reject application, không xử lý attendance, certificate, feedback, notification, donation hoặc reporting.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Volunteer Event Module.

* **Feature:** Volunteer Applied Events.

* **Related Use Cases:**

  * UC13 — View Applied Events
  * UC14 — Cancel Application, nếu project gom cancel vào Applied Events

* **Connected Use Cases:**

  * UC09 — View Event Detail
  * UC12 — Apply Event
  * Staff Application Review use cases, do Member 3 phụ trách
  * Volunteer Event History, do feature `005-volunteer-event-history` xử lý

* **Related Screens:**

  * Applied Events screen
  * Applied Event item/card
  * Application status display
  * Cancel application confirmation, nếu cancel được chốt trong feature này

* **Related Actors:**

  * Volunteer
  * Staff

* **Volunteer:** Người dùng đã đăng nhập với vai trò Volunteer. Volunteer có thể xem các event mà chính mình đã apply.

* **Guest:** Người dùng chưa đăng nhập. Guest không được xem Applied Events vì đây là dữ liệu cá nhân của Volunteer.

* **Staff:** Người xử lý review application sau khi Volunteer apply. Staff approve/reject application ở module khác, không thuộc feature này.

* **Applied Event:** Một event đã có application được tạo bởi Volunteer hiện tại.

* **Event Application:** Đơn đăng ký tham gia event của Volunteer.

* **Application Status:** Trạng thái của application. Bản đầu đề xuất các trạng thái:

  * `PENDING`
  * `APPROVED`
  * `REJECTED`
  * `CANCELLED`

* **PENDING Application:** Application đã gửi nhưng đang chờ Staff review.

* **APPROVED Application:** Application đã được Staff duyệt.

* **REJECTED Application:** Application bị Staff từ chối.

* **CANCELLED Application:** Application đã bị Volunteer hủy hoặc bị hủy theo rule hệ thống.

* **Cancel Application:** Hành động Volunteer hủy application đã gửi. Trong bản đầu, chỉ nên cho hủy application `PENDING`. Việc hủy application `APPROVED` cần team review vì có thể ảnh hưởng capacity, attendance và Staff workflow.

* **Event History:** Lịch sử event mà Volunteer đã tham gia hoặc hoàn thành. Đây là feature riêng `005-volunteer-event-history`, không phải Applied Events.

---

## 3. STAKEHOLDERS

* **Volunteer:** Cần xem các event đã apply và biết trạng thái application của mình.

* **NamLD / Member 2:** Chịu trách nhiệm chính với luồng Volunteer Applied Events.

* **Member 1 — Authentication + Profile:** Phụ trách login/session và xác định current Volunteer.

* **Member 3 — Staff Module:** Phụ trách review application, approve/reject, event status, event capacity và application workflow.

* **Member 4 — Manager Module:** Phụ trách category, skill, organization. Feature này có thể hiển thị category/organization trong event summary.

* **Member 5 — Admin Module:** Có thể liên quan reporting hoặc notification sau này, nhưng không trực tiếp thuộc feature này.

---

## 4. CONSTRAINTS (Ràng buộc cứng)

* **SDD Workflow:** Feature này phải đi theo thứ tự `context.md` → `spec.md` → `plan.md` → `tasks.md` → implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, route, component, migration hoặc code task.

* **Authentication Required:** Chỉ Volunteer đã đăng nhập mới được xem Applied Events.

* **Guest Boundary:** Guest không được xem danh sách Applied Events.

* **Role Boundary:** User không có role Volunteer không được xem danh sách Applied Events của Volunteer.

* **Privacy Boundary:** Volunteer chỉ được xem application của chính mình, không được xem application của Volunteer khác.

* **Staff Review Boundary:** Feature này không approve hoặc reject application. Approve/reject thuộc Staff Module.

* **Application Creation Boundary:** Feature này không tạo application mới. Tạo application thuộc feature `003-volunteer-event-application`.

* **History Boundary:** Feature này không phải Event History. Các event đã hoàn thành hoặc lịch sử tham gia dài hạn sẽ xử lý ở feature `005-volunteer-event-history`.

* **Cancel Boundary:** Nếu cancel application được đưa vào feature này, bản đầu chỉ nên cho phép hủy application `PENDING`. Hủy application `APPROVED` cần team review.

* **Data Ownership:** Member 2 consume application/event data. Member 3 là owner chính của application review status và event lifecycle.

* **Mock Data:** Có thể dùng mock applied events/application data trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS (Các giả định hiện tại)

* Applied Events yêu cầu user đã đăng nhập.
* Chỉ Volunteer được xem Applied Events.
* Volunteer chỉ xem được application của chính mình.
* Applied Events hiển thị các application đã tạo ở feature `003-volunteer-event-application`.
* Application mới sau khi submit có status `PENDING`.
* Staff có thể chuyển application sang `APPROVED` hoặc `REJECTED`.
* Volunteer có thể thấy trạng thái application mới nhất.
* Bản đầu hỗ trợ các status: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.
* Applied Events cần hiển thị event summary, không cần hiển thị full Event Detail.
* Volunteer có thể click vào applied event để xem Event Detail.
* Nếu application `PENDING`, Volunteer có thể được phép cancel nếu team đồng ý.
* Nếu application `APPROVED`, bản đầu không tự cho cancel để tránh ảnh hưởng Staff/capacity/attendance workflow.
* Nếu application `REJECTED`, Volunteer chỉ xem trạng thái và lý do nếu có.
* Nếu application `CANCELLED`, Volunteer chỉ xem trạng thái đã hủy.
* Feature này có thể có filter theo application status để Volunteer dễ theo dõi.
* Feature này có thể có pagination nếu số lượng application nhiều.
* Nếu Volunteer chưa apply event nào, hệ thống hiển thị empty state.
* Applied Events không xử lý certificate, attendance, feedback hoặc event history.
* Database/API thật cần được thống nhất với Member 3 và backend team sau khi plan/API contract được viết.

---

## 6. OPEN QUESTIONS (Cần team liên quan review sau)

Các câu hỏi dưới đây không blocker để viết `spec.md`/`plan.md`, nhưng cần review trước khi implement thật:

1. **Application status chính thức gồm những gì?**
   Đề xuất bản đầu: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

2. **Applied Events có cần filter theo status không?**
   Đề xuất: Có. Filter theo `ALL`, `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

3. **Applied Events có cần pagination không?**
   Đề xuất: Có nếu số lượng application nhiều. Page size có thể dùng 8 hoặc 10, cần chốt trong plan.

4. **Volunteer có được cancel application không?**
   Đề xuất: Có, nhưng chỉ với application `PENDING`.

5. **Volunteer có được cancel application `APPROVED` không?**
   Cần Member 3 review. Bản đầu nên không cho cancel `APPROVED`.

6. **Nếu cancel application, status chuyển thành gì?**
   Đề xuất: `CANCELLED`.

7. **Nếu Staff reject application, có cần hiển thị reject reason không?**
   Đề xuất: Có nếu dữ liệu có sẵn, nhưng không bắt buộc bản đầu.

8. **Approved application có được tính vào Event History luôn không?**
   Không. Event History nên dựa trên event đã diễn ra/hoàn thành hoặc attendance, thuộc feature `005-volunteer-event-history`.

9. **Applied Events có hiển thị event đã bị cancelled/deleted không?**
   Đề xuất: Vẫn hiển thị application record nếu Volunteer từng apply, nhưng event summary có thể hiển thị unavailable/cancelled state. Cần review với Member 3.

10. **Sau khi cancel application, remaining slots có tăng lại không?**
    Cần Member 3/backend review, vì liên quan capacity rule.

---

## 7. ANSWERS (Đã chốt nghiệp vụ cho bản đầu)

* **A1:** Feature này tương ứng với UC13 — View Applied Events.

* **A2:** Feature này có thể bao gồm cancel application nếu team gom UC14 vào Applied Events.

* **A3:** Chỉ authenticated Volunteer được xem Applied Events.

* **A4:** Guest không được xem Applied Events.

* **A5:** User không phải Volunteer không được xem Applied Events.

* **A6:** Volunteer chỉ xem được application của chính mình.

* **A7:** Applied Events hiển thị các application đã được tạo từ feature `003-volunteer-event-application`.

* **A8:** Application status bản đầu gồm:

  * `PENDING`
  * `APPROVED`
  * `REJECTED`
  * `CANCELLED`

* **A9:** Applied Events cần hiển thị event summary cho từng application.

* **A10:** Event summary trong Applied Events nên gồm:

  * event title
  * event thumbnail nếu có
  * category
  * organization
  * start date/time
  * location
  * event status
  * application status
  * submitted time

* **A11:** Volunteer có thể click vào applied event để xem Event Detail.

* **A12:** Applied Events có thể filter theo application status.

* **A13:** Applied Events nên có pagination nếu số lượng application nhiều.

* **A14:** Nếu Volunteer chưa apply event nào, hệ thống hiển thị empty state.

* **A15:** Nếu dữ liệu đang tải hoặc tải lỗi, hệ thống hiển thị loading/error state.

* **A16:** Cancel application nếu đưa vào feature này thì bản đầu chỉ cho phép với application `PENDING`.

* **A17:** Application `APPROVED` không được cancel trong bản đầu nếu chưa có team review.

* **A18:** Application `REJECTED` không được cancel.

* **A19:** Application `CANCELLED` không được cancel lại.

* **A20:** Cancel application không approve/reject application và không thay thế Staff review.

* **A21:** Feature này không xử lý Event History, Attendance, Certificate hoặc Feedback.

* **A22:** Feature này phụ thuộc Member 1 để xác định current user và role.

* **A23:** Feature này phụ thuộc Member 3 về application status, review result, cancel rule, event summary và capacity behavior.

* **A24:** Feature này có thể dùng mock data qua service layer trong giai đoạn đầu, nhưng mock data không phải source of truth.

* **A25:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau (`plan.md`, `api-contract.md`, `database.md`, `tasks.md`), không định nghĩa trong context.

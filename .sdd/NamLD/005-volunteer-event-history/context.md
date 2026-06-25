# CONTEXT.md — Volunteer Event History

# Người viết: NamLD (Member 2) | Ngày: 2026-06-25

## 1. PROBLEM STATEMENT

Hệ thống VMS cần một màn hình giúp Volunteer xem lại lịch sử các sự kiện tình nguyện mà mình đã tham gia hoặc đã hoàn thành.

Ở feature `004-volunteer-applied-events`, Volunteer có thể xem danh sách các event mà mình đã apply và theo dõi trạng thái application như `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`. Tuy nhiên, Applied Events chưa phải là lịch sử tham gia thật sự. Một Volunteer có thể apply event nhưng chưa được duyệt, bị từ chối, hoặc chưa tham gia event đó.

Feature `005-volunteer-event-history` tập trung vào **lịch sử tham gia của Volunteer**, bao gồm:

* Hiển thị các event mà Volunteer đã tham gia hoặc đã hoàn thành.
* Hiển thị thông tin tóm tắt của event trong quá khứ.
* Hiển thị trạng thái tham gia hoặc kết quả attendance nếu có.
* Hiển thị số giờ tình nguyện hoặc contribution nếu dữ liệu có sẵn.
* Cho Volunteer xem lại Event Detail hoặc history detail nếu cần.
* Có thể hiển thị certificate/feedback entry point nếu dữ liệu có sẵn, nhưng không tạo certificate hoặc xử lý feedback trong feature này.
* Hiển thị loading, empty và error states.

Feature này không xử lý Apply Event, Applied Events hiện tại, Cancel Application, Staff attendance management, certificate generation, feedback submission, notification, donation hoặc reporting.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Volunteer Event Module.

* **Feature:** Volunteer Event History.

* **Related Use Cases:**

  * View Volunteer Event History
  * View participated/completed events
  * View volunteer participation record

* **Connected Use Cases:**

  * UC12 — Apply Event
  * UC13 — View Applied Events
  * Staff Attendance Management use cases, do Member 3 phụ trách
  * Certificate generation use cases, nếu project có, không thuộc feature này
  * Feedback use cases, nếu project có, không thuộc feature này

* **Related Screens:**

  * Volunteer Event History screen
  * History event item/card
  * Participation status display
  * Optional certificate/feedback entry point if available

* **Related Actors:**

  * Volunteer
  * Staff

* **Volunteer:** Người dùng đã đăng nhập với vai trò Volunteer. Volunteer có thể xem lịch sử event mà chính mình đã tham gia/hoàn thành.

* **Guest:** Người dùng chưa đăng nhập. Guest không được xem Event History vì đây là dữ liệu cá nhân của Volunteer.

* **Staff:** Người quản lý event, attendance và xác nhận Volunteer có tham gia event hay không. Staff-side attendance hoặc completion management không thuộc feature này.

* **Event History:** Danh sách các event trong quá khứ mà Volunteer đã thực sự tham gia hoặc được ghi nhận là đã hoàn thành.

* **Applied Events:** Danh sách các application mà Volunteer đã gửi. Applied Events khác Event History. Một event chỉ nên vào History khi có cơ sở cho thấy Volunteer đã tham gia, ví dụ application `APPROVED` và event đã diễn ra/hoàn thành, hoặc attendance được Staff xác nhận.

* **Attendance:** Dữ liệu xác nhận Volunteer có tham gia event hay không. Attendance thường do Staff quản lý. Feature này chỉ consume attendance/completion data nếu có.

* **Participation Status:** Trạng thái tham gia của Volunteer trong một event. Bản đầu có thể dùng các trạng thái đơn giản như:

  * `ATTENDED`
  * `ABSENT`
  * `COMPLETED`
  * `NOT_RECORDED`

* **Volunteer Hours:** Số giờ tình nguyện được ghi nhận từ event. Có thể tính từ thời lượng event hoặc do Staff xác nhận. Đây là dữ liệu hữu ích nhưng cần review với Staff Module.

* **Certificate:** Chứng nhận tham gia event. Feature này có thể hiển thị certificate status hoặc link nếu đã có, nhưng không tạo certificate.

* **Feedback:** Đánh giá hoặc phản hồi sau event. Feature này không xử lý submit feedback trong bản đầu, nhưng có thể hiển thị entry point nếu feature khác cung cấp.

---

## 3. STAKEHOLDERS

* **Volunteer:** Cần xem lại các event đã tham gia, theo dõi thành tích, số giờ tình nguyện và chứng nhận nếu có.

* **NamLD / Member 2:** Chịu trách nhiệm chính với luồng Volunteer Event History.

* **Member 1 — Authentication + Profile:** Phụ trách login/session và xác định current Volunteer.

* **Member 3 — Staff Module:** Phụ trách event lifecycle, attendance, completion status và xác nhận Volunteer tham gia event.

* **Member 4 — Manager Module:** Phụ trách category, skill, organization. Feature này có thể hiển thị category/organization trong event history summary.

* **Member 5 — Admin Module:** Có thể liên quan đến certificate, reporting hoặc dashboard sau này, nhưng không trực tiếp thuộc bản đầu của Event History.

---

## 4. CONSTRAINTS (Ràng buộc cứng)

* **SDD Workflow:** Feature này phải đi theo thứ tự `context.md` → `spec.md` → `plan.md` → `tasks.md` → implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, route, component, migration hoặc code task.

* **Authentication Required:** Chỉ Volunteer đã đăng nhập mới được xem Event History.

* **Guest Boundary:** Guest không được xem Event History.

* **Role Boundary:** User không có role Volunteer không được xem Event History của Volunteer.

* **Privacy Boundary:** Volunteer chỉ được xem lịch sử tham gia của chính mình, không được xem lịch sử của Volunteer khác.

* **Scope Boundary:** Event History không phải Applied Events. Feature này không hiển thị toàn bộ application hiện tại như `PENDING`, `REJECTED`, `CANCELLED` nếu chúng không phải lịch sử tham gia thật sự.

* **Apply Boundary:** Feature này không tạo application mới. Apply Event thuộc feature `003-volunteer-event-application`.

* **Cancel Boundary:** Feature này không cancel application. Cancel thuộc feature `004-volunteer-applied-events` nếu được team chốt.

* **Attendance Boundary:** Feature này không quản lý attendance. Attendance do Staff Module xử lý. Feature này chỉ đọc/hiển thị attendance/completion result nếu có.

* **Certificate Boundary:** Feature này không generate certificate. Nếu certificate đã có, feature này chỉ có thể hiển thị trạng thái hoặc link.

* **Feedback Boundary:** Feature này không submit feedback trong bản đầu. Feedback có thể là feature riêng hoặc extension sau.

* **Reporting Boundary:** Feature này không làm dashboard/reporting cho Admin/Manager.

* **Mock Data:** Có thể dùng mock event history data trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS (Các giả định hiện tại)

* Event History yêu cầu user đã đăng nhập.
* Chỉ Volunteer được xem Event History.
* Volunteer chỉ xem được lịch sử của chính mình.
* Event History lấy dữ liệu từ application đã approved và/hoặc attendance/completion record.
* Một event chỉ nên xuất hiện trong Event History khi event đã diễn ra hoặc đã hoàn thành.
* Event `PENDING` application không thuộc Event History.
* Event `REJECTED` application không thuộc Event History.
* Event `CANCELLED` application không thuộc Event History.
* Event đã được Staff xác nhận Volunteer tham gia thì có thể xuất hiện trong Event History.
* Nếu attendance chưa được ghi nhận, event có thể hiển thị trạng thái `NOT_RECORDED` hoặc chưa xuất hiện, cần team review.
* Event History cần hiển thị event summary, không cần hiển thị full Event Detail.
* Volunteer có thể click vào history item để xem lại Event Detail hoặc một detail view nếu có.
* Nếu Event Detail public không còn khả dụng, Event History vẫn nên giữ record lịch sử nếu dữ liệu history tồn tại.
* Event History có thể hiển thị volunteer hours nếu dữ liệu có sẵn.
* Event History có thể hiển thị participation status nếu dữ liệu có sẵn.
* Event History có thể hỗ trợ filter theo participation status hoặc thời gian.
* Event History có thể hỗ trợ pagination nếu số lượng history records nhiều.
* Certificate generation không thuộc feature này.
* Feedback submission không thuộc feature này.
* Database/API thật cần được thống nhất với Member 3 và backend team sau khi plan/API contract được viết.

---

## 6. OPEN QUESTIONS (Cần team liên quan review sau)

Các câu hỏi dưới đây không blocker để viết `spec.md`/`plan.md`, nhưng cần review trước khi implement thật:

1. **Điều kiện nào để event xuất hiện trong Event History?**
   Đề xuất: application `APPROVED` và event đã hoàn thành, hoặc Staff đã ghi nhận attendance/completion.

2. **Nếu Volunteer được approve nhưng không tham gia, event có hiện trong History không?**
   Đề xuất: Có thể hiện nếu có attendance record, nhưng status là `ABSENT`. Cần Member 3 review.

3. **Nếu attendance chưa được ghi nhận, event có hiện trong History không?**
   Đề xuất: Có thể hiển thị `NOT_RECORDED` hoặc tạm ẩn cho đến khi Staff ghi nhận. Cần chốt.

4. **Participation status chính thức gồm những gì?**
   Đề xuất bản đầu: `ATTENDED`, `ABSENT`, `COMPLETED`, `NOT_RECORDED`.

5. **Volunteer hours được tính như nào?**
   Theo duration event, theo attendance thực tế, hay Staff nhập thủ công? Cần Member 3 review.

6. **Certificate có hiển thị trong Event History không?**
   Đề xuất: Chỉ hiển thị certificate status/link nếu certificate đã có. Không generate certificate trong feature này.

7. **Feedback có thuộc Event History không?**
   Đề xuất: Không submit feedback trong feature này. Có thể hiển thị entry point nếu feedback feature riêng tồn tại.

8. **Event đã bị deleted/archived sau khi Volunteer tham gia có còn hiện trong History không?**
   Đề xuất: Có, vì đây là record lịch sử của Volunteer. Event summary có thể hiển thị unavailable/archived nếu cần.

9. **Event History có cần filter theo năm/tháng/status không?**
   Đề xuất: Có thể filter theo participation status và time range trong bản mở rộng; bản đầu có thể filter đơn giản.

10. **Event History có cần sort mặc định theo gì?**
    Đề xuất: sort theo event date mới nhất trước hoặc completedAt mới nhất trước.

11. **Event History có cần tổng số giờ tình nguyện không?**
    Đề xuất: Có thể hiển thị nếu dữ liệu có sẵn, nhưng không bắt buộc bản đầu.

---

## 7. ANSWERS (Đã chốt nghiệp vụ cho bản đầu)

* **A1:** Feature này là Volunteer Event History, dùng để xem lịch sử event đã tham gia/hoàn thành.

* **A2:** Feature này khác với `004-volunteer-applied-events`.

* **A3:** Applied Events hiển thị application và trạng thái đơn đăng ký.

* **A4:** Event History hiển thị lịch sử tham gia thật sự hoặc completion/attendance record.

* **A5:** Chỉ authenticated Volunteer được xem Event History.

* **A6:** Guest không được xem Event History.

* **A7:** User không phải Volunteer không được xem Event History.

* **A8:** Volunteer chỉ xem được history của chính mình.

* **A9:** Event History không tạo application mới.

* **A10:** Event History không cancel application.

* **A11:** Event History không approve/reject application.

* **A12:** Event History không quản lý attendance, chỉ đọc attendance/completion result nếu có.

* **A13:** Event History không generate certificate.

* **A14:** Event History không submit feedback trong bản đầu.

* **A15:** Event History nên hiển thị event summary cho từng history item.

* **A16:** Event summary trong History nên gồm:

  * event title
  * event thumbnail nếu có
  * category
  * organization
  * event date/time
  * location
  * event status
  * participation status
  * volunteer hours nếu có
  * certificate status nếu có

* **A17:** Event History nên hỗ trợ empty state nếu Volunteer chưa có history.

* **A18:** Event History nên hỗ trợ loading/error state.

* **A19:** Event History có thể có filter theo participation status hoặc time, nếu plan chốt cần.

* **A20:** Event History nên có pagination nếu số lượng records nhiều.

* **A21:** Event bị archived/deleted sau khi Volunteer đã tham gia vẫn có thể xuất hiện trong History nếu history record còn tồn tại.

* **A22:** Feature này phụ thuộc Member 1 để xác định current user và role.

* **A23:** Feature này phụ thuộc Member 3 về attendance/completion, event lifecycle, volunteer hours và certificate status nếu có.

* **A24:** Feature này có thể dùng mock data qua service layer trong giai đoạn đầu, nhưng mock data không phải source of truth.

* **A25:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau (`plan.md`, `api-contract.md`, `database.md`, `tasks.md`), không định nghĩa trong context.
# CONTEXT.md — Volunteer Event Application

# Người viết: NamLD (Member 2) | Ngày: 2026-06-25

## 1. PROBLEM STATEMENT

Hệ thống VMS cần một luồng cho phép Volunteer đăng ký tham gia một sự kiện tình nguyện sau khi đã xem thông tin chi tiết của event.

Ở feature `001-volunteer-event-discovery`, Guest và Volunteer có thể xem danh sách event public. Ở feature `002-volunteer-event-detail`, Guest và Volunteer có thể xem chi tiết event public/discoverable. Tuy nhiên, để Volunteer thật sự tham gia event, hệ thống cần một bước đăng ký chính thức.

Feature này tập trung vào **Apply Event flow**, bao gồm:

* Kiểm tra người dùng có phải Volunteer đã đăng nhập hay không.
* Kiểm tra event có còn cho phép apply hay không.
* Hiển thị thông tin tóm tắt của event trước khi apply.
* Cho Volunteer nhập thông tin đăng ký nếu cần.
* Cho Volunteer xác nhận gửi application.
* Tạo application ở trạng thái ban đầu để Staff xử lý sau.
* Hiển thị kết quả apply thành công hoặc lỗi phù hợp.

Feature này không xử lý approve/reject application, không xử lý cancel application, không xử lý danh sách event đã apply, không xử lý attendance, certificate, feedback, notification hoặc reporting.

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
  * UC13 — View Applied Events
  * UC14 — Cancel Application / Manage Applied Event, nếu project có
  * Staff Application Review use cases, do Member 3 phụ trách

* **Related Screens:**

  * Apply Event screen / Apply Event form
  * Event Detail screen, vì Apply bắt đầu từ Event Detail

* **Related Actors:**

  * Guest
  * Volunteer
  * Staff

* **Guest:** Người dùng chưa đăng nhập. Guest có thể xem Event Detail của event public, nhưng không được submit application. Nếu Guest muốn apply, hệ thống cần yêu cầu đăng nhập hoặc điều hướng sang Authentication flow.

* **Volunteer:** Người dùng đã đăng nhập với vai trò Volunteer. Volunteer có thể apply event nếu event đủ điều kiện.

* **Staff:** Người quản lý hoặc xử lý application sau khi Volunteer gửi. Staff approve/reject application ở module khác, không thuộc feature này.

* **Event Application:** Đơn đăng ký tham gia event của Volunteer. Application được tạo khi Volunteer gửi yêu cầu tham gia event thành công.

* **Application Status:** Trạng thái của application. Trong feature này, application mới gửi nên bắt đầu ở trạng thái `PENDING`, để Staff review sau.

* **Eligible Event:** Event đủ điều kiện cho Volunteer apply. Theo các feature trước, event phù hợp để apply là event `OPEN`.

* **Not Applyable Event:** Event không cho apply, ví dụ `FULL`, `ONGOING`, `CLOSED`, `DRAFT`, `COMPLETED`, `CANCELLED`, `ARCHIVED`, `DELETED`.

* **Duplicate Application:** Trường hợp một Volunteer cố gắng apply cùng một event nhiều lần. Hệ thống cần chặn duplicate application để tránh gửi nhiều đơn cho cùng một event.

* **Remaining Slots:** Số slot còn lại của event, thường được tính bằng `capacity - registeredCount`. Nếu event không còn slot, Volunteer không được apply.

---

## 3. STAKEHOLDERS

* **Volunteer:** Cần đăng ký tham gia event một cách rõ ràng, biết application đã gửi thành công hay chưa.

* **Guest:** Có thể quan tâm event nhưng cần đăng nhập trước khi apply.

* **NamLD / Member 2:** Chịu trách nhiệm chính với luồng Volunteer apply event.

* **Member 1 — Authentication + Profile:** Phụ trách login/register và user profile. Feature này cần phân biệt Guest và Volunteer.

* **Member 3 — Staff Module:** Phụ trách event data, event status, capacity, application review, approve/reject application.

* **Member 4 — Manager Module:** Phụ trách category, skill, organization. Feature này chỉ consume dữ liệu event có liên quan.

* **Member 5 — Admin Module:** Có thể liên quan đến notification/reporting sau này, nhưng không trực tiếp thuộc feature Apply Event.

---

## 4. CONSTRAINTS (Ràng buộc cứng)

* **SDD Workflow:** Feature này phải đi theo thứ tự `context.md` → `spec.md` → `plan.md` → `tasks.md` → implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, route, component, migration hoặc code task.

* **Authentication Required:** Chỉ Volunteer đã đăng nhập mới được submit application.

* **Guest Boundary:** Guest không được submit application. Guest phải đăng nhập hoặc đăng ký trước.

* **Role Boundary:** User không có role Volunteer không được submit application trong luồng này.

* **Event Status Boundary:** Chỉ event `OPEN` mới cho phép apply.

* **Hidden/Blocked Event Boundary:** Event `FULL`, `ONGOING`, `CLOSED`, `DRAFT`, `COMPLETED`, `CANCELLED`, `ARCHIVED`, `DELETED` không cho apply.

* **Duplicate Boundary:** Một Volunteer không được apply cùng một event nhiều lần nếu đã có application active/pending/approved.

* **Capacity Boundary:** Volunteer không được apply nếu event không còn slot.

* **Application Review Boundary:** Feature này chỉ tạo application ban đầu. Approve/reject application thuộc Staff Module, không thuộc feature này.

* **Cancel Boundary:** Cancel application không thuộc feature này. Cancel sẽ được xử lý ở feature Applied Events hoặc feature riêng.

* **Notification Boundary:** Gửi notification sau khi apply không thuộc scope bắt buộc của feature này.

* **Mock Data:** Có thể dùng mock event/application data trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS (Các giả định hiện tại)

* Apply Event bắt đầu từ Event Detail.
* Guest bấm Apply sẽ được yêu cầu đăng nhập hoặc chuyển sang Authentication flow.
* Volunteer đã đăng nhập có thể mở Apply Event flow.
* Event phải có trạng thái `OPEN` thì mới được apply.
* Event `FULL` không được apply.
* Event `ONGOING` không được apply.
* Event `CLOSED` không được apply.
* Event `DRAFT`, `COMPLETED`, `CANCELLED`, `ARCHIVED`, `DELETED` không được apply.
* Application sau khi gửi thành công sẽ có trạng thái ban đầu là `PENDING`.
* Staff sẽ review application sau, không xử lý trong feature này.
* Volunteer không được gửi duplicate application cho cùng một event.
* Nếu Volunteer đã apply event rồi, hệ thống cần hiển thị thông báo phù hợp thay vì cho gửi lại.
* Nếu event hết slot trong lúc user đang apply, hệ thống cần chặn submit và hiển thị lỗi phù hợp.
* Apply form có thể yêu cầu Volunteer nhập motivation/message ngắn.
* Apply form có thể hiển thị thông tin tóm tắt event để Volunteer xác nhận trước khi gửi.
* User profile có thể cung cấp sẵn name/email/phone nếu cần, nhưng feature này không chỉnh sửa profile.
* Applied Events feature sẽ dùng application đã tạo để hiển thị danh sách event Volunteer đã apply.
* Database/API thật cần được thống nhất với Member 3 và backend team sau khi plan/API contract được viết.

---

## 6. OPEN QUESTIONS (Cần team liên quan review sau)

Các câu hỏi dưới đây không blocker để viết `spec.md`/`plan.md`, nhưng cần review trước khi implement thật:

1. **Apply form cần những trường nào?**
   Đề xuất bản đầu chỉ cần `motivation` hoặc `messageToOrganizer`. Có thể thêm phone/contact nếu team yêu cầu.

2. **Application status chính thức gồm những gì?**
   Đề xuất tối thiểu: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

3. **Application mới gửi sẽ là `PENDING` hay tự động `APPROVED`?**
   Đề xuất: `PENDING`, vì Staff cần review.

4. **Registered count tính khi nào?**
   Tính khi application `PENDING`, `APPROVED`, hay chỉ `APPROVED`? Cần Member 3 chốt.

5. **Duplicate application chặn theo status nào?**
   Đề xuất: nếu Volunteer đã có application `PENDING` hoặc `APPROVED` cho event đó thì không được apply lại.

6. **Nếu application bị `REJECTED`, Volunteer có được apply lại không?**
   Cần team chốt. Bản đầu có thể không cho apply lại để đơn giản, hoặc cho apply lại nếu business muốn.

7. **Nếu application bị `CANCELLED`, Volunteer có được apply lại không?**
   Cần chốt với feature Applied Events / Cancel Application.

8. **Guest sau login xong có quay lại Apply Event không?**
   Đề xuất nên có redirect back về event detail/apply flow, nhưng phụ thuộc Member 1.

9. **Có cần upload file/certificate khi apply không?**
   Bản đầu không cần. Nếu có sẽ là enhancement.

10. **Có cần gửi notification cho Staff sau khi apply không?**
    Không bắt buộc trong feature này. Notification có thể là feature/module riêng.

---

## 7. ANSWERS (Đã chốt nghiệp vụ cho bản đầu)

* **A1:** Feature này tương ứng với UC12 — Apply Event.

* **A2:** Chỉ Volunteer đã đăng nhập mới được submit application.

* **A3:** Guest không được submit application.

* **A4:** Guest bấm Apply cần được yêu cầu đăng nhập hoặc điều hướng sang Authentication flow.

* **A5:** Chỉ event `OPEN` mới cho phép apply.

* **A6:** Event `FULL` không cho apply.

* **A7:** Event `ONGOING` không cho apply.

* **A8:** Event `CLOSED` không cho apply.

* **A9:** Event `DRAFT`, `COMPLETED`, `CANCELLED`, `ARCHIVED`, `DELETED` không cho apply.

* **A10:** Application mới gửi thành công sẽ có trạng thái ban đầu là `PENDING`.

* **A11:** Staff approve/reject application ở module khác, không thuộc feature này.

* **A12:** Volunteer không được apply cùng một event nhiều lần nếu đã có application đang active như `PENDING` hoặc `APPROVED`.

* **A13:** Nếu event hết slot hoặc không còn apply được, hệ thống phải chặn submit và hiển thị lỗi phù hợp.

* **A14:** Apply form bản đầu nên có trường motivation/message ngắn để Volunteer nói lý do muốn tham gia.

* **A15:** Apply form cần hiển thị event summary để Volunteer xác nhận đúng event trước khi gửi.

* **A16:** Sau khi apply thành công, hệ thống nên hiển thị success state và có thể cho user đi tới Applied Events hoặc quay lại Event Detail.

* **A17:** Feature này không xử lý cancel application.

* **A18:** Feature này không xử lý list applied events.

* **A19:** Feature này không xử lý approve/reject application.

* **A20:** Feature này không xử lý attendance, feedback, certificate, notification, donation/payment hoặc reporting.

* **A21:** Feature này phụ thuộc Member 1 để xác định trạng thái đăng nhập và điều hướng Guest sang auth flow.

* **A22:** Feature này phụ thuộc Member 3 về event status, capacity, remaining slots và application review status.

* **A23:** Feature này có thể dùng mock data qua service layer trong giai đoạn đầu, nhưng mock data không phải source of truth.

* **A24:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau (`plan.md`, `api-contract.md`, `database.md`, `tasks.md`), không định nghĩa trong context.

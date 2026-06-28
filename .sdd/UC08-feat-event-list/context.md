# CONTEXT.md — View Event List (UC08)

# Người viết: NamLD (Member 2) | Ngày: 2026-06-27

## 1. PROBLEM STATEMENT

Volunteer Event Management System cần một màn hình cho phép Guest và Volunteer xem danh sách các sự kiện tình nguyện công khai.

Đây là use case đầu tiên trong nhóm Volunteer Event của Member 2. Người dùng cần xem được danh sách event trước khi thực hiện các bước tiếp theo như xem chi tiết event, tìm kiếm event, lọc event hoặc đăng ký tham gia event.

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

Trong file này, phạm vi chỉ tập trung vào **UC08 — View Event List**.

UC08 cần đảm bảo:

* Guest có thể xem danh sách event công khai.
* Volunteer có thể xem danh sách event công khai.
* Mỗi event trong danh sách hiển thị thông tin tóm tắt đủ để người dùng quyết định có xem chi tiết hay không.
* Người dùng có thể bấm vào một event để đi sang UC09 — View Event Detail.
* Hệ thống không hiển thị event nội bộ, event đã bị xóa mềm hoặc event không còn phù hợp để public.
* Hệ thống có loading state, empty state, error state và fallback khi event thiếu ảnh.

Lưu ý quan trọng:

UC08 — View Event List, UC10 — Search Event và UC11 — Filter Event được viết thành các folder context/spec riêng theo format team. Tuy nhiên, khi implementation, ba use case này phải được code chung trong cùng một màn hình Event List. Search và Filter là chức năng nằm bên trong Event List, không phải ba màn hình tách rời.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Volunteer Event.

* **Use Case:** UC08 — View Event List.

* **Feature Folder:** `UC08-feat-event-list`.

* **Related UC trong cùng màn Event List:**

  * UC10 — Search Event
  * UC11 — Filter Event

* **Connected UC trong phần Member 2:**

  * UC09 — View Event Detail
  * UC12 — Apply Event
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
  * UC31 — View Category List
  * UC34 — View Skill List
  * UC37 — View Organization List

* **Guest:** Guest không phải role được lưu trong database. Guest là trạng thái người dùng chưa đăng nhập. Guest được xem event list công khai nhưng không được apply event.

* **Volunteer:** Volunteer là user đã đăng nhập với role `VOLUNTEER`. Volunteer có thể xem event list, xem event detail và tiếp tục sang apply event nếu đủ điều kiện.

* **Staff:** Staff là user có role `STAFF`, phụ trách tạo, sửa, xóa event ở module của Member 3. UC08 chỉ hiển thị event do Staff quản lý, không tạo hoặc sửa event.

* **Event List:** Màn hình hiển thị danh sách các event công khai hoặc discoverable cho Guest và Volunteer.

* **Event Card / Event Item:** Khối UI hiển thị thông tin tóm tắt của một event trong danh sách.

* **Public Event:** Event được phép hiển thị công khai cho Guest và Volunteer.

* **Event Detail Entry Point:** Hành động View Detail trên event card để điều hướng sang UC09 — View Event Detail.

* **Search Event:** Chức năng tìm kiếm event bằng keyword. Search thuộc UC10 nhưng sẽ nằm chung màn với UC08.

* **Filter Event:** Chức năng lọc event theo category, skill, organization, location, time hoặc availability/status. Filter thuộc UC11 nhưng sẽ nằm chung màn với UC08.

* **Category/Skill Data:** Dữ liệu do Member 4 quản lý, được UC08/UC10/UC11 sử dụng để hiển thị hoặc filter event.

* **Organization Data:** Dữ liệu do Member 5 quản lý, được UC08/UC10/UC11 sử dụng để hiển thị hoặc filter event.

---

## 3. STAKEHOLDERS

* **Guest:** Cần xem danh sách event công khai trước khi quyết định đăng ký tài khoản hoặc đăng nhập.

* **Volunteer:** Cần xem danh sách event để tìm cơ hội tham gia phù hợp.

* **NamLD / Member 2:** Chịu trách nhiệm chính với UC08 — View Event List.

* **Member 1 — Authentication + Profile + Email Services:** Phụ trách Login/Register, Profile, Volunteer History và Email Services. UC08 không yêu cầu đăng nhập, nhưng có liên quan khi Guest muốn apply ở bước sau.

* **Member 3 — Event & Application Management:** Phụ trách Add/Edit/Delete Event và Application Management. UC08 phụ thuộc vào event data do Member 3 tạo/quản lý.

* **Member 4 — Admin & Manager Management:** Phụ trách User Management, Category Management và Skill Management. UC08 có thể hiển thị category/skill liên quan đến event nhưng không quản lý dữ liệu này.

* **Member 5 — Organization + Notification + Dashboard + Payment:** Phụ trách Organization Management, Notification, Dashboard, Reports và Payment. UC08 có thể hiển thị organization của event nhưng không quản lý organization.

---

## 4. CONSTRAINTS

* **SDD Workflow:** Use case này phải được viết theo thứ tự `context.md` → `spec.md` trước khi sang plan/tasks/implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, frontend component chi tiết, backend route, migration hoặc code.

* **Public Access:** Guest và Volunteer đều có thể xem Event List nếu event là public/discoverable.

* **Guest Boundary:** Guest chỉ được xem danh sách event và đi sang Event Detail. Guest không được apply trực tiếp từ UC08.

* **Volunteer Boundary:** Volunteer có thể xem danh sách event và đi sang Event Detail. Apply Event thuộc UC12.

* **Shared Screen Boundary:** UC08, UC10 và UC11 phải được hiểu là các use case riêng nhưng cùng implement trên một màn Event List.

* **Codex Implementation Boundary:** Khi sinh code, Codex không được tạo 3 page riêng cho UC08, UC10 và UC11. Ba UC này phải dùng chung Event List page, shared event list service, shared event card, search bar và filter panel.

* **Search Boundary:** UC08 không mô tả chi tiết search logic. Search Event thuộc UC10, nhưng UI search nằm chung Event List page.

* **Filter Boundary:** UC08 không mô tả chi tiết filter logic. Filter Event thuộc UC11, nhưng UI filter nằm chung Event List page.

* **Event Detail Boundary:** UC08 không hiển thị full event detail. Full detail thuộc UC09.

* **Apply Boundary:** UC08 không submit application. Apply Event thuộc UC12.

* **Applied Events Boundary:** UC08 không hiển thị danh sách event đã apply. Applied Events thuộc UC13.

* **Cancel Boundary:** UC08 không cancel application. Cancel Application thuộc UC14.

* **Feedback Boundary:** UC08 không submit feedback. Submit Feedback thuộc UC48.

* **Certificate Boundary:** UC08 không xem hoặc download certificate. Certificate thuộc UC51 và UC52.

* **Volunteer History Boundary:** UC08 không xử lý Volunteer History. UC21 thuộc Member 1.

* **Home Page Boundary:** UC08 không xử lý Home Page. UC02 thuộc Member 1.

* **Staff Management Boundary:** UC08 không tạo, sửa, xóa event. Add/Edit/Delete Event thuộc Member 3.

* **Category/Skill Boundary:** UC08 không tạo, sửa category hoặc skill. Category/Skill Management thuộc Member 4.

* **Organization Boundary:** UC08 không tạo, sửa organization. Organization Management thuộc Member 5.

* **Soft Delete Boundary:** Event đã soft delete không được hiển thị trong Event List.

* **Visibility Boundary:** Event ở trạng thái draft, archived, deleted, cancelled hoặc completed không nên hiển thị trong public Event List bản đầu.

* **Mock Data:** Có thể dùng mock event data trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS

* Guest là trạng thái chưa đăng nhập, không phải role lưu trong database.
* Role trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.
* Guest có thể xem public Event List.
* Volunteer có thể xem public Event List.
* UC08 là use case hiển thị danh sách event công khai.
* UC10 Search Event và UC11 Filter Event sẽ được viết spec riêng nhưng implement chung với UC08 trên một Event List page.
* Event List là entry point chính để người dùng đi sang UC09 — View Event Detail.
* Event card không submit Apply Event trực tiếp trong bản đầu.
* Apply Event sẽ bắt đầu sau khi người dùng xem Event Detail.
* Event List chỉ hiển thị thông tin tóm tắt, không hiển thị full detail.
* Event List chỉ hiển thị event public/discoverable.
* Event draft không hiển thị.
* Event soft-deleted không hiển thị.
* Event archived không hiển thị trong bản đầu.
* Event cancelled không hiển thị trong bản đầu.
* Event completed không hiển thị trong bản đầu.
* Event full có thể hiển thị nếu còn public, nhưng phải thể hiện là không còn slot hoặc không thể apply.
* Event đã qua application deadline có thể bị ẩn hoặc hiển thị là không thể apply tùy rule cuối cùng, nhưng Apply Event phải chặn apply sau deadline.
* Event card nên hiển thị title, category, organization, date/time, location, thumbnail và availability nếu có dữ liệu.
* Nếu event không có image/thumbnail, UI cần có fallback.
* Nếu không có event nào, UI cần hiển thị empty state.
* Nếu tải danh sách event thất bại, UI cần hiển thị error state.
* Event List nên có pagination hoặc loading strategy nếu số lượng event nhiều.
* Database/API thật cần được thống nhất sau khi spec/plan/api-contract được viết.

---

## 6. OPEN QUESTIONS

### Q1. UC08 có bao gồm Search và Filter không?

**Answer:** Không trực tiếp. UC08 chỉ là View Event List. Tuy nhiên UC10 Search Event và UC11 Filter Event sẽ được implement chung trên cùng Event List page.

---

### Q2. Có cần tạo 3 màn hình riêng cho UC08, UC10, UC11 không?

**Answer:** Không. Ba UC này tách docs để rõ use case, nhưng khi code phải dùng chung một màn Event List. Search bar và filter panel là một phần của Event List screen.

---

### Q3. Guest có xem được Event List không?

**Answer:** Có. Guest được xem danh sách event công khai.

---

### Q4. Guest có được apply event từ Event List không?

**Answer:** Không. Guest chỉ được xem event list và event detail. Nếu muốn apply thì cần login/register ở Apply Event flow.

---

### Q5. Volunteer có được apply trực tiếp từ Event List không?

**Answer:** Không trong bản đầu. Event List nên có View Detail action. Apply Event thuộc UC12 và nên bắt đầu sau khi user xem Event Detail.

---

### Q6. Event List cần hiển thị những field nào?

**Answer:** Bản đầu nên hiển thị:

* event title;
* thumbnail/image nếu có;
* category;
* organization;
* date/time;
* location;
* status hoặc availability;
* capacity/remaining slots nếu có;
* View Detail action.

---

### Q7. Có hiển thị event draft không?

**Answer:** Không. Event draft là dữ liệu nội bộ, không hiển thị public Event List.

---

### Q8. Có hiển thị event soft-deleted không?

**Answer:** Không. Event soft-deleted không được hiển thị.

---

### Q9. Có hiển thị event cancelled/archived/completed không?

**Answer:** Không trong bản đầu của public Event List.

---

### Q10. Event full có hiển thị không?

**Answer:** Có thể hiển thị nếu event vẫn public, nhưng phải thể hiện rõ là full hoặc không còn apply được.

---

### Q11. Event List có cần pagination không?

**Answer:** Có. Nên có pagination hoặc loading strategy để tránh tải quá nhiều event cùng lúc.

---

### Q12. Category, Skill, Organization trong Event List lấy từ đâu?

**Answer:** Category và Skill phụ thuộc Member 4. Organization phụ thuộc Member 5. UC08 chỉ consume dữ liệu để hiển thị.

---

### Q13. UC08 có quản lý event không?

**Answer:** Không. Add/Edit/Delete Event thuộc Member 3.

---

### Q14. UC08 có liên quan Volunteer History không?

**Answer:** Không. UC21 View Volunteer History thuộc Member 1 theo assignment mới.

---

## 7. ANSWERS / ANSWERS TO OPEN QUESTIONS

* **A1:** UC08 — View Event List thuộc Member 2 / Volunteer Event.

* **A2:** UC08 chỉ tập trung vào hiển thị danh sách event công khai.

* **A3:** UC10 Search Event và UC11 Filter Event là use case riêng nhưng phải implement chung với UC08 trong cùng Event List page.

* **A4:** Không tạo 3 màn hình rời rạc cho UC08, UC10 và UC11.

* **A5:** Guest được xem Event List công khai.

* **A6:** Volunteer được xem Event List công khai.

* **A7:** Guest không phải role lưu trong database.

* **A8:** Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **A9:** Guest không được apply event trong UC08.

* **A10:** Volunteer không submit application trong UC08.

* **A11:** Apply Event thuộc UC12.

* **A12:** Event Detail thuộc UC09.

* **A13:** Event card trong UC08 nên có View Detail action.

* **A14:** Event card không nên có submit application trực tiếp trong bản đầu.

* **A15:** Event List chỉ hiển thị event public/discoverable.

* **A16:** Event draft không hiển thị trong Event List.

* **A17:** Event soft-deleted không hiển thị trong Event List.

* **A18:** Event archived, cancelled và completed không hiển thị trong Event List bản đầu.

* **A19:** Event full có thể hiển thị nếu còn public nhưng cần hiển thị rõ trạng thái full.

* **A20:** Event đã qua deadline apply không được apply; việc ẩn hay hiển thị dưới dạng not applyable sẽ chốt trong spec/plan.

* **A21:** Event card nên hiển thị title, thumbnail, category, organization, date/time, location, availability và View Detail action.

* **A22:** Event List cần loading state.

* **A23:** Event List cần empty state.

* **A24:** Event List cần error state.

* **A25:** Event List cần image fallback.

* **A26:** Event List nên có pagination hoặc loading strategy.

* **A27:** Category/Skill data thuộc Member 4, UC08 chỉ consume.

* **A28:** Organization data thuộc Member 5, UC08 chỉ consume.

* **A29:** Event data thuộc Staff/Event Management của Member 3, UC08 chỉ consume event public data.

* **A30:** UC08 không xử lý Volunteer History vì UC21 thuộc Member 1.

* **A31:** UC08 không xử lý Home Page vì UC02 thuộc Member 1.

* **A32:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau, không định nghĩa trong context.

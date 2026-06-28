# CONTEXT.md — Search Event (UC10)

# Người viết: NamLD (Member 2) | Ngày: 2026-06-27

## 1. PROBLEM STATEMENT

Volunteer Event Management System cần chức năng cho phép Guest và Volunteer tìm kiếm sự kiện tình nguyện theo từ khóa.

Ở UC08 — View Event List, người dùng có thể xem danh sách event công khai. Tuy nhiên, nếu số lượng event nhiều, người dùng sẽ khó tìm được event phù hợp nếu chỉ xem danh sách mặc định. Vì vậy, hệ thống cần hỗ trợ tìm kiếm event theo keyword để người dùng nhanh chóng tìm thấy event theo tên, địa điểm, tổ chức, category hoặc skill liên quan.

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

Trong file này, phạm vi chỉ tập trung vào **UC10 — Search Event**.

UC10 cần đảm bảo:

* Guest có thể search các event công khai.
* Volunteer có thể search các event công khai.
* Search hoạt động trên cùng màn Event List của UC08.
* Người dùng nhập keyword để tìm event phù hợp.
* Kết quả search chỉ hiển thị event public/discoverable.
* Kết quả search không hiển thị event draft, soft-deleted, archived, cancelled hoặc completed trong bản đầu.
* Người dùng có thể bấm event trong kết quả search để đi sang UC09 — View Event Detail.
* Hệ thống có loading state, empty state và error state khi search.

Lưu ý quan trọng:

UC08 — View Event List, UC10 — Search Event và UC11 — Filter Event được viết thành các folder context/spec riêng theo format team. Tuy nhiên, khi implementation, ba use case này phải được code chung trong cùng một màn hình Event List. Search bar là một phần của Event List page, không phải một màn hình riêng.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Volunteer Event.

* **Use Case:** UC10 — Search Event.

* **Feature Folder:** `UC10-feat-event-search`.

* **Related UC trong cùng màn Event List:**

  * UC08 — View Event List
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

* **Guest:** Guest không phải role được lưu trong database. Guest là trạng thái người dùng chưa đăng nhập. Guest được search event công khai nhưng không được apply event.

* **Volunteer:** Volunteer là user đã đăng nhập với role `VOLUNTEER`. Volunteer có thể search event công khai, xem event detail và tiếp tục sang apply event nếu đủ điều kiện.

* **Event Search:** Chức năng tìm kiếm event bằng keyword trên danh sách event công khai.

* **Keyword:** Từ khóa do người dùng nhập để tìm event. Keyword có thể liên quan đến tên event, địa điểm, organization, category hoặc skill.

* **Search Result:** Danh sách event phù hợp với keyword và vẫn thỏa điều kiện public/discoverable.

* **Event List Page:** Màn hình chính của UC08. UC10 Search Event được implement như một phần của màn hình này.

* **Search Bar:** UI input cho phép người dùng nhập keyword để tìm event.

* **Public Event:** Event được phép hiển thị cho Guest và Volunteer.

* **Event Detail Entry Point:** Hành động View Detail trên event trong search result để điều hướng sang UC09 — View Event Detail.

* **Category/Skill Data:** Dữ liệu do Member 4 quản lý. Search có thể match theo category hoặc skill nếu dữ liệu có sẵn.

* **Organization Data:** Dữ liệu do Member 5 quản lý. Search có thể match theo organization nếu dữ liệu có sẵn.

* **Event Data:** Dữ liệu event do Member 3 tạo/quản lý. UC10 chỉ consume event public data để search.

---

## 3. STAKEHOLDERS

* **Guest:** Cần search event công khai để tìm hiểu các cơ hội tình nguyện trước khi đăng ký tài khoản hoặc đăng nhập.

* **Volunteer:** Cần search event theo nhu cầu cá nhân, ví dụ theo tên, địa điểm, tổ chức, category hoặc skill.

* **NamLD / Member 2:** Chịu trách nhiệm chính với UC10 — Search Event.

* **Member 1 — Authentication + Profile + Email Services:** Phụ trách Login/Register, Profile, Volunteer History và Email Services. UC10 không yêu cầu đăng nhập, nhưng có liên quan khi Guest muốn apply ở bước sau.

* **Member 3 — Event & Application Management:** Phụ trách Add/Edit/Delete Event. UC10 phụ thuộc vào event data do Member 3 tạo/quản lý.

* **Member 4 — Admin & Manager Management:** Phụ trách Category Management và Skill Management. UC10 có thể search theo category/skill nhưng không quản lý dữ liệu này.

* **Member 5 — Organization + Notification + Dashboard + Payment:** Phụ trách Organization Management. UC10 có thể search theo organization nhưng không quản lý organization.

---

## 4. CONSTRAINTS

* **SDD Workflow:** Use case này phải được viết theo thứ tự `context.md` → `spec.md` trước khi sang plan/tasks/implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, frontend component chi tiết, backend route, migration hoặc code.

* **Public Access:** Guest và Volunteer đều có thể search event nếu event là public/discoverable.

* **Guest Boundary:** Guest được search event công khai nhưng không được apply event trực tiếp từ UC10.

* **Volunteer Boundary:** Volunteer được search event công khai và có thể đi sang Event Detail để tiếp tục flow.

* **Shared Screen Boundary:** UC08, UC10 và UC11 là các use case riêng nhưng phải được implement chung trên cùng một màn Event List.

* **Codex Implementation Boundary:** Khi sinh code, Codex không được tạo một page riêng chỉ để search event. Search bar phải nằm trong Event List page dùng chung với UC08 và UC11.

* **Event List Boundary:** UC10 không thay thế UC08. Search chỉ thay đổi kết quả hiển thị trên Event List.

* **Filter Boundary:** UC10 không mô tả chi tiết filter logic. Filter Event thuộc UC11, nhưng search và filter có thể kết hợp trên cùng Event List page.

* **Event Detail Boundary:** UC10 không hiển thị full event detail. Khi user click một event trong search result, hệ thống điều hướng sang UC09.

* **Apply Boundary:** UC10 không submit application. Apply Event thuộc UC12.

* **Applied Events Boundary:** UC10 không hiển thị danh sách event đã apply. Applied Events thuộc UC13.

* **Cancel Boundary:** UC10 không cancel application. Cancel Application thuộc UC14.

* **Feedback Boundary:** UC10 không submit feedback. Submit Feedback thuộc UC48.

* **Certificate Boundary:** UC10 không xem hoặc download certificate. Certificate thuộc UC51 và UC52.

* **Volunteer History Boundary:** UC10 không xử lý Volunteer History. UC21 thuộc Member 1.

* **Home Page Boundary:** UC10 không xử lý Home Page. UC02 thuộc Member 1.

* **Staff Management Boundary:** UC10 không tạo, sửa, xóa event. Add/Edit/Delete Event thuộc Member 3.

* **Category/Skill Boundary:** UC10 không tạo, sửa category hoặc skill. Category/Skill Management thuộc Member 4.

* **Organization Boundary:** UC10 không tạo, sửa organization. Organization Management thuộc Member 5.

* **Visibility Boundary:** Search result chỉ được hiển thị event public/discoverable.

* **Soft Delete Boundary:** Event đã soft delete không được xuất hiện trong search result.

* **Status Boundary:** Event draft, archived, deleted, cancelled hoặc completed không nên xuất hiện trong search result bản đầu.

* **Pagination Boundary:** Khi keyword thay đổi, Event List nên reset pagination về page 1 để tránh kết quả trống do đang ở page quá cao.

* **Mock Data:** Có thể dùng mock event data trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS

* Guest là trạng thái chưa đăng nhập, không phải role lưu trong database.
* Role trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.
* Guest có thể search public events.
* Volunteer có thể search public events.
* UC10 là chức năng search event bằng keyword.
* UC10 không phải màn hình riêng.
* UC10 phải nằm chung trong Event List page với UC08 và UC11.
* Search bar là một phần của Event List UI.
* Search result vẫn dùng chung event card/list item của UC08.
* Người dùng có thể click event trong search result để đi sang UC09 — View Event Detail.
* Search không submit application.
* Apply Event thuộc UC12.
* Search keyword có thể match theo event title, location, organization, category hoặc skill nếu dữ liệu có sẵn.
* Search keyword nên được trim khoảng trắng trước/sau.
* Empty keyword có thể được hiểu là xem danh sách event mặc định.
* Search không phân biệt hoa thường trong bản đầu.
* Nếu keyword không match event nào, UI cần hiển thị empty state.
* Nếu search đang tải dữ liệu, UI cần hiển thị loading state.
* Nếu search thất bại, UI cần hiển thị error state.
* Nếu search kết hợp với filter, kết quả phải thỏa cả keyword search và filter đang chọn.
* Khi keyword thay đổi, pagination nên reset về page 1.
* Search chỉ hiển thị event public/discoverable.
* Event draft không hiển thị trong search result.
* Event soft-deleted không hiển thị trong search result.
* Event archived không hiển thị trong search result bản đầu.
* Event cancelled không hiển thị trong search result bản đầu.
* Event completed không hiển thị trong search result bản đầu.
* Category/Skill data phụ thuộc Member 4.
* Organization data phụ thuộc Member 5.
* Event data phụ thuộc Member 3.
* Database/API thật cần được thống nhất sau khi spec/plan/api-contract được viết.

---

## 6. OPEN QUESTIONS

### Q1. UC10 có phải một màn hình riêng không?

**Answer:** Không. UC10 là một use case riêng để viết docs, nhưng khi code phải nằm trong cùng màn Event List với UC08 và UC11.

---

### Q2. Search bar nằm ở đâu?

**Answer:** Search bar nằm trên Event List page, dùng chung với danh sách event của UC08 và filter panel của UC11.

---

### Q3. UC10 có dùng chung event card với UC08 không?

**Answer:** Có. Search result nên hiển thị bằng cùng event card/list item của UC08 để UI nhất quán.

---

### Q4. Guest có được search event không?

**Answer:** Có. Guest được search event công khai.

---

### Q5. Volunteer có được search event không?

**Answer:** Có. Volunteer được search event công khai.

---

### Q6. Search keyword nên tìm theo field nào?

**Answer:** Bản đầu nên search theo:

* event title;
* location;
* organization;
* category;
* skill.

---

### Q7. Search có phân biệt hoa thường không?

**Answer:** Không nên phân biệt hoa thường trong bản đầu để người dùng dễ tìm kiếm hơn.

---

### Q8. Keyword rỗng thì xử lý thế nào?

**Answer:** Keyword rỗng hoặc chỉ có khoảng trắng nên được hiểu là xem danh sách event mặc định.

---

### Q9. Search có kết hợp với filter không?

**Answer:** Có. Nếu user vừa nhập keyword vừa chọn filter, kết quả nên thỏa cả keyword và filter.

---

### Q10. Khi keyword thay đổi thì pagination xử lý thế nào?

**Answer:** Pagination nên reset về page 1 khi keyword thay đổi.

---

### Q11. Search result có hiển thị event draft hoặc soft-deleted không?

**Answer:** Không. Search result chỉ hiển thị event public/discoverable.

---

### Q12. Search có submit Apply Event không?

**Answer:** Không. UC10 chỉ search và hiển thị result. Apply Event thuộc UC12.

---

### Q13. Search có mở Event Detail không?

**Answer:** UC10 không tự hiển thị full detail. Người dùng click event trong search result thì điều hướng sang UC09 — View Event Detail.

---

### Q14. Category, Skill, Organization trong search lấy từ đâu?

**Answer:** Category và Skill phụ thuộc Member 4. Organization phụ thuộc Member 5. UC10 chỉ consume dữ liệu để search/hiển thị.

---

## 7. ANSWERS / ANSWERS TO OPEN QUESTIONS

* **A1:** UC10 — Search Event thuộc Member 2 / Volunteer Event.

* **A2:** UC10 là search event bằng keyword.

* **A3:** UC10 không phải một màn hình riêng.

* **A4:** UC10 phải implement chung với UC08 và UC11 trên cùng Event List page.

* **A5:** Codex không được tạo page riêng chỉ dành cho Search Event.

* **A6:** Search bar phải nằm trên Event List page.

* **A7:** Search result dùng chung event card/list item của UC08.

* **A8:** Guest được search event công khai.

* **A9:** Volunteer được search event công khai.

* **A10:** Guest không phải role lưu trong database.

* **A11:** Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **A12:** Keyword search nên hỗ trợ event title, location, organization, category và skill.

* **A13:** Keyword nên được trim khoảng trắng trước/sau.

* **A14:** Search không nên phân biệt hoa thường trong bản đầu.

* **A15:** Keyword rỗng nên trả về danh sách event mặc định.

* **A16:** Search có thể kết hợp với filter của UC11.

* **A17:** Nếu kết hợp search và filter, kết quả phải thỏa cả keyword và filter.

* **A18:** Khi keyword thay đổi, pagination nên reset về page 1.

* **A19:** Search result chỉ hiển thị event public/discoverable.

* **A20:** Event draft không hiển thị trong search result.

* **A21:** Event soft-deleted không hiển thị trong search result.

* **A22:** Event archived, cancelled và completed không hiển thị trong search result bản đầu.

* **A23:** UC10 không submit application.

* **A24:** Apply Event thuộc UC12.

* **A25:** UC10 không hiển thị full Event Detail.

* **A26:** Click event trong search result sẽ đi sang UC09 — View Event Detail.

* **A27:** UC10 cần loading state khi search.

* **A28:** UC10 cần empty state khi không có event match keyword.

* **A29:** UC10 cần error state khi search thất bại.

* **A30:** Category/Skill data thuộc Member 4, UC10 chỉ consume.

* **A31:** Organization data thuộc Member 5, UC10 chỉ consume.

* **A32:** Event data thuộc Staff/Event Management của Member 3, UC10 chỉ consume event public data.

* **A33:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau, không định nghĩa trong context.

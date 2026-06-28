# CONTEXT.md — Filter Event (UC11)

# Người viết: NamLD (Member 2) | Ngày: 2026-06-27

## 1. PROBLEM STATEMENT

Volunteer Event Management System cần chức năng cho phép Guest và Volunteer lọc danh sách sự kiện tình nguyện theo các tiêu chí cụ thể.

Ở UC08 — View Event List, người dùng có thể xem danh sách event công khai. Ở UC10 — Search Event, người dùng có thể tìm event bằng keyword. Tuy nhiên, khi số lượng event nhiều, chỉ search bằng keyword có thể chưa đủ. Người dùng cần lọc event theo category, skill, organization, location, thời gian hoặc trạng thái còn slot để nhanh chóng tìm event phù hợp hơn.

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

Trong file này, phạm vi chỉ tập trung vào **UC11 — Filter Event**.

UC11 cần đảm bảo:

* Guest có thể filter các event công khai.
* Volunteer có thể filter các event công khai.
* Filter hoạt động trên cùng màn Event List của UC08.
* Filter có thể kết hợp với Search Event của UC10.
* Kết quả filter chỉ hiển thị event public/discoverable.
* Kết quả filter không hiển thị event draft, soft-deleted, archived, cancelled hoặc completed trong bản đầu.
* Người dùng có thể bấm event trong kết quả filter để đi sang UC09 — View Event Detail.
* Hệ thống có loading state, empty state và error state khi filter.

Lưu ý quan trọng:

UC08 — View Event List, UC10 — Search Event và UC11 — Filter Event được viết thành các folder context/spec riêng theo format team. Tuy nhiên, khi implementation, ba use case này phải được code chung trong cùng một màn hình Event List. Filter panel là một phần của Event List page, không phải một màn hình riêng.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Volunteer Event.

* **Use Case:** UC11 — Filter Event.

* **Feature Folder:** `UC11-feat-event-filter`.

* **Related UC trong cùng màn Event List:**

  * UC08 — View Event List
  * UC10 — Search Event

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

* **Guest:** Guest không phải role được lưu trong database. Guest là trạng thái người dùng chưa đăng nhập. Guest được filter event công khai nhưng không được apply event.

* **Volunteer:** Volunteer là user đã đăng nhập với role `VOLUNTEER`. Volunteer có thể filter event công khai, xem event detail và tiếp tục sang apply event nếu đủ điều kiện.

* **Event Filter:** Chức năng lọc danh sách event theo các tiêu chí cụ thể.

* **Filter Criteria:** Điều kiện lọc do người dùng chọn, ví dụ category, skill, organization, location, time hoặc availability/status.

* **Filter Result:** Danh sách event thỏa các điều kiện lọc và vẫn thỏa điều kiện public/discoverable.

* **Event List Page:** Màn hình chính của UC08. UC11 Filter Event được implement như một phần của màn hình này.

* **Filter Panel:** UI cho phép người dùng chọn các điều kiện lọc event.

* **Public Event:** Event được phép hiển thị cho Guest và Volunteer.

* **Event Detail Entry Point:** Hành động View Detail trên event trong filter result để điều hướng sang UC09 — View Event Detail.

* **Search Event:** Chức năng tìm kiếm bằng keyword thuộc UC10. Filter của UC11 có thể kết hợp với keyword search của UC10 trên cùng Event List page.

* **Category Data:** Dữ liệu category do Member 4 quản lý, được UC11 sử dụng để filter event.

* **Skill Data:** Dữ liệu skill do Member 4 quản lý, được UC11 sử dụng để filter event.

* **Organization Data:** Dữ liệu organization do Member 5 quản lý, được UC11 sử dụng để filter event.

* **Event Data:** Dữ liệu event do Member 3 tạo/quản lý. UC11 chỉ consume event public data để filter.

---

## 3. STAKEHOLDERS

* **Guest:** Cần filter event công khai để tìm cơ hội tình nguyện phù hợp trước khi đăng ký tài khoản hoặc đăng nhập.

* **Volunteer:** Cần filter event theo category, skill, organization, location hoặc thời gian để tìm event phù hợp với khả năng và lịch cá nhân.

* **NamLD / Member 2:** Chịu trách nhiệm chính với UC11 — Filter Event.

* **Member 1 — Authentication + Profile + Email Services:** Phụ trách Login/Register, Profile, Volunteer History và Email Services. UC11 không yêu cầu đăng nhập, nhưng có liên quan khi Guest muốn apply ở bước sau.

* **Member 3 — Event & Application Management:** Phụ trách Add/Edit/Delete Event. UC11 phụ thuộc vào event data do Member 3 tạo/quản lý.

* **Member 4 — Admin & Manager Management:** Phụ trách Category Management và Skill Management. UC11 phụ thuộc vào category/skill data để filter event nhưng không quản lý dữ liệu này.

* **Member 5 — Organization + Notification + Dashboard + Payment:** Phụ trách Organization Management. UC11 có thể filter theo organization nhưng không quản lý organization.

---

## 4. CONSTRAINTS

* **SDD Workflow:** Use case này phải được viết theo thứ tự `context.md` → `spec.md` trước khi sang plan/tasks/implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, frontend component chi tiết, backend route, migration hoặc code.

* **Public Access:** Guest và Volunteer đều có thể filter event nếu event là public/discoverable.

* **Guest Boundary:** Guest được filter event công khai nhưng không được apply event trực tiếp từ UC11.

* **Volunteer Boundary:** Volunteer được filter event công khai và có thể đi sang Event Detail để tiếp tục flow.

* **Shared Screen Boundary:** UC08, UC10 và UC11 là các use case riêng nhưng phải được implement chung trên cùng một màn Event List.

* **Codex Implementation Boundary:** Khi sinh code, Codex không được tạo một page riêng chỉ để filter event. Filter panel phải nằm trong Event List page dùng chung với UC08 và UC10.

* **Event List Boundary:** UC11 không thay thế UC08. Filter chỉ thay đổi kết quả hiển thị trên Event List.

* **Search Boundary:** UC11 không mô tả chi tiết search logic. Search Event thuộc UC10, nhưng search và filter có thể kết hợp trên cùng Event List page.

* **Event Detail Boundary:** UC11 không hiển thị full event detail. Khi user click một event trong filter result, hệ thống điều hướng sang UC09.

* **Apply Boundary:** UC11 không submit application. Apply Event thuộc UC12.

* **Applied Events Boundary:** UC11 không hiển thị danh sách event đã apply. Applied Events thuộc UC13.

* **Cancel Boundary:** UC11 không cancel application. Cancel Application thuộc UC14.

* **Feedback Boundary:** UC11 không submit feedback. Submit Feedback thuộc UC48.

* **Certificate Boundary:** UC11 không xem hoặc download certificate. Certificate thuộc UC51 và UC52.

* **Volunteer History Boundary:** UC11 không xử lý Volunteer History. UC21 thuộc Member 1.

* **Home Page Boundary:** UC11 không xử lý Home Page. UC02 thuộc Member 1.

* **Staff Management Boundary:** UC11 không tạo, sửa, xóa event. Add/Edit/Delete Event thuộc Member 3.

* **Category/Skill Boundary:** UC11 không tạo, sửa category hoặc skill. Category/Skill Management thuộc Member 4.

* **Organization Boundary:** UC11 không tạo, sửa organization. Organization Management thuộc Member 5.

* **Visibility Boundary:** Filter result chỉ được hiển thị event public/discoverable.

* **Soft Delete Boundary:** Event đã soft delete không được xuất hiện trong filter result.

* **Status Boundary:** Event draft, archived, deleted, cancelled hoặc completed không nên xuất hiện trong filter result bản đầu.

* **Pagination Boundary:** Khi filter thay đổi, Event List nên reset pagination về page 1 để tránh kết quả trống do đang ở page quá cao.

* **Reset Boundary:** Người dùng cần có cách clear/reset filter để quay lại danh sách event mặc định hoặc danh sách theo keyword hiện tại.

* **Mock Data:** Có thể dùng mock event data trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS

* Guest là trạng thái chưa đăng nhập, không phải role lưu trong database.
* Role trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.
* Guest có thể filter public events.
* Volunteer có thể filter public events.
* UC11 là chức năng filter event theo tiêu chí.
* UC11 không phải màn hình riêng.
* UC11 phải nằm chung trong Event List page với UC08 và UC10.
* Filter panel là một phần của Event List UI.
* Filter result vẫn dùng chung event card/list item của UC08.
* Người dùng có thể click event trong filter result để đi sang UC09 — View Event Detail.
* Filter không submit application.
* Apply Event thuộc UC12.
* Bản đầu nên hỗ trợ filter theo category, skill, organization, location, time và availability/status nếu dữ liệu có sẵn.
* Filter theo category phụ thuộc vào Category Management của Member 4.
* Filter theo skill phụ thuộc vào Skill Management của Member 4.
* Filter theo organization phụ thuộc vào Organization Management của Member 5.
* Filter theo location có thể dựa trên location text của event.
* Filter theo time có thể gồm upcoming events, this week, this month hoặc custom date range nếu team thống nhất sau.
* Filter theo availability/status có thể gồm còn slot, full hoặc still open for application nếu dữ liệu có sẵn.
* Nếu không chọn filter nào, hệ thống hiển thị danh sách event mặc định hoặc kết quả theo keyword search hiện tại.
* Nếu filter không match event nào, UI cần hiển thị empty state.
* Nếu filter đang tải dữ liệu, UI cần hiển thị loading state.
* Nếu filter thất bại, UI cần hiển thị error state.
* Nếu filter kết hợp với search, kết quả phải thỏa cả keyword search và filter đang chọn.
* Khi filter thay đổi, pagination nên reset về page 1.
* Filter chỉ hiển thị event public/discoverable.
* Event draft không hiển thị trong filter result.
* Event soft-deleted không hiển thị trong filter result.
* Event archived không hiển thị trong filter result bản đầu.
* Event cancelled không hiển thị trong filter result bản đầu.
* Event completed không hiển thị trong filter result bản đầu.
* Database/API thật cần được thống nhất sau khi spec/plan/api-contract được viết.

---

## 6. OPEN QUESTIONS

### Q1. UC11 có phải một màn hình riêng không?

**Answer:** Không. UC11 là một use case riêng để viết docs, nhưng khi code phải nằm trong cùng màn Event List với UC08 và UC10.

---

### Q2. Filter panel nằm ở đâu?

**Answer:** Filter panel nằm trên Event List page, dùng chung với danh sách event của UC08 và search bar của UC10.

---

### Q3. UC11 có dùng chung event card với UC08 không?

**Answer:** Có. Filter result nên hiển thị bằng cùng event card/list item của UC08 để UI nhất quán.

---

### Q4. Guest có được filter event không?

**Answer:** Có. Guest được filter event công khai.

---

### Q5. Volunteer có được filter event không?

**Answer:** Có. Volunteer được filter event công khai.

---

### Q6. Filter nên hỗ trợ những tiêu chí nào?

**Answer:** Bản đầu nên hỗ trợ:

* category;
* skill;
* organization;
* location;
* time;
* availability/status nếu có dữ liệu.

---

### Q7. Filter có kết hợp với search không?

**Answer:** Có. Nếu user vừa nhập keyword vừa chọn filter, kết quả nên thỏa cả keyword và filter.

---

### Q8. Không chọn filter nào thì xử lý thế nào?

**Answer:** Không chọn filter nào thì hệ thống hiển thị danh sách event mặc định hoặc danh sách theo keyword search hiện tại nếu keyword đang active.

---

### Q9. Khi filter thay đổi thì pagination xử lý thế nào?

**Answer:** Pagination nên reset về page 1 khi filter thay đổi.

---

### Q10. Có cần nút reset filter không?

**Answer:** Có. Nên có action clear/reset filter để người dùng dễ quay lại danh sách mặc định hoặc danh sách theo search hiện tại.

---

### Q11. Filter result có hiển thị event draft hoặc soft-deleted không?

**Answer:** Không. Filter result chỉ hiển thị event public/discoverable.

---

### Q12. Filter có submit Apply Event không?

**Answer:** Không. UC11 chỉ filter và hiển thị result. Apply Event thuộc UC12.

---

### Q13. Filter có mở Event Detail không?

**Answer:** UC11 không tự hiển thị full detail. Người dùng click event trong filter result thì điều hướng sang UC09 — View Event Detail.

---

### Q14. Category, Skill, Organization trong filter lấy từ đâu?

**Answer:** Category và Skill phụ thuộc Member 4. Organization phụ thuộc Member 5. UC11 chỉ consume dữ liệu để filter/hiển thị.

---

## 7. ANSWERS / ANSWERS TO OPEN QUESTIONS

* **A1:** UC11 — Filter Event thuộc Member 2 / Volunteer Event.

* **A2:** UC11 là filter event theo tiêu chí.

* **A3:** UC11 không phải một màn hình riêng.

* **A4:** UC11 phải implement chung với UC08 và UC10 trên cùng Event List page.

* **A5:** Codex không được tạo page riêng chỉ dành cho Filter Event.

* **A6:** Filter panel phải nằm trên Event List page.

* **A7:** Filter result dùng chung event card/list item của UC08.

* **A8:** Guest được filter event công khai.

* **A9:** Volunteer được filter event công khai.

* **A10:** Guest không phải role lưu trong database.

* **A11:** Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **A12:** Filter nên hỗ trợ category, skill, organization, location, time và availability/status nếu dữ liệu có sẵn.

* **A13:** Filter theo category và skill phụ thuộc Member 4.

* **A14:** Filter theo organization phụ thuộc Member 5.

* **A15:** Filter theo location dựa trên location data của event.

* **A16:** Filter theo time có thể dùng upcoming, this week, this month hoặc custom range nếu team thống nhất sau.

* **A17:** Filter theo availability/status có thể dùng còn slot, full hoặc still open for application nếu dữ liệu có sẵn.

* **A18:** Filter có thể kết hợp với search của UC10.

* **A19:** Nếu kết hợp search và filter, kết quả phải thỏa cả keyword và filter.

* **A20:** Khi filter thay đổi, pagination nên reset về page 1.

* **A21:** Cần có clear/reset filter action.

* **A22:** Không chọn filter nào thì hiển thị danh sách event mặc định hoặc kết quả theo keyword hiện tại.

* **A23:** Filter result chỉ hiển thị event public/discoverable.

* **A24:** Event draft không hiển thị trong filter result.

* **A25:** Event soft-deleted không hiển thị trong filter result.

* **A26:** Event archived, cancelled và completed không hiển thị trong filter result bản đầu.

* **A27:** UC11 không submit application.

* **A28:** Apply Event thuộc UC12.

* **A29:** UC11 không hiển thị full Event Detail.

* **A30:** Click event trong filter result sẽ đi sang UC09 — View Event Detail.

* **A31:** UC11 cần loading state khi filter.

* **A32:** UC11 cần empty state khi không có event match filter.

* **A33:** UC11 cần error state khi filter thất bại.

* **A34:** Category/Skill data thuộc Member 4, UC11 chỉ consume.

* **A35:** Organization data thuộc Member 5, UC11 chỉ consume.

* **A36:** Event data thuộc Staff/Event Management của Member 3, UC11 chỉ consume event public data.

* **A37:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau, không định nghĩa trong context.

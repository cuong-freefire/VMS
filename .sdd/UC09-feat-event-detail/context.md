# CONTEXT.md — View Event Detail (UC09)

# Người viết: NamLD (Member 2) | Ngày: 2026-06-27

## 1. PROBLEM STATEMENT

Volunteer Event Management System cần một màn hình cho phép Guest và Volunteer xem thông tin chi tiết của một sự kiện tình nguyện công khai.

Ở UC08 — View Event List, người dùng chỉ xem thông tin tóm tắt của event. Tuy nhiên, trước khi quyết định đăng ký tham gia, người dùng cần xem đầy đủ thông tin như mô tả, thời gian, địa điểm, tổ chức, category, kỹ năng liên quan, capacity, số chỗ còn lại và hạn đăng ký.

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

Trong file này, phạm vi chỉ tập trung vào **UC09 — View Event Detail**.

UC09 cần đảm bảo:

* Guest có thể xem chi tiết event công khai.
* Volunteer có thể xem chi tiết event công khai.
* Người dùng xem được thông tin đầy đủ hơn so với Event List.
* Người dùng có thể quay lại Event List.
* Người dùng có thể đi tiếp sang UC12 — Apply Event nếu muốn đăng ký.
* Hệ thống hiển thị rõ trạng thái event có còn đăng ký được hay không.
* Hệ thống không hiển thị event nội bộ, event đã bị xóa mềm hoặc event không còn phù hợp để public.
* Hệ thống có loading state, not found/unavailable state, error state và fallback khi thiếu ảnh.

Lưu ý quan trọng:

UC09 — View Event Detail là một use case riêng và nên có màn Event Detail riêng. Tuy nhiên, UC09 phải liên kết chặt với UC08, UC10 và UC11 vì người dùng thường đi từ Event List/Search/Filter sang Event Detail.

UC09 cũng liên kết với UC12 — Apply Event. Event Detail có thể hiển thị Apply button hoặc Apply entry point, nhưng không được submit application trực tiếp trong UC09. Việc tạo application thuộc UC12.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Volunteer Event.

* **Use Case:** UC09 — View Event Detail.

* **Feature Folder:** `UC09-feat-event-detail`.

* **Previous / Entry Use Cases:**

  * UC08 — View Event List
  * UC10 — Search Event
  * UC11 — Filter Event

* **Next / Connected Use Cases trong phần Member 2:**

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

* **Guest:** Guest không phải role được lưu trong database. Guest là trạng thái người dùng chưa đăng nhập. Guest được xem Event Detail công khai nhưng không được submit application.

* **Volunteer:** Volunteer là user đã đăng nhập với role `VOLUNTEER`. Volunteer có thể xem Event Detail và đi tiếp sang Apply Event nếu event đủ điều kiện.

* **Staff:** Staff là user có role `STAFF`, phụ trách tạo, sửa, xóa event ở module của Member 3. UC09 chỉ hiển thị event data, không cho Staff edit event trong use case này.

* **Event Detail:** Màn hình hiển thị thông tin chi tiết của một event.

* **Public Event Detail:** Chi tiết event được phép hiển thị cho Guest và Volunteer.

* **Event Summary:** Thông tin tóm tắt hiển thị ở UC08 — Event List. UC09 hiển thị nhiều thông tin hơn Event Summary.

* **Apply Entry Point:** Nút hoặc action trên Event Detail để dẫn người dùng sang UC12 — Apply Event.

* **Application Deadline:** Hạn cuối để Volunteer đăng ký tham gia event.

* **Capacity:** Số lượng Volunteer tối đa mà event có thể nhận.

* **Remaining Slots:** Số chỗ còn lại của event.

* **Required Skills:** Các kỹ năng mà event yêu cầu hoặc khuyến nghị Volunteer có.

* **Category/Skill Data:** Dữ liệu do Member 4 quản lý, UC09 chỉ sử dụng để hiển thị.

* **Organization Data:** Dữ liệu do Member 5 quản lý, UC09 chỉ sử dụng để hiển thị.

---

## 3. STAKEHOLDERS

* **Guest:** Cần xem chi tiết event công khai trước khi quyết định đăng ký tài khoản hoặc đăng nhập.

* **Volunteer:** Cần xem đầy đủ thông tin event trước khi quyết định apply.

* **NamLD / Member 2:** Chịu trách nhiệm chính với UC09 — View Event Detail.

* **Member 1 — Authentication + Profile + Email Services:** Phụ trách Login/Register, Profile, Volunteer History và Email Services. UC09 có liên quan đến Login/Register khi Guest muốn apply event ở bước sau.

* **Member 3 — Event & Application Management:** Phụ trách Add/Edit/Delete Event và Application Management. UC09 phụ thuộc vào event data do Member 3 tạo/quản lý.

* **Member 4 — Admin & Manager Management:** Phụ trách Category Management và Skill Management. UC09 có thể hiển thị category và skill liên quan đến event nhưng không quản lý dữ liệu này.

* **Member 5 — Organization + Notification + Dashboard + Payment:** Phụ trách Organization Management, Notification, Dashboard, Reports và Payment. UC09 có thể hiển thị organization của event nhưng không quản lý organization.

---

## 4. CONSTRAINTS

* **SDD Workflow:** Use case này phải được viết theo thứ tự `context.md` → `spec.md` trước khi sang plan/tasks/implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, frontend component chi tiết, backend route, migration hoặc code.

* **Public Access:** Guest và Volunteer đều có thể xem Event Detail nếu event là public/discoverable.

* **Guest Boundary:** Guest được xem Event Detail công khai nhưng không được submit application.

* **Volunteer Boundary:** Volunteer được xem Event Detail và có thể đi tiếp sang Apply Event nếu event đủ điều kiện.

* **Event List Boundary:** UC09 không hiển thị danh sách event. Event List thuộc UC08.

* **Search Boundary:** UC09 không xử lý search event. Search Event thuộc UC10 và nằm trên Event List page.

* **Filter Boundary:** UC09 không xử lý filter event. Filter Event thuộc UC11 và nằm trên Event List page.

* **Apply Boundary:** UC09 không tạo application. UC09 chỉ có thể cung cấp Apply entry point. Submit application thuộc UC12.

* **Application Rule Boundary:** UC09 có thể hiển thị trạng thái event có thể apply hay không, nhưng rule chặn cuối cùng phải nằm ở UC12 và backend/API.

* **Applied Events Boundary:** UC09 không hiển thị danh sách event đã apply. Applied Events thuộc UC13.

* **Cancel Boundary:** UC09 không cancel application. Cancel Application thuộc UC14.

* **Feedback Boundary:** UC09 không submit feedback. Submit Feedback thuộc UC48.

* **Certificate Boundary:** UC09 không xem hoặc download certificate. Certificate thuộc UC51 và UC52.

* **Volunteer History Boundary:** UC09 không xử lý Volunteer History. UC21 thuộc Member 1.

* **Staff Management Boundary:** UC09 không tạo, sửa, xóa event. Add/Edit/Delete Event thuộc Member 3.

* **Category/Skill Boundary:** UC09 không tạo, sửa category hoặc skill. Category/Skill Management thuộc Member 4.

* **Organization Boundary:** UC09 không tạo, sửa organization. Organization Management thuộc Member 5.

* **Soft Delete Boundary:** Event đã soft delete không được hiển thị trong public Event Detail.

* **Visibility Boundary:** Event ở trạng thái draft, archived, deleted, cancelled hoặc completed không nên hiển thị trong public Event Detail bản đầu.

* **Codex Implementation Boundary:** Khi sinh code, Codex phải hiểu UC09 là Event Detail page riêng, nhưng Apply button trên page này chỉ điều hướng sang UC12, không submit application trong UC09.

* **Mock Data:** Có thể dùng mock event detail data trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS

* Guest là trạng thái chưa đăng nhập, không phải role lưu trong database.
* Role trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.
* Guest có thể xem public Event Detail.
* Volunteer có thể xem public Event Detail.
* UC09 thường được mở từ UC08 Event List, UC10 Search Event hoặc UC11 Filter Event.
* UC09 là use case hiển thị thông tin chi tiết của một event.
* UC09 không submit application trực tiếp.
* Apply Event thuộc UC12.
* Event Detail nên hiển thị title, description, image, category, organization, date/time, location, capacity, remaining slots, application deadline và required skills nếu có.
* Event Detail nên hiển thị trạng thái có thể apply hay không nếu dữ liệu có sẵn.
* Guest bấm Apply entry point sẽ được yêu cầu login/register hoặc được điều hướng sang Authentication flow.
* Volunteer bấm Apply entry point sẽ được điều hướng sang UC12 — Apply Event.
* Volunteer chỉ được apply 1 lần cho mỗi event, nhưng kiểm tra cuối cùng thuộc UC12/backend.
* Volunteer không được apply nếu event đã qua deadline, nhưng kiểm tra cuối cùng thuộc UC12/backend.
* Volunteer không được apply nếu event đã full, nhưng kiểm tra cuối cùng thuộc UC12/backend.
* Event draft không hiển thị public detail.
* Event soft-deleted không hiển thị public detail.
* Event archived không hiển thị public detail trong bản đầu.
* Event cancelled không hiển thị public detail trong bản đầu.
* Event completed không ưu tiên hiển thị trong public Event Detail bản đầu.
* Event full vẫn có thể hiển thị detail nếu còn public, nhưng phải thể hiện rõ không còn chỗ hoặc không thể apply.
* Event quá deadline apply vẫn có thể hiển thị detail nếu còn public, nhưng phải thể hiện rõ không thể apply.
* Nếu event không có image/thumbnail, UI cần có fallback.
* Nếu event không tồn tại hoặc không public, UI cần hiển thị not found/unavailable state.
* Nếu tải Event Detail thất bại, UI cần hiển thị error state.
* Database/API thật cần được thống nhất sau khi spec/plan/api-contract được viết.

---

## 6. OPEN QUESTIONS

### Q1. Guest có xem được Event Detail không?

**Answer:** Có. Guest được xem chi tiết event công khai.

---

### Q2. Guest có được apply event từ Event Detail không?

**Answer:** Guest không được submit application trực tiếp. Nếu Guest bấm Apply, hệ thống cần yêu cầu login/register hoặc điều hướng sang Authentication flow.

---

### Q3. Volunteer có được apply từ Event Detail không?

**Answer:** UC09 chỉ cung cấp Apply entry point. Việc submit application thuộc UC12 — Apply Event.

---

### Q4. UC09 có cần kiểm tra rule apply không?

**Answer:** UC09 nên hiển thị trạng thái applyable/not applyable để người dùng hiểu. Tuy nhiên, rule chặn cuối cùng như duplicate, deadline, full event phải nằm ở UC12 và backend/API.

---

### Q5. Event full có được hiển thị detail không?

**Answer:** Có thể hiển thị nếu event vẫn public, nhưng phải thể hiện rõ event đã full và không thể apply.

---

### Q6. Event quá deadline apply có được hiển thị detail không?

**Answer:** Có thể hiển thị nếu event vẫn public, nhưng phải thể hiện rõ đã hết hạn đăng ký và không thể apply.

---

### Q7. Event draft có hiển thị public detail không?

**Answer:** Không. Event draft là dữ liệu nội bộ, không hiển thị cho Guest/Volunteer.

---

### Q8. Event soft-deleted có hiển thị public detail không?

**Answer:** Không. Event soft-deleted không được hiển thị.

---

### Q9. Event archived/cancelled/completed có hiển thị public detail không?

**Answer:** Không trong bản đầu của public Event Detail.

---

### Q10. Event Detail cần hiển thị những field nào?

**Answer:** Bản đầu nên hiển thị:

* event title;
* description;
* image/thumbnail nếu có;
* category;
* organization;
* date/time;
* location;
* capacity/remaining slots nếu có;
* application deadline nếu có;
* required skills nếu có;
* status hoặc availability;
* Apply entry point nếu phù hợp;
* Back to Event List action.

---

### Q11. UC09 có xử lý Search/Filter không?

**Answer:** Không. Search/Filter thuộc UC10 và UC11, nằm trên Event List page.

---

### Q12. UC09 có xử lý Applied Events không?

**Answer:** Không. Applied Events thuộc UC13.

---

### Q13. UC09 có xử lý Volunteer History không?

**Answer:** Không. UC21 — View Volunteer History thuộc Member 1.

---

### Q14. UC09 có quản lý event không?

**Answer:** Không. Add/Edit/Delete Event thuộc Member 3.

---

## 7. ANSWERS / ANSWERS TO OPEN QUESTIONS

* **A1:** UC09 — View Event Detail thuộc Member 2 / Volunteer Event.

* **A2:** UC09 tập trung vào hiển thị chi tiết một event công khai.

* **A3:** Guest được xem Event Detail công khai.

* **A4:** Volunteer được xem Event Detail công khai.

* **A5:** Guest không phải role lưu trong database.

* **A6:** Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **A7:** UC09 thường được mở từ UC08, UC10 hoặc UC11.

* **A8:** UC09 là Event Detail page riêng.

* **A9:** UC09 không xử lý Search Event.

* **A10:** UC09 không xử lý Filter Event.

* **A11:** UC09 không tạo application.

* **A12:** UC09 chỉ cung cấp Apply entry point.

* **A13:** Submit Apply Event thuộc UC12.

* **A14:** Guest bấm Apply cần được yêu cầu login/register hoặc chuyển sang Authentication flow.

* **A15:** Volunteer bấm Apply được điều hướng sang UC12 — Apply Event.

* **A16:** Rule duplicate application, deadline và capacity phải được enforce cuối cùng ở UC12/backend.

* **A17:** Event Detail nên hiển thị title, description, image, category, organization, date/time, location, capacity, remaining slots, deadline, required skills và availability nếu có.

* **A18:** Event Detail cần Back to Event List action.

* **A19:** Event draft không hiển thị public detail.

* **A20:** Event soft-deleted không hiển thị public detail.

* **A21:** Event archived, cancelled và completed không hiển thị public detail bản đầu.

* **A22:** Event full có thể hiển thị nếu còn public nhưng phải thể hiện rõ là không thể apply.

* **A23:** Event quá deadline có thể hiển thị nếu còn public nhưng phải thể hiện rõ là không thể apply.

* **A24:** UC09 cần loading state.

* **A25:** UC09 cần not found/unavailable state.

* **A26:** UC09 cần error state.

* **A27:** UC09 cần image fallback nếu event không có thumbnail.

* **A28:** Category/Skill data thuộc Member 4, UC09 chỉ consume.

* **A29:** Organization data thuộc Member 5, UC09 chỉ consume.

* **A30:** Event data thuộc Staff/Event Management của Member 3, UC09 chỉ consume event public detail data.

* **A31:** UC09 không xử lý Volunteer History vì UC21 thuộc Member 1.

* **A32:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau, không định nghĩa trong context.

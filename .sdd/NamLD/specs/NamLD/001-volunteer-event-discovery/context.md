# CONTEXT.md — Volunteer Event Discovery

# Người viết: NamLD (Member 2) | Ngày: 2026-06-27

## 1. PROBLEM STATEMENT

Hệ thống Volunteer Event Management System cần một luồng giúp Guest và Volunteer tìm kiếm các sự kiện tình nguyện phù hợp để xem thông tin và tiếp tục các bước sau như xem chi tiết hoặc đăng ký tham gia.

Theo tài liệu mới của team, Member 2 phụ trách Volunteer Event Module, trong đó có:

* Event List
* Search Event
* Filter Event
* Event Detail
* Applied Event List
* Volunteer History
* Feedback Form
* Certificate List
* Certificate Detail
* Home Dashboard

Trong feature này, phạm vi chỉ tập trung vào **Volunteer Event Discovery**, tức là màn hình danh sách sự kiện có hỗ trợ search và filter.

Feature này giúp:

* Guest xem danh sách sự kiện công khai.
* Guest tìm kiếm và lọc sự kiện công khai.
* Volunteer xem danh sách sự kiện công khai.
* Volunteer tìm kiếm và lọc sự kiện phù hợp.
* Người dùng chuyển từ danh sách sang Event Detail để xem đầy đủ thông tin.
* Hệ thống hiển thị rõ trạng thái loading, empty, error và fallback khi thiếu ảnh.

Feature này không xử lý submit Apply Event, không xử lý Applied Events, không xử lý Cancel Application, không xử lý Volunteer History, không xử lý Feedback, không xử lý Certificate, không xử lý Staff Event Management.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Volunteer Event Module.

* **Feature:** Volunteer Event Discovery.

* **Related Use Cases:**

  * UC08 — View Event List
  * UC10 — Search Event
  * UC11 — Filter Event

* **Connected Use Cases:**

  * UC09 — View Event Detail
  * UC12 — Apply Event
  * UC13 — View Applied Events
  * UC15 — Add Event
  * UC16 — Edit Event
  * UC17 — Delete Event

* **Related Screens:**

  * Event List
  * Search Event
  * Filter Event

* **Related Actors:**

  * Guest
  * Volunteer
  * Staff
  * Manager

* **Guest:** Guest không phải role được lưu trong database. Guest là trạng thái người dùng chưa đăng nhập. Guest có thể xem danh sách sự kiện công khai và xem chi tiết sự kiện công khai, nhưng không được apply event hoặc truy cập dữ liệu cá nhân.

* **Volunteer:** Volunteer là user đã đăng nhập với role `VOLUNTEER`. Volunteer có thể tìm kiếm, lọc, xem danh sách sự kiện, xem chi tiết sự kiện và tiếp tục sang luồng Apply Event nếu đủ điều kiện.

* **Staff:** Staff là user có role `STAFF`, phụ trách tạo và quản lý sự kiện ở module khác. Trong feature này, Staff không phải actor chính, nhưng dữ liệu event hiển thị trên discovery page phụ thuộc vào event mà Staff tạo/quản lý.

* **Manager:** Manager là user có role `MANAGER`, phụ trách category, skill và các dữ liệu phân loại liên quan. Feature này consume category/skill/organization data để phục vụ filter.

* **Event Discovery:** Luồng giúp người dùng tìm thấy sự kiện phù hợp thông qua danh sách, search, filter, sort và pagination.

* **Event List:** Danh sách các event công khai hoặc discoverable mà Guest/Volunteer được phép xem.

* **Search Event:** Tìm kiếm event bằng keyword, ví dụ theo tên event, địa điểm, tổ chức, category hoặc skill.

* **Filter Event:** Lọc event theo các điều kiện như category, skill, organization, location, time và trạng thái event nếu cần.

* **Public Event:** Event được phép hiển thị cho Guest và Volunteer. Event ở trạng thái draft, deleted, archived hoặc cancelled không nên xuất hiện trong public discovery.

* **Event Detail Entry Point:** Từ mỗi event item/card trong danh sách, người dùng có thể bấm View Detail để chuyển sang feature `002-volunteer-event-detail`.

---

## 3. STAKEHOLDERS

* **Guest:** Cần xem được các sự kiện công khai trước khi quyết định đăng ký tài khoản hoặc đăng nhập.

* **Volunteer:** Cần tìm kiếm và lọc sự kiện phù hợp với thời gian, địa điểm, kỹ năng và sở thích của mình.

* **NamLD / Member 2:** Chịu trách nhiệm chính với Event Discovery trong Volunteer Event Module.

* **Member 1 — Authentication & Profile:** Phụ trách login/register/profile. Feature này không yêu cầu login để xem danh sách, nhưng có liên quan khi Guest muốn apply sau khi xem event.

* **Member 3 — Staff Module:** Phụ trách Add Event, Edit Event, Application List, Application Detail, Attendance Management, Feedback List và Generate Certificate. Event Discovery phụ thuộc vào dữ liệu event do Staff quản lý.

* **Member 4 — Manager Module:** Phụ trách Category Management, Skill Management và Organization Management. Feature này dùng category, skill và organization để hiển thị/filter event.

* **Member 5 — Admin Module:** Không trực tiếp xử lý Event Discovery, nhưng có thể liên quan đến Dashboard, Event Statistics, Notification và Donation ở các module khác.

---

## 4. CONSTRAINTS (Ràng buộc cứng)

* **SDD Workflow:** Feature này phải đi theo thứ tự `context.md` → `spec.md` → `plan.md` → `tasks.md` → implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, route, component, migration hoặc code task.

* **Public Access:** Guest và Volunteer đều được xem Event Discovery nếu event là public/discoverable.

* **Guest Boundary:** Guest chỉ được xem danh sách và chi tiết event công khai. Guest không được apply event trực tiếp.

* **Apply Boundary:** Feature này không submit application. Apply Event thuộc feature `003-volunteer-event-application`.

* **Event Detail Boundary:** Feature này không hiển thị full event detail. Full detail thuộc feature `002-volunteer-event-detail`.

* **Applied Events Boundary:** Feature này không hiển thị danh sách event đã apply. Applied Events thuộc feature `004-volunteer-applied-events`.

* **Volunteer History Boundary:** Feature này không hiển thị lịch sử tham gia. Volunteer History thuộc feature `005-volunteer-history`.

* **Feedback Boundary:** Feature này không submit feedback. Feedback Form thuộc feature `006-volunteer-feedback-form`.

* **Certificate Boundary:** Feature này không xem/tải certificate. Certificate thuộc feature `007-volunteer-certificates`.

* **Staff Management Boundary:** Feature này không tạo, sửa, xóa event. Add/Edit/Delete Event thuộc Staff Module.

* **Manager Data Boundary:** Feature này không tạo, sửa category/skill/organization. Các dữ liệu đó thuộc Manager Module.

* **Soft Delete Boundary:** Event đã soft delete không được hiển thị trong Event Discovery.

* **Public Visibility Boundary:** Event ở trạng thái nội bộ như draft, archived, deleted hoặc cancelled không được hiển thị cho Guest/Volunteer trong bản đầu.

* **Mock Data:** Có thể dùng mock event data trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS (Các giả định hiện tại)

* Guest là trạng thái chưa đăng nhập, không phải role lưu trong database.
* Role trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.
* Guest có thể xem public Event List.
* Guest có thể xem public Event Detail.
* Volunteer có thể xem public Event List.
* Volunteer có thể search và filter event.
* Search và filter được gộp trong Event List, không tách thành màn riêng.
* Event Discovery là feature đầu tiên trong Member 2 vì các feature sau như Event Detail, Apply Event và Applied Events phụ thuộc vào nó.
* Event Discovery chỉ hiển thị các event công khai/discoverable.
* Event soft-deleted không được hiển thị.
* Event draft không được hiển thị.
* Event cancelled không được hiển thị trong bản đầu.
* Event archived không được hiển thị trong bản đầu.
* Event full vẫn có thể hiển thị nếu còn public, nhưng không được apply.
* Event đã qua deadline apply có thể bị đánh dấu không thể apply hoặc bị ẩn tùy rule cuối cùng, nhưng bản đầu nên không ưu tiên hiển thị trong discovery nếu event đã đóng đăng ký.
* Event ongoing có thể hiển thị nếu team muốn Volunteer vẫn xem thông tin, nhưng không được apply.
* Event completed không thuộc discovery chính; event completed nên thuộc history/reporting.
* Search keyword có thể tìm theo event title, location, category, organization và skill.
* Filter có thể gồm category, skill, organization, location, time và status/availability.
* Filter theo category/skill/organization phụ thuộc dữ liệu do Manager Module quản lý.
* Event card nên hiển thị thông tin tóm tắt, không hiển thị toàn bộ detail.
* Event card nên có action View Detail.
* Event card không submit Apply trực tiếp trong feature này.
* Nếu event không có image/thumbnail, UI cần có fallback.
* Nếu không có event phù hợp, UI cần hiển thị empty state.
* Nếu tải danh sách event thất bại, UI cần hiển thị error state.
* Database/API thật cần được thống nhất sau khi `plan.md` và `api-contract.md` được viết.

---

## 6. RESOLVED QUESTIONS (Tự trả lời dựa trên docs mới và quyết định trước đó)

### Q1. Guest có phải role trong database không?

**Answer:** Không. Guest chỉ là trạng thái chưa đăng nhập. Role trong database chỉ gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

---

### Q2. Feature 001 có gồm Search và Filter không?

**Answer:** Có. Theo docs mới, Member 2 phụ trách Event List, trong đó Search/Filter được included. Vì vậy feature `001-volunteer-event-discovery` gồm Event List + Search Event + Filter Event.

---

### Q3. Feature này có cho Guest xem danh sách event không?

**Answer:** Có. Guest được xem danh sách event công khai và xem chi tiết event công khai.

---

### Q4. Feature này có cho Guest apply event không?

**Answer:** Không. Guest chỉ được xem public event. Nếu Guest muốn apply, luồng Apply Event sẽ yêu cầu login/register ở feature `003-volunteer-event-application`.

---

### Q5. Feature này có cho Volunteer apply trực tiếp từ Event List không?

**Answer:** Không trong bản đầu. Event List chỉ nên có View Detail. Apply Event được xử lý ở feature riêng để giữ business rule rõ ràng.

---

### Q6. Search sẽ tìm theo những field nào?

**Answer:** Bản đầu nên search theo:

* event title;
* location;
* category;
* organization;
* skill.

---

### Q7. Filter sẽ gồm những gì?

**Answer:** Bản đầu nên hỗ trợ filter theo:

* category/event type;
* skill;
* organization;
* location;
* time;
* availability/status nếu cần.

---

### Q8. Có hiển thị event full không?

**Answer:** Có thể hiển thị nếu event còn public/discoverable, nhưng cần hiển thị rõ là event đã đủ chỗ và không thể apply.

---

### Q9. Có hiển thị event đã qua deadline apply không?

**Answer:** Bản đầu nên không ưu tiên hiển thị event đã đóng đăng ký trong discovery. Nếu team vẫn muốn hiển thị, event phải được đánh dấu rõ là không thể apply. Apply rule luôn phải chặn khi đã qua deadline.

---

### Q10. Có hiển thị event ongoing không?

**Answer:** Có thể hiển thị nếu event vẫn public, nhưng không được apply. Event ongoing chủ yếu để user xem thông tin, không phải để đăng ký mới.

---

### Q11. Có hiển thị event completed không?

**Answer:** Không trong Event Discovery bản đầu. Event completed phù hợp với Volunteer History, Staff/Manager report hoặc dashboard hơn.

---

### Q12. Có hiển thị event draft, archived, deleted, cancelled không?

**Answer:** Không. Các event này không nên xuất hiện trong public Event Discovery.

---

### Q13. Event List có cần pagination không?

**Answer:** Có. Event Discovery nên có pagination hoặc loading strategy để tránh tải quá nhiều event cùng lúc.

---

### Q14. Khi search/filter thay đổi thì page hiện tại xử lý thế nào?

**Answer:** Nên reset về page 1 để tránh trường hợp user đang ở page cao nhưng filter mới không có đủ dữ liệu.

---

### Q15. Filter options lấy từ đâu?

**Answer:** Category, skill và organization là dữ liệu dùng chung, do Manager Module quản lý. Feature này chỉ consume các dữ liệu đó để filter.

---

### Q16. Feature này có xử lý Add/Edit/Delete Event không?

**Answer:** Không. Add/Edit/Delete Event thuộc Staff Module.

---

### Q17. Feature này có xử lý Applied Events không?

**Answer:** Không. Applied Events thuộc feature `004-volunteer-applied-events`.

---

### Q18. Feature này có xử lý Home Dashboard không?

**Answer:** Không. Home Dashboard thuộc feature `008-volunteer-home-dashboard` và nên viết sau vì nó tổng hợp dữ liệu từ nhiều feature khác.

---

## 7. ANSWERS (Đã chốt nghiệp vụ cho bản đầu)

* **A1:** Feature này là `001-volunteer-event-discovery`.

* **A2:** Feature này thuộc Member 2 — Volunteer Event Module.

* **A3:** Feature này bao gồm Event List, Search Event và Filter Event.

* **A4:** Guest có thể xem Event Discovery nếu event là public/discoverable.

* **A5:** Volunteer có thể xem Event Discovery, search và filter event.

* **A6:** Guest không phải role lưu trong database.

* **A7:** Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **A8:** Guest không được apply event trong feature này.

* **A9:** Volunteer không submit application trong feature này.

* **A10:** Apply Event được xử lý ở feature `003-volunteer-event-application`.

* **A11:** Event Detail được xử lý ở feature `002-volunteer-event-detail`.

* **A12:** Event card trong discovery nên có View Detail action.

* **A13:** Event card không nên xử lý submit application trực tiếp.

* **A14:** Search keyword nên hỗ trợ event title, location, category, organization và skill.

* **A15:** Filter nên hỗ trợ category, skill, organization, location, time và status/availability nếu cần.

* **A16:** Event draft không hiển thị trong discovery.

* **A17:** Event soft-deleted không hiển thị trong discovery.

* **A18:** Event archived không hiển thị trong discovery bản đầu.

* **A19:** Event cancelled không hiển thị trong discovery bản đầu.

* **A20:** Event completed không hiển thị trong discovery bản đầu.

* **A21:** Event full có thể hiển thị nhưng không được apply.

* **A22:** Event ongoing có thể hiển thị nếu còn public, nhưng không được apply.

* **A23:** Event đã qua deadline apply không được apply.

* **A24:** Event Discovery nên có pagination hoặc loading strategy.

* **A25:** Khi keyword/filter/sort thay đổi, pagination nên reset về page 1.

* **A26:** Feature cần có loading state.

* **A27:** Feature cần có empty state.

* **A28:** Feature cần có error state.

* **A29:** Feature cần có image fallback nếu event không có thumbnail.

* **A30:** Feature này phụ thuộc Member 3 về dữ liệu event do Staff tạo/quản lý.

* **A31:** Feature này phụ thuộc Member 4 về category, skill và organization dùng cho filter.

* **A32:** Feature này có thể dùng mock data qua service layer trong giai đoạn đầu, nhưng mock data không phải source of truth.

* **A33:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau (`plan.md`, `api-contract.md`, `database.md`, `tasks.md`), không định nghĩa trong context.

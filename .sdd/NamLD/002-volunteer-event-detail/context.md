# CONTEXT.md — Volunteer Event Detail

# Người viết: NamLD (Member 2) | Ngày: 2026-06-27

## 1. PROBLEM STATEMENT

Hệ thống Volunteer Event Management System cần một màn hình giúp Guest và Volunteer xem thông tin chi tiết của một sự kiện tình nguyện.

Ở feature `001-volunteer-event-discovery`, người dùng chỉ xem danh sách event kèm thông tin tóm tắt. Tuy nhiên, trước khi đăng ký tham gia, người dùng cần xem đầy đủ thông tin của event như mô tả, thời gian, địa điểm, tổ chức, category, kỹ năng yêu cầu, số lượng còn lại và trạng thái đăng ký.

Feature `002-volunteer-event-detail` tập trung vào **Event Detail**, bao gồm:

* Hiển thị thông tin chi tiết của event công khai.
* Cho Guest xem chi tiết event công khai.
* Cho Volunteer xem chi tiết event công khai.
* Hiển thị trạng thái event và khả năng đăng ký.
* Hiển thị thông tin deadline, capacity và remaining slots nếu có.
* Hiển thị kỹ năng yêu cầu nếu event có skill requirement.
* Cung cấp entry point để Volunteer tiếp tục sang Apply Event.
* Yêu cầu Guest đăng nhập nếu muốn apply.
* Hiển thị loading, unavailable/not found và error states.

Feature này không xử lý submit application, không tạo application mới, không xử lý Applied Events, không xử lý Cancel Application, không xử lý Staff Add/Edit/Delete Event, không xử lý Attendance, Feedback hoặc Certificate.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Volunteer Event Module.

* **Feature:** Volunteer Event Detail.

* **Related Use Case:**

  * UC09 — View Event Detail

* **Connected Use Cases:**

  * UC08 — View Event List
  * UC10 — Search Event
  * UC11 — Filter Event
  * UC12 — Apply Event
  * UC13 — View Applied Events
  * UC14 — Cancel Application
  * UC15 — Add Event
  * UC16 — Edit Event
  * UC17 — Delete Event

* **Related Screens:**

  * Event Detail
  * Apply entry point from Event Detail

* **Related Actors:**

  * Guest
  * Volunteer
  * Staff
  * Manager

* **Guest:** Guest không phải role được lưu trong database. Guest là trạng thái người dùng chưa đăng nhập. Guest có thể xem Event Detail của event công khai, nhưng không được submit Apply Event.

* **Volunteer:** Volunteer là user đã đăng nhập với role `VOLUNTEER`. Volunteer có thể xem Event Detail và tiếp tục sang Apply Event nếu event đủ điều kiện.

* **Staff:** Staff là user có role `STAFF`, phụ trách tạo và quản lý event ở Staff Module. Event Detail chỉ hiển thị dữ liệu event do Staff tạo/quản lý, không cho Staff edit trong feature này.

* **Manager:** Manager là user có role `MANAGER`, phụ trách category, skill và một số dữ liệu phân loại. Event Detail có thể hiển thị category, skill và organization data do các module liên quan quản lý.

* **Event Detail:** Trang hiển thị đầy đủ thông tin của một event để người dùng hiểu event trước khi quyết định apply.

* **Apply Entry Point:** Nút hoặc action trên Event Detail giúp người dùng tiếp tục sang Apply Event. Entry point này không tạo application trong feature này.

* **Public Event Detail:** Chi tiết event được phép hiển thị cho Guest và Volunteer.

* **Event Application Rule:** Volunteer chỉ được apply event khi đủ điều kiện. Các rule chính theo docs mới gồm: mỗi Volunteer chỉ được apply 1 lần cho mỗi event, không thể apply khi đã qua deadline, và không thể apply khi event đã đủ chỗ.

* **Event Capacity:** Số lượng Volunteer tối đa event có thể nhận.

* **Remaining Slots:** Số lượng chỗ còn lại của event.

* **Application Deadline:** Thời hạn cuối để Volunteer apply event.

* **Required Skills:** Các kỹ năng event yêu cầu hoặc khuyến nghị Volunteer có.

---

## 3. STAKEHOLDERS

* **Guest:** Cần xem chi tiết event trước khi quyết định đăng ký tài khoản hoặc đăng nhập.

* **Volunteer:** Cần xem đầy đủ thông tin event trước khi apply.

* **NamLD / Member 2:** Chịu trách nhiệm chính với Event Detail trong Volunteer Event Module.

* **Member 1 — Authentication & Profile:** Phụ trách login/register/profile. Feature này cần liên kết với auth flow khi Guest muốn apply.

* **Member 3 — Staff Module:** Phụ trách Add Event, Edit Event, Application Management, Attendance Management, Feedback List và Generate Certificate. Event Detail phụ thuộc dữ liệu event do Staff tạo/quản lý.

* **Member 4 — Manager Module:** Phụ trách Category Management, Skill Management và Organization Management. Event Detail consume category, skill và organization data.

* **Member 5 — Admin Module:** Không trực tiếp xử lý Event Detail, nhưng có thể liên quan đến Dashboard, Event Statistics, Notification hoặc Donation ở module khác.

---

## 4. CONSTRAINTS (Ràng buộc cứng)

* **SDD Workflow:** Feature này phải đi theo thứ tự `context.md` → `spec.md` → `plan.md` → `tasks.md` → implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, route, component, migration hoặc code task.

* **Public Access:** Guest và Volunteer đều có thể xem Event Detail nếu event là public/discoverable.

* **Guest Boundary:** Guest có thể xem Event Detail nhưng không được submit Apply Event.

* **Volunteer Boundary:** Volunteer có thể xem Event Detail và đi tiếp sang Apply Event nếu event đủ điều kiện.

* **Apply Boundary:** Feature này chỉ cung cấp Apply entry point. Submit Apply Event thuộc feature `003-volunteer-event-application`.

* **Application Creation Boundary:** Feature này không tạo application mới.

* **Duplicate Application Boundary:** Feature này có thể hiển thị trạng thái đã apply nếu dữ liệu có sẵn, nhưng rule chặn duplicate application chính thức thuộc feature `003-volunteer-event-application` và backend.

* **Applied Events Boundary:** Feature này không hiển thị danh sách event đã apply. Applied Events thuộc feature `004-volunteer-applied-events`.

* **Cancel Boundary:** Feature này không cancel application. Cancel Application thuộc feature `004-volunteer-applied-events`.

* **Volunteer History Boundary:** Feature này không hiển thị lịch sử tham gia. Volunteer History thuộc feature `005-volunteer-history`.

* **Feedback Boundary:** Feature này không submit feedback. Feedback Form thuộc feature `006-volunteer-feedback-form`.

* **Certificate Boundary:** Feature này không xem/tải certificate. Certificate thuộc feature `007-volunteer-certificates`.

* **Staff Management Boundary:** Feature này không tạo, sửa, xóa event. Add/Edit/Delete Event thuộc Staff Module.

* **Soft Delete Boundary:** Event đã soft delete không được hiển thị trong public Event Detail.

* **Public Visibility Boundary:** Event draft, archived, deleted hoặc cancelled không được hiển thị cho Guest/Volunteer trong bản đầu.

* **Mock Data:** Có thể dùng mock event detail data trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS (Các giả định hiện tại)

* Guest là trạng thái chưa đăng nhập, không phải role lưu trong database.
* Role trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.
* Guest có thể xem Event Detail của event công khai.
* Volunteer có thể xem Event Detail của event công khai.
* Event Detail được mở từ Event Discovery thông qua View Detail action.
* Event Detail hiển thị thông tin đầy đủ hơn Event Card trong danh sách.
* Event Detail nên hiển thị title, description, image, category, organization, date/time, location, capacity, remaining slots, application deadline và required skills nếu có.
* Event Detail nên hiển thị trạng thái có thể apply hay không nếu dữ liệu có sẵn.
* Apply button hoặc Apply entry point có thể xuất hiện trên Event Detail.
* Guest bấm Apply entry point sẽ được yêu cầu đăng nhập hoặc điều hướng sang login/register.
* Volunteer bấm Apply entry point sẽ được điều hướng sang feature `003-volunteer-event-application`.
* Feature này không submit application trực tiếp.
* Event full vẫn có thể hiển thị detail nếu còn public, nhưng phải thể hiện rõ không còn chỗ apply.
* Event quá deadline apply vẫn có thể hiển thị detail nếu còn public, nhưng phải thể hiện rõ không thể apply.
* Event draft không hiển thị public detail.
* Event soft-deleted không hiển thị public detail.
* Event archived không hiển thị public detail trong bản đầu.
* Event cancelled không hiển thị public detail trong bản đầu.
* Event completed không ưu tiên hiển thị trong public Event Detail bản đầu, trừ khi được mở từ history ở feature khác.
* Nếu event không có image/thumbnail, UI cần có fallback.
* Nếu event không tồn tại hoặc không public, UI cần hiển thị not found/unavailable state.
* Nếu tải event detail thất bại, UI cần hiển thị error state.
* Database/API thật cần được thống nhất sau khi `plan.md` và `api-contract.md` được viết.

---

## 6. RESOLVED QUESTIONS (Tự trả lời dựa trên docs mới và quyết định trước đó)

### Q1. Guest có xem được Event Detail không?

**Answer:** Có. Guest được xem chi tiết event công khai.

---

### Q2. Guest có được apply event từ Event Detail không?

**Answer:** Không được submit trực tiếp. Nếu Guest muốn apply, hệ thống cần yêu cầu đăng nhập hoặc chuyển sang Authentication flow.

---

### Q3. Volunteer có được apply từ Event Detail không?

**Answer:** Event Detail chỉ cung cấp entry point. Submit apply thật sự thuộc feature `003-volunteer-event-application`.

---

### Q4. Event Detail có phải kiểm tra rule apply không?

**Answer:** Event Detail có thể hiển thị trạng thái applyable/not applyable để user hiểu, nhưng rule chặn cuối cùng phải được xử lý ở Apply Event và backend.

---

### Q5. Event full có được hiển thị detail không?

**Answer:** Có thể hiển thị nếu event vẫn public, nhưng cần hiển thị rõ là event đã đủ chỗ và không thể apply.

---

### Q6. Event quá deadline apply có được hiển thị detail không?

**Answer:** Có thể hiển thị nếu event vẫn public, nhưng cần hiển thị rõ là đã quá hạn đăng ký và không thể apply.

---

### Q7. Event draft có hiển thị detail không?

**Answer:** Không. Event draft là dữ liệu nội bộ, không hiển thị public Event Detail.

---

### Q8. Event soft-deleted có hiển thị detail không?

**Answer:** Không. User, Event và Organization dùng soft delete, nên event soft-deleted không được hiển thị public.

---

### Q9. Event archived/cancelled có hiển thị detail không?

**Answer:** Không trong bản đầu của public Event Detail. Nếu cần hiển thị lịch sử event archived/cancelled, việc đó nên thuộc Volunteer History hoặc module quản lý tương ứng.

---

### Q10. Event completed có hiển thị detail không?

**Answer:** Không ưu tiên hiển thị trong public Event Detail bản đầu. Event completed phù hợp với Volunteer History hoặc reporting hơn.

---

### Q11. Event Detail cần hiển thị required skills không?

**Answer:** Có, nếu event có skill requirement. Đây là thông tin quan trọng để Volunteer quyết định apply.

---

### Q12. Event Detail có hiển thị organization không?

**Answer:** Có. Organization giúp user biết đơn vị/tổ chức liên quan đến event.

---

### Q13. Event Detail có hiển thị category không?

**Answer:** Có. Category giúp user hiểu loại hình event.

---

### Q14. Event Detail có xử lý Applied Events không?

**Answer:** Không. Applied Events thuộc feature `004-volunteer-applied-events`.

---

### Q15. Event Detail có xử lý Feedback hoặc Certificate không?

**Answer:** Không. Feedback và Certificate là các feature riêng của Member 2.

---

### Q16. Event Detail có xử lý Staff edit/delete event không?

**Answer:** Không. Add/Edit/Delete Event thuộc Staff Module.

---

## 7. ANSWERS (Đã chốt nghiệp vụ cho bản đầu)

* **A1:** Feature này là `002-volunteer-event-detail`.

* **A2:** Feature này thuộc Member 2 — Volunteer Event Module.

* **A3:** Feature này tương ứng với UC09 — View Event Detail.

* **A4:** Guest có thể xem Event Detail nếu event là public/discoverable.

* **A5:** Volunteer có thể xem Event Detail nếu event là public/discoverable.

* **A6:** Guest không phải role lưu trong database.

* **A7:** Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **A8:** Event Detail mở từ Event Discovery thông qua View Detail.

* **A9:** Event Detail hiển thị thông tin đầy đủ hơn Event Card.

* **A10:** Event Detail nên hiển thị title, description, image, category, organization, date/time, location, capacity, remaining slots, application deadline và required skills nếu có.

* **A11:** Event Detail nên hiển thị trạng thái có thể apply hay không nếu dữ liệu có sẵn.

* **A12:** Event Detail có Apply entry point.

* **A13:** Event Detail không submit application trực tiếp.

* **A14:** Submit Apply Event thuộc feature `003-volunteer-event-application`.

* **A15:** Guest bấm Apply cần được yêu cầu login/register.

* **A16:** Volunteer bấm Apply sẽ đi sang Apply Event flow.

* **A17:** Volunteer chỉ được apply 1 lần cho mỗi event, nhưng chặn cuối cùng nằm ở Apply Event/backend.

* **A18:** Volunteer không được apply nếu event đã qua deadline, nhưng chặn cuối cùng nằm ở Apply Event/backend.

* **A19:** Volunteer không được apply nếu event đã đủ chỗ, nhưng chặn cuối cùng nằm ở Apply Event/backend.

* **A20:** Event draft không hiển thị trong public detail.

* **A21:** Event soft-deleted không hiển thị trong public detail.

* **A22:** Event archived không hiển thị trong public detail bản đầu.

* **A23:** Event cancelled không hiển thị trong public detail bản đầu.

* **A24:** Event full có thể hiển thị detail nếu còn public, nhưng phải thể hiện rõ không thể apply.

* **A25:** Event quá deadline có thể hiển thị detail nếu còn public, nhưng phải thể hiện rõ không thể apply.

* **A26:** Feature cần có loading state.

* **A27:** Feature cần có not found/unavailable state.

* **A28:** Feature cần có error state.

* **A29:** Feature cần có image fallback nếu event không có thumbnail.

* **A30:** Feature này phụ thuộc Member 3 về dữ liệu event do Staff tạo/quản lý.

* **A31:** Feature này phụ thuộc Member 4 về category, skill và organization.

* **A32:** Feature này có thể dùng mock data qua service layer trong giai đoạn đầu, nhưng mock data không phải source of truth.

* **A33:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau (`plan.md`, `api-contract.md`, `database.md`, `tasks.md`), không định nghĩa trong context.

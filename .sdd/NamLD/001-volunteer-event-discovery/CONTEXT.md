# CONTEXT.md — Volunteer Event Discovery

# Người viết: NamLD (Member 2) | Ngày: 2026-06-25

## 1. PROBLEM STATEMENT

Hệ thống VMS cần một luồng giúp Guest và Volunteer dễ dàng tìm kiếm các sự kiện tình nguyện phù hợp trước khi xem chi tiết hoặc đăng ký tham gia.

Nếu không có tính năng Event Discovery rõ ràng, người dùng sẽ khó tìm được sự kiện phù hợp theo tên, địa điểm, danh mục, tổ chức, kỹ năng liên quan, thời gian hoặc trạng thái. Điều này ảnh hưởng trực tiếp đến các luồng phía sau như xem chi tiết sự kiện, apply event, theo dõi applied events, điểm danh, feedback và certificate.

Feature này tập trung vào phần Volunteer-facing Event Discovery, bao gồm:

* Xem danh sách sự kiện public.
* Tìm kiếm sự kiện.
* Lọc sự kiện.
* Sắp xếp danh sách sự kiện.
* Phân trang danh sách sự kiện.
* Chuyển từ danh sách sự kiện sang màn Event Detail.

Feature này không xử lý việc Staff tạo, sửa, xóa sự kiện; không xử lý apply event; không xử lý approve/reject application; không xử lý attendance, certificate, notification, donation hoặc reporting.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Volunteer Event Module.

* **Feature:** Volunteer Event Discovery.

* **Related Use Cases:**

  * UC08 — View Event List
  * UC10 — Search Event
  * UC11 — Filter Event

* **Related Screens:**

  * Event List
  * Event Search & Filter

* **Related Actors:**

  * Guest
  * Volunteer

* **Guest:** Người dùng chưa đăng nhập. Guest được xem danh sách sự kiện public, search/filter và xem event detail. Guest không được apply event nếu chưa đăng nhập.

* **Volunteer:** Người dùng đã đăng nhập với vai trò Volunteer. Volunteer được xem danh sách sự kiện, search/filter, xem event detail và có thể apply event ở feature khác.

* **Event Discovery:** Luồng giúp Guest/Volunteer tìm, lọc, sắp xếp và phân trang các sự kiện public phù hợp.

* **Event List:** Danh sách các sự kiện public được hiển thị cho Guest và Volunteer.

* **Search Event:** Người dùng nhập keyword để tìm sự kiện.

* **Filter Event:** Người dùng chọn các điều kiện lọc như category, skill, organization, location, time, status.

* **Category:** Dữ liệu phân loại sự kiện. Member 2 chỉ sử dụng dữ liệu này để filter/hiển thị, không quản lý category.

* **Skill:** Dữ liệu kỹ năng liên quan đến volunteer hoặc yêu cầu của event. Member 2 chỉ sử dụng dữ liệu này để search/filter, không quản lý skill.

* **Organization:** Tổ chức tạo, tài trợ hoặc quản lý sự kiện. Member 2 chỉ sử dụng dữ liệu này để filter/hiển thị, không quản lý organization.

* **Event Status:** Trạng thái của event. Member 2 sử dụng status để hiển thị/lọc, nhưng status model chính cần được thống nhất với Staff Module vì Staff là người tạo và quản lý event lifecycle.

* **Public/Discoverable Event:** Event đủ điều kiện hiển thị trong Event List public cho Guest và Volunteer.

---

## 3. STAKEHOLDERS

* **Guest:** Cần xem danh sách sự kiện public, tìm kiếm và lọc sự kiện trước khi quyết định đăng ký tài khoản hoặc xem chi tiết sự kiện.

* **Volunteer:** Cần tìm nhanh các sự kiện phù hợp để xem chi tiết và apply ở feature tiếp theo.

* **NamLD / Member 2:** Chịu trách nhiệm chính với luồng Volunteer-facing Event Discovery.

* **Member 1 — Authentication + Profile:** Liên quan đến trạng thái đăng nhập của user. Event Discovery vẫn cho Guest xem, nhưng apply event cần login ở feature sau.

* **Member 3 — Staff Module:** Chịu trách nhiệm tạo, sửa, xóa và quản lý event. Dữ liệu event hiển thị ở Discovery phụ thuộc vào Staff Module.

* **Member 4 — Manager Module:** Chịu trách nhiệm quản lý category, skill, organization. Filter options của Member 2 phụ thuộc vào dữ liệu từ module này.

* **Member 5 — Admin Module:** Có thể sử dụng dữ liệu event cho dashboard, reports, notification, donation hoặc certificate, nhưng không trực tiếp quản lý luồng Event Discovery.

---

## 4. CONSTRAINTS (Ràng buộc cứng)

* **SDD Workflow:** Feature này phải đi theo thứ tự `context.md` → `spec.md` → `plan.md` → `tasks.md` → implementation.

* **No Implementation in Context:** File context này không được định nghĩa database schema, API contract, route, component, migration hoặc code task.

* **Scope Boundary:** Feature này chỉ bao gồm Event List, Search Event, Filter Event, Sort Event và Pagination. Event Detail, Apply Event, Applied Events, Cancel Application và Volunteer History sẽ được làm ở các feature riêng.

* **Role Boundary:** Guest và Volunteer đều được xem cùng một public event list. Guest không được apply event nếu chưa đăng nhập.

* **Data Ownership:** Member 2 không quản lý category, skill, organization hoặc event lifecycle. Member 2 chỉ sử dụng dữ liệu đã được quản lý bởi module khác.

* **Mock Data:** Trong giai đoạn đầu, Member 2 có thể dùng mock events, mock categories, mock skills, mock organizations và mock statuses để dựng UI/phôi. Mock data không phải source of truth và phải được thay bằng API/data thật sau khi team chốt plan/API contract.

* **Search Behavior:** Search chạy tự động khi người dùng đang gõ, nhưng khi implement nên dùng debounce để tránh gọi xử lý/search quá nhiều lần.

* **Filter Behavior:** User được kết hợp nhiều filter cùng lúc. Filter reset khi user rời trang rồi quay lại.

* **Pagination Behavior:** Event List dùng phân trang với page size đã chốt là 8 events/page.

* **Status Visibility:** `CLOSED` event không hiển thị trong Event List public. `ONGOING` event có hiển thị trong Event List public.

---

## 5. ASSUMPTIONS (Các giả định hiện tại)

* Guest và Volunteer nhìn thấy cùng một danh sách event public.
* Event Discovery không yêu cầu đăng nhập.
* Apply Event không thuộc feature này.
* Event Detail không thuộc feature này, nhưng Event List phải có nút hoặc hành động để chuyển sang Event Detail.
* Search ưu tiên theo tên event, nhưng cũng có thể match theo location, category, organization và skill.
* Search không cần match toàn bộ full description trong feature này.
* Filter bắt buộc có đủ: category, skill, organization, location, time, status.
* Location filter là text input, user tự nhập địa điểm.
* Time filter gồm: Today, This week, This month, Upcoming, Custom range.
* Status filter cho Guest/Volunteer chỉ gồm các status public/discoverable: `OPEN`, `FULL`, `ONGOING`.
* Filter options vẫn hiển thị kể cả khi không có event nào thuộc option đó. Có thể hiển thị số lượng `0` bên cạnh.
* Danh sách event dùng phân trang, mặc định 8 events/page.
* Sort mặc định là sự kiện sắp diễn ra gần nhất.
* User được đổi sort theo: Upcoming nearest, Newest, Most available slots.
* Required skills không hiển thị trong event card ở danh sách, mà chỉ hiển thị trong Event Detail.
* Event card trong danh sách cần hiển thị đủ thông tin cơ bản để user quyết định có bấm xem chi tiết hay không.
* Event `FULL` vẫn hiển thị trong danh sách nếu event chưa diễn ra, nhưng user không thể apply event đó.
* Event `CLOSED` không hiển thị trong Event List public.
* Event `ONGOING` có hiển thị trong Event List public.

---

## 6. OPEN QUESTIONS (Cần team liên quan review sau)

Các câu hỏi nghiệp vụ chính cho feature owner đã được chốt. Những điểm dưới đây không còn là blocker để viết `spec.md`/`plan.md`, nhưng cần được review với các member liên quan trước khi implement thật:

1. **Event status model cuối cùng có khớp với Staff Module không?**
   Dự kiến Member 3 — Staff Module là owner chính vì Staff tạo/sửa/xóa và quản lý event lifecycle.

2. **Category, Skill, Organization lấy từ source nào?**
   Dự kiến Member 4 — Manager Module là owner chính của các dữ liệu này.

3. **Filter options sẽ lấy từ API riêng của Manager Module hay một API tổng cho Event Discovery?**
   Đây là quyết định thuộc `plan.md`/API contract draft, không định nghĩa trong context.

4. **Event Detail route cuối cùng là gì?**
   Event Discovery chỉ cần có hành động View Detail. Route cụ thể sẽ được chốt ở feature Event Detail hoặc routing plan chung.

5. **Response format backend cuối cùng là gì?**
   Tạm thời plan dùng dạng `success/message/data`, nhưng format cuối cùng cần backend team thống nhất.

---

## 7. ANSWERS (Đã chốt nghiệp vụ)

* **A1:** Các trạng thái event được đề xuất gồm:

  * `DRAFT`: Staff đang tạo nháp, chưa public.
  * `OPEN`: Đang mở đăng ký.
  * `FULL`: Đã đủ số lượng volunteer nhưng event vẫn chưa diễn ra.
  * `CLOSED`: Đã đóng đăng ký.
  * `ONGOING`: Event đang diễn ra.
  * `COMPLETED`: Event đã hoàn thành.
  * `CANCELLED`: Event đã bị hủy.
  * `ARCHIVED`: Event đã được lưu trữ, không hiển thị public.
  * `DELETED`: Event đã bị xóa mềm hoặc không còn hiển thị public.

* **A2:** Các event `OPEN`, `FULL`, `ONGOING` sẽ hiển thị trong public Event List.

* **A3:** Các event `DRAFT`, `CLOSED`, `COMPLETED`, `CANCELLED`, `ARCHIVED`, `DELETED` sẽ bị ẩn khỏi public Event List.

* **A4:** Event `FULL` vẫn hiển thị trong Event List nếu event chưa diễn ra, nhưng user không thể apply event đó.

* **A5:** Event `CLOSED` không hiển thị trong Event List public.

* **A6:** Event `ONGOING` có hiển thị trong Event List public.

* **A7:** Guest và Volunteer nhìn thấy cùng một danh sách event public.

* **A8:** Người dùng được search theo tên event.

* **A9:** Keyword search có thể match theo:

  * event name
  * location
  * category
  * organization
  * skill

* **A10:** Search sẽ chạy tự động khi người dùng đang gõ. Khi implement nên dùng debounce khoảng 300–500ms để tránh xử lý quá nhiều lần.

* **A11:** Bản đầu tiên của Event Discovery cần đầy đủ các filter:

  * category
  * skill
  * organization
  * location
  * time
  * status

* **A12:** Location filter là text input, user tự nhập địa điểm.

* **A13:** Time filter gồm:

  * Today
  * This week
  * This month
  * Upcoming
  * Custom range

* **A14:** Status filter cho Guest/Volunteer chỉ gồm:

  * `OPEN`
  * `FULL`
  * `ONGOING`

* **A15:** User được kết hợp nhiều filter cùng lúc.

* **A16:** Khi user rời khỏi trang rồi quay lại, filter sẽ reset về trạng thái mặc định.

* **A17:** Filter options không bị ẩn nếu không có event phù hợp. Có thể hiển thị số lượng `0` bên cạnh option đó.

* **A18:** Mỗi event card/item trong danh sách cần hiển thị:

  * event title
  * event image/thumbnail nếu có
  * short description
  * category
  * organization name
  * date/time
  * location
  * event status
  * capacity hoặc remaining slots
  * nút View Detail

* **A19:** Event card cần hiển thị sức chứa hoặc số slot còn lại.

* **A20:** Required skills chỉ hiển thị trong Event Detail, không hiển thị trong Event List.

* **A21:** Organization cần hiển thị trong Event List.

* **A22:** Ngày/giờ và địa điểm bắt buộc phải hiển thị trong Event List.

* **A23:** Event List sử dụng phân trang với page size 8 events/page.

* **A24:** Sort mặc định là `Upcoming nearest`, tức là sự kiện sắp diễn ra gần nhất.

* **A25:** User được tự sort theo 3 loại:

  * Upcoming nearest
  * Newest
  * Most available slots

* **A26:** Owner chính của category filter data là Member 4 — Manager Module.

* **A27:** Owner chính của skill filter data là Member 4 — Manager Module.

* **A28:** Owner chính của organization filter data là Member 4 — Manager Module.

* **A29:** Owner chính của event status model dự kiến là Member 3 — Staff Module.

* **A30:** Khi module khác chưa sẵn sàng, Member 2 được dùng mock events, mock categories, mock skills, mock organizations và mock event statuses trong service layer tạm thời. Mock data chỉ dùng để dựng UI và test luồng, không được coi là database/API chính thức.

* **A31:** Frontend feature folder được chốt trong plan là `frontend/src/features/volunteer-events/discovery/`, nhưng chi tiết folder/component thuộc `plan.md`, không phải quyết định của context.

* **A32:** API route draft được chốt trong plan là `GET /api/v1/events`, nhưng API contract không được định nghĩa chi tiết trong context.

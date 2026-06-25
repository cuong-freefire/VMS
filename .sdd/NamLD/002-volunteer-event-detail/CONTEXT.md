# CONTEXT.md — Volunteer Event Detail

# Người viết: NamLD (Member 2) | Ngày: 2026-06-25

## 1. PROBLEM STATEMENT

Hệ thống VMS cần một màn hình giúp Guest và Volunteer xem thông tin chi tiết của một sự kiện tình nguyện trước khi quyết định đăng ký tham gia.

Ở feature `001-volunteer-event-discovery`, người dùng chỉ xem được thông tin tóm tắt của event như title, short description, category, organization, date/time, location, status, capacity và remaining slots. Tuy nhiên, để đưa ra quyết định có tham gia hay không, người dùng cần nhiều thông tin hơn như mô tả đầy đủ, kỹ năng yêu cầu, thời gian chi tiết, địa điểm chi tiết, tổ chức phụ trách, điều kiện tham gia, trạng thái còn slot hay không, và hành động tiếp theo.

Feature này tập trung vào phần Volunteer-facing Event Detail, bao gồm:

* Xem thông tin chi tiết của một event public/discoverable.
* Hiển thị đầy đủ thông tin event để Guest/Volunteer hiểu rõ sự kiện.
* Hiển thị required skills của event.
* Hiển thị organization summary.
* Hiển thị capacity, registered count và remaining slots.
* Hiển thị trạng thái event và khả năng apply.
* Cung cấp entry point sang Apply Event feature nếu user đủ điều kiện.

Feature này không xử lý logic submit application, không xử lý approve/reject application, không xử lý attendance, certificate, notification, donation hoặc reporting.

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

* **Related Screens:**

  * Event Detail

* **Related Actors:**

  * Guest
  * Volunteer

* **Guest:** Người dùng chưa đăng nhập. Guest được xem Event Detail của event public. Guest không được apply trực tiếp nếu chưa đăng nhập.

* **Volunteer:** Người dùng đã đăng nhập với vai trò Volunteer. Volunteer được xem Event Detail và có thể đi tiếp sang Apply Event nếu event còn cho phép đăng ký.

* **Event Detail:** Màn hình hiển thị đầy đủ thông tin của một event, giúp người dùng quyết định có muốn apply hay không.

* **Public/Discoverable Event:** Event đủ điều kiện hiển thị cho Guest/Volunteer. Theo feature 001, các status public/discoverable gồm `OPEN`, `FULL`, `ONGOING`.

* **Hidden Event:** Event không được hiển thị cho Guest/Volunteer ở public flow. Theo feature 001, các status bị ẩn gồm `DRAFT`, `CLOSED`, `COMPLETED`, `CANCELLED`, `ARCHIVED`, `DELETED`.

* **Required Skills:** Danh sách kỹ năng liên quan hoặc yêu cầu để tham gia event. Trong feature 001, required skills không hiển thị ở Event List; sang feature này, required skills phải được hiển thị rõ trong Event Detail.

* **Capacity:** Số lượng volunteer tối đa mà event có thể nhận.

* **Registered Count:** Số lượng volunteer đã đăng ký hoặc đã được tính vào event tùy theo rule của Application Module.

* **Remaining Slots:** Số slot còn lại của event. Có thể tính theo công thức `capacity - registeredCount`.

* **Can Apply:** Trạng thái cho biết user có thể đi tiếp sang Apply Event hay không. Đây chỉ là thông tin hiển thị/entry point ở Event Detail; logic submit application thật thuộc feature `003-volunteer-event-application`.

---

## 3. STAKEHOLDERS

* **Guest:** Cần xem chi tiết sự kiện trước khi quyết định đăng ký tài khoản hoặc đăng nhập để apply.

* **Volunteer:** Cần xem thông tin đầy đủ của event để quyết định có apply hay không.

* **NamLD / Member 2:** Chịu trách nhiệm chính với luồng Volunteer-facing Event Detail.

* **Member 1 — Authentication + Profile:** Liên quan đến trạng thái đăng nhập của user. Nếu Guest muốn apply, hệ thống cần điều hướng sang login/register hoặc yêu cầu đăng nhập ở feature Apply Event.

* **Member 3 — Staff Module:** Chịu trách nhiệm tạo, sửa, xóa và quản lý dữ liệu event. Event Detail phụ thuộc vào dữ liệu event do Staff Module tạo ra.

* **Member 4 — Manager Module:** Chịu trách nhiệm quản lý category, skill và organization. Event Detail hiển thị category, required skills và organization từ dữ liệu của module này.

* **Member 5 — Admin Module:** Có thể liên quan đến notification, certificate, donation hoặc reporting, nhưng không trực tiếp quản lý Event Detail.

---

## 4. CONSTRAINTS (Ràng buộc cứng)

* **SDD Workflow:** Feature này phải đi theo thứ tự `context.md` → `spec.md` → `plan.md` → `tasks.md` → implementation.

* **No Implementation in Context:** File context này không được định nghĩa database schema, API contract, route, component, migration hoặc code task.

* **Scope Boundary:** Feature này chỉ bao gồm xem chi tiết một event public/discoverable. Apply Event, submit application, Applied Events, Cancel Application và Volunteer History sẽ được làm ở feature riêng.

* **Role Boundary:** Guest và Volunteer đều có thể xem Event Detail của event public/discoverable. Guest không được submit apply nếu chưa đăng nhập.

* **Data Ownership:** Member 2 không quản lý event lifecycle, category, skill hoặc organization. Member 2 chỉ sử dụng dữ liệu đã được quản lý bởi module khác.

* **Status Visibility:** Event Detail chỉ hiển thị các event public/discoverable gồm `OPEN`, `FULL`, `ONGOING`. Các event `DRAFT`, `CLOSED`, `COMPLETED`, `CANCELLED`, `ARCHIVED`, `DELETED` không được hiển thị ở public Event Detail.

* **Apply Boundary:** Feature này có thể hiển thị nút hoặc entry point Apply, nhưng không xử lý submit application thật. Submit application thuộc feature `003-volunteer-event-application`.

* **FULL Event Rule:** Event `FULL` vẫn có thể xem detail nếu chưa diễn ra hoặc vẫn public, nhưng user không thể apply.

* **ONGOING Event Rule:** Event `ONGOING` vẫn có thể xem detail, nhưng user không thể apply.

* **CLOSED Event Rule:** Event `CLOSED` không hiển thị trong Event List public và cũng không hiển thị trong Event Detail public.

* **Mock Data:** Trong giai đoạn đầu, Member 2 có thể dùng mock event detail data để dựng UI/phôi. Mock data không phải source of truth và phải được thay bằng API/data thật sau khi team chốt plan/API contract.

---

## 5. ASSUMPTIONS (Các giả định hiện tại)

* Event Detail được mở từ Event List hoặc từ link trực tiếp.
* Event Detail không yêu cầu đăng nhập nếu event là public/discoverable.
* Guest và Volunteer nhìn thấy cùng nội dung chi tiết cơ bản của event.
* Apply action thật không thuộc feature này.
* Event Detail cần hiển thị nhiều thông tin hơn Event Card ở Event List.
* Required skills sẽ hiển thị trong Event Detail.
* Organization summary sẽ hiển thị trong Event Detail.
* Category sẽ hiển thị trong Event Detail.
* Event date/time và location phải hiển thị rõ hơn Event List.
* Event capacity, registered count và remaining slots cần hiển thị để user biết event còn chỗ hay không.
* Event status cần hiển thị rõ.
* Event `OPEN` có thể cho user đi tiếp sang Apply Event.
* Event `FULL` không cho apply.
* Event `ONGOING` không cho apply.
* Event `CLOSED` không hiển thị public.
* Event `DRAFT`, `COMPLETED`, `CANCELLED`, `ARCHIVED`, `DELETED` không hiển thị public.
* Nếu event không tồn tại hoặc không public/discoverable, hệ thống hiển thị not found hoặc unavailable state.
* Nếu event thiếu image/thumbnail, UI cần fallback ổn định.
* Nếu user là Guest và bấm Apply trên event `OPEN`, hệ thống nên yêu cầu đăng nhập hoặc chuyển sang login/register flow.
* Nếu user là Volunteer và event `OPEN`, nút Apply có thể điều hướng sang Apply Event feature.
* Nếu user đã apply event rồi, trạng thái này có thể ảnh hưởng đến nút Apply, nhưng rule chính xác sẽ được xử lý ở Apply Event hoặc Applied Events feature.

---

## 6. OPEN QUESTIONS (Cần team liên quan review sau)

Các câu hỏi dưới đây không còn là blocker để viết `spec.md`/`plan.md`, nhưng cần review với các member liên quan trước khi implement thật:

1. **Event Detail route cuối cùng là gì?**
   Có dùng slug hay id? Đề xuất để plan xử lý, ví dụ `/events/:slug` hoặc `/events/:id`.

2. **Guest bấm Apply thì điều hướng sang Login hay Register?**
   Dự kiến ưu tiên Login, kèm link Register nếu chưa có tài khoản. Cần thống nhất với Member 1.

3. **Volunteer đã apply rồi thì nút Apply hiển thị thế nào?**
   Có thể hiển thị `Already applied` hoặc `View application status`. Cần thống nhất với feature Applied Events / Application Module.

4. **Registered count được tính theo số đơn PENDING hay APPROVED?**
   Cần thống nhất với Member 3/Application Module vì ảnh hưởng remaining slots.

5. **Donation có hiển thị trên Event Detail không?**
   Donation/payment là module riêng, nên feature này chưa xử lý. Nếu cần entry point donation, sẽ làm ở feature/module riêng.

6. **Organization detail có link sang Organization Detail không?**
   Event Detail có thể hiển thị organization summary trước, còn link sang Organization Detail cần review với Member 4/Admin.

7. **Map/location detail có cần hiển thị không?**
   Bản đầu có thể chỉ hiển thị text location/address. Map integration chưa bắt buộc.

8. **Related events hoặc recommended events có cần không?**
   Không bắt buộc trong feature này. Có thể để future enhancement.

---

## 7. ANSWERS (Đã chốt nghiệp vụ)

* **A1:** Feature này tương ứng với UC09 — View Event Detail.

* **A2:** Guest và Volunteer đều được xem Event Detail nếu event là public/discoverable.

* **A3:** Event Detail chỉ hiển thị event có status:

  * `OPEN`
  * `FULL`
  * `ONGOING`

* **A4:** Event Detail không hiển thị các event có status:

  * `DRAFT`
  * `CLOSED`
  * `COMPLETED`
  * `CANCELLED`
  * `ARCHIVED`
  * `DELETED`

* **A5:** Event `OPEN` có thể hiển thị entry point Apply.

* **A6:** Event `FULL` vẫn xem được detail nhưng không thể apply.

* **A7:** Event `ONGOING` vẫn xem được detail nhưng không thể apply.

* **A8:** Event `CLOSED` không hiển thị trong public Event Detail.

* **A9:** Event Detail phải hiển thị thông tin cơ bản:

  * event title
  * full description
  * short description nếu cần
  * image/thumbnail nếu có
  * category
  * organization summary
  * date/time
  * location/address
  * event status
  * capacity
  * registered count
  * remaining slots
  * required skills

* **A10:** Required skills phải hiển thị trong Event Detail.

* **A11:** Organization name/summary phải hiển thị trong Event Detail.

* **A12:** Event Detail cần có fallback nếu event không có image.

* **A13:** Nếu event không tồn tại, không public, hoặc bị ẩn, hệ thống hiển thị not found/unavailable state.

* **A14:** Apply Event không thuộc feature này. Feature này chỉ cung cấp entry point sang Apply Event nếu phù hợp.

* **A15:** Guest bấm Apply nên được yêu cầu đăng nhập hoặc chuyển sang login/register flow. Cần thống nhất chi tiết với Authentication feature.

* **A16:** Volunteer bấm Apply trên event `OPEN` sẽ được điều hướng sang Apply Event feature.

* **A17:** Volunteer không được apply nếu event `FULL` hoặc `ONGOING`.

* **A18:** Event Detail không xử lý submit application, cancel application, approve/reject application, attendance, feedback, certificate, donation/payment hoặc reporting.

* **A19:** Event Detail phụ thuộc Member 3 về event data, event lifecycle, capacity, registered count và status rules.

* **A20:** Event Detail phụ thuộc Member 4 về category, skill và organization data.

* **A21:** Khi module khác chưa sẵn sàng, Member 2 được dùng mock event detail data trong service layer tạm thời. Mock data chỉ dùng để dựng UI và test luồng, không được coi là database/API chính thức.

* **A22:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau (`plan.md`, `api-contract.md`, `database.md`, `tasks.md`), không định nghĩa trong context.

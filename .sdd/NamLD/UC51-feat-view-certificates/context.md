# CONTEXT.md — View Certificates (UC51)

# Người viết: NamLD (Member 2) | Ngày: 2026-06-27

## 1. PROBLEM STATEMENT

Volunteer Event Management System cần chức năng cho phép Volunteer xem các certificate mà mình đã nhận được sau khi tham gia event hợp lệ.

Sau khi Volunteer apply event, được Staff approve, tham gia event, được ghi nhận attendance hợp lệ và Staff generate certificate, Volunteer cần có một nơi để xem danh sách certificate của mình. Certificate là bằng chứng hoặc ghi nhận cho việc Volunteer đã tham gia event, nên dữ liệu này phải được bảo vệ theo tài khoản Volunteer hiện tại.

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

Trong file này, phạm vi chỉ tập trung vào **UC51 — View Certificates**.

UC51 cần đảm bảo:

* Chỉ Volunteer đã đăng nhập mới xem được certificate của mình.
* Guest không được xem certificate.
* Staff, Manager và Admin không dùng Volunteer View Certificates flow.
* Volunteer chỉ được xem certificate thuộc về chính mình.
* Volunteer không được xem certificate của Volunteer khác.
* Certificate được tạo bởi Staff ở UC53 — Generate Certificate.
* UC51 chỉ hiển thị certificate đã tồn tại hoặc certificate được phép hiển thị cho Volunteer.
* Mỗi certificate nên gắn với một event và một Volunteer.
* Certificate list cần hiển thị thông tin tóm tắt như event title, organization, issue date, certificate status và action liên quan.
* Nếu có Certificate Detail/Preview, nó vẫn thuộc phạm vi xem certificate của UC51, không cần tách UC riêng.
* Download certificate là UC52, có thể xuất hiện như một action trong cùng màn Certificates nhưng logic download chi tiết thuộc UC52.
* Hệ thống cần có loading state, empty state, unavailable state và error state.

Lưu ý quan trọng:

UC51 — View Certificates và UC52 — Download Certificate được viết thành hai folder context/spec riêng theo format team. Tuy nhiên, khi implementation, hai use case này nên được code chung trong cùng một màn hình Certificates. UC51 là phần xem danh sách/chi tiết certificate, còn UC52 là action download certificate. Codex không nên tạo một màn hình riêng chỉ để download certificate nếu không cần.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Volunteer Event.

* **Use Case:** UC51 — View Certificates.

* **Feature Folder:** `UC51-feat-view-certificates`.

* **Main Related UC trong cùng màn Certificates:**

  * UC52 — Download Certificate

* **Previous / Related Use Cases trong phần Member 2:**

  * UC08 — View Event List
  * UC09 — View Event Detail
  * UC10 — Search Event
  * UC11 — Filter Event
  * UC12 — Apply Event
  * UC13 — View Applied Events
  * UC14 — Cancel Application
  * UC48 — Submit Feedback

* **Connected UC ngoài phần Member 2:**

  * UC03 — Login
  * UC04 — Register
  * UC21 — View Volunteer History
  * UC24 — Approve Application
  * UC25 — Reject Application
  * UC45 — Attendance Check
  * UC46 — View Attendance List
  * UC47 — View Attendance History
  * UC53 — Generate Certificate
  * UC66 — Certificate Email

* **Guest:** Guest không phải role được lưu trong database. Guest là trạng thái người dùng chưa đăng nhập. Guest không được xem certificate vì certificate là dữ liệu cá nhân của Volunteer.

* **Volunteer:** Volunteer là user đã đăng nhập với role `VOLUNTEER`. Volunteer là actor chính của UC51 và chỉ được xem certificate của chính mình.

* **Staff:** Staff là user có role `STAFF`, phụ trách attendance và generate certificate ở module của Member 3. Staff không dùng UC51 để xem certificate theo giao diện Volunteer.

* **Manager:** Manager là user có role `MANAGER`, phụ trách category, skill hoặc các nghiệp vụ quản lý khác. Manager không dùng UC51.

* **Admin:** Admin là user có role `ADMIN`, phụ trách quản trị hệ thống. Admin không dùng UC51 theo Volunteer flow.

* **Certificate:** Chứng nhận hoặc giấy ghi nhận Volunteer đã tham gia event hợp lệ.

* **View Certificates:** Hành động Volunteer xem danh sách certificate của mình.

* **Certificate List:** Màn hình hoặc section hiển thị danh sách certificate thuộc về Volunteer hiện tại.

* **Certificate Detail / Preview:** Phần hiển thị thông tin chi tiết của một certificate nếu team muốn hỗ trợ. Đây vẫn thuộc UC51, không phải UC riêng trong assignment.

* **Download Certificate:** Action tải certificate file. Logic download thuộc UC52.

* **Generate Certificate:** Hành động Staff tạo certificate cho Volunteer sau khi attendance hợp lệ. Generate Certificate thuộc UC53 của Member 3, không thuộc UC51.

* **Certificate Owner:** Volunteer sở hữu certificate. Ownership phải dựa trên current authenticated Volunteer.

* **Certificate Status:** Trạng thái certificate nếu hệ thống có dùng, ví dụ `AVAILABLE`, `GENERATING`, `REVOKED` hoặc `UNAVAILABLE`.

* **Certificate File:** File certificate, có thể là PDF hoặc image/file URL. UC51 có thể hiển thị certificate có file hay chưa; download file thuộc UC52.

* **Issue Date:** Ngày certificate được phát hành hoặc generate.

* **Certificate Code:** Mã certificate nếu hệ thống có hỗ trợ để nhận diện hoặc xác minh certificate.

* **Event Summary:** Thông tin event liên quan đến certificate, ví dụ event title, organization, event date và location.

* **Attendance Dependency:** Certificate thường chỉ được generate cho Volunteer đã attendance hợp lệ.

---

## 3. STAKEHOLDERS

* **Volunteer:** Cần xem danh sách certificate mình đã nhận được sau khi tham gia event.

* **NamLD / Member 2:** Chịu trách nhiệm chính với UC51 — View Certificates.

* **Member 1 — Authentication + Profile + Email Services:** Phụ trách Login/Register, Profile và Email Services. UC51 phụ thuộc authentication để biết current user là ai; Certificate Email UC66 thuộc Member 1.

* **Member 3 — Event & Application Management:** Phụ trách Attendance Check và Generate Certificate. UC51 phụ thuộc certificate data được tạo từ UC53.

* **Member 4 — Admin & Manager Management:** Không trực tiếp xử lý certificate view, nhưng có thể liên quan gián tiếp qua user/category/skill data.

* **Member 5 — Organization + Notification + Dashboard + Payment:** Không trực tiếp xử lý certificate view, nhưng organization data có thể được hiển thị trong certificate summary.

---

## 4. CONSTRAINTS

* **SDD Workflow:** Use case này phải được viết theo thứ tự `context.md` → `spec.md` trước khi sang plan/tasks/implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, frontend component chi tiết, backend route, migration hoặc code.

* **Authentication Required:** UC51 yêu cầu user đã đăng nhập.

* **Role Boundary:** Chỉ user có role `VOLUNTEER` mới được xem certificate theo Volunteer flow.

* **Guest Boundary:** Guest không được xem certificate.

* **Staff/Manager/Admin Boundary:** Staff, Manager và Admin không dùng UC51 theo Volunteer flow.

* **Ownership Boundary:** Volunteer chỉ được xem certificate của chính mình.

* **Privacy Boundary:** Certificate của Volunteer khác không được hiển thị cho current Volunteer.

* **Generate Boundary:** UC51 không generate certificate. Generate Certificate thuộc UC53 của Member 3.

* **Download Boundary:** UC51 không xử lý download file chi tiết. Download Certificate thuộc UC52.

* **Shared Screen Boundary:** UC51 và UC52 là các use case riêng nhưng nên implement chung trên cùng một màn Certificates.

* **Codex Implementation Boundary:** Khi sinh code, Codex không nên tạo một page riêng chỉ để download certificate. Download action nên nằm trong Certificate List hoặc Certificate Detail của UC51 và logic thuộc UC52.

* **Attendance Boundary:** UC51 không thực hiện Attendance Check. Attendance Check thuộc UC45 của Member 3.

* **Volunteer History Boundary:** UC51 không implement Volunteer History. UC21 thuộc Member 1.

* **Feedback Boundary:** UC51 không submit feedback. Submit Feedback thuộc UC48.

* **Application Boundary:** UC51 không apply event, không cancel application và không approve/reject application.

* **Certificate Availability Boundary:** UC51 chỉ hiển thị certificate đã tồn tại hoặc có trạng thái được phép hiển thị cho Volunteer.

* **File Missing Boundary:** Nếu certificate tồn tại nhưng file chưa available, UC51 có thể hiển thị status phù hợp; UC52 không được download khi chưa có file hợp lệ.

* **Revoked Boundary:** Nếu certificate bị revoked hoặc unavailable, UC51 cần hiển thị trạng thái rõ ràng và không cho hiểu nhầm là certificate có thể sử dụng bình thường.

* **Pagination Boundary:** Certificate List nên có pagination hoặc loading strategy nếu số lượng certificate nhiều.

* **Mock Data:** Có thể dùng mock certificates data trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS

* Guest là trạng thái chưa đăng nhập, không phải role lưu trong database.
* Role trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.
* UC51 chỉ dành cho authenticated Volunteer.
* Guest không được xem certificate.
* Staff, Manager và Admin không dùng UC51 theo Volunteer flow.
* Volunteer chỉ được xem certificate thuộc về chính mình.
* Certificate được tạo bởi Staff thông qua UC53 — Generate Certificate.
* Certificate thường chỉ được tạo cho Volunteer đã attendance hợp lệ.
* UC51 không kiểm tra attendance trực tiếp mà chỉ consume certificate data đã được generate/available.
* UC51 có thể hiển thị Certificate List.
* UC51 có thể hiển thị Certificate Detail hoặc Certificate Preview nếu team muốn, nhưng không cần tách UC riêng.
* UC51 nên hiển thị event title liên quan đến certificate.
* UC51 nên hiển thị organization nếu dữ liệu có sẵn.
* UC51 nên hiển thị issue date nếu dữ liệu có sẵn.
* UC51 nên hiển thị certificate status nếu dữ liệu có sẵn.
* UC51 có thể hiển thị certificate code nếu dữ liệu có sẵn.
* UC51 có thể hiển thị download action nếu certificate có file hợp lệ, nhưng xử lý download thuộc UC52.
* UC52 Download Certificate nên được implement như action trong cùng Certificates page hoặc Certificate Detail.
* Nếu Volunteer chưa có certificate nào, UI cần hiển thị empty state.
* Nếu certificate list đang tải, UI cần hiển thị loading state.
* Nếu certificate không tồn tại, không thuộc current Volunteer hoặc không available, UI cần hiển thị unavailable/not found state.
* Nếu tải certificate list/detail thất bại, UI cần hiển thị error state.
* Nếu certificate thiếu optional data như organization, certificate code hoặc thumbnail, UI không được crash.
* Backend/API phải enforce cuối cùng cho authentication, role và ownership.
* Database/API thật cần được thống nhất sau khi spec/plan/api-contract được viết.

---

## 6. OPEN QUESTIONS

### Q1. Ai được xem certificates?

**Answer:** Chỉ authenticated Volunteer được xem certificate của chính mình.

---

### Q2. Guest có được xem certificate không?

**Answer:** Không. Certificate là dữ liệu cá nhân của Volunteer, Guest phải login trước.

---

### Q3. Staff, Manager, Admin có dùng UC51 không?

**Answer:** Không. UC51 là Volunteer View Certificates flow. Staff generate certificate ở UC53, còn Manager/Admin có module riêng.

---

### Q4. Volunteer có được xem certificate của người khác không?

**Answer:** Không. Volunteer chỉ được xem certificate thuộc tài khoản của mình.

---

### Q5. UC51 có generate certificate không?

**Answer:** Không. Generate Certificate thuộc UC53 của Member 3.

---

### Q6. UC51 có download certificate không?

**Answer:** UC51 có thể hiển thị download action nếu certificate có file hợp lệ, nhưng logic download chi tiết thuộc UC52 — Download Certificate.

---

### Q7. UC51 và UC52 có cần làm hai màn hình riêng không?

**Answer:** Không cần. Hai UC này tách docs để rõ use case, nhưng khi code nên nằm chung trong cùng Certificates page hoặc Certificate Detail. UC52 là action download trong UC51.

---

### Q8. Certificate Detail có phải UC riêng không?

**Answer:** Không theo assignment mới. Nếu cần hiển thị detail/preview, nó có thể nằm trong phạm vi UC51 — View Certificates.

---

### Q9. Certificate cần hiển thị thông tin gì?

**Answer:** Bản đầu nên hiển thị:

* certificate title hoặc event title;
* event title;
* organization nếu có;
* event date hoặc completion date nếu có;
* issue date nếu có;
* certificate status nếu có;
* certificate code nếu có;
* View Detail/Preview action nếu team muốn;
* Download action nếu file hợp lệ, nhưng logic download thuộc UC52.

---

### Q10. Nếu Volunteer chưa có certificate thì sao?

**Answer:** Hệ thống hiển thị empty state phù hợp, ví dụ thông báo rằng Volunteer chưa có certificate nào.

---

### Q11. Nếu certificate tồn tại nhưng file chưa available thì sao?

**Answer:** UC51 có thể hiển thị certificate status như unavailable/generating; UC52 không được download nếu chưa có file hợp lệ.

---

### Q12. Nếu certificate đã revoked thì sao?

**Answer:** Hệ thống cần hiển thị trạng thái revoked/unavailable rõ ràng và không cho hiểu nhầm certificate vẫn sử dụng bình thường.

---

### Q13. Backend hay frontend là nơi chốt ownership?

**Answer:** Backend/API phải enforce ownership cuối cùng. Frontend chỉ hiển thị dữ liệu được phép.

---

## 7. ANSWERS / ANSWERS TO OPEN QUESTIONS

* **A1:** UC51 — View Certificates thuộc Member 2 / Volunteer Event.

* **A2:** UC51 chỉ dành cho authenticated Volunteer.

* **A3:** Guest không được xem certificate.

* **A4:** Staff, Manager và Admin không dùng UC51 theo Volunteer flow.

* **A5:** Guest không phải role lưu trong database.

* **A6:** Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **A7:** Volunteer chỉ được xem certificate của chính mình.

* **A8:** Certificate được tạo bởi Staff ở UC53 — Generate Certificate.

* **A9:** UC51 không generate certificate.

* **A10:** UC51 không xử lý download file chi tiết.

* **A11:** Download Certificate thuộc UC52.

* **A12:** UC51 và UC52 nên implement chung trong một Certificates page hoặc Certificate Detail.

* **A13:** Codex không nên tạo page riêng chỉ để download certificate nếu không cần.

* **A14:** Certificate Detail/Preview nếu có thì thuộc phạm vi UC51, không phải UC riêng theo assignment mới.

* **A15:** Certificate list item nên hiển thị event/certificate title, organization, issue date, status và download/view action nếu phù hợp.

* **A16:** UC51 có thể hiển thị certificate code nếu dữ liệu có sẵn.

* **A17:** UC51 có thể hiển thị download action nếu certificate có file hợp lệ, nhưng xử lý download thuộc UC52.

* **A18:** Nếu certificate chưa có file hợp lệ, UC51 cần hiển thị status phù hợp.

* **A19:** Nếu certificate bị revoked/unavailable, UC51 cần hiển thị trạng thái rõ ràng.

* **A20:** UC51 cần loading state.

* **A21:** UC51 cần empty state nếu Volunteer chưa có certificate.

* **A22:** UC51 cần unavailable/not found state nếu certificate không tồn tại hoặc không thuộc current Volunteer.

* **A23:** UC51 cần error state nếu tải dữ liệu thất bại.

* **A24:** UC51 không xử lý Attendance Check.

* **A25:** Attendance Check thuộc UC45 của Member 3.

* **A26:** UC51 không xử lý Volunteer History.

* **A27:** Volunteer History thuộc UC21 của Member 1.

* **A28:** Backend/API phải enforce authentication, role và ownership cuối cùng.

* **A29:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau, không định nghĩa trong context.

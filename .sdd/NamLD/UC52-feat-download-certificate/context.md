# CONTEXT.md — Download Certificate (UC52)

# Người viết: NamLD (Member 2) | Ngày: 2026-06-27

## 1. PROBLEM STATEMENT

Volunteer Event Management System cần chức năng cho phép Volunteer tải certificate của chính mình sau khi certificate đã được tạo và có file hợp lệ.

Ở UC51 — View Certificates, Volunteer có thể xem danh sách certificate đã được cấp sau khi tham gia event hợp lệ. Tuy nhiên, chỉ xem certificate trên hệ thống là chưa đủ. Volunteer cần có khả năng tải certificate về máy để lưu trữ, in ra, hoặc sử dụng làm minh chứng tham gia hoạt động tình nguyện.

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

Trong file này, phạm vi chỉ tập trung vào **UC52 — Download Certificate**.

UC52 cần đảm bảo:

* Chỉ Volunteer đã đăng nhập mới được download certificate của mình.
* Guest không được download certificate.
* Staff, Manager và Admin không dùng Volunteer Download Certificate flow.
* Volunteer chỉ được download certificate thuộc về chính mình.
* Volunteer không được download certificate của Volunteer khác.
* Certificate phải tồn tại và thuộc current Volunteer.
* Certificate phải có trạng thái hợp lệ để download.
* Certificate phải có file/download data hợp lệ.
* Certificate bị revoked, unavailable hoặc chưa generate xong thì không được download như certificate bình thường.
* Download action nên xuất hiện trong màn UC51 — View Certificates hoặc Certificate Detail/Preview.
* UC52 không generate certificate. Generate Certificate thuộc UC53 của Member 3.
* Hệ thống cần có downloading/loading state, success state và error state.

Lưu ý quan trọng:

UC51 — View Certificates và UC52 — Download Certificate được viết thành hai folder context/spec riêng theo format team. Tuy nhiên, khi implementation, hai use case này nên được code chung trong cùng một màn hình Certificates. UC51 là phần xem danh sách/chi tiết certificate, còn UC52 là action tải certificate. Codex không nên tạo một màn hình riêng chỉ để download certificate nếu không cần.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Volunteer Event.

* **Use Case:** UC52 — Download Certificate.

* **Feature Folder:** `UC52-feat-download-certificate`.

* **Main Related UC trong cùng màn Certificates:**

  * UC51 — View Certificates

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

* **Guest:** Guest không phải role được lưu trong database. Guest là trạng thái người dùng chưa đăng nhập. Guest không được download certificate vì certificate là dữ liệu cá nhân của Volunteer.

* **Volunteer:** Volunteer là user đã đăng nhập với role `VOLUNTEER`. Volunteer là actor chính của UC52 và chỉ được download certificate của chính mình.

* **Staff:** Staff là user có role `STAFF`, phụ trách Attendance Check và Generate Certificate ở module của Member 3. Staff không dùng UC52 theo Volunteer download flow.

* **Manager:** Manager là user có role `MANAGER`, phụ trách category, skill hoặc các nghiệp vụ quản lý khác. Manager không dùng UC52 theo Volunteer flow.

* **Admin:** Admin là user có role `ADMIN`, phụ trách quản trị hệ thống. Admin không dùng UC52 theo Volunteer flow.

* **Certificate:** Chứng nhận hoặc giấy ghi nhận Volunteer đã tham gia event hợp lệ.

* **Download Certificate:** Hành động Volunteer tải certificate file về thiết bị.

* **Certificate File:** File certificate có thể là PDF hoặc image/file hợp lệ tùy quyết định của team.

* **Download Action:** Nút hoặc action download được hiển thị trong Certificate List hoặc Certificate Detail của UC51.

* **Certificate Owner:** Volunteer sở hữu certificate. Ownership phải dựa trên current authenticated Volunteer.

* **Certificate Status:** Trạng thái certificate nếu hệ thống có dùng, ví dụ `AVAILABLE`, `GENERATING`, `REVOKED` hoặc `UNAVAILABLE`.

* **AVAILABLE:** Certificate đã sẵn sàng và có thể download nếu file hợp lệ.

* **GENERATING:** Certificate đang được tạo hoặc chưa có file hoàn chỉnh. Không được download như certificate available.

* **REVOKED:** Certificate đã bị thu hồi hoặc không còn hợp lệ. Không được download như certificate bình thường.

* **UNAVAILABLE:** Certificate không khả dụng để download.

* **Download URL / File URL:** Dữ liệu dùng để tải certificate file. Dữ liệu này cần được bảo vệ bởi authorization, không được để Volunteer truy cập certificate của người khác.

* **Generate Certificate:** Hành động Staff tạo certificate cho Volunteer sau khi attendance hợp lệ. Generate Certificate thuộc UC53, không thuộc UC52.

* **Certificate Email:** Email gửi certificate hoặc thông báo certificate nếu hệ thống hỗ trợ. UC66 thuộc Member 1, không thuộc UC52.

---

## 3. STAKEHOLDERS

* **Volunteer:** Cần tải certificate của mình về máy để lưu trữ, in ra hoặc sử dụng làm minh chứng.

* **NamLD / Member 2:** Chịu trách nhiệm chính với UC52 — Download Certificate.

* **Member 1 — Authentication + Profile + Email Services:** Phụ trách Login/Register và Email Services. UC52 phụ thuộc authentication để biết current user là ai; Certificate Email UC66 thuộc Member 1.

* **Member 3 — Event & Application Management:** Phụ trách Attendance Check và Generate Certificate. UC52 phụ thuộc certificate file/data được tạo từ UC53.

* **Member 4 — Admin & Manager Management:** Không trực tiếp xử lý download certificate, nhưng có thể liên quan gián tiếp qua user/category/skill data.

* **Member 5 — Organization + Notification + Dashboard + Payment:** Không trực tiếp xử lý download certificate, nhưng organization data có thể được hiển thị trong certificate.

---

## 4. CONSTRAINTS

* **SDD Workflow:** Use case này phải được viết theo thứ tự `context.md` → `spec.md` trước khi sang plan/tasks/implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, frontend component chi tiết, backend route, migration hoặc code.

* **Authentication Required:** UC52 yêu cầu user đã đăng nhập.

* **Role Boundary:** Chỉ user có role `VOLUNTEER` mới được download certificate theo Volunteer flow.

* **Guest Boundary:** Guest không được download certificate.

* **Staff/Manager/Admin Boundary:** Staff, Manager và Admin không dùng UC52 theo Volunteer flow.

* **Ownership Boundary:** Volunteer chỉ được download certificate thuộc về chính mình.

* **Privacy Boundary:** Certificate của Volunteer khác không được download bởi current Volunteer.

* **View Certificates Boundary:** UC52 nên được kích hoạt từ UC51 — View Certificates hoặc Certificate Detail/Preview.

* **Shared Screen Boundary:** UC51 và UC52 là các use case riêng nhưng nên implement chung trên cùng một màn Certificates.

* **Codex Implementation Boundary:** Khi sinh code, Codex không nên tạo một page riêng chỉ để download certificate. Download action nên nằm trong Certificate List hoặc Certificate Detail của UC51.

* **Generate Boundary:** UC52 không generate certificate. Generate Certificate thuộc UC53 của Member 3.

* **Attendance Boundary:** UC52 không thực hiện Attendance Check. Attendance Check thuộc UC45 của Member 3.

* **Certificate Email Boundary:** UC52 không gửi certificate email. Certificate Email thuộc UC66 của Member 1.

* **File Availability Boundary:** Certificate chỉ được download nếu có file/download data hợp lệ.

* **Status Boundary:** Certificate phải ở trạng thái hợp lệ, ví dụ `AVAILABLE`, mới được download.

* **Generating Boundary:** Certificate đang `GENERATING` hoặc chưa có file thì không được download.

* **Revoked Boundary:** Certificate `REVOKED` hoặc unavailable không được download như certificate bình thường.

* **Security Boundary:** Download phải được kiểm tra quyền truy cập. Không được chỉ dựa vào URL phía frontend nếu URL có thể bị đoán hoặc chia sẻ.

* **Error Boundary:** Nếu file không tồn tại, file expired, file bị lỗi, certificate không thuộc user, hoặc hệ thống tải file thất bại, UI cần hiển thị error rõ ràng.

* **Download State Boundary:** UI cần có trạng thái downloading/loading để Volunteer biết request đang xử lý.

* **Mock Data:** Có thể dùng mock download result trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS

* Guest là trạng thái chưa đăng nhập, không phải role lưu trong database.
* Role trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.
* UC52 chỉ dành cho authenticated Volunteer.
* Guest không được download certificate.
* Staff, Manager và Admin không dùng UC52 theo Volunteer flow.
* Volunteer chỉ được download certificate thuộc về chính mình.
* UC52 thường được kích hoạt từ UC51 — View Certificates.
* UC52 không cần một page riêng nếu download action có thể xử lý trong Certificate List hoặc Certificate Detail.
* Certificate được tạo bởi Staff thông qua UC53 — Generate Certificate.
* Certificate thường chỉ được tạo cho Volunteer đã attendance hợp lệ.
* UC52 không kiểm tra attendance trực tiếp mà chỉ consume certificate data/file đã available.
* Certificate phải tồn tại trước khi download.
* Certificate phải có file/download data hợp lệ trước khi download.
* Certificate nên có status `AVAILABLE` trước khi được download.
* Certificate `GENERATING`, `REVOKED` hoặc `UNAVAILABLE` không được download như certificate bình thường.
* Certificate file có thể là PDF trong bản đầu nếu team chưa chốt định dạng khác.
* Download file name nên dễ hiểu nếu team implement, ví dụ chứa event title hoặc certificate code.
* UI cần có downloading/loading state.
* UI cần disable download action hoặc chống bấm nhiều lần khi download đang xử lý nếu cần.
* UI cần hiển thị success hoặc browser download behavior rõ ràng sau khi download thành công.
* UI cần hiển thị error message nếu download thất bại.
* Backend/API phải enforce cuối cùng cho authentication, role, ownership, certificate status và file availability.
* Database/API thật cần được thống nhất sau khi spec/plan/api-contract được viết.

---

## 6. OPEN QUESTIONS

### Q1. Ai được download certificate?

**Answer:** Chỉ authenticated Volunteer được download certificate của chính mình.

---

### Q2. Guest có được download certificate không?

**Answer:** Không. Guest chưa đăng nhập và không có quyền truy cập certificate cá nhân.

---

### Q3. Staff, Manager, Admin có dùng UC52 không?

**Answer:** Không. UC52 là Volunteer Download Certificate flow. Staff generate certificate ở UC53, còn Manager/Admin có module riêng.

---

### Q4. Volunteer có được download certificate của người khác không?

**Answer:** Không. Volunteer chỉ được download certificate thuộc tài khoản của mình.

---

### Q5. UC52 bắt đầu từ đâu?

**Answer:** UC52 thường bắt đầu từ UC51 — View Certificates, khi Volunteer bấm Download trên certificate item hoặc Certificate Detail.

---

### Q6. UC51 và UC52 có cần hai màn hình riêng không?

**Answer:** Không cần. Hai UC này tách docs để rõ use case, nhưng khi code nên nằm chung trong Certificates page hoặc Certificate Detail. UC52 là action download trong UC51.

---

### Q7. Certificate chưa có file thì có download được không?

**Answer:** Không. Certificate chỉ được download khi có file/download data hợp lệ.

---

### Q8. Certificate đang generating thì có download được không?

**Answer:** Không. Hệ thống nên hiển thị trạng thái generating hoặc chưa sẵn sàng.

---

### Q9. Certificate revoked có download được không?

**Answer:** Không trong bản đầu. Hệ thống cần hiển thị revoked/unavailable rõ ràng.

---

### Q10. UC52 có generate certificate không?

**Answer:** Không. Generate Certificate thuộc UC53 của Member 3.

---

### Q11. UC52 có gửi certificate email không?

**Answer:** Không. Certificate Email thuộc UC66 của Member 1.

---

### Q12. Certificate file nên là PDF hay ảnh?

**Answer:** Bản đầu nên ưu tiên PDF nếu team chưa chốt định dạng khác, vì certificate thường cần tải/in/lưu trữ.

---

### Q13. Nếu download thất bại thì xử lý thế nào?

**Answer:** UI cần hiển thị error message rõ ràng, ví dụ certificate không khả dụng, không có quyền, file không tồn tại hoặc lỗi hệ thống.

---

### Q14. Backend hay frontend là nơi chốt quyền download?

**Answer:** Backend/API phải enforce quyền download cuối cùng. Frontend chỉ hỗ trợ hiển thị action và trạng thái.

---

## 7. ANSWERS / ANSWERS TO OPEN QUESTIONS

* **A1:** UC52 — Download Certificate thuộc Member 2 / Volunteer Event.

* **A2:** UC52 là action cho Volunteer tải certificate của chính mình.

* **A3:** UC52 chỉ dành cho authenticated Volunteer.

* **A4:** Guest không được download certificate.

* **A5:** Staff, Manager và Admin không dùng UC52 theo Volunteer flow.

* **A6:** Guest không phải role lưu trong database.

* **A7:** Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **A8:** Volunteer chỉ được download certificate thuộc về chính mình.

* **A9:** UC52 thường được kích hoạt từ UC51 — View Certificates.

* **A10:** UC51 và UC52 nên implement chung trong một Certificates page hoặc Certificate Detail.

* **A11:** Codex không nên tạo page riêng chỉ để download certificate.

* **A12:** Download action nên nằm trong Certificate List hoặc Certificate Detail.

* **A13:** Certificate phải tồn tại trước khi download.

* **A14:** Certificate phải có file/download data hợp lệ trước khi download.

* **A15:** Certificate nên có status `AVAILABLE` trước khi được download.

* **A16:** Certificate `GENERATING` không được download như certificate available.

* **A17:** Certificate `REVOKED` hoặc `UNAVAILABLE` không được download như certificate bình thường.

* **A18:** Certificate file nên ưu tiên PDF trong bản đầu nếu team chưa chốt định dạng khác.

* **A19:** UC52 không generate certificate.

* **A20:** Generate Certificate thuộc UC53 của Member 3.

* **A21:** UC52 không thực hiện Attendance Check.

* **A22:** Attendance Check thuộc UC45 của Member 3.

* **A23:** UC52 không gửi Certificate Email.

* **A24:** Certificate Email thuộc UC66 của Member 1.

* **A25:** UI cần có downloading/loading state.

* **A26:** UI cần disable download action hoặc chống bấm nhiều lần khi download đang xử lý nếu cần.

* **A27:** UI cần hiển thị success/download behavior rõ ràng sau khi download thành công.

* **A28:** UI cần hiển thị error message nếu download thất bại.

* **A29:** Backend/API phải enforce authentication, role, ownership, certificate status và file availability cuối cùng.

* **A30:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau, không định nghĩa trong context.

# CONTEXT.md — Volunteer Certificates

# Người viết: NamLD (Member 2) | Ngày: 2026-06-27

## 1. PROBLEM STATEMENT

Hệ thống Volunteer Event Management System cần một khu vực cho phép Volunteer xem và tải chứng nhận sau khi đã tham gia sự kiện tình nguyện hợp lệ.

Ở feature `005-volunteer-history`, Volunteer có thể xem lại lịch sử các event đã tham gia hoặc đã hoàn thành. Ở feature `006-volunteer-feedback-form`, Volunteer có thể gửi feedback sau khi điểm danh thành công. Sau khi Staff tạo chứng nhận cho Volunteer đã điểm danh, Volunteer cần có nơi để xem danh sách certificate, xem chi tiết certificate và tải certificate về.

Feature `007-volunteer-certificates` tập trung vào **Volunteer Certificates**, bao gồm:

* Hiển thị danh sách certificate của Volunteer hiện tại.
* Hiển thị certificate detail.
* Cho Volunteer download certificate nếu certificate có file/link hợp lệ.
* Chỉ hiển thị certificate thuộc về chính Volunteer đang đăng nhập.
* Hiển thị thông tin event liên quan đến certificate.
* Hiển thị trạng thái certificate nếu có.
* Hiển thị loading, empty, error và download error states.

Theo business rule mới của team, Staff chỉ được tạo certificate cho Volunteer đã điểm danh. Mỗi Volunteer chỉ có 1 certificate cho mỗi event.

Feature này không xử lý generate certificate, không xử lý attendance check-in, không xử lý feedback form, không xử lý feedback list, không xử lý apply event, không xử lý applied events, không xử lý staff certificate management, notification, donation hoặc reporting.

---

## 2. DOMAIN KNOWLEDGE

* **Feature Owner:** NamLD / Member 2.

* **Module:** Certificate Management / Volunteer Event Module.

* **Feature:** Volunteer Certificates.

* **Related Use Cases:**

  * UC51 — View Certificates
  * UC52 — Download Certificate

* **Connected Use Cases:**

  * UC21 — View Volunteer History
  * UC45 — Attendance Check-in
  * UC46 — View Attendance List
  * UC47 — View Attendance History
  * UC48 — Submit Feedback
  * UC53 — Generate Certificate

* **Related Screens:**

  * Certificate List
  * Certificate Detail
  * Download Certificate action
  * Volunteer History, if certificate entry point is linked from history item

* **Related Actors:**

  * Guest
  * Volunteer
  * Staff

* **Guest:** Guest không phải role được lưu trong database. Guest là trạng thái người dùng chưa đăng nhập. Guest không được xem hoặc tải certificate vì certificate là dữ liệu cá nhân của Volunteer.

* **Volunteer:** Volunteer là user đã đăng nhập với role `VOLUNTEER`. Volunteer có thể xem certificate của chính mình và download certificate nếu certificate đã được tạo.

* **Staff:** Staff là user có role `STAFF`, phụ trách tạo certificate cho Volunteer đã điểm danh. Staff Generate Certificate thuộc Staff Module, không thuộc feature này.

* **Certificate:** Chứng nhận được tạo cho Volunteer sau khi Volunteer tham gia và điểm danh hợp lệ ở event.

* **Certificate List:** Danh sách các certificate thuộc về Volunteer hiện tại.

* **Certificate Detail:** Trang hoặc khu vực hiển thị chi tiết một certificate, bao gồm thông tin certificate và thông tin event liên quan.

* **Download Certificate:** Hành động tải certificate về thiết bị nếu certificate có file hoặc download URL hợp lệ.

* **Successful Attendance:** Điều kiện cho biết Volunteer đã điểm danh thành công ở event. Theo docs mới, certificate chỉ được tạo cho Volunteer đã điểm danh.

* **Certificate Eligibility:** Điều kiện để Staff có thể tạo certificate cho Volunteer. Bản đầu hiểu là Volunteer phải đã điểm danh thành công.

* **One Certificate Per Event Rule:** Mỗi Volunteer chỉ có 1 certificate cho mỗi event.

* **Certificate File:** File certificate có thể được lưu qua Cloudinary hoặc storage khác nếu team triển khai file thật.

* **Certificate Status:** Trạng thái certificate nếu hệ thống cần hiển thị, ví dụ:

  * `AVAILABLE`
  * `NOT_AVAILABLE`
  * `GENERATING`
  * `REVOKED`

Trong bản đầu, Volunteer Certificates chỉ cần ưu tiên các certificate đã có sẵn để xem và tải.

---

## 3. STAKEHOLDERS

* **Volunteer:** Cần xem và tải certificate sau khi đã tham gia event hợp lệ.

* **NamLD / Member 2:** Chịu trách nhiệm chính với Certificate List, Certificate Detail và Download Certificate ở phía Volunteer.

* **Member 1 — Authentication & Profile:** Phụ trách login/session/current user. Feature này cần xác định user đã đăng nhập chưa và có role `VOLUNTEER` không.

* **Member 3 — Staff Module:** Phụ trách Attendance Management và Generate Certificate. Feature này phụ thuộc vào certificate do Staff tạo.

* **Member 4 — Manager Module:** Không trực tiếp xử lý Certificate, nhưng category/skill/organization của event có thể được hiển thị trong certificate detail nếu cần.

* **Member 5 — Admin Module:** Không trực tiếp xử lý Volunteer Certificates, nhưng có thể liên quan Dashboard, Statistics hoặc Reports ở module khác.

* **Cloudinary / File Storage:** Có thể được dùng để lưu file certificate nếu team triển khai download file thật.

---

## 4. CONSTRAINTS (Ràng buộc cứng)

* **SDD Workflow:** Feature này phải đi theo thứ tự `context.md` → `spec.md` → `plan.md` → `tasks.md` → implementation.

* **No Implementation in Context:** File context này không định nghĩa database schema, API endpoint, route, component, migration hoặc code task.

* **Authentication Required:** Chỉ user đã đăng nhập mới được xem certificate.

* **Guest Boundary:** Guest không được xem hoặc tải certificate.

* **Role Boundary:** Chỉ user có role `VOLUNTEER` mới được xem certificate trong Volunteer Certificates flow này.

* **Database Role Boundary:** Guest không phải role được lưu trong database. Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **Ownership Boundary:** Volunteer chỉ được xem và tải certificate của chính mình.

* **Certificate Generation Boundary:** Feature này không tạo certificate. Generate Certificate thuộc Staff Module.

* **Attendance Boundary:** Feature này không thực hiện điểm danh. Attendance Check-in thuộc Attendance Management.

* **Certificate Eligibility Boundary:** Certificate chỉ được tạo cho Volunteer đã điểm danh. Feature này chỉ hiển thị certificate đã được tạo hoặc trạng thái certificate nếu dữ liệu có sẵn.

* **One Certificate Boundary:** Mỗi Volunteer chỉ có 1 certificate cho mỗi event.

* **Feedback Boundary:** Feature này không submit feedback. Feedback Form thuộc feature `006-volunteer-feedback-form`.

* **Volunteer History Boundary:** Feature này không hiển thị toàn bộ Volunteer History. Volunteer History thuộc feature `005-volunteer-history`.

* **Applied Events Boundary:** Feature này không hiển thị Applied Events và không cancel application.

* **Staff Management Boundary:** Feature này không cho Staff quản lý certificate. Staff Generate Certificate thuộc Staff Module.

* **File Storage Boundary:** Certificate file có thể đến từ Cloudinary hoặc storage khác, nhưng cách lưu file thật sẽ được chốt ở plan/api/database sau.

* **Download Boundary:** Volunteer chỉ download được certificate nếu certificate có file/link hợp lệ và thuộc về chính Volunteer.

* **Mock Data:** Có thể dùng mock certificate data trong giai đoạn đầu, nhưng mock data không phải database/API chính thức.

---

## 5. ASSUMPTIONS (Các giả định hiện tại)

* Guest là trạng thái chưa đăng nhập, không phải role lưu trong database.
* Role trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.
* Volunteer Certificates yêu cầu user đã đăng nhập.
* Chỉ Volunteer được xem certificate trong feature này.
* Volunteer chỉ xem được certificate của chính mình.
* Certificate được tạo bởi Staff Module.
* Staff chỉ được tạo certificate cho Volunteer đã điểm danh.
* Mỗi Volunteer chỉ có 1 certificate cho mỗi event.
* Volunteer Certificates hiển thị certificate đã được tạo cho Volunteer.
* Certificate List nên hiển thị thông tin tóm tắt của certificate và event liên quan.
* Certificate Detail nên hiển thị thông tin chi tiết hơn về certificate.
* Certificate Detail có thể hiển thị event title, organization, event date, volunteer name, issue date, certificate code và download action nếu có.
* Download Certificate chỉ hoạt động nếu certificate có file URL hoặc download URL hợp lệ.
* Nếu certificate chưa có file, hệ thống cần hiển thị trạng thái phù hợp thay vì crash.
* Nếu Volunteer chưa có certificate nào, hệ thống hiển thị empty state.
* Nếu tải certificate list/detail thất bại, hệ thống hiển thị error state.
* Nếu download thất bại, hệ thống hiển thị download error message.
* Certificate file có thể được lưu trên Cloudinary nếu team triển khai file thật.
* Certificate có thể là file PDF, image, hoặc record có URL; định dạng chính thức sẽ chốt ở `plan.md` hoặc `api-contract.md`.
* Certificate status có thể dùng nếu cần, ví dụ `AVAILABLE`, `NOT_AVAILABLE`, `GENERATING`, `REVOKED`.
* Trong bản đầu, ưu tiên hiển thị và download certificate đã `AVAILABLE`.
* Database/API thật cần được thống nhất sau khi `plan.md` và `api-contract.md` được viết.

---

## 6. RESOLVED QUESTIONS (Tự trả lời dựa trên docs mới và quyết định trước đó)

### Q1. Guest có phải role trong database không?

**Answer:** Không. Guest chỉ là trạng thái chưa đăng nhập. Role trong database chỉ gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

---

### Q2. Guest có được xem hoặc download certificate không?

**Answer:** Không. Certificate là dữ liệu cá nhân của Volunteer, Guest không được xem hoặc tải.

---

### Q3. Ai được xem certificate trong feature này?

**Answer:** Chỉ authenticated user có role `VOLUNTEER`.

---

### Q4. Volunteer có được xem certificate của Volunteer khác không?

**Answer:** Không. Volunteer chỉ được xem certificate của chính mình.

---

### Q5. Feature này có tạo certificate không?

**Answer:** Không. Generate Certificate thuộc Staff Module.

---

### Q6. Ai tạo certificate?

**Answer:** Staff tạo certificate cho Volunteer đã điểm danh.

---

### Q7. Certificate được tạo cho ai?

**Answer:** Certificate chỉ được tạo cho Volunteer đã điểm danh thành công hoặc có attendance hợp lệ theo rule của Staff Module.

---

### Q8. Mỗi Volunteer có thể có bao nhiêu certificate cho một event?

**Answer:** Mỗi Volunteer chỉ có 1 certificate cho mỗi event.

---

### Q9. Feature này có thực hiện Attendance Check-in không?

**Answer:** Không. Attendance Check-in thuộc Attendance Management.

---

### Q10. Feature này có submit feedback không?

**Answer:** Không. Feedback Form thuộc feature `006-volunteer-feedback-form`.

---

### Q11. Certificate List cần hiển thị gì?

**Answer:** Certificate List nên hiển thị:

* certificate title hoặc event title;
* organization;
* event date;
* issue date nếu có;
* certificate status;
* download/view action nếu có.

---

### Q12. Certificate Detail cần hiển thị gì?

**Answer:** Certificate Detail nên hiển thị:

* certificate title;
* event title;
* volunteer name;
* organization;
* event date;
* issue date;
* certificate code nếu có;
* certificate status;
* download action nếu file có sẵn.

---

### Q13. Certificate có định dạng gì?

**Answer:** Docs mới chưa chốt định dạng. Bản đầu nên hỗ trợ bằng cách lưu/nhận certificate file URL. File có thể là PDF hoặc image, nhưng định dạng chính thức sẽ chốt ở plan/api/database.

---

### Q14. Certificate file lưu ở đâu?

**Answer:** Theo tech stack mới, file/image storage dùng Cloudinary. Vì vậy certificate file có thể lưu Cloudinary nếu triển khai file thật.

---

### Q15. Nếu certificate chưa có file URL thì sao?

**Answer:** Hệ thống không được crash. UI cần hiển thị trạng thái chưa sẵn sàng hoặc không có download action.

---

### Q16. Nếu Volunteer chưa có certificate nào thì sao?

**Answer:** Hệ thống hiển thị empty state.

---

### Q17. Nếu download certificate lỗi thì sao?

**Answer:** Hệ thống hiển thị download error message rõ ràng.

---

### Q18. Certificate có liên kết với Volunteer History không?

**Answer:** Có thể. Volunteer History có thể hiển thị entry point sang Certificate nếu certificate đã được tạo. Nhưng Volunteer History và Certificate là hai feature riêng.

---

## 7. ANSWERS (Đã chốt nghiệp vụ cho bản đầu)

* **A1:** Feature này là `007-volunteer-certificates`.

* **A2:** Feature này thuộc Member 2 — Volunteer Event Module.

* **A3:** Feature này tương ứng với UC51 — View Certificates và UC52 — Download Certificate.

* **A4:** Guest không phải role lưu trong database.

* **A5:** Role lưu trong database gồm `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.

* **A6:** Guest không được xem hoặc download certificate.

* **A7:** Chỉ authenticated Volunteer được xem certificate trong feature này.

* **A8:** Volunteer chỉ được xem certificate của chính mình.

* **A9:** Certificate được tạo bởi Staff Module.

* **A10:** Staff chỉ tạo certificate cho Volunteer đã điểm danh.

* **A11:** Mỗi Volunteer chỉ có 1 certificate cho mỗi event.

* **A12:** Feature này không generate certificate.

* **A13:** Feature này không Attendance Check-in.

* **A14:** Feature này không submit feedback.

* **A15:** Certificate List cần hiển thị certificate summary.

* **A16:** Certificate summary nên gồm:

  * certificate title hoặc event title
  * organization
  * event date
  * issue date nếu có
  * certificate status
  * view/download action nếu có

* **A17:** Certificate Detail cần hiển thị certificate detail data.

* **A18:** Certificate detail nên gồm:

  * certificate title
  * event title
  * volunteer name
  * organization
  * event date
  * issue date
  * certificate code nếu có
  * certificate status
  * download action nếu có file

* **A19:** Certificate file có thể là PDF hoặc image, nhưng định dạng chính thức sẽ chốt sau.

* **A20:** Certificate file có thể lưu bằng Cloudinary nếu team triển khai file thật.

* **A21:** Volunteer chỉ download được certificate nếu certificate thuộc về mình và có file/link hợp lệ.

* **A22:** Nếu certificate chưa sẵn sàng, UI không hiển thị download action hoặc hiển thị trạng thái phù hợp.

* **A23:** Feature cần có loading state khi tải certificate list/detail.

* **A24:** Feature cần có empty state khi Volunteer chưa có certificate.

* **A25:** Feature cần có error state khi tải certificate thất bại.

* **A26:** Feature cần có download error state nếu tải file thất bại.

* **A27:** Feature có thể liên kết từ Volunteer History khi certificate available.

* **A28:** Feature này phụ thuộc Member 1 về auth/login/current user.

* **A29:** Feature này phụ thuộc Member 3 về attendance data và Generate Certificate.

* **A30:** Feature này có thể dùng mock data qua service layer trong giai đoạn đầu, nhưng mock data không phải source of truth.

* **A31:** API route, database schema, frontend component structure và implementation tasks sẽ được định nghĩa ở các bước sau (`plan.md`, `api-contract.md`, `database.md`, `tasks.md`), không định nghĩa trong context.

# CONTEXT.md — Feature: Event Detail - View Event Detail (UC09)

**Người viết:** CuongLH | **Ngày:** 19/07/2026

## 1. PROBLEM STATEMENT

Người dùng hệ thống VMS (Guest và Volunteer) cần xem thông tin chi tiết về một sự kiện tình nguyện cụ thể trước khi quyết định đăng ký tham gia. Hiện tại, hệ thống mới chỉ có danh sách sự kiện (Event List) với thông tin tóm tắt, chưa có màn hình hiển thị đầy đủ chi tiết sự kiện. UC09 nhằm cung cấp một giao diện chi tiết hiển thị tất cả thông tin quan trọng của sự kiện, bao gồm: tiêu đề, mô tả, địa điểm, thời gian, hạn đăng ký, sức chứa, danh mục, thông tin người tạo và trạng thái. Đối với Volunteer đã đăng nhập, màn hình này còn đóng vai trò là điểm vào (entry point) cho thao tác nộp đơn đăng ký (Apply Event - UC12).

## 2. DOMAIN KNOWLEDGE

- **Event Visibility (Hiển thị sự kiện):** Chỉ những sự kiện có trạng thái `PUBLISHED`, `IN_PROGRESS`, `COMPLETED` và chưa bị soft delete (`is_active = true`) mới được hiển thị công khai cho Guest và Volunteer. Các trạng thái khác (`DRAFT`, `PENDING_APPROVAL`, `REJECTED`, `CANCELLED`) không thuộc phạm vi hiển thị công khai.

- **Event Status Lifecycle (Vòng đời sự kiện):** Theo DATABASE2.md v3.0, sự kiện trải qua các trạng thái: `DRAFT` → `PENDING_APPROVAL` → `PUBLISHED` (hoặc `REJECTED`). Sau khi `PUBLISHED`, sự kiện có thể chuyển sang `IN_PROGRESS`, `COMPLETED`, hoặc `CANCELLED`. Guest và Volunteer có thể xem sự kiện ở cả ba trạng thái hậu publish (`PUBLISHED`, `IN_PROGRESS`, `COMPLETED`).

- **Dữ liệu tổng hợp (Data Aggregation):** Thông tin chi tiết sự kiện không chỉ gói gọn trong bản thân sự kiện, mà còn bao gồm dữ liệu từ danh mục phân loại (`event_categories`) và thông tin người tạo (`users`). Người dùng cần biết sự kiện thuộc danh mục nào và do ai tổ chức.

- **Phân quyền truy cập (Authorization):** Guest (chưa đăng nhập) có quyền xem chi tiết sự kiện công khai. Volunteer (đã đăng nhập) xem cùng một dữ liệu nền, nhưng được bổ sung thêm ngữ cảnh cá nhân: trạng thái đơn đăng ký của họ cho sự kiện đó (nếu có). Đây là điểm khác biệt quan trọng giữa UC09 và UC23 (Staff xem Application Detail).

- **Apply Entry Point (Điểm vào Apply):** UC09 hiển thị UI dựa trên role và trạng thái đơn:
  - Guest: Hiển thị nút "Login to Apply".
  - Volunteer chưa apply: Hiển thị nút "Apply Now".
  - Volunteer đã apply: Hiển thị badge trạng thái đơn hiện tại.
  UC09 không chịu trách nhiệm validate điều kiện apply (deadline, capacity) — việc đó thuộc về UC12.

## 3. STAKEHOLDERS

- **Guest:** Người dùng chưa đăng nhập, có nhu cầu tìm hiểu thông tin sự kiện trước khi quyết định đăng ký tài khoản và tham gia.

- **Volunteer:** Người dùng đã đăng nhập, xem chi tiết sự kiện để quyết định có nộp đơn đăng ký hay không. Đối với Volunteer, màn hình Event Detail còn là điểm bắt đầu cho luồng Apply Event (UC12).

- **System / Security:** Đảm bảo không rò rỉ thông tin của các sự kiện chưa được duyệt hoặc đã bị xóa ra bên ngoài. Đồng thời đảm bảo dữ liệu cá nhân hóa (nếu có) chỉ được trả về cho đúng người dùng đã xác thực.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)

- **Visibility Enforcement (Kiểm soát hiển thị):** BẮT BUỘC chỉ hiển thị sự kiện có trạng thái `PUBLISHED`, `IN_PROGRESS`, hoặc `COMPLETED` và chưa bị soft delete (`is_active = true`). TUYỆT ĐỐI KHÔNG để lộ thông tin sự kiện đang ở trạng thái `DRAFT`, `PENDING_APPROVAL`, `REJECTED`, hoặc `CANCELLED` cho Guest và Volunteer.

- **Public Access (Truy cập công khai):** Guest được phép xem chi tiết sự kiện mà không cần đăng nhập. Đây là điểm khác biệt với UC18 (View Profile) vốn yêu cầu phải đăng nhập mới xem được.

- **Response Format:** Mọi phản hồi từ máy chủ phải tuân theo định dạng chung đã thống nhất của toàn dự án.

- **Data Privacy (Bảo mật thông tin nội bộ):** TUYỆT ĐỐI KHÔNG tiết lộ thông tin người duyệt (`approved_by`) và ngày duyệt (`approved_at`) trong API response. Đây là dữ liệu nội bộ thuộc quy trình kiểm duyệt, không thuộc phạm vi của UC09.

- **Read-Only:** Tính năng này chỉ phục vụ mục đích ĐỌC (Read-only). Mọi thao tác ghi (apply, edit event) thuộc về các use case khác (UC12, UC16).

## 5. ASSUMPTIONS (Giả định)

- Giả định hệ thống Database đã thiết lập các quan hệ giữa bảng `events`, `event_categories`, và `users` để có thể truy vấn kèm thông tin danh mục và người tạo trong cùng một lần gọi.

- Giả định dữ liệu danh mục (`event_categories`) đã được Manager thiết lập đầy đủ trước khi sự kiện được tạo.

- Giả định mỗi sự kiện đều có `created_by` trỏ đến một Staff hợp lệ. Trường hợp Staff đã bị soft delete, thông tin người tạo vẫn cần được hiển thị vì mục đích lịch sử và minh bạch.

- Giả định ảnh sự kiện (`image_url`) có thể không có (NULL). Khi đó frontend sẽ hiển thị ảnh placeholder mặc định.

- Giả định thời gian hiển thị (start_date, end_date, application_deadline) được hiển thị theo ngữ cảnh thời gian địa phương của người dùng, không yêu cầu chuyển đổi múi giờ thủ công từ backend.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

> *(Tất cả câu hỏi dưới đây đã được trả lời tại Section 7 bên dưới.)*

1. **Phạm vi trạng thái hiển thị:** Ngoài `PUBLISHED`, sự kiện ở trạng thái `IN_PROGRESS` và `COMPLETED` có nên hiển thị cho Guest/Volunteer xem không? (Hiện tại CONSTRAINT chỉ cho phép `PUBLISHED`, nhưng `IN_PROGRESS` và `COMPLETED` đều là hậu `PUBLISHED`. Về mặt nghiệp vụ, Volunteer vẫn có nhu cầu xem lại sự kiện đã tham gia.)

2. **Ngữ cảnh cá nhân hóa cho Volunteer:** Khi Volunteer đã đăng nhập xem Event Detail, hệ thống có nên trả về kèm trạng thái đơn đăng ký của họ cho sự kiện này không? Điều này giúp Volunteer biết ngay mình đã apply hay chưa, thay vì phải vào Applied Events (UC13) để kiểm tra.

3. **Thông tin Apply Entry Point:** Nút "Apply" trên màn hình Event Detail nên được kiểm soát như thế nào? (Luôn hiển thị và để UC12 xử lý lỗi? Ẩn khi hết hạn/hết chỗ? Disabled?). Ai chịu trách nhiệm kiểm tra điều kiện - UC09 hay UC12?

4. **Số lượng đã duyệt (approved_participants):** Có nên hiển thị số lượng đã duyệt và sức chứa (`max_capacity`) công khai cho Guest không? Hay chỉ hiển thị trạng thái "Còn chỗ" / "Hết chỗ" mà không tiết lộ con số cụ thể? Việc hiển thị con số có thể tạo tâm lý "sắp hết chỗ" thúc đẩy đăng ký, nhưng cũng có thể gây áp lực không mong muốn.

5. **Thông tin người duyệt (approved_by):** Khi sự kiện đã được Manager duyệt, có cần hiển thị tên của Manager đã duyệt và ngày duyệt cho Guest và Volunteer không? Đây có thể coi là thông tin nội bộ, hoặc ngược lại là yếu tố tạo niềm tin (sự kiện đã được kiểm duyệt chính thức).

6. **Giao diện sự kiện đã kết thúc:** Đối với sự kiện đã kết thúc (`COMPLETED`) hoặc đang diễn ra (`IN_PROGRESS`), giao diện Event Detail có cần thay đổi gì không? (Ví dụ: ẩn nút Apply, hiển thị badge trạng thái "Đang diễn ra" / "Đã kết thúc" thay cho "Còn X ngày để đăng ký").

7. **Chia sẻ sự kiện (Share):** Có cần hỗ trợ tính năng chia sẻ link Event Detail không? Việc này ảnh hưởng đến thiết kế URL thân thiện và khả năng SEO cho các sự kiện công khai.

## 7. ANSWERS (Chốt cho SPEC.md)

### Answer 1: Phạm vi trạng thái hiển thị (Resolved)

**Question:** Ngoài `PUBLISHED`, sự kiện `IN_PROGRESS` và `COMPLETED` có hiển thị không?

**Answer:**

- **Confirmed:** Hiển thị **tất cả sự kiện** ở trạng thái `PUBLISHED`, `IN_PROGRESS`, và `COMPLETED`.
- **Business Impact & Rationale:** Về mặt nghiệp vụ, Volunteer có nhu cầu xem lại thông tin sự kiện đã tham gia hoặc đang diễn ra. Việc ẩn sự kiện `COMPLETED` sẽ khiến Volunteer không thể truy cập lại thông tin sự kiện cũ từ lịch sử tham gia (UC21). CONSTRAINT Visibility Enforcement được cập nhật: `status IN ('PUBLISHED', 'IN_PROGRESS', 'COMPLETED')` VÀ `is_active = true`.

### Answer 2: Ngữ cảnh cá nhân hóa cho Volunteer (Resolved)

**Question:** Khi Volunteer đã đăng nhập xem Event Detail, có trả kèm `user_application` không?

**Answer:**

- **Confirmed:** **CÓ** — API trả về kèm trường `user_application` khi người dùng đã xác thực.
- **Data Shape:** `user_application: null | { id, status, created_at }`. Nếu user chưa từng apply cho sự kiện này, giá trị là `null`. Nếu đã apply, trả về id, trạng thái (PENDING/APPROVED/REJECTED/CANCELLED), và ngày nộp đơn.
- **Business Impact & Rationale:** Giúp Volunteer biết ngay trạng thái đơn của mình mà không cần rời khỏi màn hình Event Detail để vào UC13 (Applied Events). Đối với Guest (không có JWT), trường này không tồn tại trong response.

### Answer 3: Apply Entry Point (Resolved)

**Question:** Nút Apply hiển thị như thế nào? Ai kiểm soát?

**Answer:**

UC09 hiển thị nút bấm theo đúng quy tắc đã định nghĩa tại mục **"Apply Entry Point" ở Section 2**. Tóm tắt lại:

- Nhìn vào **vai trò** (Guest, Volunteer) và **trạng thái đơn** (chưa có, đang chờ, đã duyệt, đã từ chối, đã hủy) để quyết định hiển thị nút gì.
- Việc kiểm tra điều kiện apply (hết hạn đăng ký, hết chỗ) **thuộc về UC12**, không phải UC09. UC09 chỉ làm nhiệm vụ hiển thị đúng giao diện, không kiểm tra điều kiện.

### Answer 4: Số lượng đã duyệt (Resolved)

**Question:** Hiển thị con số cụ thể hay chỉ "Còn chỗ"/"Hết chỗ"?

**Answer:**

- **Confirmed:** Hiển thị **số cụ thể** theo định dạng `approved_participants / max_capacity` (ví dụ: "3/20").
- **Business Impact & Rationale:** Minh bạch hóa thông tin sự kiện, tạo urgency tích cực ("Chỉ còn 2 chỗ!") giúp thúc đẩy Volunteer đăng ký sớm. Đồng thời giúp Volunteer đánh giá mức độ phổ biến của sự kiện. Khi `approved_participants >= max_capacity`, hiển thị "Đã đầy" (Full).

### Answer 5: Thông tin người duyệt (Resolved)

**Question:** Có hiển thị tên Manager duyệt + ngày duyệt cho Guest/Volunteer không?

**Answer:**

- **Confirmed:** **KHÔNG** — không hiển thị `approved_by` và `approved_at` cho Guest và Volunteer.
- **Business Impact & Rationale:** Đây là thông tin nội bộ thuộc quy trình kiểm duyệt giữa Staff và Manager. Guest và Volunteer chỉ cần biết sự kiện đã được publish (thông qua việc nó xuất hiện công khai), không cần biết ai đã duyệt và duyệt khi nào. Việc ẩn thông tin này cũng bảo vệ Manager khỏi bị làm phiền trực tiếp.

### Answer 6: Giao diện sự kiện đã kết thúc (Resolved)

**Question:** Sự kiện `COMPLETED`/`IN_PROGRESS` có giao diện khác biệt không?

**Answer:**

- **Confirmed:** **CÓ** — hiển thị badge trạng thái nổi bật và điều chỉnh UI phù hợp.
- **Chi tiết:**
  - **IN_PROGRESS:** Hiển thị badge "Đang diễn ra" (màu xanh lá). Ẩn nút Apply (không thể đăng ký khi sự kiện đã bắt đầu).
   - **COMPLETED:** Hiển thị badge "Đã kết thúc" (màu xám). Ẩn nút Apply.
  - **PUBLISHED:** Hiển thị thông tin "Còn X ngày để đăng ký" hoặc "Hạn đăng ký: DD/MM/YYYY".
- **Business Impact & Rationale:** Giúp người dùng nhận biết ngay trạng thái sự kiện mà không cần đọc kỹ thời gian. Tránh trường hợp Volunteer cố gắng apply vào sự kiện đã bắt đầu hoặc đã kết thúc.

### Answer 7: Chia sẻ sự kiện (Resolved)

**Question:** Có cần nút Share/Copy link không?

**Answer:**

- **Confirmed:** **KHÔNG** — phiên bản v1 chưa hỗ trợ tính năng chia sẻ.
- **Business Impact & Rationale:** Đây là tính năng nice-to-have, không thuộc phạm vi MVP. Có thể bổ sung trong các phiên bản sau khi có nhu cầu thực tế từ người dùng.

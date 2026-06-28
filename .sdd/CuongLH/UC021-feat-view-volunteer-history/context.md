# CONTEXT.md — Feature: Profile Management - View Volunteer History (UC21)

**Người viết:** CuongLH | **Ngày:** 28/06/2026

## 1. PROBLEM STATEMENT

Tình nguyện viên (Volunteer) cần một nơi tập trung để theo dõi và quản lý quá trình đóng góp của mình cho hệ thống VMS. Hiện tại, dữ liệu về việc tham gia các sự kiện đang nằm rải rác và khó truy cập. UC21 nhằm mục đích cung cấp một giao diện lịch sử tham gia nhất quán, giúp người dùng xem lại các sự kiện đã tham gia, trạng thái hồ sơ và tổng số giờ tình nguyện tích lũy, từ đó tạo động lực tham gia lâu dài và minh bạch hoá thành tích cá nhân.

## 2. DOMAIN KNOWLEDGE

* **Volunteer History (Lịch sử tình nguyện):** Tập hợp các bản ghi đăng ký tham gia sự kiện của tình nguyện viên, bao gồm trạng thái xử lý (đã duyệt, bị từ chối, đã hủy) và kết quả tham gia thực tế (đã hoàn thành, số giờ đóng góp).

* **Trạng thái bản ghi (Application Status):** Lịch sử bao gồm các trạng thái: `Approved` (Đã duyệt - chờ tham gia), `Attended` (Đã ghi nhận tham gia/Hoàn thành), `Rejected` (Bị từ chối), hoặc `Cancelled` (Đã hủy bởi volunteer hoặc staff).

* **Dữ liệu liên kết:** Mỗi bản ghi lịch sử cần hiển thị đầy đủ thông tin sự kiện tương ứng (tên sự kiện, thời gian diễn ra, tổ chức chủ trì) cùng với thông tin kết quả tham gia (số giờ thực tế đóng góp, thời điểm ghi nhận).

* **Phân quyền (Authorization):** Tình nguyện viên chỉ có quyền xem lịch sử của chính họ. Danh tính người dùng được xác thực thông qua JWT trong httpOnly cookie (BẮT BUỘC - xem mục 4 CONSTRAINTS).

* **Thống kê tích lũy (Cumulative Metrics):** Hệ thống cần tổng hợp số liệu như: Tổng số giờ tình nguyện, tổng số sự kiện đã tham gia, tổng số sự kiện đã hoàn thành thành công.

## 3. STAKEHOLDERS

* **Volunteer:** Đối tượng chính sử dụng tính năng để theo dõi thành tích cá nhân, xem lại lịch sử tham gia, và có động lực tiếp tục đóng góp.

* **Staff/Manager:** Có thể truy cập lịch sử của Volunteer để đánh giá năng lực, độ tin cậy (attendance rate), và mức độ cam kết khi xét duyệt đơn đăng ký sự kiện mới hoặc trao chứng nhận.

* **System Backend:** Chịu trách nhiệm tổng hợp dữ liệu từ nhiều nguồn (đăng ký, kết quả ghi nhận, sự kiện) để trả về phản hồi chuẩn xác và đầy đủ.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)

* **Security (Bảo mật danh tính):** Tuyệt đối KHÔNG tin tưởng `userId` truyền từ request body hoặc query parameters. BẮT BUỘC lấy `userId` từ JWT đã xác thực trong httpOnly cookie để đảm bảo người dùng chỉ xem được dữ liệu của chính họ (Tuân thủ Lesson 3 trong CLAUDE.md).

* **Response Standard:** Mọi phản hồi API phải sử dụng hàm tiện ích `backend\src\utils\response.util.js` để đảm bảo format chuẩn `{success: boolean, data?: any, error?: string}` cho tính nhất quán và dễ dàng xử lý lỗi ở frontend.

* **Data Integrity (Tính toàn vẹn dữ liệu):** Chỉ hiển thị dữ liệu từ các bản ghi còn hiệu lực (không bị đánh dấu xóa trong hệ thống). Dữ liệu lịch sử phải phản ánh đúng trạng thái thực tế tại thời điểm truy vấn.

* **Performance:** Với tình nguyện viên lâu năm (có thể có hàng trăm sự kiện), hệ thống phải hỗ trợ cơ chế phân trang để tránh tải quá nhiều dữ liệu trong một lần truy vấn.

## 5. ASSUMPTIONS (Giả định)

* Giả định rằng dữ liệu kết quả ghi nhận tham gia đã được các module quản lý sự kiện cập nhật đầy đủ và chính xác vào hệ thống. UC21 chỉ đọc và hiển thị dữ liệu, không chịu trách nhiệm cập nhật trạng thái ghi nhận.

* Giả định rằng danh sách lịch sử sẽ được sắp xếp theo thời gian tham gia giảm dần (Newest First - sự kiện gần nhất ở đầu danh sách) để người dùng dễ dàng theo dõi các hoạt động gần đây nhất.

* Giả định rằng hệ thống không cần hỗ trợ xuất báo cáo lịch sử dưới dạng file trong phiên bản đầu tiên (v1). Tính năng này có thể được bổ sung trong các phiên bản sau nếu có nhu cầu.

* Giả định rằng thời gian hiển thị (thời điểm bắt đầu/kết thúc sự kiện, thời điểm ghi nhận) sẽ được hiển thị theo ngữ cảnh thời gian địa phương của người dùng, không cần hỗ trợ chuyển đổi múi giờ thủ công.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Phạm vi hiển thị:** Người dùng muốn thấy tất cả trạng thái đơn đăng ký (bao gồm cả bị từ chối/hủy) hay chỉ những sự kiện đã tham gia thành công? Việc hiển thị đơn bị từ chối có giúp người dùng hiểu rõ lý do và cải thiện hồ sơ trong tương lai không?

2. **Bảng tóm tắt (Summary Card):** Có cần hiển thị các số liệu tổng hợp (Tổng giờ tích lũy, Tổng số sự kiện, Tỷ lệ hoàn thành) ở đầu trang không? Số liệu này có tạo động lực cho người dùng tiếp tục tham gia không?

3. **Phân trang (Pagination):** Với tình nguyện viên lâu năm, danh sách có thể rất dài (100+ sự kiện). Hệ thống nên dùng phân trang theo số trang (Offset-based: page 1, 2, 3...) hay theo con trỏ (Cursor-based: load more)? Offset đơn giản hơn nhưng cursor hiệu suất tốt hơn với dữ liệu lớn.

4. **Tích hợp Chứng nhận (UC52):** Có nên nhúng trực tiếp link tải chứng nhận (nếu có) ngay trong dòng lịch sử của sự kiện đó không? Hay người dùng phải vào trang riêng để quản lý chứng nhận?

5. **Bộ lọc (Filtering):** Người dùng có cần bộ lọc theo trạng thái (Approved, Attended, Rejected, Cancelled) hoặc theo khoảng thời gian (Last 3 months, Last year, All time) để tìm kiếm dễ dàng hơn không?

6. **Tìm kiếm (Search):** Người dùng có cần tìm kiếm sự kiện theo tên sự kiện hoặc tổ chức không? Tính năng này có quan trọng đối với tình nguyện viên lâu năm không?

## 7. ANSWERS (Chốt cho SPEC.md)

1. **Phạm vi hiển thị:**
   * **QUYẾT ĐỊNH:** Hiển thị **TẤT CẢ các trạng thái** đơn đăng ký (Approved, Attended, Rejected, Cancelled).
   * **Rationale:** Phù hợp với định nghĩa "Lịch sử tình nguyện" tại mục 2, giúp minh bạch hóa hồ sơ và giúp tình nguyện viên biết lý do bị từ chối để cải thiện đơn đăng ký sau này.

2. **Bảng tóm tắt (Summary Card):**
   * **QUYẾT ĐỊNH:** **CÓ HIỂN THỊ** các số liệu tổng hợp: Tổng giờ tích lũy, Tổng số sự kiện đã tham gia, và Tổng số sự kiện hoàn thành thành công.
   * **Rationale:** Đây là yêu cầu bắt buộc thuộc mục "Cumulative Metrics" nhằm tạo động lực và đánh giá năng lực người dùng.

3. **Phân trang (Pagination):**
   * **QUYẾT ĐỊNH:** Sử dụng **Offset-based pagination** (trang 1, 2, 3...).
   * **Rationale:** Đảm bảo yêu cầu về hiệu năng (Performance) khi dữ liệu lớn. Phương án này đơn giản cho việc triển khai v1 và phù hợp với giao diện danh sách lịch sử truyền thống.

4. **Tích hợp Chứng nhận (UC52):**
   * **QUYẾT ĐỊNH:** **KHÔNG** nhúng trực tiếp link tải file. Chỉ hiển thị nhãn "Đã cấp chứng nhận" kèm link điều hướng sang trang quản lý chứng nhận của Member 2 (UC51).
   * **Rationale:** Tuân thủ ranh giới module (Module Boundaries). Việc quản lý và tải chứng nhận thuộc trách nhiệm của Member 2 (UC51/52). UC21 chỉ đóng vai trò tổng hợp trạng thái.

5. **Bộ lọc (Filtering):**
   * **QUYẾT ĐỊNH:** Hỗ trợ lọc theo **Trạng thái** (Status) và **Năm** tham gia.
   * **Rationale:** Giúp người dùng quản lý danh sách hiệu quả khi đóng góp lâu năm mà không làm phức tạp hóa logic truy vấn.

6. **Tìm kiếm (Search):**
   * **QUYẾT ĐỊNH:** **KHÔNG THỰC HIỆN** chức năng tìm kiếm theo tên trong v1.
   * **Rationale:** Tập trung vào hiển thị và tổng hợp dữ liệu Profile. Việc tìm kiếm nâng cao sẽ được xem xét ở các giai đoạn sau nếu thực sự cần thiết.

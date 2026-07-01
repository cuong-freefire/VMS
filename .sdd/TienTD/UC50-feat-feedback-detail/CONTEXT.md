# CONTEXT.md — Feature: Staff Module - View Feedback Detail (UC50)
# Người viết: TienTD | Ngày: 28/06/2026

## 1. PROBLEM STATEMENT
- **Current Pain Point**: Tại trang danh sách (UC49), Staff chỉ thấy được một phần nội dung nhận xét ngắn gọn. Đối với những phản hồi dài hoặc mang tính góp ý chuyên sâu, Staff không thể nắm bắt hết ý kiến của Volunteer.
- **Impact on Staff Workflow**: Staff gặp khó khăn trong việc hiểu rõ nguyên nhân gốc rễ của các vấn đề phát sinh trong sự kiện. Việc thiếu chi tiết khiến các hành động khắc phục sau đó không đi đúng trọng tâm.
- **Impact on Volunteers/Events**: Những đóng góp tâm huyết của Volunteer bị xem nhẹ hoặc hiểu sai. Sự kiện không thể cải thiện triệt để chất lượng tổ chức vì thiếu sự phân tích chi tiết từ phản hồi người dùng.
- **Business Value**: Giúp Staff hiểu sâu sắc trải nghiệm của Volunteer, làm cơ sở để xây dựng các báo cáo tổng kết chất lượng và cải tiến quy trình tổ chức sự kiện cho những lần sau.

## 2. DOMAIN KNOWLEDGE
- **Staff Role & Permissions**: Staff có quyền xem chi tiết từng bản ghi phản hồi của các sự kiện thuộc tổ chức của mình.
- **Feedback Content**: Một phản hồi chi tiết bao gồm điểm số đánh giá (Rating), nội dung nhận xét đầy đủ (Comment), thông tin Volunteer và thông tin sự kiện liên quan.
- **Business Rules**: 
    - Staff không được phép thay đổi hoặc xóa nội dung phản hồi của Volunteer.
    - Quyền truy cập chi tiết chỉ được cấp nếu Staff thuộc cùng Organization với sự kiện đó.
- **Cross-Module Dependencies**: UC50 lấy dữ liệu chi tiết từ UC48 (Submit Feedback). Nó liên quan chặt chẽ đến UC49 (View Feedback List) và cung cấp dữ liệu cho các báo cáo thống kê sau này.

## 3. STAKEHOLDERS
- **Staff (Actor chính)**: Cần đọc toàn bộ nội dung góp ý để ghi nhận ưu điểm và khắc phục nhược điểm của dự án.
- **Volunteer**: Mong muốn những phản hồi chi tiết của mình được Staff tiếp nhận trọn vẹn.
- **Organization Admin**: Kiểm tra cách Staff tiếp thu phản hồi để đánh giá thái độ cầu thị của đội ngũ.
- **System/Infrastructure**: Đảm bảo hiển thị văn bản dài (long text) một cách rõ ràng và hiệu quả.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)
- **Authorization Constraint**: Staff CHỈ được phép xem chi tiết feedback thuộc sự kiện mà Organization của họ quản lý.
- **Data Privacy Constraint**: Staff không được phép thấy email hoặc số điện thoại của Volunteer trong trang chi tiết này nếu Volunteer chọn chế độ ẩn danh hoặc riêng tư.
- **Read-only Constraint**: Giao diện chi tiết phải ở chế độ chỉ đọc, không có nút Edit hay Delete nội dung feedback.
- **Audit Trail Constraint**: Hệ thống ghi log: Staff nào đã xem chi tiết feedback của ai, vào lúc nào.

## 5. ASSUMPTIONS (Giả định)
- **Giả định về Staff behavior**: Staff xem chi tiết để rút kinh nghiệm chuyên môn, không vì mục đích cá nhân.
- **Giả định về dữ liệu**: Phản hồi đã được Volunteer gửi thành công và lưu trữ toàn vẹn trong database.
- **Giả định về môi trường**: Staff có thể xem trên cả Desktop và Mobile để cập nhật thông tin linh hoạt.

## 6. OPEN QUESTIONS
1. Staff có thể đánh dấu feedback này là "Quan trọng" để lưu trữ riêng không?
2. Có cần hiển thị các ảnh đính kèm (nếu Volunteer có gửi kèm feedback) không?

## 7. DECISIONS
**Quyết định cho câu hỏi 1 - Favorite/Flag Strategy:**
- **Lựa chọn**: Option B - Cho phép Staff "Flag" (đánh dấu) các feedback mang tính đóng góp cao để đưa vào báo cáo tổng kết.
- **Lý do**: Giúp Staff lọc ra những ý kiến chất lượng nhất giữa hàng trăm feedback thông thường.
- **Impact**: Cần thêm một trường `is_flagged` vào bảng Feedback trong database.

**Quyết định cho câu hỏi 2 - Media Support:**
- **Lựa chọn**: Option A - Hiển thị ảnh đính kèm nếu có.
- **Lý do**: Hình ảnh thực tế từ Volunteer giúp Staff xác thực các vấn đề (VD: cơ sở vật chất hỏng, hiện trường sự kiện).
- **Impact**: Backend cần trả về mảng URL hình ảnh trong API chi tiết.
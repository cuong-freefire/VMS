# CONTEXT.md — Feature: Staff Module - View Application Detail (UC23)
# Người viết: TienTD | Ngày: 28/06/2026

## 1. PROBLEM STATEMENT
- **Current Pain Point**: Sau khi xem danh sách tổng quát (UC22), Staff không có đủ thông tin chi tiết về năng lực, kỹ năng và động lực của Volunteer để đưa ra quyết định phê duyệt chính xác.
- **Impact on Staff Workflow**: Staff phải liên lạc thủ công hoặc tìm kiếm hồ sơ Volunteer ở các module khác, gây mất thời gian và dễ dẫn đến quyết định sai lầm khi chọn người không phù hợp với yêu cầu sự kiện.
- **Impact on Volunteers/Events**: Sự kiện có thể tiếp nhận những tình nguyện viên thiếu kỹ năng cần thiết, gây ảnh hưởng đến chất lượng tổ chức. Volunteer có hồ sơ tốt nhưng không được hiển thị chi tiết sẽ mất cơ hội tham gia.
- **Business Value**: Cung cấp cái nhìn toàn diện về ứng viên, giúp nâng cao chất lượng sàng lọc, đảm bảo "đúng người đúng việc" và tăng tính chuyên nghiệp trong quản trị nhân sự sự kiện.

## 2. DOMAIN KNOWLEDGE
- **Staff Role & Permissions**: Staff có quyền truy cập sâu vào hồ sơ đăng ký của các ứng viên thuộc sự kiện mà tổ chức họ đang quản lý.
- **Application Workflow**: Đơn đăng ký ở trạng thái `Submitted` sẽ được Staff xem chi tiết để chuyển sang trạng thái `Reviewed` (đang xem xét) trước khi đưa ra quyết định cuối cùng.
- **Business Rules**: 
    - Staff chỉ được xem chi tiết đơn đăng ký của các sự kiện thuộc cùng Organization ID.
    - Thông tin hiển thị bao gồm cả các câu trả lời cho các câu hỏi tùy chỉnh (nếu có) trong form đăng ký sự kiện.
- **Cross-Module Dependencies**: UC23 phụ thuộc vào dữ liệu từ UC12 (Apply Event) và UC18 (View Profile). Nó là bước đệm bắt buộc trước khi thực hiện UC24 (Approve) hoặc UC25 (Reject).

## 3. STAKEHOLDERS
- **Staff (Actor chính)**: Muốn đánh giá kỹ năng, kinh nghiệm và lý do tham gia của Volunteer để lọc ra những ứng viên tiềm năng nhất.
- **Volunteer**: Mong muốn những thông tin mình cung cấp được Staff xem xét đầy đủ và công bằng.
- **System Admin**: Quan tâm đến việc bảo mật thông tin cá nhân của Volunteer, đảm bảo Staff không lạm dụng dữ liệu.
- **System/Infrastructure**: Đảm bảo việc tải các dữ liệu phức tạp (bao gồm cả file đính kèm/CV nếu có) diễn ra mượt mà.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)
- **Authorization Constraint**: Staff CHỈ được phép xem chi tiết đơn đăng ký gắn với các sự kiện thuộc Organization của mình quản lý.
- **Data Privacy Constraint**: Staff không được phép sao chép hoặc trích xuất thông tin nhạy cảm của Volunteer ra ngoài hệ thống vì mục đích cá nhân.
- **State Transition Constraint**: Chức năng xem chi tiết khả dụng ở mọi trạng thái của đơn đăng ký (Submitted, Approved, Rejected).
- **Audit Trail Constraint**: Hệ thống phải ghi log chi tiết: Staff nào đã xem hồ sơ của Volunteer nào, vào thời điểm nào để phục vụ hậu kiểm bảo mật.

## 5. ASSUMPTIONS (Giả định)
- **Giả định về dữ liệu**: Giả định Volunteer đã điền đầy đủ các thông tin bắt buộc trong profile và form đăng ký.
- **Giả định về permission**: Staff đã vượt qua lớp kiểm tra quyền ở trang danh sách (UC22) trước khi vào trang chi tiết.
- **Giả định về dependencies**: Module Profile Management đã sẵn sàng để cung cấp thông tin kỹ năng (skills) của Volunteer.

## 6. OPEN QUESTIONS
1. Staff có được xem lịch sử tham gia các sự kiện trước đó (Volunteer History) của ứng viên ngay tại trang chi tiết này không?
2. Có cần tính năng "Internal Note" để Staff ghi chú nhận xét về ứng viên sau khi xem hồ sơ không?

## 7. DECISIONS
**Quyết định cho câu hỏi 1 - Data Integration:**
- **Lựa chọn**: Cách 2 - Hiển thị tóm tắt số lượng sự kiện đã tham gia và tỷ lệ hoàn thành công việc của Volunteer.
- **Lý do**: Giúp Staff đánh giá độ tin cậy và kinh nghiệm của ứng viên nhanh hơn mà không cần chuyển sang trang Profile.
- **Impact**: Backend cần thực hiện join table hoặc gọi service từ Module Profile.

**Quyết định cho câu hỏi 2 - Internal Process:**
- **Lựa chọn**: Option A - Cho phép Staff lưu ghi chú nội bộ (chỉ Staff thấy).
- **Lý do**: Hỗ trợ làm việc nhóm nếu có nhiều Staff cùng sàng lọc một danh sách ứng viên lớn.
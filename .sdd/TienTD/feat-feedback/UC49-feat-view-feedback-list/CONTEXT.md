# CONTEXT.md — Feature: Staff Module - View Feedback List (UC49)
# Người viết: TienTD | Ngày: 28/06/2026

## 1. PROBLEM STATEMENT
- **Current Pain Point**: Sau khi kết thúc sự kiện, Staff không có công cụ tập trung để theo dõi các đánh giá và nhận xét từ tình nguyện viên. Hiện tại, phản hồi thường được thu thập lẻ tẻ qua các kênh không chính thức hoặc ghi chép thủ công.
- **Impact on Staff Workflow**: Staff mất nhiều thời gian để tổng hợp ý kiến, khó nhận diện được các vấn đề tồn tại trong khâu tổ chức để rút kinh nghiệm cho các lần sau.
- **Impact on Volunteers/Events**: Volunteer cảm thấy ý kiến của mình không được trân trọng nếu không thấy sự thay đổi. Các sự kiện tiếp theo có nguy cơ lặp lại những sai sót cũ, làm giảm chất lượng chương trình.
- **Business Value**: Cung cấp cái nhìn khách quan về chất lượng sự kiện, giúp Staff cải thiện quy trình tổ chức và tăng mức độ gắn kết của Volunteer thông qua việc lắng nghe phản hồi.

## 2. DOMAIN KNOWLEDGE
- **Staff Role & Permissions**: Staff có quyền xem danh sách phản hồi của các sự kiện đã kết thúc thuộc phạm vi quản lý của tổ chức mình.
- **Event Lifecycle**: Phản hồi thường chỉ xuất hiện sau khi sự kiện chuyển sang trạng thái `Completed`.
- **Feedback Management**: Hệ thống thu thập đánh giá theo thang điểm (Rating) và nhận xét chi tiết (Comment) từ Volunteer thông qua UC48.
- **Business Rules**: 
    - Staff chỉ được xem danh sách phản hồi của các sự kiện thuộc cùng Organization ID.
    - Phản hồi là dữ liệu chỉ đọc đối với Staff (không được sửa/xóa phản hồi của Volunteer).
- **Cross-Module Dependencies**: UC49 phụ thuộc vào dữ liệu được tạo ra từ UC48 (Submit Feedback) của Member 2.

## 3. STAKEHOLDERS
- **Staff (Actor chính)**: Muốn xem danh sách đánh giá để đánh giá hiệu quả tổ chức và sự hài lòng của tình nguyện viên.
- **Volunteer**: Là người cung cấp dữ liệu đầu vào thông qua các nhận xét và đánh giá cá nhân.
- **Organization Admin**: Giám sát chất lượng các sự kiện của tổ chức thông qua báo cáo tổng hợp từ feedback.
- **System Admin**: Quan tâm đến việc lưu trữ dữ liệu và tính minh bạch của các phản hồi.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)
- **Authorization Constraint**: Staff CHỈ được phép xem feedback của các sự kiện do Organization của mình quản lý.
- **Data Privacy Constraint**: Staff không được phép thấy các thông tin liên lạc nhạy cảm của Volunteer trong danh sách phản hồi trừ khi Volunteer cho phép hiển thị profile.
- **State Transition Constraint**: Danh sách feedback chỉ hiển thị dữ liệu của các sự kiện đã hoặc đang diễn ra, không hiển thị cho sự kiện `Draft`.
- **Audit Trail Constraint**: Hệ thống ghi log mỗi khi Staff truy cập vào danh sách phản hồi hoặc thực hiện xuất báo cáo feedback.

## 5. ASSUMPTIONS (Giả định)
- **Giả định về Staff behavior**: Staff sử dụng feedback để cải thiện chất lượng công việc, không dùng để trù dập Volunteer.
- **Giả định về dữ liệu**: Giả định Volunteer đã thực hiện gửi feedback sau khi sự kiện kết thúc.
- **Giả định về dependencies**: Module Feedback dành cho Volunteer (UC48) đã hoạt động để có dữ liệu hiển thị.

## 6. OPEN QUESTIONS
1. Staff có được phép trả lời (Reply) trực tiếp vào feedback của Volunteer tại trang này không?
2. Có cần tính năng ẩn các feedback có nội dung không phù hợp (Spam/Toxic) không?

## 7. DECISIONS
**Quyết định cho câu hỏi 1 - Interaction Strategy:**
- **Lựa chọn**: Option C - Không cho phép trả lời trực tiếp trong giai đoạn này.
- **Lý do**: Tập trung vào việc thu thập và phân tích dữ liệu trước khi mở rộng tính năng tương tác hai chiều.
- **Impact**: UI chỉ hiển thị danh sách dạng bảng (Table view).

**Quyết định cho câu hỏi 2 - Moderation Strategy:**
- **Lựa chọn**: Option B - Staff có thể đánh dấu (Flag) feedback vi phạm để Admin xem xét.
- **Lý do**: Đảm bảo môi trường phản hồi lành mạnh nhưng vẫn giữ được tính khách quan.
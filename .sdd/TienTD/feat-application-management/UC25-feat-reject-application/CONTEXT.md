# CONTEXT.md — Feature: Staff Module - Reject Application (UC25)
# Người viết: TienTD | Ngày: 28/06/2026

## 1. PROBLEM STATEMENT
- **Current Pain Point**: Staff thường xuyên nhận được các đơn đăng ký không phù hợp với yêu cầu của sự kiện (thiếu kỹ năng, không đủ thời gian, hoặc hồ sơ không đạt yêu cầu). Nếu không có chức năng từ chối chính thức, danh sách ứng viên sẽ bị tồn đọng các đơn "rác".
- **Impact on Staff Workflow**: Staff gặp khó khăn trong việc lọc danh sách để tập trung vào những ứng viên tiềm năng. Việc quản lý thủ công các đơn không đạt yêu cầu gây nhầm lẫn trong quá trình điều phối nhân sự.
- **Impact on Volunteers/Events**: Volunteer không nhận được phản hồi rõ ràng về việc tại sao mình không được chọn, dẫn đến trải nghiệm không tốt và họ có thể bỏ lỡ cơ hội đăng ký các sự kiện khác phù hợp hơn.
- **Business Value**: Làm sạch dữ liệu quản lý, giúp Staff tập trung nguồn lực vào đúng đối tượng, đồng thời cung cấp phản hồi minh bạch cho Volunteer, duy trì sự chuyên nghiệp của tổ chức.

## 2. DOMAIN KNOWLEDGE
- **Staff Role & Permissions**: Staff có quyền từ chối các đơn đăng ký tham gia sự kiện thuộc tổ chức của mình.
- **Application Workflow**: Chuyển trạng thái đơn đăng ký từ `Submitted` hoặc `Reviewed` sang `Rejected`.
- **Business Rules**: 
    - Staff chỉ được từ chối đơn của sự kiện thuộc Organization của mình.
    - Khi từ chối, Staff nên cung cấp lý do (tùy chọn hoặc bắt buộc tùy cấu hình) để gửi kèm thông báo cho Volunteer.
- **Cross-Module Dependencies**: UC25 phụ thuộc vào UC23 (View Application Detail). Hành động từ chối sẽ kích hoạt thông báo qua email (tương tự luồng của UC64).

## 3. STAKEHOLDERS
- **Staff (Actor chính)**: Muốn loại bỏ các ứng viên không phù hợp để tinh gọn danh sách nhân sự sự kiện.
- **Volunteer**: Cần biết sớm kết quả để sắp xếp kế hoạch cá nhân và hiểu lý do bị từ chối để cải thiện hồ sơ sau này.
- **Organization Admin**: Giám sát tiêu chí từ chối của Staff để đảm bảo tính công bằng và không phân biệt đối xử.
- **System/Infrastructure**: Đảm bảo trạng thái đơn được cập nhật và ghi log đầy đủ để phục vụ báo cáo/thống kê về tỷ lệ chấp nhận/từ chối.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)
- **Authorization Constraint**: Staff CHỈ được phép từ chối đơn đăng ký gắn với các sự kiện thuộc Organization mà họ trực thuộc.
- **State Transition Constraint**: Chỉ được từ chối khi đơn đang ở trạng thái `Submitted` hoặc `Reviewed`. Không thể từ chối đơn đã được `Approved` hoặc đã bị `Rejected` trước đó.
- **Data Integrity Constraint**: Sau khi từ chối, hồ sơ của Volunteer vẫn phải được giữ lại trong hệ thống (Soft Delete hoặc lưu lịch sử) để đối soát, không được xóa vĩnh viễn đơn đăng ký.
- **Audit Trail Constraint**: Hệ thống phải ghi log: Staff nào từ chối, lý do từ chối (nếu có), và thời điểm thực hiện.

## 5. ASSUMPTIONS (Giả định)
- **Giả định về Staff behavior**: Giả định Staff từ chối dựa trên các tiêu chí chuyên môn đã được thống nhất trong tổ chức.
- **Giả định về dữ liệu**: Giả định đơn đăng ký vẫn tồn tại và chưa bị Volunteer tự hủy (UC14).
- **Giả định về môi trường**: Staff thực hiện trên Desktop để có thể nhập lý do từ chối chi tiết hơn.

## 6. OPEN QUESTIONS
1. Lý do từ chối (Rejection Reason) có bắt buộc phải nhập không?
2. Có cần cung cấp các mẫu lý do từ chối soạn sẵn (Templates) để Staff chọn nhanh không?

## 7. DECISIONS
**Quyết định cho câu hỏi 1 - Validation Strategy:**
- **Lựa chọn**: Option B - Lý do từ chối là KHÔNG bắt buộc, nhưng khuyến khích nhập để tăng tính minh bạch.
- **Lý do**: Giảm bớt rào cản thao tác cho Staff khi xử lý số lượng lớn đơn không đạt yêu cầu rõ ràng (VD: spam).
- **Impact**: Backend cho phép trường `rejection_reason` nhận giá trị null.

**Quyết định cho câu hỏi 2 - UX Strategy:**
- **Lựa chọn**: Option A - Cung cấp danh sách dropdown các lý do phổ biến (Thiếu kỹ năng, Đã đủ người, Hồ sơ chưa hoàn thiện).
- **Lý do**: Tăng hiệu suất xử lý đơn cho Staff.
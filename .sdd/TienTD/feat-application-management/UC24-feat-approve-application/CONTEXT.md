# CONTEXT.md — Feature: Staff Module - Approve Application (UC24)
# Người viết: TienTD | Ngày: 28/06/2026

## 1. PROBLEM STATEMENT
- **Current Pain Point**: Hiện tại, sau khi sàng lọc ứng viên, Staff thiếu một công cụ chính thức để xác nhận sự tham gia của Volunteer trên hệ thống. Việc thông báo kết quả thường thực hiện qua các kênh không chính thống (nhắn tin, gọi điện), dẫn đến việc khó quản lý danh sách chính thức cho ngày diễn ra sự kiện.
- **Impact on Staff Workflow**: Staff khó theo dõi được số lượng tình nguyện viên thực tế đã được chấp nhận, gây khó khăn cho việc chuẩn bị hậu cần, trang thiết bị và phân công nhiệm vụ.
- **Impact on Volunteers/Events**: Volunteer không nhận được xác nhận chính thức, dẫn đến tâm lý lo lắng hoặc họ có thể đăng ký sự kiện khác, gây thiếu hụt nhân sự đột xuất cho sự kiện hiện tại.
- **Business Value**: Chuẩn hóa quy trình phê duyệt giúp đảm bảo nhân sự chất lượng cho sự kiện, tự động hóa luồng thông báo và tạo cơ sở dữ liệu chính xác cho việc điểm danh (Attendance) sau này.

## 2. DOMAIN KNOWLEDGE
- **Staff Role & Permissions**: Staff có toàn quyền phê duyệt đơn đăng ký tham gia các sự kiện thuộc tổ chức của mình quản lý.
- **Application Workflow**: UC24 thực hiện bước chuyển trạng thái quan trọng nhất trong quy trình: `Submitted` hoặc `Reviewed` chuyển sang `Approved`.
- **Business Rules**: 
    - Staff chỉ được phê duyệt đơn của sự kiện thuộc Organization của mình.
    - Một khi đơn đã được phê duyệt, hệ thống sẽ tự động gửi email xác nhận (UC64).
- **Cross-Module Dependencies**: UC24 phụ thuộc vào dữ liệu từ UC23 (View Application Detail) để đưa ra quyết định. Kết quả của UC24 là dữ liệu đầu vào bắt buộc cho UC45 (Attendance Check) và UC64 (Event Approval Email).

## 3. STAKEHOLDERS
- **Staff (Actor chính)**: Muốn xác nhận các ứng viên phù hợp một cách nhanh chóng để chốt danh sách nhân sự.
- **Volunteer**: Nhận được thông báo trúng tuyển và các hướng dẫn tiếp theo cho sự kiện.
- **System Admin**: Giám sát quyền hạn thực hiện phê duyệt để tránh các sai sót nghiệp vụ.
- **System/Infrastructure**: Đảm bảo trạng thái đơn đăng ký được cập nhật tức thì và đồng bộ với dịch vụ gửi Email.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)
- **Authorization Constraint**: Staff CHỈ được phép phê duyệt đơn đăng ký gắn với các sự kiện thuộc Organization ID mà họ trực thuộc.
- **State Transition Constraint**: Chỉ được thực hiện hành động phê duyệt khi đơn đăng ký đang ở trạng thái `Submitted` hoặc `Reviewed`. Không thể phê duyệt đơn đã bị `Rejected`.
- **Business Rule Constraint**: Tổng số đơn được phê duyệt không được vượt quá số lượng tình nguyện viên tối đa đã thiết lập trong UC15 (Add Event) cộng với một tỷ lệ dự phòng (nếu có).
- **Audit Trail Constraint**: Hệ thống phải ghi log: Staff nào phê duyệt, đơn nào, vào lúc nào.

## 5. ASSUMPTIONS (Giả định)
- **Giả định về Staff behavior**: Staff đã xem xét hồ sơ ứng viên (UC23) trước khi nhấn nút phê duyệt.
- **Giả định về dữ liệu**: Giả định thông tin sự kiện và đơn đăng ký tồn tại hợp lệ trong hệ thống.
- **Giả định về dịch vụ bên ngoài**: Giả định Email Service (UC64) luôn sẵn sàng để nhận trigger từ hành động phê duyệt.

## 6. OPEN QUESTIONS
1. Staff có thể phê duyệt hàng loạt (Bulk Approve) nhiều ứng viên cùng lúc từ trang danh sách không?
2. Sau khi phê duyệt, Staff có quyền thu hồi (Undo) quyết định này không?

## 7. DECISIONS
**Quyết định cho câu hỏi 1 - Bulk Operations:**
- **Lựa chọn**: Cách 1 - Cho phép phê duyệt hàng loạt tại trang danh sách (UC22).
- **Lý do**: Tăng hiệu suất làm việc khi Staff cần xử lý hàng chục ứng viên cho các sự kiện lớn.
- **Impact**: Cần thiết kế thêm checkbox và nút "Bulk Approve" tại UI trang danh sách.

**Quyết định cho câu hỏi 2 - Error Recovery:**
- **Lựa chọn**: Option B - Không cho phép Undo trực tiếp trên nút nhấn để tránh nhầm lẫn dữ liệu email đã gửi. Nếu muốn thay đổi, Staff phải vào quy trình chỉnh sửa trạng thái riêng.
- **Lý do**: Đảm bảo tính nhất quán với thông báo đã gửi cho Volunteer.
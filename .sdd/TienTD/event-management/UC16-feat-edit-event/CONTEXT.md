# CONTEXT.md — Feature: Staff Module - Edit Event (UC16)
# Người viết: TienTD | Ngày: 28/06/2026

## 1. PROBLEM STATEMENT
- **Current Pain Point**: Sau khi tạo sự kiện (UC15), các thông tin thực tế có thể thay đổi (thời gian, địa điểm, số lượng tình nguyện viên cần thiết). Nếu không có chức năng chỉnh sửa, Staff phải xóa đi tạo lại, gây mất dữ liệu và gián đoạn quy trình đăng ký.
- **Impact on Staff Workflow**: Staff mất công sức nhập liệu lại từ đầu. Việc không thể cập nhật thông tin kịp thời khiến Staff khó điều phối hoạt động.
- **Impact on Volunteers/Events**: Volunteer có thể nhận thông tin sai lệch nếu sự kiện thay đổi mà không được cập nhật trên hệ thống, dẫn đến việc đến sai giờ hoặc sai địa điểm.
- **Business Value**: Đảm bảo thông tin sự kiện luôn chính xác và mới nhất, duy trì sự tin cậy của hệ thống và tối ưu hóa quy trình quản lý sự kiện.

## 2. DOMAIN KNOWLEDGE
- **Staff Role & Permissions**: Staff có quyền chỉnh sửa các thông tin của sự kiện thuộc tổ chức của mình.
- **Event Lifecycle**: 
    - Sự kiện ở trạng thái `Draft`: Có thể chỉnh sửa mọi trường thông tin.
    - Sự kiện ở trạng thái `Published`: Chỉnh sửa cần hạn chế (không nên đổi ngày bắt đầu về quá khứ hoặc đổi loại hình sự kiện quá khác biệt).
- **Business Rules**: 
    - Staff chỉ được chỉnh sửa sự kiện thuộc Organization mà họ quản lý.
    - Không được phép thay đổi ngày bắt đầu sự kiện thành một ngày đã qua.
- **Cross-Module Dependencies**: Kết quả của UC16 sẽ ảnh hưởng trực tiếp đến UC09 (View Event Detail) của Volunteer và UC65 (Event Reminder Email).

## 3. STAKEHOLDERS
- **Staff (Actor chính)**: Muốn cập nhật thông tin nhanh chóng để đảm bảo kế hoạch diễn ra suôn sẻ.
- **Volunteer**: Cần nhận được thông tin cập nhật chính xác nhất để sắp xếp thời gian tham gia.
- **Organization Admin**: Giám sát tính chính xác của các thay đổi thông tin từ Staff.
- **System/Infrastructure**: Cần lưu trữ các phiên bản chỉnh sửa hoặc ghi log để đối soát khi có tranh chấp thông tin.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)
- **Authorization Constraint**: Staff CHỈ được phép chỉnh sửa sự kiện gắn với Organization ID mà họ trực thuộc.
- **State Transition Constraint**: Không được phép chỉnh sửa các sự kiện đã ở trạng thái `Completed` hoặc `Cancelled`.
- **Data Privacy Constraint**: Khi chỉnh sửa, không được phép làm lộ thông tin cá nhân của các Volunteer đã đăng ký trong giao diện chỉnh sửa.
- **Audit Trail Constraint**: Mọi thay đổi thông tin quan trọng (thời gian, địa điểm) phải được ghi log (ai sửa, sửa gì, lúc nào).

## 5. ASSUMPTIONS (Giả định)
- **Giả định về Staff behavior**: Staff hiểu rằng việc thay đổi thông tin quan trọng khi đã có người đăng ký sẽ ảnh hưởng đến Volunteer.
- **Giả định về dữ liệu**: Giả định sự kiện cần sửa đã tồn tại hợp lệ trong Database.
- **Giả định về permission**: Staff đã được xác thực và có quyền `EDIT_EVENT`.

## 6. OPEN QUESTIONS
1. Khi Staff đổi địa điểm hoặc thời gian, hệ thống có tự động gửi email thông báo cho những Volunteer đã đăng ký không?
2. Có giới hạn số lần chỉnh sửa đối với một sự kiện đã `Published` không?

## 7. DECISIONS
**Quyết định cho câu hỏi 1 - Notification Strategy:**
- **Lựa chọn**: Option A - Gửi notification real-time cho Volunteer đã đăng ký nếu thay đổi các trường quan trọng (Thời gian, Địa điểm).
- **Lý do**: Đảm bảo quyền lợi và lịch trình của Volunteer không bị ảnh hưởng tiêu cực.
- **Impact**: Backend cần gọi sang Module Notification sau khi lưu thành công các thay đổi quan trọng.
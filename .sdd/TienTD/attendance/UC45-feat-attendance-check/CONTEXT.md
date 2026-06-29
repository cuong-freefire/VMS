# CONTEXT.md — Feature: Staff Module - Attendance Check (UC45)
# Người viết: TienTD | Ngày: 28/06/2026

## 1. PROBLEM STATEMENT
- **Current Pain Point**: Hiện tại, việc điểm danh tình nguyện viên tại hiện trường sự kiện thường được thực hiện bằng giấy hoặc các bảng tính rời rạc. Điều này dẫn đến việc khó kiểm soát số lượng người tham gia thực tế và dễ nhầm lẫn.
- **Impact on Staff Workflow**: Staff mất nhiều thời gian để đối soát danh sách người đăng ký với người có mặt, khó cập nhật tình trạng tham gia của Volunteer lên hệ thống để thực hiện các bước tiếp theo như cấp chứng nhận.
- **Impact on Volunteers/Events**: Volunteer có thể không được ghi nhận đóng góp nếu Staff làm thất lạc danh sách điểm danh giấy. Sự kiện thiếu dữ liệu chính xác để báo cáo hiệu quả nhân sự.
- **Business Value**: Số hóa quy trình điểm danh giúp Staff kiểm soát nhân sự thời gian thực, đảm bảo tính minh bạch trong việc ghi nhận đóng góp và là cơ sở dữ liệu tin cậy để cấp chứng nhận (UC53) sau này.

## 2. DOMAIN KNOWLEDGE
- **Staff Role & Permissions**: Staff có quyền thực hiện điểm danh cho những Volunteer đã được phê duyệt (Approved) tham gia vào sự kiện của tổ chức mình.
- **Attendance Rules**: 
    - Việc điểm danh (Check-in) chỉ được thực hiện khi sự kiện ở trạng thái `Ongoing` hoặc trong khung thời gian cho phép trước/sau giờ bắt đầu.
    - Một Volunteer chỉ được ghi nhận điểm danh một lần cho mỗi ca/sự kiện.
- **Business Rules**: 
    - Staff chỉ được điểm danh cho sự kiện thuộc Organization của mình quản lý.
    - Chỉ những Volunteer có trạng thái đơn đăng ký là `Approved` (từ UC24) mới xuất hiện trong danh sách điểm danh.
- **Cross-Module Dependencies**: UC45 phụ thuộc vào kết quả của UC24 (Approve Application). Dữ liệu từ UC45 là điều kiện tiên quyết để thực hiện UC53 (Generate Certificate).

## 3. STAKEHOLDERS
- **Staff (Actor chính)**: Muốn thực hiện điểm danh nhanh chóng ngay tại hiện trường sự kiện (có thể qua mobile hoặc tablet).
- **Volunteer**: Mong muốn được ghi nhận sự có mặt một cách chính xác để đủ điều kiện nhận chứng nhận.
- **Organization Admin**: Giám sát tỷ lệ tham gia thực tế (Attendance Rate) so với số lượng đăng ký.
- **System Admin**: Quan tâm đến việc ngăn chặn điểm danh giả mạo hoặc gian lận dữ liệu.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)
- **Authorization Constraint**: Staff CHỈ được phép điểm danh cho Volunteer thuộc sự kiện mà Organization của họ quản lý.
- **State Transition Constraint**: Hệ thống chỉ cho phép điểm danh khi sự kiện chưa kết thúc (không ở trạng thái `Completed` hoặc `Cancelled`).
- **Data Integrity Constraint**: Không được phép ghi đè (duplicate) bản ghi điểm danh nếu Volunteer đã được xác nhận có mặt.
- **Audit Trail Constraint**: Mọi hành động điểm danh phải ghi lại thời gian (timestamp) thực tế và ID của Staff thực hiện.

## 5. ASSUMPTIONS (Giả định)
- **Giả định về Staff behavior**: Staff trực tiếp gặp và xác nhận danh tính của Volunteer tại hiện trường trước khi thực hiện check-in trên hệ thống.
- **Giả định về dữ liệu**: Giả định danh sách Volunteer `Approved` đã được đồng bộ đầy đủ từ UC24.
- **Giả định về môi trường**: Staff có thể sử dụng thiết bị di động với kết nối internet (4G/Wifi) tại nơi tổ chức sự kiện.

## 6. OPEN QUESTIONS
1. Hệ thống có cần hỗ trợ điểm danh qua QR Code (Volunteer đưa mã, Staff quét) hay chỉ chọn từ danh sách?
2. Có cần thực hiện điểm danh cả lúc đến (Check-in) và lúc về (Check-out) để tính số giờ tham gia không?

## 7. DECISIONS
**Quyết định cho câu hỏi 1 - Method Strategy:**
- **Lựa chọn**: Cách 2 - Hỗ trợ cả chọn danh sách thủ công (v1) và sẵn sàng tích hợp quét QR Code (v2).
- **Lý do**: Đảm bảo Staff vẫn làm việc được nếu thiết bị không có camera hoặc mã QR của Volunteer gặp sự cố.
- **Impact**: UI cần có thanh tìm kiếm nhanh theo tên hoặc ID của Volunteer.

**Quyết định cho câu hỏi 2 - Check-out Policy:**
- **Lựa chọn**: Option A - Chỉ thực hiện Check-in một lần duy nhất để ghi nhận sự có mặt.
- **Lý do**: Đơn giản hóa quy trình cho Staff tại hiện trường, tập trung vào việc xác nhận có tham gia hay không.
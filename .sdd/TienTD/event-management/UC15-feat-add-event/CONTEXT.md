# CONTEXT.md — Feature: Staff Module - Add Event (UC15)
# Người viết: TienTD | Ngày: 28/06/2026

## 1. PROBLEM STATEMENT
- **Current Pain Point**: Hiện tại, việc khởi tạo các sự kiện tình nguyện đang được Staff thực hiện thủ công hoặc qua các công cụ rời rạc, dẫn đến dữ liệu không đồng nhất và khó tiếp cận bởi Volunteer [3].
- **Impact on Staff Workflow**: Staff mất nhiều thời gian để điều phối thông tin, dễ xảy ra sai sót trong việc mô tả kỹ năng yêu cầu hoặc thời gian tổ chức sự kiện [3].
- **Impact on Volunteers/Events**: Volunteer thiếu thông tin chính xác để đăng ký, làm giảm tỷ lệ tham gia và gây ảnh hưởng đến uy tín của tổ chức [3].
- **Business Value**: Tự động hóa quy trình tạo sự kiện giúp tiết kiệm 50% thời gian quản lý, chuẩn hóa dữ liệu đầu vào và tăng khả năng hiển thị sự kiện đến đúng đối tượng mục tiêu [7].

## 2. DOMAIN KNOWLEDGE
- **Staff Role & Permissions**: Staff có quyền tạo, chỉnh sửa và quản lý các sự kiện thuộc phạm vi tổ chức của mình [7].
- **Event Lifecycle**: Sự kiện khi tạo mới có thể ở trạng thái `Draft` (Nháp) hoặc `Published` (Đã công bố) [7].
- **Business Rules**: 
    - Staff chỉ được tạo sự kiện cho Organization mà họ đang trực thuộc [8, 9].
    - Tên sự kiện không được trùng lặp trong cùng một tổ chức tại cùng một thời điểm.
- **Cross-Module Dependencies**: UC15 cung cấp dữ liệu đầu vào cho UC08 (View Event List) và UC12 (Apply Event) [8].

## 3. STAKEHOLDERS
- **Staff (Actor chính)**: Muốn tạo sự kiện nhanh chóng, đầy đủ thông tin để quản lý hiệu quả [10].
- **Volunteer**: Nhận được thông báo về sự kiện mới và có đầy đủ thông tin để quyết định tham gia [10].
- **Organization Admin**: Giám sát các sự kiện do Staff tạo ra để đảm bảo đúng định hướng của tổ chức [10].
- **System/Infrastructure**: Đảm bảo tính toàn vẹn dữ liệu khi lưu trữ các trường thông tin phức tạp (mô tả, yêu cầu kỹ năng) [10].

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)
- **Authorization Constraint**: Staff CHỈ được phép tạo sự kiện gắn với ID của Organization mà họ quản lý [9].
- **State Transition Constraint**: Sự kiện mới tạo mặc định ở trạng thái `Draft` trừ khi Staff chọn `Publish` ngay lập tức [9].
- **Business Rule Constraint**: Ngày bắt đầu sự kiện không được là ngày trong quá khứ [11].
- **Audit Trail Constraint**: Hệ thống phải ghi log: ai tạo sự kiện, vào lúc nào [11].

## 5. ASSUMPTIONS (Giả định)
- **Giả định về dữ liệu**: Giả định thông tin về Organization của Staff đã tồn tại hợp lệ trong hệ thống [11].
- **Giả định về môi trường**: Staff thực hiện thao tác trên giao diện Desktop để nhập liệu chính xác các thông tin mô tả dài [12].
- **Giả định về permissions**: Staff đã được phân quyền quản lý sự kiện trong module Event & Application Management [1, 12].

## 6. OPEN QUESTIONS
1. Staff có được phép sao chép (clone) một sự kiện cũ để tạo sự kiện mới nhanh hơn không?
2. Có cần tích hợp AI để gợi ý mô tả sự kiện dựa trên tên sự kiện không?

## 7. DECISIONS
**Quyết định cho câu hỏi 1 - Authorization Strategy:**
- **Lựa chọn**: Cách 2 - Staff được tạo và quản lý tất cả resource trong organization mình quản lý [13, 14].
- **Lý do**: Tăng tính linh hoạt trong đội ngũ Staff của cùng một tổ chức.
- **Impact**: Backend cần check `organization_id` của Staff khi thực hiện request [14].
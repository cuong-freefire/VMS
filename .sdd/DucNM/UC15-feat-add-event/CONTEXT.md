# CONTEXT.md — Feature: Staff Module - Add Event (UC15)
# Người viết: DucNM | Ngày: 28/06/2026 | Cập nhật: 2026-07-18

## 1. PROBLEM STATEMENT
- **Current Pain Point**: Hiện tại, việc khởi tạo các sự kiện tình nguyện đang được Staff thực hiện thủ công hoặc qua các công cụ rời rạc, dẫn đến dữ liệu không đồng nhất và khó tiếp cận bởi Volunteer.
- **Impact on Staff Workflow**: Staff mất nhiều thời gian để điều phối thông tin, dễ xảy ra sai sót trong việc mô tả kỹ năng yêu cầu hoặc thời gian tổ chức sự kiện.
- **Impact on Volunteers/Events**: Volunteer thiếu thông tin chính xác để đăng ký, làm giảm tỷ lệ tham gia và gây ảnh hưởng đến uy tín của tổ chức.
- **Business Value**: Tự động hóa quy trình tạo sự kiện giúp tiết kiệm 50% thời gian quản lý, chuẩn hóa dữ liệu đầu vào và tăng khả năng hiển thị sự kiện đến đúng đối tượng mục tiêu.

## 2. DOMAIN KNOWLEDGE
- **Staff Role & Permissions**: Staff có quyền tạo, chỉnh sửa và quản lý các sự kiện do mình tạo ra.
- **Event Lifecycle**: Sự kiện khi tạo mới ở trạng thái `Draft`. Staff có thể submit lên Manager để phê duyệt, chuyển sang `PENDING_APPROVAL`.
- **Business Rules**: 
    - Staff chỉ được tạo sự kiện — ownership được xác định qua `created_by` từ JWT.
    - Tên sự kiện không được trùng lặp với sự kiện khác do cùng Staff tạo tại cùng một thời điểm.
- **Cross-Module Dependencies**: UC15 cung cấp dữ liệu đầu vào cho UC08 (View Event List), UC16 (Edit Event), UC67 (View Pending Event), và UC12 (Apply Event).

## 3. STAKEHOLDERS
- **Staff (Actor chính)**: Muốn tạo sự kiện nhanh chóng, đầy đủ thông tin để quản lý hiệu quả.
- **Volunteer**: Nhận được thông báo về sự kiện mới và có đầy đủ thông tin để quyết định tham gia.
- **Manager**: Phê duyệt sự kiện do Staff tạo ra để đảm bảo đúng định hướng.
- **System/Infrastructure**: Đảm bảo tính toàn vẹn dữ liệu khi lưu trữ các trường thông tin phức tạp (mô tả, yêu cầu kỹ năng).

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)
- **Authorization Constraint**: Staff được tạo sự kiện, `created_by` được lấy từ JWT token.
- **State Transition Constraint**: Sự kiện mới tạo mặc định ở trạng thái `Draft`.
- **Business Rule Constraint**: Ngày bắt đầu sự kiện không được là ngày trong quá khứ.
- **Audit Trail Constraint**: Hệ thống phải ghi log: ai tạo sự kiện, vào lúc nào (dùng `created_by` và `created_at`).

## 5. ASSUMPTIONS (Giả định)
- **Giả định về dữ liệu**: Giả định EventCategory và Skill đã tồn tại hợp lệ trong hệ thống.
- **Giả định về môi trường**: Staff thực hiện thao tác trên giao diện Desktop để nhập liệu chính xác các thông tin mô tả dài.
- **Giả định về permissions**: Staff đã được phân quyền quản lý sự kiện.

## 6. OPEN QUESTIONS
1. Staff có được phép sao chép (clone) một sự kiện cũ để tạo sự kiện mới nhanh hơn không?
2. Có cần tích hợp AI để gợi ý mô tả sự kiện dựa trên tên sự kiện không?

## 7. DECISIONS
**Quyết định cho câu hỏi 1 - Authorization Strategy:**
- **Lựa chọn**: Staff được tạo và quản lý tất cả event do mình tạo ra.
- **Lý do**: Ownership qua `created_by` đơn giản, phù hợp với Prisma schema hiện tại (không có Organization model).
- **Impact**: Backend cần check `created_by` của Staff khi thực hiện request edit/delete.
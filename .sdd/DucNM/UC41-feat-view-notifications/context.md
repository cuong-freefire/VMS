# CONTEXT.md — View Notifications (UC41)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-28

## 1. PROBLEM STATEMENT

Trong hệ thống VMS, người dùng (Volunteer, Staff, Manager, Admin) cần nhận thông báo về các sự kiện quan trọng như đơn đăng ký được duyệt, sự kiện sắp diễn ra, chứng nhận mới. Nếu không có trang danh sách thông báo, người dùng phải tự kiểm tra thủ công từng module, dẫn đến bỏ lỡ thông tin quan trọng.

## 2. DOMAIN KNOWLEDGE

- **In-app Notification:** Thông báo hiển thị trong hệ thống (không phải email hay push notification). Mỗi user chỉ thấy thông báo của chính mình.
- **Sắp xếp:** Thông báo mới nhất hiển thị trên cùng.
- **Trạng thái đọc/chưa đọc:** Thông báo chưa đọc được đánh dấu nổi bật (bold). Có badge đếm số lượng chưa đọc trên navbar.
- **Polling:** Frontend polling API unread-count mỗi 30 giây để cập nhật badge.
- **Phân loại:** Notification có type như system, event_reminder, application_approved, application_rejected, certificate_issued.

## 3. STAKEHOLDERS

- **Volunteer:** Cần thấy thông báo về trạng thái đơn đăng ký, sự kiện sắp diễn ra, chứng nhận mới.
- **Staff:** Cần thấy thông báo khi có đơn đăng ký mới cần duyệt.
- **Manager/Admin:** Cần thấy thông báo hệ thống tổng quan.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **API format:** Endpoint `GET /api/v1/notifications` — chỉ trả về notification của user hiện tại (từ JWT).
- **Phân trang:** Có hỗ trợ phân trang nếu số lượng lớn.
- **Phân quyền:** Mọi user đã đăng nhập đều có quyền xem thông báo của chính mình.
- **Guest:** HTTP 401.
- **Swagger:** Bắt buộc có Swagger JSDoc.
- **Sắp xếp:** Mới nhất ở trên cùng (ORDER BY created_at DESC).

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định bảng Notification có: `notification_id`, `user_id`, `title`, `message`, `type`, `reference_id`, `reference_type`, `is_read`, `created_at`.
- Giả định không có real-time (WebSocket). Dùng polling 30 giây cho unread count.
- Giả định user chỉ thấy thông báo của chính họ — không có quyền xem thông báo của người khác.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Phân trang:** Mặc định bao nhiêu notification mỗi trang? Có cho phép tải thêm (load more) không?
2. **Unread count:** Cần endpoint riêng để lấy số lượng chưa đọc hay tính từ response danh sách?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** 20 notification mỗi trang. Hỗ trợ phân trang dạng page/limit.
- **A2:** Có endpoint riêng `GET /api/v1/notifications/unread-count` để Frontend polling 30 giây. Trả về `{ unread_count: N }`.

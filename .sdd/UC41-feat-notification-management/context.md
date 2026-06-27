# CONTEXT.md — Notification Management (UC41–UC44)

# Người viết: [Member Name] | Ngày: 2026-06-26

## 1. PROBLEM STATEMENT

Trong hệ thống VMS, các sự kiện tình nguyện có nhiều thay đổi về trạng thái (được duyệt, bị từ chối, sắp diễn ra, hoàn thành) và nhân viên (Staff) cần gửi thông báo đến tình nguyện viên về các sự kiện họ tham gia. Nếu không có module thông báo, người dùng phải tự kiểm tra thủ công trạng thái, dẫn đến bỏ lỡ thông tin quan trọng và trải nghiệm người dùng kém.

## 2. DOMAIN KNOWLEDGE

- **Notification (Thông báo):** Là một tin nhắn hệ thống được gửi đến người dùng (Volunteer, Staff, Manager, Admin) để thông báo về các sự kiện hoặc thay đổi trạng thái.
- **Đọc/Chưa đọc (Read/Unread):** Mỗi notification có trạng thái `is_read` để phân biệt thông báo đã đọc và chưa đọc.
- **Phân loại Notification:** Notification có thể được phân loại theo type (system, event_reminder, application_approved, application_rejected, certificate_issued, etc.).
- **Tạo thủ công bởi Staff:** Staff có thể tạo notification gửi đến một hoặc nhiều user
- **Tự động sinh bởi hệ thống:** Các thông báo tự động khi trạng thái application thay đổi, sự kiện sắp diễn ra, chứng nhận được cấp.
- **Push notification không nằm trong scope v1:** VMS chỉ hỗ trợ in-app notification (xem trong hệ thống).
- **Sắp xếp:** Thông báo mới nhất hiển thị trên cùng.

## 3. STAKEHOLDERS

- **Volunteer:** Cần nhận thông báo khi đơn đăng ký được duyệt/từ chối, nhắc nhở sự kiện sắp diễn ra, chứng nhận mới.
- **Staff:** Cần tạo thông báo đến nhóm tình nguyện viên tham gia sự kiện của mình, và nhận thông báo khi có đơn mới.
- **Manager/Admin:** Cần thấy thông báo hệ thống và quản lý các thông báo gửi đi.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **API format:** Bắt buộc dùng prefix `/api/v1/notifications` và áp dụng Zod validation cho POST/PATCH.
- **In-app only:** Không có email hay push notification trong v1. Notification chỉ hiển thị trong hệ thống.
- **Phân quyền:** Staff chỉ được tạo notification cho các tình nguyện viên đăng ký sự kiện mà Staff đó quản lý. Admin có thể gửi cho bất kỳ ai.
- **Audit log:** Mọi thông báo do Staff/Admin tạo thủ công phải ghi audit log.
- **Swagger:** Bắt buộc có comment Swagger JSDoc cho mọi endpoint.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định bảng Notification đã có trong Prisma schema với các trường: `notification_id`, `user_id`, `title`, `message`, `type`, `reference_id` (ID của entity liên quan như event_id, application_id), `reference_type` (loại entity: event, application, certificate), `is_read`, `created_at`.
- Giả định không có cơ chế real-time (WebSocket) — user phải refresh hoặc có polling định kỳ để thấy notification mới.
- Giả định notification tự động (khi application được duyệt/từ chối, certificate issued) sẽ do module Application/Certificate gọi NotificationService.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Thông báo tự động:** Những sự kiện nào tự động sinh notification? (Ví dụ: application approved/rejected, event reminder trước 1 ngày, certificate issued)
2. **Bulk notification:** Khi Staff tạo notification, có gửi một lúc cho nhiều user không? Hay chỉ gửi cho từng user riêng lẻ?
3. **Polling interval:** Nếu dùng polling để check notification mới, tần suất polling là bao lâu? 30 giây? 1 phút?
4. **Retention:** Notification cũ có tự động bị xóa không? Nếu có, sau bao lâu?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Các sự kiện tự động sinh notification gồm: (a) Application được approve/reject, (b) Event reminder trước 1 ngày, (c) Certificate được issue. Các notification này do module tương ứng gọi NotificationService để tạo.
- **A2:** Staff có thể gửi notification cùng lúc cho nhiều user bằng cách chọn nhiều user hoặc gửi theo nhóm (ví dụ: tất cả volunteer đã đăng ký một event). Hệ thống tạo một record Notification riêng cho mỗi user trong danh sách.
- **A3:** Polling interval: 30 giây. Frontend sẽ gọi API GET /api/v1/notifications/unread-count mỗi 30 giây để hiển thị badge số lượng thông báo chưa đọc.
- **A4:** Không tự động xóa. Notification cũ sẽ được giữ vĩnh viễn trong hệ thống.
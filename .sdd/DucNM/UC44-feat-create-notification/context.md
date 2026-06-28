# CONTEXT.md — Create Notification (UC44)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-28

## 1. PROBLEM STATEMENT

Staff và Admin cần gửi thông báo đến người dùng (Volunteer) về các sự kiện, thay đổi trạng thái, hoặc thông tin quan trọng. Ngoài ra, hệ thống cũng tự động sinh thông báo khi có sự kiện như đơn được duyệt, chứng nhận được cấp. Nếu không có chức năng tạo thông báo, hệ thống không thể chủ động thông tin đến người dùng.

## 2. DOMAIN KNOWLEDGE

- **Manual notification:** Staff/Admin tạo thủ công, gửi đến một hoặc nhiều user (tối đa 500 user/lần).
- **Auto notification:** Hệ thống tự động sinh notification từ các module khác (Application, Event, Certificate) bằng cách gọi NotificationService.
- **Bulk notification:** Một notification được gửi đến nhiều user — mỗi user có một record riêng.
- **Phân quyền:** Staff chỉ gửi được cho user đã đăng ký sự kiện mà Staff đó quản lý. Admin có thể gửi cho bất kỳ ai.
- **Audit log:** Mọi notification do Staff/Admin tạo thủ công đều phải ghi log.

## 3. STAKEHOLDERS

- **Staff:** Cần gửi thông báo đến các volunteer trong sự kiện của mình.
- **Admin:** Cần gửi thông báo toàn hệ thống.
- **Volunteer (người nhận):** Nhận thông báo.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **API format:** `POST /api/v1/notifications`.
- **Validation:** Zod validate — title (required), message (required), user_ids (required, max 500), type (required), reference_type (optional), reference_id (optional).
- **Phân quyền:** Chỉ Staff và Admin. Guest → 401, Volunteer → 403.
- **Scope Staff:** Staff chỉ gửi được cho user trong event mình quản lý.
- **Audit log:** Bắt buộc ghi log khi Staff/Admin tạo thủ công.
- **Swagger:** Bắt buộc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định khi tạo notification, nếu user_id không tồn tại hoặc inactive, hệ thống bỏ qua user đó và vẫn tạo cho các user hợp lệ.
- Giả định notification tự động do module khác tạo không cần audit log riêng — module gốc đã ghi log.
- Giả định không có scheduled notification — notification được gửi ngay lập tức.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Kiểm tra Staff scope:** Làm sao Staff biết user nào thuộc event mình quản lý? Frontend gửi danh sách user_ids từ UI?
2. **Type enum:** Có những type nào cho notification?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Frontend gửi mảng user_ids. Backend kiểm tra từng user_id có đăng ký event mà Staff quản lý không. Nếu không, bỏ qua user_id đó (và báo trong response).
- **A2:** Các type: `system`, `event_reminder`, `application_approved`, `application_rejected`, `certificate_issued`, `custom`. `custom` dành cho Staff/Admin tạo thủ công.

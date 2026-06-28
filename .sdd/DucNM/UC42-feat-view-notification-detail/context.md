# CONTEXT.md — View Notification Detail (UC42)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-28

## 1. PROBLEM STATEMENT

Khi người dùng thấy một thông báo trong danh sách, họ cần click vào để xem nội dung đầy đủ và được chuyển hướng đến trang chi tiết của entity liên quan (ví dụ: sự kiện, đơn đăng ký, chứng nhận). Nếu không có chức năng này, người dùng chỉ thấy tiêu đề ngắn mà không biết chi tiết và không thể thực hiện hành động tiếp theo.

## 2. DOMAIN KNOWLEDGE

- **Notification Detail:** Hiển thị nội dung đầy đủ: tiêu đề, nội dung, loại thông báo, thời gian, tham chiếu entity.
- **Deep linking:** Notification có reference_type và reference_id cho phép chuyển hướng đến trang tương ứng (sự kiện, đơn đăng ký, chứng nhận).
- **Chỉ chủ sở hữu:** User chỉ xem được notification của chính mình. Không có quyền xem của người khác.

## 3. STAKEHOLDERS

- **Volunteer:** Cần xem chi tiết thông báo về đơn đăng ký hoặc sự kiện.
- **Staff:** Cần xem chi tiết thông báo về đơn mới cần duyệt.
- **Manager/Admin:** Cần xem chi tiết thông báo hệ thống.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **API format:** Endpoint `GET /api/v1/notifications/:id`.
- **Phân quyền:** Chỉ user sở hữu notification mới được xem. Người khác → HTTP 404 (không lộ tồn tại).
- **Guest:** HTTP 401.
- **Swagger:** Bắt buộc có Swagger JSDoc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định notification detail chỉ hiển thị được nếu notification thuộc về user hiện tại.
- Giả định reference_type và reference_id có thể null nếu notification không liên kết đến entity nào.
- Giả định thông báo không tự động đánh dấu đã đọc khi xem chi tiết — việc này thuộc UC43.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Tự động đánh dấu đã đọc:** Khi xem chi tiết notification, có tự động đánh dấu nó là đã đọc không? Hay tách riêng thành 2 bước?
2. **Tham chiếu entity:** Nếu entity tham chiếu (event/application/certificate) đã bị xóa mềm, notification có hiển thị link không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Xem chi tiết tự động đánh dấu notification là đã đọc (gộp vào một request). Không cần 2 bước.
- **A2:** Nếu entity đã bị xóa mềm, notification vẫn hiển thị nhưng không có link dẫn đến entity — thay vào đó hiển thị text "[Đã xóa]".

# CONTEXT.md — Mark Notification As Read (UC43)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-28

## 1. PROBLEM STATEMENT

Sau khi người dùng xem hoặc đọc thông báo, họ cần đánh dấu thông báo đó là đã đọc để phân biệt với thông báo chưa đọc và giảm dần số unread count trên badge. Ngoài ra, người dùng cũng có nhu cầu đánh dấu tất cả thông báo là đã đọc một lần thay vì từng cái một. Nếu không có chức năng này, badge unread count sẽ luôn tăng dần và mất tác dụng cảnh báo.

## 2. DOMAIN KNOWLEDGE

- **Mark as read:** Chuyển trường `is_read` của notification từ `false` thành `true`.
- **Không thể un-read:** Một khi đã đánh dấu đã đọc, không thể quay lại trạng thái chưa đọc — luồng một chiều.
- **Bulk (đánh dấu tất cả):** Có endpoint riêng để đánh dấu tất cả notification của user là đã đọc.
- **Chỉ chủ sở hữu:** User chỉ đánh dấu được notification của chính mình.

## 3. STAKEHOLDERS

- **Tất cả user đã đăng nhập:** Ai cũng cần đánh dấu thông báo đã đọc sau khi xem.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Một chiều:** Chỉ chuyển `is_read` từ false → true. Không cho phép đảo ngược.
- **API format:**
  - Đánh dấu từng cái: `PATCH /api/v1/notifications/:id/read`
  - Đánh dấu tất cả: `PATCH /api/v1/notifications/read-all`
- **Phân quyền:** Chỉ chủ sở hữu. Người khác → HTTP 404.
- **Guest:** HTTP 401.
- **Swagger:** Bắt buộc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định `PATCH /api/v1/notifications/:id/read` gộp luôn hành động xem chi tiết (UC42).
- Giả định thao tác này không cần audit log riêng vì không thay đổi dữ liệu nghiệp vụ quan trọng.
- Giả định khi đánh dấu tất cả, chỉ đánh dấu các notification đang ở trạng thái chưa đọc — các notification đã đọc không bị ảnh hưởng.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Không có gì để hỏi thêm — nghiệp vụ đã rõ ràng.**

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Không có câu hỏi mở.

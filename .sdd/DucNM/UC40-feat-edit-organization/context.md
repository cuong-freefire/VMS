# CONTEXT.md — Edit Organization (UC40)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-28

## 1. PROBLEM STATEMENT

Sau khi tổ chức đã được tạo trong hệ thống, thông tin tổ chức có thể thay đổi theo thời gian (thay đổi tên, địa chỉ, số điện thoại, email, logo). Admin cần chức năng chỉnh sửa thông tin tổ chức để cập nhật dữ liệu cho chính xác. Ngoài ra, Admin cũng cần chức năng vô hiệu hóa (soft-delete) tổ chức khi tổ chức đó ngừng hợp tác. Nếu không có chức năng này, dữ liệu tổ chức sẽ nhanh chóng lỗi thời.

## 2. DOMAIN KNOWLEDGE

- **Edit Organization:** Cho phép Admin cập nhật toàn bộ các trường của tổ chức: name, description, address, contact_phone, contact_email, website, logo.
- **Soft-delete:** Khi Admin vô hiệu hóa tổ chức (set `is_active = false`), tổ chức không thể được tham chiếu cho sự kiện mới. Tuy nhiên, dữ liệu lịch sử vẫn được giữ nguyên.
- **Ràng buộc tham chiếu:** Không thể vô hiệu hóa tổ chức nếu tổ chức còn sự kiện đang hoạt động (Pending, In Progress). Chỉ cho phép vô hiệu hóa khi tất cả sự kiện đã Completed hoặc Cancelled.
- **Audit log:** Mọi thao tác cập nhật/vô hiệu hóa phải được ghi log.

## 3. STAKEHOLDERS

- **Admin:** Người duy nhất có quyền chỉnh sửa và vô hiệu hóa tổ chức.
- **Staff (gián tiếp):** Bị ảnh hưởng khi tổ chức bị vô hiệu hóa — không thể gán tổ chức đó cho sự kiện mới.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Admin-only:** Chỉ Admin. Mọi role khác bị HTTP 403.
- **Tên duy nhất:** Khi đổi tên, tên mới không được trùng với tổ chức khác (ngoại trừ tên hiện tại).
- **Soft-delete:** Không hard-delete. Chỉ set `is_active = false`.
- **Ràng buộc sự kiện:** Không thể soft-delete nếu còn sự kiện đang hoạt động → HTTP 409 Conflict.
- **API format:** Endpoint `PUT /api/v1/organizations/:id` hoặc `PATCH`.
- **Swagger:** Bắt buộc có Swagger JSDoc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định Admin có thể sửa một phần hoặc toàn bộ các trường.
- Giả định việc khôi phục tổ chức đã inactive (set `is_active = true` lại) không có UI trong v1 — chỉ thực hiện qua database nếu cần.
- Giả định tổ chức còn sự kiện Completed/Cancelled vẫn cho phép vô hiệu hóa (vì không ảnh hưởng đến sự kiện đã kết thúc).

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Endpoint method:** Dùng `PUT` (thay thế toàn bộ) hay `PATCH` (cập nhật một phần)?
2. **Logo cũ:** Khi upload logo mới, có xóa ảnh cũ trên Cloudinary không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Dùng `PUT /api/v1/organizations/:id` để đồng bộ với convention dự án. Client gửi toàn bộ trường (kể cả trường không thay đổi).
- **A2:** Có xóa ảnh cũ trên Cloudinary sau khi upload ảnh mới thành công để tránh lưu trữ rác.

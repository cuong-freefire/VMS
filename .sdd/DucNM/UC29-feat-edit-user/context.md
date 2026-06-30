# CONTEXT.md — Edit User (UC29)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-30

## 1. PROBLEM STATEMENT

Admin cần có khả năng chỉnh sửa thông tin người dùng trong hệ thống VMS — ví dụ: cập nhật họ tên khi user đổi tên, thay đổi số điện thoại, cập nhật role, hoặc vô hiệu hóa tài khoản. Nếu không có chức năng này, Admin không thể cập nhật thông tin người dùng khi có thay đổi và không thể khóa tài khoản vi phạm.

## 2. DOMAIN KNOWLEDGE

- **Editable fields:** Họ tên, số điện thoại, avatar, role, trạng thái active/inactive.
- **Email immutability:** Email không thể thay đổi sau khi tạo — nếu cần đổi email, phải tạo user mới.
- **Soft-delete via is_active:** Admin có thể vô hiệu hóa tài khoản (is_active = false) thay vì xóa cứng.
- **Password change:** Việc đổi mật khẩu thuộc UC06 (Change Password) — không thuộc Edit User.

## 3. STAKEHOLDERS

- **Admin:** Cần cập nhật thông tin người dùng, thay đổi role, hoặc vô hiệu hóa tài khoản.
- **Người dùng bị ảnh hưởng:** Thông tin cá nhân của họ sẽ thay đổi trên hệ thống.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền:** Chỉ Admin mới có quyền chỉnh sửa user. Các role khác bị từ chối HTTP 403.
- **API format:** Endpoint bắt buộc là `PATCH /api/v1/users/:id` (hoặc PUT tùy thiết kế).
- **Validation:** Validate dữ liệu đầu vào bằng Zod trước khi xử lý.
- **Swagger:** Bắt buộc có Swagger JSDoc đầy đủ cho endpoint này.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định bảng User đã có trong schema với đầy đủ trường.
- Giả định middleware xác thực JWT và phân quyền đã hoạt động từ module Auth (UC03).
- Giả định Admin không thể tự chỉnh sửa role của mình xuống thấp hơn (ví dụ: Admin không thể tự hạ xuống Staff) để tránh mất quyền Admin cuối cùng.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Email:** Có cho phép Admin đổi email của user không?
2. **Password:** Có cho phép Admin đặt lại mật khẩu cho user không?
3. **Self-edit restriction:** Admin có được tự hạ role của chính mình không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** KHÔNG. Email là bất biến sau khi tạo. Chỉ tạo user mới nếu cần email khác.
- **A2:** KHÔNG. Đổi mật khẩu thuộc UC06 (Change Password) — liên quan đến bảo mật cá nhân.
- **A3:** KHÔNG. Admin không thể tự hạ role của mình để tránh mất quyền. Nếu cần thay đổi, phải nhờ Admin khác thực hiện.
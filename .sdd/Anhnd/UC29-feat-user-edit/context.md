# CONTEXT.md — Edit User (UC29)

**Người viết:** Admin Agent | **Ngày:** 2026-06-27

---

## 1. PROBLEM STATEMENT

Admin cần chỉnh sửa thông tin người dùng khi có thay đổi (VD: cập nhật role, vô hiệu hóa tài khoản vi phạm, sửa tên/email bị sai). Đây là công cụ quản trị thiết yếu để Admin duy trì chất lượng dữ liệu người dùng trong hệ thống.

---

## 2. DOMAIN KNOWLEDGE

- **Soft-delete:** Vô hiệu hóa tài khoản = set `is_active: false` (KHÔNG xóa vật lý). Admin thực hiện qua chức năng Edit User.
- **Role change:** Việc thay đổi role của user là thao tác nhạy cảm — cần audit log đặc biệt. VD: nâng Volunteer lên Staff phải được ghi lại.
- **Password reset:** Admin KHÔNG thể thay đổi password của user khác qua endpoint này — password change chỉ do chính user thực hiện qua UC06.
- **Email unique:** Nếu Admin đổi email, phải kiểm tra email mới chưa tồn tại trong hệ thống.
- **Business invariant:** Không được set `is_active: false` cho Admin duy nhất còn lại trong hệ thống (tránh lock-out toàn bộ hệ thống).

---

## 3. STAKEHOLDERS

- **Admin:** Actor duy nhất được chỉnh sửa thông tin bất kỳ user nào.
- **User bị sửa:** Có thể nhận thông báo email nếu role bị thay đổi (ngoài scope).

---

## 4. CONSTRAINTS

- **Phân quyền:** Chỉ Admin. Middleware `requireRole('Admin')`.
- **Immutable fields:** `password`, `created_at` KHÔNG được phép thay đổi qua endpoint này.
- **API:** `PUT /api/v1/users/:userId` (toàn bộ update) hoặc `PATCH /api/v1/users/:userId` (partial update) — chọn PATCH cho linh hoạt.
- **Validation:** Zod schema cho từng trường được phép cập nhật.

---

## 5. ASSUMPTIONS

- PATCH endpoint — chỉ những trường được gửi lên mới được cập nhật (partial update).
- Admin không thể tự vô hiệu hóa tài khoản của chính mình (prevent self-lockout).
- Kiểm tra "Admin cuối cùng" chỉ cần thiết khi set `is_active: false` cho một Admin.

---

## 6. OPEN QUESTIONS (Đã chốt)

- **Q1:** Admin có đổi password của user khác không? → **Không** — password thuộc UC06 (Change Password) do chính user thực hiện.
- **Q2:** PATCH hay PUT? → **PATCH** (partial update) để linh hoạt hơn.
- **Q3:** Admin có tự vô hiệu hóa mình không? → **Không** — hệ thống chặn với HTTP 403.

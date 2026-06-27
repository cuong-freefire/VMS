# CONTEXT.md — Add User (UC28)

**Người viết:** Admin Agent | **Ngày:** 2026-06-27

---

## 1. PROBLEM STATEMENT

Admin cần khả năng tạo tài khoản mới cho người dùng trong hệ thống VMS (VD: tạo tài khoản Staff cho nhân viên mới, tạo tài khoản Manager cho quản lý tổ chức). Không có chức năng này, các tài khoản nội bộ chỉ có thể tự đăng ký qua UC04 (Register) với role mặc định là Volunteer.

---

## 2. DOMAIN KNOWLEDGE

- **Role assignment:** Admin là người duy nhất được gán role không phải Volunteer khi tạo tài khoản. TUYỆT ĐỐI KHÔNG hardcode role hoặc gán nhiều role cho một user.
- **Password:** Phải được hash bằng bcrypt trước khi lưu. Admin đặt mật khẩu tạm, user tự đổi qua UC06.
- **Email unique:** Email phải unique trong hệ thống — không được phép tạo 2 tài khoản cùng email.
- **is_active:** Tài khoản mới tạo mặc định `is_active: true`.
- **Soft-delete rule:** KHÔNG có hard-delete — nếu cần vô hiệu hóa, dùng UC29 (Edit User, set `is_active: false`).

---

## 3. STAKEHOLDERS

- **Admin:** Actor duy nhất được phép tạo tài khoản với role tùy chỉnh.
- **Người dùng được tạo:** Nhận thông tin đăng nhập qua email (UC64 - Event Approval Email hoặc email riêng — out of scope UC28).

---

## 4. CONSTRAINTS

- **Phân quyền:** Chỉ Admin. Middleware `requireRole('Admin')`.
- **Validation:** Bắt buộc dùng Zod schema để validate request body trước khi xuống Service.
- **API:** `POST /api/v1/users`
- **Swagger:** Bắt buộc document đầy đủ request body, response codes (201, 400, 401, 403, 409).

---

## 5. ASSUMPTIONS

- Bảng `roles` đã có seed data với các role: Volunteer (1), Staff (2), Manager (3), Admin (4).
- Admin tự đặt mật khẩu tạm thời cho user mới — user sẽ được thông báo riêng qua email (ngoài scope UC28).
- Avatar: không bắt buộc khi tạo mới, có thể null.

---

## 6. OPEN QUESTIONS (Đã chốt)

- **Q1:** Admin có thể tạo account Admin khác không? → **Có**, nhưng cần log audit rõ ràng.
- **Q2:** Sau khi tạo, có gửi email thông báo không? → **Ngoài scope UC28** — sẽ thuộc Email Service riêng.
- **Q3:** Password strength policy? → Tối thiểu 8 ký tự, có chữ hoa, chữ thường, số — validate bằng Zod regex.

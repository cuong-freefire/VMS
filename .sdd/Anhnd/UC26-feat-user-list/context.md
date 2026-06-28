# CONTEXT.md — View User List (UC26)

**Người viết:** Admin Agent | **Ngày:** 2026-06-27

---

## 1. PROBLEM STATEMENT

Hệ thống VMS cần một giao diện tập trung để Admin có thể xem và quản lý toàn bộ danh sách người dùng trong hệ thống. Không có chức năng này, Admin không thể theo dõi số lượng tài khoản, phát hiện tài khoản bất thường, hoặc thực hiện các thao tác quản lý người dùng tiếp theo (chỉnh sửa, vô hiệu hóa).

---

## 2. DOMAIN KNOWLEDGE

- **Phân quyền:** Chỉ **Admin** mới có quyền xem toàn bộ danh sách người dùng hệ thống.
- **Soft-delete:** Người dùng bị vô hiệu hóa (`is_active: false`) vẫn hiển thị trong danh sách với trạng thái rõ ràng (không bị ẩn hoàn toàn).
- **Phân trang (Pagination):** Hệ thống có thể có hàng nghìn người dùng, bắt buộc phải phân trang để đảm bảo hiệu năng.
- **Dữ liệu nhạy cảm:** Danh sách chỉ hiển thị thông tin cơ bản (tên, email, role, trạng thái) — KHÔNG hiển thị password hash hay token.

---

## 3. STAKEHOLDERS

- **Admin:** Người dùng chính của chức năng, cần xem tổng quan toàn bộ tài khoản để giám sát và điều phối.
- **Security/Compliance:** Yêu cầu chỉ Admin mới truy cập được dữ liệu tổng hợp người dùng.

---

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền:** Bắt buộc kiểm tra `role_id = Admin` trên middleware trước khi cho phép truy cập.
- **Pagination:** Bắt buộc trả về dữ liệu phân trang với `page`, `limit`, `total` trong response.
- **Data masking:** TUYỆT ĐỐI KHÔNG trả về `password`, `refresh_token`, hay bất kỳ secret nào trong response.
- **API:** Endpoint `GET /api/v1/users` với query params `?page=&limit=&role=&is_active=`.

---

## 5. ASSUMPTIONS (Các giả định)

- Bảng `users` đã join với bảng `roles` để trả về `role_name` thay vì chỉ `role_id`.
- Admin đã đăng nhập và có JWT token hợp lệ trong HttpOnly Cookie.
- Frontend hiển thị danh sách dạng bảng (table) với cột: Tên, Email, Role, Trạng thái, Ngày tạo, Hành động.

---

## 6. OPEN QUESTIONS (Đã chốt)

- **Q1:** Có filter theo role không? → **Có**, qua query param `?role=Volunteer|Staff|Manager|Admin`.
- **Q2:** Có tìm kiếm theo tên/email không? → **Có**, qua `?search=keyword` (thuộc UC30 - Filter User, nhưng UC26 cơ bản cũng hỗ trợ search param).
- **Q3:** Default sort order? → Mặc định sắp xếp theo `created_at DESC` (mới nhất trước).

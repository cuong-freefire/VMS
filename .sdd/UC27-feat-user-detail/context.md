# CONTEXT.md — View User Detail (UC27)

**Người viết:** Admin Agent | **Ngày:** 2026-06-27

---

## 1. PROBLEM STATEMENT

Admin cần xem thông tin đầy đủ của một người dùng cụ thể để kiểm tra hồ sơ, kỹ năng, lịch sử tham gia sự kiện, và đưa ra quyết định quản trị (vô hiệu hóa, thay đổi role...). Việc chỉ có danh sách (UC26) là không đủ — Admin cần drill-down vào từng tài khoản.

---

## 2. DOMAIN KNOWLEDGE

- **IDOR Prevention:** `user_id` phải lấy từ URL path param, nhưng hệ thống phải xác thực Admin có quyền xem — không thể để bất kỳ user nào gọi endpoint này.
- **Dữ liệu tổng hợp:** View Detail hiển thị nhiều hơn danh sách: bao gồm kỹ năng, số sự kiện đã tham gia, trạng thái chứng nhận.
- **Soft-delete:** Tài khoản `is_active: false` vẫn xem được chi tiết — Admin cần biết lý do và lịch sử.

---

## 3. STAKEHOLDERS

- **Admin:** Actor chính, cần thông tin đầy đủ để đưa ra quyết định quản trị.

---

## 4. CONSTRAINTS

- **Phân quyền:** Chỉ Admin. Middleware kiểm tra `role_id = Admin` trước khi vào Controller.
- **API:** `GET /api/v1/users/:userId`
- **Data privacy:** Không trả về `password`, `jti`, token hay bất kỳ secret nào.

---

## 5. ASSUMPTIONS

- `userId` là số nguyên dương (integer) — validate bằng Zod trên middleware.
- Response bao gồm join data: role name, danh sách skills, thống kê sự kiện tham gia.
- Thống kê (số sự kiện, số chứng nhận) được tính real-time từ database, không cache.

---

## 6. OPEN QUESTIONS (Đã chốt)

- **Q1:** Có hiển thị lịch sử đơn đăng ký không? → **Không** — chỉ hiển thị tổng số. Chi tiết lịch sử thuộc UC21.
- **Q2:** Có hiển thị donation history không? → **Không** — chỉ Admin xem tổng hợp ở UC61.

# CONTEXT.md — Filter User (UC30)

**Người viết:** Admin Agent | **Ngày:** 2026-06-27

---

## 1. PROBLEM STATEMENT

Khi hệ thống có hàng trăm hoặc hàng nghìn người dùng, Admin cần công cụ tìm kiếm và lọc nhanh để tìm đúng người dùng cần quản lý mà không phải duyệt thủ công toàn bộ danh sách.

---

## 2. DOMAIN KNOWLEDGE

- **UC26 vs UC30:** UC26 là xem danh sách cơ bản; UC30 mở rộng khả năng tìm kiếm và lọc phức tạp hơn. Thực tế, UC30 có thể được implement như một extension của cùng endpoint `GET /api/v1/users` với thêm query params.
- **Search:** Tìm kiếm theo `full_name` (contains) hoặc `email` (contains) — case-insensitive.
- **Filter:** Lọc theo `role`, `is_active`, khoảng thời gian `created_from` / `created_to`.
- **Performance:** Với dataset lớn, search `ILIKE %keyword%` cần index trên cột `email` và `full_name`.

---

## 3. STAKEHOLDERS

- **Admin:** Actor duy nhất sử dụng chức năng lọc nâng cao này.

---

## 4. CONSTRAINTS

- **Phân quyền:** Chỉ Admin.
- **API:** Mở rộng `GET /api/v1/users` với thêm query params: `search`, `role`, `is_active`, `created_from`, `created_to`, `sort_by`, `order`.
- **Validation:** Zod validate tất cả query params — chặn injection qua Prisma ORM (không raw SQL).

---

## 5. ASSUMPTIONS

- UC30 được implement trong cùng endpoint với UC26, sử dụng query params để phân biệt.
- Khi không có filter nào được truyền, hoạt động như UC26 (hiển thị toàn bộ, phân trang mặc định).

---

## 6. OPEN QUESTIONS (Đã chốt)

- **Q1:** Có search theo phone number không? → **Không** — chỉ full_name và email để đơn giản hóa.
- **Q2:** Có filter theo ngày tạo không? → **Có**, `created_from` và `created_to` (ISO8601 date string).

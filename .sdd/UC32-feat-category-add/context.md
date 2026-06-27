# CONTEXT.md — Add Category (UC32)

**Người viết:** Admin Agent | **Ngày:** 2026-06-27

---

## 1. PROBLEM STATEMENT

Admin cần thêm danh mục mới khi hệ thống mở rộng sang lĩnh vực tình nguyện mới (VD: "Môi trường", "Y tế", "Giáo dục"). Không có chức năng này, danh mục bị cứng (hardcode) và không phản ánh được sự đa dạng thực tế.

---

## 2. DOMAIN KNOWLEDGE

- **Unique name:** Tên danh mục phải là duy nhất trong hệ thống (case-insensitive) để tránh trùng lặp.
- **is_active:** Category mới mặc định `is_active: true`.
- **Không có soft-delete riêng:** Add là thêm mới — deactivate thực hiện qua UC33 (Edit).

---

## 3. CONSTRAINTS

- **Phân quyền:** Chỉ Admin. Middleware `requireRole('Admin')`.
- **API:** `POST /api/v1/categories`.
- **Validation:** Zod schema cho `name` (required, unique check), `description` (optional).

---

## 4. ASSUMPTIONS

- `name` max 100 ký tự, không có ký tự đặc biệt HTML (XSS prevention via sanitization).
- `description` max 500 ký tự, optional.

---

## 5. OPEN QUESTIONS (Đã chốt)

- **Q1:** Có cần approve category mới không? → **Không** — Admin tạo là active ngay.
- **Q2:** Unique check case-sensitive hay insensitive? → **Insensitive** — "môi trường" và "Môi Trường" là trùng.

# CONTEXT.md — Edit Category (UC33)

**Người viết:** Admin Agent | **Ngày:** 2026-06-27

---

## 1. PROBLEM STATEMENT

Admin cần chỉnh sửa tên/mô tả danh mục khi phát hiện lỗi chính tả hoặc cần cập nhật, và cần vô hiệu hóa danh mục khi nó không còn phù hợp (soft-delete). Không có chức năng này, dữ liệu danh mục sẽ bị tồn đọng lỗi.

---

## 2. DOMAIN KNOWLEDGE

- **Soft-delete:** Vô hiệu hóa category (`is_active: false`) KHÔNG xóa liên kết với sự kiện cũ. Sự kiện đã được tạo trước đó vẫn giữ nguyên category.
- **Impact khi đổi tên:** Đổi tên category ảnh hưởng đến hiển thị ở toàn bộ sự kiện đã gán category đó. Admin cần nhận thức điều này.
- **Event có status Active/In Progress:** Nếu category bị vô hiệu hóa trong khi có sự kiện đang dùng, sự kiện vẫn chạy bình thường — category chỉ không thể được gán cho sự kiện MỚI.

---

## 3. CONSTRAINTS

- **Phân quyền:** Chỉ Admin.
- **API:** `PATCH /api/v1/categories/:categoryId` (partial update).
- **Immutable:** `category_id`, `created_at` không được phép thay đổi.

---

## 4. ASSUMPTIONS

- Sử dụng PATCH (partial update) — chỉ cập nhật trường được gửi lên.
- Vô hiệu hóa category bằng cách set `is_active: false` qua PATCH endpoint này.

---

## 5. OPEN QUESTIONS (Đã chốt)

- **Q1:** Khi category bị vô hiệu hóa, có cascade vô hiệu hóa các event liên quan không? → **Không** — sự kiện đang chạy không bị ảnh hưởng, chỉ ngăn gán cho sự kiện mới.
- **Q2:** Cảnh báo cho Admin trước khi vô hiệu hóa category đang được dùng? → **Có** — response thành công kèm `active_events_count` để Admin biết.

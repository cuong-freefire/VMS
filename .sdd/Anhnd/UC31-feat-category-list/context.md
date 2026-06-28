# CONTEXT.md — View Category List (UC31)

**Người viết:** Admin Agent | **Ngày:** 2026-06-27

---

## 1. PROBLEM STATEMENT

Sự kiện trong VMS được phân loại theo danh mục (Category) để Volunteer dễ tìm kiếm. Admin cần xem và quản lý danh sách các danh mục này để đảm bảo dữ liệu phân loại nhất quán và không bị trùng lặp.

---

## 2. DOMAIN KNOWLEDGE

- **Phạm vi hiển thị:** Danh sách category có thể xem bởi nhiều role (Volunteer cũng cần filter event theo category — UC11). Tuy nhiên, **thêm/sửa** category chỉ Admin.
- **Soft-delete:** Category bị vô hiệu hóa (`is_active: false`) không được gán cho event mới, nhưng các event cũ vẫn giữ nguyên liên kết.
- **Dữ liệu liên quan:** Mỗi category có thể link đến nhiều sự kiện. Cần hiển thị `event_count` để Admin biết danh mục nào đang được dùng nhiều.

---

## 3. STAKEHOLDERS

- **Admin:** Xem và quản lý toàn bộ danh mục.
- **Volunteer/Guest:** Xem danh sách category để filter sự kiện (read-only, không cần auth).

---

## 4. CONSTRAINTS

- **Phân quyền đọc:** `GET /api/v1/categories` — public (hoặc authenticated), không giới hạn role.
- **Phân quyền ghi:** Chỉ Admin mới được thêm/sửa category (UC32, UC33).
- **API:** `GET /api/v1/categories` với optional `?is_active=` filter.

---

## 5. ASSUMPTIONS

- Danh sách category tương đối ngắn (< 50 danh mục) — không cần phân trang bắt buộc.
- Mỗi category có: `category_id`, `name`, `description`, `is_active`, `event_count`.

---

## 6. OPEN QUESTIONS (Đã chốt)

- **Q1:** Volunteer có xem được category bị vô hiệu hóa không? → **Không** — filter `is_active: true` mặc định cho public. Admin thấy tất cả.
- **Q2:** Cần phân trang không? → **Không** — data nhỏ, trả về toàn bộ.

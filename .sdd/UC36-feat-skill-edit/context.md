# CONTEXT.md — Edit Skill (UC36)

**Người viết:** Admin Agent | **Ngày:** 2026-06-27

---

## 1. PROBLEM STATEMENT

Admin cần sửa tên/mô tả kỹ năng hoặc vô hiệu hóa kỹ năng không còn phù hợp. Tương tự UC33 nhưng cho domain Skill.

---

## 2. DOMAIN KNOWLEDGE

- **Soft-delete:** Vô hiệu hóa skill (`is_active: false`) không xóa liên kết với volunteer đã đăng ký skill đó. Chỉ ngăn volunteer mới đăng ký.
- **Impact:** Đổi tên skill ảnh hưởng đến hiển thị trên hồ sơ của tất cả volunteer đang có skill đó.

---

## 3. CONSTRAINTS

- **Phân quyền:** Chỉ Admin.
- **API:** `PATCH /api/v1/skills/:skillId`.

---

## 4. OPEN QUESTIONS (Đã chốt)

- **Q1:** Khi vô hiệu hóa skill, có cảnh báo Admin về số volunteer đang dùng không? → **Có** — kèm `warning` trong response.

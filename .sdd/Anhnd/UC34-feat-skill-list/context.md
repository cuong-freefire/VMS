# CONTEXT.md — View Skill List (UC34)

**Người viết:** Admin Agent | **Ngày:** 2026-06-27

---

## 1. PROBLEM STATEMENT

Hệ thống VMS cho phép Volunteer đăng ký kỹ năng của mình (UC20) để Staff/Manager có thể match với yêu cầu sự kiện. Admin cần quản lý master data kỹ năng — xem, thêm, sửa — để đảm bảo danh sách kỹ năng nhất quán và không bị trùng lặp.

---

## 2. DOMAIN KNOWLEDGE

- **Phân quyền đọc:** Danh sách kỹ năng cần được hiển thị cho Volunteer khi đăng ký (UC20) — nên là public hoặc authenticated endpoint không giới hạn role.
- **Phân quyền ghi:** Chỉ Admin mới được thêm/sửa kỹ năng.
- **Soft-delete:** Kỹ năng bị vô hiệu hóa không thể được Volunteer đăng ký mới, nhưng các đăng ký cũ vẫn giữ nguyên.
- **Tương tự Category:** UC34-36 có cấu trúc tương tự UC31-33 nhưng cho Skill.

---

## 3. CONSTRAINTS

- **API:** `GET /api/v1/skills` — public endpoint.
- **Admin xem thêm:** `?is_active=false` để xem skills inactive.

---

## 4. ASSUMPTIONS

- Dataset kỹ năng tương đối nhỏ (< 100) — không cần phân trang.
- Mỗi skill: `skill_id`, `name`, `description`, `is_active`, `volunteer_count` (số volunteer đang dùng skill này).

---

## 5. OPEN QUESTIONS (Đã chốt)

- **Q1:** Volunteer thấy skill inactive không? → **Không** — chỉ thấy active skills khi đăng ký UC20.
- **Q2:** Hiển thị `volunteer_count` cho Admin không? → **Có**, giúp Admin biết skill nào phổ biến trước khi vô hiệu hóa.

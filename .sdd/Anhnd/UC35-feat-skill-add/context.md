# CONTEXT.md — Add Skill (UC35)

**Người viết:** Admin Agent | **Ngày:** 2026-06-27

---

## 1. PROBLEM STATEMENT

Admin cần thêm kỹ năng mới vào master data khi có nhu cầu phát sinh (VD: "Lập trình Python", "Chăm sóc trẻ em", "Kỹ năng thuyết trình"). Tương tự UC32 nhưng cho domain Skill.

---

## 2. DOMAIN KNOWLEDGE

- **Unique name:** Tên kỹ năng unique (case-insensitive).
- **is_active:** Skill mới mặc định `is_active: true`.

---

## 3. CONSTRAINTS

- **Phân quyền:** Chỉ Admin.
- **API:** `POST /api/v1/skills`.
- **Validation:** Zod — `name` required/max 100, `description` optional/max 500.

---

## 4. OPEN QUESTIONS (Đã chốt)

- **Q1:** Có category cho skill không (VD: kỹ năng kỹ thuật, kỹ năng mềm)? → **Không** — flat structure, không phân cấp trong V1.

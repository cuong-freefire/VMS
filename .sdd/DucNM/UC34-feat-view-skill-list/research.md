# Research: View Skill List (UC34)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-07-02

---

## 1. Skill Model vs Category Model

- **Decision**: Skill model gần giống Category model nhưng đơn giản hơn — không có field `type`.
- **Rationale**:
  - Skill chỉ có name, description, is_active — không cần phân loại type.
  - Pattern giống Category (UC31) — có thể tái sử dụng optionalAuth middleware và role-based visibility logic.
- **Fields**: `skill_id`, `name`, `description`, `is_active`, `created_at`, `updated_at`.

## 2. Optional Auth Pattern cho Guest Access

- **Decision**: Dùng `optionalAuth` middleware (tái sử dụng từ UC31) — 1 route duy nhất.
- **Rationale**:
  - UC11 (Filter Event) cần Guest xem skills active.
  - UC20 (Edit Volunteer Skills) cần Volunteer xem skills active.
  - 1 route duy nhất đơn giản hơn: frontend luôn gọi `GET /api/v1/skills`, BE tự quyết định dựa trên auth state.
- **Pattern**: Giống hệt UC31 — optionalAuth → controller → service (role-based filter).

## 3. Role-Based Visibility

- **Decision**: Service layer kiểm tra role của user:
  - `req.user` là Manager/Admin → không filter `is_active` (thấy tất cả).
  - `req.user` là Staff/Volunteer → chỉ lấy `is_active = true`.
  - Không có `req.user` (Guest) → chỉ lấy `is_active = true`.
- **Rationale**:
  - Guest và Volunteer cần skills active cho UC11 + UC20.
  - Manager/Admin cần thấy cả inactive để quản lý.

## 4. Prisma Schema cho Skill

- **Decision**: Model Skill với các fields: `skill_id`, `name`, `description`, `is_active`, `created_at`, `updated_at`.
- **Rationale**: Đơn giản, không cần composite unique — name có thể unique riêng lẻ.

## 5. Response Format

- **Decision**: Trả về mảng skills trong `data` field theo chuẩn ADR-006 — giống UC31.
- **Pattern**: `{ "success": true, "data": { "skills": [...] } }`

## 6. Module Structure

- **Decision**: Tạo mới toàn bộ files cho Skill module — pattern giống Category (UC31).
- **Files cần tạo**:
  - `backend/prisma/schema.prisma` — thêm Skill model
  - `backend/src/controllers/skill.controller.js`
  - `backend/src/services/skill.service.js`
  - `backend/src/repositories/skill.repository.js`
  - `backend/src/routes/skill.routes.js`
  - `backend/src/validators/skill.validator.js`
  - `frontend/src/api/skillApi.js`
  - `frontend/src/hooks/useSkills.js`
  - `frontend/src/components/pages/SkillListPage.jsx`

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Auth pattern | Optional auth middleware (từ UC31) | 1 route duy nhất, hỗ trợ Guest + UC11 |
| Role-based visibility | Service layer check req.user role | Separation of concerns |
| Prisma model | Skill với name, description, is_active | Đơn giản, không cần type |
| Zod schema | Không cần phức tạp | GET endpoint đơn giản |
| Response format | ADR-006 với mảng skills | Chuẩn VMS |
| Module structure | Tạo mới toàn bộ, pattern giống UC31 | Module mới, dễ maintain |
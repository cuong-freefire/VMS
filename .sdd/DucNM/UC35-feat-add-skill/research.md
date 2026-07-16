# Research: Add Skill (UC35)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-07-02

---

## 1. Zod Schema cho Create Skill

- **Decision**: Dùng `z.object()` với `name` (required), `description` (optional).
- **Rationale**:
  - Skill chỉ có name và description — đơn giản hơn Category (không có type).
  - `name`: `z.string().min(1)` — không được empty.
  - `description`: `z.string().optional()` — không bắt buộc.
- **Pattern**:
  ```js
  export const createSkillSchema = z.object({
    name: z.string().min(1, 'Skill name is required'),
    description: z.string().optional()
  });
  ```

## 2. Unique Name Check

- **Decision**: Dùng Prisma `findUnique` với `where: { name }` — name có unique constraint trong schema.
- **Rationale**:
  - Spec yêu cầu: tên skill unique trên toàn hệ thống.
  - Skill model đã có `@unique` trên field `name` từ UC34.
  - Check trước trong service → 409 Conflict nếu trùng.
- **Pattern**:
  ```js
  const existing = await prisma.skill.findUnique({ where: { name: data.name } });
  if (existing) {
    throw new ServiceError('Skill name already exists.', 409, 'SKILL_EXISTS');
  }
  ```

## 3. Response: Exclude Unnecessary Fields

- **Decision**: Trả về skill mới tạo với `select` — giống pattern UC32/UC34.
- **Rationale**: Response chỉ cần: skill_id, name, description, is_active, created_at, updated_at.

## 4. Authorization: Manager/Admin Only

- **Decision**: Dùng `authorize('MANAGER', 'ADMIN')` middleware — kế thừa từ UC26.
- **Rationale**: Chỉ Manager và Admin mới có quyền tạo skill.

## 5. Frontend: Form Validation

- **Decision**: Dùng React Hook Form + Zod resolver — tương tự AddCategoryPage (UC32).
- **Rationale**: Validation đồng bộ FE/BE, giảm request không hợp lệ.

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Zod schema | name + description (optional) | Đơn giản, không cần type |
| Unique check | Prisma findUnique + DB unique constraint | Data integrity |
| Authorization | authorize('MANAGER', 'ADMIN') | Kế thừa từ UC26 |
| Frontend form | React Hook Form + Zod resolver | Giống UC32 pattern |
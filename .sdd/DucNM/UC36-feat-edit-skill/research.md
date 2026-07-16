# Research: Edit Skill (UC36)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-07-02

---

## 1. PATCH Method cho Partial Update

- **Decision**: Dùng HTTP `PATCH` method — partial update, chỉ gửi fields cần thay đổi.
- **Rationale**:
  - PATCH cho phép cập nhật một phần — client chỉ gửi fields muốn thay đổi.
  - RESTful convention cho partial updates.
- **Pattern**: `PATCH /api/v1/skills/:id` với body optional fields.

## 2. Zod Schema cho Update Skill

- **Decision**: Dùng `z.object()` với tất cả fields optional (PATCH), kết hợp `.refine()` kiểm tra body không rỗng.
- **Rationale**:
  - PATCH là partial update — không field nào bắt buộc.
  - Cần check ít nhất 1 field phải được gửi lên.
- **Pattern**:
  ```js
  export const updateSkillSchema = z.object({
    name: z.string().min(1, 'Skill name cannot be empty').optional(),
    description: z.string().optional(),
    is_active: z.boolean().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'No fields to update.'
  });
  ```

## 3. Unique Name Check khi Đổi Tên

- **Decision**: Nếu request có `name`, kiểm tra tên mới unique (so với skill hiện tại). Loại trừ chính skill đang edit.
- **Rationale**:
  - Spec yêu cầu: tên unique trên toàn bảng.
  - Cần loại trừ chính skill đang edit (nếu không đổi tên thì không conflict).
  - Dùng `findFirst` với `where: { name, NOT: { skill_id } }`.
- **Pattern**:
  ```js
  if (updateData.name && updateData.name !== existingSkill.name) {
    const conflict = await prisma.skill.findFirst({
      where: { name: updateData.name, NOT: { skill_id: skillId } }
    });
    if (conflict) {
      throw new ServiceError('Skill name already exists.', 409, 'SKILL_EXISTS');
    }
  }
  ```

## 4. 404 Handling khi Skill ID không tồn tại

- **Decision**: Service kiểm tra skill tồn tại trước khi update. Nếu không → throw ServiceError 404.
- **Rationale**:
  - Cần phân biệt: skill không tồn tại (404) vs validation error (400).
- **Pattern**:
  ```js
  const existing = await findSkillById(skillId);
  if (!existing) {
    throw new ServiceError('Skill not found.', 404, 'SKILL_NOT_FOUND');
  }
  ```

## 5. Response sau khi Update

- **Decision**: Trả về skill đã update — giống UC35 pattern.
- **Rationale**: Response chứa đầy đủ thông tin sau update.

## 6. Frontend: Edit Form kế thừa từ Add Form

- **Decision**: `EditSkillPage.jsx` kế thừa layout từ `AddSkillPage.jsx` (UC35), pre-fill form với dữ liệu hiện tại.
- **Rationale**:
  - Add và Edit form có cấu trúc giống nhau (name, description, is_active).
  - Khác biệt: Edit cần fetch skill detail trước, pre-fill form.
  - Submit dùng PATCH thay vì POST.

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| HTTP Method | PATCH | Partial update |
| Zod schema | All optional + refine body not empty | PATCH convention |
| Unique check | findFirst with NOT exclude self | Khi đổi tên |
| 404 handling | Service check before update | Phân biệt 404 vs 400 |
| Frontend | Kế thừa AddSkillPage | Code reuse |
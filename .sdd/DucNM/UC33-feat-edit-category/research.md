# Research: Edit Category (UC33)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-07-01

---

## 1. PATCH Method cho Partial Update

- **Decision**: Dùng HTTP `PATCH` method — partial update, chỉ gửi fields cần thay đổi.
- **Rationale**:
  - PATCH cho phép cập nhật một phần — client chỉ gửi fields muốn thay đổi.
  - Không dùng PUT vì PUT yêu cầu gửi toàn bộ resource.
  - RESTful convention cho partial updates.
- **Pattern**: `PATCH /api/v1/categories/:id` với body optional fields.

## 2. Zod Schema cho Update Category

- **Decision**: Dùng `z.object()` với tất cả fields optional (PATCH), kết hợp `.refine()` kiểm tra body không rỗng.
- **Rationale**:
  - PATCH là partial update — không field nào bắt buộc.
  - Type không thể thay đổi (FR-003) — loại bỏ khỏi schema.
  - Cần check ít nhất 1 field phải được gửi lên.
- **Pattern**:
  ```js
  export const updateCategorySchema = z.object({
    name: z.string().min(1, 'Category name cannot be empty').optional(),
    description: z.string().optional(),
    is_active: z.boolean().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'No fields to update.'
  });
  ```

## 3. Unique Name Check khi Đổi Tên

- **Decision**: Nếu request có `name`, kiểm tra tên mới unique trong cùng type (so với category hiện tại).
- **Rationale**:
  - Spec yêu cầu: tên unique trong cùng type.
  - Cần loại trừ chính category đang edit (nếu không đổi tên thì không conflict).
  - Dùng `findFirst` với `where: { name, type, NOT: { category_id } }`.
- **Pattern**:
  ```js
  if (updateData.name && updateData.name !== existingCategory.name) {
    const conflict = await findCategoryByNameAndType(
      updateData.name,
      existingCategory.type,
      categoryId // exclude self
    );
    if (conflict) {
      throw new ServiceError('Name already exists in this type.', 409, 'CATEGORY_EXISTS');
    }
  }
  ```

## 4. Type Immutability

- **Decision**: Type field hoàn toàn không có trong `updateCategorySchema` — không thể gửi type trong request.
- **Rationale**:
  - FR-003: System MUST NOT allow changing type.
  - Cách đơn giản nhất: loại bỏ hoàn toàn khỏi Zod schema.

## 5. 404 Handling khi Category ID không tồn tại

- **Decision**: Service kiểm tra category tồn tại trước khi update. Nếu không → throw ServiceError 404.
- **Rationale**:
  - Cần phân biệt: category không tồn tại (404) vs validation error (400).
- **Pattern**:
  ```js
  const existing = await findCategoryById(categoryId);
  if (!existing) {
    throw new ServiceError('Category not found.', 404, 'CATEGORY_NOT_FOUND');
  }
  ```

## 6. Response sau khi Update

- **Decision**: Trả về category đã update với `select` — giống UC32 pattern.
- **Rationale**: Response chứa đầy đủ thông tin sau update, trừ các field internal.

## 7. Frontend: Edit Form kế thừa từ Add Form

- **Decision**: `EditCategoryPage.jsx` kế thừa layout từ `AddCategoryPage.jsx` (UC32), pre-fill form với dữ liệu hiện tại.
- **Rationale**:
  - Add và Edit form có cấu trúc giống nhau (name, description, is_active).
  - Khác biệt: Edit cần fetch category detail trước, pre-fill form, type hiển thị dạng text (read-only) vì không thể đổi.
  - Submit dùng PATCH thay vì POST.

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| HTTP Method | PATCH | Partial update |
| Zod schema | All optional + refine body not empty | PATCH convention |
| Type immutability | Loại bỏ khỏi Zod schema | FR-003 |
| Unique check | findFirst with NOT exclude self | Khi đổi tên |
| 404 handling | Service check before update | Phân biệt 404 vs 400 |
| Frontend | Kế thừa AddCategoryPage | Code reuse |
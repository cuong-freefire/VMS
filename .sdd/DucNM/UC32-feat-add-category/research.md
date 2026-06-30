# Research: Add Category (UC32)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-06-30

---

## 1. Zod Schema cho Create Category

- **Decision**: Dùng `z.object()` với `name`, `description` (optional), `type` (enum).
- **Rationale**:
  - `name`: `z.string().min(1)` — không được empty.
  - `description`: `z.string().optional()` — không bắt buộc.
  - `type`: `z.enum(['location', 'event_type', 'time_frame'])` — chỉ 3 giá trị cho phép.
- **Pattern**:
  ```js
  export const createCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required'),
    description: z.string().optional(),
    type: z.enum(['location', 'event_type', 'time_frame'], {
      errorMap: () => ({ message: 'Type must be: location, event_type, or time_frame' })
    })
  });
  ```

## 2. Unique Name Check trong cùng Type

- **Decision**: Dùng Prisma `findFirst` với `where: { name, type }` để kiểm tra unique constraint.
- **Rationale**:
  - Spec yêu cầu: tên category unique trong cùng một type.
  - `findFirst` với composite where (name + type) — nếu tìm thấy record → 409 Conflict.
  - Unique constraint ở database level cũng nên được thêm (composite unique trên name + type).
- **Pattern**:
  ```js
  const existing = await prisma.category.findFirst({
    where: { name: data.name, type: data.type }
  });
  if (existing) {
    throw new ServiceError('Category name already exists in this type.', 409, 'CATEGORY_EXISTS');
  }
  ```

## 3. Prisma Composite Unique Constraint

- **Decision**: Thêm `@@unique([name, type])` vào Category model.
- **Rationale**:
  - Đảm bảo data integrity ở database level — phòng race condition.
  - Prisma sẽ tự động throw error nếu vi phạm, service catch và trả về 409.
- **Pattern**:
  ```prisma
  model Category {
    category_id Int      @id @default(autoincrement())
    name        String   @db.VarChar(255)
    description String?  @db.Text
    type        String   @db.VarChar(50)
    is_active   Boolean  @default(true)
    created_at  DateTime @default(now())
    updated_at  DateTime @updatedAt

    @@unique([name, type])
    @@map("categories")
  }
  ```

## 4. Response: Exclude Unnecessary Fields

- **Decision**: Trả về category mới tạo với `select` — không trả về fields không cần thiết.
- **Rationale**: Response chỉ cần: category_id, name, description, type, is_active, created_at, updated_at.
- **Pattern**: Dùng Prisma `select` tương tự User module.

## 5. Authorization: Manager/Admin Only

- **Decision**: Dùng `authorize('MANAGER', 'ADMIN')` middleware — kế thừa từ UC26.
- **Rationale**:
  - Chỉ Manager và Admin mới có quyền tạo category.
  - authorize middleware đã hỗ trợ multiple roles.

## 6. Frontend: Form Validation

- **Decision**: Dùng React Hook Form + Zod resolver — tương tự AddUserPage (UC28).
- **Rationale**: Validation đồng bộ FE/BE, giảm request không hợp lệ.

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Zod schema | name + description (optional) + type enum | Theo spec |
| Unique check | Prisma findFirst + composite unique constraint | Data integrity |
| Composite unique | `@@unique([name, type])` | DB-level protection |
| Authorization | authorize('MANAGER', 'ADMIN') | Kế thừa từ UC26 |
| Frontend form | React Hook Form + Zod resolver | Giống UC28 pattern |
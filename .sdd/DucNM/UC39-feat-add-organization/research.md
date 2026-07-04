# Research: Add Organization (UC39)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-07-04

---

## 1. Zod Schema cho Create Organization

- **Decision**: Dùng `z.object()` với `name` (required), các trường còn lại optional. `contact_email` validate format nếu có.
- **Rationale**:
  - `name`: `z.string().min(1)` — bắt buộc.
  - `contact_email`: `z.string().email().optional()` — nếu có phải đúng format.
  - `description`, `address`, `contact_phone`, `website`: `z.string().optional()`.
- **Pattern**:
  ```js
  export const createOrganizationSchema = z.object({
    name: z.string().min(1, 'Tên tổ chức là bắt buộc'),
    description: z.string().optional(),
    address: z.string().optional(),
    contact_phone: z.string().optional(),
    contact_email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    website: z.string().url('Website không hợp lệ').optional().or(z.literal(''))
  });
  ```

## 2. Unique Name Check

- **Decision**: Dùng Prisma `findUnique` với `where: { name }` — name có unique constraint trong schema.
- **Rationale**: Spec yêu cầu tên tổ chức unique. Organization model đã có `@unique` trên field `name` từ UC37.

## 3. Cloudinary Upload cho Logo

- **Decision**: Dùng multer để nhận file upload + cloudinary SDK để upload lên Cloudinary.
- **Rationale**:
  - ADR-004 quy định dùng Cloudinary cho file upload.
  - Multer xử lý multipart/form-data.
  - File validation (kích thước, định dạng) ở middleware trước khi upload.
- **Limitations**: 2MB max, .jpg/.png/.webp only.

## 4. Audit Log

- **Decision**: Dùng Pino logger để ghi log sau khi tạo organization thành công.
- **Rationale**: Lesson 4 từ CLAUDE.md — audit log phải bất đồng bộ, không block main flow.

## 5. Authorization: Admin Only

- **Decision**: Dùng `authorize('ADMIN')` middleware — chỉ Admin mới có quyền.
- **Rationale**: Spec yêu cầu Admin-only.

## 6. Frontend: Form Validation + Logo Upload

- **Decision**: Dùng React Hook Form + Zod resolver. Logo upload dùng input file với preview.
- **Rationale**: Validation đồng bộ FE/BE. File input cho logo upload.

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Zod schema | name required, contact_email validation | Theo spec |
| Unique check | Prisma findUnique + DB unique constraint | Data integrity |
| Logo upload | Multer + Cloudinary SDK | ADR-004 |
| File validation | 2MB max, .jpg/.png/.webp | Spec constraint |
| Audit log | Pino async log | Lesson 4 |
| Authorization | authorize('ADMIN') | Spec Admin-only |
| Frontend form | React Hook Form + Zod resolver | Pattern chuẩn VMS |
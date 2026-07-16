# Research: Edit Organization (UC40)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-07-04

---

## 1. PUT Method cho Full Update

- **Decision**: Dùng HTTP `PUT` method — gửi toàn bộ trường (kể cả không thay đổi).
- **Rationale**:
  - Context A1: Dùng PUT để đồng bộ với convention dự án.
  - PUT yêu cầu gửi toàn bộ resource — phù hợp với form edit có sẵn tất cả fields.
  - Khác với PATCH (partial update), PUT rõ ràng hơn về contract.
- **Pattern**: `PUT /api/v1/organizations/:id` với body chứa tất cả fields.

## 2. Zod Schema cho Update Organization

- **Decision**: Dùng `z.object()` với tất cả fields (PUT — gửi toàn bộ). `name` required, các trường khác optional. `contact_email` validate format nếu có.
- **Rationale**:
  - PUT yêu cầu gửi toàn bộ trường — `name` là bắt buộc.
  - `contact_email`: `z.string().email().optional().or(z.literal(''))` — nếu có phải đúng format.
- **Pattern**:
  ```js
  export const updateOrganizationSchema = z.object({
    name: z.string().min(1, 'Tên tổ chức là bắt buộc'),
    description: z.string().optional(),
    address: z.string().optional(),
    contact_phone: z.string().optional(),
    contact_email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    website: z.string().url('Website không hợp lệ').optional().or(z.literal('')),
    is_active: z.boolean().optional()
  });
  ```

## 3. Unique Name Check (trừ chính nó)

- **Decision**: Nếu `name` thay đổi, kiểm tra unique trừ chính organization đang edit.
- **Rationale**:
  - Spec FR-002: validate tính duy nhất của name (trừ chính nó).
  - Dùng `findFirst` với `where: { name, NOT: { organization_id } }`.
- **Pattern**:
  ```js
  if (updateData.name !== existingOrg.name) {
    const conflict = await prisma.organization.findFirst({
      where: { name: updateData.name, NOT: { organization_id: id } }
    });
    if (conflict) throw new ServiceError('Tên tổ chức đã tồn tại.', 409, 'ORGANIZATION_EXISTS');
  }
  ```

## 4. Soft-delete Constraint: Active Events Check

- **Decision**: Nếu `is_active` được set thành `false`, kiểm tra tổ chức không còn event đang hoạt động (Pending, In Progress).
- **Rationale**:
  - Spec FR-005: không thể vô hiệu hóa nếu còn sự kiện đang hoạt động.
  - Dùng Prisma `count` trên Event model với `organization_id` và status IN ['PENDING', 'IN_PROGRESS'].
- **Pattern**:
  ```js
  if (updateData.is_active === false && existingOrg.is_active === true) {
    const activeEvents = await prisma.event.count({
      where: { organization_id: id, status: { in: ['PENDING', 'IN_PROGRESS'] } }
    });
    if (activeEvents > 0) {
      throw new ServiceError('Không thể vô hiệu hóa tổ chức vì còn sự kiện đang hoạt động.', 409, 'ACTIVE_EVENTS_EXIST');
    }
  }
  ```

## 5. Already Inactive Check

- **Decision**: Nếu tổ chức đã inactive và request set `is_active = false`, trả về 400.
- **Rationale**: Spec FR-006.
- **Pattern**:
  ```js
  if (updateData.is_active === false && existingOrg.is_active === false) {
    throw new ServiceError('Tổ chức đã bị vô hiệu hóa trước đó.', 400, 'ALREADY_INACTIVE');
  }
  ```

## 6. Cloudinary: Xóa Logo Cũ

- **Decision**: Khi upload logo mới, upload lên Cloudinary → lấy public_id từ logo_url cũ → xóa ảnh cũ → lưu URL mới.
- **Rationale**:
  - Spec FR-004: xóa logo cũ trên Cloudinary khi upload mới.
  - Cần extract public_id từ URL cũ (Cloudinary URL format: `.../v1/{public_id}.{ext}`).
- **Pattern**:
  ```js
  if (file) {
    // Upload new logo
    const result = await cloudinaryUpload(file.buffer);
    // Delete old logo if exists
    if (existingOrg.logo_url) {
      const publicId = extractPublicId(existingOrg.logo_url);
      await cloudinary.uploader.destroy(publicId);
    }
    updateData.logo_url = result.secure_url;
  }
  ```

## 7. Audit Log

- **Decision**: Dùng Pino logger để ghi log sau khi update thành công.
- **Rationale**: Lesson 4 từ CLAUDE.md — audit log bất đồng bộ.

## 8. Authorization: Manager/Admin

- **Decision**: Dùng `authorize('MANAGER', 'ADMIN')` middleware.
- **Rationale**: Đã cập nhật từ Admin-only thành Manager/Admin.

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| HTTP Method | PUT | Context A1 — convention dự án |
| Zod schema | name required, các trường khác optional | PUT gửi toàn bộ |
| Unique check | findFirst với NOT exclude self | FR-002 |
| Active events check | Prisma count with status IN | FR-005 |
| Already inactive | Check before update | FR-006 |
| Cloudinary delete | Upload → destroy old → save new | FR-004 |
| Audit log | Pino async log | Lesson 4 |
| Authorization | authorize('MANAGER', 'ADMIN') | Manager/Admin |
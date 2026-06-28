# Implementation Plan: Edit Organization (UC40)

**Branch**: `feat/uc40-edit-organization` | **Date**: 2026-06-29 | **Spec**: `.sdd/DucNM/UC40-feat-edit-organization/spec.md`

**Input**: Feature specification from `.sdd/DucNM/UC40-feat-edit-organization/spec.md`

---

## Summary

Admin cần chỉnh sửa thông tin tổ chức và vô hiệu hóa (soft-delete) tổ chức khi cần. Chỉ Admin mới có quyền. Kiểm tra ràng buộc sự kiện đang hoạt động trước khi soft-delete.

Kỹ thuật: Tạo REST API `PUT /api/v1/organizations/:id` với Zod validation, Cloudinary upload (xóa ảnh cũ), kiểm tra ràng buộc sự kiện, audit logging.

---

## Technical Context

**Language/Version**: NodeJS + Javascript (ESM), Express 5.x

**Primary Dependencies**: Prisma (MySQL), Zod, Cloudinary SDK, Pino, swagger-jsdoc, swagger-ui-express

**Storage**: MySQL (via Prisma ORM), Cloudinary (logo upload)

**Testing**: Jest + Supertest (Backend), Jest + React Testing Library (Frontend)

**Target Platform**: Web (Browser)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Cập nhật hoàn tất trong vòng 20 giây

**Constraints**:
- Admin-only: Chỉ Admin. Non-Admin → 403
- Tên duy nhất: Trừ tên hiện tại
- Soft-delete: Kiểm tra không còn sự kiện đang hoạt động → 409 nếu còn
- Logo mới: Xóa ảnh cũ trên Cloudinary
- API format: `PUT /api/v1/organizations/:id`
- Audit log bắt buộc

**Scale/Scope**: Cập nhật 1 organization/lần

---

## Constitution Check

1. ✅ **Soft Delete Compliance**: Organization dùng is_active flag — tuân thủ ADR-005.
2. ✅ **Layered Architecture**: Controller → Service → Repository.
3. ✅ **API Format**: Tuân thủ `/api/v1/[resource]` prefix và response format ADR-006.
4. ✅ **Swagger Documentation**: Bắt buộc JSDoc @swagger.
5. ✅ **Phân quyền Role**: Admin-only.

---

## Project Structure

```text
backend/
├── src/
│   ├── controllers/organization.controller.js    # update() method
│   ├── services/organization.service.js          # updateOrganization()
│   ├── repositories/organization.repository.js   # update(), findActiveEvents()
│   ├── validators/organization.validator.js      # updateOrganizationSchema
│   └── routes/organization.routes.js             # PUT /api/v1/organizations/:id

frontend/
├── src/
│   ├── api/organizationApi.js                    # updateOrganization()
│   ├── components/organizations/
│   │   └── OrganizationFormPage.jsx              # Reuse from UC39
│   └── services/organization.service.js
```

**Structure Decision**: Web application. Backend layered. Frontend feature-based.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
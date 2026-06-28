# Implementation Plan: Add Organization (UC39)

**Branch**: `feat/uc39-add-organization` | **Date**: 2026-06-29 | **Spec**: `.sdd/DucNM/UC39-feat-add-organization/spec.md`

**Input**: Feature specification from `.sdd/DucNM/UC39-feat-add-organization/spec.md`

---

## Summary

Admin cần thêm tổ chức mới vào hệ thống VMS để mở rộng danh sách đối tác. Chỉ Admin mới có quyền thêm. Tên tổ chức phải duy nhất. Hỗ trợ upload logo lên Cloudinary.

Kỹ thuật: Tạo REST API `POST /api/v1/organizations` với Zod validation, Cloudinary upload, và audit logging.

---

## Technical Context

**Language/Version**: NodeJS + Javascript (ESM), Express 5.x

**Primary Dependencies**: Prisma (MySQL), Zod, Cloudinary SDK, Pino, swagger-jsdoc, swagger-ui-express

**Storage**: MySQL (via Prisma ORM), Cloudinary (logo upload)

**Testing**: Jest + Supertest (Backend), Jest + React Testing Library (Frontend)

**Target Platform**: Web (Browser)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Tạo tổ chức hoàn tất trong vòng 30 giây (từ form đến kết quả)

**Constraints**:
- Admin-only: Chỉ Admin. Non-Admin → 403
- Tên duy nhất: Trùng tên → 409 Conflict
- Logo: Max 2MB, .jpg/.png/.webp
- Validation: Zod validate trước khi ghi DB
- API format: `POST /api/v1/organizations`
- Audit log bắt buộc

**Scale/Scope**: Tạo 1 organization/lần

---

## Constitution Check

1. ✅ **Soft Delete Compliance**: Organization mới tạo có is_active = true.
2. ✅ **Layered Architecture**: Controller → Service → Repository.
3. ✅ **API Format**: Tuân thủ `/api/v1/[resource]` prefix và response format ADR-006.
4. ✅ **Swagger Documentation**: Bắt buộc JSDoc @swagger.
5. ✅ **Phân quyền Role**: Admin-only.

---

## Project Structure

```text
backend/
├── src/
│   ├── controllers/organization.controller.js    # create() method
│   ├── services/organization.service.js          # createOrganization()
│   ├── repositories/organization.repository.js   # create()
│   ├── validators/organization.validator.js      # createOrganizationSchema
│   └── routes/organization.routes.js             # POST /api/v1/organizations

frontend/
├── src/
│   ├── api/organizationApi.js                    # createOrganization()
│   ├── components/organizations/
│   │   └── OrganizationFormPage.jsx
│   └── services/organization.service.js
```

**Structure Decision**: Web application. Backend layered. Frontend feature-based.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
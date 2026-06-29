# Implementation Plan: View Organization List (UC37)

**Branch**: `feat/uc37-view-organization-list` | **Date**: 2026-06-29 | **Spec**: `.sdd/DucNM/UC37-feat-view-organization-list/spec.md`

**Input**: Feature specification from `.sdd/DucNM/UC37-feat-view-organization-list/spec.md`

---

## Summary

Admin, Manager, Staff cần xem danh sách tổ chức trong hệ thống VMS để giám sát, báo cáo và tham chiếu khi tạo sự kiện. Admin thấy cả tổ chức active và inactive. Manager/Staff chỉ thấy active. Volunteer/Guest bị từ chối.

Kỹ thuật: Tạo REST API `GET /api/v1/organizations` với phân trang (page/limit), tìm kiếm theo tên (search query param), và phân quyền dựa trên role từ JWT.

---

## Technical Context

**Language/Version**: NodeJS + Javascript (ESM), Express 5.x

**Primary Dependencies**: Prisma (MySQL), Zod, JWT (HttpOnly Cookie), Pino, swagger-jsdoc, swagger-ui-express

**Storage**: MySQL (via Prisma ORM)

**Testing**: Jest + Supertest (Backend), Jest + React Testing Library (Frontend)

**Target Platform**: Web (Browser)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 500ms cho danh sách < 500 organizations

**Constraints**:
- Soft delete: Organization dùng `is_active` flag — không xóa cứng
- Phân quyền: Admin thấy all, Manager/Staff chỉ thấy active, Volunteer → 403, Guest → 401
- API format: `GET /api/v1/organizations` với prefix chuẩn dự án
- Swagger JSDoc bắt buộc cho endpoint

**Scale/Scope**: ~500 organizations, phân trang mặc định 20 items/trang

---

## Constitution Check

1. ✅ **Soft Delete Compliance**: Organization dùng is_active flag — tuân thủ ADR-005.
2. ✅ **Layered Architecture**: Controller → Service → Repository.
3. ✅ **API Format**: Tuân thủ `/api/v1/[resource]` prefix và response format ADR-006.
4. ✅ **Swagger Documentation**: Bắt buộc JSDoc @swagger.
5. ✅ **Phân quyền Role**: Admin/Manager/Staff/Volunteer/Guest phân quyền rõ ràng.

---

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC37-feat-view-organization-list/
├── context.md
├── spec.md
├── plan.md              # This file
└── tasks.md             # Task list
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/
│   │   └── organization.controller.js    # list() method
│   ├── services/
│   │   └── organization.service.js       # getOrganizations()
│   ├── repositories/
│   │   └── organization.repository.js    # findAll(), count(), searchByName()
│   ├── routes/
│   │   └── organization.routes.js        # GET /api/v1/organizations
│   ├── validators/
│   │   └── organization.validator.js     # Zod schemas (pagination params)
│   └── middleware/
│       ├── authenticate.js               # JWT verification
│       └── authorize.js                  # Role-based access

frontend/
├── src/
│   ├── api/
│   │   └── organizationApi.js            # getOrganizations()
│   ├── components/organizations/
│   │   ├── OrganizationListPage.jsx
│   │   └── OrganizationCard.jsx
│   └── services/
│       └── organization.service.js
```

**Structure Decision**: Web application. Backend layered (Controller → Service → Repository). Frontend feature-based components.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
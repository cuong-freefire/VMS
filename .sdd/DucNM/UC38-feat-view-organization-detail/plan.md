# Implementation Plan: View Organization Detail (UC38)

**Branch**: `feat/uc38-view-organization-detail` | **Date**: 2026-06-29 | **Spec**: `.sdd/DucNM/UC38-feat-view-organization-detail/spec.md`

**Input**: Feature specification from `.sdd/DucNM/UC38-feat-view-organization-detail/spec.md`

---

## Summary

Admin, Manager, Staff cần xem đầy đủ thông tin chi tiết của một tổ chức cụ thể, bao gồm danh sách tóm tắt 10 sự kiện gần nhất thuộc tổ chức đó. Admin thấy cả tổ chức inactive. Manager/Staff chỉ thấy active (inactive → 404). Volunteer/Guest bị từ chối.

Kỹ thuật: Tạo REST API `GET /api/v1/organizations/:id` trả về chi tiết tổ chức kèm danh sách sự kiện liên kết.

---

## Technical Context

**Language/Version**: NodeJS + Javascript (ESM), Express 5.x

**Primary Dependencies**: Prisma (MySQL), Zod, JWT (HttpOnly Cookie), Pino, swagger-jsdoc, swagger-ui-express

**Storage**: MySQL (via Prisma ORM)

**Testing**: Jest + Supertest (Backend), Jest + React Testing Library (Frontend)

**Target Platform**: Web (Browser)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 500ms (bao gồm query sự kiện liên kết)

**Constraints**:
- Soft delete: Organization dùng `is_active` flag
- Phân quyền: Admin thấy inactive, Manager/Staff thấy inactive → 404, Volunteer → 403, Guest → 401
- API format: `GET /api/v1/organizations/:id`
- Swagger JSDoc bắt buộc

**Scale/Scope**: Chi tiết 1 organization + tối đa 10 events gần nhất

---

## Constitution Check

1. ✅ **Soft Delete Compliance**: Organization dùng is_active flag — tuân thủ ADR-005.
2. ✅ **Layered Architecture**: Controller → Service → Repository.
3. ✅ **API Format**: Tuân thủ `/api/v1/[resource]` prefix và response format ADR-006.
4. ✅ **Swagger Documentation**: Bắt buộc JSDoc @swagger.
5. ✅ **Phân quyền Role**: Admin/Manager/Staff/Volunteer/Guest phân quyền rõ ràng.

---

## Project Structure

```text
backend/
├── src/
│   ├── controllers/organization.controller.js    # getById() method
│   ├── services/organization.service.js          # getOrganizationById()
│   ├── repositories/organization.repository.js   # findById(), getRecentEvents()
│   └── routes/organization.routes.js             # GET /api/v1/organizations/:id

frontend/
├── src/
│   ├── api/organizationApi.js                    # getOrganizationById()
│   ├── components/organizations/
│   │   └── OrganizationDetailPage.jsx
│   └── services/organization.service.js
```

**Structure Decision**: Web application. Backend layered. Frontend feature-based.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
# Triển khai kế hoạch: View Organization List (UC37)

**Branch**: `001-uc37-view-organization-list` | **Date**: 2026-07-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC37-feat-view-organization-list/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Admin/Manager/Staff cần xem danh sách tổ chức (Organization) để giám sát, báo cáo và tham chiếu khi tạo sự kiện. Backend xây dựng endpoint `GET /api/v1/organizations` với phân trang, tìm kiếm theo tên. Admin thấy tất cả (active + inactive). Manager và Staff chỉ thấy active. Volunteer/Guest bị từ chối (HTTP 403/401).

**⚠️ Cross-module dependency**: UC37 phải phục vụ UC11 (Filter Event — NamLD). UC11 cần danh sách organization active để hiển thị dropdown filter trên Event List. Tuy nhiên, theo spec UC37, Guest và Volunteer bị chặn. Cần mở rộng: **Guest và Volunteer được xem organizations active qua public endpoint** (giống pattern UC31 với optionalAuth middleware) để phục vụ UC11.

Do đó:
- **Guest**: Xem organizations active (public, optional auth) — phục vụ UC11
- **Volunteer**: Xem organizations active — phục vụ UC11
- **Staff**: Xem organizations active
- **Manager**: Xem organizations active
- **Admin**: Xem tất cả (active + inactive)

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include)

**Storage**: MySQL via Prisma ORM (Organization model với soft delete qua is_active)

**Testing**: 
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 500ms, hỗ trợ phân trang (mặc định 20 items/page)

**Constraints**: 
- Admin: thấy tất cả organizations (active + inactive)
- Manager/Staff: chỉ thấy organizations active
- **Guest/Volunteer: chỉ thấy organizations active, qua public endpoint (optional auth)** — phục vụ UC11 Filter Event
- Hỗ trợ phân trang (page, limit) — mặc định limit = 20
- Hỗ trợ tìm kiếm theo tên (search param, case-insensitive)
- Soft delete: Organization dùng `is_active = false`
- Swagger JSDoc bắt buộc
- Max function length: 40 dòng; max file length: 300 dòng
- Bắt buộc dùng `response.util.js`

**Scale/Scope**: Module mới — Organization Management (UC37-UC40). Thuộc Member 5 — DucNM. Tạo mới toàn bộ layers: controller, service, repository, routes, validator cho Organization. Pattern tương tự User Management (UC26) với pagination + search.

## Constitution Check

Các nguyên tắc từ AGENTS.md và CLAUDE.md:

1. **Layered Architecture**: Controller → Service → Repository (bắt buộc)
2. **Test-First**: Tối thiểu 80% coverage cho Service layer
3. **API Response Format**: Buộc dùng `response.util.js`
4. **Soft Delete**: Organization dùng `is_active = false`
5. **Swagger Documentation**: Bắt buộc JSDoc cho mọi endpoint
6. **Cross-module**: Không import Repository từ module khác

**Kết luận**: Không có vi phạm. Gates pass.

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC37-feat-view-organization-list/
├── context.md              # Problem context
├── spec.md                 # Feature specification
├── plan.md                 # This file (/speckit-plan command output)
├── research.md             # Phase 0 output
├── data-model.md           # Phase 1 output
├── quickstart.md           # Phase 1 output
├── contracts/              # Phase 1 output
└── tasks.md                # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/
│   │   └── organization.controller.js  # MỚI: handler getOrganizations
│   ├── services/
│   │   └── organization.service.js     # MỚI: business logic — role-based visibility + pagination + search
│   ├── repositories/
│   │   └── organization.repository.js  # MỚI: Prisma queries
│   ├── middleware/
│   │   ├── auth.middleware.js           # (đã có)
│   │   ├── authorize.middleware.js      # (từ UC26)
│   │   └── optionalAuth.middleware.js   # (từ UC31) — tái sử dụng
│   ├── routes/
│   │   └── organization.routes.js      # MỚI: GET /api/v1/organizations
│   ├── validators/
│   │   └── organization.validator.js   # MỚI: Zod schemas
│   ├── app.js                          # Cập nhật: mount organizationRoutes
│   └── server.js                       # (đã có)
├── prisma/
│   └── schema.prisma                   # MỚI: Organization model
└── tests/
    └── organization/
        ├── organization.service.test.js # MỚI: unit tests
        └── organization.api.test.js     # MỚI: integration tests

frontend/
├── src/
│   ├── api/
│   │   └── organizationApi.js          # MỚI: Axios client
│   ├── components/
│   │   └── pages/
│   │       └── OrganizationListPage.jsx # MỚI: Organization List screen
│   ├── hooks/
│   │   └── useOrganizations.js         # MỚI: custom hook
│   └── App.js                          # Cập nhật: thêm route /organizations
```

**Structure Decision**: Option 2 (Web application). Tạo mới toàn bộ stack cho Organization module. Pattern tương tự User Management (UC26) với pagination + search. Tái sử dụng `optionalAuth.middleware.js` từ UC31 cho Guest access.

## Complexity Tracking

> **Không có vi phạm** — Organization Management module mới, pattern tương tự User Management (UC26), tuân thủ cấu trúc phân tầng chuẩn VMS.
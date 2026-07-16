# Triển khai kế hoạch: View Organization Detail (UC38)

**Branch**: `001-uc38-view-organization-detail` | **Date**: 2026-07-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC38-feat-view-organization-detail/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Admin/Manager/Staff cần xem thông tin chi tiết của một tổ chức cụ thể, bao gồm danh sách tóm tắt tối đa 10 sự kiện gần nhất thuộc tổ chức đó. Backend xây dựng endpoint `GET /api/v1/organizations/:id`.

**⚠️ Cross-module dependency**: UC38 phải phục vụ UC09 (View Event Detail — NamLD). UC09 cần hiển thị thông tin cơ bản của tổ chức chủ quản sự kiện cho Volunteer và Guest khi xem chi tiết sự kiện. Do đó, cần 2 levels of detail:
- **Basic view** (Volunteer/Guest): Chỉ xem được thông tin cơ bản (name, description, logo_url, is_active) — phục vụ UC09
- **Full view** (Staff/Manager/Admin): Xem toàn bộ thông tin + danh sách sự kiện

Permission matrix:
- **Guest**: Xem basic info của organization active (public, optional auth) — phục vụ UC09
- **Volunteer**: Xem basic info của organization active — phục vụ UC09
- **Staff**: Xem full info của organization active
- **Manager**: Xem full info của organization active
- **Admin**: Xem full info của tất cả (active + inactive)

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include)

**Storage**: MySQL via Prisma ORM (Organization model — đã có từ UC37, Event relation)

**Testing**: 
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 500ms (bao gồm query sự kiện liên kết)

**Constraints**: 
- **Admin**: Xem full info của tất cả (active + inactive) + events summary
- **Manager/Staff**: Xem full info của organization active — inactive trả về 404
- **Volunteer**: Xem basic info (name, description, logo_url, is_active) của organization active — phục vụ UC09 (View Event Detail)
- **Guest**: Xem basic info của organization active qua public endpoint (optional auth) — phục vụ UC09
- Response bao gồm danh sách tối đa 10 sự kiện gần nhất (order by created_at desc) — chỉ cho Staff/Manager/Admin
- Trả về HTTP 404 nếu ID không tồn tại
- Trả về HTTP 400 nếu ID không hợp lệ
- Swagger JSDoc bắt buộc
- Max function length: 40 dòng; max file length: 300 dòng
- Bắt buộc dùng `response.util.js`

**Scale/Scope**: Mở rộng Organization module (UC37). Kế thừa Organization infrastructure. Thêm mới: service function, controller handler, route GET /:id. Response bao gồm events summary (tên, trạng thái, ngày — tối đa 10).

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
.sdd/DucNM/UC38-feat-view-organization-detail/
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
│   │   └── organization.controller.js  # Thêm handler getOrganizationById (kế thừa UC37)
│   ├── services/
│   │   └── organization.service.js     # Thêm hàm getOrganizationById (kế thừa UC37)
│   ├── repositories/
│   │   └── organization.repository.js  # Thêm hàm findOrganizationById + findEventsByOrgId (kế thừa UC37)
│   ├── routes/
│   │   └── organization.routes.js      # Thêm route GET /:id (kế thừa UC37)
│   └── tests/
│       └── organization/
│           ├── organization.service.test.js # Thêm tests
│           └── organization.api.test.js     # Thêm tests

frontend/
├── src/
│   ├── api/
│   │   └── organizationApi.js          # Thêm hàm getOrganizationById (kế thừa UC37)
│   ├── components/
│   │   └── pages/
│   │       └── OrganizationDetailPage.jsx # MỚI
│   ├── hooks/
│   │   └── useOrganizationDetail.js    # MỚI
│   └── App.js                          # Thêm route /organizations/:id
```

**Structure Decision**: Option 2 (Web application). Kế thừa Organization infrastructure từ UC37. Thêm mới các hàm `getOrganizationById` ở các layer tương ứng + events summary.

## Complexity Tracking

> **Không có vi phạm** — feature đơn giản (1 endpoint GET với role-based visibility + events summary), kế thừa infrastructure từ UC37.
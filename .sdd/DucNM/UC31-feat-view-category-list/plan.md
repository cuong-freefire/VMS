# Triển khai kế hoạch: View Category List (UC31)

**Branch**: `001-uc31-view-category-list` | **Date**: 2026-06-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC31-feat-view-category-list/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Manager/Admin/Staff cần xem danh sách danh mục (Category) để quản lý và tham chiếu khi phân loại sự kiện. Backend xây dựng endpoint `GET /api/v1/categories`. 

**⚠️ Cross-module dependency**: UC31 phải phục vụ UC11 (Filter Event — NamLD). UC11 cần Guest và Volunteer có thể xem danh sách category active để hiển thị dropdown filter trên Event List. Do đó:
- **Guest**: Xem categories active (public endpoint, không cần auth) — phục vụ UC11
- **Volunteer**: Xem categories active — phục vụ UC11
- **Staff**: Xem categories active
- **Manager/Admin**: Xem tất cả categories (active + inactive)

Không cần phân trang vì số lượng danh mục thường ít (< 50).

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include)

**Storage**: MySQL via Prisma ORM (Category table với soft delete qua is_active)

**Testing**: 
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 500ms — số lượng category nhỏ, không cần phân trang

**Constraints**: 
- Manager/Admin: thấy tất cả categories (active + inactive)
- Staff: chỉ thấy categories active (`is_active = true`)
- **Volunteer: chỉ thấy categories active** (phục vụ UC11 Filter Event)
- **Guest: chỉ thấy categories active, qua public endpoint không cần auth** (phục vụ UC11 Filter Event)
- Không cần phân trang (dữ liệu < 50 records)
- Soft delete: Category dùng `is_active = false`
- Swagger JSDoc bắt buộc
- Max function length: 40 dòng; max file length: 300 dòng
- Bắt buộc dùng `response.util.js`

**Scale/Scope**: Module mới — Category Management (UC31-UC33). Thuộc Member 4 — AnhND. Tạo mới toàn bộ layers: controller, service, repository, routes, validator cho Category.

## Constitution Check

Các nguyên tắc từ AGENTS.md và CLAUDE.md:

1. **Layered Architecture**: Controller → Service → Repository (bắt buộc)
2. **Test-First**: Tối thiểu 80% coverage cho Service layer
3. **API Response Format**: Buộc dùng `response.util.js`
4. **Soft Delete**: Category dùng `is_active = false`
5. **Swagger Documentation**: Bắt buộc JSDoc cho mọi endpoint
6. **Cross-module**: Không import Repository từ module khác

**Kết luận**: Không có vi phạm. Gates pass.

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC31-feat-view-category-list/
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
│   │   └── category.controller.js  # MỚI: handler getCategories
│   ├── services/
│   │   └── category.service.js     # MỚI: business logic — role-based visibility
│   ├── repositories/
│   │   └── category.repository.js  # MỚI: Prisma queries
│   ├── middleware/
│   │   ├── auth.middleware.js       # (đã có)
│   │   └── authorize.middleware.js  # (từ UC26) — mở rộng support STAFF
│   ├── routes/
│   │   ├── user.routes.js          # (đã có)
│   │   └── category.routes.js      # MỚI: GET /api/v1/categories
│   ├── validators/
│   │   └── category.validator.js   # MỚI: Zod schemas
│   ├── utils/                      # (đã có)
│   ├── app.js                      # Cập nhật: mount categoryRoutes
│   └── server.js                   # (đã có)
├── prisma/
│   └── schema.prisma               # MỚI: Category model
└── tests/
    └── category/
        ├── category.service.test.js # MỚI: unit tests
        └── category.api.test.js     # MỚI: integration tests

frontend/
├── src/
│   ├── api/
│   │   └── categoryApi.js          # MỚI: Axios client
│   ├── components/
│   │   └── pages/
│   │       └── CategoryListPage.jsx # MỚI: Category List screen
│   ├── hooks/
│   │   └── useCategories.js        # MỚI: custom hook
│   └── App.js                      # Cập nhật: thêm route /categories
```

**Structure Decision**: Option 2 (Web application). Tạo mới toàn bộ stack cho Category module vì đây là module riêng biệt, không kế thừa từ User Management.

## Complexity Tracking

> **Không có vi phạm** — Category Management module mới, tuân thủ cấu trúc phân tầng chuẩn VMS.
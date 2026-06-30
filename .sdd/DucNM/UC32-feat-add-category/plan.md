# Triển khai kế hoạch: Add Category (UC32)

**Branch**: `001-uc32-add-category` | **Date**: 2026-06-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC32-feat-add-category/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Manager/Admin cần thêm mới danh mục (Category) để phân loại sự kiện — ví dụ: thêm loại hình sự kiện "Thể thao" hoặc địa điểm tổ chức mới. Backend xây dựng endpoint `POST /api/v1/categories` với validation (name, type enum, unique name trong cùng type). Chỉ Manager và Admin mới có quyền; Staff/Volunteer bị 403, Guest bị 401. Kế thừa Category infrastructure từ UC31 (model, repository pattern).

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include), React Hook Form

**Storage**: MySQL via Prisma ORM (Category model — đã có từ UC31)

**Testing**: 
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 1 giây cho request tạo category hợp lệ

**Constraints**: 
- Chỉ Manager và Admin mới có quyền tạo (Staff/Volunteer → HTTP 403, Guest → HTTP 401)
- Type phải thuộc: `location`, `event_type`, `time_frame`
- Tên category unique trong cùng type — nếu trùng → HTTP 409 Conflict
- Category mặc định `is_active = true`
- Swagger JSDoc bắt buộc
- Max function length: 40 dòng; max file length: 300 dòng
- Bắt buộc dùng `response.util.js`

**Scale/Scope**: Mở rộng Category module (UC31). Kế thừa Category model từ UC31. Thêm mới: validator schema, service function, controller handler, route.

## Constitution Check

Các nguyên tắc từ AGENTS.md và CLAUDE.md:

1. **Layered Architecture**: Controller → Service → Repository (bắt buộc)
2. **Test-First**: Tối thiểu 80% coverage cho Service layer
3. **API Response Format**: Buộc dùng `response.util.js`
4. **Swagger Documentation**: Bắt buộc JSDoc cho mọi endpoint
5. **Cross-module**: Không import Repository từ module khác

**Kết luận**: Không có vi phạm. Gates pass.

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC32-feat-add-category/
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
│   │   └── category.controller.js  # Thêm handler createCategory (kế thừa từ UC31)
│   ├── services/
│   │   └── category.service.js     # Thêm hàm createCategory (kế thừa từ UC31)
│   ├── repositories/
│   │   └── category.repository.js  # Thêm hàm createCategory + findByNameAndType (kế thừa từ UC31)
│   ├── middleware/
│   │   ├── auth.middleware.js       # (đã có)
│   │   └── authorize.middleware.js  # (từ UC26)
│   ├── routes/
│   │   └── category.routes.js      # Thêm route POST / (kế thừa từ UC31)
│   ├── validators/
│   │   └── category.validator.js   # Thêm createCategorySchema (Zod)
│   └── tests/
│       └── category/
│           ├── category.service.test.js # Thêm tests cho createCategory
│           └── category.api.test.js     # Thêm tests cho POST /api/v1/categories

frontend/
├── src/
│   ├── api/
│   │   └── categoryApi.js          # Thêm hàm createCategory (kế thừa từ UC31)
│   ├── components/
│   │   └── pages/
│   │       └── AddCategoryPage.jsx # MỚI: Add Category form
│   ├── hooks/
│   │   └── useCreateCategory.js   # MỚI: custom hook
│   └── App.js                     # Thêm route /categories/add
```

**Structure Decision**: Option 2 (Web application). Kế thừa Category infrastructure từ UC31 (model, repository pattern). Thêm mới các hàm `createCategory` ở các layer tương ứng.

## Complexity Tracking

> **Không có vi phạm** — feature đơn giản (1 endpoint POST với validation + unique check), kế thừa infrastructure từ UC31.
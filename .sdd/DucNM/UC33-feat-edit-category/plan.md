# Triển khai kế hoạch: Edit Category (UC33)

**Branch**: `001-uc33-edit-category` | **Date**: 2026-07-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC33-feat-edit-category/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Manager/Admin cần chỉnh sửa thông tin danh mục — cập nhật tên, mô tả, hoặc vô hiệu hóa category (soft-delete) qua endpoint `PATCH /api/v1/categories/:id`. Type KHÔNG thể thay đổi (bất biến). Backend validate dữ liệu bằng Zod, kiểm tra category tồn tại (404 nếu không), kiểm tra tên unique trong cùng type khi đổi tên (409 nếu trùng). Chỉ Manager và Admin mới có quyền truy cập. Kế thừa Category infrastructure từ UC31 và UC32.

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include), React Hook Form

**Storage**: MySQL via Prisma ORM (Category model — đã có từ UC31, composite unique từ UC32)

**Testing**: 
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 1 giây cho request chỉnh sửa hợp lệ

**Constraints**: 
- Chỉ Manager và Admin mới có quyền (Staff/Volunteer → HTTP 403, Guest → HTTP 401)
- Các fields editable: `name`, `description`, `is_active`
- Type KHÔNG thể đổi — bất biến
- Tên mới phải unique trong cùng type (nếu đổi tên) — nếu trùng → HTTP 409
- Trả về HTTP 404 nếu category ID không tồn tại
- Trả về HTTP 400 nếu request body rỗng
- Soft delete: `is_active = false`
- Swagger JSDoc bắt buộc
- Max function length: 40 dòng; max file length: 300 dòng
- Bắt buộc dùng `response.util.js`

**Scale/Scope**: Mở rộng Category module (UC31 + UC32). Kế thừa toàn bộ infrastructure. Thêm mới: validator schema cho update, service function, controller handler, route PATCH.

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
.sdd/DucNM/UC33-feat-edit-category/
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
│   │   └── category.controller.js  # Thêm handler updateCategory (kế thừa UC31/UC32)
│   ├── services/
│   │   └── category.service.js     # Thêm hàm updateCategoryService (kế thừa)
│   ├── repositories/
│   │   └── category.repository.js  # Thêm hàm updateCategory + findCategoryById (kế thừa)
│   ├── middleware/                  # (đã có)
│   ├── routes/
│   │   └── category.routes.js      # Thêm route PATCH /:id (kế thừa UC31/UC32)
│   ├── validators/
│   │   └── category.validator.js   # Thêm updateCategorySchema (Zod)
│   └── tests/
│       └── category/
│           ├── category.service.test.js # Thêm tests cho updateCategory
│           └── category.api.test.js     # Thêm tests cho PATCH /api/v1/categories/:id

frontend/
├── src/
│   ├── api/
│   │   └── categoryApi.js          # Thêm hàm updateCategory (kế thừa)
│   ├── components/
│   │   └── pages/
│   │       └── EditCategoryPage.jsx # MỚI: Edit Category form (kế thừa AddCategoryPage)
│   ├── hooks/
│   │   └── useUpdateCategory.js    # MỚI: custom hook
│   └── App.js                      # Thêm route /categories/:id/edit
```

**Structure Decision**: Option 2 (Web application). Kế thừa Category infrastructure từ UC31/UC32. Thêm mới các hàm `updateCategory` ở các layer tương ứng.

## Complexity Tracking

> **Không có vi phạm** — feature đơn giản (1 endpoint PATCH với validation + unique check), kế thừa infrastructure từ UC31/UC32.
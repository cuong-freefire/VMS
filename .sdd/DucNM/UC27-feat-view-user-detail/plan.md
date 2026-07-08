# Triển khai kế hoạch: View User Detail (UC27)

**Branch**: `001-uc27-view-user-detail` | **Date**: 2026-06-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC27-feat-view-user-detail/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Admin cần xem thông tin chi tiết của một người dùng cụ thể trong hệ thống VMS để kiểm tra, xác minh thông tin trước khi chỉnh sửa hoặc thực hiện các thao tác quản lý khác. Backend xây dựng endpoint `GET /api/v1/users/:id` trả về đầy đủ thông tin user (bao gồm cả inactive users). Frontend xây dựng User Detail screen tương ứng. Chỉ Admin mới có quyền truy cập; các role khác bị từ chối HTTP 403, Guest nhận HTTP 401. Nếu ID không tồn tại, trả về HTTP 404.

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include), React Hook Form

**Storage**: MySQL via Prisma ORM (soft delete: `is_active` field on User)

**Testing**: 
- Backend: Jest + Supertest (integration tests cho endpoint, 80% coverage target cho Service layer)
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first, Browser: Chrome, Firefox, Edge)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 500ms cho request với ID hợp lệ

**Constraints**: 
- Chỉ Admin mới có quyền truy cập (Staff/Manager/Volunteer → HTTP 403, Guest → HTTP 401)
- Trả về HTTP 404 nếu user ID không tồn tại trong database
- Vẫn trả về thông tin user bị soft-delete (`is_active: false`) — Admin cần thấy cả user bị vô hiệu hóa
- Nếu `:id` không phải định dạng hợp lệ → HTTP 400 Bad Request
- Max function length: 40 dòng; max file length: 300 dòng
- Không dùng `var`, ưu tiên `const`/`let`
- Comments chỉ giải thích WHY, không giải thích WHAT
- Bắt buộc dùng `response.util.js` (successResponse/errorResponse) cho API response

**Scale/Scope**: Feature đơn giản — 1 endpoint GET, 1 trang frontend. Thuộc User Management module (UC27) của Member 4 — AnhND. Kế thừa infrastructure từ UC26 (authorize middleware, user.repository).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Các nguyên tắc sau được áp dụng từ AGENTS.md và CLAUDE.md:

1. **Layered Architecture**: Controller → Service → Repository (bắt buộc)
2. **Test-First**: Tối thiểu 80% coverage cho Service layer (Jest)
3. **API Response Format**: Buộc dùng `response.util.js` (success/error pattern)
4. **Soft Delete**: User master data dùng `is_active = false` (không hard delete)
5. **Swagger Documentation**: Bắt buộc JSDoc cho mọi endpoint
6. **Cross-module**: Không import Repository từ module khác — giao tiếp qua Service layer

**Kết luận**: Không có vi phạm. Gates pass.

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC27-feat-view-user-detail/
├── context.md              # Problem context, constraints, assumptions
├── spec.md                 # Feature specification (EARS notation)
├── plan.md                 # This file (/speckit-plan command output)
├── research.md             # Phase 0 output (technical research)
├── data-model.md           # Phase 1 output (data model)
├── quickstart.md           # Phase 1 output (quick start guide)
├── contracts/              # Phase 1 output (API contracts)
└── tasks.md                # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/
│   │   └── user.controller.js     # Thêm handler getUserById (kế thừa từ UC26)
│   ├── services/
│   │   └── user.service.js        # Thêm hàm getUserById (kế thừa từ UC26)
│   ├── repositories/
│   │   └── user.repository.js     # Thêm hàm findUserById (kế thừa từ UC26)
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT authentication (đã có)
│   │   └── authorize.middleware.js # Role-based authorization (từ UC26)
│   ├── routes/
│   │   └── user.routes.js          # Thêm route GET /:id (kế thừa từ UC26)
│   ├── validators/
│   │   └── user.validator.js       # Thêm validation cho userId param
│   ├── utils/
│   │   ├── jwt.util.js             # (đã có)
│   │   └── response.util.js        # (đã có)
│   ├── app.js                      # (đã có, mount userRoutes)
│   └── server.js                   # (đã có)
└── tests/
    └── user/
        ├── user.service.test.js    # Thêm tests cho getUserById
        └── user.api.test.js        # Thêm tests cho GET /api/v1/users/:id

frontend/
├── src/
│   ├── api/
│   │   └── userApi.js             # Thêm hàm getUserById (kế thừa từ UC26)
│   ├── components/
│   │   └── pages/
│   │       └── UserDetailPage.jsx # User Detail screen mới
│   ├── hooks/
│   │   └── useUserDetail.js       # Custom hook mới cho user detail
│   ├── App.js                     # Thêm route /users/:id
│   └── index.js                   # (đã có)
└── tests/
    └── UserDetailPage.test.jsx    # Component tests cho User Detail
```

**Structure Decision**: Sử dụng Option 2 (Web application — frontend + backend) theo đúng cấu trúc mẫu của project VMS. Kế thừa tối đa infrastructure từ UC26: authorize middleware, user.repository, user.service, user.controller, user.routes, userApi. Chỉ mở rộng thêm hàm `getUserById` ở các layer tương ứng.

## Complexity Tracking

> **Không có vi phạm cần justification** — đây là feature đơn giản (1 endpoint GET), kế thừa infrastructure từ UC26, tuân thủ cấu trúc chuẩn VMS.
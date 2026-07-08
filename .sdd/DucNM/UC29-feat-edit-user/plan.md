# Triển khai kế hoạch: Edit User (UC29)

**Branch**: `001-uc29-edit-user` | **Date**: 2026-06-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC29-feat-edit-user/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Admin cần chỉnh sửa thông tin người dùng trong hệ thống VMS — cập nhật họ tên, số điện thoại, avatar, role, hoặc vô hiệu hóa tài khoản (soft-delete) qua endpoint `PATCH /api/v1/users/:id`. Email không thể thay đổi (bất biến). Admin không thể tự hạ role của chính mình. Backend validate dữ liệu bằng Zod, kiểm tra user tồn tại (404 nếu không), kiểm tra self-role-downgrade (403 nếu cố tự hạ role). Chỉ Admin mới có quyền truy cập.

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include), React Hook Form

**Storage**: MySQL via Prisma ORM (User table, soft delete via is_active)

**Testing**: 
- Backend: Jest + Supertest (integration tests cho endpoint, 80% coverage target cho Service layer)
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first, Browser: Chrome, Firefox, Edge)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 1 giây cho request chỉnh sửa hợp lệ

**Constraints**: 
- Chỉ Admin mới có quyền truy cập (Staff/Manager/Volunteer → HTTP 403, Guest → HTTP 401)
- Email là bất biến — không thể thay đổi sau khi tạo
- Admin không thể tự hạ role của chính mình (HTTP 403 Forbidden)
- Các fields có thể update: `full_name`, `phone`, `avatar_url`, `role_id`, `is_active`
- Trả về HTTP 404 nếu user ID không tồn tại
- Trả về HTTP 400 nếu request body rỗng hoặc validation fail
- Max function length: 40 dòng; max file length: 300 dòng
- Bắt buộc dùng `response.util.js` (successResponse/errorResponse) cho API response

**Scale/Scope**: Feature đơn giản — 1 endpoint PATCH, 1 form frontend. Thuộc User Management module (UC29) của Member 4 — AnhND. Kế thừa infrastructure từ UC26/UC27/UC28 (authorize middleware, user.repository, user.service, user.controller, user.routes, validators).

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
.sdd/DucNM/UC29-feat-edit-user/
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
│   │   └── user.controller.js     # Thêm handler updateUser (kế thừa từ UC26-UC28)
│   ├── services/
│   │   └── user.service.js        # Thêm hàm updateUserService (kế thừa)
│   ├── repositories/
│   │   └── user.repository.js     # Thêm hàm updateUser + findUserById (đã có từ UC27)
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT authentication (đã có)
│   │   └── authorize.middleware.js # Role-based authorization (từ UC26)
│   ├── routes/
│   │   └── user.routes.js          # Thêm route PATCH /:id (kế thừa)
│   ├── validators/
│   │   └── user.validator.js       # Thêm updateUserSchema (Zod)
│   ├── utils/
│   │   ├── jwt.util.js             # (đã có)
│   │   └── response.util.js        # (đã có)
│   ├── app.js                      # (đã có)
│   └── server.js                   # (đã có)
└── tests/
    └── user/
        ├── user.service.test.js    # Thêm tests cho updateUser
        └── user.api.test.js        # Thêm tests cho PATCH /api/v1/users/:id

frontend/
├── src/
│   ├── api/
│   │   └── userApi.js             # Thêm hàm updateUser (kế thừa)
│   ├── components/
│   │   └── pages/
│   │       └── EditUserPage.jsx   # Edit User form screen (kế thừa từ AddUserPage)
│   ├── hooks/
│   │   └── useUpdateUser.js       # Custom hook mới cho update user
│   ├── App.js                     # Thêm route /users/:id/edit
│   └── index.js                   # (đã có)
└── tests/
    └── EditUserPage.test.jsx      # Component tests
```

**Structure Decision**: Sử dụng Option 2 (Web application — frontend + backend) theo đúng cấu trúc mẫu của project VMS. Kế thừa tối đa infrastructure từ UC26-UC28. Thêm mới `updateUserService` + `updateUser` repository method + `updateUserSchema` validator + `EditUserPage.jsx` frontend.

## Complexity Tracking

> **Không có vi phạm cần justification** — đây là feature đơn giản (1 endpoint PATCH với validation + self-role check), kế thừa infrastructure từ UC26/UC27/UC28, tuân thủ cấu trúc chuẩn VMS.
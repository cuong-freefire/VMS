# Triển khai kế hoạch: Add User (UC28)

**Branch**: `001-uc28-add-user` | **Date**: 2026-06-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC28-feat-add-user/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Admin cần tạo tài khoản mới cho người dùng trong hệ thống VMS (Staff, Manager, Admin bổ sung) qua endpoint `POST /api/v1/users`. Backend validate dữ liệu đầu vào (email format + uniqueness, password >= 8 ký tự, role hợp lệ), hash password bằng bcryptjs, lưu vào database và trả về HTTP 201 cùng thông tin user (không bao gồm password). Chỉ Admin mới có quyền truy cập; các role khác bị từ chối HTTP 403, Guest nhận HTTP 401. Email trùng lặp trả về HTTP 409.

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, bcryptjs, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include), React Hook Form

**Storage**: MySQL via Prisma ORM (User table với unique constraint trên email)

**Testing**: 
- Backend: Jest + Supertest (integration tests cho endpoint, 80% coverage target cho Service layer)
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first, Browser: Chrome, Firefox, Edge)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 1 giây cho request tạo user hợp lệ

**Constraints**: 
- Chỉ Admin mới có quyền truy cập (Staff/Manager/Volunteer → HTTP 403, Guest → HTTP 401)
- Email bắt buộc đúng format và duy nhất trong hệ thống (kể cả inactive users)
- Mật khẩu tối thiểu 8 ký tự, hash bằng bcryptjs trước khi lưu
- Role phải hợp lệ: VOLUNTEER, STAFF, MANAGER, ADMIN
- Response không bao gồm password field
- Trả về HTTP 201 khi thành công, HTTP 409 khi email đã tồn tại
- Max function length: 40 dòng; max file length: 300 dòng
- Bắt buộc dùng `response.util.js` (successResponse/errorResponse) cho API response

**Scale/Scope**: Feature đơn giản — 1 endpoint POST, 1 form frontend. Thuộc User Management module (UC28) của Member 4 — AnhND. Kế thừa infrastructure từ UC26 (authorize middleware) và UC27 (user.repository pattern).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Các nguyên tắc sau được áp dụng từ AGENTS.md và CLAUDE.md:

1. **Layered Architecture**: Controller → Service → Repository (bắt buộc)
2. **Test-First**: Tối thiểu 80% coverage cho Service layer (Jest)
3. **API Response Format**: Buộc dùng `response.util.js` (success/error pattern)
4. **Soft Delete**: User master data dùng `is_active = false` (không hard delete)
5. **Swagger Documentation**: Bắt buộc JSDoc cho mọi endpoint
6. **Cross-module**: Không import Repository từ module khác — giao tiếp qua Service layer
7. **Password Security**: Bcryptjs hash — không lưu plain text password

**Kết luận**: Không có vi phạm. Gates pass.

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC28-feat-add-user/
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
│   │   └── user.controller.js     # Thêm handler createUser (kế thừa từ UC26/UC27)
│   ├── services/
│   │   └── user.service.js        # Thêm hàm createUser (kế thừa từ UC26/UC27)
│   ├── repositories/
│   │   └── user.repository.js     # Thêm hàm createUser + findByEmail (kế thừa từ UC26/UC27)
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT authentication (đã có)
│   │   └── authorize.middleware.js # Role-based authorization (từ UC26)
│   ├── routes/
│   │   └── user.routes.js          # Thêm route POST / (kế thừa từ UC26/UC27)
│   ├── validators/
│   │   └── user.validator.js       # Thêm createUserSchema (Zod)
│   ├── utils/
│   │   ├── jwt.util.js             # (đã có)
│   │   └── response.util.js        # (đã có)
│   ├── app.js                      # (đã có, mount userRoutes)
│   └── server.js                   # (đã có)
└── tests/
    └── user/
        ├── user.service.test.js    # Thêm tests cho createUser
        └── user.api.test.js        # Thêm tests cho POST /api/v1/users

frontend/
├── src/
│   ├── api/
│   │   └── userApi.js             # Thêm hàm createUser (kế thừa từ UC26/UC27)
│   ├── components/
│   │   └── pages/
│   │       └── AddUserPage.jsx    # Add User form screen mới
│   ├── hooks/
│   │   └── useCreateUser.js       # Custom hook mới cho create user
│   ├── App.js                     # Thêm route /users/add
│   └── index.js                   # (đã có)
└── tests/
    └── AddUserPage.test.jsx       # Component tests cho Add User form
```

**Structure Decision**: Sử dụng Option 2 (Web application — frontend + backend) theo đúng cấu trúc mẫu của project VMS. Kế thừa tối đa infrastructure từ UC26/UC27: authorize middleware, user.repository, user.service, user.controller, user.routes, userApi. Thêm mới các hàm `createUser` ở các layer tương ứng + Zod schema cho request body validation.

## Complexity Tracking

> **Không có vi phạm cần justification** — đây là feature đơn giản (1 endpoint POST với validation + bcrypt hash), kế thừa infrastructure từ UC26/UC27, tuân thủ cấu trúc chuẩn VMS.
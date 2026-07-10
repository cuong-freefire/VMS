# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.)

# Implementation Plan: Authentication Login (UC03)

**Branch**: `CuongLH` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.sdd/CuongLH/UC03-feat-auth-login/spec.md`

**Owner**: Member 1 - CuongLH | **Module**: Authentication

## Summary

Tính năng đăng nhập an toàn cho VMS, cho phép người dùng (Volunteer, Staff, Manager, Admin) xác thực danh tính bằng Email và Password để truy cập các chức năng nghiệp vụ theo phân quyền.

**Technical approach**:

- JWT lưu trong HttpOnly Cookie với TTL 7 ngày, payload `{user_id, email, role_id, role_name, jti}`
- Single Active Session enforcement: bảng `user_sessions` với UNIQUE(user_id) lưu jti, ghi đè khi login mới
- Account Lockout: bảng `login_attempts` track failed attempts, khóa 15 phút sau 5 lần sai
- Bcrypt password verification (salt rounds = 12)
- Zod validation cho email format và required fields
- Soft delete check: chặn login nếu `users.is_active = false`
- ServiceError class pattern: centralized error class với `{code, message, statusCode}` để chuẩn hóa error handling

## Technical Context

**Language/Version**: NodeJS (LTS version) + JavaScript ESM

**Primary Dependencies**: Express 5.x, Prisma ORM, Zod, bcryptjs, jsonwebtoken, React 19, Axios, Bootstrap 5

**Storage**: MySQL (users, user_sessions, login_attempts, roles tables)

**Testing**: Jest + Supertest (Backend), Jest + React Testing Library (Frontend)

**Target Platform**: Web application (Desktop browser first, Chrome/Firefox/Edge/Safari)

**Project Type**: Full-stack web service (Backend REST API + Frontend SPA)

**Performance Goals**:

- Login API response time < 200ms (p95) với 100 concurrent requests
- JWT generation + bcrypt verification < 300ms
- Frontend page load (LoginPage) < 1 second

**Constraints**:

- MUST use HttpOnly Cookie for JWT (KHÔNG localStorage) per ADR-002
- MUST enforce Single Active Session (1 user = 1 session) per SPEC US4
- MUST soft delete users (is_active flag) per ADR-005
- MUST use bcrypt salt rounds = 12 per DATABASE.md
- Password MUST NOT be logged in plaintext per Layer 1 constraints

**Scale/Scope**:

- MVP target: 100-500 concurrent users
- Expected active users: ~1,000 volunteers + 50 staff + 10 managers + 5 admins
- Login frequency: ~2-5 logins/user/week

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Layer 1 (Hard Rules) — Compliance Check

✅ **PASS**: Password không lưu plaintext → Sử dụng bcrypt hash với salt rounds = 12

✅ **PASS**: Không SQL Injection → Sử dụng Prisma ORM (parameterized queries)

✅ **PASS**: Soft delete cho users → Kiểm tra `is_active = true` trước khi cho login

✅ **PASS**: Không leak credentials trong response → Error messages không tiết lộ email existence, không return password_hash

✅ **PASS**: userId lấy từ JWT → Middleware `authenticate` inject `req.user`, Service KHÔNG đọc từ req.body

✅ **PASS**: Không commit secrets → AUTH_SECRET, JWT_SECRET trong .env, file .env trong .gitignore

✅ **PASS**: Input validation → Zod validator middleware cho email format và required fields

✅ **PASS**: Authentication → JWT stored in HttpOnly Cookie, verified by middleware

❌ **N/A**: File Upload → UC03 không có file upload

❌ **N/A**: Payment info storage → UC03 không xử lý payment

### Layer 2 (Architecture Constraints) — Compliance Check

✅ **PASS**: Layered Architecture → Route → Middleware (Validation) → Controller → Service → Repository

✅ **PASS**: Cross-module access → UC03 không gọi modules khác. Các modules khác sẽ consume UC03 qua `authMiddleware.authenticate`

✅ **PASS**: Module Ownership → UC03 thuộc Member 1 (CuongLH), không modify code của members khác

✅ **PASS**: Database transactions → Single Active Session upsert và login attempts update đều atomic (Prisma transactions nếu cần)

✅ **PASS**: Audit Log → Login attempts được log vào `login_attempts` table (who, when, success/fail)

### Layer 3 (Engineering Standards) — Compliance Check

⚠️ **TARGET**: Test coverage 80% cho AuthService, 60% cho AuthController

⚠️ **TARGET**: API response time < 200ms (p95)

✅ **PASS**: API response format → Tuân thủ ADR-006, sử dụng `response.util.js`

✅ **PASS**: ESLint → Sẽ run `npm run lint` trước khi commit

✅ **PASS**: Tests traceability → Test cases map trực tiếp tới US1-US5 trong spec.md

### Violations Requiring Justification

**NONE** — UC03 tuân thủ đầy đủ tất cả constraints từ constitution.md

## Project Structure

### Documentation (this feature)

```text
.sdd/CuongLH/UC03-feat-auth-login/
├── CONTEXT.md           # Problem statement, domain knowledge (DONE)
├── SPEC.md              # Feature specification (DONE)
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── auth-api.md      # POST /api/v1/auth/login contract
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
# Web application structure (Backend + Frontend)

backend/
├── src/
│   ├── controllers/
│   │   └── auth.controller.js          # [NEW] Login endpoint handler (dùng ServiceError + setTokenToCookie)
│   ├── services/
│   │   └── auth.service.js             # [NEW] Login business logic (default export)
│   ├── repositories/
│   │   └── auth.repository.js          # [NEW] Database queries (users, sessions, attempts)
│   ├── routes/
│   │   └── auth.routes.js              # [NEW] Route: POST /api/v1/auth/login
│   ├── middlewares/
│   │   ├── auth.middleware.js          # [NEW] authenticate() middleware: verify JWT → check jti → check expiresAt → clear cookie → inject req.user
│   │   └── errorHandler.middleware.js  # [EXISTING] Centralized error handler
│   ├── validators/
│   │   ├── auth.validator.js           # [NEW] Zod schemas cho login input (email.max(255), .toLowerCase(), .trim())
│   │   └── validate.js                 # [NEW] Shared validation middleware factory (safeParse + strip)
│   ├── utils/
│   │   ├── jwt.util.js                 # [NEW] JWT sign/verify helpers + setTokenToCookie
│   │   └── response.util.js            # [NEW] Response formatter: {success, message, data/code, details} + ServiceError
│   └── config/
│       └── env.config.js               # [EXISTING] Load .env variables
├── prisma/
│   ├── schema.prisma                   # [UPDATE] Add user_sessions, login_attempts models
│   ├── migrations/                     # [NEW] Migration files
│   │   └── 20260629_create_auth_tables/
│   └── seed.js                         # [UPDATE] Seed roles table
└── tests/
    ├── integration/
    │   └── auth.test.js                # [NEW] API tests cho /auth/login
    └── unit/
        └── auth.service.test.js        # [NEW] Unit tests cho AuthService

frontend/
├── src/
│   ├── components/
│   │   ├── pages/
│   │   │   └── LoginPage.jsx           # [NEW] Login form UI với react-hook-form, toast warning/error
│   │   ├── layouts/
│   │   │   └── AuthLayout.jsx          # [NEW] Auth page wrapper: VMS branding + Outlet
│   │   └── guards/
│   │       ├── ProtectedRoute.jsx      # [NEW] Redirect unauthenticated → /login
│   │       ├── GuestRoute.jsx          # [NEW] Redirect authenticated → role home
│   │       └── RoleRoute.jsx           # [NEW] Block users without required role
│   ├── api/
│   │   └── axiosApi.js                 # [EXISTING] Axios client: withCredentials + response interceptor (401→redirect, 403→redirect, 500→log)
│   ├── contexts/
│   │   └── authContext.context.js      # [NEW] Full AuthProvider: user, loading, login(), logout(), updateUser(), role helpers
│   ├── services/
│   │   ├── auth.service.js             # [NEW] login(), logout(), forgotPassword, changePassword API calls
│   │   └── user.service.js             # [NEW] getMe() for auth state initialization
│   └── constants/
│       └── roles.js                    # [NEW] ROLES object + roleRouteMap
└── tests/
    └── components/
        └── pages/
            └── LoginPage.test.jsx      # [NEW] LoginPage component tests
```

**Structure Decision**:

VMS là web application với separate backend và frontend. UC03 follow **Option 2** từ template.

**Key directories**:

- **Backend**: `backend/src/` với layered architecture (controllers, services, repositories)
- **Frontend**: `frontend/src/` với React component structure
- **Database**: `backend/prisma/` cho schema và migrations
- **Tests**: Riêng biệt cho backend (`backend/tests/`) và frontend (`frontend/tests/`)

**File naming conventions** (per CLAUDE.md Section 2):

- Backend: `[resource].[layer].js` (e.g., `auth.controller.js`)
- Frontend components: PascalCase `.jsx` (e.g., `LoginPage.jsx`)
- API clients: camelCase `.js` (e.g., `axiosApi.js`)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**NO VIOLATIONS** — UC03 tuân thủ đầy đủ tất cả Layer 1, Layer 2, và Layer 3 constraints từ constitution.md. Không có complexity violations cần justify.

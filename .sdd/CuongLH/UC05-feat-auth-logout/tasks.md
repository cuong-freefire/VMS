# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.)

# Tasks: Đăng xuất (Logout) - UC05

**Input**: Design documents from `.sdd/CuongLH/UC05-feat-auth-logout/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/logout-api.md ✅, quickstart.md ✅

**Tests**: Unit tests for Service layer (80% coverage target), Integration tests for API endpoint, Component tests for Navbar logout button (per AGENTS.md Section 9)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- **Tests**: `backend/tests/`, `frontend/tests/`

## Codebase Context (Actual — verified at task generation)

| Plan Reference | Actual File | Notes |
|---|---|---|
| `authApi.js` | `frontend/src/services/auth.service.js` | Frontend dùng service pattern, không có file `api/authApi.js` |
| `Header.jsx` | `frontend/src/components/ui/Navbar.jsx` | Navbar hiển thị auth UI (Sign In/Sign Up/Xin chào) |
| `access_token` cookie | `token` cookie | jwt.util.js set cookie name = `'token'` |
| `sameSite: 'strict'` | `sameSite: 'lax'` | jwt.util.js set sameSite = `'lax'` |
| `maxAge: 900000` (15 min) | `maxAge: 24*60*60*1000` (1 day) | jwt.util.js set maxAge = 1 ngày |
| Response `{ success, message }` | Response `{ success, message, data }` | Dùng `successResponse(data, message)` từ response.util.js |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing project structure and dependencies for logout feature

- [ ] T001 Verify existing `backend/src/controllers/auth.controller.js` exports: `login`, `sendOTPController`, `verifyOTPController`
- [ ] T002 [P] Verify existing `backend/src/services/auth.service.js` exports: `loginService`, `sendOTP`, `verifyOTP`
- [ ] T003 [P] Verify existing `backend/src/routes/auth.routes.js` route registration pattern (POST handlers, validate middleware usage)
- [ ] T004 [P] Verify existing `frontend/src/contexts/authContext.context.js` AuthContext API: `user`, `loading`, `isAuthenticated`, `login`, `initializeUser`
- [ ] T005 [P] Verify existing `frontend/src/components/ui/Navbar.jsx` auth state rendering: `authContext.isAuthenticated` conditional, Sign In/Sign Up links, "Xin chào" greeting
- [ ] T006 [P] Verify cookie-parser middleware is configured in `backend/src/app.js` (required for `res.cookie()` operations)
- [ ] T007 [P] Verify Axios `withCredentials: true` in `frontend/src/api/axiosApi.js` and response interceptor (handles 401 → redirect /login)

**Checkpoint**: Foundation verified — all prerequisite files exist and are properly structured

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ensure auth middleware, cookie handling, and response utilities match logout requirements

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Read `backend/src/utils/jwt.util.js` — confirm cookie attributes for logout: name = `'token'`, `httpOnly: true`, `sameSite: 'lax'`, `secure: process.env.NODE_ENV === 'production'`, `path` default (must match when clearing)
- [ ] T009 [P] Read `backend/src/utils/response.util.js` — confirm `successResponse(data, message)` API: returns `{ success: true, message, data }`; `errorResponse(message, code, details)` API: returns `{ success: false, message, code, details }`
- [ ] T010 [P] Read `backend/src/middlewares/auth.middleware.js` — confirm `authenticate` middleware behavior for edge cases: no cookie → 401, expired JWT → 401, invalid JWT → 401

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Đăng xuất cơ bản (Priority: P1) 🎯 MVP

**Goal**: Người dùng đã đăng nhập (Volunteer/Staff/Manager/Admin) có thể đăng xuất bằng một cú nhấp chuột. Cookie `token` bị xóa, AuthContext cleared, redirect về Landing Page (`/`).

**Independent Test**: Đăng nhập vào hệ thống → Navbar hiển thị "Xin chào {name}" → nhấn nút "Đăng xuất" → redirect về `/` → Navbar hiển thị "Sign In"/"Sign Up" → truy cập trực tiếp `/login` không còn tự động authenticate

**Acceptance Scenarios (from spec.md)**:

1. **Given** Volunteer đã đăng nhập, **When** nhấn "Đăng xuất" trên Navbar, **Then** cookie bị xóa, giao diện cập nhật về guest state, redirect về Landing Page
2. **Given** đã đăng xuất, **When** truy cập URL yêu cầu xác thực, **Then** từ chối truy cập, redirect về `/login`, hiển thị "Vui lòng đăng nhập để tiếp tục"

### Implementation for User Story 1

- [ ] T011 [US1] Gộp vào T012 — controller `logout()` xử lý trực tiếp `res.clearCookie()` + `successResponse()`, không cần service layer (stateless JWT, zero business logic)

- [ ] T012 [US1] Add `logout()` controller method in `backend/src/controllers/auth.controller.js` — clear cookie `token` with `res.clearCookie()` using same attributes as login (`httpOnly: true`, `secure: process.env.NODE_ENV === 'production'`, `sameSite: 'lax'`), return `successResponse({}, 'Đăng xuất thành công')` with status 200 (idempotent, no service layer needed)

- [ ] T013 [US1] Add Swagger JSDoc documentation for `POST /api/v1/auth/logout` in `backend/src/controllers/auth.controller.js` — document: summary "Đăng xuất người dùng", description "Clear JWT cookie và kết thúc phiên làm việc", tags [Authentication], no request body, response 200 with Set-Cookie header, response schema `{ success: boolean, message: string, data: object }`

- [ ] T014 [US1] Register `POST /auth/logout` route in `backend/src/routes/auth.routes.js` — import `{ logout }` from controller, add `router.post('/logout', logout)` — NO authenticate middleware (idempotent design: always return 200)

- [ ] T015 [US1] Add `logout()` function to `authService` object in `frontend/src/services/auth.service.js` — call `axiosApi.post('/auth/logout')`, return response data

- [ ] T016 [US1] Add `logout()` function in `frontend/src/contexts/authContext.context.js` — try/catch/finally pattern: call `authService.logout()` in try, catch logs error, finally always sets `setUser(null)` and `window.location.href = '/'` for redirect (depends on T015)

- [ ] T017 [US1] Update `frontend/src/components/ui/Navbar.jsx` — add logout button in authenticated section: `<button onClick={handleLogout} disabled={isLoggingOut}>Đăng xuất</button>`, add `isLoggingOut` state for double-click prevention, call `authContext.logout()` from `handleLogout` (depends on T016)

### Tests for User Story 1

- [ ] T018 [P] [US1] Create integration tests in `backend/tests/auth.logout.test.js` — test: (1) valid cookie → 200 + Set-Cookie header clears token, (2) no cookie → 200 idempotent, (3) invalid JWT → 200 idempotent, (4) expired JWT → 200 idempotent, (5) multiple sequential calls → toujours 200, (6) cookie attributes: HttpOnly, SameSite=Lax, Max-Age=0, Path=/, (7) response time < 100ms

- [ ] T019 [P] [US1] Create component tests in `frontend/src/__tests__/Navbar.test.jsx` — test: (1) logout button hiển thị khi `isAuthenticated = true`, (2) logout button KHÔNG hiển thị khi `isAuthenticated = false`, (3) click gọi `authContext.logout()`, (4) button disabled sau click, (5) hiển thị text "Đang đăng xuất..." khi `isLoggingOut = true`

**Checkpoint**: At this point, User Story 1 should be fully functional — basic logout works end-to-end (login → click logout → redirect → guest UI)

---

## Phase 4: User Story 2 - Đăng xuất trong điều kiện mạng không ổn định (Priority: P2)

**Goal**: Hệ thống vẫn xóa thông tin định danh cục bộ ngay cả khi kết nối mạng bị gián đoạn, đảm bảo tài khoản được bảo vệ ngay lập tức trên thiết bị hiện tại.

**Independent Test**: Ngắt kết nối mạng (DevTools → Network → Offline) → nhấn "Đăng xuất" → xác minh AuthContext cleared (`user = null`), redirect về `/`, Navbar hiển thị guest state (Sign In/Sign Up)

**Acceptance Scenarios (from spec.md)**:

1. **Given** Volunteer đã đăng nhập, **When** kết nối mạng bị gián đoạn ngay trước khi nhấn "Đăng xuất", **Then** thông tin định danh vẫn bị xóa khỏi trình duyệt cục bộ, giao diện cập nhật về guest state

### Implementation for User Story 2

- [ ] T020 [US2] Verify offline resilience trong `frontend/src/contexts/authContext.context.js` — confirm `logout()` function has `finally` block that ALWAYS clears `setUser(null)` and redirects to `/` dù API call thành công hay thất bại (FR-007: Offline Resilience)

- [ ] T021 [US2] Add console.error logging for API failure case in `frontend/src/contexts/authContext.context.js` — log `"Logout API failed, clearing local state anyway: " + error.message`, không throw error, đảm bảo cleanup continues

### Tests for User Story 2

- [ ] T022 [P] [US2] Add offline resilience test in `frontend/src/__tests__/Navbar.test.jsx` — mock `authService.logout()` reject với `new Error('Network error')`, verify `window.location.href = '/'` vẫn được gọi, verify `setUser(null)` vẫn được gọi

- [ ] T023 [P] [US2] Add idempotency edge case tests in `backend/tests/auth.logout.test.js` — verify 2 sequential logout calls both return 200, verify third logout call (no cookie) still returns 200, verify fifth call still 200

**Checkpoint**: At this point, User Stories 1 AND 2 should both work — logout is resilient to network failures and fully idempotent

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, linting, final validation, and Definition of Done checklist

- [ ] T024 [P] Update `share_context.md` with `POST /api/v1/auth/logout` API contract — document: endpoint `/api/v1/auth/logout`, method POST, no request body, idempotent design (always 200), cookie clearing behavior

- [ ] T025 Run backend ESLint and fix errors: `cd backend && npx eslint src/controllers/auth.controller.js src/services/auth.service.js src/routes/auth.routes.js`

- [ ] T026 [P] Run frontend ESLint and fix errors: `cd frontend && npx eslint src/services/auth.service.js src/contexts/authContext.context.js src/components/ui/Navbar.jsx`

- [ ] T027 Run all tests (backend + frontend) and verify 100% pass: `cd backend && npm test` ; `cd frontend && npm test`

- [ ] T028 Run quickstart.md manual testing checklist — verify: (1) Happy Path (login → logout → Landing Page), (2) Offline Resilience (disconnect → logout → redirect → guest UI), (3) Idempotency (logout multiple times → no errors)

- [ ] T029 Verify Definition of Done per AGENTS.md Section 9: (1) Unit tests passing + 80% coverage for service layer, (2) Integration tests for API endpoint covering happy path + error paths, (3) ESLint 0 errors, (4) API documented in Swagger (`@swagger` JSDoc), (5) Error cases handled with correct HTTP codes (200 idempotent, 500 internal), (6) NO TODO/FIXME comments in code

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately (verification only, read-only)
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 completion — Backend before Frontend
- **US2 (Phase 4)**: Depends on US1 completion — extends AuthContext logout resilience
- **Polish (Phase 5)**: Depends on US1 + US2 completion — all code must be written

### Within Phase 3 (US1) — Backend → Frontend

```
T011 (Controller) ---> T012 (Swagger) + T013 (Route)
                          (parallel after T011)
                         |
                         v
              T015 (Frontend Service) ---> T016 (AuthContext) ---> T017 (Navbar)
              (can start after T011)      (depends on T014)      (depends on T015)
                         |
                         v
              T018 (Backend Tests) | T019 (Frontend Tests) [parallel]
```

### Parallel Opportunities

- **Phase 1**: T001, T002, T003, T004, T005, T006, T007 — all [P], all read-only
- **Phase 2**: T008, T009, T010 — all [P], all read-only
- **Phase 3**: T012 and T013 after T011 (different files, no mutual deps)
- **Phase 3 Tests**: T018 and T019 [P] (different directories, no deps)
- **Phase 4 Tests**: T022 and T023 [P] (different directories, no deps)
- **Phase 5**: T024, T025, T026 [P] (different concerns)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup → Verify all prerequisite files exist
2. Complete Phase 2: Foundational → Confirm cookie/response/auth patterns
3. Complete Phase 3: US1 → T011→T012+T013→T014→T015→T016
4. Run T018 + T019 tests → Verify all pass
5. **STOP and VALIDATE**: Manual test US1 independently (login → logout → Landing Page)
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (P1) → Test independently → Deploy/Demo (MVP!)
3. Add US2 (P2) → Test independently → Deploy/Demo
4. Polish → Documentation + Linting + DoD validation
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (read-only, fast)
2. Once Foundational is done:
   - Developer A: User Story 1 (P1) — Backend + Frontend sequentially
   - Developer B: User Story 2 (P2) — Offline resilience (can start after US1 backend done)
3. Both can write tests in parallel once implementation complete

---

## Notes

- [P] tasks = different files, no dependencies — can run in parallel
- [US1]/[US2] label maps task to specific user story for traceability (spec.md)
- Each user story independently completable and testable
- Commit after each task or logical group (e.g., T011-T013: backend implementation block)
- Stop at any checkpoint to validate story independently
- **No database migrations required** (data-model.md confirms zero DB operations)
- Logout is **idempotent**: always returns 200 OK regardless of auth state (research.md decision)
- Cookie attributes MUST match login: name `'token'`, `httpOnly: true`, `sameSite: 'lax'`, `secure: process.env.NODE_ENV === 'production'`, default `path`
- Response format MUST use `successResponse(data, message)` utility (ADR-006, response.util.js)
- Max function length: 40 dòng; max file length: 300 dòng (AGENTS.md Section 7)

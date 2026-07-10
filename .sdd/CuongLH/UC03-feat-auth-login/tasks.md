# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.)

---

# Tasks: Authentication Login (UC03-feat-auth-login)

**Input**: Design documents from `.sdd/CuongLH/UC03-feat-auth-login/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/auth-api.md ✅, quickstart.md ✅

**Organization**: Tasks grouped by user story (P1 priority) to enable independent implementation and testing. All 5 user stories are P1 priority, so they represent the critical MVP scope.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema and environment configuration

- [ ] T001 Update Prisma schema with 4 authentication tables (roles, users, user_sessions, login_attempts) in `backend/prisma/schema.prisma`
- [ ] T002 Generate Prisma migration with `npx prisma migrate dev --name create_auth_tables`
- [ ] T003 [P] Create backend `.env` file with AUTH_SECRET, JWT_ACCESS_EXPIRES_IN, BCRYPT_SALT_ROUNDS, COOKIE_ACCESS_NAME configuration
- [ ] T004 [P] Create frontend `.env` file with REACT_APP_API_BASE_URL configuration

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Seed roles data (VOLUNTEER, STAFF, MANAGER, ADMIN) and test user in `backend/prisma/seed.js`
- [ ] T006 Run database seed with `npx prisma db seed`
- [ ] T007 [P] Create JWT utility functions (signToken, verifyToken, setTokenToCookie) in `backend/src/utils/jwt.util.js`
- [ ] T008 [P] Verify response utility exists in `backend/src/utils/response.util.js` with successResponse and errorResponse functions
- [ ] T009 [P] Setup CORS configuration in `backend/src/app.js` with `credentials: true` and `FRONTEND_ORIGIN` from .env
- [ ] T010 [P] Setup cookie-parser middleware in `backend/src/app.js`
- [ ] T011 Create auth repository with database query functions in `backend/src/repositories/auth.repository.js`: findUserByEmail, upsertSession, getLoginAttempts, incrementLoginAttempts, resetLoginAttempts
- [ ] T012 Create Zod validation schema for login input in `backend/src/middlewares/validators/auth.validator.js` with email format and password required validation

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Đăng nhập thành công với tài khoản hợp lệ (Priority: P1) 🎯 MVP

**Goal**: User can successfully login with valid email and password, receive JWT token, and be redirected based on role

**Independent Test**: Call POST /api/v1/auth/login with valid credentials (<volunteer@test.com> / Test123!) and verify HTTP 200, JWT cookie set, user data returned with role_id

### Tests for User Story 1 (Happy Path)

- [ ] T013 [P] [US1] Write integration test for successful login in `backend/tests/integration/auth.login.test.js` covering: valid credentials → HTTP 200 + JWT cookie + user data
- [ ] T014 [P] [US1] Write integration test for JWT cookie attributes in `backend/tests/integration/auth.login.test.js` verifying: httpOnly=true, secure flag, sameSite=lax, maxAge=604800
- [ ] T015 [P] [US1] Write unit test for loginService() happy path in `backend/tests/unit/auth.service.test.js` mocking repository calls

### Implementation for User Story 1

- [ ] T016 [US1] Implement loginService() in `backend/src/services/auth.service.js` with: email normalization → find user → verify password → check is_active → generate JWT with jti → upsert session → reset login attempts → return user (without password_hash)
- [ ] T017 [US1] Implement auth controller login endpoint in `backend/src/controllers/auth.controller.js` that: extracts email/password → calls loginService() → sets HttpOnly cookie with JWT via setTokenToCookie → returns successResponse with user data
- [ ] T018 [US1] Mount auth routes in `backend/src/app.js` to register POST /api/v1/auth/login with validateLogin middleware and authController.login handler
- [ ] T019 [US1] Create frontend authContext in `frontend/src/contexts/authContext.context.js` with: user state, loading state, login() function, logout() function, updateUser() function, initializeUser() function, role helpers (isVolunteer, isStaff, isManager, isAdmin), roleId, roleName
- [ ] T020 [US1] Create useAuth hook co-located in `frontend/src/contexts/authContext.context.js` that consumes AuthContext and throws error if used outside AuthProvider
- [ ] T021 [US1] Create authService functions in `frontend/src/services/auth.service.js` with login(email, password), logout(), forgotPassword(email), changePassword(data) calling backend API via axios
- [ ] T022 [US1] Create LoginPage component in `frontend/src/components/pages/LoginPage.jsx` with: form inputs (email, password) using react-hook-form → loading state on button → call login() via authService → setUser on success → navigate by role_id → show toast.warning / toast.error on failure
- [ ] T023 [US1] Verify frontend axios client in `frontend/src/api/axiosApi.js` has `withCredentials: true` and response interceptor handles: 401 → redirect to /login, 403 → redirect to role home, 500 → console.error log
- [ ] T024 [US1] Wrap frontend App in AuthProvider in `frontend/src/index.js` or `frontend/src/App.js`
- [ ] T024b [NEW] [P] [US1] Create role constants in `frontend/src/constants/roles.js` with ROLES object (VOLUNTEER, STAFF, MANAGER, ADMIN) and roleRouteMap mapping each role to its default page route
- [ ] T024c [NEW] [P] [US1] Create GuestRoute guard in `frontend/src/components/guards/GuestRoute.jsx` that redirects authenticated users to role home (use roleRouteMap from constants/roles.js)
- [ ] T024d [NEW] [P] [US1] Create ProtectedRoute guard in `frontend/src/components/guards/ProtectedRoute.jsx` that redirects unauthenticated users to /login
- [ ] T024e [NEW] [P] [US1] Create userService in `frontend/src/services/user.service.js` with getMe() function for auth state initialization (calls GET /api/v1/auth/me)

**Checkpoint**: User Story 1 complete - verify successful login, JWT cookie presence, correct user data in response

---

## Phase 4: User Story 2 - Chặn đăng nhập với thông tin sai (Priority: P1)

**Goal**: System rejects invalid credentials with HTTP 401 and generic error message that doesn''t reveal email existence

**Independent Test**:

- Call POST /api/v1/auth/login with non-existent email → HTTP 401 "Email hoặc mật khẩu chưa chính xác"
- Call POST /api/v1/auth/login with correct email but wrong password → HTTP 401 same message
- Verify both scenarios return identical error message

### Tests for User Story 2 (Security & Error Handling)

- [ ] T025 [P] [US2] Write integration test for non-existent email in `backend/tests/integration/auth.login.test.js` verifying: HTTP 401 + generic message (no email existence leak)
- [ ] T026 [P] [US2] Write integration test for wrong password in `backend/tests/integration/auth.login.test.js` verifying: HTTP 401 + same generic message
- [ ] T027 [P] [US2] Write integration test for invalid email format in `backend/tests/integration/auth.login.test.js` verifying: HTTP 400 validation error
- [ ] T028 [P] [US2] Write integration test that response doesn''t contain password_hash in `backend/tests/integration/auth.login.test.js`
- [ ] T029 [P] [US2] Write unit test for loginService() handling non-existent user in `backend/tests/unit/auth.service.test.js`
- [ ] T030 [P] [US2] Write unit test for loginService() handling password mismatch in `backend/tests/unit/auth.service.test.js`

### Implementation for User Story 2

- [ ] T031 [US2] Create validate middleware in `backend/src/validators/validate.js` using safeParse pattern: Zod schema → safeParse → if error return 400 with stripped error details → if success call next() with parsed body in req.body
- [ ] T032 [US2] Update loginService() in `backend/src/services/auth.service.js` to handle non-existent user: increment attempts then throw 401 "Email hoặc mật khẩu chưa chính xác"
- [ ] T033 [US2] Update loginService() in `backend/src/services/auth.service.js` to handle password mismatch: increment attempts then throw 401 with same generic message
- [ ] T034 [US2] Ensure response.util.js errorResponse() in `backend/src/utils/response.util.js` returns consistent error format without sensitive data
- [ ] T035 [US2] Add logging to loginService() in `backend/src/services/auth.service.js` using Pino logger (DO NOT log plaintext password, password_hash, or token)
- [ ] T036 [US2] Update frontend LoginPage in `frontend/src/components/pages/LoginPage.jsx` to display error toast: check error.code for `ACCOUNT_LOCKED` → toast.warning, other errors → toast.error with message from error.response?.data?.error

**Checkpoint**: User Story 2 complete - verify invalid credentials rejected with HTTP 401 and generic message

---

## Phase 5: User Story 3 - Account Lockout sau nhiều lần đăng nhập sai (Priority: P1)

**Goal**: After 5 failed login attempts, account is locked for 15 minutes. User cannot login even with correct password during lockout period

**Independent Test**:

- Attempt login 5 times with wrong password → 5th attempt returns HTTP 429 "Tài khoản tạm thời bị khóa..."
- With locked account, attempt login with correct password → HTTP 429 (still locked)
- After 15 minutes, attempt login with correct password → HTTP 200 (auto-unlocked)

### Tests for User Story 3 (Account Lockout)

- [ ] T037 [P] [US3] Write integration test for 5 failed attempts triggering lockout in `backend/tests/integration/auth.lockout.test.js` verifying: 5th attempt → HTTP 429 + locked_until timestamp
- [ ] T038 [P] [US3] Write integration test for login blocked during lockout period in `backend/tests/integration/auth.lockout.test.js` verifying: even correct password → HTTP 429
- [ ] T039 [P] [US3] Write integration test for auto-unlock after 15 minutes in `backend/tests/integration/auth.lockout.test.js` mocking time advance with jest.useFakeTimers
- [ ] T040 [P] [US3] Write integration test for lockout counter reset on successful login in `backend/tests/integration/auth.lockout.test.js` verifying: 3 failed attempts → 1 success → attempts reset to 0
- [ ] T041 [P] [US3] Write unit test for login attempt counter logic in `backend/tests/unit/auth.service.test.js`

### Implementation for User Story 3

- [ ] T042 [US3] Update loginService() in `backend/src/services/auth.service.js` to check lockout status: if locked_until > NOW() throw 429 "Tài khoản tạm thời bị khóa..." with locked_until in response
- [ ] T043 [US3] Update incrementLoginAttempts() in `backend/src/repositories/auth.repository.js` to: increment attempts → if attempts >= 5 set locked_until = NOW() + 15 minutes
- [ ] T044 [US3] Update loginService() in `backend/src/services/auth.service.js` to call incrementLoginAttempts() on email not found (non-existent email)
- [ ] T045 [US3] Update loginService() in `backend/src/services/auth.service.js` to call incrementLoginAttempts() on password mismatch
- [ ] T046 [US3] Update loginService() in `backend/src/services/auth.service.js` to call resetLoginAttempts() on successful login to delete login_attempts record
- [ ] T047 [US3] Update error handler in `backend/src/controllers/auth.controller.js` to return 429 status code for lockout errors
- [ ] T048 [US3] Update frontend LoginPage in `frontend/src/components/pages/LoginPage.jsx` to handle lockout error: check error.code === `ACCOUNT_LOCKED` → display toast.warning with lockout message and locked_until time

**Checkpoint**: User Story 3 complete - verify account lockout after 5 failed attempts and auto-unlock after 15 minutes

---

## Phase 6: User Story 4 - Single Active Session (Priority: P1)

**Goal**: Each user has only one active session. New login invalidates previous session (jti gets overwritten)

**Independent Test**:

- User A logs in on Device 1 → receives JWT with jti_1
- Same User A logs in on Device 2 → receives JWT with jti_2
- User A tries API call with jti_1 (old token) → HTTP 401 "Phiên đăng nhập không hợp lệ"
- User A tries API call with jti_2 (new token) → HTTP 200 success

### Tests for User Story 4 (Session Management)

- [ ] T049 [P] [US4] Write integration test for concurrent logins overwriting session in `backend/tests/integration/auth.session.test.js` verifying: 2nd login creates new jti, stores in user_sessions with UNIQUE(user_id)
- [ ] T050 [P] [US4] Write integration test for old jti becoming invalid in `backend/tests/integration/auth.session.test.js` verifying: old JWT throws 401 with message "Phiên đăng nhập không hợp lệ"
- [ ] T051 [P] [US4] Write integration test for new jti remaining valid in `backend/tests/integration/auth.session.test.js` verifying: new JWT passes authentication
- [ ] T052 [P] [US4] Write unit test for upsertSession() in `backend/tests/unit/auth.repository.test.js` verifying: UNIQUE constraint overwrites existing session

### Implementation for User Story 4

- [ ] T053 [US4] Create authenticate middleware in `backend/src/middlewares/auth.middleware.js` that: extracts JWT from cookie → verifies signature → extracts jti → queries user_sessions → if jti mismatch OR expiresAt < now → clear cookie + delete expired session + return 401 "Phiên đăng nhập không hợp lệ" → if valid jti → injects req.user (user_id, email, role_id, role_name)
- [ ] T054 [US4] Update loginService() in `backend/src/services/auth.service.js` to generate jti with composite format: `${userId}-${Date.now()}-${crypto.randomUUID()}` and call upsertSession() with user_id, new jti, and expires_at = NOW() + 7 days
- [ ] T055 [US4] Verify upsertSession() in `backend/src/repositories/auth.repository.js` uses Prisma upsert with UNIQUE constraint on user_id to overwrite old jti
- [ ] T056 [US4] Update protected routes (e.g., user profile endpoints) in `backend/src/routes/user.routes.js` to use authenticate middleware
- [ ] T057 [US4] Mount authenticate middleware check for API endpoints that require authentication

**Checkpoint**: User Story 4 complete - verify single active session per user, old tokens invalidated on new login

---

## Phase 7: User Story 5 - Chặn tài khoản bị vô hiệu hóa (Priority: P1)

**Goal**:

- User with is_active=false cannot login (HTTP 403 "Tài khoản đã bị vô hiệu hóa")
- User with email_verified=false cannot login (HTTP 403 "Email chưa được xác thực")
- If user is disabled after login, subsequent API calls are rejected

### Tests for User Story 5 (Account Status Validation)

- [ ] T058 [P] [US5] Write integration test for disabled account (is_active=false) in `backend/tests/integration/auth.status.test.js` verifying: HTTP 403 "Tài khoản đã bị vô hiệu hóa"
- [ ] T059 [P] [US5] Write integration test for unverified email (email_verified=false) in `backend/tests/integration/auth.status.test.js` verifying: HTTP 403 "Email chưa được xác thực"
- [ ] T060 [P] [US5] Write integration test for account disabled after login in `backend/tests/integration/auth.status.test.js` verifying: set is_active=false in DB → next protected API call → HTTP 403
- [ ] T061 [P] [US5] Write unit test for is_active and email_verified checks in loginService() in `backend/tests/unit/auth.service.test.js`

### Implementation for User Story 5

- [ ] T062 [US5] Update loginService() in `backend/src/services/auth.service.js` to check is_active after password verification: if false throw 403 "Tài khoản đã bị vô hiệu hóa"
- [ ] T063 [US5] Update loginService() in `backend/src/services/auth.service.js` to check email_verified after is_active check: if false throw 403 "Email chưa được xác thực. Vui lòng kiểm tra hộp thư để xác thực tài khoản."
- [ ] T064 [US5] Update error handler in `backend/src/controllers/auth.controller.js` to return 403 status code for account disabled/unverified errors
- [ ] T065 [US5] — NOTE: Middleware does NOT re-check is_active/email_verified yet Update authenticate middleware in `backend/src/middlewares/auth.middleware.js` to re-check is_active and email_verified on protected endpoints: if disabled throw 403
- [ ] T066 [US5] Update frontend LoginPage in `frontend/src/components/pages/LoginPage.jsx` to handle HTTP 403 error: check error.code for `ACCOUNT_DISABLED` → display "Tài khoản đã bị vô hiệu hóa", check error.code for `EMAIL_NOT_VERIFIED` → display "Email chưa được xác thực", other 403 → generic message

**Checkpoint**: User Story 5 complete - verify disabled/unverified accounts cannot login or use protected endpoints

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, code quality, and security hardening

- [ ] T067 [P] Add Swagger JSDoc comments to auth routes in `backend/src/routes/auth.routes.js` documenting POST /api/v1/auth/login with: requestBody schema, response codes (200, 400, 401, 403, 429, 500), examples
- [ ] T068 [P] Add comprehensive comments in `backend/src/services/auth.service.js` explaining business logic for each step (lockout check → find user → verify password → check status → generate JWT → session management)
- [ ] T069 [P] Verify all error paths have proper HTTP status codes: 400 (validation), 401 (auth), 403 (disabled), 429 (locked), 500 (server error)
- [ ] T070 [P] Run `npm run lint` in backend directory to check code style
- [ ] T071 [P] Run `npm run lint` in frontend directory to check React/JSX style
- [ ] T072 Run backend tests with `npm test -- backend/tests/` and verify 80%+ coverage on auth.service.js
- [ ] T073 Run integration tests with `npm test -- backend/tests/integration/` covering all 5 user stories
- [ ] T074 Run frontend tests with `npm test -- frontend/tests/` for LoginPage component
- [ ] T075 Update `quickstart.md` to include: setup steps verified, test commands, manual testing checklist
- [ ] T076 Verify response.util.js formats used consistently across all auth endpoints
- [ ] T077 Review and document all environment variables needed in `.env.example`
- [ ] T078 Add security comment in auth.service.js confirming: password NOT logged, password_hash NOT returned, token NOT logged, cookie values NOT logged
- [ ] T079 Manual security test: Verify HttpOnly cookie cannot be accessed via document.cookie in browser console
- [ ] T080 Manual security test: Verify CORS allows credentials only from FRONTEND_ORIGIN

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (each story independently testable)
  - Or sequentially in priority order (all P1)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1** (Đăng nhập thành công): No story dependencies - can start after Foundational
- **US2** (Chặn thông tin sai): Can start after Foundational - enhances US1 error handling
- **US3** (Account Lockout): Can start after Foundational - independent feature
- **US4** (Single Active Session): Can start after Foundational - independent feature
- **US5** (Chặn tài khoản vô hiệu): Can start after Foundational - independent feature

### Within Each User Story

- Tests (marked [P]) can run in parallel with each other
- Implementation tasks follow dependency: Repository → Service → Validator → Controller → Routes → Frontend integration

### Parallel Opportunities

- **Phase 1**: All setup tasks [P] can run in parallel (different .env files)
- **Phase 2**: T007, T008 [P] (utilities), T009-T010 [P] (middleware) can run in parallel
- **Phase 3+**: All [P] marked tests can run in parallel within each story
- **Across Stories**: Once Phase 2 completes, all 5 user stories can start in parallel by different developers

---

## Parallel Example: User Story 1

```bash
# Parallel test writing (all [P] marked):
T013: integration test - successful login
T014: integration test - JWT cookie attributes
T015: unit test - loginService() happy path

# Parallel implementation (after tests pass):
T016: loginService() implementation
T019: authContext implementation
T021: authService implementation
(These have no cross-dependencies and different files)

# Sequential for integration (depends on above):
T022: LoginPage component (depends on T016, T019, T021, T024b)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (database, environment)
2. Complete Phase 2: Foundational (schema, seed, utilities)
3. Complete Phase 3: User Story 1 (happy path login)
4. **STOP and VALIDATE**: Test successful login, verify JWT cookie, correct user data
5. Demo to stakeholders if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Demo (MVP!)
3. Add User Story 2 → Test error handling → Demo
4. Add User Story 3 → Test lockout → Demo
5. Add User Story 4 → Test session management → Demo
6. Add User Story 5 → Test account status → Demo
7. Complete Polish & documentation

### Parallel Team Strategy (for 3-5 developers)

1. All team: Setup + Foundational together (T001-T012)
2. Once Foundational complete:
   - Developer A: User Story 1 + tests (T013-T024)
   - Developer B: User Story 2 + tests (T025-T036)
   - Developer C: User Story 3 + tests (T037-T048)
   - Developer D: User Story 4 + tests (T049-T057)
   - Developer E: User Story 5 + tests (T058-T066)
3. Parallel code review → all stories integrate independently
4. Final: All team on Polish (T067-T080)

---

## Notes

- [P] tasks = different files or independent operations, can run in parallel
- [Story] label (US1-US5) maps task to specific user story for traceability
- Each user story is independently completable and testable
- Verify tests FAIL before implementing (TDD approach)
- Commit after each Phase completion or logical group
- Stop at any Phase checkpoint to validate story independently
- All 5 user stories (US1-US5) are Priority P1 - all represent MVP scope
- Security testing in Phase 8 is critical before production

---

**Total Tasks**: 85 tasks across 8 phases

- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 8 tasks
- Phase 3 (US1): 17 tasks (tests + implementation)
- Phase 4 (US2): 6 tasks (tests + implementation)
- Phase 5 (US3): 7 tasks (tests + implementation)
- Phase 6 (US4): 5 tasks (tests + implementation)
- Phase 7 (US5): 5 tasks (tests + implementation)
- Phase 8 (Polish): 14 tasks

**Independent Test Criteria**:

- US1: Successful login with valid credentials → HTTP 200 + JWT cookie + user data
- US2: Invalid credentials → HTTP 401 generic message (no email leak)
- US3: 5 failed attempts → account locked 15 min → auto-unlock
- US4: New login overwrites old session → old token becomes invalid
- US5: Disabled/unverified accounts cannot login → HTTP 403

**Suggested MVP Scope**: Complete Phase 1 + Phase 2 + Phase 3 (US1 only) for minimum viable login feature

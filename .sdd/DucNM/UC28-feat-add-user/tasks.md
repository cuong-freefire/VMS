# Tasks: Add User (UC28)

**Input**: Design documents từ `.sdd/DucNM/UC28-feat-add-user/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2, US3)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths điều chỉnh theo plan.md structure — kế thừa infrastructure từ UC26/UC27

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Mở rộng infrastructure đã có từ UC26/UC27 cho UC28

- [ ] T001 Thêm `createUserSchema` (Zod) trong `backend/src/validators/user.validator.js` — fields: full_name, email, phone (optional), password (min 8), role_id

---

## Phase 2: User Story 1 - Admin tạo tài khoản mới thành công (Priority: P1) 🎯 MVP

**Goal**: Admin có thể gọi `POST /api/v1/users` với dữ liệu hợp lệ và nhận HTTP 201 cùng thông tin user mới (không bao gồm password).

**Independent Test**: Gọi `POST /api/v1/users` với body hợp lệ và token Admin, kiểm tra response trả về 201 Created cùng thông tin user mới.

### Tests cho User Story 1 ⚠️

- [ ] T002 [P] [US1] Unit test cho `user.service.js` — `createUser` với dữ liệu hợp lệ → trả về user mới (không password) trong `backend/tests/user/user.service.test.js`
- [ ] T003 [P] [US1] Unit test cho `user.service.js` — `createUser` với email đã tồn tại → throw ServiceError 409 `EMAIL_EXISTS`
- [ ] T004 [P] [US1] Unit test cho `user.service.js` — `createUser` với role_id không tồn tại → throw ServiceError 400 `INVALID_ROLE`
- [ ] T005 [P] [US1] Integration test cho `POST /api/v1/users` — happy path với Admin token → HTTP 201 trong `backend/tests/user/user.api.test.js`
- [ ] T006 [US1] Integration test cho `POST /api/v1/users` — email đã tồn tại → HTTP 409

### Implementation cho User Story 1

- [ ] T007 [US1] Implement `findUserByEmail` trong `backend/src/repositories/user.repository.js` — dùng Prisma `findUnique` theo email
- [ ] T008 [US1] Implement `findRoleById` trong `backend/src/repositories/user.repository.js` — dùng Prisma `findUnique` theo role_id
- [ ] T009 [US1] Implement `createUser` trong `backend/src/repositories/user.repository.js` — dùng Prisma `create` với `select` (exclude password)
- [ ] T010 [US1] Implement `createUserService` trong `backend/src/services/user.service.js` — validation → email uniqueness → role check → bcrypt hash → create → transform role name
- [ ] T011 [US1] Implement `createUserHandler` trong `backend/src/controllers/user.controller.js` — gọi service + trả về 201
- [ ] T012 [US1] Thêm route `POST /` trong `backend/src/routes/user.routes.js` — middleware chain: authMiddleware → authorize('ADMIN') → createUserHandler. **Đặt TRƯỚC route GET `/:id` để tránh conflict**.
- [ ] T013 [US1] Thêm Swagger JSDoc cho endpoint `POST /api/v1/users` trong `backend/src/routes/user.routes.js`
- [ ] T014 [US1] Implement frontend API client — thêm `createUser(data)` trong `frontend/src/api/userApi.js`
- [ ] T015 [US1] Implement React hook `useCreateUser` trong `frontend/src/hooks/useCreateUser.js` — quản lý state: loading, error, success
- [ ] T016 [US1] Implement `AddUserPage.jsx` với React Hook Form + Zod resolver trong `frontend/src/components/pages/AddUserPage.jsx`
- [ ] T017 [US1] Thêm route `/users/add` trong `frontend/src/App.js` — dẫn đến AddUserPage

**Checkpoint**: User Story 1 hoàn thành — Admin có thể tạo user mới thành công.

---

## Phase 3: User Story 2 - Validate dữ liệu đầu vào (Priority: P1)

**Goal**: Hệ thống kiểm tra tính hợp lệ của dữ liệu đầu vào trước khi tạo user — email format, password >= 8 ký tự, full_name không empty.

**Independent Test**: Gọi `POST /api/v1/users` với dữ liệu không hợp lệ (email sai format, mật khẩu ngắn), kiểm tra response trả về HTTP 400 với validation details.

### Tests cho User Story 2 ⚠️

- [ ] T018 [P] [US2] Unit test cho `user.service.js` — `createUser` với email sai format → throw ServiceError 400 `VALIDATION_ERROR` trong `backend/tests/user/user.service.test.js`
- [ ] T019 [P] [US2] Unit test cho `user.service.js` — `createUser` với password < 8 ký tự → throw ServiceError 400 `VALIDATION_ERROR`
- [ ] T020 [P] [US2] Unit test cho `user.service.js` — `createUser` với full_name empty → throw ServiceError 400 `VALIDATION_ERROR`
- [ ] T021 [US2] Integration test cho `POST /api/v1/users` — email sai format → HTTP 400 trong `backend/tests/user/user.api.test.js`
- [ ] T022 [US2] Integration test cho `POST /api/v1/users` — password ngắn → HTTP 400
- [ ] T023 [US2] Integration test cho `POST /api/v1/users` — thiếu full_name → HTTP 400

### Implementation cho User Story 2

- [ ] T024 [US2] Zod schema `createUserSchema` đã implement ở T001 — validation tự động từ Zod safeParse
- [ ] T025 [US2] Frontend: Validation đồng bộ với React Hook Form + Zod resolver trong `AddUserPage.jsx` — hiển thị error message dưới từng field
- [ ] T026 [US2] Frontend: Hiển thị validation error details từ backend response (khi có lỗi server-side)

**Checkpoint**: User Story 2 hoàn thành — Validation hoạt động cả FE và BE.

---

## Phase 4: User Story 3 - Chặn truy cập với người dùng không có quyền (Priority: P1)

**Goal**: Staff, Manager, Volunteer nhận 403 Forbidden; Guest nhận 401 Unauthorized khi gọi `POST /api/v1/users`.

**Independent Test**: Gọi `POST /api/v1/users` với token Staff/Manager/Volunteer → 403. Gọi không token → 401.

### Tests cho User Story 3 ⚠️

- [ ] T027 [P] [US3] Integration test cho `POST /api/v1/users` — Staff token → HTTP 403 trong `backend/tests/user/user.api.test.js`
- [ ] T028 [P] [US3] Integration test cho `POST /api/v1/users` — Manager token → HTTP 403
- [ ] T029 [P] [US3] Integration test cho `POST /api/v1/users` — Volunteer token → HTTP 403
- [ ] T030 [US3] Integration test cho `POST /api/v1/users` — không token → HTTP 401
- [ ] T031 [US3] Integration test cho `POST /api/v1/users` — token hết hạn → HTTP 401

### Implementation cho User Story 3

- [ ] T032 [US3] Middleware chain đã implement ở T012 — `authorize('ADMIN')` xử lý 403, `authMiddleware` xử lý 401. **(Không cần code mới — verify authorize middleware từ UC26 đã đủ)**

**Checkpoint**: User Story 3 hoàn thành — endpoint được bảo vệ đúng phân quyền.

---

## Phase 5: Edge Cases & Password Security

**Purpose**: Xử lý các edge case và đảm bảo password security

- [ ] T033 [P] Integration test — `POST /api/v1/users` với role_id không tồn tại → HTTP 400 trong `backend/tests/user/user.api.test.js`
- [ ] T034 [P] Integration test — `POST /api/v1/users` với request body rỗng → HTTP 400
- [ ] T035 [P] Integration test — database không phản hồi → HTTP 500
- [ ] T036 [P] Unit test — Verify password được hash (không plain text) trong database
- [ ] T037 [P] Unit test — Verify response không bao gồm password field
- [ ] T038 Frontend test — AddUserPage render form correctly trong `frontend/tests/AddUserPage.test.jsx`
- [ ] T039 Frontend test — AddUserPage hiển thị validation errors
- [ ] T040 Frontend test — AddUserPage hiển thị success message sau khi tạo thành công

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 — có thể chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên T001 + infrastructure UC26/UC27 (authorize middleware, user.repository pattern)
- **User Story 2 (Phase 3)**: Depends trên T001 (Zod schema) + T010 (service validation logic)
- **User Story 3 (Phase 4)**: Depends trên T012 (middleware chain)
- **Edge Cases (Phase 5)**: Depends trên Phase 2 và Phase 3 hoàn thành

### User Story Dependencies

- **User Story 1 (P1)**: MVP — bắt đầu ngay sau Setup
- **User Story 2 (P1)**: Có thể chạy song song với US1 (validation logic trong service)
- **User Story 3 (P1)**: Có thể chạy song song với US1 (tests khác files)
- **Edge Cases**: Sau khi tất cả user stories hoàn thành

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T002, T003, T004 | Tests cho US1 — viết song song |
| T007, T008, T009 | Repository methods — khác functions, cùng file |
| T014, T015, T016 | Frontend API, hook, component — sequential (phụ thuộc nhau) |
| T018-T023 | Tests cho US2 — chạy song song |
| T027-T031 | Tests cho US3 — chạy song song |
| US1 (T007-T017) + US3 (T032) | Song song — middleware đã có, chỉ cần verify |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001) → Zod schema ready
2. **Phase 2**: User Story 1 (T002-T017) → **MVP!** Admin tạo được user mới
3. **Phase 3**: User Story 2 (T018-T026) → Validation (chạy song song với Phase 2)
4. **Phase 4**: User Story 3 (T027-T032) → Phân quyền (chạy song song với Phase 2)
5. **Phase 5**: Edge cases + password security tests
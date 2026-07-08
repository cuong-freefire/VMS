# Tasks: View User Detail (UC27)

**Input**: Design documents từ `.sdd/DucNM/UC27-feat-view-user-detail/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths điều chỉnh theo plan.md structure — kế thừa infrastructure từ UC26

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Mở rộng infrastructure đã có từ UC26 cho UC27

- [ ] T001 Thêm validation schema cho user ID param trong `backend/src/validators/user.validator.js` — `userIdSchema` với Zod `coerce.number().int().positive()`

---

## Phase 2: User Story 1 - Admin xem chi tiết người dùng (Priority: P1) 🎯 MVP

**Goal**: Admin có thể gọi `GET /api/v1/users/:id` và nhận thông tin chi tiết của một user cụ thể.

**Independent Test**: Tạo một user trong database, gọi `GET /api/v1/users/1` với token Admin, kiểm tra response trả về đầy đủ thông tin: user_id, full_name, email, phone, avatar_url, role, is_active, created_at, updated_at.

### Tests cho User Story 1 ⚠️

- [ ] T002 [P] [US1] Unit test cho `user.service.js` — `getUserById` với ID hợp lệ trả về user detail trong `backend/tests/user/user.service.test.js`
- [ ] T003 [P] [US1] Unit test cho `user.service.js` — `getUserById` với ID không tồn tại → throw ServiceError 404 `USER_NOT_FOUND`
- [ ] T004 [P] [US1] Unit test cho `user.service.js` — `getUserById` với ID không hợp lệ (string, số âm) → throw ServiceError 400 `INVALID_USER_ID`
- [ ] T005 [P] [US1] Integration test cho `GET /api/v1/users/:id` — happy path với Admin token trong `backend/tests/user/user.api.test.js`
- [ ] T006 [US1] Integration test cho `GET /api/v1/users/:id` — user ID không tồn tại → HTTP 404

### Implementation cho User Story 1

- [ ] T007 [US1] Implement `findUserById` trong `backend/src/repositories/user.repository.js` — dùng Prisma `findUnique` với `select` fields + `include role`
- [ ] T008 [US1] Implement `getUserById` trong `backend/src/services/user.service.js` — validation userId + gọi repository + 404 handling
- [ ] T009 [US1] Implement `getUserByIdHandler` trong `backend/src/controllers/user.controller.js` — gọi service + trả về response chuẩn ADR-006
- [ ] T010 [US1] Thêm route `GET /:id` trong `backend/src/routes/user.routes.js` — middleware chain: authMiddleware → authorize('ADMIN') → getUserByIdHandler. **Đặt sau route `/` để tránh conflict**.
- [ ] T011 [US1] Thêm Swagger JSDoc cho endpoint `GET /api/v1/users/:id` trong `backend/src/routes/user.routes.js`
- [ ] T012 [US1] Implement frontend API client — thêm `getUserById(id)` trong `frontend/src/api/userApi.js`
- [ ] T013 [US1] Implement React hook `useUserDetail` trong `frontend/src/hooks/useUserDetail.js` — quản lý state: user, loading, error, notFound
- [ ] T014 [US1] Implement `UserDetailPage.jsx` với MUI Paper + Table layout trong `frontend/src/components/pages/UserDetailPage.jsx`
- [ ] T015 [US1] Thêm route `/users/:id` trong `frontend/src/App.js` — dẫn đến UserDetailPage

**Checkpoint**: User Story 1 hoàn thành — Admin có thể xem chi tiết user thành công.

---

## Phase 3: User Story 2 - Chặn truy cập với người dùng không có quyền (Priority: P1)

**Goal**: Staff, Manager, Volunteer nhận 403 Forbidden; Guest nhận 401 Unauthorized khi truy cập `GET /api/v1/users/:id`.

**Independent Test**: Gọi `GET /api/v1/users/1` với token Staff/Manager/Volunteer → 403. Gọi không token → 401.

### Tests cho User Story 2 ⚠️

- [ ] T016 [P] [US2] Integration test cho `GET /api/v1/users/:id` — Staff token → HTTP 403 trong `backend/tests/user/user.api.test.js`
- [ ] T017 [P] [US2] Integration test cho `GET /api/v1/users/:id` — Manager token → HTTP 403
- [ ] T018 [P] [US2] Integration test cho `GET /api/v1/users/:id` — Volunteer token → HTTP 403
- [ ] T019 [US2] Integration test cho `GET /api/v1/users/:id` — không token → HTTP 401
- [ ] T020 [US2] Integration test cho `GET /api/v1/users/:id` — token hết hạn → HTTP 401

### Implementation cho User Story 2

- [ ] T021 [US2] Middleware chain đã implement ở T010 — `authorize('ADMIN')` xử lý 403, `authMiddleware` xử lý 401. **(Không cần code mới — verify authorize middleware từ UC26 đã đủ)**
- [ ] T022 [US2] Frontend: Xử lý 404 response trong `useUserDetail.js` — set `notFound = true` khi status 404
- [ ] T023 [US2] Frontend: Xử lý 401 response trong `userApi.js` — redirect về login nếu 401 (nếu chưa có sẵn)

**Checkpoint**: User Story 2 hoàn thành — endpoint được bảo vệ đúng phân quyền.

---

## Phase 4: Edge Cases & Validation

**Purpose**: Xử lý các edge case và hoàn thiện test coverage

- [ ] T024 [P] Integration test — `:id` là string không phải số (`/users/abc`) → HTTP 400 trong `backend/tests/user/user.api.test.js`
- [ ] T025 [P] Integration test — `:id` là số âm (`/users/-1`) → HTTP 400
- [ ] T026 [P] Integration test — database không phản hồi → HTTP 500
- [ ] T027 Frontend test — UserDetailPage render loading state trong `frontend/tests/UserDetailPage.test.jsx`
- [ ] T028 Frontend test — UserDetailPage render 404 state (user not found)
- [ ] T029 Frontend test — UserDetailPage render error state
- [ ] T030 Frontend test — UserDetailPage render user data correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 — có thể chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên T001 + infrastructure UC26 (authorize middleware, user.repository pattern)
- **User Story 2 (Phase 3)**: Depends trên T010 (middleware chain đã implement)
- **Edge Cases (Phase 4)**: Depends trên Phase 2 và Phase 3 hoàn thành

### User Story Dependencies

- **User Story 1 (P1)**: MVP — bắt đầu ngay sau Setup
- **User Story 2 (P1)**: Có thể chạy song song với US1 (tests khác files)
- **Edge Cases**: Sau khi tất cả user stories hoàn thành

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T002, T003, T004 | Tests cho US1 — viết song song |
| T007, T008 | Repository vs Service — khác files |
| T012, T013, T014 | Frontend API, hook, component — sequential (phụ thuộc nhau) |
| T016-T020 | Tests cho US2 — chạy song song |
| US1 (T007-T015) + US2 (T021-T023) | Song song — backend middleware đã có, chỉ cần verify |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001) → Validation schema ready
2. **Phase 2**: User Story 1 (T002-T015) → **MVP!** Admin xem được chi tiết user
3. **Phase 3**: User Story 2 (T016-T023) → Phân quyền (chạy song song với Phase 2)
4. **Phase 4**: Edge cases + tests hoàn thiện
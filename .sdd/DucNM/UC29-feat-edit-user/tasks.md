# Tasks: Edit User (UC29)

**Input**: Design documents từ `.sdd/DucNM/UC29-feat-edit-user/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2, US3, US4)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths điều chỉnh theo plan.md structure — kế thừa infrastructure từ UC26-UC28

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Mở rộng infrastructure đã có từ UC26-UC28 cho UC29

- [ ] T001 Thêm `updateUserSchema` (Zod) trong `backend/src/validators/user.validator.js` — fields optional: full_name, phone, avatar_url, role_id, is_active. `.refine()` kiểm tra body không rỗng.

---

## Phase 2: User Story 1 - Admin chỉnh sửa thông tin user thành công (Priority: P1) 🎯 MVP

**Goal**: Admin có thể gọi `PATCH /api/v1/users/:id` và cập nhật thông tin user (full_name, phone, avatar_url, role_id, is_active).

**Independent Test**: Tạo user trong database, gọi `PATCH /api/v1/users/1` với body hợp lệ và token Admin, kiểm tra response 200 + thông tin đã cập nhật.

### Tests cho User Story 1 ⚠️

- [ ] T002 [P] [US1] Unit test cho `user.service.js` — `updateUser` với dữ liệu hợp lệ → trả về user đã cập nhật trong `backend/tests/user/user.service.test.js`
- [ ] T003 [P] [US1] Unit test cho `user.service.js` — `updateUser` với user ID không tồn tại → throw ServiceError 404 `USER_NOT_FOUND`
- [ ] T004 [P] [US1] Unit test cho `user.service.js` — `updateUser` chỉ update `is_active` → thành công
- [ ] T005 [P] [US1] Integration test cho `PATCH /api/v1/users/:id` — happy path với Admin token → HTTP 200 trong `backend/tests/user/user.api.test.js`
- [ ] T006 [US1] Integration test cho `PATCH /api/v1/users/:id` — update `is_active` từ true → false

### Implementation cho User Story 1

- [ ] T007 [US1] Implement `updateUser` trong `backend/src/repositories/user.repository.js` — dùng Prisma `update` với `select` (exclude password)
- [ ] T008 [US1] Cập nhật `findUserById` trong repository — thêm `role_id` vào select để phục vụ self-role check
- [ ] T009 [US1] Implement `updateUserService` trong `backend/src/services/user.service.js` — validation → check user exists → check self-role → check role tồn tại → update → transform
- [ ] T010 [US1] Implement `updateUserHandler` trong `backend/src/controllers/user.controller.js` — gọi service + trả về 200
- [ ] T011 [US1] Thêm route `PATCH /:id` trong `backend/src/routes/user.routes.js` — middleware chain: authMiddleware → authorize('ADMIN') → updateUserHandler
- [ ] T012 [US1] Thêm Swagger JSDoc cho endpoint `PATCH /api/v1/users/:id` trong `backend/src/routes/user.routes.js`
- [ ] T013 [US1] Implement frontend API client — thêm `updateUser(id, data)` trong `frontend/src/api/userApi.js`
- [ ] T014 [US1] Implement React hook `useUpdateUser` trong `frontend/src/hooks/useUpdateUser.js` — quản lý state: loading, error, success
- [ ] T015 [US1] Implement `EditUserPage.jsx` trong `frontend/src/components/pages/EditUserPage.jsx` — fetch user → pre-fill form → edit → PATCH submit
- [ ] T016 [US1] Thêm route `/users/:id/edit` trong `frontend/src/App.js` — dẫn đến EditUserPage

**Checkpoint**: User Story 1 hoàn thành — Admin có thể chỉnh sửa user thành công.

---

## Phase 3: User Story 2 - Admin không thể tự hạ role của chính mình (Priority: P1)

**Goal**: Admin không thể tự hạ role của chính mình xuống thấp hơn. Nếu cố tình, trả về HTTP 403.

**Independent Test**: Gọi `PATCH /api/v1/users/{selfId}` với body chứa role_id thấp hơn và token của chính Admin đó, kiểm tra 403.

### Tests cho User Story 2 ⚠️

- [ ] T017 [P] [US2] Unit test cho `user.service.js` — `updateUser` tự hạ role → throw ServiceError 403 `SELF_ROLE_DOWNGRADE` trong `backend/tests/user/user.service.test.js`
- [ ] T018 [US2] Integration test cho `PATCH /api/v1/users/{selfId}` — tự hạ role → HTTP 403

### Implementation cho User Story 2

- [ ] T019 [US2] Self-role-downgrade check đã implement ở T009 — so sánh `currentUser.user_id === userId` và `new_role_id < current_role_id`

**Checkpoint**: User Story 2 hoàn thành — Admin không thể tự hạ role.

---

## Phase 4: User Story 3 - Validate dữ liệu đầu vào (Priority: P2)

**Goal**: Hệ thống kiểm tra tính hợp lệ — không cho body rỗng, validate từng field nếu có.

**Independent Test**: Gọi `PATCH /api/v1/users/1` với body rỗng → 400. Gọi với role_id không tồn tại → 400.

### Tests cho User Story 3 ⚠️

- [ ] T020 [P] [US3] Unit test cho `user.service.js` — `updateUser` với body rỗng → throw ServiceError 400 `NO_FIELDS_TO_UPDATE` trong `backend/tests/user/user.service.test.js`
- [ ] T021 [P] [US3] Unit test cho `user.service.js` — `updateUser` với role_id không tồn tại → throw ServiceError 400 `INVALID_ROLE`
- [ ] T022 [US3] Integration test cho `PATCH /api/v1/users/1` — body rỗng → HTTP 400
- [ ] T023 [US3] Integration test cho `PATCH /api/v1/users/1` — role_id không tồn tại → HTTP 400

### Implementation cho User Story 3

- [ ] T024 [US3] Zod schema `updateUserSchema` đã implement ở T001 với `.refine()` kiểm tra body không rỗng
- [ ] T025 [US3] Role existence check đã implement ở T009

**Checkpoint**: User Story 3 hoàn thành — Validation hoạt động.

---

## Phase 5: User Story 4 - Chặn truy cập với người dùng không có quyền (Priority: P1)

**Goal**: Staff, Manager, Volunteer nhận 403; Guest nhận 401 khi gọi `PATCH /api/v1/users/:id`.

**Independent Test**: Gọi `PATCH /api/v1/users/1` với token Staff → 403. Không token → 401.

### Tests cho User Story 4 ⚠️

- [ ] T026 [P] [US4] Integration test — Staff token → HTTP 403 trong `backend/tests/user/user.api.test.js`
- [ ] T027 [P] [US4] Integration test — Manager token → HTTP 403
- [ ] T028 [P] [US4] Integration test — Volunteer token → HTTP 403
- [ ] T029 [US4] Integration test — không token → HTTP 401
- [ ] T030 [US4] Integration test — token hết hạn → HTTP 401

### Implementation cho User Story 4

- [ ] T031 [US4] Middleware chain đã implement ở T011 — `authorize('ADMIN')` xử lý 403, `authMiddleware` xử lý 401. **(Không cần code mới)**

**Checkpoint**: User Story 4 hoàn thành — endpoint được bảo vệ đúng phân quyền.

---

## Phase 6: Edge Cases & Validation

**Purpose**: Xử lý các edge case và hoàn thiện test coverage

- [ ] T032 [P] Integration test — `PATCH /api/v1/users/abc` (ID không hợp lệ) → HTTP 400
- [ ] T033 [P] Integration test — database không phản hồi → HTTP 500
- [ ] T034 [P] Unit test — Verify response không bao gồm password field
- [ ] T035 Frontend test — EditUserPage render loading state trong `frontend/tests/EditUserPage.test.jsx`
- [ ] T036 Frontend test — EditUserPage render form với pre-filled data
- [ ] T037 Frontend test — EditUserPage hiển thị validation errors
- [ ] T038 Frontend test — EditUserPage hiển thị success message sau khi update

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 — có thể chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên T001 + infrastructure UC26-UC28
- **User Story 2 (Phase 3)**: Depends trên T009 (self-role check trong service)
- **User Story 3 (Phase 4)**: Depends trên T001 (Zod schema) + T009 (role validation)
- **User Story 4 (Phase 5)**: Depends trên T011 (middleware chain)
- **Edge Cases (Phase 6)**: Depends trên Phase 2-5

### User Story Dependencies

- **User Story 1 (P1)**: MVP — bắt đầu ngay sau Setup
- **User Story 2 (P1)**: Logic nằm trong US1 service — implement cùng nhau
- **User Story 3 (P2)**: Validation trong schema + service — implement cùng US1
- **User Story 4 (P1)**: Middleware chain — implement cùng T011

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T002, T003, T004 | Tests cho US1 — viết song song |
| T007, T008 | Repository — khác functions |
| T013, T014, T015 | Frontend API, hook, component — sequential |
| T020, T021 | Tests cho US3 — viết song song |
| T026-T030 | Tests cho US4 — chạy song song |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001) → Zod schema ready
2. **Phase 2+3+4**: User Story 1+2+3 (T002-T025) → **MVP!** Admin edit được user + self-role protection + validation
3. **Phase 5**: User Story 4 (T026-T031) → Phân quyền
4. **Phase 6**: Edge cases + tests
# Tasks: Add Skill (UC35)

**Input**: Design documents từ `.sdd/DucNM/UC35-feat-add-skill/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2, US3)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Kế thừa infrastructure từ UC34 (Skill model, repository pattern)
- Pattern giống Add Category (UC32)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tạo Zod validation schema cho create skill

- [ ] T001 Tạo `createSkillSchema` (Zod) trong `backend/src/validators/skill.validator.js` — name (min 1), description (optional)

---

## Phase 2: User Story 1 - Manager thêm skill thành công (Priority: P1) 🎯 MVP

**Goal**: Manager/Admin gọi `POST /api/v1/skills` với dữ liệu hợp lệ và nhận HTTP 201 cùng thông tin skill mới.

**Independent Test**: Gọi `POST /api/v1/skills` với body hợp lệ và token Manager, kiểm tra response 201 + skill data.

### Tests cho User Story 1 ⚠️

- [ ] T002 [P] [US1] Unit test cho `skill.service.js` — `createSkill` với dữ liệu hợp lệ → trả về skill mới trong `backend/tests/skill/skill.service.test.js`
- [ ] T003 [P] [US1] Unit test cho `skill.service.js` — `createSkill` với tên đã tồn tại → throw ServiceError 409 `SKILL_EXISTS`
- [ ] T004 [P] [US1] Integration test cho `POST /api/v1/skills` — happy path với Manager token → HTTP 201 trong `backend/tests/skill/skill.api.test.js`
- [ ] T005 [US1] Integration test cho `POST /api/v1/skills` — happy path với Admin token → HTTP 201

### Implementation cho User Story 1

- [ ] T006 [US1] Implement `findSkillByName` trong `backend/src/repositories/skill.repository.js` — dùng Prisma `findUnique` theo name
- [ ] T007 [US1] Implement `createSkill` trong `backend/src/repositories/skill.repository.js` — dùng Prisma `create`
- [ ] T008 [US1] Implement `createSkillService` trong `backend/src/services/skill.service.js` — validation → unique check → create → return
- [ ] T009 [US1] Implement `createSkillHandler` trong `backend/src/controllers/skill.controller.js` — gọi service + trả về 201
- [ ] T010 [US1] Thêm route `POST /` trong `backend/src/routes/skill.routes.js` — middleware chain: authMiddleware → authorize('MANAGER', 'ADMIN') → createSkillHandler
- [ ] T011 [US1] Thêm Swagger JSDoc cho endpoint `POST /api/v1/skills` trong `backend/src/routes/skill.routes.js`

**Checkpoint**: User Story 1 hoàn thành — Manager/Admin tạo được skill mới.

---

## Phase 3: User Story 2 - Validate dữ liệu (Priority: P1)

**Goal**: Hệ thống kiểm tra name không empty — trả về 400 nếu không hợp lệ.

**Independent Test**: Gọi `POST /api/v1/skills` với name empty → 400.

### Tests cho User Story 2 ⚠️

- [ ] T012 [P] [US2] Unit test cho `skill.service.js` — `createSkill` với name empty → throw ServiceError 400 `VALIDATION_ERROR` trong `backend/tests/skill/skill.service.test.js`
- [ ] T013 [P] [US2] Integration test cho `POST /api/v1/skills` — name empty → HTTP 400 trong `backend/tests/skill/skill.api.test.js`

### Implementation cho User Story 2

- [ ] T014 [US2] Zod schema `createSkillSchema` đã implement ở T001 — validation tự động từ Zod safeParse
- [ ] T015 [US2] Frontend: Validation đồng bộ với React Hook Form + Zod resolver trong `AddSkillPage.jsx`

**Checkpoint**: User Story 2 hoàn thành — Validation hoạt động.

---

## Phase 4: User Story 3 - Chặn truy cập với người dùng không có quyền (Priority: P1)

**Goal**: Staff/Volunteer nhận 403, Guest nhận 401 khi gọi `POST /api/v1/skills`.

**Independent Test**: Gọi `POST /api/v1/skills` với token Staff → 403. Không token → 401.

### Tests cho User Story 3 ⚠️

- [ ] T016 [P] [US3] Integration test — Staff token → HTTP 403 trong `backend/tests/skill/skill.api.test.js`
- [ ] T017 [P] [US3] Integration test — Volunteer token → HTTP 403
- [ ] T018 [P] [US3] Integration test — không token → HTTP 401
- [ ] T019 [US3] Integration test — token hết hạn → HTTP 401

### Implementation cho User Story 3

- [ ] T020 [US3] Middleware chain đã implement ở T010 — `authorize('MANAGER', 'ADMIN')` xử lý 403, `authMiddleware` xử lý 401. **(Không cần code mới)**

**Checkpoint**: User Story 3 hoàn thành — endpoint được bảo vệ đúng phân quyền.

---

## Phase 5: Frontend

**Purpose**: Xây dựng giao diện Add Skill form

- [ ] T021 [P] Thêm `createSkill(data)` trong `frontend/src/api/skillApi.js`
- [ ] T022 [P] Implement React hook `useCreateSkill` trong `frontend/src/hooks/useCreateSkill.js` — loading, error, success states
- [ ] T023 Implement `AddSkillPage.jsx` với React Hook Form + Zod resolver trong `frontend/src/components/pages/AddSkillPage.jsx`
- [ ] T024 Thêm route `/skills/add` trong `frontend/src/App.js`

---

## Phase 6: Edge Cases & Tests

**Purpose**: Xử lý các edge case và hoàn thiện test coverage

- [ ] T025 [P] Unit test — database không phản hồi → throw error (catch ở controller → 500)
- [ ] T026 [P] Integration test — `POST /api/v1/skills` với request body rỗng → HTTP 400
- [ ] T027 Frontend test — AddSkillPage render form correctly trong `frontend/tests/AddSkillPage.test.jsx`
- [ ] T028 Frontend test — AddSkillPage hiển thị validation errors
- [ ] T029 Frontend test — AddSkillPage hiển thị success message sau khi tạo thành công

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 — chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên T001 + UC34 infrastructure
- **User Story 2 (Phase 3)**: Depends trên T001 (Zod schema) + T008 (service validation)
- **User Story 3 (Phase 4)**: Depends trên T010 (middleware chain)
- **Frontend (Phase 5)**: Depends trên API hoàn thành
- **Edge Cases (Phase 6)**: Depends trên Phase 2-4

### User Story Dependencies

- **US1 (P1)**: MVP — bắt đầu ngay sau Setup
- **US2 (P1)**: Validation trong service — implement cùng US1
- **US3 (P1)**: Middleware chain — implement cùng T010
- **Frontend**: Sau khi API hoàn thành

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T002, T003 | Tests US1 — viết song song |
| T006, T007 | Repository methods — khác functions |
| T021, T022 | Frontend API + Hook — song song |
| T016-T019 | Tests US3 — chạy song song |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001) → Zod schema ready
2. **Phase 2+3**: US1+US2 (T002-T015) → **MVP!** Manager tạo được skill + validation
3. **Phase 4**: US3 (T016-T020) → Phân quyền
4. **Phase 5**: Frontend (T021-T024) → AddSkill UI
5. **Phase 6**: Edge cases + tests
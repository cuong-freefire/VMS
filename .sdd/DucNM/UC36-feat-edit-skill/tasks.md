# Tasks: Edit Skill (UC36)

**Input**: Design documents từ `.sdd/DucNM/UC36-feat-edit-skill/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2, US3)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Kế thừa infrastructure từ UC34 (Skill model) và UC35 (validator patterns)
- Pattern tương tự Edit Category (UC33)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Mở rộng infrastructure đã có từ UC34/UC35 cho UC36

- [x] T001 Thêm `updateSkillSchema` (Zod) trong `backend/src/validators/skill.validator.js` — fields optional: name, description, is_active. `.refine()` kiểm tra body không rỗng.

---

## Phase 2: User Story 1 - Manager chỉnh sửa skill thành công (Priority: P1) 🎯 MVP

**Goal**: Manager/Admin gọi `PATCH /api/v1/skills/:id` với dữ liệu hợp lệ và nhận HTTP 200 cùng thông tin đã cập nhật.

**Independent Test**: Tạo skill trong database, gọi `PATCH /api/v1/skills/1` với body hợp lệ và token Manager, kiểm tra response 200 + data đã cập nhật.

### Tests cho User Story 1 ⚠️

- [ ] T002 [P] [US1] Unit test cho `skill.service.js` — `updateSkill` với dữ liệu hợp lệ → trả về skill đã cập nhật trong `backend/tests/skill/skill.service.test.js`
- [ ] T003 [P] [US1] Unit test cho `skill.service.js` — `updateSkill` với ID không tồn tại → throw ServiceError 404 `SKILL_NOT_FOUND`
- [ ] T004 [P] [US1] Unit test cho `skill.service.js` — `updateSkill` chỉ update `is_active` → thành công
- [ ] T005 [P] [US1] Integration test cho `PATCH /api/v1/skills/:id` — happy path với Manager token → HTTP 200 trong `backend/tests/skill/skill.api.test.js`
- [ ] T006 [US1] Integration test cho `PATCH /api/v1/skills/:id` — happy path với Admin token → HTTP 200

### Implementation cho User Story 1

- [x] T007 [US1] Implement `findById` trong `backend/src/repositories/skill.repository.js` — dùng Prisma `findUnique`
- [x] T008 [US1] Implement `findByNameExcluding` trong `backend/src/repositories/skill.repository.js` — dùng Prisma `findFirst` với `NOT`
- [x] T009 [US1] Implement `updateSkill` trong `backend/src/repositories/skill.repository.js` — dùng Prisma `update`
- [x] T010 [US1] Implement `updateSkillService` trong `backend/src/services/skill.service.js` — check exists → check unique name → update → return
- [x] T011 [US1] Implement `updateSkillHandler` trong `backend/src/controllers/skill.controller.js` — gọi service + trả về 200
- [x] T012 [US1] Thêm route `PATCH /:id` trong `backend/src/routes/skill.routes.js` — middleware chain: authMiddleware → authorize('MANAGER', 'ADMIN') → validate(updateSkillSchema) → updateSkillHandler
- [x] T013 [US1] Thêm Swagger JSDoc cho endpoint `PATCH /api/v1/skills/:id` trong `backend/src/routes/skill.routes.js`

**Checkpoint**: User Story 1 hoàn thành — Manager/Admin chỉnh sửa skill thành công.

---

## Phase 3: User Story 2 - Validate dữ liệu (Priority: P2)

**Goal**: Hệ thống kiểm tra tên unique khi đổi tên — trả về 409 nếu trùng.

**Independent Test**: Gọi `PATCH /api/v1/skills/1` với tên đã tồn tại → 409.

### Tests cho User Story 2 ⚠️

- [ ] T014 [P] [US2] Unit test cho `skill.service.js` — `updateSkill` với tên trùng → throw ServiceError 409 `SKILL_EXISTS` trong `backend/tests/skill/skill.service.test.js`
- [ ] T015 [P] [US2] Integration test cho `PATCH /api/v1/skills/:id` — tên trùng → HTTP 409 trong `backend/tests/skill/skill.api.test.js`
- [ ] T016 [US2] Integration test cho `PATCH /api/v1/skills/:id` — body rỗng → HTTP 400

### Implementation cho User Story 2

- [x] T017 [US2] Zod schema `updateSkillSchema` đã implement ở T001 với `.refine()` kiểm tra body không rỗng
- [x] T018 [US2] Unique name check đã implement ở T010 — kiểm tra `name !== existing.name` và `findByNameExcluding` với excludeId

**Checkpoint**: User Story 2 hoàn thành — Validation hoạt động.

---

## Phase 4: User Story 3 - Chặn truy cập với người dùng không có quyền (Priority: P1)

**Goal**: Staff/Volunteer nhận 403, Guest nhận 401 khi gọi `PATCH /api/v1/skills/:id`.

**Independent Test**: Gọi `PATCH /api/v1/skills/1` với token Staff → 403. Không token → 401.

### Tests cho User Story 3 ⚠️

- [ ] T019 [P] [US3] Integration test — Staff token → HTTP 403 trong `backend/tests/skill/skill.api.test.js`
- [ ] T020 [P] [US3] Integration test — Volunteer token → HTTP 403
- [ ] T021 [P] [US3] Integration test — không token → HTTP 401
- [ ] T022 [US3] Integration test — token hết hạn → HTTP 401

### Implementation cho User Story 3

- [x] T023 [US3] Middleware chain đã implement ở T012 — `authorize('MANAGER', 'ADMIN')` xử lý 403, `authMiddleware` xử lý 401. **(Verify: authorize middleware từ UC26 đã đủ)**

**Checkpoint**: User Story 3 hoàn thành — endpoint được bảo vệ đúng phân quyền.

---

## Phase 5: Frontend

**Purpose**: Xây dựng giao diện Edit Skill form

- [ ] T024 [P] Thêm `updateSkill(id, data)` trong `frontend/src/api/skillApi.js`
- [ ] T025 [P] Implement React hook `useUpdateSkill` trong `frontend/src/hooks/useUpdateSkill.js` — loading, error, success states
- [ ] T026 Implement `EditSkillPage.jsx` trong `frontend/src/components/pages/EditSkillPage.jsx` — fetch skill → pre-fill form → PATCH submit
- [ ] T027 Thêm route `/skills/:id/edit` trong `frontend/src/App.js`

---

## Phase 6: Edge Cases & Tests

**Purpose**: Xử lý các edge case và hoàn thiện test coverage

- [ ] T028 [P] Unit test — database không phản hồi → throw error (catch ở controller → 500)
- [ ] T029 [P] Integration test — `PATCH /api/v1/skills/abc` (ID không hợp lệ) → HTTP 400
- [ ] T030 Frontend test — EditSkillPage render loading state trong `frontend/tests/EditSkillPage.test.jsx`
- [ ] T031 Frontend test — EditSkillPage render form với pre-filled data
- [ ] T032 Frontend test — EditSkillPage hiển thị validation errors
- [ ] T033 Frontend test — EditSkillPage hiển thị success message sau khi update

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 — có thể chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên T001 + infrastructure UC34/UC35
- **User Story 2 (Phase 3)**: Depends trên T001 (Zod schema) + T010 (service unique check)
- **User Story 3 (Phase 4)**: Depends trên T012 (middleware chain)
- **Frontend (Phase 5)**: Depends trên API hoàn thành
- **Edge Cases (Phase 6)**: Depends trên Phase 2-4

### User Story Dependencies

- **US1 (P1)**: MVP — bắt đầu ngay sau Setup
- **US2 (P2)**: Validation trong service — implement cùng US1
- **US3 (P1)**: Middleware chain — implement cùng T012
- **Frontend**: Sau khi API hoàn thành

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T002, T003, T004 | Tests US1 — viết song song |
| T007, T008, T009 | Repository methods — khác functions |
| T024, T025 | Frontend API + Hook — song song |
| T019-T022 | Tests US3 — chạy song song |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001) → Zod schema ready
2. **Phase 2+3**: US1+US2 (T002-T018) → **MVP!** Manager edit được skill + unique name validation
3. **Phase 4**: US3 (T019-T023) → Phân quyền
4. **Phase 5**: Frontend (T024-T027) → EditSkill UI
5. **Phase 6**: Edge cases + tests
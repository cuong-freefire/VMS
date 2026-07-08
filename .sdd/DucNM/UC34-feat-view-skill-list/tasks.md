# Tasks: View Skill List (UC34)

**Input**: Design documents từ `.sdd/DucNM/UC34-feat-view-skill-list/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2, US3)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- **New module**: Skill Management — tạo mới toàn bộ stack (pattern giống Category UC31)
- **Cross-module**: Phục vụ UC11 (Filter Event — NamLD) và UC20 (Edit Volunteer Skills — CuongLH)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Thiết lập database model và infrastructure dùng chung

- [ ] T001 Thêm Skill model vào Prisma schema trong `backend/prisma/schema.prisma` — fields: skill_id, name (unique), description (optional), is_active (default true), created_at, updated_at
- [ ] T002 Chạy Prisma migration: `npx prisma migrate dev --name add_skill_model`
- [ ] T003 [P] Tạo skill repository trong `backend/src/repositories/skill.repository.js` — hàm `findAllSkills(where)`
- [ ] T004 Tạo skill validator trong `backend/src/validators/skill.validator.js` — (optional, GET không cần params)

---

## Phase 2: User Story 1 - Manager xem toàn bộ danh sách skill (Priority: P1) 🎯 MVP

**Goal**: Manager/Admin gọi `GET /api/v1/skills` và thấy tất cả skills (active + inactive).

**Independent Test**: Tạo 5 skills (4 active + 1 inactive), gọi `GET /api/v1/skills` với token Manager, kiểm tra response có đủ 5 skills.

### Tests cho User Story 1 ⚠️

- [ ] T005 [P] [US1] Unit test cho `skill.service.js` — getSkills với role MANAGER → trả về tất cả skills (active + inactive) trong `backend/tests/skill/skill.service.test.js`
- [ ] T006 [P] [US1] Unit test cho `skill.service.js` — getSkills với role ADMIN → trả về tất cả skills
- [ ] T007 [P] [US1] Integration test cho `GET /api/v1/skills` — token Manager → HTTP 200 + all skills trong `backend/tests/skill/skill.api.test.js`
- [ ] T008 [US1] Integration test cho `GET /api/v1/skills` — token Admin → HTTP 200 + all skills

### Implementation cho User Story 1

- [ ] T009 [US1] Implement `skill.service.js` — hàm `getSkills(currentUser)` với role-based visibility trong `backend/src/services/skill.service.js`
- [ ] T010 [US1] Implement `skill.controller.js` — handler `getSkillsHandler` trong `backend/src/controllers/skill.controller.js`
- [ ] T011 [US1] Tạo `skill.routes.js` — route `GET /` với optionalAuth middleware trong `backend/src/routes/skill.routes.js`
- [ ] T012 [US1] Cập nhật `backend/src/app.js` — mount `skillRoutes` tại prefix `/api/v1/skills`
- [ ] T013 [US1] Thêm Swagger JSDoc cho endpoint `GET /api/v1/skills` trong `backend/src/routes/skill.routes.js`

**Checkpoint**: User Story 1 hoàn thành — Manager/Admin xem được tất cả skills.

---

## Phase 3: User Story 2 - Volunteer xem danh sách skill active (Priority: P1)

**Goal**: Volunteer/Staff gọi `GET /api/v1/skills` và chỉ thấy skills active. Phục vụ UC11 (Filter Event) và UC20 (Edit Volunteer Skills).

**Independent Test**: Gọi `GET /api/v1/skills` với token Volunteer, kiểm tra response chỉ chứa skill có is_active = true.

### Tests cho User Story 2 ⚠️

- [ ] T014 [P] [US2] Unit test cho `skill.service.js` — getSkills với role VOLUNTEER → chỉ active skills trong `backend/tests/skill/skill.service.test.js`
- [ ] T015 [P] [US2] Unit test cho `skill.service.js` — getSkills với role STAFF → chỉ active skills
- [ ] T016 [P] [US2] Integration test cho `GET /api/v1/skills` — token Volunteer → HTTP 200 + only active trong `backend/tests/skill/skill.api.test.js`
- [ ] T017 [US2] Integration test cho `GET /api/v1/skills` — token Staff → HTTP 200 + only active

### Implementation cho User Story 2

- [ ] T018 [US2] Role-based visibility logic đã implement ở T009 — Volunteer/Staff tự động chỉ thấy active

**Checkpoint**: User Story 2 hoàn thành — Volunteer/Staff xem được skills active (phục vụ UC11 + UC20).

---

## Phase 4: User Story 3 - Guest xem skills active (Priority: P1)

**Goal**: Guest (không token) gọi `GET /api/v1/skills` và chỉ thấy skills active. Phục vụ UC11 (Filter Event).

**Independent Test**: Gọi `GET /api/v1/skills` không token → 200 + only active.

### Tests cho User Story 3 ⚠️

- [ ] T019 [P] [US3] Unit test cho `skill.service.js` — getSkills với user = null (Guest) → chỉ active skills trong `backend/tests/skill/skill.service.test.js`
- [ ] T020 [P] [US3] Integration test cho `GET /api/v1/skills` — không token (Guest) → HTTP 200 + only active trong `backend/tests/skill/skill.api.test.js`

### Implementation cho User Story 3

- [ ] T021 [US3] Optional auth middleware (tái sử dụng từ UC31) — Guest không token vẫn vào được controller. Đã dùng ở T011.
- [ ] T022 [US3] Role-based visibility logic đã implement ở T009 — Guest (req.user = null) tự động chỉ thấy active

**Checkpoint**: User Story 3 hoàn thành — Guest xem được skills active (phục vụ UC11).

---

## Phase 5: Frontend

**Purpose**: Xây dựng giao diện Skill List cho Manager/Admin

- [ ] T023 [P] Implement frontend API client trong `frontend/src/api/skillApi.js` — hàm `getSkills()`
- [ ] T024 [P] Implement React hook `useSkills` trong `frontend/src/hooks/useSkills.js` — fetch skills, loading, error states
- [ ] T025 Implement `SkillListPage.jsx` với MUI Table trong `frontend/src/components/pages/SkillListPage.jsx`
- [ ] T026 Thêm route `/skills` trong `frontend/src/App.js`

---

## Phase 6: Edge Cases & Empty State

**Purpose**: Xử lý các edge case

- [ ] T027 [P] Unit test — getSkills khi không có skill nào → mảng rỗng trong `backend/tests/skill/skill.service.test.js`
- [ ] T028 [P] Integration test — database không phản hồi → HTTP 500 trong `backend/tests/skill/skill.api.test.js`
- [ ] T029 Frontend test — SkillListPage render empty state trong `frontend/tests/SkillListPage.test.jsx`
- [ ] T030 Frontend test — SkillListPage render loading state
- [ ] T031 Frontend test — SkillListPage render error state

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T004 — có thể chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên Phase 1
- **User Story 2 (Phase 3)**: Depends trên T009 (service logic) — cùng code với US1
- **User Story 3 (Phase 4)**: Depends trên optionalAuth (UC31) + T009 (service logic)
- **Frontend (Phase 5)**: Depends trên API hoàn thành
- **Edge Cases (Phase 6)**: Depends trên Phase 2-4

### User Story Dependencies

- **US1 (P1)**: MVP — bắt đầu ngay sau Setup
- **US2 (P1)**: Cùng service logic với US1 — implement cùng nhau
- **US3 (P1)**: Cùng service logic với US1 — implement cùng nhau
- **Frontend**: Sau khi API hoàn thành

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T003, T004 | Repository + Validator — khác files |
| T005, T006 | Tests US1 — viết song song |
| T009, T010, T011 | Service + Controller + Routes — sequential |
| T023, T024 | Frontend API + Hook — song song |
| US1 (T005-T013) + US3 (T019-T022) | Song song — cùng service logic |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001-T004) → Prisma + repository ready
2. **Phase 2+3+4**: US1+US2+US3 (T005-T022) → **MVP!** Tất cả roles đều xem được skills với role-based visibility
3. **Phase 5**: Frontend (T023-T026) → Skill List UI
4. **Phase 6**: Edge cases + tests
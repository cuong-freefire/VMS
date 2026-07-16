# Tasks: Search Skill

**Input**: Design documents từ `.sdd/DucNM/UC-feat-search-skill/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- Search Skill là extension của UC34 — tất cả thay đổi đều trên files đã có
- **Backend**: mở rộng `skill.validator.js`, `skill.service.js`, `skill.routes.js`
- **Frontend**: mở rộng `SkillListPage.jsx`, thêm component `SearchInput.jsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Mở rộng Zod schema để hỗ trợ search param mới: `search`

- [ ] T001 Mở rộng `getSkillsQuerySchema` trong `backend/src/validators/skill.validator.js` — thêm `search` (z.string().trim().optional())

---

## Phase 2: User Story 1 - Manager tìm kiếm skill theo tên (Priority: P1)

**Goal**: Manager tìm kiếm skills theo `name` — không phân biệt hoa/thường, partial match.

**Independent Test**: Gọi `GET /api/v1/skills?search=English` với token Manager, kiểm tra response chứa skill có tên chứa "English".

### Implementation cho User Story 1

- [ ] T002 [US1] Mở rộng Prisma `where` clause trong `skill.service.js` — thêm search condition với `contains` + `mode: 'insensitive'` trên `name` và `description` (OR logic) trong `backend/src/services/skill.service.js`
- [ ] T003 [US1] Cập nhật Swagger JSDoc cho `GET /api/v1/skills` trong `backend/src/routes/skill.routes.js` — thêm `search` param

### Tests cho User Story 1 ⚠️

- [ ] T004 [P] [US1] Unit test cho `skill.service.js` — getSkills với `search="English"` trả về skills có tên chứa "English" (case-insensitive) trong `backend/tests/skill/skill.service.test.js`
- [ ] T005 [P] [US1] Unit test — getSkills với `search="english"` trả về "English" (case-insensitive)
- [ ] T006 [P] [US1] Unit test — getSkills với `search="Eng"` trả về "English" (partial match)
- [ ] T007 [US1] Integration test cho `GET /api/v1/skills?search=English` → HTTP 200 + results trong `backend/tests/skill/skill.api.test.js`

**Checkpoint**: User Story 1 hoàn thành — Search by name hoạt động.

---

## Phase 3: User Story 2 - Manager tìm kiếm theo mô tả (Priority: P2)

**Goal**: Manager tìm kiếm skills theo `description` — partial match, case-insensitive.

**Independent Test**: Gọi `GET /api/v1/skills?search=giao%20tiep` với token Manager, kiểm tra response chứa skill có tên hoặc mô tả chứa "giao tiếp".

### Tests cho User Story 2

- [ ] T008 [P] [US2] Unit test cho `skill.service.js` — getSkills với `search="giao tiep"` trả về skills có mô tả chứa "giao tiep" trong `backend/tests/skill/skill.service.test.js`
- [ ] T009 [US2] Integration test — `GET /api/v1/skills?search=tiep` → HTTP 200 + results trong `backend/tests/skill/skill.api.test.js`

**Checkpoint**: User Story 2 hoàn thành — Search by description hoạt động.

---

## Phase 4: Edge Cases & Frontend

**Purpose**: Xử lý edge cases và Frontend SearchInput

### Tests ⚠️

- [ ] T010 [P] Unit test — getSkills với `search=""` hoặc `undefined` → bỏ qua search, trả về tất cả trong `backend/tests/skill/skill.service.test.js`
- [ ] T011 [P] Unit test — getSkills với `search` không match → empty array
- [ ] T012 [P] Integration test — `GET /api/v1/skills?search=notfound` → HTTP 200 + empty array trong `backend/tests/skill/skill.api.test.js`
- [ ] T013 Integration test — Guest gọi `GET /api/v1/skills?search=English` → HTTP 401 trong `backend/tests/skill/skill.api.test.js`

### Implementation

- [ ] T014 Frontend: Implement hoặc tái sử dụng `SearchInput.jsx` cho Skill List trong `frontend/src/components/ui/SearchInput.jsx`
- [ ] T015 Frontend: Cập nhật `SkillListPage.jsx` — thêm SearchInput vào UI trong `frontend/src/components/pages/SkillListPage.jsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 — có thể chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên T001 + T002 (service logic)
- **User Story 2 (Phase 3)**: Depends trên T001 + T002 (service logic — implementation chung với US1)
- **Edge Cases (Phase 4)**: Depends trên Phase 1-3

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T004, T005 | Tests search by name — viết song song |
| T008, T009 | Tests search by description — viết song song |
| T010-T013 | Edge case tests — chạy song song |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001) → Zod schema ready
2. **Phase 2**: US1 (T002-T007) → Search by name **MVP!**
3. **Phase 3**: US2 (T008-T009) → Search by description
4. **Phase 4**: Edge cases + Frontend (T010-T015)
# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.).

---

description: "Task list for UC10 - Search Event"
---

# Tasks: UC10 - Search Event

**Input**: Design documents from `.sdd/NamLD/UC10-feat-event-search/`

**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `context.md`

**Tests**: Test tasks are included as verification tasks where the repo has an existing backend/frontend test setup. If test setup is not ready, implementation must still complete manual verification/build checks without installing packages.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `backend/tests/`, `frontend/src/`
- Paths below are planned target paths from `plan.md`. If the real repo convention differs during implementation, follow the real repo convention and do not create unnecessary duplicate files.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm UC08 Event List foundation and UC10 integration points before implementation. This phase does not install packages, create migrations, edit source code, or create new endpoints by itself.

- [ ] T001 Inspect UC08 backend event route/controller/service/repository conventions in `backend/src/routes/event.routes.js`, `backend/src/controllers/event.controller.js`, `backend/src/services/event.service.js`, and `backend/src/repositories/event.repository.js`
- [ ] T002 [P] Inspect UC08 frontend Event List foundation in `frontend/src/components/pages/EventListPage.jsx`, `frontend/src/components/events/EventList.jsx`, `frontend/src/components/events/EventCard.jsx`, `frontend/src/components/events/EventListState.jsx`, and `frontend/src/components/events/EventPagination.jsx`
- [ ] T003 [P] Inspect event API client and query utility conventions in `frontend/src/api/eventApi.js`, `frontend/src/api/axiosApi.js`, and `frontend/src/utils/eventQuery.js`
- [ ] T004 [P] Inspect available backend/frontend test setup in `backend/package.json`, `frontend/package.json`, `backend/tests/`, and `frontend/src/**/__tests__/`
- [ ] T005 Confirm canonical UC10 runtime contract in implementation notes for `.sdd/NamLD/UC10-feat-event-search/tasks.md`: frontend route `/events`, backend API `GET /api/v1/events?keyword=...`, relative client endpoint `/events`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared query contract, response shape, and scope guard that MUST be respected before any user story implementation.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T006 Define shared event query object for `keyword`, `page`, and `pageSize` in `frontend/src/utils/eventQuery.js` and `frontend/src/api/eventApi.js`; keep UC11 filter slots compatible but inactive for UC10
- [ ] T007 Define backend query validation contract for optional `keyword`, `page`, and `pageSize` in `backend/src/validators/event.validator.js`
- [ ] T008 Define canonical response mapping `{ success: true, data: { items: [], pagination: {} } }` for UC10 in `backend/src/controllers/event.controller.js` and `frontend/src/api/eventApi.js`
- [ ] T009 Confirm public visibility rule `status = PUBLISHED`, active, and not soft-deleted in `backend/src/services/event.service.js`
- [ ] T010 Confirm UC10 public access has no auth middleware or login redirect in `backend/src/routes/event.routes.js`, `backend/src/app.js`, and `frontend/src/App.js`
- [ ] T011 Confirm UC10 does not introduce `/events/search`, `/events/filter`, or `/events/:id/apply` in `backend/src/routes/` and `frontend/src/api/`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Guest search public events (Priority: P1) MVP

**Goal**: Guest mở `/events`, nhập keyword, nhận matching public events từ `GET /api/v1/events?keyword=...`, không bị yêu cầu login.

**Independent Test**: Mở `/events` khi chưa đăng nhập, search keyword hợp lệ, kiểm tra request gọi `GET /api/v1/events?keyword=...`, response có `data.items` và `data.pagination`, chỉ gồm public events.

### Tests for User Story 1

- [ ] T012 [P] [US1] Add or update backend public Guest search test for `GET /api/v1/events?keyword=...` in `backend/tests/events/event-search.test.js` if backend test setup exists
- [ ] T013 [P] [US1] Add or update backend public visibility test for Guest search excluding `DRAFT`, `COMPLETED`, `CANCELLED`, inactive, and soft-deleted events in `backend/tests/events/event-search.test.js` if backend test setup exists
- [ ] T014 [P] [US1] Add or update frontend Guest search access test for `/events` without login in `frontend/src/components/pages/__tests__/EventListPage.test.jsx` if frontend test setup exists

### Implementation for User Story 1

- [ ] T015 [US1] Reuse public `GET /events` route for UC10 search without adding `authenticate` middleware in `backend/src/routes/event.routes.js`
- [ ] T016 [US1] Implement optional `keyword` validation and `422` invalid query handling in `backend/src/validators/event.validator.js` and `backend/src/controllers/event.controller.js`
- [ ] T017 [US1] Trim keyword and treat blank keyword as no keyword filter in `backend/src/services/event.service.js`
- [ ] T018 [US1] Apply public event rule before returning search results in `backend/src/services/event.service.js`
- [ ] T019 [US1] Implement repository keyword search over title, description/shortDescription, and location with pagination in `backend/src/repositories/event.repository.js`
- [ ] T020 [US1] Return canonical response `{ success: true, data: { items, pagination } }` with camelCase fields in `backend/src/controllers/event.controller.js` and `backend/src/utils/event.mapper.js`
- [ ] T021 [US1] Add `eventApi.listEvents(query)` support for `keyword`, `page`, and `pageSize` using relative `/events` in `frontend/src/api/eventApi.js`
- [ ] T022 [US1] Add SearchBar inside the existing Event List page without creating `/events/search` page in `frontend/src/components/pages/EventListPage.jsx` and `frontend/src/components/events/EventSearchBar.jsx`
- [ ] T023 [US1] Wire Guest search submit/request flow from SearchBar to `eventApi.listEvents(query)` in `frontend/src/components/pages/EventListPage.jsx`

**Checkpoint**: Guest can search public events on `/events` and UC10 MVP works without login.

---

## Phase 4: User Story 2 - Volunteer search public events and open detail route (Priority: P1)

**Goal**: Volunteer đã đăng nhập search được public events theo keyword, kết quả dùng chung EventCard/EventList, và `View Detail` vẫn đi tới `/events/:id` without UC09 detail content.

**Independent Test**: Đăng nhập Volunteer, mở `/events`, search keyword match title/location/organization/category/skill khi data có sẵn, kiểm tra result card hiển thị và link detail đúng `/events/:id`.

### Tests for User Story 2

- [ ] T024 [P] [US2] Add or update backend search match tests for title and location in `backend/tests/events/event-search.test.js` if backend test setup exists
- [ ] T025 [P] [US2] Add or update backend relation search tests for organization, category, and skill when relation data is available in `backend/tests/events/event-search.test.js` if backend test setup exists
- [ ] T026 [P] [US2] Add or update frontend result rendering and View Detail navigation test in `frontend/src/components/pages/__tests__/EventListPage.test.jsx` and `frontend/src/components/events/__tests__/EventCard.test.jsx` if frontend test setup exists

### Implementation for User Story 2

- [ ] T027 [US2] Extend repository search to organization name when joined/embedded organization data is available in `backend/src/repositories/event.repository.js`
- [ ] T028 [US2] Extend repository search to category name when joined/embedded category data is available in `backend/src/repositories/event.repository.js`
- [ ] T029 [US2] Extend repository search to skill name when EventSkill/Skill relation data is available in `backend/src/repositories/event.repository.js`
- [ ] T030 [US2] Document graceful degradation in `backend/src/services/event.service.js` behavior if organization/category/skill relation search is not ready; do not create schema/migration
- [ ] T031 [US2] Render search results through existing `EventList` and `EventCard` components in `frontend/src/components/pages/EventListPage.jsx` and `frontend/src/components/events/EventList.jsx`
- [ ] T032 [US2] Preserve EventCard `View Detail` navigation to `/events/:id` without rendering UC09 detail content in `frontend/src/components/events/EventCard.jsx`
- [ ] T033 [US2] Ensure search result UI does not submit applications or call `/events/:id/apply` in `frontend/src/components/events/EventCard.jsx` and `frontend/src/api/eventApi.js`

**Checkpoint**: Volunteer search uses the same public list/card pattern and can navigate to UC09 route only.

---

## Phase 5: User Story 3 - Keyword normalization, pagination, clear search, and states (Priority: P2)

**Goal**: UC10 handles blank/trimmed/case-insensitive keyword behavior, search pagination, loading/empty/error states, clear/reset, and UC11-compatible query state without implementing full UC11 filters.

**Independent Test**: Search with blank keyword, whitespace, mixed case, no-result keyword, API error, and multi-page result; verify page reset, clear search, `data.items`, and `data.pagination`.

### Tests for User Story 3

- [ ] T034 [P] [US3] Add or update backend tests for empty keyword, whitespace-only keyword, trimmed keyword, and case-insensitive search in `backend/tests/events/event-search.test.js` if backend test setup exists
- [ ] T035 [P] [US3] Add or update backend pagination tests for `GET /api/v1/events?keyword=...&page=...&pageSize=...` in `backend/tests/events/event-search.test.js` if backend test setup exists
- [ ] T036 [P] [US3] Add or update backend invalid keyword/query tests expecting `422` in `backend/tests/events/event-search.test.js` if backend test setup exists
- [ ] T037 [P] [US3] Add or update frontend tests for loading, empty, error, clear search, and retry states in `frontend/src/components/pages/__tests__/EventListPage.test.jsx` and `frontend/src/components/events/__tests__/EventListState.test.jsx` if frontend test setup exists
- [ ] T038 [P] [US3] Add or update frontend tests for keyword page reset and keyword preservation during pagination in `frontend/src/components/pages/__tests__/EventListPage.test.jsx` if frontend test setup exists

### Implementation for User Story 3

- [ ] T039 [US3] Implement frontend keyword trim and blank keyword handling before request in `frontend/src/utils/eventQuery.js` and `frontend/src/components/events/EventSearchBar.jsx`
- [ ] T040 [US3] Reset `page` to 1 when keyword changes in `frontend/src/components/pages/EventListPage.jsx`
- [ ] T041 [US3] Preserve current keyword when page changes through pagination in `frontend/src/components/pages/EventListPage.jsx` and `frontend/src/components/events/EventPagination.jsx`
- [ ] T042 [US3] Implement clear search/reset behavior returning to base UC08 list in `frontend/src/components/events/EventSearchBar.jsx` and `frontend/src/components/pages/EventListPage.jsx`
- [ ] T043 [US3] Show searching/loading state while keyword request is pending in `frontend/src/components/events/EventListState.jsx` and `frontend/src/components/pages/EventListPage.jsx`
- [ ] T044 [US3] Show search empty state when active keyword returns `data.items: []` in `frontend/src/components/events/EventListState.jsx`
- [ ] T045 [US3] Show search error state and retry current keyword query in `frontend/src/components/events/EventListState.jsx` and `frontend/src/components/pages/EventListPage.jsx`
- [ ] T046 [US3] Keep query state compatible with future UC11 filter params without implementing full filter UI/rules in `frontend/src/utils/eventQuery.js` and `frontend/src/api/eventApi.js`
- [ ] T047 [US3] Verify backend response parsing always uses `data.items` and `data.pagination` in `frontend/src/api/eventApi.js`

**Checkpoint**: UC10 search behavior is stable with pagination/states and remains compatible with UC11 without implementing UC11.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across UC10 without broadening scope or changing project-wide docs.

- [ ] T048 [P] Verify UC10 uses only frontend route `/events`, backend `GET /api/v1/events?keyword=...`, and relative client endpoint `/events` in `frontend/src/api/eventApi.js` and `backend/src/routes/event.routes.js`
- [ ] T049 [P] Verify no out-of-scope endpoints exist for UC10: `/events/search`, `/events/filter`, or `/events/:id/apply` in `backend/src/routes/` and `frontend/src/api/`
- [ ] T050 [P] Verify canonical response shape `{ success: true, data: { items: [], pagination: {} } }` is used consistently in `backend/src/controllers/event.controller.js`, `backend/src/services/event.service.js`, and `frontend/src/api/eventApi.js`
- [ ] T051 [P] Review UC10 scope boundaries against `.sdd/NamLD/UC10-feat-event-search/context.md`, `.sdd/NamLD/UC10-feat-event-search/spec.md`, and `.sdd/NamLD/UC10-feat-event-search/plan.md`
- [ ] T052 Run available focused backend verification for UC10 using the existing command from `backend/package.json`; if no test setup exists, document manual backend verification results in implementation notes
- [ ] T053 Run available focused frontend verification/build check for UC10 using the existing command from `frontend/package.json`; if no test setup exists, document manual frontend verification results in implementation notes
- [ ] T054 Final UC10 readiness review for public access, keyword trim/blank behavior, public-only visibility, canonical response shape, pagination, clear search, and scope guard in `.sdd/NamLD/UC10-feat-event-search/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
- **Polish (Phase 6)**: Depends on all selected user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: MVP. Can start after Foundational and delivers public Guest keyword search.
- **User Story 2 (P1)**: Can start after Foundational, but final UI integration benefits from US1 API/query contract.
- **User Story 3 (P2)**: Can start after Foundational, but final wiring depends on US1 search flow and US2 shared result rendering.

### Within Each User Story

- Tests or verification tasks should be prepared before implementation when test setup exists.
- Backend validator before controller/service behavior.
- Service public visibility rule before repository search result is trusted.
- Repository search before frontend depends on full search data.
- API client before page wiring.
- SearchBar/query state before loading/empty/error and pagination integration.

### Parallel Opportunities

- T002, T003, and T004 can run in parallel with T001.
- T006 and T007 can run in parallel after Setup.
- T012, T013, and T014 can run in parallel for US1 tests.
- T024, T025, and T026 can run in parallel for US2 tests.
- T034, T035, T036, T037, and T038 can run in parallel for US3 tests.
- T048, T049, T050, and T051 can run in parallel during Polish.

---

## Parallel Example: User Story 1

```bash
Task: "Add or update backend public Guest search test for GET /api/v1/events?keyword=... in backend/tests/events/event-search.test.js"
Task: "Add or update backend public visibility test in backend/tests/events/event-search.test.js"
Task: "Add or update frontend Guest search access test in frontend/src/components/pages/__tests__/EventListPage.test.jsx"
```

---

## Parallel Example: User Story 2

```bash
Task: "Add or update backend search match tests for title and location in backend/tests/events/event-search.test.js"
Task: "Add or update backend relation search tests in backend/tests/events/event-search.test.js"
Task: "Add or update frontend result rendering and View Detail navigation test in frontend/src/components/pages/__tests__/EventListPage.test.jsx"
```

---

## Parallel Example: User Story 3

```bash
Task: "Add or update backend keyword normalization tests in backend/tests/events/event-search.test.js"
Task: "Add or update backend pagination tests in backend/tests/events/event-search.test.js"
Task: "Add or update frontend loading/empty/error/clear tests in frontend/src/components/pages/__tests__/EventListPage.test.jsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. STOP and VALIDATE: Guest can open `/events`, search with `GET /api/v1/events?keyword=...`, receive `{ success: true, data: { items, pagination } }`, and see only public events.
5. Demo MVP before relation search, full state polish, and pagination refinements.

### Incremental Delivery

1. Add User Story 1 -> public keyword search works for Guest.
2. Add User Story 2 -> Volunteer search, result rendering, relation search where available, and View Detail route.
3. Add User Story 3 -> trim/blank behavior, pagination, clear search, loading/empty/error states, and UC11-compatible query state.
4. Validate after each story so UC10 never expands into UC11 filter, UC09 detail content, or UC12 Apply Event.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together.
2. Developer A: US1 backend public keyword search and Guest flow.
3. Developer B: US2 shared result rendering and Volunteer/detail route verification.
4. Developer C: US3 query state, pagination, and search states.
5. Integrate through `EventListPage` and `eventApi.listEvents(query)` only after story checkpoints pass.

---

## Notes

- UC10 scope is Search Event behavior on the existing Event List page `/events`.
- Backend canonical endpoint is `GET /api/v1/events?keyword=...`; frontend client calls relative `/events`.
- Canonical response shape is `{ success: true, data: { items: [], pagination: {} } }`.
- Guest and Volunteer can search public events without UC10 requiring login.
- Search results must remain public-only: `PUBLISHED`, active, not soft-deleted.
- Do not create `/events/search`, `/events/filter`, or `/events/:id/apply`.
- Do not implement UC11 full filter behavior, UC09 detail content, or UC12 Apply Event inside UC10.
- Do not create migrations, install packages, commit, or edit source code while generating this task document.

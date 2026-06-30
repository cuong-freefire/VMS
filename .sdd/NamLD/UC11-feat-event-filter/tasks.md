# **LANGUAGE**: Tài liệu này được viết bằng tiếng Việt, giữ nguyên technical terms bằng English như API, endpoint, query params, validation, pagination, repository, mock, seed, etc.

---

description: "Task list for UC11 - Filter Event"
---

# Tasks: UC11 - Filter Event

**Input**: Design documents from `.sdd/NamLD/UC11-feat-event-filter/`

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
- UC11 chỉ cập nhật task breakdown; không sửa source code, không tạo migration/schema, không install package, không commit.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm UC08/UC10 foundation and UC11 integration points before implementation. This phase does not install packages, create migrations, edit source code, or create new endpoints by itself.

- [ ] T001 Inspect UC08/UC10 backend event foundation in `backend/src/routes/event.routes.js`, `backend/src/controllers/event.controller.js`, `backend/src/services/event.service.js`, `backend/src/repositories/event.repository.js`, and `backend/src/validators/event.validator.js`
- [ ] T002 [P] Inspect UC08 frontend Event List foundation in `frontend/src/components/pages/EventListPage.jsx`, `frontend/src/components/events/EventList.jsx`, `frontend/src/components/events/EventCard.jsx`, `frontend/src/components/events/EventListState.jsx`, and `frontend/src/components/events/EventPagination.jsx`
- [ ] T003 [P] Inspect UC10 search/query foundation in `frontend/src/components/events/EventSearchBar.jsx`, `frontend/src/api/eventApi.js`, and `frontend/src/utils/eventQuery.js`
- [ ] T004 [P] Inspect event mapper/response conventions in `backend/src/utils/event.mapper.js` and `backend/src/utils/response.util.js`
- [ ] T005 Confirm canonical UC11 runtime contract in implementation notes for `.sdd/NamLD/UC11-feat-event-filter/tasks.md`: frontend route `/events`, backend API `GET /api/v1/events`, relative client endpoint `/events`, no `/events/filter`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared query contract, validation contract, response shape, and scope guard that MUST be respected before any user story implementation.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T006 Define shared event query object for `categoryId`, `skillId`, `organizationId`, `location`, `startDate`, `endDate`, `availability`, `keyword`, `page`, and `pageSize` in `frontend/src/utils/eventQuery.js` and `frontend/src/api/eventApi.js`
- [ ] T007 Define backend query validation contract for optional `categoryId`, `skillId`, `organizationId`, `location`, `startDate`, `endDate`, `availability`, `keyword`, `page`, and `pageSize` in `backend/src/validators/event.validator.js`
- [ ] T008 Confirm canonical response mapping `{ success: true, data: { items: [], pagination: {} } }` for filtered event list in `backend/src/controllers/event.controller.js`, `backend/src/utils/response.util.js`, and `frontend/src/api/eventApi.js`
- [ ] T009 Confirm public visibility rule `status = PUBLISHED`, active, and not soft-deleted in `backend/src/services/event.service.js` and `backend/src/repositories/event.repository.js`
- [ ] T010 Confirm UC11 public access has no auth middleware or login redirect in `backend/src/routes/event.routes.js` and `frontend/src/components/pages/EventListPage.jsx`
- [ ] T011 Confirm UC11 does not introduce `/events/filter`, `/events/search`, or `/events/:id/apply` in `backend/src/routes/event.routes.js` and `frontend/src/api/eventApi.js`
- [ ] T012 Confirm storage strategy in `backend/src/repositories/event.repository.js`: use MySQL/Prisma if foundation is ready, otherwise seed/mock repository temporarily while preserving `GET /api/v1/events` contract

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Guest lọc public events (Priority: P1) MVP

**Goal**: Guest mở `/events`, chọn filter hợp lệ, nhận matching public events từ `GET /api/v1/events` mà không bị yêu cầu login.

**Independent Test**: Mở `/events` khi chưa đăng nhập, chọn filter hợp lệ, kiểm tra request gọi `GET /api/v1/events?...`, response có `data.items` và `data.pagination`, chỉ gồm events `PUBLISHED`, active, không soft-deleted.

### Tests for User Story 1

- [ ] T013 [P] [US1] Add or update backend public Guest filter access test for `GET /api/v1/events?categoryId=...` in `backend/tests/events/event-filter.test.js` if backend test setup exists
- [ ] T014 [P] [US1] Add or update backend public visibility test excluding `DRAFT`, `COMPLETED`, `CANCELLED`, inactive, and soft-deleted events in `backend/tests/events/event-filter.test.js` if backend test setup exists
- [ ] T015 [P] [US1] Add or update frontend Guest filter access test for `/events` without login in `frontend/src/components/pages/__tests__/EventListPage.test.jsx` if frontend test setup exists

### Implementation for User Story 1

- [ ] T016 [US1] Reuse public `GET /events` route for UC11 filter without adding `authenticate` middleware in `backend/src/routes/event.routes.js`
- [ ] T017 [US1] Implement optional query validation for `categoryId`, `skillId`, `organizationId`, `location`, `startDate`, `endDate`, `availability`, `keyword`, `page`, and `pageSize` in `backend/src/validators/event.validator.js`
- [ ] T018 [US1] Return `422` for invalid filter query params through controller/response utilities in `backend/src/controllers/event.controller.js` and `backend/src/utils/response.util.js`
- [ ] T019 [US1] Normalize query params by trimming `location` and `keyword`, treating blank values as absent filters in `backend/src/services/event.service.js`
- [ ] T020 [US1] Enforce public event rule before returning filtered results in `backend/src/services/event.service.js`
- [ ] T021 [US1] Build repository filtering for public events with AND logic for active filters in `backend/src/repositories/event.repository.js`
- [ ] T022 [US1] Map filtered event records to camelCase public summaries without private/internal fields in `backend/src/utils/event.mapper.js`
- [ ] T023 [US1] Return canonical response `{ success: true, data: { items, pagination } }` from `backend/src/controllers/event.controller.js`
- [ ] T024 [US1] Send filter params to relative `/events` from `eventApi.listEvents(query)` in `frontend/src/api/eventApi.js`
- [ ] T025 [US1] Render `EventFilterPanel` inside existing Event List page without creating a standalone filter page in `frontend/src/components/pages/EventListPage.jsx` and `frontend/src/components/events/EventFilterPanel.jsx`

**Checkpoint**: Guest can filter public events on `/events`; UC11 MVP works without login and without a new endpoint.

---

## Phase 4: User Story 2 - Volunteer lọc theo full criteria và xem kết quả (Priority: P1)

**Goal**: Volunteer lọc public events theo category, skill, organization, location, date range, availability; filtered results dùng chung EventList/EventCard và `View Detail` vẫn đi tới `/events/:id`.

**Independent Test**: Đăng nhập Volunteer, mở `/events`, chọn từng filter và nhiều filter cùng lúc; kết quả chỉ gồm public events match tất cả active filters, card render ổn định, View Detail đi tới `/events/:id`.

### Tests for User Story 2

- [ ] T026 [P] [US2] Add or update backend tests for `categoryId`, `skillId`, and `organizationId` filters in `backend/tests/events/event-filter.test.js` if backend test setup exists
- [ ] T027 [P] [US2] Add or update backend tests for `location`, `startDate`, `endDate`, and `availability` filters in `backend/tests/events/event-filter.test.js` if backend test setup exists
- [ ] T028 [P] [US2] Add or update backend tests proving multiple filters use AND logic in `backend/tests/events/event-filter.test.js` if backend test setup exists
- [ ] T029 [P] [US2] Add or update frontend result rendering and View Detail navigation tests in `frontend/src/components/pages/__tests__/EventListPage.test.jsx` and `frontend/src/components/events/__tests__/EventCard.test.jsx` if frontend test setup exists

### Implementation for User Story 2

- [ ] T030 [US2] Implement `categoryId` filter condition in `backend/src/repositories/event.repository.js`
- [ ] T031 [US2] Implement `skillId` filter condition when EventSkill/Skill data is available, with graceful degradation if not ready, in `backend/src/repositories/event.repository.js` and `backend/src/services/event.service.js`
- [ ] T032 [US2] Implement `organizationId` filter condition in `backend/src/repositories/event.repository.js`
- [ ] T033 [US2] Implement `location` filter with trimmed partial match where supported in `backend/src/repositories/event.repository.js`
- [ ] T034 [US2] Implement `startDate` and `endDate` date range filters in `backend/src/repositories/event.repository.js`
- [ ] T035 [US2] Implement `availability=AVAILABLE` and `availability=FULL` based on `remainingSlots` in `backend/src/services/event.service.js` and `backend/src/repositories/event.repository.js`
- [ ] T036 [US2] Ensure multiple active filters combine with AND logic and never bypass public visibility in `backend/src/services/event.service.js` and `backend/src/repositories/event.repository.js`
- [ ] T037 [US2] Add filter controls for category, skill, organization, location, date range, and availability in `frontend/src/components/events/EventFilterPanel.jsx`
- [ ] T038 [US2] Hide, disable, or gracefully degrade unavailable category/skill/organization options in `frontend/src/components/events/EventFilterPanel.jsx` without creating schema changes or new endpoints
- [ ] T039 [US2] Render filtered results through existing `EventList` and `EventCard` components in `frontend/src/components/pages/EventListPage.jsx`, `frontend/src/components/events/EventList.jsx`, and `frontend/src/components/events/EventCard.jsx`
- [ ] T040 [US2] Preserve `View Detail` navigation to `/events/:id` without rendering UC09 detail content in `frontend/src/components/events/EventCard.jsx`
- [ ] T041 [US2] Ensure filtered result UI does not submit applications or call `/events/:id/apply` in `frontend/src/components/events/EventCard.jsx` and `frontend/src/api/eventApi.js`

**Checkpoint**: Volunteer can use full UC11 filter criteria, results stay public-only, and UC11 still does not implement UC09 or UC12.

---

## Phase 5: User Story 3 - Filter nằm chung Event List với keyword, pagination, clear/reset và states (Priority: P1)

**Goal**: UC11 filter works inside the shared `/events` page with UC08 list foundation and UC10 `keyword`; filter changes reset page to 1, pagination preserves filters/keyword, clear/reset works, and loading/empty/error states are clear.

**Independent Test**: Mở `/events`, nhập `keyword`, chọn filters, đổi page, clear/reset filters, mock loading/empty/error; kiểm tra query state, request params, response parsing, and no standalone filter/search/apply endpoint.

### Tests for User Story 3

- [ ] T042 [P] [US3] Add or update backend test for `keyword` combined with filters using AND logic in `backend/tests/events/event-filter.test.js` if backend test setup exists
- [ ] T043 [P] [US3] Add or update backend pagination tests for filtered results with `page` and `pageSize` in `backend/tests/events/event-filter.test.js` if backend test setup exists
- [ ] T044 [P] [US3] Add or update frontend tests for page reset on filter change and pagination preserving filters/keyword in `frontend/src/components/pages/__tests__/EventListPage.test.jsx` if frontend test setup exists
- [ ] T045 [P] [US3] Add or update frontend tests for clear one filter, clear all filters, and preserving active `keyword` in `frontend/src/components/events/__tests__/EventFilterPanel.test.jsx` if frontend test setup exists
- [ ] T046 [P] [US3] Add or update frontend tests for filter loading, empty, error, and retry states in `frontend/src/components/events/__tests__/EventListState.test.jsx` if frontend test setup exists

### Implementation for User Story 3

- [ ] T047 [US3] Keep `keyword` from UC10 in shared query state and combine it with active filters in `frontend/src/utils/eventQuery.js` and `frontend/src/components/pages/EventListPage.jsx`
- [ ] T048 [US3] Combine backend `keyword` and active filters with AND logic without reimplementing full UC10 search behavior in `backend/src/services/event.service.js` and `backend/src/repositories/event.repository.js`
- [ ] T049 [US3] Reset `page` to 1 whenever any filter changes in `frontend/src/utils/eventQuery.js` and `frontend/src/components/pages/EventListPage.jsx`
- [ ] T050 [US3] Preserve active filters and `keyword` when pagination changes in `frontend/src/components/events/EventPagination.jsx` and `frontend/src/components/pages/EventListPage.jsx`
- [ ] T051 [US3] Implement clear individual filter while preserving other filters and `keyword` in `frontend/src/components/events/EventFilterPanel.jsx` and `frontend/src/utils/eventQuery.js`
- [ ] T052 [US3] Implement clear/reset all filters while preserving active `keyword` and resetting page to 1 in `frontend/src/components/events/EventFilterPanel.jsx` and `frontend/src/utils/eventQuery.js`
- [ ] T053 [US3] Parse filtered response only from `data.items` and `data.pagination` in `frontend/src/api/eventApi.js`
- [ ] T054 [US3] Show filter loading state while request is pending in `frontend/src/components/events/EventListState.jsx` and `frontend/src/components/pages/EventListPage.jsx`
- [ ] T055 [US3] Show empty state when filtered response has `data.items: []` in `frontend/src/components/events/EventListState.jsx`
- [ ] T056 [US3] Show error state and retry current filter/keyword query in `frontend/src/components/events/EventListState.jsx` and `frontend/src/components/pages/EventListPage.jsx`
- [ ] T057 [US3] Verify `EventListPage` uses UC08/UC10 shared foundation and does not create `/events/filter`, `/events/search`, or `/events/:id/apply` behavior in `frontend/src/components/pages/EventListPage.jsx` and `frontend/src/api/eventApi.js`

**Checkpoint**: UC11 behaves as a shared Event List filter feature and remains compatible with UC08/UC10.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across UC11 without broadening scope or changing project-wide docs.

- [ ] T058 [P] Verify UC11 uses only frontend route `/events`, backend `GET /api/v1/events`, and relative client endpoint `/events` in `frontend/src/api/eventApi.js` and `backend/src/routes/event.routes.js`
- [ ] T059 [P] Verify no out-of-scope endpoints exist for UC11: `/events/filter`, `/events/search`, or `/events/:id/apply` in `backend/src/routes/event.routes.js` and `frontend/src/api/eventApi.js`
- [ ] T060 [P] Verify canonical response shape `{ success: true, data: { items: [], pagination: {} } }` is used consistently in `backend/src/controllers/event.controller.js`, `backend/src/services/event.service.js`, `backend/src/utils/response.util.js`, and `frontend/src/api/eventApi.js`
- [ ] T061 [P] Review UC11 scope boundaries against `.sdd/NamLD/UC11-feat-event-filter/context.md`, `.sdd/NamLD/UC11-feat-event-filter/spec.md`, and `.sdd/NamLD/UC11-feat-event-filter/plan.md`
- [ ] T062 Run available focused backend verification for UC11 using the existing command from `backend/package.json`; if no test setup exists, document manual backend verification results in implementation notes
- [ ] T063 Run available focused frontend verification/build check for UC11 using the existing command from `frontend/package.json`; if no test setup exists, document manual frontend verification results in implementation notes
- [ ] T064 Final UC11 readiness review for public access, public-only visibility, filter params, AND logic, keyword compatibility, pagination, clear/reset, states, response shape, and scope guard in `.sdd/NamLD/UC11-feat-event-filter/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
- **Polish (Phase 6)**: Depends on all selected user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: MVP. Can start after Foundational and delivers public Guest filtering through the canonical endpoint.
- **User Story 2 (P1)**: Can start after Foundational, but final UI/result rendering benefits from US1 API/query contract.
- **User Story 3 (P1)**: Can start after Foundational, but final wiring depends on US1 public endpoint behavior and US2 filter controls/result rendering.

### Within Each User Story

- Tests or verification tasks should be prepared before implementation when test setup exists.
- Backend validator before controller/service behavior.
- Service public visibility rule before repository filter result is trusted.
- Repository filter composition before frontend depends on final result semantics.
- API client before page wiring.
- FilterPanel/query state before loading/empty/error and pagination integration.
- Story checkpoint should pass before moving to the next priority block.

### Parallel Opportunities

- T002, T003, and T004 can run in parallel with T001.
- T006 and T007 can run in parallel after Setup.
- T013, T014, and T015 can run in parallel for US1 tests.
- T026, T027, T028, and T029 can run in parallel for US2 tests.
- T042, T043, T044, T045, and T046 can run in parallel for US3 tests.
- T058, T059, T060, and T061 can run in parallel during Polish.

---

## Parallel Example: User Story 1

```bash
Task: "Add or update backend public Guest filter access test for GET /api/v1/events?categoryId=... in backend/tests/events/event-filter.test.js"
Task: "Add or update backend public visibility test excluding non-public events in backend/tests/events/event-filter.test.js"
Task: "Add or update frontend Guest filter access test for /events without login in EventListPage coverage"
```

---

## Parallel Example: User Story 2

```bash
Task: "Add or update backend tests for categoryId, skillId, and organizationId filters in backend/tests/events/event-filter.test.js"
Task: "Add or update backend tests for location, startDate, endDate, and availability filters in backend/tests/events/event-filter.test.js"
Task: "Add or update frontend result rendering and View Detail navigation verification for EventListPage, EventList, and EventCard"
```

---

## Parallel Example: User Story 3

```bash
Task: "Add or update backend test for keyword combined with filters using AND logic in backend/tests/events/event-filter.test.js"
Task: "Add or update backend pagination tests for filtered results in backend/tests/events/event-filter.test.js"
Task: "Add or update frontend tests for clear/reset, pagination preservation, and loading/empty/error states"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. STOP and VALIDATE: Guest can open `/events`, apply a filter through `GET /api/v1/events`, receive `{ success: true, data: { items, pagination } }`, and see only public events without login.
5. Demo MVP before adding full criteria polish, keyword combination, pagination refinement, and state handling.

### Incremental Delivery

1. Add User Story 1 -> public filter API and Guest flow work independently.
2. Add User Story 2 -> Volunteer full criteria, AND logic, result rendering, and View Detail route.
3. Add User Story 3 -> UC08/UC10 shared query integration, keyword compatibility, pagination, clear/reset, and states.
4. Validate after each story so UC11 never expands into standalone filter page, UC09 detail content, or UC12 Apply Event.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together.
2. Developer A: US1 backend public filter access and Guest flow.
3. Developer B: US2 filter criteria and result rendering.
4. Developer C: US3 query state, pagination, clear/reset, and states.
5. Integrate only through `EventListPage`, `EventFilterPanel`, `eventApi.listEvents(query)`, and the canonical `GET /events` route after story checkpoints pass.

---

## Notes

- UC11 scope is Filter Event behavior on the existing Event List page `/events`.
- Backend canonical endpoint is `GET /api/v1/events`; frontend client calls relative `/events`.
- Canonical response shape is `{ success: true, data: { items: [], pagination: {} } }`.
- Filter params are `categoryId`, `skillId`, `organizationId`, `location`, `startDate`, `endDate`, `availability`, `keyword`, `page`, and `pageSize`.
- Guest and Volunteer can filter public events without UC11 requiring login.
- Filter results must remain public-only: `PUBLISHED`, active, not soft-deleted.
- Multiple filters use AND logic; `keyword` from UC10 can combine with filters.
- Filter changes reset `page` to 1; pagination preserves active filters and `keyword`; clear/reset filter must work.
- Do not create `/events/filter`, `/events/search`, or `/events/:id/apply`.
- Do not implement UC09 detail content or UC12 Apply Event inside UC11.
- Do not create migrations, install packages, commit, or edit source code while generating this task document.

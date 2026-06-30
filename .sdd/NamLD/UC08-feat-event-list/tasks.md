# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.).

---

description: "Task list for UC08 - View Event List"
---

# Tasks: UC08 - View Event List

**Input**: Design documents from `.sdd/NamLD/UC08-feat-event-list/`

**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `context.md`

**Tests**: Test tasks are included as validation tasks only where the repo has an existing test setup. If backend or frontend test setup is not ready, implementation must still complete manual verification/build checks in the listed files/commands without installing packages.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `backend/tests/`, `frontend/src/`
- Paths below are planned target paths from `plan.md`. If the real repo convention differs during implementation, follow the real repo convention and do not create unnecessary duplicate files.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm existing repo structure and runtime conventions before implementation. This phase does not install packages, create migrations, or edit source code by itself.

- [ ] T001 Inspect backend event module conventions in `backend/src/app.js`, `backend/src/routes/`, `backend/src/controllers/`, `backend/src/services/`, and `backend/src/repositories/`
- [ ] T002 [P] Inspect frontend route/API/component conventions in `frontend/src/App.js`, `frontend/src/api/`, `frontend/src/components/pages/`, and `frontend/src/components/events/`
- [ ] T003 [P] Inspect available test commands and test locations in `backend/package.json`, `frontend/package.json`, `backend/tests/`, and `frontend/src/**/__tests__/`
- [ ] T004 Confirm canonical UC08 URL mapping between frontend route `/events`, backend API `GET /api/v1/events`, and relative API client endpoint `GET /events` in implementation notes for `.sdd/NamLD/UC08-feat-event-list/tasks.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core contracts and boundaries that MUST be respected before any user story implementation.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T005 Define UC08 public event summary response fields and pagination metadata expected by frontend in `backend/src/services/event.service.js` and `frontend/src/api/eventApi.js`
- [ ] T006 [P] Define safe query handling for `page` and `pageSize` in `backend/src/validators/event.validator.js`; reserve UC10/UC11 query names without implementing full search/filter behavior
- [ ] T007 [P] Define frontend event query shape for `page` and `pageSize` in `frontend/src/utils/eventQuery.js`; keep optional UC10/UC11 query slots inert for UC08
- [ ] T008 Confirm UC08 does not require auth middleware or login redirect in `backend/src/routes/event.routes.js`, `backend/src/app.js`, and `frontend/src/App.js`
- [ ] T009 Confirm UC08 has no endpoints or frontend calls for `/events/search`, `/events/filter`, or `/events/:id/apply` in `backend/src/routes/` and `frontend/src/api/`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Guest/Volunteer xem public Event List (Priority: P1) MVP

**Goal**: Guest chưa đăng nhập và Volunteer đã đăng nhập đều mở được `/events` và nhận danh sách public events từ `GET /api/v1/events` mà không require login.

**Independent Test**: Mở `/events` khi chưa đăng nhập và khi có Volunteer session; kiểm tra request gọi `GET /api/v1/events`, response chỉ chứa public active events, và không có auth redirect.

### Tests for User Story 1

- [ ] T010 [P] [US1] Add or update backend public access test for `GET /api/v1/events` in `backend/tests/events/event-list.test.js`
- [ ] T011 [P] [US1] Add or update backend visibility rule test for `PUBLISHED` and active events only in `backend/tests/events/event-list.test.js`
- [ ] T012 [P] [US1] Add or update frontend page access test for `/events` without login in `frontend/src/components/pages/__tests__/EventListPage.test.jsx` if React Testing Library setup exists

### Implementation for User Story 1

- [ ] T013 [US1] Register or adjust public event list route for `GET /api/v1/events` via relative route `GET /events` in `backend/src/routes/event.routes.js` and `backend/src/app.js`
- [ ] T014 [US1] Implement request validation for UC08 pagination query params in `backend/src/validators/event.validator.js`
- [ ] T015 [US1] Implement controller behavior that reads validated query params and returns standardized `{ success, data, meta }` when pagination is used in `backend/src/controllers/event.controller.js`
- [ ] T016 [US1] Implement service rule that only returns public events with `status = PUBLISHED` and `is_active = true` in `backend/src/services/event.service.js`
- [ ] T017 [US1] Implement repository data source for paginated public events in `backend/src/repositories/event.repository.js`; use Prisma/MySQL if ready, otherwise a temporary seed/mock repository that preserves the API contract
- [ ] T018 [US1] Map event records to camelCase public summaries without staff/internal/private fields in `backend/src/utils/event.mapper.js`
- [ ] T019 [US1] Implement frontend API client call to relative endpoint `/events` with `page` and `pageSize` in `frontend/src/api/eventApi.js`
- [ ] T020 [US1] Register or adjust frontend route `/events` to render Event List page in `frontend/src/App.js`

**Checkpoint**: Guest and Volunteer can load the public Event List independently of UC09/UC10/UC11/UC12.

---

## Phase 4: User Story 2 - Event cards và View Detail entry point (Priority: P1)

**Goal**: Mỗi event item hiển thị summary đủ rõ và có action/click navigation sang UC09 route `/events/:id` mà không render detail content trong UC08.

**Independent Test**: Load `/events` với event có đủ dữ liệu, thiếu image, thiếu optional fields; kiểm tra card vẫn ổn định và `View Detail` điều hướng đúng `/events/:id`.

### Tests for User Story 2

- [ ] T021 [P] [US2] Add or update EventCard rendering test for title, image fallback, organization, category, date/time, location, slots, and short description in `frontend/src/components/events/__tests__/EventCard.test.jsx` if test setup exists
- [ ] T022 [P] [US2] Add or update View Detail navigation test for `/events/:id` in `frontend/src/components/events/__tests__/EventCard.test.jsx` if test setup exists
- [ ] T023 [P] [US2] Add or update mapper test for `remainingSlots`, `displayStatus`, and camelCase summary fields in `backend/tests/events/event.mapper.test.js` if backend test setup exists

### Implementation for User Story 2

- [ ] T024 [US2] Derive `remainingSlots` and non-persistent `displayStatus` for event summaries in `backend/src/utils/event.mapper.js`
- [ ] T025 [US2] Normalize optional organization, category, skills, image, and short description fields for event cards in `backend/src/utils/event.mapper.js`
- [ ] T026 [US2] Implement reusable EventCard summary UI in `frontend/src/components/events/EventCard.jsx`
- [ ] T027 [US2] Implement image fallback behavior that avoids broken image UI in `frontend/src/components/events/EventCard.jsx`
- [ ] T028 [US2] Implement reusable EventList renderer for event arrays in `frontend/src/components/events/EventList.jsx`
- [ ] T029 [US2] Add `View Detail` link/action to `/events/:id` in `frontend/src/components/events/EventCard.jsx`; do not fetch or render UC09 detail content

**Checkpoint**: Event cards are useful summary entry points and UC08 still does not contain full Event Detail or Apply Event behavior.

---

## Phase 5: User Story 3 - Loading, empty, error states và pagination (Priority: P2)

**Goal**: Event List handles loading, empty, error, retry, and pagination/scalable loading while staying a base list foundation for later UC10/UC11 work.

**Independent Test**: Mock loading, empty result, API error, and multi-page data; verify UI states and page changes without adding full search/filter behavior.

### Tests for User Story 3

- [ ] T030 [P] [US3] Add or update frontend state tests for loading, empty, error, and retry in `frontend/src/components/events/__tests__/EventListState.test.jsx` if test setup exists
- [ ] T031 [P] [US3] Add or update frontend pagination tests in `frontend/src/components/pages/__tests__/EventListPage.test.jsx` if test setup exists
- [ ] T032 [P] [US3] Add or update backend pagination and invalid query tests in `backend/tests/events/event-list.test.js` if backend test setup exists

### Implementation for User Story 3

- [ ] T033 [US3] Implement EventListPage fetch lifecycle for loading, success, empty, error, retry, and page changes in `frontend/src/components/pages/EventListPage.jsx`
- [ ] T034 [US3] Implement reusable loading, empty, and error state component in `frontend/src/components/events/EventListState.jsx`
- [ ] T035 [US3] Implement pagination UI based on `page`, `pageSize`, `totalItems`, and `totalPages` in `frontend/src/components/events/EventPagination.jsx`
- [ ] T036 [US3] Wire EventListPage to EventList, EventListState, EventPagination, and eventApi without adding full UC10 search or UC11 filter behavior in `frontend/src/components/pages/EventListPage.jsx`
- [ ] T037 [US3] Return safe 422 validation errors for invalid pagination params in `backend/src/controllers/event.controller.js` and `backend/src/validators/event.validator.js`
- [ ] T038 [US3] Verify no UC08 code creates application records or calls `/events/:id/apply` in `frontend/src/api/eventApi.js` and `backend/src/routes/event.routes.js`

**Checkpoint**: UC08 has stable data states and pagination, and remains scoped to base Event List.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across UC08 without broadening scope or changing project-wide docs.

- [ ] T039 [P] Review UC08 scope boundaries against `.sdd/NamLD/UC08-feat-event-list/context.md`, `.sdd/NamLD/UC08-feat-event-list/spec.md`, and `.sdd/NamLD/UC08-feat-event-list/plan.md`
- [ ] T040 [P] Verify generated code uses canonical API only: frontend route `/events`, backend `GET /api/v1/events`, relative client endpoint `/events` in `frontend/src/api/eventApi.js` and `backend/src/routes/event.routes.js`
- [ ] T041 [P] Verify no deprecated or out-of-scope endpoints exist for UC08: `/events/search`, `/events/filter`, `/events/:id/apply` in `backend/src/routes/` and `frontend/src/api/`
- [ ] T042 Run available focused backend verification for UC08 using the existing command from `backend/package.json`; if no test setup exists, document manual backend verification results in implementation notes
- [ ] T043 Run available focused frontend verification/build check for UC08 using the existing command from `frontend/package.json`; if no test setup exists, document manual frontend verification results in implementation notes
- [ ] T044 Final UC08 readiness review for public access, public-only visibility, card summaries, detail navigation, list states, pagination, and scope guard in `.sdd/NamLD/UC08-feat-event-list/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
- **Polish (Phase 6)**: Depends on all selected user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: MVP. Can start after Foundational. Provides public API access and `/events` route.
- **User Story 2 (P1)**: Can start after Foundational, but frontend integration benefits from US1 API shape. Does not depend on UC09 implementation beyond route target `/events/:id`.
- **User Story 3 (P2)**: Can start after Foundational, but final wiring depends on US1 API client/page and US2 list/card components.

### Within Each User Story

- Tests or verification tasks should be prepared before implementation when the repo already has test setup.
- Backend validation before controller/service behavior.
- Service visibility rules before repository/data source is trusted by frontend.
- API client before page integration.
- Card/list components before page wiring.
- Pagination/state components before final EventListPage integration.

### Parallel Opportunities

- T002 and T003 can run in parallel with T001.
- T006 and T007 can run in parallel after Setup.
- T010, T011, and T012 can run in parallel for US1 tests.
- T021, T022, and T023 can run in parallel for US2 tests.
- T030, T031, and T032 can run in parallel for US3 tests.
- T039, T040, and T041 can run in parallel during Polish.

---

## Parallel Example: User Story 1

```bash
Task: "Add or update backend public access test for GET /api/v1/events in backend/tests/events/event-list.test.js"
Task: "Add or update backend visibility rule test for PUBLISHED and active events only in backend/tests/events/event-list.test.js"
Task: "Add or update frontend page access test for /events without login in frontend/src/components/pages/__tests__/EventListPage.test.jsx"
```

---

## Parallel Example: User Story 2

```bash
Task: "Add or update EventCard rendering test in frontend/src/components/events/__tests__/EventCard.test.jsx"
Task: "Add or update View Detail navigation test in frontend/src/components/events/__tests__/EventCard.test.jsx"
Task: "Add or update mapper test in backend/tests/events/event.mapper.test.js"
```

---

## Parallel Example: User Story 3

```bash
Task: "Add or update frontend state tests in frontend/src/components/events/__tests__/EventListState.test.jsx"
Task: "Add or update frontend pagination tests in frontend/src/components/pages/__tests__/EventListPage.test.jsx"
Task: "Add or update backend pagination and invalid query tests in backend/tests/events/event-list.test.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. STOP and VALIDATE: Guest and Volunteer can open `/events`; backend `GET /api/v1/events` returns only `PUBLISHED` active events; no login is required.
5. Demo MVP before adding card polish and pagination behavior.

### Incremental Delivery

1. Add User Story 1 -> public list API and route work independently.
2. Add User Story 2 -> useful EventCard summaries and View Detail route to `/events/:id`.
3. Add User Story 3 -> loading/empty/error states and pagination.
4. Validate after each story so UC08 never expands into UC09 detail, UC10 search, UC11 filter, or UC12 apply.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together.
2. Developer A: US1 backend public API and access.
3. Developer B: US2 EventCard/EventList summary UI.
4. Developer C: US3 states and pagination.
5. Integrate through EventListPage and eventApi only after story checkpoints pass.

---

## Notes

- UC08 scope is base Event List only.
- Public access means Guest and Volunteer can view `/events` without UC08 requiring login.
- Backend must expose canonical `GET /api/v1/events`; frontend API client should call relative `/events` when base URL already includes `/api/v1`.
- Do not create `/events/search`, `/events/filter`, or `/events/:id/apply`.
- Do not implement UC09 detail content, UC10 full search behavior, UC11 full filter behavior, or UC12 Apply Event inside UC08.
- Do not create migrations, install packages, commit, or edit source code while generating this task document.

# **LANGUAGE**: Tài liệu này được viết bằng tiếng Việt, giữ nguyên technical terms bằng English như API, endpoint, route, validation, repository, mock, seed, response, etc.

---

description: "Task list for UC09 - View Event Detail"
---

# Tasks: UC09 - View Event Detail

**Input**: Design documents from `.sdd/NamLD/UC09-feat-event-detail/`

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
- UC09 chỉ cập nhật task breakdown; không sửa source code, không tạo migration/schema, không install package, không commit.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm UC08/UC10/UC11 Event Discovery foundation and UC09 integration points before implementation. This phase does not install packages, create migrations, edit source code, or create new endpoints by itself.

- [ ] T001 Inspect backend event module conventions in `backend/src/routes/event.routes.js`, `backend/src/controllers/event.controller.js`, `backend/src/services/event.service.js`, `backend/src/repositories/event.repository.js`, `backend/src/validators/event.validator.js`, `backend/src/utils/event.mapper.js`, and `backend/src/utils/response.util.js`
- [ ] T002 [P] Inspect frontend route/page/component conventions in `frontend/src/App.js`, `frontend/src/components/pages/EventListPage.jsx`, `frontend/src/components/pages/EventDetailPage.jsx`, `frontend/src/components/events/EventCard.jsx`, and `frontend/src/api/eventApi.js`
- [ ] T003 [P] Inspect available test setup in `backend/package.json`, `frontend/package.json`, `backend/tests/events/`, `frontend/src/components/pages/__tests__/`, and `frontend/src/components/events/__tests__/`
- [ ] T004 Confirm canonical UC09 runtime contract in implementation notes for `.sdd/NamLD/UC09-feat-event-detail/tasks.md`: frontend route `/events/:id`, backend API `GET /api/v1/events/:id`, relative client endpoint `/events/:id`
- [ ] T005 Confirm UC09 scope guard in `.sdd/NamLD/UC09-feat-event-detail/tasks.md`: no `/events/:id/apply`, no application record, no UC12 Apply Event implementation, no migration/schema

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared route contract, validation, response shape, public visibility rule, and scope guard that MUST be respected before any user story implementation.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T006 Define backend path-param validation contract for positive integer `id` in `backend/src/validators/event.validator.js`; invalid `id` must return `422`
- [ ] T007 Define public detail service contract `getPublicEventDetail(eventId)` in `backend/src/services/event.service.js` with visibility rule `PUBLISHED`, active, and not soft-deleted
- [ ] T008 Define repository lookup contract for public event detail in `backend/src/repositories/event.repository.js`; missing or non-public event must return null/not found
- [ ] T009 Define canonical detail response mapping `{ success: true, data: { ...eventDetail } }` in `backend/src/controllers/event.controller.js`, `backend/src/utils/response.util.js`, and `frontend/src/api/eventApi.js`; do not use `data.event`
- [ ] T010 [P] Define event detail mapper expectations for camelCase fields, `remainingSlots`, `displayStatus`, and optional fields in `backend/src/utils/event.mapper.js`
- [ ] T011 Confirm UC09 public access has no auth middleware or login redirect in `backend/src/routes/event.routes.js`, `frontend/src/App.js`, and `frontend/src/api/eventApi.js`
- [ ] T012 Confirm storage strategy in `backend/src/repositories/event.repository.js`: use MySQL/Prisma if foundation is ready, otherwise seed/mock repository temporarily while preserving `GET /api/v1/events/:id` contract
- [ ] T013 Confirm forbidden endpoints and actions are not introduced in UC09: `/events/:id/apply`, `/events/search`, `/events/filter`, application create calls, and Staff CRUD in `backend/src/routes/event.routes.js` and `frontend/src/api/eventApi.js`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Guest xem public Event Detail (Priority: P1) MVP

**Goal**: Guest mở `/events/:id`, backend trả public event detail từ `GET /api/v1/events/:id`, không require login, không redirect sang `/login`.

**Independent Test**: Khi chưa đăng nhập, mở `/events/:id` với public event id; request gọi `GET /api/v1/events/:id`, response là `{ success: true, data: { ...eventDetail } }`, và UI hiển thị detail cơ bản.

### Tests for User Story 1

- [ ] T014 [P] [US1] Add or update backend public access success test for `GET /api/v1/events/:id` in `backend/tests/events/event-detail.test.js` if backend test setup exists
- [ ] T015 [P] [US1] Add or update backend response-shape test for direct `data` event detail and no `data.event` in `backend/tests/events/event-detail.test.js` if backend test setup exists
- [ ] T016 [P] [US1] Add or update frontend Guest route access test for `/events/:id` without login in `frontend/src/components/pages/__tests__/EventDetailPage.test.jsx` if frontend test setup exists

### Implementation for User Story 1

- [ ] T017 [US1] Register or confirm public backend route `GET /events/:id` under `/api/v1/events` without `authenticate` middleware in `backend/src/routes/event.routes.js`
- [ ] T018 [US1] Implement positive integer `id` validation and `422` invalid-id handling in `backend/src/validators/event.validator.js` and `backend/src/controllers/event.controller.js`
- [ ] T019 [US1] Implement thin `getPublicEventDetail` controller that reads validated `id`, calls service, and returns standard response in `backend/src/controllers/event.controller.js`
- [ ] T020 [US1] Implement public detail service lookup with `PUBLISHED`, active, not soft-deleted visibility rule in `backend/src/services/event.service.js`
- [ ] T021 [US1] Implement repository lookup for event detail by id using DB if ready or seed/mock repository if not ready in `backend/src/repositories/event.repository.js`
- [ ] T022 [US1] Map public event detail to camelCase direct `data` response in `backend/src/utils/event.mapper.js`
- [ ] T023 [US1] Add `eventApi.getEventDetail(id)` calling relative `/events/${id}` in `frontend/src/api/eventApi.js`
- [ ] T024 [US1] Register public frontend route `/events/:id` to render Event Detail page in `frontend/src/App.js`
- [ ] T025 [US1] Create or update `EventDetailPage` to read route `id`, call `eventApi.getEventDetail(id)`, and render the successful public detail shell in `frontend/src/components/pages/EventDetailPage.jsx`

**Checkpoint**: Guest can open public Event Detail independently of UC12 and without login.

---

## Phase 4: User Story 2 - Volunteer xem full detail và Back to Events (Priority: P1)

**Goal**: Volunteer xem được detail fields đầy đủ khi data có sẵn, gồm title, description, organization, category, skills, date/time, location, capacity, remaining slots, deadline/status, image fallback, và Back to Events về `/events`.

**Independent Test**: Đăng nhập Volunteer, mở `/events/:id` với public event; verify all available public detail fields render, missing optional fields không crash, Back to Events quay về `/events`.

### Tests for User Story 2

- [ ] T026 [P] [US2] Add or update backend mapper test for detail fields, camelCase keys, `remainingSlots`, `displayStatus`, organization/category/skills, and optional fields in `backend/tests/events/event-detail.test.js` or `backend/tests/events/event.mapper.test.js` if backend test setup exists
- [ ] T027 [P] [US2] Add or update frontend detail content rendering test in `frontend/src/components/pages/__tests__/EventDetailPage.test.jsx` if frontend test setup exists
- [ ] T028 [P] [US2] Add or update frontend Back to Events navigation test in `frontend/src/components/pages/__tests__/EventDetailPage.test.jsx` if frontend test setup exists
- [ ] T029 [P] [US2] Add or update frontend image fallback/missing optional fields test in `frontend/src/components/pages/__tests__/EventDetailPage.test.jsx` if frontend test setup exists

### Implementation for User Story 2

- [ ] T030 [US2] Extend detail mapper for public fields `title`, `description`, `shortDescription`, `imageUrl`, `organization`, `category`, `skills`, `startDate`, `endDate`, `location`, `maxCapacity`, `approvedParticipants`, `remainingSlots`, `applicationDeadline`, `status`, and `displayStatus` in `backend/src/utils/event.mapper.js`
- [ ] T031 [US2] Ensure backend mapper hides or safely nulls missing optional fields without creating schema/migration in `backend/src/utils/event.mapper.js`
- [ ] T032 [US2] Ensure backend response excludes private/internal/staff-only fields in `backend/src/utils/event.mapper.js` and `backend/src/services/event.service.js`
- [ ] T033 [US2] Implement detail content layout using `EventDetailPage` and optional `EventDetail` component in `frontend/src/components/pages/EventDetailPage.jsx` and `frontend/src/components/events/EventDetail.jsx`
- [ ] T034 [US2] Render organization, category, skills, date/time, location, capacity, remaining slots, application deadline, and status/displayStatus when available in `frontend/src/components/events/EventDetail.jsx`
- [ ] T035 [US2] Implement image fallback and safe optional-section fallback/hide behavior in `frontend/src/components/events/EventDetail.jsx`
- [ ] T036 [US2] Add Back to Events link/action to `/events` in `frontend/src/components/pages/EventDetailPage.jsx`
- [ ] T037 [US2] Preserve existing EventCard `View Detail` navigation to `/events/:id` from UC08/UC10/UC11 entry points in `frontend/src/components/events/EventCard.jsx`

**Checkpoint**: Volunteer sees useful public event detail and can return to the Event List without UC09 owning list/search/filter behavior.

---

## Phase 5: User Story 3 - States, visibility errors, and Apply boundary (Priority: P1)

**Goal**: UC09 handles invalid id, not found/non-public event, loading, error, retry, no-login public behavior, and optional Apply placeholder without implementing apply logic.

**Independent Test**: Open `/events/invalid`, missing event id, non-public event id, and a failing request; verify `422`/`404` behavior maps to UI states, Guest is not redirected to login, and no application API call or `/events/:id/apply` call exists.

### Tests for User Story 3

- [ ] T038 [P] [US3] Add or update backend invalid id test expecting `422` in `backend/tests/events/event-detail.test.js` if backend test setup exists
- [ ] T039 [P] [US3] Add or update backend missing/non-public event tests expecting `404` for missing, `DRAFT`, `COMPLETED`, `CANCELLED`, inactive, and soft-deleted events in `backend/tests/events/event-detail.test.js` if backend test setup exists
- [ ] T040 [P] [US3] Add or update frontend loading/error/not found/retry tests in `frontend/src/components/pages/__tests__/EventDetailPage.test.jsx` if frontend test setup exists
- [ ] T041 [P] [US3] Add or update frontend public-auth boundary test proving Guest is not redirected to `/login` for public detail states in `frontend/src/components/pages/__tests__/EventDetailPage.test.jsx` if frontend test setup exists
- [ ] T042 [P] [US3] Add or update frontend Apply-boundary test proving no application API call and no `/events/:id/apply` call in `frontend/src/components/pages/__tests__/EventDetailPage.test.jsx` if frontend test setup exists

### Implementation for User Story 3

- [ ] T043 [US3] Map missing and non-public event lookups to `404` without leaking private event existence in `backend/src/services/event.service.js` and `backend/src/controllers/event.controller.js`
- [ ] T044 [US3] Ensure invalid `id` returns `422` before repository lookup in `backend/src/validators/event.validator.js` and `backend/src/controllers/event.controller.js`
- [ ] T045 [US3] Implement loading, not found/unavailable, generic error, and retry UI states in `frontend/src/components/pages/EventDetailPage.jsx` and `frontend/src/components/events/EventDetailState.jsx`
- [ ] T046 [US3] Ensure public detail failures do not trigger session-expired popup or login redirect in `frontend/src/api/eventApi.js`, `frontend/src/api/axiosApi.js`, and `frontend/src/App.js`
- [ ] T047 [US3] Add optional Apply placeholder/entry-point display only if required by UI/spec, without implementing apply submission, in `frontend/src/components/events/EventDetail.jsx`
- [ ] T048 [US3] Verify UC09 frontend never calls `/events/:id/apply` and never creates application records in `frontend/src/api/eventApi.js` and `frontend/src/components/events/EventDetail.jsx`
- [ ] T049 [US3] Verify UC09 does not implement UC10 search, UC11 filter, or UC12 Apply logic in `frontend/src/components/pages/EventDetailPage.jsx`, `frontend/src/api/eventApi.js`, and `backend/src/routes/event.routes.js`

**Checkpoint**: UC09 has correct error/state behavior and preserves the UC12 boundary.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across UC09 without broadening scope or changing project-wide docs.

- [ ] T050 [P] Verify UC09 uses only frontend route `/events/:id`, backend `GET /api/v1/events/:id`, and relative client endpoint `/events/:id` in `frontend/src/App.js`, `frontend/src/api/eventApi.js`, and `backend/src/routes/event.routes.js`
- [ ] T051 [P] Verify no out-of-scope endpoint or action exists for UC09: `/events/:id/apply`, application creation, `/events/search`, `/events/filter`, Staff CRUD in `backend/src/routes/event.routes.js` and `frontend/src/api/eventApi.js`
- [ ] T052 [P] Verify canonical response shape `{ success: true, data: { ...eventDetail } }` is used consistently in `backend/src/controllers/event.controller.js`, `backend/src/utils/response.util.js`, and `frontend/src/api/eventApi.js`
- [ ] T053 [P] Review UC09 scope boundaries against `.sdd/NamLD/UC09-feat-event-detail/context.md`, `.sdd/NamLD/UC09-feat-event-detail/spec.md`, and `.sdd/NamLD/UC09-feat-event-detail/plan.md`
- [ ] T054 Run available focused backend verification for UC09 using the existing command from `backend/package.json`; if no test setup exists, document manual backend verification results in implementation notes
- [ ] T055 Run available focused frontend verification/build check for UC09 using the existing command from `frontend/package.json`; if no test setup exists, document manual frontend verification results in implementation notes
- [ ] T056 Final UC09 readiness review for public access, public-only visibility, invalid-id `422`, not-found/non-public `404`, direct `data` response, states, Back to Events, and Apply boundary in `.sdd/NamLD/UC09-feat-event-detail/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
- **Polish (Phase 6)**: Depends on all selected user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: MVP. Can start after Foundational and delivers public detail route/API/page shell.
- **User Story 2 (P1)**: Can start after Foundational, but final UI rendering depends on US1 response shape and page shell.
- **User Story 3 (P1)**: Can start after Foundational, but final state handling depends on US1 endpoint/page and US2 detail display components.

### Within Each User Story

- Tests or verification tasks should be prepared before implementation when test setup exists.
- Backend validator before controller/service behavior.
- Service public visibility rule before repository detail result is trusted.
- Mapper before frontend relies on final response fields.
- API client before page fetch wiring.
- EventDetailPage shell before detail content/states.
- Apply placeholder, if any, must remain display/navigation-only and never create application records.

### Parallel Opportunities

- T002 and T003 can run in parallel with T001.
- T006, T007, T008, and T010 can run in parallel after Setup.
- T014, T015, and T016 can run in parallel for US1 tests.
- T026, T027, T028, and T029 can run in parallel for US2 tests.
- T038, T039, T040, T041, and T042 can run in parallel for US3 tests.
- T050, T051, T052, and T053 can run in parallel during Polish.

---

## Parallel Example: User Story 1

```bash
Task: "Add or update backend public access success test for GET /api/v1/events/:id in backend/tests/events/event-detail.test.js"
Task: "Add or update backend response-shape test for direct data event detail in backend/tests/events/event-detail.test.js"
Task: "Add or update frontend Guest route access test for /events/:id without login in frontend/src/components/pages/__tests__/EventDetailPage.test.jsx"
```

---

## Parallel Example: User Story 2

```bash
Task: "Add or update backend mapper test for detail fields in backend/tests/events/event-detail.test.js"
Task: "Add or update frontend detail content rendering test in frontend/src/components/pages/__tests__/EventDetailPage.test.jsx"
Task: "Add or update frontend Back to Events navigation test in frontend/src/components/pages/__tests__/EventDetailPage.test.jsx"
```

---

## Parallel Example: User Story 3

```bash
Task: "Add or update backend invalid id test expecting 422 in backend/tests/events/event-detail.test.js"
Task: "Add or update backend missing/non-public event tests expecting 404 in backend/tests/events/event-detail.test.js"
Task: "Add or update frontend loading/error/not found/retry tests in frontend/src/components/pages/__tests__/EventDetailPage.test.jsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. STOP and VALIDATE: Guest can open `/events/:id`, backend calls `GET /api/v1/events/:id`, response is `{ success: true, data: { ...eventDetail } }`, and no login is required.
5. Demo MVP before adding full detail polish, state handling, and Apply placeholder boundary.

### Incremental Delivery

1. Add User Story 1 -> public detail route/API/page shell works.
2. Add User Story 2 -> Volunteer sees full public detail content and Back to Events behavior.
3. Add User Story 3 -> invalid id, 404, loading/error/not found states, public-auth boundary, and Apply boundary are verified.
4. Validate after each story so UC09 never expands into UC10 search, UC11 filter, UC12 Apply Event, or Staff CRUD.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together.
2. Developer A: US1 backend public detail endpoint and route shell.
3. Developer B: US2 detail content rendering and mapper fields.
4. Developer C: US3 state handling, auth boundary, and Apply boundary verification.
5. Integrate through `EventDetailPage`, `eventApi.getEventDetail(id)`, and canonical `GET /events/:id` only after story checkpoints pass.

---

## Notes

- UC09 scope is View Event Detail at frontend route `/events/:id`.
- Backend canonical endpoint is `GET /api/v1/events/:id`; frontend client calls relative `/events/:id`.
- Canonical response shape is `{ success: true, data: { ...eventDetail } }`.
- Guest and Volunteer can view public event detail without UC09 requiring login.
- Event detail must remain public-only: `PUBLISHED`, active, not soft-deleted.
- Invalid `id` returns `422`; missing or non-public event returns `404`.
- UC09 needs loading/error/not found states and Back to Events link to `/events`.
- Apply placeholder is allowed only as display/entry-point guidance; UC09 must not implement apply logic.
- Do not call `/events/:id/apply`.
- Do not create application records.
- Do not implement UC12 Apply Event inside UC09.
- Do not create migrations, install packages, commit, or edit source code while generating this task document.

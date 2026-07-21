# Tasks: Add Event (UC15)

**Input**: Design documents from `.sdd/DucNM/UC15-feat-add-event/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure. UC15 reuses existing Event module infrastructure.

- [x] T001 [P] Verify existing Event module structure (event.repository.js, event.service.js, event.controller.js, event.routes.js, event.validator.js)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure for UC15 - Add Event

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Add `createEvent` function to event.repository.js in backend/src/repositories/event.repository.js
- [x] T003 Add `createEventSchema` to event.validator.js in backend/src/middlewares/validators/event.validator.js
- [x] T004 Add `createEventHandler` to event.controller.js in backend/src/controllers/event.controller.js
- [x] T005 Add `createEvent` business logic to event.service.js in backend/src/services/event.service.js
- [x] T006 Add POST `/` route to event.routes.js in backend/src/routes/event.routes.js

---

## Phase 3: User Story 1 - Tạo sự kiện cơ bản thành công (Priority: P1) 🎯 MVP

**Goal**: Staff có thể nhập các thông tin cơ bản (Tên, ngày, địa điểm, mô tả, danh mục) để tạo một sự kiện mới.

**Independent Test**: POST /api/v1/events với dữ liệu hợp lệ → 201 Created với thông tin sự kiện mới.

### Implementation for User Story 1

- [x] T007 [US1] Add `createEvent` function in event.repository.js: Prisma create with proper select fields
- [x] T008 [US1] Add `createEventSchema` in event.validator.js with Zod validation (title 10-500, description 50-5000, dates, location, maxCapacity 1-10000, categoryId, imageUrl optional)
- [x] T009 [US1] Add `createEvent` business logic in event.service.js: validate category exists, validate dates, extract createdBy from JWT, call repository, format response
- [x] T010 [US1] Add `createEventHandler` in event.controller.js: parse body, call service, return 201 response
- [x] T011 [US1] Add POST `/` route in event.routes.js: authMiddleware, authorize("STAFF"), validate(createEventSchema), createEventHandler

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T012 [P] Add Swagger JSDoc documentation for POST /api/v1/events in event.routes.js

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **Polish (Final Phase)**: Depends on User Story 1 being complete

### Within Each User Story

- Repository → Validator → Service → Controller → Routes

### Parallel Opportunities

- T002, T003, T007 can run in parallel (different files)
- T008, T009 can run in parallel (validator and service are different concerns)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Done (MVP!)
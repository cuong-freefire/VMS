# Tasks: Delete Event (UC17)

**Input**: Design documents from `.sdd/TienTD/UC17-feat-delete-event/`

**Prerequisites**: plan.md (✅), spec.md (✅), research.md (✅), data-model.md (✅), contracts/ (✅)

**Tests**: Test tasks are included per functional requirements

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths adjusted based on plan.md structure (backend/frontend split)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database migration and basic structure for soft delete

- [ ] T001 Create Prisma migration for `deleted_at` column in backend/prisma/migrations/
- [ ] T002 Add index for `deleted_at` and composite index for active events lookup in migration
- [ ] T003 [P] Update Prisma schema file with `deleted_at` field in backend/prisma/schema.prisma

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core soft delete infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Run Prisma migration to apply `deleted_at` column to events table: `npx prisma migrate dev`
- [ ] T005 [P] Create validation helper `validateDeletableStatus()` in backend/src/utils/event.util.js
- [ ] T006 [P] Create validation helper `validateNoApplications()` in backend/src/utils/event.util.js
- [ ] T007 [P] Update all existing event queries to add `deleted_at: null` filter in backend/src/repositories/event.repository.js
- [ ] T008 Update EventService.getAllEvents() to exclude soft-deleted events in backend/src/services/event.service.js
- [ ] T009 Update EventService.getEventById() to exclude soft-deleted events in backend/src/services/event.service.js

**Checkpoint**: Foundation ready - soft delete infrastructure is in place, existing queries filter deleted events

---

## Phase 3: User Story 1 - Xóa sự kiện nháp (Draft) thành công (Priority: P1) 🎯 MVP

**Goal**: Staff có thể xóa sự kiện ở trạng thái DRAFT/PUBLISHED/CANCELLED chưa có đơn đăng ký

**Independent Test**: 
1. Đăng nhập với quyền Staff
2. Tìm sự kiện DRAFT chưa có application
3. Gọi DELETE /api/v1/events/:id
4. Verify HTTP 200 OK và sự kiện không còn trong danh sách

### Implementation for User Story 1

- [ ] T010 [P] [US1] Implement `EventRepository.softDelete()` method in backend/src/repositories/event.repository.js
- [ ] T011 [P] [US1] Implement `EventRepository.countApplications()` method in backend/src/repositories/event.repository.js
- [ ] T012 [US1] Implement `EventService.deleteEvent()` with transaction logic in backend/src/services/event.service.js
- [ ] T013 [US1] Add ownership validation (organization_id check) in EventService.deleteEvent()
- [ ] T014 [US1] Add status validation using validateDeletableStatus() in EventService.deleteEvent()
- [ ] T015 [US1] Add application count check using validateNoApplications() in EventService.deleteEvent()
- [ ] T016 [US1] Add audit log creation in EventService.deleteEvent() transaction
- [ ] T017 [US1] Implement `EventController.deleteEvent()` handler in backend/src/controllers/event.controller.js
- [ ] T018 [US1] Add DELETE /:id route with authenticate + authorizeStaff middleware in backend/src/routes/event.routes.js
- [ ] T019 [US1] Add Swagger JSDoc annotation for DELETE endpoint per contracts/DELETE-events-id.md
- [ ] T020 [US1] Add error handling for NotFoundError, ForbiddenError, ConflictError in controller

**Checkpoint**: Backend API can soft delete events with proper validation

### Tests for User Story 1

- [ ] T021 [P] [US1] Unit test: EventService.deleteEvent() success case for DRAFT status in backend/tests/unit/services/event.service.delete.test.js
- [ ] T022 [P] [US1] Unit test: EventService.deleteEvent() blocks delete with applications in backend/tests/unit/services/event.service.delete.test.js
- [ ] T023 [P] [US1] Unit test: EventService.deleteEvent() blocks delete for IN_PROGRESS/COMPLETED in backend/tests/unit/services/event.service.delete.test.js
- [ ] T024 [P] [US1] Integration test: DELETE /api/v1/events/:id success (200 OK) in backend/tests/integration/event.delete.test.js
- [ ] T025 [P] [US1] Integration test: DELETE returns 404 for non-existent event in backend/tests/integration/event.delete.test.js
- [ ] T026 [P] [US1] Integration test: DELETE returns 403 for wrong organization in backend/tests/integration/event.delete.test.js
- [ ] T027 [P] [US1] Integration test: DELETE returns 409 for event with applications in backend/tests/integration/event.delete.test.js
- [ ] T028 [P] [US1] Integration test: Verify audit log created after delete in backend/tests/integration/event.delete.test.js

**Checkpoint**: US1 fully tested - Staff can delete DRAFT events without applications

---

## Phase 4: User Story 2 - Frontend Delete UI (Priority: P1)

**Goal**: Staff có giao diện để xóa sự kiện với confirmation modal

**Independent Test**:
1. Đăng nhập với quyền Staff trên UI
2. Navigate to Event Management page
3. Click "Delete" button trên một sự kiện DRAFT
4. Confirm trong modal popup
5. Verify sự kiện biến mất khỏi danh sách

### Implementation for User Story 2

- [ ] T029 [P] [US2] Create `deleteEvent(eventId)` API call in frontend/src/services/eventApi.js
- [ ] T030 [P] [US2] Create DeleteEventModal component in frontend/src/components/pages/EventManagement/DeleteEventModal.jsx
- [ ] T031 [US2] Add delete button to EventList/EventCard component in frontend/src/components/pages/EventManagement/
- [ ] T032 [US2] Integrate DeleteEventModal with delete button (show/hide logic)
- [ ] T033 [US2] Add error handling for 403 Forbidden (show "No permission" message)
- [ ] T034 [US2] Add error handling for 409 Conflict (show "Event has applications" message)
- [ ] T035 [US2] Add success toast notification after successful delete
- [ ] T036 [US2] Refresh event list after successful delete (remove from local state)

**Checkpoint**: Frontend UI complete - Staff can delete events with proper feedback

### Tests for User Story 2

- [ ] T037 [P] [US2] Component test: DeleteEventModal renders confirmation text in frontend/src/components/pages/EventManagement/__tests__/DeleteEventModal.test.jsx
- [ ] T038 [P] [US2] Component test: DeleteEventModal calls deleteEvent on confirm in frontend/src/components/pages/EventManagement/__tests__/DeleteEventModal.test.jsx
- [ ] T039 [P] [US2] Component test: DeleteEventModal closes on cancel in frontend/src/components/pages/EventManagement/__tests__/DeleteEventModal.test.jsx
- [ ] T040 [P] [US2] Integration test: Delete button triggers modal in EventList in frontend/src/components/pages/EventManagement/__tests__/EventList.test.jsx

**Checkpoint**: US2 fully tested - Complete delete feature with UI

---

## Phase 5: Cross-Module Integration & Task Cleanup

**Purpose**: Handle related entities and cross-cutting concerns

**Goal**: Khi Event bị xóa, các Task liên quan được soft delete (FR-004)

- [ ] T041 [P] Check if TaskService exists and has softDeleteByEventId() method
- [ ] T042 If TaskService exists: Call TaskService.softDeleteByEventId(eventId) in EventService.deleteEvent() transaction
- [ ] T043 [P] Add integration test: Verify tasks soft-deleted when event deleted in backend/tests/integration/event.delete.cross-module.test.js
- [ ] T044 [P] Verify no hard deletes of financial/donation data (FR-016 compliance check)

**Checkpoint**: Cross-module integration complete

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, performance, and deployment readiness

- [ ] T045 [P] Update API documentation in share_context.md with DELETE endpoint contract
- [ ] T046 [P] Update CLAUDE.md Section 9 with UC17 implementation status (change from "Planning" to "Implemented")
- [ ] T047 [P] Add soft delete query pattern to AGENTS.md Anti-Patterns section
- [ ] T048 Run quickstart.md validation checklist (migration, tests, query filters)
- [ ] T049 Performance test: Verify DELETE API response < 500ms (p95) per plan.md goal
- [ ] T050 [P] Security audit: Verify no sensitive data in delete operation logs (SC-006)
- [ ] T051 Code review: Verify ALL event queries include `deleted_at: null` filter

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-4)**: All depend on Foundational phase completion
  - US1 (Backend API) and US2 (Frontend UI) can proceed in parallel after Phase 2
  - US2 requires US1 API for integration testing
- **Cross-Module (Phase 5)**: Depends on US1 completion (EventService.deleteEvent exists)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (Backend API)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (Frontend UI)**: Can start after Foundational (Phase 2) - Requires US1 API for end-to-end testing

### Within Each User Story

- Implementation tasks before test tasks (need code to test)
- Repository methods before Service methods
- Service methods before Controller handlers
- Controller handlers before Route registration
- Backend API (US1) complete before Frontend integration testing (US2)

### Parallel Opportunities

- **Phase 1 Setup**: T001, T002, T003 can all run in parallel (different concerns)
- **Phase 2 Foundational**: T005, T006, T007, T008, T009 can run in parallel after T004 (migration applied)
- **Phase 3 US1 Implementation**: T010, T011 can run in parallel (different repository methods)
- **Phase 3 US1 Tests**: T021-T028 can all run in parallel (different test files/test cases)
- **Phase 4 US2 Implementation**: T029, T030 can run in parallel (API client vs component)
- **Phase 4 US2 Tests**: T037-T040 can all run in parallel (different component tests)
- **Phase 5 Cross-Module**: T041, T044 can run in parallel (read-only checks)
- **Phase 6 Polish**: T045, T046, T047, T050 can all run in parallel (different documentation files)

---

## Parallel Example: User Story 1 Implementation

```bash
# Launch repository methods in parallel:
Task T010: "Implement EventRepository.softDelete()"
Task T011: "Implement EventRepository.countApplications()"

# Launch all US1 tests in parallel after implementation:
Task T021: "Unit test: success case for DRAFT"
Task T022: "Unit test: blocks delete with applications"
Task T023: "Unit test: blocks IN_PROGRESS/COMPLETED"
Task T024: "Integration test: 200 OK"
Task T025: "Integration test: 404 not found"
Task T026: "Integration test: 403 forbidden"
Task T027: "Integration test: 409 conflict"
Task T028: "Integration test: audit log"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003) - Database migration ready
2. Complete Phase 2: Foundational (T004-T009) - Query filters updated, soft delete foundation
3. Complete Phase 3: User Story 1 (T010-T028) - Backend API with full test coverage
4. **STOP and VALIDATE**: Run all US1 tests, verify API works with Postman
5. Optional: Deploy backend for testing before building frontend

### Incremental Delivery

1. Complete Setup + Foundational (Phase 1-2) → Soft delete infrastructure ready
2. Add User Story 1 (Phase 3) → Test with Postman → Backend API complete (MVP!)
3. Add User Story 2 (Phase 4) → Test in browser → Full feature complete
4. Add Cross-Module Integration (Phase 5) → Test task cleanup → Production-ready
5. Polish (Phase 6) → Documentation updated → Deployment-ready

### Parallel Team Strategy

With 2 developers:

1. Both complete Setup + Foundational together (Phase 1-2)
2. Once Foundational is done:
   - Developer A: User Story 1 (Backend API) - Phase 3
   - Developer B: Can start User Story 2 (Frontend UI) - Phase 4 in parallel, mock API initially
3. After US1 complete, Developer B integrates real API
4. Both validate Cross-Module Integration (Phase 5)
5. Both contribute to Polish (Phase 6)

---

## Task Summary

**Total Tasks**: 51
- Phase 1 (Setup): 3 tasks
- Phase 2 (Foundational): 6 tasks
- Phase 3 (US1 Backend): 19 tasks (11 implementation + 8 tests)
- Phase 4 (US2 Frontend): 12 tasks (8 implementation + 4 tests)
- Phase 5 (Cross-Module): 4 tasks
- Phase 6 (Polish): 7 tasks

**Parallel Opportunities**: 28 tasks marked [P] can run concurrently

**Critical Path**: Setup → Foundational → US1 Implementation → US1 Tests → US2 Integration → Polish

**MVP Scope**: Phase 1-3 only (Database migration + Backend API + Tests) = 28 tasks

**Independent Test Criteria**:
- US1: Backend API returns correct status codes, validates ownership, blocks invalid deletes, creates audit logs
- US2: Frontend shows confirmation modal, handles errors gracefully, updates UI after delete

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [US1] = Backend API implementation
- [US2] = Frontend UI implementation
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **CRITICAL**: Phase 2 Task T007 must update ALL event queries to prevent showing deleted events
- Verify migration runs successfully before proceeding to implementation
- Follow contracts/DELETE-events-id.md for exact API specification

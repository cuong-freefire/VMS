# Tasks: Edit Event (UC16)

**Input**: Design documents from `.sdd/TienTD/UC16-feat-edit-event/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Tests are OPTIONAL for this feature based on SPEC.md. However, integration tests are strongly recommended per AGENTS.md Section 9 (80% coverage target for Service layer).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Backend follows layered architecture: Controller → Service → Repository
- Frontend follows React component structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database migration and project structure updates for UC16

- [ ] T001 Create database migration for `event_audit_log` table in backend/prisma/migrations/
- [ ] T002 Add `updated_by` field to `events` table in backend/prisma/schema.prisma
- [ ] T003 [P] Run Prisma migration: `npx prisma migrate dev --name add_event_audit_log`
- [ ] T004 [P] Update Prisma Client: `npx prisma generate`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core validation and utilities that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create `updateEventSchema` Zod validator in backend/src/middlewares/validators/event.validator.js
- [ ] T006 [P] Add helper function `extractPublicIdFromUrl()` in backend/src/utils/cloudinary.util.js (SKIPPED - Cloudinary not needed for MVP)
- [ ] T007 [P] Add helper function `extractChanges()` in backend/src/services/event.service.js (SKIPPED - audit log not in scope)
- [ ] T008 [P] Add helper function `getApprovedVolunteerIds()` in backend/src/services/event.service.js (SKIPPED - notification not in scope)
- [x] T009 Add `updateEvent` method in backend/src/repositories/event.repository.js

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Chỉnh sửa thông tin cơ bản thành công (Priority: P1) 🎯 MVP

**Goal**: Staff có thể cập nhật mô tả và số lượng Volunteer cần thiết của một sự kiện đang ở trạng thái `Draft`

**Independent Test**: 
1. Chọn một sự kiện ở trạng thái `Draft` từ danh sách quản lý
2. Thay đổi Description và Max Volunteers
3. Nhấn "Save Changes"
4. Quay lại trang chi tiết sự kiện để xác nhận dữ liệu đã được cập nhật

### Implementation for User Story 1

- [x] T010 [US1] Implement state validation logic in EventService.updateEvent() - validate NON_EDITABLE_STATUSES in backend/src/services/event.service.js
- [x] T011 [US1] Implement field restriction logic for PUBLISHED status (critical fields → PENDING_APPROVAL) in EventService.updateEvent() in backend/src/services/event.service.js
- [x] T012 [US1] Implement ownership validation in EventService.updateEvent() - check createdBy match in backend/src/services/event.service.js
- [x] T013 [US1] Implement runtime validations (max_capacity >= approved_participants, category active check) in backend/src/services/event.service.js
- [ ] T014 [US1] Implement image upload logic (upload-first pattern) with CloudinaryService in backend/src/services/event.service.js (SKIPPED - Cloudinary not implemented)
- [ ] T015 [US1] Implement transaction logic (update event + audit log) with Prisma in backend/src/services/event.service.js (SKIPPED - event_audit_log table not created)
- [ ] T016 [US1] Implement async old image cleanup (delete-after pattern) in backend/src/services/event.service.js (SKIPPED - Cloudinary not implemented)
- [ ] T017 [US1] Implement notification trigger logic in backend/src/services/event.service.js (SKIPPED - NotificationService not available)
- [x] T018 [US1] Create PATCH /events/:id endpoint in backend/src/controllers/event.controller.js
- [x] T019 [US1] Wire PATCH route with auth middleware and validator in backend/src/routes/event.routes.js
- [x] T020 [US1] Add Swagger JSDoc documentation for PATCH /events/:id in backend/src/routes/event.routes.js

### Integration Tests for User Story 1

- [ ] T021 [P] [US1] Integration test: PATCH /events/:id returns 200 with updated event for DRAFT status in backend/tests/integration/event.update.test.js
- [ ] T022 [P] [US1] Integration test: PATCH with invalid JWT returns 401 in backend/tests/integration/event.update.test.js
- [ ] T023 [P] [US1] Integration test: PATCH different org's event returns 403 in backend/tests/integration/event.update.test.js
- [ ] T024 [P] [US1] Integration test: PATCH IN_PROGRESS event returns 409 in backend/tests/integration/event.update.test.js
- [ ] T025 [P] [US1] Integration test: PATCH reduces max_capacity below approved_participants returns 409 in backend/tests/integration/event.update.test.js
- [ ] T026 [P] [US1] Integration test: Audit log records created for critical fields in backend/tests/integration/event.update.test.js

**Checkpoint**: At this point, User Story 1 backend should be fully functional - Staff can edit DRAFT events with ownership validation and audit logging

### Frontend for User Story 1

- [ ] T027 [P] [US1] Create StaffEventEditPage component skeleton in frontend/src/components/pages/StaffEventEditPage.jsx
- [ ] T028 [P] [US1] Create useEventForm custom hook for form state management in frontend/src/hooks/useEventForm.js
- [ ] T029 [US1] Extend EventFormFields component to support edit mode (prefill data) in frontend/src/components/ui/EventFormFields.jsx
- [ ] T030 [US1] Add PATCH /events/:id method to eventApi client in frontend/src/services/event.service.js
- [ ] T031 [US1] Implement form submission with image upload in StaffEventEditPage.jsx
- [ ] T032 [US1] Add state-based field restrictions UI (disable fields for PUBLISHED events) in StaffEventEditPage.jsx
- [ ] T033 [US1] Add confirmation dialog for time/location changes when event has volunteers in StaffEventEditPage.jsx
- [ ] T034 [US1] Add double-submit prevention (disable Save button after click) in StaffEventEditPage.jsx

**Checkpoint**: User Story 1 complete - Staff can edit DRAFT events via UI with full validation

---

## Phase 4: User Story 2 - Ngăn chặn chỉnh sửa ngày về quá khứ (Priority: P1)

**Goal**: Staff không được phép đổi ngày diễn ra sự kiện về một ngày trước ngày hiện tại

**Independent Test**:
1. Mở form chỉnh sửa một sự kiện
2. Chọn Start Date là ngày hôm qua
3. Nhấn "Save"
4. Kiểm tra thông báo lỗi hiển thị trên màn hình

### Implementation for User Story 2

- [ ] T035 [US2] Add date validation in updateEventSchema - start_date >= TODAY refine in backend/src/validators/event.validator.js
- [ ] T036 [US2] Add cross-field validation - end_date >= start_date in updateEventSchema in backend/src/validators/event.validator.js
- [ ] T037 [US2] Add cross-field validation - application_deadline < start_date in updateEventSchema in backend/src/validators/event.validator.js
- [ ] T038 [US2] Add runtime date conflict validation in EventService.updateEvent() in backend/src/services/event.service.js

### Integration Tests for User Story 2

- [ ] T039 [P] [US2] Integration test: PATCH with past start_date returns 400 validation error in backend/tests/integration/event.update.test.js
- [ ] T040 [P] [US2] Integration test: PATCH with end_date < start_date returns 400 validation error in backend/tests/integration/event.update.test.js
- [ ] T041 [P] [US2] Integration test: PATCH with application_deadline >= start_date returns 400 validation error in backend/tests/integration/event.update.test.js

**Checkpoint**: User Story 2 complete - Date validation prevents setting past dates and enforces date constraints

### Frontend for User Story 2

- [ ] T042 [US2] Add client-side date validation in EventFormFields.jsx (min date = today for start_date)
- [ ] T043 [US2] Add real-time validation feedback for date fields in useEventForm.js
- [ ] T044 [US2] Display user-friendly error messages for date validation failures in StaffEventEditPage.jsx

**Checkpoint**: All user stories complete - Full edit functionality with comprehensive validation

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T045 [P] Update API_CONTRACTS.md with PATCH /events/:id endpoint documentation
- [ ] T046 [P] Update share_context.md with EventService.updateEvent() contract and NotificationService contract
- [ ] T047 [P] Add NotificationService.sendEventChangeNotification() contract definition in share_context.md
- [ ] T048 Verify Swagger UI documentation renders correctly at http://localhost:5000/api-docs
- [ ] T049 [P] Add error handling for Cloudinary upload failures with rollback in EventService.updateEvent()
- [ ] T050 [P] Add error handling for NotificationService failures (log but don't block update) in EventService.updateEvent()
- [ ] T051 Run quickstart.md validation - verify all setup steps work correctly
- [ ] T052 [P] Code review: Check ADR compliance (ADR-001 Prisma, ADR-002 JWT, ADR-003 Zod, ADR-005 Soft Delete)
- [ ] T053 [P] Security review: Verify ownership checks, input validation, SQL injection prevention
- [ ] T054 Performance test: Verify API response time < 1.5s (SC-001 requirement)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 and User Story 2 are both P1 priority but can proceed sequentially
  - US2 extends US1 validation logic, so US1 should complete first
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Should start after User Story 1 backend complete - Extends date validation in same validator file

### Within Each User Story

- Backend implementation before frontend
- Service layer before controller layer
- Routes after controller
- Integration tests after implementation
- Frontend API client before UI components
- Form state management before form UI

### Parallel Opportunities

- T001, T002 can run in parallel (different files)
- T003, T004 can run in parallel after T001, T002 complete
- T005, T006, T007, T008 can run in parallel (different files)
- T021-T026 integration tests can run in parallel (different test cases)
- T027, T028 can run in parallel (different files)
- T039-T041 integration tests can run in parallel (different test cases)
- T045-T047 documentation updates can run in parallel (different files)
- T049, T050, T052, T053 can run in parallel (different concerns)

---

## Parallel Example: User Story 1 Backend Tests

```bash
# Launch all integration tests for User Story 1 together:
Task T021: "Integration test: PATCH /events/:id returns 200 with updated event for DRAFT status"
Task T022: "Integration test: PATCH with invalid JWT returns 401"
Task T023: "Integration test: PATCH different org's event returns 403"
Task T024: "Integration test: PATCH IN_PROGRESS event returns 409"
Task T025: "Integration test: PATCH reduces max_capacity below approved_participants returns 409"
Task T026: "Integration test: Audit log records created for critical fields"
```

---

## Parallel Example: User Story 1 Frontend Components

```bash
# Launch frontend components for User Story 1 together:
Task T027: "Create StaffEventEditPage component skeleton"
Task T028: "Create useEventForm custom hook for form state management"
```

---

## Implementation Strategy

### MVP First (User Story 1 Backend Only)

1. Complete Phase 1: Setup (T001-T004) → Database ready
2. Complete Phase 2: Foundational (T005-T009) → Validation and utilities ready
3. Complete Phase 3: User Story 1 Backend (T010-T020) → API functional
4. Complete Phase 3: User Story 1 Tests (T021-T026) → Verify API works
5. **STOP and VALIDATE**: Test backend API with Postman/curl
6. Deploy backend to staging if ready

### Full MVP (User Story 1 Complete)

1. Continue from MVP First above
2. Complete Phase 3: User Story 1 Frontend (T027-T034) → UI functional
3. **STOP and VALIDATE**: Test full user journey from UI
4. Deploy to staging

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 Backend → Test independently → Deploy API
3. Add User Story 1 Frontend → Test independently → Deploy full feature
4. Add User Story 2 → Test independently → Deploy enhanced validation
5. Complete Polish phase → Production-ready

### Parallel Team Strategy

With 2 developers:

1. Team completes Setup + Foundational together (T001-T009)
2. Once Foundational is done:
   - Developer A: User Story 1 Backend (T010-T026)
   - Developer B: User Story 1 Frontend (T027-T034) - can start after T020 complete
3. Both developers work on User Story 2 together (smaller scope)
4. Split Polish tasks

---

## Cross-Module Coordination

### NotificationService Contract (Member 5 - DucNM)

**Required by**: T017 (notification trigger logic)

**Contract Definition** (to be added to share_context.md):

```javascript
NotificationService.sendEventChangeNotification({
  eventId: number,
  eventTitle: string,
  changes: Array<{ field: string, oldValue: string, newValue: string }>,
  volunteerIds: Array<number>
}) → Promise<{ success: boolean, notified_count: number }>
```

**Coordination Points**:
- T017: EventService calls NotificationService
- T047: Document contract in share_context.md
- T050: Add error handling for notification failures

### CloudinaryService (Existing from UC15)

**Used by**: T014, T016

**Assumed Methods**:
- `CloudinaryService.upload(file)` → `{ secure_url, public_id }`
- `CloudinaryService.delete(publicId)` → `{ result: 'ok' | 'not found' }`

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently testable
- Commit after each task or logical group
- Stop at any checkpoint to validate functionality
- Follow AGENTS.md naming conventions: `[resource].[layer].js`
- Follow CLAUDE.md ADR guidelines for architecture decisions
- Target 80% test coverage for EventService per AGENTS.md Section 9

---

## Testing Checklist (Per AGENTS.md Section 9)

Before marking UC16 as complete, verify:

- [ ] Unit tests written and passing (80% coverage for EventService.updateEvent)
- [ ] Integration tests for all API endpoints (happy path + error paths)
- [ ] No linting/type errors (`npm run lint` passes)
- [ ] API endpoint documented in Swagger
- [ ] Error cases handled with proper HTTP status codes (400, 401, 403, 404, 409, 500)
- [ ] Audit log recorded for all critical field changes
- [ ] No TODO/FIXME comments in production code
- [ ] VMS domain rules enforced (state immutability, ownership, capacity constraints)

---

**Version**: 1.0  
**Generated**: 2026-06-29  
**Total Tasks**: 54  
**Estimated Effort**: 
- Backend: 6-8 hours (T010-T020, T035-T038)
- Testing: 2-3 hours (T021-T026, T039-T041)
- Frontend: 4-5 hours (T027-T034, T042-T044)
- Polish: 1-2 hours (T045-T054)
- **Total**: 13-18 hours for full implementation

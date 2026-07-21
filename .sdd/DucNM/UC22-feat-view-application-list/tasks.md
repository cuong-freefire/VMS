# Tasks: View Application List (UC22)

**Feature Branch**: `022-feat-view-application-list`  
**Created**: 2026-06-29  
**Status**: READY FOR IMPLEMENTATION

**Input**: Design documents from `.sdd/TienTD/UC22-feat-view-application-list/`

**Prerequisites**: 
- ✅ plan.md (complete)
- ✅ spec.md (complete - 2 user stories)
- ✅ research.md (complete - 5 RQs resolved)
- ✅ data-model.md (complete - schemas, indexes, DTOs)
- ✅ contracts/GET-events-eventId-applications.md (complete)
- ✅ quickstart.md (complete - setup guide)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, or SHARED)
- File paths follow VMS project structure: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Database migrations and basic project structure

**⚠️ Prerequisites**: MySQL 8.0+ running, Prisma CLI installed, `.env` configured

- [ ] T001 [SHARED] Verify Prisma schema có Application model với ApplicationStatus enum trong `backend/prisma/schema.prisma`
- [ ] T002 [SHARED] Create database migration file `backend/prisma/migrations/YYYYMMDD_add_application_indexes/migration.sql` với 3 composite indexes:
  - `idx_applications_event_status_created` on (event_id, status, created_at DESC)
  - `idx_applications_event_created` on (event_id, created_at DESC)
  - `idx_events_org` on (organization_id, is_active)
- [ ] T003 [SHARED] Apply migration: `cd backend && npx prisma migrate deploy && npx prisma generate`
- [ ] T004 [SHARED] Verify indexes exist: `SHOW INDEX FROM applications WHERE Key_name LIKE 'idx_applications_%';`

**Checkpoint**: Database schema và indexes ready → Can proceed to Foundational phase

---

## Phase 2: Foundational (Shared Infrastructure)

**Purpose**: Core infrastructure that BOTH user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend Foundation

- [ ] T005 [P] [SHARED] Create constants file `backend/src/constants/application.constants.js` với:
  - `USER_PUBLIC_PROFILE_SELECT` object (id, name, avatar_url only)
  - `APPLICATION_LIST_SELECT` object (id, status, notes, created_at)
  - `PAGINATION_DEFAULTS` object (DEFAULT_PAGE: 1, DEFAULT_LIMIT: 20, MAX_LIMIT: 100, MAX_PAGE: 1000)
  - `ApplicationStatus` enum (SUBMITTED, APPROVED, REJECTED)

- [ ] T006 [P] [SHARED] Create pagination utility `backend/src/utils/pagination.util.js` với function:
  - `calculatePagination(page, limit, total)` → returns { current_page, total_pages, total_records, limit }

- [ ] T007 [P] [SHARED] Create Zod validator `backend/src/validators/application.validator.js` với schemas:
  - `getApplicationsQuerySchema`: status (optional enum), page (1-1000, default 1), limit (1-100, default 20)
  - `eventIdParamSchema`: eventId (UUID format validation)

- [ ] T008 [SHARED] Create repository layer `backend/src/repositories/application.repository.js` với methods:
  - `findByEventId(eventId, filters, options)` → Prisma query với JOIN users + events, apply filters, pagination, sort by created_at DESC
  - `countByEventId(eventId, statusFilter)` → Prisma count query for pagination metadata
  - Use `USER_PUBLIC_PROFILE_SELECT` trong include.user.select để filter sensitive data

- [ ] T009 [SHARED] Create service layer `backend/src/services/application.service.js` với method:
  - `getApplicationsByEvent(eventId, staffOrgId, filters)` → Validate event ownership (Prisma nested where), call repository, calculate pagination, return DTO
  - Throw `ForbiddenError` nếu organization mismatch
  - Throw `BadRequestError` nếu page out of range

- [ ] T010 [SHARED] Create controller layer `backend/src/controllers/application.controller.js` với function:
  - `getApplicationsByEvent(req, res, next)` → Parse params/query, extract staffOrgId từ req.user, call service, return successResponse
  - Use try-catch và forward errors to next(error)

- [ ] T011 [SHARED] Create routes file `backend/src/routes/application.routes.js`:
  - `GET /events/:eventId/applications` → authenticate middleware, validate (eventIdParamSchema, getApplicationsQuerySchema), controller
  - Export router

- [ ] T012 [SHARED] Register routes trong `backend/src/app.js`:
  - Import applicationRoutes
  - Add `app.use('/api/v1', applicationRoutes);` sau existing routes

**Checkpoint**: Backend foundation ready → All US1/US2 backend tasks can now proceed

### Frontend Foundation

- [ ] T013 [P] [SHARED] Create API client `frontend/src/api/applicationApi.js`:
  - Function `getApplicationsByEvent(eventId, { status, page, limit })` → axios GET với withCredentials: true
  - Base URL từ `process.env.REACT_APP_API_BASE_URL`
  - Return response.data

- [ ] T014 [P] [SHARED] Create reusable UI components:
  - `frontend/src/components/ui/Pagination.jsx` → Material UI Pagination component với onPageChange callback
  - PropTypes: currentPage (number), totalPages (number), onPageChange (func)

**Checkpoint**: Foundation complete → User story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Xem danh sách đăng ký theo sự kiện (Priority: P1) 🎯 MVP

**Goal**: Staff chọn một sự kiện cụ thể và xem tất cả các đơn đăng ký của sự kiện đó, sorted by submission date (newest first), với pagination 20 records/page

**Independent Test**: 
1. Navigate to `/events/:eventId/applications`
2. Verify table displays applications với columns: Volunteer Name, Submission Date, Status
3. Verify default pagination (20 records/page, page 1)
4. Verify sorting (newest first)

### Backend Implementation for US1

- [ ] T015 [US1] Add Swagger JSDoc documentation trong `backend/src/controllers/application.controller.js`:
  - `@swagger` comment cho GET /api/v1/events/:eventId/applications
  - Document path params (eventId), query params (page, limit), auth requirement (cookieAuth), all response codes (200, 400, 401, 403, 404, 500)
  - Include example responses

- [ ] T016 [US1] Create seed script `backend/prisma/seed-applications.js` (for local testing):
  - Create 1 test organization, 1 test staff user, 1 test event
  - Create 50 test applications với mixed statuses (SUBMITTED, APPROVED, REJECTED)
  - Stagger created_at timestamps để test sorting

### Frontend Implementation for US1

- [ ] T017 [US1] Create ApplicationTable component `frontend/src/components/ui/ApplicationTable.jsx`:
  - Material UI Table với columns: Avatar, Volunteer Name, Submission Date, Status
  - Display loading spinner when loading=true
  - Display "No applications found" message khi applications.length === 0
  - Each row clickable → navigate to `/events/:eventId/applications/:applicationId` (UC23 - future)
  - PropTypes: applications (array), loading (bool)

- [ ] T018 [US1] Create ApplicationListPage component `frontend/src/components/pages/ApplicationListPage.jsx`:
  - Use `useParams()` to get eventId từ URL
  - Use `useSearchParams()` để read/write page và limit query params (NO status filter yet - that's US2)
  - `useState` for applications array, pagination metadata, loading state
  - `useEffect` to fetch data khi eventId, page, or limit changes
  - Call `getApplicationsByEvent(eventId, { page, limit })` - NO status param yet
  - Render ApplicationTable + Pagination components
  - Handle errors (401 → redirect to login, 403 → show "Access denied", 404 → show "Event not found")

- [ ] T019 [US1] Add route trong `frontend/src/App.js`:
  - `<Route path="/events/:eventId/applications" element={<ApplicationListPage />} />`
  - Wrap với ProtectedRoute (staff role required)

### Testing for US1

- [ ] T020 [US1] Write integration tests `backend/tests/integration/application.test.js`:
  - Test case: GET without JWT token → 401
  - Test case: GET với valid token và correct organization → 200 với paginated data
  - Test case: GET với wrong organization → 403
  - Test case: GET với invalid eventId format → 400
  - Test case: Verify sensitive data NOT exposed (no address, identity_card_number, phone_number, email trong volunteer object)
  - Test case: Verify pagination metadata (current_page, total_pages, total_records, limit)
  - Test case: Verify sorting (newest first - created_at DESC)
  - Run với: `cd backend && npm test -- application.test.js`

- [ ] T021 [P] [US1] Write frontend component tests `frontend/tests/components/ApplicationListPage.test.jsx`:
  - Test case: Renders loading spinner initially
  - Test case: Renders table với applications after fetch
  - Test case: Renders "No applications found" khi empty array
  - Test case: Pagination changes trigger URL update và re-fetch
  - Mock axios responses với jest.mock
  - Run với: `cd frontend && npm test -- ApplicationListPage.test.jsx`

**Checkpoint**: User Story 1 COMPLETE → Staff can view all applications for an event với pagination, sorted by newest first. Can deploy as MVP!

---

## Phase 4: User Story 2 - Lọc đơn đăng ký theo trạng thái (Priority: P1)

**Goal**: Staff filter danh sách để chỉ thấy các đơn ở trạng thái "SUBMITTED" (Đang chờ duyệt), "APPROVED", hoặc "REJECTED"

**Independent Test**:
1. At ApplicationListPage, select Filter "Status" dropdown → choose "Submitted"
2. Click "Apply" (or auto-apply on change)
3. Verify URL updates to `?status=SUBMITTED`
4. Verify table shows only SUBMITTED applications
5. Test với APPROVED và REJECTED status values

**Dependencies**: US2 builds on US1 foundation (adds filter capability to existing list view)

### Backend Implementation for US2

**NOTE**: Backend đã support status filtering từ Phase 2 (T008, T009) - NO NEW BACKEND CODE NEEDED for US2!

- [ ] T022 [US2] Verify backend accepts `status` query param và filters correctly:
  - Test manually: `curl "http://localhost:5000/api/v1/events/:eventId/applications?status=SUBMITTED" -H "Cookie: vms_access_token=..."`
  - Verify response chỉ chứa SUBMITTED applications

### Frontend Implementation for US2

- [ ] T023 [US2] Create FilterBar component `frontend/src/components/ui/FilterBar.jsx`:
  - Material UI Select dropdown với options: "All", "Submitted", "Approved", "Rejected"
  - Current value từ props: `status` (controlled component)
  - onChange callback: `onStatusChange(newStatus)`
  - PropTypes: status (string), onStatusChange (func)

- [ ] T024 [US2] Update ApplicationListPage component `frontend/src/components/pages/ApplicationListPage.jsx`:
  - ADD `status` to `useSearchParams()` reading (alongside page, limit)
  - ADD `status` to dependency array trong `useEffect` (trigger refetch khi status changes)
  - PASS `status` to API call: `getApplicationsByEvent(eventId, { status, page, limit })`
  - ADD FilterBar component above ApplicationTable
  - Implement `handleStatusChange(newStatus)` → `setSearchParams({ status: newStatus, page: 1, limit })` (reset to page 1)
  - Handle empty status string → show all (no filter)

### Testing for US2

- [ ] T025 [US2] Add integration tests to `backend/tests/integration/application.test.js`:
  - Test case: GET với `?status=SUBMITTED` → chỉ trả về SUBMITTED applications
  - Test case: GET với `?status=APPROVED` → chỉ trả về APPROVED applications
  - Test case: GET với `?status=REJECTED` → chỉ trả về REJECTED applications
  - Test case: GET với `?status=INVALID` → 400 Bad Request
  - Test case: Pagination + filter combined: `?status=SUBMITTED&page=2&limit=10` works correctly

- [ ] T026 [P] [US2] Update frontend component tests `frontend/tests/components/ApplicationListPage.test.jsx`:
  - Test case: Status filter changes URL query param
  - Test case: Filtered applications displayed after status change
  - Test case: Changing status resets to page 1
  - Test case: Browser back/forward preserves filter state

**Checkpoint**: User Story 2 COMPLETE → Staff can filter applications by status. Combined với US1, full feature is functional!

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, optimization, và final validation

### Documentation

- [ ] T027 [P] [SHARED] Update `API_CONTRACTS.md` hoặc `share_context.md`:
  - Add complete API contract cho `GET /api/v1/events/:eventId/applications`
  - Include endpoint, auth, query params, response format, error codes
  - Add curl examples

- [ ] T028 [P] [SHARED] Update `CLAUDE.md` Section 9 (Active Implementation Plans):
  - Document UC22 completion status
  - List key decisions: Prisma nested WHERE JOIN, offset-based pagination, database-level sensitive data filtering, URL query params
  - Note performance targets achieved: <1.2s for 50 records

### Performance & Security Validation

- [ ] T029 [SHARED] Run performance benchmark test:
  - Use Apache Bench: `ab -n 1000 -c 100 -H "Cookie: vms_access_token=..." http://localhost:5000/api/v1/events/:eventId/applications`
  - Verify p95 response time <200ms
  - Verify first 50 records load <1.2s (SC-001 from spec.md)

- [ ] T030 [SHARED] Security audit:
  - Verify `address`, `identity_card_number`, `phone_number` NEVER appear trong API response (manual test + integration test coverage)
  - Verify organization ownership validation prevents cross-org access (integration test coverage)
  - Check error responses không leak sensitive info (no stack traces)

### Code Quality

- [ ] T031 [P] [SHARED] Run linting và fix violations:
  - Backend: `cd backend && npm run lint`
  - Frontend: `cd frontend && npm run lint`

- [ ] T032 [P] [SHARED] Verify test coverage:
  - Backend Service layer coverage ≥80%: `cd backend && npm run test:coverage`
  - Frontend component coverage ≥70%: `cd frontend && npm run test:coverage`

### Final Validation

- [ ] T033 [SHARED] Run quickstart.md validation checklist:
  - Prerequisites ✓
  - Database migration ✓
  - Backend endpoints working ✓
  - Frontend UI functional ✓
  - All test cases passing ✓

- [ ] T034 [SHARED] Manual end-to-end test:
  - Login as Staff user
  - Navigate to event detail page → Click "View Applications"
  - Verify table displays với correct data
  - Test pagination (next page, previous page, jump to page 5)
  - Test status filter (All → Submitted → Approved → Rejected)
  - Test URL bookmarking (copy URL, open in new tab, verify same view)
  - Test browser back/forward buttons

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) 
  ↓
Phase 2 (Foundational) ← BLOCKS all user stories
  ↓
├─ Phase 3 (US1) ← Can start in parallel after Phase 2
└─ Phase 4 (US2) ← Depends on US1 (builds on same components)
  ↓
Phase 5 (Polish) ← Depends on all user stories complete
```

### Critical Path

**Sequential Dependencies** (must complete in order):
1. T001 → T002 → T003 → T004 (Database setup)
2. T004 → T005-T012 (Backend foundation - can parallelize within this group)
3. T012 → T015-T016 (US1 backend)
4. T013-T014 → T017-T019 (Frontend foundation + US1 frontend)
5. T019 → T023-T024 (US2 frontend builds on US1)

**Parallel Opportunities**:
- T005, T006, T007 can run in parallel (different files)
- T013, T014 can run in parallel (different files)
- T020, T021 can run in parallel (backend tests vs frontend tests)
- T025, T026 can run in parallel (backend tests vs frontend tests)
- T027, T028 can run in parallel (different docs)
- T031, T032 can run in parallel (linting vs coverage)

### Within Each User Story

**US1 Dependencies**:
- Foundation (T005-T014) → Backend (T015-T016) → Frontend (T017-T019) → Tests (T020-T021)

**US2 Dependencies**:
- US1 complete → Frontend changes only (T023-T024) → Tests (T025-T026)

---

## Parallel Execution Examples

### Example 1: Foundation Phase Parallelization

```bash
# Launch all parallel foundation tasks together:
Task T005: "Create constants file backend/src/constants/application.constants.js"
Task T006: "Create pagination utility backend/src/utils/pagination.util.js"
Task T007: "Create Zod validator backend/src/validators/application.validator.js"
Task T013: "Create API client frontend/src/api/applicationApi.js"
Task T014: "Create Pagination component frontend/src/components/ui/Pagination.jsx"
```

### Example 2: Testing Phase Parallelization

```bash
# Launch all US1 tests together:
Task T020: "Backend integration tests backend/tests/integration/application.test.js"
Task T021: "Frontend component tests frontend/tests/components/ApplicationListPage.test.jsx"
```

---

## Implementation Strategy

### MVP First (Deliver US1 Only)

**Timeline**: ~2-3 days for experienced developer

1. ✅ Complete Phase 1: Setup (Database migrations) - **4 tasks**
2. ✅ Complete Phase 2: Foundational (Backend + Frontend foundation) - **10 tasks**
3. ✅ Complete Phase 3: User Story 1 (View all applications với pagination) - **7 tasks**
4. **STOP and VALIDATE**: Test US1 independently
5. Deploy MVP: Staff can view applications với pagination và sorting

**Deliverable**: Functional application list view với pagination (no filtering yet)

### Full Feature (Add US2)

**Timeline**: +1 day to add filtering

1. ✅ MVP from above
2. ✅ Complete Phase 4: User Story 2 (Add status filtering) - **5 tasks**
3. **STOP and VALIDATE**: Test US2 independently và combined với US1
4. Deploy full feature

**Deliverable**: Full UC22 feature với filtering + pagination

### Polish & Release

**Timeline**: +0.5 day for polish

1. ✅ Full feature from above
2. ✅ Complete Phase 5: Polish (Documentation, performance, security) - **8 tasks**
3. Final validation per quickstart.md
4. Merge to Dev branch
5. Deploy to production

**Deliverable**: Production-ready UC22 với full documentation và test coverage

---

## Task Summary

**Total Tasks**: 34

**By Phase**:
- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 10 tasks
- Phase 3 (US1): 7 tasks
- Phase 4 (US2): 5 tasks
- Phase 5 (Polish): 8 tasks

**By Story**:
- SHARED (infrastructure): 22 tasks
- US1 (View all applications): 7 tasks
- US2 (Filter by status): 5 tasks

**Parallel Tasks**: 12 tasks marked [P] can run in parallel

**Estimated Effort**:
- Setup: 2 hours
- Foundational: 8 hours
- US1: 6 hours
- US2: 3 hours
- Polish: 4 hours
- **Total**: ~23 hours (3 days for single developer)

---

## Success Criteria Checklist

Per spec.md requirements:

- [ ] **SC-001**: Danh sách 50 ứng viên đầu tiên hiển thị trong <1.2s (verify với T029)
- [ ] **SC-002**: 100% dữ liệu khớp với thông tin Volunteer đã gửi (verify với integration tests T020)
- [ ] **SC-007**: Filter button không gửi request nếu Staff chưa thay đổi điều kiện (verify với frontend tests T026)
- [ ] **FR-001**: Organization ownership validated (verify với T020 test case "wrong organization → 403")
- [ ] **FR-016**: Sensitive data NOT exposed (verify với T020 test case "sensitive data protection" + T030 security audit)

---

## Notes

- Tests are INCLUDED (per VMS AGENTS.md: target 80% coverage cho Service layer, Definition of Done yêu cầu tests)
- All task descriptions include exact file paths
- Tasks organized by user story để enable independent implementation
- Each phase has clear checkpoint để validate before proceeding
- Parallel opportunities marked [P] để optimize development time
- Critical path identified để focus on blocking dependencies first

---

**Tasks.md Status**: READY FOR IMPLEMENTATION ✅

**Next Step**: Begin Phase 1 (Setup) hoặc toggle to Act mode để auto-execute tasks sequentially.

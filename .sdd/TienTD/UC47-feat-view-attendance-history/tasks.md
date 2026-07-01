# Tasks: View Attendance History (UC47)

**Feature Branch**: `047-feat-view-attendance-history`  
**Created**: 2026-06-30  
**Status**: READY FOR IMPLEMENTATION

**Input**: Design documents from `.sdd/TienTD/UC47-feat-view-attendance-history/`

**Prerequisites**: 
- ✅ plan.md (complete)
- ✅ research.md (complete - 4 RQs resolved)
- ✅ data-model.md (complete - NO migration needed, reuses UC15-UC45 schema)
- ✅ contracts/GET-attendances-events-eventId-history.md (complete)
- ✅ contracts/GET-attendances-volunteers-volunteerId-history.md (complete)
- ✅ quickstart.md (complete)
- ✅ SPEC.md (User Story 1 + 2, both P1 priority)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- File paths follow VMS project structure: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing schema and prepare for read-only history queries

**⚠️ Prerequisites**: MySQL 8.0+ running, Prisma CLI installed, UC15-UC45 completed

- [ ] T001 [P1] Verify database schema in `backend/prisma/schema.prisma` - CONFIRM tables exist:
  - `events` table with `organization_id`, `status`, `end_date`, `is_active`
  - `applications` table with `event_id`, `user_id`, `status`
  - `attendances` table with `application_id` (UNIQUE), `status`, `checked_in_at`, `volunteer_hours`
  - `users` table with `id`, `full_name`, `avatar_url`
  - NO NEW TABLES or COLUMNS needed

- [ ] T002 [P1] Verify database indexes exist for UC47 queries:
  - Run: `SHOW INDEX FROM events;` verify `idx_events_org_status_end`
  - Run: `SHOW INDEX FROM applications;` verify `idx_applications_event_status`, `idx_applications_user_status`
  - Run: `SHOW INDEX FROM attendances;` verify UNIQUE on `application_id`
  - All indexes from UC15-UC45 should be sufficient

- [ ] T003 [P1] Run Prisma introspection and regenerate client:
  - Run: `cd backend && npx prisma db pull`
  - Verify no schema drift warnings
  - Run: `npx prisma generate`
  - Confirm Prisma Client types updated

**Checkpoint**: Database verified, no migration needed → Can proceed to Backend implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared utilities and constants for attendance history

**⚠️ CRITICAL**: These must be complete before user story implementation

- [ ] T004 [P2] Create date utility functions in `backend/src/utils/date.util.js`:
  - Function: `applyDateDefaults(startDate, endDate)` - Apply smart defaults (last 6 months)
  - Function: `validateDateRange(startDate, endDate, maxDays = 730)` - Validate range <= 2 years
  - Function: `parseDateParam(dateString)` - Parse ISO 8601 to Date object
  - Export all functions as named exports

- [ ] T005 [P2] Add PII protection constant in `backend/src/constants/user.constant.js`:
  - Constant: `USER_PUBLIC_PROFILE_SELECT = { id: true, full_name: true, avatar_url: true }`
  - This is reused from UC22-UC25, verify it exists or create it

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Event-First Query (Priority: P1) 🎯

**Goal**: Staff chọn một sự kiện đã hoàn thành → Xem danh sách volunteers (cả present + absent)

**Independent Test**: GET `/api/v1/attendances/events/:eventId/history` → Returns event details + attendance list + summary

### Backend Implementation for User Story 1

- [ ] T006 [P] [US1] Add method `getByEventId(eventId, { limit, offset })` to `backend/src/repositories/attendance.repository.js`:
  - Query: LEFT JOIN applications → users, LEFT JOIN attendances
  - Filter: `WHERE event_id = ? AND application.status = 'APPROVED'`
  - Include: user public profile (id, full_name, avatar_url)
  - Include: attendance (status, checked_in_at, checked_in_by, volunteer_hours)
  - Apply pagination: `skip: offset, take: limit`
  - Order by: `application.created_at ASC`
  - Return: { attendances: [...], total: count }

- [ ] T007 [US1] Add method `getEventHistory(eventId, staffId, { limit = 50, offset = 0 })` to `backend/src/services/attendance.service.js`:
  - Step 1: Get Staff organization_id from userRepository
  - Step 2: Get event with eventRepository.getById(eventId)
  - Step 3: Validate event exists (throw NotFoundError if null)
  - Step 4: Validate event.organization_id === staff.organization_id (throw ForbiddenError if mismatch)
  - Step 5: Validate event.status === 'COMPLETED' (throw BadRequestError if not)
  - Step 6: Call attendanceRepository.getByEventId(eventId, { limit, offset })
  - Step 7: Transform response: map attendance to 'PRESENT'/'ABSENT', calculate summary counts
  - Return: { event, attendances, summary: { total_approved, present_count, absent_count }, pagination }

- [ ] T008 [US1] Add controller method `getEventHistory()` to `backend/src/controllers/attendance.controller.js`:
  - Extract eventId from req.params.eventId
  - Extract limit, offset from req.query (with defaults: 50, 0)
  - Call attendanceService.getEventHistory(eventId, req.user.id, { limit, offset })
  - Return successResponse with data + pagination
  - Error handling: catch NotFoundError (404), ForbiddenError (403), BadRequestError (400)

- [ ] T009 [US1] Add Zod validation schema `eventHistorySchema` in `backend/src/validators/attendance.validator.js`:
  - Validate eventId: UUID format (z.string().uuid())
  - Validate limit: integer, min 1, max 200, default 50
  - Validate offset: integer, min 0, default 0
  - Export as named export

- [ ] T010 [US1] Register route in `backend/src/routes/attendance.routes.js`:
  - Route: `GET /events/:eventId/history`
  - Middleware: authMiddleware, roleMiddleware(['STAFF', 'MANAGER', 'ADMIN'])
  - Middleware: validateRequest(eventHistorySchema)
  - Handler: attendanceController.getEventHistory
  - Verify route is registered in main router

- [ ] T011 [P] [US1] Write unit tests for `backend/tests/unit/repositories/attendance.repository.test.js`:
  - Test getByEventId() with valid eventId → returns attendances + total
  - Test getByEventId() with pagination → respects limit/offset
  - Test getByEventId() LEFT JOIN logic → includes volunteers without attendance
  - Mock Prisma client, target 80% coverage

- [ ] T012 [P] [US1] Write unit tests for `backend/tests/unit/services/attendance.service.test.js`:
  - Test getEventHistory() with COMPLETED event → returns data
  - Test getEventHistory() with IN_PROGRESS event → throws BadRequestError
  - Test getEventHistory() with wrong organization → throws ForbiddenError
  - Test getEventHistory() event not found → throws NotFoundError
  - Test getEventHistory() summary calculation → correct present/absent counts
  - Mock repositories, target 80% coverage

- [ ] T013 [P] [US1] Write integration tests for `backend/tests/integration/attendance.integration.test.js`:
  - Test GET /events/:eventId/history happy path → 200 OK with data
  - Test with invalid UUID → 400 Bad Request
  - Test with event not COMPLETED → 400 Bad Request
  - Test with wrong organization → 403 Forbidden
  - Test with event not found → 404 Not Found
  - Test pagination (offset=50) → correct page returned
  - Test limit validation (limit=250) → 400 Bad Request
  - Use Supertest, verify response structure matches contract

- [ ] T014 [US1] Add Swagger JSDoc documentation above `getEventHistory()` in `backend/src/controllers/attendance.controller.js`:
  - @swagger tag, @route GET /api/v1/attendances/events/{eventId}/history
  - @param eventId (path, UUID, required)
  - @query limit (integer, optional, default 50, max 200)
  - @query offset (integer, optional, default 0)
  - @responses 200 (success with example), 400, 403, 404, 500
  - Include request/response examples from contract doc

**Checkpoint**: User Story 1 complete - Event-First query fully functional and tested

---

## Phase 4: User Story 2 - Volunteer-First Query (Priority: P1) 🎯

**Goal**: Staff tìm kiếm volunteer → Xem danh sách events đã tham gia (chỉ hiện những event đã check-in)

**Independent Test**: GET `/api/v1/attendances/volunteers/:volunteerId/history` → Returns volunteer info + events attended + summary

### Backend Implementation for User Story 2

- [ ] T015 [P] [US2] Add method `getByVolunteerIdAndOrganization(volunteerId, organizationId, { startDate, endDate, limit, offset })` to `backend/src/repositories/attendance.repository.js`:
  - Query: INNER JOIN attendances → applications → events
  - Filter: `WHERE user_id = ? AND event.organization_id = ? AND event.status = 'COMPLETED'`
  - Filter: `AND event.end_date BETWEEN ? AND ?` (date range)
  - Include: event details (id, title, start_date, end_date)
  - Include: attendance (status, checked_in_at, volunteer_hours)
  - Apply pagination: `skip: offset, take: limit`
  - Order by: `event.end_date DESC` (most recent first)
  - Return: { attendances: [...], total: count }

- [ ] T016 [US2] Add method `getVolunteerHistory(volunteerId, staffId, { startDate, endDate, limit = 50, offset = 0 })` to `backend/src/services/attendance.service.js`:
  - Step 1: Get Staff organization_id from userRepository
  - Step 2: Apply date defaults using dateUtil.applyDateDefaults(startDate, endDate)
  - Step 3: Validate date range using dateUtil.validateDateRange(startDate, endDate, 730)
  - Step 4: Get volunteer user with userRepository.getById(volunteerId)
  - Step 5: Validate volunteer exists (throw NotFoundError if null)
  - Step 6: Call attendanceRepository.getByVolunteerIdAndOrganization()
  - Step 7: Calculate summary: total_events_attended, total_hours_contributed, date_range
  - Return: { volunteer, attendances, summary, pagination, filters_applied }

- [ ] T017 [US2] Add controller method `getVolunteerHistory()` to `backend/src/controllers/attendance.controller.js`:
  - Extract volunteerId from req.params.volunteerId
  - Extract startDate, endDate, limit, offset from req.query
  - Call attendanceService.getVolunteerHistory(volunteerId, req.user.id, { startDate, endDate, limit, offset })
  - Return successResponse with data + pagination + filters_applied
  - Error handling: catch NotFoundError (404), ForbiddenError (403), ValidationError (400)

- [ ] T018 [US2] Add Zod validation schema `volunteerHistorySchema` in `backend/src/validators/attendance.validator.js`:
  - Validate volunteerId: UUID format (z.string().uuid())
  - Validate startDate: optional ISO 8601 date string (z.string().datetime().optional())
  - Validate endDate: optional ISO 8601 date string (z.string().datetime().optional())
  - Validate limit: integer, min 1, max 200, default 50
  - Validate offset: integer, min 0, default 0
  - Export as named export

- [ ] T019 [US2] Register route in `backend/src/routes/attendance.routes.js`:
  - Route: `GET /volunteers/:volunteerId/history`
  - Middleware: authMiddleware, roleMiddleware(['STAFF', 'MANAGER', 'ADMIN'])
  - Middleware: validateRequest(volunteerHistorySchema)
  - Handler: attendanceController.getVolunteerHistory
  - Verify route is registered in main router

- [ ] T020 [P] [US2] Write unit tests for date utility `backend/tests/unit/utils/date.util.test.js`:
  - Test applyDateDefaults() with no dates → returns last 6 months to today
  - Test applyDateDefaults() with only startDate → endDate = today
  - Test applyDateDefaults() with only endDate → startDate = endDate - 6 months
  - Test validateDateRange() with valid range → passes
  - Test validateDateRange() with startDate > endDate → throws ValidationError
  - Test validateDateRange() with range > 730 days → throws ValidationError

- [ ] T021 [P] [US2] Write unit tests for `backend/tests/unit/services/attendance.service.test.js`:
  - Test getVolunteerHistory() with valid volunteerId → returns data
  - Test getVolunteerHistory() with date defaults → applies last 6 months
  - Test getVolunteerHistory() with custom date range → respects dates
  - Test getVolunteerHistory() with range > 2 years → throws ValidationError
  - Test getVolunteerHistory() volunteer not found → throws NotFoundError
  - Test getVolunteerHistory() summary calculation → correct totals
  - Mock repositories, target 80% coverage

- [ ] T022 [P] [US2] Write integration tests for `backend/tests/integration/attendance.integration.test.js`:
  - Test GET /volunteers/:volunteerId/history happy path → 200 OK with data
  - Test with invalid UUID → 400 Bad Request
  - Test with default dates → applies smart defaults
  - Test with custom date range → filters correctly
  - Test with date range > 2 years → 400 Bad Request
  - Test with startDate > endDate → 400 Bad Request
  - Test with volunteer not found → 404 Not Found
  - Test pagination → correct page returned
  - Use Supertest, verify response structure matches contract

- [ ] T023 [US2] Add Swagger JSDoc documentation above `getVolunteerHistory()` in `backend/src/controllers/attendance.controller.js`:
  - @swagger tag, @route GET /api/v1/attendances/volunteers/{volunteerId}/history
  - @param volunteerId (path, UUID, required)
  - @query startDate (string, optional, ISO 8601, default last 6 months)
  - @query endDate (string, optional, ISO 8601, default today)
  - @query limit (integer, optional, default 50, max 200)
  - @query offset (integer, optional, default 0)
  - @responses 200 (success with example), 400, 403, 404, 500
  - Include request/response examples from contract doc

**Checkpoint**: User Story 2 complete - Volunteer-First query fully functional and tested

---

## Phase 5: Frontend Implementation - User Story 1 (Event-First UI) 🎨

**Goal**: Build React UI for Staff to view attendance history by selecting a completed event

**Independent Test**: Navigate to Attendance History page → Select event → See volunteer list with summary

### Frontend Components for Event-First Query

- [ ] T024 [P] [US1] Create API client method in `frontend/src/api/attendance.api.js`:
  - Function: `getEventHistory(eventId, { limit = 50, offset = 0 })`
  - Use axios.get(`/api/v1/attendances/events/${eventId}/history`, { params: { limit, offset } })
  - Include credentials and auth token
  - Return: Promise with response.data
  - Error handling: Transform API errors to user-friendly messages

- [ ] T025 [US1] Create EventHistoryTab component in `frontend/src/components/attendance/EventHistoryTab.jsx`:
  - State: selectedEvent, attendances, summary, pagination, loading, error
  - Render: Event selector (Autocomplete) + Summary cards + DataGrid
  - Event handler: handleEventSelect() → Call getEventHistory()
  - Event handler: handlePageChange() → Update offset and refetch
  - Use Material UI: Grid, Card, CardContent, Typography
  - PropTypes validation for all props

- [ ] T026 [US1] Create AttendanceSummaryCards component in `frontend/src/components/attendance/AttendanceSummaryCards.jsx`:
  - Props: summary { total_approved, present_count, absent_count }
  - Render: 3-column grid with Cards showing counts
  - Visual: Green for present_count, Grey for absent_count
  - Reusable for both User Stories
  - PropTypes validation

- [ ] T027 [P] [US1] Create EventSelector component in `frontend/src/components/attendance/EventSelector.jsx`:
  - Props: onEventSelect, organizationId
  - Fetch: List of COMPLETED events from eventApi.getEvents({ status: 'COMPLETED' })
  - Render: Autocomplete with event title + date
  - Debounced search (300ms)
  - PropTypes validation

- [ ] T028 [P] [US1] Create AttendanceHistoryTable component in `frontend/src/components/attendance/AttendanceHistoryTable.jsx`:
  - Props: rows, columns, pagination, onPageChange, loading
  - Render: Material UI DataGrid with server-side pagination
  - Columns for Event-First: volunteer_name, avatar, status, checked_in_at, volunteer_hours
  - Status chip: Green "PRESENT" / Grey "ABSENT"
  - PropTypes validation, reusable for both User Stories

- [ ] T029 [P] [US1] Write component tests for EventHistoryTab in `frontend/src/components/attendance/__tests__/EventHistoryTab.test.jsx`:
  - Test: Renders event selector and summary cards
  - Test: Calls getEventHistory() when event selected
  - Test: Displays loading state correctly
  - Test: Displays error message on API failure
  - Test: Handles pagination correctly
  - Use React Testing Library + Jest

**Checkpoint**: Event-First UI complete - Staff can select event and view attendance history

---

## Phase 6: Frontend Implementation - User Story 2 (Volunteer-First UI) 🎨

**Goal**: Build React UI for Staff to view attendance history by searching for a volunteer

**Independent Test**: Navigate to Attendance History page → Search volunteer → Select date range → See events attended

### Frontend Components for Volunteer-First Query

- [ ] T030 [P] [US2] Create API client method in `frontend/src/api/attendance.api.js`:
  - Function: `getVolunteerHistory(volunteerId, { startDate, endDate, limit = 50, offset = 0 })`
  - Use axios.get(`/api/v1/attendances/volunteers/${volunteerId}/history`, { params })
  - Format dates to ISO 8601 before sending
  - Return: Promise with response.data
  - Error handling: Transform API errors to user-friendly messages

- [ ] T031 [US2] Create VolunteerHistoryTab component in `frontend/src/components/attendance/VolunteerHistoryTab.jsx`:
  - State: selectedVolunteer, dateRange, attendances, summary, pagination, loading, error
  - Render: Volunteer search + Date range picker + Summary cards + DataGrid
  - Event handler: handleVolunteerSelect() → Call getVolunteerHistory()
  - Event handler: handleDateRangeChange() → Validate range and refetch
  - Default dates: Last 6 months to today
  - PropTypes validation for all props

- [ ] T032 [P] [US2] Create VolunteerSearchBar component in `frontend/src/components/attendance/VolunteerSearchBar.jsx`:
  - Props: onVolunteerSelect, organizationId
  - Fetch: List of volunteers with search query from userApi.searchVolunteers()
  - Render: Autocomplete with volunteer name + avatar
  - Debounced search (300ms)
  - PropTypes validation

- [ ] T033 [P] [US2] Create DateRangePicker component in `frontend/src/components/attendance/DateRangePicker.jsx`:
  - Props: value { startDate, endDate }, onChange, maxRange (default 730 days)
  - Render: Material UI DatePicker with two fields (Start Date, End Date)
  - Validation: startDate <= endDate, range <= maxRange
  - Visual feedback: Error message if validation fails
  - Smart defaults: Last 6 months to today
  - PropTypes validation

- [ ] T034 [P] [US2] Create VolunteerHistorySummaryCards component in `frontend/src/components/attendance/VolunteerHistorySummaryCards.jsx`:
  - Props: summary { total_events_attended, total_hours_contributed, date_range }
  - Render: 2-column grid with Cards showing totals
  - Optional: Show date_range.earliest and date_range.latest
  - PropTypes validation

- [ ] T035 [P] [US2] Write component tests for VolunteerHistoryTab in `frontend/src/components/attendance/__tests__/VolunteerHistoryTab.test.jsx`:
  - Test: Renders volunteer search and date picker
  - Test: Applies smart date defaults on mount
  - Test: Calls getVolunteerHistory() when volunteer selected
  - Test: Validates date range (start > end shows error)
  - Test: Validates max range (> 2 years shows error)
  - Test: Displays summary cards with correct data
  - Use React Testing Library + Jest

**Checkpoint**: Volunteer-First UI complete - Staff can search volunteer and view event history

---

## Phase 7: Integration & Polish 🎯

**Goal**: Wire everything together, add page-level integration, and polish UX

**Tests**: Full E2E flow for both User Stories

- [ ] T036 [US1+US2] Create main AttendanceHistoryPage component in `frontend/src/pages/AttendanceHistoryPage.jsx`:
  - State: activeTab (0 for Event-First, 1 for Volunteer-First)
  - Render: Page title + Tabs + Conditional tab panels
  - Tab 0: <EventHistoryTab />
  - Tab 1: <VolunteerHistoryTab />
  - Permission check: Role must be STAFF/MANAGER/ADMIN
  - Breadcrumbs: Home > Attendance Management > History

- [ ] T037 [P] Register route in `frontend/src/routes/index.js`:
  - Route: `/attendance/history`
  - Component: AttendanceHistoryPage
  - Protected: Require authentication
  - Role guard: ['STAFF', 'MANAGER', 'ADMIN']

- [ ] T038 [P] Add navigation menu item in `frontend/src/components/layout/Sidebar.jsx`:
  - Label: "Attendance History"
  - Icon: HistoryIcon (Material UI)
  - Path: `/attendance/history`
  - Visible for: STAFF, MANAGER, ADMIN roles

- [ ] T039 [P] Create custom hook `usePagination` in `frontend/src/hooks/usePagination.js`:
  - State: page, rowsPerPage, total, hasMore
  - Methods: handlePageChange, handleRowsPerPageChange, reset
  - Calculate: offset = page * rowsPerPage
  - Reusable for both User Stories

- [ ] T040 [P] Add empty state illustrations in `frontend/src/components/attendance/EmptyState.jsx`:
  - Variant: "no-event-selected" (show when no event selected)
  - Variant: "no-volunteer-selected" (show when no volunteer selected)
  - Variant: "no-data" (show when API returns empty array)
  - Use Material UI: Box, Typography, SvgIcon

- [ ] T041 [P] Add loading skeleton components in `frontend/src/components/attendance/AttendanceHistorySkeleton.jsx`:
  - Variant: "table" (skeleton for DataGrid rows)
  - Variant: "summary" (skeleton for summary cards)
  - Use Material UI: Skeleton component

- [ ] T042 [P] Write E2E tests in `frontend/src/__tests__/e2e/AttendanceHistory.e2e.test.jsx`:
  - Test: Event-First flow (select event → see volunteer list → paginate)
  - Test: Volunteer-First flow (search volunteer → select date range → see events)
  - Test: Tab switching works correctly
  - Test: Permission denied for Volunteer role (403 error)
  - Test: Handles API errors gracefully
  - Use Cypress or Playwright (per project standard)

- [ ] T043 Update API_CONTRACTS.md with UC47 endpoints:
  - Section: "Attendance History"
  - Document: GET /api/v1/attendances/events/:eventId/history
  - Document: GET /api/v1/attendances/volunteers/:volunteerId/history
  - Include request/response examples
  - Include error codes and messages

**Checkpoint**: Full feature complete - Both User Stories integrated and polished

---

## Dependencies & Execution Order

### Critical Path (Must Complete in Order)
1. **T001-T003** (Database verification) → BLOCKING all other tasks
2. **T004-T005** (Foundation utilities) → BLOCKING T007, T016
3. **T006** (Repository method) → BLOCKING T007
4. **T007** (Service method) → BLOCKING T008
5. **T008** (Controller) → BLOCKING T010
6. **T010** (Routes) → BLOCKING T013

### Parallel Opportunities (Can Run Simultaneously)

**Backend Block 1** (After T003 complete):
- T006, T015 (Both repository methods - different files)
- T009, T018 (Both validation schemas - same file but different exports)

**Backend Block 2** (After T006, T015 complete):
- T007, T016 (Both service methods - same file but independent logic)

**Backend Block 3** (After T007, T016 complete):
- T008, T017 (Both controllers - same file but different methods)
- T011, T020 (Both unit test files - independent)

**Backend Block 4** (After T010, T019 complete):
- T012, T021 (Service unit tests - independent)
- T013, T022 (Integration tests - independent)
- T014, T023 (Swagger docs - independent)

**Frontend Block 1** (After Backend API complete):
- T024, T030 (API client methods - same file but independent)
- T027, T032 (Selectors - different files)
- T026, T034 (Summary cards - different files)
- T028 (Reusable table - independent)

**Frontend Block 2** (After T024, T030 complete):
- T025, T031 (Tab components - independent)
- T029, T035 (Component tests - independent)

**Frontend Block 3** (After T025, T031 complete):
- T036 (Main page - combines both tabs)
- T039, T040, T041 (Utilities and UI polish - independent)

**Final Block** (After T036 complete):
- T037, T038 (Routing and navigation - independent)
- T042 (E2E tests)
- T043 (Documentation update)

### Task Dependency Graph
```
T001-T003 (Setup)
    ↓
T004-T005 (Foundation)
    ↓
┌───────────────┴───────────────┐
│                               │
T006 (Event Repo) ─→ T007 (Event Service) ─→ T008 (Event Controller) ─→ T010 (Event Route)
│                                                                              │
T015 (Vol Repo) ──→ T016 (Vol Service) ───→ T017 (Vol Controller) ──→ T019 (Vol Route)
    ↓                   ↓                       ↓                          ↓
T009 (Validation)   T011 (Tests)            T012 (Tests)              T013 (Integration)
T018 (Validation)   T020 (Tests)            T021 (Tests)              T022 (Integration)
                                                                       T014 (Swagger)
                                                                       T023 (Swagger)
    ↓
Backend Complete → Frontend Start
    ↓
T024 (API-Event), T030 (API-Vol), T027 (Selectors), T028 (Table), T026/T034 (Cards)
    ↓
T025 (EventTab), T031 (VolTab)
    ↓
T029 (Tests), T035 (Tests)
    ↓
T036 (Main Page)
    ↓
T037 (Routing), T038 (Nav), T039-T041 (Polish)
    ↓
T042 (E2E Tests), T043 (Docs)
    ↓
DONE ✅
```

---

## Implementation Strategy

### Iteration 1: Backend Foundation (T001-T005)
**Duration**: 30 minutes  
**Goal**: Database verification + shared utilities  
**Deliverable**: date.util.js and constants ready

### Iteration 2: User Story 1 Backend (T006-T014)
**Duration**: 2 hours  
**Goal**: Event-First query fully functional  
**Deliverable**: GET /events/:eventId/history endpoint with tests

### Iteration 3: User Story 2 Backend (T015-T023)
**Duration**: 2 hours  
**Goal**: Volunteer-First query fully functional  
**Deliverable**: GET /volunteers/:volunteerId/history endpoint with tests

### Iteration 4: Frontend Foundation (T024-T028)
**Duration**: 1.5 hours  
**Goal**: Reusable UI components  
**Deliverable**: API clients, selectors, table component

### Iteration 5: User Story 1 Frontend (T025, T029)
**Duration**: 1.5 hours  
**Goal**: Event-First UI complete  
**Deliverable**: EventHistoryTab with tests

### Iteration 6: User Story 2 Frontend (T031-T035)
**Duration**: 1.5 hours  
**Goal**: Volunteer-First UI complete  
**Deliverable**: VolunteerHistoryTab with tests

### Iteration 7: Integration & Polish (T036-T043)
**Duration**: 2 hours  
**Goal**: Page-level integration + E2E tests  
**Deliverable**: Full feature ready for deployment

**Total Estimated Time**: 11 hours

---

## Testing Checklist

### Backend Unit Tests (Jest)
- [ ] date.util.js: All 6 functions tested
- [ ] attendance.repository.js: getByEventId, getByVolunteerId
- [ ] attendance.service.js: getEventHistory (5 scenarios), getVolunteerHistory (6 scenarios)
- [ ] Target: 80% line coverage for Service layer

### Backend Integration Tests (Supertest)
- [ ] GET /events/:eventId/history: 7 test cases (happy path + errors)
- [ ] GET /volunteers/:volunteerId/history: 8 test cases (happy path + errors)
- [ ] Authorization: Organization-based access control
- [ ] Pagination: Verify offset/limit work correctly

### Frontend Unit Tests (React Testing Library)
- [ ] EventHistoryTab: 5 test cases
- [ ] VolunteerHistoryTab: 6 test cases
- [ ] Reusable components: 3-4 test cases each
- [ ] Custom hooks: usePagination tested

### Frontend E2E Tests (Cypress/Playwright)
- [ ] Event-First flow: End-to-end user journey
- [ ] Volunteer-First flow: End-to-end user journey
- [ ] Permission denied: Volunteer role blocked
- [ ] Error handling: Graceful degradation

---

## Success Criteria

- [ ] All 43 tasks completed and passing tests
- [ ] Backend unit test coverage ≥ 80% for Service layer
- [ ] All integration tests passing (16 test cases minimum)
- [ ] Frontend components have PropTypes validation
- [ ] E2E tests pass for both User Stories
- [ ] Swagger documentation complete and accurate
- [ ] API_CONTRACTS.md updated with UC47 endpoints
- [ ] Performance: Event-First query < 1.5s for 1000 records
- [ ] Performance: Volunteer-First query < 1.5s for 1000 records
- [ ] No ESLint warnings or type errors
- [ ] Code review approved by TienTD
- [ ] Feature branch `047-feat-view-attendance-history` merged to Dev

---

**Total Tasks**: 43  
**Backend Tasks**: 19 (T001-T023, excluding T011-T014 tests = 15 implementation + 4 test tasks)  
**Frontend Tasks**: 19 (T024-T042 = 15 implementation + 4 test/polish tasks)  
**Documentation Tasks**: 5 (T014, T023, T038, T043, plus inline JSDoc)

**Status**: READY FOR IMPLEMENTATION ✅  
**Next Action**: User says "làm nốt" or runs `/speckit-implement` to execute all tasks

---

**Last Updated**: 2026-06-30 10:21 AM  
**Feature Owner**: TienTD  
**Reviewer**: (Assign after tasks complete)

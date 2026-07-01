# Tasks: Attendance Check (UC45)

**Feature Branch**: `045-feat-attendance-check`  
**Created**: 2026-06-30  
**Status**: READY FOR IMPLEMENTATION

**Input**: Design documents from `.sdd/TienTD/UC45-feat-attendance-check/`

**Prerequisites**: 
- ✅ plan.md (complete)
- ✅ research.md (complete - 4 RQs resolved)
- ✅ data-model.md (complete - attendances schema verified, NO migration needed)
- ✅ contracts/POST-attendances-application-id-check-in.md (complete)
- ✅ contracts/POST-attendances-bulk-check-in.md (complete)
- ✅ quickstart.md (complete)

**Organization**: Tasks are grouped by implementation phase to enable sequential execution with clear checkpoints.

---

## Format: `[ID] [P?] [Phase] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Phase]**: Which phase this task belongs to (P1-P15)
- File paths follow VMS project structure: `backend/src/`, `frontend/src/`

---

## Phase 1: Database Schema Verification (Setup)

**Purpose**: Verify attendances table schema (NO migration required for UC45)

**⚠️ Prerequisites**: MySQL 8.0+ running, Prisma CLI installed, UC22/UC23/UC24 completed

- [ ] T001 [P1] Verify `backend/prisma/schema.prisma` - CONFIRM `attendances` table exists with required fields:
  - `id` (Int, @id, @default(autoincrement()))
  - `application_id` (Int, @unique, FK → applications.id)
  - `status` (Enum: 'PRESENT', 'ABSENT')
  - `volunteer_hours` (Decimal(5,2)?, nullable)
  - `checked_in_by` (String, FK → users.id, Staff UUID)
  - `checked_in_at` (DateTime)
  - `notes` (String?, nullable, max 500 chars)
  - UNIQUE constraint on `application_id` (prevents duplicate check-ins)

- [ ] T002 [P1] Run Prisma introspection to verify database schema matches:
  - Run: `cd backend && npx prisma db pull`
  - Verify no schema drift warnings
  - Regenerate Prisma Client: `npx prisma generate`
  - Confirm `@prisma/client` types include Attendance model

- [ ] T003 [P1] Verify database indexes for performance:
  - Check index on `attendances.application_id` (UNIQUE provides this)
  - Optional: Add index on `checked_in_at` for analytics queries
  - Query: `SHOW INDEX FROM attendances;` to verify

**Checkpoint**: Database schema verified → Can proceed to Backend Repository phase

---

## Phase 2: Backend - Repository Layer

**Purpose**: Data access methods for attendance operations

- [ ] T004 [P2] Create `backend/src/repositories/attendance.repository.js` - NEW file với Prisma CRUD methods:
  - Method: `create(data)` - Create attendance record với Prisma.attendance.create()
  - Method: `getByApplicationId(applicationId)` - Find attendance by application_id
  - Method: `getByEventId(eventId, filters = {})` - List attendances for event (for UC46)
  - Method: `getById(id)` - Find attendance by ID
  - Export AttendanceRepository class với constructor injection của prismaClient
  - Follow repository pattern từ UC24/UC25

- [ ] T005 [P2] Write unit tests `backend/tests/unit/repositories/attendance.repository.test.js`:
  - Test create() với valid data → returns attendance object
  - Test create() với duplicate application_id → throws Prisma P2002 error
  - Test getByApplicationId() found → returns attendance
  - Test getByApplicationId() not found → returns null
  - Mock Prisma client với jest.fn()
  - Target: 80% coverage cho Repository layer

**Checkpoint**: Repository layer ready → Can proceed to Service layer

---

## Phase 3: Backend - Service Layer

**Purpose**: Business logic for check-in operations

- [ ] T006 [P3] Create `backend/src/services/attendance.service.js` - ADD method `checkIn(applicationId, staffId, data = {})`:
  - Step 1: Get application với event + user data (call applicationRepository.getById với includes)
  - Step 2: Validate application.status === 'APPROVED' (throw BadRequestError if not)
  - Step 3: Validate event.status IN ['PUBLISHED', 'IN_PROGRESS'] (throw BadRequestError if COMPLETED/CANCELLED)
  - Step 4: Authorization check - call authorizationService.checkStaffOrganizationAccess(staffId, event.id)
  - Step 5: Validate notes max 500 chars (throw ValidationError if exceeded)
  - Step 6: Create attendance record với attendanceRepository.create()
  - Step 7: Handle UNIQUE constraint error (P2002) → throw ConflictError with existing attendance details
  - Step 8: Log audit trail với Pino logger
  - Return: { ...attendance, volunteer_id, volunteer_name }
  - Follow contracts/POST-attendances-application-id-check-in.md

- [ ] T007 [P3] Update `backend/src/services/attendance.service.js` - ADD method `bulkCheckIn(applicationIds, staffId, data = {})`:
  - Step 1: Track startTime = Date.now() for duration measurement
  - Step 2: Initialize results = { successful: [], failed: [] }
  - Step 3: Process each applicationId independently (for-loop, separate try-catch)
  - Step 4: For each ID, call this.checkIn() và collect results
  - Step 5: On success → push to results.successful with { application_id, volunteer_name, attendance_id, checked_in_at }
  - Step 6: On error → push to results.failed with { application_id, volunteer_name, error_code, error_message, details }
  - Step 7: Calculate duration_ms = Date.now() - startTime
  - Step 8: Return { summary: { total, succeeded, failed, duration_ms }, successful, failed, notes }
  - Follow RQ4 decision: Partial success pattern (no transaction rollback)
  - Follow contracts/POST-attendances-bulk-check-in.md

**Checkpoint**: Service layer complete → Can proceed to Controller layer

---

## Phase 4: Backend - Controller Layer

**Purpose**: HTTP request handling and validation

- [ ] T008 [P4] Create `backend/src/controllers/attendance.controller.js` - ADD method `checkIn(req, res, next)`:
  - Extract: applicationId from req.params, notes from req.body, { userId: staffId } from req.user (JWT)
  - Validate applicationId is positive integer (parseInt + isNaN check)
  - Call attendanceService.checkIn(applicationId, staffId, { notes })
  - Return 201 Created với response.util.js format
  - Catch errors với next(error) for centralized error middleware
  - Follow contracts/POST-attendances-application-id-check-in.md

- [ ] T009 [P4] Update `backend/src/controllers/attendance.controller.js` - ADD method `bulkCheckIn(req, res, next)`:
  - Extract: application_ids + notes from req.body, { userId: staffId } from req.user
  - Validate request body với Zod schema (see T011)
  - Call attendanceService.bulkCheckIn(application_ids, staffId, { notes })
  - Generate message: "Bulk check-in completed" hoặc "with X succeeded, Y failed"
  - Return 200 OK với partial success response format
  - Follow contracts/POST-attendances-bulk-check-in.md

**Checkpoint**: Controller layer complete → Can proceed to Validation layer

---

## Phase 5: Backend - Validation Layer

**Purpose**: Request body validation schemas (Zod)

- [ ] T010 [P5] Create `backend/src/validators/attendance.validator.js` - ADD Zod schema `checkInSchema`:
  ```javascript
  export const checkInSchema = z.object({
    notes: z.string().max(500).optional()
      .transform(val => val?.trim() || null)
  });
  ```

- [ ] T011 [P5] Update `backend/src/validators/attendance.validator.js` - ADD Zod schema `bulkCheckInSchema`:
  ```javascript
  export const bulkCheckInSchema = z.object({
    application_ids: z
      .array(z.number().int().positive())
      .min(1, 'Must provide at least 1 application ID')
      .max(50, 'Cannot check-in more than 50 volunteers at once'),
    notes: z.string().max(500).optional()
      .transform(val => val?.trim() || undefined)
  });
  ```

- [ ] T012 [P5] Update `backend/src/validators/attendance.validator.js` - ADD Zod schema `applicationIdParamSchema`:
  ```javascript
  export const applicationIdParamSchema = z.object({
    applicationId: z.string().regex(/^\d+$/)
      .transform(val => parseInt(val, 10))
  });
  ```

**Checkpoint**: Validation schemas ready → Can proceed to Routes

---

## Phase 6: Backend - Routes Layer

**Purpose**: API endpoint registration

- [ ] T013 [P6] Create `backend/src/routes/attendance.routes.js` - NEW file với Express router:
  - Import: express, authMiddleware, validateRequest middleware
  - Import: attendanceController, validation schemas
  - Route 1: `POST /:applicationId/check-in` → authMiddleware → validateRequest(params, body) → controller.checkIn
  - Route 2: `POST /bulk-check-in` → authMiddleware → validateRequest(body) → controller.bulkCheckIn
  - Export router as default
  - Follow VMS routing conventions

- [ ] T014 [P6] Update `backend/src/routes/index.js` - REGISTER attendance routes:
  - Import attendanceRoutes from './attendance.routes.js'
  - Add: `router.use('/api/v1/attendances', attendanceRoutes);`
  - Place after application routes để maintain logical grouping

**Checkpoint**: Routes registered → Can proceed to Error Handling

---

## Phase 7: Backend - Error Handling

**Purpose**: Custom error classes and error messages

- [ ] T015 [P7] Verify `backend/src/utils/errors.util.js` - CONFIRM custom error classes exist from UC24:
  - BadRequestError (400) - for invalid application/event status
  - UnauthorizedError (401) - for missing/invalid JWT
  - ForbiddenError (403) - for organization mismatch
  - NotFoundError (404) - for application not found
  - ConflictError (409) - for duplicate check-in
  - InternalServerError (500) - for unexpected errors
  - ValidationError (422) - for Zod validation failures

- [ ] T016 [P7] Update error messages to include attendance-specific scenarios:
  - "Cannot check-in application with status {status}. Only APPROVED applications can be checked in."
  - "Cannot check-in for event with status {status}. Event must be PUBLISHED or IN_PROGRESS."
  - "Volunteer already checked in for this event"
  - "Notes must not exceed 500 characters"

**Checkpoint**: Error handling complete → Can proceed to Testing

---

## Phase 8: Backend - Testing

**Purpose**: Unit tests and integration tests (target 80% coverage)

### Unit Tests (Service Layer)

- [ ] T017 [P8] Create `backend/tests/unit/services/attendance.service.test.js` - Test suite for `checkIn`:
  - Test 1: Should create attendance for APPROVED application
  - Test 2: Should throw BadRequestError for PENDING application
  - Test 3: Should throw BadRequestError for COMPLETED event
  - Test 4: Should throw ForbiddenError for organization mismatch
  - Test 5: Should throw ConflictError for duplicate check-in
  - Test 6: Should handle notes max 500 chars
  - Test 7: Should set volunteer_hours = null (RQ1 decision)
  - Mock: applicationRepository, attendanceRepository, authorizationService
  - Target: 80% line coverage

- [ ] T018 [P8] Create `backend/tests/unit/services/attendance.service.test.js` - Test suite for `bulkCheckIn`:
  - Test 1: Should process all 5 valid applications successfully
  - Test 2: Should return partial success (3 succeeded, 2 failed)
  - Test 3: Should handle all failed scenario (0 succeeded)
  - Test 4: Should track duration_ms in summary
  - Test 5: Should apply same notes to all applications
  - Test 6: Should not rollback on partial failure (RQ4 decision)

### Integration Tests (API Endpoints)

- [ ] T019 [P8] Create `backend/tests/integration/attendance.api.test.js` - Test suite for `POST /:applicationId/check-in`:
  - Test 1: Should return 201 for valid check-in with notes
  - Test 2: Should return 201 for valid check-in without notes
  - Test 3: Should return 400 for PENDING application
  - Test 4: Should return 401 for missing JWT token
  - Test 5: Should return 403 for organization mismatch
  - Test 6: Should return 404 for non-existent application
  - Test 7: Should return 409 for already checked-in volunteer
  - Use Supertest với test database

- [ ] T020 [P8] Create `backend/tests/integration/attendance.api.test.js` - Test suite for `POST /bulk-check-in`:
  - Test 1: Should return 200 for all successful (10 applications)
  - Test 2: Should return 200 for partial success with failed array
  - Test 3: Should return 400 for empty application_ids
  - Test 4: Should return 400 for > 50 application_ids
  - Test 5: Should return 401 for missing JWT token
  - Test 6: Should return 403 for Volunteer role

**Checkpoint**: Backend testing complete (80% coverage target) → Can proceed to Swagger Documentation

---

## Phase 9: Backend - API Documentation

**Purpose**: Swagger/OpenAPI documentation

- [ ] T021 [P9] Update `backend/src/routes/attendance.routes.js` - ADD Swagger JSDoc for single check-in:
  - @swagger tag above route registration
  - Document: POST /api/v1/attendances/{applicationId}/check-in
  - Request body: { notes: string (optional, max 500) }
  - Response 201/400/401/403/404/409/500 with examples
  - Copy examples from contracts/POST-attendances-application-id-check-in.md

- [ ] T022 [P9] Update `backend/src/routes/attendance.routes.js` - ADD Swagger JSDoc for bulk check-in:
  - @swagger tag above route registration
  - Document: POST /api/v1/attendances/bulk-check-in
  - Request body: { application_ids: number[], notes: string (optional) }
  - Response 200/400/401/403/500 with partial success examples
  - Copy examples from contracts/POST-attendances-bulk-check-in.md

**Checkpoint**: Backend implementation complete → Can proceed to Frontend

---

## Phase 10: Frontend - API Client

**Purpose**: Axios API client functions

- [ ] T023 [P10] Create `frontend/src/services/api/attendanceApi.js` - NEW file với Axios functions:
  - Function 1: `checkInSingle(applicationId, notes)` - POST /:applicationId/check-in
  - Function 2: `bulkCheckIn(applicationIds, notes)` - POST /bulk-check-in
  - Include Authorization header với JWT token from localStorage
  - Include Content-Type: application/json
  - Handle axios errors và transform to standardized error format
  - Export as attendanceApi object

- [ ] T024 [P10] Write `frontend/tests/unit/services/attendanceApi.test.js`:
  - Test checkInSingle with notes → correct request payload
  - Test checkInSingle without notes → notes omitted
  - Test bulkCheckIn with 5 IDs → correct array format
  - Test error handling (401, 403, 409, 500)
  - Mock axios với jest.mock()

**Checkpoint**: API client ready → Can proceed to UI Components

---

## Phase 11: Frontend - UI Components

**Purpose**: React components for check-in functionality

- [ ] T025 [P11] Create `frontend/src/components/Attendance/AttendanceList.jsx` - NEW component:
  - Use Material UI DataGrid for 200 volunteers (from RQ3 decision)
  - Columns: checkbox, volunteer_name, volunteer_id, skills, is_checked_in (boolean), checked_in_at (timestamp)
  - Enable checkboxSelection only for unchecked volunteers (isRowSelectable)
  - Show "Checked In" badge for already checked-in volunteers
  - Include search bar component at top
  - Pass onSelectionChange callback to parent
  - Follow Material UI DataGrid best practices

- [ ] T026 [P11] Create `frontend/src/components/Attendance/SearchBar.jsx` - NEW component:
  - Props: { volunteers, onFilteredDataChange }
  - TextField with 300ms debounce (from RQ3 decision)
  - Search fields: volunteer_name, volunteer_id, skills (client-side filtering)
  - Use lodash.debounce or custom hook
  - Show result count: "Showing X of Y volunteers"
  - Clear button to reset search

- [ ] T027 [P11] Create `frontend/src/components/Attendance/BulkCheckInButton.jsx` - NEW component:
  - Props: { selectedCount, onBulkCheckIn, disabled }
  - Material UI Button variant="contained" color="primary"
  - Show count badge: "Check-in {count} Volunteers"
  - Disabled when selectedCount === 0
  - Loading state during API call

- [ ] T028 [P11] Create `frontend/src/components/Attendance/BulkCheckInDialog.jsx` - Confirmation dialog (RQ2 decision):
  - Props: { open, onClose, onConfirm, selectedVolunteers, isLoading }
  - Material UI Dialog component
  - Title: "Confirm Bulk Check-in"
  - Body: List of selected volunteer names (max-height: 300px, scrollable)
  - Optional TextField for notes (max 500 chars with counter)
  - Actions: Cancel + Confirm buttons
  - Disable Confirm during loading

- [ ] T029 [P11] Create `frontend/src/components/Attendance/FailedCheckInModal.jsx` - Failed details modal:
  - Props: { open, onClose, failures }
  - Material UI Dialog + Table component
  - Columns: volunteer_name, error_message, error_code (as Chip)
  - Show failure count in title: "Check-in Failures ({count})"
  - Close button only (informational modal)
  - Reuse UC24 FailedApprovalModal structure

**Checkpoint**: UI components ready → Can proceed to Page Integration

---

## Phase 12: Frontend - Page Integration

**Purpose**: Integrate check-in functionality into Staff pages

- [ ] T030 [P12] Create `frontend/src/pages/Staff/AttendanceCheckPage.jsx` - NEW page:
  - Route: `/staff/events/:eventId/attendance`
  - Fetch approved applications for event (GET /api/v1/applications?eventId={id}&status=APPROVED)
  - State management: volunteers list, selectedIds, filteredData, loading, error states
  - Integrate AttendanceList component with search
  - Integrate BulkCheckInButton (visible when selectedIds.length > 0)
  - Integrate BulkCheckInDialog with confirmation
  - Integrate FailedCheckInModal for partial failures
  - Handle API responses: success toast, error toast, partial success modal
  - Refresh volunteers list after bulk check-in
  - Clear selection after successful operation

- [ ] T031 [P12] Update `frontend/src/routes/StaffRoutes.jsx` - REGISTER attendance check route:
  - Import AttendanceCheckPage component
  - Add route: `<Route path="/events/:eventId/attendance" element={<AttendanceCheckPage />} />`
  - Add navigation link from Event Detail page: "Check Attendance" button
  - Protect route with Staff role guard (authMiddleware)

**Checkpoint**: Page integration complete → Can proceed to Component Testing

---

## Phase 13: Frontend - Component Testing

**Purpose**: React Testing Library component tests

- [ ] T032 [P13] Create `frontend/tests/unit/components/Attendance/AttendanceList.test.jsx`:
  - Test 1: Should render 200 volunteers in DataGrid
  - Test 2: Should only allow selection of unchecked volunteers
  - Test 3: Should display "Checked In" badge for checked volunteers
  - Test 4: Should call onSelectionChange with correct IDs
  - Test 5: Should filter volunteers based on search input
  - Mock Material UI DataGrid events
  - Use @testing-library/react and @testing-library/user-event

**Checkpoint**: Component testing complete → Can proceed to E2E Testing

---

## Phase 14: Frontend - E2E Testing

**Purpose**: End-to-end user workflow testing

- [ ] T033 [P14] Create manual E2E test scenarios document `frontend/tests/e2e/attendance-check-scenarios.md`:
  - Scenario 1: Staff navigates to attendance page and sees approved volunteers list
  - Scenario 2: Staff searches for volunteer by name with 300ms debounce
  - Scenario 3: Staff selects 5 volunteers and clicks bulk check-in button
  - Scenario 4: Staff confirms bulk check-in in dialog with notes
  - Scenario 5: System shows partial success (3 succeeded, 2 failed with modal)
  - Scenario 6: Staff attempts to check-in already checked-in volunteer (409 conflict)
  - Scenario 7: Staff sees updated list with checked-in badges after refresh
  - Include screenshots and expected outcomes for each scenario

**Checkpoint**: E2E testing complete → Can proceed to Performance Testing

---

## Phase 15: Performance & Load Testing

**Purpose**: Verify performance targets from quickstart.md

- [ ] T034 [P15] Create performance test script `backend/tests/performance/attendance-load-test.js`:
  - Test 1: Single check-in endpoint → Target <200ms p50, <800ms p95
  - Test 2: Bulk check-in 10 apps → Target <1s response time
  - Test 3: Bulk check-in 50 apps → Target <5s response time
  - Test 4: Concurrent requests (20 staff) → Measure throughput
  - Use Artillery or k6 for load testing
  - Generate performance report with p50, p95, p99 latencies
  - Verify database query performance under load

**Checkpoint**: Performance validated → Implementation complete

---

## Summary

**Total Tasks**: 34 tasks across 15 phases (T001-T034)

**Task Breakdown by Phase**:
- Phase 1: Database Schema Verification (3 tasks)
- Phase 2: Backend Repository Layer (2 tasks)
- Phase 3: Backend Service Layer (2 tasks)
- Phase 4: Backend Controller Layer (2 tasks)
- Phase 5: Backend Validation Layer (3 tasks)
- Phase 6: Backend Routes Layer (2 tasks)
- Phase 7: Backend Error Handling (2 tasks)
- Phase 8: Backend Testing (4 tasks)
- Phase 9: Backend API Documentation (2 tasks)
- Phase 10: Frontend API Client (2 tasks)
- Phase 11: Frontend UI Components (5 tasks)
- Phase 12: Frontend Page Integration (2 tasks)
- Phase 13: Frontend Component Testing (1 task)
- Phase 14: Frontend E2E Testing (1 task)
- Phase 15: Performance & Load Testing (1 task)

**Estimated Time Breakdown**:
- Phase 1: Database Verification (15 min) - NO migration needed
- Phase 2-3: Repository & Service (2.5 hours) - Core business logic
- Phase 4-6: Controller, Validation & Routes (1.5 hours)
- Phase 7: Error Handling (30 min) - Reuse existing error classes
- Phase 8: Backend Testing (2 hours) - 80% coverage target
- Phase 9: Swagger docs (30 min)
- Phase 10-12: Frontend (3 hours) - API client + UI components + integration
- Phase 13: Component Testing (1 hour)
- Phase 14: E2E Testing (1 hour)
- Phase 15: Performance Testing (30 min)

**Total Estimated Time**: ~13 hours

**Dependencies**: 
- UC24 (Approve Application) must be completed for authorization patterns
- UC22 (List Applications) for application repository methods
- UC23 (View Application Detail) for event + user includes

**Key Decisions Referenced**:
- RQ1: volunteer_hours set to NULL at check-in (updated later)
- RQ2: Bulk check-in requires confirmation dialog
- RQ3: Client-side search with 300ms debounce (200 volunteers)
- RQ4: Partial success pattern (no transaction rollback)

**Ready for**: `/speckit-implement` command to execute all tasks sequentially

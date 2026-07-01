# Tasks: View Attendance List (UC46)

**Feature Branch**: `046-feat-view-attendance-list`  
**Created**: 2026-06-30  
**Status**: READY FOR IMPLEMENTATION

**Input**: Design documents from `.sdd/TienTD/UC46-feat-view-attendance-list/`

**Prerequisites**: 
- ✅ plan.md (complete)
- ✅ research.md (complete - 4 RQs resolved)
- ✅ data-model.md (complete - NO migration needed, reuses UC22/UC24/UC45 tables)
- ✅ contracts/GET-attendances-events-eventId.md (complete)
- ✅ quickstart.md (complete)

**Organization**: Tasks are grouped by implementation phase to enable sequential execution with clear checkpoints.

---

## Format: `[ID] [P?] [Phase] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Phase]**: Which phase this task belongs to (P1-P13)
- File paths follow VMS project structure: `backend/src/`, `frontend/src/`

---

## Phase 1: Database Schema Verification (Setup)

**Purpose**: Verify existing schema (NO migration required for UC46)

**⚠️ Prerequisites**: MySQL 8.0+ running, Prisma CLI installed, UC22/UC24/UC45 completed

- [ ] T001 [P1] Verify `backend/prisma/schema.prisma` - CONFIRM required tables exist:
  - `applications` table with fields: id, event_id, user_id, status, created_at
  - `attendances` table with fields: id, application_id (UNIQUE), status, checked_in_at, checked_in_by, notes
  - `events` table with fields: id, name, organization_id
  - `users` table with fields: id, full_name, avatar_url
  - Relationships: applications → event, applications → user, attendances → applications

- [ ] T002 [P1] Run Prisma introspection to verify database schema matches:
  - Run: `cd backend && npx prisma db pull`
  - Verify no schema drift warnings
  - Regenerate Prisma Client: `npx prisma generate`
  - Confirm `@prisma/client` types include Application, Attendance, Event, User models

- [ ] T003 [P1] Verify database indexes for performance:
  - Check composite index on `applications` (event_id + status) exists
  - Check UNIQUE index on `attendances.application_id` exists
  - Query: `SHOW INDEX FROM applications;` and `SHOW INDEX FROM attendances;`
  - No new indexes required for UC46 (client-side pagination)

**Checkpoint**: Database schema verified → Can proceed to Backend Repository phase

---

## Phase 2: Backend - Repository Layer

**Purpose**: Data access methods for attendance list queries

- [ ] T004 [P2] Create `backend/src/repositories/attendance.repository.js` (or verify if exists from UC45):
  - ADD method: `getAttendancesByEventId(eventId, staffOrganizationId)`
  - Implementation: Query `applications` table with LEFT JOIN `attendances`
  - WHERE clause: `event_id = eventId AND status = 'APPROVED' AND event.organization_id = staffOrganizationId`
  - Include relations: `{ user: { select: USER_PUBLIC_FIELDS }, attendance: true, event: { select: EVENT_BASIC_FIELDS } }`
  - Order by: `applications.created_at ASC` (consistent order for client-side pagination)
  - Return: Array of applications with nested user, attendance, and event data
  - Follow data-model.md query pattern (LEFT JOIN ensures both checked-in + not-yet-checked-in volunteers)

- [ ] T005 [P2] Write unit tests `backend/tests/unit/repositories/attendance.repository.test.js`:
  - Test getAttendancesByEventId() with no attendances → returns approved applications with attendance: null
  - Test getAttendancesByEventId() with mixed data → returns both checked-in and not-yet-checked-in volunteers
  - Test getAttendancesByEventId() with organization filter → only returns authorized applications
  - Test getAttendancesByEventId() with empty result → returns []
  - Mock Prisma client với jest.fn()
  - Target: 80% coverage cho Repository layer

**Checkpoint**: Repository layer ready → Can proceed to Service layer

---

## Phase 3: Backend - Service Layer

**Purpose**: Business logic for attendance list retrieval with authorization

- [ ] T006 [P3] Create `backend/src/services/attendance.service.js` (or update if exists):
  - ADD method: `getAttendanceList(eventId, staffId)`
  - Step 1: Get staff user with organization_id (call userRepository.getById)
  - Step 2: Call attendanceRepository.getAttendancesByEventId(eventId, staff.organization_id)
  - Step 3: If applications.length === 0, check if event exists (throw NotFoundError if event not found)
  - Step 4: Transform data to response DTO format:
    ```javascript
    {
      event_id: applications[0].event.id,
      event_name: applications[0].event.name,
      total_approved: applications.length,
      present_count: applications.filter(a => a.attendance !== null).length,
      absent_count: applications.filter(a => a.attendance === null).length,
      attendances: applications.map(app => ({
        application_id: app.id,
        volunteer_id: app.user.id,
        volunteer_name: app.user.full_name,
        volunteer_avatar: app.user.avatar_url,
        status: app.attendance ? 'PRESENT' : 'ABSENT',
        checked_in_at: app.attendance?.checked_in_at || null,
        checked_in_by: app.attendance?.checked_in_by || null,
        notes: app.attendance?.notes || null
      }))
    }
    ```
  - Step 5: Log query với Pino logger (eventId, staffId, result count)
  - Return: Formatted attendance list object
  - Follow contracts/GET-attendances-events-eventId.md

- [ ] T007 [P3] Write unit tests `backend/tests/unit/services/attendance.service.test.js`:
  - Test getAttendanceList() with 10 volunteers (5 present, 5 absent) → returns correct counts
  - Test getAttendanceList() with all present → present_count = total_approved, absent_count = 0
  - Test getAttendanceList() with all absent → present_count = 0, absent_count = total_approved
  - Test getAttendanceList() with organization mismatch → returns empty attendances array
  - Test getAttendanceList() with non-existent event → throws NotFoundError
  - Test getAttendanceList() with no approved applications → returns 0 counts
  - Mock: attendanceRepository, userRepository
  - Target: 80% line coverage

**Checkpoint**: Service layer complete → Can proceed to Controller layer

---

## Phase 4: Backend - Controller Layer

**Purpose**: HTTP request handling and validation

- [ ] T008 [P4] Create `backend/src/controllers/attendance.controller.js` (or update if exists):
  - ADD method: `getAttendanceList(req, res, next)`
  - Extract: eventId from req.params.eventId, { userId: staffId } from req.user (JWT)
  - Validate eventId is valid UUID format (use validator.isUUID from validator package)
  - Call attendanceService.getAttendanceList(eventId, staffId)
  - Return 200 OK với response.util.js format:
    ```javascript
    res.status(200).json({
      success: true,
      message: 'Attendance list retrieved successfully',
      data: attendanceListData
    });
    ```
  - Catch errors với next(error) for centralized error middleware
  - Follow contracts/GET-attendances-events-eventId.md

- [ ] T009 [P4] Write unit tests `backend/tests/unit/controllers/attendance.controller.test.js`:
  - Test getAttendanceList() with valid eventId → returns 200 with data
  - Test getAttendanceList() with invalid UUID → returns 400
  - Test getAttendanceList() with service error → calls next(error)
  - Mock: attendanceService, response, next

**Checkpoint**: Controller layer complete → Can proceed to Validation layer

---

## Phase 5: Backend - Validation Layer

**Purpose**: Request validation schemas (Zod)

- [ ] T010 [P5] Create `backend/src/validators/attendance.validator.js` (or update if exists):
  - ADD Zod schema `eventIdParamSchema`:
  ```javascript
  import { z } from 'zod';
  
  export const eventIdParamSchema = z.object({
    eventId: z.string().uuid('Invalid event ID format')
  });
  ```
  - Export schema for use in routes

- [ ] T011 [P5] Write unit tests `backend/tests/unit/validators/attendance.validator.test.js`:
  - Test eventIdParamSchema with valid UUID → passes validation
  - Test eventIdParamSchema with invalid UUID → throws ZodError
  - Test eventIdParamSchema with empty string → throws ZodError
  - Test eventIdParamSchema with non-string → throws ZodError

**Checkpoint**: Validation schemas ready → Can proceed to Routes

---

## Phase 6: Backend - Routes Layer

**Purpose**: API endpoint registration

- [ ] T012 [P6] Create `backend/src/routes/attendance.routes.js` (or update if exists):
  - Import: express, authMiddleware, roleMiddleware, validateRequest middleware
  - Import: attendanceController, eventIdParamSchema
  - ADD Route: `GET /events/:eventId` 
    - Middleware chain: authMiddleware → roleMiddleware(['STAFF', 'MANAGER', 'ADMIN']) → validateRequest(eventIdParamSchema, 'params') → controller.getAttendanceList
  - Export router as default
  - Follow VMS routing conventions

- [ ] T013 [P6] Update `backend/src/routes/index.js` - VERIFY attendance routes registered:
  - Confirm line exists: `router.use('/api/v1/attendances', attendanceRoutes);`
  - If not present, add after application routes
  - Verify route path matches: GET /api/v1/attendances/events/:eventId

**Checkpoint**: Routes registered → Can proceed to Error Handling

---

## Phase 7: Backend - Error Handling

**Purpose**: Custom error classes and error messages

- [ ] T014 [P7] Verify `backend/src/utils/errors.util.js` - CONFIRM custom error classes exist:
  - BadRequestError (400) - for invalid UUID format
  - UnauthorizedError (401) - for missing/invalid JWT
  - ForbiddenError (403) - for non-Staff role
  - NotFoundError (404) - for event not found
  - InternalServerError (500) - for unexpected errors

- [ ] T015 [P7] Add UC46-specific error messages to error handling:
  - "Invalid event ID format. Must be a valid UUID"
  - "Event not found or you do not have access to this event"
  - "Only Staff, Manager, or Admin can view attendance lists"

**Checkpoint**: Error handling complete → Can proceed to Testing

---

## Phase 8: Backend - Testing

**Purpose**: Unit tests and integration tests (target 80% coverage)

### Unit Tests (Service Layer)

- [ ] T016 [P8] Write comprehensive service tests `backend/tests/unit/services/attendance.service.test.js`:
  - Test suite for `getAttendanceList`:
    - Test 1: Should return attendance list with correct counts (10 volunteers: 6 present, 4 absent)
    - Test 2: Should handle event with no attendances (all absent)
    - Test 3: Should handle event with all checked-in (all present)
    - Test 4: Should throw NotFoundError for non-existent event
    - Test 5: Should return empty list for organization mismatch
    - Test 6: Should transform data to correct DTO format
    - Test 7: Should handle null notes gracefully
    - Test 8: Should preserve checked_in_at timestamps
  - Mock: attendanceRepository.getAttendancesByEventId, userRepository.getById
  - Target: 85% line coverage

### Integration Tests (API Endpoints)

- [ ] T017 [P8] Create `backend/tests/integration/attendance.api.test.js` - Test suite for `GET /events/:eventId`:
  - Test 1: Should return 200 with attendance list for authorized Staff
  - Test 2: Should return 200 with correct aggregate counts
  - Test 3: Should return 200 with empty attendances array (no approved applications)
  - Test 4: Should return 400 for invalid UUID format
  - Test 5: Should return 401 for missing JWT token
  - Test 6: Should return 403 for Volunteer role
  - Test 7: Should return 404 for non-existent event
  - Test 8: Should return 403 for organization mismatch
  - Use Supertest with test database
  - Seed test data: 1 event, 10 approved applications, 5 attendances

**Checkpoint**: Backend testing complete (80% coverage target) → Can proceed to Swagger Documentation

---

## Phase 9: Backend - API Documentation

**Purpose**: Swagger/OpenAPI documentation

- [ ] T018 [P9] Update `backend/src/routes/attendance.routes.js` - ADD Swagger JSDoc for GET endpoint:
  - @swagger tag above route registration
  - Document: GET /api/v1/attendances/events/{eventId}
  - Path parameter: eventId (UUID, required)
  - Response 200/400/401/403/404/500 with examples
  - Copy examples from contracts/GET-attendances-events-eventId.md
  - Include example response with mixed present/absent volunteers
  - Document aggregate counts (total_approved, present_count, absent_count)

**Checkpoint**: Backend implementation complete → Can proceed to Frontend

---

## Phase 10: Frontend - API Client

**Purpose**: Axios API client functions

- [ ] T019 [P10] Create `frontend/src/services/api/attendanceApi.js` (or update if exists):
  - ADD Function: `getAttendanceList(eventId)`
  - Implementation:
    ```javascript
    import axiosInstance from '../../api/axiosApi';
    
    export const getAttendanceList = async (eventId) => {
      const response = await axiosInstance.get(
        `/attendances/events/${eventId}`,
        { withCredentials: true }
      );
      return response.data;
    };
    ```
  - Include error handling with try-catch
  - Transform axios errors to user-friendly messages
  - Export as named export

- [ ] T020 [P10] Write unit tests `frontend/src/services/api/__tests__/attendanceApi.test.js`:
  - Test getAttendanceList() with successful response → returns data
  - Test getAttendanceList() with 404 error → throws NotFoundError
  - Test getAttendanceList() with 403 error → throws ForbiddenError
  - Test getAttendanceList() with network error → throws NetworkError
  - Mock: axiosInstance.get with jest.fn()

**Checkpoint**: API client ready → Can proceed to UI Components

---

## Phase 11: Frontend - UI Components

**Purpose**: React components for attendance list display

- [ ] T021 [P11] Create `frontend/src/components/attendance/AttendanceListTable.jsx` - NEW component:
  - Props: `{ attendances, isLoading, onRefresh }`
  - Use Material UI DataGrid with built-in pagination (pageSize: 50)
  - Columns:
    1. Avatar (volunteer_avatar with fallback icon)
    2. Volunteer Name (volunteer_name, sortable)
    3. Status Badge (PRESENT = green chip, ABSENT = gray chip)
    4. Checked In At (formatted timestamp with date-fns, sortable)
    5. Notes (truncated to 50 chars with tooltip on hover)
  - Add Refresh IconButton at top-right with loading state
  - Display result count: "Showing {filtered} of {total} volunteers"
  - Handle empty state: "No volunteers have been approved for this event yet"
  - Handle loading state: Skeleton loaders for 5 rows
  - Follow Material UI DataGrid patterns

- [ ] T022 [P11] Create `frontend/src/components/attendance/AttendanceSearchBar.jsx` - NEW component:
  - Props: `{ searchQuery, onSearchChange, statusFilter, onStatusFilterChange }`
  - TextField for name search with SearchIcon
  - Debounce search input 300ms using custom useDebounce hook
  - Select dropdown for status filter with options: "All", "Present", "Absent"
  - Layout: Horizontal row with search left, filter right
  - Styling: Material UI theme colors with warm palette
  - Export as default component

- [ ] T023 [P11] Create `frontend/src/hooks/useDebounce.js` - NEW custom hook:
  - Implementation:
    ```javascript
    import { useState, useEffect } from 'react';
    
    export const useDebounce = (value, delay = 300) => {
      const [debouncedValue, setDebouncedValue] = useState(value);
      
      useEffect(() => {
        const handler = setTimeout(() => {
          setDebouncedValue(value);
        }, delay);
        
        return () => clearTimeout(handler);
      }, [value, delay]);
      
      return debouncedValue;
    };
    ```
  - Export as named export

- [ ] T024 [P11] Create `frontend/src/components/attendance/AttendanceSummaryCards.jsx` - NEW component:
  - Props: `{ totalApproved, presentCount, absentCount }`
  - Display 3 cards in horizontal row:
    1. Total Approved (blue card with PeopleIcon)
    2. Present (green card with CheckCircleIcon)
    3. Absent (gray card with CancelIcon)
  - Each card shows: Icon, Label, Count (large font)
  - Responsive: Stack vertically on mobile (<600px)
  - Use Material UI Card, CardContent, Grid
  - Export as default component

**Checkpoint**: UI components ready → Can proceed to Page Integration

---

## Phase 12: Frontend - Page Integration

**Purpose**: Integrate components into full page

- [ ] T025 [P12] Create `frontend/src/components/pages/AttendanceListPage.jsx` - NEW page component:
  - Get eventId from URL params (useParams from react-router-dom)
  - State management:
    ```javascript
    const [attendanceData, setAttendanceData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [error, setError] = useState(null);
    ```
  - useEffect to fetch on mount: call attendanceApi.getAttendanceList(eventId)
  - handleRefresh function with request deduplication (if isRefreshing, return early)
  - Client-side filtering logic:
    ```javascript
    const filteredAttendances = attendanceData?.attendances
      .filter(a => a.volunteer_name.toLowerCase().includes(debouncedSearch.toLowerCase()))
      .filter(a => statusFilter === 'All' || a.status === statusFilter.toUpperCase());
    ```
  - Layout: Breadcrumb → Event name header → AttendanceSummaryCards → AttendanceSearchBar → AttendanceListTable
  - Error handling: Display error Alert with Snackbar
  - Loading state: Show CircularProgress centered
  - Export as default component

- [ ] T026 [P12] Update `frontend/src/App.js` - ADD route for attendance list page:
  - Import AttendanceListPage
  - Add route: `<Route path="/events/:eventId/attendances" element={<ProtectedRoute><AttendanceListPage /></ProtectedRoute>} />`
  - Verify ProtectedRoute wrapper exists and checks for Staff/Manager/Admin roles
  - Place route before generic 404 route

**Checkpoint**: Page integration complete → Can proceed to Component Testing

---

## Phase 13: Frontend - Component Testing

**Purpose**: Unit tests for React components

- [ ] T027 [P13] Create `frontend/src/components/attendance/__tests__/AttendanceListTable.test.jsx`:
  - Test 1: Should render table with 10 attendance records
  - Test 2: Should display PRESENT badge in green for checked-in volunteers
  - Test 3: Should display ABSENT badge in gray for not-yet-checked-in volunteers
  - Test 4: Should format checked_in_at timestamp correctly
  - Test 5: Should display empty state message when no attendances
  - Test 6: Should show skeleton loaders when isLoading = true
  - Test 7: Should call onRefresh when Refresh button clicked
  - Test 8: Should disable Refresh button during refresh (isRefreshing = true)
  - Test 9: Should paginate data (show 50 per page)
  - Mock: Material UI DataGrid, date-fns
  - Use @testing-library/react

- [ ] T028 [P13] Create `frontend/src/components/attendance/__tests__/AttendanceSearchBar.test.jsx`:
  - Test 1: Should render search TextField and status Select
  - Test 2: Should call onSearchChange after 300ms debounce
  - Test 3: Should NOT call onSearchChange before 300ms (verify debounce)
  - Test 4: Should call onStatusFilterChange immediately on filter change
  - Test 5: Should display all status options: All, Present, Absent
  - Mock: Material UI components
  - Use @testing-library/react with userEvent

- [ ] T029 [P13] Create `frontend/src/components/pages/__tests__/AttendanceListPage.test.jsx`:
  - Test 1: Should fetch attendance list on mount
  - Test 2: Should display loading state during initial fetch
  - Test 3: Should display attendance data after successful fetch
  - Test 4: Should display error message on fetch failure
  - Test 5: Should filter attendances by search query
  - Test 6: Should filter attendances by status (Present/Absent/All)
  - Test 7: Should refresh data when Refresh button clicked
  - Test 8: Should prevent duplicate refresh requests
  - Mock: attendanceApi.getAttendanceList, react-router-dom useParams
  - Use @testing-library/react

**Checkpoint**: Component testing complete → Can proceed to E2E Testing

---

## Phase 14: Frontend - E2E Testing

**Purpose**: End-to-end user flow testing

- [ ] T030 [P14] Create `frontend/cypress/e2e/attendance-list.cy.js` (or use your E2E framework):
  - Test 1: Staff navigates to event attendance list page
    - Login as Staff user
    - Navigate to /events/{testEventId}/attendances
    - Verify page loads and displays attendance table
  - Test 2: Staff searches for volunteer by name
    - Type "Nguyen" in search box
    - Wait 300ms
    - Verify filtered results show only matching names
  - Test 3: Staff filters by Present status
    - Select "Present" from status filter dropdown
    - Verify only PRESENT badge attendances shown
  - Test 4: Staff refreshes attendance list after UC45 check-in
    - Click Refresh button
    - Verify loading spinner appears
    - Verify updated attendance status displayed
  - Test 5: Verify pagination works for >50 volunteers
    - Seed database with 100 approved applications
    - Verify page 1 shows 50 records
    - Click next page button
    - Verify page 2 shows remaining 50 records
  - Use Cypress (or Playwright/Selenium) with test database

**Checkpoint**: E2E testing complete → Can proceed to Performance Testing

---

## Phase 15: Performance Testing

**Purpose**: Verify performance targets are met

- [ ] T031 [P15] Run performance tests for UC46:
  - Test 1: Load attendance list with 100 volunteers
    - Verify response time < 1s (SC-001 requirement)
    - Measure: Backend query time + Network transfer + Frontend render
  - Test 2: Load attendance list with 300 volunteers
    - Verify response time < 1.5s (near client-side pagination limit)
    - Add warning if exceeds 2s (recommend server-side pagination)
  - Test 3: Client-side search with 200 volunteers
    - Type in search box
    - Verify instant filter (<100ms, no API call)
  - Test 4: Verify no memory leaks on repeated refresh
    - Click Refresh button 20 times
    - Monitor browser memory usage (should stay stable)
  - Tools: Chrome DevTools Performance tab, Lighthouse
  - Document results in performance-report.md

**Checkpoint**: Performance testing complete → UC46 implementation DONE ✅

---

## Summary

**Total Tasks**: 31 tasks across 15 phases

**Phase Breakdown**:
- Phase 1: Database Schema Verification (3 tasks)
- Phase 2: Backend Repository Layer (2 tasks)
- Phase 3: Backend Service Layer (2 tasks)
- Phase 4: Backend Controller Layer (2 tasks)
- Phase 5: Backend Validation Layer (2 tasks)
- Phase 6: Backend Routes Layer (2 tasks)
- Phase 7: Backend Error Handling (2 tasks)
- Phase 8: Backend Testing (2 tasks)
- Phase 9: Backend API Documentation (1 task)
- Phase 10: Frontend API Client (2 tasks)
- Phase 11: Frontend UI Components (4 tasks)
- Phase 12: Frontend Page Integration (2 tasks)
- Phase 13: Frontend Component Testing (3 tasks)
- Phase 14: Frontend E2E Testing (1 task)
- Phase 15: Performance Testing (1 task)

**Estimated Time Breakdown**:
- Phase 1: Database Verification (15 min) - NO migration needed
- Phase 2-3: Repository & Service (2 hours) - LEFT JOIN query logic
- Phase 4-6: Controller, Validation & Routes (1.5 hours)
- Phase 7: Error Handling (20 min) - Reuse existing error classes
- Phase 8: Backend Testing (1.5 hours) - 80% coverage target
- Phase 9: Swagger docs (30 min)
- Phase 10-12: Frontend (3 hours) - API client + UI components (DataGrid + Search + Summary cards) + integration
- Phase 13: Component Testing (1.5 hours) - Test search, filter, pagination
- Phase 14: E2E Testing (1 hour) - Full user flow with Cypress
- Phase 15: Performance Testing (30 min)

**Total Estimated Time**: ~12 hours

**Dependencies**: 
- UC22 (View Application List) for application repository patterns
- UC24 (Approve Application) for authorization patterns
- UC45 (Attendance Check) for attendances table and data seeding

**Key Decisions Referenced**:
- RQ1: Client-side pagination (optimal for <300 volunteers per event)
- RQ2: Manual refresh button with request deduplication (no auto-polling)
- RQ3: Search by name + Filter by status (separate controls)
- RQ4: LEFT JOIN applications→attendances to show ALL approved volunteers

**Ready for**: `/speckit-implement` command to execute all tasks sequentially

---

**Version**: 1.0  
**Last Updated**: 2026-06-30  
**Author**: TienTD (Attendance Management Module)

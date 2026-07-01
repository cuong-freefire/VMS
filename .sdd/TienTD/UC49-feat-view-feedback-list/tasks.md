# Tasks: View Feedback List (UC49)

**Feature Branch**: `049-feat-view-feedback-list`  
**Created**: 2026-06-30  
**Status**: READY FOR IMPLEMENTATION

**Input**: Design documents from `.sdd/TienTD/UC49-feat-view-feedback-list/`

**Prerequisites**: 
- ✅ plan.md (complete)
- ✅ research.md (4 RQs resolved)
- ✅ data-model.md (NO migration needed)
- ✅ contracts/GET-feedbacks.md (complete)
- ✅ quickstart.md (complete)
- ✅ SPEC.md (3 User Stories: US1-P1, US2-P1, US3-P2)

**Organization**: Tasks grouped by user story for independent implementation and testing.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story ID (US1, US2, US3)
- File paths follow VMS structure: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify schema and prepare for feedback list feature

**⚠️ Prerequisites**: MySQL 8.0+, Prisma CLI, UC48 completed

- [ ] T001 [P1] Verify `feedbacks` table exists in `backend/prisma/schema.prisma`:
  - CONFIRM fields: id, event_id, user_id, rating (1-5), comment (TEXT), created_at, is_active
  - Relationships: feedbacks → events, feedbacks → users
  - NO NEW TABLES needed (reuses UC48 schema)

- [ ] T002 [P1] Create database indexes in MySQL:
  - Run: `CREATE INDEX idx_feedbacks_event_created ON feedbacks(event_id, created_at DESC);`
  - Run: `CREATE INDEX idx_feedbacks_rating ON feedbacks(rating);`
  - Verify indexes exist: `SHOW INDEX FROM feedbacks;`

- [ ] T003 [P1] Run Prisma regeneration:
  - `cd backend && npx prisma generate`
  - Confirm Prisma Client types updated for feedback queries

**Checkpoint**: Database ready, indexes created → Can proceed to Backend

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared utilities for feedback feature

**⚠️ CRITICAL**: Must complete before user stories

- [ ] T004 [P2] Add comment truncation utility in `backend/src/utils/string.util.js`:
  - Function: `truncateComment(comment, maxLength = 100)` - Returns snippet + "..."
  - Export as named export

- [ ] T005 [P2] Verify USER_PUBLIC_PROFILE_SELECT constant in `backend/src/constants/user.constant.js`:
  - Constant: `{ id: true, full_name: true, avatar_url: true }`
  - Reused from UC22-UC47, create if missing

**Checkpoint**: Foundation ready → User stories can begin in parallel

---

## Phase 3: User Story 1 - View General Feedback List (Priority: P1) 🎯

**Goal**: Staff xem danh sách tổng quát các phản hồi (volunteer, event, rating, date)

**Independent Test**: GET `/api/v1/feedbacks` → Returns feedback list với pagination

### Backend Implementation for User Story 1

- [ ] T006 [P] [US1] Add method `getList(staffOrganizationId, { limit, offset })` to `backend/src/repositories/feedback.repository.js`:
  - Query: INNER JOIN feedbacks → users, INNER JOIN events
  - Filter: `WHERE events.organization_id = ? AND events.status = 'COMPLETED' AND feedbacks.is_active = true`
  - Include: user (id, full_name, avatar_url), event (id, title)
  - Include: feedback (id, rating, comment, created_at)
  - Pagination: `skip: offset, take: limit`
  - Order: `created_at DESC` (newest first)
  - Return: { feedbacks: [...], total: count }

- [ ] T007 [US1] Add method `getFeedbackList(staffId, { limit = 20, offset = 0 })` to `backend/src/services/feedback.service.js`:
  - Step 1: Get Staff organization_id from userRepository
  - Step 2: Call feedbackRepository.getList(organizationId, { limit, offset })
  - Step 3: Transform comments using truncateComment() helper (100 chars max)
  - Step 4: Calculate pagination metadata (total, hasMore)
  - Return: { feedbacks, pagination }

- [ ] T008 [US1] Add controller method `getFeedbackList()` to `backend/src/controllers/feedback.controller.js`:
  - Extract limit, offset from req.query (defaults: 20, 0)
  - Call feedbackService.getFeedbackList(req.user.id, { limit, offset })
  - Return successResponse with data + pagination
  - Error handling: catch NotFoundError (404), ForbiddenError (403)

- [ ] T009 [US1] Add Zod validation schema `feedbackListSchema` in `backend/src/validators/feedback.validator.js`:
  - Validate limit: integer, min 1, max 100, default 20
  - Validate offset: integer, min 0, default 0
  - Export as named export

- [ ] T010 [US1] Register route in `backend/src/routes/feedback.routes.js`:
  - Route: `GET /feedbacks`
  - Middleware: authMiddleware, roleMiddleware(['STAFF', 'MANAGER', 'ADMIN'])
  - Middleware: validateRequest(feedbackListSchema)
  - Handler: feedbackController.getFeedbackList
  - Verify route registered in main router

- [ ] T011 [P] [US1] Write unit tests for `backend/tests/unit/repositories/feedback.repository.test.js`:
  - Test getList() returns feedbacks + total
  - Test getList() respects pagination (limit/offset)
  - Test getList() filters by organization
  - Mock Prisma, target 80% coverage

- [ ] T012 [P] [US1] Write unit tests for `backend/tests/unit/services/feedback.service.test.js`:
  - Test getFeedbackList() returns data
  - Test comment truncation works (100 chars max)
  - Test pagination metadata correct
  - Mock repositories, target 80% coverage

- [ ] T013 [P] [US1] Write integration tests for `backend/tests/integration/feedback.integration.test.js`:
  - Test GET /feedbacks happy path → 200 OK
  - Test pagination (offset=20) → correct page
  - Test limit validation (limit=150) → 400 Bad Request
  - Test authorization: Staff from Org A cannot see Org B feedbacks → 403
  - Test VOLUNTEER role → 403 Forbidden
  - Use Supertest, verify response matches contract

- [ ] T014 [US1] Add Swagger JSDoc above `getFeedbackList()` in `backend/src/controllers/feedback.controller.js`:
  - @swagger tag, @route GET /api/v1/feedbacks
  - @query limit (integer, optional, default 20, max 100)
  - @query offset (integer, optional, default 0)
  - @responses 200 (with example), 400, 403, 500
  - Include examples from contract doc

**Checkpoint**: User Story 1 complete - Staff can view general feedback list

---

## Phase 4: User Story 2 - Filter by Event (Priority: P1) 🎯

**Goal**: Staff lọc phản hồi theo một sự kiện cụ thể

**Independent Test**: GET `/api/v1/feedbacks?eventId=uuid` → Returns filtered list

### Backend Implementation for User Story 2

- [ ] T015 [P] [US2] Add `eventId` filter parameter to `getList()` in `backend/src/repositories/feedback.repository.js`:
  - Update WHERE clause: `AND events.id = :eventId` (if eventId provided)
  - Return same structure: { feedbacks, total }

- [ ] T016 [US2] Update `getFeedbackList()` in `backend/src/services/feedback.service.js`:
  - Accept `{ eventId, limit, offset }` parameters
  - If eventId provided: validate event exists and belongs to staff's organization
  - Pass eventId to repository.getList()
  - Add `filters_applied: { event_id }` to response

- [ ] T017 [US2] Update validation schema `feedbackListSchema` in `backend/src/validators/feedback.validator.js`:
  - Add eventId: z.string().uuid().optional()
  - Keep existing limit/offset validation

- [ ] T018 [US2] Update controller `getFeedbackList()` in `backend/src/controllers/feedback.controller.js`:
  - Extract eventId from req.query
  - Pass to feedbackService.getFeedbackList()
  - Handle 404 if event not found

- [ ] T019 [P] [US2] Add unit tests for event filter in `backend/tests/unit/services/feedback.service.test.js`:
  - Test getFeedbackList() with valid eventId → filtered results
  - Test getFeedbackList() with invalid eventId → throws NotFoundError
  - Test getFeedbackList() with event from wrong org → throws ForbiddenError

- [ ] T020 [P] [US2] Add integration tests for event filter in `backend/tests/integration/feedback.integration.test.js`:
  - Test GET /feedbacks?eventId=uuid → 200 OK filtered
  - Test invalid UUID → 400 Bad Request
  - Test event not found → 404 Not Found
  - Test event from wrong organization → 403 Forbidden

- [ ] T021 [US2] Update Swagger docs in `backend/src/controllers/feedback.controller.js`:
  - Add @query eventId (UUID, optional) parameter
  - Update response example to show filters_applied

**Checkpoint**: User Story 2 complete - Event filter functional

---

## Phase 5: User Story 3 - Filter by Rating (Priority: P2) 🎯

**Goal**: Staff lọc theo điểm đánh giá (ví dụ: chỉ xem 1-2 sao)

**Independent Test**: GET `/api/v1/feedbacks?ratingMin=1&ratingMax=2` → Returns low-rated feedbacks

### Backend Implementation for User Story 3

- [ ] T022 [P] [US3] Add rating filter to `getList()` in `backend/src/repositories/feedback.repository.js`:
  - Update WHERE: `AND feedbacks.rating BETWEEN :ratingMin AND :ratingMax` (if provided)
  - Return same structure

- [ ] T023 [US3] Update `getFeedbackList()` in `backend/src/services/feedback.service.js`:
  - Accept `{ eventId, ratingMin, ratingMax, limit, offset }`
  - Validate: ratingMin <= ratingMax
  - Pass rating filters to repository
  - Add rating filters to `filters_applied` response

- [ ] T024 [US3] Update validation schema in `backend/src/validators/feedback.validator.js`:
  - Add ratingMin: z.coerce.number().int().min(1).max(5).optional()
  - Add ratingMax: z.coerce.number().int().min(1).max(5).optional()
  - Add refine: ratingMin <= ratingMax

- [ ] T025 [US3] Update controller in `backend/src/controllers/feedback.controller.js`:
  - Extract ratingMin, ratingMax from req.query
  - Pass to service

- [ ] T026 [P] [US3] Add unit tests for rating filter in `backend/tests/unit/services/feedback.service.test.js`:
  - Test with valid rating range (1-3) → filtered
  - Test with ratingMin > ratingMax → throws ValidationError

- [ ] T027 [P] [US3] Add integration tests in `backend/tests/integration/feedback.integration.test.js`:
  - Test GET /feedbacks?ratingMin=1&ratingMax=2 → 200 OK
  - Test ratingMin > ratingMax → 400 Bad Request
  - Test rating out of bounds (0, 6) → 400 Bad Request

- [ ] T028 [US3] Update Swagger docs in `backend/src/controllers/feedback.controller.js`:
  - Add @query ratingMin, ratingMax parameters
  - Update examples with rating filter

**Checkpoint**: User Story 3 complete - Rating filter functional

---

## Phase 6: Frontend Implementation 🎨

**Goal**: Build UI for all 3 user stories (list + filters)

**Independent Test**: Navigate to /feedbacks → See list with working filters

- [ ] T029 [P] Create API client in `frontend/src/api/feedback.api.js`:
  - Function: `getFeedbackList({ eventId, ratingMin, ratingMax, limit = 20, offset = 0 })`
  - Use axios.get with credentials
  - Return Promise with response.data

- [ ] T030 Create FeedbackListPage in `frontend/src/pages/FeedbackListPage.jsx`:
  - State: feedbacks, pagination, loading, error, filters
  - Render: Page title + FilterPanel + DataGrid + Pagination
  - Event handlers: handleFilterChange, handlePageChange
  - Role check: STAFF/MANAGER/ADMIN only

- [ ] T031 [P] Create FeedbackFilterPanel in `frontend/src/components/feedback/FeedbackFilterPanel.jsx`:
  - Inputs: Event selector (Autocomplete), Rating range (two selects)
  - Button: "Apply Filters", "Clear Filters"
  - PropTypes validation
  - Debounce form submission (300ms)

- [ ] T032 [P] Create FeedbackDataGrid in `frontend/src/components/feedback/FeedbackDataGrid.jsx`:
  - Columns: Volunteer (name + avatar), Event, Rating (stars), Comment Snippet, Date
  - onRowClick: Navigate to UC50 (feedback detail)
  - PropTypes: rows, loading, onPageChange, pagination
  - Use Material UI DataGrid

- [ ] T033 [P] Create useFeedbackList hook in `frontend/src/hooks/useFeedbackList.js`:
  - Manage filters state (eventId, ratingMin, ratingMax)
  - Fetch data with filters + pagination
  - Return: { feedbacks, pagination, loading, error, applyFilters, changePage }

- [ ] T034 [P] Create EventSelector component in `frontend/src/components/feedback/EventSelector.jsx`:
  - Fetch COMPLETED events from eventApi
  - Render Autocomplete with event title
  - PropTypes: onSelect, organizationId

- [ ] T035 [P] Create RatingRangeSelector in `frontend/src/components/feedback/RatingRangeSelector.jsx`:
  - Two dropdowns: Min (1-5), Max (1-5)
  - Validation: min <= max
  - PropTypes: value, onChange

- [ ] T036 [P] Add empty state in `frontend/src/components/feedback/EmptyState.jsx`:
  - Variant: "no-feedbacks" (when no data)
  - Variant: "no-results" (when filters return empty)
  - Use Material UI: Box, Typography, Icon

- [ ] T037 [P] Write component tests in `frontend/src/components/feedback/__tests__/FeedbackListPage.test.jsx`:
  - Test renders with data
  - Test filter panel interaction
  - Test pagination works
  - Test empty state shows
  - React Testing Library + Jest

- [ ] T038 [P] Write E2E tests in `frontend/src/__tests__/e2e/FeedbackList.e2e.test.jsx`:
  - Test full flow: Login → Feedbacks → Apply event filter → See results
  - Test rating filter works
  - Test pagination navigation
  - Use Cypress or Playwright

**Checkpoint**: Frontend complete - Full UI for all 3 user stories

---

## Phase 7: Integration & Polish 🎯

**Goal**: Wire everything together and polish UX

- [ ] T039 Register route in `frontend/src/routes/index.js`:
  - Route: `/feedbacks`
  - Component: FeedbackListPage
  - Protected: Role guard ['STAFF', 'MANAGER', 'ADMIN']

- [ ] T040 Add navigation item in `frontend/src/components/layout/Sidebar.jsx`:
  - Label: "Feedback Management"
  - Icon: FeedbackIcon (Material UI)
  - Path: `/feedbacks`
  - Visible for: STAFF, MANAGER, ADMIN

- [ ] T041 Update API_CONTRACTS.md:
  - Section: "Feedback Management"
  - Document: GET /api/v1/feedbacks
  - Include request/response examples
  - Include all filter parameters

- [ ] T042 Performance testing:
  - Test with 1000 feedbacks, limit=20 → Verify < 1.2s (SC-001)
  - Test event filter → Verify < 500ms
  - Test rating filter → Verify < 800ms

**Checkpoint**: Feature complete - Ready for deployment

---

## Dependencies & Execution Order

### Critical Path (Must Complete in Order)
1. **T001-T003** (Setup) → BLOCKING all
2. **T004-T005** (Foundation) → BLOCKING T007
3. **T006** (Repository) → BLOCKING T007
4. **T007** (Service) → BLOCKING T008
5. **T008** (Controller) → BLOCKING T010
6. **T010** (Routes) → BLOCKING T013

### Parallel Opportunities

**Backend Block 1** (After T003):
- T006 (Repository for US1)
- T009 (Validation schema)
- T004, T005 (Utilities)

**Backend Block 2** (After T010):
- T011, T012 (Unit tests - independent)
- T013 (Integration tests)
- T014 (Swagger docs)

**US2 Extension** (After US1 complete):
- T015-T021 can all run after T014

**US3 Extension** (After US2 complete):
- T022-T028 can all run after T021

**Frontend Block** (After Backend API complete):
- T029-T038 can all run in parallel (different files)

**Final Block**:
- T039-T042 (Sequential integration steps)

### Task Dependency Graph
```
T001-T003 (Setup)
    ↓
T004-T005 (Foundation)
    ↓
T006 (Repository US1) ─→ T007 (Service US1) ─→ T008 (Controller US1) ─→ T010 (Routes US1)
    ↓                                                                          ↓
T009 (Validation)                                                         T011-T014 (Tests + Docs US1)
                                                                               ↓
                                                                          T015-T021 (US2 Extension)
                                                                               ↓
                                                                          T022-T028 (US3 Extension)
                                                                               ↓
Backend Complete → Frontend Start
    ↓
T029-T038 (Frontend - All Parallel)
    ↓
T039-T042 (Integration & Polish)
    ↓
DONE ✅
```

---

## Implementation Strategy

### MVP: User Story 1 Only (Estimated: 4 hours)
- T001-T014: Basic feedback list without filters
- Deliverable: Staff can view feedback list with pagination
- Independent test: GET /feedbacks → Returns paginated list

### Increment 1: Add Event Filter (Estimated: 2 hours)
- T015-T021: User Story 2
- Deliverable: Staff can filter by event
- Independent test: GET /feedbacks?eventId=uuid → Filtered list

### Increment 2: Add Rating Filter (Estimated: 2 hours)
- T022-T028: User Story 3
- Deliverable: Staff can filter by rating
- Independent test: GET /feedbacks?ratingMin=1&ratingMax=2 → Low-rated feedbacks

### Increment 3: Frontend (Estimated: 3 hours)
- T029-T038: UI for all features
- Deliverable: Complete frontend with all filters

### Increment 4: Polish (Estimated: 1 hour)
- T039-T042: Integration, routing, performance
- Deliverable: Production-ready feature

**Total Estimated Time**: 12 hours (can be reduced to 8-10 hours with parallel work)

---

## Testing Checklist

### Backend Unit Tests
- [ ] feedback.repository.js: getList() with filters
- [ ] feedback.service.js: getFeedbackList() with authorization
- [ ] string.util.js: truncateComment() function
- [ ] Target: 80% coverage for Service layer

### Backend Integration Tests
- [ ] GET /feedbacks: Happy path (15 scenarios)
- [ ] Authorization: Organization-based access
- [ ] Validation: UUID format, rating range, limit/offset
- [ ] Filters: Event filter, rating filter, combined
- [ ] Pagination: Offset/limit work correctly

### Frontend Tests
- [ ] FeedbackListPage: Renders with data
- [ ] FeedbackFilterPanel: Form submission
- [ ] FeedbackDataGrid: Row display and click
- [ ] useFeedbackList: State management
- [ ] E2E: Full user journey

---

## Success Criteria

- [ ] All 42 tasks completed
- [ ] Backend unit test coverage ≥ 80%
- [ ] All 15 integration test scenarios passing
- [ ] Frontend component tests passing
- [ ] E2E tests passing
- [ ] Performance: List load < 1.2s (SC-001)
- [ ] Performance: Event filter < 500ms
- [ ] Performance: Rating filter < 800ms
- [ ] Swagger documentation complete
- [ ] API_CONTRACTS.md updated
- [ ] No ESLint warnings
- [ ] Code review approved
- [ ] Branch `049-feat-view-feedback-list` merged to Dev

---

**Total Tasks**: 42  
**Backend Tasks**: 23 (Setup + US1-US3 implementation + tests)  
**Frontend Tasks**: 14 (UI components + tests)  
**Integration Tasks**: 5 (Routing + docs + performance)

**Status**: READY FOR IMPLEMENTATION ✅  
**Next Action**: Run `/speckit-implement` to execute all tasks

---

**Last Updated**: 2026-07-01 12:02 AM  
**Feature Owner**: TienTD  
**Reviewer**: (Assign after implementation)

# Tasks: View Feedback Detail (UC50)

**Input**: Design documents from `.sdd/TienTD/UC50-feat-feedback-detail/`

**Prerequisites**: plan.md (✅), spec.md (✅), research.md (✅), data-model.md (✅), contracts/ (✅), quickstart.md (✅)

**Feature Owner**: Member 3 - TienTD

**Branch**: `050-feat-feedback-detail`

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Backend Foundation

**Purpose**: Setup backend infrastructure for feedback detail endpoint

**⚠️ CRITICAL**: All backend tests MUST be written FIRST and FAIL before implementation

---

### Backend Tests (Write First, Must Fail)

- [ ] T001 [P] [US1] Tạo unit test cho Repository method `getById()` trong `backend/tests/unit/feedback.repository.test.js`
  - Test scenarios: Valid ID + org, Invalid ID, Wrong org, Soft deleted feedback
  - Expected: 4 test cases, all FAILING initially

- [ ] T002 [P] [US1] Tạo unit test cho Service method `getFeedbackDetail()` trong `backend/tests/unit/feedback.service.test.js`
  - Test scenarios: Valid request, Anonymous feedback, NotFoundError, ForbiddenError
  - Coverage target: ≥ 80%
  - Expected: 6 test cases, all FAILING initially

- [ ] T003 [P] [US1] Tạo integration test cho endpoint GET /feedbacks/:id trong `backend/tests/integration/feedback.test.js`
  - Test scenarios:
    1. 200 OK with full feedback data
    2. 200 OK for anonymous feedback (volunteer: null)
    3. 400 Bad Request for invalid UUID format
    4. 401 Unauthorized when not authenticated
    5. 403 Forbidden for VOLUNTEER role
    6. 404 Not Found for wrong organization
    7. 404 Not Found for non-existent feedback
    8. Comment preserves line breaks
  - Expected: 8 test cases, all FAILING initially

**Checkpoint**: All tests written and FAILING - Ready for implementation

---

### Backend Implementation

- [ ] T004 [P] [US1] Thêm Zod validation schema `getFeedbackDetailSchema` vào `backend/src/modules/feedback/feedback.validation.js`
  - Validate params.id is UUID v4 format
  - Return clear error message for invalid format
  - Export schema for controller use

- [ ] T005 [US1] Implement Repository method `getById(feedbackId, staffOrganizationId)` trong `backend/src/modules/feedback/feedback.repository.js`
  - Single Prisma query với include: user (PUBLIC_PROFILE_SELECT), event
  - WHERE clause: id + organization filter + is_active = true
  - Return null if not found
  - Performance target: < 100ms query time

- [ ] T006 [US1] Implement Service method `getFeedbackDetail(staffId, feedbackId)` trong `backend/src/modules/feedback/feedback.service.js`
  - Extract staff organization_id from JWT (via staffId lookup)
  - Call feedbackRepository.getById() với org filter
  - Transform response: rename 'user' → 'volunteer', handle anonymous
  - Throw NotFoundError if feedback not found
  - Throw ForbiddenError if wrong organization
  - Format dates to ISO 8601

- [ ] T007 [US1] Implement Controller method `getFeedbackDetail()` trong `backend/src/modules/feedback/feedback.controller.js`
  - Validate request params với Zod schema (T004)
  - Extract staffId from req.user.id (JWT)
  - Call feedbackService.getFeedbackDetail()
  - Return standardized response format (ADR-006)
  - Handle errors: ValidationError → 400, NotFoundError → 404, ForbiddenError → 403

- [ ] T008 [US1] Register route GET /feedbacks/:id trong `backend/src/modules/feedback/feedback.routes.js`
  - Apply authMiddleware.authenticate (JWT validation)
  - Apply authMiddleware.authorize(['STAFF', 'MANAGER', 'ADMIN'])
  - Wire to feedbackController.getFeedbackDetail
  - Order: Place BEFORE dynamic routes to avoid conflicts

- [ ] T009 [P] [US1] Thêm Swagger JSDoc documentation cho endpoint GET /feedbacks/:id trong `backend/src/modules/feedback/feedback.controller.js`
  - @swagger tags: Feedbacks
  - Document path parameter: id (UUID)
  - Document responses: 200, 400, 401, 403, 404, 500
  - Include example requests và responses (cả anonymous và non-anonymous)
  - Reference: contracts/api-endpoints.md

**Checkpoint**: Backend implementation complete, all unit tests PASSING

---

### Backend Verification

- [ ] T010 [US1] Run all backend tests và verify coverage
  - Execute: `cd backend && npm test -- feedback`
  - Verify: Unit tests (T002) passing với ≥ 80% service coverage
  - Verify: Integration tests (T003) passing, all 8 scenarios green
  - Fix any failing tests before proceeding

- [ ] T011 [P] [US1] Run ESLint và fix all errors
  - Execute: `cd backend && npm run lint`
  - Fix: No errors, no warnings
  - Format: Run `npm run format` if applicable

- [ ] T012 [P] [US1] Manual API testing với curl/Postman
  - Test happy path: GET /feedbacks/:id với valid JWT
  - Test error paths: Invalid UUID, Wrong org, Missing auth
  - Verify response times: p95 < 500ms
  - Document results in quickstart.md examples

**Checkpoint**: Backend fully tested và production-ready

---

## Phase 2: User Story 1 - Xem chi tiết phản hồi (Priority: P1) 🎯 MVP

**Goal**: Staff có thể xem toàn bộ nội dung feedback với full comment, volunteer info, event context

**Independent Test**: Login as Staff → Navigate to UC49 list → Click feedback row → Verify detail page shows full data

---

### Frontend API Client

- [ ] T013 [US1] Thêm API client method `getFeedbackDetail(id)` vào `frontend/src/services/feedbackService.js`
  - HTTP method: GET
  - URL: `/api/v1/feedbacks/${id}`
  - Config: `{ withCredentials: true }` để gửi JWT cookie
  - Return: Promise<FeedbackDetail>
  - Error handling: Transform Axios errors to user-friendly messages

---

### Frontend Components (Core)

- [ ] T014 [P] [US1] Tạo component `ImagePreviewDialog` trong `frontend/src/components/Feedback/ImagePreviewDialog.jsx`
  - Props: open (bool), imageUrl (string), onClose (func)
  - Use Material UI Dialog với fullWidth maxWidth="md"
  - Display image với CSS: maxWidth: '100%', height: 'auto'
  - Close handlers: Click outside, ESC key, Close button
  - Accessibility: aria-label, role="dialog"

- [ ] T015 [P] [US1] Tạo component `BackButton` trong `frontend/src/components/Feedback/BackButton.jsx`
  - Props: navigationState (object, optional from location.state)
  - Use React Router navigate() với state preservation
  - Button style: Material UI Button variant="outlined"
  - Logic: If navigationState exists → pass to navigate(), else navigate clean
  - Icon: ArrowBack from @mui/icons-material

---

### Frontend Main Page

- [ ] T016 [US1] Tạo page component `FeedbackDetailPage` trong `frontend/src/pages/FeedbackDetailPage.jsx`
  - Dependencies: T013 (API client), T014 (ImagePreviewDialog), T015 (BackButton)
  - Layout sections:
    1. Header với BackButton (T015)
    2. Volunteer Info Section (conditional: hide if anonymous)
    3. Event Context Section
    4. Rating Display (5-star rating component)
    5. Comment Section với `whiteSpace: 'pre-wrap'` style
    6. Images Gallery (empty for MVP, placeholder for future)
  - State management: loading, error, feedbackData
  - useEffect: Fetch data on mount với feedbackId from useParams()
  - Loading state: Material UI Skeleton components
  - Error handling: Display user-friendly error messages
  - Anonymous handling: Show "Anonymous" với generic avatar khi is_anonymous = true

---

### Frontend Routing

- [ ] T017 [US1] Register route /feedbacks/:id trong `frontend/src/routes/index.jsx`
  - Path: `/feedbacks/:id`
  - Element: `<FeedbackDetailPage />`
  - Protection: Require authentication (PrivateRoute wrapper)
  - Authorization: STAFF, MANAGER, ADMIN roles only

- [ ] T018 [US1] Update UC49 FeedbackList component để add navigation to detail
  - File: `frontend/src/pages/FeedbackListPage.jsx` (hoặc DataGrid component)
  - Add onRowClick handler to DataGrid
  - Navigate to `/feedbacks/${row.id}` với state: `{ returnFilters: currentFilters, returnPage: currentPage }`
  - Preserve current filters và pagination state cho back navigation

**Checkpoint**: User Story 1 complete - Staff can view full feedback detail

---

## Phase 3: User Story 2 - Quay lại danh sách (Priority: P1)

**Goal**: Staff có thể quay lại UC49 list với filters và pagination preserved

**Independent Test**: UC49 (with filters) → Click feedback → UC50 detail → Click Back → Verify UC49 retains filters

---

### Navigation State Implementation

- [ ] T019 [US2] Update BackButton component (T015) để properly handle navigation state
  - Already implemented in T015, verify functionality works correctly
  - Test: Navigate from filtered UC49 → UC50 → Back → Filters preserved

- [ ] T020 [US2] Verify UC49 FeedbackListPage reads navigation state from location.state
  - File: `frontend/src/pages/FeedbackListPage.jsx`
  - Check if component reads `location.state.returnFilters` and `location.state.returnPage`
  - If not implemented yet, add logic to restore filters/page from location.state
  - Priority: Only if UC49 doesn't already handle this

**Checkpoint**: User Story 2 complete - Back navigation preserves UC49 state

---

## Phase 4: Frontend Testing

**Purpose**: Verify frontend functionality với automated tests

---

- [ ] T021 [P] [US1] Tạo component test cho FeedbackDetailPage trong `frontend/src/pages/__tests__/FeedbackDetailPage.test.jsx`
  - Test scenarios:
    1. Renders loading skeleton initially
    2. Displays feedback data after successful fetch
    3. Shows "Anonymous" for anonymous feedback
    4. Preserves line breaks in comment display
    5. Handles 404 error gracefully
    6. Back button navigates correctly
    7. Opens image lightbox on thumbnail click (future)
  - Mock: feedbackService.getFeedbackDetail()
  - Coverage target: ≥ 70%

- [ ] T022 [P] [US2] Tạo navigation flow test cho UC49 → UC50 → UC49 trong `frontend/src/__tests__/feedback-flow.test.jsx`
  - Test scenario:
    1. User applies filters on UC49
    2. Clicks feedback row
    3. Detail page loads with correct data
    4. Clicks Back button
    5. UC49 still has same filters/page
  - Use React Testing Library với memory router
  - Mock API calls

- [ ] T023 [US1+US2] Run all frontend tests và verify coverage
  - Execute: `cd frontend && npm test -- Feedback`
  - Verify: All tests passing
  - Coverage: ≥ 70% for components
  - Fix any failing tests

**Checkpoint**: Frontend fully tested

---

## Phase 5: Integration & Polish

**Purpose**: End-to-end testing và final quality checks

---

- [ ] T024 [US1] E2E manual testing - Happy path
  - Login as staff@org1.com
  - Navigate to UC49 feedback list
  - Click on feedback row
  - Verify UC50 displays: Full comment, volunteer info, event context, rating
  - Verify page load time < 1 second (SC-001 from spec)
  - Test with different feedbacks (normal, anonymous, long comment)

- [ ] T025 [US1] E2E manual testing - Error paths
  - Test cross-organization access (should get 404)
  - Test with VOLUNTEER role (should get 403)
  - Test with invalid feedback ID (should get 400)
  - Test with deleted feedback (should get 404)

- [ ] T026 [US2] E2E manual testing - Navigation state
  - UC49: Apply filters (e.g., rating = 5, date range)
  - UC49: Go to page 3
  - Click feedback row → UC50
  - Click Back → Verify still on page 3 với filters active

- [ ] T027 [P] Performance benchmark testing
  - Backend: Run Apache Bench với 100 requests, 10 concurrent
  - Target: Mean < 100ms, p95 < 500ms, 0% failed
  - Frontend: Chrome DevTools Lighthouse score
  - Target: Performance > 90, Accessibility > 95
  - Document results

- [ ] T028 [P] Cross-browser testing
  - Test in: Chrome, Firefox, Safari, Edge
  - Verify: Layout consistent, no console errors
  - Focus: Line breaks in comment, avatar display, back button

- [ ] T029 Code cleanup và final review
  - Remove all console.log statements
  - Remove all TODO/FIXME comments
  - Verify no ESLint errors (backend + frontend)
  - Verify Swagger docs complete và accurate
  - Run `npm run format` in both backend và frontend

- [ ] T030 [P] Update quickstart.md với actual test results
  - Document: Seed data IDs used in testing
  - Document: Actual performance benchmark results
  - Update: Any troubleshooting steps discovered during testing
  - Verify: All quickstart instructions work for new developers

**Checkpoint**: Feature ready for production deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Backend Foundation)**: No dependencies - Start immediately
  - Tests (T001-T003) MUST be written FIRST before implementation
  - Implementation (T004-T009) follows test-first approach
  - Verification (T010-T012) confirms all backend work

- **Phase 2 (User Story 1 - Frontend)**: Depends on Phase 1 backend completion
  - Cannot start until T010 passes (backend tests passing)
  - API client (T013) depends on T007 (controller implemented)
  - Components (T014-T016) can proceed in parallel after T013
  - Routing (T017-T018) depends on T016 (page component ready)

- **Phase 3 (User Story 2 - Navigation)**: Depends on Phase 2 completion
  - T019 may be no-op if T015 already handles state correctly
  - T020 integrates với existing UC49 code

- **Phase 4 (Frontend Testing)**: Depends on Phase 2 + Phase 3 completion
  - Tests (T021-T022) can run in parallel
  - Verification (T023) confirms all frontend work

- **Phase 5 (Integration & Polish)**: Depends on ALL previous phases
  - Manual testing (T024-T026) requires fully working feature
  - Performance benchmarks (T027) require stable implementation
  - Polish (T028-T030) is final step before PR

### Critical Path (Sequential Tasks)

```
T001-T003 (Write tests) 
  → T005 (Repository) 
  → T006 (Service) 
  → T007 (Controller) 
  → T008 (Routes)
  → T010 (Verify backend tests pass)
  → T013 (API client)
  → T016 (Main page - depends on T014, T015)
  → T017 (Routing)
  → T021 (Component tests)
  → T024 (E2E testing)
  → T029 (Final cleanup)
```

### Parallel Opportunities

**Backend Tests** (all parallel):
- T001, T002, T003 can be written simultaneously by same or different developers

**Backend Implementation** (some parallel):
- T004 (Validation) parallel với T009 (Swagger docs)
- T011 (ESLint) parallel với T012 (Manual testing) after T010 passes

**Frontend Components** (mostly parallel):
- T014 (ImagePreviewDialog) parallel với T015 (BackButton)
- After T013 (API client), T014 and T015 can proceed together
- T016 (Main page) depends on T014 + T015 but can integrate as they complete

**Frontend Testing** (parallel):
- T021 (Component tests) parallel với T022 (Flow tests)

**Polish Phase** (some parallel):
- T027 (Performance) parallel với T028 (Cross-browser)
- T029 (Cleanup) parallel với T030 (Quickstart update)

---

## Implementation Strategy

### TDD (Test-Driven Development) Approach

**Backend (MANDATORY)**:
1. Write ALL tests first (T001-T003) - MUST FAIL
2. Implement code (T004-T009) until tests pass
3. Refactor if needed while keeping tests green
4. Verify coverage ≥ 80% (T010)

**Why TDD**:
- Catches bugs early
- Ensures testable design
- Documents expected behavior
- Prevents regression

### MVP-First Strategy

**Phase 1-2 = MVP** (User Story 1 only):
1. Complete Backend (Phase 1)
2. Complete Frontend (Phase 2)
3. **STOP and VALIDATE**: Manual test UC50 independently
4. Demo to stakeholders if needed

**Phase 3 = Enhancement** (User Story 2):
5. Add navigation state preservation
6. Test back navigation flow
7. Deploy

### Incremental Commits

**Commit After Each Task**:
- T004: `feat(feedback): add getFeedbackDetail validation schema`
- T005: `feat(feedback): implement repository getById method`
- T006: `feat(feedback): implement service getFeedbackDetail`
- T007: `feat(feedback): add controller getFeedbackDetail`
- T008: `feat(feedback): register GET /feedbacks/:id route`
- T009: `docs(feedback): add Swagger docs for detail endpoint`
- T016: `feat(feedback): create FeedbackDetailPage component`
- T018: `feat(feedback): integrate UC49 navigation to detail page`

**Commit Message Format**: `[type]([scope]): [description]`

---

## Estimation & Timeline

### Time Estimates (Per Task)

**Backend**:
- T001-T003 (Tests): 30min each = 1.5 hours
- T004-T009 (Implementation): 15-30min each = 2 hours
- T010-T012 (Verification): 30min = 0.5 hours
- **Backend Total**: ~4 hours

**Frontend**:
- T013 (API Client): 15min
- T014-T015 (Components): 30min each = 1 hour
- T016 (Main Page): 1.5 hours
- T017-T018 (Routing): 30min
- **Frontend Total**: ~3 hours

**Navigation** (Phase 3):
- T019-T020: 30min (likely no-op if done correctly in Phase 2)

**Testing** (Phase 4):
- T021-T023: 1.5 hours

**Polish** (Phase 5):
- T024-T030: 2 hours

**Grand Total**: ~11 hours (conservative estimate)

**Realistic Timeline** (with breaks, debugging):
- **Day 1**: Backend (Phase 1) - 5 hours
- **Day 2**: Frontend (Phase 2) - 4 hours
- **Day 3**: Navigation + Testing + Polish (Phase 3-5) - 3 hours

---

## Quality Gates

### Before Moving to Next Phase

**After Phase 1 (Backend)**:
- ✅ All backend tests passing (T010)
- ✅ ESLint clean (T011)
- ✅ Manual API test successful (T012)
- ✅ Swagger docs accessible at /api-docs

**After Phase 2 (Frontend US1)**:
- ✅ Component renders without errors
- ✅ API integration working (data displayed)
- ✅ Loading state và error handling working
- ✅ Anonymous feedback displays correctly

**After Phase 4 (Testing)**:
- ✅ All automated tests passing (T023)
- ✅ Coverage targets met (80% backend, 70% frontend)

**Before PR Submission**:
- ✅ All tasks completed (T001-T030)
- ✅ E2E manual testing passed (T024-T026)
- ✅ Performance benchmarks met (T027)
- ✅ Cross-browser testing passed (T028)
- ✅ Code cleanup done (T029)
- ✅ Quickstart validated (T030)

---

## Notes

- **[P] tasks** = Different files, can run in parallel
- **[Story] labels** = Map to spec.md user stories for traceability
- **Test-First**: Backend MUST write tests before implementation
- **Commit frequently**: After each task or logical group
- **Stop at checkpoints**: Validate before proceeding
- **Constitution compliance**: All quality rules followed (see plan.md Constitution Check)
- **No scope creep**: Stick to spec.md requirements, no extra features

---

**Tasks Status**: ✅ READY FOR IMPLEMENTATION

**Generated**: 2026-07-01 00:42 AM  
**Feature Owner**: Member 3 - TienTD  
**Total Tasks**: 30  
**Estimated Time**: 11 hours (3 working days)

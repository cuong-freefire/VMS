# Tasks: View Application Detail (UC23)

**Feature Branch**: `023-feat-view-application-detail`  
**Created**: 2026-06-29  
**Status**: READY FOR IMPLEMENTATION

**Input**: Design documents from `.sdd/TienTD/UC23-feat-view-application-detail/`

**Prerequisites**: 
- ✅ plan.md (complete)
- ✅ spec.md (complete - 2 user stories)
- ✅ research.md (complete - 6 RQs resolved)
- ✅ data-model.md (complete - schemas, indexes, query patterns)
- ✅ contracts/GET-applications-applicationId.md (complete)
- ✅ quickstart.md (complete - setup guide)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, or SHARED)
- File paths follow VMS project structure: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Database Verification)

**Purpose**: Verify schema relationships và indexes đã sẵn sàng

**⚠️ Prerequisites**: MySQL 8.0+ running, Prisma CLI installed, UC22 complete (application list)

- [ ] T001 [SHARED] Verify Prisma schema có relationships: `Application → User`, `User → UserSkill`, `Application → Event` trong `backend/prisma/schema.prisma`
- [ ] T002 [SHARED] Verify index `idx_user_skills_user` tồn tại trên `user_skills(user_id)`: `SHOW INDEX FROM user_skills WHERE Key_name = 'idx_user_skills_user';`
- [ ] T003 [SHARED] Verify index `idx_applications_user` tồn tại trên `applications(user_id)`: `SHOW INDEX FROM applications WHERE Key_name = 'idx_applications_user';`
- [ ] T004 [SHARED] Nếu indexes thiếu, create migration `backend/prisma/migrations/YYYYMMDD_add_uc23_indexes/migration.sql` và apply: `npx prisma migrate deploy`

**Checkpoint**: Database schema và indexes ready → Can proceed to Foundational phase

---

## Phase 2: Foundational (Shared Infrastructure)

**Purpose**: Core infrastructure that BOTH user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend Foundation

- [ ] T005 [P] [SHARED] Create constants file `backend/src/constants/application.constants.js` - ADD new constants:
  - `USER_DETAIL_SELECT` object (id, name, email, phone_number, avatar_url - NO address, NO identity_card_number)
  - `USER_SKILL_SELECT` object (id, skill_name, level)
  - `APPLICATION_DETAIL_SELECT` object (id, status, motivation_letter, notes, submitted_at, reviewed_at, created_at)
  - Reuse existing `ApplicationStatus` enum từ UC22

- [ ] T006 [P] [SHARED] Update Zod validator `backend/src/validators/application.validator.js` - ADD new schema:
  - `applicationIdParamSchema`: applicationId (UUID format validation với `z.string().uuid()`)

- [ ] T007 [SHARED] Update repository layer `backend/src/repositories/application.repository.js` - ADD method:
  - `findDetailById(applicationId, staffOrgId)` → Prisma findUnique với deep nested include:
    - Include user với select: USER_DETAIL_SELECT
    - Include user.user_skills với select: USER_SKILL_SELECT
    - Include event với where: `{ organization_id: staffOrgId }`, select: id, name, start_date, end_date
    - Return null nếu không tìm thấy HOẶC organization mismatch

- [ ] T008 [SHARED] Update repository layer `backend/src/repositories/application.repository.js` - ADD method:
  - `calculateVolunteerStats(userId)` → Aggregate queries:
    - COUNT applications WHERE user_id AND status='APPROVED' → events_joined
    - COUNT applications WHERE user_id AND status='APPROVED' AND event.status='COMPLETED' → events_completed
    - Calculate completion_rate: (events_completed / events_joined) * 100
    - Return stats object: `{ events_joined, events_completed, completion_rate, total_volunteer_hours }`

- [ ] T009 [SHARED] Update service layer `backend/src/services/application.service.js` - ADD method:
  - `getApplicationDetail(applicationId, staffOrgId)` → Call repository methods:
    - Call `findDetailById(applicationId, staffOrgId)`
    - Throw `NotFoundError` nếu application null (covers both 404 và 403 cases)
    - Call `calculateVolunteerStats(application.user_id)` để lấy volunteer statistics
    - Merge stats vào response DTO: `application.user.statistics = stats`
    - Return full DTO với volunteer profile + skills + stats + application info + event context

- [ ] T010 [SHARED] Create audit utility (if not exists) `backend/src/utils/audit.util.js`:
  - Function `logDetailView(staffId, applicationId, volunteerId)` → Log to console hoặc database:
    - Format: `{ action: 'VIEW_APPLICATION_DETAIL', staff_id, application_id, volunteer_id, timestamp }`
    - Use Pino logger với level INFO
    - MUST NOT log sensitive data (email, phone) - only IDs

- [ ] T011 [SHARED] Update controller layer `backend/src/controllers/application.controller.js` - ADD function:
  - `getApplicationDetail(req, res, next)` → Extract applicationId từ req.params, staffOrgId từ req.user
  - Validate applicationId với applicationIdParamSchema
  - Call `applicationService.getApplicationDetail(applicationId, staffOrgId)`
  - Call `auditUtil.logDetailView(req.user.id, applicationId, application.user.id)`
  - Return `successResponse(res, 200, application, 'Application detail retrieved successfully')`
  - Use try-catch và forward errors to next(error)

- [ ] T012 [SHARED] Update routes file `backend/src/routes/application.routes.js`:
  - ADD route: `GET /:applicationId` → authenticate middleware, validate (applicationIdParamSchema), controller.getApplicationDetail
  - Ensure route is BELOW `GET /events/:eventId/applications` (UC22) để avoid path conflicts

**Checkpoint**: Backend foundation ready → Can proceed to US1 frontend

### Frontend Foundation

- [ ] T013 [P] [SHARED] Update API client `frontend/src/api/applicationApi.js` - ADD function:
  - `getApplicationDetail(applicationId)` → axios GET `/api/v1/applications/${applicationId}` với withCredentials: true
  - Return response.data

- [ ] T014 [P] [SHARED] Create UI utility `frontend/src/utils/formatters.js` (if not exists):
  - Function `formatDate(isoString)` → Format ISO date to "DD/MM/YYYY HH:mm" (Vietnamese format)
  - Function `formatPercentage(number)` → Format number to "XX.X%" với 1 decimal place

**Checkpoint**: Foundation complete → User story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Xem hồ sơ đầy đủ của ứng viên (Priority: P1) 🎯 MVP

**Goal**: Staff click vào một application từ UC22 list, xem chi tiết volunteer profile (name, avatar, email, phone, skills) và motivation letter

**Independent Test**: 
1. Navigate to `/applications/:applicationId` (từ UC22 list hoặc direct URL)
2. Verify page displays volunteer profile với đầy đủ fields: Name, Avatar, Email, Phone, Skills list
3. Verify motivation letter section hiển thị đúng content
4. Verify application status và submission date displayed

### Backend Implementation for US1

- [ ] T015 [US1] Add Swagger JSDoc documentation trong `backend/src/controllers/application.controller.js`:
  - `@swagger` comment cho GET /api/v1/applications/:applicationId
  - Document path params (applicationId UUID), auth requirement (cookieAuth), all response codes (200, 400, 401, 403, 404, 500)
  - Include example 200 response với full nested structure (volunteer profile + skills + application info + event context)
  - Include example error responses (400 Invalid UUID, 404 Not Found)

- [ ] T016 [US1] Update seed script `backend/prisma/seed-applications.js` (UC22 seed script):
  - Ensure seeded applications have associated users với full profile data (name, email, phone_number, avatar_url)
  - Ensure seeded users have user_skills records (at least 2-3 skills per user)
  - Verify event.organization_id matches staff.organization_id cho test cases

### Frontend Implementation for US1

- [ ] T017 [US1] Create VolunteerProfile component `frontend/src/components/ui/VolunteerProfile.jsx`:
  - Material UI Card component
  - Display: Avatar (CircularImage), Name (Typography variant="h5"), Email (with mailto: link), Phone (with tel: link)
  - Display skills list: Chips với skill_name và level (e.g., "First Aid - Intermediate")
  - PropTypes: volunteer (object với id, name, email, phone_number, avatar_url, user_skills array)

- [ ] T018 [US1] Create ApplicationInfo component `frontend/src/components/ui/ApplicationInfo.jsx`:
  - Material UI Card component
  - Display: Status badge (color-coded: Submitted=blue, Approved=green, Rejected=red), Submission Date (formatted), Motivation Letter (Typography với multiline)
  - PropTypes: application (object với status, motivation_letter, submitted_at, notes)

- [ ] T019 [US1] Create ApplicationDetailPage component `frontend/src/components/pages/ApplicationDetailPage.jsx`:
  - Use `useParams()` to get applicationId từ URL
  - `useState` for application object, loading state, error state
  - `useEffect` to fetch data khi applicationId changes: call `getApplicationDetail(applicationId)`
  - Layout: Material UI Container với 2 columns (Grid):
    - Left column: VolunteerProfile component
    - Right column: ApplicationInfo component
  - Handle loading state: Display CircularProgress spinner centered
  - Handle errors: 401 → redirect to login, 403/404 → display "Application not found or access denied" message
  - Add "Back to List" button → navigate to `/events/:eventId/applications` (UC22) using event.id from response

- [ ] T020 [US1] Add route trong `frontend/src/App.js`:
  - `<Route path="/applications/:applicationId" element={<ApplicationDetailPage />} />`
  - Wrap với ProtectedRoute (staff role required)

- [ ] T021 [US1] Update ApplicationListPage (UC22) `frontend/src/components/pages/ApplicationListPage.jsx`:
  - Make each table row clickable: onClick → `navigate(`/applications/${application.id}`)`
  - Alternatively: Add "View Detail" icon button (VisibilityIcon) in Actions column
  - Ensure cursor changes to pointer on hover

### Testing for US1

- [ ] T022 [US1] Write integration tests `backend/tests/integration/application-detail.test.js`:
  - Test case: GET without JWT token → 401 Unauthorized
  - Test case: GET với valid token và correct organization → 200 với full nested data (profile + skills + application info)
  - Test case: GET với wrong organization → 404 Not Found (security: don't leak existence)
  - Test case: GET với invalid UUID format → 400 Bad Request
  - Test case: GET với non-existent applicationId → 404 Not Found
  - Test case: Verify sensitive data NOT exposed (no address, identity_card_number trong response)
  - Test case: Verify deep JOIN structure (application.user.user_skills array exists)
  - Run với: `cd backend && npm test -- application-detail.test.js`

- [ ] T023 [P] [US1] Write frontend component tests `frontend/tests/components/ApplicationDetailPage.test.jsx`:
  - Test case: Renders loading spinner initially
  - Test case: Renders VolunteerProfile và ApplicationInfo after fetch success
  - Test case: Displays error message khi fetch fails (404)
  - Test case: "Back to List" button navigates correctly
  - Mock axios responses với jest.mock
  - Run với: `cd frontend && npm test -- ApplicationDetailPage.test.jsx`

**Checkpoint**: User Story 1 COMPLETE → Staff can view full application detail với volunteer profile + skills + motivation letter. Can deploy as MVP!

---

## Phase 4: User Story 2 - Kiểm tra lịch sử hoạt động (Priority: P2)

**Goal**: Display volunteer statistics (Events Joined, Completion Rate) để Staff assess volunteer reliability

**Independent Test**:
1. At ApplicationDetailPage, scroll to Volunteer Profile section
2. Verify "Volunteer Statistics" section displays:
   - Events Joined: [number]
   - Events Completed: [number]
   - Completion Rate: [percentage]%
3. Test với volunteers có different history levels (0 events, 5 events, 20+ events)

**Dependencies**: US2 builds on US1 (adds statistics section to existing detail page)

### Backend Implementation for US2

**NOTE**: Backend đã implement volunteer stats calculation trong Phase 2 (T008, T009) - NO NEW BACKEND CODE NEEDED for US2!

- [ ] T024 [US2] Verify backend returns volunteer statistics correctly:
  - Test manually: `curl "http://localhost:5000/api/v1/applications/:applicationId" -H "Cookie: vms_access_token=..."`
  - Verify response.data.application.user.statistics object exists với fields: events_joined, events_completed, completion_rate
  - Test với volunteers có 0 events (stats should show 0s gracefully, no division by zero errors)

### Frontend Implementation for US2

- [ ] T025 [US2] Create VolunteerStatistics component `frontend/src/components/ui/VolunteerStatistics.jsx`:
  - Material UI Card component với "Volunteer Statistics" title
  - Display 3 metrics in Grid layout:
    - Events Joined: Typography + number (e.g., "12")
    - Events Completed: Typography + number (e.g., "10")
    - Completion Rate: Typography + percentage (e.g., "83.3%") với color coding (green if >80%, yellow if 50-80%, red if <50%)
  - Handle edge case: If events_joined === 0, show "No event history" message
  - PropTypes: statistics (object với events_joined, events_completed, completion_rate)

- [ ] T026 [US2] Update ApplicationDetailPage component `frontend/src/components/pages/ApplicationDetailPage.jsx`:
  - ADD VolunteerStatistics component to left column (below VolunteerProfile)
  - PASS application.user.statistics to VolunteerStatistics component
  - Ensure proper spacing với Material UI spacing (mt={2})

### Testing for US2

- [ ] T027 [US2] Add integration tests to `backend/tests/integration/application-detail.test.js`:
  - Test case: Volunteer với 5 approved applications, 3 completed events → verify stats calculation correct
  - Test case: Volunteer với 0 applications → verify stats show zeros without errors
  - Test case: Volunteer với 10 approved applications, 0 completed → verify completion_rate = 0%
  - Test case: Verify stats exclude REJECTED và SUBMITTED applications (only count APPROVED)

- [ ] T028 [P] [US2] Update frontend component tests `frontend/tests/components/ApplicationDetailPage.test.jsx`:
  - Test case: Renders VolunteerStatistics section with correct data
  - Test case: Handles volunteer with no event history gracefully
  - Test case: Color coding works correctly (green/yellow/red based on completion rate)

**Checkpoint**: User Story 2 COMPLETE → Staff can assess volunteer reliability via statistics. Combined với US1, full feature is functional!

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, optimization, và final validation

### Documentation

- [ ] T029 [P] [SHARED] Update `API_CONTRACTS.md` (or `share_context.md`):
  - Add complete API contract cho `GET /api/v1/applications/:applicationId`
  - Include endpoint, auth, path params, response format với full nested structure, error codes
  - Add curl example: `curl "http://localhost:5000/api/v1/applications/:id" -H "Cookie: vms_access_token=..."`

- [ ] T030 [P] [SHARED] Update `CLAUDE.md` Section 9 (Active Implementation Plans):
  - Document UC23 completion status
  - List key decisions: Deep JOIN strategy (RQ1), Expose email+phone only (RQ2), No auto state transition (RQ3), Direct COUNT query for stats (RQ4), Custom Q&A out of scope (RQ5), React Router navigation (RQ6)
  - Note performance targets achieved: <1.5s for full detail page load

### Performance & Security Validation

- [ ] T031 [SHARED] Run performance benchmark test:
  - Use Apache Bench: `ab -n 1000 -c 100 -H "Cookie: vms_access_token=..." http://localhost:5000/api/v1/applications/:id`
  - Verify p95 response time <300ms
  - Verify full detail page loads <1.5s (SC-001 from spec.md)

- [ ] T032 [SHARED] Security audit:
  - Verify `address`, `identity_card_number` NEVER appear trong API response (manual test + integration test coverage)
  - Verify organization ownership validation prevents cross-org access (integration test T022 covers this)
  - Check error responses không leak sensitive info: 403/404 return generic "Not found" message
  - Verify audit logging DOES NOT contain sensitive data (check logs format from T010)

### Code Quality

- [ ] T033 [P] [SHARED] Run linting và fix violations:
  - Backend: `cd backend && npm run lint`
  - Frontend: `cd frontend && npm run lint`

- [ ] T034 [P] [SHARED] Verify test coverage:
  - Backend Service layer coverage ≥80%: `cd backend && npm run test:coverage`
  - Frontend component coverage ≥70%: `cd frontend && npm run test:coverage`

### Final Validation

- [ ] T035 [SHARED] Run quickstart.md validation checklist:
  - Prerequisites ✓
  - Database indexes verified ✓
  - Backend endpoint working ✓
  - Frontend UI functional ✓
  - All test cases passing ✓

- [ ] T036 [SHARED] Manual end-to-end test:
  - Login as Staff user
  - Navigate to event applications list (UC22)
  - Click on an application row → Verify navigates to detail page
  - Verify volunteer profile section displays correctly (avatar, name, email, phone, skills)
  - Verify volunteer statistics section displays correctly (events joined, completion rate)
  - Verify application info section displays correctly (status, motivation letter, dates)
  - Click "Back to List" button → Verify returns to UC22 list page
  - Test browser back/forward buttons work correctly
  - Test direct URL access: copy `/applications/:id` URL, open in new tab, verify loads correctly
  - Test cross-org access: As Staff from Org A, try to access application from Org B event → Verify 404 error

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) 
  ↓
Phase 2 (Foundational) ← BLOCKS all user stories
  ↓
├─ Phase 3 (US1) ← Can start after Phase 2
└─ Phase 4 (US2) ← Depends on US1 (adds statistics to existing page)
  ↓
Phase 5 (Polish) ← Depends on all user stories complete
```

### Critical Path

**Sequential Dependencies** (must complete in order):
1. T001 → T002 → T003 → T004 (Database verification/setup)
2. T004 → T005-T012 (Backend foundation - can parallelize within this group)
3. T012 → T015-T016 (US1 backend)
4. T013-T014 → T017-T021 (Frontend foundation + US1 frontend)
5. T021 → T025-T026 (US2 frontend builds on US1)

**Parallel Opportunities**:
- T005, T006 can run in parallel (different files)
- T007, T008 can run sequentially (same file application.repository.js, but different methods)
- T010, T011 can run sequentially (dependency: T010 must exist before T011 uses it)
- T013, T014 can run in parallel (different files)
- T015, T016 can run in parallel (documentation vs seed script)
- T017, T018 can run in parallel (different component files)
- T022, T023 can run in parallel (backend tests vs frontend tests)
- T027, T028 can run in parallel (backend tests vs frontend tests)
- T029, T030 can run in parallel (different docs)
- T033, T034 can run in parallel (linting vs coverage)

### Within Each User Story

**US1 Dependencies**:
- Foundation (T005-T014) → Backend (T015-T016) → Frontend (T017-T021) → Tests (T022-T023)

**US2 Dependencies**:
- US1 complete → Frontend changes only (T025-T026) → Tests (T027-T028)

---

## Parallel Execution Examples

### Example 1: Foundation Phase Parallelization

```bash
# Launch parallel foundation tasks together:
Task T005: "Create constants in backend/src/constants/application.constants.js"
Task T006: "Create Zod validator in backend/src/validators/application.validator.js"
Task T013: "Update API client frontend/src/api/applicationApi.js"
Task T014: "Create formatters utility frontend/src/utils/formatters.js"
```

### Example 2: US1 Frontend Components Parallelization

```bash
# Launch all US1 UI components together:
Task T017: "Create VolunteerProfile component frontend/src/components/ui/VolunteerProfile.jsx"
Task T018: "Create ApplicationInfo component frontend/src/components/ui/ApplicationInfo.jsx"
```

### Example 3: Testing Phase Parallelization

```bash
# Launch all US1 tests together:
Task T022: "Backend integration tests backend/tests/integration/application-detail.test.js"
Task T023: "Frontend component tests frontend/tests/components/ApplicationDetailPage.test.jsx"
```

---

## Implementation Strategy

### MVP First (Deliver US1 Only)

**Timeline**: ~2 days for experienced developer

1. ✅ Complete Phase 1: Setup (Database verification) - **4 tasks**
2. ✅ Complete Phase 2: Foundational (Backend + Frontend foundation) - **10 tasks**
3. ✅ Complete Phase 3: User Story 1 (Full application detail với volunteer profile) - **7 tasks**
4. **STOP and VALIDATE**: Test US1 independently
5. Deploy MVP: Staff can view full application detail từ UC22 list

**Deliverable**: Functional application detail page với volunteer profile, skills, motivation letter (no statistics yet)

### Full Feature (Add US2)

**Timeline**: +0.5 day to add statistics

1. ✅ MVP from above
2. ✅ Complete Phase 4: User Story 2 (Add volunteer statistics) - **5 tasks**
3. **STOP and VALIDATE**: Test US2 independently và combined với US1
4. Deploy full feature

**Deliverable**: Full UC23 feature với volunteer profile + statistics

### Polish & Release

**Timeline**: +0.5 day for polish

1. ✅ Full feature from above
2. ✅ Complete Phase 5: Polish (Documentation, performance, security) - **8 tasks**
3. Final validation per quickstart.md
4. Merge to Dev branch
5. Deploy to production

**Deliverable**: Production-ready UC23 với full documentation và test coverage

---

## Task Summary

**Total Tasks**: 36

**By Phase**:
- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 10 tasks
- Phase 3 (US1): 7 tasks
- Phase 4 (US2): 5 tasks
- Phase 5 (Polish): 8 tasks

**By Story**:
- SHARED (infrastructure): 24 tasks
- US1 (View full profile): 7 tasks
- US2 (View statistics): 5 tasks

**Parallel Tasks**: 10 tasks marked [P] can run in parallel

**Estimated Effort**:
- Setup: 1 hour
- Foundational: 6 hours
- US1: 5 hours
- US2: 2 hours
- Polish: 3 hours
- **Total**: ~17 hours (2 days for single developer)

---

## Success Criteria Checklist

Per spec.md requirements:

- [ ] **SC-001**: Toàn bộ trang chi tiết với đầy đủ ảnh đại diện tải xong <1.5s (verify với T031)
- [ ] **SC-002**: Thông tin kỹ năng đồng bộ với Profile updates (verify với integration tests T022)
- [ ] **SC-007**: Frontend hiển thị loading state rõ ràng (verify với T019 implementation + T023 tests)
- [ ] **FR-001**: Organization ownership validated (verify với T022 test case "wrong organization → 404")
- [ ] **FR-002**: Full data returned (name, avatar, email, phone, skills, motivation letter, status) (verify với T022 test case "valid request → 200 full data")
- [ ] **FR-016**: Sensitive data NOT logged to browser console (verify với T032 security audit)

---

## Notes

- Tests are INCLUDED (per VMS AGENTS.md: target 80% coverage cho Service layer, Definition of Done yêu cầu tests)
- All task descriptions include exact file paths
- Tasks organized by user story để enable independent implementation
- Each phase has clear checkpoint để validate before proceeding
- Parallel opportunities marked [P] để optimize development time
- Critical path identified để focus on blocking dependencies first
- UC23 extends UC22 Application module - mostly UPDATE existing files, minimal new files

---

**Tasks.md Status**: READY FOR IMPLEMENTATION ✅

**Next Step**: Begin Phase 1 (Setup) hoặc toggle to Act mode để auto-execute tasks sequentially.

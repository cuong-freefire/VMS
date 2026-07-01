# Implementation Plan: View Feedback List (UC49)

**Branch**: `049-feat-view-feedback-list` | **Date**: 2026-06-30 | **Spec**: `.sdd/TienTD/UC49-feat-view-feedback-list/SPEC.md`

**Input**: Feature specification from `.sdd/TienTD/UC49-feat-view-feedback-list/SPEC.md`

**Note**: This plan consolidates research decisions, design artifacts, and implementation roadmap for UC49.

---

## Summary

UC49 là READ-ONLY feature cho phép Staff xem danh sách phản hồi từ tình nguyện viên sau khi sự kiện hoàn thành (COMPLETED). Feature hỗ trợ filters theo sự kiện và điểm đánh giá (rating) để Staff có thể phân tích chất lượng sự kiện.

**Technical Approach** (từ research.md):
- **Query Scope**: Chỉ hiển thị feedbacks từ COMPLETED events (RQ1)
- **Pagination**: Server-side với limit/offset (RQ2 - scalable cho data growing)
- **Filters**: Query parameters cho event và rating range (RQ3 - RESTful convention)
- **Comment Display**: Truncate to 100 chars trong list view (RQ4 - performance + UX)
- **Authorization**: Organization-based access control qua JWT token

**Key Constraint**: NO database migration required - feature reuses schema từ UC48 (feedbacks table).

---

## Technical Context

**Language/Version**: 
- Backend: Node.js 18+ (ESM modules)
- Frontend: React 19 (JSX)

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger
- Frontend: Material UI (DataGrid), React Hook Form, Axios, date-fns

**Storage**: MySQL 8.0 với existing schema:
- `feedbacks` table (id, event_id, user_id, rating, comment, created_at)
- `events` table (id, organization_id, status)
- `users` table (id, full_name, avatar_url)

**Testing**: 
- Backend: Jest + Supertest (target 80% coverage)
- Frontend: Jest + React Testing Library
- Integration: 15 test scenarios (authorization, filters, pagination)

**Target Platform**: 
- Backend: Linux/Windows server
- Frontend: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+)

**Project Type**: Web service (Backend API + Frontend SPA)

**Performance Goals**: 
- Initial load < 1.2 seconds (per SC-001)
- Filter by event < 500ms
- Filter by rating < 800ms

**Constraints**: 
- Organization-based authorization (cross-org data leak prevention)
- PII protection (no email/phone in list view per FR-016)
- Read-only operations (no edit/delete feedbacks)

**Scale/Scope**: 
- Expected: 100-1000 feedbacks per organization
- Support: 20-100 items per page pagination

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASSED (Constitution template not configured for VMS project)

---

## Project Structure

### Documentation (this feature)

```text
.sdd/TienTD/UC49-feat-view-feedback-list/
├── plan.md              # This file (consolidated planning document)
├── research.md          # Phase 0 - 4 research questions resolved
├── data-model.md        # Phase 1 - Schema analysis (NO migration)
├── quickstart.md        # Phase 1 - Implementation guide
├── contracts/           # Phase 1 - API specifications
│   └── GET-feedbacks.md
├── SPEC.md              # Feature specification (3 user stories)
├── CONTEXT.md           # Problem statement and decisions
└── tasks.md             # Phase 2 - To be generated (NOT by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/
│   │   └── feedback.controller.js      # NEW: getFeedbackList()
│   ├── services/
│   │   └── feedback.service.js         # NEW: getFeedbackList(), truncateComment()
│   ├── repositories/
│   │   └── feedback.repository.js      # NEW: getList() với filters
│   ├── validators/
│   │   └── feedback.validator.js       # NEW: feedbackListSchema
│   ├── routes/
│   │   └── feedback.routes.js          # NEW: GET /feedbacks
│   └── utils/
│       └── response.util.js            # REUSE: successResponse()
└── tests/
    ├── unit/
    │   ├── services/feedback.service.test.js
    │   └── repositories/feedback.repository.test.js
    └── integration/
        └── feedback.integration.test.js

frontend/
├── src/
│   ├── api/
│   │   └── feedback.api.js             # NEW: getFeedbackList()
│   ├── pages/
│   │   └── FeedbackListPage.jsx        # NEW: Main page component
│   ├── components/
│   │   ├── feedback/
│   │   │   ├── FeedbackDataGrid.jsx    # NEW: Reusable grid
│   │   │   └── FeedbackFilterPanel.jsx # NEW: Filter UI
│   └── hooks/
│       └── useFeedbackList.js          # NEW: Data fetching hook
└── tests/
    └── components/feedback/
        └── FeedbackListPage.test.jsx
```

**Structure Decision**: Web application structure (Backend + Frontend). Reuse existing layered architecture (Controller → Service → Repository) from UC22-UC48.

---

## Complexity Tracking

**No Violations**: Feature follows established VMS patterns. No complexity justification needed.

---

## Research Decisions (Phase 0)

### RQ1: Query Scope

**Decision**: Only show feedbacks from COMPLETED events

**Rationale**: 
- Feedbacks are submitted AFTER event completion (UC48 workflow)
- Matches UC47 pattern (historical view after completion)
- Clear separation from real-time views (UC46)

**Alternatives Rejected**: 
- All event statuses: Too broad, includes events with no feedbacks
- IN_PROGRESS + COMPLETED: Feedbacks don't exist during IN_PROGRESS

---

### RQ2: Pagination Strategy

**Decision**: Server-side pagination với limit/offset

**Rationale**:
- VMS project standard (used in UC22, UC46, UC47)
- Scalable: feedback data grows over time
- Performance: Only load requested page

**Alternatives Rejected**:
- Client-side: Not scalable for 100+ feedbacks
- Cursor-based: Overly complex for simple list view

---

### RQ3: Filter Implementation

**Decision**: Query parameters (`?eventId=uuid&ratingMin=1&ratingMax=5`)

**Rationale**:
- RESTful convention for GET requests
- Bookmarkable URLs for Staff workflow
- Simpler frontend implementation

**Alternatives Rejected**:
- POST /search: Non-RESTful, harder to cache
- Separate endpoints: Too many endpoints for simple filters

---

### RQ4: Comment Display

**Decision**: Show 100-character snippet in list view

**Rationale**:
- Per SPEC FR-002: "CommentSnippet (đoạn ngắn)"
- Improves list readability and performance
- Full comment available in UC50 (detail view)

**Alternatives Rejected**:
- Full text: Breaks table layout, slow rendering
- No comment: Staff needs preview to prioritize

---

## Data Model (Phase 1)

### Entity: Feedback (Existing from UC48)

**Migration Required**: ❌ NO

**Table**: `feedbacks`
- id (UUID, PK)
- event_id (UUID, FK → events.id)
- user_id (UUID, FK → users.id)
- rating (INTEGER, 1-5)
- comment (TEXT, nullable)
- created_at (TIMESTAMP)
- is_active (BOOLEAN, soft delete)

**New Indexes Required**:
```sql
CREATE INDEX idx_feedbacks_event_created 
ON feedbacks(event_id, created_at DESC);

CREATE INDEX idx_feedbacks_rating 
ON feedbacks(rating);
```

### Query Pattern

**Primary Query**: List feedbacks with organization filter

```sql
SELECT f.id, f.rating, f.comment, f.created_at,
       u.id, u.full_name, u.avatar_url,
       e.id, e.title
FROM feedbacks f
INNER JOIN users u ON f.user_id = u.id
INNER JOIN events e ON f.event_id = e.id
WHERE e.organization_id = :staffOrganizationId
  AND e.status = 'COMPLETED'
  AND f.is_active = true
ORDER BY f.created_at DESC
LIMIT :limit OFFSET :offset;
```

**Performance Target**: 200-300ms for 1000 feedbacks

---

## API Contract (Phase 1)

### GET /api/v1/feedbacks

**Purpose**: View feedback list with optional filters

**Request**:
```http
GET /api/v1/feedbacks?eventId=uuid&ratingMin=1&ratingMax=5&limit=20&offset=0
Authorization: Bearer <JWT_TOKEN>
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "feedbacks": [
      {
        "id": "uuid",
        "volunteer": { "id": "uuid", "name": "Nguyễn Văn A", "avatar_url": "url" },
        "event": { "id": "uuid", "title": "Beach Cleanup 2026" },
        "rating": 5,
        "comment_snippet": "Sự kiện tuyệt vời! Tôi rất vui...",
        "created_at": "2026-06-20T15:30:00Z"
      }
    ],
    "pagination": { "total": 127, "limit": 20, "offset": 0, "hasMore": true }
  }
}
```

**Error Responses**:
- 400: Invalid parameters (UUID format, rating range, limit > 100)
- 401: Missing/invalid JWT token
- 403: Insufficient permissions (VOLUNTEER role or wrong organization)
- 404: Event not found
- 500: Internal server error

**Full Contract**: See `contracts/GET-feedbacks.md`

---

## Implementation Strategy

### Phase 1: Setup & Infrastructure (Estimated: 1 hour)

**Tasks**:
1. Verify database indexes exist (2 indexes)
2. Create feedback.repository.js skeleton
3. Create feedback.service.js skeleton
4. Create feedback.controller.js skeleton
5. Register routes in feedback.routes.js

**Deliverable**: API structure ready, no business logic yet

---

### Phase 2: Backend Implementation (Estimated: 3-4 hours)

**Tasks**:
1. FeedbackRepository.getList() với Prisma query
2. FeedbackService.getFeedbackList() với authorization
3. FeedbackService.truncateComment() helper
4. FeedbackController.getFeedbackList() endpoint
5. Zod validation schema (feedbackListSchema)
6. Unit tests (Service + Repository, 80% coverage)
7. Integration tests (15 scenarios)
8. Swagger JSDoc documentation

**Deliverable**: API endpoint fully functional and tested

---

### Phase 3: Frontend Implementation (Estimated: 3-4 hours)

**Tasks**:
1. feedback.api.js API client
2. FeedbackListPage.jsx main component
3. FeedbackDataGrid.jsx reusable grid
4. FeedbackFilterPanel.jsx filter UI
5. useFeedbackList.js custom hook
6. Empty state and loading skeleton components
7. Component tests (React Testing Library)
8. E2E tests (filter scenarios)

**Deliverable**: Frontend UI complete and tested

---

### Phase 4: Integration & Polish (Estimated: 1 hour)

**Tasks**:
1. Register route in frontend routing
2. Add navigation menu item
3. Test full flow (Backend + Frontend)
4. Update API_CONTRACTS.md
5. Performance testing (verify < 1.2s target)

**Deliverable**: Feature ready for deployment

---

## Testing Strategy

### Backend Unit Tests (Jest)

**Service Layer** (target 80% coverage):
- getFeedbackList() with valid filters → returns data
- getFeedbackList() with wrong organization → throws ForbiddenError
- getFeedbackList() event not COMPLETED → empty result
- truncateComment() with long text → truncates to 100 chars

**Repository Layer**:
- getList() with eventId filter → correct SQL query
- getList() with rating filter → applies BETWEEN clause
- getList() pagination → respects limit/offset

---

### Backend Integration Tests (Supertest)

**15 Test Scenarios**:
1. List all feedbacks → 200 OK with data
2. Filter by valid eventId → 200 OK filtered
3. Filter by rating range (1-3) → 200 OK filtered
4. Combine filters → 200 OK with both filters
5. Pagination (offset=20) → 200 OK second page
6. Empty result → 200 OK with empty array
7. Invalid UUID → 400 Bad Request
8. ratingMin > ratingMax → 400 Bad Request
9. limit > 100 → 400 Bad Request
10. Missing JWT → 401 Unauthorized
11. VOLUNTEER role → 403 Forbidden
12. Staff from Org A views Event from Org B → 403 Forbidden
13. Event not found → 404 Not Found (if eventId filter used)
14. Performance: 1000 feedbacks, limit=20 → < 300ms
15. Comment truncation → snippet has max 100 chars

---

### Frontend Tests (React Testing Library)

**Component Tests**:
- FeedbackListPage renders with data
- FeedbackFilterPanel submits filters correctly
- FeedbackDataGrid displays feedback rows
- Empty state shows when no data
- Loading skeleton shows during fetch
- Error message shows on API failure

**E2E Tests** (Cypress/Playwright):
- Full user flow: Login → Navigate to Feedback List → Apply filters → See results
- Pagination: Navigate to page 2 → Correct data displayed
- Filter validation: Invalid rating range → Error message
- Navigation: Click feedback row → Navigate to UC50

---

## Code Reuse Strategy

UC49 reuses infrastructure from UC22-UC48:

| Component | Reuse Level | Notes |
|-----------|-------------|-------|
| `authorization.service.js` | 100% | checkStaffOrganizationAccess() |
| `response.util.js` | 100% | successResponse(), errorResponse() |
| Error handling middleware | 100% | Centralized error classes |
| Zod validation middleware | 100% | Reuse validation pipeline |
| Frontend DataGrid | 80% | Similar to UC22 Application List |
| Frontend Filter Panel | 70% | Similar to UC46 Attendance filters |

**New Code Required**:
- FeedbackService methods (~200 LOC)
- FeedbackRepository query (~150 LOC)
- FeedbackController endpoint (~100 LOC)
- Frontend FeedbackList components (~300 LOC JSX)
- Unit + Integration tests (~400 LOC)

**Estimated Total LOC**: ~1150 new lines

---

## Performance Targets

| Metric | Target | Expected Actual |
|--------|--------|-----------------|
| Initial list load | < 1.2s | ~300ms |
| Filter by event | < 500ms | ~100ms |
| Filter by rating | < 800ms | ~200ms |
| Pagination metadata | < 200ms | ~50ms |

**Optimization Notes**:
- Database indexes critical for query performance
- Use Prisma select to avoid loading unused fields
- Separate count query for pagination metadata
- Apply LIMIT/OFFSET at database level

---

## Security Considerations

### Authorization
- ✅ JWT token required (Staff/Manager/Admin only)
- ✅ Organization ownership validated per request
- ✅ No cross-organization feedback access
- ✅ Reuse `authorization.service.js` from UC22-UC47

### Input Validation
- ✅ UUID format validation for eventId
- ✅ Rating range validation (1-5)
- ✅ ratingMin <= ratingMax validation
- ✅ Pagination limits (max 100 per page)
- ✅ Zod schema validation before service layer

### PII Protection (FR-016)
- ✅ Exposed: volunteer name, avatar_url
- ❌ Hidden: email, phone_number, address
- ✅ Use USER_PUBLIC_PROFILE_SELECT constant

---

## Cross-Module Dependencies

### Upstream Dependencies
- **UC48** (Submit Feedback): Reads feedbacks created by volunteers - REQUIRED
- **UC15-UC17** (Event Management): Reads event data for filtering - REQUIRED
- **Auth Module** (Member 1): JWT authentication and user roles - REQUIRED

### Downstream Navigation
- **UC50** (View Feedback Detail): Click feedback row → Navigate with feedback_id - OPTIONAL

### Integration Points
- Shared authorization logic from UC22-UC47
- Shared response utilities from UC22-UC48
- Shared error handling from all modules

---

## Risk Assessment

### Risk 1: Large Comment Size Impact

**Probability**: Low  
**Impact**: Medium (slow rendering)  
**Mitigation**: Truncate to 100 chars at backend layer (implemented)

---

### Risk 2: Cross-Organization Data Leak

**Probability**: Low  
**Impact**: CRITICAL (security breach)  
**Mitigation**: 
- Organization filter enforced at Repository level
- Integration test: Staff A cannot access Org B data

---

### Risk 3: Performance Degradation

**Probability**: Medium  
**Impact**: Medium (violates SC-001: < 1.2s)  
**Mitigation**:
- Database indexes on (event_id, created_at), (rating)
- Pagination limits data per request
- Performance test in integration suite

---

## Deployment Notes

### Database Changes
```sql
-- Run AFTER UC48 is deployed
CREATE INDEX IF NOT EXISTS idx_feedbacks_event_created 
ON feedbacks(event_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedbacks_rating 
ON feedbacks(rating);
```

### Environment Variables
No new environment variables required. Reuses existing:
- `JWT_SECRET` (from Auth module)
- `DATABASE_URL` (existing)

### Feature Flags
Not applicable. UC49 is a new feature with no gradual rollout needed.

---

## Success Criteria

- [ ] All 24 tasks completed (to be defined in tasks.md)
- [ ] Backend unit test coverage ≥ 80% for Service layer
- [ ] All 15 integration tests passing
- [ ] Frontend component tests passing
- [ ] E2E tests passing (filter + pagination flows)
- [ ] Performance: Initial load < 1.2s (per SC-001)
- [ ] Performance: Filter by event < 500ms
- [ ] Swagger documentation complete
- [ ] API_CONTRACTS.md updated
- [ ] No ESLint warnings or type errors
- [ ] Code review approved by TienTD
- [ ] Feature branch `049-feat-view-feedback-list` merged to Dev

---

**Total Estimated Time**: 8-10 hours

**Status**: READY FOR PHASE 2 (tasks.md generation) ✅

---

**Last Updated**: 2026-06-30 10:38 AM  
**Feature Owner**: TienTD  
**Reviewer**: (Assign after implementation complete)

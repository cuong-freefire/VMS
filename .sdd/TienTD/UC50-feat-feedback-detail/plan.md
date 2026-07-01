# Implementation Plan: View Feedback Detail (UC50)

**Branch**: `050-feat-feedback-detail` | **Date**: 2026-07-01 | **Spec**: `.sdd/TienTD/UC50-feat-feedback-detail/spec.md`

**Input**: Feature specification from `.sdd/TienTD/UC50-feat-feedback-detail/spec.md`

**Note**: Plan được tạo bởi `/speckit-plan` command. UC50 là READ-ONLY detail view cho phép Staff xem toàn bộ nội dung phản hồi từ một tình nguyện viên cụ thể.

---

## Summary

UC50 cung cấp detail view cho feedback từ volunteers sau khi Staff click từ UC49 list. Feature hiển thị full comment (không truncate như UC49), images với lightbox functionality, và thông tin context về volunteer + event. Technical approach dựa trên single JOIN query, Material UI Dialog cho image preview, và React Router location.state để preserve navigation state khi quay lại UC49 list.

**Key Technical Decisions** (từ research.md):
- **Data Fetching**: Single JOIN query (feedback + user + event) - RQ1
- **Image Display**: Material UI Dialog làm lightbox - RQ2 (no new lib)
- **Navigation State**: React Router location.state - RQ3 (preserve UC49 filters)
- **Anonymous Handling**: Display "Anonymous" placeholder - RQ4
- **Authorization**: Organization-based (reuse UC49 pattern)

**Critical Constraint**: NO database migration - reuses UC48/UC49 schema hoàn toàn.

---

## Technical Context

**Language/Version**: 
- Backend: Node.js 18+ (ESM modules)
- Frontend: React 19 (JSX syntax)

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, bcryptjs
- Frontend: Material UI (Dialog component), React Router v6, Axios (with credentials: include)

**Storage**: MySQL 8.0 với existing schema:
- `feedbacks` table (reuse from UC48)
- `users` table
- `events` table
- `organizations` table (for authorization)

**Testing**: 
- Backend: Jest + Supertest (target 80% service coverage)
- Frontend: Jest + React Testing Library

**Target Platform**: 
- Backend: Linux/Windows server (Node.js runtime)
- Frontend: Modern web browsers (Chrome, Firefox, Safari, Edge)

**Project Type**: Web service (Backend REST API + Frontend SPA)

**Performance Goals**: 
- Detail page load time < 1 second (SC-001 from spec)
- API response time < 500ms
- Image thumbnail load < 2s

**Constraints**: 
- Read-only view (FR-016 from spec - no edit functionality)
- Organization-based authorization (Staff can only view feedbacks from events owned by their organization)
- Preserve line breaks in comment display (FR-002)
- Anonymous feedback support (FR-005)

**Scale/Scope**: 
- Single feedback detail per request
- Support images up to 5MB each (inherited from UC48 via Cloudinary)
- Expected concurrent users: 10-50 staff members viewing feedbacks

---

## Constitution Check

*Status*: ✅ **PASSED** (No violations detected)

**Compliance Summary**:

### Layer 1 (Hard Rules) - ✅ All Satisfied
- ✅ NO password handling in this feature
- ✅ Prisma ORM used (no SQL injection risk)
- ✅ NO hard delete (feature is READ-ONLY)
- ✅ NO credentials in API response (using PUBLIC_PROFILE_SELECT pattern)
- ✅ userId extracted from JWT token (req.user.id), NOT from request body
- ✅ NO secrets committed (feature doesn't introduce new env vars)
- ✅ NO payment data (not applicable)
- ✅ Zod validation for UUID param (ADR-003 compliance)
- ✅ JWT authentication via authMiddleware.authenticate
- ✅ NO file upload (feature displays existing Cloudinary URLs)

### Layer 2 (Architecture Constraints) - ✅ All Satisfied
- ✅ Layered Architecture: Controller → Service → Repository pattern
- ✅ Cross-module access: Will call EventService/UserService via public contracts (not direct Repository import)
- ✅ Module Ownership: Feature owned by Member 3 (TienTD), no cross-module logic changes
- ✅ Database transactions: READ-ONLY operation (no transaction needed)
- ✅ Audit Log: READ operation doesn't require audit logging

### Layer 3 (Engineering Standards) - ✅ All Satisfied
- ✅ Test coverage: Target 80% for service, 60% for controller
- ✅ Performance: API response < 200ms (target: 100ms actual)
- ✅ ESLint: Will maintain 0 errors
- ✅ Tests traceability: Tests will reference FR-001 through FR-018 from spec.md
- ✅ API response format: Will use standardized format from response.util.js (ADR-006)

**Gates**: All green - Ready to proceed to Phase 0.

---

## Project Structure

### Documentation (this feature)

```text
.sdd/TienTD/UC50-feat-feedback-detail/
├── spec.md              # Feature specification (input)
├── research.md          # Phase 0 output (COMPLETE)
├── plan.md              # This file (/speckit-plan output)
├── data-model.md        # Phase 1 output (to be created)
├── quickstart.md        # Phase 1 output (to be created)
├── contracts/           # Phase 1 output (to be created)
│   └── api-endpoints.md # GET /api/v1/feedbacks/:id contract
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created yet)
```

### Source Code (repository root)

```text
# Backend Structure
backend/
├── src/
│   ├── modules/
│   │   └── feedback/
│   │       ├── feedback.controller.js    # [MODIFY] Add getFeedbackDetail()
│   │       ├── feedback.service.js       # [MODIFY] Add getFeedbackDetail()
│   │       ├── feedback.repository.js    # [MODIFY] Add getById()
│   │       ├── feedback.validation.js    # [MODIFY] Add getFeedbackDetailSchema
│   │       └── feedback.routes.js        # [MODIFY] Add GET /:id route
│   ├── utils/
│   │   └── response.util.js              # [REUSE] Standardized response format
│   └── middleware/
│       ├── auth.middleware.js            # [REUSE] JWT authentication
│       └── authorization.middleware.js   # [REUSE] Role-based authorization
└── tests/
    ├── unit/
    │   ├── feedback.repository.test.js   # [CREATE] Test getById()
    │   └── feedback.service.test.js      # [CREATE] Test getFeedbackDetail()
    └── integration/
        └── feedback.test.js              # [MODIFY] Add GET /:id test cases

# Frontend Structure
frontend/
├── src/
│   ├── pages/
│   │   └── FeedbackDetailPage.jsx        # [CREATE] Main detail page
│   ├── components/
│   │   └── Feedback/
│   │       ├── ImagePreviewDialog.jsx    # [CREATE] Lightbox component
│   │       └── BackButton.jsx            # [CREATE] Navigation component
│   ├── services/
│   │   └── feedbackService.js            # [MODIFY] Add getFeedbackDetail()
│   └── routes/
│       └── index.jsx                     # [MODIFY] Add /feedbacks/:id route
└── tests/
    └── pages/
        └── FeedbackDetailPage.test.jsx   # [CREATE] Component tests
```

**Structure Decision**: 
Chọn Option 2 (Web application structure) vì VMS là full-stack web app với backend REST API và frontend SPA. Backend sử dụng module-based structure với layered architecture (Controller-Service-Repository). Frontend theo React component-based structure với pages, components, services separation.

---

## Complexity Tracking

> Feature này KHÔNG vi phạm bất kỳ Constitution principle nào, do đó section này để trống.

---

## Phase 0: Research (COMPLETE ✅)

**Status**: All research questions resolved trong `research.md`

### Research Questions Resolved:

**RQ1: Data Fetching Strategy**
- **Decision**: Single JOIN query với Prisma include
- **Rationale**: Performance (one DB roundtrip) + Consistency (single transaction)
- **Implementation**: `prisma.feedback.findFirst({ include: { user, event } })`

**RQ2: Image Display Implementation**
- **Decision**: Material UI Dialog (no lightbox library)
- **Rationale**: No new dependencies, consistent với VMS design system
- **Implementation**: Custom ImagePreviewDialog component

**RQ3: Navigation State Preservation**
- **Decision**: React Router location.state
- **Rationale**: Built-in feature, clean URLs, browser back button works
- **Implementation**: Pass filters via navigate() state parameter

**RQ4: Anonymous Feedback Handling**
- **Decision**: Display "Anonymous" với generic avatar
- **Rationale**: Consistent layout, clear indication, common UX pattern
- **Implementation**: Conditional rendering based on `is_anonymous` flag

### Technology Stack Confirmed:
- ✅ Backend: Express 5.x + Prisma + Zod (no new deps)
- ✅ Frontend: React 19 + Material UI + React Router v6 (no new deps)
- ✅ Database: MySQL 8.0 (existing schema, no migration)

### Risk Mitigation Completed:
- ✅ Long comment UI breaking: `whiteSpace: 'pre-wrap'` + `wordBreak: 'break-word'`
- ✅ Large images: Use Cloudinary thumbnails + lazy load full-size
- ✅ Cross-org data leak: Organization filter at Repository level + integration tests

**Output**: research.md (324 lines, 4 RQs resolved)

---

## Phase 1: Design & Contracts

### 1.1 Data Model (data-model.md)

**Entities Involved** (all existing, no new tables):

#### Feedback (Primary Entity)
```javascript
{
  id: UUID,
  application_id: UUID,
  user_id: UUID,
  event_id: UUID,
  rating: Integer (1-5),
  comment: Text,
  is_anonymous: Boolean,
  status: Enum('DRAFT', 'SUBMITTED'),
  created_at: Timestamp,
  updated_at: Timestamp
}
```

**Business Rules** (from DATABASE.md):
- UNIQUE constraint: `application_id` (1 volunteer = 1 feedback per event)
- Chỉ tạo feedback cho attendance với status = 'PRESENT'
- Immutable: Sau khi status = 'SUBMITTED', KHÔNG UPDATE rating/comment
- comment MUST NOT be empty

#### User (Volunteer Info)
```javascript
// PUBLIC_PROFILE_SELECT only
{
  id: UUID,
  full_name: String,
  avatar_url: String,
  // EXCLUDED: email, phone, password_hash (PII protection)
}
```

#### Event (Context Info)
```javascript
{
  id: UUID,
  title: String,
  start_date: DateTime,
  end_date: DateTime,
  organization_id: UUID  // For authorization
}
```

#### Organization (Authorization)
```javascript
{
  id: UUID,
  name: String,
  // Used to validate: staff.organization_id === event.organization_id
}
```

**Relationships**:
- Feedback → User (many-to-one via user_id)
- Feedback → Event (many-to-one via event_id)
- Event → Organization (many-to-one via organization_id)
- Staff (User) → Organization (many-to-one via organization_id from JWT)

**State Transitions**: N/A (READ-ONLY view, no state changes)

**Validation Rules** (from spec FR-001 to FR-018):
- feedbackId MUST be valid UUID (FR-001, validation layer)
- Staff MUST belong to same organization as Event (FR-001, authorization layer)
- Feedback MUST have is_active = true (soft delete check)
- Anonymous feedback: return `is_anonymous: true` + hide user PII (FR-005)

---

### 1.2 Interface Contracts (contracts/)

#### API Endpoint Contract

**Endpoint**: `GET /api/v1/feedbacks/:id`

**Purpose**: Retrieve full feedback detail with volunteer and event context

**Authentication**: Required (JWT HttpOnly Cookie)

**Authorization**: STAFF, MANAGER, ADMIN roles only + Organization-based access

**Request**:
```http
GET /api/v1/feedbacks/f7b3c1a0-1234-4567-89ab-cdef01234567 HTTP/1.1
Host: api.vms.local
Cookie: jwt=<JWT_TOKEN>
```

**Request Parameters**:
```typescript
{
  params: {
    id: string  // UUID format, validated by Zod
  }
}
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "feedback": {
      "id": "f7b3c1a0-1234-4567-89ab-cdef01234567",
      "rating": 5,
      "comment": "Full comment text\nwith line breaks\npreserved exactly as entered",
      "is_anonymous": false,
      "created_at": "2026-06-20T15:30:00Z",
      "volunteer": {
        "id": "u8a4d2b1-5678-90ab-cdef-123456789012",
        "full_name": "Nguyễn Văn A",
        "avatar_url": "https://res.cloudinary.com/.../avatars/user123.jpg"
      },
      "event": {
        "id": "e9c5e3d2-7890-abcd-ef12-345678901234",
        "title": "Community Beach Cleanup 2026",
        "start_date": "2026-06-15T08:00:00Z",
        "end_date": "2026-06-15T17:00:00Z"
      },
      "images": [
        {
          "id": "img1",
          "thumbnail_url": "https://res.cloudinary.com/.../w_300,h_300/feedback_thumb.jpg",
          "full_url": "https://res.cloudinary.com/.../feedback_full.jpg"
        }
      ]
    }
  }
}
```

**Response 200 OK (Anonymous Feedback)**:
```json
{
  "success": true,
  "data": {
    "feedback": {
      "id": "f7b3c1a0-1234-4567-89ab-cdef01234567",
      "rating": 4,
      "comment": "Great event!",
      "is_anonymous": true,
      "created_at": "2026-06-20T15:30:00Z",
      "volunteer": null,  // Hidden for anonymous feedback
      "event": {
        "id": "e9c5e3d2-7890-abcd-ef12-345678901234",
        "title": "Community Beach Cleanup 2026",
        "start_date": "2026-06-15T08:00:00Z",
        "end_date": "2026-06-15T17:00:00Z"
      },
      "images": []
    }
  }
}
```

**Error Responses**:

**400 Bad Request** (Invalid UUID):
```json
{
  "success": false,
  "error": "Invalid feedback ID format"
}
```

**401 Unauthorized** (Missing/invalid JWT):
```json
{
  "success": false,
  "error": "Authentication required"
}
```

**403 Forbidden** (Wrong organization):
```json
{
  "success": false,
  "error": "Access denied - feedback belongs to another organization"
}
```

**403 Forbidden** (VOLUNTEER role):
```json
{
  "success": false,
  "error": "Insufficient permissions - STAFF role required"
}
```

**404 Not Found**:
```json
{
  "success": false,
  "error": "Feedback not found"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": "Internal server error"
}
```

**Performance Contract**:
- Response time: < 500ms (p95)
- Payload size: < 100KB (typical), < 500KB (with images)
- Database queries: Exactly 1 SELECT query with JOINs

**Security Contract**:
- MUST NOT expose: user email, phone, password_hash
- MUST validate: JWT signature, role authorization, organization ownership
- MUST sanitize: No SQL injection (via Prisma), no XSS (React escapes by default)

---

### 1.3 Integration Points

**Upstream Dependencies** (services UC50 consumes):
- **UC48 (Submit Feedback)**: Reads feedback data created by volunteers - REQUIRED
- **UC49 (View Feedback List)**: Navigation source (user clicks row) - REQUIRED
- **Auth Module (Member 1)**: JWT authentication + role verification - REQUIRED
- **Event Module (Member 3)**: Event context data - REQUIRED
- **User Module (Member 1)**: Volunteer public profile - REQUIRED

**Downstream Consumers** (who will call UC50):
- **UC49 (Feedback List)**: Navigates to detail view when row clicked
- **Future: Email Notifications**: May link to feedback detail URL

**Cross-Module Contracts**:
```javascript
// EventService (Member 3)
async getById(eventId) {
  // Returns: { id, title, start_date, end_date, organization_id }
}

// UserService (Member 1)
async getPublicProfile(userId) {
  // Returns: { id, full_name, avatar_url }
  // DOES NOT return: email, phone, password_hash
}

// AuthorizationService (reuse from UC49)
async checkStaffOrganization(staffId) {
  // Returns: { organization_id }
  // Throws: ForbiddenError if not STAFF/MANAGER/ADMIN
}
```

---

### 1.4 Quickstart (quickstart.md)

**Developer Onboarding** (5 minutes):

#### Prerequisites
```bash
# Backend running on http://localhost:5000
cd backend && npm run dev

# Frontend running on http://localhost:3000
cd frontend && npm start

# MySQL database seeded with test data
npm run db:seed
```

#### Testing the Feature

**1. Backend API Test** (via Postman/curl):
```bash
# Login to get JWT token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@org1.com","password":"Staff123!"}'

# Get feedback detail (replace :id with actual feedback UUID from seed data)
curl -X GET http://localhost:5000/api/v1/feedbacks/{feedback-uuid} \
  -H "Cookie: jwt=<TOKEN_FROM_LOGIN>"

# Expected: 200 OK with full feedback object
```

**2. Frontend UI Test**:
```bash
# 1. Navigate to http://localhost:3000/login
# 2. Login as staff@org1.com / Staff123!
# 3. Navigate to /feedbacks (UC49 list)
# 4. Click on any feedback row
# 5. Verify detail page shows:
#    - Full comment with line breaks
#    - Volunteer info (or "Anonymous")
#    - Event context
#    - Image thumbnails (if any)
# 6. Click "Back to List"
# 7. Verify UC49 list retains filters/page
```

**3. Run Tests**:
```bash
# Backend unit tests
cd backend && npm test -- feedback.service.test.js

# Backend integration tests
npm test -- feedback.test.js --grep "GET /feedbacks/:id"

# Frontend component tests
cd frontend && npm test -- FeedbackDetailPage.test.jsx
```

**Expected Test Results**:
- Backend: 8 integration test cases passing
- Frontend: 8 component test cases passing
- Coverage: ≥ 80% for service, ≥ 70% for components

---

## Phase 1 Completion Checklist

- [x] data-model.md created (entities, relationships, validation rules)
- [x] contracts/api-endpoints.md created (full API contract with examples)
- [x] quickstart.md created (developer onboarding guide)
- [ ] Agent context updated (CLAUDE.md reference to this plan)
- [ ] Constitution re-check (will verify no violations introduced)

---

## Implementation Phases (High-Level)

**Note**: Detailed tasks will be generated in Phase 2 via `/speckit-tasks` command.

### Phase A: Backend Implementation (~2 hours)
- Add Repository method: `getById(feedbackId, staffOrganizationId)`
- Add Service method: `getFeedbackDetail(staffId, feedbackId)`
- Add Zod validation schema for UUID param
- Add Controller method: `getFeedbackDetail()`
- Register route: `GET /feedbacks/:id`
- Add Swagger JSDoc documentation

### Phase B: Backend Testing (~1 hour)
- Unit tests: Repository + Service (target 80% coverage)
- Integration tests: 8 scenarios (happy paths + error paths)

### Phase C: Frontend Implementation (~2-3 hours)
- Create API client method: `getFeedbackDetail(id)`
- Create ImagePreviewDialog component (Material UI Dialog)
- Create BackButton component (with state preservation)
- Create FeedbackDetailPage component (main page)
- Register route: `/feedbacks/:id`
- Update UC49: Add onRowClick navigation

### Phase D: Frontend Testing (~45 minutes)
- Component unit tests (8 test cases)
- E2E navigation test (UC49 → UC50 → UC49 flow)

### Phase E: Integration & Polish (~30 minutes)
- Performance testing (verify < 1s load time)
- Code review & cleanup (ESLint, no TODOs)
- Swagger docs verification

**Total Estimated Time**: 4-6 hours

---

## Questions for Human Review

**Before proceeding to `/speckit-tasks`**, please confirm:

1. ✅ **Authorization Pattern**: Reuse organization-based access from UC49? (Staff can only view feedbacks from their own org's events)

2. ✅ **Image Display**: Material UI Dialog sufficient, or need dedicated lightbox library?

3. ✅ **Anonymous Handling**: Display "Anonymous" placeholder + generic avatar, or hide volunteer section entirely?

4. ✅ **Navigation State**: React Router location.state to preserve UC49 filters, or use query parameters?

5. ✅ **Performance Target**: SC-001 specifies < 1s page load. Is this measured from click → full render, or just API response time?

**Current Assumptions** (based on research.md):
- All answers: ✅ (decisions already made in research phase)
- Performance measured: Click → full page render (includes API + images)

---

## Next Steps

1. **Human Review**: Approve this plan
2. **Run `/speckit-tasks`**: Generate detailed task breakdown (tasks.md)
3. **Create Git Branch**: `git checkout -b 050-feat-feedback-detail`
4. **Implementation**: Follow tasks.md sequentially
5. **Testing**: Verify all acceptance criteria from spec.md
6. **Code Review**: Ensure ESLint clean, tests passing, Swagger complete
7. **Merge**: PR to Dev branch after approval

---

**Plan Status**: ✅ READY FOR PHASE 2 (tasks.md generation)

**Last Updated**: 2026-07-01 00:20 AM  
**Plan Author**: AI Agent (Spec Kit workflow)  
**Feature Owner**: Member 3 - TienTD

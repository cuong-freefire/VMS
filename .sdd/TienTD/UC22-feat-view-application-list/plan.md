# Implementation Plan: View Application List (UC22)

**Branch**: `022-feat-view-application-list` | **Date**: 2026-06-29 | **Spec**: `.sdd/TienTD/UC22-feat-view-application-list/SPEC.md`

**Input**: Feature specification from `.sdd/TienTD/UC22-feat-view-application-list/SPEC.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Staff cần xem danh sách tình nguyện viên đã đăng ký tham gia sự kiện để bắt đầu quy trình sàng lọc và phê duyệt. Hệ thống sẽ cung cấp API endpoint GET `/api/v1/events/:eventId/applications` với khả năng lọc theo status (Submitted/Approved/Rejected) và phân trang cho datasets lớn. Technical approach tập trung vào:
1. Organization-based ownership validation (Staff chỉ thấy applications thuộc events của tổ chức mình)
2. Pagination cho performance (default 20 records/page)
3. Status filtering với query params
4. Privacy protection (không expose sensitive data như address, ID card)

## Technical Context

**Language/Version**: Node.js 18+ với ESM module system

**Primary Dependencies**: Express 5.x, Prisma ORM, Zod validation, Pino logger

**Storage**: MySQL database với Prisma schema (tables: `applications`, `users`, `events`, `organizations`)

**Testing**: Jest + Supertest cho integration tests, target 80% coverage cho Service layer

**Target Platform**: Linux server (backend API), React 19 web client (frontend)

**Project Type**: Web service - REST API + React SPA

**Performance Goals**: 
- Load 50 records in <1.2s (SC-001)
- p95 response time <200ms cho paginated queries
- Efficient JOIN queries với proper indexing

**Constraints**: 
- Organization-based access control (FR-001)
- Không hiển thị sensitive data (FR-016: address, ID card number)
- Phân trang bắt buộc khi >20 records (FR-003)
- Audit log cho mọi list access operation

**Scale/Scope**: 
- Estimated 100-500 applications per event
- Support 1000+ concurrent Staff users
- Response time <1.2s với 50 records đầu tiên

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Layer 1 (Hard Rules) — ✅ PASS
- ✅ **Authentication**: JWT token required, userId extracted from token (ADR-002, Lesson 3)
- ✅ **Input validation**: Zod schemas cho query params (eventId, status, page, limit) (ADR-003)
- ✅ **Privacy**: Không expose sensitive fields (address, identity_card_number) trong response (FR-016)
- ✅ **Database access**: Prisma ORM cho all queries (ADR-001)
- ✅ **Response format**: Tuân thủ `response.util.js` format (ADR-006)

### Layer 2 (Architecture Constraints) — ✅ PASS
- ✅ **Layered Architecture**: Controller → Service → Repository pattern
- ✅ **Module Ownership**: TienTD owns Application module, conform to ownership rules
- ✅ **Cross-module**: Event ownership validation cần read events table (via Service contract nếu Event module đã có)
- ✅ **Audit Log**: Log mọi list access với `{ who, when, what: 'VIEW_APPLICATION_LIST', event_id, filters }`

### Layer 3 (Engineering Standards) — ✅ PASS
- ✅ **Test coverage**: Target 80% cho ApplicationService.getApplicationsByEvent()
- ✅ **Performance**: Query optimization với Prisma include và proper indexing
- ✅ **API documentation**: Swagger JSDoc bắt buộc cho GET endpoint

### Violations: NONE

Tất cả Constitution checks đều PASS. Feature này tuân thủ 100% architecture constraints và security rules.

## Project Structure

### Documentation (this feature)

```text
.sdd/TienTD/UC22-feat-view-application-list/
├── SPEC.md              # Feature specification (ALREADY EXISTS)
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── GET-events-eventId-applications.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/
│   │   └── application.controller.js     # [NEW] Handle GET /events/:eventId/applications
│   ├── services/
│   │   └── application.service.js        # [NEW] Business logic cho list + filter + pagination
│   ├── repositories/
│   │   └── application.repository.js     # [NEW] Prisma queries với JOIN users + events
│   ├── routes/
│   │   └── application.routes.js         # [NEW] Route definition
│   ├── validators/
│   │   └── application.validator.js      # [NEW] Zod schemas cho query params
│   ├── middleware/
│   │   ├── auth.middleware.js            # [REUSE] JWT authentication
│   │   └── error.middleware.js           # [REUSE] Error handling
│   └── utils/
│       ├── response.util.js              # [REUSE] Standardized response format
│       └── pagination.util.js            # [NEW] Pagination helper (offset, limit, total)
├── prisma/
│   └── schema.prisma                     # [UPDATE] Verify indexes on applications(event_id, status)
└── tests/
    └── integration/
        └── application.test.js           # [NEW] Integration tests cho list endpoint

frontend/
├── src/
│   ├── api/
│   │   └── applicationApi.js             # [NEW] Axios client cho list endpoint
│   ├── components/
│   │   └── pages/
│   │       └── ApplicationListPage.jsx   # [NEW] Staff UI với table + filters + pagination
│   ├── services/
│   │   └── application.service.js        # [NEW] Frontend service layer
│   └── utils/
│       └── formatDate.js                 # [REUSE] Format submission date
└── tests/
    └── components/
        └── ApplicationListPage.test.jsx  # [NEW] Component tests
```

**Structure Decision**: 
- Web application structure (backend + frontend) được chọn vì phù hợp với kiến trúc hiện tại của VMS project.
- Backend tuân thủ layered architecture (Controller → Service → Repository) theo ADR-001.
- Frontend tách biệt API client và UI components để dễ test và maintain.
- Application module được tạo mới vì đây là feature đầu tiên trong application management flow.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**N/A** - Không có violations nào cần justify. Feature tuân thủ 100% constitution rules.

---

## Phase 0: Research (Next Step)

Tạo `research.md` với 5 research questions sau:

### RQ1: Organization Ownership Validation Strategy
**Question**: Làm thế nào để validate Staff chỉ được xem applications của events thuộc organization của mình?

**Options**:
- A. Join với events table, filter theo `events.organization_id = staff.organization_id`
- B. Pre-check event ownership trước khi query applications
- C. Rely on event service để validate ownership

**Research Focus**: Performance trade-offs, security implications, code reusability.

---

### RQ2: Pagination Implementation Pattern
**Question**: Implement pagination như thế nào cho datasets lớn (100-500 applications)?

**Options**:
- A. Offset-based pagination (`LIMIT ? OFFSET ?`)
- B. Cursor-based pagination (dùng `application_id` hoặc `created_at` làm cursor)
- C. Hybrid approach (offset cho small datasets, cursor cho large)

**Research Focus**: Performance với large datasets, complexity, frontend integration ease.

---

### RQ3: Sensitive Data Filtering Strategy
**Question**: Đảm bảo không leak sensitive data (address, ID card) như thế nào?

**Options**:
- A. Prisma `select` chỉ lấy safe fields
- B. Service layer filters out sensitive fields sau khi query
- C. Database view với pre-filtered columns

**Research Focus**: Security guarantees, maintainability, performance impact.

---

### RQ4: Status Filter Query Optimization
**Question**: Optimize query cho filter theo status (Submitted/Approved/Rejected)?

**Options**:
- A. Single query với `WHERE status = ?` (nếu có index)
- B. Separate queries per status, cache results
- C. Prisma enum filtering với index hint

**Research Focus**: Index strategy, query plan analysis, cache feasibility.

---

### RQ5: Frontend State Management
**Question**: Manage filter state (status, pagination) như thế nào ở frontend?

**Options**:
- A. URL query params (`?status=Submitted&page=2`)
- B. React useState với local component state
- C. Context API cho shared filter state

**Research Focus**: UX (bookmarkable URLs, browser back/forward), code complexity.

---

## Phase 1: Design Artifacts (After Research)

Sau khi complete research.md, tạo các artifacts sau:

### 1. `data-model.md`
Schema cho Application entity, relationships, validation rules:
- Application table structure (id, event_id, user_id, status, created_at, ...)
- JOIN với users table (lấy volunteer name)
- JOIN với events table (validate organization ownership)
- Indexes cần thiết (event_id + status composite index)
- Enum validation cho status field

### 2. `contracts/GET-events-eventId-applications.md`
Complete API contract:
- **Endpoint**: `GET /api/v1/events/:eventId/applications`
- **Auth**: JWT required (Staff role)
- **Query Params**: 
  - `status` (optional): `Submitted|Approved|Rejected`
  - `page` (optional, default 1): Page number
  - `limit` (optional, default 20): Records per page
- **Response 200**: 
  ```json
  {
    "success": true,
    "data": {
      "applications": [
        {
          "id": "uuid",
          "volunteer": {
            "id": "uuid",
            "name": "string",
            "avatar_url": "string"
          },
          "status": "Submitted|Approved|Rejected",
          "submitted_at": "ISO8601",
          "notes": "string"
        }
      ],
      "pagination": {
        "current_page": 1,
        "total_pages": 5,
        "total_records": 87,
        "limit": 20
      }
    }
  }
  ```
- **Response 403**: Organization ownership violation
- **Response 404**: Event not found
- **Error Examples**: Status validation errors, pagination out of range

### 3. `quickstart.md`
Setup guide:
- **Prerequisites**: Node.js 18+, MySQL running, Prisma schema synced
- **Setup Steps**:
  1. Verify Prisma schema có index cho `applications(event_id, status)`
  2. Run migration nếu cần: `npx prisma migrate dev`
  3. Install dependencies (nếu có packages mới)
  4. Update `share_context.md` với API contract mới
- **Test Locally**:
  - Seed test data: applications cho multiple events
  - Test authentication: call endpoint without JWT → 401
  - Test pagination: verify 20 records/page default
  - Test filtering: `?status=Submitted` returns correct subset
- **Troubleshooting**:
  - Slow queries → Check `EXPLAIN` plan, verify indexes exist
  - Sensitive data leaked → Review Prisma select clause
  - 403 errors → Debug organization_id mismatch logic

---

## Phase 2: Task Generation (Separate Command)

**NOT part of /speckit-plan**. Run `/speckit-tasks` để tạo `tasks.md` với atomic tasks:
- T001: Create Prisma schema cho Application entity
- T002: Implement application.repository.js với JOIN queries
- T003: Implement application.service.js với ownership validation
- T004: Implement application.controller.js với query param parsing
- T005: Create Zod validator cho query params
- T006: Create pagination.util.js helper
- T007: Setup application.routes.js và integrate vào Express app
- T008: Write integration tests cho list endpoint
- T009: Implement frontend applicationApi.js
- T010: Create ApplicationListPage.jsx component
- T011: Update share_context.md với API contract
- T012: Write Swagger JSDoc documentation

Each task sẽ có:
- **Dependencies**: Sequential hoặc parallel
- **Estimated Time**: 1-4 hours
- **Done Criteria**: Tests pass, documentation updated, code reviewed

---

**End of Plan** — Ready for human review và approval trước khi execute Phase 0 research.

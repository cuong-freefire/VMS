# Implementation Plan: View Application Detail (UC23)

**Branch**: `023-feat-view-application-detail` | **Date**: 2026-06-29 | **Spec**: `.sdd/TienTD/UC23-feat-view-application-detail/SPEC.md`

**Input**: Feature specification from `.sdd/TienTD/UC23-feat-view-application-detail/SPEC.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Staff cần xem thông tin chi tiết của một đơn đăng ký cụ thể (sau khi click vào application từ danh sách UC22) để đánh giá năng lực, kinh nghiệm và động lực của Volunteer trước khi đưa ra quyết định phê duyệt/từ chối. Hệ thống sẽ cung cấp API endpoint GET `/api/v1/applications/:applicationId` trả về đầy đủ thông tin bao gồm:
1. Volunteer profile (tên, ảnh, email, SĐT, kỹ năng)
2. Application details (motivation letter, custom answers, submission date, status)
3. Volunteer statistics (số sự kiện đã tham gia, completion rate)
4. Organization ownership validation (Staff chỉ xem applications của events thuộc tổ chức mình)
5. Audit trail (log mọi detail view action)

Technical approach tập trung vào:
- Single record fetch với deep JOIN (application → user → event → organization)
- Privacy protection (expose full data vì đây là detail view, khác với list view UC22)
- Optional state transition (Submitted → Reviewed khi Staff xem lần đầu - theo FR-004)
- Integration với Profile module (UC18) để lấy volunteer statistics

## Technical Context

**Language/Version**: Node.js 18+ với ESM module system

**Primary Dependencies**: Express 5.x, Prisma ORM, Zod validation, Pino logger

**Storage**: MySQL database với Prisma schema (tables: `applications`, `users`, `events`, `organizations`, `user_skills`)

**Testing**: Jest + Supertest cho integration tests, target 80% coverage cho Service layer

**Target Platform**: Linux server (backend API), React 19 web client (frontend)

**Project Type**: Web service - REST API + React SPA

**Performance Goals**: 
- Load full detail page in <1.5s (SC-001)
- p95 response time <300ms cho single record fetch
- Efficient nested JOIN queries (application → user → skills → event)

**Constraints**: 
- Organization-based access control (FR-001) - Staff chỉ xem applications của events thuộc organization
- Audit logging bắt buộc (CONTEXT.md Constraint) - log who viewed which application when
- Optional state transition (FR-004) - Submitted → Reviewed khi Staff view lần đầu
- Privacy-aware logging (FR-016) - MUST NOT log sensitive data to browser console

**Scale/Scope**: 
- Single record fetch (no pagination)
- Support 1000+ concurrent Staff users
- Response time <1.5s với full nested data (profile + skills + stats)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Layer 1 (Hard Rules) — ✅ PASS
- ✅ **Authentication**: JWT token required, userId extracted from token (ADR-002, Lesson 3)
- ✅ **Input validation**: Zod schemas cho applicationId path param (ADR-003)
- ✅ **Privacy**: Console logging MUST NOT contain sensitive data (phone, email) - FR-016
- ✅ **Database access**: Prisma ORM cho all queries (ADR-001)
- ✅ **Response format**: Tuân thủ `response.util.js` format (ADR-006)

### Layer 2 (Architecture Constraints) — ✅ PASS
- ✅ **Layered Architecture**: Controller → Service → Repository pattern
- ✅ **Module Ownership**: TienTD owns Application module
- ✅ **Cross-module Integration**: 
  - Cần integrate với Profile module (UC18) để lấy volunteer statistics (assumed ready - A-006)
  - Cần validate organization ownership via events table
- ✅ **Audit Log**: Log detail view với `{ who, when, what: 'VIEW_APPLICATION_DETAIL', application_id, volunteer_id }`

### Layer 3 (Engineering Standards) — ✅ PASS
- ✅ **Test coverage**: Target 80% cho ApplicationService.getApplicationDetail()
- ✅ **Performance**: Single query với Prisma nested include, proper indexing
- ✅ **API documentation**: Swagger JSDoc bắt buộc cho GET endpoint

### Violations: NONE

Tất cả Constitution checks đều PASS. Feature này tuân thủ 100% architecture constraints và security rules.

## Project Structure

### Documentation (this feature)

```text
.sdd/TienTD/UC23-feat-view-application-detail/
├── SPEC.md              # Feature specification (ALREADY EXISTS)
├── CONTEXT.md           # Domain context (ALREADY EXISTS)
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── GET-applications-applicationId.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/
│   │   └── application.controller.js     # [UPDATE] Add getApplicationDetail handler
│   ├── services/
│   │   └── application.service.js        # [UPDATE] Add getApplicationDetail method
│   ├── repositories/
│   │   └── application.repository.js     # [UPDATE] Add findDetailById with deep JOINs
│   ├── routes/
│   │   └── application.routes.js         # [UPDATE] Add GET /:applicationId route
│   ├── validators/
│   │   └── application.validator.js      # [UPDATE] Add applicationIdSchema
│   ├── middleware/
│   │   ├── auth.middleware.js            # [REUSE] JWT authentication
│   │   └── error.middleware.js           # [REUSE] Error handling
│   └── utils/
│       ├── response.util.js              # [REUSE] Standardized response format
│       └── audit.util.js                 # [REUSE OR CREATE] Audit logging helper
├── prisma/
│   └── schema.prisma                     # [VERIFY] Relationships: applications → users → user_skills
└── tests/
    └── integration/
        └── application-detail.test.js    # [NEW] Integration tests cho detail endpoint

frontend/
├── src/
│   ├── api/
│   │   └── applicationApi.js             # [UPDATE] Add getApplicationDetail method
│   ├── components/
│   │   └── pages/
│   │       └── ApplicationDetailPage.jsx # [NEW] Staff UI với volunteer profile + stats
│   ├── services/
│   │   └── application.service.js        # [UPDATE] Add frontend service method
│   └── utils/
│       └── formatDate.js                 # [REUSE] Format dates
└── tests/
    └── components/
        └── ApplicationDetailPage.test.jsx # [NEW] Component tests
```

**Structure Decision**: 
- Web application structure (backend + frontend) được chọn vì phù hợp với kiến trúc hiện tại của VMS project.
- UC23 extends Application module đã tạo ở UC22, nên **UPDATE** existing files thay vì tạo mới hoàn toàn.
- Backend tuân thủ layered architecture (Controller → Service → Repository) theo ADR-001.
- Frontend tạo ApplicationDetailPage.jsx mới, reuse applicationApi.js từ UC22.
- Integration với Profile module để lấy volunteer statistics (giả định UC18 đã sẵn sàng - A-006).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**N/A** - Không có violations nào cần justify. Feature tuân thủ 100% constitution rules.

---

## Phase 0: Research (Next Step)

Tạo `research.md` với 6 research questions sau:

### RQ1: Organization Ownership Validation Strategy
**Question**: Validate Staff chỉ xem applications của events thuộc organization như thế nào?

**Options**:
- A. Deep JOIN trong single query: `application → event → organization_id === staff.organization_id`
- B. Pre-check event ownership ở Service layer trước khi fetch detail
- C. Reuse ownership validation logic từ UC22 (nếu có shared helper)

**Research Focus**: Performance (1 query vs 2 queries), code reusability, security guarantees.

---

### RQ2: Sensitive Data Exposure Policy
**Question**: Detail view có nên expose full sensitive data (phone, email, address) không?

**Context**: 
- UC22 list view KHÔNG expose sensitive data (FR-016)
- UC23 detail view cần email + phone để Staff liên hệ Volunteer
- Cần clarify: Address và Identity Card có cần thiết không?

**Options**:
- A. Expose ALL data (phone, email, address, ID card) vì đây là detail view
- B. Expose email + phone only, hide address + ID card
- C. Role-based exposure (Manager thấy hết, Staff thấy giới hạn)

**Research Focus**: Business rules từ stakeholders, privacy compliance, audit requirements.

---

### RQ3: State Transition Implementation (Submitted → Reviewed)
**Question**: Tự động chuyển status từ Submitted → Reviewed khi Staff xem lần đầu?

**Context**: FR-004 nói "nếu quy trình nghiệp vụ yêu cầu" - cần clarify.

**Options**:
- A. Automatic transition: UPDATE status trong repository khi fetch
- B. Explicit transition: Staff phải click nút "Mark as Reviewed" riêng
- C. No transition: Status chỉ thay đổi khi Approve/Reject (UC24/25)

**Research Focus**: Business workflow, audit trail (who changed status), race conditions (2 Staff view cùng lúc).

---

### RQ4: Volunteer Statistics Integration
**Question**: Lấy volunteer stats (events joined, completion rate) như thế nào?

**Context**: US2 - P2 priority, cần hiển thị "Events Joined" và "Completion Rate".

**Options**:
- A. Direct query trong Repository: COUNT applications WHERE user_id AND status='Completed'
- B. Call Profile Service (UC18) API nếu đã có endpoint sẵn
- C. Denormalized field trong users table (updated by cron job)

**Research Focus**: Performance impact, data freshness requirements, cross-module dependency.

---

### RQ5: Custom Questions/Answers Display
**Question**: Hiển thị câu trả lời cho custom questions (nếu có) như thế nào?

**Context**: 
- SPEC.md mention "câu trả lời của tình nguyện viên"
- CONTEXT.md mention "câu hỏi tùy chỉnh trong form đăng ký sự kiện"
- Database schema CHƯA RÕ có table `application_custom_answers` không

**Options**:
- A. Có table riêng: JOIN với `application_custom_answers` và `event_custom_questions`
- B. JSON field trong applications table: Parse và display
- C. Out of scope MVP: Chỉ show motivation letter, custom questions để phase 2

**Research Focus**: Database schema actual state, frontend complexity, business priority.

---

### RQ6: Frontend State Management & Navigation
**Question**: Navigation từ UC22 list → UC23 detail như thế nào?

**Options**:
- A. React Router: `/applications/:applicationId` route, Link component từ UC22
- B. Modal overlay: Click row → open modal với detail, no route change
- C. Tab system: Detail view là tab riêng trong ApplicationListPage

**Research Focus**: UX flow, browser history, deep linking (Staff share URL với Manager).

---

## Phase 1: Design Artifacts (After Research)

Sau khi complete research.md, tạo các artifacts sau:

### 1. `data-model.md`
Schema cho Application detail entity, relationships, validation rules:
- Application table structure (id, event_id, user_id, status, motivation_letter, created_at, ...)
- Deep JOIN với users table (lấy full volunteer profile: name, email, phone, avatar_url)
- JOIN với user_skills table (lấy skill list)
- JOIN với events table (validate organization ownership)
- Optional: JOIN với application_custom_answers table (nếu có)
- Volunteer statistics calculation logic (COUNT query hoặc denormalized field)
- State transition rules (Submitted → Reviewed trigger)
- Indexes cần thiết (application.id primary key, application.user_id foreign key)

### 2. `contracts/GET-applications-applicationId.md`
Complete API contract:
- **Endpoint**: `GET /api/v1/applications/:applicationId`
- **Auth**: JWT required (Staff role)
- **Path Params**: 
  - `applicationId` (UUID, required): Application ID to fetch
- **Response 200**: 
  ```json
  {
    "success": true,
    "data": {
      "application": {
        "id": "uuid",
        "status": "Submitted|Reviewed|Approved|Rejected",
        "motivation_letter": "string",
        "submitted_at": "ISO8601",
        "reviewed_at": "ISO8601 or null",
        "notes": "string or null",
        "volunteer": {
          "id": "uuid",
          "name": "string",
          "email": "string",
          "phone_number": "string",
          "avatar_url": "string",
          "skills": [
            {
              "id": "uuid",
              "name": "First Aid",
              "level": "Intermediate"
            }
          ],
          "statistics": {
            "events_joined": 12,
            "events_completed": 10,
            "completion_rate": 83.3,
            "total_volunteer_hours": 120
          }
        },
        "event": {
          "id": "uuid",
          "name": "string",
          "start_date": "ISO8601",
          "end_date": "ISO8601"
        }
      }
    }
  }
  ```
- **Response 403**: Organization ownership violation (Staff not in same org as event)
- **Response 404**: Application not found
- **Error Examples**: 
  - Invalid UUID format → 400 Bad Request
  - Unauthorized access → 401 Unauthorized

### 3. `quickstart.md`
Setup guide:
- **Prerequisites**: Node.js 18+, MySQL running, Prisma schema synced, UC22 completed
- **Setup Steps**:
  1. Verify Prisma schema relationships: applications → users → user_skills
  2. Verify events table có organization_id foreign key
  3. Run migration nếu cần thêm `reviewed_at` field hoặc custom answers tables
  4. Update `share_context.md` với API contract mới
- **Test Locally**:
  - Seed test data: 1 application với full volunteer profile + skills
  - Test authentication: call endpoint without JWT → 401
  - Test ownership validation: Staff A xem application của event thuộc org B → 403
  - Test detail fetch: verify full nested data returned (profile + skills + stats)
  - Test state transition (nếu có): Submitted application → GET detail → verify status = Reviewed
- **Troubleshooting**:
  - Slow queries → Check `EXPLAIN` plan, verify proper indexes on foreign keys
  - Missing volunteer data → Debug JOIN conditions, check user_id foreign key integrity
  - 403 errors → Debug organization_id mismatch logic, check Staff token claims
  - Statistics calculation errors → Verify COUNT query logic, check data integrity

---

## Phase 2: Task Generation (Separate Command)

**NOT part of /speckit-plan**. Run `/speckit-tasks` để tạo `tasks.md` với atomic tasks:

**Phase 1: Database & Schema (if needed)**
- T001: Update Prisma schema cho reviewed_at field (nếu implement state transition)
- T002: Create migration cho schema changes
- T003: Verify indexes trên applications(id), user_skills(user_id)

**Phase 2: Backend - Repository Layer**
- T004: Update application.repository.js - Add findDetailById method với nested include
- T005: Implement deep JOIN logic: application → user → user_skills → event → organization
- T006: Add volunteer statistics calculation (COUNT query hoặc call profile service)

**Phase 3: Backend - Service Layer**
- T007: Update application.service.js - Add getApplicationDetail method
- T008: Implement organization ownership validation logic
- T009: Implement optional state transition (Submitted → Reviewed) nếu enabled
- T010: Add audit logging cho detail view action

**Phase 4: Backend - Controller & Routes**
- T011: Update application.controller.js - Add getApplicationDetail handler
- T012: Add error handling cho 404 (not found) và 403 (forbidden) cases
- T013: Update application.routes.js - Add GET /:applicationId route
- T014: Update application.validator.js - Add applicationIdSchema (UUID validation)

**Phase 5: Backend - Testing**
- T015: Write integration tests cho GET /applications/:id endpoint
  - Test case 1: Valid request → 200 with full data
  - Test case 2: Invalid UUID → 400
  - Test case 3: Not found → 404
  - Test case 4: Cross-org access → 403
  - Test case 5: State transition (if enabled) → verify status change

**Phase 6: Frontend - API Client**
- T016: Update applicationApi.js - Add getApplicationDetail method

**Phase 7: Frontend - Components**
- T017: Create ApplicationDetailPage.jsx component
- T018: Implement volunteer profile section (name, avatar, email, phone, skills)
- T019: Implement volunteer statistics section (events joined, completion rate)
- T020: Implement application info section (motivation letter, status, dates)
- T021: Add loading state và error handling UI

**Phase 8: Frontend - Routing & Integration**
- T022: Add React Router route cho /applications/:applicationId
- T023: Update ApplicationListPage (UC22) - Add Link/onClick handler để navigate to detail
- T024: Implement browser back button support

**Phase 9: Documentation & Polish**
- T025: Update share_context.md với API contract mới
- T026: Write Swagger JSDoc documentation cho GET endpoint
- T027: Add frontend PropTypes validation
- T028: Performance testing với large volunteer profiles

Each task sẽ có:
- **Dependencies**: Sequential hoặc parallel
- **Estimated Time**: 1-4 hours
- **Done Criteria**: Tests pass (80% coverage), documentation updated, code reviewed

---

**End of Plan** — Ready for human review và approval trước khi execute Phase 0 research.

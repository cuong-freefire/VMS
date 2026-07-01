# Implementation Plan: Approve Application (UC24)

**Branch**: `024-feat-approve-application` | **Date**: 2026-06-29 | **Spec**: `.sdd/TienTD/UC24-feat-approve-application/SPEC.md`

**Input**: Feature specification from `.sdd/TienTD/UC24-feat-approve-application/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Staff phê duyệt đơn đăng ký volunteer bằng cách click nút "Approve" để chuyển trạng thái từ `Submitted`/`Reviewed` → `Approved`. Hệ thống sẽ:
1. Validate organization ownership (Staff chỉ approve đơn của events thuộc organization mình)
2. Check capacity constraints (không vượt quá max_capacity + buffer)
3. Update application status + timestamp + processed_by_staff_id
4. Trigger email notification service (UC64)
5. Log audit trail (who, what, when)
6. Support cả single approve (từ detail page UC23) và bulk approve (từ list page UC22)

Technical approach: PATCH endpoint `/api/v1/applications/:applicationId/approve` với transaction-safe status update, organization validation trong single query, async email trigger, và optimistic concurrency control để tránh double-approval.

## Technical Context

**Language/Version**: Node.js 18+ với ESM module system

**Primary Dependencies**: Express 5.x, Prisma ORM, Zod validation, Pino logger

**Storage**: MySQL database với Prisma schema (tables: `applications`, `events`, `organizations`)

**Testing**: Jest + Supertest cho integration tests, target 80% coverage cho Service layer

**Target Platform**: Linux server (backend API), React 19 web client (frontend)

**Project Type**: Web service - REST API + React SPA

**Performance Goals**: 
- Single approve completes <2s including email trigger (SC-001)
- Bulk approve handles 50 applications in <10s
- Support 100+ concurrent staff users

**Constraints**: 
- Transaction safety: Status update + email trigger must be atomic (rollback on email failure)
- Organization-based access control: Staff ONLY approves applications for events in their organization
- State transition constraint: ONLY Submitted/Reviewed → Approved (cannot approve Rejected)
- Capacity enforcement: approved_count ≤ event.max_capacity (with optional buffer)
- Audit logging required: who approved, which application, timestamp

**Scale/Scope**: 
- Single approve: 1 application per request
- Bulk approve: up to 50 applications per request
- Support 1000+ events, 10000+ applications per event

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Layer 1 (Hard Rules) — ✅ PASS
- ✅ **Authentication**: JWT token required, userId + organizationId extracted from token (ADR-002, Lesson 3)
- ✅ **Input validation**: Zod schemas cho applicationId path param, bulk approve body (ADR-003)
- ✅ **Privacy**: MUST NOT log sensitive volunteer data (FR-016) - only log IDs
- ✅ **Database access**: Prisma ORM cho all queries (ADR-001)
- ✅ **Response format**: Tuân thủ `response.util.js` format (ADR-006)

### Layer 2 (Architecture Constraints) — ✅ PASS
- ✅ **Layered Architecture**: Controller → Service → Repository pattern
- ✅ **Module Ownership**: TienTD owns Application module
- ✅ **Cross-module Integration**: 
  - Email service (UC64) called via async trigger (assumed ready - A-001)
  - Attendance module (UC45) reads approved applications (downstream dependency)
- ✅ **Audit Log**: Log approve action với `{ who, when, what: 'APPROVE_APPLICATION', application_id, event_id }`

### Layer 3 (Engineering Standards) — ⚠️ NEEDS CLARIFICATION
- ✅ **Test coverage**: Target 80% cho ApplicationService.approveApplication()
- ⚠️ **Transaction management**: NEEDS RESEARCH - Email trigger inside or outside transaction?
- ⚠️ **Capacity enforcement**: NEEDS RESEARCH - Hard limit or soft warning?
- ✅ **API documentation**: Swagger JSDoc bắt buộc cho PATCH endpoint

### Violations: 1 Gate Warning (Transaction Strategy)

**Warning**: Email trigger placement unclear - inside transaction (strong consistency, slow) vs outside transaction (fast, eventual consistency risk if email fails).

**Justification**: Will research in Phase 0 - email delivery patterns for approval workflows.

## Project Structure

### Documentation (this feature)

```text
.sdd/TienTD/UC24-feat-approve-application/
├── SPEC.md              # Feature specification (ALREADY EXISTS)
├── CONTEXT.md           # Domain context (ALREADY EXISTS)
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── PATCH-applications-applicationId-approve.md
│   └── POST-applications-bulk-approve.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/
│   │   └── application.controller.js     # [UPDATE] Add approveApplication, bulkApproveApplications handlers
│   ├── services/
│   │   └── application.service.js        # [UPDATE] Add approveApplication, bulkApprove methods
│   ├── repositories/
│   │   └── application.repository.js     # [UPDATE] Add updateStatus, findByIds methods
│   ├── routes/
│   │   └── application.routes.js         # [UPDATE] Add PATCH /:id/approve, POST /bulk-approve routes
│   ├── validators/
│   │   └── application.validator.js      # [UPDATE] Add bulkApproveSchema
│   ├── middleware/
│   │   ├── auth.middleware.js            # [REUSE] JWT authentication
│   │   └── error.middleware.js           # [REUSE] Error handling
│   ├── utils/
│   │   ├── response.util.js              # [REUSE] Standardized response format
│   │   ├── audit.util.js                 # [REUSE OR UPDATE] Audit logging helper
│   │   └── email.util.js                 # [CREATE OR REUSE] Email trigger helper (call UC64)
│   └── config/
│       └── email.config.js               # [CREATE] Email service configuration
├── prisma/
│   └── schema.prisma                     # [VERIFY] Application model has processed_by_staff_id field
└── tests/
    └── integration/
        └── application-approve.test.js   # [NEW] Integration tests cho approve endpoints

frontend/
├── src/
│   ├── api/
│   │   └── applicationApi.js             # [UPDATE] Add approveApplication, bulkApproveApplications methods
│   ├── components/
│   │   ├── pages/
│   │   │   ├── ApplicationDetailPage.jsx # [UPDATE] Add "Approve" button (US1)
│   │   │   └── ApplicationListPage.jsx   # [UPDATE] Add bulk approve UI (US2)
│   │   └── ui/
│   │       ├── ApproveButton.jsx         # [NEW] Single approve button component
│   │       └── BulkApproveButton.jsx     # [NEW] Bulk approve button component
│   ├── hooks/
│   │   └── useApproveApplication.js      # [NEW] Custom hook for approve logic
│   └── utils/
│       └── toast.util.js                 # [REUSE OR CREATE] Success/error notifications
└── tests/
    └── components/
        ├── ApproveButton.test.jsx        # [NEW] Component tests
        └── BulkApproveButton.test.jsx    # [NEW] Component tests
```

**Structure Decision**: 
- Web application structure (backend + frontend) được chọn vì phù hợp với kiến trúc hiện tại của VMS project.
- UC24 extends Application module đã tạo ở UC22/23, nên **UPDATE** existing files thay vì tạo mới hoàn toàn.
- Backend tuân thủ layered architecture (Controller → Service → Repository) theo ADR-001.
- Frontend adds approve buttons to existing pages (UC23 detail page, UC22 list page).
- Email service integration via utility helper (abstraction cho UC64 call).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Warning W1: Transaction Strategy - Email Trigger Placement**

**Complexity**: Email trigger bên trong hay ngoài transaction? 2 options có tradeoffs khác nhau.

**Options Evaluated**:
1. **Inside Transaction** (strong consistency):
   - Pro: Atomic - email chỉ gửi nếu DB commit thành công
   - Con: Slow - transaction hold locks trong khi chờ email service respond
   - Con: Email service downtime blocks approval workflow
   
2. **Outside Transaction** (eventual consistency):
   - Pro: Fast - DB commit ngay, email async sau
   - Pro: Resilient - email failure không block approval
   - Con: Risk - nếu email fails, volunteer không nhận được notification (orphaned approved status)

**Justification**: 
- Will research in Phase 0: Industry best practices for transactional outbox pattern
- Likely choice: Outside transaction + retry queue (eventual consistency acceptable cho email notifications)
- Fallback: Email service must have idempotency key (application_id) để avoid duplicate sends

---

## Phase 0: Research (Next Step)

Tạo `research.md` với 6 research questions sau:

### RQ1: Transaction Strategy - Email Trigger Placement
**Question**: Email trigger nên ở trong hay ngoài database transaction?

**Options**:
- A. Inside transaction: UPDATE status + CALL email trong cùng 1 transaction
- B. Outside transaction: COMMIT status first, THEN trigger email async
- C. Transactional outbox pattern: INSERT email job vào outbox table trong transaction, worker process sends later

**Research Focus**: Performance impact, consistency guarantees, failure recovery, industry patterns (Saga, Outbox).

---

### RQ2: Capacity Enforcement Strategy
**Question**: Khi approved_count đạt max_capacity, hệ thống handle như thế nào?

**Context**: 
- FR-003: "hiển thị cảnh báo nhưng vẫn cho phép Staff phê duyệt nếu họ muốn thêm danh sách dự phòng"
- Cần clarify: Hard block vs Soft warning?

**Options**:
- A. Hard block: REJECT approval nếu capacity reached (return 409 Conflict)
- B. Soft warning: ALLOW approval but show warning message (frontend displays "Over capacity by X")
- C. Overflow bucket: Allow approval up to max_capacity + buffer% (e.g., 120% of max)

**Research Focus**: Business rules từ stakeholders, event planning best practices, buffer sizing.

---

### RQ3: Bulk Approve Transaction Isolation
**Question**: Bulk approve 50 applications - 1 transaction hay 50 transactions?

**Options**:
- A. Single transaction: All-or-nothing (1 fails → rollback all)
- B. Multiple transactions: Independent commits (some succeed, some fail)
- C. Batched transactions: Chunks of 10 (partial success possible)

**Research Focus**: Database lock contention, user experience (partial failure handling), audit trail complexity.

---

### RQ4: Optimistic Concurrency Control
**Question**: Tránh race condition khi 2 Staff approve cùng 1 application?

**Context**: FR-018 mentions "disable nút ngay lập tức" - nhưng backend vẫn cần mechanism.

**Options**:
- A. Optimistic locking: Use `updated_at` version field (WHERE status='Submitted' AND updated_at = :expectedVersion)
- B. Pessimistic locking: SELECT FOR UPDATE trước khi approve
- C. Status-based idempotency: Check status first, if already Approved → return 409 Conflict

**Research Focus**: Prisma ORM support, performance impact, failure UX.

---

### RQ5: Email Service Integration Pattern
**Question**: Trigger UC64 email service như thế nào?

**Options**:
- A. Direct HTTP call: Sync POST request to email service endpoint
- B. Message queue: Publish event to queue (RabbitMQ, Redis), email service subscribes
- C. Database trigger: INSERT into email_queue table, cron job processes

**Research Focus**: Email service (UC64) actual implementation, retry mechanism, delivery guarantees.

---

### RQ6: Frontend State Management - Bulk Approve
**Question**: Bulk approve UI - checkboxes ở đâu, state management như thế nào?

**Options**:
- A. Local state: useState([selectedIds]) trong ApplicationListPage component
- B. Context API: Global selection state shared across components
- C. URL query params: ?selected=id1,id2,id3 (shareable, bookmarkable)

**Research Focus**: UX complexity, performance với large lists (1000+ applications), browser back button behavior.

---

## Phase 1: Design Artifacts (After Research)

Sau khi complete research.md, tạo các artifacts sau:

### 1. `data-model.md`
Schema cho Application entity updates, state transition rules:
- Application table: status enum (SUBMITTED, REVIEWED, APPROVED, REJECTED)
- New field: `processed_by_staff_id` (foreign key to users table)
- State transition matrix: Which states can transition to APPROVED?
- Timestamp fields: `approved_at` (when status → Approved), `updated_at` (last modified)
- Capacity tracking: How to calculate current approved_count for event?
- Audit log schema: `{ action, staff_id, application_id, event_id, old_status, new_status, timestamp }`
- Email trigger schema: If using outbox pattern, define email_queue table structure

### 2. `contracts/PATCH-applications-applicationId-approve.md`
Complete API contract for single approve:
- **Endpoint**: `PATCH /api/v1/applications/:applicationId/approve`
- **Auth**: JWT required (Staff role)
- **Path Params**: 
  - `applicationId` (UUID, required): Application ID to approve
- **Request Body**: EMPTY (action is idempotent)
- **Response 200**: 
  ```json
  {
    "success": true,
    "message": "Application approved successfully",
    "data": {
      "application": {
        "id": "uuid",
        "status": "APPROVED",
        "approved_at": "ISO8601",
        "processed_by_staff_id": "uuid"
      }
    }
  }
  ```
- **Response 400**: Invalid state transition (e.g., already Approved, or Rejected)
- **Response 403**: Organization ownership violation (Staff not in same org as event)
- **Response 404**: Application not found
- **Response 409**: Capacity limit reached (if hard block chosen in RQ2)
- **Error Examples**: 
  - Application already approved → 400 Bad Request "Application is already in Approved status"
  - Event at capacity → 409 Conflict "Event capacity limit reached (50/50)"

### 3. `contracts/POST-applications-bulk-approve.md`
Complete API contract for bulk approve:
- **Endpoint**: `POST /api/v1/applications/bulk-approve`
- **Auth**: JWT required (Staff role)
- **Request Body**: 
  ```json
  {
    "application_ids": ["uuid1", "uuid2", "uuid3"]
  }
  ```
- **Response 200**: 
  ```json
  {
    "success": true,
    "message": "Bulk approve completed",
    "data": {
      "successful": ["uuid1", "uuid2"],
      "failed": [
        {
          "application_id": "uuid3",
          "reason": "Application already approved"
        }
      ],
      "summary": {
        "total": 3,
        "succeeded": 2,
        "failed": 1
      }
    }
  }
  ```
- **Response 400**: Invalid request body (empty array, invalid UUIDs)
- **Response 403**: Organization ownership violation (at least 1 application not in staff's org)

### 4. `quickstart.md`
Setup guide:
- **Prerequisites**: Node.js 18+, MySQL running, Prisma schema synced, UC22/UC23 completed, Email service (UC64) running
- **Setup Steps**:
  1. Verify Prisma schema có `processed_by_staff_id` field trong Application model
  2. Run migration nếu cần thêm `approved_at` timestamp field
  3. Configure email service endpoint trong `.env`: `EMAIL_SERVICE_URL=http://localhost:5001`
  4. Update `share_context.md` với API contracts mới
- **Test Locally**:
  - Seed test data: 1 event với 5 applications ở status SUBMITTED
  - Test single approve: PATCH /applications/:id/approve với Staff token → verify status = APPROVED
  - Test organization validation: Staff A approve application của event thuộc org B → 403
  - Test capacity limit: Event max_capacity=2, approve 3rd application → handle per RQ2 decision
  - Test bulk approve: POST /bulk-approve với 5 application IDs → verify partial success handling
  - Test email trigger: Check email service logs cho UC64 calls
- **Troubleshooting**:
  - Email service timeout → Check EMAIL_SERVICE_URL config, verify UC64 is running
  - 409 Conflict errors → Check capacity calculation logic, verify max_capacity field
  - Audit logs missing → Verify audit.util.js integrated correctly
  - Double approval (same application approved twice) → Verify optimistic locking implementation

---

## Phase 2: Task Generation (Separate Command)

**NOT part of /speckit-plan**. Run `/speckit-tasks` để tạo `tasks.md` với atomic tasks:

**Phase 1: Database & Schema (if needed)**
- T001: Update Prisma schema cho `processed_by_staff_id`, `approved_at` fields
- T002: Create migration cho schema changes
- T003: Verify indexes trên applications(status), applications(event_id)

**Phase 2: Backend - Repository Layer**
- T004: Update application.repository.js - Add updateStatus method với optimistic locking
- T005: Add findByIds method for bulk approve (single query với IN clause)
- T006: Add calculateApprovedCount method for capacity check

**Phase 3: Backend - Service Layer**
- T007: Update application.service.js - Add approveApplication method
- T008: Implement organization ownership validation logic
- T009: Implement capacity enforcement logic (per RQ2 decision)
- T010: Implement email trigger integration (per RQ5 decision)
- T011: Add bulkApproveApplications method với transaction handling (per RQ3 decision)
- T012: Add audit logging cho approve actions

**Phase 4: Backend - Controller & Routes**
- T013: Update application.controller.js - Add approveApplication handler
- T014: Add bulkApproveApplications handler
- T015: Add error handling cho 400/403/404/409 cases
- T016: Update application.routes.js - Add PATCH /:id/approve route
- T017: Add POST /bulk-approve route
- T018: Update application.validator.js - Add bulkApproveSchema

**Phase 5: Backend - Email Integration**
- T019: Create (or update) email.util.js - Add triggerApprovalEmail method
- T020: Configure email service URL trong .env và config file
- T021: Implement retry logic for email failures (if outside transaction)

**Phase 6: Backend - Testing**
- T022: Write integration tests cho PATCH /applications/:id/approve endpoint
  - Test case 1: Valid approve → 200 with status APPROVED
  - Test case 2: Already approved → 400 Bad Request
  - Test case 3: Cross-org access → 403 Forbidden
  - Test case 4: Capacity limit (if hard block) → 409 Conflict
  - Test case 5: Email trigger called with correct params
- T023: Write integration tests cho POST /bulk-approve endpoint
  - Test case 1: All succeed → 200 with full success
  - Test case 2: Partial failure → 200 with failed list
  - Test case 3: Transaction rollback (per RQ3 decision)

**Phase 7: Frontend - API Client**
- T024: Update applicationApi.js - Add approveApplication method
- T025: Add bulkApproveApplications method

**Phase 8: Frontend - Components (US1 - Single Approve)**
- T026: Create ApproveButton component với loading state, disabled after click
- T027: Add error handling UI (toast notifications)
- T028: Update ApplicationDetailPage (UC23) - Integrate ApproveButton
- T029: Add conditional rendering (hide button if status already Approved)

**Phase 9: Frontend - Components (US2 - Bulk Approve)**
- T030: Update ApplicationListPage (UC22) - Add checkboxes to table rows
- T031: Add selection state management (per RQ6 decision)
- T032: Create BulkApproveButton component với confirmation dialog
- T033: Display partial success results (succeeded vs failed)

**Phase 10: Documentation & Polish**
- T034: Update share_context.md với API contracts
- T035: Write Swagger JSDoc documentation cho approve endpoints
- T036: Add frontend PropTypes validation
- T037: Performance testing với 50 applications bulk approve

Each task sẽ có:
- **Dependencies**: Sequential hoặc parallel
- **Estimated Time**: 1-4 hours
- **Done Criteria**: Tests pass (80% coverage), documentation updated, code reviewed

---

**End of Plan** — Ready for human review và approval trước khi execute Phase 0 research.

# Implementation Plan: Reject Application (UC25)

**Branch**: `025-feat-reject-application` | **Date**: 2026-06-29 | **Spec**: `.sdd/TienTD/UC25-feat-reject-application/SPEC.md`

**Input**: Feature specification from `.sdd/TienTD/UC25-feat-reject-application/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Staff từ chối đơn đăng ký volunteer bằng cách click nút "Reject", nhập lý do từ chối (optional), để chuyển trạng thái từ `Submitted`/`Reviewed` → `Rejected`. Hệ thống sẽ:
1. Validate organization ownership (Staff chỉ reject đơn của events thuộc organization mình)
2. Check state transition rules (không reject đơn đã APPROVED hoặc đã REJECTED)
3. Update application status + timestamp + rejection_reason + processed_by_staff_id
4. Trigger email notification service (UC64)
5. Log audit trail (who, what, when, reason)
6. Support cả single reject (từ detail page UC23) và bulk reject (từ list page UC22)

Technical approach: PATCH endpoint `/api/v1/applications/:applicationId/reject` với transaction-safe status update, organization validation, optional rejection reason input, và idempotency handling tương tự UC24.

## Technical Context

**Language/Version**: Node.js 18+ với ESM module system

**Primary Dependencies**: Express 5.x, Prisma ORM, Zod validation, Pino logger

**Storage**: MySQL database với Prisma schema (tables: `applications`, `events`, `organizations`, `email_queue`)

**Testing**: Jest + Supertest cho integration tests, target 80% coverage cho Service layer

**Target Platform**: Linux server (backend API), React 19 web client (frontend)

**Project Type**: Web service - REST API + React SPA

**Performance Goals**: 
- Single reject completes <1s (SC-001)
- Bulk reject handles 50 applications in <10s
- Support 100+ concurrent staff users

**Constraints**: 
- Transaction safety: Status update + email trigger must be atomic
- Organization-based access control: Staff ONLY rejects applications for events in their organization
- State transition constraint: ONLY Submitted/Reviewed → Rejected (cannot reject Approved)
- Rejection reason optional but recommended for transparency
- Audit logging required: who rejected, which application, timestamp, reason

**Scale/Scope**: 
- Single reject: 1 application per request
- Bulk reject: up to 50 applications per request
- Support 1000+ events, 10000+ applications per event

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Layer 1 (Hard Rules) — ✅ PASS
- ✅ **Authentication**: JWT token required, userId + organizationId extracted from token (ADR-002)
- ✅ **Input validation**: Zod schemas cho applicationId path param, rejection_reason (optional string, max 500 chars)
- ✅ **Privacy**: MUST NOT log sensitive volunteer data (FR-016) - only log IDs
- ✅ **Database access**: Prisma ORM cho all queries (ADR-001)
- ✅ **Response format**: Tuân thủ `response.util.js` format (ADR-006)

### Layer 2 (Architecture Constraints) — ✅ PASS
- ✅ **Layered Architecture**: Controller → Service → Repository pattern
- ✅ **Module Ownership**: TienTD owns Application module
- ✅ **Cross-module Integration**: 
  - Email service (UC64) called via async trigger (reuse UC24 email worker)
  - Application list (UC22) displays rejected applications with visual distinction
- ✅ **Audit Log**: Log reject action với `{ who, when, what: 'REJECT_APPLICATION', application_id, event_id, reason }`

### Layer 3 (Engineering Standards) — ✅ PASS
- ✅ **Test coverage**: Target 80% cho ApplicationService.rejectApplication()
- ✅ **Transaction management**: Reuse UC24 Transactional Outbox Pattern
- ✅ **API documentation**: Swagger JSDoc bắt buộc cho PATCH endpoint
- ✅ **Code reuse**: Leverage UC24 infrastructure (email_queue, audit logging, status-based idempotency)

### Violations: 0

**Note**: UC25 heavily reuses UC24 architecture decisions, reducing implementation complexity.

## Project Structure

### Documentation (this feature)

```text
.sdd/TienTD/UC25-feat-reject-application/
├── SPEC.md              # Feature specification (ALREADY EXISTS)
├── CONTEXT.md           # Domain context (ALREADY EXISTS)
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── PATCH-applications-applicationId-reject.md
│   └── POST-applications-bulk-reject.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/
│   │   └── application.controller.js     # [UPDATE] Add rejectApplication, bulkRejectApplications handlers
│   ├── services/
│   │   └── application.service.js        # [UPDATE] Add rejectApplication, bulkReject methods
│   ├── repositories/
│   │   └── application.repository.js     # [REUSE] updateStatusWithCondition from UC24
│   ├── routes/
│   │   └── application.routes.js         # [UPDATE] Add PATCH /:id/reject, POST /bulk-reject routes
│   ├── validators/
│   │   └── application.validator.js      # [UPDATE] Add rejectSchema, bulkRejectSchema
│   ├── workers/
│   │   └── email.worker.js               # [REUSE] From UC24
│   ├── utils/
│   │   ├── audit.util.js                 # [REUSE] From UC24
│   │   └── response.util.js              # [REUSE]
│   └── config/
│       └── email.config.js               # [REUSE] From UC24
├── prisma/
│   └── schema.prisma                     # [UPDATE] Add rejected_at, rejection_reason fields to Application
└── tests/
    └── integration/
        └── application-reject.test.js   # [NEW] Integration tests

frontend/
├── src/
│   ├── api/
│   │   └── applicationApi.js             # [UPDATE] Add rejectApplication, bulkRejectApplications
│   ├── components/
│   │   ├── pages/
│   │   │   ├── ApplicationDetailPage.jsx # [UPDATE] Add "Reject" button (US1)
│   │   │   └── ApplicationListPage.jsx   # [UPDATE] Add bulk reject UI (US2)
│   │   └── ui/
│   │       ├── RejectButton.jsx         # [NEW] Single reject button with reason dialog
│   │       └── BulkRejectButton.jsx     # [NEW] Bulk reject button
│   └── hooks/
│       └── useRejectApplication.js      # [NEW] Custom hook for reject logic
```

**Structure Decision**: 
- UC25 extends Application module đã tạo ở UC22/23/24, nên **UPDATE** existing files
- Reuse maximum infrastructure from UC24 (email worker, audit logging, status-based idempotency)
- Frontend adds reject buttons alongside approve buttons created in UC24

## Complexity Tracking

> **No Constitution violations - this section is empty**

---

## Phase 0: Research (Next Step)

Tạo `research.md` với 4 research questions sau:

### RQ1: Rejection Reason Validation Strategy
**Question**: Lý do từ chối (rejection_reason) có bắt buộc không? Max length bao nhiêu?

**Context**: CONTEXT.md quyết định rejection_reason KHÔNG bắt buộc, nhưng cần clarify validation rules.

**Options**:
- A. Optional, max 500 chars (short reason)
- B. Optional, max 2000 chars (detailed explanation)
- C. Required, with dropdown templates + custom input

**Research Focus**: UX tradeoffs (required vs optional), database storage, frontend validation patterns.

---

### RQ2: Email Notification Content Strategy
**Question**: Email reject notification có khác với approve notification không?

**Context**: UC24 có APPROVAL_NOTIFICATION email type. UC25 cần REJECTION_NOTIFICATION type?

**Options**:
- A. Reuse UC24 email worker, just add new type: 'REJECTION_NOTIFICATION'
- B. Separate worker for rejection emails (different retry logic)
- C. No email notification for rejections (staff-only action)

**Research Focus**: Email content template, recipient expectations, retry policy.

---

### RQ3: Bulk Reject Transaction Strategy
**Question**: Bulk reject 50 applications - same transaction strategy as UC24 (multiple independent transactions)?

**Context**: UC24 uses Multiple Independent Transactions cho bulk approve. UC25 reject có cùng pattern?

**Options**:
- A. Reuse UC24 pattern: Each application processed independently (partial success OK)
- B. Single transaction: All-or-nothing (stricter consistency)
- C. No bulk reject (too dangerous - require individual review)

**Research Focus**: Risk assessment (rejecting wrong applications), rollback complexity, audit trail.

---

### RQ4: Frontend Reject Reason Input Pattern
**Question**: Nhập lý do từ chối như thế nào? Dropdown templates hay free text?

**Context**: CONTEXT.md quyết định cung cấp dropdown templates. Cần design UX pattern.

**Options**:
- A. Dropdown only: Select from predefined reasons (fast, standardized)
- B. Dropdown + Custom text: Select template then edit (flexible)
- C. Free text only: No templates (maximum flexibility, slower)

**Research Focus**: Common rejection reasons, staff workflows, data quality for analytics.

---

## Phase 1: Design Artifacts (After Research)

Sau khi complete research.md, tạo các artifacts sau:

### 1. `data-model.md`
Schema cho Application entity updates:
- Add field: `rejected_at` (DateTime?, when status → Rejected)
- Add field: `rejection_reason` (String?, max 500 chars, nullable)
- State transition matrix: Submitted/Reviewed → Rejected (valid), Approved/Rejected → Rejected (invalid)
- Email queue: Reuse UC24 email_queue table, add new type: 'REJECTION_NOTIFICATION'
- Audit log: `{ action: 'REJECT_APPLICATION', staff_id, application_id, event_id, rejection_reason, timestamp }`

### 2. `contracts/PATCH-applications-applicationId-reject.md`
Complete API contract for single reject:
- **Endpoint**: `PATCH /api/v1/applications/:applicationId/reject`
- **Auth**: JWT required (Staff role)
- **Path Params**: `applicationId` (UUID)
- **Request Body**: 
  ```json
  {
    "rejection_reason": "Hồ sơ chưa đủ kinh nghiệm" // optional, max 500 chars
  }
  ```
- **Response 200**: 
  ```json
  {
    "success": true,
    "message": "Application rejected successfully",
    "data": {
      "application": {
        "id": "uuid",
        "status": "REJECTED",
        "rejected_at": "ISO8601",
        "rejection_reason": "Hồ sơ chưa đủ kinh nghiệm",
        "processed_by_staff_id": "uuid"
      }
    }
  }
  ```
- **Response 400**: Invalid state transition (e.g., already Rejected, or Approved)
- **Response 403**: Organization ownership violation
- **Response 404**: Application not found

### 3. `contracts/POST-applications-bulk-reject.md`
Complete API contract for bulk reject:
- **Endpoint**: `POST /api/v1/applications/bulk-reject`
- **Auth**: JWT required (Staff role)
- **Request Body**: 
  ```json
  {
    "application_ids": ["uuid1", "uuid2"],
    "rejection_reason": "Bulk rejection reason" // optional, applied to all
  }
  ```
- **Response 200**: Partial success pattern (same as UC24 bulk approve)

### 4. `quickstart.md`
Setup guide:
- **Prerequisites**: UC24 completed (email worker already running)
- **Setup Steps**:
  1. Verify UC24 email worker supports 'REJECTION_NOTIFICATION' type
  2. Update Prisma schema: Add `rejected_at`, `rejection_reason` fields
  3. Run migration
  4. Seed test data: Applications ở status SUBMITTED
  5. Test endpoints locally
- **Troubleshooting**: Reuse UC24 email worker troubleshooting guide

---

## Phase 2: Task Generation (Separate Command)

**NOT part of /speckit-plan**. Run `/speckit-tasks` để tạo `tasks.md` với atomic tasks:

**Phase 1: Database & Schema** (2 tasks)
- T001: Update Prisma schema - Add rejected_at, rejection_reason fields
- T002: Create migration và apply

**Phase 2: Backend - Repository Layer** (1 task)
- T003: Verify UC24 updateStatusWithCondition works for REJECTED status (no new code needed)

**Phase 3: Backend - Service Layer** (4 tasks)
- T004: Add rejectApplication method (similar to UC24 approveApplication)
- T005: Add bulkRejectApplications method (similar to UC24 bulkApprove)
- T006: Integrate audit logging (reuse UC24 audit.util.js)
- T007: Update email worker to support 'REJECTION_NOTIFICATION' type

**Phase 4: Backend - Controller & Routes** (5 tasks)
- T008: Add Zod validation schemas (rejectSchema, bulkRejectSchema)
- T009: Add controller handlers (rejectApplication, bulkRejectApplications)
- T010: Add routes (PATCH /:id/reject, POST /bulk-reject)
- T011: Add Swagger JSDoc documentation
- T012: Write integration tests

**Phase 5: Frontend - API Client** (2 tasks)
- T013: Update applicationApi.js - Add rejectApplication, bulkRejectApplications
- T014: Create useRejectApplication hook

**Phase 6: Frontend - Components US1** (3 tasks)
- T015: Create RejectButton component với rejection reason dialog
- T016: Update ApplicationDetailPage - Add RejectButton
- T017: Handle error scenarios

**Phase 7: Frontend - Components US2** (3 tasks)
- T018: Create BulkRejectButton component
- T019: Update ApplicationListPage - Add bulk reject UI
- T020: Handle partial success results

**Phase 8: Documentation & Polish** (4 tasks)
- T021: Update API_CONTRACTS.md
- T022: Update CLAUDE.md
- T023: Run performance + security tests
- T024: Manual E2E validation

**Total**: ~24 tasks (significantly fewer than UC24 due to infrastructure reuse)

---

**End of Plan** — Ready for human review và approval trước khi execute Phase 0 research.

# Tasks: Reject Application (UC25)

**Feature Branch**: `025-feat-reject-application`  
**Created**: 2026-06-30  
**Status**: READY FOR IMPLEMENTATION

**Input**: Design documents from `.sdd/TienTD/UC25-feat-reject-application/`

**Prerequisites**: 
- ✅ plan.md (complete)
- ✅ research.md (complete - 4 RQs resolved)
- ✅ data-model.md (complete - Application schema + rejection fields)
- ✅ contracts/PATCH-applications-applicationId-reject.md (complete)
- ✅ contracts/POST-applications-bulk-reject.md (complete)
- ✅ quickstart.md (complete)

**Organization**: Tasks are grouped by implementation phase to enable sequential execution with clear checkpoints.

---

## Format: `[ID] [P?] [Phase] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Phase]**: Which phase this task belongs to (P1-P10)
- File paths follow VMS project structure: `backend/src/`, `frontend/src/`

---

## Phase 1: Database & Schema (Setup)

**Purpose**: Database migrations for rejection tracking fields

**⚠️ Prerequisites**: MySQL 8.0+ running, Prisma CLI installed, UC22/UC23/UC24 completed

- [ ] T001 [P1] Update Prisma schema `backend/prisma/schema.prisma` - ADD rejection tracking fields to Application model:
  - Field 1: `rejected_at DateTime?` (nullable)
  - Field 2: `rejection_reason String? @db.VarChar(500)` (nullable)
  - Add after `approved_at` field
  - Update comment: "Timestamp and reason when application was rejected by staff"

- [ ] T002 [P1] Create database migration:
  - Run: `cd backend && npx prisma migrate dev --name add_reject_application_fields`
  - Verify migration file created in `backend/prisma/migrations/`
  - Verify migration SQL matches data-model.md specifications
  - Apply migration: `npx prisma migrate deploy`
  - Generate Prisma Client: `npx prisma generate`

- [ ] T003 [P1] Create database index for analytics:
  - Manually add index to migration if not auto-generated: `CREATE INDEX idx_va_rejected_at ON volunteer_applications(rejected_at);`
  - This supports rejection rate analytics queries from data-model.md

**Checkpoint**: Database schema ready → Can proceed to Backend Repository phase

---

## Phase 2: Backend - Repository Layer

**Purpose**: Data access methods for reject operations (minimal changes - reuse UC24 patterns)

- [ ] T004 [P2] Update `backend/src/repositories/application.repository.js` - VERIFY method `updateStatusWithCondition(applicationId, newStatus, conditions, additionalData)` exists from UC24:
  - This method already supports passing `additionalData` object for fields like `rejected_at`, `rejection_reason`
  - If NOT exists, ADD this method following UC24 pattern
  - Use Prisma updateMany với WHERE clause: id AND status IN conditions.allowedStatuses
  - Return count of updated rows (0 if no match, 1 if success)

- [ ] T005 [P2] Update `backend/src/repositories/application.repository.js` - VERIFY method `findByIds(applicationIds, organizationId)` exists from UC24:
  - Query applications WHERE id IN applicationIds AND event.organization_id = organizationId
  - Include event relationship for authorization check
  - Return array of applications
  - This is already implemented in UC24, just verify it works for reject

**Checkpoint**: Repository layer ready (mostly reused from UC24) → Can proceed to Service layer

---

## Phase 3: Backend - Service Layer

**Purpose**: Business logic for reject operations

- [ ] T006 [P3] Update `backend/src/services/application.service.js` - ADD method `rejectApplication(applicationId, rejectionReason, staffId, organizationId)`:
  - Step 1: Validate application exists và organization ownership (call repository.findById with org check)
  - Step 2: Check state transition rules (throw BadRequestError if status is APPROVED/WITHDRAWN/CANCELLED)
  - Step 3: Execute transaction:
    - Call updateStatusWithCondition(applicationId, 'REJECTED', { allowedStatuses: ['SUBMITTED', 'REVIEWED', 'REJECTED'] }, { rejected_at: new Date(), rejection_reason: rejectionReason || null })
    - INSERT email_queue record with type='REJECTION_NOTIFICATION' (reuse UC24 pattern)
  - Step 4: Handle idempotent case (if updateCount = 0 && current status = REJECTED → return { alreadyRejected: true })
  - Step 5: Return rejected application with email_status
  - Follow pattern from contracts/PATCH-applications-applicationId-reject.md

- [ ] T007 [P3] Update `backend/src/services/application.service.js` - ADD method `bulkRejectApplications(applicationIds, rejectionReason, staffId, organizationId)`:
  - Step 1: Validate all applicationIds exist và belong to same organization (call repository.findByIds)
  - Step 2: Process each application independently (RQ3 decision: multiple transactions)
  - Step 3: For each application, try-catch call rejectApplication → collect successful/failed results
  - Step 4: Return summary object: { successful: [ids], failed: [{application_id, reason, error_code}], summary: {total, succeeded, failed, duration_ms}, rejection_reason }
  - Follow pattern from contracts/POST-applications-bulk-reject.md
  - REUSE UC24 bulk approve structure with rejection-specific logic

**Checkpoint**: Service layer complete → Can proceed to Controller layer

---

## Phase 4: Backend - Controller Layer

**Purpose**: HTTP request handling và validation

- [ ] T008 [P4] Update `backend/src/controllers/application.controller.js` - ADD method `rejectApplication(req, res, next)`:
  - Extract: applicationId from req.params, rejection_reason from req.body, staffId + organizationId from req.user (JWT)
  - Validate request body với Zod schema (see T010)
  - Call applicationService.rejectApplication(applicationId, rejection_reason, staffId, organizationId)
  - Return 200 OK với standardized response format (use response.util.js)
  - Handle errors: 400 (validation/invalid state), 401 (auth), 403 (org mismatch), 404 (not found), 500 (server error)
  - Follow pattern from contracts/PATCH-applications-applicationId-reject.md

- [ ] T009 [P4] Update `backend/src/controllers/application.controller.js` - ADD method `bulkRejectApplications(req, res, next)`:
  - Extract: application_ids + rejection_reason from req.body, staffId + organizationId from req.user
  - Validate request body với Zod schema (see T011)
  - Call applicationService.bulkRejectApplications(application_ids, rejection_reason, staffId, organizationId)
  - Return 200 OK with partial success response (even if some failed)
  - Follow pattern from contracts/POST-applications-bulk-reject.md
  - REUSE UC24 bulk approve controller structure

**Checkpoint**: Controller layer complete → Can proceed to Validation layer

---

## Phase 5: Backend - Validation Layer

**Purpose**: Request body validation schemas

- [ ] T010 [P5] Create `backend/src/validators/application.validator.js` - ADD Zod schema `rejectApplicationSchema`:
  ```javascript
  export const rejectApplicationSchema = z.object({
    rejection_reason: z
      .string()
      .max(500, 'Rejection reason must not exceed 500 characters')
      .optional() // Can be omitted
  });
  ```

- [ ] T011 [P5] Update `backend/src/validators/application.validator.js` - ADD Zod schema `bulkRejectApplicationsSchema`:
  ```javascript
  export const bulkRejectApplicationsSchema = z.object({
    application_ids: z
      .array(z.string().uuid('Each application ID must be a valid UUID'))
      .min(1, 'Must provide at least 1 application ID')
      .max(50, 'Cannot reject more than 50 applications at once'),
    rejection_reason: z
      .string()
      .max(500, 'Rejection reason must not exceed 500 characters')
      .optional()
  });
  ```

**Checkpoint**: Validation schemas ready → Can proceed to Routes

---

## Phase 6: Backend - Routes Layer

**Purpose**: API endpoint registration

- [ ] T012 [P6] Update `backend/src/routes/application.routes.js` - ADD route for single reject:
  - Path: `PATCH /applications/:applicationId/reject`
  - Middleware chain: authMiddleware (JWT validation) → applicationController.rejectApplication
  - Register AFTER approve routes để maintain logical grouping

- [ ] T013 [P6] Update `backend/src/routes/application.routes.js` - ADD route for bulk reject:
  - Path: `POST /applications/bulk-reject`
  - Middleware chain: authMiddleware → applicationController.bulkRejectApplications
  - Register AFTER single reject route

**Checkpoint**: Routes registered → Can proceed to Email Worker

---

## Phase 7: Backend - Email Worker

**Purpose**: Email notification for rejected applications

- [ ] T014 [P7] Update `backend/src/workers/email.worker.js` - ADD handler for 'REJECTION_NOTIFICATION' email type:
  - REUSE UC24 email worker structure (already exists from UC24)
  - ADD new case in switch statement for email_type === 'REJECTION_NOTIFICATION'
  - Parse template_data JSON: { volunteer_name, event_name, event_date, rejection_reason, organization_name }
  - Call email service to send rejection email
  - Handle rejection_reason: Display "No specific reason provided" if null/empty

- [ ] T015 [P7] Create email template `backend/src/templates/emails/rejection-notification.html`:
  - HTML template with Handlebars syntax
  - Include: volunteer_name, event_name, event_date, organization_name
  - Conditional display of rejection_reason ({{#if rejection_reason}} block)
  - Professional tone: "We regret to inform you..."
  - Encouragement to apply for other events
  - Follow template structure from quickstart.md

**Checkpoint**: Email worker ready → Can proceed to Error Handling

---

## Phase 8: Backend - Error Handling

**Purpose**: Custom error classes và error messages

- [ ] T016 [P8] Update `backend/src/utils/errors.util.js` - VERIFY custom error classes exist from UC24:
  - BadRequestError (400) - for invalid state transitions
  - UnauthorizedError (401) - for missing/invalid JWT
  - ForbiddenError (403) - for organization mismatch
  - NotFoundError (404) - for application not found
  - ConflictError (409) - not used in UC25 but keep for consistency
  - InternalServerError (500) - for unexpected errors

- [ ] T017 [P8] Update error messages to include rejection-specific scenarios:
  - "Application is in APPROVED state (use Cancel UC26 instead)"
  - "Application is in WITHDRAWN state (cannot reject withdrawn applications)"
  - "Application is in CANCELLED state (cannot reject cancelled applications)"
  - "Rejection reason exceeds 500 characters"

**Checkpoint**: Error handling complete → Can proceed to Testing

---

## Phase 9: Backend - Testing

**Purpose**: Unit tests và integration tests (target 80% coverage)

### Unit Tests (Service Layer)

- [ ] T018 [P9] Create `backend/tests/unit/services/application.service.test.js` - ADD test suite for `rejectApplication`:
  - Test 1: Should reject SUBMITTED application with rejection_reason
  - Test 2: Should reject SUBMITTED application without rejection_reason (null)
  - Test 3: Should reject REVIEWED application with rejection_reason
  - Test 4: Should return idempotent response for already REJECTED application
  - Test 5: Should throw BadRequestError for APPROVED application
  - Test 6: Should throw BadRequestError for WITHDRAWN application
  - Test 7: Should throw ForbiddenError for organization mismatch
  - Test 8: Should throw NotFoundError for non-existent application
  - Test 9: Should create email queue entry with correct template_data
  - Test 10: Should handle rejection_reason exceeding 500 chars (throw ValidationError)

- [ ] T019 [P9] Create `backend/tests/unit/services/application.service.test.js` - ADD test suite for `bulkRejectApplications`:
  - Test 1: Should reject all 5 valid SUBMITTED applications
  - Test 2: Should return partial success (3 succeeded, 2 failed)
  - Test 3: Should handle all failed scenario (0 succeeded, 5 failed)
  - Test 4: Should apply same rejection_reason to all applications
  - Test 5: Should handle duplicate application IDs (idempotent)
  - Test 6: Should handle mixed states (SUBMITTED, REVIEWED, APPROVED, REJECTED)
  - Test 7: Should track duration_ms in summary
  - Test 8: Should handle organization mismatch for subset of applications

### Integration Tests (API Endpoints)

- [ ] T020 [P9] Create `backend/tests/integration/application.integration.test.js` - ADD test suite for `PATCH /api/v1/applications/:id/reject`:
  - Test 1: Should return 200 OK for valid reject with reason
  - Test 2: Should return 200 OK for valid reject without reason
  - Test 3: Should return 200 OK for idempotent reject (already REJECTED)
  - Test 4: Should return 400 Bad Request for rejection_reason > 500 chars
  - Test 5: Should return 400 Bad Request for APPROVED application
  - Test 6: Should return 401 Unauthorized for missing JWT token
  - Test 7: Should return 403 Forbidden for Volunteer role
  - Test 8: Should return 403 Forbidden for organization mismatch
  - Test 9: Should return 404 Not Found for invalid application ID

- [ ] T021 [P9] Create `backend/tests/integration/application.integration.test.js` - ADD test suite for `POST /api/v1/applications/bulk-reject`:
  - Test 1: Should return 200 OK for all successful (10 applications)
  - Test 2: Should return 200 OK for partial success with failed array
  - Test 3: Should return 200 OK for all failed (0 succeeded)
  - Test 4: Should return 400 Bad Request for empty application_ids array
  - Test 5: Should return 400 Bad Request for > 50 application_ids
  - Test 6: Should return 400 Bad Request for invalid UUID format
  - Test 7: Should return 400 Bad Request for rejection_reason > 500 chars
  - Test 8: Should return 401 Unauthorized for missing JWT token
  - Test 9: Should return 403 Forbidden for Volunteer role

**Checkpoint**: Backend testing complete (80% coverage target) → Can proceed to Swagger Documentation

---

## Phase 10: Backend - API Documentation

**Purpose**: Swagger/OpenAPI documentation

- [ ] T022 [P10] Update `backend/src/routes/application.routes.js` - ADD Swagger JSDoc comments for single reject endpoint:
  - @swagger tag above route registration
  - Document: PATCH /api/v1/applications/{applicationId}/reject
  - Request body schema: { rejection_reason: string (optional, max 500) }
  - Response 200: Success response with application object
  - Response 400/401/403/404/500: Error responses
  - Examples from contracts/PATCH-applications-applicationId-reject.md

- [ ] T023 [P10] Update `backend/src/routes/application.routes.js` - ADD Swagger JSDoc comments for bulk reject endpoint:
  - @swagger tag above route registration
  - Document: POST /api/v1/applications/bulk-reject
  - Request body schema: { application_ids: string[], rejection_reason: string (optional) }
  - Response 200: Partial success response with summary
  - Response 400/401/403/500: Error responses
  - Examples from contracts/POST-applications-bulk-reject.md

**Checkpoint**: Backend implementation complete → Can proceed to Frontend

---

## Phase 11: Frontend - API Client

**Purpose**: Axios API client functions

- [ ] T024 [P11] Update `frontend/src/services/api/applicationApi.js` - ADD function `rejectApplication`:
  ```javascript
  async rejectApplication(applicationId, rejectionReason) {
    const response = await axios.patch(
      `/api/v1/applications/${applicationId}/reject`,
      { rejection_reason: rejectionReason }, // Optional field
      {
        headers: {
          'Authorization': `Bearer ${getJwtToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }
  ```

- [ ] T025 [P11] Update `frontend/src/services/api/applicationApi.js` - ADD function `bulkRejectApplications`:
  ```javascript
  async bulkRejectApplications(applicationIds, rejectionReason) {
    const response = await axios.post(
      '/api/v1/applications/bulk-reject',
      { 
        application_ids: applicationIds,
        rejection_reason: rejectionReason // Optional field
      },
      {
        headers: {
          'Authorization': `Bearer ${getJwtToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }
  ```

**Checkpoint**: API client ready → Can proceed to UI Components

---

## Phase 12: Frontend - UI Components

**Purpose**: React components for reject functionality

- [ ] T026 [P12] Create `frontend/src/components/Applications/RejectDialog.jsx` - Single reject confirmation dialog:
  - Props: { open, onClose, onConfirm, applicationId, applicationName }
  - Material UI Dialog component
  - Autocomplete component for rejection_reason (from RQ4 decision)
  - Predefined templates: ["Not meet skill requirements", "Event postponed", "Event cancelled", "Insufficient experience", "Application submitted after deadline", "Duplicate application"]
  - TextField with freeSolo enabled (allow custom text)
  - Character counter: "{length}/500 characters"
  - Error state when > 500 chars
  - Cancel + Confirm buttons
  - Disable Confirm when validation fails

- [ ] T027 [P12] Create `frontend/src/components/Applications/BulkRejectDialog.jsx` - Bulk reject dialog:
  - Props: { open, onClose, onConfirm, selectedCount }
  - Similar to RejectDialog but shows "Reject {selectedCount} Applications" title
  - Same Autocomplete pattern for rejection_reason
  - Note: "Same reason will apply to ALL selected applications"
  - Cancel + Confirm (red button with warning icon)
  - REUSE RejectDialog structure with bulk-specific messaging

- [ ] T028 [P12] Create `frontend/src/components/Applications/FailedRejectModal.jsx` - Failed rejection details modal:
  - Props: { open, onClose, failures }
  - Material UI Dialog + Table component
  - Display failed applications: application_id, reason, error_code
  - Each error_code as colored Chip (error color)
  - Close button only (informational modal)
  - REUSE UC24 FailedApprovalModal structure

**Checkpoint**: UI components ready → Can proceed to Page Integration

---

## Phase 13: Frontend - Page Integration

**Purpose**: Integrate reject functionality into existing pages

- [ ] T029 [P13] Update `frontend/src/pages/Staff/ApplicationDetail.jsx` - ADD single reject button:
  - ADD state: `const [rejectDialogOpen, setRejectDialogOpen] = useState(false);`
  - ADD Reject button next to Approve button:
    - `<Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => setRejectDialogOpen(true)} disabled={!canReject(application.status)}>Reject</Button>`
  - ADD RejectDialog component at bottom
  - canReject function: `return ['SUBMITTED', 'REVIEWED'].includes(status);`
  - Handle onConfirm: call applicationApi.rejectApplication → show toast → refresh application data
  - Handle errors with toast notifications

- [ ] T030 [P13] Update `frontend/src/pages/Staff/ApplicationList.jsx` - ADD bulk reject button:
  - ADD state: `const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);`
  - ADD Bulk Reject button next to Bulk Approve button (visible when selectedIds.length > 0):
    - `<Button variant="contained" color="error" onClick={() => setBulkRejectDialogOpen(true)}>Bulk Reject ({selectedIds.length})</Button>`
  - ADD BulkRejectDialog component
  - ADD FailedRejectModal for showing partial failures
  - Handle onConfirm: call applicationApi.bulkRejectApplications → show summary toast → display failed modal if failures.length > 0 → refresh list → clear selection
  - REUSE UC24 bulk approve UI structure

**Checkpoint**: Page integration complete → Can proceed to E2E Testing

---

## Phase 14: Frontend - E2E Testing

**Purpose**: End-to-end user workflow testing

- [ ] T031 [P14] Create `frontend/tests/e2e/reject-application.spec.js` - E2E test for single reject:
  - Test 1: Staff can reject SUBMITTED application from detail page with reason
  - Test 2: Staff can reject SUBMITTED application from detail page without reason
  - Test 3: Reject button disabled for APPROVED application
  - Test 4: Reject button disabled for REJECTED application
  - Test 5: Character counter displays correctly (500 char limit)
  - Test 6: Cannot submit with > 500 characters
  - Test 7: Success toast displayed after rejection
  - Test 8: Application status changes to REJECTED in UI

- [ ] T032 [P14] Create `frontend/tests/e2e/bulk-reject-application.spec.js` - E2E test for bulk reject:
  - Test 1: Staff can bulk reject 5 applications with rejection reason template
  - Test 2: Staff can bulk reject 3 applications with custom rejection reason
  - Test 3: Staff can bulk reject without rejection reason
  - Test 4: Partial success shows correct summary toast message
  - Test 5: Failed rejection modal displays correctly with error codes
  - Test 6: Selection cleared after successful bulk reject
  - Test 7: Cannot submit with empty selection
  - Test 8: Cannot submit with > 50 applications selected

**Checkpoint**: E2E testing complete → Can proceed to Performance Testing

---

## Phase 15: Performance & Load Testing

**Purpose**: Verify performance targets from quickstart.md

- [ ] T033 [P15] Create performance test script `backend/tests/performance/reject-load-test.js`:
  - Test single reject endpoint: Target <200ms p50, >100 req/s throughput
  - Test bulk reject endpoint (10 apps): Target <1s response time
  - Test bulk reject endpoint (50 apps): Target <5s response time
  - Use tools: Artillery or k6 for load testing
  - Run with 20 concurrent users (from performance targets)
  - Generate report: p50, p95, p99 latencies + throughput

- [ ] T034 [P15] Verify database query performance:
  - Check EXPLAIN for updateStatusWithCondition query
  - Verify idx_va_rejected_at index is being used for analytics queries
  - Monitor query execution time under load
  - Target: <50ms per application transaction overhead

**Checkpoint**: Performance validated → Implementation complete

---

## Summary

**Total Tasks**: 34 tasks across 15 phases

**Estimated Time Breakdown**:
- Phase 1-2: Database & Repository (30 min) - mostly reuse UC24
- Phase 3-4: Service & Controller (1.5 hours) - core business logic
- Phase 5-6: Validation & Routes (30 min) - straightforward
- Phase 7-8: Email & Errors (1 hour) - reuse UC24 worker
- Phase 9: Testing (2 hours) - 80% coverage target
- Phase 10: Swagger docs (30 min)
- Phase 11-13: Frontend (2 hours) - API client + UI components + integration
- Phase 14: E2E testing (1 hour)
- Phase 15: Performance testing (30 min)

**Total Estimated Time**: ~9 hours (with ~60% code reuse from UC24)

**Dependencies**: UC22 (List), UC23 (Detail), UC24 (Approve) must be completed first

**Ready for**: `/speckit-implement` command to execute all tasks sequentially

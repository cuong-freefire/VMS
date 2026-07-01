# Tasks: Approve Application (UC24)

**Feature Branch**: `024-feat-approve-application`  
**Created**: 2026-06-29  
**Status**: READY FOR IMPLEMENTATION

**Input**: Design documents from `.sdd/TienTD/UC24-feat-approve-application/`

**Prerequisites**: 
- ✅ plan.md (complete)
- ✅ spec.md (complete - 2 user stories)
- ✅ research.md (complete - 6 RQs resolved)
- ✅ data-model.md (complete - Application schema + EmailQueue table)
- ✅ contracts/PATCH-applications-applicationId-approve.md (complete)
- ✅ contracts/POST-applications-bulk-approve.md (complete)
- ✅ quickstart.md (complete - 13-step implementation guide)

**Organization**: Tasks are grouped by implementation phase to enable sequential execution with clear checkpoints.

---

## Format: `[ID] [P?] [Phase] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Phase]**: Which phase this task belongs to (P1-P10)
- File paths follow VMS project structure: `backend/src/`, `frontend/src/`

---

## Phase 1: Database & Schema (Setup)

**Purpose**: Database migrations and EmailQueue table setup

**⚠️ Prerequisites**: MySQL 8.0+ running, Prisma CLI installed, UC22/UC23 completed

- [ ] T001 [P1] Update Prisma schema `backend/prisma/schema.prisma` - ADD `approved_at` field to Application model:
  - Field type: `DateTime?` (nullable)
  - Add after `rejected_at` field
  - Update comment: "Timestamp when application was approved by staff"

- [ ] T002 [P1] Create EmailQueue model trong `backend/prisma/schema.prisma`:
  - Table name: `email_queue`
  - Fields: id (String @id @default(uuid())), type (String), recipient_id (String), application_id (String), status (String), retry_count (Int @default(0)), last_error (String?), created_at (DateTime @default(now())), sent_at (DateTime?)
  - Add indexes: @@index([status, retry_count]), @@index([application_id])
  - Add relation: application Application @relation(fields: [application_id], references: [id])

- [ ] T003 [P1] Create database migration:
  - Run: `cd backend && npx prisma migrate dev --name add_approve_application_fields`
  - Verify migration file created in `backend/prisma/migrations/`
  - Apply migration: `npx prisma migrate deploy`
  - Generate Prisma Client: `npx prisma generate`

**Checkpoint**: Database schema ready → Can proceed to Backend Repository phase

---

## Phase 2: Backend - Repository Layer

**Purpose**: Data access methods for approve operations

- [ ] T004 [P2] Update `backend/src/repositories/application.repository.js` - ADD method `checkCapacity(eventId)`:
  - Query event.max_capacity và COUNT approved applications
  - Calculate: current_approved, available_slots, is_at_capacity, is_at_hard_limit (1.2x buffer)
  - Return capacity info object
  - Use transaction-safe query (SELECT ... FOR UPDATE if needed)

- [ ] T005 [P2] Update `backend/src/repositories/application.repository.js` - ADD method `updateStatusWithCondition(applicationId, newStatus, conditions)`:
  - Use Prisma updateMany với WHERE clause: id AND status IN conditions.allowedStatuses
  - Return count of updated rows (0 if no match, 1 if success)
  - This enables status-based idempotency (RQ4 decision)

- [ ] T006 [P2] Update `backend/src/repositories/application.repository.js` - ADD method `findByIds(applicationIds, organizationId)`:
  - Query applications WHERE id IN applicationIds AND event.organization_id = organizationId
  - Include event relationship for authorization check
  - Return array of applications
  - Use for bulk approve validation

**Checkpoint**: Repository layer ready → Can proceed to Service layer

---

## Phase 3: Backend - Service Layer

**Purpose**: Business logic for approve operations

- [ ] T007 [P3] Update `backend/src/services/application.service.js` - ADD method `approveApplication(applicationId, staffId, organizationId)`:
  - Step 1: Validate application exists và organization ownership (call repository.findByIds)
  - Step 2: Check capacity constraints (call repository.checkCapacity) → throw ConflictError if at hard limit
  - Step 3: Execute transaction: updateStatusWithCondition + INSERT email_queue record
  - Step 4: Handle idempotent case (if updateCount = 0, check if already APPROVED → return special response)
  - Step 5: Return approved application + capacity info
  - Follow pattern from contracts/PATCH-applications-applicationId-approve.md

- [ ] T008 [P3] Update `backend/src/services/application.service.js` - ADD method `bulkApproveApplications(applicationIds, staffId, organizationId)`:
  - Step 1: Validate all applicationIds exist và belong to same organization (call repository.findByIds)
  - Step 2: Process each application independently (RQ3 decision: multiple transactions)
  - Step 3: For each application, try-catch call approveApplication → collect successful/failed results
  - Step 4: Return summary object: { successful: [ids], failed: [{id, reason}], summary: {total, succeeded, failed} }
  - Follow pattern from contracts/POST-applications-bulk-approve.md

- [ ] T009 [P3] Create audit utility `backend/src/utils/audit.util.js` (if not exists):
  - Function `logApprove(staffId, applicationId, eventId, result)` → Log approval action
  - Format: `{ action: 'APPROVE_APPLICATION', staff_id, application_id, event_id, result: 'SUCCESS'|'FAILED', timestamp }`
  - Use Pino logger với level INFO
  - MUST NOT log sensitive volunteer data

- [ ] T010 [P3] Integrate audit logging into service methods:
  - Call audit.logApprove trong approveApplication method (after transaction success)
  - Call audit.logApprove trong bulkApproveApplications method (for each application result)

**Checkpoint**: Service layer ready → Can proceed to Controller layer

---

## Phase 4: Backend - Controller & Routes

**Purpose**: HTTP request handling and validation

- [ ] T011 [P4] Update Zod validator `backend/src/validators/application.validator.js` - ADD schema:
  - `bulkApproveSchema`: object với field application_ids (array of UUIDs, min 1, max 50)
  - Use z.array(z.string().uuid()).min(1).max(50)

- [ ] T012 [P4] Update controller `backend/src/controllers/application.controller.js` - ADD handler `approveApplication`:
  - Extract applicationId từ req.params, staffId và organizationId từ req.user
  - Call applicationService.approveApplication(applicationId, staffId, organizationId)
  - Return successResponse(res, 200, application, 'Application approved successfully')
  - Use try-catch và forward errors to next(error)

- [ ] T013 [P4] Update controller `backend/src/controllers/application.controller.js` - ADD handler `bulkApproveApplications`:
  - Extract application_ids từ req.body (validated by bulkApproveSchema)
  - Call applicationService.bulkApproveApplications(application_ids, staffId, organizationId)
  - Return successResponse(res, 200, result, 'Bulk approve completed')
  - Always return 200 (even partial failures - failed list in response)

- [ ] T014 [P4] Update routes `backend/src/routes/application.routes.js` - ADD routes:
  - PATCH /:applicationId/approve → authenticate, validate UUID, controller.approveApplication
  - POST /bulk-approve → authenticate, validate bulkApproveSchema, controller.bulkApproveApplications
  - Ensure routes are properly ordered (specific routes before parameterized routes)

- [ ] T015 [P4] Add Swagger JSDoc documentation:
  - Document PATCH /:applicationId/approve endpoint trong controller
  - Document POST /bulk-approve endpoint trong controller
  - Include examples for 200, 400, 401, 403, 404, 409 responses

**Checkpoint**: Controller layer ready → Can proceed to Email Integration

---

## Phase 5: Backend - Email Integration

**Purpose**: Email worker for approval notifications (RQ5 decision)

- [ ] T016 [P5] Create email worker `backend/src/workers/email.worker.js`:
  - Use node-cron: `cron.schedule('*/10 * * * * *', async () => {...})` (poll every 10 seconds)
  - Query email_queue WHERE status='PENDING' AND retry_count < 3, LIMIT 50
  - For each job: POST to EMAIL_SERVICE_URL, update status to SENT on success, increment retry_count on failure
  - Log worker activity với Pino logger

- [ ] T017 [P5] Add environment config `backend/.env`:
  - EMAIL_SERVICE_URL=http://localhost:5001/api/v1/emails/send
  - EMAIL_WORKER_ENABLED=true
  - EMAIL_WORKER_INTERVAL_SECONDS=10

- [ ] T018 [P5] Start email worker trong `backend/src/index.js`:
  - Import email worker module
  - Check process.env.EMAIL_WORKER_ENABLED
  - Start worker after server starts listening

**Checkpoint**: Email integration ready → Can proceed to Backend Testing

---

## Phase 6: Backend - Testing

**Purpose**: Integration tests for approve endpoints

- [ ] T019 [P6] Write integration tests `backend/tests/integration/application-approve.test.js`:
  - Test case 1: PATCH /:id/approve without JWT → 401 Unauthorized
  - Test case 2: Valid approve (SUBMITTED → APPROVED) → 200 with status APPROVED, approved_at timestamp
  - Test case 3: Already approved (idempotent) → 200 with alreadyApproved flag
  - Test case 4: Wrong organization → 403 Forbidden
  - Test case 5: Capacity at hard limit → 409 Conflict
  - Test case 6: Invalid UUID format → 400 Bad Request
  - Test case 7: Email queue record created after approve
  - Run với: `cd backend && npm test -- application-approve.test.js`

- [ ] T020 [P6] Write bulk approve integration tests `backend/tests/integration/application-bulk-approve.test.js`:
  - Test case 1: POST /bulk-approve without JWT → 401
  - Test case 2: All succeed → 200 with successful array, empty failed array
  - Test case 3: Partial failure (some invalid states) → 200 with mixed successful/failed arrays
  - Test case 4: Invalid request body (empty array, >50 items, non-UUID) → 400
  - Test case 5: Cross-org applications → failed array contains org mismatch errors
  - Run với: `cd backend && npm test -- application-bulk-approve.test.js`

**Checkpoint**: Backend complete and tested → Can proceed to Frontend

---

## Phase 7: Frontend - API Client

**Purpose**: Frontend API integration

- [ ] T021 [P7] Update API client `frontend/src/api/applicationApi.js` - ADD methods:
  - `approveApplication(applicationId)` → PATCH /api/v1/applications/${applicationId}/approve với withCredentials: true
  - `bulkApproveApplications(applicationIds)` → POST /api/v1/applications/bulk-approve với body { application_ids: applicationIds }
  - Return response.data for both

- [ ] T022 [P7] Create custom hook `frontend/src/hooks/useApproveApplication.js`:
  - useState for loading, error states
  - Function handleApprove(applicationId) → call API, handle success/error, show toast notification
  - Return { handleApprove, loading, error }

**Checkpoint**: API client ready → Can proceed to UI components

---

## Phase 8: Frontend - Components US1 (Single Approve from Detail Page)

**Purpose**: Add approve button to UC23 ApplicationDetailPage

- [ ] T023 [US1] Create ApproveButton component `frontend/src/components/ui/ApproveButton.jsx`:
  - Material UI Button với variant="contained", color="success", startIcon={<CheckCircleIcon />}
  - Prop: applicationId, onSuccess callback
  - Use useApproveApplication hook
  - Show loading spinner khi processing
  - Disable button after click (prevent double-click)
  - PropTypes: applicationId (string required), onSuccess (func)

- [ ] T024 [US1] Update ApplicationDetailPage `frontend/src/components/pages/ApplicationDetailPage.jsx`:
  - ADD ApproveButton component (conditional render: only show if status !== 'APPROVED')
  - Place button in ApplicationInfo card, below status badge
  - OnSuccess callback: refetch application detail to show updated status
  - Show success toast: "Application approved successfully"

- [ ] T025 [US1] Handle error scenarios trong ApplicationDetailPage:
  - 409 Conflict (capacity limit) → show specific error message with capacity info
  - 403 Forbidden → show "Access denied" message
  - Other errors → show generic "Failed to approve application" message

**Checkpoint**: US1 complete → Staff can approve single application from detail page

---

## Phase 9: Frontend - Components US2 (Bulk Approve from List Page)

**Purpose**: Add bulk approve to UC22 ApplicationListPage

- [ ] T026 [US2] Update ApplicationListPage `frontend/src/components/pages/ApplicationListPage.jsx` - ADD selection state:
  - Use Material UI DataGrid với checkboxSelection prop (RQ6 decision: local state)
  - useState for selectedIds array
  - Handle onSelectionModelChange → update selectedIds
  - Disable checkboxes for applications với status='APPROVED' (cannot re-approve)

- [ ] T027 [US2] Create BulkApproveButton component `frontend/src/components/ui/BulkApproveButton.jsx`:
  - Material UI Button với variant="contained", disabled when selectedIds.length === 0
  - Show count badge: "Approve Selected (5)"
  - onClick → open confirmation dialog
  - PropTypes: selectedIds (array), onSuccess (func)

- [ ] T028 [US2] Create ConfirmBulkApproveDialog component `frontend/src/components/ui/ConfirmBulkApproveDialog.jsx`:
  - Material UI Dialog với warning message: "You are about to approve X applications. Continue?"
  - Confirm button → call bulkApproveApplications API
  - Show loading state during API call
  - PropTypes: open (bool), selectedIds (array), onClose (func), onSuccess (func)

- [ ] T029 [US2] Create FailedApprovalModal component `frontend/src/components/ui/FailedApprovalModal.jsx`:
  - Material UI Dialog displaying partial failure results
  - Show summary: "Successfully approved X out of Y applications"
  - List failed applications với reasons (from API response failed array)
  - Close button
  - PropTypes: open (bool), result (object), onClose (func)

- [ ] T030 [US2] Integrate bulk approve into ApplicationListPage:
  - ADD BulkApproveButton above table (only show when selectedIds.length > 0)
  - OnSuccess callback: show FailedApprovalModal if result.failed.length > 0, otherwise show success toast
  - Clear selectedIds after successful bulk approve
  - Refetch application list to show updated statuses

**Checkpoint**: US2 complete → Staff can bulk approve applications from list page

---

## Phase 10: Documentation & Polish

**Purpose**: Documentation, performance validation, final testing

- [ ] T031 [P] [P10] Update `API_CONTRACTS.md` (or `share_context.md`):
  - Add API contract for PATCH /api/v1/applications/:applicationId/approve
  - Add API contract for POST /api/v1/applications/bulk-approve
  - Include curl examples, request/response formats, error codes

- [ ] T032 [P] [P10] Update `CLAUDE.md` Section 9 (Active Implementation Plans):
  - Document UC24 completion status
  - List key decisions: Transactional Outbox Pattern (RQ1), Overflow Bucket 20% buffer (RQ2), Multiple Independent Transactions (RQ3), Status-based Idempotency (RQ4), Database Queue + Cron Worker (RQ5), Local useState (RQ6)
  - Note technical achievements: Email worker implementation, capacity enforcement, partial success handling

- [ ] T033 [P10] Run performance tests:
  - Single approve: `ab -n 1000 -c 50 -m PATCH -H "Cookie: vms_access_token=..." http://localhost:5000/api/v1/applications/:id/approve`
  - Verify p95 <500ms (SC-001 from spec.md)
  - Bulk approve 50 items: verify completes <10s

- [ ] T034 [P10] Security audit:
  - Verify email queue does NOT contain sensitive volunteer data (only IDs)
  - Verify audit logs do NOT contain sensitive data
  - Verify organization ownership validation prevents cross-org approvals
  - Test capacity enforcement cannot be bypassed

- [ ] T035 [P] [P10] Run linting:
  - Backend: `cd backend && npm run lint`
  - Frontend: `cd frontend && npm run lint`

- [ ] T036 [P] [P10] Verify test coverage:
  - Backend Service layer coverage ≥80%: `cd backend && npm run test:coverage`
  - Frontend component coverage ≥70%: `cd frontend && npm run test:coverage`

- [ ] T037 [P10] Manual end-to-end test:
  - Login as Staff user
  - Navigate to application detail page (UC23) → Click "Approve" button → Verify status changes to APPROVED
  - Navigate to application list page (UC22) → Select 5 applications → Click "Bulk Approve" → Verify confirmation dialog → Confirm → Verify success message
  - Test partial failure: Select mix of SUBMITTED and APPROVED applications → Bulk approve → Verify FailedApprovalModal shows already-approved items in failed list
  - Test capacity limit: Approve applications until event reaches max_capacity * 1.2 → Verify 409 error with clear message
  - Check email_queue table: `SELECT * FROM email_queue WHERE status='PENDING' ORDER BY created_at DESC LIMIT 10;` → Verify records created
  - Wait 10 seconds → Check email worker logs → Verify jobs processed

**Checkpoint**: Full UC24 feature complete, tested, and documented

---

## Task Summary

**Total Tasks**: 37

**By Phase**:
- Phase 1 (Database & Schema): 3 tasks
- Phase 2 (Repository Layer): 3 tasks
- Phase 3 (Service Layer): 4 tasks
- Phase 4 (Controller & Routes): 5 tasks
- Phase 5 (Email Integration): 3 tasks
- Phase 6 (Backend Testing): 2 tasks
- Phase 7 (Frontend API Client): 2 tasks
- Phase 8 (Frontend US1): 3 tasks
- Phase 9 (Frontend US2): 5 tasks
- Phase 10 (Documentation & Polish): 7 tasks

**By Story**:
- SHARED (infrastructure): 27 tasks
- US1 (Single approve): 3 tasks
- US2 (Bulk approve): 5 tasks
- Documentation: 7 tasks

**Parallel Tasks**: 6 tasks marked [P] can run in parallel

**Estimated Effort**:
- Database & Schema: 1 hour
- Backend (Repository + Service + Controller): 10 hours
- Email Integration: 3 hours
- Backend Testing: 4 hours
- Frontend (API Client + Components): 8 hours
- Documentation & Polish: 3 hours
- **Total**: ~29 hours (3.5 days for single developer)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Database) 
  ↓
Phase 2 (Repository) 
  ↓
Phase 3 (Service) 
  ↓
Phase 4 (Controller & Routes) 
  ↓
├─ Phase 5 (Email Integration) → Phase 6 (Backend Testing)
└─ Phase 7 (API Client) → Phase 8 (US1) → Phase 9 (US2)
  ↓
Phase 10 (Documentation & Polish)
```

### Critical Path

**Sequential Dependencies**:
1. T001 → T002 → T003 (Database setup must complete first)
2. T003 → T004-T006 (Repository needs schema)
3. T006 → T007-T010 (Service needs repository)
4. T010 → T011-T015 (Controller needs service)
5. T015 → T016-T018 (Email worker independent)
6. T015 → T019-T020 (Backend tests)
7. T015 → T021-T022 (Frontend API client)
8. T022 → T023-T025 (US1 components)
9. T025 → T026-T030 (US2 builds on US1 page updates)
10. All above → T031-T037 (Final polish)

**Parallel Opportunities**:
- T016, T017, T018 can run in parallel (different files)
- T019, T020 can run in parallel (different test files)
- T021, T022 can run in parallel (different files)
- T023, T024, T025 can run sequentially (same UC23 page)
- T027, T028, T029 can run in parallel (different component files)
- T031, T032 can run in parallel (different docs)
- T035, T036 can run in parallel (linting vs coverage)

---

## Implementation Strategy

### MVP First (Deliver US1 Only)

**Timeline**: ~2 days

1. ✅ Complete Phase 1-6: Database + Backend + Tests (Phases 1-6) - **22 tasks**
2. ✅ Complete Phase 7-8: Frontend API + US1 (single approve) - **5 tasks**
3. **STOP and VALIDATE**: Test US1 independently
4. Deploy MVP: Staff can approve single application from detail page

**Deliverable**: Single approve functionality with email notifications

### Full Feature (Add US2)

**Timeline**: +1 day

1. ✅ MVP from above
2. ✅ Complete Phase 9: US2 (bulk approve) - **5 tasks**
3. **STOP and VALIDATE**: Test US2 + combined functionality
4. Deploy full feature

**Deliverable**: Full UC24 with single + bulk approve

### Polish & Release

**Timeline**: +0.5 day

1. ✅ Full feature from above
2. ✅ Complete Phase 10: Documentation & Polish - **7 tasks**
3. Final validation per quickstart.md
4. Merge to Dev branch
5. Deploy to production

**Deliverable**: Production-ready UC24 with full documentation

---

## Success Criteria Checklist

Per spec.md requirements:

- [ ] **SC-001**: Single approve completes <2s (verify với T033 performance test)
- [ ] **SC-002**: Bulk approve 50 applications completes <10s (verify với T033)
- [ ] **FR-001**: Organization ownership validated (verify với T019, T020 tests)
- [ ] **FR-003**: Capacity enforcement với 20% buffer (verify với T019 test case 5, T034 security audit)
- [ ] **FR-004**: Email notification sent after approval (verify với T019 test case 7, T037 manual test)
- [ ] **FR-005**: Audit log records approval action (verify với T037 manual test)
- [ ] **FR-007**: Idempotent approve (already approved → 200 OK) (verify với T019 test case 3)
- [ ] **FR-018**: Button disabled after click (verify với T023, T024 implementation)

---

**Tasks.md Status**: READY FOR IMPLEMENTATION ✅

**Next Step**: Begin Phase 1 (Database & Schema) hoặc toggle to Act mode để auto-execute tasks sequentially.

# Tasks: Reject Application (UC25)

**Feature Branch**: `025-feat-reject-application`  
**Created**: 2026-06-30  
**Last Updated**: 2026-07-28  
**Status**: BACKEND IMPLEMENTED (Core)

---

## Implementation Status

### Phase 1: Database & Schema

- [x] T001-T003 [P1] Prisma schema already has Application model with status, message, processedBy, processedAt — NO CHANGES NEEDED

### Phase 2: Backend - Repository Layer

- [x] T004 [P2] findById method — IMPLEMENTED (reused from UC24)
- [ ] T005 [P2] findByIds for bulk — NOT IMPLEMENTED (bulk out of scope)

### Phase 3: Backend - Service Layer

- [x] T006 [P3] rejectApplication method — IMPLEMENTED
- [ ] T007 [P3] Bulk reject — NOT IMPLEMENTED (out of scope)

### Phase 4: Backend - Controller Layer

- [x] T008-T009 [P4] rejectApplication handler — IMPLEMENTED

### Phase 5: Backend - Validation Layer

- [x] T010 [P5] rejectApplicationSchema — IMPLEMENTED (message: required, min 10, max 2000)
- [ ] T011 [P5] Bulk reject schema — NOT IMPLEMENTED (out of scope)

### Phase 6: Backend - Routes Layer

- [x] T012 [P6] PATCH /:applicationId/reject route — IMPLEMENTED

### Phase 7-15: Remaining

- [ ] T014-T034 — NOT IMPLEMENTED (email worker, error handling, tests, frontend, performance)

---

## Remaining Work

The following are still needed:
1. Integration tests for PATCH reject endpoint
2. Audit logging for reject actions
3. Frontend components (if within project scope)
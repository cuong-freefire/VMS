# Tasks: View Application List (UC22)

**Feature Branch**: `022-feat-view-application-list`  
**Created**: 2026-06-29  
**Last Updated**: 2026-07-28  
**Status**: BACKEND IMPLEMENTED

---

## Implementation Status

### Phase 1: Setup (Project Initialization)

- [x] T001 [SHARED] Verify Prisma schema có Application model với ApplicationStatus enum trong `backend/prisma/schema.prisma` — Application model exists with statuses: PENDING, APPROVED, REJECTED, CANCELLED
- [ ] T002 [SHARED] Create database migration file — Prisma schema v3.0 used as-is; no custom migration needed
- [ ] T003 [SHARED] Apply migration: `cd backend && npx prisma migrate deploy && npx prisma generate`
- [ ] T004 [SHARED] Verify indexes exist

### Phase 2: Foundational (Shared Infrastructure)

- [x] T005 [P] [SHARED] Create constants file — SKIPPED (inline constants sufficient)
- [x] T006 [P] [SHARED] Reuse existing pagination utility `backend/src/utils/pagination.util.js` — IMPLEMENTED
- [x] T007 [P] [SHARED] Create Zod validator `backend/src/middlewares/validators/application.validator.js` — IMPLEMENTED
- [x] T008 [SHARED] Create repository layer `backend/src/repositories/application.repository.js` with findByEventId, countByEventId — IMPLEMENTED
- [x] T009 [SHARED] Create service layer `backend/src/services/application.service.js` with getApplicationsByEvent — IMPLEMENTED
- [x] T010 [SHARED] Create controller `backend/src/controllers/application.controller.js` — IMPLEMENTED
- [x] T011 [SHARED] Create routes `backend/src/routes/application.routes.js` — IMPLEMENTED
- [ ] T012 [SHARED] Register routes trong `backend/src/app.js` — MAY NOT BE FULLY REGISTERED

### Phase 3: User Story 1

- [x] T015 [US1] Add Swagger JSDoc documentation — IMPLEMENTED (in application.routes.js)
- [ ] T016 [US1] Create seed script — NOT IMPLEMENTED
- [ ] T017-T019 [US1] Frontend components — NOT IMPLEMENTED (frontend out of scope for backend audit)
- [ ] T020-T021 [US1] Tests — NOT IMPLEMENTED

### Phase 4: User Story 2 (Status Filter)

- [x] T022 [US2] Backend status filtering already supported via Zod validator and repository — IMPLEMENTED
- [ ] T023-T026 [US2] Frontend — NOT IMPLEMENTED

### Phase 5: Polish

- [ ] T027-T034 — NOT IMPLEMENTED

---

## Remaining Work

The following are still needed to complete this feature:
1. Integration tests for all GET-list scenarios
2. Seed script for local testing
3. Route registration verification in app.js
4. Frontend components (if within project scope)
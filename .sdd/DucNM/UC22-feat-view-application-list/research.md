# Research Questions: View Application List (UC22)

**Feature**: View Application List  
**Date**: 2026-06-29  
**Phase**: Phase 0 - Technical Research  
**Status**: RESEARCH COMPLETE — Some decisions superseded by implementation

---

## RQ1: Organization Ownership Validation Strategy

### Decision: **Option B (Pre-check event ownership) — ACTUAL IMPLEMENTATION**

**Research Decision (Option A)**: Dùng Prisma nested where JOIN cho performance.

**Actual Implementation (Option B)**: Pre-check event ownership trước khi query applications:
```javascript
// Step 1: Validate event exists + ownership
const event = await eventRepository.findById(eventId);
if (!event) throw new ServiceError('Event not found', 404, 'RESOURCE_NOT_FOUND');
if (event.createdBy !== currentUser.user_id) throw new ServiceError('...', 403, 'FORBIDDEN');

// Step 2: Query applications
const [applications, total] = await Promise.all([
  applicationRepository.findByEventId(eventId, { skip, take, status }),
  applicationRepository.countByEventId(eventId, status)
]);
```

**Reason for divergence**: The actual implementation uses `createdBy` (event creator) rather than `organization_id` because the current Prisma schema (v3.0 reduced scope) has no Organization model. The Event model has `createdBy` (Int) referencing the User who created it. Ownership validation checks `event.createdBy !== currentUser.user_id`.

**Key differences from research**:
- Uses `createdBy` instead of `organization_id`
- Uses 2 queries (event lookup + application query) instead of single JOIN
- No `is_active` check on Event (not implemented in service)

---

## RQ2: Pagination Implementation Pattern

### Decision: **Option A (Offset-based) — MATCHES IMPLEMENTATION**

**Research Decision**: Offset-based pagination.

**Actual Implementation**: Offset-based pagination via `parsePagination()` utility:
```javascript
const { skip, take, page, limit } = parsePagination(query);
```
Returns pagination metadata: `{ page, limit, total, totalPages }`.

**Status**: ✅ Decision matches implementation.

---

## RQ3: Sensitive Data Filtering Strategy

### Decision: **Option A (Prisma select) — MATCHES IMPLEMENTATION**

**Research Decision**: Prisma `select` chỉ lấy safe fields.

**Actual Implementation**: Repository uses Prisma `select` to only fetch safe fields:
```javascript
submittedByUser: {
  select: {
    id: true,
    fullName: true,
    avatarUrl: true
  }
}
```

**Status**: ✅ Decision matches implementation.

---

## RQ4: Status Filter Query Optimization

### Decision: **Option A (Single WHERE clause) — MATCHES IMPLEMENTATION**

**Research Decision**: Single query với `WHERE status = ?`.

**Actual Implementation**: Repository applies status filter via Prisma where clause:
```javascript
if (status) {
  where.status = status.toUpperCase();
}
```

**Note**: The research references status values `SUBMITTED`, `APPROVED`, `REJECTED`. The actual enum uses `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`. The validator accepts lowercase: `pending`, `approved`, `rejected`, `cancelled`.

**Status**: ✅ Decision matches implementation (with corrected enum values).

---

## RQ5: Frontend State Management

### Decision: **Option A (URL Query Params) — NOT VERIFIED**

**Research Decision**: URL query params for filter state.

**Actual Implementation**: Not verified (frontend not in scope of this audit).

**Status**: ❓ Not verified.

---

## Summary of Decision Status

| Research Question | Research Decision | Actual Implementation | Status |
|-------------------|-------------------|----------------------|--------|
| RQ1: Ownership Validation | Option A (Prisma JOIN) | Option B (Pre-check event creator) | ⚠️ SUPERSEDED |
| RQ2: Pagination | Option A (Offset-based) | Option A (Offset-based) | ✅ MATCHES |
| RQ3: Sensitive Data | Option A (Prisma select) | Option A (Prisma select) | ✅ MATCHES |
| RQ4: Status Filter | Option A (Single WHERE) | Option A (Single WHERE) | ✅ MATCHES |
| RQ5: Frontend State | Option A (URL params) | Not verified | ❓ UNKNOWN |

---

**Research Phase Complete** ✅  
**Last Updated**: 2026-07-28
# Research Document: Approve Application (UC24)

**Branch**: `024-feat-approve-application` | **Date**: 2026-06-29 | **Phase**: 0 (Research)
**Status**: RESEARCH COMPLETE — Some decisions superseded by implementation

---

## RQ1: Transaction Strategy - Email Trigger Placement

### Research Decision: Option C - Transactional Outbox Pattern

### Actual Implementation: Not implemented

Email notification was marked as out of scope in CONTEXT.md: "Không có email thông báo trong v1 (sẽ tích hợp sau)."

**Status**: ❌ NOT IMPLEMENTED (deferred)

---

## RQ2: Capacity Enforcement Strategy

### Research Decision: Option C - Overflow Bucket với 20% Buffer

### Actual Implementation: Option A - Hard Block

The actual code implements a hard block:
```javascript
if (application.event.approvedParticipants >= application.event.maxCapacity) {
  throw new ServiceError(
    'Event is at full capacity. Cannot approve more applications.',
    409,
    'CAPACITY_EXCEEDED'
  );
}
```

**Reason for divergence**: AGENTS.md §3.1 mandates "TUYỆT ĐỐI KHÔNG duyệt đơn vượt quá số lượng cho phép" — hard block is the correct and only allowed behavior.

**Status**: ⚠️ SUPERSEDED (research proposed buffer, actual is hard block per AGENTS.md)

---

## RQ3: Bulk Approve Transaction Isolation

### Research Decision: Option B - Multiple Independent Transactions

### Actual Implementation: Not implemented

Bulk approve was marked as out of scope in CONTEXT.md: "Không có bulk approve trong v1."

**Status**: ❌ NOT IMPLEMENTED (deferred)

---

## RQ4: Optimistic Concurrency Control

### Research Decision: Option C - Status-based Idempotency

### Actual Implementation: Option B - Pre-check with explicit status validation

The actual implementation uses `validatePendingApplication()` which checks:
1. Application exists (404 if not)
2. Event creator ownership (403 if not)
3. Status is PENDING (409 if not)

Then the update uses a direct Prisma update (not updateMany with WHERE clause). Since there's no explicit WHERE status check in the update query, the concurrency control relies on the pre-check being executed within the same request context.

**Status**: ⚠️ PARTIALLY MATCHES (research proposed `updateMany` with status WHERE clause, actual uses `validatePendingApplication` pre-check + `prisma.application.update`)

---

## RQ5: Email Service Integration Pattern

### Research Decision: Database Queue + Cron Worker (10s interval)

### Actual Implementation: Not implemented

**Status**: ❌ NOT IMPLEMENTED (deferred)

---

## RQ6: Frontend State Management - Bulk Approve

### Research Decision: Local useState + Material UI DataGrid

### Actual Implementation: Not verified (frontend out of scope)

**Status**: ❓ UNKNOWN

---

## Summary of Decision Status

| Research Question | Research Decision | Actual Implementation | Status |
|-------------------|-------------------|----------------------|--------|
| RQ1: Email Transaction | Transactional Outbox | NOT implemented | ❌ NOT DONE |
| RQ2: Capacity | 20% Buffer (Option C) | Hard Block (Option A) | ⚠️ SUPERSEDED |
| RQ3: Bulk Transaction | Multiple transactions | NOT implemented | ❌ NOT DONE |
| RQ4: Concurrency | Status-based WHERE | Pre-check + direct update | ⚠️ PARTIAL |
| RQ5: Email Integration | DB Queue + Cron | NOT implemented | ❌ NOT DONE |
| RQ6: Frontend State | Local useState | Not verified | ❓ UNKNOWN |

---

**Last Updated**: 2026-07-28
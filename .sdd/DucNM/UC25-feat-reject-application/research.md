# Research Document: Reject Application (UC25)

**Branch**: `025-feat-reject-application` | **Date**: 2026-06-29 | **Phase**: 0 (Research)
**Status**: RESEARCH COMPLETE — Some decisions superseded by implementation

---

## RQ1: Rejection Reason Validation Strategy

### Research Decision: Option A - Optional, max 500 chars

### Actual Implementation: Required, min 10, max 2000 chars

The actual Zod validator enforces:
```javascript
export const rejectApplicationSchema = z.object({
  message: z.string().trim().min(10, 'Lý do từ chối phải có ít nhất 10 ký tự').max(2000, 'Lý do từ chối không được vượt quá 2000 ký tự')
});
```

**Reason for divergence**: The actual implementation uses the `message` field (not `rejection_reason`) and requires it (not optional). The field name `message` matches the Prisma schema. The min 10 requirement ensures meaningful rejection reasons.

**Status**: ⚠️ SUPERSEDED (research proposed optional 500 chars, actual is required 10-2000 chars via `message` field)

---

## RQ2: Email Notification Content Strategy

### Research Decision: Reuse UC24 email worker, add 'REJECTION_NOTIFICATION' type

### Actual Implementation: Not implemented

Email notification was marked as out of scope in CONTEXT.md: "Không có email thông báo trong v1."

**Status**: ❌ NOT IMPLEMENTED (deferred)

---

## RQ3: Bulk Reject Transaction Strategy

### Research Decision: Multiple Independent Transactions (reuse UC24 pattern)

### Actual Implementation: Not implemented

Bulk reject was marked as out of scope in CONTEXT.md: "Không có bulk reject trong v1."

**Status**: ❌ NOT IMPLEMENTED (deferred)

---

## RQ4: Frontend Reject Reason Input Pattern

### Research Decision: Dropdown + Custom text (Autocomplete pattern)

### Actual Implementation: Not verified (frontend out of scope)

**Status**: ❓ UNKNOWN

---

## Summary of Decision Status

| Research Question | Research Decision | Actual Implementation | Status |
|-------------------|-------------------|----------------------|--------|
| RQ1: Rejection Reason | Optional, max 500 chars | Required, min 10, max 2000 via `message` | ⚠️ SUPERSEDED |
| RQ2: Email Notification | Reuse UC24 worker | NOT implemented | ❌ NOT DONE |
| RQ3: Bulk Transaction | Multiple transactions | NOT implemented | ❌ NOT DONE |
| RQ4: Frontend Input | Autocomplete pattern | Not verified | ❓ UNKNOWN |

---

**Last Updated**: 2026-07-28
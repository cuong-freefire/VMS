# Data Model: Edit Event (UC16)

**Date**: 2026-06-29 | **Updated**: 2026-07-18  
**Feature**: Edit Event  
**Status**: REVIEWED

**Consistency Check**: Aligned with Prisma schema v3.0. No new database fields needed.

---

## 1. Core Entity: Event (EXISTING)

**Table**: `events`  
**Owner**: DucNM  
**Purpose**: Sự kiện tình nguyện với update capability

**All fields reference the existing Prisma schema** — no new fields needed. UC16 does NOT add `updated_by`, `deleted_at`, or `event_audit_log` table.

**Business Rules** (UC16-specific):

1. **Immutable Fields**: `id`, `createdBy`, `status`, `isActive`, `createdAt`, `updatedAt` — CANNOT be changed by client
2. **Status-Based Edit Rules**:
   - `DRAFT`: All editable fields allowed
   - `PENDING_APPROVAL`: All editable fields allowed (resubmission)
   - `PUBLISHED`: Safe fields only; critical fields → PENDING_APPROVAL
   - `IN_PROGRESS`/`COMPLETED`/`CANCELLED`: No edits allowed (409)
3. **Field Classification**:
   - **SAFE** (update directly): `description`, `imageUrl`
   - **CONDITIONAL** (validate): `maxCapacity` (>= `approvedParticipants`), `applicationDeadline` (> now, < startDate)
   - **CRITICAL** (reset status to `PENDING_APPROVAL`): `title`, `location`, `startDate`, `endDate`, `categoryId`
   - **READ ONLY**: `id`, `approvedParticipants`, `createdBy`, `approvedBy`, `approvedAt`, `rejectedBy`, `rejectedAt`, `rejectedReason`, `status`, `isActive`, `createdAt`, `updatedAt`
4. **Soft Delete**: Set `isActive = false` (not part of UC16; see UC17)

---

## 2. State Transition Rules

### Edit Permissions by Status

| Status | Can Edit? | Notes |
|--------|-----------|-------|
| `DRAFT` | ✅ YES | All editable fields allowed |
| `PENDING_APPROVAL` | ✅ YES | Edit critical fields → stays PENDING_APPROVAL |
| `PUBLISHED` | ⚠️ LIMITED | Safe/conditional only; critical fields → PENDING_APPROVAL |
| `IN_PROGRESS` | ❌ NO | 409 Conflict |
| `COMPLETED` | ❌ NO | 409 Conflict |
| `CANCELLED` | ❌ NO | 409 Conflict |
| `REJECTED` | ✅ YES | Edit → resubmit → PENDING_APPROVAL |

---

## 3. Validation Rules (Zod Schema)

```javascript
export const updateEventSchema = z.object({
  title: z.string().min(10).max(500).optional(),
  description: z.string().min(50).max(5000).optional(),
  location: z.string().min(5).max(500).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  applicationDeadline: z.string().datetime().optional(),
  maxCapacity: z.number().int().min(1).optional(),
  categoryId: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional().nullable()
}).strict() // Reject unknown fields
```

---

## 4. Service Layer Logic

### Critical field detection
```javascript
const CRITICAL_FIELDS = ['title', 'location', 'startDate', 'endDate', 'categoryId'];
const hasCriticalChanges = CRITICAL_FIELDS.some(field => updateData[field] !== undefined);

// If any critical field changed AND event is PUBLISHED → reset to PENDING_APPROVAL
if (hasCriticalChanges && event.status === 'PUBLISHED') {
  updateData.status = 'PENDING_APPROVAL';
}
```

### Capacity validation
```javascript
if (updateData.maxCapacity !== undefined && updateData.maxCapacity < event.approvedParticipants) {
  throw new ServiceError('Cannot reduce max_capacity below approved_participants', 409, 'INVALID_CAPACITY');
}
```

---

**Version**: 2.0  
**Status**: REVIEWED  
**Last Updated**: 2026-07-18
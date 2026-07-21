# Data Model: Delete Event (UC17)

**Date**: 2026-06-29 | **Updated**: 2026-07-18  
**Feature**: Delete Event  
**Status**: REVIEWED

**Consistency Check**: Aligned with Prisma schema v3.0. The existing schema already supports soft delete via `isActive`. No new fields or tables needed.

---

## 1. Core Entity: Event (EXISTING)

**Table**: `events`  
**Owner**: DucNM

**Soft Delete Mechanism**: Set `isActive = false` (existing field, default `true`).

**Business Rules**:
1. **Soft Delete Only**: Set `isActive = false`, NEVER hard delete
2. **Status-Based Delete Rules**:
   - `DRAFT`: Can delete (no confirmation needed)
   - `PUBLISHED`: Can delete if no applications exist
   - `IN_PROGRESS`/`COMPLETED`: Cannot delete (409)
   - `PENDING_APPROVAL`/`REJECTED`/`CANCELLED`: Can delete if no applications exist
3. **Application Constraint**: Cannot delete if `application_count > 0`

---

## 2. Delete Permission Matrix

| Status | Can Delete? | Application Check Required? |
|--------|-------------|----------------------------|
| `DRAFT` | ✅ YES | ✅ (must be 0) |
| `PENDING_APPROVAL` | ✅ YES | ✅ (must be 0) |
| `PUBLISHED` | ✅ YES | ✅ (must be 0) |
| `REJECTED` | ✅ YES | ✅ (must be 0) |
| `IN_PROGRESS` | ❌ NO | N/A |
| `COMPLETED` | ❌ NO | N/A |
| `CANCELLED` | ✅ YES | ✅ (must be 0) |

---

## 3. Ownership Validation

```javascript
// Staff can only delete events they created
if (event.createdBy !== currentUser.user_id) {
  throw new ServiceError('Forbidden', 403, 'FORBIDDEN');
}
```

---

## 4. Error Response Format (theo response.util.js)

```json
{
  "success": false,
  "message": "Cannot delete event with existing applications.",
  "code": "EVENT_HAS_APPLICATIONS",
  "details": null
}
```

---

**Version**: 2.0  
**Status**: REVIEWED  
**Last Updated**: 2026-07-18
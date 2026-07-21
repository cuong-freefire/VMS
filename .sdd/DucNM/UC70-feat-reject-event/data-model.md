# Data Model: Reject Event (UC70)

**Phase**: 1 — Design & Contracts
**Date**: 2026-07-06 | **Updated**: 2026-07-18
**Status**: REVIEWED

**Consistency Check**: Aligned with Prisma schema v3.0.

---

## 1. Entity: Event (Reject)

### Fields (per Prisma schema)

| Field | Type | Description | Constraints |
|-------|------|-------------|------------|
| `id` | Integer (PK) | ID duy nhất của sự kiện | Primary key |
| `title` | String | Tên sự kiện | NOT NULL |
| `status` | Enum | PENDING_APPROVAL, REJECTED, ... | NOT NULL |
| `rejectedBy` | Integer (FK, nullable) | ID người từ chối | FK → User |
| `rejectedAt` | DateTime (nullable) | Thời điểm từ chối | Auto-set |
| `rejectedReason` | String (nullable) | Lý do từ chối | TEXT |

### Status Transition

```
PENDING_APPROVAL → REJECTED (via UC70)
```

After rejection, Staff can edit and resubmit → status returns to `PENDING_APPROVAL`.

### Validation Rules

| Rule | Error Code | HTTP Status |
|------|------------|-------------|
| Event ID không tồn tại | `EVENT_NOT_FOUND` | 404 |
| Event status không phải PENDING_APPROVAL | `INVALID_STATUS` | 409 |
| Rejection reason thiếu hoặc quá ngắn | `VALIDATION_ERROR` | 400 |

---

**Version**: 2.0
**Status**: REVIEWED
**Last Updated**: 2026-07-18
# Data Model: Approve Event (UC69)

**Phase**: 1 — Design & Contracts
**Date**: 2026-07-06 | **Updated**: 2026-07-18
**Status**: REVIEWED

**Consistency Check**: Aligned with Prisma schema v3.0 and existing backend implementation (event.service.js).

---

## 1. Entity: Event (Approve)

### Fields (per Prisma schema)

| Field | Type | Description | Constraints |
|-------|------|-------------|------------|
| `id` | Integer (PK) | ID duy nhất của sự kiện | Primary key |
| `title` | String | Tên sự kiện | NOT NULL |
| `status` | Enum | PENDING_APPROVAL, PUBLISHED, ... | NOT NULL |
| `approvedBy` | Integer (FK, nullable) | ID người phê duyệt | FK → User |
| `approvedAt` | DateTime (nullable) | Thời điểm phê duyệt | Auto-set |

### Status Transition

```
PENDING_APPROVAL → PUBLISHED (via UC69)
```

### Validation Rules

| Rule | Error Code | HTTP Status |
|------|------------|-------------|
| Event ID không tồn tại | `EVENT_NOT_FOUND` | 404 |
| Event status không phải PENDING_APPROVAL | `INVALID_STATUS` | 409 |

---

## 2. API

### Request
```
PATCH /api/v1/events/:id/approve
```
Không có request body.

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Phê duyệt sự kiện thành công",
  "data": {
    "event_id": 1,
    "title": "Dọn dẹp bãi biển",
    "status": "published",
    "approved_by": 3,
    "approved_at": "2026-07-06T12:00:00.000Z"
  }
}
```

**Note**: Response format follows `event.service.js` `formatApprovedEvent()` — returns `approved_by` as integer (user_id), not nested object.

### Error Responses (theo response.util.js)

```json
{
  "success": false,
  "message": "Event is not in PENDING_APPROVAL status.",
  "code": "INVALID_STATUS",
  "details": null
}
```

---

## 3. Existing Backend Behavior (Verified)

Current `event.service.js` `approveEvent()`:
- Updates `status = 'PUBLISHED'`
- Sets `approvedBy = currentUser.user_id`
- Sets `approvedAt = new Date()`
- Does NOT clear `rejectedBy`, `rejectedAt`, `rejectedReason`

---

**Version**: 2.0
**Status**: REVIEWED
**Last Updated**: 2026-07-18
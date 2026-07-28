# Data Model: Approve Application (UC24)

**Branch**: `024-feat-approve-application` | **Date**: 2026-06-29 | **Phase**: 1 (Design)
**Status**: DESIGN COMPLETE — Updated to match actual Prisma schema v3.0

---

## Overview

UC24 requires no database schema changes. The existing Application model supports all approve operations.

---

## Application Table (Existing Schema)

```prisma
model Application {
  id          Int               @id @default(autoincrement())
  userId      Int               @map("user_id")
  eventId     Int               @map("event_id")
  status      ApplicationStatus @default(PENDING)
  message     String?           @db.Text
  processedBy Int?              @map("processed_by")
  processedAt DateTime?         @map("processed_at")
  createdAt   DateTime          @default(now()) @map("created_at")
  updatedAt   DateTime          @updatedAt @map("updated_at")

  submittedByUser User  @relation("applicationSubmittedByUser", fields: [userId], references: [id])
  event           Event @relation(fields: [eventId], references: [id])
  processedByUser User? @relation("applicationProcessedByUser", fields: [processedBy], references: [id])

  @@unique([userId, eventId])
  @@index([userId, status])
  @@index([eventId, status])
  @@index([processedBy])
  @@map("applications")
}

enum ApplicationStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

**Key Fields for UC24**:
- `status`: Updated from `PENDING` to `APPROVED`
- `processedBy`: Set to current user's ID
- `processedAt`: Set to current timestamp
- `updatedAt`: Auto-updated by Prisma

**No new fields needed**: The existing `processedBy` and `processedAt` fields serve as both approve and reject timestamps. No separate `approved_at` field exists.

---

## Event Table (Capacity Check)

```prisma
model Event {
  id                   Int         @id @default(autoincrement())
  maxCapacity          Int         @map("max_capacity")
  approvedParticipants Int         @default(0) @map("approved_participants")
  createdBy            Int         @map("created_by")
  // ... other fields
}
```

**Capacity Enforcement** (per AGENTS.md §3.1):
- Hard block: `approvedParticipants >= maxCapacity` → 409 Conflict
- No buffer/overflow allowed
- Increment `approvedParticipants` on successful approve

---

## State Transition Rules

### Valid Transitions for UC24:
```
PENDING → APPROVED  ✅ (Staff approve from pending state)
APPROVED → APPROVED ❌ (409 Conflict - already processed)
REJECTED → APPROVED ❌ (409 Conflict - cannot approve rejected)
CANCELLED → APPROVED ❌ (409 Conflict - cannot approve cancelled)
```

### Enforcement:
```javascript
// In application.service.js - validatePendingApplication()
if (application.status !== 'PENDING') {
  throw new ServiceError(
    `Application in ${application.status} state cannot be processed`,
    409,
    'INVALID_STATUS'
  );
}
```

---

## Capacity Calculation

```javascript
// In application.service.js - approveApplication()
if (application.event.approvedParticipants >= application.event.maxCapacity) {
  throw new ServiceError(
    'Event is at full capacity. Cannot approve more applications.',
    409,
    'CAPACITY_EXCEEDED'
  );
}
```

**Business Rule**: Hard block at `approvedParticipants >= maxCapacity`. No buffer. No exceptions.

---

## Database Indexes

Existing indexes used by UC24:
- `applications(event_id, status)` — For finding application by event + status
- `applications(processed_by)` — For finding applications processed by a user

No new indexes needed.

---

## Data Migration Checklist

- [x] No schema changes required
- [x] Existing `processedBy` and `processedAt` fields used for approve tracking
- [x] Existing `status` enum includes `APPROVED`

---

**Data Model Complete** ✅  
**Last Updated**: 2026-07-28
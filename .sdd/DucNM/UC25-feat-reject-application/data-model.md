# Data Model: Reject Application (UC25)

**Branch**: `025-feat-reject-application` | **Date**: 2026-06-29 | **Phase**: 1 (Design)
**Status**: DESIGN COMPLETE — Updated to match actual Prisma schema v3.0

---

## Overview

UC25 requires no database schema changes. The existing Application model supports all reject operations. The `message` field stores the rejection reason.

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

**Key Fields for UC25**:
- `status`: Updated from `PENDING` to `REJECTED`
- `message`: Stores the rejection reason (required, min 10, max 2000 chars)
- `processedBy`: Set to current user's ID
- `processedAt`: Set to current timestamp
- `updatedAt`: Auto-updated by Prisma

**No new fields needed**: The existing `message` field serves as the rejection reason storage. No separate `rejection_reason` or `rejected_at` field exists.

---

## State Transition Rules

### Valid Transitions for UC25:
```
PENDING → REJECTED  ✅ (Staff reject from pending state)
APPROVED → REJECTED ❌ (409 Conflict - cannot reject approved)
REJECTED → REJECTED ❌ (409 Conflict - already processed)
CANCELLED → REJECTED ❌ (409 Conflict - cannot reject cancelled)
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

## Rejection Reason Validation

```javascript
// Actual Zod schema - application.validator.js
export const rejectApplicationSchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, 'Lý do từ chối phải có ít nhất 10 ký tự')
    .max(2000, 'Lý do từ chối không được vượt quá 2000 ký tự')
});
```

**Validation Rules**:
- `message`: Required string, min 10 characters, max 2000 characters
- Stored in Application.`message` field (Prisma schema has no `rejection_reason` on Application)

---

## Database Indexes

Existing indexes used by UC25:
- `applications(event_id, status)` — For finding application by event + status
- `applications(processed_by)` — For finding applications processed by a user

No new indexes needed.

---

## Data Migration Checklist

- [x] No schema changes required
- [x] Existing `message` field used for rejection reason storage
- [x] Existing `processedBy` and `processedAt` fields used for reject tracking
- [x] Existing `status` enum includes `REJECTED`

---

**Data Model Complete** ✅  
**Last Updated**: 2026-07-28
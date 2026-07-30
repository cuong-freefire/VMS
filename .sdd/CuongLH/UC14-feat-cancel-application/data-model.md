# data-model.md — Phase 1: Data Model for UC14 Cancel Application

**Feature**: UC14-feat-cancel-application
**Date**: 2026-07-21
**Author**: AI Agent (CuongLH)

---

## 1. Entity Relationship Diagram (Text-based)

```
┌──────────────────────────┐
│         Event            │
│──────────────────────────│
│ id              INT (PK) │
│ startDate       DATETIME │
│ status          ENUM     │
│ approvedParticipants INT │
│ isActive        BOOLEAN  │
└──────────┬───────────────┘
           │ 1:N
           │
┌──────────┴───────────────┐
│      Application         │
│──────────────────────────│
│ id          INT (PK) ◄───│─── Target entity for cancel
│ userId      INT (FK)     │
│ eventId     INT (FK)     │
│ status      ENUM         │─── State transition: PENDING|APPROVED → CANCELLED
│ message     TEXT?        │
│ processedBy INT? (FK)    │
│ processedAt DATETIME?    │
│ createdAt   DATETIME     │
│ updatedAt   DATETIME     │
│                           │
│ UNIQUE(userId, eventId)  │
└──────────────────────────┘
```

---

## 2. Entities Involved

### 2.1 Application (Primary - Write)

| Field | Type | Constraint | Cancel Behavior |
|-------|------|------------|-----------------|
| `id` | Int (Auto) | PK | Target identifier |
| `userId` | Int | FK → User.id | Ownership check: `userId === req.user.user_id` |
| `eventId` | Int | FK → Event.id | Used to fetch event for validation |
| `status` | ApplicationStatus | NOT NULL | Transition: `PENDING` → `CANCELLED` or `APPROVED` → `CANCELLED` |
| `message` | Text? | NULLABLE | Unchanged |
| `processedBy` | Int? | FK → User.id | Unchanged |
| `processedAt` | DateTime? | NULLABLE | Unchanged |
| `createdAt` | DateTime | @default(now()) | Unchanged |
| `updatedAt` | DateTime | @updatedAt | Auto-updated |

**Allowed Status Transitions for Cancel:**
```
PENDING   ──► CANCELLED   ✅ (no side effects)
APPROVED  ──► CANCELLED   ✅ (must decrement approvedParticipants)
REJECTED  ──► CANCELLED   ❌ (Rule: cannot re-open rejected application)
CANCELLED ──► CANCELLED   ❌ (idempotent, but rejected - already cancelled)
```

### 2.2 Event (Read + Write Side Effect)

| Field | Type | Write? | Cancel Behavior |
|-------|------|--------|-----------------|
| `id` | Int (Auto) | Read | Lookup event for validation |
| `startDate` | DateTime | Read | **Validation**: `startDate > now` (event chưa bắt đầu) |
| `status` | EventStatus | Read | **Validation**: Must be PUBLISHED or IN_PROGRESS |
| `approvedParticipants` | Int | **Write** | **Decrement by 1** (only when APPROVED → CANCELLED) |
| `isActive` | Boolean | Read | **Validation**: Must be `true` |

---

## 3. Query Patterns

### 3.1 Query 1: Find Application by ID with Event (for validation)

```javascript
// Repository: applicationRepository.findByIdWithEvent(applicationId)
await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
        event: {
            select: {
                id: true,
                startDate: true,
                status: true,
                isActive: true,
                approvedParticipants: true
            }
        }
    }
});
```

**Indexes Used**: `applications.id` — PRIMARY KEY (clustered index)

**Performance**: ~2-5ms, single PK lookup with 1 JOIN.

### 3.2 Query 2: Cancel Application (Transaction)

```javascript
// Repository: applicationRepository.cancel(applicationId, userId, wasApproved)
await prisma.$transaction(async (tx) => {
    // Step 1: Update application status
    await tx.application.update({
        where: { id: applicationId },
        data: { status: 'CANCELLED' }
    });

    // Step 2: If was APPROVED, decrement event approved_participants
    if (wasApproved) {
        await tx.event.update({
            where: { id: eventId },
            data: {
                approvedParticipants: { decrement: 1 }
            }
        });
    }
});
```

**Transaction isolation**: Prisma uses database-level transaction (MySQL InnoDB). Atomic decrement prevents race conditions.

**Performance**: ~10-20ms (2 writes within transaction).

---

## 4. Response DTO

### 4.1 CancelApplicationResponseDTO

```javascript
const CancelApplicationResponseDTO = {
    id: Number,              // Application ID
    userId: Number,          // Volunteer ID
    eventId: Number,         // Event ID
    status: "CANCELLED",     // Always CANCELLED after success
    message: String | null,  // Original message (unchanged)
    createdAt: String,       // ISO 8601
    updatedAt: String,       // ISO 8601 (updated to cancel time)
    event: {
        id: Number,
        approvedParticipants: Number  // Updated count (if was APPROVED)
    }
};
```

### 4.2 API Response Envelope

```javascript
// Success (200)
{
    success: true,
    message: "Đơn đăng ký đã được hủy thành công.",
    data: CancelApplicationResponseDTO
}

// Error (4xx/5xx)
{
    success: false,
    error: {
        code: String,     // 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT' | ...
        message: String   // Human-readable Vietnamese error message
    }
}
```

---

## 5. Data Flow Diagram

```
┌──────────┐   PATCH /api/v1/applications/:id/cancel   ┌──────────────┐
│  Client  │ ──────────────────────────────────────────► │  Express App │
│(Volunteer│                                            │              │
│  only)   │ ◄────────────────────────────────────────── │              │
└──────────┘   JSON Response (CancelApplicationDTO)      └──────┬───────┘
                                                                │
                                                          1. authMiddleware
                                                             (req.user populated)
                                                                │
                                                          2. validate(applicationId)
                                                             (param validation)
                                                                │
                                                          3. applicationController.cancel
                                                                │
                                                     ┌──────────┴──────────┐
                                                     │ ApplicationService  │
                                                     │─────────────────────│
                                                     │ cancelApplication(  │
                                                     │   applicationId,    │
                                                     │   userId)           │
                                                     └────────┬───────────┘
                                                              │
                                                 ┌────────────┼────────────┐
                                                 │            │            │
                                           4a. findById  4b. Validate     │
                                               WithEvent     business      │
                                                 │         rules           │
                                                 │            │            │
                                          ┌──────┴──┐  ┌─────┴──────┐    │
                                          │ App     │  │ Validation │    │
                                          │Repo     │  │ • Ownership│    │
                                          └────┬────┘  │ • Status   │    │
                                               │       │ • Event    │    │
                                               │       │   startDate│    │
                                               │       └─────┬──────┘    │
                                               │             │           │
                                         5. cancel() Transaction         │
                                            ┌──────────────┴──────┐      │
                                            │  prisma.$transaction │      │
                                            │──────────────────────│      │
                                            │ UPDATE application   │      │
                                            │   SET status=CANCELLED│      │
                                            │                      │      │
                                            │ [if APPROVED]        │      │
                                            │ UPDATE event         │      │
                                            │   SET approved_      │      │
                                            │   participants -= 1  │      │
                                            └──────────┬───────────┘      │
                                                       │                  │
                                                 ┌─────┴──────┐           │
                                                 │  MySQL DB  │           │
                                                 └────────────┘           │
                                                                          │
                                           6. Return CancelApplicationDTO │
```

---

## 6. Validation Rules

| # | Rule | Layer | Error Code |
|---|------|-------|------------|
| 1 | `applicationId` must be positive integer | Validator (Zod) | VALIDATION_ERROR |
| 2 | Application must exist | Service | NOT_FOUND |
| 3 | `application.userId === req.user.user_id` | Service | FORBIDDEN |
| 4 | `application.status` in [PENDING, APPROVED] | Service | CONFLICT |
| 5 | `event.isActive === true` | Service | CONFLICT |
| 6 | `event.startDate > now` | Service | CONFLICT |
| 7 | `event.status` in [PUBLISHED, IN_PROGRESS] | Service | CONFLICT |
| 8 | `event.approvedParticipants > 0` (if APPROVED) | Service | INTERNAL_ERROR |

---

## 7. State Transition Diagram

```
                    ┌──────────┐
                    │ PENDING  │
                    └────┬─────┘
                         │ cancel()
                         ▼
                    ┌──────────┐
                    │CANCELLED │  (terminal state)
                    └──────────┘

                    ┌──────────┐
                    │ APPROVED │
                    └────┬─────┘
                         │ cancel() + decrement approvedParticipants
                         ▼
                    ┌──────────┐
                    │CANCELLED │  (terminal state)
                    └──────────┘

                    ┌──────────┐
                    │ REJECTED │───► ❌ Cannot cancel
                    └──────────┘

                    ┌──────────┐
                    │CANCELLED │───► ❌ Already cancelled (idempotent rejected)
                    └──────────┘
```

---

## 8. Caching Considerations

Không cần cache cho UC14 vì:
1. Đây là write operation (PATCH) — không benefit từ cache
2. `approvedParticipants` được update atomic qua transaction — không cần invalidate cache
3. Nếu tương lai có cache cho Event detail, cần invalidate cache key `event:{id}` sau khi decrement

---

## Summary

UC14 chỉ thao tác trên 2 entities: **Application** (primary - state transition) và **Event** (side effect - decrement counter). Data flow từ Controller → Service → Repository với 1 read query + 1 transaction (2 writes). Validation tập trung ở Service layer với 8 rules bảo vệ Domain Rules.

**END OF DATA-MODEL.md**
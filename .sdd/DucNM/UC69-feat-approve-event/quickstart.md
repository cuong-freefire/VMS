# Quickstart: Approve Event (UC69)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-06

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- **UC67/UC68 infrastructure available**: Event model, event.repository.js, event.service.js, event.controller.js, event.routes.js, eventApi.js
- User model (for approved_by reference)
- authorize middleware working (from UC26)
- Backend server running on port 5000

## Database

### 1. Update Prisma Schema (`backend/prisma/schema.prisma`)

Thêm 2 fields `approved_by` và `approved_at` vào Event model:

```prisma
model Event {
  event_id        Int      @id @default(autoincrement())
  title           String   @db.VarChar(255)
  description     String?  @db.Text
  organization_id Int
  status          String   @default("PENDING") @db.VarChar(50)
  approved_by     Int?                          // NEW: FK to User
  approved_at     DateTime?                     // NEW: approval timestamp
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  organization Organization @relation(fields: [organization_id], references: [organization_id])
  approver      User?       @relation(fields: [approved_by], references: [user_id])

  @@map("events")
}
```

Chạy migration:

```bash
npx prisma migrate dev --name add_approved_fields
npx prisma generate
```

## Backend Implementation Order

### 1. Add Repository Method (`backend/src/repositories/event.repository.js`)

Thêm vào file đã có từ UC67/UC68:

```javascript
export async function updateEventStatus(eventId, data) {
  return prisma.event.update({
    where: { event_id: eventId },
    data,
    include: {
      approver: {
        select: { user_id: true, full_name: true }
      }
    }
  });
}
```

### 2. Add `approveEvent` to Service (`backend/src/services/event.service.js`)

Thêm vào file đã có từ UC67/UC68:

```javascript
import { findEventById, updateEventStatus } from '../repositories/event.repository.js';
import { ServiceError } from '../utils/response.util.js';
import logger from '../config/logger.config.js';

export async function approveEvent(eventId, currentUser) {
  // 1. Validate ID
  const id = Number(eventId);
  if (isNaN(id) || id <= 0) {
    throw new ServiceError('Event ID không hợp lệ', 400, 'INVALID_EVENT_ID');
  }

  // 2. Check event exists
  const event = await findEventById(id);
  if (!event) {
    throw new ServiceError('Event not found.', 404, 'EVENT_NOT_FOUND');
  }

  // 3. Check status is PENDING
  if (event.status !== 'PENDING') {
    throw new ServiceError('Event is not in PENDING status.', 409, 'INVALID_STATUS');
  }

  // 4. Update status to APPROVED
  const updateData = {
    status: 'APPROVED',
    approved_by: currentUser.user_id,
    approved_at: new Date()
  };

  const updatedEvent = await updateEventStatus(id, updateData);

  // 5. Audit log
  logger.info({
    action: 'APPROVE_EVENT',
    eventId: id,
    approvedBy: currentUser.user_id,
    eventTitle: event.title
  });

  return updatedEvent;
}
```

### 3. Add `approveEventHandler` to Controller (`backend/src/controllers/event.controller.js`)

Thêm vào file đã có từ UC67/UC68:

```javascript
import { approveEvent } from '../services/event.service.js';

export async function approveEventHandler(req, res) {
  try {
    const event = await approveEvent(req.params.id, req.user);
    return res.status(200).json(successResponse(event, 'Phê duyệt sự kiện thành công'));
  } catch (error) {
    return res.status(error.status || 500).json(
      errorResponse(
        error.message || 'Có lỗi xảy ra trong quá trình xử lý',
        error.code || 'INTERNAL_SERVER_ERROR',
        error.details
      )
    );
  }
}
```

### 4. Add Route (`backend/src/routes/event.routes.js`)

Thêm route PATCH vào file đã có từ UC67/UC68:

```javascript
import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import authorize from '../middleware/authorize.middleware.js';
import {
  getEventsHandler,
  getEventByIdHandler,
  approveEventHandler
} from '../controllers/event.controller.js';

const router = Router();

// Routes hiện tại
router.get('/', authMiddleware, getEventsHandler);
router.get('/:id', authMiddleware, getEventByIdHandler);

// Route mới cho UC69 — Manager/Admin only
router.patch('/:id/approve', authMiddleware, authorize('MANAGER', 'ADMIN'), approveEventHandler);

export default router;
```

### 5. Tests (`backend/tests/event/event.service.test.js`)

```javascript
// Test cases bổ sung cho UC69:
// 1. approveEvent với Manager (PENDING event) → 200 + status = APPROVED
// 2. approveEvent với Admin (PENDING event) → 200 + status = APPROVED
// 3. approveEvent với event đã APPROVED → throw 409
// 4. approveEvent với event REJECTED → throw 409
// 5. approveEvent với event ONGOING → throw 409
// 6. approveEvent với ID không tồn tại → throw 404
// 7. approveEvent với ID không hợp lệ → throw 400
```

### 6. Integration Tests (`backend/tests/event/event.api.test.js`)

```javascript
// Test cases bổ sung cho UC69:
// 1. PATCH /api/v1/events/1/approve (PENDING) + Manager token → 200
// 2. PATCH /api/v1/events/1/approve (PENDING) + Admin token → 200
// 3. PATCH /api/v1/events/1/approve (APPROVED) + Manager token → 409
// 4. PATCH /api/v1/events/999/approve + Manager token → 404
// 5. PATCH /api/v1/events/1/approve + Staff token → 403
// 6. PATCH /api/v1/events/1/approve + Guest (no token) → 401
```

## Frontend Implementation Order

### 1. Add `approveEvent` to API Client (`frontend/src/api/eventApi.js`)

```javascript
export async function approveEvent(id) {
  const response = await axiosApi.patch(`/events/${id}/approve`);
  return response.data.data;
}
```

### 2. Add Approve Button to PendingEventDetailPage

```jsx
// Trong PendingEventDetailPage.jsx (UC68)
import { approveEvent } from '../../api/eventApi';

const handleApprove = async () => {
  try {
    await approveEvent(id);
    // Refresh event detail
    refetch();
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to approve');
  }
};

// Thêm nút Approve trong JSX:
<Button variant="contained" color="success" onClick={handleApprove} disabled={loading}>
  Approve Event
</Button>
```

## Verification Steps

1. **API**: `PATCH /api/v1/events/1/approve` (PENDING) + Manager token → 200 + status = APPROVED
2. **API**: `PATCH /api/v1/events/1/approve` (APPROVED) + Manager token → 409
3. **API**: `PATCH /api/v1/events/999/approve` + Manager token → 404
4. **API**: `PATCH /api/v1/events/1/approve` + Staff token → 403
5. **API**: `PATCH /api/v1/events/1/approve` + Guest (no token) → 401
6. **Database**: Verify approved_by và approved_at được ghi nhận
7. **Frontend**: Click Approve button → event chuyển sang APPROVED
# Quickstart: Reject Event (UC70)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-06

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- **UC67/UC68/UC69 infrastructure available**: Event model, event.repository.js, event.service.js, event.controller.js, event.routes.js, eventApi.js, event.validator.js
- User model (for rejected_by reference)
- authorize middleware working (from UC26)
- Backend server running on port 5000

## Database

### 1. Update Prisma Schema (`backend/prisma/schema.prisma`)

Thêm 3 fields `rejection_reason`, `rejected_by` và `rejected_at` vào Event model:

```prisma
model Event {
  event_id          Int      @id @default(autoincrement())
  title             String   @db.VarChar(255)
  description       String?  @db.Text
  organization_id   Int
  status            String   @default("PENDING") @db.VarChar(50)
  approved_by       Int?
  approved_at       DateTime?
  rejection_reason  String?  @db.Text              // NEW: reason for rejection
  rejected_by       Int?                           // NEW: FK to User (who rejected)
  rejected_at       DateTime?                      // NEW: rejection timestamp
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  organization Organization @relation(fields: [organization_id], references: [organization_id])
  approver      User?       @relation(fields: [approved_by], references: [user_id])
  rejecter      User?       @relation(fields: [rejected_by], references: [user_id])  // NEW

  @@map("events")
}
```

Chạy migration:

```bash
npx prisma migrate dev --name add_rejection_fields
npx prisma generate
```

## Backend Implementation Order

### 1. Add Zod Schema (`backend/src/validators/event.validator.js`)

Thêm rejectEventSchema vào file đã có từ UC67:

```javascript
import { z } from 'zod';

// Schema hiện có
export const getEventsQuerySchema = z.object({ ... });

// Schema mới cho UC70
export const rejectEventSchema = z.object({
  rejection_reason: z.string().min(10, 'Rejection reason must be at least 10 characters')
});
```

### 2. Add `rejectEvent` to Service (`backend/src/services/event.service.js`)

Thêm vào file đã có từ UC67/UC68/UC69:

```javascript
import { rejectEventSchema } from '../validators/event.validator.js';
import { findEventById, updateEventStatus } from '../repositories/event.repository.js';
import { ServiceError } from '../utils/response.util.js';
import logger from '../config/logger.config.js';

export async function rejectEvent(eventId, data, currentUser) {
  // 1. Validate ID
  const id = Number(eventId);
  if (isNaN(id) || id <= 0) {
    throw new ServiceError('Event ID không hợp lệ', 400, 'INVALID_EVENT_ID');
  }

  // 2. Validate input
  const parsed = rejectEventSchema.safeParse(data);
  if (!parsed.success) {
    const details = parsed.error.errors.map(err => ({
      field: err.path[0],
      message: err.message
    }));
    throw new ServiceError('Dữ liệu đầu vào không hợp lệ', 400, 'VALIDATION_ERROR', details);
  }

  const { rejection_reason } = parsed.data;

  // 3. Check event exists
  const event = await findEventById(id);
  if (!event) {
    throw new ServiceError('Event not found.', 404, 'EVENT_NOT_FOUND');
  }

  // 4. Check status is PENDING
  if (event.status !== 'PENDING') {
    throw new ServiceError('Event is not in PENDING status.', 409, 'INVALID_STATUS');
  }

  // 5. Update status to REJECTED
  const updateData = {
    status: 'REJECTED',
    rejection_reason,
    rejected_by: currentUser.user_id,
    rejected_at: new Date()
  };

  const updatedEvent = await updateEventStatus(id, updateData);

  // 6. Audit log
  logger.info({
    action: 'REJECT_EVENT',
    eventId: id,
    rejectedBy: currentUser.user_id,
    reason: rejection_reason
  });

  return updatedEvent;
}
```

### 3. Add `rejectEventHandler` to Controller (`backend/src/controllers/event.controller.js`)

Thêm vào file đã có từ UC67/UC68/UC69:

```javascript
import { rejectEvent } from '../services/event.service.js';

export async function rejectEventHandler(req, res) {
  try {
    const event = await rejectEvent(req.params.id, req.body, req.user);
    return res.status(200).json(successResponse(event, 'Từ chối sự kiện thành công'));
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

Thêm route PATCH vào file đã có từ UC67/UC68/UC69:

```javascript
import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import authorize from '../middleware/authorize.middleware.js';
import {
  getEventsHandler,
  getEventByIdHandler,
  approveEventHandler,
  rejectEventHandler
} from '../controllers/event.controller.js';

const router = Router();

// Routes hiện tại
router.get('/', authMiddleware, getEventsHandler);
router.get('/:id', authMiddleware, getEventByIdHandler);
router.patch('/:id/approve', authMiddleware, authorize('MANAGER', 'ADMIN'), approveEventHandler);

// Route mới cho UC70 — Manager/Admin only
router.patch('/:id/reject', authMiddleware, authorize('MANAGER', 'ADMIN'), rejectEventHandler);

export default router;
```

### 5. Tests (`backend/tests/event/event.service.test.js`)

```javascript
// Test cases bổ sung cho UC70:
// 1. rejectEvent với Manager (PENDING) → 200 + status = REJECTED
// 2. rejectEvent với Admin (PENDING) → 200 + status = REJECTED
// 3. rejectEvent với event đã APPROVED → throw 409
// 4. rejectEvent với event đã REJECTED → throw 409
// 5. rejectEvent với event ONGOING → throw 409
// 6. rejectEvent với ID không tồn tại → throw 404
// 7. rejectEvent với ID không hợp lệ → throw 400
// 8. rejectEvent với rejection_reason < 10 ký tự → throw 400
```

### 6. Integration Tests (`backend/tests/event/event.api.test.js`)

```javascript
// Test cases bổ sung cho UC70:
// 1. PATCH /api/v1/events/1/reject (PENDING) + Manager token → 200
// 2. PATCH /api/v1/events/1/reject (APPROVED) + Manager token → 409
// 3. PATCH /api/v1/events/999/reject + Manager token → 404
// 4. PATCH /api/v1/events/1/reject + body rỗng → 400
// 5. PATCH /api/v1/events/1/reject + Staff token → 403
// 6. PATCH /api/v1/events/1/reject + Guest (no token) → 401
```

## Frontend Implementation Order

### 1. Add `rejectEvent` to API Client (`frontend/src/api/eventApi.js`)

```javascript
export async function rejectEvent(id, data) {
  const response = await axiosApi.patch(`/events/${id}/reject`, data);
  return response.data.data;
}
```

### 2. Add Reject Dialog to PendingEventDetailPage

```jsx
// Trong PendingEventDetailPage.jsx (UC68)
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import { rejectEvent } from '../../api/eventApi';

// State
const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
const [rejectionReason, setRejectionReason] = useState('');

// Handler
const handleReject = async () => {
  try {
    await rejectEvent(id, { rejection_reason: rejectionReason });
    setRejectDialogOpen(false);
    refetch(); // Refresh event detail
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to reject');
  }
};

// Reject Dialog
<Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
  <DialogTitle>Reject Event</DialogTitle>
  <DialogContent>
    <TextField
      label="Rejection Reason"
      multiline
      rows={4}
      fullWidth
      value={rejectionReason}
      onChange={(e) => setRejectionReason(e.target.value)}
      error={rejectionReason.length > 0 && rejectionReason.length < 10}
      helperText={rejectionReason.length > 0 && rejectionReason.length < 10 ? 'At least 10 characters' : ''}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
    <Button onClick={handleReject} color="error" variant="contained"
      disabled={rejectionReason.length < 10}>
      Reject
    </Button>
  </DialogActions>
</Dialog>

// Trigger button
<Button variant="contained" color="error" onClick={() => setRejectDialogOpen(true)}>
  Reject Event
</Button>
```

## Verification Steps

1. **API**: `PATCH /api/v1/events/1/reject` (PENDING) + Manager token → 200 + status = REJECTED
2. **API**: `PATCH /api/v1/events/1/reject` (APPROVED) + Manager token → 409
3. **API**: `PATCH /api/v1/events/999/reject` + Manager token → 404
4. **API**: `PATCH /api/v1/events/1/reject` + body rỗng → 400
5. **API**: `PATCH /api/v1/events/1/reject` + Staff token → 403
6. **API**: `PATCH /api/v1/events/1/reject` + Guest (no token) → 401
7. **Database**: Verify rejection_reason, rejected_by, rejected_at được ghi nhận
8. **Frontend**: Open Reject dialog → enter reason → submit → event chuyển sang REJECTED
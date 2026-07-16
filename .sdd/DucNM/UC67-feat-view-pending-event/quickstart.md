# Quickstart: View Pending Event (UC67)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-04

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- Prisma CLI installed
- Event model with `status` field in Prisma schema
- Organization model with relationship to Event
- authorize middleware working (from UC26)
- Backend server running on port 5000

## Database

### 1. Prisma Schema (`backend/prisma/schema.prisma`)

Thêm model Event (nếu chưa có):

```prisma
model Event {
  event_id        Int      @id @default(autoincrement())
  title           String   @db.VarChar(255)
  description     String?  @db.Text
  organization_id Int
  status          String   @default("PENDING") @db.VarChar(50)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  organization Organization @relation(fields: [organization_id], references: [organization_id])

  @@map("events")
}
```

Chạy migration:

```bash
npx prisma migrate dev --name add_event_model
npx prisma generate
```

## Backend Implementation Order

### 1. Zod Validator (`backend/src/validators/event.validator.js`)

```javascript
import { z } from 'zod';

export const getEventsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'approved', 'rejected', 'ongoing', 'completed']).optional()
});
```

### 2. Repository (`backend/src/repositories/event.repository.js`)

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function findEvents({ skip, take, where }) {
  const [events, total] = await Promise.all([
    prisma.event.findMany({
      skip,
      take,
      where,
      orderBy: { created_at: 'desc' },
      include: {
        organization: {
          select: { organization_id: true, name: true }
        }
      }
    }),
    prisma.event.count({ where })
  ]);
  return { events, total };
}
```

### 3. Service (`backend/src/services/event.service.js`)

```javascript
import { getEventsQuerySchema } from '../validators/event.validator.js';
import { findEvents } from '../repositories/event.repository.js';
import { ServiceError } from '../utils/response.util.js';

export async function getEvents(query, currentUser) {
  const parsed = getEventsQuerySchema.safeParse(query);
  if (!parsed.success) {
    const field = parsed.error.errors[0].path[0];
    throw new ServiceError(
      `Tham số ${field} không hợp lệ`,
      400,
      `INVALID_${String(field).toUpperCase()}`
    );
  }

  const { page, limit, status } = parsed.data;
  const skip = (page - 1) * limit;

  // Build where clause
  const where = { AND: [] };

  // Role-based visibility for PENDING status
  if (status === 'pending') {
    const role = currentUser?.role || currentUser?.role_name;
    if (role !== 'MANAGER' && role !== 'ADMIN') {
      throw new ServiceError('Bạn không có quyền truy cập tài nguyên này', 403, 'FORBIDDEN');
    }
    where.AND.push({ status: 'PENDING' });
  } else if (status) {
    // Other status filters (approved, rejected, etc.)
    where.AND.push({ status: status.toUpperCase() });
  } else {
    // Default: Guest/Volunteer/Staff only see APPROVED
    // Manager/Admin see all
    const role = currentUser?.role || currentUser?.role_name;
    if (!role || (role !== 'MANAGER' && role !== 'ADMIN')) {
      where.AND.push({ status: 'APPROVED' });
    }
  }

  if (where.AND.length === 0) delete where.AND;

  const { events, total } = await findEvents({ skip, take: limit, where });

  return {
    events,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 }
  };
}
```

### 4. Controller (`backend/src/controllers/event.controller.js`)

```javascript
import { getEvents } from '../services/event.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export async function getEventsHandler(req, res) {
  try {
    const result = await getEvents(req.query, req.user);
    const message = result.events.length > 0
      ? 'Lấy danh sách sự kiện thành công'
      : 'Không có sự kiện nào';
    return res.status(200).json(successResponse(result, message));
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

### 5. Routes (`backend/src/routes/event.routes.js`)

```javascript
import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { getEventsHandler } from '../controllers/event.controller.js';

const router = Router();

/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     summary: Lấy danh sách sự kiện
 *     description: |
 *       Trả về danh sách sự kiện với phân trang và lọc theo status.
 *       Chỉ Manager và Admin mới có quyền xem sự kiện PENDING.
 *     tags: [Event Approval]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, ongoing, completed]
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       500:
 *         description: Lỗi server
 */
router.get('/', authMiddleware, getEventsHandler);

export default router;
```

### 6. Update `backend/src/app.js`

```javascript
import eventRoutes from './routes/event.routes.js';
app.use('/api/v1/events', eventRoutes);
```

### 7. Tests (`backend/tests/event/event.service.test.js`)

```javascript
// Test cases:
// 1. getEvents với status=pending + Manager token → chỉ PENDING events
// 2. getEvents với status=pending + Admin token → chỉ PENDING events
// 3. getEvents với status=pending + Staff token → throw 403
// 4. getEvents với status=pending + Volunteer token → throw 403
// 5. getEvents không status + Guest → chỉ APPROVED events
// 6. getEvents không status + Volunteer → chỉ APPROVED events
// 7. getEvents không status + Manager → tất cả events
// 8. getEvents với page/limit → phân trang
```

### 8. Integration Tests (`backend/tests/event/event.api.test.js`)

```javascript
// Test cases:
// 1. GET /api/v1/events?status=pending + Manager token → 200 + only PENDING
// 2. GET /api/v1/events?status=pending + Staff token → 403
// 3. GET /api/v1/events?status=pending + Guest (no token) → 401
// 4. GET /api/v1/events không status + Guest → 200 + only APPROVED
// 5. GET /api/v1/events?status=invalid → 400
```

## Frontend Implementation Order

### 1. API Client (`frontend/src/api/eventApi.js`)

```javascript
import axiosApi from './axiosApi';

export async function getEvents({ page = 1, limit = 20, status = '' } = {}) {
  const params = { page, limit };
  if (status) params.status = status;
  const response = await axiosApi.get('/events', { params });
  return response.data.data;
}
```

### 2. Hook (`frontend/src/hooks/usePendingEvents.js`)

```javascript
import { useState, useEffect, useCallback } from 'react';
import { getEvents } from '../api/eventApi';

export function usePendingEvents() {
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getEvents({ page, limit: 20, status: 'pending' });
      setEvents(result.events);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  return { events, pagination, loading, error, page, handlePageChange: (p) => setPage(p), refetch: fetchEvents };
}
```

### 3. PendingEventListPage Component (`frontend/src/components/pages/PendingEventListPage.jsx`)

```jsx
import React from 'react';
import {
  Container, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress, Box
} from '@mui/material';
import { usePendingEvents } from '../../hooks/usePendingEvents';

export default function PendingEventListPage() {
  const { events, pagination, loading, error } = usePendingEvents();

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Container maxWidth="md" sx={{ mt: 4 }}><Typography color="error">{error}</Typography></Container>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Pending Events</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Organization</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.length === 0 ? (
              <TableRow><TableCell colSpan={5}>No pending events</TableCell></TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.event_id}>
                  <TableCell>{event.event_id}</TableCell>
                  <TableCell>{event.title}</TableCell>
                  <TableCell>{event.organization?.name || '—'}</TableCell>
                  <TableCell><Chip label={event.status} color="warning" size="small" /></TableCell>
                  <TableCell>{new Date(event.created_at).toLocaleDateString('vi-VN')}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

PendingEventListPage.propTypes = {};
```

### 4. Add Route in `frontend/src/App.js`

```jsx
import PendingEventListPage from './components/pages/PendingEventListPage';
<Route path="/events/pending" element={<PendingEventListPage />} />
```

## Verification Steps

1. **API**: `GET /api/v1/events?status=pending` + Manager token → 200 + only PENDING events
2. **API**: `GET /api/v1/events?status=pending` + Staff token → 403
3. **API**: `GET /api/v1/events?status=pending` + Guest (no token) → 401
4. **API**: `GET /api/v1/events` (no status) + Guest → 200 + only APPROVED events
5. **API**: `GET /api/v1/events` (no status) + Manager → 200 + all events
6. **API**: `GET /api/v1/events?status=invalid` → 400
7. **Frontend**: Navigate to `/events/pending` → verify table renders correctly
# Quickstart: View Pending Event Detail (UC68)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-04

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- **UC67 infrastructure available**: Event model, event.repository.js, event.service.js, event.controller.js, event.routes.js, eventApi.js
- Organization model with relationship to Event
- User model (for created_by reference)
- Backend server running on port 5000

## Backend Implementation Order

### 1. Add Repository Method (`backend/src/repositories/event.repository.js`)

Thêm vào file đã có từ UC67:

```javascript
export async function findEventById(eventId) {
  return prisma.event.findUnique({
    where: { event_id: eventId },
    include: {
      organization: {
        select: { organization_id: true, name: true }
      },
      created_by_user: {
        select: { user_id: true, full_name: true }
      }
    }
  });
}
```

### 2. Add `getEventById` to Service (`backend/src/services/event.service.js`)

Thêm vào file đã có từ UC67:

```javascript
import { findEventById } from '../repositories/event.repository.js';
import { ServiceError } from '../utils/response.util.js';

export async function getEventById(eventId, currentUser) {
  // Validate ID
  const id = Number(eventId);
  if (isNaN(id) || id <= 0) {
    throw new ServiceError('Event ID không hợp lệ', 400, 'INVALID_EVENT_ID');
  }

  // Find event
  const event = await findEventById(id);
  if (!event) {
    throw new ServiceError('Event not found.', 404, 'EVENT_NOT_FOUND');
  }

  // Role-based visibility for PENDING events
  if (event.status === 'PENDING') {
    const role = currentUser?.role || currentUser?.role_name;
    if (!role) {
      throw new ServiceError('Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
    }
    if (role !== 'MANAGER' && role !== 'ADMIN') {
      throw new ServiceError('Bạn không có quyền truy cập tài nguyên này', 403, 'FORBIDDEN');
    }
  }

  return event;
}
```

### 3. Add `getEventByIdHandler` to Controller (`backend/src/controllers/event.controller.js`)

Thêm vào file đã có từ UC67:

```javascript
import { getEventById } from '../services/event.service.js';

export async function getEventByIdHandler(req, res) {
  try {
    const event = await getEventById(req.params.id, req.user);
    return res.status(200).json(successResponse(event, 'Lấy thông tin sự kiện thành công'));
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

Thêm route GET /:id vào file đã có từ UC67:

```javascript
import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { getEventsHandler, getEventByIdHandler } from '../controllers/event.controller.js';

const router = Router();

// Route hiện tại từ UC67
router.get('/', authMiddleware, getEventsHandler);

// Route mới cho UC68 — tái sử dụng cho UC09
router.get('/:id', authMiddleware, getEventByIdHandler);

export default router;
```

### 5. Tests (`backend/tests/event/event.service.test.js`)

```javascript
// Test cases bổ sung cho UC68:
// 1. getEventById với Manager (PENDING event) → 200 + full info
// 2. getEventById với Admin (PENDING event) → 200 + full info
// 3. getEventById với Staff (PENDING event) → throw 403
// 4. getEventById với Volunteer (PENDING event) → throw 403
// 5. getEventById với Guest (PENDING event) → throw 401
// 6. getEventById với ID không tồn tại → throw 404
// 7. getEventById với ID không hợp lệ → throw 400
```

### 6. Integration Tests (`backend/tests/event/event.api.test.js`)

```javascript
// Test cases bổ sung cho UC68:
// 1. GET /api/v1/events/1 (PENDING) + Manager token → 200
// 2. GET /api/v1/events/1 (PENDING) + Staff token → 403
// 3. GET /api/v1/events/1 (PENDING) + Guest (no token) → 401
// 4. GET /api/v1/events/999 → 404
// 5. GET /api/v1/events/abc → 400
```

## Frontend Implementation Order

### 1. Add `getEventById` to API Client (`frontend/src/api/eventApi.js`)

```javascript
export async function getEventById(id) {
  const response = await axiosApi.get(`/events/${id}`);
  return response.data.data;
}
```

### 2. Custom Hook (`frontend/src/hooks/useEventDetail.js`)

```javascript
import { useState, useEffect, useCallback } from 'react';
import { getEventById } from '../api/eventApi';

export function useEventDetail(id) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getEventById(id);
      setEvent(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { if (id) fetchEvent(); }, [fetchEvent, id]);

  return { event, loading, error, refetch: fetchEvent };
}
```

## Verification Steps

1. **API**: `GET /api/v1/events/1` (PENDING) + Manager token → 200 + full info
2. **API**: `GET /api/v1/events/1` (PENDING) + Staff token → 403
3. **API**: `GET /api/v1/events/1` (PENDING) + Guest (no token) → 401
4. **API**: `GET /api/v1/events/999` → 404
5. **API**: `GET /api/v1/events/abc` → 400
6. **Cross-module**: UC09 (NamLD) gọi endpoint này cho event APPROVED → vẫn hoạt động bình thường
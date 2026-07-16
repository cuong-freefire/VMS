# Quickstart: View Notification Detail (UC42)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-08

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- **UC41 infrastructure available**: Notification model, notification.repository.js, notification.service.js, notification.controller.js, notification.routes.js, notificationApi.js
- Backend server running on port 5000

## Backend Implementation Order

### 1. Add Repository Methods (`backend/src/repositories/notification.repository.js`)

Thêm vào file đã có từ UC41:

```javascript
export async function findNotificationById(notificationId) {
  return prisma.notification.findUnique({
    where: { notification_id: notificationId }
  });
}

export async function markAsRead(notificationId) {
  return prisma.notification.update({
    where: { notification_id: notificationId },
    data: { is_read: true }
  });
}
```

### 2. Add `getNotificationById` to Service (`backend/src/services/notification.service.js`)

Thêm vào file đã có từ UC41:

```javascript
import { findNotificationById, markAsRead } from '../repositories/notification.repository.js';
import { ServiceError } from '../utils/response.util.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getNotificationById(notificationId, currentUser) {
  // 1. Validate ID
  const id = Number(notificationId);
  if (isNaN(id) || id <= 0) {
    throw new ServiceError('Notification ID không hợp lệ', 400, 'INVALID_NOTIFICATION_ID');
  }

  // 2. Find notification
  const notification = await findNotificationById(id);
  if (!notification) {
    throw new ServiceError('Notification not found.', 404, 'NOTIFICATION_NOT_FOUND');
  }

  // 3. Ownership check
  if (notification.user_id !== currentUser.user_id) {
    throw new ServiceError('Notification not found.', 404, 'NOTIFICATION_NOT_FOUND');
  }

  // 4. Auto mark as read
  if (!notification.is_read) {
    await markAsRead(id);
    notification.is_read = true;
  }

  // 5. Build response
  const result = {
    notification_id: notification.notification_id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    is_read: notification.is_read,
    created_at: notification.created_at
  };

  // 6. Lookup reference entity
  if (notification.reference_type && notification.reference_id) {
    const reference = await lookupReference(notification.reference_type, notification.reference_id);
    result.reference = reference;
  } else {
    result.reference = null;
  }

  return result;
}

async function lookupReference(type, id) {
  const base = { type, id, deleted: false };

  try {
    switch (type) {
      case 'event': {
        const event = await prisma.event.findUnique({
          where: { event_id: id },
          select: { event_id: true, title: true, status: true, is_active: true }
        });
        if (!event || event.is_active === false) {
          return { ...base, summary: null, deleted: true };
        }
        return { ...base, summary: { title: event.title, status: event.status } };
      }
      case 'application': {
        const app = await prisma.volunteerApplication.findUnique({
          where: { application_id: id },
          select: { application_id: true, status: true }
        });
        if (!app) {
          return { ...base, summary: null, deleted: true };
        }
        return { ...base, summary: { status: app.status } };
      }
      case 'certificate': {
        const cert = await prisma.certificate.findUnique({
          where: { certificate_id: id },
          select: { certificate_id: true, certificate_url: true }
        });
        if (!cert) {
          return { ...base, summary: null, deleted: true };
        }
        return { ...base, summary: { certificate_url: cert.certificate_url } };
      }
      default:
        return { ...base, summary: null, deleted: false };
    }
  } catch (error) {
    return { ...base, summary: null, deleted: true };
  }
}
```

### 3. Add `getNotificationByIdHandler` to Controller (`backend/src/controllers/notification.controller.js`)

Thêm vào file đã có từ UC41:

```javascript
import { getNotificationById } from '../services/notification.service.js';

export async function getNotificationByIdHandler(req, res) {
  try {
    const notification = await getNotificationById(req.params.id, req.user);
    return res.status(200).json(successResponse(notification, 'Lấy thông tin thông báo thành công'));
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

### 4. Add Route (`backend/src/routes/notification.routes.js`)

Thêm route GET /:id vào file đã có từ UC41 — **đặt SAU route /unread-count**:

```javascript
import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import {
  getNotificationsHandler,
  getUnreadCountHandler,
  getNotificationByIdHandler
} from '../controllers/notification.controller.js';

const router = Router();

// Route hiện tại từ UC41
router.get('/', authMiddleware, getNotificationsHandler);
router.get('/unread-count', authMiddleware, getUnreadCountHandler);

// Route mới cho UC42 — đặt SAU /unread-count để tránh conflict
router.get('/:id', authMiddleware, getNotificationByIdHandler);

export default router;
```

### 5. Tests (`backend/tests/notification/notification.service.test.js`)

```javascript
// Test cases bổ sung cho UC42:
// 1. getNotificationById với ID hợp lệ + chủ sở hữu → 200 + full detail
// 2. getNotificationById với ID không tồn tại → throw 404
// 3. getNotificationById với ID không hợp lệ → throw 400
// 4. getNotificationById với user khác → throw 404 (ownership)
// 5. getNotificationById → is_read tự động thành true
// 6. getNotificationById với reference entity → reference summary
// 7. getNotificationById với reference entity đã xóa mềm → deleted: true
```

### 6. Integration Tests (`backend/tests/notification/notification.api.test.js`)

```javascript
// Test cases bổ sung cho UC42:
// 1. GET /api/v1/notifications/1 + token chủ sở hữu → 200
// 2. GET /api/v1/notifications/1 + token user khác → 404
// 3. GET /api/v1/notifications/999 → 404
// 4. GET /api/v1/notifications/abc → 400
// 5. GET /api/v1/notifications/1 + Guest (no token) → 401
```

## Frontend Implementation Order

### 1. Add `getNotificationById` to API Client (`frontend/src/api/notificationApi.js`)

```javascript
export async function getNotificationById(id) {
  const response = await axiosApi.get(`/notifications/${id}`);
  return response.data.data;
}
```

### 2. NotificationDetailPage Component

```jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, Chip, Button, CircularProgress, Box, Alert
} from '@mui/material';
import { useState, useEffect } from 'react';
import { getNotificationById } from '../../api/notificationApi';

export default function NotificationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await getNotificationById(id);
        setNotification(result);
      } catch (err) {
        setError(err.response?.data?.message || 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Container maxWidth="md" sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
  if (!notification) return null;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Button onClick={() => navigate('/notifications')} sx={{ mb: 2 }}>← Back to Notifications</Button>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h5">{notification.title}</Typography>
          <Chip label={notification.type} size="small" />
        </Box>
        <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>{notification.message}</Typography>
        <Typography variant="caption" color="text.secondary">
          {new Date(notification.created_at).toLocaleString('vi-VN')}
        </Typography>

        {notification.reference && !notification.reference.deleted && notification.reference.summary && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle2">Reference: {notification.reference.type}</Typography>
            {notification.reference.summary.title && (
              <Typography>{notification.reference.summary.title}</Typography>
            )}
            {notification.reference.summary.status && (
              <Chip label={notification.reference.summary.status} size="small" sx={{ mt: 1 }} />
            )}
          </Box>
        )}

        {notification.reference?.deleted && (
          <Alert severity="warning" sx={{ mt: 2 }}>[Đã xóa]</Alert>
        )}
      </Paper>
    </Container>
  );
}

NotificationDetailPage.propTypes = {};
```

### 3. Add Route in `frontend/src/App.js`

```jsx
import NotificationDetailPage from './components/pages/NotificationDetailPage';
<Route path="/notifications/:id" element={<NotificationDetailPage />} />
```

## Verification Steps

1. **API**: `GET /api/v1/notifications/1` + token chủ sở hữu → 200 + full detail
2. **API**: `GET /api/v1/notifications/1` + token user khác → 404
3. **API**: `GET /api/v1/notifications/999` → 404
4. **API**: `GET /api/v1/notifications/abc` → 400
5. **API**: `GET /api/v1/notifications/1` + Guest → 401
6. **API**: Verify is_read tự động thành true sau khi xem
7. **API**: Verify reference entity lookup hoạt động (event, application, certificate)
8. **Frontend**: Navigate to `/notifications/1` → verify detail renders correctly
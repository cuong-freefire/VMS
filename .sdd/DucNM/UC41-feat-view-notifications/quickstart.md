# Quickstart: View Notifications (UC41)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-08

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- Prisma CLI installed
- authMiddleware working (from UC03)
- Backend server running on port 5000

## Database

### 1. Prisma Schema (`backend/prisma/schema.prisma`)

Thêm model Notification:

```prisma
model Notification {
  notification_id Int      @id @default(autoincrement())
  user_id         Int
  title           String   @db.VarChar(255)
  message         String?  @db.Text
  type            String   @db.VarChar(50)
  reference_id    Int?
  reference_type  String?  @db.VarChar(50)
  is_read         Boolean  @default(false)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  user User @relation(fields: [user_id], references: [user_id])

  @@map("notifications")
}
```

Chạy migration:

```bash
npx prisma migrate dev --name add_notification_model
npx prisma generate
```

## Backend Implementation Order

### 1. Zod Validator (`backend/src/validators/notification.validator.js`)

```javascript
import { z } from 'zod';

export const getNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
```

### 2. Repository (`backend/src/repositories/notification.repository.js`)

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function findNotifications({ skip, take, where }) {
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      skip,
      take,
      where,
      orderBy: { created_at: 'desc' },
      select: {
        notification_id: true,
        title: true,
        message: true,
        type: true,
        reference_id: true,
        reference_type: true,
        is_read: true,
        created_at: true
      }
    }),
    prisma.notification.count({ where })
  ]);
  return { notifications, total };
}

export async function countUnreadByUserId(userId) {
  return prisma.notification.count({
    where: { user_id: userId, is_read: false }
  });
}
```

### 3. Service (`backend/src/services/notification.service.js`)

```javascript
import { getNotificationsQuerySchema } from '../validators/notification.validator.js';
import { findNotifications, countUnreadByUserId } from '../repositories/notification.repository.js';
import { ServiceError } from '../utils/response.util.js';

export async function getNotifications(query, currentUser) {
  const parsed = getNotificationsQuerySchema.safeParse(query);
  if (!parsed.success) {
    const field = parsed.error.errors[0].path[0];
    throw new ServiceError(`Tham số ${field} không hợp lệ`, 400, `INVALID_${String(field).toUpperCase()}`);
  }

  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where = { user_id: currentUser.user_id };

  const { notifications, total } = await findNotifications({ skip, take: limit, where });

  return {
    notifications,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 }
  };
}

export async function getUnreadCount(currentUser) {
  const count = await countUnreadByUserId(currentUser.user_id);
  return { unread_count: count };
}
```

### 4. Controller (`backend/src/controllers/notification.controller.js`)

```javascript
import { getNotifications, getUnreadCount } from '../services/notification.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export async function getNotificationsHandler(req, res) {
  try {
    const result = await getNotifications(req.query, req.user);
    const message = result.notifications.length > 0
      ? 'Lấy danh sách thông báo thành công'
      : 'Chưa có thông báo nào';
    return res.status(200).json(successResponse(result, message));
  } catch (error) {
    return res.status(error.status || 500).json(
      errorResponse(error.message || 'Có lỗi xảy ra', error.code || 'INTERNAL_SERVER_ERROR', error.details)
    );
  }
}

export async function getUnreadCountHandler(req, res) {
  try {
    const result = await getUnreadCount(req.user);
    return res.status(200).json(successResponse(result, 'Lấy số lượng thông báo chưa đọc thành công'));
  } catch (error) {
    return res.status(error.status || 500).json(
      errorResponse(error.message || 'Có lỗi xảy ra', error.code || 'INTERNAL_SERVER_ERROR', error.details)
    );
  }
}
```

### 5. Routes (`backend/src/routes/notification.routes.js`)

**⚠️ QUAN TRỌNG**: Route `/unread-count` phải đặt TRƯỚC route `/:id` để tránh Express conflict.

```javascript
import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { getNotificationsHandler, getUnreadCountHandler } from '../controllers/notification.controller.js';

const router = Router();

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Lấy danh sách thông báo
 *     tags: [Notification]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation
 *       401:
 *         description: Chưa xác thực
 *       500:
 *         description: Lỗi server
 */
router.get('/', authMiddleware, getNotificationsHandler);

/**
 * @swagger
 * /api/v1/notifications/unread-count:
 *   get:
 *     summary: Lấy số lượng thông báo chưa đọc
 *     tags: [Notification]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa xác thực
 *       500:
 *         description: Lỗi server
 */
router.get('/unread-count', authMiddleware, getUnreadCountHandler);

export default router;
```

### 6. Update `backend/src/app.js`

```javascript
import notificationRoutes from './routes/notification.routes.js';
app.use('/api/v1/notifications', notificationRoutes);
```

### 7. Tests (`backend/tests/notification/notification.service.test.js`)

```javascript
// Test cases:
// 1. getNotifications với page/limit hợp lệ → trả về danh sách + pagination
// 2. getNotifications khi không có notification → mảng rỗng
// 3. getNotifications với page âm → throw 400
// 4. getUnreadCount → trả về { unread_count: N }
// 5. getUnreadCount khi không có unread → unread_count = 0
```

### 8. Integration Tests (`backend/tests/notification/notification.api.test.js`)

```javascript
// Test cases:
// 1. GET /api/v1/notifications + token → 200 + danh sách
// 2. GET /api/v1/notifications + Guest (no token) → 401
// 3. GET /api/v1/notifications/unread-count + token → 200 + { unread_count }
// 4. GET /api/v1/notifications/unread-count + Guest → 401
```

## Frontend Implementation Order

### 1. API Client (`frontend/src/api/notificationApi.js`)

```javascript
import axiosApi from './axiosApi';

export async function getNotifications({ page = 1, limit = 20 } = {}) {
  const response = await axiosApi.get('/notifications', { params: { page, limit } });
  return response.data.data;
}

export async function getUnreadCount() {
  const response = await axiosApi.get('/notifications/unread-count');
  return response.data.data;
}
```

### 2. Hook (`frontend/src/hooks/useNotifications.js`)

```javascript
import { useState, useEffect, useCallback } from 'react';
import { getNotifications, getUnreadCount } from '../api/notificationApi';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getNotifications({ page, limit: 20 });
      setNotifications(result.notifications);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await getUnreadCount();
      setUnreadCount(result.unread_count);
    } catch (e) { /* silent */ }
  }, []);

  // Polling unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  return {
    notifications, pagination, unreadCount, loading, error, page,
    handlePageChange: (p) => setPage(p),
    refetch: fetchNotifications
  };
}
```

### 3. NotificationListPage Component (`frontend/src/components/pages/NotificationListPage.jsx`)

```jsx
import React from 'react';
import {
  Container, Typography, Paper, List, ListItem, ListItemText, ListItemIcon,
  Badge, Chip, CircularProgress, Box, Pagination
} from '@mui/material';
import { Notifications as NotifIcon } from '@mui/icons-material';
import { useNotifications } from '../../hooks/useNotifications';

export default function NotificationListPage() {
  const { notifications, pagination, unreadCount, loading, error, handlePageChange } = useNotifications();

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Container><Typography color="error">{error}</Typography></Container>;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h4">Notifications</Typography>
        <Badge badgeContent={unreadCount} color="primary">
          <NotifIcon />
        </Badge>
      </Box>

      <Paper>
        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Chưa có thông báo nào</Typography>
          </Box>
        ) : (
          <List>
            {notifications.map((notif) => (
              <ListItem key={notif.notification_id}
                sx={{ bgcolor: notif.is_read ? 'transparent' : 'action.hover', fontWeight: notif.is_read ? 'normal' : 'bold' }}>
                <ListItemText
                  primary={notif.title}
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">{notif.message}</Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip label={notif.type} size="small" variant="outlined" />
                        <Typography variant="caption" color="text.disabled">
                          {new Date(notif.created_at).toLocaleString('vi-VN')}
                        </Typography>
                      </Box>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination count={pagination.totalPages} page={pagination.page}
            onChange={(e, p) => handlePageChange(p)} color="primary" />
        </Box>
      )}
    </Container>
  );
}

NotificationListPage.propTypes = {};
```

### 4. Add Route in `frontend/src/App.js`

```jsx
import NotificationListPage from './components/pages/NotificationListPage';
<Route path="/notifications" element={<NotificationListPage />} />
```

## Verification Steps

1. **API**: `GET /api/v1/notifications` + token → 200 + danh sách + pagination
2. **API**: `GET /api/v1/notifications` + Guest → 401
3. **API**: `GET /api/v1/notifications/unread-count` + token → 200 + { unread_count }
4. **API**: `GET /api/v1/notifications/unread-count` + Guest → 401
5. **API**: `GET /api/v1/notifications?page=-1` → 400
6. **Frontend**: Navigate to `/notifications` → verify list + badge + pagination
7. **Frontend**: Badge unread count updates every 30 seconds (polling)
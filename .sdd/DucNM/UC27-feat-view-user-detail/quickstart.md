# Quickstart: View User Detail (UC27)

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- Prisma schema with `User` and `Role` models migrated
- JWT auth middleware working (from UC03)
- **UC26 infrastructure available**: authorize.middleware.js, user.repository.js, user.service.js, user.controller.js, user.routes.js, userApi.js
- Backend server running on port 5000

## Backend Implementation Order

### 1. Add `findUserById` to Repository (`backend/src/repositories/user.repository.js`)

Thêm function mới vào file đã có từ UC26:

```javascript
export async function findUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: {
      user_id: true,
      full_name: true,
      email: true,
      phone: true,
      avatar_url: true,
      is_active: true,
      created_at: true,
      updated_at: true,
      role: {
        select: { name: true }
      }
    }
  });

  if (!user) return null;

  // Transform: flatten role name
  return {
    ...user,
    role: user.role.name
  };
}
```

### 2. Add `getUserById` to Service (`backend/src/services/user.service.js`)

Thêm function mới vào file đã có từ UC26:

```javascript
import { findUserById } from '../repositories/user.repository.js';
import { ServiceError } from '../utils/response.util.js';

export async function getUserById(userId) {
  // Validate userId is positive integer
  const parsed = z.coerce.number().int().positive().safeParse(userId);
  if (!parsed.success) {
    throw new ServiceError('User ID không hợp lệ', 400, 'INVALID_USER_ID');
  }

  const user = await findUserById(parsed.data);
  if (!user) {
    throw new ServiceError('User not found.', 404, 'USER_NOT_FOUND');
  }

  return user;
}
```

### 3. Add `getUserByIdHandler` to Controller (`backend/src/controllers/user.controller.js`)

Thêm handler mới vào file đã có từ UC26:

```javascript
import { getUserById } from '../services/user.service.js';

export async function getUserByIdHandler(req, res) {
  try {
    const user = await getUserById(req.params.id);
    return res.status(200).json(successResponse(user, 'Lấy thông tin người dùng thành công'));
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

### 4. Add Route (`backend/src/routes/user.routes.js`)

Thêm route mới vào file đã có từ UC26 — **QUAN TRỌNG**: Route `/:id` phải đặt SAU route `/me` để tránh conflict:

```javascript
import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import authorize from '../middleware/authorize.middleware.js';
import { getUsersHandler } from '../controllers/user.controller.js';
import { getUserByIdHandler } from '../controllers/user.controller.js';

const router = Router();

// Route hiện tại từ UC26
router.get('/', authMiddleware, authorize('ADMIN'), getUsersHandler);

// Route mới cho UC27 — đặt sau route `/` để tránh conflict
router.get('/:id', authMiddleware, authorize('ADMIN'), getUserByIdHandler);

export default router;
```

### 5. Test File (`backend/tests/user/user.service.test.js`)

```javascript
// Test cases bổ sung cho UC27:
// 1. getUserById with valid ID returns user detail
// 2. getUserById with non-existent ID throws ServiceError 404
// 3. getUserById with invalid ID (string, negative) throws ServiceError 400
```

### 6. Integration Tests (`backend/tests/user/user.api.test.js`)

```javascript
// Test cases bổ sung cho UC27:
// 1. GET /api/v1/users/1 with Admin token → 200 + user data
// 2. GET /api/v1/users/999 with Admin token → 404
// 3. GET /api/v1/users/abc with Admin token → 400
// 4. GET /api/v1/users/1 with Staff token → 403
// 5. GET /api/v1/users/1 without token → 401
```

## Frontend Implementation Order

### 1. Add `getUserById` to API Client (`frontend/src/api/userApi.js`)

```javascript
export async function getUserById(id) {
  const response = await axiosApi.get(`/users/${id}`);
  return response.data.data;
}
```

### 2. Custom Hook (`frontend/src/hooks/useUserDetail.js`)

```javascript
import { useState, useEffect, useCallback } from 'react';
import { getUserById } from '../api/userApi';

export function useUserDetail(userId) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const result = await getUserById(userId);
      setUser(result);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(err.response?.data?.message || 'Có lỗi xảy ra');
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchUser();
  }, [fetchUser, userId]);

  return { user, loading, error, notFound, refetch: fetchUser };
}
```

### 3. UserDetailPage Component (`frontend/src/components/pages/UserDetailPage.jsx`)

```jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Avatar, Box, Chip, CircularProgress, Button,
  Table, TableBody, TableCell, TableRow
} from '@mui/material';
import { useUserDetail } from '../../hooks/useUserDetail';

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading, error, notFound } = useUserDetail(id);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (notFound) return <Container maxWidth="md" sx={{ mt: 4 }}><Typography variant="h5" color="error">User not found.</Typography></Container>;
  if (error) return <Container maxWidth="md" sx={{ mt: 4 }}><Typography color="error">{error}</Typography></Container>;
  if (!user) return null;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Button onClick={() => navigate('/users')} sx={{ mb: 2 }}>← Back to User List</Button>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
          <Avatar src={user.avatar_url} sx={{ width: 80, height: 80 }}>{user.full_name?.[0]}</Avatar>
          <Box>
            <Typography variant="h4">{user.full_name}</Typography>
            <Chip label={user.role} color="primary" size="small" sx={{ mt: 1 }} />
            <Chip
              label={user.is_active ? 'Active' : 'Inactive'}
              color={user.is_active ? 'success' : 'default'}
              size="small"
              sx={{ ml: 1, mt: 1 }}
            />
          </Box>
        </Box>
        <Table>
          <TableBody>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell><TableCell>{user.email}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell><TableCell>{user.phone || '—'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell><TableCell>{user.role}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell><TableCell>{user.is_active ? 'Active' : 'Inactive'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Created At</TableCell><TableCell>{new Date(user.created_at).toLocaleDateString('vi-VN')}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Updated At</TableCell><TableCell>{new Date(user.updated_at).toLocaleDateString('vi-VN')}</TableCell></TableRow>
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}

UserDetailPage.propTypes = {};
```

### 4. Add Route in `frontend/src/App.js`

```jsx
import UserDetailPage from './components/pages/UserDetailPage';

// Thêm route:
<Route path="/users/:id" element={<UserDetailPage />} />
```

## Verification Steps

1. **Backend**: Run `npm run test` — verify all tests pass (cả UC26 + UC27 tests)
2. **API**: Call `GET /api/v1/users/1` with Admin token → expect 200 + user data
3. **API**: Call `GET /api/v1/users/999` with Admin token → expect 404
4. **API**: Call `GET /api/v1/users/abc` with Admin token → expect 400
5. **API**: Call `GET /api/v1/users/1` with Staff token → expect 403
6. **API**: Call `GET /api/v1/users/1` without token → expect 401
7. **Frontend**: Navigate to `/users/1` → verify user detail renders correctly with avatar, role chip, status chip, and info table
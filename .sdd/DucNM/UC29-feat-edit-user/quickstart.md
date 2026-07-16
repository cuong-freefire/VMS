# Quickstart: Edit User (UC29)

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- Prisma schema with `User` and `Role` models migrated
- JWT auth middleware working (from UC03)
- **UC26-UC28 infrastructure available**: authorize.middleware.js, user.repository.js, user.service.js, user.controller.js, user.routes.js, userApi.js, validators
- Backend server running on port 5000

## Backend Implementation Order

### 1. Add Zod Schema (`backend/src/validators/user.validator.js`)

Thêm updateUserSchema vào file đã có từ UC26-UC28:

```javascript
import { z } from 'zod';

// Schema hiện có
export const getUsersQuerySchema = z.object({ ... });
export const userIdSchema = z.coerce.number().int().positive();
export const createUserSchema = z.object({ ... });

// Schema mới cho UC29 — tất cả fields optional (PATCH)
export const updateUserSchema = z.object({
  full_name: z.string().min(1, 'Full name cannot be empty').optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url('Invalid URL format').optional().nullable(),
  role_id: z.number().int().positive('Role is required').optional(),
  is_active: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'No fields to update.'
});
```

### 2. Add `updateUser` to Repository (`backend/src/repositories/user.repository.js`)

Thêm vào file đã có từ UC26-UC28:

```javascript
export async function updateUser(userId, data) {
  return prisma.user.update({
    where: { user_id: userId },
    data,
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
}
```

### 3. Add `updateUserService` to Service (`backend/src/services/user.service.js`)

Thêm vào file đã có từ UC26-UC28:

```javascript
import { updateUserSchema } from '../validators/user.validator.js';
import { findUserById, updateUser, findRoleById } from '../repositories/user.repository.js';

export async function updateUserService(userId, data, currentUser) {
  // 1. Validate input
  const parsed = updateUserSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    if (firstError.code === 'custom' && firstError.message === 'No fields to update.') {
      throw new ServiceError('No fields to update.', 400, 'NO_FIELDS_TO_UPDATE');
    }
    const details = parsed.error.errors.map(err => ({
      field: err.path[0],
      message: err.message
    }));
    throw new ServiceError('Dữ liệu đầu vào không hợp lệ', 400, 'VALIDATION_ERROR', details);
  }

  const updateData = parsed.data;

  // 2. Check user exists
  const existingUser = await findUserById(userId);
  if (!existingUser) {
    throw new ServiceError('User not found.', 404, 'USER_NOT_FOUND');
  }

  // 3. Check self-role-downgrade
  const isSelfUpdate = currentUser.user_id === userId;
  if (isSelfUpdate && updateData.role_id) {
    const currentRoleId = existingUser.role_id; // need role_id in findUserById select
    if (updateData.role_id < currentRoleId) {
      throw new ServiceError('Cannot downgrade your own role.', 403, 'SELF_ROLE_DOWNGRADE');
    }
  }

  // 4. Validate role exists if updating role
  if (updateData.role_id) {
    const role = await findRoleById(updateData.role_id);
    if (!role) {
      throw new ServiceError('Invalid role.', 400, 'INVALID_ROLE');
    }
  }

  // 5. Update user
  const user = await updateUser(userId, updateData);

  // 6. Transform: flatten role name
  return {
    ...user,
    role: user.role.name
  };
}
```

**⚠️ Note**: Cần cập nhật `findUserById` trong repository để include `role_id` nếu chưa có.

### 4. Add `updateUserHandler` to Controller (`backend/src/controllers/user.controller.js`)

Thêm vào file đã có từ UC26-UC28:

```javascript
import { updateUserService } from '../services/user.service.js';

export async function updateUserHandler(req, res) {
  try {
    const user = await updateUserService(
      Number(req.params.id),
      req.body,
      req.user
    );
    return res.status(200).json(successResponse(user, 'Cập nhật thông tin người dùng thành công'));
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

### 5. Add Route (`backend/src/routes/user.routes.js`)

Thêm route PATCH vào file đã có từ UC26-UC28:

```javascript
import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import authorize from '../middleware/authorize.middleware.js';
import {
  getUsersHandler,
  getUserByIdHandler,
  createUserHandler,
  updateUserHandler
} from '../controllers/user.controller.js';

const router = Router();

// Routes hiện tại
router.get('/', authMiddleware, authorize('ADMIN'), getUsersHandler);
router.post('/', authMiddleware, authorize('ADMIN'), createUserHandler);
router.get('/:id', authMiddleware, authorize('ADMIN'), getUserByIdHandler);

// Route mới cho UC29
router.patch('/:id', authMiddleware, authorize('ADMIN'), updateUserHandler);

export default router;
```

### 6. Test File (`backend/tests/user/user.service.test.js`)

```javascript
// Test cases bổ sung cho UC29:
// 1. updateUser với dữ liệu hợp lệ → trả về user đã cập nhật
// 2. updateUser với user ID không tồn tại → throw ServiceError 404
// 3. updateUser với body rỗng → throw ServiceError 400 NO_FIELDS_TO_UPDATE
// 4. updateUser tự hạ role của chính mình → throw ServiceError 403 SELF_ROLE_DOWNGRADE
// 5. updateUser với role_id không tồn tại → throw ServiceError 400 INVALID_ROLE
// 6. updateUser chỉ update is_active → thành công
```

### 7. Integration Tests (`backend/tests/user/user.api.test.js`)

```javascript
// Test cases bổ sung cho UC29:
// 1. PATCH /api/v1/users/1 với dữ liệu hợp lệ + Admin token → 200
// 2. PATCH /api/v1/users/999 với Admin token → 404
// 3. PATCH /api/v1/users/1 với body rỗng + Admin token → 400
// 4. PATCH /api/v1/users/1 với role thấp hơn + token của chính user đó → 403
// 5. PATCH /api/v1/users/1 với Staff token → 403
// 6. PATCH /api/v1/users/1 không token → 401
```

## Frontend Implementation Order

### 1. Add `updateUser` to API Client (`frontend/src/api/userApi.js`)

```javascript
export async function updateUser(id, data) {
  const response = await axiosApi.patch(`/users/${id}`, data);
  return response.data.data;
}
```

### 2. Custom Hook (`frontend/src/hooks/useUpdateUser.js`)

```javascript
import { useState } from 'react';
import { updateUser } from '../api/userApi';

export function useUpdateUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleUpdateUser = async (id, data) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await updateUser(id, data);
      setSuccess(true);
      return result;
    } catch (err) {
      const message = err.response?.data?.message || 'Có lỗi xảy ra';
      const details = err.response?.data?.details || null;
      setError({ message, details });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    handleUpdateUser, loading, error, success,
    reset: () => { setError(null); setSuccess(false); }
  };
}
```

### 3. EditUserPage Component (`frontend/src/components/pages/EditUserPage.jsx`)

```jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, TextField, Button, MenuItem,
  Alert, Box, CircularProgress, Switch, FormControlLabel
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateUser } from '../../hooks/useUpdateUser';
import { getUserById } from '../../api/userApi';

const schema = z.object({
  full_name: z.string().min(1, 'Full name cannot be empty'),
  phone: z.string().optional(),
  role_id: z.coerce.number().int().positive('Role is required'),
  is_active: z.boolean()
});

const roles = [
  { id: 1, name: 'VOLUNTEER' },
  { id: 2, name: 'STAFF' },
  { id: 3, name: 'MANAGER' },
  { id: 4, name: 'ADMIN' }
];

export default function EditUserPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { handleUpdateUser, loading, error, success } = useUpdateUser();
  const [pageLoading, setPageLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema)
  });

  // Fetch user data to pre-fill form
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getUserById(id);
        reset({
          full_name: user.full_name,
          phone: user.phone || '',
          role_id: roles.find(r => r.name === user.role)?.id || 1,
          is_active: user.is_active
        });
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Failed to load user');
      } finally {
        setPageLoading(false);
      }
    };
    fetchUser();
  }, [id, reset]);

  const onSubmit = async (data) => {
    try {
      await handleUpdateUser(id, data);
    } catch (e) { /* handled in hook */ }
  };

  if (pageLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (fetchError) return <Container maxWidth="sm" sx={{ mt: 4 }}><Alert severity="error">{fetchError}</Alert></Container>;

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Button onClick={() => navigate(`/users/${id}`)} sx={{ mb: 2 }}>← Back to User Detail</Button>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Edit User</Typography>

        {success && <Alert severity="success" sx={{ mb: 2 }}>User updated successfully!</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField fullWidth label="Full Name" {...register('full_name')} error={!!errors.full_name} helperText={errors.full_name?.message} sx={{ mb: 2 }} />
          <TextField fullWidth label="Phone" {...register('phone')} sx={{ mb: 2 }} />
          <TextField fullWidth label="Role" select {...register('role_id')} error={!!errors.role_id} helperText={errors.role_id?.message} sx={{ mb: 2 }}>
            {roles.map((role) => (
              <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
            ))}
          </TextField>
          <FormControlLabel control={<Switch defaultChecked {...register('is_active')} />} label="Active" sx={{ mb: 3, display: 'block' }} />
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => navigate(`/users/${id}`)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

EditUserPage.propTypes = {};
```

### 4. Add Route in `frontend/src/App.js`

```jsx
import EditUserPage from './components/pages/EditUserPage';

// Thêm route:
<Route path="/users/:id/edit" element={<EditUserPage />} />
```

## Verification Steps

1. **Backend**: Run `npm run test` — verify all tests pass (UC26 + UC27 + UC28 + UC29)
2. **API**: `PATCH /api/v1/users/1` với full_name mới + Admin token → expect 200 + updated data
3. **API**: `PATCH /api/v1/users/999` với Admin token → expect 404
4. **API**: `PATCH /api/v1/users/1` với body rỗng → expect 400
5. **API**: `PATCH /api/v1/users/{selfId}` với role_id thấp hơn + token của chính user → expect 403
6. **API**: `PATCH /api/v1/users/1` với Staff token → expect 403
7. **API**: `PATCH /api/v1/users/1` không token → expect 401
8. **API**: `PATCH /api/v1/users/1` với is_active = false → user không thể đăng nhập
9. **Frontend**: Navigate to `/users/1/edit` → form pre-filled → edit → submit → verify success
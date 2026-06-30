# Quickstart: Add User (UC28)

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- Prisma schema with `User` and `Role` models migrated
- JWT auth middleware working (from UC03)
- **UC26/UC27 infrastructure available**: authorize.middleware.js, user.repository.js, user.service.js, user.controller.js, user.routes.js, userApi.js
- bcryptjs installed: `npm install bcryptjs`
- Backend server running on port 5000

## Backend Implementation Order

### 1. Add Zod Schema (`backend/src/validators/user.validator.js`)

Thêm createUserSchema vào file đã có từ UC26/UC27:

```javascript
import { z } from 'zod';

// Schema hiện có (từ UC26)
export const getUsersQuerySchema = z.object({ ... });
export const userIdSchema = z.coerce.number().int().positive();

// Schema mới cho UC28
export const createUserSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role_id: z.number().int().positive('Role is required')
});
```

### 2. Add Repository Methods (`backend/src/repositories/user.repository.js`)

Thêm vào file đã có từ UC26/UC27:

```javascript
export async function findUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email }
  });
}

export async function createUser(data) {
  return prisma.user.create({
    data: {
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      password: data.password, // already hashed
      role_id: data.role_id,
      is_active: true
    },
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

### 3. Add `createUser` to Service (`backend/src/services/user.service.js`)

Thêm vào file đã có từ UC26/UC27:

```javascript
import bcrypt from 'bcryptjs';
import { createUserSchema } from '../validators/user.validator.js';
import { findUserByEmail, createUser, findRoleById } from '../repositories/user.repository.js';

export async function createUserService(data) {
  // 1. Validate input
  const parsed = createUserSchema.safeParse(data);
  if (!parsed.success) {
    const details = parsed.error.errors.map(err => ({
      field: err.path[0],
      message: err.message
    }));
    throw new ServiceError('Dữ liệu đầu vào không hợp lệ', 400, 'VALIDATION_ERROR', details);
  }

  const { full_name, email, phone, password, role_id } = parsed.data;

  // 2. Check email uniqueness
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ServiceError('Email already exists.', 409, 'EMAIL_EXISTS');
  }

  // 3. Validate role exists
  const role = await findRoleById(role_id);
  if (!role) {
    throw new ServiceError('Invalid role.', 400, 'INVALID_ROLE');
  }

  // 4. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 5. Create user
  const user = await createUser({
    full_name, email, phone, password: hashedPassword, role_id
  });

  // 6. Transform: flatten role name
  return {
    ...user,
    role: user.role.name
  };
}
```

### 4. Add `createUserHandler` to Controller (`backend/src/controllers/user.controller.js`)

Thêm vào file đã có từ UC26/UC27:

```javascript
import { createUserService } from '../services/user.service.js';

export async function createUserHandler(req, res) {
  try {
    const user = await createUserService(req.body);
    return res.status(201).json(successResponse(user, 'Tạo người dùng thành công'));
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

Thêm route POST vào file đã có từ UC26/UC27:

```javascript
import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import authorize from '../middleware/authorize.middleware.js';
import { getUsersHandler, getUserByIdHandler, createUserHandler } from '../controllers/user.controller.js';

const router = Router();

// Routes hiện tại
router.get('/', authMiddleware, authorize('ADMIN'), getUsersHandler);
router.get('/:id', authMiddleware, authorize('ADMIN'), getUserByIdHandler);

// Route mới cho UC28
router.post('/', authMiddleware, authorize('ADMIN'), createUserHandler);

export default router;
```

**⚠️ IMPORTANT**: Route POST `/` phải đặt TRƯỚC route GET `/:id` để Express không nhầm POST request với route param `:id`.

### 6. Test File (`backend/tests/user/user.service.test.js`)

```javascript
// Test cases bổ sung cho UC28:
// 1. createUser với dữ liệu hợp lệ → trả về user mới (không password)
// 2. createUser với email đã tồn tại → throw ServiceError 409 EMAIL_EXISTS
// 3. createUser với email không hợp lệ → throw ServiceError 400 VALIDATION_ERROR
// 4. createUser với password < 8 ký tự → throw ServiceError 400 VALIDATION_ERROR
// 5. createUser với role_id không tồn tại → throw ServiceError 400 INVALID_ROLE
// 6. createUser với full_name empty → throw ServiceError 400 VALIDATION_ERROR
```

### 7. Integration Tests (`backend/tests/user/user.api.test.js`)

```javascript
// Test cases bổ sung cho UC28:
// 1. POST /api/v1/users với dữ liệu hợp lệ + Admin token → 201
// 2. POST /api/v1/users với email đã tồn tại + Admin token → 409
// 3. POST /api/v1/users với email sai format + Admin token → 400
// 4. POST /api/v1/users với password ngắn + Admin token → 400
// 5. POST /api/v1/users với Staff token → 403
// 6. POST /api/v1/users không token → 401
```

## Frontend Implementation Order

### 1. Add `createUser` to API Client (`frontend/src/api/userApi.js`)

```javascript
export async function createUser(data) {
  const response = await axiosApi.post('/users', data);
  return response.data.data;
}
```

### 2. Custom Hook (`frontend/src/hooks/useCreateUser.js`)

```javascript
import { useState } from 'react';
import { createUser } from '../api/userApi';

export function useCreateUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleCreateUser = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await createUser(data);
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

  return { handleCreateUser, loading, error, success, reset: () => { setError(null); setSuccess(false); } };
}
```

### 3. AddUserPage Component (`frontend/src/components/pages/AddUserPage.jsx`)

```jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, TextField, Button, MenuItem, Alert, Box, CircularProgress } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateUser } from '../../hooks/useCreateUser';

const schema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role_id: z.coerce.number().int().positive('Role is required')
});

const roles = [
  { id: 1, name: 'VOLUNTEER' },
  { id: 2, name: 'STAFF' },
  { id: 3, name: 'MANAGER' },
  { id: 4, name: 'ADMIN' }
];

export default function AddUserPage() {
  const navigate = useNavigate();
  const { handleCreateUser, loading, error, success } = useCreateUser();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data) => {
    try {
      await handleCreateUser(data);
    } catch (e) { /* error handled in hook */ }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Button onClick={() => navigate('/users')} sx={{ mb: 2 }}>← Back to User List</Button>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Add New User</Typography>

        {success && <Alert severity="success" sx={{ mb: 2 }}>User created successfully!</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField fullWidth label="Full Name" {...register('full_name')} error={!!errors.full_name} helperText={errors.full_name?.message} sx={{ mb: 2 }} />
          <TextField fullWidth label="Email" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} sx={{ mb: 2 }} />
          <TextField fullWidth label="Phone" {...register('phone')} sx={{ mb: 2 }} />
          <TextField fullWidth label="Password" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} sx={{ mb: 2 }} />
          <TextField fullWidth label="Role" select {...register('role_id')} error={!!errors.role_id} helperText={errors.role_id?.message} sx={{ mb: 3 }}>
            {roles.map((role) => (
              <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => navigate('/users')}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Create User'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

AddUserPage.propTypes = {};
```

### 4. Add Route in `frontend/src/App.js`

```jsx
import AddUserPage from './components/pages/AddUserPage';

// Thêm route:
<Route path="/users/add" element={<AddUserPage />} />
```

## Verification Steps

1. **Backend**: Run `npm run test` — verify all tests pass (UC26 + UC27 + UC28)
2. **API**: `POST /api/v1/users` với dữ liệu hợp lệ + Admin token → expect 201 + user data (không password)
3. **API**: `POST /api/v1/users` với email đã tồn tại → expect 409
4. **API**: `POST /api/v1/users` với email sai format → expect 400 + validation details
5. **API**: `POST /api/v1/users` với password < 8 ký tự → expect 400
6. **API**: `POST /api/v1/users` với Staff token → expect 403
7. **API**: `POST /api/v1/users` không token → expect 401
8. **Database**: Verify password được hash (bcrypt hash, không plain text)
9. **Frontend**: Navigate to `/users/add` → fill form → submit → verify success
# Quickstart: View User List (UC26)

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- Prisma schema with `User` and `Role` models migrated
- JWT auth middleware working (from UC03)
- Backend server running on port 5000

## Backend Implementation Order

### 1. Prisma Schema (`backend/prisma/schema.prisma`)

```prisma
model Role {
  role_id Int     @id @default(autoincrement())
  name    String  @unique @db.VarChar(50)
  users   User[]

  @@map("roles")
}

model User {
  user_id    Int      @id @default(autoincrement())
  email      String   @unique @db.VarChar(255)
  password   String   @db.VarChar(255)
  full_name  String   @db.VarChar(255)
  phone      String?  @db.VarChar(20)
  avatar_url String?  @db.VarChar(500)
  role_id    Int
  is_active  Boolean  @default(true)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  role Role @relation(fields: [role_id], references: [role_id])

  @@map("users")
}
```

### 2. Authorize Middleware (`backend/src/middleware/authorize.middleware.js`)

```javascript
import { errorResponse } from '../utils/response.util.js';

export default function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(
        errorResponse('Vui lòng đăng nhập.', 'UNAUTHORIZED')
      );
    }

    const userRole = req.user.role || req.user.role_name;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json(
        errorResponse('Bạn không có quyền truy cập tài nguyên này.', 'FORBIDDEN')
      );
    }

    next();
  };
}
```

### 3. Validator (`backend/src/validators/user.validator.js`)

```javascript
import { z } from 'zod';

export const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['volunteer', 'staff', 'manager', 'admin']).optional(),
  sort: z.string().regex(/^(created_at|full_name|email):(asc|desc)$/).default('created_at:desc')
});
```

### 4. Repository (`backend/src/repositories/user.repository.js`)

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function findUsers({ skip, take, where, orderBy }) {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take,
      where,
      orderBy,
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
    }),
    prisma.user.count({ where })
  ]);

  // Transform: flatten role name
  const transformedUsers = users.map(user => ({
    ...user,
    role: user.role.name
  }));

  return { users: transformedUsers, total };
}
```

### 5. Service (`backend/src/services/user.service.js`)

```javascript
import { ServiceError } from '../utils/response.util.js';
import { getUsersQuerySchema } from '../validators/user.validator.js';
import { findUsers } from '../repositories/user.repository.js';

export async function getUsers(query, currentUser) {
  // Validate query params
  const parsed = getUsersQuerySchema.safeParse(query);
  if (!parsed.success) {
    const field = parsed.error.errors[0].path[0];
    const messages = {
      page: 'Tham số page không hợp lệ',
      limit: 'Tham số limit phải từ 1 đến 100',
      role: 'Role không hợp lệ. Chấp nhận: volunteer, staff, manager, admin',
      sort: 'Tham số sort không đúng định dạng (field:direction)'
    };
    throw new ServiceError(
      messages[field] || 'Dữ liệu đầu vào không hợp lệ',
      400,
      `INVALID_${String(field).toUpperCase()}`
    );
  }

  const { page, limit, search, role, sort } = parsed.data;
  const skip = (page - 1) * limit;

  // Build where clause
  const where = {
    AND: []
  };

  if (search) {
    where.AND.push({
      OR: [
        { full_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    });
  }

  if (role) {
    where.AND.push({
      role: { name: { equals: role.toUpperCase(), mode: 'insensitive' } }
    });
  }

  if (where.AND.length === 0) {
    delete where.AND;
  }

  // Parse sort
  const [sortField, sortDirection] = sort.split(':');

  const { users, total } = await findUsers({
    skip,
    take: limit,
    where,
    orderBy: { [sortField]: sortDirection }
  });

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0
    }
  };
}
```

### 6. Controller (`backend/src/controllers/user.controller.js`)

```javascript
import { getUsers } from '../services/user.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export async function getUsersHandler(req, res) {
  try {
    const result = await getUsers(req.query, req.user);
    const message = result.users.length > 0
      ? 'Lấy danh sách người dùng thành công'
      : 'Không tìm thấy người dùng nào';
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

### 7. Routes (`backend/src/routes/user.routes.js`)

```javascript
import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import authorize from '../middleware/authorize.middleware.js';
import { getUsersHandler } from '../controllers/user.controller.js';

const router = Router();

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Lấy danh sách người dùng (Admin only)
 *     // ... Swagger JSDoc (see contracts/api-get-users.md)
 */
router.get('/', authMiddleware, authorize('ADMIN'), getUsersHandler);

export default router;
```

### 8. Update `backend/src/app.js`

```javascript
import userRoutes from './routes/user.routes.js';
// ... existing imports ...

app.use('/api/v1/users', userRoutes);
```

### 9. Test File (`backend/tests/user/user.service.test.js`)

```javascript
// Test cases:
// 1. getUsers with valid params returns paginated list
// 2. getUsers with search filters correctly
// 3. getUsers with role filter returns only matching role
// 4. getUsers with invalid page throws ServiceError 400
// 5. getUsers with invalid limit throws ServiceError 400
// 6. getUsers with invalid role throws ServiceError 400
```

## Frontend Implementation Order

### 1. API Client (`frontend/src/api/userApi.js`)

```javascript
import axiosApi from './axiosApi';

export async function getUsers({ page = 1, limit = 20, search = '', role = '', sort = 'created_at:desc' } = {}) {
  const params = { page, limit, sort };
  if (search) params.search = search;
  if (role) params.role = role;

  const response = await axiosApi.get('/users', { params });
  return response.data.data;
}
```

### 2. Hook (`frontend/src/hooks/useUsers.js`)

```javascript
import { useState, useEffect, useCallback } from 'react';
import { getUsers } from '../api/userApi';

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('created_at:desc');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUsers({ page, limit: 20, search, role, sort });
      setUsers(result.users);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, [page, search, role, sort]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleFilter = (value) => {
    setRole(value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleSort = (field, direction) => {
    setSort(`${field}:${direction}`);
  };

  return {
    users, pagination, loading, error,
    search, role, page,
    handleSearch, handleRoleFilter, handlePageChange, handleSort,
    refetch: fetchUsers
  };
}
```

### 3. UserListPage Component (`frontend/src/components/pages/UserListPage.jsx`)

```jsx
import React from 'react';
import { Container, Typography, Box, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useUsers } from '../../hooks/useUsers';

export default function UserListPage() {
  const {
    users, pagination, loading, error,
    search, role,
    handleSearch, handleRoleFilter, handlePageChange, handleSort
  } = useUsers();

  const columns = [
    { field: 'user_id', headerName: 'ID', width: 70 },
    { field: 'full_name', headerName: 'Họ tên', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    { field: 'role', headerName: 'Role', width: 130 },
    { field: 'is_active', headerName: 'Trạng thái', width: 120,
      renderCell: (params) => params.value ? 'Active' : 'Inactive'
    },
    { field: 'created_at', headerName: 'Ngày tạo', width: 180,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('vi-VN')
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Quản lý người dùng</Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Tìm kiếm"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{ minWidth: 300 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Role</InputLabel>
          <Select value={role} label="Role" onChange={(e) => handleRoleFilter(e.target.value)}>
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="volunteer">Volunteer</MenuItem>
            <MenuItem value="staff">Staff</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && <Typography color="error">{error}</Typography>}

      <Box sx={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          getRowId={(row) => row.user_id}
          loading={loading}
          pageSizeOptions={[20]}
          paginationModel={{ page: pagination.page - 1, pageSize: 20 }}
          onPaginationModelChange={(model) => handlePageChange(model.page + 1)}
          rowCount={pagination.total}
          paginationMode="server"
          sortingMode="server"
          onSortModelChange={(model) => {
            if (model.length > 0) {
              handleSort(model[0].field, model[0].sort);
            }
          }}
          disableRowSelectionOnClick
        />
      </Box>
    </Container>
  );
}

UserListPage.propTypes = {};
```

## Verification Steps

1. **Backend**: Run `npm run test` — verify all service tests pass
2. **API**: Start server, call `GET /api/v1/users?page=1&limit=20` with Admin token → expect 200 with user list
3. **API**: Call `GET /api/v1/users` without token → expect 401
4. **API**: Call `GET /api/v1/users` with Staff token → expect 403
5. **API**: Call `GET /api/v1/users?role=volunteer` → expect only volunteers
6. **API**: Call `GET /api/v1/users?search=nguyen` → expect case-insensitive results
7. **Frontend**: Render UserListPage → verify table, search, filter, pagination work
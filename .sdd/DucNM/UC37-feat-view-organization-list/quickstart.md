# Quickstart: View Organization List (UC37)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-02

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- Prisma CLI installed
- Backend server running on port 5000
- **Reusable from UC31**: `optionalAuth.middleware.js`
- **Cross-module awareness**: UC37 phục vụ UC11 (Filter Event — NamLD). Guest và Volunteer cần xem organizations active.

## Database

### 1. Prisma Schema (`backend/prisma/schema.prisma`)

Thêm model Organization:

```prisma
model Organization {
  organization_id Int      @id @default(autoincrement())
  name            String   @unique @db.VarChar(255)
  description     String?  @db.Text
  address         String?  @db.VarChar(500)
  contact_phone   String?  @db.VarChar(20)
  contact_email   String?  @db.VarChar(255)
  website         String?  @db.VarChar(500)
  logo_url        String?  @db.VarChar(500)
  is_active       Boolean  @default(true)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  @@map("organizations")
}
```

Chạy migration:

```bash
npx prisma migrate dev --name add_organization_model
npx prisma generate
```

## Backend Implementation Order

### 1. Zod Validator (`backend/src/validators/organization.validator.js`)

```javascript
import { z } from 'zod';

export const getOrganizationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional()
});
```

### 2. Repository (`backend/src/repositories/organization.repository.js`)

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function findOrganizations({ skip, take, where }) {
  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      skip,
      take,
      where,
      orderBy: { name: 'asc' }
    }),
    prisma.organization.count({ where })
  ]);
  return { organizations, total };
}
```

### 3. Service (`backend/src/services/organization.service.js`)

```javascript
import { getOrganizationsQuerySchema } from '../validators/organization.validator.js';
import { findOrganizations } from '../repositories/organization.repository.js';
import { ServiceError } from '../utils/response.util.js';

export async function getOrganizations(query, currentUser) {
  const parsed = getOrganizationsQuerySchema.safeParse(query);
  if (!parsed.success) {
    const field = parsed.error.errors[0].path[0];
    throw new ServiceError(
      `Tham số ${field} không hợp lệ`,
      400,
      `INVALID_${String(field).toUpperCase()}`
    );
  }

  const { page, limit, search } = parsed.data;
  const skip = (page - 1) * limit;

  // Build where clause
  const where = { AND: [] };

  // Role-based visibility
  if (!currentUser) {
    where.AND.push({ is_active: true }); // Guest
  } else {
    const role = currentUser.role || currentUser.role_name;
    if (role !== 'ADMIN') {
      where.AND.push({ is_active: true }); // Manager/Staff/Volunteer
    }
    // Admin — no filter, see all
  }

  // Search
  if (search) {
    where.AND.push({
      name: { contains: search, mode: 'insensitive' }
    });
  }

  if (where.AND.length === 0) delete where.AND;

  const { organizations, total } = await findOrganizations({ skip, take: limit, where });

  return {
    organizations,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 }
  };
}
```

### 4. Controller (`backend/src/controllers/organization.controller.js`)

```javascript
import { getOrganizations } from '../services/organization.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export async function getOrganizationsHandler(req, res) {
  try {
    const result = await getOrganizations(req.query, req.user);
    const message = result.organizations.length > 0
      ? 'Lấy danh sách tổ chức thành công'
      : 'Chưa có tổ chức nào. Hãy thêm tổ chức đầu tiên!';
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

### 5. Routes (`backend/src/routes/organization.routes.js`)

```javascript
import { Router } from 'express';
import optionalAuth from '../middleware/optionalAuth.middleware.js';
import { getOrganizationsHandler } from '../controllers/organization.controller.js';

const router = Router();

/**
 * @swagger
 * /api/v1/organizations:
 *   get:
 *     summary: Lấy danh sách tổ chức
 *     description: |
 *       Trả về danh sách tổ chức với phân trang, tìm kiếm, role-based visibility.
 *       Hỗ trợ optional auth — phục vụ UC11 (Filter Event).
 *     tags: [Organization Management]
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
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation
 *       500:
 *         description: Lỗi server
 */
router.get('/', optionalAuth, getOrganizationsHandler);

export default router;
```

### 6. Update `backend/src/app.js`

```javascript
import organizationRoutes from './routes/organization.routes.js';
app.use('/api/v1/organizations', organizationRoutes);
```

### 7. Tests & Integration Tests

```javascript
// Unit tests:
// 1. getOrganizations với user = null (Guest) → chỉ active
// 2. getOrganizations với role VOLUNTEER → chỉ active
// 3. getOrganizations với role STAFF → chỉ active
// 4. getOrganizations với role MANAGER → chỉ active
// 5. getOrganizations với role ADMIN → tất cả
// 6. getOrganizations với search → lọc theo tên
// 7. getOrganizations với page/limit → phân trang

// Integration tests:
// 1. GET không token (Guest) → 200 + only active
// 2. GET với token Admin → 200 + all
// 3. GET với token Manager/Staff → 200 + only active
// 4. GET với token Volunteer → 200 + only active
// 5. GET với search → kết quả chính xác
```

## Frontend Implementation Order

### 1. API Client (`frontend/src/api/organizationApi.js`)

```javascript
import axiosApi from './axiosApi';

export async function getOrganizations({ page = 1, limit = 20, search = '' } = {}) {
  const params = { page, limit };
  if (search) params.search = search;
  const response = await axiosApi.get('/organizations', { params });
  return response.data.data;
}
```

### 2. Hook (`frontend/src/hooks/useOrganizations.js`)

```javascript
import { useState, useEffect, useCallback } from 'react';
import { getOrganizations } from '../api/organizationApi';

export function useOrganizations() {
  const [organizations, setOrganizations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getOrganizations({ page, limit: 20, search });
      setOrganizations(result.organizations);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchOrganizations(); }, [fetchOrganizations]);

  return {
    organizations, pagination, loading, error, search, page,
    handleSearch: (v) => { setSearch(v); setPage(1); },
    handlePageChange: (p) => setPage(p),
    refetch: fetchOrganizations
  };
}
```

## Integration với UC11 (Filter Event — NamLD)

```javascript
import { getOrganizations } from '.../organizationApi';

// Fetch organizations — Guest và Volunteer đều gọi được (optional auth)
const [organizations, setOrganizations] = useState([]);
useEffect(() => {
  getOrganizations({ limit: 100 }).then(res => setOrganizations(res.organizations)).catch(console.error);
}, []);
```

## Verification Steps

1. **API**: `GET /api/v1/organizations` không token → 200 + only active
2. **API**: `GET /api/v1/organizations` với token Admin → 200 + all
3. **API**: `GET /api/v1/organizations` với token Manager → 200 + only active
4. **API**: `GET /api/v1/organizations?search=hoa` → kết quả tìm kiếm
5. **API**: `GET /api/v1/organizations?page=1&limit=10` → phân trang
6. **Cross-module**: Guest gọi API organizations thành công (phục vụ UC11)
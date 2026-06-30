# Quickstart: View Category List (UC31)

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- Prisma CLI installed
- Backend server running on port 5000
- **Cross-module awareness**: UC31 phục vụ UC11 (Filter Event — NamLD). Guest và Volunteer cần xem categories active qua endpoint này.

## Database

### 1. Prisma Schema (`backend/prisma/schema.prisma`)

Thêm model Category:

```prisma
model Category {
  category_id Int      @id @default(autoincrement())
  name        String   @db.VarChar(255)
  description String?  @db.Text
  type        String   @db.VarChar(50)
  is_active   Boolean  @default(true)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@map("categories")
}
```

Chạy migration:

```bash
npx prisma migrate dev --name add_category_model
npx prisma generate
```

## Backend Implementation Order

### 1. Optional Auth Middleware (`backend/src/middleware/optionalAuth.middleware.js`)

Middleware này giống `authMiddleware` nhưng không trả về 401 nếu không có token — chỉ set `req.user = null`:

```javascript
import { verifyAccessToken } from "../utils/jwt.util.js";

export default function optionalAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    req.user = null;
    return next();
  }

  const decode = verifyAccessToken(token);
  if (!decode) {
    req.user = null;
    return next();
  }

  req.user = decode;
  next();
}
```

### 2. Repository (`backend/src/repositories/category.repository.js`)

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function findAllCategories(where = {}) {
  return prisma.category.findMany({
    where,
    orderBy: { name: 'asc' }
  });
}
```

### 3. Service (`backend/src/services/category.service.js`)

Role-based visibility: nếu user là Manager/Admin → thấy tất cả; nếu Staff/Volunteer/Guest → chỉ active:

```javascript
import { findAllCategories } from '../repositories/category.repository.js';

export async function getCategories(currentUser) {
  const where = {};

  // Role-based visibility
  if (!currentUser) {
    // Guest (no auth) — active only
    where.is_active = true;
  } else {
    const role = currentUser.role || currentUser.role_name;
    if (role !== 'MANAGER' && role !== 'ADMIN') {
      // Staff/Volunteer — active only
      where.is_active = true;
    }
    // Manager/Admin — no filter, see all
  }

  const categories = await findAllCategories(where);

  return categories;
}
```

### 4. Controller (`backend/src/controllers/category.controller.js`)

```javascript
import { getCategories } from '../services/category.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export async function getCategoriesHandler(req, res) {
  try {
    const categories = await getCategories(req.user);
    const message = categories.length > 0
      ? 'Lấy danh sách danh mục thành công'
      : 'Không có danh mục nào';
    return res.status(200).json(
      successResponse({ categories }, message)
    );
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

### 5. Routes (`backend/src/routes/category.routes.js`)

```javascript
import { Router } from 'express';
import optionalAuth from '../middleware/optionalAuth.middleware.js';
import { getCategoriesHandler } from '../controllers/category.controller.js';

const router = Router();

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Lấy danh sách danh mục
 *     description: |
 *       Trả về danh sách danh mục (categories). Hỗ trợ optional auth:
 *       - Guest (không token): active categories (public)
 *       - Volunteer/Staff: active categories
 *       - Manager/Admin: tất cả (active + inactive)
 *       Endpoint này phục vụ UC11 (Filter Event) cho Guest và Volunteer.
 *     tags: [Category Management]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       500:
 *         description: Lỗi server
 */
router.get('/', optionalAuth, getCategoriesHandler);

export default router;
```

### 6. Update `backend/src/app.js`

```javascript
import categoryRoutes from './routes/category.routes.js';

// Thêm dòng này:
app.use('/api/v1/categories', categoryRoutes);
```

### 7. Tests (`backend/tests/category/category.service.test.js`)

```javascript
// Test cases:
// 1. getCategories với user = null (Guest) → chỉ active categories
// 2. getCategories với role VOLUNTEER → chỉ active categories
// 3. getCategories với role STAFF → chỉ active categories
// 4. getCategories với role MANAGER → tất cả categories
// 5. getCategories với role ADMIN → tất cả categories
// 6. getCategories khi không có category nào → mảng rỗng
```

### 8. Integration Tests (`backend/tests/category/category.api.test.js`)

```javascript
// Test cases:
// 1. GET /api/v1/categories không token (Guest) → 200 + only active
// 2. GET /api/v1/categories với token Manager → 200 + all (active + inactive)
// 3. GET /api/v1/categories với token Admin → 200 + all
// 4. GET /api/v1/categories với token Staff → 200 + only active
// 5. GET /api/v1/categories với token Volunteer → 200 + only active
```

## Frontend Implementation Order

### 1. API Client (`frontend/src/api/categoryApi.js`)

```javascript
import axiosApi from './axiosApi';

export async function getCategories() {
  const response = await axiosApi.get('/categories');
  return response.data.data.categories;
}
```

**Lưu ý cho UC11**: Khi Guest gọi `getCategories()`, Axios sẽ gửi request không kèm cookie — BE optionalAuth middleware tự xử lý. Không cần cấu hình gì thêm.

### 2. Hook (`frontend/src/hooks/useCategories.js`)

```javascript
import { useState, useEffect } from 'react';
import { getCategories } from '../api/categoryApi';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return { categories, loading, error };
}
```

**Lưu ý cho UC11**: NamLD có thể tái sử dụng hook `useCategories` này trong Event List page để lấy danh sách category cho filter dropdown.

### 3. CategoryListPage Component (`frontend/src/components/pages/CategoryListPage.jsx`)

```jsx
import React from 'react';
import {
  Container, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress, Box
} from '@mui/material';
import { useCategories } from '../../hooks/useCategories';

export default function CategoryListPage() {
  const { categories, loading, error } = useCategories();

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Container maxWidth="md" sx={{ mt: 4 }}><Typography color="error">{error}</Typography></Container>;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Category Management</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow><TableCell colSpan={4}>No categories found</TableCell></TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.category_id}>
                  <TableCell>{cat.category_id}</TableCell>
                  <TableCell>{cat.name}</TableCell>
                  <TableCell><Chip label={cat.type} size="small" /></TableCell>
                  <TableCell>
                    <Chip label={cat.is_active ? 'Active' : 'Inactive'} color={cat.is_active ? 'success' : 'default'} size="small" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

CategoryListPage.propTypes = {};
```

### 4. Add Route in `frontend/src/App.js`

```jsx
import CategoryListPage from './components/pages/CategoryListPage';

// Thêm route:
<Route path="/categories" element={<CategoryListPage />} />
```

## Integration với UC11 (Filter Event — NamLD)

Để UC11 có thể sử dụng categories cho filter dropdown, NamLD cần:

1. Import `getCategories` từ `categoryApi.js`
2. Gọi `getCategories()` trong Event List page (không cần token — optional auth handle)
3. Hiển thị danh sách category trong filter dropdown

```javascript
// Trong Event List page của NamLD:
import { getCategories } from '../../../DucNM/UC31-feat-view-category-list/frontend/src/api/categoryApi';
// Hoặc import từ đường dẫn chính thức sau khi merge

// Fetch categories khi component mount
const [categories, setCategories] = useState([]);
useEffect(() => {
  getCategories().then(setCategories).catch(console.error);
}, []);

// Render filter dropdown
<Select>
  {categories.map(cat => (
    <MenuItem key={cat.category_id} value={cat.category_id}>{cat.name}</MenuItem>
  ))}
</Select>
```

## Verification Steps

1. **API**: `GET /api/v1/categories` không token → 200 + only active categories
2. **API**: `GET /api/v1/categories` với token Manager/Admin → 200 + all (active + inactive)
3. **API**: `GET /api/v1/categories` với token Staff → 200 + only active
4. **API**: `GET /api/v1/categories` với token Volunteer → 200 + only active
5. **Database**: Verify Category model migrated successfully
6. **Frontend**: Navigate to `/categories` → verify table renders correctly
7. **Cross-module**: Verify Guest có thể gọi API categories từ browser (no 401 error)
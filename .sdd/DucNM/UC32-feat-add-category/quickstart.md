# Quickstart: Add Category (UC32)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-01

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- **UC31 infrastructure available**: Category model in Prisma schema, category.repository.js, category.service.js, category.controller.js, category.routes.js, categoryApi.js
- authorize middleware working (from UC26)
- Backend server running on port 5000

## Backend Implementation Order

### 1. Update Prisma Schema — Add Composite Unique (`backend/prisma/schema.prisma`)

```prisma
model Category {
  category_id Int      @id @default(autoincrement())
  name        String   @db.VarChar(255)
  description String?  @db.Text
  type        String   @db.VarChar(50)
  is_active   Boolean  @default(true)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@unique([name, type])   // Composite unique constraint
  @@map("categories")
}
```

Chạy migration:

```bash
npx prisma migrate dev --name add_category_unique_constraint
npx prisma generate
```

### 2. Add Zod Schema (`backend/src/validators/category.validator.js`)

```javascript
import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  type: z.enum(['location', 'event_type', 'time_frame'], {
    errorMap: () => ({ message: 'Type must be: location, event_type, or time_frame' })
  })
});
```

### 3. Add Repository Methods (`backend/src/repositories/category.repository.js`)

Thêm vào file đã có từ UC31:

```javascript
export async function findCategoryByNameAndType(name, type) {
  return prisma.category.findFirst({
    where: { name, type }
  });
}

export async function createCategory(data) {
  return prisma.category.create({
    data: {
      name: data.name,
      description: data.description || null,
      type: data.type,
      is_active: true
    }
  });
}
```

### 4. Add `createCategory` to Service (`backend/src/services/category.service.js`)

Thêm vào file đã có từ UC31:

```javascript
import { createCategorySchema } from '../validators/category.validator.js';
import { findCategoryByNameAndType, createCategory } from '../repositories/category.repository.js';
import { ServiceError } from '../utils/response.util.js';

export async function createCategoryService(data) {
  // 1. Validate input
  const parsed = createCategorySchema.safeParse(data);
  if (!parsed.success) {
    const details = parsed.error.errors.map(err => ({
      field: err.path[0],
      message: err.message
    }));
    throw new ServiceError('Dữ liệu đầu vào không hợp lệ', 400, 'VALIDATION_ERROR', details);
  }

  const { name, description, type } = parsed.data;

  // 2. Check unique name in same type
  const existing = await findCategoryByNameAndType(name, type);
  if (existing) {
    throw new ServiceError('Category name already exists in this type.', 409, 'CATEGORY_EXISTS');
  }

  // 3. Create category
  const category = await createCategory({ name, description, type });

  return category;
}
```

### 5. Add `createCategoryHandler` to Controller (`backend/src/controllers/category.controller.js`)

Thêm vào file đã có từ UC31:

```javascript
import { createCategoryService } from '../services/category.service.js';

export async function createCategoryHandler(req, res) {
  try {
    const category = await createCategoryService(req.body);
    return res.status(201).json(successResponse(category, 'Tạo danh mục thành công'));
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

### 6. Add Route (`backend/src/routes/category.routes.js`)

Thêm route POST vào file đã có từ UC31:

```javascript
import { Router } from 'express';
import optionalAuth from '../middleware/optionalAuth.middleware.js';
import authMiddleware from '../middleware/auth.middleware.js';
import authorize from '../middleware/authorize.middleware.js';
import { getCategoriesHandler, createCategoryHandler } from '../controllers/category.controller.js';

const router = Router();

// Route hiện tại từ UC31 — public (optional auth)
router.get('/', optionalAuth, getCategoriesHandler);

// Route mới cho UC32 — Manager/Admin only
router.post('/', authMiddleware, authorize('MANAGER', 'ADMIN'), createCategoryHandler);

export default router;
```

### 7. Tests (`backend/tests/category/category.service.test.js`)

```javascript
// Test cases bổ sung cho UC32:
// 1. createCategory với dữ liệu hợp lệ → trả về category mới
// 2. createCategory với tên đã tồn tại trong cùng type → throw ServiceError 409
// 3. createCategory với type không hợp lệ → throw ServiceError 400
// 4. createCategory với name empty → throw ServiceError 400
// 5. createCategory với tên tồn tại ở type khác → thành công (không conflict)
```

### 8. Integration Tests (`backend/tests/category/category.api.test.js`)

```javascript
// Test cases bổ sung cho UC32:
// 1. POST /api/v1/categories với dữ liệu hợp lệ + Manager token → 201
// 2. POST /api/v1/categories với dữ liệu hợp lệ + Admin token → 201
// 3. POST /api/v1/categories với tên đã tồn tại → 409
// 4. POST /api/v1/categories với type sai → 400
// 5. POST /api/v1/categories với Staff token → 403
// 6. POST /api/v1/categories với Volunteer token → 403
// 7. POST /api/v1/categories không token → 401
```

## Frontend Implementation Order

### 1. Add `createCategory` to API Client (`frontend/src/api/categoryApi.js`)

```javascript
export async function createCategory(data) {
  const response = await axiosApi.post('/categories', data);
  return response.data.data;
}
```

### 2. Custom Hook (`frontend/src/hooks/useCreateCategory.js`)

```javascript
import { useState } from 'react';
import { createCategory } from '../api/categoryApi';

export function useCreateCategory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleCreateCategory = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await createCategory(data);
      setSuccess(true);
      return result;
    } catch (err) {
      const message = err.response?.data?.message || 'Có lỗi xảy ra';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { handleCreateCategory, loading, error, success, reset: () => { setError(null); setSuccess(false); } };
}
```

### 3. AddCategoryPage Component (`frontend/src/components/pages/AddCategoryPage.jsx`)

```jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, TextField, Button, MenuItem, Alert, Box, CircularProgress
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateCategory } from '../../hooks/useCreateCategory';

const schema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  type: z.enum(['location', 'event_type', 'time_frame'], {
    errorMap: () => ({ message: 'Type must be: location, event_type, or time_frame' })
  })
});

const types = [
  { value: 'location', label: 'Location' },
  { value: 'event_type', label: 'Event Type' },
  { value: 'time_frame', label: 'Time Frame' }
];

export default function AddCategoryPage() {
  const navigate = useNavigate();
  const { handleCreateCategory, loading, error, success } = useCreateCategory();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data) => {
    try {
      await handleCreateCategory(data);
    } catch (e) { /* handled in hook */ }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Button onClick={() => navigate('/categories')} sx={{ mb: 2 }}>← Back to Category List</Button>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Add New Category</Typography>

        {success && <Alert severity="success" sx={{ mb: 2 }}>Category created successfully!</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField fullWidth label="Name" {...register('name')} error={!!errors.name} helperText={errors.name?.message} sx={{ mb: 2 }} />
          <TextField fullWidth label="Description" multiline rows={3} {...register('description')} sx={{ mb: 2 }} />
          <TextField fullWidth label="Type" select {...register('type')} error={!!errors.type} helperText={errors.type?.message} sx={{ mb: 3 }}>
            {types.map((t) => (
              <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => navigate('/categories')}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Create Category'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

AddCategoryPage.propTypes = {};
```

### 4. Add Route in `frontend/src/App.js`

```jsx
import AddCategoryPage from './components/pages/AddCategoryPage';

// Thêm route:
<Route path="/categories/add" element={<AddCategoryPage />} />
```

## Verification Steps

1. **API**: `POST /api/v1/categories` với dữ liệu hợp lệ + Manager token → 201
2. **API**: `POST /api/v1/categories` với tên đã tồn tại trong cùng type → 409
3. **API**: `POST /api/v1/categories` với type sai → 400
4. **API**: `POST /api/v1/categories` với Staff token → 403
5. **API**: `POST /api/v1/categories` không token → 401
6. **Database**: Verify composite unique constraint hoạt động
7. **Frontend**: Navigate to `/categories/add` → fill form → submit → verify success
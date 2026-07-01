# Quickstart: Edit Category (UC33)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-01

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- **UC31 + UC32 infrastructure available**: Category model, category.repository.js, category.service.js, category.controller.js, category.routes.js, categoryApi.js, validators
- authorize middleware working (from UC26)
- Backend server running on port 5000

## Backend Implementation Order

### 1. Add Zod Schema (`backend/src/validators/category.validator.js`)

Thêm updateCategorySchema vào file đã có từ UC32:

```javascript
import { z } from 'zod';

// Schema hiện có từ UC32
export const createCategorySchema = z.object({ ... });

// Schema mới cho UC33 — tất cả fields optional (PATCH), type không được phép
export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name cannot be empty').optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'No fields to update.'
});
```

### 2. Add Repository Methods (`backend/src/repositories/category.repository.js`)

Thêm vào file đã có từ UC31/UC32:

```javascript
export async function findCategoryById(categoryId) {
  return prisma.category.findUnique({
    where: { category_id: categoryId }
  });
}

export async function findCategoryByNameAndType(name, type, excludeId = null) {
  const where = { name, type };
  if (excludeId) {
    where.NOT = { category_id: excludeId };
  }
  return prisma.category.findFirst({ where });
}

export async function updateCategory(categoryId, data) {
  return prisma.category.update({
    where: { category_id: categoryId },
    data
  });
}
```

### 3. Add `updateCategoryService` to Service (`backend/src/services/category.service.js`)

Thêm vào file đã có từ UC31/UC32:

```javascript
import { updateCategorySchema } from '../validators/category.validator.js';
import {
  findCategoryById,
  findCategoryByNameAndType,
  updateCategory
} from '../repositories/category.repository.js';
import { ServiceError } from '../utils/response.util.js';

export async function updateCategoryService(categoryId, data) {
  // 1. Validate input
  const parsed = updateCategorySchema.safeParse(data);
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

  // 2. Check category exists
  const existingCategory = await findCategoryById(categoryId);
  if (!existingCategory) {
    throw new ServiceError('Category not found.', 404, 'CATEGORY_NOT_FOUND');
  }

  // 3. Check unique name in same type (if name is being changed)
  if (updateData.name && updateData.name !== existingCategory.name) {
    const conflict = await findCategoryByNameAndType(
      updateData.name,
      existingCategory.type,
      categoryId // exclude self
    );
    if (conflict) {
      throw new ServiceError('Category name already exists in this type.', 409, 'CATEGORY_EXISTS');
    }
  }

  // 4. Update category
  const category = await updateCategory(categoryId, updateData);

  return category;
}
```

### 4. Add `updateCategoryHandler` to Controller (`backend/src/controllers/category.controller.js`)

Thêm vào file đã có từ UC31/UC32:

```javascript
import { updateCategoryService } from '../services/category.service.js';

export async function updateCategoryHandler(req, res) {
  try {
    const category = await updateCategoryService(
      Number(req.params.id),
      req.body
    );
    return res.status(200).json(successResponse(category, 'Cập nhật danh mục thành công'));
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

### 5. Add Route (`backend/src/routes/category.routes.js`)

Thêm route PATCH vào file đã có từ UC31/UC32:

```javascript
import { Router } from 'express';
import optionalAuth from '../middleware/optionalAuth.middleware.js';
import authMiddleware from '../middleware/auth.middleware.js';
import authorize from '../middleware/authorize.middleware.js';
import {
  getCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler
} from '../controllers/category.controller.js';

const router = Router();

// Route hiện tại
router.get('/', optionalAuth, getCategoriesHandler);
router.post('/', authMiddleware, authorize('MANAGER', 'ADMIN'), createCategoryHandler);

// Route mới cho UC33
router.patch('/:id', authMiddleware, authorize('MANAGER', 'ADMIN'), updateCategoryHandler);

export default router;
```

### 6. Tests (`backend/tests/category/category.service.test.js`)

```javascript
// Test cases bổ sung cho UC33:
// 1. updateCategory với dữ liệu hợp lệ → trả về category đã cập nhật
// 2. updateCategory với ID không tồn tại → throw ServiceError 404
// 3. updateCategory với body rỗng → throw ServiceError 400 NO_FIELDS_TO_UPDATE
// 4. updateCategory với tên trùng trong cùng type → throw ServiceError 409
// 5. updateCategory với tên trùng ở type khác → thành công
// 6. updateCategory chỉ update is_active → thành công
```

### 7. Integration Tests (`backend/tests/category/category.api.test.js`)

```javascript
// Test cases bổ sung cho UC33:
// 1. PATCH /api/v1/categories/1 với dữ liệu hợp lệ + Manager token → 200
// 2. PATCH /api/v1/categories/999 với Manager token → 404
// 3. PATCH /api/v1/categories/1 với body rỗng → 400
// 4. PATCH /api/v1/categories/1 với tên trùng → 409
// 5. PATCH /api/v1/categories/1 với Staff token → 403
// 6. PATCH /api/v1/categories/1 không token → 401
```

## Frontend Implementation Order

### 1. Add `updateCategory` to API Client (`frontend/src/api/categoryApi.js`)

```javascript
export async function updateCategory(id, data) {
  const response = await axiosApi.patch(`/categories/${id}`, data);
  return response.data.data;
}
```

### 2. Custom Hook (`frontend/src/hooks/useUpdateCategory.js`)

```javascript
import { useState } from 'react';
import { updateCategory } from '../api/categoryApi';

export function useUpdateCategory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleUpdateCategory = async (id, data) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await updateCategory(id, data);
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

  return { handleUpdateCategory, loading, error, success, reset: () => { setError(null); setSuccess(false); } };
}
```

### 3. EditCategoryPage Component (`frontend/src/components/pages/EditCategoryPage.jsx`)

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
import { useUpdateCategory } from '../../hooks/useUpdateCategory';
import { getCategoryById } from '../../api/categoryApi';

const schema = z.object({
  name: z.string().min(1, 'Category name cannot be empty'),
  description: z.string().optional(),
  is_active: z.boolean()
});

export default function EditCategoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { handleUpdateCategory, loading, error, success } = useUpdateCategory();
  const [pageLoading, setPageLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState(null);
  const [categoryType, setCategoryType] = React.useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema)
  });

  // Fetch category data to pre-fill form
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const category = await getCategoryById(id);
        setCategoryType(category.type);
        reset({
          name: category.name,
          description: category.description || '',
          is_active: category.is_active
        });
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Failed to load category');
      } finally {
        setPageLoading(false);
      }
    };
    fetchCategory();
  }, [id, reset]);

  const onSubmit = async (data) => {
    try {
      await handleUpdateCategory(id, data);
    } catch (e) { /* handled in hook */ }
  };

  if (pageLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (fetchError) return <Container maxWidth="sm" sx={{ mt: 4 }}><Alert severity="error">{fetchError}</Alert></Container>;

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Button onClick={() => navigate('/categories')} sx={{ mb: 2 }}>← Back to Category List</Button>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Edit Category</Typography>

        {success && <Alert severity="success" sx={{ mb: 2 }}>Category updated successfully!</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField fullWidth label="Name" {...register('name')} error={!!errors.name} helperText={errors.name?.message} sx={{ mb: 2 }} />
          <TextField fullWidth label="Description" multiline rows={3} {...register('description')} sx={{ mb: 2 }} />
          <TextField fullWidth label="Type" value={categoryType} disabled sx={{ mb: 2 }} />
          <FormControlLabel control={<Switch defaultChecked {...register('is_active')} />} label="Active" sx={{ mb: 3, display: 'block' }} />
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => navigate('/categories')}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

EditCategoryPage.propTypes = {};
```

### 4. Add Route in `frontend/src/App.js`

```jsx
import EditCategoryPage from './components/pages/EditCategoryPage';

// Thêm route:
<Route path="/categories/:id/edit" element={<EditCategoryPage />} />
```

## Verification Steps

1. **API**: `PATCH /api/v1/categories/1` với name mới + Manager token → 200 + updated data
2. **API**: `PATCH /api/v1/categories/999` với Manager token → 404
3. **API**: `PATCH /api/v1/categories/1` với body rỗng → 400
4. **API**: `PATCH /api/v1/categories/1` với tên trùng trong cùng type → 409
5. **API**: `PATCH /api/v1/categories/1` với Staff token → 403
6. **API**: `PATCH /api/v1/categories/1` không token → 401
7. **API**: `PATCH /api/v1/categories/1` với is_active = false → category inactive
8. **Frontend**: Navigate to `/categories/1/edit` → form pre-filled → edit → submit → verify success
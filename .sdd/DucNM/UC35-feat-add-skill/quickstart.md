# Quickstart: Add Skill (UC35)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-02

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- **UC34 infrastructure available**: Skill model in Prisma schema, skill.repository.js, skill.service.js, skill.controller.js, skill.routes.js, skillApi.js
- authorize middleware working (from UC26)
- Backend server running on port 5000

## Backend Implementation Order

### 1. Add Zod Schema (`backend/src/validators/skill.validator.js`)

```javascript
import { z } from 'zod';

export const createSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  description: z.string().optional()
});
```

### 2. Add Repository Methods (`backend/src/repositories/skill.repository.js`)

Thêm vào file đã có từ UC34:

```javascript
export async function findSkillByName(name) {
  return prisma.skill.findUnique({
    where: { name }
  });
}

export async function createSkill(data) {
  return prisma.skill.create({
    data: {
      name: data.name,
      description: data.description || null,
      is_active: true
    }
  });
}
```

### 3. Add `createSkill` to Service (`backend/src/services/skill.service.js`)

Thêm vào file đã có từ UC34:

```javascript
import { createSkillSchema } from '../validators/skill.validator.js';
import { findSkillByName, createSkill } from '../repositories/skill.repository.js';
import { ServiceError } from '../utils/response.util.js';

export async function createSkillService(data) {
  // 1. Validate input
  const parsed = createSkillSchema.safeParse(data);
  if (!parsed.success) {
    const details = parsed.error.errors.map(err => ({
      field: err.path[0],
      message: err.message
    }));
    throw new ServiceError('Dữ liệu đầu vào không hợp lệ', 400, 'VALIDATION_ERROR', details);
  }

  const { name, description } = parsed.data;

  // 2. Check unique name
  const existing = await findSkillByName(name);
  if (existing) {
    throw new ServiceError('Skill name already exists.', 409, 'SKILL_EXISTS');
  }

  // 3. Create skill
  const skill = await createSkill({ name, description });

  return skill;
}
```

### 4. Add `createSkillHandler` to Controller (`backend/src/controllers/skill.controller.js`)

Thêm vào file đã có từ UC34:

```javascript
import { createSkillService } from '../services/skill.service.js';

export async function createSkillHandler(req, res) {
  try {
    const skill = await createSkillService(req.body);
    return res.status(201).json(successResponse(skill, 'Tạo kỹ năng thành công'));
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

### 5. Add Route (`backend/src/routes/skill.routes.js`)

Thêm route POST vào file đã có từ UC34:

```javascript
import { Router } from 'express';
import optionalAuth from '../middleware/optionalAuth.middleware.js';
import authMiddleware from '../middleware/auth.middleware.js';
import authorize from '../middleware/authorize.middleware.js';
import { getSkillsHandler, createSkillHandler } from '../controllers/skill.controller.js';

const router = Router();

// Route hiện tại từ UC34 — public (optional auth)
router.get('/', optionalAuth, getSkillsHandler);

// Route mới cho UC35 — Manager/Admin only
router.post('/', authMiddleware, authorize('MANAGER', 'ADMIN'), createSkillHandler);

export default router;
```

### 6. Tests (`backend/tests/skill/skill.service.test.js`)

```javascript
// Test cases bổ sung cho UC35:
// 1. createSkill với dữ liệu hợp lệ → trả về skill mới
// 2. createSkill với tên đã tồn tại → throw ServiceError 409 SKILL_EXISTS
// 3. createSkill với name empty → throw ServiceError 400
```

### 7. Integration Tests (`backend/tests/skill/skill.api.test.js`)

```javascript
// Test cases bổ sung cho UC35:
// 1. POST /api/v1/skills với dữ liệu hợp lệ + Manager token → 201
// 2. POST /api/v1/skills với dữ liệu hợp lệ + Admin token → 201
// 3. POST /api/v1/skills với tên đã tồn tại → 409
// 4. POST /api/v1/skills với Staff token → 403
// 5. POST /api/v1/skills không token → 401
```

## Frontend Implementation Order

### 1. Add `createSkill` to API Client (`frontend/src/api/skillApi.js`)

```javascript
export async function createSkill(data) {
  const response = await axiosApi.post('/skills', data);
  return response.data.data;
}
```

### 2. Custom Hook (`frontend/src/hooks/useCreateSkill.js`)

```javascript
import { useState } from 'react';
import { createSkill } from '../api/skillApi';

export function useCreateSkill() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleCreateSkill = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await createSkill(data);
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

  return { handleCreateSkill, loading, error, success, reset: () => { setError(null); setSuccess(false); } };
}
```

### 3. AddSkillPage Component (`frontend/src/components/pages/AddSkillPage.jsx`)

```jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, TextField, Button, Alert, Box, CircularProgress
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateSkill } from '../../hooks/useCreateSkill';

const schema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  description: z.string().optional()
});

export default function AddSkillPage() {
  const navigate = useNavigate();
  const { handleCreateSkill, loading, error, success } = useCreateSkill();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data) => {
    try {
      await handleCreateSkill(data);
    } catch (e) { /* handled in hook */ }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Button onClick={() => navigate('/skills')} sx={{ mb: 2 }}>← Back to Skill List</Button>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Add New Skill</Typography>

        {success && <Alert severity="success" sx={{ mb: 2 }}>Skill created successfully!</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField fullWidth label="Name" {...register('name')} error={!!errors.name} helperText={errors.name?.message} sx={{ mb: 2 }} />
          <TextField fullWidth label="Description" multiline rows={3} {...register('description')} sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => navigate('/skills')}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Create Skill'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

AddSkillPage.propTypes = {};
```

### 4. Add Route in `frontend/src/App.js`

```jsx
import AddSkillPage from './components/pages/AddSkillPage';

// Thêm route:
<Route path="/skills/add" element={<AddSkillPage />} />
```

## Verification Steps

1. **API**: `POST /api/v1/skills` với dữ liệu hợp lệ + Manager token → 201
2. **API**: `POST /api/v1/skills` với tên đã tồn tại → 409
3. **API**: `POST /api/v1/skills` với Staff token → 403
4. **API**: `POST /api/v1/skills` không token → 401
5. **Frontend**: Navigate to `/skills/add` → fill form → submit → verify success
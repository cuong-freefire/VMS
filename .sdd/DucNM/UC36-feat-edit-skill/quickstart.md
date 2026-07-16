# Quickstart: Edit Skill (UC36)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-02

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- **UC34 + UC35 infrastructure available**: Skill model, skill.repository.js, skill.service.js, skill.controller.js, skill.routes.js, skillApi.js, validators
- authorize middleware working (from UC26)
- Backend server running on port 5000

## Backend Implementation Order

### 1. Add Zod Schema (`backend/src/validators/skill.validator.js`)

Thêm updateSkillSchema vào file đã có từ UC35:

```javascript
import { z } from 'zod';

// Schema hiện có từ UC35
export const createSkillSchema = z.object({ ... });

// Schema mới cho UC36 — tất cả fields optional (PATCH)
export const updateSkillSchema = z.object({
  name: z.string().min(1, 'Skill name cannot be empty').optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'No fields to update.'
});
```

### 2. Add Repository Methods (`backend/src/repositories/skill.repository.js`)

Thêm vào file đã có từ UC34/UC35:

```javascript
export async function findSkillById(skillId) {
  return prisma.skill.findUnique({
    where: { skill_id: skillId }
  });
}

export async function findSkillByNameExcluding(name, excludeId) {
  return prisma.skill.findFirst({
    where: { name, NOT: { skill_id: excludeId } }
  });
}

export async function updateSkill(skillId, data) {
  return prisma.skill.update({
    where: { skill_id: skillId },
    data
  });
}
```

### 3. Add `updateSkillService` to Service (`backend/src/services/skill.service.js`)

Thêm vào file đã có từ UC34/UC35:

```javascript
import { updateSkillSchema } from '../validators/skill.validator.js';
import { findSkillById, findSkillByNameExcluding, updateSkill } from '../repositories/skill.repository.js';
import { ServiceError } from '../utils/response.util.js';

export async function updateSkillService(skillId, data) {
  // 1. Validate input
  const parsed = updateSkillSchema.safeParse(data);
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

  // 2. Check skill exists
  const existingSkill = await findSkillById(skillId);
  if (!existingSkill) {
    throw new ServiceError('Skill not found.', 404, 'SKILL_NOT_FOUND');
  }

  // 3. Check unique name (if name is being changed)
  if (updateData.name && updateData.name !== existingSkill.name) {
    const conflict = await findSkillByNameExcluding(updateData.name, skillId);
    if (conflict) {
      throw new ServiceError('Skill name already exists.', 409, 'SKILL_EXISTS');
    }
  }

  // 4. Update skill
  const skill = await updateSkill(skillId, updateData);

  return skill;
}
```

### 4. Add `updateSkillHandler` to Controller (`backend/src/controllers/skill.controller.js`)

Thêm vào file đã có từ UC34/UC35:

```javascript
import { updateSkillService } from '../services/skill.service.js';

export async function updateSkillHandler(req, res) {
  try {
    const skill = await updateSkillService(Number(req.params.id), req.body);
    return res.status(200).json(successResponse(skill, 'Cập nhật kỹ năng thành công'));
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

Thêm route PATCH vào file đã có từ UC34/UC35:

```javascript
import { Router } from 'express';
import optionalAuth from '../middleware/optionalAuth.middleware.js';
import authMiddleware from '../middleware/auth.middleware.js';
import authorize from '../middleware/authorize.middleware.js';
import { getSkillsHandler, createSkillHandler, updateSkillHandler } from '../controllers/skill.controller.js';

const router = Router();

// Route hiện tại
router.get('/', optionalAuth, getSkillsHandler);
router.post('/', authMiddleware, authorize('MANAGER', 'ADMIN'), createSkillHandler);

// Route mới cho UC36
router.patch('/:id', authMiddleware, authorize('MANAGER', 'ADMIN'), updateSkillHandler);

export default router;
```

### 6. Tests (`backend/tests/skill/skill.service.test.js`)

```javascript
// Test cases bổ sung cho UC36:
// 1. updateSkill với dữ liệu hợp lệ → trả về skill đã cập nhật
// 2. updateSkill với ID không tồn tại → throw ServiceError 404
// 3. updateSkill với body rỗng → throw ServiceError 400 NO_FIELDS_TO_UPDATE
// 4. updateSkill với tên trùng → throw ServiceError 409 SKILL_EXISTS
// 5. updateSkill chỉ update is_active → thành công
```

### 7. Integration Tests (`backend/tests/skill/skill.api.test.js`)

```javascript
// Test cases bổ sung cho UC36:
// 1. PATCH /api/v1/skills/1 với dữ liệu hợp lệ + Manager token → 200
// 2. PATCH /api/v1/skills/999 với Manager token → 404
// 3. PATCH /api/v1/skills/1 với body rỗng → 400
// 4. PATCH /api/v1/skills/1 với tên trùng → 409
// 5. PATCH /api/v1/skills/1 với Staff token → 403
// 6. PATCH /api/v1/skills/1 không token → 401
```

## Frontend Implementation Order

### 1. Add `updateSkill` to API Client (`frontend/src/api/skillApi.js`)

```javascript
export async function updateSkill(id, data) {
  const response = await axiosApi.patch(`/skills/${id}`, data);
  return response.data.data;
}
```

### 2. Custom Hook (`frontend/src/hooks/useUpdateSkill.js`)

```javascript
import { useState } from 'react';
import { updateSkill } from '../api/skillApi';

export function useUpdateSkill() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleUpdateSkill = async (id, data) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await updateSkill(id, data);
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

  return { handleUpdateSkill, loading, error, success, reset: () => { setError(null); setSuccess(false); } };
}
```

### 3. EditSkillPage Component (`frontend/src/components/pages/EditSkillPage.jsx`)

```jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, TextField, Button, Alert, Box,
  CircularProgress, Switch, FormControlLabel
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateSkill } from '../../hooks/useUpdateSkill';
import { getSkillById } from '../../api/skillApi';

const schema = z.object({
  name: z.string().min(1, 'Skill name cannot be empty'),
  description: z.string().optional(),
  is_active: z.boolean()
});

export default function EditSkillPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { handleUpdateSkill, loading, error, success } = useUpdateSkill();
  const [pageLoading, setPageLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema)
  });

  // Fetch skill data to pre-fill form
  useEffect(() => {
    const fetchSkill = async () => {
      try {
        const skill = await getSkillById(id);
        reset({
          name: skill.name,
          description: skill.description || '',
          is_active: skill.is_active
        });
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Failed to load skill');
      } finally {
        setPageLoading(false);
      }
    };
    fetchSkill();
  }, [id, reset]);

  const onSubmit = async (data) => {
    try {
      await handleUpdateSkill(id, data);
    } catch (e) { /* handled in hook */ }
  };

  if (pageLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (fetchError) return <Container maxWidth="sm" sx={{ mt: 4 }}><Alert severity="error">{fetchError}</Alert></Container>;

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Button onClick={() => navigate('/skills')} sx={{ mb: 2 }}>← Back to Skill List</Button>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Edit Skill</Typography>

        {success && <Alert severity="success" sx={{ mb: 2 }}>Skill updated successfully!</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField fullWidth label="Name" {...register('name')} error={!!errors.name} helperText={errors.name?.message} sx={{ mb: 2 }} />
          <TextField fullWidth label="Description" multiline rows={3} {...register('description')} sx={{ mb: 2 }} />
          <FormControlLabel control={<Switch defaultChecked {...register('is_active')} />} label="Active" sx={{ mb: 3, display: 'block' }} />
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => navigate('/skills')}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

EditSkillPage.propTypes = {};
```

### 4. Add Route in `frontend/src/App.js`

```jsx
import EditSkillPage from './components/pages/EditSkillPage';

// Thêm route:
<Route path="/skills/:id/edit" element={<EditSkillPage />} />
```

## Verification Steps

1. **API**: `PATCH /api/v1/skills/1` với name mới + Manager token → 200 + updated data
2. **API**: `PATCH /api/v1/skills/999` với Manager token → 404
3. **API**: `PATCH /api/v1/skills/1` với body rỗng → 400
4. **API**: `PATCH /api/v1/skills/1` với tên trùng → 409
5. **API**: `PATCH /api/v1/skills/1` với Staff token → 403
6. **API**: `PATCH /api/v1/skills/1` không token → 401
7. **API**: `PATCH /api/v1/skills/1` với is_active = false → skill inactive
8. **Frontend**: Navigate to `/skills/1/edit` → form pre-filled → edit → submit → verify success
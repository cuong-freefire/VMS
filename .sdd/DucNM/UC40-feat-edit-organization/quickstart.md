# Quickstart: Edit Organization (UC40)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-04

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- **UC37/UC38/UC39 infrastructure available**: Organization model, organization.repository.js, organization.service.js, organization.controller.js, organization.routes.js, organizationApi.js, Cloudinary config, upload middleware
- Event model with `organization_id` foreign key in Prisma schema
- authorize middleware working (from UC26)
- Backend server running on port 5000

## Backend Implementation Order

### 1. Add Zod Schema (`backend/src/validators/organization.validator.js`)

Thêm updateOrganizationSchema vào file đã có từ UC37/UC39:

```javascript
import { z } from 'zod';

// Schema hiện có
export const getOrganizationsQuerySchema = z.object({ ... });
export const createOrganizationSchema = z.object({ ... });

// Schema mới cho UC40 — PUT, gửi toàn bộ trường
export const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Tên tổ chức là bắt buộc'),
  description: z.string().optional(),
  address: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  website: z.string().url('Website không hợp lệ').optional().or(z.literal('')),
  is_active: z.boolean().optional()
});
```

### 2. Add Repository Methods (`backend/src/repositories/organization.repository.js`)

Thêm vào file đã có từ UC37/UC38/UC39:

```javascript
export async function findOrganizationByNameExcluding(name, excludeId) {
  return prisma.organization.findFirst({
    where: { name, NOT: { organization_id: excludeId } }
  });
}

export async function countActiveEventsByOrgId(organizationId) {
  return prisma.event.count({
    where: {
      organization_id: organizationId,
      status: { in: ['PENDING', 'IN_PROGRESS'] }
    }
  });
}

export async function updateOrganization(organizationId, data) {
  return prisma.organization.update({
    where: { organization_id: organizationId },
    data
  });
}
```

### 3. Helper: Extract Public ID from Cloudinary URL

```javascript
// backend/src/utils/cloudinary.util.js
export function extractPublicIdFromUrl(url) {
  if (!url) return null;
  // URL format: https://res.cloudinary.com/.../v1/{folder}/{public_id}.{ext}
  const parts = url.split('/');
  const fileWithExt = parts[parts.length - 1];
  const publicIdWithFolder = parts.slice(-2).join('/').replace(/\.[^.]+$/, '');
  return publicIdWithFolder;
}
```

### 4. Add `updateOrganizationService` to Service (`backend/src/services/organization.service.js`)

Thêm vào file đã có từ UC37/UC38/UC39:

```javascript
import { updateOrganizationSchema } from '../validators/organization.validator.js';
import {
  findOrganizationById,
  findOrganizationByNameExcluding,
  countActiveEventsByOrgId,
  updateOrganization
} from '../repositories/organization.repository.js';
import { ServiceError } from '../utils/response.util.js';
import { extractPublicIdFromUrl } from '../utils/cloudinary.util.js';
import logger from '../config/logger.config.js';
import cloudinary from '../config/cloudinary.config.js';

export async function updateOrganizationService(organizationId, data, file) {
  // 1. Check organization exists
  const existingOrg = await findOrganizationById(organizationId, {
    organization_id: true, name: true, description: true, address: true,
    contact_phone: true, contact_email: true, website: true, logo_url: true,
    is_active: true
  });
  if (!existingOrg) {
    throw new ServiceError('Organization not found.', 404, 'ORGANIZATION_NOT_FOUND');
  }

  // 2. Validate input
  const parsed = updateOrganizationSchema.safeParse(data);
  if (!parsed.success) {
    const details = parsed.error.errors.map(err => ({
      field: err.path[0],
      message: err.message
    }));
    throw new ServiceError('Dữ liệu đầu vào không hợp lệ', 400, 'VALIDATION_ERROR', details);
  }

  const updateData = parsed.data;

  // 3. Check unique name (exclude self)
  if (updateData.name !== existingOrg.name) {
    const conflict = await findOrganizationByNameExcluding(updateData.name, organizationId);
    if (conflict) {
      throw new ServiceError('Tên tổ chức đã tồn tại.', 409, 'ORGANIZATION_EXISTS');
    }
  }

  // 4. Check already inactive
  if (updateData.is_active === false && existingOrg.is_active === false) {
    throw new ServiceError('Tổ chức đã bị vô hiệu hóa trước đó.', 400, 'ALREADY_INACTIVE');
  }

  // 5. Check active events constraint (if deactivating)
  if (updateData.is_active === false && existingOrg.is_active === true) {
    const activeEvents = await countActiveEventsByOrgId(organizationId);
    if (activeEvents > 0) {
      throw new ServiceError(
        'Không thể vô hiệu hóa tổ chức vì còn sự kiện đang hoạt động.',
        409,
        'ACTIVE_EVENTS_EXIST'
      );
    }
  }

  // 6. Handle logo upload
  if (file) {
    // Upload new logo
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'vms/organizations', resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });
    updateData.logo_url = result.secure_url;

    // Delete old logo from Cloudinary
    if (existingOrg.logo_url) {
      const publicId = extractPublicIdFromUrl(existingOrg.logo_url);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId).catch(err => {
          logger.warn({ err, publicId }, 'Failed to delete old logo from Cloudinary');
        });
      }
    }
  }

  // 7. Update organization
  const organization = await updateOrganization(organizationId, updateData);

  // 8. Audit log
  logger.info({
    action: 'UPDATE_ORGANIZATION',
    orgId: organizationId,
    changes: Object.keys(updateData)
  });

  return organization;
}
```

### 5. Add `updateOrganizationHandler` to Controller (`backend/src/controllers/organization.controller.js`)

Thêm vào file đã có từ UC37/UC38/UC39:

```javascript
import { updateOrganizationService } from '../services/organization.service.js';

export async function updateOrganizationHandler(req, res) {
  try {
    const organization = await updateOrganizationService(
      Number(req.params.id),
      req.body,
      req.file
    );
    return res.status(200).json(successResponse(organization, 'Cập nhật tổ chức thành công'));
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

### 6. Add Route (`backend/src/routes/organization.routes.js`)

Thêm route PUT vào file đã có từ UC37/UC38/UC39:

```javascript
import { Router } from 'express';
import optionalAuth from '../middleware/optionalAuth.middleware.js';
import authMiddleware from '../middleware/auth.middleware.js';
import authorize from '../middleware/authorize.middleware.js';
import { uploadLogo } from '../middleware/upload.middleware.js';
import {
  getOrganizationsHandler,
  getOrganizationByIdHandler,
  createOrganizationHandler,
  updateOrganizationHandler
} from '../controllers/organization.controller.js';

const router = Router();

// Routes hiện tại
router.get('/', optionalAuth, getOrganizationsHandler);
router.get('/:id', optionalAuth, getOrganizationByIdHandler);
router.post('/', authMiddleware, authorize('MANAGER', 'ADMIN'), uploadLogo, createOrganizationHandler);

// Route mới cho UC40 — Manager/Admin only
router.put('/:id', authMiddleware, authorize('MANAGER', 'ADMIN'), uploadLogo, updateOrganizationHandler);

export default router;
```

### 7. Tests (`backend/tests/organization/organization.service.test.js`)

```javascript
// Test cases bổ sung cho UC40:
// 1. updateOrganization với dữ liệu hợp lệ → trả về organization đã cập nhật
// 2. updateOrganization với ID không tồn tại → throw 404
// 3. updateOrganization với tên trùng (trừ chính nó) → throw 409
// 4. updateOrganization set is_active=false (không active events) → thành công
// 5. updateOrganization set is_active=false (còn active events) → throw 409
// 6. updateOrganization set is_active=false (đã inactive) → throw 400
// 7. updateOrganization với email sai format → throw 400
```

### 8. Integration Tests (`backend/tests/organization/organization.api.test.js`)

```javascript
// Test cases bổ sung cho UC40:
// 1. PUT /api/v1/organizations/1 với dữ liệu hợp lệ + Manager token → 200
// 2. PUT /api/v1/organizations/1 với dữ liệu hợp lệ + Admin token → 200
// 3. PUT /api/v1/organizations/999 → 404
// 4. PUT /api/v1/organizations/1 với tên trùng → 409
// 5. PUT /api/v1/organizations/1 với is_active=false (có active events) → 409
// 6. PUT /api/v1/organizations/1 với Staff token → 403
// 7. PUT /api/v1/organizations/1 không token → 401
```

## Frontend Implementation Order

### 1. Add `updateOrganization` to API Client (`frontend/src/api/organizationApi.js`)

```javascript
export async function updateOrganization(id, formData) {
  const response = await axiosApi.put(`/organizations/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.data;
}
```

### 2. Custom Hook (`frontend/src/hooks/useUpdateOrganization.js`)

```javascript
import { useState } from 'react';
import { updateOrganization } from '../api/organizationApi';

export function useUpdateOrganization() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (id, formData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await updateOrganization(id, formData);
      setSuccess(true);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { handleUpdate, loading, error, success, reset: () => { setError(null); setSuccess(false); } };
}
```

### 3. EditOrganizationPage Component (`frontend/src/components/pages/EditOrganizationPage.jsx`)

```jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, TextField, Button, Alert, Box,
  CircularProgress, Avatar, Switch, FormControlLabel
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateOrganization } from '../../hooks/useUpdateOrganization';
import { getOrganizationById } from '../../api/organizationApi';

const schema = z.object({
  name: z.string().min(1, 'Tên tổ chức là bắt buộc'),
  description: z.string().optional(),
  address: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  website: z.string().url('Website không hợp lệ').optional().or(z.literal('')),
  is_active: z.boolean()
});

export default function EditOrganizationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { handleUpdate, loading, error, success } = useUpdateOrganization();
  const [pageLoading, setPageLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema)
  });

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const org = await getOrganizationById(id);
        reset({
          name: org.name,
          description: org.description || '',
          address: org.address || '',
          contact_phone: org.contact_phone || '',
          contact_email: org.contact_email || '',
          website: org.website || '',
          is_active: org.is_active
        });
        if (org.logo_url) setLogoPreview(org.logo_url);
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Failed to load organization');
      } finally {
        setPageLoading(false);
      }
    };
    fetchOrg();
  }, [id, reset]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    if (logoFile) formData.append('logo', logoFile);
    try {
      await handleUpdate(id, formData);
    } catch (e) { /* handled in hook */ }
  };

  if (pageLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (fetchError) return <Container maxWidth="sm" sx={{ mt: 4 }}><Alert severity="error">{fetchError}</Alert></Container>;

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Button onClick={() => navigate(`/organizations/${id}`)} sx={{ mb: 2 }}>← Back to Detail</Button>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Edit Organization</Typography>
        {success && <Alert severity="success" sx={{ mb: 2 }}>Organization updated!</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField fullWidth label="Name" {...register('name')} error={!!errors.name} helperText={errors.name?.message} sx={{ mb: 2 }} />
          <TextField fullWidth label="Description" multiline rows={2} {...register('description')} sx={{ mb: 2 }} />
          <TextField fullWidth label="Address" {...register('address')} sx={{ mb: 2 }} />
          <TextField fullWidth label="Phone" {...register('contact_phone')} sx={{ mb: 2 }} />
          <TextField fullWidth label="Email" {...register('contact_email')} error={!!errors.contact_email} helperText={errors.contact_email?.message} sx={{ mb: 2 }} />
          <TextField fullWidth label="Website" {...register('website')} error={!!errors.website} helperText={errors.website?.message} sx={{ mb: 2 }} />
          <FormControlLabel control={<Switch defaultChecked {...register('is_active')} />} label="Active" sx={{ mb: 2, display: 'block' }} />
          <Button variant="outlined" component="label" sx={{ mb: 2, display: 'block' }}>
            Change Logo
            <input type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={handleLogoChange} />
          </Button>
          {logoPreview && <Avatar src={logoPreview} sx={{ width: 100, height: 100, mb: 2 }} />}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => navigate(`/organizations/${id}`)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

EditOrganizationPage.propTypes = {};
```

### 4. Add Route in `frontend/src/App.js`

```jsx
import EditOrganizationPage from './components/pages/EditOrganizationPage';
<Route path="/organizations/:id/edit" element={<EditOrganizationPage />} />
```

## Verification Steps

1. **API**: `PUT /api/v1/organizations/1` với dữ liệu hợp lệ + Manager token → 200
2. **API**: `PUT /api/v1/organizations/1` với tên trùng → 409
3. **API**: `PUT /api/v1/organizations/1` với is_active=false (có active events) → 409
4. **API**: `PUT /api/v1/organizations/1` với is_active=false (không active events) → 200
5. **API**: `PUT /api/v1/organizations/1` với is_active=false (đã inactive) → 400
6. **API**: `PUT /api/v1/organizations/999` → 404
7. **API**: `PUT /api/v1/organizations/1` với Staff token → 403
8. **API**: `PUT /api/v1/organizations/1` không token → 401
9. **API**: `PUT /api/v1/organizations/1` với logo mới → 200 + logo_url mới (logo cũ bị xóa trên Cloudinary)
10. **Frontend**: Navigate to `/organizations/1/edit` → form pre-filled → edit → submit → verify success
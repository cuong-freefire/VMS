# Quickstart: Add Organization (UC39)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-04

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- **UC37/UC38 infrastructure available**: Organization model, organization.repository.js, organization.service.js, organization.controller.js, organization.routes.js, organizationApi.js
- Cloudinary account configured in `.env`
- authorize middleware working (from UC26)
- Backend server running on port 5000

## Backend Implementation Order

### 1. Cloudinary Config (`backend/src/config/cloudinary.config.js`)

```javascript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default cloudinary;
```

### 2. Upload Middleware (`backend/src/middleware/upload.middleware.js`)

```javascript
import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận định dạng .jpg, .png, .webp'), false);
  }
};

export const uploadLogo = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
}).single('logo');
```

### 3. Add Zod Schema (`backend/src/validators/organization.validator.js`)

Thêm createOrganizationSchema vào file đã có từ UC37:

```javascript
import { z } from 'zod';

// Schema hiện có từ UC37
export const getOrganizationsQuerySchema = z.object({ ... });

// Schema mới cho UC39
export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Tên tổ chức là bắt buộc'),
  description: z.string().optional(),
  address: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  website: z.string().url('Website không hợp lệ').optional().or(z.literal(''))
});
```

### 4. Add Repository Methods (`backend/src/repositories/organization.repository.js`)

Thêm vào file đã có từ UC37/UC38:

```javascript
export async function findOrganizationByName(name) {
  return prisma.organization.findUnique({ where: { name } });
}

export async function createOrganization(data) {
  return prisma.organization.create({
    data: {
      name: data.name,
      description: data.description || null,
      address: data.address || null,
      contact_phone: data.contact_phone || null,
      contact_email: data.contact_email || null,
      website: data.website || null,
      logo_url: data.logo_url || null,
      is_active: true
    }
  });
}
```

### 5. Add `createOrganization` to Service (`backend/src/services/organization.service.js`)

Thêm vào file đã có từ UC37/UC38:

```javascript
import { createOrganizationSchema } from '../validators/organization.validator.js';
import { findOrganizationByName, createOrganization } from '../repositories/organization.repository.js';
import { ServiceError } from '../utils/response.util.js';
import logger from '../config/logger.config.js';
import cloudinary from '../config/cloudinary.config.js';

export async function createOrganizationService(data, file) {
  // 1. Validate input
  const parsed = createOrganizationSchema.safeParse(data);
  if (!parsed.success) {
    const details = parsed.error.errors.map(err => ({
      field: err.path[0],
      message: err.message
    }));
    throw new ServiceError('Dữ liệu đầu vào không hợp lệ', 400, 'VALIDATION_ERROR', details);
  }

  const orgData = parsed.data;

  // 2. Check unique name
  const existing = await findOrganizationByName(orgData.name);
  if (existing) {
    throw new ServiceError('Tên tổ chức đã tồn tại.', 409, 'ORGANIZATION_EXISTS');
  }

  // 3. Upload logo to Cloudinary if provided
  let logoUrl = null;
  if (file) {
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
    logoUrl = result.secure_url;
  }

  // 4. Create organization
  const organization = await createOrganization({ ...orgData, logo_url: logoUrl });

  // 5. Audit log
  logger.info({ action: 'CREATE_ORGANIZATION', orgId: organization.organization_id, name: organization.name });

  return organization;
}
```

### 6. Add `createOrganizationHandler` to Controller (`backend/src/controllers/organization.controller.js`)

Thêm vào file đã có từ UC37/UC38:

```javascript
import { createOrganizationService } from '../services/organization.service.js';

export async function createOrganizationHandler(req, res) {
  try {
    const organization = await createOrganizationService(req.body, req.file);
    return res.status(201).json(successResponse(organization, 'Tạo tổ chức thành công'));
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

### 7. Add Route (`backend/src/routes/organization.routes.js`)

Thêm route POST vào file đã có từ UC37/UC38:

```javascript
import { Router } from 'express';
import optionalAuth from '../middleware/optionalAuth.middleware.js';
import authMiddleware from '../middleware/auth.middleware.js';
import authorize from '../middleware/authorize.middleware.js';
import { uploadLogo } from '../middleware/upload.middleware.js';
import {
  getOrganizationsHandler,
  getOrganizationByIdHandler,
  createOrganizationHandler
} from '../controllers/organization.controller.js';

const router = Router();

// Routes hiện tại
router.get('/', optionalAuth, getOrganizationsHandler);
router.get('/:id', optionalAuth, getOrganizationByIdHandler);

// Route mới cho UC39 — Admin only, multipart/form-data
router.post('/', authMiddleware, authorize('ADMIN'), uploadLogo, createOrganizationHandler);

export default router;
```

### 8. Tests (`backend/tests/organization/organization.service.test.js`)

```javascript
// Test cases bổ sung cho UC39:
// 1. createOrganization với dữ liệu hợp lệ (không logo) → trả về organization mới
// 2. createOrganization với tên đã tồn tại → throw ServiceError 409
// 3. createOrganization với name empty → throw ServiceError 400
// 4. createOrganization với email sai format → throw ServiceError 400
```

### 9. Integration Tests (`backend/tests/organization/organization.api.test.js`)

```javascript
// Test cases bổ sung cho UC39:
// 1. POST /api/v1/organizations với dữ liệu hợp lệ + Admin token → 201
// 2. POST /api/v1/organizations với tên đã tồn tại → 409
// 3. POST /api/v1/organizations với Manager token → 403
// 4. POST /api/v1/organizations không token → 401
```

## Frontend Implementation Order

### 1. Add `createOrganization` to API Client (`frontend/src/api/organizationApi.js`)

```javascript
export async function createOrganization(formData) {
  const response = await axiosApi.post('/organizations', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.data;
}
```

### 2. Custom Hook (`frontend/src/hooks/useCreateOrganization.js`)

```javascript
import { useState } from 'react';
import { createOrganization } from '../api/organizationApi';

export function useCreateOrganization() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleCreate = async (formData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await createOrganization(formData);
      setSuccess(true);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { handleCreate, loading, error, success, reset: () => { setError(null); setSuccess(false); } };
}
```

### 3. AddOrganizationPage Component (`frontend/src/components/pages/AddOrganizationPage.jsx`)

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, TextField, Button, Alert, Box, CircularProgress, Avatar
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateOrganization } from '../../hooks/useCreateOrganization';

const schema = z.object({
  name: z.string().min(1, 'Tên tổ chức là bắt buộc'),
  description: z.string().optional(),
  address: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  website: z.string().url('Website không hợp lệ').optional().or(z.literal(''))
});

export default function AddOrganizationPage() {
  const navigate = useNavigate();
  const { handleCreate, loading, error, success } = useCreateOrganization();
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

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
      if (data[key]) formData.append(key, data[key]);
    });
    if (logoFile) formData.append('logo', logoFile);
    try {
      await handleCreate(formData);
    } catch (e) { /* handled in hook */ }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Button onClick={() => navigate('/organizations')} sx={{ mb: 2 }}>← Back to List</Button>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Add Organization</Typography>
        {success && <Alert severity="success" sx={{ mb: 2 }}>Organization created!</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField fullWidth label="Name" {...register('name')} error={!!errors.name} helperText={errors.name?.message} sx={{ mb: 2 }} />
          <TextField fullWidth label="Description" multiline rows={2} {...register('description')} sx={{ mb: 2 }} />
          <TextField fullWidth label="Address" {...register('address')} sx={{ mb: 2 }} />
          <TextField fullWidth label="Phone" {...register('contact_phone')} sx={{ mb: 2 }} />
          <TextField fullWidth label="Email" {...register('contact_email')} error={!!errors.contact_email} helperText={errors.contact_email?.message} sx={{ mb: 2 }} />
          <TextField fullWidth label="Website" {...register('website')} error={!!errors.website} helperText={errors.website?.message} sx={{ mb: 2 }} />
          <Button variant="outlined" component="label" sx={{ mb: 2, display: 'block' }}>
            Upload Logo
            <input type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={handleLogoChange} />
          </Button>
          {logoPreview && <Avatar src={logoPreview} sx={{ width: 100, height: 100, mb: 2 }} />}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => navigate('/organizations')}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Create'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

AddOrganizationPage.propTypes = {};
```

### 4. Add Route in `frontend/src/App.js`

```jsx
import AddOrganizationPage from './components/pages/AddOrganizationPage';
<Route path="/organizations/add" element={<AddOrganizationPage />} />
```

## Verification Steps

1. **API**: `POST /api/v1/organizations` với dữ liệu hợp lệ + Admin token → 201
2. **API**: `POST /api/v1/organizations` với tên đã tồn tại → 409
3. **API**: `POST /api/v1/organizations` với Manager token → 403
4. **API**: `POST /api/v1/organizations` không token → 401
5. **API**: `POST /api/v1/organizations` với logo file → 201 + logo_url từ Cloudinary
6. **Frontend**: Navigate to `/organizations/add` → fill form → upload logo → submit → verify success
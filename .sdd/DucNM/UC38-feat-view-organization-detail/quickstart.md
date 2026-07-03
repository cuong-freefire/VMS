# Quickstart: View Organization Detail (UC38)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-02

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- **UC37 infrastructure available**: Organization model, organization.repository.js, organization.service.js, organization.controller.js, organization.routes.js, organizationApi.js
- Event model with `organization_id` foreign key in Prisma schema
- Backend server running on port 5000

## Backend Implementation Order

### 1. Add Repository Methods (`backend/src/repositories/organization.repository.js`)

Thêm vào file đã có từ UC37:

```javascript
export async function findOrganizationById(organizationId, select) {
  return prisma.organization.findUnique({
    where: { organization_id: organizationId },
    select
  });
}

export async function findRecentEventsByOrgId(organizationId, limit = 10) {
  return prisma.event.findMany({
    where: { organization_id: organizationId },
    orderBy: { created_at: 'desc' },
    take: limit,
    select: {
      event_id: true,
      title: true,
      status: true,
      start_date: true,
      created_at: true
    }
  });
}
```

### 2. Add `getOrganizationById` to Service (`backend/src/services/organization.service.js`)

Thêm vào file đã có từ UC37:

```javascript
import { findOrganizationById, findRecentEventsByOrgId } from '../repositories/organization.repository.js';
import { ServiceError } from '../utils/response.util.js';

const BASIC_SELECT = {
  organization_id: true, name: true, description: true, logo_url: true, is_active: true
};

const FULL_SELECT = {
  organization_id: true, name: true, description: true, address: true,
  contact_phone: true, contact_email: true, website: true, logo_url: true,
  is_active: true, created_at: true, updated_at: true
};

export async function getOrganizationById(organizationId, currentUser) {
  // Validate ID
  const id = Number(organizationId);
  if (isNaN(id) || id <= 0) {
    throw new ServiceError('Organization ID không hợp lệ', 400, 'INVALID_ORGANIZATION_ID');
  }

  // Determine detail level based on role
  let isFullDetail = false;
  let isAdmin = false;
  let role = null;

  if (currentUser) {
    role = currentUser.role || currentUser.role_name;
    isAdmin = role === 'ADMIN';
    isFullDetail = (role === 'STAFF' || role === 'MANAGER' || isAdmin);
  }

  // Query with appropriate select
  const select = isFullDetail ? FULL_SELECT : BASIC_SELECT;
  const org = await findOrganizationById(id, select);

  if (!org) {
    throw new ServiceError('Organization not found.', 404, 'ORGANIZATION_NOT_FOUND');
  }

  // Manager/Staff/Volunteer/Guest cannot see inactive orgs
  if (!org.is_active && !isAdmin) {
    throw new ServiceError('Organization not found.', 404, 'ORGANIZATION_NOT_FOUND');
  }

  // Build response
  const result = { ...org };

  // Add events summary for full detail only
  if (isFullDetail) {
    result.events = await findRecentEventsByOrgId(id, 10);
  }

  return result;
}
```

### 3. Add `getOrganizationByIdHandler` to Controller (`backend/src/controllers/organization.controller.js`)

Thêm vào file đã có từ UC37:

```javascript
import { getOrganizationById } from '../services/organization.service.js';

export async function getOrganizationByIdHandler(req, res) {
  try {
    const organization = await getOrganizationById(req.params.id, req.user);
    return res.status(200).json(successResponse(organization, 'Lấy thông tin tổ chức thành công'));
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

### 4. Add Route (`backend/src/routes/organization.routes.js`)

Thêm route GET /:id vào file đã có từ UC37:

```javascript
import { Router } from 'express';
import optionalAuth from '../middleware/optionalAuth.middleware.js';
import { getOrganizationsHandler, getOrganizationByIdHandler } from '../controllers/organization.controller.js';

const router = Router();

// Route hiện tại từ UC37
router.get('/', optionalAuth, getOrganizationsHandler);

// Route mới cho UC38
router.get('/:id', optionalAuth, getOrganizationByIdHandler);

export default router;
```

### 5. Tests (`backend/tests/organization/organization.service.test.js`)

```javascript
// Test cases:
// 1. getOrganizationById với Admin → full info + events (active org)
// 2. getOrganizationById với Admin → full info + events (inactive org)
// 3. getOrganizationById với Manager/Staff → full info + events (active org)
// 4. getOrganizationById với Manager/Staff → 404 (inactive org)
// 5. getOrganizationById với Volunteer → basic info (active org)
// 6. getOrganizationById với Guest (null) → basic info (active org)
// 7. getOrganizationById với ID không tồn tại → 404
// 8. getOrganizationById với ID không hợp lệ → 400
```

### 6. Integration Tests (`backend/tests/organization/organization.api.test.js`)

```javascript
// Test cases:
// 1. GET /api/v1/organizations/1 với Admin → 200 + full
// 2. GET /api/v1/organizations/1 với Manager → 200 + full
// 3. GET /api/v1/organizations/1 với Volunteer → 200 + basic
// 4. GET /api/v1/organizations/1 không token → 200 + basic
// 5. GET /api/v1/organizations/999 → 404
// 6. GET /api/v1/organizations/inactive-id với Manager → 404
// 7. GET /api/v1/organizations/inactive-id với Admin → 200 + full
// 8. GET /api/v1/organizations/abc → 400
```

## Frontend Implementation Order

### 1. Add `getOrganizationById` to API Client (`frontend/src/api/organizationApi.js`)

```javascript
export async function getOrganizationById(id) {
  const response = await axiosApi.get(`/organizations/${id}`);
  return response.data.data;
}
```

### 2. Custom Hook (`frontend/src/hooks/useOrganizationDetail.js`)

```javascript
import { useState, useEffect, useCallback } from 'react';
import { getOrganizationById } from '../api/organizationApi';

export function useOrganizationDetail(id) {
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrg = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOrganizationById(id);
      setOrganization(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { if (id) fetchOrg(); }, [fetchOrg, id]);

  return { organization, loading, error, refetch: fetchOrg };
}
```

## Integration với UC09 (View Event Detail — NamLD)

Để UC09 hiển thị thông tin cơ bản của tổ chức chủ quản sự kiện, NamLD cần:

```javascript
import { getOrganizationById } from '.../organizationApi';

// Trong Event Detail page — Guest và Volunteer đều gọi được
const [orgInfo, setOrgInfo] = useState(null);
useEffect(() => {
  if (event?.organization_id) {
    getOrganizationById(event.organization_id).then(setOrgInfo).catch(console.error);
  }
}, [event]);
```

## Verification Steps

1. **API**: `GET /api/v1/organizations/1` với Admin → 200 + full info + events
2. **API**: `GET /api/v1/organizations/1` với Volunteer → 200 + basic info (no contact, no events)
3. **API**: `GET /api/v1/organizations/1` không token (Guest) → 200 + basic info
4. **API**: `GET /api/v1/organizations/inactive-id` với Manager → 404
5. **API**: `GET /api/v1/organizations/inactive-id` với Admin → 200 + full info
6. **API**: `GET /api/v1/organizations/999` → 404
7. **API**: `GET /api/v1/organizations/abc` → 400
8. **Cross-module**: UC09 gọi API organization detail thành công (basic info cho Volunteer/Guest)
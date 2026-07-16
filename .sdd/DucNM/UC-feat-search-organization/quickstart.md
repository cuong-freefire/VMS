# Quickstart: Search Organization

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Prerequisites

- UC37 infrastructure complete (GET /api/v1/organizations with pagination, is_active filter)
- Backend server running on port 5000

## Backend Implementation Order

### 1. Extend Zod Schema (`backend/src/validators/organization.validator.js`)

Mở rộng `getOrganizationsQuerySchema` — thêm `search` param:

```javascript
import { z } from 'zod';

export const getOrganizationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),  // Search Organization addition
  is_active: z.coerce.boolean().optional()
});
```

### 2. Extend Service (`backend/src/services/organization.service.js`)

Mở rộng `getOrganizations` — thêm search condition vào Prisma where clause:

```javascript
// Trong hàm getOrganizations, sau khi parse query params:
const { page, limit, search, is_active } = parsed.data;
const skip = (page - 1) * limit;

// Build where clause
const where = { AND: [] };

// NEW: search (chỉ search theo name)
if (search) {
  where.AND.push({
    name: { contains: search, mode: 'insensitive' }
  });
}

// Existing: is_active filter
if (is_active !== undefined) {
  where.AND.push({ is_active });
}

// Role-based filtering (kế thừa từ UC37)
if (user.role !== 'ADMIN') {
  where.AND.push({ is_active: true });
}

// Clean up empty AND
if (where.AND.length === 0) {
  delete where.AND;
}
```

### 3. Update Swagger JSDoc (`backend/src/routes/organization.routes.js`)

Cập nhật Swagger JSDoc cho `GET /api/v1/organizations` — thêm `search` param. (Xem contracts/api-search-organizations.md)

### 4. Tests (`backend/tests/organization/organization.service.test.js`)

```javascript
// Test cases bổ sung:
// 1. getOrganizations với search="Nhân" → orgs có tên chứa "Nhân"
// 2. getOrganizations với search không match → empty array
// 3. getOrganizations với search="" hoặc undefined → ignore search
// 4. getOrganizations với search case-insensitive → "nhân" match "Nhân"
// 5. getOrganizations với search + is_active kết hợp → AND logic
// 6. getOrganizations với search — Admin thấy all; Manager chỉ thấy active
```

### 5. Integration Tests (`backend/tests/organization/organization.api.test.js`)

```javascript
// Test cases bổ sung:
// 1. GET /api/v1/organizations?search=Nhân → 200 + results
// 2. GET /api/v1/organizations?search=notfound → 200 + empty array
// 3. GET /api/v1/organizations?search=Nhân&is_active=true → 200 + kết hợp
// 4. Guest gọi API → 401
// 5. Volunteer gọi API → 403
```

## Frontend Implementation Order

### 1. Update OrganizationListPage (`frontend/src/components/pages/OrganizationListPage.jsx`)

```jsx
// Thêm state search và debounce
const [search, setSearch] = useState('');

// Thêm SearchInput component (reuse từ search-user)
import SearchInput from '../ui/SearchInput';

// Thêm vào JSX:
<SearchInput
  value={search}
  onChange={handleSearch}
  placeholder="Search by organization name..."
/>
```

## Verification Steps

1. **API**: `GET /api/v1/organizations?search=Nhân` → orgs có tên chứa "Nhân"
2. **API**: `GET /api/v1/organizations?search=nhân` → case-insensitive
3. **API**: `GET /api/v1/organizations?search=Nhân&is_active=true` → kết hợp search + filter
4. **API**: `GET /api/v1/organizations?search=notfound` → 200 + empty array
5. **API**: Guest → 401; Volunteer → 403; Manager/Staff → chỉ active; Admin → tất cả
6. **Frontend**: Search input hiển thị, gõ keyword → API call
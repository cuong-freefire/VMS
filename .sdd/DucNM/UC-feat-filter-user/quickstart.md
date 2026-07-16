# Quickstart: Filter User

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Prerequisites

- UC26 infrastructure complete (GET /api/v1/users with pagination, search, sort)
- Backend server running on port 5000

## Backend Implementation Order

### 1. Extend Zod Schema (`backend/src/validators/user.validator.js`)

Mở rộng `getUsersQuerySchema` — thêm `is_active`, `from_date`, `to_date`:

```javascript
import { z } from 'zod';

export const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['volunteer', 'staff', 'manager', 'admin']).optional(),
  sort: z.string().regex(/^(created_at|full_name|email):(asc|desc)$/).default('created_at:desc'),
  // Filter User additions
  is_active: z.coerce.boolean().optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional()
}).refine(data => {
  if (data.from_date && data.to_date) {
    return new Date(data.from_date) <= new Date(data.to_date);
  }
  return true;
}, { message: 'from_date must be before or equal to to_date', path: ['from_date'] });
```

### 2. Extend Service (`backend/src/services/user.service.js`)

Mở rộng `getUsers` — thêm filter conditions vào Prisma where clause:

```javascript
// Trong hàm getUsers, sau khi parse query params:
const { page, limit, search, role, sort, is_active, from_date, to_date } = parsed.data;
const skip = (page - 1) * limit;

// Build where clause
const where = { AND: [] };

// Existing: search
if (search) {
  where.AND.push({
    OR: [
      { full_name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ]
  });
}

// Existing: role filter
if (role) {
  where.AND.push({
    role: { name: { equals: role.toUpperCase(), mode: 'insensitive' } }
  });
}

// NEW: is_active filter
if (is_active !== undefined) {
  where.AND.push({ is_active });
}

// NEW: date range filter
if (from_date) {
  where.AND.push({ created_at: { gte: new Date(from_date) } });
}

if (to_date) {
  const toDateEnd = new Date(to_date);
  toDateEnd.setHours(23, 59, 59, 999);
  where.AND.push({ created_at: { lte: toDateEnd } });
}

// Clean up empty AND
if (where.AND.length === 0) {
  delete where.AND;
}
```

### 3. Update Swagger JSDoc (`backend/src/routes/user.routes.js`)

Cập nhật Swagger JSDoc cho `GET /api/v1/users` — thêm 3 params mới: `is_active`, `from_date`, `to_date`. (Xem contracts/api-filter-users.md)

### 4. Tests (`backend/tests/user/user.service.test.js`)

```javascript
// Test cases bổ sung:
// 1. getUsers với is_active=true → chỉ trả về active users
// 2. getUsers với is_active=false → chỉ trả về inactive users
// 3. getUsers với from_date và to_date → chỉ users trong khoảng
// 4. getUsers với kết hợp search + role + is_active + date range → AND logic
// 5. getUsers với from_date > to_date → throw ServiceError 400
// 6. getUsers với date format sai → throw ServiceError 400
```

### 5. Integration Tests (`backend/tests/user/user.api.test.js`)

```javascript
// Test cases bổ sung:
// 1. GET /api/v1/users?is_active=true → 200 + only active
// 2. GET /api/v1/users?is_active=false → 200 + only inactive
// 3. GET /api/v1/users?from_date=2026-01-01&to_date=2026-06-30 → 200
// 4. GET /api/v1/users?from_date=2026-06-30&to_date=2026-01-01 → 400
// 5. GET /api/v1/users?from_date=invalid → 400
```

## Frontend Implementation Order

### 1. Extend `useUsers` Hook (`frontend/src/hooks/useUsers.js`)

```javascript
// Thêm states:
const [isActive, setIsActive] = useState('');
const [fromDate, setFromDate] = useState('');
const [toDate, setToDate] = useState('');

// Mở rộng fetchUsers params:
const fetchUsers = useCallback(async () => {
  setLoading(true);
  try {
    const params = { page, limit: 20, search, role, sort };
    if (isActive !== '') params.is_active = isActive;
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    const result = await getUsers(params);
    setUsers(result.users);
    setPagination(result.pagination);
  } catch (err) {
    setError(err.response?.data?.message || 'Có lỗi xảy ra');
  } finally {
    setLoading(false);
  }
}, [page, search, role, sort, isActive, fromDate, toDate]);

// Return thêm:
return {
  users, pagination, loading, error,
  search, role, page, sort,
  isActive, fromDate, toDate,
  handleSearch, handleRoleFilter, handlePageChange, handleSort,
  handleActiveFilter, handleFromDateChange, handleToDateChange,
  refetch: fetchUsers
};
```

### 2. ActiveFilter Component (`frontend/src/components/ui/ActiveFilter.jsx`)

```jsx
import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

export default function ActiveFilter({ value, onChange }) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(e, val) => onChange(val ?? '')}
      size="small"
    >
      <ToggleButton value="">All</ToggleButton>
      <ToggleButton value="true">Active</ToggleButton>
      <ToggleButton value="false">Inactive</ToggleButton>
    </ToggleButtonGroup>
  );
}

ActiveFilter.propTypes = {};
```

### 3. DateRangeFilter Component (`frontend/src/components/ui/DateRangeFilter.jsx`)

```jsx
import React from 'react';
import { Box, TextField } from '@mui/material';

export default function DateRangeFilter({ fromDate, toDate, onFromChange, onToChange }) {
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <TextField
        type="date"
        label="From"
        size="small"
        InputLabelProps={{ shrink: true }}
        value={fromDate}
        onChange={(e) => onFromChange(e.target.value)}
      />
      <TextField
        type="date"
        label="To"
        size="small"
        InputLabelProps={{ shrink: true }}
        value={toDate}
        onChange={(e) => onToChange(e.target.value)}
      />
    </Box>
  );
}

DateRangeFilter.propTypes = {};
```

### 4. Update UserListPage (`frontend/src/components/pages/UserListPage.jsx`)

```jsx
// Thêm imports:
import ActiveFilter from '../ui/ActiveFilter';
import DateRangeFilter from '../ui/DateRangeFilter';

// Destructure thêm từ hook:
const {
  isActive, fromDate, toDate,
  handleActiveFilter, handleFromDateChange, handleToDateChange
} = useUsers();

// Thêm vào JSX, bên cạnh SearchBar và RoleFilter:
<ActiveFilter value={isActive} onChange={handleActiveFilter} />
<DateRangeFilter
  fromDate={fromDate}
  toDate={toDate}
  onFromChange={handleFromDateChange}
  onToChange={handleToDateChange}
/>
```

## Verification Steps

1. **API**: `GET /api/v1/users?is_active=true` → chỉ active users
2. **API**: `GET /api/v1/users?is_active=false` → chỉ inactive users
3. **API**: `GET /api/v1/users?from_date=2026-01-01&to_date=2026-06-30` → users trong khoảng
4. **API**: `GET /api/v1/users?role=staff&is_active=true` → kết hợp role + active
5. **API**: `GET /api/v1/users?from_date=2026-06-30&to_date=2026-01-01` → 400
6. **API**: `GET /api/v1/users?from_date=invalid` → 400
7. **Frontend**: User List page hiển thị ActiveFilter toggle và DateRangeFilter inputs
8. **Frontend**: Thay đổi filter trigger API call + cập nhật kết quả
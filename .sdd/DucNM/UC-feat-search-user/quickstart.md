# Quickstart: Search User

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Prerequisites

- UC26 infrastructure complete (GET /api/v1/users with pagination, sort)
- Backend server running on port 5000

## Backend Implementation Order

### 1. Extend Zod Schema (`backend/src/validators/user.validator.js`)

Mở rộng `getUsersQuerySchema` — thêm `search` param:

```javascript
import { z } from 'zod';

export const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),  // Search User addition
  role: z.enum(['volunteer', 'staff', 'manager', 'admin']).optional(),
  sort: z.string().regex(/^(created_at|full_name|email):(asc|desc)$/).default('created_at:desc')
});
```

### 2. Extend Service (`backend/src/services/user.service.js`)

Mở rộng `getUsers` — thêm search condition vào Prisma where clause:

```javascript
// Trong hàm getUsers, sau khi parse query params:
const { page, limit, search, role, sort } = parsed.data;
const skip = (page - 1) * limit;

// Build where clause
const where = { AND: [] };

// NEW: search
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

// Clean up empty AND
if (where.AND.length === 0) {
  delete where.AND;
}
```

### 3. Update Swagger JSDoc (`backend/src/routes/user.routes.js`)

Cập nhật Swagger JSDoc cho `GET /api/v1/users` — thêm `search` param. (Xem contracts/api-search-users.md)

### 4. Tests (`backend/tests/user/user.service.test.js`)

```javascript
// Test cases bổ sung:
// 1. getUsers với search="nguyen" → users có tên/email chứa "nguyen"
// 2. getUsers với search không match user nào → empty array
// 3. getUsers với search="" hoặc undefined → ignore search
// 4. getUsers với search + role kết hợp → AND logic
// 5. getUsers với search case-insensitive → "NGUYEN" match "Nguyễn"
// 6. getUsers với search partial match → "ngu" match "Nguyễn"
```

### 5. Integration Tests (`backend/tests/user/user.api.test.js`)

```javascript
// Test cases bổ sung:
// 1. GET /api/v1/users?search=nguyen → 200 + results
// 2. GET /api/v1/users?search=notfounduser → 200 + empty array
// 3. GET /api/v1/users?search=nguyen&role=staff → 200 + kết hợp
// 4. GET /api/v1/users?search= → 200 + tất cả users (ignore empty search)
```

## Frontend Implementation Order

### 1. Extend `useUsers` Hook (`frontend/src/hooks/useUsers.js`)

```javascript
// Thêm state:
const [search, setSearch] = useState('');

// Thêm debounce logic:
const debounceTimer = useRef(null);
const handleSearch = (value) => {
  setSearch(value);
  if (debounceTimer.current) clearTimeout(debounceTimer.current);
  debounceTimer.current = setTimeout(() => setPage(1), 300);
};
```

### 2. SearchInput Component (`frontend/src/components/ui/SearchInput.jsx`)

```jsx
import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function SearchInput({ value, onChange, placeholder }) {
  return (
    <TextField
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || 'Search...'}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        )
      }}
    />
  );
}

SearchInput.propTypes = {};
```

### 3. Update UserListPage (`frontend/src/components/pages/UserListPage.jsx`)

```jsx
// Thêm import:
import SearchInput from '../ui/SearchInput';

// Thêm vào JSX:
<SearchInput
  value={search}
  onChange={handleSearch}
  placeholder="Search by name or email..."
/>
```

## Verification Steps

1. **API**: `GET /api/v1/users?search=nguyen` → users có tên/email chứa "nguyen"
2. **API**: `GET /api/v1/users?search=NGUYEN` → case-insensitive, match "Nguyễn"
3. **API**: `GET /api/v1/users?search=nguyen&role=staff` → kết hợp search + role
4. **API**: `GET /api/v1/users?search=notfound` → 200 + empty array
5. **Frontend**: Search input hiển thị, gõ keyword → API call sau 300ms debounce
6. **Frontend**: Xóa search → trả về toàn bộ danh sách
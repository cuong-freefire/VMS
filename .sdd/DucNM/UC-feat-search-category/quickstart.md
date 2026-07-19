# Quickstart: Search Category

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Prerequisites

- UC31 infrastructure complete (GET /api/v1/categories with filter type)
- Backend server running on port 5000

## Backend Implementation Order

### 1. Extend Zod Schema (`backend/src/validators/category.validator.js`)

Mở rộng `getCategoriesQuerySchema` — thêm `search` param:

```javascript
import { z } from 'zod';

export const getCategoriesQuerySchema = z.object({
  search: z.string().trim().optional(),  // Search Category addition
  type: z.enum(['location', 'event_type', 'time_frame']).optional()
});
```

### 2. Extend Service (`backend/src/services/category.service.js`)

Mở rộng `getCategories` — thêm search condition vào Prisma where clause:

```javascript
// Trong hàm getCategories, sau khi parse query params:
const { search, type } = parsed.data;

// Build where clause
const where = { AND: [] };

// NEW: search
if (search) {
  where.AND.push({
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ]
  });
}

// Existing: type filter
if (type) {
  where.AND.push({ type });
}

// Có thể thêm role-based is_active filter từ UC31
if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
  where.AND.push({ is_active: true });
}

// Clean up empty AND
if (where.AND.length === 0) {
  delete where.AND;
}
```

### 3. Update Swagger JSDoc (`backend/src/routes/category.routes.js`)

Cập nhật Swagger JSDoc cho `GET /api/v1/categories` — thêm `search` param. (Xem contracts/api-search-categories.md)

### 4. Tests (`backend/tests/category/category.service.test.js`)

```javascript
// Test cases bổ sung:
// 1. getCategories với search="Hoc" → categories có tên/mô tả chứa "Hoc"
// 2. getCategories với search không match → empty array
// 3. getCategories với search="" hoặc undefined → ignore search
// 4. getCategories với search + type kết hợp → AND logic
// 5. getCategories với search case-insensitive → "hoc" match "Học"
```

### 5. Integration Tests (`backend/tests/category/category.api.test.js`)

```javascript
// Test cases bổ sung:
// 1. GET /api/v1/categories?search=Hoc → 200 + results
// 2. GET /api/v1/categories?search=notfound → 200 + empty array
// 3. GET /api/v1/categories?search=Hoc&type=event_type → 200 + kết hợp
```

## Frontend Implementation Order

### 1. Update CategoryListPage (`frontend/src/components/pages/CategoryListPage.jsx`)

```jsx
// Thêm state search và debounce tương tự search-user
const [search, setSearch] = useState('');

// Thêm SearchInput component (reuse từ search-user)
import SearchInput from '../ui/SearchInput';

// Thêm vào JSX:
<SearchInput
  value={search}
  onChange={handleSearch}
  placeholder="Search by name or description..."
/>
```

## Verification Steps

1. **API**: `GET /api/v1/categories?search=Hoc` → categories có tên/mô tả chứa "Hoc"
2. **API**: `GET /api/v1/categories?search=hoc` → case-insensitive
3. **API**: `GET /api/v1/categories?search=Hoc&type=event_type` → kết hợp search + type
4. **API**: `GET /api/v1/categories?search=notfound` → 200 + empty array
5. **API**: Manager thấy active + inactive results; Volunteer chỉ thấy active
6. **Frontend**: Search input hiển thị, gõ keyword → API call
# Quickstart: Search Skill

**Phase**: 1 — Design & Contracts

**Date**: 2026-06-30

---

## Prerequisites

- UC34 infrastructure complete (GET /api/v1/skills)
- Backend server running on port 5000

## Backend Implementation Order

### 1. Extend Zod Schema (`backend/src/validators/skill.validator.js`)

Mở rộng `getSkillsQuerySchema` — thêm `search` param:

```javascript
import { z } from 'zod';

export const getSkillsQuerySchema = z.object({
  search: z.string().trim().optional()  // Search Skill addition
});
```

### 2. Extend Service (`backend/src/services/skill.service.js`)

Mở rộng `getSkills` — thêm search condition vào Prisma where clause:

```javascript
// Trong hàm getSkills, sau khi parse query params:
const { search } = parsed.data;

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

// Có thể thêm role-based is_active filter từ UC34
if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
  where.AND.push({ is_active: true });
}

// Clean up empty AND
if (where.AND.length === 0) {
  delete where.AND;
}
```

### 3. Update Swagger JSDoc (`backend/src/routes/skill.routes.js`)

Cập nhật Swagger JSDoc cho `GET /api/v1/skills` — thêm `search` param. (Xem contracts/api-search-skills.md)

### 4. Tests (`backend/tests/skill/skill.service.test.js`)

```javascript
// Test cases bổ sung:
// 1. getSkills với search="English" → skills có tên/mô tả chứa "English"
// 2. getSkills với search không match → empty array
// 3. getSkills với search="" hoặc undefined → ignore search
// 4. getSkills với search case-insensitive → "english" match "English"
// 5. getSkills với search partial match → "Eng" match "English"
```

### 5. Integration Tests (`backend/tests/skill/skill.api.test.js`)

```javascript
// Test cases bổ sung:
// 1. GET /api/v1/skills?search=English → 200 + results
// 2. GET /api/v1/skills?search=notfound → 200 + empty array
// 3. GET /api/v1/skills (no search) → 200 + all skills
```

## Frontend Implementation Order

### 1. Update SkillListPage (`frontend/src/components/pages/SkillListPage.jsx`)

```jsx
// Thêm state search và debounce
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

1. **API**: `GET /api/v1/skills?search=English` → skills có tên/mô tả chứa "English"
2. **API**: `GET /api/v1/skills?search=english` → case-insensitive
3. **API**: `GET /api/v1/skills?search=Eng` → partial match
4. **API**: `GET /api/v1/skills?search=notfound` → 200 + empty array
5. **API**: Guest gọi API → 401 Unauthorized
6. **Frontend**: Search input hiển thị, gõ keyword → API call
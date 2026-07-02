# Quickstart: View Skill List (UC34)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-02

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- Prisma CLI installed
- Backend server running on port 5000
- **Reusable from UC31**: `optionalAuth.middleware.js`
- **Cross-module awareness**: UC34 phục vụ UC11 (Filter Event — NamLD) và UC20 (Edit Volunteer Skills — CuongLH). Guest và Volunteer cần xem skills active.

## Database

### 1. Prisma Schema (`backend/prisma/schema.prisma`)

Thêm model Skill:

```prisma
model Skill {
  skill_id    Int      @id @default(autoincrement())
  name        String   @unique @db.VarChar(255)
  description String?  @db.Text
  is_active   Boolean  @default(true)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@map("skills")
}
```

Chạy migration:

```bash
npx prisma migrate dev --name add_skill_model
npx prisma generate
```

## Backend Implementation Order

### 1. Repository (`backend/src/repositories/skill.repository.js`)

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function findAllSkills(where = {}) {
  return prisma.skill.findMany({
    where,
    orderBy: { name: 'asc' }
  });
}
```

### 2. Service (`backend/src/services/skill.service.js`)

Role-based visibility — giống pattern UC31:

```javascript
import { findAllSkills } from '../repositories/skill.repository.js';

export async function getSkills(currentUser) {
  const where = {};

  // Role-based visibility
  if (!currentUser) {
    // Guest (no auth) — active only
    where.is_active = true;
  } else {
    const role = currentUser.role || currentUser.role_name;
    if (role !== 'MANAGER' && role !== 'ADMIN') {
      // Staff/Volunteer — active only
      where.is_active = true;
    }
    // Manager/Admin — no filter, see all
  }

  const skills = await findAllSkills(where);
  return skills;
}
```

### 3. Controller (`backend/src/controllers/skill.controller.js`)

```javascript
import { getSkills } from '../services/skill.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export async function getSkillsHandler(req, res) {
  try {
    const skills = await getSkills(req.user);
    const message = skills.length > 0
      ? 'Lấy danh sách kỹ năng thành công'
      : 'Không có kỹ năng nào';
    return res.status(200).json(
      successResponse({ skills }, message)
    );
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

### 4. Routes (`backend/src/routes/skill.routes.js`)

```javascript
import { Router } from 'express';
import optionalAuth from '../middleware/optionalAuth.middleware.js';
import { getSkillsHandler } from '../controllers/skill.controller.js';

const router = Router();

/**
 * @swagger
 * /api/v1/skills:
 *   get:
 *     summary: Lấy danh sách kỹ năng
 *     description: |
 *       Trả về danh sách kỹ năng (skills). Hỗ trợ optional auth:
 *       - Guest (không token): active skills (public) — phục vụ UC11
 *       - Volunteer/Staff: active skills
 *       - Manager/Admin: tất cả (active + inactive)
 *       Endpoint này phục vụ UC11 (Filter Event) và UC20 (Edit Volunteer Skills).
 *     tags: [Skill Management]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       500:
 *         description: Lỗi server
 */
router.get('/', optionalAuth, getSkillsHandler);

export default router;
```

### 5. Update `backend/src/app.js`

```javascript
import skillRoutes from './routes/skill.routes.js';

// Thêm dòng này:
app.use('/api/v1/skills', skillRoutes);
```

### 6. Tests (`backend/tests/skill/skill.service.test.js`)

```javascript
// Test cases:
// 1. getSkills với user = null (Guest) → chỉ active skills
// 2. getSkills với role VOLUNTEER → chỉ active skills
// 3. getSkills với role STAFF → chỉ active skills
// 4. getSkills với role MANAGER → tất cả skills
// 5. getSkills với role ADMIN → tất cả skills
// 6. getSkills khi không có skill nào → mảng rỗng
```

### 7. Integration Tests (`backend/tests/skill/skill.api.test.js`)

```javascript
// Test cases:
// 1. GET /api/v1/skills không token (Guest) → 200 + only active
// 2. GET /api/v1/skills với token Manager → 200 + all (active + inactive)
// 3. GET /api/v1/skills với token Admin → 200 + all
// 4. GET /api/v1/skills với token Staff → 200 + only active
// 5. GET /api/v1/skills với token Volunteer → 200 + only active
```

## Frontend Implementation Order

### 1. API Client (`frontend/src/api/skillApi.js`)

```javascript
import axiosApi from './axiosApi';

export async function getSkills() {
  const response = await axiosApi.get('/skills');
  return response.data.data.skills;
}
```

**Lưu ý cho UC11 và UC20**: Khi Guest gọi `getSkills()`, Axios sẽ gửi request không kèm cookie — BE optionalAuth middleware tự xử lý. Khi Volunteer gọi, Axios tự động gửi kèm cookie.

### 2. Hook (`frontend/src/hooks/useSkills.js`)

```javascript
import { useState, useEffect } from 'react';
import { getSkills } from '../api/skillApi';

export function useSkills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const data = await getSkills();
        setSkills(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  return { skills, loading, error };
}
```

**Lưu ý cho UC11**: NamLD có thể tái sử dụng hook `useSkills` để lấy danh sách skill cho filter dropdown trên Event List page.

**Lưu ý cho UC20**: CuongLH có thể tái sử dụng hook `useSkills` để lấy danh sách skill cho Volunteer Skills management.

### 3. SkillListPage Component (`frontend/src/components/pages/SkillListPage.jsx`)

```jsx
import React from 'react';
import {
  Container, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress, Box
} from '@mui/material';
import { useSkills } from '../../hooks/useSkills';

export default function SkillListPage() {
  const { skills, loading, error } = useSkills();

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Container maxWidth="md" sx={{ mt: 4 }}><Typography color="error">{error}</Typography></Container>;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Skill Management</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {skills.length === 0 ? (
              <TableRow><TableCell colSpan={4}>No skills found</TableCell></TableRow>
            ) : (
              skills.map((skill) => (
                <TableRow key={skill.skill_id}>
                  <TableCell>{skill.skill_id}</TableCell>
                  <TableCell>{skill.name}</TableCell>
                  <TableCell>{skill.description || '—'}</TableCell>
                  <TableCell>
                    <Chip label={skill.is_active ? 'Active' : 'Inactive'} color={skill.is_active ? 'success' : 'default'} size="small" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

SkillListPage.propTypes = {};
```

### 4. Add Route in `frontend/src/App.js`

```jsx
import SkillListPage from './components/pages/SkillListPage';

// Thêm route:
<Route path="/skills" element={<SkillListPage />} />
```

## Integration với UC11 (Filter Event — NamLD)

Để UC11 sử dụng skills cho filter dropdown, NamLD cần:

```javascript
import { getSkills } from '../../../DucNM/UC34-feat-view-skill-list/frontend/src/api/skillApi';
// Hoặc import từ đường dẫn chính thức sau khi merge

// Fetch skills khi component mount (cả Guest và Volunteer đều có thể gọi)
const [skills, setSkills] = useState([]);
useEffect(() => {
  getSkills().then(setSkills).catch(console.error);
}, []);
```

## Integration với UC20 (Edit Volunteer Skills — CuongLH)

Để UC20 sử dụng skills cho Volunteer profile, CuongLH cần:

```javascript
import { getSkills } from '../../../DucNM/UC34-feat-view-skill-list/frontend/src/api/skillApi';

// Fetch skills — Volunteer chỉ thấy active skills
const [skills, setSkills] = useState([]);
useEffect(() => {
  getSkills().then(setSkills).catch(console.error);
}, []);
```

## Verification Steps

1. **API**: `GET /api/v1/skills` không token → 200 + only active skills
2. **API**: `GET /api/v1/skills` với token Manager/Admin → 200 + all (active + inactive)
3. **API**: `GET /api/v1/skills` với token Staff → 200 + only active
4. **API**: `GET /api/v1/skills` với token Volunteer → 200 + only active
5. **Database**: Verify Skill model migrated successfully
6. **Frontend**: Navigate to `/skills` → verify table renders correctly
7. **Cross-module**: Verify Guest có thể gọi API skills từ browser (no 401 error)
8. **Cross-module**: Verify Volunteer gọi API skills → chỉ thấy active (phục vụ UC20)
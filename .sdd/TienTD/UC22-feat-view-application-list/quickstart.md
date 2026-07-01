# Quickstart Guide: View Application List (UC22)

**Feature**: View Application List  
**Date**: 2026-06-29  
**Phase**: Phase 1 - Design  
**Status**: READY FOR IMPLEMENTATION

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup Steps](#setup-steps)
3. [Database Migration](#database-migration)
4. [Implementation Checklist](#implementation-checklist)
5. [Testing Locally](#testing-locally)
6. [Troubleshooting](#troubleshooting)
7. [Deployment Checklist](#deployment-checklist)

---

## Prerequisites

Trước khi bắt đầu implement UC22, verify các điều kiện sau:

### System Requirements
- ✅ Node.js 18+ installed
- ✅ MySQL 8.0+ running
- ✅ Prisma CLI installed: `npm install -g prisma`
- ✅ Git repository cloned

### Database Schema
- ✅ `applications` table exists with required columns
- ✅ `users` table exists with volunteer profiles
- ✅ `events` table exists with organization_id
- ✅ `organizations` table exists

### Authentication Setup
- ✅ JWT authentication middleware working (`backend/src/middleware/auth.middleware.js`)
- ✅ JWT token contains `userId` and `organizationId`
- ✅ HttpOnly cookies configured (`COOKIE_ACCESS_NAME` in `.env`)

### Existing Code
- ✅ `response.util.js` exists (`backend/src/utils/response.util.js`)
- ✅ Error handling middleware exists (`backend/src/middleware/error.middleware.js`)
- ✅ Pino logger configured (`backend/src/config/logger.config.js`)

---

## Setup Steps

### Step 1: Verify Environment Variables

Check `backend/.env` contains:

```bash
# Database
DATABASE_URL=mysql://user:password@localhost:3306/vms

# Authentication
AUTH_SECRET=your-jwt-secret-key
COOKIE_ACCESS_NAME=vms_access_token

# API
PORT=5000
API_PREFIX=/api/v1
```

### Step 2: Verify Prisma Schema

Check `backend/prisma/schema.prisma` includes:

```prisma
model Application {
  id         String            @id @default(uuid())
  event_id   String
  user_id    String
  status     ApplicationStatus @default(SUBMITTED)
  notes      String?           @db.Text
  created_at DateTime          @default(now())
  updated_at DateTime          @updatedAt
  
  event Event @relation(fields: [event_id], references: [id])
  user  User  @relation(fields: [user_id], references: [id])
  
  @@index([event_id, status, created_at(sort: Desc)], name: "idx_applications_event_status_created")
  @@index([event_id, created_at(sort: Desc)], name: "idx_applications_event_created")
  @@unique([event_id, user_id], name: "unique_application_per_event")
}

enum ApplicationStatus {
  SUBMITTED
  APPROVED
  REJECTED
}
```

**If indexes are missing**, add them to schema và run migration (see Step 3).

### Step 3: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

**Note**: No new packages required for UC22 (sử dụng existing dependencies).

---

## Database Migration

### Option A: Indexes Already Exist

Verify indexes exist:

```sql
SHOW INDEX FROM applications WHERE Key_name LIKE 'idx_applications_%';
SHOW INDEX FROM events WHERE Key_name = 'idx_events_org';
```

Expected output:
- `idx_applications_event_status_created` on (event_id, status, created_at)
- `idx_applications_event_created` on (event_id, created_at)
- `idx_events_org` on (organization_id, is_active)

**If indexes exist**: Skip to [Implementation Checklist](#implementation-checklist).

### Option B: Create Migration for Missing Indexes

```bash
cd backend

# Generate migration
npx prisma migrate dev --name add_application_indexes

# Or create manual migration file
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_add_application_indexes
```

**Migration file content** (`prisma/migrations/YYYYMMDDHHMMSS_add_application_indexes/migration.sql`):

```sql
-- Add composite index for filtered + sorted queries
CREATE INDEX IF NOT EXISTS idx_applications_event_status_created 
ON applications(event_id, status, created_at DESC);

-- Add composite index for non-filtered queries
CREATE INDEX IF NOT EXISTS idx_applications_event_created 
ON applications(event_id, created_at DESC);

-- Add index for event ownership validation
CREATE INDEX IF NOT EXISTS idx_events_org 
ON events(organization_id, is_active);

-- Analyze tables for query optimizer
ANALYZE TABLE applications;
ANALYZE TABLE events;
ANALYZE TABLE users;
```

**Apply migration**:

```bash
npx prisma migrate deploy
```

**Verify indexes created**:

```sql
EXPLAIN SELECT 
  a.id, a.status, a.notes, a.created_at,
  u.id as user_id, u.name, u.avatar_url
FROM applications a
JOIN users u ON a.user_id = u.id
JOIN events e ON a.event_id = e.id
WHERE a.event_id = 'test-event-uuid'
  AND e.organization_id = 'test-org-uuid'
  AND e.is_active = true
  AND a.status = 'SUBMITTED'
ORDER BY a.created_at DESC
LIMIT 20;

-- Expected: "Using index" in Extra column
```

---

## Implementation Checklist

### Backend Implementation

- [ ] **Step 1**: Create constants file
  - File: `backend/src/constants/application.constants.js`
  - Content: `USER_PUBLIC_PROFILE_SELECT`, `PAGINATION_DEFAULTS`, `ApplicationStatus`

- [ ] **Step 2**: Create pagination utility
  - File: `backend/src/utils/pagination.util.js`
  - Functions: `calculatePagination(page, limit, total)`

- [ ] **Step 3**: Create Zod validator
  - File: `backend/src/validators/application.validator.js`
  - Schemas: `ApplicationListQuerySchema`, `EventIdParamSchema`

- [ ] **Step 4**: Create repository layer
  - File: `backend/src/repositories/application.repository.js`
  - Functions: `findByEventId(eventId, filters, options)`, `countByEventId(eventId, statusFilter)`

- [ ] **Step 5**: Create service layer
  - File: `backend/src/services/application.service.js`
  - Functions: `getApplicationsByEvent(eventId, staffOrgId, filters)`
  - Logic: Ownership validation, pagination, sensitive data filtering

- [ ] **Step 6**: Create controller layer
  - File: `backend/src/controllers/application.controller.js`
  - Function: `getApplicationsByEvent(req, res, next)`
  - Responsibilities: Parse query params, call service, return response

- [ ] **Step 7**: Create routes
  - File: `backend/src/routes/application.routes.js`
  - Endpoint: `GET /events/:eventId/applications`
  - Middleware: `authenticate`, `validateQuery`

- [ ] **Step 8**: Register routes in Express app
  - File: `backend/src/app.js`
  - Add: `app.use('/api/v1', applicationRoutes);`

- [ ] **Step 9**: Write integration tests
  - File: `backend/tests/integration/application.test.js`
  - Test cases: Auth, pagination, filtering, ownership validation, sensitive data protection

- [ ] **Step 10**: Write Swagger documentation
  - File: `backend/src/controllers/application.controller.js`
  - Add `@swagger` JSDoc comments

### Frontend Implementation

- [ ] **Step 11**: Create API client
  - File: `frontend/src/api/applicationApi.js`
  - Function: `getApplicationsByEvent(eventId, filters)`
  - Config: `axios.create({ withCredentials: true })`

- [ ] **Step 12**: Create ApplicationListPage component
  - File: `frontend/src/components/pages/ApplicationListPage.jsx`
  - Features: Status filter, pagination, table display
  - State: URL query params với `useSearchParams`

- [ ] **Step 13**: Create UI components
  - File: `frontend/src/components/ui/FilterBar.jsx`
  - File: `frontend/src/components/ui/ApplicationTable.jsx`
  - File: `frontend/src/components/ui/Pagination.jsx`

- [ ] **Step 14**: Add route to React Router
  - File: `frontend/src/App.js`
  - Route: `/events/:eventId/applications`

- [ ] **Step 15**: Write component tests
  - File: `frontend/src/components/pages/__tests__/ApplicationListPage.test.jsx`
  - Test cases: Rendering, filtering, pagination

### Documentation

- [ ] **Step 16**: Update `share_context.md`
  - Add API contract: `GET /api/v1/events/:eventId/applications`
  - Add example request/response

- [ ] **Step 17**: Update `CLAUDE.md` Section 9
  - Add UC22 to Active Implementation Plans

---

## Testing Locally

### 1. Seed Test Data

Create seed script `backend/prisma/seed-applications.js`:

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedApplications() {
  // Create test organization
  const org = await prisma.organization.upsert({
    where: { id: 'test-org-uuid' },
    update: {},
    create: {
      id: 'test-org-uuid',
      name: 'Test Organization',
      is_active: true
    }
  });

  // Create test staff user
  const staff = await prisma.user.upsert({
    where: { email: 'staff@test.com' },
    update: {},
    create: {
      id: 'staff-uuid',
      name: 'Test Staff',
      email: 'staff@test.com',
      password_hash: 'hashed',
      role: 'STAFF',
      organization_id: org.id,
      is_active: true
    }
  });

  // Create test event
  const event = await prisma.event.upsert({
    where: { id: 'test-event-uuid' },
    update: {},
    create: {
      id: 'test-event-uuid',
      title: 'Test Event',
      organization_id: org.id,
      status: 'PUBLISHED',
      is_active: true,
      start_date: new Date(),
      end_date: new Date()
    }
  });

  // Create 50 test applications (mix of statuses)
  const statuses = ['SUBMITTED', 'APPROVED', 'REJECTED'];
  
  for (let i = 1; i <= 50; i++) {
    const volunteer = await prisma.user.upsert({
      where: { email: `volunteer${i}@test.com` },
      update: {},
      create: {
        id: `volunteer-${i}-uuid`,
        name: `Volunteer ${i}`,
        email: `volunteer${i}@test.com`,
        password_hash: 'hashed',
        role: 'VOLUNTEER',
        is_active: true
      }
    });

    await prisma.application.create({
      data: {
        event_id: event.id,
        user_id: volunteer.id,
        status: statuses[i % 3],
        notes: `Application notes for volunteer ${i}`,
        created_at: new Date(Date.now() - i * 3600000) // Stagger timestamps
      }
    });
  }

  console.log('✅ Seeded 50 applications');
}

seedApplications()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
```

Run seed:

```bash
cd backend
node prisma/seed-applications.js
```

### 2. Test Authentication

Get JWT token for test staff user:

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@test.com",
    "password": "test123"
  }'
```

Save cookie from response: `Set-Cookie: vms_access_token=...`

### 3. Test API Endpoint

**Test Case 1: Get all applications (no filter)**

```bash
curl -X GET "http://localhost:5000/api/v1/events/test-event-uuid/applications" \
  -H "Cookie: vms_access_token=YOUR_TOKEN" \
  -w "\nResponse Time: %{time_total}s\n"
```

Expected response:
- Status: 200
- Response time: <1.2s (per SC-001)
- Body: 20 applications (default page size)
- Pagination metadata present

**Test Case 2: Filter by status=SUBMITTED**

```bash
curl -X GET "http://localhost:5000/api/v1/events/test-event-uuid/applications?status=SUBMITTED" \
  -H "Cookie: vms_access_token=YOUR_TOKEN"
```

Expected: Only applications with status "SUBMITTED"

**Test Case 3: Pagination (page 2)**

```bash
curl -X GET "http://localhost:5000/api/v1/events/test-event-uuid/applications?page=2&limit=10" \
  -H "Cookie: vms_access_token=YOUR_TOKEN"
```

Expected:
- `pagination.current_page = 2`
- `pagination.limit = 10`
- Applications 11-20

**Test Case 4: Unauthorized (no token)**

```bash
curl -X GET "http://localhost:5000/api/v1/events/test-event-uuid/applications"
```

Expected:
- Status: 401
- Error: "Authentication required"

**Test Case 5: Forbidden (wrong organization)**

Create event for different org, try to access with staff token:

```bash
curl -X GET "http://localhost:5000/api/v1/events/other-org-event-uuid/applications" \
  -H "Cookie: vms_access_token=YOUR_TOKEN"
```

Expected:
- Status: 403
- Error: "You do not have permission to view applications for this event"

**Test Case 6: Sensitive data NOT exposed**

```bash
curl -X GET "http://localhost:5000/api/v1/events/test-event-uuid/applications" \
  -H "Cookie: vms_access_token=YOUR_TOKEN" \
  | jq '.data.applications[0].volunteer'
```

Expected output (MUST NOT contain):
- ❌ `address`
- ❌ `identity_card_number`
- ❌ `phone_number`
- ❌ `email`

Expected output (safe fields only):
```json
{
  "id": "volunteer-1-uuid",
  "name": "Volunteer 1",
  "avatar_url": "https://..."
}
```

### 4. Test Frontend Integration

Start frontend dev server:

```bash
cd frontend
npm start
```

Navigate to: `http://localhost:3000/events/test-event-uuid/applications`

**Manual Test Cases**:
1. **Page Load**: Verify 20 applications displayed by default
2. **Status Filter**: Click "Submitted" filter → URL updates to `?status=SUBMITTED` → Only submitted applications shown
3. **Pagination**: Click "Page 2" → URL updates to `?page=2` → Applications 21-40 displayed
4. **Browser Back**: Click browser back button → Returns to page 1 (URL state persists)
5. **Refresh**: Refresh page → Filter và pagination state preserved từ URL
6. **Shareable URL**: Copy URL với filters → Open in new tab → Same filtered view appears

---

## Troubleshooting

### Issue 1: Slow Query Performance (>1.2s)

**Symptoms**: API response time exceeds 1.2s target.

**Diagnosis**:

```sql
-- Check if indexes are being used
EXPLAIN SELECT * FROM applications 
WHERE event_id = 'test-event-uuid' 
ORDER BY created_at DESC 
LIMIT 20;
```

**Possible Causes**:
1. **Missing indexes**: Verify `idx_applications_event_status_created` exists
2. **Large offset**: Page 100+ sẽ chậm với offset-based pagination
3. **Slow JOIN**: Missing index on `events(organization_id, is_active)`

**Solutions**:
- Run `ANALYZE TABLE applications;` to update query optimizer statistics
- Add missing indexes (see [Database Migration](#database-migration))
- Consider caching total count query (5 minute TTL)
- Profile query với `SET profiling = 1; SHOW PROFILE FOR QUERY 1;`

---

### Issue 2: Sensitive Data Leaked in Response

**Symptoms**: `address` or `identity_card_number` appears in API response.

**Diagnosis**:

```bash
curl "http://localhost:5000/api/v1/events/test-event-uuid/applications" \
  -H "Cookie: vms_access_token=YOUR_TOKEN" \
  | jq '.data.applications[0].volunteer | keys'
```

Expected keys: `["id", "name", "avatar_url"]`

**Possible Causes**:
1. **Repository không dùng select**: Missing `USER_PUBLIC_PROFILE_SELECT` trong Prisma query
2. **Service layer return full user object**: Forgot DTO transformation

**Solutions**:
- Verify `application.repository.js` dùng:
  ```javascript
  include: {
    user: {
      select: USER_PUBLIC_PROFILE_SELECT
    }
  }
  ```
- Add integration test để catch regression:
  ```javascript
  expect(res.body.data.applications[0].volunteer).not.toHaveProperty('address');
  ```

---

### Issue 3: 403 Forbidden Error (Organization Mismatch)

**Symptoms**: Staff user receives 403 when accessing event from their own organization.

**Diagnosis**:

```javascript
// Check JWT token payload
const jwt = require('jsonwebtoken');
const token = 'YOUR_JWT_TOKEN';
console.log(jwt.decode(token));
```

Verify `organizationId` trong token matches event's `organization_id`.

**Possible Causes**:
1. **JWT missing organization_id**: Token không chứa org info
2. **Event belongs to different org**: Event ownership misconfigured
3. **Organization validation logic bug**: Service layer logic sai

**Solutions**:
- Verify `auth.middleware.js` extracts `organizationId` từ JWT và set `req.user.organizationId`
- Check event trong database: `SELECT organization_id FROM events WHERE id = 'event-uuid';`
- Debug service layer validation logic với console.log hoặc breakpoints

---

### Issue 4: Pagination Not Working (Always Returns Page 1)

**Symptoms**: Clicking "Next Page" không thay đổi results.

**Diagnosis**:

```bash
# Test with explicit page parameter
curl "http://localhost:5000/api/v1/events/test-event-uuid/applications?page=2" \
  -H "Cookie: vms_access_token=YOUR_TOKEN" \
  | jq '.data.pagination.current_page'
```

Expected: `2`

**Possible Causes**:
1. **Query param parsing failed**: `parseInt(req.query.page)` returns NaN
2. **Frontend state management**: React state không sync với URL params
3. **Offset calculation wrong**: `(page - 1) * limit` logic sai

**Solutions**:
- Use Zod coercion: `z.coerce.number().int().min(1).default(1)`
- Verify frontend uses `setSearchParams({ page: newPage })` to update URL
- Add logging: `console.log('Page:', page, 'Offset:', offset, 'Limit:', limit);`

---

### Issue 5: CORS Error in Frontend

**Symptoms**: Browser console shows "CORS policy blocked" error.

**Diagnosis**:

```javascript
// Check browser Network tab
// Headers should include:
// Access-Control-Allow-Origin: http://localhost:3000
// Access-Control-Allow-Credentials: true
```

**Possible Causes**:
1. **Backend CORS not configured**: Missing `cors` middleware
2. **Credentials not enabled**: `credentials: true` not set in CORS config
3. **Frontend not sending credentials**: Missing `withCredentials: true` in Axios

**Solutions**:
- Backend `app.js`:
  ```javascript
  import cors from 'cors';
  app.use(cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true
  }));
  ```
- Frontend `applicationApi.js`:
  ```javascript
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    withCredentials: true
  });
  ```

---

## Deployment Checklist

### Pre-deployment Validation

- [ ] All unit tests pass: `npm test`
- [ ] All integration tests pass: `npm run test:integration`
- [ ] Linting passes: `npm run lint`
- [ ] Swagger documentation updated: `http://localhost:5000/api-docs`
- [ ] `share_context.md` updated with API contract
- [ ] `CLAUDE.md` Section 9 updated

### Database Migration (Production)

```bash
# Run migration với backup
mysqldump -u user -p vms > backup_before_uc22_$(date +%Y%m%d).sql

# Apply migration
npx prisma migrate deploy

# Verify indexes
mysql -u user -p vms -e "SHOW INDEX FROM applications;"
```

### Deployment Steps

1. **Merge to Dev branch**:
   ```bash
   git checkout dev
   git merge 022-feat-view-application-list
   git push origin dev
   ```

2. **Deploy to Staging**:
   - Pull latest code
   - Run `npm install` (backend + frontend)
   - Apply database migrations
   - Restart backend server
   - Rebuild frontend: `npm run build`
   - Smoke test: Try accessing `/events/:eventId/applications` với staging credentials

3. **Production Deployment**:
   - Schedule maintenance window (optional, indexes can be added online)
   - Pull latest code from `main` branch
   - Apply migrations: `npx prisma migrate deploy`
   - Restart backend server (zero-downtime reload if using PM2/Docker)
   - Deploy frontend build to CDN/S3

### Post-deployment Validation

- [ ] Smoke test: Access `/events/:eventId/applications` in production
- [ ] Monitor logs: Check for errors trong first 30 minutes
- [ ] Performance check: Verify response times <1.2s (use APM tool)
- [ ] Query monitoring: Watch slow query log for unindexed queries
- [ ] Rollback plan: Keep previous version ready nếu cần rollback

### Rollback Procedure (If Needed)

```bash
# Revert code
git revert <commit-hash>
git push origin main

# Revert migration (ONLY if no data corruption)
npx prisma migrate resolve --rolled-back <migration-name>

# Restore database backup (LAST RESORT)
mysql -u user -p vms < backup_before_uc22_YYYYMMDD.sql
```

---

## Performance Benchmarks

### Expected Performance (50 applications)

| Operation | Target | Acceptable | Action if Exceeded |
|-----------|--------|------------|-------------------|
| GET all (no filter) | <500ms | <1.2s | Check indexes |
| GET with status filter | <300ms | <800ms | Run ANALYZE TABLE |
| GET page 1 | <200ms | <600ms | Check JOIN performance |
| GET page 10 (offset 180) | <400ms | <1s | Consider cursor pagination |

### Monitoring Queries

```sql
-- Check slow queries
SELECT query_time, sql_text 
FROM mysql.slow_log 
WHERE sql_text LIKE '%applications%' 
ORDER BY query_time DESC 
LIMIT 10;

-- Check index usage
SELECT 
  table_name,
  index_name,
  cardinality,
  stat_value as rows_read
FROM information_schema.statistics
WHERE table_name = 'applications';
```

---

## Next Steps After Implementation

1. **Generate tasks.md**: Run `/speckit-tasks` để break down implementation into atomic tasks
2. **Start Implementation**: Follow tasks.md sequentially hoặc parallel (based on dependencies)
3. **Monitor Performance**: Track query times trong production logs
4. **User Feedback**: Collect feedback từ Staff users về UX
5. **Iterate**: Plan UC23 (View Application Detail) và UC24 (Approve Application)

---

**Quickstart Guide Complete** ✅

This guide covers setup, implementation, testing, troubleshooting, và deployment cho UC22. Refer to `plan.md`, `research.md`, `data-model.md`, và API contract for detailed technical specifications.


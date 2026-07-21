# Quickstart Guide: Approve Application (UC24)

**Branch**: `024-feat-approve-application` | **Date**: 2026-06-29 | **Phase**: 1 (Setup & Testing)

**Purpose**: Step-by-step guide to setup, implement, and test UC24 approve application feature locally.

---

## Prerequisites

Before starting UC24 implementation, ensure:

- ✅ **Node.js 18+** installed (`node --version`)
- ✅ **MySQL 8.0+** running locally or accessible
- ✅ **Git** repository cloned and on `Dev` branch
- ✅ **UC22 (List Applications)** completed and merged
- ✅ **UC23 (View Application Detail)** completed and merged
- ✅ **UC64 (Email Service)** deployed and accessible (for integration testing)
- ✅ Development dependencies installed:
  ```bash
  cd backend
  npm install
  ```

---

## Step 1: Create Feature Branch

Create new branch following VMS naming convention:

```bash
# From Dev branch
git checkout Dev
git pull origin Dev

# Create UC24 feature branch
git checkout -b 024-feat-approve-application
```

**Branch Naming**: `[UC-number]-feat-[short-description]`

---

## Step 2: Database Schema Migration

### 2.1 Update Prisma Schema

Edit `backend/prisma/schema.prisma`:

```prisma
// Add approved_at field to Application model
model Application {
  id                    String    @id @default(uuid())
  event_id              String
  volunteer_id          String
  status                String
  motivation            String?   @db.Text
  availability          String?   @db.Text
  processed_by_staff_id String?
  approved_at           DateTime? // NEW FIELD
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt
  
  event                 Event     @relation(fields: [event_id], references: [id])
  volunteer             User      @relation("VolunteerApplications", fields: [volunteer_id], references: [id])
  processedByStaff      User?     @relation("StaffProcessedApplications", fields: [processed_by_staff_id], references: [id])
  
  @@index([event_id])
  @@index([volunteer_id])
  @@index([status])
  @@index([approved_at]) // NEW INDEX
  @@unique([event_id, volunteer_id])
}

// Add new EmailQueue model (for transactional outbox pattern)
model EmailQueue {
  id              String    @id @default(uuid())
  type            String
  recipient_id    String
  application_id  String
  status          String    @default("PENDING")
  retry_count     Int       @default(0)
  last_error      String?   @db.Text
  created_at      DateTime  @default(now())
  sent_at         DateTime?
  
  recipient       User        @relation("EmailRecipient", fields: [recipient_id], references: [id])
  application     Application @relation(fields: [application_id], references: [id])
  
  @@index([status, retry_count])
  @@index([created_at])
  @@index([application_id])
}
```

### 2.2 Generate Migration

```bash
cd backend

# Create migration
npx prisma migrate dev --name add_approval_fields_and_email_queue

# Verify migration created
ls prisma/migrations/
```

**Expected Output**: New migration folder like `20260629_add_approval_fields_and_email_queue/`

### 2.3 Apply Migration

```bash
# Apply to local database
npx prisma migrate deploy

# Regenerate Prisma Client
npx prisma generate
```

### 2.4 Verify Schema

```bash
# Check tables created
npx prisma studio
# Navigate to EmailQueue model, verify it exists
# Navigate to Application model, verify approved_at field exists
```

**Alternative Verification** (MySQL CLI):
```sql
USE vms_dev;
DESCRIBE applications;
-- Verify approved_at column exists

DESCRIBE email_queue;
-- Verify all columns: id, type, recipient_id, application_id, status, retry_count, last_error, created_at, sent_at

SHOW INDEXES FROM applications;
-- Verify idx_applications_approved_at exists

SHOW INDEXES FROM email_queue;
-- Verify indexes on (status, retry_count), created_at, application_id
```

---

## Step 3: Environment Configuration

### 3.1 Update `.env` File

Add email service configuration:

```bash
# backend/.env

# Email Service (UC64) Configuration
EMAIL_SERVICE_URL=http://localhost:5001/api/v1/emails
EMAIL_SERVICE_TIMEOUT_MS=5000
EMAIL_WORKER_INTERVAL_SECONDS=10
EMAIL_MAX_RETRIES=3
```

**Note**: Replace `http://localhost:5001` with actual UC64 email service URL if different.

### 3.2 Verify Environment Variables

```bash
# Check .env loaded correctly
cd backend
node -e "require('dotenv').config(); console.log(process.env.EMAIL_SERVICE_URL);"
# Expected output: http://localhost:5001/api/v1/emails
```

---

## Step 4: Seed Test Data

### 4.1 Create Seed Script (Optional)

Create `backend/prisma/seeds/uc24-approve-test-data.seed.js`:

```javascript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedUC24TestData() {
  console.log('Seeding UC24 test data...');
  
  // Create test event with max_capacity = 10
  const testEvent = await prisma.event.create({
    data: {
      title: 'UC24 Test Event - Approval Testing',
      organization_id: 'your-org-id-here', // Replace with actual org ID
      max_capacity: 10,
      event_date: new Date('2026-12-31'),
      status: 'APPROVED'
    }
  });
  
  console.log(`Created test event: ${testEvent.id}`);
  
  // Create 15 test applications (mix of SUBMITTED, REVIEWED, APPROVED, REJECTED)
  const statuses = ['SUBMITTED', 'SUBMITTED', 'SUBMITTED', 'REVIEWED', 'REVIEWED', 'APPROVED', 'APPROVED', 'REJECTED'];
  
  for (let i = 0; i < 15; i++) {
    await prisma.application.create({
      data: {
        event_id: testEvent.id,
        volunteer_id: 'volunteer-id-' + i, // Replace with actual volunteer IDs
        status: statuses[i % statuses.length],
        motivation: `Test motivation ${i}`,
        availability: `Available ${i}`
      }
    });
  }
  
  console.log('Seeded 15 test applications');
  console.log('✅ UC24 test data ready!');
}

seedUC24TestData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 4.2 Run Seed (Manual Alternative)

If not using seed script, manually insert via Prisma Studio or MySQL CLI:

```sql
-- Create test applications
INSERT INTO applications (id, event_id, volunteer_id, status, created_at, updated_at)
VALUES 
  (UUID(), 'your-event-id', 'volunteer-1', 'SUBMITTED', NOW(), NOW()),
  (UUID(), 'your-event-id', 'volunteer-2', 'SUBMITTED', NOW(), NOW()),
  (UUID(), 'your-event-id', 'volunteer-3', 'REVIEWED', NOW(), NOW()),
  (UUID(), 'your-event-id', 'volunteer-4', 'REVIEWED', NOW(), NOW()),
  (UUID(), 'your-event-id', 'volunteer-5', 'APPROVED', NOW(), NOW());
```

---

## Step 5: Backend Implementation

### 5.1 File Structure

Create/update these files following layered architecture:

```
backend/src/
├── controllers/
│   └── application.controller.js      [UPDATE] Add approveApplication, bulkApproveApplications
├── services/
│   └── application.service.js         [UPDATE] Add approveApplication, bulkApproveApplications
├── repositories/
│   └── application.repository.js      [UPDATE] Add updateStatus, findByIds
├── routes/
│   └── application.routes.js          [UPDATE] Add PATCH /:id/approve, POST /bulk-approve
├── validators/
│   └── application.validator.js       [UPDATE] Add bulkApproveSchema
├── utils/
│   ├── email.util.js                  [CREATE] Email service integration helper
│   └── audit.util.js                  [REUSE] Audit logging
└── workers/
    └── email-worker.js                [CREATE] Background email worker
```

### 5.2 Implementation Order

Follow this sequence to avoid dependency issues:

1. **Repository Layer** → `application.repository.js`
2. **Service Layer** → `application.service.js`
3. **Controller Layer** → `application.controller.js`
4. **Validation** → `application.validator.js`
5. **Routes** → `application.routes.js`
6. **Email Worker** → `workers/email-worker.js`

**Detailed implementation code**: See `contracts/PATCH-applications-applicationId-approve.md` and `contracts/POST-applications-bulk-approve.md` Implementation Notes sections.

---

## Step 6: Start Email Worker

### 6.1 Update `backend/src/index.js`

Import email worker to auto-start cron:

```javascript
// backend/src/index.js
import express from 'express';
import './workers/email-worker.js'; // Auto-starts email worker cron

const app = express();
// ... rest of server setup
```

### 6.2 Verify Worker Running

```bash
# Start backend server
cd backend
npm run dev

# Check logs for worker startup
# Expected output:
# [Email Worker] Starting cron job (every 10 seconds)
# [Email Worker] Polling for pending email jobs...
```

---

## Step 7: Local Testing

### 7.1 Manual API Testing (Postman/cURL)

**Test 1: Single Approve (Happy Path)**

```bash
curl -X PATCH http://localhost:3000/api/v1/applications/{application-id}/approve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Expected Response: 200 OK
# {
#   "success": true,
#   "message": "Application approved successfully",
#   "data": { ... }
# }
```

**Test 2: Bulk Approve**

```bash
curl -X POST http://localhost:3000/api/v1/applications/bulk-approve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "application_ids": [
      "uuid-1",
      "uuid-2",
      "uuid-3"
    ]
  }'

# Expected Response: 200 OK with summary
```

**Test 3: Organization Validation (Negative Test)**

```bash
# Use Staff token from different organization
curl -X PATCH http://localhost:3000/api/v1/applications/{cross-org-app-id}/approve \
  -H "Authorization: Bearer DIFFERENT_ORG_TOKEN" \
  -H "Content-Type: application/json"

# Expected Response: 403 Forbidden
# {
#   "success": false,
#   "error": {
#     "code": "ORGANIZATION_MISMATCH",
#     ...
#   }
# }
```

### 7.2 Integration Testing (Jest + Supertest)

**Test File**: `backend/tests/integration/application-approve.test.js`

```javascript
import request from 'supertest';
import app from '../../src/app.js';
import { generateStaffToken } from '../helpers/auth.helper.js';

describe('PATCH /api/v1/applications/:id/approve', () => {
  let staffToken;
  let testApplicationId;
  
  beforeAll(async () => {
    staffToken = await generateStaffToken();
    testApplicationId = await createTestApplication({ status: 'SUBMITTED' });
  });
  
  it('should approve SUBMITTED application', async () => {
    const response = await request(app)
      .patch(`/api/v1/applications/${testApplicationId}/approve`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.application.status).toBe('APPROVED');
  });
  
  it('should return 403 for cross-organization application', async () => {
    const crossOrgAppId = await createTestApplication({ 
      organizationId: 'different-org' 
    });
    
    await request(app)
      .patch(`/api/v1/applications/${crossOrgAppId}/approve`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(403);
  });
  
  // More tests...
});
```

**Run Tests**:
```bash
cd backend
npm test -- application-approve.test.js

# Expected: All tests pass
# Target coverage: 80%+ for Service layer
```

### 7.3 Email Queue Verification

Check email jobs created:

```sql
-- Check email_queue table
SELECT * FROM email_queue WHERE status = 'PENDING' ORDER BY created_at DESC LIMIT 10;

-- Expected: See PENDING jobs for approved applications

-- Wait 10 seconds for worker to process

SELECT * FROM email_queue WHERE status = 'SENT' ORDER BY sent_at DESC LIMIT 10;

-- Expected: PENDING jobs moved to SENT after worker processes
```

---

## Step 8: Frontend Integration

### 8.1 Update API Client

Edit `frontend/src/api/applicationApi.js`:

```javascript
// frontend/src/api/applicationApi.js
import axios from 'axios';

const API_BASE = '/api/v1/applications';

export const applicationApi = {
  // ... existing methods
  
  approveApplication: async (applicationId) => {
    const response = await axios.patch(
      `${API_BASE}/${applicationId}/approve`,
      {}, // Empty body
      { headers: { 'Authorization': `Bearer ${getToken()}` } }
    );
    return response.data;
  },
  
  bulkApproveApplications: async (applicationIds) => {
    const response = await axios.post(
      `${API_BASE}/bulk-approve`,
      { application_ids: applicationIds },
      { headers: { 'Authorization': `Bearer ${getToken()}` } }
    );
    return response.data;
  }
};
```

### 8.2 Create Approve Button Component

Create `frontend/src/components/ui/ApproveButton.jsx`:

```jsx
import { Button, CircularProgress } from '@mui/material';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { applicationApi } from '../../api/applicationApi';

export function ApproveButton({ applicationId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  
  const handleApprove = async () => {
    setLoading(true);
    try {
      const result = await applicationApi.approveApplication(applicationId);
      
      if (result.data.already_approved) {
        toast.info('Application is already approved');
      } else {
        toast.success('Application approved successfully');
      }
      
      onSuccess?.();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Approval failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button
      variant="contained"
      color="success"
      onClick={handleApprove}
      disabled={loading}
      startIcon={loading ? <CircularProgress size={20} /> : null}
    >
      {loading ? 'Approving...' : 'Approve'}
    </Button>
  );
}
```

### 8.3 Update Application Detail Page (UC23)

Edit `frontend/src/components/pages/ApplicationDetailPage.jsx`:

```jsx
import { ApproveButton } from '../ui/ApproveButton';

function ApplicationDetailPage() {
  const [application, setApplication] = useState(null);
  
  const handleApproveSuccess = () => {
    // Refresh application data
    fetchApplication();
  };
  
  return (
    <div>
      {/* ... application details ... */}
      
      {application.status !== 'APPROVED' && (
        <ApproveButton 
          applicationId={application.id}
          onSuccess={handleApproveSuccess}
        />
      )}
    </div>
  );
}
```

### 8.4 Frontend Testing

```bash
cd frontend

# Start dev server
npm run dev

# Navigate to: http://localhost:5173/applications/{application-id}
# Click "Approve" button
# Verify:
# 1. Button disables during request
# 2. Success toast appears
# 3. Application status updates to "APPROVED"
# 4. Button hides after approval
```

---

## Step 9: Troubleshooting

### Common Issues & Solutions

#### Issue 1: Migration Fails - "approved_at column already exists"

**Cause**: Running migration twice or schema out of sync

**Solution**:
```bash
# Reset migration
npx prisma migrate reset --force
npx prisma migrate dev
```

---

#### Issue 2: Email Worker Not Sending Emails

**Symptom**: `email_queue` has PENDING jobs but they never become SENT

**Debug Steps**:
1. Check worker logs:
   ```bash
   # Look for worker startup message
   grep "Email Worker" logs/app.log
   ```

2. Verify email service URL:
   ```bash
   curl http://localhost:5001/api/v1/emails
   # Expected: Email service responds (or 404 if endpoint doesn't exist yet)
   ```

3. Check email_queue retry_count:
   ```sql
   SELECT id, retry_count, last_error FROM email_queue WHERE status = 'PENDING';
   ```

**Solution**: If `retry_count = 3`, emails are marked FAILED. Check `last_error` field for reason.

---

#### Issue 3: 403 Forbidden - Organization Mismatch

**Symptom**: Staff gets 403 when approving valid application

**Debug**:
```javascript
// Check JWT token payload
const decoded = jwt.decode(token);
console.log('Staff org:', decoded.organizationId);

// Check application's event org
const app = await prisma.application.findUnique({
  where: { id: applicationId },
  include: { event: true }
});
console.log('Event org:', app.event.organization_id);
```

**Solution**: Ensure Staff token's `organizationId` matches event's `organization_id`.

---

#### Issue 4: Capacity Hard Limit Error (409 Conflict)

**Symptom**: Cannot approve application even when event capacity seems available

**Debug**:
```sql
-- Check current approved count
SELECT COUNT(*) FROM applications WHERE event_id = 'your-event-id' AND status = 'APPROVED';

-- Check event max_capacity
SELECT max_capacity FROM events WHERE id = 'your-event-id';

-- Calculate hard limit (max_capacity * 1.2)
```

**Solution**: 
- If at 120% capacity → legitimate block (increase event max_capacity)
- If calculation wrong → check capacity logic in `application.service.js`

---

#### Issue 5: Tests Fail - "Jest did not exit one second after test run"

**Cause**: Prisma Client or cron job not disconnected

**Solution**:
```javascript
// In test file afterAll hook
afterAll(async () => {
  await prisma.$disconnect();
  // Stop cron if started
});
```

---

## Step 10: Swagger Documentation

### 10.1 Add Swagger JSDoc Comments

In `backend/src/routes/application.routes.js`:

```javascript
/**
 * @swagger
 * /applications/{applicationId}/approve:
 *   patch:
 *     summary: Approve single application
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Application approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApproveApplicationResponse'
 *       403:
 *         description: Organization mismatch
 *       404:
 *         description: Application not found
 */
router.patch('/:applicationId/approve', authMiddleware, applicationController.approveApplication);

/**
 * @swagger
 * /applications/bulk-approve:
 *   post:
 *     summary: Bulk approve multiple applications
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               application_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *                 maxItems: 50
 *     responses:
 *       200:
 *         description: Bulk approve completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BulkApproveResponse'
 */
router.post('/bulk-approve', authMiddleware, applicationController.bulkApproveApplications);
```

### 10.2 Verify Swagger UI

```bash
# Start server
npm run dev

# Open browser
open http://localhost:3000/api-docs

# Navigate to Applications section
# Verify PATCH /applications/{applicationId}/approve endpoint exists
# Verify POST /applications/bulk-approve endpoint exists
```

---

## Step 11: Update Share Context

Edit `share_context.md` to document new API endpoints:

```markdown
## Application Management (TienTD) - UC24 Added

### PATCH /api/v1/applications/:applicationId/approve
- **Auth**: Staff role + Organization ownership
- **Body**: EMPTY
- **Response**: 200 OK { application, capacity_info, email_status }
- **Errors**: 400 (invalid state), 403 (org mismatch), 404 (not found), 409 (capacity)

### POST /api/v1/applications/bulk-approve
- **Auth**: Staff role + Organization ownership
- **Body**: { application_ids: [uuid] } (max 50 items)
- **Response**: 200 OK { summary, successful[], failed[] }
- **Note**: Partial success possible (non-atomic)
```

---

## Step 12: Pre-Merge Checklist

Before creating Pull Request, verify:

- [ ] All migration files committed
- [ ] Prisma schema updated and synced
- [ ] Backend implementation follows layered architecture (Controller → Service → Repository)
- [ ] Email worker auto-starts with server
- [ ] Integration tests pass (80%+ coverage for Service layer)
- [ ] Frontend components render correctly
- [ ] Swagger documentation complete
- [ ] `share_context.md` updated with API contracts
- [ ] No `console.log` or `TODO` comments in production code
- [ ] Environment variables documented in `.env.example`
- [ ] Code follows VMS naming conventions
- [ ] No ESLint warnings
- [ ] Git commit messages follow convention: `feat(UC24): [description]`

---

## Step 13: Create Pull Request

```bash
# Stage all changes
git add .

# Commit with conventional format
git commit -m "feat(UC24): implement approve application with email queue

- Add approved_at field to Application model
- Add EmailQueue model for transactional outbox pattern
- Implement PATCH /applications/:id/approve endpoint
- Implement POST /applications/bulk-approve endpoint
- Add email worker with 10s polling interval
- Add frontend ApproveButton component
- Update Swagger documentation
- Test coverage: 85% (Service layer)"

# Push to remote
git push origin 024-feat-approve-application

# Create PR via GitHub/GitLab UI
# Title: "[UC24] Feat: Approve Application"
# Description: Link to spec.md, list key changes, testing done
```

---

## Performance Benchmarks (Optional)

Run load tests to verify performance targets:

```bash
# Install k6 (load testing tool)
brew install k6  # macOS
# or: sudo apt-get install k6  # Linux

# Create load test script
cat > loadtest-approve.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '10s', target: 0 },   // Ramp down
  ],
};

export default function () {
  const token = 'YOUR_JWT_TOKEN';
  const appId = 'test-application-id';
  
  const res = http.patch(
    `http://localhost:3000/api/v1/applications/${appId}/approve`,
    null,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
EOF

# Run load test
k6 run loadtest-approve.js

# Expected results:
# - avg response time: < 200ms (p50)
# - p95 response time: < 500ms
# - throughput: > 100 req/s
```

---

## Next Steps (Phase 2)

After Phase 1 artifacts complete and reviewed:

1. Run `/speckit-tasks` to generate `tasks.md` with atomic implementation tasks
2. Execute tasks sequentially following dependency order
3. Commit after each completed task for atomic git history
4. Create PR when all tasks complete

**Estimated Phase 2 Duration**: 2 days (single developer, 37 tasks)

---

**End of Quickstart Guide** — Ready to implement UC24!

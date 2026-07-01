# Quickstart Guide: View Attendance List (UC46)

**Feature Branch**: `046-feat-view-attendance-list`  
**Created**: 2026-06-30  
**Status**: READY FOR IMPLEMENTATION

---

## 1. Overview

**Feature**: View Attendance List (UC46)  
**Purpose**: Enable Staff to view the attendance status of all approved volunteers for an event  
**Complexity**: 🟢 LOW (Read-only feature, no database migrations, reuses UC45 infrastructure)  
**Estimated Time**: ~8 hours (Backend: 4h, Frontend: 4h)

**Key Characteristics**:
- ✅ **Read-only** - No write operations to database
- ✅ **No migration required** - Reuses existing tables from UC22, UC24, UC45
- ✅ **Single API endpoint** - GET `/api/v1/attendances/events/:eventId`
- ✅ **Client-side pagination** - Material UI DataGrid handles pagination/search
- ✅ **Organization-based authorization** - Staff can only view events from their org

---

## 2. Prerequisites

### Required Completed Features
- ✅ **UC22** (List Applications) - Provides `volunteer_applications` table
- ✅ **UC24** (Approve Application) - Provides `APPROVED` status enum
- ✅ **UC45** (Attendance Check) - Provides `attendances` table with LEFT JOIN capability
- ✅ **UC01-UC09** (User Management) - Provides `users` table with `full_name` and `avatar_url`
- ✅ **UC10-UC19** (Event Management) - Provides `events` table with `organization_id`

### Development Environment
- Node.js 18+ (ESM modules)
- MySQL 8.0+
- Prisma ORM (already configured)
- React 19 + Material UI
- JWT authentication middleware (from UC01)

---

## 3. Quick Implementation Steps

### Phase 0: Verification (5 minutes)

```bash
# 1. Verify database schema has required tables
cd backend
npx prisma db pull
npx prisma generate

# 2. Check for existing tables:
# - volunteer_applications (from UC22)
# - attendances (from UC45)
# - users (from UC01)
# - events (from UC10)
```

**Expected Result**: All 4 tables exist, no migration needed

---

### Phase 1: Backend Repository Layer (30 minutes)

**File**: `backend/src/repositories/application.repository.js`

**Add Method**:
```javascript
/**
 * Get approved applications with attendance data for an event
 * Uses LEFT JOIN to include volunteers not yet checked-in
 * @param {string} eventId - Event UUID
 * @param {string} organizationId - Staff's organization ID for authorization
 * @returns {Promise<Application[]>} Applications with user and attendance relations
 */
async getApprovedApplicationsWithAttendance(eventId, organizationId) {
  return await this.prisma.application.findMany({
    where: {
      event_id: eventId,
      status: 'APPROVED',
      event: {
        organization_id: organizationId // Authorization filter
      }
    },
    include: {
      user: {
        select: {
          id: true,
          full_name: true,
          avatar_url: true
          // Explicitly OMIT: email, phone, national_id per FR-016
        }
      },
      attendance: {
        select: {
          id: true,
          status: true,
          checked_in_at: true,
          checked_in_by: true,
          notes: true
        }
      },
      event: {
        select: {
          id: true,
          name: true,
          organization_id: true
        }
      }
    },
    orderBy: {
      created_at: 'asc'
    }
  });
}
```

**Test**:
```bash
cd backend/tests/unit/repositories
# Create application.repository.test.js and add test for this method
npm test -- application.repository.test.js
```

---

### Phase 2: Backend Service Layer (1 hour)

**File**: `backend/src/services/attendance.service.js`

**Add Method**:
```javascript
/**
 * Get attendance list for an event
 * @param {string} eventId - Event UUID
 * @param {string} staffOrganizationId - Staff's organization ID
 * @returns {Promise<AttendanceListResponseDTO>}
 * @throws {NotFoundError} If event does not exist
 * @throws {ForbiddenError} If staff's org != event's org
 */
async getAttendanceListByEvent(eventId, staffOrganizationId) {
  // Step 1: Fetch approved applications with attendance (LEFT JOIN)
  const applications = await this.applicationRepository
    .getApprovedApplicationsWithAttendance(eventId, staffOrganizationId);

  // Step 2: Handle edge cases (empty result)
  if (applications.length === 0) {
    // Verify event exists and check authorization
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, organization_id: true }
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.organization_id !== staffOrganizationId) {
      throw new ForbiddenError('You do not have access to this event');
    }

    // Event exists but no approved applications
    return {
      event_id: eventId,
      event_name: event.name,
      total_approved: 0,
      present_count: 0,
      absent_count: 0,
      attendances: []
    };
  }

  // Step 3: Transform data to DTO format
  const attendances = applications.map(app => ({
    application_id: app.id,
    volunteer_id: app.user.id,
    volunteer_name: app.user.full_name,
    volunteer_avatar: app.user.avatar_url,
    status: app.attendance ? 'PRESENT' : 'ABSENT', // Key transformation
    checked_in_at: app.attendance?.checked_in_at?.toISOString() || null,
    checked_in_by: app.attendance?.checked_in_by || null,
    notes: app.attendance?.notes || null
  }));

  // Step 4: Calculate summary counts
  const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
  const absentCount = attendances.filter(a => a.status === 'ABSENT').length;

  return {
    event_id: applications[0].event.id,
    event_name: applications[0].event.name,
    total_approved: attendances.length,
    present_count: presentCount,
    absent_count: absentCount,
    attendances
  };
}
```

**Test**:
```bash
cd backend/tests/unit/services
# Create attendance.service.test.js
npm test -- attendance.service.test.js
```

---

### Phase 3: Backend Controller Layer (30 minutes)

**File**: `backend/src/controllers/attendance.controller.js`

**Add Method**:
```javascript
/**
 * GET /api/v1/attendances/events/:eventId
 * Retrieve attendance list for an event
 */
async getAttendanceList(req, res, next) {
  try {
    const { eventId } = req.params;
    const { organizationId } = req.user; // From JWT via authMiddleware

    // Validate UUID format
    if (!isValidUUID(eventId)) {
      return res.status(400).json(
        responseUtil.error('Invalid event ID format', 'VALIDATION_ERROR')
      );
    }

    const result = await this.attendanceService.getAttendanceListByEvent(
      eventId,
      organizationId
    );

    return res.status(200).json(
      responseUtil.success(result, 'Attendance list retrieved successfully')
    );
  } catch (error) {
    next(error); // Pass to centralized error middleware
  }
}
```

---

### Phase 4: Backend Routes & Validation (30 minutes)

**File**: `backend/src/validators/attendance.validator.js`

**Add Schema**:
```javascript
import { z } from 'zod';

export const eventIdParamSchema = z.object({
  eventId: z.string().uuid('Must be a valid UUID')
});
```

**File**: `backend/src/routes/attendance.routes.js`

**Add Route**:
```javascript
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { attendanceController } from '../controllers/attendance.controller.js';
import { eventIdParamSchema } from '../validators/attendance.validator.js';

const router = Router();

/**
 * @swagger
 * /api/v1/attendances/events/{eventId}:
 *   get:
 *     summary: View attendance list for an event
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Attendance list retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied (different organization)
 *       404:
 *         description: Event not found
 */
router.get(
  '/events/:eventId',
  authMiddleware.authenticate,
  validateRequest({ params: eventIdParamSchema }),
  attendanceController.getAttendanceList.bind(attendanceController)
);

export default router;
```

**File**: `backend/src/routes/index.js`

**Register Routes**:
```javascript
import attendanceRoutes from './attendance.routes.js';

// ... existing routes

router.use('/api/v1/attendances', attendanceRoutes);
```

---

### Phase 5: Backend Testing (1 hour)

**File**: `backend/tests/integration/attendance.api.test.js`

```javascript
import request from 'supertest';
import app from '../../src/app.js';
import { generateStaffToken, generateVolunteerToken } from '../helpers/auth.helper.js';

describe('GET /api/v1/attendances/events/:eventId', () => {
  let staffToken, volunteerToken, eventId, orgId;

  beforeAll(async () => {
    // Setup test data
    ({ staffToken, volunteerToken, eventId, orgId } = await setupTestData());
  });

  test('Should return 200 with attendance list for Staff', async () => {
    const res = await request(app)
      .get(`/api/v1/attendances/events/${eventId}`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('total_approved');
    expect(res.body.data).toHaveProperty('present_count');
    expect(res.body.data).toHaveProperty('absent_count');
    expect(res.body.data.attendances).toBeInstanceOf(Array);
  });

  test('Should return 403 for Volunteer role', async () => {
    const res = await request(app)
      .get(`/api/v1/attendances/events/${eventId}`)
      .set('Authorization', `Bearer ${volunteerToken}`);

    expect(res.status).toBe(403);
  });

  test('Should return 401 without token', async () => {
    const res = await request(app)
      .get(`/api/v1/attendances/events/${eventId}`);

    expect(res.status).toBe(401);
  });
});
```

**Run Tests**:
```bash
npm test -- attendance.api.test.js
```

---

### Phase 6: Frontend API Client (30 minutes)

**File**: `frontend/src/services/api/attendanceApi.js`

```javascript
import axios from 'axios';
import { getAuthToken } from '../utils/auth.util.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const attendanceApi = {
  /**
   * Get attendance list for an event
   * @param {string} eventId - Event UUID
   * @returns {Promise<AttendanceListResponseDTO>}
   */
  async getAttendanceList(eventId) {
    const response = await axios.get(
      `${BASE_URL}/api/v1/attendances/events/${eventId}`,
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }
};
```

---

### Phase 7: Frontend UI Components (2 hours)

**File**: `frontend/src/pages/Staff/AttendanceListPage.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import RefreshIcon from '@mui/icons-material/Refresh';
import { attendanceApi } from '../../services/api/attendanceApi';
import { useDebounce } from '../../hooks/useDebounce';

export default function AttendanceListPage() {
  const { eventId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch attendance list
  const fetchAttendanceList = async () => {
    try {
      setLoading(true);
      const result = await attendanceApi.getAttendanceList(eventId);
      setData(result.data);
    } catch (error) {
      console.error('Error fetching attendance list:', error);
      // Show error toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceList();
  }, [eventId]);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent duplicate requests
    setIsRefreshing(true);
    try {
      await fetchAttendanceList();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter data based on search and status
  const filteredData = data?.attendances.filter(item => {
    const matchesSearch = item.volunteer_name
      .toLowerCase()
      .includes(debouncedSearch.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Present' && item.status === 'PRESENT') ||
      (statusFilter === 'Absent' && item.status === 'ABSENT');
    return matchesSearch && matchesStatus;
  }) || [];

  // DataGrid columns
  const columns = [
    {
      field: 'volunteer_name',
      headerName: 'Volunteer Name',
      width: 200,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          {params.row.volunteer_avatar && (
            <img
              src={params.row.volunteer_avatar}
              alt={params.row.volunteer_name}
              style={{ width: 32, height: 32, borderRadius: '50%' }}
            />
          )}
          <span>{params.row.volunteer_name}</span>
        </Box>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'PRESENT' ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'checked_in_at',
      headerName: 'Check-in Time',
      width: 180,
      valueFormatter: (params) =>
        params.value ? new Date(params.value).toLocaleString() : 'Not checked-in'
    },
    {
      field: 'notes',
      headerName: 'Notes',
      width: 200,
      valueFormatter: (params) => params.value || '-'
    }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">{data.event_name}</Typography>
          <Typography variant="body2" color="textSecondary">
            Total: {data.total_approved} | Present: {data.present_count} | Absent: {data.absent_count}
          </Typography>
        </Box>
        <IconButton onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
        </IconButton>
      </Box>

      {/* Search and Filter */}
      <Box display="flex" gap={2} mb={2}>
        <TextField
          label="Search by name"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: 300 }}
        />
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Present">Present</MenuItem>
            <MenuItem value="Absent">Absent</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" alignSelf="center" color="textSecondary">
          Showing {filteredData.length} of {data.total_approved} volunteers
        </Typography>
      </Box>

      {/* DataGrid */}
      <DataGrid
        rows={filteredData}
        columns={columns}
        getRowId={(row) => row.application_id}
        pageSize={50}
        rowsPerPageOptions={[25, 50, 100]}
        pagination
        disableSelectionOnClick
        autoHeight
      />
    </Box>
  );
}
```

---

## 4. Performance Targets

### Backend Performance
- **Query Time**: <50ms for 200 volunteers (tested with LEFT JOIN)
- **Response Time**: <200ms p95 (including network overhead)
- **Throughput**: >100 req/s (single endpoint, read-only)

### Frontend Performance
- **Initial Load**: <1s for 100 volunteers (SC-001)
- **Search Debounce**: 300ms (FR-004)
- **Refresh**: <500ms (excluding network latency)

### Scalability Limits
- ✅ **Optimal**: Events with <300 volunteers
- ⚠️ **Acceptable**: Events with 300-500 volunteers
- ❌ **Not Recommended**: Events with >500 volunteers (consider server-side pagination)

---

## 5. Testing Checklist

### Backend Tests (Target: 80% coverage)
- [ ] Unit tests for Repository layer (2 tests)
- [ ] Unit tests for Service layer (8 tests)
- [ ] Integration tests for API endpoint (9 tests)
- [ ] Authorization tests (5 scenarios)
- [ ] Edge case tests (empty list, non-existent event, org mismatch)

### Frontend Tests
- [ ] Component test for AttendanceListPage
- [ ] Test search debounce (300ms delay)
- [ ] Test status filter (All/Present/Absent)
- [ ] Test refresh button (prevents duplicate requests)
- [ ] E2E test for full workflow

### Performance Tests
- [ ] Load test with 100 volunteers → <1s response
- [ ] Load test with 200 volunteers → <1.5s response
- [ ] Concurrent requests test (20 users) → No degradation

---

## 6. Common Pitfalls & Solutions

### Pitfall 1: Showing only checked-in volunteers
**Problem**: Querying `attendances` table directly misses volunteers not yet checked-in  
**Solution**: Use LEFT JOIN from `applications` table (RQ4 decision)

### Pitfall 2: Exposing sensitive PII
**Problem**: Accidentally including email/phone in response  
**Solution**: Use Prisma `select` with explicit whitelist (FR-016)

### Pitfall 3: Duplicate refresh requests
**Problem**: User spams refresh button, multiple API calls  
**Solution**: Implement request deduplication with `isRefreshing` state (SC-007)

### Pitfall 4: Performance degradation with large events
**Problem**: Client-side pagination struggles with >500 volunteers  
**Solution**: Add warning in docs, consider server-side pagination for v2

---

## 7. Deployment Checklist

### Pre-Deployment
- [ ] All unit tests passing (80% coverage)
- [ ] All integration tests passing
- [ ] Swagger documentation updated
- [ ] Performance targets met (<1s for 100 volunteers)
- [ ] No PII leakage verified (FR-016)

### Deployment
- [ ] Merge to `develop` branch
- [ ] Deploy backend to staging
- [ ] Deploy frontend to staging
- [ ] Run E2E tests on staging
- [ ] Deploy to production

### Post-Deployment
- [ ] Monitor API response times (<200ms p95)
- [ ] Monitor error rates (<1%)
- [ ] Verify organization-based authorization works
- [ ] Collect Staff feedback on UI/UX

---

## 8. Dependencies & Integration Points

### Upstream Dependencies (Required)
- ✅ UC22 (List Applications) - `volunteer_applications` table
- ✅ UC24 (Approve Application) - `APPROVED` status
- ✅ UC45 (Attendance Check) - `attendances` table

### Downstream Dependencies (Optional)
- UC55 (Event Statistics) - May aggregate attendance data
- UC60 (Generate Reports) - May export attendance lists

---

## 9. Estimated Timeline

| Phase | Task | Time | Dependencies |
|-------|------|------|--------------|
| 0 | Database verification | 5 min | UC22, UC24, UC45 complete |
| 1 | Repository layer | 30 min | - |
| 2 | Service layer | 1 hour | Phase 1 |
| 3 | Controller layer | 30 min | Phase 2 |
| 4 | Routes & Validation | 30 min | Phase 3 |
| 5 | Backend testing | 1 hour | Phase 4 |
| 6 | Frontend API client | 30 min | Phase 5 |
| 7 | Frontend UI | 2 hours | Phase 6 |
| 8 | Frontend testing | 1 hour | Phase 7 |
| 9 | E2E testing | 30 min | Phase 8 |
| 10 | Documentation | 30 min | All phases |

**Total**: ~8 hours (Backend: 4h, Frontend: 4h)

---

## 10. Resources

### Documentation References
- **SPEC.md**: Feature requirements and acceptance criteria
- **research.md**: Research questions and decisions
- **data-model.md**: Database schema and query patterns
- **contracts/GET-attendances-events-eventId.md**: API contract

### Code References
- UC25 (Reject Application) - Similar service layer patterns
- UC45 (Attendance Check) - Attendance table usage
- UC22 (List Applications) - Repository patterns

### External Resources
- [Material UI DataGrid Documentation](https://mui.com/x/react-data-grid/)
- [Prisma LEFT JOIN Documentation](https://www.prisma.io/docs/concepts/components/prisma-client/relation-queries)
- [React Hook Form Documentation](https://react-hook-form.com/)

---

**Status**: ✅ READY FOR IMPLEMENTATION - All design artifacts complete, ready for `/speckit-tasks`


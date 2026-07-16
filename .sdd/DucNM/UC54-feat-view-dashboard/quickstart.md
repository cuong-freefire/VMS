# Quickstart: View Dashboard (UC54)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-06

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- Redis server running
- Prisma models: Event, User, Application, Donation, Attendance
- authorize middleware working (from UC26)
- Backend server running on port 5000

## Backend Implementation Order

### 1. Redis Config (`backend/src/config/redis.config.js`)

```javascript
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  logger.warn({ err }, 'Redis connection error — caching disabled');
});

await redisClient.connect();

export default redisClient;
```

### 2. Repository (`backend/src/repositories/dashboard.repository.js`)

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getTotalEvents() {
  const [total, byStatus] = await Promise.all([
    prisma.event.count(),
    prisma.event.groupBy({ by: ['status'], _count: true })
  ]);
  const statusMap = {};
  byStatus.forEach(item => { statusMap[item.status] = item._count; });
  return { total, by_status: statusMap };
}

export async function getTotalUsers() {
  const [total, byRole] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ['role_id'], _count: true })
  ]);
  const roleMap = {};
  byRole.forEach(item => { roleMap[`ROLE_${item.role_id}`] = item._count; });
  return { total, by_role: roleMap };
}

export async function getTotalApplications() {
  const [total, byStatus] = await Promise.all([
    prisma.volunteerApplication.count(),
    prisma.volunteerApplication.groupBy({ by: ['status'], _count: true })
  ]);
  const statusMap = {};
  byStatus.forEach(item => { statusMap[item.status] = item._count; });
  return { total, by_status: statusMap };
}

export async function getDonationsCurrentMonth() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const result = await prisma.donation.aggregate({
    _sum: { amount: true },
    where: { created_at: { gte: startOfMonth } }
  });
  return {
    total_amount: result._sum.amount || 0,
    currency: 'VND',
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  };
}

export async function getAttendanceRate() {
  const [attended, approved] = await Promise.all([
    prisma.attendance.count(),
    prisma.volunteerApplication.count({ where: { status: 'APPROVED' } })
  ]);
  return approved > 0 ? Math.round((attended / approved) * 100 * 10) / 10 : 0;
}

export async function getEventsByMonth() {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const events = await prisma.event.findMany({
    where: { created_at: { gte: twelveMonthsAgo } },
    select: { created_at: true }
  });
  return aggregateByMonth(events);
}

export async function getNewUsersByMonth() {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const users = await prisma.user.findMany({
    where: { created_at: { gte: twelveMonthsAgo } },
    select: { created_at: true }
  });
  return aggregateByMonth(users);
}

export async function getApplicationDistribution() {
  const result = await prisma.volunteerApplication.groupBy({
    by: ['status'],
    _count: true
  });
  return result.map(item => ({ status: item.status, count: item._count }));
}

// Helper: aggregate records by month
function aggregateByMonth(records) {
  const monthMap = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = 0;
  }
  records.forEach(r => {
    const d = r.created_at;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthMap[key] !== undefined) monthMap[key]++;
  });
  return Object.entries(monthMap).map(([month, count]) => ({ month, count }));
}
```

### 3. Service (`backend/src/services/dashboard.service.js`)

```javascript
import redisClient from '../config/redis.config.js';
import logger from '../config/logger.config.js';
import * as dashboardRepo from '../repositories/dashboard.repository.js';

const CACHE_TTL = 300; // 5 minutes
const CACHE_KEY = 'dashboard:summary';

export async function getDashboardSummary(query) {
  // Check cache (unless force refresh)
  if (query.force !== 'true') {
    try {
      const cached = await redisClient.get(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      logger.warn({ err }, 'Redis cache read failed — querying database');
    }
  }

  // Query all dashboard data in parallel
  const [
    totalEvents,
    totalUsers,
    totalApplications,
    donationsCurrentMonth,
    attendanceRate,
    eventsByMonth,
    newUsersByMonth,
    applicationDistribution
  ] = await Promise.all([
    dashboardRepo.getTotalEvents(),
    dashboardRepo.getTotalUsers(),
    dashboardRepo.getTotalApplications(),
    dashboardRepo.getDonationsCurrentMonth(),
    dashboardRepo.getAttendanceRate(),
    dashboardRepo.getEventsByMonth(),
    dashboardRepo.getNewUsersByMonth(),
    dashboardRepo.getApplicationDistribution()
  ]);

  const data = {
    kpi: {
      total_events: totalEvents,
      total_users: totalUsers,
      total_applications: totalApplications,
      total_donations_current_month: donationsCurrentMonth,
      avg_attendance_rate: attendanceRate
    },
    charts: {
      events_by_month: eventsByMonth,
      new_users_by_month: newUsersByMonth,
      application_distribution: applicationDistribution
    }
  };

  // Set cache (fire-and-forget — don't block response)
  redisClient.setEx(CACHE_KEY, CACHE_TTL, JSON.stringify(data)).catch(err => {
    logger.warn({ err }, 'Redis cache write failed');
  });

  return data;
}
```

### 4. Controller (`backend/src/controllers/dashboard.controller.js`)

```javascript
import { getDashboardSummary } from '../services/dashboard.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export async function getDashboardSummaryHandler(req, res) {
  try {
    const data = await getDashboardSummary(req.query);
    const hasData = data.kpi.total_events.total > 0 || data.kpi.total_users.total > 0;
    return res.status(200).json(
      successResponse(data, hasData ? 'Lấy dữ liệu dashboard thành công' : 'Chưa có dữ liệu')
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

### 5. Routes (`backend/src/routes/dashboard.routes.js`)

```javascript
import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import authorize from '../middleware/authorize.middleware.js';
import { getDashboardSummaryHandler } from '../controllers/dashboard.controller.js';

const router = Router();

/**
 * @swagger
 * /api/v1/dashboard/summary:
 *   get:
 *     summary: Lấy dữ liệu dashboard tổng quan
 *     description: |
 *       Trả về KPI metrics và dữ liệu biểu đồ. Chỉ Admin và Manager.
 *       Cả Admin và Manager đều thấy dữ liệu toàn hệ thống.
 *       Cache Redis TTL 5 phút. Dùng ?force=true để force refresh.
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: force
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       500:
 *         description: Lỗi server
 */
router.get('/summary', authMiddleware, authorize('ADMIN', 'MANAGER'), getDashboardSummaryHandler);

export default router;
```

### 6. Update `backend/src/app.js`

```javascript
import dashboardRoutes from './routes/dashboard.routes.js';
app.use('/api/v1/dashboard', dashboardRoutes);
```

### 7. Tests (`backend/tests/dashboard/dashboard.service.test.js`)

```javascript
// Test cases:
// 1. getDashboardSummary với Admin → trả về KPI + charts
// 2. getDashboardSummary với Manager → trả về KPI + charts (giống Admin)
// 3. getDashboardSummary khi không có dữ liệu → KPI = 0, charts rỗng
// 4. getDashboardSummary với force=true → bỏ qua cache
// 5. getDashboardSummary khi Redis unavailable → query DB, không throw
```

### 8. Integration Tests

```javascript
// 1. GET /api/v1/dashboard/summary + Admin token → 200 + full data
// 2. GET /api/v1/dashboard/summary + Manager token → 200 + full data
// 3. GET /api/v1/dashboard/summary + Staff token → 403
// 4. GET /api/v1/dashboard/summary + Guest (no token) → 401
// 5. GET /api/v1/dashboard/summary?force=true → bỏ qua cache
```

## Frontend Implementation Order

### 1. API Client (`frontend/src/api/dashboardApi.js`)

```javascript
import axiosApi from './axiosApi';

export async function getDashboardSummary(force = false) {
  const params = force ? { force: 'true' } : {};
  const response = await axiosApi.get('/dashboard/summary', { params });
  return response.data.data;
}
```

### 2. Hook (`frontend/src/hooks/useDashboard.js`)

```javascript
import { useState, useEffect, useCallback } from 'react';
import { getDashboardSummary } from '../api/dashboardApi';

export function useDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDashboardSummary(force);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard, forceRefresh: () => fetchDashboard(true) };
}
```

### 3. DashboardPage Component (`frontend/src/components/pages/DashboardPage.jsx`)

```jsx
import React from 'react';
import { Container, Grid, Typography, Button, CircularProgress, Box } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useDashboard } from '../../hooks/useDashboard';
import KPICard from '../ui/KPICard';
import EventsByMonthChart from '../ui/EventsByMonthChart';
import NewUsersChart from '../ui/NewUsersChart';
import ApplicationPieChart from '../ui/ApplicationPieChart';

export default function DashboardPage() {
  const { data, loading, error, forceRefresh } = useDashboard();

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Container><Typography color="error">{error}</Typography></Container>;

  const { kpi, charts } = data || { kpi: {}, charts: {} };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Dashboard</Typography>
        <Button startIcon={<RefreshIcon />} onClick={forceRefresh}>Refresh</Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <KPICard title="Total Events" value={kpi.total_events?.total || 0}
            detail={kpi.total_events?.by_status} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <KPICard title="Total Users" value={kpi.total_users?.total || 0}
            detail={kpi.total_users?.by_role} color="#388e3c" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <KPICard title="Applications" value={kpi.total_applications?.total || 0}
            detail={kpi.total_applications?.by_status} color="#f57c00" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <KPICard title="Donations (Month)" value={kpi.total_donations_current_month?.total_amount || 0}
            format="currency" color="#7b1fa2" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <KPICard title="Attendance Rate" value={kpi.avg_attendance_rate || 0}
            format="percent" color="#d32f2f" />
        </Grid>

        <Grid item xs={12} md={6}>
          <EventsByMonthChart data={charts.events_by_month || []} />
        </Grid>
        <Grid item xs={12} md={6}>
          <NewUsersChart data={charts.new_users_by_month || []} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ApplicationPieChart data={charts.application_distribution || []} />
        </Grid>
      </Grid>
    </Container>
  );
}

DashboardPage.propTypes = {};
```

### 4. Add Route in `frontend/src/App.js`

```jsx
import DashboardPage from './components/pages/DashboardPage';
<Route path="/dashboard" element={<DashboardPage />} />
```

## Verification Steps

1. **API**: `GET /api/v1/dashboard/summary` + Admin token → 200 + KPI + charts
2. **API**: `GET /api/v1/dashboard/summary` + Manager token → 200 + same data (giống Admin)
3. **API**: `GET /api/v1/dashboard/summary` + Staff token → 403
4. **API**: `GET /api/v1/dashboard/summary` + Guest (no token) → 401
5. **API**: `GET /api/v1/dashboard/summary?force=true` → bỏ qua Redis cache
6. **Cache**: Request lần 1 → miss → query DB → cache. Request lần 2 (trong 5 phút) → hit → trả về cached
7. **Frontend**: Navigate to `/dashboard` → verify KPICards + 3 charts render correctly
8. **Frontend**: Click "Refresh" → force refresh data
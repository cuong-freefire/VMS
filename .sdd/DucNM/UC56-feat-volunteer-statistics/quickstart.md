# Quickstart: Volunteer Statistics (UC56)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-08

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- Redis server running (kế thừa từ UC54)
- **UC54/UC55 infrastructure available**: Redis config, dashboard.routes.js prefix `/api/v1/dashboard`, dashboard controller/service base
- User model with `role`, `is_active`, `created_at` fields
- Attendance model with `user_id`, `event_id` fields
- Event model with `organization_id` field
- authorize middleware working (from UC26)

## Backend Implementation Order

### 1. Add Repository Methods (`backend/src/repositories/dashboard.repository.js`)

Thêm vào file đã có từ UC54/UC55:

```javascript
export async function countNewVolunteersByMonth(year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

  const users = await prisma.user.findMany({
    where: {
      role: { name: 'VOLUNTEER' },
      created_at: { gte: startDate, lte: endDate }
    },
    select: { created_at: true }
  });
  return aggregateByMonth(users);
}

export async function getTotalActiveVolunteers() {
  return prisma.user.count({
    where: {
      role: { name: 'VOLUNTEER' },
      is_active: true
    }
  });
}

export async function getParticipationRate(orgId = null) {
  const totalActive = await getTotalActiveVolunteers();
  if (totalActive === 0) return 0;

  const where = {};
  if (orgId) {
    where.event = { organization_id: orgId };
  }

  const volunteersWithAttendance = await prisma.attendance.groupBy({
    by: ['user_id'],
    where,
    _count: { user_id: true }
  });

  return Math.round((volunteersWithAttendance.length / totalActive) * 100 * 10) / 10;
}

export async function getTop5Volunteers(orgId = null) {
  const where = {};
  if (orgId) {
    where.event = { organization_id: orgId };
  }

  const top = await prisma.attendance.groupBy({
    by: ['user_id'],
    where,
    _count: { user_id: true },
    orderBy: { _count: { user_id: 'desc' } },
    take: 5
  });

  if (top.length === 0) return [];

  // Get user names
  const users = await prisma.user.findMany({
    where: { user_id: { in: top.map(t => t.user_id) } },
    select: { user_id: true, full_name: true }
  });

  return top.map(item => ({
    user_id: item.user_id,
    full_name: users.find(u => u.user_id === item.user_id)?.full_name || 'Unknown',
    events_attended: item._count.user_id
  }));
}
```

### 2. Add `getVolunteerStatistics` to Service (`backend/src/services/dashboard.service.js`)

Thêm vào file đã có từ UC54/UC55:

```javascript
import * as dashboardRepo from '../repositories/dashboard.repository.js';
import redisClient from '../config/redis.config.js';
import logger from '../config/logger.config.js';

const CACHE_TTL = 300;

export async function getVolunteerStatistics(query, currentUser) {
  const year = query.year || new Date().getFullYear();
  const role = currentUser?.role || currentUser?.role_name;
  const orgId = role === 'MANAGER' ? currentUser.organization_id : null;

  // Build cache key
  const cacheKey = `volunteer-stats:${year}:${orgId || 'all'}`;

  // Check cache
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    logger.warn({ err }, 'Redis cache read failed');
  }

  // Query data in parallel
  const [
    newVolunteersByMonth,
    totalActiveVolunteers,
    participationRate,
    topVolunteers
  ] = await Promise.all([
    dashboardRepo.countNewVolunteersByMonth(year),
    dashboardRepo.getTotalActiveVolunteers(),
    dashboardRepo.getParticipationRate(orgId),
    dashboardRepo.getTop5Volunteers(orgId)
  ]);

  const data = {
    new_volunteers_by_month: newVolunteersByMonth,
    total_active_volunteers: totalActiveVolunteers,
    participation_rate: participationRate,
    top_5_volunteers_by_events: topVolunteers
  };

  // Set cache
  redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(data)).catch(err => {
    logger.warn({ err }, 'Redis cache write failed');
  });

  return data;
}
```

### 3. Add `getVolunteerStatsHandler` to Controller (`backend/src/controllers/dashboard.controller.js`)

Thêm vào file đã có từ UC54/UC55:

```javascript
import { getVolunteerStatistics } from '../services/dashboard.service.js';

export async function getVolunteerStatsHandler(req, res) {
  try {
    const data = await getVolunteerStatistics(req.query, req.user);
    const hasData = data.new_volunteers_by_month.length > 0 || data.total_active_volunteers > 0;
    return res.status(200).json(
      successResponse(data, hasData ? 'Lấy thống kê tình nguyện viên thành công' : 'Chưa có dữ liệu thống kê')
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

### 4. Add Route (`backend/src/routes/dashboard.routes.js`)

Thêm route GET vào file đã có từ UC54/UC55:

```javascript
import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import authorize from '../middleware/authorize.middleware.js';
import {
  getDashboardSummaryHandler,
  getEventStatsHandler,
  getVolunteerStatsHandler
} from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/summary', authMiddleware, authorize('ADMIN', 'MANAGER'), getDashboardSummaryHandler);
router.get('/event-stats', authMiddleware, authorize('ADMIN', 'MANAGER'), getEventStatsHandler);
router.get('/volunteer-stats', authMiddleware, authorize('ADMIN', 'MANAGER'), getVolunteerStatsHandler);

export default router;
```

### 5. Tests (`backend/tests/dashboard/dashboard.service.test.js`)

```javascript
// Test cases bổ sung cho UC56:
// 1. getVolunteerStatistics với Admin (year=2026) → 4 metrics
// 2. getVolunteerStatistics với Manager → chỉ volunteer trong org Manager
// 3. getVolunteerStatistics khi không có dữ liệu → giá trị mặc định
// 4. getVolunteerStatistics với Staff → throw 403
```

### 6. Integration Tests

```javascript
// 1. GET /api/v1/dashboard/volunteer-stats?year=2026 + Admin → 200
// 2. GET /api/v1/dashboard/volunteer-stats + Manager → 200 + org-filtered
// 3. GET /api/v1/dashboard/volunteer-stats + Staff → 403
// 4. GET /api/v1/dashboard/volunteer-stats + Guest → 401
```

## Frontend Implementation Order

### 1. API Client (`frontend/src/api/dashboardApi.js`)

```javascript
export async function getVolunteerStats(params = {}) {
  const response = await axiosApi.get('/dashboard/volunteer-stats', { params });
  return response.data.data;
}
```

### 2. Component: VolunteerStatisticsPage

```jsx
import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Grid, Paper, CircularProgress, Box, List, ListItem, ListItemText } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getVolunteerStats } from '../../api/dashboardApi';

export default function VolunteerStatisticsPage() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getVolunteerStats({ year });
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Volunteer Statistics</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} size="small" />
        <Button variant="contained" onClick={fetchStats} disabled={loading}>Load</Button>
      </Box>

      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}
      {data && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">New Volunteers by Month</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.new_volunteers_by_month}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#388e3c" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">Active Volunteers</Typography>
              <Typography variant="h3">{data.total_active_volunteers}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">Participation Rate</Typography>
              <Typography variant="h3" color={data.participation_rate > 50 ? 'green' : 'orange'}>
                {data.participation_rate}%
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Top 5 Volunteers</Typography>
              <List dense>
                {data.top_5_volunteers_by_events.map((v, i) => (
                  <ListItem key={v.user_id}>
                    <ListItemText primary={`${i+1}. ${v.full_name}`} secondary={`${v.events_attended} events`} />
                  </ListItem>
                ))}
                {data.top_5_volunteers_by_events.length === 0 && (
                  <ListItem><ListItemText primary="No data" /></ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}

VolunteerStatisticsPage.propTypes = {};
```

### 3. Add Route in `frontend/src/App.js`

```jsx
import VolunteerStatisticsPage from './components/pages/VolunteerStatisticsPage';
<Route path="/dashboard/volunteers" element={<VolunteerStatisticsPage />} />
```

## Verification Steps

1. **API**: `GET /api/v1/dashboard/volunteer-stats?year=2026` + Admin → 200 + 4 metrics
2. **API**: `GET /api/v1/dashboard/volunteer-stats` + Manager → 200 + org-filtered
3. **API**: `GET /api/v1/dashboard/volunteer-stats` + Staff → 403
4. **API**: `GET /api/v1/dashboard/volunteer-stats` + Guest → 401
5. **API**: `GET /api/v1/dashboard/volunteer-stats?year=2030` → 200 + giá trị mặc định
6. **Frontend**: Navigate to `/dashboard/volunteers` → select year → Load → verify bar chart + KPI cards + top 5 list
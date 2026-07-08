# Quickstart: Event Statistics (UC55)

**Phase**: 1 — Design & Contracts

**Date**: 2026-07-08

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- Redis server running (kế thừa từ UC54)
- **UC54 infrastructure available**: Redis config, dashboard.routes.js prefix `/api/v1/dashboard`, dashboard controller/service base
- Event model with `organization_id` FK, `status`, `created_at` fields
- Application (volunteer_applications) model with `event_id`, `status` fields
- authorize middleware working (from UC26)

## Backend Implementation Order

### 1. Add Zod Schema (`backend/src/validators/event-stats.validator.js`)

```javascript
import { z } from 'zod';

export const eventStatsQuerySchema = z.object({
  year: z.coerce.number().int().positive().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional()
}).refine(data => {
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) <= new Date(data.end_date);
  }
  return true;
}, { message: 'start_date must be before or equal to end_date' });
```

### 2. Add Repository Methods (`backend/src/repositories/dashboard.repository.js`)

Thêm vào file đã có từ UC54:

```javascript
export async function countEventsByMonth(where = {}) {
  const events = await prisma.event.findMany({
    where,
    select: { created_at: true }
  });
  return aggregateByMonth(events);
}

export async function getCompletionRate(where = {}) {
  const [total, completed] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.count({ where: { ...where, status: 'COMPLETED' } })
  ]);
  return total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0;
}

export async function getTop5Events(where = {}) {
  // Get top 5 event IDs by approved application count
  const topEventIds = await prisma.volunteerApplication.groupBy({
    by: ['event_id'],
    where: { status: 'APPROVED', ...where },
    _count: { event_id: true },
    orderBy: { _count: { event_id: 'desc' } },
    take: 5
  });

  if (topEventIds.length === 0) return [];

  // Get event titles
  const events = await prisma.event.findMany({
    where: { event_id: { in: topEventIds.map(e => e.event_id) } },
    select: { event_id: true, title: true }
  });

  // Merge data
  return topEventIds.map(item => ({
    event_id: item.event_id,
    title: events.find(e => e.event_id === item.event_id)?.title || 'Unknown',
    approved_applications: item._count.event_id
  }));
}

// Helper: determine time range
export function getTimeRange(query) {
  let startDate, endDate;

  if (query.start_date && query.end_date) {
    startDate = new Date(query.start_date);
    endDate = new Date(query.end_date);
    endDate.setHours(23, 59, 59, 999);
  } else {
    const year = query.year || new Date().getFullYear();
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31, 23, 59, 59, 999);
  }

  return { startDate, endDate };
}
```

### 3. Add `getEventStatistics` to Service (`backend/src/services/dashboard.service.js`)

Thêm vào file đã có từ UC54:

```javascript
import { eventStatsQuerySchema } from '../validators/event-stats.validator.js';
import * as dashboardRepo from '../repositories/dashboard.repository.js';
import { ServiceError } from '../utils/response.util.js';
import redisClient from '../config/redis.config.js';
import logger from '../config/logger.config.js';

const CACHE_TTL = 300;

export async function getEventStatistics(query, currentUser) {
  // 1. Validate input
  const parsed = eventStatsQuerySchema.safeParse(query);
  if (!parsed.success) {
    const err = parsed.error.errors[0];
    if (err.message.includes('start_date must be before')) {
      throw new ServiceError(err.message, 400, 'INVALID_DATE_RANGE');
    }
    throw new ServiceError(err.message, 400, 'INVALID_DATE_FORMAT');
  }

  const validQuery = parsed.data;

  // 2. Determine time range
  const { startDate, endDate } = dashboardRepo.getTimeRange(validQuery);

  // 3. Build where clause (time filter)
  const where = {
    created_at: { gte: startDate, lte: endDate }
  };

  // 4. Role-based filter: Manager only sees own organization's events
  const role = currentUser?.role || currentUser?.role_name;
  if (role === 'MANAGER') {
    where.organization_id = currentUser.organization_id;
  }

  // 5. Build cache key
  const orgSuffix = role === 'MANAGER' ? `:org${currentUser.organization_id}` : '';
  const cacheKey = `event-stats:${startDate.toISOString()}:${endDate.toISOString()}${orgSuffix}`;

  // 6. Check cache
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    logger.warn({ err }, 'Redis cache read failed');
  }

  // 7. Query data in parallel
  const [eventsByMonth, completionRate, topEvents] = await Promise.all([
    dashboardRepo.countEventsByMonth(where),
    dashboardRepo.getCompletionRate(where),
    dashboardRepo.getTop5Events(where)
  ]);

  const data = { events_by_month: eventsByMonth, completion_rate: completionRate, top_5_events: topEvents };

  // 8. Set cache
  redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(data)).catch(err => {
    logger.warn({ err }, 'Redis cache write failed');
  });

  return data;
}
```

### 4. Add `getEventStatsHandler` to Controller (`backend/src/controllers/dashboard.controller.js`)

Thêm vào file đã có từ UC54:

```javascript
import { getEventStatistics } from '../services/dashboard.service.js';

export async function getEventStatsHandler(req, res) {
  try {
    const data = await getEventStatistics(req.query, req.user);
    const hasData = data.events_by_month.length > 0 || data.top_5_events.length > 0;
    return res.status(200).json(
      successResponse(data, hasData ? 'Lấy thống kê sự kiện thành công' : 'Chưa có dữ liệu thống kê')
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

### 5. Add Route (`backend/src/routes/dashboard.routes.js`)

Thêm route GET vào file đã có từ UC54:

```javascript
import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import authorize from '../middleware/authorize.middleware.js';
import { getDashboardSummaryHandler, getEventStatsHandler } from '../controllers/dashboard.controller.js';

const router = Router();

// Route hiện tại từ UC54
router.get('/summary', authMiddleware, authorize('ADMIN', 'MANAGER'), getDashboardSummaryHandler);

// Route mới cho UC55
router.get('/event-stats', authMiddleware, authorize('ADMIN', 'MANAGER'), getEventStatsHandler);

export default router;
```

### 6. Tests (`backend/tests/dashboard/dashboard.service.test.js`)

```javascript
// Test cases bổ sung cho UC55:
// 1. getEventStatistics với Admin (year=2026) → events_by_month + completion_rate + top_5
// 2. getEventStatistics với Manager → chỉ events thuộc org của Manager
// 3. getEventStatistics với start_date > end_date → throw 400
// 4. getEventStatistics khi không có dữ liệu → giá trị mặc định
// 5. getEventStatistics với Staff → throw 403
```

### 7. Integration Tests

```javascript
// 1. GET /api/v1/dashboard/event-stats?year=2026 + Admin → 200
// 2. GET /api/v1/dashboard/event-stats?start_date=2026-06-30&end_date=2026-01-01 → 400
// 3. GET /api/v1/dashboard/event-stats + Staff → 403
// 4. GET /api/v1/dashboard/event-stats + Guest → 401
```

## Frontend Implementation Order

### 1. API Client (`frontend/src/api/dashboardApi.js`)

```javascript
export async function getEventStats(params = {}) {
  const response = await axiosApi.get('/dashboard/event-stats', { params });
  return response.data.data;
}
```

### 2. Component: EventStatisticsPage

```jsx
import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Grid, Paper, CircularProgress, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getEventStats } from '../../api/dashboardApi';

export default function EventStatisticsPage() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getEventStats({ year });
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Event Statistics</Typography>
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
              <Typography variant="h6">Events by Month</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.events_by_month}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Completion Rate</Typography>
              <Typography variant="h3" color={data.completion_rate > 50 ? 'green' : 'orange'}>
                {data.completion_rate}%
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Top 5 Events</Typography>
              {data.top_5_events.map((e, i) => (
                <Box key={e.event_id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography>{i+1}. {e.title}</Typography>
                  <Typography fontWeight="bold">{e.approved_applications} apps</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}

EventStatisticsPage.propTypes = {};
```

### 3. Add Route in `frontend/src/App.js`

```jsx
import EventStatisticsPage from './components/pages/EventStatisticsPage';
<Route path="/dashboard/events" element={<EventStatisticsPage />} />
```

## Verification Steps

1. **API**: `GET /api/v1/dashboard/event-stats?year=2026` + Admin token → 200 + events_by_month + completion_rate + top_5
2. **API**: `GET /api/v1/dashboard/event-stats?year=2026` + Manager token → 200 + chỉ events thuộc org Manager
3. **API**: `GET /api/v1/dashboard/event-stats?start_date=2026-06-30&end_date=2026-01-01` → 400
4. **API**: `GET /api/v1/dashboard/event-stats` + Staff token → 403
5. **API**: `GET /api/v1/dashboard/event-stats` + Guest → 401
6. **API**: `GET /api/v1/dashboard/event-stats?year=2030` (tương lai) → 200 + giá trị mặc định
7. **Frontend**: Navigate to `/dashboard/events` → select year → Load → verify bar chart + KPIs
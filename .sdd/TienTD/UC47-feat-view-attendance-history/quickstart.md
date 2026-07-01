# UC47 - View Attendance History: Quickstart Guide

**Feature Owner**: TienTD  
**Status**: Phase 1 - Planning Completed  
**Last Updated**: 2026-06-30

---

## Overview

UC47 cho phép Staff xem lịch sử điểm danh của các sự kiện đã hoàn thành (COMPLETED). Hệ thống hỗ trợ 2 chế độ tra cứu: theo sự kiện (xem danh sách volunteers) hoặc theo volunteer (xem danh sách events đã tham gia).

**Key Capabilities**:
- ✅ Event-First Query: GET `/api/v1/attendances/events/:eventId/history`
- ✅ Volunteer-First Query: GET `/api/v1/attendances/volunteers/:volunteerId/history`
- ✅ Server-side pagination (limit/offset)
- ✅ Smart date defaults (last 6 months)
- ✅ Organization-based access control
- ✅ Read-only operations (no write to database)

---

## Quick Navigation

### Planning Artifacts (Phase 1) - COMPLETED ✅
1. **[SPEC.md](./SPEC.md)** - Feature requirements (User Story 1 + 2)
2. **[research.md](./research.md)** - 4 research questions với detailed analysis
3. **[data-model.md](./data-model.md)** - Database schema review (NO migration needed)
4. **[contracts/](./contracts/)** - API contract documents:
   - `GET-attendances-events-eventId-history.md` - Event-First endpoint
   - `GET-attendances-volunteers-volunteerId-history.md` - Volunteer-First endpoint

### Implementation Artifacts (Phase 2) - PENDING
5. **[tasks.md](./tasks.md)** - To be generated after Phase 1 complete
6. Implementation code - Generated during /speckit-implement workflow

---

## Key Decisions (from research.md)

| Question | Decision | Rationale |
|----------|----------|-----------|
| **RQ1: Query Scope** | COMPLETED events only | Clear separation from UC46 (real-time view) |
| **RQ2: Query Pattern** | Two separate endpoints | Different use cases, different data structures |
| **RQ3: Pagination** | Server-side (limit/offset) | Scalable for growing historical data |
| **RQ4: Date Filter** | Optional with smart defaults | Last 6 months if not specified, max 2 years |

---

## Database Changes

### No Migration Required ✅

All required tables exist from previous UCs:
- `events` table (UC15-UC17) - Filter by COMPLETED status
- `applications` table (UC22-UC25) - Link volunteers to events
- `attendances` table (UC45) - Store check-in records
- `users` table (Auth module) - Volunteer information

**Existing Indexes**:
- `idx_events_org_status_end` on `(organization_id, status, end_date)`
- `idx_applications_event_status` on `(event_id, status)`
- `idx_applications_user_status` on `(user_id, status)`
- `idx_attendances_checked_in_at` on `(checked_in_at)`

---

## API Endpoints

### 1. Event-First Query

**Purpose**: View attendance history for a specific completed event

```http
GET /api/v1/attendances/events/:eventId/history?limit=50&offset=0
Authorization: Bearer <JWT_TOKEN>
```

**Response 200 OK**:
```json
{
  "success": true,
  "message": "Event attendance history retrieved successfully",
  "data": {
    "event": {
      "id": "uuid",
      "title": "Community Beach Cleanup 2026",
      "start_date": "2026-06-15T08:00:00Z",
      "end_date": "2026-06-15T12:00:00Z",
      "status": "COMPLETED"
    },
    "attendances": [
      {
        "volunteer_id": "uuid",
        "volunteer_name": "Nguyen Van A",
        "volunteer_avatar": "url",
        "status": "PRESENT",
        "checked_in_at": "2026-06-15T08:15:00Z",
        "checked_in_by": "staff-uuid",
        "volunteer_hours": 4.0
      }
    ],
    "summary": {
      "total_approved": 100,
      "present_count": 85,
      "absent_count": 15
    }
  },
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

**Common Errors**:
- `400 Bad Request`: Event not COMPLETED
- `403 Forbidden`: Staff not authorized for this organization
- `404 Not Found`: Event not found

---

### 2. Volunteer-First Query

**Purpose**: View all events a volunteer attended within Staff's organization

```http
GET /api/v1/attendances/volunteers/:volunteerId/history?startDate=2025-12-01&endDate=2026-06-30&limit=50&offset=0
Authorization: Bearer <JWT_TOKEN>
```

**Response 200 OK**:
```json
{
  "success": true,
  "message": "Volunteer attendance history retrieved successfully",
  "data": {
    "volunteer": {
      "id": "uuid",
      "full_name": "Nguyen Van A",
      "avatar_url": "url"
    },
    "attendances": [
      {
        "event_id": "uuid",
        "event_title": "Community Beach Cleanup 2026",
        "event_date": "2026-06-15",
        "status": "PRESENT",
        "checked_in_at": "2026-06-15T08:15:00Z",
        "volunteer_hours": 4.0
      }
    ],
    "summary": {
      "total_events_attended": 12,
      "total_hours_contributed": 48.5,
      "date_range": {
        "earliest": "2025-12-15",
        "latest": "2026-06-15"
      }
    }
  },
  "pagination": {
    "total": 12,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  },
  "filters_applied": {
    "start_date": "2025-12-01",
    "end_date": "2026-06-30"
  }
}
```

**Common Errors**:
- `400 Bad Request`: Invalid date range (startDate > endDate or > 2 years)
- `403 Forbidden`: Insufficient permissions (Volunteer role)
- `404 Not Found`: Volunteer not found

---

## Business Rules

### Query Scope Rules

| Event Status | Visible in UC47? | Notes |
|-------------|-----------------|-------|
| `COMPLETED` | ✅ YES | Primary use case for historical reporting |
| `IN_PROGRESS` | ❌ NO | Use UC46 for real-time attendance view |
| `PUBLISHED` | ❌ NO | Event hasn't started yet |
| `DRAFT` | ❌ NO | Event not ready |
| `CANCELLED` | ❌ NO | Event cancelled |

### JOIN Pattern Differences

**Event-First (User Story 1)**:
- Query: `applications LEFT JOIN attendances`
- Shows ALL approved volunteers (both checked-in and not-checked-in)
- Status: `PRESENT` if attendance exists, `ABSENT` if null

**Volunteer-First (User Story 2)**:
- Query: `attendances INNER JOIN applications INNER JOIN events`
- Shows ONLY events volunteer actually attended (attendance record exists)
- Status: Always `PRESENT` (no ABSENT records)

### Date Range Defaults

If query params not provided:
- `startDate` defaults to **today - 6 months**
- `endDate` defaults to **today**
- Max range: **2 years** (730 days)

### PII Protection (FR-016)

**Exposed fields** (public profile):
- ✅ `id`, `full_name`, `avatar_url`

**Protected fields** (PII):
- ❌ `email`, `phone_number`, `address`, `identity_card_number`, `date_of_birth`

---

## Implementation Checklist (Phase 2)

When user says **"làm nốt tasks"**, the system will generate `tasks.md` with ~28 tasks:

### Backend Tasks (~16 tasks)
- [ ] Repository: AttendanceRepository.getByEventId()
- [ ] Repository: AttendanceRepository.getByVolunteerId()
- [ ] Service: getEventHistory() với authorization
- [ ] Service: getVolunteerHistory() với date defaults
- [ ] Service: applyDateDefaults() helper function
- [ ] Controller: getEventHistory endpoint
- [ ] Controller: getVolunteerHistory endpoint
- [ ] Validation: Zod schemas for both endpoints
- [ ] Routes: Register attendance history routes
- [ ] Authorization: Reuse checkStaffOrganizationAccess()
- [ ] Error handling: EVENT_NOT_COMPLETED, DATE_RANGE_INVALID
- [ ] Unit tests: Service layer (80% coverage target)
- [ ] Integration tests: API endpoints (16 test cases)
- [ ] Swagger docs: JSDoc comments for both endpoints
- [ ] Performance: Verify <1.5s for 1000 records
- [ ] Database: Verify existing indexes are used

### Frontend Tasks (~12 tasks)
- [ ] API client: getEventHistory() function
- [ ] API client: getVolunteerHistory() function
- [ ] Component: AttendanceHistoryPage với 2 tabs
- [ ] Component: EventHistoryTab với event selector
- [ ] Component: VolunteerHistoryTab với search bar
- [ ] Component: DateRangePicker với smart defaults
- [ ] Component: AttendanceHistoryTable (reusable)
- [ ] Hook: usePagination for server-side pagination
- [ ] UI: Summary cards (totals, counts)
- [ ] UI: Handle loading và empty states
- [ ] Testing: Component tests (React Testing Library)
- [ ] E2E: Test both Event-First + Volunteer-First flows

---

## Code Reuse Strategy

UC47 reuses infrastructure from UC22-UC46:

| Component | Reuse Level | Notes |
|-----------|-------------|-------|
| `authorization.service.js` | 100% | checkStaffOrganizationAccess() |
| `application.repository.js` | 80% | getById(), query patterns |
| `event.repository.js` | 80% | getById(), status filtering |
| Zod validation middleware | 100% | Reuse validation pipeline |
| Error handling middleware | 100% | Centralized error classes |
| Frontend DataGrid | 70% | Similar list UI from UC46 |
| Pagination component | 90% | Adapt to server-side pagination |

**New Code Required**:
- AttendanceService history methods (~250 LOC)
- AttendanceRepository query methods (~150 LOC)
- AttendanceController history endpoints (~150 LOC)
- Frontend AttendanceHistory components (~350 LOC JSX)
- Unit + Integration tests (~500 LOC)

**Estimated Total LOC**: ~1400 new lines

---

## Testing Strategy

### Unit Tests (Jest)

```javascript
// attendance.service.test.js
describe('AttendanceService.getEventHistory', () => {
  test('should return attendance list for completed event', async () => {
    // Mock: event.status = COMPLETED
    // Mock: staff belongs to event.organization_id
    // Assert: attendance list returned with summary
  });

  test('should throw 400 if event not COMPLETED', async () => {
    // Mock: event.status = IN_PROGRESS
    // Assert: BadRequestError with message
  });

  test('should throw 403 if staff not authorized', async () => {
    // Mock: staff.organization_id !== event.organization_id
    // Assert: ForbiddenError thrown
  });
});

describe('AttendanceService.getVolunteerHistory', () => {
  test('should apply smart date defaults', async () => {
    // Act: Call without startDate/endDate
    // Assert: Defaults to last 6 months
  });

  test('should throw 400 if date range > 2 years', async () => {
    // Act: Call with 3-year range
    // Assert: ValidationError thrown
  });
});
```

**Target Coverage**: 80% line coverage cho Service layer

---

## Performance Targets

| Metric | Target | Expected Actual |
|--------|--------|-----------------|
| Event-First query | <1.5s (1000 records) | ~300ms |
| Volunteer-First query | <1.5s (1000 records) | ~400ms |
| Date range filtering | <500ms | ~150ms |
| Server-side pagination | <200ms | ~100ms |

**Optimization Notes**:
- Existing indexes sufficient for query performance
- Use Prisma includes for eager loading (avoid N+1)
- Separate count query for pagination metadata
- Apply LIMIT/OFFSET at database level

---

## Security Considerations

### Authentication & Authorization
- ✅ JWT token required (Staff/Manager/Admin roles only)
- ✅ Organization ownership validated per event
- ✅ No cross-organization history access
- ✅ Reuses `authorization.service.js` from UC22-UC25

### Input Validation
- ✅ UUID format validation for eventId/volunteerId
- ✅ Date range validation (startDate <= endDate)
- ✅ Max range validation (≤ 2 years)
- ✅ Pagination limits (max 200 per page)
- ✅ Zod schema validation before service layer

### Audit Trail
```javascript
// No audit logging needed (read-only operation)
// Performance monitoring only
{
  event_type: 'ATTENDANCE_HISTORY_VIEWED',
  staff_id: 5,
  query_type: 'EVENT_FIRST' | 'VOLUNTEER_FIRST',
  resource_id: 'event-uuid' | 'volunteer-uuid',
  timestamp: '2026-06-30T01:30:00Z'
}
```

---

## Frontend UI Pattern

### Two-Tab Layout

```jsx
<Box sx={{ p: 3 }}>
  <Typography variant="h4" gutterBottom>
    Attendance History
  </Typography>
  
  <Tabs value={activeTab} onChange={handleTabChange}>
    <Tab label="By Event" />
    <Tab label="By Volunteer" />
  </Tabs>
  
  {activeTab === 0 && <EventHistoryTab />}
  {activeTab === 1 && <VolunteerHistoryTab />}
</Box>
```

### Event-First Tab

```jsx
<Box>
  {/* Event Selector */}
  <Autocomplete
    options={completedEvents}
    getOptionLabel={(e) => e.title}
    onChange={handleEventSelect}
    renderInput={(params) => (
      <TextField {...params} label="Select Completed Event" />
    )}
  />
  
  {/* Summary Cards */}
  <Grid container spacing={2} sx={{ my: 2 }}>
    <Grid item xs={4}>
      <Card>
        <CardContent>
          <Typography variant="h3">{summary.total_approved}</Typography>
          <Typography color="textSecondary">Total Approved</Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={4}>
      <Card>
        <CardContent>
          <Typography variant="h3" color="success.main">
            {summary.present_count}
          </Typography>
          <Typography color="textSecondary">Present</Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={4}>
      <Card>
        <CardContent>
          <Typography variant="h3" color="text.secondary">
            {summary.absent_count}
          </Typography>
          <Typography color="textSecondary">Absent</Typography>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
  
  {/* DataGrid */}
  <DataGrid
    rows={attendances}
    columns={eventFirstColumns}
    getRowId={(row) => row.volunteer_id}
    pageSize={50}
    rowsPerPageOptions={[25, 50, 100, 200]}
    pagination
    paginationMode="server"
    onPageChange={handlePageChange}
    rowCount={pagination.total}
    autoHeight
  />
</Box>
```

### Volunteer-First Tab

```jsx
<Box>
  {/* Volunteer Search */}
  <Autocomplete
    options={volunteers}
    getOptionLabel={(v) => v.full_name}
    onChange={handleVolunteerSelect}
    renderInput={(params) => (
      <TextField {...params} label="Search Volunteer" />
    )}
  />
  
  {/* Date Range Picker */}
  <LocalizationProvider dateAdapter={AdapterDateFns}>
    <DateRangePicker
      startText="Start Date"
      endText="End Date"
      value={dateRange}
      onChange={handleDateRangeChange}
      renderInput={(startProps, endProps) => (
        <>
          <TextField {...startProps} />
          <Box sx={{ mx: 2 }}> to </Box>
          <TextField {...endProps} />
        </>
      )}
    />
  </LocalizationProvider>
  
  {/* Summary Cards */}
  <Grid container spacing={2} sx={{ my: 2 }}>
    <Grid item xs={4}>
      <Card>
        <CardContent>
          <Typography variant="h3">{summary.total_events_attended}</Typography>
          <Typography color="textSecondary">Events Attended</Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={4}>
      <Card>
        <CardContent>
          <Typography variant="h3">{summary.total_hours_contributed}</Typography>
          <Typography color="textSecondary">Total Hours</Typography>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
  
  {/* DataGrid */}
  <DataGrid
    rows={attendances}
    columns={volunteerFirstColumns}
    getRowId={(row) => row.event_id}
    pagination
    paginationMode="server"
    onPageChange={handlePageChange}
    rowCount={pagination.total}
    autoHeight
  />
</Box>
```

---

## Troubleshooting

### Common Issues

**Issue 1**: "Attendance history is only available for completed events"
- **Cause**: Attempting to query IN_PROGRESS or PUBLISHED event
- **Solution**: This is expected behavior. Use UC46 for real-time attendance view. UC47 is for historical reporting only.

**Issue 2**: "Staff not authorized for this organization"
- **Cause**: Staff attempting to view event from different organization
- **Solution**: Verify Staff's organization_id matches event's organization_id. Check JWT token payload.

**Issue 3**: "Date range cannot exceed 2 years"
- **Cause**: Providing date range > 730 days
- **Solution**: Reduce date range or split query into multiple requests.

**Issue 4**: Empty result for volunteer history
- **Cause**: Volunteer never checked in to any COMPLETED events
- **Solution**: This is expected. Verify volunteer actually attended events (check attendances table).

**Issue 5**: Performance slow with large date range
- **Cause**: Querying 2-year range with many events
- **Solution**: 
  1. Verify indexes are being used (run EXPLAIN query)
  2. Reduce date range (default 6 months is optimal)
  3. Consider caching frequently accessed historical data

---

## Next Steps

### For Implementation (Phase 2)
1. **User will say**: "làm nốt tasks" or request Phase 2
2. **Generate tasks.md**: System will create detailed task breakdown (~28 tasks)
3. **Implementation workflow**: User will run `/speckit-implement` to execute all tasks
4. **Testing**: Run full test suite after implementation
5. **Code review**: Review changes before merge to Dev branch

### Dependencies
- ✅ UC15-UC17 (Event Management) - COMPLETED
- ✅ UC22-UC25 (Application Management) - COMPLETED
- ✅ UC45 (Attendance Check) - COMPLETED
- ✅ UC46 (View Attendance List) - COMPLETED
- ⏳ UC47 (View Attendance History) - Phase 1 COMPLETED, Phase 2 PENDING

### Timeline Estimate
- **Tasks generation**: 2 minutes (after Phase 1 complete)
- **Backend implementation**: ~4-5 hours (16 tasks)
- **Frontend implementation**: ~3-4 hours (12 tasks)
- **Testing**: ~2 hours (unit + integration)
- **Total**: ~9-11 hours

---

## References

- **[SPEC.md](./SPEC.md)** - Feature requirements and user stories
- **[research.md](./research.md)** - Research decisions (RQ1-RQ4) với rationale
- **[data-model.md](./data-model.md)** - Database schema and query patterns
- **[contracts/GET-attendances-events-eventId-history.md](./contracts/GET-attendances-events-eventId-history.md)** - Event-First API specification
- **[contracts/GET-attendances-volunteers-volunteerId-history.md](./contracts/GET-attendances-volunteers-volunteerId-history.md)** - Volunteer-First API specification
- **UC45 Artifacts**: `.sdd/TienTD/UC45-feat-attendance-check/` - Reference for attendances table
- **UC46 Artifacts**: `.sdd/TienTD/UC46-feat-view-attendance-list/` - Reference for similar read-only patterns

---

**Ready for Phase 2!** 🚀  
All Phase 1 artifacts complete. Ready to generate tasks.md when user requests.

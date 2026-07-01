# UC45 - Attendance Check: Quickstart Guide

**Feature Owner**: TienTD  
**Status**: Phase 1 - Planning Completed  
**Last Updated**: 2026-06-30

---

## Overview

UC45 cho phép Staff thực hiện điểm danh (check-in) cho các tình nguyện viên có mặt tại sự kiện. Hệ thống hỗ trợ cả điểm danh từng người và điểm danh hàng loạt (bulk check-in) với search bar và checkbox selection.

**Key Capabilities**:
- ✅ Single check-in: POST `/api/v1/attendances/:applicationId/check-in`
- ✅ Bulk check-in: POST `/api/v1/attendances/bulk-check-in`
- ✅ Optional notes (max 500 chars)
- ✅ Partial success pattern (bulk operations)
- ✅ Client-side search với debounce
- ✅ Immutable audit trail

---

## Quick Navigation

### Planning Artifacts (Phase 1) - COMPLETED ✅
1. **[plan.md](./plan.md)** - Implementation plan với technical approach
2. **[research.md](./research.md)** - 4 research questions với detailed analysis
3. **[data-model.md](./data-model.md)** - Database schema review (NO migration needed)
4. **[contracts/](./contracts/)** - API contract documents:
   - `POST-attendances-application-id-check-in.md` - Single check-in endpoint
   - `POST-attendances-bulk-check-in.md` - Bulk check-in endpoint

### Implementation Artifacts (Phase 2) - PENDING
5. **[tasks.md](./tasks.md)** - Generated after user says "làm nốt tasks"
6. Implementation code - Generated during /speckit-implement workflow

---

## Key Decisions (from research.md)

| Question | Decision | Rationale |
|----------|----------|-----------|
| **RQ1: volunteer_hours handling** | Set to NULL, update later | UC45 focuses on check-in only, not time tracking |
| **RQ2: Bulk UI pattern** | Confirmation dialog with preview | Safety first, attendance data is immutable |
| **RQ3: Search implementation** | Client-side filtering | 200 volunteers scope, instant results |
| **RQ4: Bulk error handling** | Partial success pattern | Resilient operations, maximize throughput |

---

## Database Changes

### No Migration Required ✅

Table `attendances` đã tồn tại với đầy đủ columns:
- `id` (PK, AUTO_INCREMENT)
- `application_id` (UNIQUE FK → applications.id)
- `status` (ENUM: 'PRESENT', 'ABSENT')
- `volunteer_hours` (DECIMAL(5,2) NULL) ← UC45 sets to NULL
- `checked_in_by` (FK → users.id)
- `checked_in_at` (TIMESTAMP)
- `notes` (TEXT NULL)

**Existing Indexes**:
- UNIQUE on `application_id` (prevents duplicate check-in)
- INDEX on `checked_in_by` (audit trail queries)
- INDEX on `checked_in_at` (time-based queries)

---

## API Endpoints

### 1. Single Check-in
```http
POST /api/v1/attendances/:applicationId/check-in
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "notes": "Arrived on time" // OPTIONAL, max 500 chars
}
```

**Response 201 Created**:
```json
{
  "success": true,
  "message": "Volunteer checked in successfully",
  "data": {
    "attendance_id": 456,
    "application_id": 123,
    "volunteer_name": "Nguyễn Văn A",
    "checked_in_at": "2026-06-29T14:30:00.000Z",
    "checked_in_by": 5,
    "notes": "Arrived on time"
  }
}
```

**Common Errors**:
- `400 Bad Request`: Application not APPROVED or event COMPLETED/CANCELLED
- `403 Forbidden`: Staff not authorized for this organization
- `404 Not Found`: Application not found
- `409 Conflict`: Volunteer already checked in

---

### 2. Bulk Check-in
```http
POST /api/v1/attendances/bulk-check-in
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "application_ids": [123, 456, 789],
  "notes": "Morning shift" // OPTIONAL
}
```

**Response 200 OK** (partial success):
```json
{
  "success": true,
  "message": "Bulk check-in completed: 2 succeeded, 1 failed",
  "data": {
    "summary": {
      "total": 3,
      "succeeded": 2,
      "failed": 1,
      "duration_ms": 550
    },
    "successful": [
      {
        "application_id": 123,
        "attendance_id": 456,
        "volunteer_name": "Nguyễn Văn A",
        "checked_in_at": "2026-06-29T14:30:00.000Z"
      },
      {
        "application_id": 456,
        "attendance_id": 457,
        "volunteer_name": "Trần Thị B",
        "checked_in_at": "2026-06-29T14:30:01.000Z"
      }
    ],
    "failed": [
      {
        "application_id": 789,
        "volunteer_name": "Lê Văn C",
        "error": "Volunteer already checked in",
        "error_code": "DUPLICATE_CHECK_IN"
      }
    ]
  }
}
```

**Max Limit**: 50 applications per request

---

### 3. Get Attendance Checklist (for UI)
```http
GET /api/v1/events/:eventId/attendance-checklist
Authorization: Bearer <JWT_TOKEN>
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "event_id": 1,
    "event_title": "Beach Cleanup 2026",
    "total_approved": 200,
    "checked_in_count": 150,
    "volunteers": [
      {
        "application_id": 123,
        "volunteer_id": 45,
        "volunteer_name": "Nguyễn Văn A",
        "volunteer_avatar": "https://cloudinary.com/avatar1.jpg",
        "is_checked_in": true,
        "attendance_id": 456,
        "checked_in_at": "2026-06-29T14:30:00Z"
      },
      {
        "application_id": 124,
        "volunteer_id": 46,
        "volunteer_name": "Trần Thị B",
        "volunteer_avatar": "https://cloudinary.com/avatar2.jpg",
        "is_checked_in": false,
        "attendance_id": null,
        "checked_in_at": null
      }
    ]
  }
}
```

---

## Business Rules

### State Transition Rules

| Application Status | Can Check-in? | Notes |
|-------------------|---------------|-------|
| `APPROVED` | ✅ YES | Primary check-in path |
| `PENDING` | ❌ NO | Must be approved first (UC24) |
| `REJECTED` | ❌ NO | Application rejected |
| `WITHDRAWN` | ❌ NO | Volunteer withdrew |
| `CANCELLED` | ❌ NO | Application cancelled |

### Event Status Rules

| Event Status | Can Check-in? | Notes |
|-------------|---------------|-------|
| `PUBLISHED` | ✅ YES | Pre-event check-in allowed |
| `IN_PROGRESS` | ✅ YES | Primary check-in window |
| `DRAFT` | ❌ NO | Event not ready |
| `COMPLETED` | ❌ NO | Event ended |
| `CANCELLED` | ❌ NO | Event cancelled |

### Immutability Rules

**Once attendance record is created**:
- ✅ `volunteer_hours`: Can update from NULL → actual hours (future UC)
- ✅ `notes`: Can update/append notes (low priority)
- ❌ `status`: CANNOT change from PRESENT to ABSENT
- ❌ `checked_in_at`: CANNOT modify timestamp
- ❌ `checked_in_by`: CANNOT change Staff ID

**Rationale**: Audit trail integrity cho certificate generation (UC53)

---

## Implementation Checklist (Phase 2)

When user says **"làm nốt tasks"**, the system will generate `tasks.md` with ~32 tasks:

### Backend Tasks (~18 tasks)
- [ ] Repository: AttendanceRepository CRUD methods
- [ ] Service: Single check-in logic với validation
- [ ] Service: Bulk check-in với partial success pattern
- [ ] Service: Get attendance checklist query
- [ ] Controller: Single check-in endpoint
- [ ] Controller: Bulk check-in endpoint
- [ ] Controller: Get checklist endpoint
- [ ] Validation: Zod schemas for check-in requests
- [ ] Routes: Register attendance endpoints
- [ ] Authorization: Reuse checkStaffOrganizationAccess()
- [ ] Error handling: DUPLICATE_CHECK_IN, INVALID_STATE
- [ ] Unit tests: Service layer (80% coverage target)
- [ ] Integration tests: API endpoints (23 test cases single, 20 bulk)
- [ ] Swagger docs: JSDoc comments
- [ ] Audit logging: Log check-in events
- [ ] Performance: Verify <800ms single, <5s bulk targets
- [ ] Database: Verify UNIQUE constraint handling
- [ ] Transaction: Test partial success rollback behavior

### Frontend Tasks (~14 tasks)
- [ ] API client: `checkInVolunteer()` function
- [ ] API client: `bulkCheckInVolunteers()` function
- [ ] API client: `getAttendanceChecklist()` function
- [ ] Component: AttendanceList với checkbox selection
- [ ] Component: AttendanceListItem with status badge
- [ ] Component: SearchBar với debounce (300ms)
- [ ] Component: BulkCheckInButton với loading state
- [ ] Component: ConfirmationDialog with volunteer preview
- [ ] Page: AttendanceCheckPage integration
- [ ] Hook: useAttendance state management
- [ ] UI: Success/error toast notifications
- [ ] UI: Handle loading và empty states
- [ ] Testing: Component tests (React Testing Library)
- [ ] E2E: Test single + bulk check-in flows

---

## Code Reuse Strategy

UC45 reuses infrastructure from UC24-UC25:

| Component | Reuse Level | Notes |
|-----------|-------------|-------|
| `authorization.service.js` | 100% | checkStaffOrganizationAccess() |
| `application.service.js` | 80% | getById(), validateStatus() |
| `event.service.js` | 80% | getById(), checkEventStatus() |
| Bulk operation pattern | 90% | Adapt from UC25 bulk reject |
| Zod validation middleware | 100% | Reuse validation pipeline |
| Error handling middleware | 100% | Centralized error classes |
| Frontend DataGrid | 70% | Similar list + checkbox UI |

**New Code Required**:
- AttendanceService (~300 LOC)
- AttendanceRepository (~150 LOC)
- AttendanceController (~200 LOC)
- Frontend AttendanceList components (~400 LOC JSX)
- Unit + Integration tests (~600 LOC)

**Estimated Total LOC**: ~1650 new lines

---

## Testing Strategy

### Unit Tests (Jest)

```javascript
// attendance.service.test.js
describe('AttendanceService.checkIn', () => {
  test('should create attendance record for approved application', async () => {
    // Mock: application.status = APPROVED
    // Mock: event.status = IN_PROGRESS
    // Mock: staff belongs to event.organization_id
    // Assert: attendance record created with correct fields
  });

  test('should throw 409 if volunteer already checked in', async () => {
    // Mock: attendance record already exists (UNIQUE constraint)
    // Assert: ConflictError thrown with message
  });

  test('should throw 403 if staff not authorized', async () => {
    // Mock: staff.organization_id !== event.organization_id
    // Assert: ForbiddenError thrown
  });

  test('should throw 400 if application not APPROVED', async () => {
    // Mock: application.status = PENDING
    // Assert: BadRequestError with state transition message
  });

  test('should throw 400 if event COMPLETED', async () => {
    // Mock: event.status = COMPLETED
    // Assert: BadRequestError with event status message
  });
});

describe('AttendanceService.bulkCheckIn', () => {
  test('should process all valid applications', async () => {
    // Mock: 5 approved applications from same event
    // Assert: 5 attendance records created
    // Assert: summary.succeeded = 5, failed = 0
  });

  test('should return partial success with errors', async () => {
    // Mock: 3 valid, 1 duplicate, 1 not approved
    // Assert: 3 succeeded, 2 failed with reasons
    // Assert: HTTP 200 (not 207, per RQ4 decision)
  });

  test('should handle all failures gracefully', async () => {
    // Mock: All invalid applications
    // Assert: succeeded = 0, failed = 5 with detailed errors
  });
});
```

**Target Coverage**: 80% line coverage cho Service layer

---

### Integration Tests (Supertest)

```javascript
// attendance.integration.test.js
describe('POST /api/v1/attendances/:applicationId/check-in', () => {
  test('should return 201 with attendance data', async () => {
    // Setup: Create event, approved application, authenticate as staff
    // Act: POST to endpoint
    // Assert: 201 response, attendance record in DB
  });

  test('should return 409 if already checked in', async () => {
    // Setup: Create attendance record
    // Act: POST again
    // Assert: 409 Conflict response
  });

  test('should return 403 if staff not authorized', async () => {
    // Setup: Staff from different organization
    // Act: POST to endpoint
    // Assert: 403 Forbidden response
  });

  test('should return 400 if notes > 500 chars', async () => {
    // Act: POST with 501-char notes
    // Assert: 400 Bad Request with validation error
  });
});

describe('POST /api/v1/attendances/bulk-check-in', () => {
  test('should process bulk check-in with partial success', async () => {
    // Setup: 10 applications (8 valid, 2 invalid)
    // Act: POST with all 10 IDs
    // Assert: 200 OK, summary.succeeded = 8, failed = 2
  });

  test('should return 400 if > 50 application_ids', async () => {
    // Act: POST with 51 IDs
    // Assert: 400 Bad Request
  });
});
```

---

### E2E Tests (Manual for MVP)

**Critical Flows**:
1. **Single Check-in**:
   - Login as Staff
   - Navigate to event attendance page
   - Search volunteer by name
   - Click "Check-in" button on row
   - Verify success toast
   - Verify row status changed to "Checked In" with timestamp

2. **Bulk Check-in**:
   - Login as Staff
   - Navigate to attendance page
   - Use search bar to filter volunteers
   - Select 5 volunteers via checkboxes
   - Click "Bulk Check-in" button
   - Review list in confirmation dialog
   - Confirm action
   - Verify success message "5/5 checked in"
   - Verify all 5 rows updated

3. **Partial Success Handling**:
   - Select 3 volunteers (1 already checked in, 2 valid)
   - Click "Bulk Check-in"
   - Verify summary: "2/3 checked in, 1 failed"
   - Verify failed volunteer highlighted in red
   - Verify error tooltip on failed row

4. **Search Performance**:
   - Load page with 200 volunteers
   - Type in search bar
   - Verify debounced filtering (<300ms delay)
   - Verify filtered results appear instantly

---

## Performance Targets

| Metric | Target | Expected Actual |
|--------|--------|-----------------|
| Single check-in | <800ms (P95) | ~250ms |
| Bulk check-in (50) | <5s total | ~2.75s |
| Get checklist (200) | <500ms | ~150ms |
| Search bar render | <200ms | <100ms (client-side) |
| UNIQUE constraint check | <10ms | ~5ms (database) |
| Authorization check | <100ms | ~50ms |

**Optimization Notes**:
- Client-side search avoids network latency
- UNIQUE constraint prevents duplicate at database level (fast)
- Sequential bulk INSERTs acceptable for 50 records target
- Can optimize to Prisma `createMany()` if needed (~500ms for 50)

---

## Security Considerations

### Authentication & Authorization
- ✅ JWT token required (Staff/Manager/Admin roles only)
- ✅ Organization ownership validated per event
- ✅ No cross-organization check-in possible
- ✅ Reuses `authorization.service.js` from UC24-UC25

### Input Validation
- ✅ `notes` max 500 chars (prevents abuse)
- ✅ `application_id` positive integer (prevents injection)
- ✅ Bulk limit 50 applications (prevents DoS)
- ✅ Zod schema validation before service layer

### Audit Trail
```javascript
// Logged for each check-in
{
  event_type: 'VOLUNTEER_CHECKED_IN',
  staff_id: 5,
  application_id: 123,
  volunteer_id: 45,
  attendance_id: 456,
  notes: 'Arrived on time',
  timestamp: '2026-06-29T14:30:00Z',
  ip_address: '10.0.0.1'
}
```

### Data Immutability
- ✅ Attendance records CANNOT be updated after creation
- ✅ `checked_in_at` timestamp locked (prevents tampering)
- ✅ UNIQUE constraint on `application_id` (prevents duplicates)

---

## Frontend UI Pattern

### AttendanceList Component Structure
```jsx
<Box sx={{ p: 3 }}>
  {/* Search Bar */}
  <SearchBar 
    value={searchQuery}
    onChange={handleSearchChange}
    placeholder="Search by volunteer name..."
    debounceMs={300}
  />

  {/* Bulk Action Bar */}
  {selectedIds.size > 0 && (
    <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
      <Badge badgeContent={selectedIds.size} color="primary">
        <Button
          variant="contained"
          color="primary"
          startIcon={<CheckCircleIcon />}
          onClick={handleBulkCheckInClick}
        >
          Bulk Check-in
        </Button>
      </Badge>
      <Button
        variant="outlined"
        onClick={handleDeselectAll}
      >
        Deselect All
      </Button>
    </Box>
  )}

  {/* Volunteer List */}
  <TableContainer>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell padding="checkbox">
            <Checkbox
              checked={allSelected}
              onChange={handleSelectAll}
            />
          </TableCell>
          <TableCell>Volunteer</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Checked In At</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {filteredVolunteers.map(volunteer => (
          <AttendanceListItem
            key={volunteer.application_id}
            volunteer={volunteer}
            selected={selectedIds.has(volunteer.application_id)}
            onSelect={handleSelectVolunteer}
            onCheckIn={handleSingleCheckIn}
          />
        ))}
      </TableBody>
    </Table>
  </TableContainer>
</Box>
```

### Confirmation Dialog (from RQ2 decision)
```jsx
<Dialog open={confirmOpen} maxWidth="sm" fullWidth>
  <DialogTitle>Confirm Bulk Check-in</DialogTitle>
  <DialogContent>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      You are about to check in {selectedVolunteers.length} volunteers:
    </Typography>
    <List sx={{ maxHeight: 300, overflow: 'auto' }}>
      {selectedVolunteers.map(v => (
        <ListItem key={v.application_id}>
          <ListItemAvatar>
            <Avatar src={v.volunteer_avatar} />
          </ListItemAvatar>
          <ListItemText primary={v.volunteer_name} />
        </ListItem>
      ))}
    </List>
    <TextField
      fullWidth
      label="Notes (Optional)"
      placeholder="E.g., Morning shift"
      value={notes}
      onChange={e => setNotes(e.target.value)}
      inputProps={{ maxLength: 500 }}
      helperText={`${notes.length}/500 characters`}
      sx={{ mt: 2 }}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={handleCancelConfirm}>
      Cancel
    </Button>
    <Button
      onClick={handleConfirmCheckIn}
      variant="contained"
      color="primary"
      disabled={loading}
    >
      {loading ? <CircularProgress size={24} /> : 'Confirm Check-in'}
    </Button>
  </DialogActions>
</Dialog>
```

---

## Troubleshooting

### Common Issues

**Issue 1**: "Volunteer already checked in"
- **Cause**: Duplicate check-in attempt (UNIQUE constraint violation)
- **Solution**: This is expected behavior. Verify attendance record exists in DB. If stuck, check `attendances` table for record with same `application_id`.

**Issue 2**: "Application status must be APPROVED"
- **Cause**: Attempting to check-in volunteer with PENDING/REJECTED status
- **Solution**: Run UC24 (Approve Application) first. Verify `applications.status = 'APPROVED'`.

**Issue 3**: "Event status invalid for check-in"
- **Cause**: Event is COMPLETED or CANCELLED
- **Solution**: Cannot check-in for ended events. Verify `events.status` in database.

**Issue 4**: "Staff not authorized for this organization"
- **Cause**: Staff attempting to check-in for event from different organization
- **Solution**: Verify Staff's organization_id matches event's organization_id. Check JWT token payload.

**Issue 5**: Bulk check-in returns all failed
- **Cause**: All applications in wrong state or authorization failed
- **Solution**: Check `failed` array for specific error codes per application. Verify at least 1 valid APPROVED application exists.

**Issue 6**: Search bar not filtering
- **Cause**: Debounce delay or state not updating
- **Solution**: 
  1. Check console for React errors
  2. Verify `searchQuery` state updating
  3. Check `filteredVolunteers` useMemo dependency array
  4. Increase debounce to 500ms if typing too fast

**Issue 7**: Performance slow with 200+ volunteers
- **Cause**: Re-rendering entire list on each keystroke
- **Solution**: 
  1. Verify React.memo() on AttendanceListItem
  2. Check debounce is working (300ms)
  3. Consider virtual scrolling (react-window) if >500 items

---

## Next Steps

### For Implementation (Phase 2)
1. **Wait for user command**: User will say **"làm nốt tasks"**
2. **Generate tasks.md**: System will create detailed task breakdown (~32 tasks)
3. **Implementation workflow**: User will run `/speckit-implement` to execute all tasks
4. **Testing**: Run full test suite after implementation
5. **Code review**: Review changes before merge to Dev branch

### Dependencies
- ✅ UC24 (Approve Application) - COMPLETED (provides APPROVED applications)
- ✅ `attendances` table - Already exists in schema
- ✅ `authorization.service.js` - Reuse from UC24-UC25
- ✅ `application.service.js` - Reuse getById(), validateStatus()
- ✅ `event.service.js` - Reuse getById(), checkEventStatus()
- ⏳ UC45 (Attendance Check) - Phase 1 COMPLETED, Phase 2 PENDING
- ⏳ UC46 (View Attendance List) - Can implement in parallel
- ⏳ UC53 (Generate Certificate) - Depends on UC45 attendance data

### Timeline Estimate
- **Tasks generation**: 2 minutes (after "làm nốt tasks" command)
- **Backend implementation**: ~4-5 hours (18 tasks)
- **Frontend implementation**: ~3-4 hours (14 tasks)
- **Testing**: ~2-3 hours (unit + integration + E2E)
- **Total**: ~10-12 hours

---

## References

- **[plan.md](./plan.md)** - Full implementation plan với technical approach
- **[research.md](./research.md)** - Research decisions (RQ1-RQ4) với rationale
- **[data-model.md](./data-model.md)** - Database schema review và analytics queries
- **[contracts/POST-attendances-application-id-check-in.md](./contracts/POST-attendances-application-id-check-in.md)** - Single check-in API specification
- **[contracts/POST-attendances-bulk-check-in.md](./contracts/POST-attendances-bulk-check-in.md)** - Bulk check-in API specification
- **UC24 Artifacts**: `.sdd/TienTD/UC24-feat-approve-application/` - Reference for authorization patterns
- **UC25 Artifacts**: `.sdd/TienTD/UC25-feat-reject-application/` - Reference for bulk operation patterns

---

**Ready for Phase 2!** 🚀  
Say **"làm nốt tasks"** to generate tasks.md and proceed to implementation.

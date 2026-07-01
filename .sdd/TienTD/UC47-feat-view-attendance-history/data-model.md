# Data Model: View Attendance History (UC47)

**Feature Branch**: `047-feat-view-attendance-history`  
**Created**: 2026-06-30  
**Status**: READY

**Input**: research.md from `.sdd/TienTD/UC47-feat-view-attendance-history/research.md`

---

## Database Schema Changes

### Migration Required: ❌ NO

**Rationale**:
- UC47 is a **READ-ONLY** feature (FR-016: "MUST NOT cho phép Staff chỉnh sửa hay xóa các bản ghi điểm danh cũ")
- All required tables already exist from previous UCs:
  - `events` table (UC15-UC17)
  - `applications` table (UC22-UC25)
  - `attendances` table (UC45)
  - `users` table (Authentication module)
- No new columns, tables, or indexes needed
- Existing indexes sufficient for query performance (verified in research.md RQ3)

---

## Existing Tables Used

### 1. `events` Table
**Purpose**: Store event information, filter by COMPLETED status

**Relevant Columns**:
```prisma
model Event {
  id                String   @id @default(uuid())
  organization_id   String   // FK to organizations.id
  title             String
  start_date        DateTime
  end_date          DateTime
  status            EventStatus // ENUM: DRAFT, PUBLISHED, IN_PROGRESS, COMPLETED, CANCELLED
  is_active         Boolean  @default(true) // Soft delete flag
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  // Relations
  applications      Application[]
  
  @@index([organization_id, status, end_date]) // Optimized for UC47 queries
  @@index([organization_id, end_date]) // Date range filtering
}
```

**UC47 Query Pattern**:
```sql
-- Get completed events for organization within date range
SELECT id, title, start_date, end_date, status
FROM events
WHERE organization_id = ?
  AND status = 'COMPLETED'
  AND end_date BETWEEN ? AND ?
  AND is_active = true
ORDER BY end_date DESC
LIMIT ? OFFSET ?;
```

---

### 2. `applications` Table
**Purpose**: Link volunteers to events, filter by APPROVED status

**Relevant Columns**:
```prisma
model Application {
  id          Int      @id @default(autoincrement())
  event_id    String   // FK to events.id
  user_id     String   // FK to users.id (volunteer)
  status      ApplicationStatus // ENUM: PENDING, APPROVED, REJECTED, CANCELLED
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  // Relations
  event       Event       @relation(fields: [event_id], references: [id])
  user        User        @relation(fields: [user_id], references: [id])
  attendance  Attendance? // One-to-one relation
  
  @@index([event_id, status]) // UC47 queries by event
  @@index([user_id, status]) // UC47 queries by volunteer
  @@index([event_id, created_at]) // Sorting applications
}
```

**UC47 Query Pattern (Event-First)**:
```sql
-- Get all approved applications for an event
SELECT 
  a.id as application_id,
  a.user_id as volunteer_id,
  u.full_name as volunteer_name,
  u.avatar_url as volunteer_avatar,
  att.status as attendance_status,
  att.checked_in_at,
  att.checked_in_by
FROM applications a
INNER JOIN users u ON a.user_id = u.id
LEFT JOIN attendances att ON att.application_id = a.id
WHERE a.event_id = ?
  AND a.status = 'APPROVED'
ORDER BY a.created_at ASC
LIMIT ? OFFSET ?;
```

**UC47 Query Pattern (Volunteer-First)**:
```sql
-- Get all events a volunteer attended in organization
SELECT 
  e.id as event_id,
  e.title as event_title,
  e.start_date,
  e.end_date,
  att.status as attendance_status,
  att.checked_in_at,
  att.volunteer_hours
FROM attendances att
INNER JOIN applications a ON att.application_id = a.id
INNER JOIN events e ON a.event_id = e.id
WHERE a.user_id = ?
  AND e.organization_id = ?
  AND e.status = 'COMPLETED'
  AND e.end_date BETWEEN ? AND ?
  AND e.is_active = true
ORDER BY e.end_date DESC
LIMIT ? OFFSET ?;
```

---

### 3. `attendances` Table
**Purpose**: Store check-in records, LEFT JOIN for history view

**Relevant Columns**:
```prisma
model Attendance {
  id               Int       @id @default(autoincrement())
  application_id   Int       @unique // FK to applications.id (one-to-one)
  status           AttendanceStatus // ENUM: PRESENT, ABSENT
  volunteer_hours  Decimal?  @db.Decimal(5, 2) // Nullable
  checked_in_by    String    // FK to users.id (Staff who checked in)
  checked_in_at    DateTime
  notes            String?   @db.VarChar(500)
  
  // Relations
  application      Application @relation(fields: [application_id], references: [id])
  
  @@index([application_id]) // UNIQUE provides this automatically
  @@index([checked_in_at]) // For date range queries
}
```

**UC47 Usage**:
- **LEFT JOIN** attendances to applications (shows both checked-in and not-checked-in volunteers)
- Status mapping: `attendance.status === 'PRESENT'` → "Present", `attendance === null` → "Absent"
- Read-only access: UC47 never inserts/updates/deletes from this table

---

### 4. `users` Table
**Purpose**: Get volunteer information (name, avatar)

**Relevant Columns**:
```prisma
model User {
  id          String   @id @default(uuid())
  full_name   String
  avatar_url  String?
  email       String   @unique
  role        UserRole // ENUM: GUEST, VOLUNTEER, STAFF, MANAGER, ADMIN
  is_active   Boolean  @default(true)
  
  // Relations
  applications Application[]
  
  @@index([role, is_active]) // Filter by role
}
```

**UC47 Query Pattern**:
- SELECT only public profile fields: `id`, `full_name`, `avatar_url`
- **MUST NOT** expose PII: `email`, `phone_number`, `address`, `identity_card_number` (FR-016)

---

## Query Optimization

### Existing Indexes (Already in Schema)

1. **Event Queries**:
   - `idx_events_org_status_end` on `(organization_id, status, end_date)` → Optimizes completed events filter
   - `idx_events_org_end` on `(organization_id, end_date)` → Date range filtering

2. **Application Queries**:
   - `idx_applications_event_status` on `(event_id, status)` → Event-first queries
   - `idx_applications_user_status` on `(user_id, status)` → Volunteer-first queries
   - `idx_applications_event_created` on `(event_id, created_at)` → Sorting

3. **Attendance Queries**:
   - UNIQUE constraint on `application_id` provides implicit index
   - `idx_attendances_checked_in_at` on `(checked_in_at)` → Date filtering

**Performance Verification**:
- Run `EXPLAIN` on query patterns to verify index usage
- Target: <1.5s for 1000 records (SC-001)
- Monitor slow query log for optimization opportunities

---

## Data Flow Diagrams

### Event-First Query Flow (User Story 1)

```
┌─────────┐
│ Staff   │ Selects completed event
└────┬────┘
     │ GET /api/v1/attendances/events/:eventId/history?limit=50&offset=0
     ▼
┌─────────────────────────────────────────┐
│ AttendanceController.getEventHistory()  │
└────┬────────────────────────────────────┘
     │ 1. Validate eventId
     │ 2. Check Staff organization access
     ▼
┌─────────────────────────────────────────┐
│ AttendanceService.getEventHistory()     │
└────┬────────────────────────────────────┘
     │ 3. Verify event belongs to Staff's org
     │ 4. Verify event.status === 'COMPLETED'
     ▼
┌─────────────────────────────────────────┐
│ AttendanceRepository.getByEventId()     │
└────┬────────────────────────────────────┘
     │ 5. Query applications LEFT JOIN attendances
     │ 6. Include user (volunteer) info
     │ 7. Apply pagination (limit, offset)
     ▼
┌─────────────────────────────────────────┐
│ Response:                               │
│ - event: { id, title, dates, status }  │
│ - attendances: [{ volunteer, status }] │
│ - summary: { approved, present, absent}│
│ - pagination: { total, limit, offset } │
└─────────────────────────────────────────┘
```

---

### Volunteer-First Query Flow (User Story 2)

```
┌─────────┐
│ Staff   │ Searches volunteer name
└────┬────┘
     │ GET /api/v1/attendances/volunteers/:volunteerId/history
     │     ?startDate=2025-12-30&endDate=2026-06-30&limit=50&offset=0
     ▼
┌──────────────────────────────────────────────┐
│ AttendanceController.getVolunteerHistory()   │
└────┬─────────────────────────────────────────┘
     │ 1. Validate volunteerId
     │ 2. Parse & validate date range
     │ 3. Check Staff organization access
     ▼
┌──────────────────────────────────────────────┐
│ AttendanceService.getVolunteerHistory()      │
└────┬─────────────────────────────────────────┘
     │ 4. Apply smart defaults (last 6 months if no dates)
     │ 5. Validate date range <= 2 years
     │ 6. Verify Staff can access volunteer's org events
     ▼
┌──────────────────────────────────────────────┐
│ AttendanceRepository.getByVolunteerId()      │
└────┬─────────────────────────────────────────┘
     │ 7. Query attendances JOIN applications JOIN events
     │ 8. Filter: event.status = COMPLETED
     │ 9. Filter: event.organization_id = Staff's org
     │ 10. Filter: event.end_date BETWEEN startDate AND endDate
     │ 11. Apply pagination (limit, offset)
     ▼
┌──────────────────────────────────────────────┐
│ Response:                                    │
│ - volunteer: { id, name, avatar }           │
│ - attendances: [{ event, status, hours }]  │
│ - summary: { total_events, total_hours }   │
│ - pagination: { total, limit, offset }     │
└──────────────────────────────────────────────┘
```

---

## Authorization Model

### Organization-Based Access Control (Reuse from UC22/UC24)

**Rule**: Staff can ONLY view attendance history for events in their organization

**Implementation**:
```javascript
// AttendanceService.getEventHistory()
async getEventHistory(eventId, staffId, { limit = 50, offset = 0 }) {
  // Step 1: Get Staff's organization_id
  const staff = await userRepository.getById(staffId);
  const staffOrgId = staff.organization_id;
  
  // Step 2: Get event with organization check
  const event = await eventRepository.getById(eventId);
  
  // Step 3: Authorization check
  if (event.organization_id !== staffOrgId) {
    throw new ForbiddenError('You do not have permission to view this event\'s attendance history');
  }
  
  // Step 4: Verify event is COMPLETED
  if (event.status !== 'COMPLETED') {
    throw new BadRequestError('Attendance history is only available for completed events. Use UC46 for ongoing events.');
  }
  
  // Step 5: Proceed with query...
}
```

**Same pattern for Volunteer-First**:
```javascript
// AttendanceService.getVolunteerHistory()
async getVolunteerHistory(volunteerId, staffId, { startDate, endDate, limit, offset }) {
  const staff = await userRepository.getById(staffId);
  const staffOrgId = staff.organization_id;
  
  // Query filter MUST include organization_id
  const attendances = await attendanceRepository.getByVolunteerIdAndOrganization(
    volunteerId,
    staffOrgId, // Only events in Staff's organization
    { startDate, endDate, limit, offset }
  );
  
  return attendances;
}
```

---

## Data Transformation Layer

### Service Layer Transformations

**Event-First Response Mapping**:
```javascript
// Input: Prisma query result
const applications = await prisma.application.findMany({
  where: { event_id: eventId, status: 'APPROVED' },
  include: {
    user: { select: { id: true, full_name: true, avatar_url: true } },
    attendance: { select: { status: true, checked_in_at: true, checked_in_by: true, volunteer_hours: true } }
  }
});

// Output: Transformed for API response
const attendances = applications.map(app => ({
  volunteer_id: app.user.id,
  volunteer_name: app.user.full_name,
  volunteer_avatar: app.user.avatar_url || null,
  status: app.attendance ? 'PRESENT' : 'ABSENT', // Map null attendance to ABSENT
  checked_in_at: app.attendance?.checked_in_at || null,
  checked_in_by: app.attendance?.checked_in_by || null,
  volunteer_hours: app.attendance?.volunteer_hours || null
}));

// Aggregate counts
const summary = {
  total_approved: applications.length,
  present_count: applications.filter(a => a.attendance !== null).length,
  absent_count: applications.filter(a => a.attendance === null).length
};
```

**Volunteer-First Response Mapping**:
```javascript
// Input: Prisma query result
const attendances = await prisma.attendance.findMany({
  where: {
    application: {
      user_id: volunteerId,
      event: {
        organization_id: staffOrgId,
        status: 'COMPLETED',
        end_date: { gte: startDate, lte: endDate }
      }
    }
  },
  include: {
    application: {
      include: {
        event: { select: { id: true, title: true, start_date: true, end_date: true } }
      }
    }
  }
});

// Output: Transformed for API response
const history = attendances.map(att => ({
  event_id: att.application.event.id,
  event_title: att.application.event.title,
  event_date: att.application.event.end_date.toISOString().split('T')[0], // Format: YYYY-MM-DD
  status: att.status, // 'PRESENT' or 'ABSENT'
  checked_in_at: att.checked_in_at,
  volunteer_hours: att.volunteer_hours || 0
}));

// Aggregate summary
const summary = {
  total_events_attended: attendances.length,
  total_hours_contributed: attendances.reduce((sum, att) => sum + (att.volunteer_hours || 0), 0),
  date_range: {
    earliest: attendances.length > 0 ? Math.min(...attendances.map(a => a.application.event.end_date)) : null,
    latest: attendances.length > 0 ? Math.max(...attendances.map(a => a.application.event.end_date)) : null
  }
};
```

---

## Privacy & Security Constraints

### PII Protection (FR-016)

**MUST NOT expose in API response**:
- ❌ `users.email`
- ❌ `users.phone_number`
- ❌ `users.address`
- ❌ `users.identity_card_number`
- ❌ `users.date_of_birth`

**ALLOWED public profile fields**:
- ✅ `users.id`
- ✅ `users.full_name`
- ✅ `users.avatar_url`

**Implementation**:
```javascript
// Define public profile constant (reuse from UC22/UC24)
export const USER_PUBLIC_PROFILE_SELECT = {
  id: true,
  full_name: true,
  avatar_url: true
};

// Use in Prisma queries
include: {
  user: { select: USER_PUBLIC_PROFILE_SELECT }
}
```

---

## Edge Cases & Data Validation

### Edge Case 1: Event with No Approved Applications
**Scenario**: Staff queries history for event where all applications were rejected  
**Expected Behavior**:
- API returns 200 OK
- `data.attendances = []` (empty array)
- `summary.total_approved = 0`
- Frontend shows: "No volunteers attended this event"

---

### Edge Case 2: Volunteer with No Attendance Records
**Scenario**: Staff searches volunteer who registered but never checked in  
**Expected Behavior**:
- API returns 200 OK
- `data.attendances = []` (empty array)
- `summary.total_events_attended = 0`
- Frontend shows: "This volunteer has not attended any events yet"

---

### Edge Case 3: Date Range with No Results
**Scenario**: Staff filters date range with no completed events  
**Expected Behavior**:
- API returns 200 OK
- Empty data arrays
- Frontend shows: "No attendance history found for the selected date range"

---

### Edge Case 4: Pagination Beyond Available Data
**Scenario**: Staff requests offset=100 but only 50 records exist  
**Expected Behavior**:
- API returns 200 OK
- `data.attendances = []`
- `pagination.total = 50`, `pagination.offset = 100`, `pagination.hasMore = false`
- Frontend disables "Next Page" button

---

### Edge Case 5: Soft-Deleted Events (is_active = false)
**Scenario**: Event was soft-deleted after attendance was recorded  
**Expected Behavior** (A-008):
- Default: Exclude soft-deleted events from history (`WHERE is_active = true`)
- Optional future enhancement: Add query param `includeDeleted=true` for audit purposes

---

## Testing Data Requirements

### Test Data Setup for UC47

**Create test scenario with**:
1. **Organization**: TestOrg (org_id = "test-org-001")
2. **Staff**: TestStaff (belongs to TestOrg)
3. **Events**:
   - Event A (COMPLETED, 2025-12-15, 100 volunteers, 85 present)
   - Event B (COMPLETED, 2026-01-20, 50 volunteers, 45 present)
   - Event C (IN_PROGRESS, 2026-06-30) → Should NOT appear in UC47
4. **Volunteers**:
   - Volunteer A (attended Event A + Event B)
   - Volunteer B (attended Event A only)
   - Volunteer C (registered for Event A but no attendance record)
5. **Applications**: Mix of APPROVED with/without attendance
6. **Attendances**: Mix of PRESENT status with various checked_in_at timestamps

**SQL Seed Script Location**: `backend/prisma/seeds/uc47-test-data.sql`

---

## Summary

### Key Data Model Decisions

1. ✅ **NO MIGRATION REQUIRED** - Reuses existing tables from UC15-UC45
2. ✅ **TWO QUERY PATTERNS** - Event-First (LEFT JOIN) vs Volunteer-First (INNER JOIN attendances)
3. ✅ **SERVER-SIDE PAGINATION** - limit/offset in SQL queries for scalability
4. ✅ **COMPLETED EVENTS ONLY** - Filter `WHERE events.status = 'COMPLETED'`
5. ✅ **ORGANIZATION-BASED ACCESS** - Reuse authorization pattern from UC22/UC24
6. ✅ **PII PROTECTION** - Database-level filtering via Prisma select (USER_PUBLIC_PROFILE_SELECT)
7. ✅ **SMART DATE DEFAULTS** - Last 6 months if not specified (RQ4 decision)

### Performance Targets

- **Response Time**: <1.5s for 1000 records (SC-001)
- **Query Optimization**: Use existing indexes, verify with EXPLAIN
- **Pagination**: Default 50 records per page, max 200

### Next Phase

Ready to generate:
- `contracts/GET-attendances-events-eventId-history.md` (Event-First endpoint)
- `contracts/GET-attendances-volunteers-volunteerId-history.md` (Volunteer-First endpoint)
- `quickstart.md` (Implementation guide)

---

**Status**: ✅ READY - Data model documented, ready for `/speckit-plan` Phase 1 contracts generation

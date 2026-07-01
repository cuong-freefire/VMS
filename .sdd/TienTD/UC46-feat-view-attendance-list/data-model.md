# Data Model: View Attendance List (UC46)

**Feature Branch**: `046-feat-view-attendance-list`  
**Created**: 2026-06-30  
**Status**: COMPLETE

**Input**: SPEC.md + research.md from `.sdd/TienTD/UC46-feat-view-attendance-list/`

---

## Summary

UC46 (View Attendance List) is a **READ-ONLY** feature that displays attendance status for approved volunteers. This feature **DOES NOT require database schema changes** as it reuses existing tables from UC22 (Applications) and UC45 (Attendance Check).

**Key Design Decision (from RQ4)**: Query strategy uses `applications` table with LEFT JOIN to `attendances` to show ALL approved volunteers (both checked-in and not-yet-checked-in).

---

## Database Schema

### Existing Tables (NO CHANGES REQUIRED)

#### Table: `volunteer_applications`
**Source**: UC22 (List Applications), UC23 (View Application Detail), UC24 (Approve Application)  
**Relevance**: Source of approved volunteers for events

```prisma
model Application {
  id                String      @id @default(uuid())
  event_id          String
  volunteer_id      String      // FK -> users.id
  status            ApplicationStatus @default(SUBMITTED) // APPROVED is key for UC46
  created_at        DateTime    @default(now())
  updated_at        DateTime    @updatedAt
  
  // Relations
  event             Event       @relation(fields: [event_id], references: [id])
  user              User        @relation(fields: [volunteer_id], references: [id])
  attendance        Attendance? @relation("ApplicationAttendance") // LEFT JOIN for UC46
  
  @@index([event_id])
  @@index([volunteer_id])
  @@index([status])
  @@map("volunteer_applications")
}

enum ApplicationStatus {
  SUBMITTED
  REVIEWED
  APPROVED   // ← UC46 filters by this status
  REJECTED
  WITHDRAWN
  CANCELLED
}
```

#### Table: `attendances`
**Source**: UC45 (Attendance Check)  
**Relevance**: Contains check-in timestamps and status for volunteers

```prisma
model Attendance {
  id                Int         @id @default(autoincrement())
  application_id    String      @unique // FK -> applications.id (1:1 relationship)
  status            AttendanceStatus @default(ABSENT)
  volunteer_hours   Decimal?    @db.Decimal(5,2) // Nullable (set later, not in UC45/UC46)
  checked_in_by     String      // FK -> users.id (Staff UUID)
  checked_in_at     DateTime    @default(now())
  notes             String?     @db.VarChar(500) // Optional notes from staff
  
  // Relations
  application       Application @relation("ApplicationAttendance", fields: [application_id], references: [id])
  staff             User        @relation("StaffCheckIns", fields: [checked_in_by], references: [id])
  
  @@index([checked_in_at])
  @@map("attendances")
}

enum AttendanceStatus {
  PRESENT  // ← Has attendance record
  ABSENT   // ← No attendance record (LEFT JOIN returns null)
}
```

#### Table: `events`
**Source**: UC10-UC19 (Event Management Module)  
**Relevance**: Authorization check (organization_id)

```prisma
model Event {
  id                String      @id @default(uuid())
  organization_id   String      // ← Key for authorization in UC46
  name              String      @db.VarChar(255)
  status            EventStatus
  // ... other fields
  
  applications      Application[]
  
  @@index([organization_id])
  @@map("events")
}
```

#### Table: `users`
**Source**: UC01-UC09 (User Management Module)  
**Relevance**: Volunteer information (name, avatar)

```prisma
model User {
  id                String      @id @default(uuid())
  full_name         String      @db.VarChar(255) // ← Displayed in UC46
  avatar_url        String?     @db.VarChar(500) // ← Optional avatar
  role              UserRole
  organization_id   String?     // For Staff/Manager/Admin
  // ... other fields (email, phone NOT exposed per FR-016)
  
  applications      Application[] @relation("VolunteerApplications")
  checked_ins       Attendance[]  @relation("StaffCheckIns")
  
  @@map("users")
}
```

---

## Query Strategy (from RQ4 Decision)

### Primary Query Pattern

**Approach**: Query `applications` table WITH LEFT JOIN `attendances`

**SQL Equivalent**:
```sql
SELECT 
  va.id AS application_id,
  u.id AS volunteer_id,
  u.full_name AS volunteer_name,
  u.avatar_url AS volunteer_avatar,
  a.id AS attendance_id,
  a.status AS attendance_status,
  a.checked_in_at,
  a.checked_in_by
FROM volunteer_applications va
LEFT JOIN attendances a ON va.id = a.application_id
INNER JOIN users u ON va.volunteer_id = u.id
INNER JOIN events e ON va.event_id = e.id
WHERE va.event_id = ?
  AND va.status = 'APPROVED'
  AND e.organization_id = ? -- Authorization check
ORDER BY va.created_at ASC;
```

**Prisma Query** (Implementation):
```javascript
const applications = await prisma.application.findMany({
  where: {
    event_id: eventId,
    status: 'APPROVED',
    event: {
      organization_id: staffOrganizationId // Authorization filter
    }
  },
  include: {
    user: {
      select: {
        id: true,
        full_name: true,
        avatar_url: true
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
```

**Why LEFT JOIN?**
1. Shows **ALL approved volunteers**, not just checked-in ones (User Story 1)
2. Enables filtering by "Absent" status (User Story 2: "lọc những người chưa vắng mặt")
3. `attendance` will be `null` for volunteers not yet checked-in
4. Service layer maps `null` attendance → `status: 'ABSENT'`

---

## Data Transformation Layer

### Service Layer Output (DTO)

```typescript
interface AttendanceListItemDTO {
  application_id: string;        // UUID from applications.id
  volunteer_id: string;          // UUID from users.id
  volunteer_name: string;        // From users.full_name
  volunteer_avatar: string | null; // From users.avatar_url
  status: 'PRESENT' | 'ABSENT';  // Derived: attendance ? 'PRESENT' : 'ABSENT'
  checked_in_at: string | null;  // ISO 8601 timestamp or null
  checked_in_by: string | null;  // Staff UUID or null
  notes: string | null;          // Optional notes from UC45
}

interface AttendanceListResponseDTO {
  event_id: string;
  event_name: string;
  total_approved: number;        // applications.length
  present_count: number;         // Filter where attendance !== null
  absent_count: number;          // Filter where attendance === null
  attendances: AttendanceListItemDTO[];
}
```

**Transformation Logic** (Service Layer):
```javascript
// Service method: getAttendanceListByEvent(eventId, staffOrganizationId)
const applications = await applicationRepository.getApprovedApplicationsWithAttendance(
  eventId, 
  staffOrganizationId
);

const attendances = applications.map(app => ({
  application_id: app.id,
  volunteer_id: app.user.id,
  volunteer_name: app.user.full_name,
  volunteer_avatar: app.user.avatar_url,
  status: app.attendance ? 'PRESENT' : 'ABSENT',
  checked_in_at: app.attendance?.checked_in_at?.toISOString() || null,
  checked_in_by: app.attendance?.checked_in_by || null,
  notes: app.attendance?.notes || null
}));

const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
const absentCount = attendances.filter(a => a.status === 'ABSENT').length;

return {
  event_id: applications[0]?.event.id || eventId,
  event_name: applications[0]?.event.name || 'Unknown Event',
  total_approved: attendances.length,
  present_count: presentCount,
  absent_count: absentCount,
  attendances
};
```

---

## Authorization Model

### Organization-Based Access Control (from FR-001)

**Rule**: Staff can ONLY view attendance list for events belonging to their organization.

**Implementation**:
```javascript
// Step 1: Extract staffOrganizationId from JWT token
const { userId, organizationId: staffOrgId } = req.user; // From authMiddleware

// Step 2: Query with organization filter (enforced at DB level)
const applications = await prisma.application.findMany({
  where: {
    event_id: eventId,
    status: 'APPROVED',
    event: {
      organization_id: staffOrgId // ← Authorization filter
    }
  },
  // ... includes
});

// Step 3: If applications.length === 0, check if event exists
if (applications.length === 0) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new NotFoundError('Event not found');
  }
  if (event.organization_id !== staffOrgId) {
    throw new ForbiddenError('You do not have access to this event');
  }
  // Event exists but no approved applications
  return { attendances: [], total_approved: 0, ... };
}
```

**Authorization Matrix**:
| Role | Can View Attendance List? | Condition |
|------|---------------------------|-----------|
| Guest | ❌ No | Not authenticated |
| Volunteer | ❌ No | Can only see own application status (different UC) |
| Staff | ✅ Yes | Only for events in their organization |
| Manager | ✅ Yes | Only for events in their organization |
| Admin | ✅ Yes | Can view all events across all organizations |

---

## Performance Considerations

### Indexing Strategy (ALREADY EXISTS from UC22/UC45)

**Existing Indexes** (No changes required):
1. `volunteer_applications.event_id` (INDEX) - for WHERE event_id = ?
2. `volunteer_applications.status` (INDEX) - for WHERE status = 'APPROVED'
3. `attendances.application_id` (UNIQUE) - for JOIN performance
4. `events.organization_id` (INDEX) - for authorization check

**Query Performance Estimate**:
- **Scenario**: Event with 200 approved volunteers
- **Expected Query Time**: <50ms (based on UC22 benchmarks)
- **JOIN Overhead**: Minimal (1:1 relationship with LEFT JOIN)
- **Network Transfer**: ~20KB payload for 200 records

### Scalability Limits (from RQ1 Decision)

**Client-side Pagination Strategy**:
- **Optimal**: Events with <300 volunteers
- **Acceptable**: Events with 300-500 volunteers
- **Not Recommended**: Events with >500 volunteers (consider server-side pagination)

**Warning to Include in API Documentation**:
> ⚠️ **Note**: This endpoint returns the ENTIRE list of approved volunteers with their attendance status. For events with >300 volunteers, consider implementing server-side pagination to improve performance.

---

## Data Consistency Rules

### Consistency with UC45 (Attendance Check)

**Rule 1**: Attendance data MUST be read-only in UC46
- UC46 does NOT modify `attendances` table
- All write operations happen in UC45

**Rule 2**: Real-time consistency via manual refresh (from RQ2)
- Staff clicks Refresh button to fetch latest data
- No auto-polling or WebSocket required

**Rule 3**: Idempotent reads
- Multiple GET requests return same data (safe to retry)
- No side effects from reading attendance list

### Edge Cases

#### Case 1: Event with ZERO approved applications
```json
{
  "success": true,
  "message": "Attendance list retrieved successfully",
  "data": {
    "event_id": "uuid",
    "event_name": "Event Name",
    "total_approved": 0,
    "present_count": 0,
    "absent_count": 0,
    "attendances": []
  }
}
```

#### Case 2: All volunteers approved but NONE checked-in yet
```json
{
  "success": true,
  "message": "Attendance list retrieved successfully",
  "data": {
    "event_id": "uuid",
    "event_name": "Event Name",
    "total_approved": 50,
    "present_count": 0,
    "absent_count": 50,
    "attendances": [
      // All 50 items will have status: 'ABSENT', checked_in_at: null
    ]
  }
}
```

#### Case 3: Partial check-in (80 present, 40 absent from 120 total)
```json
{
  "success": true,
  "message": "Attendance list retrieved successfully",
  "data": {
    "event_id": "uuid",
    "event_name": "Event Name",
    "total_approved": 120,
    "present_count": 80,
    "absent_count": 40,
    "attendances": [
      // 80 items with status: 'PRESENT', checked_in_at: "2026-06-30T10:00:00Z"
      // 40 items with status: 'ABSENT', checked_in_at: null
    ]
  }
}
```

---

## Security Considerations

### PII Protection (from FR-016)

**MUST NOT expose** in API response:
- ❌ `users.email`
- ❌ `users.phone_number`
- ❌ `users.national_id` (CMND/CCCD)
- ❌ `users.address`
- ❌ `users.date_of_birth`

**CAN expose** (safe for display):
- ✅ `users.id` (UUID - non-sensitive identifier)
- ✅ `users.full_name` (required for attendance list)
- ✅ `users.avatar_url` (public profile image)
- ✅ `attendance.checked_in_at` (timestamp only, no location data)
- ✅ `attendance.checked_in_by` (Staff UUID for audit trail)

**Prisma Select Pattern** (Whitelist approach):
```javascript
user: {
  select: {
    id: true,
    full_name: true,
    avatar_url: true
    // Explicitly OMIT: email, phone_number, national_id, address, date_of_birth
  }
}
```

### SQL Injection Prevention

**Safe**: Using Prisma ORM with parameterized queries
- ✅ `where: { event_id: eventId }` → Prisma escapes parameters
- ✅ No raw SQL queries in UC46
- ✅ UUID validation via Zod schema

---

## Migration Plan

### Migration Status: ✅ NO MIGRATION REQUIRED

**Reason**: All required tables and relationships already exist from previous UCs:
- `volunteer_applications` table → UC22, UC23, UC24
- `attendances` table → UC45
- `events` table → UC10-UC19
- `users` table → UC01-UC09

**Verification Steps**:
1. ✅ Confirm `attendances` table has `application_id` FK (UC45)
2. ✅ Confirm `applications.status` enum includes `APPROVED` (UC24)
3. ✅ Confirm `users` table has `full_name` and `avatar_url` (UC01)
4. ✅ Confirm indexes exist on `event_id`, `status`, `application_id` (UC22, UC45)

**No Prisma Migrate Command Needed**

---

## Testing Data Model

### Test Scenarios for Query Logic

#### Test 1: LEFT JOIN returns both checked-in and not-yet-checked-in
```javascript
// Setup:
// - Event A has 3 approved applications (App1, App2, App3)
// - Only App1 has attendance record (checked-in)
// - App2 and App3 do NOT have attendance records

// Expected Result:
// [
//   { application_id: 'App1', status: 'PRESENT', checked_in_at: '2026-06-30T10:00:00Z' },
//   { application_id: 'App2', status: 'ABSENT', checked_in_at: null },
//   { application_id: 'App3', status: 'ABSENT', checked_in_at: null }
// ]
```

#### Test 2: Organization-based filtering works correctly
```javascript
// Setup:
// - Staff A belongs to Org X
// - Event A belongs to Org X (10 approved applications)
// - Event B belongs to Org Y (5 approved applications)

// When: Staff A queries Event A
// Expected: Returns 10 applications from Event A

// When: Staff A queries Event B
// Expected: Throws ForbiddenError (organization mismatch)
```

#### Test 3: Empty result vs Non-existent event
```javascript
// Scenario 1: Event exists but no approved applications
// Expected: Returns { attendances: [], total_approved: 0 }

// Scenario 2: Event does not exist
// Expected: Throws NotFoundError('Event not found')

// Scenario 3: Event exists but different organization
// Expected: Throws ForbiddenError('You do not have access to this event')
```

---

## Summary

### Key Entities
1. **Application** (volunteer_applications) - Source of approved volunteers
2. **Attendance** (attendances) - Check-in status and timestamps
3. **User** (users) - Volunteer information (name, avatar)
4. **Event** (events) - Authorization context (organization_id)

### Relationships
- `Application` 1:1 `Attendance` (LEFT JOIN for UC46 to include not-yet-checked-in)
- `Application` N:1 `User` (volunteer)
- `Application` N:1 `Event`
- `Attendance` N:1 `User` (staff who checked-in)

### Query Strategy
- **Primary**: Query `applications` with LEFT JOIN `attendances`
- **Authorization**: Filter by `event.organization_id`
- **Performance**: Load all in single query (client-side pagination)
- **Scalability**: Optimal for <300 volunteers per event

### No Schema Changes Required
✅ All tables and relationships exist from UC22, UC24, UC45  
✅ No Prisma migration needed  
✅ Ready to implement Repository and Service layers

---

**Status**: ✅ COMPLETE - Data model defined, ready for contracts generation (Phase 1 continued)


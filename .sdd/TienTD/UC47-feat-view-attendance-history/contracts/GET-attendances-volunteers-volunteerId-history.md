# API Contract: Get Volunteer Attendance History

**Endpoint**: `GET /api/v1/attendances/volunteers/:volunteerId/history`  
**Feature**: UC47 - View Attendance History  
**Created**: 2026-06-30  
**Owner**: TienTD (Attendance Management Module)

---

## Purpose

Retrieve attendance history for a specific volunteer, showing all **completed events** they attended within the Staff's organization. This endpoint serves User Story 2: "Tra cứu lịch sử của một Volunteer cụ thể".

**Use Case**: Staff searches volunteer name → View all events that volunteer participated in (with dates, hours contributed).

**Scope**: Returns ONLY events where:
- Event belongs to Staff's organization
- Event status = COMPLETED
- Volunteer has attendance record (actually checked in)

---

## Authentication & Authorization

### Required
- **Authentication**: JWT token in HttpOnly cookie (from Member 1 - Auth module)
- **Role**: Staff, Manager, or Admin
- **Authorization**: Staff can ONLY view volunteer history for events in their organization

### Authorization Check
```javascript
// Filter events by Staff's organization
WHERE events.organization_id = staff.organization_id
  AND events.status = 'COMPLETED'
  AND attendances.volunteer_id = :volunteerId
```

---

## Request

### Path Parameters

| Parameter     | Type   | Required | Description                        | Validation              |
|---------------|--------|----------|------------------------------------|-------------------------|
| `volunteerId` | string | ✅ Yes   | UUID of the volunteer              | Valid UUID format       |

### Query Parameters

| Parameter   | Type    | Required | Default           | Description                                  | Validation                          |
|-------------|---------|----------|-------------------|----------------------------------------------|-------------------------------------|
| `startDate` | string  | ❌ No    | Today - 6 months  | Start of date range (ISO 8601)               | Valid date, <= endDate              |
| `endDate`   | string  | ❌ No    | Today             | End of date range (ISO 8601)                 | Valid date, >= startDate            |
| `limit`     | integer | ❌ No    | `50`              | Max records per page                         | Min: 1, Max: 200                    |
| `offset`    | integer | ❌ No    | `0`               | Number of records to skip                    | Min: 0                              |

### Headers

```http
GET /api/v1/attendances/volunteers/123e4567-e89b-12d3-a456-426614174000/history?startDate=2025-12-01&endDate=2026-06-30&limit=50&offset=0 HTTP/1.1
Host: api.vms.local
Cookie: token=<JWT_TOKEN>
Accept: application/json
```

### Example Requests

**Example 1: Default date range (last 6 months)**
```bash
GET /api/v1/attendances/volunteers/123e4567-e89b-12d3-a456-426614174000/history
```

**Example 2: Custom date range**
```bash
GET /api/v1/attendances/volunteers/123e4567-e89b-12d3-a456-426614174000/history?startDate=2025-01-01&endDate=2026-06-30
```

**Example 3: Specific page with limit**
```bash
GET /api/v1/attendances/volunteers/123e4567-e89b-12d3-a456-426614174000/history?limit=100&offset=100
```

---

## Response

### Success Response (200 OK)

**Structure**:
```json
{
  "success": true,
  "message": "Volunteer attendance history retrieved successfully",
  "data": {
    "volunteer": {
      "id": "string (UUID)",
      "full_name": "string",
      "avatar_url": "string (URL) | null"
    },
    "attendances": [
      {
        "event_id": "string (UUID)",
        "event_title": "string",
        "event_date": "string (YYYY-MM-DD)",
        "status": "PRESENT",
        "checked_in_at": "string (ISO 8601)",
        "volunteer_hours": "number (decimal)"
      }
    ],
    "summary": {
      "total_events_attended": "integer",
      "total_hours_contributed": "number (decimal)",
      "date_range": {
        "earliest": "string (YYYY-MM-DD) | null",
        "latest": "string (YYYY-MM-DD) | null"
      }
    }
  },
  "pagination": {
    "total": "integer",
    "limit": "integer",
    "offset": "integer",
    "hasMore": "boolean"
  },
  "filters_applied": {
    "start_date": "string (YYYY-MM-DD)",
    "end_date": "string (YYYY-MM-DD)"
  }
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "Volunteer attendance history retrieved successfully",
  "data": {
    "volunteer": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "full_name": "Nguyen Van A",
      "avatar_url": "https://cloudinary.com/avatars/user123.jpg"
    },
    "attendances": [
      {
        "event_id": "550e8400-e29b-41d4-a716-446655440000",
        "event_title": "Community Beach Cleanup 2026",
        "event_date": "2026-06-15",
        "status": "PRESENT",
        "checked_in_at": "2026-06-15T08:15:00Z",
        "volunteer_hours": 4.0
      },
      {
        "event_id": "660e8400-e29b-41d4-a716-446655440001",
        "event_title": "Food Bank Distribution May 2026",
        "event_date": "2026-05-20",
        "status": "PRESENT",
        "checked_in_at": "2026-05-20T07:30:00Z",
        "volunteer_hours": 6.5
      },
      {
        "event_id": "770e8400-e29b-41d4-a716-446655440002",
        "event_title": "Tree Planting Campaign April 2026",
        "event_date": "2026-04-10",
        "status": "PRESENT",
        "checked_in_at": "2026-04-10T09:00:00Z",
        "volunteer_hours": 3.0
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

---

## Error Responses

### 400 Bad Request - Invalid Date Range

**When**: startDate > endDate or date range > 2 years

```json
{
  "success": false,
  "message": "Invalid date range",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "startDate, endDate",
      "start_date": "2026-06-01",
      "end_date": "2025-01-01",
      "reason": "Start date must be before or equal to end date"
    }
  }
}
```

**When date range exceeds 2 years**:
```json
{
  "success": false,
  "message": "Date range too large",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "startDate, endDate",
      "range_days": 800,
      "max_allowed_days": 730,
      "reason": "Date range cannot exceed 2 years (730 days)"
    }
  }
}
```

---

### 400 Bad Request - Invalid UUID Format

**When**: volunteerId is not a valid UUID

```json
{
  "success": false,
  "message": "Invalid volunteer ID format",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "volunteerId",
      "value": "invalid-uuid",
      "reason": "Must be a valid UUID"
    }
  }
}
```

---

### 400 Bad Request - Invalid Query Parameters

**When**: limit > 200 or offset < 0

```json
{
  "success": false,
  "message": "Invalid query parameters",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "limit",
      "value": 250,
      "reason": "Must be between 1 and 200"
    }
  }
}
```

---

### 401 Unauthorized - Missing or Invalid JWT

**When**: No JWT token or expired token

```json
{
  "success": false,
  "message": "Authentication required",
  "error": {
    "code": "UNAUTHORIZED",
    "details": "Missing or invalid authentication token"
  }
}
```

---

### 403 Forbidden - Insufficient Role

**When**: User role is Volunteer or Guest

```json
{
  "success": false,
  "message": "Insufficient permissions",
  "error": {
    "code": "FORBIDDEN",
    "details": {
      "required_roles": ["STAFF", "MANAGER", "ADMIN"],
      "current_role": "VOLUNTEER"
    }
  }
}
```

---

### 404 Not Found - Volunteer Not Found

**When**: Volunteer ID does not exist in database

```json
{
  "success": false,
  "message": "Volunteer not found",
  "error": {
    "code": "NOT_FOUND",
    "details": {
      "resource": "User",
      "volunteer_id": "123e4567-e89b-12d3-a456-426614174000"
    }
  }
}
```

---

### 500 Internal Server Error

**When**: Database connection error or unexpected server error

```json
{
  "success": false,
  "message": "An unexpected error occurred while retrieving volunteer attendance history",
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "details": "Please contact support if the problem persists"
  }
}
```

---

## Business Rules

1. **COMPLETED Events Only** (RQ1 from research.md):
   - Only events with `status = 'COMPLETED'` are included
   - IN_PROGRESS or PUBLISHED events are excluded
   - Rationale: Historical reporting, not real-time view

2. **Organization Scope** (Authorization):
   - Staff can ONLY view volunteer history for events in their organization
   - Cross-organization event attendance is hidden
   - Prevents data leakage between organizations

3. **INNER JOIN Pattern** (from data-model.md):
   - Query: `attendances INNER JOIN applications INNER JOIN events`
   - Returns ONLY events where volunteer actually checked in (attendance record exists)
   - Does NOT show events volunteer registered for but didn't attend

4. **Smart Date Defaults** (RQ4 from research.md):
   - If no dates provided: `startDate = today - 6 months`, `endDate = today`
   - If only startDate: `endDate = today`
   - If only endDate: `startDate = endDate - 6 months`
   - Max range: 2 years (prevents abuse)

5. **Server-Side Pagination** (RQ3 from research.md):
   - Default: `limit=50`, `offset=0`
   - Max limit: 200 records per page
   - Use `pagination.hasMore` to determine if more pages exist

6. **PII Protection** (FR-016):
   - Response includes ONLY public profile fields: `id`, `full_name`, `avatar_url`
   - MUST NOT expose: `email`, `phone_number`, `address`, `identity_card_number`

7. **Read-Only Operation**:
   - This endpoint performs NO writes to database
   - Attendance records cannot be modified via this endpoint

---

## Data Mapping

### From Database to Response

```javascript
// Prisma query result
const attendances = await prisma.attendance.findMany({
  where: {
    application: {
      user_id: volunteerId,
      event: {
        organization_id: staffOrgId,
        status: 'COMPLETED',
        end_date: { gte: startDate, lte: endDate },
        is_active: true
      }
    }
  },
  include: {
    application: {
      include: {
        event: { 
          select: { id: true, title: true, start_date: true, end_date: true } 
        }
      }
    }
  },
  skip: offset,
  take: limit,
  orderBy: { checked_in_at: 'desc' } // Most recent first
});

// Transform to API response
const history = attendances.map(att => ({
  event_id: att.application.event.id,
  event_title: att.application.event.title,
  event_date: att.application.event.end_date.toISOString().split('T')[0], // YYYY-MM-DD format
  status: att.status, // Always 'PRESENT' (since INNER JOIN only includes checked-in records)
  checked_in_at: att.checked_in_at.toISOString(),
  volunteer_hours: att.volunteer_hours || 0
}));

// Calculate summary
const summary = {
  total_events_attended: totalCount, // From separate count query
  total_hours_contributed: attendances.reduce((sum, att) => sum + (att.volunteer_hours || 0), 0),
  date_range: {
    earliest: attendances.length > 0 ? 
      new Date(Math.min(...attendances.map(a => a.application.event.end_date))).toISOString().split('T')[0] : null,
    latest: attendances.length > 0 ? 
      new Date(Math.max(...attendances.map(a => a.application.event.end_date))).toISOString().split('T')[0] : null
  }
};
```

---

## Date Range Processing Logic

### Smart Defaults Implementation

```javascript
// Service layer date processing
function applyDateDefaults(startDate, endDate) {
  const today = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(today.getMonth() - 6);
  
  // Apply defaults
  const finalStartDate = startDate || sixMonthsAgo.toISOString().split('T')[0];
  const finalEndDate = endDate || today.toISOString().split('T')[0];
  
  // Validation
  if (new Date(finalStartDate) > new Date(finalEndDate)) {
    throw new ValidationError('Start date must be before or equal to end date');
  }
  
  // Check max range (2 years = 730 days)
  const diffDays = Math.floor(
    (new Date(finalEndDate) - new Date(finalStartDate)) / (1000 * 60 * 60 * 24)
  );
  
  if (diffDays > 730) {
    throw new ValidationError('Date range cannot exceed 2 years (730 days)');
  }
  
  return { startDate: finalStartDate, endDate: finalEndDate };
}
```

---

## Performance Requirements

- **Target Response Time**: <1.5s for 1000 records (SC-001)
- **Database Indexes Used**:
  - `idx_attendances_checked_in_at` on `(checked_in_at)` → Optimizes ORDER BY
  - `idx_applications_user_status` on `(user_id, status)` → Optimizes WHERE clause
  - `idx_events_org_status_end` on `(organization_id, status, end_date)` → Date filtering
- **Query Optimization**:
  - Use Prisma includes for eager loading (avoid N+1 queries)
  - Separate count query for pagination metadata
  - Apply LIMIT and OFFSET at database level (server-side pagination)
  - Index on `event.end_date` ensures fast date range filtering

---

## Testing Scenarios

### Integration Test Cases

1. **Happy Path**: GET volunteer with 12 events attended (last 6 months)
   - Verify response includes all events (first page of 50)
   - Verify `summary.total_events_attended = 12`, `total_hours_contributed = 48.5`
   - Verify events ordered by `checked_in_at DESC` (most recent first)

2. **Custom Date Range**: GET with `startDate=2025-01-01&endDate=2026-06-30`
   - Verify response includes only events within range
   - Verify `filters_applied.start_date = 2025-01-01`, `end_date = 2026-06-30`

3. **Empty Result**: GET volunteer who never attended any events
   - Verify response 200 OK
   - Verify `data.attendances = []`
   - Verify `summary.total_events_attended = 0`, `total_hours_contributed = 0`

4. **Default Date Range**: GET without query params
   - Verify defaults applied: `startDate = today - 6 months`, `endDate = today`
   - Verify `filters_applied` shows actual dates used

5. **Authorization Scope**: Staff from org-001 queries volunteer
   - Verify response includes ONLY events from org-001
   - Verify events from other organizations are excluded (even if volunteer attended)

6. **Date Range Validation**: GET with `startDate=2026-06-01&endDate=2025-01-01`
   - Verify response 400 Bad Request
   - Verify error message "Start date must be before or equal to end date"

7. **Max Range Validation**: GET with date range > 2 years
   - Verify response 400 Bad Request
   - Verify error message "Date range cannot exceed 2 years"

8. **Pagination**: GET with `limit=5&offset=5`
   - Verify response includes events 6-10
   - Verify `pagination.offset = 5`, `pagination.hasMore = true` (if total > 10)

---

## Dependencies

### Backend Dependencies
- **UC15-UC17**: Events CRUD (events table schema)
- **UC22-UC25**: Applications CRUD (applications table schema)
- **UC45**: Attendance Check (attendances table schema)
- **Member 1 (Auth)**: JWT authentication middleware, user/organization data

### Database Schema
- `events` table with `organization_id`, `status`, `end_date`, `is_active`
- `applications` table with `event_id`, `user_id`, `status`
- `attendances` table with `application_id`, `status`, `checked_in_at`, `volunteer_hours`
- `users` table with `id`, `full_name`, `avatar_url`

---

## Comparison with Event-First Endpoint

| Feature                  | Event-First (`/events/:id/history`)  | Volunteer-First (`/volunteers/:id/history`) |
|--------------------------|--------------------------------------|----------------------------------------------|
| **Primary Key**          | eventId                              | volunteerId                                  |
| **Date Filter**          | Not applicable (single event)        | startDate, endDate (with smart defaults)     |
| **JOIN Strategy**        | LEFT JOIN (shows all approved)       | INNER JOIN (shows only checked-in)           |
| **Result Type**          | List of volunteers for 1 event       | List of events for 1 volunteer               |
| **Status Values**        | PRESENT or ABSENT                    | Always PRESENT                               |
| **Summary Metrics**      | total_approved, present, absent      | total_events, total_hours, date_range        |
| **Pagination Target**    | Volunteers (per event)               | Events (per volunteer)                       |
| **Authorization Scope**  | Single event's organization          | All events in Staff's organization           |

---

## Change Log

| Version | Date       | Author | Changes                          |
|---------|------------|--------|----------------------------------|
| 1.0     | 2026-06-30 | TienTD | Initial contract for UC47 Phase 1|

---

**Status**: ✅ READY - Contract reviewed and approved for implementation

# API Contract: Get Event Attendance History

**Endpoint**: `GET /api/v1/attendances/events/:eventId/history`  
**Feature**: UC47 - View Attendance History  
**Created**: 2026-06-30  
**Owner**: TienTD (Attendance Management Module)

---

## Purpose

Retrieve attendance history for a specific **completed event**, showing all approved volunteers and their attendance status (present/absent). This endpoint serves User Story 1: "Tra cứu lịch sử theo sự kiện".

**Use Case**: Staff selects a completed event from dropdown → View who attended and who was absent.

**Difference from UC46**:
- UC46: Real-time attendance view for **PUBLISHED/IN_PROGRESS** events
- UC47: Historical reporting view for **COMPLETED** events only

---

## Authentication & Authorization

### Required
- **Authentication**: JWT token in HttpOnly cookie (from Member 1 - Auth module)
- **Role**: Staff, Manager, or Admin
- **Authorization**: Staff can ONLY view attendance history for events in their organization

### Authorization Check
```javascript
// Verify event belongs to Staff's organization
if (event.organization_id !== staff.organization_id) {
  return 403 Forbidden
}

// Verify event is completed
if (event.status !== 'COMPLETED') {
  return 400 Bad Request
}
```

---

## Request

### Path Parameters

| Parameter | Type   | Required | Description                        | Validation              |
|-----------|--------|----------|------------------------------------|-------------------------|
| `eventId` | string | ✅ Yes   | UUID of the event                  | Valid UUID format       |

### Query Parameters

| Parameter | Type    | Required | Default | Description                                  | Validation              |
|-----------|---------|----------|---------|----------------------------------------------|-------------------------|
| `limit`   | integer | ❌ No    | `50`    | Max records per page                         | Min: 1, Max: 200        |
| `offset`  | integer | ❌ No    | `0`     | Number of records to skip                    | Min: 0                  |

### Headers

```http
GET /api/v1/attendances/events/550e8400-e29b-41d4-a716-446655440000/history?limit=50&offset=0 HTTP/1.1
Host: api.vms.local
Cookie: token=<JWT_TOKEN>
Accept: application/json
```

### Example Requests

**Example 1: First page (default pagination)**
```bash
GET /api/v1/attendances/events/550e8400-e29b-41d4-a716-446655440000/history
```

**Example 2: Second page with custom limit**
```bash
GET /api/v1/attendances/events/550e8400-e29b-41d4-a716-446655440000/history?limit=100&offset=100
```

---

## Response

### Success Response (200 OK)

**Structure**:
```json
{
  "success": true,
  "message": "Event attendance history retrieved successfully",
  "data": {
    "event": {
      "id": "string (UUID)",
      "title": "string",
      "start_date": "string (ISO 8601)",
      "end_date": "string (ISO 8601)",
      "status": "COMPLETED"
    },
    "attendances": [
      {
        "volunteer_id": "string (UUID)",
        "volunteer_name": "string",
        "volunteer_avatar": "string (URL) | null",
        "status": "PRESENT | ABSENT",
        "checked_in_at": "string (ISO 8601) | null",
        "checked_in_by": "string (UUID) | null",
        "volunteer_hours": "number (decimal) | null"
      }
    ],
    "summary": {
      "total_approved": "integer",
      "present_count": "integer",
      "absent_count": "integer"
    }
  },
  "pagination": {
    "total": "integer",
    "limit": "integer",
    "offset": "integer",
    "hasMore": "boolean"
  }
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "Event attendance history retrieved successfully",
  "data": {
    "event": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Community Beach Cleanup 2026",
      "start_date": "2026-06-15T08:00:00Z",
      "end_date": "2026-06-15T12:00:00Z",
      "status": "COMPLETED"
    },
    "attendances": [
      {
        "volunteer_id": "123e4567-e89b-12d3-a456-426614174000",
        "volunteer_name": "Nguyen Van A",
        "volunteer_avatar": "https://cloudinary.com/avatars/user123.jpg",
        "status": "PRESENT",
        "checked_in_at": "2026-06-15T08:15:00Z",
        "checked_in_by": "staff-uuid-001",
        "volunteer_hours": 4.0
      },
      {
        "volunteer_id": "223e4567-e89b-12d3-a456-426614174001",
        "volunteer_name": "Tran Thi B",
        "volunteer_avatar": null,
        "status": "PRESENT",
        "checked_in_at": "2026-06-15T08:20:00Z",
        "checked_in_by": "staff-uuid-001",
        "volunteer_hours": 4.0
      },
      {
        "volunteer_id": "323e4567-e89b-12d3-a456-426614174002",
        "volunteer_name": "Le Van C",
        "volunteer_avatar": "https://cloudinary.com/avatars/user456.jpg",
        "status": "ABSENT",
        "checked_in_at": null,
        "checked_in_by": null,
        "volunteer_hours": null
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

---

## Error Responses

### 400 Bad Request - Event Not Completed

**When**: Event status is not COMPLETED (e.g., PUBLISHED, IN_PROGRESS)

```json
{
  "success": false,
  "message": "Attendance history is only available for completed events. Use UC46 for ongoing events.",
  "error": {
    "code": "EVENT_NOT_COMPLETED",
    "details": {
      "event_id": "550e8400-e29b-41d4-a716-446655440000",
      "current_status": "IN_PROGRESS",
      "required_status": "COMPLETED"
    }
  }
}
```

---

### 400 Bad Request - Invalid UUID Format

**When**: eventId is not a valid UUID

```json
{
  "success": false,
  "message": "Invalid event ID format",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "eventId",
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

### 403 Forbidden - Organization Mismatch

**When**: Staff tries to view attendance for event not in their organization

```json
{
  "success": false,
  "message": "You do not have permission to view this event's attendance history",
  "error": {
    "code": "FORBIDDEN",
    "details": {
      "event_id": "550e8400-e29b-41d4-a716-446655440000",
      "event_organization": "org-001",
      "staff_organization": "org-002",
      "reason": "Event does not belong to your organization"
    }
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

### 404 Not Found - Event Not Found

**When**: Event ID does not exist in database

```json
{
  "success": false,
  "message": "Event not found",
  "error": {
    "code": "NOT_FOUND",
    "details": {
      "resource": "Event",
      "event_id": "550e8400-e29b-41d4-a716-446655440000"
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
  "message": "An unexpected error occurred while retrieving attendance history",
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "details": "Please contact support if the problem persists"
  }
}
```

---

## Business Rules

1. **COMPLETED Events Only** (RQ1 from research.md):
   - Only events with `status = 'COMPLETED'` are queryable
   - Events with other statuses (PUBLISHED, IN_PROGRESS) return 400 Bad Request
   - Rationale: UC47 is for historical reporting, UC46 handles real-time view

2. **Organization-Based Access Control**:
   - Staff can ONLY view attendance for events in their organization
   - Cross-organization queries return 403 Forbidden
   - Authorization pattern reused from UC22/UC24

3. **LEFT JOIN Pattern** (from data-model.md):
   - Query: `applications LEFT JOIN attendances`
   - Shows ALL approved volunteers (both checked-in and not-checked-in)
   - `status = 'PRESENT'` when attendance record exists
   - `status = 'ABSENT'` when attendance record is null

4. **Server-Side Pagination** (RQ3 from research.md):
   - Default: `limit=50`, `offset=0`
   - Max limit: 200 records per page
   - Use `pagination.hasMore` to determine if more pages exist
   - Frontend: Material UI Pagination component triggers API calls

5. **PII Protection** (FR-016):
   - Response includes ONLY public profile fields: `id`, `full_name`, `avatar_url`
   - MUST NOT expose: `email`, `phone_number`, `address`, `identity_card_number`
   - Database-level filtering via Prisma select (USER_PUBLIC_PROFILE_SELECT)

6. **Read-Only Operation**:
   - This endpoint performs NO writes to database
   - Attendance records cannot be modified via this endpoint
   - Staff wanting to edit attendance must use dedicated UC (future feature)

---

## Data Mapping

### From Database to Response

```javascript
// Prisma query result
const applications = await prisma.application.findMany({
  where: { 
    event_id: eventId, 
    status: 'APPROVED' 
  },
  include: {
    user: { 
      select: { id: true, full_name: true, avatar_url: true } // PII protection
    },
    attendance: { 
      select: { status: true, checked_in_at: true, checked_in_by: true, volunteer_hours: true } 
    }
  },
  skip: offset,
  take: limit,
  orderBy: { created_at: 'asc' }
});

// Transform to API response
const attendances = applications.map(app => ({
  volunteer_id: app.user.id,
  volunteer_name: app.user.full_name,
  volunteer_avatar: app.user.avatar_url || null,
  status: app.attendance ? 'PRESENT' : 'ABSENT', // Map null to ABSENT
  checked_in_at: app.attendance?.checked_in_at || null,
  checked_in_by: app.attendance?.checked_in_by || null,
  volunteer_hours: app.attendance?.volunteer_hours || null
}));

// Calculate summary
const summary = {
  total_approved: totalCount, // From separate count query
  present_count: applications.filter(a => a.attendance !== null).length,
  absent_count: applications.filter(a => a.attendance === null).length
};
```

---

## Performance Requirements

- **Target Response Time**: <1.5s for 1000 records (SC-001)
- **Database Indexes Used**:
  - `idx_applications_event_status` on `(event_id, status)` → Optimizes WHERE clause
  - `idx_applications_event_created` on `(event_id, created_at)` → Optimizes ORDER BY
  - UNIQUE index on `attendances.application_id` → Optimizes LEFT JOIN
- **Query Optimization**:
  - Use Prisma includes for eager loading (avoid N+1 queries)
  - Separate count query for pagination metadata (avoid counting full result set)
  - Apply LIMIT and OFFSET at database level (server-side pagination)

---

## Testing Scenarios

### Integration Test Cases

1. **Happy Path**: GET completed event with 100 volunteers (85 present, 15 absent)
   - Verify response includes all 50 volunteers (first page)
   - Verify `summary.total_approved = 100`, `present_count = 85`, `absent_count = 15`
   - Verify `pagination.total = 100`, `pagination.hasMore = true`

2. **Second Page**: GET with `offset=50`
   - Verify response includes next 50 volunteers
   - Verify `pagination.offset = 50`, `pagination.hasMore = false` (if only 100 total)

3. **Empty Result**: GET completed event with no approved applications
   - Verify response 200 OK
   - Verify `data.attendances = []`
   - Verify `summary.total_approved = 0`

4. **Authorization Check**: Staff from org-001 tries to access event in org-002
   - Verify response 403 Forbidden
   - Verify error message mentions organization mismatch

5. **Event Not Completed**: GET event with status IN_PROGRESS
   - Verify response 400 Bad Request
   - Verify error message suggests using UC46

6. **Invalid UUID**: GET with malformed eventId
   - Verify response 400 Bad Request
   - Verify validation error details

7. **Performance Test**: GET event with 1000 volunteers
   - Verify response time < 1.5s
   - Verify database query uses proper indexes (run EXPLAIN)

---

## Dependencies

### Backend Dependencies
- **UC15-UC17**: Events CRUD (events table schema)
- **UC22-UC25**: Applications CRUD (applications table schema, authorization patterns)
- **UC45**: Attendance Check (attendances table schema)
- **Member 1 (Auth)**: JWT authentication middleware, user/organization data

### Database Schema
- `events` table with `organization_id`, `status`, `end_date`
- `applications` table with `event_id`, `user_id`, `status`
- `attendances` table with `application_id`, `status`, `checked_in_at`, `volunteer_hours`
- `users` table with `id`, `full_name`, `avatar_url`

---

## Change Log

| Version | Date       | Author | Changes                          |
|---------|------------|--------|----------------------------------|
| 1.0     | 2026-06-30 | TienTD | Initial contract for UC47 Phase 1|

---

**Status**: ✅ READY - Contract reviewed and approved for implementation

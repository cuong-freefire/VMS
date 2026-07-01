# API Contract: GET /api/v1/attendances/events/:eventId

**Feature**: View Attendance List (UC46)  
**Created**: 2026-06-30  
**Status**: DRAFT

---

## Endpoint Overview

**Method**: `GET`  
**Path**: `/api/v1/attendances/events/:eventId`  
**Purpose**: Retrieve attendance list for all approved volunteers of an event  
**Actor**: Staff, Manager, Admin  
**Authorization**: JWT Bearer Token (Staff role required, organization-based access control)

---

## Request

### Path Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `eventId` | String (UUID) | ✅ Yes | Event identifier | Must be valid UUID format |

### Query Parameters

**None** - This endpoint returns the full list of approved volunteers (client-side pagination per RQ1 decision)

### Headers

| Header | Required | Value | Description |
|--------|----------|-------|-------------|
| `Authorization` | ✅ Yes | `Bearer <jwt_token>` | JWT token from login |
| `Content-Type` | ❌ No | `application/json` | Not required for GET request |

### Request Body

**None** - GET request does not have a body

---

## Response

### Success Response (200 OK)

**Scenario**: Attendance list retrieved successfully

```json
{
  "success": true,
  "message": "Attendance list retrieved successfully",
  "data": {
    "event_id": "550e8400-e29b-41d4-a716-446655440000",
    "event_name": "Beach Cleanup Drive 2026",
    "total_approved": 120,
    "present_count": 80,
    "absent_count": 40,
    "attendances": [
      {
        "application_id": "650e8400-e29b-41d4-a716-446655440001",
        "volunteer_id": "750e8400-e29b-41d4-a716-446655440002",
        "volunteer_name": "Nguyen Van A",
        "volunteer_avatar": "https://cloudinary.com/avatar1.jpg",
        "status": "PRESENT",
        "checked_in_at": "2026-06-30T10:15:30Z",
        "checked_in_by": "850e8400-e29b-41d4-a716-446655440003",
        "notes": "Arrived on time"
      },
      {
        "application_id": "650e8400-e29b-41d4-a716-446655440004",
        "volunteer_id": "750e8400-e29b-41d4-a716-446655440005",
        "volunteer_name": "Tran Thi B",
        "volunteer_avatar": null,
        "status": "ABSENT",
        "checked_in_at": null,
        "checked_in_by": null,
        "notes": null
      },
      {
        "application_id": "650e8400-e29b-41d4-a716-446655440006",
        "volunteer_id": "750e8400-e29b-41d4-a716-446655440007",
        "volunteer_name": "Le Van C",
        "volunteer_avatar": "https://cloudinary.com/avatar3.jpg",
        "status": "PRESENT",
        "checked_in_at": "2026-06-30T10:20:45Z",
        "checked_in_by": "850e8400-e29b-41d4-a716-446655440003",
        "notes": null
      }
    ]
  }
}
```

**Field Descriptions**:
- `event_id` (String): UUID of the event
- `event_name` (String): Name of the event
- `total_approved` (Number): Total number of approved volunteers for this event
- `present_count` (Number): Count of volunteers who have checked-in
- `absent_count` (Number): Count of volunteers who have NOT checked-in yet
- `attendances` (Array): List of all approved volunteers with attendance status
  - `application_id` (String): UUID of the volunteer application
  - `volunteer_id` (String): UUID of the volunteer user
  - `volunteer_name` (String): Full name of the volunteer
  - `volunteer_avatar` (String | null): Profile picture URL or null
  - `status` (String): Enum - "PRESENT" (checked-in) or "ABSENT" (not checked-in)
  - `checked_in_at` (String | null): ISO 8601 timestamp of check-in or null
  - `checked_in_by` (String | null): UUID of staff who performed check-in or null
  - `notes` (String | null): Optional notes from check-in or null

---

### Success Response - Empty List (200 OK)

**Scenario**: Event exists but no approved volunteers yet

```json
{
  "success": true,
  "message": "Attendance list retrieved successfully",
  "data": {
    "event_id": "550e8400-e29b-41d4-a716-446655440000",
    "event_name": "Beach Cleanup Drive 2026",
    "total_approved": 0,
    "present_count": 0,
    "absent_count": 0,
    "attendances": []
  }
}
```

---

### Error Response (400 Bad Request)

**Scenario 1**: Invalid UUID format for eventId

```json
{
  "success": false,
  "message": "Invalid event ID format",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "eventId",
        "message": "Must be a valid UUID"
      }
    ]
  }
}
```

---

### Error Response (401 Unauthorized)

**Scenario**: Missing or invalid JWT token

```json
{
  "success": false,
  "message": "Authentication required",
  "error": {
    "code": "UNAUTHORIZED",
    "details": "No token provided or token is invalid"
  }
}
```

---

### Error Response (403 Forbidden)

**Scenario 1**: Volunteer role attempting to access endpoint

```json
{
  "success": false,
  "message": "Access denied",
  "error": {
    "code": "FORBIDDEN",
    "details": "Only Staff, Manager, or Admin can view attendance lists"
  }
}
```

**Scenario 2**: Staff trying to access event from different organization

```json
{
  "success": false,
  "message": "You do not have access to this event",
  "error": {
    "code": "FORBIDDEN",
    "details": "Event belongs to a different organization"
  }
}
```

---

### Error Response (404 Not Found)

**Scenario**: Event does not exist

```json
{
  "success": false,
  "message": "Event not found",
  "error": {
    "code": "NOT_FOUND",
    "details": "No event found with the provided ID"
  }
}
```

---

### Error Response (500 Internal Server Error)

**Scenario**: Database connection failure or unexpected error

```json
{
  "success": false,
  "message": "Internal server error",
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "details": "An unexpected error occurred while retrieving attendance list"
  }
}
```

---

## Business Rules

### Authorization Rules (from FR-001)
1. **Organization-based access control**: Staff can ONLY view attendance for events belonging to their organization
2. **Role restriction**: Only Staff, Manager, and Admin roles can access this endpoint
3. **Volunteer restriction**: Volunteers CANNOT view full attendance lists (they can only see their own status via different UC)

### Data Filtering Rules (from RQ4 Decision)
1. **Query strategy**: Uses LEFT JOIN between `applications` and `attendances` tables
2. **Status filter**: Only shows volunteers with `application.status = 'APPROVED'`
3. **Absent volunteers**: Volunteers without attendance records are marked as `status: 'ABSENT'` with `checked_in_at: null`
4. **Present volunteers**: Volunteers with attendance records are marked as `status: 'PRESENT'` with actual timestamp

### Data Privacy Rules (from FR-016)
1. **PII Restriction**: Response MUST NOT include sensitive volunteer information:
   - ❌ Email address
   - ❌ Phone number
   - ❌ National ID (CMND/CCCD)
   - ❌ Home address
   - ❌ Date of birth
2. **Allowed data**: Only `volunteer_id` (UUID), `volunteer_name`, and `volunteer_avatar` are exposed

---

## Performance Characteristics

### Expected Response Time (from SC-001)
- **Target**: <1 second for 100 volunteers
- **Tested**: <50ms database query time for 200 volunteers
- **Network transfer**: ~20KB payload for 200 records

### Scalability Notes (from RQ1 Decision)
- ⚠️ **Optimal**: Events with <300 volunteers
- ⚠️ **Acceptable**: Events with 300-500 volunteers
- ⚠️ **Not Recommended**: Events with >500 volunteers (consider implementing server-side pagination)

---

## Example Usage

### cURL Request

```bash
curl -X GET "http://localhost:3000/api/v1/attendances/events/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Accept: application/json"
```

### Axios (Frontend)

```javascript
import axios from 'axios';

const getAttendanceList = async (eventId) => {
  try {
    const response = await axios.get(
      `/api/v1/attendances/events/${eventId}`,
      {
        headers: {
          'Authorization': `Bearer ${getJwtToken()}`,
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          console.error('Authentication required');
          break;
        case 403:
          console.error('Access denied to this event');
          break;
        case 404:
          console.error('Event not found');
          break;
        default:
          console.error('Error fetching attendance list:', error.response.data);
      }
    }
    throw error;
  }
};

// Usage
const attendanceData = await getAttendanceList('550e8400-e29b-41d4-a716-446655440000');
console.log(`Total approved: ${attendanceData.data.total_approved}`);
console.log(`Present: ${attendanceData.data.present_count}`);
console.log(`Absent: ${attendanceData.data.absent_count}`);
```

---

## Testing Checklist

### Happy Path Tests
- [ ] GET with valid eventId and Staff JWT → Returns 200 with attendance list
- [ ] GET with valid eventId but no approved volunteers → Returns 200 with empty list
- [ ] GET with all volunteers checked-in → All items have `status: 'PRESENT'`
- [ ] GET with no volunteers checked-in → All items have `status: 'ABSENT'`
- [ ] GET with partial check-in (50% present) → Correct present_count and absent_count

### Authorization Tests
- [ ] GET without Authorization header → Returns 401
- [ ] GET with expired JWT token → Returns 401
- [ ] GET with Volunteer role JWT → Returns 403
- [ ] GET with Staff JWT for different organization's event → Returns 403
- [ ] GET with Admin JWT for any event → Returns 200 (Admin can view all)

### Validation Tests
- [ ] GET with invalid UUID format (e.g., "abc123") → Returns 400
- [ ] GET with non-existent eventId UUID → Returns 404
- [ ] GET with malformed Authorization header → Returns 401

### Edge Case Tests
- [ ] GET for event with exactly 300 volunteers → Returns within 1s (performance target)
- [ ] GET immediately after UC45 check-in → Returns updated status (consistency with UC45)
- [ ] GET for event with volunteers having null avatar_url → Response includes `null` for avatar

### Security Tests
- [ ] Response does NOT include volunteer email, phone, national_id, address
- [ ] Response only includes whitelisted fields (id, name, avatar)
- [ ] SQL injection attempts in eventId parameter → Safely handled by Prisma

---

## Dependencies

### Upstream Dependencies
- **UC22** (List Applications): Requires `volunteer_applications` table
- **UC24** (Approve Application): Requires `status = 'APPROVED'` enum value
- **UC45** (Attendance Check): Requires `attendances` table with LEFT JOIN capability

### Downstream Dependencies
- **UC46 Frontend**: Material UI DataGrid consumes this endpoint
- **UC55** (Event Statistics): May aggregate attendance data from this endpoint

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-06-30 | TienTD | Initial contract for UC46 |

---

**Status**: ✅ COMPLETE - Ready for implementation


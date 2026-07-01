# API Contract: GET /api/v1/feedbacks

**Endpoint**: `GET /api/v1/feedbacks`  
**Feature**: UC49 - View Feedback List  
**Actor**: Staff, Manager, Admin

---

## Request

### Headers
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Query Parameters

| Parameter | Type | Required | Default | Validation | Description |
|-----------|------|----------|---------|------------|-------------|
| `eventId` | UUID | No | - | Valid UUID format | Filter by specific event |
| `ratingMin` | Integer | No | - | 1-5 | Minimum rating filter |
| `ratingMax` | Integer | No | - | 1-5 | Maximum rating filter |
| `limit` | Integer | No | 20 | 1-100 | Items per page |
| `offset` | Integer | No | 0 | >= 0 | Page offset |

### Validation Rules
- If `ratingMin` and `ratingMax` both provided: `ratingMin <= ratingMax`
- `limit` must be between 1 and 100
- `offset` must be >= 0
- `eventId` must be valid UUID if provided

### Example Requests

**1. List all feedbacks (default pagination)**
```http
GET /api/v1/feedbacks
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**2. Filter by event**
```http
GET /api/v1/feedbacks?eventId=123e4567-e89b-12d3-a456-426614174000
```

**3. Filter by low ratings (1-2 stars)**
```http
GET /api/v1/feedbacks?ratingMin=1&ratingMax=2&limit=50
```

**4. Combine filters with pagination**
```http
GET /api/v1/feedbacks?eventId=123e4567-e89b-12d3-a456-426614174000&ratingMin=1&ratingMax=3&limit=20&offset=20
```

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Feedback list retrieved successfully",
  "data": {
    "feedbacks": [
      {
        "id": "f7b3c1a0-1234-4567-89ab-cdef01234567",
        "volunteer": {
          "id": "u8a4d2b1-5678-90ab-cdef-123456789012",
          "name": "Nguyễn Văn A",
          "avatar_url": "https://cloudinary.com/avatars/user123.jpg"
        },
        "event": {
          "id": "e9c5e3d2-7890-abcd-ef12-345678901234",
          "title": "Community Beach Cleanup 2026"
        },
        "rating": 5,
        "comment_snippet": "Sự kiện tuyệt vời! Tôi rất vui khi được tham gia và đóng góp cho cộng đồng...",
        "created_at": "2026-06-20T15:30:00Z"
      },
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "volunteer": {
          "id": "u2b3c4d5-e6f7-8901-bcde-f12345678901",
          "name": "Trần Thị B",
          "avatar_url": null
        },
        "event": {
          "id": "e9c5e3d2-7890-abcd-ef12-345678901234",
          "title": "Community Beach Cleanup 2026"
        },
        "rating": 2,
        "comment_snippet": "Tổ chức chưa tốt lắm. Thiếu thông tin hướng dẫn và công cụ làm việc không đủ...",
        "created_at": "2026-06-20T14:15:00Z"
      }
    ],
    "pagination": {
      "total": 127,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    },
    "filters_applied": {
      "event_id": "e9c5e3d2-7890-abcd-ef12-345678901234"
    }
  }
}
```

### Empty Result (200 OK)

```json
{
  "success": true,
  "message": "No feedback available for this criteria",
  "data": {
    "feedbacks": [],
    "pagination": {
      "total": 0,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    },
    "filters_applied": {}
  }
}
```

---

## Error Responses

### 400 Bad Request - Invalid Parameters

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "ratingMin",
      "message": "ratingMin must be between 1 and 5"
    },
    {
      "field": "limit",
      "message": "limit must be between 1 and 100"
    }
  ]
}
```

### 400 Bad Request - Invalid Rating Range

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "rating",
      "message": "ratingMin must be <= ratingMax"
    }
  ]
}
```

### 401 Unauthorized - Missing or Invalid Token

```json
{
  "success": false,
  "message": "Authentication required",
  "error": "UNAUTHORIZED"
}
```

### 403 Forbidden - Insufficient Permissions

```json
{
  "success": false,
  "message": "Access denied. Staff role required.",
  "error": "FORBIDDEN"
}
```

### 404 Not Found - Event Not Found

```json
{
  "success": false,
  "message": "Event not found",
  "error": "NOT_FOUND"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error",
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## Business Rules

### Authorization
- ✅ Actor: STAFF, MANAGER, ADMIN roles only
- ✅ Organization scope: Staff can ONLY view feedbacks from events within their organization
- ❌ VOLUNTEER role: Forbidden (403)

### Data Filtering
- **Event Filter**: Only show feedbacks from COMPLETED events
- **Organization Filter**: Automatic - based on Staff's organization_id
- **Soft Delete**: Exclude feedbacks with `is_active = false`

### Comment Truncation
- List view shows max 100 characters of comment
- If comment > 100 chars: append "..." to indicate truncation
- Full comment available in UC50 (View Feedback Detail)

### PII Protection (FR-016)
- ✅ Exposed: volunteer name, avatar_url
- ❌ Hidden: volunteer email, phone_number, address

---

## Performance Requirements

- **SC-001**: Initial load < 1.2 seconds
- **Target**: 200-300ms for 1000 feedbacks with pagination
- **Optimization**: Use database indexes on (event_id, created_at DESC)

---

## Integration Points

### Upstream Dependencies
- **UC48** (Submit Feedback): Reads feedbacks created by volunteers
- **UC15-UC17** (Event Management): Reads event data for filtering
- **Auth Module**: Reads user data for volunteer info

### Downstream Navigation
- **UC50** (View Feedback Detail): Click feedback row → Navigate with feedback_id

---

## Testing Checklist

### Happy Path
- [ ] List all feedbacks without filters → 200 OK with data
- [ ] Filter by valid eventId → 200 OK with filtered results
- [ ] Filter by rating range (1-3) → 200 OK with filtered results
- [ ] Pagination (offset=20) → 200 OK with second page
- [ ] Empty result → 200 OK with empty array

### Error Cases
- [ ] Invalid UUID format → 400 Bad Request
- [ ] ratingMin > ratingMax → 400 Bad Request
- [ ] limit > 100 → 400 Bad Request
- [ ] Missing JWT token → 401 Unauthorized
- [ ] VOLUNTEER role → 403 Forbidden
- [ ] Staff from Org A tries to view Event from Org B → 403 Forbidden
- [ ] Event not found → 404 Not Found

### Authorization
- [ ] Staff can view feedbacks from own organization → 200 OK
- [ ] Staff CANNOT view feedbacks from other organization → 403 Forbidden
- [ ] Manager can view feedbacks from own organization → 200 OK
- [ ] Admin can view feedbacks from own organization → 200 OK

### Performance
- [ ] List 1000 feedbacks with limit=20 → Response < 300ms
- [ ] Filter by event with 100 feedbacks → Response < 100ms

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-06-30 | 1.0 | Initial contract definition for UC49 |

---

**Contract Owner**: TienTD  
**Last Updated**: 2026-06-30

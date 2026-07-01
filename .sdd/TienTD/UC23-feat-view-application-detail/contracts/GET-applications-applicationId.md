# API Contract: GET /applications/:applicationId

**Endpoint**: `GET /api/v1/applications/:applicationId`  
**Feature**: View Application Detail (UC23)  
**Owner**: TienTD - Application Module  
**Date**: 2026-06-29

---

## Authentication
- **Required**: Yes (JWT token in HttpOnly cookie)
- **Role**: Staff, Manager

---

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `applicationId` | UUID | Yes | Application ID to fetch |

---

## Request Example

```http
GET /api/v1/applications/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: api.vms.com
Cookie: token=<jwt_token>
```

---

## Response 200 OK

```json
{
  "success": true,
  "data": {
    "application": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "SUBMITTED",
      "motivation_letter": "I am passionate about volunteering...",
      "submitted_at": "2026-06-15T10:30:00Z",
      "reviewed_at": null,
      "notes": null,
      "volunteer": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Nguyen Van A",
        "email": "nguyenvana@example.com",
        "phone_number": "+84901234567",
        "avatar_url": "https://cloudinary.com/avatar.jpg",
        "skills": [
          {
            "id": "skill-uuid-1",
            "skill_name": "First Aid",
            "level": "INTERMEDIATE"
          },
          {
            "id": "skill-uuid-2",
            "skill_name": "Event Management",
            "level": "ADVANCED"
          }
        ],
        "statistics": {
          "events_joined": 12,
          "events_completed": 10,
          "completion_rate": 83.3,
          "total_volunteer_hours": 120
        }
      },
      "event": {
        "id": "event-uuid",
        "name": "Community Cleanup 2026",
        "start_date": "2026-07-01T08:00:00Z",
        "end_date": "2026-07-01T17:00:00Z"
      }
    }
  }
}
```

---

## Error Responses

### 400 Bad Request - Invalid UUID Format
```json
{
  "success": false,
  "error": {
    "code": "INVALID_UUID",
    "message": "Application ID must be a valid UUID",
    "details": {
      "field": "applicationId",
      "value": "invalid-id"
    }
  }
}
```

### 401 Unauthorized - Missing/Invalid Token
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 403 Forbidden - Organization Ownership Violation
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied: Application belongs to different organization"
  }
}
```

### 404 Not Found - Application Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Application not found"
  }
}
```

---

## Business Rules

1. **Organization Access Control**: Staff can ONLY view applications for events belonging to their organization
2. **Sensitive Data Protection**: NEVER expose `address` or `identity_card_number` in response
3. **Audit Logging**: Every detail view MUST be logged with `{ staff_id, application_id, volunteer_id, timestamp }`
4. **Performance**: Response time target <300ms (p95)

---

## Security Notes

- Organization validation happens at query level (Prisma nested where)
- Sensitive fields filtered using Prisma select
- Audit log written to database before returning response
- Browser console MUST NOT log email/phone (FR-016)

---

**Contract Status**: DRAFT  
**Reviewed By**: Pending  
**Approved By**: Pending

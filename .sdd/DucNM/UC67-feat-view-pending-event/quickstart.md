# Quickstart: View Pending Event (UC67)

**Phase**: 1 — Design & Contracts
**Date**: 2026-07-04 | **Updated**: 2026-07-21

**Consistency Check**: Aligned with Prisma schema v3.0 — no Organization model.

---

## Prerequisites

- NodeJS 18+
- MySQL database running
- Prisma CLI installed
- Event model with `status` field in Prisma schema (already exists)
- authorize middleware working (from UC26)
- Backend server running on port 5000

## Database

### 1. Prisma Schema (`backend/prisma/schema.prisma`)

Event model already exists in Prisma schema. No changes needed.

### 2. Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Int (PK) | Event ID |
| `title` | String | Event title |
| `status` | EventStatus | PENDING_APPROVAL, PUBLISHED, etc. |
| `createdBy` | Int (FK) | Staff who created the event |
| `createdAt` | DateTime | Creation timestamp |

---

## API

### GET /api/v1/events?status=pending_approval

**Authentication**: Optional (optionalAuth middleware)
**Authorization**: Manager/Admin only for `status=pending_approval`

**Response**:
```json
{
  "success": true,
  "message": "Lấy danh sách sự kiện thành công",
  "data": {
    "events": [
      {
        "event_id": 1,
        "title": "Dọn dẹp bãi biển",
        "created_by": { "id": 2, "full_name": "Staff A" },
        "status": "pending_approval",
        "created_at": "2026-07-01T08:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

---

## Testing

```bash
# Login as Manager
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@org.com","password":"password123"}' \
  -c cookies.txt

# View pending events
curl -X GET "http://localhost:5000/api/v1/events?status=pending_approval" \
  -b cookies.txt
```

---

**Version**: 2.0
**Last Updated**: 2026-07-21
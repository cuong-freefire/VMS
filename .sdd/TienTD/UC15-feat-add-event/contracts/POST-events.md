# API Contract: POST /api/v1/events

**Feature**: UC15 Add Event  
**Owner**: TienTD (Event Management Module)  
**Status**: Draft  
**Version**: 1.0  
**Last Updated**: 2026-06-29

---

## Overview

Staff tạo sự kiện tình nguyện mới với các thông tin cơ bản (title, description, dates, location, capacity, image) để kêu gọi Volunteer đăng ký tham gia.

**Business Rules**:
- Staff CHỈ được tạo event cho organization của mình (xác định qua JWT token)
- Start date PHẢI > current date (+ 24h buffer)
- End date PHẢI > start date
- Max capacity: 1-10,000 người

---

## Endpoint

```
POST /api/v1/events
```

---

## Authentication

**Required**: ✅ Yes

**Method**: JWT HttpOnly Cookie (`vms_access_token`)

**Authorization**: User role MUST be `Staff`

---

## Request

### Headers

```http
Content-Type: application/json
Cookie: vms_access_token=<jwt_token>
```

### Body Schema

```typescript
{
  title: string;              // Required, min 10 chars, max 255 chars
  description: string;        // Required, min 50 chars, max 5000 chars
  start_date: string;         // Required, ISO 8601 datetime, MUST > now + 24h
  end_date: string;           // Required, ISO 8601 datetime, MUST > start_date
  location: string;           // Required, max 500 chars
  max_capacity: number;       // Required, integer, min 1, max 10000
  cover_image_url?: string;   // Optional, HTTPS URL from Cloudinary
  status?: 'Draft' | 'Published'; // Optional, default 'Draft'
}
```

### Validation Rules (Zod)

```javascript
const createEventSchema = z.object({
  title: z.string()
    .min(10, "Title must be at least 10 characters")
    .max(255, "Title cannot exceed 255 characters")
    .regex(/^[^<>{}]*$/, "Title contains invalid characters"),
  
  description: z.string()
    .min(50, "Description must be at least 50 characters")
    .max(5000, "Description cannot exceed 5000 characters"),
  
  start_date: z.string()
    .datetime({ message: "Invalid datetime format" })
    .refine(
      (date) => new Date(date) > new Date(Date.now() + 24 * 60 * 60 * 1000),
      { message: "Start date must be at least 24 hours in the future" }
    ),
  
  end_date: z.string()
    .datetime({ message: "Invalid datetime format" }),
  
  location: z.string()
    .min(1, "Location is required")
    .max(500, "Location cannot exceed 500 characters"),
  
  max_capacity: z.number()
    .int("Capacity must be an integer")
    .min(1, "Capacity must be at least 1")
    .max(10000, "Capacity cannot exceed 10,000"),
  
  cover_image_url: z.string()
    .url("Invalid URL format")
    .regex(/^https:\/\//, "Image URL must use HTTPS")
    .optional(),
  
  status: z.enum(['Draft', 'Published']).optional().default('Draft')
}).refine(
  (data) => new Date(data.end_date) > new Date(data.start_date),
  {
    message: "End date must be after start date",
    path: ["end_date"]
  }
);
```

### Example Request

```json
{
  "title": "Mùa Hè Xanh 2026 - Hà Giang",
  "description": "Chiến dịch tình nguyện mùa hè tại các tỉnh miền núi phía Bắc. Tình nguyện viên sẽ tham gia các hoạt động xây dựng trường học, dạy học cho trẻ em vùng cao và hỗ trợ cộng đồng địa phương.",
  "start_date": "2026-07-15T08:00:00.000Z",
  "end_date": "2026-07-20T17:00:00.000Z",
  "location": "Hà Giang, Việt Nam",
  "max_capacity": 50,
  "cover_image_url": "https://res.cloudinary.com/vms-cloud/image/upload/v1234567890/events/summer-2026.jpg",
  "status": "Draft"
}
```

---

## Response

### Success Response

**Status Code**: `201 Created`

**Body Schema**:
```typescript
{
  success: true;
  data: {
    id: number;
    organization_id: number;        // Extracted from JWT token
    title: string;
    description: string;
    start_date: string;             // ISO 8601
    end_date: string;               // ISO 8601
    location: string;
    max_capacity: number;
    cover_image_url: string | null;
    status: 'Draft' | 'Published' | 'In Progress' | 'Completed' | 'Cancelled';
    is_active: boolean;             // Always true for new events
    created_by: number;             // Extracted from JWT token
    created_at: string;             // ISO 8601
    updated_at: string;             // ISO 8601
  }
}
```

**Example**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "organization_id": 10,
    "title": "Mùa Hè Xanh 2026 - Hà Giang",
    "description": "Chiến dịch tình nguyện mùa hè tại các tỉnh miền núi phía Bắc...",
    "start_date": "2026-07-15T08:00:00.000Z",
    "end_date": "2026-07-20T17:00:00.000Z",
    "location": "Hà Giang, Việt Nam",
    "max_capacity": 50,
    "cover_image_url": "https://res.cloudinary.com/vms-cloud/image/upload/v1234567890/events/summer-2026.jpg",
    "status": "Draft",
    "is_active": true,
    "created_by": 456,
    "created_at": "2026-06-29T15:09:00.000Z",
    "updated_at": "2026-06-29T15:09:00.000Z"
  }
}
```

---

## Error Responses

### 400 Bad Request (Validation Error)

**Cause**: Request body không pass Zod validation

**Body Schema**:
```typescript
{
  success: false;
  error: string;  // Human-readable error message
}
```

**Examples**:

*Start date in the past*:
```json
{
  "success": false,
  "error": "Validation failed: Start date must be at least 24 hours in the future"
}
```

*End date before start date*:
```json
{
  "success": false,
  "error": "Validation failed: End date must be after start date"
}
```

*Title too short*:
```json
{
  "success": false,
  "error": "Validation failed: Title must be at least 10 characters"
}
```

*Invalid capacity*:
```json
{
  "success": false,
  "error": "Validation failed: Capacity must be at least 1"
}
```

---

### 401 Unauthorized

**Cause**: JWT token missing, expired, hoặc invalid

**Body**:
```json
{
  "success": false,
  "error": "Authentication required"
}
```

**Note**: Frontend nên redirect đến login page khi nhận 401.

---

### 403 Forbidden

**Cause**: User không có role `Staff` hoặc không thuộc organization hợp lệ

**Body**:
```json
{
  "success": false,
  "error": "Only Staff can create events"
}
```

**Alternative Message** (nếu organization_id không hợp lệ):
```json
{
  "success": false,
  "error": "Invalid organization"
}
```

---

### 409 Conflict

**Cause**: Event với cùng title, organization_id và start_date đã tồn tại (duplicate submission)

**Body**:
```json
{
  "success": false,
  "error": "Event with same title and date already exists for this organization"
}
```

**Database Constraint**: `UNIQUE KEY (title, organization_id, start_date)`

---

### 500 Internal Server Error

**Cause**: Lỗi server (database connection, Cloudinary timeout, etc.)

**Body**:
```json
{
  "success": false,
  "error": "Failed to create event. Please try again."
}
```

**Note**: Backend PHẢI log chi tiết lỗi vào Pino logger. Frontend chỉ hiển thị generic message.

---

## Implementation Notes

### Security

1. **Identity Extraction** (Critical):
   - `organization_id` và `created_by` PHẢI lấy từ `req.user` (injected by JWT middleware)
   - TUYỆT ĐỐI KHÔNG trust request body cho identity fields
   - Rationale: Prevent user impersonation (Lesson 3, CLAUDE.md)

2. **Date Validation**:
   - Backend PHẢI validate lại start_date/end_date với server time
   - Không trust client-provided timestamps (client có thể chỉnh system clock)

3. **Input Sanitization**:
   - Zod regex patterns prevent XSS (title không chứa `<`, `>`, `{`, `}`)
   - Description sanitized trước khi render trong HTML

### Database

**Transaction Boundary**:
```javascript
await prisma.$transaction(async (tx) => {
  // 1. Create event
  const event = await tx.events.create({
    data: {
      organization_id: req.user.organization_id,
      title: validatedData.title,
      description: validatedData.description,
      start_date: new Date(validatedData.start_date),
      end_date: new Date(validatedData.end_date),
      location: validatedData.location,
      max_capacity: validatedData.max_capacity,
      cover_image_url: validatedData.cover_image_url || null,
      status: validatedData.status || 'Draft',
      is_active: true,
      created_by: req.user.id
    }
  });

  // 2. Create audit log (async, non-blocking)
  await tx.audit_logs.create({
    data: {
      user_id: req.user.id,
      action: 'CREATE',
      entity_type: 'Event',
      entity_id: event.id,
      details: JSON.stringify({ title: event.title, status: event.status })
    }
  });

  return event;
});
```

### Error Handling

**Prisma Error Mapping**:
```javascript
try {
  // ... create event
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint violation
    return res.status(409).json({
      success: false,
      error: 'Event with same title and date already exists for this organization'
    });
  }
  
  if (error.code === 'P2003') {
    // Foreign key constraint (organization_id invalid)
    return res.status(403).json({
      success: false,
      error: 'Invalid organization'
    });
  }
  
  // Generic error
  logger.error('Event creation failed', { error, userId: req.user.id });
  return res.status(500).json({
    success: false,
    error: 'Failed to create event. Please try again.'
  });
}
```

### Frontend Integration

**Axios Example**:
```javascript
import axios from 'axios';

const createEvent = async (eventData) => {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_BASE_URL}/events`,
      eventData,
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true  // Include HttpOnly cookies
      }
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    throw error.response?.data || { success: false, error: 'Network error' };
  }
};
```

---

## Testing

### Unit Tests (EventService)

```javascript
describe('EventService.createEvent', () => {
  test('should create event with valid data', async () => {
    const eventData = {
      title: 'Test Event 2026',
      description: 'A test volunteer event with sufficient description length.',
      start_date: new Date('2026-08-01T09:00:00.000Z'),
      end_date: new Date('2026-08-05T17:00:00.000Z'),
      location: 'Hanoi, Vietnam',
      max_capacity: 30
    };
    const userId = 123;
    const organizationId = 10;

    const event = await eventService.createEvent(eventData, userId, organizationId);

    expect(event.id).toBeDefined();
    expect(event.organization_id).toBe(organizationId);
    expect(event.created_by).toBe(userId);
    expect(event.status).toBe('Draft');
  });

  test('should reject start_date in the past', async () => {
    const eventData = {
      start_date: new Date('2020-01-01'),
      // ... other fields
    };

    await expect(
      eventService.createEvent(eventData, 123, 10)
    ).rejects.toThrow('Start date must be in the future');
  });
});
```

### Integration Tests (API Endpoint)

```javascript
describe('POST /api/v1/events', () => {
  let authToken;

  beforeAll(async () => {
    // Login as Staff to get JWT
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'staff@org.com', password: 'password' });
    authToken = loginRes.headers['set-cookie'];
  });

  test('should return 201 and create event', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Cookie', authToken)
      .send({
        title: 'Integration Test Event',
        description: 'This is a test event with at least 50 characters in the description.',
        start_date: '2026-08-01T09:00:00.000Z',
        end_date: '2026-08-05T17:00:00.000Z',
        location: 'Test Location',
        max_capacity: 100
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.title).toBe('Integration Test Event');
  });

  test('should return 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .send({ title: 'Unauthorized Test' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 for invalid dates', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Cookie', authToken)
      .send({
        title: 'Invalid Date Event',
        description: 'Test event with invalid dates that need to be caught.',
        start_date: '2026-08-10T09:00:00.000Z',
        end_date: '2026-08-05T17:00:00.000Z',  // Before start_date
        location: 'Test',
        max_capacity: 50
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('End date must be after start date');
  });
});
```

---

## Related Contracts

- **GET /api/v1/events**: List all events (UC16 - not yet implemented)
- **GET /api/v1/events/:id**: Get event details (UC17 - not yet implemented)
- **PATCH /api/v1/events/:id**: Update event (UC18 - not yet implemented)
- **DELETE /api/v1/events/:id**: Soft delete event (UC19 - not yet implemented)

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-06-29 | TienTD | Initial draft based on SPEC.md and plan.md Phase 1 |

---

## References

- **Feature Spec**: `.sdd/TienTD/event-management/UC15-feat-add-event/SPEC.md`
- **Implementation Plan**: `.sdd/TienTD/event-management/UC15-feat-add-event/plan.md`
- **Database Schema**: `DATABASE.md` (events table)
- **Architecture Decisions**: `CLAUDE.md` (ADR-001 to ADR-006)
- **Response Format Standard**: `backend/src/utils/response.util.js`

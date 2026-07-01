# Data Model: View Application List (UC22)

**Feature**: View Application List  
**Date**: 2026-06-29  
**Phase**: Phase 1 - Design  
**Status**: DESIGN COMPLETE

---

## Overview

UC22 feature cần query và hiển thị danh sách applications cho một event cụ thể, với khả năng filter theo status và phân trang. Data model này định nghĩa schema, relationships, indexes, và validation rules cần thiết để implement feature một cách hiệu quả và an toàn.

---

## Core Entities

### 1. Application (Main Entity)

Thực thể chính lưu trữ thông tin đơn đăng ký của tình nguyện viên cho một sự kiện.

```prisma
model Application {
  id                String   @id @default(uuid())
  event_id          String
  user_id           String   // volunteer_id
  status            ApplicationStatus @default(SUBMITTED)
  notes             String?  @db.Text
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  // Relations
  event             Event    @relation(fields: [event_id], references: [id])
  user              User     @relation(fields: [user_id], references: [id])
  
  // Indexes (CRITICAL for UC22 performance)
  @@index([event_id, status, created_at(sort: Desc)], name: "idx_applications_event_status_created")
  @@index([event_id, created_at(sort: Desc)], name: "idx_applications_event_created")
  @@unique([event_id, user_id], name: "unique_application_per_event")
}

enum ApplicationStatus {
  SUBMITTED  // Đang chờ duyệt
  APPROVED   // Đã được phê duyệt
  REJECTED   // Đã bị từ chối
}
```

**Field Descriptions**:
- `id`: UUID primary key
- `event_id`: Foreign key to events table (which event this application is for)
- `user_id`: Foreign key to users table (which volunteer applied)
- `status`: Current status of application (enum)
- `notes`: Optional notes từ Staff hoặc Volunteer (displayed in list)
- `created_at`: Submission timestamp (used for sorting: newest first)
- `updated_at`: Last modification timestamp

**Business Rules**:
- Mỗi volunteer chỉ được submit 1 application per event (unique constraint)
- Status transitions: `SUBMITTED → [APPROVED | REJECTED]` (one-way, không quay lại Submitted)
- Soft delete KHÔNG áp dụng cho Application (transaction data dùng state transitions)

---

### 2. User (Related Entity - Volunteer Profile)

Thông tin tình nguyện viên cần hiển thị trong danh sách.

```prisma
model User {
  id                  String   @id @default(uuid())
  name                String   @db.VarChar(255)
  email               String   @unique @db.VarChar(255)
  avatar_url          String?  @db.VarChar(500)
  
  // SENSITIVE FIELDS - MUST NOT expose in UC22 response
  address             String?  @db.Text
  identity_card_number String? @db.VarChar(20)
  phone_number        String?  @db.VarChar(20)
  password_hash       String   @db.VarChar(255)
  
  role                UserRole
  organization_id     String?
  is_active           Boolean  @default(true)
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
  
  // Relations
  applications        Application[]
  organization        Organization? @relation(fields: [organization_id], references: [id])
}

enum UserRole {
  GUEST
  VOLUNTEER
  STAFF
  MANAGER
  ADMIN
}
```

**UC22 Safe Fields** (for ApplicationListResponse):
- ✅ `id`: Volunteer ID (for linking to detail page - UC23)
- ✅ `name`: Volunteer name (displayed in list)
- ✅ `avatar_url`: Profile picture (displayed in list)
- ✅ `created_at`: Account creation date (optional, for sorting)

**Forbidden Fields** (MUST NOT include in response):
- ❌ `address`
- ❌ `identity_card_number`
- ❌ `phone_number`
- ❌ `password_hash`
- ❌ `email` (privacy protection, không hiển thị trong list view)

---

### 3. Event (Related Entity - Organization Ownership)

Sự kiện mà applications thuộc về, dùng để validate organization ownership.

```prisma
model Event {
  id               String   @id @default(uuid())
  title            String   @db.VarChar(255)
  organization_id  String
  status           EventStatus
  is_active        Boolean  @default(true)
  created_at       DateTime @default(now())
  
  // Relations
  organization     Organization @relation(fields: [organization_id], references: [id])
  applications     Application[]
  
  // Index for UC22 ownership validation
  @@index([organization_id, is_active], name: "idx_events_org")
}

enum EventStatus {
  DRAFT
  PUBLISHED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

**UC22 Usage**:
- JOIN với events table để validate `events.organization_id = staff.organization_id`
- Filter `is_active = true` để exclude soft-deleted events
- KHÔNG hiển thị full event details trong ApplicationListResponse (chỉ cần event_id)

---

### 4. Organization (Related Entity - Ownership Context)

Tổ chức sở hữu events và staff users.

```prisma
model Organization {
  id          String   @id @default(uuid())
  name        String   @db.VarChar(255)
  is_active   Boolean  @default(true)
  created_at  DateTime @default(now())
  
  // Relations
  events      Event[]
  users       User[]   // Staff, Manager, Admin
}
```

**UC22 Usage**:
- Validate Staff user's `organization_id` matches Event's `organization_id`
- KHÔNG query trực tiếp, dùng nested where trong Prisma query

---

## Data Relationships (Entity-Relationship Diagram)

```text
┌─────────────────┐
│  Organization   │
│  - id (PK)      │
│  - name         │
│  - is_active    │
└────────┬────────┘
         │ 1:N
         │
         │ owns
         │
┌────────▼────────┐      1:N      ┌──────────────────┐
│     Event       │─────────────>  │   Application    │
│  - id (PK)      │   has          │  - id (PK)       │
│  - title        │                │  - event_id (FK) │
│  - org_id (FK)  │                │  - user_id (FK)  │
│  - status       │                │  - status        │
│  - is_active    │                │  - notes         │
└─────────────────┘                │  - created_at    │
                                   └────────┬─────────┘
         ┌─────────────────────────────────┘
         │ N:1
         │ submitted by
         │
┌────────▼────────┐
│      User       │
│  - id (PK)      │
│  - name         │
│  - email        │
│  - avatar_url   │
│  - role         │
│  - org_id (FK)  │
│  - is_active    │
└─────────────────┘
```

**Key Relationships**:
1. **Organization 1:N Event**: Một tổ chức có nhiều events
2. **Event 1:N Application**: Một event có nhiều applications
3. **User 1:N Application**: Một volunteer có nhiều applications (across different events)
4. **Organization 1:N User**: Một tổ chức có nhiều staff users

**UC22 Query Path**:
```
Staff.organization_id 
  → Event.organization_id (validation)
  → Application.event_id (filter)
  → User.id (JOIN for volunteer info)
```

---

## Database Indexes

### Required Indexes for UC22 Performance

```sql
-- 1. CRITICAL: Composite index cho filtered + sorted queries
CREATE INDEX idx_applications_event_status_created 
ON applications(event_id, status, created_at DESC);

-- Covers queries:
-- SELECT * FROM applications WHERE event_id = ? AND status = ? ORDER BY created_at DESC LIMIT 20
-- SELECT * FROM applications WHERE event_id = ? ORDER BY created_at DESC LIMIT 20

-- 2. IMPORTANT: Composite index cho non-filtered queries
CREATE INDEX idx_applications_event_created 
ON applications(event_id, created_at DESC);

-- Covers query:
-- SELECT * FROM applications WHERE event_id = ? ORDER BY created_at DESC LIMIT 20

-- 3. CRITICAL: Index cho ownership validation
CREATE INDEX idx_events_org 
ON events(organization_id, is_active);

-- Covers query:
-- SELECT * FROM events WHERE organization_id = ? AND is_active = true

-- 4. EXISTING: Unique constraint (also serves as index)
CREATE UNIQUE INDEX unique_application_per_event 
ON applications(event_id, user_id);

-- 5. EXISTING: Foreign key indexes (created automatically by most DBs)
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_event_id ON applications(event_id);
```

**Index Size Estimates** (for 100K applications):
- `idx_applications_event_status_created`: ~15 MB (UUID + ENUM + DATETIME)
- `idx_applications_event_created`: ~10 MB (UUID + DATETIME)
- `idx_events_org`: ~2 MB (UUID + BOOLEAN)

**Query Plan Verification**:
```sql
EXPLAIN SELECT 
  a.id, a.status, a.notes, a.created_at,
  u.id as user_id, u.name, u.avatar_url
FROM applications a
JOIN users u ON a.user_id = u.id
JOIN events e ON a.event_id = e.id
WHERE a.event_id = 'event-uuid'
  AND e.organization_id = 'org-uuid'
  AND e.is_active = true
  AND a.status = 'SUBMITTED'
ORDER BY a.created_at DESC
LIMIT 20 OFFSET 0;

-- Expected: 
-- Using idx_applications_event_status_created (key_len: event_id + status)
-- Using idx_events_org (key_len: organization_id + is_active)
-- Type: ref, Extra: Using index condition
```

---

## Validation Rules

### 1. Input Validation (Zod Schemas)

```javascript
// Query params validation
const ApplicationListQuerySchema = z.object({
  status: z.enum(['SUBMITTED', 'APPROVED', 'REJECTED']).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

// Path params validation
const EventIdParamSchema = z.object({
  eventId: z.string().uuid({ message: 'Invalid event ID format' })
});
```

**Validation Rules**:
- `status`: MUST be one of enum values hoặc omitted (shows all)
- `page`: Integer từ 1-1000 (prevent abuse)
- `limit`: Integer từ 1-100 (prevent over-fetching)
- `eventId`: MUST be valid UUID format

**Error Responses**:
```json
// 400 Bad Request - Invalid status
{
  "success": false,
  "error": "Invalid status value. Must be one of: SUBMITTED, APPROVED, REJECTED"
}

// 400 Bad Request - Invalid page
{
  "success": false,
  "error": "Page must be between 1 and 1000"
}
```

---

### 2. Authorization Rules

```javascript
// Middleware + Service layer validation
async function validateEventOwnership(eventId, staffOrganizationId) {
  // Option A: Prisma nested where (PRIMARY)
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      organization_id: staffOrganizationId,
      is_active: true
    }
  });
  
  if (!event) {
    throw new ForbiddenError('Event not found or access denied');
  }
  
  return true;
}
```

**Authorization Rules**:
- Staff MUST belong to same organization as event
- Event MUST be active (`is_active = true`)
- JWT token MUST be valid và contain `organization_id`

**Error Responses**:
```json
// 401 Unauthorized - No JWT token
{
  "success": false,
  "error": "Authentication required"
}

// 403 Forbidden - Wrong organization
{
  "success": false,
  "error": "You do not have permission to view applications for this event"
}

// 404 Not Found - Event doesn't exist or soft-deleted
{
  "success": false,
  "error": "Event not found"
}
```

---

### 3. Business Rules

```javascript
// Service layer business logic
class ApplicationService {
  async getApplicationsByEvent(eventId, staffOrgId, filters) {
    // Rule 1: Organization ownership validation
    await this.validateEventOwnership(eventId, staffOrgId);
    
    // Rule 2: Pagination bounds checking
    const total = await this.countApplications(eventId, filters.status);
    const maxPage = Math.ceil(total / filters.limit);
    if (filters.page > maxPage && total > 0) {
      throw new BadRequestError(`Page ${filters.page} exceeds maximum ${maxPage}`);
    }
    
    // Rule 3: Sensitive data filtering (at query level)
    const applications = await ApplicationRepository.findByEventId(
      eventId,
      filters,
      { 
        userSelect: USER_PUBLIC_PROFILE_SELECT // Only safe fields
      }
    );
    
    return { applications, pagination: { ... } };
  }
}
```

**Business Rules**:
1. **Organization Ownership**: Staff chỉ xem applications của events thuộc org của mình
2. **Pagination Bounds**: Page number không vượt quá total pages
3. **Sensitive Data**: NEVER expose address, identity_card_number, phone_number
4. **Sorting**: Default sort by created_at DESC (newest first)
5. **Active Events Only**: Chỉ show applications của events với is_active = true

---

## Data Transfer Objects (DTOs)

### Request DTO

```javascript
// ApplicationListRequest (from query params)
interface ApplicationListRequest {
  status?: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  page: number;      // default: 1
  limit: number;     // default: 20
}
```

---

### Response DTO

```javascript
// ApplicationListResponse (API response format)
interface ApplicationListResponse {
  success: true;
  data: {
    applications: Array<{
      id: string;                    // application_id
      status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
      notes: string | null;
      submitted_at: string;          // ISO8601 timestamp (created_at)
      volunteer: {
        id: string;                  // user_id
        name: string;
        avatar_url: string | null;
      };
    }>;
    pagination: {
      current_page: number;
      total_pages: number;
      total_records: number;
      limit: number;
    };
  };
}

// Error Response
interface ErrorResponse {
  success: false;
  error: string;
}
```

**Field Mappings** (Database → DTO):
- `applications.id` → `id`
- `applications.status` → `status`
- `applications.notes` → `notes`
- `applications.created_at` → `submitted_at` (renamed for clarity)
- `users.id` → `volunteer.id`
- `users.name` → `volunteer.name`
- `users.avatar_url` → `volunteer.avatar_url`

---

## Reusable Constants

```javascript
// backend/src/constants/application.constants.js

// Public user profile fields (safe to expose)
export const USER_PUBLIC_PROFILE_SELECT = {
  id: true,
  name: true,
  avatar_url: true
};

// Application list select fields
export const APPLICATION_LIST_SELECT = {
  id: true,
  status: true,
  notes: true,
  created_at: true
};

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MAX_PAGE: 1000
};

// Application status enum
export const ApplicationStatus = {
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};
```

---

## Migration Scripts

### Migration: Add Composite Indexes

```sql
-- Migration: 20260629_add_application_indexes.sql

-- Add composite index for filtered + sorted queries
CREATE INDEX IF NOT EXISTS idx_applications_event_status_created 
ON applications(event_id, status, created_at DESC);

-- Add composite index for non-filtered queries
CREATE INDEX IF NOT EXISTS idx_applications_event_created 
ON applications(event_id, created_at DESC);

-- Add index for event ownership validation
CREATE INDEX IF NOT EXISTS idx_events_org 
ON events(organization_id, is_active);

-- Analyze tables for query optimizer
ANALYZE TABLE applications;
ANALYZE TABLE events;
ANALYZE TABLE users;
```

**Migration Notes**:
- Run `CREATE INDEX IF NOT EXISTS` để idempotent
- Run `ANALYZE TABLE` sau khi add indexes
- Monitor index creation time (có thể chậm với large tables)
- Consider `CREATE INDEX CONCURRENTLY` (PostgreSQL) để avoid table locks

---

## Performance Considerations

### Query Optimization Checklist

- [x] **Composite indexes** cho WHERE + ORDER BY clauses
- [x] **Covering indexes** cho COUNT queries
- [x] **Foreign key indexes** (auto-created)
- [x] **Selective field loading** (Prisma select, không load toàn bộ user record)
- [x] **Pagination** để giới hạn result set size
- [x] **JOIN optimization** (nested where trong Prisma)
- [x] **Query timeout** (5 seconds max)

### Caching Strategy (Future Enhancement)

```javascript
// Redis caching cho total count (expensive query)
const cacheKey = `application_count:${eventId}:${status}`;
let totalCount = await redis.get(cacheKey);

if (!totalCount) {
  totalCount = await prisma.application.count({
    where: { event_id: eventId, status }
  });
  await redis.set(cacheKey, totalCount, 'EX', 300); // 5 min TTL
}
```

**Cache Invalidation**:
- Invalidate khi application status changes (approve/reject in UC24/UC25)
- Invalidate khi new application submitted (UC12)
- TTL: 5 minutes (balance freshness vs performance)

---

## Security Checklist

- [x] **JWT authentication** required
- [x] **Organization ownership** validated
- [x] **Sensitive data filtering** at database level
- [x] **Input validation** with Zod
- [x] **SQL injection** prevented (Prisma parameterized queries)
- [x] **Rate limiting** (implement at API gateway level - future)
- [x] **Audit logging** for all list access operations

---

## Testing Strategy

### Unit Tests (Service Layer)

```javascript
describe('ApplicationService.getApplicationsByEvent', () => {
  it('should return paginated applications with default params', async () => {
    const result = await ApplicationService.getApplicationsByEvent(
      'event-123',
      'org-456',
      { page: 1, limit: 20 }
    );
    
    expect(result.applications).toHaveLength(20);
    expect(result.pagination.current_page).toBe(1);
    expect(result.pagination.total_records).toBeGreaterThan(0);
  });
  
  it('should filter by status=SUBMITTED', async () => {
    const result = await ApplicationService.getApplicationsByEvent(
      'event-123',
      'org-456',
      { status: 'SUBMITTED', page: 1, limit: 20 }
    );
    
    expect(result.applications.every(app => app.status === 'SUBMITTED')).toBe(true);
  });
  
  it('should throw ForbiddenError for wrong organization', async () => {
    await expect(
      ApplicationService.getApplicationsByEvent('event-123', 'wrong-org', {})
    ).rejects.toThrow(ForbiddenError);
  });
  
  it('should not expose sensitive user data', async () => {
    const result = await ApplicationService.getApplicationsByEvent(
      'event-123',
      'org-456',
      {}
    );
    
    result.applications.forEach(app => {
      expect(app.volunteer).not.toHaveProperty('address');
      expect(app.volunteer).not.toHaveProperty('identity_card_number');
      expect(app.volunteer).not.toHaveProperty('phone_number');
      expect(app.volunteer).not.toHaveProperty('email');
    });
  });
});
```

### Integration Tests (API Layer)

```javascript
describe('GET /api/v1/events/:eventId/applications', () => {
  it('should return 401 without JWT token', async () => {
    const res = await request(app)
      .get('/api/v1/events/event-123/applications');
    
    expect(res.status).toBe(401);
  });
  
  it('should return 200 with valid token and organization', async () => {
    const res = await request(app)
      .get('/api/v1/events/event-123/applications')
      .set('Cookie', `${COOKIE_ACCESS_NAME}=${staffToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.applications).toBeInstanceOf(Array);
    expect(res.body.data.pagination).toBeDefined();
  });
  
  it('should handle pagination correctly', async () => {
    const res = await request(app)
      .get('/api/v1/events/event-123/applications?page=2&limit=10')
      .set('Cookie', `${COOKIE_ACCESS_NAME}=${staffToken}`);
    
    expect(res.body.data.pagination.current_page).toBe(2);
    expect(res.body.data.pagination.limit).toBe(10);
  });
});
```

---

## Summary

Data model cho UC22 được thiết kế với các nguyên tắc sau:

1. **Performance-First**: Composite indexes cho query patterns phổ biến
2. **Security-First**: Sensitive data filtering at database level, organization ownership validation
3. **Type-Safety**: Prisma schemas + Zod validation
4. **Scalability**: Pagination, selective field loading, index optimization
5. **Maintainability**: Reusable constants, clear DTOs, documented relationships

**Next Step**: Generate API contract (`contracts/GET-events-eventId-applications.md`)

---

**Phase 1 - Data Model Complete** ✅

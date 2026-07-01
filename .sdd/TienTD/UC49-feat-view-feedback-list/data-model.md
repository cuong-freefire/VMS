# Data Model: View Feedback List (UC49)

**Feature**: View Feedback List  
**Date**: 2026-06-30  
**Migration Required**: ❌ NO

---

## Entity: Feedback (Existing from UC48)

**Table**: `feedbacks`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, NOT NULL | Auto-generated |
| event_id | UUID | FK → events.id, NOT NULL | Event being reviewed |
| user_id | UUID | FK → users.id, NOT NULL | Volunteer who submitted |
| rating | INTEGER | CHECK (rating BETWEEN 1 AND 5) | Star rating |
| comment | TEXT | NULLABLE | Volunteer's detailed feedback |
| created_at | TIMESTAMP | NOT NULL | Submission timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last modification |
| is_active | BOOLEAN | DEFAULT TRUE | Soft delete flag |

**Relationships**:
- `feedbacks.event_id` → `events.id` (MANY-TO-ONE)
- `feedbacks.user_id` → `users.id` (MANY-TO-ONE)

**Indexes** (required for UC49 queries):
```sql
CREATE INDEX idx_feedbacks_event_created 
ON feedbacks(event_id, created_at DESC);

CREATE INDEX idx_feedbacks_rating 
ON feedbacks(rating);

CREATE INDEX idx_feedbacks_org_filter
ON feedbacks(event_id, rating, created_at DESC);
```

---

## Query Patterns

### Query 1: List All Feedbacks (with organization filter)

**Use Case**: Staff views feedback list for their organization

**SQL Pattern**:
```sql
SELECT 
  f.id, f.rating, f.comment, f.created_at,
  u.id as volunteer_id, u.full_name as volunteer_name, u.avatar_url,
  e.id as event_id, e.title as event_title
FROM feedbacks f
INNER JOIN users u ON f.user_id = u.id
INNER JOIN events e ON f.event_id = e.id
WHERE e.organization_id = :staffOrganizationId
  AND e.status = 'COMPLETED'
  AND f.is_active = true
ORDER BY f.created_at DESC
LIMIT :limit OFFSET :offset;
```

**Performance**: ~100-200ms with index `idx_feedbacks_event_created`

---

### Query 2: Filter by Event

**Use Case**: Staff filters feedbacks for specific event

**SQL Pattern**:
```sql
-- Same as Query 1, add:
WHERE e.organization_id = :staffOrganizationId
  AND e.id = :eventId
  AND e.status = 'COMPLETED'
  AND f.is_active = true
ORDER BY f.created_at DESC;
```

**Performance**: ~50-100ms (event_id is highly selective)

---

### Query 3: Filter by Rating Range

**Use Case**: Staff filters low-rated feedbacks (1-2 stars)

**SQL Pattern**:
```sql
-- Same as Query 1, add:
WHERE e.organization_id = :staffOrganizationId
  AND e.status = 'COMPLETED'
  AND f.rating BETWEEN :ratingMin AND :ratingMax
  AND f.is_active = true
ORDER BY f.created_at DESC;
```

**Performance**: ~150-250ms (rating filter is less selective)

---

## Data Transformations

### Comment Truncation (Backend)

**Rule**: List view shows max 100 characters

**Implementation**:
```javascript
// feedback.service.js
function truncateComment(comment) {
  if (!comment) return '';
  return comment.length > 100 
    ? comment.substring(0, 100) + '...' 
    : comment;
}
```

**Apply in**: Repository layer before returning to service

---

### PII Protection

**Rule**: Do NOT expose volunteer email/phone in list

**Select Projection**:
```javascript
// feedback.repository.js
const selectFields = {
  id: true,
  rating: true,
  comment: true,
  created_at: true,
  user: {
    select: {
      id: true,
      full_name: true,
      avatar_url: true
      // email: false, phone_number: false
    }
  },
  event: {
    select: {
      id: true,
      title: true,
      organization_id: true,
      status: true
    }
  }
};
```

---

## State Machine: N/A

Feedback is **read-only** for Staff. No state transitions in UC49.

---

## Validation Rules

### Input Validation (Query Params)

**Zod Schema**:
```javascript
// feedback.validator.js
const feedbackListSchema = z.object({
  query: z.object({
    eventId: z.string().uuid().optional(),
    ratingMin: z.coerce.number().int().min(1).max(5).optional(),
    ratingMax: z.coerce.number().int().min(1).max(5).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0)
  }).refine(
    (data) => !data.ratingMin || !data.ratingMax || data.ratingMin <= data.ratingMax,
    { message: 'ratingMin must be <= ratingMax' }
  )
});
```

---

## Authorization Model

**Rule**: Staff can ONLY view feedbacks from events within their organization

**Check Logic**:
```javascript
// authorization.service.js (reuse from UC22-UC47)
async checkStaffOrganizationAccess(staffId, resourceType, resourceId) {
  const staff = await userRepository.getById(staffId);
  
  if (resourceType === 'feedback') {
    const feedback = await feedbackRepository.getById(resourceId);
    const event = await eventRepository.getById(feedback.event_id);
    
    if (event.organization_id !== staff.organization_id) {
      throw new ForbiddenError('Access denied');
    }
  }
}
```

**Apply in**: Service layer before querying feedbacks

---

## Response Schema

### FeedbackListItem

**DTO Structure**:
```typescript
interface FeedbackListItem {
  id: string;                    // UUID
  volunteer: {
    id: string;                  // UUID
    name: string;                // Full name
    avatar_url: string | null;   // Profile picture
  };
  event: {
    id: string;                  // UUID
    title: string;               // Event name
  };
  rating: number;                // 1-5
  comment_snippet: string;       // Max 100 chars
  created_at: string;            // ISO 8601
}
```

### FeedbackListResponse

**API Response**:
```typescript
interface FeedbackListResponse {
  success: true;
  message: string;
  data: {
    feedbacks: FeedbackListItem[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    filters_applied?: {
      event_id?: string;
      rating_min?: number;
      rating_max?: number;
    };
  };
}
```

---

## Summary

**Migration Status**: ✅ NO MIGRATION NEEDED

**Tables Used**:
- feedbacks (existing from UC48)
- events (existing from UC15-UC17)
- users (existing from Auth module)

**New Indexes Required**:
- `idx_feedbacks_event_created` (event_id, created_at DESC)
- `idx_feedbacks_rating` (rating)

**Query Performance Targets**:
- List all: < 1.2s (per SC-001)
- Filter by event: < 500ms
- Filter by rating: < 800ms

---

**Last Updated**: 2026-06-30  
**Owner**: TienTD

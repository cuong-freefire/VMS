# Research Questions: View Application List (UC22)

**Feature**: View Application List  
**Date**: 2026-06-29  
**Phase**: Phase 0 - Technical Research  
**Status**: RESEARCH COMPLETE

---

## RQ1: Organization Ownership Validation Strategy

### Question
Làm thế nào để validate Staff chỉ được xem applications của events thuộc organization của mình một cách an toàn và hiệu quả?

### Context
- Staff token chứa `userId` và (có thể) `organizationId`
- Applications thuộc về Events, Events thuộc về Organizations
- Cần prevent authorization bypass (Staff xem applications của org khác)
- Performance critical vì query này chạy thường xuyên

### Options Analysis

#### Option A: JOIN với events table, filter theo organization_id
```javascript
// Prisma query
const applications = await prisma.application.findMany({
  where: {
    event_id: eventId,
    event: {
      organization_id: staffOrganizationId,
      is_active: true
    }
  },
  include: { user: true, event: true }
});
```

**Pros**:
- Single query với atomic check
- Leverages database JOIN optimization
- Clear authorization logic trong query

**Cons**:
- JOIN có thể chậm nếu events table lớn
- Phụ thuộc vào Prisma nested where syntax
- Không reuse được event validation logic từ Event module

---

#### Option B: Pre-check event ownership trước khi query applications
```javascript
// Step 1: Validate event ownership
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

// Step 2: Query applications
const applications = await prisma.application.findMany({
  where: { event_id: eventId },
  include: { user: true }
});
```

**Pros**:
- Clear separation of authorization và data retrieval
- Easier to understand và debug
- Event validation logic có thể reuse từ Event module

**Cons**:
- 2 database queries thay vì 1
- Race condition potential (event deleted giữa 2 queries)
- Slightly higher latency

---

#### Option C: Rely on Event Service để validate ownership
```javascript
// Use Event module's service contract
const isAuthorized = await EventService.checkEventOwnership(eventId, staffOrganizationId);

if (!isAuthorized) {
  throw new ForbiddenError('Access denied');
}

// Query applications
const applications = await ApplicationRepository.findByEventId(eventId);
```

**Pros**:
- Best code reusability (DRY principle)
- Tuân thủ module ownership rules
- Event validation logic centralized trong Event module

**Cons**:
- Cross-module dependency (Application module depends on Event module)
- Async service call overhead
- Event module phải expose ownership check API

---

### Decision: **Option A with Option C fallback**

**Primary Approach (Option A)**: Dùng Prisma nested where JOIN cho performance.

**Rationale**:
1. **Performance**: Single query giảm latency, critical cho list operations
2. **Security**: Atomic check prevents TOCTOU (Time-of-Check-Time-of-Use) race conditions
3. **Simplicity**: Không cần cross-module service calls cho common case

**Fallback (Option C)**: Nếu Event module đã expose `EventService.checkEventOwnership()`, dùng nó để maintain consistency.

**Implementation Notes**:
- Add composite index: `INDEX idx_applications_event (event_id, status)` 
- Add index on events: `INDEX idx_events_org (organization_id, is_active)`
- Cache event ownership check results (TTL 5 minutes) nếu traffic cao

---

## RQ2: Pagination Implementation Pattern

### Question
Implement pagination như thế nào cho datasets lớn (100-500 applications per event) mà vẫn đảm bảo performance và UX tốt?

### Context
- Spec yêu cầu pagination khi >20 records (FR-003)
- Performance target: load 50 records trong <1.2s (SC-001)
- Staff cần navigate qua nhiều pages để review applications
- Sorting theo submission date (newest first)

### Options Analysis

#### Option A: Offset-based Pagination
```javascript
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const offset = (page - 1) * limit;

const [applications, total] = await Promise.all([
  prisma.application.findMany({
    where: { event_id: eventId },
    orderBy: { created_at: 'desc' },
    skip: offset,
    take: limit,
    include: { user: { select: { id: true, name: true, avatar_url: true } } }
  }),
  prisma.application.count({
    where: { event_id: eventId }
  })
]);

return {
  applications,
  pagination: {
    current_page: page,
    total_pages: Math.ceil(total / limit),
    total_records: total,
    limit
  }
};
```

**Pros**:
- Simple implementation
- Easy to jump to specific page (e.g., page 5)
- Total count available for UI
- Standard REST API pattern

**Cons**:
- Performance degrades với large offsets (OFFSET 1000 LIMIT 20 chậm)
- Total count query có thể chậm với large tables
- Data inconsistency nếu có inserts/deletes giữa page navigations

---

#### Option B: Cursor-based Pagination
```javascript
const limit = parseInt(req.query.limit) || 20;
const cursor = req.query.cursor; // application_id hoặc created_at timestamp

const applications = await prisma.application.findMany({
  where: {
    event_id: eventId,
    ...(cursor && { 
      OR: [
        { created_at: { lt: new Date(cursor) } },
        { 
          created_at: new Date(cursor),
          id: { lt: req.query.cursor_id }
        }
      ]
    })
  },
  orderBy: [
    { created_at: 'desc' },
    { id: 'desc' }
  ],
  take: limit + 1, // Fetch 1 extra to check if more pages exist
  include: { user: { select: { id: true, name: true, avatar_url: true } } }
});

const hasMore = applications.length > limit;
const records = hasMore ? applications.slice(0, limit) : applications;
const nextCursor = hasMore ? records[records.length - 1].created_at : null;

return {
  applications: records,
  pagination: {
    next_cursor: nextCursor,
    has_more: hasMore,
    limit
  }
};
```

**Pros**:
- Consistent performance regardless of dataset size
- No data inconsistency issues
- Efficient for infinite scroll UX

**Cons**:
- Cannot jump to specific page
- No total count (có thể solve bằng separate count query)
- More complex client-side state management
- Less intuitive for traditional page-based UI

---

#### Option C: Hybrid Approach
```javascript
// Offset-based for small datasets (< 1000 records)
// Cursor-based for large datasets (>= 1000 records)

const total = await prisma.application.count({ where: { event_id: eventId } });

if (total < 1000) {
  // Use Option A (offset-based)
  return offsetPagination(eventId, page, limit);
} else {
  // Use Option B (cursor-based)
  return cursorPagination(eventId, cursor, limit);
}
```

**Pros**:
- Best of both worlds
- Optimal performance cho both small và large datasets

**Cons**:
- Complexity cao
- Inconsistent API contract (sometimes page, sometimes cursor)
- Hard to maintain

---

### Decision: **Option A (Offset-based) with Optimizations**

**Rationale**:
1. **Simplicity**: Staff users expect traditional page navigation (page 1, 2, 3...)
2. **UX**: Cần total count để hiển thị "Showing 21-40 of 87 applications"
3. **Scale**: Với 100-500 applications per event, offset performance vẫn acceptable
4. **Jump Navigation**: Staff cần jump to last page để xem latest submissions

**Optimizations**:
- Cache total count (5 minute TTL) to avoid expensive COUNT(*) queries
- Add composite index: `INDEX idx_applications_event_created (event_id, created_at DESC)`
- Use `SELECT SQL_CALC_FOUND_ROWS` nếu MySQL version support (single query cho data + count)
- Set max page size: 100 records (prevent abuse)

**Performance Validation**:
- Test với 500 applications: OFFSET 480 LIMIT 20 phải <200ms
- Monitor slow query log và optimize nếu cần

---

## RQ3: Sensitive Data Filtering Strategy

### Question
Đảm bảo không leak sensitive data (address, identity_card_number) như thế nào trong response? (FR-016)

### Context
- Users table chứa sensitive fields: `address`, `identity_card_number`, `phone_number` (có thể)
- Staff chỉ cần xem: `id`, `name`, `avatar_url` của volunteer
- Spec yêu cầu: "MUST NOT hiển thị thông tin nhạy cảm" (FR-016)
- Cần defense-in-depth approach

### Options Analysis

#### Option A: Prisma `select` chỉ lấy safe fields
```javascript
const applications = await prisma.application.findMany({
  where: { event_id: eventId },
  include: {
    user: {
      select: {
        id: true,
        name: true,
        avatar_url: true
        // KHÔNG select: address, identity_card_number, phone_number
      }
    }
  }
});
```

**Pros**:
- Database-level filtering (most efficient)
- Sensitive data never leaves database
- Clear và explicit về fields được expose
- Prisma type safety ensures compile-time checks

**Cons**:
- Phải maintain select list khi user schema changes
- Duplicated select logic nếu nhiều endpoints cần same fields
- Không catch errors nếu developer forget select

---

#### Option B: Service layer filter sau khi query
```javascript
// Repository lấy full user object
const applications = await prisma.application.findMany({
  where: { event_id: eventId },
  include: { user: true }
});

// Service layer filters out sensitive fields
return applications.map(app => ({
  ...app,
  user: {
    id: app.user.id,
    name: app.user.name,
    avatar_url: app.user.avatar_url
  }
}));
```

**Pros**:
- Centralized filtering logic trong service
- Easy to add logging/audit trail
- Can apply dynamic field filtering based on role

**Cons**:
- Sensitive data loaded into memory (security risk)
- Performance overhead (fetch unnecessary data)
- Error-prone (easy to forget filtering)

---

#### Option C: Database View với pre-filtered columns
```sql
CREATE VIEW user_public_profile AS
SELECT 
  id,
  name,
  avatar_url,
  created_at
FROM users;
```

```javascript
// Query từ view thay vì table
const applications = await prisma.application.findMany({
  where: { event_id: eventId },
  include: { user_public_profile: true }
});
```

**Pros**:
- Database-enforced security boundary
- Cannot accidentally expose sensitive data
- Reusable across all queries cần public profile

**Cons**:
- Prisma không hỗ trợ views natively (cần raw SQL hoặc custom types)
- Migration complexity
- Harder to evolve schema

---

### Decision: **Option A (Prisma select) with DTOs**

**Rationale**:
1. **Security**: Database-level filtering là safest approach
2. **Performance**: Chỉ query data thực sự cần thiết
3. **Type Safety**: Prisma TypeScript types prevent mistakes
4. **Maintainability**: Explicit select lists are self-documenting

**Implementation Strategy**:
```javascript
// Create reusable select object
const USER_PUBLIC_PROFILE_SELECT = {
  id: true,
  name: true,
  avatar_url: true,
  created_at: true
};

// Use trong repository
const applications = await prisma.application.findMany({
  where: { event_id: eventId },
  include: {
    user: {
      select: USER_PUBLIC_PROFILE_SELECT
    }
  }
});
```

**Defense-in-Depth**:
1. **Layer 1**: Prisma select at repository
2. **Layer 2**: Service layer DTO transformation (double-check)
3. **Layer 3**: Integration tests verify response không chứa sensitive fields
4. **Layer 4**: API documentation explicitly lists safe fields

**Security Test**:
```javascript
// Test case
it('should not expose sensitive user data', async () => {
  const res = await request(app)
    .get('/api/v1/events/event-123/applications')
    .set('Cookie', staffToken);
  
  expect(res.body.data.applications[0].user).not.toHaveProperty('address');
  expect(res.body.data.applications[0].user).not.toHaveProperty('identity_card_number');
  expect(res.body.data.applications[0].user).not.toHaveProperty('phone_number');
});
```

---

## RQ4: Status Filter Query Optimization

### Question
Optimize query cho filter theo status (Submitted/Approved/Rejected) như thế nào để đạt performance target <200ms?

### Context
- Application status là enum: `Submitted`, `Approved`, `Rejected`
- Staff thường xuyên filter để xem "Pending applications" (Submitted)
- Cần support combined filters: status + pagination
- Index strategy critical cho performance

### Options Analysis

#### Option A: Single WHERE clause với indexed status column
```javascript
// Query với status filter
const applications = await prisma.application.findMany({
  where: {
    event_id: eventId,
    status: req.query.status || undefined, // undefined = no filter
    event: {
      organization_id: staffOrganizationId
    }
  },
  orderBy: { created_at: 'desc' },
  skip: offset,
  take: limit
});
```

**Index Strategy**:
```sql
-- Composite index cho optimal query
CREATE INDEX idx_applications_event_status_created 
ON applications(event_id, status, created_at DESC);
```

**Pros**:
- Single query cho all cases (với hoặc không có filter)
- Index covers entire WHERE + ORDER BY clause
- Prisma query optimizer handles efficiently

**Cons**:
- Index size lớn (3 columns)
- Cần separate index nếu có nhiều filter combinations

**Query Plan Analysis**:
```sql
EXPLAIN SELECT * FROM applications 
WHERE event_id = 'event-123' AND status = 'Submitted'
ORDER BY created_at DESC 
LIMIT 20;

-- Expected: Using idx_applications_event_status_created (key_len: event_id + status)
```

---

#### Option B: Separate queries per status, cache results
```javascript
// Cache key: `applications:${eventId}:${status}`
const cacheKey = `applications:${eventId}:${status}`;
let applications = await cache.get(cacheKey);

if (!applications) {
  applications = await prisma.application.findMany({
    where: { event_id: eventId, status }
  });
  await cache.set(cacheKey, applications, 300); // 5 minute TTL
}
```

**Pros**:
- Reduce database load cho repeated queries
- Fast response time cho cached results

**Cons**:
- Cache invalidation complexity (khi application status changes)
- Memory overhead
- Stale data risk
- Over-engineering cho MVP

---

#### Option C: Prisma enum filtering với query hints
```javascript
// Define Prisma enum
enum ApplicationStatus {
  SUBMITTED
  APPROVED
  REJECTED
}

// Query với type-safe enum
const applications = await prisma.application.findMany({
  where: {
    event_id: eventId,
    status: ApplicationStatus[req.query.status?.toUpperCase()]
  }
});
```

**Pros**:
- Type safety prevents invalid status values
- Prisma optimizes enum queries efficiently

**Cons**:
- Same performance as Option A
- Enum naming convention differences (SUBMITTED vs Submitted)

---

### Decision: **Option A with Composite Index**

**Rationale**:
1. **Simplicity**: Straightforward implementation, no cache complexity
2. **Performance**: Composite index ensures <200ms query time
3. **Flexibility**: Supports all filter combinations (no status, Submitted, Approved, Rejected)
4. **Maintainability**: Single code path cho all cases

**Index Strategy**:
```sql
-- Primary composite index
CREATE INDEX idx_applications_event_status_created 
ON applications(event_id, status, created_at DESC);

-- Covering index for COUNT queries
CREATE INDEX idx_applications_event_status 
ON applications(event_id, status);
```

**Query Optimization**:
- Use `SELECT SQL_CALC_FOUND_ROWS` (MySQL) hoặc separate COUNT query
- Monitor slow query log với pt-query-digest
- Add query timeout: 5 seconds max

**Performance Validation**:
```javascript
// Benchmark test
const start = Date.now();
const applications = await ApplicationRepository.findByEventId(eventId, { status: 'Submitted' });
const duration = Date.now() - start;

assert(duration < 200, `Query too slow: ${duration}ms`);
```

**Future Optimization**:
- Nếu traffic tăng cao, consider Redis cache với invalidation strategy
- Nếu events có >1000 applications, consider partitioning by event_id

---

## RQ5: Frontend State Management

### Question
Manage filter state (status, pagination) như thế nào ở frontend để đảm bảo UX tốt (bookmarkable URLs, browser back/forward)?

### Context
- Staff cần switch giữa các status filters nhanh
- Pagination state cần persist khi refresh page
- Browser back/forward buttons phải work correctly
- Shareable URLs (Staff share filtered view với colleagues)

### Options Analysis

#### Option A: URL Query Params
```javascript
// React Router v6
import { useSearchParams } from 'react-router-dom';

function ApplicationListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page')) || 1;
  
  const handleFilterChange = (newStatus) => {
    setSearchParams({ status: newStatus, page: 1 });
  };
  
  const handlePageChange = (newPage) => {
    setSearchParams({ status, page: newPage });
  };
  
  // URL: /events/123/applications?status=Submitted&page=2
}
```

**Pros**:
- Bookmarkable URLs (Staff có thể save filtered view)
- Browser back/forward works automatically
- Shareable links
- State persists across page refreshes
- Standard web UX pattern

**Cons**:
- URL changes trigger re-renders
- Harder to manage complex filter state (nhiều filters)

---

#### Option B: React useState với Local Component State
```javascript
function ApplicationListPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  
  const handleFilterChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1); // Reset to page 1
  };
  
  // State is lost on page refresh
}
```

**Pros**:
- Simple implementation
- No URL pollution
- Fast state updates (no URL sync overhead)

**Cons**:
- ❌ State lost on page refresh
- ❌ No bookmarkable URLs
- ❌ Browser back/forward doesn't work
- ❌ Cannot share filtered view

---

#### Option C: Context API cho Shared Filter State
```javascript
// ApplicationContext.js
const ApplicationContext = createContext();

export function ApplicationProvider({ children }) {
  const [filters, setFilters] = useState({
    status: '',
    page: 1
  });
  
  return (
    <ApplicationContext.Provider value={{ filters, setFilters }}>
      {children}
    </ApplicationContext.Provider>
  );
}

// ApplicationListPage.js
function ApplicationListPage() {
  const { filters, setFilters } = useContext(ApplicationContext);
  
  // Filters persist across component remounts
}
```

**Pros**:
- Shared state across multiple components
- Centralized filter logic

**Cons**:
- Same issues as Option B (no URL persistence)
- Overkill cho single-page feature
- Context overhead

---

### Decision: **Option A (URL Query Params)**

**Rationale**:
1. **UX Priority**: Bookmarkable URLs và browser navigation là critical cho staff workflow
2. **Collaboration**: Staff cần share filtered views với team members
3. **Standard Pattern**: Matches user expectations cho web applications
4. **Persistence**: State survives page refreshes

**Implementation**:
```javascript
// ApplicationListPage.jsx
import { useSearchParams, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getApplicationsByEvent } from '../../api/applicationApi';

function ApplicationListPage() {
  const { eventId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Read filters from URL
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || 20;
  
  // Fetch data when filters change
  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const response = await getApplicationsByEvent(eventId, { status, page, limit });
        setApplications(response.data.applications);
        setPagination(response.data.pagination);
      } catch (error) {
        console.error('Failed to fetch applications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplications();
  }, [eventId, status, page, limit]);
  
  // Update URL params (triggers useEffect)
  const handleStatusFilter = (newStatus) => {
    setSearchParams({ 
      status: newStatus, 
      page: 1, // Reset to first page
      limit 
    });
  };
  
  const handlePageChange = (newPage) => {
    setSearchParams({ status, page: newPage, limit });
  };
  
  return (
    <div>
      <FilterBar status={status} onStatusChange={handleStatusFilter} />
      <ApplicationTable applications={applications} loading={loading} />
      <Pagination 
        currentPage={page} 
        totalPages={pagination?.total_pages} 
        onPageChange={handlePageChange} 
      />
    </div>
  );
}
```

**Edge Cases**:
- Invalid status value trong URL → Ignore filter, show all
- Invalid page number → Redirect to page 1
- Page out of range → Redirect to last page

**Performance Consideration**:
- Debounce filter changes nếu có nhiều filters (avoid request spam)
- Use `replace: true` option for pagination để không pollute browser history
  ```javascript
  setSearchParams({ status, page: newPage }, { replace: true });
  ```

---

## Summary & Next Steps

### Research Decisions Summary

| Research Question | Decision | Rationale |
|-------------------|----------|-----------|
| RQ1: Ownership Validation | Option A (Prisma JOIN) with Option C fallback | Single query performance + atomic security check |
| RQ2: Pagination | Option A (Offset-based) with optimizations | Traditional UX + total count requirement |
| RQ3: Sensitive Data Filtering | Option A (Prisma select) + DTOs | Database-level security + type safety |
| RQ4: Status Filter Optimization | Option A (Composite index) | Simple + performant for expected scale |
| RQ5: Frontend State Management | Option A (URL query params) | Bookmarkable URLs + browser navigation |

### Key Technical Decisions

1. **Database Indexes Required**:
   - `CREATE INDEX idx_applications_event_status_created ON applications(event_id, status, created_at DESC);`
   - `CREATE INDEX idx_events_org ON events(organization_id, is_active);`

2. **API Contract**:
   - Endpoint: `GET /api/v1/events/:eventId/applications`
   - Query params: `?status=Submitted&page=1&limit=20`
   - Response includes pagination metadata

3. **Security Controls**:
   - JWT authentication required
   - Organization ownership validation via JOIN
   - Sensitive data filtering at database level
   - Audit log for all list access

4. **Performance Targets**:
   - <1.2s for 50 records (SC-001)
   - <200ms p95 response time
   - Composite indexes ensure query efficiency

### Ready for Phase 1

Tất cả research questions đã được resolved. Ready to proceed to Phase 1 design artifacts:
1. `data-model.md` - Database schema và relationships
2. `contracts/GET-events-eventId-applications.md` - Complete API contract
3. `quickstart.md` - Setup và testing guide

---

**Research Phase Complete** ✅  
**Next Phase**: Design (Phase 1)

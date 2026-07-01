# Research: View Feedback List (UC49)

**Feature**: View Feedback List  
**Date**: 2026-06-30  
**Status**: COMPLETE

---

## Research Questions

### RQ1: Query Scope - Which feedbacks should be visible?

**Question**: Should Staff see ALL feedbacks or only from COMPLETED events?

**Options Evaluated**:
1. All events (DRAFT, PUBLISHED, IN_PROGRESS, COMPLETED, CANCELLED)
2. Only COMPLETED events
3. IN_PROGRESS + COMPLETED events

**Decision**: **Option 2 - Only COMPLETED events**

**Rationale**:
- Feedbacks are submitted AFTER event completion (UC48 dependency)
- Showing COMPLETED only aligns with event lifecycle
- Clear separation: real-time attendance (UC46) vs post-event feedback (UC49)
- Matches UC47 pattern (historical view after completion)

**Alternatives Rejected**:
- Option 1: Too broad, includes Draft/Cancelled events with no feedback
- Option 3: Feedback submission happens after completion, not during IN_PROGRESS

**Impact**: Filter query with `WHERE events.status = 'COMPLETED'`

---

### RQ2: Pagination Strategy - Server-side or Client-side?

**Question**: How to handle large feedback datasets efficiently?

**Options Evaluated**:
1. Client-side pagination (load all, paginate in browser)
2. Server-side pagination (limit/offset)
3. Cursor-based pagination (next/prev tokens)

**Decision**: **Option 2 - Server-side pagination với limit/offset**

**Rationale**:
- VMS project standard pattern (used in UC22, UC46, UC47)
- Scalable: feedback data grows over time as events complete
- Performance: Only load requested page (default 20 items per spec)
- Simpler than cursor-based for tabular data

**Alternatives Rejected**:
- Option 1: Not scalable for 100+ feedbacks
- Option 3: Overly complex for simple list view, better for infinite scroll

**Impact**: 
- Repository: `skip: offset, take: limit`
- Response: `{ data, pagination: { total, limit, offset, hasMore } }`

---

### RQ3: Filter Implementation - Query params or POST body?

**Question**: How should Staff filter feedbacks (by event, by rating)?

**Options Evaluated**:
1. Query params: `?eventId=uuid&ratingMin=1&ratingMax=3`
2. POST /search with filter body
3. Separate endpoints per filter type

**Decision**: **Option 1 - Query parameters**

**Rationale**:
- RESTful convention for GET requests
- Bookmarkable URLs for Staff workflow
- Simpler frontend implementation
- Consistent with VMS project standards

**Alternatives Rejected**:
- Option 2: POST for filtering is non-RESTful, harder to cache
- Option 3: Too many endpoints for simple filters

**Impact**:
- Endpoint: `GET /api/v1/feedbacks?eventId=uuid&ratingMin=1&ratingMax=5&limit=20&offset=0`
- Validation: Zod schema với optional filters

---

### RQ4: Comment Display - Full text or snippet?

**Question**: Should list view show full comment or truncated snippet?

**Options Evaluated**:
1. Full comment text (unlimited length)
2. Snippet (first 100 characters + "...")
3. No comment in list (view in detail page only)

**Decision**: **Option 2 - Show snippet (100 chars max)**

**Rationale**:
- Per SPEC FR-002: "CommentSnippet (đoạn ngắn)"
- Improves list readability and page load performance
- Full comment available in UC50 (View Feedback Detail)
- Common UX pattern (Gmail, GitHub issues)

**Alternatives Rejected**:
- Option 1: Long comments break table layout, slow rendering
- Option 3: Staff needs preview to prioritize which feedback to read

**Impact**:
- Backend: `comment: feedback.comment.substring(0, 100) + (feedback.comment.length > 100 ? '...' : '')`
- Frontend: Display snippet with "Read more" link to UC50

---

## Technology Decisions

### Backend Stack Confirmation

**Confirmed Tech Stack** (from AGENTS.md):
- Runtime: Node.js 18+ (ESM)
- Framework: Express 5.x
- ORM: Prisma
- Validation: Zod
- Auth: JWT HttpOnly Cookie

**No New Dependencies Required**: Reuse existing infrastructure from UC22-UC48

---

### Frontend Stack Confirmation

**Confirmed Tech Stack** (from AGENTS.md):
- Framework: React 19 (JSX)
- UI Library: Material UI (DataGrid for list view)
- HTTP: Axios with credentials
- Form: React Hook Form (for filters)

**Component Reuse**:
- DataGrid from UC22 (Application List) - similar tabular structure
- Filter panel pattern from UC46 (Attendance List)

---

## Database Schema Review

**Required Tables** (from DATABASE.md):
- `feedbacks` table:
  - id, event_id, user_id (volunteer)
  - rating (1-5), comment (TEXT)
  - created_at, updated_at, is_active

**Existing Relationships**:
- `feedbacks.event_id` → `events.id`
- `feedbacks.user_id` → `users.id`
- `events.organization_id` → Staff authorization check

**Migration Required**: ❌ NO (tables exist from UC48)

**Index Requirements**:
- `idx_feedbacks_event_org` on `(event_id, created_at DESC)` - For event filter
- `idx_feedbacks_rating` on `(rating)` - For rating filter

---

## Best Practices

### Authorization Pattern

**Pattern**: Organization-based access control (reuse from UC22-UC47)

```javascript
// authorization.service.js
async checkStaffFeedbackAccess(staffId, eventId) {
  const staff = await userRepository.getById(staffId);
  const event = await eventRepository.getById(eventId);
  
  if (event.organization_id !== staff.organization_id) {
    throw new ForbiddenError('Staff can only view feedbacks from own organization');
  }
}
```

**Impact**: Every feedback query MUST filter by `events.organization_id = staff.organization_id`

---

### PII Protection

**Rule** (FR-016): Do NOT expose email or phone in list view

**Implementation**:
```javascript
// User select projection
const USER_PUBLIC_PROFILE = {
  id: true,
  full_name: true,
  avatar_url: true
  // email: false, phone_number: false
};
```

**Impact**: Reuse `USER_PUBLIC_PROFILE_SELECT` constant from UC47

---

### Performance Optimization

**Target** (SC-001): List load < 1.2 seconds

**Strategies**:
1. Index on `(event_id, created_at DESC)` for fast sorting
2. Use Prisma `select` to avoid loading unused fields
3. Separate count query for pagination metadata
4. Limit default page size to 20 items

**Expected Performance**: ~200-300ms for 1000 feedbacks with indexes

---

## Cross-Module Integration

### Dependency: UC48 (Submit Feedback)

**Relationship**: UC49 reads data written by UC48

**Data Flow**:
1. Volunteer completes event → UC46 (attendance check)
2. Volunteer submits feedback → UC48 writes to `feedbacks` table
3. Staff views feedback list → UC49 reads from `feedbacks` table

**Assumption** (A-005): UC48 has validated rating (1-5) and comment format

---

### Navigation: UC50 (View Feedback Detail)

**Relationship**: UC49 → UC50 (parent-child navigation)

**Pattern** (FR-004): Click feedback row → Navigate to UC50

**Implementation**:
```jsx
// Frontend
<DataGrid
  onRowClick={(params) => navigate(`/feedbacks/${params.row.id}`)}
/>
```

---

## Risk Assessment

### Risk 1: Large Comment Size Impact

**Risk**: Comments with 5000+ characters slow down list rendering

**Mitigation**: Truncate to 100 chars in backend query, not frontend

**Status**: MITIGATED (research decision RQ4)

---

### Risk 2: Cross-Organization Data Leak

**Risk**: Bug in authorization could expose feedback from other organizations

**Mitigation**: 
- Enforce organization_id filter at Repository level
- Add integration test: Staff A tries to access Event from Org B

**Status**: MITIGATED (authorization pattern defined)

---

### Risk 3: Double-Submit on Filter Apply

**Risk** (FR-018): Staff clicks "Apply Filter" multiple times → duplicate requests

**Mitigation**: 
- Frontend loading state disables filter button
- Debounce filter form submission (300ms)

**Status**: MITIGATED (will implement in frontend tasks)

---

## Summary

**All Research Questions Resolved**:
- ✅ RQ1: Query scope = COMPLETED events only
- ✅ RQ2: Pagination = Server-side limit/offset
- ✅ RQ3: Filters = Query parameters (eventId, rating range)
- ✅ RQ4: Comment display = 100-char snippet

**Key Decisions**:
1. NO database migration (reuse UC48 schema)
2. Reuse authorization pattern from UC22-UC47
3. Server-side pagination (limit=20 default, max=100)
4. Comment truncation at backend layer

**Ready for Phase 1**: Data model and contracts can now be defined.

---

**Last Updated**: 2026-06-30  
**Researcher**: AI Agent (TienTD module owner)

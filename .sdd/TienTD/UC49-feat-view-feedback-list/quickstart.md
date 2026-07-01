# UC49 - View Feedback List: Quickstart Guide

**Feature Owner**: TienTD  
**Status**: Phase 1 - Planning Completed  
**Last Updated**: 2026-06-30

---

## Overview

UC49 cho phép Staff xem danh sách phản hồi từ tình nguyện viên sau khi sự kiện hoàn thành. Hỗ trợ lọc theo sự kiện và điểm đánh giá.

**Key Capabilities**:
- ✅ List feedbacks with server-side pagination
- ✅ Filter by event (User Story 2)
- ✅ Filter by rating range (User Story 3)
- ✅ Organization-based authorization
- ✅ Read-only view (no edit/delete)

---

## Quick Navigation

### Planning Artifacts (Phase 1) - COMPLETED ✅
1. **[SPEC.md](./SPEC.md)** - 3 User Stories (US1: P1, US2: P1, US3: P2)
2. **[CONTEXT.md](./CONTEXT.md)** - Problem statement and decisions
3. **[research.md](./research.md)** - 4 research questions resolved
4. **[data-model.md](./data-model.md)** - NO migration needed
5. **[contracts/GET-feedbacks.md](./contracts/GET-feedbacks.md)** - API specification

### Implementation Artifacts (Phase 2) - PENDING
6. **[tasks.md](./tasks.md)** - To be generated
7. Implementation code - Generated during /speckit-implement

---

## API Endpoint

### GET /api/v1/feedbacks

**Purpose**: View feedback list with optional filters

```http
GET /api/v1/feedbacks?eventId=uuid&ratingMin=1&ratingMax=3&limit=20&offset=0
Authorization: Bearer <JWT_TOKEN>
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "feedbacks": [
      {
        "id": "uuid",
        "volunteer": { "id": "uuid", "name": "Nguyễn Văn A", "avatar_url": "url" },
        "event": { "id": "uuid", "title": "Beach Cleanup 2026" },
        "rating": 5,
        "comment_snippet": "Sự kiện tuyệt vời! Tôi rất vui...",
        "created_at": "2026-06-20T15:30:00Z"
      }
    ],
    "pagination": { "total": 127, "limit": 20, "offset": 0, "hasMore": true },
    "filters_applied": { "event_id": "uuid" }
  }
}
```

---

## Key Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| **RQ1: Query Scope** | COMPLETED events only | Feedbacks submitted after completion |
| **RQ2: Pagination** | Server-side (limit/offset) | Scalable for growing data |
| **RQ3: Filters** | Query parameters | RESTful, bookmarkable URLs |
| **RQ4: Comment Display** | 100-char snippet | List readability, full text in UC50 |

---

## Database Changes

### No Migration Required ✅

Tables exist from UC48:
- `feedbacks` table (id, event_id, user_id, rating, comment, created_at)
- Relationships: feedbacks → events → organizations (for authorization)

**New Indexes Required**:
```sql
CREATE INDEX idx_feedbacks_event_created ON feedbacks(event_id, created_at DESC);
CREATE INDEX idx_feedbacks_rating ON feedbacks(rating);
```

---

## Business Rules

### Authorization
- Staff can ONLY view feedbacks from events within their organization
- VOLUNTEER role: Forbidden (403)

### Data Filtering
- Only show feedbacks from COMPLETED events
- Exclude soft-deleted feedbacks (is_active = false)

### Comment Truncation
- List view: max 100 characters + "..."
- Full comment in UC50 (View Feedback Detail)

### PII Protection
- ✅ Show: volunteer name, avatar_url
- ❌ Hide: email, phone_number, address

---

## Implementation Checklist (Phase 2)

**Backend** (~14 tasks):
- [ ] Repository: FeedbackRepository.getList() với filters
- [ ] Service: getFeedbackList() với authorization
- [ ] Service: truncateComment() helper
- [ ] Controller: getFeedbackList endpoint
- [ ] Validation: Zod schema với optional filters
- [ ] Routes: Register GET /feedbacks
- [ ] Authorization: Reuse checkStaffOrganizationAccess()
- [ ] Unit tests: Service layer (80% coverage)
- [ ] Integration tests: API endpoint (15 test cases)
- [ ] Swagger docs: JSDoc comments
- [ ] Database: Create indexes (2 indexes)

**Frontend** (~10 tasks):
- [ ] API client: getFeedbackList() function
- [ ] Component: FeedbackListPage
- [ ] Component: FeedbackFilterPanel
- [ ] Component: FeedbackDataGrid
- [ ] Hook: useFeedbackList với filters
- [ ] UI: Handle loading and empty states
- [ ] Testing: Component tests
- [ ] E2E: Test filter scenarios

**Estimated Total**: ~24 tasks, ~8-10 hours

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Initial load | < 1.2s | Per SC-001 |
| Filter by event | < 500ms | event_id is selective |
| Filter by rating | < 800ms | Less selective than event |
| Pagination | < 200ms | Only metadata query |

---

## Testing Strategy

**Integration Tests** (15 scenarios):
- Happy path: List all, filter by event, filter by rating
- Authorization: Staff can view own org, cannot view other org
- Validation: Invalid UUID, rating out of range, limit > 100
- Edge cases: Empty result, pagination beyond total

**Frontend Tests**:
- Component rendering with data/empty/error states
- Filter form submission and validation
- Pagination navigation

---

## Dependencies

- ✅ UC48 (Submit Feedback) - COMPLETED (provides data)
- ✅ UC15-UC17 (Event Management) - COMPLETED
- ✅ Auth Module - COMPLETED
- ⏳ UC49 (View Feedback List) - Phase 1 COMPLETED
- ⏳ UC50 (View Feedback Detail) - Pending (navigation target)

---

## Next Steps

1. **Generate tasks.md**: Run in new session to avoid context limit
2. **Implementation**: Use /speckit-implement after tasks.md ready
3. **Testing**: Run full test suite after implementation
4. **Review**: Code review before merge to Dev

---

**Ready for Phase 2!** 🚀  
All Phase 1 artifacts complete. Generate tasks.md when ready.

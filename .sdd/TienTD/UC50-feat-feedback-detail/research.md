# Research: View Feedback Detail (UC50)

**Feature**: View Feedback Detail  
**Date**: 2026-07-01  
**Status**: COMPLETE

---

## Research Questions

### RQ1: Data Fetching - Single query or multiple?

**Question**: Should we fetch feedback detail in one query or separate queries?

**Options Evaluated**:
1. Single JOIN query (feedback + user + event in one call)
2. Separate queries (feedback first, then user, then event)
3. GraphQL-style (client specifies what to include)

**Decision**: **Option 1 - Single JOIN query**

**Rationale**:
- Performance: One roundtrip to database
- Consistency: All data from same transaction
- Reuses pattern from UC49 (feedbacks list)
- Simple implementation với Prisma `include`

**Alternatives Rejected**:
- Option 2: Multiple queries = N+1 problem, slower
- Option 3: Overkill for simple detail view

**Impact**: `GET /api/v1/feedbacks/:id` with Prisma include user + event

---

### RQ2: Image Display - Lightbox library or custom?

**Question**: How to implement image zoom functionality?

**Options Evaluated**:
1. Use existing lightbox library (react-image-lightbox, yet-another-react-lightbox)
2. Custom Material UI Dialog with image
3. Browser native image preview (open in new tab)

**Decision**: **Option 2 - Material UI Dialog**

**Rationale**:
- No new dependencies (Material UI already used)
- Consistent with VMS design system
- Simpler than adding lightbox library
- Mobile-friendly với Dialog responsive

**Alternatives Rejected**:
- Option 1: Extra dependency, bundle size increase
- Option 3: Poor UX, loses app context

**Impact**: Create ImagePreviewDialog component with Material UI

---

### RQ3: Navigation State - How to preserve UC49 filters?

**Question**: When user clicks "Back", how to preserve UC49 list filters?

**Options Evaluated**:
1. URL query parameters (pass filters in URL)
2. Browser history state (history.pushState với state object)
3. Global state (Redux/Context to persist filters)
4. Session storage (save filters before navigate)

**Decision**: **Option 2 - Browser history state + React Router location.state**

**Rationale**:
- React Router built-in feature (no extra lib)
- Browser back button works automatically
- Clean URLs (no long query strings)
- VMS project standard for navigation state

**Alternatives Rejected**:
- Option 1: Ugly URLs, limited data size
- Option 3: Overkill for simple navigation
- Option 4: Doesn't work with browser back button

**Impact**: 
- UC49: `navigate('/feedbacks/:id', { state: { filters, page } })`
- UC50: `navigate('/feedbacks', { state: location.state })`

---

### RQ4: Anonymous Handling - How to display?

**Question**: Per FR-005, how to handle anonymous feedback display?

**Options Evaluated**:
1. Display "Anonymous" placeholder with generic avatar
2. Hide volunteer section entirely
3. Show "Anonymous" với grayed-out style

**Decision**: **Option 1 - "Anonymous" with generic avatar**

**Rationale**:
- Consistent layout (volunteer section always present)
- Clear indication of anonymous status
- Common UX pattern (Stack Overflow, Reddit)

**Alternatives Rejected**:
- Option 2: Inconsistent layout, confusing
- Option 3: Subtle, easy to miss

**Impact**: 
```jsx
{feedback.is_anonymous ? (
  <div>
    <Avatar src="/generic-avatar.png" />
    <Typography>Anonymous</Typography>
  </div>
) : (
  <VolunteerInfo user={feedback.user} />
)}
```

---

## Technology Decisions

### Backend Stack Confirmation

**Confirmed** (reuse from UC49):
- Runtime: Node.js 18+ (ESM)
- Framework: Express 5.x
- ORM: Prisma (with `include` for relations)
- Validation: Zod (UUID validation for :id param)
- Auth: JWT HttpOnly Cookie

**No New Dependencies**

---

### Frontend Stack Confirmation

**Confirmed** (reuse from UC49):
- Framework: React 19 (JSX)
- UI Library: Material UI (Dialog for image preview)
- Routing: React Router v6 (location.state for navigation)
- HTTP: Axios with credentials

**New Components**:
- FeedbackDetailPage (main page)
- ImagePreviewDialog (lightbox)
- BackButton (with state preservation)

---

## Database Schema Review

**Required Tables**: feedbacks, users, events (all exist from UC48/UC49)

**Query Pattern**:
```sql
SELECT f.*, u.*, e.*
FROM feedbacks f
INNER JOIN users u ON f.user_id = u.id
INNER JOIN events e ON f.event_id = e.id
WHERE f.id = :feedbackId
  AND e.organization_id = :staffOrganizationId
  AND f.is_active = true;
```

**Migration Required**: ❌ NO

---

## Best Practices

### Authorization Pattern

**Pattern**: Same as UC49 - Organization-based access

```javascript
// authorization.service.js (reuse)
async checkStaffFeedbackDetailAccess(staffId, feedbackId) {
  const feedback = await feedbackRepository.getById(feedbackId);
  const event = await eventRepository.getById(feedback.event_id);
  const staff = await userRepository.getById(staffId);
  
  if (event.organization_id !== staff.organization_id) {
    throw new ForbiddenError('Cannot access feedback from other organization');
  }
}
```

---

### Line Breaks Handling (FR-002)

**Rule**: Display full comment with preserved line breaks

**Implementation**:
```jsx
// Frontend
<Typography sx={{ whiteSpace: 'pre-wrap' }}>
  {feedback.comment}
</Typography>
```

**Backend**: Return comment as-is (no truncation like UC49)

---

### Image Handling (FR-003)

**Storage**: Cloudinary URLs from UC48
**Display**: Thumbnail grid → Click → Fullscreen Dialog

```jsx
<Grid container spacing={2}>
  {feedback.images?.map(img => (
    <Grid item key={img.id}>
      <img src={img.thumbnail_url} onClick={() => openLightbox(img.full_url)} />
    </Grid>
  ))}
</Grid>
```

---

## Cross-Module Integration

### Navigation from UC49

**Flow**: UC49 list → Click row → UC50 detail

**Implementation**:
```jsx
// UC49 - FeedbackDataGrid.jsx
<DataGrid
  onRowClick={(params) => {
    navigate(`/feedbacks/${params.row.id}`, {
      state: { returnFilters: currentFilters, returnPage: currentPage }
    });
  }}
/>
```

---

### Back Navigation (US2)

**Flow**: UC50 detail → Back button → UC49 list với preserved state

**Implementation**:
```jsx
// UC50 - BackButton.jsx
const handleBack = () => {
  if (location.state?.returnFilters) {
    navigate('/feedbacks', { state: location.state });
  } else {
    navigate('/feedbacks'); // Fallback to clean list
  }
};
```

---

## Risk Assessment

### Risk 1: Long Comment Breaking UI (SC-007)

**Probability**: Medium  
**Impact**: High (UI breaking)  
**Mitigation**: 
- Use `whiteSpace: 'pre-wrap'` to wrap long text
- Set `wordBreak: 'break-word'` for long URLs
- Test with 10,000 character comment

**Status**: MITIGATED

---

### Risk 2: Large Images Loading Slowly

**Probability**: Medium  
**Impact**: Medium (poor UX)  
**Mitigation**:
- Use Cloudinary thumbnail URLs (optimized, smaller)
- Implement skeleton loading while images load
- Lazy load full-size images in Dialog only when clicked

**Status**: MITIGATED

---

### Risk 3: Cross-Organization Data Leak

**Probability**: Low  
**Impact**: CRITICAL (security breach)  
**Mitigation**:
- Organization filter enforced at Repository level
- Integration test: Staff A cannot view Feedback from Org B's event

**Status**: MITIGATED (reuse UC49 authorization pattern)

---

## Summary

**All Research Questions Resolved**:
- ✅ RQ1: Single JOIN query for performance
- ✅ RQ2: Material UI Dialog for image preview
- ✅ RQ3: React Router location.state for navigation
- ✅ RQ4: "Anonymous" placeholder for anonymous feedback

**Key Decisions**:
1. NO new database tables or migrations
2. Reuse authorization pattern from UC49
3. Use Material UI Dialog (no lightbox library)
4. Preserve navigation state via React Router

**Ready for Phase 1**: Data model and contracts can now be defined.

---

**Last Updated**: 2026-07-01  
**Researcher**: AI Agent (TienTD module owner)

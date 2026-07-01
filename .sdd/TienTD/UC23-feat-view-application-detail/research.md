# Research Questions: View Application Detail (UC23)

**Feature**: View Application Detail  
**Date**: 2026-06-29  
**Phase**: Phase 0 - Technical Research  
**Status**: RESEARCH COMPLETE

---

## RQ1: Organization Ownership Validation Strategy

### Decision: **Deep JOIN in single query (Option A)**

**Rationale**: Reuse UC22 pattern - single atomic query với Prisma nested where:
```javascript
const application = await prisma.application.findUnique({
  where: { id: applicationId },
  include: {
    user: { include: { user_skills: true } },
    event: { 
      where: { organization_id: staffOrganizationId },
      include: { organization: true }
    }
  }
});
if (!application || !application.event) throw new ForbiddenError();
```

**Performance**: 1 query, atomic security check, leverages existing UC22 indexes.

---

## RQ2: Sensitive Data Exposure Policy

### Decision: **Expose email + phone, hide address + ID card (Option B)**

**Rationale**: 
- Detail view CẦN email + phone để Staff liên hệ Volunteer
- Address + Identity Card KHÔNG cần thiết cho application review
- Privacy-first approach: only expose data cần cho business purpose

**Implementation**: 
```javascript
user: {
  select: {
    id: true, name: true, email: true, phone_number: true, avatar_url: true
    // NOT: address, identity_card_number
  }
}
```

---

## RQ3: State Transition Implementation

### Decision: **No automatic transition (Option C)**

**Rationale**:
- FR-004 says "nếu quy trình nghiệp vụ yêu cầu" - KHÔNG mandatory
- Status changes belong in UC24/UC25 (Approve/Reject) với explicit actions
- Viewing ≠ Reviewing - Staff có thể xem nhiều lần
- Avoid race conditions (2 Staff view simultaneously)

**Alternative**: Add `last_viewed_at` timestamp for audit only, NO status change.

---

## RQ4: Volunteer Statistics Integration

### Decision: **Direct COUNT query in Repository (Option A)**

**Rationale**:
- Simple aggregation: `COUNT(applications WHERE user_id AND status='Completed')`
- No cross-module dependency (UC18 may not be ready)
- Fresh data (no caching issues)

**Implementation**:
```javascript
const stats = await prisma.application.aggregate({
  where: { user_id: volunteerId, status: 'Completed' },
  _count: true,
  _sum: { volunteer_hours: true }
});
```

---

## RQ5: Custom Questions/Answers Display

### Decision: **Out of scope MVP (Option C)**

**Rationale**:
- Database schema CHƯA RÕ có table `application_custom_answers`
- SPEC.md không explicit require custom Q&A display
- Focus on P1 (US1): core profile + motivation letter
- Defer to future iteration when schema confirmed

**MVP Scope**: Show motivation_letter only, skip custom answers.

---

## RQ6: Frontend Navigation

### Decision: **React Router with route params (Option A)**

**Rationale**:
- Deep linking: Staff share URL `/applications/:applicationId`
- Browser back returns to UC22 list
- Clean separation: separate page vs modal overlay

**Implementation**:
```javascript
// Route: /applications/:applicationId
// UC22 Link: <Link to={`/applications/${app.id}`}>View Detail</Link>
```

---

## Summary

All 6 RQs resolved. Ready for Phase 1 design artifacts.

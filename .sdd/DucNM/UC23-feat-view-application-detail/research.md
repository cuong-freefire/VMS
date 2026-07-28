# Research Questions: View Application Detail (UC23)

**Feature**: View Application Detail  
**Date**: 2026-06-29  
**Phase**: Phase 0 - Technical Research  
**Status**: RESEARCH COMPLETE — Some decisions superseded by implementation

---

## RQ1: Organization Ownership Validation Strategy

### Decision: **Pre-check event creator ownership — ACTUAL IMPLEMENTATION**

**Research Decision (Option A)**: Deep JOIN in single query.

**Actual Implementation**: The service calls `applicationRepository.findDetailById(applicationId)` which returns the application with nested event info including `event.createdBy`. Then ownership is validated in service layer:
```javascript
if (application.event.createdBy !== currentUser.user_id) {
  throw new ServiceError('...', 403, 'FORBIDDEN');
}
```

**Reason for divergence**: Uses `createdBy` instead of `organization_id` because the current schema has no Organization model.

**Status**: ⚠️ SUPERSEDED

---

## RQ2: Sensitive Data Exposure Policy

### Decision: **Expose email + phone, hide password — MATCHES IMPLEMENTATION**

**Actual Implementation**: Repository uses `select` to expose:
- id, fullName, email, phone, avatarUrl, userSkills
- NOT: passwordHash, isActive, roleId, emailVerified

**Status**: ✅ MATCHES (email and phone exposed as defined in formatApplicationDetail)

---

## RQ3: State Transition Implementation

### Decision: **No automatic transition (Option C) — MATCHES IMPLEMENTATION**

**Actual Implementation**: Viewing detail does NOT change application status. No "Reviewed" status exists in the Prisma schema.

**Status**: ✅ MATCHES

---

## RQ4: Volunteer Statistics Integration

### Decision: **Direct COUNT query in Repository (Option A) — NOT IMPLEMENTED**

**Actual Implementation**: The service method `getApplicationDetail` does NOT include any statistics calculation. The research decision was not implemented.

**Status**: ❌ NOT IMPLEMENTED (deferred P2)

---

## RQ5: Custom Questions/Answers Display

### Decision: **Out of scope MVP (Option C) — MATCHES**

**Status**: ✅ MATCHES

---

## RQ6: Frontend Navigation

### Decision: **React Router (Option A) — NOT VERIFIED**

**Status**: ❓ UNKNOWN (frontend not in scope)

---

## Summary of Decision Status

| Research Question | Research Decision | Actual Implementation | Status |
|-------------------|-------------------|----------------------|--------|
| RQ1: Ownership | Deep JOIN (Option A) | Pre-check created_by | ⚠️ SUPERSEDED |
| RQ2: Sensitive Data | Expose email+phone | email+phone exposed | ✅ MATCHES |
| RQ3: State Transition | No auto change | No "Reviewed" status | ✅ MATCHES |
| RQ4: Statistics | Direct COUNT query | NOT implemented | ❌ NOT DONE |
| RQ5: Custom Q&A | Out of scope | Out of scope | ✅ MATCHES |
| RQ6: Frontend Nav | React Router | Not verified | ❓ UNKNOWN |

---

**Research Phase Complete** ✅  
**Last Updated**: 2026-07-28
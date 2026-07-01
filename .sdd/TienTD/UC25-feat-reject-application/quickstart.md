# UC25 - Reject Application: Quickstart Guide

**Feature Owner**: TienTD  
**Status**: Phase 1 - Planning Completed  
**Last Updated**: 2026-06-30

---

## Overview

UC25 cho phép Staff từ chối đơn đăng ký volunteer với optional rejection reason. Hệ thống gửi email thông báo tự động và log audit trail cho mỗi rejection.

**Key Capabilities**:
- ✅ Single reject: PATCH `/api/v1/applications/:applicationId/reject`
- ✅ Bulk reject: POST `/api/v1/applications/bulk-reject`
- ✅ Optional rejection reason (max 500 chars)
- ✅ Email notifications (reuse UC24 worker)
- ✅ Idempotent operations
- ✅ Autocomplete UI with templates

---

## Quick Navigation

### Planning Artifacts (Phase 1) - COMPLETED ✅
1. **[plan.md](./plan.md)** - Feature specification và user stories
2. **[research.md](./research.md)** - 4 research questions với detailed analysis
3. **[data-model.md](./data-model.md)** - Database schema changes và migration SQL
4. **[contracts/](./contracts/)** - API contract documents:
   - `PATCH-applications-applicationId-reject.md` - Single reject endpoint
   - `POST-applications-bulk-reject.md` - Bulk reject endpoint

### Implementation Artifacts (Phase 2) - PENDING
5. **[tasks.md](./tasks.md)** - Generated after user says "làm tiếp tasks"
6. Implementation code - Generated during /speckit-implement workflow

---

## Key Decisions (from research.md)

| Question | Decision | Rationale |
|----------|----------|-----------|
| **RQ1: rejection_reason validation** | Optional, max 500 chars | Fast workflow vs complete data tradeoff |
| **RQ2: Email notification** | Reuse UC24 email worker | ~60% code reuse, proven infrastructure |
| **RQ3: Bulk transaction strategy** | Multiple independent transactions | Partial success acceptable, crash resilience |
| **RQ4: Frontend input pattern** | Autocomplete with templates | Balance UX speed vs flexibility |

---

## Database Changes

### New Columns in `volunteer_applications`
```sql
-- Add rejection tracking fields
ALTER TABLE volunteer_applications
ADD COLUMN rejected_at DATETIME NULL,
ADD COLUMN rejection_reason VARCHAR(500) NULL;

-- Add index for analytics
CREATE INDEX idx_va_rejected_at ON volunteer_applications(rejected_at);
```

**No changes to email_queue** - Reuses UC24 infrastructure with new email type: `REJECTION_NOTIFICATION`

---

## API Endpoints

### 1. Single Reject
```http
PATCH /api/v1/applications/:applicationId/reject
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "rejection_reason": "Not meet skill requirements" // OPTIONAL
}
```

**Response 200 OK**:
```json
{
  "success": true,
  "message": "Application rejected successfully",
  "data": {
    "application_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "REJECTED",
    "rejected_at": "2026-06-30T00:15:30.123Z",
    "rejection_reason": "Not meet skill requirements",
    "email_status": "QUEUED"
  }
}
```

### 2. Bulk Reject
```http
POST /api/v1/applications/bulk-reject
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "application_ids": ["uuid1", "uuid2", "uuid3"],
  "rejection_reason": "Event postponed" // OPTIONAL
}
```

**Response 200 OK** (partial success):
```json
{
  "success": true,
  "message": "Bulk reject completed with 2 succeeded, 1 failed",
  "data": {
    "summary": {
      "total": 3,
      "succeeded": 2,
      "failed": 1,
      "duration_ms": 550
    },
    "successful": ["uuid1", "uuid2"],
    "failed": [{
      "application_id": "uuid3",
      "reason": "Application is in APPROVED state (use Cancel UC26 instead)",
      "error_code": "INVALID_STATE_TRANSITION"
    }],
    "rejection_reason": "Event postponed"
  }
}
```

---

## State Transition Rules

| Current Status | Can Reject? | Notes |
|---------------|-------------|-------|
| `SUBMITTED` | ✅ YES | Primary rejection path |
| `REVIEWED` | ✅ YES | After review, before approval |
| `APPROVED` | ❌ NO | Use UC26 Cancel instead |
| `REJECTED` | ✅ YES (idempotent) | Already rejected, no-op |
| `WITHDRAWN` | ❌ NO | Volunteer withdrawn, cannot reject |
| `CANCELLED` | ❌ NO | Already cancelled via UC26 |

---

## Implementation Checklist (Phase 2)

When user says **"làm tiếp tasks"**, the system will generate `tasks.md` with ~24 tasks:

### Backend Tasks (~14 tasks)
- [ ] Database migration: Add `rejected_at`, `rejection_reason` columns
- [ ] Service layer: `rejectApplication()` method
- [ ] Service layer: `bulkRejectApplications()` method
- [ ] Controller: Single reject endpoint
- [ ] Controller: Bulk reject endpoint
- [ ] Validation: Zod schemas for reject requests
- [ ] Email: Add `REJECTION_NOTIFICATION` template
- [ ] Route registration: `/applications/:id/reject` and `/bulk-reject`
- [ ] Unit tests: Service layer (80% coverage)
- [ ] Integration tests: API endpoints (17 test cases per contract)
- [ ] Error handling: Custom error classes
- [ ] Audit logging: Log rejection events
- [ ] Swagger docs: API documentation
- [ ] Performance: Load testing (20 req/s target)

### Frontend Tasks (~10 tasks)
- [ ] API client: `rejectApplication()` function
- [ ] API client: `bulkRejectApplications()` function
- [ ] Component: Reject confirmation dialog (single)
- [ ] Component: Bulk reject dialog with Autocomplete
- [ ] Component: Failed rejection modal
- [ ] Integration: ApplicationDetail page (single reject button)
- [ ] Integration: ApplicationList page (bulk reject button)
- [ ] Rejection templates: Predefined reason list
- [ ] Character counter: 500 char limit validation
- [ ] E2E tests: Reject workflows

---

## Code Reuse from UC24

UC25 reuses ~60% of UC24's infrastructure:

| Component | Reuse Level | Notes |
|-----------|-------------|-------|
| `email_queue` table | 100% | No schema changes |
| Email worker (cron) | 100% | Add new email type only |
| Transactional outbox pattern | 100% | Same implementation |
| Bulk operation pattern | 90% | Adapt from bulk approve |
| Service layer structure | 80% | Similar validation logic |
| Frontend DataGrid integration | 80% | Similar UI patterns |

**New Code Required**:
- Single reject service method (~150 LOC)
- Bulk reject service method (~80 LOC, wraps single)
- Rejection reason validation (~30 LOC)
- Email template for rejection (~50 LOC HTML)
- Frontend Autocomplete dialog (~120 LOC JSX)

**Estimated Total LOC**: ~600 new lines (vs ~1500 if built from scratch)

---

## Testing Strategy

### Unit Tests (Jest)
```javascript
// application.service.test.js
describe('rejectApplication', () => {
  test('should reject SUBMITTED application with reason', async () => {
    // Test happy path with rejection_reason
  });
  
  test('should reject SUBMITTED application without reason', async () => {
    // Test happy path without rejection_reason
  });
  
  test('should return idempotent for already REJECTED', async () => {
    // Test idempotency
  });
  
  test('should throw error for APPROVED application', async () => {
    // Test invalid state transition
  });
  
  test('should throw error for org mismatch', async () => {
    // Test authorization
  });
});

describe('bulkRejectApplications', () => {
  test('should reject all valid applications', async () => {
    // Test bulk success
  });
  
  test('should return partial success with failures', async () => {
    // Test partial success
  });
  
  test('should handle all failures gracefully', async () => {
    // Test all failed scenario
  });
});
```

### Integration Tests (Supertest)
```javascript
// application.integration.test.js
describe('PATCH /api/v1/applications/:id/reject', () => {
  test('should return 200 with valid request', async () => {
    // Test single reject endpoint
  });
  
  test('should return 400 with rejection_reason > 500 chars', async () => {
    // Test validation
  });
});

describe('POST /api/v1/applications/bulk-reject', () => {
  test('should return 200 with partial success', async () => {
    // Test bulk reject endpoint
  });
  
  test('should return 400 with > 50 application_ids', async () => {
    // Test validation
  });
});
```

### E2E Tests (Cypress/Playwright)
```javascript
// reject-application.e2e.js
describe('Reject Application', () => {
  test('Staff can reject single application from detail page', async () => {
    // Navigate to application detail
    // Click reject button
    // Enter rejection reason in Autocomplete
    // Confirm rejection
    // Verify success toast
    // Verify status changed to REJECTED
  });
  
  test('Staff can bulk reject from list page', async () => {
    // Navigate to application list
    // Select 5 applications
    // Click bulk reject button
    // Enter rejection reason template
    // Confirm bulk reject
    // Verify partial success message
    // Verify failed items modal
  });
});
```

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Single reject response time | <200ms | P50 latency |
| Bulk reject (10 apps) | <1s | Sequential processing |
| Bulk reject (50 apps) | <5s | Max batch size |
| Throughput (single) | >100 req/s | Single server |
| Throughput (bulk) | >20 req/s | Limited by sequential |
| Email queue latency | <5s | Time to create job |
| Email delivery | <30s | Worker pickup + send |

---

## Security Considerations

### Authentication & Authorization
- ✅ JWT token required (Staff/Manager/Admin roles only)
- ✅ Organization ownership validated per application
- ✅ No cross-organization rejection possible

### Input Validation
- ✅ rejection_reason max 500 chars (prevents abuse)
- ✅ UUID format validated (prevents injection)
- ✅ Bulk limit 50 applications (prevents DoS)
- ✅ Zod schema validation before service layer

### Rate Limiting (Recommended)
```javascript
// rate-limiter.config.js
export const bulkRejectRateLimit = {
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 bulk requests per minute per Staff
  message: 'Too many bulk reject requests, please try again later'
};
```

### Audit Trail
```javascript
// Logged for each rejection
{
  event_type: 'APPLICATION_REJECTED',
  staff_id: 'uuid',
  application_id: 'uuid',
  rejection_reason: 'string or null',
  timestamp: '2026-06-30T00:15:30Z',
  ip_address: '10.0.0.1',
  user_agent: 'Mozilla/5.0...'
}
```

---

## Frontend UI Pattern

### Single Reject Button (ApplicationDetail.jsx)
```jsx
<Button
  variant="outlined"
  color="error"
  startIcon={<CancelIcon />}
  onClick={handleRejectClick}
  disabled={!canReject(application.status)}
>
  Reject Application
</Button>
```

### Bulk Reject Button (ApplicationList.jsx)
```jsx
{selectedIds.length > 0 && (
  <Badge badgeContent={selectedIds.length} color="primary">
    <Button
      variant="contained"
      color="error"
      onClick={handleBulkRejectClick}
    >
      Bulk Reject
    </Button>
  </Badge>
)}
```

### Autocomplete Dialog (from RQ4 decision)
```jsx
<Autocomplete
  freeSolo // Allow custom text
  options={REJECTION_TEMPLATES}
  value={rejectionReason}
  onChange={(event, newValue) => setRejectionReason(newValue || '')}
  renderInput={(params) => (
    <TextField
      {...params}
      label="Rejection Reason (Optional)"
      placeholder="Select template or type custom reason"
      multiline
      rows={3}
      helperText={`${rejectionReason.length}/500 characters`}
      error={rejectionReason.length > 500}
    />
  )}
/>
```

**Predefined Templates**:
- "Not meet skill requirements"
- "Event postponed"
- "Event cancelled"
- "Insufficient experience"
- "Application submitted after deadline"
- "Duplicate application"

---

## Email Notification

### Template: REJECTION_NOTIFICATION
```html
<!DOCTYPE html>
<html>
<head>
  <title>Application Rejected - VMS</title>
</head>
<body>
  <h2>Application Rejected</h2>
  
  <p>Dear {{volunteer_name}},</p>
  
  <p>We regret to inform you that your application for the following event has been rejected:</p>
  
  <ul>
    <li><strong>Event:</strong> {{event_name}}</li>
    <li><strong>Date:</strong> {{event_date}}</li>
    <li><strong>Organization:</strong> {{organization_name}}</li>
  </ul>
  
  {{#if rejection_reason}}
  <p><strong>Reason:</strong> {{rejection_reason}}</p>
  {{else}}
  <p><em>No specific reason provided.</em></p>
  {{/if}}
  
  <p>Thank you for your interest in volunteering with us. We encourage you to apply for other events that match your skills and availability.</p>
  
  <p>Best regards,<br>
  {{organization_name}}</p>
</body>
</html>
```

### Email Queue Entry
```javascript
{
  recipient_email: "volunteer@example.com",
  recipient_name: "Nguyen Van A",
  email_type: "REJECTION_NOTIFICATION",
  status: "PENDING",
  priority: "NORMAL",
  template_data: JSON.stringify({
    volunteer_name: "Nguyen Van A",
    event_name: "Beach Cleanup 2026",
    event_date: "2026-07-15",
    rejection_reason: "Event postponed due to weather",
    organization_name: "Green Hanoi"
  }),
  scheduled_at: "2026-06-30T00:15:30Z",
  max_retries: 3,
  retry_count: 0
}
```

---

## Troubleshooting

### Common Issues

**Issue 1**: "Application is in APPROVED state"
- **Cause**: Attempting to reject an already approved application
- **Solution**: Use UC26 Cancel endpoint instead (POST `/api/v1/applications/:id/cancel`)

**Issue 2**: "Organization mismatch"
- **Cause**: Staff attempting to reject application from different organization
- **Solution**: Verify JWT token's `organizationId` matches application's event organization

**Issue 3**: "Rejection reason exceeds 500 characters"
- **Cause**: Frontend validation not working or bypassed
- **Solution**: Enforce character limit in Autocomplete component with real-time validation

**Issue 4**: Bulk reject returns all failed
- **Cause**: All applications in wrong state or org mismatch
- **Solution**: Check `failed` array for specific error codes per application

**Issue 5**: Email not sent after rejection
- **Cause**: Email worker not running or email_queue insert failed
- **Solution**: 
  1. Check email worker cron job: `pm2 list` or `docker ps`
  2. Query email_queue: `SELECT * FROM email_queue WHERE email_type='REJECTION_NOTIFICATION' ORDER BY created_at DESC LIMIT 10`
  3. Check worker logs: `pm2 logs email-worker`

---

## Next Steps

### For Implementation (Phase 2)
1. **Wait for user command**: User will say **"làm tiếp tasks"**
2. **Generate tasks.md**: System will create detailed task breakdown (~24 tasks)
3. **Implementation workflow**: User will run `/speckit-implement` to execute all tasks
4. **Testing**: Run full test suite after implementation
5. **Code review**: Review changes before merge to Dev branch

### Dependencies
- ✅ UC22 (List Applications) - COMPLETED
- ✅ UC23 (View Application Detail) - COMPLETED
- ✅ UC24 (Approve Application) - COMPLETED (email worker infrastructure)
- ⏳ UC25 (Reject Application) - Phase 1 COMPLETED, Phase 2 PENDING
- ⏳ UC26 (Cancel Approved Application) - NOT STARTED

### Timeline Estimate
- **Tasks generation**: 2 minutes (after "làm tiếp tasks" command)
- **Backend implementation**: ~3-4 hours (14 tasks)
- **Frontend implementation**: ~2-3 hours (10 tasks)
- **Testing**: ~2 hours (unit + integration + E2E)
- **Total**: ~8 hours (with 60% code reuse from UC24)

---

## References

- **[plan.md](./plan.md)** - Full feature specification
- **[research.md](./research.md)** - Research decisions with rationale
- **[data-model.md](./data-model.md)** - Database schema and migration
- **[contracts/PATCH-applications-applicationId-reject.md](./contracts/PATCH-applications-applicationId-reject.md)** - Single reject API
- **[contracts/POST-applications-bulk-reject.md](./contracts/POST-applications-bulk-reject.md)** - Bulk reject API
- **UC24 Artifacts**: `.sdd/TienTD/UC24-feat-approve-application/` - Reference for email worker patterns

---

**Ready for Phase 2!** 🚀  
Say **"làm tiếp tasks"** to generate tasks.md and proceed to implementation.

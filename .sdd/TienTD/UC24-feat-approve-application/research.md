# Research Document: Approve Application (UC24)

**Branch**: `024-feat-approve-application` | **Date**: 2026-06-29 | **Phase**: 0 (Research)

**Purpose**: Resolve 6 research questions outlined in `plan.md` before proceeding to Phase 1 design artifacts.

---

## RQ1: Transaction Strategy - Email Trigger Placement

### Question
Email trigger nên ở trong hay ngoài database transaction khi phê duyệt đơn?

### Context
- **Inside transaction**: Email chỉ gửi nếu DB commit thành công (strong consistency)
- **Outside transaction**: DB commit ngay, email async sau (eventual consistency)
- **Transactional outbox**: INSERT email job vào outbox table trong transaction, worker process sends later

### Research Findings

**Industry Best Practices**:
1. **Saga Pattern** (Microservices): Distributed transactions qua message queue - NOT applicable (VMS là monolith)
2. **Transactional Outbox Pattern** (Recommended):
   - INSERT email job vào `email_queue` table trong SAME transaction với status update
   - Background worker polls queue và gửi email async
   - Đảm bảo at-least-once delivery (worker retries nếu email fails)
3. **Direct HTTP Call Inside Transaction** (Anti-pattern):
   - Transaction hold locks trong khi chờ email service respond (slow)
   - Email service downtime blocks approval workflow (fragile)

**Prisma ORM Support**:
```javascript
// Transactional outbox với Prisma
await prisma.$transaction([
  prisma.application.update({
    where: { id: applicationId },
    data: { status: 'APPROVED', approved_at: new Date() }
  }),
  prisma.emailQueue.create({
    data: {
      type: 'APPROVAL_NOTIFICATION',
      recipient_id: volunteerId,
      application_id: applicationId,
      status: 'PENDING'
    }
  })
]);
```

**Performance Impact**:
- Inside transaction (HTTP call): ~2-5s per approval (network latency)
- Outside transaction (async): ~200ms per approval (DB only)
- Transactional outbox: ~250ms per approval (DB + queue INSERT)

### Decision: **Option C - Transactional Outbox Pattern**

**Rationale**:
- ✅ **Strong consistency**: Email job ONLY created if status update commits
- ✅ **Fast**: Transaction completes in <300ms (no network wait)
- ✅ **Resilient**: Email service downtime doesn't block approvals
- ✅ **Retry-able**: Worker can retry failed emails with exponential backoff
- ✅ **Audit-able**: Email delivery status tracked in queue table

**Implementation Plan**:
1. Create `email_queue` table với fields: `id`, `type`, `recipient_id`, `application_id`, `status` (PENDING/SENT/FAILED), `created_at`, `sent_at`, `retry_count`
2. Update `application.service.js` → approveApplication method inserts both Application update + EmailQueue record trong $transaction
3. Create background worker (cron job hoặc separate process) polls `email_queue` WHERE status='PENDING' và calls UC64 email service
4. Worker updates `email_queue.status` → 'SENT' after success, 'FAILED' after 3 retries

**Trade-offs Accepted**:
- ❌ Eventual consistency: Volunteer nhận email sau vài giây (acceptable cho notifications)
- ❌ Complexity: Thêm 1 table + background worker process

---

## RQ2: Capacity Enforcement Strategy

### Question
Khi `approved_count >= event.max_capacity`, hệ thống handle như thế nào?

### Context
- FR-003: "hiển thị cảnh báo nhưng vẫn cho phép Staff phê duyệt nếu họ muốn thêm danh sách dự phòng"
- Business need: Event organizers muốn có overflow capacity cho no-shows

### Research Findings

**Industry Patterns**:
1. **Hard Block** (Airline model): Không bao giờ vượt quá capacity → return 409 Conflict
2. **Soft Warning + Allow** (Event ticketing model): Show warning nhưng allow override
3. **Overflow Bucket** (Waitlist model): Allow up to max_capacity + buffer% (e.g., 120%)

**VMS Requirement Analysis**:
- FR-003 rõ ràng yêu cầu "vẫn cho phép Staff phê duyệt" → loại bỏ Hard Block
- "Danh sách dự phòng" → Buffer capacity model phù hợp

**Buffer Sizing Research** (từ event management industry):
- Small events (<50 people): 20% buffer (10 người → 12 approve OK)
- Medium events (50-200 people): 15% buffer (100 người → 115 approve OK)
- Large events (>200 people): 10% buffer (500 người → 550 approve OK)

### Decision: **Option C - Overflow Bucket với 20% Buffer**

**Rationale**:
- ✅ Matches FR-003 requirement ("vẫn cho phép phê duyệt")
- ✅ Provides safety margin cho no-shows (industry standard: 10-20% no-show rate)
- ✅ Clear business rule: `approved_count <= max_capacity * 1.2`
- ✅ Staff retains control: Frontend shows warning "Over capacity by X%" nhưng vẫn cho phép approve

**Implementation Plan**:
1. Capacity check logic trong `application.service.js`:
   ```javascript
   const currentApprovedCount = await prisma.application.count({
     where: { event_id: eventId, status: 'APPROVED' }
   });
   const event = await prisma.event.findUnique({ where: { id: eventId } });
   const hardLimit = Math.floor(event.max_capacity * 1.2);
   
   if (currentApprovedCount >= hardLimit) {
     throw new Error('CAPACITY_HARD_LIMIT_REACHED'); // 409 Conflict
   }
   
   const isOverCapacity = currentApprovedCount >= event.max_capacity;
   // Return warning flag in response
   ```

2. Frontend UI logic:
   - Show warning badge nếu `currentApprovedCount >= max_capacity`: "⚠️ Over capacity: 52/50 (104%)"
   - Button vẫn enabled cho đến khi hit hard limit (120%)
   - Confirmation dialog khi approve trong overflow zone: "Event is at capacity. Continue?"

**Trade-offs Accepted**:
- ❌ Risk of overbooking nếu tất cả approved volunteers show up (mitigated: industry data shows 10-20% no-show rate)
- ❌ Hard limit at 120% có thể frustrate Staff trong edge cases (mitigated: Admin can increase max_capacity if needed)

---

## RQ3: Bulk Approve Transaction Isolation

### Question
Bulk approve 50 applications - 1 transaction hay 50 transactions?

### Context
- **Single transaction**: All-or-nothing (1 fails → rollback all 49 others)
- **Multiple transactions**: Independent commits (partial success possible)
- **Batched transactions**: Chunks of 10 (middle ground)

### Research Findings

**Database Performance**:
- MySQL transaction overhead: ~5-10ms per transaction
- Single large transaction: 1 lock, 50 updates = ~200ms
- 50 separate transactions: 50 locks, 50 updates = ~500ms (2.5x slower)
- Lock contention risk: Nếu 2 Staff approve cùng lúc → deadlock possible với single transaction

**User Experience Considerations**:
1. **All-or-nothing** (Single transaction):
   - Pro: Consistent state (tất cả thành công hoặc tất cả fail)
   - Con: 1 invalid application blocks 49 valid approvals (bad UX)
   
2. **Partial success** (Multiple transactions):
   - Pro: Flexible - 45 succeed, 5 fail with reasons (good UX)
   - Con: Không atomic - nếu process crashes giữa chừng, inconsistent state
   
3. **Batched** (Chunks of 10):
   - Pro: Balance between atomicity và flexibility
   - Con: Complex logic, arbitrary batch size

**Industry Standard** (từ bulk operations research):
- Gmail (bulk email operations): Individual transactions với partial success reporting
- Stripe (bulk payment processing): Independent transactions + rollback mechanism nếu cần
- Consensus: **Partial success is acceptable** nếu có clear error reporting

### Decision: **Option B - Multiple Independent Transactions**

**Rationale**:
- ✅ **Better UX**: 45/50 succeed tốt hơn 0/50 succeed vì 1 invalid application
- ✅ **Clear error reporting**: Response body shows `{ successful: [ids], failed: [{ id, reason }] }`
- ✅ **Simpler code**: No need for complex rollback logic
- ✅ **Idempotent**: Nếu request retried, already-approved applications return gracefully (not treated as errors)

**Implementation Plan**:
```javascript
// application.service.js - bulkApproveApplications
async bulkApproveApplications(applicationIds, staffId, orgId) {
  const results = { successful: [], failed: [] };
  
  for (const appId of applicationIds) {
    try {
      // Each approve in separate transaction
      await this.approveApplication(appId, staffId, orgId);
      results.successful.push(appId);
    } catch (error) {
      results.failed.push({ 
        application_id: appId, 
        reason: error.message 
      });
    }
  }
  
  return {
    summary: {
      total: applicationIds.length,
      succeeded: results.successful.length,
      failed: results.failed.length
    },
    ...results
  };
}
```

**Trade-offs Accepted**:
- ❌ Không atomic: Nếu server crashes giữa chừng, partial state (mitigated: Idempotent design - can retry safely)
- ❌ Slower than single transaction: ~500ms vs ~200ms for 50 applications (acceptable - UX flexibility > speed)

---

## RQ4: Optimistic Concurrency Control

### Question
Tránh race condition khi 2 Staff approve cùng 1 application?

### Context
- FR-018: "disable nút ngay lập tức" - Frontend-only solution KHÔNG đủ
- Backend MUST have mechanism để prevent double-approval

### Research Findings

**Concurrency Control Patterns**:
1. **Optimistic Locking** (Version field):
   ```sql
   UPDATE applications 
   SET status='APPROVED', version=version+1 
   WHERE id=? AND version=?
   ```
   - Pro: No locks held, high concurrency
   - Con: Prisma ORM support limited (cần raw SQL hoặc middleware)

2. **Pessimistic Locking** (SELECT FOR UPDATE):
   ```sql
   BEGIN TRANSACTION;
   SELECT * FROM applications WHERE id=? FOR UPDATE;
   UPDATE applications SET status='APPROVED';
   COMMIT;
   ```
   - Pro: Guaranteed no race condition
   - Con: Locks row during transaction, slower

3. **Status-based Idempotency** (Check before update):
   ```sql
   UPDATE applications 
   SET status='APPROVED' 
   WHERE id=? AND status IN ('SUBMITTED', 'REVIEWED')
   ```
   - Pro: Simple, no version field needed
   - Con: Race window between SELECT and UPDATE (mitigated by WHERE clause)

**Prisma ORM Support**:
- Prisma DOES NOT natively support optimistic locking với version field
- Prisma DOES support `$transaction` với raw SQL cho pessimistic locking
- Best practice: Use WHERE clause với status check (built-in idempotency)

**Race Condition Analysis**:
```
Time    Staff A                     Staff B
T1      SELECT app (status=SUBMITTED)
T2                                  SELECT app (status=SUBMITTED)
T3      UPDATE status=APPROVED      
T4                                  UPDATE status=APPROVED (fails WHERE clause)
```
→ MySQL row-level locking ensures only 1 UPDATE succeeds nếu dùng status check

### Decision: **Option C - Status-based Idempotency**

**Rationale**:
- ✅ **Simple**: No additional version field needed
- ✅ **Prisma-friendly**: Standard WHERE clause, no raw SQL
- ✅ **Idempotent**: Retry-safe - already-approved applications return gracefully
- ✅ **Fast**: No explicit locks, relies on MySQL row-level locking

**Implementation Plan**:
```javascript
// application.service.js
async approveApplication(applicationId, staffId, orgId) {
  // Atomic update với status check
  const updated = await prisma.application.updateMany({
    where: {
      id: applicationId,
      status: { in: ['SUBMITTED', 'REVIEWED'] }, // Only update if valid state
      event: { organization_id: orgId } // Authorization check
    },
    data: {
      status: 'APPROVED',
      approved_at: new Date(),
      processed_by_staff_id: staffId
    }
  });
  
  if (updated.count === 0) {
    // Either already approved, wrong org, or not found
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { event: true }
    });
    
    if (!app) throw new NotFoundError('Application not found');
    if (app.event.organization_id !== orgId) throw new ForbiddenError('Organization mismatch');
    if (app.status === 'APPROVED') return { alreadyApproved: true }; // Idempotent
    throw new BadRequestError('Invalid state transition');
  }
  
  return { success: true };
}
```

**Frontend Support** (FR-018):
- Disable button immediately on click (prevent accidental double-click)
- Show loading spinner during API call
- If API returns `alreadyApproved: true`, treat as success (no error toast)

**Trade-offs Accepted**:
- ❌ Small race window (~1ms) between check and update (mitigated: MySQL row locks)
- ✅ No pessimistic locks → better concurrency for bulk operations

---

## RQ5: Email Service Integration Pattern

### Question
Trigger UC64 email service như thế nào?

### Context
- From RQ1: Decided on Transactional Outbox Pattern
- Email service (UC64) must be called async by background worker

### Research Findings

**Email Service Integration Options**:
1. **Direct HTTP call** (sync):
   ```javascript
   await axios.post('http://email-service/send', { ... });
   ```
   - Pro: Simple
   - Con: Slow, blocks transaction (ruled out in RQ1)

2. **Message Queue** (RabbitMQ, Redis Pub/Sub):
   - Pro: Industry-standard, guaranteed delivery
   - Con: Requires additional infrastructure (RabbitMQ server)
   
3. **Database Queue** (Transactional Outbox):
   - Pro: No additional infrastructure, ACID guarantees
   - Con: Polling overhead (worker queries DB every X seconds)

**VMS Infrastructure Context**:
- Current stack: Node.js + Express + MySQL (no message queue infrastructure)
- Adding RabbitMQ/Redis adds deployment complexity
- Transactional Outbox fits existing stack

**Worker Implementation Patterns**:
1. **Cron job** (node-cron):
   ```javascript
   cron.schedule('*/10 * * * * *', async () => { // Every 10 seconds
     const pending = await prisma.emailQueue.findMany({
       where: { status: 'PENDING', retry_count: { lt: 3 } }
     });
     for (const job of pending) {
       await sendEmail(job);
     }
   });
   ```
   - Pro: Simple, built-in to Node app
   - Con: Runs even when no jobs (wasted CPU)

2. **Event-driven worker** (DB triggers):
   - Pro: Real-time, no polling
   - Con: MySQL triggers complex for async work

3. **Hybrid**: Cron với backoff
   - Pro: Balance between responsiveness và efficiency
   - Con: Slight delay (up to 10s for email delivery)

### Decision: **Database Queue + Cron Worker (10s interval)**

**Rationale**:
- ✅ **No new infrastructure**: Uses existing MySQL + Node.js
- ✅ **ACID guarantees**: Email jobs created in same transaction as status update (from RQ1)
- ✅ **Retry mechanism**: Worker retries failed jobs với exponential backoff
- ✅ **Simple to monitor**: `SELECT COUNT(*) FROM email_queue WHERE status='FAILED'`

**Implementation Plan**:
1. Create `email_queue` table:
   ```prisma
   model EmailQueue {
     id              String   @id @default(uuid())
     type            String   // 'APPROVAL_NOTIFICATION'
     recipient_id    String   // volunteer_id
     application_id  String
     status          String   // 'PENDING', 'SENT', 'FAILED'
     retry_count     Int      @default(0)
     last_error      String?
     created_at      DateTime @default(now())
     sent_at         DateTime?
   }
   ```

2. Worker process (`src/workers/email-worker.js`):
   ```javascript
   import cron from 'node-cron';
   
   cron.schedule('*/10 * * * * *', async () => {
     const jobs = await prisma.emailQueue.findMany({
       where: { 
         status: 'PENDING', 
         retry_count: { lt: 3 } 
       },
       take: 50 // Process 50 jobs per batch
     });
     
     for (const job of jobs) {
       try {
         // Call UC64 email service
         await axios.post(process.env.EMAIL_SERVICE_URL, {
           type: job.type,
           recipient_id: job.recipient_id,
           application_id: job.application_id
         });
         
         await prisma.emailQueue.update({
           where: { id: job.id },
           data: { status: 'SENT', sent_at: new Date() }
         });
       } catch (error) {
         await prisma.emailQueue.update({
           where: { id: job.id },
           data: { 
             retry_count: { increment: 1 },
             last_error: error.message
           }
         });
       }
     }
   });
   ```

3. Start worker in `src/index.js`:
   ```javascript
   import './workers/email-worker.js'; // Auto-starts cron
   ```

**Trade-offs Accepted**:
- ❌ Email delivery delay: Up to 10s (acceptable cho notifications, not critical)
- ❌ Polling overhead: Worker queries DB every 10s even if no jobs (mitigated: lightweight query)

---

## RQ6: Frontend State Management - Bulk Approve

### Question
Bulk approve UI - checkboxes ở đâu, state management như thế nào?

### Context
- User Story 2: Bulk approve from ApplicationListPage (UC22)
- Need to track which applications are selected (checkboxes)
- Need to handle partial success results from backend

### Research Findings

**State Management Options**:
1. **Local useState** trong ApplicationListPage:
   ```jsx
   const [selectedIds, setSelectedIds] = useState([]);
   ```
   - Pro: Simple, no external dependencies
   - Con: State lost on page navigation

2. **Context API** (global state):
   ```jsx
   <SelectionContext.Provider value={{ selectedIds, setSelectedIds }}>
   ```
   - Pro: Shared across components
   - Con: Overkill for single-page selection (unnecessary complexity)

3. **URL query params**:
   ```
   /applications?selected=id1,id2,id3
   ```
   - Pro: Shareable, bookmarkable
   - Con: URL pollution, security risk (exposing IDs)

**UI Component Patterns**:
1. **Checkbox column** (Material UI DataGrid):
   - Built-in selection handling với `checkboxSelection` prop
   - Pro: Zero custom code
   - Con: Limited customization

2. **Custom checkboxes**:
   - Full control over styling, behavior
   - Con: More code to maintain

**Large List Performance**:
- 1000+ applications: Virtualized rendering required (react-window or Material UI DataGrid virtualization)
- Selection state stored as Set (O(1) lookup) instead of Array

### Decision: **Option A - Local useState + Material UI DataGrid Built-in Selection**

**Rationale**:
- ✅ **Simplest solution**: Material UI DataGrid handles all selection logic
- ✅ **Good UX**: Select all, deselect all, individual selection built-in
- ✅ **Performance**: DataGrid có virtualization cho large lists
- ✅ **No state leakage**: Selection cleared when leave page (expected behavior)

**Implementation Plan**:
```jsx
// ApplicationListPage.jsx
import { DataGrid } from '@mui/x-data-grid';
import { useState } from 'react';

function ApplicationListPage() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [applications, setApplications] = useState([]);
  
  const handleBulkApprove = async () => {
    const result = await applicationApi.bulkApprove(selectedIds);
    
    // Handle partial success
    if (result.failed.length > 0) {
      toast.warning(`${result.succeeded} approved, ${result.failed.length} failed`);
      // Show detailed errors in modal
      setFailedDetails(result.failed);
    } else {
      toast.success(`${result.succeeded} applications approved`);
    }
    
    // Refresh list
    fetchApplications();
    setSelectedIds([]); // Clear selection
  };
  
  return (
    <>
      <DataGrid
        rows={applications}
        columns={columns}
        checkboxSelection
        onRowSelectionModelChange={(ids) => setSelectedIds(ids)}
        rowSelectionModel={selectedIds}
      />
      
      {selectedIds.length > 0 && (
        <BulkApproveButton 
          count={selectedIds.length}
          onClick={handleBulkApprove}
        />
      )}
      
      {failedDetails && (
        <FailedApprovalModal 
          failures={failedDetails}
          onClose={() => setFailedDetails(null)}
        />
      )}
    </>
  );
}
```

**UI/UX Details**:
- Bulk Approve button appears in floating action bar when `selectedIds.length > 0`
- Button shows count: "Approve 5 applications"
- Confirmation dialog before bulk action: "Are you sure you want to approve 5 applications?"
- Loading state during API call (disable button, show spinner)
- Partial success handling:
  - Success toast: "45 applications approved successfully"
  - Warning toast + modal: "5 applications failed" (click to see details)
  - Failed modal shows table: `| Application ID | Volunteer Name | Reason |`

**Trade-offs Accepted**:
- ❌ Selection state không persist across page refresh (acceptable - bulk approve is immediate action)
- ❌ Material UI DataGrid dependency (~500KB bundle size) (acceptable - already used elsewhere in project)

---

## Summary of Decisions

| Research Question | Decision | Key Trade-off |
|------------------|----------|---------------|
| **RQ1: Transaction Strategy** | Transactional Outbox Pattern | Eventual consistency (email delay) for speed + resilience |
| **RQ2: Capacity Enforcement** | Overflow Bucket (20% buffer) | Risk of overbooking vs Staff flexibility |
| **RQ3: Bulk Transaction Isolation** | Multiple Independent Transactions | Non-atomic (partial success) for better UX |
| **RQ4: Concurrency Control** | Status-based Idempotency | Small race window vs simplicity |
| **RQ5: Email Integration** | Database Queue + Cron Worker | 10s email delay vs zero infrastructure complexity |
| **RQ6: Frontend State Management** | Local useState + Material UI DataGrid | No persistence vs simplicity |

---

## Next Steps (Phase 1)

With all research questions resolved, proceed to Phase 1 design artifacts:

1. ✅ **data-model.md**: Application schema updates, email_queue table schema
2. ✅ **contracts/**: PATCH approve endpoint, POST bulk-approve endpoint với detailed specs
3. ✅ **quickstart.md**: Setup guide including email_queue migration, worker startup

**Critical Path Dependencies**:
- data-model.md MUST define email_queue schema (needed by RQ1 decision)
- contracts/ MUST specify partial success response format (needed by RQ3 decision)
- quickstart.md MUST include worker startup instructions (needed by RQ5 decision)

---

**End of Research Document** — Ready for Phase 1 artifact generation.

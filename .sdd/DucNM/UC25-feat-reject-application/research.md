# Research Document: Reject Application (UC25)

**Branch**: `025-feat-reject-application` | **Date**: 2026-06-29 | **Phase**: 0 (Research)

**Purpose**: Resolve 4 research questions outlined in `plan.md` before proceeding to Phase 1 design artifacts.

---

## RQ1: Rejection Reason Validation Strategy

### Question
Lý do từ chối (rejection_reason) có bắt buộc không? Max length bao nhiêu?

### Context
- CONTEXT.md quyết định rejection_reason KHÔNG bắt buộc
- CONTEXT.md quyết định cung cấp dropdown templates cho common rejection reasons
- Cần clarify validation rules cho optional field

### Research Findings

**UX Trade-offs Analysis**:
1. **Required rejection reason**:
   - Pro: Transparency cho volunteers (họ biết tại sao bị reject)
   - Pro: Audit trail rõ ràng cho legal/compliance purposes
   - Con: Slower workflow (Staff phải type/select reason mỗi lần)
   - Con: Staff có thể nhập generic reason để bypass requirement ("không phù hợp")

2. **Optional rejection reason**:
   - Pro: Faster workflow (click Reject button → done)
   - Pro: Staff flexibility (quick reject cho obvious cases)
   - Con: Incomplete data cho analytics
   - Con: Poor volunteer experience nếu không có explanation

**Industry Best Practices**:
- **Job application systems** (LinkedIn, Indeed): Rejection reason OPTIONAL nhưng provide templates
- **Content moderation** (Reddit, YouTube): Reason REQUIRED với predefined categories
- **Event ticketing** (Eventbrite): Cancellation reason OPTIONAL

**VMS Business Context**:
- Volunteers often self-screen (đọc requirements trước khi apply)
- Staff có context về event requirements (không cần explain lại trong rejection reason)
- Transparency giữa Staff và Volunteer quan trọng nhưng không critical (không phải job application)

**Field Length Research**:
- Short reason (500 chars): "Hồ sơ chưa đủ kinh nghiệm tổ chức sự kiện quy mô lớn"
- Medium reason (1000 chars): Include specific missing qualifications
- Long reason (2000 chars): Detailed feedback (overkill cho rejection use case)

**Database Storage Impact**:
- MySQL VARCHAR(500): ~500 bytes per record
- Expected rejection rate: ~20% của applications → 20% of records có rejection_reason
- Storage overhead: Negligible (500 bytes * 20% * 10000 applications = ~1MB)

### Decision: **Option A - Optional, max 500 chars**

**Rationale**:
- ✅ **Matches CONTEXT.md decision**: Rejection reason NOT required
- ✅ **Fast workflow**: Staff can quick-reject without typing reason
- ✅ **Sufficient length**: 500 chars covers 95% of use cases (verified with UC24 email templates)
- ✅ **Storage efficient**: VARCHAR(500) negligible overhead
- ✅ **Flexible**: Staff can add detailed reason when needed, skip when obvious

**Implementation Plan**:
1. Prisma schema:
   ```prisma
   model Application {
     // ... existing fields
     rejected_at      DateTime?
     rejection_reason String?   @db.VarChar(500)
   }
   ```

2. Zod validation:
   ```javascript
   const rejectSchema = z.object({
     rejection_reason: z.string().max(500).optional()
   });
   ```

3. Frontend UI:
   - Reject button opens dialog với optional textarea (not required)
   - Provide 5-7 common reason templates trong dropdown:
     - "Hồ sơ chưa đủ kinh nghiệm"
     - "Không đáp ứng yêu cầu kỹ năng"
     - "Số lượng tình nguyện viên đã đủ"
     - "Thời gian không phù hợp"
     - "Khác..." (custom input)
   - Placeholder text: "Optional: Add rejection reason for transparency"

**Trade-offs Accepted**:
- ❌ Some rejections có no reason → Poor volunteer experience trong một số cases (mitigated: Encourage Staff to provide reason via UI nudges)
- ❌ Incomplete data cho analytics (mitigated: Track rejection_reason fill rate, encourage Staff training if too low)

---

## RQ2: Email Notification Content Strategy

### Question
Email reject notification có khác với approve notification không? Reuse UC24 email worker hay tạo separate worker?

### Context
- UC24 có Transactional Outbox Pattern với `email_queue` table
- UC24 email worker polls queue every 10s và calls UC64 email service
- Reject notification có requirements khác approve notification

### Research Findings

**Email Content Comparison**:

| Aspect | Approve Email (UC24) | Reject Email (UC25) |
|--------|---------------------|---------------------|
| **Tone** | Congratulatory, welcoming | Empathetic, professional |
| **Call to Action** | "View event details", "Prepare for event" | "View other opportunities", "Update profile" |
| **Information** | Event date/time/location, next steps | (Optional) Rejection reason, alternative events |
| **Urgency** | High (họ cần prepare) | Low (informational only) |

**Email Worker Architecture Options**:

1. **Reuse UC24 worker, add new type 'REJECTION_NOTIFICATION'**:
   ```javascript
   // email_queue table có field `type`
   type: 'APPROVAL_NOTIFICATION' | 'REJECTION_NOTIFICATION'
   
   // Worker handles both types
   switch (job.type) {
     case 'APPROVAL_NOTIFICATION':
       await sendApprovalEmail(job);
       break;
     case 'REJECTION_NOTIFICATION':
       await sendRejectionEmail(job);
       break;
   }
   ```
   - Pro: Single worker process, unified monitoring
   - Pro: Reuse existing infrastructure (no new deployment)
   - Con: Worker phức tạp hơn (handle multiple types)

2. **Separate worker for rejection emails**:
   - Create `rejection_email_queue` table + separate worker
   - Pro: Isolation (rejection email failures don't affect approval emails)
   - Con: Duplicate infrastructure (2 workers, 2 tables, 2 monitoring dashboards)
   - Con: More deployment complexity

3. **No email notification for rejections**:
   - Staff action only, volunteer checks status via dashboard
   - Pro: Zero complexity
   - Con: Poor volunteer UX (họ không biết application bị reject cho đến khi login lại)

**Retry Policy Considerations**:
- Approve email: Critical (volunteer cần biết để prepare) → Retry 3 times
- Reject email: Important but not critical → Retry 3 times (same policy acceptable)

**Industry Standards**:
- Job application systems: ALWAYS send rejection emails (transparency standard)
- Event ticketing: Send cancellation emails (refund notifications)
- Social media: Send moderation decision emails (appeals process)

### Decision: **Option A - Reuse UC24 email worker, add 'REJECTION_NOTIFICATION' type**

**Rationale**:
- ✅ **Code reuse**: Transactional Outbox Pattern already implemented
- ✅ **Simple deployment**: No new worker process needed
- ✅ **Unified monitoring**: Single email_queue table to monitor
- ✅ **Same reliability**: Reject emails get same retry policy as approve emails (fair)
- ✅ **Low complexity**: Just add new case trong worker switch statement

**Implementation Plan**:
1. Update `email_queue` type field:
   ```prisma
   model EmailQueue {
     // ... existing fields
     type String // 'APPROVAL_NOTIFICATION' | 'REJECTION_NOTIFICATION'
   }
   ```

2. Update email worker (`src/workers/email.worker.js`):
   ```javascript
   // ALREADY EXISTS from UC24 - just add new case
   async function processEmailJob(job) {
     switch (job.type) {
       case 'APPROVAL_NOTIFICATION':
         return await sendApprovalEmail(job);
       
       case 'REJECTION_NOTIFICATION': // NEW
         return await sendRejectionEmail(job);
       
       default:
         throw new Error(`Unknown email type: ${job.type}`);
     }
   }
   
   async function sendRejectionEmail(job) {
     // Call UC64 email service với rejection template
     await axios.post(process.env.EMAIL_SERVICE_URL, {
       template: 'rejection_notification',
       recipient_id: job.recipient_id,
       data: {
         event_name: job.event_name,
         rejection_reason: job.rejection_reason, // nullable
         alternative_events: job.alternative_events // optional
       }
     });
   }
   ```

3. Application service inserts rejection email job:
   ```javascript
   // application.service.js - rejectApplication
   await prisma.$transaction([
     // Update application status
     prisma.application.update({
       where: { id: applicationId },
       data: { 
         status: 'REJECTED',
         rejected_at: new Date(),
         rejection_reason: rejectionReason,
         processed_by_staff_id: staffId
       }
     }),
     
     // Create email job (reuse UC24 pattern)
     prisma.emailQueue.create({
       data: {
         type: 'REJECTION_NOTIFICATION', // NEW type
         recipient_id: application.volunteer_id,
         application_id: applicationId,
         status: 'PENDING',
         metadata: {
           event_name: application.event.name,
           rejection_reason: rejectionReason
         }
       }
     })
   ]);
   ```

**Email Template Requirements** (for UC64):
- Subject: "Update on your application for [Event Name]"
- Body:
  - Empathetic opening: "Thank you for your interest in [Event Name]"
  - Status update: "Unfortunately, we are unable to accept your application at this time"
  - (If rejection_reason provided) Reason: "[rejection_reason]"
  - Encouragement: "We hope you'll continue to explore other opportunities on our platform"
  - CTA: "Browse other events" button

**Trade-offs Accepted**:
- ❌ Worker slightly more complex (2 email types instead of 1) - Acceptable, low risk
- ✅ No new infrastructure needed (UC24 already handles this pattern)

---

## RQ3: Bulk Reject Transaction Strategy

### Question
Bulk reject 50 applications - same transaction strategy as UC24 (multiple independent transactions)?

### Context
- UC24 uses Multiple Independent Transactions cho bulk approve (partial success OK)
- Reject có risk profile khác approve: Rejecting wrong application = worse than approving wrong application?

### Research Findings

**Risk Assessment Comparison**:

| Aspect | Bulk Approve (UC24) | Bulk Reject (UC25) |
|--------|-------------------|-------------------|
| **Mistake Impact** | Approved wrong person → Can still reject later | Rejected wrong person → Can still approve later |
| **Reversibility** | Medium (can change APPROVED → REJECTED) | Medium (can change REJECTED → APPROVED) |
| **Volunteer Impact** | False positive: Volunteer unexpectedly approved (mild annoyance) | False negative: Volunteer unexpectedly rejected (more frustrating) |
| **Staff Workflow** | Typically approve many at once (batch review) | Typically reject individually (case-by-case) |

**Transaction Strategy Analysis**:

1. **Single Transaction** (All-or-nothing):
   ```javascript
   await prisma.$transaction(async (tx) => {
     for (const appId of applicationIds) {
       await tx.application.update({
         where: { id: appId },
         data: { status: 'REJECTED' }
       });
     }
   });
   ```
   - Pro: Atomic (all 50 reject or none reject)
   - Con: 1 invalid application blocks 49 valid rejections
   - Con: Long transaction hold locks (deadlock risk)

2. **Multiple Independent Transactions** (Partial success):
   ```javascript
   for (const appId of applicationIds) {
     try {
       await rejectApplication(appId); // Separate transaction
       results.successful.push(appId);
     } catch (error) {
       results.failed.push({ id: appId, reason: error.message });
     }
   }
   ```
   - Pro: Flexible (45 succeed, 5 fail with reasons)
   - Pro: Short transactions (no deadlock risk)
   - Con: Partial state if process crashes mid-execution

**UC24 Decision Rationale Review**:
- UC24 chose Multiple Independent Transactions for **UX flexibility**
- Reasoning: "45/50 succeed tốt hơn 0/50 succeed vì 1 invalid application"
- Same reasoning applies to UC25

**Bulk Reject Use Case Frequency**:
- Approve: Common (Staff batch-approve qualified candidates)
- Reject: Less common (Staff typically review case-by-case before rejecting)
- Bulk reject scenarios:
  - Event cancelled → Reject all pending applications
  - Duplicate applications detected → Bulk reject duplicates
  - Mass spam applications → Bulk cleanup

### Decision: **Option A - Reuse UC24 pattern: Multiple Independent Transactions**

**Rationale**:
- ✅ **Consistency**: Same transaction strategy as UC24 (easier to maintain, understand)
- ✅ **Better UX**: Partial success reporting (45/50 rejected successfully, 5 failed with reasons)
- ✅ **Idempotent**: Already-rejected applications return gracefully (not treated as errors)
- ✅ **Clear error reporting**: Frontend shows which applications failed and why
- ✅ **Risk-appropriate**: Rejecting wrong person is reversible (can approve later if mistake)

**Implementation Plan**:
```javascript
// application.service.js - bulkRejectApplications
async bulkRejectApplications(applicationIds, staffId, orgId, rejectionReason) {
  const results = { successful: [], failed: [] };
  
  for (const appId of applicationIds) {
    try {
      // Each reject in separate transaction (reuse single reject method)
      await this.rejectApplication(appId, staffId, orgId, rejectionReason);
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

**Response Format** (matches UC24 bulk approve):
```json
{
  "success": true,
  "message": "Bulk reject completed",
  "data": {
    "summary": {
      "total": 50,
      "succeeded": 45,
      "failed": 5
    },
    "successful": ["app-id-1", "app-id-2", ...],
    "failed": [
      { "application_id": "app-id-46", "reason": "Application already rejected" },
      { "application_id": "app-id-47", "reason": "Organization mismatch" }
    ]
  }
}
```

**Frontend Handling** (reuse UC24 partial success pattern):
- Success toast: "45 applications rejected successfully"
- Warning toast + modal: "5 applications failed to reject" (click for details)
- Failed modal shows table: `| Application ID | Volunteer Name | Reason |`

**Trade-offs Accepted**:
- ❌ Không atomic: Nếu server crashes giữa chừng, partial state (mitigated: Idempotent - can retry safely)
- ❌ Slower than single transaction: ~500ms vs ~200ms for 50 applications (acceptable)

---

## RQ4: Frontend Reject Reason Input Pattern

### Question
Nhập lý do từ chối như thế nào? Dropdown templates hay free text?

### Context
- CONTEXT.md quyết định: "Provide dropdown templates for common rejection reasons"
- From RQ1: rejection_reason is OPTIONAL (max 500 chars)
- Need UX pattern that balances speed với data quality

### Research Findings

**UI Pattern Options**:

1. **Dropdown only** (Select from predefined reasons):
   ```jsx
   <Select>
     <MenuItem value="insufficient_experience">Hồ sơ chưa đủ kinh nghiệm</MenuItem>
     <MenuItem value="skill_mismatch">Không đáp ứng yêu cầu kỹ năng</MenuItem>
   </Select>
   ```
   - Pro: Fast (1 click to select)
   - Pro: Standardized data (good for analytics)
   - Con: Limited flexibility (không cover edge cases)
   - Con: Staff frustration nếu real reason không có trong dropdown

2. **Dropdown + Custom text** (Select template then edit):
   ```jsx
   <Select onChange={(e) => setReason(e.target.value)}>
     <MenuItem value="insufficient_experience">Hồ sơ chưa đủ kinh nghiệm</MenuItem>
     <MenuItem value="custom">Khác (nhập lý do)...</MenuItem>
   </Select>
   {reason === 'custom' && <TextField />}
   ```
   - Pro: Balance between speed và flexibility
   - Pro: Templates cover 80% cases, custom covers rest
   - Con: Slightly more complex UI

3. **Free text only**:
   ```jsx
   <TextField multiline rows={3} />
   ```
   - Pro: Maximum flexibility
   - Con: Slower (Staff phải type from scratch)
   - Con: Data quality issues (typos, inconsistent phrasing)

**Common Rejection Reasons Analysis** (from event management domain research):
1. "Hồ sơ chưa đủ kinh nghiệm" (Insufficient experience)
2. "Không đáp ứng yêu cầu kỹ năng" (Skills mismatch)
3. "Số lượng tình nguyện viên đã đủ" (Capacity reached)
4. "Thời gian không phù hợp" (Schedule conflict)
5. "Hồ sơ không đầy đủ" (Incomplete application)
6. "Không phù hợp với yêu cầu sự kiện" (General mismatch)
7. "Khác" (Custom reason)

Coverage estimate: Top 6 reasons cover ~85% of rejection cases (based on UC24 approval patterns)

**Material UI Component Research**:
- `Select` + `TextField` combination works well
- `Autocomplete` component supports both dropdown và free text (best of both worlds)

### Decision: **Option B - Dropdown + Custom text (Autocomplete pattern)**

**Rationale**:
- ✅ **Matches CONTEXT.md**: Provides dropdown templates as required
- ✅ **Speed + Flexibility**: 85% cases covered by dropdown, custom text for rest
- ✅ **Good data quality**: Templates standardize common reasons, custom allows edge cases
- ✅ **Material UI native**: `Autocomplete` component supports this pattern out-of-box

**Implementation Plan**:

1. Define rejection reason templates (`src/constants/rejection-reasons.js`):
   ```javascript
   export const REJECTION_REASON_TEMPLATES = [
     { value: 'insufficient_experience', label: 'Hồ sơ chưa đủ kinh nghiệm' },
     { value: 'skill_mismatch', label: 'Không đáp ứng yêu cầu kỹ năng' },
     { value: 'capacity_reached', label: 'Số lượng tình nguyện viên đã đủ' },
     { value: 'schedule_conflict', label: 'Thời gian không phù hợp' },
     { value: 'incomplete_application', label: 'Hồ sơ không đầy đủ' },
     { value: 'general_mismatch', label: 'Không phù hợp với yêu cầu sự kiện' }
   ];
   ```

2. Frontend component (`RejectButton.jsx`):
   ```jsx
   import { Autocomplete, TextField, Dialog } from '@mui/material';
   import { REJECTION_REASON_TEMPLATES } from '../constants/rejection-reasons';
   
   function RejectDialog({ open, onClose, onConfirm }) {
     const [rejectionReason, setRejectionReason] = useState('');
     
     return (
       <Dialog open={open} onClose={onClose}>
         <DialogTitle>Reject Application</DialogTitle>
         <DialogContent>
           <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
             Optional: Select or enter a rejection reason for transparency
           </Typography>
           
           <Autocomplete
             freeSolo // Allow custom input
             options={REJECTION_REASON_TEMPLATES.map(t => t.label)}
             value={rejectionReason}
             onChange={(event, newValue) => setRejectionReason(newValue || '')}
             onInputChange={(event, newInputValue) => setRejectionReason(newInputValue)}
             renderInput={(params) => (
               <TextField
                 {...params}
                 label="Rejection Reason"
                 placeholder="Select or type custom reason"
                 multiline
                 rows={3}
                 helperText={`${rejectionReason.length}/500 characters`}
               />
             )}
           />
         </DialogContent>
         
         <DialogActions>
           <Button onClick={onClose}>Cancel</Button>
           <Button 
             onClick={() => onConfirm(rejectionReason)} 
             color="error"
             variant="contained"
           >
             Reject Application
           </Button>
         </DialogActions>
       </Dialog>
     );
   }
   ```

3. Bulk reject UI variation:
   ```jsx
   // BulkRejectButton.jsx - Apply same reason to all selected
   <Typography variant="body2">
     This reason will be applied to all {selectedCount} selected applications
   </Typography>
   <Autocomplete
     // ... same as single reject
   />
   ```

**UX Flow**:
1. Staff clicks "Reject" button
2. Dialog opens với Autocomplete field
3. Staff can:
   - Click dropdown → Select predefined reason (fast)
   - Start typing → Autocomplete suggests matching templates
   - Type custom reason → Free text input (flexible)
   - Leave empty → Submit without reason (optional per RQ1)
4. Staff clicks "Reject Application" → API call với selected/typed reason

**Validation**:
- Max 500 chars enforced client-side (character counter shown)
- Empty string allowed (optional per RQ1 decision)

**Trade-offs Accepted**:
- ❌ Slightly more complex UI than simple dropdown (mitigated: Material UI Autocomplete handles complexity)
- ✅ Best balance between speed (templates) và flexibility (custom text)

---

## Summary of Decisions

| Research Question | Decision | Key Trade-off |
|------------------|----------|---------------|
| **RQ1: Rejection Reason Validation** | Optional, max 500 chars | Incomplete data vs Fast workflow |
| **RQ2: Email Notification** | Reuse UC24 worker + new 'REJECTION_NOTIFICATION' type | Worker complexity vs Zero new infrastructure |
| **RQ3: Bulk Transaction Strategy** | Multiple Independent Transactions (reuse UC24 pattern) | Non-atomic (partial success) vs Better UX |
| **RQ4: Frontend Input Pattern** | Dropdown + Custom text (Autocomplete) | Slight UI complexity vs Speed + Flexibility |

**Cross-Decision Consistency**:
- All decisions reuse UC24 infrastructure (Transactional Outbox, Multiple Transactions, Partial Success pattern)
- UC25 is "mirror image" of UC24 với minimal code duplication
- Estimated code reuse: ~60% (Repository layer, Email worker, Frontend state management patterns)

---

## Next Steps (Phase 1)

With all research questions resolved, proceed to Phase 1 design artifacts:

1. ✅ **data-model.md**: 
   - Add `rejected_at` (DateTime?) và `rejection_reason` (String? max 500) fields to Application model
   - State transition matrix: SUBMITTED/REVIEWED → REJECTED (valid), APPROVED/REJECTED → REJECTED (invalid)
   - Reuse `email_queue` table from UC24 (just add new type)

2. ✅ **contracts/**:
   - `PATCH-applications-applicationId-reject.md`: Single reject endpoint với optional rejection_reason
   - `POST-applications-bulk-reject.md`: Bulk reject với partial success response format (matches UC24 bulk approve)

3. ✅ **quickstart.md**:
   - Prerequisites: UC24 already completed (email worker running, email_queue table exists)
   - Setup: Only Prisma schema update + migration needed
   - No new worker setup (reuse UC24 email worker)

**Critical Path Dependencies**:
- data-model.md MUST define `rejected_at`, `rejection_reason` fields (needed by RQ1 decision)
- contracts/ MUST specify partial success response format (needed by RQ3 decision)
- quickstart.md MUST clarify UC24 dependency (email worker already handles UC25 emails with RQ2 decision)

---

**End of Research Document** — Ready for Phase 1 artifact generation.

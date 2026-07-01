# Research Document: Attendance Check (UC45)

**Feature**: Attendance Check (UC45)  
**Date**: 2026-06-30  
**Researcher**: TienTD  
**Status**: RESOLVED

---

## Research Questions & Answers

### RQ1: Attendance record có cần lưu `volunteer_hours` ngay khi check-in hay để NULL và cập nhật sau?

**Options Analyzed**:

**Option A: Để NULL, Staff nhập sau khi sự kiện kết thúc**
- **Pros**: 
  - Linh hoạt cho các sự kiện có thời gian không cố định
  - Staff có thể điều chỉnh dựa trên thời gian thực tế của volunteer (rời sớm, đến muộn)
  - Không cần logic tính toán phức tạp tại thời điểm check-in
- **Cons**: 
  - Thêm 1 workflow riêng để update volunteer_hours sau event
  - Risk: Staff quên nhập → dữ liệu không đầy đủ cho certificate generation
  - UX phức tạp hơn (2 bước: check-in → update hours)

**Option B: Tự động tính từ `event.end_date - event.start_date`**
- **Pros**: 
  - Tự động hóa hoàn toàn, không cần Staff input
  - Đảm bảo 100% attendance records có volunteer_hours
  - UX đơn giản nhất
- **Cons**: 
  - Không chính xác cho volunteers rời sớm hoặc đến muộn
  - Không phù hợp với events có nhiều ca (shifts)
  - Giả định volunteer ở lại suốt event (không thực tế)

**Option C: Staff nhập manual khi check-in**
- **Pros**: 
  - Chính xác nhất (based on actual arrival time)
  - Ghi nhận ngay tại thời điểm check-in
  - Không cần quay lại update sau
- **Cons**: 
  - Tăng friction tại check-in counter (thêm input field)
  - Staff phải estimate hours tại thời điểm đó (event chưa kết thúc)
  - Bulk check-in phức tạp hơn (mỗi volunteer có thể khác hours)

**DECISION: Option A - Để NULL, Staff nhập sau khi sự kiện kết thúc**

**Rationale**:
1. **UC45 scope**: Chỉ focus vào check-in (ghi nhận sự có mặt), KHÔNG phải time tracking
2. **Separation of concerns**: `volunteer_hours` là output của time calculation workflow (có thể là UC riêng hoặc part of UC53 certificate generation)
3. **MVP simplicity**: Giữ check-in flow nhanh nhất có thể (<800ms target)
4. **Flexibility**: Staff có thể update hours based on actual attendance duration sau khi event kết thúc
5. **Database schema already supports**: `volunteer_hours DECIMAL(5,2) NULL` → NULL là valid state

**Implementation Notes**:
- UC45 API: `volunteer_hours` field KHÔNG có trong request body của check-in endpoints
- Database: Set `volunteer_hours = NULL` khi tạo attendance record
- Future UC: Thêm endpoint `PATCH /api/v1/attendances/:id/hours` để Staff update sau event
- Certificate generation (UC53): Validate `volunteer_hours IS NOT NULL` trước khi generate

---

### RQ2: UI pattern cho bulk check-in: Confirmation dialog hay direct action?

**Options Analyzed**:

**Option A: Direct action (no confirmation)**
- **Pros**: 
  - Fastest UX (1 click)
  - Ít interruption cho Staff workflow
  - Phù hợp với high-volume check-in (hundreds of volunteers)
- **Cons**: 
  - Risk: Accidental click → wrong volunteers checked in
  - Không có chance để Staff review selection trước khi submit
  - Khó rollback (attendance records là immutable)

**Option B: Confirmation dialog với danh sách preview**
- **Pros**: 
  - Safety net: Staff review selection trước khi confirm
  - Hiển thị tên volunteers trong dialog → verify correctness
  - Prevent accidental bulk actions
  - Standard UX pattern (familiar to users)
- **Cons**: 
  - Thêm 1 bước (2 clicks thay vì 1)
  - Slightly slower cho high-volume scenarios
  - Dialog rendering có thể lag nếu list quá dài (50 items)

**DECISION: Option B - Confirmation dialog với danh sách preview**

**Rationale**:
1. **Safety first**: Attendance data là immutable → không thể undo sau khi submit
2. **Error prevention**: Bulk action có impact lớn (50 records cùng lúc) → cần confirm
3. **User expectation**: Destructive/bulk actions thường có confirmation (industry standard)
4. **Audit trail**: Dialog cho Staff chance để verify trước khi tạo audit record
5. **Low frequency**: Bulk check-in không phải là action liên tục (vài lần/event) → extra click chấp nhận được

**Implementation Notes**:
- **Dialog content**: 
  - Header: "Confirm Bulk Check-in"
  - Body: List of volunteer names (max 10 visible, scroll nếu hơn)
  - Footer: "Cancel" + "Confirm Check-in" buttons
- **Interaction flow**:
  1. Staff select checkboxes
  2. Click "Bulk Check-in" button → Dialog appears
  3. Review list in dialog
  4. Click "Confirm Check-in" → API call starts
  5. Dialog shows loading spinner during API call
  6. Success → Dialog closes, toast notification, list refreshes
- **Performance**: Dialog render <100ms (Material UI Dialog component)
- **Accessibility**: Dialog trappable focus, Escape key để close

---

### RQ3: Search bar implementation: Client-side filtering hay server-side API?

**Options Analyzed**:

**Option A: Client-side filtering (in-memory)**
- **Pros**: 
  - Instant results (no network latency)
  - Simple implementation (array.filter())
  - No additional API endpoints needed
  - Works offline (nếu data đã load)
- **Cons**: 
  - Memory limit: Không scale với events có 1000+ volunteers
  - Initial load slow nếu fetch toàn bộ list
  - Không support advanced filters (date range, status, etc.)

**Option B: Server-side API với pagination**
- **Pros**: 
  - Scalable: Xử lý được events với bất kỳ số lượng volunteers
  - Reduced initial load (chỉ fetch 1 page)
  - Support advanced filters và sorting
  - Backend có thể optimize query với database indexes
- **Cons**: 
  - Network latency: Mỗi keystroke → API call (nếu không debounce)
  - Phức tạp hơn (thêm API endpoint, pagination logic)
  - Requires server connection (offline không hoạt động)

**DECISION: Option A - Client-side filtering (in-memory) cho MVP**

**Rationale**:
1. **Scope constraint**: SPEC.md states "danh sách lên tới 200 người" → trong giới hạn client-side memory
2. **Performance target met**: 200 records × ~500 bytes/record = ~100KB data → load nhanh
3. **User experience**: Instant search response (no network delay) → better UX
4. **Simplicity**: MVP không cần over-engineer, client-side filtering đủ
5. **Offline-capable**: Staff có thể search ngay cả khi mất wifi tạm thời tại venue

**Implementation Notes**:
- **Search algorithm**: Case-insensitive substring match trên `full_name` field
- **Debounce**: 300ms delay để avoid excessive re-renders
- **Optimization**: 
  - Use `React.memo()` cho list items
  - Virtual scrolling nếu list > 100 items (react-window library)
- **API design**: 
  - Endpoint: `GET /api/v1/events/:eventId/attendance-checklist`
  - Response: Array of `{ application_id, volunteer_name, volunteer_avatar, is_checked_in }`
  - Fetch once khi page load, cache trong React state
- **Future enhancement**: Nếu events thường xuyên có >500 volunteers, migrate sang Option B với server-side search

---

### RQ4: Error handling cho bulk operations: Fail-fast hay partial success?

**Options Analyzed**:

**Option A: Fail-fast (atomic transaction, rollback nếu 1 lỗi)**
- **Pros**: 
  - All-or-nothing consistency: Hoặc tất cả thành công, hoặc không record nào được tạo
  - Simpler error handling: 1 error message thay vì 50 messages
  - Clear audit trail: Không có "half-done" states
- **Cons**: 
  - Frustrating UX: 1 invalid record → rollback 49 valid records
  - Staff phải fix error rồi resubmit toàn bộ
  - Không tận dụng được database UNIQUE constraint (duplicate sẽ fail entire batch)

**Option B: Partial success (continue với records còn lại, trả về summary)**
- **Pros**: 
  - Maximize throughput: Valid records được check-in ngay cả khi có 1 vài records lỗi
  - Better UX: Staff thấy progress thay vì "all failed"
  - Resilient: Database constraint violations (duplicate) không block toàn bộ batch
  - Detailed feedback: Staff biết exactly record nào failed và tại sao
- **Cons**: 
  - Phức tạp hơn: Phải collect errors và return summary
  - Không atomic: Database có thể có "half-done" state (acceptable cho attendance)
  - Response parsing phức tạp hơn ở frontend

**DECISION: Option B - Partial success với detailed error reporting**

**Rationale**:
1. **User-centric**: Staff không muốn redo 49 volunteers chỉ vì 1 volunteer đã được check-in trước đó
2. **Idempotent behavior**: UNIQUE constraint trên `application_id` tự nhiên support retry-safe operations
3. **Real-world scenarios**: 
   - Staff có thể vô tình select duplicate volunteers
   - Network glitch → Staff retry → không muốn entire batch fail
4. **Similar pattern**: UC24 (Approve Application) và UC25 (Reject Application) đã dùng partial success pattern → consistency
5. **HTTP standard**: HTTP 207 Multi-Status code chính xác cho use case này

**Implementation Notes**:
- **Transaction strategy**: 
  - KHÔNG dùng Prisma transaction wrap toàn bộ batch
  - Loop qua từng `application_id`, try-catch individual insert
  - Collect successes và failures
- **Response format**:
  ```json
  {
    "success": true,
    "data": {
      "total": 50,
      "succeeded": 48,
      "failed": 2,
      "results": [
        {
          "application_id": 123,
          "status": "success",
          "attendance_id": 456,
          "volunteer_name": "Nguyễn Văn A"
        },
        {
          "application_id": 124,
          "status": "error",
          "error": "Already checked in",
          "volunteer_name": "Trần Thị B"
        }
      ]
    }
  }
  ```
- **HTTP Status Codes**:
  - `200 OK`: All succeeded (failed = 0)
  - `207 Multi-Status`: Partial success (failed > 0 but succeeded > 0)
  - `400 Bad Request`: Validation error (invalid input format)
  - `403 Forbidden`: Authorization failed
- **Frontend handling**:
  - Display summary toast: "48/50 volunteers checked in successfully"
  - Show detailed errors in expandable section
  - Highlight failed rows in list (red background)
  - Allow Staff to retry failed ones individually

---

## Cross-Cutting Concerns

### Authorization Pattern

**Reuse from UC24-UC25**:
```javascript
// authorization.service.js (EXISTING)
async checkStaffOrganizationAccess(staffId, eventId) {
  const event = await eventRepository.getById(eventId);
  const staff = await userRepository.getById(staffId);
  
  if (staff.role_id !== ROLE.STAFF && staff.role_id !== ROLE.MANAGER) {
    throw new ForbiddenError('Only Staff and Manager can check-in volunteers');
  }
  
  // Check organization match
  const staffOrgs = await organizationRepository.getByUserId(staffId);
  if (!staffOrgs.some(org => org.id === event.organization_id)) {
    throw new ForbiddenError('Staff can only check-in for events of their organization');
  }
  
  return true;
}
```

**UC45-specific checks**:
- Validate `event.status !== 'COMPLETED'` AND `event.status !== 'CANCELLED'`
- Validate `application.status === 'APPROVED'`
- Validate `application.event_id === eventId` (prevent cross-event check-in)

---

### Performance Optimization

**Database Indexes** (Already exist from DATABASE.md):
- `attendances.application_id` (UNIQUE): O(1) duplicate check
- `applications.event_id, applications.status` (composite): Fast filtering của approved applications

**API Performance**:
- **Single check-in**: 
  - 1 SELECT (get application) → 50ms
  - 1 SELECT (get event) → 50ms
  - 1 SELECT (authorization check) → 100ms
  - 1 INSERT (attendance) → 50ms
  - **Total**: ~250ms (well below 800ms target)

- **Bulk check-in (50 records)**:
  - 1 SELECT (bulk get applications) → 100ms
  - 1 SELECT (get event) → 50ms
  - 1 SELECT (authorization) → 100ms
  - 50 INSERTs (sequential) → 50ms × 50 = 2500ms
  - **Total**: ~2750ms (below 5s target)

**Optimization opportunities nếu cần**:
- Use Prisma `createMany()` thay vì loop (batch insert) → reduce to ~500ms cho 50 records
- Connection pooling (default Prisma config: 10 connections)

---

### Frontend State Management

**State structure**:
```javascript
const [volunteers, setVolunteers] = useState([]);
const [selectedIds, setSelectedIds] = useState(new Set());
const [searchQuery, setSearchQuery] = useState('');
const [loading, setLoading] = useState(false);

const filteredVolunteers = useMemo(() => {
  return volunteers.filter(v => 
    v.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [volunteers, searchQuery]);
```

**Optimizations**:
- `useMemo` để cache filtered results
- `Set` cho selectedIds → O(1) lookup
- Debounced search input (300ms)
- React.memo() cho AttendanceListItem

---

## Dependencies Resolution

### Hard Dependencies
- ✅ UC24: Approve Application → Provides `applications.status = 'APPROVED'`
- ✅ `attendances` table schema → Already defined in DATABASE.md
- ✅ Authorization service → Already exists (reuse from UC24-UC25)
- ✅ Application service → `getById()`, `validateStatus()` methods
- ✅ Event service → `getById()`, `checkEventStatus()` methods

### Soft Dependencies
- UC46: View Attendance List → Shares `AttendanceService.getAttendanceList()` method
- UC53: Generate Certificate → Consumes `attendances.volunteer_hours` field (must be populated before certificate generation)

**No blockers detected. All dependencies are met or can be implemented in parallel.**

---

## Risk Mitigation Summary

| Risk | Mitigation Strategy | Implementation Detail |
|------|-------------------|---------------------|
| **Duplicate check-in (race condition)** | Database UNIQUE constraint | `attendances.application_id` UNIQUE → PostgreSQL/MySQL level enforcement |
| **Unauthorized access** | Authorization-first pattern | Check Staff organization BEFORE any database write |
| **Bulk timeout** | Partial success pattern | Process individually, collect results, return summary |
| **Search performance (200+ records)** | Client-side filtering | In-memory array.filter() với debounce 300ms |
| **Mobile UX issues** | Responsive design | Bootstrap grid + Material UI responsive breakpoints |

---

## Open Questions for Product Owner (From plan.md)

**No additional questions raised during research phase.**

All RQs have been resolved với clear technical decisions. Ready to proceed to Phase 1 (Design & Contracts).

---

## Next Steps

1. ✅ **Research Phase (RQ1-RQ4)**: COMPLETED
2. ⏭️ **Phase 1**: Generate `data-model.md`
3. ⏭️ **Phase 1**: Generate API contracts (2 files)
4. ⏭️ **Phase 1**: Generate `quickstart.md`
5. ⏭️ **Phase 2**: Generate `tasks.md` (via `/speckit-tasks` command)

**Research Status**: ✅ RESOLVED - Ready for Design Phase

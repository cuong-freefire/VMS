# Research: View Attendance List (UC46)

**Feature Branch**: `046-feat-view-attendance-list`  
**Created**: 2026-06-30  
**Status**: RESOLVED

**Input**: SPEC.md from `.sdd/TienTD/UC46-feat-view-attendance-list/SPEC.md`

---

## Research Questions (RQs)

### RQ1: Pagination Strategy - Client-side vs Server-side?

**Question**: Với yêu cầu FR-003 "WHERE danh sách vượt quá 50 người, THE system SHALL tự động phân trang", nên implement pagination ở client-side hay server-side?

**Context**:
- UC46 chỉ hiển thị danh sách, không có check-in action
- Staff cần overview nhanh về attendance status
- FR-004 yêu cầu search với debounce 300ms
- SC-001: Danh sách 100 Volunteer phải load trong <1s

**Options Evaluated**:
1. **Server-side pagination** (limit + offset params)
   - Pros: Scalable cho >1000 volunteers, giảm payload, phù hợp cho production
   - Cons: Phức tạp hơn, cần thêm API params, search phải call API mỗi lần
   
2. **Client-side pagination** (load all + paginate in UI)
   - Pros: Đơn giản hơn, search instant (không cần API call), Material UI DataGrid hỗ trợ sẵn
   - Cons: Không scale cho events lớn (>500 volunteers)

**Decision**: **Client-side pagination** với giới hạn reasonable event size (<300 volunteers)

**Rationale**:
- VMS context: Hầu hết events có 50-200 volunteers (theo DATABASE.md event statistics)
- Search requirement (FR-004) cần instant filter → client-side efficient hơn
- Material UI DataGrid có built-in pagination + filtering
- Performance target SC-001 (<1s cho 100 volunteers) đạt được với client-side
- Nếu sau này cần scale, có thể refactor sang server-side (backward compatible)

**Implementation**:
- GET `/api/v1/attendances/events/:eventId` trả về TOÀN BỘ danh sách
- Frontend dùng Material UI DataGrid với `pageSize={50}` và `pagination` enabled
- Search filter applied trực tiếp trên in-memory data
- Add warning trong docs: "Recommended for events <300 volunteers"

---

### RQ2: Real-time Data Refresh Strategy?

**Question**: FR-005 yêu cầu "cho phép Staff làm mới (Refresh) danh sách để nhận dữ liệu mới nhất". Implement như thế nào để tránh race conditions và duplicate requests?

**Context**:
- UC45 (Attendance Check) có thể update attendance records liên tục
- SC-002: 100% dữ liệu phải khớp với UC45
- SC-007: Frontend không gửi duplicate requests khi spam Refresh button
- No WebSocket/Server-Sent Events requirement trong SPEC

**Options Evaluated**:
1. **Manual Refresh button only**
   - Pros: Đơn giản, ít complexity
   - Cons: Staff phải manually click, có thể bỏ lỡ updates
   
2. **Auto-refresh với polling (every 10s)**
   - Pros: Staff luôn thấy latest data
   - Cons: Unnecessary API calls, waste bandwidth
   
3. **Manual Refresh + Request deduplication**
   - Pros: Balance giữa simplicity và safety
   - Cons: Cần thêm logic để track pending requests

**Decision**: **Manual Refresh button với request deduplication**

**Rationale**:
- SPEC không require real-time updates (no WebSocket mention)
- Staff workflow: Check attendance list → Go to UC45 to check-in → Return to UC46 to verify → Manual refresh là reasonable
- SC-007 explicitly requires preventing duplicate requests → Must implement deduplication
- Polling (Option 2) over-engineered cho use case này

**Implementation**:
- Add Refresh IconButton với `<RefreshIcon />` at top-right của DataGrid
- Use React state: `const [isRefreshing, setIsRefreshing] = useState(false);`
- Disable Refresh button while `isRefreshing === true`
- API call wrapper:
  ```javascript
  const handleRefresh = async () => {
    if (isRefreshing) return; // Early return if already refreshing
    setIsRefreshing(true);
    try {
      await fetchAttendanceList(eventId);
    } finally {
      setIsRefreshing(false);
    }
  };
  ```
- Show CircularProgress inside button during refresh
- Success toast: "Attendance list refreshed" (optional, non-blocking)

---

### RQ3: Search Implementation - Which Fields and How?

**Question**: FR-004 yêu cầu "lọc danh sách theo tên Volunteer ngay lập tức (Debounce 300ms)". Search should cover chỉ tên hay include thêm fields khác?

**Context**:
- FR-002 hiển thị: Họ tên, Trạng thái, Thời gian điểm danh
- FR-016: MUST NOT display sensitive PII (CMND/CCCD/địa chỉ)
- UC45 research: Client-side search với 200 volunteers is acceptable
- User Story 2 mentions "lọc những người chưa vắng mặt" → Need status filter too

**Options Evaluated**:
1. **Search by Volunteer Name only**
   - Pros: Đơn giản, match User Story 1 requirement
   - Cons: Limited flexibility
   
2. **Search by Name + Filter by Status**
   - Pros: Cover both User Stories, flexible cho Staff workflow
   - Cons: Slightly more UI complexity
   
3. **Search multiple fields (Name + Email + Phone)**
   - Pros: Maximum flexibility
   - Cons: Over-engineered, FR-016 restricts PII display

**Decision**: **Search by Name + Filter by Status (separate controls)**

**Rationale**:
- User Story 2 explicitly requires filtering by absent status
- Search and Filter serve different purposes:
  - **Search**: Find specific volunteer by name (FR-004)
  - **Filter**: Show only Present/Absent/All (User Story 2)
- FR-016 restricts PII → Cannot search by email/phone/CMND
- Material UI DataGrid có built-in `filterModel` API

**Implementation**:
- TextField for search input with 300ms debounce:
  ```javascript
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  ```
- Select dropdown for status filter:
  - Options: "All", "Present", "Absent"
  - Default: "All"
- Combined filtering logic:
  ```javascript
  const filteredData = attendances
    .filter(a => a.volunteer_name.toLowerCase().includes(debouncedSearch.toLowerCase()))
    .filter(a => statusFilter === 'All' || 
                 (statusFilter === 'Present' && a.status === 'PRESENT') ||
                 (statusFilter === 'Absent' && a.status === 'ABSENT'));
  ```
- Display result count: "Showing {filtered} of {total} volunteers"

---

### RQ4: Data Model - Attendances vs Applications Query Strategy?

**Question**: Endpoint GET `/api/v1/attendances/events/:eventId` should query `attendances` table directly hay JOIN với `applications` + `users`?

**Context**:
- FR-002: Display Họ tên, Trạng thái, Thời gian điểm danh
- FR-001: Verify quyền sở hữu sự kiện dựa trên `organization_id`
- UC45 đã create `attendances` table với FK → `applications.id`
- Need Volunteer name từ `users` table

**Options Evaluated**:
1. **Query `attendances` table với nested includes**
   ```javascript
   prisma.attendance.findMany({
     where: { application: { event_id: eventId } },
     include: { application: { include: { user: true, event: true } } }
   })
   ```
   - Pros: Natural data model, follows FK relationships
   - Cons: Complex nested query, might miss volunteers not yet checked-in
   
2. **Query `applications` table WITH LEFT JOIN `attendances`**
   ```javascript
   prisma.application.findMany({
     where: { event_id: eventId, status: 'APPROVED' },
     include: { user: true, attendance: true }
   })
   ```
   - Pros: Shows ALL approved volunteers (checked-in + not-yet), simpler query
   - Cons: Returns null attendance for not-yet checked-in volunteers

**Decision**: **Query `applications` table WITH LEFT JOIN `attendances` (Option 2)**

**Rationale**:
- User Story 1: "xem danh sách tất cả các tình nguyện viên đã được duyệt VÀ trạng thái điểm danh"
  - Implies showing ALL approved volunteers, not just checked-in ones
- User Story 2: "lọc những người chưa vắng mặt" → Need to show unchecked volunteers too
- FR-002: Display status = "Present/Absent" → Absent means `attendance === null`
- Option 1 only shows checked-in volunteers → Fails User Stories
- LEFT JOIN ensures we get ALL approved volunteers với attendance data (if exists)

**Implementation**:
- Repository method `getApprovedApplicationsWithAttendance(eventId)`:
  ```javascript
  return await prisma.application.findMany({
    where: {
      event_id: eventId,
      status: 'APPROVED'
    },
    include: {
      user: { 
        select: { id: true, full_name: true, avatar_url: true }
      },
      attendance: {
        select: { id: true, status: true, checked_in_at: true, checked_in_by: true }
      }
    },
    orderBy: { created_at: 'asc' }
  });
  ```
- Service layer transform:
  ```javascript
  return applications.map(app => ({
    application_id: app.id,
    volunteer_id: app.user.id,
    volunteer_name: app.user.full_name,
    volunteer_avatar: app.user.avatar_url,
    status: app.attendance ? 'PRESENT' : 'ABSENT',
    checked_in_at: app.attendance?.checked_in_at || null,
    checked_in_by: app.attendance?.checked_in_by || null
  }));
  ```
- This approach covers both checked-in AND not-yet-checked-in volunteers

---

## Implementation Constraints from Research

Based on RQ resolutions, the following constraints apply:

### Backend Constraints
1. **Endpoint**: `GET /api/v1/attendances/events/:eventId`
   - Query `applications` table với `status: APPROVED`
   - LEFT JOIN `attendances` table
   - Include `user` relation cho volunteer name/avatar
   - Authorization: Verify `event.organization_id` matches Staff's org
   
2. **Response Format**:
   ```json
   {
     "success": true,
     "message": "Attendance list retrieved successfully",
     "data": {
       "event_id": "uuid",
       "event_name": "Event Name",
       "total_approved": 120,
       "present_count": 80,
       "absent_count": 40,
       "attendances": [
         {
           "application_id": "uuid",
           "volunteer_id": "uuid",
           "volunteer_name": "Nguyen Van A",
           "volunteer_avatar": "url",
           "status": "PRESENT" | "ABSENT",
           "checked_in_at": "2026-06-30T10:00:00Z" | null,
           "checked_in_by": "staff_uuid" | null
         }
       ]
     }
   }
   ```

3. **Performance**: Load all approved applications in single query (no pagination)
   - Add warning in API docs: "Optimal for events <300 volunteers"
   - Consider adding pagination later if needed

### Frontend Constraints
1. **Search**: TextField with 300ms debounce on volunteer_name field only
2. **Filter**: Select dropdown for status (All/Present/Absent)
3. **Pagination**: Material UI DataGrid built-in, pageSize=50
4. **Refresh**: Manual button với request deduplication (prevent spam clicks)
5. **Display**: DataGrid columns = [volunteer_name, status badge, checked_in_at timestamp]

### Testing Constraints
1. **Integration test**: Verify LEFT JOIN returns both checked-in + not-yet-checked-in volunteers
2. **Frontend test**: Verify search debounce works (not triggering API on every keystroke)
3. **E2E test**: Staff refreshes list after UC45 check-in → Verify status updated

---

## Open Questions for Human Review

None. All research questions resolved. Ready to proceed to Phase 1 (data-model.md).

---

**Status**: ✅ RESOLVED - All RQs answered, ready for `/speckit-plan` Phase 1


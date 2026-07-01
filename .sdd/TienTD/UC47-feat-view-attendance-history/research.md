# Research: View Attendance History (UC47)

**Feature Branch**: `047-feat-view-attendance-history`  
**Created**: 2026-06-30  
**Status**: RESOLVED

**Input**: SPEC.md from `.sdd/TienTD/UC47-feat-view-attendance-history/SPEC.md`

---

## Research Questions (RQs)

### RQ1: Query Scope - Completed Events Only or All Events?

**Question**: FR-001 yêu cầu kiểm tra quyền truy cập theo `organization_id`. Có nên lọc chỉ các sự kiện đã kết thúc (status = 'COMPLETED') hay cho phép xem lịch sử của tất cả events (bao gồm cả IN_PROGRESS)?

**Context**:
- User Story 1: "chọn một sự kiện **đã kết thúc** để xem danh sách những người đã tham gia"
- A-001 mentions "các sự kiện cũ" (old events) → implies completed events
- UC46 shows attendance list for IN_PROGRESS events (real-time check-in view)
- UC47 is for "lịch sử" (history) → suggests historical data, not current

**Options Evaluated**:
1. **Show only COMPLETED events**
   - Pros: Clear separation from UC46 (real-time view), matches "lịch sử" intent
   - Cons: Cannot view history during IN_PROGRESS events
   
2. **Show all events (PUBLISHED, IN_PROGRESS, COMPLETED)**
   - Pros: More flexible for Staff reporting needs
   - Cons: Overlaps with UC46 functionality, confusing UX

3. **Show COMPLETED + IN_PROGRESS events**
   - Pros: Balance between flexibility and clarity
   - Cons: Still overlaps with UC46

**Decision**: **Show only COMPLETED events (Option 1)**

**Rationale**:
- SPEC explicitly states "sự kiện **đã kết thúc**" in User Story 1
- UC47 purpose is "kiểm tra và báo cáo đóng góp" → historical reporting, not real-time monitoring
- Clear UX separation: UC46 for real-time attendance, UC47 for historical review
- A-008 mentions "các bản ghi điểm danh của sự kiện bị xóa (Soft delete)" → historical data management
- Staff workflow: During event → use UC46, After event → use UC47

**Implementation**:
- Filter query: `WHERE events.status = 'COMPLETED' AND events.organization_id = :orgId`
- API contract: Document that only completed events are included
- Frontend: Dropdown/Autocomplete for completed events only
- Add note in docs: "To view attendance for ongoing events, use UC46"

---

### RQ2: Query Pattern - Event-First or Volunteer-First or Both?

**Question**: User Story 1 requires "tra cứu theo sự kiện", User Story 2 requires "tra cứu theo Volunteer". Nên implement 1 API endpoint flexible hay 2 endpoints riêng biệt?

**Context**:
- User Story 1: Chọn sự kiện → xem danh sách volunteers
- User Story 2: Nhập tên volunteer → xem danh sách sự kiện mà người đó đã tham gia
- FR-003: Filter theo thời gian (StartDate, EndDate)
- FR-004: Pagination khi > 50 records
- Database tables: events, applications, attendances, users

**Options Evaluated**:
1. **Single flexible endpoint with query params**
   - `GET /api/v1/attendances/history?eventId=X&volunteerId=Y&startDate=Z`
   - Pros: One API to maintain, flexible queries
   - Cons: Complex query logic, unclear contract, hard to optimize
   
2. **Two separate endpoints**
   - `GET /api/v1/attendances/events/:eventId/history` (Event-first)
   - `GET /api/v1/attendances/volunteers/:volunteerId/history` (Volunteer-first)
   - Pros: Clear contracts, specific optimizations, easy to understand
   - Cons: More code to maintain, potential duplication
   
3. **One endpoint with required mode param**
   - `GET /api/v1/attendances/history?mode=by-event&eventId=X`
   - `GET /api/v1/attendances/history?mode=by-volunteer&volunteerId=Y`
   - Pros: Single endpoint, explicit query mode
   - Cons: Still complex validation, mode switching logic

**Decision**: **Two separate endpoints (Option 2)**

**Rationale**:
- User Stories are fundamentally different use cases with different data structures:
  - Story 1: Event details + list of volunteers (1:N relationship)
  - Story 2: Volunteer details + list of events (1:N relationship)
- RESTful API design: Resource-oriented endpoints are clearer
- Performance: Can optimize queries specifically for each use case
- Frontend UX: Two different pages/tabs with different UI layouts
- VMS pattern: UC22 (List Applications), UC23 (View Application Detail) also use separate endpoints

**Implementation**:
- **Endpoint 1**: `GET /api/v1/attendances/events/:eventId/history`
  - Returns: Event details + array of attendances with volunteer info
  - Use case: Staff selects event from dropdown → see who attended
  
- **Endpoint 2**: `GET /api/v1/attendances/volunteers/:volunteerId/history`
  - Returns: Volunteer details + array of attendances with event info
  - Use case: Staff searches volunteer name → see their participation history
  
- Both endpoints support:
  - Query params: `startDate`, `endDate` (FR-003)
  - Query params: `limit`, `offset` (FR-004 pagination)
  - Organization-based access control (FR-001)

---

### RQ3: Pagination - Server-side or Client-side?

**Question**: FR-004 yêu cầu pagination khi > 50 records. UC46 dùng client-side pagination. UC47 có nên dùng chiến lược giống hay khác?

**Context**:
- UC46: Client-side pagination (load all data, paginate in UI)
- UC46 rationale: Most events have 50-200 volunteers, instant search needed
- UC47 User Story 2: "xem tất cả các sự kiện mà người đó đã tham gia"
- A-001: "dữ liệu từ các sự kiện cũ đã được lưu trữ và đánh index"
- SC-001: Trang lịch sử phải tải xong trong <1.5s với 1000 bản ghi

**Options Evaluated**:
1. **Client-side pagination (like UC46)**
   - Pros: Instant filtering, simple UI, consistent with UC46
   - Cons: Not scalable for long-term history (1000+ records)
   
2. **Server-side pagination (limit + offset)**
   - Pros: Scalable for large datasets, reduces payload size
   - Cons: More complex, search requires API calls
   
3. **Hybrid: Client-side for Event-first, Server-side for Volunteer-first**
   - Pros: Optimized for each use case
   - Cons: Inconsistent UX, more complex implementation

**Decision**: **Server-side pagination for BOTH endpoints (Option 2)**

**Rationale**:
- UC47 is historical data → dataset grows over time (unlike UC46 which shows single event)
- User Story 2 scenario: Active volunteer có thể có 50+ events participated → Must paginate
- SC-001 mentions "1000 bản ghi" → implies large dataset expectation
- A-001 explicitly mentions "đã được lưu trữ và đánh index" → designed for efficient querying
- FR-004 explicitly requires pagination for > 50 records → server-side is standard practice
- Different from UC46 use case: UC46 = single event snapshot, UC47 = multi-event history

**Implementation**:
- Query params: `limit` (default 50, max 200), `offset` (default 0)
- Response includes pagination metadata:
  ```json
  {
    "data": { ... },
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
  ```
- Frontend: Use Material UI Pagination component with page change triggers API call
- Database: Use indexed queries with `LIMIT` and `OFFSET` clauses
- Performance: Ensure indexes on `checked_in_at`, `event_id`, `volunteer_id` for fast sorting/filtering

---

### RQ4: Date Range Filter - Required or Optional?

**Question**: FR-003 yêu cầu "lọc theo thời gian" với StartDate và EndDate. Có nên bắt buộc (required) hay tùy chọn (optional)?

**Context**:
- FR-003: "WHERE Staff chọn lọc theo thời gian, THE system SHALL trả về các bản ghi có `event_date` nằm trong khoảng StartDate và EndDate"
- Use case: Staff có thể muốn xem toàn bộ lịch sử hoặc chỉ lọc theo tháng/quý/năm
- SC-001: Performance target <1.5s cho 1000 records
- A-001: Data đã được indexed

**Options Evaluated**:
1. **Required date range (must provide startDate + endDate)**
   - Pros: Forces bounded queries, better performance, prevents full table scans
   - Cons: Less flexible, Staff must always select dates
   
2. **Optional date range (default to last 12 months)**
   - Pros: Flexible, Staff can view all history if needed
   - Cons: May return large datasets, potential performance issues
   
3. **Optional with smart defaults**
   - If not provided: Default to last 6 months
   - If only startDate: endDate = today
   - If only endDate: startDate = 1 year before endDate
   - Pros: Balance between flexibility and safety
   - Cons: Implicit behavior may confuse users

**Decision**: **Optional with smart defaults (Option 3)**

**Rationale**:
- FR-003 uses "WHERE Staff chọn lọc" → implies optional filtering (not mandatory)
- User workflow flexibility: Sometimes need overview, sometimes need specific period
- Performance safety: Always apply some date boundary to prevent unbounded queries
- Default to last 6 months covers most use cases (recent events)
- Staff can explicitly request wider range by providing startDate
- Database indexes on `event_date` / `checked_in_at` make filtered queries fast

**Implementation**:
- Query params: `startDate` (ISO 8601 date), `endDate` (ISO 8601 date) - both optional
- Default behavior if not provided:
  - `endDate = today`
  - `startDate = today - 6 months`
- Validation:
  - `startDate` must be <= `endDate`
  - Date range cannot exceed 2 years (prevents abuse)
- Frontend:
  - Date range picker component (Material UI DateRangePicker)
  - Show applied filter: "Showing history from {start} to {end}"
  - "Clear Filter" button to reset to defaults
- SQL query:
  ```sql
  WHERE events.end_date BETWEEN :startDate AND :endDate
    AND events.status = 'COMPLETED'
    AND events.organization_id = :orgId
  ```

---

## Implementation Constraints from Research

Based on RQ resolutions, the following constraints apply:

### Backend Constraints

1. **Two Separate Endpoints** (from RQ2):
   
   **Endpoint 1**: `GET /api/v1/attendances/events/:eventId/history`
   - Purpose: View attendance history for a specific completed event
   - Authorization: Verify event belongs to Staff's organization
   - Query: `applications` LEFT JOIN `attendances` WHERE event_id = :eventId
   - Response:
     ```json
     {
       "success": true,
       "message": "Event attendance history retrieved successfully",
       "data": {
         "event": {
           "id": "uuid",
           "title": "Event Name",
           "start_date": "2026-06-01",
           "end_date": "2026-06-02",
           "status": "COMPLETED"
         },
         "attendances": [
           {
             "volunteer_id": "uuid",
             "volunteer_name": "Nguyen Van A",
             "volunteer_avatar": "url",
             "status": "PRESENT",
             "checked_in_at": "2026-06-01T09:30:00Z",
             "checked_in_by": "staff_uuid"
           }
         ],
         "summary": {
           "total_approved": 100,
           "present_count": 85,
           "absent_count": 15
         }
       },
       "pagination": {
         "total": 100,
         "limit": 50,
         "offset": 0,
         "hasMore": true
       }
     }
     ```
   
   **Endpoint 2**: `GET /api/v1/attendances/volunteers/:volunteerId/history`
   - Purpose: View all events a volunteer has attended in the organization
   - Authorization: Verify Staff belongs to same organization as volunteer's events
   - Query: `attendances` JOIN `applications` JOIN `events` WHERE volunteer_id = :volunteerId
   - Query params: `startDate`, `endDate`, `limit`, `offset`
   - Response:
     ```json
     {
       "success": true,
       "message": "Volunteer attendance history retrieved successfully",
       "data": {
         "volunteer": {
           "id": "uuid",
           "full_name": "Nguyen Van A",
           "avatar_url": "url"
         },
         "attendances": [
           {
             "event_id": "uuid",
             "event_title": "Community Cleanup 2026",
             "event_date": "2026-06-01",
             "status": "PRESENT",
             "checked_in_at": "2026-06-01T09:30:00Z",
             "volunteer_hours": 4.5
           }
         ],
         "summary": {
           "total_events_attended": 12,
           "total_hours_contributed": 48.5,
           "date_range": {
             "earliest": "2025-06-01",
             "latest": "2026-06-15"
           }
         }
       },
       "pagination": {
         "total": 12,
         "limit": 50,
         "offset": 0,
         "hasMore": false
       }
     }
     ```

2. **Query Filters** (from RQ1, RQ4):
   - Event status: MUST be 'COMPLETED' (RQ1)
   - Date range: Optional with smart defaults (last 6 months if not specified)
   - Organization: MUST match Staff's organization_id
   - Pagination: Server-side with limit/offset (RQ3)

3. **Performance Requirements**:
   - Target: <1.5s for 1000 records (SC-001)
   - Use indexes on: `event_id`, `volunteer_id`, `checked_in_at`, `event_date`
   - Query optimization: Avoid N+1 queries, use proper JOINs

### Frontend Constraints

1. **Two Pages/Tabs** (from RQ2):
   - **Page 1**: "Attendance by Event" - Select event → View volunteers
   - **Page 2**: "Attendance by Volunteer" - Search volunteer → View events
   - Use Material UI Tabs to switch between views

2. **Event-First View**:
   - Autocomplete dropdown for completed events (load from separate endpoint)
   - DataGrid to display volunteers list
   - Columns: Volunteer Name, Status (Present/Absent), Check-in Time
   - Summary cards: Total Approved, Present Count, Absent Count

3. **Volunteer-First View**:
   - Search TextField with autocomplete for volunteer names
   - DataGrid to display events list
   - Columns: Event Title, Event Date, Status, Check-in Time, Hours Contributed
   - Summary cards: Total Events, Total Hours, Date Range

4. **Common Features** (from RQ3, RQ4):
   - Server-side pagination: Material UI Pagination component
   - Date range filter: Material UI DateRangePicker (optional, defaults to last 6 months)
   - Loading states during API calls
   - Empty state: "No attendance history found for the selected criteria" (FR-005)
   - Export button (Phase 2 enhancement - not in MVP)

### Testing Constraints

1. **Integration Tests**:
   - Test Event-First endpoint with completed events only
   - Test Volunteer-First endpoint with date range filtering
   - Test pagination: offset=0, offset=50, offset=100
   - Test authorization: Staff can only see own organization's history
   - Test empty results: No attendances found

2. **Frontend Tests**:
   - Test tab switching between Event-First and Volunteer-First views
   - Test date range picker with defaults and custom ranges
   - Test pagination: clicking page numbers triggers API call
   - Test search autocomplete for volunteers

3. **Performance Tests**:
   - Load 1000 attendance records → verify <1.5s response time
   - Test query performance with various date ranges
   - Verify indexes are being used (EXPLAIN query)

---

## Open Questions for Human Review

None. All research questions resolved. Ready to proceed to Phase 1 (data-model.md).

---

**Status**: ✅ RESOLVED - All RQs answered, ready for `/speckit-plan` Phase 1

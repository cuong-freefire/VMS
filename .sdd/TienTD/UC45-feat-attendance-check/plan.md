# Implementation Plan: Attendance Check (UC45)

**Branch**: `045-feat-attendance-check` | **Date**: 2026-06-30 | **Spec**: [SPEC.md](./SPEC.md)

**Input**: Feature specification from `.sdd/TienTD/UC45-feat-attendance-check/SPEC.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

UC45 cho phép Staff thực hiện điểm danh (check-in) cho các tình nguyện viên có mặt tại sự kiện. Hệ thống hỗ trợ cả điểm danh từng người và điểm danh hàng loạt (bulk check-in). Mỗi tình nguyện viên chỉ có thể được điểm danh một lần cho mỗi sự kiện, và chỉ những người có đơn đăng ký ở trạng thái `APPROVED` mới xuất hiện trong danh sách điểm danh.

**Technical Approach**:
- Backend API với 2 endpoints: Single check-in và Bulk check-in
- Transaction-safe attendance record creation với UNIQUE constraint trên `application_id`
- Authorization kiểm tra Staff thuộc Organization sở hữu sự kiện
- Frontend UI với search bar, checkbox selection và real-time status updates
- Performance target: <800ms cho single check-in, <5s cho bulk (50 volunteers)

## Technical Context

**Language/Version**: Node.js 18 LTS + ES Modules

**Primary Dependencies**: 
- Express 5.x (REST API)
- Prisma ORM (Database access)
- Zod (Input validation)
- Pino (Structured logging)
- Jest + Supertest (Testing)

**Storage**: MySQL 8.0 via Prisma

**Testing**: 
- Unit tests: Jest với mock Prisma client
- Integration tests: Supertest với test database
- Target coverage: 80% cho Service layer

**Target Platform**: Linux server (Node.js runtime), Chrome/Edge/Firefox (Frontend)

**Project Type**: Full-stack web application (RESTful API + React SPA)

**Performance Goals**: 
- Single check-in: <800ms (P95 latency)
- Bulk check-in (50 volunteers): <5s total processing time
- Search bar: Debounced input với <200ms render time
- Database queries: <100ms per attendance record creation

**Constraints**: 
- Chỉ Staff có quyền điểm danh cho sự kiện của Organization mình quản lý
- Không được phép điểm danh khi sự kiện đã `COMPLETED` hoặc `CANCELLED`
- UNIQUE constraint trên `attendances.application_id` đảm bảo không duplicate
- Immutable: Sau khi tạo attendance record, KHÔNG được UPDATE status hoặc timestamp

**Scale/Scope**: 
- Hỗ trợ sự kiện với ~200 volunteers trong danh sách điểm danh
- Bulk check-in tối đa 50 volunteers cùng lúc
- Search bar phải hoạt động mượt mà với 200+ records

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **Single Responsibility**: Mỗi Service method xử lý đúng 1 business operation
✅ **RESTful Design**: Endpoints tuân thủ REST conventions (POST cho bulk, PATCH cho single)
✅ **Transaction Safety**: Bulk operations wrapped trong Prisma transaction
✅ **Authorization First**: Kiểm tra quyền trước khi thực hiện bất kỳ database operation nào
✅ **Immutable Audit Data**: Attendance records là immutable sau khi tạo
✅ **Error Handling**: Centralized error middleware xử lý tất cả exceptions
✅ **Input Validation**: Zod schema cho tất cả request bodies
✅ **Logging**: Structured logging cho audit trail (Staff ID, timestamp, application IDs)

**No violations detected.**

## Project Structure

### Documentation (this feature)

```text
.sdd/TienTD/UC45-feat-attendance-check/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── POST-attendances-application-id-check-in.md
│   └── POST-attendances-bulk-check-in.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
# Backend Structure
backend/
├── src/
│   ├── controllers/
│   │   └── attendance.controller.js          # NEW: Check-in endpoints
│   ├── services/
│   │   ├── attendance.service.js             # NEW: Check-in business logic
│   │   ├── application.service.js            # EXISTING: Reuse getById(), validateApprovedStatus()
│   │   ├── event.service.js                  # EXISTING: Reuse getById(), checkEventStatus()
│   │   └── authorization.service.js          # EXISTING: Reuse checkStaffOrganizationAccess()
│   ├── repositories/
│   │   └── attendance.repository.js          # NEW: Prisma CRUD for attendances table
│   ├── middlewares/
│   │   ├── auth.middleware.js                # EXISTING: JWT verification
│   │   └── validation.middleware.js          # EXISTING: Zod validation
│   ├── validators/
│   │   └── attendance.validator.js           # NEW: Zod schemas for check-in requests
│   ├── routes/
│   │   └── attendance.routes.js              # NEW: Route definitions
│   ├── utils/
│   │   ├── response.util.js                  # EXISTING: Standardized responses
│   │   └── errors.util.js                    # EXISTING: Custom error classes
│   └── swagger/
│       └── attendance.swagger.js             # NEW: Swagger JSDoc definitions
│
└── tests/
    ├── unit/
    │   └── attendance.service.test.js        # NEW: Service layer unit tests
    └── integration/
        └── attendance.api.test.js            # NEW: API endpoint integration tests

# Frontend Structure
frontend/
├── src/
│   ├── api/
│   │   └── attendanceApi.js                  # NEW: Axios client for attendance endpoints
│   ├── components/
│   │   ├── attendance/
│   │   │   ├── AttendanceList.jsx            # NEW: Volunteer list với search + checkboxes
│   │   │   ├── AttendanceListItem.jsx        # NEW: Single volunteer row
│   │   │   ├── BulkCheckInButton.jsx         # NEW: Bulk action button
│   │   │   └── SearchBar.jsx                 # NEW: Debounced search input
│   │   └── common/
│   │       └── LoadingSpinner.jsx            # EXISTING: Reuse loading indicator
│   ├── pages/
│   │   └── staff/
│   │       └── AttendanceCheckPage.jsx       # NEW: Main attendance page for Staff
│   └── hooks/
│       └── useAttendance.js                  # NEW: Custom hook for attendance state management
│
└── tests/
    └── components/
        └── attendance/
            └── AttendanceList.test.jsx       # NEW: Component tests
```

**Structure Decision**: 

Chọn **Option 2: Web application** (backend + frontend separation) vì:
1. UC45 là full-stack feature với backend API và frontend UI
2. Backend xử lý authorization, validation và database transactions
3. Frontend cung cấp interactive UI với search, bulk selection và real-time feedback
4. Separation of concerns cho phép testing độc lập và deployment linh hoạt

## Complexity Tracking

**No violations requiring justification.**

UC45 tuân thủ đầy đủ VMS Constitution:
- Layered Architecture: Controller → Service → Repository
- Transaction safety cho bulk operations
- Immutable audit data (attendance records)
- Authorization-first approach
- Standardized error handling và response format

---

## Implementation Phases

### Phase 0: Research & Discovery (Output: research.md)

**Questions to resolve**:

1. **RQ1**: Attendance record có cần lưu `volunteer_hours` ngay khi check-in hay để NULL và cập nhật sau?
   - Option A: Để NULL, Staff nhập sau khi sự kiện kết thúc
   - Option B: Tự động tính từ `event.end_date - event.start_date`
   - Option C: Staff nhập manual khi check-in

2. **RQ2**: UI pattern cho bulk check-in: Confirmation dialog hay direct action?
   - Option A: Direct action (nhanh, rủi ro cao nếu mis-click)
   - Option B: Confirmation dialog với danh sách (an toàn hơn, thêm 1 bước)

3. **RQ3**: Search bar implementation: Client-side filtering hay server-side API?
   - Option A: Client-side filtering (fast, limited by memory)
   - Option B: Server-side API với pagination (scalable, network latency)

4. **RQ4**: Error handling cho bulk operations: Fail-fast hay partial success?
   - Option A: Fail-fast (rollback toàn bộ nếu 1 record lỗi)
   - Option B: Partial success (tiếp tục với các records còn lại, trả về summary)

**Discovery tasks**:
- [ ] Review `attendances` table schema trong DATABASE.md
- [ ] Kiểm tra existing authorization patterns từ UC24-UC25
- [ ] Analyze performance implications của bulk operations (50 records)
- [ ] Review frontend component patterns từ approved applications list (UC22)

---

### Phase 1: Design & Contracts (Output: data-model.md, contracts/, quickstart.md)

**Data Model Changes**:

No schema changes required. Table `attendances` đã tồn tại với đầy đủ columns:
- `id` (PK)
- `application_id` (UNIQUE FK → applications.id)
- `status` (ENUM: 'PRESENT', 'ABSENT')
- `volunteer_hours` (DECIMAL(5,2) NULL)
- `checked_in_by` (FK → users.id, Staff ID)
- `checked_in_at` (TIMESTAMP)
- `notes` (TEXT NULL)

**API Contracts**:

1. **POST /api/v1/attendances/:applicationId/check-in** (Single check-in)
   - Request: Empty body hoặc `{ notes: "Optional note" }`
   - Response 201: `{ success: true, data: { attendance_id, checked_in_at } }`
   - Errors: 400 (Invalid applicationId), 403 (Forbidden), 404 (Not found), 409 (Already checked-in)

2. **POST /api/v1/attendances/bulk-check-in** (Bulk check-in)
   - Request: `{ application_ids: [123, 456, 789], notes: "Optional" }`
   - Response 200: `{ success: true, data: { total: 3, succeeded: 3, failed: 0, results: [...] } }`
   - Partial success: HTTP 207 Multi-Status

**Service Contracts**:

```javascript
// AttendanceService
class AttendanceService {
  async checkIn(applicationId, staffId, data = {}) {
    // 1. Validate application exists và status = APPROVED
    // 2. Get event và validate status !== COMPLETED/CANCELLED
    // 3. Authorize Staff belongs to event.organization_id
    // 4. Create attendance record (UNIQUE constraint handles duplicates)
    // 5. Return { attendance_id, checked_in_at }
  }

  async bulkCheckIn(applicationIds, staffId, data = {}) {
    // 1. Validate tất cả application_ids
    // 2. Group by event_id để batch authorization check
    // 3. Use Prisma transaction để create multiple records
    // 4. Collect results + errors
    // 5. Return { total, succeeded, failed, results: [...] }
  }

  async getAttendanceList(eventId, filters = {}) {
    // For UC46 - View Attendance List
    // Returns danh sách attendance records với volunteer info
  }
}
```

**Authorization Rules**:
- Staff MUST belong to organization_id của event
- Reuse `authorization.service.js` → `checkStaffOrganizationAccess(staffId, eventId)`

**Validation Rules**:
- `application_id`: Positive integer, EXISTS trong database
- `application_ids`: Array, max length 50, all positive integers
- `notes`: Optional string, max 500 characters

---

### Phase 2: Implementation Tasks (Output: tasks.md via /speckit-tasks)

**Task categories estimate**:

1. **Database & Repository Layer** (3 tasks, ~1.5 hours)
   - Verify attendances table schema
   - Implement AttendanceRepository CRUD methods
   - Write repository unit tests

2. **Service Layer** (5 tasks, ~3 hours)
   - Implement checkIn() single operation
   - Implement bulkCheckIn() with transaction
   - Add authorization checks via AuthorizationService
   - Integrate với ApplicationService, EventService
   - Write service layer unit tests (80% coverage)

3. **Controller & Routes** (3 tasks, ~1.5 hours)
   - Implement AttendanceController endpoints
   - Define route mappings
   - Add request validation middleware

4. **Validation & Error Handling** (2 tasks, ~1 hour)
   - Create Zod schemas cho check-in requests
   - Add custom error messages

5. **API Documentation** (2 tasks, ~1 hour)
   - Write Swagger JSDoc comments
   - Update API_CONTRACTS.md

6. **Integration Tests** (3 tasks, ~2 hours)
   - Test single check-in happy path + error cases
   - Test bulk check-in partial success scenarios
   - Test authorization failures

7. **Frontend API Client** (2 tasks, ~1 hour)
   - Implement attendanceApi.js với Axios
   - Add error handling và retry logic

8. **Frontend Components** (6 tasks, ~4 hours)
   - Build AttendanceList với search functionality
   - Implement checkbox selection state
   - Create BulkCheckInButton với loading states
   - Build SearchBar với debounce
   - Add success/error toast notifications
   - Handle loading và empty states

9. **Frontend Page Integration** (2 tasks, ~1.5 hours)
   - Create AttendanceCheckPage
   - Wire up components với API calls

10. **E2E Testing** (3 tasks, ~2 hours)
    - Test single check-in flow
    - Test bulk check-in với 10+ volunteers
    - Test search và filter functionality

**Estimated Total**: ~18-20 hours implementation time

---

## Dependencies & Risks

### Internal Dependencies

**Hard Dependencies** (MUST exist before UC45):
- ✅ UC24: Approve Application (provides approved applications list)
- ✅ `attendances` table schema (already defined in DATABASE.md)
- ✅ `authorization.service.js` (staff organization access checks)
- ✅ `application.service.js` (getById, status validation)
- ✅ `event.service.js` (getById, status validation)

**Soft Dependencies** (Can implement in parallel):
- UC46: View Attendance List (shares AttendanceService.getAttendanceList())
- UC53: Generate Certificate (consumes attendance data)

### External Dependencies

- MySQL 8.0 database running
- Prisma schema up-to-date với latest migrations
- JWT authentication middleware functional
- Cloudinary (if storing attendance photos - out of scope for MVP)

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Duplicate check-in attempts** (race condition) | HIGH | UNIQUE constraint trên `application_id` + database-level locking |
| **Bulk operation timeout** (50 records) | MEDIUM | Set transaction timeout, implement batch processing nếu cần |
| **Search performance với 200+ records** | LOW | Client-side filtering cho MVP, add pagination nếu thấy lag |
| **Mobile UX cho checkbox selection** | MEDIUM | Test trên mobile, consider alternative UI (swipe actions) |

### Business Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Staff điểm danh nhầm volunteer** | HIGH | Confirmation dialog cho bulk, clear visual feedback |
| **No-show không được đánh dấu** | MEDIUM | UC45 chỉ handle check-in (PRESENT), no-show là ABSENT hoặc không có record |
| **Sự kiện đã kết thúc nhưng chưa điểm danh hết** | LOW | Validate event status, cho phép điểm danh trong grace period (thảo luận với PO) |

---

## Testing Strategy

### Unit Tests (Jest)

**AttendanceService** (Priority: HIGH):
```javascript
describe('AttendanceService.checkIn', () => {
  it('should create attendance record for approved application', async () => {
    // Mock: application.status = APPROVED
    // Mock: event.status = IN_PROGRESS
    // Mock: staff belongs to event.organization_id
    // Assert: attendance record created with correct staffId, timestamp
  });

  it('should throw 409 if volunteer already checked in', async () => {
    // Mock: attendance record already exists
    // Assert: ConflictError thrown
  });

  it('should throw 403 if staff not authorized for event', async () => {
    // Mock: staff.organization_id !== event.organization_id
    // Assert: ForbiddenError thrown
  });

  it('should throw 400 if application not approved', async () => {
    // Mock: application.status = PENDING
    // Assert: BadRequestError thrown
  });
});

describe('AttendanceService.bulkCheckIn', () => {
  it('should process all valid applications in transaction', async () => {
    // Mock: 5 approved applications từ cùng 1 event
    // Assert: 5 attendance records created, transaction committed
  });

  it('should return partial success with error details', async () => {
    // Mock: 3 valid, 2 invalid (1 already checked-in, 1 not approved)
    // Assert: 3 succeeded, 2 failed with reasons
  });
});
```

**Target Coverage**: 80% line coverage cho Service layer

### Integration Tests (Supertest)

**API Endpoints** (Priority: HIGH):
```javascript
describe('POST /api/v1/attendances/:applicationId/check-in', () => {
  it('should return 201 with attendance data for valid request', async () => {
    // Setup: Create event, application (approved), authenticate as staff
    // Act: POST to endpoint
    // Assert: 201 response, attendance record exists in DB
  });

  it('should return 409 if already checked in', async () => {
    // Setup: Create attendance record
    // Act: POST again with same applicationId
    // Assert: 409 response, duplicate error message
  });

  it('should return 403 if staff not authorized', async () => {
    // Setup: Staff từ organization khác
    // Act: POST to endpoint
    // Assert: 403 response
  });
});

describe('POST /api/v1/attendances/bulk-check-in', () => {
  it('should process bulk check-in with partial success', async () => {
    // Setup: 10 applications (8 valid, 2 invalid)
    // Act: POST with all 10 IDs
    // Assert: 207 response, correct succeeded/failed counts
  });
});
```

### Frontend Component Tests (React Testing Library)

**AttendanceList.jsx** (Priority: MEDIUM):
```javascript
describe('AttendanceList', () => {
  it('should render list of volunteers with checkboxes', () => {
    // Render với mock data (10 volunteers)
    // Assert: 10 checkboxes visible
  });

  it('should filter volunteers based on search input', () => {
    // Render, type "John" vào search bar
    // Assert: Only volunteers với tên chứa "John" hiển thị
  });

  it('should enable bulk button when volunteers selected', () => {
    // Check 3 checkboxes
    // Assert: Bulk button enabled
  });
});
```

### E2E Tests (Manual for MVP)

**Critical Flows**:
1. **Single Check-in**:
   - Login as Staff
   - Navigate to event attendance page
   - Search volunteer by name
   - Click "Check-in" button
   - Verify success toast + status updated

2. **Bulk Check-in**:
   - Login as Staff
   - Select 5 volunteers via checkboxes
   - Click "Bulk Check-in"
   - Confirm dialog
   - Verify all 5 marked as attended

3. **Error Handling**:
   - Attempt to check-in already checked-in volunteer
   - Verify 409 error message displayed

---

## Performance Targets

### Backend Performance

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Single check-in | <800ms (P95) | Express middleware timing |
| Bulk check-in (50) | <5s total | Transaction duration |
| Authorization check | <100ms | Service method profiling |
| Database INSERT | <50ms per record | Prisma query logging |

**Optimization Strategies**:
- Use Prisma batch operations cho bulk insert
- Add database connection pooling (default Prisma config)
- Index trên `attendances.application_id` (UNIQUE constraint provides this)

### Frontend Performance

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Search input debounce | 300ms | Lodash debounce config |
| Render 200 volunteers | <200ms | React DevTools Profiler |
| Checkbox state update | <50ms | User interaction timing |
| API call → UI update | <1s | Network tab + React state |

**Optimization Strategies**:
- Use React.memo() cho AttendanceListItem components
- Debounce search input để reduce re-renders
- Virtual scrolling nếu list vượt 200 items (out of scope for MVP)

---

## Security Considerations

### Authorization Matrix

| Role | Check-in Single | Check-in Bulk | View Attendance |
|------|----------------|---------------|-----------------|
| **Staff** | ✅ (Own org events only) | ✅ (Own org events only) | ✅ (Own org events) |
| **Manager** | ✅ (Own org events only) | ✅ (Own org events only) | ✅ (Own org events) |
| **Admin** | ✅ (All events) | ✅ (All events) | ✅ (All events) |
| **Volunteer** | ❌ | ❌ | ❌ |
| **Guest** | ❌ | ❌ | ❌ |

### Security Checklist

- [x] **JWT Authentication**: Required trên tất cả endpoints
- [x] **Organization-based Authorization**: Staff chỉ truy cập events của org mình
- [x] **Input Validation**: Zod schemas cho all request bodies
- [x] **SQL Injection Prevention**: Prisma parameterized queries
- [x] **Rate Limiting**: Apply tại reverse proxy (Nginx/Cloudflare) - out of scope
- [x] **Audit Logging**: Log `checked_in_by` (Staff ID) và `checked_in_at` timestamp
- [x] **CSRF Protection**: HttpOnly cookies + SameSite attribute (handled by auth module)
- [x] **Data Immutability**: Attendance records KHÔNG được UPDATE sau khi tạo

---

## Rollout Plan

### Phase 1: Backend API (Week 1)
- Day 1-2: Repository + Service implementation
- Day 3: Controller + Routes + Validation
- Day 4: Integration tests + Swagger docs
- Day 5: Code review + bug fixes

### Phase 2: Frontend UI (Week 2)
- Day 1-2: API client + Components
- Day 3: Page integration + styling
- Day 4: Component tests + E2E flows
- Day 5: Cross-browser testing + polish

### Phase 3: Deployment & Monitoring (Week 3)
- Deploy to staging environment
- Manual QA testing với real data
- Performance profiling
- Production deployment
- Monitor error rates + latency

---

## Success Metrics

### Functional Metrics
- ✅ 100% approved volunteers có thể được điểm danh
- ✅ 0% duplicate attendance records (enforced by UNIQUE constraint)
- ✅ Staff chỉ thấy events của org mình

### Performance Metrics
- ✅ <800ms P95 latency cho single check-in
- ✅ <5s processing time cho bulk (50 volunteers)
- ✅ <200ms search bar response time

### Quality Metrics
- ✅ 80%+ test coverage cho Service layer
- ✅ 0 critical bugs sau 1 tuần production
- ✅ 100% API endpoints documented trong Swagger

### Business Metrics
- ✅ Attendance rate accuracy: >95% (so với manual counting)
- ✅ Staff time saved: ~50% reduction vs paper-based check-in
- ✅ Zero data loss incidents

---

## Open Questions for Product Owner

1. **Grace Period**: Có cho phép Staff điểm danh sau khi event đã COMPLETED không? (VD: quên điểm danh vài người)
   - Suggestion: Cho phép trong 24h sau khi event kết thúc, sau đó lock.

2. **No-Show Handling**: UC45 chỉ xử lý check-in (PRESENT). No-show (ABSENT) có cần feature riêng hay để NULL attendance record?
   - Suggestion: NULL = No-show implicit, explicit ABSENT marking là future enhancement.

3. **QR Code Integration**: V1 chỉ có manual selection, V2 có cần QR code scanning không?
   - Suggestion: Ship V1 first, gather feedback, prioritize QR code based on Staff pain points.

4. **Mobile-First UI**: Staff thường dùng tablet/phone tại hiện trường. Có cần optimize mobile UX ở V1?
   - Suggestion: Ensure mobile-responsive, but desktop-first cho MVP (easier testing).

5. **Bulk Limit**: Hiện tại đặt max 50 volunteers cho bulk operation. Có event nào lớn hơn không?
   - Suggestion: Monitor usage, increase limit nếu thấy pattern (100-200 range).

---

**Plan Status**: ✅ READY FOR RESEARCH PHASE

**Next Step**: Generate `research.md` via Phase 0 research questions resolution.

# tasks.md — Phase 2: Task Breakdown for UC09 View Event Detail

**Feature**: UC09-feat-view-event-detail
**Date**: 2026-07-20
**Author**: AI Agent (Member 1 - CuongLH context)

---

## Task Dependency Graph

```
TASK-01 (authenticateOptional MW)
    │
    ▼
TASK-02 (Event Repository)
    │
    ├──► TASK-03 (Application Repository)
    │         │
    │         ▼
    └──► TASK-04 (Event Service) ◄── TASK-03
              │
              ▼
         TASK-05 (Event Validator)
              │
              ▼
         TASK-06 (Event Controller)
              │
              ▼
         TASK-07 (Event Routes)
              │
              ▼
         TASK-08 (Mount routes in app.js)
              │
              ▼
         TASK-09 (Backend Unit Tests)
              │
              ▼
         TASK-10 (Backend Integration Tests)
              │
              ▼
         TASK-11 (Frontend API Service)
              │
              ▼
         TASK-12 (Frontend Custom Hook)
              │
              ▼
         TASK-13 (Frontend EventDetailPage)
              │
              ▼
         TASK-14 (Frontend Route Registration)
              │
              ▼
         TASK-15 (E2E Verification + Lint)
```

---

## Tasks

### TASK-01: Add `authenticateOptional` Middleware

| Field | Value |
|-------|-------|
| **Priority** | P0 — Blocker (tất cả task sau phụ thuộc) |
| **Estimated Effort** | 15 minutes |
| **File** | `backend/src/middlewares/auth.middleware.js` |
| **Action** | UPDATE (thêm export function) |
| **Dependencies** | None |

**Summary**: Thêm middleware `authenticateOptional` vào `auth.middleware.js`. Middleware này parse JWT từ cookie nếu có, nhưng KHÔNG throw 401 nếu không có token hoặc token invalid — thay vào đó set `req.user = null` để fallback về Guest.

**Acceptance Criteria**:

- [ ] Không có token → `req.user = null`, gọi `next()`
- [ ] Token valid → decode JWT, set `req.user = { user_id, email, role }`, gọi `next()`
- [ ] Token expired/invalid → `req.user = null`, gọi `next()` (không throw)
- [ ] Export named `authenticateOptional`

**Files Changed**:

- `backend/src/middlewares/auth.middleware.js`

**Test Cases**: N/A (covered by TASK-10 integration tests)

---

### TASK-02: Create Event Repository

| Field | Value |
|-------|-------|
| **Priority** | P0 — Blocker |
| **Estimated Effort** | 20 minutes |
| **File** | `backend/src/repositories/event.repository.js` |
| **Action** | CREATE |
| **Dependencies** | TASK-01 |

**Summary**: Tạo event repository với method `findByIdWithRelations`. Method thực hiện Prisma `findUnique` với PRIMARY KEY lookup trên `id`, kèm theo filter `isActive: true` và `status IN ['PUBLISHED', 'IN_PROGRESS', 'COMPLETED']`. Include cả `category` và `createdByUser` relations.

**Acceptance Criteria**:

- [ ] Export named `findByIdWithRelations`
- [ ] Query chỉ trả về event có `isActive: true`
- [ ] Query chỉ trả về event có `status IN ['PUBLISHED', 'IN_PROGRESS', 'COMPLETED']`
- [ ] Include `category` với select `{ id, name, categoryType }`
- [ ] Include `createdByUser` với select `{ id, fullName, avatarUrl }`
- [ ] Select tất cả field trong EventDetailDTO (xem data-model.md)
- [ ] Return `null` khi không tìm thấy (không throw)

**Files Changed**:

- `backend/src/repositories/event.repository.js` (CREATE)

**Test Cases**: Covered by TASK-09 unit tests

---

### TASK-03: Create Application Repository (extend if exists)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Estimated Effort** | 15 minutes |
| **File** | `backend/src/repositories/application.repository.js` |
| **Action** | CREATE hoặc UPDATE (thêm method mới) |
| **Dependencies** | TASK-02 |

**Summary**: Tạo hoặc mở rộng `application.repository.js` với method `findByUserAndEvent`. Method thực hiện Prisma `findUnique` trên composite unique key `userId_eventId`. Chỉ select fields `id`, `status`, `createdAt` — không select `message`, `processedBy`, `processedAt`.

**Acceptance Criteria**:

- [ ] Export named `findByUserAndEvent`
- [ ] Sử dụng `where: { userId_eventId: { userId, eventId } }`
- [ ] Select chỉ 3 fields: `id`, `status`, `createdAt`
- [ ] Return `null` khi không tìm thấy application
- [ ] Nếu file đã tồn tại, chỉ thêm method mới (không ghi đè)

**Files Changed**:

- `backend/src/repositories/application.repository.js` (CREATE hoặc UPDATE)

**Test Cases**: Covered by TASK-09 unit tests

---

### TASK-04: Create Event Service

| Field | Value |
|-------|-------|
| **Priority** | P0 — Blocker |
| **Estimated Effort** | 30 minutes |
| **File** | `backend/src/services/event.service.js` |
| **Action** | CREATE |
| **Dependencies** | TASK-02, TASK-03 |

**Summary**: Tạo event service với method `getEventDetail(eventId, userId)`. Implement toàn bộ business logic: fetch event, fetch application nếu có userId, compute `remainingSlots` và `isFull`, map về DTO.

**Acceptance Criteria**:

- [ ] Export named `getEventDetail`
- [ ] Gọi `eventRepository.findByIdWithRelations(eventId)`
- [ ] Throw `AppError(404, 'NOT_FOUND')` khi event là `null`
- [ ] Nếu `userId !== null && userId !== undefined` → gọi `applicationRepository.findByUserAndEvent(userId, eventId)`
- [ ] Nếu có application → map `{ id, status, createdAt: createdAt.toISOString() }`
- [ ] Nếu không có application → `userApplication = null`
- [ ] Compute `remainingSlots = maxCapacity - approvedParticipants`
- [ ] Compute `isFull = approvedParticipants >= maxCapacity`
- [ ] Map toàn bộ fields về DTO theo data-model.md
- [ ] Convert tất cả Date fields sang ISO 8601 string
- [ ] Category null-safe: `event.category ? {...} : null`
- [ ] createdBy null-safe: `event.createdByUser ? {...} : null`

**Files Changed**:

- `backend/src/services/event.service.js` (CREATE)

**Test Cases**: See TASK-09

---

### TASK-05: Create Event Validator

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Estimated Effort** | 10 minutes |
| **File** | `backend/src/middlewares/validators/event.validator.js` |
| **Action** | CREATE |
| **Dependencies** | TASK-04 |

**Summary**: Tạo Zod validation schema `getByIdParamSchema` cho path parameter `id`. Validate `id` là số nguyên dương (sử dụng `z.coerce.number().int().positive()`).

**Acceptance Criteria**:

- [ ] Export named `getByIdParamSchema`
- [ ] Schema validate `id` là số nguyên dương
- [ ] Coerce string → number (query string compatibility)
- [ ] Sử dụng `required_error` và `invalid_type_error` tiếng Việt
- [ ] Pass validation khi `id = "1"`, `id = "42"`
- [ ] Fail validation khi `id = "abc"`, `id = "0"`, `id = "-1"`

**Files Changed**:

- `backend/src/middlewares/validators/event.validator.js` (CREATE)

**Test Cases**: Covered by TASK-10 integration tests

---

### TASK-06: Create Event Controller

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Estimated Effort** | 20 minutes |
| **File** | `backend/src/controllers/event.controller.js` |
| **Action** | CREATE |
| **Dependencies** | TASK-04, TASK-05 |

**Summary**: Tạo event controller với method `getById`. Controller nhận `id` từ `req.params`, lấy `userId` từ `req.user?.user_id ?? null`, gọi `eventService.getEventDetail()` và trả về response theo format ADR-006 (`{ success: true, data: ... }`). Kèm Swagger JSDoc comment.

**Acceptance Criteria**:

- [ ] Export named `getById`
- [ ] Parse `id` từ `req.params.id` và convert sang `Number`
- [ ] Extract `userId = req.user?.user_id ?? null`
- [ ] Gọi `eventService.getEventDetail(Number(id), userId)`
- [ ] Return `res.status(200).json({ success: true, data: eventDetail })`
- [ ] Wrap trong `try/catch` và pass error qua `next(error)`
- [ ] Có Swagger JSDoc comment đầy đủ (summary, tags, parameters, responses 200/400/404/500)
- [ ] Không có business logic trong controller (delegate hết qua service)

**Files Changed**:

- `backend/src/controllers/event.controller.js` (CREATE)

**Test Cases**: Covered by TASK-10 integration tests

---

### TASK-07: Create Event Routes

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Estimated Effort** | 15 minutes |
| **File** | `backend/src/routes/event.routes.js` |
| **Action** | CREATE |
| **Dependencies** | TASK-05, TASK-06 |

**Summary**: Tạo event routes với route `GET /:id`. Chain: `validate({ params: getByIdParamSchema })` → `authenticateOptional` → `eventController.getById`. Kèm Swagger component schema `EventDetailDTO`.

**Acceptance Criteria**:

- [ ] Export default Express Router
- [ ] Route `GET /:id` với đúng thứ tự middleware: validate → authenticateOptional → controller
- [ ] Import `authenticateOptional` từ `auth.middleware.js`
- [ ] Import `validate` từ `middlewares/validators/validate.js`
- [ ] Import `getByIdParamSchema` từ `middlewares/validators/event.validator.js`
- [ ] Có Swagger component schema `EventDetailDTO` trong JSDoc
- [ ] Đúng prefix: khi mount tại `/api/v1/events`, full path là `/api/v1/events/:id`

**Files Changed**:

- `backend/src/routes/event.routes.js` (CREATE)

**Test Cases**: Covered by TASK-10 integration tests

---

### TASK-08: Mount Event Routes in app.js

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Estimated Effort** | 5 minutes |
| **File** | `backend/src/app.js` |
| **Action** | UPDATE |
| **Dependencies** | TASK-07 |

**Summary**: Import và mount event routes vào Express app tại prefix `/api/v1/events`.

**Acceptance Criteria**:

- [ ] Import `eventRoutes` từ `./routes/event.routes.js`
- [ ] Mount tại `app.use('/api/v1/events', eventRoutes)`
- [ ] Đặt đúng vị trí trong file (trước error handling middleware, sau các middleware cơ bản)
- [ ] App khởi động không lỗi

**Files Changed**:

- `backend/src/app.js` (UPDATE)

**Test Cases**: Covered by TASK-10 integration tests

---

### TASK-09: Write Unit Tests for Event Service

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Estimated Effort** | 45 minutes |
| **File** | `backend/tests/unit/event.service.test.js` |
| **Action** | CREATE |
| **Dependencies** | TASK-04 |

**Summary**: Viết unit tests cho `eventService.getEventDetail` với mock repositories. Coverage tối thiểu 80%. Test cả happy path và edge cases.

**Acceptance Criteria**:

- [ ] Test: Guest (userId = null) nhận event detail với `userApplication: null`
- [ ] Test: Guest không trigger `applicationRepository.findByUserAndEvent`
- [ ] Test: Volunteer không có application → `userApplication: null`
- [ ] Test: Volunteer có application → `userApplication = { id, status, createdAt }`
- [ ] Test: Throw `AppError` 404 khi event không tồn tại
- [ ] Test: `remainingSlots` và `isFull` tính đúng
- [ ] Test: `isFull = true` khi `approvedParticipants >= maxCapacity`
- [ ] Test: `isFull = false` khi còn slots
- [ ] Test: Category null-safe (event không có category → `category: null`)
- [ ] Test: createdBy null-safe (event không có createdBy → `createdBy: null`)
- [ ] Use `jest.mock()` cho cả 2 repositories
- [ ] `beforeEach` clear all mocks

**Files Changed**:

- `backend/tests/unit/event.service.test.js` (CREATE)

**Estimated Coverage**: 100% lines, 100% branches

---

### TASK-10: Write Integration Tests for Event API

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Estimated Effort** | 45 minutes |
| **File** | `backend/tests/integration/event.test.js` |
| **Action** | CREATE |
| **Dependencies** | TASK-08 |

**Summary**: Viết integration tests cho `GET /api/v1/events/:id` sử dụng Supertest. Test cả 2 scenarios: Guest (không auth) và Volunteer (có auth cookie).

**Acceptance Criteria**:

- [ ] **Guest Tests** (6 cases):
  - [ ] 200: Event PUBLISHED → `userApplication: null`
  - [ ] 200: Event IN_PROGRESS → `userApplication: null`
  - [ ] 200: Event COMPLETED → `userApplication: null`
  - [ ] 404: Event DRAFT (không hiển thị)
  - [ ] 404: Event ID không tồn tại
  - [ ] 400: ID không hợp lệ (`"abc"`)
- [ ] **Volunteer Tests** (4 cases):
  - [ ] 200: Có application → `userApplication` not null, có `id`, `status`, không có `message`
  - [ ] 200: Không có application → `userApplication: null`
  - [ ] 200: Token expired → vẫn return Guest response (không 401)
  - [ ] 200: Không có cookie → vẫn return Guest response
- [ ] **Security Tests** (2 cases):
  - [ ] Không expose `message`, `processedBy`, `processedAt` trong `userApplication`
  - [ ] Không expose internal error details trong 500 response
- [ ] Response format tuân thủ ADR-006: `{ success: true, data: {...} }`

**Files Changed**:

- `backend/tests/integration/event.test.js` (CREATE)

**Note**: Integration tests có thể cần seed data hoặc mock DB. Điều chỉnh test data dựa trên database state hiện tại.

---

### TASK-11: Create Frontend API Service

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Estimated Effort** | 10 minutes |
| **File** | `frontend/src/services/event.service.js` |
| **Action** | CREATE |
| **Dependencies** | TASK-08 (API phải hoạt động) |

**Summary**: Tạo frontend API client service với method `getEventById(id)`. Gọi `axiosApi.get('/events/${id}')` với `credentials: include` tự động từ axiosApi.

**Acceptance Criteria**:

- [ ] Export named `getEventById`
- [ ] Gọi `axiosApi.get('/events/${id}')`
- [ ] Return `response.data` (đã được axiosApi transform)
- [ ] Error để hook xử lý (không catch trong service)

**Files Changed**:

- `frontend/src/services/event.service.js` (CREATE)

**Test Cases**: N/A (covered by TASK-13 component tests nếu có)

---

### TASK-12: Create Frontend Custom Hook

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Estimated Effort** | 15 minutes |
| **File** | `frontend/src/hooks/useEventDetail.js` |
| **Action** | CREATE |
| **Dependencies** | TASK-11 |

**Summary**: Tạo custom hook `useEventDetail(eventId)` để fetch event detail. Quản lý 3 states: `event`, `loading`, `error`. Hỗ trợ `refetch`.

**Acceptance Criteria**:

- [ ] Export named `useEventDetail`
- [ ] Nhận `eventId` làm parameter
- [ ] State `event` khởi tạo `null`
- [ ] State `loading` khởi tạo `true`
- [ ] State `error` khởi tạo `null`
- [ ] Gọi `getEventById(eventId)` trong `useEffect`
- [ ] Set `loading = false` trong `finally`
- [ ] Set `error` khi catch exception (extract message từ response)
- [ ] Không fetch nếu `eventId` là falsy
- [ ] Return `{ event, loading, error, refetch }`

**Files Changed**:

- `frontend/src/hooks/useEventDetail.js` (CREATE)

**Test Cases**: N/A (covered by TASK-13 component tests nếu có)

---

### TASK-13: Create EventDetailPage Component

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Estimated Effort** | 60 minutes |
| **File** | `frontend/src/components/pages/EventDetailPage.jsx` |
| **Action** | CREATE |
| **Dependencies** | TASK-12 |

**Summary**: Tạo React component `EventDetailPage` hiển thị chi tiết sự kiện. Hỗ trợ 4 states: loading, error, empty (404), success. Phân biệt hiển thị cho Guest và Volunteer.

**Acceptance Criteria**:

- [ ] **Loading State**: Hiển thị `<LoadingSpinner>` khi `loading === true`
- [ ] **Error State**: Hiển thị `<ErrorState>` với message và nút "Thử lại" khi `error !== null`
- [ ] **Empty State**: Hiển thị `<EmptyState>` khi event `null` sau khi loaded
- [ ] **Success State — Event Info**:
  - [ ] Banner image (nếu có `imageUrl`)
  - [ ] Title + Status badge (PUBLISHED=info, IN_PROGRESS=warning, COMPLETED=secondary)
  - [ ] Category badge
  - [ ] Created by info
  - [ ] Capacity: maxCapacity, approvedParticipants, remainingSlots/isFull
  - [ ] Dates: startDate, endDate, applicationDeadline (format tiếng Việt)
  - [ ] Location
  - [ ] Description (render HTML từ `dangerouslySetInnerHTML`)
- [ ] **Success State — Volunteer (đã đăng nhập)**:
  - [ ] Sidebar: "Trạng thái đơn đăng ký" nếu có `userApplication`
  - [ ] Hiển thị application status với màu tương ứng (PENDING=warning, APPROVED=success, REJECTED=danger, CANCELLED=secondary)
  - [ ] Hiển thị ngày đăng ký
- [ ] **Success State — Actions**:
  - [ ] Nút "Quay lại" luôn hiển thị (gọi `navigate(-1)`)
  - [ ] Nút "Đăng ký tham gia" chỉ hiển thị khi: user là VOLUNTEER, chưa có application, event PUBLISHED, chưa full
- [ ] **Sidebar**: Thông tin người tổ chức (avatar + tên) nếu có
- [ ] Sử dụng `useParams()` để lấy `id` từ URL
- [ ] Sử dụng `useAuth()` để kiểm tra user role
- [ ] Định dạng ngày tháng theo locale `vi-VN`

**Files Changed**:

- `frontend/src/components/pages/EventDetailPage.jsx` (CREATE)

**Test Cases** (Frontend — tùy chọn):

- [ ] Render loading spinner khi đang fetch
- [ ] Render error state khi fetch fails
- [ ] Render event detail khi fetch thành công
- [ ] Render application status cho Volunteer
- [ ] Không render "Đăng ký tham gia" cho Guest

---

### TASK-14: Register Frontend Route

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Estimated Effort** | 5 minutes |
| **File** | `frontend/src/App.js` |
| **Action** | UPDATE |
| **Dependencies** | TASK-13 |

**Summary**: Thêm route `/events/:id` vào React Router trong `App.js`.

**Acceptance Criteria**:

- [ ] Import `EventDetailPage` từ `./components/pages/EventDetailPage`
- [ ] Thêm `<Route path="/events/:id" element={<EventDetailPage />} />`
- [ ] Đặt trong `<Routes>` (không wrap thêm ProtectedRoute vì trang public)
- [ ] App compile không lỗi

**Files Changed**:

- `frontend/src/App.js` (UPDATE)

**Test Cases**: N/A

---

### TASK-15: E2E Verification & Lint

| Field | Value |
|-------|-------|
| **Priority** | P3 — Final |
| **Estimated Effort** | 20 minutes |
| **File** | Multiple |
| **Action** | VERIFY |
| **Dependencies** | TASK-01 through TASK-14 |

**Summary**: Chạy toàn bộ test suite, lint check, và kiểm tra thủ công luồng Guest + Volunteer.

**Acceptance Criteria**:

- [ ] `npm run lint` pass không có errors (backend)
- [ ] `npm test` pass tất cả test cases liên quan đến event
- [ ] Unit test coverage cho `event.service.js` ≥ 80%
- [ ] API trả về đúng format cho Guest (không auth)
- [ ] API trả về đúng format cho Volunteer (có auth + đã apply)
- [ ] API trả về 404 cho event ẩn/không tồn tại
- [ ] API trả về 400 cho ID không hợp lệ
- [ ] Frontend render đúng 4 states: loading, error, empty, success
- [ ] Frontend hiển thị application status cho Volunteer
- [ ] Frontend hiển thị nút "Đăng ký tham gia" đúng điều kiện
- [ ] Không có warning/error trong browser console
- [ ] Responsive trên mobile (kiểm tra Bootstrap grid)

**Files Changed**: None (verify only)

---

## Task Execution Order (Sequential)

```
Phase 2A — Backend Foundation:
  TASK-01 → TASK-02 → TASK-03 → TASK-04 → TASK-05 → TASK-06 → TASK-07 → TASK-08

Phase 2B — Backend Testing:
  TASK-09
  TASK-10

Phase 2C — Frontend:
  TASK-11 → TASK-12 → TASK-13 → TASK-14

Phase 2D — Verification:
  TASK-15
```

### Parallel Opportunities

- **TASK-02** và **TASK-03** có thể làm song song (cùng không phụ thuộc nhau)
- **TASK-09** (Unit tests) và **TASK-07** (Routes) có thể làm song song sau TASK-04
- **TASK-11** và **TASK-12** có thể bắt đầu ngay khi backend API sẵn sàng (không cần đợi TASK-09, TASK-10)

---

## Summary

| Phase | Tasks | Est. Effort | Priority |
|-------|-------|-------------|----------|
| 2A — Backend Foundation | TASK-01 → TASK-08 | ~2.0 hours | P0/P1 |
| 2B — Backend Testing | TASK-09, TASK-10 | ~1.5 hours | P1 |
| 2C — Frontend | TASK-11 → TASK-14 | ~1.5 hours | P2 |
| 2D — Verification | TASK-15 | ~0.3 hours | P3 |
| **Total** | **15 tasks** | **~5.3 hours** | |

---

**END OF TASKS.MD**

# tasks.md — Phase 2: Task Breakdown for UC14 Cancel Application

**Feature**: UC14-feat-cancel-application
**Date**: 2026-07-21
**Author**: AI Agent (CuongLH)

---

## Task Dependency Graph

```
TASK-01 (Application Repository — UPDATE)
    │
    ▼
TASK-02 (Application Service — CREATE)
    │
    ├──► TASK-03 (Application Validator — CREATE)
    │
    ▼
TASK-04 (Application Controller — CREATE)
    │
    ▼
TASK-05 (Application Routes — CREATE)
    │
    ▼
TASK-06 (Mount routes in app.js — UPDATE)
    │
    ▼
TASK-07 (Unit Tests — CREATE)
    │
    ▼
TASK-08 (Integration Tests — CREATE)
    │
    ▼
TASK-09 (E2E Verification + Lint)
```

---

## Tasks

### TASK-01: Update Application Repository — Add `findByIdWithEvent` and `cancelApplication`

| Field | Value |
|-------|-------|
| **Priority** | P0 — Blocker (tất cả task sau phụ thuộc) |
| **Estimated Effort** | 25 minutes |
| **File** | `backend/src/repositories/application.repository.js` |
| **Action** | UPDATE (thêm 2 method) |
| **Dependencies** | None |

**Summary**: Thêm 2 method vào application repository hiện có:

1. `findByIdWithEvent(applicationId, userId)` — JOIN với Event để lấy status + startDate của event, filter theo userId để đảm bảo chỉ chủ đơn mới xem được.
2. `cancelApplication(applicationId, eventId, currentStatus)` — Atomic transaction: update application status → CANCELLED, nếu APPROVED thì decrement approvedParticipants (guard `gt: 0`).

**Acceptance Criteria**:

- [ ] Export named `findByIdWithEvent`
- [ ] `findByIdWithEvent` sử dụng `prisma.application.findFirst` với `where: { id, userId }`
- [ ] Include event với select `{ id, status, startDate, approvedParticipants }`
- [ ] Select application fields: `id, userId, eventId, status, message, createdAt, updatedAt`
- [ ] Return `null` khi không tìm thấy (không throw)
- [ ] Export named `cancelApplication`
- [ ] `cancelApplication` sử dụng `prisma.$transaction` để đảm bảo atomicity
- [ ] Khi `currentStatus === 'APPROVED'` → `tx.event.update` với `where: { approvedParticipants: { gt: 0 } }` và `data: { approvedParticipants: { decrement: 1 } }`
- [ ] Fallback read event nếu `approvedParticipants = 0` (guard: không update được)
- [ ] Khi `currentStatus === 'PENDING'` → read-only event (không decrement)
- [ ] Không ghi đè các method hiện có trong file

**Files Changed**:

- `backend/src/repositories/application.repository.js` (UPDATE)

**Test Cases**: Covered by TASK-07 unit tests

**Reference**: `quickstart.md` Bước 1

---

### TASK-02: Create Application Service — `cancelUserApplication`

| Field | Value |
|-------|-------|
| **Priority** | P0 — Blocker |
| **Estimated Effort** | 30 minutes |
| **File** | `backend/src/services/application.service.js` |
| **Action** | CREATE |
| **Dependencies** | TASK-01 |

**Summary**: Tạo application service với method `cancelUserApplication(applicationId, userId)`. Implement toàn bộ business rules: kiểm tra application tồn tại + thuộc về user, kiểm tra status (PENDING/APPROVED), kiểm tra event status (PUBLISHED), kiểm tra event chưa bắt đầu, gọi repository atomic cancel.

**Acceptance Criteria**:

- [ ] Export named `cancelUserApplication`
- [ ] Gọi `findByIdWithEvent(applicationId, userId)` từ repository
- [ ] Throw `AppError(404, 'NOT_FOUND', 'Không tìm thấy đơn đăng ký.')` khi application là `null`
- [ ] Throw `AppError(409, 'CONFLICT', 'Đơn đăng ký này đã được hủy trước đó.')` khi status là `CANCELLED`
- [ ] Throw `AppError(409, 'CONFLICT', 'Đơn đăng ký này đã bị từ chối, không thể hủy.')` khi status là `REJECTED`
- [ ] Throw `AppError(409, 'CONFLICT', 'Sự kiện không còn khả dụng để hủy đơn đăng ký.')` khi event status không phải `PUBLISHED`
- [ ] Throw `AppError(409, 'CONFLICT', 'Sự kiện đã bắt đầu, không thể hủy đơn đăng ký.')` khi `new Date(event.startDate) <= new Date()`
- [ ] Gọi `cancelApplication(applicationId, event.id, application.status)` khi tất cả validation pass
- [ ] Return DTO với `{ id, userId, eventId, status, message, createdAt, updatedAt, event: { id, approvedParticipants } }`
- [ ] Convert Date fields sang ISO 8601 string
- [ ] Sử dụng `AppError` từ `../utils/app-error.util.js`

**Files Changed**:

- `backend/src/services/application.service.js` (CREATE)

**Test Cases**: See TASK-07

**Reference**: `quickstart.md` Bước 2

---

### TASK-03: Create Application Validator

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Estimated Effort** | 10 minutes |
| **File** | `backend/src/middlewares/validators/application.validator.js` |
| **Action** | CREATE |
| **Dependencies** | TASK-02 |

**Summary**: Tạo Zod validation schema `cancelApplicationParamSchema` cho path parameter `id`. Validate `id` là số nguyên dương (sử dụng `z.coerce.number().int().positive()`).

**Acceptance Criteria**:

- [ ] Export named `cancelApplicationParamSchema`
- [ ] Schema validate `id` là số nguyên dương
- [ ] Coerce string → number (query string compatibility)
- [ ] Sử dụng `required_error` và `invalid_type_error` tiếng Việt
- [ ] `.max(2147483647)` để phù hợp với MySQL INT
- [ ] Pass validation khi `id = "1"`, `id = "42"`
- [ ] Fail validation khi `id = "abc"`, `id = "0"`, `id = "-1"`

**Files Changed**:

- `backend/src/middlewares/validators/application.validator.js` (CREATE)

**Test Cases**: Covered by TASK-08 integration tests

**Reference**: `quickstart.md` Bước 3

---

### TASK-04: Create Application Controller

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Estimated Effort** | 20 minutes |
| **File** | `backend/src/controllers/application.controller.js` |
| **Action** | CREATE |
| **Dependencies** | TASK-02, TASK-03 |

**Summary**: Tạo application controller với method `cancelApplication`. Controller nhận `id` từ `req.params`, lấy `userId` từ `req.user.user_id`, gọi `applicationService.cancelUserApplication()` và trả về response theo format ADR-006 (`{ success: true, message: ..., data: ... }`). Kèm Swagger JSDoc comment.

**Acceptance Criteria**:

- [ ] Export named `cancelApplication`
- [ ] Parse `id` từ `req.params.id` và convert sang `Number`
- [ ] Extract `userId = req.user.user_id`
- [ ] Gọi `applicationService.cancelUserApplication(Number(id), userId)`
- [ ] Return `res.status(200).json({ success: true, message: 'Đơn đăng ký đã được hủy thành công.', data: result })`
- [ ] Wrap trong `try/catch` và pass error qua `next(error)`
- [ ] Có Swagger JSDoc comment đầy đủ (summary, description với business rules, tags, security, parameters, responses 200/400/401/403/404/409/500)
- [ ] Không có business logic trong controller (delegate hết qua service)
- [ ] Response 200 chứa `data.event.approvedParticipants` để client có thể cập nhật UI

**Files Changed**:

- `backend/src/controllers/application.controller.js` (CREATE)

**Test Cases**: Covered by TASK-08 integration tests

**Reference**: `quickstart.md` Bước 4

---

### TASK-05: Create Application Routes

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Estimated Effort** | 15 minutes |
| **File** | `backend/src/routes/application.routes.js` |
| **Action** | CREATE |
| **Dependencies** | TASK-03, TASK-04 |

**Summary**: Tạo application routes với route `PATCH /:id/cancel`. Chain: `authenticate` → `authorize('VOLUNTEER')` → `validateParams(cancelApplicationParamSchema)` → `applicationController.cancelApplication`.

**Acceptance Criteria**:

- [ ] Export default Express Router
- [ ] Route `PATCH /:id/cancel` với đúng thứ tự middleware: authenticate → authorize → validateParams → controller
- [ ] Import `authenticate` và `authorize` từ `auth.middleware.js`
- [ ] Import `validateParams` từ `middlewares/validators/validate.js`
- [ ] Import `cancelApplicationParamSchema` từ `middlewares/validators/application.validator.js`
- [ ] Import `* as applicationController` từ `controllers/application.controller.js`
- [ ] `authorize('VOLUNTEER')` — chỉ Volunteer mới có quyền cancel
- [ ] Đúng prefix: khi mount tại `/api/v1/applications`, full path là `/api/v1/applications/:id/cancel`

**Files Changed**:

- `backend/src/routes/application.routes.js` (CREATE)

**Test Cases**: Covered by TASK-08 integration tests

**Reference**: `quickstart.md` Bước 5

---

### TASK-06: Mount Application Routes in app.js

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Estimated Effort** | 5 minutes |
| **File** | `backend/src/app.js` |
| **Action** | UPDATE |
| **Dependencies** | TASK-05 |

**Summary**: Import và mount application routes vào Express app tại prefix `/api/v1/applications`.

**Acceptance Criteria**:

- [ ] Import `applicationRoutes` từ `./routes/application.routes.js`
- [ ] Mount tại `app.use('/api/v1/applications', applicationRoutes)`
- [ ] Đặt đúng vị trí trong file (trước error handling middleware, sau các middleware cơ bản)
- [ ] App khởi động không lỗi

**Files Changed**:

- `backend/src/app.js` (UPDATE)

**Test Cases**: Covered by TASK-08 integration tests

**Reference**: `quickstart.md` Bước 6

---

### TASK-07: Write Unit Tests for Application Service

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Estimated Effort** | 45 minutes |
| **File** | `backend/tests/unit/application.service.test.js` |
| **Action** | CREATE |
| **Dependencies** | TASK-02 |

**Summary**: Viết unit tests cho `cancelUserApplication` với mock repositories. Coverage tối thiểu 80%. Test cả happy path và error paths.

**Acceptance Criteria**:

- [ ] **Happy Path** (2 cases):
  - [ ] Cancel PENDING application → status CANCELLED, approvedParticipants không đổi
  - [ ] Cancel APPROVED application → status CANCELLED, approvedParticipants giảm 1
- [ ] **Error Cases** (6 cases):
  - [ ] Throw 404 khi application không tồn tại (null)
  - [ ] Throw 409 khi application đã CANCELLED
  - [ ] Throw 409 khi application đã REJECTED
  - [ ] Throw 409 khi event không PUBLISHED (IN_PROGRESS)
  - [ ] Throw 409 khi event đã bắt đầu (startDate < now)
  - [ ] Throw 409 khi event bắt đầu đúng thời điểm hiện tại (startDate === now)
- [ ] Mock `findByIdWithEvent` và `cancelApplication` từ repository
- [ ] Sử dụng `jest.useFakeTimers()` + `jest.setSystemTime()` để kiểm soát thời gian
- [ ] `beforeEach` clear all mocks và reset timers
- [ ] `afterEach` restore real timers

**Files Changed**:

- `backend/tests/unit/application.service.test.js` (CREATE)

**Estimated Coverage**: 100% lines, 100% branches

**Reference**: `quickstart.md` Bước 7

---

### TASK-08: Write Integration Tests for Cancel Application API

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Estimated Effort** | 45 minutes |
| **File** | `backend/tests/integration/application.cancel.test.js` |
| **Action** | CREATE |
| **Dependencies** | TASK-06 |

**Summary**: Viết integration tests cho `PATCH /api/v1/applications/:id/cancel` sử dụng Supertest. Test cả happy path và error paths với JWT authentication.

**Acceptance Criteria**:

- [ ] **Happy Path** (2 cases):
  - [ ] 200: Cancel PENDING application → `status: 'CANCELLED'`, response có `event.approvedParticipants`
  - [ ] 200: Cancel APPROVED application → `status: 'CANCELLED'`, approvedParticipants giảm 1
- [ ] **Authorization** (3 cases):
  - [ ] 401: Không có JWT cookie (chưa đăng nhập)
  - [ ] 403: Token valid nhưng role không phải VOLUNTEER (e.g., MANAGER)
  - [ ] 403: Volunteer khác cố gắng cancel đơn của người khác (do repository filter userId)
- [ ] **Validation** (1 case):
  - [ ] 400: ID không hợp lệ (`"abc"`, `"0"`, `"-1"`)
- [ ] **Not Found** (1 case):
  - [ ] 404: Application ID không tồn tại
- [ ] **Conflict** (3 cases):
  - [ ] 409: Application đã CANCELLED
  - [ ] 409: Application đã REJECTED
  - [ ] 409: Event đã bắt đầu (startDate trong quá khứ)
- [ ] `beforeAll`: Login 2 volunteer accounts để lấy cookies
- [ ] Response format tuân thủ ADR-006: `{ success: true, message: '...', data: {...} }`

**Files Changed**:

- `backend/tests/integration/application.cancel.test.js` (CREATE)

**Note**: Integration tests cần seed data. Điều chỉnh test data dựa trên database state hiện tại. Cần có ít nhất:

- 1 event PUBLISHED (chưa bắt đầu)
- 1 application PENDING của volunteer
- 1 application APPROVED của volunteer
- 1 application CANCELLED của volunteer
- 1 application REJECTED của volunteer
- 1 application của volunteer khác
- 1 event PUBLISHED đã bắt đầu

**Reference**: `quickstart.md` Bước 8

---

### TASK-09: E2E Verification & Lint

| Field | Value |
|-------|-------|
| **Priority** | P3 — Final |
| **Estimated Effort** | 20 minutes |
| **File** | Multiple |
| **Action** | VERIFY |
| **Dependencies** | TASK-01 through TASK-08 |

**Summary**: Chạy toàn bộ test suite, lint check, và kiểm tra thủ công endpoint cancel application.

**Acceptance Criteria**:

- [ ] `npm run lint` pass không có errors (backend)
- [ ] `npm test` pass tất cả test cases liên quan đến application
- [ ] Unit test coverage cho `application.service.js` ≥ 80%
- [ ] **API Manual Verification**:
  - [ ] `PATCH /api/v1/applications/:id/cancel` với PENDING → 200, status CANCELLED
  - [ ] `PATCH /api/v1/applications/:id/cancel` với APPROVED → 200, approvedParticipants giảm
  - [ ] `PATCH /api/v1/applications/:id/cancel` không auth → 401
  - [ ] `PATCH /api/v1/applications/:id/cancel` sai role → 403
  - [ ] `PATCH /api/v1/applications/:id/cancel` với ID không tồn tại → 404
  - [ ] `PATCH /api/v1/applications/:id/cancel` với application đã CANCELLED → 409
  - [ ] `PATCH /api/v1/applications/:id/cancel` với application REJECTED → 409
  - [ ] `PATCH /api/v1/applications/:id/cancel` với event đã bắt đầu → 409
- [ ] **Domain Rules Verification**:
  - [ ] Cancel PENDING không đổi `approvedParticipants`
  - [ ] Cancel APPROVED giảm `approvedParticipants` đúng 1
  - [ ] `approvedParticipants` không bao giờ < 0
  - [ ] Application không bị xóa, chỉ chuyển status
  - [ ] Atomic transaction: không có trạng thái trung gian
- [ ] Swagger doc hiển thị đúng endpoint mới tại `/api-docs`
- [ ] Không có warning/error trong console khi start server

**Files Changed**: None (verify only)

---

## Task Execution Order (Sequential)

```
Phase 2A — Backend Foundation:
  TASK-01 → TASK-02 → TASK-03 → TASK-04 → TASK-05 → TASK-06

Phase 2B — Backend Testing:
  TASK-07
  TASK-08

Phase 2C — Verification:
  TASK-09
```

### Parallel Opportunities

- **TASK-03** (Validator) và **TASK-04** (Controller) có thể làm song song sau TASK-02
- **TASK-07** (Unit tests) và **TASK-05** (Routes) có thể làm song song sau TASK-02

---

## Summary

| Phase | Tasks | Est. Effort | Priority |
|-------|-------|-------------|----------|
| 2A — Backend Foundation | TASK-01 → TASK-06 | ~1.8 hours | P0/P1 |
| 2B — Backend Testing | TASK-07, TASK-08 | ~1.5 hours | P1 |
| 2C — Verification | TASK-09 | ~0.3 hours | P3 |
| **Total** | **9 tasks** | **~3.6 hours** | |

---

## Files Summary

| Action | Count | Files |
|--------|-------|-------|
| CREATE | 6 | `application.service.js`, `application.controller.js`, `application.validator.js`, `application.routes.js`, `application.service.test.js`, `application.cancel.test.js` |
| UPDATE | 2 | `application.repository.js`, `app.js` |
| VERIFY | 1 | TASK-09 (manual) |

---

**END OF TASKS.MD**

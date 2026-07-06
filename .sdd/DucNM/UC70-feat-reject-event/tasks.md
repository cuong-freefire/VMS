# Tasks: Reject Event (UC70)

**Input**: Design documents từ `.sdd/DucNM/UC70-feat-reject-event/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2, US3)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Kế thừa infrastructure từ UC67/UC68/UC69 (Event model, event.repository.js, event.service.js, event.controller.js, event.routes.js, event.validator.js)
- **New**: Prisma migration thêm rejection_reason, rejected_by, rejected_at fields

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Cập nhật Prisma schema và Zod validation

- [ ] T001 Thêm fields `rejection_reason` (String?), `rejected_by` (Int?, FK → User), `rejected_at` (DateTime?) vào Event model trong `backend/prisma/schema.prisma`
- [ ] T002 Chạy Prisma migration: `npx prisma migrate dev --name add_rejection_fields`
- [ ] T003 Tạo `rejectEventSchema` (Zod) trong `backend/src/validators/event.validator.js` — rejection_reason (string, min 10)

---

## Phase 2: User Story 1 - Manager từ chối sự kiện thành công (Priority: P1) 🎯 MVP

**Goal**: Manager/Admin gọi `PATCH /api/v1/events/:id/reject` và chuyển event PENDING → REJECTED kèm lý do.

**Independent Test**: Tạo event PENDING, gọi `PATCH /api/v1/events/1/reject` với body { rejection_reason } + Manager token, kiểm tra response 200 + status = REJECTED + rejection_reason + rejected_by + rejected_at.

### Tests cho User Story 1 ⚠️

- [ ] T004 [P] [US1] Unit test cho `event.service.js` — `rejectEvent` với Manager (PENDING) → 200 + status = REJECTED trong `backend/tests/event/event.service.test.js`
- [ ] T005 [P] [US1] Unit test cho `event.service.js` — `rejectEvent` với Admin (PENDING) → 200 + status = REJECTED
- [ ] T006 [P] [US1] Unit test cho `event.service.js` — `rejectEvent` với ID không tồn tại → throw ServiceError 404 `EVENT_NOT_FOUND`
- [ ] T007 [P] [US1] Unit test cho `event.service.js` — `rejectEvent` với ID không hợp lệ → throw ServiceError 400 `INVALID_EVENT_ID`
- [ ] T008 [P] [US1] Integration test cho `PATCH /api/v1/events/:id/reject` — Manager token (PENDING) → HTTP 200 trong `backend/tests/event/event.api.test.js`
- [ ] T009 [US1] Integration test cho `PATCH /api/v1/events/:id/reject` — Admin token (PENDING) → HTTP 200

### Implementation cho User Story 1

- [ ] T010 [US1] Implement `rejectEvent` trong `backend/src/services/event.service.js` — validate ID → validate input → check exists → check PENDING status → update (status, rejection_reason, rejected_by, rejected_at) → audit log
- [ ] T011 [US1] Implement `rejectEventHandler` trong `backend/src/controllers/event.controller.js` — gọi service + trả về 200
- [ ] T012 [US1] Thêm route `PATCH /:id/reject` trong `backend/src/routes/event.routes.js` — middleware chain: authMiddleware → authorize('MANAGER', 'ADMIN') → rejectEventHandler
- [ ] T013 [US1] Thêm Swagger JSDoc cho endpoint `PATCH /api/v1/events/:id/reject` trong `backend/src/routes/event.routes.js`

**Checkpoint**: User Story 1 hoàn thành — Manager/Admin từ chối event thành công.

---

## Phase 3: User Story 2 - Validate lý do từ chối (Priority: P1)

**Goal**: Hệ thống kiểm tra rejection_reason bắt buộc, tối thiểu 10 ký tự — trả về 400 nếu không hợp lệ.

**Independent Test**: Gọi `PATCH /api/v1/events/1/reject` với body rỗng → 400. Gọi với reason < 10 ký tự → 400.

### Tests cho User Story 2 ⚠️

- [ ] T014 [P] [US2] Unit test cho `event.service.js` — `rejectEvent` với rejection_reason < 10 ký tự → throw ServiceError 400 `VALIDATION_ERROR` trong `backend/tests/event/event.service.test.js`
- [ ] T015 [P] [US2] Unit test cho `event.service.js` — `rejectEvent` với body rỗng → throw ServiceError 400 `VALIDATION_ERROR`
- [ ] T016 [P] [US2] Integration test cho `PATCH /api/v1/events/:id/reject` — body rỗng → HTTP 400 trong `backend/tests/event/event.api.test.js`
- [ ] T017 [US2] Integration test cho `PATCH /api/v1/events/:id/reject` — reason < 10 ký tự → HTTP 400

### Implementation cho User Story 2

- [ ] T018 [US2] Zod schema `rejectEventSchema` đã implement ở T003 — validation tự động từ Zod safeParse

**Checkpoint**: User Story 2 hoàn thành — Validation lý do từ chối hoạt động.

---

## Phase 4: User Story 3 - Chặn truy cập với người dùng không có quyền (Priority: P1)

**Goal**: Staff/Volunteer nhận 403, Guest nhận 401 khi gọi `PATCH /api/v1/events/:id/reject`.

**Independent Test**: Gọi `PATCH /api/v1/events/1/reject` với token Staff → 403. Không token → 401.

### Tests cho User Story 3 ⚠️

- [ ] T019 [P] [US3] Integration test — Staff token → HTTP 403 trong `backend/tests/event/event.api.test.js`
- [ ] T020 [P] [US3] Integration test — Volunteer token → HTTP 403
- [ ] T021 [P] [US3] Integration test — không token → HTTP 401

### Implementation cho User Story 3

- [ ] T022 [US3] Middleware chain đã implement ở T012 — `authorize('MANAGER', 'ADMIN')` xử lý 403, `authMiddleware` xử lý 401. **(Không cần code mới)**

**Checkpoint**: User Story 3 hoàn thành — endpoint được bảo vệ đúng phân quyền.

---

## Phase 5: Status Validation & Edge Cases

**Purpose**: Xử lý validation status và edge cases

### Tests ⚠️

- [ ] T023 [P] Unit test — `rejectEvent` với event đã APPROVED → throw 409 `INVALID_STATUS` trong `backend/tests/event/event.service.test.js`
- [ ] T024 [P] Unit test — `rejectEvent` với event đã REJECTED → throw 409
- [ ] T025 [P] Unit test — `rejectEvent` với event ONGOING → throw 409
- [ ] T026 [P] Integration test — `PATCH /api/v1/events/1/reject` (APPROVED) → HTTP 409 trong `backend/tests/event/event.api.test.js`
- [ ] T027 [P] Integration test — database không phản hồi → HTTP 500

### Implementation

- [ ] T028 Status validation đã implement ở T010 — kiểm tra `event.status !== 'PENDING'` → 409

---

## Phase 6: Frontend

**Purpose**: Thêm nút Reject + dialog nhập lý do trên Pending Event Detail page

- [ ] T029 [P] Thêm `rejectEvent(id, data)` trong `frontend/src/api/eventApi.js`
- [ ] T030 Cập nhật `PendingEventDetailPage.jsx` — thêm Reject button + Dialog nhập rejection_reason + validation (min 10) + submit

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T003 — chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên Phase 1 + UC67-UC69 infrastructure
- **User Story 2 (Phase 3)**: Depends trên T003 (Zod schema) + T010 (service validation)
- **User Story 3 (Phase 4)**: Depends trên T012 (middleware chain)
- **Status Validation (Phase 5)**: Depends trên T010 (service logic) — cùng code với US1
- **Frontend (Phase 6)**: Depends trên API hoàn thành

### User Story Dependencies

- **US1 (P1)**: MVP — bắt đầu ngay sau Setup
- **US2 (P1)**: Validation trong service — implement cùng US1
- **US3 (P1)**: Middleware chain — implement cùng T012
- **Frontend**: Sau khi API hoàn thành

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T004, T005, T006 | Tests US1 — viết song song |
| T010, T011, T012 | Service + Controller + Routes — sequential |
| T014, T015 | Tests US2 — viết song song |
| T019, T020, T021 | Tests US3 — chạy song song |
| T023, T024, T025 | Tests status validation — viết song song |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001-T003) → Prisma migration + Zod schema ready
2. **Phase 2+3+5**: US1 + US2 + Status validation (T004-T018, T023-T028) → **MVP!** Manager reject được event + validation + status check
3. **Phase 4**: US3 (T019-T022) → Phân quyền
4. **Phase 6**: Frontend (T029-T030)
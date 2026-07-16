# Tasks: Approve Event (UC69)

**Input**: Design documents từ `.sdd/DucNM/UC69-feat-approve-event/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Kế thừa infrastructure từ UC67/UC68 (Event model, event.repository.js, event.service.js, event.controller.js, event.routes.js)
- **New**: Prisma migration thêm approved_by, approved_at fields

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Cập nhật Prisma schema và migration

- [ ] T001 Thêm fields `approved_by` (Int?, FK → User) và `approved_at` (DateTime?) vào Event model trong `backend/prisma/schema.prisma`
- [ ] T002 Chạy Prisma migration: `npx prisma migrate dev --name add_approved_fields`

---

## Phase 2: User Story 1 - Manager phê duyệt sự kiện thành công (Priority: P1) 🎯 MVP

**Goal**: Manager/Admin gọi `PATCH /api/v1/events/:id/approve` và chuyển event PENDING → APPROVED.

**Independent Test**: Tạo event PENDING, gọi `PATCH /api/v1/events/1/approve` với Manager token, kiểm tra response 200 + status = APPROVED + approved_by + approved_at.

### Tests cho User Story 1 ⚠️

- [ ] T003 [P] [US1] Unit test cho `event.service.js` — `approveEvent` với Manager (PENDING) → 200 + status = APPROVED trong `backend/tests/event/event.service.test.js`
- [ ] T004 [P] [US1] Unit test cho `event.service.js` — `approveEvent` với Admin (PENDING) → 200 + status = APPROVED
- [ ] T005 [P] [US1] Unit test cho `event.service.js` — `approveEvent` với ID không tồn tại → throw ServiceError 404 `EVENT_NOT_FOUND`
- [ ] T006 [P] [US1] Unit test cho `event.service.js` — `approveEvent` với ID không hợp lệ → throw ServiceError 400 `INVALID_EVENT_ID`
- [ ] T007 [P] [US1] Integration test cho `PATCH /api/v1/events/:id/approve` — Manager token (PENDING) → HTTP 200 trong `backend/tests/event/event.api.test.js`
- [ ] T008 [US1] Integration test cho `PATCH /api/v1/events/:id/approve` — Admin token (PENDING) → HTTP 200

### Implementation cho User Story 1

- [ ] T009 [US1] Implement `updateEventStatus` trong `backend/src/repositories/event.repository.js` — Prisma `update` với include approver
- [ ] T010 [US1] Implement `approveEvent` trong `backend/src/services/event.service.js` — validate ID → check exists → check PENDING status → update (status, approved_by, approved_at) → audit log
- [ ] T011 [US1] Implement `approveEventHandler` trong `backend/src/controllers/event.controller.js` — gọi service + trả về 200
- [ ] T012 [US1] Thêm route `PATCH /:id/approve` trong `backend/src/routes/event.routes.js` — middleware chain: authMiddleware → authorize('MANAGER', 'ADMIN') → approveEventHandler
- [ ] T013 [US1] Thêm Swagger JSDoc cho endpoint `PATCH /api/v1/events/:id/approve` trong `backend/src/routes/event.routes.js`

**Checkpoint**: User Story 1 hoàn thành — Manager/Admin phê duyệt event thành công.

---

## Phase 3: User Story 2 - Chặn truy cập với người dùng không có quyền (Priority: P1)

**Goal**: Staff/Volunteer nhận 403, Guest nhận 401 khi gọi `PATCH /api/v1/events/:id/approve`.

**Independent Test**: Gọi `PATCH /api/v1/events/1/approve` với token Staff → 403. Không token → 401.

### Tests cho User Story 2 ⚠️

- [ ] T014 [P] [US2] Integration test — Staff token → HTTP 403 trong `backend/tests/event/event.api.test.js`
- [ ] T015 [P] [US2] Integration test — Volunteer token → HTTP 403
- [ ] T016 [P] [US2] Integration test — không token → HTTP 401

### Implementation cho User Story 2

- [ ] T017 [US2] Middleware chain đã implement ở T012 — `authorize('MANAGER', 'ADMIN')` xử lý 403, `authMiddleware` xử lý 401. **(Không cần code mới)**

**Checkpoint**: User Story 2 hoàn thành — endpoint được bảo vệ đúng phân quyền.

---

## Phase 4: Status Validation & Edge Cases

**Purpose**: Xử lý validation status và edge cases

### Tests ⚠️

- [ ] T018 [P] [US2] Unit test — `approveEvent` với event đã APPROVED → throw 409 `INVALID_STATUS` trong `backend/tests/event/event.service.test.js`
- [ ] T019 [P] [US2] Unit test — `approveEvent` với event REJECTED → throw 409
- [ ] T020 [P] [US2] Unit test — `approveEvent` với event ONGOING → throw 409
- [ ] T021 [P] [US2] Integration test — `PATCH /api/v1/events/1/approve` (APPROVED) → HTTP 409 trong `backend/tests/event/event.api.test.js`
- [ ] T022 [P] [US2] Integration test — database không phản hồi → HTTP 500

### Implementation

- [ ] T023 Status validation đã implement ở T010 — kiểm tra `event.status !== 'PENDING'` → 409

---

## Phase 5: Frontend

**Purpose**: Thêm nút Approve trên Pending Event Detail page

- [ ] T024 [P] Thêm `approveEvent(id)` trong `frontend/src/api/eventApi.js`
- [ ] T025 Cập nhật `PendingEventDetailPage.jsx` — thêm Approve button + handleApprove + refresh sau khi approve

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T002 — chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên Phase 1 + UC67/UC68 infrastructure
- **User Story 2 (Phase 3)**: Depends trên T012 (middleware chain)
- **Status Validation (Phase 4)**: Depends trên T010 (service logic) — cùng code với US1
- **Frontend (Phase 5)**: Depends trên API hoàn thành

### User Story Dependencies

- **US1 (P1)**: MVP — bắt đầu ngay sau Setup
- **US2 (P1)**: Middleware chain — implement cùng T012
- **Frontend**: Sau khi API hoàn thành

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T003, T004, T005 | Tests US1 — viết song song |
| T009, T010, T011 | Repository + Service + Controller — sequential |
| T014, T015, T016 | Tests US2 — chạy song song |
| T018, T019, T020 | Tests status validation — viết song song |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001-T002) → Prisma migration ready
2. **Phase 2+4**: US1 + Status validation (T003-T013, T018-T023) → **MVP!** Manager approve được event + status validation
3. **Phase 3**: US2 (T014-T017) → Phân quyền
4. **Phase 5**: Frontend (T024-T025)
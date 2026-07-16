# Tasks: View Pending Event (UC67)

**Input**: Design documents từ `.sdd/DucNM/UC67-feat-view-pending-event/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- **New module**: Event Approval Management — endpoint `GET /api/v1/events` với query param `status`
- **Cross-module awareness**: Endpoint có thể dùng chung với UC08 (NamLD)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Thiết lập database model và infrastructure dùng chung

- [ ] T001 Thêm Event model vào Prisma schema trong `backend/prisma/schema.prisma` — fields: event_id, title, description (optional), organization_id (FK → Organization), status (default PENDING), created_at, updated_at
- [ ] T002 Chạy Prisma migration: `npx prisma migrate dev --name add_event_model`
- [ ] T003 [P] Tạo event repository trong `backend/src/repositories/event.repository.js` — hàm `findEvents({ skip, take, where })` với include organization
- [ ] T004 Tạo event validator trong `backend/src/validators/event.validator.js` — `getEventsQuerySchema` (page, limit, status enum)

---

## Phase 2: User Story 1 - Manager xem danh sách sự kiện PENDING (Priority: P1) 🎯 MVP

**Goal**: Manager/Admin gọi `GET /api/v1/events?status=pending` và thấy danh sách sự kiện PENDING với phân trang.

**Independent Test**: Tạo 3 events PENDING + 2 events APPROVED, gọi `GET /api/v1/events?status=pending` với token Manager, kiểm tra response chỉ có 3 events PENDING + pagination metadata.

### Tests cho User Story 1 ⚠️

- [ ] T005 [P] [US1] Unit test cho `event.service.js` — getEvents với status=pending + Manager → chỉ PENDING events trong `backend/tests/event/event.service.test.js`
- [ ] T006 [P] [US1] Unit test cho `event.service.js` — getEvents với status=pending + Admin → chỉ PENDING events
- [ ] T007 [P] [US1] Unit test cho `event.service.js` — getEvents với page/limit → phân trang
- [ ] T008 [P] [US1] Integration test cho `GET /api/v1/events?status=pending` — Manager token → HTTP 200 + only PENDING trong `backend/tests/event/event.api.test.js`
- [ ] T009 [US1] Integration test cho `GET /api/v1/events?status=pending` — Admin token → HTTP 200 + only PENDING

### Implementation cho User Story 1

- [ ] T010 [US1] Implement `event.service.js` — hàm `getEvents(query, currentUser)` với role-based visibility + status filter + pagination trong `backend/src/services/event.service.js`
- [ ] T011 [US1] Implement `event.controller.js` — handler `getEventsHandler` trong `backend/src/controllers/event.controller.js`
- [ ] T012 [US1] Tạo `event.routes.js` — route `GET /` với authMiddleware trong `backend/src/routes/event.routes.js`
- [ ] T013 [US1] Cập nhật `backend/src/app.js` — mount `eventRoutes` tại prefix `/api/v1/events`
- [ ] T014 [US1] Thêm Swagger JSDoc cho endpoint `GET /api/v1/events` trong `backend/src/routes/event.routes.js`

**Checkpoint**: User Story 1 hoàn thành — Manager/Admin xem được PENDING events.

---

## Phase 3: User Story 2 - Chặn truy cập với người dùng không có quyền (Priority: P1)

**Goal**: Staff/Volunteer nhận 403, Guest nhận 401 khi gọi `GET /api/v1/events?status=pending`.

**Independent Test**: Gọi `GET /api/v1/events?status=pending` với token Staff → 403. Không token → 401.

### Tests cho User Story 2 ⚠️

- [ ] T015 [P] [US2] Unit test cho `event.service.js` — getEvents với status=pending + Staff → throw 403 trong `backend/tests/event/event.service.test.js`
- [ ] T016 [P] [US2] Unit test cho `event.service.js` — getEvents với status=pending + Volunteer → throw 403
- [ ] T017 [P] [US2] Integration test — Staff token → HTTP 403 trong `backend/tests/event/event.api.test.js`
- [ ] T018 [P] [US2] Integration test — Volunteer token → HTTP 403
- [ ] T019 [US2] Integration test — không token → HTTP 401

### Implementation cho User Story 2

- [ ] T020 [US2] Role-based check đã implement ở T010 — nếu status=pending và role !== MANAGER/ADMIN → throw 403

**Checkpoint**: User Story 2 hoàn thành — endpoint được bảo vệ đúng phân quyền.

---

## Phase 4: Default Visibility (no status param)

**Goal**: Guest/Volunteer/Staff không gửi status param → chỉ thấy APPROVED events. Manager/Admin → thấy tất cả.

**Independent Test**: Gọi `GET /api/v1/events` (no status) với Guest → 200 + only APPROVED. Gọi với Manager → 200 + all.

### Tests ⚠️

- [ ] T021 [P] Unit test — getEvents không status + Guest → chỉ APPROVED trong `backend/tests/event/event.service.test.js`
- [ ] T022 [P] Unit test — getEvents không status + Volunteer → chỉ APPROVED
- [ ] T023 [P] Unit test — getEvents không status + Manager → tất cả events
- [ ] T024 [P] Integration test — `GET /api/v1/events` (no status) + Guest → 200 + only APPROVED trong `backend/tests/event/event.api.test.js`
- [ ] T025 [US2] Integration test — `GET /api/v1/events` (no status) + Manager → 200 + all

### Implementation

- [ ] T026 Default visibility logic đã implement ở T010 — nếu không có status và role không phải MANAGER/ADMIN → filter APPROVED

**Checkpoint**: Default visibility hoạt động đúng business rule.

---

## Phase 5: Validation & Edge Cases

**Purpose**: Xử lý validation và edge cases

### Tests ⚠️

- [ ] T027 [P] Unit test — getEvents với status=invalid → throw 400 trong `backend/tests/event/event.service.test.js`
- [ ] T028 [P] Integration test — `GET /api/v1/events?status=invalid` → HTTP 400 trong `backend/tests/event/event.api.test.js`
- [ ] T029 [P] Integration test — `GET /api/v1/events?page=-1` → HTTP 400
- [ ] T030 [P] Integration test — database không phản hồi → HTTP 500

### Implementation

- [ ] T031 Zod validation đã implement ở T004

---

## Phase 6: Frontend

**Purpose**: Xây dựng giao diện Pending Event List cho Manager

- [ ] T032 [P] Implement frontend API client trong `frontend/src/api/eventApi.js` — hàm `getEvents(params)`
- [ ] T033 [P] Implement React hook `usePendingEvents` trong `frontend/src/hooks/usePendingEvents.js`
- [ ] T034 Implement `PendingEventListPage.jsx` với MUI Table + pagination trong `frontend/src/components/pages/PendingEventListPage.jsx`
- [ ] T035 Thêm route `/events/pending` trong `frontend/src/App.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T004 — chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên Phase 1
- **User Story 2 (Phase 3)**: Depends trên T010 (service logic) — cùng code với US1
- **Default Visibility (Phase 4)**: Depends trên T010 (service logic) — cùng code với US1
- **Validation (Phase 5)**: Depends trên Phase 2-4
- **Frontend (Phase 6)**: Depends trên API hoàn thành

### User Story Dependencies

- **US1 (P1)**: MVP — bắt đầu ngay sau Setup
- **US2 (P1)**: Cùng service logic với US1 — implement cùng nhau
- **Frontend**: Sau khi API hoàn thành

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T003, T004 | Repository + Validator — khác files |
| T005, T006, T007 | Tests US1 — viết song song |
| T010, T011, T012 | Service + Controller + Routes — sequential |
| T015, T016 | Tests US2 — viết song song |
| T032, T033 | Frontend API + Hook — song song |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001-T004) → Prisma + repository + validator ready
2. **Phase 2+3+4**: US1+US2+Default (T005-T026) → **MVP!** Manager xem PENDING events + phân quyền + default visibility
3. **Phase 5**: Validation (T027-T031)
4. **Phase 6**: Frontend (T032-T035)
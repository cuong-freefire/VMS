# Tasks: View Pending Event Detail (UC68)

**Input**: Design documents từ `.sdd/DucNM/UC68-feat-view-pending-event-detail/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Kế thừa infrastructure từ UC67 (Event model, event.repository.js, event.service.js, event.controller.js, event.routes.js)
- **Cross-module**: Tái sử dụng endpoint `GET /api/v1/events/:id` từ UC09 (NamLD)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Mở rộng repository để hỗ trợ event detail với includes

- [ ] T001 Thêm `findEventById` trong `backend/src/repositories/event.repository.js` — Prisma `findUnique` với include organization + created_by_user

---

## Phase 2: User Story 1 - Manager xem chi tiết sự kiện PENDING (Priority: P1) 🎯 MVP

**Goal**: Manager/Admin gọi `GET /api/v1/events/:id` và xem được chi tiết event PENDING (cũng như các status khác).

**Independent Test**: Tạo event PENDING, gọi `GET /api/v1/events/1` với token Manager, kiểm tra response có đầy đủ thông tin + created_by.

### Tests cho User Story 1 ⚠️

- [ ] T002 [P] [US1] Unit test cho `event.service.js` — `getEventById` với Manager (PENDING event) → 200 + full info trong `backend/tests/event/event.service.test.js`
- [ ] T003 [P] [US1] Unit test cho `event.service.js` — `getEventById` với Admin (PENDING event) → 200 + full info
- [ ] T004 [P] [US1] Unit test cho `event.service.js` — `getEventById` với ID không tồn tại → throw ServiceError 404 `EVENT_NOT_FOUND`
- [ ] T005 [P] [US1] Unit test cho `event.service.js` — `getEventById` với ID không hợp lệ → throw ServiceError 400 `INVALID_EVENT_ID`
- [ ] T006 [P] [US1] Integration test cho `GET /api/v1/events/:id` — Manager token (PENDING) → HTTP 200 trong `backend/tests/event/event.api.test.js`
- [ ] T007 [US1] Integration test cho `GET /api/v1/events/:id` — Admin token (PENDING) → HTTP 200

### Implementation cho User Story 1

- [ ] T008 [US1] Implement `getEventById` trong `backend/src/services/event.service.js` — validate ID → findEventById → 404 check → role check for PENDING → return
- [ ] T009 [US1] Implement `getEventByIdHandler` trong `backend/src/controllers/event.controller.js` — gọi service + trả về 200
- [ ] T010 [US1] Thêm route `GET /:id` trong `backend/src/routes/event.routes.js` — authMiddleware → getEventByIdHandler
- [ ] T011 [US1] Thêm Swagger JSDoc cho endpoint `GET /api/v1/events/:id` trong `backend/src/routes/event.routes.js`

**Checkpoint**: User Story 1 hoàn thành — Manager/Admin xem được chi tiết event PENDING.

---

## Phase 3: User Story 2 - Chặn truy cập với người dùng không có quyền (Priority: P1)

**Goal**: Staff/Volunteer nhận 403, Guest nhận 401 khi gọi `GET /api/v1/events/:id` với event PENDING.

**Independent Test**: Gọi `GET /api/v1/events/1` (PENDING) với token Staff → 403. Không token → 401.

### Tests cho User Story 2 ⚠️

- [ ] T012 [P] [US2] Unit test cho `event.service.js` — `getEventById` với Staff (PENDING) → throw 403 trong `backend/tests/event/event.service.test.js`
- [ ] T013 [P] [US2] Unit test cho `event.service.js` — `getEventById` với Volunteer (PENDING) → throw 403
- [ ] T014 [P] [US2] Unit test cho `event.service.js` — `getEventById` với Guest/null (PENDING) → throw 401
- [ ] T015 [P] [US2] Integration test — Staff token (PENDING) → HTTP 403 trong `backend/tests/event/event.api.test.js`
- [ ] T016 [P] [US2] Integration test — Volunteer token (PENDING) → HTTP 403
- [ ] T017 [US2] Integration test — không token (PENDING) → HTTP 401

### Implementation cho User Story 2

- [ ] T018 [US2] Role-based check đã implement ở T008 — nếu event.status === 'PENDING' và role !== MANAGER/ADMIN → throw 403/401

**Checkpoint**: User Story 2 hoàn thành — endpoint được bảo vệ đúng phân quyền.

---

## Phase 4: Edge Cases & Validation

**Purpose**: Xử lý các edge case

### Tests ⚠️

- [ ] T019 [P] Integration test — `GET /api/v1/events/abc` (ID không hợp lệ) → HTTP 400 trong `backend/tests/event/event.api.test.js`
- [ ] T020 [P] Integration test — `GET /api/v1/events/999` (không tồn tại) → HTTP 404
- [ ] T021 [P] Integration test — database không phản hồi → HTTP 500

### Implementation

- [ ] T022 ID validation đã implement ở T008 — `Number(eventId)` check + `isNaN` + `<= 0`

---

## Phase 5: Frontend

**Purpose**: Xây dựng giao diện Event Detail cho Manager (Pending Event Detail page)

- [ ] T023 [P] Thêm `getEventById(id)` trong `frontend/src/api/eventApi.js`
- [ ] T024 [P] Implement React hook `useEventDetail` trong `frontend/src/hooks/useEventDetail.js`
- [ ] T025 Implement `PendingEventDetailPage.jsx` — hiển thị full event info + created_by
- [ ] T026 Thêm route `/events/pending/:id` trong `frontend/src/App.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 — chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên T001 + UC67 infrastructure
- **User Story 2 (Phase 3)**: Depends trên T008 (service logic) — cùng code với US1
- **Edge Cases (Phase 4)**: Depends trên Phase 2-3
- **Frontend (Phase 5)**: Depends trên API hoàn thành

### User Story Dependencies

- **US1 (P1)**: MVP — bắt đầu ngay sau Setup
- **US2 (P1)**: Cùng service logic với US1 — implement cùng nhau
- **Frontend**: Sau khi API hoàn thành

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T002, T003, T004 | Tests US1 — viết song song |
| T008, T009, T010 | Service + Controller + Routes — sequential |
| T012, T013, T014 | Tests US2 — viết song song |
| T023, T024 | Frontend API + Hook — song song |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001) → Repository method ready
2. **Phase 2+3**: US1+US2 (T002-T018) → **MVP!** Manager xem được chi tiết event PENDING + phân quyền
3. **Phase 4**: Edge cases (T019-T022)
4. **Phase 5**: Frontend (T023-T026)
# Tasks: Event Statistics (UC55)

**Input**: Design documents từ `.sdd/DucNM/UC55-feat-event-statistics/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Kế thừa infrastructure từ UC54 (Redis cache, dashboard routes prefix)
- **New**: event-stats validator, repository methods, service function, controller handler, route

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tạo Zod schema và repository methods cho event statistics

- [ ] T001 Tạo `eventStatsQuerySchema` (Zod) trong `backend/src/validators/event-stats.validator.js` — year (optional), start_date (optional, YYYY-MM-DD), end_date (optional, YYYY-MM-DD), `.refine()` kiểm tra start_date <= end_date
- [ ] T002 [P] Thêm repository methods trong `backend/src/repositories/dashboard.repository.js` — `countEventsByMonth(where)`, `getCompletionRate(where)`, `getTop5Events(where)`, `getTimeRange(query)`

---

## Phase 2: User Story 1 - Xem thống kê sự kiện theo thời gian (Priority: P1) 🎯 MVP

**Goal**: Admin/Manager gọi `GET /api/v1/dashboard/event-stats` với filter time và nhận events_by_month + completion_rate + top_5_events.

**Independent Test**: Gọi `GET /api/v1/dashboard/event-stats?year=2026` với Admin token, kiểm tra response có events_by_month (12 items), completion_rate (%), top_5_events (tối đa 5).

### Tests cho User Story 1 ⚠️

- [ ] T003 [P] [US1] Unit test cho `dashboard.service.js` — `getEventStatistics` với Admin (year=2026) → events_by_month + completion_rate + top_5 trong `backend/tests/dashboard/dashboard.service.test.js`
- [ ] T004 [P] [US1] Unit test cho `dashboard.service.js` — `getEventStatistics` khi không có dữ liệu → giá trị mặc định (mảng rỗng, rate=0)
- [ ] T005 [P] [US1] Integration test cho `GET /api/v1/dashboard/event-stats?year=2026` — Admin token → HTTP 200 trong `backend/tests/dashboard/dashboard.api.test.js`

### Implementation cho User Story 1

- [ ] T006 [US1] Implement `getEventStatistics` trong `backend/src/services/dashboard.service.js` — validate query → time range → build where → role-based org filter → cache check → parallel queries (countEventsByMonth, getCompletionRate, getTop5Events) → cache set → return
- [ ] T007 [US1] Implement `getEventStatsHandler` trong `backend/src/controllers/dashboard.controller.js` — gọi service + trả về 200
- [ ] T008 [US1] Thêm route `GET /event-stats` trong `backend/src/routes/dashboard.routes.js` — middleware chain: authMiddleware → authorize('ADMIN', 'MANAGER') → getEventStatsHandler
- [ ] T009 [US1] Thêm Swagger JSDoc cho endpoint `GET /api/v1/dashboard/event-stats` trong `backend/src/routes/dashboard.routes.js`

**Checkpoint**: User Story 1 hoàn thành — Admin/Manager xem được event statistics.

---

## Phase 3: Role-Based Filter & Authorization

**Goal**: Admin thấy tất cả events, Manager chỉ thấy events thuộc org của mình. Staff/Volunteer/Guest bị chặn.

### Tests ⚠️

- [ ] T010 [P] [US2] Unit test cho `dashboard.service.js` — `getEventStatistics` với Manager → chỉ events thuộc org Manager trong `backend/tests/dashboard/dashboard.service.test.js`
- [ ] T011 [P] [US2] Unit test cho `dashboard.service.js` — `getEventStatistics` với Staff → throw 403
- [ ] T012 [P] [US2] Integration test — Manager token → HTTP 200 + org-filtered data trong `backend/tests/dashboard/dashboard.api.test.js`
- [ ] T013 [P] [US2] Integration test — Staff token → HTTP 403
- [ ] T014 [US2] Integration test — Volunteer token → HTTP 403
- [ ] T015 [US2] Integration test — không token → HTTP 401

### Implementation

- [ ] T016 Role-based org filter đã implement ở T006 — nếu role === 'MANAGER' thì thêm `where.organization_id = currentUser.organization_id`
- [ ] T017 Middleware chain đã implement ở T008 — `authorize('ADMIN', 'MANAGER')` xử lý 403, `authMiddleware` xử lý 401

---

## Phase 4: Date Validation & Edge Cases

**Purpose**: Xử lý validation date và edge cases

### Tests ⚠️

- [ ] T018 [P] Unit test — `getEventStatistics` với start_date > end_date → throw 400 `INVALID_DATE_RANGE` trong `backend/tests/dashboard/dashboard.service.test.js`
- [ ] T019 [P] Unit test — `getEventStatistics` với date format sai → throw 400 `INVALID_DATE_FORMAT`
- [ ] T020 [P] Integration test — `GET /api/v1/dashboard/event-stats?start_date=2026-06-30&end_date=2026-01-01` → HTTP 400 trong `backend/tests/dashboard/dashboard.api.test.js`
- [ ] T021 [P] Integration test — database không phản hồi → HTTP 500

### Implementation

- [ ] T022 Zod validation đã implement ở T001 — `.refine()` kiểm tra date range
- [ ] T023 Redis cache fallback — try/catch quanh redis operations (kế thừa từ UC54)

---

## Phase 5: Frontend

**Purpose**: Xây dựng giao diện Event Statistics

- [ ] T024 [P] Thêm `getEventStats(params)` trong `frontend/src/api/dashboardApi.js`
- [ ] T025 Implement `EventStatisticsPage.jsx` — year input + Load button + Bar chart (events_by_month) + Completion rate KPI + Top 5 events list
- [ ] T026 Thêm route `/dashboard/events` trong `frontend/src/App.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T002 — chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên Phase 1 + UC54 infrastructure
- **Role Filter (Phase 3)**: Depends trên T006 (service logic) + T008 (middleware)
- **Date Validation (Phase 4)**: Depends trên T001 (Zod schema) + T006 (service)
- **Frontend (Phase 5)**: Depends trên API hoàn thành

### User Story Dependencies

- **US1 (P1)**: MVP — bắt đầu ngay sau Setup
- **Frontend**: Sau khi API hoàn thành

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T001, T002 | Zod schema + Repository — khác files |
| T003, T004 | Tests US1 — viết song song |
| T006, T007, T008 | Service + Controller + Routes — sequential |
| T010, T011 | Tests role filter — viết song song |
| T018, T019 | Tests date validation — viết song song |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001-T002) → Zod schema + Repository ready
2. **Phase 2+3+4**: US1 + Role filter + Validation (T003-T023) → **MVP!** Event statistics với time filter + org filter + date validation
3. **Phase 5**: Frontend (T024-T026) → Event Statistics UI
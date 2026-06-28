# Tasks: Event Statistics (UC55)

**Input**: Design documents from `.sdd/DucNM/UC55-feat-event-statistics/`

---

## Phase 1: Setup & Foundation

- [ ] T001 [P] [SETUP] Thêm phương thức `getEventStats()` trong `backend/src/repositories/dashboard.repository.js`
- [ ] T002 [P] [SETUP] Thêm phương thức `getEventStats()` trong `backend/src/services/dashboard.service.js`
- [ ] T003 [P] [SETUP] Thêm phương thức `eventStats()` trong `backend/src/controllers/dashboard.controller.js`
- [ ] T004 [P] [SETUP] Thêm route `GET /api/v1/dashboard/event-stats` trong `backend/src/routes/dashboard.routes.js`

---

## Phase 2: User Story 1 — Xem thống kê sự kiện theo thời gian (Priority: P1) 🎯 MVP

**Goal**: Admin xem events_by_month, completion_rate, top_5_events.

**Independent Test**: Gọi GET /dashboard/event-stats?year=2026 với token Admin → đủ metrics.

### Tests

- [ ] T005 [P] [US1] Contract test: `GET /api/v1/dashboard/event-stats?year=2026` — events_by_month, completion_rate, top_5 trong `backend/tests/dashboard.test.js`
- [ ] T006 [P] [US1] Contract test: `GET /api/v1/dashboard/event-stats?start_date=2026-01-01&end_date=2026-06-30` — date range
- [ ] T007 [P] [US1] Contract test: không có dữ liệu → giá trị mặc định

### Implementation

- [ ] T008 [US1] Implement `dashboard.repository.js` — eventStats(): events_by_month (GROUP BY month), completion_rate, top_5 events by approved applications
- [ ] T009 [US1] Implement `dashboard.service.js` — getEventStats(): phân quyền, cache, date range
- [ ] T010 [US1] Implement `dashboard.controller.js` — eventStats()
- [ ] T011 [US1] Thêm Swagger JSDoc cho `GET /api/v1/dashboard/event-stats`

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: Depends on UC54 dashboard repository
- **Phase 2 (US1)**: Depends on Phase 1

---

## Notes

- [P] tasks = different files, no dependencies
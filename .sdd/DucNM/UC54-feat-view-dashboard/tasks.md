# Tasks: View Dashboard (UC54)

**Input**: Design documents from `.sdd/DucNM/UC54-feat-view-dashboard/`

---

## Phase 1: Setup & Foundation

- [ ] T001 [P] [SETUP] Tạo file `backend/src/repositories/dashboard.repository.js` — aggregate queries
- [ ] T002 [P] [SETUP] Tạo file `backend/src/services/dashboard.service.js` — getSummary()
- [ ] T003 [P] [SETUP] Tạo file `backend/src/controllers/dashboard.controller.js` — summary()
- [ ] T004 [P] [SETUP] Tạo file `backend/src/routes/dashboard.routes.js`
- [ ] T005 [P] [SETUP] Tạo file `backend/src/utils/cache.util.js` (Redis cache wrapper)
- [ ] T006 [P] [SETUP] Tạo file `frontend/src/api/dashboardApi.js`
- [ ] T007 [P] [SETUP] Tạo file `frontend/src/services/dashboard.service.js`
- [ ] T008 [P] [SETUP] Tạo file `frontend/src/hooks/useDashboardCache.js`
- [ ] T009 [P] [SETUP] Tạo file `frontend/src/components/dashboard/DashboardPage.jsx`
- [ ] T010 [P] [SETUP] Tạo file `frontend/src/components/dashboard/KpiCard.jsx`
- [ ] T011 [P] [SETUP] Tạo file `frontend/src/components/dashboard/ChartWidget.jsx`

---

## Phase 2: User Story 1 — Admin xem dashboard tổng quan (Priority: P1) 🎯 MVP

**Goal**: Admin xem 5 KPI cards + 3 biểu đồ, cache 5 phút.

**Independent Test**: Gọi GET /dashboard/summary với token Admin → đủ metrics + charts.

### Tests

- [ ] T012 [P] [US1] Contract test: `GET /api/v1/dashboard/summary` — KPI metrics + chart data trong `backend/tests/dashboard.test.js`
- [ ] T013 [P] [US1] Contract test: `GET /api/v1/dashboard/summary?force=true` — bỏ qua cache
- [ ] T014 [P] [US1] Contract test: không có dữ liệu → giá trị mặc định (0, [])

### Implementation

- [ ] T015 [US1] Implement `dashboard.repository.js` — aggregate: event counts, user counts by role, application distribution, donation totals, attendance rate
- [ ] T016 [US1] Implement `dashboard.service.js` — getSummary(user, force): phân quyền Admin/Manager, cache TTL 5 phút, force refresh
- [ ] T017 [US1] Implement `dashboard.controller.js` — summary()
- [ ] T018 [US1] Implement `DashboardPage.jsx` — 5 KPI cards + 3 charts (bar, line, pie) với Recharts
- [ ] T019 [US1] Implement `KpiCard.jsx`, `ChartWidget.jsx`, `useDashboardCache.js` hook
- [ ] T020 [US1] Thêm Swagger JSDoc cho `GET /api/v1/dashboard/summary`

---

## Phase 3: User Story 2 — Manager xem dashboard phạm vi quản lý (Priority: P2)

**Goal**: Manager chỉ thấy data tổ chức của mình.

**Independent Test**: Gọi API với token Manager → chỉ data organization của Manager.

### Tests

- [ ] T021 [P] [US2] Contract test: `GET /api/v1/dashboard/summary` với Manager — chỉ data org của Manager

### Implementation

- [ ] T022 [US2] Cập nhật `dashboard.service.js` — nếu Manager, filter by organization_id
- [ ] T023 [US2] Cập nhật `dashboard.repository.js` — thêm param organizationId cho aggregate queries

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: No dependencies (cần các module khác có dữ liệu)
- **Phase 2 (US1)**: Depends on Phase 1 — Dashboard (MVP)
- **Phase 3 (US2)**: Depends on Phase 2 — Manager scope

---

## Notes

- [P] tasks = different files, no dependencies
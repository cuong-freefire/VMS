# Tasks: View Dashboard (UC54)

**Input**: Design documents từ `.sdd/DucNM/UC54-feat-view-dashboard/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- **New module**: Dashboard & Reporting — tạo mới toàn bộ stack
- **Cross-module**: Aggregate data từ Event, User, Application, Donation, Attendance

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Thiết lập Redis cache và infrastructure dùng chung

- [ ] T001 Tạo Redis config trong `backend/src/config/redis.config.js` — createClient với fallback logging
- [ ] T002 [P] Tạo dashboard repository trong `backend/src/repositories/dashboard.repository.js` — 8 hàm aggregate queries (getTotalEvents, getTotalUsers, getTotalApplications, getDonationsCurrentMonth, getAttendanceRate, getEventsByMonth, getNewUsersByMonth, getApplicationDistribution)

---

## Phase 2: User Story 1 - Admin xem dashboard tổng quan (Priority: P1) 🎯 MVP

**Goal**: Admin gọi `GET /api/v1/dashboard/summary` và nhận KPI metrics + chart data toàn hệ thống.

**Independent Test**: Gọi `GET /api/v1/dashboard/summary` với token Admin, kiểm tra response chứa đủ 5 KPI metrics + 3 chart datasets.

### Tests cho User Story 1 ⚠️

- [ ] T003 [P] [US1] Unit test cho `dashboard.service.js` — getDashboardSummary với Admin → trả về KPI + charts trong `backend/tests/dashboard/dashboard.service.test.js`
- [ ] T004 [P] [US1] Unit test cho `dashboard.service.js` — getDashboardSummary khi không có dữ liệu → KPI = 0, charts rỗng
- [ ] T005 [P] [US1] Integration test cho `GET /api/v1/dashboard/summary` — Admin token → HTTP 200 + full data trong `backend/tests/dashboard/dashboard.api.test.js`

### Implementation cho User Story 1

- [ ] T006 [US1] Implement `dashboard.service.js` — hàm `getDashboardSummary(query)` với Redis cache + 8 parallel aggregate queries trong `backend/src/services/dashboard.service.js`
- [ ] T007 [US1] Implement `dashboard.controller.js` — handler `getDashboardSummaryHandler` trong `backend/src/controllers/dashboard.controller.js`
- [ ] T008 [US1] Tạo `dashboard.routes.js` — route `GET /summary` với authMiddleware + authorize('ADMIN', 'MANAGER') trong `backend/src/routes/dashboard.routes.js`
- [ ] T009 [US1] Cập nhật `backend/src/app.js` — mount `dashboardRoutes` tại prefix `/api/v1/dashboard`
- [ ] T010 [US1] Thêm Swagger JSDoc cho endpoint `GET /api/v1/dashboard/summary` trong `backend/src/routes/dashboard.routes.js`

**Checkpoint**: User Story 1 hoàn thành — Admin xem được dashboard với KPI + charts.

---

## Phase 3: User Story 2 - Manager xem dashboard tổng quan (Priority: P2)

**Goal**: Manager gọi `GET /api/v1/dashboard/summary` và thấy dữ liệu toàn hệ thống (giống Admin). Manager là role hệ thống, không gắn với tổ chức.

**Independent Test**: Gọi `GET /api/v1/dashboard/summary` với token Manager → 200 + same data as Admin.

### Tests cho User Story 2 ⚠️

- [ ] T011 [P] [US2] Unit test cho `dashboard.service.js` — getDashboardSummary với Manager → trả về KPI + charts (giống Admin) trong `backend/tests/dashboard/dashboard.service.test.js`
- [ ] T012 [P] [US2] Integration test — Manager token → HTTP 200 + full data trong `backend/tests/dashboard/dashboard.api.test.js`

### Implementation cho User Story 2

- [ ] T013 [US2] Authorization đã implement ở T008 — `authorize('ADMIN', 'MANAGER')` cho phép cả Admin và Manager

**Checkpoint**: User Story 2 hoàn thành — Manager xem được dashboard toàn hệ thống.

---

## Phase 4: Redis Cache & Force Refresh

**Goal**: Dashboard data được cache 5 phút. Query param `force=true` bỏ qua cache.

**Independent Test**: Request lần 1 → miss → query DB. Request lần 2 (trong 5 phút) → hit → cached. Request với `?force=true` → bỏ qua cache.

### Tests ⚠️

- [ ] T014 [P] Unit test — getDashboardSummary với force=true → bỏ qua cache trong `backend/tests/dashboard/dashboard.service.test.js`
- [ ] T015 [P] Unit test — getDashboardSummary khi Redis unavailable → query DB, không throw error
- [ ] T016 [P] Integration test — `GET /api/v1/dashboard/summary?force=true` → bỏ qua cache trong `backend/tests/dashboard/dashboard.api.test.js`

### Implementation

- [ ] T017 Redis cache logic đã implement ở T006 — check cache → if force=true skip → query DB → set cache
- [ ] T018 Redis fallback — try/catch quanh redis operations, log warning, continue without cache

---

## Phase 5: Authorization & Edge Cases

**Goal**: Staff/Volunteer nhận 403, Guest nhận 401.

### Tests ⚠️

- [ ] T019 [P] Integration test — Staff token → HTTP 403 trong `backend/tests/dashboard/dashboard.api.test.js`
- [ ] T020 [P] Integration test — Volunteer token → HTTP 403
- [ ] T021 [P] Integration test — không token → HTTP 401
- [ ] T022 [P] Integration test — database không phản hồi → HTTP 500

### Implementation

- [ ] T023 Middleware chain đã implement ở T008 — `authorize('ADMIN', 'MANAGER')` xử lý 403, `authMiddleware` xử lý 401

---

## Phase 6: Frontend

**Purpose**: Xây dựng giao diện Dashboard

- [ ] T024 [P] Implement frontend API client trong `frontend/src/api/dashboardApi.js` — hàm `getDashboardSummary(force)`
- [ ] T025 [P] Implement React hook `useDashboard` trong `frontend/src/hooks/useDashboard.js` — fetch, loading, error, forceRefresh
- [ ] T026 [P] Implement `KPICard.jsx` component trong `frontend/src/components/ui/KPICard.jsx`
- [ ] T027 [P] Implement `EventsByMonthChart.jsx` (Bar chart) trong `frontend/src/components/ui/EventsByMonthChart.jsx`
- [ ] T028 [P] Implement `NewUsersChart.jsx` (Line chart) trong `frontend/src/components/ui/NewUsersChart.jsx`
- [ ] T029 [P] Implement `ApplicationPieChart.jsx` (Pie chart) trong `frontend/src/components/ui/ApplicationPieChart.jsx`
- [ ] T030 Implement `DashboardPage.jsx` với Grid layout + Refresh button trong `frontend/src/components/pages/DashboardPage.jsx`
- [ ] T031 Thêm route `/dashboard` trong `frontend/src/App.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T002 — chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên Phase 1
- **User Story 2 (Phase 3)**: Depends trên T008 (middleware) — cùng code với US1
- **Redis Cache (Phase 4)**: Depends trên T006 (service logic) — cùng code với US1
- **Auth (Phase 5)**: Depends trên T008 (middleware chain)
- **Frontend (Phase 6)**: Depends trên API hoàn thành

### User Story Dependencies

- **US1 (P1)**: MVP — bắt đầu ngay sau Setup
- **US2 (P2)**: Cùng service logic với US1 — implement cùng nhau
- **Frontend**: Sau khi API hoàn thành

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T001, T002 | Redis config + Repository — khác files |
| T003, T004 | Tests US1 — viết song song |
| T006, T007, T008 | Service + Controller + Routes — sequential |
| T024-T029 | Frontend components — song song (khác files) |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001-T002) → Redis + Repository ready
2. **Phase 2+3+4+5**: US1+US2+Cache+Auth (T003-T023) → **MVP!** Dashboard với KPI + charts + cache + phân quyền
3. **Phase 6**: Frontend (T024-T031) → Dashboard UI
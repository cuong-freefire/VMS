# Tasks: Volunteer Statistics (UC56)

**Input**: Design documents từ `.sdd/DucNM/UC56-feat-volunteer-statistics/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Kế thừa infrastructure từ UC54/UC55 (Redis cache, dashboard routes prefix)
- **New**: volunteer-stats repository methods, service function, controller handler, route

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Thêm repository methods cho volunteer statistics

- [ ] T001 Thêm repository methods trong `backend/src/repositories/dashboard.repository.js` — `countNewVolunteersByMonth(year)`, `getTotalActiveVolunteers()`, `getParticipationRate(orgId)`, `getTop5Volunteers(orgId)`

---

## Phase 2: User Story 1 - Xem thống kê tình nguyện viên (Priority: P1) 🎯 MVP

**Goal**: Admin/Manager gọi `GET /api/v1/dashboard/volunteer-stats` và nhận 4 metrics: new_volunteers_by_month, total_active_volunteers, participation_rate, top_5_volunteers_by_events.

**Independent Test**: Gọi `GET /api/v1/dashboard/volunteer-stats?year=2026` với Admin token, kiểm tra response có đủ 4 metrics.

### Tests cho User Story 1 ⚠️

- [ ] T002 [P] [US1] Unit test cho `dashboard.service.js` — `getVolunteerStatistics` với Admin (year=2026) → 4 metrics trong `backend/tests/dashboard/dashboard.service.test.js`
- [ ] T003 [P] [US1] Unit test cho `dashboard.service.js` — `getVolunteerStatistics` khi không có dữ liệu → giá trị mặc định
- [ ] T004 [P] [US1] Integration test cho `GET /api/v1/dashboard/volunteer-stats?year=2026` — Admin token → HTTP 200 trong `backend/tests/dashboard/dashboard.api.test.js`

### Implementation cho User Story 1

- [ ] T005 [US1] Implement `getVolunteerStatistics` trong `backend/src/services/dashboard.service.js` — parse year → org filter → cache check → 4 parallel queries → cache set → return
- [ ] T006 [US1] Implement `getVolunteerStatsHandler` trong `backend/src/controllers/dashboard.controller.js` — gọi service + trả về 200
- [ ] T007 [US1] Thêm route `GET /volunteer-stats` trong `backend/src/routes/dashboard.routes.js` — middleware chain: authMiddleware → authorize('ADMIN', 'MANAGER') → getVolunteerStatsHandler
- [ ] T008 [US1] Thêm Swagger JSDoc cho endpoint `GET /api/v1/dashboard/volunteer-stats` trong `backend/src/routes/dashboard.routes.js`

**Checkpoint**: User Story 1 hoàn thành — Admin/Manager xem được volunteer statistics.

---

## Phase 3: Role-Based Filter & Authorization

**Goal**: Admin thấy tất cả volunteers, Manager chỉ thấy volunteer thuộc tổ chức mình. Staff/Volunteer/Guest bị chặn.

### Tests ⚠️

- [ ] T009 [P] [US2] Unit test cho `dashboard.service.js` — `getVolunteerStatistics` với Manager → chỉ volunteer trong org Manager trong `backend/tests/dashboard/dashboard.service.test.js`
- [ ] T010 [P] [US2] Integration test — Manager token → HTTP 200 + org-filtered trong `backend/tests/dashboard/dashboard.api.test.js`
- [ ] T011 [P] [US2] Integration test — Staff token → HTTP 403
- [ ] T012 [US2] Integration test — Volunteer token → HTTP 403
- [ ] T013 [US2] Integration test — không token → HTTP 401

### Implementation

- [ ] T014 Role-based org filter đã implement ở T005 — nếu role === 'MANAGER' thì truyền `orgId = currentUser.organization_id` vào repository methods
- [ ] T015 Middleware chain đã implement ở T007 — `authorize('ADMIN', 'MANAGER')` xử lý 403, `authMiddleware` xử lý 401

---

## Phase 4: Edge Cases

**Purpose**: Xử lý các edge case

### Tests ⚠️

- [ ] T016 [P] Unit test — `getVolunteerStatistics` với year=2030 (tương lai) → giá trị mặc định trong `backend/tests/dashboard/dashboard.service.test.js`
- [ ] T017 [P] Integration test — database không phản hồi → HTTP 500 trong `backend/tests/dashboard/dashboard.api.test.js`

### Implementation

- [ ] T018 Redis cache fallback — try/catch quanh redis operations (kế thừa từ UC54)

---

## Phase 5: Frontend

**Purpose**: Xây dựng giao diện Volunteer Statistics

- [ ] T019 [P] Thêm `getVolunteerStats(params)` trong `frontend/src/api/dashboardApi.js`
- [ ] T020 Implement `VolunteerStatisticsPage.jsx` — year input + Load button + Bar chart (new_volunteers) + 3 KPI cards (active, participation rate, top 5)
- [ ] T021 Thêm route `/dashboard/volunteers` trong `frontend/src/App.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 — chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên T001 + UC54/UC55 infrastructure
- **Role Filter (Phase 3)**: Depends trên T005 (service logic) + T007 (middleware)
- **Edge Cases (Phase 4)**: Depends trên Phase 2-3
- **Frontend (Phase 5)**: Depends trên API hoàn thành

### User Story Dependencies

- **US1 (P1)**: MVP — bắt đầu ngay sau Setup
- **Frontend**: Sau khi API hoàn thành

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T002, T003 | Tests US1 — viết song song |
| T005, T006, T007 | Service + Controller + Routes — sequential |
| T009, T010 | Tests role filter — viết song song |
| T019, T020 | Frontend API + Page — song song |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001) → Repository methods ready
2. **Phase 2+3+4**: US1 + Role filter + Edge cases (T002-T018) → **MVP!** Volunteer statistics với org filter + cache
3. **Phase 5**: Frontend (T019-T021) → Volunteer Statistics UI
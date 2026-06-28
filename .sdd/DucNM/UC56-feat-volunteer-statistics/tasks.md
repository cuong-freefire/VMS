# Tasks: Volunteer Statistics (UC56)

**Input**: Design documents from `.sdd/DucNM/UC56-feat-volunteer-statistics/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), context.md

---

## Phase 1: Setup & Foundation

**Purpose**: Khởi tạo cấu trúc file cho feature

- [ ] T001 [P] [SETUP] Thêm `getVolunteerStats()` trong `backend/src/repositories/dashboard.repository.js`
- [ ] T002 [P] [SETUP] Thêm `getVolunteerStats()` trong `backend/src/services/dashboard.service.js`
- [ ] T003 [P] [SETUP] Thêm `volunteerStats()` trong `backend/src/controllers/dashboard.controller.js`
- [ ] T004 [P] [SETUP] Thêm route `GET /api/v1/dashboard/volunteer-stats` trong `backend/src/routes/dashboard.routes.js`
- [ ] T005 [P] [SETUP] Tạo file `frontend/src/api/dashboardApi.js` — thêm hàm getVolunteerStats()
- [ ] T006 [P] [SETUP] Tạo file `frontend/src/components/dashboard/VolunteerStatsPage.jsx`

---

## Phase 2: User Story 1 — Xem thống kê tình nguyện viên (Priority: P1) 🎯 MVP

**Goal**: Admin xem new_volunteers_by_month, total_active, participation_rate, top_5_volunteers.

**Independent Test**: Gọi GET /dashboard/volunteer-stats?year=2026 với token Admin → đủ metrics.

### Tests

- [ ] T007 [P] [US1] Contract test: `GET /api/v1/dashboard/volunteer-stats` — new_volunteers_by_month, total_active, participation_rate, top_5 trong `backend/tests/dashboard.test.js`
- [ ] T008 [P] [US1] Contract test: không có dữ liệu → giá trị mặc định
- [ ] T009 [P] [US1] Contract test: `GET /api/v1/dashboard/volunteer-stats` với token Staff — HTTP 403

### Implementation

- [ ] T010 [US1] Implement `dashboard.repository.js` — volunteerStats(): new volunteers by month, total active, participation rate (attendance), top 5 by attendance count
- [ ] T011 [US1] Implement `dashboard.service.js` — getVolunteerStats(): phân quyền Admin/Manager, cache TTL 5 phút
- [ ] T012 [US1] Implement `dashboard.controller.js` — volunteerStats()
- [ ] T013 [US1] Implement `VolunteerStatsPage.jsx` — hiển thị biểu đồ và top 5 volunteers
- [ ] T014 [US1] Thêm Swagger JSDoc cho `GET /api/v1/dashboard/volunteer-stats`

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: Depends on UC54 dashboard repository
- **Phase 2 (US1)**: Depends on Phase 1

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- participation_rate = (volunteers có attendance / total active volunteers) * 100
- Manager chỉ thấy volunteer trong organization mình

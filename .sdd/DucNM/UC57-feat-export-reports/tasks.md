# Tasks: Export Reports (UC57)

**Input**: Design documents from `.sdd/DucNM/UC57-feat-export-reports/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), context.md

---

## Phase 1: Setup & Foundation

**Purpose**: Khởi tạo cấu trúc file cho feature

- [ ] T001 [P] [SETUP] Tạo file `backend/src/validators/report.validator.js` — Zod schema cho export query params
- [ ] T002 [P] [SETUP] Tạo file `backend/src/repositories/report.repository.js` — queryEvents(), queryVolunteers(), queryDonations(), queryAttendance()
- [ ] T003 [P] [SETUP] Tạo file `backend/src/services/report.service.js` — generateCSV(), generateXLSX()
- [ ] T004 [P] [SETUP] Tạo file `backend/src/controllers/report.controller.js` — export()
- [ ] T005 [P] [SETUP] Tạo file `backend/src/routes/report.routes.js`
- [ ] T006 [P] [SETUP] Cài đặt dependencies: `npm install json2csv exceljs`
- [ ] T007 [P] [SETUP] Tạo file `frontend/src/api/reportApi.js`
- [ ] T008 [P] [SETUP] Tạo file `frontend/src/components/reports/ExportReportPage.jsx`

---

## Phase 2: User Story 1 — Export danh sách sự kiện ra CSV (Priority: P1) 🎯 MVP

**Goal**: Admin export danh sách sự kiện ra file CSV với filter thời gian.

**Independent Test**: Gọi GET /reports/export?type=events&format=csv → file CSV.

### Tests

- [ ] T009 [P] [US1] Contract test: `GET /api/v1/reports/export?type=events&format=csv` — Content-Type text/csv trong `backend/tests/report.test.js`
- [ ] T010 [P] [US1] Contract test: `GET /api/v1/reports/export?type=events&format=csv&start_date=2026-01-01&end_date=2026-06-30` — filter date range
- [ ] T011 [P] [US1] Contract test: không có dữ liệu → file chỉ có header + "Không có dữ liệu"

### Implementation

- [ ] T012 [US1] Implement `report.repository.js` — queryEvents(filters): lấy danh sách event với filter
- [ ] T013 [US1] Implement `report.service.js` — generateCSV(type, filters): query data, convert to CSV, return stream
- [ ] T014 [US1] Implement `report.controller.js` — export(): validate params, gọi service, set Content-Type + filename header
- [ ] T015 [US1] Implement `ExportReportPage.jsx` — form chọn type, format, date range, download button
- [ ] T016 [US1] Thêm Swagger JSDoc cho `GET /api/v1/reports/export`

---

## Phase 3: User Story 2 — Export báo cáo quyên góp ra Excel (Priority: P1)

**Goal**: Admin export báo cáo quyên góp ra file XLSX.

**Independent Test**: Gọi GET /reports/export?type=donations&format=xlsx → file XLSX.

### Tests

- [ ] T017 [P] [US2] Contract test: `GET /api/v1/reports/export?type=donations&format=xlsx` — Content-Type application/vnd.openxmlformats
- [ ] T018 [P] [US2] Contract test: `GET /api/v1/reports/export` với type không hợp lệ → HTTP 400

### Implementation

- [ ] T019 [US2] Implement `report.repository.js` — queryDonations(filters): lấy danh sách donation
- [ ] T020 [US2] Implement `report.service.js` — generateXLSX(type, filters): query data, create workbook with ExcelJS, return stream
- [ ] T021 [US2] Cập nhật `report.controller.js` — handle xlsx format

---

## Phase 4: User Story 3 — Export báo cáo volunteer và attendance (Priority: P2)

**Goal**: Manager export danh sách volunteer và attendance trong tổ chức mình.

**Independent Test**: Gọi GET /reports/export?type=volunteers&format=csv với Manager → chỉ data org của Manager.

### Tests

- [ ] T022 [P] [US3] Contract test: `GET /api/v1/reports/export?type=volunteers&format=csv` với Manager — chỉ data org của Manager
- [ ] T023 [P] [US3] Contract test: data > 10,000 rows → HTTP 400

### Implementation

- [ ] T024 [US3] Implement `report.repository.js` — queryVolunteers(filters), queryAttendance(filters)
- [ ] T025 [US3] Cập nhật `report.service.js` — thêm type volunteers, attendance; phân quyền Manager (filter by organization_id)
- [ ] T026 [US3] Cập nhật `report.controller.js` — validate type enum, format enum, giới hạn 10,000 rows

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (US1)**: Depends on Phase 1 — CSV export (MVP)
- **Phase 3 (US2)**: Depends on Phase 2 — XLSX export
- **Phase 4 (US3)**: Depends on Phase 3 — Volunteers & Attendance

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Export là on-demand — không lưu file trên server
- Header tiếng Việt, font Unicode

# Tasks: View Organization Detail (UC38)

**Input**: Design documents from `.sdd/DucNM/UC38-feat-view-organization-detail/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), context.md

---

## Phase 1: Setup & Foundation

**Purpose**: Khởi tạo cấu trúc file cho feature

- [ ] T001 [P] [SETUP] Thêm phương thức `findById()` và `getRecentEvents()` trong `backend/src/repositories/organization.repository.js`
- [ ] T002 [P] [SETUP] Thêm phương thức `getOrganizationById()` trong `backend/src/services/organization.service.js`
- [ ] T003 [P] [SETUP] Thêm phương thức `getById()` trong `backend/src/controllers/organization.controller.js`
- [ ] T004 [P] [SETUP] Thêm route `GET /api/v1/organizations/:id` trong `backend/src/routes/organization.routes.js`
- [ ] T005 [P] [SETUP] Thêm hàm `getOrganizationById()` trong `frontend/src/api/organizationApi.js`
- [ ] T006 [P] [SETUP] Tạo file `frontend/src/components/organizations/OrganizationDetailPage.jsx`

---

## Phase 2: User Story 1 — Admin xem chi tiết tổ chức (kể cả inactive) (Priority: P1) 🎯 MVP

**Goal**: Admin xem toàn bộ thông tin tổ chức + 10 sự kiện gần nhất, kể cả tổ chức inactive.

**Independent Test**: Gọi `GET /api/v1/organizations/1` với token Admin, kiểm tra response đầy đủ.

### Tests

- [ ] T007 [P] [US1] Contract test: `GET /api/v1/organizations/1` với token Admin — response chứa đầy đủ thông tin + events trong `backend/tests/organization.test.js`
- [ ] T008 [P] [US1] Contract test: `GET /api/v1/organizations/9999` — HTTP 404
- [ ] T009 [P] [US1] Contract test: `GET /api/v1/organizations/abc` — HTTP 400 (id không hợp lệ)

### Implementation

- [ ] T010 [US1] Implement `organization.repository.js` — findById() trả về organization + include events (limit 10, order by start_date DESC)
- [ ] T011 [US1] Implement `organization.service.js` — getOrganizationById(): Admin thấy inactive, Manager/Staff inactive → 404
- [ ] T012 [US1] Implement `organization.controller.js` — getById(): validate id param, gọi service, trả về response
- [ ] T013 [US1] Implement `OrganizationDetailPage.jsx` — hiển thị đầy đủ thông tin + danh sách 10 events
- [ ] T014 [US1] Thêm Swagger JSDoc cho endpoint `GET /api/v1/organizations/:id`

---

## Phase 3: User Story 2 — Manager/Staff xem chi tiết tổ chức active (Priority: P1)

**Goal**: Manager/Staff chỉ thấy chi tiết tổ chức active. Inactive → 404.

**Independent Test**: Gọi API với token Manager cho organization inactive → 404.

### Tests

- [ ] T015 [P] [US2] Contract test: `GET /api/v1/organizations/1` với token Manager — organization active → thành công
- [ ] T016 [P] [US2] Contract test: `GET /api/v1/organizations/5` (inactive) với token Manager — HTTP 404

### Implementation

- [ ] T017 [US2] Cập nhật `organization.service.js` — nếu user là Manager/Staff và organization inactive → throw 404

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (US1)**: Depends on Phase 1 — Admin detail (MVP)
- **Phase 3 (US2)**: Depends on Phase 2 — Manager/Staff access control

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
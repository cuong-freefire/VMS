# Tasks: View Organization List (UC37)

**Input**: Design documents from `.sdd/DucNM/UC37-feat-view-organization-list/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), context.md

---

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup & Foundation

**Purpose**: Khởi tạo cấu trúc file cho feature

- [ ] T001 [P] [SETUP] Tạo Prisma schema cho bảng `organizations` (nếu chưa có) trong `backend/prisma/schema.prisma`
- [ ] T002 [P] [SETUP] Tạo file `backend/src/validators/organization.validator.js` — Zod schema cho query params (page, limit, search)
- [ ] T003 [P] [SETUP] Tạo file `backend/src/repositories/organization.repository.js` — phương thức findAll(), count(), searchByName()
- [ ] T004 [P] [SETUP] Tạo file `backend/src/services/organization.service.js` — phương thức getOrganizations()
- [ ] T005 [P] [SETUP] Tạo file `backend/src/controllers/organization.controller.js` — phương thức list()
- [ ] T006 [P] [SETUP] Tạo file `backend/src/routes/organization.routes.js` — route GET /api/v1/organizations
- [ ] T007 [P] [SETUP] Tạo file `frontend/src/api/organizationApi.js` — hàm getOrganizations()
- [ ] T008 [P] [SETUP] Tạo file `frontend/src/services/organization.service.js`
- [ ] T009 [P] [SETUP] Tạo file `frontend/src/components/organizations/OrganizationCard.jsx`
- [ ] T010 [P] [SETUP] Tạo file `frontend/src/components/organizations/OrganizationListPage.jsx`

---

## Phase 2: User Story 1 — Admin xem toàn bộ danh sách tổ chức (Priority: P1) 🎯 MVP

**Goal**: Admin có thể xem danh sách tất cả tổ chức (active + inactive) với phân trang và tìm kiếm.

**Independent Test**: Tạo 3 organizations active + 1 inactive, gọi API với token Admin, kiểm tra response có đủ 4 tổ chức.

### Tests

- [ ] T011 [P] [US1] Contract test: `GET /api/v1/organizations` với token Admin — response chứa cả active và inactive trong `backend/tests/organization.test.js`
- [ ] T012 [P] [US1] Contract test: `GET /api/v1/organizations?search=Hoa` — tìm kiếm không phân biệt hoa/thường
- [ ] T013 [P] [US1] Contract test: `GET /api/v1/organizations?page=1&limit=20` — phân trang hoạt động
- [ ] T014 [P] [US1] Contract test: `GET /api/v1/organizations` — danh sách rỗng trả về mảng rỗng

### Implementation

- [ ] T015 [US1] Implement `organization.repository.js` — findAll() với filters (is_active, search), count(), pagination
- [ ] T016 [US1] Implement `organization.service.js` — getOrganizations() với logic: nếu là Admin → không filter is_active; nếu Manager/Staff → chỉ filter is_active = true
- [ ] T017 [US1] Implement `organization.controller.js` — list(): validate query params, gọi service, trả về response chuẩn (success, data, pagination meta)
- [ ] T018 [US1] Implement `organization.routes.js` — `GET /api/v1/organizations` với authenticate + authorize middleware
- [ ] T019 [US1] Implement `organizationApi.js` — getOrganizations(params) gọi API
- [ ] T020 [US1] Implement `OrganizationListPage.jsx` — bảng danh sách, search input, pagination, phân biệt active/inactive
- [ ] T021 [US1] Implement `OrganizationCard.jsx` — card hiển thị tên, email, trạng thái
- [ ] T022 [US1] Thêm Swagger JSDoc cho endpoint `GET /api/v1/organizations`

---

## Phase 3: User Story 2 — Manager/Staff xem danh sách tổ chức active (Priority: P1)

**Goal**: Manager và Staff chỉ thấy tổ chức đang hoạt động.

**Independent Test**: Gọi API với token Manager, kiểm tra response chỉ chứa is_active = true.

### Tests

- [ ] T023 [P] [US2] Contract test: `GET /api/v1/organizations` với token Manager — chỉ trả về is_active = true
- [ ] T024 [P] [US2] Contract test: `GET /api/v1/organizations` với token Staff — chỉ trả về is_active = true

### Implementation

- [ ] T025 [US2] Cập nhật `organization.service.js` — logic phân quyền: role Admin → không filter, role Manager/Staff → filter is_active = true
- [ ] T026 [US2] Cập nhật `OrganizationListPage.jsx` — ẩn filter inactive nếu user là Manager/Staff

---

## Phase 4: User Story 3 — Chặn truy cập với người dùng không có quyền (Priority: P1)

**Goal**: Volunteer và Guest không được xem danh sách tổ chức.

**Independent Test**: Gọi API với token Volunteer → 403, không token → 401.

### Tests

- [ ] T027 [P] [US3] Contract test: `GET /api/v1/organizations` với token Volunteer — HTTP 403
- [ ] T028 [P] [US3] Contract test: `GET /api/v1/organizations` không có token — HTTP 401

### Implementation

- [ ] T029 [US3] Kiểm tra middleware authenticate + authorize trong route — Volunteer bị chặn ở mức 403, Guest 401

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1)**: Depends on Phase 1 — Admin full list (MVP)
- **Phase 3 (US2)**: Depends on Phase 2 — Manager/Staff filter active
- **Phase 4 (US3)**: Depends on Phase 1 — Authorization enforcement

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Commit after each task or logical group
# Tasks: Edit Organization (UC40)

**Input**: Design documents from `.sdd/DucNM/UC40-feat-edit-organization/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), context.md

---

## Phase 1: Setup & Foundation

- [ ] T001 [P] [SETUP] Thêm Zod schema `updateOrganizationSchema` trong `backend/src/validators/organization.validator.js`
- [ ] T002 [P] [SETUP] Thêm phương thức `update()` và `findActiveEvents()` trong `backend/src/repositories/organization.repository.js`
- [ ] T003 [P] [SETUP] Thêm phương thức `updateOrganization()` trong `backend/src/services/organization.service.js`
- [ ] T004 [P] [SETUP] Thêm phương thức `update()` trong `backend/src/controllers/organization.controller.js`
- [ ] T005 [P] [SETUP] Thêm route `PUT /api/v1/organizations/:id` trong `backend/src/routes/organization.routes.js`
- [ ] T006 [P] [SETUP] Thêm hàm `updateOrganization()` trong `frontend/src/api/organizationApi.js`

---

## Phase 2: User Story 1 — Admin chỉnh sửa thông tin tổ chức (Priority: P1) 🎯 MVP

**Goal**: Admin cập nhật thông tin tổ chức, đổi tên, upload logo mới.

**Independent Test**: Gọi `PUT /api/v1/organizations/1` với body hợp lệ + token Admin → 200.

### Tests

- [ ] T007 [P] [US1] Contract test: `PUT /api/v1/organizations/1` với body hợp lệ — HTTP 200 trong `backend/tests/organization.test.js`
- [ ] T008 [P] [US1] Contract test: `PUT /api/v1/organizations/1` với tên trùng org khác — HTTP 409
- [ ] T009 [P] [US1] Contract test: `PUT /api/v1/organizations/9999` — HTTP 404

### Implementation

- [ ] T010 [US1] Implement `organization.validator.js` — updateOrganizationSchema: name (optional, unique trừ chính nó), các field optional
- [ ] T011 [US1] Implement `organization.repository.js` — update(id, data), findActiveEvents(orgId)
- [ ] T012 [US1] Implement `organization.service.js` — updateOrganization(): kiểm tra tồn tại, validate tên unique, xóa logo cũ + upload mới nếu có, ghi audit log
- [ ] T013 [US1] Implement `organization.controller.js` — update(): validate, gọi service, trả về 200
- [ ] T014 [US1] Cập nhật `OrganizationFormPage.jsx` — hỗ trợ edit mode (pre-fill data)
- [ ] T015 [US1] Thêm Swagger JSDoc cho endpoint `PUT /api/v1/organizations/:id`

---

## Phase 3: User Story 2 — Admin vô hiệu hóa tổ chức (soft-delete) (Priority: P1)

**Goal**: Admin vô hiệu hóa tổ chức nếu không còn sự kiện đang hoạt động.

**Independent Test**: Gọi `PUT /api/v1/organizations/1` với `is_active: false` → 200 nếu hợp lệ, 409 nếu còn event active.

### Tests

- [ ] T016 [P] [US2] Contract test: `PUT /api/v1/organizations/1` set is_active=false (không còn event active) — HTTP 200
- [ ] T017 [P] [US2] Contract test: `PUT /api/v1/organizations/2` set is_active=false (còn event IN_PROGRESS) — HTTP 409
- [ ] T018 [P] [US2] Contract test: `PUT /api/v1/organizations/3` set is_active=false (đã inactive) — HTTP 400

### Implementation

- [ ] T019 [US2] Cập nhật `organization.service.js` — kiểm tra ràng buộc: nếu set is_active=false, tìm event đang hoạt động (IN_PROGRESS, PUBLISHED), nếu có → throw 409
- [ ] T020 [US2] Cập nhật `organization.service.js` — kiểm tra nếu đã inactive → throw 400

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: No dependencies — depends on UC37 repository existing
- **Phase 2 (US1)**: Depends on Phase 1 — Admin update (MVP)
- **Phase 3 (US2)**: Depends on Phase 2 — Soft-delete with constraint check

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
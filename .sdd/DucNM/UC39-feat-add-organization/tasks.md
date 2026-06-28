# Tasks: Add Organization (UC39)

**Input**: Design documents from `.sdd/DucNM/UC39-feat-add-organization/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), context.md

---

## Phase 1: Setup & Foundation

- [ ] T001 [P] [SETUP] Thêm Zod schema `createOrganizationSchema` trong `backend/src/validators/organization.validator.js`
- [ ] T002 [P] [SETUP] Thêm phương thức `create()` trong `backend/src/repositories/organization.repository.js`
- [ ] T003 [P] [SETUP] Thêm phương thức `createOrganization()` trong `backend/src/services/organization.service.js`
- [ ] T004 [P] [SETUP] Thêm phương thức `create()` trong `backend/src/controllers/organization.controller.js`
- [ ] T005 [P] [SETUP] Thêm route `POST /api/v1/organizations` trong `backend/src/routes/organization.routes.js`
- [ ] T006 [P] [SETUP] Thêm hàm `createOrganization()` trong `frontend/src/api/organizationApi.js`
- [ ] T007 [P] [SETUP] Tạo file `frontend/src/components/organizations/OrganizationFormPage.jsx`

---

## Phase 2: User Story 1 — Admin thêm tổ chức thành công (Priority: P1) 🎯 MVP

**Goal**: Admin thêm tổ chức mới với đầy đủ thông tin, upload logo.

**Independent Test**: Gọi `POST /api/v1/organizations` với body hợp lệ + token Admin → 201.

### Tests

- [ ] T008 [P] [US1] Contract test: `POST /api/v1/organizations` với body hợp lệ — HTTP 201 trong `backend/tests/organization.test.js`
- [ ] T009 [P] [US1] Contract test: `POST /api/v1/organizations` với tên trùng — HTTP 409
- [ ] T010 [P] [US1] Contract test: `POST /api/v1/organizations` với tên rỗng — HTTP 400
- [ ] T011 [P] [US1] Contract test: `POST /api/v1/organizations` với email sai format — HTTP 400

### Implementation

- [ ] T012 [US1] Implement `organization.validator.js` — createOrganizationSchema: name (required, max 255), description, address, contact_phone, contact_email (email format), website, logo (file validation)
- [ ] T013 [US1] Implement `organization.repository.js` — create(data): tạo organization với is_active = true
- [ ] T014 [US1] Implement `organization.service.js` — createOrganization(): kiểm tra tên unique, upload logo lên Cloudinary nếu có, tạo record, ghi audit log
- [ ] T015 [US1] Implement `organization.controller.js` — create(): validate body, gọi service, trả về 201
- [ ] T016 [US1] Implement `OrganizationFormPage.jsx` — form với React Hook Form, upload logo, validation messages
- [ ] T017 [US1] Thêm Swagger JSDoc cho endpoint `POST /api/v1/organizations`

---

## Phase 3: User Story 2 — Chặn thêm tổ chức khi không có quyền (Priority: P1)

**Goal**: Non-Admin không được thêm tổ chức.

**Independent Test**: Gọi API với token Manager → 403.

### Tests

- [ ] T018 [P] [US2] Contract test: `POST /api/v1/organizations` với token Manager — HTTP 403
- [ ] T019 [P] [US2] Contract test: `POST /api/v1/organizations` không có token — HTTP 401

### Implementation

- [ ] T020 [US2] Kiểm tra middleware authorize(ADMIN) trong route

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (US1)**: Depends on Phase 1 — Admin create (MVP)
- **Phase 3 (US2)**: Depends on Phase 1 — Authorization

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
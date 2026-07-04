# Tasks: Add Organization (UC39)

**Input**: Design documents từ `.sdd/DucNM/UC39-feat-add-organization/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Kế thừa infrastructure từ UC37/UC38 (Organization model, repository pattern)
- **New**: Cloudinary config, multer upload middleware

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Thiết lập Cloudinary config, upload middleware, và Zod schema

- [ ] T001 Tạo Cloudinary config trong `backend/src/config/cloudinary.config.js`
- [ ] T002 [P] Tạo upload middleware trong `backend/src/middleware/upload.middleware.js` — multer với memoryStorage, file filter (.jpg/.png/.webp), 2MB limit
- [ ] T003 Tạo `createOrganizationSchema` (Zod) trong `backend/src/validators/organization.validator.js` — name (min 1), description, address, contact_phone, contact_email (email format optional), website (url format optional)

---

## Phase 2: User Story 1 - Admin thêm tổ chức thành công (Priority: P1) 🎯 MVP

**Goal**: Admin gọi `POST /api/v1/organizations` với dữ liệu hợp lệ và nhận HTTP 201 cùng thông tin organization mới.

**Independent Test**: Gọi `POST /api/v1/organizations` với body hợp lệ (không logo) + Admin token → 201. Gọi với logo file → 201 + logo_url.

### Tests cho User Story 1 ⚠️

- [ ] T004 [P] [US1] Unit test cho `organization.service.js` — `createOrganization` với dữ liệu hợp lệ → trả về organization mới trong `backend/tests/organization/organization.service.test.js`
- [ ] T005 [P] [US1] Unit test cho `organization.service.js` — `createOrganization` với tên đã tồn tại → throw ServiceError 409 `ORGANIZATION_EXISTS`
- [ ] T006 [P] [US1] Integration test cho `POST /api/v1/organizations` — happy path + Admin token → HTTP 201 trong `backend/tests/organization/organization.api.test.js`
- [ ] T007 [US1] Integration test cho `POST /api/v1/organizations` — với logo file → HTTP 201 + logo_url

### Implementation cho User Story 1

- [ ] T008 [US1] Implement `findOrganizationByName` trong `backend/src/repositories/organization.repository.js` — Prisma `findUnique` theo name
- [ ] T009 [US1] Implement `createOrganization` trong `backend/src/repositories/organization.repository.js` — Prisma `create` với is_active: true
- [ ] T010 [US1] Implement `createOrganizationService` trong `backend/src/services/organization.service.js` — validation → unique check → Cloudinary upload (nếu có) → create → audit log
- [ ] T011 [US1] Implement `createOrganizationHandler` trong `backend/src/controllers/organization.controller.js` — gọi service + trả về 201
- [ ] T012 [US1] Thêm route `POST /` trong `backend/src/routes/organization.routes.js` — middleware chain: authMiddleware → authorize('ADMIN') → uploadLogo → createOrganizationHandler
- [ ] T013 [US1] Thêm Swagger JSDoc cho endpoint `POST /api/v1/organizations` trong `backend/src/routes/organization.routes.js`

**Checkpoint**: User Story 1 hoàn thành — Admin tạo được organization mới (có/không logo).

---

## Phase 3: User Story 2 - Chặn thêm tổ chức khi không có quyền (Priority: P1)

**Goal**: Manager/Staff/Volunteer nhận 403, Guest nhận 401 khi gọi `POST /api/v1/organizations`.

**Independent Test**: Gọi `POST /api/v1/organizations` với token Manager → 403. Không token → 401.

### Tests cho User Story 2 ⚠️

- [ ] T014 [P] [US2] Integration test — Manager token → HTTP 403 trong `backend/tests/organization/organization.api.test.js`
- [ ] T015 [P] [US2] Integration test — Staff token → HTTP 403
- [ ] T016 [P] [US2] Integration test — Volunteer token → HTTP 403
- [ ] T017 [US2] Integration test — không token → HTTP 401

### Implementation cho User Story 2

- [ ] T018 [US2] Middleware chain đã implement ở T012 — `authorize('ADMIN')` xử lý 403, `authMiddleware` xử lý 401. **(Không cần code mới)**

**Checkpoint**: User Story 2 hoàn thành — endpoint được bảo vệ đúng phân quyền.

---

## Phase 4: Validation & Edge Cases

**Purpose**: Xử lý validation và edge cases

### Tests ⚠️

- [ ] T019 [P] Unit test — `createOrganization` với name empty → throw ServiceError 400 trong `backend/tests/organization/organization.service.test.js`
- [ ] T020 [P] Unit test — `createOrganization` với email sai format → throw ServiceError 400
- [ ] T021 [P] Integration test — `POST /api/v1/organizations` với name empty → HTTP 400 trong `backend/tests/organization/organization.api.test.js`
- [ ] T022 [P] Integration test — `POST /api/v1/organizations` với email sai format → HTTP 400
- [ ] T023 [P] Integration test — database không phản hồi → HTTP 500

### Implementation

- [ ] T024 Zod schema validation đã implement ở T003
- [ ] T025 Frontend: Validation đồng bộ với React Hook Form + Zod resolver trong `AddOrganizationPage.jsx`
- [ ] T026 Frontend: Logo preview + file upload UI

---

## Phase 5: Frontend

**Purpose**: Xây dựng giao diện Add Organization form

- [ ] T027 [P] Thêm `createOrganization(formData)` trong `frontend/src/api/organizationApi.js`
- [ ] T028 [P] Implement React hook `useCreateOrganization` trong `frontend/src/hooks/useCreateOrganization.js`
- [ ] T029 Implement `AddOrganizationPage.jsx` với React Hook Form + Zod resolver + logo upload + preview
- [ ] T030 Thêm route `/organizations/add` trong `frontend/src/App.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T003 — chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên Phase 1 + UC37/UC38 infrastructure
- **User Story 2 (Phase 3)**: Depends trên T012 (middleware chain)
- **Validation (Phase 4)**: Depends trên T003 (Zod schema) + T010 (service validation)
- **Frontend (Phase 5)**: Depends trên API hoàn thành

### User Story Dependencies

- **US1 (P1)**: MVP — bắt đầu ngay sau Setup
- **US2 (P1)**: Middleware chain — implement cùng T012
- **Frontend**: Sau khi API hoàn thành

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T001, T002 | Cloudinary config + Upload middleware — khác files |
| T004, T005 | Tests US1 — viết song song |
| T008, T009 | Repository methods — khác functions |
| T027, T028 | Frontend API + Hook — song song |
| T014-T017 | Tests US2 — chạy song song |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001-T003) → Cloudinary + Upload + Zod ready
2. **Phase 2**: US1 (T004-T013) → **MVP!** Admin tạo được organization
3. **Phase 3**: US2 (T014-T018) → Phân quyền
4. **Phase 4**: Validation (T019-T026)
5. **Phase 5**: Frontend (T027-T030)
# Tasks: Edit Organization (UC40)

**Input**: Design documents từ `.sdd/DucNM/UC40-feat-edit-organization/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Kế thừa infrastructure từ UC37/UC38/UC39 (Organization model, Cloudinary config, upload middleware)
- **New**: Cloudinary util (extractPublicId), active events constraint check

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Mở rộng infrastructure đã có từ UC37-UC39 cho UC40

- [ ] T001 Tạo `updateOrganizationSchema` (Zod) trong `backend/src/validators/organization.validator.js` — name (min 1), description, address, contact_phone, contact_email (email format optional), website (url format optional), is_active (boolean optional)
- [ ] T002 [P] Tạo Cloudinary utility trong `backend/src/utils/cloudinary.util.js` — hàm `extractPublicIdFromUrl(url)` để lấy public_id từ Cloudinary URL

---

## Phase 2: User Story 1 - Manager/Admin chỉnh sửa thông tin tổ chức (Priority: P1) 🎯 MVP

**Goal**: Manager/Admin gọi `PUT /api/v1/organizations/:id` với dữ liệu hợp lệ và nhận HTTP 200 cùng thông tin đã cập nhật.

**Independent Test**: Tạo organization trong database, gọi `PUT /api/v1/organizations/1` với body hợp lệ + Manager token, kiểm tra response 200 + data đã cập nhật.

### Tests cho User Story 1 ⚠️

- [ ] T003 [P] [US1] Unit test cho `organization.service.js` — `updateOrganization` với dữ liệu hợp lệ → trả về organization đã cập nhật trong `backend/tests/organization/organization.service.test.js`
- [ ] T004 [P] [US1] Unit test cho `organization.service.js` — `updateOrganization` với ID không tồn tại → throw ServiceError 404 `ORGANIZATION_NOT_FOUND`
- [ ] T005 [P] [US1] Unit test cho `organization.service.js` — `updateOrganization` với tên trùng (trừ chính nó) → throw ServiceError 409 `ORGANIZATION_EXISTS`
- [ ] T006 [P] [US1] Unit test cho `organization.service.js` — `updateOrganization` chỉ update `description` → thành công
- [ ] T007 [P] [US1] Integration test cho `PUT /api/v1/organizations/:id` — happy path với Manager token → HTTP 200 trong `backend/tests/organization/organization.api.test.js`
- [ ] T008 [US1] Integration test cho `PUT /api/v1/organizations/:id` — happy path với Admin token → HTTP 200

### Implementation cho User Story 1

- [ ] T009 [US1] Implement `findOrganizationByNameExcluding` trong `backend/src/repositories/organization.repository.js` — Prisma `findFirst` với `NOT`
- [ ] T010 [US1] Implement `updateOrganization` trong `backend/src/repositories/organization.repository.js` — Prisma `update`
- [ ] T011 [US1] Implement `updateOrganizationService` trong `backend/src/services/organization.service.js` — check exists → validate → unique name (exclude self) → handle logo (upload + delete old) → update → audit log
- [ ] T012 [US1] Implement `updateOrganizationHandler` trong `backend/src/controllers/organization.controller.js` — gọi service + trả về 200
- [ ] T013 [US1] Thêm route `PUT /:id` trong `backend/src/routes/organization.routes.js` — middleware chain: authMiddleware → authorize('MANAGER', 'ADMIN') → uploadLogo → updateOrganizationHandler
- [ ] T014 [US1] Thêm Swagger JSDoc cho endpoint `PUT /api/v1/organizations/:id` trong `backend/src/routes/organization.routes.js`

**Checkpoint**: User Story 1 hoàn thành — Manager/Admin chỉnh sửa organization thành công.

---

## Phase 3: User Story 2 - Manager/Admin vô hiệu hóa tổ chức (soft-delete) (Priority: P1)

**Goal**: Manager/Admin set `is_active = false` để soft-delete organization. Kiểm tra ràng buộc: không còn active events → 409 nếu còn, 400 nếu đã inactive.

**Independent Test**: Gọi `PUT /api/v1/organizations/1` với `is_active: false` (không active events) → 200. Gọi với organization còn active events → 409. Gọi với organization đã inactive → 400.

### Tests cho User Story 2 ⚠️

- [ ] T015 [P] [US2] Unit test cho `organization.service.js` — `updateOrganization` set `is_active=false` (không active events) → thành công trong `backend/tests/organization/organization.service.test.js`
- [ ] T016 [P] [US2] Unit test cho `organization.service.js` — `updateOrganization` set `is_active=false` (còn active events) → throw ServiceError 409 `ACTIVE_EVENTS_EXIST`
- [ ] T017 [P] [US2] Unit test cho `organization.service.js` — `updateOrganization` set `is_active=false` (đã inactive) → throw ServiceError 400 `ALREADY_INACTIVE`
- [ ] T018 [P] [US2] Integration test cho `PUT /api/v1/organizations/:id` — set `is_active=false` (không active events) → HTTP 200 trong `backend/tests/organization/organization.api.test.js`
- [ ] T019 [US2] Integration test cho `PUT /api/v1/organizations/:id` — set `is_active=false` (còn active events) → HTTP 409
- [ ] T020 [US2] Integration test cho `PUT /api/v1/organizations/:id` — set `is_active=false` (đã inactive) → HTTP 400

### Implementation cho User Story 2

- [ ] T021 [US2] Implement `countActiveEventsByOrgId` trong `backend/src/repositories/organization.repository.js` — Prisma `count` với status IN ['PENDING', 'IN_PROGRESS']
- [ ] T022 [US2] Soft-delete constraint logic đã implement ở T011 — kiểm tra `is_active === false && existing.is_active === true` → countActiveEvents → 409 nếu > 0
- [ ] T023 [US2] Already inactive check đã implement ở T011 — kiểm tra `is_active === false && existing.is_active === false` → 400

**Checkpoint**: User Story 2 hoàn thành — Soft-delete với ràng buộc hoạt động.

---

## Phase 4: User Story 3 - Chặn truy cập với người dùng không có quyền (Priority: P1)

**Goal**: Staff/Volunteer nhận 403, Guest nhận 401 khi gọi `PUT /api/v1/organizations/:id`.

**Independent Test**: Gọi `PUT /api/v1/organizations/1` với token Staff → 403. Không token → 401.

### Tests cho User Story 3 ⚠️

- [ ] T024 [P] [US3] Integration test — Staff token → HTTP 403 trong `backend/tests/organization/organization.api.test.js`
- [ ] T025 [P] [US3] Integration test — Volunteer token → HTTP 403
- [ ] T026 [P] [US3] Integration test — không token → HTTP 401
- [ ] T027 [US3] Integration test — token hết hạn → HTTP 401

### Implementation cho User Story 3

- [ ] T028 [US3] Middleware chain đã implement ở T013 — `authorize('MANAGER', 'ADMIN')` xử lý 403, `authMiddleware` xử lý 401. **(Không cần code mới)**

**Checkpoint**: User Story 3 hoàn thành — endpoint được bảo vệ đúng phân quyền.

---

## Phase 5: Validation & Edge Cases

**Purpose**: Xử lý validation và edge cases

### Tests ⚠️

- [ ] T029 [P] Unit test — `updateOrganization` với email sai format → throw ServiceError 400 trong `backend/tests/organization/organization.service.test.js`
- [ ] T030 [P] Unit test — `updateOrganization` với name empty → throw ServiceError 400
- [ ] T031 [P] Integration test — `PUT /api/v1/organizations/abc` (ID không hợp lệ) → HTTP 400 trong `backend/tests/organization/organization.api.test.js`
- [ ] T032 [P] Integration test — database không phản hồi → HTTP 500

### Implementation

- [ ] T033 Zod schema validation đã implement ở T001
- [ ] T034 ID validation — `Number(req.params.id)` check trong controller

---

## Phase 6: Frontend

**Purpose**: Xây dựng giao diện Edit Organization form

- [ ] T035 [P] Thêm `updateOrganization(id, formData)` trong `frontend/src/api/organizationApi.js`
- [ ] T036 [P] Implement React hook `useUpdateOrganization` trong `frontend/src/hooks/useUpdateOrganization.js`
- [ ] T037 Implement `EditOrganizationPage.jsx` — fetch org → pre-fill form → logo upload + preview → is_active switch → PUT submit
- [ ] T038 Thêm route `/organizations/:id/edit` trong `frontend/src/App.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T002 — chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên Phase 1 + UC37-UC39 infrastructure
- **User Story 2 (Phase 3)**: Depends trên T011 (service logic) + T021 (countActiveEvents)
- **User Story 3 (Phase 4)**: Depends trên T013 (middleware chain)
- **Validation (Phase 5)**: Depends trên Phase 2-3
- **Frontend (Phase 6)**: Depends trên API hoàn thành

### User Story Dependencies

- **US1 (P1)**: MVP — bắt đầu ngay sau Setup
- **US2 (P1)**: Soft-delete logic trong service — implement cùng US1
- **US3 (P1)**: Middleware chain — implement cùng T013
- **Frontend**: Sau khi API hoàn thành

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T001, T002 | Zod schema + Cloudinary util — khác files |
| T003, T004, T005 | Tests US1 — viết song song |
| T009, T010 | Repository methods — khác functions |
| T015, T016, T017 | Tests US2 — viết song song |
| T024-T027 | Tests US3 — chạy song song |
| T035, T036 | Frontend API + Hook — song song |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001-T002) → Zod schema + Cloudinary util ready
2. **Phase 2+3**: US1+US2 (T003-T023) → **MVP!** Manager edit được organization + soft-delete với constraint
3. **Phase 4**: US3 (T024-T028) → Phân quyền
4. **Phase 5**: Validation (T029-T034)
5. **Phase 6**: Frontend (T035-T038)
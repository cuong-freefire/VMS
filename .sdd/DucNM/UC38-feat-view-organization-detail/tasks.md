# Tasks: View Organization Detail (UC38)

**Input**: Design documents từ `.sdd/DucNM/UC38-feat-view-organization-detail/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Kế thừa infrastructure từ UC37 (Organization model, repository pattern)
- **Cross-module**: Phục vụ UC09 (View Event Detail — NamLD)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Mở rộng infrastructure đã có từ UC37 cho UC38

- [ ] T001 Thêm repository methods trong `backend/src/repositories/organization.repository.js` — `findOrganizationById(id, select)` và `findRecentEventsByOrgId(orgId, limit)`

---

## Phase 2: User Story 1 - Admin xem chi tiết tổ chức (kể cả inactive) (Priority: P1) 🎯 MVP

**Goal**: Admin gọi `GET /api/v1/organizations/:id` và nhận full info + events summary. Admin thấy cả inactive orgs.

**Independent Test**: Tạo organization (active + inactive), gọi endpoint với token Admin, kiểm tra response có đầy đủ fields + events array.

### Tests cho User Story 1 ⚠️

- [ ] T002 [P] [US1] Unit test — `getOrganizationById` với role ADMIN (active org) → full info + events trong `backend/tests/organization/organization.service.test.js`
- [ ] T003 [P] [US1] Unit test — `getOrganizationById` với role ADMIN (inactive org) → full info + events
- [ ] T004 [P] [US1] Unit test — `getOrganizationById` với role MANAGER (active org) → full info + events
- [ ] T005 [P] [US1] Unit test — `getOrganizationById` với role STAFF (active org) → full info + events
- [ ] T006 [P] [US1] Unit test — `getOrganizationById` với ID không tồn tại → throw 404
- [ ] T007 [P] [US1] Integration test — Admin token → HTTP 200 + full info trong `backend/tests/organization/organization.api.test.js`
- [ ] T008 [US1] Integration test — Manager token (active org) → HTTP 200 + full info
- [ ] T009 [US1] Integration test — Manager token (inactive org) → HTTP 404

### Implementation cho User Story 1

- [ ] T010 [US1] Implement `getOrganizationById` trong `backend/src/services/organization.service.js` — validate ID → determine detail level → query with select → check inactive → add events → return
- [ ] T011 [US1] Implement `getOrganizationByIdHandler` trong `backend/src/controllers/organization.controller.js` — gọi service + trả về 200
- [ ] T012 [US1] Thêm route `GET /:id` trong `backend/src/routes/organization.routes.js` — optionalAuth → getOrganizationByIdHandler
- [ ] T013 [US1] Thêm Swagger JSDoc cho endpoint `GET /api/v1/organizations/:id` trong `backend/src/routes/organization.routes.js`

**Checkpoint**: User Story 1 hoàn thành — Admin/Manager/Staff xem được full detail.

---

## Phase 3: User Story 2 - Volunteer/Guest xem basic info (Priority: P1)

**Goal**: Volunteer và Guest gọi `GET /api/v1/organizations/:id` và chỉ thấy basic info (name, description, logo_url, is_active). Phục vụ UC09 (View Event Detail).

**Independent Test**: Gọi endpoint với token Volunteer → 200 + basic fields (no contact, no events). Gọi không token (Guest) → 200 + basic fields.

### Tests cho User Story 2 ⚠️

- [ ] T014 [P] [US2] Unit test — `getOrganizationById` với role VOLUNTEER (active org) → basic info (không contact, không events) trong `backend/tests/organization/organization.service.test.js`
- [ ] T015 [P] [US2] Unit test — `getOrganizationById` với user = null (Guest) (active org) → basic info
- [ ] T016 [P] [US2] Unit test — `getOrganizationById` với role VOLUNTEER (inactive org) → throw 404
- [ ] T017 [P] [US2] Integration test — Volunteer token → HTTP 200 + basic info trong `backend/tests/organization/organization.api.test.js`
- [ ] T018 [US2] Integration test — không token (Guest) → HTTP 200 + basic info

### Implementation cho User Story 2

- [ ] T019 [US2] Basic vs Full detail logic đã implement ở T010 — sử dụng `BASIC_SELECT` và `FULL_SELECT`
- [ ] T020 [US2] Optional auth middleware (tái sử dụng từ UC31) — Guest không token vẫn vào được. Đã dùng ở T012.

**Checkpoint**: User Story 2 hoàn thành — Volunteer/Guest xem được basic info (phục vụ UC09).

---

## Phase 4: Edge Cases & Validation

**Purpose**: Xử lý các edge case

### Tests ⚠️

- [ ] T021 [P] Integration test — `GET /api/v1/organizations/abc` (ID không hợp lệ) → HTTP 400 trong `backend/tests/organization/organization.api.test.js`
- [ ] T022 [P] Integration test — database không phản hồi → HTTP 500
- [ ] T023 Unit test — getOrganizationById với ID âm → throw 400 `INVALID_ORGANIZATION_ID`

### Implementation

- [ ] T024 ID validation đã implement ở T010 — `Number(organizationId)` check + `isNaN` + `<= 0`

---

## Phase 5: Frontend (Organization Detail Page)

**Purpose**: Xây dựng giao diện Organization Detail

- [ ] T025 [P] Thêm `getOrganizationById(id)` trong `frontend/src/api/organizationApi.js`
- [ ] T026 [P] Implement React hook `useOrganizationDetail` trong `frontend/src/hooks/useOrganizationDetail.js`
- [ ] T027 Implement `OrganizationDetailPage.jsx` — hiển thị full info (Staff/Manager/Admin) hoặc basic info (Volunteer/Guest)
- [ ] T028 Thêm route `/organizations/:id` trong `frontend/src/App.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 — chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên T001 + UC37 infrastructure
- **User Story 2 (Phase 3)**: Depends trên T010 (service logic) — cùng code với US1
- **Edge Cases (Phase 4)**: Depends trên Phase 2-3
- **Frontend (Phase 5)**: Depends trên API hoàn thành

### User Story Dependencies

- **US1 (P1)**: MVP — bắt đầu ngay sau Setup
- **US2 (P1)**: Cùng service logic với US1 — implement cùng nhau
- **Frontend**: Sau khi API hoàn thành

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001) → Repository methods ready
2. **Phase 2+3**: US1+US2 (T002-T020) → **MVP!** Tất cả roles xem được organization detail với level phù hợp (full vs basic)
3. **Phase 4**: Edge cases (T021-T024)
4. **Phase 5**: Frontend (T025-T028)
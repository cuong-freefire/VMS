# Tasks: View Organization List (UC37)

**Input**: Design documents từ `.sdd/DucNM/UC37-feat-view-organization-list/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2, US3)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- **New module**: Organization Management — tạo mới toàn bộ stack (pattern tương tự User Management UC26)
- **Cross-module**: Phục vụ UC11 (Filter Event — NamLD)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Thiết lập database model và infrastructure dùng chung

- [ ] T001 Thêm Organization model vào Prisma schema trong `backend/prisma/schema.prisma` — fields: organization_id, name (unique), description, address, contact_phone, contact_email, website, logo_url, is_active (default true), created_at, updated_at
- [ ] T002 Chạy Prisma migration: `npx prisma migrate dev --name add_organization_model`
- [ ] T003 [P] Tạo organization repository trong `backend/src/repositories/organization.repository.js` — hàm `findOrganizations({ skip, take, where })`
- [ ] T004 Tạo organization validator trong `backend/src/validators/organization.validator.js` — `getOrganizationsQuerySchema` (page, limit, search)

---

## Phase 2: User Story 1 - Admin xem toàn bộ danh sách tổ chức (Priority: P1) 🎯 MVP

**Goal**: Admin gọi `GET /api/v1/organizations` và thấy tất cả organizations (active + inactive) với phân trang + tìm kiếm.

**Independent Test**: Tạo 3 organizations active + 1 inactive, gọi `GET /api/v1/organizations` với token Admin, kiểm tra response có đủ 4 organizations + pagination metadata.

### Tests cho User Story 1 ⚠️

- [ ] T005 [P] [US1] Unit test cho `organization.service.js` — getOrganizations với role ADMIN → trả về tất cả (active + inactive) trong `backend/tests/organization/organization.service.test.js`
- [ ] T006 [P] [US1] Unit test cho `organization.service.js` — getOrganizations với search → lọc theo tên case-insensitive
- [ ] T007 [P] [US1] Integration test cho `GET /api/v1/organizations` — token Admin → HTTP 200 + all organizations trong `backend/tests/organization/organization.api.test.js`
- [ ] T008 [US1] Integration test cho `GET /api/v1/organizations?search=keyword` — tìm kiếm chính xác

### Implementation cho User Story 1

- [ ] T009 [US1] Implement `organization.service.js` — hàm `getOrganizations(query, currentUser)` với role-based visibility + pagination + search trong `backend/src/services/organization.service.js`
- [ ] T010 [US1] Implement `organization.controller.js` — handler `getOrganizationsHandler` trong `backend/src/controllers/organization.controller.js`
- [ ] T011 [US1] Tạo `organization.routes.js` — route `GET /` với optionalAuth middleware trong `backend/src/routes/organization.routes.js`
- [ ] T012 [US1] Cập nhật `backend/src/app.js` — mount `organizationRoutes` tại prefix `/api/v1/organizations`
- [ ] T013 [US1] Thêm Swagger JSDoc cho endpoint `GET /api/v1/organizations` trong `backend/src/routes/organization.routes.js`

**Checkpoint**: User Story 1 hoàn thành — Admin xem được tất cả organizations với pagination + search.

---

## Phase 3: User Story 2 - Manager/Staff xem danh sách tổ chức active (Priority: P1)

**Goal**: Manager/Staff gọi `GET /api/v1/organizations` và chỉ thấy organizations active.

**Independent Test**: Gọi `GET /api/v1/organizations` với token Manager, kiểm tra response chỉ chứa organization có is_active = true.

### Tests cho User Story 2 ⚠️

- [ ] T014 [P] [US2] Unit test cho `organization.service.js` — getOrganizations với role MANAGER → chỉ active trong `backend/tests/organization/organization.service.test.js`
- [ ] T015 [P] [US2] Unit test cho `organization.service.js` — getOrganizations với role STAFF → chỉ active
- [ ] T016 [P] [US2] Integration test cho `GET /api/v1/organizations` — token Manager → HTTP 200 + only active trong `backend/tests/organization/organization.api.test.js`
- [ ] T017 [US2] Integration test cho `GET /api/v1/organizations` — token Staff → HTTP 200 + only active

### Implementation cho User Story 2

- [ ] T018 [US2] Role-based visibility logic đã implement ở T009 — Manager/Staff tự động chỉ thấy active

**Checkpoint**: User Story 2 hoàn thành — Manager/Staff xem được organizations active.

---

## Phase 4: User Story 3 - Guest/Volunteer xem organizations active (Priority: P1)

**Goal**: Guest (không token) và Volunteer gọi `GET /api/v1/organizations` và chỉ thấy organizations active. Phục vụ UC11 (Filter Event).

**Independent Test**: Gọi `GET /api/v1/organizations` không token (Guest) → 200 + only active. Gọi với token Volunteer → 200 + only active.

### Tests cho User Story 3 ⚠️

- [ ] T019 [P] [US3] Unit test cho `organization.service.js` — getOrganizations với user = null (Guest) → chỉ active trong `backend/tests/organization/organization.service.test.js`
- [ ] T020 [P] [US3] Unit test cho `organization.service.js` — getOrganizations với role VOLUNTEER → chỉ active
- [ ] T021 [P] [US3] Integration test cho `GET /api/v1/organizations` — không token (Guest) → HTTP 200 + only active trong `backend/tests/organization/organization.api.test.js`
- [ ] T022 [US3] Integration test cho `GET /api/v1/organizations` — token Volunteer → HTTP 200 + only active

### Implementation cho User Story 3

- [ ] T023 [US3] Optional auth middleware (tái sử dụng từ UC31) — Guest không token vẫn vào được controller. Đã dùng ở T011.
- [ ] T024 [US3] Role-based visibility logic đã implement ở T009 — Guest (req.user = null) và Volunteer tự động chỉ thấy active

**Checkpoint**: User Story 3 hoàn thành — Guest và Volunteer xem được organizations active (phục vụ UC11).

---

## Phase 5: Frontend

**Purpose**: Xây dựng giao diện Organization List cho Admin/Manager

- [ ] T025 [P] Implement frontend API client trong `frontend/src/api/organizationApi.js` — hàm `getOrganizations(params)`
- [ ] T026 [P] Implement React hook `useOrganizations` trong `frontend/src/hooks/useOrganizations.js` — fetch với pagination, search
- [ ] T027 Implement `OrganizationListPage.jsx` với MUI Table + search + pagination trong `frontend/src/components/pages/OrganizationListPage.jsx`
- [ ] T028 Thêm route `/organizations` trong `frontend/src/App.js`

---

## Phase 6: Edge Cases & Empty State

**Purpose**: Xử lý các edge case

- [ ] T029 [P] Unit test — getOrganizations khi không có organization nào → mảng rỗng trong `backend/tests/organization/organization.service.test.js`
- [ ] T030 [P] Integration test — `GET /api/v1/organizations?page=-1` → HTTP 400 trong `backend/tests/organization/organization.api.test.js`
- [ ] T031 [P] Integration test — `GET /api/v1/organizations?limit=999` → HTTP 400
- [ ] T032 [P] Integration test — database không phản hồi → HTTP 500
- [ ] T033 Frontend test — OrganizationListPage render empty state trong `frontend/tests/OrganizationListPage.test.jsx`
- [ ] T034 Frontend test — OrganizationListPage render loading state
- [ ] T035 Frontend test — OrganizationListPage render error state

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T004 — chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên Phase 1
- **User Story 2 (Phase 3)**: Depends trên T009 (service logic) — cùng code với US1
- **User Story 3 (Phase 4)**: Depends trên optionalAuth (UC31) + T009 (service logic)
- **Frontend (Phase 5)**: Depends trên API hoàn thành
- **Edge Cases (Phase 6)**: Depends trên Phase 2-4

### User Story Dependencies

- **US1 (P1)**: MVP — bắt đầu ngay sau Setup
- **US2 (P1)**: Cùng service logic với US1 — implement cùng nhau
- **US3 (P1)**: Cùng service logic với US1 — implement cùng nhau
- **Frontend**: Sau khi API hoàn thành

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T003, T004 | Repository + Validator — khác files |
| T005, T006 | Tests US1 — viết song song |
| T009, T010, T011 | Service + Controller + Routes — sequential |
| T025, T026 | Frontend API + Hook — song song |
| US1 (T005-T013) + US3 (T019-T024) | Song song — cùng service logic |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001-T004) → Prisma + repository + validator ready
2. **Phase 2+3+4**: US1+US2+US3 (T005-T024) → **MVP!** Tất cả roles đều xem được organizations với role-based visibility + pagination + search
3. **Phase 5**: Frontend (T025-T028) → Organization List UI
4. **Phase 6**: Edge cases + tests
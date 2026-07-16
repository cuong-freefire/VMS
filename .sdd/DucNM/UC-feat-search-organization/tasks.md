# Tasks: Search Organization

**Input**: Design documents từ `.sdd/DucNM/UC-feat-search-organization/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2, US3)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- Search Organization là extension của UC37 — tất cả thay đổi đều trên files đã có
- **Backend**: mở rộng `organization.validator.js`, `organization.service.js`, `organization.routes.js`
- **Frontend**: mở rộng `OrganizationListPage.jsx`, thêm component `SearchInput.jsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Mở rộng Zod schema để hỗ trợ search param mới: `search`

- [ ] T001 Mở rộng `getOrganizationsQuerySchema` trong `backend/src/validators/organization.validator.js` — thêm `search` (z.string().trim().optional())

---

## Phase 2: User Story 1 - Admin tìm kiếm tổ chức theo tên (Priority: P1)

**Goal**: Admin tìm kiếm organizations theo `name` — không phân biệt hoa/thường, partial match. Admin thấy cả active và inactive.

**Independent Test**: Gọi `GET /api/v1/organizations?search=Nhan%20Ai` với token Admin, kiểm tra response chứa organization có tên chứa "Nhân Ái".

### Implementation cho User Story 1

- [ ] T002 [US1] Mở rộng Prisma `where` clause trong `organization.service.js` — thêm search condition với `contains` + `mode: 'insensitive'` trên `name` (chỉ search theo tên) trong `backend/src/services/organization.service.js`
- [ ] T003 [US1] Cập nhật Swagger JSDoc cho `GET /api/v1/organizations` trong `backend/src/routes/organization.routes.js` — thêm `search` param

### Tests cho User Story 1 ⚠️

- [ ] T004 [P] [US1] Unit test cho `organization.service.js` — getOrganizations với `search="Nhan"` trả về orgs có tên chứa "Nhan" (case-insensitive) trong `backend/tests/organization/organization.service.test.js`
- [ ] T005 [P] [US1] Unit test — getOrganizations với `search="nhan"` trả về "Nhân" (case-insensitive)
- [ ] T006 [US1] Integration test cho `GET /api/v1/organizations?search=Nhan` → HTTP 200 + results trong `backend/tests/organization/organization.api.test.js`

**Checkpoint**: User Story 1 hoàn thành — Admin search by name hoạt động.

---

## Phase 3: User Story 2 - Manager tìm kiếm tổ chức theo tên (Priority: P1)

**Goal**: Manager tìm kiếm organizations — chỉ thấy active organizations (role-based filtering).

**Independent Test**: Gọi `GET /api/v1/organizations?search=Hoa` với token Manager, kiểm tra response chỉ chứa tổ chức active có tên chứa "Hoa".

### Tests cho User Story 2

- [ ] T007 [P] [US2] Unit test — getOrganizations với token Manager + `search="Hoa"` — chỉ trả về orgs active trong `backend/tests/organization/organization.service.test.js`
- [ ] T008 [US2] Integration test — Manager gọi `GET /api/v1/organizations?search=Hoa` → HTTP 200 + chỉ active orgs trong `backend/tests/organization/organization.api.test.js`

**Checkpoint**: User Story 2 hoàn thành — Manager search + role-based filter hoạt động.

---

## Phase 4: User Story 3 - Kết hợp search với filter (Priority: P2)

**Goal**: Admin kết hợp search với filter `is_active` — AND logic.

**Independent Test**: Gọi `GET /api/v1/organizations?search=Nhan&is_active=true` với token Admin, kiểm tra response chính xác.

### Tests cho User Story 3 ⚠️

- [ ] T009 [P] [US3] Unit test — getOrganizations với kết hợp `search="Nhan"` + `is_active=true` → AND logic trong `backend/tests/organization/organization.service.test.js`
- [ ] T010 [US3] Integration test — `GET /api/v1/organizations?search=Nhan&is_active=true` → HTTP 200 + AND result trong `backend/tests/organization/organization.api.test.js`

**Checkpoint**: User Story 3 hoàn thành — Search + filter kết hợp hoạt động.

---

## Phase 5: Edge Cases & Frontend

**Purpose**: Xử lý edge cases (401/403, no results) và Frontend SearchInput

### Tests ⚠️

- [ ] T011 [P] Unit test — getOrganizations với `search=""` hoặc `undefined` → bỏ qua search, trả về tất cả trong `backend/tests/organization/organization.service.test.js`
- [ ] T012 [P] Unit test — getOrganizations với `search` không match → empty array
- [ ] T013 [P] Integration test — `GET /api/v1/organizations?search=notfound` → HTTP 200 + empty array trong `backend/tests/organization/organization.api.test.js`
- [ ] T014 Integration test — Guest gọi `GET /api/v1/organizations?search=test` → HTTP 401 trong `backend/tests/organization/organization.api.test.js`
- [ ] T015 Integration test — Volunteer gọi `GET /api/v1/organizations?search=test` → HTTP 403 trong `backend/tests/organization/organization.api.test.js`

### Implementation

- [ ] T016 Frontend: Implement hoặc tái sử dụng `SearchInput.jsx` cho Organization List trong `frontend/src/components/ui/SearchInput.jsx`
- [ ] T017 Frontend: Cập nhật `OrganizationListPage.jsx` — thêm SearchInput vào UI trong `frontend/src/components/pages/OrganizationListPage.jsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 — có thể chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên T001 + T002 (service logic)
- **User Story 2 (Phase 3)**: Depends trên T001 + T002 (service logic + role-based filter từ UC37)
- **User Story 3 (Phase 4)**: Depends trên Phase 1-2
- **Edge Cases (Phase 5)**: Depends trên Phase 1-4

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T004, T005 | Tests search by name — viết song song |
| T007, T008 | Tests Manager search — viết song song |
| T011-T015 | Edge case tests — chạy song song |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001) → Zod schema ready
2. **Phase 2**: US1 (T002-T006) → Admin search **MVP!**
3. **Phase 3**: US2 (T007-T008) → Manager search + role filter
4. **Phase 4**: US3 (T009-T010) → Search + is_active filter
5. **Phase 5**: Edge cases + Frontend (T011-T017)
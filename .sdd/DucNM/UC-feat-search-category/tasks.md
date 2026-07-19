# Tasks: Search Category

**Input**: Design documents từ `.sdd/DucNM/UC-feat-search-category/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2, US3)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- Search Category là extension của UC31 — tất cả thay đổi đều trên files đã có
- **Backend**: mở rộng `category.validator.js`, `category.service.js`, `category.routes.js`
- **Frontend**: mở rộng `CategoryListPage.jsx`, thêm component `SearchInput.jsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Mở rộng Zod schema để hỗ trợ search param mới: `search`

- [ ] T001 Mở rộng `getCategoriesQuerySchema` trong `backend/src/validators/category.validator.js` — thêm `search` (z.string().trim().optional())

---

## Phase 2: User Story 1 - Manager tìm kiếm danh mục theo tên (Priority: P1)

**Goal**: Manager tìm kiếm categories theo `name` — không phân biệt hoa/thường, partial match.

**Independent Test**: Gọi `GET /api/v1/categories?search=Hoc%20Tap` với token Manager, kiểm tra response chứa category có tên chứa "Hoc Tap".

### Implementation cho User Story 1

- [ ] T002 [US1] Mở rộng Prisma `where` clause trong `category.service.js` — thêm search condition với `contains` + `mode: 'insensitive'` trên `name` và `description` (OR logic) trong `backend/src/services/category.service.js`
- [ ] T003 [US1] Cập nhật Swagger JSDoc cho `GET /api/v1/categories` trong `backend/src/routes/category.routes.js` — thêm `search` param

### Tests cho User Story 1 ⚠️

- [ ] T004 [P] [US1] Unit test cho `category.service.js` — getCategories với `search="Hoc"` trả về categories có tên chứa "Hoc" (case-insensitive) trong `backend/tests/category/category.service.test.js`
- [ ] T005 [P] [US1] Unit test — getCategories với `search="hoc"` trả về "Học" (case-insensitive)
- [ ] T006 [US1] Integration test cho `GET /api/v1/categories?search=Hoc` → HTTP 200 + results trong `backend/tests/category/category.api.test.js`

**Checkpoint**: User Story 1 hoàn thành — Search by name hoạt động.

---

## Phase 3: User Story 2 - Manager tìm kiếm theo mô tả (Priority: P2)

**Goal**: Manager tìm kiếm categories theo `description` — partial match, case-insensitive.

**Independent Test**: Gọi `GET /api/v1/categories?search=the%20thao` với token Manager, kiểm tra response chứa category có tên hoặc mô tả chứa "thể thao".

### Tests cho User Story 2

- [ ] T007 [P] [US2] Unit test cho `category.service.js` — getCategories với `search="the thao"` trả về categories có mô tả chứa "the thao" trong `backend/tests/category/category.service.test.js`
- [ ] T008 [US2] Integration test — `GET /api/v1/categories?search=thao` → HTTP 200 + results trong `backend/tests/category/category.api.test.js`

**Checkpoint**: User Story 2 hoàn thành — Search by description hoạt động.

---

## Phase 4: User Story 3 - Kết hợp search với filter type (Priority: P2)

**Goal**: Manager kết hợp search với filter type — AND logic.

**Independent Test**: Gọi `GET /api/v1/categories?search=Ha%20Noi&type=location` với token Manager, kiểm tra response chính xác.

### Tests cho User Story 3 ⚠️

- [ ] T009 [P] [US3] Unit test — getCategories với kết hợp `search="Ha Noi"` + `type="location"` → AND logic trong `backend/tests/category/category.service.test.js`
- [ ] T010 [US3] Integration test — `GET /api/v1/categories?search=Hoc&type=event_type` → HTTP 200 + AND result trong `backend/tests/category/category.api.test.js`

**Checkpoint**: User Story 3 hoàn thành — Search + type filter kết hợp hoạt động.

---

## Phase 5: Edge Cases & Frontend

**Purpose**: Xử lý edge cases và Frontend SearchInput

### Tests ⚠️

- [ ] T011 [P] Unit test — getCategories với `search=""` hoặc `undefined` → bỏ qua search, trả về tất cả trong `backend/tests/category/category.service.test.js`
- [ ] T012 [P] Unit test — getCategories với `search` không match → empty array
- [ ] T013 [P] Integration test — `GET /api/v1/categories?search=notfound` → HTTP 200 + empty array trong `backend/tests/category/category.api.test.js`

### Implementation

- [ ] T014 Frontend: Implement hoặc tái sử dụng `SearchInput.jsx` cho Category List trong `frontend/src/components/ui/SearchInput.jsx`
- [ ] T015 Frontend: Cập nhật `CategoryListPage.jsx` — thêm SearchInput vào UI trong `frontend/src/components/pages/CategoryListPage.jsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 — có thể chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên T001 + T002 (service logic)
- **User Story 2 (Phase 3)**: Depends trên T001 + T002 (service logic — implementation chung với US1)
- **User Story 3 (Phase 4)**: Depends trên Phase 1-2
- **Edge Cases (Phase 5)**: Depends trên Phase 1-4

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T004, T005 | Tests search by name — viết song song |
| T007, T008 | Tests search by description — viết song song |
| T011-T013 | Edge case tests — chạy song song |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001) → Zod schema ready
2. **Phase 2**: US1 (T002-T006) → Search by name **MVP!**
3. **Phase 3**: US2 (T007-T008) → Search by description
4. **Phase 4**: US3 (T009-T010) → Search + type filter
5. **Phase 5**: Edge cases + Frontend (T011-T015)
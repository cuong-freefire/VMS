# Tasks: Add Category (UC32)

**Input**: Design documents từ `.sdd/DucNM/UC32-feat-add-category/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2, US3)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Kế thừa infrastructure từ UC31 (Category model, repository pattern)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Cập nhật Prisma schema và tạo Zod validation

- [x] T001 Composite unique `@@unique([name, categoryType])` đã có sẵn trong Prisma schema
- [x] T002 Không cần chạy migration — constraint đã tồn tại
- [x] T003 [P] Tạo `createCategorySchema` (Zod) trong `backend/src/validators/category.validator.js` — name (min 1), description (optional), type (enum: location, event_type, time_frame)

---

## Phase 2: User Story 1 - Manager thêm category thành công (Priority: P1) 🎯 MVP

**Goal**: Manager/Admin gọi `POST /api/v1/categories` với dữ liệu hợp lệ và nhận HTTP 201 cùng thông tin category mới.

**Independent Test**: Gọi `POST /api/v1/categories` với body hợp lệ và token Manager, kiểm tra response 201 + category data.

### Tests cho User Story 1 ⚠️

- [ ] T004 [P] [US1] Unit test cho `category.service.js` — `createCategory` với dữ liệu hợp lệ → trả về category mới trong `backend/tests/category/category.service.test.js`
- [ ] T005 [P] [US1] Unit test cho `category.service.js` — `createCategory` với tên đã tồn tại trong cùng type → throw ServiceError 409 `CATEGORY_EXISTS`
- [ ] T006 [P] [US1] Unit test cho `category.service.js` — `createCategory` với tên tồn tại ở type khác → thành công (không conflict)
- [ ] T007 [P] [US1] Integration test cho `POST /api/v1/categories` — happy path với Manager token → HTTP 201 trong `backend/tests/category/category.api.test.js`
- [ ] T008 [US1] Integration test cho `POST /api/v1/categories` — happy path với Admin token → HTTP 201

### Implementation cho User Story 1

- [x] T009 [US1] Implement `findByNameAndType` trong `backend/src/repositories/category.repository.js` — dùng Prisma `findFirst` với where { name, categoryType }
- [x] T010 [US1] Implement `createCategory` trong `backend/src/repositories/category.repository.js` — dùng Prisma `create`
- [x] T011 [US1] Implement `createCategoryService` trong `backend/src/services/category.service.js` — type mapping → unique check → create → format
- [x] T012 [US1] Implement `createCategoryHandler` trong `backend/src/controllers/category.controller.js` — gọi service + trả về 201
- [x] T013 [US1] Thêm route `POST /` trong `backend/src/routes/category.routes.js` — middleware chain: authMiddleware → authorize('MANAGER', 'ADMIN') → validate(createCategorySchema) → createCategoryHandler
- [x] T014 [US1] Thêm Swagger JSDoc cho endpoint `POST /api/v1/categories` trong `backend/src/routes/category.routes.js`

**Checkpoint**: User Story 1 hoàn thành — Manager/Admin tạo được category mới.

---

## Phase 3: User Story 2 - Validate dữ liệu đầu vào (Priority: P1)

**Goal**: Hệ thống kiểm tra tính hợp lệ — type phải thuộc enum, name không empty.

**Independent Test**: Gọi `POST /api/v1/categories` với type sai format → 400. Gọi với name empty → 400.

### Tests cho User Story 2 ⚠️

- [ ] T015 [P] [US2] Unit test cho `category.service.js` — `createCategory` với type không hợp lệ → throw ServiceError 400 `VALIDATION_ERROR` trong `backend/tests/category/category.service.test.js`
- [ ] T016 [P] [US2] Unit test cho `category.service.js` — `createCategory` với name empty → throw ServiceError 400 `VALIDATION_ERROR`
- [ ] T017 [P] [US2] Integration test cho `POST /api/v1/categories` — type sai → HTTP 400 trong `backend/tests/category/category.api.test.js`
- [ ] T018 [US2] Integration test cho `POST /api/v1/categories` — name empty → HTTP 400

### Implementation cho User Story 2

- [x] T019 [US2] Zod schema `createCategorySchema` đã implement ở T003 — validation tự động từ Zod safeParse
- [ ] T020 [US2] Frontend: Validation đồng bộ (SKIP: frontend tasks)

**Checkpoint**: User Story 2 hoàn thành — Validation hoạt động cả FE và BE.

---

## Phase 4: User Story 3 - Chặn truy cập với người dùng không có quyền (Priority: P1)

**Goal**: Staff/Volunteer nhận 403, Guest nhận 401 khi gọi `POST /api/v1/categories`.

**Independent Test**: Gọi `POST /api/v1/categories` với token Staff → 403. Không token → 401.

### Tests cho User Story 3 ⚠️

- [ ] T021 [P] [US3] Integration test — Staff token → HTTP 403 trong `backend/tests/category/category.api.test.js`
- [ ] T022 [P] [US3] Integration test — Volunteer token → HTTP 403
- [ ] T023 [P] [US3] Integration test — không token → HTTP 401
- [ ] T024 [US3] Integration test — token hết hạn → HTTP 401

### Implementation cho User Story 3

- [x] T025 [US3] Middleware chain đã implement ở T013 — `authorize('MANAGER', 'ADMIN')` xử lý 403, `authMiddleware` xử lý 401. **(Verify: authorize middleware từ UC26 đã đủ)**

**Checkpoint**: User Story 3 hoàn thành — endpoint được bảo vệ đúng phân quyền.

---

## Phase 5: Frontend

**Purpose**: Xây dựng giao diện Add Category form

- [ ] T026 [P] Thêm `createCategory(data)` trong `frontend/src/api/categoryApi.js`
- [ ] T027 [P] Implement React hook `useCreateCategory` trong `frontend/src/hooks/useCreateCategory.js` — loading, error, success states
- [ ] T028 Implement `AddCategoryPage.jsx` với React Hook Form + Zod resolver trong `frontend/src/components/pages/AddCategoryPage.jsx`
- [ ] T029 Thêm route `/categories/add` trong `frontend/src/App.js`

---

## Phase 6: Edge Cases & Tests

**Purpose**: Xử lý các edge case và hoàn thiện test coverage

- [ ] T030 [P] Unit test — database không phản hồi → throw error (catch ở controller → 500)
- [ ] T031 [P] Integration test — `POST /api/v1/categories` với request body rỗng → HTTP 400
- [ ] T032 Integration test — tạo category với tên trùng ở type khác → HTTP 201 (không conflict)
- [ ] T033 Frontend test — AddCategoryPage render form correctly trong `frontend/tests/AddCategoryPage.test.jsx`
- [ ] T034 Frontend test — AddCategoryPage hiển thị validation errors
- [ ] T035 Frontend test — AddCategoryPage hiển thị success message sau khi tạo thành công

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T003 — chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên Phase 1 + UC31 infrastructure
- **User Story 2 (Phase 3)**: Depends trên T003 (Zod schema) + T011 (service validation)
- **User Story 3 (Phase 4)**: Depends trên T013 (middleware chain)
- **Frontend (Phase 5)**: Depends trên API hoàn thành
- **Edge Cases (Phase 6)**: Depends trên Phase 2-4

### User Story Dependencies

- **US1 (P1)**: MVP — bắt đầu ngay sau Setup
- **US2 (P1)**: Validation trong service — implement cùng US1
- **US3 (P1)**: Middleware chain — implement cùng T013
- **Frontend**: Sau khi API hoàn thành

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T004, T005, T006 | Tests US1 — viết song song |
| T009, T010 | Repository methods — khác functions |
| T026, T027 | Frontend API + Hook — song song |
| T021-T024 | Tests US3 — chạy song song |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001-T003) → Prisma unique constraint + Zod schema ready
2. **Phase 2+3**: US1+US2 (T004-T020) → **MVP!** Manager tạo được category + validation
3. **Phase 4**: US3 (T021-T025) → Phân quyền
4. **Phase 5**: Frontend (T026-T029) → AddCategory UI
5. **Phase 6**: Edge cases + tests
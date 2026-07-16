# Tasks: Edit Category (UC33)

**Input**: Design documents từ `.sdd/DucNM/UC33-feat-edit-category/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2, US3)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Kế thừa infrastructure từ UC31 (Category model) và UC32 (validator patterns, composite unique constraint)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Mở rộng infrastructure đã có từ UC31/UC32 cho UC33

- [x] T001 Thêm `updateCategorySchema` (Zod) trong `backend/src/validators/category.validator.js` — fields optional: name, description, is_active. `.refine()` kiểm tra body không rỗng. Type KHÔNG được phép trong schema.

---

## Phase 2: User Story 1 - Manager chỉnh sửa category thành công (Priority: P1) 🎯 MVP

**Goal**: Manager/Admin gọi `PATCH /api/v1/categories/:id` với dữ liệu hợp lệ và nhận HTTP 200 cùng thông tin đã cập nhật.

**Independent Test**: Tạo category trong database, gọi `PATCH /api/v1/categories/1` với body hợp lệ và token Manager, kiểm tra response 200 + data đã cập nhật.

### Tests cho User Story 1 ⚠️

- [ ] T002 [P] [US1] Unit test cho `category.service.js` — `updateCategory` với dữ liệu hợp lệ → trả về category đã cập nhật trong `backend/tests/category/category.service.test.js`
- [ ] T003 [P] [US1] Unit test cho `category.service.js` — `updateCategory` với ID không tồn tại → throw ServiceError 404 `CATEGORY_NOT_FOUND`
- [ ] T004 [P] [US1] Unit test cho `category.service.js` — `updateCategory` chỉ update `is_active` → thành công
- [ ] T005 [P] [US1] Unit test cho `category.service.js` — `updateCategory` với tên trùng ở type khác → thành công (không conflict)
- [ ] T006 [P] [US1] Integration test cho `PATCH /api/v1/categories/:id` — happy path với Manager token → HTTP 200 trong `backend/tests/category/category.api.test.js`
- [ ] T007 [US1] Integration test cho `PATCH /api/v1/categories/:id` — happy path với Admin token → HTTP 200

### Implementation cho User Story 1

- [x] T008 [US1] Implement `findById` trong `backend/src/repositories/category.repository.js` — dùng Prisma `findUnique`
- [x] T009 [US1] Mở rộng `findByNameAndType` với excludeId param trong `backend/src/repositories/category.repository.js` — dùng Prisma `findFirst` với `NOT`
- [x] T010 [US1] Implement `updateCategory` trong `backend/src/repositories/category.repository.js` — dùng Prisma `update`
- [x] T011 [US1] Implement `updateCategoryService` trong `backend/src/services/category.service.js` — check exists → check unique name → update → return
- [x] T012 [US1] Implement `updateCategoryHandler` trong `backend/src/controllers/category.controller.js` — gọi service + trả về 200
- [x] T013 [US1] Thêm route `PATCH /:id` trong `backend/src/routes/category.routes.js` — middleware chain: authMiddleware → authorize('MANAGER', 'ADMIN') → validate(updateCategorySchema) → updateCategoryHandler
- [x] T014 [US1] Thêm Swagger JSDoc cho endpoint `PATCH /api/v1/categories/:id` trong `backend/src/routes/category.routes.js`

**Checkpoint**: User Story 1 hoàn thành — Manager/Admin chỉnh sửa category thành công.

---

## Phase 3: User Story 2 - Validate dữ liệu (Priority: P2)

**Goal**: Hệ thống kiểm tra tên unique trong cùng type khi đổi tên — trả về 409 nếu trùng.

**Independent Test**: Gọi `PATCH /api/v1/categories/1` với tên đã tồn tại trong cùng type → 409.

### Tests cho User Story 2 ⚠️

- [ ] T015 [P] [US2] Unit test cho `category.service.js` — `updateCategory` với tên trùng trong cùng type → throw ServiceError 409 `CATEGORY_EXISTS` trong `backend/tests/category/category.service.test.js`
- [ ] T016 [P] [US2] Integration test cho `PATCH /api/v1/categories/:id` — tên trùng trong cùng type → HTTP 409 trong `backend/tests/category/category.api.test.js`
- [ ] T017 [US2] Integration test cho `PATCH /api/v1/categories/:id` — body rỗng → HTTP 400

### Implementation cho User Story 2

- [x] T018 [US2] Zod schema `updateCategorySchema` đã implement ở T001 với `.refine()` kiểm tra body không rỗng
- [x] T019 [US2] Unique name check đã implement ở T011 — kiểm tra `name !== existing.name` và `findByNameAndType` với `excludeId`

**Checkpoint**: User Story 2 hoàn thành — Validation hoạt động.

---

## Phase 4: User Story 3 - Chặn truy cập với người dùng không có quyền (Priority: P1)

**Goal**: Staff/Volunteer nhận 403, Guest nhận 401 khi gọi `PATCH /api/v1/categories/:id`.

**Independent Test**: Gọi `PATCH /api/v1/categories/1` với token Staff → 403. Không token → 401.

### Tests cho User Story 3 ⚠️

- [ ] T020 [P] [US3] Integration test — Staff token → HTTP 403 trong `backend/tests/category/category.api.test.js`
- [ ] T021 [P] [US3] Integration test — Volunteer token → HTTP 403
- [ ] T022 [P] [US3] Integration test — không token → HTTP 401
- [ ] T023 [US3] Integration test — token hết hạn → HTTP 401

### Implementation cho User Story 3

- [x] T024 [US3] Middleware chain đã implement ở T013 — `authorize('MANAGER', 'ADMIN')` xử lý 403, `authMiddleware` xử lý 401. **(Verify: authorize middleware từ UC26 đã đủ)**

**Checkpoint**: User Story 3 hoàn thành — endpoint được bảo vệ đúng phân quyền.

---

## Phase 5: Frontend

**Purpose**: Xây dựng giao diện Edit Category form

- [ ] T025 [P] Thêm `updateCategory(id, data)` trong `frontend/src/api/categoryApi.js`
- [ ] T026 [P] Implement React hook `useUpdateCategory` trong `frontend/src/hooks/useUpdateCategory.js` — loading, error, success states
- [ ] T027 Implement `EditCategoryPage.jsx` trong `frontend/src/components/pages/EditCategoryPage.jsx` — fetch category → pre-fill form → type field disabled (read-only) → PATCH submit
- [ ] T028 Thêm route `/categories/:id/edit` trong `frontend/src/App.js`

---

## Phase 6: Edge Cases & Tests

**Purpose**: Xử lý các edge case và hoàn thiện test coverage

- [ ] T029 [P] Unit test — database không phản hồi → throw error (catch ở controller → 500)
- [ ] T030 [P] Integration test — `PATCH /api/v1/categories/abc` (ID không hợp lệ) → HTTP 400
- [ ] T031 [P] Integration test — tạo category với tên trùng nhưng khác type → HTTP 200 (không conflict)
- [ ] T032 Frontend test — EditCategoryPage render loading state trong `frontend/tests/EditCategoryPage.test.jsx`
- [ ] T033 Frontend test — EditCategoryPage render form với pre-filled data
- [ ] T034 Frontend test — EditCategoryPage hiển thị validation errors
- [ ] T035 Frontend test — EditCategoryPage hiển thị success message sau khi update

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 — có thể chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên T001 + infrastructure UC31/UC32
- **User Story 2 (Phase 3)**: Depends trên T001 (Zod schema) + T011 (service unique check)
- **User Story 3 (Phase 4)**: Depends trên T013 (middleware chain)
- **Frontend (Phase 5)**: Depends trên API hoàn thành
- **Edge Cases (Phase 6)**: Depends trên Phase 2-4

### User Story Dependencies

- **US1 (P1)**: MVP — bắt đầu ngay sau Setup
- **US2 (P2)**: Validation trong service — implement cùng US1
- **US3 (P1)**: Middleware chain — implement cùng T013
- **Frontend**: Sau khi API hoàn thành

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T002, T003, T004 | Tests US1 — viết song song |
| T008, T009, T010 | Repository methods — khác functions |
| T025, T026 | Frontend API + Hook — song song |
| T020-T023 | Tests US3 — chạy song song |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001) → Zod schema ready
2. **Phase 2+3**: US1+US2 (T002-T019) → **MVP!** Manager edit được category + unique name validation
3. **Phase 4**: US3 (T020-T024) → Phân quyền
4. **Phase 5**: Frontend (T025-T028) → EditCategory UI
5. **Phase 6**: Edge cases + tests
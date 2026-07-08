# Tasks: View Category List (UC31)

**Input**: Design documents từ `.sdd/DucNM/UC31-feat-view-category-list/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2, US3)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- **New module**: Category Management — tạo mới toàn bộ stack (không kế thừa từ User Management)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Thiết lập database model và infrastructure dùng chung

- [ ] T001 Thêm Category model vào Prisma schema trong `backend/prisma/schema.prisma` — fields: category_id, name, description (optional), type, is_active (default true), created_at, updated_at
- [ ] T002 Chạy Prisma migration: `npx prisma migrate dev --name add_category_model`
- [ ] T003 [P] Tạo `optionalAuth` middleware trong `backend/src/middleware/optionalAuth.middleware.js` — giống authMiddleware nhưng không trả về 401, chỉ set req.user = null nếu không có token
- [ ] T004 [P] Tạo category repository trong `backend/src/repositories/category.repository.js` — hàm `findAllCategories(where)`
- [ ] T005 Tạo category validator trong `backend/src/validators/category.validator.js` — (optional, có thể bỏ qua vì GET không cần params)

---

## Phase 2: User Story 1 - Manager xem toàn bộ danh sách danh mục (Priority: P1) 🎯 MVP

**Goal**: Manager/Admin gọi `GET /api/v1/categories` và thấy tất cả categories (active + inactive).

**Independent Test**: Tạo 5 categories (4 active + 1 inactive), gọi `GET /api/v1/categories` với token Manager, kiểm tra response có đủ 5 categories.

### Tests cho User Story 1 ⚠️

- [ ] T006 [P] [US1] Unit test cho `category.service.js` — getCategories với role MANAGER → trả về tất cả categories (active + inactive) trong `backend/tests/category/category.service.test.js`
- [ ] T007 [P] [US1] Unit test cho `category.service.js` — getCategories với role ADMIN → trả về tất cả categories
- [ ] T008 [P] [US1] Integration test cho `GET /api/v1/categories` — token Manager → HTTP 200 + all categories trong `backend/tests/category/category.api.test.js`
- [ ] T009 [US1] Integration test cho `GET /api/v1/categories` — token Admin → HTTP 200 + all categories

### Implementation cho User Story 1

- [ ] T010 [US1] Implement `category.service.js` — hàm `getCategories(currentUser)` với role-based visibility trong `backend/src/services/category.service.js`
- [ ] T011 [US1] Implement `category.controller.js` — handler `getCategoriesHandler` trong `backend/src/controllers/category.controller.js`
- [ ] T012 [US1] Tạo `category.routes.js` — route `GET /` với optionalAuth middleware trong `backend/src/routes/category.routes.js`
- [ ] T013 [US1] Cập nhật `backend/src/app.js` — mount `categoryRoutes` tại prefix `/api/v1/categories`
- [ ] T014 [US1] Thêm Swagger JSDoc cho endpoint `GET /api/v1/categories` trong `backend/src/routes/category.routes.js`

**Checkpoint**: User Story 1 hoàn thành — Manager/Admin xem được tất cả categories.

---

## Phase 3: User Story 2 - Staff xem danh sách category active (Priority: P1)

**Goal**: Staff gọi `GET /api/v1/categories` và chỉ thấy categories active.

**Independent Test**: Gọi `GET /api/v1/categories` với token Staff, kiểm tra response chỉ chứa category có is_active = true.

### Tests cho User Story 2 ⚠️

- [ ] T015 [P] [US2] Unit test cho `category.service.js` — getCategories với role STAFF → chỉ active categories trong `backend/tests/category/category.service.test.js`
- [ ] T016 [P] [US2] Integration test cho `GET /api/v1/categories` — token Staff → HTTP 200 + only active trong `backend/tests/category/category.api.test.js`

### Implementation cho User Story 2

- [ ] T017 [US2] Role-based visibility logic đã implement ở T010 — Staff tự động chỉ thấy active (role !== 'MANAGER' && role !== 'ADMIN')

**Checkpoint**: User Story 2 hoàn thành — Staff xem được categories active.

---

## Phase 4: User Story 3 - Guest và Volunteer xem danh sách category active (Priority: P1)

**Goal**: Guest (không token) và Volunteer gọi `GET /api/v1/categories` và chỉ thấy categories active. Phục vụ UC11 (Filter Event — NamLD).

**Independent Test**: Gọi `GET /api/v1/categories` không token (Guest) → 200 + only active. Gọi với token Volunteer → 200 + only active.

### Tests cho User Story 3 ⚠️

- [ ] T018 [P] [US3] Unit test cho `category.service.js` — getCategories với user = null (Guest) → chỉ active categories trong `backend/tests/category/category.service.test.js`
- [ ] T019 [P] [US3] Unit test cho `category.service.js` — getCategories với role VOLUNTEER → chỉ active categories
- [ ] T020 [P] [US3] Integration test cho `GET /api/v1/categories` — không token (Guest) → HTTP 200 + only active trong `backend/tests/category/category.api.test.js`
- [ ] T021 [US3] Integration test cho `GET /api/v1/categories` — token Volunteer → HTTP 200 + only active

### Implementation cho User Story 3

- [ ] T022 [US3] Optional auth middleware đã implement ở T003 — Guest không token vẫn vào được controller
- [ ] T023 [US3] Role-based visibility logic đã implement ở T010 — Guest (req.user = null) và Volunteer tự động chỉ thấy active

**Checkpoint**: User Story 3 hoàn thành — Guest và Volunteer xem được categories active (phục vụ UC11).

---

## Phase 5: Frontend

**Purpose**: Xây dựng giao diện Category List cho Manager/Admin

- [ ] T024 [P] Implement frontend API client trong `frontend/src/api/categoryApi.js` — hàm `getCategories()`
- [ ] T025 [P] Implement React hook `useCategories` trong `frontend/src/hooks/useCategories.js` — fetch categories, loading, error states
- [ ] T026 Implement `CategoryListPage.jsx` với MUI Table trong `frontend/src/components/pages/CategoryListPage.jsx`
- [ ] T027 Thêm route `/categories` trong `frontend/src/App.js`

---

## Phase 6: Edge Cases & Empty State

**Purpose**: Xử lý các edge case

- [ ] T028 [P] Unit test — getCategories khi không có category nào → mảng rỗng trong `backend/tests/category/category.service.test.js`
- [ ] T029 [P] Integration test — database không phản hồi → HTTP 500 trong `backend/tests/category/category.api.test.js`
- [ ] T030 Frontend test — CategoryListPage render empty state trong `frontend/tests/CategoryListPage.test.jsx`
- [ ] T031 Frontend test — CategoryListPage render loading state
- [ ] T032 Frontend test — CategoryListPage render error state

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T005 — có thể chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên Phase 1
- **User Story 2 (Phase 3)**: Depends trên T010 (service logic) — cùng code với US1
- **User Story 3 (Phase 4)**: Depends trên T003 (optionalAuth) + T010 (service logic)
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
| T003, T004 | Middleware + Repository — khác files |
| T006, T007 | Tests US1 — viết song song |
| T010, T011, T012 | Service + Controller + Routes — sequential |
| T024, T025 | Frontend API + Hook — song song |
| US1 (T006-T014) + US3 (T018-T023) | Song song — cùng service logic |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001-T005) → Prisma + middleware + repository ready
2. **Phase 2+3+4**: US1+US2+US3 (T006-T023) → **MVP!** Tất cả roles đều xem được categories với role-based visibility
3. **Phase 5**: Frontend (T024-T027) → Category List UI
4. **Phase 6**: Edge cases + tests
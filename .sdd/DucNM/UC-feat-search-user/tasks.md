# Tasks: Search User

**Input**: Design documents từ `.sdd/DucNM/UC-feat-search-user/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2, US3)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- Search User là extension của UC26 — tất cả thay đổi đều trên files đã có
- **Backend**: mở rộng `user.validator.js`, `user.service.js`, `user.routes.js`
- **Frontend**: mở rộng `useUsers.js`, `UserListPage.jsx`, thêm component `SearchInput.jsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Mở rộng Zod schema để hỗ trợ search param mới

- [ ] T001 Mở rộng `getUsersQuerySchema` trong `backend/src/validators/user.validator.js` — thêm `search` (z.string().trim().optional())

---

## Phase 2: User Story 1 - Admin tìm kiếm người dùng theo tên (Priority: P1)

**Goal**: Admin tìm kiếm users theo `full_name` — không phân biệt hoa/thường, partial match.

**Independent Test**: Gọi `GET /api/v1/users?search=Nguyen` với token Admin, kiểm tra response chứa user có tên chứa "Nguyen".

### Implementation cho User Story 1

- [ ] T002 [US1] Mở rộng Prisma `where` clause trong `user.service.js` — thêm search condition với `contains` + `mode: 'insensitive'` trên `full_name` và `email` (OR logic) trong `backend/src/services/user.service.js`
- [ ] T003 [US1] Cập nhật Swagger JSDoc cho `GET /api/v1/users` trong `backend/src/routes/user.routes.js` — thêm `search` param

### Tests cho User Story 1 ⚠️

- [ ] T004 [P] [US1] Unit test cho `user.service.js` — getUsers với `search="nguyen"` trả về users có tên chứa "nguyen" (case-insensitive) trong `backend/tests/user/user.service.test.js`
- [ ] T005 [P] [US1] Unit test cho `user.service.js` — getUsers với `search="NGUYEN"` trả về "Nguyễn" (case-insensitive)
- [ ] T006 [P] [US1] Unit test cho `user.service.js` — getUsers với `search="ngu"` trả về "Nguyễn" (partial match)
- [ ] T007 [US1] Integration test cho `GET /api/v1/users?search=nguyen` → HTTP 200 + results trong `backend/tests/user/user.api.test.js`

**Checkpoint**: User Story 1 hoàn thành — Search by name hoạt động.

---

## Phase 3: User Story 2 - Admin tìm kiếm người dùng theo email (Priority: P1)

**Goal**: Admin tìm kiếm users theo `email` — partial match, case-insensitive.

**Independent Test**: Gọi `GET /api/v1/users?search=john%40example.com` với token Admin, kiểm tra response chứa user có email đó.

### Tests cho User Story 2

- [ ] T008 [P] [US2] Unit test cho `user.service.js` — getUsers với `search="example"` trả về users có email chứa "example" trong `backend/tests/user/user.service.test.js`
- [ ] T009 [US2] Integration test cho `GET /api/v1/users?search=@example` → HTTP 200 + users có email chứa "@example" trong `backend/tests/user/user.api.test.js`

**Checkpoint**: User Story 2 hoàn thành — Search by email hoạt động.

---

## Phase 4: User Story 3 - Kết hợp search với filter (Priority: P2)

**Goal**: Admin kết hợp search với role filter — AND logic.

**Independent Test**: Gọi `GET /api/v1/users?search=Nguyen&role=staff` với token Admin, kiểm tra response chính xác.

### Tests cho User Story 3 ⚠️

- [ ] T010 [P] [US3] Unit test cho `user.service.js` — getUsers với kết hợp `search="nguyen"` + `role="staff"` → AND logic trong `backend/tests/user/user.service.test.js`
- [ ] T011 [US3] Integration test cho `GET /api/v1/users?search=nguyen&role=staff` → HTTP 200 + AND result trong `backend/tests/user/user.api.test.js`

**Checkpoint**: User Story 3 hoàn thành — Search + filter kết hợp hoạt động.

---

## Phase 5: Edge Cases & Frontend

**Purpose**: Xử lý edge cases và Frontend SearchInput component

### Tests ⚠️

- [ ] T012 [P] Unit test — getUsers với `search=""` hoặc `undefined` → bỏ qua search, trả về tất cả trong `backend/tests/user/user.service.test.js`
- [ ] T013 [P] Unit test — getUsers với `search` không match user nào → empty array
- [ ] T014 [P] Integration test — `GET /api/v1/users?search=notfound` → HTTP 200 + empty array trong `backend/tests/user/user.api.test.js`
- [ ] T015 [P] Integration test — `GET /api/v1/users?search=nguyen&role=invalid` → HTTP 400

### Implementation

- [ ] T016 Frontend: Implement `SearchInput.jsx` với debounce 300ms và SearchIcon trong `frontend/src/components/ui/SearchInput.jsx`
- [ ] T017 Frontend: Mở rộng `useUsers` hook — thêm state `search` và debounce handler trong `frontend/src/hooks/useUsers.js`
- [ ] T018 Frontend: Cập nhật `UserListPage.jsx` — thêm SearchInput vào UI trong `frontend/src/components/pages/UserListPage.jsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 — có thể chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên T001 + T002 (service logic)
- **User Story 2 (Phase 3)**: Depends trên T001 + T002 (service logic — implementation giống US1)
- **User Story 3 (Phase 4)**: Depends trên Phase 1-3
- **Edge Cases (Phase 5)**: Depends trên Phase 1-4

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T004, T005 | Tests search by name — viết song song |
| T008, T009 | Tests search by email — viết song song |
| T012-T015 | Edge case tests — chạy song song |
| T016, T017 | Frontend — song song (khác files) |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001) → Zod schema ready
2. **Phase 2**: US1 (T002-T007) → Search by name **MVP!**
3. **Phase 3**: US2 (T008-T009) → Search by email
4. **Phase 4**: US3 (T010-T011) → Search + filter
5. **Phase 5**: Edge cases + Frontend SearchInput (T012-T018)
# Tasks: View User List (UC26)

**Input**: Design documents từ `.sdd/DucNM/UC26-feat-view-user-list/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2, US3)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths điều chỉnh theo plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Thiết lập cấu trúc dự án và infrastructure dùng chung cho tất cả user stories

- [ ] T001 Tạo Prisma schema User và Role models trong `backend/prisma/schema.prisma`
- [ ] T002 [P] Tạo authorize middleware trong `backend/src/middleware/authorize.middleware.js`
- [ ] T003 [P] Tạo pagination utility trong `backend/src/utils/pagination.util.js`
- [ ] T004 Tạo Zod validator trong `backend/src/validators/user.validator.js`
- [ ] T005 [P] Tạo user repository trong `backend/src/repositories/user.repository.js`
- [ ] T006 Cập nhật `backend/src/routes/user.routes.js` — mount route GET /users với auth + authorize middleware

---

## Phase 2: User Story 1 - Admin xem toàn bộ danh sách người dùng (Priority: P1) 🎯 MVP

**Goal**: Admin có thể gọi `GET /api/v1/users` và nhận danh sách tất cả người dùng (active + inactive) với phân trang.

**Independent Test**: Tạo ít nhất 3 user (cả active + inactive) trong database, gọi `GET /api/v1/users?page=1&limit=20` với token Admin, kiểm tra response trả về đầy đủ thông tin users + pagination metadata.

### Tests cho User Story 1 ⚠️

- [ ] T007 [P] [US1] Unit test cho `user.service.js` — getUsers với valid params trả về danh sách phân trang trong `backend/tests/user/user.service.test.js`
- [ ] T008 [P] [US1] Unit test cho `user.service.js` — getUsers trả về cả active và inactive users
- [ ] T009 [P] [US1] Integration test cho `GET /api/v1/users` — happy path với Admin token trong `backend/tests/user/user.api.test.js`
- [ ] T010 [US1] Integration test cho `GET /api/v1/users` — danh sách rỗng khi không có user

### Implementation cho User Story 1

- [ ] T011 [US1] Implement `user.service.js` — hàm `getUsers(query)` với pagination (skip/take) trong `backend/src/services/user.service.js`
- [ ] T012 [US1] Implement `user.controller.js` — handler `getUsersHandler` gọi service và trả về response theo chuẩn ADR-006 trong `backend/src/controllers/user.controller.js`
- [ ] T013 [US1] Cập nhật `backend/src/app.js` — mount `userRoutes` tại prefix `/api/v1/users`
- [ ] T014 [US1] Implement frontend API client trong `frontend/src/api/userApi.js` — hàm `getUsers(params)`
- [ ] T015 [US1] Implement React hook `useUsers` trong `frontend/src/hooks/useUsers.js` với state management cho pagination
- [ ] T016 [US1] Implement `UserListPage.jsx` với MUI DataGrid hiển thị danh sách users trong `frontend/src/components/pages/UserListPage.jsx`
- [ ] T017 [US1] Thêm Swagger JSDoc cho endpoint GET /api/v1/users trong `backend/src/routes/user.routes.js`

**Checkpoint**: User Story 1 hoàn thành — Admin có thể xem danh sách users với phân trang.

---

## Phase 3: User Story 2 - Admin xem danh sách theo role (Priority: P2)

**Goal**: Admin có thể lọc danh sách người dùng theo role cụ thể (volunteer, staff, manager, admin).

**Independent Test**: Gọi `GET /api/v1/users?role=volunteer` với token Admin, kiểm tra response chỉ chứa user có role Volunteer.

### Tests cho User Story 2 ⚠️

- [ ] T018 [P] [US2] Unit test cho `user.service.js` — getUsers với `role=volunteer` chỉ trả về volunteers
- [ ] T019 [P] [US2] Integration test cho `GET /api/v1/users?role=volunteer` — lọc theo role hợp lệ
- [ ] T020 [US2] Integration test cho `GET /api/v1/users?role=invalidrole` — trả về 400 INVALID_ROLE

### Implementation cho User Story 2

- [ ] T021 [P] [US2] Mở rộng `user.service.js` — thêm role filter vào Prisma `where` clause trong `backend/src/services/user.service.js`
- [ ] T022 [US2] Thêm validation cho role param trong `user.validator.js` — sử dụng Zod enum trong `backend/src/validators/user.validator.js`
- [ ] T023 [US2] Thêm role filter UI: `RoleFilter.jsx` component với Select dropdown trong `frontend/src/components/ui/RoleFilter.jsx`
- [ ] T024 [US2] Mở rộng `useUsers` hook — thêm state `role` và handler `handleRoleFilter` trong `frontend/src/hooks/useUsers.js`

**Checkpoint**: User Story 2 hoàn thành — Admin có thể lọc danh sách users theo role.

---

## Phase 4: User Story 3 - Chặn truy cập với người dùng không có quyền (Priority: P1)

**Goal**: Staff, Manager, Volunteer nhận 403 Forbidden; Guest nhận 401 Unauthorized khi truy cập `GET /api/v1/users`.

**Independent Test**: Gọi `GET /api/v1/users` với token Staff/Manager/Volunteer → 403. Gọi không token → 401.

### Tests cho User Story 3 ⚠️

- [ ] T025 [P] [US3] Integration test cho `GET /api/v1/users` — Staff token → HTTP 403
- [ ] T026 [P] [US3] Integration test cho `GET /api/v1/users` — Manager token → HTTP 403
- [ ] T027 [P] [US3] Integration test cho `GET /api/v1/users` — Volunteer token → HTTP 403
- [ ] T028 [US3] Integration test cho `GET /api/v1/users` — không token → HTTP 401
- [ ] T029 [US3] Integration test cho `GET /api/v1/users` — token hết hạn → HTTP 401

### Implementation cho User Story 3

- [ ] T030 [US3] Implement `authorize.middleware.js` — kiểm tra `req.user.role` có nằm trong allowedRoles không trong `backend/src/middleware/authorize.middleware.js`
- [ ] T031 [US3] Middleware chain: `authMiddleware` → `authorize('ADMIN')` → getUsersHandler trong `backend/src/routes/user.routes.js`
- [ ] T032 [US3] Frontend: Xử lý 401/403 response trong `userApi.js` — redirect về login nếu 401 trong `frontend/src/api/userApi.js`

**Checkpoint**: User Story 3 hoàn thành — Phân quyền bảo vệ endpoint đúng theo spec.

---

## Phase 5: User Story 1b - Tìm kiếm và sắp xếp (Priority: P1)

**Goal**: Admin có thể tìm kiếm users theo tên/email (case-insensitive) và sắp xếp theo các trường.

**Independent Test**: Gọi `GET /api/v1/users?search=nguyen&sort=full_name:asc` → kết quả chứa users có tên/email chứa "nguyen" sắp xếp theo tên tăng dần.

### Tests cho User Story 1b ⚠️

- [ ] T033 [P] [US1b] Unit test cho `user.service.js` — getUsers với `search` filter trả về kết quả chính xác
- [ ] T034 [P] [US1b] Unit test cho `user.service.js` — getUsers với `sort` trả về đúng thứ tự
- [ ] T035 [US1b] Integration test cho `GET /api/v1/users?search=nguyen` — case-insensitive search

### Implementation cho User Story 1b

- [ ] T036 [P] [US1b] Mở rộng `user.service.js` — thêm search (contains + insensitive) vào Prisma where trong `backend/src/services/user.service.js`
- [ ] T037 [P] [US1b] Mở rộng `user.service.js` — thêm sort parsing (field:direction) trong `backend/src/services/user.service.js`
- [ ] T038 [US1b] Thêm validation cho search và sort params trong `user.validator.js` trong `backend/src/validators/user.validator.js`
- [ ] T039 [US1b] Thêm SearchBar component trong `frontend/src/components/ui/SearchBar.jsx`
- [ ] T040 [US1b] Mở rộng `useUsers` hook — thêm state `search`, `sort` và handlers trong `frontend/src/hooks/useUsers.js`
- [ ] T041 [US1b] Mở rộng `UserListPage.jsx` — tích hợp search bar, sorting UI trong `frontend/src/components/pages/UserListPage.jsx`

**Checkpoint**: User Story 1b hoàn thành — Admin có thể search và sort danh sách users.

---

## Phase 6: Tests & Edge Cases

**Purpose**: Xử lý các edge case và hoàn thiện test coverage

- [ ] T042 [P] Unit test — page = số âm → ServiceError 400 INVALID_PAGE trong `backend/tests/user/user.service.test.js`
- [ ] T043 [P] Unit test — limit > 100 → ServiceError 400 INVALID_LIMIT trong `backend/tests/user/user.service.test.js`
- [ ] T044 [P] Unit test — role không hợp lệ → ServiceError 400 INVALID_ROLE trong `backend/tests/user/user.service.test.js`
- [ ] T045 [P] Unit test — sort format sai → ServiceError 400 INVALID_SORT trong `backend/tests/user/user.service.test.js`
- [ ] T046 [P] Integration test — page = 0 → HTTP 400 trong `backend/tests/user/user.api.test.js`
- [ ] T047 [P] Integration test — limit = 999 → HTTP 400 trong `backend/tests/user/user.api.test.js`
- [ ] T048 [P] Integration test — database không phản hồi → HTTP 500 trong `backend/tests/user/user.api.test.js`
- [ ] T049 Frontend test — UserListPage render empty state trong `frontend/tests/UserListPage.test.jsx`
- [ ] T050 Frontend test — SearchBar trigger API call trong `frontend/tests/UserListPage.test.jsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Không dependencies — có thể bắt đầu ngay
- **User Story 1 (Phase 2)**: Depends trên Phase 1 hoàn thành
- **User Story 3 (Phase 4)**: Depends trên Phase 1 (cần authorize middleware)
- **User Story 1b (Phase 5)**: Depends trên Phase 2 (mở rộng service/controller đã có)
- **User Story 2 (Phase 3)**: Depends trên Phase 2 (mở rộng service/controller đã có)
- **Tests & Edge Cases (Phase 6)**: Depends trên tất cả phases trước

### User Story Dependencies

- **User Story 1 (P1)**: MVP — bắt đầu ngay sau Setup
- **User Story 3 (P1)**: Có thể chạy song song với US1 (khác files: middleware vs controller/service)
- **User Story 1b (P1)**: Mở rộng US1 — bắt đầu sau US1 hoặc song song nếu clear interface
- **User Story 2 (P2)**: Mở rộng US1 — bắt đầu sau US1

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T002, T003, T005 | Khác files, không dependencies — tạo song song |
| T007, T008 | Tests cho US1 — viết song song |
| T011, T012 | Service vs Controller — khác files |
| T014, T015, T016 | Frontend API, hook, component — sequential (phụ thuộc nhau) |
| T025-T029 | Tests cho US3 — chạy song song |
| US1 (T011-T017) + US3 (T030-T032) | Song song — backend + middleware khác files |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001-T006) → Foundation ready
2. **Phase 2**: User Story 1 (T007-T017) → **MVP!** Admin xem được danh sách users + phân trang
3. **Phase 4**: User Story 3 (T025-T032) → Bảo vệ endpoint, chạy song song với US1b
4. **Phase 5**: User Story 1b (T033-T041) → Search + Sort
5. **Phase 3**: User Story 2 (T018-T024) → Role filter
6. **Phase 6**: Edge cases + tests hoàn thiện
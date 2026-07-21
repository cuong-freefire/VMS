# Tasks: Filter User

**Input**: Design documents từ `.sdd/DucNM/UC-feat-filter-user/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2, US3)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- Filter User là extension của UC26 — tất cả thay đổi đều trên files đã có
- **Backend**: mở rộng `user.validator.js`, `user.service.js`, `user.routes.js`
- **Frontend**: mở rộng `useUsers.js`, `UserListPage.jsx`, thêm components mới

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Mở rộng Zod schema để hỗ trợ filter params mới: `is_active`, `from_date`, `to_date`

- [ ] T001 Mở rộng `getUsersQuerySchema` trong `backend/src/validators/user.validator.js` — thêm `is_active` (z.coerce.boolean), `from_date`, `to_date` (regex YYYY-MM-DD) + `.refine()` kiểm tra from_date <= to_date

---

## Phase 2: User Story 1 - Admin lọc người dùng theo role (Priority: P1)

**Goal**: Admin lọc danh sách users theo role. (Role filter đã có từ UC26 — verify hoạt động với params mới.)

**Independent Test**: Gọi `GET /api/v1/users?role=staff` với token Admin, kiểm tra response chỉ chứa user Staff.

### Implementation cho User Story 1

- [ ] T002 [US1] Verify role filter đã hoạt động từ UC26 — không cần thay đổi code. Chỉ thêm tests.

### Tests cho User Story 1 ⚠️

- [ ] T003 [P] [US1] Unit test cho `user.service.js` — getUsers với `role=staff` chỉ trả về staff trong `backend/tests/user/user.service.test.js`
- [ ] T004 [P] [US1] Integration test cho `GET /api/v1/users?role=volunteer` → HTTP 200 + chỉ volunteers trong `backend/tests/user/user.api.test.js`

**Checkpoint**: User Story 1 hoàn thành — Role filter hoạt động.

---

## Phase 3: User Story 2 - Admin lọc người dùng theo trạng thái (Priority: P1)

**Goal**: Admin lọc users theo `is_active` (active/inactive) qua query param mới.

**Independent Test**: Gọi `GET /api/v1/users?is_active=false` với token Admin, kiểm tra response chỉ chứa user inactive.

### Tests cho User Story 2 ⚠️

- [ ] T005 [P] [US2] Unit test cho `user.service.js` — getUsers với `is_active=true` chỉ trả về active users trong `backend/tests/user/user.service.test.js`
- [ ] T006 [P] [US2] Unit test cho `user.service.js` — getUsers với `is_active=false` chỉ trả về inactive users
- [ ] T007 [P] [US2] Integration test cho `GET /api/v1/users?is_active=true` → HTTP 200 + only active trong `backend/tests/user/user.api.test.js`
- [ ] T008 [US2] Integration test cho `GET /api/v1/users?is_active=false` → HTTP 200 + only inactive

### Implementation cho User Story 2

- [ ] T009 [US2] Mở rộng Prisma `where` clause trong `user.service.js` — thêm `is_active` filter vào `where.AND` array trong `backend/src/services/user.service.js`

**Checkpoint**: User Story 2 hoàn thành — is_active filter hoạt động.

---

## Phase 4: User Story 3 - Admin kết hợp nhiều tiêu chí lọc (Priority: P2)

**Goal**: Admin kết hợp nhiều filter cùng lúc (role + is_active + date range) — AND logic.

**Independent Test**: Gọi `GET /api/v1/users?role=staff&is_active=true&from_date=2026-01-01&to_date=2026-06-30` với token Admin, kiểm tra response chính xác.

### Tests cho User Story 3 ⚠️

- [ ] T010 [P] [US3] Unit test cho `user.service.js` — getUsers với kết hợp search + role + is_active + date range → AND logic trong `backend/tests/user/user.service.test.js`
- [ ] T011 [P] [US3] Integration test cho `GET /api/v1/users?role=staff&is_active=true` → HTTP 200 + AND result trong `backend/tests/user/user.api.test.js`
- [ ] T012 [US3] Integration test cho `GET /api/v1/users?from_date=2026-01-01&to_date=2026-06-30` → HTTP 200 + date range

### Implementation cho User Story 3

- [ ] T013 [US3] Mở rộng Prisma `where` clause trong `user.service.js` — thêm `from_date` (gte) và `to_date` (lte với end-of-day) vào `where.AND` trong `backend/src/services/user.service.js`
- [ ] T014 [US3] Cập nhật Swagger JSDoc cho `GET /api/v1/users` trong `backend/src/routes/user.routes.js` — thêm 3 params mới: is_active, from_date, to_date

**Checkpoint**: User Story 3 hoàn thành — Kết hợp multiple filters hoạt động.

---

## Phase 5: Date Validation & Edge Cases

**Purpose**: Xử lý validation cho date params và các edge case

### Tests ⚠️

- [ ] T015 [P] Unit test — getUsers với from_date > to_date → throw ServiceError 400 `INVALID_DATE_RANGE` trong `backend/tests/user/user.service.test.js`
- [ ] T016 [P] Unit test — getUsers với date format sai → throw ServiceError 400 `INVALID_DATE_FORMAT`
- [ ] T017 [P] Integration test — `GET /api/v1/users?from_date=2026-06-30&to_date=2026-01-01` → HTTP 400 trong `backend/tests/user/user.api.test.js`
- [ ] T018 [P] Integration test — `GET /api/v1/users?from_date=invalid` → HTTP 400
- [ ] T019 [P] Integration test — Filter không có kết quả → HTTP 200 + mảng rỗng
- [ ] T020 Integration test — `GET /api/v1/users?is_active=invalid` → HTTP 400

### Implementation

- [ ] T021 Date validation với Zod `.refine()` đã implement ở T001
- [ ] T022 Frontend: Implement `ActiveFilter.jsx` với MUI ToggleButtonGroup trong `frontend/src/components/ui/ActiveFilter.jsx`
- [ ] T023 Frontend: Implement `DateRangeFilter.jsx` với MUI date inputs trong `frontend/src/components/ui/DateRangeFilter.jsx`
- [ ] T024 Frontend: Mở rộng `useUsers` hook — thêm states `isActive`, `fromDate`, `toDate` và handlers trong `frontend/src/hooks/useUsers.js`
- [ ] T025 Frontend: Cập nhật `UserListPage.jsx` — thêm ActiveFilter và DateRangeFilter vào UI trong `frontend/src/components/pages/UserListPage.jsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 — có thể chạy đầu tiên
- **User Story 2 (Phase 3)**: Depends trên T001 (schema) + T009 (service logic)
- **User Story 3 (Phase 4)**: Depends trên T013 (date range trong service)
- **Edge Cases (Phase 5)**: Depends trên Phase 1-4

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T003, T004 | Tests US1 — viết song song |
| T005, T006 | Tests US2 — viết song song |
| T010, T011 | Tests US3 — viết song song |
| T015-T020 | Edge case tests — chạy song song |
| T022, T023 | Frontend components — song song (khác files) |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001) → Zod schema ready
2. **Phase 3**: US2 (T005-T009) → is_active filter **MVP!**
3. **Phase 4**: US3 (T010-T014) → Multi-filter + date range
4. **Phase 5**: Edge cases + Frontend filter UI (T015-T025)
# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.)

---

description: "Task list for UC021 - View Volunteer History"

# Tasks: Xem Lịch Sử Tình Nguyện (UC021)

**Input**: Design documents from `.sdd/CuongLH/UC021-feat-view-volunteer-history/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly required in the feature specification. However the project has a mandatory 80% service test coverage target (AGENTS.md §7). Test tasks below are included as recommended verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`
- **Project type**: Web Application (Option 2)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing infrastructure is ready for UC021 implementation

- [ ] T001 Xác minh Prisma schema relations (Application ↔ Event, Application ↔ Attendance, Event ↔ Organization, Certificate unique(userId, eventId)) đã sẵn sàng — tham chiếu `backend/prisma/schema.prisma`
- [ ] T002 Xác minh `req.user.user_id` trong JWT từ auth middleware (`backend/src/middlewares/auth.middleware.js`) hoạt động đúng — tham chiếu `research.md` mục 3
- [ ] T003 [P] Xác minh frontend route `/history` đã có trong `frontend/src/App.js` với ProtectedRoute + RoleRoute (VOLUNTEER only) — tham chiếu `research.md` mục 5
- [ ] T004 [P] Kiểm tra các UI component có sẵn: Card (`frontend/src/components/ui/Card.jsx`), EmptyState (`frontend/src/components/ui/EmptyState.jsx`), Skeleton (`frontend/src/components/ui/Skeleton.jsx`), Button (`frontend/src/components/ui/Button.jsx`)

**Checkpoint**: Cơ sở hạ tầng đã được xác minh. Mọi thứ đã sẵn sàng để bắt đầu triển khai.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Thêm Zod validator schema `volunteerHistoryQuerySchema` trong `backend/src/middlewares/validators/profile.validator.js` — validate query params: `page` (int ≥ 1, mặc định 1), `limit` (int 1-50, mặc định 10), `status` (enum: PENDING | APPROVED | REJECTED | CANCELLED, optional), `year` (string regex ^\d{4}$, optional), `search` (string 1-100 chars, optional)
- [ ] T006 [P] Tạo seed script dữ liệu mẫu cho lịch sử tình nguyện trong `backend/prisma/seed.js` — thêm ít nhất 5 applications với các trạng thái khác nhau (PENDING, APPROVED, REJECTED, CANCELLED) cho user VOLUNTEER
- [ ] T007 Xác minh file `backend/src/middlewares/validators/validate.js` (middleware factory `validate(schema)`) đã tồn tại và hoạt động

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Xem Lịch Sử Tham Gia Cơ Bản (Priority: P1) 🎯 MVP

**Goal**: Tình nguyện viên xem được danh sách tất cả các sự kiện đã đăng ký (bao gồm tất cả trạng thái: PENDING, APPROVED, REJECTED, CANCELLED), sắp xếp theo `createdAt` desc. Mỗi bản ghi hiển thị: tên sự kiện, địa điểm, ngày bắt đầu, ngày đăng ký, trạng thái.

**Independent Test**: Đăng nhập với tài khoản VOLUNTEER có ít nhất 5 ứng dụng với các trạng thái khác nhau. Truy cập `/history`. Xác nhận danh sách hiển thị đầy đủ 5 bản ghi với thông tin chính xác và sắp xếp theo ngày giảm dần. Xác nhận danh sách hiển thị đúng raw app.status.

### Implementation for User Story 1

- [ ] T008 [P] [US1] Thêm Repository function `findVolunteerHistory(userId, filters, pagination)` trong `backend/src/repositories/profile.repository.js` — query Prisma `application.findMany()` với include: event (select: id, title, startDate, organization: select: id, name) và attendance (select: status, volunteerHours), orderBy event.startDate desc, skip + take cho pagination
- [ ] T009 [P] [US1] Thêm Repository function `countVolunteerHistory(userId, filters)` trong `backend/src/repositories/profile.repository.js` — query Prisma `application.count()` với where filter tương ứng để lấy tổng số bản ghi cho pagination
- [ ] T010 [US1] Thêm Service function `getVolunteerHistory(userId, filters) — Flow: (1) Verify user + isActive, (2) findVolunteerHistory(), (3) countHistoryApplications(), (4) Map to response shape, (5) Return { summary: { total }, history[], pagination }
- [ ] T011 [US1] ~~BỎ QUA~~ (Schema V3.0 dùng raw app.status, không derived ATTENDED)
- [ ] T012 [US1] ~~BỎ QUA~~ (Schema V3.0 map inline, không join certificate/organization/attendance)
- [ ] T013 [US1] Thêm Controller function `getMyHistory(req, res)` trong `backend/src/controllers/profile.controller.js` — lấy `user_id` từ `req.user`, gọi `getVolunteerHistory(user_id, filters, pagination)`, format response theo ADR-006 qua `successResponse()` và `errorResponse()`
- [ ] T014 [US1] Thêm Route `GET /me/history` trong `backend/src/routes/user.routes.js` — áp dụng `authMiddleware` + `validate(volunteerHistoryQuerySchema)`, gọi `getMyHistory` controller
- [ ] T015 [US1] Viết Swagger JSDoc cho `GET /api/v1/user/me/history` trong `backend/src/routes/user.routes.js` — document: summary, description, tags, security (cookieAuth), query parameters (page, limit, status, year), tất cả response codes (200 có dữ liệu, 200 rỗng, 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 ACCOUNT_DISABLED, 404 USER_NOT_FOUND, 500 INTERNAL_SERVER_ERROR) kèm example cụ thể
- [ ] T016 [P] [US1] Thêm frontend API function `userService.getVolunteerHistory(params)` trong `frontend/src/services/user.service.js` — gọi `axiosApi.get('/api/v1/user/me/history', { params })` với params: `{ page, limit, status, year }`
- [ ] T017 [P] [US1] Tạo custom hook `useVolunteerHistory.js` trong `frontend/src/hooks/useVolunteerHistory.js` — quản lý state: `data` { summary, history[], pagination }, `loading`, `error`. Gọi `userService.getVolunteerHistory()` trong useEffect với default params `{ page: 1, limit: 10 }`
- [ ] T018 [US1] Cập nhật `VolunteerHistoryPage.jsx` (`frontend/src/components/pages/profile/VolunteerHistoryPage.jsx`) — thay thế placeholder bằng: (1) Tiêu đề trang "Lịch sử tình nguyện", (2) Hiển thị danh sách lịch sử dạng bảng (table) với các cột: Tên sự kiện, Tổ chức, Ngày bắt đầu, Trạng thái, Giờ đóng góp, (3) Empty state: khi history rỗng → hiển thị EmptyState với icon History, tiêu đề "Bạn chưa tham gia sự kiện nào", description "Hãy khám phá các sự kiện tình nguyện hấp dẫn!" kèm link đến trang danh sách sự kiện
- [ ] T019 [US1] Xử lý edge case event null — nếu `event` bị null, frontend hiển thị "N/A" thay vì crash`n
**Checkpoint**: Tại thời điểm này, US1 phải hoạt động độc lập — Volunteer có thể xem danh sách lịch sử với tất cả trạng thái và empty state.

---

## Phase 4: User Story 2 - Xem Tổng Hợp Số Liệu (Priority: P1) 🎯 MVP

**Goal**: Tình nguyện viên xem được Summary Card ở đầu trang lịch sử với 3 số liệu: tổng số đơn đăng ký.

**Independent Test**: Đăng nhập với tài khoản VOLUNTEER có 5 applications. Xác nhận Summary Card hiển thị: Tổng số đơn = 5.

### Implementation for User Story 2

- [ ] T020 [P] [US2] Thêm summary vào Service — gọi `countHistoryApplications(userId, {})` để lấy tổng tất cả đơn
- [ ] T021 [US2] Trả về `data.summary = { total: summaryTotal }``
- [ ] T022 [US2] Cập nhật response format trong Controller/Service — `summary` luôn được trả về kể cả khi history rỗng. Khi user chưa có hoạt động nào: `{ total: 0 }`
- [ ] T023 [US2] Cập nhật `useVolunteerHistory.js` (`frontend/src/hooks/useVolunteerHistory.js`) — destructure `summary` từ response data, expose `summary` trong return value của hook
- [ ] T024 [US2] Cập nhật `VolunteerHistoryPage.jsx` (`frontend/src/components/pages/profile/VolunteerHistoryPage.jsx`) — thêm SummaryCard ở đầu trang (trước danh sách) hiển thị 3 metrics: "Tổng giờ tích lũy" (X giờ, format 1 chữ số thập phân), "Tổng số hoạt động" (X), "Hoạt động hoàn thành" (X). Thiết kế dạng 3 cột ngang trên desktop, xếp dọc trên mobile. Dùng Card component có sẵn. Khi tất cả = 0: vẫn hiển thị card với giá trị 0.

**Checkpoint**: Tại thời điểm này, US1 và US2 đều hoạt động độc lập — Volunteer xem được cả danh sách lịch sử và summary metrics.

---

## Phase 5: User Story 3 - Phân Trang Danh Sách Lịch Sử (Priority: P2)

**Goal**: Tình nguyện viên có hơn 10 bản ghi có thể phân trang danh sách với 10 bản ghi/trang, có điều hướng Trang trước / Trang tiếp theo và chỉ báo vị trí hiện tại.

**Independent Test**: Tạo tài khoản test với 25 applications. Xác nhận: trang đầu hiển thị 10 bản ghi với "Trang 1 / 3" và nút "Tiếp theo" khả dụng. Nhấn "Tiếp theo" → hiển thị 10 bản ghi tiếp theo. Nhấn "Tiếp theo" lần nữa → hiển thị 5 bản ghi cuối, nút "Tiếp theo" bị vô hiệu hóa. Nhấn "Trang trước" → quay lại trang 2.

### Implementation for User Story 3

- [ ] T025 [US3] Xác minh logic pagination trong Service `getVolunteerHistory()` — tính `totalPages = Math.ceil(totalRecords / limit)` hoặc `0` nếu không có bản ghi. Đảm bảo `skip = (page - 1) * limit`, `take = limit`. Trả về `pagination: { page, limit, total_pages, total_records }`
- [ ] T026 [US3] Cập nhật `useVolunteerHistory.js` — thêm state `currentPage`, `totalPages`. Thêm function `goToPage(pageNumber)` gọi lại API với page mới. Disable nút khi đang loading.
- [ ] T027 [US3] Cập nhật `VolunteerHistoryPage.jsx` — thêm Pagination UI bên dưới danh sách: hiển thị "Trang X / Y", nút "Trang trước" (disabled khi page = 1), nút "Tiếp theo" (disabled khi page = totalPages). Khi totalPages = 0 (không có dữ liệu): ẩn pagination UI.

**Checkpoint**: US1, US2, US3 đều hoạt động — Volunteer xem được danh sách có phân trang đầy đủ.

---

## Phase 6: User Story 4 - Lọc Lịch Sử Theo Trạng Thái và Năm (Priority: P3)

**Goal**: Tình nguyện viên có thể lọc danh sách lịch sử theo trạng thái (PENDING, APPROVED, REJECTED, CANCELLED), năm tham gia, và tìm kiếm. Có thể xóa bộ lọc để về trạng thái mặc định.

**Independent Test**: Tạo tài khoản test với events năm 2024 (2 events), 2025 (3 events) và các trạng thái khác nhau. (1) Chọn lọc "Trạng thái: APPROVED" → chỉ hiển thị events APPROVED. (2) Chọn lọc "Năm: 2025" → chỉ hiển thị events năm 2025. (3) Kết hợp cả 2 bộ lọc → chỉ hiển thị events APPROVED trong năm 2025 (4) Xóa bộ lọc → hiển thị lại toàn bộ danh sách.

### Implementation for User Story 4

- [ ] T028 [P] [US4] Thêm Repository helper `buildHistoryWhere(userId, filters)` — where: { userId, status }. Year filter lọc manual JS sau query. Search filter client-side.
- [ ] T029 [P] [US4] Thêm query `getDistinctYears(userId)` trong Repository — query `SELECT DISTINCT YEAR(e.start_date)` từ applications join events để tạo danh sách năm cho dropdown filter
- [ ] T030 [US4] Cập nhật `useVolunteerHistory.js` — thêm state `filterStatus` (mặc định: '' - Tất cả), `filterYear` (mặc định: '' - Tất cả), `availableYears` (mảng các năm có dữ liệu). Thêm function `applyFilter(status, year)` gọi lại API với filters mới + reset page về 1. Thêm function `clearFilters()` reset về mặc định
- [ ] T031 [US4] Cập nhật `VolunteerHistoryPage.jsx` — Thêm Filter UI: (1) Ô search (tên/địa điểm) + debounce, (2) Dropdown trạng thái: Tất cả/PENDING/APPROVED/REJECTED/CANCELLED, (3) Dropdown năm: Tất cả + 6 năm gần nhất, (4) Nút "Xóa bộ lọc"
- [ ] T032 [US4] Xử lý edge case "Không có kết quả với bộ lọc" — khi API trả về `total_records = 0` và đang có filter áp dụng, hiển thị EmptyState với message "Không tìm thấy sự kiện phù hợp với bộ lọc. Vui lòng thử lại với bộ lọc khác." kèm nút "Xóa bộ lọc"

**Checkpoint**: Tất cả 4 user stories đều hoạt động độc lập — Volunteer có thể xem, lọc, phân trang lịch sử với summary metrics.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T033 [P] [Polish] ~~BỎ QUA~~ (Schema V3.0 chưa có bảng `certificates`, sẽ bổ sung sau)
- [ ] T034 [P] [Polish] Loading states — thêm Skeleton loading UI trong `VolunteerHistoryPage.jsx`: hiển thị skeleton rows khi `loading = true` (dùng Skeleton component có sẵn). SummaryCard cũng hiển thị skeleton khi loading
- [ ] T035 [P] [Polish] Error states — thêm ErrorState trong `VolunteerHistoryPage.jsx`: khi `error` không null, hiển thị thông báo lỗi với nút "Thử lại" gọi `fetchHistory()`. Các lỗi cụ thể: 401 → "Vui lòng đăng nhập lại", 500 → "Có lỗi xảy ra, vui lòng thử lại sau"
- [ ] T036 [P] [Polish] ~~BỎ QUA~~ (Schema V3.0 chưa có attendance, không có volunteer_hours)`n- [ ] T037 [P] [Polish] Backend unit tests — mở rộng `backend/tests/unit/profile.validator.test.js`: test `volunteerHistoryQuerySchema` các case: default values, valid params, invalid page (0, -1, "abc"), invalid limit (0, 51, "abc"), invalid status (sai enum), invalid year (1999, 2101, "abc")
- [ ] T038 [P] [Polish] Backend unit tests — mở rộng `backend/tests/unit/profile.service.test.js`: test `getVolunteerHistory()` với mock Repository: (1) thành công có dữ liệu, (2) user không tồn tại (404), (3) user bị vô hiệu hóa (403), (4) không có dữ liệu (empty list), (5) filter status, (6) pagination đúng page/limit
- [ ] T039 [Polish] Backend integration tests — tạo `backend/tests/integration/volunteer-history.test.js`: test toàn bộ endpoint `GET /me/history` với real database: (1) 200 có dữ liệu, (2) 200 không có dữ liệu, (3) 400 validation error, (4) 401 không có token, (5) 403 tài khoản disabled, (6) 404 user không tồn tại, (7) filter status, (8) filter year, (9) pagination, (10) kết hợp filter + pagination, (11) summary chính xác
- [ ] T040 [Polish] Frontend component tests — tạo `frontend/tests/components/VolunteerHistoryPage.test.jsx`: test render với mock `useVolunteerHistory`: (1) loading state → skeleton hiển thị, (2) empty state → EmptyState + link đến sự kiện, (3) có dữ liệu → danh sách + SummaryCard + Pagination, (4) error state → ErrorState + nút thử lại, (5) filter UI render, (6) chuyển trang
- [ ] T041 [Polish] Security verification — xác minh: (1) userId LUÔN lấy từ `req.user.user_id` (JWT), KHÔNG từ query params/body (chống IDOR - Lesson 3), (2) KHÔNG thể xem lịch sử của user khác kể cả khi biết userId, (3) endpoint read-only, không có POST/PATCH/DELETE
- [ ] T042 [Polish] Run quickstart.md validation — thực hiện tất cả các bước trong `quickstart.md`: seed data, chạy backend, test API bằng curl, chạy tests, tích hợp frontend
- [ ] T043 [Polish] Code cleanup — đảm bảo: (1) không có `console.log` trong production code (dùng Pino logger), (2) không có TODO/FIXME comments, (3) mỗi hàm ≤ 40 dòng, mỗi file ≤ 300 dòng (AGENTS.md §7), (4) comments chỉ giải thích WHY, không giải thích WHAT
- [ ] T044 [Polish] Swagger documentation review — xác minh Swagger JSDoc đầy đủ cho endpoint mới với tất cả response codes và examples. Truy cập Swagger UI tại `http://localhost:5000/api-docs` để kiểm tra trực quan

**Checkpoint**: UC21 hoàn chỉnh — sẵn sàng để review và merge.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - CORE implementation
- **User Story 2 (Phase 4)**: Depends on US1 (common backend) - Adds Summary Card
- **User Story 3 (Phase 5)**: Depends on US1 (pagination backend already in place) - Adds Pagination UI
- **User Story 4 (Phase 6)**: Depends on US1 (extends backend filter logic) - Adds Filter UI
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Không phụ thuộc các story khác. Cung cấp nền tảng backend/frontend cho tất cả story khác.
- **User Story 2 (P1)**: Can start after US1 backend hoàn thành - Mở rộng Service để trả về summary. Có thể triển khai song song với US1 frontend (khác file).
- **User Story 3 (P2)**: Can start after US1 hoàn thành - Pagination backend đã có từ US1, chỉ thêm UI. Có thể triển khai song song với US2.
- **User Story 4 (P3)**: Can start after US1 backend hoàn thành - Thêm filter logic vào Repository. Có thể triển khai song song với US2 và US3.

### Within Each User Story

- Repository functions before Service
- Service before Controller
- Controller + Validator before Route
- Backend complete before Frontend integration
- Frontend Service before Hook before Page
- Core implementation before edge cases

### Parallel Opportunities

- **Phase 1**: T001, T002, T003, T004 có thể chạy song song (tất cả [P])
- **Phase 2**: T005, T006, T007 có thể chạy song song (tất cả [P])
- **Phase 3 (US1)**: T008, T009 có thể chạy song song (cùng file nhưng khác function). T016, T017, T018 có thể chạy song song với backend (khác thư mục)
- **Phase 4 (US2)**: T020 có thể chạy song song với US1 frontend tasks
- **Phase 5 (US3)**: Có thể chạy song song với US2 (khác layer)
- **Phase 6 (US4)**: T028, T029 có thể chạy song song (khác query)
- **Phase 7 (Polish)**: T033, T034, T035, T036, T037, T038 có thể chạy song song (tất cả [P])

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T007) - CRITICAL
3. Complete Phase 3: User Story 1 (T008-T019)
4. Complete Phase 4: User Story 2 (T020-T024)
5. **STOP and VALIDATE**: Test US1+US2 independently. Tình nguyện viên có thể xem danh sách lịch sử + summary metrics.
6. Deploy/demo nếu sẵn sàng — Đây là MVP hoàn chỉnh!

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 + US2 → Test independently → Deploy/Demo (MVP với lịch sử + tổng hợp!)
3. Add US3 → Pagination hoạt động → Test independently → Deploy/Demo
4. Add US4 → Filter hoạt động → Test independently → Deploy/Demo
5. Polish (tests, edge cases, security) → Complete → Final review

### Parallel Team Strategy

Với nhiều developers (giả định):

1. Team hoàn thành Setup + Foundational cùng nhau
2. Sau khi Foundational hoàn tất:
   - **Developer A (Backend)**: US1 Backend (T008-T015) → US2 Backend (T020-T022) → US4 Backend (T028-T029)
   - **Developer B (Frontend)**: US1 Frontend (T016-T019) → US2 Frontend (T023-T024) → US3 Frontend (T026-T027) → US4 Frontend (T030-T032)
   - **Developer C (Tests)**: Test setup → Unit tests (T037-T038) → Integration tests (T039-T040) running in parallel with dev
3. Stories hoàn thành và tích hợp độc lập

---

## Notes

- [P] tasks = different files, no dependencies (hoặc khác function trong cùng file)
- [Story] label maps task to specific user story for traceability
- Mỗi user story có thể hoàn thành và test độc lập
- Số giờ hiển thị: format `Number(volunteerHours)` để đảm bảo `Decimal` từ Prisma → `Number` trong JSON
- Status map: raw `app.status` (Schema V3.0, không derived ATTENDED)
- Certificate enrichment: KHÔNG tạo logic PDF/tạo certificate — chỉ hiển thị link đến UC51 (tuân thủ Module Boundary)
- Dữ liệu read-only, không có mutation — không cần transaction
- Tất cả response tuân thủ ADR-006: `successResponse(data, message)` cho thành công, `errorResponse(message, code, details)` cho lỗi
- Frontend styling dùng CSS module hoặc inline styles theo codebase convention hiện có, tuân thủ DESIGN.md (Starbucks-inspired)
- Commit sau mỗi task hoặc nhóm task logic
- Dừng ở mỗi checkpoint để validate story độc lập trước khi tiếp tục

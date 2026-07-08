# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.)

---

description: "Task list template for feature implementation"

---

# Tasks: Thay Đổi Mật Khẩu (Change Password)

**Input**: Design documents from `.sdd/CuongLH/UC06-feat-auth-change-password/`

**Prerequisites**: plan.md (ACCEPTED), spec.md (APPROVED), research.md, data-model.md, contracts/api-contract.md, quickstart.md

**Tests**: Có — spec.md yêu cầu test coverage 80% cho services, 60% cho controllers.

**Organization**: Tasks được nhóm theo từng bước triển khai, sắp xếp từ Backend → Frontend → Testing → Polish. Mỗi task đánh dấu User Story liên quan.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác file, không phụ thuộc)
- **[Story]**: User Story liên quan (US1, US2, US3, US4, US5)
- Mô tả chứa đường dẫn file chính xác

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure — Cơ sở hạ tầng chung)

**Purpose**: Xác nhận các thành phần đã có từ UC03 (Login), đảm bảo sẵn sàng cho UC06

- [ ] T001 Xác nhận Prisma schema `users` table có cột `password_hash` (VARCHAR 255, NOT NULL) và `is_active` (BOOLEAN, DEFAULT TRUE) trong `backend/prisma/schema.prisma`
- [ ] T002 [P] Chạy `npx prisma generate` để sinh Prisma Client mới nhất trong `backend/`
- [ ] T003 [P] Xác nhận biến môi trường `BCRYPT_SALT_ROUNDS=12` có trong `backend/.env`

---

## Phase 2: Foundational (Blocking Prerequisites — Điều kiện tiên quyết)

**Purpose**: Các file dùng chung PHẢI có trước khi bắt đầu code tính năng

**⚠️ CRITICAL**: Không User Story nào được code trước khi Phase này xong

- [ ] T004 Xác nhận `auth.middleware.js` có hàm `authenticate()` inject `req.user` (id, email, role_id) trong `backend/src/middleware/auth.middleware.js`
- [ ] T005 [P] Xác nhận `user.repository.js` có hàm `findById(userId)` và có thể cập nhật `password_hash` trong `backend/src/repositories/user.repository.js`
- [ ] T006 [P] Xác nhận `response.util.js` có hàm `success(res, data)` và `error(res, message, statusCode)` chuẩn ADR-006 trong `backend/src/utils/response.util.js`
- [ ] T007 [P] Xác nhận `auth.routes.js` đã có cấu trúc router và export trong `backend/src/routes/auth.routes.js`
- [ ] T008 [P] Xác nhận `auth.validator.js` đã export validator middleware trong `backend/src/middlewares/validators/auth.validator.js`
- [ ] T009 [P] Xác nhận Pino logger đã được config trong `backend/src/config/logger.config.js` hoặc `backend/src/app.js`

**Checkpoint**: Foundation ready — có thể bắt đầu code các User Story

---

## Phase 3: User Story 1+5 — Happy path + Auth Guard (Priority: P1) 🎯 MVP

**Goal**: Triển khai luồng thay đổi mật khẩu thành công cho người dùng đã đăng nhập. Người dùng cung cấp oldPassword đúng + newPassword hợp lệ → password được cập nhật, giữ nguyên session.

**US5 (Auth Guard)**: Middleware authenticate() từ chối request không có JWT token → 401 Unauthorized. Bảo vệ chống IDOR: userId LUÔN lấy từ req.user.id, KHÔNG từ request body.

**Independent Test**: Login lấy JWT token → Gọi POST /api/v1/auth/change-password với oldPassword đúng + newPassword hợp lệ → 200 OK → Đăng nhập lại bằng mật khẩu mới thành công. Gọi API không có JWT token → 401.

### Backend: Service Layer (Business Logic)

- [ ] T010 [US1] Implement `changePassword(userId, oldPassword, newPassword)` trong `backend/src/services/auth.service.js` — (1) Lấy user qua userRepository.findById(userId), kiểm tra is_active, (2) bcrypt.compare oldPassword với user.password_hash, (3) bcrypt.hash newPassword 12 rounds, (4) Prisma $transaction UPDATE password_hash, (5) Audit log CHANGE_PASSWORD_SUCCESS với userId + timestamp. Ném ServiceError nếu oldPassword sai (400) hoặc user inactive (403)
- [ ] T011 [US1] Implement `validatePasswordChange(userId)` helper trong `backend/src/services/auth.service.js` — Kiểm tra user tồn tại + is_active, KHÔNG check social login (scope ngoài UC06)

### Backend: Validator (Zod Schema)

- [ ] T012 [US1] Thêm Zod schema `changePasswordSchema` trong `backend/src/middlewares/validators/auth.validator.js`:
  - `oldPassword`: z.string().min(1, 'Vui lòng nhập mật khẩu cũ')
  - `newPassword`: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/\d/).regex(/[!@#$%^&*]/)
  - `confirmPassword`: z.string()
  - `.refine(data => data.newPassword === data.confirmPassword, { message: 'Mật khẩu mới và xác nhận không khớp', path: ['confirmPassword'] })`

### Backend: Controller + Routes

- [ ] T013 [US1] Thêm controller `changePassword` trong `backend/src/controllers/auth.controller.js` — Extract oldPassword, newPassword, confirmPassword từ req.body, lấy userId từ req.user.id (JWT đã xác thực), gọi authService.changePassword(), trả về response chuẩn ADR-006 qua response.util
- [ ] T014 [US1] Thêm route trong `backend/src/routes/auth.routes.js`:
  - `POST /api/v1/auth/change-password` + `authenticate()` middleware + `validate(changePasswordSchema)` middleware + `changePassword` controller

### Frontend: API Client

- [ ] T015 [P] [US1] Thêm hàm `changePassword(oldPassword, newPassword, confirmPassword)` vào `frontend/src/services/authApi.js` — Axios POST đến `/auth/change-password`, credentials: 'include', return response.data

### Frontend: Pages & Components

- [ ] T016 [US1] Tạo custom hook `useChangePassword.js` trong `frontend/src/hooks/useChangePassword.js` — Quản lý state: oldPassword, newPassword, confirmPassword, loading, error, success. Hàm `handleSubmit()` gọi authApi.changePassword(), xử lý error messages, reset form khi thành công
- [ ] T017 [US1] Tạo `ChangePasswordForm.jsx` trong `frontend/src/components/auth/ChangePasswordForm.jsx` — Form 3 trường: Old Password, New Password, Confirm Password. Real-time validation: độ mạnh mật khẩu, confirm khớp. Submit button disabled khi loading hoặc validation fail. Hiển thị inline error messages
- [ ] T018 [US1] Tạo `ChangePasswordPage.jsx` trong `frontend/src/pages/auth/ChangePasswordPage.jsx` — Page container: hiển thị tiêu đề "Thay đổi mật khẩu", render ChangePasswordForm, hiển thị success toast sau khi đổi thành công
- [ ] T019 [US1] Thêm route `/profile/change-password` vào `frontend/src/App.js` — Bọc bằng AuthGuard (kiểm tra đã đăng nhập), render ChangePasswordPage

### Integration Tests cho User Story 1+5

- [ ] T020 [P] [US1] Viết integration test: Happy path — oldPassword đúng, newPassword hợp lệ, confirm khớp → 200 OK, password_hash được cập nhật trong DB trong `backend/tests/integration/auth.change-password.test.js`
- [ ] T021 [P] [US1] Viết integration test: Sau khi đổi mật khẩu thành công → Đăng nhập bằng mật khẩu mới thành công, mật khẩu cũ không còn hoạt động trong `backend/tests/integration/auth.change-password.test.js`
- [ ] T022 [P] [US1] Viết integration test: Session được giữ nguyên sau khi đổi mật khẩu → JWT token hiện tại vẫn hoạt động sau khi đổi trong `backend/tests/integration/auth.change-password.test.js`
- [ ] T023 [P] [US5] Viết integration test: Gọi API không có JWT token → 401 Unauthorized trong `backend/tests/integration/auth.change-password.test.js`
- [ ] T024 [P] [US5] Viết integration test: Gọi API với JWT token hết hạn → 401 Unauthorized trong `backend/tests/integration/auth.change-password.test.js`

**Checkpoint**: Luồng thay đổi mật khẩu chính hoạt động, auth guard hoạt động. Có thể demo MVP.

---

## Phase 4: User Story 2+3+4 — Error Handling (Priority: P2-P3)

**Goal**: Xử lý tất cả các kịch bản lỗi: mật khẩu cũ sai (US2), mật khẩu mới yếu (US3), confirm không khớp (US4).

**Independent Test**: Gọi API với từng loại input sai → Kiểm tra HTTP status code và error message phù hợp. Verify password_hash KHÔNG bị thay đổi trong DB sau mỗi lần thất bại.

### Backend: Service Layer Enhancements

- [ ] T025 [US2] Bổ sung error handling chi tiết trong `changePassword()` tại `backend/src/services/auth.service.js` — oldPassword sai: throw ServiceError("Mật khẩu cũ không chính xác", 400) + log CHANGE_PASSWORD_FAILED (reason: old_password_incorrect). KHÔNG thay đổi password_hash
- [ ] T026 [US3] Xác nhận Zod schema trong `auth.validator.js` trả về error messages cụ thể cho từng policy vi phạm: "Mật khẩu phải có ít nhất 8 ký tự", "Mật khẩu phải chứa ít nhất một chữ cái viết hoa", "Mật khẩu phải chứa ít nhất một chữ cái viết thường", "Mật khẩu phải chứa ít nhất một chữ số", "Mật khẩu phải chứa ít nhất một ký tự đặc biệt"
- [ ] T027 [US4] Xác nhận Zod `.refine()` trong `auth.validator.js` trả về lỗi "Mật khẩu mới và xác nhận mật khẩu không khớp" khi newPassword !== confirmPassword

### Backend: Controller Error Handling

- [ ] T028 [US2] Bổ sung try-catch trong `changePassword` controller tại `backend/src/controllers/auth.controller.js` — Bắt ServiceError và trả về HTTP status code tương ứng (400/403/500) với response chuẩn ADR-006

### Frontend: Error Display

- [ ] T029 [US2] Cập nhật `useChangePassword.js` trong `frontend/src/hooks/useChangePassword.js` — Parse error response từ API, map sang field-level errors: oldPassword error, newPassword error, confirmPassword error
- [ ] T030 [US3] Cập nhật `ChangePasswordForm.jsx` trong `frontend/src/components/auth/ChangePasswordForm.jsx` — Hiển thị real-time password strength indicator (weak/medium/strong). Hiển thị danh sách policy requirements với checkmarks khi từng requirement được đáp ứng
- [ ] T031 [US4] Cập nhật `ChangePasswordForm.jsx` trong `frontend/src/components/auth/ChangePasswordForm.jsx` — Hiển thị error message khi confirmPassword không khớp newPassword (real-time validation). Disable submit button khi không khớp

### Integration Tests cho User Story 2+3+4

- [ ] T032 [P] [US2] Viết integration test: oldPassword sai → 400 "Mật khẩu cũ không chính xác", password_hash KHÔNG đổi trong `backend/tests/integration/auth.change-password.test.js`
- [ ] T033 [P] [US3] Viết integration test: newPassword quá ngắn (< 8 ký tự) → 400 validation error chi tiết trong `backend/tests/integration/auth.change-password.test.js`
- [ ] T034 [P] [US3] Viết integration test: newPassword thiếu chữ hoa/thường/số/đặc biệt → 400 validation error chi tiết cho từng trường hợp trong `backend/tests/integration/auth.change-password.test.js`
- [ ] T035 [P] [US4] Viết integration test: newPassword và confirmPassword không khớp → 400 "Mật khẩu mới và xác nhận không khớp" trong `backend/tests/integration/auth.change-password.test.js`

**Checkpoint**: Tất cả error paths hoạt động, password_hash không bị thay đổi khi thất bại.

---

## Phase 5: Edge Cases & Security Hardening

**Purpose**: Xử lý edge cases từ spec.md và các yêu cầu bảo mật

### Backend: Edge Cases

- [ ] T036 [US1] Bổ sung kiểm tra `is_active` trong `changePassword()` tại `backend/src/services/auth.service.js` — Nếu user.is_active === false: throw ServiceError("Tài khoản không hoạt động", 403). Test: user inactive → 403
- [ ] T037 [P] [US1] Bổ sung audit log trong `changePassword()` tại `backend/src/services/auth.service.js` — Log CHANGE_PASSWORD_FAILED với reason cụ thể (old_password_incorrect, account_inactive, validation_failed). TUYỆT ĐỐI KHÔNG log password plaintext hoặc hash
- [ ] T038 [P] [US1] Xác nhận performance: bcrypt hash mới không làm response time vượt quá 500ms. Nếu cần, điều chỉnh BCRYPT_SALT_ROUNDS. Thêm random delay nhỏ 0-50ms để chống timing attack

### Backend: Race Condition Protection

- [ ] T039 [US1] Xác nhận Prisma `$transaction` trong `changePassword()` đảm bảo atomicity khi có concurrent requests trong `backend/src/services/auth.service.js`

### Integration Tests cho Edge Cases

- [ ] T040 [P] Viết integration test: User is_active = false → 403 "Tài khoản không hoạt động" trong `backend/tests/integration/auth.change-password.test.js`
- [ ] T041 [P] Viết integration test: 2 concurrent requests đổi mật khẩu → cả 2 thành công (last write wins), không data corruption trong `backend/tests/integration/auth.change-password.test.js`
- [ ] T042 [P] Viết integration test: Mật khẩu mới giống hệt mật khẩu cũ → 200 OK (được chấp nhận) trong `backend/tests/integration/auth.change-password.test.js`
- [ ] T043 [P] Viết integration test: Response không chứa password_hash, plaintext password, hoặc stack trace trong `backend/tests/integration/auth.change-password.test.js`

**Checkpoint**: Edge cases được xử lý, bảo mật đảm bảo.

---

## Phase 6: Frontend Component Tests

**Purpose**: Unit test cho các component frontend

- [ ] T044 [P] Viết component test cho `ChangePasswordForm` — Render 3 input fields, validation errors display, submit button disabled khi validation fail, gọi onSubmit với đúng data trong `frontend/tests/auth/ChangePasswordForm.test.jsx`
- [ ] T045 [P] Viết component test cho `useChangePassword` hook — Test: loading state, success state, error handling (old password wrong, weak password, confirm mismatch), form reset sau success trong `frontend/tests/auth/useChangePassword.test.js`
- [ ] T046 [P] Viết component test cho `ChangePasswordPage` — Render page với form, hiển thị success toast sau khi đổi thành công, hiển thị error message khi thất bại trong `frontend/tests/auth/ChangePasswordPage.test.jsx`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Hoàn thiện tài liệu, logging, cleanup

- [ ] T047 Thêm Swagger JSDoc cho endpoint `POST /api/v1/auth/change-password` trong `backend/src/routes/auth.routes.js` — Mỗi endpoint có @swagger tag "Authentication", request body schema (oldPassword, newPassword, confirmPassword), response examples (200, 400, 401, 403, 500)
- [ ] T048 [P] Thêm Pino audit log đầy đủ trong `backend/src/services/auth.service.js` — Log các sự kiện: CHANGE_PASSWORD_SUCCESS (userId, timestamp, ipAddress), CHANGE_PASSWORD_FAILED (userId, reason, timestamp). KHÔNG log password plaintext, hash, JWT token
- [ ] T049 Cập nhật `share_context.md` — Thêm API contract POST /api/v1/auth/change-password vào phần Member 1 APIs
- [ ] T050 [P] Chạy `npm run lint` backend + frontend, sửa toàn bộ ESLint errors
- [ ] T051 [P] Chạy toàn bộ test suite: `npm test` backend + frontend, xác nhận tất cả pass, coverage ≥ 80% cho auth.service.js
- [ ] T052 Chạy quickstart.md validation — Test từng curl command, xác nhận kết quả khớp với api-contracts.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Không phụ thuộc — bắt đầu ngay
- **Foundational (Phase 2)**: Phụ thuộc Setup hoàn thành — BLOCKS tất cả User Stories
- **US1+US5 (Phase 3)**: Phụ thuộc Foundational hoàn thành — Happy path + Auth guard
- **US2+US3+US4 (Phase 4)**: Phụ thuộc Phase 3 Backend Core (T010, T012) — Mở rộng error handling
- **Edge Cases (Phase 5)**: Phụ thuộc Phase 3 Backend Core — Mở rộng logic đã có
- **Frontend Tests (Phase 6)**: Phụ thuộc Phase 3+4 Frontend hoàn thành
- **Polish (Phase 7)**: Phụ thuộc tất cả Phase trước hoàn thành

### User Story Dependencies

- **US1+US5 (P1)**: Có thể bắt đầu sau Foundational — Không phụ thuộc stories khác. Đây là MVP
- **US2 (P2)**: Phụ thuộc US1 Backend Core (T010) — Mở rộng error handling trong cùng function
- **US3 (P2)**: Phụ thuộc US1 Backend Core (T012) — Mở rộng Zod validation schema
- **US4 (P3)**: Phụ thuộc US1 Backend Core (T012) — Mở rộng Zod refine validation

### Trong cùng Phase 3 (US1+US5)

```
Backend Service (T010-T011)
  → Backend Validator (T012)
    → Backend Controller (T013)
      → Backend Route (T014)

Frontend API (T015) — song song với Backend
  → Frontend Hook (T016)
    → Frontend Form (T017)
      → Frontend Page (T018)
        → Frontend Route (T019)

Integration Tests (T020-T024) — SAU Backend hoàn thành
```

### Parallel Opportunities

- T002, T003 có thể chạy song song (Phase 1)
- T005, T006, T007, T008, T009 có thể chạy song song (Phase 2)
- T015 (Frontend API) có thể chạy song song với T010-T014 (Backend API)
- T016, T017, T018 (Hook + Form + Page) có thể chạy song song sau khi T015 hoàn thành
- T020-T024 (integration tests) có thể chạy song song (Phase 3 Tests)
- T032-T035 (error path tests) có thể chạy song song (Phase 4 Tests)
- T040-T043 (edge case tests) có thể chạy song song (Phase 5 Tests)
- T044, T045, T046 (component tests) có thể chạy song song (Phase 6)
- T047, T048 (Swagger + Logging) có thể chạy song song (Phase 7)

---

## Implementation Strategy

### MVP First (User Story 1+5 Only)

1. Hoàn thành Phase 1: Setup
2. Hoàn thành Phase 2: Foundational (CRITICAL)
3. Hoàn thành Phase 3: US1+US5 — Happy path + Auth guard
4. **STOP và VALIDATE**: Test luồng chính end-to-end: Login → Đổi mật khẩu → Đăng nhập lại bằng mật khẩu mới
5. Demo nếu sẵn sàng

### Incremental Delivery

1. Setup + Foundational → Nền tảng sẵn sàng
2. US1+US5 → Test độc lập → Demo (MVP!)
3. US2+US3+US4 → Test error paths → Tích hợp → Demo
4. Edge Cases → Test security → Tích hợp → Demo
5. Frontend Tests → Verify UI → Ready for review
6. Polish → Swagger + Lint + Coverage → Ready for merge

---

## Notes

- [P] tasks = khác file, không phụ thuộc → có thể chạy song song
- [Story] label map task về User Story cụ thể để traceability
- Mỗi User Story nên có thể hoàn thành và test độc lập
- Commit sau mỗi task hoặc nhóm task logic
- Dừng ở mỗi checkpoint để validate story độc lập
- Tránh: task mơ hồ, conflict cùng file, phụ thuộc chéo giữa các story
- US5 (Auth Guard) KHÔNG cần code mới — middleware authenticate() đã có từ UC03. Chỉ cần áp dụng vào route mới và viết test xác nhận
- KHÔNG implement các tính năng ngoài scope: social login, password history, email notification, 2FA, force logout
- Tổng: 52 tasks, ước tính ~5-6 giờ

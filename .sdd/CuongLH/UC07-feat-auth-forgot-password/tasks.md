# Tasks: Quên Mật Khẩu (Forgot Password)

**Input**: Design documents from `.sdd/CuongLH/UC07-feat-auth-forgot-password/`

**Điều kiện tiên quyết**: plan.md (ACCEPTED), spec.md (APPROVED), research.md, data-model.md, contracts/api-contracts.md

**Tests**: Có — spec.md yêu cầu test coverage 80% cho services, 60% cho controllers.

**Organization**: Tasks được nhóm theo từng bước triển khai, sắp xếp từ Backend → Frontend → Testing → Polish. Mỗi task đánh dấu User Story liên quan.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác file, không phụ thuộc)
- **[Story]**: User Story liên quan (US1, US2, US3, US4)
- Mô tả chứa đường dẫn file chính xác

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Kiểm tra các thành phần đã có từ UC04, xác nhận sẵn sàng cho UC07

- [ ] T001 Kiểm tra Prisma schema `email_verifications` có cột `type` enum (REGISTER, RESET_PASSWORD) trong `backend/prisma/schema.prisma`
- [ ] T002 [P] Kiểm tra biến môi trường SMTP (SMTP_FROM_NAME, SMTP_USER, SMTP_PASS) có trong `backend/.env`
- [ ] T003 [P] Chạy `npx prisma generate` để sinh Prisma Client mới nhất trong `backend/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Các file dùng chung PHẢI có trước khi bắt đầu code tính năng

**⚠️ CRITICAL**: Không User Story nào được code trước khi Phase này xong

- [ ] T004 Xác nhận `otp.util.js` có hàm `generateOTP()` sử dụng `crypto.randomInt(0, 1000000).toString().padStart(6, '0')` để tạo mã OTP gồm 6 chữ số trong `backend/src/utils/otp.util.js`
- [ ] T005 [P] Xác nhận `email.service.js` có transporter NodeMailer đã config trong `backend/src/services/email.service.js`
- [ ] T006 [P] Xác nhận `auth.repository.js` có hàm `findByEmail()` và `updatePassword()` trong `backend/src/repositories/auth.repository.js`
- [ ] T007 [P] Xác nhận `response.util.js` có hàm `success()` và `error()` chuẩn ADR-006 trong `backend/src/utils/response.util.js`
- [ ] T008 Xác nhận `auth.routes.js` đã có cấu trúc router và export trong `backend/src/routes/auth.routes.js`
- [ ] T009 [P] Xác nhận `validate.js` đã export validator middleware dùng chung trong `backend/src/middlewares/validators/validate.js`

**Checkpoint**: Foundation ready — có thể bắt đầu code các User Story

---

## Phase 3: User Story 1+4 — Khôi phục mật khẩu + Chống enumeration (Priority: P1) 🎯 MVP

**Goal**: Triển khai luồng khôi phục mật khẩu 3 bước hoàn chỉnh: Nhập email → Nhập OTP → Nhập mật khẩu mới. Đồng thời chống dò quét tài khoản (zero user enumeration).

**Independent Test**: Tạo tài khoản test → Gọi API request với email tồn tại → Nhận OTP → Verify OTP → Reset password → Đăng nhập bằng mật khẩu mới. Kiểm tra request với email không tồn tại trả về response giống hệt.

### Backend: Service Layer (Business Logic)

- [ ] T010 [US1] Implement `requestResetPassword(email)` trong `backend/src/services/auth.service.js` — Tạo OTP, hash bcrypt, lưu DB (upsert theo email+type), gửi email async. Với email không tồn tại: tạo fake OTP, không lưu DB, không gửi email, vẫn trả success
- [ ] T011 [US1] Implement `verifyResetOTP(email, otp)` trong `backend/src/services/auth.service.js` — Tìm record theo (email, RESET_PASSWORD), kiểm tra hết hạn (created_at + 10 phút), so sánh bcrypt, xử lý attempts, return verified=true nếu đúng
- [ ] T012 [US1] Implement `resetPassword(email, otp, newPassword)` trong `backend/src/services/auth.service.js` — Gọi verifyResetOTP re-validate, kiểm tra user is_active, hash mật khẩu mới, sequential: updatePassword + DELETE OTP record
- [ ] T013 [P] [US1] Implement `sendResetPasswordEmail()` trong `backend/src/services/email.service.js` — Gửi email HTML đơn giản chứa OTP 6 số, try-catch lỗi im lặng, log Pino

### Backend: API Layer (Validator + Controller + Routes)

- [ ] T014 [US1] Thêm Zod schemas `requestResetSchema`, `verifyOTPSchema`, `resetPasswordSchema` trong `backend/src/middlewares/validators/auth.validator.js`
- [ ] T015 [US1] Thêm 3 controller: `requestResetPassword`, `verifyResetOTP`, `resetPassword` trong `backend/src/controllers/auth.controller.js` — Mỗi controller chỉ extract dữ liệu, gọi service, trả response
- [ ] T016 [US1] Thêm 3 route POST trong `backend/src/routes/auth.routes.js`:
  - `POST /api/v1/auth/forgot-password/request` + validate(requestResetSchema)
  - `POST /api/v1/auth/forgot-password/verify-otp` + validate(verifyOTPSchema)
  - `POST /api/v1/auth/forgot-password/reset` + validate(resetPasswordSchema)

### Frontend: Pages

- [ ] T018 [US1] Tạo `ForgotPasswordPage.jsx` trong `frontend/src/components/pages/auth/ForgotPasswordPage.jsx` — Stepper 3 bước nội bộ, quản lý state bằng useState (step, email). Step 1: form nhập email → gọi forgotPasswordRequest, setEmail + chuyển Step 2. Step 2: OTPInput 6 chữ số (dùng lại component OTPInput.jsx) + countdown gửi lại (useCountdown), gọi forgotPasswordVerifyOtp, chuyển Step 3. Step 3: form PasswordInput (mới + xác nhận) + PasswordRequirements, gọi forgotPasswordReset, toast success → navigate('/login', { state: { passwordReset: true } }). KHÔNG persist state — refresh → reset về Step 1

### Frontend: Route & Navigation

- [ ] T019 [US1] Thêm route `/forgot-password` vào `frontend/src/App.js` — Import ForgotPasswordPage, đặt trong AuthLayout (đã có sẵn), bọc bởi GuestRoute. KHÔNG cần Context Provider riêng, không cần Flow container
- [ ] T020 [P] [US1] Thêm 3 hàm API vào `frontend/src/services/auth.service.js` — `forgotPasswordRequest(email)` → POST /api/v1/auth/forgot-password/request, `forgotPasswordVerifyOtp({ email, otp })` → POST /api/v1/auth/forgot-password/verify-otp, `forgotPasswordReset({ email, otp, newPassword })` → POST /api/v1/auth/forgot-password/reset

### Tests cho User Story 1+4

- [ ] T024 [P] [US1] Viết integration test: Request OTP với email tồn tại → 200 OK, record được tạo trong `backend/tests/integration/auth.forgot-password.test.js`
- [ ] T025 [P] [US4] Viết integration test: Request OTP với email KHÔNG tồn tại → 200 OK, response giống hệt US1, không có record trong DB trong `backend/tests/integration/auth.forgot-password.test.js`
- [ ] T026 [P] [US4] Viết integration test: So sánh response time email tồn tại vs không tồn tại → variance < 100ms trong `backend/tests/integration/auth.forgot-password.test.js`
- [ ] T027 [US1] Viết integration test: Verify OTP đúng → 200 OK verified=true, Reset password → 200 OK, đăng nhập bằng mật khẩu mới thành công trong `backend/tests/integration/auth.forgot-password.test.js`
- [ ] T028 [US1] Viết integration test: Reset password với user is_active=false → 403 Forbidden trong `backend/tests/integration/auth.forgot-password.test.js`

**Checkpoint**: Luồng khôi phục mật khẩu chính hoạt động, chống enumeration hoạt động. Có thể demo MVP.

---

## Phase 4: User Story 2 — Lockout sau 5 lần nhập sai OTP (Priority: P2)

**Goal**: Sau 5 lần nhập sai OTP liên tiếp, email bị khóa 15 phút, mọi request tiếp theo bị từ chối.

**Independent Test**: Request OTP → Nhập sai 5 lần → Kiểm tra 429 bị khóa → Đợi 16 phút → Thử lại → Verify OTP thành công.

### Implementation for User Story 2

- [ ] T029 [US2] Bổ sung logic lockout vào `verifyResetOTP()` trong `backend/src/services/auth.service.js` — Sau mỗi lần sai: increment attempts, nếu attempts >= 5: SET is_locked=true, locked_until=NOW()+15min, return 429
- [ ] T030 [US2] Bổ sung check `locked_until` TRƯỚC cooldown trong `requestResetPassword()` trong `backend/src/services/auth.service.js` — Nếu locked_until > NOW(): từ chối với 429 + thời gian còn lại
- [ ] T031 [US2] Cập nhật logic Step 2 trong `ForgotPasswordPage.jsx` trong `frontend/src/components/pages/auth/ForgotPasswordPage.jsx` — Hiển thị thông báo lỗi lockout với thời gian đếm ngược, vô hiệu hóa input OTP khi bị khóa

### Tests for User Story 2

- [ ] T032 [US2] Viết integration test: Nhập sai OTP 5 lần → 429 locked, locked_until = NOW()+15min trong `backend/tests/integration/auth.forgot-password.test.js`
- [ ] T033 [US2] Viết integration test: Email đang khóa → Request OTP mới → 429 bị từ chối (check locked_until TRƯỚC cooldown) trong `backend/tests/integration/auth.forgot-password.test.js`
- [ ] T034 [US2] Viết integration test: Email đang khóa → Verify OTP → 429 bị từ chối kèm thời gian còn lại trong `backend/tests/integration/auth.forgot-password.test.js`

**Checkpoint**: Lockout hoạt động, không thể bypass khóa bằng request OTP mới.

---

## Phase 5: User Story 3 — Gửi lại OTP + Cooldown 60s (Priority: P2)

**Goal**: Người dùng có thể yêu cầu gửi lại OTP mới sau 60 giây. OTP cũ bị vô hiệu, OTP mới có hiệu lực.

**Independent Test**: Request OTP → Đợi 30s gửi lại → 429 cooldown → Đợi thêm 31s → Gửi lại thành công → OTP mới hoạt động, OTP cũ bị vô hiệu.

### Implementation for User Story 3

- [ ] T035 [US3] Bổ sung logic cooldown vào `requestResetPassword()` trong `backend/src/services/auth.service.js` — Check last_sent_at + 60s > NOW(): từ chối 429 + thời gian còn lại
- [ ] T036 [US3] Bổ sung logic hết hạn OTP vào `verifyResetOTP()` trong `backend/src/services/auth.service.js` — Check created_at + 10 phút < NOW(): từ chối 400 "OTP đã hết hạn"
- [ ] T037 [US3] Bổ sung upsert logic vào `requestResetPassword()` trong `backend/src/services/auth.service.js` — Khi tạo OTP mới: upsert record (ghi đè otp_hash, reset created_at, attempts=0, is_locked=false)
- [ ] T038 [US3] Cập nhật logic Step 2 trong `ForgotPasswordPage.jsx` trong `frontend/src/components/pages/auth/ForgotPasswordPage.jsx` — Thêm nút "Gửi lại OTP" với cooldown timer 60s, reset OTP countdown về 10 phút khi gửi lại, hiển thị thông báo OTP hết hạn

### Tests for User Story 3

- [ ] T039 [US3] Viết integration test: Gửi OTP → Đợi 30s → Gửi lại → 429 cooldown với remaining_seconds ~30s trong `backend/tests/integration/auth.forgot-password.test.js`
- [ ] T040 [US3] Viết integration test: Mock created_at 11 phút trước → Verify OTP → 400 "OTP đã hết hạn" trong `backend/tests/integration/auth.forgot-password.test.js`
- [ ] T041 [US3] Viết integration test: Gửi OTP → Đợi 61s → Gửi lại → OTP mới hoạt động, OTP cũ không còn hiệu lực trong `backend/tests/integration/auth.forgot-password.test.js`

**Checkpoint**: Cooldown hoạt động, OTP hết hạn bị từ chối, OTP cũ bị vô hiệu khi tạo OTP mới.

---

## Phase 6: Frontend Component Tests

**Purpose**: Unit test cho các component frontend

- [ ] T042 [P] Viết component test cho `ForgotPasswordPage` (Step 1: render form, validate email, gọi API thành công/lỗi) trong `frontend/tests/auth/ForgotPasswordPage.test.jsx`
- [ ] T043 [P] Viết component test cho `ForgotPasswordPage` (Step 2: render OTPInput, countdown timer, lockout message) trong `frontend/tests/auth/ForgotPasswordPage.test.jsx`
- [ ] T044 [P] Viết component test cho `ForgotPasswordPage` (Step 3: render password form, validate độ mạnh, xác nhận khớp, gọi API thành công/lỗi, redirect login) trong `frontend/tests/auth/ForgotPasswordPage.test.jsx`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Hoàn thiện tài liệu, logging, cleanup

- [ ] T045 [P] Thêm Swagger JSDoc cho 3 endpoint trong `backend/src/routes/auth.routes.js` — Mỗi endpoint có @swagger tag, request body schema, response examples (200, 400, 429, 500)
- [ ] T046 [P] Thêm Pino audit log trong `backend/src/services/auth.service.js` — Log các sự kiện: FORGOT_PASSWORD_OTP_SENT, FORGOT_PASSWORD_OTP_VERIFIED, FORGOT_PASSWORD_SUCCESS, FORGOT_PASSWORD_LOCKOUT. KHÔNG log OTP plaintext, password, hash
- [ ] T047 Cập nhật `share_context.md` — Thêm 3 API contracts vào phần Member 1 APIs
- [ ] T048 [P] Chạy `npm run lint` backend + frontend, sửa toàn bộ ESLint errors
- [ ] T049 [P] Chạy toàn bộ test suite: `npm test` backend + frontend, xác nhận tất cả pass
- [ ] T050 Chạy quickstart.md validation — Test từng curl command, xác nhận kết quả khớp với api-contracts.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Không phụ thuộc — bắt đầu ngay
- **Foundational (Phase 2)**: Phụ thuộc Setup hoàn thành — BLOCKS tất cả User Stories
- **User Story 1+4 (Phase 3)**: Phụ thuộc Foundational hoàn thành — Có thể chạy song song một phần với Phase 4, 5
- **User Story 2 (Phase 4)**: Phụ thuộc Phase 3 Backend Core (T010, T011) — Mở rộng logic đã có
- **User Story 3 (Phase 5)**: Phụ thuộc Phase 3 Backend Core (T010, T011) — Mở rộng logic đã có
- **Frontend Tests (Phase 6)**: Phụ thuộc Phase 3, 4, 5 Frontend hoàn thành
- **Polish (Phase 7)**: Phụ thuộc tất cả Phase trước hoàn thành

### User Story Dependencies

- **US1+US4 (P1)**: Có thể bắt đầu sau Foundational — Không phụ thuộc stories khác
- **US2 (P2)**: Phụ thuộc US1 Backend Core — US2 mở rộng verifyResetOTP và requestResetPassword
- **US3 (P2)**: Phụ thuộc US1 Backend Core — US3 mở rộng requestResetPassword và verifyResetOTP

### Trong cùng Phase 3 (US1+US4)

- Backend Service (T010-T013) → Backend API (T014-T016)
- Frontend Context (T017) → Frontend Pages (T018-T020) → Route (T021-T022)
- Backend API và Frontend có thể chạy song song
- API Integration (T023) có thể chạy song song với Pages
- Tests (T024-T028) viết SAU khi Backend API hoàn thành

### Parallel Opportunities

- T002, T003 có thể chạy song song (Phase 1)
- T005, T006, T007, T009 có thể chạy song song (Phase 2)
- T013 (email template) có thể chạy song song với T010-T012 (Phase 3 Backend)
- T018, T019, T020 (3 page components) có thể chạy song song (Phase 3 Frontend)
- T023 (API integration) có thể chạy song song với T018-T020
- T024, T025, T026 (integration tests) có thể chạy song song (Phase 3 Tests)
- T042, T043, T044 (component tests) có thể chạy song song (Phase 6)
- T045, T046 (Swagger + Logging) có thể chạy song song (Phase 7)

---

## Implementation Strategy

### MVP First (User Story 1+4 Only)

1. Hoàn thành Phase 1: Setup
2. Hoàn thành Phase 2: Foundational (CRITICAL)
3. Hoàn thành Phase 3: US1+US4 — Khôi phục mật khẩu + Chống enumeration
4. **STOP và VALIDATE**: Test luồng chính end-to-end
5. Demo nếu sẵn sàng

### Incremental Delivery

1. Setup + Foundational → Nền tảng sẵn sàng
2. US1+US4 → Test độc lập → Demo (MVP!)
3. US2 → Test lockout → Tích hợp → Demo
4. US3 → Test cooldown → Tích hợp → Demo
5. Mỗi story thêm giá trị mà không phá vỡ story trước

---

## Notes

- [P] tasks = khác file, không phụ thuộc → có thể chạy song song
- [Story] label map task về User Story cụ thể để traceability
- Mỗi User Story nên có thể hoàn thành và test độc lập
- Commit sau mỗi task hoặc nhóm task logic
- Dừng ở mỗi checkpoint để validate story độc lập
- Tránh: task mơ hồ, conflict cùng file, phụ thuộc chéo giữa các story
- Tổng: 50 tasks, ước tính ~7 giờ

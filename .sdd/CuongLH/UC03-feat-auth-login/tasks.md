# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.)

---

# Tasks: Authentication Login (Đăng nhập) — UC03

**Input**: Tài liệu thiết kế từ `.sdd/CuongLH/UC03-feat-auth-login/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/auth-api.md ✅, quickstart.md ✅

**Tests**: Unit test cho Service layer (mục tiêu 80% coverage), Integration test cho API endpoint, Component test cho LoginPage (theo AGENTS.md Section 9)

**Organization**: Nhiệm vụ được nhóm theo User Story để triển khai và kiểm thử độc lập. Tất cả 5 User Story đều có mức ưu tiên P1 (phạm vi MVP).

---

## Format: `[ID] [P?] [Story] Mô tả`

- **[P]**: Chạy được song song với task khác (khác file, không phụ thuộc lẫn nhau)
- **[Story]**: Task này thuộc User Story nào (US1 đến US5)
- Mỗi task ghi rõ đường dẫn file sẽ chỉnh sửa

---

## Phase 1: Setup (Thiết lập hạ tầng dùng chung)

**Mục đích**: Khởi tạo bảng dữ liệu xác thực và file cấu hình môi trường.

- [ ] T001 Cập nhật Prisma schema — thêm 4 bảng xác thực (`roles`, `users`, `user_sessions`, `login_attempts`) vào `backend/prisma/schema.prisma`
- [ ] T002 Chạy lệnh tạo Prisma Migration: `npx prisma migrate dev --name create_auth_tables`
- [ ] T003 [P] Tạo file `.env` cho Backend — thêm biến `SECRET_KEY` và `FRONTEND_ORIGIN` vào `backend/.env`
- [ ] T004 [P] Tạo file `.env` cho Frontend — thêm biến `REACT_APP_API_BASE_URL` vào `frontend/.env`

**Checkpoint**: Database schema đã sẵn sàng, biến môi trường đã được cấu hình.

---

## Phase 2: Foundational (Nền tảng cốt lõi — bắt buộc)

**Mục đích**: Xây dựng hạ tầng cốt lõi. **BẮT BUỘC** hoàn thành trước khi làm bất kỳ User Story nào.

**⚠️ QUAN TRỌNG**: Chưa hoàn thành Phase 2 thì chưa được bắt đầu code User Story.

- [ ] T005 Seed dữ liệu cho bảng `roles` (VOLUNTEER, STAFF, MANAGER, ADMIN) và tạo tài khoản mẫu trong `backend/prisma/seed.js`
- [ ] T006 Chạy lệnh seed vào database: `npx prisma db seed`
- [ ] T007 [P] Viết hàm `signToken()`, `verifyToken()`, `setTokenToCookie()` trong `backend/src/utils/jwt.util.js`
- [ ] T008 [P] Kiểm tra file `backend/src/utils/response.util.js` — đảm bảo đã có `successResponse()` và `errorResponse()`
- [ ] T009 [P] Cấu hình CORS trong `backend/src/app.js` — bật `credentials: true`, dùng `FRONTEND_ORIGIN` từ `.env`
- [ ] T010 [P] Cấu hình middleware `cookie-parser` trong `backend/src/app.js`
- [ ] T011 Viết `auth.repository.js` trong `backend/src/repositories/auth.repository.js` với các hàm: `findUserByEmail`, `upsertSession`, `getLoginAttempts`, `incrementLoginAttempts`, `resetLoginAttempts`
- [ ] T012 Viết Zod schema xác thực đầu vào cho login trong `backend/src/middlewares/validators/auth.validator.js` — kiểm tra email đúng định dạng, password không được rỗng

**Checkpoint**: Hạ tầng nền tảng đã sẵn sàng. Từ đây có thể triển khai song song các User Story.

---

## Phase 3: User Story 1 — Successful Login (Đăng nhập thành công) 🎯 MVP

**Mục tiêu**: Người dùng nhập email và password hợp lệ, hệ thống tạo JWT chứa `{user_id, email, role_id, role_name, jti}`, lưu vào HttpOnly Cookie, trả về thông tin user. Frontend điều hướng theo `role_name` dùng `roleRouteMap`.

**Cách test độc lập**: Gọi `POST /api/v1/auth/login` với thông tin hợp lệ (email `volunteer@test.com`, password `Test123!`). Kiểm tra HTTP 200, JWT cookie được set, user data trả về đầy đủ.

### Tests for User Story 1 (Kiểm thử)

- [ ] T013 [P] [US1] Viết integration test — valid credentials → HTTP 200 + JWT cookie + user data tại `backend/tests/integration/auth.login.test.js`
- [ ] T014 [P] [US1] Viết integration test — xác minh cookie attributes: `httpOnly=true`, `secure`, `sameSite=lax`, `maxAge=604800` tại `backend/tests/integration/auth.login.test.js`
- [ ] T015 [P] [US1] Viết unit test — `loginService()` happy path, mock toàn bộ repository tại `backend/tests/unit/auth.service.test.js`

### Implementation for User Story 1 (Triển khai Backend)

- [ ] T016 [US1] Viết hàm `loginService()` trong `backend/src/services/auth.service.js`: normalize email → tìm user → verify password với bcrypt → kiểm tra `is_active` → kiểm tra `email_verified` → tạo JWT chứa jti → upsert session → reset login attempts → trả về user (không có `password_hash`)
- [ ] T017 [US1] Viết controller `login` trong `backend/src/controllers/auth.controller.js`: lấy email, password từ `req.body` → gọi `loginService()` → set HttpOnly cookie với JWT qua `setTokenToCookie()` → trả về `successResponse` kèm user data
- [ ] T018 [US1] Đăng ký route `POST /api/v1/auth/login` trong `backend/src/routes/auth.routes.js` — gắn middleware validate login + controller `login`

### Implementation for User Story 1 (Triển khai Frontend)

- [ ] T019 [US1] Viết `AuthProvider` trong `frontend/src/contexts/authContext.context.js` — quản lý state: `user`, `loading`, hàm `login()`, `logout()`, `updateUser()`, `initializeUser()`, các helper kiểm tra role (`isVolunteer`, `isStaff`, `isManager`, `isAdmin`)
- [ ] T020 [US1] Viết hook `useAuth` trong cùng file `frontend/src/contexts/authContext.context.js` — gọi `useContext(AuthContext)`, throw error nếu dùng ngoài AuthProvider
- [ ] T021 [US1] Viết `authService` trong `frontend/src/services/auth.service.js` — các hàm `login(email, password)`, `logout()`, `forgotPassword(email)`, `changePassword(data)` gọi API backend qua axios
- [ ] T022 [US1] Viết component `LoginPage` trong `frontend/src/components/pages/LoginPage.jsx` — form nhập email, password dùng `react-hook-form` → state `isSubmitting` để chống double-submit → gọi `authService.login()` → nếu thành công: `setUser()` + điều hướng theo `role_id` → nếu lỗi: hiển thị `toast.error` hoặc `toast.warning`
- [ ] T023 [US1] Kiểm tra `frontend/src/api/axiosApi.js` — đảm bảo `withCredentials: true` và response interceptor xử lý: 401 → redirect `/login`, 403 → redirect role home, 500 → `console.error`
- [ ] T024 [US1] Bọc toàn bộ App trong `AuthProvider` tại `frontend/src/App.js` (hoặc `frontend/src/index.js`)
- [ ] T024b [NEW] [P] [US1] Tạo constants `ROLES` và `roleRouteMap` trong `frontend/src/constants/roles.js` — map mỗi role tới route mặc định (VOLUNTEER → `/home`, STAFF → `/staff/dashboard`, MANAGER → `/manager/dashboard`, ADMIN → `/admin/dashboard`)
- [ ] T024c [NEW] [P] [US1] Viết guard `GuestRoute` trong `frontend/src/components/guards/GuestRoute.jsx` — nếu đã đăng nhập thì redirect về role home (dùng `roleRouteMap`), nếu chưa thì render children
- [ ] T024d [NEW] [P] [US1] Viết guard `ProtectedRoute` trong `frontend/src/components/guards/ProtectedRoute.jsx` — nếu chưa đăng nhập thì redirect về `/login`, nếu rồi thì render children
- [ ] T024e [NEW] [P] [US1] Viết `userService` trong `frontend/src/services/user.service.js` — hàm `getMe()` gọi `GET /api/v1/auth/me` để khởi tạo auth state khi reload trang

**Checkpoint**: User Story 1 hoàn tất. Kiểm tra: đăng nhập thành công, JWT cookie xuất hiện, user data trả về đúng.

---

## Phase 4: User Story 2 — Invalid Credentials (Chặn đăng nhập với thông tin sai)

**Mục tiêu**: Khi người dùng nhập sai email hoặc password, hệ thống từ chối với HTTP 401 và message chung chung, không tiết lộ email có tồn tại hay không.

**Cách test độc lập**:

- Gọi API với email không tồn tại → HTTP 401, message: "Email hoặc mật khẩu chưa chính xác"
- Gọi API với email đúng nhưng password sai → HTTP 401, message: "Email hoặc mật khẩu chưa chính xác"
- Cả hai trường hợp trả về cùng một message, không phân biệt

### Tests for User Story 2 (Kiểm thử)

- [ ] T025 [P] [US2] Viết integration test — email không tồn tại → HTTP 401 + message chung (không leak email existence) tại `backend/tests/integration/auth.login.test.js`
- [ ] T026 [P] [US2] Viết integration test — password sai → HTTP 401 + cùng message chung tại `backend/tests/integration/auth.login.test.js`
- [ ] T027 [P] [US2] Viết integration test — email sai định dạng → HTTP 400 validation error tại `backend/tests/integration/auth.login.test.js`
- [ ] T028 [P] [US2] Viết integration test — response không chứa `password_hash` trong bất kỳ trường hợp nào tại `backend/tests/integration/auth.login.test.js`
- [ ] T029 [P] [US2] Viết unit test — `loginService()` xử lý user không tồn tại tại `backend/tests/unit/auth.service.test.js`
- [ ] T030 [P] [US2] Viết unit test — `loginService()` xử lý password không khớp tại `backend/tests/unit/auth.service.test.js`

### Implementation for User Story 2 (Triển khai)

- [ ] T031 [US2] Viết middleware `validate` dùng chung trong `backend/src/validators/validate.js` — dùng pattern `safeParse`: Zod schema → nếu lỗi trả 400 với chi tiết lỗi → nếu ok gọi `next()` với `req.body` đã parsed
- [ ] T032 [US2] Cập nhật `loginService()` trong `backend/src/services/auth.service.js` — trường hợp email không tồn tại: tăng login attempts rồi throw 401 "Email hoặc mật khẩu chưa chính xác"
- [ ] T033 [US2] Cập nhật `loginService()` trong `backend/src/services/auth.service.js` — trường hợp password sai: tăng login attempts rồi throw 401 với cùng message chung
- [ ] T034 [US2] Kiểm tra `errorResponse()` trong `backend/src/utils/response.util.js` — đảm bảo định dạng lỗi nhất quán, không chứa dữ liệu nhạy cảm
- [ ] T035 [US2] Thêm logging vào `loginService()` trong `backend/src/services/auth.service.js` — dùng Pino logger, **KHÔNG** log plaintext password, password_hash, hoặc token. Chỉ log userId, email
- [ ] T036 [US2] Cập nhật `LoginPage` trong `frontend/src/components/pages/LoginPage.jsx` — hiển thị lỗi: nếu `error.code === 'ACCOUNT_LOCKED'` → `toast.warning`, các lỗi khác → `toast.error` với message từ `error.response?.data?.message`

**Checkpoint**: User Story 2 hoàn tất. Kiểm tra: thông tin sai bị từ chối với HTTP 401, message chung, không leak dữ liệu.

---

## Phase 5: User Story 3 — Account Lockout (Khóa tài khoản sau 5 lần sai)

**Mục tiêu**: Sau 5 lần đăng nhập sai liên tiếp, tài khoản bị khóa 15 phút. Trong thời gian khóa, không thể đăng nhập dù password đúng. Sau 15 phút, tự động mở khóa.

**Cách test độc lập**:

- Nhập sai password 5 lần → lần thứ 5 trả HTTP 429 "Tài khoản tạm thời bị khóa..."
- Khi đang bị khóa, nhập đúng password → vẫn HTTP 429
- Sau 15 phút (mock thời gian), nhập đúng password → HTTP 200 thành công

### Tests for User Story 3 (Kiểm thử)

- [ ] T037 [P] [US3] Viết integration test — 5 lần sai kích hoạt khóa → HTTP 429 + `locked_until` timestamp tại `backend/tests/integration/auth.lockout.test.js`
- [ ] T038 [P] [US3] Viết integration test — đang khóa vẫn bị chặn dù password đúng → HTTP 429 tại `backend/tests/integration/auth.lockout.test.js`
- [ ] T039 [P] [US3] Viết integration test — tự động mở khóa sau 15 phút → dùng `jest.useFakeTimers` để mock thời gian tại `backend/tests/integration/auth.lockout.test.js`
- [ ] T040 [P] [US3] Viết integration test — counter reset khi đăng nhập thành công (3 lần sai → 1 lần đúng → counter về 0) tại `backend/tests/integration/auth.lockout.test.js`
- [ ] T041 [P] [US3] Viết unit test — logic tăng/giảm login attempt counter tại `backend/tests/unit/auth.service.test.js`

### Implementation for User Story 3 (Triển khai)

- [ ] T042 [US3] Cập nhật `loginService()` trong `backend/src/services/auth.service.js` — kiểm tra lockout: nếu `locked_until > NOW()` → throw 429 "Tài khoản tạm thời bị khóa..." kèm `locked_until` trong `details`
- [ ] T043 [US3] Cập nhật `incrementLoginAttempts()` trong `backend/src/repositories/auth.repository.js` — tăng attempts → nếu `attempts >= 5` set `locked_until = NOW() + 15 phút`
- [ ] T044 [US3] Cập nhật `loginService()` — gọi `incrementLoginAttempts()` khi email không tồn tại
- [ ] T045 [US3] Cập nhật `loginService()` — gọi `incrementLoginAttempts()` khi password không khớp
- [ ] T046 [US3] Cập nhật `loginService()` — gọi `resetLoginAttempts()` khi đăng nhập thành công để xóa record trong `login_attempts`
- [ ] T047 [US3] Cập nhật error handler trong `backend/src/controllers/auth.controller.js` — trả HTTP 429 cho lỗi lockout
- [ ] T048 [US3] Cập nhật `LoginPage` trong `frontend/src/components/pages/LoginPage.jsx` — nếu `error.code === 'ACCOUNT_LOCKED'` hiển thị `toast.warning` với message khóa và thời gian `locked_until`

**Checkpoint**: User Story 3 hoàn tất. Kiểm tra: khóa sau 5 lần sai, chặn trong 15 phút, tự mở khóa.

---

## Phase 6: User Story 4 — Single Active Session (Một phiên đăng nhập duy nhất)

**Mục tiêu**: Mỗi user chỉ có một phiên đăng nhập active. Đăng nhập mới sẽ ghi đè phiên cũ (jti cũ bị invalidate). Token cũ sẽ bị từ chối với HTTP 401.

**Cách test độc lập**:

- User A đăng nhập trên Thiết bị 1 → nhận JWT với `jti_1`
- User A đăng nhập trên Thiết bị 2 → nhận JWT với `jti_2`
- Gọi API với token `jti_1` (cũ) → HTTP 401 "Phiên đăng nhập không hợp lệ"
- Gọi API với token `jti_2` (mới) → HTTP 200 thành công

### Tests for User Story 4 (Kiểm thử)

- [ ] T049 [P] [US4] Viết integration test — đăng nhập lần 2 tạo jti mới, lưu vào `user_sessions` với UNIQUE(user_id) tại `backend/tests/integration/auth.session.test.js`
- [ ] T050 [P] [US4] Viết integration test — token cũ (jti cũ) bị từ chối → HTTP 401 "Phiên đăng nhập không hợp lệ" tại `backend/tests/integration/auth.session.test.js`
- [ ] T051 [P] [US4] Viết integration test — token mới (jti mới) vẫn hợp lệ → HTTP 200 tại `backend/tests/integration/auth.session.test.js`
- [ ] T052 [P] [US4] Viết unit test — `upsertSession()` dùng UNIQUE constraint ghi đè session cũ tại `backend/tests/unit/auth.repository.test.js`

### Implementation for User Story 4 (Triển khai)

- [ ] T053 [US4] Viết middleware `authenticate` trong `backend/src/middlewares/auth.middleware.js` — lấy JWT từ cookie → verify chữ ký → lấy jti → query `user_sessions` → nếu jti không khớp hoặc `expiresAt < NOW()`: clear cookie + xóa session hết hạn + 401 "Phiên đăng nhập không hợp lệ" → nếu jti hợp lệ: inject `req.user` (user_id, email, role_id, role_name)
- [ ] T054 [US4] Cập nhật `loginService()` trong `backend/src/services/auth.service.js` — tạo jti dạng composite `${userId}-${Date.now()}-${crypto.randomUUID()}` và gọi `upsertSession()` với user_id, jti mới, expires_at = NOW() + 7 ngày
- [ ] T055 [US4] Kiểm tra `upsertSession()` trong `backend/src/repositories/auth.repository.js` — dùng Prisma `upsert` với UNIQUE constraint trên `user_id` để ghi đè jti cũ
- [ ] T056 [US4] Gắn middleware `authenticate` vào các route cần bảo vệ (ví dụ: user profile) trong `backend/src/routes/user.routes.js`
- [ ] T057 [US4] Gắn middleware `authenticate` cho tất cả API endpoint yêu cầu xác thực

**Checkpoint**: User Story 4 hoàn tất. Kiểm tra: một user một session, token cũ bị vô hiệu khi đăng nhập lại.

---

## Phase 7: User Story 5 — Disabled Account (Chặn tài khoản bị vô hiệu / chưa xác thực email)

**Mục tiêu**:

- User có `is_active = false` không được đăng nhập (HTTP 403 "Tài khoản đã bị vô hiệu hóa")
- User có `email_verified = false` không được đăng nhập (HTTP 403 "Email chưa được xác thực")
- Nếu user bị vô hiệu hóa sau khi đã đăng nhập, các API call tiếp theo bị từ chối

**Cách test độc lập**:

- Set `is_active = false` cho một user → thử đăng nhập → HTTP 403
- Set `email_verified = false` cho một user → thử đăng nhập → HTTP 403
- Đăng nhập thành công → Admin set `is_active = false` → gọi protected API → HTTP 403

### Tests for User Story 5 (Kiểm thử)

- [ ] T058 [P] [US5] Viết integration test — tài khoản bị vô hiệu (`is_active = false`) → HTTP 403 "Tài khoản đã bị vô hiệu hóa" tại `backend/tests/integration/auth.status.test.js`
- [ ] T059 [P] [US5] Viết integration test — email chưa xác thực (`email_verified = false`) → HTTP 403 "Email chưa được xác thực" tại `backend/tests/integration/auth.status.test.js`
- [ ] T060 [P] [US5] Viết integration test — tài khoản bị vô hiệu sau khi đã đăng nhập → protected API call tiếp theo → HTTP 403 tại `backend/tests/integration/auth.status.test.js`
- [ ] T061 [P] [US5] Viết unit test — kiểm tra `is_active` và `email_verified` trong `loginService()` tại `backend/tests/unit/auth.service.test.js`

### Implementation for User Story 5 (Triển khai)

- [ ] T062 [US5] Cập nhật `loginService()` trong `backend/src/services/auth.service.js` — sau khi verify password, kiểm tra `is_active`: nếu false throw 403 "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên."
- [ ] T063 [US5] Cập nhật `loginService()` — sau khi kiểm tra `is_active`, kiểm tra `email_verified`: nếu false throw 403 "Email chưa được xác thực. Vui lòng kiểm tra hộp thư để xác thực tài khoản."
- [ ] T064 [US5] Cập nhật error handler trong `backend/src/controllers/auth.controller.js` — trả HTTP 403 cho lỗi tài khoản bị vô hiệu / chưa xác thực email
- [ ] T065 [US5] Cập nhật middleware `authenticate` trong `backend/src/middlewares/auth.middleware.js` — kiểm tra lại `is_active` và `email_verified` trên mỗi protected request: nếu bị vô hiệu thì throw 403
- [ ] T066 [US5] Cập nhật `LoginPage` trong `frontend/src/components/pages/LoginPage.jsx` — xử lý HTTP 403: `ACCOUNT_DISABLED` → hiển thị "Tài khoản đã bị vô hiệu hóa", `EMAIL_NOT_VERIFIED` → hiển thị "Email chưa được xác thực", 403 khác → message chung

**Checkpoint**: User Story 5 hoàn tất. Kiểm tra: tài khoản vô hiệu / chưa xác thực email không thể đăng nhập hoặc dùng protected endpoint.

---

## Phase 8: Polish & Cross-Cutting Concerns (Hoàn thiện & Kiểm tra chất lượng)

**Mục đích**: Tài liệu Swagger, kiểm tra code style, chạy toàn bộ test, xác minh bảo mật.

- [ ] T067 [P] Viết Swagger JSDoc cho route `POST /api/v1/auth/login` trong `backend/src/routes/auth.routes.js` — document: requestBody schema, các mã response (200, 400, 401, 403, 429, 500), ví dụ mẫu
- [ ] T068 [P] Thêm comment giải thích logic nghiệp vụ trong `backend/src/services/auth.service.js` — mô tả từng bước: kiểm tra lockout → tìm user → verify password → kiểm tra trạng thái → tạo JWT → quản lý session
- [ ] T069 [P] Rà soát tất cả error path — đảm bảo đúng HTTP status code: 400 (validation), 401 (xác thực), 403 (vô hiệu), 429 (khóa), 500 (lỗi server)
- [ ] T070 [P] Chạy `npm run lint` trong thư mục `backend/` — sửa toàn bộ lỗi ESLint
- [ ] T071 [P] Chạy `npm run lint` trong thư mục `frontend/` — sửa toàn bộ lỗi ESLint
- [ ] T072 Chạy backend unit test: `npm test -- backend/tests/unit/` — xác minh coverage auth.service.js đạt 80%+
- [ ] T073 Chạy backend integration test: `npm test -- backend/tests/integration/` — xác minh tất cả 5 User Story pass
- [ ] T074 Chạy frontend component test: `npm test -- frontend/tests/` — xác minh LoginPage test pass
- [ ] T075 Cập nhật `quickstart.md` — thêm các bước setup đã xác minh, lệnh test, checklist test thủ công
- [ ] T076 Kiểm tra `response.util.js` — đảm bảo định dạng response nhất quán trên tất cả auth endpoint
- [ ] T077 Rà soát và ghi lại tất cả biến môi trường cần thiết vào `.env.example`
- [ ] T078 Thêm comment bảo mật trong `auth.service.js` — xác nhận: password KHÔNG bị log, password_hash KHÔNG bị trả về, token KHÔNG bị log, cookie value KHÔNG bị log
- [ ] T079 Security test thủ công: Mở browser console, gõ `document.cookie` — xác minh KHÔNG đọc được HttpOnly cookie
- [ ] T080 Security test thủ công: Gọi API từ origin khác — xác minh CORS chỉ cho phép credentials từ `FRONTEND_ORIGIN`

**Checkpoint**: Toàn bộ tính năng hoàn tất. Code sạch, test pass, bảo mật được xác minh.

---

## Dependencies & Execution Order (Phụ thuộc & Thứ tự thực thi)

### Phase Dependencies (Phụ thuộc giữa các Phase)

```
Phase 1: Setup ─────────────────────────────────────────────────────────────►
                                                                             │
Phase 2: Foundational ──────────────────────────────────────────────────────►│
                                                                             │
                                      ┌──────────────────────────────────────┘
                                      ▼
              ┌──────────────────── Phase 3: US1 (Đăng nhập thành công)
              │
              ├──────────────────── Phase 4: US2 (Chặn thông tin sai)
              │
Phase 2 done ─┼──────────────────── Phase 5: US3 (Khóa tài khoản)            Có thể chạy
              │                                                                song song
              ├──────────────────── Phase 6: US4 (Single Session)
              │
              └──────────────────── Phase 7: US5 (Tài khoản vô hiệu)

                                      │
                                      ▼ (Sau khi tất cả US hoàn tất)

                               Phase 8: Polish (Hoàn thiện)
```

- **Phase 1 (Setup)**: Không phụ thuộc — bắt đầu ngay
- **Phase 2 (Foundational)**: Phụ thuộc Phase 1 — CHẶN tất cả User Story
- **Phase 3–7 (US1–US5)**: Phụ thuộc Phase 2 — có thể chạy song song với nhau
- **Phase 8 (Polish)**: Phụ thuộc tất cả User Story hoàn tất

### User Story Dependencies (Phụ thuộc giữa các User Story)

- **US1 (Đăng nhập thành công)**: Không phụ thuộc US nào — làm ngay sau Phase 2
- **US2 (Chặn thông tin sai)**: Không phụ thuộc — mở rộng xử lý lỗi cho US1
- **US3 (Account Lockout)**: Không phụ thuộc — tính năng độc lập
- **US4 (Single Active Session)**: Không phụ thuộc — tính năng độc lập
- **US5 (Chặn tài khoản vô hiệu)**: Không phụ thuộc — tính năng độc lập

### Within Each User Story (Trong mỗi User Story)

- Test (có tag [P]) có thể chạy song song với nhau
- Triển khai theo thứ tự: Repository → Service → Validator → Controller → Routes → Frontend

### Parallel Opportunities (Cơ hội chạy song song)

- **Phase 1**: T003, T004 [P] (khác file `.env`)
- **Phase 2**: T007, T008, T009, T010 [P] (utilities và middleware không phụ thuộc nhau)
- **Phase 3–7**: Tất cả task test có tag [P] trong cùng một Phase
- **Giữa các Phase**: Sau khi Phase 2 xong, cả 5 User Story có thể chạy song song bởi các developer khác nhau

---

## Ví dụ chạy song song: User Story 1

```bash
# Viết test song song (cùng tag [P]):
T013: Integration test - đăng nhập thành công
T014: Integration test - JWT cookie attributes
T015: Unit test - loginService() happy path

# Triển khai (sau khi test pass):
T016: Viết loginService()
T019: Viết AuthProvider (authContext)
T021: Viết authService (frontend)
(Không phụ thuộc chéo, khác file)

# Tích hợp (phụ thuộc các bước trên):
T022: Viết LoginPage (phụ thuộc T016, T019, T021, T024b)
```

---

## Implementation Strategy (Chiến lược triển khai)

### MVP First (Chỉ User Story 1)

1. Hoàn thành Phase 1: Setup (database, biến môi trường)
2. Hoàn thành Phase 2: Foundational (schema, seed, utilities)
3. Hoàn thành Phase 3: User Story 1 (happy path đăng nhập)
4. **DỪNG và KIỂM TRA**: Test đăng nhập thành công, JWT cookie, user data đúng
5. Demo cho stakeholder nếu sẵn sàng

### Incremental Delivery (Phân phối tăng dần)

1. Setup + Foundational → Nền tảng sẵn sàng
2. Thêm US1 → Test độc lập → Demo (MVP!)
3. Thêm US2 → Test xử lý lỗi → Demo
4. Thêm US3 → Test lockout → Demo
5. Thêm US4 → Test session → Demo
6. Thêm US5 → Test trạng thái tài khoản → Demo
7. Hoàn thiện Polish & documentation

### Parallel Team Strategy (Chiến lược nhóm — 5 developer)

1. Cả nhóm: Cùng làm Setup + Foundational (T001–T012)
2. Sau khi Foundational xong:
   - Developer A: User Story 1 + tests (T013–T024e)
   - Developer B: User Story 2 + tests (T025–T036)
   - Developer C: User Story 3 + tests (T037–T048)
   - Developer D: User Story 4 + tests (T049–T057)
   - Developer E: User Story 5 + tests (T058–T066)
3. Code review song song → tất cả story tích hợp độc lập
4. Cuối cùng: Cả nhóm cùng làm Polish (T067–T080)

---

## Notes (Ghi chú)

- Tag **[P]** = khác file hoặc thao tác độc lập, chạy được song song
- Tag **[US1]–[US5]** = map task tới User Story cụ thể, dễ traceability
- Mỗi User Story hoàn thành và test được độc lập
- Nên viết test trước, xác minh test FAIL, rồi mới code (TDD)
- Commit sau mỗi Phase hoặc nhóm task logic
- Dừng ở bất kỳ Checkpoint nào để xác minh story độc lập
- Tất cả 5 User Story đều là Priority P1 — toàn bộ đều thuộc phạm vi MVP
- Security test ở Phase 8 là **bắt buộc** trước khi đưa lên production

---

## Tổng kết

**Tổng số task**: 85 task, 8 Phase

| Phase | Tên | Số task |
|-------|-----|---------|
| Phase 1 | Setup (Thiết lập) | 4 |
| Phase 2 | Foundational (Nền tảng) | 8 |
| Phase 3 | US1 — Đăng nhập thành công | 17 |
| Phase 4 | US2 — Chặn thông tin sai | 12 |
| Phase 5 | US3 — Khóa tài khoản | 12 |
| Phase 6 | US4 — Single Session | 9 |
| Phase 7 | US5 — Tài khoản vô hiệu | 9 |
| Phase 8 | Polish (Hoàn thiện) | 14 |

**Tiêu chí test độc lập cho từng User Story**:

| Story | Mô tả | Tiêu chí |
|-------|-------|----------|
| US1 | Đăng nhập thành công | Valid credentials → HTTP 200 + JWT cookie + user data |
| US2 | Chặn thông tin sai | Invalid credentials → HTTP 401, message chung, không leak email |
| US3 | Khóa tài khoản | 5 lần sai → khóa 15 phút → tự mở khóa |
| US4 | Single Session | Đăng nhập mới ghi đè session cũ → token cũ bị vô hiệu |
| US5 | Tài khoản vô hiệu | is_active=false hoặc email_verified=false → HTTP 403 |

**Phạm vi MVP đề xuất**: Hoàn thành Phase 1 + Phase 2 + Phase 3 (US1) là đã có chức năng đăng nhập tối thiểu.

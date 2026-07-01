# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.)

# Kế Hoạch Triển Khai: Quên Mật Khẩu (Forgot Password)

**Branch**: `CuongLH` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)

**Input**: Đặc tả tính năng từ `.sdd/CuongLH/UC07-feat-auth-forgot-password/spec.md`

**Lưu ý**: Kế hoạch này được tạo bởi workflow `/speckit-plan` theo `.specify/templates/plan-template.md`.

## Summary

UC07 triển khai luồng khôi phục mật khẩu an toàn 3 bước cho VMS với xác thực email qua OTP. Người dùng quên mật khẩu có thể yêu cầu gửi OTP 6 chữ số đến email đã đăng ký (Bước 1), xác thực OTP trong vòng 10 phút (Bước 2), và đặt mật khẩu mới (Bước 3). Hệ thống thực thi các biện pháp bảo mật nghiêm ngặt: không tiết lộ người dùng (cùng phản hồi cho email tồn tại/không tồn tại), cooldown 60 giây giữa các yêu cầu OTP, khóa tài khoản sau 5 lần thất bại trong 15 phút, và chống tấn công thời gian.

Cách tiếp cận kỹ thuật: Backend sử dụng Express + Prisma + MySQL với bảng `email_verifications` dùng chung (type discriminator cho REGISTER vs RESET_PASSWORD), xác thực Zod, và NodeMailer gửi email không đồng bộ với xử lý lỗi im lặng. Frontend dùng React với Context API + sessionStorage quản lý trạng thái multi-step. Các bản ghi OTP được xóa mềm sau khi khôi phục mật khẩu thành công, và các bản ghi hết hạn được dọn dẹp qua các công việc định kỳ.

## Technical Context

**Ngôn ngữ/Phiên bản**: NodeJS v18+ + JavaScript ESM

**Các Dependencies chính**: Express 5.x, Prisma ORM, MySQL 8.x, Zod, bcryptjs (12 rounds), NodeMailer, Pino logger

**Lưu trữ**: Cơ sở dữ liệu MySQL với các bảng: `users`, `email_verifications` (dùng chung với UC04 Register)

**Testing**: Jest + Supertest cho integration tests backend, Jest + React Testing Library cho frontend

**Nền tảng đích**: Web application (Backend REST API + React SPA, desktop-first)

**Loại dự án**: Web service (Backend REST API) + Web application (React SPA)

**Mục tiêu Hiệu Năng**:

- POST /forgot-password/request < 2s (bao gồm thời gian gửi email)
- POST /forgot-password/verify-otp < 500ms
- POST /forgot-password/reset < 1s
- Hỗ trợ 100 yêu cầu khôi phục mật khẩu đồng thời mà không giảm hiệu năng
- Email được gửi trong vòng 30 giây cho 90% yêu cầu

**Ràng buộc**:

- Không tiết lộ người dùng (chống tấn công thời gian: phương sai thời gian phản hồi < 100ms)
- Cooldown 60 giây giữa các yêu cầu OTP (chống spam)
- 5 lần thất bại xác thực OTP kích hoạt khóa 15 phút (bảo vệ brute-force)
- Hết hạn OTP 10 phút (cửa sổ bảo mật)
- OTP PHẢI được hash trước khi lưu (ràng buộc Layer 1 - KHÔNG bao giờ lưu plaintext)
- Mật khẩu PHẢI được hash bcrypt với 12 rounds
- Kiểm tra locked_until TRƯỚC kiểm tra cooldown (ngăn bypass khóa)

**Quy mô/Phạm vi**:

- Dự kiến khôi phục mật khẩu: ~50 yêu cầu/ngày trong MVP
- Cơ sở dữ liệu: bảng `email_verifications` dùng chung với UC04 Register (type discriminator)
- Frontend: luồng multi-step 3 trang với persistence trạng thái qua sessionStorage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Layer 1 (Hard Rules) — Status: ✅ PASS

- ✅ **Lưu trữ Mật khẩu**: Mật khẩu mới PHẢI được hash bằng bcryptjs với BCRYPT_SALT_ROUNDS từ .env (mặc định: 12 rounds) trước khi lưu. Không có mật khẩu plaintext.
- ✅ **Lưu trữ OTP**: OTP PHẢI được hash trước khi lưu trong `email_verifications.otp_hash` bằng bcrypt. OTP plaintext chỉ tồn tại trong email đi và không bao giờ được ghi lại.
- ✅ **Phòng chống SQL Injection**: Sử dụng Prisma ORM với parameterized queries xuyên suốt.
- ✅ **Soft Delete**: N/A cho bản ghi OTP (bảng tạm với hết hạn dựa trên thời gian). Tài khoản người dùng sử dụng soft delete nhưng khôi phục mật khẩu không sửa đổi trạng thái active của người dùng.
- ✅ **Không Rò Rỉ Thông Tin Xác Thực**: Phản hồi API KHÔNG ĐƯỢC chứa password_hash, otp_hash, OTP plaintext, hoặc stack traces. Thông báo lỗi thân thiện người dùng mà không tiết lộ nội bộ.
- ✅ **UserId từ JWT**: N/A cho luồng khôi phục mật khẩu. Đây là các endpoint công khai cho người dùng không xác thực.
- ✅ **Không Bí Mật trong Git**: Tất cả thông tin SMTP trong `.env`, được gitignore.
- ✅ **Không Lưu Ngân Hàng/Thẻ**: N/A cho tính năng này. Không xử lý thanh toán.
- ✅ **Xác Thực Input**: Tất cả request payloads được xác thực bằng Zod schemas (định dạng email, định dạng OTP, độ mạnh mật khẩu) trước khi xử lý.
- ✅ **Authentication**: N/A cho các endpoint khôi phục mật khẩu công khai. Không yêu cầu JWT.
- ✅ **Upload File**: N/A cho tính năng này. Không upload file trong luồng khôi phục mật khẩu.

### Layer 2 (Architecture Constraints) — Status: ✅ PASS

- ✅ **Kiến Trúc Phân Tầng**: Tuân thủ mô hình Route → Middleware → Controller → Service → Repository.
  - Routes: `POST /api/v1/auth/forgot-password/request`, `POST /api/v1/auth/forgot-password/verify-otp`, `POST /api/v1/auth/forgot-password/reset`
  - Middleware: Zod validation middleware
  - Controller: `auth.controller.js` (tầng mỏng)
  - Service: `auth.service.js` (business logic: tạo/xác thực OTP, kiểm tra cooldown, thực thi khóa, chiến lược không tiết lộ người dùng)
  - Repository: `user.repository.js` (truy vấn người dùng), `otp.repository.js` (OTP CRUD)

- ✅ **Cross-Module Access**: Tính năng này được chứa trong Auth module của Member 1. Không có phụ thuộc cross-module. Chỉ đọc từ bảng `users` (sở hữu bởi Member 1).

- ✅ **Module Ownership**: Tất cả code nằm trong Auth module của Member 1 - CuongLH. Không sửa đổi code của các member khác.

- ✅ **Giao dịch Cơ sở dữ liệu**: Khôi phục mật khẩu sử dụng Prisma transaction để đảm bảo atomicity (cập nhật mật khẩu người dùng + soft-delete bản ghi OTP).

- ✅ **Audit Log**: Các sự kiện khôi phục mật khẩu PHẢI được ghi lại:
  - Event: `FORGOT_PASSWORD_OTP_SENT` (who: email, when: timestamp, what: send_otp, ip_address)
  - Event: `FORGOT_PASSWORD_OTP_VERIFIED` (who: email, when: timestamp, what: verify_otp)
  - Event: `FORGOT_PASSWORD_SUCCESS` (who: user_id, when: timestamp, what: password_reset)
  - Event: `FORGOT_PASSWORD_LOCKOUT` (who: email, when: timestamp, what: lockout_triggered, reason: "5_failed_attempts")
  - KHÔNG ghi lại: OTP plaintext, mật khẩu plaintext, password_hash, otp_hash, nội dung email

### Layer 3 (Engineering Standards) — Status: ✅ TARGET

- ✅ **Test Coverage**: Mục tiêu 80% cho `auth.service.js`, 60% cho `auth.controller.js`
- ✅ **Hiệu Năng**: Mục tiêu < 2s cho request OTP, < 500ms cho verify OTP, < 1s cho reset password (p95 với 100 yêu cầu đồng thời)
- ✅ **Linting**: ESLint 0 errors trước commit
- ✅ **Tests Traceability**: Các trường hợp test PHẢI ánh xạ tới acceptance criteria trong spec.md (§ User Stories 1-4)
- ✅ **API Response Format**: Tuân thủ định dạng tiêu chuẩn ADR-006:

  ```javascript
  { success: boolean, data?: any, error?: string }
  ```

### Biện Pháp Biện Minh Phức Tạp

Không phát hiện vi phạm. Tất cả ràng buộc được thỏa mãn.

## Cấu Trúc Dự Án

### Tài Liệu (tính năng này)

```text
.sdd/CuongLH/UC07-feat-auth-forgot-password/
├── context.md           # Tuyên bố vấn đề và kiến thức miền
├── spec.md              # Đặc tả tính năng với ký hiệu EARS
├── plan.md              # File này (kế hoạch triển khai)
├── research.md          # Phase 0: Nghiên cứu kỹ thuật và quyết định
├── data-model.md        # Phase 1: Schema cơ sở dữ liệu và thiết kế thực thể
├── quickstart.md        # Phase 1: Hướng dẫn bắt đầu nhanh phát triển
├── contracts/           # Phase 1: API contracts và request/response schemas
│   └── api-contracts.md
└── tasks.md             # Phase 2: Các tác vụ triển khai nguyên tử (tạo bởi /speckit-tasks)
```

### Mã Nguồn (thư mục gốc dự án)

```text
backend/
├── src/
│   ├── controllers/
│   │   └── auth.controller.js          # [MODIFY] Thêm requestResetPassword(), verifyResetOTP(), resetPassword()
│   ├── services/
│   │   ├── auth.service.js             # [MODIFY] Thêm business logic khôi phục mật khẩu
│   │   └── email.service.js            # [MODIFY] Thêm template sendResetPasswordOTP()
│   ├── repositories/
│   │   ├── user.repository.js          # [EXISTS] Tái sử dụng findByEmail(), updatePassword()
│   │   └── otp.repository.js           # [EXISTS] Dùng chung với UC04, tái sử dụng các phương thức CRUD
│   ├── middlewares/
│   │   └── validators/
│   │       └── auth.validator.js       # [MODIFY] Thêm Zod schemas cho các endpoint khôi phục mật khẩu
│   ├── routes/
│   │   └── auth.routes.js              # [MODIFY] Thêm 3 route POST
│   ├── utils/
│   │   ├── otp.util.js                 # [EXISTS] Dùng chung với UC04, tái sử dụng logic tạo OTP
│   │   └── response.util.js            # [EXISTS] Tái sử dụng response formatter
│   └── config/
│       └── email.config.js             # [EXISTS] Cấu hình NodeMailer SMTP
├── prisma/
│   ├── schema.prisma                   # [EXISTS] Mô hình EmailVerification đã được tạo bởi UC04
│   └── migrations/                     # [N/A] Không cần migration mới (bảng dùng chung)
└── tests/
    └── integration/
        └── auth.forgot-password.test.js    # [CREATE] Integration tests cho luồng khôi phục mật khẩu

frontend/
├── src/
│   ├── pages/
│   │   └── auth/
│   │       ├── ForgotPasswordStep1.jsx     # [CREATE] Bước 1: Nhập email
│   │       ├── ForgotPasswordStep2.jsx     # [CREATE] Bước 2: Xác thực OTP
│   │       └── ForgotPasswordStep3.jsx     # [CREATE] Bước 3: Mật khẩu mới
│   ├── components/
│   │   └── auth/
│   │       ├── ForgotPasswordFlow.jsx      # [CREATE] Container form multi-step
│   │       └── OTPInput.jsx                # [EXISTS] Dùng chung với UC04, tái sử dụng component
│   ├── contexts/
│   │   └── ForgotPasswordContext.jsx       # [CREATE] Quản lý trạng thái cho luồng 3-step
│   ├── services/
│   │   └── authApi.js                      # [MODIFY] Thêm requestResetPassword(), verifyResetOTP(), resetPassword()
│   ├── hooks/
│   │   └── useMultiStepForm.js             # [EXISTS] Dùng chung với UC04, tái sử dụng hook
│   └── utils/
│       └── validation.js                   # [MODIFY] Thêm client-side validation độ mạnh mật khẩu
└── tests/
    └── auth/
        ├── ForgotPasswordStep1.test.jsx    # [CREATE]
        ├── ForgotPasswordStep2.test.jsx    # [CREATE]
        └── ForgotPasswordStep3.test.jsx    # [CREATE]
```

**Quyết Định Cấu Trúc**:

Đây là web application tuân theo cấu trúc VMS tiêu chuẩn với thư mục backend (Express API) và frontend (React SPA) tách biệt. Tính năng khôi phục mật khẩu ảnh hưởng đến cả hai:

- **Backend**: Mở rộng Auth module hiện tại với 3 endpoint mới, tái sử dụng OTP utilities từ UC04, thêm template email khôi phục mật khẩu
- **Frontend**: Tạo các component UI khôi phục mật khẩu mới trong mô hình form 3-step, tái sử dụng OTP input component từ UC04
- **Database**: Tái sử dụng bảng `email_verifications` hiện tại từ UC04 với type discriminator ('RESET_PASSWORD')

Các sửa đổi file tuân theo mô hình kiến trúc phân tầng: Routes → Middleware (validation) → Controller → Service (business logic) → Repository (database access).

## Theo Dõi Độ Phức Tạp

> **Chỉ điền nếu Constitution Check có vi phạm cần được biện minh**

Không có vi phạm. Phần này trống.

## Phase 0: Nghiên Cứu & Quyết Định Kỹ Thuật

### Các Tác Vụ Nghiên Cứu

Các quyết định kỹ thuật sau cần được nghiên cứu và tài liệu hóa trong `research.md`:

1. **Chiến Lược Hash OTP**
   - Nghiên cứu: Best practices cho hashing OTP trước khi lưu vào database
   - Quyết định cần thiết: Sử dụng bcrypt giống như mật khẩu hay hash nhẹ hơn (ví dụ SHA-256)?
   - Biện minh: OTP tồn tại ngắn (10 phút) và xác thực một lần, không giống mật khẩu xác thực nhiều lần

2. **Triển Khai Không Tiết Lộ Người Dùng**
   - Nghiên cứu: Các kỹ thuật ngăn chặn timing attacks và phân tích phản hồi
   - Quyết định cần thiết: Cách tiếp cận fake OTP, chiến lược chuẩn hóa thời gian phản hồi
   - Biện minh: Phải ngăn chặn kẻ tấn công phát hiện email nào tồn tại trong hệ thống

3. **Lưu Trữ Trạng Thái Khóa**
   - Nghiên cứu: Khóa dựa trên database vs cache trong memory
   - Quyết định cần thiết: Lưu `locked_until` trong bảng `email_verifications` hay dịch vụ rate-limiting riêng
   - Bối cảnh: Spec yêu cầu kiểm tra khóa TRƯỚC kiểm tra cooldown để ngăn bypass
   - Biện minh: Database đảm bảo khóa tồn tại qua restart server nhưng tăng overhead truy vấn

4. **Xử Lý Lỗi Gửi Email**
   - Nghiên cứu: Gửi email không đồng bộ với lỗi im lặng vs blocking với retry
   - Quyết định cần thiết: Mô hình fire-and-forget hay retry queue
   - Biện minh: Không được tiết lộ trạng thái hệ thống qua email delivery status, nhưng cần độ tin cậy tốt cho UX

5. **Persistence Trạng Thái Frontend**
   - Nghiên cứu: sessionStorage vs trạng thái chỉ trong memory cho form multi-step
   - Quyết định cần thiết: Dữ liệu nào cần persistence (email, trạng thái OTP) và ảnh hưởng bảo mật
   - Biện minh: Phải cân bằng UX (giữ trạng thái khi reload không mong muốn) và bảo mật (không lưu dữ liệu nhạy cảm)

6. **Chiến Lược Vô Hiệu Hóa OTP**
   - Nghiên cứu: Soft delete vs hard delete vs TTL-based expiration
   - Quyết định cần thiết: Cách xử lý bản ghi OTP cũ khi tạo bản ghi mới
   - Biện minh: Phải đảm bảo chỉ OTP mới nhất hợp lệ và ngăn accumulation bản ghi

### Deliverable Nghiên Cứu

Tạo `research.md` với cấu trúc sau:

```markdown
# Nghiên Cứu: Quyết Định Kỹ Thuật Quên Mật Khẩu

## R1: Chiến Lược Hash OTP
**Quyết định**: [Cách tiếp cận được chọn]
**Biện minh**: [Tại sao chọn]
**Các Giải Pháp Thay Thế Được Xem Xét**: [Điều gì khác được đánh giá]
**Triển Khai**: [Đoạn code hoặc tham chiếu]

## R2: Triển Khai Không Tiết Lộ Người Dùng
[Cấu trúc tương tự]

## R3: Lưu Trữ Trạng Thái Khóa
[Cấu trúc tương tự]

## R4: Xử Lý Lỗi Gửi Email
[Cấu trúc tương tự]

## R5: Persistence Trạng Thái Frontend
[Cấu trúc tương tự]

## R6: Chiến Lược Vô Hiệu Hóa OTP
[Cấu trúc tương tự]
```

Tất cả các mục NEEDS CLARIFICATION từ phần Technical Context phải được giải quyết trong phase research.

## Phase 1: Design & Contracts

### 1.1 Data Model (`data-model.md`)

Design the database schema and entity relationships for `email_verifications` table (shared with UC04) and its interaction with `users` table.

**Entities to Document**:

1. **EmailVerification** (existing table from UC04, reused)
   - Fields: email (PK/unique), otp_hash, type (enum: 'REGISTER' | 'RESET_PASSWORD'), created_at, last_sent_at, attempts, is_locked, locked_until
   - Relationships: None (temporary table, deleted after verification)
   - State Transitions: created → verified (deleted) | locked → unlocked (time-based)
   - Validation Rules: email format, OTP 6 digits, TTL 10 minutes, type must be 'RESET_PASSWORD' for this flow
   - Indexes: (email, type) composite unique, locked_until (for cleanup queries)

2. **User** (existing table, modified)
   - Password field updated: password_hash (bcrypt with 12 rounds)
   - Constraints: email unique, is_active must be true to reset password
   - No new fields added by this feature

**Data Flow**:

```text
Step 1: Request OTP
User (Email input) → Backend API → 
IF email exists in users:
  → Check email_verifications for (email, type='RESET_PASSWORD')
  → Check is_locked and locked_until (429 if locked)
  → Check cooldown (last_sent_at + 60s > now) (429 if too soon)
  → Generate 6-digit OTP → Hash OTP with bcrypt
  → Invalidate old OTP records (upsert record)
  → Create new email_verifications record (email, otp_hash, type='RESET_PASSWORD', created_at, last_sent_at, attempts=0)
  → Send email with plaintext OTP via NodeMailer [async, silent failure]
ELSE:
  → Generate fake OTP (discard, never store)
  → Simulate DB delay (prevent timing attack)
→ Return { success: true, message: "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi..." }

Step 2: Verify OTP
User (OTP input) → Backend API → 
Lookup email_verifications by (email, type='RESET_PASSWORD', is_active=true) →
Check locked_until > NOW() (429 if locked) →
Check created_at + 10min < NOW() (400 if expired) →
Compare bcrypt.compare(input_otp, otp_hash) →
IF match:
  → Return { success: true, verified: true }
ELSE:
  → Increment attempts
  → IF attempts >= 5: SET is_locked=true, locked_until=NOW()+15min (429)
  → Return 400 "Mã OTP không đúng. Còn X lần thử"

Step 3: Reset Password
User (New password) → Backend API →
Re-verify OTP (call Step 2 logic) →
Lookup user by email →
Check is_active = true (403 if inactive) →
Hash new password with bcrypt (12 rounds) →
BEGIN TRANSACTION:
  → Update users.password_hash
  → Hard delete email_verifications
COMMIT TRANSACTION →
Return { success: true, message: "Mật khẩu đã được đặt lại thành công" }
```

**Cleanup Strategy**:

- Expired OTP records (created_at > 10 minutes ago): Cleanup via cron job daily
- Locked records (locked_until expired): Automatically unlocked on next request (check in code)
- Used OTP records: Soft deleted (is_active = false) after successful password reset

### 1.2 API Contracts (`contracts/`)

Create detailed API documentation for 3 endpoints in `contracts/api-contracts.md`:

**Endpoint 1: POST /api/v1/auth/forgot-password/request**

```markdown
# Request OTP for Password Reset

## Request
- Method: POST
- Headers: Content-Type: application/json
- Body:
  {
    "email": "string (required, email format)"
  }

## Response Success (200)
{
  "success": true,
  "data": {
    "message": "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi. Vui lòng kiểm tra hộp thư.",
    "cooldown_seconds": 60
  }
}

## Response Errors
- 400: Invalid email format
- 429: Cooldown active (body includes remaining_seconds) OR Email locked (body includes lock_remaining_seconds)
- 503: SMTP service unavailable (internal, same success response returned to user)

## Security
- Zero user enumeration: Same response for existing/non-existing emails
- Timing attack resistance: Response time variance < 100ms between existing/non-existing emails
- Fake OTP generated but discarded for non-existing emails
- Email normalized: lowercase, trimmed
- OTP hashed with bcrypt before storage
```

**Endpoint 2: POST /api/v1/auth/forgot-password/verify-otp**

```markdown
# Verify OTP

## Request
- Method: POST
- Headers: Content-Type: application/json
- Body:
  {
    "email": "string (required)",
    "otp": "string (required, 6 digits)"
  }

## Response Success (200)
{
  "success": true,
  "data": {
    "verified": true,
    "message": "Mã OTP xác thực thành công"
  }
}

## Response Errors
- 400: Invalid format OR OTP expired OR OTP incorrect (includes remaining_attempts)
- 429: Email locked after 5 failed attempts (includes lock_remaining_seconds)

## Security
- Lockout check BEFORE cooldown check (prevent bypass)
- Attempts counter incremented on each failure
- After 5 failures: locked_until = NOW() + 15 minutes
```

**Endpoint 3: POST /api/v1/auth/forgot-password/reset**

```markdown
# Reset Password

## Request
- Method: POST
- Headers: Content-Type: application/json
- Body:
  {
    "email": "string (required)",
    "otp": "string (required, 6 digits)",
    "new_password": "string (required, min 8 chars, uppercase, lowercase, number, special char)"
  }

## Response Success (200)
{
  "success": true,
  "data": {
    "message": "Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập ngay."
  }
}

## Response Errors
- 400: Validation failed OR OTP verification failed
- 403: User account inactive
- 429: Email locked
- 500: Transaction failed

## Security
- Re-verifies OTP before password reset
- Password hashed with bcrypt (12 rounds) before storage
- Transaction ensures atomicity (password update + OTP deletion)
- OTP hard-deleted after successful reset
```

### 1.3 Quickstart Guide (`quickstart.md`)

Create developer guide for running and testing password reset feature locally.

**Content Outline**:

1. Prerequisites (Node.js 18+, MySQL 8+, SMTP credentials)
2. Environment Setup (.env configuration for SMTP)
3. Database Migration (Prisma migrate - OTP table already exists from UC04)
4. Running Backend (npm run dev)
5. Running Frontend (npm start)
6. Testing Password Reset Flow (step-by-step with curl/Postman examples)
7. Common Issues and Troubleshooting (SMTP errors, OTP not received, lockout state)

## Phase 2: Implementation Plan

### Overview

The implementation is divided into Backend and Frontend tracks that can be developed in parallel after Phase 1 design is complete.

### 2.1 Backend Implementation

**Architecture Pattern**: Layered (Route → Middleware → Controller → Service → Repository)

**Components**:

| Component | File | Responsibility |
|-----------|------|----------------|
| **Route** | `auth.routes.js` | Define 3 POST endpoints for forgot password flow |
| **Validator** | `auth.validator.js` | Zod schemas for request validation (email format, OTP format, password strength) |
| **Controller** | `auth.controller.js` | Thin layer: extract request data, call service, return response |
| **Service** | `auth.service.js` | Business logic: OTP generation/validation, cooldown check, lockout enforcement, zero enumeration, password reset |
| **Repository** | `user.repository.js` | Prisma queries: findByEmail(), updatePassword() |
| **Repository** | `otp.repository.js` | Prisma queries: CRUD for email_verifications (shared with UC04) |
| **Utilities** | `otp.util.js` | OTP generation (crypto.randomInt) and hashing (bcrypt) - shared with UC04 |
| **Email** | `email.service.js` | NodeMailer email templates and sending logic for password reset |

**Critical Business Logic** (in `auth.service.js`):

1. **requestResetPassword(email)**:
   - Normalize email (lowercase, trim)
   - Lookup user by email in users table
   - IF user NOT exists: Generate fake OTP (discard), simulate DB delay, return success response
   - IF user exists:
     - Query email_verifications for (email, type='RESET_PASSWORD', is_active=true)
     - Check locked_until > NOW() → return 429 with remaining lock time
     - Check last_sent_at + 60s > NOW() → return 429 with cooldown remaining
     - Generate 6-digit OTP with crypto.randomInt(100000, 999999)
     - Hash OTP with bcrypt
     - Upsert record: `email_verifications` WHERE `(email, type='RESET_PASSWORD')`, reset `otp_hash`, `created_at`, `last_sent_at`, `attempts=0`, `is_locked=false`
     - Send email async with try-catch (silent failure, log error)
   - Return success response (same for both cases)

2. **verifyResetOTP(email, otp)**:
   - Query `email_verifications` WHERE `(email, type='RESET_PASSWORD')`
   - IF not found → return 400 "OTP không tồn tại hoặc đã hết hạn"
   - Check `locked_until > NOW()` → return 429 with remaining lock time
   - Check `created_at + 10min < NOW()` → return 400 "OTP đã hết hạn"
   - Compare OTP with bcrypt.compare(otp, record.otp_hash)
   - IF match → return { success: true, verified: true }
   - IF not match:
     - Increment attempts: `UPDATE attempts = attempts + 1`
     - IF attempts >= 5: `UPDATE is_locked=true, locked_until=NOW()+15min`
     - Return 400 "Mã OTP không đúng. Còn X lần thử" (where X = 5 - attempts)

3. **resetPassword(email, otp, newPassword)**:
   - Call verifyResetOTP(email, otp) to re-validate OTP
   - IF verification fails → return error from verification
   - Lookup user by email
   - Check user.is_active = true → return 403 if inactive
   - Hash new password with bcrypt (12 rounds)
   - Begin Prisma transaction:
     - UPDATE `users` SET password_hash=? WHERE email=?
     - Hard DELETE `email_verifications` WHERE `(email, type='RESET_PASSWORD')` (FR-012)
   - Commit transaction
   - Return success

**Database Schema** (already exists from UC04):

```prisma
enum OtpType {
  REGISTER
  RESET_PASSWORD
}

model EmailVerification {
  id           Int              @id @default(autoincrement())
  email        String           @db.VarChar(255)
  otp_hash     String           @db.VarChar(255)
  type         OtpType @default(REGISTER)
  created_at   DateTime         @default(now()) @db.Timestamp(0)
  last_sent_at DateTime?        @db.Timestamp(0)
  attempts     Int              @default(0)
  is_locked    Boolean          @default(false)
  locked_until DateTime?        @db.Timestamp(0)

  @@unique([email, type])
  @@index([email])
  @@index([created_at])
  @@index([locked_until])
  @@map("email_verifications")
}
```

**Note**: Schema này đã được tạo bửi UC04 với migration thêm cột `type`. UC07 không cần migration mới.

**Error Handling**:

- Catch SMTP errors → log silently, still return success response (zero enumeration)
- Catch Prisma errors → return 500 with generic message
- Never expose stack traces or internal details
- User-friendly error messages without revealing system state

### 2.2 Frontend Implementation

**Architecture Pattern**: Component-based React with Context API

**Components**:

| Component | File | Responsibility |
|-----------|------|----------------|
| **Context** | `ForgotPasswordContext.jsx` | Global state: email, otpVerified, currentStep, persist to sessionStorage |
| **Step 1** | `ForgotPasswordStep1.jsx` | Form: Email input → Call requestResetPassword API → Navigate to Step 2 |
| **Step 2** | `ForgotPasswordStep2.jsx` | Form: OTP input (6 digits), countdown timer (10 min), Resend OTP button (60s cooldown) → Call verifyResetOTP API → Navigate to Step 3 |
| **Step 3** | `ForgotPasswordStep3.jsx` | Form: New password, Confirm password → Call resetPassword API → Navigate to Login |
| **OTP Input** | `OTPInput.jsx` | Specialized 6-digit input with auto-focus and paste support (shared with UC04) |
| **Hook** | `useMultiStepForm.js` | Manages form state: currentStep, formData (shared with UC04) |
| **API Client** | `authApi.js` | Axios calls: requestResetPassword(email), verifyResetOTP(email, otp), resetPassword(email, otp, newPassword) |

**State Management**:

- React Context API for global state across 3 steps
- sessionStorage for persistence: email, otpVerified flag
- Memory-only for sensitive data: OTP value, new password
- Clear state on successful password reset or user logout

**User Flows**:

1. **Happy Path**:
   - User at Step 1 → Enter email → Submit → API success → Navigate to Step 2 with timer
   - User at Step 2 → Enter OTP → Submit → API success → Navigate to Step 3
   - User at Step 3 → Enter new password → Submit → API success → Toast success → Redirect to /login

2. **Resend OTP Flow**:
   - User at Step 2 with OTP expired or not received → Click "Gửi lại OTP"
   - If cooldown active: Show toast "Vui lòng đợi X giây"
   - If cooldown passed: Call requestResetPassword → Show toast "OTP mới đã được gửi" → Reset timer

3. **Back Navigation**:
   - User at Step 2 or 3 → Click "Quay lại" → Navigate to previous step with preserved email
   - If email changed at Step 1: Must request new OTP (old OTP invalidated)

**Validation**:

- Client-side validation with inline errors
- Email format (regex)
- OTP format (6 digits)
- Password strength (min 8 chars, uppercase, lowercase, digit, special char)
- Confirm password match
- Disable submit button if validation fails

**Loading States**:

- Show spinner on submit buttons during API calls
- Disable form inputs during loading
- Show toast notifications for success/error responses
- Countdown timer for OTP expiration (10 minutes)
- Cooldown timer for Resend OTP button (60 seconds)

### 2.3 Testing Strategy

**Backend Tests** (`tests/integration/auth.forgot-password.test.js`):

Test cases mapping to spec acceptance criteria:

1. **Request OTP Happy Path** (§ User Story 1)
   - POST /forgot-password/request with existing user email → 200, OTP sent, record created

2. **Zero User Enumeration** (§ User Story 4)
   - POST /forgot-password/request with non-existing email → 200, same response as existing email
   - Response time difference < 100ms between existing/non-existing emails

3. **Cooldown Enforcement** (§ User Story 3)
   - Send OTP → Wait 30s → Resend → 429 with remaining_seconds
   - Send OTP → Wait 61s → Resend → 200 with new OTP

4. **Verify OTP Success** (§ User Story 1)
   - Request OTP → Verify with correct OTP → 200 verified=true

5. **OTP Lockout** (§ User Story 2)
   - Request OTP → Verify with wrong OTP 5 times → 429 locked
   - Locked email → Try verify → 429 with lock_remaining_seconds
   - Wait 16 min → Verify → Lock cleared

6. **OTP Expiration** (§ User Story 3)
   - Mock created_at to 11 minutes ago → Verify → 400 expired

7. **Reset Password Success** (§ User Story 1)
   - Request OTP → Verify OTP → Reset password → 200, password updated, OTP deleted
   - Login with new password → Success

8. **Password Validation** (§ FR-013)
   - Reset with weak password → 400 validation error

9. **Edge Cases**:
   - Email with uppercase/whitespace → normalized to lowercase
   - SMTP failure → Still return 200 (silent failure)
   - Inactive user account → 403 forbidden
   - Concurrent OTP requests → Only latest OTP valid

**Frontend Tests** (`tests/auth/ForgotPasswordStep*.test.jsx`):

1. Component rendering tests for all 3 steps
2. Form validation (empty fields, invalid email, weak password)
3. Navigation between steps
4. Timer countdown display (OTP expiration, resend cooldown)
5. API call mocking and error handling
6. Toast notifications
7. sessionStorage persistence and clearing

**Coverage Target**: 80% for services, 60% for controllers

### 2.4 Dependencies & Execution Order

```text
Phase 0: Research (no dependencies)
  ↓
Phase 1a: Data Model (depends on Phase 0)
  ↓
Phase 1b: API Contracts (depends on Phase 0)
  ↓
Phase 1c: Backend Implementation (depends on Phase 1a, 1b)
  - otp.repository.js (reuse from UC04)
  - email.service.js
  - auth.service.js (3 new methods)
  - auth.validator.js (3 Zod schemas)
  - auth.controller.js (3 controllers)
  - auth.routes.js (3 routes)
  ↓
Phase 1d: Frontend Implementation (depends on Phase 1b) ← Can run parallel with 1c
  - ForgotPasswordContext.jsx
  - ForgotPasswordStep1.jsx
  - ForgotPasswordStep2.jsx
  - ForgotPasswordStep3.jsx
  - authApi.js (3 API methods)
  ↓
Phase 1e: Integration Testing (depends on Phase 1c, 1d)
  ↓
Phase 1f: Code Review & QA
```

**External Dependencies**:

- SMTP service configured and credentials in .env
- MySQL database running
- Prisma migrations applied (OTP table exists from UC04)
- Backend API running on localhost:5000 (or configured port)
- Frontend dev server on localhost:3000

**Internal Dependencies**:

- `users` table must exist with email unique constraint and is_active field
- `email_verifications` table must exist (created by UC04)
- Auth login feature (UC03) should be complete for post-reset login flow
- Email service configured with NodeMailer

## Rủi Ro & Giải Pháp Giảm Thiểu

| Rủi Ro | Tác Động | Xác Suất | Giải Pháp Giảm Thiểu |
|--------|----------|---------|---------------------|
| **SMTP Service Downtime** | Cao - Người dùng không thể nhận OTP | Trung bình | Lỗi im lặng với logging, trả về success response (không tiết lộ người dùng), người dùng có thể thử lại sau cooldown |
| **Email Deliverability** | Cao - Email OTP rơi vào spam | Trung bình | Sử dụng dịch vụ SMTP uy tín (Gmail, SendGrid), email plaintext, subject line rõ ràng |
| **Timing Attack** | Cao - Tiết lộ sự tồn tại của email | Trung bình | Tạo fake OTP cho email không tồn tại, chuẩn hóa thời gian phản hồi giữa hai trường hợp |
| **OTP Brute Force** | Cao - Chiếm quyền kiểm soát tài khoản | Thấp (được giảm thiểu) | Khóa sau 5 lần thất bại + 15 phút đóng, OTP được hash, TTL 10 phút |
| **Race Condition in Cooldown** | Trung bình - Gửi OTP trùng lặp | Thấp | Uniqueness ở level database trên (email, type), atomic last_sent_at update |
| **Client State Loss** | Trung bình - Người dùng mất trạng thái email/OTP | Trung bình | sessionStorage persistence cho email và otpVerified flag |
| **Database Transaction Failure** | Trung bình - Cập nhật mật khẩu nhưng OTP không được xóa | Thấp | Wrap trong Prisma transaction, ghi log các lỗi để cleanup thủ công |
| **Lockout Bypass** | Cao - Kẻ tấn công reset khóa bằng yêu cầu OTP mới | Trung bình | Kiểm tra locked_until TRƯỚC cooldown (FR-007) |
| **OTP Interception** | Cao - Man-in-the-middle attack | Rất thấp | HTTPS enforced, OTP có TTL 10 phút, one-time use |

## Câu Hỏi Cho Người Quản Lý

1. **Email Template Branding**: Email OTP có nên bao gồm logo/branding VMS hay plaintext đủ cho MVP?
   - **Bối cảnh**: HTML emails cải thiện branding nhưng tăng độ phức tạp và rủi ro spam
   - **Các tùy chọn**: (A) Plaintext chỉ, (B) HTML đơn giản với logo, (C) Rich HTML template
   - **Khuyến nghị**: (A) cho MVP, nâng cấp lên (B) trong Phase 2

2. **Password History**: Có nên xác thực mật khẩu mới khác với mật khẩu cũ không?
   - **Bối cảnh**: Spec rõ ràng nêu điều này Out of Scope (FR-014)
   - **Các tùy chọn**: (A) Cho phép cùng mật khẩu (theo spec), (B) Yêu cầu mật khẩu khác
   - **Khuyến nghị**: (A) - tuân thủ spec, hoãn lại Phase 2 nếu cần

3. **Auto-Login After Reset**: Có nên tự động đăng nhập người dùng sau khi khôi phục mật khẩu thành công không?
   - **Bối cảnh**: Spec rõ ràng nêu redirect đến login page, không auto-login (FR-016)
   - **Các tùy chọn**: (A) Redirect đến /login (theo spec), (B) Tự động đăng nhập với mật khẩu mới
   - **Khuyến nghị**: (A) - tuân thủ spec cho bảo mật (người dùng xác nhận mật khẩu mới hoạt động)

4. **Rate Limiting Strategy**: Có nên triển khai IP-based rate limiting thêm vào email-based lockout không?
   - **Bối cảnh**: Thiết kế hiện tại chỉ sử dụng email-based cooldown + lockout
   - **Các tùy chọn**: (A) Chỉ email-based (đơn giản), (B) Thêm IP-based rate limiting (nginx/middleware)
   - **Khuyến nghị**: (A) cho MVP, hoãn IP-based Phase 2 nếu phát hiện lạm dụng

5. **OTP Cleanup Strategy**: Có nên sử dụng MySQL Event Scheduler hay cron job cho cleanup OTP hết hạn?
   - **Bối cảnh**: Bản ghi OTP hết hạn tích lũy theo thời gian, cần periodic cleanup
   - **Các tùy chọn**: (A) MySQL Event Scheduler, (B) Node.js cron job, (C) Lazy deletion on next request
   - **Khuyến nghị**: (C) cho MVP (đơn giản nhất), nâng cấp (A) hoặc (B) nếu hiệu năng giảm

## Chỉ Số Đo Lường Thành Công

Sau triển khai, chúng ta sẽ đo lường:

1. **Password Reset Completion Rate**: % người dùng hoàn thành 3 bước sau khi yêu cầu OTP
   - Mục tiêu: >70% trong vòng 10 phút sau gửi OTP

2. **Email Delivery Time**: p50 và p95 cho thời gian gửi email OTP
   - Mục tiêu: p50 < 10s, p95 < 30s

3. **Failed OTP Attempts**: % xác thực có >1 lần thử trước khi thành công
   - Baseline: Dự kiến <15% cần retry

4. **Lockout Incidents**: # email bị khóa mỗi ngày
   - Baseline: Giám sát các pattern lạm dụng

5. **API Performance**:
   - POST /forgot-password/request: p95 < 2s
   - POST /forgot-password/verify-otp: p95 < 500ms
   - POST /forgot-password/reset: p95 < 1s

6. **Error Rate**: % lỗi 5xx trên cả 3 endpoints
   - Mục tiêu: <0.1%

7. **Zero Enumeration Verification**: Phương sai thời gian phản hồi giữa email tồn tại/không tồn tại
   - Mục tiêu: <100ms difference

## Các Bước Tiếp Theo

Sau khi phê duyệt kế hoạch:

1. **Phase 0 Execution**: Tạo `research.md` với các quyết định kỹ thuật được tài liệu hóa
2. **Phase 1 Execution**: Tạo `data-model.md`, `contracts/api-contracts.md`, `quickstart.md`
3. **Agent Context Update**: Cập nhật CLAUDE.md tham chiếu kế hoạch này
4. **Constitution Re-check**: Xác minh tất cả gates vẫn vượt qua sau Phase 1 design
5. **Proceed to `/speckit-tasks`**: Tạo các tác vụ triển khai nguyên tử

---

**Trạng thái**: ✅ Kế Hoạch Hoàn Tất - Chờ Phê Duyệt Người Quản Lý

**Checklist Phê Duyệt**:

- [x] Tất cả các mục Technical Context được làm rõ (không có NEEDS CLARIFICATION còn lại)
- [x] Constitution Check vượt qua (tất cả gates được thỏa mãn)
- [x] Project Structure ánh xạ tới thư mục thực tế
- [x] Các tác vụ research được xác định phạm vi
- [x] Data model được phác thảo
- [x] API contracts được chỉ định
- [x] Cách tiếp cận triển khai rõ ràng
- [x] Rủi ro được xác định với giải pháp giảm thiểu
- [x] Câu hỏi cho người quản lý được tài liệu hóa
- [x] Phụ thuộc và thứ tự thực thi được định nghĩa

**Người Phê Duyệt**: ________________  **Ngày**: ________________

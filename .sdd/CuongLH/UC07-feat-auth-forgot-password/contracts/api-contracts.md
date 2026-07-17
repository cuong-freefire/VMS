# API Contracts: UC07 - Forgot Password

**Feature**: Quên Mật Khẩu (Forgot Password)  
**Module Owner**: Member 1 - CuongLH  
**Date**: 2026-06-29

---

## Overview

Feature này expose 3 REST API endpoints:

1. **POST /api/v1/auth/forgot-password/request** - Yêu cầu OTP reset password
2. **POST /api/v1/auth/forgot-password/verify-otp** - Xác thực mã OTP
3. **POST /api/v1/auth/forgot-password/reset** - Đặt mật khẩu mới

Tất cả endpoints đều **KHÔNG** require authentication (public endpoints).

---

## API 1: Request Reset Password OTP

### Endpoint

```
POST /api/v1/auth/forgot-password/request
```

### Authentication

**None** - Public endpoint

### Request Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "success": true,
    "message": "Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập ngay."
}
```

**Schema Validation (Zod)**:

```javascript
{
  email: z.string()
    .email("Email không hợp lệ")
    .max(255, "Email không được quá 255 ký tự")
}
```

---

### Response: Success (200 OK)

**Scenario 1**: Email tồn tại trong hệ thống

```json
{
  "success": true,
  "data": {
    "message": "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi. Vui lòng kiểm tra hộp thư."
  }
}
```

**Scenario 2**: Email KHÔNG tồn tại trong hệ thống

```json
{
  "success": true,
  "data": {
    "message": "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi. Vui lòng kiểm tra hộp thư."
  }
}
```

**IMPORTANT**: Response message PHẢI giống nhau để chống user enumeration. Response time cũng phải tương đương (generate fake OTP cho email không tồn tại).

---

### Response: Error (4xx/5xx)

**400 Bad Request** - Validation Error

```json
{
  "success": false,
  "message": "email: Email không hợp lệ",
  "code": "VALIDATION_ERROR"
}
```

**429 Too Many Requests** - Cooldown Active

```json
{
  "success": false,
  "error": "Vui lòng chờ 45 giây nữa trước khi gửi lại OTP"
}
```

**429 Too Many Requests** - Account Locked

```json
{
  "success": false,
  "error": "Tài khoản bị khóa 12 phút 30 giây do nhập sai OTP quá nhiều"
}
```

**500 Internal Server Error** - Database/System Error

```json
{
  "success": false,
  "message": "Có lỗi xảy ra trong quá trình xử lý.",
  "code": "INTERNAL_SERVER_ERROR"
}
```

**Note**: Email service failures KHÔNG trả về 500, vẫn trả về 200 OK (silent failure for zero enumeration).

---

### Business Logic

1. **User Lookup**: Query `users` table by email
2. **If user exists**:
   - Check lockout: `locked_until > NOW()` (query `email_verifications` WHERE email + type) → Return 429
   - Check cooldown: `last_sent_at + 60s > NOW()` → Return 429
   - Generate 6-digit OTP via `crypto.randomInt(100000, 999999)`
   - Hash OTP: `bcrypt.hash(otp, BCRYPT_SALT_ROUNDS)`
   - Upsert record: `email_verifications` WHERE `(email, type = 'RESET_PASSWORD')` (reset `otp_hash`, `created_at`, `last_sent_at`, `attempts=0`, `is_locked=false`)
   - Send email async (try-catch, silent failure)
3. **If user NOT exists**:
   - Generate fake OTP (discard, không lưu DB)
   - Skip email sending
4. **Return identical success response** cho cả 2 cases

---

### Performance Requirements

- **Response Time**: < 2 seconds (include DB write + async email send)
- **Throughput**: Support 100 concurrent requests
- **Email Delivery**: > 99% success rate (when SMTP available)

---

### Security Considerations

- **Zero User Enumeration**: Response message và timing phải giống nhau cho email tồn tại vs không tồn tại
- **Rate Limiting**: Cooldown 60s giữa các request từ cùng email
- **Lockout**: 15 phút sau 5 lần verify OTP sai
- **OTP Entropy**: 6 chữ số = 1,000,000 combinations, TTL 10 phút, lockout after 5 attempts → Brute force impractical

---

## API 2: Verify Reset Password OTP

### Endpoint

```
POST /api/v1/auth/forgot-password/verify-otp
```

### Authentication

**None** - Public endpoint

### Request Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "success": true,
    "message": "Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập ngay.",
  "otp": "123456"
}
```

**Schema Validation (Zod)**:

```javascript
{
  email: z.string()
    .email("Email không hợp lệ")
    .max(255, "Email không được quá 255 ký tự"),
  otp: z.string()
    .regex(/^\d{6}$/, "OTP phải là 6 chữ số")
}
```

---

### Response: Success (200 OK)

**OTP hợp lệ và verify thành công**

```json
{
  "success": true,
  "message": "Mã OTP xác thực thành công.",
  "data": {
    "verified": true,
    "message": "Mã OTP xác thực thành công."
  }
}
```

**Note**: `verified: true` để frontend kiểm tra và chuyển sang Step 3. Không chứa `email` trong response data (email đã có sẵn từ Step 1 frontend state).

---

### Response: Error (4xx/5xx)

**400 Bad Request** - Invalid OTP

```json
{
  "success": false,
  "message": "Mã OTP không đúng. Bạn còn 3 lần thử.",
  "code": "INVALID_OTP"
}
```

**400 Bad Request** - OTP Expired

```json
{
  "success": false,
  "message": "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.",
  "code": "OTP_EXPIRED"
}
```

**404 Not Found** - No Active OTP Found

```json
{
  "success": false,
  "message": "Không tìm thấy mã OTP hợp lệ. Vui lòng yêu cầu mã mới.",
  "code": "VERIFICATION_NOT_FOUND"
}
```

**429 Too Many Requests** - Account Locked

```json
{
  "success": false,
  "message": "Bạn đã nhập sai quá 5 lần. Tài khoản bị khóa 14 phút 25 giây.",
  "code": "EMAIL_LOCKED",
  "details": {
    "lock_remaining_seconds": 865
  }
}
```

**500 Internal Server Error** - System Error

```json
{
  "success": false,
  "message": "Có lỗi xảy ra trong quá trình xử lý.",
  "code": "INTERNAL_SERVER_ERROR"
}
```

---

### Business Logic

1. **Check Lockout**: Query `email_verifications` by `(email, type='RESET_PASSWORD')`, check `locked_until > NOW()` → Return 429
2. **Find OTP Record**: `SELECT * FROM email_verifications WHERE email = ? AND type = 'RESET_PASSWORD'` (UNIQUE constraint đảm bảo tối đa 1 record)
3. **Check Expiry**: `last_sent_at + 10 min < NOW()` → Return 400 "OTP đã hết hạn"
4. **Verify OTP**:
   - If match (`bcrypt.compare`): Return 200 success, **KHÔNG** xóa record (giữ lại để re-verify ở bước 3)
   - If mismatch: Increment attempts → Return 400 with remaining attempts
5. **Trigger Lockout**: If `attempts >= 5` after increment → `UPDATE email_verifications SET is_locked=true, locked_until = NOW() + INTERVAL 15 MINUTE`

---

### Performance Requirements

- **Response Time**: < 500ms (DB lookup only, no email sending)
- **Throughput**: Support 100 concurrent requests

---

### Security Considerations

- **Attempt Tracking**: Mỗi lần sai increment `attempts`, khóa sau 5 lần
- **Timing Attack Prevention**: Response time không lộ thông tin về OTP đúng hay sai (constant-time comparison không cần thiết vì lockout mechanism đủ mạnh)
- **Replay Attack Prevention**: OTP chỉ có thể dùng 1 lần — hard DELETE sau khi reset password thành công ở bước 3

---

## API 3: Reset Password with Verified OTP

### Endpoint

```
POST /api/v1/auth/forgot-password/reset
```

### Authentication

**None** - Public endpoint (OTP là authentication mechanism)

### Request Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "success": true,
    "message": "Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập ngay.",
  "otp": "123456",
  "newPassword": "NewSecure@123"
}
```

**Schema Validation (Zod)**:

```javascript
{
  email: z.string()
    .email("Email không hợp lệ")
    .max(255, "Email không được quá 255 ký tự"),
  otp: z.string()
    .regex(/^\d{6}$/, "OTP phải là 6 chữ số"),
  newPassword: z.string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
    .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
    .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 chữ số")
    .regex(/[^A-Za-z0-9]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt")
}
```

---

### Response: Success (200 OK)

**Password reset thành công**

```json
{
  "success": true,
  "message": "Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập ngay.",
  "data": {
    "success": true,
    "message": "Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập ngay."
  }
}
```

**Note**: Frontend redirect user về `/login` sau khi nhận response này với `state: { passwordReset: true }`. KHÔNG tự động đăng nhập (Out of Scope).

---

### Response: Error (4xx/5xx)

**400 Bad Request** - Validation Error

```json
{
  "success": false,
  "message": "newPassword: Mật khẩu phải có ít nhất 8 ký tự",
  "code": "VALIDATION_ERROR"
}
```

**400 Bad Request** - Invalid OTP

```json
{
  "success": false,
  "message": "Mã OTP không đúng hoặc đã hết hạn",
  "code": "INVALID_OTP"
}
```

**404 Not Found** - User Not Found

```json
{
  "success": false,
  "message": "Không tìm thấy tài khoản với email này.",
  "code": "USER_NOT_FOUND"
}
```

**403 Forbidden** - Inactive User

```json
{
  "success": false,
  "message": "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.",
  "code": "ACCOUNT_DISABLED"
}
```

**500 Internal Server Error** - System Error

```json
{
  "success": false,
  "message": "Có lỗi xảy ra trong quá trình xử lý.",
  "code": "INTERNAL_SERVER_ERROR"
}
```

---

### Business Logic

1. **Verify OTP Again**: Gọi lại logic verify từ API 2 (check expiry, lockout, attempts)
2. **Find User**: Query `users` table by email, check `is_active = true`
3. **Hash New Password**: `bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS)` (12 rounds theo AGENTS.md)
4. **Sequential update + delete**:

   ```javascript
   // Step 1: Update user password via authRepository.updatePassword()
   await authRepository.updatePassword(normalizedEmail, passwordHash);

   // Step 2: Delete OTP record via authRepository.deleteVerification()
   await authRepository.deleteVerification(normalizedEmail, 'RESET_PASSWORD');
   ```

5. **Return Success**: Frontend redirect to `/login`

---

### Performance Requirements

- **Response Time**: < 1 second (bcrypt hashing + sequential DB operations)
- **Throughput**: Support 50 concurrent requests

---

### Security Considerations

- **Password Hashing**: bcrypt với 12 rounds
- **OTP Reuse Prevention**: Hard DELETE OTP record sau khi reset thành công
- **No Password History Check**: KHÔNG validate mật khẩu mới trùng mật khẩu cũ (Out of Scope theo spec.md)


---

## Response Format Standard

Tất cả API tuân thủ ADR-006 trong CLAUDE.md:

**Success Response**:

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { /* Optional response data */ }
}
```

**Error Response**:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": { /* Optional extra info (e.g., remaining_seconds, locked_until) */ }
}
```

**Lưu ý**:

- `message` dùng cho cả success và error cases
- `code` là machine-readable (ví dụ: `COOLDOWN_ACTIVE`, `EMAIL_LOCKED`, `INVALID_OTP`, `VALIDATION_ERROR`)
- `details` là optional extra info (ví dụ: `{ remaining_seconds: 45 }`, `{ lock_remaining_seconds: 900 }`)
- HTTP status code must match semantic (200 OK, 400 Bad Request, 403 Forbidden, 404 Not Found, 429 Too Many Requests, 500 Internal Server Error)

---

## Rate Limiting (Optional - Future Enhancement)

Hiện tại rate limiting được implement qua:

- **Cooldown**: 60s per email (application level)
- **Lockout**: 15 phút sau 5 lần verify sai (application level)

**Future**: Có thể thêm IP-based rate limiting qua nginx/middleware:

- Max 10 requests/minute per IP cho `/forgot-password/request`
- Max 20 requests/minute per IP cho `/forgot-password/verify-otp`

---

## CORS Configuration

Backend phải config CORS để frontend có thể gọi:

```javascript
// backend/src/app.js
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN, // http://localhost:3000
  credentials: true
}));
```

**Environment Variables**:

```
FRONTEND_ORIGIN=http://localhost:3000
```

---

## API Documentation Update

Sau khi implement, phải cập nhật:

1. **Swagger Documentation** (`backend/src/swagger.js`):
   - Add JSDoc comments cho 3 endpoints
   - Include request/response examples
   - Mark as public endpoints (no auth required)

2. **share_context.md**:
   - Add API contracts vào section "Member 1 - CuongLH APIs"
   - Document cross-module dependencies (nếu có)

---

**End of API Contracts**

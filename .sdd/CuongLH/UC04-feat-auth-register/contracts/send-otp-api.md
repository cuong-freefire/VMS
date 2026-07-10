# API Contract: Send OTP

**Endpoint**: `POST /api/v1/auth/register/send-otp`

**Feature**: UC04 - Authentication Register (Step 1)

**Version**: 1.0

**Status**: APPROVED

---

## Overview (Tổng quan)

This endpoint generates a 6-digit OTP, stores it securely in the database, and sends it to the user's email address. It enforces cooldown (60 seconds) and lockout (15 minutes after 5 failed attempts) to prevent abuse.

---

## Request (Yêu cầu)

### HTTP Method

```
POST
```

### URL

```
/api/v1/auth/register/send-otp
```

### Headers

```
Content-Type: application/json
```

### Authentication (Xác thực)

**Not required** - This is a public endpoint for guest users.

### Request Body (Nội dung yêu cầu)

```json
{
  "email": "user@example.com"
}
```

### Request Schema (Zod)

```javascript
const sendOTPSchema = z.object({
  email: z.string()
    .email('Email không hợp lệ')
    .trim()
    .toLowerCase()
});
```

### Field Validation (Kiểm tra trường)

| Field | Type | Required | Constraints | Example |
|-------|------|----------|-------------|---------|
| email | string | Yes | Valid email format, max 255 chars | "<user@vms.com>" |

### Sample Valid Requests (Yêu cầu hợp lệ mẫu)

```json
{
  "email": "volunteer@vms.com"
}
```

```json
{
  "email": "VOLUNTEER@VMS.COM"
}
// Email will be normalized to "volunteer@vms.com"
```

```json
{
  "email": "  volunteer@vms.com  "
}
// Whitespace will be trimmed
```

---

## Response (Phản hồi)

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.",
    "cooldown_seconds": 60
  }
}
```

### Response Fields (Trường phản hồi)

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Always `true` for successful response |
| data.message | string | User-friendly success message in Vietnamese |
| data.cooldown_seconds | number | Seconds user must wait before resending OTP |

---

## Error Responses (Phản hồi lỗi)

### 400 Bad Request - Invalid Email Format

```json
{
  "success": false,
  "error": "Email không hợp lệ"
}
```

**Trigger**: Email fails format validation

---

### 409 Conflict - Email Already Registered

```json
{
  "success": false,
  "error": "Email đã được sử dụng. Vui lòng sử dụng email khác hoặc đăng nhập."
}
```

**Trigger**: Email exists in `users` table with `is_active = true`

**Security Note**: This reveals account existence (email enumeration). Trade-off accepted for better UX (see research.md § R6).

---

### 429 Too Many Requests - Cooldown Active

```json
{
  "success": false,
  "error": "Vui lòng đợi 45 giây trước khi gửi lại OTP.",
  "remaining_seconds": 45
}
```

**Trigger**: Less than 60 seconds since `last_sent_at` timestamp

**Additional Field**:

- `remaining_seconds`: Number of seconds until cooldown expires

---

### 429 Too Many Requests - Email Locked

```json
{
  "success": false,
  "error": "Email đã bị khóa do nhập sai OTP quá nhiều lần. Vui lòng thử lại sau 12 phút.",
  "locked_until": "2026-06-29T10:15:00.000Z"
}
```

**Trigger**: Email has `is_locked = true` and `locked_until > NOW()` in `email_verifications` table

**Additional Field**:

- `locked_until`: ISO 8601 timestamp when lock expires

---

### 503 Service Unavailable - SMTP Failure

```json
{
  "success": false,
  "error": "Dịch vụ gửi email tạm thời không khả dụng. Vui lòng thử lại sau."
}
```

**Trigger**: NodeMailer SMTP connection fails or email send fails

**Behavior**:

- Error logged to backend (critical level)
- OTP record still created in database (can be used if email delivers late)
- Frontend should show retry button

---

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Đã xảy ra lỗi. Vui lòng thử lại sau."
}
```

**Trigger**: Unexpected server error (database connection failure, etc.)

**Behavior**: Error logged with stack trace, no internal details exposed to client

---

## Business Logic (Luồng nghiệp vụ)

### Processing Flow (Luồng xử lý)

```text
1. Validate request body with Zod
   ├─ Invalid → 400 Bad Request
   └─ Valid → Continue

2. Normalize email (lowercase, trim)

3. Check if email exists in users table
   ├─ Exists → 409 Conflict
   └─ Not exists → Continue

4. Check email_verifications table for existing record
   ├─ No record → Skip to Step 7
   └─ Record exists → Continue to Step 5

5. Check if email is locked
   ├─ is_locked = TRUE AND locked_until > NOW() → 429 Locked
   ├─ is_locked = TRUE AND locked_until <= NOW() → Reset lock, Continue
   └─ is_locked = FALSE → Continue

6. Check cooldown
   ├─ (NOW() - last_sent_at) < 60 seconds → 429 Cooldown
   └─ (NOW() - last_sent_at) >= 60 seconds → Continue

7. Generate 6-digit OTP
   - Use crypto.randomInt(100000, 999999)
   - Result: "123456" (string)

8. Hash OTP
   - Use bcrypt.hash(otp, 10)
   - Result: "$2a$10$..." (hash string)

9. Upsert email_verifications record
   - INSERT or UPDATE (if exists)
   - Fields:
     * email: normalized email
     * otp_hash: bcrypt hash
     * created_at: NOW()
     * last_sent_at: NOW()
     * attempts: 0 (reset counter)
     * is_locked: FALSE (unlock if was locked)
     * locked_until: NULL

10. Send email via NodeMailer
    - To: user's email
    - Subject: "Mã xác thực đăng ký VMS"
    - Body: Plain text with OTP
    - Template: See email.util.js
    ├─ Success → Continue
    └─ Failure → Log error, return 503

11. Return 200 success response
```

### State Transitions (Chuyển đổi trạng thái)

```text
No Record → [CREATED] → OTP sent
Existing Record (unlocked) → [UPDATED] → New OTP sent, attempts reset
Existing Record (locked, expired) → [UNLOCKED + UPDATED] → New OTP sent
Existing Record (locked, not expired) → [REJECTED] → 429 error
```

---

## Security Considerations (Cân nhắc bảo mật)

### Rate Limiting (Giới hạn tần suất)

- **Cooldown**: 60 seconds between requests (per email)
- **Lockout**: 15 minutes after 5 failed OTP verification attempts
- **IP-based rate limiting**: NOT implemented in Phase 1 (future enhancement)

### Data Protection (Bảo vệ dữ liệu)

- OTP plaintext NEVER stored in database (only bcrypt hash)
- OTP plaintext NEVER logged
- Email content NEVER logged
- SMTP credentials stored in `.env` (gitignored)

### Attack Vectors (Vector tấn công)

| Attack | Mitigation |
|--------|-----------|
| Email enumeration | Accepted trade-off for UX (see research.md § R6) |
| OTP brute force | 1M combinations + 10-min TTL + 5-attempt lockout |
| Spam email abuse | 60-second cooldown per email |
| SMTP credential theft | Environment variables, no hardcoded secrets |

---

## Database Changes (Thay đổi Database)

### Table: `email_verifications`

**Action**: INSERT or UPDATE

```sql
INSERT INTO email_verifications (email, otp_hash, created_at, last_sent_at, attempts, is_locked, locked_until)
VALUES ('user@vms.com', '$2a$10$...', NOW(), NOW(), 0, FALSE, NULL)
ON DUPLICATE KEY UPDATE
  otp_hash = VALUES(otp_hash),
  last_sent_at = VALUES(last_sent_at),
  attempts = 0,
  is_locked = FALSE,
  locked_until = NULL;
```

---

## Email Template (Mẫu email)

**Subject**: Mã xác thực đăng ký VMS

**Body** (Plain Text):

```
Xin chào,

Bạn đã yêu cầu đăng ký tài khoản tình nguyện viên tại VMS.

Mã xác thực OTP của bạn là: 123456

Mã này có hiệu lực trong 10 phút kể từ khi nhận được email này.

Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.

---
Volunteer Management System (VMS)
Email: support@vms.com
```

---

## Testing (Kiểm thử)

### Test Cases (Ca kiểm thử)

#### TC-01: Happy Path - New Email

**Request**:

```json
POST /api/v1/auth/register/send-otp
{
  "email": "newuser@vms.com"
}
```

**Expected**:

- Status: 200
- Database: 1 record inserted in email_verifications
- Email: OTP sent to <newuser@vms.com>
- Response: success message

---

#### TC-02: Email Already Registered

**Precondition**: User with email "<existing@vms.com>" exists in users table

**Request**:

```json
POST /api/v1/auth/register/send-otp
{
  "email": "existing@vms.com"
}
```

**Expected**:

- Status: 409
- Response: "Email đã được sử dụng..."

---

#### TC-03: Cooldown Enforcement

**Precondition**: OTP sent 30 seconds ago

**Request**:

```json
POST /api/v1/auth/register/send-otp
{
  "email": "user@vms.com"
}
```

**Expected**:

- Status: 429
- Response: "Vui lòng đợi X giây..." with remaining_seconds

---

#### TC-04: Email Locked

**Precondition**: Email has is_locked=TRUE, locked_until in future

**Request**:

```json
POST /api/v1/auth/register/send-otp
{
  "email": "locked@vms.com"
}
```

**Expected**:

- Status: 429
- Response: "Email đã bị khóa..." with locked_until timestamp

---

#### TC-05: Invalid Email Format

**Request**:

```json
POST /api/v1/auth/register/send-otp
{
  "email": "invalid-email"
}
```

**Expected**:

- Status: 400
- Response: "Email không hợp lệ"

---

#### TC-06: Email Normalization

**Request**:

```json
POST /api/v1/auth/register/send-otp
{
  "email": "  USER@VMS.COM  "
}
```

**Expected**:

- Status: 200
- Database: Email stored as "<user@vms.com>" (lowercase, trimmed)

---

## Performance (Hiệu năng)

### Expected Metrics (Chỉ số mong đợi)

- **Response Time**:
  - Fast path (validation only): < 50ms
  - Slow path (OTP generation + email send): < 2000ms
  - Target p95: < 200ms (excluding email send)

- **Database Queries**: 2-3 queries
  1. Check users table for email
  2. Check/upsert email_verifications table
  3. Optional: Reset lock if expired

- **Email Delivery**: Async, not blocking response (fire-and-forget)

---

## Dependencies (Phụ thuộc)

- **Zod**: Request validation
- **bcryptjs**: OTP hashing
- **NodeMailer**: Email delivery
- **Prisma**: Database access
- **crypto**: OTP generation

---

**Contract Status**: ✅ APPROVED - Ready for implementation

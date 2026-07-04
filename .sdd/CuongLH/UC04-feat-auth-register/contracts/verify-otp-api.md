# API Contract: Verify OTP

**Endpoint**: `POST /api/v1/auth/register/verify-otp`

**Feature**: UC04 - Authentication Register (Step 2)

**Version**: 1.0

**Status**: APPROVED

---

## Overview

This endpoint verifies the OTP sent to the user's email, validates all registration data, creates a new user account with Volunteer role, and completes the registration process. It enforces OTP expiration (10 minutes), attempt limits (5 attempts), and lockout (15 minutes after 5 failed attempts).

---

## Request

### HTTP Method

```
POST
```

### URL

```
/api/v1/auth/register/verify-otp
```

### Headers

```
Content-Type: application/json
```

### Authentication

**Not required** - This is a public endpoint for guest users.

### Request Body

```json
{
  "email": "user@example.com",
  "otp": "123456",
  "full_name": "Nguyễn Văn A",
  "phone_number": "0912345678",
  "password": "Password123"
}
```

### Request Schema (Zod)

```javascript
const verifyOTPSchema = z.object({
  email: z.string()
    .email('Email không hợp lệ')
    .trim()
    .toLowerCase(),
  
  otp: z.string()
    .regex(/^\d{6}$/, 'OTP phải là 6 chữ số'),
  
  full_name: z.string()
    .min(1, 'Họ tên không được để trống')
    .max(255, 'Họ tên tối đa 255 ký tự')
    .trim(),
  
  phone_number: z.string()
    .regex(/^0\d{9,10}$/, 'Số điện thoại không hợp lệ (10-11 chữ số, bắt đầu bằng 0)'),
  
  password: z.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
    .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
    .regex(/\d/, 'Mật khẩu phải có ít nhất 1 chữ số')
});
```

### Field Validation

| Field | Type | Required | Constraints | Example |
|-------|------|----------|-------------|---------|
| email | string | Yes | Valid email format, max 255 chars | "<user@vms.com>" |
| otp | string | Yes | Exactly 6 digits | "123456" |
| full_name | string | Yes | 1-255 chars | "Nguyễn Văn A" |
| phone_number | string | Yes | 10-11 digits, starts with 0 (Vietnam format) | "0912345678" |
| password | string | Yes | Min 8 chars, must have uppercase, lowercase, digit | "Password123" |

### Sample Valid Requests

```json
{
  "email": "volunteer@vms.com",
  "otp": "123456",
  "full_name": "Nguyễn Văn A",
  "phone_number": "0912345678",
  "password": "MySecure123"
}
```

```json
{
  "email": "user@example.com",
  "otp": "987654",
  "full_name": "Trần Thị B",
  "phone_number": "09876543210",
  "password": "StrongPass1"
}
```

---

## Response

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "message": "Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ.",
    "user_id": 123
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Always `true` for successful response |
| data.message | string | User-friendly success message in Vietnamese |
| data.user_id | number | ID of newly created user account |

---

## Error Responses

### 400 Bad Request - Validation Failed

```json
{
  "success": false,
  "error": "Mật khẩu phải có ít nhất 8 ký tự"
}
```

**Triggers**:

- Invalid email format
- OTP not 6 digits
- Full name empty or > 255 chars
- Phone number invalid format
- Password doesn't meet strength requirements

---

### 400 Bad Request - No Verification Request Found

```json
{
  "success": false,
  "error": "Không tìm thấy yêu cầu xác thực. Vui lòng bắt đầu lại từ Bước 1."
}
```

**Trigger**: No record found in `email_verifications` table for the provided email

**Scenario**: User skipped Step 1, or OTP expired and was deleted

---

### 400 Bad Request - OTP Expired

```json
{
  "success": false,
  "error": "Mã OTP đã hết hạn. Vui lòng gửi lại OTP mới."
}
```

**Trigger**: `created_at` timestamp is older than 10 minutes

**Calculation**: `NOW() - created_at > 10 minutes`

---

### 400 Bad Request - OTP Incorrect

```json
{
  "success": false,
  "error": "Mã OTP không đúng. Bạn còn 3 lần thử.",
  "remaining_attempts": 3
}
```

**Trigger**: OTP doesn't match hash via `bcrypt.compare(otp, otp_hash)`

**Additional Field**:

- `remaining_attempts`: Number of attempts left before lockout (5 - current_attempts)

**Behavior**:

- Increment `attempts` counter in database
- If `attempts >= 5`: Trigger lockout (see 429 error below)

---

### 429 Too Many Requests - Email Locked

```json
{
  "success": false,
  "error": "Bạn đã nhập sai mã OTP quá nhiều lần. Email này đã bị khóa trong 15 phút.",
  "locked_until": "2026-06-29T10:15:00.000Z"
}
```

**Trigger**:

- Email has `is_locked = true` and `locked_until > NOW()`
- OR just reached 5th failed attempt

**Additional Field**:

- `locked_until`: ISO 8601 timestamp when lock expires

**Behavior** (when triggering lockout):

- Set `is_locked = TRUE`
- Set `locked_until = NOW() + 15 minutes`
- Return 429 immediately

---

### 500 Internal Server Error - Transaction Failed

```json
{
  "success": false,
  "error": "Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại."
}
```

**Trigger**: Database transaction rollback (user creation or email_verification deletion failed)

**Behavior**:

- Entire transaction rolled back
- No user created
- email_verifications record preserved (can retry)
- Error logged with stack trace

---

## Business Logic

### Processing Flow

```text
1. Validate request body with Zod
   ├─ Invalid → 400 Bad Request with specific error
   └─ Valid → Continue

2. Normalize email (lowercase, trim)

3. Lookup email_verifications record by email
   ├─ Not found → 400 "Không tìm thấy yêu cầu xác thực"
   └─ Found → Continue

4. Check if email is locked
   ├─ is_locked = TRUE AND locked_until > NOW() → 429 Locked
   ├─ is_locked = TRUE AND locked_until <= NOW() → Reset lock (is_locked=FALSE, attempts=0), Continue
   └─ is_locked = FALSE → Continue

5. Check OTP expiration (TTL = 10 minutes)
   ├─ (NOW() - created_at) > 10 minutes → 400 "Mã OTP đã hết hạn"
   └─ Not expired → Continue

6. Verify OTP with bcrypt
   Compare: bcrypt.compare(otp, otp_hash)
   ├─ Wrong OTP → Increment attempts
   │  ├─ attempts < 5 → 400 "Mã OTP không đúng. Bạn còn X lần thử"
   │  └─ attempts >= 5 → Set is_locked=TRUE, locked_until=NOW()+15min, 429 Locked
   └─ Correct OTP → Continue

7. BEGIN TRANSACTION

8. Get Volunteer role_id
   Query: SELECT id FROM roles WHERE name = 'VOLUNTEER' LIMIT 1
   ├─ Not found → ROLLBACK, 500 "Role not configured"
   └─ Found → Continue

9. Hash password with bcrypt (12 rounds)
   hash = bcrypt.hash(password, 12)

10. Create user in users table
    INSERT INTO users (email, password_hash, full_name, phone_number, role_id, is_active)
    VALUES (email, hash, full_name, phone_number, volunteer_role_id, TRUE)
    ├─ Duplicate email constraint → ROLLBACK, 409 "Email đã tồn tại"
    └─ Success → Get user_id, Continue

11. Delete email_verifications record
    DELETE FROM email_verifications WHERE email = ?
    ├─ Failure → ROLLBACK
    └─ Success → Continue

12. COMMIT TRANSACTION

13. Return 201 Created with user_id
```

### State Transitions

```text
email_verifications:
  [PENDING] → OTP verified → [DELETED]
  [PENDING] → Wrong OTP → [PENDING, attempts++]
  [PENDING] → 5 wrong OTPs → [LOCKED]
  [LOCKED] → Lock expired → [UNLOCKED] (on next attempt)

users:
  [NOT EXISTS] → OTP verified → [CREATED, is_active=TRUE, role=VOLUNTEER]
```

---

## Security Considerations

### Password Security

- Password hashed with bcrypt (12 rounds) BEFORE storage
- Plaintext password NEVER logged or stored
- Hash stored in `users.password_hash` column
- Frontend should also enforce password strength (client-side validation)

### OTP Security

- OTP verified against bcrypt hash (not plaintext comparison)
- OTP plaintext NEVER stored in database
- 10-minute TTL prevents replay attacks
- 5-attempt limit + 15-minute lockout prevents brute force
- 1,000,000 possible combinations (6 digits)

### Transaction Atomicity

- User creation and email_verification deletion wrapped in transaction
- Ensures no orphaned records
- Rollback on any failure prevents partial state

### Attack Vectors

| Attack | Mitigation |
|--------|-----------|
| OTP brute force | 5-attempt lockout + 15-min freeze + 10-min TTL |
| Password brute force (future login) | bcrypt 12 rounds, future login rate limiting |
| Race condition (duplicate user) | Database UNIQUE constraint on email |
| Transaction failure | Rollback ensures atomicity |

---

## Database Changes

### Table: `users`

**Action**: INSERT

```sql
INSERT INTO users (email, password_hash, full_name, phone_number, role_id, is_active, created_at)
VALUES (
  'user@vms.com',
  '$2a$12$...', -- bcrypt hash
  'Nguyễn Văn A',
  '0912345678',
  1, -- Volunteer role_id
  TRUE,
  NOW()
);
```

### Table: `email_verifications`

**Action**: DELETE

```sql
DELETE FROM email_verifications WHERE email = 'user@vms.com';
```

**OR UPDATE** (if wrong OTP):

```sql
UPDATE email_verifications
SET attempts = attempts + 1
WHERE email = 'user@vms.com';
```

**OR UPDATE + LOCK** (if 5th wrong OTP):

```sql
UPDATE email_verifications
SET 
  attempts = 5,
  is_locked = TRUE,
  locked_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
WHERE email = 'user@vms.com';
```

---

## Testing

### Test Cases

#### TC-01: Happy Path - Correct OTP

**Precondition**:

- email_verifications has record for "<user@vms.com>" with valid OTP hash
- created_at within last 10 minutes

**Request**:

```json
POST /api/v1/auth/register/verify-otp
{
  "email": "user@vms.com",
  "otp": "123456",
  "full_name": "Nguyễn Văn A",
  "phone_number": "0912345678",
  "password": "Password123"
}
```

**Expected**:

- Status: 201
- Database:
  - 1 user created in users table
  - email_verifications record deleted
- Response: success message with user_id

---

#### TC-02: Wrong OTP - Attempts Remaining

**Precondition**: Record exists, attempts = 2

**Request**:

```json
{
  "email": "user@vms.com",
  "otp": "999999",
  ...
}
```

**Expected**:

- Status: 400
- Database: attempts incremented to 3
- Response: "Mã OTP không đúng. Bạn còn 2 lần thử"

---

#### TC-03: Wrong OTP - 5th Attempt Triggers Lockout

**Precondition**: Record exists, attempts = 4

**Request**:

```json
{
  "email": "user@vms.com",
  "otp": "999999",
  ...
}
```

**Expected**:

- Status: 429
- Database: is_locked=TRUE, locked_until set
- Response: "Email đã bị khóa trong 15 phút"

---

#### TC-04: OTP Expired

**Precondition**: Record created_at = 11 minutes ago

**Request**:

```json
{
  "email": "user@vms.com",
  "otp": "123456",
  ...
}
```

**Expected**:

- Status: 400
- Response: "Mã OTP đã hết hạn"

---

#### TC-05: No Verification Record

**Precondition**: No record in email_verifications for email

**Request**:

```json
{
  "email": "unknown@vms.com",
  "otp": "123456",
  ...
}
```

**Expected**:

- Status: 400
- Response: "Không tìm thấy yêu cầu xác thực"

---

#### TC-06: Password Validation Failure

**Request**:

```json
{
  "email": "user@vms.com",
  "otp": "123456",
  "full_name": "User",
  "phone_number": "0912345678",
  "password": "weak"
}
```

**Expected**:

- Status: 400
- Response: "Mật khẩu phải có ít nhất 8 ký tự"

---

#### TC-07: Phone Number Validation Failure

**Request**:

```json
{
  ...
  "phone_number": "123"
}
```

**Expected**:

- Status: 400
- Response: "Số điện thoại không hợp lệ"

---

#### TC-08: Lock Expired - Reset and Allow

**Precondition**:

- is_locked=TRUE
- locked_until = 20 minutes ago (expired)

**Request**:

```json
{
  "email": "user@vms.com",
  "otp": "123456",
  ...
}
```

**Expected**:

- Status: 201 (if OTP correct)
- Database: Lock reset before verification
- User created successfully

---

## Performance

### Expected Metrics

- **Response Time**:
  - Fast path (validation only): < 50ms
  - Full path (bcrypt hash + transaction): < 500ms
  - Target p95: < 150ms

- **Database Queries**: 4-5 queries
  1. SELECT from email_verifications
  2. SELECT role_id from roles
  3. INSERT into users
  4. DELETE from email_verifications
  5. Optional: UPDATE attempts if wrong OTP

- **Transaction Duration**: < 100ms (2 writes in transaction)

### Bottlenecks

- **bcrypt hashing**: ~100ms for 12 rounds (acceptable for registration)
- **Transaction lock**: Minimal (single row operations)

---

## Dependencies

- **Zod**: Request validation
- **bcryptjs**: OTP verification + password hashing
- **Prisma**: Database transactions
- **crypto**: Not used in this endpoint (only in send-otp)

---

## Post-Registration Flow

After successful registration (201 response):

1. **Frontend**:
   - Show success toast: "Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ."
   - Redirect to Login page after 2 seconds

2. **Backend**: No additional actions (no welcome email in Phase 1)

3. **User**: Can now login with registered email + password via UC03 Login feature

---

## Rollback Scenario

If transaction fails at any step:

```text
BEGIN TRANSACTION
  1. Get role_id → Success
  2. Hash password → Success
  3. INSERT user → FAIL (e.g., database constraint)
  
ROLLBACK TRANSACTION

Result:
  - No user created
  - email_verifications record preserved
  - User can retry with same OTP (if still valid)
  - Return 500 error
```

---

**Contract Status**: ✅ APPROVED - Ready for implementation

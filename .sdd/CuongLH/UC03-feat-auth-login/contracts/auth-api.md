# API Contract: POST /api/v1/auth/login

**Feature**: UC03-feat-auth-login  
**Endpoint**: `POST /api/v1/auth/login`  
**Owner**: Member 1 - CuongLH  
**Date**: 2026-06-29

---

## Overview

API endpoint cho phép người dùng đăng nhập vào hệ thống VMS bằng Email và Password. Trả về JWT token trong HttpOnly Cookie và thông tin user trong response body.

> **Note on Response Format**: The actual `response.util.js` returns plain objects (not Express responses directly):
>
> - `successResponse(res, data, message)` returns `{ success: true, message, data }` (message defaults to "Thành công")
> - `errorResponse(res, message, errorCode, details)` returns `{ success: false, message, code, details }`
>
---

## Request

### HTTP Method

```
POST /api/v1/auth/login
```

### Headers

| Header | Required | Value | Description |
|--------|----------|-------|-------------|
| `Content-Type` | ✅ Yes | `application/json` | Request body format |

### Request Body

**Schema**:

```json
{
  "email": "string (required, email format)",
  "password": "string (required, min length 1)"
}
```

**Example**:

```json
{
  "email": "volunteer@vms.com",
  "password": "SecurePassword123!"
}
```

### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| `email` | Required | "Email là bắt buộc" |
| `email` | Valid email format | "Email không hợp lệ" |
| `email` | Max 255 characters | "Email quá dài (tối đa 255 ký tự)" |
| `password` | Required | "Mật khẩu là bắt buộc" |
| `password` | Min 1 character | "Mật khẩu không được để trống" |

**Note**: Password strength validation KHÔNG kiểm tra khi login (chỉ check khi Register - UC04).

---

## Response

### Success Response (HTTP 200)

**Headers**:

```
Set-Cookie: token=<JWT_TOKEN>; HttpOnly; Secure; SameSite=Lax; Max-Age=604800; Path=/
```

**Body Schema**:

```json
{
  "success": true,
  "message": "Dang nhap thanh cong",
  "data": {
    "user": {
      "id": "number",
      "email": "string",
      "full_name": "string",
      "role_id": "number",
      "role_name": "string",
      "phone": "string | null",
      "avatar_url": "string | null",
      "created_at": "string (ISO 8601)"
    }
  }
}
```

**Example**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "email": "volunteer@vms.com",
      "full_name": "Nguyễn Văn A",
      "role_id": 1,
      "avatar_url": "https://res.cloudinary.com/vms/image/upload/v1234567890/avatars/user_123.jpg"
    }
  }
}
```

**Cookie Details**:

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `name` | `token` | Cookie name |
| `value` | JWT token string | Encoded: `{user_id, email, role_id, role_name, jti}` |
| `HttpOnly` | `true` | Prevent JavaScript access (anti-XSS) |
| `Secure` | `true` (prod), `false` (dev) | HTTPS only in production |
| `SameSite` | `Lax` | CSRF protection, allow top-level navigation |
| `Max-Age` | `604800` seconds (7 days) | Match JWT expiry |
| `Path` | `/` | Available to all routes |

**Fields Excluded from Response** (Security):

- ❌ `password_hash` — NEVER returned
- ❌ `jti` — Internal session ID, not for client
- ❌ `is_active` — Internal flag
- ❌ `email_verified` — May add in future, out of scope UC03

---

### Error Responses

#### 400 Bad Request — Validation Error

**Scenario**: Invalid email format hoặc missing required fields

**Body**:

```json
{
  "success": false,
  "message": "email: Email không hợp lệ; password: Mật khẩu là bắt buộc",
  "code": "VALIDATION_ERROR"
}
```

**Example Triggers**:

- Email: `not-an-email`
- Password: `""` (empty string)
- Missing email field
- Missing password field

---

#### 401 Unauthorized — Invalid Credentials

**Scenario 1**: Email không tồn tại HOẶC password sai

**Body**:

```json
{
  "success": false,
  "message": "Email hoặc mật khẩu chưa chính xác",
  "code": "UNAUTHORIZED"
}
```

**Security Note**:

- Message KHÔNG tiết lộ email có tồn tại hay không (chống user enumeration)
- Cùng 1 message cho cả "email not found" và "password mismatch"

**Scenario 2**: Nhập sai < 5 lần

**Side Effect**:

- `login_attempts.attempts` incremented
- No lockout yet

---

#### 403 Forbidden — Account Disabled

**Scenario 1**: User account có `isActive = false` (soft deleted)

**Body**:

```json
{
  "success": false,
  "message": "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.",
  "code": "ACCOUNT_DISABLED"
}
```

**Trigger**: Admin đã vô hiệu hóa tài khoản qua User Management (UC29)

**Scenario 2**: User account có `emailVerified = false` (chưa xác thực email)

**Body**:

```json
{
  "success": false,
  "message": "Email chưa được xác thực. Vui lòng kiểm tra email để xác nhận tài khoản.",
  "code": "EMAIL_NOT_VERIFIED"
}
```

**Trigger**: Đăng nhập khi email chưa được xác thực qua UC62/UC64

---

#### 429 Too Many Requests — Account Locked

**Scenario**: Nhập sai password 5 lần liên tiếp trong 15 phút

**Body**:

```json
{
  "success": false,
  "message": "Tài khoản tạm thời bị khóa do nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau 15 phút.",
  "code": "ACCOUNT_LOCKED",
  "details": {
    "locked_until": "2026-06-29T10:30:00.000Z"
  }
}
```

**Side Effect**:

- `loginAttempt.lockedUntil` set to NOW() + 15 minutes
- User KHÔNG thể login (kể cả password đúng) cho đến khi hết thời gian khóa

**Auto-Unlock**:

- Sau 15 phút, `lockedUntil < NOW()` → Account tự động unlock
- User có thể thử login lại

---

#### 500 Internal Server Error — Unexpected Error

**Scenario**: Database connection failed, Redis unavailable, JWT sign failed, etc.

**Body**:

```json
{
  "success": false,
  "message": "Internal server error. Please try again later.",
  "code": "INTERNAL_SERVER_ERROR"
}
```

**Logging**:

- Error details logged server-side với Pino logger
- KHÔNG expose stack trace, database errors, hoặc internal details trong response

---

## JWT Token Payload

**Encoded in Cookie** (not visible to JavaScript):

```json
{
  "user_id": 123,
  "email": "volunteer@vms.com",
  "role_id": 1,
  "role_name": "VOLUNTEER",
  "jti": "123-1719648000000-abc123def",
  "iat": 1719648000,
  "exp": 1720252800
}
```

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | number | User ID from `users.id` |
| `email` | string | User email (lowercase) |
| `role_id` | number | User role ID (1=VOLUNTEER, 2=STAFF, 3=MANAGER, 4=ADMIN) |
| `role_name` | string | Role name string (VOLUNTEER, STAFF, MANAGER, ADMIN) |
| `jti` | string (composite: `{userId}-{timestamp}-{random}`) | JWT ID for session tracking |
| `iat` | number (Unix timestamp) | Issued At timestamp |
| `exp` | number (Unix timestamp) | Expiry timestamp (iat + 7 days) |

**Signing**:

- Algorithm: HS256 (HMAC SHA-256)
- Secret: `AUTH_SECRET` from .env (min 256 bits)

---

## Business Logic Flow

### Happy Path (Success)

```
1. [Request] POST /api/v1/auth/login
   Body: { email, password }

2. [Middleware] Zod validation
   - Email format check
   - Required fields check
   → Pass: next()
   → Fail: Return 400

3. [Controller] Extract email, password
   → Call AuthService.login(email, password)

4. [Service] Check lockout
   Query: SELECT locked_until FROM login_attempts WHERE email = ?
   → IF locked_until > NOW(): Throw 429
   → ELSE: Continue

5. [Service] Find user
   Query: SELECT * FROM users WHERE email = ? AND is_active = true
   → IF not found: Increment attempts, Throw 401
   → IF found: Continue

6. [Service] Verify password
   bcrypt.compare(password, user.password_hash)
   → IF mismatch: Increment attempts, Throw 401
   → IF match: Continue

7. [Service] Generate JWT
   jti = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
   payload = { user_id, email, role_id, role_name, jti }
   token = jwt.sign(payload, AUTH_SECRET, { expiresIn: '7d' })

8. [Service] Upsert session (Single Active Session)
   Query: UPSERT user_sessions SET jti = ?, expires_at = ? WHERE user_id = ?
   → Old jti overwritten → Old JWT invalid

9. [Service] Reset login attempts
   Query: DELETE FROM login_attempts WHERE email = ?

10. [Controller] Set HttpOnly Cookie
    res.cookie('token', token, { httpOnly, secure, sameSite, maxAge })

11. [Controller] Return success response
    res.json({ success: true, message: 'Dang nhap thanh cong', data: { user: {...} } })
```

### Error Path: Account Locked

```
1-4. [Same as Happy Path steps 1-4]

5. [Service] Check lockout
   locked_until = 2026-06-29T10:30:00Z
   NOW() = 2026-06-29T10:20:00Z
   → locked_until > NOW() = true
   → Throw Error(429, "Account locked...", "ACCOUNT_LOCKED")

6. [Controller] Catch error
   → Return 429 response with locked_until timestamp
```

### Error Path: Invalid Password (< 5 attempts)

```
1-6. [Same as Happy Path steps 1-6]

7. [Service] Verify password
   bcrypt.compare() = false
   → Password mismatch

8. [Service] Increment login attempts
   Query: 
     IF EXISTS (SELECT * FROM login_attempts WHERE email = ?):
       UPDATE login_attempts SET attempts = attempts + 1 WHERE email = ?
     ELSE:
       INSERT INTO login_attempts (email, attempts) VALUES (?, 1)
   
   → attempts = 3 (example, < 5)
   → NO lockout yet

9. [Service] Throw Error(401, "Email hoặc mật khẩu chưa chính xác")

10. [Controller] Return 401 response
```

### Error Path: 5th Failed Attempt → Lockout

```
1-8. [Same as Invalid Password steps 1-8]

9. [Service] Check attempts
   → attempts = 5
   → SET locked_until = NOW() + INTERVAL 15 MINUTE

10. [Service] Throw Error(429, "Account locked...", "ACCOUNT_LOCKED")

11. [Controller] Return 429 response
```

---

## Rate Limiting

### Application-Level (Account Lockout)

| Metric | Value |
|--------|-------|
| Threshold | 5 failed attempts per email |
| Window | Rolling (not fixed window) |
| Lockout Duration | 15 minutes |
| Scope | Per email (account-based) |
| Bypass | Cannot bypass (enforced by database) |

**Note**: Infrastructure-level rate limiting (per IP) là out of scope cho UC03. Có thể implement sau với Nginx, CloudFlare, hoặc WAF.

---

## CORS Configuration

**Required for Cross-Origin Requests** (Dev: localhost:3000 → localhost:5000):

### Backend CORS Setup

```javascript
// backend/src/config/cors.config.js
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN, // http://localhost:3000
  credentials: true, // CRITICAL: Allow cookies
  optionsSuccessStatus: 200
}));
```

### Frontend Axios Setup

```javascript
// frontend/src/api/axiosApi.js
axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL, // http://localhost:5000/api/v1
  withCredentials: true, // CRITICAL: Send cookies
  headers: {
    'Content-Type': 'application/json'
  }
});
```

---

## Security Checklist

✅ **Password NOT returned** in response body

✅ **HttpOnly Cookie** prevents JavaScript access (anti-XSS)

✅ **Secure flag** enabled in production (HTTPS only)

✅ **SameSite=Lax** prevents CSRF attacks

✅ **Error messages** do not reveal email existence

✅ **Account lockout** prevents brute-force (5 attempts / 15 min)

✅ **Single Active Session** prevents account sharing

✅ **Soft delete check** prevents disabled accounts from login

✅ **bcrypt 12 rounds** strong password hashing

✅ **JWT secret** stored in .env, NOT hardcoded

---

## Frontend Integration Example

### API Call

```javascript
// frontend/src/api/authApi.js
import axiosApi from './axiosApi';

export const login = async (email, password) => {
  const response = await axiosApi.post('/auth/login', { email, password });
  return response.data; // { success: true, data: { user } }
};
```

### Usage in Component

```javascript
// frontend/src/pages/LoginPage.jsx
import { login } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const { setUser } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await login(email, password);
      setUser(result.data.user);
      toast.success('Đăng nhập thành công');
      
      // Navigate theo role_id
      const routes = {
        1: '/volunteer/home',    // VOLUNTEER
        2: '/staff/events',      // STAFF
        3: '/manager/dashboard', // MANAGER
        4: '/admin/dashboard'    // ADMIN
      };
      navigate(routes[result.data.user.role_id]);
    } catch (error) {
      const message = error.response?.data?.error || 'Đăng nhập thất bại';
      toast.error(message);
    }
  };
  
  // ... render form
};
```

---

## Testing Checklist

### Happy Path Tests

- [ ] Login với credentials hợp lệ → Return 200 + JWT cookie + user data
- [ ] JWT cookie có đúng attributes (httpOnly, secure, sameSite, maxAge)
- [ ] Response body có đầy đủ user fields (id, email, full_name, role_id, role_name, phone, avatar_url, created_at)
- [ ] Response body KHÔNG chứa password_hash, jti, is_active
- [ ] Session được tạo trong `user_sessions` table với jti mới
- [ ] Login lần 2 cùng account → jti cũ bị ghi đè (Single Active Session)

### Validation Tests

- [ ] Email không hợp lệ → Return 400 với validation error
- [ ] Missing email → Return 400
- [ ] Missing password → Return 400
- [ ] Empty password → Return 400

### Auth Error Tests

- [ ] Email không tồn tại → Return 401 "Email hoặc mật khẩu chưa chính xác"
- [ ] Password sai → Return 401 "Email hoặc mật khẩu chưa chính xác"
- [ ] Email không tồn tại và password sai → Cùng message 401 (không tiết lộ email existence)

### Account Status Tests

- [ ] User có `isActive = false` → Return 403 "Tài khoản đã bị vô hiệu hóa"
- [ ] User có `emailVerified = false` → Return 403 "Email chưa được xác thực"

### Lockout Tests

- [ ] Nhập sai 1-4 lần → Return 401, attempts incremented, NO lockout
- [ ] Nhập sai lần thứ 5 → Return 429 "Account locked", locked_until set
- [ ] Login với password đúng khi đang locked → Return 429 (still locked)
- [ ] Login sau 15 phút locked → Return 200 (auto-unlocked)
- [ ] Login thành công sau failed attempts → login_attempts record deleted

### Security Tests

- [ ] JWT payload chứa đúng fields: user_id, email, role_id, jti, iat, exp
- [ ] JWT signature valid với AUTH_SECRET
- [ ] JWT expires_at = iat + 7 days
- [ ] Cookie httpOnly = true (cannot access via document.cookie)
- [ ] Cookie secure = true in production
- [ ] Response không chứa password_hash, raw token, hoặc sensitive data

---

## Swagger/OpenAPI Documentation

```yaml
/auth/login:
  post:
    tags:
      - Authentication
    summary: User login
    description: |
      Đăng nhập vào hệ thống VMS bằng Email và Password.
      Trả về JWT token trong HttpOnly Cookie và thông tin user trong response body.
      
      **Account Lockout**: Sau 5 lần nhập sai liên tiếp, tài khoản bị khóa 15 phút.
      
      **Single Active Session**: Mỗi user chỉ có 1 session active. Login mới sẽ invalidate session cũ.
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - email
              - password
            properties:
              email:
                type: string
                format: email
                example: "volunteer@vms.com"
                description: "Email đăng nhập (lowercase)"
              password:
                type: string
                minLength: 1
                example: "SecurePassword123!"
                description: "Mật khẩu"
    responses:
      '200':
        description: Đăng nhập thành công
        headers:
          Set-Cookie:
            schema:
              type: string
              example: "token=<JWT>; HttpOnly; Secure; SameSite=Lax; Max-Age=604800; Path=/"
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: "Dang nhap thanh cong"
                data:
                  type: object
                  properties:
                    user:
                      $ref: '#/components/schemas/UserPublic'
      '400':
        description: Validation error
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ValidationError'
      '401':
        description: Invalid credentials
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AuthError'
      '403':
        description: Account disabled
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ForbiddenError'
      '429':
        description: Account locked (too many failed attempts)
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LockoutError'
      '500':
        description: Internal server error
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ServerError'
```

---

**END OF API CONTRACT**

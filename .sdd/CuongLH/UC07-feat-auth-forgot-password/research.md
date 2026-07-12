# UC07 Forgot Password Research Findings

**Feature**: Quên Mật Khẩu (Forgot Password)  
**Date**: 2026-06-29  
**Status**: COMPLETED

## 1. OTP Generation Best Practices

**Decision**: Use `crypto.randomInt(0, 1000000).toString().padStart(6, 0)` for 6-digit OTP generation

**Rationale**:

- `crypto.randomInt()` is cryptographically secure PRNG from Node.js `crypto` module
- `padStart(6, "'0'")` ensures leading zeros (e.g., "000123") for full 1M range (000000-999999)
- Covers full 6-digit range without bias
- Node.js >= 14.10.0 (VMS uses modern Node)

**Alternatives Considered**:

- `crypto.randomBytes(3)` + modulo: Creates bias in distribution
- `Math.random()`: NOT cryptographically secure, predictable
- `crypto.randomInt(100000, 999999)`: Excludes leading-zero values (000000-099999)

**Implementation Notes**:

```javascript
// backend/src/utils/otp.util.js
import crypto from 'crypto';

export function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}
```

OTP collision is statistically negligible (1M possible values, TTL 10 min, expected concurrent users << 1000). No additional collision prevention needed.

---

## 2. Database Schema Design for Shared OTP Table

**Decision**: Single `email_verifications` table with `type` discriminator (Source of truth: `DATABASE.md §3.1`)

**Schema**:

```prisma
enum VerificationType {
  REGISTER
  RESET_PASSWORD
}

model EmailVerification {
  id           Int              @id @default(autoincrement())
  email        String           @db.VarChar(255)
  otp_hash     String           @db.VarChar(255)
  type         VerificationType @default(REGISTER)
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

**Rationale**:

- Single table reduces code duplication (validation, cleanup logic)
- `type` field allows filtering by use case while sharing lockout logic
- UNIQUE(email, type) enforces 1 active record per email per flow — upsert replaces old record
- TTL tính từ `created_at` (10 phút), không cần cột `expires_at` riêng
- Cooldown tính từ `last_sent_at` (60 giây), phân biệt với TTL

**Alternatives Considered**:

- Separate tables (`otp_register`, `otp_reset_password`): Duplicate logic, harder to maintain
- No `type` field: Cannot distinguish register vs reset in shared table
- `is_active` soft delete flag: **REJECTED** — UNIQUE constraint + upsert đã đảm bảo 1 record active, soft delete không cần thiết và gây nhầm lẫn với `is_locked`

**Implementation Notes**:

- Unique constraint `(email, type)` đảm bảo chỉ có 1 record mỗi flow — dùng upsert khi tạo OTP mới
- OTP mới → upsert record (reset `attempts=0`, `is_locked=false`, cập nhật `otp_hash`, `created_at`, `last_sent_at`)
- Query pattern: `findUnique({ where: { email_type: { email, type: 'RESET_PASSWORD' } } })`
- Cleanup query (optional): `DELETE FROM email_verifications WHERE created_at < NOW() - INTERVAL 10 MINUTE AND type = 'RESET_PASSWORD'` (lazy delete records hết hạn chưa dùng)

---

## 3. Zero User Enumeration Implementation

**Decision**: Always return success response + generate fake OTP for non-existing emails (discard without sending)

**Rationale**:

- Response time MUST be identical whether email exists or not
- Generate OTP for non-existing emails to match database write latency
- Do NOT send email for non-existing users (silent discard)
- Frontend always shows "Nếu email tồn tại, OTP đã được gửi" (conditional phrasing)

**Alternatives Considered**:

- Return error for non-existing email: **REJECTED** (enables user enumeration)
- Always send email: **REJECTED** (wastes resources, potential spam abuse)
- Add artificial delay for non-existing emails: **REJECTED** (timing still detectable via variance)

**Implementation Notes**:

```javascript
// backend/src/services/auth.service.js
async requestResetPassword(email) {
  const user = await UserRepository.findByEmail(email);
  
  const otp = generateOTP(); // Generate for both cases
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  
  if (user) {
    // Real flow: Save OTP + send email
    await OtpRepository.invalidateOldOTPs(email, 'RESET_PASSWORD');
    await OtpRepository.create({
      email, otp, type: 'RESET_PASSWORD',
      expires_at: expiresAt, is_active: true
    });
    await EmailService.sendResetPasswordOTP(email, otp);
  } else {
    // Fake flow: Discard silently (same DB write latency via noop)
    await OtpRepository.noop(); // Simulate DB write delay
  }
  
  // Identical response for both cases
  return { 
    success: true, 
    message: 'Nếu email tồn tại trong hệ thống, mã OTP đã được gửi' 
  };
}
```

Timing attack mitigation: Database query time variance is negligible (indexed query), email sending is async.

---

## 4. Lockout Mechanism Design

**Decision**: Store `locked_until` in same `otp_verifications` record

**Rationale**:

- Lockout is OTP-specific state, belongs in OTP record
- Simplifies query: `WHERE locked_until > NOW()` in same table lookup
- No need for separate `lockout` table (reduces joins)
- Lockout cleared when new OTP generated (overwrite old record via `is_active = false`)

**Alternatives Considered**:

- Separate `account_lockouts` table: **REJECTED** (over-engineering for OTP-only lockout)
- Global user lockout: **REJECTED** (out of scope for UC07, belongs in login flow)

**Implementation Notes**:

```javascript
// Check lockout BEFORE checking cooldown
const latestOTP = await OtpRepository.findLatest(email, 'RESET_PASSWORD');

if (latestOTP?.locked_until && latestOTP.locked_until > new Date()) {
  const remainingSeconds = Math.ceil((latestOTP.locked_until - Date.now()) / 1000);
  throw new AppError(429, `Tài khoản bị khóa ${remainingSeconds}s do nhập sai OTP quá nhiều`);
}

// Then check cooldown (60s since last_sent_at — NOT created_at)
if (latestOTP?.last_sent_at) {
  const cooldownExpiry = new Date(latestOTP.last_sent_at.getTime() + 60 * 1000);
  if (cooldownExpiry > new Date()) {
    const remainingSeconds = Math.ceil((cooldownExpiry - Date.now()) / 1000);
    throw new AppError(429, `Vui lòng chờ ${remainingSeconds}s trước khi gửi lại OTP`);
  }
}
```

Lockout triggers after 5 failed attempts: `UPDATE email_verifications SET attempts = attempts + 1, locked_until = NOW() + INTERVAL 15 MINUTE WHERE email = ? AND type = 'RESET_PASSWORD' AND attempts >= 4`.

---

## 5. OTP Invalidation Strategy

**Decision**: Upsert khi tạo OTP mới (thay thế record cũ qua UNIQUE constraint) + hard DELETE sau reset thành công

**Rationale**:

- UNIQUE(email, type) đã đảm bảo mỗi email chỉ có 1 record mỗi flow — upsert tự nhiên thay thế record cũ mà không cần soft delete
- Hard DELETE sau reset thành công (FR-012): OTP đã dùng không cần giữ lại, audit trail được ghi qua Pino log
- Lazy delete OTP hết hạn chưa dùng: xóa trong cùng transaction khi user tạo OTP mới (hoặc bỏ qua nếu upsert đã ghi đè)

**Alternatives Considered**:

- Soft delete (`is_active = false`): **REJECTED** — không tồn tại cột `is_active` trong schema. UNIQUE constraint + upsert đã đủ để đảm bảo tính duy nhất
- Never delete: **REJECTED** (unbounded table growth)
- MySQL Event Scheduler: **REJECTED** cho MVP (over-engineering), sẽ xem xét Phase 2

**Implementation Notes**:

**Upsert khi tạo OTP mới** (thay thế hoàn toàn record cũ):

```javascript
// Upsert: nếu record (email, RESET_PASSWORD) đã tồn tại → ghi đè; nếu chưa → tạo mới
await prisma.emailVerification.upsert({
  where: { email_type: { email, type: 'RESET_PASSWORD' } },
  create: {
    email,
    otp_hash: hashedOtp,
    type: 'RESET_PASSWORD',
    last_sent_at: new Date(),
    attempts: 0,
    is_locked: false,
    locked_until: null
  },
  update: {
    otp_hash: hashedOtp,
    created_at: new Date(),
    last_sent_at: new Date(),
    attempts: 0,
    is_locked: false,
    locked_until: null
  }
});
```

**Hard DELETE sau reset thành công** (trong transaction cùng với update password):

```javascript
await prisma.$transaction([
  prisma.user.update({
    where: { email },
    data: { password_hash: hashedPassword }
  }),
  prisma.emailVerification.delete({
    where: { email_type: { email, type: 'RESET_PASSWORD' } }
  })
]);
```

**Cleanup tùy chọn** cho OTP hết hạn chưa dùng (lazy delete, không bắt buộc):

```sql
-- Chạy định kỳ hoặc tích hợp vào cron job chung
DELETE FROM email_verifications 
  WHERE type = 'RESET_PASSWORD'
    AND created_at < NOW() - INTERVAL 10 MINUTE
    AND is_locked = FALSE;
```

---

## 6. Email Service Integration

**Decision**: Async email sending with try-catch + silent logging (do NOT block API response)

**Rationale**:

- Email service failure MUST NOT crash API or expose system state
- Zero user enumeration requires identical response regardless of email send success
- Logging email errors helps ops debug, but frontend never sees them

**Alternatives Considered**:

- Blocking email send: **REJECTED** (slow API response, reveals email existence via timeout)
- Queue-based email (Bull/BullMQ): **REJECTED** (over-engineering for MVP, adds Redis dependency)
- Retry logic: **REJECTED** (complicates flow, 10-min TTL makes retry risky)

**Implementation Notes**:

```javascript
// backend/src/services/email.service.js
import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendResetPasswordOTP(email, otp) {
  try {
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: 'Mã OTP đặt lại mật khẩu - VMS',
      html: `
        <h2>Đặt lại mật khẩu VMS</h2>
        <p>Mã OTP của bạn là: <strong>${otp}</strong></p>
        <p>Mã có hiệu lực trong 10 phút.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      `
    });
    logger.info(`Reset password OTP sent to ${email}`);
  } catch (error) {
    // Log error but DO NOT throw (silent failure for zero enumeration)
    logger.error(`Failed to send OTP to ${email}:`, error.message);
  }
}
```

**Environment Variables**:

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=VMS System
SMTP_FROM_EMAIL=noreply@vms.com
```

Frontend displays generic success message regardless of email send outcome.

---

## 7. Frontend State Management

**Decision**: Single-page component with `useState` local stepper (3 steps internally), NO Context or sessionStorage

**Rationale**:

- All 3 steps in same component `ForgotPasswordPage.jsx`, uses `useState` to manage `step` and `email`
- OTP managed via `react-hook-form` `watch`/`setValue`, no separate state needed
- `useCountdown` hook manages resend OTP timer (60s)
- Avoids leaking email in URL, sessionStorage, or browser history
- Refresh page resets to Step 1 (spec EC5)

**Alternatives Considered**:

- React Context + sessionStorage: **REJECTED** (unnecessary, spec requires reset on refresh)
- URL params: **REJECTED** (privacy leak)
- localStorage: **REJECTED** (persists after tab close, security risk)
- Redux: **REJECTED** (over-engineering)
- 3 separate pages + 3 routes: **REJECTED** (needs complex router guards, exposes state via URL)

**Implementation Notes**:

```javascript
// frontend/src/components/pages/auth/ForgotPasswordPage.jsx
const [step, setStep] = useState(1);
const [email, setEmail] = useState('');
const { register, handleSubmit, watch, setValue } = useForm({...});
const { seconds, isActive, start } = useCountdown();
```

**State Cleanup**:

- Refresh page resets to Step 1 (natural due to useState)
- After successful password reset navigate('/login')
- No sessionStorage cleanup needed since not used

---

## Summary of Key Decisions

## Summary of Key Decisions

| Aspect | Decision | Why |
|--------|----------|-----|
| OTP Generation | `crypto.randomInt(100000, 999999)` | Secure, no bias, simple |
| Database Schema | Shared `email_verifications` table với `type` enum + UNIQUE(email, type) | Reduces duplication, upsert enforces uniqueness |
| User Enumeration | Always success response + fake OTP for non-existing emails | Timing-attack resistant |
| Lockout Storage | `is_locked` + `locked_until` fields in same `email_verifications` record | Single-table query, auto-cleared on upsert |
| OTP Invalidation | Upsert khi tạo OTP mới (ghi đè record cũ) + hard DELETE sau reset thành công (FR-012) | UNIQUE constraint handles uniqueness; không cần soft delete |
| Cooldown Check | `last_sent_at + 60s > NOW()` — dùng `last_sent_at`, KHÔNG phải `created_at` | `created_at` là TTL (10 phút), `last_sent_at` là cooldown (60s) |
| Email Sending | Async + silent error logging | Zero enumeration + graceful degradation |
| Frontend State | React Context + sessionStorage | State sharing + refresh resilience + security |

All decisions align with VMS tech stack (Node + Prisma + React + Bootstrap) and security requirements (zero enumeration, timing attack prevention, audit trail).

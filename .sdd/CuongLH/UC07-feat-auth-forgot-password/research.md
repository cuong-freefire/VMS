# UC07 Forgot Password Research Findings

**Feature**: Quên Mật Khẩu (Forgot Password)  
**Date**: 2026-06-29  
**Status**: COMPLETED

## 1. OTP Generation Best Practices

**Decision**: Use `crypto.randomInt(100000, 999999)` for 6-digit OTP generation

**Rationale**:
- `crypto.randomInt()` is cryptographically secure PRNG from Node.js `crypto` module
- Directly generates integer in range [100000, 999999] without modulo bias
- Simpler than `randomBytes()` + conversion logic
- Node.js >= 14.10.0 (VMS uses modern Node)

**Alternatives Considered**:
- `crypto.randomBytes(3)` + modulo: Creates bias in distribution
- `Math.random()`: NOT cryptographically secure, predictable
- UUID/nanoid: Overkill for short-lived OTP, harder for users to type

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

**Decision**: React Context + sessionStorage for state persistence across 3 pages

**Rationale**:
- React Context shares state between Email/OTP/NewPassword pages without prop drilling
- sessionStorage persists email + verification token across page refreshes (fallback to /forgot-password if missing)
- URL params NOT used (exposes email in browser history, shareable links bypass flow)
- Redux overkill for single-feature state

**Alternatives Considered**:
- URL params (`?email=...`): **REJECTED** (privacy leak, users can share link to skip email entry)
- localStorage: **REJECTED** (persists after tab close, security risk)
- Redux: **REJECTED** (over-engineering for 3-page flow)

**Implementation Notes**:

**Context Provider**:
```javascript
// frontend/src/contexts/ResetPasswordContext.jsx
import { createContext, useState, useEffect } from 'react';

export const ResetPasswordContext = createContext();

export function ResetPasswordProvider({ children }) {
  const [email, setEmail] = useState(() => 
    sessionStorage.getItem('reset_email') || ''
  );
  const [otpVerified, setOtpVerified] = useState(() => 
    sessionStorage.getItem('reset_otp_verified') === 'true'
  );

  useEffect(() => {
    if (email) sessionStorage.setItem('reset_email', email);
    else sessionStorage.removeItem('reset_email');
  }, [email]);

  useEffect(() => {
    if (otpVerified) sessionStorage.setItem('reset_otp_verified', 'true');
    else sessionStorage.removeItem('reset_otp_verified');
  }, [otpVerified]);

  const clearResetState = () => {
    setEmail('');
    setOtpVerified(false);
    sessionStorage.removeItem('reset_email');
    sessionStorage.removeItem('reset_otp_verified');
  };

  return (
    <ResetPasswordContext.Provider value={{
      email, setEmail,
      otpVerified, setOtpVerified,
      clearResetState
    }}>
      {children}
    </ResetPasswordContext.Provider>
  );
}
```

**Route Guards**:
```javascript
// frontend/src/pages/ResetPasswordOTPPage.jsx
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResetPasswordContext } from '../contexts/ResetPasswordContext';

export default function ResetPasswordOTPPage() {
  const { email } = useContext(ResetPasswordContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!email) {
      // Redirect to email entry if no email in context
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  // Component logic...
}
```

**State Cleanup**:
- Clear context + sessionStorage after successful password reset
- Clear on manual logout
- sessionStorage auto-clears on tab close (security boundary)

---

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

# Research: Authentication Register Technical Decisions

**Feature**: UC04 - Authentication Register (OTP Email Verification)

**Date**: 2026-06-29

**Status**: COMPLETED

---

## R1: OTP Generation Strategy

**Decision**: Use `crypto.randomInt(100000, 999999)` from Node.js crypto module

**Rationale**:
- `crypto.randomInt()` is cryptographically secure (uses CSPRNG)
- Directly generates integers in range [100000, 999999] for 6-digit OTP
- No need for string manipulation or modulo operations that could introduce bias
- Native to Node.js (no external dependencies)
- Performance: ~0.01ms per generation (negligible overhead)

**Alternatives Considered**:

1. **crypto.randomBytes() + toString()**
   - More complex: requires buffer → hex → integer conversion
   - Can introduce bias if not carefully implemented
   - Rejected: Unnecessary complexity

2. **Math.random()**
   - NOT cryptographically secure (uses PRNG, not CSPRNG)
   - Predictable if attacker knows seed
   - Rejected: Security vulnerability

3. **UUID/nanoid libraries**
   - Overkill for 6-digit numeric OTP
   - Additional dependency
   - Rejected: Simpler built-in solution available

**Implementation**:

```javascript
// backend/src/utils/otp.util.js
import crypto from 'crypto';

export function generateOTP() {
  // Generate cryptographically secure 6-digit OTP
  return crypto.randomInt(100000, 999999).toString();
}
```

**Security Note**: 6-digit OTP provides 1,000,000 possible combinations. Combined with 5-attempt lockout and 10-minute expiration, this provides adequate protection against brute-force attacks.

---

## R2: OTP Hashing Algorithm

**Decision**: Use bcrypt with 10 rounds (not 12) for OTP hashing

**Rationale**:
- bcrypt is industry-standard for password hashing, well-tested
- 10 rounds provides good security for short-lived tokens (10-min TTL)
- Lower rounds than passwords (12) because OTP verified once vs password verified repeatedly
- Performance: ~100ms per hash/compare on typical hardware (acceptable for OTP flow)
- Already a project dependency (used for passwords)

**Alternatives Considered**:

1. **argon2id**
   - More modern, winner of Password Hashing Competition 2015
   - Better resistance to GPU/ASIC attacks
   - Rejected: Adds new dependency, overkill for short-lived OTP, bcrypt sufficient

2. **SHA-256 + salt**
   - Faster than bcrypt (~1ms)
   - Not adaptive: vulnerable to brute-force with specialized hardware
   - Rejected: bcrypt adaptive work factor provides better security

3. **Plain text storage**
   - Rejected: Critical security violation (Layer 1 constraint)

**Implementation**:

```javascript
// backend/src/utils/otp.util.js
import bcrypt from 'bcryptjs';

const OTP_SALT_ROUNDS = 10; // Lower than password (12) for performance

export async function hashOTP(otp) {
  return await bcrypt.hash(otp, OTP_SALT_ROUNDS);
}

export async function verifyOTP(otp, hash) {
  return await bcrypt.compare(otp, hash);
}
```

**Performance Impact**: 
- Hash time: ~80-100ms per OTP
- Compare time: ~80-100ms per verification
- Acceptable for registration flow (not in critical path)

---

## R3: Email Template Approach

**Decision**: Plain text email with minimal formatting for MVP

**Rationale**:
- Plain text has highest deliverability across email providers
- No HTML rendering issues on different clients
- Smaller email size (faster delivery)
- Sufficient for OTP delivery use case
- Can upgrade to HTML in Phase 2 without breaking changes

**Alternatives Considered**:

1. **Rich HTML template with CSS**
   - Better branding and visual appeal
   - Higher risk of spam filtering
   - Complexity in template maintenance
   - Rejected for MVP: Deliverability > aesthetics

2. **HTML with inline CSS**
   - Better deliverability than external CSS
   - Still more complex than plain text
   - Deferred to Phase 2: Good middle ground for future

**Implementation**:

```javascript
// backend/src/utils/email.util.js
export function generateOTPEmailContent(otp, email) {
  const subject = 'Mã xác thực đăng ký VMS';
  
  const text = `
Xin chào,

Bạn đã yêu cầu đăng ký tài khoản tình nguyện viên tại VMS.

Mã xác thực OTP của bạn là: ${otp}

Mã này có hiệu lực trong 10 phút kể từ khi nhận được email này.

Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.

---
Volunteer Management System (VMS)
Email: support@vms.com
  `.trim();

  return { subject, text };
}
```

**Email Deliverability Checklist** (for production):
- [ ] SPF record configured for sending domain
- [ ] DKIM signature enabled
- [ ] Use reputable SMTP service (SendGrid/AWS SES)
- [ ] Monitor bounce/complaint rates

---

## R4: Cooldown Implementation

**Decision**: Database-based cooldown using `last_sent_at` timestamp in `email_verifications` table

**Rationale**:
- Spec explicitly mandates database storage (not Redis)
- Cooldown survives server restarts
- Atomic updates prevent race conditions
- Consistent with project architecture (no Redis in current stack)
- Query overhead acceptable (<10ms) for registration flow frequency

**Alternatives Considered**:

1. **Redis with TTL**
   - Faster (in-memory)
   - Requires additional infrastructure
   - Rejected: Spec mandates database, project doesn't use Redis

2. **In-memory Map in Node.js**
   - Fastest (no I/O)
   - Lost on server restart
   - No protection against multiple server instances
   - Rejected: Not persistent, not scalable

**Implementation**:

```javascript
// backend/src/services/auth.service.js
async function checkCooldown(email) {
  const record = await authRepository.findVerificationByEmail(email);
  
  if (!record) {
    return { canSend: true };
  }
  
  const COOLDOWN_SECONDS = 60;
  const now = new Date();
  const lastSent = new Date(record.last_sent_at);
  const elapsedSeconds = Math.floor((now - lastSent) / 1000);
  
  if (elapsedSeconds < COOLDOWN_SECONDS) {
    return {
      canSend: false,
      remainingSeconds: COOLDOWN_SECONDS - elapsedSeconds
    };
  }
  
  return { canSend: true };
}
```

**Database Query**:
```sql
SELECT last_sent_at FROM email_verifications WHERE email = ?
```

**Performance**: Single indexed query (~5-10ms), acceptable for cooldown check.

---

## R5: Frontend State Management

**Decision**: React useState with parent component state (no persistence)

**Rationale**:
- Multi-step form state is temporary (session-scoped)
- No need for global state (only 2 steps, single feature)
- Security: State clears on page reload (prevents stale OTP in browser)
- Simple implementation without external libraries
- Consistent with VMS frontend architecture (minimal state management)

**Alternatives Considered**:

1. **sessionStorage for persistence**
   - Pros: Survives page reload within session
   - Cons: Stores sensitive data (password) in browser, security risk
   - Rejected: Security concern outweighs UX benefit

2. **React Context API**
   - Pros: Centralized state for multiple components
   - Cons: Overkill for 2-step linear flow
   - Rejected: Unnecessary complexity

3. **Redux/Zustand**
   - Pros: Powerful state management
   - Cons: Heavy dependency for simple form
   - Rejected: Not justified for feature scope

**Implementation**:

```javascript
// frontend/src/components/auth/RegisterForm.jsx
function RegisterForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone_number: '',
    password: '',
    confirm_password: ''
  });
  
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const goToStep = (step) => {
    setCurrentStep(step);
  };
  
  return (
    <>
      {currentStep === 1 && (
        <RegisterStep1 
          formData={formData}
          updateFormData={updateFormData}
          goToStep={goToStep}
        />
      )}
      {currentStep === 2 && (
        <RegisterStep2
          formData={formData}
          updateFormData={updateFormData}
          goToStep={goToStep}
        />
      )}
    </>
  );
}
```

**State Flow**:
- Step 1: User fills form → State stored in parent component
- Step 1 → Step 2: Pass formData as props
- Step 2: User can go back, edit data, forward again (state preserved)
- Page reload: State lost (intentional security measure)

---

## R6: Error Message Strategy

**Decision**: Specific error messages with account enumeration trade-off accepted

**Rationale**:
- **UX Priority**: Clear error messages help legitimate users ("Email already registered" → go to login)
- **Security Trade-off**: Email enumeration is LOW RISK for VMS because:
  - VMS is not a high-value target (no financial data)
  - Volunteer accounts are semi-public by nature (profiles visible after events)
  - Rate limiting on registration endpoints prevents automated enumeration
  - Benefit to legitimate users outweighs enumeration risk
- **Industry Practice**: Many mainstream apps (GitHub, LinkedIn) reveal account existence for better UX

**Alternatives Considered**:

1. **Generic error messages**
   - Example: "Registration failed. Please try again."
   - Pros: Prevents email enumeration
   - Cons: Confusing UX, users don't know why it failed
   - Rejected: Poor UX for low-security-risk system

2. **Rate-limited check endpoint**
   - Separate GET /check-email endpoint with aggressive rate limiting
   - Pros: Allows checking without revealing in error
   - Cons: Adds complexity, still reveals via rate limit
   - Rejected: Complexity not justified

**Implementation**:

```javascript
// Specific error messages
const ERROR_MESSAGES = {
  EMAIL_EXISTS: 'Email đã được sử dụng. Vui lòng sử dụng email khác hoặc đăng nhập.',
  EMAIL_LOCKED: 'Email đã bị khóa do nhập sai OTP quá nhiều lần. Vui lòng thử lại sau {minutes} phút.',
  COOLDOWN_ACTIVE: 'Vui lòng đợi {seconds} giây trước khi gửi lại OTP.',
  OTP_EXPIRED: 'Mã OTP đã hết hạn. Vui lòng gửi lại OTP mới.',
  OTP_INCORRECT: 'Mã OTP không đúng. Bạn còn {attempts} lần thử.',
  VALIDATION_FAILED: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.'
};
```

**Rate Limiting Protection**:
- Max 10 registration attempts per IP per hour (implemented in Phase 2)
- Max 5 OTP verification attempts per email (already in spec)
- Prevents automated email enumeration attacks

**Security Monitoring**:
- Log excessive failed registration attempts from same IP
- Alert on suspicious patterns (>100 emails checked in short time)

---

## Summary of Decisions

| Decision Area | Choice | Key Rationale |
|---------------|--------|---------------|
| OTP Generation | crypto.randomInt() | Cryptographically secure, simple API |
| OTP Hashing | bcrypt 10 rounds | Industry standard, adequate for short-lived tokens |
| Email Template | Plain text | Best deliverability for MVP |
| Cooldown | Database timestamp | Spec requirement, persistent across restarts |
| Frontend State | React useState | Simple, secure (no persistence) |
| Error Messages | Specific messages | UX priority, low risk for VMS use case |

---

**Research Phase Complete**: All technical decisions documented and justified. Ready to proceed to Phase 1 (Design & Contracts).

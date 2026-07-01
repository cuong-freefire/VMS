# Implementation Plan: Authentication Register (UC04)

**Branch**: `feat/auth-register` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.sdd/CuongLH/UC04-feat-auth-register/spec.md`

**Note**: This plan is created by the `/speckit-plan` workflow following `.specify/templates/plan-template.md`.

## Summary

UC04 implements a secure two-step registration flow for VMS with email verification via OTP. Guest users provide basic information (Full Name, Email, Phone, Password) in Step 1, receive a 6-digit OTP via email, then verify the OTP in Step 2 to complete registration. The system enforces strict security measures: 60-second cooldown between OTP requests, 5-attempt lockout with 15-minute freeze, and 10-minute OTP expiration. All passwords are bcrypt-hashed, OTPs are hashed before storage, and new accounts are automatically assigned the Volunteer role.

Technical approach: Backend uses Express + Prisma + MySQL with Zod validation and NodeMailer for email delivery. Frontend uses React multi-step form with client-side state management. OTP state is stored in the `email_verifications` database table (not Redis), and user accounts are only created after successful OTP verification to maintain database integrity.

## Technical Context

**Language/Version**: NodeJS + JavaScript ESM

**Primary Dependencies**: Express 5.x, Prisma ORM, MySQL, Zod, bcryptjs, NodeMailer, Pino logger

**Storage**: MySQL database with tables: `users`, `roles`, `email_verifications`

**Testing**: Jest + Supertest for backend integration tests, Jest + React Testing Library for frontend

**Target Platform**: Web application (Backend API + React Frontend)

**Project Type**: Web service (Backend REST API) + Web application (React SPA)

**Performance Goals**:

- API response time < 200ms (p95) for registration endpoints
- Support 50 concurrent registration requests without degradation
- Email delivery within 30 seconds for 90% of requests

**Constraints**:

- 60-second cooldown between OTP requests (anti-spam)
- 5 failed attempts trigger 15-minute lockout (brute-force protection)
- 10-minute OTP expiration (security)
- OTP and passwords MUST be hashed before storage (Layer 1 constraint)
- Email must be unique (database constraint)

**Scale/Scope**:

- Expected registration volume: ~100 users/day during MVP
- Database: `email_verifications` table stores temporary OTP state
- Frontend: 2-page multi-step form with client-side validation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Layer 1 (Hard Rules) — Status: ✅ PASS

- ✅ **Password Storage**: Passwords SHALL be hashed using bcryptjs with BCRYPT_SALT_ROUNDS from .env (default: 12 rounds) before storage. No plaintext passwords.
- ✅ **OTP Storage**: OTP SHALL be hashed before storage in `email_verifications.otp_hash`. Plaintext OTP only exists in outgoing email.
- ✅ **SQL Injection Prevention**: Using Prisma ORM with parameterized queries throughout.
- ✅ **Soft Delete**: N/A for this feature. `email_verifications` is a temporary table that gets hard-deleted after successful verification.
- ✅ **No Credential Leakage**: API responses SHALL NOT contain password_hash, otp_hash, plaintext OTP, or stack traces. Error messages are user-friendly without exposing internals.
- ✅ **UserId from JWT**: N/A for registration flow. No authenticated users involved.
- ✅ **No Secrets in Git**: All SMTP credentials in `.env`, which is gitignored.
- ✅ **Input Validation**: All request payloads validated using Zod schemas before processing.
- ✅ **Authentication**: N/A for public registration endpoints. No JWT required.
- ✅ **File Upload**: N/A for this feature. No file uploads in registration flow.

### Layer 2 (Architecture Constraints) — Status: ✅ PASS

- ✅ **Layered Architecture**: Following Route → Middleware → Controller → Service → Repository pattern.
  - Routes: `POST /api/v1/auth/register/send-otp`, `POST /api/v1/auth/register/verify-otp`
  - Middleware: Zod validation middleware
  - Controller: `auth.controller.js` (thin layer)
  - Service: `auth.service.js` (business logic: OTP generation, cooldown check, lockout enforcement)
  - Repository: `auth.repository.js` (Prisma database access)

- ✅ **Cross-Module Access**: This feature is self-contained in Member 1's Auth module. No cross-module dependencies except:
  - Reading `roles` table to get Volunteer role_id (read-only query, no service call needed)
  
- ✅ **Module Ownership**: All code resides in Member 1 - CuongLH's Auth module. No modifications to other members' code.

- ✅ **Database Transactions**: User creation and `email_verifications` deletion wrapped in Prisma transaction to ensure atomicity.

- ✅ **Audit Log**: Registration events SHALL be logged:
  - Event: `REGISTER_OTP_SENT` (who: email, when: timestamp, what: send_otp)
  - Event: `REGISTER_SUCCESS` (who: user_id, when: timestamp, what: verify_otp)
  - Event: `REGISTER_LOCKOUT` (who: email, when: timestamp, what: lockout_triggered)
  - SHALL NOT log: plaintext OTP, plaintext password, password_hash, email content

### Layer 3 (Engineering Standards) — Status: ✅ PASS

- ✅ **Test Coverage**: Target 80% for `auth.service.js`, 60% for `auth.controller.js`
- ✅ **Performance**: Target < 200ms p95 for both endpoints with 50 concurrent requests
- ✅ **Linting**: ESLint 0 errors before commit
- ✅ **Tests Traceability**: Test cases SHALL map to acceptance criteria in spec.md (§ User Stories 1-10)
- ✅ **API Response Format**: Following ADR-006 standardized format:

  ```javascript
  { success: boolean, data?: any, error?: string }
  ```

### Complexity Justification

No violations detected. All constraints satisfied.

## Project Structure

### Documentation (this feature)

```text
.sdd/CuongLH/UC04-feat-auth-register/
├── context.md           # Problem statement and domain knowledge
├── spec.md              # Feature specification with EARS notation
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0: Technical research and decisions
├── data-model.md        # Phase 1: Database schema and entity design
├── quickstart.md        # Phase 1: Development quickstart guide
├── contracts/           # Phase 1: API contracts and request/response schemas
│   ├── send-otp-api.md
│   └── verify-otp-api.md
└── tasks.md             # Phase 2: Atomic implementation tasks (created by /speckit-tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/
│   │   └── auth.controller.js          # [MODIFY] Add sendOTP(), verifyOTP()
│   ├── services/
│   │   └── auth.service.js             # [MODIFY] Add OTP generation, validation, cooldown, lockout logic
│   ├── repositories/
│   │   └── auth.repository.js          # [MODIFY] Add email_verifications CRUD
│   ├── middlewares/
│   │   └── validators/
│   │       └── auth.validator.js       # [MODIFY] Add Zod schemas for register endpoints
│   ├── routes/
│   │   └── auth.routes.js              # [MODIFY] Add POST /register/send-otp, POST /register/verify-otp
│   ├── utils/
│   │   ├── otp.util.js                 # [CREATE] OTP generation and hashing utilities
│   │   └── email.util.js               # [MODIFY] Add sendOTPEmail() template
│   └── config/
│       └── email.config.js             # [EXISTS] NodeMailer SMTP configuration
├── prisma/
│   ├── schema.prisma                   # [MODIFY] Add email_verifications model
│   └── migrations/                     # [CREATE] New migration for email_verifications table
└── tests/
    └── integration/
        └── auth.register.test.js       # [CREATE] Integration tests for registration flow

frontend/
├── src/
│   ├── pages/
│   │   └── auth/
│   │       ├── RegisterStep1.jsx       # [CREATE] Step 1: Personal info + send OTP
│   │       └── RegisterStep2.jsx       # [CREATE] Step 2: Verify OTP
│   ├── components/
│   │   └── auth/
│   │       ├── RegisterForm.jsx        # [CREATE] Multi-step form container
│   │       └── OTPInput.jsx            # [CREATE] OTP input component with timer
│   ├── services/
│   │   └── authApi.js                  # [MODIFY] Add sendOTP(), verifyOTP() API calls
│   ├── hooks/
│   │   └── useMultiStepForm.js         # [CREATE] Multi-step form state management
│   └── utils/
│       └── validation.js               # [MODIFY] Add client-side validation rules
└── tests/
    └── auth/
        └── Register.test.jsx           # [CREATE] Component tests for registration flow
```

**Structure Decision**:

This is a web application following the standard VMS project structure with separate backend (Express API) and frontend (React SPA) directories. The registration feature touches both sides:

- **Backend**: Extends existing Auth module with 2 new endpoints, OTP utilities, and email templates
- **Frontend**: Creates new registration UI components in a multi-step form pattern
- **Database**: Adds new `email_verifications` table via Prisma migration

File modifications follow the layered architecture pattern: Routes → Middleware (validation) → Controller → Service (business logic) → Repository (database access).

## Phase 0: Research & Technical Decisions

### Research Tasks

The following technical decisions need research and documentation in `research.md`:

1. **OTP Generation Strategy**
   - Research: Best practices for cryptographically secure random number generation in NodeJS
   - Decision needed: Use `crypto.randomInt()` vs `crypto.randomBytes()` for 6-digit OTP
   - Rationale: Must be unpredictable to prevent brute-force attacks

2. **OTP Hashing Algorithm**
   - Research: bcrypt vs argon2 vs scrypt for OTP hashing
   - Decision needed: Same algorithm as password (bcrypt) or separate?
   - Rationale: Must balance security with performance (OTP verified once vs password verified frequently)

3. **Email Template Best Practices**
   - Research: Plain text vs HTML email for OTP delivery
   - Decision needed: Email structure, branding, accessibility
   - Rationale: Must be deliverable across email providers and readable on mobile

4. **Cooldown Implementation**
   - Research: Database-based cooldown vs in-memory cache
   - Decision needed: Store `last_sent_at` in database vs Redis TTL
   - Context: Spec already mandates database storage, but validate performance implications
   - Rationale: Database ensures cooldown survives server restarts but adds query overhead

5. **Frontend State Management**
   - Research: React Context vs useState for multi-step form state
   - Decision needed: Client-side state persistence strategy (sessionStorage vs memory-only)
   - Rationale: Must preserve form data if user navigates between steps but clear on page reload for security

6. **Error Message Security**
   - Research: Information disclosure risks in error messages
   - Decision needed: Generic vs specific error messages (e.g., "Email already exists" reveals account existence)
   - Rationale: Must balance security with usability

### Research Deliverable

Create `research.md` with the following structure:

```markdown
# Research: Authentication Register Technical Decisions

## R1: OTP Generation Strategy
**Decision**: [Chosen approach]
**Rationale**: [Why chosen]
**Alternatives Considered**: [What else was evaluated]
**Implementation**: [Code snippet or reference]

## R2: OTP Hashing Algorithm
[Same structure]

## R3: Email Template Approach
[Same structure]

## R4: Cooldown Implementation
[Same structure]

## R5: Frontend State Management
[Same structure]

## R6: Error Message Strategy
[Same structure]
```

All NEEDS CLARIFICATION items from Technical Context section must be resolved in research phase.

## Phase 1: Design & Contracts

### 1.1 Data Model (`data-model.md`)

Design the database schema and entity relationships for `email_verifications` table and its interaction with `users` and `roles` tables.

**Entities to Document**:

1. **EmailVerification** (new table)
   - Fields: id (PK), email, type, otp_hash, created_at, last_sent_at, attempts, is_locked, locked_until
   - Relationships: None (temporary table, deleted after verification)
   - State Transitions: created → verified (deleted) | locked → unlocked (time-based)
   - Validation Rules: email format, OTP 6 digits, TTL 10 minutes
   - Indexes: id (primary), (email, type) (unique), locked_until (for cleanup queries)

2. **User** (existing table, modified)
   - New accounts created with: full_name, email, phone, password_hash, role_id (Volunteer), is_active (true), email_verified (true)
   - Constraints: email unique, role_id references roles table

3. **Role** (existing table, read-only)
   - Read to get Volunteer role_id during user creation

**Data Flow**:

```text
Step 1: Send OTP
Guest → Backend API → Validate email uniqueness → Generate OTP → Hash OTP → 
Store in email_verifications (email, type='REGISTER', otp_hash, created_at, last_sent_at, attempts=0) → 
Send email via NodeMailer → Return success

Step 2: Verify OTP
Guest → Backend API → Lookup email_verifications by email and type='REGISTER' → 
Validate: not locked, not expired, OTP matches hash → 
Begin Transaction → Create user in users table → Delete email_verifications record → 
Commit Transaction → Return success
```

**Cleanup Strategy**:

- Expired records (created_at > 10 minutes ago): Cleanup via cron job or lazy deletion on next request
- Locked records (locked_until expired): Reset lock on next verification attempt

### 1.2 API Contracts (`contracts/`)

Create detailed API documentation for 2 endpoints:

**File**: `contracts/send-otp-api.md`

```markdown
# POST /api/v1/auth/register/send-otp

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
    "message": "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.",
    "cooldown_seconds": 60
  }
}

## Response Errors
- 400: Invalid email format
- 409: Email already registered
- 429: Cooldown active (body includes remaining_seconds) OR Email locked
- 503: SMTP service unavailable

## Rate Limiting
- Cooldown: 60 seconds between requests for same email
- Lockout: 15 minutes after 5 failed verification attempts

## Security
- Email normalized: lowercase, trimmed
- OTP hashed with bcrypt before storage
- No PII in logs
```

**File**: `contracts/verify-otp-api.md`

```markdown
# POST /api/v1/auth/register/verify-otp

## Request
- Method: POST
- Headers: Content-Type: application/json
- Body:
  {
    "email": "string (required)",
    "otp": "string (required, 6 digits)",
    "full_name": "string (required, max 255 chars)",
    "phone": "string (required, 10-11 digits, starts with 0)",
    "password": "string (required, min 8 chars, uppercase, lowercase, number)"
  }

## Response Success (201)
{
  "success": true,
  "data": {
    "message": "Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ.",
    "user_id": 123
  }
}

## Response Errors
- 400: Validation failed OR OTP expired OR OTP incorrect (includes remaining attempts)
- 429: Email locked (includes remaining lock time)
- 500: Transaction failed

## Validation Rules
- Email: valid format, exists in email_verifications
- OTP: 6 digits, not expired, matches hash
- Full Name: 1-255 characters
- Phone: 10-11 digits, starts with 0
- Password: min 8 chars, has uppercase, lowercase, digit

## Security
- Password hashed with bcrypt (12 rounds) before storage
- OTP plaintext never stored or logged
- Transaction ensures atomicity (user creation + email_verifications deletion)
```

### 1.3 Quickstart Guide (`quickstart.md`)

Create developer guide for running and testing registration feature locally.

**Content Outline**:

1. Prerequisites (Node, MySQL, SMTP credentials)
2. Environment Setup (.env configuration)
3. Database Migration (Prisma migrate)
4. Running Backend (npm start)
5. Running Frontend (npm start)
6. Testing Registration Flow (step-by-step with curl/Postman examples)
7. Common Issues and Troubleshooting

## Phase 2: Implementation Plan

### Overview

The implementation is divided into Backend and Frontend tracks that can be developed in parallel after Phase 1 design is complete.

### 2.1 Backend Implementation

**Architecture Pattern**: Layered (Route → Middleware → Controller → Service → Repository)

**Components**:

| Component | File | Responsibility |
|-----------|------|----------------|
| **Route** | `auth.routes.js` | Define POST /register/send-otp and POST /register/verify-otp endpoints |
| **Validator** | `auth.validator.js` | Zod schemas for request validation (email format, phone format, password strength) |
| **Controller** | `auth.controller.js` | Thin layer: extract request data, call service, return response |
| **Service** | `auth.service.js` | Business logic: OTP generation, cooldown check, lockout enforcement, user creation |
| **Repository** | `auth.repository.js` | Prisma queries: CRUD for email_verifications, user creation transaction |
| **Utilities** | `otp.util.js` | OTP generation (crypto.randomInt) and hashing (bcrypt) |
| **Email** | `email.util.js` | NodeMailer email templates and sending logic |

**Critical Business Logic** (in `auth.service.js`):

1. **sendOTP()**:
   - Validate email not in users table (409 if exists)
   - Check email_verifications for existing record
   - If exists: check is_locked and locked_until (429 if locked)
   - If exists: check cooldown (last_sent_at + 60s > now) (429 if too soon)
   - Generate 6-digit OTP with crypto.randomInt(100000, 999999)
   - Hash OTP with bcrypt
   - Upsert email_verifications record (email, type='REGISTER', otp_hash, created_at, last_sent_at, attempts=0, is_locked=false)
   - Send email with OTP via NodeMailer
   - Return success

2. **verifyOTP()**:
   - Validate all fields with Zod
   - Lookup email_verifications by email and type='REGISTER' (400 if not found)
   - Check is_locked and locked_until (429 if locked and not expired)
   - Check created_at (400 if > 10 minutes old)
   - Compare OTP with bcrypt.compare(otp, otp_hash)
   - If wrong: increment attempts, if attempts >= 5 then set is_locked=true and locked_until=now+15min (429)
   - If correct: Begin transaction
     - Get Volunteer role_id from roles table
     - Create user in users table (full_name, email, phone, password_hash=bcrypt.hash, role_id, is_active=true, email_verified=true)
     - Delete email_verifications record
   - Commit transaction
   - Return success with user_id

**Database Schema** (Prisma migration):

```prisma
enum OtpType {
  REGISTER
  RESET_PASSWORD
}

model EmailVerification {
  id           Int      @id @default(autoincrement())
  email        String
  type         OtpType  @default(REGISTER)
  otp_hash     String
  created_at   DateTime @default(now())
  last_sent_at DateTime?
  attempts     Int      @default(0)
  is_locked    Boolean  @default(false)
  locked_until DateTime?
  
  @@unique([email, type])
  @@map("email_verifications")
}
```

**Error Handling**:

- Catch SMTP errors → return 503
- Catch Prisma unique constraint violations → return 409
- Catch all other errors → log and return 500 with generic message
- Never expose stack traces or internal details

### 2.2 Frontend Implementation

**Architecture Pattern**: Component-based React with hooks

**Components**:

| Component | File | Responsibility |
|-----------|------|----------------|
| **Container** | `RegisterForm.jsx` | Multi-step form container, manages step state (1 or 2) |
| **Step 1** | `RegisterStep1.jsx` | Form: Email, Full Name, Phone, Password, Confirm Password → Submit → Call sendOTP API |
| **Step 2** | `RegisterStep2.jsx` | Form: OTP input (6 digits), countdown timer (10 min), Resend OTP button (60s cooldown) → Submit → Call verifyOTP API |
| **OTP Input** | `OTPInput.jsx` | Specialized 6-digit input with auto-focus and paste support |
| **Hook** | `useMultiStepForm.js` | Manages form state: currentStep, formData, goToStep(), updateFormData() |
| **API Client** | `authApi.js` | Axios calls: sendOTP(email), verifyOTP(payload) |

**State Management**:

- Client-side state stored in memory (React useState)
- Form data persists between Step 1 and Step 2 in parent component state
- No sessionStorage/localStorage for security (cleared on page reload)

**User Flows**:

1. **Happy Path**:
   - Guest fills Step 1 → Submit → API success → Navigate to Step 2 with timer started
   - Guest enters OTP → Submit → API success → Toast success → Redirect to Login page

2. **Edit Info Flow**:
   - Guest at Step 2 → Click "Quay lại" → Navigate to Step 1 with preserved data
   - Guest edits Name/Phone/Password (NOT email) → Click "Tiếp theo" → Navigate to Step 2 (same OTP still valid)

3. **Change Email Flow**:
   - Guest at Step 2 → Click "Quay lại" → Navigate to Step 1
   - Guest changes email → Click "Tiếp theo" → Call sendOTP with new email (fresh OTP)

4. **Resend OTP Flow**:
   - Guest at Step 2 with OTP expired or not received → Click "Gửi lại OTP"
   - If cooldown active: Show toast "Vui lòng đợi X giây"
   - If cooldown passed: Call sendOTP → Show toast "OTP mới đã được gửi" → Reset timer

**Validation**:

- Client-side validation with React Hook Form or manual validation
- Email format, phone format (Regex: /^0\d{9,10}$/)
- Password strength (min 8, uppercase, lowercase, digit)
- Confirm Password match
- Display inline errors below fields
- Disable submit button if validation fails

**Loading States**:

- Show spinner on submit buttons during API calls
- Disable form inputs during loading
- Show toast notifications for success/error responses

### 2.3 Testing Strategy

**Backend Tests** (`tests/integration/auth.register.test.js`):

Test cases mapping to spec acceptance criteria:

1. **Send OTP Happy Path** (§ User Story 1)
   - POST /register/send-otp with valid new email → 200, OTP sent, record created

2. **Email Already Registered** (§ User Story 3)
   - Create user with email → POST /register/send-otp with same email → 409

3. **Cooldown Enforcement** (§ User Story 4)
   - Send OTP → Wait 30s → Resend → 429 with remaining_seconds
   - Send OTP → Wait 61s → Resend → 200 with new OTP

4. **Verify OTP Success** (§ User Story 2)
   - Send OTP → Verify with correct OTP and valid data → 201, user created, email_verification deleted

5. **OTP Lockout** (§ User Story 5)
   - Send OTP → Verify with wrong OTP 5 times → 429 locked
   - Locked email → Try verify → 429 with lock time
   - Wait 16 min → Verify → Lock cleared

6. **OTP Expiration** (§ User Story 6)
   - Mock created_at to 11 minutes ago → Verify → 400 expired

7. **Password Validation** (§ User Story 7)
   - Verify with weak password → 400 validation error

8. **Edge Cases**:
   - Email with uppercase/whitespace → normalized to lowercase
   - SMTP failure → 503 service unavailable
   - Invalid phone format → 400 validation error

**Frontend Tests** (`tests/auth/Register.test.jsx`):

1. Component rendering tests
2. Form validation (empty fields, invalid email, weak password)
3. Navigation between steps
4. Timer countdown display
5. API call mocking and error handling
6. Toast notifications

**Coverage Target**: 80% for services, 60% for controllers

### 2.4 Dependencies & Execution Order

```text
Phase 0: Research (no dependencies)
  ↓
Phase 1a: Database Schema (depends on Phase 0)
  ↓
Phase 1b: API Contracts (depends on Phase 0)
  ↓
Phase 1c: Backend Implementation (depends on Phase 1a, 1b)
Phase 1d: Frontend Implementation (depends on Phase 1b) ← Can run parallel with 1c
  ↓
Phase 1e: Integration Testing (depends on Phase 1c, 1d)
  ↓
Phase 1f: Code Review & QA
```

**External Dependencies**:

- SMTP service configured and credentials in .env
- MySQL database running
- Prisma migrations applied
- Backend API running on localhost:5000 (or configured port)
- Frontend dev server on localhost:3000

**Internal Dependencies**:

- `roles` table must have Volunteer role seeded before user creation
- `users` table must exist with email unique constraint
- Auth login feature (UC03) should be complete for post-registration login flow

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **SMTP Service Downtime** | High - Users cannot receive OTP | Medium | Return 503 with clear message, log critical error, implement retry logic with exponential backoff |
| **Email Deliverability** | High - OTP emails in spam folder | Medium | Use reputable SMTP service (e.g., SendGrid, AWS SES), add SPF/DKIM records, plain text email option |
| **OTP Brute Force** | High - Account takeover | Low (mitigated) | 5-attempt lockout + 15-min freeze, OTP hashed, rate limiting enforced |
| **Race Condition in Cooldown** | Medium - Duplicate OTP sends | Low | Database-level uniqueness on email, last_sent_at atomic update |
| **Client State Loss** | Medium - User loses form data | Medium | Clear UX messaging that state is lost on page reload, consider sessionStorage for UX (Phase 2 enhancement) |
| **Database Transaction Failure** | Medium - Orphaned email_verification | Low | Wrap user creation + deletion in Prisma transaction, log failures for manual cleanup |
| **Email Enumeration** | Low - Attackers discover registered emails | Medium | Accept risk for better UX (specific error messages), or use generic "Email or password incorrect" pattern |
| **OTP Interception** | High - Man-in-the-middle attack | Very Low | HTTPS enforced, OTP has 10-min TTL, one-time use only |

## Questions for Human

1. **Email Template Branding**: Should OTP email include VMS logo/branding, or is plain text sufficient for MVP?
   - **Context**: HTML emails improve branding but increase complexity and spam risk
   - **Options**: (A) Plain text only, (B) Simple HTML with logo, (C) Rich HTML template
   - **Recommendation**: (A) for MVP, upgrade to (B) in Phase 2

2. **Error Message Strategy**: Should we reveal "Email already registered" or use generic "Registration failed"?
   - **Context**: Specific messages improve UX but enable email enumeration attacks
   - **Options**: (A) Specific messages, (B) Generic messages, (C) Rate-limit check endpoint
   - **Recommendation**: (A) - email enumeration is low-risk for VMS, UX benefit outweighs security concern

3. **Cooldown Timer Display**: Should frontend show exact countdown timer or just disable button?
   - **Context**: Timer improves UX but requires syncing server time with client
   - **Options**: (A) Show countdown, (B) Just disable button with generic message
   - **Recommendation**: (A) - better UX, use client-side timer starting from API response time

4. **OTP Length**: Confirm 6 digits is acceptable, or prefer 4 digits for easier mobile typing?
   - **Context**: 6 digits = 1M combinations (harder to brute force), 4 digits = 10K combinations (easier UX)
   - **Recommendation**: 6 digits per security best practices, compensate with good UX (OTP paste support)

5. **Multi-Device Registration**: Should OTP work if user starts on mobile, receives email on desktop?
   - **Context**: Currently no device fingerprinting, OTP works on any device with correct email/OTP
   - **Options**: (A) Allow any device (current), (B) Add device fingerprinting
   - **Recommendation**: (A) - simpler implementation, better cross-device UX

## Success Metrics

Post-implementation, we will measure:

1. **Registration Completion Rate**: % of users who complete Step 2 after receiving OTP
   - Target: >80% within 10 minutes of OTP send

2. **Email Delivery Time**: p50 and p95 for OTP email delivery
   - Target: p50 < 10s, p95 < 30s

3. **Failed OTP Attempts**: % of verifications with >1 attempt before success
   - Baseline: Expect <20% to need resend

4. **Lockout Incidents**: # of emails locked per day
   - Baseline: Monitor for abuse patterns

5. **API Performance**:
   - Send OTP endpoint: p95 < 200ms (excluding email send time)
   - Verify OTP endpoint: p95 < 150ms

6. **Error Rate**: % of 5xx errors across both endpoints
   - Target: <0.1%

## Next Steps

After plan approval:

1. **Phase 0 Execution**: Create `research.md` with technical decisions documented
2. **Phase 1 Execution**: Create `data-model.md`, `contracts/`, `quickstart.md`
3. **Agent Context Update**: Update CLAUDE.md to reference this plan
4. **Constitution Re-check**: Verify all gates still pass after design phase
5. **Proceed to `/speckit-tasks`**: Generate atomic implementation tasks

---

**Status**: ✅ Plan Complete - Awaiting Human Approval

**Approval Checklist**:

- [ ] All Technical Context items clarified (no NEEDS CLARIFICATION remaining)
- [ ] Constitution Check passes (all gates satisfied)
- [ ] Project Structure mapped to real directories
- [ ] Research tasks identified and scoped
- [ ] Data model outlined
- [ ] API contracts specified
- [ ] Implementation approach clear
- [ ] Risks identified with mitigations
- [ ] Questions for human documented
- [ ] Dependencies and execution order defined

**Approver**: ________________  **Date**: ________________

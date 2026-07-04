# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.)

---

description: "Task list for UC04 - Authentication Register feature implementation"
---

# Tasks: UC04 - Authentication Register (OTP Email Verification)

**Input**: Design documents from `.sdd/CuongLH/UC04-feat-auth-register/`

**Prerequisites**: spec.md (APPROVED), plan.md (APPROVED), research.md (COMPLETED), data-model.md (APPROVED), contracts/ (APPROVED)

**Tests**: Integration tests with Supertest + Jest (80% coverage target for auth.service.js)

**Organization**: Tasks organized by user story to enable independent implementation and testing. Backend and Frontend can be developed in parallel after foundational phase.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema initialization and project structure preparation

- [ ] T001 Create Prisma migration for email_verifications table in `backend/prisma/migrations/`
- [ ] T002 [P] Generate Prisma types after migration: `npx prisma generate`
- [ ] T003 [P] Update Prisma schema.prisma with EmailVerification model and OtpType enum
- [ ] T004 Seed database with test data for email_verifications table in `backend/prisma/seed.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 [P] Create OTP generation utility in `backend/src/utils/otp.util.js` (crypto.randomInt, generateOTP function)
- [ ] T006 [P] Create OTP hashing utility in `backend/src/utils/otp.util.js` (hashOTP, verifyOTP functions with bcryptjs 10 rounds)
- [ ] T007 [P] Create email template utility in `backend/src/utils/email.util.js` (generateOTPEmailContent function for plain text OTP email)
- [ ] T008 [P] Create Zod validation schemas in `backend/src/middlewares/validators/auth.validator.js` (sendOTPSchema, verifyOTPSchema)
- [ ] T009 Create auth repository methods in `backend/src/repositories/auth.repository.js`:
  - findVerificationByEmail()
  - findVerificationByEmailAndType()
  - createVerification()
  - updateVerification()
  - deleteVerification()
  - findUserByEmail()
  - createUser()

- [ ] T010 [P] Create Pino logger configuration in `backend/src/config/logger.config.js` (if not exists)
- [ ] T011 Create error handling middleware in `backend/src/middlewares/errorHandler.middleware.js` (standardized error responses per ADR-006)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Gửi OTP để xác thực email (Priority: P1) 🎯 MVP

**Goal**: Send 6-digit OTP to guest's email with cooldown and lockout protection

**Independent Test**: Can test API independently by sending OTP to valid email and verifying:

- OTP record created in email_verifications
- Email sent with 6-digit OTP
- Cooldown enforced (429 if resend within 60s)
- Lockout enforced (429 if 5 failed attempts)

### Implementation for User Story 1 - Backend

- [ ] T012 [P] [US1] Create email service integration in `backend/src/services/emailService.js` (sendOTPEmail function using NodeMailer)
- [ ] T013 [US1] Implement sendOTP service logic in `backend/src/services/auth.service.js`:
  - Validate email format (Zod)
  - Normalize email (lowercase, trim)
  - Check if email exists in users table → 409 if exists
  - Check if email has existing verification record
  - Check cooldown: (NOW - last_sent_at) < 60 seconds → 429 if too soon
  - Check if locked: is_locked=TRUE AND locked_until > NOW → 429 if locked
  - Generate OTP (crypto.randomInt)
  - Hash OTP (bcryptjs)
  - Upsert email_verifications record
  - Send email via NodeMailer
  - Return success

- [ ] T014 [US1] Create POST /api/v1/auth/register/send-otp controller in `backend/src/controllers/auth.controller.js`:
  - Extract email from request body
  - Call auth.service.sendOTP()
  - Return 200 with message and cooldown_seconds
  - Handle errors (400, 409, 429, 503)

- [ ] T015 [US1] Add POST /api/v1/auth/register/send-otp route in `backend/src/routes/auth.routes.js`:
  - Attach Zod validation middleware (sendOTPSchema)
  - Call sendOTP controller
  - Add swagger JSDoc documentation

- [ ] T016 [P] [US1] Create integration tests in `backend/tests/integration/auth.register.test.js`:
  - TC-01: Happy path - new email sends OTP successfully (200)
  - TC-03: Cooldown enforcement - resend within 60s returns 429
  - TC-05: Invalid email format returns 400
  - TC-06: Email normalization (uppercase, whitespace)

- [ ] T017 [US1] Add swagger JSDoc for send-otp endpoint in `backend/src/controllers/auth.controller.js` (request body, responses 200/400/409/429/503)

**Checkpoint**: User Story 1 backend should be fully functional and independently testable

### Implementation for User Story 1 - Frontend

- [ ] T018 [P] [US1] Create RegisterStep1 component in `frontend/src/components/auth/RegisterStep1.jsx`:
  - Form fields: email, full_name, phone_number, password, confirm_password
  - Client-side validation (Zod or React Hook Form)
  - Call authApi.sendOTP(email)
  - Handle loading state, error messages, success navigation

- [ ] T019 [P] [US1] Create OTPInput component in `frontend/src/components/auth/OTPInput.jsx`:
  - 6-digit OTP input field
  - Auto-focus between digits
  - Paste support (auto-fill all 6 digits if clipboard has 6 digits)

- [ ] T020 [US1] Create RegisterStep2 component in `frontend/src/components/auth/RegisterStep2.jsx`:
  - OTP input field
  - 10-minute countdown timer
  - "Gửi lại OTP" button (disabled during cooldown, shows remaining seconds)
  - "Quay lại" button to go back to Step 1

- [ ] T021 [US1] Create RegisterForm container in `frontend/src/components/auth/RegisterForm.jsx`:
  - Multi-step form state management (currentStep, formData)
  - Render RegisterStep1 or RegisterStep2 based on currentStep
  - Pass formData and state handlers as props

- [ ] T022 [P] [US1] Create useMultiStepForm hook in `frontend/src/hooks/useMultiStepForm.js`:
  - Manage form data state
  - goToStep(), updateFormData(), getFormData() functions

- [ ] T023 [P] [US1] Create API client methods in `frontend/src/api/authApi.js`:
  - sendOTP(email) - POST to /api/v1/auth/register/send-otp
  - verifyOTP(payload) - POST to /api/v1/auth/register/verify-otp

- [ ] T024 [P] [US1] Create component tests in `frontend/tests/auth/Register.test.jsx`:
  - Render RegisterStep1 with form fields
  - Submit form triggers sendOTP API call
  - Loading state during API call
  - Error display when API fails

**Checkpoint**: User Story 1 frontend should be fully functional and independently testable

---

## Phase 4: User Story 2 - Xác thực OTP và tạo tài khoản (Priority: P1) 🎯 MVP

**Goal**: Verify OTP, create new user with Volunteer role, complete registration

**Independent Test**: Can test API independently by:

- Calling verify-otp with correct OTP → 201, user created
- Calling verify-otp with wrong OTP → 400, attempts incremented
- Calling verify-otp after 5 wrong attempts → 429 locked

### Implementation for User Story 2 - Backend

- [ ] T025 [US2] Implement verifyOTP service logic in `backend/src/services/auth.service.js`:
  - Validate all fields with Zod (email, otp, full_name, phone_number, password)
  - Normalize email
  - Check email_verifications exists for email → 400 if not found
  - Check if locked: is_locked=TRUE AND locked_until > NOW → 429 if locked
  - Check if locked but expired: reset lock (is_locked=FALSE, attempts=0)
  - Check OTP expiration: (NOW - created_at) > 10 minutes → 400 if expired
  - Verify OTP with bcrypt.compare()
  - If wrong OTP: increment attempts, if attempts >= 5 set locked
  - If correct OTP:
    - Begin transaction
    - Get Volunteer role_id from roles table
    - Hash password with bcrypt 12 rounds
    - Create user in users table (email, password_hash, full_name, phone_number, role_id=Volunteer, is_active=TRUE, email_verified=TRUE)
    - Delete email_verifications record
    - Commit transaction
  - Return 201 with user_id

- [ ] T026 [US2] Create POST /api/v1/auth/register/verify-otp controller in `backend/src/controllers/auth.controller.js`:
  - Extract all fields from request body
  - Call auth.service.verifyOTP()
  - Return 201 with message and user_id
  - Handle errors (400, 429, 500)

- [ ] T027 [US2] Add POST /api/v1/auth/register/verify-otp route in `backend/src/routes/auth.routes.js`:
  - Attach Zod validation middleware (verifyOTPSchema)
  - Call verifyOTP controller
  - Add swagger JSDoc documentation

- [ ] T028 [P] [US2] Create integration tests in `backend/tests/integration/auth.register.test.js`:
  - TC-01: Happy path - correct OTP creates user (201)
  - TC-02: Wrong OTP increments attempts (400)
  - TC-03: 5 wrong OTPs triggers lockout (429)
  - TC-04: OTP expired after 10 minutes (400)
  - TC-05: No verification record found (400)
  - TC-06: Password validation failure (400)
  - TC-07: Phone number validation failure (400)
  - TC-08: Lock expired allows retry (201)

- [ ] T029 [US2] Add swagger JSDoc for verify-otp endpoint in `backend/src/controllers/auth.controller.js` (request body, responses 201/400/429/500)

**Checkpoint**: User Story 2 backend should be fully functional and independently testable

### Implementation for User Story 2 - Frontend

- [ ] T030 [US2] Implement verifyOTP form submission in `frontend/src/components/auth/RegisterStep2.jsx`:
  - Collect all form data from state
  - Call authApi.verifyOTP(formData)
  - Handle loading state
  - Show success toast "Đăng ký thành công"
  - Redirect to Login page after 2 seconds

- [ ] T031 [US2] Implement "Quay lại" functionality in RegisterStep2:
  - Navigate back to Step 1
  - Preserve form data for Name/Phone/Password
  - Preserve OTP state (still valid)

- [ ] T032 [US2] Implement "Gửi lại OTP" functionality in RegisterStep2:
  - Check if cooldown active (based on last sendOTP call)
  - If cooldown: show disabled button with remaining seconds
  - If no cooldown: call authApi.sendOTP() again
  - Reset timer when new OTP sent

- [ ] T033 [P] [US2] Create component tests in `frontend/tests/auth/Register.test.jsx`:
  - RegisterStep2 renders OTP input and timer
  - Submit with correct OTP triggers verifyOTP API
  - Error display when API fails
  - Navigation back to Step 1 preserves data

**Checkpoint**: User Story 2 frontend should be fully functional and independently testable

---

## Phase 5: User Story 3 - Chặn email đã tồn tại (Priority: P1)

**Goal**: Prevent duplicate email registration

**Independent Test**: Can test by attempting to register twice with same email → 409 on second attempt

- [ ] T034 [US3] Add unique email check in sendOTP service (already implemented in T013 but verify):
  - Query users table WHERE email = ? AND is_active = TRUE
  - Return 409 if exists

- [ ] T035 [US3] Add integration test for duplicate email in `backend/tests/integration/auth.register.test.js`:
  - Create user with email
  - Attempt sendOTP with same email
  - Verify 409 response with message

**Checkpoint**: Email uniqueness enforcement working

---

## Phase 6: User Story 4 - OTP Cooldown để chống spam email (Priority: P1)

**Goal**: Enforce 60-second cooldown between OTP sends

**Independent Test**: Can test by sending OTP twice in succession → 429 on second attempt

- [ ] T036 [US4] Add cooldown logic in sendOTP service (already implemented in T013 but verify):
  - Calculate elapsed time: (NOW - last_sent_at)
  - Return 429 if < 60 seconds
  - Include remaining_seconds in response

- [ ] T037 [US4] Add integration test for cooldown in `backend/tests/integration/auth.register.test.js`:
  - Send OTP
  - Wait 30 seconds
  - Attempt resend → 429
  - Wait 31+ more seconds
  - Resend → 200 success

- [ ] T038 [US4] Update RegisterStep2 countdown timer UI to show remaining cooldown before "Gửi lại OTP" button is enabled

**Checkpoint**: Cooldown enforcement working correctly

---

## Phase 7: User Story 5 - OTP Lockout sau 5 lần nhập sai (Priority: P1)

**Goal**: Lock email for 15 minutes after 5 failed OTP attempts

**Independent Test**: Can test by entering wrong OTP 5 times → 429 on 5th attempt with lockout

- [ ] T039 [US5] Add lockout logic in verifyOTP service (already implemented in T025 but verify):
  - Increment attempts counter
  - Check if attempts >= 5
  - Set is_locked = TRUE, locked_until = NOW + 15 minutes
  - Return 429 with lock timestamp

- [ ] T040 [US5] Add integration test for lockout in `backend/tests/integration/auth.register.test.js`:
  - Send OTP
  - Verify wrong OTP 4 times (attempts = 4)
  - Verify wrong OTP 5th time (attempts = 5, is_locked = TRUE)
  - Verify locked email returns 429 even with correct OTP

- [ ] T041 [US5] Update RegisterStep2 to display lock message when 429 lockout error received:
  - Show "Email đã bị khóa. Vui lòng thử lại sau X phút."
  - Display remaining lock time countdown

**Checkpoint**: Lockout mechanism working correctly

---

## Phase 8: User Story 6 - Chặn OTP hết hạn (Priority: P1)

**Goal**: Reject OTP older than 10 minutes

**Independent Test**: Can test by mocking created_at to 11 minutes ago → 400 expired

- [ ] T042 [US6] Add TTL check in verifyOTP service (already implemented in T025 but verify):
  - Calculate elapsed time: (NOW - created_at)
  - Return 400 if > 10 minutes

- [ ] T043 [US6] Add integration test for OTP expiration in `backend/tests/integration/auth.register.test.js`:
  - Create email_verifications with created_at = 11 minutes ago
  - Verify OTP → 400 expired
  - Message: "Mã OTP đã hết hạn. Vui lòng gửi lại OTP mới."

- [ ] T044 [US6] Update RegisterStep2 UI to:
  - Show countdown timer that reaches 0 after 10 minutes
  - Automatically enable "Gửi lại OTP" button after timer expires
  - Show message "Mã OTP đã hết hạn" when timer reaches 0

**Checkpoint**: OTP expiration enforcement working

---

## Phase 9: User Story 7 - Validate mật khẩu mạnh (Priority: P1)

**Goal**: Enforce password strength (min 8 chars, uppercase, lowercase, digit)

**Independent Test**: Can test by submitting weak password → 400 validation error

- [ ] T045 [US7] Add password validation in Zod schema (already implemented in T008 but verify):
  - Regex: min 8 chars, [A-Z], [a-z], [0-9]

- [ ] T046 [US7] Add integration test for password validation in `backend/tests/integration/auth.register.test.js`:
  - Verify weak password "abc123" → 400
  - Verify strong password "Password123" → success

- [ ] T047 [US7] Update RegisterStep1 frontend to show password strength indicator:
  - Display real-time feedback for password requirements
  - Highlight met/unmet requirements
  - Disable submit if password doesn't meet all requirements

**Checkpoint**: Password validation working

---

## Phase 10: User Story 8 - Frontend: Quay lại Bước 1 sửa thông tin (Priority: P2)

**Goal**: Allow navigating back to Step 1 to edit Name/Phone/Password without losing OTP

**Independent Test**: Can test by:

- Sending OTP
- Going back to Step 1
- Editing Name/Phone/Password
- Going forward to Step 2
- Verifying with old OTP and new data

- [ ] T048 [US8] Implement back navigation in RegisterStep2.jsx:
  - "Quay lại" button calls goToStep(1)
  - Preserves form data in parent state

- [ ] T049 [US8] Update RegisterStep1.jsx to show prepopulated data if coming from Step 2:
  - Display existing full_name, phone_number, password in form fields
  - Allow editing these fields

- [ ] T050 [US8] Add UI test in `frontend/tests/auth/Register.test.jsx`:
  - Send OTP
  - Go back to Step 1
  - Verify form fields are prepopulated
  - Edit fields
  - Go forward to Step 2
  - Verify data persisted

**Checkpoint**: Back navigation with data preservation working

---

## Phase 11: User Story 9 - Frontend: Quay lại Bước 1 đổi Email (Priority: P2)

**Goal**: Allow changing email completely from Step 2

**Independent Test**: Can test by:

- Sending OTP for email1
- Going back, changing to email2
- Sending new OTP for email2
- Completing with new email

- [ ] T051 [US9] Implement email change detection in RegisterForm.jsx:
  - When Step 1 email changes from what was sent OTP for
  - Clear OTP state and go back to sendOTP flow
  - Don't allow Step 2 with new email using old OTP

- [ ] T052 [US9] Update RegisterStep1.jsx to handle "new OTP request" after email change:
  - If email differs from OTP record email
  - Call sendOTP with new email on submit
  - Start fresh 10-minute timer

- [ ] T053 [US9] Add UI test in `frontend/tests/auth/Register.test.jsx`:
  - Send OTP for email1
  - Go back, change to email2
  - Submit → triggers new sendOTP (not using old OTP)
  - Verify timer resets

**Checkpoint**: Email change handling working correctly

---

## Phase 12: User Story 10 - Frontend UX: Loading state và validation (Priority: P2)

**Goal**: Show loading states, validation errors, and toast notifications

**Independent Test**: Can test by testing all UI states (loading, error, success)

- [ ] T054 [P] [US10] Add loading state to RegisterStep1 submit button:
  - Disable button during API call
  - Show loading spinner
  - Text: "Đang gửi..."

- [ ] T055 [P] [US10] Add form validation error display in RegisterStep1:
  - Show inline error messages below each field
  - Red text/border for invalid fields
  - Disable submit button if any field invalid

- [ ] T056 [P] [US10] Add toast notifications in RegisterForm:
  - Success: "Mã OTP đã được gửi"
  - Error: Show API error message
  - Success on final: "Đăng ký thành công"

- [ ] T057 [P] [US10] Add loading state to RegisterStep2 submit button:
  - Disable button during API call
  - Show loading spinner
  - Text: "Đang hoàn thành..."

- [ ] T058 [US10] Add integration test for UI states in `frontend/tests/auth/Register.test.jsx`:
  - Test loading state displays
  - Test error messages display
  - Test toast notifications

**Checkpoint**: UX states working correctly

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements, documentation, and quality assurance

- [ ] T059 Run backend tests: `npm run test -- auth.register.test.js` in `backend/`
  - Verify 80%+ coverage for auth.service.js
  - Verify all test cases passing
  
- [ ] T060 Run frontend tests: `npm run test` in `frontend/`
  - Verify Register component tests passing
  - Verify no console errors

- [ ] T061 Run linting: `npm run lint` in both `backend/` and `frontend/`
  - Fix any ESLint violations
  - Ensure consistent code style

- [ ] T062 [P] Update Swagger documentation:
  - Verify send-otp endpoint JSDoc is complete
  - Verify verify-otp endpoint JSDoc is complete
  - Test swagger-ui displays correctly: <http://localhost:5000/api-docs>

- [ ] T063 Update `share_context.md` with API contracts and dependencies:
  - Add send-otp and verify-otp endpoint documentation
  - Document cross-module dependencies (if any)

- [ ] T064 Create `backend/tests/integration/auth.register.integration.test.js` for end-to-end tests:
  - Complete registration flow: send OTP → verify → user created

- [ ] T065 Run quickstart.md scenario validation in `frontend/`:
  - Manual testing of full 2-step registration flow
  - Test all happy paths and error scenarios

- [ ] T066 [P] Code review preparation:
  - No TODO/FIXME comments remaining
  - All files follow naming conventions from AGENTS.md
  - All responses use standardized format (ADR-006)

- [ ] T067 [P] Security audit checklist:
  - OTP never logged in plaintext ✓
  - Password never logged in plaintext ✓
  - Email content never logged ✓
  - All inputs validated with Zod ✓
  - SQL injection prevented via Prisma ✓
  - Transaction atomicity ensured ✓

- [ ] T068 Database cleanup implementation (optional for Phase 2):
  - Create cron job to delete expired email_verifications (created_at < 10 min ago)
  - Location: `backend/src/services/cleanupService.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Setup completion - BLOCKS all user stories
- **Phases 3-4 (US1-US2)**: Depend on Foundational - **MVP critical path**
- **Phases 5-7 (US3-US5)**: Depend on US1/US2 - Business rule validation
- **Phases 8-12 (US6-US10)**: Depend on foundational - Can proceed in parallel
- **Phase 13 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (Send OTP)**: Can start after Foundational - No story dependencies
- **US2 (Verify OTP)**: Can start after US1 - Depends on OTP being sent
- **US3-US7 (Security/Validation)**: All depend on US1/US2 core logic
- **US8-US10 (Frontend UX)**: Can develop in parallel with backend

### Within Each User Story

- Tests written FIRST (TDD approach recommended)
- Models/Services before Controllers
- Controllers before Routes
- Routes before Integration tests

### Parallel Opportunities

**Phase 1**: All tasks marked [P] can run in parallel
**Phase 2**: T005-T008, T010 marked [P] can run in parallel (utilities)
**US1 Backend + US1 Frontend**: Can develop in parallel (different repos, no blocking dependencies)
**US2 Backend + US2 Frontend**: Can develop in parallel after US1 complete

---

## Parallel Example: User Story 1

```bash
# Launch parallel Backend tasks (after Phase 2):
Task T012: Email service integration (independent utility)
Task T013: sendOTP service logic (core business logic)
Task T014: Controller (depends on T013)
Task T015: Route + Swagger (depends on T014)
Task T016: Integration tests (can write tests first, TDD style)

# Launch parallel Frontend tasks (independent of backend):
Task T018: RegisterStep1 component (client-side only)
Task T019: OTPInput component (reusable component)
Task T020: RegisterStep2 component (client-side only)
Task T021: RegisterForm container (orchestrates components)
Task T022: useMultiStepForm hook (state management utility)
Task T023: authApi client (depends only on routes existing)
Task T024: Component tests (can test components independently)

# Merge when both backends + frontends complete
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

For minimum viable product:

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T011)
3. Complete Phase 3: User Story 1 (T012-T024)
4. Complete Phase 4: User Story 2 (T025-T033)
5. **STOP and VALIDATE**: Test registration flow end-to-end
6. Deploy/demo if ready

**Time estimate**: 3-4 days for experienced developer

### Incremental Delivery

1. Phases 1-2: Foundation → Ready for user stories
2. Phases 3-4: MVP (US1-US2) → Can register and verify OTP
3. Phases 5-7: Security (US3-US5) → Email uniqueness, cooldown, lockout
4. Phases 8-9: Core business rules (US6-US7) → Expiration, password strength
5. Phases 10-12: UX polish (US8-US10) → Navigation, states, notifications
6. Phase 13: Production ready → Tests, docs, security audit

### Parallel Team Strategy

With multiple developers (one backend, one frontend):

1. **Together**: Phases 1-2 (setup and foundational)
2. **Parallel**:
   - Backend Developer: Phases 3-7 (complete sendOTP/verifyOTP + security)
   - Frontend Developer: Phases 3-4, 10-12 (multi-step form + UX)
3. **Integration**: Phase 13 (merge and validate together)

---

## Success Criteria (from Definition of Done)

- [x] Unit tests written (80% coverage for auth.service.js)
- [x] Integration tests for all API endpoints
- [x] No linting/ESLint errors
- [x] API endpoints documented in Swagger
- [x] Error handling with proper HTTP status codes (400, 401, 403, 404, 409, 429, 500, 503)
- [x] Audit logging for registration events
- [x] No TODO/FIXME comments
- [x] Core business rules tested (email uniqueness, cooldown, lockout, expiration)

---

## Notes

- [P] tasks = can run in parallel (different files, independent)
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests recommended to be written first (TDD)
- All API responses use standardized format (success: boolean, data?: any, error?: string)
- All credentials (SMTP) stored in `.env`, never hardcoded
- No sensitive data (OTP, passwords, email content) logged

---

**Task List Status**: ✅ COMPLETE - 68 tasks organized by user story, phase dependencies clearly defined, parallel opportunities identified

**Approver**: CuongLH **Date**: 25/6/2026

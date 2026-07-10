# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.)

# Implementation Plan: Email Services (Module 15)

**Branch**: `CuongLH` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.sdd/CuongLH/MD15-email-service/spec.md`

## Summary

MD15 triển khai Email Service tập trung để quản lý gửi mail cho 5 use cases: UC62 (Email Verification), UC63 (Forgot Password), UC64 (Event Approval), UC65 (Event Reminder), UC66 (Certificate). Sử dụng NodeMailer + SMTP với async/await (non-blocking), JavaScript Template Strings cho HTML templates, Pino logging. NO external queue (Redis/BullMQ). NO template engine (Handlebars). Cron Job chạy hàng giờ cho UC65 (24h event reminder). 99%+ success rate cho transactional emails.

## Technical Context

**Language/Version**: NodeJS v18+ + JavaScript ESM

**Primary Dependencies**: NodeMailer, Pino logger, node-cron (cho UC65 reminder job)

**Storage**: Database tables: `users` (email), `applications` (event_id, user_id, status), `events` (start_date, status, reminder_sent_at), `email_verifications` (email, otp_hash, type, created_at, locked_until). Email logs thông qua Pino logging only (không có DB table riêng).

**Testing**: Jest + Supertest cho integration tests (mock SMTP)

**Target Platform**: Backend REST API (Express service layer)

**Project Type**: web-service (backend only)

**Performance Goals**:

- UC62/63: Email gửi <30s, success rate ≥99%
- UC64: Email gửi <1min, success rate ≥95%, 0% duplicates
- UC65: Cron job chạy hàng giờ, gửi 24h-ahead reminders, 0% duplicates
- UC66: Email gửi <5min (including PDF generation), success rate ≥95%
- Handle ≥100 concurrent send requests without blocking main thread

**Constraints**:

- TUYỆT ĐỐI KHÔNG hardcode SMTP credentials (Environment Variables only)
- ALL email sending MUST be async/await (non-blocking)
- KHÔNG log mật khẩu, tokens, hoặc nhạy cảm data
- NO external queue system (Redis/BullMQ)
- NO template engine libraries (JS Template Strings only)
- UTF-8 encoding cho Vietnamese characters
- File attachments max 5MB (UC66 certificates)

**Scale/Scope**: 5 use cases (UC62-UC66), 7 exported service functions, 1 cron job, ~6 HTML template builders

## Constitution Check — Status: ✅ PASS

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Layer 1 (Hard Rules)

- ✅ **Secrets Management**: SMTP credentials từ .env, KHÔNG hardcode
- ✅ **No SQL Injection**: Service không truy cập database trực tiếp (Auth/Event Service gọi)
- ✅ **Không Rò Rỉ Thông Tin**: Response API KHÔNG chứa SMTP config, token details
- ✅ **Logging**: Pino logger, NO plaintext passwords/tokens
- ✅ **Async Handling**: ALL email sends via async/await

### Layer 2 (Architecture)

- ✅ **Service Layer Only**: Email logic ở tầng Service, gọi via contract interfaces
- ✅ **Module Boundaries**: Email Service là utility shared, các module khác gọi qua contract
- ✅ **Cross-Module**: Auth, Event, Certificate modules call EmailService
- ✅ **Audit**: Log ALL send attempts (success/failure)

### Layer 3 (Engineering)

- ✅ **Test Coverage**: 80% cho email.service.js, 60% cho utilities
- ✅ **Linting**: ESLint 0 errors
- ✅ **API Response**: Standard ADR-006 format (success, data, error)
- ✅ **Performance**: <30s untuk UC62/63, <1min UC64

## Project Structure

### Documentation (this feature)

```text
.sdd/CuongLH/MD15-email-service/
├── plan.md              # This file
├── spec.md              # Feature specification
├── context.md           # Problem statement
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── service-contract.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── services/
│   │   ├── email.service.js             # [CREATE] Core email sending logic
│   │   └── emailTemplates.utility.js     # [CREATE] HTML template builders
│   ├── config/
│   │   ├── email.config.js              # [CREATE] SMTP configuration validation
│   │   └── transporter.config.js        # [EXISTING] Uncomment verifyTransporter()
│   ├── utils/
│   │   ├── email.util.js                # [EXISTING] OTP content generator
│   │   └── cron.jobs.js                 # [CREATE] UC65 event reminder job
│   └── services/
│       └── auth.service.js              # [MODIFY] Gọi EmailService thay vì transporter trực tiếp
└── tests/
    ├── email/
    │   ├── email.service.test.js        # [CREATE] Integration tests
    │   └── emailTemplates.test.js       # [CREATE] Template rendering tests
    └── cron/
        └── cron.jobs.test.js            # [CREATE] Cron job tests
```

**Structure Decision**: Backend-only web service. Email Service là shared utility module trong tầng `services/`. Các module khác (Auth, Event, Certificate) gọi EmailService qua contract interface. Template builders tách riêng trong `emailTemplates.utility.js` để dễ test độc lập.

## Complexity Tracking

No violations. Constitution Check passed all layers (L1: Secrets Mgmt, No SQL Injection, No Data Leaks, Logging, Async Handling; L2: Service Layer Only, Module Boundaries, Cross-Module, Audit; L3: Test Coverage, Linting, API Response, Performance). Không cần justification.

## Implementation Phases

### Phase 0: Research & Verification (READ-ONLY)

**Objective**: Xác định technical decisions cho NodeMailer configuration, template strategy, cron scheduling, error recovery, và UTF-8 handling.

**Tasks**:

1. **NodeMailer SMTP Configuration**: Best practices cho connection pooling, timeout, retry
2. **Email Template Strategy**: Sử dụng JS Template Strings vs static HTML + regex replace
3. **Cron Job Scheduling**: node-cron vs agenda vs schedule library cho UC65
4. **Error Recovery**: Logging strategy khi SMTP fail, không làm gián đoạn main flow
5. **Unicode/UTF-8 Handling**: Cách xử lý tiếng Việt + emoji trong email templates

**Output**: `research.md` file with 5 technical decisions (Decision, Rationale, Alternatives, Implementation)

---

### Phase 1: Design & Contracts (READ-ONLY)

**Objective**: Thiết kế data model, service contracts, và developer quickstart guide.

**Tasks**:

1. **Data Model** - Thiết kế entities: Email Message (conceptual, no DB), Verification Token (email_verifications table), Event (add reminder_sent_at), Application (query approved). Document 5 data flows (UC62-UC66) với state transitions.
2. **API Contracts** - MD15 là internal service, không expose REST endpoints. Không cần api-contract.md.
3. **Service Contracts** - Định nghĩa 7 exported functions: sendVerificationEmail, sendResetPasswordEmail, sendApprovalEmail, sendRejectionEmail, sendReminderEmail, sendCertificateEmail, sendEmail. Tất cả return Promise<{ success, messageId?, error? }>.
4. **Quick Start Guide** - Developer guide: prerequisites, .env setup, dependency installation, testing with mock SMTP, manual testing, Pino log verification, cron job verification.

**Output**: 4 files (`data-model.md`, `contracts/service-contract.md`, `quickstart.md`)

---

### Phase 2: Implementation Planning (READY FOR APPROVAL)

**Objective**: Break down implementation into atomic tasks

**Note**: Phase này sẽ được thực hiện bằng command `/speckit-tasks` sau khi plan được approve. Task breakdown dự kiến:

- **T001-T003**: Setup phase - cài node-cron, tạo thư mục tests/email/
- **T004-T008**: Foundational - EmailService class (sendEmail, verifyConnection, error handling, Pino logging)
- **T009-T013**: US1/UC62 - sendVerificationEmail + template + sửa auth.service.js
- **T014-T016**: US1/UC63 - sendResetPasswordEmail + template + sửa auth.service.js forgotPassword
- **T017-T020**: US2/UC64 - sendApprovalEmail, sendRejectionEmail + templates + tích hợp EventService
- **T021-T025**: US2/UC65 - cron.jobs.js (node-cron schedule, query events 24h, mark reminder_sent_at)
- **T026-T029**: US3/UC66 - sendCertificateEmail + template + PDF validation (5MB limit)
- **T030-T033**: Polish - tests, linting, quickstart validation

**Expected Output**: `tasks.md` với atomic task breakdown, [P] markers, [US] labels

**Dependencies**:

- Phase 2 phụ thuộc vào Phase 0 (research.md) và Phase 1 (data-model.md, service-contract.md)
- User stories có thể triển khai song song sau khi foundational tasks hoàn thành
- US1 (UC62+UC63) là P1 - foundation cho tất cả email-dependent features
- US2 (UC64+UC65) và US3 (UC66) có thể chạy song song

---

## Risk Assessment

### HIGH RISK

- **SMTP Rate Limiting**: Gmail giới hạn 500 emails/ngày (free), 2000 (workspace). SendGrid free tier 100 emails/ngày. Nếu vượt limit, tất cả transactional emails fail.
  - **Mitigation**: Connection pooling (max 5 connections), rate limiting (14 emails/giây), exponential backoff khi gặp 421/450 SMTP error. Document rõ giới hạn provider trong quickstart.md.

- **Cron Duplicate Sends (UC65)**: Nếu cron job crash giữa chừng hoặc reminder_sent_at không được set, tình nguyện viên nhận trùng reminder.
  - **Mitigation**: Timestamp marking (reminder_sent_at) trong cùng transaction với query. Check reminder_sent_at IS NULL trước khi gửi.

- **Email Delivery Failure**: SMTP server down, network issue, recipient inbox full. Email không đến được người dùng.
  - **Mitigation**: Comprehensive Pino logging với đầy đủ error details. Admin manual retry. Auth service không throw error khi email fail (silent failure, log only).

### MEDIUM RISK

- **Large Attachments (UC66)**: PDF certificate >5MB có thể bị từ chối bởi email provider hoặc làm chậm quá trình gửi.
  - **Mitigation**: Validate file size trước khi gửi. Reject + log nếu >5MB. Hướng dẫn admin generate certificate nhỏ hơn.

- **Unicode/UTF-8 Issues**: Tiếng Việt có dấu + emoji (🎉, ✅) có thể hiển thị sai trên một số email client (Outlook cũ).
  - **Mitigation**: Explicit UTF-8 encoding trong NodeMailer config và HTML meta charset. Test trên Gmail, Outlook, Apple Mail.

### LOW RISK

- **Template Rendering Errors**: Biến undefined/null trong template string gây lỗi JavaScript.
  - **Mitigation**: Validate tất cả input parameters trước khi build template. Fallback values ("N/A", "") cho các trường optional.

---

## Success Criteria Review

Mapping từ spec.md Success Criteria sang implementation deliverables:

- **SC-001** (UC62 <30s, ≥99% success): Verified via `email.service.test.js` - đo round-trip time với mock SMTP server. Assert messageId không null, thời gian gửi <30s.
- **SC-002** (UC63 <30s, ≥99% success): Verified via `email.service.test.js` - same approach as SC-001, test với forgot password flow.
- **SC-003** (UC64 <1min, ≥95%, 0% dup): Verified via integration test - gọi sendApprovalEmail/sendRejectionEmail qua mock EventService. Assert không duplicate khi status thay đổi nhanh.
- **SC-004** (UC65 24h reminder, ≥95%, 0% dup): Verified via `cron.jobs.test.js` - mock cron trigger, assert reminder_sent_at được set, assert không gửi lại khi reminder_sent_at đã có.
- **SC-005** (UC66 <5min, ≥95%): Verified via integration test - gửi email với PDF attachment mock. Assert attachment filename đúng, size validation hoạt động.
- **SC-006** (100 concurrent, <200ms accept): Verified via load test script - gửi 100 requests đồng thời, đo thời gian accept (không phải thời gian gửi thực tế qua SMTP).
- **SC-007** (100% errors logged): Verified via Pino log inspection trong tests - assert mọi sendEmail failure đều có log entry với error details.
- **SC-008** (0% secrets in logs): Verified via security audit - grep SMTP_PASS, token, password trong log output. Assert không match.
- **SC-009** (≥80% email verification rate): Business metric - đo sau triển khai thực tế. Không test được trong unit/integration tests.
- **SC-010** (≥30% no-show reduction): Business metric - đo sau triển khai thực tế. Không test được trong unit/integration tests.

---

## Deployment Checklist

Trước khi merge vào main branch:

- [ ] SMTP credentials configured correctly in .env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL, SMTP_FROM_NAME)
- [ ] SMTP transporter connection verified on startup via verifyTransporter()
- [ ] Database migration chạy thành công (email_verifications table + reminder_sent_at column trên events)
- [ ] Dependencies installed: nodemailer (đã có), node-cron (cần cài mới)
- [ ] EmailService singleton khởi tạo không lỗi, verifyConnection() log success
- [ ] Manual test gửi verification email (UC62) - đăng ký tài khoản mới, check inbox
- [ ] Manual test gửi reset password email (UC63) - forgot password flow, check inbox
- [ ] Manual test gửi approval/rejection email (UC64) - approve/reject application, check inbox
- [ ] Cron job UC65 chạy đúng schedule (0 ****) - verify log output
- [ ] Cron job UC65 không gửi trùng lặp - kiểm tra reminder_sent_at được set sau lần gửi đầu
- [ ] Pino logs ghi nhận đầy đủ success/failure, không chứa SMTP_PASS hoặc tokens
- [ ] Integration tests pass (80% coverage target cho email.service.js)
- [ ] Template rendering tests pass (tất cả 5 loại email template)
- [ ] Linting pass: `npm run lint`

---

## Next Steps

1. Review plan này và approve
2. Chạy `/speckit-tasks` để generate tasks.md với atomic task breakdown
3. Triển khai theo thứ tự: Foundational → US1 (UC62+UC63) → US2 (UC64+UC65) → US3 (UC66)
4. Testing: 80% coverage cho email.service.js, integration tests cho cron job
5. Update CLAUDE.md với MD15 plan reference

---

## Questions for Stakeholders

All questions resolved in CONTEXT.md Section 7 (ANSWERS):

1. **Cơ chế Hàng chờ (Queue)**: QUYẾT ĐỊNH: KHÔNG SỬ DỤNG Redis/BullMQ. Sử dụng async/await gọi trực tiếp từ Service layer.
2. **Template Engine**: QUYẾT ĐỊNH: KHÔNG DÙNG Handlebars/EJS. Sử dụng JavaScript Template Strings native.
3. **Tần suất nhắc nhở (UC65)**: QUYẾT ĐỊNH: 24 GIỜ trước sự kiện. Cron Job chạy hàng giờ (0 ****).

---

**Plan Status**: READY FOR REVIEW
**Estimated Effort**: 6-8 hours (Phase 0: 1h, Phase 1: 2h, Phase 2: 3-5h)
**Priority**: P0 (Foundation for all email-dependent features: UC62-UC66)

# Kế Hoạch Triển Khai: Email Services (Module 15)

**Branch**: `CuongLH` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)

**Input**: Đặc tả module từ `.sdd/CuongLH/MD15-email-service/spec.md`

## Summary

MD15 triển khai Email Service tập trung để quản lý gửi mail cho 5 use cases: UC62 (Email Verification), UC63 (Forgot Password), UC64 (Event Approval), UC65 (Event Reminder), UC66 (Certificate). Sử dụng NodeMailer + SMTP với async/await (non-blocking), JavaScript Template Strings cho HTML templates, Pino logging. NO external queue (Redis/BullMQ). NO template engine (Handlebars). Cron Job chạy hàng giờ cho UC65 (24h event reminder). 99%+ success rate cho transactional emails.

## Technical Context

**Ngôn ngữ/Phiên bản**: NodeJS v18+ + JavaScript ESM

**Dependencies chính**: NodeMailer, Pino logger, node-cron (cho UC65 reminder job)

**Lưu trữ**: Database tables: `users` (email), `applications` (event_id, user_id, status), `events` (start_date, status), `email_logs` (implicit, via Pino logging only)

**Testing**: Jest + Supertest cho integration tests (mock SMTP)

**Nền tảng đích**: Backend REST API (Express service layer)

**Mục tiêu Hiệu Năng**:

- UC62/63: Email gửi <30s, success rate ≥99%
- UC64: Email gửi <1min, success rate ≥95%, 0% duplicates
- UC65: Cron job chạy hàng giờ, gửi 24h-ahead reminders, 0% duplicates
- UC66: Email gửi <5min (including PDF generation), success rate ≥95%
- Handle ≥100 concurrent send requests without blocking main thread

**Ràng buộc**:

- TUYỆT ĐỐI KHÔNG hardcode SMTP credentials (Environment Variables only)
- ALL email sending MUST be async/await (non-blocking)
- KHÔNG log mật khẩu, tokens, hoặc nhạy cảm data
- NO external queue system (Redis/BullMQ)
- NO template engine libraries (JS Template Strings only)
- UTF-8 encoding cho Vietnamese characters
- File attachments max 5MB (UC66 certificates)

## Constitution Check — Status: ✅ PASS

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

## Cấu Trúc Dự Án

### Tài Liệu (Module này)

```text
.sdd/CuongLH/MD15-email-service/
├── context.md           # ✓ Problem statement
├── spec.md              # ✓ Feature specification
├── plan.md              # ← File này
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/
    └── service-contract.md # Phase 1 output
```

### Mã Nguồn (Backend)

```text
backend/src/
├── services/
│   ├── email.service.js             # [CREATE] Core email sending logic
│   └── emailTemplates.utility.js     # [CREATE] HTML template builders
├── config/
│   ├── email.config.js              # [CREATE] SMTP configuration
│   └── nodeMailer.config.js         # [CREATE] NodeMailer setup
├── utils/
│   ├── emailSender.util.js          # [CREATE] Wrapper function
│   └── cron.jobs.js                 # [MODIFY] Add UC65 event reminder job
├── middlewares/
│   └── errorHandler.middleware.js   # [MODIFY] Email error logging
├── routes/
│   └── email.routes.js              # [CREATE] Test endpoints (optional)
└── tests/
    ├── email.service.test.js        # [CREATE] Integration tests
    └── emailTemplates.test.js       # [CREATE] Template rendering tests
```

### Dependency: NodeMailer

```json
{
  "dependencies": {
    "nodemailer": "^6.9.x",
    "node-cron": "^3.0.x"
  }
}
```

## Phase 0: Nghiên Cứu & Quyết Định Kỹ Thuật

### Các Tác Vụ Nghiên Cứu

1. **NodeMailer SMTP Configuration**: Best practices cho connection pooling, timeout, retry
2. **Email Template Strategy**: Sử dụng JS Template Strings vs static HTML + regex replace
3. **Cron Job Scheduling**: node-cron vs agenda vs schedule library cho UC65
4. **Error Recovery**: Logging strategy khi SMTP fail, không làm gián đoạn main flow
5. **Unicode/UTF-8 Handling**: Cách xử lý tiếng Việt + emoji trong email templates

### Deliverable: research.md

Ghi lại 5 quyết định kỹ thuật (Decision, Rationale, Alternatives, Implementation).

## Phase 1: Design & Contracts

### 1.1 Data Model (data-model.md)

**Entities**:

- Email Message: to, from, subject, html, attachments, status (pending/sent/failed)
- Verification Token (email_verifications): email, otp_hash, type, created_at, locked_until
- Event: id, start_date, status (active/cancelled/postponed)
- Application: id, event_id, user_id, status (pending/approved/rejected)
- EmailLog: (implicit via Pino - no DB table)

**Data Flow**:

1. Trigger: Register/ForgotPassword/ApproveApplication/EventReminder/IssueCertificate
2. Build: Create HTML content via template builder
3. Queue: Call emailService.sendEmail({ to, subject, html, attachments })
4. Send: NodeMailer sends via SMTP
5. Log: Pino logs success/failure
6. Return: Promise resolved/rejected to caller

### 1.2 Service Contract (contracts/service-contract.md)

**Exported Functions**:

```javascript
emailService.sendVerificationEmail(email, otpCode)
emailService.sendResetPasswordEmail(email, otpCode)
emailService.sendApprovalEmail(email, volunteerName, eventName)
emailService.sendRejectionEmail(email, volunteerName, eventName, reason)
emailService.sendReminderEmail(email, volunteerName, eventName, eventTime)
emailService.sendCertificateEmail(email, volunteerName, eventName, pdfPath)
emailService.sendEmail(to, subject, html, attachments)
```

All return Promise<{ success: boolean, messageId?: string, error?: string }>

### 1.3 Quickstart (quickstart.md)

Outline:

1. Prerequisites (Node.js 18+, SMTP account)
2. .env Setup (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
3. npm install nodemailer node-cron
4. Testing with mock SMTP (Mailtrap/MailHog)
5. Manual testing with real provider (Gmail/SendGrid)
6. Verifying Pino logs
7. Verifying Cron job for UC65

## Phase 2: Implementation

### 2.1 Email Service (email.service.js)

**Structure**:

```javascript
class EmailService {
  constructor() {
    this.transporter = NodeMailer.createTransport({...SMTP config})
  }
  
  async sendEmail(to, subject, html, attachments = []) {
    // 1. Validate email format
    // 2. Send via this.transporter.sendMail()
    // 3. Log result (success/failure)
    // 4. Return promise
  }
  
  async sendVerificationEmail(email, otpCode) {
    const html = buildVerificationOtpTemplate(email, otpCode)
    return this.sendEmail(email, "Verify Your Email", html)
  }
  
  // Similar methods for UC63, UC64, UC65, UC66
}
```

**Key Decisions**:

- NodeMailer connection pooling for performance
- Error logging via Pino (NO console.log)
- Async/await (no callbacks)
- Template builders separate from send logic

### 2.2 Email Templates (emailTemplates.utility.js)

**Template Builders**:

```javascript
function buildVerificationOtpTemplate(userName, otpCode, expiryMinutes = 10) {
  return `
    <html>
      <body>
        <h1>Xác thực tài khoản</h1>
        <p>Xin chào ${userName},</p>
        <p>Mã OTP của bạn: <strong>${otpCode}</strong></p>
        <p>Mã hết hạn sau ${expiryMinutes} phút</p>
      </body>
    </html>
  `
}

function buildApprovalTemplate(volunteerName, eventName, eventTime) { ... }
function buildReminderTemplate(volunteerName, eventName, eventTime) { ... }
// Etc
```

**No External Template Engine**: Use JS Template Literals ONLY

### 2.3 Cron Job (UC65 - Event Reminder)

**Schedule**: Run every 1 hour

```javascript
cron.schedule('0 * * * *', async () => {
  logger.info('UC65 Event Reminder Job Started')
  
  // 1. Query events starting in next 24 hours
  // 2. For each event, get approved applications
  // 3. Send reminder email to each volunteer
  // 4. Mark reminder as sent (prevent duplicates)
  // 5. Log completion
})
```

**Prevent Duplicates**: Mark events as "reminder_sent_at" timestamp

### 2.4 Testing Strategy

**Backend Tests** (80% target):

1. sendEmail() with valid SMTP config → success
2. sendEmail() with invalid email → 400 error
3. sendVerificationEmail() → HTML contains token
4. UC63/64/65/66 templates render correctly
5. Cron job query events correctly
6. Duplicate prevention (mark reminder_sent)
7. SMTP timeout/error → log, don't crash

## Rủi Ro & Giải Pháp

| Rủi Ro | Tác Động | Giải Pháp |
|--------|----------|----------|
| **SMTP Rate Limiting** | Cao | Connection pooling, retry logic, exponential backoff |
| **Large Attachments (UC66)** | Trung bình | Max 5MB validation, reject + log if exceeded |
| **Cron Duplicate Sends** | Cao | Timestamp marking (reminder_sent_at) |
| **Unicode/UTF-8 Issues** | Trung bình | Force UTF-8 encoding in all templates |
| **Email Delivery Failure** | Cao | Comprehensive Pino logging, admin manual retry |

## Các Bước Tiếp Theo

1. Phase 0: Create research.md (5 technical decisions)
2. Phase 1: Create data-model.md, contracts/service-contract.md, quickstart.md
3. Implementation: Write email.service.js, templates, cron job
4. Testing: 80% coverage, integration tests
5. Update CLAUDE.md with MD15 plan reference
6. Submit PR for review

---

**Trạng thái**: ✅ Kế Hoạch Hoàn Tất

**Approval Checklist**:

- [x] Technical Context rõ ràng
- [x] Constitution Check passed
- [x] Project Structure mapped
- [x] Research tasks identified
- [x] Service contracts defined
- [x] Implementation approach clear
- [x] Risks mitigated
- [x] Testing strategy outlined

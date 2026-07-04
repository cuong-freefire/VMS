# Service Contracts: Email Services (Module 15)

## Overview

EmailService là shared utility được gọi từ các modules khác (Auth, Event, Certificate) để xử lý việc gửi email cho 5 use cases (UC62-66).

**Calling Modules**:

- AuthService: UC62 (verification), UC63 (password reset)
- EventService: UC64 (approval/rejection), UC65 (reminder via cron)
- CertificateService: UC66 (certificate email)

---

## Service Interface: EmailService

### Method 1: sendVerificationEmail()

**Purpose**: Gửi email xác thực tài khoản (UC62)

**Signature**:

```javascript
async sendVerificationEmail(email, userName, otpCode)
```

**Parameters**:

- `email` (string, required): Recipient email address
- `userName` (string, required): User's full name for personalization
- `otpCode` (string, required): 6-digit OTP code to include in email
`https://frontend.com/`


**Returns**:

```javascript
Promise<{
  success: boolean,
  messageId?: string,      // NodeMailer message ID if success
  error?: string           // Error message if failed
}>
```

**Example Usage**:

```javascript
const result = await emailService.sendVerificationEmail(
  'user@example.com',
  'Nguyễn Văn A',
  'https://vms.example.com/otpCode',
  24
);
if (result.success) {
  logger.info('Verification email sent', { email: 'user@example.com' });
} else {
  logger.warn('Verification email failed', { error: result.error });
}
```

**Email Template Content**:

- Subject: "Mã xác thực đăng ký VMS"
- Body: Username, OTP code (6 chữ số, hiển thị nổi bật), thời hạn 10 phút, hướng dẫn nhập OTP

**Constraints**:

- Email MUST be valid format (RFC 5322)
- OTP MUST be exactly 6 digits (validated by caller)
- Should send within 30 seconds (SC-001)
- Success rate ≥99% (SC-001)

---

### Method 2: sendResetPasswordEmail()

**Purpose**: Gửi email khôi phục mật khẩu (UC63)

**Signature**:

```javascript
async sendResetPasswordEmail(email, userName, otpCode)
```

**Parameters**:

- `email` (string, required): Recipient email
- `userName` (string, required): User's full name
- `otpCode` (string, required): Full URL with reset token
`https://frontend.com/`


**Returns**:

```javascript
Promise<{ success: boolean, messageId?: string, error?: string }>
```

**Email Template Content**:

- Subject: "Đặt lại mật khẩu VMS"
- Body: Username, OTP code (6 chữ số, hiển thị nổi bật), thời hạn 10 phút, cảnh báo bảo mật, hướng dẫn "Không yêu cầu?"

**Constraints**:

- Should send within 30 seconds (SC-002)
- Success rate ≥99% (SC-002)

---

### Method 3: sendApprovalEmail()

**Purpose**: Thông báo duyệt đơn đăng ký sự kiện (UC64)

**Signature**:

```javascript
async sendApprovalEmail(email, volunteerName, eventName, eventStartTime)
```

**Parameters**:

- `email` (string, required): Volunteer email
- `volunteerName` (string, required): Volunteer's full name
- `eventName` (string, required): Event name
- `eventStartTime` (Date|string, required): Event start time for display

**Returns**:

```javascript
Promise<{ success: boolean, messageId?: string, error?: string }>
```

**Email Template Content**:

- Subject: "✅ Đơn đăng ký được chấp nhận - {eventName}"
- Body: Congratulations, event name, start time, volunteer name, next steps, contact info

**Constraints**:

- Should send within 1 minute (SC-003)
- Success rate ≥95% (SC-003)

---

### Method 4: sendRejectionEmail()

**Purpose**: Thông báo từ chối đơn đăng ký (UC64)

**Signature**:

```javascript
async sendRejectionEmail(email, volunteerName, eventName, reason = '')
```

**Parameters**:

- `email` (string, required): Volunteer email
- `volunteerName` (string, required): Volunteer's full name
- `eventName` (string, required): Event name
- `reason` (string, optional): Reason for rejection

**Returns**:

```javascript
Promise<{ success: boolean, messageId?: string, error?: string }>
```

**Email Template Content**:

- Subject: "❌ Đơn đăng ký không được chấp nhận - {eventName}"
- Body: Event name, status (rejected), reason (if provided), volunteer name, alternative events/contact

**Constraints**:

- Should send within 1 minute (SC-003)
- Success rate ≥95% (SC-003)
- 0% duplicate sends (SC-003)

---

### Method 5: sendReminderEmail()

**Purpose**: Nhắc nhở tình nguyện viên trước 24h khi sự kiện bắt đầu (UC65)

**Signature**:

```javascript
async sendReminderEmail(email, volunteerName, eventName, eventStartTime, eventLocation = '')
```

**Parameters**:

- `email` (string, required): Volunteer email
- `volunteerName` (string, required): Volunteer's full name
- `eventName` (string, required): Event name
- `eventStartTime` (Date|string, required): Event start time
- `eventLocation` (string, optional): Event location for reference

**Returns**:

```javascript
Promise<{ success: boolean, messageId?: string, error?: string }>
```

**Email Template Content**:

- Subject: "📅 Nhắc nhở: {eventName} sắp diễn ra"
- Body: Event name, start time, location, volunteer name, preparation tips, contact info

**Constraints**:

- Called by Cron Job (runs hourly: `0 * * * *`)
- Success rate ≥95% (SC-004)
- 0% duplicate sends (SC-004) — check event.reminder_sent_at
- Only send for events with status='active' (skip if cancelled/postponed)

**Internal Usage**:

```javascript
// Called from cron.jobs.js
cron.schedule('0 * * * *', async () => {
  const eventsToRemind = await getEventsStartingIn24Hours();
  for (const event of eventsToRemind) {
    const approvedApps = await getApprovedApplications(event.id);
    for (const app of approvedApps) {
      await emailService.sendReminderEmail(
        app.user.email,
        app.user.full_name,
        event.name,
        event.start_time,
        event.location
      );
    }
    await markEventReminderSent(event.id); // Prevent duplicates
  }
});
```

---

### Method 6: sendCertificateEmail()

**Purpose**: Gửi chứng nhận tham gia qua email (UC66)

**Signature**:

```javascript
async sendCertificateEmail(email, volunteerName, eventName, certificatePdfPath)
```

**Parameters**:

- `email` (string, required): Volunteer email
- `volunteerName` (string, required): Volunteer's full name
- `eventName` (string, required): Event name
- `certificatePdfPath` (string, required): Absolute path to PDF file

**Returns**:

```javascript
Promise<{ success: boolean, messageId?: string, error?: string }>
```

**Email Template Content**:

- Subject: "🎓 Chứng nhận tham gia - {eventName}"
- Body: Congratulations, certificate included, usage instructions, social media sharing prompt

**Attachment**:

- Filename: `certificate-{eventName}.pdf`
- Type: `application/pdf`
- Size: MUST be < 5MB (validated before send)

**Constraints**:

- Should send within 5 minutes (SC-005) — includes PDF generation time
- Success rate ≥95% (SC-005)
- Reject if file size > 5MB with error log (FR-023)
- Can be resent multiple times (same certificate, not regenerated)

---

### Method 7: sendEmail() (Base Method)

**Purpose**: Core email sending function (used internally by all methods above)

**Signature**:

```javascript
async sendEmail(to, subject, html, attachments = [])
```

**Parameters**:

- `to` (string, required): Recipient email address
- `subject` (string, required): Email subject (UTF-8 encoded)
- `html` (string, required): HTML email body (UTF-8 encoded)
- `attachments` (Array, optional): Array of attachment objects
  - Each: `{ filename: string, path: string, contentType: string }`

**Returns**:

```javascript
Promise<{ success: boolean, messageId?: string, error?: string }>
```

**Validation**:

- Email format validation (RFC 5322)
- HTML content UTF-8 encoding
- Attachment file existence check
- Attachment size validation (if > 5MB, reject)

**Error Handling**:

- Invalid email → { success: false, error: 'Invalid email format' }
- SMTP connection error → { success: false, error: 'SMTP error: ...' }
- Attachment too large → { success: false, error: 'File exceeds 5MB limit' }
- All errors logged via Pino (NO sensitive data)

**Example**:

```javascript
const result = await emailService.sendEmail(
  'user@example.com',
  'Test Email',
  '<html><body>Hello World</body></html>',
  []
);
```

---

## Configuration Requirements

EmailService requires these environment variables:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false          # Use TLS instead of SSL
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@vms.example.com
SMTP_FROM_NAME=VMS System
```

**Initialization**:

```javascript
// backend/src/services/email.service.js
const EmailService = require('./email.service');
const emailService = new EmailService();

// Exported singleton
module.exports = emailService;
```

---

## Error Scenarios & Handling

| Scenario | HTTP Status | Response | Action |
|----------|------------|----------|--------|
| Valid send | 200 (implicit) | `{ success: true, messageId }` | Log success |
| Invalid email format | - | `{ success: false, error }` | Return error to caller |
| SMTP timeout | - | `{ success: false, error }` | Log, don't retry |
| SMTP auth failed | - | `{ success: false, error }` | Log, alert admin |
| File not found (UC66) | - | `{ success: false, error }` | Log, return error |
| File too large (UC66) | - | `{ success: false, error }` | Reject, log, alert |

---

## Calling Convention

**From AuthService (UC62)**:

```javascript
const emailService = require('../services/email.service');

async function sendOtpForRegistration(email, userName) {
  // Create user + verification token
  const otpCode = String(crypto.randomInt(100000, 999999));
  
  // Send verification email (don't wait, fire & forget)
  emailService.sendVerificationEmail(
    email,
    userName,
    `otpCode${token}`,
    24
  ).catch(err => logger.error('Verification email failed', { err }));
  
  // Return success immediately (email sent in background)
  return { success: true };
}
```

**From EventService (UC64)**:

```javascript
async approveApplication(applicationId) {
  const app = await getApplication(applicationId);
  app.status = 'approved';
  await updateApplication(app);
  
  // Send approval notification (async, don't block)
  emailService.sendApprovalEmail(
    app.user.email,
    app.user.full_name,
    app.event.name,
    app.event.start_time
  ).catch(err => logger.warn('Approval email failed', { err }));
  
  return { success: true };
}
```

---

## Testing

**Mock EmailService for unit tests**:

```javascript
// tests/mocks/emailService.mock.js
const mockEmailService = {
  sendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
  sendResetPasswordEmail: jest.fn().mockResolvedValue({ success: true }),
  sendApprovalEmail: jest.fn().mockResolvedValue({ success: true }),
  sendRejectionEmail: jest.fn().mockResolvedValue({ success: true }),
  sendReminderEmail: jest.fn().mockResolvedValue({ success: true }),
  sendCertificateEmail: jest.fn().mockResolvedValue({ success: true }),
  sendEmail: jest.fn().mockResolvedValue({ success: true })
};

module.exports = mockEmailService;
```

---

## Summary

- **7 exported methods**: 6 typed methods (UC62-66) + 1 base method
- **Async/await**: All methods return Promise
- **Error handling**: Return `{ success, messageId?, error? }` structure
- **NO retries**: Caller decides retry strategy
- **No DB persistence**: Logging via Pino only
- **UTF-8 support**: Vietnamese characters + emoji
- **Connection pooling**: NodeMailer handles concurrency




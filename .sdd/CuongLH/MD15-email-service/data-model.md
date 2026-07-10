# Data Model: Email Services (Module 15)

## Entities & Relationships

### 1. Email Message (Conceptual - NO DB table)

**Attributes**:

- `to` (VARCHAR): Recipient email address
- `from` (VARCHAR): Sender email (configured in .env)
- `subject` (VARCHAR): Email subject
- `html` (TEXT): HTML content
- `attachments` (ARRAY): Optional file attachments
- `status` (ENUM): pending/sent/failed
- `messageId` (VARCHAR): SMTP message ID (from NodeMailer)
- `createdAt` (TIMESTAMP): When email was queued
- `sentAt` (TIMESTAMP): When email was actually sent (NULL if failed)

**Note**: Email messages are NOT persisted in database (stateless). Logged via Pino only.

---

### 2. OTP Record (Managed by Auth Module)

**Table**: `email_verifications`

**Attributes**:

- `id` (INT, PK)
- `email` (VARCHAR 255): Email address
- `otp_hash` (VARCHAR 255): Hashed token (bcrypt)
- `type` (ENUM): 'REGISTER' or 'RESET_PASSWORD'
- `created_at` (TIMESTAMP)
- `last_sent_at` (TIMESTAMP)
- `attempts` (INT)
- `is_locked` (BOOLEAN)
- `locked_until` (TIMESTAMP)

**Constraints**:

- UNIQUE(email, type) - Only 1 active token per email per type

---

### 3. Event (Existing in event module - MODIFIED for UC65)

**Attributes**:

- `id` (INT, PK)
- `name` (VARCHAR)
- `start_date` (DATETIME): Event start time
- `status` (ENUM): 'active', 'cancelled', 'postponed', 'completed'
- `reminder_sent_at` (TIMESTAMP, NULLABLE): NEW - Track when reminder email sent (UC65)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Modification for MD15**:

- ADD COLUMN `reminder_sent_at TIMESTAMP NULLABLE` to track UC65 reminder sends and prevent duplicates

---

### 4. Application (Existing in application module)

**Attributes**:

- `id` (INT, PK)
- `event_id` (INT, FK → events.id)
- `user_id` (INT, FK → users.id)
- `status` (ENUM): 'pending', 'approved', 'rejected', 'cancelled'
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Used by MD15**:

- Query approved applications for UC64 (approval notification)
- Query approved applications for UC65 (event reminder)

---

## Data Flows: 5 Use Cases

### UC62 - Email Verification (Account Activation)

```
User Registration
  ↓
1. AuthService registers user info, sends OTP to email
  ↓
2. AuthService calls EmailService.sendVerificationEmail(email, userName, otpCode)
  ↓
3. EmailService builds verification template:
   - Contains: OTP code (6 digits), username, 10-minute expiry message
   - OTP code format: 6-digit random number
  ↓
4. NodeMailer sends to user.email via SMTP
  ↓
5. User reads OTP from email
  ↓
6. Frontend sends POST /api/v1/auth/register/verify-otp with { email, otp }
  ↓
7. Backend verifies OTP, creates user account
  ↓
✅ Account activated
```

**Email Content**: Username, OTP code (6 so), 10 phut het han, huong dan nhap OTP

---

### UC63 - Forgot Password (Password Reset Email)

```
User Forgot Password
  ↓
1. User submits email to /api/v1/auth/forgot-password
  ↓
2. AuthService.forgotPassword() creates OTP (10min expiry)
  ↓
3. AuthService calls EmailService.sendResetPasswordEmail(email, userName, otpCode)
  ↓
4. EmailService builds reset template:
   - Contains: OTP code (6 digits), username, 10-minute expiry, security warning
   - OTP code format: 6-digit random number
  ↓
5. NodeMailer sends to user.email via SMTP
  ↓
6. User reads OTP from email, enters OTP + new password
  ↓
7. Frontend sends POST /api/v1/auth/reset-password/verify-otp with { email, otp, newPassword }
  ↓
8. Backend verifies OTP, updates password_hash, deletes OTP record
  ↓
✅ Password reset complete
```

**Email Content**: Username, OTP code (6 so), 10 phut het han, canh bao bao mat

---

### UC64 - Event Approval Notification

```
Manager approves Application
  ↓
1. Manager updates Application.status='approved'
  ↓
2. EventService.approveApplication() triggers event
  ↓
3. EventService calls EmailService.sendApprovalEmail()
   OR EventService calls EmailService.sendRejectionEmail()
  ↓
4. EmailService queries volunteer info from Application
  ↓
5. EmailService builds approval/rejection template:
   - Contains: event name, volunteer name, approval status, next steps
   - For rejection: includes reason field
  ↓
6. NodeMailer sends to volunteer.email via SMTP
  ↓
✅ Volunteer notified within 1 minute
```

**Email Content**: Event name, status (Approved/Rejected), volunteer name, reason (if rejected), next steps

---

### UC65 - Event Reminder (24h Before Start)

```
Cron Job Runs (Every Hour: 0 * * * *)
  ↓
1. EmailService.runEventReminderJob()
  ↓
2. Query events where:
   - status = 'active'
   - start_date between NOW and NOW+24h
   - reminder_sent_at IS NULL (prevent duplicates)
  ↓
3. For each event, query approved applications:
   - SELECT * FROM applications 
     WHERE event_id=? AND status='approved'
  ↓
4. For each volunteer, send reminder email:
   - EmailService.sendReminderEmail(email, name, eventName, startTime)
  ↓
5. After all emails sent for event:
   - UPDATE events SET reminder_sent_at = NOW WHERE id = ?
  ↓
6. Log completion
  ↓
✅ All approved volunteers reminded 24h before event
```

**Email Content**: Event name, start time, location, volunteer name, preparation tips

**Duplicate Prevention**:

- Check `reminder_sent_at IS NULL` before querying
- Set `reminder_sent_at = NOW()` after all sends complete
- If event cancelled/postponed, skip send (check status = 'active')

---

### UC66 - Certificate Email (After Event Completion)

```
Manager issues Certificate
  ↓
1. CertificateService generates PDF file
  ↓
2. CertificateService calls EmailService.sendCertificateEmail()
  ↓
3. EmailService validates PDF size:
   - IF fileSizeMB > 5 THEN reject with error log
  ↓
4. EmailService builds certificate template:
   - Contains: certificate congratulations message, usage instructions
  ↓
5. EmailService sends email with PDF attachment:
   - attachments = [{ filename: 'certificate.pdf', path: pdfPath }]
  ↓
6. NodeMailer sends to volunteer.email via SMTP
  ↓
✅ Volunteer receives certificate
```

**Email Content**: Congratulations message, certificate usage, thank you, social media share prompt

---

## State Transitions

### Event Reminder State (UC65)

```
┌──────────────────────┐
│ Event Created        │
│ reminder_sent_at=NULL│
└──────────┬───────────┘
           │
           ├─ Cron job finds event within 24h
           │  Sends reminders to all approved volunteers
           │
┌──────────▼───────────┐
│ Event Reminder Sent  │
│ reminder_sent_at=NOW │
└──────────────────────┘
           │
           ├─ Event happens
           │  Cron job skips (reminder_sent_at already set)
           │
┌──────────▼───────────┐
│ Event Completed      │
│ status='completed'   │
│ reminder_sent_at=NOW │
└──────────────────────┘
```

### Email Send Status (Implicit)

```
┌──────────────────┐
│ Queued for Send  │
│ (in memory only) │
└────────┬─────────┘
         │
         ├─ Try send via SMTP
         │
         ├─ SUCCESS → Log + Return { success: true }
         │
         └─ FAILED → Log error + Return { success: false }
           (Do NOT retry automatically, let caller decide)
```

---

## Validation Rules

### Email Address

- Format: Valid email regex (RFC 5322 simplified)
- NOT NULL
- Max length: 255 characters

### Verification Token

- Format: Random 32+ character string
- Expires: 24 hours after creation
- Can only be used once (set used_at when consumed)

### Reset Token

- Format: Random 32+ character string
- Expires: 1 hour after creation
- Can only be used once

### Event Reminder

- Query only events starting in next 24 hours
- Query only applications with status='approved'
- Mark reminder_sent_at to prevent duplicates

### Certificate Attachment

- Format: PDF file
- Max size: 5MB (reject if exceeded)
- Filename: certificate-{eventName}.pdf

---

## Performance Considerations

### Query Optimization (UC65 Cron Job)

```sql
-- Should use indexes for speed
SELECT * FROM events
WHERE status = 'active'
  AND start_date > NOW()
  AND start_date < NOW() + INTERVAL 24 HOUR
  AND reminder_sent_at IS NULL
INDEX: (status, start_date, reminder_sent_at)

SELECT * FROM applications
WHERE event_id = ? AND status = 'approved'
INDEX: (event_id, status)
```

### Email Send Performance

- NodeMailer connection pooling (max 5 connections)
- Async/await (non-blocking)
- No sequential loops (can parallelize if needed)

---

## Summary

- **Email Messages**: NO database persistence (logging via Pino only)
- **Tokens**: Existing auth module, extended for password reset
- **Events**: Add `reminder_sent_at` column for UC65 duplicate prevention
- **Applications**: Existing, queried for UC64 & UC65
- **Validation**: Email format, token expiry, file size
- **Performance**: Connection pooling, async sends, indexed queries
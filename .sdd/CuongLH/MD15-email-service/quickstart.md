# Quick Start Guide: Email Services (MD15)

## Prerequisites

- Node.js v18+
- npm or yarn
- SMTP account (Gmail, SendGrid, Mailtrap, or similar)
- Pino logger (already in project)
- node-cron package (to be installed)

## 1. Environment Setup

### Backend .env Configuration

Add these variables to `backend/.env`:

```env
# SMTP Configuration (Gmail Service)
# Nodemailer's "service: gmail" auto-resolves host/port/secure -- no need to set manually.
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=VMS System
```

> **Note**: The transporter uses Gmail's built-in `service: "gmail"` config in `transporter.config.js`, so `SMTP_HOST`, `SMTP_PORT`, and `SMTP_SECURE` are **not needed**. The sender email address (`from`) uses `SMTP_USER` directly -- `SMTP_FROM_EMAIL` is not a separate variable.

### Get SMTP Credentials

**Option 1: Gmail**

1. Enable 2FA on Google Account
2. Create App Password: <https://myaccount.google.com/apppasswords>
3. Use generated 16-character password in SMTP_PASS

**Option 2: Mailtrap (Free for testing)**

1. Sign up at <https://mailtrap.io>
2. Create project → Get SMTP credentials
3. Copy into .env

**Option 3: SendGrid (Free tier available)**

1. Sign up at <https://sendgrid.com>
2. Create API key
3. Use in SMTP config

## 2. Install Dependencies

```bash
cd backend

# Install NodeMailer
npm install nodemailer@^9.0.3

# Install node-cron for UC65 reminder job
npm install node-cron@^3.0.x

# Verify installation
npm list nodemailer node-cron
```

## 3. Create Email Service Files

### 3.1 Create `backend/src/services/email.service.js`

> **Note**: The actual implementation uses module-level functions (not a class) and delegates HTML template generation to `emailTemplates.utility.js`. The code below is a simplified reference; see the actual source at `backend/src/services/email.service.js` for the production version.

```javascript
const nodemailer = require('nodemailer');
const fs = require('fs');
const logger = require('../config/logger.config');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
     service: "gmail",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000, // Đợi tối đa 10 giây để kết nối tới SMTP.
    greetingTimeout: 10000, // Sau khi kết nối thành công, Gmail sẽ gửi lời chào SMTP. Nếu quá 10 giây mà chưa nhận được lời chào thì hủy kết nối.
    socketTimeout: 10000, // Trong lúc gửi email, nếu socket không có dữ liệu trong 10 giây thì đóng kết nối.
    pool: { // Nodemailer sẽ giữ sẵn các kết nối để tái sử dụng
        maxConnections: 5, // Cho phép tối đa 5 kết nối SMTP đồng thời. 
        maxMessages: 100, // Mỗi kết nối sẽ gửi tối đa 100 email rồi tự đóng và mở lại kết nối mới
        rateDelta: 1000, // Khoảng thời gian tính giới hạn tốc độ, tính bằng milliseconds.
        rateLimit: 14, // Cho phép gửi tối đa 14 email trong mỗi rateDelta
    },
    });

    // verifyTransporter() is called at module level in the actual code
  }

  async sendEmail(to, subject, html, attachments = []) {
    try {
      const info = await this.transporter.sendMail({
        from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        attachments
      });

      logger.info('Email sent successfully', { to, subject, messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Email send failed', { to, subject, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async sendVerificationEmail(email, userName, otpCode, expiryMinutes = 10) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif;">
          <h1>Xác thực tài khoản</h1>
          <p>Xin chào ${userName},</p>
          <p>Mã OTP của bạn: <strong>${otpCode}</strong></p>
          <p>Mã có hiệu lực trong ${expiryMinutes} phút</p>
        </body>
      </html>
    `;
    return this.sendEmail(email, 'Xác thực tài khoản VMS', html);
  }

  async sendResetPasswordEmail(email, userName, otpCode) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif;">
          <h1>Đặt lại mật khẩu</h1>
          <p>Xin chào ${userName},</p>
          <p>Mã OTP của bạn: <strong>${otpCode}</strong></p>
          <p>Mã có hiệu lực trong 10 phút</p>
          <p><strong>Cảnh báo bảo mật:</strong> Nếu bạn không yêu cầu này, vui lòng bỏ qua email này.</p>
        </body>
      </html>
    `;
    return this.sendEmail(email, 'Đặt lại mật khẩu VMS', html);
  }

  async sendApprovalEmail(email, volunteerName, eventName, eventStartTime) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif;">
          <h1>✅ Đơn đăng ký được chấp nhận</h1>
          <p>Xin chào ${volunteerName},</p>
          <p>Chúng tôi vui mừng thông báo rằng đơn đăng ký tham gia sự kiện <strong>${eventName}</strong> của bạn đã được chấp nhận! 🎉</p>
          <p><strong>Thời gian sự kiện:</strong> ${eventStartTime}</p>
          <p>Vui lòng kiểm tra email để nhận được thêm thông tin chi tiết.</p>
        </body>
      </html>
    `;
    return this.sendEmail(email, `✅ Đơn đăng ký được chấp nhận - ${eventName}`, html);
  }

  async sendRejectionEmail(email, volunteerName, eventName, reason = '') {
    const reasonText = reason ? `<p><strong>Lý do:</strong> ${reason}</p>` : '';
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif;">
          <h1>❌ Đơn đăng ký không được chấp nhận</h1>
          <p>Xin chào ${volunteerName},</p>
          <p>Thật không may, đơn đăng ký tham gia sự kiện <strong>${eventName}</strong> của bạn không được chấp nhận lần này.</p>
          ${reasonText}
          <p>Vui lòng liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào.</p>
        </body>
      </html>
    `;
    return this.sendEmail(email, `❌ Đơn đăng ký không được chấp nhận - ${eventName}`, html);
  }

  async sendReminderEmail(email, volunteerName, eventName, eventStartTime, eventLocation = '') {
    const locationText = eventLocation ? `<p><strong>Địa điểm:</strong> ${eventLocation}</p>` : '';
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif;">
          <h1>📅 Nhắc nhở: ${eventName} sắp diễn ra</h1>
          <p>Xin chào ${volunteerName},</p>
          <p>Sự kiện <strong>${eventName}</strong> sẽ diễn ra trong vòng 24 giờ tới!</p>
          <p><strong>Thời gian:</strong> ${eventStartTime}</p>
          ${locationText}
          <p>Vui lòng chuẩn bị sẵn sàng và đến đúng giờ.</p>
        </body>
      </html>
    `;
    return this.sendEmail(email, `📅 Nhắc nhở: ${eventName} sắp diễn ra`, html);
  }

  async sendCertificateEmail(email, volunteerName, eventName, pdfPath) {
    try {
      const stats = fs.statSync(pdfPath);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      if (fileSizeMB > 5) {
        logger.error('Certificate file too large', { email, fileSizeMB, maxMB: 5 });
        return { success: false, error: 'Certificate file exceeds 5MB limit' };
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head><meta charset="UTF-8"></head>
          <body style="font-family: Arial, sans-serif;">
            <h1>🎓 Chứng nhận tham gia</h1>
            <p>Xin chào ${volunteerName},</p>
            <p>Chúc mừng bạn đã hoàn thành sự kiện <strong>${eventName}</strong>!</p>
            <p>Vui lòng xem tệp đính kèm để lấy chứng nhận của bạn.</p>
            <p>Cảm ơn bạn đã tham gia! 🙏</p>
          </body>
        </html>
      `;

      return this.sendEmail(
        email,
        `🎓 Chứng nhận tham gia - ${eventName}`,
        html,
        [
          {
            filename: `certificate-${eventName}.pdf`,
            path: pdfPath,
            contentType: 'application/pdf'
          }
        ]
      );
    } catch (error) {
      logger.error('Send certificate email failed', { email, error: error.message });
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
```

### 3.2 Create `backend/src/services/emailTemplates.utility.js`

> **Note**: In the actual codebase, HTML templates are managed in a separate `emailTemplates.utility.js` file with functions like `buildVerificationOtpTemplate()`, `buildResetPasswordOtpTemplate()`, etc. The inline templates in section 3.1 above are for quick reference only.

### 3.3 Create `backend/src/utils/cron.jobs.js`

> **Note**: Cron job not yet implemented. The `sendReminderEmail()` function and `buildReminderTemplate()` template are ready, but the actual cron schedule (`cron.jobs.js`) has not been created. `node-cron` package is not yet installed.

```javascript
const cron = require('node-cron');
const logger = require('../config/logger.config');
const emailService = require('../services/email.service');

function initializeCronJobs() {
  // UC65: Event Reminder Job - runs every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('UC65: Event Reminder Cron Job Started');
    
    try {
      // TODO: Import eventService and applicationService from your modules
      // const eventService = require('../services/event.service');
      // const applicationService = require('../services/application.service');
      
      // Query events starting in next 24 hours
      // const eventsToRemind = await eventService.getEventsStartingIn24Hours();
      
      // for (const event of eventsToRemind) {
      //   const approvedApps = await applicationService.getApprovedByEventId(event.id);
      //   
      //   for (const app of approvedApps) {
      //     await emailService.sendReminderEmail(
      //       app.user.email,
      //       app.user.full_name,
      //       event.name,
      //       event.start_time,
      //       event.location
      //     );
      //   }
      //   
      //   // Mark reminder as sent
      //   await eventService.markReminderSent(event.id);
      // }
      
      logger.info('UC65: Event Reminder Cron Job Completed Successfully');
    } catch (error) {
      logger.error('UC65: Cron Job Failed', { error: error.message });
    }
  });
}

module.exports = { initializeCronJobs };
```

## 4. Running Backend

```bash
cd backend

# Start backend server
npm run dev
```

Expected log output:

```
SMTP connection verified successfully
UC65: Event Reminder Cron Job Started (every hour at :00)
```

## 5. Testing Email Service

### Test 1: Manual sendEmail() via cURL

```bash
# Set up a test endpoint (temporary, for testing only)
# POST /api/v1/test/send-email

curl -X POST http://localhost:5000/api/v1/test/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-test-email@gmail.com",
    "subject": "Test Email",
    "html": "<h1>Hello from VMS!</h1>"
  }'
```

Expected response:

```json
{
  "success": true,
  "data": {
    "messageId": "<abc123@mail.server>"
  }
}
```

### Test 2: UC62 Verification Email (via Register)

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass@123",
    "full_name": "Test User"
  }'
```

Check your test email inbox for verification email. Should arrive within 30 seconds.

### Test 3: UC63 Forgot Password Email

```bash
curl -X POST http://localhost:5000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "existing-user@example.com"
  }'
```

Check inbox for password reset email. Should arrive within 30 seconds.

### Test 4: UC64 Approval Email (Simulate Manager approval)

```bash
# This requires authentication + proper application context
# Usually triggered via application approval endpoint
POST /api/v1/applications/{applicationId}/approve
```

## 6. Verifying Emails Received

### Check Pino Logs

```bash
# View logs in real-time
npm run dev 2>&1 | grep -i "email sent\|email send failed"
```

Expected log:

```
[INFO] Email sent successfully to=test@example.com subject=Xác thực tài khoản VMS messageId=<abc123>
```

### Check Email Client

1. Gmail/Outlook: Check Inbox or Spam folder
2. Mailtrap: Check inbox at <https://mailtrap.io>
3. MailHog (local testing): Visit <http://localhost:1025>

## 7. Troubleshooting

### Issue: SMTP Connection Failed

```
Error: SMTP connection failed
```

**Solutions**:

- Verify .env variables are correct
- Check internet connection
- If using Gmail, verify App Password is correct
- Check firewall allows SMTP port 587

### Issue: "Email send failed: Invalid email format"

```
Error: Invalid email format
```

**Solutions**:

- Check email address is valid (<test@example.com>)
- Ensure no spaces in email
- Verify UTF-8 encoding

### Issue: "Certificate file exceeds 5MB limit"

**Solution**:

- Check PDF file size: `ls -lh certificate.pdf`
- Compress PDF if needed
- Ensure file path is correct

### Issue: Emails going to Spam

**Solutions**:

- Whitelist sender address in email client
- Check if SMTP provider flagging emails as spam
- Add SPF/DKIM records if using custom domain

## 8. Performance Testing

### Load Test: 100 Concurrent Sends

```bash
# Using Apache Bench or similar
ab -n 100 -c 10 http://localhost:5000/api/v1/test/send-email
```

Expected:

- All 100 emails sent successfully (success rate ≥95%)
- Response time <500ms (p50), <2s (p95)
- Main thread not blocked

## 9. Integration Checklist

Before committing, verify:

- [ ] SMTP configuration working (.env setup)
- [ ] EmailService singleton initialized
- [ ] All 7 exported functions returning correct response format
- [ ] Pino logging working (no plaintext passwords logged)
- [ ] Cron job UC65 scheduled (runs every hour)
- [ ] UTF-8 encoding for Vietnamese characters ✅
- [ ] 5MB file size validation (UC66) ✅
- [ ] No sensitive data in error messages ✅
- [ ] Integration tests passing (80% coverage)
- [ ] Linting pass: `npm run lint`

## 10. Next Steps

1. **Implementation**: Write email.service.js, cron.jobs.js based on this guide
2. **Integration**: Wire up EmailService calls from Auth, Event, Certificate modules
3. **Testing**: Write Jest tests for all 6 methods
4. **Deployment**: Configure production SMTP credentials in environment
5. **Monitoring**: Set up alerts for email send failures

---

**Estimated Time**: 2-3 hours for full implementation + testing

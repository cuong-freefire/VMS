# Nghiên Cứu: Quyết Định Kỹ Thuật Email Services (MD15)

## R1: NodeMailer SMTP Configuration & Connection Pooling

**Quyết định**: Sử dụng NodeMailer với kết nối SMTP pooling để xử lý multiple concurrent sends mà không tạo connection mới cho mỗi mail.

**Biện minh**:

- Connection pooling giảm overhead tạo connection liên tục với SMTP server
- NodeMailer hỗ trợ native pooling via `maxConnections` option
- Tăng throughput khi xử lý 100+ concurrent requests
- Best practice cho production email services

**Các Giải Pháp Thay Thế Được Xem Xét**:

- Tạo connection mới cho mỗi send: ❌ Chậm, overhead cao, không scale
- Sử dụng library khác (SendGrid SDK, AWS SES): ❌ Vendor lock-in
- NodeMailer với pooling: ✅ Chọn cái này

**Triển Khai**:

```javascript
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  pool: {
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 14
  }
});
```

---

## R2: Email Template Strategy - JavaScript Template Strings vs Static HTML

**Quyết định**: Sử dụng **JavaScript Template Literals** (backticks) để xây dựng HTML templates động, KHÔNG dùng external template engine (Handlebars, EJS).

**Biện minh**:

- Template Literals native trong JavaScript (no dependencies)
- Đủ flexible cho dynamic content (username, event name, links)
- Performance tốt hơn vì không parse file template
- Code dễ đọc, maintain trong Service layer
- Giảm dependency count, complexity

**Các Giải Pháp Thay Thế Được Xem Xét**:

- Static HTML + regex replace: ❌ Fragile, khó maintain
- Handlebars/EJS library: ❌ Extra dependencies, parsing overhead
- Template Literals: ✅ Chọn cái này

**Triển Khai**:

```javascript
function buildVerificationOtpTemplate(userName, otpCode, expiryMinutes = 10) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>body { font-family: Arial, sans-serif; }</style>
      </head>
      <body>
        <h1>Xác thực tài khoản</h1>
        <p>Xin chào ${userName},</p>
        <p>Mã OTP của bạn: <strong>${otpCode}</strong></p>
        <p>Mã có hiệu lực trong ${expiryMinutes} phút</p>
      </body>
    </html>
  `;
}
```

---

## R3: Cron Job Scheduling Library - node-cron vs alternatives

**Quyết định**: Sử dụng **node-cron** library cho Cron Job UC65 (event reminder).

**Biện minh**:

- node-cron: nhẹ, popular, cron expression syntax quen thuộc
- Chạy in-process (không cần external service)
- Đủ cho MVP scope (chạy hàng giờ)
- Đơn giản, không cần configuration phức tạp

**Các Giải Pháp Thay Thế Được Xem Xét**:

- Agenda library: ❌ Cần MongoDB, overkill
- Bull queue: ❌ Cần Redis (excluded per spec)
- Native setTimeout loop: ❌ Không reliable, khó test
- node-cron: ✅ Chọn cái này

**Triển Khai**:

```javascript
import cron from 'node-cron';

// Chạy hàng giờ (0 * * * *)
cron.schedule('0 * * * *', async () => {
  logger.info('UC65: Event Reminder Cron Job Started');
  
  try {
    // Query events starting in 24 hours
    const eventsToRemind = await eventService.getEventsStartingIn24Hours();
    
    for (const event of eventsToRemind) {
      const approvedApps = await applicationService.getApprovedByEventId(event.id);
      
      for (const app of approvedApps) {
        await emailService.sendReminderEmail(
          app.user.email,
          app.user.full_name,
          event.name,
          event.start_time
        );
      }
      
      // Mark reminder as sent to prevent duplicates
      await eventService.markReminderSent(event.id);
    }
    
    logger.info('UC65: Event Reminder Cron Job Completed Successfully');
  } catch (error) {
    logger.error('UC65: Cron Job Failed', { error: error.message });
  }
});
```

---

## R4: Error Recovery & Logging Strategy

**Quyết định**: Email send failures KHÔNG làm interrupt main business flow. Log failures via Pino, return error status to caller, let caller decide retry strategy.

**Biện minh**:

- Email send là non-critical side effect (vs transaction completion)
- SMTP failures temporary (network issue, rate limit, server down)
- Main flow (Auth, Event approval) succeeds even if email fails
- Admin/user can retry email manually later
- Caller (AuthService, EventService) can implement own retry logic if needed

**Các Giải Pháp Thay Thế Được Xem Xét**:

- Throw error, break transaction: ❌ Bad UX, user sees "error" even though data saved
- Retry automatically 3x: ❌ Slow down main flow, SMTP might still timeout
- Log + continue, caller decides: ✅ Chọn cái này

**Triển Khai**:

```javascript
async sendEmail(to, subject, html, attachments = []) {
  try {
    
    // Send via SMTP
    const info = await this.transporter.sendMail({
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      attachments
    });
    
    // Log success
    logger.info('Email sent successfully', {
      to,
      subject,
      messageId: info.messageId
    });
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    // Log failure (NO sensitive data)
    logger.error('Email send failed', {
      to,
      subject,
      error: error.message,
      code: error.code,
      response: error.response?.substring(0, 200) // Truncate long SMTP responses
    });
    
    // Return error to caller
    return { success: false, error: error.message };
  }
}
```

---

## R5: Unicode/UTF-8 Handling cho Tiếng Việt & Emoji

**Quyết định**: Explicitly set UTF-8 encoding trong NodeMailer config và all template headers để đảm bảo Vietnamese characters, accents, emoji render correctly.

**Biện minh**:

- Email clients (Gmail, Outlook) default ASCII nếu không specify charset
- Tiếng Việt có accents (á, à, ả, ã, ạ) cần UTF-8
- Emoji (🎉, ✅) cần UTF-8
- SMTP servers qua nhiều hops, encoding có thể bị mất

**Các Giải Pháp Thay Thế Được Xem Xét**:

- ASCII only: ❌ Mất diacritics, unreadable tiếng Việt
- Manual encoding conversion: ❌ Complex, error-prone
- Explicit UTF-8 in config + templates: ✅ Chọn cái này

**Triển Khai**:

```javascript
// Config
const transporter = nodemailer.createTransport({
  ...config,
  textEncoding: 'utf8',
  connectionUrl: process.env.SMTP_URL,
  defaults: {
    from: process.env.SMTP_FROM_EMAIL,
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  }
});

// Template
function buildApprovalTemplate(volunteerName, eventName) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body>
        <h1>✅ Đơn đăng ký được chấp nhận</h1>
        <p>Xin chào ${volunteerName},</p>
        <p>Chúng tôi vui mừng thông báo rằng đơn đăng ký tham gia sự kiện <strong>${eventName}</strong> của bạn đã được chấp nhận! 🎉</p>
      </body>
    </html>
  `;
}
```

---

## R6: Attachment Size Validation (UC66 Certificate)

**Quyết định**: Validate PDF attachment size trước khi gửi. Max 5MB. Reject + log if exceeded.

**Biện minh**:

- Most email providers limit attachment size (Gmail 25MB, Microsoft 20MB, but safe < 5MB)
- Large files increase delivery failure risk
- Spec explicitly states 5MB limit
- Validate early to fail fast

**Các Giải Pháp Thay Thế Được Xem Xét**:

- Send anyway, let email service reject: ❌ Bad UX, waste resources
- No validation: ❌ Might fail silently
- Validate before send, reject if too large: ✅ Chọn cái này

**Triển Khai**:

```javascript
async sendCertificateEmail(email, volunteerName, eventName, pdfPath) {
  try {
    // Check file size
    // fs imported at module top level
    const stats = fs.statSync(pdfPath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    if (fileSizeMB > 5) {
      logger.error('Certificate file too large', {
        email,
        fileSizeMB,
        maxMB: 5
      });
      return {
        success: false,
        error: 'Certificate file exceeds 5MB limit. Please contact admin.'
      };
    }
    
    // Send with attachment
    const html = buildCertificateTemplate(volunteerName, eventName);
    const result = await this.sendEmail(
      email,
      `Chứng nhận tham gia - ${eventName}`,
      html,
      [
        {
          filename: `certificate-${eventName}.pdf`,
          path: pdfPath,
          contentType: 'application/pdf'
        }
      ]
    );
    
    return result;
    
  } catch (error) {
    logger.error('Send certificate email failed', { email, error: error.message });
    return { success: false, error: error.message };
  }
}
```

---

**Kết luận**: Tất cả 6 quyết định kỹ thuật đã được chốt, sẵn sàng cho Phase 1 Design.

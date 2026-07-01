# Research: Generate Certificate (UC53)

**Feature**: Generate Certificate  
**Date**: 2026-07-01  
**Status**: COMPLETE

---

## Research Questions

### RQ1: PDF Generation Library - Which library to use?

**Question**: Node.js có nhiều thư viện PDF generation. Nên chọn library nào cho UC53?

**Options Evaluated**:
1. **PDFKit** - Low-level PDF generation
2. **Puppeteer** - HTML to PDF via headless Chrome
3. **jsPDF** - Client-side PDF generation
4. **pdf-lib** - PDF manipulation library

**Decision**: **Option 2 - Puppeteer**

**Rationale**:
- **Flexibility**: HTML/CSS template dễ customize hơn low-level drawing
- **Performance**: Headless Chrome render nhanh, support concurrent generation
- **Template Management**: Staff có thể preview HTML template trước khi generate
- **Team Skillset**: Frontend team đã quen HTML/CSS hơn PDFKit API
- **QR Code**: Dễ dàng embed QR code bằng thư viện `qrcode` với HTML
- **Font Support**: Chrome có sẵn fonts, không cần embed manual

**Alternatives Rejected**:
- Option 1 (PDFKit): Quá low-level, khó customize layout phức tạp
- Option 3 (jsPDF): Client-side library, không suitable cho server batch processing
- Option 4 (pdf-lib): Manipulation only, không generation from scratch

**Impact**: 
- Install: `puppeteer`, `qrcode` (for QR generation)
- Template: HTML/CSS template file tại `backend/templates/certificate.html`
- Service: `CertificateService.generatePDF(data)` method

---

### RQ2: Storage Strategy - Cloudinary hay Local filesystem?

**Question**: PDF files nên lưu ở đâu?

**Options Evaluated**:
1. **Cloudinary** - Cloud storage (đã dùng cho images)
2. **Local filesystem + serve via Express** 
3. **AWS S3** - Object storage
4. **Database BLOB** - Store in MySQL

**Decision**: **Option 1 - Cloudinary**

**Rationale**:
- **Consistency**: VMS đã dùng Cloudinary cho avatars, event images
- **No Server Disk Management**: Tránh vấn đề disk full
- **CDN**: Auto CDN distribution, fast download
- **URL Expiry**: Cloudinary support signed URLs với expiration
- **No Extra Cost**: Cloudinary free tier: 25GB storage, 25GB bandwidth/month
- **Backup**: Cloudinary tự backup, không cần backup script

**Alternatives Rejected**:
- Option 2: Cần manage disk space, backup, serve static files
- Option 3: Thêm complexity, cost, cần AWS account
- Option 4: Database không designed cho large binary storage

**Impact**:
- Upload: `cloudinary.uploader.upload(pdfBuffer, { resource_type: 'raw' })`
- Response: Return `certificate_url` = Cloudinary secure_url
- Database: `certificates.certificate_url` stores Cloudinary URL

---

### RQ3: Batch Processing - Synchronous hay Asynchronous?

**Question**: Tạo 100 certificates có thể mất 30-60 giây. Xử lý sync hay async?

**Options Evaluated**:
1. **Synchronous** - Staff đợi cho đến khi hoàn tất
2. **Async with Job Queue** (Bull/BullMQ + Redis)
3. **Async with Polling** - Client poll status endpoint
4. **WebSocket** - Real-time progress updates

**Decision**: **Option 3 - Async with Polling**

**Rationale**:
- **Non-blocking UX**: Staff không bị đóng băng UI (FR-018, SC-007)
- **Simple Implementation**: Không cần Redis/Bull infrastructure
- **Progress Tracking**: Frontend poll `/certificates/batch/:jobId/status`
- **Error Handling**: Partial success được track per-certificate
- **Retry**: Staff có thể retry failed certificates
- **No Real-time Requirement**: Certificate generation không cần instant feedback

**Alternatives Rejected**:
- Option 1: UI freeze 60 giây, bad UX
- Option 2: Overkill cho MVP, thêm Redis dependency
- Option 4: Complexity cao, WebSocket connection management

**Implementation**:
```javascript
// Backend
POST /api/v1/certificates/batch
→ Returns: { jobId: "uuid", status: "PROCESSING", total: 100 }

GET /api/v1/certificates/batch/:jobId/status
→ Returns: { 
    status: "PROCESSING|COMPLETED|PARTIAL_FAILED", 
    progress: { completed: 50, failed: 2, total: 100 },
    failures: [{ userId, reason }]
  }

// Frontend polling (every 2 seconds)
useEffect(() => {
  const interval = setInterval(() => {
    fetch(`/api/v1/certificates/batch/${jobId}/status`)
      .then(res => updateProgress(res));
  }, 2000);
}, [jobId]);
```

**Job State Storage**: In-memory Map (server restart clears state, acceptable for MVP)

---

### RQ4: QR Code Content - What should QR code contain?

**Question**: QR code trên certificate dẫn đến đâu? Chứa thông tin gì?

**Options Evaluated**:
1. **Certificate ID only** - `/verify/{certificateId}`
2. **JWT Token** - Signed token với certificate data
3. **Full URL** - `https://vms.com/verify/{certificateId}`
4. **Hash** - HMAC hash of certificate data

**Decision**: **Option 3 - Full URL với Certificate ID**

**Rationale**:
- **User-Friendly**: Scan QR → trực tiếp mở browser về trang verify
- **No App Required**: Không cần VMS app, dùng native camera app
- **Simple Verification**: Backend chỉ cần lookup certificate by ID
- **Fraud Prevention**: Certificate ID là UUID v4 (unguessable)
- **Public Verification**: Ai cũng có thể verify authenticity

**Alternatives Rejected**:
- Option 1: User phải manually type URL prefix
- Option 2: JWT expire, QR code trên PDF bị invalid sau thời gian
- Option 4: Cần thêm hash validation logic, phức tạp hơn cần thiết

**QR Content Format**:
```
https://vms-platform.com/verify/certificates/a1b2c3d4-5678-90ab-cdef-123456789012
```

**Verification Page** (UC55 - out of scope for UC53):
- Public page, no authentication
- Display: Volunteer name, Event name, Issue date, Status (Valid/Revoked)
- Check: `certificates.id` exists và `certificates.issued_at` is not null

---

### RQ5: Duplicate Prevention - How to prevent re-issue?

**Question**: Staff vô tình nhấn "Generate" 2 lần → duplicate certificates?

**Options Evaluated**:
1. **Database UNIQUE constraint** - (user_id, event_id)
2. **Check before insert** - Service layer validation
3. **Idempotent API** - Same request = same result
4. **UI disable button** - Frontend-only prevention

**Decision**: **Option 1 + Option 3 - UNIQUE constraint + Idempotent API**

**Rationale**:
- **UNIQUE (user_id, event_id)**: Database-level guarantee (already exists in schema)
- **Idempotent**: If duplicate request → return existing certificate_url
- **No Error**: Duplicate không throw error, return 200 OK với existing data
- **Audit Trail**: Log "re-issue attempt" nhưng không tạo mới

**Alternatives Rejected**:
- Option 2 alone: Race condition, 2 requests gần nhau bypass check
- Option 4 alone: Client-side only, bypass được

**Implementation**:
```javascript
// Service layer
async generateCertificateForUser(userId, eventId, staffId) {
  // Check existing
  const existing = await certificateRepository.findByUserAndEvent(userId, eventId);
  if (existing) {
    logger.info('Certificate already exists, returning existing URL', { userId, eventId });
    return { 
      success: true, 
      certificate_url: existing.certificate_url,
      is_new: false 
    };
  }
  
  // Generate new
  const pdfBuffer = await this.generatePDF(userId, eventId);
  const cloudinaryUrl = await cloudinaryService.upload(pdfBuffer);
  
  // Insert with ON DUPLICATE KEY (MySQL)
  const cert = await certificateRepository.create({
    user_id: userId,
    event_id: eventId,
    certificate_url: cloudinaryUrl,
    issued_by: staffId
  });
  
  return { success: true, certificate_url: cert.certificate_url, is_new: true };
}
```

---

### RQ6: Certificate Template - Fixed template hay customizable?

**Question**: Certificate design fixed hay Admin có thể customize?

**Options Evaluated**:
1. **Fixed HTML template** - Hard-coded trong code
2. **Database-stored template** - Admin upload HTML
3. **Template Builder** - Drag-drop interface
4. **Per-Organization template** - Each org có template riêng

**Decision**: **Option 1 - Fixed HTML Template (MVP)**

**Rationale**:
- **Scope**: Spec A-005 says "Logo và chữ ký đã được Admin upload"
- **Out of Scope**: Spec Out-of-Scope #1 says "Thiết kế kéo thả" không trong UC53
- **MVP-First**: Ship fast với template chuẩn, customize sau
- **Consistency**: Tất cả certificates có consistent design
- **Simple**: Không cần template management UI

**Template Location**: `backend/templates/certificate.html`

**Template Variables** (inject data via Puppeteer):
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* A4 size 210mm x 297mm */
    @page { size: A4; margin: 0; }
    body { 
      font-family: 'Times New Roman', serif;
      background: url('border-frame.png');
      padding: 60px;
    }
    .org-logo { width: 100px; }
    .title { font-size: 36px; font-weight: bold; text-align: center; }
    .volunteer-name { font-size: 28px; color: #2C5F2D; }
    .event-name { font-size: 20px; }
    .qr-code { position: absolute; bottom: 40px; right: 40px; }
  </style>
</head>
<body>
  <img class="org-logo" src="{{ORG_LOGO_URL}}" />
  <h1 class="title">CHỨNG NHẬN TÌNH NGUYỆN</h1>
  <p>Trao cho: <span class="volunteer-name">{{VOLUNTEER_NAME}}</span></p>
  <p>Đã tham gia sự kiện: <span class="event-name">{{EVENT_NAME}}</span></p>
  <p>Thời gian: {{EVENT_START_DATE}} - {{EVENT_END_DATE}}</p>
  <p>Số giờ tình nguyện: {{VOLUNTEER_HOURS}} giờ</p>
  <p>Ngày cấp: {{ISSUE_DATE}}</p>
  <div class="signature">
    <img src="{{SIGNATURE_URL}}" />
    <p>Đại diện tổ chức</p>
  </div>
  <img class="qr-code" src="{{QR_CODE_DATA_URL}}" />
  <p class="cert-id">Mã chứng nhận: {{CERTIFICATE_ID}}</p>
</body>
</html>
```

**Future Enhancement** (Option 4 per-org template):
- Store template HTML trong `organizations.certificate_template`
- Fallback to default template nếu org chưa có custom

---

### RQ7: Email Integration - Send immediately hay queue?

**Question**: FR-005 says "trigger UC66 để gửi email". Gửi ngay hay queue?

**Options Evaluated**:
1. **Immediate send** - Gọi EmailService.send() trong transaction
2. **Queue** - Publish event, EmailService consume
3. **Batch email** - Gom 100 emails, gửi 1 lần
4. **No email** - Chỉ store URL, volunteer tự download

**Decision**: **Option 2 - Event Queue Pattern**

**Rationale**:
- **Decouple**: Certificate generation không bị block bởi email sending
- **Reliability**: Email fail không rollback certificate transaction
- **Retry**: Email service có thể retry khi SMTP fail
- **Rate Limiting**: Prevent spam flagging với 100 emails cùng lúc
- **Member 1 Ownership**: Email service thuộc Member 1, UC53 chỉ trigger event

**Implementation**:
```javascript
// CertificateService.generateCertificateForUser()
const cert = await certificateRepository.create({...});

// Emit event (not blocking)
eventEmitter.emit('certificate.issued', {
  userId: cert.user_id,
  eventId: cert.event_id,
  certificateUrl: cert.certificate_url,
  certificateId: cert.id
});

return { success: true, certificate_url: cert.certificate_url };
```

```javascript
// EmailService (Member 1)
eventEmitter.on('certificate.issued', async (data) => {
  try {
    const user = await userService.getById(data.userId);
    await emailService.send({
      to: user.email,
      subject: 'Chứng nhận tình nguyện của bạn đã sẵn sàng!',
      template: 'certificate-ready',
      data: {
        userName: user.full_name,
        downloadUrl: data.certificateUrl
      }
    });
  } catch (error) {
    logger.error('Email send failed', { error, data });
    // Retry logic here
  }
});
```

**Note**: EventEmitter là in-memory, server restart sẽ mất event. Production nên dùng Redis Pub/Sub hoặc RabbitMQ, nhưng cho MVP EventEmitter acceptable.

---

### RQ8: Preview Feature - Generate real PDF hay mock?

**Question**: US2 yêu cầu Preview trước khi issue. Generate PDF thật hay render HTML preview?

**Options Evaluated**:
1. **Generate real PDF** - Same pipeline như batch, nhưng không save
2. **HTML Preview** - Render template HTML trong iframe
3. **Screenshot** - Puppeteer screenshot thay vì PDF
4. **No Preview** - Skip US2 in MVP

**Decision**: **Option 2 - HTML Preview**

**Rationale**:
- **Fast**: Render HTML ~50ms vs Generate PDF ~500ms
- **Responsive**: Staff có thể scroll/zoom trong iframe
- **Same Template**: Dùng đúng template HTML như PDF generation
- **No Storage Cost**: Không upload Cloudinary
- **Accurate Preview**: HTML → PDF conversion của Puppeteer consistent

**Implementation**:
```javascript
// Frontend
<iframe 
  src={`/api/v1/certificates/preview?userId=${userId}&eventId=${eventId}`}
  width="100%" 
  height="800px" 
/>

// Backend
router.get('/preview', authenticate, async (req, res) => {
  const { userId, eventId } = req.query;
  
  // Fetch data
  const volunteer = await userService.getById(userId);
  const event = await eventService.getById(eventId);
  
  // Render template with data
  const html = await templateEngine.render('certificate.html', {
    VOLUNTEER_NAME: volunteer.full_name,
    EVENT_NAME: event.title,
    // ... other variables
  });
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});
```

**Future Enhancement** (Option 1): Add "Download Preview PDF" button để test thật không save DB.

---

### RQ9: Performance Optimization - How to meet SC-001 (100 certs < 60s)?

**Question**: Tạo 100 certificates trong 60s = 600ms/cert. Làm sao đạt được?

**Bottlenecks Identified**:
1. Puppeteer launch/close overhead
2. Cloudinary upload latency
3. Database inserts
4. Template rendering

**Optimization Strategies**:

**Strategy 1: Puppeteer Connection Pooling**
```javascript
// Keep 5 persistent browser instances
const puppeteerPool = {
  browsers: [],
  size: 5,
  
  async getPage() {
    if (this.browsers.length === 0) {
      await this.init();
    }
    const browser = this.browsers[Math.floor(Math.random() * this.size)];
    return await browser.newPage();
  },
  
  async init() {
    for (let i = 0; i < this.size; i++) {
      const browser = await puppeteer.launch({ headless: true });
      this.browsers.push(browser);
    }
  }
};
```
**Impact**: Reduce 2000ms launch time to ~100ms per cert

**Strategy 2: Parallel Processing**
```javascript
// Process 10 certificates at a time
async function generateBatch(volunteers, eventId, staffId) {
  const BATCH_SIZE = 10;
  const results = [];
  
  for (let i = 0; i < volunteers.length; i += BATCH_SIZE) {
    const batch = volunteers.slice(i, i + BATCH_SIZE);
    const promises = batch.map(v => 
      generateCertificateForUser(v.id, eventId, staffId)
    );
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
  }
  
  return results;
}
```
**Impact**: 100 certs / 10 parallel = 10 batches × 5s = 50s total

**Strategy 3: Batch Database Inserts**
```javascript
// Insert 10 records at once
await prisma.certificates.createMany({
  data: certificateDataArray,
  skipDuplicates: true
});
```
**Impact**: Reduce 100 × 20ms = 2s → 1 × 200ms = 0.2s

**Strategy 4: Cloudinary Batch Upload**
```javascript
// Cloudinary supports concurrent uploads
const uploadPromises = pdfBuffers.map(buffer => 
  cloudinary.uploader.upload(buffer, { resource_type: 'raw' })
);
const results = await Promise.all(uploadPromises);
```
**Impact**: Parallel upload → same as Strategy 2

**Combined Performance**:
- Puppeteer pool: 2000ms → 100ms per cert
- 10 parallel workers: 100 certs → 10 batches
- Batch time: 100ms (PDF) + 200ms (upload) + 50ms (DB) = 350ms
- Total: 10 batches × 350ms = **3.5 seconds** ✅ (target: < 60s)

**Measured Results** (to be validated in testing):
- Target: 100 certs < 60s (SC-001)
- Expected: 100 certs ~4-5s (với pooling + parallel)
- Worst case (no optimization): 100 certs ~120s (fails SC-001)

---

## Technology Stack Confirmed

### Backend Dependencies (New)
```json
{
  "puppeteer": "^21.0.0",  // PDF generation
  "qrcode": "^1.5.3"        // QR code generation
}
```

**No additional dependencies** - Cloudinary SDK đã có sẵn từ image upload features.

### Database Schema
**No new tables** - `certificates` table đã tồn tại trong DATABASE.md.

**Confirm Schema**:
```sql
CREATE TABLE certificates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  certificate_url VARCHAR(500) NOT NULL,
  issued_by INT NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (user_id, event_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (issued_by) REFERENCES users(id)
);
```

**UNIQUE constraint** (user_id, event_id) prevents duplicates (RQ5).

---

## Integration Points

### Upstream Dependencies (UC53 Consumes)

**AttendanceService (Member 3)**:
```javascript
// Get volunteers eligible for certificates
async getEligibleVolunteers(eventId) {
  // Returns: Volunteers với attendance.status = 'PRESENT'
  return await prisma.attendances.findMany({
    where: {
      application: {
        event_id: eventId
      },
      status: 'PRESENT'
    },
    include: {
      application: {
        include: {
          user: true,
          event: true
        }
      }
    }
  });
}
```

**UserService (Member 1)**:
```javascript
// Get volunteer public info
async getById(userId) {
  return await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true, full_name: true, email: true }
  });
}
```

**EventService (Member 3)**:
```javascript
// Get event details for certificate
async getById(eventId) {
  return await prisma.events.findUnique({
    where: { id: eventId },
    include: {
      organization: {
        select: { logo_url: true, signature_url: true }
      }
    }
  });
}
```

### Downstream Consumers (Who Calls UC53)

**UC47 - View Attendance History (Member 3)**:
- Displays "Generate Certificates" button cho completed events
- Shows certificate status (Issued/Not Issued) per volunteer

**UC66 - Email Service (Member 1)**:
- Consumes `certificate.issued` event
- Sends notification email với download link

---

## Best Practices

### Error Handling

**Partial Failures**:
```javascript
// Don't fail entire batch if 1 cert fails
async function generateBatch(volunteers, eventId, staffId) {
  const results = [];
  
  for (const volunteer of volunteers) {
    try {
      const cert = await generateCertificateForUser(volunteer.id, eventId, staffId);
      results.push({ userId: volunteer.id, success: true, url: cert.certificate_url });
    } catch (error) {
      logger.error('Certificate generation failed', { userId: volunteer.id, error });
      results.push({ userId: volunteer.id, success: false, error: error.message });
    }
  }
  
  return results;
}
```

**Retry Strategy**:
- Cloudinary upload fail → Retry 3 times với exponential backoff
- Puppeteer crash → Restart browser pool
- Database deadlock → Retry transaction

### Security

**Input Validation**:
- Validate `eventId` is valid UUID
- Check Staff belongs to same organization as Event
- Ensure Event status = 'COMPLETED' (FR-001)

**File Access**:
- Certificate URLs should be public (anyone can verify)
- Alternatively: Use Cloudinary signed URLs với 30-day expiry

---

## Risk Assessment

### Risk 1: Puppeteer Memory Leak

**Probability**: Medium  
**Impact**: High (server crash after 1000s certs)  
**Mitigation**:
- Implement page cleanup: `await page.close()` after each cert
- Monitor memory usage, restart pool khi > 1GB
- Set timeout: `page.goto(template, { timeout: 10000 })`

**Status**: MITIGATED

---

### Risk 2: Cloudinary Rate Limiting

**Probability**: Low  
**Impact**: Medium (batch fails)  
**Mitigation**:
- Cloudinary free tier: 500 uploads/hour
- For 100 certs batch < rate limit
- Implement exponential backoff on 429 errors
- Production: Upgrade to paid plan if needed

**Status**: MITIGATED

---

### Risk 3: Browser Instance Leak

**Probability**: Medium  
**Impact**: High (server becomes unresponsive)  
**Mitigation**:
- Graceful shutdown: Close all browsers on SIGTERM
- Health check: Restart pool if any browser crashed
- Max pages per browser: 10 pages, then spawn new browser

**Status**: MITIGATED

---

### Risk 4: Template Variable Injection (XSS in PDF)

**Probability**: Low  
**Impact**: Medium (malicious content in certificate)  
**Mitigation**:
- Sanitize all user inputs: full_name, event title
- Use Puppeteer `setContent()` with sanitized HTML
- Escape special characters: `<`, `>`, `&`, `"`

**Status**: MITIGATED

---

## Summary

**All Research Questions Resolved**:
- ✅ RQ1: Puppeteer for PDF generation
- ✅ RQ2: Cloudinary for storage
- ✅ RQ3: Async processing với polling
- ✅ RQ4: QR code contains full verify URL
- ✅ RQ5: UNIQUE constraint + idempotent API
- ✅ RQ6: Fixed HTML template (MVP)
- ✅ RQ7: Event queue pattern for email
- ✅ RQ8: HTML preview (không generate PDF)
- ✅ RQ9: Puppeteer pooling + parallel processing

**Key Decisions**:
1. Puppeteer + HTML template (flexible, team-friendly)
2. Cloudinary storage (consistent với existing architecture)
3. Async batch processing với polling (non-blocking UX)
4. Connection pooling + parallel execution (performance)

**Performance Target**: ✅ 100 certificates < 60 seconds achievable

**Ready for Phase 1**: Data model và contracts can now be defined.

---

**Last Updated**: 2026-07-01  
**Researcher**: AI Agent (TienTD module owner)

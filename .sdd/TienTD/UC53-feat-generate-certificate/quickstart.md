# Quick Start: Generate Certificate (UC53)

**Feature**: Generate Certificate  
**Estimated Time**: 15 minutes setup + 2 days implementation

---

## Prerequisites

- Node.js 18+ installed
- MySQL database running
- Cloudinary account configured
- VMS backend dev server running
- Postman/curl for API testing

---

## 1. Install Dependencies (5 min)

```bash
cd backend
npm install puppeteer@^21.0.0 qrcode@^1.5.3
```

**Verify Installation**:
```bash
node -e "const puppeteer = require('puppeteer'); console.log('✅ Puppeteer:', puppeteer.version())"
node -e "const qrcode = require('qrcode'); console.log('✅ QRCode ready')"
```

---

## 2. Create Certificate Template (10 min)

```bash
mkdir -p backend/templates
touch backend/templates/certificate.html
```

**Minimal Template** (`backend/templates/certificate.html`):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 0; }
    body { 
      font-family: 'Times New Roman', serif;
      padding: 60px;
      text-align: center;
    }
    .title { font-size: 36px; margin: 40px 0; }
    .volunteer-name { font-size: 28px; color: #2C5F2D; font-weight: bold; }
    .event-name { font-size: 20px; margin: 20px 0; }
    .qr-code { margin-top: 40px; }
  </style>
</head>
<body>
  <h1 class="title">CHỨNG NHẬN TÌNH NGUYỆN</h1>
  <p>Trao cho: <span class="volunteer-name">{{VOLUNTEER_NAME}}</span></p>
  <p>Đã tham gia: <span class="event-name">{{EVENT_NAME}}</span></p>
  <p>Thời gian: {{EVENT_START_DATE}} - {{EVENT_END_DATE}}</p>
  <p>Số giờ: {{VOLUNTEER_HOURS}} giờ</p>
  <p>Ngày cấp: {{ISSUE_DATE}}</p>
  <img class="qr-code" src="{{QR_CODE_DATA_URL}}" width="150" />
  <p>Mã: {{CERTIFICATE_ID}}</p>
</body>
</html>
```

---

## 3. Implementation Order (TDD)

### Phase 1: Backend Core (Day 1 - 6 hours)

**Step 1: Repository Layer** (1h)
```bash
touch backend/src/repositories/certificate.repository.js
```

**Step 2: Service Layer** (2h)
```bash
touch backend/src/services/certificate.service.js
touch backend/src/services/puppeteer-pool.service.js
touch backend/src/services/template.service.js
```

**Step 3: Controller + Routes** (1h)
```bash
touch backend/src/controllers/certificate.controller.js
touch backend/src/routes/certificate.routes.js
```

**Step 4: Tests** (2h)
```bash
mkdir -p backend/tests/unit/services
mkdir -p backend/tests/integration/api
touch backend/tests/unit/services/certificate.service.test.js
touch backend/tests/integration/api/certificate.api.test.js
```

### Phase 2: Frontend UI (Day 2 - 4 hours)

**Step 1: API Client** (30min)
```bash
touch frontend/src/services/certificateApi.js
```

**Step 2: Components** (2h)
```bash
mkdir -p frontend/src/components/Certificate
touch frontend/src/components/Certificate/GenerateBatchButton.jsx
touch frontend/src/components/Certificate/BatchProgressModal.jsx
touch frontend/src/components/Certificate/PreviewModal.jsx
```

**Step 3: Integration** (1h)
```bash
# Add button to UC47 Attendance History page
# frontend/src/pages/Staff/AttendanceHistory.jsx
```

**Step 4: Tests** (30min)
```bash
touch frontend/src/components/Certificate/__tests__/GenerateBatchButton.test.jsx
```

---

## 4. Quick Test (Postman)

### Test 1: Generate Batch

**Request**:
```http
POST http://localhost:5000/api/v1/certificates/batch
Content-Type: application/json
Cookie: token=<your_jwt_token>

{
  "event_id": 1
}
```

**Expected Response** (202):
```json
{
  "success": true,
  "data": {
    "job_id": "uuid-here",
    "status": "PROCESSING",
    "total": 10
  }
}
```

### Test 2: Poll Status

**Request**:
```http
GET http://localhost:5000/api/v1/certificates/batch/{job_id}/status
Cookie: token=<your_jwt_token>
```

**Expected Response** (200):
```json
{
  "success": true,
  "data": {
    "job_id": "uuid-here",
    "status": "COMPLETED",
    "progress": {
      "completed": 10,
      "failed": 0,
      "total": 10
    }
  }
}
```

### Test 3: Preview HTML

**Request**:
```http
GET http://localhost:5000/api/v1/certificates/preview?user_id=1&event_id=1
Cookie: token=<your_jwt_token>
```

**Expected**: HTML page rendered trong browser

---

## 5. Common Issues & Fixes

### Issue 1: Puppeteer "chromium not found"

**Error**: `Error: Could not find Chromium`

**Fix**:
```bash
# Force download chromium
node node_modules/puppeteer/install.js

# Or use system Chrome
const browser = await puppeteer.launch({
  executablePath: '/path/to/chrome'  // Windows: C:\Program Files\Google\Chrome\Application\chrome.exe
});
```

### Issue 2: Cloudinary upload fails

**Error**: `Upload failed: Invalid credentials`

**Fix**: Check `.env`:
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Issue 3: QR code không hiển thị

**Error**: QR code shows broken image

**Fix**: Ensure QR data URL format:
```javascript
const qrDataURL = await qrcode.toDataURL(qrUrl, {
  width: 200,
  margin: 1,
  errorCorrectionLevel: 'M'
});
// Returns: "data:image/png;base64,iVBORw0KG..."
```

### Issue 4: Memory leak sau 100+ certificates

**Error**: Server crashes with `JavaScript heap out of memory`

**Fix**: Implement Puppeteer pool cleanup:
```javascript
// Close page after each cert
await page.close();

// Restart browser after 100 certs
if (certsGenerated % 100 === 0) {
  await browser.close();
  browser = await puppeteer.launch();
}
```

---

## 6. Performance Benchmarks

**Target** (SC-001): 100 certificates < 60 seconds

**Expected Performance** (with optimization):
- 10 certificates: ~1 second
- 50 certificates: ~3 seconds
- 100 certificates: ~5 seconds

**Measure Performance**:
```javascript
const start = Date.now();
await certificateService.generateBatch(eventId, staffId);
const duration = Date.now() - start;
console.log(`Generated 100 certs in ${duration}ms`);
// Target: < 60000ms
```

---

## 7. Manual Testing Checklist

- [ ] **US1.1**: Staff nhấn "Generate All" → 202 response với job_id
- [ ] **US1.2**: Poll /status endpoint → progress updates từ 0% → 100%
- [ ] **US1.3**: Check database → 100 certificate records inserted
- [ ] **US1.4**: Check Cloudinary → 100 PDF files uploaded
- [ ] **US1.5**: Download 1 certificate → PDF mở được, có QR code
- [ ] **US1.6**: Scan QR code → dẫn đến verify page (UC55 - future)
- [ ] **US2.1**: Nhấn "Preview" cho 1 volunteer → HTML hiển thị trong modal
- [ ] **US2.2**: Preview shows correct data (name, event, dates)
- [ ] **US2.3**: Preview QR code shows "preview-mode"
- [ ] **FR-001**: Event status != COMPLETED → 400 error
- [ ] **FR-002**: No present volunteers → 400 error
- [ ] **FR-003**: Generate twice → Idempotent (same URLs returned)
- [ ] **FR-005**: Email sent after generation (check inbox)
- [ ] **FR-018**: UI không freeze khi generating (progress bar animates)

---

## 8. Deployment Notes

### Environment Variables

```bash
# .env (backend)
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
FRONTEND_URL=https://vms.com  # For QR code verify URL
```

### Production Considerations

**Puppeteer on Server**:
```bash
# Install chromium dependencies on Ubuntu/Debian
sudo apt-get install -y \
  gconf-service libasound2 libatk1.0-0 libc6 libcairo2 \
  libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 \
  libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 \
  libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
  libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 \
  libxrender1 libxss1 libxtst6 fonts-liberation \
  libappindicator1 libnss3 lsb-release xdg-utils wget
```

**Process Monitoring**:
```bash
# PM2 config
{
  "apps": [{
    "name": "vms-backend",
    "script": "src/server.js",
    "instances": 2,
    "exec_mode": "cluster",
    "max_memory_restart": "500M",  // Restart if memory > 500MB
    "env": {
      "NODE_ENV": "production"
    }
  }]
}
```

---

## 9. Next Steps

1. ✅ Setup complete
2. 🔨 Implement backend (Day 1)
3. 🎨 Implement frontend (Day 2)
4. ✅ Test locally
5. 🚀 Deploy to staging
6. 📧 Coordinate với Member 1 cho UC66 email integration
7. 🔗 Integrate UC47 attendance history UI

---

## 10. Documentation Links

- **Spec**: `.sdd/TienTD/UC53-feat-generate-certificate/spec.md`
- **Research**: `.sdd/TienTD/UC53-feat-generate-certificate/research.md`
- **Data Model**: `.sdd/TienTD/UC53-feat-generate-certificate/data-model.md`
- **API Contracts**: `.sdd/TienTD/UC53-feat-generate-certificate/contracts/api-endpoints.md`
- **Implementation Plan**: `.sdd/TienTD/UC53-feat-generate-certificate/plan.md`
- **Tasks**: `.sdd/TienTD/UC53-feat-generate-certificate/tasks.md` (generate via `/speckit-tasks`)

---

**Last Updated**: 2026-07-01  
**Owner**: Member 3 - TienTD  
**Estimated Implementation**: 2 days (10 hours total)

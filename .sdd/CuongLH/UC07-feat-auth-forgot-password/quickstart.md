# Quickstart: UC07 - Forgot Password

**Feature**: Quên Mật Khẩu (Forgot Password)  
**Owner**: Member 1 - CuongLH  
**Date**: 2026-06-29

---

## What This Feature Does

Cho phép người dùng quên mật khẩu khôi phục tài khoản thông qua luồng 3 bước:
1. Nhập email → Nhận mã OTP qua email
2. Nhập mã OTP → Xác thực danh tính
3. Nhập mật khẩu mới → Hoàn tất đổi mật khẩu

**Key Security Features**:
- Zero user enumeration (không lộ email tồn tại hay không)
- Lockout 15 phút sau 5 lần nhập sai OTP
- Cooldown 60 giây giữa các lần gửi OTP
- OTP TTL 10 phút

---

## Prerequisites

- Node.js >= 14.10.0
- MySQL database running
- SMTP server configured (Gmail/custom)
- Prisma CLI installed (`npm install -D prisma`)

---

## Quick Setup (5 minutes)

### 1. Database Migration

```bash
cd backend

# Generate Prisma migration
npx prisma migrate dev --name add_type_to_email_verifications

# Apply migration
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

**Expected Output**: Table `email_verifications` updated with `type` column and indexes. (Bảng được tạo từ UC04, UC07 chỉ thêm cột `type`.)

---

### 2. Environment Variables

Add to `backend/.env`:

```bash
# Email Service (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Generate from Google Account Settings
SMTP_FROM_NAME=VMS System
SMTP_FROM_EMAIL=noreply@vms.com

# Password Hashing
BCRYPT_SALT_ROUNDS=12
```

**Note**: Để lấy App Password cho Gmail:
1. Google Account → Security → 2-Step Verification → App passwords
2. Generate new app password cho "Mail"
3. Copy và paste vào `SMTP_PASS`

---

### 3. Setup MySQL Event Scheduler (Optional - for cleanup)

```bash
# Connect to MySQL
mysql -u root -p

# Enable Event Scheduler
SET GLOBAL event_scheduler = ON;

# Create cleanup event (tùy chọn — dùng cho OTP hết hạn chưa được dùng)
CREATE EVENT IF NOT EXISTS cleanup_expired_otp
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
  DELETE FROM email_verifications 
  WHERE type = 'RESET_PASSWORD'
    AND created_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE)
    AND is_locked = FALSE;

# Verify
SHOW EVENTS WHERE Name = 'cleanup_expired_otp';
```

---

## File Structure

```
backend/src/
├── controllers/
│   └── auth.controller.js          # MODIFY: Add 3 new endpoints
├── services/
│   ├── auth.service.js              # MODIFY: Add forgot password logic
│   └── email.service.js             # MODIFY: Add sendResetPasswordOTP() template
├── repositories/
│   ├── user.repository.js           # EXISTING: Reuse findByEmail
│   └── emailVerification.repository.js  # EXISTING (UC04): Reuse/extend upsert, findByEmailType, delete
├── middlewares/
│   └── validators/
│       └── auth.validator.js        # MODIFY: Add forgot password Zod schemas
├── utils/
│   └── otp.util.js                  # EXISTING (UC04): Reuse OTP generation helper
└── routes/
    └── auth.routes.js               # MODIFY: Add 3 new routes

frontend/src/
├── pages/
│   └── auth/
│       ├── ForgotPasswordStep1.jsx     # CREATE: Step 1 - Email input
│       ├── ForgotPasswordStep2.jsx     # CREATE: Step 2 - OTP verify
│       └── ForgotPasswordStep3.jsx     # CREATE: Step 3 - New password
├── contexts/
│   └── ForgotPasswordContext.jsx       # CREATE: State management
├── services/
│   └── authApi.js                      # MODIFY: Add 3 API calls
└── App.js                              # MODIFY: Add 3 routes
```

---

## Implementation Steps

### Step 1: Backend Core (1 hour)

```bash
# 1. Create OTP utility
touch backend/src/utils/otp.util.js

# 2. Create OTP repository
touch backend/src/repositories/otp.repository.js

# 3. Create Email service
touch backend/src/services/email.service.js

# 4. Modify Auth service
# Add 3 methods: requestResetPassword, verifyResetOTP, resetPassword
```

**Key Files to Implement**:
- `otp.util.js`: `generateOTP()` using `crypto.randomInt(100000, 999999)`
- `otp.repository.js`: `create()`, `findLatest()`, `invalidateOld()`, `incrementAttempts()`
- `email.service.js`: `sendResetPasswordOTP(email, otp)` with try-catch

---

### Step 2: Backend API Routes (30 minutes)

```bash
# Modify auth.validator.js
# Add 3 Zod schemas: requestResetSchema, verifyOTPSchema, resetPasswordSchema

# Modify auth.controller.js
# Add 3 controllers: requestResetPassword, verifyResetOTP, resetPassword

# Modify auth.routes.js
# Add 3 routes with validation middleware
```

**Routes**:
```javascript
router.post('/forgot-password/request', validate(requestResetSchema), requestResetPassword);
router.post('/forgot-password/verify-otp', validate(verifyOTPSchema), verifyResetOTP);
router.post('/forgot-password/reset', validate(resetPasswordSchema), resetPassword);
```

---

### Step 3: Frontend Context (15 minutes)

```bash
cd frontend
mkdir -p src/contexts
touch src/contexts/ResetPasswordContext.jsx
```

**Context Features**:
- Lưu email user đang reset
- Lưu trạng thái OTP verified (true/false)
- Persist vào sessionStorage (survive page refresh)
- clearResetState() sau khi hoàn tất

---

### Step 4: Frontend Pages (2 hours)

```bash
mkdir -p frontend/src/pages
touch frontend/src/pages/ForgotPasswordEmailPage.jsx
touch frontend/src/pages/ForgotPasswordOTPPage.jsx
touch frontend/src/pages/ForgotPasswordResetPage.jsx
```

**Page Flow**:
1. **EmailPage**: Form nhập email → Call API 1 → Navigate to OTPPage
2. **OTPPage**: Form nhập 6-digit OTP → Call API 2 → Navigate to ResetPage
3. **ResetPage**: Form nhập new password → Call API 3 → Navigate to Login

---

### Step 5: Frontend API Integration (30 minutes)

```bash
# Modify authApi.js
# Add 3 async functions calling backend APIs
```

```javascript
export async function requestResetPassword(email) {
  const response = await axios.post('/auth/forgot-password/request', { email });
  return response.data;
}

export async function verifyResetOTP(email, otp) {
  const response = await axios.post('/auth/forgot-password/verify-otp', { email, otp });
  return response.data;
}

export async function resetPassword(email, otp, newPassword) {
  const response = await axios.post('/auth/forgot-password/reset', { email, otp, newPassword });
  return response.data;
}
```

---

## Testing Checklist

### Manual Testing

**Happy Path**:
```bash
# 1. Request OTP
curl -X POST http://localhost:5000/api/v1/auth/forgot-password/request \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Expected: 200 OK, check email for OTP

# 2. Verify OTP
curl -X POST http://localhost:5000/api/v1/auth/forgot-password/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'

# Expected: 200 OK, verified: true

# 3. Reset Password
curl -X POST http://localhost:5000/api/v1/auth/forgot-password/reset \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456","newPassword":"NewSecure@123"}'

# Expected: 200 OK, password changed
```

**Error Cases**:
- [ ] Email không tồn tại → Vẫn 200 OK (zero enumeration)
- [ ] OTP sai 5 lần → 429 locked 15 phút
- [ ] Request OTP trong vòng 60s → 429 cooldown
- [ ] OTP hết hạn (> 10 phút) → 400 expired

---

### Automated Testing

```bash
# Backend unit tests
cd backend
npm test -- auth.service.test.js
npm test -- otp.repository.test.js

# Backend integration tests
npm test -- auth.routes.test.js

# Frontend component tests
cd frontend
npm test -- ForgotPasswordEmailPage.test.jsx
npm test -- ForgotPasswordOTPPage.test.jsx
npm test -- ForgotPasswordResetPage.test.jsx
```

**Test Coverage Target**: 80% for service layer, 60% for controllers.

---

## Common Issues & Solutions

### Issue 1: Email không được gửi

**Triệu chứng**: API trả về 200 OK nhưng không nhận được email

**Solution**:
```bash
# Check backend logs
tail -f backend/logs/app.log | grep "Failed to send OTP"

# Verify SMTP credentials
node -e "console.log(process.env.SMTP_USER, process.env.SMTP_PASS)"

# Test SMTP connection
node -e "require('nodemailer').createTransport({host:'smtp.gmail.com',port:587,auth:{user:'your-email@gmail.com',pass:'your-app-password'}}).verify((err,success)=>console.log(err||'SMTP OK'))"
```

---

### Issue 2: OTP always invalid

**Triệu chứng**: Nhập đúng OTP nhưng vẫn báo sai

**Solution**:
```bash
# Check database directly
mysql -u root -p
USE vms;
SELECT * FROM email_verifications WHERE email='test@example.com' AND type='RESET_PASSWORD';

# Verify OTP generation
node -e "const crypto=require('crypto');console.log(crypto.randomInt(100000,999999))"
```

---

### Issue 3: Cooldown không hoạt động

**Triệu chứng**: Có thể spam request OTP nhiều lần

**Solution**:
- Check logic trong `auth.service.js` → `cooldownExpiry = created_at + 60000ms`
- Verify query `findLatest()` return đúng record mới nhất
- Check timezone server vs database (should use UTC)

---

### Issue 4: Frontend state bị mất khi refresh

**Triệu chứng**: F5 page thì quay về step 1

**Solution**:
- Verify sessionStorage được set trong `ResetPasswordContext.jsx`
- Check browser DevTools → Application → Session Storage → `reset_email`, `reset_otp_verified`
- Ensure `useEffect` dependencies đúng: `[email]`, `[otpVerified]`

---

## Performance Benchmarks

**Expected Performance** (với 100 concurrent requests):

| Endpoint | Target | Measured |
|----------|--------|----------|
| POST /forgot-password/request | < 2s | [TBD] |
| POST /forgot-password/verify-otp | < 500ms | [TBD] |
| POST /forgot-password/reset | < 1s | [TBD] |

**Load Test Command**:
```bash
# Install k6
brew install k6  # Mac
choco install k6  # Windows

# Run load test
k6 run tests/load/forgot-password.k6.js
```

---

## Security Checklist

Before merging to main:

- [ ] Zero user enumeration verified (response time < 100ms variance)
- [ ] Lockout mechanism tested (5 wrong OTP attempts → 15 min lock)
- [ ] Cooldown enforced (60s between OTP requests)
- [ ] OTP entropy verified (crypto.randomInt, not Math.random)
- [ ] Password hashed with bcrypt 12 rounds
- [ ] Email service failures logged but not exposed to frontend
- [ ] Swagger documentation updated
- [ ] No secrets committed to git
- [ ] CORS configured for frontend origin only

---

## Deployment Checklist

Before deploying to production:

- [ ] Run all tests: `npm test`
- [ ] Build passes: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] Database migration applied on staging
- [ ] MySQL Event Scheduler enabled on production
- [ ] SMTP credentials configured on production
- [ ] Environment variables set on hosting platform
- [ ] SSL/TLS enabled for SMTP (SMTP_SECURE=true in production)
- [ ] Rate limiting configured (nginx/cloudflare)
- [ ] Monitoring alerts setup for email send failures

---

## Next Steps After Implementation

1. **Update share_context.md**: Add API contracts to Member 1 section
2. **Update Swagger**: Add JSDoc comments for 3 endpoints
3. **Create PR**: Branch `feat/UC07-forgot-password` → `main`
4. **Manual QA**: Test trên staging environment
5. **Monitor**: Check logs for email send success rate (target > 99%)

---

## Support & Documentation

- **Spec**: `.sdd/CuongLH/UC07-feat-auth-forgot-password/spec.md`
- **Research**: `.sdd/CuongLH/UC07-feat-auth-forgot-password/research.md`
- **Data Model**: `.sdd/CuongLH/UC07-feat-auth-forgot-password/data-model.md`
- **API Contracts**: `.sdd/CuongLH/UC07-feat-auth-forgot-password/contracts/api-contracts.md`
- **Project Rules**: `AGENTS.md`, `CLAUDE.md`, `DATABASE.md`

---

**Estimated Total Implementation Time**: 5-6 hours

**Breakdown**:
- Backend core logic: 1.5 hours
- Backend API routes: 0.5 hours
- Frontend context: 0.25 hours
- Frontend pages: 2 hours
- API integration: 0.5 hours
- Testing: 1 hour
- Documentation: 0.5 hours

---

**End of Quickstart**

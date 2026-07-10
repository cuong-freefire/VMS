# Quickstart Guide: Authentication Register (UC04)

**Feature**: UC04 - Authentication Register with OTP Email Verification

**Audience**: Developers implementing or testing this feature

**Last Updated**: 2026-06-29

---

## Overview (Tổng quan)

This guide helps you quickly set up and test the registration feature locally. It covers environment setup, database migration, running the application, and testing the 2-step registration flow.

---

## Prerequisites (Điều kiện tiên quyết)

Before starting, ensure you have:

- [x] Node.js v18+ installed
- [x] MySQL 8.0+ running locally or remotely
- [x] npm (comes with Node.js)
- [x] Git (for cloning the repository)
- [x] SMTP credentials (Gmail, SendGrid, or Mailtrap for testing)
- [x] Code editor (VS Code recommended)

---

## 1. Environment Setup (Thiết lập môi trường)

### Step 1.1: Clone Repository (Tải mã nguồn)

```bash
git clone <repository-url>
cd VMS
```

### Step 1.2: Install Dependencies (Cài đặt thư viện)

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 1.3: Configure Backend Environment (Cấu hình môi trường Backend)

Create `.env` file in `backend/` directory:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your configuration:

```env
# Server Configuration
PORT=5000
API_PREFIX=/api/v1
FRONTEND_ORIGIN=http://localhost:3000

# Database Configuration
DATABASE_URL="mysql://root:password@localhost:3306/vms"

# JWT Configuration
AUTH_SECRET=your-jwt-secret-key-change-in-production
COOKIE_ACCESS_NAME=vms_access_token
COOKIE_REFRESH_NAME=vms_refresh_token
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Password Hashing
BCRYPT_SALT_ROUNDS=12

# SMTP Configuration (Example: Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM_NAME=VMS System
SMTP_FROM_EMAIL=your-email@gmail.com
```

**SMTP Setup Options**:

**Option A: Gmail (Development)**

1. Go to Google Account → Security → 2-Step Verification
2. Generate App Password
3. Use app password in `SMTP_PASS`

**Option B: Mailtrap (Testing)**

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
```

**Option C: SendGrid (Production)**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Step 1.4: Configure Frontend Environment (Cấu hình môi trường Frontend)

Create `.env` file in `frontend/` directory:

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
PORT=3000
REACT_APP_API_BASE_URL=http://localhost:5000/api/v1
```

---

## 2. Database Setup (Thiết lập Database)

### Step 2.1: Create Database (Tạo Database)

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE vms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Verify
SHOW DATABASES;

# Exit
exit;
```

### Step 2.2: Run Migrations (Chạy Migrations)

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run all migrations (including email_verifications table)
npx prisma migrate deploy

# Verify migration status
npx prisma migrate status
```

Expected output:

```
✔ Your database is now in sync with your Prisma schema.
```

### Step 2.3: Seed Initial Data (Khởi tạo dữ liệu mẫu)

```bash
# Seed roles and other master data
npm run seed

# Or manually:
node src/seeds/seed.js
```

Verify roles were created:

```bash
mysql -u root -p vms -e "SELECT * FROM roles;"
```

Expected output:

```
+----+-----------+------------------------------------------+
| id | name      | description                              |
+----+-----------+------------------------------------------+
|  1 | VOLUNTEER | Tình nguyện viên tham gia sự kiện       |
|  2 | STAFF     | Nhân viên quản lý sự kiện                |
|  3 | MANAGER   | Quản lý cấp trung                        |
|  4 | ADMIN     | Quản trị viên hệ thống                   |
+----+-----------+------------------------------------------+
```

---

## 3. Running the Application (Chạy ứng dụng)

### Step 3.1: Start Backend (Khởi động Backend)

```bash
cd backend

# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

Expected output:

```
🚀 Server running on http://localhost:5000
📚 API Documentation: http://localhost:5000/api-docs
🔌 Database connected
```

### Step 3.2: Start Frontend (Khởi động Frontend)

Open a new terminal:

```bash
cd frontend

# Development mode
npm start
```

Expected output:

```
Compiled successfully!

You can now view vms-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.x:3000
```

### Step 3.3: Verify Services (Kiểm tra dịch vụ)

Check if services are running:

```bash
# Check backend health
curl http://localhost:5000/api/v1/health

# Expected: {"success": true, "message": "API is running"}

# Check frontend
curl http://localhost:3000

# Expected: HTML response
```

---

## 4. Testing Registration Flow (Kiểm thử luồng đăng ký)

### Method A: Using Frontend UI (Dùng giao diện Frontend)

#### Step 1: Navigate to Register Page

1. Open browser: `http://localhost:3000/register`
2. You should see Step 1 form with fields:
   - Email
   - Full Name
   - Phone Number
   - Password
   - Confirm Password

#### Step 2: Fill Registration Form

```
Email: test@example.com
Full Name: Nguyễn Văn Test
Phone Number: 0912345678
Password: TestPass123
Confirm Password: TestPass123
```

Click **"Tiếp theo"** button

#### Step 3: Check Email

1. Open your email inbox (or Mailtrap inbox)
2. Look for email with subject: "Mã xác thực đăng ký VMS"
3. Copy the 6-digit OTP (e.g., "123456")

#### Step 4: Enter OTP

1. You should be on Step 2 page
2. Enter the 6-digit OTP
3. Click **"Xác nhận"** button
4. You should see success toast: "Đăng ký thành công"
5. Redirected to Login page

#### Step 5: Login with New Account

```
Email: test@example.com
Password: TestPass123
```

Click **"Đăng nhập"**

---

### Method B: Using cURL (Kiểm thử API)

#### Test 1: Send OTP

```bash
curl -X POST http://localhost:5000/api/v1/auth/register/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

Expected response:

```json
{
  "success": true,
  "data": {
    "message": "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.",
    "cooldown_seconds": 60
  }
}
```

Check your email for OTP.

#### Test 2: Verify OTP

```bash
curl -X POST http://localhost:5000/api/v1/auth/register/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456",
    "full_name": "Nguyễn Văn Test",
    "phone_number": "0912345678",
    "password": "TestPass123"
  }'
```

Expected response:

```json
{
  "success": true,
  "data": {
    "message": "Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ.",
    "user_id": 1
  }
}
```

#### Test 3: Verify User Created

```bash
mysql -u root -p vms -e "SELECT id, email, full_name, phone_number, role_id, is_active FROM users WHERE email='test@example.com';"
```

Expected output:

```
+----+-------------------+------------------+-------------+---------+-----------+
| id | email             | full_name        | phone_number| role_id | is_active |
+----+-------------------+------------------+-------------+---------+-----------+
|  1 | test@example.com  | Nguyễn Văn Test | 0912345678  |       1 |         1 |
+----+-------------------+------------------+-------------+---------+-----------+
```

---

### Method C: Using Postman (Dùng Postman)

1. Import Postman collection: `backend/docs/postman/VMS-Auth-Register.json` (if available)
2. Or manually create requests:

**Request 1: Send OTP**

- Method: POST
- URL: `http://localhost:5000/api/v1/auth/register/send-otp`
- Headers: `Content-Type: application/json`
- Body (raw JSON):

```json
{
  "email": "test@example.com"
}
```

**Request 2: Verify OTP**

- Method: POST
- URL: `http://localhost:5000/api/v1/auth/register/verify-otp`
- Headers: `Content-Type: application/json`
- Body (raw JSON):

```json
{
  "email": "test@example.com",
  "otp": "{{OTP_FROM_EMAIL}}",
  "full_name": "Test User",
  "phone_number": "0912345678",
  "password": "TestPass123"
}
```

---

## 5. Testing Edge Cases (Kiểm thử trường hợp biên)

### Test Case 1: Email Already Registered

```bash
# Try to register with existing email
curl -X POST http://localhost:5000/api/v1/auth/register/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Expected: `409 Conflict` - "Email đã được sử dụng..."

---

### Test Case 2: Cooldown Enforcement

```bash
# Send OTP
curl -X POST http://localhost:5000/api/v1/auth/register/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com"}'

# Immediately resend (within 60 seconds)
curl -X POST http://localhost:5000/api/v1/auth/register/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com"}'
```

Expected: `429 Too Many Requests` - "Vui lòng đợi X giây..."

---

### Test Case 3: Wrong OTP (5 attempts lockout)

```bash
# Send OTP
curl -X POST http://localhost:5000/api/v1/auth/register/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "locktest@example.com"}'

# Try wrong OTP 5 times
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/v1/auth/register/verify-otp \
    -H "Content-Type: application/json" \
    -d '{
      "email": "locktest@example.com",
      "otp": "999999",
      "full_name": "Test",
      "phone_number": "0912345678",
      "password": "TestPass123"
    }'
  echo "\nAttempt $i"
done
```

Expected on 5th attempt: `429 Too Many Requests` - "Email đã bị khóa trong 15 phút"

---

### Test Case 4: OTP Expiration

```bash
# Manually update created_at to 11 minutes ago
mysql -u root -p vms -e "UPDATE email_verifications SET created_at = DATE_SUB(NOW(), INTERVAL 11 MINUTE) WHERE email='expire@example.com';"

# Try to verify
curl -X POST http://localhost:5000/api/v1/auth/register/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "expire@example.com",
    "otp": "123456",
    "full_name": "Test",
    "phone_number": "0912345678",
    "password": "TestPass123"
  }'
```

Expected: `400 Bad Request` - "Mã OTP đã hết hạn"

---

## 6. Debugging Tips (Mẹo gỡ lỗi)

### Check Backend Logs (Xem nhật ký Backend)

```bash
cd backend
tail -f logs/app.log

# Or if using console logs
npm run dev
```

Look for:

- OTP generation logs (should NOT show plaintext OTP)
- Email send success/failure
- Database query errors
- Validation errors

### Check Database State (Kiểm tra trạng thái Database)

```bash
# Check email_verifications table
mysql -u root -p vms -e "SELECT * FROM email_verifications;"

# Check users table
mysql -u root -p vms -e "SELECT id, email, full_name, role_id, is_active FROM users;"

# Check locked emails
mysql -u root -p vms -e "SELECT email, attempts, is_locked, locked_until FROM email_verifications WHERE is_locked = TRUE;"
```

### Common Issues (Vấn đề thường gặp)

**Issue 1: SMTP Connection Error**

```
Error: getaddrinfo ENOTFOUND smtp.gmail.com
```

**Solution**: Check SMTP_HOST, SMTP_PORT, firewall settings

---

**Issue 2: Database Connection Error**

```
Error: Can't connect to MySQL server on 'localhost'
```

**Solution**:

- Verify MySQL is running: `systemctl status mysql` (Linux) or `brew services list` (Mac)
- Check DATABASE_URL in .env
- Test connection: `mysql -u root -p`

---

**Issue 3: Migration Failed**

```
Error: P3009 - Migration failed to apply cleanly
```

**Solution**:

```bash
npx prisma migrate reset --force
npx prisma migrate deploy
npm run seed
```

---

**Issue 4: CORS Error in Frontend**

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**: Verify `FRONTEND_ORIGIN=http://localhost:3000` in backend `.env`

---

## 7. Cleanup (Dọn dẹp)

### Reset Test Data (Xóa dữ liệu kiểm thử)

```bash
# Clear test users
mysql -u root -p vms -e "DELETE FROM users WHERE email LIKE '%@example.com';"

# Clear pending verifications
mysql -u root -p vms -e "DELETE FROM email_verifications;"
```

### Stop Services (Dừng dịch vụ)

```bash
# Stop backend (Ctrl+C in terminal)
# Stop frontend (Ctrl+C in terminal)

# Or if running in background
pkill -f "node.*backend"
pkill -f "react-scripts"
```

---

## 8. Running Tests (Chạy kiểm thử)

### Backend Unit Tests (Kiểm thử đơn vị Backend)

```bash
cd backend
npm test

# Run specific test file
npm test -- auth.register.test.js

# Run with coverage
npm run test:coverage
```

### Frontend Component Tests (Kiểm thử component Frontend)

```bash
cd frontend
npm test

# Run specific test
npm test -- Register.test.jsx
```

---

## 9. Next Steps (Bước tiếp theo)

After successfully testing registration:

1. ✅ Test Login feature (UC03) with newly registered account
2. ✅ Test Profile Management (UC18-UC21)
3. ✅ Explore event features as Volunteer
4. ✅ Review API documentation at `http://localhost:5000/api-docs`

---

## 10. Additional Resources (Tài nguyên bổ sung)

- **API Contracts**: See `contracts/` directory
- **Data Model**: See `data-model.md`
- **Technical Decisions**: See `research.md`
- **Implementation Plan**: See `plan.md`
- **Spec**: See `spec.md`

---

## Need Help?

- Check backend logs for errors
- Verify .env configuration
- Ensure database migrations are up to date
- Test SMTP connection separately
- Review error responses for clues

**Common Commands Reference**:

```bash
# Backend
npm run dev              # Start dev server
npm test                 # Run tests
npx prisma studio        # Open Prisma Studio (GUI)
npx prisma migrate reset # Reset database

# Frontend
npm start                # Start dev server
npm test                 # Run tests
npm run build            # Build for production
```

---

**Quickstart Status**: ✅ COMPLETE - Ready for development
# Quickstart Guide: UC15 Add Event

**Feature**: Staff tạo sự kiện tình nguyện mới  
**Owner**: TienTD (Event Management Module)  
**Last Updated**: 2026-06-29

---

## Prerequisites

Trước khi bắt đầu, đảm bảo môi trường đã cài đặt:

- ✅ **Node.js** 18.x hoặc mới hơn
- ✅ **MySQL** 8.0+ đang chạy
- ✅ **npm** hoặc **yarn** package manager
- ✅ **Git** để clone repository
- ✅ **Cloudinary account** (free tier) cho image upload

**Optional (Recommended)**:
- VS Code với extensions: ESLint, Prettier
- Postman hoặc Thunder Client để test API
- MySQL Workbench để quản lý database

---

## Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/your-org/VMS.git
cd VMS
```

### 2. Configure Environment Variables

#### Backend Environment

Tạo file `.env` trong folder `backend/`:

```bash
cd backend
cp .env.example .env
```

Cập nhật các giá trị sau trong `backend/.env`:

```bash
# Server Configuration
PORT=5000
API_PREFIX=/api/v1
NODE_ENV=development

# Frontend CORS
FRONTEND_ORIGIN=http://localhost:3000

# Database (MySQL)
DATABASE_URL="mysql://root:your_password@localhost:3306/vms_dev"

# JWT Authentication
AUTH_SECRET=your-super-secret-jwt-key-change-in-production
COOKIE_ACCESS_NAME=vms_access_token
COOKIE_REFRESH_NAME=vms_refresh_token
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Password Hashing
BCRYPT_SALT_ROUNDS=10

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Payment Gateways (Optional for UC15)
# VNPAY_TMN_CODE=your-tmn-code
# VNPAY_HASH_SECRET=your-hash-secret
# VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
```

**Cloudinary Setup**:
1. Tạo account miễn phí tại https://cloudinary.com
2. Vào Dashboard → Account Details
3. Copy Cloud name, API Key, API Secret vào `.env`

#### Frontend Environment

Tạo file `.env` trong folder `frontend/`:

```bash
cd ../frontend
cp .env.example .env
```

Cập nhật `frontend/.env`:

```bash
PORT=3000
REACT_APP_API_BASE_URL=http://localhost:5000/api/v1
```

### 3. Install Dependencies

#### Backend Dependencies

```bash
cd backend
npm install
```

**Key packages** được cài đặt:
- `express@5.x` - Web framework
- `@prisma/client` - ORM client
- `prisma` - Database migration tool
- `zod` - Validation library
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cloudinary` - Image upload
- `pino` - Logger
- `swagger-jsdoc` - API documentation

#### Frontend Dependencies

```bash
cd ../frontend
npm install
```

**Key packages** được cài đặt:
- `react@19.x` - UI framework
- `@mui/material` - Material UI components
- `react-hook-form` - Form management
- `axios` - HTTP client
- `bootstrap@5.x` - CSS framework

### 4. Database Setup

#### Create Database

Đảm bảo MySQL server đang chạy, sau đó tạo database:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE vms_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

#### Run Migrations

```bash
cd backend
npx prisma migrate dev --name init
```

Lệnh này sẽ:
1. Đọc schema từ `prisma/schema.prisma`
2. Tạo migration file
3. Apply migration vào database
4. Generate Prisma Client

#### Generate Prisma Client

Nếu Prisma Client chưa được generate:

```bash
npx prisma generate
```

#### Seed Test Data (Optional)

Populate database với test data:

```bash
npm run seed
```

Seed data bao gồm:
- 2 Organizations (Org A, Org B)
- 5 Users (1 Admin, 2 Staff, 2 Volunteers)
- 3 Sample Events (Draft/Published/In Progress)
- 10 Skills and 5 Categories

**Test Accounts**:
- **Staff**: `staff@org.com` / `password123`
- **Volunteer**: `volunteer@example.com` / `password123`
- **Admin**: `admin@vms.com` / `admin123`

### 5. Verify Database Schema

Kiểm tra bảng `events` đã được tạo:

```bash
npx prisma studio
```

Hoặc dùng MySQL CLI:

```sql
USE vms_dev;
DESCRIBE events;
SHOW INDEX FROM events;
```

---

## Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

Backend sẽ chạy tại: **http://localhost:5000**

**Available endpoints**:
- API: `http://localhost:5000/api/v1`
- Swagger Docs: `http://localhost:5000/api-docs`
- Health Check: `http://localhost:5000/health`

**Console output** nên hiển thị:
```text
[INFO] Server running on port 5000
[INFO] Environment: development
[INFO] Database connected successfully
[INFO] Swagger docs available at /api-docs
```

### Start Frontend Server (New Terminal)

```bash
cd frontend
npm start
```

Frontend sẽ chạy tại: **http://localhost:3000**

Browser sẽ tự động mở. Nếu không, manually navigate đến `http://localhost:3000`.

---

## Testing the Feature

### Option 1: Test via Frontend UI

1. **Login as Staff**:
   - Navigate to `http://localhost:3000/login`
   - Email: `staff@org.com`
   - Password: `password123`

2. **Create New Event**:
   - Click "Events" → "Add Event" (or navigate to `/events/add`)
   - Fill form:
     - **Title**: "Mùa Hè Xanh 2026"
     - **Description**: "Chiến dịch tình nguyện mùa hè tại các tỉnh miền núi phía Bắc..." (min 50 chars)
     - **Start Date**: Chọn ngày trong tương lai (> 24h từ now)
     - **End Date**: Sau start date
     - **Location**: "Hà Giang, Việt Nam"
     - **Max Capacity**: 50
     - **Upload Image** (optional): Chọn file ảnh (max 5MB, JPG/PNG)
     - **Status**: Draft hoặc Published
   - Click "Create Event"

3. **Verify Result**:
   - Nên thấy success message
   - Event xuất hiện trong event list
   - Verify trong database: `SELECT * FROM events ORDER BY created_at DESC LIMIT 1;`

### Option 2: Test via API (cURL)

#### Step 1: Login to get JWT cookie

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@org.com",
    "password": "password123"
  }' \
  -c cookies.txt \
  -v
```

Kiểm tra response header có `Set-Cookie: vms_access_token=...`.

#### Step 2: Create Event

```bash
curl -X POST http://localhost:5000/api/v1/events \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Test Event via cURL",
    "description": "This is a comprehensive test event created via cURL command to validate the API endpoint functionality.",
    "start_date": "2026-08-01T09:00:00.000Z",
    "end_date": "2026-08-05T17:00:00.000Z",
    "location": "Hanoi, Vietnam",
    "max_capacity": 30
  }' \
  | json_pp
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 4,
    "organization_id": 1,
    "title": "Test Event via cURL",
    "description": "This is a comprehensive test...",
    "start_date": "2026-08-01T09:00:00.000Z",
    "end_date": "2026-08-05T17:00:00.000Z",
    "location": "Hanoi, Vietnam",
    "max_capacity": 30,
    "cover_image_url": null,
    "status": "Draft",
    "is_active": true,
    "created_by": 3,
    "created_at": "2026-06-29T15:30:00.000Z",
    "updated_at": "2026-06-29T15:30:00.000Z"
  }
}
```

### Option 3: Test via Postman

1. **Import Collection**:
   - File → Import → `backend/postman/VMS.postman_collection.json` (nếu có)
   - Hoặc manually create requests

2. **Configure Environment**:
   - Base URL: `http://localhost:5000/api/v1`

3. **Login Request**:
   - Method: POST
   - URL: `{{baseUrl}}/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "staff@org.com",
       "password": "password123"
     }
     ```
   - **IMPORTANT**: Enable "Save cookies" trong Settings

4. **Create Event Request**:
   - Method: POST
   - URL: `{{baseUrl}}/events`
   - Headers: `Content-Type: application/json`
   - Body (JSON): Copy example từ `contracts/POST-events.md`
   - Cookies sẽ tự động được gửi kèm

---

## Running Tests

### Backend Unit Tests

```bash
cd backend
npm test
```

Run specific test file:
```bash
npm test -- tests/unit/services/event.service.test.js
```

### Backend Integration Tests

```bash
npm test -- tests/integration/event.test.js
```

**Test Coverage Report**:
```bash
npm test -- --coverage
```

Target: ≥ 80% coverage cho Service layer.

### Frontend Component Tests

```bash
cd frontend
npm test
```

Run specific test:
```bash
npm test -- src/pages/__tests__/AddEventPage.test.jsx
```

### E2E Testing (Optional)

Nếu có Cypress setup:
```bash
npm run cypress:open
```

---

## Troubleshooting

### Issue 1: Database Connection Failed

**Error**: `Error: P1001: Can't reach database server`

**Solution**:
1. Verify MySQL đang chạy: `sudo systemctl status mysql` (Linux) hoặc check Services (Windows)
2. Check `DATABASE_URL` trong `.env` có đúng credentials
3. Test connection: `mysql -u root -p`

### Issue 2: JWT Token Invalid

**Error**: `401 Unauthorized: Authentication required`

**Solution**:
1. Re-login để get fresh token
2. Check `AUTH_SECRET` trong backend `.env` không rỗng
3. Verify frontend config `withCredentials: true` trong Axios

### Issue 3: Cloudinary Upload Failed

**Error**: `500 Internal Server Error: Image upload failed`

**Solution**:
1. Verify Cloudinary credentials trong `.env`
2. Check file size < 5MB
3. Check file format (JPG/PNG only)
4. Test Cloudinary connection:
   ```bash
   node -e "const cloudinary = require('cloudinary').v2; cloudinary.config({cloud_name: 'xxx', api_key: 'xxx', api_secret: 'xxx'}); cloudinary.api.ping().then(console.log);"
   ```

### Issue 4: Validation Error

**Error**: `400 Bad Request: Start date must be in the future`

**Solution**:
1. Đảm bảo start_date > current time + 24 hours
2. Sử dụng ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
3. Check timezone: Backend dùng UTC time

### Issue 5: Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Kill process on port 5000 (Linux/Mac)
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Hoặc đổi PORT trong .env
```

### Issue 6: Prisma Client Not Generated

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
cd backend
npx prisma generate
```

---

## Development Workflow

### Making Changes

1. **Pull latest code**:
   ```bash
   git pull origin Dev
   ```

2. **Create feature branch**:
   ```bash
   git checkout -b feat/uc15-add-event
   ```

3. **Make changes & test locally**

4. **Run linter**:
   ```bash
   npm run lint
   ```

5. **Run tests**:
   ```bash
   npm test
   ```

6. **Commit changes**:
   ```bash
   git add .
   git commit -m "feat(events): implement UC15 Add Event API"
   ```

7. **Push & create PR**:
   ```bash
   git push origin feat/uc15-add-event
   ```

### Database Schema Changes

Nếu cần modify `events` table:

1. Edit `prisma/schema.prisma`
2. Create migration:
   ```bash
   npx prisma migrate dev --name add_field_to_events
   ```
3. Apply migration:
   ```bash
   npx prisma migrate deploy
   ```

---

## Useful Commands

### Backend

```bash
# Development server với hot reload
npm run dev

# Production build
npm run build
npm start

# Run linter
npm run lint

# Format code
npm run format

# Reset database (CAREFUL: Deletes all data)
npx prisma migrate reset --force

# View database in browser
npx prisma studio

# Generate Swagger documentation
npm run swagger
```

### Frontend

```bash
# Development server
npm start

# Production build
npm run build

# Run tests with watch mode
npm test -- --watch

# Check bundle size
npm run build && source-map-explorer 'build/static/js/*.js'
```

---

## API Documentation

**Swagger UI**: http://localhost:5000/api-docs

Swagger tự động generate từ JSDoc comments trong code. Để update docs:

1. Edit JSDoc comments trong controller file
2. Restart server
3. Refresh Swagger UI

**API Contract Details**: Xem `contracts/POST-events.md` trong folder này.

---

## Related Documentation

- **Feature Specification**: `SPEC.md` trong folder này
- **Implementation Plan**: `plan.md` trong folder này
- **Data Model**: `data-model.md` trong folder này
- **API Contract**: `contracts/POST-events.md`
- **Database Schema**: `DATABASE.md` (project root)
- **Architecture Decisions**: `CLAUDE.md` (project root)

---

## Need Help?

### Internal Resources

- **VMS Wiki**: [Link to internal wiki]
- **Slack Channel**: #vms-development
- **Code Owner**: TienTD (Event Management Module)

### External Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Zod Documentation](https://zod.dev/)
- [React Documentation](https://react.dev/)
- [Material UI Documentation](https://mui.com/)

### Common Questions

**Q: Tại sao start_date phải > current time + 24h?**  
A: Business rule để Staff có đủ thời gian chuẩn bị và Volunteers có thời gian đăng ký.

**Q: Có thể tạo event cho organization khác không?**  
A: Không. `organization_id` được extract từ JWT token để prevent unauthorized access.

**Q: Event Status "Draft" vs "Published" khác gì?**  
A: Draft = chưa public cho Volunteers. Published = hiển thị trên platform và cho phép Volunteers đăng ký.

**Q: Làm sao update event sau khi đã tạo?**  
A: Sử dụng endpoint `PATCH /api/v1/events/:id` (UC18 - chưa implement trong phase này).

---

**Version**: 1.0  
**Last Updated**: 2026-06-29  
**Author**: TienTD

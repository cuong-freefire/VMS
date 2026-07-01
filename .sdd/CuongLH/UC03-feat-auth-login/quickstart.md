# quickstart.md — Quick Start Guide for UC03 Authentication Login

**Feature**: UC03-feat-auth-login  
**Owner**: Member 1 - CuongLH  
**Date**: 2026-06-29

---

## Prerequisites

Trước khi implement UC03, đảm bảo các prerequisites sau đã sẵn sàng:

### Environment Setup

✅ **NodeJS**: v18.x hoặc v20.x LTS installed

✅ **MySQL**: v8.0+ installed và running

✅ **npm**: v9+ (comes with NodeJS)

✅ **Git**: Đã clone VMS repository

✅ **IDE**: VS Code hoặc tương đương với ESLint extension

### Project Structure

✅ **Backend**: `backend/` directory đã có structure cơ bản (src/, prisma/, tests/)

✅ **Frontend**: `frontend/` directory đã có React app setup (Create React App)

✅ **Database**: MySQL database `vms` đã được tạo

### Dependencies Installed

#### Backend

```bash
cd backend
npm install
```

**Key packages cần có**:
- `express` - Web framework
- `@prisma/client` - ORM client
- `prisma` (dev) - ORM CLI
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT handling
- `zod` - Validation
- `uuid` - Generate jti
- `cookie-parser` - Parse cookies
- `cors` - CORS middleware
- `dotenv` - Environment variables
- `jest` (dev) - Testing framework
- `supertest` (dev) - API testing

#### Frontend

```bash
cd frontend
npm install
```

**Key packages cần có**:
- `react` - UI library
- `react-dom` - React DOM renderer
- `react-router-dom` - Routing
- `axios` - HTTP client
- `react-toastify` - Toast notifications
- `bootstrap` - UI framework

---

## Step 1: Environment Configuration

### Backend `.env`

Tạo file `backend/.env` từ template:

```bash
cd backend
cp .env.example .env
```

**Edit `.env`** với config cho UC03:

```bash
# Server
PORT=5000
API_PREFIX=/api/v1
NODE_ENV=development

# Frontend Origin (CORS)
FRONTEND_ORIGIN=http://localhost:3000

# Database
DATABASE_URL="mysql://root:password@localhost:3306/vms"

# JWT
AUTH_SECRET=your-256-bit-secret-key-change-in-production
COOKIE_ACCESS_NAME=vms_access_token
COOKIE_SECURE=false  # true in production
COOKIE_SAME_SITE=Lax
JWT_ACCESS_EXPIRES_IN=7d

# Bcrypt
BCRYPT_SALT_ROUNDS=12
```

**Generate AUTH_SECRET** (secure random string):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend `.env`

Tạo file `frontend/.env`:

```bash
cd frontend
cp .env.example .env
```

**Edit `.env`**:

```bash
PORT=3000
REACT_APP_API_BASE_URL=http://localhost:5000/api/v1
```

---

## Step 2: Database Setup

### 2.1. Update Prisma Schema

**File**: `backend/prisma/schema.prisma`

Đảm bảo có 4 models sau (theo `data-model.md`):

```prisma
// datasource và generator đã có sẵn

model Role {
  id          Int      @id @default(autoincrement())
  name        String   @unique @db.VarChar(50)
  description String?  @db.VarChar(255)
  created_at  DateTime @default(now()) @map("created_at")
  
  users       User[]
  
  @@map("roles")
}

model User {
  id             Int       @id @default(autoincrement())
  email          String    @unique @db.VarChar(255)
  password_hash  String    @map("password_hash") @db.VarChar(255)
  full_name      String    @map("full_name") @db.VarChar(255)
  phone          String?   @db.VarChar(20)
  avatar_url     String?   @map("avatar_url") @db.VarChar(500)
  role_id        Int       @map("role_id")
  is_active      Boolean   @default(true) @map("is_active")
  email_verified Boolean   @default(false) @map("email_verified")
  created_at     DateTime  @default(now()) @map("created_at")
  updated_at     DateTime  @updatedAt @map("updated_at")
  
  role           Role      @relation(fields: [role_id], references: [id])
  session        UserSession?
  
  @@index([role_id])
  @@index([is_active])
  @@index([email_verified])
  @@map("users")
}

model UserSession {
  id         Int      @id @default(autoincrement())
  user_id    Int      @unique @map("user_id")
  jti        String   @db.VarChar(255)
  expires_at DateTime @map("expires_at")
  created_at DateTime @default(now()) @map("created_at")
  
  user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([jti])
  @@index([expires_at])
  @@map("user_sessions")
}

model LoginAttempt {
  id           Int       @id @default(autoincrement())
  email        String    @unique @db.VarChar(255)
  attempts     Int       @default(0)
  locked_until DateTime? @map("locked_until")
  created_at   DateTime  @default(now()) @map("created_at")
  updated_at   DateTime  @updatedAt @map("updated_at")
  
  @@index([locked_until])
  @@map("login_attempts")
}
```

### 2.2. Generate Migration

```bash
cd backend
npx prisma migrate dev --name create_auth_tables
```

**Output**: Migration files created in `prisma/migrations/`

### 2.3. Seed Roles

**File**: `backend/prisma/seed.js`

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding roles...');
  
  const roles = [
    { name: 'VOLUNTEER', description: 'Tình nguyện viên tham gia sự kiện' },
    { name: 'STAFF', description: 'Nhân viên quản lý sự kiện và xét duyệt' },
    { name: 'MANAGER', description: 'Quản lý cấp trung, quản lý danh mục' },
    { name: 'ADMIN', description: 'Quản trị viên hệ thống' }
  ];
  
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role
    });
  }
  
  console.log('✅ Roles seeded successfully');
  
  // Optional: Create test user cho development
  if (process.env.NODE_ENV === 'development') {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('Test123!', 12);
    
    await prisma.user.upsert({
      where: { email: 'volunteer@test.com' },
      update: {},
      create: {
        email: 'volunteer@test.com',
        password_hash: hashedPassword,
        full_name: 'Test Volunteer',
        role_id: 1, // VOLUNTEER
        is_active: true,
        email_verified: true
      }
    });
    
    console.log('✅ Test user created: volunteer@test.com / Test123!');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Run seed**:

```bash
npx prisma db seed
```

### 2.4. Verify Database

```bash
npx prisma studio
```

Browser sẽ mở Prisma Studio → Verify:
- ✅ `roles` table có 4 records
- ✅ `users` table có test user (dev only)
- ✅ `user_sessions` table empty
- ✅ `login_attempts` table empty

---

## Step 3: Backend Implementation

### 3.1. Utility Functions

#### JWT Util

**File**: `backend/src/utils/jwt.util.js`

```javascript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.AUTH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '7d';

export const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};
```

#### Response Util

**File**: `backend/src/utils/response.util.js`

```javascript
export const successResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

export const errorResponse = (res, error, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error: typeof error === 'string' ? error : error.message
  });
};
```

### 3.2. Repository Layer

**File**: `backend/src/repositories/auth.repository.js`

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { role: true }
  });
};

export const upsertSession = async (userId, jti, expiresAt) => {
  return prisma.userSession.upsert({
    where: { user_id: userId },
    create: { user_id: userId, jti, expires_at: expiresAt },
    update: { jti, expires_at: expiresAt }
  });
};

export const getLoginAttempts = async (email) => {
  return prisma.loginAttempt.findUnique({
    where: { email: email.toLowerCase() }
  });
};

export const incrementLoginAttempts = async (email) => {
  const normalized = email.toLowerCase();
  const existing = await prisma.loginAttempt.findUnique({
    where: { email: normalized }
  });
  
  if (existing) {
    const newAttempts = existing.attempts + 1;
    const lockedUntil = newAttempts >= 5 
      ? new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      : null;
    
    return prisma.loginAttempt.update({
      where: { email: normalized },
      data: { attempts: newAttempts, locked_until: lockedUntil }
    });
  } else {
    return prisma.loginAttempt.create({
      data: { email: normalized, attempts: 1 }
    });
  }
};

export const resetLoginAttempts = async (email) => {
  return prisma.loginAttempt.delete({
    where: { email: email.toLowerCase() }
  }).catch(() => null); // Ignore if not exists
};
```

### 3.3. Service Layer

**File**: `backend/src/services/auth.service.js`

```javascript
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as authRepo from '../repositories/auth.repository.js';
import { signToken } from '../utils/jwt.util.js';

export const login = async (email, password) => {
  const normalizedEmail = email.toLowerCase();
  
  // Step 1: Check lockout
  const lockout = await authRepo.getLoginAttempts(normalizedEmail);
  if (lockout && lockout.locked_until && new Date(lockout.locked_until) > new Date()) {
    const error = new Error('Tài khoản tạm thời bị khóa do nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau 15 phút.');
    error.statusCode = 429;
    error.lockedUntil = lockout.locked_until;
    throw error;
  }
  
  // Step 2: Find user
  const user = await authRepo.findUserByEmail(normalizedEmail);
  if (!user) {
    await authRepo.incrementLoginAttempts(normalizedEmail);
    const error = new Error('Email hoặc mật khẩu không đúng');
    error.statusCode = 401;
    throw error;
  }
  
  // Step 3: Verify password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    await authRepo.incrementLoginAttempts(normalizedEmail);
    const error = new Error('Email hoặc mật khẩu không đúng');
    error.statusCode = 401;
    throw error;
  }
  
  // Step 4: Check is_active
  if (!user.is_active) {
    const error = new Error('Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.');
    error.statusCode = 403;
    throw error;
  }
  
  // Step 5: Generate JWT
  const jti = uuidv4();
  const payload = {
    user_id: user.id,
    email: user.email,
    role_id: user.role_id,
    jti
  };
  const token = signToken(payload);
  
  // Step 6: Upsert session
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await authRepo.upsertSession(user.id, jti, expiresAt);
  
  // Step 7: Reset login attempts
  await authRepo.resetLoginAttempts(normalizedEmail);
  
  // Return user data (exclude password_hash)
  const { password_hash, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};
```

### 3.4. Validator

**File**: `backend/src/validators/auth.validator.js`

```javascript
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ').toLowerCase(),
  password: z.string().min(1, 'Mật khẩu là bắt buộc')
});

export const validateLogin = (req, res, next) => {
  try {
    loginSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.errors.map(e => ({ field: e.path[0], message: e.message }))
    });
  }
};
```

### 3.5. Controller

**File**: `backend/src/controllers/auth.controller.js`

```javascript
import * as authService from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    // Set HttpOnly cookie
    res.cookie(process.env.COOKIE_ACCESS_NAME || 'vms_access_token', result.token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: process.env.COOKIE_SAME_SITE || 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });
    
    return successResponse(res, { user: result.user });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message, statusCode);
  }
};
```

### 3.6. Routes

**File**: `backend/src/routes/auth.routes.js`

```javascript
import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateLogin } from '../validators/auth.validator.js';

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 *       429: { description: Account locked }
 */
router.post('/login', validateLogin, authController.login);

export default router;
```

### 3.7. Mount Routes

**File**: `backend/src/app.js` (hoặc `server.js`)

```javascript
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/v1/auth', authRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

export default app;
```

---

## Step 4: Frontend Implementation

### 4.1. Axios Client

**File**: `frontend/src/api/axiosApi.js`

```javascript
import axios from 'axios';

const axiosApi = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  withCredentials: true, // CRITICAL: Send cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

export default axiosApi;
```

### 4.2. Auth API

**File**: `frontend/src/api/authApi.js`

```javascript
import axiosApi from './axiosApi';

export const login = async (email, password) => {
  const response = await axiosApi.post('/auth/login', { email, password });
  return response.data;
};
```

### 4.3. Auth Context

**File**: `frontend/src/contexts/authContext.js`

```javascript
import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  const isAuthenticated = !!user;
  
  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 4.4. useAuth Hook

**File**: `frontend/src/hooks/useAuth.js`

```javascript
import { useContext } from 'react';
import { AuthContext } from '../contexts/authContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 4.5. Login Page

**File**: `frontend/src/pages/LoginPage.jsx`

```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await login(email, password);
      setUser(result.data.user);
      toast.success('Đăng nhập thành công');
      
      // Navigate theo role_id
      const roleRoutes = {
        1: '/volunteer/home',
        2: '/staff/events',
        3: '/manager/dashboard',
        4: '/admin/dashboard'
      };
      navigate(roleRoutes[result.data.user.role_id] || '/');
    } catch (error) {
      const message = error.response?.data?.error || 'Đăng nhập thất bại';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Đăng nhập</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Mật khẩu</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
```

---

## Step 5: Testing

### 5.1. Manual Testing

**Start Backend**:

```bash
cd backend
npm run dev
```

**Start Frontend**:

```bash
cd frontend
npm start
```

**Test Cases**:

1. ✅ Login với test user: `volunteer@test.com` / `Test123!`
2. ✅ Check cookie trong DevTools → Application → Cookies
3. ✅ Login với email sai → Verify 401 error message
4. ✅ Login với password sai 5 lần → Verify 429 lockout
5. ✅ Wait 15 minutes → Verify auto-unlock

### 5.2. Automated Tests

**File**: `backend/tests/integration/auth.test.js`

```javascript
import request from 'supertest';
import app from '../../src/app.js';

describe('POST /api/v1/auth/login', () => {
  it('should login successfully with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'volunteer@test.com', password: 'Test123!' });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('volunteer@test.com');
    expect(res.headers['set-cookie']).toBeDefined();
  });
  
  it('should return 401 with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'volunteer@test.com', password: 'WrongPassword' });
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Email hoặc mật khẩu không đúng');
  });
});
```

**Run Tests**:

```bash
cd backend
npm test
```

---

## Step 6: Deployment Checklist

### Production Environment Variables

```bash
# Backend .env (production)
NODE_ENV=production
PORT=5000
FRONTEND_ORIGIN=https://vms.com
DATABASE_URL=mysql://user:pass@prod-db:3306/vms
AUTH_SECRET=<STRONG_RANDOM_256_BIT_KEY>
COOKIE_SECURE=true
```

### Security Checklist

- [ ] AUTH_SECRET generated with crypto.randomBytes(32)
- [ ] COOKIE_SECURE=true in production
- [ ] HTTPS enabled on server
- [ ] Database uses SSL connection
- [ ] .env files in .gitignore
- [ ] No console.log with sensitive data

---

## Troubleshooting

### Issue: Cookie không được gửi từ Frontend

**Solution**: Check CORS và axios config:
- Backend: `credentials: true` in cors config
- Frontend: `withCredentials: true` in axios
- Frontend và Backend phải cùng domain (hoặc CORS allow credentials)

### Issue: JWT invalid khi validate

**Solution**: Check AUTH_SECRET match giữa sign và verify

### Issue: Account bị lock vĩnh viễn

**Solution**: Manual unlock trong database:
```sql
DELETE FROM login_attempts WHERE email = 'user@example.com';
```

---

**END OF QUICKSTART.MD**

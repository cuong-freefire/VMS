# quickstart.md — Quick Start Guide for UC03 Authentication Login

**Feature**: UC03-feat-auth-login  
**Owner**: Member 1 - CuongLH  
**Date**: 2026-07-11

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
- `react-hook-form` - Form handling
- `react-toastify` - Toast notifications
- `lucide-react` - Icons

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
DATABASE_URL="************************************/vms"

# JWT
SECRET_KEY=your-256-bit-secret-key-change-in-production
# Cookie name hardcoded as 'token' in jwt.util.js setTokenToCookie
# JWT expiresIn hardcoded as '7d' in jwt.util.js signAccessToken
```

**Generate SECRET_KEY** (secure random string):

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
    await prisma.role.upsert({ where: { name: role.name }, update: {}, create: role });
  }
  console.log('✅ Roles seeded successfully');
  if (process.env.NODE_ENV === 'development') {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('Test123!', 12);
    await prisma.user.upsert({
      where: { email: 'volunteer@test.com' },
      update: {},
      create: { email: 'volunteer@test.com', passwordHash: hashedPassword, fullName: 'Test Volunteer', roleId: 1, isActive: true, emailVerified: true }
    });
    console.log('✅ Test user created: volunteer@test.com / Test123!');
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
```

**Run seed**: `npx prisma db seed`

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
// Hàm dùng chung để ký và verify Token. (Tuyệt đối ko sửa đổi)

import jwt from 'jsonwebtoken';

// Hàm tạo accessToken.
export function signAccessToken(payload) {
    const SECRET = process.env.SECRET_KEY
    const option = {
        // expiresIn: '60s' //test 60s
        expiresIn: '7d'
    }
    const accessToken = jwt.sign(payload, SECRET, option)
    return accessToken
}

// Hàm verify token.
export function verifyAccessToken(token) {
    const SECRET = process.env.SECRET_KEY
    try {
        return jwt.verify(token, SECRET)
    }
    catch {
        return null // Token ko hợp lệ
    }
}

// Hàm set Token vào cookie
export function setTokenToCookie(res, token) {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
    })
}
```

**Production Notes:**

- Cookie name is hardcoded as `'token'` — not configurable via env
- Token expiry is hardcoded `'7d'` — not configurable via env
- `secure` flag depends on `NODE_ENV === "production"` — not a separate env var
- `verifyAccessToken` returns `null` on failure (never throws) — callers MUST check for null

#### Response Util

**File**: `backend/src/utils/response.util.js`

```javascript
// Cấu trúc response chung cho toàn dự án (Tuyệt đối ko sửa đổi)
/*
FAIL:
    return res.status(401).json(
    errorResponse('Email hoặc mật khẩu chưa chính xác.', 'UNAUTHORIZED')
    )
SUCCESS:
    return res.status(200).json(
    successResponse(user, 'Đăng nhập thành công')
    )
*/

export function errorResponse(message, code, details = null) {
    return {
        success: false,
        message,
        code,
        details
    };
}

export function successResponse(data, message = 'Success') {
    return {
        success: true,
        message,
        data
    }
}

// Hàm tạo error theo cấu trúc dành riêng cho service ném về lỗi.
export class ServiceError extends Error {
    constructor(message, status, code, details = null) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }
}
```

**Production Notes:**

- `errorResponse` signature: `(message, code, details)` — message first, code second
- `successResponse` signature: `(data, message)` — data first, message second
- `ServiceError` has `.status` (HTTP status code), `.code` (error code string), `.details` (extra payload)

### 3.2. Repository Layer

**File**: `backend/src/repositories/auth.repository.js`

```javascript
/**
 * Authentication Repository - Database operations for auth module
 * Owner: Member 1 (CuongLH)
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const findUserByEmail = async (email) => {
    return prisma.user.findUnique({
        where: { email },
        include: { role: true }
    });
};

const getLoginAttempts = async (email) => {
    return prisma.loginAttempt.findUnique({ where: { email } });
};

const incrementLoginAttempts = async (email) => {
    const existing = await prisma.loginAttempt.findUnique({ where: { email } });
    if (existing) {
        const newAttempts = existing.attempts + 1;
        const updateData = { attempts: newAttempts };
        if (newAttempts >= 5) {
            updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        }
        return prisma.loginAttempt.update({ where: { email }, data: updateData });
    } else {
        return prisma.loginAttempt.create({ data: { email, attempts: 1 } });
    }
};

const resetLoginAttempts = async (email) => {
    await prisma.loginAttempt.delete({ where: { email } }).catch(() => {});
};

const upsertSession = async (userId, jti, expiresAt) => {
    return prisma.userSession.upsert({
        where: { userId },
        create: { userId, jti, expiresAt },
        update: { jti, expiresAt, createdAt: new Date() }
    });
};

const getJtiByUserId = async (userId) => {
    const response = await prisma.userSession.findUnique({
        where: { userId }, select: { jti: true, expiresAt: true }
    })
    return { jti: response.jti, expiresAt: response.expiresAt };
}

const deleteSessionByUserId = async (userId) => {
    const response = await prisma.userSession.delete({
        where: { userId }, select: { jti: true, expiresAt: true }
    })
    return { jti: response.jti, expiresAt: response.expiresAt };
}

export default {
    findUserByEmail, getLoginAttempts, incrementLoginAttempts,
    resetLoginAttempts, upsertSession, getJtiByUserId, deleteSessionByUserId,
};
```

**Production Notes:**

- **Default export** (object), NOT named exports — import as `import authRepository from '../repositories/auth.repository.js'`
- Prisma fields use **camelCase**: `passwordHash`, `fullName`, `roleId`, `userId`, `isActive`, `emailVerified`, `createdAt`, `expiresAt`
- `findUserByEmail` includes `{ role: true }` — needed for `role_name` in JWT payload
- `upsertSession` updates `createdAt: new Date()` on each login

### 3.3. Service Layer

**File**: `backend/src/services/auth.service.js` (loginService only)

```javascript
import { signAccessToken } from "../utils/jwt.util.js";
import { ServiceError } from "../utils/response.util.js";
import bcrypt from "bcryptjs";
import authRepository from "../repositories/auth.repository.js";

/**
 * Login service - Authenticate user with email and password
 * Implements UC03: User Story 1
 * 
 * Business Logic Flow:
 * 1. Check account lockout (5 failed attempts in 15 minutes)
 * 2. Find user by email (case-insensitive)
 * 3. Verify password using bcrypt.compare()
 * 4. Check if account is active (soft delete)
 * 5. Check if email is verified
 * 6. Generate JWT with jti (Session ID) and role_name
 * 7. Upsert session to enforce Single Active Session
 * 8. Reset login attempts counter
 * 9. Return user data (without password_hash)
 * 
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<Object>} Object with token and user data
 * @throws {ServiceError} 401/403/429 errors
 */
async function loginService(email, password) {
    // 1. Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check lockout status first
    const loginAttempt = await authRepository.getLoginAttempts(normalizedEmail);
    if (loginAttempt && loginAttempt.lockedUntil) {
        const now = new Date();
        if (loginAttempt.lockedUntil > now) {
            throw new ServiceError(
                "Tài khoản tạm thời bị khóa do nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau 15 phút.",
                429,
                "ACCOUNT_LOCKED",
                { locked_until: loginAttempt.lockedUntil }
            );
        }
    }

    // 3. Find user by email
    const user = await authRepository.findUserByEmail(normalizedEmail);
    if (!user) {
        await authRepository.incrementLoginAttempts(normalizedEmail);
        throw new ServiceError(
            "Email hoặc mật khẩu chưa chính xác",
            401,
            "UNAUTHORIZED"
        );
    }

    // 4. Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        await authRepository.incrementLoginAttempts(normalizedEmail);
        throw new ServiceError(
            "Email hoặc mật khẩu chưa chính xác",
            401,
            "UNAUTHORIZED"
        );
    }

    // 5. Check if account is active (soft delete)
    if (!user.isActive) {
        throw new ServiceError(
            "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.",
            403,
            "ACCOUNT_DISABLED"
        );
    }

    // 6. Check if email is verified
    if (!user.emailVerified) {
        throw new ServiceError(
            "Email chưa được xác thực. Vui lòng kiểm tra hộp thư để xác thực tài khoản.",
            403,
            "EMAIL_NOT_VERIFIED"
        );
    }

    // 7. Generate JWT token with jti (Session ID) and role_name
    const jti = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const token = signAccessToken({
        user_id: user.id,
        email: user.email,
        role_id: user.roleId,
        role_name: user.role.name,
        jti
    });

    // 8. Upsert session (Single Active Session enforcement)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await authRepository.upsertSession(user.id, jti, expiresAt);

    // 9. Reset login attempts
    await authRepository.resetLoginAttempts(normalizedEmail);

    // 10. Return user data (without password_hash)
    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            full_name: user.fullName,
            role_id: user.roleId,
            role_name: user.role.name,
            avatar_url: user.avatarUrl,
            phone: user.phone,
            created_at: user.createdAt ? user.createdAt.toISOString() : null,
        }
    };
}

export default { loginService };
```

**Production Notes:**

- `ServiceError` constructor: `(message, status, code, details)` — status is HTTP code, code is error code string
- Error message: **"Email hoặc mật khẩu chưa chính xác"** (NOT "không đúng")
- JWT payload includes **`role_name`** from `user.role.name`
- jti format: `${user.id}-${Date.now()}-${Math.random()...}` — NOT uuid
- Lockout check happens BEFORE `findUserByEmail` — security best practice
- Password hash field: `user.passwordHash` (camelCase)

### 3.4. Validator + validate.js

**File**: `backend/src/middlewares/validators/auth.validator.js` (loginSchema only)

```javascript
import { z } from 'zod';

export const loginSchema = z.object({
    email: z
        .string('Email là bắt buộc')
        .email('Email không hợp lệ')
        .max(255, 'Email quá dài (tối đa 255 ký tự)')
        .toLowerCase()
        .trim(),
    password: z
        .string('Mật khẩu là bắt buộc')
        .min(1, 'Mật khẩu không được để trống'),
});
```

**File**: `backend/src/middlewares/validators/validate.js`

```javascript
/**
 * Shared Validation Middleware Factory
 * Pattern: validate(Schema)(req, res, next)
 * Owner: Member 1 - CuongLH
 */

/**
 * @param {z.ZodSchema} schema - Zod schema để validate req.body
 * @returns {Function} Express middleware
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const messages = result.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");

    return res.status(400).json({
      success: false,
      message: messages,
      code: "VALIDATION_ERROR",
    });
  }

  // Ghi đè req.body = dữ liệu đã parse + strip
  req.body = result.data;
  next();
};
```

**Production Notes:**

- `loginSchema` uses `.toLowerCase().trim()` — Zod transforms data
- `validate.js` uses `schema.safeParse()` (NOT `schema.parse()`)
- `validate.js` **overwrites** `req.body` with parsed data

### 3.5. Controller

**File**: `backend/src/controllers/auth.controller.js` (login function)

```javascript
import authService from "../services/auth.service.js";
import { setTokenToCookie } from "../utils/jwt.util.js";
import { errorResponse, successResponse } from "../utils/response.util.js";

export async function login(req, res) {
    try {
        const { email, password } = req.body;
        const { token, user } = await authService.loginService(email, password);

        // Set JWT in HttpOnly cookie
        setTokenToCookie(res, token);

        return res.status(200).json(successResponse(
            { user },
            'Đăng nhập thành công'
        ));
    } catch (error) {
        return res
            .status(error.status || 500)
            .json(
                errorResponse(
                    error.message,
                    error.code || "INTERNAL_SERVER_ERROR",
                    error.details
                )
            );
    }
}
```

**Production Notes:**

- Controller calls `setTokenToCookie(res, token)` BEFORE JSON response
- Error handler reads `error.status` (not `error.statusCode`), `error.code`, `error.details`
- Response data wraps user in `{ user }` — Frontend expects `res.data.user`

### 3.6. Routes

**File**: `backend/src/routes/auth.routes.js` (login route only)

```javascript
import { Router } from 'express';
import { login } from '../controllers/auth.controller.js';
import { loginSchema } from '../middlewares/validators/auth.validator.js';
import { validate } from '../middlewares/validators/validate.js';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Đăng nhập vào hệ thống
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       200: { description: Đăng nhập thành công }
 *       400: { description: VALIDATION_ERROR }
 *       401: { description: UNAUTHORIZED }
 *       403: { description: ACCOUNT_DISABLED / EMAIL_NOT_VERIFIED }
 *       429: { description: ACCOUNT_LOCKED }
 *       500: { description: INTERNAL_SERVER_ERROR }
 */
router.post('/login', validate(loginSchema), login);

export default router;
```

### 3.7. Auth Middleware

**File**: `backend/src/middlewares/auth.middleware.js`

```javascript
// Middleware để kiểm tra phiên đăng nhập hợp lệ. (Tuyệt đối ko sửa đổi)

import authRepository from "../repositories/auth.repository.js";
import { verifyAccessToken } from "../utils/jwt.util.js";
import { errorResponse } from "../utils/response.util.js";

export default async function authMiddleware(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json(
            errorResponse('Vui lòng đăng nhập.', 'UNAUTHORIZED')
        )
    }

    const decode = verifyAccessToken(token);
    const checkJti = decode?.jti;
    const userId = decode?.user_id;

    if (!decode || !checkJti || !userId) {
        return res.status(401).json(
            errorResponse('Phiên đăng nhập không hợp lệ.', 'TOKEN_INVALID')
        )
    }

    const session = await authRepository.getJtiByUserId(userId);
    const now = new Date();
    if (!session) {
        return res.status(401).json(
            errorResponse('Phiên đăng nhập không hợp lệ.', 'TOKEN_INVALID')
        )
    }

    const { jti: currentJti, expiresAt: currentExpiresAt } = session;

    if (currentExpiresAt && now > new Date(currentExpiresAt)) {
        await authRepository.deleteSessionByUserId(userId);
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
        return res.status(401).json(
            errorResponse('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 'SESSION_INVALID')
        );
    }

    if (checkJti !== currentJti) {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
        return res.status(401).json(
            errorResponse(
                'Tài khoản của bạn đã được đăng nhập trên một thiết bị khác.',
                'LOGGED_IN_ELSEWHERE'
            )
        );
    }

    req.user = decode;
    next();
}
```

**Production Notes:**

- `verifyAccessToken` returns `null` on failure — checked with `!decode`
- `LOGGED_IN_ELSEWHERE` code — unique for session conflict; Frontend can show dedicated popup
- `SESSION_INVALID` — expired session clears cookie + deletes DB record
- JTI comparison: `checkJti !== currentJti` detects Single Active Session violation
- Clears cookie on both expiry AND jti mismatch

### 3.8. Mount Routes in app.js

```javascript
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/api/v1/auth', authRoutes);

export default app;
```

---

## Step 4: Frontend Implementation

### 4.1. Axios Client

**File**: `frontend/src/api/axiosApi.js`

```javascript
// Nơi cấu hình axios và intercepter để xử lý lỗi theo status.

import axios from 'axios';

const axiosApi = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
    withCredentials: true, //Gắn cookie
    headers: { 'Content-Type': 'application/json' }
});

axiosApi.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message = error.response?.data?.message || error.message || 'An error occurred';
        const code = error.response?.data?.code || 'UNKNOWN_ERROR';
        const status = error.response?.status;
        const detail = error.response?.data?.detail || 'An error occurred';
        const pathName = window.location.pathname;
        const requestUrl = error.config?.url || '';
        const isGetMe = requestUrl.includes('/user/me') && error.config?.method === 'get';

        // Đây là nơi FE "hứng" và xử lý Status Code từ BE ném về
        if (status === 401 && pathName !== '/login' && !requestUrl.includes('logout') && !isGetMe) {
            window.location.href = '/login';
        }
        else if (status === 403) {
            window.location.href = '/403-unauthorized';
        }
        else if (status === 500) {
            const backendMessage = error.response?.data?.message || "Lỗi hệ thống";
            console.error("Hệ thống BE đang bị sập: ", backendMessage);
        }

        return Promise.reject({ message, code, status, detail });
    }
);

export default axiosApi;
```

**Production Notes:**

- Response interceptor unwraps: `(response) => response.data` — caller receives unwrapped data
- 401: skips redirect if on `/login`, calling `logout`, or `getMe` (initialization)
- 403: redirects to `/403-unauthorized`
- 500: logs to console (does NOT redirect)
- Rejected promise: `{ message, code, status, detail }`

### 4.2. Auth Service

**File**: `frontend/src/services/auth.service.js`

```javascript
import axiosApi from "../api/axiosApi";

export const authService = {
  async login(data) {
    return axiosApi.post('/api/v1/auth/login', data);
  },
  async logout() {
    return axiosApi.post('/api/v1/auth/logout');
  },
  async changePassword(data) {
    return axiosApi.post('/api/v1/auth/change-password', data);
  },
};
```

**Production Notes:**

- `login(data)` — `data` is `{ email, password }` from react-hook-form
- All endpoints use full path `/api/v1/auth/...` — baseURL does NOT include `/api/v1`

### 4.3. User Service (getMe)

**File**: `frontend/src/services/user.service.js`

```javascript
import axiosApi from "../api/axiosApi.js";

export const userService = {
  async getMe() {
    return axiosApi.get('/api/v1/user/me', {
      headers: { 'Cache-Control': 'no-cache' }
    });
  },
};
```

### 4.4. Roles Constants

**File**: `frontend/src/constants/roles.js`

```javascript
export const ROLES = {
  VOLUNTEER: 'VOLUNTEER',
  STAFF: 'STAFF',
  MANAGER: 'MANAGER',
  ADMIN: 'ADMIN',
};

export const roleRouteMap = {
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.VOLUNTEER]: '/home',
  [ROLES.STAFF]: '/staff/events',
  [ROLES.MANAGER]: '/manager/dashboard',
};
```

**Production Notes:**

- `roleRouteMap` uses computed keys `[ROLES.ADMIN]` etc.
- VOLUNTEER → `/home` (NOT `/volunteer/home`)
- Used by LoginPage: `roleRouteMap[userData.role_name]`

### 4.5. Auth Context

**File**: `frontend/src/contexts/authContext.context.js`

```javascript
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { userService } from "../services/user.service.js";
import { authService } from "../services/auth.service.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const initializeUser = useCallback(async () => {
    try {
      const res = await userService.getMe();
      const userData = res.data?.user || res.data;
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  const login = async (data) => {
    const res = await authService.login(data);
    const userData = res.data?.user || res.data;
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout API failed, clearing local state:", error.message);
    } finally {
      setUser(null);
    }
  };

  const updateUser = (data) => {
    setUser((prev) => ({ ...prev, ...data }));
  };

  const roleId = user?.role_id;
  const roleName = user?.role_name;

  const value = {
    user, loading, login, logout, updateUser,
    isAuthenticated: !!user,
    roleId, roleName,
    isVolunteer: roleName === 'VOLUNTEER',
    isStaff: roleName === 'STAFF',
    isManager: roleName === 'MANAGER',
    isAdmin: roleName === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return authContext;
}
```

**Production Notes:**

- File named `authContext.context.js` (NOT `authContext.js`)
- `createContext(null)` — initial null; `useAuth` checks for non-null
- `initializeUser` wrapped in `useCallback` — stable reference
- `login()` returns `userData` for post-login navigation
- `logout()` always clears local state in `finally`
- `user` fields use snake_case: `role_id`, `role_name` — matches backend
- Role helpers: `isVolunteer`, `isStaff`, `isManager`, `isAdmin`

### 4.6. Login Page

**File**: `frontend/src/components/pages/LoginPage.jsx`

```javascript
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail } from 'lucide-react';
import { useAuth } from '../../contexts/authContext.context';
import { roleRouteMap } from '../../constants/roles';
import FormInput from '../ui/FormInput';
import PasswordInput from '../ui/PasswordInput';
import Button from '../ui/Button';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register, handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: '', password: '' } });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const userData = await login(data);
      const from = location.state?.from || roleRouteMap[userData.role_name] || '/home';
      navigate(from, { replace: true });
    } catch (err) {
      const code = err?.code;
      const msg = err?.message || 'Đã xảy ra lỗi.';
      if (code === 'ACCOUNT_LOCKED') toast.warning(msg, { autoClose: 8000 });
      else toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 style={headerStyle}>Đăng nhập</h2>
      <p style={subHeaderStyle}>Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.</p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormInput label="Email" name="email" type="email" icon={Mail}
          register={register} rules={{ required: 'Vui lòng nhập email' }}
          placeholder="your@email.com" error={errors.email?.message} />
        <PasswordInput label="Mật khẩu" name="password"
          register={register} rules={{ required: 'Vui lòng nhập mật khẩu' }}
          placeholder="Nhập mật khẩu" error={errors.password?.message} />
        <div style={{ textAlign: 'right', marginBottom: 'var(--space-4)' }}>
          <Link to="/forgot-password" style={forgotLinkStyle}>Quên mật khẩu?</Link>
        </div>
        <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
          Đăng nhập
        </Button>
      </form>
      <p style={footerTextStyle}>
        Chưa có tài khoản?{' '}
        <Link to="/register" style={footerLinkStyle}>Đăng ký</Link>
      </p>
    </div>
  );
}

const headerStyle = {
  textAlign: 'center', fontSize: 'var(--font-size-body-large)',
  fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)',
  margin: '0 0 8px',
};
const subHeaderStyle = {
  textAlign: 'center', fontSize: 'var(--font-size-small)',
  color: 'var(--text-secondary)', margin: '0 0 var(--space-5)',
};
const forgotLinkStyle = {
  fontSize: 'var(--font-size-small)', color: 'var(--green-accent)', textDecoration: 'none',
};
const footerTextStyle = {
  textAlign: 'center', marginTop: 'var(--space-4)',
  fontSize: 'var(--font-size-small)', color: 'var(--text-secondary)',
};
const footerLinkStyle = {
  color: 'var(--green-accent)', fontWeight: 'var(--font-weight-semibold)', textDecoration: 'none',
};
```

**Production Notes:**

- Uses `react-hook-form` `useForm` (NOT manual useState)
- Custom components: `FormInput`, `PasswordInput`, `Button` from `../ui/`
- Navigation: `roleRouteMap[userData.role_name]` with fallback to `location.state?.from` then `/home`
- Toast: **`toast.warning`** for `ACCOUNT_LOCKED` (`autoClose: 8000`), **`toast.error`** for others
- `isSubmitting` state controls Button `loading` prop
- Styles use CSS custom properties: `var(--green-accent)`, `var(--space-4)`, etc.

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
2. ✅ Check cookie trong DevTools → Application → Cookies → `token` (HttpOnly)
3. ✅ Login với email sai → Verify 401 + "Email hoặc mật khẩu chưa chính xác"
4. ✅ Login với password sai 5 lần → Verify 429 + "ACCOUNT_LOCKED" + toast.warning
5. ✅ Login trên thiết bị khác → Verify 401 + "LOGGED_IN_ELSEWHERE" + auto-redirect
6. ✅ Wait 15 minutes → Verify auto-unlock (locked_until expires)
7. ✅ Login với tài khoản bị disable → Verify 403 + "ACCOUNT_DISABLED"
8. ✅ Login với email chưa verify → Verify 403 + "EMAIL_NOT_VERIFIED"

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
    expect(res.body.data.user.role_name).toBe('VOLUNTEER');
    expect(res.headers['set-cookie']).toBeDefined();
  });
  
  it('should return 401 with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'volunteer@test.com', password: 'WrongPassword' });
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Email hoặc mật khẩu chưa chính xác');
    expect(res.body.code).toBe('UNAUTHORIZED');
  });
  
  it('should return 400 with missing email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'Test123!' });
    
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
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
DATABASE_URL=******************************/vms
SECRET_KEY=<STRONG_RANDOM_256_BIT_KEY>
```

### Security Checklist

- [ ] SECRET_KEY generated with crypto.randomBytes(32)
- [ ] NODE_ENV=production (enables `secure` cookies in jwt.util.js setTokenToCookie)
- [ ] HTTPS enabled on server (required for Secure cookies)
- [ ] Database uses SSL connection
- [ ] .env files in .gitignore
- [ ] No console.log with sensitive data
- [ ] CORS origin restricted to production domain

---

## Architecture Summary

### Data Flow: Login Request

```text
Browser (LoginPage.jsx)
  │  react-hook-form useForm → handleSubmit(onSubmit)
  │  authContext.login({ email, password })
  ▼
authService.login(data)
  │  POST /api/v1/auth/login
  ▼
validate(loginSchema) middleware
  │  Zod safeParse → trim + toLowerCase
  ▼
auth.controller.js → login(req, res)
  │  authService.loginService(email, password)
  ▼
auth.service.js → loginService()
  │  1. Check lockout (login_attempts.locked_until)
  │  2. Find user (authRepository.findUserByEmail)
  │  3. Verify password (bcrypt.compare)
  │  4. Check isActive / emailVerified
  │  5. signAccessToken({ user_id, email, role_id, role_name, jti })
  │  6. upsertSession (Single Active Session enforcement)
  │  7. resetLoginAttempts
  │  → throw ServiceError on any failure
  ▼
Controller
  │  setTokenToCookie(res, token) → HttpOnly cookie
  │  successResponse({ user }, 'Đăng nhập thành công')
  ▼
Browser
  │  Axios interceptor unwraps response.data
  │  LoginPage sets userData, navigates via roleRouteMap
  ▼
AuthContext
  │  setUser(userData)
  │  isAuthenticated = true
```

### Key Error Codes

| HTTP | Code | Meaning | Frontend Handling |
|------|------|---------|-------------------|
| 400 | `VALIDATION_ERROR` | Zod validation failed | toast.error |
| 401 | `UNAUTHORIZED` | Wrong email or password | toast.error |
| 401 | `TOKEN_INVALID` | Malformed/expired JWT | Redirect to /login |
| 401 | `SESSION_INVALID` | Session record expired | Clear cookie, redirect |
| 401 | `LOGGED_IN_ELSEWHERE` | Another device logged in | Clear cookie, redirect |
| 403 | `ACCOUNT_DISABLED` | User is_active = false | toast.error |
| 403 | `EMAIL_NOT_VERIFIED` | Email not confirmed | toast.error |
| 429 | `ACCOUNT_LOCKED` | 5+ failed attempts | **toast.warning** (8s) |
| 500 | `INTERNAL_SERVER_ERROR` | Server crash | Console log, toast.error |

### File Dependency Map

```text
authContext.context.js
  ├── userService.getMe()        → user.service.js
  │     └── axiosApi.get()       → axiosApi.js
  ├── authService.login()        → auth.service.js
  │     └── axiosApi.post()      → axiosApi.js
  └── authService.logout()

LoginPage.jsx
  ├── useAuth()                  → authContext.context.js
  ├── roleRouteMap               → roles.js
  ├── FormInput, PasswordInput   → ui/FormInput, ui/PasswordInput
  └── useForm()                  → react-hook-form

auth.controller.js
  ├── authService.loginService() → auth.service.js
  │     ├── authRepository.*()   → auth.repository.js
  │     │     └── Prisma Client  → @prisma/client
  │     ├── ServiceError         → response.util.js
  │     └── signAccessToken()    → jwt.util.js
  └── setTokenToCookie()         → jwt.util.js

auth.middleware.js
  ├── verifyAccessToken()        → jwt.util.js
  ├── authRepository.getJtiByUserId()
  └── authRepository.deleteSessionByUserId()
```

---

## Troubleshooting

### Issue: Cookie không được gửi từ Frontend

**Solution**: Check CORS và axios config:

- Backend: `credentials: true` in cors config
- Frontend: `withCredentials: true` in axios
- Frontend và Backend phải cùng domain (hoặc CORS allow credentials)

### Issue: JWT invalid khi validate

**Solution**: Check SECRET_KEY match giữa sign và verify. `verifyAccessToken` returns `null` (never throws).

### Issue: LOGGED_IN_ELSEWHERE xuất hiện khi không mong muốn

**Cause**: JWT `jti` không khớp với session database. Thường xảy ra khi:

- Login trên thiết bị khác (Single Active Session enforcement)
- Token bị stale sau khi session bị upsert

**Solution**: Clear cookie và login lại.

### Issue: Account bị lock vĩnh viễn

**Solution**: Manual unlock trong database:

```sql
DELETE FROM login_attempts WHERE email = 'user@example.com';
```

---

**END OF QUICKSTART.MD**

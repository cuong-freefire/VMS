# data-model.md — Phase 1: Data Model for UC03 Authentication Login

**Feature**: UC03-feat-auth-login  
**Date**: 2026-06-29  
**Owner**: Member 1 - CuongLH

---

## Overview

UC03 Authentication Login sử dụng 4 database tables để implement secure login với Single Active Session và Account Lockout protection.

**Tables**:

1. `users` — User accounts (existing, defined in DATABASE.md)
2. `roles` — User roles (existing, seed data)
3. `user_sessions` — Single Active Session tracking (NEW)
4. `login_attempts` — Brute-force protection (NEW)

---

## Entity Relationship Diagram

```mermaid
erDiagram
    roles ||--o{ users : "has"
    users ||--o| user_sessions : "has one active"
    users ||--o| login_attempts : "tracks"
    
    roles {
        int id PK
        varchar name UK "VOLUNTEER, STAFF, MANAGER, ADMIN"
        varchar description
        timestamp created_at
    }
    
    users {
        int id PK
        varchar email UK "Login identifier"
        varchar password_hash "bcrypt, 12 rounds"
        varchar full_name
        varchar phone
        varchar avatar_url
        int role_id FK
        boolean is_active "Soft delete flag"
        boolean email_verified
        timestamp created_at
        timestamp updated_at
    }
    
    user_sessions {
        int id PK
        int user_id UK "One session per user"
        varchar jti "JWT ID for invalidation"
        timestamp expires_at "Auto-cleanup target"
        timestamp created_at
    }
    
    login_attempts {
        int id PK
        varchar email UK "Track by email, not user_id"
        int attempts "Failed count"
        timestamp locked_until "NULL = not locked"
        timestamp created_at
        timestamp updated_at
    }
```

---

## Table: `roles`

**Owner**: Member 1 - CuongLH  
**Purpose**: Định nghĩa các vai trò trong hệ thống  
**Soft Delete**: No (master data, rarely changes)  
**Source**: DATABASE.md Section 3.1

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Role ID |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL | Role name (VOLUNTEER, STAFF, MANAGER, ADMIN) |
| `description` | VARCHAR(255) | NULL | Role description |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### Indexes

- PRIMARY KEY (`id`)
- UNIQUE (`name`)

### Seed Data (Required)

```sql
INSERT INTO roles (name, description) VALUES
('VOLUNTEER', 'Tình nguyện viên tham gia sự kiện'),
('STAFF', 'Nhân viên quản lý sự kiện và xét duyệt'),
('MANAGER', 'Quản lý cấp trung, quản lý danh mục'),
('ADMIN', 'Quản trị viên hệ thống');
```

### Business Rules

1. `name` MUST be one of: VOLUNTEER, STAFF, MANAGER, ADMIN
2. CANNOT delete roles (no soft delete, no hard delete after seed)
3. Frontend routing logic depends on role names (exact match required)

---

## Table: `users`

**Owner**: Member 1 - CuongLH  
**Purpose**: Lưu trữ tài khoản người dùng  
**Soft Delete**: Yes (`is_active` flag)  
**Source**: DATABASE.md Section 3.1

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | User ID |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email đăng nhập (lowercase) |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hash (12 rounds) |
| `full_name` | VARCHAR(255) | NOT NULL | Họ tên đầy đủ |
| `phone` | VARCHAR(20) | NULL | Số điện thoại |
| `avatar_url` | VARCHAR(500) | NULL | Cloudinary URL |
| `role_id` | INT | FOREIGN KEY → roles.id, NOT NULL | Vai trò |
| `is_active` | BOOLEAN | DEFAULT TRUE, NOT NULL | Trạng thái hoạt động (soft delete) |
| `email_verified` | BOOLEAN | DEFAULT FALSE, NOT NULL | Email đã xác thực |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

### Indexes

- PRIMARY KEY (`id`)
- UNIQUE (`email`)
- INDEX (`role_id`)
- INDEX (`is_active`)
- INDEX (`email_verified`)

### Business Rules for UC03

1. **Login Eligibility**:
   - `is_active = TRUE` (MUST check before allow login)
   - `email_verified = TRUE` (MUST check before allow login, return 403 if false)

2. **Password Storage**:
   - MUST be bcrypt hashed with 12 salt rounds
   - NEVER store plaintext password
   - `password_hash` MUST NOT be returned in API responses

3. **Email Normalization**:
   - Store email in lowercase for case-insensitive lookup
   - Example: "<User@Example.COM>" → "<user@example.com>"

4. **Soft Delete**:
   - Set `is_active = FALSE` instead of DELETE
   - Preserve audit trail và foreign key references

### Validation Rules (Zod Schema)

```javascript
// Login validation (UC03 scope)
const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1) // Don't validate strength on login, only check existence
});
```

---

## Table: `user_sessions`

**Owner**: Member 1 - CuongLH  
**Purpose**: Single Active Session enforcement (JWT jti tracking)  
**Soft Delete**: No (auto-expire via TTL, cleanup job)  
**Source**: DATABASE.md Section 3.1

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Session ID |
| `user_id` | INT | **UNIQUE**, FOREIGN KEY → users.id, NOT NULL | User sở hữu session (1-to-1) |
| `jti` | VARCHAR(255) | NOT NULL | JWT ID (unique identifier per token) |
| `expires_at` | TIMESTAMP | NOT NULL | Session expiry time (7 days from creation) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Session creation timestamp |

### Indexes

- PRIMARY KEY (`id`)
- **UNIQUE (`user_id`)** ← CRITICAL: Enforce 1 session per user
- INDEX (`jti`) ← Fast lookup when validating JWT
- INDEX (`expires_at`) ← Cleanup job query optimization

### Business Rules

1. **Single Active Session**:
   - UNIQUE constraint on `user_id` ensures 1 user = 1 session max
   - When user login mới → UPSERT operation:

     ```sql
     INSERT INTO user_sessions (user_id, jti, expires_at)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE jti = VALUES(jti), expires_at = VALUES(expires_at), created_at = NOW()
     ```

   - Old `jti` bị ghi đè → Old JWT becomes invalid

2. **JWT Validation Flow**:

   ```
   1. Decode JWT → extract {user_id, jti}
   2. SELECT jti FROM user_sessions WHERE user_id = ?
   3. IF jti matches → Valid session
   4. IF jti mismatch → Invalid session (401 Unauthorized)
   5. IF no record → Invalid session (401 Unauthorized)
   ```

3. **Expiry & Cleanup**:
   - `expires_at` = `created_at` + 7 days (match JWT TTL)
   - Cron job xóa expired sessions: `DELETE FROM user_sessions WHERE expires_at < NOW()`
   - Run frequency: Every 1 hour (low priority, não critical)

4. **Session Revocation**:
   - Logout (UC05): DELETE FROM user_sessions WHERE user_id = ?
   - Force logout: DELETE session record

### State Transitions

```
[No Session] 
    ↓ Login (UC03)
[Active Session with jti_1]
    ↓ Login Again (UC03) - UPSERT
[Active Session with jti_2] ← jti_1 overwritten, old JWT invalid
    ↓ Token Expires (7 days)
[Expired Session] ← Cleanup job removes
    ↓
[No Session]
```

---

## Table: `login_attempts`

**Owner**: Member 1 - CuongLH  
**Purpose**: Account Lockout tracking (brute-force protection)  
**Soft Delete**: No (auto-expire via TTL logic)  
**Source**: DATABASE.md Section 3.1

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Attempt ID |
| `email` | VARCHAR(255) | **UNIQUE**, NOT NULL | Email đang bị track (lowercase) |
| `attempts` | INT | DEFAULT 0, NOT NULL | Số lần nhập sai liên tiếp |
| `locked_until` | TIMESTAMP | NULL | Thời điểm mở khóa (NULL = not locked) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | First failed attempt timestamp |
| `updated_at` | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last attempt timestamp |

### Indexes

- PRIMARY KEY (`id`)
- **UNIQUE (`email`)** ← One record per email
- INDEX (`locked_until`) ← Fast check for locked accounts

### Business Rules

1. **Tracking Logic**:
   - Track by `email`, NOT `user_id` (vì user có thể chưa tồn tại)
   - Email normalized to lowercase (match users.email format)

2. **Failed Attempt Flow**:

   ```
   IF password incorrect:
     IF login_attempts record exists:
       INCREMENT attempts
       IF attempts >= 5:
         SET locked_until = NOW() + INTERVAL 15 MINUTE
     ELSE:
       INSERT login_attempts (email, attempts = 1)
   ```

3. **Lockout Check** (Before password verify):

   ```
   SELECT locked_until FROM login_attempts WHERE email = ?
   IF locked_until > NOW():
     RETURN 429 "Account locked. Try again after {locked_until}"
   ```

4. **Successful Login**:

   ```
   DELETE FROM login_attempts WHERE email = ?
   -- OR --
   UPDATE login_attempts SET attempts = 0, locked_until = NULL WHERE email = ?
   ```

   Decision: **DELETE** approach (cleaner, record only exists when có failed attempts)

5. **Auto-Unlock**:
   - After 15 minutes: `locked_until < NOW()` → Account tự động unlocked
   - User thử login → Lockout check passes → Cho phép verify password

6. **Cleanup** (Optional):
   - Xóa old records (attempts = 0 AND updated_at < NOW() - 30 days)
   - Low priority, không critical cho UC03

### State Transitions

```
[No Record]
    ↓ 1st Failed Login
[attempts = 1, locked_until = NULL]
    ↓ 2nd-4th Failed Login
[attempts = 2-4, locked_until = NULL]
    ↓ 5th Failed Login
[attempts = 5, locked_until = NOW() + 15 min] ← LOCKED
    ↓ Wait 15 minutes
[locked_until < NOW()] ← Auto-unlocked
    ↓ Successful Login
[Record DELETED]
```

---

## Relationships Summary

### One-to-Many

**roles → users** (1:N)

- One role can be assigned to many users
- Foreign Key: `users.role_id` → `roles.id`
- ON DELETE: RESTRICT (cannot delete role if users exist)

### One-to-One

**users ↔ user_sessions** (1:0..1)

- One user has AT MOST one active session
- Foreign Key: `user_sessions.user_id` → `users.id`
- UNIQUE constraint on `user_id` enforces 1:1
- ON DELETE: CASCADE (delete session when user deleted)

### One-to-One (Loose)

**users ↔ login_attempts** (1:0..1)

- One user (identified by email) has AT MOST one lockout record
- NO foreign key (email may not exist in users yet)
- UNIQUE constraint on `email` enforces 1:1
- Record exists ONLY when failed attempts > 0

---

## Prisma Schema

```prisma
// Excerpt từ backend/prisma/schema.prisma

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

---

## Migration Strategy

### Migration Order

1. **Migration 001**: Create `roles` table + seed data (if not exists)
2. **Migration 002**: Create `users` table (if not exists)
3. **Migration 003**: Create `user_sessions` table (NEW for UC03)
4. **Migration 004**: Create `login_attempts` table (NEW for UC03)

### Migration Files

**File**: `backend/prisma/migrations/20260629_create_user_sessions/migration.sql`

```sql
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `jti` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_sessions_user_id_key` (`user_id`),
  KEY `user_sessions_jti_idx` (`jti`),
  KEY `user_sessions_expires_at_idx` (`expires_at`),
  CONSTRAINT `user_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**File**: `backend/prisma/migrations/20260629_create_login_attempts/migration.sql`

```sql
CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `attempts` INT NOT NULL DEFAULT 0,
  `locked_until` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `login_attempts_email_key` (`email`),
  KEY `login_attempts_locked_until_idx` (`locked_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Data Integrity Constraints

### Enforced by Database

✅ **UNIQUE(users.email)** — Prevent duplicate accounts

✅ **UNIQUE(user_sessions.user_id)** — Enforce Single Active Session

✅ **UNIQUE(login_attempts.email)** — One lockout record per email

✅ **FOREIGN KEY(user_sessions.user_id → users.id)** — Cascade delete sessions when user deleted

✅ **FOREIGN KEY(users.role_id → roles.id)** — Restrict role deletion

### Enforced by Application (Service Layer)

⚠️ **Soft delete check**: `users.is_active = TRUE` before login

⚠️ **Lockout check**: `locked_until < NOW()` before password verify

⚠️ **jti validation**: JWT jti must match `user_sessions.jti`

⚠️ **Email normalization**: Lowercase email before DB operations

---

## Query Patterns

### Login Flow Queries

```javascript
// 1. Check lockout
const lockout = await prisma.loginAttempts.findUnique({
  where: { email: normalizedEmail }
});

// 2. Find user
const user = await prisma.user.findUnique({
  where: { email: normalizedEmail },
  include: { role: true }
});

// 3. Verify password (bcrypt, not query)

// 4. Upsert session
await prisma.userSession.upsert({
  where: { user_id: user.id },
  create: { user_id: user.id, jti, expires_at },
  update: { jti, expires_at }
});

// 5. Delete login attempts
await prisma.loginAttempts.delete({
  where: { email: normalizedEmail }
});
```

### JWT Validation Query

```javascript
const session = await prisma.userSession.findUnique({
  where: { user_id: decodedJWT.user_id }
});

if (!session || session.jti !== decodedJWT.jti) {
  throw new Error('Invalid session');
}
```

---

## Performance Considerations

### Indexes Justification

| Index | Query Pattern | Impact |
|-------|--------------|--------|
| `users.email` UNIQUE | Login lookup by email | Essential (every login) |
| `users.role_id` INDEX | Join with roles table | Medium (every login for role info) |
| `users.is_active` INDEX | Filter active users | Low (small cardinality) |
| `user_sessions.user_id` UNIQUE | 1-to-1 enforcement + session lookup | Essential (every authenticated request) |
| `user_sessions.jti` INDEX | JWT validation | Essential (every authenticated request) |
| `user_sessions.expires_at` INDEX | Cleanup job query | Low (cron job only) |
| `login_attempts.email` UNIQUE | Lockout check | Essential (every login) |
| `login_attempts.locked_until` INDEX | Lockout expiry check | Medium (every login with failed attempts) |

### Query Performance Estimates

| Operation | Estimated Time | Frequency |
|-----------|---------------|-----------|
| Find user by email | ~5-10ms | Every login |
| Check lockout | ~5ms | Every login |
| Upsert session | ~10-15ms | Every login |
| Validate JWT jti | ~5ms | Every authenticated request |
| Cleanup expired sessions | ~50-100ms | Hourly cron job |

**Total Login Latency (DB only)**: ~30-40ms  
**Total Login + bcrypt**: ~280-290ms (acceptable per research.md)

---

**END OF DATA-MODEL.MD**

# Data Model: UC18 - View Profile

**Date**: 2026-06-30
**Owner**: CuongLH (Member 1 - Profile Management)

## Overview

Feature này truy xuất dữ liệu từ 3 bảng `users`, `user_skills` và `skills` với quan hệ nhiều-nhiều thông qua bảng trung gian. Theo `spec.md`, API response chỉ trả về dữ liệu hồ sơ đã được làm sạch và danh sách kỹ năng của chính người dùng đã xác thực.

## Database Schema

### Table: users

**Purpose**: Lưu thông tin tài khoản người dùng và dữ liệu hồ sơ nền tảng

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | User ID (internal) |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email đăng nhập |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password [NEVER EXPOSE] |
| full_name | VARCHAR(255) | NOT NULL | Họ tên đầy đủ |
| phone | VARCHAR(20) | NULL | Số điện thoại nguồn trong database; được map ra `phone_number` trong API response |
| avatar_url | VARCHAR(500) | NULL | Cloudinary URL |
| role_id | INT | FK → roles.id, NOT NULL | Vai trò [INTERNAL] |
| is_active | BOOLEAN | DEFAULT TRUE | Soft delete flag [INTERNAL] |
| email_verified | BOOLEAN | DEFAULT FALSE | Trạng thái verify [INTERNAL] |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | [INTERNAL] |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | [INTERNAL] |

**Indexes**:

- PRIMARY KEY (id)
- UNIQUE (email)
- INDEX (is_active)
- INDEX (email_verified)

---

### Table: skills

**Purpose**: Danh mục kỹ năng tình nguyện

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Skill ID |
| name | VARCHAR(255) | UNIQUE, NOT NULL | Tên kỹ năng |
| description | TEXT | NULL | Mô tả kỹ năng |
| is_active | BOOLEAN | DEFAULT TRUE | Soft delete flag |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | [INTERNAL] |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | [INTERNAL] |

**Indexes**:

- PRIMARY KEY (id)
- UNIQUE (name)
- INDEX (is_active)

---

### Table: user_skills (Junction Table)

**Purpose**: Quan hệ nhiều-nhiều giữa Users và Skills

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Link ID |
| user_id | INT | FK → users.id, NOT NULL | User reference |
| skill_id | INT | FK → skills.id, NOT NULL | Skill reference |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Thời gian đăng ký skill |

**Indexes**:

- PRIMARY KEY (id)
- UNIQUE (user_id, skill_id) — Ngăn duplicate
- INDEX (user_id) — Query by user
- INDEX (skill_id) — Query by skill

---

## Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ user_skills : "has"
    skills ||--o{ user_skills : "belongs to"

    users {
        int id PK
        string email UK
        string password_hash "NEVER_EXPOSE"
        string full_name
        string phone "nullable"
        string avatar_url "nullable"
        int role_id FK "INTERNAL"
        boolean is_active "INTERNAL"
        boolean email_verified "INTERNAL"
        timestamp created_at "INTERNAL"
        timestamp updated_at "INTERNAL"
    }
    
    skills {
        int id PK
        string name UK
        text description "nullable"
        boolean is_active
        timestamp created_at "INTERNAL"
        timestamp updated_at "INTERNAL"
    }
    
    user_skills {
        int id PK
        int user_id FK
        int skill_id FK
        timestamp created_at
    }
```

---

## Prisma Schema Definition

```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Role {
  id          Int      @id @default(autoincrement())
  name        String   @unique @db.VarChar(50)
  description String?  @db.VarChar(255)
  created_at  DateTime @default(now())
  
  users User[]
  
  @@map("roles")
}

model User {
  id             Int      @id @default(autoincrement())
  email          String   @unique @db.VarChar(255)
  password_hash  String   @db.VarChar(255)
  full_name      String   @db.VarChar(255)
  phone          String?  @db.VarChar(20)
  avatar_url     String?  @db.VarChar(500)
  role_id        Int
  is_active      Boolean  @default(true)
  email_verified Boolean  @default(false)
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt
  
  role        Role        @relation(fields: [role_id], references: [id])
  user_skills UserSkill[]
  
  @@index([is_active])
  @@index([email_verified])
  @@map("users")
}

model Skill {
  id          Int      @id @default(autoincrement())
  name        String   @unique @db.VarChar(255)
  description String?  @db.Text
  is_active   Boolean  @default(true)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  user_skills UserSkill[]
  
  @@index([is_active])
  @@map("skills")
}

model UserSkill {
  id         Int      @id @default(autoincrement())
  user_id    Int
  skill_id   Int
  created_at DateTime @default(now())
  
  user  User  @relation(fields: [user_id], references: [id])
  skill Skill @relation(fields: [skill_id], references: [id])
  
  @@unique([user_id, skill_id])
  @@index([user_id])
  @@index([skill_id])
  @@map("user_skills")
}
```

---

## Query Patterns

### Query 1: Get User Profile with Skills

**Repository Method**: `ProfileRepository.findUserWithSkills(userId)`

**Prisma Query**:

```javascript
const user = await prisma.user.findUnique({
  where: {
    id: userId
  },
  select: {
    id: true,
    full_name: true,
    email: true,
    phone: true,
    avatar_url: true,
    is_active: true,
    user_skills: {
      where: {
        skill: { is_active: true }
      },
      select: {
        skill: {
          select: {
            id: true,
            name: true
          }
        }
      }
    }
  }
});
```

**Raw SQL Equivalent** (for reference):

```sql
SELECT
  u.id,
  u.full_name,
  u.email,
  u.phone,
  u.avatar_url,
  u.is_active,
  s.id as skill_id,
  s.name as skill_name
FROM users u
LEFT JOIN user_skills us ON u.id = us.user_id
LEFT JOIN skills s ON us.skill_id = s.id AND s.is_active = true
WHERE u.id = ?;
```

**Result Structure** (raw từ Prisma):

```javascript
{
  id: 1,
  full_name: "Nguyễn Văn A",
  email: "<user@example.com>",
  phone: "0123456789",
  avatar_url: "<https://cloudinary.com/avatar.jpg>",
  is_active: true,
  user_skills: [
    { skill: { id: 1, name: "Giao tiếp" } },
    { skill: { id: 3, name: "Tiếng Anh" } },
    { skill: { id: 5, name: "Làm việc nhóm" } }
  ]
}
```

---

### Query 2: Find User by Email (for JWT payload lookup)

**Repository Method**: Không dùng trong final scope của UC18

**Prisma Query**:

```javascript
// Không áp dụng cho implementation cuối cùng.
// Theo context.md và spec.md, service phải lấy định danh người dùng
// từ JWT đã xác thực và dùng user_id đó để truy vấn trực tiếp.
```

**Purpose**: Đầu mục này chỉ được giữ lại để bảo toàn cấu trúc tài liệu; không phải truy vấn mục tiêu cho implementation cuối cùng.

**Business Rules**:

- Không dùng email từ client để truy xuất profile tự xem.
- Không triển khai lookup phụ nếu JWT đã cung cấp `user_id` hợp lệ.

---

## Data Transformation

### Step 1: Raw Prisma Result

```javascript
{
  id: 1,
  full_name: "Nguyễn Văn A",
  email: "<user@example.com>",
  phone: "0123456789",
  avatar_url: "<https://cloudinary.com/avatar.jpg>",
  is_active: true,
  user_skills: [
    { skill: { id: 1, name: "Giao tiếp" } },
    { skill: { id: 3, name: "Tiếng Anh" } }
  ]
}
```

### Step 2: Service Layer Transformation

```javascript
// ProfileService.getUserProfile() transforms:
{
  full_name: "Nguyễn Văn A",
  email: "<user@example.com>",
  phone_number: "0123456789",
  avatar_url: "<https://cloudinary.com/avatar.jpg>",
  skills: [
    { skill_id: 1, skill_name: "Giao tiếp" },
    { skill_id: 3, skill_name: "Tiếng Anh" }
  ]
}
```

**Transformation Logic**:

```javascript
const skills = user.user_skills.map(us => ({
  skill_id: us.skill.id,
  skill_name: us.skill.name
}));

if (!user.is_active) {
  throw new ServiceError("Tài khoản đã bị vô hiệu hóa", 403, "ACCOUNT_DISABLED");
}

return {
  full_name: user.full_name,
  email: user.email,
  phone_number: user.phone ?? null,
  avatar_url: user.avatar_url,
  skills
};
```

---

## Data Sanitization Rules

### ✅ ALLOWED Fields (trả về cho client)

- full_name: string
- email: string
- phone_number: string | null
- avatar_url: string | null
- skills: Array<{ skill_id: number, skill_name: string }>

### ❌ FORBIDDEN Fields (NEVER expose)

- id (user internal ID)
- password_hash (security critical)
- role_id (internal authorization)
- is_active (internal flag)
- email_verified (internal flag)
- created_at, updated_at (internal metadata)
- iat, exp (JWT metadata)

**Why use Prisma select**:

- Tự động loại bỏ forbidden fields ở database layer
- Type-safe: TypeScript sẽ báo lỗi nếu truy cập field không được select
- Performance: Chỉ query fields cần thiết

---

## Edge Cases Handling

### Case 1: User chưa có skill nào

**Query Result**:

```javascript
{
  id: 2,
  full_name: "Nguyễn Văn B",
  email: "<newuser@example.com>",
  phone: null,
  avatar_url: null,
  is_active: true,
  user_skills: []  // Empty array
}
```

**Service Output**:

```javascript
{
  full_name: "Nguyễn Văn B",
  email: "<newuser@example.com>",
  phone_number: null,
  avatar_url: null,
  skills: []  // Empty array (NOT null, NOT undefined)
}
```

**HTTP Response**: 200 OK (không phải lỗi)

---

### Case 2: User có phone = null

**Behavior**: Trả về `phone_number: null` trong response (không ẩn field)

**Rationale**: Frontend cần biết phone chưa được set để hiển thị prompt "Cập nhật số điện thoại"

---

### Case 3: User có skill bị soft delete (is_active = false)

**Query Filter**: skill: { is_active: true } → Prisma tự động loại bỏ

**Result**: Skills đã bị vô hiệu hóa KHÔNG xuất hiện trong response

---

### Case 4: User account bị disable (is_active = false)

**Query Result**: User được tìm thấy nhưng `is_active = false`

**Service Behavior**: Throw `ServiceError("Tài khoản đã bị vô hiệu hóa", 403, "ACCOUNT_DISABLED")`

---

## Migration Strategy

### Step 1: Initialize Prisma

```bash
npx prisma init
```

### Step 2: Configure DATABASE_URL

```env

# backend/.env

DATABASE_URL="mysql://user:password@localhost:3306/vms"
```

### Step 3: Create Prisma Schema

Copy schema từ section "Prisma Schema Definition" vào `backend/prisma/schema.prisma`

### Step 4: Introspect Existing Database (nếu DB đã có)

```bash
npx prisma db pull
```

### Step 5: Generate Prisma Client

```bash
npx prisma generate
```

### Step 6: Create Migration (nếu cần sync schema changes)

```bash
npx prisma migrate dev --name init_profile_tables
```

---

## Performance Optimization

### Query Optimization

- ✅ Use FindUnique với indexed column (id)
- ✅ Check `is_active` ngay trong service layer sau khi truy xuất user
- ✅ LEFT JOIN hoặc relation include thay vì N+1 queries
- ✅ Select only required fields (reduce data transfer)

### Potential Improvements

- 🔶 Add Redis cache cho profile data (TTL 5 minutes)
- 🔶 Add database read replica cho read-heavy operations
- 💡 Implement pagination cho skills (nếu user có >100 skills)

### Expected Performance

- **Query time**: < 50ms (với indexes)
- **Data transfer**: ~2KB per response
- **API response time**: < 300ms (including network, serialization)

---

**Data Model Status**: READY FOR IMPLEMENTATION
**Prisma Setup Required**: YES
**Breaking Changes**: NONE (read-only feature)

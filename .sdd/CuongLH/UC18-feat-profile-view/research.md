# Technical Research: UC18 - View Profile

**Date**: 2026-06-30
**Researcher**: CuongLH
**Status**: COMPLETED

## 1. Authentication Flow Analysis

### Current Implementation

**JWT Token Structure** (từ `auth.service.js`):

```javascript
const user = { email: '<user@example.com>', password: 'password123', name: 'Tèo' }
const token = signAccessToken(user)  // Payload = entire user object
```

**JWT Payload chứa**:

- `email`: string
- `password`: string (⚠️ SECURITY ISSUE - không được có trong token)
- `name`: string
- `iat`: number (issued at)
- `exp`: number (expires at)

**Auth Middleware Flow**:

1. Đọc token từ `req.cookies.token`
2. Verify với `verifyAccessToken(token)`
3. Inject decoded payload vào `req.user`
4. Return errors: `UNAUTHORIZED` (no token), `TOKEN_INVALID` (invalid/expired)

### Identified Issues

⚠️ **CRITICAL**: JWT payload hiện tại chứa password plaintext - vi phạm bảo mật nghiêm trọng

**Mitigation for UC18**:

- Theo `context.md` và `spec.md`, luồng cuối cùng của UC18 phải dùng `user_id` từ JWT đã xác thực.
- Trạng thái code hiện tại chưa đáp ứng yêu cầu đó vì payload chỉ có `email`, `password`, `name`.
- UC18 cần được xem là một feature có dependency vào việc chuẩn hóa JWT payload hoặc bổ sung bước ánh xạ an toàn trong tầng service.
- Tuyệt đối không dùng trực tiếp `password` từ token cho bất kỳ mục đích nào.

## 2. Database Schema Verification

### Existing Schema (từ DATABASE.md)

**Table: users**

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  avatar_url VARCHAR(500) NULL,
  role_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Table: skills**

```sql
CREATE TABLE skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Table: user_skills** (junction table)

```sql
CREATE TABLE user_skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  skill_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (skill_id) REFERENCES skills(id),
  UNIQUE KEY unique_user_skill (user_id, skill_id)
);
```

### Prisma Status

❌ **Prisma CHƯA được setup** trong backend

- File `backend/prisma/schema.prisma` không tồn tại
- Cần chạy: `npx prisma init` để khởi tạo
- Cần define models theo schema trên
- Cần tạo migration từ schema hiện có

## 3. Response Format Analysis

### Standard Response Utilities (từ `response.util.js`)

**Success Response**:

```javascript
{
  success: true,
  message: string,
  data: any
}
```

**Error Response**:

```javascript
{
  success: false,
  message: string,
  code: string,
  details: any | null
}
```

**ServiceError Class**:

```javascript
class ServiceError extends Error {
  constructor(message, status, code, details = null)
}
```

### Error Codes đã tồn tại

- `UNAUTHORIZED` - No token
- `TOKEN_INVALID` - Invalid/expired token

### Error Codes CẦN THÊM cho UC18

- `USER_NOT_FOUND` - User không tồn tại trong DB
- `ACCOUNT_DISABLED` - is_active = false

## 4. Query Strategy

### Option 1: Prisma ORM (RECOMMENDED - theo ADR-001)

```javascript
// ProfileRepository.findUserWithSkills(userId)
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

**Pros**:

- Type-safe queries
- Automatic sanitization (chỉ select fields cần thiết)
- Easy JOIN handling
- Migration management
- Tuân thủ ADR-001

**Cons**:

- Cần setup Prisma từ đầu (thêm effort)
- Learning curve nếu team chưa quen

### Option 2: Raw SQL với mysql2 (NOT RECOMMENDED)

```javascript
const [rows] = await db.query(\
  SELECT
    u.id, u.full_name, u.email, u.phone, u.avatar_url,
    u.is_active,
    s.id as skill_id, s.name as skill_name
  FROM users u
  LEFT JOIN user_skills us ON u.id = us.user_id
  LEFT JOIN skills s ON us.skill_id = s.id AND s.is_active = true
  WHERE u.id = ?
\, [userId]);
```

**Pros**:

- Không cần setup Prisma
- Nhanh hơn để prototype

**Cons**:

- Vi phạm ADR-001 (Prisma ORM only)
- Dễ SQL injection nếu không careful
- Khó maintain, test
- Manual data transformation

**DECISION**: Sử dụng Prisma ORM (Option 1) để tuân thủ constitution

## 5. Architecture Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant M as Auth Middleware
    participant Ctrl as ProfileController
    participant Svc as ProfileService
    participant Repo as ProfileRepository
    participant DB as MySQL

    C->>M: GET /api/v1/user/me<br/>(Cookie: token)
    M->>M: verifyAccessToken()
    alt Token invalid
        M->>Ctrl: req.user = {user_id, ...}
        Ctrl->>Svc: getUserProfile(req.user.user_id)
        Svc->>Repo: findUserWithSkills(userId)
        Repo->>DB: SELECT user + skills<br/>WHERE id = ?
        DB->>Repo: user + skills[]
        alt User not found
            Repo->>Svc: null
            Svc->>Ctrl: throw ServiceError<br/>USER_NOT_FOUND
            Ctrl->>C: 404 USER_NOT_FOUND
        else User found
            alt is_active = false
                Repo->>Svc: profile.is_active = false
                Svc->>Ctrl: throw ServiceError<br/>ACCOUNT_DISABLED
                Ctrl->>C: 403 ACCOUNT_DISABLED
            else Active user
                Repo->>Svc: raw profile data
                Svc->>Svc: transform skills array
                Svc->>Ctrl: profile object
                Ctrl->>C: 200 OK + profile
            end
        end
            end
        end

## 6. Data Sanitization Strategy

### Input (từ JWT token)

```javascript
req.user = {
  user_id: 1,
  iat: 1719763527,
  exp: 1719763587
}
```

### Processing (Repository)

```javascript
// Prisma select chỉ fields an toàn
const rawUser = {
  id: 1,
  full_name: "Nguyễn Văn A",
  email: "<user@example.com>",
  phone: "0123456789",
  avatar_url: "https://...",
  is_active: true,
  user_skills: [
    { skill: { id: 1, name: "Giao tiếp" } },
    { skill: { id: 3, name: "Tiếng Anh" } }
  ]
}
```

### Output (Service transformation)

```javascript
{
  full_name: "Nguyễn Văn A",
  email: "<user@example.com>",
  phone_number: "0123456789",
  avatar_url: "https://...",
  skills: [
    { skill_id: 1, skill_name: "Giao tiếp" },
    { skill_id: 3, skill_name: "Tiếng Anh" }
  ]
}
```

**NEVER EXPOSE**:

- id (internal)
- password_hash
- role_id (internal FK — `role_name` derived from Prisma relation is safe to expose)`n- is_active
- email_verified
- updated_at`n- JWT iat, exp

## 7. Risks & Blockers

### HIGH PRIORITY

1. **JWT Security Issue**: Token chứa plaintext password
   - **Impact**: Severe security vulnerability
   - **Mitigation**: Không fix trực tiếp trong UC18 nếu nằm ngoài scope module auth, nhưng PHẢI document và report
   - **Workaround**: Chỉ dùng như hiện trạng phân tích; contract cuối cùng của UC18 vẫn phải bám `context/spec`

2. **Prisma Setup Required**: Cần init toàn bộ Prisma
   - **Impact**: Thêm 2-4 giờ effort cho setup + migration
   - **Mitigation**: Theo plan chi tiết trong Phase 1
   - **Alternative**: Raw SQL (vi phạm constitution)

### MEDIUM PRIORITY

1. **Database State Unknown**: Chưa biết DB hiện tại có data không
   - **Impact**: Migration có thể fail nếu schema conflict
   - **Mitigation**: Dùng `prisma db pull` để introspect existing schema trước

2. **No Test Database**: Chưa có test DB riêng
   - **Impact**: Tests có thể pollute dev DB
   - **Mitigation**: Setup test DB với `DATABASE_URL_TEST` trong .env

## 8. Performance Considerations

### Query Complexity

- 1 query để lấy user info
- 1 LEFT JOIN để lấy skills
- Total: 1 query với JOIN (efficient)

### Expected Load

- Read-only operation
- No transactions needed
- Cacheable (user profile thay đổi không thường xuyên)

### Optimization Opportunities

- Add Redis cache cho profile data (TTL 5 minutes)
- Index already exists: users(is_active), skills(is_active)
- Prisma connection pooling

## 9. Recommendations

### Must Do

1. ✅ Setup Prisma với schema từ DATABASE.md
2. ✅ Tạo ProfileRepository với explicit select fields
3. ✅ Implement data sanitization ở Service layer
4. ✅ Add error codes: USER_NOT_FOUND, ACCOUNT_DISABLED
5. ✅ Write integration tests cho security scenarios

### Should Do

1. 🔶 Document JWT security issue cho team lead
2. 🔶 Chuẩn hóa JWT payload để chứa `user_id` theo đúng scope của UC18
3. 🔶 Setup test database riêng

### Nice to Have

1. 💡 Add request/response logging với Pino
2. 💡 Add performance monitoring (response time tracking)
3. 💡 Generate API documentation với Swagger

## 10. Next Steps

1. Review research này với team
2. Approve Prisma setup approach
3. Chốt strategy chuẩn hóa JWT payload để có `user_id`
4. Proceed to Phase 1: Design & Contracts
5. Create data-model.md với Prisma schema
6. Create API contracts và quickstart guide

---

**Research Completed**: 2026-06-30
**Ready for Phase 1**: YES
**Blockers**: NONE (documented mitigations)

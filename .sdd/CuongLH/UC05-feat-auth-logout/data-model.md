# Data Model: Đăng xuất (Logout) - UC05

**Feature**: UC05-feat-auth-logout  
**Date**: 2026-06-29  
**Status**: COMPLETE

## Overview

UC05 Logout **KHÔNG tạo entities mới**. Tính năng này chỉ interact với entities có sẵn trong VMS database để thực hiện logout operation.

---

## Existing Entities Used

### 1. User (Existing - Owned by Member 1)

**Source**: `DATABASE.md` Section 3.1 - Table `users`

**Usage trong UC05**: Đọc thông tin user từ JWT để validate session.

**Relevant Fields**:

| Field | Type | Usage |
|-------|------|-------|
| `id` | INT | User identifier từ JWT token |
| `email` | VARCHAR(255) | Display info (optional) |
| `full_name` | VARCHAR(255) | Display info (optional) |
| `role_id` | INT | Role info (optional) |
| `is_active` | BOOLEAN | Check user active status |

**Interactions**:
- ✅ **READ ONLY**: Middleware `authenticate()` đọc `user.id` từ JWT
- ❌ **NO WRITE**: Logout không modify user record

**Note**: Logout không cần query `users` table trực tiếp. JWT middleware đã handle việc đọc user info.

---

### 2. Session (Conceptual - Cookie-based)

**Source**: JWT token lưu trong httpOnly cookie

**Storage Location**: Browser cookie storage

**Structure** (JWT Payload):

```javascript
{
  userId: INT,          // From users.id
  email: STRING,        // From users.email
  role: STRING,         // From roles.name
  jti: STRING,          // JWT ID (optional, for single session enforcement)
  iat: TIMESTAMP,       // Issued at
  exp: TIMESTAMP        // Expires at (15 minutes from iat)
}
```

**Cookie Attributes**:

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `name` | `COOKIE_ACCESS_NAME` (env var, default: 'access_token') | Cookie identifier |
| `httpOnly` | `true` | Prevent JavaScript access (XSS protection) |
| `secure` | `true` (production only) | HTTPS only |
| `sameSite` | `'strict'` | CSRF protection |
| `maxAge` | `900000` ms (15 min) | Token lifetime |
| `path` | `/` | Available for all routes |

**Lifecycle**:
1. **Created**: On successful login (UC03)
2. **Validated**: On every authenticated request (middleware)
3. **Destroyed**: On logout (UC05) → Set `maxAge: 0`

---

### 3. UserSession (Existing - Optional, Owned by Member 1)

**Source**: `DATABASE.md` Section 3.1 - Table `user_sessions`

**Schema**:

```sql
CREATE TABLE user_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE,                    -- Single Active Session
  jti VARCHAR(255) NOT NULL,             -- JWT ID from token
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Usage trong UC05**: **KHÔNG SỬ DỤNG trong v1**

**Rationale**:
- Logout chỉ clear cookie phía client (Stateless JWT pattern)
- `user_sessions` record KHÔNG bị delete khi logout
- Record sẽ tự expire khi `expires_at < NOW()` (cleanup via cron job)
- Out of Scope theo research.md findings

**Future Enhancement (v2)**:
- Có thể DELETE `user_sessions` record khi logout để invalidate ngay lập tức
- Requires additional database operation → Tăng latency

---

## Data Flow Diagrams

### Logout Data Flow

```text
┌─────────────┐
│   Browser   │
│             │
│ Cookie:     │
│ access_token│
│ = <JWT>     │
└──────┬──────┘
       │
       │ [1] POST /api/v1/auth/logout
       │     Cookie: access_token=<JWT>
       ▼
┌──────────────────────────────────────┐
│         Backend API                  │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ auth.middleware.authenticate()  │ │ [OPTIONAL]
│  │                                 │ │
│  │ • Parse cookie                  │ │
│  │ • Verify JWT signature          │ │
│  │ • Extract userId                │ │
│  │ • Set req.user = { id, email }  │ │
│  └────────────┬───────────────────┘ │
│               │                      │
│               ▼                      │
│  ┌────────────────────────────────┐ │
│  │   auth.controller.logout()      │ │
│  │                                 │ │
│  │ • Call authService.logout()     │ │
│  │ • Set response cookie:          │ │
│  │   - name: 'access_token'        │ │
│  │   - value: ''                   │ │
│  │   - maxAge: 0                   │ │
│  │   - httpOnly, secure, sameSite  │ │
│  │ • Return 200 OK                 │ │
│  └────────────┬───────────────────┘ │
└───────────────┼──────────────────────┘
                │
                │ [2] Response
                │     200 OK
                │     Set-Cookie: access_token=; Max-Age=0
                ▼
         ┌─────────────┐
         │   Browser   │
         │             │
         │ Cookie:     │
         │ (CLEARED)   │
         └─────────────┘
```

### Frontend State Flow

```text
┌──────────────────────────────────────┐
│         AuthContext State            │
│                                      │
│  {                                   │
│    user: { id, email, name, role },  │
│    isAuthenticated: true             │
│  }                                   │
└──────────────┬───────────────────────┘
               │
               │ [1] User clicks "Đăng xuất"
               │
               ▼
┌──────────────────────────────────────┐
│      authContext.logout()            │
│                                      │
│  try {                               │
│    await authApi.logout(); ────────┐ │
│  } catch (error) {                 │ │
│    // Log error                    │ │
│  } finally {                       │ │
│    setUser(null); ◄────────────────┘ │ [3] Always clear
│    setIsAuthenticated(false);        │
│    navigate('/');                    │
│  }                                   │
└──────────────┬───────────────────────┘
               │
               │ [2] API call
               ▼
         (Backend Flow Above)
               │
               │ [4] Navigate
               ▼
┌──────────────────────────────────────┐
│      Landing Page                    │
│                                      │
│  Navigation Bar shows:               │
│  • "Đăng nhập" button               │
│  • "Đăng ký" button                 │
│  • (User info HIDDEN)               │
└──────────────────────────────────────┘
```

---

## State Transitions

### User Authentication State

```text
┌─────────────────┐
│  Unauthenticated│
│                 │
│  • No cookie    │
│  • user = null  │
└────────┬────────┘
         │
         │ [UC03] Login
         │
         ▼
┌─────────────────┐
│  Authenticated  │
│                 │
│  • Has cookie   │
│  • user = {...} │
└────────┬────────┘
         │
         │ [UC05] Logout
         │
         ▼
┌─────────────────┐
│  Unauthenticated│
│                 │
│  • No cookie    │
│  • user = null  │
└─────────────────┘
```

**Note**: 
- State là **one-way** cho logout (không có rollback)
- Logout là **idempotent**: Kết quả cuối cùng luôn là Unauthenticated

---

## Validation Rules

### Backend Validation

**None required** cho UC05 ✅

**Rationale**:
- Logout không nhận request body
- Logout không cần validate params
- Logout idempotent → Không cần check trạng thái hiện tại

**Edge Case Handling**:

| Case | Backend Behavior | Response |
|------|------------------|----------|
| User đã authenticated | Clear cookie | 200 OK |
| User chưa authenticated | Clear cookie anyway | 200 OK |
| Invalid JWT | Ignore, clear cookie | 200 OK |
| Expired JWT | Ignore, clear cookie | 200 OK |
| Missing cookie | Set Max-Age=0 anyway | 200 OK |

### Frontend Validation

**None required** ✅

**Rationale**:
- Logout button chỉ hiển thị khi `isAuthenticated = true`
- Double-click prevention qua `isLoggingOut` state

---

## Database Operations

### Logout Operation: ZERO Database Queries ✅

**Backend**:
- ❌ NO SELECT queries
- ❌ NO UPDATE queries
- ❌ NO DELETE queries
- ❌ NO INSERT queries

**Frontend**:
- ❌ NO database access (only API calls)

**Performance Impact**: 
- Database load: ZERO
- Response time: ~3ms (cookie operations only)
- Scalability: EXCELLENT (stateless)

---

## Data Integrity Constraints

### Constraint 1: Single Active Session (DATABASE.md)

**Table**: `user_sessions`

**Constraint**: `UNIQUE(user_id)`

**Impact on Logout**: NONE

**Rationale**: 
- Logout không delete `user_sessions` record
- Record tự expire qua `expires_at` timestamp
- Next login sẽ replace record (UPSERT)

### Constraint 2: HttpOnly Cookie

**Constraint**: Cookie chỉ access được từ server, không từ JavaScript

**Impact on Logout**: 
- Frontend KHÔNG THỂ đọc/xóa cookie trực tiếp
- PHẢI gọi backend API để clear cookie
- Backend set `Max-Age=0` để browser tự xóa

### Constraint 3: JWT Expiry

**Constraint**: Access token hết hạn sau 15 phút

**Impact on Logout**:
- Token vẫn valid cho đến khi hết hạn (security risk)
- Accepted risk cho v1 (research.md decision)
- Future: Token blacklist trong v2

---

## API Data Contracts

### Request Contract

```http
POST /api/v1/auth/logout
Headers:
  Cookie: access_token=<JWT>
Body: (empty)
```

**No request body required** ✅

### Response Contract (Success)

```http
Status: 200 OK
Headers:
  Set-Cookie: access_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/

Body:
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

### Response Contract (Always Success - Idempotent)

```http
Status: 200 OK (Always)
```

**No 401/403 responses** ✅

**Rationale**: Logout là idempotent operation (research.md decision)

---

## Security Data Considerations

### Data NOT Exposed

❌ KHÔNG expose trong response:
- JWT token content
- User ID
- Session ID
- Cookie values
- Expiry timestamps

### Data Cleared

✅ Cleared on logout:
- `access_token` cookie (browser)
- `user` object (Frontend AuthContext)
- `isAuthenticated` state (Frontend AuthContext)

### Data Retained

✅ KHÔNG clear (out of scope):
- `user_sessions` table record (expires naturally)
- User profile data trong database
- Login history/audit logs (nếu có)

---

## Performance Considerations

### Data Operation Complexity

| Operation | Complexity | Estimated Time |
|-----------|-----------|----------------|
| Parse cookie header | O(1) | < 1ms |
| Set response cookie | O(1) | < 1ms |
| JSON serialize response | O(1) | < 1ms |
| Clear Frontend context | O(1) | < 5ms |

**Total Backend Time**: ~3ms  
**Total Frontend Time**: ~5ms  
**Network Latency**: ~50-100ms

**Total End-to-End**: ~60-110ms ✅ (under 200ms target)

### Scalability Analysis

**Database Load**: ZERO queries → Scales infinitely ✅

**Server Load**: Minimal (cookie operations only) → Scales horizontally ✅

**Client Load**: Single API call + context update → Negligible ✅

---

## Migration Requirements

### Database Schema Changes

**NONE required** ✅

**Rationale**: Logout sử dụng existing tables, không tạo mới hoặc modify schema.

### Data Migration

**NONE required** ✅

---

## Testing Data Requirements

### Test Fixtures

**Backend Integration Tests**:

```javascript
// Mock JWT token
const validToken = jwt.sign(
  { userId: 1, email: 'test@vms.com', role: 'VOLUNTEER' },
  process.env.AUTH_SECRET,
  { expiresIn: '15m' }
);

// Test cases không cần database seeding
```

**Frontend Component Tests**:

```javascript
// Mock AuthContext
const mockAuthContext = {
  user: { id: 1, email: 'test@vms.com', name: 'Test User' },
  isAuthenticated: true,
  logout: jest.fn()
};

// Mock authApi
jest.mock('@/api/authApi', () => ({
  logout: jest.fn().mockResolvedValue({ success: true })
}));
```

**No database seeding required** ✅

---

## Summary

### Key Points

1. ✅ **No new entities**: Logout chỉ interact với existing User/Session entities
2. ✅ **No database operations**: Zero queries cho optimal performance
3. ✅ **Stateless design**: Cookie-based JWT, không persist logout event
4. ✅ **Idempotent operation**: Always return 200, an toàn với multiple calls
5. ✅ **Single Active Session**: Follow DATABASE.md design constraint

### Data Integrity Guarantees

- ✅ Cookie được clear atomically (browser operation)
- ✅ Frontend context cleared trong finally block (always execute)
- ✅ No partial state (transaction không cần thiết)
- ✅ No data loss risk (logout không delete persistent data)

### Non-Goals (Out of Scope)

- ❌ Delete `user_sessions` record
- ❌ Token blacklist implementation
- ❌ Audit log recording
- ❌ Multi-device session management

---

**Data Model Status**: ✅ COMPLETE  
**Schema Changes Required**: NONE  
**Ready for Implementation**: ✅ YES

**Next**: Generate `contracts/logout-api.md`

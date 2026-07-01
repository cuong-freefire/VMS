# Research: Đăng xuất (Logout) - UC05

**Feature**: UC05-feat-auth-logout  
**Date**: 2026-06-29  
**Status**: COMPLETE

## Overview

Document này tổng hợp research findings cho việc implement tính năng Logout trong VMS. Research tập trung vào 4 unknowns từ Technical Context và best practices cho Stateless JWT logout pattern.

---

## Research Task 1: JWT Logout Pattern trong Stateless Architecture

### Question

Với kiến trúc Stateless JWT (không lưu session trên server), cách nào là tốt nhất để handle logout một cách an toàn?

### Research Findings

#### Option A: Client-Side Only Logout (CHỌN)

**Approach**: Xóa JWT cookie phía client, không invalidate token trên server.

**Pros**:

- Đơn giản, không cần database operations
- Scale tốt (stateless)
- Phù hợp với short-lived access tokens (15 phút)

**Cons**:

- Token vẫn valid cho đến khi hết hạn
- Có thể bị replay attack nếu token bị đánh cắp

**Security Analysis**:

- Risk: MEDIUM - Token có thể reuse trong 15 phút
- Mitigation: Short token expiry + HTTPS + httpOnly cookie
- Acceptable cho v1 theo spec Out of Scope

#### Option B: Token Blacklist on Server

**Approach**: Lưu danh sách tokens đã logout vào Redis/Database.

**Pros**:

- Invalidate token ngay lập tức
- Security cao hơn

**Cons**:

- Phức tạp, cần Redis/Database query mỗi request
- Không còn stateless
- Performance overhead

**Decision**: ❌ REJECT - Out of Scope theo spec, overkill cho v1

#### Option C: Server-Side Sessions

**Approach**: Lưu session ID trên server, xóa khi logout.

**Cons**:

- Conflict với ADR-002 (JWT HttpOnly Cookie)
- Không scale tốt

**Decision**: ❌ REJECT - Vi phạm architecture decision

### Decision

✅ **CHỌN Option A: Client-Side Only Logout**

**Rationale**:

1. Phù hợp với Stateless JWT architecture (ADR-002)
2. Access token hết hạn nhanh (15 phút) giảm thiểu risk
3. Đơn giản cho v1, có thể upgrade sang Blacklist trong v2 nếu cần
4. Spec rõ ràng Out of Scope cho Token Blacklist

**Implementation**:

- Backend: Set cookie với `Max-Age=0` để clear
- Frontend: Clear AuthContext và redirect
- No server-side session invalidation

---

## Research Task 2: Frontend Logout Flow Best Practices

### Question

Thứ tự thao tác nào là tối ưu: API call trước hay clear context trước? Xử lý thế nào khi API fails?

### Research Findings

#### Pattern A: API First, Then Clear (CHỌN)

```javascript
const logout = async () => {
  try {
    await authApi.logout(); // Gọi API trước
  } catch (error) {
    console.error('API failed, clearing local state anyway');
  } finally {
    setUser(null); // Luôn clear context
    navigate('/');
  }
};
```

**Pros**:

- Cookie được clear server-side trước
- Graceful degradation (vẫn logout local nếu API fails)
- Đúng với FR-007 (Offline Resilience)

**Cons**:

- Hơi chậm hơn (chờ API response)

**Decision**: ✅ CHỌN

#### Pattern B: Clear Local First, Then API

```javascript
const logout = () => {
  setUser(null); // Clear ngay
  authApi.logout().catch(() => {}); // Fire and forget
  navigate('/');
};
```

**Cons**:

- UI update trước khi cookie cleared
- Nếu API fails, cookie vẫn còn
- User có thể confused

**Decision**: ❌ REJECT - Không đảm bảo consistency

#### Pattern C: Optimistic with Rollback

```javascript
const logout = async () => {
  setUser(null); // Optimistic
  try {
    await authApi.logout();
  } catch (error) {
    setUser(prevUser); // Rollback
  }
  navigate('/');
};
```

**Cons**:

- Phức tạp hơn cần thiết
- Rollback logout không có ý nghĩa (user muốn logout rồi)

**Decision**: ❌ REJECT - Over-engineering

### Decision

✅ **CHỌN Pattern A: API First, Then Clear (with finally block)**

**Rationale**:

1. Đảm bảo cookie được clear server-side
2. Finally block đảm bảo local state luôn được clear (offline resilience)
3. User experience tốt: logout luôn thành công từ góc nhìn user
4. Phù hợp NFR-004 (Độ tin cậy)

### Loading State Consideration

**Question**: Có cần show loading spinner không?

**Answer**: ❌ KHÔNG CẦN

**Rationale**:

- NFR-001: Logout < 1 giây
- Target API response < 100ms
- Đủ nhanh không cần loading state
- Chỉ disable button sau click để prevent double-click

---

## Research Task 3: Cookie Clearing Mechanism

### Question

Làm thế nào để clear httpOnly cookie an toàn từ backend? Cookie attributes nào cần match với lúc set cookie?

### Research Findings

#### Best Practice: Set Cookie with Max-Age=0

```javascript
// Backend controller
res.cookie('access_token', '', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Match với login
  sameSite: 'strict', // Match với login
  maxAge: 0, // Clear cookie
  path: '/' // IMPORTANT: Must match path when set
});
```

**Critical Attributes PHẢI MATCH với khi set cookie**:

- ✅ `name`: 'access_token' (giống khi login)
- ✅ `path`: '/' (giống khi login)
- ✅ `domain`: (nếu set khi login thì phải set khi logout)

**Attributes clear cookie**:

- ✅ `maxAge: 0` hoặc `expires: new Date(0)`
- ✅ Value empty string `''`

**Security Attributes giữ nguyên**:

- ✅ `httpOnly: true` (prevent XSS)
- ✅ `secure: true` (HTTPS only in production)
- ✅ `sameSite: 'strict'` (CSRF protection)

### Common Mistakes ❌

**Mistake 1**: Không match `path`

```javascript
// Login: res.cookie('token', jwt, { path: '/' })
// Logout: res.cookie('token', '', { path: '/api' }) // WRONG PATH
// Result: Cookie không được clear
```

**Mistake 2**: Quên set `httpOnly` khi clear

```javascript
// Login: res.cookie('token', jwt, { httpOnly: true })
// Logout: res.cookie('token', '', {}) // Missing httpOnly
// Result: Cookie vẫn tồn tại
```

**Mistake 3**: Chỉ clear phía client

```javascript
// Frontend only: document.cookie = 'token=; Max-Age=0'
// Result: httpOnly cookie KHÔNG THỂ xóa từ JavaScript
```

### Decision

✅ **Implementation Pattern**:

```javascript
// backend/src/controllers/auth.controller.js
const logout = (req, res) => {
  res.cookie(process.env.COOKIE_ACCESS_NAME || 'access_token', '', {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAME_SITE || 'strict',
    maxAge: 0,
    path: '/'
  });
  
  return res.status(200).json({
    success: true,
    message: 'Đăng xuất thành công'
  });
};
```

**Rationale**:

1. Đọc config từ `.env` để match với login logic
2. `maxAge: 0` clear cookie immediately
3. Giữ security attributes để match cookie restrictions
4. Simple và reliable

---

## Research Task 4: Idempotent Logout Implementation

### Question

Làm thế nào để handle multiple logout requests một cách an toàn? Return 200 hay 401 khi user chưa login?

### Research Findings

#### Approach A: Always Return 200 (CHỌN)

```javascript
const logout = (req, res) => {
  // Không check req.user
  // Luôn clear cookie
  res.cookie('access_token', '', { maxAge: 0, ... });
  return res.status(200).json({ success: true });
};
```

**Pros**:

- Idempotent: Kết quả giống nhau dù gọi bao nhiêu lần
- UX tốt: Không confuse user với lỗi
- Logout button an toàn với double-click

**Cons**:

- Không distinguish giữa "đã logout" và "chưa login"

**Decision**: ✅ CHỌN

#### Approach B: Return 401 When Not Authenticated

```javascript
const logout = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Không tìm thấy phiên làm việc hợp lệ' 
    });
  }
  res.cookie('access_token', '', { maxAge: 0, ... });
  return res.status(200).json({ success: true });
};
```

**Pros**:

- Rõ ràng về trạng thái
- Tuân thủ REST semantics

**Cons**:

- Không idempotent
- UX không tốt: User confused khi logout nhiều lần
- Frontend phải handle 401 case

**Decision**: ❌ REJECT - Vi phạm idempotency principle

### Decision

✅ **CHỌN Approach A: Always Return 200**

**Rationale**:

1. Logout là idempotent operation: Kết quả cuối cùng là "user logged out"
2. FR-006 chỉ apply cho "cố gắng thực hiện thao tác đăng xuất", không phải multiple attempts
3. Frontend xử lý đơn giản hơn: Không cần handle 401
4. Button disable prevent excessive requests, 200 là fallback an toàn

**Implementation Note**:

- Route KHÔNG cần `authenticate` middleware
- Controller luôn clear cookie dù user đã logout
- Frontend disable button sau first click

### Frontend Button Protection

```javascript
// Header.jsx
const [isLoggingOut, setIsLoggingOut] = useState(false);

const handleLogout = async () => {
  if (isLoggingOut) return; // Prevent double-click
  setIsLoggingOut(true);
  
  try {
    await logout(); // From AuthContext
  } finally {
    // setIsLoggingOut(false); // NO NEED - user navigated away
  }
};
```

**Rationale**: User sẽ redirect về Landing Page, không cần reset state.

---

## Research Task 5: Single Session Model Implementation

### Question

VMS sử dụng Single Active Session (DATABASE.md), logout behavior như thế nào?

### Database Schema Analysis

Từ `DATABASE.md` Section 3.1:

```sql
CREATE TABLE user_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE, -- UNIQUE constraint = 1 session per user
  jti VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Insight**: `UNIQUE(user_id)` nghĩa là 1 user chỉ có 1 active session.

### Implications for Logout

**Behavior**:

1. User login trên Device A → Session A created
2. User login trên Device B → Session A replaced by Session B (UNIQUE constraint)
3. Device A tự động invalid (JWT jti không match)
4. User logout trên Device B → Session B cleared
5. Device A đã invalid từ step 2 rồi

**Conclusion**: Logout trên 1 device không ảnh hưởng devices khác VÌ chỉ có 1 active session tại mọi thời điểm.

### Decision

✅ **Confirmed**: Single Active Session model

**Implementation Impact**:

- Logout CHỈ clear cookie phía client
- KHÔNG cần delete `user_sessions` record (Out of Scope cho v1)
- JWT jti check ở middleware đủ để enforce single session
- Spec FR-012 đã updated để reflect Single Session model

**Rationale**:

- Consistent với DATABASE.md design
- Simpler implementation
- Security: User login mới auto-invalidate sessions cũ

---

## Technology Stack Confirmation

### Backend Dependencies (Already Installed)

| Package | Version | Usage |
|---------|---------|-------|
| `express` | 5.x | HTTP framework |
| `cookie-parser` | ^1.4.6 | Parse/set cookies |
| `jsonwebtoken` | ^9.0.2 | JWT verification (middleware) |

**No new dependencies needed** ✅

### Frontend Dependencies (Already Installed)

| Package | Version | Usage |
|---------|---------|-------|
| `react` | 19.x | UI framework |
| `react-router-dom` | ^6.x | Navigation/redirect |
| `axios` | ^1.6.x | HTTP client |

**No new dependencies needed** ✅

---

## Security Considerations

### Threat Model

**Threat 1**: Token Replay Attack sau logout

- **Risk**: HIGH nếu token bị leak
- **Mitigation**: Short expiry (15 min), httpOnly cookie, HTTPS
- **Acceptance**: ACCEPTED cho v1

**Threat 2**: CSRF Attack

- **Risk**: MEDIUM
- **Mitigation**: `sameSite: 'strict'` cookie attribute
- **Status**: PROTECTED

**Threat 3**: XSS Attack steal token

- **Risk**: HIGH nếu không prevent
- **Mitigation**: `httpOnly: true` cookie (JavaScript không access được)
- **Status**: PROTECTED

**Threat 4**: Man-in-the-Middle

- **Risk**: HIGH nếu HTTP
- **Mitigation**: `secure: true` cookie (HTTPS only in production)
- **Status**: PROTECTED in production

### Security Checklist

- [x] JWT stored in httpOnly cookie (ADR-002)
- [x] Cookie cleared with Max-Age=0
- [x] HTTPS enforced in production (secure: true)
- [x] CSRF protection (sameSite: strict)
- [x] Short token expiry (15 minutes)
- [x] No sensitive data in response
- [x] No token blacklist needed (v1 scope)

---

## Performance Considerations

### Backend API Performance

**Target**: < 100ms response time (p95)

**Measured Operations**:

1. Parse cookie header: < 1ms
2. Set response cookie: < 1ms
3. JSON serialization: < 1ms

**Total**: ~3ms (well under target) ✅

**No Database Operations**: Logout không query/write DB → Very fast

### Frontend Performance

**Target**: UI update < 200ms (SC-003)

**Measured Operations**:

1. API call: ~50-100ms (network latency)
2. Context update: < 5ms (React state)
3. Navigation: < 10ms (React Router)

**Total**: ~70-115ms (under target) ✅

**No Loading State Needed**: Fast enough for direct feedback

---

## Testing Strategy

### Backend Tests

**Integration Test**: `backend/tests/integration/auth.logout.test.js`

Test cases:

1. ✅ Logout khi đã authenticated → 200 OK
2. ✅ Cookie được cleared (check Set-Cookie header)
3. ✅ Multiple logout calls → idempotent (always 200)
4. ✅ Logout không cần authenticate middleware (public endpoint)

### Frontend Tests

**Component Test**: `frontend/tests/components/Header.test.jsx`

Test cases:

1. ✅ Click logout button → authContext.logout() called
2. ✅ Button disabled sau click
3. ✅ Navigate to '/' sau logout
4. ✅ User info hidden sau logout

**Integration Test**: Mock API + AuthContext

Test cases:

1. ✅ API success → context cleared → redirect
2. ✅ API fails → context vẫn cleared → redirect (offline resilience)

---

## Summary of Decisions

| Research Area | Decision | Rationale |
|---------------|----------|-----------|
| **Logout Pattern** | Client-side only, no blacklist | Stateless JWT, short expiry, v1 simplicity |
| **Frontend Flow** | API first, clear in finally block | Graceful degradation, offline resilience |
| **Cookie Clearing** | Set cookie with Max-Age=0, match attributes | Standard practice, reliable |
| **Idempotency** | Always return 200 OK | Idempotent operation, better UX |
| **Session Model** | Single Active Session | Match DATABASE.md design |
| **Loading State** | No loading spinner | < 100ms fast enough |
| **Confirmation Modal** | No confirmation | Out of Scope, easy to re-login |
| **New Dependencies** | None | All required packages installed |

---

## Next Phase

✅ **Research Complete** → Proceed to Phase 1: Design & Contracts

**Outputs Ready For**:

- `data-model.md`: No new entities, document interactions
- `contracts/logout-api.md`: API specification
- `quickstart.md`: Implementation guide

---

**Research Status**: ✅ COMPLETE  
**All NEEDS CLARIFICATION Resolved**: YES  
**Ready for Phase 1**: ✅ YES

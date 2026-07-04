# research.md — Phase 0: Technical Research for UC03 Authentication Login

**Feature**: UC03-feat-auth-login  
**Date**: 2026-06-29  
**Researcher**: AI Agent (Member 1 - CuongLH context)

---

## Research Scope

Phase 0 research giải quyết các NEEDS CLARIFICATION từ Technical Context và chọn ra best practices cho technical decisions trong UC03.

### Research Questions

1. **Session Storage Strategy**: Database (MySQL) vs In-Memory (Redis) cho `user_sessions` table?
2. **Bcrypt Salt Rounds**: Tại sao chọn 12 rounds? Trade-off giữa security và performance?
3. **JWT TTL Strategy**: Single token 7 days vs Access Token (15min) + Refresh Token (7 days)?
4. **Account Lockout Strategy**: 5 attempts / 15 minutes có reasonable không? Industry best practices?
5. **HttpOnly Cookie Security**: Làm thế nào để secure cookies work với CORS và SameSite policies?

---

## Research 1: Session Storage Strategy

### Question

UC03 cần track `jti` (JWT ID) để enforce Single Active Session. Nên lưu `user_sessions` trong MySQL hay Redis?

### Options Investigated

#### Option A: MySQL `user_sessions` table (Current Plan)

**Pros**:

- Đơn giản, không thêm infrastructure dependency
- ACID compliance (transaction support)
- Đồng bộ với phần còn lại của database schema
- Dễ query và join với `users` table cho analytics
- Backup và recovery tự động cùng với main database

**Cons**:

- Slower read/write so với in-memory storage (~10-20ms per query)
- Database load tăng khi scale (mỗi authenticated request cần check jti)
- Không có built-in TTL, cần manual cleanup job (MySQL không tự động xóa các bản ghi hết hạn, phải tự tạo một tác vụ (job) để định kỳ xóa các bản ghi cũ.)

**Performance Estimate**:

- SELECT jti: ~10-15ms (với indexed user_id)
- UPSERT session: ~20-30ms
- Total login overhead: ~50ms

#### Option B: Redis in-memory storage

**Pros**:

- Cực nhanh (~1ms read/write)
- Built-in TTL (auto-expire sessions sau 7 ngày)
- Giảm database load đáng kể
- Industry standard cho session storage

**Cons**:

- Thêm Redis dependency (infrastructure complexity)
- Cần handle Redis unavailable case (fallback strategy)
- Data loss risk nếu Redis crash (mitigate bằng persistence config)
- Không có ACID transactions với MySQL

**Performance Estimate**:

- SELECT jti: <1ms
- SET session: <1ms
- Total login overhead: ~5ms

### Decision

**CHỌN Option A: MySQL `user_sessions` table cho UC03 MVP**

**Lý do**:

1. **KISS Principle(Luôn chọn giải pháp đơn giản nhất Keep it Simple)**: MySQL đủ cho MVP với expected load (~100-500 concurrent users). Không sử dụng với Redis.

2. **Đồng bộ**: Tất cả auth-related data (users, sessions, attempts) cùng 1 nơi, dễ maintain và query.

3. **Transaction Support**: Nếu cần wrap session upsert + other operations trong transaction, MySQL ACID compliance đảm bảo consistency.

4. **Lộ trình chuyển đổi rõ ràng**: Khi scale cần Redis, có thể migrate dễ dàng:
   - Đã tách riêng phần truy cập dữ liệu (AuthRepository), nên code xử lý nghiệp vụ không phụ thuộc vào MySQL hay Redis.
   - Chỉ cần thay lớp lưu trữ dữ liệu: đổi từ MySQLSessionRepo sang RedisSessionRepo
   - No business logic changes

**Khi nào cần đánh giá lại ?**:

- Khi có hơn 5.000 người dùng đang sử dụng hệ thống cùng lúc.
- Khi API đăng nhập phản hồi quá chậm, đa số người dùng phải chờ hơn 500ms mới nhận được kết quả.
- Khi việc kiểm tra session làm chậm các API đã đăng nhập, mỗi request phải tốn thêm hơn 50ms chỉ để xác thực session.

**Các phương án đã được xem xét (Alternatives considered)**:
Không chọn Redis vì nó làm hệ thống phức tạp hơn, trong khi quy mô hiện tại chưa đủ lớn để xứng đáng với sự phức tạp đó.

---

## Research 2: Bcrypt Salt Rounds

### Question

DATABASE.md spec yêu cầu bcrypt salt rounds = 12. Tại sao 12? Trade-off giữa security và performance?

### Technical Background

Bcrypt là adaptive hashing algorithm với cost factor (salt rounds). Mỗi khi tăng cost lên 1, số lần tính toán sẽ tăng gấp đôi.

**Công thức**: Time ≈ 2^rounds × base_time

- Time = Thời gian bcrypt mất để hash mật khẩu.
- 2^rounds = Hệ số tăng theo lũy thừa của 2.
- base_time = Thời gian cơ bản của một vòng tính toán trên máy hiện tại.

| Rounds | Iterations (lặp lại) | Approx Time (2026 hardware) | Security Level |
|--------|------------|----------------------------|----------------|
| 10 | 1,024 | ~65ms | Acceptable (minimum) |
| 11 | 2,048 | ~130ms | Good |
| 12 | 4,096 | ~250ms | Recommended (industry standard) |
| 13 | 8,192 | ~500ms | Strong |
| 14 | 16,384 | ~1000ms | Very Strong (overkill cho web apps) |

### Industry Best Practices (2026)

**OWASP Recommendation**: Minimum 10 rounds, 12 rounds recommended for web applications.

**Reasoning**:

- Hardware gets faster over time → Need higher rounds để counter brute-force
- 12 rounds = ~250ms hash time = acceptable cho login (infrequent operation)
- Balances security với UX (user không muốn wait >500ms khi login)

### Performance Impact Analysis

**Kịch bản**:

1. **User Login** (UC03):
   - Frequency: ~2-5 logins/user/week
   - Users: ~1,000 active users
   - Total logins/day: ~300-500
   - 250ms bcrypt time is ACCEPTABLE (login không thường xuyên)

2. **Password Change** (UC06):
   - Frequency: ~1 change/user/month
   - 250ms là không đáng kể

3. **Register** (UC04):
   - Frequency: ~10-20 new users/day (estimate)
   - 250ms is ACCEPTABLE

**Conclusion**: 250ms bcrypt time với 12 rounds **KHÔNG** gây ra bottleneck cho VMS use cases.

### Decision

**CHỌN 12 rounds (per DATABASE.md spec)**

**Rationale**:

1. **Industry Standard**: OWASP recommended, widely adopted by production systems
2. **Security First**: VMS stores sensitive volunteer data, cần strong password protection
3. **Performance Acceptable**: 250ms chỉ affect infrequent operations (login, register, password change)
4. **Future-Proof**: Hardware sẽ faster → 12 rounds sẽ không còn "slow" trong 2-3 năm

**Trade-off Accepted**:

- ~250ms added latency cho login API
- Total login time: bcrypt (250ms) + DB queries (50ms) + JWT sign (5ms) ≈ 305ms
- Still under 500ms threshold → ACCEPTABLE UX

**Alternatives Considered**:

- 10 rounds: Faster (65ms) nhưng weaker security → REJECTED
- 14 rounds: Stronger (1000ms) nhưng poor UX → REJECTED (overkill)

---

## Research 3: JWT TTL Strategy

### Question

SPEC Answer A1 chốt: "Access Token 7 ngày, KHÔNG dùng Refresh Token". Industry best practice có khác không?

### Industry Best Practices

**Standard Pattern**: Short-lived Access Token + Long-lived Refresh Token

| Token Type | TTL | Storage | Purpose |
|------------|-----|---------|---------|
| Access Token | 15min - 1 hour | HttpOnly Cookie | Authorize API requests |
| Refresh Token | 7-30 days | HttpOnly Cookie | Get new Access Token |

**Rationale**:

- Access Token bị leak → Chỉ valid trong 15-60 phút
- Refresh Token stored securely (HttpOnly) → Low leak risk
- Refresh Token rotation → Detect stolen tokens

### VMS Spec Decision Analysis

**VMS Choice**: Single Access Token, 7 days TTL, NO Refresh Token

**Risks**:

1. **Long-lived token**: Nếu JWT bị leak, attacker có 7 ngày để exploit
2. **No rotation**: Không có mechanism để detect stolen tokens

**Mitigations (Already in Spec)**:

1. **Single Active Session (jti tracking)**:
   - User login mới → jti cũ invalid
   - Attacker sử dụng stolen token → User login lại → Stolen token bị invalidate
   - This PARTIALLY mitigates long TTL risk

2. **HttpOnly Cookie + Secure + SameSite**:
   - Prevent XSS steal
   - Prevent CSRF
   - Lower leak risk so long TTL is more acceptable

### Decision

**GIỮ NGUYÊN SPEC: Single Token 7 days, NO Refresh Token**

**Rationale**:

1. **Spec Approved**: Answer A1 đã được chốt nghiệp vụ bởi stakeholder
2. **Simplicity**: Refresh Token thêm complexity:
   - 2 tokens cần manage (generate, validate, rotate)
   - Refresh endpoint logic
   - Token rotation state tracking
   - More attack surface

3. **Single Active Session Mitigates Risk**: jti tracking means:
   - User activity invalidates old tokens
   - Attacker cannot maintain long-term access nếu user còn active
   - Only dormant accounts (không login >7 days) có risk

4. **MVP Appropriate**: Cho MVP với ~1,000 users, single token pattern đủ. Refresh Token là optimization có thể add later.

**When to Re-evaluate**:

- Security audit phát hiện token theft incidents
- Compliance requirements (GDPR, SOC2) yêu cầu short-lived tokens
- User feedback về security concerns

**Trade-off Accepted**:

- Longer attack window (7 days vs 15 min) if token leaked
- Mitigated by: HttpOnly Cookie, jti tracking, reasonable scale

**Alternatives Considered**:

- Refresh Token pattern: Better security nhưng thêm complexity → DEFER to future enhancement

---

## Research 4: Account Lockout Strategy

### Question

SPEC US3: 5 failed attempts → 15 minutes lockout. Có reasonable không? Balancing security vs UX?

### Industry Standards

**OWASP Recommendation** (Authentication Cheat Sheet):

| Metric | Recommended Value | Reasoning |
|--------|------------------|-----------|
| Failed Attempts Threshold | 3-5 attempts | Too low = frustrated users, Too high = weak brute-force protection |
| Lockout Duration | 15-30 minutes | Enough để slow down automated attacks |
| Lockout Scope | Per account (email) | Prevent distributed attacks bypassing IP-based limits |

**Common Patterns**:

1. **Progressive Delay** (e.g., Google):
   - 1st fail: No delay
   - 2nd fail: 2 seconds
   - 3rd fail: 5 seconds
   - 4th fail: 10 seconds
   - 5th fail: 30 seconds
   - 6+ fails: 15 min lockout

2. **Fixed Lockout** (e.g., Microsoft):
   - 5 fails → 15 min lockout (simpler to implement)

### VMS Spec Analysis

**VMS Choice**: 5 attempts → 15 minutes lockout (Fixed pattern)

**Security Assessment**:

**Against Brute-Force**:

- Attacker speed: 5 attempts per 15 minutes = ~480 attempts/day
- Password space (assuming 8 chars, mixed case + numbers): ~2.8 trillion combinations
- Time to crack: 2.8T / 480 = ~16 million days = INFEASIBLE
- **Conclusion**: 5/15min strategy EFFECTIVELY prevents brute-force

**Against Targeted Attacks**:

- Smart attacker dùng common passwords (top 100)
- 5 attempts có thể test 5 passwords
- Risk: Medium nếu user dùng weak password
- **Mitigation**: Password strength validation ở Register (UC04 scope)

**UX Impact**:

**False Positive Scenarios**:

- User quên password, thử 5 lần sai → Locked 15 min
- User frequency: Ước tính ~1-2% users/month
- Mitigation: "Forgot Password" link (UC07)

**Verdict**: 15 min lockout is REASONABLE annoyance for security benefit

### Decision

**GIỮ NGUYÊN SPEC: 5 attempts / 15 minutes lockout**

**Rationale**:

1. **Industry Aligned**: Matches OWASP recommendations và common practice
2. **Security Effective**: Prevents brute-force (16 million days to crack)
3. **UX Acceptable**:
   - Most users nhập đúng password within 2-3 attempts
   - 5 attempts = generous buffer
   - 15 min recovery time = acceptable wait

4. **Simple to Implement**: Fixed lockout easier than progressive delay

**Trade-off Accepted**:

- Legitimate users bị lock occasionally (estimated 1-2%/month)
- Mitigated by: Forgot Password flow (UC07), Clear error messages

**Alternatives Considered**:

1. **Progressive Delay**: Better UX nhưng thêm complexity (track attempt timestamps, calculate delays) → REJECTED for MVP
2. **10 attempts**: Weaker security, longer attack window → REJECTED
3. **3 attempts**: Too strict, poor UX → REJECTED

**Enhancement Opportunities** (Out of scope UC03):

- CAPTCHA after 3 failed attempts (before lockout)
- Email notification when account locked
- Admin override to unlock account manually

---

## Research 5: HttpOnly Cookie Security

### Question

Làm thế nào HttpOnly Cookie work với CORS và SameSite policies? Config nào cần cho VMS?

### Technical Background

**Cookie Attributes**:

| Attribute | Purpose | Required for VMS |
|-----------|---------|-----------------|
| `httpOnly` | Prevent JavaScript access (anti-XSS) | ✅ YES (MANDATORY) |
| `secure` | Only send over HTTPS | ✅ YES (production), NO (dev localhost) |
| `sameSite` | CSRF protection | ✅ YES - `Lax` hoặc `Strict` |
| `domain` | Cookie scope | Optional (default: current domain) |
| `path` | Cookie path scope | Optional (default: `/`) |
| `maxAge` | Expiry time | ✅ YES - 7 days (604800 seconds) |

### CORS Configuration Requirements

**VMS Architecture**:

- Backend: `http://localhost:5000` (dev) / `https://api.vms.com` (prod)
- Frontend: `http://localhost:3000` (dev) / `https://vms.com` (prod)

**CORS Settings Needed**:

```javascript
// Backend: cors.config.js
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN, // http://localhost:3000 in dev
  credentials: true, // CRITICAL: Allow cookies to be sent cross-origin
  optionsSuccessStatus: 200
}));
```

**Frontend Axios Config**:

```javascript
// Frontend: axiosApi.js
axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  withCredentials: true, // CRITICAL: Send cookies with requests
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### SameSite Policy Analysis

**Options**:

| SameSite | Behavior | Use Case |
|----------|----------|----------|
| `None` | Cookie sent in ALL cross-site requests | Third-party integrations (e.g., OAuth) |
| `Lax` | Cookie sent in TOP-LEVEL navigations (GET only) | Most web apps (DEFAULT recommendation) |
| `Strict` | Cookie NEVER sent in cross-site requests | High security apps (poor UX for external links) |

**VMS Scenario**:

- Frontend và Backend cùng 1 domain (production): `vms.com` và `api.vms.com` = Same-site
- Dev environment: `localhost:3000` và `localhost:5000` = Same-site (ports khác nhau OK)

**Recommendation**: `SameSite=Lax`

**Rationale**:

- `Lax` prevents CSRF attacks (POST requests từ external sites bị block)
- `Lax` allows TOP-LEVEL GET navigation (user click link từ email → vms.com → cookie được gửi)
- `Strict` would break: User click "Verify Email" link → Cookie không gửi → User phải login lại = Poor UX

### Security Checklist

✅ **Set `httpOnly: true`** → Prevent XSS steal via `document.cookie`

✅ **Set `secure: true` (production)** → Prevent MITM attacks on HTTP

✅ **Set `sameSite: 'Lax'`** → Prevent CSRF, allow TOP-LEVEL navigation

✅ **Set `maxAge: 604800`** (7 days) → Auto-expire old cookies

✅ **Backend CORS `credentials: true`** → Accept cookies cross-origin (dev)

✅ **Frontend Axios `withCredentials: true`** → Send cookies with requests

### Decision

**Cookie Configuration cho UC03**:

```javascript
// Backend: auth.controller.js
res.cookie('vms_access_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // true in prod, false in dev
  sameSite: 'Lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/' // Available to all routes
});
```

**Environment Variables**:

```bash
# Backend .env
FRONTEND_ORIGIN=http://localhost:3000  # dev
FRONTEND_ORIGIN=https://vms.com        # prod
COOKIE_SECURE=false                    # dev
COOKIE_SECURE=true                     # prod
```

**Rationale**:

- **httpOnly**: MANDATORY per ADR-002, prevent XSS
- **secure**: Conditional (false in dev để test trên HTTP, true in prod)
- **sameSite Lax**: Balance security (CSRF protection) với UX (email links work)
- **maxAge 7 days**: Match JWT TTL per SPEC Answer A1

**Trade-off Accepted**:

- `Lax` vs `Strict`: Lax allows external top-level navigation (better UX, slightly lower security)
- Dev `secure: false`: Accept HTTP risk in localhost (no sensitive data in dev)

**Alternatives Considered**:

- `SameSite=Strict`: Stronger CSRF protection nhưng breaks email verification links → REJECTED
- `SameSite=None`: Required cho third-party cookies, NOT needed for VMS → REJECTED

---

## Summary: Research Decisions

| Research Topic | Decision | Rationale Summary |
|---------------|----------|-------------------|
| **Session Storage** | MySQL `user_sessions` table | KISS for MVP, migrate to Redis when scale needs (>5k users) |
| **Bcrypt Rounds** | 12 rounds (~250ms) | OWASP standard, security first, acceptable UX for infrequent operation |
| **JWT TTL Strategy** | Single token 7 days, NO Refresh | Spec approved, Single Active Session mitigates risk, simpler implementation |
| **Account Lockout** | 5 attempts / 15 min | Industry standard, effective brute-force prevention, reasonable UX |
| **Cookie Security** | httpOnly + secure (prod) + sameSite Lax | Prevent XSS/CSRF, allow email link navigation, CORS compatible |

---

## Next Steps (Phase 1)

Phase 0 research COMPLETE. Chuyển sang Phase 1: Design artifacts generation.

**Phase 1 Deliverables**:

1. `data-model.md` — Database entities, relationships, constraints
2. `contracts/auth-api.md` — API contract cho POST /api/v1/auth/login
3. `quickstart.md` — Setup guide cho developers implement UC03

**END OF RESEARCH.MD**

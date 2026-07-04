# API Contract: Logout Endpoint

**Feature**: UC05-feat-auth-logout  
**Version**: 1.0  
**Date**: 2026-06-29  
**Status**: APPROVED

---

## Endpoint Overview

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/auth/logout` |
| **Authentication** | Optional (idempotent design) |
| **Rate Limiting** | Standard rate limit (60 requests/minute) |
| **Idempotent** | ✅ YES |

---

## Request Specification

### HTTP Request

```http
POST /api/v1/auth/logout HTTP/1.1
Host: localhost:5000
Cookie: access_token=<JWT_TOKEN>
Content-Type: application/json
Content-Length: 0
```

### Headers

| Header | Required | Value | Description |
|--------|----------|-------|-------------|
| `Cookie` | Optional | `access_token=<JWT>` | JWT token in httpOnly cookie (set by login) |
| `Content-Type` | Yes | `application/json` | Response format |

### Request Body

**NONE** - Empty body ✅

```json
{}
```

**Rationale**: Logout không cần parameters. User identity đã có trong cookie.

---

## Response Specification

### Success Response (200 OK)

**Status Code**: `200 OK`

**Headers**:

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Set-Cookie: access_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/
```

**Body**:

```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

**Set-Cookie Details**:

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `name` | `access_token` | Cookie identifier |
| `value` | `` (empty) | Clear token |
| `HttpOnly` | `true` | Prevent JavaScript access |
| `Secure` | `true` | HTTPS only (production) |
| `SameSite` | `Strict` | CSRF protection |
| `Max-Age` | `0` | Immediate expiry |
| `Path` | `/` | Available for all routes |

### Idempotent Behavior

**All cases return 200 OK** ✅

| Scenario | Response | Rationale |
|----------|----------|-----------|
| User authenticated | 200 OK | Normal logout |
| User already logged out | 200 OK | Idempotent operation |
| Invalid JWT | 200 OK | Clear cookie anyway |
| Expired JWT | 200 OK | Clear cookie anyway |
| No cookie present | 200 OK | Already logged out |

**No 401/403 responses** - Logout luôn thành công.

---

## Error Responses

### Server Error (500)

**Scenario**: Internal server error (rare)

**Status Code**: `500 Internal Server Error`

**Body**:

```json
{
  "success": false,
  "message": "Lỗi hệ thống. Vui lòng thử lại sau.",
  "code": "INTERNAL_ERROR"
}
```

**Note**: Frontend vẫn phải clear local state trong trường hợp này (offline resilience).

---

## Backend Implementation Contract

### Route Definition

**File**: `backend/src/routes/auth.routes.js`

```javascript
import express from 'express';
import { logout } from '../controllers/auth.controller.js';

const router = express.Router();

// POST /api/v1/auth/logout
router.post('/logout', logout);

export default router;
```

**Note**: Không cần `authenticate` middleware (idempotent design).

### Controller Signature

**File**: `backend/src/controllers/auth.controller.js`

```javascript
/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Đăng xuất người dùng
 *     description: Clear JWT cookie và kết thúc phiên làm việc. Idempotent operation.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *         headers:
 *           Set-Cookie:
 *             description: Clear access_token cookie
 *             schema:
 *               type: string
 *               example: access_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Đăng xuất thành công
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Lỗi hệ thống. Vui lòng thử lại sau.
 */
export const logout = async (req, res) => {
  try {
    // Call service (minimal logic)
    const result = await authService.logout();
    
    // Clear cookie
    res.cookie(
      process.env.COOKIE_ACCESS_NAME || 'access_token',
      '',
      {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: process.env.COOKIE_SAME_SITE || 'strict',
        maxAge: 0,
        path: '/'
      }
    );
    
    // Return success
    return res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống. Vui lòng thử lại sau.',
      code: 'INTERNAL_ERROR'
    });
  }
};
```

### Service Signature

**File**: `backend/src/services/auth.service.js`

```javascript
/**
 * Logout user (minimal logic - stateless JWT)
 * @returns {Promise<Object>} Result object
 */
export const logout = async () => {
  // No database operations needed
  // Token will expire naturally (15 minutes)
  return { success: true };
};
```

**Note**: Service layer rất minimal vì logout không cần database operations.

---

## Frontend Implementation Contract

### API Client

**File**: `frontend/src/api/authApi.js`

```javascript
import axiosInstance from './axiosApi';

/**
 * Logout user
 * @returns {Promise<Object>} API response
 */
export const logout = async () => {
  const response = await axiosInstance.post('/auth/logout');
  return response.data;
};
```

### AuthContext Integration

**File**: `frontend/src/contexts/authContext.context.js`

```javascript
/**
 * Logout user - Clear cookie via API then clear local state
 */
const logout = async () => {
  try {
    // Step 1: Call API to clear server-side cookie
    await authApi.logout();
  } catch (error) {
    // Log error but continue (offline resilience)
    console.error('Logout API failed:', error);
  } finally {
    // Step 2: Always clear local state (FR-007)
    setUser(null);
    setIsAuthenticated(false);
    
    // Step 3: Redirect to landing page
    navigate('/');
  }
};
```

### Component Usage

**File**: `frontend/src/components/layouts/Header.jsx`

```javascript
import { useAuth } from '@/contexts/authContext.context';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent double-click
    
    setIsLoggingOut(true);
    await logout(); // Will navigate away, no need to reset state
  };
  
  return (
    <nav>
      {isAuthenticated && (
        <button 
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          Đăng xuất
        </button>
      )}
    </nav>
  );
};
```

---

## Security Considerations

### Cookie Security

✅ **HttpOnly**: Cookie không access được từ JavaScript (XSS protection)

✅ **Secure**: Cookie chỉ gửi qua HTTPS trong production (MITM protection)

✅ **SameSite=Strict**: Cookie không gửi trong cross-site requests (CSRF protection)

✅ **Short Expiry**: Access token hết hạn sau 15 phút (giảm thiểu replay attack)

### Accepted Security Trade-offs

⚠️ **Token vẫn valid sau logout**: Token không bị invalidate server-side cho đến khi hết hạn (15 phút).

**Mitigation**:
- Short token lifetime (15 minutes)
- HttpOnly cookie (không thể steal qua XSS)
- HTTPS only (không thể steal qua MITM)

**Decision**: Accepted risk cho v1 (Out of Scope: Token Blacklist)

---

## Performance Requirements

### Response Time Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **API Response Time (p95)** | < 100ms | Backend only |
| **End-to-End Logout** | < 1 second | User click → Landing Page |
| **UI Update** | < 200ms | Cookie cleared → Context updated |

### Load Testing Criteria

- ✅ 100 concurrent logout requests → All return 200 OK
- ✅ No database bottleneck (zero DB queries)
- ✅ No memory leaks

---

## Testing Contracts

### Backend Integration Test

**File**: `backend/tests/integration/auth.logout.test.js`

**Test Cases**:

```javascript
describe('POST /api/v1/auth/logout', () => {
  it('should return 200 and clear cookie when authenticated', async () => {
    // Setup: Create valid JWT
    const token = createValidJWT();
    
    // Execute
    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', `access_token=${token}`)
      .expect(200);
    
    // Assert
    expect(response.body.success).toBe(true);
    expect(response.headers['set-cookie'][0]).toContain('Max-Age=0');
  });
  
  it('should return 200 when no cookie (idempotent)', async () => {
    const response = await request(app)
      .post('/api/v1/auth/logout')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
  
  it('should return 200 when invalid JWT (idempotent)', async () => {
    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', 'access_token=invalid')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
  
  it('should clear cookie with correct attributes', async () => {
    const token = createValidJWT();
    
    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', `access_token=${token}`)
      .expect(200);
    
    const setCookie = response.headers['set-cookie'][0];
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Strict');
    expect(setCookie).toContain('Max-Age=0');
    expect(setCookie).toContain('Path=/');
  });
});
```

### Frontend Component Test

**File**: `frontend/tests/components/Header.test.jsx`

**Test Cases**:

```javascript
describe('Header Logout', () => {
  it('should call authContext.logout() when button clicked', async () => {
    const mockLogout = jest.fn();
    
    render(
      <AuthContext.Provider value={{ 
        isAuthenticated: true, 
        logout: mockLogout 
      }}>
        <Header />
      </AuthContext.Provider>
    );
    
    const logoutButton = screen.getByText('Đăng xuất');
    fireEvent.click(logoutButton);
    
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });
  
  it('should disable button after first click', async () => {
    render(<HeaderWithAuth />);
    
    const logoutButton = screen.getByText('Đăng xuất');
    fireEvent.click(logoutButton);
    
    expect(logoutButton).toBeDisabled();
  });
  
  it('should hide logout button when not authenticated', () => {
    render(
      <AuthContext.Provider value={{ isAuthenticated: false }}>
        <Header />
      </AuthContext.Provider>
    );
    
    expect(screen.queryByText('Đăng xuất')).not.toBeInTheDocument();
  });
});
```

---

## Validation Rules

### Request Validation

**NONE required** ✅

- No request body
- No path parameters
- No query parameters
- Cookie validation handled by browser

### Response Validation

**Backend**:
- ✅ Response body follows standard format (`success`, `message`)
- ✅ Set-Cookie header present with Max-Age=0
- ✅ Status code always 200 (except 500 server error)

**Frontend**:
- ✅ Check `response.data.success === true`
- ✅ Always clear context regardless of API response (finally block)

---

## Backwards Compatibility

### Breaking Changes

**NONE** ✅

**Rationale**: New endpoint, không modify existing endpoints.

### Deprecation Notice

**NONE** - This is a new feature.

---

## Monitoring & Logging

### Backend Logging

**Log Events**:

```javascript
// Success case (optional - low priority)
logger.info('User logged out', { 
  userId: req.user?.id || 'anonymous',
  timestamp: new Date().toISOString()
});

// Error case (mandatory)
logger.error('Logout error', {
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
});
```

**Do NOT log**:
- ❌ JWT token content
- ❌ Cookie values
- ❌ Session IDs

### Metrics

**Track**:
- ✅ Logout request count (per minute)
- ✅ Logout response time (p50, p95, p99)
- ✅ Logout error rate

**Alert Thresholds**:
- ⚠️ Error rate > 1%
- ⚠️ Response time p95 > 200ms

---

## API Versioning

**Current Version**: v1

**Path**: `/api/v1/auth/logout`

**Future Considerations (v2)**:
- Optional: Token blacklist support
- Optional: Logout from all devices
- Optional: Audit log recording

---

## Related APIs

| API | Relationship | Description |
|-----|--------------|-------------|
| `POST /api/v1/auth/login` | Creates session | Sets access_token cookie |
| `POST /api/v1/auth/register` | Creates user | User can login after registration |
| `GET /api/v1/auth/me` | Reads session | Returns current user info |

---

## Summary

### Key Points

1. ✅ **Idempotent**: Always return 200 OK
2. ✅ **Stateless**: No database operations
3. ✅ **Secure**: httpOnly + secure + sameSite cookie
4. ✅ **Fast**: < 100ms response time
5. ✅ **Resilient**: Frontend clears state even if API fails

### Contract Guarantees

- ✅ Cookie cleared with Max-Age=0
- ✅ Response follows standard format
- ✅ No sensitive data in response
- ✅ No breaking changes
- ✅ Backwards compatible

---

**Contract Status**: ✅ APPROVED  
**Ready for Implementation**: ✅ YES  
**Last Updated**: 2026-06-29

**Next**: Generate `quickstart.md`

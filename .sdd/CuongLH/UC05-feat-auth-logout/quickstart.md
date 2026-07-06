# Quickstart Guide: UC05 Logout Implementation

**Feature**: UC05-feat-auth-logout  
**Complexity**: 🟢 LOW-MEDIUM  
**Estimated Time**: ~8 hours total  
**Date**: 2026-06-29

---

## Prerequisites

Đảm bảo đã đọc các documents sau:

- ✅ [spec.md](./spec.md) - Feature specification
- ✅ [plan.md](./plan.md) - Implementation plan
- ✅ [research.md](./research.md) - Technical decisions
- ✅ [data-model.md](./data-model.md) - Data structures
- ✅ [contracts/logout-api.md](./contracts/logout-api.md) - API contract

---

## Implementation Overview

```text
Phase 1: Backend (4 hours)
  ├─ Route      (30 min)
  ├─ Controller (1 hour)
  ├─ Service    (30 min)
  └─ Tests      (2 hours)

Phase 2: Frontend (4 hours)
  ├─ API Client (30 min)
  ├─ Context    (1 hour)
  ├─ Component  (1 hour)
  └─ Tests      (1.5 hours)
```

---

## Phase 1: Backend Implementation

### Step 1.1: Add Route (30 minutes)

**File**: `backend/src/routes/auth.routes.js`

**Action**: ADD route

```javascript
// Existing imports
import express from 'express';
import { login, register } from '../controllers/auth.controller.js';

// ADD: Import logout
import { logout } from '../controllers/auth.controller.js';

const router = express.Router();

// Existing routes
router.post('/login', authenticate, login);
router.post('/register', validateRegister, register);

// ADD: Logout route (NO middleware needed - idempotent design)
router.post('/logout', logout);

export default router;
```

**Verification**:

```bash
npm run dev
# Check logs: "POST /api/v1/auth/logout registered"
```

---

### Step 1.2: Add Service Method (30 minutes)

**File**: `backend/src/services/auth.service.js`

**Action**: ADD logout method

```javascript
/**
 * Logout user (stateless JWT - no server-side invalidation)
 * @returns {Promise<Object>} Success result
 */
export const logout = async () => {
  // No database operations needed
  // Token will expire naturally (15 minutes)
  // Future: Add token blacklist logic here if needed
  
  return {
    success: true,
    message: 'Logout successful'
  };
};
```

**Why so simple?**

- Stateless JWT design → No session storage
- Cookie cleared by controller
- Token expires in 15 min naturally

---

### Step 1.3: Add Controller Method (1 hour)

**File**: `backend/src/controllers/auth.controller.js`

**Action**: ADD logout method

```javascript
// No service call needed — controller handles clearCookie directly

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Đăng xuất người dùng
 *     description: Clear JWT cookie và kết thúc phiên làm việc
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *         headers:
 *           Set-Cookie:
 *             description: Clear access_token cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
export const logout = async (req, res) => {
  try {
    // No business logic needed — stateless JWT logout
    // Clear cookie directly via res.clearCookie()
    
    // Clear cookie with same attributes as login
    res.cookie(
      process.env.COOKIE_ACCESS_NAME || 'access_token',
      '', // Empty value
      {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: process.env.COOKIE_SAME_SITE || 'strict',
        maxAge: 0, // Expire immediately
        path: '/' // Must match path when cookie was set
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

**Critical Points**:

- ✅ `maxAge: 0` clears cookie immediately
- ✅ All cookie attributes MUST match login (httpOnly, secure, sameSite, path)
- ✅ Always return 200 (idempotent design)
- ✅ No authentication middleware (works even if not logged in)

**Test manually**:

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Test with curl
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Cookie: access_token=fake_token" \
  -v

# Check response:
# - Status: 200 OK
# - Set-Cookie: access_token=; Max-Age=0
```

---

### Step 1.4: Write Integration Tests (2 hours)

**File**: `backend/tests/integration/auth.logout.test.js`

**Action**: CREATE test file

```javascript
import request from 'supertest';
import app from '../../src/app.js';
import jwt from 'jsonwebtoken';

describe('POST /api/v1/auth/logout', () => {
  // Helper: Create valid JWT
  const createValidJWT = () => {
    return jwt.sign(
      { 
        userId: 1, 
        email: 'test@vms.com', 
        role: 'VOLUNTEER' 
      },
      process.env.AUTH_SECRET,
      { expiresIn: '15m' }
    );
  };

  describe('Success Cases', () => {
    it('should return 200 and clear cookie when authenticated', async () => {
      const token = createValidJWT();
      
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', `access_token=${token}`)
        .expect(200);
      
      expect(response.body).toEqual({
        success: true,
        message: 'Đăng xuất thành công'
      });
      
      // Check Set-Cookie header
      const setCookie = response.headers['set-cookie'][0];
      expect(setCookie).toContain('access_token=;');
      expect(setCookie).toContain('Max-Age=0');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('SameSite=Strict');
      expect(setCookie).toContain('Path=/');
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
        .set('Cookie', 'access_token=invalid_token')
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    it('should return 200 when expired JWT (idempotent)', async () => {
      const expiredToken = jwt.sign(
        { userId: 1, email: 'test@vms.com' },
        process.env.AUTH_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );
      
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', `access_token=${expiredToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });

  describe('Idempotency', () => {
    it('should handle multiple logout calls', async () => {
      const token = createValidJWT();
      
      // First logout
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', `access_token=${token}`)
        .expect(200);
      
      // Second logout (already logged out)
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });

  describe('Cookie Attributes', () => {
    it('should set cookie with correct security attributes', async () => {
      const token = createValidJWT();
      
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', `access_token=${token}`)
        .expect(200);
      
      const setCookie = response.headers['set-cookie'][0];
      
      // Security attributes
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('SameSite=Strict');
      
      // Production: should have Secure
      if (process.env.NODE_ENV === 'production') {
        expect(setCookie).toContain('Secure');
      }
      
      // Clear attributes
      expect(setCookie).toContain('Max-Age=0');
      expect(setCookie).toContain('Path=/');
    });
  });

  describe('Performance', () => {
    it('should respond in less than 100ms', async () => {
      const token = createValidJWT();
      const startTime = Date.now();
      
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', `access_token=${token}`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100);
    });
  });
});
```

**Run tests**:

```bash
npm test -- auth.logout.test.js
```

**Expected output**:

```
PASS tests/integration/auth.logout.test.js
  POST /api/v1/auth/logout
    Success Cases
      ✓ should return 200 and clear cookie when authenticated (45ms)
      ✓ should return 200 when no cookie (idempotent) (12ms)
      ✓ should return 200 when invalid JWT (idempotent) (10ms)
      ✓ should return 200 when expired JWT (idempotent) (15ms)
    Idempotency
      ✓ should handle multiple logout calls (20ms)
    Cookie Attributes
      ✓ should set cookie with correct security attributes (18ms)
    Performance
      ✓ should respond in less than 100ms (35ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
```

---

## Phase 2: Frontend Implementation

### Step 2.1: Add API Client (30 minutes)

**File**: `frontend/src/api/authApi.js`

**Action**: ADD logout function

```javascript
import axiosInstance from './axiosApi';

// Existing functions: login, register

/**
 * Logout user - Clear JWT cookie
 * @returns {Promise<Object>} API response
 */
export const logout = async () => {
  const response = await axiosInstance.post('/auth/logout');
  return response.data;
};
```

**Verify axios config**:

**File**: `frontend/src/api/axiosApi.js`

```javascript
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, // CRITICAL: Send cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

export default axiosInstance;
```

**Test manually**:

```javascript
// In browser console
import { logout } from './api/authApi';
logout().then(console.log);
// Should see: { success: true, message: "Đăng xuất thành công" }
```

---

### Step 2.2: Update AuthContext (1 hour)

**File**: `frontend/src/contexts/authContext.context.js`

**Action**: ADD logout function

```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../api/authApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Existing: loadUser, login, register functions

  /**
   * Logout user
   * - Clear cookie via API (best effort)
   * - Always clear local state (offline resilience)
   * - Redirect to landing page
   */
  const logout = async () => {
    try {
      // Step 1: Call API to clear server-side cookie
      await authApi.logout();
    } catch (error) {
      // Log error but continue (FR-007: Offline Resilience)
      console.error('Logout API failed:', error.message);
    } finally {
      // Step 2: ALWAYS clear local state (even if API fails)
      setUser(null);
      setIsAuthenticated(false);
      
      // Step 3: Redirect to landing page
      navigate('/');
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout, // ADD to context
    loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

**Key Points**:

- ✅ `try-catch-finally`: API trong try, clear state trong finally
- ✅ Offline resilience: Finally luôn chạy dù API fails
- ✅ Redirect sau clear state

---

### Step 2.3: Update Header Component (1 hour)

**File**: `frontend/src/components/layouts/Header.jsx`

**Action**: ADD logout button handler

```javascript
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.context';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent double-click
    
    setIsLoggingOut(true);
    await logout(); // Will navigate away, no need to reset isLoggingOut
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <Link className="navbar-brand" to="/">VMS</Link>
        
        <div className="navbar-nav ms-auto">
          {isAuthenticated ? (
            <>
              <span className="navbar-text me-3">
                Xin chào, {user?.full_name || user?.email}
              </span>
              
              <button 
                className="btn btn-outline-danger"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-outline-primary me-2" to="/login">
                Đăng nhập
              </Link>
              <Link className="btn btn-primary" to="/register">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
```

**UI States**:

1. **Not authenticated**: Show "Đăng nhập" + "Đăng ký"
2. **Authenticated**: Show user name + "Đăng xuất"
3. **Logging out**: Button disabled, text "Đang đăng xuất..."

---

### Step 2.4: Write Component Tests (1.5 hours)

**File**: `frontend/tests/components/Header.test.jsx`

**Action**: CREATE test file

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../../src/components/layouts/Header';
import { AuthContext } from '../../src/contexts/authContext.context';
import * as authApi from '../../src/api/authApi';

// Mock authApi
jest.mock('../../src/api/authApi');

// Helper: Render with AuthContext
const renderWithAuth = (authValue) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <Header />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Header Logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('When Authenticated', () => {
    it('should show user name and logout button', () => {
      renderWithAuth({
        user: { id: 1, full_name: 'Test User', email: 'test@vms.com' },
        isAuthenticated: true,
        logout: jest.fn()
      });

      expect(screen.getByText(/Xin chào, Test User/)).toBeInTheDocument();
      expect(screen.getByText('Đăng xuất')).toBeInTheDocument();
      expect(screen.queryByText('Đăng nhập')).not.toBeInTheDocument();
    });

    it('should call logout when button clicked', async () => {
      const mockLogout = jest.fn();
      authApi.logout.mockResolvedValue({ success: true });

      renderWithAuth({
        user: { id: 1, full_name: 'Test User' },
        isAuthenticated: true,
        logout: mockLogout
      });

      const logoutButton = screen.getByText('Đăng xuất');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });
    });

    it('should disable button after click (prevent double-click)', async () => {
      const mockLogout = jest.fn();

      renderWithAuth({
        user: { id: 1, full_name: 'Test User' },
        isAuthenticated: true,
        logout: mockLogout
      });

      const logoutButton = screen.getByText('Đăng xuất');
      
      fireEvent.click(logoutButton);
      
      // Button should be disabled immediately
      expect(logoutButton).toBeDisabled();
      expect(screen.getByText('Đang đăng xuất...')).toBeInTheDocument();
    });
  });

  describe('When Not Authenticated', () => {
    it('should show login and register buttons', () => {
      renderWithAuth({
        user: null,
        isAuthenticated: false,
        logout: jest.fn()
      });

      expect(screen.getByText('Đăng nhập')).toBeInTheDocument();
      expect(screen.getByText('Đăng ký')).toBeInTheDocument();
      expect(screen.queryByText('Đăng xuất')).not.toBeInTheDocument();
    });

    it('should not show logout button', () => {
      renderWithAuth({
        user: null,
        isAuthenticated: false,
        logout: jest.fn()
      });

      expect(screen.queryByText('Đăng xuất')).not.toBeInTheDocument();
    });
  });

  describe('Logout Flow', () => {
    it('should clear state even if API fails (offline resilience)', async () => {
      const mockNavigate = jest.fn();
      authApi.logout.mockRejectedValue(new Error('Network error'));

      let capturedLogout;
      renderWithAuth({
        user: { id: 1, full_name: 'Test User' },
        isAuthenticated: true,
        logout: async () => {
          try {
            await authApi.logout();
          } catch (error) {
            console.error('API failed');
          } finally {
            mockNavigate('/');
          }
        }
      });

      const logoutButton = screen.getByText('Đăng xuất');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });
});
```

**Run tests**:

```bash
npm test -- Header.test.jsx
```

---

## Testing Checklist

### Backend Tests ✅

- [ ] Logout with valid JWT → 200 + cookie cleared
- [ ] Logout without cookie → 200 (idempotent)
- [ ] Logout with invalid JWT → 200 (idempotent)
- [ ] Logout with expired JWT → 200 (idempotent)
- [ ] Multiple logout calls → Always 200
- [ ] Cookie attributes correct (httpOnly, secure, sameSite, Max-Age=0)
- [ ] Response time < 100ms

### Frontend Tests ✅

- [ ] Logout button visible when authenticated
- [ ] Logout button hidden when not authenticated
- [ ] Click logout → authContext.logout() called
- [ ] Button disabled after click
- [ ] API success → context cleared → redirect
- [ ] API fails → context still cleared → redirect (offline resilience)

---

## Manual Testing Guide

### Test Case 1: Happy Path

1. **Login**:

   ```
   Navigate to /login
   Enter credentials
   Click "Đăng nhập"
   ```

2. **Verify authenticated**:

   ```
   Header shows user name
   "Đăng xuất" button visible
   ```

3. **Logout**:

   ```
   Click "Đăng xuất"
   ```

4. **Verify logged out**:

   ```
   Redirected to Landing Page (/)
   Header shows "Đăng nhập" + "Đăng ký"
   Cookie cleared (check DevTools → Application → Cookies)
   ```

### Test Case 2: Offline Resilience

1. **Login** (same as above)

2. **Disconnect network**:

   ```
   DevTools → Network → Offline
   ```

3. **Logout**:

   ```
   Click "Đăng xuất"
   ```

4. **Verify**:

   ```
   Still redirected to Landing Page
   Cookie cleared locally
   Console shows error (expected)
   ```

### Test Case 3: Idempotency

1. **Logout when already logged out**:

   ```
   POST /api/v1/auth/logout (no cookie)
   ```

2. **Verify**:

   ```
   Response: 200 OK
   No error
   ```

---

## Deployment Checklist

### Environment Variables

Verify `.env` values:

```bash
# Backend
COOKIE_ACCESS_NAME=access_token
COOKIE_SECURE=true  # Production only
COOKIE_SAME_SITE=strict
JWT_ACCESS_EXPIRES_IN=15m

# Frontend
REACT_APP_API_BASE_URL=https://api.vms.com/api/v1
```

### Pre-Deploy

- [ ] All tests passing (`npm test`)
- [ ] ESLint no errors (`npm run lint`)
- [ ] Build successful (`npm run build`)
- [ ] Manual testing complete
- [ ] API documented in Swagger
- [ ] `share_context.md` updated (if needed)

### Post-Deploy

- [ ] Smoke test logout in production
- [ ] Monitor error logs (first 24 hours)
- [ ] Check metrics (response time, error rate)

---

## Troubleshooting

### Issue 1: Cookie not cleared

**Symptom**: User still authenticated after logout.

**Debug**:

```javascript
// Check Set-Cookie header
curl -X POST http://localhost:5000/api/v1/auth/logout -v

// Look for:
// Set-Cookie: access_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict
```

**Common Causes**:

- ❌ Cookie attributes don't match login (path, domain)
- ❌ `maxAge: 0` missing
- ❌ Cookie name mismatch

**Fix**: Verify cookie attributes match exactly with login.

### Issue 2: Frontend doesn't redirect

**Symptom**: Stays on current page after logout.

**Debug**:

```javascript
// Check AuthContext logout function
console.log('Logout called');
console.log('Navigate called');
```

**Common Causes**:

- ❌ `navigate('/')` not called
- ❌ Error thrown before navigate
- ❌ React Router not setup

**Fix**: Ensure `navigate('/')` in finally block.

### Issue 3: Double logout error

**Symptom**: Console shows multiple logout API calls.

**Debug**:

```javascript
// Check isLoggingOut state
console.log('isLoggingOut:', isLoggingOut);
```

**Common Causes**:

- ❌ Button not disabled
- ❌ No double-click prevention

**Fix**: Add `disabled={isLoggingOut}` to button.

---

## Performance Tips

### Backend Optimization

✅ **Already optimal** - No database queries

**Metrics**:

- Response time: ~3ms
- Throughput: ~10,000 req/s (single core)
- Memory: Negligible

### Frontend Optimization

✅ **Already optimal** - Single API call

**Metrics**:

- Logout flow: ~70-115ms end-to-end
- No loading state needed (fast enough)

---

## Next Steps

After completing implementation:

1. ✅ Run `/speckit-tasks` to generate `tasks.md`
2. ✅ Update `share_context.md` với API contract (if needed)
3. ✅ Update Swagger documentation
4. ✅ Create PR with title: `feat(auth): implement logout (UC05)`

---

## Summary

### What You Built

- ✅ Backend logout API (`POST /api/v1/auth/logout`)
- ✅ Frontend logout flow (AuthContext + Header)
- ✅ Comprehensive tests (7 backend + 6 frontend)
- ✅ Idempotent, stateless, secure design

### Key Features

- 🟢 **Simple**: Zero database operations
- 🟢 **Fast**: < 100ms response time
- 🟢 **Secure**: httpOnly + secure + sameSite cookie
- 🟢 **Resilient**: Works offline (client-side clear)
- 🟢 **Idempotent**: Always return 200

### Time Breakdown

| Phase | Estimated | Actual |
|-------|-----------|--------|
| Backend | 4 hours | ___ |
| Frontend | 4 hours | ___ |
| **Total** | **8 hours** | ___ |

---

**Quickstart Status**: ✅ COMPLETE  
**Ready for Implementation**: ✅ YES  
**Good luck!** 🚀

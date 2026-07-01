# Quick Start Guide: Change Password (UC06)

## Prerequisites

- Node.js v18+
- npm or yarn
- MySQL 8.0+
- Postman or curl (for testing)
- VSCode or IDE

## 1. Environment Setup

### Backend .env Configuration

Create/update `backend/.env`:
```env
PORT=5000
API_PREFIX=/api/v1
FRONTEND_ORIGIN=http://localhost:3000

DATABASE_URL=mysql://root:password@localhost:3306/vms_dev

AUTH_SECRET=your-super-secret-jwt-key-min-32-chars
COOKIE_ACCESS_NAME=vms_access_token
JWT_ACCESS_EXPIRES_IN=15m

BCRYPT_SALT_ROUNDS=12

LOG_LEVEL=info
NODE_ENV=development
```

### Frontend .env Configuration

Create/update `frontend/.env`:
```env
REACT_APP_API_BASE_URL=http://localhost:5000/api/v1
```

## 2. Database Setup

### Verify User Table Exists

```sql
DESC users;
```

Expected columns:
- id (INT, PK)
- email (VARCHAR)
- password_hash (VARCHAR)
- is_active (BOOLEAN)
- updated_at (TIMESTAMP)

### Seed Test User (if needed)

```sql
-- Create test user with known password
-- Password: "TestPass@123"
-- Hash: (bcrypt of TestPass@123 with 12 rounds)

INSERT INTO users (email, password_hash, full_name, is_active) 
VALUES (
  'test@example.com',
  '$2b$12$R9h7cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss8KIUgO2t0jKMm6',
  'Test User',
  TRUE
);
```

## 3. Running Backend

```bash
cd backend

# Install dependencies
npm install

# Run database migrations (if needed)
npx prisma migrate dev

# Start backend server
npm run dev
```

Expected output:
```
Server running on http://localhost:5000
```

## 4. Running Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm start
```

Expected output:
```
Compiled successfully!
You can now view frontend in the browser.
  Local:            http://localhost:3000
```

## 5. Testing Change Password Flow

### Option 1: Using curl

**Step 1: Login to get JWT token**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "TestPass@123"
  }'
```

**Step 2: Call change password endpoint**
```bash
curl -X POST http://localhost:5000/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "oldPassword": "TestPass@123",
    "newPassword": "NewPass@456!",
    "confirmPassword": "NewPass@456!"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "message": "Mật khẩu đã được thay đổi thành công"
  }
}
```

**Step 3: Verify new password works (login with new password)**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "NewPass@456!"
  }'
```

Should succeed (200 response).

### Option 2: Using Postman

1. **Create "Change Password" request**:
   - Method: POST
   - URL: http://localhost:5000/api/v1/auth/change-password
   - Headers: Content-Type: application/json
   - Body (raw JSON):
   ```json
   {
     "oldPassword": "TestPass@123",
     "newPassword": "NewPass@456!",
     "confirmPassword": "NewPass@456!"
   }
   ```

2. **Set Cookie**: After login, copy JWT token from login response and add to request header

3. **Send Request**: Should return 200 with success message

### Option 3: Using Frontend UI

1. Navigate to http://localhost:3000
2. Login with test@example.com / TestPass@123
3. Go to Profile → Change Password
4. Enter:
   - Old Password: TestPass@123
   - New Password: NewPass@456!
   - Confirm Password: NewPass@456!
5. Click "Change Password"
6. Should see success message

## 6. Test Cases

### Test Case 1: Happy Path
- Old password: Correct
- New password: Meets policy (8+ chars, upper, lower, digit, special)
- Confirm: Matches new password
- **Expected**: 200, success message

### Test Case 2: Wrong Old Password
- Old password: Wrong value
- New password: Valid
- Confirm: Matches new password
- **Expected**: 400, "Mật khẩu cũ không chính xác"

### Test Case 3: Weak New Password
- Old password: Correct
- New password: "weak" (too short, no special char)
- Confirm: Matches new password
- **Expected**: 400, validation error message

### Test Case 4: Passwords Don't Match
- Old password: Correct
- New password: "NewPass@456!"
- Confirm: "DifferentPass@789"
- **Expected**: 400, "Không khớp"

### Test Case 5: No JWT Token
- Don't include JWT token in request
- **Expected**: 401, Unauthorized

### Test Case 6: Concurrent Requests
- Send 2 change password requests simultaneously
- **Expected**: Both succeed (last one wins)

## 7. Debugging Tips

### Issue: "Cannot find module 'bcryptjs'"
```bash
npm install bcryptjs
```

### Issue: "ECONNREFUSED" (Database error)
- Verify MySQL is running
- Check DATABASE_URL in .env
- Verify database exists: `CREATE DATABASE vms_dev;`

### Issue: "JWT token invalid"
- Verify token in cookie (use `document.cookie` in browser console)
- Token might be expired (default 15 minutes)
- Login again to get fresh token

### Issue: "BCRYPT_SALT_ROUNDS not defined"
- Add `BCRYPT_SALT_ROUNDS=12` to backend/.env
- Restart backend server

### Issue: CORS errors
- Verify `FRONTEND_ORIGIN` in backend/.env matches frontend URL
- Check backend CORS configuration in app.js

## 8. Verifying Implementation

### Check logs:
```bash
# Backend logs should show:
CHANGE_PASSWORD_SUCCESS { userId: 1, timestamp: ... }
```

### Check database:
```sql
SELECT email, updated_at FROM users WHERE id = 1;
```

The `updated_at` should be recently updated.

### Verify with new password:
Try logging in with the new password - should succeed.

## 9. Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| 400 "old password incorrect" | User entered wrong current password | Verify correct current password |
| 400 "password doesn't match policy" | New password too weak | Add uppercase, lowercase, digit, special char |
| 400 "passwords don't match" | New password != confirm password | Type same value in both fields |
| 401 Unauthorized | No JWT token or expired | Login again |
| 403 Forbidden | Account inactive | Verify is_active = TRUE in database |
| 500 Internal error | Database transaction failed | Check MySQL connection, review backend logs |

## Next Steps

After verifying UC06 works locally:

1. Run integration tests: `npm run test`
2. Check test coverage: `npm run test:coverage`
3. Run linter: `npm run lint`
4. Create feature branch: `git checkout -b feat/UC06-change-password`
5. Commit changes: `git commit -am "feat(auth): implement change password"`
6. Push to remote: `git push origin feat/UC06-change-password`
7. Create PR for review

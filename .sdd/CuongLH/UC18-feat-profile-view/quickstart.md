# Quick Start Guide: UC18 - View Profile

**Feature**: View Profile (Xem hồ sơ cá nhân)
**API Endpoint**: GET /api/v1/user/me
**Authentication**: Required (JWT in httpOnly cookie)

---

## Prerequisites

1. ✅ Backend server đang chạy tại <http://localhost:5000>
2. ✅ Database đã được migrate và seed với test data
3. ✅ User đã đăng nhập và có JWT token trong cookie

---

## Quick Test Flow

### Step 1: Login để lấy JWT token

**Request**:

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }' \
  -c cookies.txt
```

**Expected Response**:

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "email": "user@example.com",
      "name": "Nguyễn Văn A"
    }
  }
}
```

**Note**: Cookie `token` được lưu tự động vào `cookies.txt`

---

### Step 2: Get Profile với cookie

**Request**:

```bash
curl -X GET http://localhost:5000/api/v1/user/me \
  -b cookies.txt
```

**Expected Response**:

```json
{
  "success": true,
  "message": "Lấy thông tin hồ sơ thành công",
  "data": {
    "full_name": "Nguyễn Văn A",
    "email": "user@example.com",
    "phone_number": "0123456789",
    "avatar_url": "https://cloudinary.com/vms/avatars/user123.jpg",
    "role_name": "VOLUNTEER",
    "created_at": "2025-01-01T00:00:00.000Z",
    "skills": [
      {
        "skill_id": 1,
        "skill_name": "Giao tiếp"
      },
      {
        "skill_id": 3,
        "skill_name": "Tiếng Anh"
      }
    ]
  }
}
```

---

## Testing với Postman

### 1. Setup Environment

**Environment Variables**:

```
BASE_URL = http://localhost:5000
API_VERSION = v1
```

### 2. Login Request

**Method**: POST
**URL**: {{BASE_URL}}/api/{{API_VERSION}}/auth/login
**Headers**:

```
Content-Type: application/json
```

**Body** (raw JSON):

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Important**: Enable "Automatically follow redirects" và "Save cookies"

### 3. View Profile Request

**Method**: GET
**URL**: {{BASE_URL}}/api/{{API_VERSION}}/user/me
**Headers**: (không cần set manually - cookie tự động gửi)

**Verification**:

- Status code: 200 OK
- Response có field: full_name, email, phone_number, avatar_url, skills
- skills là array với structure: [{ skill_id, skill_name }]

---

## Testing Error Cases

### Test 1: No Token (401 UNAUTHORIZED)

**Request**:

```bash
curl -X GET http://localhost:5000/api/v1/user/me
# Không có cookie
```

**Expected Response**:

```json
{
  "success": false,
  "message": "Vui lòng đăng nhập",
  "code": "UNAUTHORIZED",
  "details": null
}
```

---

### Test 2: Expired Token (401 TOKEN_INVALID)

**Setup**: Sử dụng token đã hết hạn hoặc token giả lập không còn hợp lệ theo cấu hình auth hiện tại

**Request**:

```bash
curl -X GET http://localhost:5000/api/v1/user/me \
  -b cookies.txt
```

**Expected Response**:

```json
{
  "success": false,
  "message": "Phiên đăng nhập không hợp lệ",
  "code": "TOKEN_INVALID",
  "details": null
}
```

---

### Test 3: Disabled Account (403 ACCOUNT_DISABLED)

**Setup**: Set is_active = false cho user trong database

**Request**:

```bash
curl -X GET http://localhost:5000/api/v1/user/me \
  -b cookies.txt
```

**Expected Response**:

```json
{
  "success": false,
  "message": "Tài khoản đã bị vô hiệu hóa",
  "code": "ACCOUNT_DISABLED",
  "details": null
}
```

---

## Frontend Integration

### React Component Example

```jsx
// src/components/pages/profile/ProfileViewPage.jsx
import { useEffect, useState } from 'react';
import { userService } from '../../services/user.service';
import { useNavigate } from 'react-router-dom';

function ProfileViewPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await userService.getMe();
        setProfile(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          // Token invalid/expired - redirect to login
          navigate('/login');
        } else if (err.response?.status === 403) {
          // Account disabled
          setError('Tài khoản đã bị vô hiệu hóa');
        } else {
          setError('Không thể tải thông tin hồ sơ');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [navigate]);

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!profile) return null;

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h3>Hồ sơ cá nhân</h3>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-4">
              <img 
                src={profile.avatar_url || '/default-avatar.png'} 
                alt="Avatar"
                className="img-thumbnail"
              />
            </div>
            <div className="col-md-8">
              <h4>{profile.full_name}</h4>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Số điện thoại:</strong> {profile.phone_number || 'Chưa cập nhật'}</p>
            </div>
          </div>

          <hr />

          <h5>Kỹ năng</h5>
          {profile.skills.length > 0 ? (
            <div className="d-flex flex-wrap gap-2">
              {profile.skills.map(skill => (
                <span key={skill.skill_id} className="badge bg-primary">
                  {skill.skill_name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted">Chưa có kỹ năng nào</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileViewPage;
```

---

### API Client Module

```javascript
// src/services/user.service.js
import axiosApi from '../api/axiosApi';

/**
 * Get current user's profile
 * @returns {Promise<{ success: boolean, message: string, data: ProfileData }>}
 */
export const userService = { {
    async getMe() {
    return axiosApi.get('/api/v1/user/me', {
      headers: { 'Cache-Control': 'no-cache' }
    });
  },
};
```

**Note**: Axios instance phải config withCredentials: true:

```javascript
// src/api/axiosApi.js
import axios from 'axios';

const axiosApi = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  withCredentials: true,  // Enable sending cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

export default axiosApi;
```

---

## Database Seed Data

### Sample User với Skills

```sql
-- Insert test user
INSERT INTO users (email, password_hash, full_name, phone, avatar_url, role_id, is_active, email_verified)
VALUES (
  'user@example.com',
  '',  -- bcrypt hash của 'password123'
  'Nguyễn Văn A',
  '0123456789',
  'https://cloudinary.com/vms/avatars/user123.jpg',
  1,  -- VOLUNTEER role
  true,
  true
);

-- Insert sample skills
INSERT INTO skills (name, description, is_active)
VALUES 
  ('Giao tiếp', 'Kỹ năng giao tiếp hiệu quả', true),
  ('Tiếng Anh', 'Sử dụng tiếng Anh giao tiếp', true),
  ('Làm việc nhóm', 'Làm việc nhóm hiệu quả', true);

-- Link user với skills
INSERT INTO user_skills (user_id, skill_id)
SELECT u.id, s.id
FROM users u
CROSS JOIN skills s
WHERE u.email = 'user@example.com'
  AND s.name IN ('Giao tiếp', 'Tiếng Anh');
```

---

## Troubleshooting

### Issue 1: "Vui lòng đăng nhập" khi đã login

**Cause**: Cookie không được gửi trong request

**Solution**:

1. Kiểm tra withCredentials: true trong Axios config
2. Verify CORS config trên backend:

```javascript
// backend/src/app.js
app.use(cors({
  origin: 'http://localhost:3000',  // Frontend origin
  credentials: true  // REQUIRED for cookies
}));
```

---

### Issue 2: Cookie bị clear sau khi refresh page

**Cause**: Cookie settings không đúng

**Solution**: Check jwt.util.js:

```javascript
export function setTokenToCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: false,  // Set true in production with HTTPS
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000  // 1 day
  });
}
```

---

### Issue 3: Skills không xuất hiện trong response

**Possible Causes**:

1. User chưa có skills trong database → Expected behavior (skills: [])
2. Skills bị soft delete (is_active = false) → Expected behavior
3. LEFT JOIN không đúng → Check Prisma query

**Debug**:

```bash
# Check user_skills table
mysql> SELECT us.*, s.name, s.is_active 
       FROM user_skills us 
       JOIN skills s ON us.skill_id = s.id
       WHERE us.user_id = 1;
```

---

## Performance Testing

### Load Test với Artillery

**Install Artillery**:

```bash
npm install -g artillery
```

**Test Script** (load-test-profile.yml):

```yaml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 20
  variables:
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

scenarios:
  - name: "Get Profile"
    flow:
      - get:
          url: "/api/v1/user/me"
          headers:
            Cookie: "token={{token}}"
          expect:
            - statusCode: 200
            - contentType: json
```

**Run Test**:

```bash
artillery run load-test-profile.yml
```

**Expected Results**:

- p95 response time: < 300ms
- p99 response time: < 1s
- Error rate: < 0.1%

---

## Next Steps

1. ✅ Test API với curl/Postman
2. ✅ Verify response structure matches contract
3. ✅ Test all error scenarios (401, 403, 404, 500)
4. ✅ Integrate vào Frontend ProfilePage
5. ✅ Write unit tests cho Service layer
6. ✅ Write integration tests cho API endpoint
7. ✅ Performance test với Artillery
8. ✅ Code review và merge

---

## Additional Resources

- **API Contract**: See contracts/api-contract.md
- **Service Contract**: See contracts/service-contract.md
- **Data Model**: See data-model.md
- **Implementation Plan**: See plan.md
- **Feature Spec**: See spec.md

---

**Guide Status**: READY FOR USE
**Last Updated**: 2026-06-30
**Tested With**: Node.js 18+, React 19

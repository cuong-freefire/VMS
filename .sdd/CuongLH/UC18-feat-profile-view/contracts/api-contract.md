# API Contract: GET /api/v1/user/me

**Endpoint**: View Profile (UC18)
**Owner**: Member 1 - CuongLH
**Version**: 1.0
**Status**: READY FOR IMPLEMENTATION

---

## Endpoint Information

**Method**: GET
**URL**: /api/v1/user/me
**Authentication**: Required (JWT in httpOnly cookie)
**Authorization**: Any authenticated user (self-view only)

---

## Request Specification

### Headers

```
Cookie: token=<jwt_access_token>
```

### Query Parameters

NONE

### Request Body

NONE

### Example Request

```bash
curl -X GET http://localhost:5000/api/v1/user/me \
  -H "Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Response Specification

### Success Response (200 OK)

**Condition**: User đã đăng nhập, token hợp lệ, tài khoản active

**Response Body**:

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
      },
      {
        "skill_id": 5,
        "skill_name": "Làm việc nhóm"
      }
    ]
  }
}
```

**Data Types**:

- success: boolean (always `true`)
- message: string
- data.full_name: string
- data.email: string
- data.phone_number: string | null
- data.avatar_url: string | null
- data.role_name: string (enum: "VOLUNTEER" | "STAFF" | "MANAGER" | "ADMIN")
- data.created_at: string (ISO 8601)
- data.skills: Array<{ skill_id: number, skill_name: string }>

**Edge Cases**:

- phone_number = null: User chưa cập nhật số điện thoại
- avatar_url = null: User chưa upload avatar
- skills = []: User chưa đăng ký kỹ năng nào

---

### Error Responses

#### 401 Unauthorized - No Token

**Condition**: Request không chứa cookie `token`

**Response Body**:

```json
{
  "success": false,
  "message": "Vui lòng đăng nhập",
  "code": "UNAUTHORIZED",
  "details": null
}
```

**Headers**:

```
HTTP/1.1 401 Unauthorized
Content-Type: application/json
```

---

#### 401 Unauthorized - Invalid Token

**Condition**: JWT token không hợp lệ hoặc đã hết hạn

**Response Body**:

```json
{
  "success": false,
  "message": "Phiên đăng nhập không hợp lệ",
  "code": "TOKEN_INVALID",
  "details": null
}
```

**Causes**:

- Token signature không đúng
- Token đã expired
- Token bị malformed

---

#### 403 Forbidden - Account Disabled

**Condition**: Tài khoản đã bị vô hiệu hóa (is_active = false)

**Response Body**:

```json
{
  "success": false,
  "message": "Tài khoản đã bị vô hiệu hóa",
  "code": "ACCOUNT_DISABLED",
  "details": null
}
```

**Why 403 not 401**: User đã authenticated (token hợp lệ) nhưng không có permission (account disabled)

---

#### 404 Not Found - User Not Found

**Condition**: `user_id` trong JWT token không tồn tại trong database

**Response Body**:

```json
{
  "success": false,
  "message": "Tài khoản không tồn tại",
  "code": "USER_NOT_FOUND",
  "details": null
}
```

**Causes**:

- User đã bị hard delete (không nên xảy ra - vi phạm soft delete policy)
- JWT token chứa `user_id` không hợp lệ
- Database inconsistency

---

#### 500 Internal Server Error

**Condition**: Lỗi không mong đợi từ server (database error, network error, etc.)

**Response Body**:

```json
{
  "success": false,
  "message": "Có lỗi xảy ra trong quá trình xử lý",
  "code": "INTERNAL_SERVER_ERROR",
  "details": null
}
```

**Note**: details KHÔNG chứa stack trace trong production (security)

---

## Business Rules

1. **Self-View Only**: User chỉ có thể xem profile của chính mình. `user_id` được lấy từ JWT token đã được xác thực, KHÔNG từ URL params, query string hoặc request body.

2. **Active Account Only**: Chỉ tài khoản có is_active = true mới được trả về dữ liệu.

3. **Active Skills Only**: Chỉ skills có is_active = true được include trong response.

4. **Data Sanitization**: Response KHÔNG bao gồm `password`, `password_hash`, `refresh_token`, `user_id`, `role_id`, `is_active`, `email_verified`, `created_at`, `updated_at` hoặc bất kỳ metadata nội bộ nào.

5. **Null Handling**: Fields optional như `phone_number` và `avatar_url` phải trả về `null` nếu chưa có giá trị, KHÔNG ẩn field.

6. **Empty Skills**: User chưa có skill trả về `skills: []`, KHÔNG phải `null` hoặc `undefined`.

---

## Security Considerations

### Authentication

- JWT token MUST be in httpOnly cookie (prevent XSS)
- Token verified by Auth Middleware before reaching controller
- Expired tokens automatically rejected

### Authorization

- No explicit authorization check (any authenticated user can view own profile)
- User CANNOT view other users' profiles via this endpoint

### Data Privacy

- Password hash NEVER exposed in response
- Internal IDs (role_id, internal flags) NEVER exposed
- Skills của user khác KHÔNG accessible qua endpoint này

### Rate Limiting

- Recommend: 100 requests/minute per user
- Burst: 20 requests/second

---

## Caching Strategy

### Client-Side

- Cache-Control: private, max-age=300 (5 minutes)
- ETag support: RECOMMENDED

### Server-Side (Optional)

- Redis cache với key: profile:{userId}
- TTL: 5 minutes
- Invalidate on profile update (UC19, UC20)

---

## Testing Scenarios

### Happy Path

1. User đăng nhập → Lấy token
2. GET /api/v1/user/me với token
3. Verify response 200 với đầy đủ fields

### Error Paths

1. GET không có token → 401 UNAUTHORIZED
2. GET với token expired → 401 TOKEN_INVALID
3. GET với token của account disabled → 403 ACCOUNT_DISABLED
4. GET với token của user không tồn tại → 404 USER_NOT_FOUND

### Edge Cases

1. User không có skills → skills: []
2. User chưa có số điện thoại → phone_number: null
3. User chưa có avatar → avatar_url: null
4. User có skills bị soft delete → Chỉ trả về active skills

---

## API Evolution & Versioning

**Current Version**: v1.0

**Breaking Changes Policy**:

- Adding optional fields: NON-BREAKING
- Removing fields: BREAKING (require version bump)
- Changing field types: BREAKING
- Changing error codes: BREAKING

**Deprecation Notice**:

- Minimum 3 months notice before breaking change
- Support old version for 6 months after new version release

---

## Dependencies

### Upstream Services

- Auth Middleware (JWT verification)
- MySQL Database (user, skills, user_skills tables)

### Downstream Consumers

- Frontend ProfilePage component
- Mobile app Profile screen (future)

---

## SLA Targets

- **Availability**: 99.9% uptime
- **Response Time**: p95 < 300ms, p99 < 1s
- **Error Rate**: < 0.1%

---

**Contract Status**: READY FOR IMPLEMENTATION
**Last Updated**: 2026-06-30
**Approved By**: [Pending Review]

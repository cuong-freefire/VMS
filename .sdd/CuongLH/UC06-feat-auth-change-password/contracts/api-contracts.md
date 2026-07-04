# API Contracts: Change Password (UC06)

## Endpoint: POST /api/v1/auth/change-password

### Request

**Headers**:

```
Content-Type: application/json
Cookie: vms_access_token=eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Body**:

```json
{
  "oldPassword": "string (required)",
  "newPassword": "string (required)",
  "confirmPassword": "string (required)"
}
```

**Body Field Descriptions**:

- `oldPassword`: Current password for verification (min 1 char)
- `newPassword`: New password (min 8 chars, uppercase, lowercase, digit, special char)
- `confirmPassword`: Confirmation of new password (must equal newPassword)

**Example Request**:

```bash
curl -X POST http://localhost:5000/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Cookie: vms_access_token=..." \
  -d '{
    "oldPassword": "OldPass@123",
    "newPassword": "NewPass@456",
    "confirmPassword": "NewPass@456"
  }'
```

---

### Response Success (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Mật khẩu đã được thay đổi thành công"
  }
}
```

**Description**: Password changed successfully. User can now login with new password.

---

### Response Errors

#### 400 Bad Request

**Scenario 1: Old password incorrect**

```json
{
  "success": false,
  "error": "Mật khẩu cũ không chính xác"
}
```

**Scenario 2: New password doesn't meet policy**

```json
{
  "success": false,
  "error": "Mật khẩu phải chứa ít nhất một ký tự viết hoa"
}
```

**Scenario 3: Passwords don't match**

```json
{
  "success": false,
  "error": "Mật khẩu mới và xác nhận mật khẩu không khớp"
}
```

**Scenario 4: Missing required field**

```json
{
  "success": false,
  "error": "oldPassword is required"
}
```

---

#### 401 Unauthorized

**Scenario: No valid JWT token**

```json
{
  "success": false,
  "error": "Unauthorized - Token không hợp lệ hoặc đã hết hạn"
}
```

---

#### 403 Forbidden

**Scenario: User account inactive**

```json
{
  "success": false,
  "error": "Tài khoản của bạn không hoạt động"
}
```

---

#### 500 Internal Server Error

**Scenario: Database error or unexpected failure**

```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

### HTTP Status Codes Reference

| Code | Meaning | When to Use |
|------|---------|-----------|
| 200 | Success | Password changed successfully |
| 400 | Bad Request | Validation failed, old password wrong, confirm mismatch |
| 401 | Unauthorized | No JWT token or token expired |
| 403 | Forbidden | User account inactive |
| 500 | Server Error | Database connection failed, transaction error |

---

### Security Considerations

1. **JWT Authentication**: Request MUST include valid JWT token in httpOnly cookie. Middleware will validate before controller processes.

2. **No User Enumeration**: Response for "old password incorrect" is same format as other errors. Response time normalized to prevent timing attacks.

3. **Password Hashing**: New password is hashed with bcrypt (12 rounds) before database storage. Old password is verified using bcrypt.compare() (constant-time comparison).

4. **No Sensitive Data in Response**: Response never includes password hashes, plaintext passwords, or stack traces.

5. **Audit Logging**: Every attempt (success/failure) is logged with userId, timestamp, and event type. Passwords are NEVER logged.

6. **Transaction Safety**: Database update wrapped in Prisma transaction. Any failure triggers automatic rollback.

---

### Field Validation Details

#### oldPassword

- **Required**: Yes
- **Format**: String
- **Min Length**: 1 character
- **Validation Logic**: Compared with bcrypt.compare(input, user.password_hash)
- **Error Code**: 400
- **Error Message**: "Mật khẩu cũ không chính xác"

#### newPassword

- **Required**: Yes
- **Format**: String
- **Min Length**: 8 characters
- **Regex Patterns**:
  - Must contain: [A-Z] (uppercase)
  - Must contain: [a-z] (lowercase)
  - Must contain: [\d] (digit)
  - Must contain: [!@#$%^&*] (special char)
- **Error Code**: 400
- **Error Message**: "Mật khẩu phải chứa [requirement]"

#### confirmPassword

- **Required**: Yes
- **Format**: String
- **Validation Logic**: Must equal newPassword exactly (case-sensitive)
- **Error Code**: 400
- **Error Message**: "Mật khẩu mới và xác nhận mật khẩu không khớp"

---

### Implementation Notes

- **Framework**: Express 5.x
- **Validation**: Zod schema middleware
- **ORM**: Prisma
- **Database**: MySQL 8
- **Response Format**: Standard ADR-006 format
- **Authentication Middleware**: Express middleware validates JWT before reaching controller
- **Error Handling**: Service layer throws ServiceError with status code and message
- **Logging**: Pino logger records events at service layer

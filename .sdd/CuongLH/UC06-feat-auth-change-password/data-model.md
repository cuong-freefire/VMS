# Data Model: Thay Đổi Mật Khẩu (UC06)

## Entities

### User (Existing)

- **id** (INT, PK): User identifier
- **email** (VARCHAR 255, UNIQUE): User email
- **password_hash** (VARCHAR 255): Bcrypt hashed password (updated by UC06)
- **is_active** (BOOLEAN, DEFAULT TRUE): Account active status
- **created_at** (TIMESTAMP): Account creation date
- **updated_at** (TIMESTAMP): Last update timestamp

**Update Flow**: UC06 updates only `password_hash` and `updated_at` fields

**Constraints**:

- `password_hash` MUST be bcrypt hash (60 chars)
- `is_active` MUST be TRUE to change password
- Email MUST be unique across system

### AuditLog (Implicit)

- Events logged: CHANGE_PASSWORD_SUCCESS, CHANGE_PASSWORD_FAILED
- Data logged: userId, timestamp, event type, reason (if failed)
- Data NEVER logged: passwords, hashes

---

## Data Flow: Change Password

```
Step 1: Request Validation
┌─────────────────────────────────────────────┐
│ Input: { oldPassword, newPassword,          │
│         confirmPassword }                    │
│ From: JWT token in httpOnly cookie           │
└────────────────────┬────────────────────────┘
                     ↓
Step 2: Zod Schema Validation
┌─────────────────────────────────────────────┐
│ - oldPassword not empty                      │
│ - newPassword matches policy                 │
│ - confirmPassword === newPassword            │
└────────────────────┬────────────────────────┘
                     ↓
Step 3: User Lookup
┌─────────────────────────────────────────────┐
│ SELECT * FROM users WHERE id = userId       │
│ Validate: is_active = TRUE                   │
└────────────────────┬────────────────────────┘
                     ↓
Step 4: Old Password Verification
┌─────────────────────────────────────────────┐
│ bcrypt.compare(oldPassword, user.password_hash)
│ IF false: return 400 "Mật khẩu cũ không    │
│           chính xác" + CHANGE_PASSWORD_FAILED log
└────────────────────┬────────────────────────┘
                     ↓
Step 5: Hash New Password
┌─────────────────────────────────────────────┐
│ newHash = bcrypt.hash(newPassword, 12)       │
└────────────────────┬────────────────────────┘
                     ↓
Step 6: Database Transaction
┌─────────────────────────────────────────────┐
│ BEGIN TRANSACTION                           │
│   UPDATE users SET                          │
│     password_hash = newHash,                │
│     updated_at = NOW()                      │
│   WHERE id = userId                         │
│ COMMIT TRANSACTION                          │
│ IF error: ROLLBACK automatically            │
└────────────────────┬────────────────────────┘
                     ↓
Step 7: Audit Log
┌─────────────────────────────────────────────┐
│ Log: CHANGE_PASSWORD_SUCCESS                │
│ Data: { userId, timestamp, ipAddress }      │
└────────────────────┬────────────────────────┘
                     ↓
Step 8: Response
┌─────────────────────────────────────────────┐
│ { success: true,                            │
│   data: { message: "Mật khẩu đã được       │
│            thay đổi thành công" }           │
│ }                                           │
└─────────────────────────────────────────────┘
```

---

## Validation Rules

### oldPassword Field

- Format: String, min 1 character
- Validation: MUST match user's current password_hash via bcrypt.compare()
- Error (400): "Mật khẩu cũ không chính xác"

### newPassword Field

- Format: String
- Length: Min 8 characters
- Requires: At least 1 uppercase letter
- Requires: At least 1 lowercase letter
- Requires: At least 1 digit (0-9)
- Requires: At least 1 special character (!@#$%^&*)
- Error (400): "Mật khẩu phải chứa [requirement not met]"

### confirmPassword Field

- Format: String
- Must equal newPassword exactly (case-sensitive)
- Error (400): "Mật khẩu mới và xác nhận mật khẩu không khớp"

---

## State Transitions

```
User Account State
┌──────────────────┐
│  is_active=TRUE  │ ← Can change password
│  password_hash   │
│  exists          │
└────────┬─────────┘
         │
         ├─ Change Password Success
         │  password_hash = newHash
         │  is_active = TRUE (unchanged)
         │
         └─ Change Password Fail
            password_hash = (unchanged)
            is_active = TRUE (unchanged)
```

---

## Indexes

**Recommended indexes for performance**:

- PRIMARY KEY (id) - Already exists
- INDEX (is_active) - For WHERE is_active = TRUE checks
- No new indexes needed for UC06

---

## Error Scenarios & Handling

| Scenario | HTTP Status | Response | Action |
|----------|------------|----------|--------|
| Old password wrong | 400 | "Mật khẩu cũ không chính xác" | Log FAILED, return 400 |
| New password weak | 400 | "Mật khẩu phải chứa..." | Log FAILED, return 400 |
| Confirm mismatch | 400 | "Không khớp" | Log FAILED, return 400 |
| No JWT token | 401 | "Unauthorized" | Reject at middleware |
| User inactive | 403 | "Account inactive" | Log FAILED, return 403 |
| DB transaction fails | 500 | Generic message | Rollback, log error |
| Database unavailable | 503 | Generic message | Return 503 |

---

## Concurrency & Race Conditions

**Scenario**: User changes password from 2 devices simultaneously

**Handling**:

- Database will execute updates serially (MySQL locks handle this)
- Both requests will complete successfully BUT second one will overwrite first
- This is acceptable behavior for password change
- Spec allows this (no concurrent protection required)

**Implementation**: Standard database behavior, no special handling needed

---

## Summary

- **Table Modified**: users (password_hash field only)
- **New Tables**: None
- **Data Integrity**: Transaction ensures atomicity
- **Validation**: 3-field validation (old password, new password, confirm)
- **Concurrency**: Database handles serialization
- **Audit**: Implicit logging of success/failure events

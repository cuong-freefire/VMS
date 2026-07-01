# Service Contract: ProfileService

**Module**: Profile Management (UC18)
**Owner**: Member 1 - CuongLH
**Layer**: Service Layer (Business Logic)
**Version**: 1.0

---

## Service Interface

### Method: getUserProfile(userId)

**Purpose**: Lấy thông tin hồ sơ cá nhân kèm danh sách kỹ năng của user dựa trên định danh đã được JWT xác thực

**Note**: Tên đầu mục được giữ nguyên để bảo toàn cấu trúc tài liệu hiện tại. Contract cuối cùng của UC18 sử dụng `userId` theo `context.md` và `spec.md`.

**Signature**:

```javascript
async getUserProfile(userId: number): Promise<ProfileData>
```

**Input Parameters**:

- userId: number (lấy từ JWT token đã được Auth Middleware xác thực)

**Return Type** (Success):

```typescript
interface ProfileData {
  full_name: string;
  email: string;
  phone_number: string | null;
  avatar_url: string | null;
  skills: Array<{
    skill_id: number;
    skill_name: string;
  }>;
}
```

**Example Return Value**:

```javascript
{
  full_name: "Nguyễn Văn A",
  email: "<user@example.com>",
  phone_number: "0123456789",
  avatar_url: "<https://cloudinary.com/avatar.jpg>",
  skills: [
    { skill_id: 1, skill_name: "Giao tiếp" },
    { skill_id: 3, skill_name: "Tiếng Anh" }
  ]
}
```

**Throws** (ServiceError):

1. **USER_NOT_FOUND** (404)

```javascript
throw new ServiceError(
  "Tài khoản không tồn tại",
  404,
  "USER_NOT_FOUND"
);
```

**When**: `userId` không tồn tại trong database

1. **ACCOUNT_DISABLED** (403)

```javascript
throw new ServiceError(
  "Tài khoản đã bị vô hiệu hóa",
  403,
  "ACCOUNT_DISABLED"
);
```

**When**: User có is_active = false

1. **INTERNAL_SERVER_ERROR** (500)

```javascript
throw new ServiceError(
  "Có lỗi xảy ra trong quá trình xử lý",
  500,
  "INTERNAL_SERVER_ERROR",
  error.message  // Only in development
);
```

**When**: Database error, network error, unexpected exceptions

---

## Business Rules

### 1. User Lookup Strategy

- **Step 1**: Nhận `userId` từ JWT token đã được middleware xác thực
- **Step 2**: Query `findUserWithSkills(userId)` để lấy profile + skills
- **Step 3**: Nếu user không tồn tại, throw `USER_NOT_FOUND`; nếu `is_active = false`, throw `ACCOUNT_DISABLED`

**Rationale**: Theo `context.md` và `spec.md`, UC18 phải dùng định danh người dùng từ JWT đã xác thực và không nhận định danh từ client.

---

### 2. Soft Delete Enforcement

- User query MUST load trạng thái `is_active` để service quyết định trả về dữ liệu hay ném lỗi
- Skills query MUST filter WHERE is_active = true
- Disabled skills KHÔNG xuất hiện trong result
- Disabled accounts KHÔNG được trả về dữ liệu thành công

**Implementation**:

```javascript
// Repository query
const user = await prisma.user.findUnique({
  where: {
    id: userId
  },
  select: {
    id: true,
    full_name: true,
    email: true,
    phone: true,
    avatar_url: true,
    is_active: true
  }
});
```

---

### 3. Data Sanitization

Service layer MUST remove ALL sensitive fields before returning data.

**MUST REMOVE**:

- id (user internal ID)
- password_hash
- role_id
- is_active
- email_verified
- created_at, updated_at

**Implementation**: Use Prisma select với explicit fields thay vì remove sau khi query.

---

### 4. Null Handling

- phone_number: Return `null` if not set (NOT undefined, NOT empty string)
- avatar_url: Return `null` if not set
- skills: Return [] if user has no skills (NOT null)

**Validation**:

```javascript
// CORRECT
return {
  phone_number: user.phone ?? null,
  avatar_url: user.avatar_url || null,
  skills: skills.length > 0 ? skills : []
};

// WRONG
return {
  phone_number: user.phone,  // API contract requires explicit null
  skills: skills || null  // Should be [] not null
};
```

---

### 5. Skills Transformation

Raw Prisma result chứa nested structure, cần flatten.

**Input** (từ Repository):

```javascript
{
  full_name: "...",
  user_skills: [
    { skill: { id: 1, name: "Giao tiếp" } },
    { skill: { id: 3, name: "Tiếng Anh" } }
  ]
}
```

**Output** (từ Service):

```javascript
{
  full_name: "...",
  email: "<user@example.com>",
  phone_number: "0123456789",
  avatar_url: "https://...",
  skills: [
    { skill_id: 1, skill_name: "Giao tiếp" },
    { skill_id: 3, skill_name: "Tiếng Anh" }
  ]
}
```

**Transform Logic**:

```javascript
const skills = user.user_skills.map(us => ({
  skill_id: us.skill.id,
  skill_name: us.skill.name
}));
```

---

## Service Dependencies

### Repository Layer

Service MUST call Repository methods, KHÔNG trực tiếp gọi Prisma.

**Required Methods**:

1. ProfileRepository.findUserById(userId)
   - Returns: { id: number, is_active: boolean } | null

2. ProfileRepository.findUserWithSkills(userId)
   - Returns: UserWithSkills | null

**Why**: Tách biệt data access logic để dễ test và swap implementation.

---

## Error Handling Strategy

### 1. Database Errors

```javascript
try {
  const user = await profileRepository.findUserWithSkills(userId);
} catch (error) {
  logger.error('Database error in getUserProfile', { userId, error });
  throw new ServiceError(
    "Có lỗi xảy ra trong quá trình xử lý",
    500,
    "INTERNAL_SERVER_ERROR",
    process.env.NODE_ENV === 'development' ? error.message : null
  );
}
```

### 2. Not Found Errors

```javascript
if (!profile) {
  throw new ServiceError(
    "Tài khoản không tồn tại",
    404,
    "USER_NOT_FOUND"
  );
}
```

### 3. Authorization Errors

```javascript
if (!profile.is_active) {
  throw new ServiceError(
    "Tài khoản đã bị vô hiệu hóa",
    403,
    "ACCOUNT_DISABLED"
  );
}
```

---

## Implementation Example

```javascript
// backend/src/services/profile.service.js
import { ServiceError } from '../utils/response.util.js';
import ProfileRepository from '../repositories/profile.repository.js';
import logger from '../config/logger.config.js';

class ProfileService {
  async getUserProfile(userId) {
    try {
      // Step 1: Get full profile by authenticated user id
      const profile = await ProfileRepository.findUserWithSkills(userId);

      if (!profile) {
        throw new ServiceError(
          "Tài khoản không tồn tại",
          404,
          "USER_NOT_FOUND"
        );
      }
      
      // Step 2: Check if account is active
      if (!profile.is_active) {
        throw new ServiceError(
          "Tài khoản đã bị vô hiệu hóa",
          403,
          "ACCOUNT_DISABLED"
        );
      }

      // Step 3: Transform skills structure
      const skills = profile.user_skills.map(us => ({
        skill_id: us.skill.id,
        skill_name: us.skill.name
      }));
      
      // Step 4: Return sanitized data
      return {
        full_name: profile.full_name,
        email: profile.email,
        phone_number: profile.phone ?? null,
        avatar_url: profile.avatar_url || null,
        skills
      };
      
    } catch (error) {
      // Re-throw ServiceError as-is
      if (error instanceof ServiceError) {
        throw error;
      }
      
      // Wrap unexpected errors
      logger.error('Unexpected error in getUserProfile', { userId, error });
      throw new ServiceError(
        "Có lỗi xảy ra trong quá trình xử lý",
        500,
        "INTERNAL_SERVER_ERROR",
        process.env.NODE_ENV === 'development' ? error.message : null
      );
    }
  }
}

export default new ProfileService();
```

---

## Testing Requirements

### Unit Tests (REQUIRED - 80% coverage target)

1. **Test: User found with skills**

```javascript
it('should return profile with skills when user exists', async () => {
  // Mock repository
  ProfileRepository.findUserWithSkills = jest.fn().resolves(mockUserWithSkills);
  
  const result = await ProfileService.getUserProfile(1);
  
  expect(result).toHaveProperty('full_name');
  expect(result).toHaveProperty('skills');
  expect(result.skills).toBeInstanceOf(Array);
});
```

1. **Test: User not found**

```javascript
it('should throw USER_NOT_FOUND when user does not exist', async () => {
  ProfileRepository.findUserWithSkills = jest.fn().resolves(null);
  
  await expect(
    ProfileService.getUserProfile(999)
  ).rejects.toThrow(ServiceError);
  
  await expect(
    ProfileService.getUserProfile(999)
  ).rejects.toMatchObject({
    status: 404,
    code: 'USER_NOT_FOUND'
  });
});
```

1. **Test: Account disabled**

```javascript
it('should throw ACCOUNT_DISABLED when is_active = false', async () => {
  ProfileRepository.findUserWithSkills = jest.fn().resolves({
    ...mockUserWithSkills,
    is_active: false
  });
  
  await expect(
    ProfileService.getUserProfile(1)
  ).rejects.toMatchObject({
    status: 403,
    code: 'ACCOUNT_DISABLED'
  });
});
```

1. **Test: User with no skills**

```javascript
it('should return empty skills array when user has no skills', async () => {
  const mockUser = { ...mockUserWithSkills, user_skills: [] };
  ProfileRepository.findUserWithSkills = jest.fn().resolves(mockUser);
  
  const result = await ProfileService.getUserProfile(1);
  
  expect(result.skills).toEqual([]);
});
```

1. **Test: Database error handling**

```javascript
it('should throw INTERNAL_SERVER_ERROR on database error', async () => {
  ProfileRepository.findUserWithSkills = jest.fn().rejects(new Error('DB connection failed'));
  
  await expect(
    ProfileService.getUserProfile(1)
  ).rejects.toMatchObject({
    status: 500,
    code: 'INTERNAL_SERVER_ERROR'
  });
});
```

---

## Performance Considerations

### Query Efficiency

- Total queries: 1 main query lấy profile + active skills theo `user_id`
- Có thể tách làm 2 query nếu repository cần tối ưu readability
- Final scope ưu tiên truy vấn trực tiếp bằng định danh đã được xác thực

### Caching Opportunities

- Cache result với key profile:{email} (TTL 5 minutes)
- Invalidate on profile update (UC19, UC20)

### Optimization (Future)

```javascript
async getUserProfile(userId) {
  const cacheKey = `profile:${userId}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Cache miss - query database
  const profile = await this._fetchProfile(userId);
  
  // Store in cache
  await redis.setex(cacheKey, 300, JSON.stringify(profile));
  
  return profile;
}
```

---

## Contract Status

- **Version**: 1.0
- **Status**: READY FOR IMPLEMENTATION
- **Dependencies**: ProfileRepository (to be implemented)
- **Breaking Changes**: None
- **Last Updated**: 2026-06-30

---

## Changelog

### v1.0 (2026-06-30)

- Initial contract definition
- Defined getUserProfile method
- Specified error codes and business rules
- Added implementation example and test requirements

# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.)

# Kế Hoạch Triển Khai: Thay Đổi Mật Khẩu (Change Password)

**Branch**: `CuongLH` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)

**Input**: Đặc tả tính năng từ `.sdd/CuongLH/UC06-feat-auth-change-password/spec.md`

**Lưu ý**: Kế hoạch này được tạo bởi workflow `/speckit-plan` theo `.specify/templates/plan-template.md`.

## Summary (Tóm tắt)

UC06 triển khai luồng thay đổi mật khẩu an toàn cho người dùng đã đăng nhập. Người dùng cung cấp mật khẩu cũ hiện tại (xác minh quyền sở hữu), nhập mật khẩu mới đáp ứng chính sách bảo mật, và xác nhận. Hệ thống xác minh mật khẩu cũ bằng so sánh bcrypt constant-time, validate mật khẩu mới theo policy (độ dài 8+ chars, uppercase, lowercase, digit, special char), và cập nhật password_hash trong transaction nguyên tử. Phiên làm việc hiện tại được giữ nguyên (không ép logout).

Cách tiếp cận kỹ thuật: Backend sử dụng Express + Prisma + MySQL với kiến trúc phân tầng (Route → Middleware → Controller → Service → Repository), validation Zod ở tầng middleware, bcrypt 12 rounds cho password hashing, transaction database đảm bảo atomicity, audit logging cho mọi lần thay đổi thành công. Frontend dùng React với form 2 trường (oldPassword, newPassword với confirmPassword validation phía client), error handling inline, loading states.

## Technical Context (Bối cảnh kỹ thuật)

**Ngôn ngữ/Phiên bản**: NodeJS v18+ + JavaScript ESM

**Các Dependencies chính**: Express 5.x, Prisma ORM, MySQL 8.x, Zod, bcryptjs (12 rounds), Pino logger

**Lưu trữ**: Cơ sở dữ liệu MySQL với bảng `users` (password_hash field)

**Testing**: Jest + Supertest cho integration tests backend, Jest + React Testing Library cho frontend

**Nền tảng đích**: Web application (Backend REST API + React SPA, desktop-first)

**Loại dự án**: Web service (Backend REST API) + Web application (React SPA)

**Mục tiêu Hiệu Năng**:

- POST /api/v1/auth/change-password < 500ms (p50)
- p95 < 2s với 100 concurrent requests
- Hỗ trợ 100 yêu cầu thay đổi mật khẩu đồng thời

**Ràng buộc**:

- Mật khẩu cũ phải được so sánh bằng bcrypt (constant-time comparison)
- Mật khẩu mới PHẢI được hash bcrypt 12 rounds
- userId PHẢI lấy từ JWT token, KHÔNG từ request body
- Transaction database đảm bảo atomicity
- KHÔNG log mật khẩu plaintext hoặc hashed
- Response time variance < 100ms (ngăn timing attack)

**Quy mô/Phạm vi**:

- Dự kiến: ~20 yêu cầu/ngày trong MVP
- Cơ sở dữ liệu: bảng `users` hiện tại (password_hash field)
- Frontend: form 2-field (oldPassword, newPassword) với confirm validation

## Constitution Check (Kiểm tra hiến pháp)

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Layer 1 (Hard Rules) — Status: ✅ PASS

- ✅ **Lưu trữ Mật khẩu**: Mật khẩu mới PHẢI được hash bằng bcryptjs với BCRYPT_SALT_ROUNDS từ .env (12 rounds) trước khi lưu
- ✅ **Phòng chống SQL Injection**: Sử dụng Prisma ORM với parameterized queries
- ✅ **Không Rò Rỉ Thông Tin**: Response API KHÔNG chứa password_hash, plaintext password, hoặc stack traces
- ✅ **UserId từ JWT**: Lấy user_id từ authenticated JWT token, KHÔNG từ request body
- ✅ **Không Bí Mật trong Git**: Tất cả config trong .env, được gitignore
- ✅ **Xác Thực Input**: Zod schemas cho oldPassword, newPassword, confirmPassword
- ✅ **Authentication**: Middleware xác thực JWT bắt buộc trước endpoint

### Layer 2 (Architecture Constraints) — Status: ✅ PASS

- ✅ **Kiến Trúc Phân Tầng**: Route → Middleware → Controller → Service → Repository
- ✅ **Cross-Module Access**: Chứa trong Auth module, chỉ đọc từ bảng `users`
- ✅ **Module Ownership**: Member 1 - CuongLH, không sửa code members khác
- ✅ **Database Transaction**: Prisma transaction cho atomicity update password
- ✅ **Audit Log**: Log events: CHANGE_PASSWORD_SUCCESS, CHANGE_PASSWORD_FAILED

### Layer 3 (Engineering Standards) — Status: ✅ TARGET

- ✅ **Test Coverage**: 80% cho auth.service.js, 60% cho auth.controller.js
- ✅ **Hiệu Năng**: p95 < 2s với 100 concurrent requests
- ✅ **Linting**: ESLint 0 errors
- ✅ **API Response Format**: ADR-006 standard: `{ success: boolean, data?: any, error?: string }`

## Project Structure (Cấu trúc dự án)

### Documentation (Tài liệu)

```text
.sdd/CuongLH/UC06-feat-auth-change-password/
├── context.md           # ✓ Tuyên bố vấn đề
├── spec.md              # ✓ Đặc tả tính năng
├── plan.md              # ← File này
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/
    ├── api-contract.md      # Phase 1 output
    └── service-contract.md  # Phase 1 output
```

### Source Code (Mã nguồn)

```text
backend/
├── src/
│   ├── controllers/auth.controller.js          # [MODIFY] Thêm changePassword()
│   ├── services/auth.service.js                # [MODIFY] Thêm changePassword() logic
│   ├── repositories/user.repository.js         # [EXISTS] findById(), updatePassword()
│   ├── middlewares/validators/auth.validator.js # [MODIFY] Thêm Zod schema
│   ├── routes/auth.routes.js                   # [MODIFY] Thêm POST route
│   └── utils/response.util.js                  # [EXISTS] Reuse
├── tests/integration/auth.change-password.test.js # [CREATE]
└── prisma/schema.prisma                        # [EXISTS] User model

frontend/
├── src/
│   ├── pages/auth/ChangePasswordPage.jsx       # [CREATE]
│   ├── components/auth/ChangePasswordForm.jsx  # [CREATE]
│   ├── services/authApi.js                     # [MODIFY] Thêm changePassword()
│   ├── hooks/useChangePassword.js              # [CREATE]
│   └── utils/validation.js                     # [MODIFY] Password policy
└── tests/auth/ChangePassword.test.jsx          # [CREATE]
```

**Structure Decision (Quyết định cấu trúc)**:

Web application với backend (Express API) + frontend (React SPA) tách biệt. Tính năng thay đổi mật khẩu ảnh hưởng đến cả hai:

- Backend: Mở rộng Auth module với 1 endpoint mới POST /api/v1/auth/change-password
- Frontend: Tạo page/component form 2-field với confirm validation và error handling
- Database: Tái sử dụng bảng users hiện tại, chỉ cập nhật password_hash

## Complexity Tracking (Theo dõi độ phức tạp)

> Không có vi phạm Constitution nào cần được biện minh cho tính năng này.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Không có | — | — |

## Implementation Phases (Các giai đoạn triển khai)

### Phase 0: Research & Verification (Nghiên cứu & Xác minh) — READ-ONLY

**Objective (Mục tiêu)**: Nghiên cứu các quyết định kỹ thuật quan trọng trước khi thiết kế và triển khai.

**Tasks (Tác vụ nghiên cứu)**:

1. **Constant-Time Password Comparison**: Best practices cho bcrypt.compare() để chống timing attack
2. **Audit Logging Strategy**: Ghi log CHANGE_PASSWORD_SUCCESS/FAILED mà không log mật khẩu
3. **Database Transaction Rollback**: Xử lý lỗi trong transaction cập nhật password
4. **Client-Side Confirm Validation**: sessionStorage persistence cho multi-step form
5. **Error Messages**: User-friendly messages khác nhau cho old password wrong vs new password weak

**Output (Đầu ra)**: `research.md` file với các quyết định kỹ thuật được tài liệu hóa (Decision, Rationale, Alternatives, Implementation).

---

### Phase 1: Design & Contracts (Thiết kế & Hợp đồng) — READ-ONLY

**Objective (Mục tiêu)**: Thiết kế data model, API contracts, service contracts và hướng dẫn phát triển.

**Tasks (Tác vụ thiết kế)**:

1. **Data Model (Mô hình dữ liệu)** — Thiết kế schema và data flow
2. **API Contracts (Hợp đồng API)** — Thiết kế endpoint và request/response format
3. **Service Contracts (Hợp đồng dịch vụ)** — Định nghĩa interface business logic
4. **Quick Start Guide (Hướng dẫn nhanh)** — Hướng dẫn developer setup và test

**Output (Đầu ra)**: 4 files (`data-model.md`, `contracts/api-contract.md`, `contracts/service-contract.md`, `quickstart.md`)

#### 1. Data Model (Mô hình dữ liệu)

**Entities**:

- User: password_hash field update via bcrypt
- AuditLog: CHANGE_PASSWORD_SUCCESS events

**Data Flow**:

1. Request: { oldPassword, newPassword, confirmPassword }
2. Validate: oldPassword matches bcrypt(user.password_hash)
3. Validate: newPassword meets policy (8+ chars, upper, lower, digit, special)
4. Validate: newPassword === confirmPassword
5. Hash: bcrypt(newPassword, 12 rounds) → newHash
6. Transaction: UPDATE users SET password_hash = newHash WHERE id = userId
7. Response: { success: true, message: "Mật khẩu đã được thay đổi thành công" }

#### 2. API Contracts (Hợp đồng API)

**Endpoint**: POST /api/v1/auth/change-password

**Request**:

```json
{
  "oldPassword": "string (required)",
  "newPassword": "string (required)",
  "confirmPassword": "string (required)"
}
```

**Response 200**:

```json
{
  "success": true,
  "data": {
    "message": "Mật khẩu đã được thay đổi thành công"
  }
}
```

**Response Errors**:

- 400: Validation failed (oldPassword format, newPassword weak, confirm mismatch)
- 401: Unauthorized (no JWT token)
- 403: Account inactive
- 500: Database error

#### 3. Service Contracts (Hợp đồng dịch vụ)

**AuthService.changePassword()**:

```javascript
/**
 * Thay đổi mật khẩu cho user đã xác thực
 * @param {number} userId - ID người dùng từ JWT
 * @param {string} oldPassword - Mật khẩu cũ để xác minh
 * @param {string} newPassword - Mật khẩu mới (đã validate policy)
 * @returns {Promise<{success: boolean, message: string}>}
 * @throws {ServiceError} 400 - Mật khẩu cũ không đúng
 * @throws {ServiceError} 403 - Tài khoản không active
 */
async changePassword(userId, oldPassword, newPassword)
```

**UserRepository interface**:

```javascript
/**
 * @returns {Promise<{id: number, password_hash: string, is_active: boolean}>}
 */
async findById(userId)

/**
 * @param {number} userId
 * @param {string} newHash - bcrypt hash của mật khẩu mới
 * @returns {Promise<void>}
 */
async updatePassword(userId, newHash)
```

#### 4. Quick Start Guide (Hướng dẫn nhanh)

Content outline:

1. Prerequisites (Node.js 18+, MySQL 8+)
2. Environment setup (.env)
3. Database setup (Prisma migrate)
4. Running backend/frontend
5. Testing with curl/Postman
6. Troubleshooting

---

### Phase 2: Implementation Planning (Lập kế hoạch triển khai) — READY FOR APPROVAL

**Objective (Mục tiêu)**: Break down implementation into atomic tasks.

**Note (Lưu ý)**: Phase này sẽ được thực hiện bằng command `/speckit-tasks` sau khi plan được approve. File `tasks.md` sẽ chứa atomic task breakdown chi tiết.

**Expected Output (Đầu ra dự kiến)**: `tasks.md` với atomic task breakdown:

- Task 1: Tạo Zod validation schema cho change password
- Task 2: Triển khai AuthService.changePassword() business logic
- Task 3: Thêm changePassword() vào AuthController
- Task 4: Thêm POST route vào auth.routes.js + Swagger docs
- Task 5: Viết integration tests backend (happy path + error paths)
- Task 6: Tạo ChangePasswordForm component frontend
- Task 7: Tạo ChangePasswordPage và useChangePassword hook
- Task 8: Viết unit tests frontend

**Dependencies (Phụ thuộc & Thứ tự thực hiện)**:

```
Phase 0: Research (no dependencies)
  ↓
Phase 1a: Data Model (depends on Phase 0)
  ↓
Phase 1b: API Contracts (depends on Phase 0)
  ↓
Phase 1c: Backend Implementation (depends on 1a, 1b)
  ↓
Phase 1d: Frontend Implementation (depends on 1b) ← Parallel with 1c
  ↓
Phase 1e: Integration Testing (depends on 1c, 1d)
```

### Key Business Logic (Logic nghiệp vụ chính)

```javascript
async changePassword(userId, oldPassword, newPassword) {
  // 1. Get user by userId
  const user = await userRepository.findById(userId);
  if (!user || !user.is_active) throw new ServiceError("Account inactive", 403);

  // 2. Compare oldPassword with bcrypt
  const isValid = await bcrypt.compare(oldPassword, user.password_hash);
  if (!isValid) throw new ServiceError("Old password incorrect", 400);

  // 3. Hash newPassword
  const newHash = await bcrypt.hash(newPassword, 12);

  // 4. Update in transaction
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { password_hash: newHash }
    });
  });

  // 5. Audit log
  logger.info('CHANGE_PASSWORD_SUCCESS', { userId, timestamp: new Date() });

  return { success: true, message: "Password changed successfully" };
}
```

### Testing Strategy (Chiến lược kiểm thử)

**Backend Tests** (80% coverage target):

1. Happy path: oldPassword correct → password updated
2. oldPassword wrong → 400 error
3. newPassword weak → validation error
4. confirmPassword mismatch → 400 error
5. No JWT token → 401 error
6. Concurrent requests → no race condition
7. SMTP/transaction failure → proper rollback

**Frontend Tests** (60% target):

1. Form renders correctly
2. Validation errors display
3. Submit button disabled on validation failure
4. API error handling
5. Success toast notification

---

## Risk Assessment (Đánh giá rủi ro)

### HIGH RISK (Rủi ro cao)

- **Timing Attack**: So sánh mật khẩu không constant-time có thể cho phép kẻ tấn công đoán mật khẩu qua thời gian phản hồi. Risk: Lộ mật khẩu người dùng.
  - **Mitigation**: Sử dụng bcrypt.compare() vốn đã constant-time. Thêm random delay nhỏ nếu cần.

- **Password Leak in Logs**: Ghi log mật khẩu plaintext hoặc hashed. Risk: Lộ mật khẩu qua system logs.
  - **Mitigation**: KHÔNG log bất kỳ field mật khẩu nào. Chỉ log userId + timestamp.

- **IDOR Attack**: userId lấy từ request body thay vì JWT. Risk: User có thể đổi mật khẩu của người khác.
  - **Mitigation**: userId LUÔN lấy từ req.user.id (JWT đã xác thực).

### MEDIUM RISK (Rủi ro trung bình)

- **Race Condition**: Nhiều request đổi mật khẩu đồng thời. Risk: Trạng thái không nhất quán.
  - **Mitigation**: Database transaction với row-level lock.

### LOW RISK (Rủi ro thấp)

- **Brute Force mật khẩu cũ không thành công**: Kẻ tấn công đoán mật khẩu cũ nhiều lần. Risk: Khóa tài khoản không cần thiết.
  - **Mitigation**: Không giới hạn số lần thử mật khẩu cũ (user đã authenticated). Login endpoint đã có rate limiting riêng.

---

## Success Criteria Review (Xem xét tiêu chí thành công)

Mapping từ spec.md Success Criteria sang implementation deliverables:

- **SC-001**: Người dùng đã đăng nhập có thể thay đổi mật khẩu thành công khi cung cấp đúng mật khẩu cũ và mật khẩu mới hợp lệ → Verify bằng integration test happy path
- **SC-002**: Hệ thống từ chối thay đổi mật khẩu nếu mật khẩu cũ không chính xác → Verify bằng integration test error path (400)
- **SC-003**: Hệ thống từ chối mật khẩu mới không đáp ứng chính sách bảo mật → Verify bằng unit test Zod validation
- **SC-004**: Hệ thống từ chối nếu confirmPassword không khớp newPassword → Verify bằng unit test Zod validation
- **SC-005**: Mật khẩu mới được hash bằng bcrypt 12 rounds trước khi lưu → Verify bằng unit test service layer
- **SC-006**: Response time không thay đổi đáng kể dù mật khẩu cũ đúng hay sai → Verify bằng performance test (variance < 100ms)

---

## Deployment Checklist (Danh sách kiểm tra triển khai)

Trước khi merge vào main branch:

- [ ] Tất cả integration tests pass (happy path + error paths)
- [ ] Unit test coverage ≥ 80% cho auth.service.js
- [ ] ESLint 0 errors
- [ ] Swagger documentation đã cập nhật trong auth.routes.js
- [ ] share_context.md đã cập nhật API contract
- [ ] Không có TODO/FIXME comments
- [ ] Audit log CHANGE_PASSWORD_SUCCESS được ghi nhận
- [ ] Đã test với MySQL 8.x thực tế (không chỉ mock)

---

## Questions for Stakeholders (Câu hỏi cho các bên liên quan)

1. **Session handling after password change**: Có nên ép logout tất cả thiết bị khác sau khi đổi mật khẩu không?
   - **Context**: JWT là stateless, không thể invalidate token đã phát hành. Nếu muốn ép logout, cần thêm cơ chế token blacklist hoặc versioning.
   - **Options**: (A) Giữ nguyên session hiện tại, không ép logout thiết bị khác, (B) Ép logout tất cả thiết bị bằng cách tăng token version trong DB
   - **Recommendation**: (A) cho MVP, xem xét (B) cho production

---

## Next Steps (Các bước tiếp theo)

1. Phase 0 Execution: Tạo research.md
2. Phase 1 Execution: Tạo data-model.md, contracts/api-contract.md, contracts/service-contract.md, quickstart.md
3. Agent Context Update: Cập nhật CLAUDE.md
4. Constitution Re-check: Xác minh gates vẫn vượt qua
5. Run `/speckit-tasks` để generate tasks.md sau khi plan được approve

---

**Plan Status (Trạng thái kế hoạch)**: READY FOR REVIEW
**Estimated Effort (Thời gian ước tính)**: 4-6 hours (breakdown: Phase 0: 1h, Phase 1: 2h, Phase 2: 3h)
**Priority (Độ ưu tiên)**: P1

**Checklist Phê Duyệt**:

- [x] Technical Context rõ ràng
- [x] Constitution Check vượt qua
- [x] Project Structure ánh xạ tới thư mục thực tế
- [x] Research tasks được xác định
- [x] Data model được phác thảo
- [x] API contracts được chỉ định
- [x] Service contracts được định nghĩa
- [x] Implementation approach rõ ràng
- [x] Rủi ro được xác định và có mitigation
- [x] Success Criteria được mapping sang test deliverables
- [x] Deployment Checklist đầy đủ
- [x] Questions for Stakeholders được nêu rõ

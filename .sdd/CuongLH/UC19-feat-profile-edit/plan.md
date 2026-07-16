# Implementation Plan: Cập nhật hồ sơ cơ bản (UC19 - Edit Profile)

**Branch**: `002-profile-edit` | **Date**: 2026-06-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.sdd/CuongLH/UC19-feat-profile-edit/spec.md`

## Summary

Feature này cung cấp API an toàn cho phép tình nguyện viên cập nhật thông tin cá nhân cơ bản (họ tên, số điện thoại) và ảnh đại diện (avatar) của chính mình.
API hỗ trợ cập nhật từng phần (PATCH) và sử dụng Server-side upload qua Cloudinary. Nếu người dùng đổi ảnh, hệ thống tự động xóa ảnh cũ trên Cloudinary để tiết kiệm dung lượng.

## Technical Context

**Language/Version**: Node.js 18+ + JavaScript ESM

**Primary Dependencies**:

- Express 5.x
- Multer (để parse multipart/form-data)
- Cloudinary SDK
- Prisma ORM
- Zod (validation)

**Storage**: MySQL (lưu thông tin) + Cloudinary (lưu ảnh)

**Testing**: Jest + Supertest

**Target Platform**: Backend REST API

**Performance Goals**: < 3s cho text updates, < 10s cho image upload

**Constraints**:

- Phải dùng PATCH (partial update)
- Server-side upload tới Cloudinary
- Max file size 5MB (chỉ jpg, jpeg, png)
- Chỉ lấy user_id từ JWT token (chống IDOR)
- Rollback transaction nếu upload thất bại

**Scale/Scope**:

- 1 API Endpoint: `PATCH /api/v1/user/me`
- Read/Write table `users`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ Layered architecture: Controller → Service → Repository
- ✅ Khởi tạo transaction khi update DB kết hợp với external API (Cloudinary)
- ✅ Input validation dùng Zod, File validation dùng Multer
- ✅ Authorization thông qua JWT httpOnly Cookie
- ✅ Field mapping: API request dùng `phone_number` -> DB dùng `phone`

## Project Structure

### Documentation (this feature)

```text
.sdd/CuongLH/UC19-feat-profile-edit/
├── context.md           # Problem statement
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
    ├── api-contract.md
    └── service-contract.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/
│   │   └── profile.controller.js      # [MODIFY] Thêm hàm updateProfile
│   ├── services/
│   │   ├── profile.service.js         # [MODIFY] Thêm hàm updateProfile
│   │   └── cloudinary.service.js      # [CREATE] Wrapper cho Cloudinary API
│   ├── repositories/
│   │   └── profile.repository.js      # [MODIFY] Thêm hàm updateUser
│   ├── middlewares/
│   │   └── upload.middleware.js       # [CREATE] Cấu hình Multer cho file upload
│   ├── validators/
│   │   └── profile.validator.js       # [CREATE] Zod schema cho Edit Profile
│   └── routes/
│       └── user.routes.js             # [MODIFY] Route PATCH /me
└── tests/
    └── integration/
        └── profile.test.js            # [MODIFY] Thêm test cho Edit Profile
```

**Structure Decision**: Option 2: Web application.

## Implementation Phases

### Phase 0: Research & Verification (READ-ONLY)

**Objective**: Khảo sát codebase hiện có, xác định Multer/Cloudinary integration, và xác minh transaction strategy

**Tasks**:

1. **Verify Multer Configuration** - Kiểm tra `backend/src/middlewares/upload.middleware.js`:
   - Multer setup cho `multipart/form-data` parsing
   - Field name mapping (file input field name)
   - Temp file storage location
   - File size limit enforcement (5MB)
   - Supported MIME types validation (jpg, jpeg, png)

2. **Verify Cloudinary Integration** - Tìm hiểu Cloudinary SDK:
   - API credentials setup (CLOUDINARY_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET từ .env)
   - Upload method: `cloudinary.uploader.upload()`
   - Delete method: `cloudinary.api.delete_resources()`
   - Error handling cho upload failure
   - Response structure: `public_id`, `secure_url`

3. **Verify Auth Middleware** - Đọc `backend/src/middleware/auth.middleware.js`:
   - JWT token lấy từ httpOnly cookie
   - `req.user` chứa `user_id` hoặc `sub`?
   - Error codes: `UNAUTHORIZED`, `TOKEN_INVALID`

4. **Review Response Utilities** - Đọc `backend/src/utils/response.util.js`:
   - Format: `{ success, message, data }`
   - Functions: `successResponse()`, `errorResponse()`
   - `ServiceError` class structure

5. **Review DATABASE.md Schema** - Xác nhận bảng `users`:
   - Các field: `id`, `email`, `full_name`, `phone`, `avatar_url`, `is_active`
   - Data types và constraints
   - Indexes trên `id` (PRIMARY)

6. **Transaction Strategy Research** - Tìm hiểu Prisma transaction:
   - Cách handle nested transactions (update user + delete old avatar từ Cloudinary)
   - Rollback nếu Cloudinary API fail
   - Error logging cho transaction failures

**Output**: `research.md` với findings về Multer, Cloudinary, transaction strategy, và identified gaps

---

### Phase 1: Design & Contracts (READ-ONLY)

**Objective**: Thiết kế data model, API contracts, và service interfaces trước khi implement

**Tasks**:

#### 1.1 Database Schema Design (`data-model.md`)

**Content**:

- Mô tả bảng `users` - field `avatar_url` hiện tại có những giới hạn gì?
- Field `phone` trong DB vs `phone_number` trong API response (field mapping)
- Các field nội bộ phải loại bỏ khỏi response (password_hash, role_id, etc.)
- Transactional scenario: update avatar_url ATOMICALLY (không được update mà fail Cloudinary delete)

#### 1.2 API Contract (`contracts/api-contract.md`)

**Content**:

- Endpoint: `PATCH /api/v1/user/me` (partial update)
- Request:
  - `Content-Type: multipart/form-data`
  - Optional fields: `full_name`, `phone_number`, `avatar` (file)
  - Validation rules từ spec (full_name length, phone format, file size)
- Success response (200): Updated user object
- Error responses:
  - 400: Validation failed (weak validation, invalid file)
  - 401: Unauthorized (missing/invalid JWT)
  - 409: Conflict (transaction rollback)
  - 413: Payload too large (> 5MB)
  - 500: Cloudinary API error (silently fail file upload?)

#### 1.3 Service Contract (`contracts/service-contract.md`)

**Content**:

- Input: `userId` (từ JWT), `updateData` (full_name, phone_number), `file` (multipart)
- Output: Updated `User` object với field mapping (phone_number)
- Throws: `ValidationError`, `CloudinaryError`, `TransactionError`
- Dependency: Cloudinary service, User repository, transaction handling
- Side effect: Delete old avatar từ Cloudinary nếu avatar mới được upload

#### 1.4 Quick Start Guide (`quickstart.md`)

**Content**:

- Prerequisites: Cloudinary account setup, .env configuration
- Cloudinary credentials setup (CLOUDINARY_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET)
- Testing workflow với curl/Postman:
  - PATCH /api/v1/user/me với multipart file
  - Verify avatar updated on Cloudinary
  - Verify old avatar deleted
- Frontend integration example với FormData + fetch/axios
- Troubleshooting: CORS issues, Cloudinary auth fail, temp file cleanup

**Output**: 4 files (`data-model.md`, `contracts/api-contract.md`, `contracts/service-contract.md`, `quickstart.md`)

---

### Phase 2: Implementation Planning (READY FOR APPROVAL)

**Objective**: Chi tiết hóa các atomic tasks để implement feature

**Note**: Phase này sẽ được thực hiện bằng command `/speckit-tasks` sau khi plan được approve

**Expected Output**: `tasks.md` với breakdown:

- Task 1: Setup Multer middleware configuration
- Task 2: Integrate Cloudinary SDK + wrapper service
- Task 3: Implement ProfileService.updateProfile() với transaction
- Task 4: Implement ProfileRepository.updateUser()
- Task 5: Implement ProfileController.updateProfile()
- Task 6: Update user.routes.js PATCH /me endpoint
- Task 7: Create profile validator (Zod schemas)
- Task 8: Write unit tests (Service + Repository)
- Task 9: Write integration tests (upload flow, rollback, error cases)
- Task 10: Frontend FormData + file upload integration

**Dependencies**: Tasks phải theo thứ tự vì dependency chain (Middleware → Service → Repository → Controller → Routes → Tests)

---

## Risk Assessment

### HIGH RISK

- **Cloudinary API Integration**: Nếu upload fail sau update DB, dữ liệu không consistent (avatar_url pointing to deleted resource). Risk: User upload avatar → update DB thành công → Cloudinary delete old fail → inconsistent state.
  - **Mitigation**: Wrap update DB + Cloudinary delete trong Prisma transaction. Nếu delete fail, rollback DB update.

- **File Upload Security**: Nếu không validate file format đúng, có thể upload malicious files. Risk: RCE hoặc XSS.
  - **Mitigation**: Validate MIME type (jpg, jpeg, png), magic bytes check, file size limit (5MB), Cloudinary resource cleanup.

- **Multer Temp File Cleanup**: Nếu temp files không được delete, disk space tăng. Risk: Server chạy hết disk.
  - **Mitigation**: Multer `storage` cleanup, verify temp directory periodic cleanup, monitoring.

### MEDIUM RISK

- **Cloudinary Rate Limiting**: Nếu delete old avatar fail vì rate limit, transaction rollback. Risk: User spam upload avatars → Cloudinary blocks requests.
  - **Mitigation**: Implement exponential backoff retry, log rate limit errors, monitor quota.

- **Partial Update Logic**: PATCH endpoint phải handle partial updates (chỉ update full_name hoặc chỉ avatar). Risk: Nếu cập nhật 1 field fail, không update field khác.
  - **Mitigation**: Use Prisma `findUnique` + conditional `update()`, test all combinations (name only, avatar only, both).

- **Field Mapping Bug**: phone_number từ API → phone trong DB. Risk: Mapping sai → dữ liệu inconsistent.
  - **Mitigation**: Unit test với explicit mapping, use Prisma `select` explicit fields.

### LOW RISK

- **Performance**: Upload qua Cloudinary có thể chậm (10s goal). Risk: Users complain chậm.
  - **Mitigation**: Async upload, progress tracking frontend, performance test với different file sizes.

- **Avatar URL Migration**: Nếu avatar field từ URL khác (ví dụ file server) → Cloudinary, cần migration. Risk: Old avatars lost.
  - **Mitigation**: Batch migration script, keep old URLs during transition, verify before deploy.

---

## Success Criteria Review

Mapping từ spec.md Success Criteria sang implementation deliverables:

- **SC-001** (Text update < 3s): Integration test với `full_name` + `phone_number` update (no file)
- **SC-002** (Avatar upload < 10s): Integration test với 5MB image file upload to Cloudinary
- **SC-003** (Partial update works): Test update only full_name, only avatar, both
- **SC-004** (Old avatar deleted): Verify Cloudinary delete API called + old public_id removed
- **SC-005** (IDOR prevention): Test không thể update user_id khác từ request (userId từ JWT only)
- **SC-006** (Validation works): Test weak full_name, invalid phone, oversized file → 400 errors
- **SC-007** (Transaction consistency): Simulate Cloudinary delete fail → verify DB rollback

---

## Deployment Checklist

Trước khi merge vào main branch:

- [ ] Multer middleware configuration reviewed và tested
- [ ] Cloudinary credentials setup trong .env (không commit secrets)
- [ ] Prisma transaction logic tested với rollback scenarios
- [ ] Unit tests pass (80%+ coverage cho ProfileService)
- [ ] Integration tests pass (upload flow, partial update, error cases)
- [ ] File size limit enforced (5MB)
- [ ] File type validation (jpg, jpeg, png only)
- [ ] Old avatars successfully deleted from Cloudinary
- [ ] Temp files cleaned up after upload
- [ ] IDOR vulnerability tested (userId từ JWT, không từ body)
- [ ] Security review: No file path traversal, no executable uploads
- [ ] API documentation (Swagger) updated
- [ ] Frontend integration tested (FormData, multipart)
- [ ] Code review approved bởi ít nhất 1 member khác
- [ ] CONSTITUTION.md compliance checked (transaction, security, field mapping)

---

## Next Steps

1. **Review plan này** - Team lead review và approve plan
2. **Cloudinary Setup Decision** - Quyết định sử dụng Cloudinary hay upload tới file server (khuyến nghị: Cloudinary per spec)
3. **Transaction Strategy Confirmation** - Xác minh rollback behavior nếu Cloudinary API fail
4. **File Size Policy** - Confirm max file size 5MB + supported formats (jpg, jpeg, png)
5. **Review bộ docs hiện tại** - Đảm bảo research.md, data-model.md, contracts/, quickstart.md đã đồng bộ
6. **Run `/speckit-tasks`** - Generate tasks.md với atomic task breakdown (Phase 2)
7. **Start implementation** - Thực hiện các tasks theo thứ tự dependencies

## Questions for Stakeholders

1. **Old Avatar Handling**: Nếu user không có avatar trước đó, DELETE call Cloudinary có lỗi không? Cần handle explicitly?
2. **Avatar Size Limits**: 5MB limit có apply cho cả width/height? Có resizing yêu cầu không (thumbnail)?
3. **Rollback Behavior**: Nếu Cloudinary delete fail, nên return 409 hay 200? (Current: 409 per spec)
4. **Temp File Storage**: Multer lưu temp files ở đâu? `/tmp` hay tùy chỉnh?
5. **Retry Strategy**: Cloudinary timeout/fail có nên retry tự động hay fail immediately?

---

**Plan Status**: ACCEPTED
**Estimated Effort**: 20-28 hours (1 developer, including Cloudinary integration + transaction handling + tests)
**Priority**: P1 (Core feature - avatar upload critical for user experience)

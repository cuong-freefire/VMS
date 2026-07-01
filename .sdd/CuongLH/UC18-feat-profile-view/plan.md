# Implementation Plan: Xem hồ sơ cá nhân (View Profile)

**Branch**: `feat/UC18-view-profile` | **Date**: 2026-06-30 | **Spec**: [spec.md](.sdd/CuongLH/UC18-feat-profile-view/spec.md)

**Input**: Feature specification from `.sdd/CuongLH/UC18-feat-profile-view/spec.md`

## Summary

Feature này cung cấp API endpoint cho người dùng đã đăng nhập xem thông tin hồ sơ cá nhân của chính mình (Private Profile). API trả về thông tin cơ bản (tên, email, số điện thoại, avatar) kèm danh sách kỹ năng đã đăng ký, đồng thời đảm bảo bảo mật bằng cách loại bỏ hoàn toàn các trường nhạy cảm (password, token, internal IDs) khỏi response.

**Technical Approach**:

- Sử dụng Auth Middleware để xác thực JWT token và lấy định danh người dùng đã được xác thực từ `req.user`
- Tạo Service layer để truy vấn database với Prisma (chưa có Prisma schema, cần tạo mới)
- Tạo Repository layer để tách biệt data access logic
- Implement data sanitization để loại bỏ các trường nhạy cảm
- Tuân thủ kiến trúc phân tầng: Controller → Service → Repository

## Technical Context

**Language/Version**: Node.js 18+ + JavaScript (ESM)

**Primary Dependencies**:

- Express 5.x (REST API framework)
- Prisma ORM (database access - **CẦN SETUP**)
- MySQL (database)
- Zod (validation)
- JWT + bcryptjs (authentication - đã có)
- Pino (logging)

**Storage**: MySQL database với các bảng:

- `users` (thông tin người dùng)
- `user_skills` (bảng trung gian many-to-many)
- `skills` (danh mục kỹ năng)

**Testing**: Jest + Supertest (integration tests)

**Target Platform**: Node.js server runtime

**Project Type**: Web service (RESTful API)

**Performance Goals**:

- Response time < 300ms (normal load)
- Response time < 1s (200 concurrent requests)
- Support 200+ concurrent users

**Constraints**:

- MUST enforce JWT authentication via httpOnly cookie
- MUST sanitize all sensitive fields from response
- MUST use user identity from JWT token only (NOT from request params/body)
- MUST follow layered architecture (Controller → Service → Repository)
- Response MUST follow project standard: `{ success, message, data }`

**Scale/Scope**:

- Single API endpoint: GET `/api/v1/user/me`
- Expected ~10k active users
- Read-only operation (no data mutation)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Architecture Compliance**:

- ✅ Layered architecture: Controller → Service → Repository (tuân thủ AGENTS.md Section 6)
- ✅ Module ownership: Member 1 (CuongLH) owns Profile Management (tuân thủ CLAUDE.md Section 1)
- ✅ Cross-module: Không gọi Repository của module khác (tuân thủ AGENTS.md Section 5)
- ✅ Response format: Sử dụng `response.util.js` (tuân thủ ADR-006)
- ✅ Authentication: JWT HttpOnly Cookie (tuân thủ ADR-002)
- ✅ Database access: Prisma ORM only (tuân thủ ADR-001)
- ✅ Validation: Zod cho input validation (tuân thủ ADR-003)

**Security Compliance**:

- ✅ UserId từ JWT token, KHÔNG từ request body (tuân thủ Lesson 3)
- ✅ Data sanitization: Loại bỏ password_hash, tokens (tuân thủ DATABASE.md Section 12)
- ✅ Soft delete: Query phải filter `is_active = true` (tuân thủ ADR-005)

**Code Quality**:

- ✅ Max function length: 40 lines (tuân thủ AGENTS.md Section 7)
- ✅ Max file length: 300 lines (tuân thủ AGENTS.md Section 7)
- ✅ Test coverage: 80% cho Service layer (tuân thủ AGENTS.md Section 7)
- ✅ Comments: Chỉ giải thích WHY, không giải thích WHAT (tuân thủ AGENTS.md Section 7)

**Violations**: NONE - Feature hoàn toàn tuân thủ constitution

## Project Structure

### Documentation (this feature)

```text
.sdd/CuongLH/UC18-feat-profile-view/
├── spec.md              # Feature specification (ĐÃ CÓ)
├── context.md           # Problem statement (ĐÃ CÓ)
├── plan.md              # This file (implementation plan)
├── research.md          # Technical research (ĐÃ CÓ)
├── data-model.md        # Database schema & queries (ĐÃ CÓ)
├── quickstart.md        # API usage examples (ĐÃ CÓ)
├── contracts/           # API contracts (ĐÃ CÓ)
│   ├── api-contract.md
│   └── service-contract.md
└── tasks.md             # Atomic tasks breakdown (CHƯA TẠO)
```

### Source Code (repository root)

```text
backend/
├── prisma/
│   ├── schema.prisma          # [CREATE] Prisma schema definition
│   └── migrations/            # [AUTO-GENERATED] Prisma migrations
│
├── src/
│   ├── controllers/
│   │   └── profile.controller.js    # [CREATE] Profile controller
│   │
│   ├── services/
│   │   └── profile.service.js       # [CREATE] Profile business logic
│   │
│   ├── repositories/
│   │   └── profile.repository.js    # [CREATE] Profile data access
│   │
│   ├── validators/
│   │   └── profile.validator.js     # [CREATE] Profile request validation (optional)
│   │
│   ├── routes/
│   │   └── user.routes.js           # [MODIFY] Add GET /me endpoint
│   │
│   ├── middleware/
│   │   └── auth.middleware.js       # [EXISTING] JWT authentication
│   │
│   └── utils/
│       ├── response.util.js         # [EXISTING] Standard response format
│       └── jwt.util.js              # [EXISTING] JWT utilities
│
└── tests/
    ├── integration/
    │   └── profile.test.js          # [CREATE] API integration tests
    │
    └── unit/
        ├── profile.service.test.js  # [CREATE] Service layer unit tests
        └── profile.repository.test.js # [CREATE] Repository unit tests

frontend/
├── src/
│   ├── components/
│   │   └── pages/
│   │       └── ProfilePage.jsx      # [CREATE] Profile view page
│   │
│   ├── api/
│   │   └── profileApi.js            # [CREATE] Profile API client
│   │
│   └── services/
│       └── profile.service.js       # [CREATE] Profile frontend service
│
└── tests/
    └── ProfilePage.test.jsx         # [CREATE] Profile page component tests
```

**Structure Decision**:
Feature này tuân thủ kiến trúc Web Application với Backend (Express + Prisma) và Frontend (React). Backend sử dụng layered architecture (Controller → Service → Repository) để tách biệt concerns và dễ dàng test/maintain. Frontend sử dụng component-based architecture với API client layer.

## Implementation Phases

### Phase 0: Research & Verification (READ-ONLY)

**Objective**: Khảo sát codebase hiện có, xác định dependencies, và xác minh technical feasibility

**Tasks**:

1. **Verify Auth Middleware** - Đọc `backend/src/middleware/auth.middleware.js` để xác nhận:
   - JWT token được lấy từ cookie nào? (hiện tại: `req.cookies.token`)
   - `req.user` chứa những trường gì? (cần xác minh payload structure và độ lệch với spec)
   - Error codes hiện có: `UNAUTHORIZED`, `TOKEN_INVALID`

2. **Verify Response Utilities** - Đọc `backend/src/utils/response.util.js` để xác nhận:
   - Format: `{ success, message, data/code/details }`
   - Functions: `successResponse(data, message)`, `errorResponse(message, code, details)`
   - `ServiceError` class structure

3. **Check Prisma Setup** - Xác minh trạng thái Prisma:
   - ❌ `backend/prisma/schema.prisma` CHƯA TỒN TẠI (cần tạo mới)
   - Cần setup Prisma từ đầu: `npx prisma init`
   - Cần define models: User, Skill, UserSkill

4. **Review DATABASE.md Schema** - Đọc schema từ DATABASE.md Section 3:
   - Table `users`: id, email, password_hash, full_name, phone, avatar_url, role_id, is_active, email_verified
   - Table `skills`: id, name, description, is_active
   - Table `user_skills`: id, user_id, skill_id (many-to-many)
   - Indexes: PRIMARY, UNIQUE(email), INDEX(is_active)

5. **Document Findings** - Tạo `research.md` với:
   - Current authentication flow diagram
   - Database schema ERD (users ↔ user_skills ↔ skills)
   - Gap giữa code hiện tại và scope của `context.md`/`spec.md`
   - Identified risks/blockers

**Output**: `research.md` file với technical findings và architecture decisions

---

### Phase 1: Design & Contracts (READ-ONLY)

**Objective**: Thiết kế data models, API contracts, và service interfaces trước khi code

**Tasks**:

#### 1.1 Database Schema Design (`data-model.md`)

**Content**:

- Mô tả 3 bảng nguồn dữ liệu: `users`, `skills`, `user_skills`
- Ghi rõ field response theo scope của spec: `full_name`, `email`, `phone_number`, `avatar_url`, `skills`
- Thể hiện mapping giữa `users.phone` trong database và `phone_number` trong API response
- Chỉ rõ các field nội bộ phải loại bỏ khỏi response
- Chỉ rõ điều kiện lọc `skills.is_active = true` và cách xử lý `skills: []`

#### 1.2 API Contract (`contracts/api-contract.md`)

**Content**:

- Định nghĩa endpoint `GET /api/v1/user/me`
- Chỉ rõ auth qua JWT trong httpOnly cookie
- Ví dụ success response với field `phone_number` theo spec
- Bao phủ đầy đủ các lỗi: `UNAUTHORIZED`, `TOKEN_INVALID`, `USER_NOT_FOUND`, `ACCOUNT_DISABLED`, `INTERNAL_SERVER_ERROR`
- Nhấn mạnh self-view only và không nhận định danh từ client

#### 1.3 Service Contract (`contracts/service-contract.md`)

**Content**:

- Input là định danh người dùng đã được JWT xác thực
- Output phải dùng `phone_number` để khớp spec
- Throws các lỗi nghiệp vụ chuẩn của UC18
- Chỉ rõ dependency vào repository và logic sanitize/transformation

#### 1.4 Quick Start Guide (`quickstart.md`)

**Content**:

- Mô tả cách test bằng curl và Postman
- Ví dụ frontend integration với `withCredentials: true`
- Expected response phải dùng `phone_number`
- Có đủ happy path và error path cơ bản

**Output**: 4 files (`data-model.md`, `contracts/api-contract.md`, `contracts/service-contract.md`, `quickstart.md`)

---

### Phase 2: Implementation Planning (READY FOR APPROVAL)

**Objective**: Chi tiết hóa các atomic tasks để implement feature

**Note**: Phase này sẽ được thực hiện bằng command `/speckit-tasks` sau khi plan được approve

**Expected Output**: `tasks.md` với breakdown:

- Task 1: Setup Prisma schema và migrations
- Task 2: Implement ProfileRepository
- Task 3: Implement ProfileService với data sanitization
- Task 4: Implement ProfileController
- Task 5: Update user.routes.js
- Task 6: Write unit tests (Service + Repository)
- Task 7: Write integration tests
- Task 8: Frontend ProfilePage component
- Task 9: Frontend API client
- Task 10: End-to-end testing

**Dependencies**: Tasks phải được thực hiện theo thứ tự vì có dependency chain (Database → Repository → Service → Controller → Routes → Tests)

---

## Risk Assessment

### HIGH RISK

- **Prisma chưa được setup**: Backend hiện tại chưa có Prisma schema. Cần setup toàn bộ Prisma từ đầu (init, schema, migrate). Risk: Có thể conflict với database hiện có hoặc cần refactor authentication code.
  - **Mitigation**: Đọc kỹ DATABASE.md, tạo schema từ spec, test migration trên dev DB trước.

### MEDIUM RISK

- **Data sanitization**: Cần đảm bảo TUYỆT ĐỐI không trả về password_hash hoặc các trường nhạy cảm. Risk: Nếu quên sanitize, gây lỗ hổng bảo mật nghiêm trọng.
  - **Mitigation**: Sử dụng Prisma select explicit fields, tạo utility function sanitizeUser(), write specific test cases cho data leakage.

- **JWT payload structure**: Scope của `context.md` và `spec.md` yêu cầu định danh người dùng từ JWT, nhưng implementation hiện tại có thể chưa khớp hoàn toàn. Risk: Code và docs lệch nhau nếu không chốt strategy sớm.
  - **Mitigation**: Phase 0 research phải verify `jwt.util.js` và `auth.service.js`, sau đó chốt rõ cách đáp ứng yêu cầu định danh trong tầng auth/service.

### LOW RISK

- **Performance**: Query join 3 tables (users + user_skills + skills) có thể chậm nếu không index đúng. Risk: Response time > 300ms.
  - **Mitigation**: DATABASE.md đã define indexes, Prisma sẽ sử dụng indexes tự động, test performance với 200 concurrent requests.

## Success Criteria Review

Mapping từ spec.md Success Criteria sang implementation deliverables:

- **SC-001** (Response < 1s): Đo bằng integration test với load testing tool (artillery/k6)
- **SC-002** (Block 100% unauthorized): Integration test với invalid/missing token
- **SC-003** (No data leakage): Unit test verify response KHÔNG chứa password_hash, role_id, etc.
- **SC-004** (Handle empty skills): Unit test với user có 0 skills → verify response.skills = []
- **SC-005** (200 concurrent requests): Load test với artillery
- **SC-006** (No IDOR): Integration test verify không thể thay đổi userId để xem profile người khác

## Deployment Checklist

Trước khi merge vào main branch:

- [ ] Prisma schema đã được review và approved
- [ ] Prisma migrations chạy thành công trên dev DB
- [ ] Unit tests pass (80%+ coverage cho Service layer)
- [ ] Integration tests pass (all scenarios từ spec.md)
- [ ] Load test confirm response time < 1s với 200 concurrent
- [ ] Security review: Verify không có data leakage
- [ ] API documentation (Swagger) đã được update
- [ ] Frontend integration test pass
- [ ] Code review approved bởi ít nhất 1 member khác
- [ ] CONSTITUTION.md compliance checked (architecture, security, code quality)

---

## Next Steps

1. **Review plan này** - Team lead review và approve plan
2. **Clarify JWT payload** - Xác minh chính xác cấu trúc `req.user` từ auth.middleware để implementation bám đúng scope
3. **Prisma setup decision** - Quyết định có setup Prisma mới hay dùng raw SQL queries (khuyến nghị: Prisma theo ADR-001)
4. **Review bộ docs hiện tại** - Đảm bảo research, data-model, contracts, quickstart đã đồng bộ với `context.md` và `spec.md`
5. **Run `/speckit-tasks`** - Generate tasks.md với atomic task breakdown (Phase 2)
6. **Start implementation** - Thực hiện các tasks theo thứ tự dependencies

## Questions for Stakeholders

1. **Database Migration Strategy**: Hiện tại backend có database nào đang chạy không? Cần migrate data cũ hay setup fresh database?
2. **Prisma vs Raw SQL**: Team có muốn setup Prisma đầy đủ (theo ADR-001) hay tạm dùng raw SQL queries cho nhanh? (Khuyến nghị: Prisma)
3. **JWT Payload Structure**: Cần confirm chính xác `req.user` chứa claim nào để đáp ứng yêu cầu định danh của UC18?
4. **Testing Priority**: Ưu tiên viết tests trước (TDD) hay implement code trước rồi test sau?

---

**Plan Status**: READY FOR REVIEW
**Estimated Effort**: 16-24 hours (1 developer, including setup + tests)
**Priority**: P1 (Core feature - blocking UC19, UC20, UC21)

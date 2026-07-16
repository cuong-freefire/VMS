# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.)

# Implementation Plan: Filter User

**Branch**: `feat/uc30-filter-user` | **Date**: 2026-06-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.sdd/DucNM/UC-feat-filter-user/spec.md`

**Owner**: DucNM (Member 5) | **Module**: User Management

## Summary

UC30 mở rộng endpoint `GET /api/v1/users` (đã có từ UC26) với các query params filter bổ sung: `is_active` (lọc active/inactive), `from_date` / `to_date` (lọc theo khoảng thời gian tạo). Role filter (`role`) đã có sẵn từ UC26. Các filter kết hợp với nhau bằng AND logic và có thể kết hợp với search (`search`) đã có. Đây không phải endpoint riêng — là mở rộng của endpoint hiện tại.

**Technical approach**:

- Extension của endpoint `GET /api/v1/users` — KHÔNG tạo endpoint mới
- Filter params: `role` (string), `is_active` (boolean), `from_date` (ISO date), `to_date` (ISO date)
- AND logic giữa các filter params
- Zod validation cho date range và boolean params
- Phân quyền: Chỉ Admin (kế thừa từ UC26)

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**:
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include), React Hook Form

**Storage**: MySQL via Prisma ORM (users table với role_id, is_active, created_at)

**Testing**:
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web application (Desktop-first browser)

**Project Type**: Full-stack web service (Backend REST API + Frontend SPA)

**Performance Goals**: Filter queries hoàn thành trong < 1 giây, index trên `is_active` và `created_at` nếu cần

**Constraints**:
- Filter là extension của UC26 — KHÔNG tạo endpoint mới
- Các filter params mới: `is_active` (boolean), `from_date` (ISO date), `to_date` (ISO date)
- AND logic giữa các filter params
- Validate date range: `from_date` <= `to_date`, nếu không → HTTP 400
- Role filter đã có từ UC26 — không cần implement lại
- Chỉ Admin mới có quyền truy cập (kế thừa auth từ UC26)
- Max function length: 40 dòng; max file length: 300 dòng

**Scale/Scope**: Mở rộng endpoint hiện tại. Thay đổi tập trung ở: validator schema (thêm params), service (mở rộng Prisma where clause), frontend (thêm filter UI components).

## Constitution Check

Các nguyên tắc từ AGENTS.md và CLAUDE.md:

1. **Layered Architecture**: Controller → Service → Repository (bắt buộc)
2. **Test-First**: Tối thiểu 80% coverage cho Service layer
3. **API Response Format**: Buộc dùng `response.util.js`
4. **Swagger Documentation**: Cập nhật JSDoc cho endpoint (thêm params mới)
5. **Cross-module**: Không import Repository từ module khác

**Kết luận**: Không có vi phạm. Gates pass.

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC-feat-filter-user/
├── context.md              # Problem context
├── spec.md                 # Feature specification
├── plan.md                 # This file
├── research.md             # Phase 0 output
├── data-model.md           # Phase 1 output
├── quickstart.md           # Phase 1 output
├── contracts/              # Phase 1 output
└── tasks.md                # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── services/
│   │   └── user.service.js          # [UPDATE] Mở rộng getUsers — thêm filter params vào Prisma where
│   ├── validators/
│   │   └── user.validator.js         # [UPDATE] Mở rộng getUsersQuerySchema — thêm is_active, from_date, to_date
│   ├── routes/
│   │   └── user.routes.js            # [UPDATE] Cập nhật Swagger JSDoc (thêm params mới)
│   └── tests/
│       └── user/
│           ├── user.service.test.js  # [UPDATE] Thêm tests cho filter logic
│           └── user.api.test.js      # [UPDATE] Thêm integration tests cho query params

frontend/
├── src/
│   ├── hooks/
│   │   └── useUsers.js              # [UPDATE] Mở rộng hook — thêm filter states và params
│   ├── components/
│   │   ├── ui/
│   │   │   ├── ActiveFilter.jsx      # [NEW] Dropdown lọc active/inactive
│   │   │   └── DateRangeFilter.jsx   # [NEW] Date picker cho from_date/to_date
│   │   └── pages/
│   │       └── UserListPage.jsx      # [UPDATE] Thêm filter controls vào giao diện
│   └── api/
│       └── userApi.js                # [UPDATE] Mở rộng query params trong API call
```

**Structure Decision**: VMS là web application với separate backend và frontend. Follow **Option 2** từ template. Không tạo file backend mới — chỉ mở rộng file đã có từ UC26. Frontend thêm component filter mới.

## Complexity Tracking

> **Không có vi phạm** — đây là mở rộng endpoint hiện tại với query params, tuân thủ cấu trúc chuẩn VMS. Không cần architecture complexity justification.

## Implementation Phases

### Phase 0: Research & Verification (READ-ONLY)

**Objective**: Xác nhận cấu trúc hiện tại của endpoint GET /api/v1/users (từ UC26) và scope thay đổi cần thực hiện.

**Tasks**:

1. Đọc code hiện tại của `user.service.js` — xác nhận Prisma where clause structure và cách handle query params
2. Đọc `user.validator.js` — xác nhận schema hiện tại và cách extend với params mới
3. Đọc `user.routes.js` — xác nhận Swagger JSDoc structure
4. Đọc Frontend `useUsers.js` hook và `UserListPage.jsx` — xác nhận filter integration points
5. Kiểm tra database indexes trên `users.is_active` và `users.created_at`
6. Xác nhận auth middleware đã hoạt động cho Admin role

**Output**: `research.md` file với technical findings

---

### Phase 1: Design & Contracts (READ-ONLY)

**Objective**: Thiết kế chi tiết validator schema, service extension, API contract, và UI components.

**Tasks**:

1. **Data Model** — Xác nhận không cần thay đổi database schema. Chỉ dùng query params filter trên users table hiện tại
2. **API Contracts** — Mở rộng contract cho `GET /api/v1/users` với params: `is_active` (boolean, optional), `from_date` (ISO date, optional), `to_date` (ISO date, optional)
3. **Service Contracts** — Mở rộng `UserService.getUsers(filters)` — thêm filter params vào method signature
4. **Quick Start Guide** — Hướng dẫn chạy test và verify filter hoạt động

**Output**: 4 files (`data-model.md`, `contracts/api-contract.md`, `contracts/service-contract.md`, `quickstart.md`)

---

### Phase 2: Implementation Planning (READY FOR APPROVAL)

**Objective**: Break down implementation into atomic tasks

**Note**: Phase này sẽ được thực hiện bằng command `/speckit-tasks` sau khi plan được approve

**Expected Output**: `tasks.md` với atomic task breakdown:

- Task 1: [Backend] Mở rộng Zod validator schema — thêm is_active, from_date, to_date params
- Task 2: [Backend] Mở rộng UserService — thêm filter conditions vào Prisma where clause
- Task 3: [Backend] Cập nhật Swagger JSDoc — thêm filter params documentation
- Task 4: [Backend] Viết unit tests cho filter logic (Service layer)
- Task 5: [Backend] Viết integration tests cho query params filter
- Task 6: [Frontend] Tạo ActiveFilter component (dropdown active/inactive/all)
- Task 7: [Frontend] Tạo DateRangeFilter component (date picker from/to)
- Task 8: [Frontend] Mở rộng useUsers hook — thêm filter states
- Task 9: [Frontend] Cập nhật UserListPage — thêm filter controls
- Task 10: [Frontend] Viết component tests

**Dependencies**: Task 1 → Task 2 → Task 3; Task 4-5 (có thể song song với Task 6-10)

---

## Risk Assessment

### HIGH RISK

- **Không có** — đây là mở rộng query params đơn giản, không ảnh hưởng business logic hiện tại.

### MEDIUM RISK

- **Date validation edge cases**: Nếu frontend gửi date format không chuẩn. 
  - **Mitigation**: Zod validation chặt chẽ, parse ISO date và trả về HTTP 400 nếu invalid.

### LOW RISK

- **Performance impact**: Filter trên large dataset có thể chậm nếu không có index.
  - **Mitigation**: Thêm database index trên `is_active` và `created_at` nếu cần.

---

## Success Criteria Review

Mapping từ spec.md Success Criteria sang implementation deliverables:

- **SC-001**: 100% request filter hợp lệ trả về kết quả chính xác trong vòng 1 giây → Verify bằng integration tests với database seeding nhiều record.
- **SC-002**: 100% request với date range không hợp lệ bị từ chối HTTP 400 → Verify bằng validator unit tests.

---

## Deployment Checklist

Trước khi merge vào main branch:

- [ ] Unit tests pass (Service layer coverage >= 80%)
- [ ] Integration tests pass (tất cả filter params happy + error paths)
- [ ] Swagger documentation updated (JSDoc với params mới)
- [ ] Frontend build không lỗi (`npm run build`)
- [ ] Manual test: Admin login → filter by role → filter by status → filter by date → combined filter
- [ ] Manual test: Admin login → nhập date range sai → verify HTTP 400 handling
- [ ] ESLint pass (`npm run lint`)

---

## Next Steps

1. Review plan này với team
2. Phase 0: Đọc code hiện tại và xác nhận integration points
3. Phase 1: Thiết kế contract và schema extension
4. Chạy `/speckit-tasks` để tạo tasks.md
5. Implement theo tasks.md

---

## Questions for Stakeholders

1. **Filter behavior khi param invalid**: Khi `is_active` nhận giá trị không phải boolean (ví dụ: "abc"), hệ thống nên bỏ qua param hay trả về HTTP 400?
   - **Context**: Ảnh hưởng đến UX khi user nhập sai filter value.
   - **Options**: (A) Trả về HTTP 400 với error message rõ ràng, (B) Bỏ qua param invalid và vẫn trả về kết quả.
   - **Recommendation**: (A) — nghiêm ngặt hơn, giúp user nhận biết lỗi sớm.

---

**Plan Status**: READY FOR REVIEW  
**Estimated Effort**: 6-10 hours (Phase 0: 1h, Phase 1: 2h, Phase 2: 3-7h)  
**Priority**: P1
# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.)

# Implementation Plan: Search User

**Branch**: `feat/search-user` | **Date**: 2026-06-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.sdd/DucNM/UC-feat-search-user/spec.md`

**Owner**: DucNM (Member 5) | **Module**: User Management

## Summary

Search User mở rộng endpoint `GET /api/v1/users` (đã có từ UC26) với query param `search` cho phép Admin tìm kiếm người dùng theo tên (full_name) và email. Search hoạt động dựa trên partial match, không phân biệt hoa/thường, và có thể kết hợp với các filter khác (role, is_active, date range) từ UC30. Đây không phải endpoint riêng — là mở rộng của endpoint hiện tại.

**Technical approach**:

- Extension của endpoint `GET /api/v1/users` — KHÔNG tạo endpoint mới
- Query param `search` (string) dùng để tìm kiếm trên cả `full_name` và `email`
- Case-insensitive + partial match sử dụng SQL LIKE (hoặc Prisma `contains` + `mode: insensitive`)
- Kết hợp AND logic với các filter params khác
- Zod validation: sanitize input, chặn SQL injection
- Phân quyền: Chỉ Admin

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**:
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include), React Hook Form

**Storage**: MySQL via Prisma ORM (users table với full_name, email columns)

**Testing**:
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web application (Desktop-first browser)

**Project Type**: Full-stack web service (Backend REST API + Frontend SPA)

**Performance Goals**: Search queries hoàn thành trong < 1 giây, FULLTEXT index trên `full_name` và `email` nếu cần

**Constraints**:
- Search là extension của UC26 — KHÔNG tạo endpoint mới
- Search scope: chỉ `full_name` và `email` — KHÔNG search theo số điện thoại
- Case-insensitive + partial match bắt buộc
- Kết hợp AND với filter params (role, is_active, date range)
- Sanitize input để chống SQL injection
- Chỉ Admin mới có quyền truy cập (kế thừa auth từ UC26)
- Kết quả search bao gồm cả active và inactive user
- Max function length: 40 dòng; max file length: 300 dòng

**Scale/Scope**: Mở rộng endpoint hiện tại với 1 query param mới. Thay đổi tập trung ở: validator schema (thêm `search`), service (mở rộng Prisma where clause với OR condition), frontend (thêm search input).

## Constitution Check

Các nguyên tắc từ AGENTS.md và CLAUDE.md:

1. **Layered Architecture**: Controller → Service → Repository (bắt buộc)
2. **Test-First**: Tối thiểu 80% coverage cho Service layer
3. **API Response Format**: Buộc dùng `response.util.js`
4. **Swagger Documentation**: Cập nhật JSDoc cho endpoint (thêm search param)
5. **Cross-module**: Không import Repository từ module khác

**Kết luận**: Không có vi phạm. Gates pass.

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC-feat-search-user/
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
│   │   └── user.service.js          # [UPDATE] Mở rộng getUsers — thêm search condition vào Prisma where
│   ├── validators/
│   │   └── user.validator.js         # [UPDATE] Mở rộng getUsersQuerySchema — thêm search param (string, optional)
│   ├── routes/
│   │   └── user.routes.js            # [UPDATE] Cập nhật Swagger JSDoc (thêm search param)
│   └── tests/
│       └── user/
│           ├── user.service.test.js  # [UPDATE] Thêm tests cho search logic
│           └── user.api.test.js      # [UPDATE] Thêm integration tests cho search query

frontend/
├── src/
│   ├── hooks/
│   │   └── useUsers.js              # [UPDATE] Mở rộng hook — thêm search state
│   ├── components/
│   │   ├── ui/
│   │   │   └── SearchInput.jsx       # [NEW] Search input với debounce
│   │   └── pages/
│   │       └── UserListPage.jsx      # [UPDATE] Thêm search input vào giao diện
│   └── api/
│       └── userApi.js                # [UPDATE] Mở rộng query params trong API call
```

**Structure Decision**: VMS là web application với separate backend và frontend. Follow **Option 2** từ template. Không tạo file backend mới — chỉ mở rộng file đã có từ UC26. Frontend thêm SearchInput component.

## Complexity Tracking

> **Không có vi phạm** — đây là mở rộng endpoint hiện tại với 1 query param, tuân thủ cấu trúc chuẩn VMS.

## Implementation Phases

### Phase 0: Research & Verification (READ-ONLY)

**Objective**: Xác nhận cấu trúc hiện tại của endpoint GET /api/v1/users và cách implement case-insensitive search với Prisma.

**Tasks**:

1. Đọc `user.service.js` — xác nhận cách Prisma handle `contains` + `mode: 'insensitive'`
2. Đọc `user.validator.js` — xác nhận schema extension points
3. Kiểm tra database có FULLTEXT index trên full_name và email không
4. Xác nhận search kết hợp được với filter params (AND logic)
5. Đọc Frontend `useUsers.js` — xác nhận cách thêm search state

**Output**: `research.md` file với technical findings

---

### Phase 1: Design & Contracts (READ-ONLY)

**Objective**: Thiết kế chi tiết validator schema, service extension, API contract, và UI components.

**Tasks**:

1. **Data Model** — Xác nhận không cần thay đổi database schema. Dùng `full_name` và `email` columns hiện tại
2. **API Contracts** — Mở rộng contract cho `GET /api/v1/users` với param: `search` (string, optional)
3. **Service Contracts** — Mở rộng `UserService.getUsers(filters)` — thêm search logic vào Prisma where
4. **Quick Start Guide** — Hướng dẫn chạy test và verify search hoạt động

**Output**: 4 files (`data-model.md`, `contracts/api-contract.md`, `contracts/service-contract.md`, `quickstart.md`)

---

### Phase 2: Implementation Planning (READY FOR APPROVAL)

**Objective**: Break down implementation into atomic tasks

**Note**: Phase này sẽ được thực hiện bằng command `/speckit-tasks` sau khi plan được approve

**Expected Output**: `tasks.md` với atomic task breakdown:

- Task 1: [Backend] Mở rộng Zod validator schema — thêm search param
- Task 2: [Backend] Mở rộng UserService — thêm search condition với Prisma `contains` + `mode: 'insensitive'`
- Task 3: [Backend] Cập nhật Swagger JSDoc — thêm search param documentation
- Task 4: [Backend] Viết unit tests cho search logic (happy path, partial match, case-insensitive, empty keyword, no results)
- Task 5: [Backend] Viết integration tests cho search + filter kết hợp
- Task 6: [Frontend] Tạo SearchInput component (input field + debounce)
- Task 7: [Frontend] Mở rộng useUsers hook — thêm search state
- Task 8: [Frontend] Cập nhật UserListPage — thêm search input
- Task 9: [Frontend] Viết component tests

**Dependencies**: Task 1 → Task 2 → Task 3; Task 4-5 (có thể song song với Task 6-9)

---

## Risk Assessment

### HIGH RISK

- **Không có** — search là mở rộng đơn giản, không ảnh hưởng business logic.

### MEDIUM RISK

- **SQL injection via search keyword**: Nếu không sanitize input.
  - **Mitigation**: Prisma ORM tự động parameterized queries + Zod validation sanitize input.

### LOW RISK

- **Performance với LIKE '%keyword%'**: Trên dataset lớn có thể chậm.
  - **Mitigation**: Thêm FULLTEXT index nếu cần. V1 dùng LIKE, nâng cấp lên FULLTEXT sau nếu performance không đạt.

---

## Success Criteria Review

Mapping từ spec.md Success Criteria sang implementation deliverables:

- **SC-001**: 100% request search hợp lệ trả về kết quả chính xác trong vòng 1 giây → Verify bằng integration tests với database seeding.
- **SC-002**: Kết quả search bao gồm cả active và inactive user → Verify bằng unit test với mixed status users.

---

## Deployment Checklist

Trước khi merge vào main branch:

- [ ] Unit tests pass (Service layer coverage >= 80%)
- [ ] Integration tests pass (search happy path + edge cases + kết hợp filter)
- [ ] Swagger documentation updated (JSDoc với search param)
- [ ] Frontend build không lỗi (`npm run build`)
- [ ] Manual test: Admin login → search by name → search by email → search + filter
- [ ] ESLint pass (`npm run lint`)

---

## Next Steps

1. Review plan này với team
2. Phase 0: Đọc code hiện tại và xác nhận Prisma search mechanism
3. Phase 1: Thiết kế contract và schema extension
4. Chạy `/speckit-tasks` để tạo tasks.md
5. Implement theo tasks.md

---

## Questions for Stakeholders

1. **Debounce time cho search input**: Frontend search nên gọi API ngay khi gõ hay có debounce?
   - **Context**: Gọi API ngay có thể gây nhiều request, debounce giúp giảm tải.
   - **Options**: (A) Debounce 300ms, (B) Gọi API ngay khi gõ, (C) Chỉ search khi user nhấn Enter.
   - **Recommendation**: (A) — cân bằng giữa UX và performance.

---

**Plan Status**: READY FOR REVIEW  
**Estimated Effort**: 5-8 hours (Phase 0: 1h, Phase 1: 1.5h, Phase 2: 2.5-5.5h)  
**Priority**: P1
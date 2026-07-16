# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.)

# Implementation Plan: Search Skill

**Branch**: `feat/search-skill` | **Date**: 2026-06-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.sdd/DucNM/UC-feat-search-skill/spec.md`

**Owner**: DucNM (Member 5) | **Module**: Skill Management

## Summary

Search Skill mở rộng endpoint `GET /api/v1/skills` (đã có từ UC34) với query param `search` cho phép Manager tìm kiếm kỹ năng theo tên (name) và mô tả (description). Search hoạt động dựa trên partial match, không phân biệt hoa/thường. Đây không phải endpoint riêng — là mở rộng của endpoint hiện tại.

**Technical approach**:

- Extension của endpoint `GET /api/v1/skills` — KHÔNG tạo endpoint mới
- Query param `search` (string) dùng để tìm kiếm trên cả `name` và `description`
- Case-insensitive + partial match sử dụng Prisma `contains` + `mode: insensitive`
- Zod validation: sanitize input, chặn SQL injection
- Phân quyền theo role: Manager thấy tất cả; Volunteer/Staff chỉ thấy active

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**:
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include), React Hook Form

**Storage**: MySQL via Prisma ORM (skills table với name, description columns)

**Testing**:
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web application (Desktop-first browser)

**Project Type**: Full-stack web service (Backend REST API + Frontend SPA)

**Performance Goals**: Search queries hoàn thành trong < 500ms do số lượng skill ít

**Constraints**:
- Search là extension của UC34 — KHÔNG tạo endpoint mới
- Search scope: `name` và `description`
- Case-insensitive + partial match bắt buộc
- Phân quyền: Manager thấy active + inactive; Volunteer/Staff chỉ thấy active
- Guest bị từ chối HTTP 401
- Sanitize input để chống SQL injection
- Max function length: 40 dòng; max file length: 300 dòng

**Scale/Scope**: Mở rộng endpoint hiện tại với 1 query param mới. Thay đổi tập trung ở: validator schema, service layer, frontend search input.

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
.sdd/DucNM/UC-feat-search-skill/
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
│   │   └── skill.service.js         # [UPDATE] Mở rộng getSkills — thêm search condition vào Prisma where
│   ├── validators/
│   │   └── skill.validator.js       # [UPDATE] Mở rộng getSkillsQuerySchema — thêm search param
│   ├── routes/
│   │   └── skill.routes.js          # [UPDATE] Cập nhật Swagger JSDoc (thêm search param)
│   └── tests/
│       └── skill/
│           ├── skill.service.test.js # [UPDATE] Thêm tests cho search logic
│           └── skill.api.test.js     # [UPDATE] Thêm integration tests

frontend/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   └── SearchInput.jsx       # [NEW] Search input (có thể reuse)
│   │   └── pages/
│   │       └── SkillListPage.jsx     # [UPDATE] Thêm search input vào giao diện
│   └── api/
│       └── skillApi.js               # [UPDATE] Mở rộng query params trong API call
```

**Structure Decision**: VMS là web application với separate backend và frontend. Follow **Option 2** từ template. Không tạo file backend mới — chỉ mở rộng file đã có từ UC34.

## Complexity Tracking

> **Không có vi phạm** — đây là mở rộng endpoint hiện tại với 1 query param, tuân thủ cấu trúc chuẩn VMS.

## Implementation Phases

### Phase 0: Research & Verification (READ-ONLY)

**Objective**: Xác nhận cấu trúc hiện tại của endpoint GET /api/v1/skills (từ UC34) và scope thay đổi.

**Tasks**:

1. Đọc `skill.service.js` — xác nhận Prisma where clause structure
2. Đọc `skill.validator.js` — xác nhận schema hiện tại
3. Xác nhận role-based filtering (Manager vs Volunteer/Staff)
4. Đọc Frontend `SkillListPage.jsx` — xác nhận integration points

**Output**: `research.md` file với technical findings

---

### Phase 1: Design & Contracts (READ-ONLY)

**Objective**: Thiết kế chi tiết validator schema, service extension, API contract, và UI components.

**Tasks**:

1. **Data Model** — Xác nhận không cần thay đổi database schema
2. **API Contracts** — Mở rộng contract cho `GET /api/v1/skills` với param: `search` (string, optional)
3. **Service Contracts** — Mở rộng `SkillService.getSkills(filters)` — thêm search logic
4. **Quick Start Guide** — Hướng dẫn chạy test và verify

**Output**: 4 files

---

### Phase 2: Implementation Planning (READY FOR APPROVAL)

**Objective**: Break down implementation into atomic tasks

**Note**: Phase này sẽ được thực hiện bằng command `/speckit-tasks` sau khi plan được approve

**Expected Output**: `tasks.md` với atomic task breakdown:

- Task 1: [Backend] Mở rộng Zod validator schema — thêm search param
- Task 2: [Backend] Mở rộng SkillService — thêm search condition
- Task 3: [Backend] Cập nhật Swagger JSDoc — thêm search param
- Task 4: [Backend] Viết unit tests cho search logic
- Task 5: [Backend] Viết integration tests
- Task 6: [Frontend] Tạo SearchInput component (nếu chưa có)
- Task 7: [Frontend] Cập nhật SkillListPage — thêm search input
- Task 8: [Frontend] Viết component tests

**Dependencies**: Task 1 → Task 2 → Task 3; Task 4-5 (có thể song song với Task 6-8)

---

## Risk Assessment

### HIGH RISK

- **Không có** — search là mở rộng đơn giản.

### MEDIUM RISK

- **Không có** — số lượng skill ít, rủi ro thấp.

### LOW RISK

- **Search performance**: Do số lượng skill không nhiều, LIKE query đủ nhanh.

---

## Success Criteria Review

Mapping từ spec.md Success Criteria sang implementation deliverables:

- **SC-001**: 100% request search hợp lệ trả về kết quả chính xác trong vòng 1 giây → Verify bằng integration tests.
- **SC-002**: Kết quả search bao gồm cả active và inactive skill (Manager) → Verify bằng unit test.

---

## Deployment Checklist

Trước khi merge vào main branch:

- [ ] Unit tests pass (Service layer coverage >= 80%)
- [ ] Integration tests pass
- [ ] Swagger documentation updated
- [ ] Frontend build không lỗi (`npm run build`)
- [ ] Manual test: Manager login → search skill
- [ ] ESLint pass (`npm run lint`)

---

## Next Steps

1. Review plan này với team
2. Phase 0: Đọc code hiện tại
3. Phase 1: Thiết kế contract
4. Chạy `/speckit-tasks` để tạo tasks.md
5. Implement theo tasks.md

---

**Plan Status**: READY FOR REVIEW  
**Estimated Effort**: 4-6 hours (Phase 0: 0.5h, Phase 1: 1.5h, Phase 2: 2-4h)  
**Priority**: P1
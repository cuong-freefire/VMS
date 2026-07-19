# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.)

# Implementation Plan: Search Category

**Branch**: `feat/search-category` | **Date**: 2026-06-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.sdd/DucNM/UC-feat-search-category/spec.md`

**Owner**: DucNM (Member 5) | **Module**: Category Management

## Summary

Search Category mở rộng endpoint `GET /api/v1/categories` (đã có từ UC31) với query param `search` cho phép Manager tìm kiếm danh mục theo tên (name) và mô tả (description). Search hoạt động dựa trên partial match, không phân biệt hoa/thường, và có thể kết hợp với filter type (location, event_type, time_frame). Đây không phải endpoint riêng — là mở rộng của endpoint hiện tại.

**Technical approach**:

- Extension của endpoint `GET /api/v1/categories` — KHÔNG tạo endpoint mới
- Query param `search` (string) dùng để tìm kiếm trên cả `name` và `description`
- Case-insensitive + partial match sử dụng Prisma `contains` + `mode: insensitive`
- Kết hợp AND logic với filter `type` param
- Zod validation: sanitize input, chặn SQL injection
- Phân quyền theo role: Manager thấy tất cả; Staff/Volunteer/Guest chỉ thấy active

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**:
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include), React Hook Form

**Storage**: MySQL via Prisma ORM (categories table với name, description, type columns)

**Testing**:
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web application (Desktop-first browser)

**Project Type**: Full-stack web service (Backend REST API + Frontend SPA)

**Performance Goals**: Search queries hoàn thành trong < 500ms do số lượng category ít

**Constraints**:
- Search là extension của UC31 — KHÔNG tạo endpoint mới
- Search scope: `name` và `description` — KHÔNG search theo `type`
- Case-insensitive + partial match bắt buộc
- Kết hợp AND với filter `type` param
- Phân quyền: Manager thấy active + inactive; Staff/Volunteer/Guest chỉ thấy active
- Sanitize input để chống SQL injection
- Không cần phân trang do số lượng category ít
- Max function length: 40 dòng; max file length: 300 dòng

**Scale/Scope**: Mở rộng endpoint hiện tại với 1 query param mới. Thay đổi tập trung ở: validator schema (thêm `search`), service (mở rộng Prisma where clause), frontend (thêm search input).

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
.sdd/DucNM/UC-feat-search-category/
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
│   │   └── category.service.js      # [UPDATE] Mở rộng getCategories — thêm search condition vào Prisma where
│   ├── validators/
│   │   └── category.validator.js    # [UPDATE] Mở rộng getCategoriesQuerySchema — thêm search param
│   ├── routes/
│   │   └── category.routes.js       # [UPDATE] Cập nhật Swagger JSDoc (thêm search param)
│   └── tests/
│       └── category/
│           ├── category.service.test.js  # [UPDATE] Thêm tests cho search logic
│           └── category.api.test.js      # [UPDATE] Thêm integration tests

frontend/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   └── SearchInput.jsx       # [NEW] Search input (có thể reuse từ search-user)
│   │   └── pages/
│   │       └── CategoryListPage.jsx  # [UPDATE] Thêm search input vào giao diện
│   └── api/
│       └── categoryApi.js            # [UPDATE] Mở rộng query params trong API call
```

**Structure Decision**: VMS là web application với separate backend và frontend. Follow **Option 2** từ template. Không tạo file backend mới — chỉ mở rộng file đã có từ UC31. Frontend thêm SearchInput component.

## Complexity Tracking

> **Không có vi phạm** — đây là mở rộng endpoint hiện tại với 1 query param, tuân thủ cấu trúc chuẩn VMS.

## Implementation Phases

### Phase 0: Research & Verification (READ-ONLY)

**Objective**: Xác nhận cấu trúc hiện tại của endpoint GET /api/v1/categories (từ UC31) và cách implement search với Prisma.

**Tasks**:

1. Đọc `category.service.js` — xác nhận Prisma where clause structure
2. Đọc `category.validator.js` — xác nhận schema hiện tại
3. Xác nhận role-based filtering (Manager thấy active + inactive, Staff/Volunteer/Guest chỉ thấy active)
4. Đọc Frontend `CategoryListPage.jsx` — xác nhận integration points

**Output**: `research.md` file với technical findings

---

### Phase 1: Design & Contracts (READ-ONLY)

**Objective**: Thiết kế chi tiết validator schema, service extension, API contract, và UI components.

**Tasks**:

1. **Data Model** — Xác nhận không cần thay đổi database schema. Dùng `name` và `description` columns hiện tại
2. **API Contracts** — Mở rộng contract cho `GET /api/v1/categories` với param: `search` (string, optional)
3. **Service Contracts** — Mở rộng `CategoryService.getCategories(filters)` — thêm search logic
4. **Quick Start Guide** — Hướng dẫn chạy test và verify search hoạt động

**Output**: 4 files (`data-model.md`, `contracts/api-contract.md`, `contracts/service-contract.md`, `quickstart.md`)

---

### Phase 2: Implementation Planning (READY FOR APPROVAL)

**Objective**: Break down implementation into atomic tasks

**Note**: Phase này sẽ được thực hiện bằng command `/speckit-tasks` sau khi plan được approve

**Expected Output**: `tasks.md` với atomic task breakdown:

- Task 1: [Backend] Mở rộng Zod validator schema — thêm search param
- Task 2: [Backend] Mở rộng CategoryService — thêm search condition (name OR description)
- Task 3: [Backend] Cập nhật Swagger JSDoc — thêm search param
- Task 4: [Backend] Viết unit tests cho search logic
- Task 5: [Backend] Viết integration tests cho search + filter type kết hợp
- Task 6: [Frontend] Tạo SearchInput component (nếu chưa có)
- Task 7: [Frontend] Cập nhật CategoryListPage — thêm search input
- Task 8: [Frontend] Viết component tests

**Dependencies**: Task 1 → Task 2 → Task 3; Task 4-5 (có thể song song với Task 6-8)

---

## Risk Assessment

### HIGH RISK

- **Không có** — search là mở rộng đơn giản, không ảnh hưởng business logic.

### MEDIUM RISK

- **Không có** — số lượng category ít, rủi ro thấp.

### LOW RISK

- **Search performance**: Do số lượng category không nhiều, LIKE query đủ nhanh.
  - **Mitigation**: Không cần index đặc biệt ở v1.

---

## Success Criteria Review

Mapping từ spec.md Success Criteria sang implementation deliverables:

- **SC-001**: 100% request search hợp lệ trả về kết quả chính xác trong vòng 1 giây → Verify bằng integration tests.
- **SC-002**: Kết quả search bao gồm cả active và inactive category (Manager) → Verify bằng unit test với mixed status.

---

## Deployment Checklist

Trước khi merge vào main branch:

- [ ] Unit tests pass (Service layer coverage >= 80%)
- [ ] Integration tests pass (search + filter type kết hợp)
- [ ] Swagger documentation updated
- [ ] Frontend build không lỗi (`npm run build`)
- [ ] Manual test: Manager login → search category → search + filter type
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

1. **Staff/Volunteer/Guest search scope**: Khi Staff/Volunteer/Guest search, họ chỉ thấy category active — đây đã đúng với business requirement chưa?
   - **Context**: Phân quyền search theo role cần được xác nhận.
   - **Options**: (A) Đúng — chỉ active, (B) Sai — cần discussion thêm.
   - **Recommendation**: (A) — đã consistent với UC31.

---

**Plan Status**: READY FOR REVIEW  
**Estimated Effort**: 4-7 hours (Phase 0: 0.5h, Phase 1: 1.5h, Phase 2: 2-5h)  
**Priority**: P1
# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.)

# Implementation Plan: Search Organization

**Branch**: `feat/search-organization` | **Date**: 2026-06-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.sdd/DucNM/UC-feat-search-organization/spec.md`

**Owner**: DucNM (Member 5) | **Module**: Organization Management

## Summary

Search Organization mở rộng endpoint `GET /api/v1/organizations` (đã có từ UC37) với query param `search` cho phép Admin và Manager tìm kiếm tổ chức theo tên (name). Search hoạt động dựa trên partial match, không phân biệt hoa/thường, và có thể kết hợp với filter `is_active`. Đây không phải endpoint riêng — là mở rộng của endpoint hiện tại.

**Technical approach**:

- Extension của endpoint `GET /api/v1/organizations` — KHÔNG tạo endpoint mới
- Query param `search` (string) dùng để tìm kiếm trên `name`
- Case-insensitive + partial match sử dụng Prisma `contains` + `mode: insensitive`
- Kết hợp AND logic với filter `is_active` param
- Zod validation: sanitize input, chặn SQL injection
- Phân quyền theo role: Admin thấy tất cả; Manager/Staff chỉ thấy active
- Guest và Volunteer bị từ chối (HTTP 401/403)

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**:
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include), React Hook Form

**Storage**: MySQL via Prisma ORM (organizations table với name column)

**Testing**:
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web application (Desktop-first browser)

**Project Type**: Full-stack web service (Backend REST API + Frontend SPA)

**Performance Goals**: Search queries hoàn thành trong < 1 giây

**Constraints**:
- Search là extension của UC37 — KHÔNG tạo endpoint mới
- Search scope: chỉ `name` — KHÔNG search theo email hoặc địa chỉ
- Case-insensitive + partial match bắt buộc
- Kết hợp AND với filter `is_active` param
- Phân quyền: Admin thấy active + inactive; Manager/Staff chỉ thấy active
- Volunteer và Guest bị từ chối
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
.sdd/DucNM/UC-feat-search-organization/
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
│   │   └── organization.service.js   # [UPDATE] Mở rộng getOrganizations — thêm search condition
│   ├── validators/
│   │   └── organization.validator.js # [UPDATE] Mở rộng getOrganizationsQuerySchema — thêm search param
│   ├── routes/
│   │   └── organization.routes.js    # [UPDATE] Cập nhật Swagger JSDoc (thêm search param)
│   └── tests/
│       └── organization/
│           ├── organization.service.test.js  # [UPDATE] Thêm tests cho search logic
│           └── organization.api.test.js      # [UPDATE] Thêm integration tests

frontend/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   └── SearchInput.jsx       # [NEW] Search input (có thể reuse)
│   │   └── pages/
│   │       └── OrganizationListPage.jsx  # [UPDATE] Thêm search input vào giao diện
│   └── api/
│       └── organizationApi.js         # [UPDATE] Mở rộng query params trong API call
```

**Structure Decision**: VMS là web application với separate backend và frontend. Follow **Option 2** từ template. Không tạo file backend mới — chỉ mở rộng file đã có từ UC37.

## Complexity Tracking

> **Không có vi phạm** — đây là mở rộng endpoint hiện tại với 1 query param, tuân thủ cấu trúc chuẩn VMS.

## Implementation Phases

### Phase 0: Research & Verification (READ-ONLY)

**Objective**: Xác nhận cấu trúc hiện tại của endpoint GET /api/v1/organizations (từ UC37) và scope thay đổi.

**Tasks**:

1. Đọc `organization.service.js` — xác nhận Prisma where clause structure
2. Đọc `organization.validator.js` — xác nhận schema hiện tại
3. Xác nhận role-based filtering (Admin vs Manager/Staff)
4. Đọc Frontend `OrganizationListPage.jsx` — xác nhận integration points

**Output**: `research.md` file với technical findings

---

### Phase 1: Design & Contracts (READ-ONLY)

**Objective**: Thiết kế chi tiết validator schema, service extension, API contract, và UI components.

**Tasks**:

1. **Data Model** — Xác nhận không cần thay đổi database schema. Dùng `name` column hiện tại
2. **API Contracts** — Mở rộng contract cho `GET /api/v1/organizations` với param: `search` (string, optional)
3. **Service Contracts** — Mở rộng `OrganizationService.getOrganizations(filters)` — thêm search logic
4. **Quick Start Guide** — Hướng dẫn chạy test và verify

**Output**: 4 files

---

### Phase 2: Implementation Planning (READY FOR APPROVAL)

**Objective**: Break down implementation into atomic tasks

**Note**: Phase này sẽ được thực hiện bằng command `/speckit-tasks` sau khi plan được approve

**Expected Output**: `tasks.md` với atomic task breakdown:

- Task 1: [Backend] Mở rộng Zod validator schema — thêm search param
- Task 2: [Backend] Mở rộng OrganizationService — thêm search condition
- Task 3: [Backend] Cập nhật Swagger JSDoc — thêm search param
- Task 4: [Backend] Viết unit tests cho search logic
- Task 5: [Backend] Viết integration tests
- Task 6: [Frontend] Tạo SearchInput component (nếu chưa có)
- Task 7: [Frontend] Cập nhật OrganizationListPage — thêm search input
- Task 8: [Frontend] Viết component tests

**Dependencies**: Task 1 → Task 2 → Task 3; Task 4-5 (có thể song song với Task 6-8)

---

## Risk Assessment

### HIGH RISK

- **Không có** — search là mở rộng đơn giản.

### MEDIUM RISK

- **Không có** — số lượng tổ chức ít, rủi ro thấp.

### LOW RISK

- **Search performance**: Do số lượng tổ chức không nhiều, LIKE query đủ nhanh.

---

## Success Criteria Review

Mapping từ spec.md Success Criteria sang implementation deliverables:

- **SC-001**: 100% request search hợp lệ trả về kết quả chính xác trong vòng 1 giây → Verify bằng integration tests.
- **SC-002**: 100% request search từ Manager/Staff chỉ trả về tổ chức active → Verify bằng unit test.
- **SC-003**: 100% request search từ Admin trả về tất cả tổ chức (active + inactive) khớp từ khóa → Verify bằng integration test.

---

## Deployment Checklist

Trước khi merge vào main branch:

- [ ] Unit tests pass (Service layer coverage >= 80%)
- [ ] Integration tests pass
- [ ] Swagger documentation updated
- [ ] Frontend build không lỗi (`npm run build`)
- [ ] Manual test: Admin login → search organization → search + filter active/inactive
- [ ] Manual test: Manager login → search organization (chỉ thấy active)
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
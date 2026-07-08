# Triển khai kế hoạch: Filter User (UC30)

**Branch**: `001-uc30-filter-user` | **Date**: 2026-06-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC30-feat-filter-user/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

UC30 mở rộng endpoint `GET /api/v1/users` (đã có từ UC26) với các query params filter bổ sung: `is_active` (lọc active/inactive), `from_date` / `to_date` (lọc theo khoảng thời gian tạo). Role filter (`role`) đã có sẵn từ UC26. Các filter kết hợp với nhau bằng AND logic và có thể kết hợp với search (`search`) đã có. Đây không phải endpoint riêng — là mở rộng của endpoint hiện tại.

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include), React Hook Form

**Storage**: MySQL via Prisma ORM

**Testing**: 
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first)

**Project Type**: Web application (frontend + backend)

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
.sdd/DucNM/UC30-feat-filter-user/
├── context.md              # Problem context
├── spec.md                 # Feature specification
├── plan.md                 # This file (/speckit-plan command output)
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
│   │   └── user.service.js        # Mở rộng getUsers — thêm filter params vào Prisma where
│   ├── validators/
│   │   └── user.validator.js       # Mở rộng getUsersQuerySchema — thêm is_active, from_date, to_date
│   ├── routes/
│   │   └── user.routes.js          # Cập nhật Swagger JSDoc (thêm params mới)
│   └── tests/
│       └── user/
│           ├── user.service.test.js # Thêm tests cho filter
│           └── user.api.test.js     # Thêm integration tests

frontend/
├── src/
│   ├── hooks/
│   │   └── useUsers.js             # Mở rộng hook — thêm filter states
│   ├── components/
│   │   └── ui/
│   │       ├── RoleFilter.jsx       # (đã có từ UC26) — cập nhật
│   │       ├── ActiveFilter.jsx     # Mới: lọc active/inactive
│   │       └── DateRangeFilter.jsx  # Mới: lọc khoảng thời gian
│   ├── components/
│   │   └── pages/
│   │       └── UserListPage.jsx    # Cập nhật UI — thêm filter controls
```

**Structure Decision**: Không tạo file mới ở backend — chỉ mở rộng file đã có. Frontend thêm component filter mới.

## Complexity Tracking

> **Không có vi phạm** — đây là mở rộng endpoint hiện tại với query params, tuân thủ cấu trúc chuẩn VMS.
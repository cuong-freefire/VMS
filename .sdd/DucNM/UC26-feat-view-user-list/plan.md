# Triển khai kế hoạch: View User List (UC26)

**Branch**: `001-uc26-view-user-list` | **Date**: 2026-06-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC26-feat-view-user-list/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Admin cần xem danh sách tất cả người dùng trong hệ thống VMS (bao gồm cả active và inactive) để giám sát tài khoản, kiểm tra trạng thái hoạt động và thực hiện quản lý. Chức năng này là entry point của toàn bộ module User Management. Backend xây dựng endpoint `GET /api/v1/users` với phân trang, tìm kiếm, lọc theo role. Frontend xây dựng User List screen tương ứng. Chỉ Admin mới có quyền truy cập; các role khác bị từ chối với HTTP 401/403.

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include), React Hook Form

**Storage**: MySQL via Prisma ORM (soft delete: `is_active` field on User)

**Testing**: 
- Backend: Jest + Supertest (integration tests cho endpoint, 80% coverage target cho Service layer)
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first, Browser: Chrome, Firefox, Edge)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 500ms cho danh sách < 1000 users; hỗ trợ phân trang (mặc định 20 items/page)

**Constraints**: 
- Chỉ Admin mới có quyền truy cập (Staff/Manager/Volunteer → HTTP 403, Guest → HTTP 401)
- Soft delete: User bị vô hiệu hóa (`is_active: false`) vẫn hiển thị trong danh sách (Admin view tổng thể)
- Max function length: 40 dòng; max file length: 300 dòng
- Không dùng `var`, ưu tiên `const`/`let`
- Comments chỉ giải thích WHY, không giải thích WHAT
- Bắt buộc dùng `response.util.js` (successResponse/errorResponse) cho API response

**Scale/Scope**: Support lên đến hàng nghìn users, phân trang bắt buộc. Đây là 1 trong 5 use cases của User Management module (UC26-UC30) thuộc Member 4 — AnhND.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution file (`.specify/memory/constitution.md`) hiện đang ở template state, chưa có gates cụ thể. Các nguyên tắc sau được áp dụng từ AGENTS.md và CLAUDE.md:

1. **Layered Architecture**: Controller → Service → Repository (bắt buộc)
2. **Test-First**: Tối thiểu 80% coverage cho Service layer (Jest)
3. **API Response Format**: Buộc dùng `response.util.js` (success/error pattern)
4. **Soft Delete**: User master data dùng `is_active = false` (không hard delete)
5. **Swagger Documentation**: Bắt buộc JSDoc cho mọi endpoint
6. **Cross-module**: Không import Repository từ module khác — giao tiếp qua Service layer

**Kết luận**: Không có vi phạm. Gates pass.

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC26-feat-view-user-list/
├── context.md              # Problem context, constraints, assumptions
├── spec.md                 # Feature specification (EARS notation)
├── plan.md                 # This file (/speckit-plan command output)
├── research.md             # Phase 0 output (technical research)
├── data-model.md           # Phase 1 output (data model)
├── quickstart.md           # Phase 1 output (quick start guide)
├── contracts/              # Phase 1 output (API contracts)
└── tasks.md                # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config/                    # Logger config, Swagger config
│   ├── controllers/
│   │   └── user.controller.js     # Controller cho User Management
│   ├── services/
│   │   └── user.service.js        # Business logic: pagination, search, filter, role check
│   ├── repositories/
│   │   └── user.repository.js     # Data access (Prisma queries)
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT authentication (đã có)
│   │   └── authorize.middleware.js # Role-based authorization
│   ├── routes/
│   │   ├── auth.routes.js          # (đã có)
│   │   ├── user.routes.js          # Mở rộng: thêm GET /users
│   │   └── index.routes.js         # Route aggregator
│   ├── utils/
│   │   ├── jwt.util.js             # (đã có)
│   │   ├── response.util.js        # (đã có)
│   │   └── pagination.util.js      # Pagination helper
│   ├── validators/
│   │   └── user.validator.js       # Zod schemas cho validation
│   ├── app.js                      # Express app config (đã có)
│   └── server.js                   # Entry point (đã có)
├── prisma/
│   └── schema.prisma               # Database schema (User, Role models)
└── tests/
    └── user/
        ├── user.service.test.js    # Unit tests
        └── user.api.test.js        # Integration tests (Supertest)

frontend/
├── src/
│   ├── api/
│   │   └── userApi.js              # Axios client cho user endpoints
│   ├── components/
│   │   ├── pages/
│   │   │   └── UserListPage.jsx    # User List screen chính
│   │   └── ui/
│   │       ├── UserTable.jsx       # Bảng hiển thị user list
│   │       ├── SearchBar.jsx       # Ô tìm kiếm
│   │       ├── RoleFilter.jsx      # Dropdown lọc theo role
│   │       └── Pagination.jsx      # Component phân trang
│   ├── contexts/
│   │   └── authContext.context.js  # Auth context (đã có)
│   ├── hooks/
│   │   └── useUsers.js             # Custom hook cho user operations
│   ├── utils/
│   │   └── formatDate.js           # Format date helper
│   ├── App.js                      # (đã có)
│   └── index.js                    # (đã có)
└── tests/
    └── UserListPage.test.jsx       # Component tests
```

**Structure Decision**: Sử dụng Option 2 (Web application — frontend + backend) theo đúng cấu trúc mẫu của project VMS. Backend theo kiến trúc phân tầng Controller → Service → Repository. Frontend tách biệt pages, components, hooks, api layers. Các file tuân thủ naming conventions từ AGENTS.md:
- Backend: `user.controller.js`, `user.service.js`, `user.repository.js`
- Frontend: `UserListPage.jsx`, `UserTable.jsx`

## Complexity Tracking

> **Không có vi phạm cần justification** — đây là CRUD feature đơn giản, tuân thủ cấu trúc chuẩn của VMS project.
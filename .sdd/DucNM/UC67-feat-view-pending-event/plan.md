# Triển khai kế hoạch: View Pending Event (UC67)

**Branch**: `001-uc67-view-pending-event` | **Date**: 2026-07-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC67-feat-view-pending-event/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Manager cần xem danh sách sự kiện đang chờ duyệt (PENDING) để tiến hành phê duyệt hoặc từ chối. Backend tái sử dụng endpoint `GET /api/v1/events` với query param `status=pending` (theo context A1). Chỉ Manager và Admin mới có quyền truy cập; Staff/Volunteer bị 403, Guest bị 401. Hỗ trợ phân trang (page, limit). Kết quả trả về danh sách event với status = PENDING.

**⚠️ Cross-module awareness**: Endpoint `GET /api/v1/events` có thể đã được sử dụng bởi module khác (UC08 — View Event List của NamLD). Cần đảm bảo:
- Thêm query param `status` vào event listing endpoint (nếu chưa có)
- Manager/Admin có thể filter theo `status=pending`
- Các role khác (Guest, Volunteer) không bị ảnh hưởng — họ chỉ thấy event APPROVED (theo business rule: chỉ event APPROVED mới hiển thị cho Volunteer)

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include)

**Storage**: MySQL via Prisma ORM (Event model với status field)

**Testing**: 
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 500ms, hỗ trợ phân trang (mặc định 20 items/page)

**Constraints**: 
- Chỉ Manager và Admin mới có quyền xem danh sách PENDING (Staff/Volunteer → HTTP 403, Guest → HTTP 401)
- Dùng query param `status=pending` trên endpoint `GET /api/v1/events` — không tạo endpoint riêng
- Hỗ trợ phân trang (page, limit) — mặc định limit = 20
- Response bao gồm: event_id, title, organization, created_at, status
- Swagger JSDoc bắt buộc
- Max function length: 40 dòng; max file length: 300 dòng
- Bắt buộc dùng `response.util.js`

**Scale/Scope**: Module mới — Event Approval Management (UC67-UC70). Thuộc Member 4 — AnhND. Mở rộng event listing endpoint đã có (nếu đã được tạo bởi Member 2/3) hoặc tạo mới nếu chưa có. Thêm query param `status` filter + role-based visibility cho PENDING events.

## Constitution Check

Các nguyên tắc từ AGENTS.md và CLAUDE.md:

1. **Layered Architecture**: Controller → Service → Repository (bắt buộc)
2. **Test-First**: Tối thiểu 80% coverage cho Service layer
3. **API Response Format**: Buộc dùng `response.util.js`
4. **Swagger Documentation**: Bắt buộc JSDoc cho mọi endpoint
5. **Cross-module**: Không import Repository từ module khác — giao tiếp qua Service layer

**Kết luận**: Không có vi phạm. Gates pass.

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC67-feat-view-pending-event/
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
│   ├── controllers/
│   │   └── event.controller.js       # MỚI: handler getEvents với status filter
│   ├── services/
│   │   └── event.service.js          # MỚI: business logic — role-based visibility + status filter
│   ├── repositories/
│   │   └── event.repository.js       # MỚI: Prisma queries
│   ├── middleware/
│   │   ├── auth.middleware.js         # (đã có)
│   │   └── authorize.middleware.js    # (từ UC26)
│   ├── routes/
│   │   └── event.routes.js           # MỚI: GET /api/v1/events
│   ├── validators/
│   │   └── event.validator.js        # MỚI: Zod schemas
│   ├── app.js                        # Cập nhật: mount eventRoutes
│   └── server.js                     # (đã có)
├── prisma/
│   └── schema.prisma                 # MỚI: Event model (nếu chưa có)
└── tests/
    └── event/
        ├── event.service.test.js     # MỚI: unit tests
        └── event.api.test.js         # MỚI: integration tests

frontend/
├── src/
│   ├── api/
│   │   └── eventApi.js               # MỚI: Axios client
│   ├── components/
│   │   └── pages/
│   │       └── PendingEventListPage.jsx # MỚI: Pending Event List screen
│   ├── hooks/
│   │   └── usePendingEvents.js       # MỚI: custom hook
│   └── App.js                        # Cập nhật: thêm route /events/pending
```

**Structure Decision**: Option 2 (Web application). Tạo mới toàn bộ stack cho Event Approval module. Nếu Event model và event endpoint đã có từ module khác (Member 2/3), chỉ cần mở rộng thay vì tạo mới.

## Complexity Tracking

> **Không có vi phạm** — feature đơn giản (mở rộng endpoint với status filter + role-based visibility), pattern tương tự User Management (UC26) và Organization Management (UC37).
# Triển khai kế hoạch: View Pending Event Detail (UC68)

**Branch**: `001-uc68-view-pending-event-detail` | **Date**: 2026-07-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC68-feat-view-pending-event-detail/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Manager cần xem chi tiết một sự kiện đang chờ duyệt (PENDING) để đánh giá trước khi phê duyệt hoặc từ chối. Backend tái sử dụng endpoint `GET /api/v1/events/:id` (từ UC09 — View Event Detail của NamLD). Chỉ Manager và Admin mới có quyền xem event PENDING; Staff/Volunteer bị 403 khi truy cập event PENDING, Guest bị 401. Nếu event ID không tồn tại → 404.

**⚠️ Cross-module dependency**: UC68 tái sử dụng endpoint `GET /api/v1/events/:id` từ UC09 (NamLD). Cần mở rộng service layer để Manager/Admin có thể xem event PENDING (UC09 hiện tại chỉ cho phép xem event APPROVED). Không tạo endpoint mới.

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include)

**Storage**: MySQL via Prisma ORM (Event model — đã có từ UC67)

**Testing**: 
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 500ms

**Constraints**: 
- Chỉ Manager và Admin mới có quyền xem event PENDING (Staff/Volunteer → HTTP 403, Guest → HTTP 401)
- Trả về HTTP 404 nếu event ID không tồn tại
- Trả về HTTP 400 nếu ID không hợp lệ
- Hiển thị thông tin người tạo (created_by)
- Swagger JSDoc bắt buộc
- Max function length: 40 dòng; max file length: 300 dòng
- Bắt buộc dùng `response.util.js`

**Scale/Scope**: Mở rộng Event module (UC67). Kế thừa Event infrastructure từ UC67. Mở rộng service logic cho endpoint `GET /api/v1/events/:id` (UC09) để hỗ trợ Manager/Admin xem event PENDING.

## Constitution Check

Các nguyên tắc từ AGENTS.md và CLAUDE.md:

1. **Layered Architecture**: Controller → Service → Repository (bắt buộc)
2. **Test-First**: Tối thiểu 80% coverage cho Service layer
3. **API Response Format**: Buộc dùng `response.util.js`
4. **Swagger Documentation**: Bắt buộc JSDoc cho mọi endpoint
5. **Cross-module**: Không import Repository từ module khác

**Kết luận**: Không có vi phạm. Gates pass.

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC68-feat-view-pending-event-detail/
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
│   │   └── event.service.js        # Mở rộng — thêm getEventById với role-based visibility (kế thừa UC67)
│   ├── controllers/
│   │   └── event.controller.js     # Mở rộng — thêm handler getEventByIdHandler (kế thừa UC67)
│   ├── repositories/
│   │   └── event.repository.js     # Mở rộng — thêm findEventById (kế thừa UC67)
│   └── routes/
│       └── event.routes.js         # Mở rộng — thêm route GET /:id (kế thừa UC67)
```

**Structure Decision**: Option 2 (Web application). Mở rộng Event module từ UC67. Tái sử dụng endpoint `GET /api/v1/events/:id` — không tạo endpoint mới.

## Complexity Tracking

> **Không có vi phạm** — feature đơn giản (mở rộng endpoint hiện tại với role-based visibility), kế thừa infrastructure từ UC67.
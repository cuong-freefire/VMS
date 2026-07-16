# Triển khai kế hoạch: Approve Event (UC69)

**Branch**: `001-uc69-approve-event` | **Date**: 2026-07-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC69-feat-approve-event/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Manager cần phê duyệt sự kiện đang chờ duyệt (PENDING) để chuyển sang APPROVED, cho phép Volunteer nhìn thấy và đăng ký. Backend xây dựng endpoint `PATCH /api/v1/events/:id/approve`. Chỉ Manager và Admin mới có quyền; Staff/Volunteer bị 403, Guest bị 401. Hệ thống kiểm tra event tồn tại (404 nếu không) và status hiện tại là PENDING (409 nếu không). Ghi nhận approved_by (user ID của Manager) và approved_at (timestamp) vào event. Kế thừa Event infrastructure từ UC67/UC68.

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include)

**Storage**: MySQL via Prisma ORM (Event model — đã có từ UC67, cần thêm fields approved_by, approved_at)

**Testing**: 
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 1 giây

**Constraints**: 
- Chỉ Manager và Admin mới có quyền phê duyệt (Staff/Volunteer → HTTP 403, Guest → HTTP 401)
- Event phải có status = PENDING mới được phê duyệt — nếu không → HTTP 409
- Event ID không tồn tại → HTTP 404
- Cập nhật: status = 'APPROVED', approved_by = currentUser.user_id, approved_at = new Date()
- Ghi audit log sau khi phê duyệt thành công
- Swagger JSDoc bắt buộc
- Max function length: 40 dòng; max file length: 300 dòng
- Bắt buộc dùng `response.util.js`

**Scale/Scope**: Mở rộng Event Approval module (UC67-UC70). Kế thừa Event infrastructure từ UC67/UC68. Cần cập nhật Prisma schema thêm field `approved_by` (FK → User) và `approved_at` (DateTime). Thêm mới service function, controller handler, route.

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
.sdd/DucNM/UC69-feat-approve-event/
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
│   │   └── event.controller.js     # Thêm handler approveEvent (kế thừa UC67/UC68)
│   ├── services/
│   │   └── event.service.js        # Thêm hàm approveEvent (kế thừa UC67/UC68)
│   ├── repositories/
│   │   └── event.repository.js     # Thêm hàm updateEventStatus (kế thừa UC67/UC68)
│   ├── middleware/                  # (đã có)
│   ├── routes/
│   │   └── event.routes.js         # Thêm route PATCH /:id/approve (kế thừa UC67/UC68)
│   └── tests/
│       └── event/
│           ├── event.service.test.js # Thêm tests cho approveEvent
│           └── event.api.test.js     # Thêm tests cho PATCH /api/v1/events/:id/approve
├── prisma/
│   └── schema.prisma               # Cập nhật: thêm approved_by, approved_at vào Event model

frontend/
├── src/
│   ├── api/
│   │   └── eventApi.js             # Thêm hàm approveEvent (kế thừa UC67/UC68)
│   └── components/
│       └── pages/
│           └── PendingEventDetailPage.jsx # Cập nhật: thêm nút Approve (kế thừa UC68)
```

**Structure Decision**: Option 2 (Web application). Kế thừa Event infrastructure từ UC67/UC68. Thêm mới hàm `approveEvent` ở các layer tương ứng. Cập nhật Prisma schema thêm 2 fields.

## Complexity Tracking

> **Không có vi phạm** — feature đơn giản (1 endpoint PATCH với status validation + audit log), kế thừa infrastructure từ UC67/UC68.
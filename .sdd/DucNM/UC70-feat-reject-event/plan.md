# Triển khai kế hoạch: Reject Event (UC70)

**Branch**: `001-uc70-reject-event` | **Date**: 2026-07-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC70-feat-reject-event/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Manager cần từ chối sự kiện đang chờ duyệt (PENDING) không đủ điều kiện, kèm lý do từ chối. Backend xây dựng endpoint `PATCH /api/v1/events/:id/reject`. Chỉ Manager và Admin mới có quyền; Staff/Volunteer bị 403, Guest bị 401. Hệ thống kiểm tra event tồn tại (404 nếu không), status hiện tại là PENDING (409 nếu không), và yêu cầu rejection_reason (bắt buộc, tối thiểu 10 ký tự). Ghi nhận rejection_reason, rejected_by, rejected_at. Kế thừa Event infrastructure từ UC67/UC68/UC69.

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include), React Hook Form

**Storage**: MySQL via Prisma ORM (Event model — đã có từ UC67, cần thêm fields rejection_reason, rejected_by, rejected_at)

**Testing**: 
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 1 giây

**Constraints**: 
- Chỉ Manager và Admin mới có quyền từ chối (Staff/Volunteer → HTTP 403, Guest → HTTP 401)
- Event phải có status = PENDING mới được từ chối — nếu không → HTTP 409
- `rejection_reason` là bắt buộc, tối thiểu 10 ký tự — nếu không → HTTP 400
- Event ID không tồn tại → HTTP 404
- Cập nhật: status = 'REJECTED', rejection_reason, rejected_by = currentUser.user_id, rejected_at = new Date()
- Ghi audit log sau khi từ chối thành công
- Swagger JSDoc bắt buộc
- Max function length: 40 dòng; max file length: 300 dòng
- Bắt buộc dùng `response.util.js`

**Scale/Scope**: Mở rộng Event Approval module (UC67-UC70). Kế thừa Event infrastructure từ UC67/UC68/UC69. Cần cập nhật Prisma schema thêm fields `rejection_reason`, `rejected_by` (FK → User), `rejected_at` (DateTime). Thêm mới service function, controller handler, route. Pattern tương tự Approve Event (UC69) nhưng có request body.

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
.sdd/DucNM/UC70-feat-reject-event/
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
│   │   └── event.controller.js     # Thêm handler rejectEvent (kế thừa UC67-69)
│   ├── services/
│   │   └── event.service.js        # Thêm hàm rejectEvent (kế thừa UC67-69)
│   ├── repositories/
│   │   └── event.repository.js     # Thêm hàm updateEventStatus (đã có từ UC69)
│   ├── routes/
│   │   └── event.routes.js         # Thêm route PATCH /:id/reject (kế thừa UC67-69)
│   ├── validators/
│   │   └── event.validator.js      # Thêm rejectEventSchema (Zod)
│   └── tests/
│       └── event/
│           ├── event.service.test.js # Thêm tests cho rejectEvent
│           └── event.api.test.js     # Thêm tests cho PATCH /api/v1/events/:id/reject
├── prisma/
│   └── schema.prisma               # Cập nhật: thêm rejection_reason, rejected_by, rejected_at

frontend/
├── src/
│   ├── api/
│   │   └── eventApi.js             # Thêm hàm rejectEvent (kế thừa UC67-69)
│   └── components/
│       └── pages/
│           └── PendingEventDetailPage.jsx # Cập nhật: thêm nút Reject + dialog nhập lý do
```

**Structure Decision**: Option 2 (Web application). Kế thừa Event infrastructure từ UC67/UC68/UC69. Thêm mới hàm `rejectEvent` ở các layer tương ứng. Cập nhật Prisma schema thêm 3 fields. Pattern tương tự Approve Event (UC69) nhưng có request body với Zod validation.

## Complexity Tracking

> **Không có vi phạm** — feature đơn giản (1 endpoint PATCH với body validation + status check + audit log), kế thừa infrastructure từ UC67/UC68/UC69.
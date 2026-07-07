# Triển khai kế hoạch: View Notification Detail (UC42)

**Branch**: `001-uc42-view-notification-detail` | **Date**: 2026-07-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC42-feat-view-notification-detail/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Người dùng cần xem nội dung đầy đủ của một thông báo cụ thể, bao gồm thông tin tham chiếu entity (event, application, certificate) nếu có. Backend xây dựng endpoint `GET /api/v1/notifications/:id`. Chỉ user sở hữu notification mới được xem — nếu không, trả về HTTP 404. Xem chi tiết tự động đánh dấu notification là đã đọc (theo A1). Nếu entity tham chiếu đã bị xóa mềm, trả về `reference_deleted: true`. Kế thừa Notification infrastructure từ UC41.

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include)

**Storage**: MySQL via Prisma ORM (Notification model — đã có từ UC41)

**Testing**: 
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 300ms

**Constraints**: 
- Chỉ user sở hữu notification mới được xem — người khác → HTTP 404
- Guest → HTTP 401
- Xem chi tiết tự động đánh dấu is_read = true (theo A1)
- Nếu reference entity bị soft-delete → `reference_deleted: true`, không link
- Trả về thông tin tóm tắt của entity tham chiếu (tên sự kiện, tên user, v.v.) nếu entity tồn tại
- Swagger JSDoc bắt buộc
- Max function length: 40 dòng; max file length: 300 dòng
- Bắt buộc dùng `response.util.js`

**Scale/Scope**: Mở rộng Notification module (UC41). Kế thừa Notification model từ UC41. Thêm mới service function, controller handler, route GET /:id.

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
.sdd/DucNM/UC42-feat-view-notification-detail/
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
│   │   └── notification.controller.js  # Thêm handler getNotificationById (kế thừa UC41)
│   ├── services/
│   │   └── notification.service.js     # Thêm hàm getNotificationById (kế thừa UC41)
│   ├── repositories/
│   │   └── notification.repository.js  # Thêm hàm findById + markAsRead (kế thừa UC41)
│   └── routes/
│       └── notification.routes.js      # Thêm route GET /:id (kế thừa UC41)
```

**Structure Decision**: Option 2 (Web application). Mở rộng Notification module từ UC41. Kế thừa toàn bộ infrastructure. Thêm mới hàm `getNotificationById` ở các layer tương ứng.

## Complexity Tracking

> **Không có vi phạm** — feature đơn giản (1 endpoint GET với ownership check + auto-mark-read + reference entity lookup), kế thừa infrastructure từ UC41.
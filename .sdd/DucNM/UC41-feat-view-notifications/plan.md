# Triển khai kế hoạch: View Notifications (UC41)

**Branch**: `001-uc41-view-notifications` | **Date**: 2026-07-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC41-feat-view-notifications/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Người dùng đã đăng nhập (Volunteer, Staff, Manager, Admin) cần xem danh sách thông báo của mình, sắp xếp mới nhất ở trên cùng, kèm badge đếm số thông báo chưa đọc. Backend xây dựng 2 endpoints: `GET /api/v1/notifications` (danh sách có phân trang) và `GET /api/v1/notifications/unread-count` (số lượng chưa đọc cho polling mỗi 30 giây). Mỗi user chỉ thấy thông báo của chính mình. Guest bị 401.

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include)

**Storage**: MySQL via Prisma ORM (Notification model)

**Testing**: 
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Danh sách 100 notifications tải < 1 giây. Unread count polling mỗi 30 giây.

**Constraints**: 
- Mọi user đã đăng nhập đều có quyền xem thông báo của chính mình (Guest → HTTP 401)
- User chỉ thấy notification của mình — không thể xem của người khác
- Sắp xếp: `created_at DESC` (mới nhất trên cùng)
- Phân trang: page, limit (mặc định 20)
- Endpoint riêng cho unread count: `GET /api/v1/notifications/unread-count`
- Swagger JSDoc bắt buộc
- Max function length: 40 dòng; max file length: 300 dòng
- Bắt buộc dùng `response.util.js`

**Scale/Scope**: Module mới — Notification Management (UC41-UC44). Thuộc Member 5 — DucNM. Tạo mới toàn bộ layers: controller, service, repository, routes, validator cho Notification.

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
.sdd/DucNM/UC41-feat-view-notifications/
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
│   │   └── notification.controller.js  # MỚI: handlers
│   ├── services/
│   │   └── notification.service.js     # MỚI: business logic
│   ├── repositories/
│   │   └── notification.repository.js  # MỚI: Prisma queries
│   ├── middleware/
│   │   └── auth.middleware.js           # (đã có)
│   ├── routes/
│   │   └── notification.routes.js      # MỚI: routes
│   ├── validators/
│   │   └── notification.validator.js   # MỚI: Zod schemas
│   ├── app.js                          # Cập nhật: mount notificationRoutes
│   └── server.js                       # (đã có)
├── prisma/
│   └── schema.prisma                   # MỚI: Notification model
└── tests/
    └── notification/
        ├── notification.service.test.js # MỚI: unit tests
        └── notification.api.test.js     # MỚI: integration tests

frontend/
├── src/
│   ├── api/
│   │   └── notificationApi.js          # MỚI: Axios client
│   ├── components/
│   │   └── pages/
│   │       └── NotificationListPage.jsx # MỚI: Notification List screen
│   ├── hooks/
│   │   └── useNotifications.js         # MỚI: custom hook
│   └── App.js                          # Cập nhật: thêm route /notifications
```

**Structure Decision**: Option 2 (Web application). Tạo mới toàn bộ stack cho Notification module.

## Complexity Tracking

> **Không có vi phạm** — feature đơn giản (2 endpoints GET với pagination + unread count), pattern tương tự User Management (UC26).
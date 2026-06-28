# Implementation Plan: View Notification Detail (UC42)

**Branch**: `feat/uc42-view-notification-detail` | **Date**: 2026-06-29 | **Spec**: `.sdd/DucNM/UC42-feat-view-notification-detail/spec.md`

**Input**: Feature specification from `.sdd/DucNM/UC42-feat-view-notification-detail/spec.md`

---

## Summary

Người dùng click vào một thông báo để xem nội dung đầy đủ và được chuyển hướng đến entity liên quan. Tự động đánh dấu notification là đã đọc khi xem chi tiết.

Kỹ thuật: Tạo REST API `GET /api/v1/notifications/:id` trả về chi tiết notification kèm thông tin tóm tắt của entity tham chiếu.

---

## Technical Context

**Language/Version**: NodeJS + Javascript (ESM), Express 5.x

**Primary Dependencies**: Prisma (MySQL), Zod, JWT (HttpOnly Cookie), Pino, swagger-jsdoc, swagger-ui-express

**Storage**: MySQL (via Prisma ORM)

**Testing**: Jest + Supertest (Backend), Jest + React Testing Library (Frontend)

**Target Platform**: Web (Browser)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 300ms

**Constraints**:
- Chỉ user sở hữu mới xem được. Người khác → 404
- Tự động mark is_read = true khi xem
- Entity tham chiếu bị xóa mềm → reference_deleted = true
- API format: `GET /api/v1/notifications/:id`
- Swagger JSDoc bắt buộc

**Scale/Scope**: Chi tiết 1 notification

---

## Constitution Check

1. ✅ **Layered Architecture**: Controller → Service → Repository.
2. ✅ **API Format**: Tuân thủ `/api/v1/[resource]` prefix và response format ADR-006.
3. ✅ **Swagger Documentation**: Bắt buộc JSDoc @swagger.

---

## Project Structure

```text
backend/
├── src/
│   ├── controllers/notification.controller.js    # getById()
│   ├── services/notification.service.js          # getNotificationById()
│   ├── repositories/notification.repository.js   # findById()
│   └── routes/notification.routes.js             # GET /api/v1/notifications/:id

frontend/
├── src/
│   ├── api/notificationApi.js                    # getNotificationById()
│   ├── components/notifications/
│   │   └── NotificationDetailPage.jsx
│   └── services/notification.service.js
```

**Structure Decision**: Web application. Backend layered. Frontend feature-based.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
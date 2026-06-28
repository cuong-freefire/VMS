# Implementation Plan: Mark Notification As Read (UC43)

**Branch**: `feat/uc43-mark-notification-read` | **Date**: 2026-06-29 | **Spec**: `.sdd/DucNM/UC43-feat-mark-notification-read/spec.md`

**Input**: Feature specification from `.sdd/DucNM/UC43-feat-mark-notification-read/spec.md`

---

## Summary

Người dùng cần đánh dấu thông báo là đã đọc sau khi xem (từng cái hoặc tất cả). Idempotent — đánh dấu lại không gây lỗi.

Kỹ thuật: Tạo REST API `PATCH /api/v1/notifications/:id/read` (single) và `PATCH /api/v1/notifications/read-all` (bulk).

---

## Technical Context

**Language/Version**: NodeJS + Javascript (ESM), Express 5.x

**Primary Dependencies**: Prisma (MySQL), Zod, JWT (HttpOnly Cookie), Pino, swagger-jsdoc, swagger-ui-express

**Storage**: MySQL (via Prisma ORM)

**Testing**: Jest + Supertest (Backend), Jest + React Testing Library (Frontend)

**Target Platform**: Web (Browser)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Single < 200ms. Bulk 100 notifications < 500ms.

**Constraints**:
- Một chiều: Chỉ false → true, không cho phép un-read
- Idempotent: Đánh dấu lại không lỗi
- Chỉ chủ sở hữu. Người khác → 404
- API format: `PATCH /api/v1/notifications/:id/read`, `PATCH /api/v1/notifications/read-all`
- Swagger JSDoc bắt buộc

**Scale/Scope**: Đánh dấu 1 hoặc tất cả notification của user

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
│   ├── controllers/notification.controller.js    # markRead(), markAllRead()
│   ├── services/notification.service.js          # markAsRead(), markAllAsRead()
│   ├── repositories/notification.repository.js   # updateRead(), updateAllRead()
│   └── routes/notification.routes.js             # PATCH /api/v1/notifications/:id/read, PATCH /api/v1/notifications/read-all
```

**Structure Decision**: Web application. Backend layered.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
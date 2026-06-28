# Implementation Plan: Create Notification (UC44)

**Branch**: `feat/uc44-create-notification` | **Date**: 2026-06-29 | **Spec**: `.sdd/DucNM/UC44-feat-create-notification/spec.md`

**Input**: Feature specification from `.sdd/DucNM/UC44-feat-create-notification/spec.md`

---

## Summary

Staff/Admin cần tạo thông báo gửi đến một hoặc nhiều người dùng. Hệ thống tự động sinh notification khi có sự kiện quan trọng (application approved/rejected, certificate issued).

Kỹ thuật: Tạo REST API `POST /api/v1/notifications` cho manual create. NotificationService có thể được gọi từ module khác để auto-generate.

---

## Technical Context

**Language/Version**: NodeJS + Javascript (ESM), Express 5.x

**Primary Dependencies**: Prisma (MySQL), Zod, JWT (HttpOnly Cookie), Pino, swagger-jsdoc, swagger-ui-express

**Storage**: MySQL (via Prisma ORM)

**Testing**: Jest + Supertest (Backend), Jest + React Testing Library (Frontend)

**Target Platform**: Web (Browser)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Tạo 500 notifications < 3s

**Constraints**:
- Staff/Admin only. Guest → 401, Volunteer → 403
- Staff chỉ gửi cho user trong event mình quản lý
- user_ids: max 500, min 1
- title: max 200, message: max 2000
- API format: `POST /api/v1/notifications`
- Audit log cho manual create
- Swagger JSDoc bắt buộc

**Scale/Scope**: Tạo notification cho tối đa 500 user/lần

---

## Constitution Check

1. ✅ **Layered Architecture**: Controller → Service → Repository.
2. ✅ **API Format**: Tuân thủ `/api/v1/[resource]` prefix và response format ADR-006.
3. ✅ **Swagger Documentation**: Bắt buộc JSDoc @swagger.
4. ✅ **Phân quyền Role**: Staff/Admin only.

---

## Project Structure

```text
backend/
├── src/
│   ├── controllers/notification.controller.js    # create()
│   ├── services/notification.service.js          # createNotification()
│   ├── repositories/notification.repository.js   # createMany()
│   ├── validators/notification.validator.js      # createNotificationSchema
│   └── routes/notification.routes.js             # POST /api/v1/notifications
```

**Structure Decision**: Web application. Backend layered.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
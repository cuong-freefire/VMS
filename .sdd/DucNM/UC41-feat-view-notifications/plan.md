# Implementation Plan: View Notifications (UC41)

**Branch**: `feat/uc41-view-notifications` | **Date**: 2026-06-29 | **Spec**: `.sdd/DucNM/UC41-feat-view-notifications/spec.md`

**Input**: Feature specification from `.sdd/DucNM/UC41-feat-view-notifications/spec.md`

---

## Summary

Người dùng đã đăng nhập cần xem danh sách thông báo của mình, sắp xếp mới nhất ở trên cùng, kèm badge đếm số thông báo chưa đọc. Hỗ trợ phân trang và polling unread count.

Kỹ thuật: Tạo REST API `GET /api/v1/notifications` (phân trang) và `GET /api/v1/notifications/unread-count` (badge). Frontend polling 30s.

---

## Technical Context

**Language/Version**: NodeJS + Javascript (ESM), Express 5.x

**Primary Dependencies**: Prisma (MySQL), Zod, JWT (HttpOnly Cookie), Pino, swagger-jsdoc, swagger-ui-express

**Storage**: MySQL (via Prisma ORM)

**Testing**: Jest + Supertest (Backend), Jest + React Testing Library (Frontend)

**Target Platform**: Web (Browser)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Danh sách 100 notification tải < 1s. Badge unread cập nhật trong 30s (polling).

**Constraints**:
- Chỉ user đã đăng nhập: Guest → 401
- Chỉ thấy notification của chính mình (từ JWT)
- Sắp xếp: created_at DESC
- Phân trang: page/limit, mặc định limit = 20
- API format: `GET /api/v1/notifications`, `GET /api/v1/notifications/unread-count`
- Swagger JSDoc bắt buộc

**Scale/Scope**: ~10k notifications/tháng

---

## Constitution Check

1. ✅ **Layered Architecture**: Controller → Service → Repository.
2. ✅ **API Format**: Tuân thủ `/api/v1/[resource]` prefix và response format ADR-006.
3. ✅ **Swagger Documentation**: Bắt buộc JSDoc @swagger.
4. ✅ **Phân quyền Role**: Mọi user đã đăng nhập đều có quyền xem notification của mình.

---

## Project Structure

```text
backend/
├── src/
│   ├── controllers/notification.controller.js    # list(), unreadCount()
│   ├── services/notification.service.js          # getNotifications(), getUnreadCount()
│   ├── repositories/notification.repository.js   # findByUserId(), countUnread()
│   └── routes/notification.routes.js             # GET /api/v1/notifications, GET /api/v1/notifications/unread-count

frontend/
├── src/
│   ├── api/notificationApi.js                    # getNotifications(), getUnreadCount()
│   ├── components/notifications/
│   │   ├── NotificationListPage.jsx
│   │   └── NotificationBadge.jsx
│   ├── services/notification.service.js
│   └── hooks/useNotification.js
```

**Structure Decision**: Web application. Backend layered. Frontend feature-based.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
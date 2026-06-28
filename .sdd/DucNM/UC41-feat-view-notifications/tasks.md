# Tasks: View Notifications (UC41)

**Input**: Design documents from `.sdd/DucNM/UC41-feat-view-notifications/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), context.md

---

## Phase 1: Setup & Foundation

- [ ] T001 [P] [SETUP] Tạo Prisma schema cho bảng `notifications` và `notification_types` trong `backend/prisma/schema.prisma`
- [ ] T002 [P] [SETUP] Tạo file `backend/src/repositories/notification.repository.js` — findByUserId(), countUnread()
- [ ] T003 [P] [SETUP] Tạo file `backend/src/services/notification.service.js` — getNotifications(), getUnreadCount()
- [ ] T004 [P] [SETUP] Tạo file `backend/src/controllers/notification.controller.js` — list(), unreadCount()
- [ ] T005 [P] [SETUP] Tạo file `backend/src/routes/notification.routes.js`
- [ ] T006 [P] [SETUP] Tạo file `frontend/src/api/notificationApi.js`
- [ ] T007 [P] [SETUP] Tạo file `frontend/src/services/notification.service.js`
- [ ] T008 [P] [SETUP] Tạo file `frontend/src/hooks/useNotification.js`
- [ ] T009 [P] [SETUP] Tạo file `frontend/src/components/notifications/NotificationListPage.jsx`
- [ ] T010 [P] [SETUP] Tạo file `frontend/src/components/notifications/NotificationBadge.jsx`

---

## Phase 2: User Story 1 — Xem danh sách thông báo có phân trang (Priority: P1) 🎯 MVP

**Goal**: User xem danh sách notification, phân trang, sắp xếp mới nhất.

**Independent Test**: Tạo 5 notifications cho user A, gọi API với token user A → đủ 5.

### Tests

- [ ] T011 [P] [US1] Contract test: `GET /api/v1/notifications` — danh sách phân trang, sắp xếp DESC trong `backend/tests/notification.test.js`
- [ ] T012 [P] [US1] Contract test: `GET /api/v1/notifications?page=1&limit=20` — phân trang hoạt động
- [ ] T013 [P] [US1] Contract test: `GET /api/v1/notifications` — không có notification → mảng rỗng

### Implementation

- [ ] T014 [US1] Implement `notification.repository.js` — findByUserId(userId, page, limit) với orderBy created_at DESC
- [ ] T015 [US1] Implement `notification.service.js` — getNotifications(userId, page, limit): chỉ lấy notification của user từ JWT
- [ ] T016 [US1] Implement `notification.controller.js` — list(): validate query params, gọi service
- [ ] T017 [US1] Implement `NotificationListPage.jsx` — danh sách, phân biệt đã đọc/chưa đọc, load more
- [ ] T018 [US1] Thêm Swagger JSDoc cho `GET /api/v1/notifications`

---

## Phase 3: User Story 2 — Xem số lượng thông báo chưa đọc (Priority: P1)

**Goal**: User thấy badge unread count trên navbar, polling 30s.

**Independent Test**: Đánh dấu 3 notifications chưa đọc → unread_count = 3.

### Tests

- [ ] T019 [P] [US2] Contract test: `GET /api/v1/notifications/unread-count` — trả về { unread_count: N }
- [ ] T020 [P] [US2] Contract test: `GET /api/v1/notifications/unread-count` — không có unread → 0

### Implementation

- [ ] T021 [US2] Implement `notification.repository.js` — countUnread(userId)
- [ ] T022 [US2] Implement `notification.service.js` — getUnreadCount(userId)
- [ ] T023 [US2] Implement `notification.controller.js` — unreadCount()
- [ ] T024 [US2] Implement `NotificationBadge.jsx` — badge trên navbar, polling 30s
- [ ] T025 [US2] Implement `useNotification.js` hook — polling unread count
- [ ] T026 [US2] Thêm Swagger JSDoc cho `GET /api/v1/notifications/unread-count`

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (US1)**: Depends on Phase 1 — Notification list (MVP)
- **Phase 3 (US2)**: Depends on Phase 2 — Unread badge

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
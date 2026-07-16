# Tasks: View Notifications (UC41)

**Input**: Design documents từ `.sdd/DucNM/UC41-feat-view-notifications/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1, US2)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- **New module**: Notification Management — tạo mới toàn bộ stack
- **2 endpoints**: `GET /api/v1/notifications` + `GET /api/v1/notifications/unread-count`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Thiết lập database model và infrastructure dùng chung

- [ ] T001 Thêm Notification model vào Prisma schema trong `backend/prisma/schema.prisma` — fields: notification_id, user_id (FK → User), title, message (optional), type, reference_id (optional), reference_type (optional), is_read (default false), created_at, updated_at
- [ ] T002 Chạy Prisma migration: `npx prisma migrate dev --name add_notification_model`
- [ ] T003 [P] Tạo notification repository trong `backend/src/repositories/notification.repository.js` — hàm `findNotifications({ skip, take, where })` và `countUnreadByUserId(userId)`
- [ ] T004 Tạo notification validator trong `backend/src/validators/notification.validator.js` — `getNotificationsQuerySchema` (page, limit)

---

## Phase 2: User Story 1 - Xem danh sách thông báo có phân trang (Priority: P1) 🎯 MVP

**Goal**: User gọi `GET /api/v1/notifications` và thấy danh sách notification của chính mình, sắp xếp mới nhất lên đầu, có phân trang.

**Independent Test**: Tạo 5 notifications cho user A, gọi `GET /api/v1/notifications` với token user A, kiểm tra response có đủ 5 notifications + pagination metadata.

### Tests cho User Story 1 ⚠️

- [ ] T005 [P] [US1] Unit test cho `notification.service.js` — `getNotifications` với page/limit hợp lệ → trả về danh sách + pagination trong `backend/tests/notification/notification.service.test.js`
- [ ] T006 [P] [US1] Unit test cho `notification.service.js` — `getNotifications` khi không có notification → mảng rỗng + totalPages = 0
- [ ] T007 [P] [US1] Unit test cho `notification.service.js` — `getNotifications` với page âm → throw ServiceError 400
- [ ] T008 [P] [US1] Integration test cho `GET /api/v1/notifications` — token user → HTTP 200 + danh sách trong `backend/tests/notification/notification.api.test.js`

### Implementation cho User Story 1

- [ ] T009 [US1] Implement `notification.service.js` — hàm `getNotifications(query, currentUser)` với user_id filter + pagination + sorting trong `backend/src/services/notification.service.js`
- [ ] T010 [US1] Implement `notification.controller.js` — handler `getNotificationsHandler` trong `backend/src/controllers/notification.controller.js`
- [ ] T011 [US1] Tạo `notification.routes.js` — route `GET /` với authMiddleware trong `backend/src/routes/notification.routes.js`
- [ ] T012 [US1] Cập nhật `backend/src/app.js` — mount `notificationRoutes` tại prefix `/api/v1/notifications`
- [ ] T013 [US1] Thêm Swagger JSDoc cho endpoint `GET /api/v1/notifications` trong `backend/src/routes/notification.routes.js`

**Checkpoint**: User Story 1 hoàn thành — User xem được danh sách notifications.

---

## Phase 3: User Story 2 - Xem số lượng thông báo chưa đọc (Priority: P1)

**Goal**: User gọi `GET /api/v1/notifications/unread-count` và nhận `{ unread_count: N }`. Frontend polling mỗi 30 giây.

**Independent Test**: Tạo 3 notifications chưa đọc cho user A, gọi `GET /api/v1/notifications/unread-count` với token user A, kiểm tra response `{ unread_count: 3 }`.

### Tests cho User Story 2 ⚠️

- [ ] T014 [P] [US2] Unit test cho `notification.service.js` — `getUnreadCount` → trả về `{ unread_count: N }` trong `backend/tests/notification/notification.service.test.js`
- [ ] T015 [P] [US2] Unit test cho `notification.service.js` — `getUnreadCount` khi không có unread → unread_count = 0
- [ ] T016 [P] [US2] Integration test cho `GET /api/v1/notifications/unread-count` — token user → HTTP 200 + { unread_count } trong `backend/tests/notification/notification.api.test.js`

### Implementation cho User Story 2

- [ ] T017 [US2] Implement `getUnreadCount` trong `notification.service.js` — count where user_id + is_read: false trong `backend/src/services/notification.service.js`
- [ ] T018 [US2] Implement `getUnreadCountHandler` trong `notification.controller.js` — gọi service + trả về 200 trong `backend/src/controllers/notification.controller.js`
- [ ] T019 [US2] Thêm route `GET /unread-count` trong `notification.routes.js` — **đặt TRƯỚC route `/:id`** để tránh Express conflict trong `backend/src/routes/notification.routes.js`
- [ ] T020 [US2] Thêm Swagger JSDoc cho endpoint `GET /api/v1/notifications/unread-count` trong `backend/src/routes/notification.routes.js`

**Checkpoint**: User Story 2 hoàn thành — User xem được unread count.

---

## Phase 4: Authorization & Edge Cases

**Goal**: Guest nhận 401. Validation page/limit.

### Tests ⚠️

- [ ] T021 [P] Integration test — `GET /api/v1/notifications` + Guest (no token) → HTTP 401 trong `backend/tests/notification/notification.api.test.js`
- [ ] T022 [P] Integration test — `GET /api/v1/notifications/unread-count` + Guest → HTTP 401
- [ ] T023 [P] Integration test — `GET /api/v1/notifications?page=-1` → HTTP 400
- [ ] T024 [P] Integration test — `GET /api/v1/notifications?limit=999` → HTTP 400
- [ ] T025 [P] Integration test — database không phản hồi → HTTP 500

### Implementation

- [ ] T026 Middleware authMiddleware đã implement ở T011 — xử lý 401 cho Guest

---

## Phase 5: Frontend

**Purpose**: Xây dựng giao diện Notification List

- [ ] T027 [P] Implement frontend API client trong `frontend/src/api/notificationApi.js` — hàm `getNotifications(params)` và `getUnreadCount()`
- [ ] T028 [P] Implement React hook `useNotifications` trong `frontend/src/hooks/useNotifications.js` — fetch list + polling unread count mỗi 30 giây
- [ ] T029 Implement `NotificationListPage.jsx` với MUI List + Badge + Pagination trong `frontend/src/components/pages/NotificationListPage.jsx`
- [ ] T030 Thêm route `/notifications` trong `frontend/src/App.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T004 — chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên Phase 1
- **User Story 2 (Phase 3)**: Depends trên T009 (service) — cùng code với US1
- **Authorization (Phase 4)**: Depends trên T011 (middleware)
- **Frontend (Phase 5)**: Depends trên API hoàn thành

### User Story Dependencies

- **US1 (P1)**: MVP — bắt đầu ngay sau Setup
- **US2 (P1)**: Cùng service với US1 — implement cùng nhau
- **Frontend**: Sau khi API hoàn thành

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T003, T004 | Repository + Validator — khác files |
| T005, T006 | Tests US1 — viết song song |
| T009, T010, T011 | Service + Controller + Routes — sequential |
| T014, T015 | Tests US2 — viết song song |
| T027, T028 | Frontend API + Hook — song song |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001-T004) → Prisma + repository + validator ready
2. **Phase 2+3**: US1+US2 (T005-T020) → **MVP!** User xem được notifications + unread count
3. **Phase 4**: Authorization (T021-T026)
4. **Phase 5**: Frontend (T027-T030)
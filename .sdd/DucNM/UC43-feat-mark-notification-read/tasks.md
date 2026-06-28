# Tasks: Mark Notification As Read (UC43)

**Input**: Design documents from `.sdd/DucNM/UC43-feat-mark-notification-read/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), context.md

---

## Phase 1: Setup & Foundation

- [ ] T001 [P] [SETUP] Thêm phương thức `updateRead()` và `updateAllRead()` trong `backend/src/repositories/notification.repository.js`
- [ ] T002 [P] [SETUP] Thêm phương thức `markAsRead()` và `markAllAsRead()` trong `backend/src/services/notification.service.js`
- [ ] T003 [P] [SETUP] Thêm phương thức `markRead()` và `markAllRead()` trong `backend/src/controllers/notification.controller.js`
- [ ] T004 [P] [SETUP] Thêm routes `PATCH /api/v1/notifications/:id/read` và `PATCH /api/v1/notifications/read-all` trong `backend/src/routes/notification.routes.js`

---

## Phase 2: User Story 1 — Đánh dấu một thông báo là đã đọc (Priority: P1) 🎯 MVP

**Goal**: User đánh dấu 1 notification là đã đọc. Idempotent.

**Independent Test**: Tạo notification is_read=false, gọi PATCH /read → is_read=true.

### Tests

- [ ] T005 [P] [US1] Contract test: `PATCH /api/v1/notifications/1/read` — thành công trong `backend/tests/notification.test.js`
- [ ] T006 [P] [US1] Contract test: `PATCH /api/v1/notifications/1/read` (đã đọc) — idempotent, vẫn 200
- [ ] T007 [P] [US1] Contract test: `PATCH /api/v1/notifications/1/read` với token user khác — HTTP 404

### Implementation

- [ ] T008 [US1] Implement `notification.repository.js` — updateRead(id, userId): set is_read=true, read_at=now
- [ ] T009 [US1] Implement `notification.service.js` — markAsRead(id, userId): kiểm tra ownership, idempotent
- [ ] T010 [US1] Implement `notification.controller.js` — markRead()
- [ ] T011 [US1] Thêm Swagger JSDoc cho `PATCH /api/v1/notifications/:id/read`

---

## Phase 3: User Story 2 — Đánh dấu tất cả thông báo là đã đọc (Priority: P2)

**Goal**: User đánh dấu tất cả notification chưa đọc là đã đọc.

**Independent Test**: Tạo 5 notifications chưa đọc, gọi PATCH /read-all → tất cả is_read=true.

### Tests

- [ ] T012 [P] [US2] Contract test: `PATCH /api/v1/notifications/read-all` — thành công, trả về số lượng đã update
- [ ] T013 [P] [US2] Contract test: `PATCH /api/v1/notifications/read-all` (không có unread) — vẫn 200

### Implementation

- [ ] T014 [US2] Implement `notification.repository.js` — updateAllRead(userId): update all is_read=false → true
- [ ] T015 [US2] Implement `notification.service.js` — markAllAsRead(userId)
- [ ] T016 [US2] Implement `notification.controller.js` — markAllRead()
- [ ] T017 [US2] Thêm Swagger JSDoc cho `PATCH /api/v1/notifications/read-all`

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: Depends on UC41 repository existing
- **Phase 2 (US1)**: Depends on Phase 1 — Single mark read (MVP)
- **Phase 3 (US2)**: Depends on Phase 2 — Bulk mark read

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
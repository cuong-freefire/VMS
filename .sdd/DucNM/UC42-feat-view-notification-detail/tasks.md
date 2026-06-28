# Tasks: View Notification Detail (UC42)

**Input**: Design documents from `.sdd/DucNM/UC42-feat-view-notification-detail/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), context.md

---

## Phase 1: Setup & Foundation

- [ ] T001 [P] [SETUP] Thêm phương thức `findById()` trong `backend/src/repositories/notification.repository.js`
- [ ] T002 [P] [SETUP] Thêm phương thức `getNotificationById()` trong `backend/src/services/notification.service.js`
- [ ] T003 [P] [SETUP] Thêm phương thức `getById()` trong `backend/src/controllers/notification.controller.js`
- [ ] T004 [P] [SETUP] Thêm route `GET /api/v1/notifications/:id` trong `backend/src/routes/notification.routes.js`
- [ ] T005 [P] [SETUP] Thêm hàm `getNotificationById()` trong `frontend/src/api/notificationApi.js`
- [ ] T006 [P] [SETUP] Tạo file `frontend/src/components/notifications/NotificationDetailPage.jsx`

---

## Phase 2: User Story 1 — Xem chi tiết thông báo (Priority: P1) 🎯 MVP

**Goal**: User click notification → xem nội dung đầy đủ + deep link đến entity.

**Independent Test**: Gọi `GET /api/v1/notifications/1` với token user sở hữu → response đầy đủ.

### Tests

- [ ] T007 [P] [US1] Contract test: `GET /api/v1/notifications/1` với token user sở hữu — response đầy đủ trong `backend/tests/notification.test.js`
- [ ] T008 [P] [US1] Contract test: `GET /api/v1/notifications/1` với token user khác — HTTP 404
- [ ] T009 [P] [US1] Contract test: `GET /api/v1/notifications/9999` — HTTP 404
- [ ] T010 [P] [US1] Contract test: `GET /api/v1/notifications/abc` — HTTP 400

### Implementation

- [ ] T011 [US1] Implement `notification.repository.js` — findById(id): trả về notification + include reference entity info
- [ ] T012 [US1] Implement `notification.service.js` — getNotificationById(): kiểm tra ownership, tự động mark is_read=true, kiểm tra reference entity deleted
- [ ] T013 [US1] Implement `notification.controller.js` — getById(): validate id, gọi service
- [ ] T014 [US1] Implement `NotificationDetailPage.jsx` — hiển thị nội dung + deep link (hoặc "[Đã xóa]" nếu entity deleted)
- [ ] T015 [US1] Thêm Swagger JSDoc cho `GET /api/v1/notifications/:id`

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: Depends on UC41 repository existing
- **Phase 2 (US1)**: Depends on Phase 1 — Notification detail (MVP)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
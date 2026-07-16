# Tasks: View Notification Detail (UC42)

**Input**: Design documents từ `.sdd/DucNM/UC42-feat-view-notification-detail/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/

**Tests**: Các test tasks bao gồm unit test cho Service layer và integration test cho API endpoints.

**Organization**: Tasks được group theo user story để implementation và testing độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác files, không dependencies)
- **[Story]**: User story task này thuộc về (US1)
- Bao gồm exact file paths trong descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Kế thừa infrastructure từ UC41 (Notification model, repository, service, controller, routes)
- **New**: findNotificationById, markAsRead, reference entity lookup

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Mở rộng repository để hỗ trợ notification detail

- [ ] T001 Thêm `findNotificationById` trong `backend/src/repositories/notification.repository.js` — Prisma `findUnique`
- [ ] T002 [P] Thêm `markAsRead` trong `backend/src/repositories/notification.repository.js` — Prisma `update` set is_read = true

---

## Phase 2: User Story 1 - Xem chi tiết thông báo (Priority: P1) 🎯 MVP

**Goal**: User gọi `GET /api/v1/notifications/:id` và xem được chi tiết notification + reference entity (nếu có). Tự động đánh dấu đã đọc.

**Independent Test**: Tạo notification cho user A, gọi `GET /api/v1/notifications/1` với token user A, kiểm tra response có đầy đủ thông tin + is_read = true.

### Tests cho User Story 1 ⚠️

- [ ] T003 [P] [US1] Unit test cho `notification.service.js` — `getNotificationById` với ID hợp lệ + chủ sở hữu → 200 + full detail trong `backend/tests/notification/notification.service.test.js`
- [ ] T004 [P] [US1] Unit test cho `notification.service.js` — `getNotificationById` với ID không tồn tại → throw ServiceError 404 `NOTIFICATION_NOT_FOUND`
- [ ] T005 [P] [US1] Unit test cho `notification.service.js` — `getNotificationById` với ID không hợp lệ → throw ServiceError 400 `INVALID_NOTIFICATION_ID`
- [ ] T006 [P] [US1] Unit test cho `notification.service.js` — `getNotificationById` với user khác → throw ServiceError 404 (ownership check)
- [ ] T007 [P] [US1] Unit test cho `notification.service.js` — `getNotificationById` → is_read tự động thành true
- [ ] T008 [P] [US1] Unit test cho `notification.service.js` — `getNotificationById` với reference entity → reference summary
- [ ] T009 [P] [US1] Unit test cho `notification.service.js` — `getNotificationById` với reference entity đã xóa mềm → deleted: true
- [ ] T010 [P] [US1] Integration test cho `GET /api/v1/notifications/:id` — token chủ sở hữu → HTTP 200 trong `backend/tests/notification/notification.api.test.js`

### Implementation cho User Story 1

- [ ] T011 [US1] Implement `getNotificationById` trong `backend/src/services/notification.service.js` — validate ID → findById → 404 check → ownership check → auto mark read → lookup reference → return
- [ ] T012 [US1] Implement `lookupReference` helper trong service — switch case theo reference_type (event, application, certificate), check is_active, return summary hoặc deleted: true
- [ ] T013 [US1] Implement `getNotificationByIdHandler` trong `backend/src/controllers/notification.controller.js` — gọi service + trả về 200
- [ ] T014 [US1] Thêm route `GET /:id` trong `backend/src/routes/notification.routes.js` — **đặt SAU route /unread-count** để tránh Express conflict
- [ ] T015 [US1] Thêm Swagger JSDoc cho endpoint `GET /api/v1/notifications/:id` trong `backend/src/routes/notification.routes.js`

**Checkpoint**: User Story 1 hoàn thành — User xem được chi tiết notification.

---

## Phase 3: Authorization & Edge Cases

**Goal**: Guest nhận 401. Validation ID.

### Tests ⚠️

- [ ] T016 [P] Integration test — `GET /api/v1/notifications/1` + token user khác → HTTP 404 trong `backend/tests/notification/notification.api.test.js`
- [ ] T017 [P] Integration test — `GET /api/v1/notifications/999` → HTTP 404
- [ ] T018 [P] Integration test — `GET /api/v1/notifications/abc` → HTTP 400
- [ ] T019 [P] Integration test — `GET /api/v1/notifications/1` + Guest (no token) → HTTP 401
- [ ] T020 [P] Integration test — database không phản hồi → HTTP 500

### Implementation

- [ ] T021 Middleware authMiddleware — xử lý 401 cho Guest (đã có từ UC41)
- [ ] T022 ID validation đã implement ở T011 — `Number(notificationId)` check + `isNaN` + `<= 0`

---

## Phase 4: Frontend

**Purpose**: Xây dựng giao diện Notification Detail

- [ ] T023 [P] Thêm `getNotificationById(id)` trong `frontend/src/api/notificationApi.js`
- [ ] T024 Implement `NotificationDetailPage.jsx` — hiển thị title, message, type, time, reference entity summary hoặc [Đã xóa] alert
- [ ] T025 Thêm route `/notifications/:id` trong `frontend/src/App.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T002 — chạy đầu tiên
- **User Story 1 (Phase 2)**: Depends trên Phase 1 + UC41 infrastructure
- **Authorization (Phase 3)**: Depends trên T011 (service logic) + T014 (route)
- **Frontend (Phase 4)**: Depends trên API hoàn thành

### User Story Dependencies

- **US1 (P1)**: MVP — bắt đầu ngay sau Setup
- **Frontend**: Sau khi API hoàn thành

### Parallel Opportunities

| Task IDs | Lý do |
|----------|-------|
| T001, T002 | Repository methods — khác functions |
| T003-T009 | Tests US1 — viết song song |
| T011, T012, T013 | Service + Controller — sequential |
| T016-T020 | Tests edge cases — chạy song song |

### Implementation Strategy: MVP First

1. **Phase 1**: Setup (T001-T002) → Repository methods ready
2. **Phase 2**: US1 (T003-T015) → **MVP!** User xem được chi tiết notification + auto mark read + reference lookup
3. **Phase 3**: Edge cases (T016-T022)
4. **Phase 4**: Frontend (T023-T025)
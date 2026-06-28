# Tasks: Create Notification (UC44)

**Input**: Design documents from `.sdd/DucNM/UC44-feat-create-notification/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), context.md

---

## Phase 1: Setup & Foundation

- [ ] T001 [P] [SETUP] Tạo file `backend/src/validators/notification.validator.js` — Zod schema cho create
- [ ] T002 [P] [SETUP] Thêm phương thức `createMany()` trong `backend/src/repositories/notification.repository.js`
- [ ] T003 [P] [SETUP] Thêm phương thức `createNotification()` trong `backend/src/services/notification.service.js`
- [ ] T004 [P] [SETUP] Thêm phương thức `create()` trong `backend/src/controllers/notification.controller.js`
- [ ] T005 [P] [SETUP] Thêm route `POST /api/v1/notifications` trong `backend/src/routes/notification.routes.js`

---

## Phase 2: User Story 1 — Staff gửi thông báo đến volunteer trong sự kiện (Priority: P1) 🎯 MVP

**Goal**: Staff gửi notification đến volunteer đã đăng ký event mình quản lý.

**Independent Test**: Tạo event + 3 applications approved, Staff gọi POST → 201, cả 3 user nhận notification.

### Tests

- [ ] T006 [P] [US1] Contract test: `POST /api/v1/notifications` với Staff — HTTP 201 trong `backend/tests/notification.test.js`
- [ ] T007 [P] [US1] Contract test: `POST /api/v1/notifications` với user_ids chứa invalid user — bỏ qua, trả về created + skipped

### Implementation

- [ ] T008 [US1] Implement `notification.validator.js` — createNotificationSchema: title (required, max 200), message (required, max 2000), user_ids (array 1-500), type (enum), reference_type, reference_id
- [ ] T009 [US1] Implement `notification.repository.js` — createMany(dataArray): bulk insert notifications
- [ ] T010 [US1] Implement `notification.service.js` — createNotification(): Staff kiểm tra từng user_id có trong event mình quản lý không, Admin tạo cho bất kỳ, audit log

---

## Phase 3: User Story 2 — Admin gửi thông báo toàn hệ thống (Priority: P1)

**Goal**: Admin gửi notification đến bất kỳ user nào.

**Independent Test**: Gọi POST với token Admin → tất cả user hợp lệ đều được tạo.

### Tests

- [ ] T011 [P] [US2] Contract test: `POST /api/v1/notifications` với Admin — HTTP 201, tất cả user hợp lệ
- [ ] T012 [P] [US2] Contract test: `POST /api/v1/notifications` — Guest 401, Volunteer 403

### Implementation

- [ ] T013 [US2] Cập nhật `notification.service.js` — phân quyền: Admin không cần kiểm tra scope, Staff cần kiểm tra event ownership
- [ ] T014 [US2] Implement `notification.controller.js` — create()

---

## Phase 4: User Story 3 — Hệ thống tự động sinh notification (Priority: P1)

**Goal**: Module khác gọi NotificationService để auto-generate notification.

**Independent Test**: Giả lập approve application → notification được tạo.

### Tests

- [ ] T015 [P] [US3] Integration test: approve application → kiểm tra notification tự động được tạo

### Implementation

- [ ] T016 [US3] Export `NotificationService.createNotification()` để module khác gọi (ApplicationService khi approve/reject, CertificateService khi issue)
- [ ] T017 [US3] Thêm Swagger JSDoc cho `POST /api/v1/notifications`

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: Depends on UC41 repository existing
- **Phase 2 (US1)**: Depends on Phase 1 — Staff create (MVP)
- **Phase 3 (US2)**: Depends on Phase 2 — Admin create
- **Phase 4 (US3)**: Depends on Phase 3 — Auto-generate integration

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
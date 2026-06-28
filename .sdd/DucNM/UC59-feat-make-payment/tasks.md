# Tasks: Make Payment (UC59)

---

## Phase 1: Setup & Foundation

- [ ] T001 [P] [SETUP] Cấu hình VNPay config trong `backend/src/config/vnpay.config.js`
- [ ] T002 [P] [SETUP] Cấu hình MoMo config trong `backend/src/config/momo.config.js`
- [ ] T003 [P] [SETUP] Thêm phương thức xử lý webhook trong `backend/src/services/payment.service.js`

---

## Phase 2: User Story 1 — Xử lý VNPay thành công qua webhook (Priority: P1) 🎯 MVP

**Independent Test**: Giả lập VNPay gửi IPN → donation chuyển Pending → Success.

### Tests

- [ ] T004 [P] [US1] Contract test: `POST /api/v1/payments/vnpay-ipn` với signature hợp lệ — cập nhật Success trong `backend/tests/donation.test.js`
- [ ] T005 [P] [US1] Contract test: `POST /api/v1/payments/vnpay-ipn` với signature sai — HTTP 400, không update
- [ ] T006 [P] [US1] Contract test: `POST /api/v1/payments/vnpay-ipn` cho giao dịch đã Success — idempotent

### Implementation

- [ ] T007 [US1] Implement `payment.service.js` — handleVNPayIPN(): validate signature, cập nhật donation status, ghi gateway_response
- [ ] T008 [US1] Implement `donation.controller.js` — vnpayIPN()
- [ ] T009 [US1] Implement route `POST /api/v1/payments/vnpay-ipn`
- [ ] T010 [US1] Thêm Swagger JSDoc cho `POST /api/v1/payments/vnpay-ipn`

---

## Phase 3: User Story 2 — Xử lý MoMo thất bại qua webhook (Priority: P1)

**Independent Test**: Giả lập MoMo gửi IPN thất bại → donation chuyển Failed.

### Tests

- [ ] T011 [P] [US2] Contract test: `POST /api/v1/payments/momo-ipn` báo thất bại — cập nhật Failed
- [ ] T012 [P] [US2] Contract test: `POST /api/v1/payments/momo-ipn` báo cancelled — cập nhật Cancelled

### Implementation

- [ ] T013 [US2] Implement `payment.service.js` — handleMoMoIPN(): validate signature, cập nhật status
- [ ] T014 [US2] Implement `donation.controller.js` — momoIPN()
- [ ] T015 [US2] Implement route `POST /api/v1/payments/momo-ipn`
- [ ] T016 [US2] Thêm Swagger JSDoc cho `POST /api/v1/payments/momo-ipn`

---

## Phase 4: User Story 3 — Xử lý redirect return URL (Priority: P2)

**Independent Test**: Gọi GET /payments/vnpay-return → response chỉ chứa thông tin hiển thị.

### Tests

- [ ] T017 [P] [US3] Contract test: `GET /api/v1/payments/vnpay-return` — KHÔNG cập nhật DB

### Implementation

- [ ] T018 [US3] Implement `donation.controller.js` — vnpayReturn(): chỉ parse params, trả về thông tin hiển thị
- [ ] T019 [US3] Implement route `GET /api/v1/payments/vnpay-return`
- [ ] T020 [US3] Tạo cron job: chuyển Pending > 30 phút → Cancelled
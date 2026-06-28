# Tasks: Donate To Event (UC58)

---

## Phase 1: Setup & Foundation

- [ ] T001 [P] [SETUP] Tạo Prisma schema cho bảng `donations` và `payment_transactions` trong `backend/prisma/schema.prisma`
- [ ] T002 [P] [SETUP] Tạo file `backend/src/validators/donation.validator.js` — createPaymentSchema
- [ ] T003 [P] [SETUP] Tạo file `backend/src/repositories/donation.repository.js` — create()
- [ ] T004 [P] [SETUP] Tạo file `backend/src/services/donation.service.js` — createDonation()
- [ ] T005 [P] [SETUP] Tạo file `backend/src/services/payment.service.js` — createVNPayUrl(), createMoMoUrl()
- [ ] T006 [P] [SETUP] Tạo file `backend/src/controllers/donation.controller.js` — createPayment()
- [ ] T007 [P] [SETUP] Tạo file `backend/src/routes/donation.routes.js`
- [ ] T008 [P] [SETUP] Tạo file `frontend/src/api/donationApi.js`
- [ ] T009 [P] [SETUP] Tạo file `frontend/src/components/donations/DonateForm.jsx`

---

## Phase 2: User Story 1 — Quyên góp thành công qua VNPay (Priority: P1) 🎯 MVP

**Independent Test**: Gọi POST /donations/create-payment → nhận payment_url.

### Tests

- [ ] T010 [P] [US1] Contract test: `POST /api/v1/donations/create-payment` với body hợp lệ — HTTP 201 + payment_url trong `backend/tests/donation.test.js`
- [ ] T011 [P] [US1] Contract test: `POST /api/v1/donations/create-payment` với amount=5000 — HTTP 400

### Implementation

- [ ] T012 [US1] Implement `donation.validator.js` — createPaymentSchema: amount (>= 10000), event_id, payment_gateway (vnpay|momo)
- [ ] T013 [US1] Implement `donation.repository.js` — create(data): tạo donation với status Pending
- [ ] T014 [US1] Implement `payment.service.js` — createVNPayUrl(donationId, amount), createMoMoUrl(donationId, amount)
- [ ] T015 [US1] Implement `donation.service.js` — createDonation(): validate amount, kiểm tra event tồn tại, tạo donation, gọi PaymentService tạo URL
- [ ] T016 [US1] Implement `donation.controller.js` — createPayment()
- [ ] T017 [US1] Implement `DonateForm.jsx` — form nhập số tiền, chọn gateway, redirect
- [ ] T018 [US1] Thêm Swagger JSDoc cho `POST /api/v1/donations/create-payment`
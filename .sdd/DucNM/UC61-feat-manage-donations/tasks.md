# Tasks: Manage Donations (UC61)

**Input**: Design documents from `.sdd/DucNM/UC61-feat-manage-donations/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), context.md

---

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup & Foundation

**Purpose**: Khởi tạo cấu trúc file cho feature

- [ ] T001 [P] [SETUP] Tạo file `backend/src/validators/donation.validator.js` — Zod schema cho query params (page, limit, status, start_date, end_date, payment_gateway)
- [ ] T002 [P] [SETUP] Tạo file `backend/src/repositories/donation.repository.js` — phương thức findAll(), findById(), getSummary()
- [ ] T003 [P] [SETUP] Tạo file `backend/src/services/donation.service.js` — phương thức getAllDonations(), getDonationById(), getDonationSummary()
- [ ] T004 [P] [SETUP] Tạo file `backend/src/controllers/donation.controller.js` — phương thức listAll(), getDetail(), getSummary()
- [ ] T005 [P] [SETUP] Tạo file `backend/src/routes/donation.routes.js` — routes GET /api/v1/donations, GET /api/v1/donations/:id, GET /api/v1/donations/summary
- [ ] T006 [P] [SETUP] Tạo file `frontend/src/api/donationApi.js` — hàm getAllDonations(), getDonationById(), getDonationSummary()
- [ ] T007 [P] [SETUP] Tạo file `frontend/src/services/donation.service.js`
- [ ] T008 [P] [SETUP] Tạo file `frontend/src/components/donations/DonationSummary.jsx`
- [ ] T009 [P] [SETUP] Tạo file `frontend/src/components/donations/DonationDetailPage.jsx`
- [ ] T010 [P] [SETUP] Tạo file `frontend/src/components/donations/DonationManagementPage.jsx`

---

## Phase 2: User Story 1 — Admin xem danh sách tất cả giao dịch (Priority: P1) 🎯 MVP

**Goal**: Admin có thể xem danh sách tất cả giao dịch quyên góp với filter và phân trang.

**Independent Test**: Tạo 5 donation từ các user khác nhau, gọi API với token Admin, kiểm tra danh sách trả về đủ.

### Tests

- [ ] T011 [P] [US1] Contract test: `GET /api/v1/donations` với token Admin — response chứa tất cả donation trong `backend/tests/donation.test.js`
- [ ] T012 [P] [US1] Contract test: `GET /api/v1/donations?status=success&start_date=2026-06-01&end_date=2026-06-30` — filter hoạt động
- [ ] T013 [P] [US1] Contract test: `GET /api/v1/donations?page=1&limit=20` — phân trang hoạt động
- [ ] T014 [P] [US1] Contract test: `GET /api/v1/donations` với token Manager — HTTP 403

### Implementation

- [ ] T015 [US1] Implement `donation.repository.js` — findAll() với filters (status, start_date, end_date, payment_gateway), count(), pagination, sắp xếp created_at DESC
- [ ] T016 [US1] Implement `donation.service.js` — getAllDonations(): validate Admin role, gọi repository, trả về danh sách kèm pagination meta
- [ ] T017 [US1] Implement `donation.controller.js` — listAll(): validate query params, gọi service, trả về response chuẩn
- [ ] T018 [US1] Implement `donation.routes.js` — `GET /api/v1/donations` với authenticate + authorize(['ADMIN']) middleware
- [ ] T019 [US1] Implement `donationApi.js` — getAllDonations(params) gọi API
- [ ] T020 [US1] Implement `DonationManagementPage.jsx` — bảng danh sách, filter (status, date range, payment gateway), pagination
- [ ] T021 [US1] Thêm Swagger JSDoc cho endpoint `GET /api/v1/donations`

---

## Phase 3: User Story 2 — Admin xem chi tiết giao dịch (Priority: P1)

**Goal**: Admin có thể xem chi tiết một giao dịch cụ thể bao gồm gateway_response.

**Independent Test**: Gọi `GET /api/v1/donations/1` với token Admin, kiểm tra response chứa gateway_response.

### Tests

- [ ] T022 [P] [US2] Contract test: `GET /api/v1/donations/1` với token Admin — response chứa đầy đủ thông tin kèm gateway_response
- [ ] T023 [P] [US2] Contract test: `GET /api/v1/donations/999` — HTTP 404

### Implementation

- [ ] T024 [US2] Implement `donation.repository.js` — findById() với include user, event, payment_transactions
- [ ] T025 [US2] Implement `donation.service.js` — getDonationById(): validate Admin role, gọi repository, trả về chi tiết
- [ ] T026 [US2] Implement `donation.controller.js` — getDetail(): validate params, gọi service, trả về response
- [ ] T027 [US2] Implement `donation.routes.js` — `GET /api/v1/donations/:id` với authenticate + authorize(['ADMIN'])
- [ ] T028 [US2] Implement `DonationDetailPage.jsx` — hiển thị tất cả thông tin giao dịch, gateway_response dạng formatted JSON
- [ ] T029 [US2] Thêm Swagger JSDoc cho endpoint `GET /api/v1/donations/:id`

---

## Phase 4: User Story 3 — Admin xem tổng quan donation (Priority: P2)

**Goal**: Admin có thể xem summary tổng quan về donation.

**Independent Test**: Gọi `GET /api/v1/donations/summary`, kiểm tra response chứa các chỉ số tổng quan.

### Tests

- [ ] T030 [P] [US3] Contract test: `GET /api/v1/donations/summary` với token Admin — response chứa total_donations, total_amount_success, success_rate
- [ ] T031 [P] [US3] Contract test: `GET /api/v1/donations/summary` không có dữ liệu — tất cả giá trị = 0

### Implementation

- [ ] T032 [US3] Implement `donation.repository.js` — getSummary(): aggregate total_donations, total_amount_success, total_transactions, success_rate
- [ ] T033 [US3] Implement `donation.service.js` — getDonationSummary(): validate Admin role, gọi repository, trả về summary
- [ ] T034 [US3] Implement `donation.controller.js` — getSummary(): gọi service, trả về response
- [ ] T035 [US3] Implement `donation.routes.js` — `GET /api/v1/donations/summary` với authenticate + authorize(['ADMIN'])
- [ ] T036 [US3] Implement `DonationSummary.jsx` — hiển thị KPI cards: tổng số, tổng tiền, tỷ lệ thành công
- [ ] T037 [US3] Thêm Swagger JSDoc cho endpoint `GET /api/v1/donations/summary`

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1)**: Depends on Phase 1 — Admin list all donations (MVP)
- **Phase 3 (US2)**: Depends on Phase 2 — Admin view donation detail
- **Phase 4 (US3)**: Depends on Phase 1 — Admin view donation summary

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Commit after each task or logical group
- TUYỆT ĐỐI KHÔNG tạo endpoint write cho donation (immutable rule)
- Summary data có thể cache 5 phút
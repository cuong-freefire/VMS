# Tasks: View Donation History (UC60)

**Input**: Design documents from `.sdd/DucNM/UC60-feat-view-donation-history/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), context.md

---

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup & Foundation

**Purpose**: Khởi tạo cấu trúc file cho feature

- [ ] T001 [P] [SETUP] Tạo file `backend/src/validators/donation.validator.js` — Zod schema cho query params (page, limit, status)
- [ ] T002 [P] [SETUP] Tạo file `backend/src/repositories/donation.repository.js` — phương thức findByUserId(), countByUserId()
- [ ] T003 [P] [SETUP] Tạo file `backend/src/services/donation.service.js` — phương thức getMyDonations()
- [ ] T004 [P] [SETUP] Tạo file `backend/src/controllers/donation.controller.js` — phương thức getMyDonations()
- [ ] T005 [P] [SETUP] Tạo file `backend/src/routes/donation.routes.js` — route GET /api/v1/donations/my-donations
- [ ] T006 [P] [SETUP] Tạo file `frontend/src/api/donationApi.js` — hàm getMyDonations()
- [ ] T007 [P] [SETUP] Tạo file `frontend/src/services/donation.service.js`
- [ ] T008 [P] [SETUP] Tạo file `frontend/src/components/donations/DonationCard.jsx`
- [ ] T009 [P] [SETUP] Tạo file `frontend/src/components/donations/DonationHistoryPage.jsx`

---

## Phase 2: User Story 1 — Xem lịch sử quyên góp cá nhân (Priority: P2) 🎯 MVP

**Goal**: Người dùng đã đăng nhập có thể xem danh sách giao dịch quyên góp của mình với phân trang và filter.

**Independent Test**: Tạo 3 donation cho user A, gọi API với token user A, kiểm tra response chứa 3 giao dịch.

### Tests

- [ ] T010 [P] [US1] Contract test: `GET /api/v1/donations/my-donations` với token user — response chứa danh sách donation của user đó trong `backend/tests/donation.test.js`
- [ ] T011 [P] [US1] Contract test: `GET /api/v1/donations/my-donations?status=success` — filter theo status hoạt động
- [ ] T012 [P] [US1] Contract test: `GET /api/v1/donations/my-donations?page=1&limit=20` — phân trang hoạt động
- [ ] T013 [P] [US1] Contract test: `GET /api/v1/donations/my-donations` không có token — HTTP 401

### Implementation

- [ ] T014 [US1] Implement `donation.repository.js` — findByUserId() với filters (status), countByUserId(), pagination, sắp xếp created_at DESC
- [ ] T015 [US1] Implement `donation.service.js` — getMyDonations(): validate user, gọi repository, trả về danh sách kèm pagination meta
- [ ] T016 [US1] Implement `donation.controller.js` — getMyDonations(): validate query params, gọi service, trả về response chuẩn
- [ ] T017 [US1] Implement `donation.routes.js` — `GET /api/v1/donations/my-donations` với authenticate middleware
- [ ] T018 [US1] Implement `donationApi.js` — getMyDonations(params) gọi API
- [ ] T019 [US1] Implement `DonationHistoryPage.jsx` — danh sách giao dịch, filter status, pagination
- [ ] T020 [US1] Implement `DonationCard.jsx` — card hiển thị tên sự kiện, số tiền, cổng thanh toán, trạng thái, ngày tạo
- [ ] T021 [US1] Thêm Swagger JSDoc cho endpoint `GET /api/v1/donations/my-donations`

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1)**: Depends on Phase 1 — View donation history (MVP)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Commit after each task or logical group
- Donation là immutable data — chỉ đọc, không ghi
- Khi event bị soft-delete, hiển thị tên sự kiện là "[Đã xóa]"
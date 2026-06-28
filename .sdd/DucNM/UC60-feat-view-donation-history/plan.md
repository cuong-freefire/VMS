# Implementation Plan: View Donation History (UC60)

**Branch**: `feat/uc60-view-donation-history` | **Date**: 2026-06-29 | **Spec**: `.sdd/DucNM/UC60-feat-view-donation-history/spec.md`

**Input**: Feature specification from `.sdd/DucNM/UC60-feat-view-donation-history/spec.md`

---

## Summary

Người dùng đã đăng nhập cần xem lịch sử các giao dịch quyên góp của mình, sắp xếp mới nhất lên đầu, hỗ trợ phân trang và filter theo trạng thái. Guest bị từ chối.

Kỹ thuật: Tạo REST API `GET /api/v1/donations/my-donations` trả về danh sách giao dịch của user hiện tại với phân trang và filter.

---

## Technical Context

**Language/Version**: NodeJS + Javascript (ESM), Express 5.x

**Primary Dependencies**: Prisma (MySQL), Zod, JWT (HttpOnly Cookie), Pino, swagger-jsdoc, swagger-ui-express

**Storage**: MySQL (via Prisma ORM)

**Testing**: Jest + Supertest (Backend), Jest + React Testing Library (Frontend)

**Target Platform**: Web (Browser)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Danh sách 100 donation tải trong vòng 1 giây

**Constraints**:
- User chỉ xem được donation của chính mình
- Hỗ trợ phân trang (page, limit, mặc định limit = 20)
- Hỗ trợ filter theo status (success, failed, pending, cancelled)
- Sắp xếp theo created_at DESC (mới nhất trên cùng)
- Guest → 401
- Swagger JSDoc bắt buộc

**Scale/Scope**: ~1000 donations/user, phân trang 20 items/trang

---

## Constitution Check

1. ✅ **Immutability Compliance**: Donation là immutable transaction data — chỉ đọc, không ghi.
2. ✅ **Layered Architecture**: Controller → Service → Repository.
3. ✅ **API Format**: Tuân thủ `/api/v1/[resource]` prefix và response format ADR-006.
4. ✅ **Swagger Documentation**: Bắt buộc JSDoc @swagger.
5. ✅ **Phân quyền Role**: Authenticated user only — chỉ xem donation của mình.

---

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC60-feat-view-donation-history/
├── context.md
├── spec.md
├── plan.md              # This file
└── tasks.md             # Task list
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/
│   │   └── donation.controller.js          # getMyDonations() method
│   ├── services/
│   │   └── donation.service.js             # getMyDonations()
│   ├── repositories/
│   │   └── donation.repository.js          # findByUserId(), countByUserId()
│   ├── validators/
│   │   └── donation.validator.js           # myDonationsQuerySchema
│   └── routes/
│       └── donation.routes.js              # GET /api/v1/donations/my-donations

frontend/
├── src/
│   ├── api/
│   │   └── donationApi.js                  # getMyDonations()
│   ├── components/donations/
│   │   ├── DonationHistoryPage.jsx
│   │   └── DonationCard.jsx
│   └── services/
│       └── donation.service.js
```

**Structure Decision**: Web application. Backend layered (Controller → Service → Repository). Frontend feature-based components.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
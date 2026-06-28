# Implementation Plan: Manage Donations (UC61)

**Branch**: `feat/uc61-manage-donations` | **Date**: 2026-06-29 | **Spec**: `.sdd/DucNM/UC61-feat-manage-donations/spec.md`

**Input**: Feature specification from `.sdd/DucNM/UC61-feat-manage-donations/spec.md`

---

## Summary

Admin cần quản lý tất cả giao dịch quyên góp — xem danh sách tất cả giao dịch, xem chi tiết giao dịch (bao gồm gateway_response), và xem summary tổng quan. Chỉ Admin mới có quyền. Giao dịch Success là immutable — không có endpoint write.

Kỹ thuật: Tạo 3 REST API endpoints cho Admin: `GET /api/v1/donations` (danh sách), `GET /api/v1/donations/:id` (chi tiết), `GET /api/v1/donations/summary` (tổng quan).

---

## Technical Context

**Language/Version**: NodeJS + Javascript (ESM), Express 5.x

**Primary Dependencies**: Prisma (MySQL), Zod, JWT (HttpOnly Cookie), Pino, swagger-jsdoc, swagger-ui-express

**Storage**: MySQL (via Prisma ORM)

**Testing**: Jest + Supertest (Backend), Jest + React Testing Library (Frontend)

**Target Platform**: Web (Browser)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Danh sách 1000 donation tải trong vòng 2 giây, summary trong vòng 1 giây

**Constraints**:
- Admin-only: Chỉ Admin. Non-Admin → 403
- Immutable: Không có endpoint write (PUT/PATCH/DELETE)
- Hỗ trợ phân trang (page, limit, mặc định limit = 20)
- Hỗ trợ filter: status, start_date, end_date, payment_gateway
- Chi tiết giao dịch bao gồm gateway_response cho mục đích đối soát
- Summary data có thể cache 5 phút
- Swagger JSDoc bắt buộc

**Scale/Scope**: ~5000 donations toàn hệ thống, phân trang 20 items/trang

---

## Constitution Check

1. ✅ **Immutability Compliance**: Giao dịch Success là dữ liệu bất biến — không có endpoint write.
2. ✅ **Layered Architecture**: Controller → Service → Repository.
3. ✅ **API Format**: Tuân thủ `/api/v1/[resource]` prefix và response format ADR-006.
4. ✅ **Swagger Documentation**: Bắt buộc JSDoc @swagger.
5. ✅ **Phân quyền Role**: Admin-only.

---

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC61-feat-manage-donations/
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
│   │   └── donation.controller.js          # listAll(), getDetail(), getSummary()
│   ├── services/
│   │   └── donation.service.js             # getAllDonations(), getDonationById(), getDonationSummary()
│   ├── repositories/
│   │   └── donation.repository.js          # findAll(), findById(), getSummary()
│   ├── validators/
│   │   └── donation.validator.js           # listAllQuerySchema, summaryQuerySchema
│   └── routes/
│       └── donation.routes.js              # GET /api/v1/donations, GET /api/v1/donations/:id, GET /api/v1/donations/summary

frontend/
├── src/
│   ├── api/
│   │   └── donationApi.js                  # getAllDonations(), getDonationById(), getDonationSummary()
│   ├── components/donations/
│   │   ├── DonationManagementPage.jsx
│   │   ├── DonationDetailPage.jsx
│   │   └── DonationSummary.jsx
│   └── services/
│       └── donation.service.js
```

**Structure Decision**: Web application. Backend layered (Controller → Service → Repository). Frontend feature-based components.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
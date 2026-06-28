# Implementation Plan: Make Payment (UC59)

**Branch**: `feat/uc59-make-payment` | **Date**: 2026-06-29 | **Spec**: `.sdd/DucNM/UC59-feat-make-payment/spec.md`

**Input**: Feature specification from `.sdd/DucNM/UC59-feat-make-payment/spec.md`

---

## Summary

Xử lý luồng thanh toán qua VNPay và MoMo — từ redirect đến xử lý webhook callback. Webhook là nguồn sự thật duy nhất. Không tin vào redirect URL từ phía client.

Kỹ thuật: Tạo endpoints `POST /api/v1/payments/vnpay-ipn`, `POST /api/v1/payments/momo-ipn`, `GET /api/v1/payments/vnpay-return`. Validate signature từ webhook trước khi cập nhật trạng thái giao dịch.

---

## Technical Context

**Language/Version**: NodeJS + Javascript (ESM), Express 5.x

**Primary Dependencies**: Prisma (MySQL), Zod, VNPay SDK, MoMo SDK, Pino, swagger-jsdoc, swagger-ui-express

**Storage**: MySQL (via Prisma ORM)

**Testing**: Jest + Supertest (Backend), Jest + React Testing Library (Frontend)

**Target Platform**: Web (Browser)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Webhook xử lý trong vòng 5 giây, redirect page load trong vòng 2 giây

**Constraints**:
- Webhook-first: Chỉ webhook mới được cập nhật trạng thái giao dịch
- Signature validation bắt buộc — không tin vào redirect URL từ client
- Idempotent: Webhook trùng cho giao dịch đã Success → bỏ qua
- Giao dịch Success là immutable
- Swagger JSDoc bắt buộc

**Scale/Scope**: ~1000 giao dịch/tháng

---

## Constitution Check

1. ✅ **Immutability Compliance**: Giao dịch Success là dữ liệu bất biến — không tự ý sửa đổi.
2. ✅ **Rollback Compliance**: Giao dịch lỗi/timeout chuyển sang Failed/Cancelled — không kẹt Pending.
3. ✅ **Layered Architecture**: Controller → Service → Repository.
4. ✅ **API Format**: Tuân thủ `/api/v1/[resource]` prefix và response format ADR-006.
5. ✅ **Swagger Documentation**: Bắt buộc JSDoc @swagger.
6. ✅ **Webhook Security**: Signature validation bắt buộc — tuân thủ Donation & Payment rules.

---

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC59-feat-make-payment/
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
│   │   └── donation.controller.js          # vnpayIPN(), momoIPN(), vnpayReturn()
│   ├── services/
│   │   └── payment.service.js              # handleVNPayIPN(), handleMoMoIPN(), verifySignature()
│   ├── repositories/
│   │   └── donation.repository.js          # updateStatus(), findByTransactionRef()
│   ├── validators/
│   │   └── donation.validator.js           # vnpayIPNSchema, momoIPNSchema
│   └── routes/
│       └── donation.routes.js              # POST /api/v1/payments/vnpay-ipn, POST /api/v1/payments/momo-ipn, GET /api/v1/payments/vnpay-return

frontend/
├── src/
│   ├── api/
│   │   └── donationApi.js                  # checkPaymentStatus()
│   ├── components/donations/
│   │   └── PaymentResultPage.jsx
│   └── services/
│       └── donation.service.js
```

**Structure Decision**: Web application. Backend layered (Controller → Service → Repository). Frontend feature-based components.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

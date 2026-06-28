# Implementation Plan: Donate To Event (UC58)

**Branch**: `feat/uc58-donate-to-event` | **Date**: 2026-06-29 | **Spec**: `.sdd/DucNM/UC58-feat-donate-to-event/spec.md`

**Input**: Feature specification from `.sdd/DucNM/UC58-feat-donate-to-event/spec.md`

---

## Summary

Người dùng đã đăng nhập quyên góp tiền cho sự kiện qua VNPay hoặc MoMo. Số tiền tối thiểu 10,000 VND. Hệ thống tạo giao dịch Pending, trả về payment URL, và xử lý webhook callback từ cổng thanh toán.

Kỹ thuật: Tạo REST API `POST /api/v1/donations/create-payment` tạo giao dịch Pending + payment_url. Xử lý webhook callback từ VNPay/MoMo để cập nhật trạng thái giao dịch.

---

## Technical Context

**Language/Version**: NodeJS + Javascript (ESM), Express 5.x

**Primary Dependencies**: Prisma (MySQL), Zod, VNPay SDK, MoMo SDK, Pino, swagger-jsdoc, swagger-ui-express

**Storage**: MySQL (via Prisma ORM)

**Testing**: Jest + Supertest (Backend), Jest + React Testing Library (Frontend)

**Target Platform**: Web (Browser)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: User hoàn thành quyên góp trong vòng 3 phút, webhook xử lý trong 10 giây

**Constraints**:
- User đã đăng nhập. Guest → 401
- Amount >= 10,000 VND. Chỉ VND
- Payment gateway: VNPay, MoMo
- Webhook signature MUST be validated
- Giao dịch Success là immutable
- Timeout: Pending > 30 phút → CANCELLED (cron job)
- Swagger JSDoc bắt buộc

**Scale/Scope**: ~1000 giao dịch/tháng

---

## Constitution Check

1. ✅ **Immutability Compliance**: Giao dịch Success là dữ liệu bất biến — không tự ý sửa đổi.
2. ✅ **Rollback Compliance**: Giao dịch lỗi/timeout chuyển sang Failed/Cancelled — không kẹt Pending.
3. ✅ **Layered Architecture**: Controller → Service → Repository.
4. ✅ **API Format**: Tuân thủ `/api/v1/[resource]` prefix và response format ADR-006.
5. ✅ **Swagger Documentation**: Bắt buộc JSDoc @swagger.
6. ✅ **Phân quyền Role**: Authenticated user only.

---

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC58-feat-donate-to-event/
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
│   │   └── donation.controller.js          # createPayment(), handleWebhook()
│   ├── services/
│   │   ├── donation.service.js             # createDonation()
│   │   └── payment.service.js              # createVNPayUrl(), createMoMoUrl(), verifyWebhook()
│   ├── repositories/
│   │   └── donation.repository.js          # create(), updateStatus()
│   ├── validators/
│   │   └── donation.validator.js           # createPaymentSchema, webhookSchema
│   └── routes/
│       └── donation.routes.js              # POST /api/v1/donations/create-payment, POST /api/v1/payments/callback

frontend/
├── src/
│   ├── api/
│   │   └── donationApi.js                  # createPayment()
│   ├── components/donations/
│   │   └── DonateForm.jsx
│   └── services/
│       └── donation.service.js
```

**Structure Decision**: Web application. Backend layered (Controller → Service → Repository). Frontend feature-based components.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

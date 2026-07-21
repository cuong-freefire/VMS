# Research Findings: Add Event (UC15)

**Date**: 2026-06-29 | **Updated**: 2026-07-18 | **Feature**: UC15 - Staff Add Event

**Consistency Check**: Aligned with Prisma schema v3.0

## Research Questions & Findings

### Q1: Làm sao validate Start Date > Current Date một cách an toàn?

**Finding**: Sử dụng Zod `.refine()` với Date comparison. Backend PHẢI validate lại vì client time không đáng tin cậy.

**Decision**: Validate cả Frontend (UX) và Backend (Security). Backend dùng `new Date()` server time.

---

### Q2: Làm sao đảm bảo Staff chỉ tạo event cho chính mình?

**Finding**: Extract `user_id` từ JWT token (`req.user.user_id`), TUYỆT ĐỐI KHÔNG tin request body. Không có Organization model — ownership qua `createdBy`.

**Decision**: Middleware `authMiddleware` inject `req.user`, Service lấy `createdBy` từ `req.user.user_id`.

---

### Q3: Image upload workflow - sync hay async?

**Finding**: Cloudinary upload đồng bộ (blocking) nhưng nhanh (~1-2s).

**Decision**: Frontend upload trước → get Cloudinary URL → submit form với URL.

---

### Q4: Làm sao handle duplicate submission?

**Finding**: Frontend disable button sau first click. Backend dùng unique constraint.

**Decision**: Frontend disable button + loading state. Backend có unique constraint để catch duplicates.

---

### Q5: Status field - giá trị mặc định?

**Finding**: Prisma schema định nghĩa `EventStatus` enum với 7 giá trị: DRAFT, PENDING_APPROVAL, PUBLISHED, REJECTED, IN_PROGRESS, COMPLETED, CANCELLED.

**Decision**: Default "DRAFT". Staff không thể publish trực tiếp — cần qua approval workflow.

---

## Technical Stack Summary

### Backend Dependencies
```json
{
  "express": "^5.x",
  "prisma": "latest",
  "@prisma/client": "latest",
  "zod": "^3.x",
  "jsonwebtoken": "^9.x",
  "bcryptjs": "^2.x",
  "cloudinary": "^1.x",
  "pino": "^8.x",
  "pino-http": "^8.x",
  "swagger-jsdoc": "^6.x",
  "swagger-ui-express": "^5.x"
}
```

### Architecture Pattern

**Layered Architecture** (tuân thủ ADR-001 và AGENTS.md Section 6):
```text
Frontend Request
  ↓
Express Route (event.routes.js)
  ↓
Auth Middleware (validate JWT, inject req.user)
  ↓
Validation Middleware (Zod schema)
  ↓
Event Controller (HTTP layer, parse request/response)
  ↓
Event Service (Business logic)
  ↓
Event Repository (Prisma queries, data access)
  ↓
MySQL Database
```

---

**Version**: 2.0
**Last Updated**: 2026-07-18
**Status**: REVIEWED
# Research Findings: Add Event (UC15)

**Date**: 2026-06-29 | **Feature**: UC15 - Staff Add Event

## Research Questions & Findings

### Q1: Làm sao validate Start Date > Current Date một cách an toàn?

**Finding**: Sử dụng Zod `.refine()` với Date comparison. Backend PHẢI validate lại vì client time không đáng tin cậy.

**Source**: Zod documentation - Custom validation methods

**Decision**: Validate cả Frontend (UX) và Backend (Security). Backend dùng `new Date()` server time.

**Rationale**: 
- Client-side validation cung cấp immediate UX feedback
- Server-side validation là security gate cuối cùng
- Client time có thể bị manipulate (timezone, system clock)

**Alternatives Considered**:
- ❌ Chỉ validate Frontend: Không an toàn, dễ bypass
- ❌ Chỉ validate Backend: UX kém, user phải submit mới biết lỗi
- ✅ Dual validation: Tốt nhất cho cả UX và security

---

### Q2: Làm sao đảm bảo Staff chỉ tạo event cho organization của mình?

**Finding**: Extract `organization_id` từ JWT token (`req.user.organization_id`), TUYỆT ĐỐI KHÔNG tin request body.

**Source**: ADR-002 (JWT HttpOnly Cookies), Lesson 3 trong CLAUDE.md

**Decision**: Middleware `authMiddleware.authenticate` inject `req.user`, Service lấy `organization_id` từ đó.

**Rationale**:
- JWT token đã được verify bởi middleware, đáng tin cậy
- Request body có thể bị manipulate bởi malicious user
- Tuân thủ principle: NEVER trust client-provided identity

**Alternatives Considered**:
- ❌ Lấy từ request body: Security hole, user impersonation risk
- ❌ Query database mỗi request: Performance overhead không cần thiết
- ✅ Extract từ JWT: Secure, fast, zero additional DB queries

---

### Q3: Image upload workflow - sync hay async?

**Finding**: Cloudinary upload đồng bộ (blocking) nhưng nhanh (~1-2s). Nếu timeout > 5s, cần retry hoặc queue.

**Source**: Cloudinary Node.js SDK documentation

**Decision**: Sync upload trong transaction. Frontend disable submit button khi đang upload.

**Rationale**:
- Cloudinary upload thường < 2s, chấp nhận được cho UX
- Sync flow đơn giản hơn async (không cần webhook/polling)
- Frontend disable button prevent duplicate submissions

**Alternatives Considered**:
- ❌ Async với webhook: Over-engineering cho MVP
- ❌ Queue-based upload: Thêm complexity (Redis/RabbitMQ)
- ✅ Sync upload: Simple, sufficient cho use case hiện tại

---

### Q4: Làm sao handle duplicate submission (user nhấn Submit nhiều lần)?

**Finding**: Frontend disable button sau first click. Backend dùng idempotency key hoặc unique constraint.

**Source**: SC-007 trong SPEC.md

**Decision**: Frontend disable button + loading state. Backend có unique constraint `(title, organization_id, start_date)` để catch duplicates.

**Rationale**:
- Frontend disable button: First line of defense (UX)
- Backend unique constraint: Safety net (data integrity)
- Database-level enforcement không thể bypass

**Alternatives Considered**:
- ❌ Chỉ frontend disable: Không đủ, có thể bypass bằng network replay
- ❌ Redis-based idempotency: Over-engineering, thêm dependency
- ✅ Unique constraint: Native database feature, zero overhead

---

### Q5: Status field - nên lưu "Draft" hay "Published"?

**Finding**: Database schema (DATABASE.md) có `status` ENUM('Draft', 'Published', 'In Progress', 'Completed', 'Cancelled').

**Source**: DATABASE.md - events table schema

**Decision**: Default "Draft". Staff có thể publish ngay trong form với checkbox "Publish immediately".

**Rationale**:
- Draft default: Safe, cho phép Staff review trước khi public
- Publish option: Flexibility cho urgent events
- Schema đã support full lifecycle states

**Alternatives Considered**:
- ❌ Auto-publish: Không có cơ hội review
- ❌ Separate "Publish" flow: Thêm UI step, phức tạp hơn
- ✅ Optional immediate publish: Balance giữa safety và flexibility

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

### Frontend Dependencies
```json
{
  "react": "^19.x",
  "@mui/material": "^5.x",
  "@emotion/react": "^11.x",
  "@emotion/styled": "^11.x",
  "react-hook-form": "^7.x",
  "axios": "^1.x",
  "bootstrap": "^5.x"
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
Event Service (Business logic, transaction handling)
  ↓
Event Repository (Prisma queries, data access)
  ↓
MySQL Database
```

**Cross-cutting Concerns**:
- **Logging**: Pino logger ở Controller và Service layers
- **Error Handling**: Centralized error middleware
- **Audit Trail**: AuditLog service gọi async sau transaction commit

---

## Best Practices Applied

1. **Security-First**: Identity từ JWT, không trust client input
2. **Defense in Depth**: Validation ở cả Frontend và Backend
3. **Data Integrity**: Database constraints enforce business rules
4. **Simple Design**: Prefer native features over external dependencies
5. **Performance**: Minimize DB queries, use Prisma transactions

---

**Version**: 1.0  
**Last Updated**: 2026-06-29  
**Status**: COMPLETE - All NEEDS CLARIFICATION resolved

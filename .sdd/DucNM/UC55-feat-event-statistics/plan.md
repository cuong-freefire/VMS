# Implementation Plan: Event Statistics (UC55)

**Branch**: `feat/uc55-event-statistics` | **Date**: 2026-06-29 | **Spec**: `.sdd/DucNM/UC55-feat-event-statistics/spec.md`

**Input**: Feature specification from `.sdd/DucNM/UC55-feat-event-statistics/spec.md`

---

## Summary

Admin và Manager cần xem thống kê chi tiết về sự kiện — số lượng theo thời gian, tỷ lệ hoàn thành, top 5 sự kiện phổ biến.

Kỹ thuật: Tạo REST API `GET /api/v1/dashboard/event-stats` aggregate từ bảng Event và Application, cache Redis TTL 5 phút.

---

## Technical Context

**Language/Version**: NodeJS + Javascript (ESM), Express 5.x

**Primary Dependencies**: Prisma (MySQL), Redis, Pino, swagger-jsdoc, swagger-ui-express

**Storage**: MySQL (via Prisma ORM), Redis (cache)

**Testing**: Jest + Supertest (Backend), Jest + React Testing Library (Frontend)

**Target Platform**: Web (Browser)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 3 giây (bao gồm cache miss)

**Constraints**:
- Admin/Manager only. Staff → 403, Guest → 401
- Manager chỉ thấy event thuộc organization mình
- Cache TTL 5 phút
- Hỗ trợ year (mặc định năm hiện tại) và start_date/end_date
- API format: `GET /api/v1/dashboard/event-stats`
- Swagger JSDoc bắt buộc

**Scale/Scope**: ~500 events/năm

---

## Constitution Check

1. ✅ **Layered Architecture**: Controller → Service → Repository.
2. ✅ **API Format**: Tuân thủ `/api/v1/[resource]` prefix và response format ADR-006.
3. ✅ **Swagger Documentation**: Bắt buộc JSDoc @swagger.
4. ✅ **Phân quyền Role**: Admin/Manager only.

---

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC55-feat-event-statistics/
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
│   │   └── dashboard.controller.js          # eventStats()
│   ├── services/
│   │   └── dashboard.service.js             # getEventStats()
│   ├── repositories/
│   │   └── dashboard.repository.js          # eventStats queries
│   ├── routes/
│   │   └── dashboard.routes.js              # GET /api/v1/dashboard/event-stats
│   └── utils/
│       └── cache.util.js                    # Redis cache wrapper

frontend/
├── src/
│   ├── api/
│   │   └── dashboardApi.js                  # getEventStats()
│   ├── components/dashboard/
│   │   └── EventStatsPage.jsx
│   └── services/
│       └── dashboard.service.js
```

**Structure Decision**: Web application. Backend layered. Frontend feature-based.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

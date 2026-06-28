# Implementation Plan: View Dashboard (UC54)

**Branch**: `feat/uc54-view-dashboard` | **Date**: 2026-06-29 | **Spec**: `.sdd/DucNM/UC54-feat-view-dashboard/spec.md`

**Input**: Feature specification from `.sdd/DucNM/UC54-feat-view-dashboard/spec.md`

---

## Summary

Admin và Manager cần dashboard tổng quan với KPI cards (5 chỉ số) và biểu đồ (3 charts) để theo dõi tình trạng hệ thống. Hỗ trợ cache 5 phút và force refresh.

Kỹ thuật: Tạo REST API `GET /api/v1/dashboard/summary` aggregate từ nhiều bảng, cache Redis TTL 5 phút.

---

## Technical Context

**Language/Version**: NodeJS + Javascript (ESM), Express 5.x

**Primary Dependencies**: Prisma (MySQL), Redis, Pino, swagger-jsdoc, swagger-ui-express

**Storage**: MySQL (via Prisma ORM), Redis (cache)

**Testing**: Jest + Supertest (Backend), Jest + React Testing Library (Frontend)

**Target Platform**: Web (Browser)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Cache hit < 2s, cache miss < 5s

**Constraints**:
- Admin/Manager only. Staff → 403, Guest → 401
- Manager chỉ thấy data organization của mình
- Cache TTL 5 phút, force refresh với query param force=true
- API format: `GET /api/v1/dashboard/summary`
- Swagger JSDoc bắt buộc

**Scale/Scope**: Dashboard tổng quan toàn hệ thống

---

## Constitution Check

1. ✅ **Layered Architecture**: Controller → Service → Repository.
2. ✅ **API Format**: Tuân thủ `/api/v1/[resource]` prefix và response format ADR-006.
3. ✅ **Swagger Documentation**: Bắt buộc JSDoc @swagger.
4. ✅ **Phân quyền Role**: Admin/Manager only.

---

## Project Structure

```text
backend/
├── src/
│   ├── controllers/dashboard.controller.js      # summary()
│   ├── services/dashboard.service.js            # getSummary()
│   ├── repositories/dashboard.repository.js     # aggregate queries
│   ├── routes/dashboard.routes.js               # GET /api/v1/dashboard/summary
│   └── utils/cache.util.js                      # Redis cache wrapper

frontend/
├── src/
│   ├── api/dashboardApi.js
│   ├── components/dashboard/
│   │   ├── DashboardPage.jsx
│   │   ├── KpiCard.jsx
│   │   └── ChartWidget.jsx
│   ├── services/dashboard.service.js
│   └── hooks/useDashboardCache.js
```

**Structure Decision**: Web application. Backend layered.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
# Implementation Plan: Volunteer Statistics (UC56)

**Branch**: `feat/uc56-volunteer-statistics` | **Date**: 2026-06-29 | **Spec**: `.sdd/DucNM/UC56-feat-volunteer-statistics/spec.md`

**Input**: Feature specification from `.sdd/DucNM/UC56-feat-volunteer-statistics/spec.md`

---

## Summary

Admin và Manager cần thống kê về tình nguyện viên — số lượng mới theo tháng, tổng active, tỷ lệ tham gia, top 5 volunteer tích cực.

Kỹ thuật: Tạo REST API `GET /api/v1/dashboard/volunteer-stats` aggregate từ User, Application, Attendance.

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
- Manager chỉ thấy volunteer trong organization mình
- Cache TTL 5 phút
- Hỗ trợ year (mặc định năm hiện tại)
- API format: `GET /api/v1/dashboard/volunteer-stats`
- Swagger JSDoc bắt buộc

**Scale/Scope**: ~1000 volunteers

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
.sdd/DucNM/UC56-feat-volunteer-statistics/
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
│   │   └── dashboard.controller.js          # volunteerStats()
│   ├── services/
│   │   └── dashboard.service.js             # getVolunteerStats()
│   ├── repositories/
│   │   └── dashboard.repository.js          # volunteerStats queries
│   ├── routes/
│   │   └── dashboard.routes.js              # GET /api/v1/dashboard/volunteer-stats
│   └── utils/
│       └── cache.util.js                    # Redis cache wrapper

frontend/
├── src/
│   ├── api/
│   │   └── dashboardApi.js                  # getVolunteerStats()
│   ├── components/dashboard/
│   │   └── VolunteerStatsPage.jsx
│   └── services/
│       └── dashboard.service.js
```

**Structure Decision**: Web application. Backend layered. Frontend feature-based.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

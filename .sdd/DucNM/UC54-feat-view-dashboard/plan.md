# Triển khai kế hoạch: View Dashboard (UC54)

**Branch**: `001-uc54-view-dashboard` | **Date**: 2026-07-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC54-feat-view-dashboard/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Admin và Manager cần dashboard tổng quan với KPI cards và biểu đồ để theo dõi tình trạng hệ thống. Backend xây dựng endpoint `GET /api/v1/dashboard/summary` trả về aggregate metrics từ nhiều bảng (Event, User, Application, Donation, Attendance). Cả Admin và Manager đều thấy dữ liệu toàn hệ thống (Manager là role hệ thống, không gắn với tổ chức cụ thể). Response được cache bằng Redis với TTL 5 phút, hỗ trợ force refresh qua query param `force=true`. Staff/Volunteer bị 403, Guest bị 401.

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express, Redis (cache)
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include), Recharts/Chart.js (cho biểu đồ)

**Storage**: MySQL via Prisma ORM + Redis cache

**Testing**: 
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Cache hit < 2 giây, cache miss < 5 giây. Cache TTL 5 phút.

**Constraints**: 
- Chỉ Admin và Manager mới có quyền truy cập (Staff/Volunteer → HTTP 403, Guest → HTTP 401)
- Cả Admin và Manager đều thấy dữ liệu toàn hệ thống (Manager là role hệ thống, không gắn với tổ chức)
- Response bao gồm: KPI metrics + chart data
- Cache Redis TTL 5 phút — query param `force=true` bỏ qua cache
- Cache miss (lần đầu hoặc force): query aggregate từ database → cache → response
- Redis không khả dụng: query từ database, ghi log warning, không throw error
- Swagger JSDoc bắt buộc
- Max function length: 40 dòng; max file length: 300 dòng
- Bắt buộc dùng `response.util.js`

**Scale/Scope**: Module mới — Dashboard & Reporting (UC54-UC57). Thuộc Member 5 — DucNM. Tạo mới controller, service, repository, routes cho Dashboard. Sử dụng Prisma aggregate queries + Redis cache.

## Constitution Check

Các nguyên tắc từ AGENTS.md và CLAUDE.md:

1. **Layered Architecture**: Controller → Service → Repository (bắt buộc)
2. **Test-First**: Tối thiểu 80% coverage cho Service layer
3. **API Response Format**: Buộc dùng `response.util.js`
4. **Swagger Documentation**: Bắt buộc JSDoc cho mọi endpoint
5. **Cross-module**: Không import Repository từ module khác

**Kết luận**: Không có vi phạm. Gates pass.

## Project Structure

### Documentation (this feature)

```text
.sdd/DucNM/UC54-feat-view-dashboard/
├── context.md              # Problem context
├── spec.md                 # Feature specification
├── plan.md                 # This file (/speckit-plan command output)
├── research.md             # Phase 0 output
├── data-model.md           # Phase 1 output
├── quickstart.md           # Phase 1 output
├── contracts/              # Phase 1 output
└── tasks.md                # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/
│   │   └── dashboard.controller.js  # MỚI: handler getDashboardSummary
│   ├── services/
│   │   └── dashboard.service.js     # MỚI: business logic — aggregate queries + role filter
│   ├── repositories/
│   │   └── dashboard.repository.js  # MỚI: Prisma aggregate queries
│   ├── middleware/
│   │   ├── auth.middleware.js        # (đã có)
│   │   └── authorize.middleware.js   # (từ UC26)
│   ├── config/
│   │   └── redis.config.js          # MỚI: Redis client config
│   ├── routes/
│   │   └── dashboard.routes.js      # MỚI: GET /api/v1/dashboard/summary
│   ├── app.js                       # Cập nhật: mount dashboardRoutes
│   └── server.js                    # (đã có)
└── tests/
    └── dashboard/
        └── dashboard.service.test.js # MỚI: unit tests

frontend/
├── src/
│   ├── api/
│   │   └── dashboardApi.js          # MỚI: Axios client
│   ├── components/
│   │   └── pages/
│   │       └── DashboardPage.jsx    # MỚI: Dashboard screen
│   ├── components/
│   │   └── ui/
│   │       ├── KPICard.jsx          # MỚI: KPI card component
│   │       ├── EventsByMonthChart.jsx  # MỚI: Bar chart
│   │       ├── NewUsersChart.jsx    # MỚI: Line chart
│   │       └── ApplicationPieChart.jsx # MỚI: Pie chart
│   ├── hooks/
│   │   └── useDashboard.js          # MỚI: custom hook
│   └── App.js                       # Cập nhật: thêm route /dashboard
```

**Structure Decision**: Option 2 (Web application). Tạo mới toàn bộ stack cho Dashboard module. Sử dụng Prisma aggregate queries để tính KPI. Redis cache để tối ưu performance.

## Complexity Tracking

> **Không có vi phạm** — feature phức tạp trung bình (aggregate queries từ nhiều bảng + Redis cache + role-based filter), tuân thủ cấu trúc phân tầng chuẩn VMS.
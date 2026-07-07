# Triển khai kế hoạch: Volunteer Statistics (UC56)

**Branch**: `001-uc56-volunteer-statistics` | **Date**: 2026-07-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC56-feat-volunteer-statistics/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Admin và Manager cần thống kê về tình nguyện viên — số lượng đăng ký mới theo tháng, tổng số volunteer active, tỷ lệ tham gia sự kiện, top 5 volunteer tích cực nhất. Backend xây dựng endpoint `GET /api/v1/dashboard/volunteer-stats` với filter theo năm. Admin thấy toàn hệ thống, Manager chỉ thấy volunteer thuộc tổ chức mình. Cache Redis TTL 5 phút (kế thừa UC54). Staff/Volunteer bị 403, Guest bị 401.

**⚠️ Manager scope**: Manager có organization_id liên kết — chỉ thấy volunteer đã tham gia sự kiện thuộc tổ chức của mình (giống UC55, khác UC54).

## Technical Context

**Language/Version**: NodeJS (JavaScript ESM), React 19 + JSX

**Primary Dependencies**: 
- Backend: Express 5.x, Prisma ORM, Zod validation, Pino logger, swagger-jsdoc + swagger-ui-express, Redis (cache)
- Frontend: Material UI + Bootstrap 5, Axios (credentials: include), Recharts/Chart.js

**Storage**: MySQL via Prisma ORM + Redis cache

**Testing**: 
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Target Platform**: Web (Desktop-first)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Response < 3 giây, cache TTL 5 phút

**Constraints**: 
- Chỉ Admin và Manager mới có quyền truy cập (Staff/Volunteer → HTTP 403, Guest → HTTP 401)
- Admin: thấy dữ liệu toàn hệ thống
- Manager: chỉ thấy volunteer thuộc tổ chức mình (qua attendance → event → organization_id)
- Hỗ trợ `year` param (mặc định năm hiện tại)
- Response: `new_volunteers_by_month` (12 tháng), `total_active_volunteers`, `participation_rate` (%), `top_5_volunteers_by_events` (kèm tên, số events)
- Participation rate = volunteers có ≥1 attendance / tổng active volunteers
- Top volunteer = dựa trên số attendance records (điểm danh thành công)
- Nếu không có dữ liệu → trả về giá trị mặc định
- Cache Redis TTL 5 phút (kế thừa UC54)
- Swagger JSDoc bắt buộc
- Max function length: 40 dòng; max file length: 300 dòng
- Bắt buộc dùng `response.util.js`

**Scale/Scope**: Mở rộng Dashboard module (UC54/UC55). Kế thừa Redis cache, dashboard routes prefix. Dữ liệu từ User (role=VOLUNTEER), Attendance, Application, Event.

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
.sdd/DucNM/UC56-feat-volunteer-statistics/
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
│   │   └── dashboard.controller.js  # Thêm handler getVolunteerStats (kế thừa UC54/UC55)
│   ├── services/
│   │   └── dashboard.service.js     # Thêm hàm getVolunteerStatistics (kế thừa UC54/UC55)
│   ├── repositories/
│   │   └── dashboard.repository.js  # Thêm hàm volunteer stats (kế thừa UC54/UC55)
│   ├── routes/
│   │   └── dashboard.routes.js      # Thêm route GET /volunteer-stats (kế thừa UC54/UC55)
│   └── tests/
│       └── dashboard/
│           ├── dashboard.service.test.js # Thêm tests
│           └── dashboard.api.test.js     # Thêm tests
```

**Structure Decision**: Option 2 (Web application). Mở rộng Dashboard module từ UC54/UC55. Kế thừa Redis cache, routes prefix `/api/v1/dashboard`. Thêm mới các hàm `getVolunteerStatistics` ở các layer tương ứng.

## Complexity Tracking

> **Không có vi phạm** — feature trung bình (aggregate queries từ User, Attendance, Application + role-based org filter + Redis cache), kế thừa infrastructure từ UC54/UC55.
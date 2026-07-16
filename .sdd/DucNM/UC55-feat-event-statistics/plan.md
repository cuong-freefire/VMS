# Triển khai kế hoạch: Event Statistics (UC55)

**Branch**: `001-uc55-event-statistics` | **Date**: 2026-07-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ `.sdd/DucNM/UC55-feat-event-statistics/spec.md`

**Note**: Template này được fill theo cấu trúc của `.specify/templates/plan-template.md`.

## Summary

Admin và Manager cần xem thống kê chi tiết về sự kiện — số lượng sự kiện theo tháng, tỷ lệ hoàn thành, top 5 sự kiện có nhiều application approved nhất. Backend xây dựng endpoint `GET /api/v1/dashboard/event-stats` với filter theo năm hoặc khoảng thời gian tùy chỉnh. Admin thấy toàn hệ thống, Manager chỉ thấy sự kiện thuộc tổ chức của mình. Cache Redis TTL 5 phút. Staff/Volunteer bị 403, Guest bị 401.

**⚠️ Lưu ý về Manager scope**: Theo context.md, Manager có organization_id liên kết và chỉ thấy dữ liệu thuộc tổ chức của mình. Điều này khác với UC54 (Dashboard) nơi Manager là role hệ thần. UC55 spec FR-005 yêu cầu "Manager chỉ thống kê event thuộc organization của Manager". Giữ nguyên theo spec.

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

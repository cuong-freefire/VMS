# Implementation Plan: Export Reports (UC57)

**Branch**: `feat/uc57-export-reports` | **Date**: 2026-06-29 | **Spec**: `.sdd/DucNM/UC57-feat-export-reports/spec.md`

**Input**: Feature specification from `.sdd/DucNM/UC57-feat-export-reports/spec.md`

---

## Summary

Admin và Manager cần xuất báo cáo dạng CSV hoặc Excel từ dữ liệu thống kê (events, volunteers, donations, attendance). Hỗ trợ filter theo thời gian và organization.

Kỹ thuật: Tạo REST API `GET /api/v1/reports/export` với json2csv (CSV) và ExcelJS (XLSX). Stream file download. Giới hạn 10,000 dòng.

---

## Technical Context

**Language/Version**: NodeJS + Javascript (ESM), Express 5.x

**Primary Dependencies**: Prisma (MySQL), json2csv, ExcelJS, Pino, swagger-jsdoc, swagger-ui-express

**Storage**: MySQL (via Prisma ORM)

**Testing**: Jest + Supertest (Backend), Jest + React Testing Library (Frontend)

**Target Platform**: Web (Browser)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Export 1000 dòng < 3 giây

**Constraints**:
- Admin/Manager only. Staff → 403, Guest → 401
- Manager chỉ export dữ liệu trong organization mình
- Hỗ trợ 4 type: events, volunteers, donations, attendance
- Hỗ trợ 2 format: csv, xlsx
- Giới hạn 10,000 dòng/lần export
- Hỗ trợ filter: start_date, end_date, organization_id
- API format: `GET /api/v1/reports/export`
- Swagger JSDoc bắt buộc

**Scale/Scope**: Export tối đa 10,000 dòng/lần

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
.sdd/DucNM/UC57-feat-export-reports/
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
│   │   └── report.controller.js             # export()
│   ├── services/
│   │   └── report.service.js                # generateCSV(), generateXLSX()
│   ├── repositories/
│   │   └── report.repository.js             # queryEvents(), queryVolunteers(), queryDonations(), queryAttendance()
│   ├── validators/
│   │   └── report.validator.js              # exportQuerySchema
│   └── routes/
│       └── report.routes.js                 # GET /api/v1/reports/export

frontend/
├── src/
│   ├── api/
│   │   └── reportApi.js                     # exportReport()
│   ├── components/reports/
│   │   └── ExportReportPage.jsx
│   └── services/
│       └── report.service.js
```

**Structure Decision**: Web application. Backend layered. Frontend feature-based.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

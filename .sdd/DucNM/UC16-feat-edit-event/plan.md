# Implementation Plan: Edit Event (UC16)

**Branch**: `016-feat-edit-event` | **Date**: 2026-06-29 | **Spec**: [SPEC.md](.sdd/TienTD/UC16-feat-edit-event/SPEC.md)

**Input**: Feature specification from `.sdd/TienTD/UC16-feat-edit-event/SPEC.md`

**Note**: This plan is generated following the `/speckit-plan` workflow. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Staff cần chỉnh sửa thông tin sự kiện sau khi tạo để cập nhật những thay đổi thực tế (thời gian, địa điểm, mô tả, số lượng tình nguyện viên). Hiện tại không có chức năng edit, buộc Staff phải xóa đi tạo lại, gây mất dữ liệu và gián đoạn quy trình đăng ký.

**Technical Approach** (from Phase 0 research):
- **Backend**: PATCH `/api/v1/events/:id` endpoint với ownership validation (Staff chỉ edit events của tổ chức mình)
- **State Constraints**: Draft = edit tất cả fields, Published = hạn chế edit (không đổi ngày về quá khứ), In Progress/Completed/Cancelled = KHÔNG cho edit
- **Audit Logging**: Ghi log tất cả thay đổi vào `application_status_history` hoặc dedicated `event_audit_log` table (quyết định trong Phase 1)
- **Notification**: Trigger notification đến volunteers đã đăng ký khi thay đổi time/location (cross-module với Member 5)
- **Image Replacement**: Upload ảnh mới lên Cloudinary, xóa ảnh cũ để tiết kiệm storage

## Technical Context

**Language/Version**: NodeJS v18+ với Javascript (ESM)

**Primary Dependencies**: Express 5.x, Prisma (MySQL ORM), Zod (validation), JWT (auth), Cloudinary (image storage)

**Storage**: MySQL database với Prisma migrations

**Testing**: Jest + Supertest (integration tests), target 80% coverage cho EventService

**Target Platform**: Linux server (production), Windows/macOS (development)

**Project Type**: Backend REST API + React frontend

**Performance Goals**: API response time < 1.5s (SC-001), 100% audit logging cho critical fields (SC-002)

**Constraints**: 
- Staff chỉ edit events thuộc organization của mình (ownership check)
- Không edit events ở status In Progress/Completed/Cancelled
- Không đổi ngày về quá khứ
- Immutable fields: event.id, event.organization_id
- Audit trail bắt buộc cho time/location changes

**Scale/Scope**: ~10 events/organization, ~5 Staff users/organization, ~50 volunteers/event

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Layer 1: Respect SPEC.md Boundary
- ✅ **Pass**: UC16 scope rõ ràng - chỉ edit event info, KHÔNG bao gồm edit applications hoặc auto-translation (Out of Scope)
- ✅ **Pass**: User Stories độc lập và testable (US1: edit basic info, US2: prevent past dates)

### Layer 2: Constitution Principles
- ✅ **Pass**: Tuân thủ quy trình SDD (CONTEXT → SPEC → PLAN → TASKS → IMPLEMENT)
- ✅ **Pass**: Ownership validation enforce tại Service layer (Member 3 - TienTD owns Event Management)
- ✅ **Pass**: Cross-module communication qua Service contracts (NotificationService cho alerts)

### Layer 3: Tech Stack & Domain Rules
- ✅ **Pass**: Sử dụng Prisma + Zod + JWT (AGENTS.md Section 2)
- ✅ **Pass**: Soft delete pattern cho events (`is_active = false`, không hard delete)
- ✅ **Pass**: State immutability rules - không edit In Progress/Completed events (AGENTS.md Section 3)
- ✅ **Pass**: Audit logging bắt buộc cho critical changes (DATABASE.md Section 7)

**Conclusion**: All gates passed. Proceed to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
.sdd/TienTD/UC16-feat-edit-event/
├── CONTEXT.md           # Problem statement, constraints, decisions
├── SPEC.md              # Feature specification (EARS notation)
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── PATCH-events-id.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
# Backend API
backend/
├── src/
│   ├── controllers/
│   │   └── event.controller.js        # PATCH /events/:id handler (EXISTING - extend)
│   ├── services/
│   │   └── event.service.js           # updateEvent() business logic (EXISTING - extend)
│   ├── repositories/
│   │   └── event.repository.js        # Prisma queries (EXISTING - extend)
│   ├── validators/
│   │   └── event.validator.js         # Zod schema for update (NEW)
│   ├── middleware/
│   │   ├── auth.middleware.js         # JWT verification (EXISTING)
│   │   └── ownership.middleware.js    # Organization ownership check (NEW or extend)
│   └── routes/
│       └── event.routes.js            # PATCH /events/:id route (EXISTING - extend)
└── tests/
    └── integration/
        └── event.update.test.js       # Integration tests (NEW)

# Frontend React
frontend/
├── src/
│   ├── components/
│   │   ├── pages/
│   │   │   └── StaffEventEditPage.jsx     # Edit form UI (NEW)
│   │   └── ui/
│   │       └── EventFormFields.jsx        # Reusable form fields (EXTEND from UC15)
│   ├── services/
│   │   └── event.service.js               # API client (EXTEND)
│   └── hooks/
│       └── useEventForm.js                # Form state management (NEW)
└── tests/
    └── components/
        └── StaffEventEditPage.test.jsx   # Component tests (NEW)
```

**Structure Decision**: UC16 extends existing Event Management module (UC15 created event CRUD foundation). New files: validators, ownership middleware, edit UI components. Extend: controllers, services, repositories, routes.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All complexity is justified:
- Ownership middleware is necessary security constraint (Staff chỉ edit own org events)
- Audit logging is mandatory business requirement (FR-003, SC-002)
- Notification integration is approved decision (CONTEXT.md Section 7)

---

## Phase 0: Research

**Objective**: Answer 5 critical technical questions before design.

**Output**: `research.md` (generated below)

Key research areas:
1. **State Validation Rules**: Which event statuses allow edit? What fields are editable per status?
2. **Ownership Check Pattern**: Middleware vs Service layer? How to extract organization_id from JWT?
3. **Audit Logging Strategy**: New table `event_audit_log` vs reuse `application_status_history`?
4. **Notification Trigger**: When to send notifications? Which fields trigger alerts?
5. **Image Replacement Flow**: Upload new → delete old → update URL? Rollback strategy?

---

## Phase 1: Design

**Objective**: Translate research findings into concrete implementation artifacts.

**Output**: 
- `data-model.md` — Event update schema, validation rules, constraints
- `contracts/PATCH-events-id.md` — Complete API documentation với examples
- `quickstart.md` — Setup guide với troubleshooting

### 1. Data Model

**Core Entities**:
- **Event** (EXISTING): Extend với update logic
- **EventAuditLog** (NEW): Track changes to critical fields
- **Notification** (EXISTING): Trigger cho volunteers

**Key Design Rules**:
- Draft events: Allow edit all fields EXCEPT id, organization_id
- Published events: Restrict edit start_date, end_date, category_id
- In Progress/Completed/Cancelled: Block all edits
- Validation: start_date >= TODAY, end_date >= start_date, application_deadline < start_date

### 2. API Contract

**Endpoint**: `PATCH /api/v1/events/:id`

**Request Body** (Zod schema):
```javascript
{
  title?: string (max 500 chars),
  description?: text,
  location?: string (max 500 chars),
  start_date?: datetime (>= today),
  end_date?: datetime (>= start_date),
  application_deadline?: datetime (< start_date),
  max_capacity?: integer (> approved_participants),
  image?: file (Cloudinary upload),
  category_id?: integer (FK → event_categories)
}
```

**Response**: Updated event object + audit log confirmation

**Error Cases**:
- 401: Unauthorized (no JWT)
- 403: Forbidden (not owner or wrong role)
- 404: Event not found or soft deleted
- 409: Conflict (status not editable, date validation failed)
- 500: Internal server error

### 3. Quickstart

**Prerequisites**: Node 18+, MySQL running, Prisma migrations applied

**Setup Steps**:
1. Checkout branch `016-feat-edit-event`
2. Install dependencies: `npm install`
3. Run migrations: `npx prisma migrate dev`
4. Seed test data: `npm run seed`
5. Start backend: `npm run dev`
6. Run tests: `npm test -- event.update.test.js`

### 4. Key Design Rules

1. **Ownership Validation**: Extract `organization_id` from JWT `req.user.organization_id`, compare với `event.organization_id`
2. **State Machine**: DRAFT → editable all fields, PUBLISHED → restricted fields, IN_PROGRESS/COMPLETED/CANCELLED → read-only
3. **Audit Logging**: BEFORE update → snapshot old values, AFTER update → log changes to `event_audit_log`
4. **Notification Trigger**: IF (time/location changed) AND (event.approved_participants > 0) THEN trigger NotificationService
5. **Transaction Boundary**: Update event + audit log + notification MUST be atomic (Prisma transaction)

### 5. Done When

- [ ] `PATCH /api/v1/events/:id` endpoint implemented and tested
- [ ] Ownership middleware validates Staff belongs to event's organization
- [ ] State validation prevents edit on In Progress/Completed/Cancelled events
- [ ] Date validation prevents setting past dates
- [ ] Audit log records all changes to critical fields (time, location, capacity)
- [ ] Notification sent to volunteers when time/location changes
- [ ] Cloudinary image replacement deletes old image after upload
- [ ] Integration tests cover happy path + error cases (80% coverage)
- [ ] Frontend StaffEventEditPage component renders form with validation
- [ ] API documented in Swagger with request/response examples
- [ ] No TODO/FIXME comments in production code

---

**Next Steps**:
1. Review plan.md với TienTD (Member 3 - Event Management owner)
2. Generate Phase 0 artifact: `research.md` (answers 5 research questions)
3. Generate Phase 1 artifacts: `data-model.md`, `contracts/PATCH-events-id.md`, `quickstart.md`
4. Update CLAUDE.md Section 9 với UC16 plan reference
5. Run `/speckit-tasks` để generate tasks.md (Phase 2)

**Cross-Module Dependencies**:
- **Member 5 (DucNM)**: NotificationService.sendToVolunteers() contract
- **Member 1 (CuongLH)**: JWT middleware provides `req.user.organization_id`

**Risk Assessment**: 
- **Medium Risk**: Notification integration requires coordination với Member 5
- **Low Risk**: Core CRUD logic reuses UC15 foundation
- **Mitigation**: Define NotificationService contract trước khi implement

---

**Version**: 1.0  
**Status**: Phase 0 Pending  
**Last Updated**: 2026-06-29

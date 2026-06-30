# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.).

# Implementation Plan: UC13 - View Applied Events

**Branch**: `006-UC13-feat-applied-events` | **Date**: 2026-06-29 | **Spec**: `.sdd/NamLD/UC13-feat-applied-events/spec.md`

**Input**: Feature specification from `.sdd/NamLD/UC13-feat-applied-events/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

UC13 cho phép Volunteer đã đăng nhập xem danh sách sự kiện mà chính họ đã đăng ký, bao gồm trạng thái application (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`), thông tin tóm tắt của event, phân trang, loading/empty/error states và status filter nội bộ của Applied Events page. Backend dùng canonical endpoint `GET /api/v1/me/applications`; frontend client gọi relative endpoint `GET /me/applications`.

Implementation phải đi theo auth + ownership boundary: Guest chưa đăng nhập trả `401`, user không phải Volunteer trả `403`, Volunteer chỉ thấy application của chính mình. UC13 chỉ read dữ liệu application/event summary; không tạo application mới, không approve/reject, không cancel application. Nếu UI hiển thị cancel action cho application `PENDING`, đó chỉ là entry point/placeholder cho UC14 và không được gọi cancel API trong scope UC13.

## Technical Context

**Language/Version**: Backend NodeJS + JavaScript (ESM), frontend React 19 + JSX.

**Primary Dependencies**: Express, React, react-router-dom, axios với `credentials: include`; Zod cho query validation nếu backend validation đang dùng; Prisma/MySQL nếu database foundation đã sẵn sàng; UI library theo design system final của project. Nếu project tiếp tục dùng Material UI + Bootstrap 5, implementation cần thống nhất usage để tránh mixed styling.

**Storage**: MySQL via Prisma nếu final database/application foundation đã sẵn sàng. Vì UC13 đọc lịch sử application của Volunteer, production implementation cần dữ liệu persisted từ UC12/ApplicationService. Trong giai đoạn rebuild/early implementation, có thể dùng seed/mock repository tạm thời để validate UI/API contract, miễn là vẫn giữ đúng canonical endpoint `GET /api/v1/me/applications` và response shape.

**Testing**: Backend testing dùng Jest + Supertest theo AGENTS/constitution nếu package setup sẵn; nếu package.json final thay đổi thì dùng test runner thực tế của repo nhưng vẫn phải cover service/controller contract. Frontend testing dùng Jest + React Testing Library nếu setup sẵn; nếu chưa sẵn sàng thì manual verification/build check là bắt buộc.

**Target Platform**: Web app VMS chạy frontend React và backend Express tại local/dev/prod environment.

**Project Type**: Full-stack web feature trong VMS, gồm protected frontend page và protected backend API.

**Performance Goals**: `GET /api/v1/me/applications` phải trả paginated response ổn định cho danh sách application của một Volunteer; query theo `user_id`, `status`, `page`, `pageSize` phải tận dụng index phù hợp khi dùng DB.

**Constraints**:

- Canonical backend endpoint: `GET /api/v1/me/applications`.
- Frontend route target: `/me/applications` cho Applied Events page, hoặc route hiện có tương đương nếu router convention của project đã chốt; API client không được dùng alias deprecated như `/applications/my`.
- Response canonical: `{ success: true, data: { items: [], pagination: {} } }`.
- Auth required: JWT HttpOnly Cookie; không cho Guest xem dữ liệu.
- Role required: `VOLUNTEER`; Staff/Manager/Admin không dùng Volunteer Applied Events page.
- Ownership boundary: không nhận `userId` từ query/body; backend lấy current user từ auth context.
- Query params: `page`, `pageSize`, `status`.
- Status enum hợp lệ: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.
- Invalid query trả `422`.
- UC13 không gọi `PATCH /applications/:applicationId/cancel`; đó là UC14.

**Scale/Scope**: Scope giới hạn trong Member NamLD UC13. Feature reuse kết quả của UC12 Apply Event và có thể expose entry point cho UC14 Cancel Application, nhưng không implement cancel logic. Event detail link đi tới UC09 `/events/:id` nếu event còn available/public.

**Backend Strategy**:

- Flow: `Route -> Auth/Authorize -> Validator -> Controller -> Service -> Repository -> Mapper`.
- Route đăng ký `GET /me/applications` dưới API prefix `/api/v1`.
- Middleware bắt buộc: `authenticate` và `authorize(['VOLUNTEER'])`.
- Validator parse/validate `page`, `pageSize`, `status`; default `page = 1`, `pageSize = 10`, max `pageSize = 50`.
- Controller lấy `currentUser.id` từ auth context, không tin dữ liệu owner từ client.
- Service dùng contract `ApplicationService.getMyApplications(userId, filters)`.
- Repository chỉ query application có `user_id = currentUser.id`; status filter dùng AND với ownership.
- Mapper trả camelCase public fields: `applicationId`, `status`, `submittedAt`, `event`, `cancelable`, `decisionReason`, `reviewedAt`.
- `cancelable` là display field, chỉ true khi application còn `PENDING` và đủ điều kiện cho UC14; UC13 không xử lý state transition.
- Không trả private/internal fields như raw foreign keys không cần thiết, audit internals, password/user private data.

**Frontend Strategy**:

- Applied Events page nằm trong protected Volunteer area, target route `/me/applications`.
- `applicationApi.listMyApplications({ page, pageSize, status })` gọi relative endpoint `/me/applications`.
- UI hiển thị list of applied events với event summary, application status, submitted date, decision/review info nếu có.
- Có status filter: All/Pending/Approved/Rejected/Cancelled. Khi status filter thay đổi, reset `page` về 1.
- Pagination preserve active status filter.
- Có loading state khi fetch, empty state khi chưa có application, filter-empty state khi filter không có kết quả, error state khi API lỗi.
- View Detail link trỏ `/events/:id` nếu event còn available/public. Nếu event unavailable/soft-deleted, disable link hoặc hiển thị unavailable state theo UI convention.
- Không redirect Volunteer hợp lệ sang login khi API public/protected hoạt động đúng; Guest chưa auth đi qua login/auth flow của project.
- Cancel button/action nếu xuất hiện chỉ là placeholder/entry point cho UC14 và không dispatch cancel request trong UC13.

**Testing Strategy**:

- Backend test/verification:
  - `GET /api/v1/me/applications` với Volunteer authenticated trả `200` và canonical response `{ success, data: { items, pagination } }`.
  - Guest/unauthenticated request trả `401`.
  - Authenticated Staff/Manager/Admin trả `403`.
  - Volunteer chỉ thấy application của chính mình, không thấy application của Volunteer khác.
  - `status=PENDING|APPROVED|REJECTED|CANCELLED` filter đúng và kết hợp với ownership.
  - Pagination trả `page`, `pageSize`, `totalItems`, `totalPages` hợp lệ.
  - Invalid `page`, `pageSize`, `status` trả `422`.
  - Response không chứa private/internal fields.
- Frontend/manual test:
  - Guest mở Applied Events route thì đi theo login/auth flow.
  - Volunteer mở Applied Events route thấy loading rồi list hoặc empty state.
  - Status filter cập nhật kết quả và reset page về 1.
  - Pagination giữ nguyên status filter.
  - Empty/filter-empty/error states hiển thị rõ.
  - View Detail link vẫn trỏ `/events/:id`.
  - Cancel action không gọi `/applications/:applicationId/cancel` trong UC13.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Plan-first SDD**: PASS. Tài liệu này chỉ lập plan cho UC13, chưa sửa source code, chưa tạo migration, chưa tạo tasks.
- **Layered Architecture**: PASS. Backend strategy giữ flow `Controller -> Service -> Repository`; module khác chỉ giao tiếp qua service contract.
- **Auth/Authorization**: PASS. UC13 là protected Volunteer feature, dùng auth middleware và role guard; Guest `401`, non-Volunteer `403`.
- **Ownership Boundary**: PASS. Backend chỉ dùng current user từ JWT/auth context, không nhận owner id từ client.
- **Validation**: PASS. Query params `page`, `pageSize`, `status` được validate; invalid query trả `422`.
- **Response Format**: PASS. Response dùng canonical shape `{ success: true, data: { items: [], pagination: {} } }`.
- **Database/State Safety**: PASS. UC13 chỉ read application data, không mutate application status, không ảnh hưởng capacity/event/application state machine.
- **Cross-Module Boundary**: PASS. UC13 reuse `ApplicationService.getMyApplications(userId, filters)` và không import repository của module khác.
- **Scope Guard**: PASS. UC13 không implement UC12 Apply Event, UC14 Cancel Application, Staff approval/rejection, hoặc Event Detail content của UC09.
- **Template conflict note**: User yêu cầu dùng Spec Kit `plan-template.md`; nếu Constitution có format khác, plan này vẫn giữ Spec Kit structure nhưng các gate của Constitution vẫn được kiểm tra trong section Constitution Check.

## Project Structure

### Documentation (this feature)

```text
.sdd/NamLD/UC13-feat-applied-events/
|-- context.md
|-- spec.md
|-- plan.md
`-- tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Các path dưới đây là planned target structure cho implementation phase. Nếu repo convention thực tế khác, implementation phải follow repo convention thật và không tự bịa file không cần thiết.

```text
backend/
|-- src/
|   |-- routes/
|   |   `-- application.routes.js
|   |-- controllers/
|   |   `-- application.controller.js
|   |-- services/
|   |   `-- application.service.js
|   |-- repositories/
|   |   `-- application.repository.js
|   |-- validators/
|   |   `-- application.validator.js
|   |-- utils/
|   |   |-- application.mapper.js
|   |   `-- response.util.js
|   `-- middlewares/
|       |-- auth.middleware.js
|       `-- role.middleware.js
`-- tests/
    `-- applications/
        `-- applied-events.test.js

frontend/
`-- src/
    |-- App.js
    |-- api/
    |   `-- applicationApi.js
    |-- utils/
    |   `-- applicationQuery.js
    `-- components/
        |-- pages/
        |   |-- AppliedEventsPage.jsx
        |   `-- __tests__/
        |       `-- AppliedEventsPage.test.jsx
        `-- applications/
            |-- AppliedEventList.jsx
            |-- AppliedEventCard.jsx
            |-- AppliedEventsState.jsx
            |-- ApplicationStatusFilter.jsx
            `-- ApplicationPagination.jsx
```

**Structure Decision**: Chọn web application structure hiện có của VMS với `backend/` và `frontend/`. Backend đặt UC13 trong application module vì endpoint đọc `applications` của current Volunteer. Frontend tạo Applied Events page và các component application-specific, reuse router/API convention hiện có. File paths là planned target, không xác nhận đã tồn tại tại thời điểm plan.

## Complexity Tracking

Không có constitution violation cần justify.

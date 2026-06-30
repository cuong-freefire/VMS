# **LANGUAGE**: Tài liệu này được viết bằng tiếng Việt, giữ nguyên technical terms bằng English như API, endpoint, route, validation, repository, pagination, mock, seed, etc.

# Implementation Plan: UC09 - View Event Detail

**Branch**: `002-UC09-feat-event-detail` | **Date**: 2026-06-29 | **Spec**: `.sdd/NamLD/UC09-feat-event-detail/spec.md`

**Input**: Feature specification từ `.sdd/NamLD/UC09-feat-event-detail/spec.md`, context từ `.sdd/NamLD/UC09-feat-event-detail/context.md`, và project docs gồm `API_CONTRACTS.md`, `DATABASE.md`, `CROSS_DEPENDENCIES.md`, `CONSTITUTION.md`.

**Note**: Template này được fill theo `/speckit-plan`. Theo yêu cầu hiện tại, plan chỉ cập nhật `.sdd/NamLD/UC09-feat-event-detail/plan.md`, không tạo `tasks.md`, không sửa source code, không tạo migration/schema, không sửa project-wide docs.

## Summary

UC09 - View Event Detail cho phép Guest và Volunteer xem chi tiết một public/discoverable event từ entry point `View Detail` trên EventCard của UC08/UC10/UC11. Frontend route canonical là `/events/:id`; backend endpoint canonical là `GET /api/v1/events/:id`; frontend API client gọi relative `GET /events/:id` nếu base URL đã là `http://localhost:5000/api/v1`.

UC09 là public use case: Guest và Volunteer đều xem được event detail, không require login, không redirect sang `/login`, và public detail request không được kích hoạt session-expired popup. Backend chỉ trả detail cho event `PUBLISHED`, active, không soft-deleted. Nếu `id` invalid thì trả `422`; nếu event không tồn tại hoặc không public/discoverable thì trả `404`.

Relationship cần giữ rõ: UC08 = Event List, UC09 = Event Detail, UC10 = Search Event trên `/events`, UC11 = Filter Event trên `/events`, UC12 = Apply Event và không làm trong UC09. UC09 có thể hiển thị Apply entry point/placeholder nếu spec/UI cần, nhưng không submit application, không tạo application record, và không gọi `/events/:id/apply`.

Response success canonical theo `API_CONTRACTS.md` là `{ success: true, data: { ...eventDetail } }`, tức `data` chứa trực tiếp object event detail, không bọc thêm `data.event`.

## Technical Context

**Language/Version**: Backend dùng NodeJS + JavaScript ESM; frontend dùng React 19 + JSX theo `AGENTS.md`.

**Primary Dependencies**: Express, React, react-router-dom, axios; Zod cho backend validation nếu validation layer final đang dùng; Prisma/MySQL nếu database foundation đã sẵn sàng; UI library theo design system final của project. Cần tránh thêm dependency mới trong UC09.

**Storage**: Nếu MySQL/Prisma foundation đã sẵn sàng thì repository đọc event detail từ DB. Nếu chưa sẵn sàng thì có thể dùng seed/mock repository tạm thời. Dù dùng DB hay mock, API contract vẫn giữ `GET /api/v1/events/:id`.

**Testing**: Backend verification dùng Jest + Supertest theo `AGENTS.md` nếu package setup final sẵn sàng. Frontend verification dùng Jest + React Testing Library nếu setup sẵn. Trong early rebuild, manual verification/build check có thể dùng như bước tạm thời nhưng không thay thế DoD test coverage khi implementation vào merge-ready.

**Target Platform**: Web application, backend API server tại `http://localhost:5000/api/v1`, frontend route `/events/:id`.

**Project Type**: Web application gồm backend REST API và frontend React SPA.

**Performance Goals**: Detail endpoint nên phản hồi trong target chung của project `<200ms p95` với dữ liệu hợp lý, dùng indexed lookup theo event id khi DB đã sẵn sàng. Frontend detail page phải render loading/not found/error states rõ ràng và không block Back to Events navigation.

**Constraints**:

- UC09 chỉ là View Event Detail tại `/events/:id`; không implement Event List/Search/Filter behavior.
- Backend endpoint canonical là `GET /api/v1/events/:id`; frontend client gọi relative `GET /events/:id`.
- Public access: Guest/Volunteer xem được, không require login, không redirect Guest sang `/login`.
- Chỉ hiển thị public/discoverable event: `PUBLISHED`, active, không soft-deleted.
- Invalid `id` trả `422`.
- Event không tồn tại hoặc non-public event trả `404`; không leak draft/private/inactive/soft-deleted detail.
- UC09 có Back to Events link về `/events`.
- UC09 có loading/error/not found/unavailable state và fallback khi thiếu image/optional fields.
- UC09 không implement UC12 Apply Event, không tạo application record, không gọi `/events/:id/apply`.
- UC09 không tạo migration/schema riêng, không setup Prisma/MySQL riêng, không sửa `API_CONTRACTS.md` hoặc `DATABASE.md`.

**Scale/Scope**: Scope là một detail page cho một event id. Data hiển thị gồm các public detail fields theo `API_CONTRACTS.md` khi có sẵn: `id`, `title`, `description`, `shortDescription`, `imageUrl`, `organization`, `category`, `skills`, `startDate`, `endDate`, `location`, `maxCapacity`, `approvedParticipants`, `remainingSlots`, `applicationDeadline`, `status`, `displayStatus`, `canApply`, `applyDisabledReason`. `canApply` và `applyDisabledReason` nếu có trong response chỉ dùng để hiển thị trạng thái/placeholder; final apply authority vẫn thuộc UC12/backend Apply Event flow.

**Backend Strategy**:

Flow mục tiêu:

```text
Route -> Validator -> Controller -> Service -> Repository -> Seed/DB -> Mapper
```

Backend reuse event module hiện có và thêm public detail route `GET /events/:id` dưới prefix `/api/v1`. Validator validate path param `id` là positive integer; invalid id trả `422`. Controller chỉ đọc validated id, gọi service, và trả standard response; controller không chứa visibility/business logic.

Service layer gọi `getPublicEventDetail(eventId)` hoặc tương đương, enforce public visibility rule `status = PUBLISHED`, active, không soft-deleted. Repository dùng Prisma/MySQL nếu foundation đã sẵn sàng, hoặc seed/mock repository trong giai đoạn rebuild. Với missing/non-public event, service/controller map thành `404` để không xác nhận sự tồn tại của private event.

Mapper trả camelCase public fields, derive `remainingSlots` và `displayStatus` nếu cần, không trả staff-only/internal/private fields. Response success là `{ success: true, data: eventDetail }`.

**Frontend Strategy**:

Frontend thêm/giữ route `/events/:id` để render `EventDetailPage`. Page đọc `id` từ route params, gọi `eventApi.getEventDetail(id)` tới relative `/events/:id`, hiển thị loading khi pending, not found/unavailable cho `404`, generic error với retry cho lỗi khác, và Back to Events link về `/events`.

UI hiển thị public detail fields khi có sẵn: image/fallback, title, description, organization, category, skills, date/time, location, capacity/remaining slots, application deadline, status/displayStatus, và optional Apply entry point/placeholder nếu spec/UI cần. Missing optional fields phải được hide hoặc hiển thị fallback an toàn, không crash.

UC09 không submit apply. Apply button nếu xuất hiện chỉ là entry point/placeholder sang UC12/Auth flow theo design sau này; plan này không tạo `/events/:id/apply`, không gọi apply API, không tạo application record.

**Testing Strategy**:

Backend/API verification cần cover:

- `GET /api/v1/events/:id` trả public event detail với `{ success: true, data: { ... } }`.
- Invalid `id` trả `422`.
- Missing event trả `404`.
- Non-public event (`DRAFT`, `COMPLETED`, `CANCELLED`, inactive/soft-deleted) trả `404`.
- Guest gọi public detail không cần auth.
- Response camelCase, không có private/internal/staff-only fields.
- Mapper xử lý missing optional fields an toàn.

Frontend/manual verification cần cover:

- Click `View Detail` từ EventCard trên `/events` điều hướng tới `/events/:id`.
- Event Detail page gọi `GET /api/v1/events/:id`.
- Loading state, not found/unavailable state, generic error state, retry, image fallback hoạt động.
- Back to Events link quay về `/events`.
- Guest không bị redirect sang `/login` chỉ vì xem detail.
- Public detail request không show session-expired popup.
- UC09 không tạo application, không gọi `/events/:id/apply`, không render UC10/UC11 search/filter behavior.
- `/events`, `/`, `/login` không bị phá khi thêm detail route.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SDD Pha 2 - Plan only**: Pass. Tài liệu này chỉ lập kế hoạch, không viết source code, không tạo migration, không tạo tasks.
- **Spec/Plan source of truth**: Pass. Plan dựa trên UC09 `context.md`, `spec.md`, `API_CONTRACTS.md`, `DATABASE.md`, `CROSS_DEPENDENCIES.md`, `CONSTITUTION.md`.
- **Layered Architecture**: Pass. Backend strategy giữ `Route -> Validator -> Controller -> Service -> Repository -> Seed/DB -> Mapper`; public visibility logic thuộc Service/Repository, không nhồi vào Controller.
- **Input Validation**: Pass. Path param `id` phải validate bằng Zod hoặc validation pattern final của backend trước khi query repository; invalid id trả `422`.
- **Auth & Public Access**: Pass. `GET /events/:id` cho UC09 là public, không gắn `authenticate` middleware chỉ để xem public detail.
- **Response Contract**: Pass. Plan dùng canonical detail response theo `API_CONTRACTS.md`: `{ success: true, data: { ...eventDetail } }`.
- **Module Boundaries**: Pass. UC09 consume EventService public detail contract; Category/Skill/Organization data là dependency/summaries từ module khác, không import repository trực tiếp của module khác.
- **Soft Delete/Public Visibility**: Pass. Backend phải lọc `status = PUBLISHED`, active, không soft-deleted; non-public event trả `404`.
- **Scope Guard**: Pass. UC09 không mở rộng sang UC08 list implementation, UC10 search, UC11 filter, UC12 Apply Event, hoặc Staff CRUD.

Template conflict note: user yêu cầu dùng spec-kit plan template; nếu Constitution có format khác, plan này vẫn giữ spec-kit structure nhưng các gate của Constitution vẫn được kiểm tra trong section Constitution Check.

## Project Structure

### Documentation (this feature)

```text
.sdd/NamLD/UC09-feat-event-detail/
|-- context.md
|-- spec.md
|-- plan.md
|-- tasks.md              # Chỉ tạo ở bước /speckit-tasks, không tạo trong plan này
```

### Source Code (repository root)

Các path dưới đây là planned target structure cho implementation phase. Nếu repo convention thực tế khác, implementation phải follow repo convention thật và không tự bịa file không cần thiết.

```text
backend/
|-- src/
|   |-- routes/
|   |   `-- event.routes.js
|   |-- controllers/
|   |   `-- event.controller.js
|   |-- services/
|   |   `-- event.service.js
|   |-- repositories/
|   |   `-- event.repository.js
|   |-- validators/
|   |   `-- event.validator.js
|   `-- utils/
|       |-- event.mapper.js
|       `-- response.util.js
`-- tests/
    `-- events/
        `-- event-detail.test.js

frontend/
|-- src/
|   |-- components/
|   |   |-- pages/
|   |   |   |-- EventDetailPage.jsx
|   |   |   `-- __tests__/
|   |   |       `-- EventDetailPage.test.jsx
|   |   `-- events/
|   |       |-- EventDetail.jsx
|   |       |-- EventDetailState.jsx
|   |       `-- EventCard.jsx
|   |-- api/
|   |   `-- eventApi.js
|   `-- App.js
```

**Structure Decision**: UC09 thuộc web application structure hiện có gồm `backend/` và `frontend/`. Implementation phase phải reuse event module/API client/mapper foundation từ UC08/UC10/UC11, nhưng UC09 có page riêng cho detail tại `/events/:id`. Nếu các file foundation đã tồn tại với tên khác, follow repo convention thật; nếu chưa có, tasks phase mới quyết định file cụ thể.

## Complexity Tracking

Không có constitution violation cần justify.

# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.).

# Implementation Plan: UC08 - View Event List

**Branch**: `001-UC08-feat-event-list` | **Date**: 2026-06-29 | **Spec**: `.sdd/NamLD/UC08-feat-event-list/spec.md`

**Input**: Feature specification from `.sdd/NamLD/UC08-feat-event-list/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

UC08 cho phép Guest và Volunteer xem danh sách event tình nguyện công khai tại frontend route `/events`. Feature này dùng canonical backend API `GET /api/v1/events` (relative endpoint `GET /events` dưới Base URL `http://localhost:5000/api/v1`), trả về event summaries theo response shape chuẩn `{ success, data, meta }` nếu pagination được dùng.

Technical approach là xây dựng Event List như shared foundation cho UC08/UC10/UC11: UC08 chịu trách nhiệm base list, pagination, loading/empty/error states, image fallback và navigation sang UC09 `/events/:id`; UC10 Search và UC11 Filter sẽ dùng chung page/API/query state nhưng behavior chi tiết của search/filter không được trộn vào UC08. Backend phải enforce public visibility rule `status = PUBLISHED AND is_active = true`, không trả `DRAFT`, `COMPLETED`, `CANCELLED`, archived/inactive hoặc soft-deleted events.

## Technical Context

**Language/Version**: Backend NodeJS + JavaScript ESM; Frontend React 19 + JSX.

**Primary Dependencies**: Express, React, react-router-dom, axios; Zod nếu backend validation đang dùng; Prisma/MySQL nếu database foundation đã sẵn sàng; UI library theo design system final của project. Nếu Material UI và Bootstrap 5 cùng tồn tại, implementation cần thống nhất usage để tránh mixed styling.

**Storage**: MySQL via Prisma nếu final database foundation đã sẵn sàng; trong giai đoạn rebuild/early implementation, UC08 có thể dùng seed/mock repository tạm thời phía backend miễn là vẫn giữ đúng API contract `GET /api/v1/events`. UC08 không tạo schema/migration mới; khi DB thật sẵn sàng thì map theo các bảng canonical trong `DATABASE.md`: `events`, `organizations`, `event_categories`, `event_skills`, `skills`.

**Testing**: Backend testing dùng Node test runner hoặc Jest/Supertest tùy `package.json` final; Frontend testing dùng React Testing Library nếu test setup sẵn, nếu chưa thì manual verification/build check là bắt buộc.

**Target Platform**: Web application chạy local dev với backend REST API và React frontend.

**Project Type**: Web application gồm backend Express API và frontend React app.

**Performance Goals**: `GET /events` hướng tới p95 < 200ms với query phân trang, chỉ select fields cần thiết, tránh N+1 khi dùng DB thật để include organization/category/skills.

**Constraints**: Không require authentication cho UC08; response phải dùng `backend/src/utils/response.util.js`; validation query bằng Zod; UC08 validate pagination params; các query params mở rộng cho UC10/UC11 cũng phải trả 422 khi được implement sau.; API contract dùng camelCase; DB dùng snake_case; không expose staff-only/private fields; không tạo endpoint deprecated như `/events/search`.

**Scale/Scope**: Một public Event List page `/events`, một canonical backend API `GET /api/v1/events` (relative `GET /events`), event summaries phân trang `page/pageSize` tối đa 50 items/page, và shared extension points cho `keyword`, `categoryId`, `skillId`, `organizationId`, `location`, `startDate`, `endDate`, `availability`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Language gate**: PASS. Plan viết bằng tiếng Việt, giữ technical terms bằng English.
- **Tech stack gate**: PASS. Giữ hướng NodeJS + JavaScript ESM, Express, React + JSX, Axios; Zod, Prisma/MySQL, UI library và test runner follow foundation final của repo/package, không tự introduce stack mới ngoài decision của project.
- **Layered architecture gate**: PASS. UC08 backend đi theo Route -> Controller -> Service -> Repository; business visibility rule nằm ở Service layer. Repository có thể dùng Prisma/MySQL khi DB foundation sẵn sàng hoặc seed/mock tạm thời trong early implementation, miễn không làm sai API contract.
- **API contract gate**: PASS. Dùng canonical `GET /api/v1/events` (relative `GET /events`); response format `{ success, data }`; không dùng deprecated aliases.
- **Domain rule gate**: PASS. Public/discoverable events là `PUBLISHED` và active; `displayStatus` là derived field, không tạo DB enum mới; `remainingSlots` derive từ `maxCapacity - approvedParticipants`.
- **Module boundary gate**: PASS. NamLD consume EventService public contract của Member 3; category/skill summaries từ Member 4 và organization summaries từ Member 5 khi không embedded trong `GET /events`; không import repository của module khác.
- **Security/privacy gate**: PASS. UC08 public nhưng chỉ trả public event summaries; không trả password/token/audit/internal staff fields.
- **Scope gate**: PASS. UC08 = base event list; UC10 = search behavior mở rộng sau; UC11 = filter behavior mở rộng sau; UC09 = detail page riêng `/events/:id`; UC12 = apply event và không làm trong UC08. UC08 cũng không implement UC13/UC14 applications, UC48 feedback, UC51/UC52 certificates.
- **Template conflict note**: User yêu cầu dùng spec-kit plan template; nếu Constitution có format khác, plan này vẫn giữ spec-kit structure nhưng các gate của Constitution vẫn được kiểm tra trong section `Constitution Check`.

## Project Structure

### Documentation (this feature)

```text
.sdd/NamLD/UC08-feat-event-list/
├── context.md          # Human-written UC08 context
├── spec.md             # Feature specification for UC08
├── plan.md             # This file (/speckit-plan command output)
├── research.md         # Phase 0 output if full plan workflow continues
├── data-model.md       # Phase 1 output if full plan workflow continues
├── quickstart.md       # Phase 1 output if full plan workflow continues
├── contracts/          # Phase 1 output if full plan workflow continues
└── tasks.md            # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

Các path dưới đây là planned target structure cho implementation phase. Nếu repo convention thực tế khác, implementation phải follow repo convention thật và không tự bịa file không cần thiết.

```text
backend/
├── src/
│   ├── app.js
│   ├── routes/
│   │   └── event.routes.js
│   ├── controllers/
│   │   └── event.controller.js
│   ├── services/
│   │   └── event.service.js
│   ├── repositories/
│   │   └── event.repository.js
│   ├── validators/
│   │   └── event.validator.js
│   └── utils/
│       ├── response.util.js
│       └── event.mapper.js
└── tests/
    └── events/
        ├── event-list.test.js
        └── event.mapper.test.js

frontend/
├── src/
│   ├── App.js
│   ├── api/
│   │   ├── axiosApi.js
│   │   └── eventApi.js
│   ├── components/
│   │   ├── pages/
│   │   │   └── EventListPage.jsx
│   │   └── events/
│   │       ├── EventList.jsx
│   │       ├── EventCard.jsx
│   │       ├── EventListState.jsx
│   │       ├── EventPagination.jsx
│   │       └── __tests__/
│   └── utils/
│       ├── eventFormatters.js
│       └── eventQuery.js
```

**Structure Decision**: Chọn Web application structure với `backend/` và `frontend/`. UC08 cần backend public API path `GET /api/v1/events` (relative `GET /events`) theo Controller -> Service -> Repository, và frontend route/page `/events` dùng reusable Event List components để UC10/UC11 có thể mở rộng trên cùng screen. Không chọn single-project hoặc mobile structure vì repo hiện là Express + React web app.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Không có constitution violation cần justify.

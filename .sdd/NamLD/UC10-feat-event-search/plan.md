# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.).

# Implementation Plan: UC10 - Search Event

**Branch**: `003-UC10-feat-event-search` | **Date**: 2026-06-29 | **Spec**: `.sdd/NamLD/UC10-feat-event-search/spec.md`

**Input**: Feature specification from `.sdd/NamLD/UC10-feat-event-search/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

UC10 cho phép Guest và Volunteer search public events bằng `keyword` ngay trên Event List page `/events`. UC10 không tạo page riêng và không tạo endpoint riêng; feature này mở rộng foundation của UC08 bằng search behavior, search input, shared query state, pagination, loading/empty/error states, và clear/reset search.

Technical approach là reuse cùng backend endpoint canonical `GET /api/v1/events` (relative endpoint `GET /events` dưới Base URL `http://localhost:5000/api/v1`) với query param `keyword`, ví dụ `GET http://localhost:5000/api/v1/events?keyword=beach`. Backend phải trim và validate keyword, search case-insensitive khi phù hợp, kết hợp search với public visibility rule `status = PUBLISHED AND isActive = true`, và trả response canonical `{ success: true, data: { items: [], pagination: {} } }` với fields camelCase theo contract. Frontend reuse `EventListPage`, `EventCard`, `eventApi.listEvents(query)`, pagination, loading/empty/error states từ UC08; UC11 filter behavior không nằm trong UC10 nhưng query state phải sẵn sàng để keyword có thể kết hợp với filter sau này.

## Technical Context

**Language/Version**: Backend NodeJS + JavaScript ESM; Frontend React + JSX theo foundation hiện tại/final của repo.

**Primary Dependencies**: Express, React, react-router-dom, axios; Zod nếu backend validation đang dùng; Prisma/MySQL nếu database foundation đã sẵn sàng; UI library theo design system final của project. Không chốt thêm package mới cho UC10.

**Storage**: MySQL via Prisma nếu final database foundation đã sẵn sàng; nếu chưa sẵn sàng thì có thể dùng seed/mock repository tạm thời ở backend miễn là API contract vẫn giữ `GET /api/v1/events?keyword=...`. UC10 không setup Prisma/MySQL riêng, không tạo schema/migration mới, và không sửa `DATABASE.md`.

**Testing**: Backend testing dùng Node test runner hoặc Jest/Supertest tùy `package.json` final; Frontend testing dùng React Testing Library nếu test setup sẵn. Nếu test setup chưa sẵn sàng, manual verification/build check là bắt buộc cho flow search trên `/events`.

**Target Platform**: Web application với backend REST API và frontend Event List page.

**Project Type**: Web application gồm backend Express API và frontend React app.

**Performance Goals**: Search request `GET /events?keyword=...` hướng tới p95 < 200ms với pagination, chỉ select public summary fields cần thiết, tránh N+1 khi search/include organization/category/skills từ DB thật. Với dataset nhỏ, case-insensitive `contains`/`LIKE` là đủ cho MVP; FULLTEXT search không bắt buộc trong UC10.

**Constraints**: Auth public, không require login cho Guest/Volunteer search. UC10 phải dùng `GET /api/v1/events` và relative client path `/events`; không tạo `/events/search`, `/events/filter`, page `/events/search`, hoặc `/events/:id/apply`. Response theo `API_CONTRACTS.md`: `{ success: true, data: { items: [], pagination: {} } }`; `data.items` chứa search results và `data.pagination` chứa `page`, `pageSize`, `totalItems`, `totalPages`. Invalid query params trả `422`. Search result chỉ gồm public/discoverable events: `PUBLISHED`, active, không soft-deleted; không trả `DRAFT`, `COMPLETED`, `CANCELLED`, inactive/private/internal fields.

**Scale/Scope**: Một search behavior trên page `/events`, một query param chính `keyword`, dùng chung pagination `page/pageSize` max 50 items/page. Keyword được trim; blank/whitespace-only keyword trở về base Event List của UC08; keyword thay đổi reset page về 1; clear search/reset quay về list bình thường hoặc filter state hiện có khi UC11 được implement. Search fields trong scope: title, shortDescription/description, location, organization name, category name, skill name nếu API/data join có sẵn.

**Backend Strategy**: Flow backend là `Route -> Validator -> Controller -> Service -> Repository -> Seed/DB`. Route reuse `GET /events`; Validator validate `keyword`, `page`, `pageSize`; Controller chỉ đọc validated query, gọi Service, và trả canonical response `{ success: true, data: { items, pagination } }`; Service trim keyword, áp public visibility rule, phối hợp pagination và search behavior; Repository query từ Prisma/MySQL khi sẵn sàng hoặc seed/mock repository tạm thời. Keyword validation plan: optional string, trim trước search, blank equals no keyword filter, max length bounded by validator, reject control characters hoặc format không hợp lệ bằng `422`.

**Frontend Strategy**: Search input nằm trên `/events` trong `EventListPage`; dùng submit hoặc debounce nhẹ nếu implementation chọn, nhưng MVP có thể dùng explicit submit để đơn giản. `eventApi.listEvents(query)` gửi `keyword`, `page`, `pageSize` tới relative `/events`. UI show loading khi searching, empty state khi không có result, error state khi request fail, clear search để quay về base list, View Detail vẫn route `/events/:id`. Public search request không trigger login redirect hoặc session-expired popup cho Guest.

**Testing Strategy**: Backend verify `GET /api/v1/events?keyword=...` trả matching public events trong `data.items`, không trả non-public/soft-deleted events, empty result trả `data.items: []` và `data.pagination` hợp lệ, invalid keyword/query trả `422`, pagination vẫn đúng khi search. Frontend/manual verify mở `/events`, type keyword, submit/search, results update từ `data.items`, empty state works, clear search works, View Detail vẫn `/events/:id`, và các route `/events`, `/`, `/login` không bị phá.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Language gate**: PASS. Plan viết bằng tiếng Việt, giữ technical terms bằng English.
- **SDD gate**: PASS. UC10 đã có `context.md` và `spec.md`; plan chỉ lập kế hoạch, không viết code, không tạo migration, không tạo `tasks.md`.
- **Tech stack gate**: PASS. Giữ NodeJS + JavaScript ESM, Express, React + JSX, axios; validation/storage/testing follow foundation final của repo, không introduce package mới.
- **Layered architecture gate**: PASS. Backend strategy tuân thủ Route -> Validator -> Controller -> Service -> Repository -> Seed/DB; business visibility/search rules nằm ở Service/Repository, không đặt trong Controller.
- **API contract gate**: PASS. Dùng canonical `GET /api/v1/events` (relative `GET /events`) với `keyword`; không dùng deprecated alias `GET /events/search`; response canonical là `{ success: true, data: { items: [], pagination: {} } }` với fields camelCase theo `API_CONTRACTS.md`.
- **Domain visibility gate**: PASS. Search result vẫn chỉ là public/discoverable events: `status = PUBLISHED AND isActive = true`; không trả draft/completed/cancelled/inactive/soft-deleted events.
- **Auth gate**: PASS. UC10 public cho Guest và Volunteer, không require login, không dùng `authenticate` middleware cho search endpoint.
- **Scope gate**: PASS. UC08 = base Event List; UC10 = Search behavior trên Event List page; UC11 = Filter behavior trên Event List page. UC10 không implement UC11 full filter behavior, UC09 detail content, UC12 Apply Event, UC13/UC14 applications, UC48 feedback, UC51/UC52 certificates.
- **Cross-module boundary gate**: PASS. NamLD consume EventService public contract của Member 3; category/skill summaries từ Member 4 và organization summaries từ Member 5 khi không embedded trong `GET /events`; không import repository của module khác.
- **Security/privacy gate**: PASS. Backend validate keyword/query trước repository access, không raw SQL string concatenation, không expose staff-only/private fields, credentials, audit/internal data.
- **Template conflict note**: User yêu cầu dùng Spec Kit `plan-template.md`; nếu `CONSTITUTION.md` có format PLAN khác, plan này vẫn giữ Spec Kit structure nhưng các gate của Constitution được kiểm tra trong section `Constitution Check`.

## Project Structure

### Documentation (this feature)

```text
.sdd/NamLD/UC10-feat-event-search/
├── context.md          # Human-written UC10 context
├── spec.md             # Feature specification for UC10
├── plan.md             # This file (/speckit-plan command output)
├── research.md         # Phase 0 output if full plan workflow continues
├── data-model.md       # Phase 1 output if full plan workflow continues
├── quickstart.md       # Phase 1 output if full plan workflow continues
├── contracts/          # Phase 1 output if full plan workflow continues
└── tasks.md            # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

Các path dưới đây là planned target structure cho implementation phase. Nếu repo convention thực tế khác, implementation phải follow repo convention thật và không tự bịa file không cần thiết. UC10 phải reuse UC08 Event List foundation thay vì tạo page/search endpoint riêng.

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
│   │       ├── EventSearchBar.jsx
│   │       ├── EventList.jsx
│   │       ├── EventCard.jsx
│   │       ├── EventListState.jsx
│   │       ├── EventPagination.jsx
│   │       └── __tests__/
│   └── utils/
│       ├── eventFormatters.js
│       └── eventQuery.js
```

**Structure Decision**: Chọn Web application structure với `backend/` và `frontend/`. UC10 không có standalone page; search input/behavior nằm trong `EventListPage` tại route `/events`, dùng chung `EventCard`, `EventList`, `EventPagination`, `EventListState`, và `eventApi.listEvents(query)` với UC08/UC11. Backend reuse `GET /api/v1/events` theo Route -> Validator -> Controller -> Service -> Repository -> Seed/DB.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Không có constitution violation cần justify.

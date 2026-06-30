# **LANGUAGE**: Tài liệu này được viết bằng tiếng Việt, giữ nguyên technical terms bằng English như API, endpoint, query params, validation, pagination, repository, mock, seed, etc.

# Implementation Plan: UC11 - Filter Event

**Branch**: `004-UC11-feat-event-filter` | **Date**: 2026-06-29 | **Spec**: `.sdd/NamLD/UC11-feat-event-filter/spec.md`

**Input**: Feature specification từ `.sdd/NamLD/UC11-feat-event-filter/spec.md`, context từ `.sdd/NamLD/UC11-feat-event-filter/context.md`, và project docs gồm `API_CONTRACTS.md`, `DATABASE.md`, `CROSS_DEPENDENCIES.md`, `CONSTITUTION.md`.

**Note**: Template này được fill theo `/speckit-plan`. Theo yêu cầu hiện tại, plan chỉ cập nhật `.sdd/NamLD/UC11-feat-event-filter/plan.md`, không tạo `tasks.md`, không sửa source code, không tạo migration/schema, không sửa project-wide docs.

## Summary

UC11 - Filter Event bổ sung filter behavior cho cùng Event List page tại route `/events`. UC11 không tạo page riêng và không tạo endpoint riêng; frontend gọi relative endpoint `GET /events` trên API base URL, runtime backend là `GET /api/v1/events`.

UC11 reuse foundation của UC08/UC10: `EventListPage`, `EventCard`, `EventSearchBar` nếu đã có, `eventApi.listEvents(query)`, pagination, loading/empty/error states. Relationship cần giữ rõ: UC08 = base Event List, UC10 = Search behavior bằng `keyword`, UC11 = Filter behavior trên cùng Event List page. UC11 có thể kết hợp với UC10 keyword search nhưng không rewrite UC10.

Filter query params canonical: `categoryId`, `skillId`, `organizationId`, `location`, `startDate`, `endDate`, `availability`, `page`, `pageSize`, `keyword`. Response canonical cho paginated event list là:

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {}
  }
}
```

Backend luôn enforce public/discoverable rule: chỉ trả events `PUBLISHED`, active, không soft-deleted. Guest và Volunteer đều dùng được, không require login.

## Technical Context

**Language/Version**: Backend dùng NodeJS + JavaScript ESM; frontend dùng React 19 + JSX theo `AGENTS.md`.

**Primary Dependencies**: Express, React, react-router-dom, axios; Zod cho backend query validation theo Constitution/AGENTS; Prisma/MySQL nếu database foundation đã sẵn sàng; UI library theo design system final của project. `AGENTS.md` đang ghi Material UI + Bootstrap 5, nhưng implementation cần thống nhất styling để tránh mixed UI không kiểm soát.

**Storage**: Nếu MySQL/Prisma foundation đã sẵn sàng thì repository filter từ DB. Nếu chưa sẵn sàng thì có thể dùng seed/mock repository tạm thời. Dù dùng DB hay mock, API contract vẫn giữ `GET /api/v1/events` với query params canonical.

**Testing**: Backend verification dùng Jest + Supertest theo `AGENTS.md` nếu package setup final sẵn sàng. Frontend verification dùng Jest + React Testing Library nếu setup sẵn. Trong early rebuild, manual verification/build check có thể dùng như bước tạm thời nhưng không thay thế DoD test coverage khi implementation vào merge-ready.

**Target Platform**: Web application, backend API server tại `http://localhost:5000/api/v1`, frontend route `/events`.

**Project Type**: Web application gồm backend REST API và frontend React SPA.

**Performance Goals**: Event list/filter API nên phản hồi trong target chung của project `<200ms p95` với dữ liệu hợp lý, dùng pagination và indexed query khi DB đã sẵn sàng. Frontend filter state không làm layout shift lớn và không block navigation sang detail.

**Constraints**:

- UC11 chỉ là Filter Event trên `/events`; không tạo `/events/filter` và không tạo page `/events/filter`.
- Backend endpoint canonical là `GET /api/v1/events`; frontend client gọi relative `GET /events`.
- Public access: Guest/Volunteer filter được, không require login, không redirect Guest sang `/login`.
- Response shape phải nhất quán với `API_CONTRACTS.md`: `{ success: true, data: { items: [], pagination: {} } }`.
- Invalid filter query trả `422` theo validation contract.
- Chỉ trả public/discoverable events: `PUBLISHED`, active, không soft-deleted; không trả `DRAFT`, `COMPLETED`, `CANCELLED`, inactive/private/internal fields.
- UC11 không implement UC09 detail content, không implement UC12 Apply Event, không tạo `/events/:id/apply`.
- UC11 không tạo migration/schema riêng, không setup Prisma/MySQL riêng, không sửa `API_CONTRACTS.md` hoặc `DATABASE.md`.

**Scale/Scope**: Scope là filter event summary list theo `categoryId`, `skillId`, `organizationId`, `location`, `startDate`, `endDate`, `availability`, kết hợp được với `keyword`, `page`, `pageSize`. Filter options cho category/skill/organization phụ thuộc dữ liệu/service của Member 4/Member 5; nếu data/API chưa sẵn sàng thì UI có thể hide/disable/degrade filter tương ứng.

**Backend Strategy**:

Flow mục tiêu:

```text
Route -> Validator -> Controller -> Service -> Repository -> Seed/DB
```

Backend reuse `GET /events` dưới prefix `/api/v1`. Validator xử lý query params optional, trim `location`/`keyword`, validate positive ID cho `categoryId`, `skillId`, `organizationId`, validate ISO date cho `startDate`/`endDate`, reject date range sai (`startDate > endDate`), validate `availability` chỉ nhận `AVAILABLE` hoặc `FULL`, validate `page`/`pageSize` theo default/max của API contract. Query invalid trả `422`.

Service layer enforce public visibility rule trước/sau khi apply filter logic. Multiple active filters dùng AND logic; nếu có `keyword` từ UC10 thì kết quả phải match cả keyword và active filters. Repository thực hiện filter từ Prisma/MySQL nếu foundation đã sẵn sàng, hoặc từ seed/mock repository trong giai đoạn rebuild. Dù storage nào, response trả camelCase public fields và canonical shape `{ success: true, data: { items, pagination } }`.

**Frontend Strategy**:

Frontend giữ route `/events`. Filter UI là một phần của `EventListPage`, có thể là `EventFilterPanel` hoặc `EventFilterBar`, dùng chung query state với UC10 search. Khi filter thay đổi, reset `page` về 1; khi pagination thay đổi, preserve active filters và `keyword`. Clear/reset filters xóa filter params và quay về base list của UC08 nếu `keyword` rỗng, hoặc giữ search result hiện tại nếu `keyword` còn active.

Frontend gọi `eventApi.listEvents(query)` với các params canonical, hiển thị loading khi request pending, empty state khi `data.items` rỗng, error state khi request fail, và tiếp tục render event result bằng `EventCard`/EventList foundation của UC08. Link `View Detail` vẫn đi tới `/events/:id`; UC11 không render full detail và không render Apply submission.

**Testing Strategy**:

Backend/API verification cần cover:

- `GET /api/v1/events?categoryId=...` trả matching public events.
- `GET /api/v1/events?skillId=...` trả matching public events khi EventSkill/data hỗ trợ.
- `GET /api/v1/events?organizationId=...` trả matching public events.
- `GET /api/v1/events?location=...` trả matching public events.
- `GET /api/v1/events?startDate=...&endDate=...` trả events trong date range hợp lệ.
- `GET /api/v1/events?availability=AVAILABLE` và `FULL` hoạt động theo `remainingSlots`.
- Multiple filters và `keyword` combine bằng AND logic.
- Non-public events (`DRAFT`, `COMPLETED`, `CANCELLED`, inactive/soft-deleted) không xuất hiện.
- Empty result trả `{ success: true, data: { items: [], pagination: {} } }`.
- Invalid filter query trả `422`.
- Pagination vẫn hoạt động với filters và `keyword`.

Frontend/manual verification cần cover:

- Mở `/events`, filter UI xuất hiện trên cùng Event List page.
- Chọn filter, submit/apply filter, results update, loading/empty/error states hoạt động.
- Filter thay đổi reset page về 1; đổi page giữ active filters.
- Clear/reset filter hoạt động; nếu `keyword` đang active thì vẫn giữ keyword.
- `View Detail` link vẫn là `/events/:id`.
- Không tạo hoặc navigate tới `/events/filter`, `/events/search`, `/events/:id/apply`.
- `/events`, `/`, `/login` không bị phá bởi public filter flow.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SDD Pha 2 - Plan only**: Pass. Tài liệu này chỉ lập kế hoạch, không viết source code, không tạo migration, không tạo tasks.
- **Spec/Plan source of truth**: Pass. Plan dựa trên UC11 `context.md`, `spec.md`, `API_CONTRACTS.md`, `DATABASE.md`, `CROSS_DEPENDENCIES.md`, `CONSTITUTION.md`.
- **Layered Architecture**: Pass. Backend strategy giữ `Route -> Validator -> Controller -> Service -> Repository -> Seed/DB`; business/public visibility/filter logic thuộc Service/Repository, không nhồi vào Controller.
- **Input Validation**: Pass. Query params phải validate bằng Zod hoặc validation pattern final của backend trước khi query repository.
- **Auth & Public Access**: Pass. `GET /events` cho UC11 là public, không gắn `authenticate` middleware chỉ để filter public events.
- **Response Contract**: Pass. Plan dùng canonical paginated response `{ success: true, data: { items: [], pagination: {} } }`.
- **Module Boundaries**: Pass. UC11 consume EventService/filter contract; Category/Skill/Organization data là dependency từ module khác, không import repository trực tiếp của module khác.
- **Soft Delete/Public Visibility**: Pass. Backend phải lọc `status = PUBLISHED`, active, không soft-deleted.
- **Scope Guard**: Pass. UC11 không mở rộng sang UC09 detail content, UC10 search implementation đầy đủ, UC12 Apply Event, hoặc Staff CRUD.

Template conflict note: user yêu cầu dùng spec-kit plan template; nếu Constitution có format khác, plan này vẫn giữ spec-kit structure nhưng các gate của Constitution vẫn được kiểm tra trong section Constitution Check.

## Project Structure

### Documentation (this feature)

```text
.sdd/NamLD/UC11-feat-event-filter/
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
        `-- event-filter.test.js

frontend/
|-- src/
|   |-- components/
|   |   |-- pages/
|   |   |   `-- EventListPage.jsx
|   |   `-- events/
|   |       |-- EventFilterPanel.jsx
|   |       |-- EventSearchBar.jsx
|   |       |-- EventList.jsx
|   |       |-- EventCard.jsx
|   |       |-- EventListState.jsx
|   |       `-- EventPagination.jsx
|   |-- api/
|   |   `-- eventApi.js
|   `-- utils/
|       `-- eventQuery.js
```

**Structure Decision**: UC11 thuộc web application structure hiện có gồm `backend/` và `frontend/`. Implementation phase phải reuse UC08/UC10 Event List foundation thay vì tạo page/endpoint riêng. Nếu các file foundation đã tồn tại với tên khác, follow repo convention thật; nếu chưa có, tasks phase mới quyết định file cụ thể.

## Complexity Tracking

Không có constitution violation cần justify.

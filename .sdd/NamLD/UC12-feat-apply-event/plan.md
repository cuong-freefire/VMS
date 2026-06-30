# Plan: UC12 - Apply Event

## 1. Overview

UC12 - Apply Event cho phep authenticated Volunteer gui don dang ky tham gia mot public event. UC12 bat dau tu Event Detail page `/events/:id`, nhung viec xem Event Detail van la public behavior cua UC09.

Tu UC12 tro di, Volunteer application phai duoc luu bang database that:

```txt
Database: MySQL
ORM: Prisma
```

UC12 khong duoc dung mock-only application storage vi application la transactional data va can duoc Staff xu ly trong cac UC sau. Plan nay chi lap ke hoach; khong generate code, khong tao `tasks.md`, khong tao Prisma schema, khong cai package, khong tao hoac chay migration.

## 2. Current Context

NamLD da co Event Discovery foundation:

- UC08/UC10/UC11 dung chung route frontend `/events`.
- UC09 dung route frontend `/events/:id`.
- Backend runtime endpoints hien co:
  - `GET http://localhost:5000/api/v1/events`
  - `GET http://localhost:5000/api/v1/events/:id`
- Current backend event discovery dang dung seed/mock data:
  - `backend/src/seeds/event.seed.js`
  - `backend/src/repositories/event.repository.js`
- UC12 la use case dau tien yeu cau application duoc luu that vao MySQL.

Docs da review:

- `.sdd/NamLD/UC12-feat-apply-event/context.md`
- `.sdd/NamLD/UC12-feat-apply-event/spec.md`
- `.sdd/NamLD/UC09-feat-event-detail/plan.md`
- `.sdd/NamLD/UC09-feat-event-detail/tasks.md`
- UC08/UC10/UC11 plan/tasks
- `API_CONTRACTS.md`
- `DATABASE.md`
- `CROSS_DEPENDENCIES.md`
- `CONSTITUTION.md`
- `AGENTS.md`
- `CLAUDE.md`

Current repo inspection for Prisma/MySQL readiness:

- `backend/prisma` does not exist yet.
- `backend/prisma/schema.prisma` does not exist yet.
- `backend/prisma/migrations` does not exist yet.
- `backend/package.json` does not list `prisma` or `@prisma/client`.
- `backend/src/config/prisma.js` or `backend/src/config/prisma.client.js` does not exist yet.
- `backend/.env.example` currently has no `DATABASE_URL` placeholder found during inspection.
- `backend/.env` exists locally, but plan must not read, expose, commit, or hardcode real credentials.

Important doc alignment:

- `API_CONTRACTS.md` defines canonical UC12 endpoint as `POST /events/:eventId/applications`.
- `API_CONTRACTS.md` success shape uses direct `data` with `applicationId`, `event`, `volunteerId`, `status`, `message`, and `createdAt`.
- The proposal in the request that wraps `data.application` is not canonical because contract already defines a different shape. UC12 implementation should follow `API_CONTRACTS.md` unless team updates it first.
- UC12 `spec.md` says database schema design/API endpoint contract are out of scope for the spec document. This plan can still reference existing `DATABASE.md` and `API_CONTRACTS.md` as implementation sources of truth, but must not generate schema/migration in the plan phase.

## 3. Scope

In scope for UC12 planning:

- Add Apply action entry from Event Detail page `/events/:id`.
- Keep Event Detail public.
- Require login only when user attempts to apply.
- Authenticated user must have role `VOLUNTEER`.
- Add backend protected endpoint relative to `/api/v1`:

```http
POST /events/:eventId/applications
```

- Runtime endpoint:

```http
POST http://localhost:5000/api/v1/events/:eventId/applications
```

- Validate `eventId` as positive integer.
- Validate optional `message` with max length 1000 characters per `API_CONTRACTS.md`.
- Create an `applications` record with initial status `PENDING`.
- Enforce one application per Volunteer per Event.
- Enforce event visibility, status, active flag, soft delete, capacity, deadline, and role rules in backend service/repository.
- Plan Prisma/MySQL foundation needed for real application persistence.
- Use standard API response format:

```json
{
  "success": true,
  "data": {}
}
```

## 4. Out of Scope

UC12 must not implement:

- UC13 View Applied Events.
- UC14 Cancel Application.
- UC48 Submit Feedback.
- UC51 View Certificates.
- UC52 Download Certificate.
- UC22/UC23/UC24/UC25 Staff Application Management.
- Attendance check-in.
- Certificate generation.
- Event CRUD.
- Category/Skill/Organization CRUD.
- New Event Discovery endpoints.
- `/events/search`.
- `/events/filter`.
- `/events/:id/apply` deprecated alias.
- `GET /applications/my` deprecated alias.
- Prisma schema generation in this plan step.
- Migration creation or migration execution in this plan step.
- Frontend/backend source code changes in this plan step.
- Hardcoded MySQL username/password in docs or source code.

## 5. Route and API Decision

Frontend entry point:

```txt
/events/:id
```

Backend canonical path relative to base URL `http://localhost:5000/api/v1`:

```http
POST /events/:eventId/applications
```

Runtime endpoint:

```http
POST http://localhost:5000/api/v1/events/:eventId/applications
```

Frontend API base URL decision:

```txt
REACT_APP_API_BASE_URL=http://localhost:5000/api/v1
```

Therefore frontend application API should call relative path:

```txt
/events/${eventId}/applications
```

Do not call:

- `/api/events/:eventId/applications`
- `/api/v1/events/:eventId/applications` from a client whose base URL already includes `/api/v1`
- `/api/v1/api/events/:eventId/applications`
- `/events/:id/apply`

Auth decision:

- `GET /events/:id` remains public for UC09.
- `POST /events/:eventId/applications` is protected.
- Guest request to apply returns `401`.
- Authenticated non-Volunteer returns `403`.

## 6. Database and Prisma Plan

UC12 must use MySQL + Prisma for real persistence. Current seed/mock event data is acceptable for UC08-UC11/UC09 discovery already implemented, but UC12 application creation must not use mock-only storage.

Local environment decision:

```txt
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=VMS_Nemankem
```

Expected local `.env` placeholder format:

```env
DATABASE_URL="mysql://<MYSQL_USER>:<MYSQL_PASSWORD>@<MYSQL_HOST>:<MYSQL_PORT>/<MYSQL_DATABASE>"
```

Rules:

- Real MySQL username/password must be local only.
- Do not write real password into docs/source code.
- Do not commit `.env`.
- `.env.example` may be updated during implementation with placeholder only if the team approves that task.

Implementation phase should add or confirm:

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/`
- Prisma dependency: `prisma`
- Prisma runtime client dependency: `@prisma/client`
- Prisma client config file such as `backend/src/config/prisma.js` or `backend/src/config/prisma.client.js`
- `DATABASE_URL` in local `.env`
- Placeholder `DATABASE_URL` in `.env.example` if needed

Minimum models needed for UC12:

- `User`
- `Event`
- `Application`

However, `DATABASE.md` is the schema source of truth and already defines the broader physical schema. UC12 implementation should align with these tables:

- `users`
- `roles`
- `events`
- `applications`
- optional `application_status_history` if status history is required at create time

`applications` required fields from `DATABASE.md`:

- `id`
- `user_id`
- `event_id`
- `status`
- `message`
- `processed_by`
- `processed_at`
- `created_at`
- `updated_at`

Required constraints/indexes:

- `UNIQUE (user_id, event_id)` to prevent duplicate apply.
- `INDEX (user_id, status)`.
- `INDEX (event_id, status)`.
- Foreign keys to `users.id` and `events.id`.

Application status enum:

```txt
PENDING
APPROVED
REJECTED
CANCELLED
```

Event status enum:

```txt
DRAFT
PUBLISHED
IN_PROGRESS
COMPLETED
CANCELLED
```

UC12 create behavior:

- New application status must be `PENDING`.
- `processed_by` and `processed_at` remain null.
- `message` is optional and trimmed.
- `user_id` must come from authenticated JWT user, never from request body.
- `event_id` must come from validated path param.

Concurrency note:

- Duplicate prevention relies on composite unique constraint.
- Capacity should be checked inside service/repository transaction where possible.
- `approved_participants` is incremented only when Staff approves, not when Volunteer applies in UC12.

## 7. Backend Plan

Backend layer flow:

```txt
Route -> Auth Middleware -> Validator -> Controller -> Service -> Repository -> Prisma/MySQL
```

Planned backend responsibilities for implementation phase:

- Route:
  - Register `POST /events/:eventId/applications` under existing `/api/v1/events` route mount.
  - Use `authenticate`.
  - Use `authorize(['VOLUNTEER'])` or equivalent role guard.
  - Do not create deprecated `POST /events/:id/apply`.

- Validator:
  - Validate `eventId` as positive integer.
  - Validate request body `message` as optional string, trim, max 1000 chars.
  - Reject invalid input with `422` according to UC12 contract.

- Controller:
  - Read `req.user.id` and validated `eventId`/`message`.
  - Call `ApplicationService.applyToEvent(userId, eventId, message)`.
  - Return standardized response.
  - Keep business rules out of controller.

- Service:
  - Confirm user is active and role is `VOLUNTEER`.
  - Confirm event exists.
  - Confirm event is public/discoverable.
  - Confirm event `status = PUBLISHED`.
  - Confirm event `is_active = true`.
  - Confirm event is not soft-deleted.
  - Confirm application deadline has not passed.
  - Confirm remaining slots are available.
  - Confirm the user has not already applied.
  - Create application with status `PENDING`.
  - Handle race conditions by relying on transaction/unique constraint and mapping duplicate to `409`.

- Repository:
  - Use Prisma Client only for database access.
  - Query users/events/applications by selected fields.
  - Create `applications` row.
  - Use composite unique where possible.
  - Do not read/write another module repository directly; use service contracts where cross-module logic is needed.

- Response:
  - Follow `API_CONTRACTS.md` canonical shape.
  - Do not return password/token/internal audit fields.

Do not implement cancel/list application in UC12.

## 8. Frontend Plan

Frontend integration starts from UC09 Event Detail:

```txt
/events/:id
```

Planned frontend responsibilities for implementation phase:

- Keep Event Detail page public.
- Add Apply action on Event Detail page.
- Determine current auth state from existing auth context/service.
- Guest clicking Apply:
  - show login-required message or navigate to login flow.
  - do not call application API without auth.
- Authenticated Volunteer:
  - can open apply confirmation/form.
  - can submit optional message if the UI includes this field.
  - calls `POST /events/${eventId}/applications` through API client.
  - disables submit while request is pending.
  - shows success state after apply.
- Authenticated non-Volunteer:
  - shows forbidden-role message or disabled apply state.
  - backend still enforces `403`.

Expected frontend states:

- idle/ready
- login required
- submitting
- success
- already applied
- event full
- deadline passed
- forbidden role
- event unavailable/not found
- generic system error

Frontend must not:

- implement Applied Events list.
- implement Cancel Application.
- implement Staff approval/rejection.
- rely only on frontend eligibility.
- change UC09 detail response shape.

## 9. Validation and Business Rules

Volunteer can apply only when all conditions are true:

```txt
event exists
event is public/discoverable
event status = PUBLISHED
event isActive = true
event is not soft-deleted
remainingSlots > 0
current time <= applicationDeadline
user is authenticated
user role is VOLUNTEER
user account is active
user has not already applied to the same event
```

Do not allow apply when:

```txt
event missing
event non-public
event DRAFT / IN_PROGRESS / COMPLETED / CANCELLED
event inactive / soft-deleted
event full
deadline passed
user not logged in
user role is not VOLUNTEER
user already applied
```

Create application:

```txt
status = PENDING
```

HTTP/error mapping planned from `API_CONTRACTS.md`:

- `401`: unauthenticated.
- `403`: authenticated user is not a Volunteer.
- `404`: event not found or not available.
- `409`: already applied.
- `409`: event full.
- `409`: deadline passed.
- `409`: event not open for application.
- `422`: validation error.

## 10. Auth and Security

Security rules:

- UC12 is not public.
- Guest is not a database role.
- Database roles remain `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`.
- User identity must come from JWT/cookie middleware.
- Never accept `userId` or `volunteerId` from request body.
- Protected endpoint must use current auth middleware if it is stable.
- If existing auth system is mock or incomplete, implementation task must record the risk and use the closest existing middleware contract without weakening backend checks.
- Application ownership is current user only.
- Do not expose other volunteers' application data in UC12.
- Do not expose password hashes, tokens, session ids, or credentials.
- Do not show session-expired popup for public UC09 detail fetch; only the apply request is authenticated.
- Audit log/status history should be considered for application create if team requires immutable status trace from `NULL -> PENDING`.

Need clarification:

- Whether creating initial `PENDING` application must also create an `application_status_history` row.
- Whether Volunteer must have verified email before apply.

## 11. Data and Response Shape

Canonical success response from `API_CONTRACTS.md`:

```json
{
  "success": true,
  "data": {
    "applicationId": 42,
    "event": {
      "id": 1,
      "title": "Clean Beach Campaign",
      "startDate": "2026-07-01T08:00:00Z",
      "location": "Vung Tau Beach"
    },
    "volunteerId": 5,
    "status": "PENDING",
    "message": "I want to join and support this event.",
    "createdAt": "2026-06-28T10:00:00Z"
  }
}
```

Canonical request body:

```json
{
  "message": "I want to join and support this event."
}
```

Validation:

- `message` optional.
- max length: 1000 chars.
- maps to `applications.message`.

Do not use non-canonical wrapper:

```txt
data.application
```

unless `API_CONTRACTS.md` is updated by the team first.

Date/time:

- API dates should use ISO 8601.
- Deadline comparison should be done server-side using consistent timezone handling.
- Need clarification: server timezone and whether DB `DATETIME` should be treated as UTC or local time.

## 12. Integration with UC09

UC09 remains public:

```txt
Viewing event detail is public.
Applying to event requires login and Volunteer role.
```

Integration flow:

```txt
Guest/Volunteer opens /events/:id
-> UC09 loads public detail using GET /events/:id
-> user clicks Apply
-> if Guest: prompt/login flow, no application created
-> if authenticated non-Volunteer: forbidden message
-> if authenticated Volunteer: submit POST /events/:eventId/applications
-> backend creates PENDING application if eligible
-> frontend shows success state and optional link to UC13 later
```

UC12 must not make `/events/:id` protected. Only the apply action/API is protected.

UC12 should not change UC09 detail response shape. If apply eligibility display fields such as `canApply` or `applyDisabledReason` are needed later, they must be confirmed in API contract first.

## 13. Testing Strategy

Backend tests:

- Guest apply returns `401`.
- Non-Volunteer apply returns `403`.
- Volunteer apply valid event returns `201` success.
- Invalid `eventId` returns `422`.
- Missing event returns `404`.
- Non-public event returns `404`.
- Draft/in-progress/completed/cancelled event is rejected.
- Inactive/soft-deleted event is rejected.
- Full event returns `409`.
- Deadline passed returns `409`.
- Duplicate application returns `409`.
- Application is created with `PENDING`.
- Application stores current authenticated user id, not request body user id.
- Optional message is trimmed and stored.
- Overlong message returns `422`.
- Composite unique `(user_id, event_id)` prevents race duplicates.

Frontend tests:

- Apply button/action visible on Event Detail.
- Detail page remains public for Guest.
- Guest click Apply prompts login or navigates to login.
- Volunteer submit sends `POST /events/:eventId/applications`.
- Submit button is disabled while submitting.
- Success message appears after apply.
- Already applied error appears.
- Full event error appears.
- Deadline passed error appears.
- Forbidden role handled.
- Event unavailable handled.
- No Applied Events list is implemented in UC12.
- No Cancel Application behavior is implemented in UC12.

Manual verification:

```txt
Open /events/:id as Guest
Click Apply
Login as Volunteer
Apply to event
Confirm application saved in DB
Try applying same event again
Try full event
Try event with passed deadline
Confirm UC09 detail still public
Confirm /events, /login, and / still work
```

## 14. Risks and Fallbacks

Risks:

- Prisma/MySQL foundation is not present in the current backend repo.
- `backend/package.json` does not include `prisma` or `@prisma/client` yet.
- `backend/.env.example` does not currently expose a `DATABASE_URL` placeholder.
- Current Event Discovery backend uses seed/mock event repository; UC12 needs real DB for application persistence.
- Existing auth middleware may be simplified/mock and may not fully support HttpOnly cookie session behavior from docs.
- `DATABASE.md` says `applications` owner is Member 3, while `CROSS_DEPENDENCIES.md` says NamLD owns Volunteer-facing `ApplicationService`. Implementation should respect service contracts and avoid direct cross-module repository coupling.
- Capacity/deadline checks can race if not done inside transaction or if event data remains mock.
- Date/time comparison can be wrong if DB `DATETIME` timezone is unclear.
- `.env` exists locally; team must ensure real credentials are never committed.

Fallbacks:

- If Prisma foundation is not ready, UC12 implementation should first create approved Prisma/MySQL foundation tasks before feature logic.
- If auth middleware is incomplete, do not bypass backend auth; record blocker and align with Member 1.
- If EventService is still mock-only, UC12 should not create mock applications as final behavior. It may use a temporary integration adapter only if clearly marked non-final and not used as production persistence.
- If filter/list/detail still use seed data, application creation must still persist to MySQL and should validate event eligibility against the authoritative event table once migration exists.
- If optional message is not desired by UI, backend can accept empty/omitted message because the contract marks it optional.

Need clarification:

- Should UC12 create initial `application_status_history` record?
- Should email verification be required before apply?
- What exact timezone rule should be used for `application_deadline`?
- Should successful apply link to UC13 now, or only show success until UC13 exists?

## 15. Implementation Readiness Checklist

- [x] UC12 context and spec exist.
- [x] UC09 Event Detail route `/events/:id` is the planned frontend entry.
- [x] UC09 remains public.
- [x] Canonical backend path is `POST /events/:eventId/applications`.
- [x] Runtime endpoint is `POST /api/v1/events/:eventId/applications`.
- [x] Auth required: authenticated `VOLUNTEER`.
- [x] Guest maps to `401`; Guest is not a DB role.
- [x] Non-Volunteer maps to `403`.
- [x] New application status is `PENDING`.
- [x] Duplicate application blocked by `UNIQUE (user_id, event_id)`.
- [x] `message` is optional max 1000 chars per API contract.
- [x] UC12 does not implement UC13/UC14/UC48/UC51/UC52.
- [x] UC12 does not use deprecated `POST /events/:id/apply`.
- [x] UC12 does not create `/events/search` or `/events/filter`.
- [x] Plan confirms MySQL + Prisma are required from UC12 onward.
- [x] Plan confirms no Prisma schema/migration/package install is performed in this step.
- [x] Plan confirms no real MySQL credentials are written into docs/source code.
- [x] Current repo Prisma gaps are identified.
- [ ] Local MySQL database `VMS_Nemankem` exists.
- [ ] Local `DATABASE_URL` is configured in `.env`.
- [ ] Team confirms whether `.env` is safely ignored before adding credentials.
- [ ] Team confirms whether initial status history is required.
- [ ] Team confirms deadline timezone rule.

Ready for UC12 tasks: Yes, after team confirms the open setup/security questions above. The next step can create `tasks.md` that first handles Prisma/MySQL foundation readiness, then backend apply API, then Event Detail Apply UI.

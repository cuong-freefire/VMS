# CLAUDE.md - Online Course Platform (OCP)
# Version: 5.0 | Updated: 2026-06-18 | Scope: 66 APIs, 5 Members, E1-E4 Architecture Fixes

This file is the project-wide memory for agents working on OCP. It defines the shared architecture, stack, domain boundaries, conventions, and workflow rules that apply to every feature.

Feature-specific details must live next to the feature artifacts, for example:

```text
.sdd/specs/001-auth/PROJECT_AGENTS.md
```

If a feature-local file exists, read it after this file and before implementation. Feature-local files may add stricter rules for that feature, but they must not weaken the global rules here or in `AGENTS.md`.

---

## TL;DR

> Project: Online Course Platform (OCP)
> Backend: NodeJS + JavaScript ESM + Express-style REST API + Prisma + MySQL
> Frontend: React + JSX + Bootstrap + Create React App (`react-scripts`)
> Auth: JWT in httpOnly cookies + bcrypt
> Payment: VNPAY
> Validation: Zod
> Package manager: npm
> Rule: Backend is the source of truth for identity, role, userId, payment status, enrollment, and course access.

Read first:

1. `AGENTS.md` - mandatory project rules and safety constraints
2. `CLAUDE.md` - this project-wide context
3. `DATABASE.md` - schema ownership and database constraints
4. `share_context.md` - project flow, module ownership, and cross-module contracts
5. `API_CATALOG.md` - 66 APIs reference per member (A-E)
6. `.sdd/specs/<feature>/PROJECT_AGENTS.md` - feature-local guidance if present
7. `.sdd/specs/<feature>/spec.md`, `plan.md`, `tasks.md` - generated feature artifacts
8. `frontend/DESIGN.md` - binding frontend visual/UX contract when editing frontend

Do not implement from stale or empty generated artifacts. If a feature directory is empty or marked reset, regenerate context/spec/plan/tasks through the approved workflow before implementation.

---

## System Architecture

```text
Browser / React CRA
  |
  | credentials: include
  v
Backend REST API
  |
  | Route -> Middleware -> Controller -> Service -> Repository
  v
Prisma -> MySQL
```

Backend layering is mandatory:

```text
Route
  Defines endpoint and attaches middleware.

Middleware
  Handles validation, authentication, authorization, and request context.

Controller
  Reads request data, calls service, returns response.
  No business logic.

Service
  Owns business rules and module orchestration.
  Does not import Prisma directly.

Repository
  Owns database access and Prisma calls.

Prisma/MySQL
  Persists project data.
```

Cross-module access must use the owning module service/contract. Do not directly query tables owned by another module from an unrelated module service.

---

## Strict Stack

Backend:

- NodeJS
- JavaScript ESM (`"type": "module"`)
- Express-style REST API
- Prisma
- MySQL
- Zod validation
- bcrypt for local passwords
- JWT in httpOnly cookies
- npm

Frontend:

- React
- JSX
- Bootstrap
- Create React App (`react-scripts`)
- CRA env variables with `REACT_APP_`
- npm

Testing baseline:

- Backend: `node:test` + `assert` + `supertest`
- Frontend: `node:test` for API client/source-rule tests

Authentication:

- User auth: JWT in httpOnly cookies (MANDATORY)
- Exception: Internal APIs require Bearer SERVICE_TOKEN for server-to-server calls (E4.1)

Code Style:

- Backend & Frontend: Use function-based components and services ONLY
- FORBIDDEN: class components, class services, class repositories
- Favor functional programming: pure functions, immutability, composition

Do not switch to TypeScript, CommonJS, Vite, Next.js, another ORM, another database, another payment gateway, or Bearer-token auth for user authentication unless a human explicitly approves it.

---

## Repository Structure

Expected root structure:

```text
backend/
  package.json
  src/
    api/
    controllers/
    services/
    repositories/
    middlewares/
    validators/
    utils/
    config/
  prisma/
    schema.prisma
    migrations/
  tests/

frontend/
  package.json
  public/
    index.html
  src/
    api/
    components/
    pages/
    routes/
    layouts/
    hooks/
    utils/
  tests/

.sdd/
  specs/
    <feature>/
      context.md
      spec.md
      plan.md
      tasks.md
      PROJECT_AGENTS.md  # optional feature-local context
```

---

## Module Ownership

| Module | Owner | Rule |
| --- | --- | --- |
| Auth + Email + Profile | Member 1 - CuongLH | Other modules consume Auth/User contracts and do not parse JWT or own email verification |
| Mentor Course Studio + Revision | Member 2 - Nam | Other modules use canEditCourse() contract for approval flow |
| Payment + Enrollment + Catalog | Member 3 - TienTD  | Owns payments, orders, enrollments, course catalog, and enrollment-based access |
| Learning + Quiz + Rating | Member 4 - Duc | Uses EnrollmentService contract via DI and does not read payments directly |
| Manager Approval + Admin | Member 5 - AnhND | Approves/rejects courses, manages users, generates reports via approved contracts |

Backend remains the source of truth for:

- identity
- role
- userId
- account status
- session validity
- payment status
- enrollment
- course access

Frontend guards are UX only.

---

## Global Domain Rules

### Auth And Identity

1. JWT is stored only in httpOnly cookies.
2. Backend reads tokens from `req.cookies`.
3. Frontend sends cookie requests with credentials enabled.
4. Passwords must be hashed with bcrypt.
5. Google OAuth must be verified by backend before create/link user.
6. Raw Google `id_token`, `access_token`, and `refresh_token` must not be stored or logged.
7. Auth email delivery uses configured SMTP/Nodemailer and must fail safely when unavailable.
8. Frontend must not store JWT in `localStorage` or `sessionStorage`.
9. Frontend must not manually attach `Authorization: Bearer <token>`.

### Payment And Access

1. Paid courses unlock only after backend-verified successful payment and valid enrollment creation.
2. `PENDING` payment never grants course access.
3. Checkout amount must come from Course module authority, not frontend input.
4. VNPAY signed URL generation and signature verification happen only in backend.
5. VNPAY IPN/verification backend is source of truth for payment `SUCCESS` or `FAILED`.
6. Frontend VNPAY return is UX only and must not update payment, order, enrollment, or access state.
7. Payment and enrollment behavior must be idempotent and must not create duplicates for the same business operation.

### Course And Enrollment

1. Course inactive/deleted state must prevent selling or enrolling unless a spec explicitly says otherwise.
2. Enrollment uniqueness must prevent duplicate enrollment for the same `userId + courseId`.
3. Course access checks must use backend Access/Enrollment authority.

### Learning, Mentor, Admin, Reports

1. Learning features must not unlock content by directly reading payments.
2. Mentor review must use approved assignment/access contracts.
3. Admin and report features must not bypass module ownership to aggregate data.
4. Reports must use approved cross-module readers/adapters where defined by spec.

### Soft Delete And Audit

1. Important business data should be soft-deleted unless the current spec explicitly requires hard delete.
2. Do not delete generated migration history.
3. Preserve payment, enrollment, transaction, submission, and audit-relevant history.

---

## Environment Contracts

Use variable names from checked-in `.env.example` files only. Do not read, print, or commit real `.env` values.

Backend common variables include:

```text
PORT
API_PREFIX
FRONTEND_ORIGIN
DATABASE_URL
AUTH_SECRET
COOKIE_ACCESS_NAME
COOKIE_REFRESH_NAME
COOKIE_SAME_SITE
COOKIE_SECURE
JWT_ACCESS_EXPIRES_IN
JWT_REFRESH_EXPIRES_IN
BCRYPT_SALT_ROUNDS
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASS
SMTP_FROM_NAME
SMTP_FROM_EMAIL
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
```

Frontend variables:

```text
PORT
REACT_APP_API_BASE_URL
```

Do not invent alternate names such as `VITE_*`, `REACT_API_URL`, or Bearer-token related env vars.

---

## Frontend Rules

1. Frontend API calls go through `frontend/src/api`.
2. Use `REACT_APP_API_BASE_URL` for backend API base URL.
3. Cookie-auth requests must include browser credentials.
4. Frontend route guards and context state are UX only.
5. Frontend must not decide role, userId, payment status, enrollment, course access, amount, or price.
6. UI must follow `frontend/DESIGN.md` for the active feature.
7. Do not build marketing/landing pages when the task is to build a usable app workflow.

---

## Backend Rules

1. Controllers stay thin.
2. Services contain business logic.
3. Repositories own Prisma/database access.
4. Important body/query/params use Zod validation.
5. Errors use `{ success, message, code, details }` or the approved response helper.
6. Do not return raw stack traces, raw Prisma/SQL errors, secrets, JWTs, cookie values, passwords, hashes, or OTPs.
7. Do not log secrets or raw sensitive payloads.
8. Do not import Prisma in controllers or services.
9. Do not call another module repository directly from the current module service.
10. Backend MUST NOT handle file uploads (no multipart processing). Frontend MUST request signed URL from backend, then Direct Upload to Cloudinary (authenticated type only).
11. Cross-module communication MUST use Dependency Injection (DI pattern - E4.4). NEVER use HTTP fetch() for internal backend-to-backend calls.
12. Code must prioritize explicitness and readability: use clear variable/function names, keep logic flow straightforward, limit nesting to 3 levels max, avoid nested ternaries or cryptic one-liners.

---

## File Naming

Backend:

| Type | Pattern | Example |
| --- | --- | --- |
| Controller | `[feature].controller.js` | `auth.controller.js` |
| Service | `[feature].service.js` | `auth.service.js` |
| Repository | `[feature].repository.js` | `auth.repository.js` |
| Validator/schema | `[feature].validator.js` or `[feature].schema.js` | `auth.validator.js` |
| Middleware | `[feature].middleware.js` | `auth.middleware.js` |
| Config | `[provider].config.js` | `cors.config.js` |
| Utility | `[purpose].util.js` | `response.util.js` |

Frontend:

| Type | Pattern | Example |
| --- | --- | --- |
| Page/component | PascalCase `.jsx` | `CourseDetailPage.jsx` |
| Hook | camelCase `.js` | `useAuth.js` |
| API client | camelCase `.js` | `authApi.js` |
| Utility | camelCase `.js` | `formatCurrency.js` |

---

## Spec-Driven Workflow

Standard flow:

```text
1. Read AGENTS.md, CLAUDE.md, DATABASE.md, share_context.md
2. Read feature-local PROJECT_AGENTS.md if present
3. Read .sdd/specs/<feature>/context.md
4. Read .sdd/specs/<feature>/spec.md
5. Read .sdd/specs/<feature>/plan.md
6. Read .sdd/specs/<feature>/tasks.md
7. Implement only approved tasks/scope
8. Run relevant tests/builds
9. Update docs if behavior changes
```

If spec and code conflict, report the conflict before implementing. For high-risk domains such as auth, payment, enrollment, access, and database changes, read the relevant spec/module docs before editing.

---

## Testing Expectations

Test scope should scale with risk:

- Unit tests for service/business rules.
- Integration tests for changed endpoints.
- Source-rule tests for frontend security contracts when lightweight tests are enough.
- Happy path plus at least one meaningful error path for new/changed endpoints.

Run:

```powershell
npm test
npm run build
```

or narrower package commands when the change scope is isolated.

Do not add new test frameworks without approval.

---

## Git Rules

Branch naming:

```text
feat/[feature-name]
fix/[bug-name]
spec/[feature-name]
chore/[short-name]
```

Commit format:

```text
[type]([scope]): [description]
```

Rules:

- Do not commit directly to `main`, `master`, or `production`.
- Do not mix unrelated features.
- Do not edit generated migration history.
- Do not commit unrelated files.
- Reference relevant spec/task IDs when available.

---

## GitNexus And Impact Analysis

If GitNexus tooling is available:

- Run impact analysis before changing shared public contracts.
- Inspect usage before renaming/moving public routes, services, middleware, DTOs, or API clients.
- Warn if impact analysis returns HIGH or CRITICAL risk.

If unavailable:

- State that automated impact analysis cannot be run when the change is high impact.
- Continue with manual repository search using `rg`.

---

## Forbidden Patterns

- Bearer-token for user authentication (use httpOnly cookies instead). EXCEPTION: Bearer SERVICE_TOKEN is REQUIRED for Internal APIs (/internal/*) per E4.1.
- JWT in `localStorage` or `sessionStorage`.
- Backend handling multipart file uploads (use Cloudinary Direct Upload with signed URLs instead).
- HTTP fetch() for internal backend-to-backend calls (use Dependency Injection pattern - E4.4 instead).
- Frontend-decided amount, price, userId, role, payment status, enrollment, or course access.
- Prisma imports in controller/service.
- Direct cross-module repository calls.
- Raw secret/JWT/cookie/OTP/password/hash/OAuth token logging.
- Raw stack trace, Prisma raw error, SQL raw error, or secret in API responses.
- Duplicate enrollment for the same `userId + courseId`.
- Double-processing the same payment reference or transaction as successful.
- Out-of-scope feature implementation.
- Silently choosing when spec and code conflict.

---

## Current Feature Pointers

Auth feature-local context:

```text
.sdd/specs/001-auth/PROJECT_AGENTS.md
.sdd/specs/001-auth/
```

Approved workflow definitions:

```text
.specify/workflows/
```

Root docs:

```text
AGENTS.md
CLAUDE.md
DATABASE.md
constitution.md
share_context.md
frontend/DESIGN.md
```

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **VMS** (209 symbols, 283 relationships, 4 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/VMS/context` | Codebase overview, check index freshness |
| `gitnexus://repo/VMS/clusters` | All functional areas |
| `gitnexus://repo/VMS/processes` | All execution flows |
| `gitnexus://repo/VMS/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->

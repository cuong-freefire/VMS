<!--
Sync Impact Report
- Version change: 1.0.0 -> 1.1.0
- Modified principles:
  - I. Specification Before Implementation (clarified overview authority)
  - V. Team Ownership and Sustainable Scope (aligned with module assignments)
- Added principles:
  - VI. Role-Centered Product Integrity
- Added sections:
  - Project Scope Rules
- Removed sections: None.
- Templates reviewed:
  - REVIEWED .specify/templates/plan-template.md (Constitution Check provides the required gate)
  - REVIEWED .specify/templates/spec-template.md (supports clarification markers and testable requirements)
  - REVIEWED .specify/templates/tasks-template.md (subordinate to approved project/feature artifacts)
  - N/A .specify/templates/commands/*.md (directory not present)
  - REVIEWED AGENTS.md (already directs agents to the current plan)
- Follow-up TODOs:
  - Confirm the MVP boundary, especially donation/payment, email, certificates,
    notifications, and advanced reporting.
  - Resolve role inheritance and multi-role behavior.
  - Resolve event, application, attendance, feedback, and certificate lifecycle rules.
  - Approve technology choices, database design, and API contracts through the
    project-level specification and plan.
-->

# Volunteer Event Management System Constitution

## Core Principles

### I. Specification Before Implementation (NON-NEGOTIABLE)

The team MUST create and review project-level `spec.md`, `plan.md`, and `tasks.md`
before implementing any database schema, migration, API contract, or application
code. Feature work MUST follow the same sequence when feature-level artifacts are
required. Specifications MUST state business rules and acceptance scenarios;
plans MUST record architecture and technology decisions; tasks MUST be
dependency-ordered and traceable to approved requirements. Unclear business
rules MUST be clarified with the team or stakeholder and marked as unresolved
until answered. `docs/project-overview.md` is the primary project context but is
not an approved specification, design, database model, or API contract.
Implementation MUST NOT convert its suggestions or open questions into project
behavior without review in the appropriate downstream artifact.

Rationale: the database schema and API contracts are not finalized, so reviewed
requirements must lead design rather than implementation assumptions.

### II. Clear Architectural Boundaries

Frontend, backend, and shared code MUST occupy clearly separated top-level
projects or directories defined by the approved project plan. Frontend code MUST
contain presentation and client-side interaction concerns. Backend code MUST
contain business rules, persistence, authentication, authorization, and trusted
validation. Shared code MUST be limited to deliberately reusable,
platform-neutral definitions and MUST NOT become a miscellaneous dependency
bucket. Code MUST NOT import across these boundaries except through dependencies
and interfaces explicitly approved in the plan.

Rationale: explicit boundaries allow five team members to work concurrently
without coupling trusted server behavior to user-interface implementation.

### III. Secure by Design (NON-NEGOTIABLE)

Secrets, credentials, tokens, connection strings, and other security-sensitive
values MUST be supplied through environment variables or an approved secret
store and MUST NOT be committed to source control. Example environment files
MUST contain placeholders only. Passwords MUST never be stored or logged in
plain text; backend code MUST use an established adaptive password-hashing
algorithm selected in the approved plan. Authorization MUST be enforced by the
backend using explicit roles and permissions. Frontend visibility checks MAY
improve usability but MUST NOT be treated as authorization. All untrusted input
MUST be validated at the backend boundary, and errors or logs MUST NOT expose
secrets or sensitive personal data.

Rationale: volunteer and event records may contain personal data, and the
backend is the only trusted enforcement boundary.

### IV. Quality, Review, and Traceability

Code MUST be readable, consistently formatted, and free of unresolved warnings
introduced by the change. Each change MUST have a single clear purpose and MUST
trace to an approved task and requirement. Business logic MUST be separated
from transport, user-interface, and persistence details. Tests MUST cover
security rules, authorization, validation, core business rules, and defect
regressions at the appropriate unit, integration, or contract level. A change
MUST pass applicable automated checks and receive review from at least one team
member who did not author it before merge. Reviewers MUST verify acceptance
criteria, architectural boundaries, security, documentation, and test evidence.

Rationale: traceable, reviewed increments make defects easier to detect and
keep student-team integration manageable.

### V. Team Ownership and Sustainable Scope

The five-member team MUST maintain visible ownership for planned tasks while
retaining collective responsibility for the product. Work MUST be divided into
small, reviewable increments with dependencies and integration points recorded
in `tasks.md`. The module assignments in `docs/project-overview.md` are the
initial ownership baseline, but they do not grant exclusive ownership or permit
independent contract changes. Reassignment MUST be visible to the team. A member
MUST NOT silently change approved business rules, architecture, database design,
or API behavior; material changes require an artifact update and team review.
The team MUST prefer the simplest design that satisfies approved requirements
and MUST defer speculative features or abstractions. Blockers and conflicting
changes MUST be raised promptly.

Rationale: explicit ownership and controlled scope reduce merge conflicts,
knowledge silos, and unfinished work.

### VI. Role-Centered Product Integrity

The product MUST preserve explicit behavior and permission boundaries for Guest,
Volunteer, Staff, Manager, and Admin. Every protected user journey MUST identify
its permitted actors, preconditions, success result, denial behavior, and
relevant state transitions in the specification. Guest access MUST remain
public-only. Volunteer actions, staff event operations, management functions,
and system administration MUST not be conflated merely to simplify the user
interface. Multi-role behavior, role inheritance, and cross-role permissions
MUST remain unresolved until explicitly approved. The core volunteer lifecycle
from event discovery through application, review, attendance, feedback, and
certificate eligibility MUST remain internally consistent across modules.

Rationale: role and lifecycle consistency are central to both product correctness
and backend authorization.

## Project Scope Rules

- The project is a web-based Volunteer Event Management System serving the five
  roles defined in Principle VI.
- The fifteen modules and sixty-six use cases in `docs/project-overview.md`
  define candidate product scope, not a commitment that every item belongs in
  the MVP.
- The project-level specification MUST establish the MVP boundary before
  database or API planning. Donation/payment, real payment gateways, email,
  downloadable certificates, advanced notifications, and advanced reporting
  MUST be explicitly classified as included, deferred, mocked, or excluded.
- Business rules marked for clarification in `docs/project-overview.md` MUST
  remain unresolved in specifications until answered. This includes role
  inheritance, event and application statuses, deletion behavior, capacity and
  skills, cancellation, attendance method, feedback eligibility, certificate
  format, organization relationships, and payment mode.
- High-level data concepts in `docs/project-overview.md` MUST NOT be treated as
  tables, fields, relationships, constraints, or migration instructions.
- ReactJS, Bootstrap, Material UI, NodeJS, MySQL, JWT, Zod, Cloudinary, VNPay,
  MoMo, SMTP, and NodeMailer are candidate technologies. They become binding
  only when evaluated and approved in the project-level plan.
- Desktop web is the current product direction. Exact browser support,
  accessibility expectations, responsiveness, performance targets, and
  deployment environment MUST be defined in reviewed project artifacts.

## Engineering and Data Rules

- The project plan MUST define the concrete frontend, backend, shared, test, and
  documentation paths before implementation begins.
- Database technology, entities, fields, relationships, constraints, indexes,
  migration strategy, and seed data MUST be derived from reviewed requirements
  and an approved plan. `docs/project-overview.md` alone is not sufficient
  authority for any of these decisions.
- Database migrations MUST be versioned, deterministic, reviewable, and safe for
  the environments identified by the plan. Destructive or irreversible changes
  MUST include an approved migration and recovery strategy.
- Application code MUST access persistence through the backend boundary.
  Frontend code MUST NOT connect directly to the database.
- API resources, operations, request and response shapes, status codes, error
  behavior, authentication, authorization, and versioning MUST be documented in
  reviewed contracts before implementation. `docs/project-overview.md` alone is
  not sufficient authority for an API contract.
- Backend endpoints MUST validate inputs, enforce role-based authorization, use
  consistent error handling, and avoid exposing internal implementation details.
- Shared definitions MUST have a documented owner and consumer. Generated or
  duplicated contract types MUST follow the strategy approved in the plan.
- Technology choices MUST come from the current approved plan. Until then,
  agents and contributors MUST label them `NEEDS CLARIFICATION` rather than
  selecting a stack by assumption.

## Team Delivery Workflow

1. **Project definition**: maintain `docs/project-overview.md` as human-readable
   context, then create a project-level specification with scope, actors,
   business rules, user journeys, acceptance scenarios, and open questions.
2. **Clarification**: resolve material ambiguity before planning. Unresolved
   choices affecting data, APIs, security, permissions, or acceptance behavior
   block downstream design and implementation.
3. **Planning**: create and review the project-level plan, including technology,
   frontend/backend/shared boundaries, security approach, testing strategy,
   database-design process, and API-contract process.
4. **Tasking**: create and review dependency-ordered project tasks with owners or
   ownership areas suitable for five members. Database, contract, and code tasks
   MUST depend on the relevant approved design work.
5. **Feature delivery**: use branch-based, spec-driven increments. Keep the
   specification, plan, and tasks current when a change affects approved
   behavior or design.
6. **Verification**: run applicable formatting, static analysis, tests, and
   security checks. Record manual verification where automation is impractical.
7. **Review and merge**: merge only after artifact compliance, code review,
   automated checks, and acceptance evidence are complete.

Git branches MUST be short-lived and named consistently using the convention
selected by the team; feature branches SHOULD include the Spec Kit feature
identifier when one exists. Direct commits to the protected default branch are
prohibited. Commits MUST be focused and use descriptive imperative messages.
Pull requests MUST link the relevant spec and tasks, summarize behavior and
design changes, list verification performed, and identify schema, contract,
security, configuration, or documentation impacts. Authors MUST synchronize
with the target branch and resolve conflicts without discarding another
member's work.

Documentation is part of the deliverable. Requirements, plans, tasks, contracts,
setup instructions, environment-variable names, architectural decisions, and
user-visible behavior MUST be updated in the same change that makes them true.
Documentation MUST NOT contain real secrets, passwords, or personal data.
Completed work MUST not leave stale examples or contradictory guidance.

AI agents MAY assist with analysis, clarification, drafting artifacts, review,
tests, and implementation only within approved scope. Agents MUST read the
current constitution, project artifacts, and applicable instructions before
acting. Agents MUST NOT generate a database schema, migrations, API contracts,
or feature implementation code from `docs/project-overview.md` alone. They MUST
ask clarification questions when business rules are unclear and MUST not invent
roles, permissions, entities, relationships, fields, endpoints, or acceptance
behavior. Agent output MUST be reviewed by a team member; responsibility for
correctness, security, and authorship remains with the team. Agents MUST not
commit secrets, bypass review gates, or make unrelated repository changes.

## Governance

This constitution is the highest project-level development policy. When another
project document conflicts with it, this constitution controls until formally
amended. Specifications, plans, tasks, pull requests, and reviews MUST include
an explicit constitution compliance check.

An amendment requires a written proposal describing the change, rationale, and
affected artifacts. At least three of the five team members MUST approve an
amendment, and no unresolved security objection may be ignored. The amendment
MUST update dependent templates or record them as pending in the Sync Impact
Report. Material workflow or principle changes MUST include a transition plan
for in-progress work.

Constitution versions follow semantic versioning:

- **MAJOR**: removes or incompatibly redefines a principle or governance rule.
- **MINOR**: adds a principle or materially expands mandatory guidance.
- **PATCH**: clarifies wording without changing required behavior.

The team MUST review constitution compliance when approving project-level
specification, plan, and tasks; when reviewing every pull request; and before
each assessed release or demonstration. Violations MUST be corrected before
merge unless the constitution is amended through the process above. Complexity
or exceptions MUST be documented and justified in the applicable plan.

**Version**: 1.1.0 | **Ratified**: 2026-06-24 | **Last Amended**: 2026-06-24

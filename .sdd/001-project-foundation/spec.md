# Project Specification: Volunteer Event Management System

**Specification Directory**: `specs/001-project-foundation`

**Created**: 2026-06-24

**Status**: Draft for team review

**Scope Level**: Whole-project foundation

**Sources**:

- `docs/project-overview.md`
- `.specify/memory/constitution.md` version 1.1.0

## 1. Project Overview

The Volunteer Event Management System is a web-based product that connects
guests, volunteers, staff, managers, administrators, and organizations around
the complete volunteer-event lifecycle.

The product supports public event discovery, volunteer registration and
participation, staff event operations, management oversight, administration,
communications, certificates, reporting, and donation or payment activity.

This document defines the shared product foundation for the whole project. It
establishes common scope, actors, journeys, rules, quality expectations, and
open questions that affect multiple modules. It does not define database
structures, API contracts, routes, interface components, or implementation
tasks. Those decisions require a reviewed project plan and, where appropriate,
separate module specifications.

## 2. Product Goals

- Provide one coherent place for people to discover and participate in
  volunteer events.
- Enable volunteers to maintain relevant profiles and follow their participation
  from application through attendance, feedback, and certificate access.
- Enable staff to operate events, review applications, record attendance, and
  communicate with participants.
- Enable managers to maintain shared organizational and classification
  information and review operational outcomes.
- Enable administrators to oversee accounts, organizations, notifications,
  certificates, donations, reporting, and system-wide activity.
- Support trustworthy role-based access, privacy, clear user feedback, and
  traceable decisions across all modules.
- Give the five-member team a reviewed project foundation from which module
  specifications, planning, tasks, data design, and contracts can be created.

## 3. User Roles and Permission Overview

### Guest

A Guest is unauthenticated. A Guest MAY access public pages, browse public
events, view event details, register, and sign in. A Guest MUST NOT apply for an
event, access personal records, or use protected staff, manager, or
administrator functions.

### Volunteer

A Volunteer is authenticated and participates in events. A Volunteer MAY
maintain a profile and skills, discover events, apply, track or cancel eligible
applications, review attendance history, submit eligible feedback, access
certificates, receive notifications, and view personal donation history.

A Volunteer MUST NOT manage events, approve applications, administer other
users, manage organizations, or access management reporting solely by being a
Volunteer.

### Staff

Staff operate volunteer events. Staff MAY create and maintain events, review
applications, approve or reject applicants, manage attendance, generate
authorized certificates, and create event-related communications.

Staff MUST NOT receive system-wide account, organization, payment, or
administrative authority unless that authority is explicitly granted by an
approved role model.

### Manager

A Manager oversees operational reference data, people, organizations, and
reporting. A Manager MAY manage categories, skills, staff, organizations, and
the management information needed for statistics and reports.

Manager access MUST NOT automatically include volunteer actions, staff
operations, or low-level administration until role inheritance is clarified and
approved.

### Admin

An Admin performs system-level oversight. An Admin MAY manage accounts and
organizations, monitor dashboards and statistics, manage authorized
notifications, certificates, donations, and reports, and supervise
administrative data.

Admin inheritance of Manager or Staff actions remains a project-level open
question and MUST NOT be assumed.

### Shared Authorization Rule

Every protected capability MUST identify the permitted role or roles in its
module specification. Backend authorization MUST enforce those permissions.
Frontend visibility or navigation controls MUST NOT be the sole authorization
mechanism.

## 4. Finalized Team Assignment

This original official project overview assignment is the current source of
truth. Ownership identifies the primary coordination area; it does not permit
unilateral changes to shared rules, data concepts, or future contracts.

| Member | Module Area | Number of Screens |
|---|---|---:|
| Member 1 | Authentication + Profile | 8 |
| Member 2 | Volunteer Event Module | 7 |
| Member 3 | Staff Module | 7 |
| Member 4 | Manager Module | 10 |
| Member 5 | Admin Module | 14 |
| **Total** |  | **46** |

## 5. Confirmed Full Project Scope

The current full project scope contains all 15 modules, 66 use cases, and 46
screens defined below. No module is removed or deferred by this specification.
Release sequencing, mock-versus-live integration choices, and delivery-stage boundaries remain delivery decisions requiring clarification and planning.

Complexity alone does not place Donation and Payment, Email Services,
Certificate Management, Notification Management, or Reporting and Dashboard
outside the project scope.

### In Scope

- Authentication and account access
- Event discovery and management
- Volunteer profiles and skills
- Event applications and decisions
- User, category, skill, and organization management
- Notifications and email-supported communications
- Attendance and feedback
- Certificates
- Dashboards, statistics, and reports
- Donations and payment processing

### Outside This Specification

- Database tables, fields, keys, relationships, constraints, and migrations
- API resources, endpoints, payloads, response formats, and status codes
- Frontend or backend routes
- Interface designs and component definitions
- Technology and architecture selection
- Detailed module tasks or implementation sequencing

## 6. Functional Module Map

| # | Module | Purpose | Primary Actors | Use Cases |
|---:|---|---|---|---:|
| 1 | Authentication | Public entry, registration, sign-in, account access, and password flows | Guest and all authenticated roles | 7 |
| 2 | Event Management | Event discovery, application entry points, and staff event operations | Guest, Volunteer, Staff | 10 |
| 3 | Profile Management | Personal information, skills, and volunteer history | Volunteer and authenticated roles | 4 |
| 4 | Application Management | Staff review and decision-making for volunteer applications | Staff, Volunteer | 4 |
| 5 | User Management | Authorized account and user-information management | Manager, Admin | 5 |
| 6 | Category Management | Event classification management | Manager | 3 |
| 7 | Skill Management | Shared skill catalog and volunteer skill selection | Manager, Volunteer | 3 |
| 8 | Organization Management | Organization records and oversight | Manager, Admin | 4 |
| 9 | Notification Management | User notifications and authorized notification creation | Volunteer, Staff, Admin | 4 |
| 10 | Attendance Management | Participation attendance recording and history | Staff, Volunteer | 3 |
| 11 | Feedback Management | Volunteer feedback and authorized review | Volunteer, Staff, Admin | 3 |
| 12 | Certificate Management | Certificate generation, viewing, and download | Volunteer, Staff, Admin | 3 |
| 13 | Reporting and Dashboard | Operational visibility, statistics, and exports | Manager, Admin | 4 |
| 14 | Donation and Payment Gateway | Event donations, payment processing, history, and administration | Volunteer, Admin | 4 |
| 15 | Email Services | Verification, recovery, event, reminder, and certificate messages | System and affected users | 5 |

## 7. Use Case Map

### Authentication — UC01 to UC07

- UC01 — View Landing Page
- UC02 — View Home Page
- UC03 — Login
- UC04 — Register
- UC05 — Logout
- UC06 — Change Password
- UC07 — Forgot Password

### Event Management — UC08 to UC17

- UC08 — View Event List
- UC09 — View Event Detail
- UC10 — Search Event
- UC11 — Filter Event
- UC12 — Apply Event
- UC13 — View Applied Events
- UC14 — Cancel Application
- UC15 — Add Event
- UC16 — Edit Event
- UC17 — Delete Event

### Profile Management — UC18 to UC21

- UC18 — View Profile
- UC19 — Edit Profile
- UC20 — Edit Volunteer Skills
- UC21 — View Volunteer History

### Application Management — UC22 to UC25

- UC22 — View Application List
- UC23 — View Application Detail
- UC24 — Approve Application
- UC25 — Reject Application

### User Management — UC26 to UC30

- UC26 — View User List
- UC27 — View User Detail
- UC28 — Add User
- UC29 — Edit User
- UC30 — Filter User

### Category Management — UC31 to UC33

- UC31 — View Category List
- UC32 — Add Category
- UC33 — Edit Category

### Skill Management — UC34 to UC36

- UC34 — View Skill List
- UC35 — Add Skill
- UC36 — Edit Skill

### Organization Management — UC37 to UC40

- UC37 — View Organization List
- UC38 — View Organization Detail
- UC39 — Add Organization
- UC40 — Edit Organization

### Notification Management — UC41 to UC44

- UC41 — View Notifications
- UC42 — View Notification Detail
- UC43 — Mark Notification As Read
- UC44 — Create Notification

### Attendance Management — UC45 to UC47

- UC45 — Attendance Check
- UC46 — View Attendance List
- UC47 — View Attendance History

### Feedback Management — UC48 to UC50

- UC48 — Submit Feedback
- UC49 — View Feedback List
- UC50 — View Feedback Detail

### Certificate Management — UC51 to UC53

- UC51 — View Certificates
- UC52 — Download Certificate
- UC53 — Generate Certificate

### Reporting and Dashboard — UC54 to UC57

- UC54 — View Dashboard
- UC55 — Event Statistics
- UC56 — Volunteer Statistics
- UC57 — Export Reports

### Donation and Payment Gateway — UC58 to UC61

- UC58 — Donate To Event
- UC59 — Make Payment
- UC60 — View Donation History
- UC61 — Manage Donations

### Email Services — UC62 to UC66

- UC62 — Verify Email
- UC63 — Forgot Password Email
- UC64 — Event Approval Email
- UC65 — Event Reminder Email
- UC66 — Certificate Email

## 8. Screen List Overview

The project currently defines 46 screens.

| Area | Screens | Count |
|---|---|---:|
| Authentication | Landing Page; Login; Register; Forgot Password; Home Dashboard; Change Password | 6 |
| Event | Event List; Event Detail; Event Search & Filter; Applied Event List; Add Event; Edit Event | 6 |
| Profile | Profile; Edit Profile; Manage Skills; Volunteer History | 4 |
| Application | Application List; Application Detail; Approval Screen | 3 |
| User Management | User List; User Detail; Add User; Edit User | 4 |
| Category and Skill | Category List; Category Form; Skill List; Skill Form | 4 |
| Organization | Organization List; Organization Detail; Organization Form | 3 |
| Notification | Notification List; Notification Detail; Create Notification | 3 |
| Attendance | Attendance Management; Attendance History | 2 |
| Feedback | Feedback Form; Feedback List | 2 |
| Certificate | Certificate List; Certificate Detail | 2 |
| Reports | Dashboard; Event Statistics; Volunteer Statistics; Export Report | 4 |
| Donation | Donation Page; Payment Gateway; Donation History | 3 |
| **Total** |  | **46** |

Screen names establish product coverage, not final navigation, route, layout, or
component decisions.

## 9. Cross-Module User Journeys

### Journey 1 — Discover and Join an Event

A Guest discovers public events, creates and verifies an account when required,
completes a Volunteer profile, reviews event details, and submits an
application. The Volunteer can then track the application outcome.

Modules involved: Authentication, Event Management, Profile Management,
Application Management, Notification Management, and Email Services.

### Journey 2 — Operate an Event

Staff create and maintain an event, review Volunteer applications, communicate
decisions, and manage attendance. The journey must preserve the same event and
application meaning across all participating modules.

Modules involved: Event Management, Application Management, Attendance
Management, Notification Management, and Email Services.

### Journey 3 — Complete Volunteer Participation

After participation, attendance is reflected in the Volunteer history. An
eligible Volunteer can provide feedback and access any authorized certificate.

Modules involved: Attendance Management, Profile Management, Feedback
Management, Certificate Management, Notification Management, and Email
Services.

### Journey 4 — Govern Organizations and Operations

Authorized management users maintain organizations, staff, categories, and
skills, then use dashboards and reports to understand events and volunteer
activity.

Modules involved: User Management, Category Management, Skill Management,
Organization Management, Reporting and Dashboard.

### Journey 5 — Donate to an Event

An eligible user selects an event, initiates a donation, receives a clear
payment outcome, and can later review donation history. Authorized
administrators can oversee donation records.

Modules involved: Event Management, Donation and Payment Gateway, Notification
Management, Email Services, and Admin Management.

### Journey 6 — Recover Account Access

A user who cannot sign in requests account recovery, receives a time-sensitive
recovery communication, establishes new credentials, and regains appropriate
role-based access without exposing account secrets.

Modules involved: Authentication and Email Services.

## 10. Core Shared Business Rules

### Identity and Access

- Public content MUST be available without protected-role access.
- Protected capabilities MUST require an authenticated identity.
- Every authenticated identity MUST have at least one approved role assignment.
- Role permissions MUST be enforced by trusted backend behavior.
- Unauthorized attempts MUST be denied without disclosing protected data.
- Passwords MUST never be stored or displayed in plain text.
- Security-sensitive configuration MUST be kept outside source-controlled
  project content.

### Event and Application

- Guests and Volunteers MUST be able to view public events.
- A Volunteer MUST authenticate before applying.
- A Volunteer MUST NOT hold duplicate active applications for the same event.
- New applications MUST begin in a pending review state.
- Only authorized Staff MAY approve or reject applications.
- Event status, capacity, skill requirements, deletion behavior, and complete
  application transitions require clarification before module planning.

### Attendance, Feedback, and Certificates

- Attendance MUST be associated with event participation.
- Authorized Staff MUST control attendance records unless a future approved rule
  permits another method.
- Volunteers MUST be able to review their attendance history.
- Feedback MUST be associated with an event and its submitting Volunteer.
- Certificate access MUST depend on an approved eligibility rule connected to
  event completion and, if confirmed, attendance.
- Attendance method, feedback eligibility, certificate format, and regeneration
  behavior require clarification.

### Organizations and Shared Reference Data

- Organization, category, and skill information MUST be managed only by
  authorized roles.
- Event ownership and Staff-to-Organization relationships MUST be consistent
  across event, organization, reporting, and authorization behavior.
- Shared reference-data changes MUST not silently invalidate existing event or
  volunteer records.

### Communication

- Users MUST be able to distinguish unread and read in-product notifications.
- Only authorized roles MAY create or send operational notifications.
- Verification, recovery, approval, reminder, and certificate communications
  MUST correspond to valid system events.
- Failed external delivery MUST not falsely report a successful business action.

### Donation and Payment

- Donation and payment are part of the full product scope.
- Users MUST receive a clear success, pending, cancellation, or failure outcome
  for each payment attempt once the approved payment-state model is defined.
- Payment failure MUST NOT create a falsely completed donation.
- Donation history MUST be visible only to the donor and authorized
  administrators.
- Live, sandbox, or mocked payment operation remains unresolved.

### Validation and Traceability

- Important user input MUST be validated before processing.
- Significant application, attendance, certificate, notification, account, and
  donation decisions MUST be traceable for authorized review.
- User-facing errors MUST be understandable and MUST NOT expose secrets or
  sensitive internal details.

## 11. Project-Level Acceptance Scenarios

### Scenario A — Public and Protected Access

1. **Given** a Guest, **When** the Guest browses public events, **Then** public
   event information is available without protected data.
2. **Given** a Guest, **When** the Guest attempts a protected action, **Then**
   access is denied and sign-in guidance is provided.
3. **Given** an authenticated user without a required role, **When** the user
   attempts a restricted action, **Then** the action is denied regardless of
   whether a direct navigation attempt was used.

### Scenario B — Volunteer Participation Lifecycle

1. **Given** an eligible Volunteer and an available event, **When** the
   Volunteer applies, **Then** one pending application is created and is visible
   to both the Volunteer and authorized Staff.
2. **Given** an existing active application, **When** the Volunteer applies to
   the same event again, **Then** the duplicate attempt is rejected.
3. **Given** Staff records an application decision, **When** the Volunteer views
   applied events, **Then** the same decision is shown consistently.

### Scenario C — Event Completion

1. **Given** an approved participant, **When** authorized Staff records
   attendance, **Then** the attendance outcome appears consistently in Staff
   records and Volunteer history.
2. **Given** a Volunteer who satisfies the approved feedback rule, **When**
   feedback is submitted, **Then** authorized reviewers can access it.
3. **Given** a Volunteer who satisfies the approved certificate rule, **When**
   a certificate is generated, **Then** the Volunteer can view and download the
   authorized certificate.

### Scenario D — Management and Reporting

1. **Given** an authorized Manager or Admin, **When** shared management data is
   maintained, **Then** the change is reflected consistently wherever that data
   is used.
2. **Given** authorized reporting access, **When** a dashboard or report is
   requested, **Then** the result reflects the same underlying approved
   operational records and excludes unauthorized personal detail.

### Scenario E — Notifications and Email

1. **Given** a valid business event configured for communication, **When** the
   event occurs, **Then** the intended user receives the appropriate
   notification or the delivery failure is recorded without reversing the
   business event.
2. **Given** a user reads an in-product notification, **When** the notification
   list is viewed again, **Then** its read state is preserved.

### Scenario F — Donation and Payment

1. **Given** a user initiates a donation, **When** payment succeeds, **Then** one
   completed donation appears in the user's history and authorized
   administration view.
2. **Given** payment fails or is cancelled, **When** the outcome is returned,
   **Then** no completed donation is reported and the user receives a clear
   outcome.

### Scenario G — Cross-Module Security

1. **Given** any protected module, **When** access is attempted by an
   unauthorized role, **Then** protected information and actions remain
   unavailable.
2. **Given** sensitive credentials or configuration, **When** project artifacts
   are reviewed, **Then** no plain-text password or real secret is present.

## 12. High-Level Data Concepts

The following concepts describe business information only. They are not tables,
fields, documents, relationships, constraints, or migration instructions.

- **User**: a person with account identity and access status.
- **Role**: a named permission grouping such as Volunteer, Staff, Manager, or
  Admin.
- **Volunteer Profile**: volunteer-facing personal and participation context.
- **Staff Profile**: staff-facing operational identity context.
- **Event**: a volunteer opportunity presented and managed by authorized users.
- **Event Category**: classification used to organize and find events.
- **Skill**: a capability that may describe a Volunteer or event need.
- **Volunteer Skill**: a Volunteer's association with a skill concept.
- **Organization**: a group that creates, sponsors, supervises, or participates
  in volunteer events.
- **Event Application**: a Volunteer's request and decision history for an
  event.
- **Attendance**: participation presence or absence for an event.
- **Feedback**: a Volunteer's response concerning an event experience.
- **Certificate**: recognition associated with eligible participation.
- **Notification**: an in-product communication for a user.
- **Donation**: a user's contribution associated with an event or supported
  purpose.
- **Payment Transaction**: the business outcome of an attempted payment.
- **Email Verification**: proof workflow for control of an email address.
- **Password Reset**: a time-limited account-recovery process.
- **Report**: an authorized summary or export of project activity.

Future module specifications MAY refine the meaning of these concepts but MUST
not define storage design before project planning authorizes that work.

## 13. External Integrations Overview

### File and Image Storage

The project anticipates external storage for items such as user, event, and
organization images and possibly certificate files. Cloudinary is the current
candidate provider. Exact content types, limits, ownership, retention, failure
handling, and whether certificates use external files require planning.

### Payment Providers

VNPay and MoMo are current candidate providers for donation payments. The team
must decide whether each provider is live, sandboxed, mocked, or unavailable in
each delivery stage. Payment security, reconciliation, duplicate outcomes,
cancellation, failure, and user support expectations require clarification
before a payment module plan is approved.

### Email Delivery

The product scope includes email verification, password recovery, application
approval, event reminders, and certificate email. The provider, sender
identity, delivery mode, templates, retry behavior, and development fallback
require planning.

External provider names in this section are candidates from project context,
not approved architecture or contracts.

## 14. Non-Functional Requirements

### Security and Privacy

- **NFR-001**: Passwords MUST never be stored, logged, or displayed in plain
  text.
- **NFR-002**: Security-sensitive values MUST be supplied through protected
  configuration and MUST not appear in source-controlled artifacts.
- **NFR-003**: Every protected action MUST be denied to unauthorized roles in
  acceptance testing.
- **NFR-004**: Sensitive personal, account, and payment information MUST be
  limited to users with a documented business need.
- **NFR-005**: Validation failures and operational errors MUST not reveal
  credentials, tokens, private records, or internal diagnostic detail.

### Usability and Accessibility

- **NFR-006**: At least 90% of representative users in team acceptance testing
  MUST complete their primary role journey without assistance.
- **NFR-007**: Primary actions MUST provide a visible success, pending, or error
  outcome; no critical action may fail silently.
- **NFR-008**: Navigation, labels, validation messages, and status terminology
  MUST remain consistent across modules.
- **NFR-009**: The project plan MUST define accessibility acceptance criteria
  before interface implementation begins.

### Performance and Capacity

- **NFR-010**: At least 95% of ordinary interactive user actions MUST show a
  meaningful result or progress indication within 3 seconds under the agreed
  student-project test load.
- **NFR-011**: Event discovery MUST remain usable as the event list grows,
  including a bounded browsing strategy defined during planning.
- **NFR-012**: Reports and dashboards MUST not block unrelated user journeys
  while results are being prepared.

### Reliability and Data Integrity

- **NFR-013**: Repeated submission of an application, attendance decision,
  certificate request, notification action, or payment result MUST not create
  unintended duplicate business outcomes.
- **NFR-014**: Cross-module status changes MUST be reflected consistently in all
  affected user views during acceptance testing.
- **NFR-015**: Failure of an optional external communication MUST not corrupt the
  underlying account, event, application, attendance, certificate, or donation
  outcome.

### Maintainability and Reviewability

- **NFR-016**: Frontend, backend, and shared concerns MUST remain clearly
  separated as required by the constitution and future approved plan.
- **NFR-017**: Every module requirement MUST trace to a project-level goal,
  project requirement, or explicitly documented module need.
- **NFR-018**: Every change MUST be reviewable by a team member other than its
  author and accompanied by applicable verification evidence.
- **NFR-019**: Documentation MUST be updated in the same change that establishes
  or changes approved behavior.

## 15. Assumptions

- The product is currently desktop-web-first, while exact responsiveness and
  supported browser expectations will be decided during planning.
- The full 15-module scope is retained even if delivery occurs in stages.
- The 66 use cases and 46-screen overview are scope inventories, not final
  interaction designs.
- Public event information does not include protected Volunteer or Staff data.
- Each authenticated user has at least one role; whether multiple simultaneous
  roles are permitted remains open.
- Module ownership supports coordination but does not override collective review
  or shared product rules.
- External integration availability may differ between development,
  demonstration, and production-like environments.
- Exact legal, financial, retention, and consent requirements have not yet been
  supplied and must be identified before handling real payments or sensitive
  personal data.

## 16. Project-Level Open Questions

The following items affect multiple modules and are marked **Needs
Clarification**. They MUST be resolved or explicitly assigned to a later
clarification gate before project planning can authorize affected design work.

### Scope and Delivery

- Which capabilities must be delivered in the first assessed release, and which
  are delivered in later project stages without being removed from full scope?
- Will donation/payment, email, certificate files, reminders, and advanced
  reporting use live, sandbox, mocked, or staged behavior?

### Roles and Organizations

- Can one user have multiple roles?
- Can Staff also act as Volunteers?
- Do Manager and Admin roles inherit lower-level permissions?
- Who may create Staff accounts, approve organizations, and assign Staff to
  organizations?
- Can one Staff member serve multiple organizations, and can one event belong to
  more than one organization?

### Shared Lifecycles

- What are the canonical Event and Application statuses and allowed
  transitions?
- Are Event deletion and other removals permanent, archived, or otherwise
  restricted?
- How do event capacity, required skills, duplicate applications, and
  cancellation interact?
- Is attendance manual, QR-assisted, self check-in, or a combination, and when
  may it be edited?
- Does attendance determine feedback and certificate eligibility?
- Can feedback be repeated, anonymous, or answered?
- What certificate format and regeneration rules apply?

### Communication, Reporting, and Payments

- Which events trigger in-product notifications, email, or both?
- Which roles may create each notification type?
- What information may appear in management reports and exports?
- What payment states, reconciliation rules, refund or cancellation behavior,
  and administrative controls are required?
- What provider failures require retry, manual review, or user support?

### Quality and Compliance

- What accessibility standard and browser support level will be accepted?
- What test load represents expected project use?
- What personal-data retention, deletion, consent, and audit expectations apply?
- What financial or institutional rules apply if real payments are accepted?

Technology, database, API format, route structure, naming, and architecture
questions belong in the project plan after the business questions above are
reviewed.

## 17. Success Criteria

- **SC-001**: The team reviews and approves one shared project specification
  covering all 15 modules, 66 use cases, and 46 screens before project planning.
- **SC-002**: Every one of the 66 use cases maps to exactly one primary module
  and at least one permitted actor before module implementation planning.
- **SC-003**: Every protected project-level acceptance scenario includes a
  successful authorized path and a denied unauthorized path.
- **SC-004**: All five team members can identify their finalized ownership area,
  its cross-module dependencies, and the shared rules they may not change
  unilaterally.
- **SC-005**: All unresolved cross-module decisions are recorded and assigned to
  clarification or planning; none is silently converted into schema, contract,
  or implementation behavior.
- **SC-006**: Representative end-to-end acceptance review covers event
  discovery, application, review, attendance, feedback or certificate
  eligibility, management reporting, communication, and donation/payment.
- **SC-007**: At least 90% of representative users complete their primary
  approved role journey without assistance during acceptance testing.
- **SC-008**: 100% of tested unauthorized protected actions are denied by
  trusted system behavior.
- **SC-009**: No reviewed project artifact contains a plain-text password or real
  security secret.
- **SC-010**: Project planning begins with no database schema, migration, API
  contract, route, or implementation decision falsely presented as approved by
  this specification.

## 18. Risks and Scope-Control Notes

- **Large full scope**: Fifteen modules and multiple integrations may exceed the
  capacity of a five-member student team if treated as one simultaneous release.
  Mitigation: retain full scope while establishing reviewed delivery stages and
  independently testable module boundaries.
- **Cross-module lifecycle ambiguity**: Event, application, attendance,
  feedback, and certificate rules can conflict if decided separately.
  Mitigation: approve canonical shared lifecycle rules before module planning.
- **Role ambiguity**: Multi-role and inheritance choices can create security
  gaps. Mitigation: approve a role-permission model and denial scenarios before
  protected feature design.
- **Payment complexity**: Real payment processing introduces security,
  reconciliation, support, and possible compliance obligations. Mitigation:
  clarify delivery mode and acceptance boundaries before design.
- **External dependency risk**: Storage, payment, and email providers may be
  unavailable or behave differently across environments. Mitigation: define
  observable failure outcomes and approved development fallbacks.
- **Premature design**: High-level data concepts and candidate technologies may
  be mistaken for approved design. Mitigation: preserve the constitutional gate
  requiring reviewed project spec, plan, and tasks before implementation.
- **Ownership silos**: Module assignments may encourage inconsistent local
  decisions. Mitigation: require review for shared terminology, roles,
  lifecycles, integrations, and future contracts.

Scope changes MUST update this specification and receive team review. A delivery
stage may postpone a capability, but removing it from the confirmed full scope
requires an explicit specification amendment.

## 19. Guidance for Future Feature-Level Specifications

Each module or cohesive feature MAY receive its own `context.md`, `spec.md`,
`plan.md`, and `tasks.md`. A future feature specification MUST:

- reference this project specification and the current constitution;
- identify the project module, use cases, screens, actors, and owner it covers;
- state in-scope and out-of-scope behavior without removing other project
  modules;
- define user journeys, preconditions, outcomes, denial behavior, edge cases,
  and measurable acceptance scenarios;
- use the shared role, event, application, attendance, feedback, certificate,
  organization, communication, and payment decisions once approved;
- mark unresolved business decisions as clarification items rather than
  inventing behavior;
- describe business information conceptually without defining database fields
  or relationships during specification;
- avoid API shapes, routes, components, framework choices, and implementation
  tasks;
- identify cross-module dependencies and request review from affected owners;
- preserve traceability to the applicable project-level goal, rule, use case,
  and success criterion.

Project-level clarification and review MUST occur before the project plan.
Feature-level specifications MUST then remain consistent with the approved
project foundation and any later project-level decisions.

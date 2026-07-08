# Volunteer Event Management System - Project Overview

## 1. Project Overview

Volunteer Event Management System is a web-based system that supports the management of volunteer activities and volunteer events.

The system helps connect organizations with volunteers. It allows users to search for events, view event details, register accounts, apply for events, track application status, check attendance, submit feedback, and view/download certificates after completing events.

The system also supports staff, managers, and administrators in managing events, applications, attendance, certificates, users, organizations, reports, notifications, donations, payment gateway activities, and related system activities.

The system aims to digitize the full volunteer management process, including:

* Event discovery
* Event application
* Application review
* Attendance check-in
* Feedback submission
* Certificate generation
* Notification management
* Reporting and dashboard
* Donation and payment gateway
* Email services

---

## 2. User Roles

Guest is not a role stored in the database.

Guest is only the unauthenticated state of a user before login. Guest users can only access public pages.

The roles stored in the database are:

* `VOLUNTEER`
* `STAFF`
* `MANAGER`
* `ADMIN`

---

## 3. Role Description and Permission Overview

### 3.1 Guest

Guest is an unauthenticated user.

Guest can:

* Access the website
* View the landing page
* View the public home page
* View public event list
* Search and filter public events
* View public event detail
* Register an account
* Login to the system

Guest cannot:

* Apply for events
* View applied events
* View volunteer history
* Check attendance
* Submit feedback
* View or download certificates
* Access staff, manager, or admin functions

---

### 3.2 Volunteer

Volunteer is an authenticated user who joins volunteer events.

Volunteer can:

* Manage personal profile
* Edit personal information
* Manage volunteer skills
* Search events
* Filter events
* View event details
* Apply for events
* Track application status
* View applied events
* Cancel application only when the application is `PENDING`
* Check attendance for approved events
* View volunteer history
* Submit feedback after successful attendance
* View certificates
* Download certificates

Volunteer cannot:

* Create events
* Edit events
* Delete events
* Approve applications
* Reject applications
* Manage attendance list as Staff
* Generate certificates
* Manage user accounts
* Manage organizations
* View system-wide reports or dashboard unless assigned another authorized role

---

### 3.3 Staff

Staff is responsible for operating events and handling event-related workflows.

Staff can:

* Create events
* Manage events
* View application list
* View application detail
* Approve applications
* Reject applications
* Manage attendance
* Create certificates for volunteers who attended events
* Send or trigger event-related notifications if assigned

Staff cannot:

* Manage all user accounts unless granted permission by Manager/Admin
* Manage system-wide reports and dashboard
* Manage all organizations unless assigned by Manager/Admin

---

### 3.4 Manager

Manager is responsible for management-level operations.

Manager can:

* View dashboard and reports if assigned
* Export reports if assigned
* Manage categories
* Manage skills
* Manage Staff accounts if assigned
* Manage data such as event categories, event location categories, event time categories, event type categories, and volunteer skills

Manager cannot:

* Perform volunteer-only personal actions unless also acting as a Volunteer
* Perform Admin-only system management unless granted permission

---

### 3.5 Admin

Admin is responsible for system-level management.

Admin can:

* Manage user accounts
* Manage organizations
* View overall dashboard
* View system-wide statistics
* View and manage notifications if assigned
* View donation history if donation module is included
* Manage donation/payment records if assigned

Admin is responsible for:

* Account control
* Organization supervision
* Dashboard monitoring
* System-wide statistics
* Administrative data management

---

## 4. Functional Modules

The system contains 16 functional modules.

---

### Module 1: Authentication

Use cases:

* UC01 - View Landing Page
* UC02 - View Home Page
* UC03 - Login
* UC04 - Register
* UC05 - Logout
* UC06 - Change Password
* UC07 - Forgot Password

Purpose:

This module handles account access flows such as landing page, home page, login, register, logout, change password, and forgot password.

Main actors:

* Guest
* Volunteer
* Staff
* Manager
* Admin

---

### Module 2: Event Management

Use cases:

* UC08 - View Event List
* UC09 - View Event Detail
* UC10 - Search Event
* UC11 - Filter Event
* UC12 - Apply Event
* UC13 - View Applied Events
* UC14 - Cancel Application, only when the application is `PENDING`
* UC15 - Add Event
* UC16 - Edit Event
* UC17 - Delete Event

Purpose:

This module supports public event browsing, event search/filter, volunteer event application, applied event tracking, cancel application, and staff event management.

Main actors:

* Guest
* Volunteer
* Staff

Implementation note:

Search Event and Filter Event are separate use cases, but they should be implemented inside the Event List screen instead of as disconnected pages.

---

### Module 3: Profile Management

Use cases:

* UC18 - View Profile
* UC19 - Edit Profile
* UC20 - Edit Volunteer Skills
* UC21 - View Volunteer History

Purpose:

This module allows users, especially Volunteers, to manage profile information, skills, and volunteer history.

Main actors:

* Volunteer

Related actors:

* Staff
* Manager
* Admin

Assignment note:

UC21 - View Volunteer History belongs to Member 1 in the latest team assignment, not Member 2.

---

### Module 4: Application Management

Use cases:

* UC22 - View Application List
* UC23 - View Application Detail
* UC24 - Approve Application
* UC25 - Reject Application

Purpose:

This module allows Staff to manage volunteer applications for events.

Main actors:

* Staff

Related actors:

* Volunteer

---

### Module 5: User Management

Use cases:

* UC26 - View User List
* UC27 - View User Detail
* UC28 - Add User
* UC29 - Edit User
* UC30 - Filter User

Purpose:

This module allows authorized users to manage user accounts.

Main actors:

* Manager
* Admin

---

### Module 6: Category Management

Use cases:

* UC31 - View Category List
* UC32 - Add Category
* UC33 - Edit Category

Purpose:

This module allows Managers to manage categories such as event location, event time, event type, and other event classification data.

Main actors:

* Manager

---

### Module 7: Skill Management

Use cases:

* UC34 - View Skill List
* UC35 - Add Skill
* UC36 - Edit Skill

Purpose:

This module manages volunteer skills such as communication, English, teamwork, leadership, and other skills required by volunteer events.

Main actors:

* Manager

Related actors:

* Volunteer

---

### Module 8: Organization Management

Use cases:

* UC37 - View Organization List
* UC38 - View Organization Detail
* UC39 - Add Organization
* UC40 - Edit Organization

Purpose:

This module manages organizations that create, sponsor, or participate in volunteer events.

Main actors:

* Admin
* Manager

Assignment note:

In the latest team assignment, Organization Management belongs to Member 5.

---

### Module 9: Notification Management

Use cases:

* UC41 - View Notifications
* UC42 - View Notification Detail
* UC43 - Mark Notification As Read
* UC44 - Create Notification

Purpose:

This module allows users to view notifications and authorized users to create notifications.

Main actors:

* Volunteer
* Staff
* Admin

---

### Module 10: Attendance Management

Use cases:

* UC45 - Attendance Check-in
* UC46 - View Attendance List
* UC47 - View Attendance History

Purpose:

This module supports attendance check-in and attendance tracking for volunteer events.

Main actors:

* Volunteer
* Staff

---

### Module 11: Feedback Management

Use cases:

* UC48 - Submit Feedback
* UC49 - View Feedback List
* UC50 - View Feedback Detail

Purpose:

This module allows Volunteers to submit feedback after successful attendance and allows authorized users to view feedback.

Main actors:

* Volunteer
* Staff

Assignment note:

In the latest team assignment, only UC48 - Submit Feedback is assigned to Member 2. UC49 and UC50 are not assigned in the latest member split and should be clarified before implementation.

---

### Module 12: Certificate Management

Use cases:

* UC51 - View Certificates
* UC52 - Download Certificate
* UC53 - Generate Certificate

Purpose:

This module supports certificate viewing, downloading, and generation after volunteers attend events.

Main actors:

* Volunteer
* Staff

Implementation note:

UC51 and UC52 should share the same Certificates page or Certificate Detail screen. UC52 is a download action inside the certificate UI. UC53 is Staff certificate generation and belongs to Member 3.

---

### Module 13: Reporting and Dashboard

Use cases:

* UC54 - View Dashboard
* UC55 - Event Statistics
* UC56 - Volunteer Statistics
* UC57 - Export Reports

Purpose:

This module provides dashboard, statistics, and export reports for management-level users.

Main actors:

* Manager
* Admin

---

### Module 14: Donation and Payment Gateway

Use cases:

* UC58 - Donate To Event
* UC59 - Make Payment
* UC60 - View Donation History
* UC61 - Manage Donations

Integrations:

* VNPay
* MoMo

Purpose:

This module supports donations and payment gateway integration for volunteer events.

Main actors:

* Volunteer
* Admin

---

### Module 15: Email Services

Use cases:

* UC62 - Verify Email
* UC63 - Forgot Password Email
* UC64 - Event Approval Email
* UC65 - Event Reminder Email
* UC66 - Certificate Email

Purpose:

This module supports automated email sending for verification, password recovery, event approval, event reminders, and certificates.

Main actors:

* System
* Guest
* Volunteer
* Staff

Integration:

* NodeMailer
* Gmail service

---

### Module 16: Event Approval Management

Use cases:

* UC67 - View Pending Event
* UC68 - View Pending Event Detail
* UC69 - Approve Event
* UC70 - Reject Event

Purpose:

This module allows Managers to review and approve or reject newly created events before they are visible to Volunteers for registration.

Main actors:

* Manager

---

## 5. Screen List

### Authentication

1. Landing Page
2. Home Page
3. Login
4. Register
5. Forgot Password
6. Change Password

---

### Event

1. Event List
2. Event Detail
3. Applied Event List
4. Add Event
5. Edit Event

Note:

Search Event and Filter Event are included inside Event List. Apply Event is an action from Event Detail. Cancel Application is an action inside Applied Event List.

---

### Profile

1. Profile
2. Edit Profile
3. Manage Skills
4. Volunteer History

Note:

Volunteer History belongs to Profile Management and is assigned to Member 1 in the latest team assignment.

---

### Application

1. Application List
2. Application Detail
3. Approval Screen

---

### User Management

1. User List
2. User Detail
3. Add User
4. Edit User

---

### Category and Skill

1. Category List
2. Category Form
3. Skill List
4. Skill Form

---

### Organization

1. Organization List
2. Organization Detail
3. Organization Form

---

### Notification

1. Notification List
2. Notification Detail
3. Create Notification

---

### Attendance

1. Attendance Management
2. Attendance History

---

### Feedback

1. Feedback Form
2. Feedback List

Note:

Feedback Form maps to UC48. Feedback List/Detail should be clarified because UC49 and UC50 are not assigned in the latest member split.

---

### Certificate

1. Certificate List
2. Certificate Detail

Note:

Download Certificate is an action inside Certificate List or Certificate Detail, not a standalone page.

---

### Reports

1. Dashboard
2. Event Statistics
3. Volunteer Statistics
4. Export Report

---

### Donation

1. Donation Page
2. Payment Result
3. Payment Gateway
4. Donation History

---

## 6. Team Assignment

The latest team assignment is divided by use case among 5 members.

---

### Member 1 — CuongLH

Module: Authentication + Profile + Email Services.

Member 1 is responsible for:

#### Authentication

* UC01 - View Landing Page
* UC02 - View Home Page
* UC03 - Login
* UC04 - Register
* UC05 - Logout
* UC06 - Change Password
* UC07 - Forgot Password

#### Profile Management

* UC18 - View Profile
* UC19 - Edit Profile
* UC20 - Edit Volunteer Skills
* UC21 - View Volunteer History

#### Email Services

* UC62 - Verify Email
* UC63 - Forgot Password Email
* UC64 - Event Approval Email
* UC65 - Event Reminder Email
* UC66 - Certificate Email

Member 1 owns authentication, user profile, volunteer history, and email integration.

---

### Member 2 — NamLD

Module: Volunteer Event.

Member 2 is responsible for:

#### Event Management

* UC08 - View Event List
* UC09 - View Event Detail
* UC10 - Search Event
* UC11 - Filter Event
* UC12 - Apply Event
* UC13 - View Applied Events
* UC14 - Cancel Application

#### Feedback

* UC48 - Submit Feedback

#### Certificate

* UC51 - View Certificates
* UC52 - Download Certificate

Member 2 owns Volunteer-facing event discovery, application, applied events, feedback submission, and certificates view/download.

Important clarification:

* Home Dashboard is not part of Member 2 in the latest team assignment.
* Volunteer History is not part of Member 2 in the latest team assignment.
* UC21 - View Volunteer History belongs to Member 1.
* UC54 to UC57 Dashboard and Reporting belong to Member 5.
* UC52 Download Certificate should be implemented as an action inside the Certificates UI from UC51.

Recommended `.sdd` feature folders for Member 2:

```txt
UC08-feat-event-list
UC09-feat-event-detail
UC10-feat-event-search
UC11-feat-event-filter
UC12-feat-apply-event
UC13-feat-applied-events
UC14-feat-cancel-application
UC48-feat-submit-feedback
UC51-feat-view-certificates
UC52-feat-download-certificate
```

---

### Member 3 — TienTD

Module: Event & Application Management.

Member 3 is responsible for:

#### Event Management

* UC15 - Add Event
* UC16 - Edit Event
* UC17 - Delete Event

#### Application Management

* UC22 - View Application List
* UC23 - View Application Detail
* UC24 - Approve Application
* UC25 - Reject Application

#### Attendance

* UC45 - Attendance Check
* UC46 - View Attendance List
* UC47 - View Attendance History

#### Certificate

* UC53 - Generate Certificate

Member 3 owns Staff event operations, Staff application review, attendance, and certificate generation.

---

### Member 4 — DucNM

Module: Admin & Manager Management.

Member 4 is responsible for:

#### User Management

* UC26 - View User List
* UC27 - View User Detail
* UC28 - Add User
* UC29 - Edit User
* UC30 - Filter User

#### Category Management

* UC31 - View Category List
* UC32 - Add Category
* UC33 - Edit Category

#### Skill Management

* UC34 - View Skill List
* UC35 - Add Skill
* UC36 - Edit Skill

Member 4 owns user management, category management, and skill management.

Important clarification:

Organization Management is not part of Member 4 in the latest team assignment. It belongs to Member 5.

---

### Member 5 — DucNM

Module: Organization + Notification + Dashboard + Payment.

Member 5 is responsible for:

#### Organization Management

* UC37 - View Organization List
* UC38 - View Organization Detail
* UC39 - Add Organization
* UC40 - Edit Organization

#### Notification

* UC41 - View Notifications
* UC42 - View Notification Detail
* UC43 - Mark Notification As Read
* UC44 - Create Notification

#### Dashboard and Reporting

* UC54 - View Dashboard
* UC55 - Event Statistics
* UC56 - Volunteer Statistics
* UC57 - Export Reports

#### Donation and Payment

* UC58 - Donate To Event
* UC59 - Make Payment
* UC60 - View Donation History
* UC61 - Manage Donations

Member 5 owns organization, notification, dashboard, reports, donation, and payment gateway.

---

## 7. Suggested Technology Stack

### Backend

* NodeJS
* JavaScript
* Prisma ORM
* MySQL
* Zod validation
* Swagger using `swagger-jsdoc` and `swagger-ui-express`
* Logging using `pino`, `pino-http`, and `pino-pretty`

---

### Frontend

* React
* JSX
* Bootstrap CSS
* Jest
* React Testing Library

---

### Authentication

* JWT
* HttpOnly Cookie
* bcryptjs

---

### Email

* NodeMailer
* Gmail service

---

### File and Image Storage

* Cloudinary

---

### Payment

* VNPay
* MoMo

---

### Testing

* Jest
* Supertest for Backend
* Jest and React Testing Library for Frontend

---

## 8. Core Business Rules

### 8.1 Authentication Rules

1. Guest is not stored as a database role.
2. Guest means unauthenticated user.
3. The database stores only these roles:

   * `VOLUNTEER`
   * `STAFF`
   * `MANAGER`
   * `ADMIN`
4. Unauthenticated users can only access public pages.
5. Only authenticated users can access protected features.
6. Accounts that have not verified email are not allowed to login.
7. Forgot password OTP expires after 10 minutes (TTL from `created_at` in `email_verifications`).
8. After a successful password reset, the corresponding `email_verifications` record (`type = RESET_PASSWORD`) must be deleted immediately.

---

### 8.2 Event Rules

1. Guests can view public event lists.
2. Guests can view public event details.
3. Guests and Volunteers can search and filter public events.
4. Volunteers must login before applying for an event.
5. Staff can create and manage events.
6. User, Event, and Organization use soft delete.
7. Soft-deleted data is not physically deleted from the database.
8. Staff cannot delete or edit an event if the event already has at least one `APPROVED` application and the event is about to happen.
9. Search Event and Filter Event are included in Event List.
10. Apply Event starts from Event Detail.
11. Cancel Application is handled from Applied Event List.

---

### 8.3 Application Rules

1. Each Volunteer can apply only once for each event.
2. A Volunteer cannot apply after the application deadline.
3. A Volunteer cannot apply when the event is full.
4. A new application starts as `PENDING`.
5. Staff can approve or reject applications.
6. Volunteers can view their applied events.
7. Volunteers can cancel an application only when the application status is `PENDING`.
8. Volunteers cannot directly cancel an `APPROVED` application.
9. If an application is already `APPROVED`, the Volunteer must contact Staff to cancel or handle the case.
10. Backend/API must enforce duplicate application, deadline, capacity, role, and ownership rules.

---

### 8.4 Attendance Rules

1. Only Volunteers with `APPROVED` applications can check in.
2. Attendance check-in is only open during the event time.
3. Staff can manage attendance.
4. Volunteers can view attendance history.

---

### 8.5 Feedback Rules

1. Volunteers can submit feedback only after successful attendance.
2. Each Volunteer can submit only one feedback for each event.
3. Feedback content/comment is required.
4. Rating can be optional if the team decides to support rating.
5. Staff feedback list/detail use cases are not assigned in the latest member split and need team clarification before implementation.

---

### 8.6 Certificate Rules

1. Staff can generate certificates only for Volunteers who attended the event.
2. Each Volunteer has only one certificate per event.
3. Volunteers can view certificates.
4. Volunteers can download certificates.
5. Download Certificate is an action inside Certificate List or Certificate Detail.
6. Certificate generation belongs to Staff through UC53.
7. Backend/API must enforce certificate ownership and file availability before download.

---

### 8.7 Donation and Payment Rules

1. Minimum donation amount is 10,000 VND.
2. Payment transaction status must be updated through webhook callback from the payment gateway.
3. The system must not trust redirect URL from the client as the final payment result.
4. VNPay and MoMo are the planned payment integrations.

---

## 9. Member 2 Feature Breakdown

Member 2 should divide the Volunteer Event Module into the following use-case folders.

---

### UC08-feat-event-list

Covers:

* Event List

Main use case:

* UC08 - View Event List

Main actors:

* Guest
* Volunteer

Important notes:

* This is the shared Event List screen used by UC08, UC10, and UC11.
* Search and Filter are separate use cases but should be implemented in this screen.

---

### UC09-feat-event-detail

Covers:

* Event Detail
* Apply entry point

Main use case:

* UC09 - View Event Detail

Main actors:

* Guest
* Volunteer

Important notes:

* Event Detail can show Apply entry point.
* Actual Apply Event submission belongs to UC12.

---

### UC10-feat-event-search

Covers:

* Search Event

Main use case:

* UC10 - Search Event

Main actors:

* Guest
* Volunteer

Important notes:

* Search Event should be implemented inside Event List.
* Do not create a disconnected standalone Search page.

---

### UC11-feat-event-filter

Covers:

* Filter Event

Main use case:

* UC11 - Filter Event

Main actors:

* Guest
* Volunteer

Important notes:

* Filter Event should be implemented inside Event List.
* Do not create a disconnected standalone Filter page.

---

### UC12-feat-apply-event

Covers:

* Apply Event

Main use case:

* UC12 - Apply Event

Main actors:

* Volunteer

Important rules:

* Volunteer must login before applying.
* Each Volunteer can apply only once for each event.
* Volunteer cannot apply after deadline.
* Volunteer cannot apply when the event is full.
* A new application starts as `PENDING`.

---

### UC13-feat-applied-events

Covers:

* Applied Event List

Main use case:

* UC13 - View Applied Events

Main actors:

* Volunteer

Important notes:

* Volunteer can view only their own applied events.
* Cancel Application is a related action from UC14.

---

### UC14-feat-cancel-application

Covers:

* Cancel Application action

Main use case:

* UC14 - Cancel Application

Main actors:

* Volunteer

Important rules:

* Volunteer can cancel only their own applications.
* Volunteer can cancel only `PENDING` applications.
* `APPROVED` applications cannot be cancelled directly by Volunteer.
* UC14 should be implemented as an action inside Applied Event List.

---

### UC48-feat-submit-feedback

Covers:

* Feedback Form

Main use case:

* UC48 - Submit Feedback

Main actors:

* Volunteer

Important rules:

* Volunteer can submit feedback only after successful attendance.
* Each Volunteer can submit only one feedback per event.
* Volunteer History is only an entry point or related data source; UC21 belongs to Member 1.

---

### UC51-feat-view-certificates

Covers:

* Certificate List
* Certificate Detail or Preview if needed

Main use case:

* UC51 - View Certificates

Main actors:

* Volunteer

Important rules:

* Volunteer can view only their own certificates.
* Staff generates certificates through UC53.
* Download Certificate is a related action from UC52.

---

### UC52-feat-download-certificate

Covers:

* Download Certificate action

Main use case:

* UC52 - Download Certificate

Main actors:

* Volunteer

Important rules:

* Volunteer can download only their own certificates.
* Certificate must exist and have valid file/download data.
* Certificate should be available before download.
* UC52 should be implemented as an action inside Certificate List or Certificate Detail.

---

## 10. High-Level Data Concepts

The following are high-level data concepts only. They are not finalized database tables.

Database schema, fields, relations, constraints, and migrations must be designed later during the planning phase.

Potential data concepts:

* User
* Role
* Event
* Event Category
* Skill
* Volunteer Skill
* Organization
* Event Application
* Attendance
* Feedback
* Certificate
* Notification
* Donation
* Payment Transaction
* Email Verification
* Password Reset
* Report

Important note:

This section must not be treated as finalized database design.

---

## 11. External Integrations

### 11.1 Cloudinary

Cloudinary may be used for storing uploaded images and files, such as:

* User avatars
* Event images
* Organization images
* Certificate files if needed

---

### 11.2 VNPay and MoMo

VNPay and MoMo may be used for donation and payment gateway integration.

Important payment rule:

Payment result must be updated through webhook callback from the payment gateway. The system must not trust only the redirect URL from the client.

---

### 11.3 NodeMailer and Gmail Service

NodeMailer and Gmail service may be used for:

* Email verification
* Forgot password email
* Event approval email
* Event reminder email
* Certificate email

---

## 12. Non-Functional Requirements

### 12.1 Security

1. Passwords must not be stored in plain text.
2. Passwords must be hashed using bcryptjs.
3. JWT must be stored using HttpOnly Cookie.
4. Sensitive configuration must be stored in environment variables.
5. Role-based access control must be enforced.
6. Protected features must check permissions on the backend.
7. Input validation must be applied using Zod or an equivalent validation method.
8. Payment-related data must be handled carefully.
9. Email verification must be checked before allowing login.
10. Certificate download must check authentication, role, ownership, status, and file availability on the backend.

---

### 12.2 Usability

1. The system should be easy to use for Volunteers.
2. Event search and filtering should be clear.
3. Success and error messages should be displayed clearly.
4. The UI should be consistent across all modules.
5. Bootstrap CSS is the main styling approach.
6. The website should focus on desktop web first.

---

### 12.3 Performance

1. Event list should support pagination or scalable loading.
2. Search and filter should avoid unnecessary data loading.
3. Dashboard and statistics should avoid expensive operations when possible.
4. Reports should be generated in a controlled way.

---

### 12.4 Maintainability

1. Frontend and backend code should be separated clearly.
2. Each module should have clear ownership.
3. Code should follow consistent naming conventions.
4. Database and API changes must be reviewed before implementation.
5. AI-generated code must be reviewed by team members.
6. Specifications should be reviewed before database migration and code implementation.

---

## 13. Specification Workflow Rule

This project should follow a Spec-Driven Development workflow.

The correct order is:

1. Project overview/context
2. Constitution
3. Project-level specification
4. Clarification and review
5. Project-level plan
6. Project-level tasks
7. Database design and migration
8. API implementation
9. Frontend implementation
10. Testing and validation

The team should not skip directly to database or implementation code before reviewing the project specification and plan.

---

## 14. Notes for AI Agents

When using Codex or any AI agent in this repository:

1. Do not generate implementation code from this project overview alone.
2. Do not create database schema from this project overview alone.
3. Do not create API contracts from this project overview alone.
4. Use this file only as high-level project context.
5. Follow the latest official team assignment by use case.
6. Follow the project constitution once it exists.
7. Follow project-level spec, plan, and tasks before implementation.
8. Keep frontend, backend, and shared concerns separated.
9. Avoid inventing unsupported features that are not listed in the project overview.
10. Do not assign Volunteer History or Home Dashboard to Member 2.
11. Do not assign Organization Management to Member 4.
12. Do not implement UC49 or UC50 until the team clarifies assignment and scope.
13. Preserve the Member 2 `.sdd` feature order:

    * `UC08-feat-event-list`
    * `UC09-feat-event-detail`
    * `UC10-feat-event-search`
    * `UC11-feat-event-filter`
    * `UC12-feat-apply-event`
    * `UC13-feat-applied-events`
    * `UC14-feat-cancel-application`
    * `UC48-feat-submit-feedback`
    * `UC51-feat-view-certificates`
    * `UC52-feat-download-certificate`

14. Implement related Volunteer features together where appropriate:

    * UC08, UC10, and UC11 should share the Event List screen.
    * UC13 and UC14 should share the Applied Events screen.
    * UC51 and UC52 should share the Certificates page or Certificate Detail.

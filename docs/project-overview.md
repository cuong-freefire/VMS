# Volunteer Event Management System - Project Overview

## 1. Project Overview

Volunteer Event Management System is a web-based system that supports the management of volunteer activities and volunteer events.

The system helps connect organizations with volunteers. It allows users to search for events, view event details, register accounts, apply for events, track application status, check attendance, submit feedback, and view/download certificates after completing events.

The system also supports staff, managers, and administrators in managing events, applications, attendance, feedback, certificates, users, organizations, reports, notifications, donations, and related system activities.

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
* View public event list
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
* Manage attendance list as staff
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
* Send event-related notifications

Staff cannot:

* Manage all user accounts unless granted permission by Manager/Admin
* Manage system-wide reports and dashboard
* Manage all organizations unless assigned by Manager/Admin

---

### 3.4 Manager

Manager is responsible for management-level operations.

Manager can:

* Export reports
* Manage categories
* Manage skills
* Manage Staff accounts

Manager can manage data such as:

* Event categories
* Event location categories
* Event time categories
* Event type categories
* Volunteer skills
* Staff account information

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

Admin is responsible for:

* Account control
* Organization supervision
* Dashboard monitoring
* System-wide statistics
* Administrative data management

---

## 4. Functional Modules

The system contains 15 functional modules.

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

## 5. Screen List

### Authentication

1. Landing Page
2. Login
3. Register
4. Forgot Password
5. Home Dashboard
6. Change Password

---

### Event

7. Event List
8. Event Detail
9. Applied Event List
10. Add Event
11. Edit Event

Note:

Search Event and Filter Event are included inside Event List.

---

### Profile

12. Profile
13. Edit Profile
14. Manage Skills
15. Volunteer History

---

### Application

16. Application List
17. Application Detail
18. Approval Screen

---

### User Management

19. User List
20. User Detail
21. Add User
22. Edit User

---

### Category and Skill

23. Category List
24. Category Form
25. Skill List
26. Skill Form

---

### Organization

27. Organization List
28. Organization Detail
29. Organization Form

---

### Notification

30. Notification List
31. Notification Detail
32. Create Notification

---

### Attendance

33. Attendance Management
34. Attendance History

---

### Feedback

35. Feedback Form
36. Feedback List

---

### Certificate

37. Certificate List
38. Certificate Detail

---

### Reports

39. Dashboard
40. Event Statistics
41. Volunteer Statistics
42. Export Report

---

### Donation

43. Donation Page
44. Payment Result
45. Payment Gateway
46. Donation History

---

## 6. Team Assignment

The project is divided among 5 members.

### Member 1 — Authentication and Profile

Member 1 is responsible for:

* Landing Page
* Login
* Register
* Forgot Password
* Reset Password
* Change Password
* View Profile
* Edit Profile
* Volunteer Skill Management

---

### Member 2 — Volunteer Event Module

Member 2 is responsible for:

* Home Dashboard
* Event List, including Search and Filter
* Event Detail
* Applied Event List
* Volunteer History
* Feedback Form
* Certificate List
* Certificate Detail

Recommended feature folders for Member 2:

```txt
001-volunteer-event-discovery
002-volunteer-event-detail
003-volunteer-event-application
004-volunteer-applied-events
005-volunteer-history
006-volunteer-feedback-form
007-volunteer-certificates
008-volunteer-home-dashboard
```

---

### Member 3 — Staff Module

Member 3 is responsible for:

* Add Event
* Edit Event
* Application List
* Application Detail, including Approve and Reject
* Attendance Management
* Feedback List
* Generate Certificate

---

### Member 4 — Manager Module

Member 4 is responsible for:

* User List
* User Detail
* Add User
* Edit User
* Category Management, including location, event time, event type, and related event classification data
* Skill Management
* Organization Management

---

### Member 5 — Admin Module

Member 5 is responsible for:

* Dashboard
* Event Statistics
* Volunteer Statistics
* Export Report
* Notification List
* Notification Detail
* Create Notification
* Donation History

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
7. Forgot password reset token expires after 1 hour.
8. After a reset token is used, it must be invalidated immediately.

---

### 8.2 Event Rules

1. Guests can view public event lists.
2. Guests can view public event details.
3. Volunteers can search and filter events.
4. Volunteers must login before applying for an event.
5. Staff can create and manage events.
6. User, Event, and Organization use soft delete.
7. Soft-deleted data is not physically deleted from the database.
8. Staff cannot delete or edit an event if the event already has at least one `APPROVED` application and the event is about to happen.

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
3. Staff can view feedback list.
4. Staff can view feedback detail.

---

### 8.6 Certificate Rules

1. Staff can generate certificates only for Volunteers who attended the event.
2. Each Volunteer has only one certificate per event.
3. Volunteers can view certificates.
4. Volunteers can download certificates.

---

### 8.7 Donation and Payment Rules

1. Minimum donation amount is 10,000 VND.
2. Payment transaction status must be updated through webhook callback from the payment gateway.
3. The system must not trust redirect URL from the client as the final payment result.
4. VNPay and MoMo are the planned payment integrations.

---

## 9. Member 2 Feature Breakdown

Member 2 should divide the Volunteer Event Module into the following features.

---

### 001-volunteer-event-discovery

Covers:

* Event List
* Search Event
* Filter Event

Main use cases:

* UC08 - View Event List
* UC10 - Search Event
* UC11 - Filter Event

Main actors:

* Guest
* Volunteer

---

### 002-volunteer-event-detail

Covers:

* Event Detail
* Apply entry point

Main use case:

* UC09 - View Event Detail

Main actors:

* Guest
* Volunteer

---

### 003-volunteer-event-application

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

---

### 004-volunteer-applied-events

Covers:

* Applied Event List
* Cancel Application

Main use cases:

* UC13 - View Applied Events
* UC14 - Cancel Application

Main actors:

* Volunteer

Important rules:

* Volunteer can view their applied events.
* Volunteer can cancel only `PENDING` applications.
* `APPROVED` applications cannot be cancelled directly by Volunteer.

---

### 005-volunteer-history

Covers:

* Volunteer History

Main use case:

* UC21 - View Volunteer History

Main actors:

* Volunteer

Important rules:

* Volunteer History should show volunteer participation records.
* Attendance and completion data are related to Staff Attendance Management.

---

### 006-volunteer-feedback-form

Covers:

* Feedback Form

Main use case:

* UC48 - Submit Feedback

Main actors:

* Volunteer

Important rules:

* Volunteer can submit feedback only after successful attendance.
* Each Volunteer can submit only one feedback per event.

---

### 007-volunteer-certificates

Covers:

* Certificate List
* Certificate Detail
* Download Certificate

Main use cases:

* UC51 - View Certificates
* UC52 - Download Certificate

Main actors:

* Volunteer

Important rules:

* Volunteer can view certificates.
* Volunteer can download certificates.
* Staff generates certificates.
* Each Volunteer has only one certificate per event.

---

### 008-volunteer-home-dashboard

Covers:

* Home Dashboard for Volunteer

Main actors:

* Volunteer

Purpose:

This feature summarizes useful Volunteer information, such as upcoming approved events, applied events, attendance status, feedback reminders, and certificate shortcuts.

Note:

This feature should be specified after the core Volunteer features because it depends on data from Event Discovery, Applied Events, Volunteer History, Feedback, and Certificates.

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
5. Follow the official team assignment.
6. Follow the project constitution once it exists.
7. Follow project-level spec, plan, and tasks before implementation.
8. Keep frontend, backend, and shared concerns separated.
9. Avoid inventing unsupported features that are not listed in the project overview.
10. Preserve the Member 2 feature order:

    * `001-volunteer-event-discovery`
    * `002-volunteer-event-detail`
    * `003-volunteer-event-application`
    * `004-volunteer-applied-events`
    * `005-volunteer-history`
    * `006-volunteer-feedback-form`
    * `007-volunteer-certificates`
    * `008-volunteer-home-dashboard`

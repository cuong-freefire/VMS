# Volunteer Event Management System - Project Overview

## 1. Project Summary

Volunteer Event Management System is a web-based system designed to support the management of volunteer activities and volunteer events.

The system connects organizations, staff, managers, administrators, and volunteers in one platform. It allows public users to browse volunteer events, registered volunteers to apply for events, and staff/admin users to manage the full volunteer event lifecycle.

The system aims to digitize the full volunteer management process, including:

* Event discovery
* Volunteer registration
* Event application
* Application review
* Attendance tracking
* Feedback submission
* Certificate generation
* Notifications
* Reporting and statistics
* Donation and payment support

This project is a student team project developed by 5 members. The team has not finalized the database schema or API contracts yet. Therefore, all specifications must be written and reviewed before creating database migrations, API implementation, or frontend/backend feature code.

---

## 2. Project Objectives

The main objectives of the system are:

1. Allow guests to view volunteer events and register accounts.
2. Allow volunteers to search, filter, and apply for volunteer events.
3. Allow volunteers to manage their profiles, skills, event history, feedback, and certificates.
4. Allow staff to create and manage events.
5. Allow staff to approve or reject volunteer applications.
6. Allow staff to manage attendance for approved volunteers.
7. Allow staff or authorized users to generate certificates after event completion.
8. Allow managers to manage categories, skills, staff, organizations, and reports.
9. Allow admins to manage accounts, organizations, dashboards, statistics, notifications, certificates, and donations.
10. Provide a clear foundation for future database, API, and feature implementation.

---

## 3. Target Users and Roles

The system has 5 main user roles:

1. Guest
2. Volunteer
3. Staff
4. Manager
5. Admin

Each role has different permissions and responsibilities.

---

## 4. Role Description and Permission Overview

### 4.1 Guest

A Guest is an unauthenticated user who can access public pages.

Guest can:

* Access the website
* View the landing page
* View the home page
* View the event list
* View event details
* Register a new account
* Login to the system

Guest cannot:

* Apply for events
* View personal profile
* View applied events
* Submit feedback
* Receive certificates
* Access staff, manager, or admin functions

---

### 4.2 Volunteer

A Volunteer is an authenticated user who participates in volunteer events.

Volunteer can:

* Login and logout
* Manage personal profile
* Edit personal information
* Manage volunteer skills
* Search events
* Filter events
* View event details
* Apply for events
* View applied events
* Cancel applications
* Track application status
* Check attendance
* View attendance history
* Submit feedback after participating in events
* View certificates
* Download certificates
* View donation history if donation is supported

Volunteer cannot:

* Create events
* Edit events
* Delete events
* Approve or reject applications
* Manage other users
* Manage organizations
* Access dashboard or system statistics

---

### 4.3 Staff

Staff members are responsible for operating volunteer events and handling event-related workflows.

Staff can:

* Create events
* Edit events
* Delete events
* View application lists
* View application details
* Approve applications
* Reject applications
* Manage attendance
* View attendance lists
* Generate certificates
* Create notifications related to events
* Send event-related notifications

Staff cannot:

* Manage all system accounts unless granted permission
* Manage system-wide dashboard settings
* Manage payment configuration
* Manage all organizations unless assigned by Manager/Admin

---

### 4.4 Manager

Manager is responsible for management-level operations and system data management.

Manager can:

* Export reports
* View event statistics
* View volunteer statistics
* Manage categories
* Manage skills
* Manage staff
* Manage organizations
* View user-related information needed for management

Manager may manage:

* Event categories
* Event location categories
* Event time categories
* Event type categories
* Volunteer skills
* Staff users
* Organization information

Manager cannot:

* Directly access volunteer-only personal actions
* Apply for events as a volunteer unless also assigned volunteer role
* Perform low-level system administration unless permitted

---

### 4.5 Admin

Admin is the highest-level system role.

Admin can:

* Manage accounts
* Manage organizations
* View dashboard
* View statistics
* Manage notifications
* Manage certificates
* Manage donations
* View reports
* Monitor system-wide activities

Admin is responsible for:

* System-level account control
* High-level monitoring
* Organization supervision
* Dashboard and report access
* Administrative data management

---

## 5. Functional Modules

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

This module handles basic authentication and account access flows. It allows users to register, login, logout, recover passwords, and change passwords.

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
* UC14 - Cancel Application
* UC15 - Add Event
* UC16 - Edit Event
* UC17 - Delete Event

Purpose:

This module supports event browsing for guests and volunteers, event application for volunteers, and event creation/management for staff.

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

This module allows authenticated users, especially volunteers, to manage personal information, skills, and volunteer activity history.

Main actors:

* Volunteer
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

This module allows staff to manage volunteer applications for events.

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

This module allows authorized users to manage accounts and user information.

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

This module allows managers to manage event-related categories, such as event type, location, time, or other classification data.

Main actors:

* Manager

---

### Module 7: Skill Management

Use cases:

* UC34 - View Skill List
* UC35 - Add Skill
* UC36 - Edit Skill

Purpose:

This module manages volunteer skills such as communication, English, teamwork, leadership, or other skills required by events.

Main actors:

* Manager
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

* Manager
* Admin

---

### Module 9: Notification Management

Use cases:

* UC41 - View Notifications
* UC42 - View Notification Detail
* UC43 - Mark Notification As Read
* UC44 - Create Notification

Purpose:

This module allows users to receive notifications and authorized users to create notifications.

Main actors:

* Volunteer
* Staff
* Admin

---

### Module 10: Attendance Management

Use cases:

* UC45 - Attendance Check
* UC46 - View Attendance List
* UC47 - View Attendance History

Purpose:

This module tracks volunteer attendance for events.

Main actors:

* Staff
* Volunteer

---

### Module 11: Feedback Management

Use cases:

* UC48 - Submit Feedback
* UC49 - View Feedback List
* UC50 - View Feedback Detail

Purpose:

This module allows volunteers to submit feedback and authorized users to view feedback.

Main actors:

* Volunteer
* Staff
* Admin

---

### Module 12: Certificate Management

Use cases:

* UC51 - View Certificates
* UC52 - Download Certificate
* UC53 - Generate Certificate

Purpose:

This module allows certificates to be generated after volunteers complete events.

Main actors:

* Volunteer
* Staff
* Admin

---

### Module 13: Reporting and Dashboard

Use cases:

* UC54 - View Dashboard
* UC55 - Event Statistics
* UC56 - Volunteer Statistics
* UC57 - Export Reports

Purpose:

This module provides dashboard, statistics, and exportable reports for management users.

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

This module supports event donations and payment gateway integration.

Main actors:

* Volunteer
* Admin

Important note:

Payment integration may be complex and should be clarified before implementation. The team must decide whether this module is implemented fully, partially, or mocked in the MVP.

---

### Module 15: Email Services

Use cases:

* UC62 - Verify Email
* UC63 - Forgot Password Email
* UC64 - Event Approval Email
* UC65 - Event Reminder Email
* UC66 - Certificate Email

Purpose:

This module supports automated email sending for verification, password recovery, event approval, reminders, and certificates.

Main actors:

* System
* Guest
* Volunteer
* Staff

Integration:

* SMTP
* NodeMailer

---

## 6. Screen List

The system has 46 screens in total.

---

### Authentication Screens

1. Landing Page
2. Login
3. Register
4. Forgot Password
5. Home Dashboard
6. Change Password

---

### Event Screens

7. Event List
8. Event Detail
9. Event Search & Filter
10. Applied Event List
11. Add Event
12. Edit Event

---

### Profile Screens

13. Profile
14. Edit Profile
15. Manage Skills
16. Volunteer History

---

### Application Screens

17. Application List
18. Application Detail
19. Approval Screen

---

### User Management Screens

20. User List
21. User Detail
22. Add User
23. Edit User

---

### Category and Skill Screens

24. Category List
25. Category Form
26. Skill List
27. Skill Form

---

### Organization Screens

28. Organization List
29. Organization Detail
30. Organization Form

---

### Notification Screens

31. Notification List
32. Notification Detail
33. Create Notification

---

### Attendance Screens

34. Attendance Management
35. Attendance History

---

### Feedback Screens

36. Feedback Form
37. Feedback List

---

### Certificate Screens

38. Certificate List
39. Certificate Detail

---

### Report Screens

40. Dashboard
41. Event Statistics
42. Volunteer Statistics
43. Export Report

---

### Donation Screens

44. Donation Page
45. Payment Gateway
46. Donation History

---

## 7. Team Assignment

The project is divided among 5 members using the original official project
overview assignment below. This assignment is the source of truth.

| Member   | Module                   | Number of Screens |
| -------- | ------------------------ | ----------------: |
| Member 1 | Authentication + Profile |                 8 |
| Member 2 | Volunteer Event Module   |                 7 |
| Member 3 | Staff Module             |                 7 |
| Member 4 | Manager Module           |                10 |
| Member 5 | Admin Module             |                14 |
| **Total** |                          |            **46** |

---

## 8. Suggested Technology Stack

### Frontend

* ReactJS
* Bootstrap CSS
* react-toastify
* Material UI

### Backend

* NodeJS

### Database

* MySQL

### Authentication

* JWT Authentication
* Zod validation

### Storage

* Cloudinary

### Payment

* VNPay
* MoMo

### Email

* SMTP
* NodeMailer

---

## 9. Current Project Status

Current repository status:

* Codex is installed in VSCode.
* Spec Kit is installed in the repository.
* The project contains frontend, backend, and shared folders.
* The project has not finalized the database schema.
* The project has not finalized API contracts.
* The project has not finalized detailed route structure.
* The project has not finalized implementation tasks.
* The team is preparing a project-level specification before implementation.

Important workflow rule:

The team must not generate database schema, API contracts, migrations, or feature implementation code before completing and reviewing:

1. Project overview/context
2. Constitution
3. Project-level specification
4. Project-level plan
5. Project-level tasks

---

## 10. Core Business Rules

The following business rules should be used as the initial baseline for future specification and planning.

### General Rules

1. Guest users can only access public pages.
2. Only authenticated users can access protected features.
3. Each authenticated user has a role.
4. Permissions are controlled by role.
5. The system must prevent unauthorized users from accessing restricted features.
6. All important user input must be validated before being processed.

---

### Event Rules

1. Guests can view public event lists and event details.
2. Volunteers can search and filter events.
3. Volunteers must login before applying for an event.
4. A volunteer should not apply to the same event more than once.
5. Staff can create, edit, and delete events.
6. Event deletion behavior must be clarified before implementation: hard delete, soft delete, or archive.
7. Events should have clear status values, but the exact status list must be clarified later.

---

### Application Rules

1. A volunteer can apply to an event.
2. A new application should start with a pending status.
3. Staff can approve or reject applications.
4. Volunteers can view their applied events.
5. Volunteers can cancel applications if cancellation is allowed by business rules.
6. The team must clarify whether volunteers can cancel approved applications.

---

### Attendance Rules

1. Attendance is related to event participation.
2. Staff can manage attendance.
3. Volunteers can view attendance history.
4. The team must clarify whether attendance is checked manually, by QR code, or by another method.

---

### Feedback Rules

1. Volunteers can submit feedback for events.
2. Feedback should be related to an event.
3. The team must clarify whether only attended volunteers can submit feedback.
4. Staff/Admin can view feedback list and feedback detail.

---

### Certificate Rules

1. Certificates are generated after event completion.
2. Volunteers can view and download certificates.
3. Staff/Admin can generate certificates.
4. The team must clarify whether certificates are generated as PDF files, images, or database records.

---

### Notification Rules

1. Users can view notifications.
2. Users can view notification detail.
3. Users can mark notifications as read.
4. Authorized users can create notifications.
5. The system may send event reminders and certificate notifications.

---

### Donation and Payment Rules

1. Users may donate to events.
2. Payments may be processed through VNPay or MoMo.
3. Users can view donation history.
4. Admin can manage donations.
5. The team must clarify whether payment gateway integration is real or mocked for MVP.

---

## 11. High-Level Data Concepts

The following are high-level data concepts only. They are not database tables yet.

Database schema, fields, relations, constraints, and migrations must be designed later during the planning phase.

Potential data concepts:

* User
* Role
* Volunteer Profile
* Staff Profile
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

This section must not be treated as a finalized database design. It is only a high-level concept list for future planning.

---

## 12. External Integrations

### Cloudinary

Cloudinary may be used for storing uploaded images or files, such as:

* User avatars
* Event images
* Organization images
* Certificate files if needed

The exact usage must be clarified before implementation.

---

### VNPay and MoMo

VNPay and MoMo may be used for donation and payment gateway integration.

The team must clarify:

* Whether real payment integration is required
* Whether sandbox mode is enough
* Whether payment should be mocked for MVP
* Whether donation is required in the first implementation phase

---

### SMTP and NodeMailer

SMTP and NodeMailer may be used for email services, including:

* Email verification
* Forgot password email
* Event approval email
* Event reminder email
* Certificate email

The team must clarify:

* Which email provider will be used
* Whether email sending should be real or mocked during development
* Whether email templates are required

---

## 13. Non-Functional Requirements

### Security

1. Passwords must not be stored in plain text.
2. Sensitive configuration must be stored in environment variables.
3. JWT must be used for protected routes.
4. Role-based access control must be enforced.
5. Input validation must be applied using Zod or equivalent validation.
6. Payment-related data must be handled carefully.
7. User permissions must be checked on the backend, not only on the frontend.

---

### Usability

1. The system should be easy to use for volunteers.
2. Event search and filtering should be clear.
3. Success and error messages should be shown clearly.
4. react-toastify may be used for notifications.
5. The UI should be consistent across all modules.
6. The website should focus on desktop web first.

---

### Performance

1. Event list should support pagination or a scalable loading strategy.
2. Search and filter should avoid loading unnecessary data.
3. Dashboard and statistics should avoid expensive operations when possible.
4. Reports should be generated in a controlled way.

---

### Maintainability

1. Frontend and backend code should be separated clearly.
2. Shared constants, validation rules, or types may be placed in the shared folder if needed.
3. Each module should have clear ownership.
4. Code should follow consistent naming conventions.
5. Database and API changes must be reviewed before implementation.
6. AI-generated code must be reviewed by team members.

---

## 14. Delivery Scope Clarification

The current project has many modules. To avoid overloading the team, the MVP scope should be clarified.

Suggested MVP includes:

* Authentication
* Profile Management
* Event List and Event Detail
* Search and Filter Event
* Apply Event
* View Applied Events
* Staff Event Management
* Application Approval
* Attendance Management
* Basic Category Management
* Basic Skill Management
* Basic Organization Management
* Basic Dashboard
* Basic Certificate Record

Suggested optional or later-phase modules:

* Real VNPay/MoMo integration
* Advanced reporting
* Advanced dashboard analytics
* Real certificate PDF generation
* Automated reminder email
* Complex donation management
* Advanced notification system

Final MVP scope must be confirmed by the team before database and API planning.

---

## 15. Open Questions

The team must clarify the following questions before database design, API contracts, and implementation.

### Project Scope Questions

1. How will Donation and Payment Gateway be implemented in each delivery stage: real, sandbox, mocked, or documented only?
2. Will VNPay/MoMo be integrated for real, sandbox only, or mocked?
3. Is Email Service required in the MVP or later phase?
4. Is Certificate generation required as a real downloadable file or only a record?

---

### Role and Permission Questions

1. Can a user have multiple roles?
2. Can Staff also be a Volunteer?
3. Can Manager also perform Staff actions?
4. Can Admin perform all Manager and Staff actions?
5. Who can create staff accounts?
6. Who can manage organizations?

---

### Event Questions

1. What statuses can an event have?
2. Can staff delete events permanently, or should events be archived?
3. Can volunteers apply to full events?
4. Does each event have a maximum number of volunteers?
5. Can events require specific skills?
6. Can an event belong to multiple categories?

---

### Application Questions

1. What statuses can an application have?
2. Can volunteers cancel pending applications?
3. Can volunteers cancel approved applications?
4. Can staff change an approved application back to rejected?
5. Should application approval trigger an email?

---

### Attendance Questions

1. Is attendance checked manually by staff?
2. Is QR code attendance required?
3. Can volunteers self check-in?
4. Can attendance be edited after the event ends?
5. Does attendance affect certificate eligibility?

---

### Feedback Questions

1. Can only attended volunteers submit feedback?
2. Can volunteers submit more than one feedback per event?
3. Can staff reply to feedback?
4. Can feedback be anonymous?

---

### Certificate Questions

1. Is certificate generated as PDF?
2. Does certificate require a template?
3. Who can generate certificates?
4. Can certificates be regenerated?
5. Can volunteers download certificates anytime?

---

### Organization Questions

1. Does each event belong to one organization?
2. Can one organization have many staff members?
3. Can one staff member manage events for multiple organizations?
4. Who approves organizations?

---

### Technical Planning Questions

1. What frontend route structure should be used?
2. What backend architecture should be used?
3. Should backend use ExpressJS?
4. Should the database use Prisma or raw SQL?
5. What API response format should be standardized?
6. What naming convention should be used for files and folders?
7. What validation strategy should be used for request bodies?
8. What error handling format should be used?

---

## 16. Specification Workflow Rule

This project must follow a Spec-Driven Development workflow.

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

The team must not skip directly to database or code implementation without reviewing the project specification and plan.

---

## 17. Notes for AI Agents

When using Codex or any AI agent in this repository:

1. Do not generate implementation code from this project overview alone.
2. Do not create database schema from this project overview alone.
3. Do not create API contracts from this project overview alone.
4. Use this file only as high-level project context.
5. Ask clarification questions when business rules are unclear.
6. Follow the project constitution once it is created.
7. Follow project-level spec, plan, and tasks before implementation.
8. Keep frontend, backend, and shared concerns separated.
9. Avoid inventing unsupported features that are not listed in the project overview.
10. Preserve the team assignment structure unless the team changes it.

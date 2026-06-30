# API_CONTRACTS.md - VMS API Documentation

**Version**: 1.0  
**Last Updated**: 2026-06-28  
**Base URL**: `http://localhost:5000/api/v1`

## Table of Contents

1. [Member 1 - Authentication + Profile + Email](#member-1---cuonglh)
2. [Member 2 - Volunteer Event Features](#member-2---namld)
3. [Member 3 - Event & Application Management (Staff)](#member-3---tientd)
4. [Member 4 - Admin & Manager Tools](#member-4---anhnd)
5. [Member 5 - Organization + Notification + Dashboard + Payment](#member-5---ducnm)
6. [Standard Response Format](#standard-response-format)
7. [Authentication](#authentication)
8. [Error Codes](#error-codes)

---

## Standard Response Format

All API endpoints return responses in the following format:

```json
{
  "success": boolean,
  "data": any,      // Present when success = true
  "error": string   // Present when success = false
}
```

### Success Response Example

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe"
  }
}
```

### Error Response Example

```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

## Authentication

- **Method**: JWT stored in HttpOnly cookies
- **Cookie Names**:
  - `vms_access_token` (expires: 15 minutes)
  - `vms_refresh_token` (expires: 7 days)
- **Frontend Setup**: All requests must include `credentials: 'include'`
- **Protected Routes**: Require `authenticate` middleware
- **Role-Based Access**: `VOLUNTEER`, `STAFF`, `MANAGER`, `ADMIN`

---

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | BAD_REQUEST | Invalid input or validation failure |
| 401 | UNAUTHORIZED | Missing or invalid authentication |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Duplicate resource or constraint violation |
| 500 | INTERNAL_ERROR | Server error |

---

## Member 1 - CuongLH

**Module**: Authentication + Profile + Email  
**Use Cases**: UC01-07, UC18-21, UC62-66, UC67 (extended)

### Authentication APIs

### UC01: Register Account

#### POST /auth/register

Create a new volunteer account.

**Auth Required**: No  
**Role**: Public

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "phone_number": "0901234567",
  "date_of_birth": "1995-05-15",
  "gender": "MALE"
}
```

**Validation Rules**:

- `email`: Valid email format, unique, max 255 chars
- `password`: Min 8 chars, must contain uppercase, lowercase, number, special char
- `full_name`: Required, max 255 chars
- `phone_number`: Optional, valid Vietnamese phone format (10-11 digits)
- `date_of_birth`: Optional, ISO 8601 date, must be 16+ years old
- `gender`: Optional, enum ["MALE", "FEMALE", "OTHER"]

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "VOLUNTEER",
    "is_active": true,
    "is_email_verified": false,
    "created_at": "2026-06-28T10:00:00Z"
  }
}
```

**Error Responses**:

- `400`: Validation failure (invalid email, weak password)
- `409`: Email already exists

---

### UC02: Login

#### POST /auth/login

Authenticate user and return JWT tokens in HttpOnly cookies.

**Auth Required**: No  
**Role**: Public

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "VOLUNTEER",
      "avatar_url": null
    }
  }
}
```

**Cookies Set**:

- `vms_access_token`: JWT (HttpOnly, Secure, SameSite=Strict, expires 15m)
- `vms_refresh_token`: JWT (HttpOnly, Secure, SameSite=Strict, expires 7d)

**Error Responses**:

- `400`: Missing email or password
- `401`: Invalid credentials
- `403`: Account is inactive or not verified

---

### UC03: Logout

#### POST /auth/logout

Clear authentication cookies.

**Auth Required**: Yes  
**Role**: All authenticated users

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

**Cookies Cleared**:

- `vms_access_token`
- `vms_refresh_token`

---

### UC04: Refresh Token

#### POST /auth/refresh

Refresh access token using refresh token.

**Auth Required**: Refresh token in cookie  
**Role**: All authenticated users

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "message": "Token refreshed successfully"
  }
}
```

**Cookies Updated**:

- `vms_access_token`: New JWT (expires 15m)

**Error Responses**:

- `401`: Invalid or expired refresh token

---

### UC05: Request Password Reset

#### POST /auth/password/reset-request

Request password reset email with OTP.

**Auth Required**: No  
**Role**: Public

**Request Body**:

```json
{
  "email": "user@example.com"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent"
  }
}
```

**Error Responses**:

- `404`: Email not found
- `429`: Too many requests (rate limit: 1 request per 5 minutes)

---

### UC06: Verify Reset OTP

#### POST /auth/password/verify-otp

Verify OTP for password reset.

**Auth Required**: No  
**Role**: Public

**Request Body**:

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "reset_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses**:

- `400`: Invalid or expired OTP
- `404`: Email not found

---

### UC07: Reset Password

#### POST /auth/password/reset

Reset password using reset token.

**Auth Required**: No (requires reset_token from verify-otp)  
**Role**: Public

**Request Body**:

```json
{
  "reset_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "new_password": "NewSecurePass123!"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}
```

**Error Responses**:

- `400`: Invalid reset token or weak password
- `401`: Expired reset token

---

### UC18: Get User Profile

#### GET /profile

Get current authenticated user's profile.

**Auth Required**: Yes  
**Role**: All authenticated users

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone_number": "0901234567",
    "date_of_birth": "1995-05-15",
    "gender": "MALE",
    "avatar_url": "https://cloudinary.com/avatar.jpg",
    "address": "123 Main St, District 1, Ho Chi Minh City",
    "role": "VOLUNTEER",
    "is_active": true,
    "is_email_verified": true,
    "created_at": "2026-01-01T10:00:00Z",
    "updated_at": "2026-06-28T10:00:00Z"
  }
}
```

**Error Responses**:

- `401`: Unauthorized

---

### UC19: Update User Profile

#### PUT /profile

Update current user's profile.

**Auth Required**: Yes  
**Role**: All authenticated users

**Request Body**:

```json
{
  "full_name": "John Updated Doe",
  "phone_number": "0912345678",
  "date_of_birth": "1995-05-15",
  "gender": "MALE",
  "address": "456 New St, District 2, Ho Chi Minh City",
  "avatar_url": "https://cloudinary.com/new-avatar.jpg"
}
```

**Validation Rules**:

- `full_name`: Max 255 chars
- `phone_number`: Valid Vietnamese phone format
- `date_of_birth`: ISO 8601 date, must be 16+ years old
- `gender`: Enum ["MALE", "FEMALE", "OTHER"]
- `address`: Max 500 chars
- `avatar_url`: Valid URL format

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Updated Doe",
    "phone_number": "0912345678",
    "avatar_url": "https://cloudinary.com/new-avatar.jpg",
    "updated_at": "2026-06-28T11:00:00Z"
  }
}
```

**Error Responses**:

- `400`: Validation failure
- `401`: Unauthorized

---

### UC20: Change Password

#### POST /profile/change-password

Change password for authenticated user.

**Auth Required**: Yes  
**Role**: All authenticated users

**Request Body**:

```json
{
  "current_password": "OldPass123!",
  "new_password": "NewSecurePass123!"
}
```

**Validation Rules**:

- `current_password`: Required
- `new_password`: Min 8 chars, must contain uppercase, lowercase, number, special char
- `new_password` must be different from `current_password`

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

**Error Responses**:

- `400`: Validation failure or same password
- `401`: Current password incorrect

---

### UC21: View Volunteer History

#### GET /profile/history

Get volunteer participation history (approved applications with attendance).

**Auth Required**: Yes  
**Role**: VOLUNTEER

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `displayStatus`: Filter by derived display status ["COMPLETED", "ONGOING"]

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "application_id": 10,
        "event_id": 5,
        "event_title": "Clean Beach Campaign",
        "event_date": "2026-06-15",
        "status": "COMPLETED",
        "hours_contributed": 4,
        "has_certificate": true,
        "certificate_url": "https://cloudinary.com/cert.pdf"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 3,
      "total_items": 25,
      "items_per_page": 10
    },
    "summary": {
      "total_events_attended": 25,
      "total_hours_contributed": 100
    }
  }
}
```

**Error Responses**:

- `401`: Unauthorized
- `403`: Forbidden (not a VOLUNTEER)

---

### UC62: Verify Email (Email Service)

**Service**: EmailService (Member 1)

Email notification sent when user requests email verification.

**Trigger**: POST /auth/email/verify-request

**Email Template**:
- **Subject**: "Verify Your VMS Account"
- **To**: User's email
- **Content**: Verification link with token (expires in 24 hours)

**Implementation**: `EmailService.sendVerificationEmail(userEmail, userName, verificationToken)`

---

### UC63: Forgot Password Email (Email Service)

**Service**: EmailService (Member 1)

Email notification sent when user requests password reset.

**Trigger**: POST /auth/forgot-password

**Email Template**:
- **Subject**: "Reset Your VMS Password"
- **To**: User's email
- **Content**: Password reset link with token (expires in 1 hour)

**Implementation**: `EmailService.sendPasswordResetEmail(userEmail, userName, resetToken)`

---

### UC64: Event Approval Email (Email Service)

**Service**: EmailService (Member 1)

Email notification sent when application is approved or rejected.

**Trigger**: Application status change (Member 3: ApplicationService)

**Email Templates**:

1. **Approved**:
   - **Subject**: "Application Approved - [Event Name]"
   - **Content**: Event details, attendance instructions

2. **Rejected**:
   - **Subject**: "Application Status - [Event Name]"
   - **Content**: Rejection reason (optional), encourage to apply for other events

**Implementation**: 
- `EmailService.sendApplicationApproved(userEmail, eventName, eventDate)`
- `EmailService.sendApplicationRejected(userEmail, eventName, reason)`

---

### UC65: Event Reminder Email (Email Service)

**Service**: EmailService (Member 1) + NotificationService (Member 5)

Email notification sent before event starts (e.g., 24 hours before).

**Trigger**: Scheduled job (cron) or manual trigger

**Email Template**:
- **Subject**: "Reminder: [Event Name] Tomorrow"
- **To**: All approved volunteers
- **Content**: Event details, location, check-in instructions

**Implementation**: `EmailService.sendEventReminder(userEmail, eventName, eventDate, location)`

---

### UC66: Certificate Email (Email Service)

**Service**: EmailService (Member 1)

Email notification sent when certificate is generated.

**Trigger**: Certificate generation (Member 3: CertificateService)

**Email Template**:
- **Subject**: "Your VMS Certificate - [Event Name]"
- **To**: Volunteer's email
- **Content**: Certificate download link, event details, hours contributed

**Implementation**: `EmailService.sendCertificateReady(userEmail, eventName, certificateUrl)`

---

### Additional Email Service Methods

#### Request Email Verification

#### POST /auth/email/verify-request

Request email verification link (resend).

**Auth Required**: Yes  
**Role**: All authenticated users

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "message": "Verification email sent"
  }
}
```

**Error Responses**:

- `400`: Email already verified
- `429`: Too many requests (rate limit: 1 per 5 minutes)

---

#### Verify Email Token

#### POST /auth/email/verify

Verify email using token from email.

**Auth Required**: No  
**Role**: Public

**Request Body**:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully"
  }
}
```

**Error Responses**:

- `400`: Invalid or expired token
- `404`: User not found

---

### UC20: Manage Volunteer Skills

#### GET /profile/skills

Get list of skills for current volunteer.

**Auth Required**: Yes  
**Role**: VOLUNTEER

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "skill_id": 5,
      "skill_name": "Teaching",
      "proficiency_level": "INTERMEDIATE",
      "years_of_experience": 2,
      "created_at": "2026-01-01T10:00:00Z"
    }
  ]
}
```

---

#### POST /profile/skills

Add skill to current volunteer profile.

**Auth Required**: Yes  
**Role**: VOLUNTEER

**Request Body**:

```json
{
  "skill_id": 5,
  "proficiency_level": "INTERMEDIATE",
  "years_of_experience": 2
}
```

**Validation Rules**:

- `skill_id`: Must exist in Skills table
- `proficiency_level`: Enum ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]
- `years_of_experience`: Min 0, max 50

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "id": 1,
    "skill_id": 5,
    "proficiency_level": "INTERMEDIATE",
    "years_of_experience": 2
  }
}
```

**Error Responses**:

- `400`: Validation failure
- `404`: Skill not found
- `409`: Skill already added

---

#### DELETE /profile/skills/:skill_id

Remove skill from current volunteer profile.

**Auth Required**: Yes  
**Role**: VOLUNTEER

**Path Parameters**:

- `skill_id`: ID of the skill to remove

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "message": "Skill removed successfully"
  }
}
```

**Error Responses**:

- `404`: Skill not found in volunteer profile

---

### UC67: Delete Account (Extended Feature)

#### DELETE /profile

Soft delete user account (set is_active = false).

**Auth Required**: Yes  
**Role**: All authenticated users

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "message": "Account deleted successfully"
  }
}
```

**Error Responses**:

- `401`: Unauthorized
- `409`: Cannot delete account with pending applications

---

      "page": 1,
      "limit": 10,
      "total_items": 25,
      "total_pages": 3
    }
  }
}
```

---

## Member 2 - NamLD

**Module**: Volunteer Event Features  
**Use Cases**: UC08-14, UC48, UC51-52

### Member 2 Canonical Rules

- All Member 2 paths below are relative to Base URL `http://localhost:5000/api/v1`. Therefore `GET /events` means runtime endpoint `GET /api/v1/events`.
- All paths below are canonical for NamLD planning. Older aliases such as `GET /events/search`, `GET /events/category/:category_id`, `POST /events/:id/apply`, `GET /applications/my`, `DELETE /applications/:id`, and `GET /certificates/my/:event_id` are deprecated and MUST NOT be used for new plan/tasks.
- Canonical Event status follows `DATABASE.md`: `DRAFT`, `PUBLISHED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
- `displayStatus` is a derived response field for UI display. It is computed from `status`, `startDate`, and `endDate`; it is NOT a database enum.
- Public/discoverable events for UC08-UC11 are defined as `status = PUBLISHED AND isActive = true`. Public Event List MUST NOT return `DRAFT`, `COMPLETED`, `CANCELLED`, or soft-deleted events.
- Archived events in MVP are represented by `isActive = false`. No separate `ARCHIVED` enum is introduced.

### UC08: View Event List
### UC10: Search Event
### UC11: Filter Event

#### GET /events

Get paginated public event summaries. This single endpoint supports the Event List screen, keyword search, and filters.

**Auth Required**: No  
**Role**: Public

**Query Parameters**:

- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 10, max: 50)
- `keyword`: Search keyword for UC10. Search title, short description/description, location, organization name, category name, and skill name when event-skill is supported.
- `categoryId`: Filter by category ID for UC11
- `skillId`: Filter by required skill ID for UC11
- `organizationId`: Filter by organization ID for UC11
- `location`: Filter by location (partial match) for UC11
- `startDate`: Filter events starting on or after this date (ISO 8601) for UC11
- `endDate`: Filter events ending on or before this date (ISO 8601) for UC11
- `availability`: Filter by slot availability. Allowed values: `AVAILABLE`, `FULL`

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "Clean Beach Campaign",
        "shortDescription": "Help clean up local beaches",
        "imageUrl": "https://cloudinary.com/event.jpg",
        "organization": {
          "id": 3,
          "name": "Green Earth"
        },
        "category": {
          "id": 2,
          "name": "Environment"
        },
        "skills": [
          {
            "id": 5,
            "name": "Physical fitness"
          }
        ],
        "startDate": "2026-07-01T08:00:00Z",
        "endDate": "2026-07-01T12:00:00Z",
        "location": "Vung Tau Beach",
        "maxCapacity": 50,
        "approvedParticipants": 23,
        "remainingSlots": 27,
        "status": "PUBLISHED",
        "displayStatus": "UPCOMING"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalItems": 45,
      "totalPages": 5
    }
  }
}
```

**Error Responses**:

- `422`: Invalid query parameter

---

### UC09: View Event Detail

#### GET /events/:id

Get public details for a specific event. This endpoint does not create an application; applying belongs to UC12.

**Auth Required**: No  
**Role**: Public

**Path Parameters**:

- `id`: Event ID

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Clean Beach Campaign",
    "description": "Join us in cleaning Vung Tau beach. Bring gloves and bags.",
    "imageUrl": "https://cloudinary.com/event.jpg",
    "organization": {
      "id": 3,
      "name": "Green Earth",
      "email": "info@greenearth.org",
      "phone": "0901234567"
    },
    "category": {
      "id": 2,
      "name": "Environment"
    },
    "skills": [
      {
        "id": 5,
        "name": "Physical fitness"
      }
    ],
    "startDate": "2026-07-01T08:00:00Z",
    "endDate": "2026-07-01T12:00:00Z",
    "location": "Vung Tau Beach, Ba Ria-Vung Tau",
    "maxCapacity": 50,
    "approvedParticipants": 23,
    "remainingSlots": 27,
    "applicationDeadline": "2026-06-30T23:59:59Z",
    "status": "PUBLISHED",
    "displayStatus": "UPCOMING",
    "canApply": true,
    "applyDisabledReason": null
  }
}
```

**Error Responses**:

- `404`: Event not found or not public/discoverable

---

### UC12: Apply Event

#### POST /events/:eventId/applications

Submit an application to participate in an event.

**Auth Required**: Yes  
**Role**: VOLUNTEER

**Path Parameters**:

- `eventId`: Event ID

**Request Body**:

```json
{
  "message": "I want to join and support this event."
}
```

**Validation Rules**:

- `message`: Optional, max 1000 chars. Maps to `applications.message` in `DATABASE.md`.

**Success Response** (201):

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

**Error Responses**:

- `401`: Unauthenticated
- `403`: Authenticated user is not a Volunteer
- `404`: Event not found
- `409`: Already applied
- `409`: Event full
- `409`: Deadline passed
- `409`: Event not open for application
- `422`: Validation error

---

### UC13: View Applied Events

#### GET /me/applications

Get current Volunteer's own event applications.

**Auth Required**: Yes  
**Role**: VOLUNTEER  
**Ownership**: Only the current Volunteer owner can view these applications.

**Query Parameters**:

- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 10, max: 50)
- `status`: Filter by application status. Allowed values: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "applicationId": 42,
        "status": "APPROVED",
        "submittedAt": "2026-06-28T10:00:00Z",
        "event": {
          "id": 1,
          "title": "Clean Beach Campaign",
          "startDate": "2026-07-01T08:00:00Z",
          "endDate": "2026-07-01T12:00:00Z",
          "location": "Vung Tau Beach",
          "status": "PUBLISHED",
          "displayStatus": "UPCOMING"
        },
        "cancelable": false,
        "decisionReason": null,
        "reviewedAt": "2026-06-29T14:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalItems": 8,
      "totalPages": 1
    }
  }
}
```

**Error Responses**:

- `401`: Unauthenticated
- `403`: Authenticated user is not a Volunteer
- `422`: Invalid query parameter

---

### UC14: Cancel Application

#### PATCH /applications/:applicationId/cancel

Cancel an own pending application. Cancel is a state transition, not a delete operation.

**Auth Required**: Yes  
**Role**: VOLUNTEER  
**Ownership**: Only the application owner can cancel.

**Path Parameters**:

- `applicationId`: Application ID

**Request Body**:

```json
{
  "reason": "Schedule conflict"
}
```

**Validation Rules**:

- `reason`: Optional, max 500 chars

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "applicationId": 42,
    "previousStatus": "PENDING",
    "status": "CANCELLED",
    "cancelledAt": "2026-06-29T09:00:00Z",
    "reason": "Schedule conflict"
  }
}
```

**Business Rules**:

- Only `PENDING` applications can be cancelled by Volunteer.
- `APPROVED`, `REJECTED`, and `CANCELLED` applications cannot be cancelled by Volunteer.
- When `application_status_history` exists, cancellation SHOULD create a status history record with `old_status = PENDING`, `new_status = CANCELLED`, `changed_by = currentUser.id`, and optional `reason`.

**Error Responses**:

- `401`: Unauthenticated
- `403`: Authenticated user is not a Volunteer or not the application owner
- `404`: Application not found
- `409`: Application is not `PENDING`
- `422`: Invalid reason

---

### UC48: Submit Feedback

#### POST /events/:eventId/feedback

Submit feedback after successful attendance.

**Auth Required**: Yes  
**Role**: VOLUNTEER

**Path Parameters**:

- `eventId`: Event ID

**Request Body**:

```json
{
  "comment": "Great experience! Well organized and meaningful work.",
  "rating": 5
}
```

**Validation Rules**:

- `comment`: Required, min 10 chars, max 2000 chars. Maps to `feedbacks.comment`.
- `rating`: Optional, integer 1-5 when provided. Maps to nullable `feedbacks.rating`.

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "feedbackId": 15,
    "eventId": 1,
    "rating": 5,
    "comment": "Great experience! Well organized and meaningful work.",
    "status": "SUBMITTED",
    "createdAt": "2026-07-02T10:00:00Z"
  }
}
```

**Business Rules**:

- Volunteer can submit feedback only after successful attendance.
- Each Volunteer can submit only one feedback per event.

**Error Responses**:

- `401`: Unauthenticated
- `403`: Authenticated user is not a Volunteer
- `403`: Not eligible to submit feedback
- `404`: Event, application, or attendance not found
- `409`: Feedback already submitted
- `409`: No successful attendance
- `422`: Validation error

---

### UC51: View Certificates

#### GET /me/certificates

Get current Volunteer's certificates.

**Auth Required**: Yes  
**Role**: VOLUNTEER  
**Ownership**: Only current Volunteer certificates are returned.

**Query Parameters**:

- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 10, max: 50)
- `status`: Filter by certificate status. Allowed values: `GENERATING`, `AVAILABLE`, `REVOKED`, `UNAVAILABLE`

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "certificateId": 25,
        "event": {
          "id": 1,
          "title": "Clean Beach Campaign",
          "startDate": "2026-07-01T08:00:00Z",
          "location": "Vung Tau Beach"
        },
        "issuedAt": "2026-07-05T10:00:00Z",
        "issuedBy": {
          "id": 10,
          "fullName": "Staff John"
        },
        "certificateCode": "VMS-2026-00025",
        "status": "AVAILABLE",
        "downloadAvailable": true
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalItems": 3,
      "totalPages": 1
    }
  }
}
```

**Error Responses**:

- `401`: Unauthenticated
- `403`: Authenticated user is not a Volunteer
- `422`: Invalid query parameter

#### GET /certificates/:certificateId

Get certificate detail for the current Volunteer owner.

**Auth Required**: Yes  
**Role**: VOLUNTEER  
**Ownership**: Volunteer can only view own certificate.

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "certificateId": 25,
    "event": {
      "id": 1,
      "title": "Clean Beach Campaign",
      "startDate": "2026-07-01T08:00:00Z",
      "location": "Vung Tau Beach"
    },
    "issuedAt": "2026-07-05T10:00:00Z",
    "issuedBy": {
      "id": 10,
      "fullName": "Staff John"
    },
    "certificateCode": "VMS-2026-00025",
    "status": "AVAILABLE",
    "downloadAvailable": true
  }
}
```

**Error Responses**:

- `401`: Unauthenticated
- `403`: Authenticated user is not a Volunteer or not the certificate owner
- `404`: Certificate not found

---

### UC52: Download Certificate

#### GET /certificates/:certificateId/download

Download an available certificate PDF file.

**Auth Required**: Yes  
**Role**: VOLUNTEER  
**Ownership**: Volunteer can only download own certificate.

**Path Parameters**:

- `certificateId`: Certificate ID

**Business Rules**:

- Only `AVAILABLE` certificates can be downloaded.
- `GENERATING`, `REVOKED`, and `UNAVAILABLE` certificates cannot be downloaded.
- Backend MUST enforce authentication, role, ownership, status, and file availability before returning the file.

**Success Response** (200):

Option A - File stream is the canonical MVP contract:

- `Content-Type`: `application/pdf`
- `Content-Disposition`: `attachment; filename="certificate-{certificateId}.pdf"`

**Error Responses**:

- `401`: Unauthenticated
- `403`: Authenticated user is not a Volunteer or not the certificate owner
- `404`: Certificate not found
- `409`: Certificate not available
- `410`: File expired when storage uses expiring files
- `500`: File storage error

---

## Member 3 - TienTD

**Module**: Event & Application Management (Staff)  
**Use Cases**: UC15-17, UC22-25, UC45-47, UC49-50, UC53

### UC15: Create Event (Staff)

#### POST /staff/events

Create a new volunteer event (Staff only).

**Auth Required**: Yes  
**Role**: STAFF

**Request Body**:

```json
{
  "title": "Clean Beach Campaign",
  "description": "Join us in cleaning Vung Tau beach. Bring gloves and bags.",
  "category_id": 2,
  "organization_id": 3,
  "location": "Vung Tau Beach, Ba Ria-Vung Tau",
  "start_date": "2026-07-01T08:00:00Z",
  "end_date": "2026-07-01T12:00:00Z",
    "maxCapacity": 50,
  "required_skills": [5, 8],
  "image_url": "https://cloudinary.com/event.jpg",
  "images": ["https://cloudinary.com/img1.jpg", "https://cloudinary.com/img2.jpg"]
}
```

**Validation Rules**:

- `title`: Required, max 255 chars
- `description`: Required, min 50 chars, max 5000 chars
- `category_id`: Required, must exist
- `organization_id`: Required, must exist
- `location`: Required, max 500 chars
- `start_date`: Required, must be future date
- `end_date`: Required, must be after start_date
- `maxCapacity`: Required, min 1, max 1000; maps to `events.max_capacity`
- `required_skills`: Optional array of skill IDs
- `image_url`: Optional, valid URL
- `images`: Optional array of URLs, max 10 images

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Clean Beach Campaign",
    "status": "DRAFT",
    "created_by": 10,
    "created_at": "2026-06-28T10:00:00Z"
  }
}
```

**Error Responses**:

- `400`: Validation failure
- `404`: Category or organization not found

---

### UC16: Update Event (Staff)

#### PUT /staff/events/:id

Update existing event (only if created by current staff and not yet started).

**Auth Required**: Yes  
**Role**: STAFF (owner only)

**Path Parameters**:

- `id`: Event ID

**Request Body**: Same as Create Event (all fields optional)

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Updated Clean Beach Campaign",
    "updated_at": "2026-06-28T11:00:00Z"
  }
}
```

**Error Responses**:

- `400`: Event already started or approved
- `403`: Not the event creator
- `404`: Event not found

---

### UC17: Delete Event (Staff)

#### DELETE /staff/events/:id

Soft delete event (set is_active = false).

**Auth Required**: Yes  
**Role**: STAFF (owner only)

**Path Parameters**:

- `id`: Event ID

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "message": "Event deleted successfully"
  }
}
```

**Error Responses**:

- `400`: Cannot delete event with approved applications
- `403`: Not the event creator
- `404`: Event not found

---

### UC22: View Event Applications (Staff)

#### GET /staff/events/:id/applications

View all applications for a specific event.

**Auth Required**: Yes  
**Role**: STAFF (event owner only)

**Path Parameters**:

- `id`: Event ID

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `status`: Filter by status ["PENDING", "APPROVED", "REJECTED", "CANCELLED"]

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "event": {
      "id": 1,
      "title": "Clean Beach Campaign",
      "maxCapacity": 50,
      "approvedParticipants": 23
    },
    "items": [
      {
        "id": 42,
        "volunteer": {
          "id": 5,
          "full_name": "John Doe",
          "email": "john@example.com",
          "phone_number": "0901234567",
          "skills": [
            {
              "id": 5,
              "name": "Physical fitness"
            }
          ]
        },
        "status": "PENDING",
        "message": "I am passionate about environmental conservation.",
        "applied_at": "2026-06-28T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total_items": 35,
      "total_pages": 4
    }
  }
}
```

**Error Responses**:

- `403`: Not the event creator
- `404`: Event not found

---

### UC23: Approve Application (Staff)

#### POST /staff/applications/:id/approve

Approve volunteer application for event.

**Auth Required**: Yes  
**Role**: STAFF (event owner only)

**Path Parameters**:

- `id`: Application ID

**Request Body**:

```json
{
  "notes": "Approved based on previous experience."
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "application_id": 42,
    "status": "APPROVED",
    "reviewed_at": "2026-06-29T14:00:00Z",
    "reviewed_by": 10
  }
}
```

**Error Responses**:

- `400`: Application already reviewed or event is full
- `403`: Not the event creator
- `404`: Application not found

---

### UC24: Reject Application (Staff)

#### POST /staff/applications/:id/reject

Reject volunteer application for event.

**Auth Required**: Yes  
**Role**: STAFF (event owner only)

**Path Parameters**:

- `id`: Application ID

**Request Body**:

```json
{
  "reason": "Application submitted too late, event is already full."
}
```

**Validation Rules**:

- `reason`: Required, min 10 chars, max 500 chars

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "application_id": 42,
    "status": "REJECTED",
    "reviewed_at": "2026-06-29T14:00:00Z",
    "reviewed_by": 10
  }
}
```

**Error Responses**:

- `400`: Application already reviewed
- `403`: Not the event creator
- `404`: Application not found

---

### UC25: Check Attendance (Staff)

#### POST /staff/events/:event_id/attendance

Mark volunteer attendance for event (check-in/check-out).

**Auth Required**: Yes  
**Role**: STAFF (event owner only)

**Path Parameters**:

- `event_id`: Event ID

**Request Body**:

```json
{
  "volunteer_id": 5,
  "check_in_time": "2026-07-01T08:00:00Z",
  "check_out_time": "2026-07-01T12:00:00Z",
  "notes": "Volunteer arrived on time and worked full shift."
}
```

**Validation Rules**:

- `volunteer_id`: Required, must have approved application
- `check_in_time`: Required, must be during event timeframe
- `check_out_time`: Optional, must be after check_in_time
- `notes`: Optional, max 500 chars

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "attendance_id": 100,
    "volunteer_id": 5,
    "event_id": 1,
    "check_in_time": "2026-07-01T08:00:00Z",
    "check_out_time": "2026-07-01T12:00:00Z",
    "hours_contributed": 4
  }
}
```

**Error Responses**:

- `400`: Volunteer not approved for this event
- `403`: Not the event creator
- `404`: Event or volunteer not found
- `409`: Attendance already recorded

---

### UC45: View My Created Events (Staff)

#### GET /staff/events/my

Get list of events created by current staff member.

**Auth Required**: Yes  
**Role**: STAFF

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `status`: Filter by event status ["DRAFT", "PUBLISHED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "Clean Beach Campaign",
        "category": {
          "id": 2,
          "name": "Environment"
        },
        "start_date": "2026-07-01T08:00:00Z",
        "maxCapacity": 50,
        "approvedParticipants": 23,
        "status": "PUBLISHED",
        "displayStatus": "UPCOMING",
        "created_at": "2026-06-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total_items": 8,
      "total_pages": 1
    }
  }
}
```

---

### UC46: View Event Statistics (Staff)

#### GET /staff/events/:id/statistics

Get statistics for a specific event.

**Auth Required**: Yes  
**Role**: STAFF (event owner only)

**Path Parameters**:

- `id`: Event ID

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "event_id": 1,
    "title": "Clean Beach Campaign",
    "applications": {
      "total": 45,
      "pending": 10,
      "approved": 30,
      "rejected": 5
    },
    "attendance": {
      "checked_in": 28,
      "checked_out": 25,
      "no_show": 2
    },
    "feedback": {
      "total_feedbacks": 20,
      "average_rating": 4.5,
      "rating_distribution": {
        "5": 12,
        "4": 6,
        "3": 2,
        "2": 0,
        "1": 0
      }
    },
    "total_volunteer_hours": 100
  }
}
```

**Error Responses**:

- `403`: Not the event creator
- `404`: Event not found

---

### UC47: Export Event Report (Staff)

#### GET /staff/events/:id/export

Export event report as CSV file.

**Auth Required**: Yes  
**Role**: STAFF (event owner only)

**Path Parameters**:

- `id`: Event ID

**Query Parameters**:

- `format`: Export format ["csv", "pdf"] (default: "csv")

**Success Response** (200):

Returns CSV/PDF file with headers:

- `Content-Type`: `text/csv` or `application/pdf`
- `Content-Disposition`: `attachment; filename="event-{id}-report.csv"`

**Error Responses**:

- `403`: Not the event creator
- `404`: Event not found

---

### UC49: View Event Feedback (Staff)

#### GET /staff/events/:id/feedback

View all feedback submitted for an event.

**Auth Required**: Yes  
**Role**: STAFF (event owner only)

**Path Parameters**:

- `id`: Event ID

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `rating`: Filter by rating (1-5)

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "event": {
      "id": 1,
      "title": "Clean Beach Campaign"
    },
    "statistics": {
      "average_rating": 4.5,
      "total_feedbacks": 20
    },
    "items": [
      {
        "id": 15,
        "volunteer": {
          "id": 5,
          "full_name": "John Doe"
        },
        "rating": 5,
        "comment": "Great experience! Well organized...",
        "created_at": "2026-07-02T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total_items": 20,
      "total_pages": 2
    }
  }
}
```

**Error Responses**:

- `403`: Not the event creator
- `404`: Event not found

---

### UC50: Reply to Feedback (Staff)

#### POST /staff/feedback/:id/reply

Reply to volunteer feedback.

**Auth Required**: Yes  
**Role**: STAFF

**Path Parameters**:

- `id`: Feedback ID

**Request Body**:

```json
{
  "reply": "Thank you for your feedback! We will add more water stations next time."
}
```

**Validation Rules**:

- `reply`: Required, min 10 chars, max 1000 chars

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "feedback_id": 15,
    "reply": "Thank you for your feedback!...",
    "replied_at": "2026-07-03T09:00:00Z"
  }
}
```

**Error Responses**:

- `404`: Feedback not found
- `409`: Reply already exists

---

### UC53: Generate Certificate (Staff)

#### POST /staff/events/:event_id/certificates/:volunteer_id

Generate certificate for volunteer who completed event.

**Auth Required**: Yes  
**Role**: STAFF (event owner only)

**Path Parameters**:

- `event_id`: Event ID
- `volunteer_id`: Volunteer ID

**Request Body**:

```json
{
  "hours_contributed": 4,
  "notes": "Excellent participation and dedication."
}
```

**Validation Rules**:

- `hours_contributed`: Required, min 1, max 24
- `notes`: Optional, max 500 chars

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "certificate_id": 25,
    "certificate_url": "https://cloudinary.com/certificates/cert-25.pdf",
    "issued_at": "2026-07-05T10:00:00Z"
  }
}
```

**Error Responses**:

- `400`: Volunteer did not attend or not approved
- `403`: Not the event creator
- `404`: Event or volunteer not found
- `409`: Certificate already issued

---

## Member 4 - AnhND

**Module**: Admin & Manager Tools  
**Use Cases**: UC26-36

### UC26: View All Users (Admin)

#### GET /admin/users

Get paginated list of all users with filters.

**Auth Required**: Yes  
**Role**: ADMIN, MANAGER

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `role`: Filter by role ["VOLUNTEER", "STAFF", "MANAGER", "ADMIN"]
- `is_active`: Filter by active status (boolean)
- `is_email_verified`: Filter by email verification status (boolean)
- `search`: Search in full_name, email (partial match)

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "email": "user@example.com",
        "full_name": "John Doe",
        "phone_number": "0901234567",
        "role": "VOLUNTEER",
        "is_active": true,
        "is_email_verified": true,
        "created_at": "2026-01-01T10:00:00Z",
        "last_login": "2026-06-28T09:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total_items": 150,
      "total_pages": 15
    }
  }
}
```

---

### UC27: View User Details (Admin)

#### GET /admin/users/:id

Get detailed information about a specific user.

**Auth Required**: Yes  
**Role**: ADMIN, MANAGER

**Path Parameters**:

- `id`: User ID

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone_number": "0901234567",
    "date_of_birth": "1995-05-15",
    "gender": "MALE",
    "address": "123 Main St, District 1, HCMC",
    "avatar_url": "https://cloudinary.com/avatar.jpg",
    "role": "VOLUNTEER",
    "is_active": true,
    "is_email_verified": true,
    "created_at": "2026-01-01T10:00:00Z",
    "updated_at": "2026-06-28T10:00:00Z",
    "last_login": "2026-06-28T09:00:00Z",
    "statistics": {
      "total_applications": 15,
      "approved_applications": 12,
      "events_attended": 10,
      "total_volunteer_hours": 40,
      "certificates_earned": 8
    }
  }
}
```

**Error Responses**:

- `404`: User not found

---

### UC28: Create User (Admin)

#### POST /admin/users

Create new user account (Admin can create any role).

**Auth Required**: Yes  
**Role**: ADMIN

**Request Body**:

```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "full_name": "Jane Smith",
  "phone_number": "0912345678",
  "role": "STAFF",
  "is_active": true
}
```

**Validation Rules**:

- `email`: Required, valid email, unique
- `password`: Required, min 8 chars with complexity
- `full_name`: Required, max 255 chars
- `phone_number`: Optional, valid Vietnamese phone
- `role`: Required, enum ["VOLUNTEER", "STAFF", "MANAGER", "ADMIN"]
- `is_active`: Optional, default true

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "id": 50,
    "email": "newuser@example.com",
    "full_name": "Jane Smith",
    "role": "STAFF",
    "is_active": true,
    "created_at": "2026-06-28T10:00:00Z"
  }
}
```

**Error Responses**:

- `400`: Validation failure
- `409`: Email already exists

---

### UC29: Update User (Admin)

#### PUT /admin/users/:id

Update user information (Admin can update any field including role).

**Auth Required**: Yes  
**Role**: ADMIN

**Path Parameters**:

- `id`: User ID

**Request Body**:

```json
{
  "full_name": "Jane Updated Smith",
  "phone_number": "0923456789",
  "role": "MANAGER",
  "is_active": true,
  "is_email_verified": true
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "id": 50,
    "email": "newuser@example.com",
    "full_name": "Jane Updated Smith",
    "role": "MANAGER",
    "updated_at": "2026-06-28T11:00:00Z"
  }
}
```

**Error Responses**:

- `400`: Validation failure
- `404`: User not found

---

### UC30: Delete User (Admin)

#### DELETE /admin/users/:id

Soft delete user account (set is_active = false).

**Auth Required**: Yes  
**Role**: ADMIN

**Path Parameters**:

- `id`: User ID

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "message": "User deleted successfully"
  }
}
```

**Error Responses**:

- `400`: Cannot delete user with pending applications or active events
- `403`: Cannot delete self or last admin
- `404`: User not found

---

### UC31: View All Categories (Admin)

#### GET /admin/categories

Get list of all event categories.

**Auth Required**: Yes  
**Role**: ADMIN, MANAGER, STAFF

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `is_active`: Filter by active status (boolean)

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Education",
        "description": "Educational activities and tutoring",
        "is_active": true,
        "event_count": 25,
        "created_at": "2026-01-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total_items": 12,
      "total_pages": 2
    }
  }
}
```

---

### UC32: Create Category (Admin)

#### POST /admin/categories

Create new event category.

**Auth Required**: Yes  
**Role**: ADMIN

**Request Body**:

```json
{
  "name": "Healthcare",
  "description": "Medical and healthcare volunteer activities",
  "is_active": true
}
```

**Validation Rules**:

- `name`: Required, max 100 chars, unique
- `description`: Optional, max 500 chars
- `is_active`: Optional, default true

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "id": 10,
    "name": "Healthcare",
    "description": "Medical and healthcare volunteer activities",
    "is_active": true,
    "created_at": "2026-06-28T10:00:00Z"
  }
}
```

**Error Responses**:

- `400`: Validation failure
- `409`: Category name already exists

---

### UC33: Update Category (Admin)

#### PUT /admin/categories/:id

Update category information.

**Auth Required**: Yes  
**Role**: ADMIN

**Path Parameters**:

- `id`: Category ID

**Request Body**:

```json
{
  "name": "Healthcare & Wellness",
  "description": "Medical, healthcare, and wellness activities",
  "is_active": true
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "id": 10,
    "name": "Healthcare & Wellness",
    "updated_at": "2026-06-28T11:00:00Z"
  }
}
```

**Error Responses**:

- `400`: Validation failure
- `404`: Category not found
- `409`: Category name already exists

---

### UC34: Delete Category (Admin)

#### DELETE /admin/categories/:id

Soft delete category (set is_active = false).

**Auth Required**: Yes  
**Role**: ADMIN

**Path Parameters**:

- `id`: Category ID

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "message": "Category deleted successfully"
  }
}
```

**Error Responses**:

- `400`: Cannot delete category with active events
- `404`: Category not found

---

### UC35: View All Skills (Admin)

#### GET /admin/skills

Get list of all volunteer skills.

**Auth Required**: Yes  
**Role**: ADMIN, MANAGER

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `is_active`: Filter by active status (boolean)
- `search`: Search in skill name

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Teaching",
        "description": "Ability to teach and mentor",
        "category": "Education",
        "is_active": true,
        "volunteer_count": 45,
        "created_at": "2026-01-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total_items": 30,
      "total_pages": 3
    }
  }
}
```

---

### UC36: Manage Skills (Admin)

#### POST /admin/skills

Create new skill.

**Auth Required**: Yes  
**Role**: ADMIN

**Request Body**:

```json
{
  "name": "First Aid",
  "description": "Basic first aid and emergency response skills",
  "category": "Healthcare"
}
```

**Validation Rules**:

- `name`: Required, max 100 chars, unique
- `description`: Optional, max 500 chars
- `category`: Optional, max 100 chars

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "id": 25,
    "name": "First Aid",
    "description": "Basic first aid and emergency response skills",
    "category": "Healthcare",
    "created_at": "2026-06-28T10:00:00Z"
  }
}
```

**Error Responses**:

- `400`: Validation failure
- `409`: Skill name already exists

#### PUT /admin/skills/:id

Update skill information.

**Path Parameters**:

- `id`: Skill ID

**Request Body**: Same as POST (all fields optional)

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "id": 25,
    "name": "First Aid & CPR",
    "updated_at": "2026-06-28T11:00:00Z"
  }
}
```

#### DELETE /admin/skills/:id

Soft delete skill.

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "message": "Skill deleted successfully"
  }
}
```

**Error Responses**:

- `400`: Cannot delete skill referenced by volunteers
- `404`: Skill not found

---

## Member 5 - DucNM

**Module**: Organization + Notification + Dashboard + Payment  
**Use Cases**: UC37-44, UC54-61

### UC37: View Organizations

#### GET /organizations

Get list of all organizations.

**Auth Required**: No  
**Role**: Public

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `is_active`: Filter by active status (boolean)
- `search`: Search in name, description

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Green Earth",
        "description": "Environmental protection organization",
        "logo_url": "https://cloudinary.com/logo.jpg",
        "contact_email": "info@greenearth.org",
        "contact_phone": "0901234567",
        "website": "https://greenearth.org",
        "address": "123 Main St, District 1, HCMC",
        "is_active": true,
        "event_count": 45,
        "created_at": "2025-01-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total_items": 20,
      "total_pages": 2
    }
  }
}
```

---

### UC38: View Organization Details

#### GET /organizations/:id

Get detailed information about a specific organization.

**Auth Required**: No  
**Role**: Public

**Path Parameters**:

- `id`: Organization ID

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Green Earth",
    "description": "Environmental protection organization dedicated to sustainability",
    "logo_url": "https://cloudinary.com/logo.jpg",
    "contact_email": "info@greenearth.org",
    "contact_phone": "0901234567",
    "website": "https://greenearth.org",
    "address": "123 Main St, District 1, HCMC",
    "is_active": true,
    "statistics": {
      "total_events": 45,
      "upcoming_events": 12,
      "total_volunteers": 230,
      "total_volunteer_hours": 1500
    },
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2026-06-20T10:00:00Z"
  }
}
```

**Error Responses**:

- `404`: Organization not found

---

### UC39: Create Organization (Admin)

#### POST /admin/organizations

Create new organization.

**Auth Required**: Yes  
**Role**: ADMIN

**Request Body**:

```json
{
  "name": "Care for Kids",
  "description": "Child welfare and education organization",
  "logo_url": "https://cloudinary.com/logo.jpg",
  "contact_email": "info@careforkids.org",
  "contact_phone": "0912345678",
  "website": "https://careforkids.org",
  "address": "456 Secondary St, District 3, HCMC"
}
```

**Validation Rules**:

- `name`: Required, max 255 chars, unique
- `description`: Required, min 50 chars, max 2000 chars
- `logo_url`: Optional, valid URL
- `contact_email`: Required, valid email
- `contact_phone`: Required, valid Vietnamese phone
- `website`: Optional, valid URL
- `address`: Required, max 500 chars

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "id": 25,
    "name": "Care for Kids",
    "contact_email": "info@careforkids.org",
    "is_active": true,
    "created_at": "2026-06-28T10:00:00Z"
  }
}
```

**Error Responses**:

- `400`: Validation failure
- `409`: Organization name already exists

---

### UC40: Update Organization (Admin)

#### PUT /admin/organizations/:id

Update organization information.

**Auth Required**: Yes  
**Role**: ADMIN

**Path Parameters**:

- `id`: Organization ID

**Request Body**: Same as Create (all fields optional)

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "id": 25,
    "name": "Care for Kids Foundation",
    "updated_at": "2026-06-28T11:00:00Z"
  }
}
```

**Error Responses**:

- `400`: Validation failure
- `404`: Organization not found
- `409`: Organization name already exists

---

### UC41: Delete Organization (Admin)

#### DELETE /admin/organizations/:id

Soft delete organization (set is_active = false).

**Auth Required**: Yes  
**Role**: ADMIN

**Path Parameters**:

- `id`: Organization ID

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "message": "Organization deleted successfully"
  }
}
```

**Error Responses**:

- `400`: Cannot delete organization with active events
- `404`: Organization not found

---

### UC42: Get Notifications

#### GET /notifications

Get user's notifications.

**Auth Required**: Yes  
**Role**: All authenticated users

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `is_read`: Filter by read status (boolean)
- `type`: Filter by type ["APPLICATION_APPROVED", "APPLICATION_REJECTED", "EVENT_REMINDER", "CERTIFICATE_ISSUED", "FEEDBACK_REPLY", "SYSTEM"]

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 100,
        "type": "APPLICATION_APPROVED",
        "title": "Application Approved",
        "message": "Your application for 'Clean Beach Campaign' has been approved!",
        "link": "/applications/42",
        "is_read": false,
        "created_at": "2026-06-29T14:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total_items": 25,
      "total_pages": 3
    },
    "unread_count": 5
  }
}
```

---

### UC43: Mark Notification as Read

#### PUT /notifications/:id/read

Mark notification as read.

**Auth Required**: Yes  
**Role**: All authenticated users

**Path Parameters**:

- `id`: Notification ID

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "notification_id": 100,
    "is_read": true,
    "read_at": "2026-06-28T10:00:00Z"
  }
}
```

**Error Responses**:

- `403`: Not your notification
- `404`: Notification not found

---

### UC44: Mark All Notifications as Read

#### PUT /notifications/read-all

Mark all user's notifications as read.

**Auth Required**: Yes  
**Role**: All authenticated users

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "message": "All notifications marked as read",
    "count": 5
  }
}
```

---

### UC54: Dashboard Statistics (Volunteer)

#### GET /dashboard/volunteer

Get dashboard statistics for volunteer users.

**Auth Required**: Yes  
**Role**: VOLUNTEER

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "overview": {
      "total_applications": 15,
      "approved_applications": 12,
      "pending_applications": 2,
      "rejected_applications": 1,
      "events_attended": 10,
      "total_volunteer_hours": 40,
      "certificates_earned": 8
    },
    "upcoming_events": [
      {
        "id": 1,
        "title": "Clean Beach Campaign",
        "start_date": "2026-07-01T08:00:00Z",
        "location": "Vung Tau Beach",
        "application_status": "APPROVED"
      }
    ],
    "recent_certificates": [
      {
        "certificate_id": 25,
        "event_title": "Tree Planting Day",
        "issued_at": "2026-06-20T10:00:00Z"
      }
    ],
    "leaderboard_rank": {
      "rank": 15,
      "total_hours": 40,
      "total_volunteers": 230
    }
  }
}
```

---

### UC55: Dashboard Statistics (Staff)

#### GET /dashboard/staff

Get dashboard statistics for staff users.

**Auth Required**: Yes  
**Role**: STAFF

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "overview": {
      "total_events_created": 12,
      "upcoming_events": 5,
      "ongoing_events": 2,
      "completed_events": 5,
      "pending_approval": 1,
      "total_applications": 150,
      "pending_applications": 25,
      "total_volunteers_managed": 85,
      "total_volunteer_hours_managed": 340
    },
    "recent_events": [
      {
        "id": 1,
        "title": "Clean Beach Campaign",
        "start_date": "2026-07-01T08:00:00Z",
        "status": "APPROVED",
        "current_volunteers": 23,
        "max_volunteers": 50
      }
    ],
    "pending_applications": [
      {
        "application_id": 42,
        "volunteer_name": "John Doe",
        "event_title": "Tree Planting",
        "applied_at": "2026-06-28T10:00:00Z"
      }
    ]
  }
}
```

---

### UC56: Dashboard Statistics (Admin)

#### GET /dashboard/admin

Get dashboard statistics for admin users.

**Auth Required**: Yes  
**Role**: ADMIN, MANAGER

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "overview": {
      "total_users": 250,
      "active_volunteers": 180,
      "active_staff": 25,
      "total_events": 120,
      "upcoming_events": 30,
      "total_organizations": 20,
      "total_applications": 450,
      "total_volunteer_hours": 2400
    },
    "user_growth": {
      "this_month": 15,
      "last_month": 12,
      "percentage_change": 25
    },
    "event_growth": {
      "this_month": 8,
      "last_month": 6,
      "percentage_change": 33.3
    },
    "top_volunteers": [
      {
        "user_id": 5,
        "full_name": "John Doe",
        "total_hours": 80,
        "events_attended": 20
      }
    ],
    "top_organizations": [
      {
        "organization_id": 1,
        "name": "Green Earth",
        "total_events": 45,
        "total_volunteers": 230
      }
    ]
  }
}
```

---

### UC57: Generate System Report

#### GET /admin/reports/:type

Generate various system reports.

**Auth Required**: Yes  
**Role**: ADMIN, MANAGER

**Path Parameters**:

- `type`: Report type ["users", "events", "applications", "volunteer_hours", "organizations"]

**Query Parameters**:

- `start_date`: Start date for report (ISO 8601)
- `end_date`: End date for report (ISO 8601)
- `format`: Export format ["json", "csv", "pdf"] (default: "json")
- `organization_id`: Filter by organization
- `category_id`: Filter by category

**Success Response** (200):

For `format=json`:

```json
{
  "success": true,
  "data": {
    "report_type": "volunteer_hours",
    "period": {
      "start_date": "2026-01-01",
      "end_date": "2026-06-30"
    },
    "summary": {
      "total_volunteer_hours": 2400,
      "total_events": 120,
      "total_volunteers": 180,
      "average_hours_per_volunteer": 13.3
    },
    "details": [
      {
        "month": "2026-01",
        "total_hours": 380,
        "events_count": 18,
        "volunteers_count": 95
      }
    ]
  }
}
```

For `format=csv` or `format=pdf`: Returns file with appropriate headers

**Error Responses**:

- `400`: Invalid date range or parameters

---

### UC58: View Donation List

#### GET /donations

Get list of donations.

**Auth Required**: No (public donations list) / Yes (my donations)  
**Role**: Public for list, Authenticated for personal history

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `event_id`: Filter by event ID
- `organization_id`: Filter by organization ID

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 50,
        "donor_name": "Anonymous",
        "amount": 500000,
        "currency": "VND",
        "event": {
          "id": 1,
          "title": "Clean Beach Campaign"
        },
        "organization": {
          "id": 3,
          "name": "Green Earth"
        },
        "donated_at": "2026-06-28T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total_items": 150,
      "total_pages": 15
    },
    "statistics": {
      "total_donations": 75000000,
      "total_donors": 150
    }
  }
}
```

---

### UC59: Create Donation

#### POST /donations

Create donation and initiate payment process.

**Auth Required**: Optional (can donate as guest)  
**Role**: Public

**Request Body**:

```json
{
  "amount": 500000,
  "currency": "VND",
  "donor_name": "John Doe",
  "donor_email": "john@example.com",
  "donor_phone": "0901234567",
  "event_id": 1,
  "organization_id": 3,
  "message": "Keep up the good work!",
  "is_anonymous": false
}
```

**Validation Rules**:

- `amount`: Required, min 10000 VND, max 1000000000 VND
- `currency`: Required, default "VND"
- `donor_name`: Required if not authenticated
- `donor_email`: Required if not authenticated
- `donor_phone`: Optional
- `event_id`: Optional (donate to specific event)
- `organization_id`: Optional (donate to organization)
- `message`: Optional, max 500 chars
- `is_anonymous`: Optional, default false

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "donation_id": 50,
    "payment_url": "https://payment-gateway.com/checkout?token=xyz123",
    "transaction_id": "TXN123456",
    "amount": 500000,
    "currency": "VND",
    "status": "PENDING",
    "expires_at": "2026-06-28T10:30:00Z"
  }
}
```

**Error Responses**:

- `400`: Validation failure or invalid amount

---

### UC60: Payment Callback (IPN)

#### POST /payments/callback

Handle payment gateway IPN callback (Internal API).

**Auth Required**: Payment Gateway Signature  
**Role**: System

**Request Body**: Payment gateway specific format

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "transaction_id": "TXN123456",
    "status": "SUCCESS"
  }
}
```

---

### UC61: Verify Payment Status

#### GET /donations/:id/payment-status

Check payment status for a donation.

**Auth Required**: Optional  
**Role**: Public (with donation ID and email verification)

**Path Parameters**:

- `id`: Donation ID

**Query Parameters**:

- `email`: Donor email for verification (required if not authenticated)

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "donation_id": 50,
    "transaction_id": "TXN123456",
    "amount": 500000,
    "currency": "VND",
    "payment_status": "SUCCESS",
    "payment_method": "BANK_TRANSFER",
    "paid_at": "2026-06-28T10:15:00Z",
    "receipt_url": "https://cloudinary.com/receipts/receipt-50.pdf"
  }
}
```

**Error Responses**:

- `404`: Donation not found
- `403`: Email verification failed

---

## Appendix

### Common Request Headers

```
Authorization: (via HttpOnly cookies)
Content-Type: application/json
Accept: application/json
```

### Common Response Headers

```
Content-Type: application/json
Set-Cookie: vms_access_token=...; HttpOnly; Secure; SameSite=Strict (for auth endpoints)
```

### Pagination Standard

All paginated endpoints return:

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total_items": 150,
    "total_pages": 15,
    "has_previous": false,
    "has_next": true
  }
}
```

### Date/Time Format

All dates and times use ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`

Example: `2026-06-28T10:00:00Z`

### File Upload Flow

1. Frontend requests signed upload URL from backend: `POST /upload/request`
2. Backend returns Cloudinary signed URL
3. Frontend uploads directly to Cloudinary
4. Frontend sends Cloudinary URL to backend in API request

**Example Request Signed URL**:

```json
POST /upload/request
{
  "file_type": "image",
  "purpose": "avatar"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "upload_url": "https://api.cloudinary.com/v1_1/.../upload",
    "upload_params": {
      "signature": "...",
      "timestamp": 1719565200,
      "api_key": "..."
    }
  }
}
```

---

**End of API Contracts**

For implementation details, refer to:

- `CLAUDE.md` - Project architecture and conventions
- `DATABASE.md` - Database schema and constraints
- `share_context.md` - Cross-module contracts and dependencies
- `AGENTS.md` - Development workflow and safety rules

**Last Updated**: 2026-06-28  
**Version**: 1.0  
**Total Endpoints**: 66+ APIs across 5 members
